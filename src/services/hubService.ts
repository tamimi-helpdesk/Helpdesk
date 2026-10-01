import { StorageService } from './storageService';
import { ToastService } from './toastService';

// Cross-Computer Universal Real-Time Hub Client
export class HubService {
  private static eventSource: EventSource | null = null;
  private static isConnected = false;
  private static reconnectTimer: any = null;
  private static isSyncing = false;
  private static sseFailures = 0;

  // Initialize real-time synchronization listener
  public static init() {
    if (typeof window === 'undefined') return;

    // 1. Initial State Fetch from Hub
    this.pullStateFromHub().catch(() => {});

    // 2. Connect Real-time SSE Stream
    this.connectSSE();

    // 3. Fallback Periodic Polling (Every 6 seconds to ensure instant multi-device consistency)
    setInterval(() => {
      this.pullStateFromHub().catch(() => {});
    }, 6000);

    // 4. Focus & Visibility Sync (Instantly pull when user focuses or returns to window)
    window.addEventListener('focus', () => {
      this.pullStateFromHub().catch(() => {});
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pullStateFromHub().catch(() => {});
      }
    });
  }

  private static connectSSE() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {}
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/hub/events');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.sseFailures = 0;
      };

      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'CONNECTED') {
            this.pullStateFromHub().catch(() => {});
          } else if (data.type === 'DELETE') {
            if (data.id) {
              StorageService.applyRemoteDeletion(data.id, data.entity);
              ToastService.hub('Terminal network: Record removed by another user');
            }
          } else if (data.type === 'CANCEL') {
            if (data.id) {
              StorageService.applyRemoteCancellation(data.id, data.payload?.reason);
              ToastService.hub('Terminal network: Booking status updated');
            }
          } else if (data.type === 'UPSERT') {
            if (data.entity && data.payload) {
              StorageService.applyRemoteUpsert(data.entity, data.payload);
              ToastService.hub('Terminal network: New booking synced in real time');
            }
          } else if (data.type === 'SYNC_ALL') {
            this.pullStateFromHub().catch(() => {});
          }
        } catch (err) {}
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          try {
            this.eventSource.close();
          } catch (e) {}
          this.eventSource = null;
        }

        this.sseFailures++;
        // Reconnect with backoff (never permanently disable)
        const delay = Math.min(30000, 3000 * Math.pow(1.5, Math.min(this.sseFailures, 5)));
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSSE();
          }, delay);
        }
      };
    } catch (err) {
      // Graceful fallback to HTTP polling
    }
  }

  // Pull authoritative state from server hub and apply to local storage
  public static async pullStateFromHub(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/hub/state');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return false;
      }
      const data = await res.json();
      if (!data || !data.success) return false;

      StorageService.resetSyncChangesCount();
      // Apply state to StorageService
      StorageService.applyFullHubSnapshot(data);
      const changes = StorageService.getLastSyncChangesCount();
      if (changes > 0) {
        ToastService.hub(`Multi-terminal network: Updated ${changes} ${changes === 1 ? 'record' : 'records'}`);
      }

      // Bi-directional check: If this device has any confirmed bookings not yet in the Hub, sync them up!
      try {
        const localActiveBookings = StorageService.getAllBookings().filter((b) => b && b.id && b.status !== 'CANCELLED');
        const hubBookingIds = new Set((data.bookings || []).map((b: any) => String(b?.id || '').toLowerCase().trim()));
        const missingOnHub = localActiveBookings.filter((b) => !hubBookingIds.has(String(b.id).toLowerCase().trim()));

        if (missingOnHub.length > 0) {
          // Push missing local bookings to server hub so other computers receive them
          for (const b of missingOnHub) {
            this.pushMutation({
              mutationType: 'UPSERT',
              entity: 'bookings',
              id: b.id,
              data: b,
            }).catch(() => {});
          }
        }
      } catch (diffErr) {}

      return true;
    } catch (e) {
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Push instant mutation to server hub (broadcasts to all computers)
  public static async pushMutation(payload: {
    mutationType: 'DELETE' | 'CANCEL' | 'UPSERT' | 'SYNC_ALL';
    entity?: string;
    id?: string;
    data?: any;
    reason?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const res = await fetch('/api/hub/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (e) {
      // Quiet fallback
    }
    return { success: false };
  }
}

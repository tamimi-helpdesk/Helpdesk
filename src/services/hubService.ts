import { StorageService } from './storageService';
import { ToastService } from './toastService';

// Cross-Computer Universal Real-Time Hub Client
export class HubService {
  private static eventSource: EventSource | null = null;
  private static isConnected = false;
  private static reconnectTimer: any = null;
  private static isSyncing = false;
  private static sseFailures = 0;
  private static isStaticHost = false;

  // Initialize real-time synchronization listener
  public static init() {
    if (typeof window === 'undefined') return;

    // 1. Initial State Fetch from Hub
    this.pullStateFromHub().catch(() => {});

    // 2. Connect Real-time SSE Stream
    this.connectSSE();

    // 3. Fallback Polling (Every 10 seconds if backend hub is available)
    setInterval(() => {
      if (!this.isStaticHost) {
        this.pullStateFromHub().catch(() => {});
      }
    }, 10000);

    // 4. Focus sync
    window.addEventListener('focus', () => {
      if (!this.isStaticHost) {
        this.pullStateFromHub().catch(() => {});
      }
    });
  }

  private static connectSSE() {
    if (this.isStaticHost) return;
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {}
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
            // Check if server version is ahead of local
            this.pullStateFromHub().catch(() => {});
          } else if (data.type === 'DELETE') {
            // Apply instant local delete
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
              ToastService.hub('Terminal network: New booking synced');
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
        if (this.sseFailures >= 3) {
          // Detect static hosting (Netlify, GitHub Pages, Vercel SPA) without fullstack backend
          this.isStaticHost = true;
          return;
        }

        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSSE();
          }, 5000);
        }
      };
    } catch (err) {
      this.isStaticHost = true;
    }
  }

  // Pull authoritative state from server hub and apply to local storage
  public static async pullStateFromHub(): Promise<boolean> {
    if (this.isSyncing || this.isStaticHost) return false;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/hub/state');
      const contentType = res.headers.get('content-type') || '';
      // On static hosting (like Netlify), unknown routes return HTML index.html
      if (!res.ok || !contentType.includes('application/json')) {
        this.isStaticHost = true;
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
      return true;
    } catch (e) {
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Push instant mutation to server hub
  public static async pushMutation(payload: {
    mutationType: 'DELETE' | 'CANCEL' | 'UPSERT' | 'SYNC_ALL';
    entity?: string;
    id?: string;
    data?: any;
    reason?: string;
    [key: string]: any;
  }): Promise<any> {
    if (this.isStaticHost) return { success: false };
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
      // Silently catch on static hosts
    }
    return { success: false };
  }
}

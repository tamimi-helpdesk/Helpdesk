import { StorageService } from './storageService';
import { ToastService } from './toastService';

// Cross-Computer Universal Real-Time Hub Client
export class HubService {
  private static eventSource: EventSource | null = null;
  private static isConnected = false;
  private static reconnectTimer: any = null;
  private static isSyncing = false;
  private static sseFailures = 0;

  private static lastKnownVersion = 0;

  public static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
    try {
      if (typeof localStorage !== 'undefined') {
        const rawSession = localStorage.getItem('tamimi_helpdesk_auth_session_v2');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed && parsed.sessionToken) {
            headers['Authorization'] = `Bearer ${parsed.sessionToken}`;
            headers['x-session-token'] = parsed.sessionToken;
          }
          if (parsed && parsed.username) {
            headers['x-operator-username'] = parsed.username;
          }
        }
      }
    } catch (_) {}
    return headers;
  }

  // Instant Authoritative Booking Fetch directly from Server Endpoint (Cache-busted, no-store)
  public static async fetchAuthoritativeBookings(facilityId?: string, date?: string): Promise<boolean> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('_t', String(Date.now()));
      if (facilityId) queryParams.set('facilityId', facilityId);
      if (date) queryParams.set('date', date);

      const res = await fetch(`/api/bookings?${queryParams.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: this.getAuthHeaders(),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return false;
      }

      const data = await res.json();
      if (!data || !data.success || !Array.isArray(data.bookings)) {
        return false;
      }

      if (typeof data.version === 'number') {
        this.lastKnownVersion = data.version;
      }

      // Ingest tombstones & cancellations
      if (data.deletedIds && typeof data.deletedIds === 'object') {
        StorageService.applyTombstones(data.deletedIds);
      }
      if (data.cancelledIds && typeof data.cancelledIds === 'object') {
        StorageService.applyCancellations(data.cancelledIds);
      }

      // Directly apply authoritative server bookings into StorageService
      StorageService.setAuthoritativeServerBookings(data.bookings, facilityId, date);
      return true;
    } catch (err) {
      console.warn('[HubService] Error fetching authoritative bookings:', err);
      return false;
    }
  }

  // Initialize real-time synchronization listener
  public static init() {
    if (typeof window === 'undefined') return;

    // 1. Initial State Fetch from Hub
    this.fetchAuthoritativeBookings().catch(() => {});
    this.pullStateFromHub().catch(() => {});

    // 2. Connect Real-time SSE Stream
    this.connectSSE();

    // 3. Ultra-lightweight periodic version check (Every 6 seconds, <50 bytes instead of full state)
    setInterval(async () => {
      try {
        const vRes = await fetch(`/api/hub/version?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: this.getAuthHeaders(),
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData && typeof vData.version === 'number') {
            if (vData.version > this.lastKnownVersion) {
              await this.pullStateFromHub();
            }
          }
        }
      } catch (e) {
        // Quiet fallback
      }
    }, 6000);

    // 4. Focus & Visibility Sync (Instantly pull when user focuses or returns to window)
    window.addEventListener('focus', () => {
      this.fetchAuthoritativeBookings().catch(() => {});
      this.pullStateFromHub().catch(() => {});
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchAuthoritativeBookings().catch(() => {});
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
            if (typeof data.version === 'number') {
              this.lastKnownVersion = data.version;
            }
            this.pullStateFromHub().catch(() => {});
          } else if (data.type === 'DELETE') {
            if (typeof data.version === 'number') this.lastKnownVersion = data.version;
            if (data.id) {
              StorageService.applyRemoteDeletion(data.id, data.entity);
              ToastService.hub('Terminal network: Record removed by another user');
            }
          } else if (data.type === 'CANCEL') {
            if (typeof data.version === 'number') this.lastKnownVersion = data.version;
            if (data.id) {
              StorageService.applyRemoteCancellation(data.id, data.payload?.reason);
              ToastService.hub('Terminal network: Booking status updated');
            }
          } else if (data.type === 'CANCEL_BATCH') {
            if (typeof data.version === 'number') this.lastKnownVersion = data.version;
            const ids = Array.isArray(data.payload?.ids)
              ? data.payload.ids
              : (Array.isArray(data.payload) ? data.payload : []);
            if (ids.length > 0) {
              StorageService.applyRemoteBatchCancellation(ids, data.payload?.reason);
              ToastService.hub('Terminal network: Batch schedule status updated');
            }
          } else if (data.type === 'UPSERT' || data.type === 'UPSERT_BATCH') {
            if (typeof data.version === 'number') this.lastKnownVersion = data.version;
            if (data.entity && data.payload) {
              StorageService.applyRemoteUpsert(data.entity, data.payload);
              ToastService.hub('Terminal network: Real-time update synced');
            }
          } else if (data.type === 'SYNC_ALL') {
            if (typeof data.version === 'number') this.lastKnownVersion = data.version;
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
      const res = await fetch(`/api/hub/state?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: this.getAuthHeaders(),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return false;
      }
      const data = await res.json();
      if (!data || !data.success) return false;

      if (typeof data.version === 'number') {
        this.lastKnownVersion = data.version;
      }

      StorageService.resetSyncChangesCount();
      // Apply state to StorageService
      StorageService.applyFullHubSnapshot(data);
      const changes = StorageService.getLastSyncChangesCount();
      if (changes > 0) {
        ToastService.hub(`Multi-terminal network: Updated ${changes} ${changes === 1 ? 'record' : 'records'}`);
      }

      // Bi-directional check: If this device has confirmed bookings not yet on Hub AND not tombstoned or cancelled, sync them up
      try {
        const deletedIds = data.deletedIds || {};
        const cancelledIds = data.cancelledIds || {};
        const now = Date.now();
        const localActiveBookings = StorageService.getAllBookings().filter((b) => {
          if (!b || !b.id || b.status === 'CANCELLED') return false;
          const k = String(b.id).toLowerCase().trim();
          if (deletedIds[k] || cancelledIds[k]) return false;
          // Protect against stale snapshots reviving deleted records
          const createdTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return now - createdTime < 15 * 60 * 1000;
        });
        const hubBookingIds = new Set((data.bookings || []).map((b: any) => String(b?.id || '').toLowerCase().trim()));
        const missingOnHub = localActiveBookings.filter((b) => !hubBookingIds.has(String(b.id).toLowerCase().trim()));

        if (missingOnHub.length > 0) {
          // Push genuine fresh local bookings to server hub so other computers receive them
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
    mutationType: 'DELETE' | 'CANCEL' | 'CANCEL_BATCH' | 'UPSERT' | 'UPSERT_BATCH' | 'BATCH_UPSERT' | 'SYNC_ALL';
    entity?: string;
    id?: string;
    ids?: string[];
    data?: any;
    reason?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const headers = this.getAuthHeaders();

      const res = await fetch('/api/hub/mutate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return { success: res.ok };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error pushing mutation' };
    }
  }

  // Authoritative Server-First Booking Save (Requirement 5: নিশ্চিত করো server-এ save হয়েছে)
  public static async saveBookingAuthoritative(booking: any): Promise<{ success: boolean; booking?: any; conflict?: boolean; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({ booking }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return { success: res.ok, booking };
    } catch (e: any) {
      // Fallback to /api/hub/mutate
      return await this.pushMutation({
        mutationType: 'UPSERT',
        entity: 'bookings',
        id: booking.id,
        data: booking,
      });
    }
  }
}

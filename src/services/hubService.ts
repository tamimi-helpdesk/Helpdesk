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

  public static getAuthHeaders(includeContentType = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
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
        credentials: 'include',
        headers: this.getAuthHeaders(false),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        // Static hosting fallback (e.g. GitHub Pages): auto-hydrate from Cloud Firestore if empty
        try {
          const { CloudDatabaseService } = await import('./firebaseService');
          await CloudDatabaseService.autoHydrateIfEmpty();
        } catch (_) {}
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

      StorageService.setAuthoritativeServerBookings(data.bookings, facilityId, date);
      return true;
    } catch (err) {
      console.warn('[HubService] Error fetching authoritative bookings:', err);
      return false;
    }
  }

  public static readonly NON_BOOKING_FACILITY_IDS = [
    'blank-forms',
    'invoice-manager',
    'announcement-notice',
    'help-support',
    'ticket-management',
    'sla-management',
    'automated-workflow',
    'email-management',
    'isolation-room',
    'handover-takenover',
    'parcel-monitoring',
    'lost-and-found',
  ];

  /**
   * Authoritative Facility Booking Fetch:
   * Guarantees complete and latest booking records are loaded directly from the server database
   * before a facility can be opened. Prevents opening with stale local cache or partial data.
   */
  public static async fetchFacilityAuthoritativeBookings(facilityId: string): Promise<{
    success: boolean;
    bookingsCount: number;
    error?: string;
  }> {
    if (!facilityId) {
      return { success: false, bookingsCount: 0, error: 'Invalid facility identifier' };
    }

    // Specialized & Non-Booking Facilities manage their own dedicated storage engines
    // (e.g. Blank Forms, Invoices, Handover, Parcels, Lost & Found, Tickets, etc.)
    // They bypass slot booking verification and open immediately with 100% reliability.
    const cleanId = facilityId.toLowerCase().trim();
    if (this.NON_BOOKING_FACILITY_IDS.includes(cleanId)) {
      return { success: true, bookingsCount: 0 };
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 7000);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('_t', String(Date.now()));
      queryParams.set('facilityId', facilityId);

      const endpointUrl = `/api/bookings?${queryParams.toString()}`;
      console.log(`[HubService] Initiating authoritative fetch for facility="${facilityId}" from ${endpointUrl}`);

      const res = await fetch(endpointUrl, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: this.getAuthHeaders(false),
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      console.log(`[HubService] Authoritative response: status=${res.status}, ok=${res.ok}, contentType="${contentType}"`);

      if (!res.ok || !contentType.includes('application/json')) {
        console.warn(`[HubService] Server returned non-OK or non-JSON (status: ${res.status}). Attempting Firestore fallback...`);
        const cloudResult = await this.fallbackFetchFromCloud(facilityId);
        if (cloudResult.success) {
          console.log(`[HubService] Successfully recovered ${cloudResult.bookingsCount} records from Firestore for "${facilityId}"`);
          return cloudResult;
        }

        return {
          success: false,
          bookingsCount: 0,
          error: `Server endpoint error (Status ${res.status}, Type "${contentType}"). Cloud fallback: ${cloudResult.error || 'Unavailable'}.`,
        };
      }

      const data = await res.json();
      if (!data || !data.success || !Array.isArray(data.bookings)) {
        console.warn(`[HubService] Invalid JSON data from server. Attempting Firestore fallback...`, data);
        const cloudResult = await this.fallbackFetchFromCloud(facilityId);
        if (cloudResult.success) {
          return cloudResult;
        }

        return {
          success: false,
          bookingsCount: 0,
          error: data?.error || 'Invalid database response structure. Server sync aborted.',
        };
      }

      if (typeof data.version === 'number') {
        this.lastKnownVersion = Math.max(this.lastKnownVersion, data.version);
      }

      // If server returned 0 records, verify against Cloud Firestore to ensure a fresh server instance does not wipe valid bookings
      if (Array.isArray(data.bookings) && data.bookings.length === 0) {
        const cloudResult = await this.fallbackFetchFromCloud(facilityId);
        if (cloudResult.success && cloudResult.bookingsCount > 0) {
          console.log(`[HubService] Authoritative recovery: Loaded ${cloudResult.bookingsCount} records from Cloud Firestore for "${facilityId}"`);
          return cloudResult;
        }
      }

      // Ingest tombstones & cancellations
      if (data.deletedIds && typeof data.deletedIds === 'object') {
        StorageService.applyTombstones(data.deletedIds);
      }
      if (data.cancelledIds && typeof data.cancelledIds === 'object') {
        StorageService.applyCancellations(data.cancelledIds);
      }

      // Set authoritative server bookings into StorageService for this facility
      StorageService.setAuthoritativeServerBookings(data.bookings, facilityId);

      // Ensure real-time connection is running for instant updates
      this.ensureConnected();

      console.log(`[HubService] Authoritative sync completed for facility="${facilityId}" with ${data.bookings.length} verified bookings.`);

      return {
        success: true,
        bookingsCount: data.bookings.length,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('aborted');

      console.warn(`[HubService] Primary fetch notice (${err?.message || 'aborted'}). Checking Firestore fallback...`);
      try {
        const cloudResult = await this.fallbackFetchFromCloud(facilityId);
        if (cloudResult.success) {
          return cloudResult;
        }
      } catch (_) {}

      return {
        success: false,
        bookingsCount: 0,
        error: isTimeout
          ? 'Network request timed out (7s) while connecting to authoritative server database.'
          : (err?.message || 'Network connection failed while fetching latest booking records.'),
      };
    }
  }

  private static async fallbackFetchFromCloud(facilityId: string): Promise<{ success: boolean; bookingsCount: number; error?: string }> {
    try {
      const { CloudDatabaseService } = await import('./firebaseService');
      const cloudRes = await CloudDatabaseService.fetchFacilityBookingsFromCloud(facilityId);
      if (cloudRes.success) {
        StorageService.setAuthoritativeServerBookings(cloudRes.bookings, facilityId);
        this.ensureConnected();
        return { success: true, bookingsCount: cloudRes.bookings.length };
      }
      return { success: false, bookingsCount: 0, error: cloudRes.error || 'Firestore query returned failure' };
    } catch (err: any) {
      return { success: false, bookingsCount: 0, error: err?.message || 'Firestore query failed' };
    }
  }

  public static ensureConnected(): void {
    if (!this.isConnected || !this.eventSource || (this.eventSource && this.eventSource.readyState === 2)) {
      this.connectSSE();
    }
  }

  public static isRealtimeActive(): boolean {
    return this.isConnected && !!this.eventSource && this.eventSource.readyState === 1;
  }

  private static seenEvents = new Map<string, number>();

  private static isDuplicateEvent(eventKey: string): boolean {
    if (!eventKey) return false;
    const now = Date.now();
    // Prune entries older than 30 seconds
    for (const [k, timestamp] of this.seenEvents.entries()) {
      if (now - timestamp > 30000) {
        this.seenEvents.delete(k);
      }
    }
    if (this.seenEvents.has(eventKey)) {
      return true;
    }
    this.seenEvents.set(eventKey, now);
    return false;
  }

  // Initialize real-time synchronization listener
  public static init() {
    if (typeof window === 'undefined') return;

    // 1. Initial State Fetch from Hub
    this.fetchAuthoritativeBookings().catch(() => {});
    this.pullStateFromHub().catch(() => {});

    // 2. Connect Real-time SSE Stream
    this.connectSSE();

    // 3. Ultra-lightweight periodic version check (Every 5 seconds as secondary safety net)
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
              await this.fetchAuthoritativeBookings();
              await this.pullStateFromHub();
            }
          }
        }
      } catch (e) {
        // Quiet fallback
      }
    }, 5000);

    // 4. Focus, Visibility & Online Sync (Instantly reconnect and catch missed events)
    window.addEventListener('online', () => {
      this.sseFailures = 0;
      this.connectSSE();
      this.fetchAuthoritativeBookings().catch(() => {});
      this.pullStateFromHub().catch(() => {});
    });

    window.addEventListener('focus', () => {
      if (!this.isConnected) this.connectSSE();
      this.fetchAuthoritativeBookings().catch(() => {});
      this.pullStateFromHub().catch(() => {});
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.isConnected) this.connectSSE();
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
        // On connection or reconnection: immediately fetch latest state to catch any missed events
        this.fetchAuthoritativeBookings().catch(() => {});
      };

      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const eventType = data.type;
          const entity = data.entity;
          const id = data.id || (data.payload && data.payload.id);
          const version = typeof data.version === 'number' ? data.version : 0;

          if (version > 0) {
            this.lastKnownVersion = Math.max(this.lastKnownVersion, version);
          }

          if (eventType === 'CONNECTED') {
            if (typeof data.version === 'number') {
              this.lastKnownVersion = data.version;
            }
            this.fetchAuthoritativeBookings().catch(() => {});
            this.pullStateFromHub().catch(() => {});
          } else if (eventType === 'DELETE') {
            if (data.id) {
              StorageService.applyRemoteDeletion(data.id, data.entity);
              ToastService.hub('Terminal network: Record removed by another user');
            }
          } else if (eventType === 'CANCEL') {
            const cancelId = data.id || data.payload?.id;
            const bookingObj = data.payload?.booking;
            const reason = data.payload?.reason || 'Cancelled remotely';
            if (cancelId || bookingObj?.id) {
              StorageService.applyRemoteCancellation(cancelId || bookingObj?.id, reason, bookingObj);
              ToastService.hub('Terminal network: Booking status updated');
            }
          } else if (eventType === 'CANCEL_BATCH') {
            const ids = Array.isArray(data.payload?.ids)
              ? data.payload.ids
              : (Array.isArray(data.payload) ? data.payload : []);
            if (ids.length > 0) {
              StorageService.applyRemoteBatchCancellation(ids, data.payload?.reason);
              ToastService.hub('Terminal network: Batch schedule status updated');
            }
          } else if (eventType === 'UPSERT' || eventType === 'UPSERT_BATCH') {
            if (data.entity && data.payload) {
              StorageService.applyRemoteUpsert(data.entity, data.payload);
              ToastService.hub('Terminal network: Real-time update synced');
            }
          } else if (eventType === 'BLANK_FORMS_UPDATED' || entity === 'blankForms') {
            const employees = data.payload?.employees || (Array.isArray(data.payload) ? data.payload : null);
            if (Array.isArray(employees)) {
              import('./blankFromService').then(({ BlankFromService }) => {
                BlankFromService.syncFromRemoteBroadcast(employees);
              }).catch(() => {});
              ToastService.hub(`Workstation Sync: ${employees.length.toLocaleString()} resident records synchronized`);
            }
          } else if (eventType === 'SYNC_ALL') {
            this.fetchAuthoritativeBookings().catch(() => {});
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
        // Fast reconnection: retry in 1s, 2s, max 3s (never wait 30s)
        const delay = Math.min(3000, 1000 * Math.max(1, this.sseFailures));
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
        credentials: 'include',
        headers: this.getAuthHeaders(false),
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
        credentials: 'include',
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

  // Authoritative Server-First Booking Save (Requirement 5: Ensure authoritative persistence to server)
  public static async saveBookingAuthoritative(booking: any): Promise<{ success: boolean; booking?: any; conflict?: boolean; error?: string }> {
    try {
      const headers = this.getAuthHeaders();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        cache: 'no-store',
        credentials: 'include',
        body: JSON.stringify({ booking }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      // On static hosting (e.g. GitHub Pages), /api/bookings returns 404 HTML.
      // This is expected and not an error; proceed with resilient local storage and cloud sync.
      return { success: true, booking, isOffline: true };
    } catch (e: any) {
      // Fallback to local offline resilience
      return { success: true, booking, isOffline: true };
    }
  }

  // Authoritative Booking Cancellation directly on Server Endpoint (Cross-device instant sync)
  public static async cancelBookingAuthoritative(bookingId: string, reason?: string, booking?: any): Promise<boolean> {
    try {
      const headers = this.getAuthHeaders();
      const cleanId = encodeURIComponent(String(bookingId).trim());
      const res = await fetch(`/api/bookings/${cleanId}`, {
        method: 'DELETE',
        headers,
        cache: 'no-store',
        credentials: 'include',
        body: JSON.stringify({ reason, booking, facilityId: booking?.facilityId }),
      });
      if (res.ok) return true;
    } catch (_) {}
    // Fallback to /api/hub/mutate
    try {
      const mutateRes = await this.pushMutation({
        mutationType: 'CANCEL',
        entity: 'bookings',
        id: bookingId,
        reason: reason || 'Cancelled by user',
        data: booking,
        facilityId: booking?.facilityId,
      });
      return Boolean(mutateRes?.success);
    } catch (_) {
      return false;
    }
  }

  // Notify server that a booking was saved or confirmed in Google Sheets / GAS (Requirement 4)
  public static async notifyServerBookingSaved(booking: any, action: 'upsert' | 'cancel' = 'upsert'): Promise<boolean> {
    try {
      const headers = this.getAuthHeaders();
      const res = await fetch('/api/gas/notify-booking-saved', {
        method: 'POST',
        headers,
        cache: 'no-store',
        credentials: 'include',
        body: JSON.stringify({ booking, action }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[HubService] notifyServerBookingSaved error:', err);
      return false;
    }
  }
}


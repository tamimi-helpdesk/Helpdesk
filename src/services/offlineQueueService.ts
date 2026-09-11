/**
 * ============================================================================
 * OFFLINE SYNC QUEUE & RESILIENT RETRY ENGINE (TAMIMI EXECUTIVE HELPDESK)
 * ============================================================================
 * Automatically catches any network drop, temporary GAS timeout, or offline
 * operation across all 20 facilities, buffers changes in persistent storage,
 * and flushes smoothly in background once internet/GAS is available with
 * exponential backoff, jitter, and multi-tab broadcast.
 * ============================================================================
 */

export interface QueuedSyncItem {
  id: string;
  targetId: string;
  action:
    | 'saveBooking'
    | 'cancelBooking'
    | 'deleteBooking'
    | 'saveHandover'
    | 'deleteHandover'
    | 'saveParcel'
    | 'deleteParcel'
    | 'saveLostFound'
    | 'deleteLostFound'
    | 'saveIsolationBed'
    | 'dischargeIsolationBed'
    | 'saveNotice'
    | 'deleteNotice'
    | 'saveSupportTicket'
    | 'deleteSupportTicket'
    | 'saveInvoice'
    | 'deleteInvoice'
    | 'saveBlankForm'
    | 'deleteBlankForm'
    | 'saveWorkOrder'
    | 'deleteWorkOrder'
    | 'saveWorkOrderTicket'
    | 'deleteWorkOrderTicket'
    | 'saveSlaPolicy'
    | 'deleteSlaPolicy'
    | 'saveWorkflow'
    | 'deleteWorkflow'
    | 'saveEmailLog'
    | 'deleteEmailLog';
  facilityName: string;
  description: string;
  payload: any;
  timestamp: string;
  retries: number;
  lastError?: string;
  nextRetryTimestamp?: number;
}

export type SyncStateStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'PENDING_OFFLINE';

const OFFLINE_QUEUE_KEY = 'tamimi_offline_sync_queue_v1';
let isFlushing = false;
let flushStartTime = 0;
const FLUSH_TIMEOUT_MS = 30000; // 30 second watchdog timeout to prevent stuck locks
let syncListeners: Array<(status: { state: SyncStateStatus; pendingCount: number }) => void> = [];

function notifyQueueChanged() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamimi_offline_queue_updated'));
      const pending = OfflineQueueService.getPendingCount();
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const state: SyncStateStatus = isFlushing ? 'SYNCING' : !isOnline ? 'OFFLINE' : pending > 0 ? 'PENDING_OFFLINE' : 'ONLINE';
      syncListeners.forEach((fn) => {
        try {
          fn({ state, pendingCount: pending });
        } catch (e) {}
      });
    }
  } catch (e) {}
}

export const OfflineQueueService = {
  /**
   * Subscribe to real-time sync status updates
   */
  subscribe(listener: (status: { state: SyncStateStatus; pendingCount: number }) => void): () => void {
    syncListeners.push(listener);
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pending = this.getPendingCount();
    listener({
      state: isFlushing ? 'SYNCING' : !isOnline ? 'OFFLINE' : pending > 0 ? 'PENDING_OFFLINE' : 'ONLINE',
      pendingCount: pending,
    });
    return () => {
      syncListeners = syncListeners.filter((l) => l !== listener);
    };
  },

  /**
   * Get all currently queued offline transactions
   */
  getQueue(): QueuedSyncItem[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read offline queue', e);
    }
    return [];
  },

  /**
   * Save queue to localStorage
   */
  saveQueue(queue: QueuedSyncItem[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      notifyQueueChanged();
    } catch (e) {
      console.error('Failed to persist offline sync queue', e);
    }
  },

  /**
   * Add a transaction to the offline sync queue
   */
  enqueue(item: {
    targetId: string;
    action: QueuedSyncItem['action'];
    facilityName: string;
    description: string;
    payload: any;
  }): void {
    const queue = this.getQueue();
    // Deduplicate if same action and targetId exists
    const filtered = queue.filter(
      (q) => !(q.targetId === item.targetId && q.action === item.action)
    );

    const queuedItem: QueuedSyncItem = {
      id: `SYNC-Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      targetId: item.targetId,
      action: item.action,
      facilityName: item.facilityName,
      description: item.description,
      payload: item.payload,
      timestamp: new Date().toISOString(),
      retries: 0,
      nextRetryTimestamp: Date.now(),
    };

    filtered.push(queuedItem);
    this.saveQueue(filtered);
  },

  /**
   * Remove an item from the queue by ID
   */
  dequeue(queueId: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter((q) => q.id !== queueId);
    this.saveQueue(filtered);
  },

  /**
   * Clear all queued items
   */
  clearQueue(): void {
    this.saveQueue([]);
  },

  /**
   * Check if a specific target record ID has pending offline sync operations
   */
  isPendingOffline(targetId: string): boolean {
    if (!targetId) return false;
    const cleanId = String(targetId).toLowerCase().trim();
    const queue = this.getQueue();
    return queue.some((q) => String(q.targetId || '').toLowerCase().trim() === cleanId);
  },

  /**
   * Get count of pending queued items
   */
  getPendingCount(): number {
    return this.getQueue().length;
  },

  /**
   * Flushes the entire offline queue through GasService with Exponential Backoff + Jitter
   */
  async flushQueue(gasServiceRef: any): Promise<{ total: number; successful: number; failed: number }> {
    const now = Date.now();

    // Check watchdog: if flushing was stuck for > 30s, force reset lock
    if (isFlushing) {
      if (flushStartTime > 0 && now - flushStartTime > FLUSH_TIMEOUT_MS) {
        console.warn('[OfflineQueue] Flush watchdog expired (30s). Re-enabling sync queue.');
        isFlushing = false;
        flushStartTime = 0;
      } else {
        return { total: this.getPendingCount(), successful: 0, failed: 0 };
      }
    }

    if (!gasServiceRef) {
      return { total: this.getPendingCount(), successful: 0, failed: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { total: 0, successful: 0, failed: 0 };
    }

    // Filter items ready for retry based on backoff
    const readyItems = queue.filter((q) => !q.nextRetryTimestamp || q.nextRetryTimestamp <= now);
    if (readyItems.length === 0) {
      return { total: queue.length, successful: 0, failed: queue.length };
    }

    isFlushing = true;
    flushStartTime = Date.now();
    notifyQueueChanged();

    let successCount = 0;
    let failCount = 0;
    const remainingQueue: QueuedSyncItem[] = queue.filter((q) => q.nextRetryTimestamp && q.nextRetryTimestamp > now);

    try {
      for (const item of readyItems) {
        try {
          let result: { success: boolean; error?: string } = { success: false };

          switch (item.action) {
            case 'saveBooking':
              result = await gasServiceRef.pushBookingToRemoteDirect(item.payload);
              break;
            case 'cancelBooking':
              result = await gasServiceRef.cancelBookingRemoteDirect(item.payload || item.targetId, item.payload?.phone || item.payload?.phoneNumber, item.payload?.reason);
              break;
            case 'deleteBooking':
              result = await gasServiceRef.deleteBookingRemoteDirect(item.payload || item.targetId, item.payload?.phone || item.payload?.phoneNumber);
              break;
            case 'saveHandover':
              result = await gasServiceRef.pushHandoverToRemoteDirect(item.payload);
              break;
            case 'deleteHandover':
              result = await gasServiceRef.deleteHandoverFromRemoteDirect(item.targetId);
              break;
            case 'saveParcel':
              result = await gasServiceRef.pushParcelToRemoteDirect(item.payload);
              break;
            case 'deleteParcel':
              result = await gasServiceRef.deleteParcelFromRemoteDirect(item.targetId);
              break;
            case 'saveLostFound':
              result = await gasServiceRef.pushLostFoundToRemoteDirect(item.payload);
              break;
            case 'deleteLostFound':
              result = await gasServiceRef.deleteLostFoundFromRemoteDirect(item.targetId);
              break;
            case 'saveIsolationBed':
              result = await gasServiceRef.pushIsolationBedToRemoteDirect(item.payload);
              break;
            case 'dischargeIsolationBed':
              result = await gasServiceRef.pushIsolationBedToRemoteDirect(item.payload);
              break;
            case 'saveNotice':
              result = await gasServiceRef.pushNoticeToRemoteDirect(item.payload);
              break;
            case 'deleteNotice':
              result = await gasServiceRef.deleteNoticeFromRemoteDirect(item.targetId);
              break;
            case 'saveSupportTicket':
              result = await gasServiceRef.pushSupportTicketToRemoteDirect(item.payload);
              break;
            case 'deleteSupportTicket':
              result = await gasServiceRef.deleteSupportTicketFromRemoteDirect(item.targetId);
              break;
            case 'saveInvoice':
              result = await gasServiceRef.pushInvoiceToRemoteDirect(item.payload);
              break;
            case 'deleteInvoice':
              result = await gasServiceRef.deleteInvoiceFromRemoteDirect(item.targetId);
              break;
            case 'saveBlankForm':
              result = await gasServiceRef.pushBlankFormToRemoteDirect(item.payload);
              break;
            case 'deleteBlankForm':
              result = await gasServiceRef.deleteBlankFormFromRemoteDirect(item.targetId);
              break;
            case 'saveWorkOrder':
            case 'saveWorkOrderTicket':
              result = await gasServiceRef.pushWorkOrderTicketToRemoteDirect(item.payload);
              break;
            case 'deleteWorkOrder':
            case 'deleteWorkOrderTicket':
              result = await gasServiceRef.deleteWorkOrderTicketFromRemoteDirect(item.targetId);
              break;
            case 'saveSlaPolicy':
              result = await gasServiceRef.pushSlaPolicyToRemoteDirect(item.payload);
              break;
            case 'deleteSlaPolicy':
              result = await gasServiceRef.deleteSlaPolicyFromRemoteDirect(item.targetId);
              break;
            case 'saveWorkflow':
              result = await gasServiceRef.pushWorkflowToRemoteDirect(item.payload);
              break;
            case 'deleteWorkflow':
              result = await gasServiceRef.deleteWorkflowFromRemoteDirect(item.targetId);
              break;
            case 'saveEmailLog':
              result = await gasServiceRef.pushEmailLogToRemoteDirect(item.payload);
              break;
            case 'deleteEmailLog':
              result = await gasServiceRef.deleteEmailLogFromRemoteDirect(item.targetId);
              break;
            default:
              result = { success: true };
          }

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            item.retries += 1;
            item.lastError = result.error || 'Network error';
            // Exponential backoff: 2s, 4s, 8s, 16s, max 60s + random jitter (0-2000ms)
            const backoffDelay = Math.min(60000, Math.pow(2, Math.min(item.retries, 6)) * 1000) + Math.random() * 2000;
            item.nextRetryTimestamp = Date.now() + backoffDelay;
            remainingQueue.push(item);
          }
        } catch (err: any) {
          failCount++;
          item.retries += 1;
          item.lastError = err.message || 'Unknown network error';
          const backoffDelay = Math.min(60000, Math.pow(2, Math.min(item.retries, 6)) * 1000) + Math.random() * 2000;
          item.nextRetryTimestamp = Date.now() + backoffDelay;
          remainingQueue.push(item);
        }
      }
    } finally {
      this.saveQueue(remainingQueue);
      isFlushing = false;
      flushStartTime = 0;
      notifyQueueChanged();
    }

    return {
      total: queue.length,
      successful: successCount,
      failed: failCount,
    };
  },
};

// Listen for browser online event to auto-flush
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifyQueueChanged();
    window.dispatchEvent(new CustomEvent('tamimi_request_flush_queue'));
  });
  window.addEventListener('offline', () => {
    notifyQueueChanged();
  });
}

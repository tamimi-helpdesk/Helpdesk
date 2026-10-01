/**
 * Enterprise Toast Notification System
 * Alerts users in real-time when background synchronizations occur
 * across Google Sheets, Firebase Cloud Firestore, and Server Hub.
 */

export type ToastSource = 'Google Sheets' | 'Cloud Database' | 'System Hub' | 'System';
export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  source: ToastSource;
  title: string;
  message: string;
  details?: string;
  count?: number;
  type: ToastType;
  timestamp: number;
  duration: number; // Duration in milliseconds
}

type ToastListener = (toasts: ToastItem[]) => void;

let activeToasts: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();
const lastToastSignatures: Map<string, number> = new Map();

function notifyListeners() {
  const current = [...activeToasts];
  listeners.forEach((fn) => {
    try {
      fn(current);
    } catch (e) {
      console.error('[ToastService] Listener error:', e);
    }
  });
}

export const ToastService = {
  /**
   * Subscribe to toast updates
   */
  subscribe(listener: ToastListener): () => void {
    listeners.add(listener);
    listener([...activeToasts]);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Get all active toasts
   */
  getToasts(): ToastItem[] {
    return [...activeToasts];
  },

  /**
   * Display a sync notification
   */
  showSyncToast(options: {
    source: ToastSource;
    title?: string;
    message: string;
    details?: string;
    count?: number;
    type?: ToastType;
    duration?: number;
    dedupKey?: string;
  }): string {
    const {
      source,
      title = `${source} Synced`,
      message,
      details,
      count,
      type = 'success',
      duration = 4500,
      dedupKey,
    } = options;

    const signature = dedupKey || `${source}_${type}_${title}_${message}`;
    const now = Date.now();
    const lastTime = lastToastSignatures.get(signature) || 0;

    // Suppress exact duplicates firing within 2500ms
    if (now - lastTime < 2500) {
      return '';
    }
    lastToastSignatures.set(signature, now);

    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      id,
      source,
      title,
      message,
      details,
      count,
      type,
      timestamp: now,
      duration,
    };

    // Keep at most 4 toasts stacked
    activeToasts = [newToast, ...activeToasts].slice(0, 4);
    notifyListeners();

    // Broadcast event for external listeners or window events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tamimi_toast_alert', {
          detail: newToast,
        })
      );
    }

    return id;
  },

  /**
   * Convenience helpers
   */
  sheets(message: string, count?: number, details?: string) {
    return this.showSyncToast({
      source: 'Google Sheets',
      title: 'Google Sheets Synced',
      message,
      count,
      details,
      type: 'success',
    });
  },

  cloud(message: string, count?: number, details?: string) {
    return this.showSyncToast({
      source: 'Cloud Database',
      title: 'Cloud Database Synced',
      message,
      count,
      details,
      type: 'success',
    });
  },

  hub(message: string, details?: string) {
    return this.showSyncToast({
      source: 'System Hub',
      title: 'Live Hub Updated',
      message,
      details,
      type: 'info',
    });
  },

  error(source: ToastSource, message: string, details?: string) {
    return this.showSyncToast({
      source,
      title: `${source} Sync Error`,
      message,
      details,
      type: 'error',
      duration: 6000,
    });
  },

  showSuccess(message: string, title = 'Operation Successful', details?: string) {
    return this.showSyncToast({
      source: 'System',
      title,
      message,
      details,
      type: 'success',
    });
  },

  showInfo(message: string, title = 'Notice', details?: string) {
    return this.showSyncToast({
      source: 'System',
      title,
      message,
      details,
      type: 'info',
    });
  },

  showWarning(message: string, title = 'Warning', details?: string) {
    return this.showSyncToast({
      source: 'System',
      title,
      message,
      details,
      type: 'warning',
      duration: 5000,
    });
  },

  showError(message: string, title = 'System Error', details?: string) {
    return this.showSyncToast({
      source: 'System',
      title,
      message,
      details,
      type: 'error',
      duration: 6000,
    });
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(id: string) {
    const prevLen = activeToasts.length;
    activeToasts = activeToasts.filter((t) => t.id !== id);
    if (activeToasts.length !== prevLen) {
      notifyListeners();
    }
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    activeToasts = [];
    notifyListeners();
  },
};

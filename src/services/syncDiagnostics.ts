/**
 * Multi-Device Real-Time Sync Diagnostic Tracker
 * Records high-resolution timestamps, correlation IDs, and step latencies
 * across:
 * 1. Mutation Initiated
 * 2. Authoritative Write Committed (Cloud Firestore / Master Store)
 * 3. Real-Time Event / Snapshot Received on Any Device
 * 4. React State Updated & Rendered
 * 5. Google Sheets Background Archive
 */

export interface SyncDiagnosticEntry {
  correlationId: string;
  step: 
    | '1_MUTATION_INITIATED'
    | '2_AUTHORITATIVE_WRITE_ACCEPTED'
    | '2_AUTHORITATIVE_WRITE_REJECTED'
    | '3_REALTIME_SNAPSHOT_RECEIVED'
    | '4_REACT_STATE_UPDATED'
    | '5_GOOGLE_SHEETS_SYNCED'
    | '5_GOOGLE_SHEETS_FAILED';
  entity: string;
  recordId: string;
  timestamp: string;
  elapsedMs?: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'OFFLINE';
  message?: string;
  originDeviceId?: string;
}

const STORAGE_DIAGNOSTIC_LOGS_KEY = 'tamimi_sync_diagnostic_logs';
const MAX_LOGS = 100;

// Unique device fingerprint for this browser tab/session
export const DEVICE_SESSION_ID = (() => {
  if (typeof window === 'undefined') return 'node-server';
  let sid = sessionStorage.getItem('tamimi_device_session_id');
  if (!sid) {
    sid = `DEV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    sessionStorage.setItem('tamimi_device_session_id', sid);
  }
  return sid;
})();

const memoryLogs: SyncDiagnosticEntry[] = [];
const mutationStartTimes = new Map<string, number>();

export const SyncDiagnostics = {
  createCorrelationId(prefix: string = 'MUT'): string {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
  },

  log(
    correlationId: string,
    step: SyncDiagnosticEntry['step'],
    entity: string,
    recordId: string,
    status: SyncDiagnosticEntry['status'],
    message?: string,
    originDeviceId: string = DEVICE_SESSION_ID
  ): SyncDiagnosticEntry {
    const now = Date.now();
    let elapsedMs: number | undefined;

    if (step === '1_MUTATION_INITIATED') {
      mutationStartTimes.set(correlationId, now);
      elapsedMs = 0;
    } else {
      const startTime = mutationStartTimes.get(correlationId);
      if (startTime) {
        elapsedMs = now - startTime;
      }
    }

    const entry: SyncDiagnosticEntry = {
      correlationId,
      step,
      entity,
      recordId,
      timestamp: new Date().toISOString(),
      elapsedMs,
      status,
      message,
      originDeviceId,
    };

    memoryLogs.unshift(entry);
    if (memoryLogs.length > MAX_LOGS) {
      memoryLogs.pop();
    }

    // Console logging with readable colored badges
    const badge = step.startsWith('1') ? '🚀' : step.startsWith('2') ? '💾' : step.startsWith('3') ? '⚡' : step.startsWith('4') ? '🖥️' : '📊';
    console.info(
      `[SyncDiag ${badge}] [${correlationId}] [${step}] entity=${entity} id=${recordId} elapsed=${elapsedMs !== undefined ? `${elapsedMs}ms` : 'n/a'} status=${status} ${message || ''}`
    );

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tamimi_sync_diagnostic_logged', { detail: entry }));
      }
    } catch (_) {}

    return entry;
  },

  getRecentLogs(): SyncDiagnosticEntry[] {
    return [...memoryLogs];
  },

  clearLogs() {
    memoryLogs.length = 0;
    mutationStartTimes.clear();
  },
};

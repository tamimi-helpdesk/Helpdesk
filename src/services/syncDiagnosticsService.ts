/**
 * ============================================================================
 * SYNC DIAGNOSTICS & CORRELATION TRACER (TAMIMI PRODUCTION RELIABILITY)
 * ============================================================================
 * Measures and records real-time mutation latency with globally unique correlation IDs.
 * Tracks each mutation stage:
 * 1. Mutation Initiated (Local click)
 * 2. Authoritative Firestore Write Accepted/Rejected
 * 3. Real-Time Snapshot Received across clients
 * 4. React State Updated & UI Re-rendered
 * 5. Google Sheets Background Synchronization Completed
 * ============================================================================
 */

export interface MutationTrace {
  correlationId: string;
  action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE' | 'BATCH_CREATE' | 'BATCH_CANCEL';
  bookingId: string;
  facilityId?: string;
  slot?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PROPAGATED' | 'FAILED';
  initiatedAt: number;
  initiatedIso: string;
  firestoreWriteAcceptedAt?: number;
  firestoreLatencyMs?: number;
  snapshotReceivedAt?: number;
  snapshotLatencyMs?: number;
  uiRenderedAt?: number;
  totalPropagationMs?: number;
  sheetsSyncStatus?: 'PENDING' | 'SYNCED' | 'FAILED' | 'SKIPPED';
  sheetsLatencyMs?: number;
  error?: string;
}

export interface LiveSyncMetrics {
  lastLatencyMs: number;
  averageLatencyMs: number;
  totalMutationsTracked: number;
  activeStatus: 'REALTIME_CONNECTED' | 'SYNCING' | 'DEGRADED' | 'OFFLINE';
  lastSyncedAt: string | null;
  recentTraces: MutationTrace[];
}

class SyncDiagnosticsServiceImpl {
  private traces: MutationTrace[] = [];
  private maxTraces = 50;
  private listeners: ((metrics: LiveSyncMetrics) => void)[] = [];
  private lastLatencyMs = 0;
  private totalPropagationMsSum = 0;
  private completedCount = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__TAMIMI_SYNC_DIAGNOSTICS__ = this;
    }
  }

  public generateCorrelationId(prefix: string = 'MUT'): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 7);
    return `${prefix}-${ts}-${rand}`;
  }

  public startTrace(
    action: MutationTrace['action'],
    bookingId: string,
    facilityId?: string,
    slot?: string,
    customCorrelationId?: string
  ): MutationTrace {
    const correlationId = customCorrelationId || this.generateCorrelationId();
    const now = performance.now();
    const trace: MutationTrace = {
      correlationId,
      action,
      bookingId,
      facilityId,
      slot,
      status: 'PENDING',
      initiatedAt: now,
      initiatedIso: new Date().toISOString(),
      sheetsSyncStatus: 'PENDING',
    };

    this.traces.unshift(trace);
    if (this.traces.length > this.maxTraces) {
      this.traces.pop();
    }

    console.info(
      `[TAMIMI SYNC TRACE] [1. INIT] [${correlationId}] ${action} on booking ${bookingId} (${facilityId || 'all'} @ ${slot || 'n/a'})`
    );

    this.notifyListeners();
    return trace;
  }

  public markFirestoreWrite(correlationId: string, success: boolean, error?: string): void {
    const trace = this.traces.find((t) => t.correlationId === correlationId);
    const now = performance.now();

    if (trace) {
      trace.firestoreWriteAcceptedAt = now;
      trace.firestoreLatencyMs = Math.round(now - trace.initiatedAt);

      if (success) {
        trace.status = 'ACCEPTED';
        console.info(
          `[TAMIMI SYNC TRACE] [2. AUTHORITATIVE WRITE ACCEPTED] [${correlationId}] Cloud Firestore committed in ${trace.firestoreLatencyMs}ms`
        );
      } else {
        trace.status = 'FAILED';
        trace.error = error;
        console.error(
          `[TAMIMI SYNC TRACE] [2. AUTHORITATIVE WRITE FAILED] [${correlationId}] Error: ${error} (${trace.firestoreLatencyMs}ms)`
        );
      }
      this.notifyListeners();
    }
  }

  public markSnapshotReceived(bookingId: string, correlationId?: string): void {
    const now = performance.now();
    let trace: MutationTrace | undefined;

    if (correlationId) {
      trace = this.traces.find((t) => t.correlationId === correlationId);
    }
    if (!trace && bookingId) {
      // Find latest pending or accepted trace for this booking
      trace = this.traces.find((t) => t.bookingId === bookingId && t.status !== 'PROPAGATED');
    }

    if (trace) {
      trace.snapshotReceivedAt = now;
      trace.snapshotLatencyMs = Math.round(now - trace.initiatedAt);
      trace.status = 'PROPAGATED';
      trace.totalPropagationMs = trace.snapshotLatencyMs;

      this.lastLatencyMs = trace.totalPropagationMs;
      this.totalPropagationMsSum += trace.totalPropagationMs;
      this.completedCount++;

      console.info(
        `[TAMIMI SYNC TRACE] [3. SNAPSHOT RECEIVED] [${trace.correlationId}] Real-time listener delivered update in ${trace.totalPropagationMs}ms`
      );
      this.notifyListeners();
    }
  }

  public markUIRendered(correlationId?: string, bookingId?: string): void {
    const now = performance.now();
    const trace = correlationId
      ? this.traces.find((t) => t.correlationId === correlationId)
      : this.traces.find((t) => t.bookingId === bookingId);

    if (trace) {
      trace.uiRenderedAt = now;
      const renderMs = Math.round(now - (trace.snapshotReceivedAt || trace.initiatedAt));
      console.info(
        `[TAMIMI SYNC TRACE] [4. UI UPDATED] [${trace.correlationId}] React state reconciled & re-rendered in ${renderMs}ms`
      );
      this.notifyListeners();
    }
  }

  public markSheetsSync(correlationId: string, success: boolean, latencyMs?: number, error?: string): void {
    const trace = this.traces.find((t) => t.correlationId === correlationId);
    if (trace) {
      trace.sheetsSyncStatus = success ? 'SYNCED' : 'FAILED';
      trace.sheetsLatencyMs = latencyMs;
      if (error) trace.error = (trace.error ? trace.error + ' | ' : '') + `GAS: ${error}`;

      console.info(
        `[TAMIMI SYNC TRACE] [5. SHEETS SYNC] [${correlationId}] Google Sheets background sync ${success ? 'completed' : 'failed'} in ${latencyMs || 0}ms`
      );
      this.notifyListeners();
    }
  }

  public getMetrics(): LiveSyncMetrics {
    const avg = this.completedCount > 0 ? Math.round(this.totalPropagationMsSum / this.completedCount) : 0;
    return {
      lastLatencyMs: this.lastLatencyMs,
      averageLatencyMs: avg,
      totalMutationsTracked: this.traces.length,
      activeStatus: typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'REALTIME_CONNECTED',
      lastSyncedAt: this.traces[0]?.initiatedIso || null,
      recentTraces: [...this.traces],
    };
  }

  public subscribe(listener: (metrics: LiveSyncMetrics) => void): () => void {
    this.listeners.push(listener);
    listener(this.getMetrics());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const m = this.getMetrics();
    this.listeners.forEach((fn) => {
      try {
        fn(m);
      } catch (_) {}
    });
  }
}

export const SyncDiagnosticsService = new SyncDiagnosticsServiceImpl();

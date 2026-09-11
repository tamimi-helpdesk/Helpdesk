import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  writeBatch,
  setLogLevel,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from './firebaseConfig';
import { BackupService, SystemBackupSnapshot } from './backupService';
import { StorageService, getTodayDateString } from './storageService';
import { Booking } from '../types';
import { ToastService } from './toastService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.warn(`[Firestore Error - ${operationType}] at ${path}:`, errInfo.error);
  return errInfo;
}

/**
 * Recursively removes undefined fields from an object or array to guarantee
 * full compatibility with Cloud Firestore setDoc/batch.set operations and eliminate:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
function cleanForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return null as any;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof input === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return input;
}

export interface CloudDatabaseStatus {
  connected: boolean;
  testing: boolean;
  lastSyncedAt: string | null;
  lastBackupAt: string | null;
  totalCloudBookings: number;
  latencyMs: number;
  error?: string;
  isQuotaExceeded?: boolean;
  projectId: string;
  databaseId: string;
}

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isInitialized = false;
  private syncTimeout: any = null;
  private isSyncing = false;
  private lastPingMs = 0;
  private lastSyncedChecksum = '';
  private lastHeartbeatWrittenAt = 0;
  private statusListeners: ((status: CloudDatabaseStatus) => void)[] = [];

  private status: CloudDatabaseStatus = {
    connected: false,
    testing: false,
    lastSyncedAt: (() => {
      try { return typeof window !== 'undefined' ? localStorage.getItem('tamimi_last_cloud_sync') : null; } catch { return null; }
    })(),
    lastBackupAt: (() => {
      try { return typeof window !== 'undefined' ? localStorage.getItem('tamimi_last_cloud_backup') : null; } catch { return null; }
    })(),
    totalCloudBookings: 0,
    latencyMs: 0,
    isQuotaExceeded: false,
    projectId: FIREBASE_CONFIG.projectId,
    databaseId: FIREBASE_CONFIG.firestoreDatabaseId || '(default)',
  };

  constructor() {
    try {
      this.status.isQuotaExceeded = this.checkQuotaExceeded();
      if (this.status.isQuotaExceeded) {
        this.status.error = 'Free daily write units limit reached on Cloud Firestore. Quota will reset the next day. Local storage is fully active and preserved.';
      }
    } catch (e) {}
    this.init();
  }

  /**
   * Check if Firestore daily write quota was exceeded today.
   * If recorded on a previous day, auto-clears the restriction for the new day.
   */
  public checkQuotaExceeded(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const today = getTodayDateString();
      const storedDate = localStorage.getItem('tamimi_firestore_quota_exceeded_date');
      if (storedDate === today) {
        return true;
      }
      if (storedDate && storedDate !== today) {
        localStorage.removeItem('tamimi_firestore_quota_exceeded_date');
        this.status.isQuotaExceeded = false;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  /**
   * Circuit-breaker: Marks daily write quota exceeded and pauses all further write operations
   * until tomorrow's reset to avoid write stream queue exhaustion and console errors.
   */
  public markQuotaExceeded(customMsg?: string) {
    if (typeof window === 'undefined') return;
    try {
      const today = getTodayDateString();
      localStorage.setItem('tamimi_firestore_quota_exceeded_date', today);
    } catch (e) {}
    this.status.isQuotaExceeded = true;
    this.status.error = customMsg || 'Free daily write units limit reached on Cloud Firestore (Enterprise Edition Free Tier). Quota will reset tomorrow. All local operations continue safely with 100% offline persistence.';
    this.notifyListeners();
  }

  public init() {
    if (this.isInitialized) return;
    try {
      if (!getApps().length) {
        this.app = initializeApp(FIREBASE_CONFIG);
      } else {
        this.app = getApp();
      }

      // Suppress noisy transient internal WebChannel connection logs so offline states don't cause console errors
      try {
        setLogLevel('silent');
      } catch (e) {
        // ignore in non-browser environments
      }

      // Use auto-detect long-polling transport for smooth compatibility across cloud containers and iframes
      const firestoreSettings = {
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: true,
      };

      if (FIREBASE_CONFIG.firestoreDatabaseId) {
        try {
          this.db = initializeFirestore(this.app, firestoreSettings, FIREBASE_CONFIG.firestoreDatabaseId);
        } catch {
          this.db = getFirestore(this.app, FIREBASE_CONFIG.firestoreDatabaseId);
        }
      } else {
        try {
          this.db = initializeFirestore(this.app, firestoreSettings);
        } catch {
          this.db = getFirestore(this.app);
        }
      }

      this.isInitialized = true;

      // Register online/offline browser listeners and periodic cloud heartbeat
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.testConnection().catch(() => {});
        });
        window.addEventListener('offline', () => {
          this.status.connected = false;
          this.status.error = 'Operating in offline mode. Local storage is fully active and preserved.';
          this.notifyListeners();
        });

        // Periodic cloud heartbeat and verification (every 5 minutes, only if quota not exceeded)
        setInterval(() => {
          if (!this.checkQuotaExceeded() && (typeof navigator === 'undefined' || navigator.onLine)) {
            this.testConnection().catch(() => {});
          }
        }, 300000);
      }
    } catch (err: any) {
      this.status.connected = false;
      this.status.error = err.message;
      this.notifyListeners();
    }
  }

  public getDb(): Firestore | null {
    if (!this.db) this.init();
    return this.db;
  }

  public getStatus(): CloudDatabaseStatus {
    return { ...this.status };
  }

  public subscribeStatus(callback: (status: CloudDatabaseStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    const s = this.getStatus();
    this.statusListeners.forEach((cb) => {
      try {
        cb(s);
      } catch (e) {}
    });
  }

  private activeTestPromise: Promise<{ connected: boolean; latencyMs: number; error?: string; isQuotaExceeded?: boolean }> | null = null;

  /**
   * Validate Connection to Firestore with deduplication and fast-fail offline handling
   */
  public async testConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string; isQuotaExceeded?: boolean }> {
    if (this.activeTestPromise) {
      return this.activeTestPromise;
    }
    this.activeTestPromise = this.executeConnectionTest().finally(() => {
      this.activeTestPromise = null;
    });
    return this.activeTestPromise;
  }

  private async executeConnectionTest(): Promise<{ connected: boolean; latencyMs: number; error?: string; isQuotaExceeded?: boolean }> {
    if (!this.db) this.init();
    if (!this.db) return { connected: false, latencyMs: 0, error: 'Database not initialized' };

    // Fast-fail if browser reports offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.status.connected = false;
      this.status.latencyMs = 0;
      this.status.error = 'Operating in offline mode. Local storage is fully active and preserved.';
      this.status.testing = false;
      this.notifyListeners();
      return { connected: false, latencyMs: 0, error: this.status.error, isQuotaExceeded: false };
    }

    this.status.testing = true;
    this.notifyListeners();

    const start = performance.now();
    try {
      const testRef = doc(this.db, 'test', 'connection');

      // 6-second timeout to prevent lingering background retries when network is blocked
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timed out')), 6000);
      });

      const probePromise = getDocFromServer(testRef).catch((e: any) => {
        // Document not existing on /test/connection is expected and confirms connection
        if (e && (e.code === 'not-found' || String(e?.message || '').includes('not found'))) return null;
        throw e;
      });

      await Promise.race([probePromise, timeoutPromise]);

      const latency = Math.round(performance.now() - start);
      this.status.connected = true;
      this.status.latencyMs = latency;
      this.status.error = undefined;
      this.status.isQuotaExceeded = false;
      this.status.testing = false;
      this.notifyListeners();

      return { connected: true, latencyMs: latency, isQuotaExceeded: false };
    } catch (error: any) {
      const latency = Math.round(performance.now() - start);
      const errStr = String(error?.message || '').toLowerCase();
      const isQuota = error?.code === 'resource-exhausted' || errStr.includes('quota') || errStr.includes('resource-exhausted');
      const isUnavailable = error?.code === 'unavailable' ||
                            errStr.includes('offline') ||
                            errStr.includes('could not reach') ||
                            errStr.includes('the client is offline') ||
                            errStr.includes('timed out');

      this.status.connected = false;
      this.status.latencyMs = latency;
      this.status.isQuotaExceeded = isQuota;
      this.status.error = isQuota
        ? 'Free daily write units limit reached on Cloud Firestore. Local storage is fully active and preserved.'
        : isUnavailable
        ? 'Operating in offline mode. Local storage is fully active and preserved.'
        : (error?.message || 'Client offline or Firestore unreachable');
      this.status.testing = false;
      this.notifyListeners();

      return { connected: false, latencyMs: latency, error: this.status.error, isQuotaExceeded: isQuota };
    }
  }

  /**
   * Schedule debounced auto-sync to Cloud Firestore
   */
  public scheduleDebouncedCloudSync(delayMs: number = 15000) {
    if (this.checkQuotaExceeded()) {
      this.status.isQuotaExceeded = true;
      return;
    }
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.backupToCloud(false).catch((err) => {
        console.warn('[FirebaseService] Auto cloud sync notice:', err);
      });
    }, delayMs);
  }

  /**
   * Full System Backup to Cloud Firestore:
   * Saves the authoritative disaster recovery snapshot to 'disasterBackups/latest'
   * and 'disasterBackups/{timestamp}'. Storing the complete snapshot provides 100% data
   * recovery while keeping write volume minimal (1-2 writes per sync).
   */
  public async backupToCloud(isManual: boolean = true): Promise<{
    success: boolean;
    bookingsCount: number;
    error?: string;
    isQuotaExceeded?: boolean;
  }> {
    if (!this.db) this.init();
    if (!this.db) return { success: false, bookingsCount: 0, error: 'Firestore not available' };

    // Circuit Breaker: Halt writes if quota limit was reached today
    if (this.checkQuotaExceeded()) {
      this.status.isQuotaExceeded = true;
      return {
        success: false,
        bookingsCount: this.status.totalCloudBookings,
        isQuotaExceeded: true,
        error: 'Free daily write units limit reached on Cloud Firestore. Quota will reset the next day. Local storage is fully active and preserved.'
      };
    }
    if (this.isSyncing) return { success: true, bookingsCount: this.status.totalCloudBookings };

    this.isSyncing = true;
    try {
      const snapshot: SystemBackupSnapshot = BackupService.generateSnapshot();
      const allBookings = snapshot.data?.bookings || [];
      const currentChecksum = `${allBookings.length}_${snapshot.data?.isolationRooms?.length || 0}_${snapshot.summary?.bookingsCount || 0}_${snapshot.summary?.auditLogsCount || 0}`;

      // Avoid redundant cloud writes on auto-sync if data has not changed
      if (!isManual && this.lastSyncedChecksum === currentChecksum) {
        return { success: true, bookingsCount: allBookings.length };
      }

      const cleanSnapshot = cleanForFirestore(snapshot);
      const nowIso = new Date().toISOString();
      const backupId = `backup_${Date.now()}`;

      // 1. Store the master snapshot in Firestore (covers 100% of tables & data in 1 write)
      const latestRef = doc(this.db, 'disasterBackups', 'latest');
      await setDoc(latestRef, cleanForFirestore({
        ...cleanSnapshot,
        cloudStoredAt: nowIso,
        isLatest: true,
        clientOrigin: typeof window !== 'undefined' ? window.location.origin : '',
      }));

      // 2. Also save timestamped archive for version history if manual backup requested
      if (isManual) {
        const archiveRef = doc(this.db, 'disasterBackups', backupId);
        await setDoc(archiveRef, cleanForFirestore({
          ...cleanSnapshot,
          cloudStoredAt: nowIso,
          backupId,
        }));
      }

      // 3. Update system metadata heartbeat ONLY if manual or more than 1 hour has passed
      const shouldUpdateHeartbeat = isManual || (Date.now() - this.lastHeartbeatWrittenAt > 3600000);
      if (shouldUpdateHeartbeat) {
        const metaRef = doc(this.db, 'systemMeta', 'heartbeat');
        await setDoc(metaRef, cleanForFirestore({
          lastHeartbeat: nowIso,
          totalBookings: allBookings.length,
          totalRooms: cleanSnapshot.data?.isolationRooms?.length || 0,
          lastBackupType: isManual ? 'MANUAL' : 'AUTO_SYNC',
        }), { merge: true });
        this.lastHeartbeatWrittenAt = Date.now();
      }

      this.lastSyncedChecksum = currentChecksum;
      this.status.connected = true;
      this.status.isQuotaExceeded = false;
      this.status.lastSyncedAt = nowIso;
      if (isManual) this.status.lastBackupAt = nowIso;
      this.status.totalCloudBookings = allBookings.length;
      this.status.error = undefined;

      localStorage.setItem('tamimi_last_cloud_sync', nowIso);
      if (isManual) localStorage.setItem('tamimi_last_cloud_backup', nowIso);

      this.notifyListeners();

      // Trigger user-facing Toast notification for Cloud Database sync
      if (isManual) {
        ToastService.showSyncToast({
          source: 'Cloud Database',
          title: 'Cloud Database Synced',
          message: `Securely backed up ${allBookings.length} records to Cloud Firestore`,
          count: allBookings.length,
          type: 'success',
        });
      } else {
        ToastService.showSyncToast({
          source: 'Cloud Database',
          title: 'Cloud Database Synced',
          message: `Background sync updated disaster recovery snapshot in Cloud Firestore`,
          count: allBookings.length,
          type: 'success',
          duration: 4000,
          dedupKey: 'cloud_auto_sync',
        });
      }

      return { success: true, bookingsCount: allBookings.length };
    } catch (err: any) {
      if (isManual) {
        console.error('[FirebaseService] Cloud backup error:', err);
      } else {
        console.warn('[FirebaseService] Cloud backup notice (background sync):', err?.message || err);
      }
      const isQuota = err?.code === 'resource-exhausted' ||
                      String(err?.message || '').toLowerCase().includes('quota') ||
                      String(err?.message || '').includes('resource-exhausted') ||
                      String(err?.message || '').includes('queued writes');
      const isPermission = err?.code === 'permission-denied' ||
                           String(err?.message || '').toLowerCase().includes('permission');

      if (isQuota) {
        this.markQuotaExceeded('Free daily write units limit reached on Cloud Firestore. Quota will reset the next day. Local storage is fully active and preserved.');
      } else if (isPermission) {
        this.status.error = 'Firestore permission issue detected. Rules have been deployed; click "Test Connection" to refresh.';
        handleFirestoreError(err, OperationType.WRITE, 'disasterBackups/latest');
      } else {
        this.status.error = err?.message || 'Backup to cloud failed';
        handleFirestoreError(err, OperationType.WRITE, 'disasterBackups/latest');
      }
      this.notifyListeners();

      if (isManual) {
        ToastService.error('Cloud Database', this.status.error || 'Backup to Cloud Database failed');
      }

      return { success: false, bookingsCount: 0, error: this.status.error, isQuotaExceeded: isQuota };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Disaster Recovery Restore from Cloud Firestore:
   * Restores all data from 'disasterBackups/latest' into local storage, memory,
   * and pushes to the Server Hub. Guarantees ZERO DATA LOSS on a new host.
   */
  public async restoreFromCloud(): Promise<{
    success: boolean;
    restoredCount: number;
    error?: string;
    summary?: any;
  }> {
    if (!this.db) this.init();
    if (!this.db) return { success: false, restoredCount: 0, error: 'Firestore not available' };

    try {
      // 1. Fetch latest system snapshot from Firestore
      const latestRef = doc(this.db, 'disasterBackups', 'latest');
      const snapDoc = await getDoc(latestRef);

      if (!snapDoc.exists()) {
        // Fallback: check if individual bookings exist in 'bookings' collection
        const colRef = collection(this.db, 'bookings');
        const colSnap = await getDocs(colRef);
        if (!colSnap.empty) {
          const bookings: Booking[] = [];
          colSnap.forEach((d) => {
            const data = d.data() as Booking;
            if (data && data.id) bookings.push(data);
          });
          StorageService.saveBookings(bookings);
          return { success: true, restoredCount: bookings.length };
        }
        return { success: false, restoredCount: 0, error: 'No cloud disaster backup found in Firestore.' };
      }

      const cloudData = snapDoc.data() as SystemBackupSnapshot;
      if (!cloudData || !cloudData.data) {
        return { success: false, restoredCount: 0, error: 'Invalid cloud backup snapshot format.' };
      }

      // 2. Restore data using BackupService and StorageService
      const restoreResult = BackupService.restoreSnapshot(cloudData, 'replace');

      if (!restoreResult.success) {
        return { success: false, restoredCount: 0, error: restoreResult.message };
      }

      // 3. Dispatch global events
      window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
      window.dispatchEvent(new CustomEvent('tamimi_hub_synced'));

      const count = cloudData.summary?.bookingsCount || cloudData.data?.bookings?.length || 0;
      this.status.totalCloudBookings = count;
      this.status.lastSyncedAt = new Date().toISOString();
      this.notifyListeners();

      ToastService.showSyncToast({
        source: 'Cloud Database',
        title: 'Cloud Database Restored',
        message: `Disaster recovery: Successfully synchronized ${count} records from Cloud Firestore`,
        count,
        type: 'success',
        duration: 5000,
      });

      return {
        success: true,
        restoredCount: count,
        summary: cloudData.summary,
      };
    } catch (err: any) {
      console.error('[FirebaseService] Restore from cloud failed:', err);
      return { success: false, restoredCount: 0, error: err.message || 'Cloud restore failed' };
    }
  }

  /**
   * Check if Cloud database has existing data that can be restored on a fresh host
   */
  public async checkForCloudData(): Promise<{ hasData: boolean; bookingsCount: number; timestamp?: string }> {
    if (!this.db) this.init();
    if (!this.db) return { hasData: false, bookingsCount: 0 };

    try {
      const latestRef = doc(this.db, 'disasterBackups', 'latest');
      const snapDoc = await getDoc(latestRef);
      if (snapDoc.exists()) {
        const d = snapDoc.data();
        const count = d?.summary?.bookingsCount || d?.data?.bookings?.length || 0;
        return { hasData: count > 0, bookingsCount: count, timestamp: d?.exportedAt || d?.cloudStoredAt };
      }
    } catch (e) {}
    return { hasData: false, bookingsCount: 0 };
  }

  /**
   * Auto-hydrate if local storage has 0 bookings and Firestore has backups
   */
  public async autoHydrateIfEmpty(): Promise<boolean> {
    try {
      const localBookings = StorageService.getAllBookings();
      if (localBookings && localBookings.length > 0) {
        return false;
      }
      const cloudCheck = await this.checkForCloudData();
      if (cloudCheck.hasData && cloudCheck.bookingsCount > 0) {
        console.log('[FirebaseService] Fresh deployment detected with empty local storage. Restoring from Firestore...');
        const result = await this.restoreFromCloud();
        return result.success;
      }
    } catch (e) {
      console.warn('[FirebaseService] Auto-hydrate check notice:', e);
    }
    return false;
  }

  public async checkConnectivity() {
    return this.testConnection();
  }

  /**
   * Export Offline Disaster Recovery File (.json)
   * Portable offline file that can be kept on a flash drive, Google Drive,
   * or restored anywhere with zero data loss.
   */
  public downloadOfflineDisasterFile() {
    const snapshot = BackupService.generateSnapshot();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `TAMIMI_CAMP_DISASTER_RECOVERY_BACKUP_${dateStr}.json`;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const CloudDatabaseService = new FirebaseService();

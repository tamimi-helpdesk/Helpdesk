/**
 * IndexedDB Enterprise Storage Engine for Tamimi Executive Facilities
 * Bypasses browser localStorage 5MB quota restrictions safely.
 * Provides durable async storage for:
 * 1. High-resolution photos, receipts, & digital signatures
 * 2. Automated rolling system backups & disaster recovery snapshots
 * 3. Offline document & ticket attachments
 */

const DB_NAME = 'tamimi_executive_idb_v1';
const DB_VERSION = 1;

export const IDB_STORES = {
  ASSETS: 'media_assets',
  SNAPSHOTS: 'system_snapshots',
  OFFLINE_DOCS: 'offline_documents',
} as const;

export interface StoredSnapshot {
  key: string;
  dateStr: string;
  timestamp: number;
  sizeBytes: number;
  recordCounts: {
    bookings: number;
    isolation: number;
    handovers: number;
    parcels: number;
  };
  payload: string; // The full JSON string
}

export interface StoredAsset {
  id: string;
  category: 'parcel' | 'handover' | 'lost_found' | 'signature' | 'badge' | 'general';
  mimeType: string;
  dataUrl: string;
  createdAt: number;
}

class IDBStorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Initializes or returns existing connection to IndexedDB
   */
  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Store 1: Media assets & high-res photos
            if (!db.objectStoreNames.contains(IDB_STORES.ASSETS)) {
              const assetStore = db.createObjectStore(IDB_STORES.ASSETS, { keyPath: 'id' });
              assetStore.createIndex('by_category', 'category', { unique: false });
              assetStore.createIndex('by_createdAt', 'createdAt', { unique: false });
            }

            // Store 2: Automated system snapshots
            if (!db.objectStoreNames.contains(IDB_STORES.SNAPSHOTS)) {
              const snapStore = db.createObjectStore(IDB_STORES.SNAPSHOTS, { keyPath: 'key' });
              snapStore.createIndex('by_timestamp', 'timestamp', { unique: false });
            }

            // Store 3: Offline documents & attachments
            if (!db.objectStoreNames.contains(IDB_STORES.OFFLINE_DOCS)) {
              db.createObjectStore(IDB_STORES.OFFLINE_DOCS, { keyPath: 'id' });
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            console.warn('Failed to open IndexedDB:', request.error);
            reject(request.error);
          };

          request.onblocked = () => {
            console.warn('IndexedDB connection blocked by another open tab.');
          };
        } catch (err) {
          reject(err);
        }
      });
    }

    return this.dbPromise;
  }

  // ==========================================
  // SNAPSHOTS (AutoBackup & Disaster Recovery)
  // ==========================================

  async saveSnapshot(snapshot: StoredSnapshot): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(IDB_STORES.SNAPSHOTS);
        const req = store.put(snapshot);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.error('IDB saveSnapshot error:', req.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('IDB not available, fallback required:', e);
      return false;
    }
  }

  async getSnapshot(key: string): Promise<StoredSnapshot | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.SNAPSHOTS, 'readonly');
        const store = tx.objectStore(IDB_STORES.SNAPSHOTS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async getAllSnapshots(): Promise<StoredSnapshot[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.SNAPSHOTS, 'readonly');
        const store = tx.objectStore(IDB_STORES.SNAPSHOTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const res = (req.result || []) as StoredSnapshot[];
          res.sort((a, b) => b.timestamp - a.timestamp);
          resolve(res);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  async deleteSnapshot(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(IDB_STORES.SNAPSHOTS);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  // ==========================================
  // MEDIA ASSETS (Photos, Signatures, Blobs)
  // ==========================================

  async saveAsset(asset: StoredAsset): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.ASSETS, 'readwrite');
        const store = tx.objectStore(IDB_STORES.ASSETS);
        const req = store.put(asset);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.error('IDB saveAsset error:', req.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('IDB saveAsset failed:', e);
      return false;
    }
  }

  async getAsset(id: string): Promise<StoredAsset | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.ASSETS, 'readonly');
        const store = tx.objectStore(IDB_STORES.ASSETS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async deleteAsset(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORES.ASSETS, 'readwrite');
        const store = tx.objectStore(IDB_STORES.ASSETS);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  /**
   * Helper: Check if IndexedDB is supported and usable
   */
  isEngineReady(): boolean {
    return this.isSupported;
  }
}

export const idbStorageService = new IDBStorageEngine();

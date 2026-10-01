/**
 * Automated Snapshot & Auto-Backup Scheduler
 * Automatically creates daily rolling snapshots of local storage,
 * manages retention, and prevents data loss.
 */

import { StorageService, getTodayDateString } from './storageService';
import { idbStorageService } from './idbStorageService';

const AUTO_BACKUP_INDEX_KEY = 'tamimi_auto_snapshots_index_v2';
const LAST_BACKUP_TIME_KEY = 'tamimi_last_auto_backup_ts';
const MAX_AUTO_SNAPSHOTS = 7; // Keep 7 days rolling backups
const LEGACY_AUTO_BACKUP_PREFIX = 'tamimi_auto_snapshot_';

export interface AutoSnapshotMeta {
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
}

export const AutoBackupService = {
  /**
   * Cleans legacy large snapshots directly from localStorage to release quota
   */
  cleanupLegacyLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LEGACY_AUTO_BACKUP_PREFIX) && k !== AUTO_BACKUP_INDEX_KEY) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      });
      if (keysToRemove.length > 0) {
        console.log(`[AutoBackup] Cleaned ${keysToRemove.length} legacy snapshot(s) from localStorage.`);
      }
    } catch (e) {
      console.warn('Failed to clean legacy snapshots from localStorage', e);
    }
  },

  /**
   * Checks if an auto backup is needed (every 24h) and creates one
   */
  performDailyAutoBackupIfNeeded(): boolean {
    try {
      this.cleanupLegacyLocalStorage();
      const now = Date.now();
      const lastStr = localStorage.getItem(LAST_BACKUP_TIME_KEY);
      const lastTs = lastStr ? parseInt(lastStr, 10) : 0;
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      // If never backed up or 24 hours passed
      if (now - lastTs > TWENTY_FOUR_HOURS) {
        return this.createSnapshot();
      }
      return false;
    } catch (e) {
      console.warn('Auto backup check failed:', e);
      return false;
    }
  },

  /**
   * Creates an immediate snapshot in IndexedDB (with lightweight meta in index)
   */
  createSnapshot(): boolean {
    try {
      const today = getTodayDateString();
      const now = Date.now();
      const key = `snap_${today}_${now}`;

      const fullData = StorageService.exportAllData();
      const parsed = JSON.parse(fullData);

      const meta: AutoSnapshotMeta = {
        key,
        dateStr: today,
        timestamp: now,
        sizeBytes: new Blob([fullData]).size,
        recordCounts: {
          bookings: Array.isArray(parsed.bookings) ? parsed.bookings.length : 0,
          isolation: Array.isArray(parsed.isolationRooms) ? parsed.isolationRooms.length : 0,
          handovers: Array.isArray(parsed.handovers) ? parsed.handovers.length : 0,
          parcels: Array.isArray(parsed.parcels) ? parsed.parcels.length : 0,
        },
      };

      // 1. Store the full heavy payload in IndexedDB (bypasses 5MB limit)
      idbStorageService.saveSnapshot({
        key,
        dateStr: today,
        timestamp: now,
        sizeBytes: meta.sizeBytes,
        recordCounts: meta.recordCounts,
        payload: fullData,
      }).catch((err) => {
        console.warn('IndexedDB snapshot async save warning:', err);
      });

      // 2. Update lightweight metadata list in localStorage (few bytes only)
      const existingList = this.listSnapshots();
      const updatedList = [meta, ...existingList.filter((s) => s.key !== key)];
      
      // Enforce max retention
      if (updatedList.length > MAX_AUTO_SNAPSHOTS) {
        const excess = updatedList.slice(MAX_AUTO_SNAPSHOTS);
        excess.forEach((ex) => {
          idbStorageService.deleteSnapshot(ex.key).catch(() => {});
        });
        updatedList.length = MAX_AUTO_SNAPSHOTS;
      }

      localStorage.setItem(AUTO_BACKUP_INDEX_KEY, JSON.stringify(updatedList));
      localStorage.setItem(LAST_BACKUP_TIME_KEY, String(now));
      return true;
    } catch (e) {
      console.error('Failed to create snapshot:', e);
      return false;
    }
  },

  /**
   * Retrieves list of all available auto-snapshots from index
   */
  listSnapshots(): AutoSnapshotMeta[] {
    try {
      const raw = localStorage.getItem(AUTO_BACKUP_INDEX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => b.timestamp - a.timestamp);
        }
      }
    } catch (e) {}
    return [];
  },

  /**
   * Restores data from a specific snapshot key (from IndexedDB or memory)
   */
  async restoreSnapshotAsync(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stored = await idbStorageService.getSnapshot(key);
      if (!stored || !stored.payload) {
        return { success: false, error: 'Snapshot payload not found in durable storage.' };
      }
      return StorageService.importData(stored.payload);
    } catch (e: any) {
      return { success: false, error: e?.message || 'Restore error' };
    }
  },

  /**
   * Synchronous restore helper for backward compatibility
   */
  restoreSnapshot(key: string): { success: boolean; error?: string } {
    // Attempt async restore in background or from direct export
    this.restoreSnapshotAsync(key).then((res) => {
      if (res.success) {
        window.dispatchEvent(new CustomEvent('tamimi_storage_updated'));
      }
    });
    return { success: true };
  },

  /**
   * Download a specific snapshot as JSON
   */
  async downloadSnapshot(key: string) {
    try {
      const stored = await idbStorageService.getSnapshot(key);
      if (!stored) return;
      const blob = new Blob([stored.payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tamimi_auto_backup_${stored.dateStr || 'snapshot'}.json`;
      link.click();
    } catch (e) {
      console.error('Failed to download snapshot:', e);
    }
  },

  /**
   * Delete snapshot from both index and IndexedDB
   */
  deleteSnapshot(key: string) {
    try {
      idbStorageService.deleteSnapshot(key).catch(() => {});
      const list = this.listSnapshots().filter((s) => s.key !== key);
      localStorage.setItem(AUTO_BACKUP_INDEX_KEY, JSON.stringify(list));
    } catch (e) {}
  },
};


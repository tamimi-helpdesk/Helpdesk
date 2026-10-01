/**
 * ============================================================================
 * TAMIMI EXECUTIVE HELPDESK - ENTERPRISE BACKUP & SYSTEM RECOVERY SERVICE
 * ============================================================================
 * Provides 1-Click Full System Snapshots (.json), Safe Schema Validation,
 * LocalStorage Quota Diagnostics & Auto-Repair, and Resilient Disaster Recovery.
 * ============================================================================
 */

import { StorageService } from './storageService';
import { GasService } from './gasService';
import { AuthService } from './authService';
import { Booking, IsolationRoomRecord, HandoverItemRecord, ParcelRecord, LostFoundRecord, GasConnectionConfig, SecurityAuditEntry } from '../types';

export interface SystemBackupSnapshot {
  system: 'TAMIMI_EXECUTIVE_HELPDESK';
  version: '2.0';
  exportedAt: string;
  exportedBy: string;
  checksum: string;
  summary: {
    bookingsCount: number;
    isolationRoomsCount: number;
    handoversCount: number;
    parcelsCount: number;
    lostFoundCount: number;
    invoicesCount?: number;
    blankFormsCount?: number;
    noticesCount?: number;
    supportTicketsCount?: number;
    auditLogsCount: number;
  };
  data: {
    bookings: Booking[];
    isolationRooms: IsolationRoomRecord[];
    handovers: HandoverItemRecord[];
    parcels: ParcelRecord[];
    lostFound: LostFoundRecord[];
    invoices?: any[];
    blankForms?: any[];
    notices?: any[];
    supportTickets?: any[];
    gasConfig: GasConnectionConfig;
    auditLogs: SecurityAuditEntry[];
  };
}

export interface StorageDiagnostics {
  usedBytes: number;
  usedFormatted: string;
  estimatedLimitBytes: number;
  usagePercentage: number;
  health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  counts: {
    bookings: number;
    isolationRooms: number;
    handovers: number;
    parcels: number;
    lostFound: number;
    auditLogs: number;
    offlineQueue: number;
  };
}

function calculateSimpleChecksum(dataStr: string): string {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Recursively strips undefined properties from an object or array to ensure
 * data serialization and Firestore setDoc compatibility.
 */
export function sanitizeSnapshotData<T>(val: T): T {
  if (val === null || val === undefined) {
    return null as any;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeSnapshotData(item)) as any;
  }
  if (typeof val === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeSnapshotData(v);
      }
    }
    return cleaned as any;
  }
  return val;
}

export const BackupService = {
  /**
   * Generates a complete system snapshot JSON object
   */
  generateSnapshot(): SystemBackupSnapshot {
    const bookings = StorageService.getAllBookings();
    const isolationRooms = StorageService.getIsolationRooms();
    const handovers = StorageService.getHandoverRecords();
    const parcels = StorageService.getParcelRecords();
    const lostFound = StorageService.getLostFoundRecords();
    const invoices = StorageService.getInvoices();
    const blankForms = StorageService.getBlankForms();
    const notices = StorageService.getNotices();
    const supportTickets = StorageService.getSupportTickets();
    const gasConfig = GasService.getConfig();
    const auditLogs = AuthService.getSecurityAuditLogs();
    const username = AuthService.getUsername();

    const rawDataPayload = {
      bookings,
      isolationRooms,
      handovers,
      parcels,
      lostFound,
      invoices,
      blankForms,
      notices,
      supportTickets,
      gasConfig,
      auditLogs,
    };

    const cleanDataPayload = sanitizeSnapshotData(rawDataPayload);
    const dataString = JSON.stringify(cleanDataPayload);
    const checksum = calculateSimpleChecksum(dataString);

    const snapshot: SystemBackupSnapshot = {
      system: 'TAMIMI_EXECUTIVE_HELPDESK',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: username || 'Helpdesk Admin',
      checksum,
      summary: {
        bookingsCount: bookings.length,
        isolationRoomsCount: isolationRooms.length,
        handoversCount: handovers.length,
        parcelsCount: parcels.length,
        lostFoundCount: lostFound.length,
        invoicesCount: invoices.length,
        blankFormsCount: blankForms.length,
        noticesCount: notices.length,
        supportTicketsCount: supportTickets.length,
        auditLogsCount: auditLogs.length,
      },
      data: cleanDataPayload,
    };

    AuthService.logSecurityEvent(
      'CONFIG_UPDATED',
      `Full system backup exported (${bookings.length} bookings, ${handovers.length} handovers, ${parcels.length} parcels, ${lostFound.length} lost/found, ${invoices.length} invoices, ${supportTickets.length} tickets)`
    );

    return sanitizeSnapshotData(snapshot);
  },

  /**
   * Triggers download of the backup snapshot file
   */
  downloadBackupFile(): void {
    const snapshot = this.generateSnapshot();
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Tamimi_Helpdesk_Full_Backup_${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Validates a backup JSON string and returns summary or error
   */
  validateBackup(jsonStr: string): { valid: boolean; snapshot?: SystemBackupSnapshot; error?: string } {
    try {
      if (!jsonStr || typeof jsonStr !== 'string') {
        return { valid: false, error: 'Backup file is empty.' };
      }

      const parsed = JSON.parse(jsonStr) as SystemBackupSnapshot;
      if (!parsed || parsed.system !== 'TAMIMI_EXECUTIVE_HELPDESK' || !parsed.data) {
        return { valid: false, error: 'Invalid backup file structure. File is not a recognized Tamimi Helpdesk snapshot.' };
      }

      if (!Array.isArray(parsed.data.bookings) || !Array.isArray(parsed.data.isolationRooms)) {
        return { valid: false, error: 'Backup data format corrupted. Missing required collections.' };
      }

      return { valid: true, snapshot: parsed };
    } catch (e: any) {
      return { valid: false, error: `JSON Parse error: ${e.message || 'Corrupted file'}` };
    }
  },

  /**
   * Restores data from a validated backup snapshot
   */
  restoreSnapshot(snapshot: SystemBackupSnapshot, mode: 'merge' | 'replace' = 'replace'): { success: boolean; message: string } {
    try {
      const { data } = snapshot;

      // Create an automatic fallback safety backup of current state before overriding
      const preRestoreSafetyBackup = JSON.stringify(this.generateSnapshot());
      try {
        localStorage.setItem('tamimi_pre_restore_safety_snapshot_v1', preRestoreSafetyBackup);
      } catch (e) {}

      if (mode === 'replace') {
        // Replace all collections
        if (Array.isArray(data.bookings)) {
          StorageService.saveBookings(data.bookings);
        }
        if (Array.isArray(data.isolationRooms)) {
          StorageService.saveIsolationRooms(data.isolationRooms);
        }
        if (Array.isArray(data.handovers)) {
          StorageService.saveHandoverRecords(data.handovers);
        }
        if (Array.isArray(data.parcels)) {
          StorageService.saveParcelRecords(data.parcels);
        }
        if (Array.isArray(data.lostFound)) {
          StorageService.saveLostFoundRecords(data.lostFound);
        }
        if (Array.isArray(data.invoices)) {
          StorageService.saveInvoices(data.invoices);
        }
        if (Array.isArray(data.blankForms)) {
          StorageService.saveBlankForms(data.blankForms);
        }
        if (Array.isArray(data.notices)) {
          StorageService.saveNotices(data.notices);
        }
        if (Array.isArray(data.supportTickets)) {
          StorageService.saveSupportTickets(data.supportTickets);
        }
      } else {
        // Merge collections
        if (Array.isArray(data.bookings)) {
          StorageService.mergeRemoteBookings(data.bookings);
        }
        if (Array.isArray(data.isolationRooms)) {
          StorageService.mergeRemoteIsolationRooms(data.isolationRooms);
        }
        if (Array.isArray(data.handovers)) {
          StorageService.mergeRemoteHandovers(data.handovers);
        }
        if (Array.isArray(data.parcels)) {
          StorageService.mergeRemoteParcels(data.parcels);
        }
        if (Array.isArray(data.lostFound)) {
          StorageService.mergeRemoteLostFound(data.lostFound);
        }
        if (Array.isArray(data.invoices)) {
          StorageService.saveInvoices(data.invoices);
        }
        if (Array.isArray(data.blankForms)) {
          StorageService.saveBlankForms(data.blankForms);
        }
        if (Array.isArray(data.notices)) {
          StorageService.saveNotices(data.notices);
        }
        if (Array.isArray(data.supportTickets)) {
          StorageService.saveSupportTickets(data.supportTickets);
        }
      }

      if (data.gasConfig && data.gasConfig.webAppUrl) {
        GasService.saveConfig(data.gasConfig);
      }

      AuthService.logSecurityEvent(
        'CONFIG_UPDATED',
        `System restored from backup (${snapshot.exportedAt}) in ${mode.toUpperCase()} mode.`
      );

      // Trigger all listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
        window.dispatchEvent(new CustomEvent('tamimi_isolation_updated'));
        window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
        window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
        window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
        window.dispatchEvent(new CustomEvent('invoices_updated'));
        window.dispatchEvent(new CustomEvent('blank_forms_updated'));
        window.dispatchEvent(new CustomEvent('notices_updated'));
        window.dispatchEvent(new CustomEvent('tickets_updated'));
      }

      return {
        success: true,
        message: `System successfully restored ${snapshot.summary.bookingsCount} bookings, ${snapshot.summary.handoversCount} handovers, ${snapshot.summary.parcelsCount} parcels, and ${snapshot.summary.lostFoundCount} lost & found items.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to restore system: ${err.message || 'Unknown error'}`,
      };
    }
  },

  /**
   * Computes storage quota, capacity usage and health
   */
  getStorageDiagnostics(): StorageDiagnostics {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2; // UTF-16 characters = 2 bytes
        }
      }
    } catch (e) {}

    const estimatedLimitBytes = 5 * 1024 * 1024; // 5 MB typical localStorage quota
    const usagePercentage = Math.min(100, Math.round((totalBytes / estimatedLimitBytes) * 100));

    let health: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (usagePercentage > 85) health = 'CRITICAL';
    else if (usagePercentage > 60) health = 'WARNING';

    const bookings = StorageService.getAllBookings();
    const isolationRooms = StorageService.getIsolationRooms();
    const handovers = StorageService.getHandoverRecords();
    const parcels = StorageService.getParcelRecords();
    const lostFound = StorageService.getLostFoundRecords();
    const auditLogs = AuthService.getSecurityAuditLogs();

    let offlineQueueCount = 0;
    try {
      const qStr = localStorage.getItem('tamimi_offline_sync_queue_v1');
      if (qStr) {
        const q = JSON.parse(qStr);
        if (Array.isArray(q)) offlineQueueCount = q.length;
      }
    } catch (e) {}

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return {
      usedBytes: totalBytes,
      usedFormatted: formatBytes(totalBytes),
      estimatedLimitBytes,
      usagePercentage,
      health,
      counts: {
        bookings: bookings.length,
        isolationRooms: isolationRooms.length,
        handovers: handovers.length,
        parcels: parcels.length,
        lostFound: lostFound.length,
        auditLogs: auditLogs.length,
        offlineQueue: offlineQueueCount,
      },
    };
  },
};

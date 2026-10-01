import { FacilityLockdown } from '../types';
import { AuthService } from './authService';

const LOCKDOWN_STORAGE_KEY = 'tamimi_facility_lockdowns_v1';

export const FacilityLockdownService = {
  /**
   * Get all stored facility lockdowns
   */
  getAllLockdowns(): FacilityLockdown[] {
    try {
      const raw = localStorage.getItem(LOCKDOWN_STORAGE_KEY);
      if (!raw) return [];
      const list: FacilityLockdown[] = JSON.parse(raw);
      if (!Array.isArray(list)) return [];

      const now = Date.now();
      // Filter out auto-expired lockdowns
      const validList = list.filter((item) => {
        if (!item.isLocked) return false;
        if (item.unlockAt) {
          const unlockTime = new Date(item.unlockAt).getTime();
          if (now >= unlockTime) {
            return false; // Expired
          }
        }
        return true;
      });

      // If any expired, update storage
      if (validList.length !== list.length) {
        localStorage.setItem(LOCKDOWN_STORAGE_KEY, JSON.stringify(validList));
        window.dispatchEvent(new CustomEvent('tamimi_lockdown_updated'));
      }

      return validList;
    } catch (e) {
      console.warn('Failed to parse lockdowns', e);
      return [];
    }
  },

  /**
   * Check if a specific facility is locked
   */
  getFacilityLockdown(facilityId: string): FacilityLockdown | null {
    const list = this.getAllLockdowns();
    // 1. Check Global Emergency lockdown
    const globalLock = list.find((l) => l.facilityId === 'ALL' && l.isLocked);
    if (globalLock) return globalLock;

    // 2. Check specific facility lockdown
    const target = list.find((l) => l.facilityId === facilityId && l.isLocked);
    return target || null;
  },

  /**
   * Check if facility is blocked for standard users
   * Returns { isBlocked: boolean; lockdown: FacilityLockdown | null; isBypassed: boolean }
   */
  isFacilityBlocked(facilityId: string): {
    isBlocked: boolean;
    lockdown: FacilityLockdown | null;
    isBypassed: boolean;
  } {
    const lockdown = this.getFacilityLockdown(facilityId);
    if (!lockdown) {
      return { isBlocked: false, lockdown: null, isBypassed: false };
    }

    const isSupreme = AuthService.isSupremeAdmin();
    if (isSupreme && lockdown.allowSupremeAdminBypass) {
      return { isBlocked: false, lockdown, isBypassed: true };
    }

    return { isBlocked: true, lockdown, isBypassed: false };
  },

  /**
   * Lock a specific facility with duration in minutes (or null for indefinite) and reason
   */
  lockFacility(
    facilityId: string,
    facilityName: string,
    durationMinutes: number | null,
    reason: string,
    customUnlockDateStr?: string
  ): { success: boolean; lockdown: FacilityLockdown } {
    const list = this.getAllLockdowns().filter((l) => l.facilityId !== facilityId);
    const now = new Date();
    
    let unlockAt: string | null = null;
    let durationLabel = 'Until manual reopen';

    if (customUnlockDateStr) {
      unlockAt = new Date(customUnlockDateStr).toISOString();
      durationLabel = `Until ${new Date(customUnlockDateStr).toLocaleString()}`;
    } else if (durationMinutes !== null && durationMinutes > 0) {
      const unlockTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
      unlockAt = unlockTime.toISOString();
      if (durationMinutes < 60) {
        durationLabel = `${durationMinutes} Minutes`;
      } else if (durationMinutes === 60) {
        durationLabel = `1 Hour`;
      } else if (durationMinutes < 1440) {
        durationLabel = `${Math.round(durationMinutes / 60)} Hours`;
      } else {
        durationLabel = `${Math.round(durationMinutes / 1440)} Days`;
      }
    }

    const newLockdown: FacilityLockdown = {
      facilityId,
      facilityName,
      isLocked: true,
      lockedBy: AuthService.getUsername() || 'limon.voice@gmail.com',
      lockedAt: now.toISOString(),
      unlockAt,
      durationLabel,
      reason: reason.trim() || 'Scheduled Supreme Admin Maintenance & Inspection',
      allowSupremeAdminBypass: true,
    };

    list.push(newLockdown);
    localStorage.setItem(LOCKDOWN_STORAGE_KEY, JSON.stringify(list));
    AuthService.logSecurityEvent(
      'MAINTENANCE_BLOCKED',
      `Facility '${facilityName}' locked by Supreme Admin for ${durationLabel}. Reason: ${newLockdown.reason}`
    );
    window.dispatchEvent(new CustomEvent('tamimi_lockdown_updated', { detail: newLockdown }));

    return { success: true, lockdown: newLockdown };
  },

  /**
   * Unlock a specific facility
   */
  unlockFacility(facilityId: string): { success: boolean; message: string } {
    const list = this.getAllLockdowns().filter((l) => l.facilityId !== facilityId);
    localStorage.setItem(LOCKDOWN_STORAGE_KEY, JSON.stringify(list));
    AuthService.logSecurityEvent('MAINTENANCE_UNBLOCKED', `Facility '${facilityId}' unlocked by Supreme Admin.`);
    window.dispatchEvent(new CustomEvent('tamimi_lockdown_updated', { detail: { facilityId, unlocked: true } }));
    return { success: true, message: `Facility unlocked and reopened for public reservations.` };
  },

  /**
   * Emergency Global Lockdown: Lock ALL 20 facilities at once
   */
  lockAllFacilities(durationMinutes: number | null, reason: string): { success: boolean; lockdown: FacilityLockdown } {
    return this.lockFacility('ALL', 'All 20 Camp Facilities', durationMinutes, reason || 'Emergency Camp-Wide Suspension by Supreme Admin');
  },

  /**
   * Unlock Global Emergency Lockdown
   */
  unlockAllFacilities(): { success: boolean; message: string } {
    localStorage.removeItem(LOCKDOWN_STORAGE_KEY);
    AuthService.logSecurityEvent('MAINTENANCE_UNBLOCKED', `All facilities unlocked globally by Supreme Admin.`);
    window.dispatchEvent(new CustomEvent('tamimi_lockdown_updated', { detail: { facilityId: 'ALL', unlocked: true } }));
    return { success: true, message: `All facilities have been unlocked and restored!` };
  },

  /**
   * Get remaining time string formatted for countdown
   */
  getRemainingTimeString(unlockAtStr: string | null): string {
    if (!unlockAtStr) return 'Until manual reopen';
    const now = Date.now();
    const unlockTime = new Date(unlockAtStr).getTime();
    const diffMs = unlockTime - now;
    if (diffMs <= 0) return 'Expiring now';

    const diffMins = Math.ceil(diffMs / (60 * 1000));
    if (diffMins < 60) return `${diffMins}m remaining`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours < 24) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''} remaining`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours > 0 ? `${remHours}h` : ''} remaining`;
  },
};

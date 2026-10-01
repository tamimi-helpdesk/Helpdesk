/**
 * Atomic Slot Lock & Concurrency Manager
 * Prevents race conditions when multiple operators attempt to book the same slot simultaneously.
 * Holds a transient 2-minute soft lock with automatic TTL release.
 */

export interface SlotLock {
  slotKey: string; // e.g. "facilityId_date_stage_startTime"
  lockedBy: string; // Staff username or session ID
  lockedByName: string;
  lockedAt: number; // Timestamp
  expiresAt: number; // Timestamp (now + 2 minutes)
}

const LOCK_STORAGE_KEY = 'tamimi_slot_concurrency_locks_v1';
const LOCK_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getLocks(): Record<string, SlotLock> {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!raw) return {};
    const parsed: Record<string, SlotLock> = JSON.parse(raw);
    const now = Date.now();
    const clean: Record<string, SlotLock> = {};
    
    // Purge expired locks automatically
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] && parsed[key].expiresAt > now) {
        clean[key] = parsed[key];
      }
    });
    return clean;
  } catch (e) {
    return {};
  }
}

function saveLocks(locks: Record<string, SlotLock>) {
  try {
    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(locks));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('tamimi_slot_locks_channel');
      bc.postMessage({ type: 'LOCKS_CHANGED', timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {}
}

export const SlotLockService = {
  getSlotKey(facilityId: string, date: string, stage: string, startTime: string): string {
    const cleanStage = (stage || 'main').toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${facilityId}_${date}_${cleanStage}_${startTime}`.toLowerCase();
  },

  /**
   * Attempts to acquire an atomic lock for a slot.
   * Returns { success: true } or { success: false, lockedBy: 'User Name', remainingSecs: 45 }
   */
  acquireLock(
    facilityId: string,
    date: string,
    stage: string,
    startTime: string,
    username: string,
    fullName: string
  ): { success: boolean; lockedByName?: string; remainingSeconds?: number } {
    const key = this.getSlotKey(facilityId, date, stage, startTime);
    const locks = getLocks();
    const now = Date.now();
    const currentLock = locks[key];

    // If lock exists and hasn't expired and belongs to someone else
    if (currentLock && currentLock.expiresAt > now && currentLock.lockedBy.toLowerCase() !== username.toLowerCase()) {
      const remainingSeconds = Math.max(1, Math.ceil((currentLock.expiresAt - now) / 1000));
      return {
        success: false,
        lockedByName: currentLock.lockedByName || currentLock.lockedBy,
        remainingSeconds,
      };
    }

    // Acquire or refresh lock
    locks[key] = {
      slotKey: key,
      lockedBy: username,
      lockedByName: fullName || username,
      lockedAt: now,
      expiresAt: now + LOCK_TTL_MS,
    };

    saveLocks(locks);
    return { success: true };
  },

  /**
   * Release lock once booking is completed or cancelled
   */
  releaseLock(facilityId: string, date: string, stage: string, startTime: string, username?: string) {
    const key = this.getSlotKey(facilityId, date, stage, startTime);
    const locks = getLocks();
    if (locks[key]) {
      // If username provided, only release if owned
      if (!username || locks[key].lockedBy.toLowerCase() === username.toLowerCase()) {
        delete locks[key];
        saveLocks(locks);
      }
    }
  },

  /**
   * Check if a slot is currently locked by someone else
   */
  isSlotLocked(
    facilityId: string,
    date: string,
    stage: string,
    startTime: string,
    currentUsername?: string
  ): { isLocked: boolean; lockedByName?: string; remainingSeconds?: number } {
    const key = this.getSlotKey(facilityId, date, stage, startTime);
    const locks = getLocks();
    const now = Date.now();
    const currentLock = locks[key];

    if (!currentLock || currentLock.expiresAt <= now) {
      return { isLocked: false };
    }

    if (currentUsername && currentLock.lockedBy.toLowerCase() === currentUsername.toLowerCase()) {
      return { isLocked: false }; // Owned by current user
    }

    return {
      isLocked: true,
      lockedByName: currentLock.lockedByName || currentLock.lockedBy,
      remainingSeconds: Math.max(1, Math.ceil((currentLock.expiresAt - now) / 1000)),
    };
  },

  /**
   * Clears all locks (e.g. on emergency admin reset)
   */
  clearAllLocks() {
    try {
      localStorage.removeItem(LOCK_STORAGE_KEY);
    } catch (e) {}
  },
};

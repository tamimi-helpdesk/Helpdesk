import {
  Booking,
  Facility,
  TimeSlot,
  IsolationRoomRecord,
  BedOccupant,
  HandoverItemRecord,
  ParcelRecord,
  LostFoundRecord,
  SlotBlockoutRecord,
  ShiftClosingSummary,
  CancellationLogEntry,
} from '../types';
import { SAMPLE_BOOKINGS } from '../data/sampleBookings';
import { FACILITIES } from '../data/facilities';
import { INITIAL_ISOLATION_ROOMS } from '../data/initialIsolationRooms';
import { INITIAL_HANDOVER_RECORDS } from '../data/initialHandoverData';
import { INITIAL_PARCEL_RECORDS } from '../data/initialParcelData';
import { INITIAL_LOST_FOUND_RECORDS } from '../data/initialLostFoundData';
import { AuthService } from './authService';
import { OfflineQueueService } from './offlineQueueService';
import { FacilityLockdownService } from './facilityLockdownService';
import { idbStorageService } from './idbStorageService';
import { TicketService } from './ticketService';

const STORAGE_KEY = 'executive_facility_bookings_v1';
const GAS_CONFIG_KEY = 'executive_gas_config_v1';
const CANCELLED_CACHE_KEY = 'executive_facility_cancelled_ids_v1';
const CANCELLATION_LOGS_KEY = 'executive_facility_cancellation_logs_v1';
const CANCELLATION_RETENTION_DAYS_KEY = 'executive_facility_cancellation_retention_days';
const ISOLATION_ROOMS_KEY = 'executive_facility_isolation_rooms_v4';
const HANDOVER_RECORDS_KEY = 'executive_facility_handover_records_v1';
const PARCEL_RECORDS_KEY = 'executive_facility_parcel_records_v1';
const LOST_FOUND_RECORDS_KEY = 'executive_facility_lost_found_records_v1';
const SLOT_BLOCKOUTS_KEY = 'executive_facility_blockouts_v1';

// In-memory cache for ultra-fast sub-millisecond lookups
let inMemoryBookings: Booking[] = [];
let inMemoryIsolationRooms: IsolationRoomRecord[] = [];
let inMemoryHandovers: HandoverItemRecord[] = [];
let inMemoryParcels: ParcelRecord[] = [];
let inMemoryLostFound: LostFoundRecord[] = [];
let inMemoryBlockouts: SlotBlockoutRecord[] = [];

let isInitialized = false;
let isIsolationInitialized = false;
let isHandoverInitialized = false;
let isParcelInitialized = false;
let isLostFoundInitialized = false;
let isBlockoutsInitialized = false;
let lastSyncChangesCount = 0;

// Enterprise Storage Safety: Safe LocalStorage Writer with Quota Exceeded Protection & Memory Fallback
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`LocalStorage write warning for ${key}:`, e);
    // If quota exceeded, aggressively clean old snapshots and temporary caches
    try {
      // 1. Remove legacy large snapshots
      const legacyKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tamimi_auto_snapshot_')) {
          legacyKeys.push(k);
        }
      }
      legacyKeys.forEach((k) => localStorage.removeItem(k));

      // 2. Clear temp caches
      localStorage.removeItem('tamimi_temp_audit_cache');
      localStorage.removeItem('tamimi_analytics_cache_v1');

      // 3. Retry setting item
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.error(`LocalStorage Quota Exceeded! Failed to persist ${key}. State preserved in memory & IndexedDB backup.`, retryErr);
      // Asynchronously store backup in IndexedDB so data is never permanently lost
      idbStorageService.saveAsset({
        id: `ls_overflow_${key}`,
        category: 'general',
        mimeType: 'application/json',
        dataUrl: value,
        createdAt: Date.now(),
      }).catch(() => {});
      return false;
    }
  }
}

const DELETED_CACHE_KEY = 'executive_facility_deleted_ids_v1';

// Track cancelled IDs persistently (30-day retention) so cancelled bookings NEVER resurrect as CONFIRMED on sync
export function getRecentCancelledMap(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const raw = localStorage.getItem(CANCELLED_CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      Object.keys(obj).forEach((id) => {
        if (now - obj[id] < THIRTY_DAYS_MS) {
          map.set(id.toLowerCase().trim(), obj[id]);
        }
      });
    }
  } catch (e) {}
  return map;
}

export function recordRecentCancellation(bookingId: string, reason?: string) {
  if (!bookingId) return;
  try {
    const cleanId = bookingId.toLowerCase().trim();
    const map = getRecentCancelledMap();
    map.set(cleanId, Date.now());
    const obj: Record<string, number> = {};
    map.forEach((val, key) => {
      obj[key] = val;
    });
    safeSetLocalStorage(CANCELLED_CACHE_KEY, JSON.stringify(obj));

    // Send instant cancel mutation to Hub in background
    if (typeof fetch !== 'undefined') {
      fetch('/api/hub/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mutationType: 'CANCEL',
          entity: 'bookings',
          id: cleanId,
          reason: reason || 'Cancelled by user',
        }),
      }).catch(() => {});
    }
  } catch (e) {}
}

// Track permanently deleted IDs (30-day retention) so deleted records NEVER return during sync
export function getDeletedIdsMap(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = localStorage.getItem(DELETED_CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      Object.keys(obj).forEach((id) => {
        if (now - obj[id] < THIRTY_DAYS_MS) {
          set.add(id.toLowerCase().trim());
        }
      });
    }
  } catch (e) {}
  return set;
}

export function recordDeletedId(id: string, entity: string = 'general') {
  if (!id) return;
  try {
    const cleanId = String(id).toLowerCase().trim();
    const set = getDeletedIdsMap();
    set.add(cleanId);
    const obj: Record<string, number> = {};
    set.forEach((key) => {
      obj[key] = Date.now();
    });
    safeSetLocalStorage(DELETED_CACHE_KEY, JSON.stringify(obj));

    // Send instant delete mutation to Hub in background
    if (typeof fetch !== 'undefined') {
      fetch('/api/hub/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mutationType: 'DELETE',
          entity,
          id: cleanId,
        }),
      }).catch(() => {});
    }
  } catch (e) {}
}

export function unrecordDeletedId(id: string) {
  if (!id) return;
  try {
    const cleanId = String(id).toLowerCase().trim();
    const set = getDeletedIdsMap();
    if (set.has(cleanId)) {
      set.delete(cleanId);
      const obj: Record<string, number> = {};
      set.forEach((key) => {
        obj[key] = Date.now();
      });
      safeSetLocalStorage(DELETED_CACHE_KEY, JSON.stringify(obj));
    }
  } catch (e) {}
}

export function isIdDeleted(id: string): boolean {
  if (!id) return false;
  const cleanId = String(id).toLowerCase().trim();
  const set = getDeletedIdsMap();
  return set.has(cleanId);
}

export function isRecentlyCancelled(id: string): boolean {
  if (!id) return false;
  const cleanId = String(id).toLowerCase().trim();
  const map = getRecentCancelledMap();
  return map.has(cleanId);
}

export function isDeleted(entityOrId: string, secondaryId?: string): boolean {
  if (secondaryId) {
    return isIdDeleted(secondaryId);
  }
  return isIdDeleted(entityOrId);
}

// Helper to get local today date YYYY-MM-DD (immune to UTC timezone shift)
export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Convert any time format to minutes from midnight (0..1440)
export function timeToMinutes(timeStr: any): number {
  if (timeStr === null || timeStr === undefined || timeStr === '') return 0;
  const normalized = normalizeTimeString(timeStr);
  const [hours, minutes] = normalized.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Helper to convert minutes to "HH:MM" 24-hour format
export function minutesToTime(minutes: number): string {
  const safeMin = Math.max(0, Math.min(1439, minutes));
  const h = Math.floor(safeMin / 60);
  const m = safeMin % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatDisplayTime(timeStr: any): string {
  if (!timeStr) return '';
  const normalized = normalizeTimeString(timeStr);
  const [hStr, mStr] = normalized.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return String(timeStr);
  const m = mStr ? mStr.substring(0, 2) : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

// Normalize ANY time input (12hr AM/PM, 24hr, ISO string, Sheets date string, decimal day) to "HH:MM"
export function normalizeTimeString(rawTime: any): string {
  if (rawTime === null || rawTime === undefined) return '00:00';

  // If number (e.g. fractional day in Excel/Sheets, 0.604166666 = 14:30)
  if (typeof rawTime === 'number') {
    if (rawTime >= 0 && rawTime <= 1) {
      const totalMinutes = Math.round(rawTime * 24 * 60);
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  const str = String(rawTime).trim();
  if (!str) return '00:00';

  // 1. Check for 12-hour format with AM/PM anywhere in string: e.g. "2:30 PM", "02:30:00 PM", "2:30pm"
  const ampmMatch = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2].padStart(2, '0');
    const meridian = ampmMatch[3].toUpperCase();

    if (meridian === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridian === 'AM' && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // 2. Check for time in ISO or Date string like "Sat Dec 30 1899 14:30:00" or "T14:30:00"
  // Extract literal HH:mm without applying timezone conversions!
  const timeInDateMatch = str.match(/(?:[T\s]|^)(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (timeInDateMatch) {
    const hours = parseInt(timeInDateMatch[1], 10);
    const minutes = timeInDateMatch[2].padStart(2, '0');
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  return str;
}

// Day of week helper for YYYY-MM-DD strings (safe from timezone shift)
export function getDayName(dateStr: string, short: boolean = false): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return '';
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
  } catch {
    return '';
  }
}

export function getDayIndex(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getDay(); // 0 is Sunday, 6 is Saturday
  } catch {
    return 0;
  }
}

// Returns unique day indices (0..6) spanned by a start and end date
export function getDaysSpannedByRange(startDate: string, endDate: string): number[] {
  if (!startDate || !endDate) return [];
  try {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    if (start > end) return [];

    const set = new Set<number>();
    const curr = new Date(start);
    let count = 0;
    while (curr <= end && count < 120) {
      set.add(curr.getDay());
      curr.setDate(curr.getDate() + 1);
      count++;
    }
    return Array.from(set).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

// Format full date with day name: e.g. "25 Aug 2026 (Tuesday)" or "2026-08-25, Tuesday"
export function formatDisplayDate(
  dateStr: string,
  options?: { showDayName?: boolean; short?: boolean; includeYear?: boolean }
): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    const dayName = dateObj.toLocaleDateString('en-US', {
      weekday: options?.short ? 'short' : 'long',
    });
    const monthName = dateObj.toLocaleDateString('en-US', {
      month: options?.short ? 'short' : 'long',
    });
    const yearStr = options?.includeYear !== false ? ` ${y}` : '';

    if (options?.showDayName === false) {
      return `${d} ${monthName}${yearStr}`;
    }

    return `${d} ${monthName}${yearStr} (${dayName})`;
  } catch {
    return dateStr;
  }
}

export function normalizeDateString(rawDate: any): string {
  if (!rawDate && rawDate !== 0) return getTodayDateString();
  
  if (rawDate instanceof Date) {
    const y = rawDate.getFullYear();
    const m = (rawDate.getMonth() + 1).toString().padStart(2, '0');
    const d = rawDate.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle Excel/Google Sheet numeric serial dates (e.g. 45000 to 50000 for 2023-2035)
  if (typeof rawDate === 'number' && rawDate > 30000 && rawDate < 70000) {
    try {
      const utcDays = rawDate - 25569;
      // Add 12 hours (43200000 ms) so time is positioned at noon UTC, avoiding any edge shifts
      const targetDate = new Date(utcDays * 86400 * 1000 + 43200000);
      if (!isNaN(targetDate.getTime())) {
        const y = targetDate.getUTCFullYear();
        const m = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const d = targetDate.getUTCDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch (e) {}
  }

  const str = String(rawDate).trim();
  if (!str || str.toLowerCase() === 'date' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return getTodayDateString();
  }

  const cleanStr = str.replace(/^['"`\s]+/, '').replace(/['"`\s]+$/, '');

  // 1. Direct standard YYYY-MM-DD pattern (e.g. "2026-08-25" or "2026-08-25T18:00:00.000Z" or "2026/08/25" or "'2026-08-25")
  // Extract the exact calendar date directly without shifting timezone or modifying past/future dates!
  const isoMatch = cleanStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Month name in English string: e.g. "Tue Aug 25 2026" or "25 Aug 2026" or "August 25, 2026"
  const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  const monthNameMatch1 = cleanStr.match(/(?:[A-Za-z]{3,9}\s+)?([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(\d{4})/i);
  if (monthNameMatch1) {
    const monthKey = monthNameMatch1[1].toLowerCase();
    if (MONTHS[monthKey]) {
      const m = MONTHS[monthKey];
      const d = monthNameMatch1[2].padStart(2, '0');
      const y = monthNameMatch1[3];
      return `${y}-${m}-${d}`;
    }
  }

  const monthNameMatch2 = cleanStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:,\s*|\s+)(\d{4})/i);
  if (monthNameMatch2) {
    const monthKey = monthNameMatch2[2].toLowerCase();
    if (MONTHS[monthKey]) {
      const d = monthNameMatch2[1].padStart(2, '0');
      const m = MONTHS[monthKey];
      const y = monthNameMatch2[3];
      return `${y}-${m}-${d}`;
    }
  }

  // 3. DD/MM/YYYY or MM/DD/YYYY detection
  const slashMatch = cleanStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (slashMatch) {
    const num1 = parseInt(slashMatch[1], 10);
    const num2 = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];

    // If first number > 12, it must be DD/MM/YYYY
    if (num1 > 12) {
      const d = num1.toString().padStart(2, '0');
      const m = num2.toString().padStart(2, '0');
      return `${year}-${m}-${d}`;
    }
    // If second number > 12, it must be MM/DD/YYYY
    if (num2 > 12) {
      const m = num1.toString().padStart(2, '0');
      const d = num2.toString().padStart(2, '0');
      return `${year}-${m}-${d}`;
    }
    // Default to DD-MM-YYYY (international standard)
    const d = num1.toString().padStart(2, '0');
    const m = num2.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  return cleanStr;
}

export function getCanonicalRoomNumber(input?: string | number): string {
  if (!input && input !== 0) return '';
  const s = String(input).toUpperCase().trim();
  
  // 1. Direct regex for Building R / Room R / ISO-R / R-01..R-06 / R1..R6
  const rMatch = s.match(/(?:BUILDING\s*R|ROOM\s*R|ISO-?R|R)[\s\-_#]*0?([1-6])(?![0-9])/i);
  if (rMatch) {
    const num = rMatch[1].padStart(2, '0');
    return `R-${num}`;
  }

  // 2. Direct regex for Building B / Room B / ISO-B / B-01..B-06 / B1..B6
  const bMatch = s.match(/(?:BUILDING\s*B|ROOM\s*B|ISO-?B|B)[\s\-_#]*0?([1-6])(?![0-9])/i);
  if (bMatch) {
    const num = bMatch[1].padStart(2, '0');
    return `B-${num}`;
  }

  // 3. Digits only: 1-6 -> R-01..R-06, 7-12 -> B-01..B-06
  const numOnlyMatch = s.match(/^0?([1-9]|1[0-2])$/);
  if (numOnlyMatch) {
    const n = parseInt(numOnlyMatch[1], 10);
    if (n <= 6) return `R-0${n}`;
    return `B-0${n - 6}`;
  }

  return s;
}

export function resolveFacilityId(nameOrTab?: string): string {
  if (!nameOrTab) return 'barber-booking';
  const s = String(nameOrTab).toLowerCase().trim();
  if (s.includes('barber') || s === 'bb') return 'barber-booking';
  if (s.includes('football') || s === 'fg') return 'football-ground';
  if (s.includes('cricket') && s.includes('net')) return 'cricket-net';
  if (s.includes('cricket') || s === 'cg') return 'cricket-ground';
  if (s.includes('multipurpose') || s.includes('multi') || s === 'mr') return 'multipurpose-room';
  if (s.includes('cinema') || s.includes('movie') || s === 'cn') return 'cinema';
  if (s.includes('tennis') || s === 'tc') return 'tennis-court';
  if (s.includes('basket') || s === 'bc') return 'basketball-court';
  if (s.includes('isolation') || s.includes('iso') || s === 'iso' || s.includes('quarantine') || s.includes('hospital')) return 'isolation-room';
  return nameOrTab;
}

export function isFacilityMatch(b: Booking, facility: Facility): boolean {
  if (!b || !facility) return false;
  const targetId = facility.id.toLowerCase().trim();
  const bId = (b.facilityId || '').toLowerCase().trim();
  const bTab = (b.sheetTabName || '').toLowerCase().trim();
  const bName = (b.facilityName || '').toLowerCase().trim();
  const facName = facility.name.toLowerCase().trim();
  const facTab = (facility.sheetTabName || '').toLowerCase().trim();

  if (bId === targetId) return true;
  if (resolveFacilityId(bId) === targetId) return true;
  if (resolveFacilityId(bTab) === targetId) return true;
  if (resolveFacilityId(bName) === targetId) return true;
  if (bTab && facTab && (bTab === facTab || bTab.includes(facTab) || facTab.includes(bTab))) return true;
  if (bName && facName && (bName === facName || bName.includes(facName) || facName.includes(bName))) return true;

  return false;
}

export function isStageMatch(bookingStage?: string, selectedStage?: string, facility?: Facility): boolean {
  if (!selectedStage) return true;
  if (!bookingStage) return true;
  
  const bs = bookingStage.toLowerCase().trim();
  const ss = selectedStage.toLowerCase().trim();
  
  if (bs === ss) return true;
  if (bs === '' || bs === 'default' || bs === 'main' || bs === 'n/a' || bs === 'all' || bs === 'general') return true;
  if (ss === '' || ss === 'default' || ss === 'main' || ss === 'n/a' || ss === 'all' || ss === 'general') return true;
  
  // If facility has only 1 stage (like Cinema), all bookings for that facility belong to it
  if (facility && facility.stages && facility.stages.length <= 1) {
    return true;
  }

  // 1. Identifying numbers conflict check (e.g., "1" vs "2", "1" vs "10")
  const bNum = bs.match(/(?:stage|room|court|area|pitch|net|chair|table|lane|bed|ground|wicket|bay|unit)?\s*([0-9]+[a-z]?)/i);
  const sNum = ss.match(/(?:stage|room|court|area|pitch|net|chair|table|lane|bed|ground|wicket|bay|unit)?\s*([0-9]+[a-z]?)/i);
  if (bNum && sNum) {
    if (bNum[1].toLowerCase() !== sNum[1].toLowerCase()) {
      return false; // Different identifiers can NEVER match (e.g., Room 1 vs Room 10, Ground 1 vs Ground 2)
    }
  }

  // 2. Letter conflicts (e.g. Court A vs Court B)
  const bLetter = bs.match(/(?:court|stage|room|area|pitch|net|chair|table|ground)\s*([a-z])\b/i);
  const sLetter = ss.match(/(?:court|stage|room|area|pitch|net|chair|table|ground)\s*([a-z])\b/i);
  if (bLetter && sLetter && bLetter[1].toLowerCase() !== sLetter[1].toLowerCase()) {
    return false;
  }

  // 3. Half pitch / North / South / East / West / 3A / 3B / Full court conflicts
  if ((bs.includes('north') && ss.includes('south')) || (bs.includes('south') && ss.includes('north'))) return false;
  if ((bs.includes('east') && ss.includes('west')) || (bs.includes('west') && ss.includes('east'))) return false;
  if ((bs.includes('3a') && ss.includes('3b')) || (bs.includes('3b') && ss.includes('3a'))) return false;
  if ((bs.includes('full court') && (ss.includes('half court') || ss.includes('ring'))) ||
      (ss.includes('full court') && (bs.includes('half court') || bs.includes('ring')))) {
    return false;
  }

  // Check whole word inclusion (so "ground 10" won't match "ground 1")
  const escapedSs = ss.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedBs = bs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ssWordRegex = new RegExp(`(?:^|\\b)${escapedSs}(?:\\b|$)`, 'i');
  const bsWordRegex = new RegExp(`(?:^|\\b)${escapedBs}(?:\\b|$)`, 'i');
  if (ssWordRegex.test(bs) || bsWordRegex.test(ss)) {
    return true;
  }

  if (bNum && sNum && bNum[1].toLowerCase() === sNum[1].toLowerCase()) {
    return true;
  }

  return false;
}

export function notifyBookingsChanged() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('tamimi_helpdesk_sync_channel');
        bc.postMessage({ type: 'BOOKINGS_UPDATED', timestamp: Date.now() });
        bc.close();
      }
    }
  } catch (e) {}
}

export function sanitizeBooking(raw: any, index: number = 0): Booking {
  let rawDate = raw.date;
  const rawId = String(raw.id || '').trim();

  // If date is missing/empty, attempt extracting date from rawId, notes or createdAt
  if (!rawDate || String(rawDate).trim() === '') {
    const idDateMatch = rawId.match(/(\d{4})(\d{2})(\d{2})/);
    if (idDateMatch) {
      const iy = parseInt(idDateMatch[1], 10);
      const im = parseInt(idDateMatch[2], 10);
      const id = parseInt(idDateMatch[3], 10);
      if (iy >= 2024 && iy <= 2035 && im >= 1 && im <= 12 && id >= 1 && id <= 31) {
        rawDate = `${iy}-${String(im).padStart(2, '0')}-${String(id).padStart(2, '0')}`;
      }
    }
  }

  const dateStr = normalizeDateString(rawDate);
  const startTime = normalizeTimeString(raw.startTime);
  const endTime = normalizeTimeString(raw.endTime);
  const id = String(raw.id || `BK-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`);
  const sheetTabName = String(raw.sheetTabName || raw.facilityName || 'Barber Booking');
  const facilityId = raw.facilityId || resolveFacilityId(sheetTabName || raw.facilityName);

  const rawStatus = String(raw.status || '').toUpperCase().trim();
  const isCancelled =
    rawStatus === 'CANCELLED' ||
    rawStatus === 'CANCELED' ||
    rawStatus === 'REJECTED' ||
    rawStatus === 'VOID';

  return {
    ...raw,
    id,
    facilityId,
    date: dateStr,
    startTime,
    endTime,
    customerName: AuthService.sanitizeText(String(raw.customerName || 'Reserved')),
    phoneNumber: AuthService.sanitizeText(String(raw.phoneNumber || '')),
    bookedByStaff: raw.bookedByStaff ? AuthService.sanitizeText(String(raw.bookedByStaff)) : (raw.bookedByEmployee ? AuthService.sanitizeText(String(raw.bookedByEmployee)) : undefined),
    email: raw.email ? AuthService.sanitizeText(String(raw.email)) : undefined,
    departmentOrTeam: raw.departmentOrTeam ? AuthService.sanitizeText(String(raw.departmentOrTeam)) : undefined,
    notes: raw.notes ? AuthService.sanitizeText(String(raw.notes)) : undefined,
    stage: String(raw.stage || 'Stage 1'),
    status: isCancelled ? 'CANCELLED' : 'CONFIRMED',
    sheetTabName,
    facilityName: String(raw.facilityName || sheetTabName),
  };
}

// Enterprise Deduplication Helpers to guarantee 100% unique IDs across all collections
export function deduplicateBookings(list: Booking[]): Booking[] {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, Booking>();
  let unnamedCount = 1;

  list.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    if (raw.id === 'Booking ID' || raw.date === 'Date') return;

    let cleanId = String(raw.id || '').trim();
    if (!cleanId) {
      cleanId = `BK-AUTO-${Date.now()}-${idx}-${unnamedCount++}`;
      raw.id = cleanId;
    }
    const key = cleanId.toLowerCase();

    if (map.has(key)) {
      const existing = map.get(key)!;
      // If one of the duplicates is CANCELLED, preserve the cancellation
      const finalStatus = (existing.status === 'CANCELLED' || raw.status === 'CANCELLED') ? 'CANCELLED' : 'CONFIRMED';
      map.set(key, {
        ...existing,
        ...raw,
        status: finalStatus,
      });
    } else {
      map.set(key, raw);
    }
  });

  return Array.from(map.values());
}

export function deduplicateRecords<T extends { id?: string }>(list: T[], prefix: string = 'REC'): T[] {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, T>();
  let counter = 1;

  list.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    let cleanId = String(item.id || '').trim();
    if (!cleanId) {
      cleanId = `${prefix}-AUTO-${Date.now()}-${idx}-${counter++}`;
      item.id = cleanId;
    }
    const key = cleanId.toLowerCase();
    if (map.has(key)) {
      map.set(key, { ...map.get(key)!, ...item });
    } else {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

// Generate unique Booking ID: e.g. "CG-20260824130230-7491"
export function generateBookingId(facilityCode: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  const secs = now.getSeconds().toString().padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${facilityCode}-${year}${month}${day}${hours}${mins}${secs}-${randomSuffix}`;
}

export const StorageService = {
  init(): Booking[] {
    this.initIsolationRooms();
    if (isInitialized && inMemoryBookings.length > 0) {
      inMemoryBookings = deduplicateBookings(inMemoryBookings);
      return inMemoryBookings;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const rawList = JSON.parse(stored);
        if (Array.isArray(rawList)) {
          // Filter out header rows and invalid objects, then deduplicate
          const cleaned = rawList
            .filter(
              (item) =>
                item &&
                typeof item === 'object' &&
                item.id !== 'Booking ID' &&
                item.date !== 'Date'
            )
            .map((item, idx) => sanitizeBooking(item, idx));
          inMemoryBookings = deduplicateBookings(cleaned);
          // If deduplication reduced the count, sync back to local storage
          if (inMemoryBookings.length !== rawList.length) {
            safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
          }
        } else {
          inMemoryBookings = [];
        }
      } else {
        inMemoryBookings = [];
        safeSetLocalStorage(STORAGE_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('LocalStorage access error, starting clean', e);
      inMemoryBookings = [];
    }

    isInitialized = true;
    try {
      this.purgeExpiredCancelledBookings();
    } catch (purgeErr) {}
    return inMemoryBookings;
  },

  /**
   * IndexedDB Disaster & Overflow Recovery
   * Automatically restores in-memory state if localStorage was flushed or blocked by browser quota.
   */
  async recoverFromIndexedDBIfNeeded(): Promise<boolean> {
    if (inMemoryBookings.length > 0) return false;
    try {
      const asset = await idbStorageService.getAsset(`ls_overflow_${STORAGE_KEY}`);
      if (asset && asset.dataUrl) {
        const rawList = JSON.parse(asset.dataUrl);
        if (Array.isArray(rawList) && rawList.length > 0) {
          const cleaned = rawList
            .filter((item) => item && typeof item === 'object' && item.id !== 'Booking ID' && item.date !== 'Date')
            .map((item, idx) => sanitizeBooking(item, idx));
          inMemoryBookings = deduplicateBookings(cleaned);
          safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
          return true;
        }
      }
    } catch (e) {
      console.warn('Error attempting IndexedDB overflow recovery:', e);
    }
    return false;
  },

  reloadFromStorage(): Booking[] {
    isInitialized = false;
    isIsolationInitialized = false;
    return this.init();
  },

  resetSyncChangesCount(): void {
    lastSyncChangesCount = 0;
  },

  getLastSyncChangesCount(): number {
    return lastSyncChangesCount;
  },

  incrementSyncChangesCount(delta: number = 1): void {
    lastSyncChangesCount += delta;
  },

  // Isolation Room Initialization & Persistence
  initIsolationRooms(): IsolationRoomRecord[] {
    if (isIsolationInitialized && inMemoryIsolationRooms.length > 0) {
      return inMemoryIsolationRooms;
    }

    try {
      const stored = localStorage.getItem(ISOLATION_ROOMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryIsolationRooms = parsed.map((r: IsolationRoomRecord) => this.normalizeRoom(r));
        } else {
          inMemoryIsolationRooms = INITIAL_ISOLATION_ROOMS.map((r) => this.normalizeRoom(r));
          safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
        }
      } else {
        inMemoryIsolationRooms = INITIAL_ISOLATION_ROOMS.map((r) => this.normalizeRoom(r));
        safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
      }
    } catch (e) {
      console.warn('Error reading isolation rooms, resetting to defaults', e);
      inMemoryIsolationRooms = INITIAL_ISOLATION_ROOMS.map((r) => this.normalizeRoom(r));
    }

    isIsolationInitialized = true;
    
    // If no occupants exist yet, attempt instant reconciliation from loaded bookings
    const totalOccupants = inMemoryIsolationRooms.reduce((acc, r) => acc + (r.occupants ? r.occupants.length : 0), 0);
    if (totalOccupants === 0) {
      this.reconcileIsolationRoomsFromBookings();
    }

    return inMemoryIsolationRooms;
  },

  normalizeRoom(room: IsolationRoomRecord): IsolationRoomRecord {
    const occupants: BedOccupant[] = [];
    if (Array.isArray(room.occupants)) {
      room.occupants.forEach((occ) => {
        if (occ && occ.patientName && occ.patientName.trim()) {
          occupants.push(occ);
        }
      });
    } else if (room.patientName && room.patientName.trim()) {
      occupants.push({
        bedNumber: 1,
        patientName: room.patientName,
        company: room.company,
        phoneNumber: room.phoneNumber,
        email: room.email,
        nationalId: room.nationalId,
        checkIn: room.checkIn || getTodayDateString(),
        checkOut: room.checkOut,
        bookingType: room.bookingType,
        purposeOfStay: room.purposeOfStay,
        hospitalReferral: room.hospitalReferral,
        keyIssued: room.keyIssued,
        staffNotes: room.staffNotes,
        bookedByStaff: room.bookedByStaff,
      });
    }

    const isOccupied = occupants.length > 0;
    const primary = occupants[0];

    return {
      ...room,
      occupants,
      status: isOccupied ? 'Occupied' : 'VACANT',
      patientName: primary ? primary.patientName : '',
      company: primary ? primary.company || '' : '',
      checkIn: primary ? primary.checkIn || '' : '',
      checkOut: primary ? primary.checkOut || '' : '',
      phoneNumber: primary ? primary.phoneNumber || '' : '',
      email: primary ? primary.email || '' : '',
      nationalId: primary ? primary.nationalId || '' : '',
      bookingType: primary ? primary.bookingType : undefined,
      purposeOfStay: primary ? primary.purposeOfStay || '' : '',
      hospitalReferral: primary ? primary.hospitalReferral || '' : '',
      keyIssued: isOccupied ? (primary.keyIssued ?? false) : false,
      staffNotes: primary ? primary.staffNotes || '' : '',
    };
  },

  getIsolationRooms(): IsolationRoomRecord[] {
    return this.initIsolationRooms();
  },

  saveIsolationRooms(rooms: IsolationRoomRecord[]) {
    if (!Array.isArray(rooms)) return;
    inMemoryIsolationRooms = [...rooms];
    try {
      safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
      notifyBookingsChanged();
    } catch (e) {
      console.error('Failed to save isolation rooms to localStorage', e);
    }
  },

  updateIsolationRoom(roomId: string, updates: Partial<IsolationRoomRecord>): IsolationRoomRecord | null {
    const rooms = this.getIsolationRooms();
    const idx = rooms.findIndex(
      (r) => r.id.toLowerCase() === roomId.toLowerCase() || r.buildingNumber.toLowerCase() === roomId.toLowerCase()
    );
    if (idx === -1) return null;

    const merged = {
      ...rooms[idx],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    const updated = this.normalizeRoom(merged);
    rooms[idx] = updated;
    this.saveIsolationRooms(rooms);
    return updated;
  },

  admitBedOccupant(
    roomId: string,
    bedNumber: 1 | 2,
    occupantData: {
      patientName: string;
      company?: string;
      phoneNumber?: string;
      email?: string;
      nationalId?: string;
      checkIn?: string;
      checkOut?: string;
      bookingType?: 'General Guest' | 'Medical Isolation';
      purposeOfStay?: string;
      hospitalReferral?: string;
      keyIssued?: boolean;
      staffNotes?: string;
      bookedByStaff?: string;
    }
  ): IsolationRoomRecord | null {
    const rooms = this.getIsolationRooms();
    const room = rooms.find(
      (r) => r.id.toLowerCase() === roomId.toLowerCase() || r.buildingNumber.toLowerCase() === roomId.toLowerCase()
    );
    if (!room) return null;

    const canonical = getCanonicalRoomNumber(room.buildingNumber) || room.buildingNumber;
    unrecordDeletedId(`${room.buildingNumber}-B${bedNumber}`);
    unrecordDeletedId(`${room.id}-B${bedNumber}`);
    unrecordDeletedId(`${canonical}-B${bedNumber}`);
    unrecordDeletedId(`Room ${room.buildingNumber} (Bed ${bedNumber})`);
    unrecordDeletedId(`Room ${canonical} (Bed ${bedNumber})`);

    const currentOccupants = [...(room.occupants || [])].filter((o) => o.bedNumber !== bedNumber);
    const newOccupant: BedOccupant = {
      bedNumber,
      patientName: AuthService.sanitizeText(occupantData.patientName),
      company: occupantData.company ? AuthService.sanitizeText(occupantData.company) : 'General Resident',
      phoneNumber: occupantData.phoneNumber ? AuthService.sanitizeText(occupantData.phoneNumber) : '',
      email: occupantData.email ? AuthService.sanitizeText(occupantData.email) : '',
      nationalId: occupantData.nationalId ? AuthService.sanitizeText(occupantData.nationalId) : '',
      checkIn: occupantData.checkIn || getTodayDateString(),
      checkOut: occupantData.checkOut || '',
      bookingType: occupantData.bookingType || 'General Guest',
      purposeOfStay: occupantData.purposeOfStay ? AuthService.sanitizeText(occupantData.purposeOfStay) : '',
      hospitalReferral: occupantData.hospitalReferral ? AuthService.sanitizeText(occupantData.hospitalReferral) : '',
      keyIssued: occupantData.keyIssued ?? true,
      staffNotes: occupantData.staffNotes ? AuthService.sanitizeText(occupantData.staffNotes) : '',
      bookedByStaff: occupantData.bookedByStaff ? AuthService.sanitizeText(occupantData.bookedByStaff) : 'Helpdesk Admin',
    };

    currentOccupants.push(newOccupant);
    currentOccupants.sort((a, b) => a.bedNumber - b.bedNumber);

    return this.updateIsolationRoom(roomId, {
      occupants: currentOccupants,
      status: 'Occupied',
    });
  },

  dischargeBedOccupant(roomId: string, bedNumber: 1 | 2): IsolationRoomRecord | null {
    const rooms = this.getIsolationRooms();
    const room = rooms.find(
      (r) => r.id.toLowerCase() === roomId.toLowerCase() || r.buildingNumber.toLowerCase() === roomId.toLowerCase()
    );
    if (!room) return null;

    const dischargedOccupant = (room.occupants || []).find((o) => o.bedNumber === bedNumber);
    const canonicalRoom = getCanonicalRoomNumber(room.buildingNumber) || room.buildingNumber;

    recordDeletedId(`${room.buildingNumber}-B${bedNumber}`, 'occupants');
    recordDeletedId(`${room.id}-B${bedNumber}`, 'occupants');
    recordDeletedId(`${canonicalRoom}-B${bedNumber}`, 'occupants');
    recordDeletedId(`Room ${room.buildingNumber} (Bed ${bedNumber})`, 'occupants');
    recordDeletedId(`Room ${canonicalRoom} (Bed ${bedNumber})`, 'occupants');

    if (dischargedOccupant) {
      if (dischargedOccupant.id) recordDeletedId(dischargedOccupant.id, 'occupants');
      if (dischargedOccupant.bookingId) {
        recordRecentCancellation(dischargedOccupant.bookingId, 'Discharged from isolation room');
        recordDeletedId(dischargedOccupant.bookingId, 'bookings');
        recordDeletedId(dischargedOccupant.bookingId, 'occupants');
      }
      
      // Cancel matching booking in memory if exists
      const occName = (dischargedOccupant.patientName || '').toLowerCase().trim();
      const cleanRoomCode = room.buildingNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      inMemoryBookings = inMemoryBookings.map((b) => {
        const bCust = (b.customerName || '').toLowerCase().trim();
        const bStage = (b.stage || '').toLowerCase();
        const bSlot = (b.slotIds || []).join(' ').toLowerCase();
        const bId = (b.id || '').toLowerCase();
        const isNameMatch = occName && bCust === occName;
        const isRoomMatch = bStage.includes(room.buildingNumber.toLowerCase()) || bStage.includes(canonicalRoom.toLowerCase()) || bSlot.includes(cleanRoomCode) || bId.includes(cleanRoomCode);
        const isBedMatch = bStage.includes(`bed ${bedNumber}`) || bSlot.includes(`b${bedNumber}`) || bId.includes(`-b${bedNumber}`);

        if ((isNameMatch || (isRoomMatch && isBedMatch)) && b.status !== 'CANCELLED') {
          recordRecentCancellation(b.id, 'Discharged from isolation room');
          recordDeletedId(b.id, 'bookings');
          recordDeletedId(b.id, 'occupants');
          return {
            ...b,
            status: 'CANCELLED',
            cancellationReason: 'Discharged from isolation room',
            cancelledAt: new Date().toISOString(),
          };
        }
        return b;
      });
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
    }

    const remaining = (room.occupants || []).filter((o) => o.bedNumber !== bedNumber);
    const updated = this.updateIsolationRoom(roomId, {
      occupants: remaining,
      status: remaining.length > 0 ? 'Occupied' : 'VACANT',
      patientName: remaining[0]?.patientName || '',
      company: remaining[0]?.company || '',
      checkIn: remaining[0]?.checkIn || '',
      checkOut: remaining[0]?.checkOut || '',
      phoneNumber: remaining[0]?.phoneNumber || '',
      email: remaining[0]?.email || '',
      nationalId: remaining[0]?.nationalId || '',
      bookingType: remaining[0]?.bookingType || undefined,
      purposeOfStay: remaining[0]?.purposeOfStay || '',
      hospitalReferral: remaining[0]?.hospitalReferral || '',
      keyIssued: remaining.length > 0 ? (remaining[0]?.keyIssued ?? false) : false,
      staffNotes: remaining[0]?.staffNotes || '',
    });

    if (updated && typeof fetch !== 'undefined') {
      fetch('/api/hub/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mutationType: 'UPSERT',
          entity: 'isolationRooms',
          id: updated.id,
          data: updated,
        }),
      }).catch(() => {});
    }

    notifyBookingsChanged();
    try {
      window.dispatchEvent(new CustomEvent('tamimi_isolation_updated'));
    } catch (e) {}

    return updated;
  },

  transferBedOccupant(
    sourceRoomId: string,
    sourceBedNumber: 1 | 2,
    targetRoomId: string,
    targetBedNumber: 1 | 2
  ): { success: boolean; error?: string } {
    const rooms = this.getIsolationRooms();
    const srcRoom = rooms.find((r) => r.id === sourceRoomId || r.buildingNumber === sourceRoomId);
    const tgtRoom = rooms.find((r) => r.id === targetRoomId || r.buildingNumber === targetRoomId);

    if (!srcRoom || !tgtRoom) {
      return { success: false, error: 'Source or destination room not found.' };
    }

    const occToMove = (srcRoom.occupants || []).find((o) => o.bedNumber === sourceBedNumber);
    if (!occToMove) {
      return { success: false, error: `No occupant found on Bed ${sourceBedNumber} in ${srcRoom.buildingNumber}.` };
    }

    // Check if target bed is occupied
    const targetOccupant = (tgtRoom.occupants || []).find((o) => o.bedNumber === targetBedNumber);
    if (targetOccupant) {
      return {
        success: false,
        error: `Bed ${targetBedNumber} in ${tgtRoom.buildingNumber} is already occupied by ${targetOccupant.patientName}.`,
      };
    }

    // Discharge from source
    this.dischargeBedOccupant(srcRoom.id, sourceBedNumber);

    // Admit to target
    this.admitBedOccupant(tgtRoom.id, targetBedNumber, {
      ...occToMove,
    });

    return { success: true };
  },

  admitIsolationPatient(
    roomId: string,
    patientData: {
      patientName: string;
      company: string;
      checkIn: string;
      checkOut?: string;
      phoneNumber?: string;
      email?: string;
      nationalId?: string;
      bookingType?: 'General Guest' | 'Medical Isolation';
      purposeOfStay?: string;
      hospitalReferral?: string;
      roomCondition?: 'Cleaned & Ready' | 'Under Maintenance' | 'Deep Sanitization Required';
      keyIssued?: boolean;
      staffNotes?: string;
      bookedByStaff?: string;
      targetBed?: 1 | 2 | 'BOTH';
      bed2Guest?: {
        patientName: string;
        company?: string;
        phoneNumber?: string;
        email?: string;
        nationalId?: string;
      };
    }
  ): IsolationRoomRecord | null {
    if (patientData.targetBed === 'BOTH') {
      const occ1: BedOccupant = {
        bedNumber: 1,
        patientName: AuthService.sanitizeText(patientData.patientName),
        company: AuthService.sanitizeText(patientData.company),
        checkIn: patientData.checkIn || getTodayDateString(),
        checkOut: patientData.checkOut || '',
        phoneNumber: patientData.phoneNumber ? AuthService.sanitizeText(patientData.phoneNumber) : '',
        email: patientData.email ? AuthService.sanitizeText(patientData.email) : '',
        nationalId: patientData.nationalId ? AuthService.sanitizeText(patientData.nationalId) : '',
        bookingType: patientData.bookingType || 'General Guest',
        purposeOfStay: patientData.purposeOfStay ? AuthService.sanitizeText(patientData.purposeOfStay) : '',
        hospitalReferral: patientData.hospitalReferral ? AuthService.sanitizeText(patientData.hospitalReferral) : '',
        keyIssued: patientData.keyIssued ?? true,
        staffNotes: patientData.staffNotes ? AuthService.sanitizeText(patientData.staffNotes) : '',
        bookedByStaff: patientData.bookedByStaff ? AuthService.sanitizeText(patientData.bookedByStaff) : 'Helpdesk Admin',
      };

      const occ2: BedOccupant = {
        bedNumber: 2,
        patientName: patientData.bed2Guest?.patientName
          ? AuthService.sanitizeText(patientData.bed2Guest.patientName)
          : `${AuthService.sanitizeText(patientData.patientName)} (Guest 2)`,
        company: patientData.bed2Guest?.company ? AuthService.sanitizeText(patientData.bed2Guest.company) : patientData.company,
        checkIn: patientData.checkIn || getTodayDateString(),
        checkOut: patientData.checkOut || '',
        phoneNumber: patientData.bed2Guest?.phoneNumber ? AuthService.sanitizeText(patientData.bed2Guest.phoneNumber) : '',
        email: patientData.bed2Guest?.email ? AuthService.sanitizeText(patientData.bed2Guest.email) : '',
        nationalId: patientData.bed2Guest?.nationalId ? AuthService.sanitizeText(patientData.bed2Guest.nationalId) : '',
        bookingType: patientData.bookingType || 'Medical Isolation',
        hospitalReferral: patientData.hospitalReferral ? AuthService.sanitizeText(patientData.hospitalReferral) : '',
        keyIssued: patientData.keyIssued ?? true,
      };

      return this.updateIsolationRoom(roomId, {
        occupants: [occ1, occ2],
        roomCondition: patientData.roomCondition || 'Cleaned & Ready',
        status: 'Occupied',
      });
    }

    const bedNum = patientData.targetBed || 1;
    return this.admitBedOccupant(roomId, bedNum, patientData);
  },

  dischargeIsolationPatient(roomId: string): IsolationRoomRecord | null {
    const rooms = this.getIsolationRooms();
    const room = rooms.find(
      (r) => r.id.toLowerCase() === roomId.toLowerCase() || r.buildingNumber.toLowerCase() === roomId.toLowerCase()
    );
    if (room) {
      const canonicalRoom = getCanonicalRoomNumber(room.buildingNumber) || room.buildingNumber;
      // Blacklist both beds
      [1, 2].forEach((bNum) => {
        recordDeletedId(`${room.buildingNumber}-B${bNum}`, 'occupants');
        recordDeletedId(`${room.id}-B${bNum}`, 'occupants');
        recordDeletedId(`${canonicalRoom}-B${bNum}`, 'occupants');
        recordDeletedId(`Room ${room.buildingNumber} (Bed ${bNum})`, 'occupants');
        recordDeletedId(`Room ${canonicalRoom} (Bed ${bNum})`, 'occupants');
      });

      const cleanRoomCode = room.buildingNumber.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (room.occupants) {
        room.occupants.forEach((occ) => {
          if (occ.id) recordDeletedId(occ.id, 'occupants');
          if (occ.bookingId) {
            recordRecentCancellation(occ.bookingId, 'Discharged from isolation room');
            recordDeletedId(occ.bookingId, 'bookings');
            recordDeletedId(occ.bookingId, 'occupants');
          }
        });
      }

      // Cancel all matching bookings in memory for this room or its occupants
      inMemoryBookings = inMemoryBookings.map((b) => {
        const bStage = (b.stage || '').toLowerCase();
        const bSlot = (b.slotIds || []).join(' ').toLowerCase();
        const bId = (b.id || '').toLowerCase();
        const isRoomMatch = bStage.includes(room.buildingNumber.toLowerCase()) || bStage.includes(canonicalRoom.toLowerCase()) || bSlot.includes(cleanRoomCode) || bId.includes(cleanRoomCode);
        const isNameMatch = (room.occupants || []).some((occ) => (occ.patientName || '').toLowerCase().trim() === (b.customerName || '').toLowerCase().trim());

        if ((isRoomMatch || isNameMatch) && b.status !== 'CANCELLED') {
          recordRecentCancellation(b.id, 'Discharged from isolation room');
          recordDeletedId(b.id, 'bookings');
          recordDeletedId(b.id, 'occupants');
          return {
            ...b,
            status: 'CANCELLED',
            cancellationReason: 'Discharged from isolation room',
            cancelledAt: new Date().toISOString(),
          };
        }
        return b;
      });
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
    }

    const updated = this.updateIsolationRoom(roomId, {
      occupants: [],
      patientName: '',
      company: '',
      checkIn: '',
      checkOut: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      bookingType: undefined,
      purposeOfStay: '',
      hospitalReferral: '',
      roomCondition: 'Cleaned & Ready',
      keyIssued: false,
      staffNotes: '',
      status: 'VACANT',
    });

    if (updated && typeof fetch !== 'undefined') {
      fetch('/api/hub/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mutationType: 'UPSERT',
          entity: 'isolationRooms',
          id: updated.id,
          data: updated,
        }),
      }).catch(() => {});
    }

    notifyBookingsChanged();
    try {
      window.dispatchEvent(new CustomEvent('tamimi_isolation_updated'));
    } catch (e) {}

    return updated;
  },

  resetIsolationRoomsToDefault(): IsolationRoomRecord[] {
    inMemoryIsolationRooms = [...INITIAL_ISOLATION_ROOMS];
    try {
      safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
      notifyBookingsChanged();
    } catch (e) {}
    return inMemoryIsolationRooms;
  },

  clearAllBookings() {
    inMemoryBookings = [];
    try {
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {}
  },

  getAllBookings(): Booking[] {
    this.init();
    return deduplicateBookings([...inMemoryBookings]).sort((a, b) => {
      const createdA = a.createdAt || '';
      const createdB = b.createdAt || '';
      const createdComp = createdB.localeCompare(createdA);
      if (createdComp !== 0) return createdComp;
      return (b.date || '').localeCompare(a.date || '');
    });
  },

  saveBookings(bookings: Booking[]) {
    if (!Array.isArray(bookings)) return;
    const sanitized = bookings
      .filter((item) => item && typeof item === 'object' && item.id !== 'Booking ID' && item.date !== 'Date')
      .map((b, idx) => sanitizeBooking(b, idx));
    inMemoryBookings = deduplicateBookings(sanitized);
    try {
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  /**
   * Universal Hub State Application:
   * Instantly synchronizes this client with the authoritative Server Hub state.
   */
  applyFullHubSnapshot(hubData: any) {
    if (!hubData) return;

    // 1. Ingest Tombstones
    if (hubData.deletedIds && typeof hubData.deletedIds === 'object') {
      try {
        const raw = localStorage.getItem(DELETED_CACHE_KEY);
        const currentObj = raw ? JSON.parse(raw) : {};
        const mergedObj = { ...currentObj, ...hubData.deletedIds };
        safeSetLocalStorage(DELETED_CACHE_KEY, JSON.stringify(mergedObj));
      } catch (e) {}
    }

    // 2. Ingest Cancellations
    if (hubData.cancelledIds && typeof hubData.cancelledIds === 'object') {
      try {
        const raw = localStorage.getItem(CANCELLED_CACHE_KEY);
        const currentObj = raw ? JSON.parse(raw) : {};
        const mergedObj = { ...currentObj, ...hubData.cancelledIds };
        safeSetLocalStorage(CANCELLED_CACHE_KEY, JSON.stringify(mergedObj));
      } catch (e) {}
    }

    // 3. Ingest Bookings
    if (Array.isArray(hubData.bookings)) {
      this.mergeRemoteBookings(hubData.bookings);
    }

    // 4. Ingest Isolation Rooms
    if (Array.isArray(hubData.isolationRooms) && hubData.isolationRooms.length > 0) {
      this.mergeRemoteIsolationRooms(hubData.isolationRooms);
    }

    // 5. Ingest Handovers
    if (Array.isArray(hubData.handovers)) {
      this.mergeRemoteHandovers(hubData.handovers);
    }

    // 6. Ingest Parcels
    if (Array.isArray(hubData.parcels)) {
      this.mergeRemoteParcels(hubData.parcels);
    }

    // 7. Ingest Lost & Found
    if (Array.isArray(hubData.lostFound)) {
      this.mergeRemoteLostFound(hubData.lostFound);
    }

    // 8. Ingest Work Order Support Tickets
    if (Array.isArray(hubData.supportTickets)) {
      TicketService.mergeRemoteTickets(hubData.supportTickets);
    }
  },

  applyRemoteDeletion(id: string, entity?: string) {
    if (!id) return;
    const cleanId = String(id).toLowerCase().trim();
    recordDeletedId(cleanId, entity || 'general');

    // 1. Remove from Bookings
    this.init();
    const prevBCount = inMemoryBookings.length;
    inMemoryBookings = inMemoryBookings.filter((b) => String(b.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryBookings.length !== prevBCount) {
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
    }

    // 2. Remove from Handovers
    this.initHandover();
    const prevHCount = inMemoryHandovers.length;
    inMemoryHandovers = inMemoryHandovers.filter((h) => String(h.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryHandovers.length !== prevHCount) {
      safeSetLocalStorage(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
      window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
    }

    // 3. Remove from Parcels
    this.initParcels();
    const prevPCount = inMemoryParcels.length;
    inMemoryParcels = inMemoryParcels.filter((p) => String(p.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryParcels.length !== prevPCount) {
      safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
      window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
    }

    // 4. Remove from Lost & Found
    this.initLostFound();
    const prevLCount = inMemoryLostFound.length;
    inMemoryLostFound = inMemoryLostFound.filter((l) => String(l.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryLostFound.length !== prevLCount) {
      safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
      window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
    }

    // 5. Clean from Support Tickets
    TicketService.applyRemoteDeletion(cleanId);

    // 5. Clean from Isolation Rooms
    this.initIsolationRooms();
    let isoChanged = false;
    inMemoryIsolationRooms = inMemoryIsolationRooms.map((room) => {
      if (!room.occupants || room.occupants.length === 0) return room;
      const filtered = room.occupants.filter((occ) => {
        const occId = String(occ.id || occ.bookingId || '').toLowerCase().trim();
        return occId !== cleanId;
      });
      if (filtered.length !== room.occupants.length) {
        isoChanged = true;
        return this.normalizeRoom({ ...room, occupants: filtered });
      }
      return room;
    });
    if (isoChanged) {
      safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
      window.dispatchEvent(new CustomEvent('tamimi_isolation_updated'));
      notifyBookingsChanged();
    }
  },

  applyRemoteCancellation(id: string, reason?: string) {
    if (!id) return;
    const cleanId = String(id).toLowerCase().trim();
    recordRecentCancellation(cleanId, reason);

    this.init();
    let changed = false;
    inMemoryBookings = inMemoryBookings.map((b) => {
      if (String(b.id || '').toLowerCase().trim() === cleanId && b.status !== 'CANCELLED') {
        changed = true;
        return {
          ...b,
          status: 'CANCELLED',
          cancellationReason: reason || 'Cancelled remotely',
          cancelledAt: new Date().toISOString(),
        };
      }
      return b;
    });

    if (changed) {
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
      this.reconcileIsolationRoomsFromBookings();
    }
  },

  applyRemoteUpsert(entity: string, data: any) {
    if (!entity || !data) return;
    const targetId = String(data.id || '').toLowerCase().trim();
    if (targetId && isIdDeleted(targetId)) return; // Never revive deleted items

    if (entity === 'bookings') {
      this.init();
      const sanitized = sanitizeBooking(data);
      const idx = inMemoryBookings.findIndex((b) => String(b.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        inMemoryBookings[idx] = { ...inMemoryBookings[idx], ...sanitized };
      } else {
        inMemoryBookings.unshift(sanitized);
      }
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
      this.reconcileIsolationRoomsFromBookings();
    } else if (entity === 'handovers') {
      this.initHandover();
      const idx = inMemoryHandovers.findIndex((h) => String(h.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        inMemoryHandovers[idx] = { ...inMemoryHandovers[idx], ...data };
      } else {
        inMemoryHandovers.unshift(data);
      }
      safeSetLocalStorage(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
      window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
    } else if (entity === 'parcels') {
      this.initParcels();
      const idx = inMemoryParcels.findIndex((p) => String(p.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        inMemoryParcels[idx] = { ...inMemoryParcels[idx], ...data };
      } else {
        inMemoryParcels.unshift(data);
      }
      safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
      window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
    } else if (entity === 'lostFound') {
      this.initLostFound();
      const idx = inMemoryLostFound.findIndex((l) => String(l.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        inMemoryLostFound[idx] = { ...inMemoryLostFound[idx], ...data };
      } else {
        inMemoryLostFound.unshift(data);
      }
      safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
      window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
    } else if (entity === 'supportTickets') {
      TicketService.applyRemoteUpsert(data);
    }
  },

  /**
   * Smart Remote & Multi-Device Reconciliation:
   * Merges bookings fetched from Google Sheets across all 8 tabs with local storage.
   * Ensures that bookings made on Computer A are instantly visible on Computer B,
   * while never dropping any pending or in-flight local bookings, and preventing cancelled
   * or deleted bookings from resurrecting.
   */
  mergeRemoteBookings(remoteBookings: Booking[]): Booking[] {
    this.init();
    if (!Array.isArray(remoteBookings)) return inMemoryBookings;

    const recentCancelled = getRecentCancelledMap();
    const deletedIds = getDeletedIdsMap();

    // Track any booking that is locally marked as CANCELLED so remote never resurrects it as CONFIRMED
    const locallyCancelledIds = new Set<string>();
    const prevMap = new Map<string, string>();
    inMemoryBookings.forEach((b) => {
      if (b.status === 'CANCELLED' && b.id) {
        locallyCancelledIds.add(b.id.toLowerCase().trim());
      }
      if (b.id) {
        prevMap.set(b.id.toLowerCase().trim(), `${b.status}_${b.customerName}_${b.startTime}_${b.endTime}_${b.date}`);
      }
    });

    const sanitizedRemote = remoteBookings
      .filter((item) => item && typeof item === 'object' && item.id !== 'Booking ID' && item.date !== 'Date')
      .filter((item) => {
        // Drop any permanently deleted bookings
        if (item.id && deletedIds.has(item.id.toLowerCase().trim())) {
          return false;
        }
        return true;
      })
      .map((b, idx) => {
        const item = sanitizeBooking(b, idx);
        const idKey = item.id ? item.id.toLowerCase().trim() : '';
        // If this booking was cancelled locally or in recent cache, enforce CANCELLED
        if (idKey && (recentCancelled.has(idKey) || locallyCancelledIds.has(idKey))) {
          item.status = 'CANCELLED';
        }
        return item;
      });

    // Deduplicate remote before merge
    const deduplicatedRemote = deduplicateBookings(sanitizedRemote);

    // Index remote bookings
    const remoteIdMap = new Map<string, Booking>();
    const remoteSlotMap = new Set<string>();
    let updatedOrNewCount = 0;

    deduplicatedRemote.forEach((rb) => {
      if (rb.id) {
        const idKey = rb.id.toLowerCase().trim();
        remoteIdMap.set(idKey, rb);
        const prevSig = prevMap.get(idKey);
        const newSig = `${rb.status}_${rb.customerName}_${rb.startTime}_${rb.endTime}_${rb.date}`;
        if (!prevSig || prevSig !== newSig) {
          updatedOrNewCount++;
        }
      }
      const slotKey = `${resolveFacilityId(rb.facilityId || rb.sheetTabName)}_${normalizeDateString(rb.date)}_${rb.stage}_${rb.startTime}`;
      remoteSlotMap.add(slotKey.toLowerCase());
    });

    if (updatedOrNewCount > 0) {
      lastSyncChangesCount += updatedOrNewCount;
    }

    // Merge: Keep remote bookings (authoritative), and keep any local bookings that aren't in remote yet and haven't been deleted
    const now = Date.now();
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const queuedBookingIds = new Set<string>();
    try {
      const q = OfflineQueueService.getQueue();
      q.forEach((item) => {
        if (item.action === 'saveBooking' && item.payload?.id) {
          queuedBookingIds.add(String(item.payload.id).toLowerCase().trim());
        }
      });
    } catch (e) {}

    const preservedLocalBookings = inMemoryBookings.filter((localB) => {
      if (!localB.id) return false;
      const idKey = localB.id.toLowerCase().trim();
      if (deletedIds.has(idKey)) return false; // Deleted permanently
      if (remoteIdMap.has(idKey)) return false; // Already updated from remote

      const slotKey = `${resolveFacilityId(localB.facilityId || localB.sheetTabName)}_${normalizeDateString(localB.date)}_${localB.stage}_${localB.startTime}`;
      if (remoteSlotMap.has(slotKey.toLowerCase())) return false; // Remote already has this slot

      // If locally marked as CANCELLED, do not retain as active booking
      if (localB.status === 'CANCELLED') {
        return false;
      }

      // If remote returned authoritative data, only preserve recent in-flight or queued bookings
      if (deduplicatedRemote.length > 0) {
        const isQueued = queuedBookingIds.has(idKey);
        const createdAtTime = localB.createdAt ? new Date(localB.createdAt).getTime() : 0;
        const isRecentlyCreated = createdAtTime > 0 && (now - createdAtTime < TEN_MINUTES_MS);
        if (!isQueued && !isRecentlyCreated) {
          return false;
        }
      }

      // Keep this local booking so user's in-flight bookings NEVER disappear!
      return true;
    });

    inMemoryBookings = deduplicateBookings([...deduplicatedRemote, ...preservedLocalBookings]);
    try {
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(inMemoryBookings));
      notifyBookingsChanged();
      // Auto-reconcile isolation room occupants from bookings so new devices immediately populate
      this.reconcileIsolationRoomsFromBookings();
    } catch (e) {
      console.error('Failed to save merged bookings to localStorage', e);
    }

    return inMemoryBookings;
  },

  mergeRemoteHandovers(remoteList: HandoverItemRecord[]): HandoverItemRecord[] {
    this.initHandover();
    if (!Array.isArray(remoteList)) return inMemoryHandovers;
    const deletedIds = getDeletedIdsMap();

    const localMap = new Map<string, HandoverItemRecord>();
    inMemoryHandovers.forEach((localH) => {
      if (localH && localH.id && !deletedIds.has(String(localH.id).trim().toLowerCase())) {
        localMap.set(String(localH.id).trim().toLowerCase(), localH);
      }
    });

    const remoteMap = new Map<string, HandoverItemRecord>();
    const mergedRemote = remoteList
      .filter((r) => r && r.id && !deletedIds.has(String(r.id).trim().toLowerCase()))
      .map((r) => {
        const key = String(r.id).trim().toLowerCase();
        remoteMap.set(key, r);
        const local = localMap.get(key);
        if (local) {
          return {
            ...r,
            photoUrl: r.photoUrl || local.photoUrl || '',
            secondaryPhotoUrl: r.secondaryPhotoUrl || local.secondaryPhotoUrl || '',
          };
        }
        return r;
      });

    const preservedLocal = inMemoryHandovers.filter((localH) => {
      if (!localH || !localH.id) return false;
      const idStr = String(localH.id).toLowerCase().trim();
      if (deletedIds.has(idStr)) return false;
      if (remoteList.length > 0 && (idStr.startsWith('ho-seed-') || idStr === 'ho-1' || idStr === 'ho-2' || idStr === 'ho-3')) {
        return false;
      }
      return !remoteMap.has(idStr);
    });

    inMemoryHandovers = deduplicateRecords([...mergedRemote, ...preservedLocal], 'HO');
    try {
      safeSetLocalStorage(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
      window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
    } catch (e) {}

    return inMemoryHandovers;
  },

  mergeRemoteParcels(remoteList: ParcelRecord[]): ParcelRecord[] {
    this.initParcels();
    if (!Array.isArray(remoteList)) return inMemoryParcels;
    const deletedIds = getDeletedIdsMap();

    const localMap = new Map<string, ParcelRecord>();
    inMemoryParcels.forEach((localP) => {
      if (localP && localP.id && !deletedIds.has(String(localP.id).trim().toLowerCase())) {
        localMap.set(String(localP.id).trim().toLowerCase(), localP);
      }
    });

    const remoteMap = new Map<string, ParcelRecord>();
    const mergedRemote = remoteList
      .filter((r) => r && r.id && !deletedIds.has(String(r.id).trim().toLowerCase()))
      .map((r) => {
        const key = String(r.id).trim().toLowerCase();
        remoteMap.set(key, r);
        const local = localMap.get(key);
        if (local) {
          return {
            ...r,
            photoUrl: r.photoUrl || local.photoUrl || '',
            secondaryPhotoUrl: r.secondaryPhotoUrl || local.secondaryPhotoUrl || '',
          };
        }
        return r;
      });

    const preservedLocal = inMemoryParcels.filter((localP) => {
      if (!localP || !localP.id) return false;
      const idStr = String(localP.id).toLowerCase().trim();
      if (deletedIds.has(idStr)) return false;
      if (remoteList.length > 0 && (idStr.startsWith('pcl-seed-') || idStr === 'pcl-1' || idStr === 'pcl-2' || idStr === 'pcl-3')) {
        return false;
      }
      return !remoteMap.has(idStr);
    });

    inMemoryParcels = deduplicateRecords([...mergedRemote, ...preservedLocal], 'PCL');
    try {
      safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
      window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
    } catch (e) {}

    return inMemoryParcels;
  },

  mergeRemoteLostFound(remoteList: LostFoundRecord[]): LostFoundRecord[] {
    this.initLostFound();
    if (!Array.isArray(remoteList)) return inMemoryLostFound;
    const deletedIds = getDeletedIdsMap();

    const localMap = new Map<string, LostFoundRecord>();
    inMemoryLostFound.forEach((localL) => {
      if (localL && localL.id && !deletedIds.has(String(localL.id).trim().toLowerCase())) {
        localMap.set(String(localL.id).trim().toLowerCase(), localL);
      }
    });

    const remoteMap = new Map<string, LostFoundRecord>();
    const mergedRemote = remoteList
      .filter((r) => r && r.id && !deletedIds.has(String(r.id).trim().toLowerCase()))
      .map((r) => {
        const key = String(r.id).trim().toLowerCase();
        remoteMap.set(key, r);
        const local = localMap.get(key);
        if (local) {
          return {
            ...r,
            photoUrl: r.photoUrl || local.photoUrl || '',
            secondaryPhotoUrl: r.secondaryPhotoUrl || local.secondaryPhotoUrl || '',
          };
        }
        return r;
      });

    const preservedLocal = inMemoryLostFound.filter((localL) => {
      if (!localL || !localL.id) return false;
      const idStr = String(localL.id).toLowerCase().trim();
      if (deletedIds.has(idStr)) return false;
      if (remoteList.length > 0 && (idStr.startsWith('lf-seed-') || idStr === 'lf-1' || idStr === 'lf-2' || idStr === 'lf-3')) {
        return false;
      }
      return !remoteMap.has(idStr);
    });

    inMemoryLostFound = deduplicateRecords([...mergedRemote, ...preservedLocal], 'LF');
    try {
      safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
      window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
    } catch (e) {}

    return inMemoryLostFound;
  },

  /**
   * Reconciles Isolation Room occupants from all loaded bookings (Facilities 1-9)
   * This guarantees that when a new device connects and downloads all bookings from Google Sheets,
   * any isolation bookings are automatically unpacked into bed occupants in the Isolation Tracker.
   */
  reconcileIsolationRoomsFromBookings(): IsolationRoomRecord[] {
    this.initIsolationRooms();
    this.init();

    if (!Array.isArray(inMemoryBookings) || inMemoryBookings.length === 0) {
      return inMemoryIsolationRooms;
    }

    const isoBookings = inMemoryBookings.filter((b) => {
      if (!b || b.status === 'CANCELLED') return false;
      if (b.id && (isIdDeleted(b.id) || isRecentlyCancelled(b.id))) return false;
      const fId = (b.facilityId || '').toLowerCase();
      const tab = (b.sheetTabName || '').toLowerCase();
      const stage = (b.stage || '').toLowerCase();
      const bId = (b.id || '').toUpperCase();
      return (
        fId.includes('isolation') ||
        fId.includes('room') ||
        tab.includes('isolation') ||
        tab.includes('room') ||
        bId.startsWith('ISO-') ||
        stage.includes('room r-') ||
        stage.includes('room b-') ||
        stage.includes('building r') ||
        stage.includes('building b')
      );
    });

    if (isoBookings.length === 0) {
      return inMemoryIsolationRooms;
    }

    // Clone current rooms
    const updatedRooms = inMemoryIsolationRooms.map((r) => ({
      ...r,
      occupants: Array.isArray(r.occupants) ? [...r.occupants] : [],
    }));

    let hasChanges = false;

    isoBookings.forEach((b) => {
      // Determine canonical room number
      let rawRoomKey = b.stage || '';
      if (!rawRoomKey || rawRoomKey.toLowerCase() === 'stage 1' || rawRoomKey.toLowerCase() === 'main stage') {
        const idMatch = (b.id || '').match(/ISO-([RB]-\d{2})/i);
        if (idMatch) {
          rawRoomKey = idMatch[1];
        }
      }

      const canonicalRoom = getCanonicalRoomNumber(rawRoomKey);
      if (!canonicalRoom) return;

      const targetRoom = updatedRooms.find(
        (r) =>
          getCanonicalRoomNumber(r.buildingNumber) === canonicalRoom ||
          getCanonicalRoomNumber(r.id) === canonicalRoom
      );

      if (!targetRoom) return;

      // Extract bed number: check stage ("Bed 1", "Bed 2"), slotIds, or id
      let bedNum: 1 | 2 = 1;
      const combinedText = `${b.stage || ''} ${(b.slotIds || []).join(' ')} ${b.id || ''}`.toLowerCase();
      if (combinedText.includes('bed 2') || combinedText.includes('-b2') || combinedText.includes('bed2')) {
        bedNum = 2;
      } else if (combinedText.includes('bed 1') || combinedText.includes('-b1') || combinedText.includes('bed1')) {
        bedNum = 1;
      }

      // Check if this occupant or bed was discharged / deleted
      const bedKey1 = `${targetRoom.buildingNumber}-B${bedNum}`;
      const bedKey2 = `${targetRoom.id}-B${bedNum}`;
      const bedKey3 = `${canonicalRoom}-B${bedNum}`;
      const bedKey4 = `Room ${targetRoom.buildingNumber} (Bed ${bedNum})`;
      const bedKey5 = `Room ${canonicalRoom} (Bed ${bedNum})`;

      if (
        isDeleted('occupants', bedKey1) ||
        isDeleted('occupants', bedKey2) ||
        isDeleted('occupants', bedKey3) ||
        isDeleted('occupants', bedKey4) ||
        isDeleted('occupants', bedKey5) ||
        (b.id && (isDeleted('occupants', b.id) || isDeleted('bookings', b.id) || isRecentlyCancelled(b.id)))
      ) {
        return; // SKIP! This occupant was checked out/discharged
      }

      // Parse notes for checkout and details if present
      let parsedCheckOut = '';
      let parsedBookingType: 'General Guest' | 'Medical Isolation' = 'General Guest';
      let parsedNationalId = '';
      let parsedPurpose = '';
      let parsedHospital = '';
      let parsedStaffNotes = '';

      if (b.notes) {
        const coMatch = b.notes.match(/Check-out:\s*([^|]+)/i);
        if (coMatch && coMatch[1].trim() !== 'Open') parsedCheckOut = coMatch[1].trim();
        const typeMatch = b.notes.match(/Type:\s*([^|]+)/i);
        if (typeMatch && typeMatch[1].toLowerCase().includes('medical')) parsedBookingType = 'Medical Isolation';
        const idMatch = b.notes.match(/ID:\s*([^|]+)/i);
        if (idMatch) parsedNationalId = idMatch[1].trim();
        const purpMatch = b.notes.match(/Purpose:\s*([^|]+)/i);
        if (purpMatch) parsedPurpose = purpMatch[1].trim();
        const hospMatch = b.notes.match(/Hospital:\s*([^|]+)/i);
        if (hospMatch) parsedHospital = hospMatch[1].trim();
        const notesMatch = b.notes.match(/Notes:\s*([^|]+)/i);
        if (notesMatch) parsedStaffNotes = notesMatch[1].trim();
      }

      if (b.customOptions) {
        if (b.customOptions.bedNumber === 2 || b.customOptions.bedNumber === '2') bedNum = 2;
        if (b.customOptions.bookingType) parsedBookingType = b.customOptions.bookingType;
        if (b.customOptions.checkOut) parsedCheckOut = b.customOptions.checkOut;
        if (b.customOptions.nationalId) parsedNationalId = b.customOptions.nationalId;
      }

      const existingOccIdx = targetRoom.occupants.findIndex((o) => o.bedNumber === bedNum);
      const newOccupant: BedOccupant = {
        bedNumber: bedNum,
        patientName: b.customerName || 'Executive Resident',
        phoneNumber: b.phoneNumber || '',
        email: b.email || '',
        company: b.departmentOrTeam || 'General Resident',
        checkIn: b.date || getTodayDateString(),
        checkOut: parsedCheckOut,
        bookingType: parsedBookingType,
        nationalId: parsedNationalId,
        purposeOfStay: parsedPurpose,
        hospitalReferral: parsedHospital,
        staffNotes: parsedStaffNotes || b.notes || '',
        bookedByStaff: b.bookedByStaff || 'Helpdesk Admin',
      };

      if (existingOccIdx >= 0) {
        // Update if existing occupant has missing details
        targetRoom.occupants[existingOccIdx] = {
          ...targetRoom.occupants[existingOccIdx],
          ...newOccupant,
        };
      } else {
        targetRoom.occupants.push(newOccupant);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      inMemoryIsolationRooms = updatedRooms.map((r) => this.normalizeRoom(r));
      try {
        safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
        window.dispatchEvent(new CustomEvent('tamimi_isolation_updated'));
      } catch (e) {}
    }

    return inMemoryIsolationRooms;
  },

  mergeRemoteIsolationRooms(remoteList: IsolationRoomRecord[]): IsolationRoomRecord[] {
    this.initIsolationRooms();
    if (!Array.isArray(remoteList) || remoteList.length === 0) {
      // Even if remote isolation array is empty, attempt reconciliation from bookings
      return this.reconcileIsolationRoomsFromBookings();
    }

    const remoteMap = new Map<string, IsolationRoomRecord>();
    remoteList.forEach((r) => {
      if (r && (r.id || r.buildingNumber)) {
        const canonical = getCanonicalRoomNumber(r.buildingNumber || r.id);
        const rawKey = String(r.id || r.buildingNumber).trim().toLowerCase();
        const norm = this.normalizeRoom(r);
        if (canonical) {
          remoteMap.set(canonical.toLowerCase(), norm);
        }
        remoteMap.set(rawKey, norm);
      }
    });

    const merged = inMemoryIsolationRooms.map((localR) => {
      const canonical = getCanonicalRoomNumber(localR.buildingNumber || localR.id).toLowerCase();
      const rawKey = String(localR.id || localR.buildingNumber).trim().toLowerCase();
      
      let remoteMatch: IsolationRoomRecord | undefined;
      if (canonical && remoteMap.has(canonical)) {
        remoteMatch = remoteMap.get(canonical);
      } else if (remoteMap.has(rawKey)) {
        remoteMatch = remoteMap.get(rawKey);
      }

      if (remoteMatch) {
        // Filter out occupants that were previously discharged/deleted locally
        const validRemoteOccupants = (remoteMatch.occupants || []).filter(
          (occ) =>
            !isDeleted('occupants', occ.id) &&
            !isDeleted('occupants', `${remoteMatch!.buildingNumber}-B${occ.bedNumber}`) &&
            !isDeleted('occupants', `${remoteMatch!.id}-B${occ.bedNumber}`) &&
            !isDeleted('occupants', `${canonical}-B${occ.bedNumber}`) &&
            !isDeleted('occupants', `Room ${remoteMatch!.buildingNumber} (Bed ${occ.bedNumber})`)
        );

        const validLocalOccupants = (localR.occupants || []).filter(
          (occ) =>
            !isDeleted('occupants', occ.id) &&
            !isDeleted('occupants', `${localR.buildingNumber}-B${occ.bedNumber}`) &&
            !isDeleted('occupants', `${localR.id}-B${occ.bedNumber}`) &&
            !isDeleted('occupants', `${canonical}-B${occ.bedNumber}`) &&
            !isDeleted('occupants', `Room ${localR.buildingNumber} (Bed ${occ.bedNumber})`)
        );

        if (validRemoteOccupants.length > 0) {
          return {
            ...remoteMatch,
            occupants: validRemoteOccupants,
            status: 'Occupied' as const,
          };
        } else if (validLocalOccupants.length > 0) {
          return {
            ...localR,
            occupants: validLocalOccupants,
            status: 'Occupied' as const,
          };
        }
        return {
          ...remoteMatch,
          occupants: [],
          status: 'VACANT' as const,
          patientName: '',
          company: '',
          checkIn: '',
          checkOut: '',
        };
      }

      // If no remote match, filter local occupants as well
      const validLocalOccupants = (localR.occupants || []).filter(
        (occ) =>
          !isDeleted('occupants', occ.id) &&
          !isDeleted('occupants', `${localR.buildingNumber}-B${occ.bedNumber}`) &&
          !isDeleted('occupants', `${localR.id}-B${occ.bedNumber}`) &&
          !isDeleted('occupants', `${canonical}-B${occ.bedNumber}`) &&
          !isDeleted('occupants', `Room ${localR.buildingNumber} (Bed ${occ.bedNumber})`)
      );

      return {
        ...localR,
        occupants: validLocalOccupants,
        status: validLocalOccupants.length > 0 ? ('Occupied' as const) : ('VACANT' as const),
      };
    });

    inMemoryIsolationRooms = merged;
    try {
      safeSetLocalStorage(ISOLATION_ROOMS_KEY, JSON.stringify(inMemoryIsolationRooms));
      notifyBookingsChanged();
      window.dispatchEvent(new CustomEvent('tamimi_isolation_updated'));
    } catch (e) {}

    // Also reconcile from any newly loaded bookings
    this.reconcileIsolationRoomsFromBookings();

    return inMemoryIsolationRooms;
  },

  // Master schedule reference key (e.g. GRP-CHANDPATEL-CRIC)
  getMasterScheduleRef(booking: Booking): string {
    if (!booking) return '';
    if (booking.recurringGroupId) return booking.recurringGroupId;
    const namePart = (booking.customerName || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10)
      .toUpperCase() || 'CLIENT';
    const facPart = (booking.facilityId || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'FAC';
    return `GRP-${namePart}-${facPart}`;
  },

  // Fast search engine: searches by Booking ID, Group ID, Phone, Customer, Stage, Facility instantly
  searchBookings(query: string): Booking[] {
    this.init();
    if (!query || query.trim() === '') return [];

    const rawTrimmed = query.trim();
    const cleanQuery = rawTrimmed.toLowerCase();
    const digitsOnly = query.replace(/\D/g, '');
    const cleanNoDashes = cleanQuery.replace(/[^a-z0-9]/g, '');

    const directMatches = inMemoryBookings.filter((b) => {
      if (!b) return false;
      // 1. Check Booking ID
      if (b.id && String(b.id).toLowerCase().includes(cleanQuery)) return true;
      if (b.id && cleanNoDashes && String(b.id).toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanNoDashes)) return true;

      // 2. Check explicit recurring group ID
      if (b.recurringGroupId && String(b.recurringGroupId).toLowerCase().includes(cleanQuery)) return true;
      if (b.recurringGroupId && cleanNoDashes && String(b.recurringGroupId).toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanNoDashes)) return true;

      // 3. Check Master Schedule Reference (e.g. GRP-CHANDPATEL-CRIC)
      const masterRef = this.getMasterScheduleRef(b).toLowerCase();
      const masterRefNoDashes = masterRef.replace(/[^a-z0-9]/g, '');
      if (masterRef && (masterRef.includes(cleanQuery) || cleanQuery.includes(masterRef))) return true;
      if (cleanNoDashes && (masterRefNoDashes.includes(cleanNoDashes) || cleanNoDashes.includes(masterRefNoDashes))) return true;

      // Check if user queried GRP pattern matching customer name
      if (cleanQuery.startsWith('grp') || cleanQuery.includes('grp')) {
        const custSlug = String(b.customerName || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (custSlug && (cleanQuery.includes(custSlug) || custSlug.includes(cleanNoDashes.replace(/^grp/, '')))) return true;
      }

      // 4. Check Customer Name
      if (b.customerName && String(b.customerName).toLowerCase().includes(cleanQuery)) return true;
      const custSlug = String(b.customerName || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (custSlug && cleanNoDashes && (custSlug.includes(cleanNoDashes) || cleanNoDashes.includes(custSlug))) return true;

      // 5. Check Phone Number
      const phoneDigits = String(b.phoneNumber || '').replace(/\D/g, '');
      if (digitsOnly.length >= 3 && phoneDigits.includes(digitsOnly)) return true;
      if (b.phoneNumber && String(b.phoneNumber).toLowerCase().includes(cleanQuery)) return true;

      // 6. Check email or department
      if (b.email && String(b.email).toLowerCase().includes(cleanQuery)) return true;
      if (b.departmentOrTeam && String(b.departmentOrTeam).toLowerCase().includes(cleanQuery)) return true;

      // 7. Check facility or stage
      if (b.facilityName && String(b.facilityName).toLowerCase().includes(cleanQuery)) return true;
      if (b.facilityId && String(b.facilityId).toLowerCase().includes(cleanQuery)) return true;
      if (b.stage && String(b.stage).toLowerCase().includes(cleanQuery)) return true;

      // 8. Check recurring summary
      if (b.recurringSummary && String(b.recurringSummary).toLowerCase().includes(cleanQuery)) return true;

      // 9. Check notes
      if (b.notes && String(b.notes).toLowerCase().includes(cleanQuery)) return true;

      return false;
    });

    // If any direct match belongs to a recurring/multi-slot group, pull in ALL members of that group!
    const resultsMap = new Map<string, Booking>();
    directMatches.forEach((b) => {
      if (!b || !b.id) return;
      resultsMap.set(b.id, b);
      if (b.recurringGroupId || (b.customerName && b.phoneNumber)) {
        const linked = this.getLinkedBookings(b) || [];
        if (linked.length > 1) {
          linked.forEach((lb) => {
            if (lb && lb.id) resultsMap.set(lb.id, lb);
          });
        }
      }
    });

    return Array.from(resultsMap.values()).sort((a, b) => {
      const createdA = a.createdAt || '';
      const createdB = b.createdAt || '';
      const createdComp = createdB.localeCompare(createdA);
      if (createdComp !== 0) return createdComp;
      return (b.date || '').localeCompare(a.date || '');
    });
  },

  // Search isolation room records by guest name, company, phone, or room number
  searchIsolationRooms(query: string): { room: IsolationRoomRecord; occupants: BedOccupant[] }[] {
    const rooms = this.getIsolationRooms();
    if (!query || !query.trim()) return [];

    const clean = query.trim().toLowerCase();
    const digitsOnly = query.replace(/\D/g, '');

    const results: { room: IsolationRoomRecord; occupants: BedOccupant[] }[] = [];

    rooms.forEach((room) => {
      if (!room) return;
      const bNum = String(room.buildingNumber || '').toLowerCase();
      const bBld = String(room.building || '').toLowerCase();
      const bId = String(room.id || '').toLowerCase();

      const isRoomMatch =
        bNum.includes(clean) ||
        bBld.includes(clean) ||
        bId.includes(clean);

      const matchingOccupants = (room.occupants || []).filter((occ) => {
        if (!occ || !occ.patientName) return false;
        const pName = String(occ.patientName || '').toLowerCase();
        const comp = String(occ.company || '').toLowerCase();
        const natId = String(occ.nationalId || '').toLowerCase();
        if (pName.includes(clean)) return true;
        if (comp && comp.includes(clean)) return true;
        if (natId && natId.includes(clean)) return true;
        const phoneDigits = String(occ.phoneNumber || '').replace(/\D/g, '');
        if (digitsOnly.length >= 3 && phoneDigits.includes(digitsOnly)) return true;
        return false;
      });

      if (isRoomMatch || matchingOccupants.length > 0) {
        results.push({
          room,
          occupants: matchingOccupants.length > 0 ? matchingOccupants : (room.occupants || []),
        });
      }
    });

    return results;
  },

  // Retrieve all linked bookings in a multi-day or recurring schedule
  getLinkedBookings(bookingOrId: Booking | string): Booking[] {
    this.init();
    let targetBooking: Booking | undefined;
    if (typeof bookingOrId === 'string') {
      const q = String(bookingOrId).trim().toLowerCase();
      const qNoDashes = q.replace(/[^a-z0-9]/g, '');
      targetBooking = inMemoryBookings.find((b) => b && String(b.id || '').toLowerCase() === q);
      if (!targetBooking) {
        const groupMatches = inMemoryBookings.filter((b) => {
          if (!b) return false;
          if (b.recurringGroupId && String(b.recurringGroupId).toLowerCase() === q) return true;
          const ref = this.getMasterScheduleRef(b).toLowerCase();
          if (ref === q || ref.replace(/[^a-z0-9]/g, '') === qNoDashes) return true;
          return false;
        });
        if (groupMatches.length > 0) {
          return groupMatches.sort((a, b) => {
            const dateComp = String(a.date || '').localeCompare(String(b.date || ''));
            if (dateComp !== 0) return dateComp;
            return String(a.startTime || '').localeCompare(String(b.startTime || ''));
          });
        }
        targetBooking = this.getBookingById(bookingOrId);
      }
    } else {
      targetBooking = bookingOrId;
    }

    if (!targetBooking) return [];

    // 1. If explicit recurringGroupId exists, match all bookings with the same recurringGroupId
    if (targetBooking.recurringGroupId) {
      const targetGrp = String(targetBooking.recurringGroupId).toLowerCase();
      const group = inMemoryBookings.filter(
        (b) => b && b.recurringGroupId && String(b.recurringGroupId).toLowerCase() === targetGrp
      );
      if (group.length > 0) {
        return group.sort((a, b) => {
          const dateComp = String(a.date || '').localeCompare(String(b.date || ''));
          if (dateComp !== 0) return dateComp;
          return String(a.startTime || '').localeCompare(String(b.startTime || ''));
        });
      }
    }

    // 2. Comprehensive multi-slot, monthly, or multi-day matching:
    // Match by customerName + phoneNumber (digits) + facilityId
    if (targetBooking.customerName && targetBooking.phoneNumber) {
      const custClean = String(targetBooking.customerName || '').toLowerCase().trim();
      const phoneClean = String(targetBooking.phoneNumber || '').replace(/\D/g, '');
      if (custClean.length >= 2 && phoneClean.length >= 4) {
        const group = inMemoryBookings.filter((b) => {
          if (!b || b.facilityId !== targetBooking!.facilityId) return false;
          const bCust = String(b.customerName || '').toLowerCase().trim();
          const bPhone = String(b.phoneNumber || '').replace(/\D/g, '');
          const isNameMatch = bCust === custClean || (bCust.length > 3 && custClean.includes(bCust)) || (custClean.length > 3 && bCust.includes(custClean));
          const isPhoneMatch = bPhone === phoneClean || (bPhone.length >= 5 && phoneClean.endsWith(bPhone)) || (phoneClean.length >= 5 && bPhone.endsWith(phoneClean));
          return isNameMatch && isPhoneMatch;
        });
        if (group.length > 1) {
          return group.sort((a, b) => {
            const dateComp = String(a.date || '').localeCompare(String(b.date || ''));
            if (dateComp !== 0) return dateComp;
            return String(a.startTime || '').localeCompare(String(b.startTime || ''));
          });
        }
      }
    }

    // 3. Fallback: single booking
    return [targetBooking];
  },

  // Cancel an entire recurring group by recurringGroupId or master ID
  cancelRecurringGroup(groupId: string, reason?: string): { success: boolean; cancelledCount: number; error?: string } {
    this.init();
    if (!groupId) return { success: false, cancelledCount: 0, error: 'Group ID is required' };
    const cleanGroupId = String(groupId).trim().toLowerCase();
    const cleanNoDashes = cleanGroupId.replace(/[^a-z0-9]/g, '');
    const matching = inMemoryBookings.filter(
      (b) =>
        b &&
        ((b.recurringGroupId && String(b.recurringGroupId).toLowerCase() === cleanGroupId) ||
          String(b.id || '').toLowerCase() === cleanGroupId ||
          this.getMasterScheduleRef(b).toLowerCase() === cleanGroupId ||
          this.getMasterScheduleRef(b).toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNoDashes)
    );

    if (matching.length === 0) {
      return { success: false, cancelledCount: 0, error: `No bookings found for schedule group "${groupId}".` };
    }

    let cancelledCount = 0;
    const cancelReasonText = reason || 'Cancelled entire recurring schedule';

    inMemoryBookings = inMemoryBookings.map((b) => {
      if (!b) return b;
      const isMatch =
        (b.recurringGroupId && String(b.recurringGroupId).toLowerCase() === cleanGroupId) ||
        String(b.id || '').toLowerCase() === cleanGroupId ||
        this.getMasterScheduleRef(b).toLowerCase() === cleanGroupId ||
        this.getMasterScheduleRef(b).toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNoDashes;
      if (isMatch && b.status !== 'CANCELLED') {
        recordRecentCancellation(b.id, cancelReasonText);
        cancelledCount++;
        const cancelledAt = new Date().toISOString();
        const effectiveCancelledBy = AuthService.getCurrentUser()?.username || 'Staff';

        // Record in cancellation log
        const logEntry: CancellationLogEntry = {
          id: `CLOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          bookingId: b.id,
          customerName: b.customerName || 'Executive Guest',
          phoneNumber: b.phoneNumber || '',
          facilityName: b.facilityName || b.facilityId || 'Facility',
          facilityId: b.facilityId,
          stage: b.stage || '',
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          durationMinutes: b.durationMinutes,
          guestsCount: b.numberOfGuests || 1,
          cancelledAt: cancelledAt,
          cancelledBy: effectiveCancelledBy,
          cancellationReason: cancelReasonText,
          createdAt: b.createdAt,
          sheetTabName: b.sheetTabName,
        };
        this.recordCancellationLog(logEntry);

        return {
          ...b,
          status: 'CANCELLED',
          cancellationReason: cancelReasonText,
          cancelledAt: cancelledAt,
          cancelledBy: effectiveCancelledBy,
        };
      }
      return b;
    });

    this.saveBookings(inMemoryBookings);

    // Push cancellations to remote Google Sheets for each booking
    matching.forEach((b) => {
      import('./gasService')
        .then(({ GasService }) => {
          GasService.pushCancelToRemote({
            bookingId: b.id,
            phoneNumber: b.phoneNumber,
            reason: cancelReasonText,
            facilityName: b.facilityName || b.facilityId,
            sheetTabName: b.sheetTabName,
            stage: b.stage,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            durationMinutes: b.durationMinutes,
            guestsCount: b.numberOfGuests,
            customerName: b.customerName,
            cancelledBy: AuthService.getCurrentUser()?.username || 'Staff',
          }).catch(console.warn);
        })
        .catch(() => {});
    });

    return { success: true, cancelledCount };
  },

  // Get all recurring or multi-day booking schedule groups
  getAllRecurringGroups(): {
    groupId: string;
    bookings: Booking[];
    facilityName: string;
    facilityId: string;
    stage: string;
    customerName: string;
    phoneNumber: string;
    departmentOrTeam?: string;
    summary: string;
    totalCount: number;
    activeCount: number;
    cancelledCount: number;
    startDate: string;
    endDate: string;
  }[] {
    this.init();
    const groupMap = new Map<string, Booking[]>();

    inMemoryBookings.forEach((b) => {
      let key = b.recurringGroupId;
      if (!key && b.isRecurring) {
        key = `AUTO-REC-${(b.phoneNumber || '').replace(/\D/g, '')}-${b.facilityId}-${b.stage}`;
      }
      if (key) {
        const existing = groupMap.get(key) || [];
        existing.push(b);
        groupMap.set(key, existing);
      }
    });

    const groups: {
      groupId: string;
      bookings: Booking[];
      facilityName: string;
      facilityId: string;
      stage: string;
      customerName: string;
      phoneNumber: string;
      departmentOrTeam?: string;
      summary: string;
      totalCount: number;
      activeCount: number;
      cancelledCount: number;
      startDate: string;
      endDate: string;
    }[] = [];

    groupMap.forEach((bookings, groupId) => {
      if (bookings.length === 0) return;
      bookings.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      const first = bookings[0];
      const last = bookings[bookings.length - 1];
      const activeCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
      const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

      groups.push({
        groupId,
        bookings,
        facilityName: first.facilityName,
        facilityId: first.facilityId,
        stage: first.stage,
        customerName: first.customerName,
        phoneNumber: first.phoneNumber,
        departmentOrTeam: first.departmentOrTeam,
        summary: first.recurringSummary || `${bookings.length} Sessions (${first.date} to ${last.date})`,
        totalCount: bookings.length,
        activeCount,
        cancelledCount,
        startDate: first.date,
        endDate: last.date,
      });
    });

    // Sort newest schedule groups first
    groups.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return groups;
  },

  getBookingById(id: string): Booking | undefined {
    this.init();
    if (!id) return undefined;
    const cleanId = id.trim().toLowerCase();
    const cleanNoDashes = cleanId.replace(/[^a-z0-9]/g, '');

    // 1. Direct ID match
    const direct = inMemoryBookings.find((b) => b && b.id && b.id.toLowerCase() === cleanId);
    if (direct) return direct;

    // 2. ID without dashes
    const noDashMatch = inMemoryBookings.find(
      (b) => b && b.id && b.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNoDashes
    );
    if (noDashMatch) return noDashMatch;

    // 3. recurringGroupId match
    const grpMatch = inMemoryBookings.find(
      (b) => b && b.recurringGroupId && b.recurringGroupId.toLowerCase() === cleanId
    );
    if (grpMatch) return grpMatch;

    // 4. Master schedule reference match (e.g. GRP-CHANDPATEL-CRIC)
    const masterMatch = inMemoryBookings.find((b) => {
      if (!b) return false;
      const ref = this.getMasterScheduleRef(b).toLowerCase();
      return ref === cleanId || ref.replace(/[^a-z0-9]/g, '') === cleanNoDashes;
    });
    if (masterMatch) return masterMatch;

    return undefined;
  },

  getBookingsByPhone(phone: string): Booking[] {
    this.init();
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits) return [];
    return inMemoryBookings.filter((b) => {
      const bDigits = (b.phoneNumber || '').replace(/\D/g, '');
      return bDigits.includes(cleanDigits) || cleanDigits.includes(bDigits);
    });
  },

  // Get active bookings count for a facility on a date across all stages
  getBookedCountForFacility(facility: Facility, dateStr: string): number {
    this.init();
    const targetDate = normalizeDateString(dateStr);
    return inMemoryBookings.filter(
      (b) =>
        b.status !== 'CANCELLED' &&
        isFacilityMatch(b, facility) &&
        normalizeDateString(b.date) === targetDate
    ).length;
  },

  // Get booked count for a specific stage
  getBookedCountForStage(facility: Facility, dateStr: string, stageName: string): number {
    this.init();
    const targetDate = normalizeDateString(dateStr);
    return inMemoryBookings.filter(
      (b) =>
        b.status !== 'CANCELLED' &&
        isFacilityMatch(b, facility) &&
        normalizeDateString(b.date) === targetDate &&
        isStageMatch(b.stage, stageName, facility)
    ).length;
  },

  // Generate Slots for a facility on a specific date & stage
  getFacilitySlots(facility: Facility, dateStr: string, selectedStage: string): TimeSlot[] {
    this.init();
    const targetDate = normalizeDateString(dateStr);
    const startMinutes = timeToMinutes(facility.openTime || '07:00');
    const endMinutes = timeToMinutes(facility.closeTime || '23:00');
    const duration = facility.defaultSlotDurationMinutes || 60;

    // Get active bookings for this facility, date, stage
    const activeBookings = inMemoryBookings.filter(
      (b) =>
        b.status !== 'CANCELLED' &&
        isFacilityMatch(b, facility) &&
        normalizeDateString(b.date) === targetDate &&
        isStageMatch(b.stage, selectedStage, facility)
    );

    const slots: TimeSlot[] = [];
    const disabledSet = new Set(facility.disabledSlotTimes || []);

    // 1. Standard generated slots (omitting disabled slots)
    for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
      const slotStartStr = minutesToTime(current);
      if (disabledSet.has(slotStartStr)) continue;

      const slotEndStr = minutesToTime(current + duration);
      const slotId = `${facility.id}-${dateStr}-${slotStartStr}-${slotEndStr}-${selectedStage}`;

      // Check if slot falls in a defined break time
      let isBreak = false;
      let breakLabel = '';
      if (facility.breaks && facility.breaks.length > 0) {
        for (const brk of facility.breaks) {
          const brkStart = timeToMinutes(brk.start);
          const brkEnd = timeToMinutes(brk.end);
          // Check overlap
          if (current < brkEnd && current + duration > brkStart) {
            isBreak = true;
            breakLabel = brk.label;
            break;
          }
        }
      }

      // Check if slot falls in an administrative blockout (Maintenance / VIP / Closure)
      const blockout = this.isSlotBlocked(facility.id, selectedStage, targetDate, slotStartStr, slotEndStr);
      if (blockout) {
        isBreak = true;
        breakLabel = `⛔ ${blockout.reason}`;
      }

      // Check if booked
      const booking = activeBookings.find((b) => {
        const bStart = timeToMinutes(b.startTime);
        let bEnd = timeToMinutes(b.endTime);
        if (bEnd <= bStart) {
          bEnd = bStart + (b.durationMinutes || facility.defaultSlotDurationMinutes || 30);
        }
        return current < bEnd && current + duration > bStart;
      });

      let status: 'AVAILABLE' | 'BOOKED' | 'BREAK' = 'AVAILABLE';
      if (isBreak) {
        status = 'BREAK';
      } else if (booking) {
        status = 'BOOKED';
      }

      slots.push({
        id: slotId,
        startTime: slotStartStr,
        endTime: slotEndStr,
        status,
        facilityId: facility.id,
        stage: selectedStage,
        date: dateStr,
        bookingId: booking?.id,
        bookedBy: booking?.customerName,
        bookedPhone: booking?.phoneNumber,
        bookedByStaff: booking?.bookedByStaff,
        breakLabel: isBreak ? breakLabel : undefined,
      });
    }

    // 2. Custom Slots dynamically added by Super Administrator
    if (facility.customSlots && facility.customSlots.length > 0) {
      for (const cs of facility.customSlots) {
        const slotStartStr = cs.startTime;
        const slotEndStr = cs.endTime;
        const slotId = `${facility.id}-${dateStr}-${slotStartStr}-${slotEndStr}-${selectedStage}`;

        const booking = activeBookings.find((b) => {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          const csStart = timeToMinutes(slotStartStr);
          const csEnd = timeToMinutes(slotEndStr);
          return csStart < bEnd && csEnd > bStart;
        });

        let status: 'AVAILABLE' | 'BOOKED' | 'BREAK' = 'AVAILABLE';
        if (cs.isBreak) {
          status = 'BREAK';
        } else if (booking) {
          status = 'BOOKED';
        }

        // Avoid exact duplicates
        if (!slots.some((s) => s.startTime === slotStartStr && s.endTime === slotEndStr)) {
          slots.push({
            id: slotId,
            startTime: slotStartStr,
            endTime: slotEndStr,
            status,
            facilityId: facility.id,
            stage: selectedStage,
            date: dateStr,
            bookingId: booking?.id,
            bookedBy: booking?.customerName,
            bookedPhone: booking?.phoneNumber,
            bookedByStaff: booking?.bookedByStaff,
            breakLabel: cs.isBreak ? (cs.label || 'Reserved Break') : cs.label,
          });
        }
      }
    }

    // Sort slots chronologically
    slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return slots;
  },

  createBooking(
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'> & {
      id?: string;
      isForceOverride?: boolean;
      replaceExisting?: boolean;
    }
  ): { success: boolean; booking?: Booking; error?: string } {
    this.init();

    const isForceOverride = Boolean(
      bookingData.isForceOverride || bookingData.notes?.includes('SUPREME_VIP_OVERRIDE')
    );

    // 0. Supreme Admin Facility Lockdown Check (Suspended/Closed by Supreme Admin)
    const lockdownCheck = FacilityLockdownService.isFacilityBlocked(bookingData.facilityId);
    if (!isForceOverride && lockdownCheck.isBlocked && lockdownCheck.lockdown) {
      const remaining = FacilityLockdownService.getRemainingTimeString(lockdownCheck.lockdown.unlockAt);
      return {
        success: false,
        error: `Facility Locked: This facility is temporarily suspended by Supreme Administration (${lockdownCheck.lockdown.reason}). Status: ${remaining}.`,
      };
    }

    // Check for slot collision with existing confirmed bookings (Anti-Conflict Engine)
    const normTargetDate = normalizeDateString(bookingData.date);
    const newStart = timeToMinutes(bookingData.startTime);
    const newEnd = timeToMinutes(bookingData.endTime);
    const facilityObj =
      FACILITIES.find((f) => f.id === bookingData.facilityId) ||
      ({ id: bookingData.facilityId, name: bookingData.facilityName || '', stages: [] } as any);

    const collision = inMemoryBookings.find(
      (b) =>
        b.status !== 'CANCELLED' &&
        isFacilityMatch(b, facilityObj) &&
        normalizeDateString(b.date) === normTargetDate &&
        isStageMatch(b.stage, bookingData.stage, facilityObj) &&
        timeToMinutes(b.startTime) < newEnd &&
        timeToMinutes(b.endTime) > newStart
    );

    if (collision) {
      if (isForceOverride) {
        if (bookingData.replaceExisting) {
          // Cancel existing booking to make way for Super Admin VIP Force reservation
          collision.status = 'CANCELLED';
          collision.cancellationReason = 'Preempted by Super Administrator Executive VIP Override';
        }
      } else {
        return {
          success: false,
          error: `Slot Conflict: Time slot ${bookingData.startTime} - ${bookingData.endTime} on ${bookingData.date} is already reserved by ${collision.customerName} (ID: ${collision.id}).`,
        };
      }
    }

    // Check if slot is blocked by administration
    if (!isForceOverride) {
      const blockout = this.isSlotBlocked(
        bookingData.facilityId,
        bookingData.stage,
        normTargetDate,
        bookingData.startTime,
        bookingData.endTime
      );
      if (blockout) {
        return {
          success: false,
          error: `Administrative Blockout: This slot is reserved for maintenance/VIP (${blockout.reason}).`,
        };
      }
    }

    const facilityCode = facilityObj ? facilityObj.code || 'FAC' : 'FAC';
    const id = bookingData.id || generateBookingId(facilityCode);

    const newBooking: Booking = {
      ...bookingData,
      date: normTargetDate,
      id,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    const updated = [newBooking, ...inMemoryBookings];
    this.saveBookings(updated);

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('tamimi_incoming_booking', { detail: { booking: newBooking } })
        );
      }
    } catch (e) {}

    return { success: true, booking: newBooking };
  },

  // Batch / Recurring booking validation & creation for long-term (e.g. 1 month weekly slots)
  checkRecurringAvailability(params: {
    facilityId: string;
    stage: string;
    dates: string[]; // List of YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }): {
    totalDates: number;
    availableDates: string[];
    conflictDates: { date: string; bookedBy: string; existingBookingId: string }[];
  } {
    this.init();
    const reqStart = timeToMinutes(params.startTime);
    const reqEnd = timeToMinutes(params.endTime);

    const availableDates: string[] = [];
    const conflictDates: { date: string; bookedBy: string; existingBookingId: string }[] = [];

    for (const d of params.dates) {
      const normD = normalizeDateString(d);
      const collision = inMemoryBookings.find(
        (b) =>
          b.status === 'CONFIRMED' &&
          b.facilityId === params.facilityId &&
          normalizeDateString(b.date) === normD &&
          b.stage === params.stage &&
          timeToMinutes(b.startTime) < reqEnd &&
          timeToMinutes(b.endTime) > reqStart
      );

      if (collision) {
        conflictDates.push({
          date: normD,
          bookedBy: collision.customerName,
          existingBookingId: collision.id,
        });
      } else {
        availableDates.push(normD);
      }
    }

    return {
      totalDates: params.dates.length,
      availableDates,
      conflictDates,
    };
  },

  createRecurringBookings(params: {
    facilityId: string;
    facilityName: string;
    sheetTabName: string;
    stage: string;
    dates: string[];
    startTime: string;
    endTime: string;
    durationMinutes: number;
    customerName: string;
    phoneNumber: string;
    bookedByStaff?: string;
    email?: string;
    departmentOrTeam?: string;
    numberOfGuests: number;
    notes?: string;
    recurringSummary?: string;
  }): {
    success: boolean;
    createdBookings: Booking[];
    skippedDates: string[];
    error?: string;
  } {
    this.init();
    const facility = FACILITIES.find((f) => f.id === params.facilityId);
    const facilityCode = facility ? facility.code : 'REC';
    const recurringGroupId = `GRP-${facilityCode}-${Date.now()}`;

    const createdBookings: Booking[] = [];
    const skippedDates: string[] = [];

    const reqStart = timeToMinutes(params.startTime);
    const reqEnd = timeToMinutes(params.endTime);

    for (const d of params.dates) {
      const normD = normalizeDateString(d);
      // Check collision
      const collision = inMemoryBookings.find(
        (b) =>
          b.status === 'CONFIRMED' &&
          b.facilityId === params.facilityId &&
          normalizeDateString(b.date) === normD &&
          b.stage === params.stage &&
          timeToMinutes(b.startTime) < reqEnd &&
          timeToMinutes(b.endTime) > reqStart
      );

      if (collision) {
        skippedDates.push(normD);
        continue;
      }

      const slotId = `${params.facilityId}-${normD}-${params.startTime}-${params.endTime}-${params.stage}`;
      const singleBookingId = generateBookingId(facilityCode);

      const b: Booking = {
        id: singleBookingId,
        facilityId: params.facilityId,
        facilityName: params.facilityName,
        sheetTabName: params.sheetTabName,
        stage: params.stage,
        date: normD,
        startTime: params.startTime,
        endTime: params.endTime,
        durationMinutes: params.durationMinutes,
        slotIds: [slotId],
        customerName: params.customerName,
        phoneNumber: params.phoneNumber,
        bookedByStaff: params.bookedByStaff,
        email: params.email,
        departmentOrTeam: params.departmentOrTeam,
        numberOfGuests: params.numberOfGuests,
        notes: params.notes,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        isRecurring: true,
        recurringGroupId,
        recurringSummary: params.recurringSummary || `${params.dates.length} recurring sessions`,
      };

      createdBookings.push(b);
    }

    if (createdBookings.length === 0) {
      return {
        success: false,
        createdBookings: [],
        skippedDates,
        error: 'All selected dates have conflicts with existing bookings.',
      };
    }

    const updated = [...createdBookings, ...inMemoryBookings];
    this.saveBookings(updated);

    return {
      success: true,
      createdBookings,
      skippedDates,
    };
  },

  // ==========================================
  // CANCELLATION LOGS & AUTO-PURGE RETENTION
  // ==========================================

  getCancellationRetentionDays(): number {
    try {
      const val = localStorage.getItem(CANCELLATION_RETENTION_DAYS_KEY);
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 1) return parsed;
      }
    } catch (e) {}
    return 14; // Default 14-day retention in log before auto-purging
  },

  setCancellationRetentionDays(days: number): void {
    const safeDays = Math.max(1, Math.min(days, 365));
    safeSetLocalStorage(CANCELLATION_RETENTION_DAYS_KEY, String(safeDays));
    this.purgeExpiredCancellationLogs(safeDays);
    this.purgeExpiredCancelledBookings(safeDays);
  },

  getCancellationLogs(): CancellationLogEntry[] {
    this.purgeExpiredCancellationLogs();
    try {
      const raw = localStorage.getItem(CANCELLATION_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.sort((a: CancellationLogEntry, b: CancellationLogEntry) => new Date(b.cancelledAt || 0).getTime() - new Date(a.cancelledAt || 0).getTime());
        }
      }
    } catch (e) {
      console.warn('Failed reading cancellation logs from storage:', e);
    }
    return [];
  },

  recordCancellationLog(entry: CancellationLogEntry): void {
    if (!entry || !entry.bookingId) return;
    try {
      const logs = this.getCancellationLogs();
      const existingIdx = logs.findIndex((l) => l.bookingId === entry.bookingId || l.id === entry.id);
      if (existingIdx >= 0) {
        logs[existingIdx] = entry;
      } else {
        logs.unshift(entry);
      }
      safeSetLocalStorage(CANCELLATION_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed writing cancellation log:', e);
    }
  },

  deleteCancellationLog(logIdOrBookingId: string): boolean {
    if (!logIdOrBookingId) return false;
    try {
      const logs = this.getCancellationLogs();
      const target = logIdOrBookingId.trim().toLowerCase();
      const filtered = logs.filter((l) => l.id.toLowerCase() !== target && l.bookingId.toLowerCase() !== target);
      if (filtered.length !== logs.length) {
        safeSetLocalStorage(CANCELLATION_LOGS_KEY, JSON.stringify(filtered));
        return true;
      }
    } catch (e) {}
    return false;
  },

  clearAllCancellationLogs(): void {
    try {
      safeSetLocalStorage(CANCELLATION_LOGS_KEY, JSON.stringify([]));
    } catch (e) {}
  },

  purgeExpiredCancellationLogs(retentionDays?: number): number {
    try {
      const days = retentionDays !== undefined ? retentionDays : this.getCancellationRetentionDays();
      const cutoffMs = Date.now() - (days * 24 * 60 * 60 * 1000);
      const raw = localStorage.getItem(CANCELLATION_LOGS_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return 0;

      const initialLen = parsed.length;
      const valid = parsed.filter((item: CancellationLogEntry) => {
        const cancelTime = item.cancelledAt ? new Date(item.cancelledAt).getTime() : 0;
        return cancelTime >= cutoffMs;
      });

      if (valid.length !== initialLen) {
        safeSetLocalStorage(CANCELLATION_LOGS_KEY, JSON.stringify(valid));
        return initialLen - valid.length;
      }
    } catch (e) {}
    return 0;
  },

  purgeExpiredCancelledBookings(retentionDays?: number): { purgedCount: number; remainingCount: number } {
    this.init();
    const days = retentionDays !== undefined ? retentionDays : this.getCancellationRetentionDays();
    const cutoffMs = Date.now() - (days * 24 * 60 * 60 * 1000);

    const initialLen = inMemoryBookings.length;
    inMemoryBookings = inMemoryBookings.filter((b) => {
      if (b.status !== 'CANCELLED') return true;
      const cancelTime = b.cancelledAt ? new Date(b.cancelledAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (cancelTime && cancelTime < cutoffMs) {
        return false; // Purge expired cancelled booking!
      }
      return true;
    });

    const purgedCount = initialLen - inMemoryBookings.length;
    if (purgedCount > 0) {
      this.saveBookings(inMemoryBookings);
    }

    this.purgeExpiredCancellationLogs(days);
    return { purgedCount, remainingCount: inMemoryBookings.length };
  },

  cancelBooking(bookingId: string, reason?: string, cancelledBy?: string): { success: boolean; error?: string; booking?: Booking; log?: CancellationLogEntry } {
    this.init();
    recordRecentCancellation(bookingId, reason);
    const index = inMemoryBookings.findIndex((b) => b.id.toLowerCase().trim() === bookingId.trim().toLowerCase());

    if (index === -1) {
      return { success: false, error: `Booking ID "${bookingId}" not found.` };
    }

    const currentBooking = inMemoryBookings[index];
    if (currentBooking.status === 'CANCELLED') {
      return { success: false, error: `Booking is already cancelled.` };
    }

    const cancelledAt = new Date().toISOString();
    const effectiveReason = reason || 'Cancelled by customer';
    const effectiveCancelledBy = cancelledBy || AuthService.getCurrentUser()?.username || 'Staff';

    const updatedBooking: Booking = {
      ...currentBooking,
      status: 'CANCELLED',
      cancellationReason: effectiveReason,
      cancelledAt: cancelledAt,
      cancelledBy: effectiveCancelledBy,
    };

    inMemoryBookings[index] = updatedBooking;
    this.saveBookings(inMemoryBookings);

    // Create & store rich cancellation log entry
    const logEntry: CancellationLogEntry = {
      id: `CLOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: updatedBooking.id,
      customerName: updatedBooking.customerName || 'Executive Guest',
      phoneNumber: updatedBooking.phoneNumber || '',
      facilityName: updatedBooking.facilityName || updatedBooking.facilityId || 'Facility',
      facilityId: updatedBooking.facilityId,
      stage: updatedBooking.stage || '',
      date: updatedBooking.date,
      startTime: updatedBooking.startTime,
      endTime: updatedBooking.endTime,
      durationMinutes: updatedBooking.durationMinutes,
      guestsCount: updatedBooking.numberOfGuests || 1,
      cancelledAt: cancelledAt,
      cancelledBy: effectiveCancelledBy,
      cancellationReason: effectiveReason,
      createdAt: updatedBooking.createdAt,
      sheetTabName: updatedBooking.sheetTabName,
    };

    this.recordCancellationLog(logEntry);

    return { success: true, booking: updatedBooking, log: logEntry };
  },

  updateBookingStatus(bookingId: string, newStatus: string): { success: boolean; error?: string; booking?: Booking } {
    this.init();
    const cleanId = bookingId.trim().toLowerCase();
    const index = inMemoryBookings.findIndex((b) => b.id.toLowerCase().trim() === cleanId);

    if (index === -1) {
      return { success: false, error: `Booking ID "${bookingId}" not found.` };
    }

    const currentBooking = inMemoryBookings[index];
    const updatedBooking: Booking = {
      ...currentBooking,
      status: newStatus as any,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'CANCELLED') {
      recordRecentCancellation(bookingId);
      updatedBooking.cancelledAt = new Date().toISOString();
    }

    inMemoryBookings[index] = updatedBooking;
    this.saveBookings(inMemoryBookings);
    return { success: true, booking: updatedBooking };
  },

  reassignBooking(
    bookingId: string,
    updates: Partial<Booking>
  ): { success: boolean; error?: string; booking?: Booking } {
    this.init();
    const cleanId = bookingId.trim().toLowerCase();
    const index = inMemoryBookings.findIndex((b) => b.id.toLowerCase().trim() === cleanId);

    if (index === -1) {
      return { success: false, error: `Booking ID "${bookingId}" not found.` };
    }

    const currentBooking = inMemoryBookings[index];
    const updatedBooking: Booking = {
      ...currentBooking,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    inMemoryBookings[index] = updatedBooking;
    this.saveBookings(inMemoryBookings);
    return { success: true, booking: updatedBooking };
  },

  updateBookingPriority(bookingId: string, priority: string): { success: boolean; error?: string; booking?: Booking } {
    return this.reassignBooking(bookingId, { priority });
  },

  updateBookingDepartment(bookingId: string, departmentOrTeam: string): { success: boolean; error?: string; booking?: Booking } {
    return this.reassignBooking(bookingId, { departmentOrTeam });
  },

  deleteBooking(bookingId: string): { success: boolean; error?: string } {
    this.init();
    const cleanId = bookingId.trim();
    recordDeletedId(cleanId);
    
    const prevCount = inMemoryBookings.length;
    inMemoryBookings = inMemoryBookings.filter((b) => b.id.toLowerCase().trim() !== cleanId.toLowerCase());
    
    this.saveBookings(inMemoryBookings);
    return { success: true };
  },

  resetToDefaultSampleData() {
    inMemoryBookings = [...SAMPLE_BOOKINGS];
    this.saveBookings(inMemoryBookings);
    return inMemoryBookings;
  },

  exportToCSV(customBookings?: Booking[]): string {
    this.init();
    const bookingsToExport = customBookings || inMemoryBookings;
    const headers = [
      'Booking ID',
      'Facility Name',
      'Sheet Tab',
      'Customer Name',
      'Phone Number',
      'Booked By (Staff/Helpdesk)',
      'Email',
      'Department/Team',
      'Priority',
      'Date',
      'Day Name',
      'Start Time (24h)',
      'Start Time (12h)',
      'End Time (24h)',
      'End Time (12h)',
      'Duration (Mins)',
      'Stage/Resource',
      'Number of Guests',
      'Status',
      'Recurring',
      'Notes',
      'Created At',
      'Cancelled At',
      'Cancellation Reason',
    ];

    const rows = bookingsToExport
      .filter((b) => b && b.id && b.id !== 'Booking ID')
      .map((b) => [
        `"${AuthService.sanitizeForCsv(b.id)}"`,
        `"${AuthService.sanitizeForCsv(b.facilityName || '')}"`,
        `"${AuthService.sanitizeForCsv(b.sheetTabName || '')}"`,
        `"${AuthService.sanitizeForCsv(b.customerName || '')}"`,
        `"${AuthService.sanitizeForCsv(b.phoneNumber || '')}"`,
        `"${AuthService.sanitizeForCsv(b.bookedByStaff || '')}"`,
        `"${AuthService.sanitizeForCsv(b.email || '')}"`,
        `"${AuthService.sanitizeForCsv(b.departmentOrTeam || '')}"`,
        `"${AuthService.sanitizeForCsv(b.priority || 'STANDARD')}"`,
        `"${AuthService.sanitizeForCsv(b.date || '')}"`,
        `"${AuthService.sanitizeForCsv(getDayName(b.date || ''))}"`,
        `"${AuthService.sanitizeForCsv(b.startTime || '')}"`,
        `"${AuthService.sanitizeForCsv(formatDisplayTime(b.startTime || ''))}"`,
        `"${AuthService.sanitizeForCsv(b.endTime || '')}"`,
        `"${AuthService.sanitizeForCsv(formatDisplayTime(b.endTime || ''))}"`,
        b.durationMinutes || 0,
        `"${AuthService.sanitizeForCsv(b.stage || '')}"`,
        b.numberOfGuests || 1,
        `"${AuthService.sanitizeForCsv(b.status || 'CONFIRMED')}"`,
        `"${b.isRecurring ? 'Yes' : 'No'}"`,
        `"${AuthService.sanitizeForCsv(b.notes || '')}"`,
        `"${AuthService.sanitizeForCsv(b.createdAt || '')}"`,
        `"${AuthService.sanitizeForCsv(b.cancelledAt || '')}"`,
        `"${AuthService.sanitizeForCsv(b.cancellationReason || '')}"`,
      ]);

    // Prepend UTF-8 BOM for perfect Excel compatibility
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  exportIsolationRoomsCsv(roomsToExport?: IsolationRoomRecord[]): string {
    const list = roomsToExport || this.getIsolationRooms();
    const headers = [
      'SL NO.',
      'Building Number',
      'Beds',
      'Occupant Name',
      'STATUS',
      'Booking Type',
      'COMPANY',
      'Check In',
      'Check Out',
      'Phone Number',
      'Email',
      'Purpose / Referral',
      'Room Condition',
      'Staff Notes',
    ];

    const rows = list.map((r) => [
      r.slNo,
      `"${AuthService.sanitizeForCsv(r.buildingNumber)}"`,
      `"${AuthService.sanitizeForCsv(r.beds)}"`,
      `"${AuthService.sanitizeForCsv(r.patientName || '')}"`,
      `"${AuthService.sanitizeForCsv(r.status || 'VACANT')}"`,
      `"${AuthService.sanitizeForCsv(r.bookingType || 'General Guest')}"`,
      `"${AuthService.sanitizeForCsv(r.company || '')}"`,
      `"${AuthService.sanitizeForCsv(r.checkIn || '')}"`,
      `"${AuthService.sanitizeForCsv(r.checkOut || '')}"`,
      `"${AuthService.sanitizeForCsv(r.phoneNumber || '')}"`,
      `"${AuthService.sanitizeForCsv(r.email || '')}"`,
      `"${AuthService.sanitizeForCsv(r.purposeOfStay || r.hospitalReferral || '')}"`,
      `"${AuthService.sanitizeForCsv(r.roomCondition || 'Cleaned & Ready')}"`,
      `"${AuthService.sanitizeForCsv(r.staffNotes || '')}"`,
    ]);

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  // -------------------------------------------------------------
  // 1. HANDOVER & TAKENOVER REGISTRY METHODS
  // -------------------------------------------------------------
  initHandover(): HandoverItemRecord[] {
    if (isHandoverInitialized) {
      return inMemoryHandovers;
    }
    try {
      const raw = localStorage.getItem(HANDOVER_RECORDS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Clean out any legacy mock demo IDs
          inMemoryHandovers = parsed.filter(
            (r) =>
              r &&
              r.id &&
              !r.id.startsWith('HO-20260830-001') &&
              !r.id.startsWith('HO-20260830-002') &&
              !r.id.startsWith('HO-20260829-003') &&
              !r.id.startsWith('HO-20260828-004') &&
              !r.id.startsWith('HO-20260827-005')
          );
        } else {
          inMemoryHandovers = [];
        }
      } else {
        inMemoryHandovers = [...INITIAL_HANDOVER_RECORDS];
        localStorage.setItem(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
      }
    } catch (e) {
      inMemoryHandovers = [...INITIAL_HANDOVER_RECORDS];
    }
    isHandoverInitialized = true;
    return inMemoryHandovers;
  },

  getHandoverRecords(): HandoverItemRecord[] {
    return [...this.initHandover()];
  },

  saveHandoverRecord(record: Partial<HandoverItemRecord> & { itemName: string; personName: string; phoneNumber: string }): HandoverItemRecord {
    this.initHandover();
    const existingIndex = record.id ? inMemoryHandovers.findIndex((r) => r.id === record.id) : -1;
    let saved: HandoverItemRecord;

    if (existingIndex >= 0) {
      saved = {
        ...inMemoryHandovers[existingIndex],
        ...record,
      } as HandoverItemRecord;
      inMemoryHandovers[existingIndex] = saved;
    } else {
      const now = new Date();
      const id = record.id || `HO-${getTodayDateString().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      saved = {
        id,
        type: record.type || 'GIVEN_OUT',
        category: record.category || 'Other Assets',
        itemName: record.itemName,
        quantity: record.quantity || 1,
        personName: record.personName,
        personType: record.personType || 'Resident Guest',
        departmentOrCompany: record.departmentOrCompany || '',
        roomNumber: record.roomNumber || '',
        phoneNumber: record.phoneNumber,
        badgeOrIdNumber: record.badgeOrIdNumber || '',
        issueDate: record.issueDate || getTodayDateString(),
        issueTime: record.issueTime || minutesToTime(now.getHours() * 60 + now.getMinutes()),
        expectedReturnDate: record.expectedReturnDate,
        actualReturnDate: record.actualReturnDate,
        status: record.status || (record.type === 'TAKEN_IN' ? 'IN_CUSTODY_HOLDING' : 'ACTIVE_BORROWED'),
        authorizedByStaff: record.authorizedByStaff || 'Front Desk Staff',
        condition: record.condition || 'Good',
        notes: record.notes || '',
        pickupAuthorizedPerson: record.pickupAuthorizedPerson || '',
        photoUrl: record.photoUrl || '',
        secondaryPhotoUrl: record.secondaryPhotoUrl || '',
        createdAt: record.createdAt || now.toISOString(),
      };
      inMemoryHandovers.unshift(saved);
    }

    try {
      localStorage.setItem(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
      window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
    } catch (e) {}

    return saved;
  },

  updateHandoverStatus(id: string, status: any, actualReturnDate?: string): boolean {
    this.initHandover();
    const index = inMemoryHandovers.findIndex((r) => r.id === id);
    if (index >= 0) {
      inMemoryHandovers[index] = {
        ...inMemoryHandovers[index],
        status,
        actualReturnDate: actualReturnDate || (status === 'RETURNED' || status === 'CLAIMED_PICKED_UP' ? getTodayDateString() : inMemoryHandovers[index].actualReturnDate),
      };
      try {
        localStorage.setItem(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
        window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
      } catch (e) {}
      return true;
    }
    return false;
  },

  saveHandoverRecords(records: HandoverItemRecord[]) {
    if (!Array.isArray(records)) return;
    inMemoryHandovers = [...records];
    try {
      safeSetLocalStorage(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
      window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
    } catch (e) {}
  },

  deleteHandoverRecord(id: string): boolean {
    this.initHandover();
    const cleanId = String(id).toLowerCase().trim();
    recordDeletedId(cleanId, 'handovers');
    const initialLen = inMemoryHandovers.length;
    inMemoryHandovers = inMemoryHandovers.filter((r) => String(r.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryHandovers.length !== initialLen) {
      try {
        safeSetLocalStorage(HANDOVER_RECORDS_KEY, JSON.stringify(inMemoryHandovers));
        window.dispatchEvent(new CustomEvent('tamimi_handover_updated'));
      } catch (e) {}
      return true;
    }
    return false;
  },

  exportHandoverCsv(recordsToExport?: HandoverItemRecord[]): string {
    const list = recordsToExport || this.getHandoverRecords();
    const headers = [
      'Record ID',
      'Transaction Type',
      'Category',
      'Item Description',
      'Quantity',
      'Person Name',
      'Person Type',
      'Room Number',
      'Department / Company',
      'Phone Number',
      'Badge / ID',
      'Issue Date',
      'Issue Time',
      'Expected Return',
      'Actual Return',
      'Status',
      'Authorized Staff',
      'Item Condition',
      'Pickup Authorized Person',
      'Notes',
    ];

    const rows = list.map((r) => [
      `"${AuthService.sanitizeForCsv(r.id)}"`,
      `"${AuthService.sanitizeForCsv(r.type)}"`,
      `"${AuthService.sanitizeForCsv(r.category)}"`,
      `"${AuthService.sanitizeForCsv(r.itemName)}"`,
      r.quantity || 1,
      `"${AuthService.sanitizeForCsv(r.personName)}"`,
      `"${AuthService.sanitizeForCsv(r.personType)}"`,
      `"${AuthService.sanitizeForCsv(r.roomNumber || '')}"`,
      `"${AuthService.sanitizeForCsv(r.departmentOrCompany || '')}"`,
      `"${AuthService.sanitizeForCsv(r.phoneNumber)}"`,
      `"${AuthService.sanitizeForCsv(r.badgeOrIdNumber || '')}"`,
      `"${AuthService.sanitizeForCsv(r.issueDate)}"`,
      `"${AuthService.sanitizeForCsv(r.issueTime)}"`,
      `"${AuthService.sanitizeForCsv(r.expectedReturnDate || '')}"`,
      `"${AuthService.sanitizeForCsv(r.actualReturnDate || '')}"`,
      `"${AuthService.sanitizeForCsv(r.status)}"`,
      `"${AuthService.sanitizeForCsv(r.authorizedByStaff)}"`,
      `"${AuthService.sanitizeForCsv(r.condition)}"`,
      `"${AuthService.sanitizeForCsv(r.pickupAuthorizedPerson || '')}"`,
      `"${AuthService.sanitizeForCsv(r.notes || '')}"`,
    ]);

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  // -------------------------------------------------------------
  // 2. PARCEL MONITORING REGISTRY METHODS
  // -------------------------------------------------------------
  initParcels(): ParcelRecord[] {
    if (isParcelInitialized) {
      return inMemoryParcels;
    }
    try {
      const raw = localStorage.getItem(PARCEL_RECORDS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Clean out any legacy mock demo IDs
          inMemoryParcels = parsed.filter(
            (r) =>
              r &&
              r.id &&
              !r.id.startsWith('PRC-20260830-101') &&
              !r.id.startsWith('PRC-20260830-102') &&
              !r.id.startsWith('PRC-20260829-103') &&
              !r.id.startsWith('PRC-20260828-104')
          );
        } else {
          inMemoryParcels = [];
        }
      } else {
        inMemoryParcels = [...INITIAL_PARCEL_RECORDS];
        safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
      }
    } catch (e) {
      inMemoryParcels = [...INITIAL_PARCEL_RECORDS];
    }
    isParcelInitialized = true;
    return inMemoryParcels;
  },

  getParcelRecords(): ParcelRecord[] {
    return [...this.initParcels()];
  },

  saveParcelRecord(record: Partial<ParcelRecord> & { trackingNumber: string; recipientName: string; roomNumber: string; phoneNumber: string }): ParcelRecord {
    this.initParcels();
    const existingIndex = record.id ? inMemoryParcels.findIndex((r) => r.id === record.id) : -1;
    let saved: ParcelRecord;

    if (existingIndex >= 0) {
      saved = {
        ...inMemoryParcels[existingIndex],
        ...record,
      } as ParcelRecord;
      inMemoryParcels[existingIndex] = saved;
    } else {
      const now = new Date();
      const id = record.id || `PRC-${getTodayDateString().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      saved = {
        id,
        trackingNumber: record.trackingNumber,
        courierCompany: record.courierCompany || 'Aramex',
        recipientName: record.recipientName,
        roomNumber: record.roomNumber,
        departmentOrCompany: record.departmentOrCompany || '',
        phoneNumber: record.phoneNumber,
        vipStatus: Boolean(record.vipStatus),
        parcelType: record.parcelType || 'Small Box',
        storageLocation: record.storageLocation || 'Parcel Holding Rack A',
        receivedDate: record.receivedDate || getTodayDateString(),
        receivedTime: record.receivedTime || minutesToTime(now.getHours() * 60 + now.getMinutes()),
        receivedByStaff: record.receivedByStaff || 'Front Desk Concierge',
        status: record.status || 'RECEIVED_IN_OFFICE',
        deliveredDate: record.deliveredDate,
        deliveredTime: record.deliveredTime,
        deliveredByStaff: record.deliveredByStaff,
        collectedByPerson: record.collectedByPerson,
        signatureProofOrOtp: record.signatureProofOrOtp,
        notes: record.notes || '',
        photoUrl: record.photoUrl || '',
        secondaryPhotoUrl: record.secondaryPhotoUrl || '',
        createdAt: record.createdAt || now.toISOString(),
      };
      inMemoryParcels.unshift(saved);
    }

    try {
      safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
      window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
    } catch (e) {}

    return saved;
  },

  updateParcelStatus(id: string, status: any, details?: { deliveredByStaff?: string; collectedByPerson?: string }): ParcelRecord | null {
    this.initParcels();
    const index = inMemoryParcels.findIndex((r) => r.id === id);
    if (index >= 0) {
      const now = new Date();
      const isDelivered = status === 'HANDED_TO_GUEST' || status === 'DELIVERED_TO_ROOM' || status === 'COLLECTED_BY_REP';
      const updated: ParcelRecord = {
        ...inMemoryParcels[index],
        status,
        deliveredDate: isDelivered ? (inMemoryParcels[index].deliveredDate || getTodayDateString()) : undefined,
        deliveredTime: isDelivered ? (inMemoryParcels[index].deliveredTime || minutesToTime(now.getHours() * 60 + now.getMinutes())) : undefined,
        deliveredByStaff: details?.deliveredByStaff || inMemoryParcels[index].deliveredByStaff,
        collectedByPerson: details?.collectedByPerson || inMemoryParcels[index].collectedByPerson,
      };
      inMemoryParcels[index] = updated;
      try {
        safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
        window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
      } catch (e) {}
      return updated;
    }
    return null;
  },

  saveParcelRecords(records: ParcelRecord[]) {
    if (!Array.isArray(records)) return;
    inMemoryParcels = [...records];
    try {
      safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
      window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
    } catch (e) {}
  },

  deleteParcelRecord(id: string): boolean {
    this.initParcels();
    const cleanId = String(id).toLowerCase().trim();
    recordDeletedId(cleanId, 'parcels');
    const initialLen = inMemoryParcels.length;
    inMemoryParcels = inMemoryParcels.filter((r) => String(r.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryParcels.length !== initialLen) {
      try {
        safeSetLocalStorage(PARCEL_RECORDS_KEY, JSON.stringify(inMemoryParcels));
        window.dispatchEvent(new CustomEvent('tamimi_parcels_updated'));
      } catch (e) {}
      return true;
    }
    return false;
  },

  exportParcelCsv(recordsToExport?: ParcelRecord[]): string {
    const list = recordsToExport || this.getParcelRecords();
    const headers = [
      'Parcel ID',
      'Tracking Number',
      'Courier Company',
      'Recipient Name',
      'Room Number',
      'VIP Status',
      'Department / Company',
      'Phone Number',
      'Parcel Type',
      'Storage Location',
      'Received Date',
      'Received Time',
      'Received By Staff',
      'Delivery Status',
      'Delivered Date',
      'Delivered Time',
      'Delivered By Staff',
      'Collected By Person',
      'Notes',
    ];

    const rows = list.map((r) => [
      `"${AuthService.sanitizeForCsv(r.id)}"`,
      `"${AuthService.sanitizeForCsv(r.trackingNumber)}"`,
      `"${AuthService.sanitizeForCsv(r.courierCompany)}"`,
      `"${AuthService.sanitizeForCsv(r.recipientName)}"`,
      `"${AuthService.sanitizeForCsv(r.roomNumber)}"`,
      r.vipStatus ? 'VIP Priority' : 'Standard',
      `"${AuthService.sanitizeForCsv(r.departmentOrCompany || '')}"`,
      `"${AuthService.sanitizeForCsv(r.phoneNumber)}"`,
      `"${AuthService.sanitizeForCsv(r.parcelType)}"`,
      `"${AuthService.sanitizeForCsv(r.storageLocation)}"`,
      `"${AuthService.sanitizeForCsv(r.receivedDate)}"`,
      `"${AuthService.sanitizeForCsv(r.receivedTime)}"`,
      `"${AuthService.sanitizeForCsv(r.receivedByStaff)}"`,
      `"${AuthService.sanitizeForCsv(r.status)}"`,
      `"${AuthService.sanitizeForCsv(r.deliveredDate || '')}"`,
      `"${AuthService.sanitizeForCsv(r.deliveredTime || '')}"`,
      `"${AuthService.sanitizeForCsv(r.deliveredByStaff || '')}"`,
      `"${AuthService.sanitizeForCsv(r.collectedByPerson || '')}"`,
      `"${AuthService.sanitizeForCsv(r.notes || '')}"`,
    ]);

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  // -------------------------------------------------------------
  // 3. LOST & FOUND REGISTRY METHODS
  // -------------------------------------------------------------
  initLostFound(): LostFoundRecord[] {
    if (isLostFoundInitialized) {
      return inMemoryLostFound;
    }
    try {
      const raw = localStorage.getItem(LOST_FOUND_RECORDS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Clean out any legacy mock demo IDs
          inMemoryLostFound = parsed.filter(
            (r) =>
              r &&
              r.id &&
              !r.id.startsWith('LNF-20260830-055') &&
              !r.id.startsWith('LNF-20260829-056') &&
              !r.id.startsWith('LNF-20260828-057') &&
              !r.id.startsWith('LNF-20260827-058')
          );
        } else {
          inMemoryLostFound = [];
        }
      } else {
        inMemoryLostFound = [...INITIAL_LOST_FOUND_RECORDS];
        safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
      }
    } catch (e) {
      inMemoryLostFound = [...INITIAL_LOST_FOUND_RECORDS];
    }
    isLostFoundInitialized = true;
    return inMemoryLostFound;
  },

  getLostFoundRecords(): LostFoundRecord[] {
    return [...this.initLostFound()];
  },

  saveLostFoundRecord(record: Partial<LostFoundRecord> & { itemName: string; locationFoundOrLost: string; finderOrReporterName: string; finderOrReporterPhone: string }): LostFoundRecord {
    this.initLostFound();
    const existingIndex = record.id ? inMemoryLostFound.findIndex((r) => r.id === record.id) : -1;
    let saved: LostFoundRecord;

    if (existingIndex >= 0) {
      saved = {
        ...inMemoryLostFound[existingIndex],
        ...record,
      } as LostFoundRecord;
      inMemoryLostFound[existingIndex] = saved;
    } else {
      const now = new Date();
      const id = record.id || `LNF-${getTodayDateString().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      saved = {
        id,
        recordType: record.recordType || 'FOUND_ITEM',
        category: record.category || 'Other',
        itemName: record.itemName,
        locationFoundOrLost: record.locationFoundOrLost,
        dateRecorded: record.dateRecorded || getTodayDateString(),
        timeRecorded: record.timeRecorded || minutesToTime(now.getHours() * 60 + now.getMinutes()),
        finderOrReporterName: record.finderOrReporterName,
        finderOrReporterPhone: record.finderOrReporterPhone,
        finderOrReporterType: record.finderOrReporterType || 'Employee',
        storageLocker: record.storageLocker || 'Central Vault Safe #1',
        status: record.status || (record.recordType === 'LOST_INQUIRY' ? 'REPORTED_SEARCHING' : 'IN_CUSTODY'),
        ownerName: record.ownerName,
        ownerPhone: record.ownerPhone,
        ownerIdProof: record.ownerIdProof,
        claimDate: record.claimDate,
        handedOverByStaff: record.handedOverByStaff,
        securitySealOrTag: record.securitySealOrTag,
        distinctiveMarks: record.distinctiveMarks || '',
        notes: record.notes || '',
        photoUrl: record.photoUrl || '',
        secondaryPhotoUrl: record.secondaryPhotoUrl || '',
        createdAt: record.createdAt || now.toISOString(),
      };
      inMemoryLostFound.unshift(saved);
    }

    try {
      safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
      window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
    } catch (e) {}

    return saved;
  },

  updateLostFoundStatus(id: string, status: any, claimDetails?: { ownerName?: string; ownerPhone?: string; ownerIdProof?: string; handedOverByStaff?: string }): LostFoundRecord | null {
    this.initLostFound();
    const index = inMemoryLostFound.findIndex((r) => r.id === id);
    if (index >= 0) {
      const updated: LostFoundRecord = {
        ...inMemoryLostFound[index],
        status,
        claimDate: status === 'RETURNED_TO_OWNER' ? (inMemoryLostFound[index].claimDate || getTodayDateString()) : undefined,
        ownerName: claimDetails?.ownerName || inMemoryLostFound[index].ownerName,
        ownerPhone: claimDetails?.ownerPhone || inMemoryLostFound[index].ownerPhone,
        ownerIdProof: claimDetails?.ownerIdProof || inMemoryLostFound[index].ownerIdProof,
        handedOverByStaff: claimDetails?.handedOverByStaff || inMemoryLostFound[index].handedOverByStaff,
      };
      inMemoryLostFound[index] = updated;
      try {
        safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
        window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
      } catch (e) {}
      return updated;
    }
    return null;
  },

  saveLostFoundRecords(records: LostFoundRecord[]) {
    if (!Array.isArray(records)) return;
    inMemoryLostFound = [...records];
    try {
      safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
      window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
    } catch (e) {}
  },

  deleteLostFoundRecord(id: string): boolean {
    this.initLostFound();
    const cleanId = String(id).toLowerCase().trim();
    recordDeletedId(cleanId, 'lostFound');
    const initialLen = inMemoryLostFound.length;
    inMemoryLostFound = inMemoryLostFound.filter((r) => String(r.id || '').toLowerCase().trim() !== cleanId);
    if (inMemoryLostFound.length !== initialLen) {
      try {
        safeSetLocalStorage(LOST_FOUND_RECORDS_KEY, JSON.stringify(inMemoryLostFound));
        window.dispatchEvent(new CustomEvent('tamimi_lost_found_updated'));
      } catch (e) {}
      return true;
    }
    return false;
  },

  exportLostFoundCsv(recordsToExport?: LostFoundRecord[]): string {
    const list = recordsToExport || this.getLostFoundRecords();
    const headers = [
      'Record ID',
      'Record Type',
      'Category',
      'Item Description',
      'Location Found / Lost',
      'Date Recorded',
      'Time Recorded',
      'Finder / Reporter Name',
      'Finder / Reporter Phone',
      'Reporter Type',
      'Storage Vault / Locker',
      'Status',
      'Security Seal Tag',
      'Distinctive Marks',
      'Owner Name',
      'Owner Phone',
      'Owner ID Proof',
      'Claim / Release Date',
      'Handed Over By Staff',
      'Notes',
    ];

    const rows = list.map((r) => [
      `"${AuthService.sanitizeForCsv(r.id)}"`,
      `"${AuthService.sanitizeForCsv(r.recordType)}"`,
      `"${AuthService.sanitizeForCsv(r.category)}"`,
      `"${AuthService.sanitizeForCsv(r.itemName)}"`,
      `"${AuthService.sanitizeForCsv(r.locationFoundOrLost)}"`,
      `"${AuthService.sanitizeForCsv(r.dateRecorded)}"`,
      `"${AuthService.sanitizeForCsv(r.timeRecorded)}"`,
      `"${AuthService.sanitizeForCsv(r.finderOrReporterName)}"`,
      `"${AuthService.sanitizeForCsv(r.finderOrReporterPhone)}"`,
      `"${AuthService.sanitizeForCsv(r.finderOrReporterType)}"`,
      `"${AuthService.sanitizeForCsv(r.storageLocker)}"`,
      `"${AuthService.sanitizeForCsv(r.status)}"`,
      `"${AuthService.sanitizeForCsv(r.securitySealOrTag || '')}"`,
      `"${AuthService.sanitizeForCsv(r.distinctiveMarks || '')}"`,
      `"${AuthService.sanitizeForCsv(r.ownerName || '')}"`,
      `"${AuthService.sanitizeForCsv(r.ownerPhone || '')}"`,
      `"${AuthService.sanitizeForCsv(r.ownerIdProof || '')}"`,
      `"${AuthService.sanitizeForCsv(r.claimDate || '')}"`,
      `"${AuthService.sanitizeForCsv(r.handedOverByStaff || '')}"`,
      `"${AuthService.sanitizeForCsv(r.notes || '')}"`,
    ]);

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  // -------------------------------------------------------------
  // 4. FACILITY MAINTENANCE & SLOT BLOCKOUT REGISTRY
  // -------------------------------------------------------------
  initBlockouts(): SlotBlockoutRecord[] {
    if (isBlockoutsInitialized) {
      return inMemoryBlockouts;
    }
    try {
      const raw = localStorage.getItem(SLOT_BLOCKOUTS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        inMemoryBlockouts = Array.isArray(parsed) ? parsed : [];
      } else {
        inMemoryBlockouts = [];
      }
    } catch (e) {
      inMemoryBlockouts = [];
    }
    isBlockoutsInitialized = true;
    return inMemoryBlockouts;
  },

  getBlockouts(): SlotBlockoutRecord[] {
    return [...this.initBlockouts()];
  },

  saveBlockoutRecord(record: Partial<SlotBlockoutRecord> & { facilityId: string; date: string; startTime: string; endTime: string; reason: string }): SlotBlockoutRecord {
    this.initBlockouts();
    const facility = FACILITIES.find((f) => f.id === record.facilityId);
    const facilityName = facility ? facility.name : record.facilityName || 'Facility';
    const id = record.id || `BLK-${getTodayDateString().replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const saved: SlotBlockoutRecord = {
      id,
      facilityId: record.facilityId,
      facilityName,
      stage: record.stage || 'ALL',
      date: normalizeDateString(record.date),
      startTime: normalizeTimeString(record.startTime),
      endTime: normalizeTimeString(record.endTime),
      reason: record.reason || 'Maintenance & Deep Cleaning',
      notes: record.notes || '',
      blockedByStaff: record.blockedByStaff || AuthService.getUsername() || 'Duty Admin',
      createdAt: record.createdAt || new Date().toISOString(),
    };

    const existingIndex = inMemoryBlockouts.findIndex((b) => b.id === saved.id);
    if (existingIndex >= 0) {
      inMemoryBlockouts[existingIndex] = saved;
    } else {
      inMemoryBlockouts.unshift(saved);
    }

    try {
      safeSetLocalStorage(SLOT_BLOCKOUTS_KEY, JSON.stringify(inMemoryBlockouts));
      notifyBookingsChanged();
      AuthService.logSecurityEvent('MAINTENANCE_BLOCKED', `Blocked ${facilityName} (${saved.stage}) on ${saved.date}: ${saved.reason}`);
    } catch (e) {}

    return saved;
  },

  deleteBlockoutRecord(id: string): boolean {
    this.initBlockouts();
    const initialLen = inMemoryBlockouts.length;
    const target = inMemoryBlockouts.find((b) => b.id === id);
    inMemoryBlockouts = inMemoryBlockouts.filter((b) => b.id !== id);

    if (inMemoryBlockouts.length !== initialLen) {
      try {
        safeSetLocalStorage(SLOT_BLOCKOUTS_KEY, JSON.stringify(inMemoryBlockouts));
        notifyBookingsChanged();
        if (target) {
          AuthService.logSecurityEvent('MAINTENANCE_UNBLOCKED', `Unblocked ${target.facilityName} (${target.stage}) on ${target.date}`);
        }
      } catch (e) {}
      return true;
    }
    return false;
  },

  isSlotBlocked(facilityId: string, stage: string, date: string, startTime: string, endTime: string): SlotBlockoutRecord | undefined {
    this.initBlockouts();
    const normDate = normalizeDateString(date);
    const sMin = timeToMinutes(startTime);
    const eMin = timeToMinutes(endTime);

    return inMemoryBlockouts.find((b) => {
      if (b.facilityId !== facilityId) return false;
      if (normalizeDateString(b.date) !== normDate) return false;
      if (b.stage && b.stage !== 'ALL' && stage && stage !== 'ALL' && !isStageMatch(b.stage, stage)) {
        return false;
      }
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return sMin < bEnd && eMin > bStart;
    });
  },

  // -------------------------------------------------------------
  // 5. BATCH HANDOVER CREATION
  // -------------------------------------------------------------
  addBatchHandoverRecords(batch: Partial<HandoverItemRecord>[]): HandoverItemRecord[] {
    this.initHandover();
    const created: HandoverItemRecord[] = [];
    batch.forEach((item) => {
      if (item.itemName && item.personName && item.phoneNumber) {
        const saved = this.saveHandoverRecord({
          ...item,
          itemName: item.itemName,
          personName: item.personName,
          phoneNumber: item.phoneNumber,
        });
        created.push(saved);
      }
    });
    return created;
  },

  // -------------------------------------------------------------
  // 6. EXECUTIVE SHIFT CLOSING SUMMARY
  // -------------------------------------------------------------
  getShiftClosingSummary(dateStr?: string): ShiftClosingSummary {
    const targetDate = normalizeDateString(dateStr || getTodayDateString());
    const bookings = this.getAllBookings().filter(
      (b) => b.status === 'CONFIRMED' && normalizeDateString(b.date) === targetDate
    );
    const parcels = this.getParcelRecords();
    const handovers = this.getHandoverRecords();
    const lostItems = this.getLostFoundRecords();
    const rooms = this.getIsolationRooms();

    const parcelsReceivedToday = parcels.filter(
      (p) => normalizeDateString(p.receivedDate) === targetDate
    ).length;
    const parcelsPending = parcels.filter(
      (p) => p.status === 'RECEIVED_IN_OFFICE' || p.status === 'GUEST_NOTIFIED'
    ).length;
    const parcelsDeliveredToday = parcels.filter(
      (p) => p.deliveredDate && normalizeDateString(p.deliveredDate) === targetDate
    ).length;

    const handoversIssuedToday = handovers.filter(
      (h) => normalizeDateString(h.issueDate) === targetDate
    ).length;
    const handoversPendingReturn = handovers.filter(
      (h) => h.status === 'ACTIVE_BORROWED'
    ).length;
    const overdueHandovers = handovers.filter((h) => {
      if (h.status !== 'ACTIVE_BORROWED') return false;
      if (!h.expectedReturnDate) return false;
      return normalizeDateString(h.expectedReturnDate) < targetDate;
    }).length;

    const lostFoundToday = lostItems.filter(
      (l) => normalizeDateString(l.dateRecorded) === targetDate
    ).length;
    const lostClaimedToday = lostItems.filter(
      (l) => l.claimDate && normalizeDateString(l.claimDate) === targetDate
    ).length;

    let totalBedsOccupied = 0;
    rooms.forEach((r) => {
      totalBedsOccupied += (r.occupants || []).length;
    });

    // Approximate utilization percentage (bookings count vs theoretical capacity)
    const utilizationRate = Math.min(100, Math.round((bookings.length / 25) * 100));

    return {
      shiftDate: targetDate,
      generatedAt: new Date().toISOString(),
      staffOnDuty: AuthService.getUsername() || 'Front Desk Operations',
      totalActiveBookingsToday: bookings.length,
      totalParcelsReceivedToday: parcelsReceivedToday,
      totalParcelsPendingHolding: parcelsPending,
      totalParcelsDeliveredToday: parcelsDeliveredToday,
      totalHandoversIssuedToday: handoversIssuedToday,
      totalHandoversPendingReturn: handoversPendingReturn,
      totalOverdueHandovers: overdueHandovers,
      totalLostItemsFoundToday: lostFoundToday,
      totalLostItemsClaimedToday: lostClaimedToday,
      totalIsolationBedsOccupied: totalBedsOccupied,
      facilityUtilizationRate: utilizationRate,
    };
  },

  /**
   * Export all system data as a consolidated JSON backup
   */
  exportAllData(): string {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      bookings: this.getAllBookings(),
      isolationRooms: this.getIsolationRooms(),
      handovers: this.getHandoverRecords(),
      parcels: this.getParcelRecords(),
      lostItems: this.getLostFoundRecords(),
      invoices: this.getInvoices(),
      blankForms: this.getBlankForms(),
      notices: this.getNotices(),
      supportTickets: this.getSupportTickets(),
      staffAccounts: AuthService.getStaffAccounts(),
      operatorProfile: AuthService.getOperatorProfile(),
      systemPreferences: AuthService.getSystemPreferences(),
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Helper Aliases for backward compatibility
   */
  getAllIsolationRooms(): IsolationRoomRecord[] {
    return this.getIsolationRooms();
  },
  getAllHandovers(): HandoverItemRecord[] {
    return this.getHandoverRecords();
  },
  getAllParcels(): ParcelRecord[] {
    return this.getParcelRecords();
  },
  getAllLostItems(): LostFoundRecord[] {
    return this.getLostFoundRecords();
  },

  /**
   * Import data from a JSON snapshot
   */
  importData(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.bookings)) {
        this.saveBookings(data.bookings);
      }
      if (Array.isArray(data.isolationRooms)) {
        this.saveIsolationRooms(data.isolationRooms);
      }
      if (Array.isArray(data.handovers)) {
        this.saveHandoverRecords(data.handovers);
      }
      if (Array.isArray(data.parcels)) {
        this.saveParcelRecords(data.parcels);
      }
      if (Array.isArray(data.lostItems)) {
        this.saveLostFoundRecords(data.lostItems);
      }
      if (Array.isArray(data.invoices)) {
        this.saveInvoices(data.invoices);
      }
      if (Array.isArray(data.blankForms)) {
        this.saveBlankForms(data.blankForms);
      }
      if (Array.isArray(data.notices)) {
        this.saveNotices(data.notices);
      }
      if (Array.isArray(data.supportTickets)) {
        this.saveSupportTickets(data.supportTickets);
      }
      if (Array.isArray(data.staffAccounts)) {
        AuthService.saveStaffAccounts(data.staffAccounts);
      }
      if (data.operatorProfile) {
        AuthService.saveOperatorProfile(data.operatorProfile);
      }
      if (data.systemPreferences) {
        AuthService.saveSystemPreferences(data.systemPreferences);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON file.' };
    }
  },

  /**
   * Helper methods for Invoices, Tickets, Blank Forms, Notices
   */
  getInvoices(): any[] {
    try {
      const saved = localStorage.getItem('tamimi_unified_camp_invoices_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (inv: any) =>
              inv &&
              inv.id &&
              !this.isIdDeleted(inv.id) &&
              !(inv.invoiceNumber && this.isIdDeleted(inv.invoiceNumber))
          );
        }
      }
    } catch (e) {}
    return [];
  },

  saveInvoices(invoices: any[]): void {
    try {
      localStorage.setItem('tamimi_unified_camp_invoices_v2', JSON.stringify(invoices));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invoices_updated'));
      }
    } catch (e) {
      console.warn('Failed to save invoices:', e);
    }
  },

  getSupportTickets(): any[] {
    try {
      const saved = localStorage.getItem('tamimi_support_tickets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          let hasDups = false;
          const cleaned = parsed
            .filter((t: any) => t && t.id && !this.isIdDeleted(t.id))
            .map((t: any, idx: number) => {
              if (seen.has(t.id)) {
                hasDups = true;
                const newId = `${t.id}-${idx}`;
                seen.add(newId);
                return { ...t, id: newId };
              }
              seen.add(t.id);
              return t;
            });
          if (hasDups) {
            this.saveSupportTickets(cleaned);
          }
          return cleaned;
        }
      }
    } catch (e) {}
    return [];
  },

  saveSupportTickets(tickets: any[]): void {
    try {
      localStorage.setItem('tamimi_support_tickets_v2', JSON.stringify(tickets));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tickets_updated'));
      }
    } catch (e) {
      console.warn('Failed to save tickets:', e);
    }
  },

  getBlankForms(): any[] {
    try {
      const saved = localStorage.getItem('tafga_saved_form_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((f: any) => f && f.id && !this.isIdDeleted(f.id));
        }
      }
    } catch (e) {}
    return [];
  },

  saveBlankForms(forms: any[]): void {
    try {
      localStorage.setItem('tafga_saved_form_records_v1', JSON.stringify(forms));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('blank_forms_updated'));
      }
    } catch (e) {
      console.warn('Failed to save blank forms:', e);
    }
  },

  getNotices(): any[] {
    try {
      const saved = localStorage.getItem('tamimi_facility_notices_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: any) => n && n.id && !this.isIdDeleted(n.id));
        }
      }
    } catch (e) {}
    return [];
  },

  saveNotices(notices: any[]): void {
    try {
      localStorage.setItem('tamimi_facility_notices_v2', JSON.stringify(notices));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notices_updated'));
      }
    } catch (e) {
      console.warn('Failed to save notices:', e);
    }
  },

  /**
   * Deletion Tombstone Registry Methods
   */
  recordDeletedId(id: string) {
    return recordDeletedId(id);
  },

  isIdDeleted(id: string): boolean {
    return isIdDeleted(id);
  },

  getDeletedIdsMap(): Set<string> {
    return getDeletedIdsMap();
  },
};



import { IsolationRoomRecord, BedOccupant } from '../types';

export type CheckoutStatusType = 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'ACTIVE' | 'NONE';

export interface CheckoutStatusInfo {
  status: CheckoutStatusType;
  diffDays: number; // < 0: overdue, 0: today, > 0: days left
  label: string; // e.g. "Overdue (2 Days)", "Due Today", "1 Day Left", "2 Days Left"
  shortLabel: string; // e.g. "Overdue", "Today", "1D Left", "2D Left", "3D Left"
  badgeClass: string;
  pillClass: string;
  cardBorderClass: string;
  glowClass: string;
  isUrgent: boolean;
  checkOutDateStr: string;
}

/**
 * Robust date parser supporting YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, MM-DD-YYYY
 */
export function parseDateToMidnight(dateStr: any): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed.toLowerCase() === 'open' || trimmed.toLowerCase() === 'undefined') return null;

  // 1. Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const date = new Date(y, m, d);
    date.setHours(0, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);

    let day = p1;
    let month = p2 - 1;
    if (p1 <= 12 && p2 > 12) {
      // MM/DD/YYYY format
      day = p2;
      month = p1 - 1;
    } else if (p1 > 12 && p2 <= 12) {
      // DD/MM/YYYY format
      day = p1;
      month = p2 - 1;
    } else {
      // Default to DD/MM/YYYY
      day = p1;
      month = p2 - 1;
    }

    const date = new Date(y, month, day);
    date.setHours(0, 0, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  }

  // 3. Fallback standard parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  return null;
}

/**
 * Calculates checkout timing status relative to today
 */
export function getCheckoutStatus(checkOutDateStr?: string | null): CheckoutStatusInfo | null {
  if (!checkOutDateStr || !checkOutDateStr.trim()) return null;
  const parsed = parseDateToMidnight(checkOutDateStr);
  if (!parsed) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = parsed.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'OVERDUE',
      diffDays,
      label: overdueDays === 1 ? '1 Day Overdue' : `${overdueDays} Days Overdue`,
      shortLabel: overdueDays === 1 ? '1D Over' : `${overdueDays}D Over`,
      badgeClass: 'bg-rose-600 text-white font-black shadow-xs shadow-rose-600/30 animate-pulse',
      pillClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-black',
      cardBorderClass: 'border-rose-500/90 dark:border-rose-500/80 ring-2 ring-rose-500/30 bg-gradient-to-b from-rose-50/50 via-white to-white dark:from-rose-950/25 dark:via-slate-900 dark:to-slate-900',
      glowClass: 'shadow-md shadow-rose-500/20',
      isUrgent: true,
      checkOutDateStr,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'DUE_TODAY',
      diffDays: 0,
      label: 'Due Today',
      shortLabel: 'Today',
      badgeClass: 'bg-amber-500 text-slate-950 font-black shadow-xs shadow-amber-500/30 animate-pulse',
      pillClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-black',
      cardBorderClass: 'border-amber-500/90 dark:border-amber-500/80 ring-2 ring-amber-500/30 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900',
      glowClass: 'shadow-md shadow-amber-500/20',
      isUrgent: true,
      checkOutDateStr,
    };
  }

  if (diffDays === 1) {
    return {
      status: 'DUE_SOON',
      diffDays: 1,
      label: '1 Day Left',
      shortLabel: '1D Left',
      badgeClass: 'bg-sky-500 text-white font-bold shadow-2xs',
      pillClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold',
      cardBorderClass: 'border-sky-400/80 dark:border-sky-500/50 ring-1 ring-sky-400/20',
      glowClass: 'shadow-sm',
      isUrgent: false,
      checkOutDateStr,
    };
  }

  if (diffDays === 2) {
    return {
      status: 'DUE_SOON',
      diffDays: 2,
      label: '2 Days Left',
      shortLabel: '2D Left',
      badgeClass: 'bg-blue-500 text-white font-bold shadow-2xs',
      pillClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold',
      cardBorderClass: 'border-blue-300/80 dark:border-blue-600/40',
      glowClass: '',
      isUrgent: false,
      checkOutDateStr,
    };
  }

  if (diffDays === 3) {
    return {
      status: 'DUE_SOON',
      diffDays: 3,
      label: '3 Days Left',
      shortLabel: '3D Left',
      badgeClass: 'bg-indigo-500 text-white font-bold shadow-2xs',
      pillClass: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold',
      cardBorderClass: 'border-indigo-300/80 dark:border-indigo-600/40',
      glowClass: '',
      isUrgent: false,
      checkOutDateStr,
    };
  }

  return {
    status: 'ACTIVE',
    diffDays,
    label: `${diffDays} Days Left`,
    shortLabel: `${diffDays}D Left`,
    badgeClass: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold',
    pillClass: 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium',
    cardBorderClass: '',
    glowClass: '',
    isUrgent: false,
    checkOutDateStr,
  };
}

export interface RoomCheckoutSummary {
  primaryStatus: CheckoutStatusInfo | null;
  bed1Status: CheckoutStatusInfo | null;
  bed2Status: CheckoutStatusInfo | null;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  urgentBedNumber?: 1 | 2;
  urgentOccupantName?: string;
  hasCheckoutAlert: boolean;
}

/**
 * Returns comprehensive checkout summary for an isolation room
 */
export function getRoomCheckoutSummary(room: IsolationRoomRecord): RoomCheckoutSummary {
  const occupants = room.occupants && room.occupants.length > 0
    ? room.occupants
    : (room.patientName ? [{
        bedNumber: 1 as 1 | 2,
        patientName: room.patientName,
        checkIn: room.checkIn,
        checkOut: room.checkOut,
      }] : []);

  const occ1 = occupants.find((o) => o.bedNumber === 1) || (room.patientName && !occupants.some((o) => o.bedNumber === 1) ? {
    bedNumber: 1 as 1 | 2,
    patientName: room.patientName,
    checkIn: room.checkIn,
    checkOut: room.checkOut,
  } : undefined);

  const occ2 = occupants.find((o) => o.bedNumber === 2);

  const b1Status = occ1?.checkOut ? getCheckoutStatus(occ1.checkOut) : null;
  const b2Status = occ2?.checkOut ? getCheckoutStatus(occ2.checkOut) : null;

  let primaryStatus: CheckoutStatusInfo | null = null;
  let urgentBedNumber: 1 | 2 | undefined = undefined;
  let urgentOccupantName: string | undefined = undefined;

  const statuses: { occ?: BedOccupant; status: CheckoutStatusInfo; bed: 1 | 2 }[] = [];
  if (b1Status) statuses.push({ occ: occ1, status: b1Status, bed: 1 });
  if (b2Status) statuses.push({ occ: occ2, status: b2Status, bed: 2 });

  if (statuses.length > 0) {
    // Sort by diffDays ascending (smallest/most negative is most overdue)
    statuses.sort((a, b) => a.status!.diffDays - b.status!.diffDays);
    primaryStatus = statuses[0].status;
    urgentBedNumber = statuses[0].bed;
    urgentOccupantName = statuses[0].occ?.patientName;
  }

  const isOverdue = primaryStatus?.status === 'OVERDUE';
  const isDueToday = primaryStatus?.status === 'DUE_TODAY';
  const isDueSoon = primaryStatus?.status === 'DUE_SOON';
  const hasCheckoutAlert = isOverdue || isDueToday;

  return {
    primaryStatus,
    bed1Status: b1Status,
    bed2Status: b2Status,
    isOverdue,
    isDueToday,
    isDueSoon,
    urgentBedNumber,
    urgentOccupantName,
    hasCheckoutAlert,
  };
}

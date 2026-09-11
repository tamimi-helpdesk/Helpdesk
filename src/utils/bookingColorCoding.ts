import { Booking } from '../types';

export type ColorCodingMode = 'OFF' | 'DEPARTMENT' | 'PRIORITY';
export type ColorCodingStyle = 'ACCENT_BAR' | 'TINTED_ROW';

export type PriorityLevel = 'VIP' | 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW';

export interface ColorTheme {
  id: string;
  label: string;
  dotColor: string;
  borderColor: string;
  borderClass: string;
  badgeClass: string;
  rowTintClass: string;
  iconName: 'Crown' | 'Flame' | 'Zap' | 'CheckCircle2' | 'Clock' | 'Building2' | 'Shield' | 'Wrench' | 'Utensils' | 'Laptop' | 'HeartPulse' | 'Briefcase' | 'Users';
}

export const PRIORITY_CONFIG: Record<PriorityLevel, ColorTheme> = {
  VIP: {
    id: 'VIP',
    label: 'VIP / Executive',
    dotColor: '#9333ea',
    borderColor: '#9333ea',
    borderClass: 'border-l-purple-600 dark:border-l-purple-500',
    badgeClass: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-600',
    rowTintClass: 'bg-purple-50/60 dark:bg-purple-950/25',
    iconName: 'Crown',
  },
  CRITICAL: {
    id: 'CRITICAL',
    label: 'Critical / Urgent',
    dotColor: '#dc2626',
    borderColor: '#dc2626',
    borderClass: 'border-l-red-600 dark:border-l-red-500',
    badgeClass: 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950/90 dark:text-red-200 dark:border-red-600',
    rowTintClass: 'bg-red-50/60 dark:bg-red-950/25',
    iconName: 'Flame',
  },
  HIGH: {
    id: 'HIGH',
    label: 'High Priority',
    dotColor: '#ea580c',
    borderColor: '#ea580c',
    borderClass: 'border-l-orange-500 dark:border-l-orange-400',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/90 dark:text-orange-200 dark:border-orange-600',
    rowTintClass: 'bg-orange-50/45 dark:bg-orange-950/20',
    iconName: 'Zap',
  },
  STANDARD: {
    id: 'STANDARD',
    label: 'Standard',
    dotColor: '#0284c7',
    borderColor: '#0284c7',
    borderClass: 'border-l-sky-500 dark:border-l-sky-400',
    badgeClass: 'bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950/90 dark:text-sky-200 dark:border-sky-600',
    rowTintClass: 'bg-sky-50/30 dark:bg-sky-950/15',
    iconName: 'CheckCircle2',
  },
  LOW: {
    id: 'LOW',
    label: 'Low / Routine',
    dotColor: '#64748b',
    borderColor: '#64748b',
    borderClass: 'border-l-slate-400 dark:border-l-slate-600',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    rowTintClass: 'bg-slate-50/25 dark:bg-slate-900/20',
    iconName: 'Clock',
  },
};

export const DEPARTMENT_PALETTES: ColorTheme[] = [
  {
    id: 'operations',
    label: 'Operations & Logistics',
    dotColor: '#2563eb',
    borderColor: '#2563eb',
    borderClass: 'border-l-blue-600 dark:border-l-blue-500',
    badgeClass: 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-600',
    rowTintClass: 'bg-blue-50/50 dark:bg-blue-950/20',
    iconName: 'Building2',
  },
  {
    id: 'engineering',
    label: 'Engineering & Maintenance',
    dotColor: '#d97706',
    borderColor: '#d97706',
    borderClass: 'border-l-amber-500 dark:border-l-amber-400',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-600',
    rowTintClass: 'bg-amber-50/45 dark:bg-amber-950/20',
    iconName: 'Wrench',
  },
  {
    id: 'safety',
    label: 'Safety, HSE & Security',
    dotColor: '#e11d48',
    borderColor: '#e11d48',
    borderClass: 'border-l-rose-600 dark:border-l-rose-500',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-600',
    rowTintClass: 'bg-rose-50/50 dark:bg-rose-950/20',
    iconName: 'Shield',
  },
  {
    id: 'catering',
    label: 'Catering & Camp Services',
    dotColor: '#059669',
    borderColor: '#059669',
    borderClass: 'border-l-emerald-600 dark:border-l-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-600',
    rowTintClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    iconName: 'Utensils',
  },
  {
    id: 'it',
    label: 'IT & Digital Systems',
    dotColor: '#7c3aed',
    borderColor: '#7c3aed',
    borderClass: 'border-l-violet-600 dark:border-l-violet-500',
    badgeClass: 'bg-violet-100 text-violet-950 border-violet-300 dark:bg-violet-950/80 dark:text-violet-200 dark:border-violet-600',
    rowTintClass: 'bg-violet-50/50 dark:bg-violet-950/20',
    iconName: 'Laptop',
  },
  {
    id: 'executive',
    label: 'Executive & Management',
    dotColor: '#c026d3',
    borderColor: '#c026d3',
    borderClass: 'border-l-fuchsia-600 dark:border-l-fuchsia-500',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-300 dark:bg-fuchsia-950/80 dark:text-fuchsia-200 dark:border-fuchsia-600',
    rowTintClass: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/20',
    iconName: 'Crown',
  },
  {
    id: 'medical',
    label: 'Medical, Clinic & Health',
    dotColor: '#0891b2',
    borderColor: '#0891b2',
    borderClass: 'border-l-cyan-600 dark:border-l-cyan-500',
    badgeClass: 'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-200 dark:border-cyan-600',
    rowTintClass: 'bg-cyan-50/50 dark:bg-cyan-950/20',
    iconName: 'HeartPulse',
  },
  {
    id: 'admin',
    label: 'HR & Administration',
    dotColor: '#0d9488',
    borderColor: '#0d9488',
    borderClass: 'border-l-teal-600 dark:border-l-teal-500',
    badgeClass: 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-600',
    rowTintClass: 'bg-teal-50/50 dark:bg-teal-950/20',
    iconName: 'Briefcase',
  },
  {
    id: 'general',
    label: 'General Resident / Guest',
    dotColor: '#64748b',
    borderColor: '#64748b',
    borderClass: 'border-l-slate-400 dark:border-l-slate-600',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    rowTintClass: 'bg-slate-50/30 dark:bg-slate-900/20',
    iconName: 'Users',
  },
];

/**
 * Infer or retrieve priority level for a booking
 */
export function getBookingPriority(booking: Booking): PriorityLevel {
  if (booking.priority) {
    const p = String(booking.priority).toUpperCase().trim();
    if (p.includes('VIP') || p.includes('EXEC')) return 'VIP';
    if (p.includes('CRITICAL') || p.includes('URGENT') || p.includes('EMERGENCY') || p.includes('P1')) return 'CRITICAL';
    if (p.includes('HIGH') || p.includes('P2')) return 'HIGH';
    if (p.includes('LOW') || p.includes('ROUTINE') || p.includes('P4')) return 'LOW';
    if (p.includes('STANDARD') || p.includes('NORMAL') || p.includes('P3')) return 'STANDARD';
  }

  // Check customOptions
  if (booking.customOptions?.priority) {
    const p = String(booking.customOptions.priority).toUpperCase().trim();
    if (p.includes('VIP')) return 'VIP';
    if (p.includes('CRIT') || p.includes('URG')) return 'CRITICAL';
    if (p.includes('HIGH')) return 'HIGH';
    if (p.includes('LOW')) return 'LOW';
  }

  // Inferred from notes, customer title, or department
  const hay = `${booking.notes || ''} ${booking.departmentOrTeam || ''} ${booking.customerName || ''}`.toLowerCase();
  if (hay.includes('vip') || hay.includes('executive') || hay.includes('director') || hay.includes('minister') || hay.includes('board member')) {
    return 'VIP';
  }
  if (hay.includes('urgent') || hay.includes('critical') || hay.includes('emergency') || hay.includes('immediate')) {
    return 'CRITICAL';
  }
  if (hay.includes('high priority') || hay.includes('high-priority') || hay.includes('rush') || hay.includes('escalated')) {
    return 'HIGH';
  }
  if (hay.includes('low priority') || hay.includes('flexible') || hay.includes('routine')) {
    return 'LOW';
  }

  return 'STANDARD';
}

/**
 * Resolve display department name for a booking
 */
export function getBookingDepartment(booking: Booking): string {
  if (booking.departmentOrTeam && booking.departmentOrTeam.trim()) {
    return booking.departmentOrTeam.trim();
  }
  return 'General Resident / Guest';
}

/**
 * Resolve color theme for department
 */
export function getDepartmentColorTheme(deptName: string): ColorTheme {
  const norm = deptName.toLowerCase();

  if (norm.includes('operat') || norm.includes('logist') || norm.includes('fleet') || norm.includes('transport') || norm.includes('supply')) {
    return DEPARTMENT_PALETTES[0]; // Operations & Logistics
  }
  if (norm.includes('engin') || norm.includes('maint') || norm.includes('facil') || norm.includes('civil') || norm.includes('plumb') || norm.includes('elect')) {
    return DEPARTMENT_PALETTES[1]; // Engineering & Maintenance
  }
  if (norm.includes('safe') || norm.includes('hse') || norm.includes('secur') || norm.includes('guard') || norm.includes('fire')) {
    return DEPARTMENT_PALETTES[2]; // Safety & Security
  }
  if (norm.includes('cater') || norm.includes('food') || norm.includes('camp') || norm.includes('mess') || norm.includes('lodg') || norm.includes('housekeep')) {
    return DEPARTMENT_PALETTES[3]; // Catering & Camp Services
  }
  if (norm.includes('it') || norm.includes('comput') || norm.includes('digit') || norm.includes('telecom') || norm.includes('network') || norm.includes('softw')) {
    return DEPARTMENT_PALETTES[4]; // IT & Digital
  }
  if (norm.includes('exec') || norm.includes('manag') || norm.includes('direct') || norm.includes('board') || norm.includes('corp') || norm.includes('vip')) {
    return DEPARTMENT_PALETTES[5]; // Executive
  }
  if (norm.includes('medic') || norm.includes('clinic') || norm.includes('health') || norm.includes('doctor') || norm.includes('nurse') || norm.includes('isno') || norm.includes('pharm')) {
    return DEPARTMENT_PALETTES[6]; // Medical
  }
  if (norm.includes('hr') || norm.includes('human') || norm.includes('admin') || norm.includes('person') || norm.includes('recruit')) {
    return DEPARTMENT_PALETTES[7]; // HR & Admin
  }
  if (norm.includes('general') || norm.includes('resident') || norm.includes('guest') || norm.includes('unassigned')) {
    return DEPARTMENT_PALETTES[8]; // General
  }

  // Consistent deterministic hash for custom department names
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % 8; // map to one of the 8 vibrant palettes
  const template = DEPARTMENT_PALETTES[index];
  return {
    ...template,
    id: `custom-${norm.replace(/\s+/g, '-')}`,
    label: deptName,
  };
}

/**
 * Get row styling and badge info based on active color-coding settings
 */
export function getBookingColorCoding(
  booking: Booking,
  mode: ColorCodingMode,
  style: ColorCodingStyle
): {
  borderClass: string;
  rowBgClass: string;
  badgeClass: string;
  dotColor: string;
  label: string;
  iconName: ColorTheme['iconName'];
} {
  if (mode === 'OFF') {
    return {
      borderClass: '',
      rowBgClass: '',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dotColor: '#64748b',
      label: '',
      iconName: 'Users',
    };
  }

  if (mode === 'PRIORITY') {
    const priority = getBookingPriority(booking);
    const theme = PRIORITY_CONFIG[priority];
    return {
      borderClass: `border-l-4 ${theme.borderClass}`,
      rowBgClass: style === 'TINTED_ROW' ? theme.rowTintClass : '',
      badgeClass: theme.badgeClass,
      dotColor: theme.dotColor,
      label: theme.label,
      iconName: theme.iconName,
    };
  }

  // By DEPARTMENT
  const dept = getBookingDepartment(booking);
  const theme = getDepartmentColorTheme(dept);
  return {
    borderClass: `border-l-4 ${theme.borderClass}`,
    rowBgClass: style === 'TINTED_ROW' ? theme.rowTintClass : '',
    badgeClass: theme.badgeClass,
    dotColor: theme.dotColor,
    label: dept,
    iconName: theme.iconName,
  };
}

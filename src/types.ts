export interface FacilityBreak {
  start: string;
  end: string;
  label: string;
}

export interface FacilityResource {
  id: string;
  name: string;
  capacity?: number;
  [key: string]: any;
}

export interface Facility {
  id: string;
  name: string;
  shortName: string;
  code: string;
  stageName: string;
  sheetTabName: string;
  icon: string;
  description: string;
  stages: string[];
  defaultSlotDurationMinutes: number;
  openTime: string;
  closeTime: string;
  breaks: FacilityBreak[];
  maxSlotsPerDayPerUser?: number;
  advanceBookingDays?: number;
  minBookingNoticeMinutes?: number;
  capacityPerSlot?: number;
  customRules?: any;
  resources?: FacilityResource[];
  requiresConfirmation?: boolean;
  autoConfirm?: boolean;
  category?: string;
  isAvailable?: boolean;
  [key: string]: any;
}

export interface Booking {
  id: string;
  facilityId: string;
  facilityName?: string;
  date: string;
  timeSlot?: string;
  startTime?: string;
  endTime?: string;
  stage?: string;
  resourceId?: string;
  resourceName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  badgeId?: string;
  status?: 'confirmed' | 'cancelled' | 'pending' | 'completed' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  isAvailable: boolean;
  isBreak?: boolean;
  currentBookings?: number;
  maxCapacity?: number;
  [key: string]: any;
}

export interface GasConnectionConfig {
  webAppUrl: string;
  isConnected: boolean;
  lastSyncedAt?: string;
  syncIntervalMinutes?: number;
  [key: string]: any;
}

export interface StaffAccount {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  roleTitle?: string;
  badgeId?: string;
  pinCode?: string;
  password?: string;
  isActive: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface UserSession {
  isLoggedIn: boolean;
  id?: string;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  sessionToken?: string;
  loginTimestamp?: number;
  lastActivityTimestamp?: number;
  rememberMe?: boolean;
  [key: string]: any;
}

export type { Facility as default };

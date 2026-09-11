export interface CustomSlotConfig {
  id: string;
  startTime: string;
  endTime: string;
  label?: string;
  capacity?: number;
  isBreak?: boolean;
}

export interface CampusBroadcastAlert {
  id: string;
  title: string;
  message: string;
  priority: 'EMERGENCY' | 'WARNING' | 'ANNOUNCEMENT' | 'VIP';
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  targetFacilityId?: string; // 'ALL' or specific facility id
  createdBy: string;
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
  openTime: string; // "07:00"
  closeTime: string; // "23:00"
  breaks?: { start: string; end: string; label: string }[];
  capacityPerSlot: number;
  amenities: string[];
  rules: string[];
  accentColor: string;
  isComingSoon?: boolean;
  customSlots?: CustomSlotConfig[];
  disabledSlotTimes?: string[];
  statusOverride?: 'OPERATIONAL' | 'MAINTENANCE' | 'LOCKDOWN' | 'VIP_ONLY' | 'RENOVATION';
  statusReason?: string;
  advanceBookingDays?: number;
  maxDailyBookingsPerBadge?: number;
  autoApprovalEnabled?: boolean;
  curfewExempt?: boolean;
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'SELECTED' | 'BREAK' | 'PAST';

export interface TimeSlot {
  id: string; // e.g. "2026-08-24-07:00-08:00-Stage1"
  startTime: string; // "07:00"
  endTime: string; // "08:00"
  status: SlotStatus;
  facilityId: string;
  stage: string;
  date: string; // "YYYY-MM-DD"
  bookingId?: string;
  bookedBy?: string;
  bookedPhone?: string;
  bookedByStaff?: string;
  breakLabel?: string;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS';

export interface Booking {
  id: string; // e.g. "CG-20260824143022-8491"
  facilityId: string;
  facilityName: string;
  sheetTabName: string;
  customerName: string;
  phoneNumber: string;
  bookedByStaff?: string; // Employee / Helpdesk Phone or ID who created the booking
  email?: string;
  departmentOrTeam?: string;
  priority?: 'VIP' | 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW' | string;
  date: string; // "YYYY-MM-DD"
  stage: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  slotIds: string[];
  numberOfGuests: number;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  isRecurring?: boolean;
  recurringGroupId?: string;
  recurringSummary?: string;
  customOptions?: Record<string, any>;
}

export interface CancellationLogEntry {
  id: string;
  bookingId: string;
  customerName: string;
  phoneNumber: string;
  facilityName: string;
  facilityId?: string;
  stage: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  guestsCount?: number;
  cancelledAt: string;
  cancelledBy: string;
  cancellationReason: string;
  createdAt?: string;
  sheetTabName?: string;
}

export interface GasConnectionConfig {
  webAppUrl: string;
  sheetId?: string;
  lastSyncedAt?: string;
  syncStatus: 'idle' | 'syncing' | 'connected' | 'error';
  autoSync: boolean;
}

export interface BedOccupant {
  id?: string;
  bookingId?: string;
  bedNumber: 1 | 2;
  patientName: string;
  company?: string;
  phoneNumber?: string;
  email?: string;
  nationalId?: string;
  checkIn: string;
  checkOut?: string;
  bookingType?: 'General Guest' | 'Medical Isolation';
  purposeOfStay?: string;
  hospitalReferral?: string;
  keyIssued?: boolean;
  staffNotes?: string;
  bookedByStaff?: string;
}

export interface IsolationRoomRecord {
  id: string; // e.g. "ISO-R-01"
  slNo: number; // 1..12
  buildingNumber: string; // "R-01", "B-02", etc.
  building: 'Building R' | 'Building B';
  beds: string; // "2x1=2"
  bedCount: number; // 2
  patientName: string; // Primary Guest / Resident Name
  status: 'VACANT' | 'Occupied';
  company: string;
  checkIn: string; // e.g. "2026-08-27"
  checkOut: string; // e.g. "2026-08-30"
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
  lastUpdated?: string;
  occupants?: BedOccupant[];
}

export type HandoverType = 'GIVEN_OUT' | 'TAKEN_IN' | 'INTER_DEPT';
export type HandoverStatus = 'ACTIVE_BORROWED' | 'RETURNED' | 'IN_CUSTODY_HOLDING' | 'CLAIMED_PICKED_UP' | 'OVERDUE';

export interface HandoverItemRecord {
  id: string; // e.g. "HO-20260830-001"
  type: HandoverType;
  category: 'Room Key' | 'Access Card' | 'Chair / Table / Furniture' | 'Pillow / Bed Linen / Blanket' | 'Electronics / Charger' | 'Sports Equipment' | 'Tools / Hardware' | 'Other Assets';
  itemName: string;
  quantity: number;
  personName: string;
  personType: 'Resident Guest' | 'VIP Guest' | 'Company Employee' | 'Contractor' | 'Visitor';
  departmentOrCompany?: string;
  roomNumber?: string;
  phoneNumber: string;
  badgeOrIdNumber?: string;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm
  expectedReturnDate?: string; // YYYY-MM-DD
  actualReturnDate?: string; // YYYY-MM-DD
  status: HandoverStatus;
  authorizedByStaff: string;
  condition: 'New / Pristine' | 'Good' | 'Fair' | 'Damaged / Marked';
  photoUrl?: string; // Attached photo proof / visual evidence
  secondaryPhotoUrl?: string;
  notes?: string;
  pickupAuthorizedPerson?: string;
  createdAt: string;
}

export type ParcelStatus = 'RECEIVED_IN_OFFICE' | 'GUEST_NOTIFIED' | 'OUT_FOR_ROOM_DELIVERY' | 'HANDED_TO_GUEST' | 'DELIVERED_TO_ROOM' | 'COLLECTED_BY_REP';

export type CourierCompany =
  | 'Aramex'
  | 'DHL Express'
  | 'SMSA Express'
  | 'FedEx'
  | 'FedEx / TNT'
  | 'Amazon Delivery'
  | 'Amazon Logistics'
  | 'Naqel Express'
  | 'Saudi Post (SPL)'
  | 'UPS'
  | 'Noon Express'
  | 'Internal Tamimi Courier'
  | 'Other Courier'
  | 'Other / Personal Delivery'
  | string;

export interface ParcelRecord {
  id: string; // e.g. "PRC-20260830-101"
  trackingNumber: string;
  courierCompany: string;
  recipientName: string;
  roomNumber: string;
  departmentOrCompany?: string;
  phoneNumber: string;
  vipStatus: boolean;
  parcelType: 'Document / Envelope' | 'Small Box' | 'Medium Carton' | 'Large Package' | 'Perishable / Food' | 'Fragile Electronics' | string;
  storageLocation: string;
  photoUrl?: string; // Attached photo of parcel / airway bill label / package
  secondaryPhotoUrl?: string; // Photo of delivery receipt or recipient ID
  receivedDate: string; // YYYY-MM-DD
  receivedTime: string; // HH:mm
  receivedByStaff: string;
  status: ParcelStatus;
  deliveredDate?: string;
  deliveredTime?: string;
  deliveredByStaff?: string;
  collectedByPerson?: string;
  signatureProofOrOtp?: string;
  notes?: string;
  createdAt: string;
}

export type LostFoundType = 'FOUND_ITEM' | 'LOST_INQUIRY';
export type LostFoundStatus = 'IN_CUSTODY' | 'UNDER_CLAIM_REVIEW' | 'RETURNED_TO_OWNER' | 'REPORTED_SEARCHING' | 'UNCLAIMED_DISPOSED';

export interface LostFoundRecord {
  id: string; // e.g. "LNF-20260830-055"
  recordType: LostFoundType;
  category: string;
  itemName: string;
  locationFoundOrLost: string;
  photoUrl?: string; // Attached photo of found item / security vault seal
  secondaryPhotoUrl?: string; // Photo of owner ID or verification proof
  dateRecorded: string; // YYYY-MM-DD
  timeRecorded: string; // HH:mm
  finderOrReporterName: string;
  finderOrReporterPhone: string;
  finderOrReporterType: string;
  storageLocker: string;
  status: LostFoundStatus;
  ownerName?: string;
  ownerPhone?: string;
  ownerIdProof?: string;
  claimDate?: string;
  handedOverByStaff?: string;
  securitySealOrTag?: string;
  distinctiveMarks?: string;
  notes?: string;
  createdAt: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  eventType:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOCKOUT_TRIGGERED'
    | 'IDLE_LOGOUT'
    | 'MANUAL_LOGOUT'
    | 'PASSWORD_CHANGED'
    | 'SYNC_TRIGGERED'
    | 'CONFIG_UPDATED'
    | 'RECORD_CREATED'
    | 'RECORD_UPDATED'
    | 'RECORD_DELETED'
    | 'EXPORT_DATA'
    | 'MAINTENANCE_BLOCKED'
    | 'MAINTENANCE_UNBLOCKED';
  details: string;
  username?: string;
  ipOrDevice?: string;
}

export interface SlotBlockoutRecord {
  id: string; // e.g. "BLK-20260831-001"
  facilityId: string;
  facilityName: string;
  stage: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "07:00"
  endTime: string; // "23:00"
  reason: 'Maintenance & Deep Cleaning' | 'VIP / Official Event' | 'Ground Renovation / Repair' | 'Emergency Closure' | string;
  notes?: string;
  blockedByStaff: string;
  createdAt: string;
}

export interface ShiftClosingSummary {
  shiftDate: string;
  generatedAt: string;
  staffOnDuty: string;
  totalActiveBookingsToday: number;
  totalParcelsReceivedToday: number;
  totalParcelsPendingHolding: number;
  totalParcelsDeliveredToday: number;
  totalHandoversIssuedToday: number;
  totalHandoversPendingReturn: number;
  totalOverdueHandovers: number;
  totalLostItemsFoundToday: number;
  totalLostItemsClaimedToday: number;
  totalIsolationBedsOccupied: number;
  facilityUtilizationRate: number; // percentage (e.g. 78)
  criticalNotes?: string;
}

export interface FacilityLockdown {
  facilityId: string; // specific facility ID or 'ALL' for global emergency lock
  facilityName: string;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
  unlockAt: string | null; // ISO string for auto-expiration, or null for manual
  durationLabel?: string;
  reason: string;
  allowSupremeAdminBypass?: boolean;
}

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'FACILITY_OPERATOR'
  | 'CAMP_SERVICES_OFFICER'
  | 'CLINIC_OFFICER'
  | 'VIEW_ONLY'
  | 'SUPREME_SUPER_ADMIN'; // Backward compatibility alias for Super Administrator

export interface StaffAccount {
  id: string;
  username: string;
  fullName: string;
  role: StaffRole;
  roleTitle: string;
  email?: string;
  phoneNumber?: string;
  pinCode?: string;
  password?: string; // Login password for portal authentication
  avatarUrl?: string; // Profile photo or avatar data URL
  badgeId?: string; // Employee / Staff badge identifier
  assignedDepartment: 'ALL' | 'SPORTS' | 'CLINIC_ISOLATION' | 'CAMP_SERVICES' | 'RECREATION';
  assignedFacilityIds?: string[]; // specific facility IDs e.g. ['football-ground', 'cricket-ground']
  canCreateBookings: boolean;
  canEditBookings: boolean;
  canCancelBookings: boolean;
  canDeleteRecords?: boolean;
  canExportData: boolean;
  canManageSync: boolean;
  canManageUsers: boolean;
  canModifyRules: boolean;
  canManageSecurity?: boolean;
  canManageParcels?: boolean;
  canManageLostFound?: boolean;
  canManageHandovers?: boolean;
  canManageIsolation?: boolean;
  canManageWorkflows?: boolean;
  canAccessAuditLogs?: boolean;
  canEmergencyLockdown?: boolean;
  canViewPii?: boolean;
  customOverridesActive?: boolean; // Indicates if Supreme Admin set custom override flags
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  isHidden?: boolean; // Hidden from other staff/team lists
  isImmutable?: boolean; // Cannot be deleted or modified by regular users
  isSupremeAdmin?: boolean; // Supreme Super Admin special status
}

export interface OperatorProfile {
  firstName: string;
  lastName: string;
  roleTitle: string;
  badgeId: string;
  email: string;
  phoneNumber: string;
  department: string;
  campusLocation: string;
  buildingOrDesk: string;
  roomOrTerminal: string;
  country: string;
  cityState: string;
  postalCode: string;
  taxOrCorpId: string;
  bio: string;
  avatarUrl?: string;
  activeShift: 'Morning Shift (07:00 - 15:00)' | 'Evening Shift (15:00 - 23:00)' | 'Night Shift (23:00 - 07:00)' | 'Executive 24/7 On-Duty';
  updatedAt?: string;
}

export interface SystemPreferences {
  idleTimeoutMinutes: number;
  requirePinForCancellation: boolean;
  soundEffectsEnabled: boolean;
  confettiEnabled: boolean;
  autoPrintVoucher: boolean;
  autoSyncIntervalMinutes: number;
  maxDailyBookingsPerBadge: number;
  allowMultiSlotBooking: boolean;
  curfewStart: string;
  curfewEnd: string;
  whatsappCountryCode: string;
  whatsappAutoMessage: string;
  themeMode: 'dark' | 'light' | 'system';
  companyName?: string;
  branchName?: string;
  enableThermalPrintFormat?: boolean;
  enableQrCodeOnTickets?: boolean;
  enableTwoFactorSimulation?: boolean;
  enableAutoLocalBackupDaily?: boolean;
  defaultLanguage?: 'en' | 'bn' | 'ar';
  enableLiveAudioAlerts?: boolean;
  enableStrictVipVerification?: boolean;
  enableKioskAutoReset?: boolean;
  kioskAutoResetSeconds?: number;
  enableBrowserDesktopAlerts?: boolean;
  desktopAlertSound?: boolean;
  thermalPaperFormat?: '58mm' | '80mm' | 'a4';
  thermalSlipHeader?: string;
  thermalSlipFooter?: string;
  enableBarcodeOnTickets?: boolean;
  cancelCutoffMinutes?: number;
  maxActiveBookingsPerBadge?: number;
  campusMarqueeText?: string;
  campusMarqueeLevel?: 'normal' | 'important' | 'urgent';
  blacklistedBadges?: Array<{
    badgeNo: string;
    residentName: string;
    department?: string;
    reason: string;
    dateFlagged: string;
    suspendedUntil?: string;
  }>;
  vipWhitelistDepartments?: string[];
}

export type ThemeMode = 'light' | 'dark' | 'amoled';
export type ThemeBorderRadius = 'sharp' | 'normal' | 'rounded' | 'soft';
export type ThemeFontFamily = 'plus-jakarta' | 'inter' | 'outfit' | 'poppins' | 'jetbrains';
export type ThemeGlowIntensity = 'none' | 'subtle' | 'vibrant';
export type ThemeUiDensity = 'compact' | 'normal' | 'spacious';

export interface ThemePreset {
  id: string;
  name: string;
  nameBn?: string;
  subtitle: string;
  category: 'Enterprise' | 'Heritage' | 'Luxury VIP' | 'Cyber & Tech' | 'Nature & Warmth';
  mode: ThemeMode;
  primaryColor: string;
  primaryHover: string;
  primaryRgb: string;
  accentColor: string;
  accentRgb: string;
  gradient: string;
  borderRadius: ThemeBorderRadius;
  fontFamily: ThemeFontFamily;
  glowIntensity: ThemeGlowIntensity;
  glassBlur: boolean;
  uiDensity: ThemeUiDensity;
  description: string;
  previewColors: string[];
}

export interface CustomThemeConfig {
  presetId: string;
  mode: ThemeMode;
  primaryColor: string;
  primaryHover: string;
  primaryRgb: string;
  accentColor: string;
  accentRgb: string;
  gradient: string;
  borderRadius: ThemeBorderRadius;
  fontFamily: ThemeFontFamily;
  glowIntensity: ThemeGlowIntensity;
  glassBlur: boolean;
  uiDensity: ThemeUiDensity;
  soundEffectsEnabled: boolean;
  confettiEnabled: boolean;
}

export type ObservationDepartment =
  | 'Civil'
  | 'Electrical'
  | 'HVAC'
  | 'Plumbing'
  | 'Housekeeping'
  | 'Landscaping'
  | 'Waste Management'
  | 'Pest Control'
  | 'HSE'
  | 'Fire Department'
  | 'Hard Service'
  | 'Soft Services';

export interface FacilityObservation {
  id: string; // e.g. "OBS-1082971"
  no: number;
  location: string; // e.g. "I08-012", "J02-014", "Stage-1 west side"
  department: ObservationDepartment;
  description: string;
  ticketNumber?: string;
  picture?: string; // base64 or photo URL
  pictureUrl?: string;
  thumbnail?: string; // base64 preview
  closeOutPicture?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  facilityName: string; // default "Tamimi Construction Village"
  contractorName: string; // default "Tamimi TAFGA"
  preparedBy: string; // default "LIMON RAHMAN"
  date: string; // "DD-MM-YYYY" e.g. "05-09-2026"
  rawCaption?: string;
  inspectorName?: string;
  inspectorPhone?: string;
  createdAt: string;
  syncedToSheet?: boolean;
}


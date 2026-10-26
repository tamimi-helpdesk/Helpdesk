export interface AttendanceStaffMember {
  sNo: number;
  name: string;
  idNo: string;
  jobTitle: string;
}

export interface VacationStaffMember {
  name: string;
  idNo: string;
  jobTitle: string;
}

export interface AttendanceColorTheme {
  headerBg: string;        // Header & Table th background (e.g. #707070)
  headerTextColor: string; // Text color on header & th (e.g. #ffffff)
  borderColor: string;     // Sheet & table borders (e.g. #000000)
  titleColor: string;      // Main company and sheet titles text color (e.g. #000000)
  subHeaderBg: string;     // Subheader bar background (e.g. #707070)
}

export interface AttendanceSheetConfig {
  companyName: string;
  locationName: string;
  formTitle: string;
  department: string;
  supervisorTitle: string;
  hodTitle: string;
  extraBlankRows: number;
  shiftName?: string;
  defaultTimeIn?: string;
  defaultTimeOut?: string;
  theme?: AttendanceColorTheme;
  staffList: AttendanceStaffMember[];
  vacationList: VacationStaffMember[];
}

export interface AttendanceMonthDay {
  dayNum: number;
  dateObj: Date;
  formattedDate: string; // e.g. "Monday, October 26, 2026"
  dayOfWeek: string;    // e.g. "Monday"
  shortDay: string;      // e.g. "Mon"
  isoDate: string;       // e.g. "2026-10-26"
}

export interface DailyStaffLog {
  timeIn?: string;
  timeOut?: string;
  sign?: string;
  otHours?: string;
  remarks?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'OFF' | 'DUTY';
}

export const ATTENDANCE_STORAGE_KEY = 'tafga_straight_attendance_config_v2';
export const ATTENDANCE_LOGS_STORAGE_KEY = 'tafga_attendance_daily_logs_v1';

export const DEFAULT_THEME: AttendanceColorTheme = {
  headerBg: '#707070',
  headerTextColor: '#ffffff',
  borderColor: '#000000',
  titleColor: '#000000',
  subHeaderBg: '#707070',
};

export const COLOR_THEME_PRESETS: {
  id: string;
  name: string;
  headerBg: string;
  headerTextColor: string;
  borderColor: string;
  titleColor: string;
  subHeaderBg: string;
}[] = [
  {
    id: 'corporate-gray',
    name: 'Corporate Gray (Default)',
    headerBg: '#707070',
    headerTextColor: '#ffffff',
    borderColor: '#000000',
    titleColor: '#000000',
    subHeaderBg: '#707070',
  },
  {
    id: 'tamimi-green',
    name: 'Tamimi Emerald Green',
    headerBg: '#065f46',
    headerTextColor: '#ffffff',
    borderColor: '#022c22',
    titleColor: '#022c22',
    subHeaderBg: '#047857',
  },
  {
    id: 'executive-navy',
    name: 'Executive Navy Blue',
    headerBg: '#1e3a8a',
    headerTextColor: '#ffffff',
    borderColor: '#0f172a',
    titleColor: '#0f172a',
    subHeaderBg: '#1e40af',
  },
  {
    id: 'redsea-burgundy',
    name: 'Red Sea Global Burgundy',
    headerBg: '#831843',
    headerTextColor: '#ffffff',
    borderColor: '#500724',
    titleColor: '#500724',
    subHeaderBg: '#9d174d',
  },
  {
    id: 'slate-charcoal',
    name: 'Slate Charcoal',
    headerBg: '#334155',
    headerTextColor: '#ffffff',
    borderColor: '#0f172a',
    titleColor: '#0f172a',
    subHeaderBg: '#1e293b',
  },
  {
    id: 'classic-black',
    name: 'Deep Monochrome Black',
    headerBg: '#000000',
    headerTextColor: '#ffffff',
    borderColor: '#000000',
    titleColor: '#000000',
    subHeaderBg: '#171717',
  },
  {
    id: 'royal-purple',
    name: 'Imperial Purple',
    headerBg: '#581c87',
    headerTextColor: '#ffffff',
    borderColor: '#3b0764',
    titleColor: '#3b0764',
    subHeaderBg: '#6b21a8',
  },
  {
    id: 'desert-bronze',
    name: 'Desert Bronze / Gold',
    headerBg: '#78350f',
    headerTextColor: '#ffffff',
    borderColor: '#451a03',
    titleColor: '#451a03',
    subHeaderBg: '#92400e',
  },
];

export const TITLE_PRESETS = [
  'STRAIGHT DAILY ATTENDANCE SHEET',
  'DAILY ATTENDANCE ROSTER',
  'FACILITY SHIFT ATTENDANCE RECORD',
  'DAILY OPERATIONS ATTENDANCE SHEET',
  'HELPDESK STAFF ATTENDANCE REGISTER',
];

export const DEPARTMENT_PRESETS = [
  'HELPDESK/ACCOMODATION',
  'CAMP RECEPTION & FRONT DESK',
  'HOUSING & ROOM INSPECTION',
  'CAMP SECURITY & KEY CONTROL',
  'FACILITY MAINTENANCE & MEP',
  'HOUSEKEEPING & LAUNDRY',
  'SPORTS & RECREATION HUBS',
];

export const SHIFT_PRESETS = [
  'Day Straight Shift (07:00 - 19:00 / 12h)',
  'Night Straight Shift (19:00 - 07:00 / 12h)',
  'Regular Office Shift (08:00 - 17:00 / 9h)',
  'Split Duty Shift',
];

// Pre-filled defaults exact from the company template screenshot
export const DEFAULT_ATTENDANCE_STAFF: AttendanceStaffMember[] = [
  { sNo: 1, name: 'HASSAN ABBAS', idNo: '420938', jobTitle: 'ACCOMMODATION IN-CHARGE' },
  { sNo: 2, name: 'BITTU AHAMAD SIDDIQUE', idNo: '1025319', jobTitle: 'ACCOMMODATION IN-CHARGE' },
  { sNo: 3, name: 'MAJID IRSHAD', idNo: '414292', jobTitle: 'RECEPTIONIST' },
  { sNo: 4, name: 'ABRAR ALBALAWI', idNo: '522003', jobTitle: 'RECEPTIONIST' },
  { sNo: 5, name: 'RAMRESH YADAV', idNo: '2616191', jobTitle: 'RECEPTIONIST' },
  { sNo: 6, name: 'BILAL AHMED', idNo: '416074', jobTitle: 'HOUSING INSPECTION' },
  { sNo: 7, name: 'OWAIS SAID HUSSAIN', idNo: '416668', jobTitle: 'HOUSING INSPECTION' },
  { sNo: 8, name: 'SHAH NAZIR', idNo: '416956', jobTitle: 'KEY CONTROLER' },
  { sNo: 9, name: 'LIMON RAHMAN', idNo: '1314114', jobTitle: 'RECEPTIONIST' },
  { sNo: 10, name: 'RAMASHANKAR NAU', idNo: '2614269', jobTitle: 'RECEPTIONIST' },
];

export const DEFAULT_VACATION_STAFF: VacationStaffMember[] = [
  { name: 'KASUN DHANUSHKA', idNo: '903961', jobTitle: 'RECEPTIONIST' },
  { name: 'IMRAN KHURSHID', idNo: '410564', jobTitle: 'RECEPTIONIST' },
];

export const DEFAULT_ATTENDANCE_CONFIG: AttendanceSheetConfig = {
  companyName: 'TAMIMI GLOBAL COMPANY LTD.(TAFGA)',
  locationName: 'AMAALA-Triple Bay Construction Village (Location #188)',
  formTitle: 'STRAIGHT DAILY ATTENDANCE SHEET',
  department: 'HELPDESK/ACCOMODATION',
  supervisorTitle: 'SUPERVISOR',
  hodTitle: 'H.O.D',
  shiftName: 'Day Straight Shift (07:00 - 19:00)',
  defaultTimeIn: '07:00',
  defaultTimeOut: '19:00',
  extraBlankRows: 0,
  theme: DEFAULT_THEME,
  staffList: DEFAULT_ATTENDANCE_STAFF,
  vacationList: DEFAULT_VACATION_STAFF,
};

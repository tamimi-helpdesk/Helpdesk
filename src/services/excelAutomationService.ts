import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export interface TargetColumnConfig {
  key: string;
  label: string; // The exact text required in the target Excel
  role: string;
  description: string;
  aliases: string[];
  type: 'text' | 'number' | 'date';
  width: number;
  align: 'left' | 'center' | 'right';
}

// Exactly 14 columns matching user's requested specification image
export const TARGET_COLUMNS_14: TargetColumnConfig[] = [
  {
    key: 'slNo',
    label: 'Sl No',
    role: 'serial',
    description: 'Sequential Serial Number (1, 2, 3...)',
    aliases: ['sl no', 'sl', 'sl.', 'serial', 'serial no', 's.no', 's no', '#', 'no', 'item', 'row', 'sl_no'],
    type: 'number',
    width: 10,
    align: 'center',
  },
  {
    key: 'room',
    label: 'Room',
    role: 'room',
    description: 'Room Number / Accommodation Unit',
    aliases: ['room', 'room no', 'room #', 'rm', 'room number', 'flat', 'unit', 'cabin', 'camp room', 'accommodation', 'room_no', 'unit no'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'name',
    label: 'Name',
    role: 'name',
    description: 'Full Name of the Individual',
    aliases: ['name', 'full name', 'employee name', 'resident name', 'person name', 'worker name', 'staff name', 'guest name', 'first name', 'emp name', 'fullname'],
    type: 'text',
    width: 28,
    align: 'left',
  },
  {
    key: 'gender',
    label: 'Gender',
    role: 'gender',
    description: 'Gender (Male / Female)',
    aliases: ['gender', 'sex', 'm/f', 'male/female', 'gndr'],
    type: 'text',
    width: 12,
    align: 'center',
  },
  {
    key: 'iqamaNo',
    label: 'Iqama No',
    role: 'iqama',
    description: 'Saudi Iqama / Resident ID Number',
    aliases: ['iqama no', 'iqama', 'iqama number', 'iqamanumber', 'iqama #', 'civil id', 'national id', 'resident id', 'muqeem', 'saudi id', 'id no', 'iqama_no', 'iqama/id'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'iqamaExpiryDate',
    label: 'Expiry Date',
    role: 'iqama_expiry',
    description: 'Iqama Expiry Date',
    aliases: ['iqama expiry', 'iqama exp', 'iqama expiry date', 'iqama exp date', 'iqama valid till', 'expiry date 1', 'id expiry', 'iqama_expiry', 'muqeem expiry'],
    type: 'date',
    width: 16,
    align: 'center',
  },
  {
    key: 'dob',
    label: 'DOB',
    role: 'dob',
    description: 'Date of Birth',
    aliases: ['dob', 'date of birth', 'birth date', 'birthdate', 'born', 'd.o.b', 'birth_date', 'birth'],
    type: 'date',
    width: 15,
    align: 'center',
  },
  {
    key: 'passportNumber',
    label: 'Passport number',
    role: 'passport',
    description: 'Passport Number',
    aliases: ['passport number', 'passport no', 'passport #', 'passport', 'passportno', 'pp no', 'pp number', 'passport_number', 'passport_no', 'pass no'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'passportExpiryDate',
    label: 'Expiry Date',
    role: 'passport_expiry',
    description: 'Passport Expiry Date',
    aliases: ['passport expiry', 'passport exp', 'passport expiry date', 'passport exp date', 'passport valid till', 'expiry date 2', 'pp expiry', 'passport_expiry', 'pp exp date'],
    type: 'date',
    width: 16,
    align: 'center',
  },
  {
    key: 'nationality',
    label: 'Nationality',
    role: 'nationality',
    description: 'Country / Nationality',
    aliases: ['nationality', 'country', 'citizenship', 'nation', 'nat', 'country of origin', 'national'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'religion',
    label: 'Religion',
    role: 'religion',
    description: 'Religion / Faith',
    aliases: ['religion', 'faith', 'rel'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'designation',
    label: 'Designation',
    role: 'designation',
    description: 'Job Title / Occupation / Trade',
    aliases: ['designation', 'job', 'position', 'title', 'trade', 'occupation', 'profession', 'role', 'job title', 'job_title', 'pos'],
    type: 'text',
    width: 24,
    align: 'left',
  },
  {
    key: 'mobileNo',
    label: 'Mobile #',
    role: 'mobile',
    description: 'Mobile Phone Number',
    aliases: ['mobile #', 'mobile', 'mobile no', 'mobile number', 'phone', 'phone #', 'phone no', 'contact', 'cell', 'whatsapp', 'tel', 'contact no', 'mobile_no'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'emergencyContactNo',
    label: 'Emergency Contact #',
    role: 'emergency',
    description: 'Emergency Contact / Next of Kin Phone',
    aliases: ['emergency contact #', 'emergency contact', 'emergency phone', 'emergency #', 'kin contact', 'next of kin', 'emergency no', 'sos contact', 'sos number', 'emergency_contact', 'emergency_no'],
    type: 'text',
    width: 22,
    align: 'center',
  },
];

// Alias for standard backwards-compatibility
export const TARGET_COLUMNS: TargetColumnConfig[] = TARGET_COLUMNS_14;

// 31 Columns Format (Comprehensive Camp & Catering Master from Image 1)
export const TARGET_COLUMNS_CAMP_CATERING_31: TargetColumnConfig[] = [
  {
    key: 'sn',
    label: 'S. N.',
    role: 'serial',
    description: 'Sequential Serial Number',
    aliases: ['s. n.', 's.n.', 's.n', 'sn', 'sl no', 'sl', 'sl.', 'serial', 'serial no', 's.no', 's no', '#', 'no', 'item', 'row'],
    type: 'number',
    width: 8,
    align: 'center',
  },
  {
    key: 'company',
    label: 'Company',
    role: 'company',
    description: 'Employer / Subcontractor Company Name',
    aliases: ['company', 'contractor', 'employer', 'subcontractor', 'comp', 'agency', 'client', 'company name'],
    type: 'text',
    width: 20,
    align: 'left',
  },
  {
    key: 'program',
    label: 'Program',
    role: 'program',
    description: 'Program / Sub-project Stream',
    aliases: ['program', 'programme', 'prog', 'sub project', 'project program'],
    type: 'text',
    width: 16,
    align: 'left',
  },
  {
    key: 'asset',
    label: 'Asset',
    role: 'asset',
    description: 'Facility / Zone Asset Identifier',
    aliases: ['asset', 'asset name', 'facility', 'zone asset', 'camp asset', 'asset id'],
    type: 'text',
    width: 16,
    align: 'left',
  },
  {
    key: 'camp',
    label: 'Camp',
    role: 'camp',
    description: 'Camp Village / Accommodation Location',
    aliases: ['camp', 'camp name', 'site', 'location', 'accommodation camp', 'camp_name'],
    type: 'text',
    width: 16,
    align: 'left',
  },
  {
    key: 'stage',
    label: 'Stage #',
    role: 'stage',
    description: 'Stage or Phase Number',
    aliases: ['stage #', 'stage', 'phase', 'stage no', 'stage number', 'stage_no', 'stage num'],
    type: 'text',
    width: 12,
    align: 'center',
  },
  {
    key: 'buildingNo',
    label: 'Building No:',
    role: 'building',
    description: 'Building or Block Identification',
    aliases: ['building no:', 'building no', 'building #', 'bldg', 'building', 'block', 'bldg no', 'building_no', 'block no'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'floor',
    label: 'Floor #',
    role: 'floor',
    description: 'Floor Level (Ground, 1st, 2nd...)',
    aliases: ['floor #', 'floor', 'flr', 'level', 'floor no', 'floor_no', 'storey'],
    type: 'text',
    width: 12,
    align: 'center',
  },
  {
    key: 'room',
    label: 'Room#',
    role: 'room',
    description: 'Room Number',
    aliases: ['room#', 'room', 'room no', 'room #', 'rm', 'room number', 'unit', 'cabin', 'camp room', 'room_no'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'bedNo',
    label: 'Bed No.',
    role: 'bed',
    description: 'Bed Position (A, B, C, Bed 1...)',
    aliases: ['bed no.', 'bed no', 'bed #', 'bed', 'bed number', 'bed_no', 'bunk'],
    type: 'text',
    width: 12,
    align: 'center',
  },
  {
    key: 'roomSerial',
    label: 'Room Serial #',
    role: 'room_serial',
    description: 'Unique Room Serial Identifier',
    aliases: ['room serial #', 'room serial', 'room serial no', 'rm serial', 'serial room', 'room_serial', 'room serial number'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'roomCategory',
    label: 'Room Category',
    role: 'room_category',
    description: 'Executive, Senior, Junior, Labor or Sharing',
    aliases: ['room category', 'category', 'room type', 'cat', 'rm category', 'room_category', 'type', 'room cat'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'mealId',
    label: 'Meal ID#',
    role: 'meal_id',
    description: 'Catering / Meal Token Identification',
    aliases: ['meal id#', 'meal id', 'meal #', 'catering id', 'mess id', 'canteen id', 'meal_id', 'food id', 'meal token'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'mealCategory',
    label: 'MealCategory',
    role: 'meal_category',
    description: 'Catering Package / Diet Classification',
    aliases: ['mealcategory', 'meal category', 'mess category', 'diet', 'food category', 'canteen category', 'meal_category'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'name',
    label: 'Name',
    role: 'name',
    description: 'Resident Full Name',
    aliases: ['name', 'full name', 'employee name', 'resident name', 'person name', 'worker name', 'staff name', 'emp name', 'fullname'],
    type: 'text',
    width: 26,
    align: 'left',
  },
  {
    key: 'gender',
    label: 'Gender',
    role: 'gender',
    description: 'Gender (Male / Female)',
    aliases: ['gender', 'sex', 'm/f', 'male/female', 'gndr'],
    type: 'text',
    width: 10,
    align: 'center',
  },
  {
    key: 'iqamaNo',
    label: 'Iqama No',
    role: 'iqama',
    description: 'Saudi Iqama / Resident ID',
    aliases: ['iqama no', 'iqama', 'iqama number', 'civil id', 'national id', 'resident id', 'muqeem', 'saudi id', 'id no', 'iqama_no', 'iqama/id'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'iqamaExpiryDate',
    label: 'Expiry Date',
    role: 'iqama_expiry',
    description: 'Iqama Expiry Date',
    aliases: ['expiry date', 'iqama expiry', 'iqama exp', 'iqama expiry date', 'iqama exp date', 'iqama valid till', 'id expiry', 'iqama_expiry'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'dob',
    label: 'DOB',
    role: 'dob',
    description: 'Date of Birth',
    aliases: ['dob', 'date of birth', 'birth date', 'birthdate', 'born', 'd.o.b', 'birth_date'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'passportNumber',
    label: 'Passport number',
    role: 'passport',
    description: 'Passport Number',
    aliases: ['passport number', 'passport no', 'passport #', 'passport', 'pp no', 'pp number', 'passport_number', 'passport_no'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'passportExpiryDate',
    label: 'Expiry Date',
    role: 'passport_expiry',
    description: 'Passport Expiry Date',
    aliases: ['passport expiry', 'passport exp', 'passport expiry date', 'passport exp date', 'pp expiry', 'passport_expiry', 'pp valid'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'nationality',
    label: 'Nationality',
    role: 'nationality',
    description: 'Country of Origin / Nationality',
    aliases: ['nationality', 'country', 'citizenship', 'nation', 'nat', 'national'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'religion',
    label: 'Religion',
    role: 'religion',
    description: 'Religion / Faith',
    aliases: ['religion', 'faith', 'rel'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'designation',
    label: 'Designation',
    role: 'designation',
    description: 'Job Designation / Title',
    aliases: ['designation', 'job', 'position', 'title', 'trade', 'occupation', 'profession', 'role', 'job title'],
    type: 'text',
    width: 22,
    align: 'left',
  },
  {
    key: 'mobileNo',
    label: 'Mobile #',
    role: 'mobile',
    description: 'Resident Mobile Phone Number',
    aliases: ['mobile #', 'mobile', 'mobile no', 'mobile number', 'phone', 'phone #', 'phone no', 'contact', 'cell', 'whatsapp', 'tel'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'emergencyContactNo',
    label: 'Emergency Contact #',
    role: 'emergency',
    description: 'Emergency / SOS Contact Phone Number',
    aliases: ['emergency contact #', 'emergency contact', 'emergency phone', 'emergency #', 'kin contact', 'next of kin', 'sos contact'],
    type: 'text',
    width: 20,
    align: 'center',
  },
  {
    key: 'status',
    label: 'Status',
    role: 'status',
    description: 'Current Occupancy Status (Occupied, Reserved, Vacant)',
    aliases: ['status', 'occupancy status', 'room status', 'bed status', 'resident status', 'current status'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'moveInDate',
    label: 'Move in Date',
    role: 'move_in_date',
    description: 'Resident Move-in or Check-in Date',
    aliases: ['move in date', 'move in', 'check in date', 'check-in date', 'checkin date', 'arrival date', 'check in', 'move_in_date'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'allocationDate',
    label: 'Allocation Date',
    role: 'allocation_date',
    description: 'Room or Bed Booking Allocation Date',
    aliases: ['allocation date', 'allocated date', 'assigned date', 'booking date', 'reserved date', 'allocation_date'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'vaccinated',
    label: 'Vaccinated',
    role: 'vaccinated',
    description: 'Health & Vaccination Compliance Status',
    aliases: ['vaccinated', 'vaccine', 'vaccination status', 'covid vaccinated', 'covid vaccine', 'immunized', 'vaccination'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'remarks',
    label: 'Remarks',
    role: 'remarks',
    description: 'Operational Notes & Special Instructions',
    aliases: ['remarks', 'remark', 'comments', 'comment', 'notes', 'note', 'observations', 'memo'],
    type: 'text',
    width: 24,
    align: 'left',
  },
];

// 21 Columns Format (System Reservation & Unit Tracking from Image 2)
export const TARGET_COLUMNS_SYSTEM_RESERVATION_21: TargetColumnConfig[] = [
  {
    key: 'company',
    label: 'Company',
    role: 'company',
    description: 'Contractor or Subcontractor Company',
    aliases: ['company', 'contractor', 'employer', 'subcontractor', 'client', 'agency', 'company name'],
    type: 'text',
    width: 20,
    align: 'left',
  },
  {
    key: 'roomCategory',
    label: 'Room Category',
    role: 'room_category',
    description: 'Unit Classification (Senior, Junior, Sharing)',
    aliases: ['room category', 'category', 'room type', 'cat', 'type', 'room cat'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'tarrif',
    label: 'Tarrif',
    role: 'tarrif',
    description: 'Rate, Tariff or Pricing Schedule',
    aliases: ['tarrif', 'tariff', 'rate', 'price', 'rent', 'cost', 'fee', 'monthly rate', 'daily rate', 'charge'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'roomNo',
    label: 'Room No.',
    role: 'room',
    description: 'Assigned Accommodation Room Number',
    aliases: ['room no.', 'room no', 'room', 'room #', 'rm', 'room number', 'unit', 'cabin', 'camp room'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'fullName',
    label: 'Full Name',
    role: 'name',
    description: 'Resident Complete Name',
    aliases: ['full name', 'name', 'employee name', 'resident name', 'person name', 'worker name', 'staff name', 'emp name'],
    type: 'text',
    width: 26,
    align: 'left',
  },
  {
    key: 'gender',
    label: 'Gender',
    role: 'gender',
    description: 'Gender Identification',
    aliases: ['gender', 'sex', 'm/f', 'male/female'],
    type: 'text',
    width: 10,
    align: 'center',
  },
  {
    key: 'nationalIdPassportIqama',
    label: 'National ID/Passport/Iqama',
    role: 'national_id_iqama',
    description: 'National ID, Saudi Iqama, or Passport Number',
    aliases: ['national id/passport/iqama', 'national id', 'iqama', 'iqama no', 'id', 'national id no', 'resident id', 'civil id', 'muqeem', 'iqama/id'],
    type: 'text',
    width: 24,
    align: 'center',
  },
  {
    key: 'reqCode',
    label: 'Req. Code',
    role: 'req_code',
    description: 'Requisition / Reservation Request Code',
    aliases: ['req. code', 'req code', 'request code', 'req #', 'booking code', 'reservation code', 'req_code', 'requisition code'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'passportNo',
    label: 'Passport No.',
    role: 'passport',
    description: 'Passport Identification Number',
    aliases: ['passport no.', 'passport no', 'passport number', 'passport #', 'passport', 'pp no', 'pp number'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'passportExpiry',
    label: 'Passport Expiry',
    role: 'passport_expiry',
    description: 'Passport Validity Expiration Date',
    aliases: ['passport expiry', 'passport exp', 'passport expiry date', 'pp expiry', 'passport valid till', 'passport_expiry'],
    type: 'date',
    width: 16,
    align: 'center',
  },
  {
    key: 'nationality',
    label: 'Nationality',
    role: 'nationality',
    description: 'Resident Nationality',
    aliases: ['nationality', 'country', 'citizenship', 'nation', 'nat'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'religion',
    label: 'Religion',
    role: 'religion',
    description: 'Religious Affiliation',
    aliases: ['religion', 'faith', 'rel'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'designation',
    label: 'Designation',
    role: 'designation',
    description: 'Job Title / Trade',
    aliases: ['designation', 'job', 'position', 'title', 'trade', 'occupation', 'profession', 'role', 'job title'],
    type: 'text',
    width: 22,
    align: 'left',
  },
  {
    key: 'phoneNumber',
    label: 'Phone number',
    role: 'mobile',
    description: 'Contact Telephone Number',
    aliases: ['phone number', 'phone', 'phone #', 'phone no', 'mobile', 'mobile #', 'mobile no', 'contact', 'cell'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'reservationStatus',
    label: 'Reservation Status',
    role: 'reservation_status',
    description: 'Reservation Workflow Status (Confirmed, Pending, Cancelled)',
    aliases: ['reservation status', 'res status', 'booking status', 'status', 'allocation status'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'moveInDate',
    label: 'Move In date',
    role: 'move_in_date',
    description: 'Scheduled or Actual Move In Date',
    aliases: ['move in date', 'move in', 'check in date', 'check-in date', 'checkin date', 'arrival date', 'check in'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'allocationDate',
    label: 'Allocation Date',
    role: 'allocation_date',
    description: 'System Unit Allocation Date',
    aliases: ['allocation date', 'allocated date', 'assigned date', 'booking date', 'reserved date'],
    type: 'date',
    width: 14,
    align: 'center',
  },
  {
    key: 'site',
    label: 'Site',
    role: 'site',
    description: 'Project Site Location',
    aliases: ['site', 'project', 'camp', 'location', 'site name'],
    type: 'text',
    width: 16,
    align: 'center',
  },
  {
    key: 'cluster',
    label: 'Cluster',
    role: 'cluster',
    description: 'Camp Village Cluster or Sector',
    aliases: ['cluster', 'block', 'zone', 'sector', 'area'],
    type: 'text',
    width: 14,
    align: 'center',
  },
  {
    key: 'reservationUnits',
    label: 'Reservation Units',
    role: 'reservation_units',
    description: 'Total Reserved Unit Capacity Count',
    aliases: ['reservation units', 'res units', 'units', 'unit count', 'bed count', 'booked units'],
    type: 'text',
    width: 18,
    align: 'center',
  },
  {
    key: 'unitStatus',
    label: 'Unit Status',
    role: 'unit_status',
    description: 'Unit Operational State (Allocated, Ready, Maintenance)',
    aliases: ['unit status', 'room status', 'bed status', 'occupancy status', 'unit_status'],
    type: 'text',
    width: 16,
    align: 'center',
  },
];

export interface FormatTemplate {
  id: string;
  name: string;
  badge: string;
  columnCount: number;
  description: string;
  columns: TargetColumnConfig[];
  defaultTitle: string;
  hasBannerTitle: boolean;
  sampleFileName: string;
}

export const FORMAT_TEMPLATES: FormatTemplate[] = [
  {
    id: 'STANDARD_14_COL',
    name: 'Camp Master Standard (14 Columns)',
    badge: '14 Columns',
    columnCount: 14,
    description: 'Standard 14-column camp master with personal IDs, passports, contacts, and room assignment.',
    columns: TARGET_COLUMNS_14,
    defaultTitle: 'Room Shifting  First Fix  Wellness\\RoseWood Project',
    hasBannerTitle: true,
    sampleFileName: 'Camp_Master_Standard_14_Col.xlsx',
  },
  {
    id: 'CAMP_CATERING_31_COL',
    name: 'Camp & Catering Master (31 Columns)',
    badge: '31 Columns (New)',
    columnCount: 31,
    description: 'Comprehensive operations: Company, Program, Asset, Building, Floor, Room#, Bed, Catering Meal IDs, Personal IDs & Vaccination.',
    columns: TARGET_COLUMNS_CAMP_CATERING_31,
    defaultTitle: 'Camp Allocation & Catering Master Report',
    hasBannerTitle: false,
    sampleFileName: 'Camp_Catering_Master_31_Col.xlsx',
  },
  {
    id: 'SYSTEM_RESERVATION_21_COL',
    name: 'System Reservation & Unit Tracking (21 Columns)',
    badge: '21 Columns (New)',
    columnCount: 21,
    description: 'PMS & Reservation audit layout: Tariff, Req. Code, Passport Expiry, Site, Cluster, and Reservation Unit Status.',
    columns: TARGET_COLUMNS_SYSTEM_RESERVATION_21,
    defaultTitle: 'System Reservation & Unit Allocation Audit',
    hasBannerTitle: false,
    sampleFileName: 'System_Reservation_21_Col.xlsx',
  },
];

export interface SheetSection {
  id: string;
  title: string;
  date: string;
  headerRowIndex: number;
  headers: string[];
  rawRows: any[][];
}

export interface ParsedSheetData {
  sheetName: string;
  sheetNames: string[];
  headers: string[];
  rawRows: any[][];
  headerRowIndex: number;
  detectedTitle?: string;
  detectedDate?: string;
  sections?: SheetSection[];
}

export interface ColumnMapping {
  targetKey: string;
  sourceHeader: string | null; // null means not mapped or auto-generated
  sourceIndex?: number | null; // 0-based column index in raw row array for direct alignment
  confidence: 'HIGH' | 'MEDIUM' | 'MANUAL' | 'NONE';
}

export interface ExtraColumn {
  header: string;
  sourceIndex: number;
  position: 'leading' | 'trailing';
}

export interface StandardizedRow {
  slNo: number | string;
  room: string;
  name: string;
  gender: string;
  iqamaNo: string;
  iqamaExpiryDate: string;
  dob: string;
  passportNumber: string;
  passportExpiryDate: string;
  nationality: string;
  religion: string;
  designation: string;
  mobileNo: string;
  emergencyContactNo: string;
  values?: Record<string, any>;
  extraValues?: Record<string, any>;
  _original?: Record<string, any>;
}

export class ExcelAutomationService {
  /**
   * Reads raw file buffer using XLSX to extract sheets and rows safely
   */
  static parseUploadedWorkbook(fileBuffer: ArrayBuffer): ParsedSheetData {
    const workbook = XLSX.read(fileBuffer, {
      type: 'array',
      cellDates: false, // Prevent UTC timezone shifting bugs
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      dense: true,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The uploaded file does not contain any readable sheets.');
    }

    const firstSheetName = workbook.SheetNames[0];
    return this.parseSheet(workbook, firstSheetName);
  }

  /**
   * Checks whether a value represents an Excel serial date number (e.g. 46273 for 8/9/2026)
   */
  static isExcelDateSerial(val: any): boolean {
    if (val === null || val === undefined) return false;
    const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
    return !isNaN(num) && num >= 35000 && num <= 70000;
  }

  /**
   * Converts an Excel serial date number (e.g. 46273) to a human-readable M/D/YYYY string (e.g. 8/9/2026)
   */
  static formatExcelDateSerial(serial: number | string): string {
    const num = typeof serial === 'number' ? serial : parseFloat(String(serial).trim());
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const d = new Date(utc_value * 1000);
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    const year = d.getUTCFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Detects multi-section blocks in a single sheet (e.g. Check-Out followed by Check-In)
   * Accurately extracts Company / Section banner titles and dates without corrupting date numbers as titles.
   */
  static detectSections(rawGrid: any[][]): SheetSection[] {
    if (!rawGrid || rawGrid.length === 0) return [];

    const HEADER_KEYWORDS = [
      'name', 'iqama', 'passport', 'room', 'gender', 'mobile', 'phone',
      'nationality', 'designation', 'job', 'sl', 'sr.no', 'sr no', 's/l',
      'religion', 'dob', 'category', 'project', 'company', 'contact', 'expiry'
    ];

    // Find all rows that qualify as column headers (>= 3 matching column keywords)
    const headerRowIndices: number[] = [];
    for (let r = 0; r < rawGrid.length; r++) {
      const row = rawGrid[r] || [];
      let matchCount = 0;
      for (const cell of row) {
        if (!cell) continue;
        const str = String(cell).toLowerCase().trim();
        if (HEADER_KEYWORDS.some((kw) => str.includes(kw))) {
          matchCount++;
        }
      }
      if (matchCount >= 3) {
        headerRowIndices.push(r);
      }
    }

    if (headerRowIndices.length === 0) {
      headerRowIndices.push(0);
    }

    const sections: SheetSection[] = [];

    for (let i = 0; i < headerRowIndices.length; i++) {
      const headerRowIdx = headerRowIndices[i];
      const prevHeaderIdx = i > 0 ? headerRowIndices[i - 1] : -1;
      const nextHeaderIdx = i + 1 < headerRowIndices.length ? headerRowIndices[i + 1] : rawGrid.length;

      // Scan rows above headerRowIdx for Section Title & Date banner
      let sectionTitle = '';
      let sectionDate = '';

      const bannerStart = Math.max(0, prevHeaderIdx + 1);
      for (let r = headerRowIdx - 1; r >= bannerStart; r--) {
        const bannerRow = rawGrid[r] || [];
        for (const cell of bannerRow) {
          if (!cell) continue;
          const s = String(cell).trim();
          if (!s) continue;

          // Check if it's an Excel date serial (e.g. 46273)
          if (this.isExcelDateSerial(s)) {
            if (!sectionDate) sectionDate = this.formatExcelDateSerial(s);
          } else if (
            /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(s) ||
            /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(s) ||
            /\b202\d\b/.test(s)
          ) {
            if (!sectionDate) sectionDate = s;
          } else if (/[a-zA-Z]{2,}/.test(s) && !/^\d+$/.test(s)) {
            // Must contain letters, not bare digits: this is the company / section title
            const lower = s.toLowerCase();
            if (
              !sectionTitle ||
              lower.includes('company') ||
              lower.includes('check-in') ||
              lower.includes('check-out') ||
              lower.includes('project') ||
              lower.includes('room shifting')
            ) {
              sectionTitle = s;
            }
          }
        }
      }

      if (!sectionTitle) {
        sectionTitle = i === 0 ? 'Room Shifting  First Fix  Wellness\\RoseWood Project' : `Section ${i + 1}`;
      }
      if (!sectionDate) {
        sectionDate = 'Monday, September 7, 2026';
      }

      // Headers for this section
      const rawHeaders = (rawGrid[headerRowIdx] || []).map((h: any, idx: number) =>
        h && String(h).trim() ? String(h).trim() : `Column_${idx + 1}`
      );

      // Data rows: from headerRowIdx + 1 up to next section's banner/header
      let dataEndIdx = nextHeaderIdx;
      if (i + 1 < headerRowIndices.length) {
        for (let r = nextHeaderIdx - 1; r > headerRowIdx; r--) {
          const row = rawGrid[r] || [];
          const isBannerOrBlank = row.every((cell: any) => !cell || String(cell).trim() === '') ||
            row.some((cell: any) => {
              if (!cell) return false;
              const str = String(cell).toLowerCase().trim();
              return str.includes('check-in') || str.includes('check-out') || str.includes('company name');
            });
          if (isBannerOrBlank) {
            dataEndIdx = r;
          } else {
            break;
          }
        }
      }

      const rawRows = rawGrid.slice(headerRowIdx + 1, dataEndIdx).filter((r) => {
        // Exclude purely blank rows
        const filledCells = r.filter((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '');
        if (filledCells.length === 0) {
          return false;
        }
        // Exclude banner rows that slipped through (only if 1 or 2 sparse cells contain banner text)
        if (filledCells.length <= 2) {
          const rowText = r.map((c: any) => String(c || '').toLowerCase()).join(' ');
          if (
            rowText.includes('company name') ||
            (rowText.includes('check-in') && !rowText.includes('status')) ||
            (rowText.includes('check-out') && !rowText.includes('status'))
          ) {
            return false;
          }
        }
        return true;
      }).map((r) => r.map((cell: any) => ExcelAutomationService.cleanRawValue(cell)));

      sections.push({
        id: `sec_${i + 1}`,
        title: sectionTitle,
        date: sectionDate,
        headerRowIndex: headerRowIdx,
        headers: rawHeaders,
        rawRows,
      });
    }

    return sections;
  }

  /**
   * Parses a specific sheet by name, detecting company title row, multi-sections, and header rows
   */
  static parseSheet(workbook: any, sheetName: string): ParsedSheetData {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" could not be found.`);
    }

    const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (!rawGrid || rawGrid.length === 0) {
      return {
        sheetName,
        sheetNames: workbook.SheetNames,
        headers: [],
        rawRows: [],
        headerRowIndex: 0,
        detectedTitle: 'Room Shifting  First Fix  Wellness\\RoseWood Project',
        detectedDate: 'Monday, September 7, 2026',
        sections: [],
      };
    }

    const sections = this.detectSections(rawGrid);
    const primarySection = sections[0] || {
      title: 'Room Shifting  First Fix  Wellness\\RoseWood Project',
      date: 'Monday, September 7, 2026',
      headers: [],
      rawRows: [],
      headerRowIndex: 0,
    };

    return {
      sheetName,
      sheetNames: workbook.SheetNames,
      headers: primarySection.headers,
      rawRows: primarySection.rawRows,
      headerRowIndex: primarySection.headerRowIndex,
      detectedTitle: primarySection.title,
      detectedDate: primarySection.date,
      sections,
    };
  }

  /**
   * Intelligently maps input headers to target columns with strict negative exclusions
   * and precise column-index tracking to prevent duplicate header collisions or row shifting.
   */
  static autoMapColumns(
    sourceHeaders: string[],
    targetColumns: TargetColumnConfig[] = TARGET_COLUMNS,
    sampleRows?: any[][]
  ): Record<string, ColumnMapping> {
    const mappings: Record<string, ColumnMapping> = {};
    const usedSourceIndices = new Set<number>();

    const cleanSource = sourceHeaders.map((h, index) => ({
      original: h,
      clean: h.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim(),
      index,
    }));

    // Negative exclusion keywords for critical fields to prevent catastrophic cross-mapping:
    const NEGATIVE_RULES: Record<string, string[]> = {
      name: ['job', 'title', 'nationality', 'religion', 'father', 'mother', 'company', 'project', 'file', 'designation', 'trade', 'dept', 'room', 'iqama', 'passport', 'phone', 'mobile', 'sl', 'sn'],
      fullName: ['job', 'title', 'nationality', 'religion', 'father', 'mother', 'company', 'project', 'file', 'designation', 'trade', 'dept', 'room', 'iqama', 'passport', 'phone', 'mobile', 'sl', 'sn'],
      iqamaNo: ['exp', 'expiry', 'date', 'valid', 'due', 'till', 'end', 'issue', 'room', 'bed', 'passport', 'mobile', 'phone'],
      nationalIdPassportIqama: ['exp', 'expiry', 'date', 'valid', 'due', 'till', 'end', 'issue', 'room', 'bed'],
      passportNumber: ['exp', 'expiry', 'date', 'valid', 'due', 'till', 'issue', 'iqama', 'national', 'civil', 'room', 'phone', 'mobile'],
      passportNo: ['exp', 'expiry', 'date', 'valid', 'due', 'till', 'issue', 'iqama', 'national', 'civil', 'room', 'phone', 'mobile'],
      mobileNo: ['emergency', 'sos', 'kin', 'relative', 'sponsor', 'next of kin', 'guardian', 'room', 'iqama', 'passport'],
      phoneNumber: ['emergency', 'sos', 'kin', 'relative', 'sponsor', 'next of kin', 'guardian', 'room', 'iqama', 'passport'],
      emergencyContactNo: ['personal', 'worker mobile', 'room', 'iqama', 'passport'],
      room: ['old', 'previous', 'prior', 'from', 'category', 'cat', 'type', 'serial', 'name', 'iqama', 'passport', 'mobile', 'phone'],
      roomNo: ['old', 'previous', 'prior', 'from', 'category', 'cat', 'type', 'serial', 'name', 'iqama', 'passport', 'mobile', 'phone'],
      slNo: ['room', 'iqama', 'passport', 'phone', 'mobile', 'contact', 'emp', 'badge', 'name'],
      sn: ['room', 'iqama', 'passport', 'phone', 'mobile', 'contact', 'emp', 'badge', 'name'],
      nationality: ['room', 'name', 'iqama', 'passport', 'phone', 'mobile'],
      dob: ['exp', 'expiry', 'valid', 'room', 'iqama', 'passport'],
      company: ['person', 'name', 'phone', 'room', 'iqama'],
      roomCategory: ['serial', 'building', 'floor'],
      bedNo: ['room', 'building'],
      mealCategory: ['id', 'room', 'bed'],
    };

    // 1. First Pass: Strict Exact Alias Match with Negative Checks
    targetColumns.forEach((target) => {
      let bestMatch: { original: string; index: number } | null = null;
      let confidence: ColumnMapping['confidence'] = 'NONE';

      const negatives = NEGATIVE_RULES[target.key] || [];

      for (const s of cleanSource) {
        if (usedSourceIndices.has(s.index)) continue;

        // Skip if violates negative rules
        const hasNegative = negatives.some((neg) => s.clean.includes(neg));
        if (hasNegative && !(target.key === 'room' && cleanSource.every((src) => src.clean.includes('old')))) {
          continue;
        }

        // Exact match with target's aliases
        if (target.aliases.some((alias) => s.clean === alias.replace(/[^a-z0-9]/g, ' ').trim())) {
          bestMatch = { original: s.original, index: s.index };
          confidence = 'HIGH';
          break;
        }
      }

      if (bestMatch) {
        usedSourceIndices.add(bestMatch.index);
        mappings[target.key] = {
          targetKey: target.key,
          sourceHeader: bestMatch.original,
          sourceIndex: bestMatch.index,
          confidence,
        };
      }
    });

    // 2. Second Pass: Substring / Word Match with Negative Checks for unmapped fields
    targetColumns.forEach((target) => {
      if (mappings[target.key] && mappings[target.key].sourceHeader) return;

      let bestMatch: { original: string; index: number } | null = null;
      let confidence: ColumnMapping['confidence'] = 'NONE';
      const negatives = NEGATIVE_RULES[target.key] || [];

      for (const s of cleanSource) {
        if (usedSourceIndices.has(s.index)) continue;

        const hasNegative = negatives.some((neg) => s.clean.includes(neg));
        if (hasNegative) continue;

        // Substring match
        if (
          target.aliases.some((alias) => {
            const cleanAlias = alias.replace(/[^a-z0-9]/g, ' ').trim();
            return s.clean.includes(cleanAlias) || cleanAlias.includes(s.clean);
          })
        ) {
          bestMatch = { original: s.original, index: s.index };
          confidence = 'MEDIUM';
          break;
        }
      }

      if (bestMatch) {
        usedSourceIndices.add(bestMatch.index);
        mappings[target.key] = {
          targetKey: target.key,
          sourceHeader: bestMatch.original,
          sourceIndex: bestMatch.index,
          confidence,
        };
      } else {
        mappings[target.key] = {
          targetKey: target.key,
          sourceHeader: null,
          sourceIndex: null,
          confidence: 'NONE',
        };
      }
    });

    // 3. Third Pass: Proximity-Based Generic Expiry Date Disambiguation
    // (If source has multiple columns labeled "Expiry Date", the one directly next to Iqama belongs to Iqama,
    // and the one next to Passport belongs to Passport).
    const hasIqamaExp = targetColumns.some((c) => c.key === 'iqamaExpiryDate');
    const hasPassportExp = targetColumns.some((c) => c.key === 'passportExpiryDate');

    if (hasIqamaExp || hasPassportExp) {
      const unusedExpiry = cleanSource.filter(
        (s) =>
          !usedSourceIndices.has(s.index) &&
          (s.clean.includes('exp') || s.clean.includes('valid'))
      );

      const iqamaColIdx = mappings['iqamaNo']?.sourceIndex ?? mappings['nationalIdPassportIqama']?.sourceIndex;
      const passportColIdx = mappings['passportNumber']?.sourceIndex ?? mappings['passportNo']?.sourceIndex;

      if (unusedExpiry.length > 0 && hasIqamaExp && (!mappings['iqamaExpiryDate']?.sourceHeader || mappings['iqamaExpiryDate'].confidence === 'NONE')) {
        // Find unused expiry closest to Iqama column
        if (iqamaColIdx !== undefined && iqamaColIdx !== null) {
          unusedExpiry.sort((a, b) => Math.abs(a.index - iqamaColIdx) - Math.abs(b.index - iqamaColIdx));
        }
        const bestIqamaExp = unusedExpiry.shift();
        if (bestIqamaExp) {
          usedSourceIndices.add(bestIqamaExp.index);
          mappings['iqamaExpiryDate'] = {
            targetKey: 'iqamaExpiryDate',
            sourceHeader: bestIqamaExp.original,
            sourceIndex: bestIqamaExp.index,
            confidence: 'HIGH',
          };
        }
      }

      if (unusedExpiry.length > 0 && hasPassportExp && (!mappings['passportExpiryDate']?.sourceHeader || mappings['passportExpiryDate'].confidence === 'NONE')) {
        // Find unused expiry closest to Passport column
        if (passportColIdx !== undefined && passportColIdx !== null) {
          unusedExpiry.sort((a, b) => Math.abs(a.index - passportColIdx) - Math.abs(b.index - passportColIdx));
        }
        const bestPassExp = unusedExpiry.shift();
        if (bestPassExp) {
          usedSourceIndices.add(bestPassExp.index);
          mappings['passportExpiryDate'] = {
            targetKey: 'passportExpiryDate',
            sourceHeader: bestPassExp.original,
            sourceIndex: bestPassExp.index,
            confidence: 'HIGH',
          };
        }
      }
    }

    // 4. Fourth Pass: Sample-Data Verification (ensures Iqama column actually contains ID numbers and not room/name)
    if (sampleRows && sampleRows.length > 0) {
      const iqamaMap = mappings['iqamaNo'] || mappings['nationalIdPassportIqama'];
      if (iqamaMap && iqamaMap.sourceIndex !== null && iqamaMap.sourceIndex !== undefined) {
        const sampleValues = sampleRows.slice(0, 5).map((r) => String(r[iqamaMap.sourceIndex!] || '').trim());
        const hasDigits = sampleValues.some((v) => /^\d{6,14}$/.test(v.replace(/[^\d]/g, '')));
        if (!hasDigits) {
          // The mapped column doesn't contain Iqama digits! Look for another column that has digits
          for (const s of cleanSource) {
            const isDigitCol = sampleRows.slice(0, 5).some((r) => /^\d{10}$/.test(String(r[s.index] || '').replace(/[^\d]/g, '')));
            if (isDigitCol && !usedSourceIndices.has(s.index)) {
              usedSourceIndices.delete(iqamaMap.sourceIndex!);
              usedSourceIndices.add(s.index);
              iqamaMap.sourceIndex = s.index;
              iqamaMap.sourceHeader = s.original;
              iqamaMap.confidence = 'HIGH';
              break;
            }
          }
        }
      }
    }

    return mappings;
  }

  /**
   * Normalizes Religion according to enterprise specifications:
   * "Islam" / "Muslim" -> "Muslim"
   * Any other specified faith or category ("Other", "Hindu", "Christian", etc.) -> "Non-Muslim"
   * Empty / null -> ""
   */
  static normalizeReligion(val: any): string {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    if (!str) return '';

    const lower = str.toLowerCase();
    // Check if explicitly non-muslim
    if (
      lower.includes('non') ||
      lower.includes('not') ||
      lower.includes('অ-মুসলিম') ||
      lower.includes('অমুসলিম')
    ) {
      return 'Non-Muslim';
    }

    if (
      lower.includes('islam') ||
      lower.includes('muslim') ||
      lower.includes('moslem') ||
      lower.includes('musalman') ||
      str.includes('ইসলাম') ||
      str.includes('মুসলিম') ||
      str.includes('مسلم') ||
      str.includes('إسلام')
    ) {
      return 'Muslim';
    }

    // Any other text (e.g. "Other", "Hindu", "Christian", "Buddhist", etc.)
    return 'Non-Muslim';
  }

  /**
   * Cleans and formats date values into consistent date strings.
   * Strictly enforces Month/Day/Year order with '/' separator (e.g. 7/13/2026).
   * Automatically normalizes:
   * - Excel date serial numbers and numeric strings (e.g. 46184 -> 6/12/2026 or 7/2/2026)
   * - Separators: replaces hyphens and dots with slashes (7-13-2026 -> 7/13/2026, 7.13.2026 -> 7/13/2026)
   * - Inverted day/month: if day > 12 (13/7/2026 -> 7/13/2026)
   */
  static cleanDate(
    val: any,
    format: 'M/D/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'M/D/YYYY'
  ): string {
    if (val === undefined || val === null) return '';
    let day = 0;
    let month = 0;
    let year = 0;

    // 1. Check if numeric or numeric string (Excel serial date code e.g. 46184, "46184", 46273)
    const isNum = typeof val === 'number';
    const isNumStr = typeof val === 'string' && /^\d{4,5}(\.\d+)?$/.test(val.trim());
    if (isNum || isNumStr) {
      const num = isNum ? val : parseFloat(val.trim());
      if (!isNaN(num) && num >= 1000 && num <= 85000) {
        try {
          const parsed = XLSX.SSF.parse_date_code(num);
          if (parsed && parsed.y >= 1900 && parsed.m >= 1 && parsed.d >= 1) {
            day = parsed.d;
            month = parsed.m;
            year = parsed.y;
          }
        } catch {}
      }
    }

    // 2. Check if JavaScript Date object
    if (day === 0 && val instanceof Date && !isNaN(val.getTime())) {
      // Add 4 hours buffer to prevent 23:59:08 UTC timezone shift to previous day
      const adjusted = new Date(val.getTime() + 4 * 3600 * 1000);
      day = adjusted.getDate();
      month = adjusted.getMonth() + 1;
      year = adjusted.getFullYear();
    } else if (day === 0) {
      const str = String(val).trim();
      if (!str) return '';

      // Check ISO YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
      const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (isoMatch) {
        year = parseInt(isoMatch[1], 10);
        month = parseInt(isoMatch[2], 10);
        day = parseInt(isoMatch[3], 10);
      } else {
        // Check textual month e.g. 13-Jul-2026, 13 July 2026, July 13 2026
        const MONTH_MAP: Record<string, number> = {
          jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
          apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
          aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
          nov: 11, november: 11, dec: 12, december: 12,
        };
        const textMatch1 = str.match(/^(\d{1,2})[-/.\s]+([A-Za-z]{3,9})[-/.\s]+(\d{2,4})/);
        const textMatch2 = str.match(/^([A-Za-z]{3,9})[-/.\s]+(\d{1,2})[,\s]+(\d{2,4})/);

        if (textMatch1 && MONTH_MAP[textMatch1[2].toLowerCase()]) {
          day = parseInt(textMatch1[1], 10);
          month = MONTH_MAP[textMatch1[2].toLowerCase()];
          let y = textMatch1[3];
          year = y.length === 2 ? (parseInt(y, 10) > 50 ? 1900 + parseInt(y, 10) : 2000 + parseInt(y, 10)) : parseInt(y, 10);
        } else if (textMatch2 && MONTH_MAP[textMatch2[1].toLowerCase()]) {
          month = MONTH_MAP[textMatch2[1].toLowerCase()];
          day = parseInt(textMatch2[2], 10);
          let y = textMatch2[3];
          year = y.length === 2 ? (parseInt(y, 10) > 50 ? 1900 + parseInt(y, 10) : 2000 + parseInt(y, 10)) : parseInt(y, 10);
        } else {
          // Standard D/M/Y or M/D/Y with [-/.] separators: e.g. 13/7/2026, 7-13-2026, 7.13.2026
          const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
          if (dmyMatch) {
            let y = dmyMatch[3];
            if (y.length === 2) {
              y = parseInt(y, 10) > 50 ? `19${y}` : `20${y}`;
            }
            year = parseInt(y, 10);
            const t1 = parseInt(dmyMatch[1], 10);
            const t2 = parseInt(dmyMatch[2], 10);

            // If t1 > 12 (e.g. 13/7/2026), t1 must be day and t2 must be month -> converts to Month 7, Day 13!
            // If t2 > 12 (e.g. 7-13-2026 or 7.13.2026), t2 must be day and t1 must be month -> Month 7, Day 13!
            // If both <= 12: under default 'M/D/YYYY', t1 is month and t2 is day
            if (t1 > 12) {
              day = t1;
              month = t2;
            } else if (t2 > 12) {
              month = t1;
              day = t2;
            } else {
              if (format === 'M/D/YYYY') {
                month = t1;
                day = t2;
              } else {
                day = t1;
                month = t2;
              }
            }
          } else {
            // Check if native Date.parse can recognize it
            try {
              const d = new Date(str);
              if (!isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
                day = d.getDate();
                month = d.getMonth() + 1;
                year = d.getFullYear();
              } else {
                return str;
              }
            } catch {
              return str;
            }
          }
        }
      }
    }

    if (year > 0 && month > 0 && day > 0) {
      if (format === 'M/D/YYYY') {
        // Strictly M/D/YYYY with '/' separator as requested
        return `${month}/${day}/${year}`;
      } else if (format === 'DD/MM/YYYY') {
        const dd = String(day).padStart(2, '0');
        const mm = String(month).padStart(2, '0');
        return `${dd}/${mm}/${year}`;
      } else {
        const dd = String(day).padStart(2, '0');
        const mm = String(month).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }
    }

    return String(val).trim();
  }

  /**
   * Strips all formulas, macros, control chars, or nested cell objects,
   * guaranteeing that only computed pure data values (text, number, date) are retained.
   */
  static cleanRawValue(cell: any): any {
    if (cell === undefined || cell === null) return '';
    if (typeof cell === 'object') {
      if (cell instanceof Date) return cell;
      if (cell.result !== undefined && cell.result !== null) return this.cleanRawValue(cell.result);
      if (cell.v !== undefined && cell.v !== null) return this.cleanRawValue(cell.v);
      if (cell.text !== undefined && cell.text !== null) return this.cleanRawValue(cell.text);
      if (cell.value !== undefined && cell.value !== null) return this.cleanRawValue(cell.value);
    }
    let str = String(cell).trim();
    if (!str) return '';

    // Strip common Excel formula errors
    if (/^#(N\/A|VALUE!|REF!|DIV\/0!|NUM!|NAME\?|NULL!|CALC!|SPILL!)/i.test(str)) {
      return '';
    }

    // Strip raw formulas starting with '=', '=+', '@', etc.
    if (str.startsWith('=')) {
      // If it looks like an uncalculated formula function call e.g. =VLOOKUP(...) or =SUM(...)
      if (/^=[A-Z0-9_.]+\s*\(.*?\)$/i.test(str)) {
        return '';
      }
      str = str.replace(/^=[+@]?/, '').trim();
    }
    // Remove control characters except standard space
    str = str.replace(/[\r\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    return str;
  }

  /**
   * Helper to capitalize the first alphabetic letter in a word or sub-word
   */
  static capitalizeWord(w: string): string {
    if (!w) return '';
    const match = w.match(/[a-zA-Z]/);
    if (!match || match.index === undefined) {
      return w;
    }
    const idx = match.index;
    return (
      w.substring(0, idx) +
      w.charAt(idx).toUpperCase() +
      w.substring(idx + 1).toLowerCase()
    );
  }

  /**
   * Title Case normalizer:
   * Capitalizes first letter of each word and makes all other letters strictly lowercase.
   * Handles multi-word names, hyphens (Al-Omari), slashes, dots (Md. Rahim), parentheses.
   * Example:
   * RAHIM RAHMAN -> Rahim Rahman
   * Rahim rahman -> Rahim Rahman
   * rahim rahman -> Rahim Rahman
   * MD. RAHIM UDDIN -> Md. Rahim Uddin
   */
  static toTitleCase(val: any): string {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    if (!str) return '';

    return str
      .split(/\s+/)
      .map((word) => {
        if (!word) return '';
        if (word.includes('-')) {
          return word
            .split('-')
            .map((sub) => this.capitalizeWord(sub))
            .join('-');
        }
        if (word.includes('/')) {
          return word
            .split('/')
            .map((sub) => this.capitalizeWord(sub))
            .join('/');
        }
        if (word.includes('.')) {
          return word
            .split('.')
            .map((sub) => this.capitalizeWord(sub))
            .join('.');
        }
        return this.capitalizeWord(word);
      })
      .join(' ');
  }

  /**
   * Nationality / Country Normalizer:
   * Converts nationality adjectives to standard Country names as required by user.
   * Example:
   * "Bangladeshi" -> "Bangladesh"
   * "Indian" -> "India"
   * "Nepalese" / "Nepali" -> "Nepal"
   * "Filipino" -> "Philippines"
   * "Pakistani" -> "Pakistan"
   */
  static normalizeNationality(val: any): string {
    if (val === undefined || val === null) return '';
    const raw = String(val).trim();
    if (!raw) return '';

    // Direct Bengali script checks
    if (raw.includes('বাংলাদেশ') || raw.includes('বাঙালি') || raw.includes('বাঙ্গালী')) {
      return 'Bangladesh';
    }
    if (raw.includes('ভারত') || raw.includes('ভারতীয়')) {
      return 'India';
    }
    if (raw.includes('পাকিস্তান')) {
      return 'Pakistan';
    }
    if (raw.includes('নেপাল')) {
      return 'Nepal';
    }

    const clean = raw.toLowerCase().replace(/[^a-z]/g, '');

    const COUNTRY_MAP: Record<string, string> = {
      bangladeshi: 'Bangladesh',
      bangladesh: 'Bangladesh',
      bangali: 'Bangladesh',
      bengali: 'Bangladesh',
      bd: 'Bangladesh',
      bangla: 'Bangladesh',

      indian: 'India',
      india: 'India',
      bharat: 'India',
      bharati: 'India',
      ind: 'India',

      pakistani: 'Pakistan',
      pakistan: 'Pakistan',
      pak: 'Pakistan',

      nepalese: 'Nepal',
      nepali: 'Nepal',
      nepal: 'Nepal',
      nep: 'Nepal',

      filipino: 'Philippines',
      filipina: 'Philippines',
      philippine: 'Philippines',
      philippines: 'Philippines',
      phil: 'Philippines',
      pinoy: 'Philippines',

      egyptian: 'Egypt',
      egypt: 'Egypt',
      egy: 'Egypt',

      saudi: 'Saudi Arabia',
      saudiarabian: 'Saudi Arabia',
      saudiarabia: 'Saudi Arabia',
      ksa: 'Saudi Arabia',

      srilankan: 'Sri Lanka',
      srilanka: 'Sri Lanka',
      lankan: 'Sri Lanka',
      ceylon: 'Sri Lanka',

      yemeni: 'Yemen',
      yemen: 'Yemen',

      sudanese: 'Sudan',
      sudan: 'Sudan',

      jordanian: 'Jordan',
      jordan: 'Jordan',

      syrian: 'Syria',
      syria: 'Syria',

      lebanese: 'Lebanon',
      lebanon: 'Lebanon',

      kenyan: 'Kenya',
      kenya: 'Kenya',

      ugandan: 'Uganda',
      uganda: 'Uganda',

      ghanaian: 'Ghana',
      ghana: 'Ghana',

      nigerian: 'Nigeria',
      nigeria: 'Nigeria',

      ethiopian: 'Ethiopia',
      ethiopia: 'Ethiopia',

      myanmar: 'Myanmar',
      burmese: 'Myanmar',
      burma: 'Myanmar',

      indonesian: 'Indonesia',
      indonesia: 'Indonesia',

      tunisian: 'Tunisia',
      tunisia: 'Tunisia',

      moroccan: 'Morocco',
      morocco: 'Morocco',

      turkish: 'Turkey',
      turkey: 'Turkey',
      turkiye: 'Turkey',

      omani: 'Oman',
      oman: 'Oman',

      emirati: 'UAE',
      uae: 'UAE',

      bahraini: 'Bahrain',
      bahrain: 'Bahrain',

      kuwaiti: 'Kuwait',
      kuwait: 'Kuwait',
    };

    if (COUNTRY_MAP[clean]) {
      return COUNTRY_MAP[clean];
    }

    return this.toTitleCase(raw);
  }

  /**
   * Saudi / GCC Phone Number Cleaner:
   * Strips prefix (+966, 00966, 966, 05, 0) so the number strictly begins with '5' (e.g. 5xxxxxxxx).
   * Also splits multiple contact numbers separated by slash or comma, cleaning each one.
   * Example:
   * +966512345678 -> 512345678
   * 966512345678 -> 512345678
   * 0512345678 -> 512345678
   * 00966512345678 -> 512345678
   * 05 123 4567 -> 51234567
   * +966-0512345678 -> 512345678
   * 0554921010 / 0501234567 -> 554921010 / 501234567
   * 512345678 -> 512345678
   */
  static cleanSaudiPhone(val: any): string {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    if (!str || str.includes('GMT') || str.includes('Arabian Standard Time')) return '';

    // Handle multiple numbers separated by slash, comma, line break, or 'or'
    if (str.includes('/') || str.includes(',') || str.includes('\n') || /\s+or\s+/i.test(str)) {
      const parts = str.split(/[/,\n]|\s+or\s+/i);
      const cleanedParts = parts
        .map((p) => this.cleanSingleSaudiPhone(p))
        .filter((p) => Boolean(p));
      if (cleanedParts.length > 0) {
        return cleanedParts.join(' / ');
      }
    }

    return this.cleanSingleSaudiPhone(str);
  }

  static cleanSingleSaudiPhone(val: any): string {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    if (!str) return '';

    if (/^[0-9.]+[eE][+-]?[0-9]+$/.test(str)) {
      try {
        const num = Number(str);
        if (!isNaN(num)) {
          str = num.toLocaleString('fullwide', { useGrouping: false });
        }
      } catch {}
    }

    let digitsOnly = str.replace(/[^\d+]/g, '');

    if (digitsOnly.startsWith('+')) digitsOnly = digitsOnly.slice(1);
    if (digitsOnly.startsWith('00')) digitsOnly = digitsOnly.slice(2);

    if (digitsOnly.startsWith('966')) {
      digitsOnly = digitsOnly.slice(3);
    }

    if (digitsOnly.startsWith('05')) {
      digitsOnly = digitsOnly.slice(1);
    } else if (digitsOnly.startsWith('0') && digitsOnly.length >= 10 && digitsOnly[1] === '5') {
      digitsOnly = digitsOnly.slice(1);
    }

    if (digitsOnly.startsWith('5')) {
      return digitsOnly;
    }

    return digitsOnly || str;
  }

  /**
   * Saudi Iqama Number Cleaner:
   * Preserves exact 10-digit number, cleans scientific notation (2.53E+09 -> 2530000000)
   */
  static cleanIqamaNumber(val: any): string {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();
    if (!str) return '';

    if (/^[0-9.]+[eE][+-]?[0-9]+$/.test(str)) {
      try {
        const num = Number(str);
        if (!isNaN(num)) {
          str = num.toLocaleString('fullwide', { useGrouping: false });
        }
      } catch {}
    }

    const digits = str.replace(/[^\d]/g, '');
    return digits || str;
  }

  /**
   * Passport Number Cleaner:
   * Uppercase characters, trims spaces
   */
  static cleanPassportNumber(val: any): string {
    if (val === undefined || val === null) return '';
    return String(val).trim().toUpperCase().replace(/\s+/g, '');
  }

  /**
   * Gender normalizer:
   * Male / Female
   */
  static normalizeGender(val: any): string {
    if (val === undefined || val === null) return '';
    const clean = String(val).trim().toLowerCase();
    if (clean === 'm' || clean === 'male' || clean === 'man' || clean === 'purush') return 'Male';
    if (clean === 'f' || clean === 'female' || clean === 'woman' || clean === 'mohila') return 'Female';
    return this.toTitleCase(val);
  }

  /**
   * Cleans numeric and ID strings, avoiding scientific notation (e.g. 5.54E+08 -> 0554...)
   */
  static cleanNumberOrPhone(val: any): string {
    if (val === undefined || val === null) return '';
    let str = String(val).trim();

    // Do not clean if it looks like a date or GMT string
    if (str.includes('GMT') || str.includes('Arabian Standard Time')) {
      return '';
    }

    // Check scientific notation
    if (/^[0-9.]+[eE][+-]?[0-9]+$/.test(str)) {
      try {
        const num = Number(str);
        if (!isNaN(num)) {
          str = num.toLocaleString('fullwide', { useGrouping: false });
        }
      } catch {}
    }

    return str;
  }

  /**
   * Identifies unmapped source columns and classifies them into:
   * - leading: unmapped columns that appear before the primary standard columns (e.g. ROOM Old)
   * - trailing: unmapped columns that appear after the primary standard columns (e.g. Cetagory, Vaccinated)
   */
  static getExtraColumns(
    sourceHeaders: string[],
    mappings: Record<string, ColumnMapping>
  ): { leading: ExtraColumn[]; trailing: ExtraColumn[] } {
    const mappedSourceIndices = new Set<number>();
    const mappedSourceHeaders = new Set<string>();
    let nameSourceIdx = -1;
    let roomSourceIdx = -1;
    let slNoSourceIdx = -1;

    Object.entries(mappings).forEach(([targetKey, map]) => {
      if (map) {
        if (map.sourceIndex !== null && map.sourceIndex !== undefined && map.sourceIndex >= 0) {
          mappedSourceIndices.add(map.sourceIndex);
        }
        if (map.sourceHeader) {
          mappedSourceHeaders.add(map.sourceHeader);
          const idx = map.sourceIndex !== null && map.sourceIndex !== undefined && map.sourceIndex >= 0
            ? map.sourceIndex
            : sourceHeaders.indexOf(map.sourceHeader);
          if (idx !== -1) {
            if (targetKey === 'name') nameSourceIdx = idx;
            if (targetKey === 'room') roomSourceIdx = idx;
            if (targetKey === 'slNo') slNoSourceIdx = idx;
          }
        }
      }
    });

    const boundaryIdx = nameSourceIdx !== -1
      ? nameSourceIdx
      : (roomSourceIdx !== -1 ? roomSourceIdx : (slNoSourceIdx !== -1 ? slNoSourceIdx : 0));

    const leading: ExtraColumn[] = [];
    const trailing: ExtraColumn[] = [];

    sourceHeaders.forEach((h, idx) => {
      const isMapped = mappedSourceIndices.has(idx) || mappedSourceHeaders.has(h);
      if (!isMapped) {
        if (idx < boundaryIdx) {
          leading.push({ header: h, sourceIndex: idx, position: 'leading' });
        } else {
          trailing.push({ header: h, sourceIndex: idx, position: 'trailing' });
        }
      }
    });

    return { leading, trailing };
  }

  /**
   * Converts raw rows into standardized records based on mapping with extra columns preserved.
   * Strictly maintains 1:1 row index and column alignment to prevent data drifting.
   */
  static transformRows(
    rawRows: any[][],
    sourceHeaders: string[],
    mappings: Record<string, ColumnMapping>,
    options: {
      autoFillSlNo?: boolean;
      nameTitleCase?: boolean;
      normalizeCountry?: boolean;
      cleanPhoneNumbers?: boolean;
      normalizeReligion?: boolean;
      dateFormat?: 'M/D/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
      includeExtraColumns?: boolean;
    } = {
      autoFillSlNo: true,
      nameTitleCase: true,
      normalizeCountry: true,
      cleanPhoneNumbers: true,
      normalizeReligion: true,
      dateFormat: 'M/D/YYYY',
      includeExtraColumns: true,
    },
    targetColumns: TargetColumnConfig[] = TARGET_COLUMNS
  ): StandardizedRow[] {
    const headerToIdx = new Map<string, number>();
    sourceHeaders.forEach((h, i) => headerToIdx.set(h, i));
    const dateFormat = options.dateFormat || 'M/D/YYYY';

    const mappedIndicesSet = new Set<number>();
    const mappedHeadersSet = new Set<string>();

    Object.values(mappings).forEach((m) => {
      if (m) {
        if (m.sourceIndex !== null && m.sourceIndex !== undefined && m.sourceIndex >= 0) {
          mappedIndicesSet.add(m.sourceIndex);
        }
        if (m.sourceHeader) {
          mappedHeadersSet.add(m.sourceHeader);
        }
      }
    });

    return rawRows.map((row, rowIndex) => {
      const getVal = (targetKey: string): any => {
        const mapping = mappings[targetKey];
        if (!mapping) return '';
        // 1. Direct index retrieval (eliminates name collision bugs)
        if (mapping.sourceIndex !== null && mapping.sourceIndex !== undefined) {
          const idx = mapping.sourceIndex;
          if (idx >= 0 && idx < row.length) {
            return row[idx];
          }
          return '';
        }
        // 2. Fallback to header name
        if (!mapping.sourceHeader) return '';
        const idx = headerToIdx.get(mapping.sourceHeader);
        if (idx === undefined || idx < 0 || idx >= row.length) return '';
        return row[idx];
      };

      const values: Record<string, any> = {};

      targetColumns.forEach((col) => {
        let rawVal = getVal(col.key);
        // Step 1: Strip raw formulas, macros, control chars, and objects
        rawVal = this.cleanRawValue(rawVal);

        if (col.role === 'serial') {
          if (options.autoFillSlNo || !rawVal || String(rawVal).trim() === '') {
            rawVal = rowIndex + 1;
          } else {
            rawVal = String(rawVal).trim();
          }
        } else if (col.role === 'name') {
          if (options.nameTitleCase !== false && rawVal) {
            rawVal = this.toTitleCase(rawVal);
          }
        } else if (col.role === 'nationality') {
          if (options.normalizeCountry !== false && rawVal) {
            rawVal = this.normalizeNationality(rawVal);
          } else if (options.nameTitleCase !== false && rawVal) {
            rawVal = this.toTitleCase(rawVal);
          }
        } else if (col.role === 'religion' || col.key === 'religion') {
          if (options.normalizeReligion !== false && rawVal) {
            rawVal = this.normalizeReligion(rawVal);
          } else if (options.nameTitleCase !== false && rawVal) {
            rawVal = this.toTitleCase(rawVal);
          }
        } else if (col.role === 'mobile' || col.role === 'emergency') {
          if (options.cleanPhoneNumbers !== false && rawVal) {
            rawVal = this.cleanSaudiPhone(rawVal);
          } else {
            rawVal = this.cleanNumberOrPhone(rawVal);
          }
        } else if (col.role === 'iqama' || col.role === 'national_id_iqama') {
          rawVal = this.cleanIqamaNumber(rawVal);
        } else if (col.role === 'passport') {
          rawVal = this.cleanPassportNumber(rawVal);
        } else if (col.role === 'gender') {
          rawVal = this.normalizeGender(rawVal);
        } else if (
          col.role === 'designation' ||
          col.role === 'company' ||
          col.role === 'project'
        ) {
          if (options.nameTitleCase !== false && rawVal) {
            rawVal = this.toTitleCase(rawVal);
          }
        } else if (col.role === 'room') {
          rawVal = String(rawVal).trim().toUpperCase();
        } else if (col.type === 'date') {
          rawVal = this.cleanDate(rawVal, dateFormat);
        } else {
          rawVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
        }

        values[col.key] = rawVal;
      });

      // Extra unmapped columns preserved verbatim with clean values
      const extraValues: Record<string, any> = {};
      sourceHeaders.forEach((h, colIdx) => {
        const isMapped = mappedIndicesSet.has(colIdx) || mappedHeadersSet.has(h);
        if (!isMapped) {
          const val = row[colIdx];
          extraValues[h] = this.cleanRawValue(val);
        }
      });

      return {
        slNo: values['slNo'] ?? values['sn'] ?? rowIndex + 1,
        room: values['room'] ?? values['roomNo'] ?? '',
        name: values['name'] ?? values['fullName'] ?? '',
        gender: values['gender'] ?? '',
        iqamaNo: values['iqamaNo'] ?? values['nationalIdPassportIqama'] ?? '',
        iqamaExpiryDate: values['iqamaExpiryDate'] ?? '',
        dob: values['dob'] ?? '',
        passportNumber: values['passportNumber'] ?? values['passportNo'] ?? '',
        passportExpiryDate: values['passportExpiryDate'] ?? values['passportExpiry'] ?? '',
        nationality: values['nationality'] ?? '',
        religion: values['religion'] ?? '',
        designation: values['designation'] ?? '',
        mobileNo: values['mobileNo'] ?? values['phoneNumber'] ?? '',
        emergencyContactNo: values['emergencyContactNo'] ?? '',
        values,
        extraValues,
      };
    });
  }

  /**
   * Exports rows as Tab-Separated Values (TSV) for direct paste into existing Excel sheets.
   * If multiple sections are present, outputs all sections sequentially.
   */
  static toTSV(
    rows: StandardizedRow[],
    companyTitle: string = 'Camp Records',
    documentDate: string = 'Monday, September 7, 2026',
    extraColumns: { leading: ExtraColumn[]; trailing: ExtraColumn[] } = { leading: [], trailing: [] },
    includeExtraColumns: boolean = true,
    sections?: Array<{
      title: string;
      date: string;
      transformedRows: StandardizedRow[];
      extraColumns?: { leading: ExtraColumn[]; trailing: ExtraColumn[] };
    }>,
    targetColumns: TargetColumnConfig[] = TARGET_COLUMNS,
    hasBannerTitle: boolean = true
  ): string {
    const hasSerial = targetColumns[0]?.role === 'serial';
    const firstCol = targetColumns[0];
    const remainingTargetCols = hasSerial ? targetColumns.slice(1) : targetColumns;

    const sectionsToExport = sections && sections.length > 0
      ? sections
      : [
          {
            title: companyTitle,
            date: documentDate,
            transformedRows: rows,
            extraColumns,
          },
        ];

    const sectionStrings = sectionsToExport.map((sec) => {
      const secLeading = includeExtraColumns && sec.extraColumns?.leading ? sec.extraColumns.leading.map((c) => c.header) : [];
      const secTrailing = includeExtraColumns && sec.extraColumns?.trailing ? sec.extraColumns.trailing.map((c) => c.header) : [];

      const allHeaders = [
        ...(hasSerial && firstCol ? [firstCol.label] : []),
        ...secLeading,
        ...remainingTargetCols.map((c) => c.label),
        ...secTrailing,
      ];

      const totalCols = allHeaders.length;
      const titleTabCount = Math.max(1, totalCols - 2);
      const titleLine = hasBannerTitle ? `${sec.title}${'\t'.repeat(titleTabCount)}${sec.date}\t\n` : '';
      const headerLine = allHeaders.join('\t');

      const rowLines = sec.transformedRows.map((r) => {
        const firstVal = hasSerial && firstCol ? [r.values?.[firstCol.key] ?? (r as any)[firstCol.key] ?? r.slNo] : [];
        const leadingVals = includeExtraColumns && sec.extraColumns?.leading
          ? sec.extraColumns.leading.map((c) => r.extraValues?.[c.header] ?? '')
          : [];
        const remainingVals = remainingTargetCols.map((c) => r.values?.[c.key] ?? (r as any)[c.key] ?? '');
        const trailingVals = includeExtraColumns && sec.extraColumns?.trailing
          ? sec.extraColumns.trailing.map((c) => r.extraValues?.[c.header] ?? '')
          : [];

        return [...firstVal, ...leadingVals, ...remainingVals, ...trailingVals]
          .map((v) => (v !== undefined && v !== null ? String(v).replace(/\t/g, ' ') : ''))
          .join('\t');
      });

      return `${titleLine}${headerLine}\n${rowLines.join('\n')}`;
    });

    return sectionStrings.join('\n\n');
  }

  /**
   * Generates the stylized output Excel (.xlsx) file matching the user's requested specification.
   * Preserves all sheets from activeWorkbook so no sheet is removed from the file.
   * Supports custom format templates (14-col, 31-col, 21-col) and multi-section rosters.
   */
  static async generateStandardizedExcel(
    rows: StandardizedRow[],
    sheetTitle: string = 'Resident Records',
    options: {
      companyTitle?: string;
      documentDate?: string;
      headerTheme?: 'gold' | 'teal';
      extraColumns?: { leading: ExtraColumn[]; trailing: ExtraColumn[] };
      includeExtraColumns?: boolean;
      activeWorkbook?: any;
      selectedSheetName?: string;
      autoFillSlNo?: boolean;
      nameTitleCase?: boolean;
      normalizeCountry?: boolean;
      cleanPhoneNumbers?: boolean;
      normalizeReligion?: boolean;
      dateFormat?: 'M/D/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
      sections?: Array<{
        title: string;
        date: string;
        rows: StandardizedRow[];
        extraColumns?: { leading: ExtraColumn[]; trailing: ExtraColumn[] };
      }>;
      targetColumns?: TargetColumnConfig[];
      hasBannerTitle?: boolean;
    } = {}
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tamimi Camp Operations';
    workbook.lastModifiedBy = 'Tamimi Automated Operations';
    workbook.created = new Date();

    const isGold = options.headerTheme !== 'teal';
    const HEADER_COLOR_ARGB = isGold ? 'FF7A6006' : 'FF004D66'; // Dark Gold (#7A6006) or Deep Teal (#004D66)

    const HEADER_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_COLOR_ARGB },
    };

    const HEADER_FONT: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 10.5,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    const TITLE_FONT: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    const CELL_BORDER: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    const DATA_BORDER: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    const targetCols = options.targetColumns && options.targetColumns.length > 0
      ? options.targetColumns
      : TARGET_COLUMNS;

    const hasSerial = targetCols[0]?.role === 'serial';
    const firstCol = targetCols[0];
    const remainingTargetCols = hasSerial ? targetCols.slice(1) : targetCols;

    const hasBanner = options.hasBannerTitle !== undefined
      ? options.hasBannerTitle
      : (targetCols === TARGET_COLUMNS || Boolean(options.companyTitle));

    const includeExtra = options.includeExtraColumns !== false;

    const sectionsToRender: Array<{
      title: string;
      date: string;
      rows: StandardizedRow[];
      extraColumns?: { leading: ExtraColumn[]; trailing: ExtraColumn[] };
    }> = options.sections && options.sections.length > 0
      ? options.sections
      : [
          {
            title: options.companyTitle || 'Camp Operations Standard Directory',
            date: options.documentDate || 'Monday, September 7, 2026',
            rows,
            extraColumns: options.extraColumns,
          },
        ];

    const firstSec = sectionsToRender[0];
    const leadingCols = includeExtra && firstSec?.extraColumns?.leading
      ? firstSec.extraColumns.leading
      : (includeExtra && options.extraColumns?.leading ? options.extraColumns.leading : []);
    const trailingCols = includeExtra && firstSec?.extraColumns?.trailing
      ? firstSec.extraColumns.trailing
      : (includeExtra && options.extraColumns?.trailing ? options.extraColumns.trailing : []);

    const renderStandardizedSections = (
      worksheet: ExcelJS.Worksheet,
      secList: Array<{
        title: string;
        date: string;
        rows: StandardizedRow[];
        extraColumns?: { leading: ExtraColumn[]; trailing: ExtraColumn[] };
      }>,
      leadingList: ExtraColumn[],
      trailingList: ExtraColumn[]
    ) => {
      worksheet.views = [{ showGridLines: true }];

      let currentColIdx = 1;

      // 1. Column 1 (if serial)
      if (hasSerial && firstCol) {
        worksheet.getColumn(currentColIdx).width = firstCol.width;
        currentColIdx++;
      }

      // 2. Leading Extra Columns Widths
      leadingList.forEach((col) => {
        worksheet.getColumn(currentColIdx).width = Math.max(14, col.header.length + 3);
        currentColIdx++;
      });

      // 3. Remaining Target Columns Widths
      remainingTargetCols.forEach((col) => {
        worksheet.getColumn(currentColIdx).width = col.width;
        currentColIdx++;
      });

      // 4. Trailing Extra Columns Widths
      trailingList.forEach((col) => {
        worksheet.getColumn(currentColIdx).width = Math.max(14, col.header.length + 3);
        currentColIdx++;
      });

      const totalCols = currentColIdx - 1;
      let currentRowNumber = 1;

      secList.forEach((sec, secIdx) => {
        const secLeading = includeExtra && sec.extraColumns?.leading ? sec.extraColumns.leading : leadingList;
        const secTrailing = includeExtra && sec.extraColumns?.trailing ? sec.extraColumns.trailing : trailingList;

        // Banner row if enabled
        if (hasBanner) {
          const titleRow = worksheet.getRow(currentRowNumber);
          titleRow.height = 32;

          const titleEndCol = Math.max(1, totalCols - 2);
          const dateStartCol = Math.min(totalCols, titleEndCol + 1);

          worksheet.mergeCells(currentRowNumber, 1, currentRowNumber, titleEndCol);
          const companyCell = titleRow.getCell(1);
          companyCell.value = sec.title;
          companyCell.font = TITLE_FONT;
          companyCell.alignment = { horizontal: 'center', vertical: 'middle' };

          if (dateStartCol <= totalCols) {
            worksheet.mergeCells(currentRowNumber, dateStartCol, currentRowNumber, totalCols);
            const dateCell = titleRow.getCell(dateStartCol);
            dateCell.value = sec.date;
            dateCell.font = HEADER_FONT;
            dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
          }

          for (let c = 1; c <= totalCols; c++) {
            const cell = titleRow.getCell(c);
            cell.fill = HEADER_FILL;
            cell.border = CELL_BORDER;
          }
          currentRowNumber++;
        }

        // Column Headers Row
        const headerRow = worksheet.getRow(currentRowNumber);
        headerRow.height = 28;

        let hCol = 1;

        if (hasSerial && firstCol) {
          const cell = headerRow.getCell(hCol);
          cell.value = firstCol.label;
          cell.fill = HEADER_FILL;
          cell.font = HEADER_FONT;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = CELL_BORDER;
          hCol++;
        }

        secLeading.forEach((col) => {
          const cell = headerRow.getCell(hCol);
          cell.value = col.header;
          cell.fill = HEADER_FILL;
          cell.font = HEADER_FONT;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = CELL_BORDER;
          hCol++;
        });

        remainingTargetCols.forEach((col) => {
          const cell = headerRow.getCell(hCol);
          cell.value = col.label;
          cell.fill = HEADER_FILL;
          cell.font = HEADER_FONT;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = CELL_BORDER;
          hCol++;
        });

        secTrailing.forEach((col) => {
          const cell = headerRow.getCell(hCol);
          cell.value = col.header;
          cell.fill = HEADER_FILL;
          cell.font = HEADER_FONT;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = CELL_BORDER;
          hCol++;
        });
        currentRowNumber++;

        // Data Rows
        sec.rows.forEach((rowData) => {
          const row = worksheet.getRow(currentRowNumber);
          row.height = 22;

          let dCol = 1;

          if (hasSerial && firstCol) {
            const cell = row.getCell(dCol);
            const val = rowData.values?.[firstCol.key] ?? (rowData as any)[firstCol.key] ?? rowData.slNo;
            cell.value = val;
            cell.border = DATA_BORDER;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF000000' } };
            dCol++;
          }

          secLeading.forEach((col) => {
            const cell = row.getCell(dCol);
            cell.value = rowData.extraValues?.[col.header] ?? '';
            cell.border = DATA_BORDER;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF000000' } };
            dCol++;
          });

          remainingTargetCols.forEach((colDef) => {
            const cell = row.getCell(dCol);
            const val = rowData.values?.[colDef.key] ?? (rowData as any)[colDef.key] ?? '';
            cell.value = val;
            cell.border = DATA_BORDER;
            cell.alignment = {
              horizontal: colDef.align,
              vertical: 'middle',
            };
            cell.font = {
              name: 'Calibri',
              size: 10.5,
              bold: colDef.role === 'name',
              color: { argb: 'FF000000' },
            };
            dCol++;
          });

          secTrailing.forEach((col) => {
            const cell = row.getCell(dCol);
            cell.value = rowData.extraValues?.[col.header] ?? '';
            cell.border = DATA_BORDER;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF000000' } };
            dCol++;
          });

          currentRowNumber++;
        });

        if (secIdx < secList.length - 1) {
          const spacerRow = worksheet.getRow(currentRowNumber);
          spacerRow.height = 14;
          currentRowNumber++;
        }
      });
    };

    // User Requirement: Preserve and format all sheets from file!
    const activeWb = options.activeWorkbook;
    const targetSheetName = options.selectedSheetName || sheetTitle;

    if (activeWb && Array.isArray(activeWb.SheetNames) && activeWb.SheetNames.length > 0) {
      for (const sName of activeWb.SheetNames) {
        const ws = workbook.addWorksheet(sName, { views: [{ showGridLines: true }] });
        if (sName === targetSheetName) {
          renderStandardizedSections(ws, sectionsToRender, leadingCols, trailingCols);
        } else {
          try {
            const otherParsed = ExcelAutomationService.parseSheet(activeWb, sName);
            if (otherParsed.rawRows && otherParsed.rawRows.length > 0) {
              const otherMappings = ExcelAutomationService.autoMapColumns(
                otherParsed.headers,
                targetCols,
                otherParsed.rawRows
              );
              const otherExtra = ExcelAutomationService.getExtraColumns(
                otherParsed.headers,
                otherMappings
              );

              const otherSections =
                otherParsed.sections && otherParsed.sections.length > 0
                  ? otherParsed.sections.map((sec, idx) => {
                      const secMap =
                        idx === 0
                          ? otherMappings
                          : ExcelAutomationService.autoMapColumns(
                              sec.headers,
                              targetCols,
                              sec.rawRows
                            );
                      const secRows = ExcelAutomationService.transformRows(
                        sec.rawRows,
                        sec.headers,
                        secMap,
                        {
                          autoFillSlNo: options.autoFillSlNo ?? true,
                          nameTitleCase: options.nameTitleCase ?? true,
                          normalizeCountry: options.normalizeCountry ?? true,
                          cleanPhoneNumbers: options.cleanPhoneNumbers ?? true,
                          normalizeReligion: options.normalizeReligion ?? true,
                          dateFormat: options.dateFormat ?? 'M/D/YYYY',
                          includeExtraColumns: options.includeExtraColumns ?? true,
                        },
                        targetCols
                      );
                      return {
                        title:
                          sec.title ||
                          `${options.companyTitle || 'Camp Operations'} - ${sName}`,
                        date:
                          sec.date ||
                          options.documentDate ||
                          'Monday, September 7, 2026',
                        rows: secRows,
                        extraColumns: ExcelAutomationService.getExtraColumns(
                          sec.headers,
                          secMap
                        ),
                      };
                    })
                  : [
                      {
                        title:
                          otherParsed.detectedTitle ||
                          `${options.companyTitle || 'Camp Operations'} - ${sName}`,
                        date:
                          otherParsed.detectedDate ||
                          options.documentDate ||
                          'Monday, September 7, 2026',
                        rows: ExcelAutomationService.transformRows(
                          otherParsed.rawRows,
                          otherParsed.headers,
                          otherMappings,
                          {
                            autoFillSlNo: options.autoFillSlNo ?? true,
                            nameTitleCase: options.nameTitleCase ?? true,
                            normalizeCountry: options.normalizeCountry ?? true,
                            cleanPhoneNumbers: options.cleanPhoneNumbers ?? true,
                            normalizeReligion: options.normalizeReligion ?? true,
                            dateFormat: options.dateFormat ?? 'M/D/YYYY',
                            includeExtraColumns: options.includeExtraColumns ?? true,
                          },
                          targetCols
                        ),
                        extraColumns: otherExtra,
                      },
                    ];

              renderStandardizedSections(
                ws,
                otherSections,
                includeExtra ? otherExtra.leading : [],
                includeExtra ? otherExtra.trailing : []
              );
            } else {
              const rawSheet = activeWb.Sheets[sName];
              if (rawSheet) {
                const rawGrid: any[][] = XLSX.utils.sheet_to_json(rawSheet, {
                  header: 1,
                  defval: '',
                  blankrows: true,
                });
                rawGrid.forEach((r, rIdx) => {
                  const row = ws.getRow(rIdx + 1);
                  r.forEach((val, cIdx) => {
                    row.getCell(cIdx + 1).value = val;
                  });
                });
              }
            }
          } catch (e) {
            console.warn(`[ExcelAutomation] Failed to format sheet "${sName}":`, e);
            const rawSheet = activeWb.Sheets[sName];
            if (rawSheet) {
              const rawGrid: any[][] = XLSX.utils.sheet_to_json(rawSheet, {
                header: 1,
                defval: '',
                blankrows: true,
              });
              rawGrid.forEach((r, rIdx) => {
                const row = ws.getRow(rIdx + 1);
                r.forEach((val, cIdx) => {
                  row.getCell(cIdx + 1).value = val;
                });
              });
            }
          }
        }
      }
    } else {
      const ws = workbook.addWorksheet(targetSheetName, { views: [{ showGridLines: true }] });
      renderStandardizedSections(ws, sectionsToRender, leadingCols, trailingCols);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Helper to trigger browser download
   */
  static triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generates a blank official template for the selected template configuration
   */
  static async downloadBlankTemplate(
    targetColumns: TargetColumnConfig[] = TARGET_COLUMNS,
    templateName: string = 'Standard_Resident_Template.xlsx',
    hasBannerTitle: boolean = true
  ): Promise<void> {
    const blob = await this.generateStandardizedExcel([], 'Template', {
      targetColumns,
      hasBannerTitle,
    });
    this.triggerDownload(blob, templateName);
  }

  /**
   * Generates sample workbook for any chosen template format
   */
  static getSampleWorkbookForTemplate(templateId: string): ArrayBuffer {
    if (templateId === 'CAMP_CATERING_31_COL') {
      const headers = TARGET_COLUMNS_CAMP_CATERING_31.map((c) => c.label);
      const rows = [
        headers,
        [
          1,
          'Tamimi Global Co.',
          'NEOM Operations',
          'Camp Asset-3',
          'Red Sea Village',
          'Stage 1',
          'B-12',
          '1st',
          '101',
          'Bed-A',
          'RM-101-A',
          'Senior Executive',
          'ML-8819',
          'Full Board',
          'Ahmed Al-Mansoor',
          'Male',
          '2418920192',
          '14/09/2026',
          '12/03/1988',
          'P9821034',
          '15/06/2030',
          'Saudi Arabia',
          'Muslim',
          'Camp Supervisor',
          '0501234567',
          '0559876543',
          'Occupied',
          '01/01/2026',
          '28/12/2025',
          'Yes',
          'Permanent Key Issued',
        ],
        [
          2,
          'Al Fanar Contracting',
          'Power Grid 380kV',
          'Asset Zone B',
          'Central Camp 4',
          'Stage 2',
          'B-04',
          'Ground',
          '014',
          'Bed-B',
          'RM-014-B',
          'Junior Staff',
          'ML-3321',
          'Standard',
          'Ramesh Kumar Patel',
          'Male',
          '2581029384',
          '20/11/2026',
          '05/08/1992',
          'M4592019',
          '10/08/2029',
          'India',
          'Hindu',
          'Electrical Engineer',
          '0543219876',
          '0567891234',
          'Occupied',
          '15/01/2026',
          '10/01/2026',
          'Yes',
          'Shift A Rotation',
        ],
        [
          3,
          'Nesma & Partners',
          'Civil Infrastructure',
          'Asset Camp 9',
          'North Village',
          'Stage 1',
          'B-09',
          '2nd',
          '205',
          'Bed-A',
          'RM-205-A',
          'Junior Sharing',
          'ML-7729',
          'Standard',
          'Tariq Mehmood',
          'Male',
          '2398471928',
          '08/07/2026',
          '24/10/1985',
          'K1928472',
          '22/04/2028',
          'Pakistan',
          'Muslim',
          'Safety Officer',
          '0598761234',
          '0531234567',
          'Occupied',
          '05/02/2026',
          '01/02/2026',
          'Yes',
          'Medical Clearance OK',
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Camp Catering Master');
      return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    }

    if (templateId === 'SYSTEM_RESERVATION_21_COL') {
      const headers = TARGET_COLUMNS_SYSTEM_RESERVATION_21.map((c) => c.label);
      const rows = [
        headers,
        [
          'Nesma & Partners',
          'Single Executive',
          'SAR 3,500',
          'E-204',
          'Omar Farooq',
          'Male',
          '2489102938',
          'REQ-9921',
          'A9018273',
          '12/10/2029',
          'Jordan',
          'Muslim',
          'Project Manager',
          '0561928374',
          'Confirmed',
          '10/02/2026',
          '01/02/2026',
          'NEOM Site 1',
          'Cluster Alpha',
          '1',
          'Allocated',
        ],
        [
          'Al Bawani Co',
          'Double Sharing',
          'SAR 2,100',
          'D-112',
          'Chen Wei',
          'Male',
          '2619283740',
          'REQ-8832',
          'E4729102',
          '18/05/2031',
          'China',
          'None',
          'BIM Specialist',
          '0548192039',
          'Active',
          '15/02/2026',
          '12/02/2026',
          'Red Sea Project',
          'Cluster Beta',
          '1',
          'Allocated',
        ],
        [
          'Consolidated Contractors',
          'Junior Suite',
          'SAR 4,200',
          'A-301',
          'David Michael Smith',
          'Male',
          '2501928374',
          'REQ-7741',
          'P8839201',
          '25/08/2028',
          'United Kingdom',
          'Christian',
          'QA/QC Director',
          '0539182736',
          'Reserved',
          '01/03/2026',
          '20/02/2026',
          'Amaala Resort',
          'Cluster Gamma',
          '1',
          'Pre-Allocated',
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'System Reservations');
      return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    }

    return this.getSampleMessyWorkbook();
  }

  /**
   * Generates sample data matching user's exact file with multi-sections (Check-Out and Check-In for Alec Fit Out)
   */
  static getSampleMessyWorkbook(): ArrayBuffer {
    const multiSectionRows = [
      // Section 1: Check-Out Banner & Date
      [
        'Check-Out  COMPANY NAME: Alec Fit Out',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '8/9/2026',
      ],
      // Section 1: Headers
      [
        'SR.NO',
        'ROOM NO',
        'Full Name',
        'Gender',
        'Iqama#',
        'Expiry Date',
        'DOB',
        'Passport number',
        'Expiry Date',
        'Nationality',
        'Religion',
        'Project',
        'Company',
        'Category',
        'Emergency Contact #',
        'Vaccinated',
      ],
      // Section 1: Data Rows (Mohan Raj, Abderahman, MOHAMED ABDELHAMID)
      [
        1,
        'L14-108',
        'Mohan Raj',
        'Male',
        '2601306877',
        '22/07/2026',
        '15/05/1992',
        'Z1092834',
        '10/04/2030',
        'India',
        'Hindu',
        'Four Seasons',
        'ALEC FITOUT',
        'Senior',
        '0594658128',
        'Yes',
      ],
      [
        2,
        'I07-010',
        'Abderahman Mostafa El sayed',
        'Male',
        '2635624089',
        '14/08/2026',
        '20/11/1994',
        'A8291039',
        '15/12/2031',
        'Egypt',
        'Muslim',
        'Six Senses',
        'ALEC FITOUT',
        'Worker',
        '0594658128',
        'Yes',
      ],
      [
        3,
        'J05-008',
        'MOHAMED ABDELHAMID',
        'Male',
        '2511988343',
        '05/09/2026',
        '10/02/1988',
        'B9928102',
        '08/06/2029',
        'Egypt',
        'Muslim',
        'Six Senses',
        'ALEC FITOUT',
        'Worker',
        '0594658128',
        'Yes',
      ],
      // Blank spacer row between sections
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Section 2: Check-In Banner & Date
      [
        'Check-In  COMPANY NAME: Alec Fit Out',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '8/9/2026',
      ],
      // Section 2: Headers (Repeating Header Row)
      [
        'SR.NO',
        'ROOM NO',
        'Full Name',
        'Gender',
        'Iqama#',
        'Expiry Date',
        'DOB',
        'Passport number',
        'Expiry Date',
        'Nationality',
        'Religion',
        'Project',
        'Company',
        'Category',
        'Emergency Contact #',
        'Vaccinated',
      ],
      // Section 2: Data Rows (Usman Khan, Bilal Mahmoud, Fazal Ur Rahman)
      [
        1,
        'L14-108',
        'Usman Khan',
        'Male',
        '2642580506',
        '29/10/2026',
        '10/10/1999',
        'N8291042',
        '20/01/2032',
        'India',
        'Muslim',
        'Six Senses',
        'ALEC FITOUT',
        'Senior',
        '0594658128',
        'Yes',
      ],
      [
        2,
        'I07-010',
        'Bilal Mahmoud',
        'Male',
        '2579924651',
        '13/07/2026',
        '01/09/1993',
        'P1092837',
        '14/09/2028',
        'Egypt',
        'Muslim',
        'Six Senses',
        'ALEC FITOUT',
        'Worker',
        '0594658128',
        'Yes',
      ],
      [
        3,
        'J05-008',
        'Fazal Ur Rahman',
        'Male',
        '2351060112',
        '19/08/2026',
        '06/07/1982',
        'K9201928',
        '25/11/2027',
        'Pakistan',
        'Muslim',
        'RSMLI',
        'ALEC FITOUT',
        'Worker',
        '0594658128',
        'Yes',
      ],
    ];

    const wb = XLSX.utils.book_new();
    const wsAlec = XLSX.utils.aoa_to_sheet(multiSectionRows);
    XLSX.utils.book_append_sheet(wb, wsAlec, 'Alec Fit Out Roster');

    // Secondary sheet with leading extra columns (ROOM Old)
    const rosewoodRows = [
      [
        'Room Shifting  First Fix  Wellness\\RoseWood Project',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Monday, September 7, 2026'
      ],
      [
        'S/L', 'ROOM Old', 'ROOM NO', 'EmployeeName', 'Gender', 'IqamaNo', 'IqamaExpiry',
        'DateOfBirth', 'PassportNo', 'PassportExpiryDate', 'NationalityName', 'ReligionName',
        'JobTitleName', 'Cetagory', 'PersonalPhone', 'Emergency Contact #', 'Vaccinated'
      ],
      [
        1, 'A3-108', 'F2-001', 'Sohail Khan Muhammad Zamin', 'Male', '2535350892', '8/9/2026',
        '10/11/2001', 'FT4152951', '2/8/2031', 'Pakistan', 'Muslim', 'Electrician', 'Worker',
        '505644663', '0530826307', 'Yes'
      ],
      [
        2, 'A3-108', 'F2-001', 'Muhammad Mudassar Rehmat Khan', 'Male', '2541580920', '7/17/2026',
        '3/20/1986', 'AB0412925', '1/5/2028', 'Pakistan', 'Muslim', 'Technician - BMS', 'Worker',
        '535487393', '0530826307', 'Yes'
      ]
    ];
    const wsRosewood = XLSX.utils.aoa_to_sheet(rosewoodRows);
    XLSX.utils.book_append_sheet(wb, wsRosewood, 'RoseWood Project');

    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  }
}

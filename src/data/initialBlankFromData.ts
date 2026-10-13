export interface BlankFromRow {
  id: string; // e.g. "142"
  property: string; // "TBCV"
  sector: string; // "S01"
  house: string; // "H05"
  floor: string; // "FF"
  room: string; // "104"
  unit: string; // "TBCV - S01- H05- FF- 104" -> {{Unit}}
  propertyType: 'Executive' | 'Senior' | 'Junior' | 'Worker' | string; // -> Type of Property checkbox
  contractType: string; // "Permanent"
  occupancy: string; // "Single Occupancy"
  status: string; // "Checked out" | "Active" | "Checked in"
  employmentId: string; // "102202" -> {{Employment ID}}
  name: string; // "Basem Abulaban" -> {{Name}}
  gender: string; // "Male" -> {{Gender}}
  category: string; // "Rsg Visitor"
  company: string; // "Rsg" -> {{Company}}
  division: string; // "Projects Delivery" -> {{Division}}
  department: string; // "Projects Delivery" -> {{Department}}
  designation: string; // "Senior Manager"
  idIqama: string; // "2528338589" -> {{ID/Iqama}}
  passport?: string; // {{Passport}}
  mobile: string; // "543084116" -> {{Mobile}}
  email?: string; // {{Email}}
  nationality: string; // "Jordan" -> {{Nationality}}
  dob?: string; // {{DOB}}
  moveInDate: string; // "8/24/2026" -> {{Move_In_Date}}
  contractStartDate?: string; // "8/24/2026"
  moveOutDate: string; // "8/26/2026" -> {{Move_Out_Date}}
  emergencyMobile: string; // "543084116" -> {{Emergency_contact}}
  emergencyName: string; // "None" -> {{Name of Contact}}
  vehicleRegNo?: string;
  vehicleModel?: string;
  carParkSpace?: string;
}

export const INITIAL_BLANK_FROM_ROWS: BlankFromRow[] = [
  {
    id: '142',
    property: 'TBCV',
    sector: 'S01',
    house: 'H05',
    floor: 'FF',
    room: '104',
    unit: 'TBCV - S01- H05- FF- 104',
    propertyType: 'Senior',
    contractType: 'Permanent',
    occupancy: 'Single Occupancy',
    status: 'Checked out',
    employmentId: '102202',
    name: 'Basem Abulaban',
    gender: 'Male',
    category: 'Rsg Visitor',
    company: 'Rsg',
    division: 'Projects Delivery',
    department: 'Projects Delivery',
    designation: 'Senior Manager',
    idIqama: '2528338589',
    passport: 'P9841293',
    mobile: '543084116',
    email: 'basem.abulaban@redseaglobal.com',
    nationality: 'Jordan',
    dob: '15/07/1984',
    moveInDate: '8/24/2026',
    contractStartDate: '8/24/2026',
    moveOutDate: '8/26/2026',
    emergencyMobile: '543084116',
    emergencyName: 'None',
    vehicleRegNo: 'KSA 4892 RSG',
    vehicleModel: 'Toyota Prado / White',
    carParkSpace: 'P-104',
  },
  {
    id: '143',
    property: 'TBCV',
    sector: 'S02',
    house: 'H02',
    floor: 'GF',
    room: '101',
    unit: 'TBCV - S02- H02- GF- 101',
    propertyType: 'Executive',
    contractType: 'Permanent',
    occupancy: 'Single Occupancy',
    status: 'Checked in',
    employmentId: '104891',
    name: 'Tariq Mansoor Al-Ghamdi',
    gender: 'Male',
    category: 'Rsg Staff',
    company: 'Red Sea Global',
    division: 'Hospitality & Operations',
    department: 'Community Management',
    designation: 'Senior Operations Director',
    idIqama: '1098234710',
    passport: 'SA7729104',
    mobile: '551234890',
    email: 'tariq.ghamdi@redseaglobal.com',
    nationality: 'Saudi Arabia',
    dob: '02/04/1980',
    moveInDate: '8/15/2026',
    contractStartDate: '8/15/2026',
    moveOutDate: '12/31/2026',
    emergencyMobile: '509988776',
    emergencyName: 'Mansoor Al-Ghamdi (Brother)',
    vehicleRegNo: 'TGA 9011',
    vehicleModel: 'Land Cruiser / Silver',
    carParkSpace: 'VIP-02',
  },
  {
    id: '144',
    property: 'TBCV',
    sector: 'S01',
    house: 'H08',
    floor: 'SF',
    room: '202',
    unit: 'TBCV - S01- H08- SF- 202',
    propertyType: 'Senior',
    contractType: 'Permanent',
    occupancy: 'Single Occupancy',
    status: 'Checked in',
    employmentId: '105520',
    name: 'Mohammad Farhan Akhtar',
    gender: 'Male',
    category: 'FM Contractor',
    company: 'Tamimi Global Co. Ltd',
    division: 'Facility Management',
    department: 'Helpdesk & Operations',
    designation: 'Camp Operations Lead',
    idIqama: '2489104829',
    passport: 'PK8820194',
    mobile: '501234567',
    email: 'm.farhan@tamimi-global.com',
    nationality: 'Pakistani',
    dob: '10/11/1988',
    moveInDate: '8/01/2026',
    contractStartDate: '8/01/2026',
    moveOutDate: '11/30/2026',
    emergencyMobile: '501234567',
    emergencyName: 'Akhtar Hussain (Father)',
    vehicleRegNo: 'TAFGA 404',
    vehicleModel: 'Hilux / White',
    carParkSpace: 'S-202',
  },
  {
    id: '145',
    property: 'TBCV',
    sector: 'S03',
    house: 'H12',
    floor: 'FF',
    room: '105',
    unit: 'TBCV - S03- H12- FF- 105',
    propertyType: 'Junior',
    contractType: 'Contractor',
    occupancy: 'Shared Occupancy',
    status: 'Checked in',
    employmentId: '107812',
    name: 'Suresh Meghewal',
    gender: 'Male',
    category: 'FM Technician',
    company: 'Tamimi Global Co. Ltd',
    division: 'Hard FM',
    department: 'HVAC Maintenance',
    designation: 'HVAC Specialist',
    idIqama: '2398410294',
    passport: 'IN9018472',
    mobile: '559876543',
    email: 'suresh.m@tamimi-global.com',
    nationality: 'Indian',
    dob: '22/09/1991',
    moveInDate: '8/10/2026',
    contractStartDate: '8/10/2026',
    moveOutDate: '10/31/2026',
    emergencyMobile: '559876543',
    emergencyName: 'Ramesh Meghewal',
  },
  {
    id: '146',
    property: 'TBCV',
    sector: 'S03',
    house: 'H14',
    floor: 'GF',
    room: '102',
    unit: 'TBCV - S03- H14- GF- 102',
    propertyType: 'Worker',
    contractType: 'Contractor',
    occupancy: 'Bunk Bed Room',
    status: 'Checked in',
    employmentId: '109140',
    name: 'Nurul Islam Mia',
    gender: 'Male',
    category: 'Housekeeping',
    company: 'Tamimi Global Co. Ltd',
    division: 'Soft FM',
    department: 'Housekeeping Services',
    designation: 'Housekeeping Supervisor',
    idIqama: '2384759182',
    passport: 'BD6719284',
    mobile: '571123344',
    email: 'nurul.islam@tamimi-global.com',
    nationality: 'Bangladeshi',
    dob: '05/03/1993',
    moveInDate: '8/05/2026',
    contractStartDate: '8/05/2026',
    moveOutDate: '12/15/2026',
    emergencyMobile: '571123344',
    emergencyName: 'Abdul Mia',
  },
];

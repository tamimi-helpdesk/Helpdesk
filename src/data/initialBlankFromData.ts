export interface BlankFromRow {
  id: string; // e.g. "142"
  property: string; // "TBCV"
  sector: string; // "S01"
  house: string; // "H05"
  floor: string; // "FF"
  room: string; // "104"
  unit: string; // "TBCV - S01- H05- FF- 104" -> {{Unit}}
  buildingNo?: string; // "Building No." (e.g. "Bldg 05", "H05")
  unitNo?: string; // "Unit No" (e.g. "104")
  unitSerialNo?: string; // "Unit Serial Number" (e.g. "SN-10492")
  propertyType: 'Executive' | 'Senior' | 'Junior' | 'Worker' | string; // -> Type of Property checkbox
  contractType: string; // "Permanent"
  occupancy: string; // "Single Occupancy"
  status: string; // "Checked out" | "Active" | "Checked in"
  employmentId: string; // "102202" -> {{Employment ID}}
  name: string; // "Basem Abulaban" -> {{Name}} (Resident Name)
  gender: string; // "Male" -> {{Gender}}
  category: string; // "Rsg Visitor"
  company: string; // "Rsg" -> {{Company}}
  division: string; // "Projects Delivery" -> {{Division}}
  department: string; // "Projects Delivery" -> {{Department}}
  designation: string; // "Senior Manager"
  idIqama: string; // "2528338589" -> {{ID/Iqama}} (National ID/Iqama)
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

import { MANAGEMENT_ALLOCATION_RECORDS } from './managementAllocationData';

// Records directly loaded from Management Allocation History.xlsx (1,438 employees)
export const INITIAL_BLANK_FROM_ROWS: BlankFromRow[] = MANAGEMENT_ALLOCATION_RECORDS;

export const EMPTY_BLANK_FROM_ROW: BlankFromRow = {
  id: '',
  property: 'TBCV',
  sector: 'S01',
  house: '',
  floor: 'FF',
  room: '',
  unit: '',
  buildingNo: '',
  unitNo: '',
  unitSerialNo: '',
  propertyType: 'Executive',
  contractType: 'Permanent',
  occupancy: 'Single Occupancy',
  status: 'Active',
  employmentId: '',
  name: '',
  gender: 'Male',
  category: 'Rsg Staff',
  company: 'Red Sea Global',
  division: 'Projects Delivery',
  department: 'Projects Delivery',
  designation: '',
  idIqama: '',
  passport: '',
  mobile: '',
  email: '',
  nationality: 'Saudi Arabia',
  dob: '',
  moveInDate: '8/24/2026',
  contractStartDate: '8/24/2026',
  moveOutDate: '12/31/2026',
  emergencyMobile: '',
  emergencyName: 'None',
  vehicleRegNo: '',
  vehicleModel: '',
  carParkSpace: '',
};

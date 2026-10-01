export type FormCategory =
  | 'ALL'
  | 'RECEPTION_HELPDESK'
  | 'ACCOMMODATION_HK'
  | 'RECREATION_FACILITIES'
  | 'STORE_MATERIAL'
  | 'OPERATIONS'
  | 'LOGISTICS_SECURITY'
  | 'HR_ADMIN'
  | 'CLEARANCE'
  | 'LEGAL_COMPLIANCE';

export interface FormTemplateField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'time' | 'select' | 'textarea' | 'number';
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  colSpan?: 1 | 2 | 3 | 4;
}

export interface AttendanceRow {
  id: string;
  sl: number;
  empName: string;
  badgeId: string;
  designation: string;
  shift: string;
  timeIn: string;
  timeOut: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'SICK' | 'OVERTIME' | 'OFF';
  otHours: number | string;
  signature: string;
}

export interface MaterialItemRow {
  id: string;
  sl: number;
  itemCode: string;
  description: string;
  unit: string;
  qtyRequested: number | string;
  qtyIssued?: number | string;
  unitPrice?: number | string;
  purpose: string;
  remarks?: string;
}

export interface ClearanceDeptCheck {
  id: string;
  department: string;
  custodyItems: string;
  status: 'CLEARED' | 'PENDING' | 'N/A' | 'DEDUCTION';
  officerName: string;
  officerBadge: string;
  signDate: string;
  remarks: string;
}

export interface GatePassMaterialRow {
  id: string;
  sl: number;
  description: string;
  serialNo: string;
  qty: number | string;
  unit: string;
  purpose: string;
  returnable: boolean;
  expectedReturnDate?: string;
}

export interface CustomTableColumn {
  id: string;
  label: string;
  key: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'date';
  width?: string;
  align?: 'left' | 'center' | 'right';
  options?: string[];
  placeholder?: string;
}

export interface CustomTableDefinition {
  title?: string;
  columns: CustomTableColumn[];
  defaultRows?: Record<string, any>[];
}

export interface FormTemplateDefinition {
  id: string;
  code: string;
  title: string;
  category: FormCategory;
  categoryLabel: string;
  description: string;
  version: string;
  department: string;
  docRefPrefix: string;
  iconName: string;
  accentColor: string;
  hasDynamicTable?: 'ATTENDANCE' | 'MATERIALS' | 'STORE' | 'CLEARANCE' | 'GATE_PASS' | 'CUSTOM' | 'NONE';
  customTable?: CustomTableDefinition;
  headerFields: FormTemplateField[];
  footerFields?: FormTemplateField[];
  sampleData: Record<string, any>;
  sampleAttendanceRows?: AttendanceRow[];
  sampleMaterialRows?: MaterialItemRow[];
  sampleClearanceRows?: ClearanceDeptCheck[];
  sampleGatePassRows?: GatePassMaterialRow[];
  sampleCustomRows?: Record<string, any>[];
  isCustomUploaded?: boolean;
  uploadedFileName?: string;
  uploadedAt?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface SavedFormRecord {
  id: string;
  templateId: string;
  formCode: string;
  title: string;
  docRef: string;
  applicant: string;
  department: string;
  createdAt: string;
  formData: Record<string, any>;
  attendanceRows?: AttendanceRow[];
  materialRows?: MaterialItemRow[];
  clearanceRows?: ClearanceDeptCheck[];
  gatePassRows?: GatePassMaterialRow[];
  customRows?: Record<string, any>[];
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PRINTED';
}

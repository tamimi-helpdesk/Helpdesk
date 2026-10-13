export interface EmployeeRecord {
  id: string; // e.g. "EMP-1049" or "TGM-4820"
  badgeNumber: string;
  fullName: string;
  arabicName?: string;
  designation: string;
  department: string;
  nationality: string;
  iqamaNumber: string; // or National ID / Passport
  iqamaExpiry?: string;
  phoneNumber: string;
  email?: string;
  company: string; // e.g. "Tamimi Global Co. Ltd"
  roomNumber?: string;
  buildingNumber?: string;
  campLocation?: string; // e.g. "Construction Village", "Amaala Coastal Village"
  dateOfJoining?: string;
  bloodGroup?: string;
  supervisorName?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  customFields?: Record<string, string>;
}

export interface AutoFormFieldMapping {
  key: string;
  label: string;
  placeholder?: string;
  value: string;
  employeeFieldMap?: keyof EmployeeRecord | 'todayDate' | 'docReference';
  fieldType?: 'text' | 'date' | 'textarea' | 'select';
}

export interface AutoFormTemplate {
  id: string;
  title: string;
  docCode: string;
  description: string;
  sourceType: 'WORD_DOCX' | 'BUILTIN' | 'CUSTOM';
  rawHtml?: string;
  rawText?: string;
  fileName?: string;
  fields: AutoFormFieldMapping[];
  category: string;
  orientation?: 'portrait' | 'landscape';
}

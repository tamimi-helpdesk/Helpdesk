export type EmployeeStatus = 'PERMANENT' | 'TEMPORARY' | 'CONTACT' | 'CONTRACTOR';
export type EmployeeClassification = 'ADMINISTRATOR' | 'STAFF' | 'FACULTY' | 'CONTRACTOR';

export type InvoiceType =
  | 'MISSING_ITEMS'
  | 'DAMAGE_REPAIR'
  | 'KEY_REPLACEMENT'
  | 'ACCOMMODATION_UTILITY'
  | 'CATERING_MESS'
  | 'LAUNDRY_LINEN'
  | 'FACILITY_POS';

export interface InvoiceItemLine {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remarks?: string;
  splitPersonCount?: number;
}

export interface SplitReferenceTable {
  title: string;
  cost: number;
  themeColor: 'yellow' | 'blue' | 'peach';
  divisions: {
    persons: number;
    formula: string;
    costPerPerson: number;
  }[];
}

export interface UnifiedInvoiceRecord {
  id: string;
  invoiceType?: InvoiceType;
  invoiceNumber: string; // e.g. "INV-MI-2026/09/01-101"
  date: string; // YYYY-MM-DD
  dueDate?: string;
  
  // Client / Resident / Employee Info
  customerName?: string; // Employee or Resident or Company POC
  employeeName?: string; // alias for customerName
  employeeId?: string;
  roomNumber?: string; // e.g. "C7-104"
  company: string; // e.g. "Al-Ayuni", "Tamimi Global", "Nesma"
  facilities: string; // e.g. "TBCV", "Core Camp", "Stage 1"
  pocName?: string; // Point of Contact
  phoneNumber?: string;
  mobile?: string; // alias for phoneNumber
  
  employeeStatus?: EmployeeStatus;
  classification?: EmployeeClassification;
  
  // Line items
  items: InvoiceItemLine[];
  
  // Financials
  subtotal?: number;
  vatRate?: number; // 0 or 15
  vatAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  
  // Status & Payment
  paymentStatus: 'PAID' | 'PENDING' | 'DEDUCT_FROM_SALARY' | 'OVERDUE' | 'WAIVED' | 'VOID';
  paymentMethod?: 'CASH' | 'CARD_POS' | 'STC_PAY' | 'BANK_TRANSFER' | 'PAYROLL_DEDUCTION' | 'CREDIT_ACCOUNT';
  
  // Approvals & Signatures
  issuedByName?: string; // e.g. "Majid - Facilities Supervisor"
  issuedDate?: string;
  pocDate?: string;
  pocSignature?: string;
  issuedBySignature?: string;
  conditionAcknowledged?: boolean;
  
  // Meta & Notes
  notes?: string;
  internalRef?: string;
  createdAt: string;
  updatedAt?: string;
}

// Backward compatibility aliases
export type MissingItemRow = InvoiceItemLine;
export type MissingItemsInvoiceRecord = UnifiedInvoiceRecord;
export type GeneralPOSInvoiceRecord = UnifiedInvoiceRecord;

export interface InvoiceTypeDefinition {
  type: InvoiceType;
  title: string;
  arabicTitle: string;
  subtitle: string;
  formRefCode: string;
  iconName: string;
  badgeColor: string;
  description: string;
  defaultItems: Omit<InvoiceItemLine, 'id' | 'quantity' | 'amount' | 'remarks'>[];
  defaultVatRate: number;
  policyTerms: string[];
}

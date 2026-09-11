import { MissingItemRow, SplitReferenceTable, MissingItemsInvoiceRecord } from '../types/invoice';

export const STANDARD_MISSING_ITEMS: Omit<MissingItemRow, 'id' | 'quantity' | 'amount' | 'remarks'>[] = [
  { name: 'Room Key', unitPrice: 25.0 },
  { name: 'Amaala ID', unitPrice: 25.0 },
  { name: 'Laundry Bag', unitPrice: 25.0 },
  { name: 'Blanket', unitPrice: 228.0 },
  { name: 'Locker', unitPrice: 0.0 },
  { name: 'Steel Rack', unitPrice: 0.0 },
  { name: 'Window Curtain', unitPrice: 0.0 },
  { name: 'Bed Light', unitPrice: 0.0 },
  { name: 'Bed Curtain', unitPrice: 45.0 },
  { name: 'Pillow', unitPrice: 86.25 },
  { name: 'Bath Towel', unitPrice: 82.0 },
  { name: 'Pillow Cover', unitPrice: 57.5 },
  { name: 'Bed Sheet', unitPrice: 115.0 },
  { name: 'Mattress', unitPrice: 0.0 },
  { name: 'Bed', unitPrice: 0.0 },
  { name: 'BMS Charger', unitPrice: 188.03 },
  { name: 'BMS Adapter Power Cable', unitPrice: 112.82 },
  { name: 'BMS AC Controller', unitPrice: 1341.25 },
  { name: 'Electric Kettle', unitPrice: 100.0 },
  { name: 'AC Remote', unitPrice: 97.0 },
  { name: 'Study Lamp', unitPrice: 50.0 },
  { name: 'Coffee Maker', unitPrice: 150.0 },
  { name: 'DHL', unitPrice: 2507.0 },
  { name: 'Bed Side Lamp', unitPrice: 80.0 },
];

export const SPLIT_REFERENCE_TABLES: SplitReferenceTable[] = [
  {
    title: 'For BMS Charger',
    cost: 188.03,
    themeColor: 'yellow',
    divisions: [
      { persons: 1, formula: '188.03/1', costPerPerson: 188 },
      { persons: 2, formula: '188.03/2', costPerPerson: 94 },
      { persons: 3, formula: '188.03/3', costPerPerson: 63 },
      { persons: 4, formula: '188.03/4', costPerPerson: 47 },
      { persons: 5, formula: '188.03/5', costPerPerson: 38 },
    ],
  },
  {
    title: 'For BMS Charger Cable',
    cost: 112.82,
    themeColor: 'blue',
    divisions: [
      { persons: 1, formula: '112.82/1', costPerPerson: 113 },
      { persons: 2, formula: '112.82/2', costPerPerson: 56 },
      { persons: 3, formula: '112.82/3', costPerPerson: 38 },
      { persons: 4, formula: '112.82/4', costPerPerson: 28 },
      { persons: 5, formula: '112.82/5', costPerPerson: 23 },
    ],
  },
  {
    title: 'For BMS AC Controller',
    cost: 1341.25,
    themeColor: 'peach',
    divisions: [
      { persons: 1, formula: '1341.25/1', costPerPerson: 1341 },
      { persons: 2, formula: '1341.25/2', costPerPerson: 671 },
      { persons: 3, formula: '1341.25/3', costPerPerson: 447 },
      { persons: 4, formula: '1341.25/4', costPerPerson: 335 },
      { persons: 5, formula: '1341.25/5', costPerPerson: 268 },
    ],
  },
];

export const INITIAL_MISSING_ITEMS_INVOICES: MissingItemsInvoiceRecord[] = [
  {
    id: 'inv-mi-001',
    invoiceNumber: 'INV-MI-2026/08/14',
    date: '2026-08-14',
    roomNumber: 'C7-104',
    employeeName: 'Suresh Meghewal',
    employeeId: 'EMP-7729',
    company: 'Al-Ayuni',
    facilities: 'TBCV',
    pocName: 'Naveeth',
    mobile: '0536148530',
    employeeStatus: 'CONTRACTOR',
    classification: 'CONTRACTOR',
    items: STANDARD_MISSING_ITEMS.map((item, idx) => {
      if (item.name === 'BMS Charger') {
        return {
          id: `item-${idx}`,
          name: item.name,
          quantity: 1,
          unitPrice: item.unitPrice,
          amount: 63.0,
          remarks: '188.03/3=63*1=63',
          splitPersonCount: 3,
        };
      }
      if (item.name === 'BMS Adapter Power Cable') {
        return {
          id: `item-${idx}`,
          name: item.name,
          quantity: 1,
          unitPrice: item.unitPrice,
          amount: 38.0,
          remarks: '112.82/3=38*1=38',
          splitPersonCount: 3,
        };
      }
      return {
        id: `item-${idx}`,
        name: item.name,
        quantity: 0,
        unitPrice: item.unitPrice,
        amount: 0.0,
        remarks: '',
      };
    }),
    totalAmount: 101.0,
    conditionAcknowledged: true,
    issuedByName: 'Majid',
    issuedDate: '2026-08-14',
    pocDate: '2026-08-14',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    createdAt: '2026-08-14T09:30:00Z',
    notes: 'Charges split across 3 room occupants for shared charger unit.',
  },
  {
    id: 'inv-mi-002',
    invoiceNumber: 'INV-MI-2026/08/25',
    date: '2026-08-25',
    roomNumber: 'B4-202',
    employeeName: 'Rahul Verma',
    employeeId: 'EMP-8812',
    company: 'Tamimi Global',
    facilities: 'TBCV',
    pocName: 'Naveeth',
    mobile: '0559123841',
    employeeStatus: 'PERMANENT',
    classification: 'STAFF',
    items: STANDARD_MISSING_ITEMS.map((item, idx) => {
      if (item.name === 'Room Key') {
        return {
          id: `item-${idx}`,
          name: item.name,
          quantity: 1,
          unitPrice: item.unitPrice,
          amount: 25.0,
          remarks: 'Lost during transit',
        };
      }
      if (item.name === 'Bath Towel') {
        return {
          id: `item-${idx}`,
          name: item.name,
          quantity: 1,
          unitPrice: item.unitPrice,
          amount: 82.0,
          remarks: 'Damaged item',
        };
      }
      return {
        id: `item-${idx}`,
        name: item.name,
        quantity: 0,
        unitPrice: item.unitPrice,
        amount: 0.0,
        remarks: '',
      };
    }),
    totalAmount: 107.0,
    conditionAcknowledged: true,
    issuedByName: 'Majid',
    issuedDate: '2026-08-25',
    pocDate: '2026-08-25',
    paymentStatus: 'DEDUCT_FROM_SALARY',
    paymentMethod: 'PAYROLL_DEDUCTION',
    createdAt: '2026-08-25T14:15:00Z',
    notes: 'Approved for payroll deduction by HR Operations.',
  },
];

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Divide,
  Calculator,
  User,
  Building2,
  Phone,
  Calendar,
  Layers,
  FileSpreadsheet,
  QrCode,
  Sparkles,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  UnifiedInvoiceRecord,
  InvoiceType,
  InvoiceItemLine,
  EmployeeStatus,
  EmployeeClassification,
} from '../../types/invoice';
import {
  INVOICE_TYPE_DEFINITIONS,
  SPLIT_REFERENCE_TABLES,
} from '../../data/invoiceTemplates';
import { UniversalPrintLayout } from './UniversalPrintLayout';
import { TAMIMI_LOGO_DATA_URL } from '../TamimiLogo';
import { generateDailyUniqueInvoiceNumber } from '../../utils/invoiceNumber';

interface UniversalInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: UnifiedInvoiceRecord) => void;
  initialInvoice?: UnifiedInvoiceRecord | null;
  defaultType?: InvoiceType;
  existingInvoices?: UnifiedInvoiceRecord[];
}

export const UniversalInvoiceModal: React.FC<UniversalInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInvoice,
  defaultType = 'MISSING_ITEMS',
  existingInvoices = [],
}) => {
  const currentType = initialInvoice?.invoiceType || defaultType;
  const typeDef = INVOICE_TYPE_DEFINITIONS[currentType] || INVOICE_TYPE_DEFINITIONS.MISSING_ITEMS;

  const [date, setDate] = useState<string>(
    initialInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice?.invoiceNumber ||
      generateDailyUniqueInvoiceNumber(currentType, new Date().toISOString().split('T')[0], existingInvoices)
  );

  // Client / Resident / Employee Info
  const [customerName, setCustomerName] = useState<string>(
    initialInvoice?.customerName || ''
  );
  const [employeeId, setEmployeeId] = useState<string>(
    initialInvoice?.employeeId || ''
  );
  const [roomNumber, setRoomNumber] = useState<string>(
    initialInvoice?.roomNumber || ''
  );
  const [company, setCompany] = useState<string>(
    initialInvoice?.company || 'Al-Ayuni'
  );
  const [facilities, setFacilities] = useState<string>(
    initialInvoice?.facilities || 'TBCV'
  );
  const [pocName, setPocName] = useState<string>(
    initialInvoice?.pocName || 'Naveeth'
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(
    initialInvoice?.phoneNumber || '0536148530'
  );
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>(
    initialInvoice?.employeeStatus || 'CONTRACTOR'
  );
  const [classification, setClassification] = useState<EmployeeClassification>(
    initialInvoice?.classification || 'CONTRACTOR'
  );

  // Line items
  const [items, setItems] = useState<InvoiceItemLine[]>(() => {
    if (initialInvoice?.items && initialInvoice.items.length > 0) {
      return initialInvoice.items;
    }
    // Populate default template items
    return typeDef.defaultItems.map((item, idx) => ({
      id: `item-${idx}`,
      name: item.name,
      category: item.category,
      quantity: 0,
      unitPrice: item.unitPrice,
      amount: 0,
      remarks: '',
      splitPersonCount: 1,
    }));
  });

  // Financials & VAT
  const [vatRate, setVatRate] = useState<number>(
    initialInvoice?.vatRate !== undefined ? initialInvoice.vatRate : typeDef.defaultVatRate
  );
  const [discountAmount, setDiscountAmount] = useState<number>(
    initialInvoice?.discountAmount || 0
  );

  // Status & Payment
  const [paymentStatus, setPaymentStatus] = useState<UnifiedInvoiceRecord['paymentStatus']>(
    initialInvoice?.paymentStatus || 'PAID'
  );
  const [paymentMethod, setPaymentMethod] = useState<UnifiedInvoiceRecord['paymentMethod']>(
    initialInvoice?.paymentMethod || 'CASH'
  );

  // Signatures & Notes
  const [issuedByName, setIssuedByName] = useState<string>(
    initialInvoice?.issuedByName || 'Majid'
  );
  const [issuedDate, setIssuedDate] = useState<string>(
    initialInvoice?.issuedDate || date
  );
  const [pocDate, setPocDate] = useState<string>(
    initialInvoice?.pocDate || date
  );
  const [conditionAcknowledged, setConditionAcknowledged] = useState<boolean>(
    initialInvoice?.conditionAcknowledged ?? true
  );
  const [notes, setNotes] = useState<string>(initialInvoice?.notes || '');

  // UI Tabs & Views
  const [modalTab, setModalTab] = useState<'EDIT' | 'PRINT_PREVIEW' | 'SPLIT_CALC'>('EDIT');
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState<number>(50);
  const [newCustomCategory, setNewCustomCategory] = useState('Custom Charge');

  // Multi-Room Breakdown Calculator State (Integrated inside modal)
  const [breakdownItemIdx, setBreakdownItemIdx] = useState<number | null>(null);
  const [isBatchWizardOpen, setIsBatchWizardOpen] = useState<boolean>(false);
  const [breakdownTiers, setBreakdownTiers] = useState<Array<{ id: string; persons: number; rooms: number }>>([
    { id: '1', persons: 1, rooms: 2 },
    { id: '2', persons: 5, rooms: 1 },
    { id: '3', persons: 2, rooms: 3 },
    { id: '4', persons: 3, rooms: 3 },
    { id: '5', persons: 4, rooms: 3 },
  ]);

  const activeBreakdownItem = breakdownItemIdx !== null ? items[breakdownItemIdx] : null;

  // Helper to compute breakdown for a given unit price and room occupancy tiers
  const calculateTierBreakdown = (unitPrice: number, tiers: Array<{ persons: number; rooms: number }>) => {
    let totalUnits = 0;
    let totalAmount = 0;
    const formulaLines: string[] = [];

    tiers.forEach((t) => {
      const persons = Math.max(1, Number(t.persons) || 1);
      const rooms = Math.max(0, Number(t.rooms) || 0);
      totalUnits += rooms;
      const splitPerPerson = Math.round(unitPrice / persons);
      const tierTotal = splitPerPerson * rooms;
      totalAmount += tierTotal;
      if (rooms > 0) {
        formulaLines.push(`${unitPrice.toFixed(2)}/${persons}=${splitPerPerson}*${rooms}=${tierTotal}`);
      }
    });

    return {
      totalUnits,
      totalAmount,
      formulaLines,
      remarksText: formulaLines.join('\n'),
    };
  };

  const handleApplyBreakdownToActiveItem = () => {
    if (breakdownItemIdx === null || !activeBreakdownItem) return;
    const calc = calculateTierBreakdown(activeBreakdownItem.unitPrice, breakdownTiers);
    setItems((prev) => {
      const updated = [...prev];
      updated[breakdownItemIdx] = {
        ...updated[breakdownItemIdx],
        quantity: calc.totalUnits,
        amount: calc.totalAmount,
        remarks: calc.remarksText,
      };
      return updated;
    });
    setBreakdownItemIdx(null);
  };

  const handleApplyBatchWizard = () => {
    setItems((prev) => {
      return prev.map((item) => {
        const isBmsCharger = item.name.toLowerCase().includes('charger');
        const isBmsCable = item.name.toLowerCase().includes('adapter') || item.name.toLowerCase().includes('cable');
        if (isBmsCharger || isBmsCable) {
          const calc = calculateTierBreakdown(item.unitPrice, breakdownTiers);
          return {
            ...item,
            quantity: calc.totalUnits,
            amount: calc.totalAmount,
            remarks: calc.remarksText,
          };
        }
        return item;
      });
    });
    setIsBatchWizardOpen(false);
  };

  const existingInvoicesRef = useRef<UnifiedInvoiceRecord[]>(existingInvoices);
  existingInvoicesRef.current = existingInvoices;

  // Guard to ensure form is initialized ONLY when opening or switching invoices, NEVER during editing
  const activeSessionKeyRef = useRef<string | null>(null);

  // Reset/populate form ONLY when modal opens or when switching invoice to edit, NEVER in mid-edit
  useEffect(() => {
    if (!isOpen) {
      activeSessionKeyRef.current = null;
      return;
    }

    // Determine current session key (either specific invoice id or new invoice type)
    const sessionKey = initialInvoice ? `edit-${initialInvoice.id}` : `new-${currentType}`;

    // If modal is already open and initialized for this session, NEVER wipe out user's active inputs!
    if (activeSessionKeyRef.current === sessionKey) {
      return;
    }

    activeSessionKeyRef.current = sessionKey;

    if (initialInvoice) {
      setDate(initialInvoice.date);
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setCustomerName(initialInvoice.customerName || '');
      setEmployeeId(initialInvoice.employeeId || '');
      setRoomNumber(initialInvoice.roomNumber || '');
      setCompany(initialInvoice.company || 'Al-Ayuni');
      setFacilities(initialInvoice.facilities || 'TBCV');
      setPocName(initialInvoice.pocName || 'Naveeth');
      setPhoneNumber(initialInvoice.phoneNumber || '0536148530');
      setEmployeeStatus(initialInvoice.employeeStatus || 'CONTRACTOR');
      setClassification(initialInvoice.classification || 'CONTRACTOR');
      setItems(
        initialInvoice.items && initialInvoice.items.length > 0
          ? initialInvoice.items
          : typeDef.defaultItems.map((item, idx) => ({
              id: `item-${idx}`,
              name: item.name,
              category: item.category,
              quantity: 0,
              unitPrice: item.unitPrice,
              amount: 0,
              remarks: '',
              splitPersonCount: 1,
            }))
      );
      setVatRate(initialInvoice.vatRate !== undefined ? initialInvoice.vatRate : typeDef.defaultVatRate);
      setDiscountAmount(initialInvoice.discountAmount || 0);
      setPaymentStatus(initialInvoice.paymentStatus || 'PAID');
      setPaymentMethod(initialInvoice.paymentMethod || 'CASH');
      setIssuedByName(initialInvoice.issuedByName || 'Majid');
      setIssuedDate(initialInvoice.issuedDate || initialInvoice.date);
      setPocDate(initialInvoice.pocDate || initialInvoice.date);
      setConditionAcknowledged(initialInvoice.conditionAcknowledged ?? true);
      setNotes(initialInvoice.notes || '');
    } else {
      // New Invoice defaults
      const todayStr = new Date().toISOString().split('T')[0];
      const newInvNum = generateDailyUniqueInvoiceNumber(currentType, todayStr, existingInvoicesRef.current);
      setInvoiceNumber(newInvNum);
      setDate(todayStr);
      setCustomerName('');
      setEmployeeId('');
      setRoomNumber('');
      setCompany('Al-Ayuni');
      setFacilities('TBCV');
      setPocName('Naveeth');
      setPhoneNumber('0536148530');
      setEmployeeStatus('CONTRACTOR');
      setClassification('CONTRACTOR');
      setItems(
        typeDef.defaultItems.map((item, idx) => ({
          id: `item-${idx}`,
          name: item.name,
          category: item.category,
          quantity: 0,
          unitPrice: item.unitPrice,
          amount: 0,
          remarks: '',
          splitPersonCount: 1,
        }))
      );
      setVatRate(typeDef.defaultVatRate);
      setDiscountAmount(0);
      setPaymentStatus('PAID');
      setPaymentMethod(typeDef.defaultVatRate > 0 ? 'CARD_POS' : 'CASH');
      setIssuedByName('Majid');
      setIssuedDate(todayStr);
      setPocDate(todayStr);
      setConditionAcknowledged(true);
      setNotes('');
    }
    setModalTab('EDIT');
  }, [isOpen, initialInvoice, currentType, typeDef]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  const vatAmount = useMemo(() => {
    if (vatRate <= 0) return 0;
    const base = Math.max(0, subtotal - discountAmount);
    return Math.round(base * (vatRate / 100) * 100) / 100;
  }, [subtotal, discountAmount, vatRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + vatAmount);
  }, [subtotal, discountAmount, vatAmount]);

  // Update item quantity or custom price
  const handleItemChange = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'remarks' | 'splitPersonCount',
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'quantity') {
        const qty = Math.max(0, Number(value) || 0);
        target.quantity = qty;
        if (target.splitPersonCount && target.splitPersonCount > 1) {
          const rawSplit = target.unitPrice / target.splitPersonCount;
          const roundedSplit = Math.round(rawSplit);
          target.amount = Math.round(roundedSplit * qty * 100) / 100;
          target.remarks = `${target.unitPrice}/${target.splitPersonCount}=${roundedSplit}*${qty}=${target.amount}`;
        } else {
          target.amount = Math.round(qty * target.unitPrice * 100) / 100;
        }
      } else if (field === 'unitPrice') {
        const price = Math.max(0, Number(value) || 0);
        target.unitPrice = price;
        if (target.splitPersonCount && target.splitPersonCount > 1) {
          const roundedSplit = Math.round(price / target.splitPersonCount);
          target.amount = Math.round(roundedSplit * target.quantity * 100) / 100;
        } else {
          target.amount = Math.round(target.quantity * price * 100) / 100;
        }
      } else if (field === 'splitPersonCount') {
        const persons = Math.max(1, Number(value) || 1);
        target.splitPersonCount = persons;
        if (persons > 1) {
          const roundedSplit = Math.round(target.unitPrice / persons);
          target.amount = Math.round(roundedSplit * target.quantity * 100) / 100;
          target.remarks = `${target.unitPrice}/${persons}=${roundedSplit}*${target.quantity}=${target.amount} (Shared)`;
        } else {
          target.amount = Math.round(target.quantity * target.unitPrice * 100) / 100;
          target.remarks = '';
        }
      } else if (field === 'remarks') {
        target.remarks = value;
      }

      updated[index] = target;
      return updated;
    });
  };

  // Add custom line item
  const handleAddCustomItem = () => {
    if (!newCustomName.trim()) return;
    const newItem: InvoiceItemLine = {
      id: `custom-${Date.now()}`,
      name: newCustomName.trim(),
      category: newCustomCategory,
      quantity: 1,
      unitPrice: newCustomPrice,
      amount: newCustomPrice,
      remarks: 'Custom entry',
      splitPersonCount: 1,
    };
    setItems((prev) => [...prev, newItem]);
    setNewCustomName('');
    setNewCustomPrice(50);
  };

  // Delete line item
  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Constructed record object for preview and save
  const currentRecord: UnifiedInvoiceRecord = {
    id: initialInvoice?.id || `inv-${Date.now()}`,
    invoiceType: currentType,
    invoiceNumber,
    date,
    customerName: customerName || 'Resident / Client',
    employeeId,
    roomNumber,
    company,
    facilities,
    pocName,
    phoneNumber,
    employeeStatus,
    classification,
    items,
    subtotal,
    vatRate,
    vatAmount,
    discountAmount,
    totalAmount: grandTotal,
    paymentStatus,
    paymentMethod,
    issuedByName,
    issuedDate,
    pocDate,
    conditionAcknowledged,
    notes,
    createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSave = () => {
    onSave(currentRecord);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {}
    onClose();
  };

  // Native Print Trigger
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${typeDef.title} - ${invoiceNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
          * { box-sizing: border-box; }
          html, body { height: 100%; margin: 0; padding: 0; background: #fff; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            font-size: 11px; 
            color: #0f172a; 
            line-height: 1.35; 
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 7px; margin-bottom: 7px; }
          .logo-box { display: flex; align-items: center; gap: 10px; }
          .logo-img { height: 56px; width: auto; object-fit: contain; }
          .logo-text-title { font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; line-height: 1; }
          .logo-text-sub { font-size: 9.5px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
          .logo-text-ar { font-size: 9px; color: #64748b; margin-top: 1px; font-family: 'Times New Roman', serif; }
          .center-header { text-align: center; flex: 1; padding: 0 10px; }
          .title { font-size: 17px; font-weight: 900; text-transform: uppercase; color: #020617; letter-spacing: 0.5px; }
          .subtitle { font-size: 12.5px; font-weight: 800; margin-top: 1px; color: #1e293b; }
          .sub-sub { font-size: 10px; font-weight: 600; color: #475569; margin-top: 1px; }
          .badge-box { text-align: right; font-family: monospace; font-size: 10.5px; }
          .inv-pill { background: #0f172a; color: #fff; padding: 3px 8px; font-weight: 900; font-size: 11px; border-radius: 2px; }
          
          .company-info { border: 1px solid #0f172a; padding: 7px 10px; margin-bottom: 7px; background: #f8fafc; font-size: 11.5px; }
          .emp-head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 5px; font-size: 12px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }
          .checkbox-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-top: 5px; padding-top: 4px; border-top: 1px solid #e2e8f0; }
          
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 7px; }
          th { border: 1px solid #1e293b; padding: 4.5px 7px; background: #e2e8f0; font-weight: 900; color: #0f172a; }
          td { border: 1px solid #64748b; padding: 3.8px 6px; }
          .right { text-align: right; }
          .center { text-align: center; }
          .highlight-row { background: #eff6ff; font-weight: 700; color: #0f172a; }
          .total-row { font-weight: 900; background: #f1f5f9; font-size: 12.5px; border-top: 2px solid #0f172a; }
          
          .footer-box { border: 1px solid #0f172a; padding: 7px 10px; background: #f8fafc; margin-bottom: 6px; }
          .policy-text { font-size: 9.5px; line-height: 1.35; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 5px; }
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .sig-card { border: 1px solid #94a3b8; background: #fff; padding: 6px 8px; }
          .sig-card-head { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px; font-weight: 900; font-size: 10.5px; }
          .sig-line-box { margin-top: 8px; border-top: 1px dashed #475569; padding-top: 2px; height: 42px; display: flex; align-items: flex-end; justify-content: space-between; font-size: 10px; }
          .doc-footer { display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-family: monospace; padding-top: 4px; border-top: 1px solid #e2e8f0; }

          @media print {
            html, body { height: 100% !important; overflow: hidden !important; }
            .header, .company-info, table, tr, td, th, .footer-box { page-break-inside: avoid !important; break-inside: avoid !important; }
          }
        </style>
      </head>
      <body>
        <div>
          <div class="header">
            <div class="logo-box">
              <img src="${TAMIMI_LOGO_DATA_URL}" alt="Tamimi Global" class="logo-img" />
              <div>
                <div class="logo-text-title">TAMIMI GLOBAL</div>
                <div class="logo-text-sub">TAFGA • CAMP OPS</div>
                <div class="logo-text-ar">شركة التميمي العالمية</div>
              </div>
            </div>
            
            <div class="center-header">
              <div class="title">FACILITIES DEPARTMENT</div>
              <div class="subtitle">${typeDef.title}</div>
              <div class="sub-sub">Tamimi Global Company (TAFGA) • ${facilities || 'TBCV'} Facilities</div>
            </div>
            
            <div class="badge-box">
              <div class="inv-pill">INVOICE # ${invoiceNumber.replace(/^INV-[A-Z]+-/, '') || date}</div>
              <div style="margin-top: 3px; font-weight: bold; color: #334155;">CAMP: ${facilities || 'TBCV'}</div>
              <div style="color: #64748b; font-size: 9px;">Date: ${date}</div>
            </div>
          </div>

          <div class="company-info">
            <div class="emp-head">
              <div><strong>Customer / Employee:</strong> <u style="font-weight: 900;">${roomNumber ? `${roomNumber} - ` : ''}${customerName}</u> ${employeeId ? `(${employeeId})` : ''}</div>
              ${roomNumber ? `<div><strong>Room Ref:</strong> <span style="font-family: monospace; font-weight: 900; background: #fff; padding: 1px 4px; border: 1px solid #94a3b8;">${roomNumber}</span></div>` : ''}
            </div>
            
            <div class="grid-2">
              <div><strong>Company :</strong> ${company || 'Al-Ayuni'}</div>
              <div><strong>Facilities :</strong> ${facilities || 'TBCV'}</div>
              <div><strong>POC Name :</strong> ${pocName || 'Naveeth'}</div>
              <div><strong>Mobile :</strong> <span style="font-family: monospace;">${phoneNumber || '0536148530'}</span></div>
            </div>
            
            <div class="checkbox-row">
              <div>
                <strong>Status:</strong> 
                [${employeeStatus === 'PERMANENT' ? '✓' : ' '}] Permanent &nbsp;
                [${employeeStatus === 'TEMPORARY' ? '✓' : ' '}] Temporary &nbsp;
                [${employeeStatus === 'CONTACT' ? '✓' : ' '}] Contact &nbsp;
                [${employeeStatus === 'CONTRACTOR' ? '✓' : ' '}] Contractor
              </div>
              <div>
                <strong>Class:</strong> 
                [${classification === 'ADMINISTRATOR' ? '✓' : ' '}] Admin &nbsp;
                [${classification === 'STAFF' ? '✓' : ' '}] Staff &nbsp;
                [${classification === 'FACULTY' ? '✓' : ' '}] Faculty &nbsp;
                [${classification === 'CONTRACTOR' ? '✓' : ' '}] Contractor
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 42%;">Description / Item</th>
                <th style="width: 50px;" class="center">Quantity</th>
                <th style="width: 85px;" class="right">Unit Rate</th>
                <th style="width: 85px;" class="right">Amount</th>
                <th style="text-align: left;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (it) => `
                <tr class="${it.quantity > 0 ? 'highlight-row' : ''}">
                  <td>${it.name}</td>
                  <td class="center" style="font-family: monospace; font-weight: bold;">${it.quantity || 0}</td>
                  <td class="right" style="font-family: monospace;">${it.unitPrice.toFixed(2)}</td>
                  <td class="right" style="font-family: monospace; font-weight: bold;">${it.amount.toFixed(2)}</td>
                  <td style="font-size: 10px; color: #334155;">${it.remarks || ''}</td>
                </tr>
              `
                )
                .join('')}
              
              ${
                vatRate > 0
                  ? `
                <tr style="background: #f8fafc; font-size: 10.5px;">
                  <td colspan="3" class="right">Subtotal SAR</td>
                  <td class="right" style="font-family: monospace; font-weight: bold;">${subtotal.toFixed(2)}</td>
                  <td>Tax Exclusive</td>
                </tr>
                <tr style="background: #f8fafc; font-size: 10.5px;">
                  <td colspan="3" class="right">VAT ${vatRate}% SAR</td>
                  <td class="right" style="font-family: monospace; font-weight: bold; color: #92400e;">${vatAmount.toFixed(2)}</td>
                  <td>ZATCA Tax ID: 300012345600003</td>
                </tr>
              `
                  : ''
              }

              <tr class="total-row">
                <td colspan="3" class="right" style="text-transform: uppercase;">Total Amount SAR</td>
                <td class="right" style="font-family: monospace; font-size: 13px; color: #020617;">${grandTotal.toFixed(2)}</td>
                <td style="font-weight: 900;">${
                  paymentStatus === 'PAID'
                    ? '★ PAID AT DESK'
                    : paymentStatus === 'DEDUCT_FROM_SALARY'
                    ? '★ DEDUCT FROM SALARY'
                    : paymentStatus === 'OVERDUE'
                    ? '★ OVERDUE BILL'
                    : '★ PENDING SETTLEMENT'
                }</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-box">
            <div class="policy-text">
              <strong>Condition Of Issue &amp; Policy Acknowledgment:</strong><br/>
              ${typeDef.policyTerms.map((t) => `• ${t}<br/>`).join('')}
            </div>

            <div class="sig-grid">
              <!-- Left Box: Resident / POC -->
              <div class="sig-card">
                <div class="sig-card-head">
                  <span>1. RESIDENT / CLIENT ACKNOWLEDGMENT</span>
                  <span style="font-size: 9px; color: #64748b;">HANDOVER SIGN</span>
                </div>
                <div style="font-size: 10.5px;">
                  <div><strong>Client / POC:</strong> ${pocName || customerName}</div>
                  <div><strong>Mobile:</strong> ${phoneNumber}</div>
                </div>
                <div class="sig-line-box">
                  <span><strong>Signature:</strong> ___________________________</span>
                  <span>Date: ${pocDate || date}</span>
                </div>
              </div>

              <!-- Right Box: Facilities Dept -->
              <div class="sig-card">
                <div class="sig-card-head">
                  <span>2. FACILITIES DEPT. APPROVAL &amp; STAMP</span>
                  <span style="font-size: 9px; color: #64748b;">CAMP SEAL</span>
                </div>
                <div style="font-size: 10.5px;">
                  <div><strong>Issued By:</strong> ${issuedByName || 'Majid'}</div>
                  <div><strong>Role:</strong> Facilities / Camp Operations</div>
                </div>
                <div class="sig-line-box">
                  <span><strong>Auth Sign &amp; Stamp:</strong> _____________________</span>
                  <span>Date: ${issuedDate || date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="doc-footer">
          <span>Tamimi Global Company (TAFGA) • Camp Facilities Billing Management</span>
          <span>Form Ref: ${typeDef.formRefCode}</span>
          <span>Printed on ${date}</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {initialInvoice ? 'Edit' : 'Create'} {typeDef.title}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {typeDef.formRefCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{typeDef.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Tab Toggles */}
              <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setModalTab('EDIT')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    modalTab === 'EDIT'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Editor &amp; Items
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('PRINT_PREVIEW')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    modalTab === 'PRINT_PREVIEW'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  A4 Print Preview
                </button>
                {currentType === 'MISSING_ITEMS' && (
                  <button
                    type="button"
                    onClick={() => setModalTab('SPLIT_CALC')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      modalTab === 'SPLIT_CALC'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    BMS Split Guide
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
            {modalTab === 'PRINT_PREVIEW' ? (
              <div className="bg-slate-200/80 p-4 rounded-xl border border-slate-300 shadow-inner flex justify-center">
                <div className="bg-white shadow-2xl rounded-sm w-full max-w-[210mm]">
                  <UniversalPrintLayout invoice={currentRecord} />
                </div>
              </div>
            ) : modalTab === 'SPLIT_CALC' ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <Divide className="w-4 h-4 text-amber-600" />
                    Standard BMS Shared Cost Divisions (Tamimi Camp Policy)
                  </h3>
                  <p className="text-xs text-slate-600 mb-4">
                    When room electronics are shared across multiple roommates, use these approved rounded rates:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SPLIT_REFERENCE_TABLES.map((table, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm"
                      >
                        <div className="bg-slate-900 text-white px-3 py-2 text-xs font-bold flex justify-between">
                          <span>{table.title}</span>
                          <span className="font-mono text-amber-400">{table.cost.toFixed(2)} SAR</span>
                        </div>
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                            <tr>
                              <th className="p-2 text-center">Persons</th>
                              <th className="p-2">Formula</th>
                              <th className="p-2 text-right">Per Person</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {table.divisions.map((d, i) => (
                              <tr key={i} className="hover:bg-amber-50/60 font-mono text-xs">
                                <td className="p-2 text-center font-bold text-slate-900">{d.persons}</td>
                                <td className="p-2 text-slate-600">{d.formula}</td>
                                <td className="p-2 text-right font-black text-emerald-800">
                                  {d.costPerPerson} SAR
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchedItemIdx = items.findIndex(
                                        (it) =>
                                          (table.title.includes('Charger Cable') && it.name.includes('Power Cable')) ||
                                          (table.title.includes('Charger') && !table.title.includes('Cable') && it.name === 'BMS Charger') ||
                                          (table.title.includes('Controller') && it.name.includes('Controller'))
                                      );
                                      if (matchedItemIdx >= 0) {
                                        handleItemChange(matchedItemIdx, 'quantity', 1);
                                        handleItemChange(matchedItemIdx, 'splitPersonCount', d.persons);
                                        setModalTab('EDIT');
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-sans font-bold shadow-xs transition-colors"
                                    title={`Apply ${d.costPerPerson} SAR to this invoice`}
                                  >
                                    Apply
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* EDITOR TAB */
              <div className="space-y-6">
                {/* Client / Resident Header Inputs */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-700" />
                      Client &amp; Resident Information
                    </h3>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-500 font-mono">Invoice Number:</span>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs w-52 pr-7 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setInvoiceNumber(generateDailyUniqueInvoiceNumber(currentType, date, existingInvoicesRef.current))}
                          title="Generate fresh unique daily sequence"
                          className="absolute right-1.5 p-0.5 text-slate-400 hover:text-amber-600 rounded transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Customer / Employee Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Suresh Meghewal"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Employee ID / Badge #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. EMP-7729"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Room / Reference #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. C7-104"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Date of Issue
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setDate(newDate);
                          if (!initialInvoice) {
                            setInvoiceNumber(generateDailyUniqueInvoiceNumber(currentType, newDate, existingInvoicesRef.current));
                          }
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Company</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Facilities / Camp</label>
                      <input
                        type="text"
                        value={facilities}
                        onChange={(e) => setFacilities(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">POC Name</label>
                      <input
                        type="text"
                        value={pocName}
                        onChange={(e) => setPocName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Mobile Phone</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Status & Classification Checkbox row */}
                  <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1.5">Employment Status:</span>
                      <div className="flex flex-wrap gap-2">
                        {(['PERMANENT', 'TEMPORARY', 'CONTACT', 'CONTRACTOR'] as EmployeeStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setEmployeeStatus(st)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                              employeeStatus === st
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-1.5">Classification:</span>
                      <div className="flex flex-wrap gap-2">
                        {(['ADMINISTRATOR', 'STAFF', 'FACULTY', 'CONTRACTOR'] as EmployeeClassification[]).map((cl) => (
                          <button
                            key={cl}
                            type="button"
                            onClick={() => setClassification(cl)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                              classification === cl
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {cl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Items Catalog Table */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-700" />
                        Invoice Line Items ({items.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Adjust quantities, rates, or click <strong>⚡ Multi-Room Breakdown</strong> on any item to calculate 5-room split formulas.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsBatchWizardOpen(true)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm shadow-amber-600/20"
                        title="Configure 5-Room multi-occupancy split across BMS items at once"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>⚡ 5-Room Batch Wizard</span>
                      </button>

                      <span className="text-xs font-mono font-bold text-emerald-800 px-2.5 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        Subtotal: {subtotal.toFixed(2)} SAR
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 w-8">#</th>
                          <th className="p-2">Item Description</th>
                          <th className="p-2 w-28 text-center">Qty</th>
                          <th className="p-2 w-28 text-right">Unit Rate</th>
                          <th className="p-2 w-44 text-center">Room Split / Multi-Room</th>
                          <th className="p-2 w-28 text-right">Total (SAR)</th>
                          <th className="p-2 min-w-[200px]">Remarks / Assessment</th>
                          <th className="p-2 w-10 text-center">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => {
                          const isHighlighted = item.quantity > 0 || (item.amount && item.amount > 0);
                          const hasMultiLineRemarks = item.remarks && item.remarks.includes('\n');
                          return (
                            <tr
                              key={item.id || idx}
                              className={`transition-colors ${
                                isHighlighted ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="p-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="p-2 font-medium text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                  {hasMultiLineRemarks && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9.5px] font-mono font-bold">
                                      Multi-Tier
                                    </span>
                                  )}
                                </div>
                                {item.category && (
                                  <span className="text-[10px] font-normal text-slate-400">
                                    {item.category}
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(idx, 'quantity', Math.max(0, item.quantity - 1))}
                                    className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 font-bold flex items-center justify-center text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.quantity || 0}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                    className="w-12 text-center py-1 border border-slate-300 rounded font-mono font-bold text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(idx, 'quantity', (item.quantity || 0) + 1)}
                                    className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 font-bold flex items-center justify-center text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                  className="w-20 text-right py-1 px-1.5 border border-slate-300 rounded font-mono text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <select
                                    value={item.splitPersonCount || 1}
                                    onChange={(e) =>
                                      handleItemChange(idx, 'splitPersonCount', Number(e.target.value))
                                    }
                                    className="px-1 py-1 text-[11px] border border-slate-300 rounded bg-white font-mono w-24"
                                    title="Divide unit cost equally among room occupants"
                                  >
                                    <option value="1">1 Person</option>
                                    <option value="2">2 Persons (/2)</option>
                                    <option value="3">3 Persons (/3)</option>
                                    <option value="4">4 Persons (/4)</option>
                                    <option value="5">5 Persons (/5)</option>
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => setBreakdownItemIdx(idx)}
                                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-bold text-[10.5px] whitespace-nowrap transition-colors flex items-center gap-0.5 shadow-2xs"
                                    title="Open Multi-Room & Occupancy breakdown calculator for this item"
                                  >
                                    <Divide className="w-3 h-3 text-amber-700" />
                                    <span>⚡ Multi-Room</span>
                                  </button>
                                </div>
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">
                                {item.amount.toFixed(2)}
                              </td>
                              <td className="p-2">
                                {hasMultiLineRemarks ? (
                                  <div className="space-y-1">
                                    <div className="bg-amber-50 border border-amber-200 rounded p-1.5 font-mono text-[10px] text-slate-800 whitespace-pre-line leading-tight">
                                      {item.remarks}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setBreakdownItemIdx(idx)}
                                      className="text-[10px] text-amber-800 font-bold hover:underline"
                                    >
                                      Edit Breakdown ↗
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="e.g. Shared across 3 room occupants"
                                    value={item.remarks || ''}
                                    onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]"
                                  />
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(idx)}
                                  className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Custom Item Line */}
                  <div className="pt-3 border-t flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Extra Item:
                    </span>
                    <input
                      type="text"
                      placeholder="Item name (e.g. Wall Paint repair)"
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg flex-1 min-w-[180px] text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Rate (SAR)"
                      value={newCustomPrice}
                      onChange={(e) => setNewCustomPrice(Number(e.target.value))}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg w-24 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-xs"
                    >
                      + Add to Invoice
                    </button>
                  </div>
                </div>

                {/* Financial Summary & Settlement Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Financials & Tax */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-slate-700" />
                      Financial &amp; Tax Calculation
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Subtotal Amount:</span>
                        <span className="font-mono font-bold text-slate-900">{subtotal.toFixed(2)} SAR</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Saudi VAT Rate:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setVatRate(0)}
                            className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                              vatRate === 0
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            0% Exempt
                          </button>
                          <button
                            type="button"
                            onClick={() => setVatRate(15)}
                            className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                              vatRate === 15
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            15% Standard VAT
                          </button>
                        </div>
                      </div>

                      {vatRate > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">VAT (15%) Amount:</span>
                          <span className="font-mono font-bold text-amber-800">{vatAmount.toFixed(2)} SAR</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 text-sm font-black border-t-2 border-slate-900">
                        <span className="uppercase text-slate-900 tracking-wide">Grand Total Payable:</span>
                        <span className="font-mono text-lg text-emerald-700">{grandTotal.toFixed(2)} SAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment & Approvals */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-700" />
                      Settlement &amp; Approval Status
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-xs bg-white text-slate-900"
                        >
                          <option value="PAID">PAID AT DESK</option>
                          <option value="DEDUCT_FROM_SALARY">DEDUCT FROM SALARY</option>
                          <option value="PENDING">PENDING SETTLEMENT</option>
                          <option value="OVERDUE">OVERDUE BILL</option>
                          <option value="WAIVED">WAIVED / COMPLIMENTARY</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        >
                          <option value="CASH">Cash Counter</option>
                          <option value="CARD_POS">Mada / POS Terminal</option>
                          <option value="STC_PAY">STC Pay / Digital Wallet</option>
                          <option value="PAYROLL_DEDUCTION">Payroll Deduction</option>
                          <option value="BANK_TRANSFER">Corporate Wire Transfer</option>
                          <option value="CREDIT_ACCOUNT">Company Credit 30D</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Issued By Authority</label>
                        <input
                          type="text"
                          value={issuedByName}
                          onChange={(e) => setIssuedByName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">POC / Resident Date</label>
                        <input
                          type="date"
                          value={pocDate}
                          onChange={(e) => setPocDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={conditionAcknowledged}
                          onChange={(e) => setConditionAcknowledged(e.target.checked)}
                          className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900"
                        />
                        <span>Official terms &amp; conditions acknowledged by resident/POC</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl flex items-center space-x-2 transition-colors text-xs border border-slate-300 shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print A4 Official Form</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 hover:from-amber-700 hover:to-black text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center space-x-2 transition-all text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Issue Invoice</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- Multi-Room Breakdown Modal Dialog for Individual Line Item --- */}
        {breakdownItemIdx !== null && activeBreakdownItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Dialog Header */}
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Divide className="w-4 h-4 text-amber-400" />
                    Multi-Room Occupancy Split Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Item: <span className="text-white font-semibold">{activeBreakdownItem.name}</span> | Unit Rate: <span className="text-amber-400 font-mono font-bold">{activeBreakdownItem.unitPrice.toFixed(2)} SAR</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBreakdownItemIdx(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dialog Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs bg-slate-50">
                {/* Presets Bar */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="font-bold text-slate-700 block">⚡ Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownTiers([
                          { id: '1', persons: 1, rooms: 2 },
                          { id: '2', persons: 5, rooms: 1 },
                          { id: '3', persons: 2, rooms: 3 },
                          { id: '4', persons: 3, rooms: 3 },
                          { id: '5', persons: 4, rooms: 3 },
                        ])
                      }
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg border border-amber-300 transition-colors"
                    >
                      ⭐ 5-Room Standard Matrix (2x1p, 1x5p, 3x2p, 3x3p, 3x4p)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownTiers([
                          { id: '1', persons: 2, rooms: 1 },
                        ])
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg border border-slate-300 transition-colors"
                    >
                      2 Persons (/2)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownTiers([
                          { id: '1', persons: 3, rooms: 1 },
                        ])
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg border border-slate-300 transition-colors"
                    >
                      3 Persons (/3)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownTiers([
                          { id: '1', persons: 4, rooms: 1 },
                        ])
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg border border-slate-300 transition-colors"
                    >
                      4 Persons (/4)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownTiers([
                          { id: '1', persons: 5, rooms: 1 },
                        ])
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg border border-slate-300 transition-colors"
                    >
                      5 Persons (/5)
                    </button>
                  </div>
                </div>

                {/* Tiers Configuration Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2 w-8">#</th>
                        <th className="p-2 w-32">Persons/Room</th>
                        <th className="p-2 w-28 text-center">Unit Split</th>
                        <th className="p-2 w-28 text-center">Rooms (Qty)</th>
                        <th className="p-2">Formula Expression</th>
                        <th className="p-2 w-24 text-right">Amount (SAR)</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdownTiers.map((tier, tIdx) => {
                        const persons = Math.max(1, Number(tier.persons) || 1);
                        const rooms = Math.max(0, Number(tier.rooms) || 0);
                        const splitPerPerson = Math.round(activeBreakdownItem.unitPrice / persons);
                        const tierTotal = splitPerPerson * rooms;
                        const formula = `${activeBreakdownItem.unitPrice.toFixed(2)}/${persons}=${splitPerPerson}*${rooms}=${tierTotal}`;

                        return (
                          <tr key={tier.id || tIdx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400 font-mono">{tIdx + 1}</td>
                            <td className="p-2">
                              <select
                                value={tier.persons}
                                onChange={(e) => {
                                  const updated = [...breakdownTiers];
                                  updated[tIdx].persons = Number(e.target.value);
                                  setBreakdownTiers(updated);
                                }}
                                className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-white"
                              >
                                <option value="1">1 Person (100%)</option>
                                <option value="2">2 Persons (/2)</option>
                                <option value="3">3 Persons (/3)</option>
                                <option value="4">4 Persons (/4)</option>
                                <option value="5">5 Persons (/5)</option>
                                <option value="6">6 Persons (/6)</option>
                              </select>
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-slate-700">
                              {splitPerPerson.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={tier.rooms}
                                onChange={(e) => {
                                  const updated = [...breakdownTiers];
                                  updated[tIdx].rooms = Math.max(0, Number(e.target.value) || 0);
                                  setBreakdownTiers(updated);
                                }}
                                className="w-16 text-center py-1 border border-slate-300 rounded font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="p-2 font-mono text-[10px] text-slate-600 bg-slate-50/50">
                              {formula}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {tierTotal.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              {breakdownTiers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBreakdownTiers(breakdownTiers.filter((_, i) => i !== tIdx))
                                  }
                                  className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex justify-start">
                    <button
                      type="button"
                      onClick={() =>
                        setBreakdownTiers([
                          ...breakdownTiers,
                          { id: `t-${Date.now()}`, persons: 2, rooms: 1 },
                        ])
                      }
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-300 rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Room Tier Group</span>
                    </button>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                {(() => {
                  const calc = calculateTierBreakdown(activeBreakdownItem.unitPrice, breakdownTiers);
                  return (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200/80 pb-2">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <Calculator className="w-4 h-4 text-amber-700" />
                          Generated Multi-Room Calculation Results:
                        </span>
                        <div className="flex items-center space-x-3 font-mono">
                          <span className="text-amber-900">
                            Total Quantity: <strong>{calc.totalUnits} Units</strong>
                          </span>
                          <span className="text-emerald-900 font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-xs">
                            Total Amount: {calc.totalAmount.toFixed(2)} SAR
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-amber-900 block mb-1">
                          Generated Invoice Remarks Formula:
                        </span>
                        <pre className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre">
                          {calc.remarksText || 'No tiers configured'}
                        </pre>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Dialog Footer */}
              <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setBreakdownItemIdx(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBreakdownToActiveItem}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Apply Breakdown to Line Item</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- 5-Room Batch Wizard Modal --- */}
        {isBatchWizardOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    ⚡ 5-Room Batch Matrix Generator
                  </h3>
                  <p className="text-xs text-slate-400">
                    Apply Alec Fitout 5-room multi-occupancy split to BMS items in one click
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchWizardOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs bg-slate-50">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Applied Room Occupancy Matrix:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>2 Rooms:</strong> 1 Person (/1)
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>1 Room:</strong> 5 Persons (/5)
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>3 Rooms:</strong> 2 Persons (/2)
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>3 Rooms:</strong> 3 Persons (/3)
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>3 Rooms:</strong> 4 Persons (/4)
                    </div>
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 font-bold text-amber-900">
                      Total: 12 Units per item
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Target Items to Auto-Populate:</span>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">Bms Charger</span>
                        <span className="block text-[10px] text-slate-500 font-mono">188.03 SAR Base Rate</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Qty 12 | 1,026.00 SAR
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">Bms Adapter Power Cable</span>
                        <span className="block text-[10px] text-slate-500 font-mono">112.82 SAR Base Rate</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Qty 12 | 615.00 SAR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between font-mono">
                  <span className="font-bold text-emerald-950">Combined Invoice Subtotal:</span>
                  <span className="text-base font-bold text-emerald-700">1,641.00 SAR</span>
                </div>
              </div>

              <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsBatchWizardOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatchWizard}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✓ Apply 5-Room Matrix to Invoice</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

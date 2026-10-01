import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Save,
  Plus,
  Trash2,
  Receipt,
  Calculator,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  User,
  Building2,
  Phone,
  Divide,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  MissingItemsInvoiceRecord,
  MissingItemRow,
  EmployeeStatus,
  EmployeeClassification,
} from '../../types/invoice';
import {
  STANDARD_MISSING_ITEMS,
} from '../../data/defaultMissingItems';
import { TAMIMI_LOGO_DATA_URL } from '../TamimiLogo';
import { MissingItemsPrintLayout } from './MissingItemsPrintLayout';

interface MissingItemsInvoiceModalProps {
  initialInvoice?: MissingItemsInvoiceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: MissingItemsInvoiceRecord) => void;
}

export const MissingItemsInvoiceModal: React.FC<MissingItemsInvoiceModalProps> = ({
  initialInvoice,
  isOpen,
  onClose,
  onSave,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber ||
      `INV-MI-${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(
        new Date().getDate()
      ).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [date, setDate] = useState(
    initialInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [roomNumber, setRoomNumber] = useState(initialInvoice?.roomNumber || 'C7-104');
  const [employeeName, setEmployeeName] = useState(
    initialInvoice?.employeeName || 'Suresh Meghewal'
  );
  const [employeeId, setEmployeeId] = useState(initialInvoice?.employeeId || '');
  const [company, setCompany] = useState(initialInvoice?.company || 'Al-Ayuni');
  const [facilities, setFacilities] = useState(initialInvoice?.facilities || 'TBCV');
  const [pocName, setPocName] = useState(initialInvoice?.pocName || 'Naveeth');
  const [mobile, setMobile] = useState(initialInvoice?.mobile || '0536148530');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>(
    initialInvoice?.employeeStatus || 'CONTRACTOR'
  );
  const [classification, setClassification] = useState<EmployeeClassification>(
    initialInvoice?.classification || 'CONTRACTOR'
  );

  const [items, setItems] = useState<MissingItemRow[]>(() => {
    if (initialInvoice?.items && initialInvoice.items.length > 0) {
      return initialInvoice.items;
    }
    return STANDARD_MISSING_ITEMS.map((st, idx) => ({
      id: `mi-${idx}`,
      name: st.name,
      quantity: 0,
      unitPrice: st.unitPrice,
      amount: 0,
      remarks: '',
    }));
  });

  const [conditionAcknowledged, setConditionAcknowledged] = useState(
    initialInvoice?.conditionAcknowledged ?? true
  );
  const [issuedByName, setIssuedByName] = useState(initialInvoice?.issuedByName || 'Majid');
  const [issuedDate, setIssuedDate] = useState(
    initialInvoice?.issuedDate || new Date().toISOString().split('T')[0]
  );
  const [pocDate, setPocDate] = useState(
    initialInvoice?.pocDate || new Date().toISOString().split('T')[0]
  );
  const [paymentStatus, setPaymentStatus] = useState<MissingItemsInvoiceRecord['paymentStatus']>(
    initialInvoice?.paymentStatus || 'PAID'
  );
  const [paymentMethod, setPaymentMethod] = useState<MissingItemsInvoiceRecord['paymentMethod']>(
    initialInvoice?.paymentMethod || 'CASH'
  );
  const [notes, setNotes] = useState(initialInvoice?.notes || '');

  const [viewMode, setViewMode] = useState<'EDIT' | 'PRINT_PREVIEW'>('EDIT');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(50);

  // Auto calculate total
  const totalAmount = items.reduce((sum, it) => sum + (it.amount || 0), 0);

  // Update item fields
  const handleItemChange = (
    index: number,
    field: keyof MissingItemRow,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : current.quantity;
        const price = field === 'unitPrice' ? Number(value) : current.unitPrice;
        if (!current.splitPersonCount || current.splitPersonCount <= 1) {
          current.amount = Math.round(qty * price * 100) / 100;
        } else {
          const splitPrice = Math.round(price / current.splitPersonCount);
          current.amount = Math.round(qty * splitPrice * 100) / 100;
          current.remarks = `${price.toFixed(2)}/${current.splitPersonCount}=${splitPrice}*${qty}=${current.amount}`;
        }
      }

      updated[index] = current;
      return updated;
    });
  };

  // Apply split division for shared room items
  const handleApplySplit = (index: number, personCount: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };
      current.splitPersonCount = personCount;
      const qty = current.quantity > 0 ? current.quantity : 1;
      current.quantity = qty;

      if (personCount <= 1) {
        current.amount = Math.round(qty * current.unitPrice * 100) / 100;
        current.remarks = '';
      } else {
        const costPerPerson = Math.round(current.unitPrice / personCount);
        current.amount = Math.round(qty * costPerPerson * 100) / 100;
        current.remarks = `${current.unitPrice.toFixed(2)}/${personCount}=${costPerPerson}*${qty}=${current.amount}`;
      }

      updated[index] = current;
      return updated;
    });
  };

  // Add custom missing item to table
  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    const newItem: MissingItemRow = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      quantity: 1,
      unitPrice: customItemPrice,
      amount: customItemPrice,
      remarks: '',
    };
    setItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice(50);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save invoice
  const handleSaveInvoice = () => {
    const record: MissingItemsInvoiceRecord = {
      id: initialInvoice?.id || `inv-mi-${Date.now()}`,
      invoiceNumber,
      date,
      roomNumber,
      employeeName,
      employeeId,
      company,
      facilities,
      pocName,
      mobile,
      employeeStatus,
      classification,
      items,
      totalAmount,
      conditionAcknowledged,
      issuedByName,
      issuedDate,
      pocDate,
      paymentStatus,
      paymentMethod,
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      notes,
    };

    onSave(record);
    confetti({ particleCount: 50, spread: 60 });
    onClose();
  };

  // Trigger A4 Print
  const handleTriggerPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Charges for Missing Items Form - ${invoiceNumber}</title>
        <style>
          @page { 
            size: A4 portrait; 
            margin: 8mm 10mm 8mm 10mm; 
          }
          * { box-sizing: border-box; }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background: #fff;
          }
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
          .header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            border-bottom: 2px solid #0f172a; 
            padding-bottom: 7px; 
            margin-bottom: 7px; 
          }
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
          
          .company-info { 
            border: 1px solid #0f172a; 
            padding: 7px 10px; 
            margin-bottom: 7px; 
            background: #f8fafc; 
            font-size: 11.5px; 
          }
          .emp-head { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            border-bottom: 1px solid #cbd5e1; 
            padding-bottom: 4px; 
            margin-bottom: 5px; 
            font-size: 12px;
          }
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
            html, body {
              height: 100% !important;
              overflow: hidden !important;
            }
            .header, .company-info, table, tr, td, th, .footer-box {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
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
              <div class="subtitle">Charges for Missing Items Form</div>
              <div class="sub-sub">Tamimi Global Company (TAFGA) • ${facilities || 'TBCV'} Facilities</div>
            </div>
            
            <div class="badge-box">
              <div class="inv-pill">INVOICE # ${invoiceNumber.replace('INV-MI-', '') || date}</div>
              <div style="margin-top: 3px; font-weight: bold; color: #334155;">CAMP: ${facilities || 'TBCV'}</div>
              <div style="color: #64748b; font-size: 8.5px;">Date: ${date}</div>
            </div>
          </div>

          <div class="company-info">
            <div class="emp-head">
              <div><strong>Employee Information:</strong> <u style="font-weight: 900;">${roomNumber} ${employeeName}</u> ${employeeId ? `(${employeeId})` : ''}</div>
              <div><strong>Room Ref:</strong> <span style="font-family: monospace; font-weight: 900; background: #fff; padding: 1px 4px; border: 1px solid #94a3b8;">${roomNumber}</span></div>
            </div>
            
            <div class="grid-2">
              <div><strong>Company :</strong> ${company || 'Al-Ayuni'}</div>
              <div><strong>Facilities :</strong> ${facilities || 'TBCV'}</div>
              <div><strong>POC Name :</strong> ${pocName || 'Naveeth'}</div>
              <div><strong>Mobile :</strong> <span style="font-family: monospace;">${mobile || '0536148530'}</span></div>
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
                <th style="text-align: left; width: 42%;">Missing Items</th>
                <th style="width: 50px;" class="center">Quantity</th>
                <th style="width: 85px;" class="right">Charges Amount</th>
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
                  <td style="font-size: 8.5px; color: #334155;">${it.remarks || ''}</td>
                </tr>
              `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="3" class="right" style="text-transform: uppercase;">Total Amount SAR</td>
                <td class="right" style="font-family: monospace; font-size: 11.5px; color: #020617;">${totalAmount.toFixed(2)}</td>
                <td style="font-weight: 900;">${
                  paymentStatus === 'PAID'
                    ? '★ PAID AT DESK'
                    : paymentStatus === 'DEDUCT_FROM_SALARY'
                    ? '★ DEDUCT FROM SALARY'
                    : '★ PENDING SETTLEMENT'
                }</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-box">
            <div class="policy-text">
              <strong>Condition Of Issue &amp; Policy Acknowledgment:</strong><br/>
              • I am accepting the above charges and acknowledge that all items were verified before room checkout clearance.<br/>
              • All items must be surrendered and complete before proceeding for clearance. All missing items are charged as per Tamimi Global Company Policies.
            </div>

            <div class="sig-grid">
              <!-- Left Box: Resident / POC -->
              <div class="sig-card">
                <div class="sig-card-head">
                  <span>1. RESIDENT / POC ACKNOWLEDGMENT</span>
                  <span style="font-size: 8px; color: #64748b;">HANDOVER SIGN</span>
                </div>
                <div style="font-size: 9.5px;">
                  <div><strong>POC Name:</strong> ${pocName || 'Naveeth'}</div>
                  <div><strong>Mobile:</strong> ${mobile || '0536148530'}</div>
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
                  <span style="font-size: 8px; color: #64748b;">CAMP SEAL</span>
                </div>
                <div style="font-size: 9.5px;">
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
          <span>Form Ref: TAFGA-FMD-MI-2026</span>
          <span>Printed on ${new Date().toISOString().split('T')[0]}</span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  if (!isOpen) return null;

  const currentInvoiceData: MissingItemsInvoiceRecord = {
    id: initialInvoice?.id || 'temp',
    invoiceNumber,
    date,
    roomNumber,
    employeeName,
    employeeId,
    company,
    facilities,
    pocName,
    mobile,
    employeeStatus,
    classification,
    items,
    totalAmount,
    conditionAcknowledged,
    issuedByName,
    issuedDate,
    pocDate,
    paymentStatus,
    paymentMethod,
    createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    notes,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {initialInvoice ? 'Edit Missing Items Invoice' : 'New Missing Items Invoice'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                  Facilities Department
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Official Tamimi Global Charges for Missing Items Form &amp; Multi-Person Cost Split Calculator
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setViewMode('EDIT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                  viewMode === 'EDIT'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Form Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('PRINT_PREVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                  viewMode === 'PRINT_PREVIEW'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>A4 Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {viewMode === 'EDIT' ? (
            <>
              {/* Section 1: Employee & Resident Information */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Employee / Resident Information</span>
                  </span>
                  <div className="text-[11px] font-mono font-bold text-slate-500">
                    Doc Ref: {invoiceNumber}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. C7-104"
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Employee Full Name
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="e.g. Suresh Meghewal"
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Al-Ayuni"
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Facilities / Camp
                    </label>
                    <input
                      type="text"
                      value={facilities}
                      onChange={(e) => setFacilities(e.target.value)}
                      placeholder="e.g. TBCV"
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      POC Name
                    </label>
                    <input
                      type="text"
                      value={pocName}
                      onChange={(e) => setPocName(e.target.value)}
                      placeholder="e.g. Naveeth"
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Employee Status
                    </label>
                    <select
                      value={employeeStatus}
                      onChange={(e) => setEmployeeStatus(e.target.value as EmployeeStatus)}
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="PERMANENT">Permanent</option>
                      <option value="TEMPORARY">Temporary</option>
                      <option value="CONTACT">Contact</option>
                      <option value="CONTRACTOR">Contractor</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Classification
                    </label>
                    <select
                      value={classification}
                      onChange={(e) =>
                        setClassification(e.target.value as EmployeeClassification)
                      }
                      className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="STAFF">Staff</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="CONTRACTOR">Contractor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Missing Items Table with Quick Counters & Split Helper */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Missing Items Charges Table
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enter quantity for missing or damaged items. Use the split buttons for shared room equipment (BMS Charger, Cable, AC Controller).
                    </p>
                  </div>

                  {/* Summary Total Highlight Badge */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl px-4 py-2 flex items-center space-x-3 shrink-0">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                        Total Payable SAR
                      </div>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                        {totalAmount.toFixed(2)} SAR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[160px]">Missing Item Name</th>
                          <th className="py-2.5 px-3 w-28 text-center">Quantity</th>
                          <th className="py-2.5 px-3 w-28 text-right">Unit Rate (SAR)</th>
                          <th className="py-2.5 px-3 w-32 text-center">Split Division</th>
                          <th className="py-2.5 px-3 w-28 text-right">Amount (SAR)</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Remarks / Note</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item, index) => {
                          const hasQty = item.quantity > 0 || (item.amount && item.amount > 0);
                          return (
                            <tr
                              key={item.id || index}
                              className={`transition ${
                                hasQty
                                  ? 'bg-blue-50/70 dark:bg-blue-950/30'
                                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-850/40'
                              }`}
                            >
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {index + 1}
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleItemChange(index, 'name', e.target.value)
                                  }
                                  className="w-full font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none focus:bg-white dark:focus:bg-slate-800 rounded px-1.5 py-0.5"
                                />
                              </td>

                              <td className="py-2 px-3 text-center">
                                <div className="inline-flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleItemChange(
                                        index,
                                        'quantity',
                                        Math.max(0, (item.quantity || 0) - 1)
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        'quantity',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-12 text-center font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-0.5 text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleItemChange(
                                        index,
                                        'quantity',
                                        (item.quantity || 0) + 1
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      'unitPrice',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-20 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 bg-transparent focus:bg-white dark:focus:bg-slate-800 rounded px-1 py-0.5 border border-transparent focus:border-slate-300"
                                />
                              </td>

                              {/* Multi-person split helper buttons */}
                              <td className="py-2 px-3 text-center">
                                <div className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleApplySplit(index, 1)}
                                    title="1 Person Full Cost"
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      !item.splitPersonCount || item.splitPersonCount === 1
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    1/1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplySplit(index, 2)}
                                    title="Split among 2 persons"
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      item.splitPersonCount === 2
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    1/2
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplySplit(index, 3)}
                                    title="Split among 3 persons"
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      item.splitPersonCount === 3
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    1/3
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplySplit(index, 4)}
                                    title="Split among 4 persons"
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      item.splitPersonCount === 4
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    1/4
                                  </button>
                                </div>
                              </td>

                              <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                                {item.amount.toFixed(2)}
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.remarks}
                                  onChange={(e) =>
                                    handleItemChange(index, 'remarks', e.target.value)
                                  }
                                  placeholder="e.g. 188.03/3=63*1=63"
                                  className="w-full text-xs font-medium text-slate-600 dark:text-slate-400 bg-transparent focus:bg-white dark:focus:bg-slate-800 rounded px-1.5 py-0.5"
                                />
                              </td>

                              <td className="py-2 px-2 text-center">
                                {index >= STANDARD_MISSING_ITEMS.length && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-slate-300 hover:text-red-500 transition"
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
                  </div>

                  {/* Add Custom Item Row bar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        placeholder="+ Add custom item (e.g. Wall Clock, Hair Dryer)"
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold flex-1 sm:w-64"
                      />
                      <input
                        type="number"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                        placeholder="SAR"
                        className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Total: <span className="font-mono font-black text-emerald-600">{totalAmount.toFixed(2)} SAR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Settlement & Signatures */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs">
                <div className="font-black text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                  Settlement, Authorization &amp; Signatures
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      <option value="PAID">Paid at Desk</option>
                      <option value="DEDUCT_FROM_SALARY">Deduct from Salary</option>
                      <option value="PENDING">Pending Settlement</option>
                      <option value="WAIVED">Waived / Free Exemption</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD_POS">Mada / Credit POS</option>
                      <option value="PAYROLL_DEDUCTION">Payroll / HR Deduction</option>
                      <option value="STC_PAY">STC Pay</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Issued By (Staff Name)</label>
                    <input
                      type="text"
                      value={issuedByName}
                      onChange={(e) => setIssuedByName(e.target.value)}
                      placeholder="e.g. Majid"
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Issue Date</label>
                    <input
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conditionAcknowledged}
                      onChange={(e) => setConditionAcknowledged(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                      I acknowledge that all missing items are charged as per Tamimi Global / Company Policies and will be signed at checkout.
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* Live A4 Print Preview */
            <div className="bg-slate-100 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <div className="bg-white rounded-xl shadow-lg border border-slate-300 mx-auto overflow-hidden">
                <MissingItemsPrintLayout invoice={currentInvoiceData} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Total Payable:{' '}
            <span className="text-emerald-600 font-mono font-black text-sm">
              {totalAmount.toFixed(2)} SAR
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveInvoice}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Issue Invoice</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

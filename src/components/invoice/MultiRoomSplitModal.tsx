import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Divide,
  Building2,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  Copy,
  Receipt,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UnifiedInvoiceRecord, InvoiceItemLine } from '../../types/invoice';
import { INVOICE_TYPE_DEFINITIONS, SPLIT_REFERENCE_TABLES } from '../../data/invoiceTemplates';
import { TAMIMI_LOGO_DATA_URL } from '../TamimiLogo';
import { formatDateCompact } from '../../utils/invoiceNumber';

export interface RoomEntry {
  id: string;
  roomNumber: string;
  occupantCount: number;
  residentName: string;
  employeeId: string;
  company: string;
  phoneNumber: string;
  paymentStatus: UnifiedInvoiceRecord['paymentStatus'];
}

interface MultiRoomSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreate: (invoices: UnifiedInvoiceRecord[]) => void;
}

export const MultiRoomSplitModal: React.FC<MultiRoomSplitModalProps> = ({
  isOpen,
  onClose,
  onBatchCreate,
}) => {
  // Shared Camp Metadata
  const [facilities, setFacilities] = useState('TBCV');
  const [issuedByName, setIssuedByName] = useState('Majid');
  const [pocName, setPocName] = useState('Naveeth');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [useExactDecimals, setUseExactDecimals] = useState(true); // true = 47.01 SAR, false = 47 SAR

  // Selected Shared Missing Items (Defaulting to the user's specific items: BMS Charger & BMS Adapter Cable)
  const [selectedItems, setSelectedItems] = useState<{ name: string; unitPrice: number; category: string; checked: boolean }[]>([
    { name: 'BMS Charger', unitPrice: 188.03, category: 'BMS Electronics', checked: true },
    { name: 'BMS Adapter Power Cable', unitPrice: 112.82, category: 'BMS Electronics', checked: true },
    { name: 'BMS AC Controller', unitPrice: 1341.25, category: 'BMS Electronics', checked: false },
    { name: 'Room Key', unitPrice: 25.0, category: 'Access & Security', checked: false },
    { name: 'Blanket', unitPrice: 228.0, category: 'Linen', checked: false },
    { name: 'Bath Towel', unitPrice: 82.0, category: 'Linen', checked: false },
    { name: 'Bed Sheet', unitPrice: 115.0, category: 'Linen', checked: false },
    { name: 'Pillow', unitPrice: 86.25, category: 'Linen', checked: false },
  ]);

  // Dynamic Custom Item adder
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(100);

  // 5 Default Sample Rooms illustrating user's exact scenario (4 persons, 2 persons, 5 persons, 3 persons, 1 person)
  const [rooms, setRooms] = useState<RoomEntry[]>([
    {
      id: 'r-1',
      roomNumber: 'C7-101',
      occupantCount: 4,
      residentName: 'Suresh Meghewal (Room Rep)',
      employeeId: 'EMP-7721',
      company: 'Al-Ayuni',
      phoneNumber: '0536148530',
      paymentStatus: 'DEDUCT_FROM_SALARY',
    },
    {
      id: 'r-2',
      roomNumber: 'C7-102',
      occupantCount: 2,
      residentName: 'Mohammed Tariq',
      employeeId: 'EMP-8834',
      company: 'Al-Ayuni',
      phoneNumber: '0536148530',
      paymentStatus: 'DEDUCT_FROM_SALARY',
    },
    {
      id: 'r-3',
      roomNumber: 'C7-103',
      occupantCount: 5,
      residentName: 'Rajesh Kumar',
      employeeId: 'EMP-9912',
      company: 'Al-Ayuni',
      phoneNumber: '0536148530',
      paymentStatus: 'DEDUCT_FROM_SALARY',
    },
    {
      id: 'r-4',
      roomNumber: 'C7-104',
      occupantCount: 3,
      residentName: 'Ali Hassan',
      employeeId: 'EMP-4421',
      company: 'Tamimi Global',
      phoneNumber: '0551239876',
      paymentStatus: 'PAID',
    },
    {
      id: 'r-5',
      roomNumber: 'C7-105',
      occupantCount: 1,
      residentName: 'Vikram Singh',
      employeeId: 'EMP-1109',
      company: 'Al-Ayuni',
      phoneNumber: '0536148530',
      paymentStatus: 'PENDING',
    },
  ]);

  // Active items list
  const activeItems = useMemo(() => {
    return selectedItems.filter((i) => i.checked);
  }, [selectedItems]);

  // Total base cost of selected items (e.g. 188.03 + 112.82 = 300.85 SAR)
  const totalBaseCost = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.unitPrice, 0);
  }, [activeItems]);

  // Math Calculations for each room
  const roomCalculations = useMemo(() => {
    return rooms.map((room) => {
      const persons = Math.max(1, room.occupantCount || 1);
      
      const itemBreakdowns = activeItems.map((it) => {
        const rawSplit = it.unitPrice / persons;
        const perPersonCost = useExactDecimals ? Math.round(rawSplit * 100) / 100 : Math.round(rawSplit);
        const totalItemRoomCost = it.unitPrice; // full room replacement cost
        return {
          itemName: it.name,
          unitPrice: it.unitPrice,
          category: it.category,
          persons,
          perPersonCost,
          totalItemRoomCost,
          formula: `${it.unitPrice.toFixed(2)} / ${persons} = ${perPersonCost.toFixed(2)} SAR`,
        };
      });

      const totalPerPerson = itemBreakdowns.reduce((sum, it) => sum + it.perPersonCost, 0);
      const totalRoomCost = totalBaseCost;

      return {
        room,
        persons,
        itemBreakdowns,
        totalPerPerson: Math.round(totalPerPerson * 100) / 100,
        totalRoomCost: Math.round(totalRoomCost * 100) / 100,
      };
    });
  }, [rooms, activeItems, totalBaseCost, useExactDecimals]);

  // Grand totals across all rooms
  const aggregateStats = useMemo(() => {
    const totalRoomsCount = rooms.length;
    const totalOccupantsCount = rooms.reduce((sum, r) => sum + (r.occupantCount || 1), 0);
    const grandTotalLiability = totalBaseCost * totalRoomsCount;
    return {
      totalRoomsCount,
      totalOccupantsCount,
      grandTotalLiability,
    };
  }, [rooms, totalBaseCost]);

  // Room Row Handlers
  const handleAddRoom = () => {
    const nextIndex = rooms.length + 1;
    const newRoom: RoomEntry = {
      id: `r-${Date.now()}`,
      roomNumber: `C7-10${nextIndex}`,
      occupantCount: 4,
      residentName: `Room ${nextIndex} Representative`,
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      company: 'Al-Ayuni',
      phoneNumber: '0536148530',
      paymentStatus: 'DEDUCT_FROM_SALARY',
    };
    setRooms([...rooms, newRoom]);
  };

  const handleUpdateRoom = (id: string, field: keyof RoomEntry, value: any) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
  };

  const handleDeleteRoom = (id: string) => {
    if (rooms.length <= 1) return;
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], checked: !next[index].checked };
      return next;
    });
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        name: customItemName.trim(),
        unitPrice: customItemPrice,
        category: 'Custom Shared Item',
        checked: true,
      },
    ]);
    setCustomItemName('');
    setCustomItemPrice(100);
  };

  // Action 1: Batch Generate All Separate Invoices (1 invoice per room)
  const handleBatchGenerateInvoices = () => {
    const dateTag = formatDateCompact(issueDate);
    const generated: UnifiedInvoiceRecord[] = roomCalculations.map((calc, idx) => {
      const { room, persons, itemBreakdowns, totalPerPerson } = calc;
      const invNum = `INV-MI-${dateTag}-${String(idx + 1).padStart(3, '0')}`;

      const lineItems: InvoiceItemLine[] = itemBreakdowns.map((it, itemIdx) => ({
        id: `it-${Date.now()}-${itemIdx}`,
        name: it.itemName,
        category: it.category,
        quantity: 1,
        unitPrice: it.unitPrice,
        amount: it.perPersonCost,
        splitPersonCount: persons,
        remarks: `${it.unitPrice.toFixed(2)}/${persons} pers = ${it.perPersonCost.toFixed(2)} SAR (Room ${room.roomNumber})`,
      }));

      return {
        id: `inv-batch-${Date.now()}-${idx}`,
        invoiceType: 'MISSING_ITEMS',
        invoiceNumber: invNum,
        date: issueDate,
        roomNumber: room.roomNumber,
        customerName: room.residentName,
        employeeId: room.employeeId,
        company: room.company,
        facilities,
        pocName,
        phoneNumber: room.phoneNumber,
        employeeStatus: 'CONTRACTOR',
        classification: 'CONTRACTOR',
        items: lineItems,
        subtotal: totalPerPerson,
        vatRate: 0,
        vatAmount: 0,
        totalAmount: totalPerPerson,
        paymentStatus: room.paymentStatus,
        paymentMethod: room.paymentStatus === 'DEDUCT_FROM_SALARY' ? 'PAYROLL_DEDUCTION' : 'CASH',
        issuedByName,
        issuedDate: issueDate,
        pocDate: issueDate,
        conditionAcknowledged: true,
        notes: `Multi-Room Split for ${persons} occupants in Room ${room.roomNumber}. Full Room Base Liability: ${totalBaseCost.toFixed(2)} SAR.`,
        createdAt: new Date().toISOString(),
      };
    });

    onBatchCreate(generated);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  // Action 2: Direct Print Consolidated Multi-Room Statement
  const handlePrintConsolidatedStatement = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = roomCalculations
      .map((calc, idx) => {
        const { room, persons, itemBreakdowns, totalPerPerson, totalRoomCost } = calc;
        const itemsText = itemBreakdowns
          .map((it) => `• <strong>${it.itemName}</strong>: ${it.unitPrice.toFixed(2)} / ${persons} = <span style="color:#0f172a; font-weight:bold;">${it.perPersonCost.toFixed(2)} SAR</span>`)
          .join('<br/>');

        return `
          <tr style="border-bottom: 1px solid #cbd5e1; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="border: 1px solid #64748b; padding: 6px 8px; text-align: center; font-weight: 900; font-family: monospace; font-size: 12px; background: #f1f5f9;">
              ${room.roomNumber}
            </td>
            <td style="border: 1px solid #64748b; padding: 6px 8px;">
              <div style="font-weight: bold; color: #0f172a;">${room.residentName}</div>
              <div style="font-size: 9.5px; color: #475569;">${room.company} • ${room.employeeId || 'N/A'} • ${room.phoneNumber}</div>
            </td>
            <td style="border: 1px solid #64748b; padding: 6px 8px; text-align: center; font-weight: 900; font-family: monospace; font-size: 13px; color: #0369a1;">
              ${persons} Persons
            </td>
            <td style="border: 1px solid #64748b; padding: 6px 8px; font-size: 10.5px;">
              ${itemsText}
            </td>
            <td style="border: 1px solid #64748b; padding: 6px 8px; text-align: right; font-weight: 900; font-family: monospace; font-size: 12.5px; color: #15803d; background: #f0fdf4;">
              ${totalPerPerson.toFixed(2)} SAR
            </td>
            <td style="border: 1px solid #64748b; padding: 6px 8px; text-align: right; font-weight: 900; font-family: monospace; font-size: 12px; color: #334155;">
              ${totalRoomCost.toFixed(2)} SAR
            </td>
            <td style="border: 1px solid #64748b; padding: 6px 8px; text-align: center; font-weight: bold; font-size: 10px;">
              ${room.paymentStatus === 'DEDUCT_FROM_SALARY' ? 'SALARY DEDUCT' : room.paymentStatus}
            </td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multi-Room Missing Items Clearance Statement - ${facilities}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 10mm 10mm 10mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; 
            font-size: 11px; 
            color: #0f172a; 
            line-height: 1.35; 
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
          .logo-box { display: flex; align-items: center; gap: 10px; }
          .logo-img { height: 52px; width: auto; object-fit: contain; }
          .logo-text-title { font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; line-height: 1; }
          .logo-text-sub { font-size: 9.5px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-top: 2px; }
          .center-title { text-align: center; flex: 1; }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 12px; font-weight: 800; color: #1e293b; margin-top: 1px; }
          
          .summary-banner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #0f172a; padding: 8px 12px; margin-bottom: 10px; }
          .stat-box { text-align: center; }
          .stat-label { font-size: 9.5px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .stat-val { font-size: 14px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 2px; }
          
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; }
          th { border: 1px solid #1e293b; padding: 6px 8px; background: #0f172a; color: #fff; font-weight: 900; text-align: left; }
          
          .policy-box { border: 1px solid #0f172a; background: #f8fafc; padding: 8px 10px; font-size: 9.5px; margin-bottom: 10px; line-height: 1.4; }
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .sig-card { border: 1px solid #94a3b8; background: #fff; padding: 8px 10px; }
          .sig-head { font-weight: 900; font-size: 10.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; }
          .sig-line { margin-top: 24px; border-top: 1px dashed #475569; padding-top: 3px; display: flex; justify-content: space-between; font-size: 10px; }

          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <img src="${TAMIMI_LOGO_DATA_URL}" alt="Tamimi Global" class="logo-img" />
            <div>
              <div class="logo-text-title">TAMIMI GLOBAL</div>
              <div class="logo-text-sub">TAFGA • CAMP OPS</div>
            </div>
          </div>
          <div class="center-title">
            <div class="title">FACILITIES &amp; HOUSING DEPARTMENT</div>
            <div class="subtitle">Multi-Room Missing Items Clearance &amp; Split Statement</div>
            <div style="font-size: 10px; color: #64748b;">Camp: ${facilities} • Ref: TAFGA-MR-SPLIT-2026</div>
          </div>
          <div style="text-align: right; font-family: monospace; font-size: 10px;">
            <div style="background: #0f172a; color: #fff; padding: 3px 8px; font-weight: 900;">BATCH STATEMENT</div>
            <div style="margin-top: 3px; font-weight: bold;">Date: ${issueDate}</div>
          </div>
        </div>

        <div class="summary-banner">
          <div class="stat-box">
            <div class="stat-label">Total Rooms Inspected</div>
            <div class="stat-val">${aggregateStats.totalRoomsCount} Rooms</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Occupants (Split)</div>
            <div class="stat-val">${aggregateStats.totalOccupantsCount} Persons</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Base Missing Cost / Room</div>
            <div class="stat-val" style="color: #92400e;">${totalBaseCost.toFixed(2)} SAR</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Grand Total Liability</div>
            <div class="stat-val" style="color: #047857;">${aggregateStats.grandTotalLiability.toFixed(2)} SAR</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 70px; text-align: center;">Room #</th>
              <th style="width: 170px;">Occupant / Room Rep</th>
              <th style="width: 90px; text-align: center;">Occupants</th>
              <th>Missing Items &amp; Split Formula</th>
              <th style="width: 100px; text-align: right;">Per Person (SAR)</th>
              <th style="width: 95px; text-align: right;">Room Total (SAR)</th>
              <th style="width: 90px; text-align: center;">Settlement</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="policy-box">
          <strong>Official Tamimi Shared Facilities Billing Policy:</strong><br/>
          • The cost of shared electronics (such as BMS Chargers @ 188.03 SAR & BMS Adapter Power Cables @ 112.82 SAR) is divided equally among the registered room occupants at the time of checkout clearance inspection.<br/>
          • Room representatives and occupants acknowledge that payroll deduction or counter payment will be debited according to their respective split share.
        </div>

        <div class="sig-grid">
          <div class="sig-card">
            <div class="sig-head">1. COMPANY POC / CONTRACTOR ACKNOWLEDGMENT</div>
            <div style="font-size: 10.5px;">POC Name: <strong>${pocName}</strong> (Al-Ayuni / Subcontractor)</div>
            <div class="sig-line">
              <span>Signature: ___________________________</span>
              <span>Date: ${issueDate}</span>
            </div>
          </div>

          <div class="sig-card">
            <div class="sig-head">2. TAMIMI FACILITIES SUPERVISOR &amp; CAMP STAMP</div>
            <div style="font-size: 10.5px;">Issued By: <strong>${issuedByName}</strong> (Facilities Dept)</div>
            <div class="sig-line">
              <span>Auth Seal &amp; Sign: _____________________</span>
              <span>Date: ${issueDate}</span>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Action 3: Export Multi-Room CSV
  const handleExportCSV = () => {
    const headers = [
      'Room Number',
      'Occupant / Rep',
      'Employee ID',
      'Company',
      'Occupant Count',
      'Shared Items',
      'Charge Per Person (SAR)',
      'Total Room Cost (SAR)',
      'Payment Status',
    ];

    const rows = roomCalculations.map((calc) => [
      `"${calc.room.roomNumber}"`,
      `"${calc.room.residentName}"`,
      `"${calc.room.employeeId}"`,
      `"${calc.room.company}"`,
      calc.persons,
      `"${activeItems.map((i) => `${i.name} (${i.unitPrice})`).join(' + ')}"`,
      calc.totalPerPerson,
      calc.totalRoomCost,
      `"${calc.room.paymentStatus}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tamimi_multi_room_split_${issueDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          {/* Top Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold shadow-inner">
                <Divide className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Multi-Room Missing Items Batch &amp; Split Generator
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                    5-Room Auto Split Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Calculate and generate separate invoices or consolidated clearance statements for multiple rooms with differing person counts.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
            {/* Step 1: Missing Items Selector & Price Formula */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Select Missing Items to Divide Across Rooms
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Total Item Base Cost:</span>
                  <span className="text-sm font-black font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {totalBaseCost.toFixed(2)} SAR / Room
                  </span>
                </div>
              </div>

              {/* Items Pill Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {selectedItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleItem(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                      item.checked
                        ? 'bg-amber-500/10 border-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            item.checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {item.checked && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[10.5px] font-mono font-bold text-slate-700 mt-1 pl-5">
                        {item.unitPrice.toFixed(2)} SAR
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Add Custom Item line */}
              <div className="flex items-center gap-2 pt-2 border-t text-xs">
                <span className="text-slate-600 font-semibold">+ Add Other Missing Item:</span>
                <input
                  type="text"
                  placeholder="Item Name (e.g. AC Remote, Bed Linen)"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs flex-1 max-w-xs"
                />
                <input
                  type="number"
                  placeholder="Price SAR"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(Number(e.target.value) || 0)}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs w-24 font-mono text-right"
                />
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                  Add
                </button>

                <div className="ml-auto flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useExactDecimals}
                      onChange={(e) => setUseExactDecimals(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold">Exact Decimals (e.g. 47.01 SAR vs 47 SAR)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 2: Room Matrix (Each Room with its Occupant Count) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Rooms &amp; Occupant Count Setup ({rooms.length} Rooms)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Change the occupant count for each room to automatically calculate individual person shares.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              </div>

              {/* Room Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                      <th className="p-2.5 w-24">Room #</th>
                      <th className="p-2.5 w-32 text-center bg-amber-50/80 text-amber-900">Occupants (Split /N)</th>
                      <th className="p-2.5">Resident / Room Rep</th>
                      <th className="p-2.5 w-28">Company</th>
                      <th className="p-2.5 w-44 text-right bg-emerald-50/80 text-emerald-900">Calculated Share / Person</th>
                      <th className="p-2.5 w-28 text-right font-mono">Room Total</th>
                      <th className="p-2.5 w-32 text-center">Settlement</th>
                      <th className="p-2.5 w-10 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {roomCalculations.map((calc, idx) => {
                      const { room, persons, itemBreakdowns, totalPerPerson, totalRoomCost } = calc;
                      return (
                        <tr key={room.id} className="hover:bg-amber-50/30 transition-colors">
                          {/* Room Number */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={room.roomNumber}
                              onChange={(e) => handleUpdateRoom(room.id, 'roomNumber', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs bg-white"
                            />
                          </td>

                          {/* Occupant Count (Key to Split) */}
                          <td className="p-2 text-center bg-amber-50/50">
                            <div className="flex items-center justify-center space-x-1.5">
                              <select
                                value={persons}
                                onChange={(e) => handleUpdateRoom(room.id, 'occupantCount', Number(e.target.value))}
                                className="px-2 py-1 border-2 border-amber-400 rounded-lg font-mono font-black text-xs bg-white text-slate-900 shadow-xs"
                              >
                                <option value="1">1 Person (100%)</option>
                                <option value="2">2 Persons (/2)</option>
                                <option value="3">3 Persons (/3)</option>
                                <option value="4">4 Persons (/4)</option>
                                <option value="5">5 Persons (/5)</option>
                                <option value="6">6 Persons (/6)</option>
                                <option value="8">8 Persons (/8)</option>
                              </select>
                            </div>
                          </td>

                          {/* Resident / Rep */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={room.residentName}
                              onChange={(e) => handleUpdateRoom(room.id, 'residentName', e.target.value)}
                              placeholder="Resident name or room rep"
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-800"
                            />
                          </td>

                          {/* Company */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={room.company}
                              onChange={(e) => handleUpdateRoom(room.id, 'company', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-800"
                            />
                          </td>

                          {/* Calculated Share Per Person */}
                          <td className="p-2 text-right bg-emerald-50/50">
                            <div className="font-black text-emerald-800 font-mono text-sm">
                              {totalPerPerson.toFixed(2)} SAR
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              {itemBreakdowns.map((it) => `${it.itemName.slice(0, 10)}: ${it.perPersonCost}`).join(' + ')}
                            </div>
                          </td>

                          {/* Room Total Liability */}
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {totalRoomCost.toFixed(2)} SAR
                          </td>

                          {/* Payment Status */}
                          <td className="p-2 text-center">
                            <select
                              value={room.paymentStatus}
                              onChange={(e) => handleUpdateRoom(room.id, 'paymentStatus', e.target.value)}
                              className="px-2 py-1 text-[11px] border border-slate-300 rounded font-semibold bg-white"
                            >
                              <option value="DEDUCT_FROM_SALARY">Salary Deduct</option>
                              <option value="PAID">Paid at Desk</option>
                              <option value="PENDING">Pending</option>
                            </select>
                          </td>

                          {/* Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room.id)}
                              disabled={rooms.length <= 1}
                              className="text-slate-300 hover:text-rose-600 disabled:opacity-30 p-1"
                              title="Delete room row"
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
            </div>

            {/* Step 3: Calculation Mathematical Breakdown Matrix */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl text-white shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Mathematical Split Summary Matrix
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Base Missing Items Total: {totalBaseCost.toFixed(2)} SAR per room
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                {roomCalculations.map((calc, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {calc.room.roomNumber}
                      </span>
                      <span className="text-[11px] font-bold text-cyan-300 font-mono">
                        {calc.persons} {calc.persons === 1 ? 'Person' : 'Persons'}
                      </span>
                    </div>

                    <div className="text-[10.5px] text-slate-300 space-y-0.5 pt-1">
                      {calc.itemBreakdowns.map((it, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between">
                          <span className="text-slate-400 truncate max-w-[100px]">{it.itemName}:</span>
                          <span className="font-mono text-slate-200">{it.perPersonCost.toFixed(2)} SAR</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-slate-700 flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Per Person:</span>
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        {calc.totalPerPerson.toFixed(2)} SAR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions Footer */}
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold border border-slate-300 flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export CSV Matrix</span>
              </button>

              <button
                type="button"
                onClick={handlePrintConsolidatedStatement}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Master Statement (A4)</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBatchGenerateInvoices}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-600/30 transition-all scale-100 hover:scale-[1.02] active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Batch Generate {rooms.length} Individual Invoices</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

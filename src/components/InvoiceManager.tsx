import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Share2,
  Trash2,
  Eye,
  FileText,
  CreditCard,
  Building2,
  User,
  Phone,
  Calendar,
  X,
  Send,
  QrCode,
  Sparkles,
  ShieldCheck,
  Divide,
  ClipboardList,
  Layers,
  FileSpreadsheet,
  Wrench,
  Key,
  UtensilsCrossed,
  Shirt,
  Copy,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  UnifiedInvoiceRecord,
  InvoiceType,
} from '../types/invoice';
import {
  INVOICE_TYPE_DEFINITIONS,
  INITIAL_ENTERPRISE_INVOICES,
} from '../data/invoiceTemplates';
import { TAMIMI_LOGO_DATA_URL } from './TamimiLogo';
import { InvoiceTypeSelectorModal } from './invoice/InvoiceTypeSelectorModal';
import { UniversalInvoiceModal } from './invoice/UniversalInvoiceModal';
import { UniversalPrintLayout } from './invoice/UniversalPrintLayout';
import { MultiRoomSplitModal } from './invoice/MultiRoomSplitModal';
import { ZatcaQrModal } from './invoice/ZatcaQrModal';
import { generateDailyUniqueInvoiceNumber } from '../utils/invoiceNumber';
import { StorageService } from '../services/storageService';
import { GasService } from '../services/gasService';

const STORAGE_KEY_UNIFIED_INVOICES = 'tamimi_unified_camp_invoices_v2';
const STORAGE_KEY_LEGACY_MISSING = 'tafga_missing_items_invoices_v1';

export const InvoiceManager: React.FC<{ onRefresh?: () => void }> = () => {
  // Load unified invoices or fallback to initial enterprise sample dataset
  const [invoices, setInvoices] = useState<UnifiedInvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNIFIED_INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (inv: UnifiedInvoiceRecord) =>
              inv &&
              inv.id &&
              !StorageService.isIdDeleted(inv.id) &&
              !(inv.invoiceNumber && StorageService.isIdDeleted(inv.invoiceNumber))
          );
        }
      }

      // Check if legacy missing items exist and migrate them
      const legacyMissing = localStorage.getItem(STORAGE_KEY_LEGACY_MISSING);
      if (legacyMissing) {
        const parsed = JSON.parse(legacyMissing);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated: UnifiedInvoiceRecord[] = parsed
            .filter(
              (item: any) =>
                item &&
                item.id &&
                !StorageService.isIdDeleted(item.id) &&
                !(item.invoiceNumber && StorageService.isIdDeleted(item.invoiceNumber))
            )
            .map((item: any) => ({
              ...item,
              invoiceType: 'MISSING_ITEMS',
              customerName: item.customerName || item.employeeName || 'Resident',
              phoneNumber: item.phoneNumber || item.mobile || '',
              subtotal: item.subtotal || item.totalAmount || 0,
              vatRate: item.vatRate || 0,
              vatAmount: item.vatAmount || 0,
            }));
          return [
            ...migrated,
            ...INITIAL_ENTERPRISE_INVOICES.filter(
              (i) =>
                i.invoiceType !== 'MISSING_ITEMS' &&
                !StorageService.isIdDeleted(i.id) &&
                !(i.invoiceNumber && StorageService.isIdDeleted(i.invoiceNumber))
            ),
          ];
        }
      }
      return INITIAL_ENTERPRISE_INVOICES.filter(
        (i) =>
          !StorageService.isIdDeleted(i.id) &&
          !(i.invoiceNumber && StorageService.isIdDeleted(i.invoiceNumber))
      );
    } catch {
      return INITIAL_ENTERPRISE_INVOICES;
    }
  });

  // Filters & State
  const [selectedTypeTab, setSelectedTypeTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');

  // Modals & Popovers
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isMultiRoomModalOpen, setIsMultiRoomModalOpen] = useState(false);
  const [isZatcaModalOpen, setIsZatcaModalOpen] = useState(false);
  const [zatcaTargetInvoice, setZatcaTargetInvoice] = useState<UnifiedInvoiceRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<UnifiedInvoiceRecord | null>(null);
  const [selectedNewType, setSelectedNewType] = useState<InvoiceType>('MISSING_ITEMS');
  const [isNewInvoiceDropdownOpen, setIsNewInvoiceDropdownOpen] = useState(false);
  const newInvoiceDropdownRef = useRef<HTMLDivElement>(null);

  // In-App Deletion Confirmation State
  const [invoiceToDelete, setInvoiceToDelete] = useState<UnifiedInvoiceRecord | null>(null);

  // Click outside listener for new invoice dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newInvoiceDropdownRef.current && !newInvoiceDropdownRef.current.contains(e.target as Node)) {
        setIsNewInvoiceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Direct Print Modal State
  const [printTargetInvoice, setPrintTargetInvoice] = useState<UnifiedInvoiceRecord | null>(null);

  // Listen to external & background sync updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_UNIFIED_INVOICES);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(
              (inv: UnifiedInvoiceRecord) =>
                inv &&
                inv.id &&
                !StorageService.isIdDeleted(inv.id) &&
                !(inv.invoiceNumber && StorageService.isIdDeleted(inv.invoiceNumber))
            );
            setInvoices(valid);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('invoices_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('invoices_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Save to LocalStorage whenever invoices state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIFIED_INVOICES, JSON.stringify(invoices));
    } catch (err) {
      console.error('Failed to save unified invoices to storage:', err);
    }
  }, [invoices]);

  // Financial Metrics Summary
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => (inv.paymentStatus !== 'VOID' ? sum + inv.totalAmount : sum), 0);
    const paidAmount = invoices
      .filter((inv) => inv.paymentStatus === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const salaryDeductAmount = invoices
      .filter((inv) => inv.paymentStatus === 'DEDUCT_FROM_SALARY')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingAmount = invoices
      .filter((inv) => inv.paymentStatus === 'PENDING' || inv.paymentStatus === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      totalCount: invoices.length,
      totalAmount,
      paidAmount,
      salaryDeductAmount,
      pendingAmount,
      paidCount: invoices.filter((inv) => inv.paymentStatus === 'PAID').length,
      salaryDeductCount: invoices.filter((inv) => inv.paymentStatus === 'DEDUCT_FROM_SALARY').length,
      pendingCount: invoices.filter((inv) => inv.paymentStatus === 'PENDING' || inv.paymentStatus === 'OVERDUE').length,
    };
  }, [invoices]);

  // Unique list of facilities/camps
  const availableFacilities = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.facilities) set.add(inv.facilities);
    });
    return Array.from(set);
  }, [invoices]);

  // Filtered Invoices List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Type Filter
      if (selectedTypeTab !== 'ALL' && inv.invoiceType !== selectedTypeTab) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) {
        return false;
      }

      // Facility Filter
      if (facilityFilter !== 'ALL' && inv.facilities !== facilityFilter) {
        return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          inv.customerName?.toLowerCase().includes(q) ||
          inv.roomNumber?.toLowerCase().includes(q) ||
          inv.company?.toLowerCase().includes(q) ||
          inv.facilities?.toLowerCase().includes(q) ||
          inv.pocName?.toLowerCase().includes(q) ||
          inv.phoneNumber?.includes(q) ||
          inv.employeeId?.toLowerCase().includes(q) ||
          inv.items?.some((it) => it.name.toLowerCase().includes(q));

        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, selectedTypeTab, statusFilter, facilityFilter, searchTerm]);

  // Type Counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: invoices.length };
    Object.keys(INVOICE_TYPE_DEFINITIONS).forEach((k) => {
      counts[k] = invoices.filter((i) => i.invoiceType === k).length;
    });
    return counts;
  }, [invoices]);

  // Handle Type Selected from Selector Modal
  const handleTypeSelected = (type: InvoiceType) => {
    setSelectedNewType(type);
    setSelectedInvoice(null);
    setIsTypeSelectorOpen(false);
    setIsInvoiceModalOpen(true);
  };

  // Save / Update Invoice
  const handleSaveInvoice = (savedRecord: UnifiedInvoiceRecord) => {
    const existingIndex = invoices.findIndex((i) => i.id === savedRecord.id);
    let updated: UnifiedInvoiceRecord[];
    if (existingIndex >= 0) {
      updated = [...invoices];
      updated[existingIndex] = savedRecord;
    } else {
      updated = [savedRecord, ...invoices];
    }
    setInvoices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_UNIFIED_INVOICES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('invoices_updated'));
    } catch (e) {}
    GasService.pushInvoiceToRemote(savedRecord).catch((err) =>
      console.warn('Background remote invoice push:', err)
    );
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  // Batch Save Multiple Invoices from Multi-Room Split Generator
  const handleBatchCreateInvoices = (newInvoices: UnifiedInvoiceRecord[]) => {
    const updated = [...newInvoices, ...invoices];
    setInvoices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_UNIFIED_INVOICES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('invoices_updated'));
    } catch (e) {}
    GasService.pushBatchInvoicesToRemote(newInvoices).catch((err) =>
      console.warn('Background batch invoices push:', err)
    );
  };

  // Delete / Void Invoice - sets item for in-app custom modal confirmation
  const handleDeleteInvoice = (inv: UnifiedInvoiceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceToDelete(inv);
  };

  const handleConfirmDelete = () => {
    if (!invoiceToDelete) return;
    
    // 1. Record ID and invoice number in deletion tombstone registry to prevent resurrecting
    StorageService.recordDeletedId(invoiceToDelete.id);
    if (invoiceToDelete.invoiceNumber) {
      StorageService.recordDeletedId(invoiceToDelete.invoiceNumber);
    }

    // 2. Remove from local state
    const updated = invoices.filter((i) => i.id !== invoiceToDelete.id);
    setInvoices(updated);

    // 3. Persist locally & notify other tabs/listeners
    try {
      localStorage.setItem(STORAGE_KEY_UNIFIED_INVOICES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('invoices_updated'));
    } catch (e) {}

    // 4. Push remote deletion to Google Sheets via GAS
    GasService.deleteInvoiceFromRemote(invoiceToDelete.id, invoiceToDelete.invoiceNumber).catch((err) =>
      console.warn('Background remote invoice deletion:', err)
    );

    setInvoiceToDelete(null);
  };

  // Quick Duplicate with Unique Daily Numbering
  const handleDuplicate = (invoice: UnifiedInvoiceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date().toISOString().split('T')[0];
    const newInvNum = generateDailyUniqueInvoiceNumber(invoice.invoiceType, today, invoices);
    const duplicated: UnifiedInvoiceRecord = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvNum,
      date: today,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setSelectedInvoice(duplicated);
    setIsInvoiceModalOpen(true);
  };

  // Quick Status Toggle
  const handleQuickStatusChange = (
    id: string,
    newStatus: UnifiedInvoiceRecord['paymentStatus'],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    let updatedItem: UnifiedInvoiceRecord | null = null;
    const updated = invoices.map((inv) => {
      if (inv.id === id) {
        updatedItem = { ...inv, paymentStatus: newStatus };
        return updatedItem;
      }
      return inv;
    });
    setInvoices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_UNIFIED_INVOICES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('invoices_updated'));
    } catch (e) {}

    if (updatedItem) {
      GasService.pushInvoiceToRemote(updatedItem).catch((err) =>
        console.warn('Background remote invoice status update:', err)
      );
    }
  };

  // Print Invoice Document
  const handleDirectPrint = (inv: UnifiedInvoiceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintTargetInvoice(inv);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice #',
      'Type',
      'Date',
      'Room #',
      'Customer / Employee',
      'Employee ID',
      'Company',
      'Camp/Facility',
      'POC Name',
      'Mobile',
      'Subtotal (SAR)',
      'VAT (SAR)',
      'Total Amount (SAR)',
      'Payment Status',
      'Payment Method',
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${INVOICE_TYPE_DEFINITIONS[inv.invoiceType]?.title || inv.invoiceType}"`,
      `"${inv.date}"`,
      `"${inv.roomNumber || ''}"`,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      `"${inv.employeeId || ''}"`,
      `"${inv.company || ''}"`,
      `"${inv.facilities || ''}"`,
      `"${inv.pocName || ''}"`,
      `"${inv.phoneNumber || ''}"`,
      inv.subtotal || 0,
      inv.vatAmount || 0,
      inv.totalAmount || 0,
      `"${inv.paymentStatus}"`,
      `"${inv.paymentMethod}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tamimi_invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const typeDefList = Object.values(INVOICE_TYPE_DEFINITIONS);

  return (
    <div className="space-y-4">
      {/* Unified Compact Filter & Action Control Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Main Row: Search, Category Select, Status, Camp, Export, + New Invoice */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, room, resident, company, POC, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Center Filters: Category / Template Dropdown + Status Selector + Camp Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category / Template Dropdown */}
            <div className="relative flex items-center">
              <Layers className="w-3.5 h-3.5 text-amber-600 absolute left-3 pointer-events-none" />
              <select
                value={selectedTypeTab}
                onChange={(e) => setSelectedTypeTab(e.target.value as any)}
                className="pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                title="Filter by Invoice Template Type"
              >
                <option value="ALL">All Categories ({typeCounts.ALL})</option>
                {typeDefList.map((def) => {
                  const count = typeCounts[def.type] || 0;
                  const label = def.title.replace(' Form', '').replace(' Invoice', '').replace(' Bill', '');
                  return (
                    <option key={def.type} value={def.type}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { id: 'ALL', label: 'All Status' },
                  { id: 'PAID', label: 'Paid' },
                  { id: 'DEDUCT_FROM_SALARY', label: 'Salary' },
                  { id: 'PENDING', label: 'Pending' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Camp / Facility Filter */}
            {availableFacilities.length > 1 && (
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="ALL">All Camps</option>
                {availableFacilities.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs border border-slate-200 flex items-center space-x-1.5 transition-all shadow-xs"
              title="Export all filtered invoices as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export</span>
              <span>CSV</span>
            </button>

            {/* Compact + New Invoice Dropdown Menu */}
            <div className="relative shrink-0" ref={newInvoiceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNewInvoiceDropdownOpen(!isNewInvoiceDropdownOpen)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-600/20 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Invoice</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNewInvoiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Dropdown Menu */}
              <AnimatePresence>
                {isNewInvoiceDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 overflow-hidden space-y-1 text-left"
                  >
                    <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Form Type</span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">Quick Form</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-0.5 py-1">
                      {Object.values(INVOICE_TYPE_DEFINITIONS).map((def) => {
                        const cleanTitle = def.title.replace(' Form', '').replace(' Invoice', '').replace(' Bill', '');
                        return (
                          <button
                            key={def.type}
                            type="button"
                            onClick={() => {
                              setSelectedNewType(def.type);
                              setSelectedInvoice(null);
                              setIsInvoiceModalOpen(true);
                              setIsNewInvoiceDropdownOpen(false);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-amber-50/70 flex items-center justify-between group transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${def.badgeColor} shrink-0`} />
                              <div className="truncate">
                                <div className="font-bold text-slate-800 text-xs group-hover:text-amber-900 transition-colors">
                                  {cleanTitle}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {def.formRefCode}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-700 transition-colors font-mono shrink-0 ml-2">
                              + Open
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMultiRoomModalOpen(true);
                          setIsNewInvoiceDropdownOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>⚡ Multi-Room Split Generator</span>
                        </div>
                        <span className="text-[10px] bg-amber-700/60 px-1.5 py-0.5 rounded font-mono">Batch</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Active Filters Summary row if any filter is active */}
        {(selectedTypeTab !== 'ALL' || statusFilter !== 'ALL' || facilityFilter !== 'ALL' || searchTerm) && (
          <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-600 gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Active Filters:</span>
              {selectedTypeTab !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-medium">
                  <span>Category: {INVOICE_TYPE_DEFINITIONS[selectedTypeTab]?.title?.replace(' Form', '').replace(' Invoice', '').replace(' Bill', '') || selectedTypeTab}</span>
                  <button onClick={() => setSelectedTypeTab('ALL')} className="hover:text-amber-950 font-bold ml-0.5 text-xs">×</button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-medium">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('ALL')} className="hover:text-slate-950 font-bold ml-0.5 text-xs">×</button>
                </span>
              )}
              {facilityFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-medium">
                  <span>Camp: {facilityFilter}</span>
                  <button onClick={() => setFacilityFilter('ALL')} className="hover:text-slate-950 font-bold ml-0.5 text-xs">×</button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-medium">
                  <span>Search: "{searchTerm}"</span>
                  <button onClick={() => setSearchTerm('')} className="hover:text-slate-950 font-bold ml-0.5 text-xs">×</button>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedTypeTab('ALL');
                setStatusFilter('ALL');
                setFacilityFilter('ALL');
                setSearchTerm('');
              }}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 ml-auto"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No invoices match the selected criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or filters, or create a new invoice from one of the official Tamimi templates.
            </p>
            <button
              onClick={() => setIsTypeSelectorOpen(true)}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-44">Invoice # &amp; Date</th>
                  <th className="py-3 px-4 w-40">Template Type</th>
                  <th className="py-3 px-4">Resident / Client Info</th>
                  <th className="py-3 px-4 w-32">Company &amp; Camp</th>
                  <th className="py-3 px-4 w-48">Charged Items Summary</th>
                  <th className="py-3 px-4 w-32 text-right">Total (SAR)</th>
                  <th className="py-3 px-4 w-36 text-center">Status</th>
                  <th className="py-3 px-4 w-40 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((inv) => {
                  const typeDef = INVOICE_TYPE_DEFINITIONS[inv.invoiceType] || INVOICE_TYPE_DEFINITIONS.MISSING_ITEMS;
                  const chargedItems = inv.items?.filter((it) => it.quantity > 0 || (it.amount && it.amount > 0)) || [];

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsInvoiceModalOpen(true);
                      }}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Invoice # & Date */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{inv.date}</span>
                        </div>
                      </td>

                      {/* Template Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold text-white shadow-xs ${typeDef.badgeColor}`}
                        >
                          {typeDef.title.replace(' Form', '').replace(' Invoice', '').replace(' Bill', '')}
                        </span>
                        <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                          {typeDef.formRefCode}
                        </div>
                      </td>

                      {/* Customer / Resident Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {inv.roomNumber && (
                            <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-black text-slate-950">
                              {inv.roomNumber}
                            </span>
                          )}
                          <span>{inv.customerName}</span>
                          {inv.employeeId && (
                            <span className="text-slate-400 text-[10px] font-normal">({inv.employeeId})</span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-2">
                          {inv.phoneNumber && (
                            <span className="flex items-center gap-0.5 font-mono">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {inv.phoneNumber}
                            </span>
                          )}
                          {inv.pocName && (
                            <span>• POC: {inv.pocName}</span>
                          )}
                        </div>
                      </td>

                      {/* Company & Camp */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inv.company || 'Al-Ayuni'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{inv.facilities || 'TBCV'}</div>
                      </td>

                      {/* Charged Items Preview */}
                      <td className="py-3 px-4">
                        {chargedItems.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No items selected</span>
                        ) : (
                          <div className="space-y-0.5">
                            {chargedItems.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="text-[11px] text-slate-700 truncate max-w-[200px]">
                                • <span className="font-semibold">{it.name}</span>
                                {it.quantity > 1 ? ` (x${it.quantity})` : ''}
                                {it.splitPersonCount && it.splitPersonCount > 1 ? ` [1/${it.splitPersonCount}]` : ''}
                              </div>
                            ))}
                            {chargedItems.length > 2 && (
                              <div className="text-[10px] text-amber-700 font-bold">
                                +{chargedItems.length - 2} more item(s)...
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-slate-900 font-mono text-sm">
                          {inv.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {inv.vatRate && inv.vatRate > 0 ? `Incl. VAT ${inv.vatRate}%` : 'SAR (0% Tax)'}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        {inv.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ★ PAID AT DESK
                          </span>
                        ) : inv.paymentStatus === 'DEDUCT_FROM_SALARY' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                            ★ SALARY DEDUCT
                          </span>
                        ) : inv.paymentStatus === 'OVERDUE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            ★ OVERDUE BILL
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            ★ PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* ZATCA Phase-2 QR Compliance Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZatcaTargetInvoice(inv);
                              setIsZatcaModalOpen(true);
                            }}
                            className="p-1.5 text-purple-600 hover:text-purple-950 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                            title="ZATCA Fatoora Phase-2 E-Invoice QR & Tax Compliance"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Print Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDirectPrint(inv, e)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Print A4 Official Form"
                          >
                            <Printer className="w-4 h-4 text-slate-700" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={(e) => handleDuplicate(inv, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplicate as New Invoice"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteInvoice(inv, e)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Selector Modal (+ New Invoice Clicked) */}
      <InvoiceTypeSelectorModal
        isOpen={isTypeSelectorOpen}
        onClose={() => setIsTypeSelectorOpen(false)}
        onSelectType={handleTypeSelected}
        onOpenMultiRoom={() => setIsMultiRoomModalOpen(true)}
      />

      {/* Multi-Room Batch & Split Generator Modal */}
      {isMultiRoomModalOpen && (
        <MultiRoomSplitModal
          isOpen={isMultiRoomModalOpen}
          onClose={() => setIsMultiRoomModalOpen(false)}
          onBatchCreate={handleBatchCreateInvoices}
        />
      )}

      {/* Universal Creation / Edit Modal */}
      {isInvoiceModalOpen && (
        <UniversalInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSave={handleSaveInvoice}
          initialInvoice={selectedInvoice}
          defaultType={selectedNewType}
          existingInvoices={invoices}
        />
      )}

      {/* In-App Deletion Confirmation Modal */}
      <AnimatePresence>
        {invoiceToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Delete Invoice Record?</h3>
                  <p className="text-xs text-slate-500">This action will remove this invoice from your records.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Invoice #:</span>
                  <span className="font-bold text-slate-900">{invoiceToDelete.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Resident:</span>
                  <span className="font-bold text-slate-800 font-sans">{invoiceToDelete.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Room #:</span>
                  <span className="font-bold text-slate-800">{invoiceToDelete.roomNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans font-medium">Date &amp; Amount:</span>
                  <span className="font-bold text-emerald-700">{invoiceToDelete.date} | {invoiceToDelete.totalAmount.toFixed(2)} SAR</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-rose-600/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Record</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Full-Screen Print Modal */}
      {printTargetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Top Toolbar */}
            <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">
                  A4 Print Layout — {printTargetInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    const typeDef =
                      INVOICE_TYPE_DEFINITIONS[printTargetInvoice.invoiceType] ||
                      INVOICE_TYPE_DEFINITIONS.MISSING_ITEMS;

                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>${typeDef.title} - ${printTargetInvoice.invoiceNumber}</title>
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
                              <div class="sub-sub">Tamimi Global Company (TAFGA) • ${printTargetInvoice.facilities || 'TBCV'} Facilities</div>
                            </div>
                            
                            <div class="badge-box">
                              <div class="inv-pill">INVOICE # ${printTargetInvoice.invoiceNumber.replace(/^INV-[A-Z]+-/, '') || printTargetInvoice.date}</div>
                              <div style="margin-top: 3px; font-weight: bold; color: #334155;">CAMP: ${printTargetInvoice.facilities || 'TBCV'}</div>
                              <div style="color: #64748b; font-size: 9px;">Date: ${printTargetInvoice.date}</div>
                            </div>
                          </div>

                          <div class="company-info">
                            <div class="emp-head">
                              <div><strong>Customer / Employee:</strong> <u style="font-weight: 900;">${printTargetInvoice.roomNumber ? `${printTargetInvoice.roomNumber} - ` : ''}${printTargetInvoice.customerName}</u> ${printTargetInvoice.employeeId ? `(${printTargetInvoice.employeeId})` : ''}</div>
                              ${printTargetInvoice.roomNumber ? `<div><strong>Room Ref:</strong> <span style="font-family: monospace; font-weight: 900; background: #fff; padding: 1px 4px; border: 1px solid #94a3b8;">${printTargetInvoice.roomNumber}</span></div>` : ''}
                            </div>
                            
                            <div class="grid-2">
                              <div><strong>Company :</strong> ${printTargetInvoice.company || 'Al-Ayuni'}</div>
                              <div><strong>Facilities :</strong> ${printTargetInvoice.facilities || 'TBCV'}</div>
                              <div><strong>POC Name :</strong> ${printTargetInvoice.pocName || 'Naveeth'}</div>
                              <div><strong>Mobile :</strong> <span style="font-family: monospace;">${printTargetInvoice.phoneNumber || '0536148530'}</span></div>
                            </div>
                            
                            <div class="checkbox-row">
                              <div>
                                <strong>Status:</strong> 
                                [${printTargetInvoice.employeeStatus === 'PERMANENT' ? '✓' : ' '}] Permanent &nbsp;
                                [${printTargetInvoice.employeeStatus === 'TEMPORARY' ? '✓' : ' '}] Temporary &nbsp;
                                [${printTargetInvoice.employeeStatus === 'CONTACT' ? '✓' : ' '}] Contact &nbsp;
                                [${printTargetInvoice.employeeStatus === 'CONTRACTOR' ? '✓' : ' '}] Contractor
                              </div>
                              <div>
                                <strong>Class:</strong> 
                                [${printTargetInvoice.classification === 'ADMINISTRATOR' ? '✓' : ' '}] Admin &nbsp;
                                [${printTargetInvoice.classification === 'STAFF' ? '✓' : ' '}] Staff &nbsp;
                                [${printTargetInvoice.classification === 'FACULTY' ? '✓' : ' '}] Faculty &nbsp;
                                [${printTargetInvoice.classification === 'CONTRACTOR' ? '✓' : ' '}] Contractor
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
                              ${printTargetInvoice.items
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
                                printTargetInvoice.vatRate && printTargetInvoice.vatRate > 0
                                  ? `
                                <tr style="background: #f8fafc; font-size: 10.5px;">
                                  <td colspan="3" class="right">Subtotal SAR</td>
                                  <td class="right" style="font-family: monospace; font-weight: bold;">${(printTargetInvoice.subtotal || 0).toFixed(2)}</td>
                                  <td>Tax Exclusive</td>
                                </tr>
                                <tr style="background: #f8fafc; font-size: 10.5px;">
                                  <td colspan="3" class="right">VAT ${printTargetInvoice.vatRate}% SAR</td>
                                  <td class="right" style="font-family: monospace; font-weight: bold; color: #92400e;">${(printTargetInvoice.vatAmount || 0).toFixed(2)}</td>
                                  <td>ZATCA Tax ID: 300012345600003</td>
                                </tr>
                              `
                                  : ''
                              }

                              <tr class="total-row">
                                <td colspan="3" class="right" style="text-transform: uppercase;">Total Amount SAR</td>
                                <td class="right" style="font-family: monospace; font-size: 13px; color: #020617;">${printTargetInvoice.totalAmount.toFixed(2)}</td>
                                <td style="font-weight: 900;">${
                                  printTargetInvoice.paymentStatus === 'PAID'
                                    ? '★ PAID AT DESK'
                                    : printTargetInvoice.paymentStatus === 'DEDUCT_FROM_SALARY'
                                    ? '★ DEDUCT FROM SALARY'
                                    : printTargetInvoice.paymentStatus === 'OVERDUE'
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
                                  <div><strong>Client / POC:</strong> ${printTargetInvoice.pocName || printTargetInvoice.customerName}</div>
                                  <div><strong>Mobile:</strong> ${printTargetInvoice.phoneNumber}</div>
                                </div>
                                <div class="sig-line-box">
                                  <span><strong>Signature:</strong> ___________________________</span>
                                  <span>Date: ${printTargetInvoice.pocDate || printTargetInvoice.date}</span>
                                </div>
                              </div>

                              <!-- Right Box: Facilities Dept -->
                              <div class="sig-card">
                                <div class="sig-card-head">
                                  <span>2. FACILITIES DEPT. APPROVAL &amp; STAMP</span>
                                  <span style="font-size: 9px; color: #64748b;">CAMP SEAL</span>
                                </div>
                                <div style="font-size: 10.5px;">
                                  <div><strong>Issued By:</strong> ${printTargetInvoice.issuedByName || 'Majid'}</div>
                                  <div><strong>Role:</strong> Facilities / Camp Operations</div>
                                </div>
                                <div class="sig-line-box">
                                  <span><strong>Auth Sign &amp; Stamp:</strong> _____________________</span>
                                  <span>Date: ${printTargetInvoice.issuedDate || printTargetInvoice.date}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="doc-footer">
                          <span>Tamimi Global Company (TAFGA) • Camp Facilities Billing Management</span>
                          <span>Form Ref: ${typeDef.formRefCode}</span>
                          <span>Printed on ${printTargetInvoice.date}</span>
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
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintTargetInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/90 flex justify-center">
              <div className="bg-white shadow-2xl rounded-sm w-full max-w-[210mm]">
                <UniversalPrintLayout invoice={printTargetInvoice} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ZATCA FATOORA PHASE-2 QR & TAX COMPLIANCE MODAL
          ======================================================== */}
      <ZatcaQrModal
        isOpen={isZatcaModalOpen}
        onClose={() => setIsZatcaModalOpen(false)}
        invoice={zatcaTargetInvoice}
      />
    </div>
  );
};

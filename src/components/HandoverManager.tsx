import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  KeyRound,
  Shield,
  User,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  Printer,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  Tag,
  Package,
  Layers,
  ChevronDown,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Share2,
  Camera,
  Eye,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HandoverItemRecord, HandoverType, HandoverStatus } from '../types';
import { StorageService, getTodayDateString, formatDisplayTime } from '../services/storageService';
import { AuthService } from '../services/authService';
import { GasService } from '../services/gasService';
import { PhotoUploadField } from './PhotoUploadField';
import { FacilityDocumentPrintModal } from './FacilityDocumentPrintModal';
import { FacilityEntryConfirmationModal } from './FacilityEntryConfirmationModal';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import confetti from 'canvas-confetti';

interface HandoverManagerProps {
  onRefresh?: () => void;
}

export const HandoverManager: React.FC<HandoverManagerProps> = ({ onRefresh }) => {
  const [records, setRecords] = useState<HandoverItemRecord[]>(() => StorageService.getHandoverRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | HandoverType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HandoverStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Dropdown States
  const [isNewEntryDropdownOpen, setIsNewEntryDropdownOpen] = useState(false);
  const newEntryDropdownRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncedToRemote, setIsSyncedToRemote] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HandoverItemRecord | null>(null);
  const [whatsAppRecord, setWhatsAppRecord] = useState<HandoverItemRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<HandoverItemRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<HandoverItemRecord>>({
    type: 'GIVEN_OUT',
    category: 'Room Key',
    itemName: '',
    quantity: 1,
    personName: '',
    personType: 'Resident Guest',
    departmentOrCompany: '',
    roomNumber: '',
    phoneNumber: '',
    badgeOrIdNumber: '',
    issueDate: getTodayDateString(),
    issueTime: '10:00',
    expectedReturnDate: '',
    condition: 'Good',
    authorizedByStaff: 'Front Desk / Duty Officer',
    notes: '',
    pickupAuthorizedPerson: '',
    photoUrl: '',
  });

  // Return / Release Form State
  const [returnCondition, setReturnCondition] = useState<'Good' | 'Fair' | 'Damaged / Marked'>('Good');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSignature, setReturnSignature] = useState<string>('');
  const [isReturnSigningOpen, setIsReturnSigningOpen] = useState(false);

  // Outside click listener for New Entry Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        newEntryDropdownRef.current &&
        !newEntryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNewEntryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync listener
  useEffect(() => {
    const handleUpdate = () => {
      setRecords([...StorageService.getHandoverRecords()]);
    };
    window.addEventListener('tamimi_handover_updated', handleUpdate);
    return () => window.removeEventListener('tamimi_handover_updated', handleUpdate);
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const today = getTodayDateString();

    return records.filter((rec) => {
      // Type Filter
      if (typeFilter !== 'ALL' && rec.type !== typeFilter) return false;

      // Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OVERDUE') {
          const isOverdue =
            rec.status === 'ACTIVE_BORROWED' &&
            rec.expectedReturnDate &&
            rec.expectedReturnDate < today;
          if (!isOverdue) return false;
        } else if (rec.status !== statusFilter) {
          return false;
        }
      }

      // Category Filter
      if (categoryFilter !== 'ALL' && rec.category !== categoryFilter) return false;

      // Search Query
      if (query) {
        const matchesName = rec.personName?.toLowerCase().includes(query);
        const matchesItem = rec.itemName?.toLowerCase().includes(query);
        const matchesRoom = rec.roomNumber?.toLowerCase().includes(query);
        const matchesPhone = rec.phoneNumber?.toLowerCase().includes(query);
        const matchesDept = rec.departmentOrCompany?.toLowerCase().includes(query);
        const matchesId = rec.id?.toLowerCase().includes(query);
        const matchesPickup = rec.pickupAuthorizedPerson?.toLowerCase().includes(query);

        if (!matchesName && !matchesItem && !matchesRoom && !matchesPhone && !matchesDept && !matchesId && !matchesPickup) {
          return false;
        }
      }

      return true;
    });
  }, [records, searchQuery, typeFilter, statusFilter, categoryFilter]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const today = getTodayDateString();
    const activeLoans = records.filter((r) => r.type === 'GIVEN_OUT' && r.status === 'ACTIVE_BORROWED').length;
    const inCustody = records.filter((r) => r.type === 'TAKEN_IN' && r.status === 'IN_CUSTODY_HOLDING').length;
    const interDept = records.filter((r) => r.type === 'INTER_DEPT' && r.status === 'ACTIVE_BORROWED').length;
    const overdue = records.filter((r) => r.status === 'ACTIVE_BORROWED' && r.expectedReturnDate && r.expectedReturnDate < today).length;
    const returnedTotal = records.filter((r) => r.status === 'RETURNED' || r.status === 'CLAIMED_PICKED_UP').length;

    return { activeLoans, inCustody, interDept, overdue, returnedTotal, total: records.length };
  }, [records]);

  // Open Create Modal with Preset
  const handleOpenCreate = (presetType: HandoverType) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setFormData({
      type: presetType,
      category: presetType === 'INTER_DEPT' ? 'Tools / Hardware' : presetType === 'TAKEN_IN' ? 'Other Assets' : 'Room Key',
      itemName: '',
      quantity: 1,
      personName: '',
      personType: presetType === 'INTER_DEPT' ? 'Company Employee' : 'Resident Guest',
      departmentOrCompany: '',
      roomNumber: '',
      phoneNumber: '',
      badgeOrIdNumber: '',
      issueDate: getTodayDateString(),
      issueTime: timeStr,
      expectedReturnDate: presetType === 'TAKEN_IN' ? '' : getTodayDateString(),
      condition: 'Good',
      authorizedByStaff: AuthService.getCurrentStaffName() || 'Front Desk Duty Officer',
      notes: '',
      pickupAuthorizedPerson: '',
      photoUrl: '',
    });
    setSelectedRecord(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: HandoverItemRecord) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setIsFormModalOpen(true);
  };

  // Submit Save
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.personName || !formData.phoneNumber) {
      return;
    }

    setIsSubmitting(true);
    try {
      const savedRecord = StorageService.saveHandoverRecord({
        ...(selectedRecord ? { id: selectedRecord.id } : {}),
        type: formData.type || 'GIVEN_OUT',
        category: formData.category || 'Other Assets',
        itemName: formData.itemName,
        quantity: Number(formData.quantity) || 1,
        personName: formData.personName,
        personType: formData.personType || 'Resident Guest',
        departmentOrCompany: formData.departmentOrCompany,
        roomNumber: formData.roomNumber,
        phoneNumber: formData.phoneNumber,
        badgeOrIdNumber: formData.badgeOrIdNumber,
        issueDate: formData.issueDate || getTodayDateString(),
        issueTime: formData.issueTime || '10:00',
        expectedReturnDate: formData.expectedReturnDate,
        condition: formData.condition || 'Good',
        authorizedByStaff: formData.authorizedByStaff || 'Front Desk Staff',
        notes: formData.notes,
        pickupAuthorizedPerson: formData.pickupAuthorizedPerson,
        photoUrl: formData.photoUrl || '',
        status: selectedRecord ? selectedRecord.status : (formData.type === 'TAKEN_IN' ? 'IN_CUSTODY_HOLDING' : 'ACTIVE_BORROWED'),
      });

      // Reset filters so the new record is prominently visible in the list immediately
      setTypeFilter('ALL');
      setStatusFilter('ALL');
      setCategoryFilter('ALL');
      setSearchQuery('');

      const latestList = StorageService.getHandoverRecords();
      setRecords([...latestList]);

      // Push immediately to Google Sheets via proxy and direct POST fallback
      const remoteRes = await GasService.pushHandoverToRemote(savedRecord);
      setIsSyncedToRemote(Boolean(remoteRes && remoteRes.success));

      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}

      setIsFormModalOpen(false);
      setSelectedRecord(savedRecord);
      setIsConfirmationModalOpen(true);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving handover record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Return / Claim Release
  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;
    const newStatus = selectedRecord.type === 'TAKEN_IN' ? 'CLAIMED_PICKED_UP' : 'RETURNED';
    
    const updatedRecord = StorageService.saveHandoverRecord({
      ...selectedRecord,
      status: newStatus,
      actualReturnDate: getTodayDateString(),
      condition: returnCondition,
      photoUrl: returnSignature || selectedRecord.photoUrl,
      notes: selectedRecord.notes ? `${selectedRecord.notes} | Returned on ${getTodayDateString()}: ${returnNotes || 'Satisfactory condition'}` : `Returned: ${returnNotes || 'Good condition'}`,
    });

    // Push update to Google Sheets
    GasService.pushHandoverToRemote(updatedRecord).catch((err) =>
      console.warn('Auto-sync handover return to sheet failed:', err)
    );

    setRecords([...StorageService.getHandoverRecords()]);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    setIsReturnModalOpen(false);
    setIsReturnSigningOpen(false);
    setReturnSignature('');
    setSelectedRecord(null);
    if (onRefresh) onRefresh();
  };

  // Delete Record Trigger & Confirm
  const handleDelete = (record: HandoverItemRecord) => {
    setRecordToDelete(record);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    const idToDelete = recordToDelete.id;
    setIsDeleting(true);
    try {
      // 1. Delete from local storage & memory
      StorageService.deleteHandoverRecord(idToDelete);
      setRecords([...StorageService.getHandoverRecords()]);

      // 2. Delete from Google Sheets
      await GasService.deleteHandoverFromRemote(idToDelete);

      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Delete handover failed:', e);
    } finally {
      setIsDeleting(false);
      setRecordToDelete(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = StorageService.exportHandoverCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tamimi_handover_records_${getTodayDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Active Lent Out Items */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-cyan-200/80 dark:border-cyan-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Lent Out (Active)
            </span>
            <span className="p-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
              <KeyRound className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.activeLoans}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Items with guests</span>
          </div>
        </div>

        {/* In Custody (Held for Guests) */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              In Custody Hold
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.inCustody}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Safekeeping</span>
          </div>
        </div>

        {/* Inter-Dept Borrow */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-blue-200/80 dark:border-blue-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Inter-Dept Loan
            </span>
            <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.interDept}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Dept tools</span>
          </div>
        </div>

        {/* Overdue Items */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-rose-200/80 dark:border-rose-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Overdue Return
            </span>
            <span className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.overdue}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Action needed</span>
          </div>
        </div>

        {/* Total Returned */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Returned & Closed
            </span>
            <span className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.returnedTotal}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">History log</span>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Logged
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">All transactions</span>
          </div>
        </div>
      </div>

      {/* Action Control Strip & Filters */}
      <div className="bg-white dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Main Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Unified "+ New Entry" Dropdown Button */}
            <div className="relative" ref={newEntryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNewEntryDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-200" />
                <span>+ New Entry</span>
                <ChevronDown
                  className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                    isNewEntryDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu with the 3 Handover Actions */}
              <AnimatePresence>
                {isNewEntryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Select Handover Record Type
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* Option 1: Lend Item / Key to Guest */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewEntryDropdownOpen(false);
                          handleOpenCreate('GIVEN_OUT');
                        }}
                        className="w-full flex items-start space-x-3 p-2.5 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-left transition group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                            + Lend Item / Key to Guest
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            Issue keys, room items, blanket, furniture or tools to resident
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Receive & Hold Custody */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewEntryDropdownOpen(false);
                          handleOpenCreate('TAKEN_IN');
                        }}
                        className="w-full flex items-start space-x-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                            + Receive &amp; Hold Custody
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            Safekeep guest personal luggage, sealed envelope or property
                          </div>
                        </div>
                      </button>

                      {/* Option 3: Inter-Dept Handover */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewEntryDropdownOpen(false);
                          handleOpenCreate('INTER_DEPT');
                        }}
                        className="w-full flex items-start space-x-3 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300">
                            + Inter-Dept Handover
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            Internal operations, security, technical &amp; staff asset transfer
                          </div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end lg:self-auto">
            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title="Export Handover Registry to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* View Layout Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search item, guest name, room#, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Types (Lent / Custody / Inter-Dept)</option>
            <option value="GIVEN_OUT">Lent Out (Handover to Guest)</option>
            <option value="TAKEN_IN">In Custody (Takenover from Guest)</option>
            <option value="INTER_DEPT">Inter-Department Transfer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE_BORROWED">Active Borrowed / Lent</option>
            <option value="IN_CUSTODY_HOLDING">In Custody Holding</option>
            <option value="OVERDUE">Overdue for Return ⚠️</option>
            <option value="RETURNED">Returned & Reconciled</option>
            <option value="CLAIMED_PICKED_UP">Claimed / Picked Up</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Item Categories</option>
            <option value="Room Key">Room Key & Smart FOB</option>
            <option value="Access Card">Access Card</option>
            <option value="Chair / Table / Furniture">Chair / Table / Furniture</option>
            <option value="Pillow / Bed Linen / Blanket">Pillow / Bed Linen / Blanket</option>
            <option value="Electronics / Charger">Electronics / Charger</option>
            <option value="Sports Equipment">Sports Equipment</option>
            <option value="Tools / Hardware">Tools / Hardware</option>
            <option value="Other Assets">Other Assets</option>
          </select>
        </div>
      </div>

      {/* Main Records Display */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No Handover Records Matching Criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search query or filter tags, or create a new handover entry using the buttons above.
          </p>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecords.map((rec, idx) => {
            const today = getTodayDateString();
            const isOverdue =
              rec.status === 'ACTIVE_BORROWED' &&
              rec.expectedReturnDate &&
              rec.expectedReturnDate < today;

            const isHolding = rec.status === 'IN_CUSTODY_HOLDING';
            const isReturned = rec.status === 'RETURNED' || rec.status === 'CLAIMED_PICKED_UP';

            return (
              <motion.div
                key={`ho-card-${rec.id || 'rec'}-${idx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900/95 border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10'
                    : isHolding
                    ? 'border-emerald-200 dark:border-emerald-800/60'
                    : isReturned
                    ? 'border-slate-200 dark:border-slate-800 opacity-90'
                    : 'border-cyan-200/90 dark:border-cyan-800/70'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Header Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                          rec.type === 'GIVEN_OUT'
                            ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                            : rec.type === 'TAKEN_IN'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {rec.type === 'GIVEN_OUT'
                          ? 'Lent Out'
                          : rec.type === 'TAKEN_IN'
                          ? 'In Custody'
                          : 'Inter-Dept'}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                        {rec.id}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-xl flex items-center space-x-1 ${
                        isOverdue
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isHolding
                          ? 'bg-emerald-600 text-white'
                          : isReturned
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : 'bg-cyan-600 text-white'
                      }`}
                    >
                      <span>
                        {isOverdue
                          ? 'OVERDUE'
                          : isHolding
                          ? 'IN CUSTODY'
                          : isReturned
                          ? rec.status === 'CLAIMED_PICKED_UP'
                            ? 'CLAIMED'
                            : 'RETURNED'
                          : 'ACTIVE BORROWED'}
                      </span>
                    </span>
                  </div>

                  {/* Item Title & Category */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Tag className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>{rec.category}</span>
                        {rec.quantity > 1 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                            Qty: {rec.quantity}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1 leading-snug">
                        {rec.itemName}
                      </h4>
                    </div>

                    {rec.photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsPrintModalOpen(true);
                        }}
                        className="relative group shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-xs"
                        title="Click to view attached proof photo / print voucher"
                      >
                        <img
                          src={rec.photoUrl}
                          alt={rec.itemName}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Person Details Box */}
                  <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl p-2.5 space-y-1.5 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.type === 'TAKEN_IN' ? 'Deposited By:' : 'Handed To:'}</span>
                      </span>
                      <strong className="font-black text-slate-900 dark:text-white">
                        {rec.personName}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Contact / Phone:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {rec.phoneNumber}
                      </span>
                    </div>

                    {rec.roomNumber && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Room / Unit:</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-md">
                          {rec.roomNumber}
                        </span>
                      </div>
                    )}

                    {rec.departmentOrCompany && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Company / Dept:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {rec.departmentOrCompany}
                        </span>
                      </div>
                    )}

                    {rec.pickupAuthorizedPerson && (
                      <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <strong>Authorized Pickup:</strong> {rec.pickupAuthorizedPerson}
                      </div>
                    )}
                  </div>

                  {/* Dates & Timeline */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-lg p-1.5">
                      <span className="text-slate-400 block font-semibold">Issue Date:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.issueDate} ({formatDisplayTime(rec.issueTime)})
                      </span>
                    </div>

                    <div
                      className={`rounded-lg p-1.5 ${
                        isOverdue
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                          : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="text-slate-400 block font-semibold">
                        {isReturned ? 'Returned Date:' : 'Expected Return:'}
                      </span>
                      <span className="font-bold">
                        {isReturned
                          ? rec.actualReturnDate || 'Logged'
                          : rec.expectedReturnDate || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      "{rec.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* Direct WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => {
                        const msg = WhatsAppService.generateHandoverMessage(rec);
                        WhatsAppService.open(rec.phoneNumber, msg);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-200 dark:border-emerald-700/50"
                      title="Direct Share Handover Slip to Person via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* Customize WhatsApp */}
                    <button
                      type="button"
                      onClick={() => setWhatsAppRecord(rec)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      title="Customize WhatsApp Recipient / Message"
                    >
                      WA Edit
                    </button>

                    {/* Print Voucher */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(rec);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      title="Print Official Handover Voucher"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Record */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      title="Edit Record"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Record */}
                    <button
                      type="button"
                      onClick={() => handleDelete(rec)}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Status Action Button */}
                  {!isReturned ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(rec);
                        setReturnCondition('Good');
                        setReturnNotes('');
                        setIsReturnModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {rec.type === 'TAKEN_IN' ? 'Release to Guest' : 'Mark as Returned'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Reconciled</span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">ID / Type</th>
                  <th className="p-3.5">Item Description</th>
                  <th className="p-3.5">Person Name & Contact</th>
                  <th className="p-3.5">Room / Dept</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Expected Return</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecords.map((rec, idx) => {
                  const today = getTodayDateString();
                  const isOverdue =
                    rec.status === 'ACTIVE_BORROWED' &&
                    rec.expectedReturnDate &&
                    rec.expectedReturnDate < today;

                  return (
                    <tr
                      key={`ho-tbl-${rec.id || 'rec'}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                    >
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {rec.id}
                        </span>
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                          {rec.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white block font-bold">
                          {rec.itemName}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {rec.category} (Qty: {rec.quantity})
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {rec.personName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {rec.phoneNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {rec.roomNumber || '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {rec.departmentOrCompany || ''}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {rec.issueDate}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold ${
                            isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {rec.expectedReturnDate || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isOverdue
                              ? 'bg-rose-600 text-white'
                              : rec.status === 'IN_CUSTODY_HOLDING'
                              ? 'bg-emerald-600 text-white'
                              : rec.status === 'RETURNED' || rec.status === 'CLAIMED_PICKED_UP'
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-cyan-600 text-white'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const msg = WhatsAppService.generateHandoverMessage(rec);
                            WhatsAppService.open(rec.phoneNumber, msg);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 cursor-pointer"
                          title="Direct WhatsApp Share"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setWhatsAppRecord(rec)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                          title="Customize Recipient / Message"
                        >
                          WA
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(rec);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="Print Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 cursor-pointer"
                          title="Delete"
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
      )}

      {/* Modal 1: Create / Edit Handover Record */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-cyan-200 dark:border-cyan-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedRecord ? 'Edit Handover Record' : 'New Handover / Custody Entry'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Record asset loan, key issue, or safekeeping custody in reception registry.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveForm} className="space-y-4">
                {/* Transaction Type Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'GIVEN_OUT' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formData.type === 'GIVEN_OUT'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Lend Out to Guest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'TAKEN_IN' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formData.type === 'TAKEN_IN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Hold in Custody</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'INTER_DEPT' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formData.type === 'INTER_DEPT'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Inter-Department</span>
                  </button>
                </div>

                {/* Row 1: Item Category & Name & Qty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="Room Key">Room Key & Smart FOB</option>
                      <option value="Access Card">Access Card</option>
                      <option value="Chair / Table / Furniture">Chair / Table / Furniture</option>
                      <option value="Pillow / Bed Linen / Blanket">Pillow / Bed Linen / Blanket</option>
                      <option value="Electronics / Charger">Electronics / Charger</option>
                      <option value="Sports Equipment">Sports Equipment</option>
                      <option value="Tools / Hardware">Tools / Hardware</option>
                      <option value="Other Assets">Other Assets</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Item Description / Details *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Key Room 204, 2x Extra Pillows, Projector Cable"
                      value={formData.itemName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, itemName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Person Name & Phone & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formData.type === 'TAKEN_IN' ? 'Depositor Name *' : 'Recipient Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Eng. Khalid Al-Mansoor"
                      value={formData.personName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, personName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +966 50 123 4567"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Person Type
                    </label>
                    <select
                      value={formData.personType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, personType: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Resident Guest">Resident Guest</option>
                      <option value="VIP Guest">VIP Guest</option>
                      <option value="Company Employee">Company Employee</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Visitor">Visitor</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Room # & Department & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Room / Unit # (If Guest)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room R-04 / Suite 204"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, roomNumber: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Department / Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tamimi Maintenance / Aramco"
                      value={formData.departmentOrCompany}
                      onChange={(e) => setFormData((prev) => ({ ...prev, departmentOrCompany: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Row 4: Dates & Expected Return */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Issue / Deposit Date
                    </label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Return Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedReturnDate || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Item Condition
                    </label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="New / Pristine">New / Pristine</option>
                      <option value="Good">Good Working Condition</option>
                      <option value="Fair">Fair (Normal Wear)</option>
                      <option value="Damaged / Marked">Minor Existing Marks</option>
                    </select>
                  </div>
                </div>

                {/* If Custody: Authorized Friend / Collector details */}
                {formData.type === 'TAKEN_IN' && (
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      Authorized Friend / Driver to Pick Up Later (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Tariq (+966 54 111 2233) or Saudi National ID"
                      value={formData.pickupAuthorizedPerson}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pickupAuthorizedPerson: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Photo Upload Attachment */}
                <PhotoUploadField
                  label="Attach Item / Handover Photo (Optional)"
                  sublabel="Attach a live camera capture or image file for visual verification & printed slip"
                  value={formData.photoUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url }))}
                  accentColor="cyan"
                />

                {/* Notes & Staff In Charge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Authorized Staff (In Charge)
                    </label>
                    <input
                      type="text"
                      value={formData.authorizedByStaff}
                      onChange={(e) => setFormData((prev) => ({ ...prev, authorizedByStaff: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="Any specific instructions..."
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60 text-white text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Syncing...</span>
                      </>
                    ) : (
                      <span>{selectedRecord ? 'Save Changes' : 'Save & Register Handover'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Return / Release Verification Modal */}
      <AnimatePresence>
        {isReturnModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-300 dark:border-emerald-700 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedRecord.type === 'TAKEN_IN' ? 'Release Item to Owner / Friend' : 'Reconcile & Mark as Returned'}
                  </h3>
                  <p className="text-xs text-slate-500">Record ID: {selectedRecord.id}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <p>
                  <strong>Item:</strong> {selectedRecord.itemName} (Qty: {selectedRecord.quantity})
                </p>
                <p>
                  <strong>Person:</strong> {selectedRecord.personName} ({selectedRecord.phoneNumber})
                </p>
                {selectedRecord.roomNumber && (
                  <p>
                    <strong>Room:</strong> {selectedRecord.roomNumber}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inspected Condition Upon Return:
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Good">Good & Clean Condition</option>
                    <option value="Fair">Fair (Normal Usage)</option>
                    <option value="Damaged / Marked">Reported Damage / Missing Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Return Note / Handover Acknowledgement:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Returned to front desk by guest in person, key tested"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Digital Signature on Return */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      Signee Acknowledgement:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsReturnSigningOpen(!isReturnSigningOpen)}
                      className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      {returnSignature ? 'Re-sign' : isReturnSigningOpen ? 'Hide Pad' : '+ Sign on Screen'}
                    </button>
                  </div>

                  {returnSignature ? (
                    <div className="p-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Signature Captured
                        </span>
                      </div>
                      <img src={returnSignature} alt="Signature" className="h-8 max-w-[100px] object-contain bg-white rounded border" />
                    </div>
                  ) : isReturnSigningOpen ? (
                    <div className="mt-2">
                      <DigitalSignaturePad
                        title="Handover Return Signature"
                        signeeName={selectedRecord.personName}
                        onSave={(dataUrl) => {
                          setReturnSignature(dataUrl);
                          setIsReturnSigningOpen(false);
                        }}
                        onCancel={() => setIsReturnSigningOpen(false)}
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Click "+ Sign on Screen" for digital authorization.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Confirm & Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Delete Confirmation Modal */}
      <AnimatePresence>
        {recordToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Delete Handover Record?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    ID: {recordToDelete.id}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this handover record? It will be removed from your records and synchronized with Google Sheets.
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.itemName} (Qty: {recordToDelete.quantity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Person:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.personName} ({recordToDelete.phoneNumber})</span>
                </div>
                {recordToDelete.roomNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Room #:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.roomNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {recordToDelete.type === 'GIVEN_OUT' ? 'Lent Out' : recordToDelete.type === 'TAKEN_IN' ? 'In Custody' : 'Inter-Dept Transfer'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-md flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Record</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Printable A4 Official Handover Voucher */}
      <FacilityDocumentPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentType="HANDOVER"
        handoverData={selectedRecord}
      />

      {/* Modal 4.5: Confirmation Modal with Direct Print, WhatsApp Share, Copy ID & Done */}
      <FacilityEntryConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        documentType="HANDOVER"
        handoverData={selectedRecord}
        isSyncedToRemote={isSyncedToRemote}
      />

      {/* Modal 5: WhatsApp Share Customization Modal */}
      {whatsAppRecord && (
        <WhatsAppShareModal
          isOpen={!!whatsAppRecord}
          onClose={() => setWhatsAppRecord(null)}
          title={`WhatsApp Handover - ${whatsAppRecord.itemName}`}
          recipientName={whatsAppRecord.personName}
          defaultPhone={whatsAppRecord.phoneNumber}
          messageText={WhatsAppService.generateHandoverMessage(whatsAppRecord)}
          moduleLabel="Facility Handover & Custody Desk"
        />
      )}
    </div>
  );
};

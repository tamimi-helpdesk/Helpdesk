import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
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
  Lock,
  Eye,
  Camera,
  KeyRound,
  FileBadge,
  MapPin,
  Smartphone,
  Watch,
  Wallet,
  Briefcase,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LostFoundRecord, LostFoundType, LostFoundStatus } from '../types';
import { StorageService, getTodayDateString, formatDisplayTime } from '../services/storageService';
import { AuthService } from '../services/authService';
import { GasService } from '../services/gasService';
import { PhotoUploadField } from './PhotoUploadField';
import { FacilityDocumentPrintModal } from './FacilityDocumentPrintModal';
import { FacilityEntryConfirmationModal } from './FacilityEntryConfirmationModal';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import confetti from 'canvas-confetti';

interface LostFoundManagerProps {
  onRefresh?: () => void;
}

const CATEGORIES = [
  'Electronics & Smartphones',
  'Jewelry & Luxury Watches',
  'Wallets & Cash / Cards',
  'Passports & Official IDs',
  'Keys & FOBs',
  'Luggage & Bags',
  'Clothing & Apparel',
  'Eyeglasses / Sunglasses',
  'Other Personal Items',
];

export const LostFoundManager: React.FC<LostFoundManagerProps> = ({ onRefresh }) => {
  const [records, setRecords] = useState<LostFoundRecord[]>(() => StorageService.getLostFoundRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LostFoundType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LostFoundStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncedToRemote, setIsSyncedToRemote] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LostFoundRecord | null>(null);
  const [whatsAppRecord, setWhatsAppRecord] = useState<LostFoundRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<LostFoundRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<LostFoundRecord>>({
    recordType: 'FOUND_ITEM',
    category: 'Electronics & Smartphones',
    itemName: '',
    locationFoundOrLost: '',
    dateRecorded: getTodayDateString(),
    timeRecorded: '10:00',
    finderOrReporterName: '',
    finderOrReporterPhone: '',
    finderOrReporterType: 'Employee',
    storageLocker: 'Central Vault Safe #1',
    securitySealOrTag: '',
    distinctiveMarks: '',
    notes: '',
    photoUrl: '',
  });

  // Claim Release Form State
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerIdProof, setOwnerIdProof] = useState('');
  const [handedOverByStaff, setHandedOverByStaff] = useState(AuthService.getCurrentStaffName() || 'Security / Duty Officer');

  // Sync listener
  useEffect(() => {
    const handleUpdate = () => {
      setRecords(StorageService.getLostFoundRecords());
    };
    window.addEventListener('tamimi_lost_found_updated', handleUpdate);
    return () => window.removeEventListener('tamimi_lost_found_updated', handleUpdate);
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return records.filter((rec) => {
      // Type Filter
      if (typeFilter !== 'ALL' && rec.recordType !== typeFilter) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;

      // Category Filter
      if (categoryFilter !== 'ALL' && rec.category !== categoryFilter) return false;

      // Search Query
      if (query) {
        const matchesItem = rec.itemName?.toLowerCase().includes(query);
        const matchesLoc = rec.locationFoundOrLost?.toLowerCase().includes(query);
        const matchesFinder = rec.finderOrReporterName?.toLowerCase().includes(query);
        const matchesOwner = rec.ownerName?.toLowerCase().includes(query);
        const matchesPhone = rec.finderOrReporterPhone?.toLowerCase().includes(query) || rec.ownerPhone?.toLowerCase().includes(query);
        const matchesTag = rec.securitySealOrTag?.toLowerCase().includes(query);
        const matchesId = rec.id?.toLowerCase().includes(query);

        if (!matchesItem && !matchesLoc && !matchesFinder && !matchesOwner && !matchesPhone && !matchesTag && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [records, searchQuery, typeFilter, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const inVault = records.filter((r) => r.recordType === 'FOUND_ITEM' && r.status === 'IN_CUSTODY').length;
    const searching = records.filter((r) => r.recordType === 'LOST_INQUIRY' && r.status === 'REPORTED_SEARCHING').length;
    const returned = records.filter((r) => r.status === 'RETURNED_TO_OWNER').length;
    const highValue = records.filter((r) => r.category.includes('Electronics') || r.category.includes('Jewelry') || r.category.includes('Cash')).length;

    return { inVault, searching, returned, highValue, total: records.length };
  }, [records]);

  // Open Create Modal
  const handleOpenCreate = (presetType: LostFoundType) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setFormData({
      recordType: presetType,
      category: 'Electronics & Smartphones',
      itemName: '',
      locationFoundOrLost: '',
      dateRecorded: getTodayDateString(),
      timeRecorded: timeStr,
      finderOrReporterName: '',
      finderOrReporterPhone: '',
      finderOrReporterType: presetType === 'FOUND_ITEM' ? 'Housekeeping Staff' : 'Resident Guest',
      storageLocker: presetType === 'FOUND_ITEM' ? 'Central Vault Safe #1' : 'N/A (Lost Report)',
      securitySealOrTag: presetType === 'FOUND_ITEM' ? `SEC-TAG-${Math.floor(1000 + Math.random() * 9000)}` : '',
      distinctiveMarks: '',
      notes: '',
      photoUrl: '',
    });
    setSelectedRecord(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: LostFoundRecord) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setIsFormModalOpen(true);
  };

  // Submit Save
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.locationFoundOrLost || !formData.finderOrReporterName || !formData.finderOrReporterPhone) {
      return;
    }

    setIsSubmitting(true);
    try {
      const savedRecord = StorageService.saveLostFoundRecord({
        ...(selectedRecord ? { id: selectedRecord.id } : {}),
        recordType: formData.recordType || 'FOUND_ITEM',
        category: formData.category || 'Other Personal Items',
        itemName: formData.itemName,
        locationFoundOrLost: formData.locationFoundOrLost,
        dateRecorded: formData.dateRecorded || getTodayDateString(),
        timeRecorded: formData.timeRecorded || '10:00',
        finderOrReporterName: formData.finderOrReporterName,
        finderOrReporterPhone: formData.finderOrReporterPhone,
        finderOrReporterType: formData.finderOrReporterType || 'Employee',
        storageLocker: formData.storageLocker || 'Central Vault Safe #1',
        securitySealOrTag: formData.securitySealOrTag,
        distinctiveMarks: formData.distinctiveMarks,
        status: selectedRecord ? selectedRecord.status : (formData.recordType === 'LOST_INQUIRY' ? 'REPORTED_SEARCHING' : 'IN_CUSTODY'),
        notes: formData.notes,
        photoUrl: formData.photoUrl || '',
      });

      // Reset filters so the new record is prominently visible in the list immediately
      setTypeFilter('ALL');
      setStatusFilter('ALL');
      setCategoryFilter('ALL');
      setSearchQuery('');

      const latestList = StorageService.getLostFoundRecords();
      setRecords(latestList);

      // Real-time push to Google Sheets
      const remoteRes = await GasService.pushLostFoundToRemote(savedRecord);
      setIsSyncedToRemote(Boolean(remoteRes && remoteRes.success));

      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}

      setIsFormModalOpen(false);
      setSelectedRecord(savedRecord);
      setIsConfirmationModalOpen(true);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving lost & found record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Claim Release Confirmation
  const handleConfirmClaim = async () => {
    if (!selectedRecord) return;
    if (!ownerName || !ownerPhone || !ownerIdProof) {
      return;
    }

    const updatedRecord = StorageService.updateLostFoundStatus(selectedRecord.id, 'RETURNED_TO_OWNER', {
      ownerName,
      ownerPhone,
      ownerIdProof,
      handedOverByStaff,
    });

    if (updatedRecord) {
      // Real-time automatic background push to Google Sheets
      await GasService.pushLostFoundToRemote(updatedRecord).catch((err) =>
        console.warn('Auto-sync lost & found claim to sheet failed:', err)
      );
    }

    setRecords(StorageService.getLostFoundRecords());
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    setIsClaimModalOpen(false);
    setSelectedRecord(null);
    if (onRefresh) onRefresh();
  };

  // Delete Record Trigger & Confirm
  const handleDelete = (record: LostFoundRecord) => {
    setRecordToDelete(record);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    const idToDelete = recordToDelete.id;
    setIsDeleting(true);
    try {
      // 1. Delete from local storage & memory
      StorageService.deleteLostFoundRecord(idToDelete);
      setRecords(StorageService.getLostFoundRecords());

      // 2. Delete from Google Sheets
      await GasService.deleteLostFoundFromRemote(idToDelete);

      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Delete lost & found failed:', e);
    } finally {
      setIsDeleting(false);
      setRecordToDelete(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = StorageService.exportLostFoundCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tamimi_lost_and_found_${getTodayDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Action Control Strip & Filters */}
      <div className="bg-white dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Main Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Log Found Item (Vault Deposit) */}
            <button
              type="button"
              onClick={() => handleOpenCreate('FOUND_ITEM')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Found Item (Vault Custody)</span>
            </button>

            {/* 2. Log Lost Item Inquiry */}
            <button
              type="button"
              onClick={() => handleOpenCreate('LOST_INQUIRY')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-500" />
              <span>+ Report Lost Item Inquiry</span>
            </button>
          </div>

          <div className="flex items-center space-x-2.5 self-end lg:self-auto">
            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title="Export Lost & Found Registry to CSV"
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
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
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
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
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
              placeholder="Search item, location, finder, owner, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Records (Found Items & Lost Reports)</option>
            <option value="FOUND_ITEM">Found Items (In Vault Custody)</option>
            <option value="LOST_INQUIRY">Lost Item Inquiries (Reported)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_CUSTODY">In Vault Custody</option>
            <option value="REPORTED_SEARCHING">Active Searching</option>
            <option value="RETURNED_TO_OWNER">Returned & Claim Verified</option>
            <option value="DISPOSED_AUCTIONED">Disposed / Auctioned</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Item Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Records Display */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No Lost & Found Items Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or register a new found item / lost inquiry.
          </p>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecords.map((rec, idx) => {
            const isFound = rec.recordType === 'FOUND_ITEM';
            const isReturned = rec.status === 'RETURNED_TO_OWNER';
            const isSearching = rec.status === 'REPORTED_SEARCHING';

            return (
              <motion.div
                key={`lf-card-${rec.id || 'rec'}-${idx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900/95 border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isFound && !isReturned
                    ? 'border-emerald-200/90 dark:border-emerald-800/70'
                    : isSearching
                    ? 'border-amber-200/90 dark:border-amber-800/70 bg-amber-50/15 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Header Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                          isFound
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {isFound ? 'Found in Facility' : 'Lost Item Report'}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                        {rec.id}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-xl flex items-center space-x-1 ${
                        rec.status === 'IN_CUSTODY'
                          ? 'bg-emerald-600 text-white'
                          : rec.status === 'REPORTED_SEARCHING'
                          ? 'bg-amber-600 text-white animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>
                        {rec.status === 'IN_CUSTODY'
                          ? 'IN VAULT CUSTODY'
                          : rec.status === 'REPORTED_SEARCHING'
                          ? 'SEARCHING'
                          : 'RETURNED TO OWNER'}
                      </span>
                    </span>
                  </div>

                  {/* Item Description & Category */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{rec.category}</span>
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
                        title="Click to view recovered item photo / print voucher"
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

                  {/* Location & Finder/Owner Info Box */}
                  <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl p-2.5 space-y-1.5 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isFound ? 'Found Location:' : 'Lost Location:'}</span>
                      </span>
                      <strong className="font-bold text-slate-900 dark:text-white">
                        {rec.locationFoundOrLost}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {isFound ? 'Finder / Turned In By:' : 'Reported By:'}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {rec.finderOrReporterName} ({rec.finderOrReporterPhone})
                      </span>
                    </div>

                    {rec.storageLocker && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Storage Locker:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                          {rec.storageLocker}
                        </span>
                      </div>
                    )}

                    {rec.securitySealOrTag && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Security Tag #:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {rec.securitySealOrTag}
                        </span>
                      </div>
                    )}

                    {isReturned && (
                      <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <strong>Claimed By:</strong> {rec.ownerName} ({rec.ownerPhone}) • Proof: {rec.ownerIdProof}
                      </div>
                    )}
                  </div>

                  {rec.distinctiveMarks && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/50 p-2 rounded-lg">
                      <strong>Marks:</strong> {rec.distinctiveMarks}
                    </div>
                  )}

                  {/* Dates & Timeline */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-lg p-1.5">
                      <span className="text-slate-400 block font-semibold">Recorded Date:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.dateRecorded} ({formatDisplayTime(rec.timeRecorded)})
                      </span>
                    </div>

                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-lg p-1.5">
                      <span className="text-slate-400 block font-semibold">
                        {isReturned ? 'Claim Date:' : 'Status Detail:'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isReturned ? rec.claimDate || 'Reconciled' : 'In Vault Holding'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* Direct WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => {
                        const phone = rec.ownerPhone || rec.finderOrReporterPhone || '';
                        const msg = WhatsAppService.generateLostFoundMessage(rec);
                        WhatsAppService.open(phone, msg);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-200 dark:border-emerald-700/50"
                      title="Direct Share Lost & Found Details via WhatsApp"
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
                      title="Print Property Voucher"
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
                        setOwnerName('');
                        setOwnerPhone('');
                        setOwnerIdProof('Saudi National ID / Iqama');
                        setHandedOverByStaff(AuthService.getCurrentStaffName() || 'Security / Duty Officer');
                        setIsClaimModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Release to Owner</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Claimed</span>
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
                  <th className="p-3.5">Record ID / Type</th>
                  <th className="p-3.5">Item Description & Marks</th>
                  <th className="p-3.5">Location Found / Lost</th>
                  <th className="p-3.5">Finder / Reporter</th>
                  <th className="p-3.5">Storage Vault</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecords.map((rec, idx) => (
                  <tr
                    key={`lf-tbl-${rec.id || 'rec'}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                  >
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {rec.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {rec.recordType}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <strong className="text-slate-900 dark:text-white block font-bold">
                        {rec.itemName}
                      </strong>
                      <span className="text-[11px] text-slate-500">{rec.category}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {rec.locationFoundOrLost}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {rec.finderOrReporterName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {rec.finderOrReporterPhone}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {rec.storageLocker}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          rec.status === 'IN_CUSTODY'
                            ? 'bg-emerald-600 text-white'
                            : rec.status === 'REPORTED_SEARCHING'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const phone = rec.ownerPhone || rec.finderOrReporterPhone || '';
                          const msg = WhatsAppService.generateLostFoundMessage(rec);
                          WhatsAppService.open(phone, msg);
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add / Edit Lost & Found Record */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedRecord ? 'Edit Lost & Found Record' : 'Register Found Item / Lost Inquiry'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Record discovered property, assign vault storage safe & security seal tag.
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, recordType: 'FOUND_ITEM' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formData.recordType === 'FOUND_ITEM'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Found Item (Vault Deposit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, recordType: 'LOST_INQUIRY' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      formData.recordType === 'LOST_INQUIRY'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Lost Item Report (Inquiry)</span>
                  </button>
                </div>

                {/* Row 1: Category & Item Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Item Description / Brand / Model *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apple iPhone 15 Pro (Black), Gold Seiko Watch, Black Leather Wallet"
                      value={formData.itemName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, itemName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Location & Distinctive Marks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Location Where Found or Lost *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gym Changing Room, Swimming Pool Deck, Dining Hall Table 4"
                      value={formData.locationFoundOrLost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, locationFoundOrLost: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Distinctive Marks / Serial # / Engravings
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Crack on top glass, initial 'K.M' on case"
                      value={formData.distinctiveMarks}
                      onChange={(e) => setFormData((prev) => ({ ...prev, distinctiveMarks: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Row 3: Finder / Reporter Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formData.recordType === 'FOUND_ITEM' ? 'Finder / Staff Name *' : 'Reporter Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Housekeeper Mariam"
                      value={formData.finderOrReporterName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, finderOrReporterName: e.target.value }))}
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
                      value={formData.finderOrReporterPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, finderOrReporterPhone: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Person Role
                    </label>
                    <select
                      value={formData.finderOrReporterType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, finderOrReporterType: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Housekeeping Staff">Housekeeping Staff</option>
                      <option value="Security Guard">Security Guard</option>
                      <option value="Front Desk Concierge">Front Desk Concierge</option>
                      <option value="Resident Guest">Resident Guest</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Maintenance Worker">Maintenance Worker</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Vault Locker & Security Seal */}
                {formData.recordType === 'FOUND_ITEM' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Storage Safe / Vault Locker
                      </label>
                      <select
                        value={formData.storageLocker}
                        onChange={(e) => setFormData((prev) => ({ ...prev, storageLocker: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Central Vault Safe #1">Central Vault Safe #1 (High Valuables)</option>
                        <option value="Central Vault Safe #2">Central Vault Safe #2 (Phones & IDs)</option>
                        <option value="Security Cupboard Shelf A">Security Cupboard Shelf A (Bags / Clothes)</option>
                        <option value="Front Desk Key Cabinet">Front Desk Key Cabinet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Security Tag / Seal #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SEC-TAG-8921"
                        value={formData.securitySealOrTag}
                        onChange={(e) => setFormData((prev) => ({ ...prev, securitySealOrTag: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Photo Upload Attachment */}
                <PhotoUploadField
                  label="Attach Item Photo Proof (Optional)"
                  sublabel="Visual snapshot of the lost or recovered item for identification & verification"
                  value={formData.photoUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url }))}
                  accentColor="emerald"
                />

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Internal Staff Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Checked phone IMEI, device locked with passcode"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Syncing...</span>
                      </>
                    ) : (
                      <span>{selectedRecord ? 'Save Changes' : 'Register Record'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Claim & Release to Owner */}
      <AnimatePresence>
        {isClaimModalOpen && selectedRecord && (
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
                    Verify & Release Property to Owner
                  </h3>
                  <p className="text-xs text-slate-500">Record ID: {selectedRecord.id}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <p>
                  <strong>Item:</strong> {selectedRecord.itemName}
                </p>
                <p>
                  <strong>Found at:</strong> {selectedRecord.locationFoundOrLost}
                </p>
                {selectedRecord.storageLocker && (
                  <p>
                    <strong>Vault Safe:</strong> {selectedRecord.storageLocker}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Claimant / Owner Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Tariq Al-Ghamdi"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Claimant Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +966 50 123 4567"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Verified ID Document Proof *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saudi National ID / Iqama / Passport # verified"
                    value={ownerIdProof}
                    onChange={(e) => setOwnerIdProof(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Handed Over By (Security Staff):
                  </label>
                  <input
                    type="text"
                    value={handedOverByStaff}
                    onChange={(e) => setHandedOverByStaff(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClaim}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Authorize Property Release
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
                    Delete Lost & Found Item?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    ID: {recordToDelete.id}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this property record? It will be removed from your records and synchronized with Google Sheets.
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.locationFoundOrLost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {recordToDelete.recordType === 'FOUND_ITEM' ? 'Found Property' : 'Lost / Missing Report'}
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

      {/* Modal 4: Printable Property Release Voucher */}
      <FacilityDocumentPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentType="LOST_FOUND"
        lostFoundData={selectedRecord}
      />

      {/* Modal 4.5: Confirmation Modal with Direct Print, WhatsApp Share, Copy ID & Done */}
      <FacilityEntryConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        documentType="LOST_FOUND"
        lostFoundData={selectedRecord}
        isSyncedToRemote={isSyncedToRemote}
      />

      {/* Modal 5: WhatsApp Share Customization Modal */}
      {whatsAppRecord && (
        <WhatsAppShareModal
          isOpen={!!whatsAppRecord}
          onClose={() => setWhatsAppRecord(null)}
          title={`WhatsApp Notice - ${whatsAppRecord.itemName}`}
          recipientName={whatsAppRecord.ownerName || whatsAppRecord.finderOrReporterName || 'Guest'}
          defaultPhone={whatsAppRecord.ownerPhone || whatsAppRecord.finderOrReporterPhone || ''}
          messageText={WhatsAppService.generateLostFoundMessage(whatsAppRecord)}
          moduleLabel="Lost & Found Department"
        />
      )}
    </div>
  );
};

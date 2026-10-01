import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Truck,
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
  Layers,
  ChevronDown,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Send,
  ShieldAlert,
  Crown,
  MapPin,
  Barcode,
  Navigation,
  Eye,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParcelRecord, ParcelStatus, CourierCompany } from '../types';
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

interface ParcelManagerProps {
  onRefresh?: () => void;
}

const POPULAR_COURIERS: CourierCompany[] = [
  'Aramex',
  'DHL Express',
  'SMSA Express',
  'FedEx',
  'Amazon Delivery',
  'Naqel Express',
  'Saudi Post (SPL)',
  'UPS',
  'Noon Express',
  'Other Courier',
];

export const ParcelManager: React.FC<ParcelManagerProps> = ({ onRefresh }) => {
  const [records, setRecords] = useState<ParcelRecord[]>(() => StorageService.getParcelRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ParcelStatus>('ALL');
  const [courierFilter, setCourierFilter] = useState<'ALL' | CourierCompany>('ALL');
  const [vipOnlyFilter, setVipOnlyFilter] = useState(false);
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncedToRemote, setIsSyncedToRemote] = useState(true);
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [deliverySignature, setDeliverySignature] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<ParcelRecord | null>(null);
  const [whatsAppRecord, setWhatsAppRecord] = useState<ParcelRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<ParcelRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<ParcelRecord>>({
    trackingNumber: '',
    courierCompany: 'Aramex',
    recipientName: '',
    roomNumber: '',
    departmentOrCompany: '',
    phoneNumber: '',
    vipStatus: false,
    parcelType: 'Small Box',
    storageLocation: 'Parcel Holding Rack A',
    receivedDate: getTodayDateString(),
    receivedTime: '10:00',
    receivedByStaff: AuthService.getCurrentStaffName() || 'Front Desk Concierge',
    notes: '',
    photoUrl: '',
  });

  // Delivery Form State
  const [deliveryType, setDeliveryType] = useState<'HANDED_TO_GUEST' | 'DELIVERED_TO_ROOM' | 'COLLECTED_BY_REP'>('HANDED_TO_GUEST');
  const [deliveredByStaff, setDeliveredByStaff] = useState(AuthService.getCurrentStaffName() || 'Front Desk Concierge');
  const [collectedByPerson, setCollectedByPerson] = useState('');

  // Sync listener
  useEffect(() => {
    const handleUpdate = () => {
      setRecords([...StorageService.getParcelRecords()]);
    };
    window.addEventListener('tamimi_parcels_updated', handleUpdate);
    return () => window.removeEventListener('tamimi_parcels_updated', handleUpdate);
  }, []);

  // Filtered Parcels
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return records.filter((rec) => {
      // Status Filter
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;

      // Courier Filter
      if (courierFilter !== 'ALL' && rec.courierCompany !== courierFilter) return false;

      // VIP Only Filter
      if (vipOnlyFilter && !rec.vipStatus) return false;

      // Search Query
      if (query) {
        const matchesRecipient = rec.recipientName?.toLowerCase().includes(query);
        const matchesTracking = rec.trackingNumber?.toLowerCase().includes(query);
        const matchesRoom = rec.roomNumber?.toLowerCase().includes(query);
        const matchesPhone = rec.phoneNumber?.toLowerCase().includes(query);
        const matchesDept = rec.departmentOrCompany?.toLowerCase().includes(query);
        const matchesCourier = rec.courierCompany?.toLowerCase().includes(query);
        const matchesId = rec.id?.toLowerCase().includes(query);

        if (!matchesRecipient && !matchesTracking && !matchesRoom && !matchesPhone && !matchesDept && !matchesCourier && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, courierFilter, vipOnlyFilter]);

  // Stats Calculation
  const stats = useMemo(() => {
    const inOffice = records.filter((r) => r.status === 'RECEIVED_IN_OFFICE').length;
    const outForDelivery = records.filter((r) => r.status === 'OUT_FOR_ROOM_DELIVERY').length;
    const delivered = records.filter((r) => r.status === 'HANDED_TO_GUEST' || r.status === 'DELIVERED_TO_ROOM' || r.status === 'COLLECTED_BY_REP').length;
    const vipCount = records.filter((r) => r.vipStatus && r.status !== 'HANDED_TO_GUEST' && r.status !== 'DELIVERED_TO_ROOM').length;

    return {
      inOffice,
      outForDelivery,
      delivered,
      vipCount,
      total: records.length,
    };
  }, [records]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setFormData({
      trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
      courierCompany: 'Aramex',
      recipientName: '',
      roomNumber: '',
      departmentOrCompany: '',
      phoneNumber: '',
      vipStatus: false,
      parcelType: 'Small Box',
      storageLocation: 'Parcel Holding Rack A',
      receivedDate: getTodayDateString(),
      receivedTime: timeStr,
      receivedByStaff: AuthService.getCurrentStaffName() || 'Front Desk Concierge',
      notes: '',
      photoUrl: '',
    });
    setSelectedRecord(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: ParcelRecord) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setIsFormModalOpen(true);
  };

  // Save Parcel
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trackingNumber || !formData.recipientName || !formData.roomNumber || !formData.phoneNumber) {
      return;
    }

    setIsSubmitting(true);
    try {
      const savedRecord = StorageService.saveParcelRecord({
        ...(selectedRecord ? { id: selectedRecord.id } : {}),
        trackingNumber: formData.trackingNumber,
        courierCompany: formData.courierCompany || 'Aramex',
        recipientName: formData.recipientName,
        roomNumber: formData.roomNumber,
        departmentOrCompany: formData.departmentOrCompany,
        phoneNumber: formData.phoneNumber,
        vipStatus: Boolean(formData.vipStatus),
        parcelType: formData.parcelType || 'Small Box',
        storageLocation: formData.storageLocation || 'Parcel Holding Rack A',
        receivedDate: formData.receivedDate || getTodayDateString(),
        receivedTime: formData.receivedTime || '10:00',
        receivedByStaff: formData.receivedByStaff || 'Front Desk Staff',
        status: selectedRecord ? selectedRecord.status : 'RECEIVED_IN_OFFICE',
        notes: formData.notes,
        photoUrl: formData.photoUrl || '',
      });

      // Reset filters so the new record is prominently visible in the list immediately
      setStatusFilter('ALL');
      setCourierFilter('ALL');
      setVipOnlyFilter(false);
      setSearchQuery('');

      const latestList = StorageService.getParcelRecords();
      setRecords([...latestList]);

      // Real-time push to Google Sheets
      const remoteRes = await GasService.pushParcelToRemote(savedRecord);
      setIsSyncedToRemote(Boolean(remoteRes && remoteRes.success));

      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}

      setIsFormModalOpen(false);
      setSelectedRecord(savedRecord);
      setIsConfirmationModalOpen(true);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving parcel record:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delivery / Handover
  const handleConfirmDelivery = async () => {
    if (!selectedRecord) return;
    
    let updatedRecord = StorageService.updateParcelStatus(selectedRecord.id, deliveryType, {
      deliveredByStaff,
      collectedByPerson: deliveryType === 'COLLECTED_BY_REP' ? collectedByPerson : selectedRecord.recipientName,
    });

    if (updatedRecord && deliverySignature) {
      updatedRecord.secondaryPhotoUrl = deliverySignature;
      StorageService.saveParcelRecord(updatedRecord);
    }

    if (updatedRecord) {
      // Real-time automatic background push to Google Sheets
      await GasService.pushParcelToRemote(updatedRecord).catch((err) =>
        console.warn('Auto-sync parcel delivery to sheet failed:', err)
      );
    }

    setRecords([...StorageService.getParcelRecords()]);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    setIsDeliverModalOpen(false);
    setIsSigningOpen(false);
    setDeliverySignature('');
    setSelectedRecord(null);
    if (onRefresh) onRefresh();
  };

  // Delete Parcel Record Trigger & Confirm
  const handleDelete = (record: ParcelRecord) => {
    setRecordToDelete(record);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    const idToDelete = recordToDelete.id;
    setIsDeleting(true);
    try {
      // 1. Delete from local storage & memory
      StorageService.deleteParcelRecord(idToDelete);
      setRecords([...StorageService.getParcelRecords()]);

      // 2. Delete from Google Sheets
      await GasService.deleteParcelFromRemote(idToDelete);

      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Delete parcel failed:', e);
    } finally {
      setIsDeleting(false);
      setRecordToDelete(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = StorageService.exportParcelCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tamimi_parcel_registry_${getTodayDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* In Office Holding */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Holding in Office
            </span>
            <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.inOffice}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Awaiting guest</span>
          </div>
        </div>

        {/* Out for Room Delivery */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-blue-200/80 dark:border-blue-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              En Route Delivery
            </span>
            <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {stats.outForDelivery}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Concierge runner</span>
          </div>
        </div>

        {/* VIP Packages Pending */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-purple-200/80 dark:border-purple-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              VIP Packages
            </span>
            <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <Crown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.vipCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Priority notice</span>
          </div>
        </div>

        {/* Delivered & Signed */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Delivered & Handed
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.delivered}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Completed log</span>
          </div>
        </div>

        {/* Total Inbound Packages */}
        <div className="bg-white dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Inbound
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">All couriers</span>
          </div>
        </div>
      </div>

      {/* Action Control Strip & Filters */}
      <div className="bg-white dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Main Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Log New Inbound Courier */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-black shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Inbound Courier Package</span>
            </button>

            {/* Quick Courier Preset Pills */}
            <div className="hidden sm:flex items-center space-x-1.5 overflow-x-auto py-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Popular:</span>
              {['Aramex', 'DHL Express', 'SMSA Express', 'Amazon Delivery'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCourierFilter(c as any);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    courierFilter === c
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end lg:self-auto">
            {/* VIP Filter Toggle */}
            <button
              type="button"
              onClick={() => setVipOnlyFilter((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                vipOnlyFilter
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-purple-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              <span>VIP Only</span>
            </button>

            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title="Export Parcels to CSV"
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
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
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
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipient, room#, tracking#, courier, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Courier Filter */}
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Courier Companies</option>
            {POPULAR_COURIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="RECEIVED_IN_OFFICE">Received in Concierge Office</option>
            <option value="OUT_FOR_ROOM_DELIVERY">Out for Room Delivery</option>
            <option value="HANDED_TO_GUEST">Handed to Guest at Desk</option>
            <option value="DELIVERED_TO_ROOM">Delivered to Guest Room</option>
            <option value="COLLECTED_BY_REP">Collected by Representative</option>
            <option value="RETURNED_TO_COURIER">Returned to Courier</option>
          </select>
        </div>
      </div>

      {/* Main Records Display */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No Packages Found Matching Criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, clear courier filters, or log a new incoming package.
          </p>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecords.map((rec, idx) => {
            const isPending = rec.status === 'RECEIVED_IN_OFFICE';
            const isEnRoute = rec.status === 'OUT_FOR_ROOM_DELIVERY';
            const isDelivered =
              rec.status === 'HANDED_TO_GUEST' ||
              rec.status === 'DELIVERED_TO_ROOM' ||
              rec.status === 'COLLECTED_BY_REP';

            return (
              <motion.div
                key={`pm-card-${rec.id || 'rec'}-${idx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900/95 border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                  rec.vipStatus
                    ? 'border-purple-300 dark:border-purple-800/80 bg-purple-50/15 dark:bg-purple-950/10'
                    : isPending
                    ? 'border-amber-200/90 dark:border-amber-800/70'
                    : isEnRoute
                    ? 'border-blue-300 dark:border-blue-800/80'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Header Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        {rec.courierCompany}
                      </span>

                      {rec.vipStatus && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-600 text-white flex items-center space-x-1 shadow-xs">
                          <Crown className="w-3 h-3" />
                          <span>VIP</span>
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-xl flex items-center space-x-1 ${
                        isPending
                          ? 'bg-amber-600 text-white'
                          : isEnRoute
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <span>
                        {isPending
                          ? 'IN OFFICE'
                          : isEnRoute
                          ? 'OUT FOR DELIVERY'
                          : rec.status === 'DELIVERED_TO_ROOM'
                          ? 'DELIVERED TO ROOM'
                          : rec.status === 'COLLECTED_BY_REP'
                          ? 'COLLECTED BY REP'
                          : 'HANDED TO GUEST'}
                      </span>
                    </span>
                  </div>

                  {/* Recipient & Tracking Block */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-slate-500 font-bold flex items-center space-x-1">
                          <Barcode className="w-3.5 h-3.5 text-amber-600" />
                          <span>{rec.trackingNumber}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {rec.parcelType}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-1 leading-snug">
                        {rec.recipientName}
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
                        title="Click to view package label / print slip"
                      >
                        <img
                          src={rec.photoUrl}
                          alt={rec.trackingNumber}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Location & Contact Details */}
                  <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl p-2.5 space-y-1.5 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Room / Unit:</span>
                      </span>
                      <strong className="font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-md">
                        {rec.roomNumber}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Contact / Phone:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {rec.phoneNumber}
                      </span>
                    </div>

                    {rec.departmentOrCompany && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Company:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {rec.departmentOrCompany}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>Storage Location:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.storageLocation}
                      </span>
                    </div>
                  </div>

                  {/* Arrival & Delivery Times */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-lg p-1.5">
                      <span className="text-slate-400 block font-semibold">Received:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.receivedDate} ({formatDisplayTime(rec.receivedTime)})
                      </span>
                    </div>

                    <div className="bg-slate-100/60 dark:bg-slate-800/40 rounded-lg p-1.5">
                      <span className="text-slate-400 block font-semibold">
                        {isDelivered ? 'Delivered Time:' : 'Handler Staff:'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {isDelivered
                          ? `${rec.deliveredDate || ''} ${formatDisplayTime(rec.deliveredTime || '')}`
                          : rec.receivedByStaff}
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
                        const msg = WhatsAppService.generateParcelMessage(rec);
                        WhatsAppService.open(rec.phoneNumber, msg);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-200 dark:border-emerald-700/50"
                      title="Direct Share Package Info to Guest via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* Customize WhatsApp Modal */}
                    <button
                      type="button"
                      onClick={() => setWhatsAppRecord(rec)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      title="Edit Phone Number / Message and Send"
                    >
                      WA Edit
                    </button>

                    {/* Print Slip */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(rec);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      title="Print Package Receiving Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Record */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      title="Edit Parcel Info"
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
                  {!isDelivered ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(rec);
                        setDeliveryType('HANDED_TO_GUEST');
                        setDeliveredByStaff(AuthService.getCurrentStaffName() || 'Front Desk Concierge');
                        setCollectedByPerson(rec.recipientName);
                        setIsDeliverModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Deliver / Hand Over</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Delivered</span>
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
                  <th className="p-3.5">Tracking # / Courier</th>
                  <th className="p-3.5">Recipient Name & Contact</th>
                  <th className="p-3.5">Room # & Dept</th>
                  <th className="p-3.5">Storage Rack</th>
                  <th className="p-3.5">Received Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecords.map((rec, idx) => (
                  <tr
                    key={`pm-tbl-${rec.id || 'rec'}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-medium"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {rec.trackingNumber}
                        </span>
                        {rec.vipStatus && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {rec.courierCompany} • {rec.parcelType}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <strong className="text-slate-900 dark:text-white block font-bold">
                        {rec.recipientName}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {rec.phoneNumber}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {rec.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {rec.departmentOrCompany || ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {rec.storageLocation}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {rec.receivedDate}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          rec.status === 'RECEIVED_IN_OFFICE'
                            ? 'bg-amber-600 text-white'
                            : rec.status === 'OUT_FOR_ROOM_DELIVERY'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = WhatsAppService.generateParcelMessage(rec);
                          WhatsAppService.open(rec.phoneNumber, msg);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 cursor-pointer"
                        title="Send WhatsApp Notification"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhatsAppRecord(rec)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                        title="Customize WhatsApp Recipient"
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
                        title="Print Slip"
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

      {/* Modal 1: Add / Edit Parcel Record */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-200 dark:border-amber-800 shadow-2xl p-5 sm:p-7 space-y-5 my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedRecord ? 'Edit Parcel Entry' : 'Log Inbound Courier Package'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Record incoming courier shipment, storage shelf, and recipient notification details.
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
                {/* Row 1: Tracking Number & Courier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tracking / Waybill Number *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 3290481239"
                        value={formData.trackingNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Courier / Shipping Company *
                    </label>
                    <select
                      value={formData.courierCompany}
                      onChange={(e) => setFormData((prev) => ({ ...prev, courierCompany: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    >
                      {POPULAR_COURIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Recipient Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient / Guest Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Eng. Tariq Al-Ghamdi"
                      value={formData.recipientName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient Phone Number *
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
                </div>

                {/* Row 3: Room # & VIP Status & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Room / Villa / Unit # *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 302 / Villa B-12"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, roomNumber: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Halliburton / Schlumberger"
                      value={formData.departmentOrCompany}
                      onChange={(e) => setFormData((prev) => ({ ...prev, departmentOrCompany: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-2 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 cursor-pointer text-xs font-bold text-purple-900 dark:text-purple-200">
                      <input
                        type="checkbox"
                        checked={formData.vipStatus}
                        onChange={(e) => setFormData((prev) => ({ ...prev, vipStatus: e.target.checked }))}
                        className="rounded-sm text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span>Mark VIP Priority</span>
                    </label>
                  </div>
                </div>

                {/* Row 4: Package Type & Storage Shelf */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Package Type
                    </label>
                    <select
                      value={formData.parcelType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, parcelType: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Document / Envelope">Document / Letter Envelope</option>
                      <option value="Small Box">Small Box (Shoebox size)</option>
                      <option value="Medium Carton">Medium Carton Box</option>
                      <option value="Large Freight / Heavy">Large Freight / Heavy Shipment</option>
                      <option value="Fragile Electronics">Fragile Electronics / Glass</option>
                      <option value="Perishable / Food">Perishable / Cold Storage Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Storage Holding Location
                    </label>
                    <select
                      value={formData.storageLocation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, storageLocation: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Parcel Holding Rack A">Parcel Holding Rack A (General)</option>
                      <option value="Parcel Holding Rack B">Parcel Holding Rack B (Cartons)</option>
                      <option value="Front Desk Safe / Vault">Front Desk Safe / Vault (Valuables)</option>
                      <option value="VIP Priority Shelf">VIP Priority Shelf (Urgent Dispatch)</option>
                      <option value="Cold Room / Fridge">Cold Room / Fridge Storage</option>
                    </select>
                  </div>
                </div>

                {/* Photo Upload Attachment */}
                <PhotoUploadField
                  label="Attach Package / Shipping Label Photo (Optional)"
                  sublabel="Visual proof of received parcel label, condition, and tracking sticker"
                  value={formData.photoUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url }))}
                  accentColor="amber"
                />

                {/* Row 5: Receiving Staff & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Receiving Staff In Charge
                    </label>
                    <input
                      type="text"
                      value={formData.receivedByStaff}
                      onChange={(e) => setFormData((prev) => ({ ...prev, receivedByStaff: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Additional Handling Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call guest upon arrival, fragile sticker"
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-60 text-white text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Syncing...</span>
                      </>
                    ) : (
                      <span>{selectedRecord ? 'Save Changes' : 'Register Inbound Package'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Deliver / Handover Package Modal */}
      <AnimatePresence>
        {isDeliverModalOpen && selectedRecord && (
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
                    Deliver & Complete Package Handover
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Tracking: {selectedRecord.trackingNumber}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <p>
                  <strong>Recipient:</strong> {selectedRecord.recipientName} ({selectedRecord.phoneNumber})
                </p>
                <p>
                  <strong>Room #:</strong> {selectedRecord.roomNumber} ({selectedRecord.courierCompany})
                </p>
                <p>
                  <strong>Package:</strong> {selectedRecord.parcelType} • {selectedRecord.storageLocation}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery / Handover Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('HANDED_TO_GUEST')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                        deliveryType === 'HANDED_TO_GUEST'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Desk Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('DELIVERED_TO_ROOM')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                        deliveryType === 'DELIVERED_TO_ROOM'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Room Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('COLLECTED_BY_REP')}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                        deliveryType === 'COLLECTED_BY_REP'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Rep Pickup
                    </button>
                  </div>
                </div>

                {deliveryType === 'COLLECTED_BY_REP' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Representative Collector Name & Phone:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Salman (+966 55 123 4567)"
                      value={collectedByPerson}
                      onChange={(e) => setCollectedByPerson(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delivered By (Staff Name):
                  </label>
                  <input
                    type="text"
                    value={deliveredByStaff}
                    onChange={(e) => setDeliveredByStaff(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Digital Signature Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      Recipient Signature Proof:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSigningOpen(!isSigningOpen)}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {deliverySignature ? 'Re-sign' : isSigningOpen ? 'Hide Pad' : '+ Sign on Screen'}
                    </button>
                  </div>

                  {deliverySignature ? (
                    <div className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Digital Signature Captured
                        </span>
                      </div>
                      <img src={deliverySignature} alt="Signature" className="h-8 max-w-[100px] object-contain bg-white rounded border" />
                    </div>
                  ) : isSigningOpen ? (
                    <div className="mt-2">
                      <DigitalSignaturePad
                        title="Recipient Digital Signature"
                        signeeName={deliveryType === 'COLLECTED_BY_REP' ? collectedByPerson : selectedRecord.recipientName}
                        onSave={(dataUrl) => {
                          setDeliverySignature(dataUrl);
                          setIsSigningOpen(false);
                        }}
                        onCancel={() => setIsSigningOpen(false)}
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Click "+ Sign on Screen" for touch screen or stylus signature.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeliverModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Confirm Delivery
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
                    Delete Parcel Record?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    Tracking: {recordToDelete.trackingNumber}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this parcel log? It will be removed from your records and synchronized with Google Sheets.
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room / Unit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Courier:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.courierCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type / Size:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recordToDelete.parcelType}</span>
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
                      <span>Yes, Delete Parcel</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Printable Package Slip */}
      <FacilityDocumentPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentType="PARCEL"
        parcelData={selectedRecord}
      />

      {/* Modal 4.5: Confirmation Modal with Direct Print, WhatsApp Share, Copy ID & Done */}
      <FacilityEntryConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        documentType="PARCEL"
        parcelData={selectedRecord}
        isSyncedToRemote={isSyncedToRemote}
      />

      {/* Modal 6: WhatsApp Share Customization Modal */}
      {whatsAppRecord && (
        <WhatsAppShareModal
          isOpen={!!whatsAppRecord}
          onClose={() => setWhatsAppRecord(null)}
          title={`WhatsApp Parcel Notice - ${whatsAppRecord.trackingNumber}`}
          recipientName={whatsAppRecord.recipientName}
          defaultPhone={whatsAppRecord.phoneNumber}
          messageText={WhatsAppService.generateParcelMessage(whatsAppRecord)}
          moduleLabel="Parcel / Courier Reception"
        />
      )}
    </div>
  );
};

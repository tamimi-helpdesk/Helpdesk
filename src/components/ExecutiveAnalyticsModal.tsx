import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Building2,
  Package,
  KeyRound,
  ShieldAlert,
  Bed,
  Sparkles,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Layers,
  PieChart,
  Activity,
  Plus,
  Trash2,
  Ban,
  Wrench,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService, getTodayDateString, formatDisplayTime, normalizeDateString } from '../services/storageService';
import { FACILITIES } from '../data/facilities';
import { AuthService } from '../services/authService';
import { SlotBlockoutRecord, ShiftClosingSummary } from '../types';
import { TamimiLogo } from './TamimiLogo';

interface ExecutiveAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockoutChanged?: () => void;
}

export const ExecutiveAnalyticsModal: React.FC<ExecutiveAnalyticsModalProps> = ({
  isOpen,
  onClose,
  onBlockoutChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'shift_report' | 'blockouts'>('analytics');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [isCopied, setIsCopied] = useState(false);

  // New Blockout Form State
  const [isNewBlockoutOpen, setIsNewBlockoutOpen] = useState(false);
  const [blockoutFacilityId, setBlockoutFacilityId] = useState('barber-booking');
  const [blockoutStage, setBlockoutStage] = useState('ALL');
  const [blockoutDate, setBlockoutDate] = useState(getTodayDateString());
  const [blockoutStartTime, setBlockoutStartTime] = useState('08:00');
  const [blockoutEndTime, setBlockoutEndTime] = useState('12:00');
  const [blockoutReason, setBlockoutReason] = useState('Maintenance & Deep Cleaning');
  const [blockoutNotes, setBlockoutNotes] = useState('');

  // Live Data Calculation
  const allBookings = useMemo(() => StorageService.getAllBookings(), [isOpen, selectedDate]);
  const allParcels = useMemo(() => StorageService.getParcelRecords(), [isOpen, selectedDate]);
  const allHandovers = useMemo(() => StorageService.getHandoverRecords(), [isOpen, selectedDate]);
  const allRooms = useMemo(() => StorageService.getIsolationRooms(), [isOpen, selectedDate]);
  const allBlockouts = useMemo(() => StorageService.getBlockouts(), [isOpen, selectedDate]);
  const shiftSummary = useMemo(() => StorageService.getShiftClosingSummary(selectedDate), [isOpen, selectedDate]);

  // Calculations for Analytics
  const activeBookings = useMemo(() => {
    return allBookings.filter((b) => b.status === 'CONFIRMED');
  }, [allBookings]);

  // Facility Usage Distribution
  const facilityStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activeBookings.forEach((b) => {
      counts[b.facilityName] = (counts[b.facilityName] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeBookings]);

  // Department Usage Breakdown
  const departmentStats = useMemo(() => {
    const depts: Record<string, number> = {};
    activeBookings.forEach((b) => {
      const dept = b.departmentOrTeam || 'General Resident / Guest';
      depts[dept] = (depts[dept] || 0) + 1;
    });
    return Object.entries(depts).sort((a, b) => b[1] - a[1]);
  }, [activeBookings]);

  // Peak Hour Usage Distribution
  const peakHourStats = useMemo(() => {
    const hours: Record<string, number> = {};
    activeBookings.forEach((b) => {
      const startH = b.startTime ? b.startTime.split(':')[0] + ':00' : 'Other';
      hours[startH] = (hours[startH] || 0) + 1;
    });
    return Object.entries(hours).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeBookings]);

  if (!isOpen) return null;

  const handleCopyShiftReport = () => {
    const text = `📋 *TAMIMI HELPDESK - DAILY SHIFT CLOSING SUMMARY*
📅 Date: ${shiftSummary.shiftDate}
👤 Duty Staff: ${shiftSummary.staffOnDuty}
⏰ Generated: ${new Date(shiftSummary.generatedAt).toLocaleTimeString()}

📊 *Operational Metrics:*
• Active Bookings Today: ${shiftSummary.totalActiveBookingsToday}
• Facility Utilization Rate: ${shiftSummary.facilityUtilizationRate}%
• Isolation/Guest Beds Occupied: ${shiftSummary.totalIsolationBedsOccupied} / 24

📦 *Parcel Registry:*
• Received Today: ${shiftSummary.totalParcelsReceivedToday}
• Delivered Today: ${shiftSummary.totalParcelsDeliveredToday}
• Pending Holding: ${shiftSummary.totalParcelsPendingHolding}

🔑 *Asset & Key Handover:*
• Items Issued Today: ${shiftSummary.totalHandoversIssuedToday}
• Currently Pending Return: ${shiftSummary.totalHandoversPendingReturn}
• Overdue Assets: ${shiftSummary.totalOverdueHandovers}

🔍 *Lost & Found:*
• Found Today: ${shiftSummary.totalLostItemsFoundToday}
• Claimed Today: ${shiftSummary.totalLostItemsClaimedToday}

✅ All operations documented & synced to Google Sheets.`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  const handleCreateBlockout = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveBlockoutRecord({
      facilityId: blockoutFacilityId,
      stage: blockoutStage,
      date: blockoutDate,
      startTime: blockoutStartTime,
      endTime: blockoutEndTime,
      reason: blockoutReason,
      notes: blockoutNotes,
      blockedByStaff: AuthService.getUsername(),
    });
    setIsNewBlockoutOpen(false);
    setBlockoutNotes('');
    if (onBlockoutChanged) {
      onBlockoutChanged();
    }
  };

  const handleDeleteBlockout = (id: string) => {
    if (window.confirm('Are you sure you want to remove this slot blockout?')) {
      StorageService.deleteBlockoutRecord(id);
      if (onBlockoutChanged) {
        onBlockoutChanged();
      }
    }
  };

  return (
    <div
      id="executive-analytics-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Executive Operations & Analytics Hub
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-800">
                  Live Intelligence
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive analytics, KPI metrics, shift closing report, and maintenance slot blockouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-4 text-xs font-black border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Operations Dashboard
            </button>
            <button
              onClick={() => setActiveTab('shift_report')}
              className={`py-3 px-4 text-xs font-black border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'shift_report'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileTextIcon className="w-4 h-4" />
              Daily Shift Closing Report
            </button>
            <button
              onClick={() => setActiveTab('blockouts')}
              className={`py-3 px-4 text-xs font-black border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'blockouts'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Ban className="w-4 h-4" />
              Maintenance & Slot Blockouts ({allBlockouts.length})
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <label className="text-[11px] font-bold text-slate-400">Date Filter:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OPERATIONS ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Top Key Performance Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
                  <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider">Bookings</span>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{activeBookings.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Active confirmed reservations</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider">Parcels</span>
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{allParcels.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {shiftSummary.totalParcelsPendingHolding} pending holding
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider">Key / Assets</span>
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{shiftSummary.totalHandoversPendingReturn}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {shiftSummary.totalOverdueHandovers > 0 ? (
                      <span className="text-red-500 font-bold">⚠️ {shiftSummary.totalOverdueHandovers} overdue</span>
                    ) : (
                      'All in good return cycle'
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider">Bed Occupancy</span>
                    <Bed className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{shiftSummary.totalIsolationBedsOccupied} / 24</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Across Buildings R & B</div>
                </div>
              </div>

              {/* Facility & Department Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Facility Popularity */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-500" />
                    Facility Booking Distribution
                  </h3>
                  {facilityStats.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">No bookings recorded yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {facilityStats.map(([name, count]) => {
                        const pct = Math.round((count / activeBookings.length) * 100) || 0;
                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                              <span>{name}</span>
                              <span className="text-slate-500">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Department Consumption */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-emerald-500" />
                    Department / Team Utilization
                  </h3>
                  {departmentStats.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">No department data recorded yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {departmentStats.map(([name, count]) => {
                        const pct = Math.round((count / activeBookings.length) * 100) || 0;
                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                              <span className="truncate pr-2">{name}</span>
                              <span className="text-slate-500">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Peak Hour Heat Analysis */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Peak Usage Hours Breakdown
                </h3>
                {peakHourStats.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">No peak hours recorded yet.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {peakHourStats.map(([hour, count]) => (
                      <div key={hour} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-xs font-black text-slate-900 dark:text-white">{hour}</div>
                        <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">{count} bookings</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SHIFT CLOSING REPORT */}
          {activeTab === 'shift_report' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Daily Operational Shift Summary</h3>
                  <p className="text-xs text-slate-500">Ready to copy for WhatsApp handover or export to management</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyShiftReport}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    {isCopied ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print Summary
                  </button>
                </div>
              </div>

              {/* Formatted Report Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 space-y-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                  <div className="font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    TAMIMI HELPDESK & FACILITY MANAGEMENT
                  </div>
                  <div className="text-[11px] text-slate-500">{new Date().toLocaleString()}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 border-b border-slate-200 dark:border-slate-800">
                  <div><span className="text-slate-400">Shift Date:</span> <strong className="text-slate-900 dark:text-white">{shiftSummary.shiftDate}</strong></div>
                  <div><span className="text-slate-400">Duty Staff:</span> <strong className="text-slate-900 dark:text-white">{shiftSummary.staffOnDuty}</strong></div>
                  <div><span className="text-slate-400">Facility Utilization:</span> <strong className="text-emerald-500">{shiftSummary.facilityUtilizationRate}%</strong></div>
                </div>

                <div className="space-y-2 py-2">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">1. Facility & Ground Bookings</div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <div>• Active confirmed bookings today: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalActiveBookingsToday}</strong></div>
                    <div>• Isolation & Resident Beds Occupied: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalIsolationBedsOccupied} / 24</strong></div>
                  </div>
                </div>

                <div className="space-y-2 py-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">2. Parcel Registry & Mailroom</div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <div>• Parcels received into office today: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalParcelsReceivedToday}</strong></div>
                    <div>• Parcels handed to guests today: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalParcelsDeliveredToday}</strong></div>
                    <div>• Currently in holding vault: <strong className="text-amber-500">{shiftSummary.totalParcelsPendingHolding}</strong></div>
                  </div>
                </div>

                <div className="space-y-2 py-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">3. Key & Equipment Handover</div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <div>• Assets issued out today: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalHandoversIssuedToday}</strong></div>
                    <div>• Pending return: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalHandoversPendingReturn}</strong></div>
                    <div>• Overdue items: <strong className={shiftSummary.totalOverdueHandovers > 0 ? 'text-red-500' : 'text-emerald-500'}>{shiftSummary.totalOverdueHandovers}</strong></div>
                  </div>
                </div>

                <div className="space-y-2 py-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">4. Lost & Found Register</div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <div>• Items reported/found today: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalLostItemsFoundToday}</strong></div>
                    <div>• Items claimed/released today: <strong className="text-slate-900 dark:text-white">{shiftSummary.totalLostItemsClaimedToday}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE & BLOCKOUTS */}
          {activeTab === 'blockouts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Facility Maintenance & Slot Blockout Registry</h3>
                  <p className="text-xs text-slate-500">Temporarily reserve or close grounds for repairs, VIP events, or emergency closures</p>
                </div>
                <button
                  onClick={() => setIsNewBlockoutOpen((prev) => !prev)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isNewBlockoutOpen ? 'Cancel' : '+ Block Slot / Maintenance'}
                </button>
              </div>

              {/* New Blockout Form */}
              {isNewBlockoutOpen && (
                <form onSubmit={handleCreateBlockout} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-sky-300 dark:border-sky-800 space-y-4">
                  <div className="font-black text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    New Slot Blockout Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facility</label>
                      <select
                        value={blockoutFacilityId}
                        onChange={(e) => setBlockoutFacilityId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {FACILITIES.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stage / Ground</label>
                      <select
                        value={blockoutStage}
                        onChange={(e) => setBlockoutStage(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="ALL">All Stages / Whole Facility</option>
                        {FACILITIES.find((f) => f.id === blockoutFacilityId)?.stages.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={blockoutDate}
                        onChange={(e) => setBlockoutDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                      >
                      </input>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                      <input
                        type="time"
                        required
                        value={blockoutStartTime}
                        onChange={(e) => setBlockoutStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                      <input
                        type="time"
                        required
                        value={blockoutEndTime}
                        onChange={(e) => setBlockoutEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                      <select
                        value={blockoutReason}
                        onChange={(e) => setBlockoutReason(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="Maintenance & Deep Cleaning">Maintenance & Deep Cleaning</option>
                        <option value="VIP / Official Event">VIP / Official Event</option>
                        <option value="Ground Renovation / Repair">Ground Renovation / Repair</option>
                        <option value="Emergency Closure">Emergency Closure</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Instructions (Optional)</label>
                    <input
                      type="text"
                      value={blockoutNotes}
                      onChange={(e) => setBlockoutNotes(e.target.value)}
                      placeholder="e.g. Grass leveling, light maintenance, VIP dinner setup..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewBlockoutOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                    >
                      Confirm Slot Blockout
                    </button>
                  </div>
                </form>
              )}

              {/* Blockout List Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
                {allBlockouts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    No active maintenance blockouts. All slots are open according to standard schedule.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 font-black text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Facility</th>
                        <th className="p-3">Stage</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Blocked By</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allBlockouts.map((b, idx) => (
                        <tr key={`blockout-${b.id || 'blk'}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{b.facilityName}</td>
                          <td className="p-3 text-slate-500">{b.stage}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {b.date} ({formatDisplayTime(b.startTime)} - {formatDisplayTime(b.endTime)})
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              ⛔ {b.reason}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{b.blockedByStaff}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteBlockout(b.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition cursor-pointer"
                              title="Unblock slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

function FileTextIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" x2="8" y1="13" y2="13"/>
      <line x1="16" x2="8" y1="17" y2="17"/>
      <line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  );
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

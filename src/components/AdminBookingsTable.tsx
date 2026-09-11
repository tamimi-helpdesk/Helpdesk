import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Trash2,
  Calendar,
  Clock,
  User,
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
  Layers,
  ArrowUpDown,
  RotateCcw,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  FileText,
  MessageCircle,
  Palette,
  Crown,
  Flame,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Tag,
  Shield,
  Wrench,
  Utensils,
  Laptop,
  HeartPulse,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { StorageService, formatDisplayTime, formatDisplayDate, getDayName, normalizeDateString, getTodayDateString, safeSetLocalStorage } from '../services/storageService';
import { GasService } from '../services/gasService';
import { TamimiLogo } from './TamimiLogo';
import { BookingAdmissionPrintModal } from './BookingAdmissionPrintModal';
import { PrintReceiptService } from '../services/printReceiptService';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { AuthService } from '../services/authService';
import {
  ColorCodingMode,
  ColorCodingStyle,
  PriorityLevel,
  PRIORITY_CONFIG,
  DEPARTMENT_PALETTES,
  getBookingPriority,
  getBookingDepartment,
  getDepartmentColorTheme,
  getBookingColorCoding,
} from '../utils/bookingColorCoding';

interface AdminBookingsTableProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCancelled: () => void;
}

type DatePreset = 'ALL' | 'TODAY' | 'TOMORROW' | 'NEXT_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';

export const AdminBookingsTable: React.FC<AdminBookingsTableProps> = ({
  isOpen,
  onClose,
  onBookingCancelled,
}) => {
  const [selectedTabFilter, setSelectedTabFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<Booking | null>(null);
  const [selectedBookingForWhatsApp, setSelectedBookingForWhatsApp] = useState<Booking | null>(null);

  // Color-Coding Administrator Setting State (Persisted in localStorage)
  const [colorMode, setColorMode] = useState<ColorCodingMode>(() => {
    try {
      return (localStorage.getItem('tamimi_admin_bookings_color_mode_v2') as ColorCodingMode) || 'OFF';
    } catch {
      return 'OFF';
    }
  });

  const [colorStyle, setColorStyle] = useState<ColorCodingStyle>(() => {
    try {
      return (localStorage.getItem('tamimi_admin_bookings_color_style_v2') as ColorCodingStyle) || 'ACCENT_BAR';
    } catch {
      return 'ACCENT_BAR';
    }
  });

  const [selectedColorLegendFilter, setSelectedColorLegendFilter] = useState<string | null>(null);
  const [editingPriorityBookingId, setEditingPriorityBookingId] = useState<string | null>(null);
  const [editingDepartmentBookingId, setEditingDepartmentBookingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const allBookings = useMemo(() => StorageService.getAllBookings(), [refreshTrigger, isOpen]);

  // Helper to calculate date presets
  const todayStr = useMemo(() => getTodayDateString(), []);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    const formatLocalYmd = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const today = getTodayDateString();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'TOMORROW') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatLocalYmd(tomorrow);
      setStartDate(tomorrowStr);
      setEndDate(tomorrowStr);
    } else if (preset === 'NEXT_7_DAYS') {
      const today = getTodayDateString();
      const end = new Date(now);
      end.setDate(end.getDate() + 6);
      setStartDate(today);
      setEndDate(formatLocalYmd(end));
    } else if (preset === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstDay = formatLocalYmd(new Date(y, m, 1));
      const lastDay = formatLocalYmd(new Date(y, m + 1, 0));
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  // Color-Coding Setting Handlers
  const handleColorModeChange = (mode: ColorCodingMode) => {
    setColorMode(mode);
    setSelectedColorLegendFilter(null);
    safeSetLocalStorage('tamimi_admin_bookings_color_mode_v2', mode);
  };

  const handleColorStyleChange = (style: ColorCodingStyle) => {
    setColorStyle(style);
    safeSetLocalStorage('tamimi_admin_bookings_color_style_v2', style);
  };

  const handleUpdateBookingPriority = (bookingId: string, priority: PriorityLevel) => {
    StorageService.updateBookingPriority(bookingId, priority);
    setRefreshTrigger((prev) => prev + 1);
    setEditingPriorityBookingId(null);
  };

  const handleUpdateBookingDepartment = (bookingId: string, dept: string) => {
    if (!dept.trim()) return;
    StorageService.updateBookingDepartment(bookingId, dept.trim());
    setRefreshTrigger((prev) => prev + 1);
    setEditingDepartmentBookingId(null);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedTabFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSearchQuery('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedColorLegendFilter(null);
  };

  // 1. Base Filtered Bookings calculation (date, status, tab, search)
  const baseFilteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      if (!b || !b.id || b.id === 'Booking ID') return false;

      // Tab filter
      if (selectedTabFilter !== 'ALL' && b.sheetTabName !== selectedTabFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && b.status !== selectedStatusFilter) {
        return false;
      }

      // Date Range Filter
      const bDate = normalizeDateString(b.date);
      if (startDate && bDate < startDate) {
        return false;
      }
      if (endDate && bDate > endDate) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = b.id.toLowerCase().includes(q);
        const matchesName = b.customerName.toLowerCase().includes(q);
        const matchesPhone = b.phoneNumber.toLowerCase().includes(q);
        const matchesStage = b.stage.toLowerCase().includes(q);
        const matchesStaff = (b.bookedByStaff || '').toLowerCase().includes(q);
        const matchesTab = (b.sheetTabName || '').toLowerCase().includes(q);
        const matchesNotes = (b.notes || '').toLowerCase().includes(q);
        const matchesDept = (b.departmentOrTeam || '').toLowerCase().includes(q);
        const matchesPriority = (b.priority || '').toLowerCase().includes(q);

        if (!matchesId && !matchesName && !matchesPhone && !matchesStage && !matchesStaff && !matchesTab && !matchesNotes && !matchesDept && !matchesPriority) {
          return false;
        }
      }

      return true;
    });
  }, [allBookings, selectedTabFilter, selectedStatusFilter, startDate, endDate, searchQuery]);

  // 2. Final Filtered Bookings with dynamic color legend filter
  const filteredBookings = useMemo(() => {
    if (!selectedColorLegendFilter || colorMode === 'OFF') {
      return baseFilteredBookings;
    }
    return baseFilteredBookings.filter((b) => {
      if (colorMode === 'PRIORITY') {
        return getBookingPriority(b) === selectedColorLegendFilter;
      }
      if (colorMode === 'DEPARTMENT') {
        const dept = getBookingDepartment(b);
        const theme = getDepartmentColorTheme(dept);
        return theme.label === selectedColorLegendFilter || dept === selectedColorLegendFilter;
      }
      return true;
    });
  }, [baseFilteredBookings, selectedColorLegendFilter, colorMode]);

  // Live count statistics for Priority Legend
  const legendPriorityStats = useMemo(() => {
    const counts: Record<PriorityLevel, number> = {
      VIP: 0,
      CRITICAL: 0,
      HIGH: 0,
      STANDARD: 0,
      LOW: 0,
    };
    baseFilteredBookings.forEach((b) => {
      const p = getBookingPriority(b);
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [baseFilteredBookings]);

  // Live count statistics for Department Legend
  const legendDepartmentStats = useMemo(() => {
    const counts: Record<string, { label: string; count: number; theme: (typeof DEPARTMENT_PALETTES)[0] }> = {};
    baseFilteredBookings.forEach((b) => {
      const dept = getBookingDepartment(b);
      const theme = getDepartmentColorTheme(dept);
      const key = theme.label;
      if (!counts[key]) {
        counts[key] = { label: key, count: 0, theme };
      }
      counts[key].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [baseFilteredBookings]);

  // Quick statistics calculation for the current view
  const stats = useMemo(() => {
    const total = filteredBookings.length;
    const confirmed = filteredBookings.filter((b) => b.status === 'CONFIRMED').length;
    const cancelled = filteredBookings.filter((b) => b.status === 'CANCELLED').length;
    const uniqueCustomers = new Set(filteredBookings.map((b) => b.phoneNumber || b.customerName)).size;

    return { total, confirmed, cancelled, uniqueCustomers };
  }, [filteredBookings]);

  if (!isOpen) return null;

  // Export CSV Handler
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = StorageService.exportToCSV(filteredBookings);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);

      let filename = 'Tamimi_Bookings_Report';
      if (startDate && endDate) {
        filename += `_${startDate}_to_${endDate}`;
      } else if (startDate) {
        filename += `_from_${startDate}`;
      } else if (endDate) {
        filename += `_until_${endDate}`;
      } else {
        filename += `_All_${todayStr}`;
      }

      if (selectedTabFilter !== 'ALL') {
        filename += `_${selectedTabFilter.replace(/\s+/g, '_')}`;
      }

      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccessMsg(`Successfully exported ${filteredBookings.length} booking records!`);
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Export CSV error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Print Sheet Handler
  const handlePrint = () => {
    window.print();
  };

  // Cancel Booking (Releases time slot & removes from Google Sheets)
  const handleCancel = async (bookingId: string, phone: string) => {
    if (window.confirm(`Cancel booking ${bookingId}? The time slot will be released back immediately and removed from Google Sheets.`)) {
      const cancelRes = StorageService.cancelBooking(bookingId, 'Cancelled via Admin Portal');
      onBookingCancelled();
      try {
        const b = cancelRes.booking || StorageService.getBookingById(bookingId);
        if (b) {
          await GasService.pushCancelToRemote({
            bookingId: b.id,
            phoneNumber: b.phoneNumber || phone,
            reason: 'Cancelled via Admin Portal',
            facilityName: b.facilityName || b.facilityId,
            sheetTabName: b.sheetTabName,
            stage: b.stage,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            durationMinutes: b.durationMinutes,
            guestsCount: b.numberOfGuests,
            customerName: b.customerName,
          });
        } else {
          await GasService.pushCancelToRemote(bookingId, phone, 'Cancelled via Admin Portal');
        }
        GasService.syncWithRemote().catch(console.warn);
      } catch (e) {
        console.warn('Remote cancel sync error:', e);
      }
    }
  };

  // Permanently Delete Booking (Removes from system & sheet)
  const handleDelete = async (bookingId: string, phone: string) => {
    if (window.confirm(`Permanently delete booking ${bookingId}? This removes the record from both the local database and Google Sheets.`)) {
      const b = StorageService.getBookingById(bookingId);
      StorageService.deleteBooking(bookingId);
      onBookingCancelled();
      try {
        if (b) {
          await GasService.pushDeleteToRemote({
            bookingId: b.id,
            phoneNumber: b.phoneNumber || phone,
            facilityName: b.facilityName || b.facilityId,
            sheetTabName: b.sheetTabName,
            stage: b.stage,
            date: b.date,
            startTime: b.startTime,
          });
        } else {
          await GasService.pushDeleteToRemote(bookingId, phone);
        }
        GasService.syncWithRemote().catch(console.warn);
      } catch (e) {
        console.warn('Remote delete sync error:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/80 dark:bg-black/90 backdrop-blur-md animate-fadeIn print:static print:p-0 print:bg-white print:backdrop-blur-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none transition-colors duration-200"
      >
        {/* Header Section */}
        <div className="p-5 sm:p-7 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 relative shrink-0 print:bg-white print:border-b-2 print:border-slate-900">
          
          {/* Top Close Button (hidden in print) */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700 print:hidden"
            title="Close Manifest"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Branding & Title */}
            <div className="flex items-center space-x-3.5 pr-10">
              <div className="shrink-0">
                <TamimiLogo size={52} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-800 dark:text-sky-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    Master Registry &amp; Export
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold print:hidden">
                    8 Facility Tabs Integrated
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-0.5">
                  All Bookings Manifest &amp; Reports
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Comprehensive audit manifest of all confirmed and released bookings. Export custom date ranges to CSV or print official reports.
                </p>
              </div>
            </div>

            {/* Top Action Buttons (Export CSV & Print) */}
            <div className="flex items-center space-x-2.5 print:hidden shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportCSV}
                disabled={isExporting || filteredBookings.length === 0}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/25 transition cursor-pointer"
                title="Download CSV of current filtered bookings"
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export CSV ({filteredBookings.length})</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer"
                title="Print formatted sheet report or Save to PDF"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Print Sheet</span>
              </motion.button>
            </div>

          </div>

          {/* Export Success Notification Banner */}
          {exportSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300 text-xs font-black flex items-center space-x-2 print:hidden shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{exportSuccessMsg}</span>
            </motion.div>
          )}

          {/* Summary Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-3 rounded-2xl flex items-center space-x-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-700 dark:text-sky-400 font-bold shrink-0">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Total in View</span>
                <span className="text-lg font-black text-slate-950 dark:text-white leading-tight">{stats.total}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-3 rounded-2xl flex items-center space-x-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Confirmed</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-tight">{stats.confirmed}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-3 rounded-2xl flex items-center space-x-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center text-red-700 dark:text-red-400 font-bold shrink-0">
                <XCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">Cancelled</span>
                <span className="text-lg font-black text-red-600 dark:text-red-400 leading-tight">{stats.cancelled}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-3 rounded-2xl flex items-center space-x-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Customers</span>
                <span className="text-lg font-black text-slate-950 dark:text-white leading-tight">{stats.uniqueCustomers}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Filter Controls Bar (Hidden in Print Mode) */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3 print:hidden">
          
          {/* Row 1: Date Presets & Custom Range Pickers */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800">
            
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1 mr-1">
                <CalendarRange className="w-3.5 h-3.5 text-sky-600" />
                <span>Date Range:</span>
              </span>

              {[
                { id: 'ALL', label: 'All Dates' },
                { id: 'TODAY', label: 'Today' },
                { id: 'TOMORROW', label: 'Tomorrow' },
                { id: 'NEXT_7_DAYS', label: 'Next 7 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleDatePresetChange(item.id as DatePreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    datePreset === item.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Interactive From-Date & To-Date inputs */}
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-black text-slate-600 dark:text-slate-400">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-slate-950 dark:text-white font-bold focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-black text-slate-600 dark:text-slate-400">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-slate-950 dark:text-white font-bold focus:outline-none text-xs"
                />
              </div>

              {(startDate || endDate || selectedTabFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Row 2: Search, Facility Tab selector, and Status Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Customer, Phone, Staff, Notes..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
              />
              <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-2.5" />
            </div>

            {/* Facility Tab Filter Dropdown */}
            <div>
              <select
                value={selectedTabFilter}
                onChange={(e) => setSelectedTabFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-950 dark:text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
              >
                <option value="ALL">All Facilities (8 Dedicated Tabs)</option>
                <option value="Barber Booking">Barber Booking (Barber Shop)</option>
                <option value="Cricket Ground">Cricket Ground</option>
                <option value="Football Ground">Football Ground</option>
                <option value="Multipurpose Room">Multipurpose Room</option>
                <option value="Cinema">Cinema (Executive Theater)</option>
                <option value="Tennis Court">Tennis Court</option>
                <option value="Cricket Net">Cricket Net (Batting &amp; Bowling)</option>
                <option value="Basket Ball Court">Basket Ball Court</option>
              </select>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800">
              {(['ALL', 'CONFIRMED', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    selectedStatusFilter === st
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

          </div>

          {/* Row 3: Color-Coding Setting Control Bar */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              
              {/* Color Coding Mode Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center space-x-1.5 mr-1 text-xs font-black text-slate-800 dark:text-slate-200">
                  <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Color-Code Bookings:</span>
                </div>

                {([
                  { id: 'OFF', label: 'Off' },
                  { id: 'DEPARTMENT', label: 'By Department' },
                  { id: 'PRIORITY', label: 'By Priority' },
                ] as const).map((m) => {
                  const isActive = colorMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleColorModeChange(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m.id === 'DEPARTMENT' && <Building2 className="w-3.5 h-3.5 text-current" />}
                      {m.id === 'PRIORITY' && <Crown className="w-3.5 h-3.5 text-current" />}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Style Intensity Toggle */}
              {colorMode !== 'OFF' && (
                <div className="flex items-center space-x-2 text-xs shrink-0">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                    Highlight Style:
                  </span>
                  <div className="inline-flex bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleColorStyleChange('ACCENT_BAR')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                        colorStyle === 'ACCENT_BAR'
                          ? 'bg-slate-900 text-white dark:bg-sky-600 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Subtle Border
                    </button>
                    <button
                      onClick={() => handleColorStyleChange('TINTED_ROW')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                        colorStyle === 'TINTED_ROW'
                          ? 'bg-slate-900 text-white dark:bg-sky-600 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Ambient Tint
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Dynamic Interactive Color Legend & Quick Filter */}
            {colorMode !== 'OFF' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 mr-1 flex items-center space-x-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Legend Filter:</span>
                </span>

                {/* Show All chip */}
                <button
                  onClick={() => setSelectedColorLegendFilter(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer border ${
                    selectedColorLegendFilter === null
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  All ({baseFilteredBookings.length})
                </button>

                {/* Legend Chips for PRIORITY */}
                {colorMode === 'PRIORITY' &&
                  (Object.keys(PRIORITY_CONFIG) as PriorityLevel[]).map((level) => {
                    const cfg = PRIORITY_CONFIG[level];
                    const count = legendPriorityStats[level] || 0;
                    const isSelected = selectedColorLegendFilter === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedColorLegendFilter(isSelected ? null : level)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center space-x-1.5 border ${
                          isSelected
                            ? 'ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-slate-900 shadow-xs font-black'
                            : 'hover:border-slate-400'
                        } ${cfg.badgeClass}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cfg.dotColor }}
                        />
                        <span>{cfg.label}</span>
                        <span className="px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-full text-[10px] font-mono">
                          {count}
                        </span>
                      </button>
                    );
                  })}

                {/* Legend Chips for DEPARTMENT */}
                {colorMode === 'DEPARTMENT' &&
                  legendDepartmentStats.map((item) => {
                    const isSelected = selectedColorLegendFilter === item.label;
                    return (
                      <button
                        key={item.label}
                        onClick={() => setSelectedColorLegendFilter(isSelected ? null : item.label)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center space-x-1.5 border ${
                          isSelected
                            ? 'ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-slate-900 shadow-xs font-black'
                            : 'hover:border-slate-400'
                        } ${item.theme.badgeClass}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.theme.dotColor }}
                        />
                        <span>{item.label}</span>
                        <span className="px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-full text-[10px] font-mono">
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

          </div>

        </div>

        {/* Printable Report Header (Visible only in print) */}
        <div className="hidden print:block p-6 border-b-2 border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TamimiLogo size={48} />
              <div>
                <h1 className="text-xl font-bold text-slate-900">TAMIMI Facilities &amp; Sports HelpDesk</h1>
                <p className="text-xs text-slate-600">Official Booking &amp; Facility Usage Audit Report</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Generated: {new Date().toLocaleString()}</p>
              <p>Filter: {selectedTabFilter} | Status: {selectedStatusFilter}</p>
              {colorMode !== 'OFF' && (
                <p className="font-bold">Color-Coded By: {colorMode === 'PRIORITY' ? 'Priority Level' : 'Department/Team'}</p>
              )}
              {startDate && endDate && <p>Date Span: {startDate} to {endDate}</p>}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div 
          onClick={() => {
            setEditingPriorityBookingId(null);
            setEditingDepartmentBookingId(null);
          }}
          className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 print:p-0"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-black tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                <th className="py-3 px-3.5">Booking ID</th>
                <th className="py-3 px-3">Facility / Tab</th>
                <th className="py-3 px-3">Customer &amp; Phone</th>
                {colorMode === 'DEPARTMENT' && (
                  <th className="py-3 px-3 text-blue-900 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40">
                    Department / Team
                  </th>
                )}
                {colorMode === 'PRIORITY' && (
                  <th className="py-3 px-3 text-purple-900 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40">
                    Priority Tier
                  </th>
                )}
                <th className="py-3 px-3">Date &amp; Slot Time</th>
                <th className="py-3 px-3">Resource / Stage</th>
                <th className="py-3 px-3">Booked By</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right print:hidden">Actions &amp; Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={colorMode !== 'OFF' ? 9 : 8} className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium space-y-2">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">No bookings match the selected filters or date range.</p>
                    <p className="text-xs">Try selecting "All Dates" or clearing the search keyword.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => {
                  const isConfirmed = b.status === 'CONFIRMED';
                  const rowKey = b.id ? `adm-${b.id}-${idx}` : `adm-row-${idx}-${b.sheetTabName}-${b.date}`;

                  const colorCoding = getBookingColorCoding(b, colorMode, colorStyle);
                  const priorityLevel = getBookingPriority(b);
                  const priorityTheme = PRIORITY_CONFIG[priorityLevel];
                  const deptName = getBookingDepartment(b);
                  const deptTheme = getDepartmentColorTheme(deptName);

                  return (
                    <tr
                      key={rowKey}
                      className={`transition-colors border-b border-slate-100 dark:border-slate-800/80 ${
                        colorMode !== 'OFF' ? colorCoding.borderClass : ''
                      } ${
                        colorMode !== 'OFF' && colorCoding.rowBgClass
                          ? colorCoding.rowBgClass
                          : !isConfirmed
                          ? 'opacity-70 bg-red-50/30 dark:bg-red-950/15'
                          : 'hover:bg-sky-50/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Booking ID */}
                      <td className="py-3 px-3.5 font-mono font-black text-sky-800 dark:text-cyan-400">
                        {b.id}
                      </td>

                      {/* Facility */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-black border border-slate-200 dark:border-slate-700">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{b.sheetTabName}</span>
                        </span>
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3 px-3">
                        <div className="font-black text-slate-950 dark:text-white">{b.customerName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">{b.phoneNumber}</div>
                        {b.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{b.email}</div>
                        )}
                        {b.departmentOrTeam && colorMode !== 'DEPARTMENT' && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                            <span className="truncate">{b.departmentOrTeam}</span>
                          </div>
                        )}
                      </td>

                      {/* Column for Department Mode */}
                      {colorMode === 'DEPARTMENT' && (
                        <td className="py-3 px-3">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDepartmentBookingId(editingDepartmentBookingId === b.id ? null : b.id);
                                setEditingPriorityBookingId(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center space-x-1.5 border shadow-2xs hover:opacity-90 transition cursor-pointer max-w-[180px] ${deptTheme.badgeClass}`}
                              title="Click to assign or change Department/Team"
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: deptTheme.dotColor }} />
                              <span className="truncate">{deptName}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                            </button>

                            {editingDepartmentBookingId === b.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-2 z-30 space-y-1"
                              >
                                <div className="px-1.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Assign Department / Team
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-0.5">
                                  {DEPARTMENT_PALETTES.map((dp) => (
                                    <button
                                      key={dp.id}
                                      onClick={() => handleUpdateBookingDepartment(b.id, dp.label)}
                                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-2 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                        deptName === dp.label ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-black' : 'text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dp.dotColor }} />
                                      <span className="truncate flex-1">{dp.label}</span>
                                      {deptName === dp.label && <Check className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Column for Priority Mode */}
                      {colorMode === 'PRIORITY' && (
                        <td className="py-3 px-3">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPriorityBookingId(editingPriorityBookingId === b.id ? null : b.id);
                                setEditingDepartmentBookingId(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center space-x-1.5 border shadow-2xs hover:opacity-90 transition cursor-pointer ${priorityTheme.badgeClass}`}
                              title="Click to change Priority Tier"
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: priorityTheme.dotColor }} />
                              <span>{priorityTheme.label}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                            </button>

                            {editingPriorityBookingId === b.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-1.5 z-30 space-y-0.5"
                              >
                                <div className="px-1.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Set Priority Level
                                </div>
                                {(['VIP', 'CRITICAL', 'HIGH', 'STANDARD', 'LOW'] as PriorityLevel[]).map((lvl) => {
                                  const cfg = PRIORITY_CONFIG[lvl];
                                  const isCurr = priorityLevel === lvl;
                                  return (
                                    <button
                                      key={lvl}
                                      onClick={() => handleUpdateBookingPriority(b.id, lvl)}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                        isCurr ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-black' : 'text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dotColor }} />
                                      <span className="flex-1">{cfg.label}</span>
                                      {isCurr && <Check className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Date & Slot */}
                      <td className="py-3 px-3">
                        <div className="text-slate-900 dark:text-slate-200 font-bold">
                          {formatDisplayDate(b.date, { short: true })}
                        </div>
                        <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                          {formatDisplayTime(b.startTime)} – {formatDisplayTime(b.endTime)}
                        </div>
                      </td>

                      {/* Resource / Stage */}
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-300 font-bold">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 text-[11px]">
                          {b.stage}
                        </span>
                        {b.numberOfGuests && b.numberOfGuests > 1 && (
                          <span className="ml-1 text-[10px] text-slate-400">({b.numberOfGuests} guests)</span>
                        )}
                      </td>

                      {/* Booked By */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="text-[11px] font-bold">
                          {b.bookedByStaff || 'Helpdesk Portal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 border ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-red-50 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-500/40'
                          }`}
                        >
                          {isConfirmed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                          )}
                          <span>{b.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right print:hidden">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              const msg = WhatsAppService.generateBookingMessage(b);
                              WhatsAppService.open(b.phoneNumber, msg);
                            }}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] font-black border border-emerald-200 dark:border-emerald-500/30 transition cursor-pointer"
                            title="Direct Share via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => PrintReceiptService.printThermalReceipt80mm(b)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-[11px] font-black border border-amber-200 dark:border-amber-500/30 transition cursor-pointer"
                            title="Print 80mm POS Thermal Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>80mm</span>
                          </button>

                          <button
                            onClick={() => setSelectedBookingForPrint(b)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 rounded-xl text-[11px] font-black border border-sky-200 dark:border-sky-500/30 transition cursor-pointer"
                            title="Open & Print Official A4 Admission Form with Signatures"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>A4 Form</span>
                          </button>

                          {isConfirmed ? (
                            <>
                              <button
                                onClick={() => handleCancel(b.id, b.phoneNumber)}
                                className="px-2 py-1.5 text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-xl transition cursor-pointer border border-amber-200 dark:border-amber-500/30 text-[11px] font-black inline-flex items-center space-x-1"
                                title="Cancel Booking and Release Slot"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>

                              {AuthService.isSuperAdmin() && (
                                <button
                                  onClick={() => handleDelete(b.id, b.phoneNumber)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
                                  title="Super Admin: Permanently Delete Booking from System & Google Sheets"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            AuthService.isSuperAdmin() && (
                              <button
                                onClick={() => handleDelete(b.id, b.phoneNumber)}
                                className="px-2 py-1.5 text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 rounded-xl transition cursor-pointer border border-red-200 dark:border-red-500/30 text-[11px] font-black inline-flex items-center space-x-1"
                                title="Super Admin: Permanently Delete Cancelled Record from System & Google Sheets"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="p-4 sm:p-5 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0 print:hidden font-medium">
          <div className="flex items-center space-x-2">
            <span>Showing <strong className="text-slate-950 dark:text-white font-black">{filteredBookings.length}</strong> of <strong className="text-slate-950 dark:text-white font-black">{allBookings.length}</strong> total system bookings.</span>
            {startDate && endDate && (
              <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-800 dark:text-sky-300 text-[10px] font-black border border-sky-500/30">
                Span: {startDate} to {endDate}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportCSV}
              disabled={filteredBookings.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </motion.button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-black transition cursor-pointer border-2 border-slate-200 dark:border-slate-700"
            >
              Close Manifest
            </button>
          </div>
        </div>

      </motion.div>

      {/* Embedded A4 Admission & Signature Form Modal */}
      {selectedBookingForPrint && (
        <BookingAdmissionPrintModal
          isOpen={!!selectedBookingForPrint}
          onClose={() => setSelectedBookingForPrint(null)}
          booking={selectedBookingForPrint}
        />
      )}

      {/* WhatsApp Share Customization Modal */}
      {selectedBookingForWhatsApp && (
        <WhatsAppShareModal
          isOpen={!!selectedBookingForWhatsApp}
          onClose={() => setSelectedBookingForWhatsApp(null)}
          title={`WhatsApp Pass - ${selectedBookingForWhatsApp.customerName}`}
          recipientName={selectedBookingForWhatsApp.customerName}
          defaultPhone={selectedBookingForWhatsApp.phoneNumber}
          messageText={WhatsAppService.generateBookingMessage(selectedBookingForWhatsApp)}
          moduleLabel={selectedBookingForWhatsApp.facilityName}
        />
      )}
    </div>
  );
};


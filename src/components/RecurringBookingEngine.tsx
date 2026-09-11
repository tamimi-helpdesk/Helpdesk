import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Users,
  Building2,
  CalendarRange,
  Flame,
  Check,
  X,
  FileSpreadsheet,
  CheckSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { Facility, Booking } from '../types';
import { getFacilityGraphic } from './FacilityGraphics';
import {
  StorageService,
  getTodayDateString,
  formatDisplayTime,
  timeToMinutes,
  minutesToTime,
  getDayName,
  getDayIndex,
  getDaysSpannedByRange,
  formatDisplayDate,
} from '../services/storageService';
import { GasService } from '../services/gasService';

interface RecurringBookingEngineProps {
  facility: Facility;
  selectedStage: string;
  customOptions?: Record<string, any>;
  onBatchBooked: (newBookings: Booking[]) => void;
  onSwitchToSingle?: () => void;
  onToggleCustomOptions?: () => void;
  isCustomOptionsOpen?: boolean;
  onReturnToDashboard?: () => void;
  onSelectStage?: (stage: string) => void;
}

const DAYS_OF_WEEK = [
  { dayIndex: 0, short: 'Sun', label: 'Sunday' },
  { dayIndex: 1, short: 'Mon', label: 'Monday' },
  { dayIndex: 2, short: 'Tue', label: 'Tuesday' },
  { dayIndex: 3, short: 'Wed', label: 'Wednesday' },
  { dayIndex: 4, short: 'Thu', label: 'Thursday' },
  { dayIndex: 5, short: 'Fri', label: 'Friday' },
  { dayIndex: 6, short: 'Sat', label: 'Saturday' },
];

export const RecurringBookingEngine: React.FC<RecurringBookingEngineProps> = ({
  facility,
  selectedStage,
  customOptions = {},
  onBatchBooked,
  onSwitchToSingle,
  onToggleCustomOptions,
  isCustomOptionsOpen,
  onReturnToDashboard,
  onSelectStage,
}) => {
  // Preset duration: '2_days' | '3_days' | '1_week' | '1_month' | '2_months' | '3_months' | 'custom'
  const [preset, setPreset] = useState<'2_days' | '3_days' | '1_week' | '1_month' | '2_months' | '3_months' | 'custom'>('1_month');

  // Dates
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [startDate, setStartDate] = useState<string>(() => todayStr);
  const [endDate, setEndDate] = useState<string>(() => {
    const today = getTodayDateString();
    const [y, m, d] = today.split('-').map(Number);
    const target = new Date(y, m - 1, d + 30);
    const ty = target.getFullYear();
    const tm = (target.getMonth() + 1).toString().padStart(2, '0');
    const td = target.getDate().toString().padStart(2, '0');
    return `${ty}-${tm}-${td}`;
  });

  // Day selection mode: 'all_in_range' | 'auto_days' | 'custom'
  const [daySelectionMode, setDaySelectionMode] = useState<'all_in_range' | 'auto_days' | 'custom'>('all_in_range');

  // Selected Days of Week (0-6)
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Automatically update selectedDays when date range changes and mode is not fully custom
  useEffect(() => {
    if (daySelectionMode === 'all_in_range' || daySelectionMode === 'auto_days') {
      const spanned = getDaysSpannedByRange(startDate, endDate);
      if (spanned.length > 0) {
        setSelectedDays(spanned);
      }
    }
  }, [startDate, endDate, daySelectionMode]);

  // Time Slot Selection for the Recurring Session
  const [startTime, setStartTime] = useState<string>(() => facility.openTime || '10:00');
  const [endTime, setEndTime] = useState<string>(() => {
    const openMin = timeToMinutes(facility.openTime || '10:00');
    const dur = (facility.defaultSlotDurationMinutes || 60);
    return minutesToTime(Math.min(openMin + dur, timeToMinutes(facility.closeTime || '23:00')));
  });

  // Customer Details Form
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookedByStaff, setBookedByStaff] = useState('');
  const [teamOrDept, setTeamOrDept] = useState('');
  const [email, setEmail] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(facility.capacityPerSlot || 20);
  const [notes, setNotes] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    createdCount?: number;
    skippedCount?: number;
    error?: string;
  } | null>(null);

  // Update End Date when preset changes
  const applyPreset = (p: '2_days' | '3_days' | '1_week' | '1_month' | '2_months' | '3_months' | 'custom') => {
    setPreset(p);
    const [y, m, d] = startDate.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    if (isNaN(start.getTime())) return;

    if (p === '2_days') {
      const end = new Date(start);
      end.setDate(end.getDate() + 1); // 2 days: day 0 and day 1
      const endStr = end.toISOString().split('T')[0];
      setEndDate(endStr);
      setDaySelectionMode('all_in_range');
      setSelectedDays(getDaysSpannedByRange(startDate, endStr));
    } else if (p === '3_days') {
      const end = new Date(start);
      end.setDate(end.getDate() + 2); // 3 days
      const endStr = end.toISOString().split('T')[0];
      setEndDate(endStr);
      setDaySelectionMode('all_in_range');
      setSelectedDays(getDaysSpannedByRange(startDate, endStr));
    } else if (p === '1_week') {
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // 7 days
      const endStr = end.toISOString().split('T')[0];
      setEndDate(endStr);
      setDaySelectionMode('all_in_range');
      setSelectedDays(getDaysSpannedByRange(startDate, endStr));
    } else if (p === '1_month') {
      const end = new Date(start);
      end.setDate(end.getDate() + 30);
      const endStr = end.toISOString().split('T')[0];
      setEndDate(endStr);
    } else if (p === '2_months') {
      const end = new Date(start);
      end.setDate(end.getDate() + 60);
      const endStr = end.toISOString().split('T')[0];
      setEndDate(endStr);
    } else if (p === '3_months') {
      const end = new Date(start);
      end.setDate(end.getDate() + 90);
      const endStr = end.toISOString().split('T')[0];
      setEndDate(endStr);
    }
  };

  const toggleDay = (dayIdx: number) => {
    setDaySelectionMode('custom');
    if (selectedDays.includes(dayIdx)) {
      if (selectedDays.length === 1) return; // Must have at least 1 day
      setSelectedDays(selectedDays.filter((d) => d !== dayIdx));
    } else {
      setSelectedDays([...selectedDays, dayIdx].sort((a, b) => a - b));
    }
  };

  // Quick day filter buttons
  const setAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setDaySelectionMode('all_in_range');
  };

  const setWeekendsOnly = () => {
    setSelectedDays([5, 6]); // Friday & Saturday
    setDaySelectionMode('custom');
  };

  const setWeekdaysOnly = () => {
    setSelectedDays([0, 1, 2, 3, 4]); // Sun to Thu
    setDaySelectionMode('custom');
  };

  const setAutoDetectedDays = () => {
    const spanned = getDaysSpannedByRange(startDate, endDate);
    setSelectedDays(spanned);
    setDaySelectionMode('all_in_range');
  };

  // Generate All Target Dates based on start, end, and selected days of week
  const matchedDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    if (start > end) return [];

    const dates: string[] = [];
    const curr = new Date(start);

    // Limit to max 120 days safety
    let count = 0;
    while (curr <= end && count < 120) {
      const dayOfWeek = curr.getDay(); // 0 is Sun, 6 is Sat
      if (selectedDays.includes(dayOfWeek)) {
        const yStr = curr.getFullYear();
        const mStr = (curr.getMonth() + 1).toString().padStart(2, '0');
        const dStr = curr.getDate().toString().padStart(2, '0');
        dates.push(`${yStr}-${mStr}-${dStr}`);
      }
      curr.setDate(curr.getDate() + 1);
      count++;
    }

    return dates;
  }, [startDate, endDate, selectedDays]);

  // Check Availability for all generated dates
  const availabilityReport = useMemo(() => {
    if (matchedDates.length === 0) {
      return { totalDates: 0, availableDates: [], conflictDates: [] };
    }

    return StorageService.checkRecurringAvailability({
      facilityId: facility.id,
      stage: selectedStage,
      dates: matchedDates,
      startTime,
      endTime,
    });
  }, [facility.id, selectedStage, matchedDates, startTime, endTime]);

  // Generate valid start/end time options
  const timeOptions = useMemo(() => {
    const openMin = timeToMinutes(facility.openTime || '07:00');
    const closeMin = timeToMinutes(facility.closeTime || '23:00');
    const dur = facility.defaultSlotDurationMinutes || 60;

    const list: string[] = [];
    for (let m = openMin; m <= closeMin; m += dur) {
      list.push(minutesToTime(m));
    }
    return list;
  }, [facility.openTime, facility.closeTime, facility.defaultSlotDurationMinutes]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phoneNumber.trim()) {
      setSubmitResult({
        success: false,
        error: 'Please provide Customer Name and Phone Number.',
      });
      return;
    }

    if (availabilityReport.availableDates.length === 0) {
      setSubmitResult({
        success: false,
        error: 'No available dates found to reserve in this schedule.',
      });
      return;
    }

    // Google Sheets Connection Check
    const gasConfig = GasService.getConfig();
    if (!gasConfig.webAppUrl || !gasConfig.webAppUrl.trim()) {
      setSubmitResult({
        success: false,
        error: 'Google Sheet is not connected. Please click "Backend & Sync" and configure your Web App URL before creating recurring bookings.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const durMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);

      // Summary label
      const dayNames = selectedDays
        .map((d) => DAYS_OF_WEEK.find((dw) => dw.dayIndex === d)?.short)
        .filter(Boolean)
        .join(', ');
      const summaryText = `Recurring (${dayNames}) | ${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)} | ${availabilityReport.availableDates.length} sessions`;

      const result = StorageService.createRecurringBookings({
        facilityId: facility.id,
        facilityName: facility.name,
        sheetTabName: facility.sheetTabName,
        stage: selectedStage,
        dates: availabilityReport.availableDates,
        startTime,
        endTime,
        durationMinutes: durMinutes > 0 ? durMinutes : 60,
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        bookedByStaff: bookedByStaff.trim() || undefined,
        email: email.trim() || undefined,
        departmentOrTeam: teamOrDept.trim() || undefined,
        numberOfGuests: Math.max(1, numberOfGuests),
        notes: notes.trim() || undefined,
        recurringSummary: summaryText,
      });

      if (!result.success || result.createdBookings.length === 0) {
        setSubmitResult({
          success: false,
          error: result.error || 'Failed to create recurring booking schedule.',
        });
        setIsSubmitting(false);
        return;
      }

      // Sync to Google Sheets
      const batchRes = await GasService.pushBatchBookingsToRemote(result.createdBookings);
      if (!batchRes.success) {
        // Revert local bookings if remote push fails to prevent un-synced schedules
        result.createdBookings.forEach((b) => {
          StorageService.cancelBooking(b.id, 'Rollback: Google Sheet unreachable');
        });
        setSubmitResult({
          success: false,
          error: `Google Sheet Connection Error: ${batchRes.error || 'Google Sheet unreachable'}. Schedule was NOT confirmed because Google Sheet must be connected. Please check "Backend & Sync".`,
        });
        setIsSubmitting(false);
        return;
      }

      // Sync latest data
      GasService.syncWithRemote().catch((e) => console.warn('Sync post-batch:', e));

      setSubmitResult({
        success: true,
        createdCount: result.createdBookings.length,
        skippedCount: result.skippedDates.length,
      });

      onBatchBooked(result.createdBookings);
    } catch (err: any) {
      setSubmitResult({
        success: false,
        error: err?.message || 'An unexpected error occurred during batch booking.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Day Name strings for active dates
  const startDayName = useMemo(() => getDayName(startDate), [startDate]);
  const endDayName = useMemo(() => getDayName(endDate), [endDate]);
  const totalDaysInRange = useMemo(() => {
    try {
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const [ey, em, ed] = endDate.split('-').map(Number);
      const diff = (new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / (1000 * 3600 * 24) + 1;
      return Math.max(1, Math.round(diff));
    } catch {
      return 1;
    }
  }, [startDate, endDate]);

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-7 shadow-md dark:shadow-2xl space-y-6 transition-colors duration-200">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="shrink-0 p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 shadow-sm">
              {getFacilityGraphic(facility.id, 'w-14 h-14 sm:w-16 sm:h-16 drop-shadow-sm')}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <span>Multi-Day & Season Recurring Booking</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Smart Auto-Day Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reserve multiple days, weekend tours, 1-month leagues or full seasons for {facility.name}.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Selected Ground pill */}
        <div className="flex flex-wrap items-center gap-2">
          {onSwitchToSingle && (
            <button
              type="button"
              onClick={onSwitchToSingle}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Switch to Daily Slots</span>
            </button>
          )}

          {onToggleCustomOptions && (
            <button
              type="button"
              onClick={onToggleCustomOptions}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs ${
                isCustomOptionsOpen
                  ? 'bg-sky-50 dark:bg-slate-800 border-sky-400 dark:border-slate-700 text-sky-950 dark:text-white'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
              <span>Rules & Add-ons</span>
            </button>
          )}

          {/* Selected Facility & Stage pill / switcher */}
          {(facility.id === 'cricket-ground' || facility.id === 'multipurpose-room') && facility.stages.length > 1 && onSelectStage ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium pl-1 hidden sm:inline">Ground:</span>
              {facility.stages.map((stage) => {
                const isSelected = selectedStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => onSelectStage(stage)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Selected Ground:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{facility.name}</span>
              {selectedStage && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span className="font-semibold text-sky-600 dark:text-cyan-300">{selectedStage}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Duration Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Step 1: Choose Booking Duration / Match Preset
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {totalDaysInRange} Day(s) Window
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: '2_days', label: '2 Days', desc: 'Short Match' },
                { id: '3_days', label: '3 Days', desc: 'Weekend Cup' },
                { id: '1_week', label: '1 Week', desc: '7 Days' },
                { id: '1_month', label: '1 Month', desc: '4 Weeks' },
                { id: '2_months', label: '2 Months', desc: '8 Weeks' },
                { id: 'custom', label: 'Custom', desc: 'Date Range' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyPreset(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    preset === item.id
                      ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${preset === item.id ? 'text-emerald-100 font-semibold' : 'text-slate-500'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Date Range Picker with Live Day of Week Display */}
          <div className="bg-slate-100 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Start Date
                  </label>
                  <span className="text-[11px] font-bold text-sky-600 dark:text-cyan-400 bg-sky-500/10 px-2 py-0.5 rounded">
                    {startDayName}
                  </span>
                </div>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    setPreset('custom');
                    if (newStart > endDate) {
                      setEndDate(newStart);
                    }
                    if (daySelectionMode === 'all_in_range') {
                      const spanned = getDaysSpannedByRange(newStart, endDate >= newStart ? endDate : newStart);
                      setSelectedDays(spanned);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    End Date
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {endDayName}
                  </span>
                </div>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayStr}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setEndDate(newEnd);
                    setPreset('custom');
                    if (daySelectionMode === 'all_in_range') {
                      const spanned = getDaysSpannedByRange(startDate, newEnd);
                      setSelectedDays(spanned);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Date Span Description */}
            <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Selected Period: <strong className="text-slate-900 dark:text-white">{formatDisplayDate(startDate, { short: true })}</strong> to <strong className="text-slate-900 dark:text-white">{formatDisplayDate(endDate, { short: true })}</strong>
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold rounded text-[11px]">
                {totalDaysInRange} {totalDaysInRange === 1 ? 'Day' : 'Days'} Total
              </span>
            </div>
          </div>

          {/* 3. Recurring Days of Week (With Auto-Calculation Badges) */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Step 2: Days of the Week
              </label>
              
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={setAutoDetectedDays}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 transition cursor-pointer"
                  title="Auto-select all days of week within this date range"
                >
                  ⚡ Auto-Sync Range Days
                </button>
                <button
                  type="button"
                  onClick={setAllDays}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
                >
                  All 7 Days
                </button>
                <button
                  type="button"
                  onClick={setWeekendsOnly}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
                >
                  Fri & Sat
                </button>
                <button
                  type="button"
                  onClick={setWeekdaysOnly}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
                >
                  Sun - Thu
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDays.includes(d.dayIndex);
                // Check if this day of week is inside the current date span
                const isSpannedInDateRange = getDaysSpannedByRange(startDate, endDate).includes(d.dayIndex);

                return (
                  <button
                    key={d.dayIndex}
                    type="button"
                    onClick={() => toggleDay(d.dayIndex)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-md ring-1 ring-emerald-400'
                        : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{d.short}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">{d.label.slice(0, 3)}</span>
                    {isSpannedInDateRange && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 absolute top-1.5 right-1.5" title="In selected date window" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Match Time Slot */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Step 3: Select Session Time Slot
            </label>
            <div className="grid grid-cols-2 gap-3 bg-slate-100 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
                <select
                  value={startTime}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartTime(newStart);
                    if (timeToMinutes(endTime) <= timeToMinutes(newStart)) {
                      const nextMin = timeToMinutes(newStart) + (facility.defaultSlotDurationMinutes || 60);
                      setEndTime(minutesToTime(nextMin));
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {timeOptions.slice(0, -1).map((t) => (
                    <option key={t} value={t}>
                      {formatDisplayTime(t)} ({t})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">End Time</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sky-600 dark:text-cyan-400 font-bold rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {timeOptions
                    .filter((t) => timeToMinutes(t) > timeToMinutes(startTime))
                    .map((t) => (
                      <option key={t} value={t}>
                        {formatDisplayTime(t)} ({t})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Real-Time Schedule Calculation & Conflict Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Calculated Schedule Summary ({matchedDates.length} Match Days)</span>
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  {availabilityReport.availableDates.length} Available
                </span>
                {availabilityReport.conflictDates.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-700 dark:text-red-300 font-bold">
                    {availabilityReport.conflictDates.length} Conflicts
                  </span>
                )}
              </div>
            </div>

            {/* Dates preview pill list with exact Day Names */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {matchedDates.length === 0 ? (
                <div className="text-slate-500 text-center py-4 space-y-2">
                  <p>No dates match the selected days of the week.</p>
                  <button
                    type="button"
                    onClick={setAutoDetectedDays}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Auto-Sync Days for This Date Range</span>
                  </button>
                </div>
              ) : (
                matchedDates.map((d) => {
                  const conflict = availabilityReport.conflictDates.find((c) => c.date === d);
                  const dayName = getDayName(d);

                  return (
                    <div
                      key={d}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        conflict
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {conflict ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatDisplayDate(d, { short: false })}
                        </span>
                      </div>

                      <div>
                        {conflict ? (
                          <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
                            Booked ({conflict.bookedBy})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            {formatDisplayTime(startTime)} – {formatDisplayTime(endTime)} Available
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details & 1-Click Multi-Date Checkout */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Step 4: Customer / Organization Details</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                All {availabilityReport.availableDates.length} sessions will be booked under this contact.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name / Club Captain *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Captain Tanvir / Dhaka Cricket Club"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (Excel Format) *
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0535487038 / +8801711223344"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Booked By (Staff / Helpdesk No)</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={bookedByStaff}
                onChange={(e) => setBookedByStaff(e.target.value)}
                placeholder="e.g. Helpdesk / Emp #104 / 017xxxx"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Team / Club / Dept</label>
                <input
                  type="text"
                  value={teamOrDept}
                  onChange={(e) => setTeamOrDept(e.target.value)}
                  placeholder="e.g. Premier League XI"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Players / Guests</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="captain@club.com"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Season Notes / Special Requests</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pitch preference, tournament fixtures, floodlight requirements..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none shadow-xs"
              />
            </div>

            {/* Results / Feedback Message */}
            {submitResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  submitResult.success
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-100 dark:bg-red-950/80 border-red-500/50 text-red-900 dark:text-red-200'
                }`}
              >
                {submitResult.success ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300">
                      <Check className="w-4 h-4" />
                      <span>Successfully Booked {submitResult.createdCount} Recurring Sessions!</span>
                    </div>
                    <p className="text-[11px]">
                      All match dates are locked in {selectedStage}. Google Sheets sync updated.
                    </p>
                  </div>
                ) : (
                  <div className="font-bold flex items-center space-x-1.5 text-red-700 dark:text-red-300">
                    <X className="w-4 h-4" />
                    <span>{submitResult.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || availabilityReport.availableDates.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
                availabilityReport.availableDates.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span>Locking in Schedule...</span>
              ) : (
                <>
                  <span>Confirm & Lock {availabilityReport.availableDates.length} Match Sessions</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200 dark:border-slate-900">
            <span>🛡️ Enterprise Collision Protection</span>
            <span>📊 Synced to Google Sheets</span>
          </div>
        </div>
      </div>
    </div>
  );
};


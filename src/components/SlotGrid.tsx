import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Lock,
  Coffee,
  ArrowRight,
  Filter,
  CheckCircle2,
  Scissors,
  Activity,
  Shield,
  Building2,
  Film,
  Dumbbell,
  Target,
  Trophy,
  HeartPulse,
  RefreshCw,
  Package,
  Search,
  User,
  Zap,
  Sparkles,
  Eye,
  Clock,
  ChevronLeft,
  CalendarRange,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimeSlot, Facility } from '../types';
import {
  formatDisplayTime,
  timeToMinutes,
  normalizeDateString,
  getTodayDateString,
} from '../services/storageService';
import { FacilitySlotWatermark, FacilitySlotMiniBadge } from './FacilitySlotStickers';
import { FacilityLockdownService } from '../services/facilityLockdownService';
import { AuthService } from '../services/authService';
import { FacilityCustomizationService } from '../services/facilityCustomizationService';
import { audioFeedback } from '../services/audioFeedbackService';
import { ActionFeedback } from '../services/actionFeedbackService';
import confetti from 'canvas-confetti';

interface SlotGridProps {
  slots: TimeSlot[];
  facility: Facility;
  selectedSlotIds: string[];
  onToggleSlot: (slot: TimeSlot) => void;
  onSlotDoubleClick?: (slot: TimeSlot) => void;
  onClearSlots?: () => void;
  onProceedToBooking: () => void;
  onViewBookingDetails: (bookingId: string) => void;
  bookingMode?: 'single' | 'recurring';
  onSelectBookingMode?: (mode: 'single' | 'recurring') => void;
  isCustomOptionsOpen?: boolean;
  onToggleCustomOptions?: () => void;
  onReturnToDashboard?: () => void;
  selectedStage?: string;
  onSelectStage?: (stage: string) => void;
}

interface FacilitySlotTheme {
  containerBorder: string;
  headerBadge: string;
  headerIcon: string;
  availableCard: string;
  selectedCard: string;
  selectedPill: string;
  bookButton: string;
  badgeBorder: string;
  accentText: string;
}

const getFacilitySlotTheme = (facilityId: string): FacilitySlotTheme => {
  switch (facilityId) {
    case 'barber-booking':
      return {
        containerBorder: 'border-indigo-200 dark:border-indigo-900/60',
        headerBadge: 'bg-indigo-100 dark:bg-indigo-950/90 text-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
        headerIcon: 'bg-indigo-600 text-white',
        availableCard: 'border-indigo-400 hover:border-indigo-600 dark:border-indigo-600 dark:hover:border-indigo-400 bg-indigo-50/25 dark:bg-indigo-950/20 hover:shadow-md hover:shadow-indigo-500/10',
        selectedCard: 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 ring-4 ring-indigo-500/25 shadow-lg shadow-indigo-500/15',
        selectedPill: 'bg-indigo-600 text-white',
        bookButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        badgeBorder: 'border-indigo-400 dark:border-indigo-600',
        accentText: 'text-indigo-700 dark:text-indigo-400',
      };
    case 'cricket-ground':
      return {
        containerBorder: 'border-emerald-200 dark:border-emerald-900/60',
        headerBadge: 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
        headerIcon: 'bg-emerald-600 text-white',
        availableCard: 'border-emerald-400 hover:border-emerald-600 dark:border-emerald-600 dark:hover:border-emerald-400 bg-emerald-50/25 dark:bg-emerald-950/20 hover:shadow-md hover:shadow-emerald-500/10',
        selectedCard: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-4 ring-emerald-500/25 shadow-lg shadow-emerald-500/15',
        selectedPill: 'bg-emerald-600 text-white',
        bookButton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        badgeBorder: 'border-emerald-400 dark:border-emerald-600',
        accentText: 'text-emerald-700 dark:text-emerald-400',
      };
    case 'football-ground':
      return {
        containerBorder: 'border-blue-200 dark:border-blue-900/60',
        headerBadge: 'bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700',
        headerIcon: 'bg-blue-600 text-white',
        availableCard: 'border-blue-400 hover:border-blue-600 dark:border-blue-600 dark:hover:border-blue-400 bg-blue-50/25 dark:bg-blue-950/20 hover:shadow-md hover:shadow-blue-500/10',
        selectedCard: 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-4 ring-blue-500/25 shadow-lg shadow-blue-500/15',
        selectedPill: 'bg-blue-600 text-white',
        bookButton: 'bg-blue-600 hover:bg-blue-700 text-white',
        badgeBorder: 'border-blue-400 dark:border-blue-600',
        accentText: 'text-blue-700 dark:text-blue-400',
      };
    case 'basketball-court':
      return {
        containerBorder: 'border-orange-200 dark:border-orange-900/60',
        headerBadge: 'bg-orange-100 dark:bg-orange-950/90 text-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700',
        headerIcon: 'bg-orange-600 text-white',
        availableCard: 'border-orange-400 hover:border-orange-600 dark:border-orange-600 dark:hover:border-orange-400 bg-orange-50/25 dark:bg-orange-950/20 hover:shadow-md hover:shadow-orange-500/10',
        selectedCard: 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 ring-4 ring-orange-500/25 shadow-lg shadow-orange-500/15',
        selectedPill: 'bg-orange-600 text-white',
        bookButton: 'bg-orange-600 hover:bg-orange-700 text-white',
        badgeBorder: 'border-orange-400 dark:border-orange-600',
        accentText: 'text-orange-700 dark:text-orange-400',
      };
    case 'cinema':
      return {
        containerBorder: 'border-rose-200 dark:border-rose-900/60',
        headerBadge: 'bg-rose-100 dark:bg-rose-950/90 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700',
        headerIcon: 'bg-rose-600 text-white',
        availableCard: 'border-rose-400 hover:border-rose-600 dark:border-rose-600 dark:hover:border-rose-400 bg-rose-50/25 dark:bg-rose-950/20 hover:shadow-md hover:shadow-rose-500/10',
        selectedCard: 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-4 ring-rose-500/25 shadow-lg shadow-rose-500/15',
        selectedPill: 'bg-rose-600 text-white',
        bookButton: 'bg-rose-600 hover:bg-rose-700 text-white',
        badgeBorder: 'border-rose-400 dark:border-rose-600',
        accentText: 'text-rose-700 dark:text-rose-400',
      };
    case 'tennis-court':
      return {
        containerBorder: 'border-teal-200 dark:border-teal-900/60',
        headerBadge: 'bg-teal-100 dark:bg-teal-950/90 text-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-700',
        headerIcon: 'bg-teal-600 text-white',
        availableCard: 'border-teal-400 hover:border-teal-600 dark:border-teal-600 dark:hover:border-teal-400 bg-teal-50/25 dark:bg-teal-950/20 hover:shadow-md hover:shadow-teal-500/10',
        selectedCard: 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 ring-4 ring-teal-500/25 shadow-lg shadow-teal-500/15',
        selectedPill: 'bg-teal-600 text-white',
        bookButton: 'bg-teal-600 hover:bg-teal-700 text-white',
        badgeBorder: 'border-teal-400 dark:border-teal-600',
        accentText: 'text-teal-700 dark:text-teal-400',
      };
    case 'cricket-net':
      return {
        containerBorder: 'border-cyan-200 dark:border-cyan-900/60',
        headerBadge: 'bg-cyan-100 dark:bg-cyan-950/90 text-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
        headerIcon: 'bg-cyan-600 text-white',
        availableCard: 'border-cyan-400 hover:border-cyan-600 dark:border-cyan-600 dark:hover:border-cyan-400 bg-cyan-50/25 dark:bg-cyan-950/20 hover:shadow-md hover:shadow-cyan-500/10',
        selectedCard: 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 ring-4 ring-cyan-500/25 shadow-lg shadow-cyan-500/15',
        selectedPill: 'bg-cyan-600 text-white',
        bookButton: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        badgeBorder: 'border-cyan-400 dark:border-cyan-600',
        accentText: 'text-cyan-700 dark:text-cyan-400',
      };
    case 'multipurpose-room':
      return {
        containerBorder: 'border-purple-200 dark:border-purple-900/60',
        headerBadge: 'bg-purple-100 dark:bg-purple-950/90 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700',
        headerIcon: 'bg-purple-600 text-white',
        availableCard: 'border-purple-400 hover:border-purple-600 dark:border-purple-600 dark:hover:border-purple-400 bg-purple-50/25 dark:bg-purple-950/20 hover:shadow-md hover:shadow-purple-500/10',
        selectedCard: 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-4 ring-purple-500/25 shadow-lg shadow-purple-500/15',
        selectedPill: 'bg-purple-600 text-white',
        bookButton: 'bg-purple-600 hover:bg-purple-700 text-white',
        badgeBorder: 'border-purple-400 dark:border-purple-600',
        accentText: 'text-purple-700 dark:text-purple-400',
      };
    default:
      return {
        containerBorder: 'border-slate-200 dark:border-slate-800',
        headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
        headerIcon: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900',
        availableCard: 'border-emerald-400/90 hover:border-emerald-600 dark:border-slate-700 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 hover:shadow-md',
        selectedCard: 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-4 ring-sky-500/20 shadow-lg',
        selectedPill: 'bg-sky-600 text-white',
        bookButton: 'bg-amber-500 hover:bg-amber-600 text-white',
        badgeBorder: 'border-slate-300 dark:border-slate-700',
        accentText: 'text-emerald-700 dark:text-emerald-400',
      };
  }
};

const renderFacilityIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'Scissors':
      return <Scissors className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'RefreshCw':
      return <RefreshCw className={className} />;
    case 'Package':
      return <Package className={className} />;
    case 'Search':
      return <Search className={className} />;
    default:
      return <Activity className={className} />;
  }
};

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  facility,
  selectedSlotIds,
  onToggleSlot,
  onSlotDoubleClick,
  onClearSlots,
  onProceedToBooking,
  onViewBookingDetails,
  bookingMode = 'single',
  onSelectBookingMode,
  isCustomOptionsOpen,
  onToggleCustomOptions,
  onReturnToDashboard,
  selectedStage,
  onSelectStage,
}) => {
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'BOOKED' | 'BREAK'>('ALL');
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const isSuperAdmin = AuthService.isSuperAdmin();

  // In-Place Slot Creator State for Super Admin
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [slotStart, setSlotStart] = useState('06:00');
  const [slotEnd, setSlotEnd] = useState('07:00');
  const [slotLabel, setSlotLabel] = useState('Special Session');
  const [slotIsBreak, setSlotIsBreak] = useState(false);

  // In-Place Room Creator State for Super Admin
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleSaveCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotStart || !slotEnd) return;
    FacilityCustomizationService.addCustomSlot(facility.id, {
      startTime: slotStart,
      endTime: slotEnd,
      label: slotLabel.trim() || undefined,
      isBreak: slotIsBreak,
    });
    setIsAddingSlot(false);
  };

  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    FacilityCustomizationService.addStage(facility.id, newRoomName.trim());
    setNewRoomName('');
    setIsAddingRoom(false);
  };

  const handleDeleteRoom = (stg: string) => {
    if (facility.stages.length <= 1) {
      alert('A facility must have at least one room/stage active.');
      return;
    }
    if (window.confirm(`Delete "${stg}" from ${facility.name}?`)) {
      FacilityCustomizationService.deleteStage(facility.id, stg);
    }
  };

  // Live minute ticker to evaluate upcoming time dynamically in real-time
  const [currentMinuteTicker, setCurrentMinuteTicker] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const updateTicker = () => {
      const d = new Date();
      setCurrentMinuteTicker(d.getHours() * 60 + d.getMinutes());
    };
    updateTicker();
    const interval = setInterval(updateTicker, 10000); // Live tick every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const availableSlots = useMemo(() => slots.filter((s) => s.status === 'AVAILABLE'), [slots]);
  const bookedSlots = useMemo(() => slots.filter((s) => s.status === 'BOOKED'), [slots]);
  const breakSlots = useMemo(() => slots.filter((s) => s.status === 'BREAK'), [slots]);

  // Today's calendar date string (YYYY-MM-DD)
  const todayDateStr = useMemo(() => getTodayDateString(), []);
  const lockdownStatus = FacilityLockdownService.isFacilityBlocked(facility.id);

  // Determine if the current active slot list belongs to Today, Future, or Past
  const slotDateStr = useMemo(() => {
    if (slots.length > 0 && slots[0].date) {
      return normalizeDateString(slots[0].date);
    }
    return todayDateStr;
  }, [slots, todayDateStr]);

  const isToday = slotDateStr === todayDateStr;
  const isPastDay = slotDateStr < todayDateStr;
  const isFutureDay = slotDateStr > todayDateStr;

  // Find the strictly genuine "Next Up" available slot based on real clock time
  // (e.g. at 4:20 PM -> 4:30 PM slot; if 4:30 is booked -> 5:00 PM; past slots like 11:00 AM are NEVER selected)
  const earliestAvailableSlotId = useMemo(() => {
    // If viewing yesterday or any past day, no slot can ever be "Next Up"
    if (isPastDay) return null;

    const available = slots.filter((s) => s.status === 'AVAILABLE');
    if (available.length === 0) return null;

    // Sort available slots in strict chronological order by start time
    const sortedAvailable = [...available].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    if (isToday) {
      // 1. Look for the next available slot that starts at or after current clock time (e.g. at 4:20 PM -> 4:30 PM)
      const upcoming = sortedAvailable.find(
        (s) => timeToMinutes(s.startTime) >= currentMinuteTicker
      );
      if (upcoming) return upcoming.id;

      // 2. Look for currently active ongoing slot that has not yet ended
      const ongoing = sortedAvailable.find(
        (s) => timeToMinutes(s.endTime) > currentMinuteTicker
      );
      if (ongoing) return ongoing.id;

      // 3. If all available slots for today have already passed their endTime, DO NOT highlight any past slot!
      return null;
    }

    if (isFutureDay) {
      // For upcoming future days, the earliest available slot of that day is the next available
      return sortedAvailable[0]?.id || null;
    }

    return null;
  }, [slots, isToday, isPastDay, isFutureDay, currentMinuteTicker]);

  const selectedSlotsList = useMemo(() => {
    const list = slots.filter((s) => selectedSlotIds.includes(s.id));
    return list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [slots, selectedSlotIds]);

  const hasSelection = selectedSlotsList.length > 0;
  const earliestStart = selectedSlotsList[0]?.startTime;
  const latestEnd = selectedSlotsList[selectedSlotsList.length - 1]?.endTime;

  const getSlotPeriod = (timeStr: string) => {
    const totalMin = timeToMinutes(timeStr);
    const h = Math.floor(totalMin / 60);
    if (h >= 6 && h < 12) return { id: 'MORNING', label: 'Morning', icon: '🌅' };
    if (h >= 12 && h < 16) return { id: 'AFTERNOON', label: 'Afternoon', icon: '☀️' };
    if (h >= 16 && h < 19) return { id: 'EVENING', label: 'Evening', icon: '🌇' };
    return { id: 'NIGHT', label: 'Night', icon: '🌙' };
  };

  const getSlotDuration = (start: string, end: string) => {
    const duration = timeToMinutes(end) - timeToMinutes(start);
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} Hour${hours > 1 ? 's' : ''}`;
    }
    return `${duration} Mins`;
  };

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (selectedSessionFilter !== 'ALL' && getSlotPeriod(s.startTime).id !== selectedSessionFilter) return false;
      return true;
    });
  }, [slots, statusFilter, selectedSessionFilter]);

  if (facility.isComingSoon) {
    return (
      <div className="w-full bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-3xl text-slate-700 dark:text-slate-300">
          {renderFacilityIcon(facility.icon, 'w-8 h-8')}
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{facility.name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{facility.description}</p>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
          🔒 Module in Dormant Mode · Coming Soon
        </span>
      </div>
    );
  }

  const theme = getFacilitySlotTheme(facility.id);

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border-2 ${theme.containerBorder} rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors`}>
      
      {/* 1. Header & Live Controls / Status Filter Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {onReturnToDashboard && (
            <button
              type="button"
              onClick={onReturnToDashboard}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700 shadow-2xs mr-0.5"
              title="Return to Facilities Hub"
            >
              <ChevronLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </button>
          )}
          <div className={`w-8 h-8 rounded-xl ${theme.headerIcon} flex items-center justify-center shadow-xs shrink-0`}>
            {renderFacilityIcon(facility.icon, 'w-4 h-4')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white tracking-tight leading-none">
                Available Time Slots
              </h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${theme.headerBadge}`}>
                {facility.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Double-click any available slot to instantly open booking form</span>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                <span>⚡ Instant Double-Click Reservation</span>
              </span>
            </p>
          </div>
        </div>

        {/* Relocated Executive Controls & Live Slot Stats */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Daily vs Season Booking Toggle */}
          {onSelectBookingMode && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => onSelectBookingMode('single')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  bookingMode === 'single'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Daily Slots</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectBookingMode('recurring')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  bookingMode === 'recurring'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <CalendarRange className="w-3 h-3" />
                <span>Season Booking</span>
              </button>
            </div>
          )}

          {/* Rules & Add-ons Button */}
          {onToggleCustomOptions && (
            <button
              type="button"
              onClick={onToggleCustomOptions}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
                isCustomOptionsOpen
                  ? 'bg-sky-50 dark:bg-slate-800 border-sky-400 dark:border-slate-700 text-sky-950 dark:text-white'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
              <span>Rules & Add-ons</span>
              {isCustomOptionsOpen ? (
                <ChevronUp className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              )}
            </button>
          )}

          {/* Live Slot Stats Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({slots.length})
            </button>

            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open ({availableSlots.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('BOOKED')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'BOOKED'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Booked ({bookedSlots.length})</span>
            </button>

            {breakSlots.length > 0 && (
              <button
                onClick={() => setStatusFilter('BREAK')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'BREAK'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                }`}
              >
                <Coffee className="w-3 h-3" />
                <span>Break ({breakSlots.length})</span>
              </button>
            )}

            {/* Super Admin In-Place Add Slot Trigger */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsAddingSlot(!isAddingSlot)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isAddingSlot
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                }`}
                title="Super Admin: Add custom time slot directly"
              >
                <Plus className="w-3 h-3" />
                <span>+ Slot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Super Admin In-Place Custom Slot Form */}
      {isAddingSlot && isSuperAdmin && (
        <form onSubmit={handleSaveCustomSlot} className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-400/50 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Add Slot:</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="time"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
              className="px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-500 font-bold">to</span>
            <input
              type="time"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
              className="px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <input
            type="text"
            placeholder="Label (e.g. Special Session)"
            value={slotLabel}
            onChange={(e) => setSlotLabel(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex-1 min-w-[130px]"
          />
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={slotIsBreak}
              onChange={(e) => setSlotIsBreak(e.target.checked)}
              className="rounded"
            />
            <span>Break</span>
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-xs cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingSlot(false)}
              className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 1.5 Compact Active Resource Selector - Shown for Multi-stage or Super Admin */}
      {(facility.stages.length > 1 || isSuperAdmin) && onSelectStage && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Resource:
            </span>
            <span className="text-xs font-black text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2.5 py-0.5 rounded-lg border border-sky-300 dark:border-sky-800">
              {selectedStage || facility.stages[0]}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline">
              ({facility.stages.length} {facility.stages.length === 1 ? 'room' : 'rooms'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {facility.stages.map((stage) => {
              const isSelected = (selectedStage || facility.stages[0]) === stage;
              return (
                <div key={stage} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelectStage(stage)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    <span>{stage}</span>
                  </button>
                  {isSuperAdmin && facility.stages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(stage);
                      }}
                      className="ml-0.5 p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                      title={`Delete "${stage}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Super Admin Inline Add Room */}
            {isSuperAdmin && (
              !isAddingRoom ? (
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(true)}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-dashed border-sky-300 dark:border-sky-700 hover:bg-sky-100 transition cursor-pointer flex items-center gap-1"
                  title="Add Room / Stage to this facility"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Room</span>
                </button>
              ) : (
                <form onSubmit={handleAddRoomSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="px-2 py-0.5 text-xs rounded border border-sky-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-sky-600 text-white text-xs font-bold rounded cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingRoom(false);
                      setNewRoomName('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      )}

      {/* 2. Time Range Session Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Filter:
        </span>

        <button
          onClick={() => setSelectedSessionFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            selectedSessionFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Day
        </button>

        {[
          { id: 'MORNING', label: 'Morning', icon: '🌅' },
          { id: 'AFTERNOON', label: 'Afternoon', icon: '☀️' },
          { id: 'EVENING', label: 'Evening', icon: '🌇' },
          { id: 'NIGHT', label: 'Night', icon: '🌙' },
        ].map((period) => {
          const count = slots.filter((s) => getSlotPeriod(s.startTime).id === period.id && s.status === 'AVAILABLE').length;
          const isSelected = selectedSessionFilter === period.id;

          return (
            <button
              key={period.id}
              onClick={() => setSelectedSessionFilter(period.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{period.icon}</span>
              <span>{period.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Slot Cards Grid with Themed Stickers, Distinct Border Colors, and Rotating Next-Up Border */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2.5 sm:gap-3.5">
        {filteredSlots.map((slot, idx) => {
          const isSelected = selectedSlotIds.includes(slot.id);
          const isAvailable = slot.status === 'AVAILABLE';
          const isBooked = slot.status === 'BOOKED';
          const isBreak = slot.status === 'BREAK';
          const isEarliest = isAvailable && slot.id === earliestAvailableSlotId;
          const period = getSlotPeriod(slot.startTime);
          const durationLabel = getSlotDuration(slot.startTime, slot.endTime);
          const selectedIndex = selectedSlotsList.findIndex((s) => s.id === slot.id);

          return (
            <div key={slot.id || `slot-${idx}-${slot.startTime}`} className="relative group">
              {/* Animated Rotating Colorful Halo for Earliest Next Slot */}
              {isEarliest && !isSelected && (
                <div className="absolute -inset-[2.5px] rounded-2xl bg-[conic-gradient(from_0deg,#10b981,#06b6d4,#6366f1,#f59e0b,#10b981)] animate-[spin_3.5s_linear_infinite] opacity-95 pointer-events-none z-0 blur-[0.5px]" />
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: Math.min(idx * 0.01, 0.2) }}
                whileHover={isBreak ? undefined : { y: -4, transition: { duration: 0.15 } }}
                whileTap={isBreak ? undefined : { scale: 0.97 }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isBreak) return;
                  if (lockdownStatus.isBlocked) {
                    const unlockTimeStr = lockdownStatus.lockdown?.unlockAt
                      ? new Date(lockdownStatus.lockdown.unlockAt).toLocaleTimeString()
                      : 'further notice';
                    alert(`This facility is currently locked down for maintenance/event until ${unlockTimeStr}. Reason: ${lockdownStatus.lockdown?.reason || 'Maintenance'}`);
                    return;
                  }
                  if (isBooked && slot.bookingId) {
                    onViewBookingDetails(slot.bookingId);
                  } else if (isAvailable || isSelected) {
                    if (onSlotDoubleClick) {
                      onSlotDoubleClick(slot);
                    } else {
                      if (!isSelected) {
                        onToggleSlot(slot);
                      }
                      onProceedToBooking();
                    }
                  }
                }}
                onTouchEnd={() => {
                  const now = Date.now();
                  if (lastTapRef.current.id === slot.id && now - lastTapRef.current.time < 350) {
                    // Double tap on mobile
                    if (isBreak || lockdownStatus.isBlocked) return;
                    if (isBooked && slot.bookingId) {
                      onViewBookingDetails(slot.bookingId);
                    } else if (isAvailable || isSelected) {
                      if (onSlotDoubleClick) {
                        onSlotDoubleClick(slot);
                      } else {
                        if (!isSelected) {
                          onToggleSlot(slot);
                        }
                        onProceedToBooking();
                      }
                    }
                    lastTapRef.current = { id: '', time: 0 };
                  } else {
                    lastTapRef.current = { id: slot.id, time: now };
                  }
                }}
                onClick={() => {
                  if (isBreak) return;
                  if (lockdownStatus.isBlocked) {
                    const unlockTimeStr = lockdownStatus.lockdown?.unlockAt
                      ? new Date(lockdownStatus.lockdown.unlockAt).toLocaleTimeString()
                      : 'further notice';
                    alert(`This facility is currently locked down for maintenance/event until ${unlockTimeStr}. Reason: ${lockdownStatus.lockdown?.reason || 'Maintenance'}`);
                    return;
                  }
                  if (isBooked && slot.bookingId) {
                    audioFeedback.playTap();
                    ActionFeedback.startLoading('Loading Booking', `Pass #${slot.bookingId.slice(-6)}`, facility.id, 240);
                    onViewBookingDetails(slot.bookingId);
                  } else if (isAvailable || isSelected) {
                    audioFeedback.playSlotSelect(!isSelected);
                    if (!isSelected) {
                      try {
                        confetti({
                          particleCount: 15,
                          spread: 45,
                          origin: { y: 0.8 },
                        });
                      } catch (e) {}
                    }
                    onToggleSlot(slot);
                  }
                }}
                className={`relative min-h-[148px] sm:min-h-[156px] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 select-none cursor-pointer overflow-hidden border-2 z-10 ${
                  isBreak
                    ? 'border-dashed border-amber-400/90 dark:border-amber-600/70 bg-amber-50/70 dark:bg-amber-950/30 opacity-85 cursor-not-allowed shadow-2xs'
                    : isBooked
                    ? 'border-slate-200/90 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/50 opacity-60 hover:opacity-85 hover:border-slate-300 dark:hover:border-slate-700 shadow-none'
                    : isSelected
                    ? theme.selectedCard
                    : isEarliest
                    ? 'border-transparent bg-white dark:bg-slate-900 shadow-md ring-2 ring-emerald-500/40'
                    : theme.availableCard
                }`}
              >
                {/* Background Thematic Watermark Sticker - Vibrant & Darker */}
                <div className={`absolute -right-2.5 -bottom-2.5 pointer-events-none z-0 transition-transform duration-300 group-hover:scale-125 ${
                  isBooked ? 'opacity-10 grayscale' : isBreak ? 'opacity-20' : 'opacity-80 group-hover:opacity-100'
                }`}>
                  <FacilitySlotWatermark
                    facilityId={facility.id}
                    slotIndex={idx}
                    status={isSelected ? 'SELECTED' : isBooked ? 'BOOKED' : isBreak ? 'BREAK' : 'AVAILABLE'}
                    className="w-24 h-24"
                  />
                </div>

                {/* Top Row: Period Badge, Mini Badge & Status Pill */}
                <div className="relative z-10 flex items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      isBreak
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                        : isBooked
                        ? 'bg-slate-200/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                        : isSelected
                        ? 'bg-white/90 dark:bg-slate-900 text-slate-900 dark:text-white font-black shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}>
                      <span>{period.icon}</span>
                      <span>{period.label}</span>
                    </span>

                    {/* Earliest Next Slot Badge */}
                    {isEarliest && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs animate-pulse">
                        <span>⚡</span>
                        <span>Next Up</span>
                      </span>
                    )}

                    {/* Physical Mini Badge Sticker for Facility (e.g. VIP Groom, FIFA Pro, ICC Turf) */}
                    {isAvailable && !isEarliest && (
                      <FacilitySlotMiniBadge facilityId={facility.id} status="AVAILABLE" />
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isBooked ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold border border-slate-300/80 dark:border-slate-700/80 shadow-2xs">
                        <Lock className="w-2.5 h-2.5" />
                        <span>BOOKED</span>
                      </span>
                    ) : isSelected ? (
                      <span className={`w-5 h-5 rounded-full ${theme.selectedPill} flex items-center justify-center font-black text-[10px] shadow-xs`}>
                        {selectedIndex >= 0 ? `#${selectedIndex + 1}` : '✓'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        {durationLabel}
                      </span>
                    )}

                    {/* Super Admin In-Place Slot Removal */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Disable/remove slot ${slot.startTime} - ${slot.endTime} from ${facility.name}?`)) {
                            FacilityCustomizationService.disableSlot(facility.id, slot.startTime);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Super Admin: Disable / Delete this slot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center: Time Display & Occupant Context */}
                <div className="relative z-10 space-y-1 my-auto">
                  <div className={`text-base sm:text-lg font-black tracking-tight leading-none ${
                    isBooked 
                      ? 'text-slate-600 dark:text-slate-400 font-bold' 
                      : isSelected 
                      ? 'text-slate-950 dark:text-white' 
                      : 'text-slate-950 dark:text-white'
                  }`}>
                    {formatDisplayTime(slot.startTime)}
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    until {formatDisplayTime(slot.endTime)}
                  </div>

                  {/* If Booked, display occupant name in balanced compact container */}
                  {isBooked && (
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 dark:bg-slate-950/90 text-white border border-slate-700/60 shadow-2xs max-w-full">
                      <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[12px] sm:text-[12.5px] font-bold tracking-tight truncate leading-tight text-amber-300 dark:text-amber-300">
                        {slot.bookedBy || 'Reserved Guest'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom: Status / Action Strip */}
                <div className={`relative z-10 pt-2 border-t flex items-center justify-between text-xs ${
                  isBreak
                    ? 'border-amber-200/80 dark:border-amber-800/80'
                    : isBooked
                    ? 'border-slate-200 dark:border-slate-800'
                    : isSelected
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}>
                  {isBreak ? (
                    <div className="flex items-center gap-1 text-amber-900 dark:text-amber-200 font-bold truncate text-[10px]">
                      <Coffee className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="truncate">{slot.breakLabel || 'Break Time'}</span>
                    </div>
                  ) : isBooked ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                        Occupied
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all flex items-center gap-1 shadow-2xs">
                        <span>Slip</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  ) : isSelected ? (
                    <div className="flex items-center justify-between w-full text-slate-900 dark:text-white font-bold">
                      <span className="text-[11px] font-black">Selected</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className={`flex items-center gap-1.5 text-[11px] font-black ${theme.accentText}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                        <span>Available</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-white font-black text-[11px] transition-all shadow-xs group-hover:scale-105 ${
                        isEarliest ? 'bg-emerald-600 hover:bg-emerald-700' : theme.bookButton
                      }`}>
                        Book +
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {filteredSlots.length === 0 && (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium space-y-2">
          <p>No slots found matching the selected filter criteria.</p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setSelectedSessionFilter('ALL');
            }}
            className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 4. Bottom Selection Floating Bar */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.15 }}
            className="border border-sky-500/40 bg-sky-950 text-white rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-lg shrink-0">
                {selectedSlotsList.length}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {selectedSlotsList.length} Slot{selectedSlotsList.length > 1 ? 's' : ''} Selected ({facility.name})
                </h4>
                <p className="text-xs text-sky-200 font-medium">
                  {formatDisplayTime(earliestStart)} – {formatDisplayTime(latestEnd)} · {selectedSlotsList[0]?.date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  if (onClearSlots) {
                    onClearSlots();
                  } else {
                    selectedSlotsList.forEach((s) => onToggleSlot(s));
                  }
                }}
                className="text-xs font-bold text-sky-300 hover:text-white px-3 py-2 cursor-pointer transition hover:bg-white/10 rounded-xl"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  audioFeedback.playTap();
                  ActionFeedback.startLoading('Executive Reservation', `Booking ${selectedSlotsList.length} slot(s)`, facility.id, 260);
                  onProceedToBooking();
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Proceed to Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};


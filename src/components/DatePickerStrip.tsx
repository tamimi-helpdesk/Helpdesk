import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { StorageService, normalizeDateString, isFacilityMatch, isStageMatch } from '../services/storageService';
import { Facility } from '../types';
import { FACILITIES } from '../data/facilities';
import { audioFeedback } from '../services/audioFeedbackService';
import { ActionFeedback } from '../services/actionFeedbackService';

interface DatePickerStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  facilityId?: string;
  facility?: Facility;
  selectedStage?: string;
}

export const DatePickerStrip: React.FC<DatePickerStripProps> = ({
  selectedDate,
  onSelectDate,
  facilityId,
  facility,
  selectedStage,
}) => {
  const [bookingDateCounts, setBookingDateCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const updateCounts = () => {
      const all = StorageService.getAllBookings();
      const counts: Record<string, number> = {};
      const targetFacility = facility || (facilityId ? FACILITIES.find((f) => f.id === facilityId) : undefined);

      all.forEach((b) => {
        if (b.status !== 'CANCELLED' && b.date) {
          if (targetFacility) {
            if (!isFacilityMatch(b, targetFacility)) return;
            if (selectedStage && !isStageMatch(b.stage, selectedStage, targetFacility)) return;
          }
          const d = normalizeDateString(b.date);
          counts[d] = (counts[d] || 0) + 1;
        }
      });
      setBookingDateCounts(counts);
    };

    updateCounts();
    window.addEventListener('tamimi_bookings_updated', updateCounts);
    return () => {
      window.removeEventListener('tamimi_bookings_updated', updateCounts);
    };
  }, [facilityId, facility, selectedStage]);
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Dynamically calculate continuous calendar tiles up to 1+ years into the future or more
  const allDateOptions = useMemo(() => {
    const options: {
      dateStr: string;
      dayName: string;
      dayNumber: number;
      monthName: string;
      year: number;
      isToday: boolean;
      isTomorrow: boolean;
      isYesterday: boolean;
      isPast: boolean;
    }[] = [];

    const [ty, tm, td] = todayStr.split('-').map(Number);
    const todayDateObj = new Date(ty, tm - 1, td);

    let selOffset = 0;
    try {
      const [sy, sm, sd] = selectedDate.split('-').map(Number);
      const selDateObj = new Date(sy, sm - 1, sd);
      const diffMs = selDateObj.getTime() - todayDateObj.getTime();
      selOffset = Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {}

    // Ensure range spans at least -30 days to +365 days, and dynamically expands if selectedDate is further
    const startOffset = Math.min(-30, isNaN(selOffset) ? -30 : selOffset - 30);
    const endOffset = Math.max(365, isNaN(selOffset) ? 365 : selOffset + 60);

    for (let offset = startOffset; offset <= endOffset; offset++) {
      const d = new Date(ty, tm - 1, td + offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      options.push({
        dateStr,
        dayName,
        dayNumber,
        monthName,
        year,
        isToday: dateStr === todayStr,
        isTomorrow: offset === 1,
        isYesterday: offset === -1,
        isPast: dateStr < todayStr,
      });
    }

    return options;
  }, [todayStr, selectedDate]);

  // Auto-scroll into view when selectedDate changes or on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedEl = scrollContainerRef.current.querySelector(
        `[data-date="${selectedDate}"]`
      ) as HTMLElement | null;

      if (selectedEl) {
        selectedEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [selectedDate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleChooseDate = (newDateStr: string) => {
    if (!newDateStr) return;
    audioFeedback.playTap();
    if (newDateStr !== selectedDate) {
      ActionFeedback.startLoading('Updating Schedule', newDateStr, facilityId, 240);
    }
    onSelectDate(newDateStr);
  };

  const handleStepDay = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d + delta);
    const newYear = current.getFullYear();
    const newMonth = String(current.getMonth() + 1).padStart(2, '0');
    const newDay = String(current.getDate()).padStart(2, '0');
    const newDateStr = `${newYear}-${newMonth}-${newDay}`;
    handleChooseDate(newDateStr);
  };

  const handleJumpToToday = () => {
    handleChooseDate(todayStr);
  };

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const handleScrollStrip = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleJumpToTomorrow = () => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const tmrw = new Date(y, m - 1, d + 1);
    const newDateStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
    handleChooseDate(newDateStr);
  };

  const handleJumpToWeekend = () => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    const dayOfWeek = current.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    // Target upcoming Friday/Saturday
    let daysToAdd = (5 - dayOfWeek + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // Next weekend if today is Friday
    current.setDate(current.getDate() + daysToAdd);
    const newDateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    handleChooseDate(newDateStr);
  };

  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isPastSelected = selectedDate < todayStr;
  const isTodaySelected = selectedDate === todayStr;
  const isFutureSelected = selectedDate > todayStr;

  const isTomorrowSelected = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const tmrw = new Date(y, m - 1, d + 1);
    const tStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
    return selectedDate === tStr;
  }, [todayStr, selectedDate]);

  const isWeekendSelected = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const day = new Date(y, m - 1, d).getDay();
      return day === 5 || day === 6; // Friday or Saturday
    } catch {
      return false;
    }
  }, [selectedDate]);

  return (
    <div
      className={`w-full bg-white dark:bg-slate-900/95 border-2 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg shadow-slate-900/5 dark:shadow-2xl space-y-3.5 transition-colors duration-300 ${
        isTodaySelected
          ? 'border-blue-200/90 dark:border-blue-900/50'
          : isFutureSelected
          ? 'border-emerald-200/90 dark:border-emerald-900/50'
          : 'border-amber-200/90 dark:border-amber-900/50'
      }`}
    >
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Title & Active Date Preview & Quick Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border transition-transform duration-300 hover:scale-105 shadow-2xs ${
              isTodaySelected
                ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700/60'
                : isFutureSelected
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
            }`}
          >
            {isTodaySelected ? (
              <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : isFutureSelected ? (
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white tracking-tight">
                Date:
              </h3>
              <span
                className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs transition-colors duration-200 ${
                  isTodaySelected
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                    : isFutureSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                }`}
              >
                <span>{formattedSelectedDate}</span>
                {isTodaySelected && (
                  <span className="ml-1.5 text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-600 text-white shadow-2xs">
                    Today
                  </span>
                )}
                {isFutureSelected && (
                  <span className="ml-1.5 text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-600 text-white shadow-2xs">
                    Upcoming
                  </span>
                )}
                {isPastSelected && (
                  <span className="ml-1.5 text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-600 text-white shadow-2xs">
                    Past
                  </span>
                )}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {isTodaySelected
                ? "Select date to check slots and reservations • Today's active schedule"
                : isFutureSelected
                ? "Select date to check slots and reservations • Advance booking view"
                : "Select date to check slots and reservations • Historical archive view"}
            </p>
          </div>
        </div>

        {/* Action Controls: Quick Date Presets & Day Stepper & Executive Date Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Preset Buttons */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-950/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={handleJumpToToday}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isTodaySelected
                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleJumpToTomorrow}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isTomorrowSelected
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={handleJumpToWeekend}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isWeekendSelected
                  ? isTodaySelected
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : isFutureSelected
                    ? 'bg-emerald-600 text-white shadow-2xs font-black'
                    : 'bg-amber-600 text-white shadow-2xs font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Weekend
            </button>
          </div>

          {/* Snap to Today Shortcut Button on mobile */}
          {!isTodaySelected && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleJumpToToday}
              className="sm:hidden flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Jump to Today"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Today</span>
            </motion.button>
          )}

          {/* Day Stepper Controls */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={() => handleStepDay(-1)}
              className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-0.5" />
            <button
              onClick={() => handleStepDay(1)}
              className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Professional Executive Manual Date Selector Button */}
          <div className="relative inline-flex items-center">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              onClick={handleOpenDatePicker}
              type="button"
              className={`group flex items-center space-x-2 px-3.5 py-1.5 bg-white dark:bg-slate-950/90 border-2 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                isTodaySelected
                  ? 'border-blue-200 dark:border-blue-800 hover:border-blue-500'
                  : isFutureSelected
                  ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-500'
                  : 'border-amber-200 dark:border-amber-800 hover:border-amber-500'
              }`}
              title="Choose Custom Date from Calendar"
            >
              <div
                className={`p-1 rounded-lg group-hover:scale-110 transition-transform ${
                  isTodaySelected
                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                    : isFutureSelected
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">Pick Date</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-0.5">▾</span>
            </motion.button>

            {/* Invisible Native Date Input Overlay for Cross-Browser Calendar Trigger */}
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) handleChooseDate(e.target.value);
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              tabIndex={-1}
              aria-label="Select Date"
            />
          </div>
        </div>
      </div>

      {/* Date Tiles Strip with Left and Right Scroll Buttons */}
      <div className="relative group/strip flex items-center">
        {/* Left Scroll Button */}
        <button
          onClick={() => handleScrollStrip(-280)}
          className="hidden sm:flex absolute -left-2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-400 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </button>

        {/* Clean Drag-to-Scroll Date Tiles Strip */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-2.5 overflow-x-auto py-2 px-1 no-scrollbar select-none rounded-2xl w-full ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab scroll-smooth'
          }`}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {allDateOptions.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            const currentYear = new Date().getFullYear();
            const showYear = item.year !== currentYear;
            const activeBookingCount = bookingDateCounts[item.dateStr] || 0;

            return (
              <motion.button
                key={item.dateStr}
                data-date={item.dateStr}
                whileHover={isDragging ? undefined : { y: -4, scale: 1.05 }}
                whileTap={isDragging ? undefined : { scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={() => {
                  if (!hasMoved) {
                    handleChooseDate(item.dateStr);
                  }
                }}
                className={`shrink-0 w-[72px] sm:w-[82px] flex flex-col items-center justify-between py-2.5 px-1.5 rounded-2xl transition-all duration-200 border-2 select-none cursor-pointer relative overflow-hidden group/tile ${
                  isSelected
                    ? item.isToday
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 border-blue-300 dark:border-blue-400 text-white shadow-xl shadow-blue-600/45 glow-border-blue scale-[1.04]'
                      : item.isPast
                      ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 border-amber-300 dark:border-amber-400 text-white shadow-xl shadow-amber-600/40 glow-border-amber scale-[1.04]'
                      : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 border-emerald-300 dark:border-emerald-400 text-white shadow-xl shadow-emerald-600/45 glow-border-emerald scale-[1.04]'
                    : item.isPast
                    ? 'bg-amber-50/90 dark:bg-amber-950/30 hover:bg-amber-100/90 dark:hover:bg-amber-900/40 border-amber-300 dark:border-amber-900/60 text-slate-950 dark:text-slate-200 shadow-xs hover:shadow-md'
                    : item.isToday
                    ? 'bg-blue-50/95 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-blue-500 dark:border-blue-400 text-slate-950 dark:text-white shadow-sm hover:shadow-md'
                    : 'bg-white dark:bg-slate-950/80 hover:bg-emerald-50/40 dark:hover:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 text-slate-950 dark:text-slate-200 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Subtle top indicator bar on selected */}
                {isSelected && (
                  <span
                    className={`absolute top-0 inset-x-2 h-1 rounded-full shadow-xs ${
                      item.isToday
                        ? 'bg-blue-200/90'
                        : item.isPast
                        ? 'bg-amber-200/90'
                        : 'bg-emerald-200/90'
                    }`}
                  />
                )}

                <span
                  className={`text-[9.5px] font-black uppercase tracking-wider ${
                    isSelected
                      ? 'text-white'
                      : item.isToday
                      ? 'text-blue-700 dark:text-blue-400 font-black'
                      : item.isYesterday
                      ? 'text-amber-800 dark:text-amber-400 font-black'
                      : item.isTomorrow
                      ? 'text-emerald-700 dark:text-emerald-400 font-black'
                      : item.isPast
                      ? 'text-amber-800 dark:text-amber-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 font-bold'
                  }`}
                >
                  {item.isToday
                    ? 'TODAY'
                    : item.isYesterday
                    ? 'YEST'
                    : item.isTomorrow
                    ? 'TMRW'
                    : item.dayName}
                </span>

                <span
                  className={`text-base sm:text-xl font-black leading-tight my-0.5 tracking-tight ${
                    isSelected
                      ? 'text-white drop-shadow-xs'
                      : item.isToday
                      ? 'text-blue-900 dark:text-blue-200 group-hover/tile:text-blue-600'
                      : 'text-slate-950 dark:text-white group-hover/tile:text-emerald-600 dark:group-hover/tile:text-emerald-400 transition-colors'
                  }`}
                >
                  {item.dayNumber}
                </span>

                <div className="flex items-center space-x-0.5">
                  <span
                    className={`text-[10px] font-black ${
                      isSelected
                        ? item.isToday
                          ? 'text-blue-100'
                          : item.isPast
                          ? 'text-amber-100'
                          : 'text-emerald-100'
                        : item.isPast
                        ? 'text-amber-800 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.monthName}
                  </span>
                  {showYear && (
                    <span
                      className={`text-[9px] font-bold ${
                        isSelected
                          ? item.isToday
                            ? 'text-blue-200'
                            : item.isPast
                            ? 'text-amber-200'
                            : 'text-emerald-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      '{String(item.year).slice(-2)}
                    </span>
                  )}
                </div>

                {/* Active Bookings Count Dot/Badge with Glow */}
                {activeBookingCount > 0 && (
                  <div
                    className={`mt-1 text-[8.5px] font-black px-1.5 py-0.2 rounded-md leading-tight transition-all duration-200 ${
                      isSelected
                        ? item.isToday
                          ? 'bg-white text-blue-950 shadow-md font-black scale-105'
                          : item.isPast
                          ? 'bg-white text-amber-950 shadow-md font-black scale-105'
                          : 'bg-white text-emerald-950 shadow-md font-black scale-105'
                        : item.isPast
                        ? 'bg-amber-600 text-white shadow-xs'
                        : item.isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs group-hover/tile:scale-110'
                    }`}
                    title={`${activeBookingCount} active reservation(s)`}
                  >
                    {activeBookingCount} bk
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => handleScrollStrip(280)}
          className="hidden sm:flex absolute -right-2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-400 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </button>
      </div>
    </div>
  );
};

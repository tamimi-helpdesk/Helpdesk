import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AttendanceMonthDay,
  AttendanceSheetConfig,
  ATTENDANCE_STORAGE_KEY,
  DEFAULT_ATTENDANCE_CONFIG,
} from './attendanceTypes';
import { DailyAttendanceSheetPage } from './DailyAttendanceSheetPage';
import { AttendanceRosterModal } from './AttendanceRosterModal';
import { AttendancePrintModal } from './AttendancePrintModal';
import { AttendancePrintService } from '../../../services/attendancePrintService';
import { ToastService } from '../../../services/toastService';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const AttendanceSheetSection: React.FC = () => {
  // Date context state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 0-indexed (9 = October)
  const [selectedDayNum, setSelectedDayNum] = useState<number>(4); // Default 4 as in active view
  // Selected day numbers for printing: allows one or multiple dates
  const [selectedDayNums, setSelectedDayNums] = useState<number[]>([4]);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalScope, setPrintModalScope] = useState<'single' | 'month'>('month');

  // Stored configuration for staff roster, location, department
  const [config, setConfig] = useState<AttendanceSheetConfig>(() => {
    try {
      let stored = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (!stored) {
        stored = localStorage.getItem('tafga_straight_attendance_config_v1');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.staffList)) {
          // Reset legacy hardcoded 4 blank rows to 0 so 1-10 staff members fit page perfectly
          if (parsed.extraBlankRows === undefined || parsed.extraBlankRows === 4) {
            parsed.extraBlankRows = 0;
          }
          return { ...DEFAULT_ATTENDANCE_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load attendance config from storage', e);
    }
    return DEFAULT_ATTENDANCE_CONFIG;
  });

  const saveConfig = (newConfig: AttendanceSheetConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate days in the selected month
  const monthDays: AttendanceMonthDay[] = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(selectedYear, selectedMonth, dayNum);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = MONTH_NAMES[selectedMonth];
      const formattedDate = `${dayOfWeek}, ${monthName} ${dayNum}, ${selectedYear}`;
      const isoDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

      return {
        dayNum,
        dateObj,
        formattedDate,
        dayOfWeek,
        shortDay,
        isoDate,
      };
    });
  }, [selectedYear, selectedMonth]);

  // Ensure selected day is valid for the current month
  const activeDay = useMemo(() => {
    const found = monthDays.find((d) => d.dayNum === selectedDayNum);
    return found || monthDays[0] || {
      dayNum: 1,
      dateObj: new Date(),
      formattedDate: 'Date',
      dayOfWeek: 'Monday',
      shortDay: 'Mon',
      isoDate: '2026-10-01',
    };
  }, [monthDays, selectedDayNum]);

  // Toggle individual day in multi-selection
  const handleToggleDay = (dayNum: number) => {
    setSelectedDayNum(dayNum); // update live preview to this day
    setSelectedDayNums((prev) => {
      if (prev.includes(dayNum)) {
        return prev.filter((n) => n !== dayNum);
      } else {
        return [...prev, dayNum].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllDays = () => {
    setSelectedDayNums(monthDays.map((d) => d.dayNum));
    ToastService.showInfo(`Selected all ${monthDays.length} days of ${MONTH_NAMES[selectedMonth]}`, 'Attendance');
  };

  const handleSelectOnlyCurrentDay = () => {
    setSelectedDayNums([selectedDayNum]);
    ToastService.showInfo(`Selected Day ${selectedDayNum} (${activeDay.formattedDate})`, 'Attendance');
  };

  const handleClearSelection = () => {
    setSelectedDayNums([]);
  };

  // Direct Chrome Native Print Trigger
  const handleDirectPrint = () => {
    const daysToPrintNums = selectedDayNums.length > 0 ? selectedDayNums : [selectedDayNum];
    const targetDays = monthDays.filter((d) => daysToPrintNums.includes(d.dayNum));

    if (targetDays.length === 0) {
      ToastService.showError('Please select at least 1 day to print.', 'Print');
      return;
    }

    setIsPrinting(true);
    ToastService.showSuccess(`Launching Chrome print for ${targetDays.length} sheet(s)...`, 'Chrome Print');

    try {
      AttendancePrintService.printSheets(targetDays, config);
    } catch (e) {
      console.error('Print failed:', e);
      ToastService.showError('Print error occurred. Please try download option.', 'Print');
    } finally {
      setTimeout(() => setIsPrinting(false), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Clean, Simple Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Section Info: Shows customized formTitle */}
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{config.formTitle || 'Straight Daily Attendance Sheet'}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                A4 Landscape
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {config.locationName || 'Location #188'} • {config.department || 'HELPDESK/ACCOMODATION'}
            </p>
          </div>

          {/* Simple Direct Controls: Month, Year, Roster, 1-Click Print */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month & Year Selectors */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-none"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option
                    key={m}
                    value={idx}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white cursor-pointer border-l border-slate-300 dark:border-slate-600 pl-2 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option
                    key={y}
                    value={y}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Edit Roster Button */}
            <button
              type="button"
              onClick={() => setIsRosterModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Edit Roster ({config.staffList.length})</span>
            </button>

            {/* PRIMARY DIRECT PRINT BUTTON: Directly triggers Chrome print option */}
            <button
              type="button"
              disabled={isPrinting}
              onClick={handleDirectPrint}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Click to directly launch Chrome print dialog for selected dates"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>
                {selectedDayNums.length === 0
                  ? `Print Day ${selectedDayNum}`
                  : selectedDayNums.length === 1
                  ? `Print Day ${selectedDayNums[0]}`
                  : selectedDayNums.length === monthDays.length
                  ? `Print Complete Month (1–${monthDays.length})`
                  : `Print ${selectedDayNums.length} Selected Days`}
              </span>
            </button>

            {/* Download File Fallback */}
            <button
              type="button"
              onClick={() => {
                const daysToPrintNums = selectedDayNums.length > 0 ? selectedDayNums : [selectedDayNum];
                const targetDays = monthDays.filter((d) => daysToPrintNums.includes(d.dayNum));
                ToastService.showSuccess('Downloading printable HTML file...', 'Download');
                AttendancePrintService.downloadHtmlFile(targetDays, config);
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Download standalone printable file (HTML / Save as PDF)"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Excel / CSV Export */}
            <button
              type="button"
              onClick={() => {
                const daysToPrintNums = selectedDayNums.length > 0 ? selectedDayNums : [selectedDayNum];
                const targetDays = monthDays.filter((d) => daysToPrintNums.includes(d.dayNum));
                ToastService.showSuccess('Exporting roster to CSV...', 'Excel / CSV');
                AttendancePrintService.downloadCsvRoster(targetDays, config);
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Download CSV spreadsheet for Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Day-by-Day Selector with Multi-select capabilities */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Quick selection bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Select Dates to Print:
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {selectedDayNums.length === 0
                  ? '0 days (preview only)'
                  : selectedDayNums.length === monthDays.length
                  ? `All ${monthDays.length} Days Selected`
                  : `${selectedDayNums.length} of ${monthDays.length} Days Selected`}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleSelectAllDays}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition border border-slate-200 dark:border-slate-700"
              >
                ✓ Select All (1–{monthDays.length})
              </button>
              <button
                type="button"
                onClick={handleSelectOnlyCurrentDay}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition border border-slate-200 dark:border-slate-700"
              >
                Only Day {selectedDayNum}
              </button>
              {selectedDayNums.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1 text-slate-400 hover:text-rose-500 rounded-lg text-[11px] font-semibold cursor-pointer transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Date pills */}
          <div className="overflow-x-auto pb-1 scrollbar-thin">
            <div className="flex items-center space-x-1.5 min-w-max">
              {monthDays.map((d) => {
                const isChecked = selectedDayNums.includes(d.dayNum);
                const isPreview = selectedDayNum === d.dayNum;
                const isFriday = d.dayOfWeek === 'Friday';

                return (
                  <button
                    key={`day-pill-${d.dayNum}`}
                    type="button"
                    onClick={() => handleToggleDay(d.dayNum)}
                    className={`px-3 py-1.5 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center min-w-[52px] select-none ${
                      isChecked
                        ? 'bg-emerald-600 text-white shadow-sm font-black ring-2 ring-emerald-400'
                        : isPreview
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
                    }`}
                    title={`Click to select/unselect Day ${d.dayNum} for print. Also updates live preview.`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        isFriday && !isChecked ? 'text-amber-600 font-extrabold' : ''
                      }`}
                    >
                      {d.shortDay}
                    </span>
                    <div className="flex items-center space-x-0.5">
                      <span className="text-xs font-black">{d.dayNum}</span>
                      {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Screen Preview Container: Clean & Focused on the Document */}
      <div className="bg-slate-100 dark:bg-slate-950 p-2 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-[1060px] mx-auto mb-3 px-2 gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Day {activeDay.dayNum} of {monthDays.length} ({activeDay.formattedDate})
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold">
              {activeDay.dayOfWeek}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Pagination controls */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                disabled={selectedDayNum <= 1}
                onClick={() => setSelectedDayNum((prev) => Math.max(1, prev - 1))}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold px-1">
                {selectedDayNum} / {monthDays.length}
              </span>
              <button
                type="button"
                disabled={selectedDayNum >= monthDays.length}
                onClick={() => setSelectedDayNum((prev) => Math.min(monthDays.length, prev + 1))}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* The Actual Sheet Preview */}
        <DailyAttendanceSheetPage day={activeDay} config={config} />
      </div>

      {/* Staff & Roster Editor Modal */}
      <AttendanceRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        config={config}
        onSaveConfig={saveConfig}
      />

      {/* Print & Export Hub Modal */}
      <AttendancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        monthDays={monthDays}
        activeDay={activeDay}
        config={config}
        initialScope={printModalScope}
      />
    </div>
  );
};

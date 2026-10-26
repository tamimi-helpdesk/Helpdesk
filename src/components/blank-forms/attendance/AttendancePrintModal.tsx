import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  X,
  CheckCircle2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  AttendanceMonthDay,
  AttendanceSheetConfig,
} from './attendanceTypes';
import { DailyAttendanceSheetPage } from './DailyAttendanceSheetPage';
import { AttendancePrintService } from '../../../services/attendancePrintService';
import { ToastService } from '../../../services/toastService';

interface AttendancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthDays: AttendanceMonthDay[];
  activeDay: AttendanceMonthDay;
  config: AttendanceSheetConfig;
  initialScope?: 'single' | 'month';
}

export const AttendancePrintModal: React.FC<AttendancePrintModalProps> = ({
  isOpen,
  onClose,
  monthDays,
  activeDay,
  config,
  initialScope = 'month',
}) => {
  const [printScope, setPrintScope] = useState<'single' | 'month'>(initialScope);
  const [previewDayNum, setPreviewDayNum] = useState<number>(activeDay.dayNum);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialScope) {
        setPrintScope(initialScope);
      }
      setPreviewDayNum(activeDay.dayNum);
    }
  }, [isOpen, initialScope, activeDay.dayNum]);

  if (!isOpen) return null;

  const currentPreviewDay =
    monthDays.find((d) => d.dayNum === previewDayNum) || activeDay;

  const targetDays =
    printScope === 'single' ? [currentPreviewDay] : monthDays;

  // Immediate 1-Click Browser Print Trigger
  const handleTriggerPrint = () => {
    setIsPrinting(true);
    ToastService.showInfo('Opening browser print options...', 'Attendance Print');
    try {
      AttendancePrintService.printSheets(targetDays, config);
    } catch (err) {
      console.error('Print trigger error:', err);
      ToastService.showError('Unable to open print dialog. Try Download Printable File.', 'Print Error');
    } finally {
      setTimeout(() => {
        setIsPrinting(false);
      }, 1500);
    }
  };

  // Download Standalone Printable HTML / PDF Document
  const handleDownloadHtml = () => {
    try {
      AttendancePrintService.downloadHtmlFile(targetDays, config);
      ToastService.showSuccess('Printable file download started! Open and print or save as PDF.', 'Attendance Sheet');
    } catch (e) {
      ToastService.showError('Download failed. Please try Print Now.', 'Download');
    }
  };

  // Download CSV / Excel Spreadsheet
  const handleDownloadCsv = () => {
    try {
      AttendancePrintService.downloadCsvRoster(targetDays, config);
      ToastService.showSuccess('Excel / CSV roster downloaded successfully.', 'Export');
    } catch (e) {
      ToastService.showError('CSV download failed.', 'Export');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{config.formTitle || 'Print & Export Attendance Sheet'}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  A4 Landscape
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {config.companyName || 'Tamimi Global Co. Ltd.'} • {config.department || 'Accommodation & Helpdesk'} • {config.locationName || 'Location #188'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close Print Options"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls & Action Hub */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Print Scope Selector */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setPrintScope('month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                printScope === 'month'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Complete Month ({monthDays.length} Days)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintScope('single')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                printScope === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Single Day (Day {previewDayNum})</span>
            </button>
          </div>

          {/* Action Buttons: 1-Click Print & Direct Downloads */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Browser Print (Immediate trigger) */}
            <button
              type="button"
              disabled={isPrinting}
              onClick={handleTriggerPrint}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Open browser print dialog immediately"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Printer className="w-4 h-4 text-white" />
              )}
              <span>
                {printScope === 'month'
                  ? `Print All ${monthDays.length} Days Now`
                  : `Print Day ${previewDayNum} Now`}
              </span>
            </button>

            {/* Download Standalone Offline Printable HTML / Save as PDF */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Download standalone HTML document that can be opened and printed in any browser"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Download Printable File</span>
            </button>

            {/* Export Roster CSV for Excel */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Export staff roster and duty logs into CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Informative Tip */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 border-b border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Tip:</strong> In the print dialog, select <strong>&quot;Save as PDF&quot;</strong> under Destination to save directly as a PDF file, or choose your connected printer.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold">
            Orientation: Landscape (A4)
          </span>
        </div>

        {/* Live A4 Preview Section */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
          {/* Day Navigation within Modal */}
          <div className="flex items-center justify-between max-w-[1060px] mx-auto mb-3 px-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Previewing: Day {currentPreviewDay.dayNum} of {monthDays.length} ({currentPreviewDay.formattedDate})
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={previewDayNum <= 1}
                onClick={() => setPreviewDayNum((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {previewDayNum} / {monthDays.length}
              </span>
              <button
                type="button"
                disabled={previewDayNum >= monthDays.length}
                onClick={() => setPreviewDayNum((p) => Math.min(monthDays.length, p + 1))}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actual Sheet Preview Page */}
          <div className="overflow-x-auto">
            <DailyAttendanceSheetPage
              day={currentPreviewDay}
              config={config}
              isPrintMode={false}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Staff Members: <strong>{config.staffList.length}</strong> • Extra Blank Rows: <strong>{config.extraBlankRows ?? 0}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isPrinting}
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

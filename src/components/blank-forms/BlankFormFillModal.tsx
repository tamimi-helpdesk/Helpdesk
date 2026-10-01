import React, { useState } from 'react';
import {
  FormTemplateDefinition,
  AttendanceRow,
  MaterialItemRow,
  ClearanceDeptCheck,
  GatePassMaterialRow,
  SavedFormRecord,
} from '../../types/blankForms';
import { BlankFormPrintLayout } from './BlankFormPrintLayout';
import {
  X,
  Printer,
  Sparkles,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  FileText,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { printOfficialDocument, openPrintableTab } from '../../utils/printFormHelper';
import { exportFormToCsv } from '../../utils/exportFormToExcel';

interface BlankFormFillModalProps {
  template: FormTemplateDefinition;
  initialDraft?: SavedFormRecord | null;
  onClose: () => void;
  onSaveDraft: (draft: SavedFormRecord) => void;
}

export const BlankFormFillModal: React.FC<BlankFormFillModalProps> = ({
  template,
  initialDraft,
  onClose,
  onSaveDraft,
}) => {
  // Mode: true = Blank Form Sheet (clean for physical printing), false = Filled / Live Editing
  const [isBlankMode, setIsBlankMode] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (initialDraft?.formData) return { ...initialDraft.formData };
    return { ...template.sampleData };
  });

  const [docRef] = useState<string>(() => {
    if (initialDraft?.docRef) return initialDraft.docRef;
    return `${template.docRefPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  });

  // Dynamic Rows State
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>(() => {
    if (initialDraft?.attendanceRows) return initialDraft.attendanceRows;
    return template.sampleAttendanceRows ? [...template.sampleAttendanceRows] : [];
  });

  const [materialRows, setMaterialRows] = useState<MaterialItemRow[]>(() => {
    if (initialDraft?.materialRows) return initialDraft.materialRows;
    return template.sampleMaterialRows ? [...template.sampleMaterialRows] : [];
  });

  const [clearanceRows, setClearanceRows] = useState<ClearanceDeptCheck[]>(() => {
    if (initialDraft?.clearanceRows) return initialDraft.clearanceRows;
    return template.sampleClearanceRows ? [...template.sampleClearanceRows] : [];
  });

  const [gatePassRows, setGatePassRows] = useState<GatePassMaterialRow[]>(() => {
    if (initialDraft?.gatePassRows) return initialDraft.gatePassRows;
    return template.sampleGatePassRows ? [...template.sampleGatePassRows] : [];
  });

  const [customRows, setCustomRows] = useState<Record<string, any>[]>(() => {
    if (initialDraft?.customRows) return initialDraft.customRows;
    return template.sampleCustomRows ? [...template.sampleCustomRows] : [];
  });

  const [saveToast, setSaveToast] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const isLandscape =
    template.orientation === 'landscape' ||
    template.id === 'TAFGA-FRM-03-GOLF-CHK' ||
    template.id === 'TAFGA-FRM-04-KEY-MON' ||
    template.id === 'TAFGA-FRM-07-PARCEL-LOG' ||
    template.id === 'TAFGA-FRM-13-LINEN-PICK' ||
    template.id === 'attendance-sheet' ||
    template.id === 'vehicle-inspection' ||
    template.id === 'catering-hygiene';

  // Field change handler
  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Table change handler (properly synchronizes all dynamic rows)
  const handleTableChange = (key: string, rows: any[]) => {
    if (key === 'attendanceRows') setAttendanceRows(rows);
    else if (key === 'materialRows') setMaterialRows(rows);
    else if (key === 'clearanceRows') setClearanceRows(rows);
    else if (key === 'gatePassRows') setGatePassRows(rows);
    else if (key === 'customRows') setCustomRows(rows);
    setFormData((prev) => ({ ...prev, [key]: rows }));
  };

  // Reset / Load Sample
  const handleLoadSample = () => {
    setFormData({ ...template.sampleData });
    if (template.sampleAttendanceRows) setAttendanceRows([...template.sampleAttendanceRows]);
    if (template.sampleMaterialRows) setMaterialRows([...template.sampleMaterialRows]);
    if (template.sampleClearanceRows) setClearanceRows([...template.sampleClearanceRows]);
    if (template.sampleGatePassRows) setGatePassRows([...template.sampleGatePassRows]);
    if (template.sampleCustomRows) setCustomRows([...template.sampleCustomRows]);
    setIsBlankMode(false);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  // Clear Form Fields
  const handleClearForm = () => {
    const emptyData: Record<string, string> = {};
    template.headerFields.forEach((f) => {
      emptyData[f.name] = '';
    });
    if (template.footerFields) {
      template.footerFields.forEach((f) => {
        emptyData[f.name] = '';
      });
    }
    setFormData(emptyData);
    setAttendanceRows([]);
    setMaterialRows([]);
    setGatePassRows([]);
    setCustomRows([]);
  };

  // Save Draft Record
  const handleSave = () => {
    const record: SavedFormRecord = {
      id: initialDraft?.id || `FORM-DRAFT-${Date.now()}`,
      templateId: template.id,
      formCode: template.code,
      title: template.title,
      docRef,
      applicant:
        formData.applicantName ||
        formData.employeeName ||
        formData.preparedBy ||
        formData.requestedBy ||
        formData.issuerNameId ||
        formData.supervisorName ||
        'Staff Member',
      department: formData.department || template.department,
      createdAt: new Date().toLocaleString(),
      formData,
      attendanceRows,
      materialRows,
      clearanceRows,
      gatePassRows,
      customRows,
      status: 'DRAFT',
    };
    onSaveDraft(record);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Bulletproof Direct Print with Multi-Strategy Fallback
  const handlePrint = (blankPrint = isBlankMode, preferPopup = false) => {
    setIsPrinting(true);
    setPrintMenuOpen(false);
    setPrintNotice('Sending document to printer...');

    try {
      // 1. Direct browser tab popup or print
      openPrintableTab(
        'printable-official-form',
        `${template.code} - ${template.title}`,
        isLandscape
      );

      // 2. Also trigger native window.print as immediate fallback
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          // ignore
        }
      }, 300);
    } catch (e) {
      console.error('Print trigger error:', e);
      window.print();
    } finally {
      setTimeout(() => {
        setIsPrinting(false);
        setPrintNotice(null);
      }, 2000);
    }
  };

  // Open in Printable New Tab
  const handleOpenPrintTab = () => {
    setPrintMenuOpen(false);
    openPrintableTab(
      'printable-official-form',
      `${template.code} - ${template.title}`,
      isLandscape
    );
  };

  // Excel / CSV Export
  const handleExportExcel = () => {
    exportFormToCsv(template, formData, docRef);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl max-w-6xl w-full shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:rounded-none"
      >
        {/* Sleek, Clean, Single-Row Header */}
        <div className="px-4 py-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden select-none">
          {/* Left: Form Info */}
          <div className="flex items-center space-x-3 min-w-0">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-black font-mono shrink-0">
              {template.code}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {template.title}
              </h2>
              <div className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-2">
                <span>REF: {docRef}</span>
                <span>•</span>
                <span>{isLandscape ? 'A4 Landscape' : 'A4 Portrait'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Blank vs Filled Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700">
              <button
                type="button"
                onClick={() => setIsBlankMode(false)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  !isBlankMode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Fill and edit fields directly"
              >
                Live Editor
              </button>
              <button
                type="button"
                onClick={() => setIsBlankMode(true)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  isBlankMode
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Clean blank sheet for physical printing"
              >
                Blank Form
              </button>
            </div>

            {/* Quick Sample Data */}
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
              title="Auto-fill sample data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Sample</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
              title="Download Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Excel</span>
            </button>

            {/* Save Record */}
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition cursor-pointer"
              title="Save document record"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            {/* Main Print Button with Dropdown Options */}
            <div className="relative">
              <div className="inline-flex rounded-lg shadow-sm">
                <button
                  type="button"
                  onClick={() => handlePrint(isBlankMode, false)}
                  disabled={isPrinting}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-l-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                  title="Print Official Document"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isPrinting ? 'Printing...' : 'Print Form'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMenuOpen(!printMenuOpen)}
                  className="px-1.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-r-lg border-l border-blue-500 text-xs transition cursor-pointer"
                  title="More Print Options"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Print Dropdown Menu */}
              {printMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 text-slate-800 dark:text-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handlePrint(false, false)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 font-medium cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Print Filled Form (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint(true, false)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 font-medium cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Print 100% Blank Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPrintTab}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 font-medium cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open Standalone Clean Tab</span>
                  </button>
                </div>
              )}
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 text-center shadow-md flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Form Record Saved Successfully to Saved Records!</span>
          </div>
        )}

        {/* Print Notice */}
        {printNotice && (
          <div className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 text-center shadow-md flex items-center justify-center space-x-2">
            <Info className="w-4 h-4" />
            <span>{printNotice}</span>
          </div>
        )}

        {/* Zoom & Quick Reset Bar */}
        <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 print:hidden">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isBlankMode ? '📄 Blank Sheet Preview' : '✏️ Direct Interactive In-Place Editor'}
            </span>
            {!isBlankMode && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                (Click directly on any field or table row to edit)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(75, prev - 10))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[11px]">{zoomScale}%</span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(130, prev + 10))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(100)}
              className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded cursor-pointer"
              title="Reset Zoom"
            >
              Fit
            </button>
            {!isBlankMode && (
              <button
                type="button"
                onClick={handleClearForm}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold ml-2 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Modal Document Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/70 dark:bg-slate-950 flex flex-col items-center">
          <div
            id="printable-official-form"
            className="w-full transition-transform duration-200 origin-top flex justify-center"
            style={{ transform: `scale(${zoomScale / 100})` }}
          >
            <BlankFormPrintLayout
              template={template}
              formData={formData}
              attendanceRows={attendanceRows}
              materialRows={materialRows}
              clearanceRows={clearanceRows}
              gatePassRows={gatePassRows}
              customRows={customRows}
              docRefNumber={docRef}
              isBlankMode={isBlankMode}
              isEditable={!isBlankMode}
              onFieldChange={handleFieldChange}
              onTableChange={handleTableChange}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

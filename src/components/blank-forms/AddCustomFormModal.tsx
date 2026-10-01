import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Layers,
  ArrowRight,
  Shield,
  RotateCcw,
  RefreshCw,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  FormTemplateDefinition,
  FormCategory,
  FormTemplateField,
  CustomTableColumn,
} from '../../types/blankForms';
import {
  parseExcelToFormTemplate,
  parseWordToFormTemplate,
  alignAndConstructTemplate,
  saveCustomTemplate,
  FormImportResult,
} from '../../services/formImportService';
import { BlankFormPrintLayout } from './BlankFormPrintLayout';

interface AddCustomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormAdded: (newTemplate: FormTemplateDefinition) => void;
}

export const AddCustomFormModal: React.FC<AddCustomFormModalProps> = ({
  isOpen,
  onClose,
  onFormAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'BUILDER' | 'PASTE'>('UPLOAD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Result & Working Template State
  const [importResult, setImportResult] = useState<FormImportResult | null>(null);
  const [workingTemplate, setWorkingTemplate] = useState<FormTemplateDefinition | null>(null);
  const [previewMode, setPreviewMode] = useState<'EDIT_DETAILS' | 'LIVE_PREVIEW'>('EDIT_DETAILS');

  // Manual Builder State
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderCategory, setBuilderCategory] = useState<FormCategory>('OPERATIONS');
  const [builderDepartment, setBuilderDepartment] = useState('Camp Operations & Facilities Division');
  const [builderOrientation, setBuilderOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [builderIncludeTable, setBuilderIncludeTable] = useState(true);

  // Paste text state
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  // Handle File Ingestion
  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    setImportResult(null);

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();

    try {
      let result: FormImportResult;

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'xlsm') {
        result = await parseExcelToFormTemplate(file, fileName);
      } else if (ext === 'docx') {
        result = await parseWordToFormTemplate(file, fileName);
      } else if (ext === 'json') {
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object' && parsed.title) {
            result = {
              success: true,
              template: {
                ...parsed,
                id: `custom-template-${Date.now()}`,
                isCustomUploaded: true,
                uploadedFileName: fileName,
                uploadedAt: new Date().toISOString(),
              },
              detectedType: 'JSON',
              insights: ['Imported template schema directly from JSON.'],
            };
          } else {
            result = {
              success: false,
              detectedType: 'JSON',
              warnings: ['The JSON file does not contain a valid form template structure.'],
            };
          }
        } catch {
          result = {
            success: false,
            detectedType: 'JSON',
            warnings: ['Failed to parse JSON file syntax.'],
          };
        }
      } else {
        // Fallback text parser
        const text = await file.text();
        result = alignAndConstructTemplate({
          sourceType: 'CSV',
          fileName,
          rawText: text,
          cleanedGrid: text.split('\n').map((l) => l.split(/[\t,;|]/).map((c) => c.trim())),
        });
      }

      setImportResult(result);
      if (result.success && result.template) {
        setWorkingTemplate(result.template);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      console.error('Import processing error:', err);
      setImportResult({
        success: false,
        detectedType: 'UNKNOWN',
        warnings: [`Error processing document: ${err.message || 'Unknown error'}`],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and Drop Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Process Pasted Data
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);

    const rows = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
        if (line.includes(',')) return line.split(',').map((c) => c.trim());
        if (line.includes('|')) return line.split('|').map((c) => c.trim());
        return [line];
      });

    const result = alignAndConstructTemplate({
      sourceType: 'CSV',
      fileName: 'Pasted_Data_Form.txt',
      rawText: pastedText,
      cleanedGrid: rows,
    });

    setImportResult(result);
    if (result.success && result.template) {
      setWorkingTemplate(result.template);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }
    setIsProcessing(false);
  };

  // Initialize Manual Builder Template
  const handleInitializeBuilder = () => {
    if (!builderTitle.trim()) return;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const code = `TAFGA-FRM-CUST-${randomNum}`;
    const docRefPrefix = builderTitle
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase())
      .join('')
      .slice(0, 4) || 'CUST';

    const newTemplate: FormTemplateDefinition = {
      id: `custom-template-${Date.now()}-${randomNum}`,
      code,
      title: builderTitle.trim(),
      category: builderCategory,
      categoryLabel: getCategoryLabel(builderCategory),
      description: `Official enterprise operational form created under Tamimi Global Facilities Management System.`,
      version: 'v1.0 (2026)',
      department: builderDepartment.trim() || 'Enterprise Operations Division',
      docRefPrefix,
      iconName: 'FileText',
      accentColor: 'blue',
      hasDynamicTable: builderIncludeTable ? 'CUSTOM' : 'NONE',
      customTable: builderIncludeTable
        ? {
            title: 'SECTION 2: SCHEDULED ITEMS & ACTIVITY LOG',
            columns: [
              { id: 'c1', label: 'Item / Task Description', key: 'itemDesc', type: 'text', width: '40%' },
              { id: 'c2', label: 'Location / Room', key: 'location', type: 'text' },
              { id: 'c3', label: 'Quantity / Time', key: 'qty', type: 'number', align: 'center' },
              {
                id: 'c4',
                label: 'Status / Condition',
                key: 'status',
                type: 'select',
                options: ['Completed', 'In Progress', 'Pending', 'Passed', 'Failed'],
                align: 'center',
              },
              { id: 'c5', label: 'Remarks / Findings', key: 'remarks', type: 'text' },
            ],
            defaultRows: [
              { id: 'r1', itemDesc: 'Sample Operational Activity 1', location: 'Block A-01', qty: '1', status: 'Completed', remarks: 'Inspected' },
              { id: 'r2', itemDesc: 'Sample Operational Activity 2', location: 'Mess Hall', qty: '2', status: 'Pending', remarks: 'Scheduled' },
            ],
          }
        : undefined,
      headerFields: [
        { name: 'recordDate', label: 'Date', type: 'date', required: true, colSpan: 1, defaultValue: new Date().toISOString().split('T')[0] },
        { name: 'locationZone', label: 'Location / Facility', type: 'text', placeholder: 'e.g. Amaala Camp Loc-188', required: true, colSpan: 1, defaultValue: 'Amaala Core Staff Village (Loc-188)' },
        { name: 'departmentUnit', label: 'Department / Unit', type: 'text', required: true, colSpan: 1, defaultValue: builderDepartment },
        { name: 'supervisorInCharge', label: 'Supervisor / In-Charge', type: 'text', placeholder: 'Duty Supervisor', colSpan: 1, defaultValue: 'Duty Supervisor' },
      ],
      footerFields: [
        { name: 'preparedBy', label: 'Prepared By (Name & Signature)', type: 'text', placeholder: 'Officer Name & Badge', colSpan: 2, defaultValue: 'Habibur Rahman (TM-3388)' },
        { name: 'verifiedBy', label: 'Reviewed & Approved By', type: 'text', placeholder: 'Manager Name & Stamp', colSpan: 2, defaultValue: 'Eng. Khalid Al-Otaibi' },
      ],
      sampleData: {
        recordDate: new Date().toISOString().split('T')[0],
        locationZone: 'Amaala Core Staff Village (Loc-188)',
        departmentUnit: builderDepartment,
        supervisorInCharge: 'Duty Supervisor',
        preparedBy: 'Habibur Rahman (TM-3388)',
        verifiedBy: 'Eng. Khalid Al-Otaibi',
      },
      sampleCustomRows: builderIncludeTable
        ? [
            { id: 'r1', itemDesc: 'Sample Operational Activity 1', location: 'Block A-01', qty: '1', status: 'Completed', remarks: 'Inspected' },
            { id: 'r2', itemDesc: 'Sample Operational Activity 2', location: 'Mess Hall', qty: '2', status: 'Pending', remarks: 'Scheduled' },
          ]
        : [],
      isCustomUploaded: true,
      uploadedFileName: 'Custom_Created_Form',
      uploadedAt: new Date().toISOString(),
      orientation: builderOrientation,
    };

    setWorkingTemplate(newTemplate);
    setImportResult({
      success: true,
      template: newTemplate,
      detectedType: 'TEXT',
      insights: ['Form successfully initialized from visual builder.'],
    });
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  // Helper for category labels
  function getCategoryLabel(cat: FormCategory): string {
    const labels: Record<FormCategory, string> = {
      ALL: 'General Forms',
      RECEPTION_HELPDESK: 'Reception & Helpdesk',
      HR_ADMIN: 'HR & Personnel',
      STORE_MATERIAL: 'Store & Materials',
      OPERATIONS: 'Operations & Facilities',
      LOGISTICS_SECURITY: 'Logistics & Security',
      ACCOMMODATION_HK: 'Accommodation & Housekeeping',
      RECREATION_FACILITIES: 'Recreation & Sports Facilities',
      CLEARANCE: 'Clearance & Exit',
      LEGAL_COMPLIANCE: 'HSE & Compliance',
    };
    return labels[cat] || 'Operations & Facilities';
  }

  // Save Confirmed Custom Template
  const handleSaveAndAdd = () => {
    if (!workingTemplate) return;

    // Save to storage
    saveCustomTemplate(workingTemplate);

    // Notify parent
    onFormAdded(workingTemplate);

    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    onClose();
  };

  // Field & Table Manipulations on workingTemplate
  const handleAddHeaderField = () => {
    if (!workingTemplate) return;
    const newField: FormTemplateField = {
      name: `field_${Date.now()}`,
      label: 'New Field Label',
      type: 'text',
      colSpan: 2,
      placeholder: 'Enter detail...',
    };
    setWorkingTemplate({
      ...workingTemplate,
      headerFields: [...workingTemplate.headerFields, newField],
      sampleData: { ...workingTemplate.sampleData, [newField.name]: '' },
    });
  };

  const handleUpdateHeaderField = (index: number, updates: Partial<FormTemplateField>) => {
    if (!workingTemplate) return;
    const updated = [...workingTemplate.headerFields];
    updated[index] = { ...updated[index], ...updates };
    setWorkingTemplate({
      ...workingTemplate,
      headerFields: updated,
    });
  };

  const handleDeleteHeaderField = (index: number) => {
    if (!workingTemplate) return;
    const updated = workingTemplate.headerFields.filter((_, i) => i !== index);
    setWorkingTemplate({
      ...workingTemplate,
      headerFields: updated,
    });
  };

  // Dynamic Table Column Handlers
  const handleAddTableColumn = () => {
    if (!workingTemplate) return;
    const currentCols = workingTemplate.customTable?.columns || [];
    const newColKey = `col_${Date.now()}`;
    const newCol: CustomTableColumn = {
      id: newColKey,
      label: 'New Column',
      key: newColKey,
      type: 'text',
      align: 'left',
    };
    const updatedCols = [...currentCols, newCol];
    setWorkingTemplate({
      ...workingTemplate,
      hasDynamicTable: 'CUSTOM',
      customTable: {
        title: workingTemplate.customTable?.title || 'SECTION 2: SCHEDULED ITEMS & ACTIVITY DETAILS',
        columns: updatedCols,
        defaultRows: workingTemplate.customTable?.defaultRows || [],
      },
    });
  };

  const handleUpdateTableColumn = (index: number, updates: Partial<CustomTableColumn>) => {
    if (!workingTemplate || !workingTemplate.customTable) return;
    const updated = [...workingTemplate.customTable.columns];
    updated[index] = { ...updated[index], ...updates };
    setWorkingTemplate({
      ...workingTemplate,
      customTable: {
        ...workingTemplate.customTable,
        columns: updated,
      },
    });
  };

  const handleDeleteTableColumn = (index: number) => {
    if (!workingTemplate || !workingTemplate.customTable) return;
    const updated = workingTemplate.customTable.columns.filter((_, i) => i !== index);
    setWorkingTemplate({
      ...workingTemplate,
      customTable: {
        ...workingTemplate.customTable,
        columns: updated,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-sky-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Add New Blank Form
                </h2>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-400/30">
                  Smart Auto-Alignment
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Upload Excel (.xlsx, .xls, .csv), Word (.docx) or build custom operational forms with automatic layout formatting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* If No Form is extracted yet: Show Upload & Creation Methods */}
          {!workingTemplate ? (
            <div className="space-y-6">
              {/* Method Navigation Pills */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('UPLOAD')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'UPLOAD'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Excel / Word File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('BUILDER')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'BUILDER'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Visual Form Builder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PASTE')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'PASTE'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text / Table</span>
                </button>
              </div>

              {/* TAB 1: FILE UPLOAD (EXCEL / WORD / CSV / DOCX) */}
              {activeTab === 'UPLOAD' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-sky-500 bg-sky-50/50 scale-[1.01]'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.xlsm,.csv,.docx,.json,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleProcessFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-4">
                      {isProcessing ? (
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8" />
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {isProcessing
                        ? 'Analyzing Document & Auto-Aligning Form Structure...'
                        : 'Click to Browse or Drag & Drop Excel / Word Document'}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                      Supports <strong>Microsoft Excel (.xlsx, .xls, .csv)</strong>, <strong>Microsoft Word (.docx)</strong>, and <strong>JSON template schemas</strong>.
                    </p>

                    {/* Auto-alignment promise card */}
                    <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2 rounded-xl text-xs font-semibold">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Smart Auto-Adjustment:</strong> Even if rows or cells are messy or misaligned, the system automatically detects headers, tables &amp; key-values to build a pristine Tamimi official A4 form!
                      </span>
                    </div>

                    {/* Supported Badge Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold flex items-center space-x-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Excel .XLSX / .XLS / .CSV</span>
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg text-[11px] font-bold flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Word .DOCX</span>
                      </span>
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg text-[11px] font-bold flex items-center space-x-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>JSON Form Schema</span>
                      </span>
                    </div>
                  </div>

                  {/* Warning / Error Alert if any */}
                  {importResult && !importResult.success && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Import Notice</div>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-700">
                          {importResult.warnings?.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VISUAL FORM BUILDER */}
              {activeTab === 'BUILDER' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">Define Custom Blank Form Parameters</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Form Title / Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={builderTitle}
                        onChange={(e) => setBuilderTitle(e.target.value)}
                        placeholder="e.g. Daily Generator Fuel & Hour Run Log"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category Classification <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={builderCategory}
                        onChange={(e) => setBuilderCategory(e.target.value as FormCategory)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="RECEPTION_HELPDESK">Reception & Helpdesk</option>
                        <option value="HR_ADMIN">HR & Personnel</option>
                        <option value="STORE_MATERIAL">Store & Materials</option>
                        <option value="OPERATIONS">Operations & Facilities</option>
                        <option value="LOGISTICS_SECURITY">Logistics & Security</option>
                        <option value="ACCOMMODATION_HK">Accommodation & Housekeeping</option>
                        <option value="RECREATION_FACILITIES">Recreation & Sports</option>
                        <option value="CLEARANCE">Clearance & Exit</option>
                        <option value="LEGAL_COMPLIANCE">HSE & Compliance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department Name</label>
                      <input
                        type="text"
                        value={builderDepartment}
                        onChange={(e) => setBuilderDepartment(e.target.value)}
                        placeholder="e.g. Camp Operations & Facilities Division"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Print Orientation</label>
                      <div className="flex items-center space-x-3 pt-1">
                        <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="orient"
                            checked={builderOrientation === 'portrait'}
                            onChange={() => setBuilderOrientation('portrait')}
                          />
                          <span>Portrait (Vertical A4)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="orient"
                            checked={builderOrientation === 'landscape'}
                            onChange={() => setBuilderOrientation('landscape')}
                          />
                          <span>Landscape (Horizontal A4)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={builderIncludeTable}
                        onChange={(e) => setBuilderIncludeTable(e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Include Dynamic Multi-Row Table (Add Row / Delete Row / Columns)</span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!builderTitle.trim()}
                      onClick={handleInitializeBuilder}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Generate &amp; Open Live Form Editor</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE STRUCTURED DATA */}
              {activeTab === 'PASTE' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Paste Raw Text, CSV, or Tab-Delimited Data
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600">
                    Copy columns directly from an open spreadsheet or document and paste below. The engine will automatically detect table headers, data rows, and key-values.
                  </p>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Item Code\tDescription\tUnit\tQuantity\tStatus\nPRT-001\tSplit AC Air Filter\tPcs\t10\tIn Stock\nPRT-002\tLED Floodlight 50W\tPcs\t4\tOrdered`}
                    className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!pastedText.trim() || isProcessing}
                      onClick={handleProcessPastedText}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>{isProcessing ? 'Processing...' : 'Parse & Auto-Align Form'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* IF FORM IS EXTRACTED: SHOW CUSTOMIZER & LIVE PREVIEW */
            <div className="space-y-6">
              {/* Success Insights Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center space-x-2">
                      <span>Smart Extraction &amp; Alignment Succeeded!</span>
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {workingTemplate.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      {importResult?.insights?.map((ins, i) => (
                        <span key={i}>• {ins}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setWorkingTemplate(null);
                    setImportResult(null);
                  }}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Import Another</span>
                </button>
              </div>

              {/* Mode Toggle: Edit Details vs Live Preview */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('EDIT_DETAILS')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      previewMode === 'EDIT_DETAILS'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize Fields &amp; Table Columns</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('LIVE_PREVIEW')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      previewMode === 'LIVE_PREVIEW'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live A4 Form Preview</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {workingTemplate.headerFields.length} Header Fields •{' '}
                  {workingTemplate.customTable ? `${workingTemplate.customTable.columns.length} Table Columns` : 'Static Grid'}
                </div>
              </div>

              {/* VIEW 1: CUSTOMIZE DETAILS */}
              {previewMode === 'EDIT_DETAILS' && (
                <div className="space-y-6">
                  {/* General Metadata */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      1. General Form Identity
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Form Title</label>
                        <input
                          type="text"
                          value={workingTemplate.title}
                          onChange={(e) =>
                            setWorkingTemplate({ ...workingTemplate, title: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Code</label>
                        <input
                          type="text"
                          value={workingTemplate.code}
                          onChange={(e) =>
                            setWorkingTemplate({ ...workingTemplate, code: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={workingTemplate.category}
                          onChange={(e) => {
                            const cat = e.target.value as FormCategory;
                            setWorkingTemplate({
                              ...workingTemplate,
                              category: cat,
                              categoryLabel: getCategoryLabel(cat),
                            });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                        >
                          <option value="RECEPTION_HELPDESK">Reception & Helpdesk</option>
                          <option value="HR_ADMIN">HR & Personnel</option>
                          <option value="STORE_MATERIAL">Store & Materials</option>
                          <option value="OPERATIONS">Operations & Facilities</option>
                          <option value="LOGISTICS_SECURITY">Logistics & Security</option>
                          <option value="ACCOMMODATION_HK">Accommodation & Housekeeping</option>
                          <option value="RECREATION_FACILITIES">Recreation & Sports</option>
                          <option value="CLEARANCE">Clearance & Exit</option>
                          <option value="LEGAL_COMPLIANCE">HSE & Compliance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={workingTemplate.department}
                          onChange={(e) =>
                            setWorkingTemplate({ ...workingTemplate, department: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Orientation</label>
                        <select
                          value={workingTemplate.orientation || 'portrait'}
                          onChange={(e) =>
                            setWorkingTemplate({
                              ...workingTemplate,
                              orientation: e.target.value as 'portrait' | 'landscape',
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                        >
                          <option value="portrait">Portrait (Standard Vertical)</option>
                          <option value="landscape">Landscape (Horizontal Wide)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Header Fields Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        2. Section 1 Particulars &amp; Metadata Fields ({workingTemplate.headerFields.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddHeaderField}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Field</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {workingTemplate.headerFields.map((field, idx) => (
                        <div
                          key={field.name || idx}
                          className="bg-white p-3 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs"
                        >
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateHeaderField(idx, { label: e.target.value })}
                              placeholder="Field Label"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                            />
                          </div>

                          <div className="col-span-3">
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleUpdateHeaderField(idx, { type: e.target.value as any })
                              }
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                            >
                              <option value="text">Text Input</option>
                              <option value="date">Date Picker</option>
                              <option value="time">Time Input</option>
                              <option value="number">Number</option>
                              <option value="textarea">Multi-line Notes</option>
                              <option value="select">Dropdown Select</option>
                            </select>
                          </div>

                          <div className="col-span-3">
                            <select
                              value={field.colSpan || 1}
                              onChange={(e) =>
                                handleUpdateHeaderField(idx, { colSpan: Number(e.target.value) as any })
                              }
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                            >
                              <option value={1}>1/4 Width (1 Col)</option>
                              <option value={2}>Half Width (2 Cols)</option>
                              <option value={3}>3/4 Width (3 Cols)</option>
                              <option value={4}>Full Width (4 Cols)</option>
                            </select>
                          </div>

                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteHeaderField(idx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete Field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Table Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          3. Section 2 Dynamic Multi-Row Table Columns
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {workingTemplate.customTable
                            ? `${workingTemplate.customTable.columns.length} columns configured for table line items`
                            : 'No table configured. Click below to add a dynamic table.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddTableColumn}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Column</span>
                      </button>
                    </div>

                    {workingTemplate.customTable && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {workingTemplate.customTable.columns.map((col, idx) => (
                          <div
                            key={col.id || idx}
                            className="bg-white p-3 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={col.label}
                                onChange={(e) => handleUpdateTableColumn(idx, { label: e.target.value })}
                                placeholder="Column Header"
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                              />
                            </div>

                            <div className="col-span-3">
                              <select
                                value={col.type || 'text'}
                                onChange={(e) =>
                                  handleUpdateTableColumn(idx, { type: e.target.value as any })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                              >
                                <option value="text">Text Column</option>
                                <option value="number">Numeric / Qty</option>
                                <option value="date">Date</option>
                                <option value="select">Dropdown Select</option>
                              </select>
                            </div>

                            <div className="col-span-2">
                              <select
                                value={col.align || 'left'}
                                onChange={(e) =>
                                  handleUpdateTableColumn(idx, { align: e.target.value as any })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                              >
                                <option value="left">Left Align</option>
                                <option value="center">Center Align</option>
                                <option value="right">Right Align</option>
                              </select>
                            </div>

                            <div className="col-span-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteTableColumn(idx)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete Column"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: LIVE PREVIEW IN AUTHENTIC TAMIMI TEMPLATE */}
              {previewMode === 'LIVE_PREVIEW' && (
                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 overflow-x-auto shadow-inner">
                  <div className="scale-90 origin-top">
                    <BlankFormPrintLayout
                      template={workingTemplate}
                      formData={workingTemplate.sampleData}
                      customRows={workingTemplate.sampleCustomRows || []}
                      isBlankMode={false}
                      isEditable={false}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          {workingTemplate && (
            <button
              type="button"
              onClick={handleSaveAndAdd}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-500/20 flex items-center space-x-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save &amp; Add Form to Blank Forms</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

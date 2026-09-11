import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ExcelAutomationService,
  TARGET_COLUMNS,
  FORMAT_TEMPLATES,
  FormatTemplate,
  ParsedSheetData,
  ColumnMapping,
  StandardizedRow,
} from '../../services/excelAutomationService';
import { ToastService } from '../../services/toastService';

export const ExcelAutomationSection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [activeWorkbook, setActiveWorkbook] = useState<any | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('RESIDENT_ROSTER_14_COL');
  const [mappings, setMappings] = useState<Record<string, ColumnMapping>>({});
  const [showMappingDrawer, setShowMappingDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Active template definition
  const currentTemplate: FormatTemplate = useMemo(() => {
    return FORMAT_TEMPLATES.find((t) => t.id === selectedTemplateId) || FORMAT_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Format Painter Configuration Options
  const [autoFillSlNo, setAutoFillSlNo] = useState<boolean>(true);
  const [nameTitleCase, setNameTitleCase] = useState<boolean>(true);
  const [normalizeCountry, setNormalizeCountry] = useState<boolean>(true);
  const [cleanPhoneNumbers, setCleanPhoneNumbers] = useState<boolean>(true);
  const [normalizeReligion, setNormalizeReligion] = useState<boolean>(true);
  const [dateFormat, setDateFormat] = useState<'M/D/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'>('M/D/YYYY');
  const [companyTitle, setCompanyTitle] = useState<string>('Room Shifting  First Fix  Wellness\\RoseWood Project');
  const [documentDate, setDocumentDate] = useState<string>('Monday, September 7, 2026');
  const [headerTheme, setHeaderTheme] = useState<'gold' | 'teal'>('gold');
  const [preserveExtraColumns, setPreserveExtraColumns] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process workbook buffer
  const processFileBuffer = async (buffer: ArrayBuffer, fileName: string) => {
    setIsProcessing(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer, {
        type: 'array',
        cellDates: false, // Prevent UTC timezone shifting bugs
        raw: false,
        dateNF: 'yyyy-mm-dd',
      });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('No readable sheets found in this file.');
      }

      const initialSheet = wb.SheetNames[0];
      setActiveWorkbook(wb);
      setSelectedSheet(initialSheet);

      const parsed = ExcelAutomationService.parseSheet(wb, initialSheet);
      setParsedData(parsed);

      if (parsed.detectedTitle) {
        setCompanyTitle(parsed.detectedTitle);
      }
      if (parsed.detectedDate) {
        setDocumentDate(parsed.detectedDate);
      }

      const targetTmpl = FORMAT_TEMPLATES.find((t) => t.id === selectedTemplateId) || FORMAT_TEMPLATES[0];
      const autoMapped = ExcelAutomationService.autoMapColumns(parsed.headers, targetTmpl.columns, parsed.rawRows);
      setMappings(autoMapped);

      ToastService.showSuccess(`Loaded ${parsed.rawRows.length} rows from "${fileName}"`);
    } catch (err: any) {
      console.error('[Excel Automation] File read error:', err);
      ToastService.showError(err.message || 'Failed to read Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const buffer = await uploadedFile.arrayBuffer();
    await processFileBuffer(buffer, uploadedFile.name);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    const buffer = await droppedFile.arrayBuffer();
    await processFileBuffer(buffer, droppedFile.name);
  };

  const handleSheetChange = (newSheet: string) => {
    if (!activeWorkbook) return;
    setSelectedSheet(newSheet);
    const parsed = ExcelAutomationService.parseSheet(activeWorkbook, newSheet);
    setParsedData(parsed);
    const autoMapped = ExcelAutomationService.autoMapColumns(parsed.headers, currentTemplate.columns, parsed.rawRows);
    setMappings(autoMapped);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const targetTmpl = FORMAT_TEMPLATES.find((t) => t.id === templateId) || FORMAT_TEMPLATES[0];
    if (parsedData) {
      const newMappings = ExcelAutomationService.autoMapColumns(parsedData.headers, targetTmpl.columns, parsedData.rawRows);
      setMappings(newMappings);
      ToastService.showSuccess(`Switched to "${targetTmpl.name}" (${targetTmpl.columns.length} columns) and re-aligned.`);
    } else {
      ToastService.showSuccess(`Format set to "${targetTmpl.name}"`);
    }
  };

  const handleLoadSample = async () => {
    setIsProcessing(true);
    try {
      const buffer = ExcelAutomationService.getSampleWorkbookForTemplate(selectedTemplateId);
      const mockFile = new File([buffer], `Sample_${currentTemplate.name.replace(/\s+/g, '_')}.xlsx`, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      setFile(mockFile);
      await processFileBuffer(buffer, mockFile.name);
    } catch {
      ToastService.showError('Failed to load sample data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedData(null);
    setActiveWorkbook(null);
    setSelectedSheet('');
    setMappings({});
    setSearchQuery('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMappingChange = (targetKey: string, newSourceHeader: string) => {
    setMappings((prev) => ({
      ...prev,
      [targetKey]: {
        targetKey,
        sourceHeader: newSourceHeader === '__NONE__' ? null : newSourceHeader,
        confidence: 'MANUAL',
      },
    }));
  };

  const handleDownloadBlankTemplate = async () => {
    try {
      await ExcelAutomationService.downloadBlankTemplate(
        currentTemplate.columns,
        `${currentTemplate.name.replace(/\s+/g, '_')}_Template.xlsx`,
        currentTemplate.hasBannerTitle
      );
      ToastService.showSuccess(`Blank "${currentTemplate.name}" template downloaded.`);
    } catch {
      ToastService.showError('Failed to generate template.');
    }
  };

  // Compute extra unmapped columns (leading & trailing)
  const extraCols = useMemo(() => {
    if (!parsedData || !parsedData.headers) return { leading: [], trailing: [] };
    return ExcelAutomationService.getExtraColumns(parsedData.headers, mappings);
  }, [parsedData, mappings]);

  const totalExtraCount = extraCols.leading.length + extraCols.trailing.length;

  const totalDisplayColumns = useMemo(() => {
    if (!preserveExtraColumns) return currentTemplate.columns.length;
    return extraCols.leading.length + currentTemplate.columns.length + extraCols.trailing.length;
  }, [preserveExtraColumns, extraCols, currentTemplate]);

  // Support multi-section rosters (e.g. Check-Out followed by Check-In for Alec Fit Out)
  const processedSections = useMemo(() => {
    if (!parsedData) return [];
    const secs = (parsedData.sections && parsedData.sections.length > 0)
      ? parsedData.sections
      : [
          {
            id: 'sec_1',
            title: companyTitle || parsedData.detectedTitle || 'Room Shifting  First Fix  Wellness\\RoseWood Project',
            date: documentDate || parsedData.detectedDate || 'Monday, September 7, 2026',
            headerRowIndex: parsedData.headerRowIndex,
            headers: parsedData.headers,
            rawRows: parsedData.rawRows,
          },
        ];

    return secs.map((sec, idx) => {
      const secTitle = idx === 0 && companyTitle ? companyTitle : sec.title;
      const secDate = idx === 0 && documentDate ? documentDate : sec.date;

      const secMappings = (idx === 0 && Object.keys(mappings).length > 0)
        ? mappings
        : ExcelAutomationService.autoMapColumns(sec.headers, currentTemplate.columns, sec.rawRows);

      const secExtra = ExcelAutomationService.getExtraColumns(sec.headers, secMappings);
      const secRows = ExcelAutomationService.transformRows(
        sec.rawRows,
        sec.headers,
        secMappings,
        {
          autoFillSlNo,
          nameTitleCase,
          normalizeCountry,
          cleanPhoneNumbers,
          normalizeReligion,
          dateFormat,
          includeExtraColumns: preserveExtraColumns,
        },
        currentTemplate.columns
      );

      return {
        id: sec.id,
        title: secTitle,
        date: secDate,
        headers: sec.headers,
        rawRows: sec.rawRows,
        mappings: secMappings,
        extraColumns: secExtra,
        transformedRows: secRows,
      };
    });
  }, [
    parsedData,
    mappings,
    autoFillSlNo,
    nameTitleCase,
    normalizeCountry,
    cleanPhoneNumbers,
    normalizeReligion,
    dateFormat,
    preserveExtraColumns,
    companyTitle,
    documentDate,
    currentTemplate,
  ]);

  // Standardized Rows with Format Painter options and extra columns applied across all sections
  const transformedRows: StandardizedRow[] = useMemo(() => {
    return processedSections.flatMap((s) => s.transformedRows);
  }, [processedSections]);

  const totalRowCount = transformedRows.length;

  // Search filtering across sections
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return processedSections;
    const q = searchQuery.toLowerCase().trim();
    return processedSections
      .map((sec) => ({
        ...sec,
        transformedRows: sec.transformedRows.filter((r) =>
          Object.values(r).some((val) => {
            if (val && typeof val === 'object') {
              return Object.values(val).some((subVal) => String(subVal).toLowerCase().includes(q));
            }
            return String(val).toLowerCase().includes(q);
          })
        ),
      }))
      .filter((sec) => sec.transformedRows.length > 0);
  }, [processedSections, searchQuery]);

  const filteredRows = useMemo(() => {
    return filteredSections.flatMap((s) => s.transformedRows);
  }, [filteredSections]);

  const mappedCount = useMemo(() => {
    return Object.values(mappings).filter((m) => m && m.sourceHeader !== null).length;
  }, [mappings]);

  // Copy TSV directly to clipboard (Format Painter paste feature)
  const handleCopyToClipboard = async () => {
    if (processedSections.length === 0) return;
    try {
      const tsv = ExcelAutomationService.toTSV(
        transformedRows,
        companyTitle,
        documentDate,
        extraCols,
        preserveExtraColumns,
        processedSections,
        currentTemplate.columns,
        currentTemplate.hasBannerTitle
      );
      await navigator.clipboard.writeText(tsv);
      setHasCopied(true);
      const secMsg = processedSections.length > 1 ? ` across ${processedSections.length} sections` : '';
      ToastService.showSuccess(`Copied ${totalRowCount} rows${secMsg} to clipboard! Ready to paste into Excel.`);
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      ToastService.showError('Clipboard copy failed.');
    }
  };

  // Export official formatted Excel preserving all sheets and columns
  const handleDownloadStandardizedExcel = async () => {
    if (processedSections.length === 0) return;
    setIsExporting(true);
    try {
      const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'Resident_Directory';
      const fileName = `${baseName}_${currentTemplate.name.replace(/\s+/g, '_')}.xlsx`;

      const sheetName = selectedSheet || (parsedData?.sheetName ?? 'RoseWood Project');

      const sectionsForExport = processedSections.map((s) => ({
        title: s.title,
        date: s.date,
        rows: s.transformedRows,
        extraColumns: s.extraColumns,
      }));

      const blob = await ExcelAutomationService.generateStandardizedExcel(
        transformedRows,
        sheetName,
        {
          companyTitle,
          documentDate,
          headerTheme,
          extraColumns: extraCols,
          includeExtraColumns: preserveExtraColumns,
          activeWorkbook,
          selectedSheetName: sheetName,
          autoFillSlNo,
          nameTitleCase,
          normalizeCountry,
          cleanPhoneNumbers,
          normalizeReligion,
          dateFormat,
          sections: sectionsForExport,
          targetColumns: currentTemplate.columns,
          hasBannerTitle: currentTemplate.hasBannerTitle,
        }
      );
      ExcelAutomationService.triggerDownload(blob, fileName);
      const sheetCount = activeWorkbook?.SheetNames?.length || 1;
      const secCount = processedSections.length;
      ToastService.showSuccess(`Official standardized Excel exported (${sheetCount} sheet${sheetCount > 1 ? 's' : ''}, ${secCount} section${secCount > 1 ? 's' : ''} preserved).`);
    } catch (err: any) {
      console.error('[Excel Automation] Export error:', err);
      ToastService.showError('Failed to export Excel file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv, .xlsm"
        className="hidden"
      />

      {/* Modern Compact Executive Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#004D66] text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Excel Format Painter &amp; Normalizer
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[10px] font-black text-teal-700 dark:text-teal-300">
                {currentTemplate.columns.length}-COLUMN FORMAT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload any raw Excel file; instantly normalize column positions, dates, and numbers into your selected format.
            </p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{file ? 'Change File' : 'Upload File'}</span>
          </button>

          {!file && (
            <button
              onClick={handleLoadSample}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Play className="w-3.5 h-3.5 text-teal-600" />
              <span>Try Sample</span>
            </button>
          )}

          <button
            onClick={handleDownloadBlankTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>Blank Template</span>
          </button>

          {transformedRows.length > 0 && (
            <>
              <button
                onClick={handleCopyToClipboard}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Copy formatted rows as TSV to paste directly into existing Excel"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={handleDownloadStandardizedExcel}
                disabled={isExporting}
                className="px-4 py-2 bg-[#004D66] hover:bg-[#003B4E] active:bg-[#002E3D] text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export Standard Excel'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Format Selection Card: Choose Which Layout to Standardize Into */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              <span>Select Target Excel Output Format</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Choose which standardized layout you want your data to be converted into.
            </p>
          </div>
          <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 self-start sm:self-auto font-bold">
            Active: {currentTemplate.name} ({currentTemplate.columns.length} Columns)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FORMAT_TEMPLATES.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-3.5 rounded-xl border text-left transition relative cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black ${isSelected ? 'text-teal-950 dark:text-teal-100' : 'text-slate-800 dark:text-slate-200'}`}>
                    {tmpl.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tmpl.columns.length} Cols
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                  <span>{tmpl.hasBannerTitle ? 'With Banner Row' : 'Direct Headers'}</span>
                  {isSelected && (
                    <span className="flex items-center text-teal-600 dark:text-teal-400 font-bold">
                      <Check className="w-3 h-3 mr-0.5" /> Selected
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {!file ? (
        /* Empty State Drag & Drop Zone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-600 bg-white dark:bg-slate-900/40 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer transition shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-800">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Drop your raw Excel file here or click to browse
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accepts .xlsm (macro-enabled), .xlsx, .xls, and .csv files with disordered columns or alternative headers
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSample();
              }}
              className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition cursor-pointer"
            >
              Load Sample ({currentTemplate.name})
            </button>
          </div>
        </div>
      ) : (
        /* Loaded File State: Compact Multi-Functional Tool Belt */
        <div className="space-y-3">
          {/* Streamlined Toolbar Row */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Active File Info & Sheet Switcher */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
                <FileSpreadsheet className="w-4 h-4 text-[#004D66] dark:text-teal-400 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded">
                  {transformedRows.length} rows
                </span>
                <button
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-500 transition cursor-pointer ml-1"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {parsedData && parsedData.sheetNames.length > 1 && (
                <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-medium">Sheet:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                  >
                    {parsedData.sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className="hidden sm:inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ({parsedData.sheetNames.length} sheets preserved)
                  </span>
                </div>
              )}
            </div>

            {/* Middle: Format Painter Options (Toggles & Presets) */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Preserve Extra Columns Toggle */}
              {totalExtraCount > 0 && (
                <button
                  onClick={() => setPreserveExtraColumns((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1 ${
                    preserveExtraColumns
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title="Keep unmapped extra columns in their relative leading/trailing positions"
                >
                  <Check className={`w-3 h-3 ${preserveExtraColumns ? 'opacity-100' : 'opacity-0'}`} />
                  <span>Preserve Extra ({totalExtraCount})</span>
                </button>
              )}
              {/* Date Format Selector */}
              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[11px] font-medium">Date:</span>
                <button
                  onClick={() => setDateFormat('M/D/YYYY')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
                    dateFormat === 'M/D/YYYY'
                      ? 'bg-[#004D66] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Format like 6/23/2026 (US / Excel Default)"
                >
                  M/D/YYYY
                </button>
                <button
                  onClick={() => setDateFormat('DD/MM/YYYY')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
                    dateFormat === 'DD/MM/YYYY'
                      ? 'bg-[#004D66] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Format like 23/06/2026 (International)"
                >
                  DD/MM/YYYY
                </button>
              </div>

              {/* Sl No Auto Sequence (if template has serial column) */}
              {currentTemplate.columns[0]?.role === 'serial' && (
                <button
                  onClick={() => setAutoFillSlNo((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1 ${
                    autoFillSlNo
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title="Automatically sequence Sl No from 1 to N"
                >
                  <Check className={`w-3 h-3 ${autoFillSlNo ? 'opacity-100' : 'opacity-0'}`} />
                  <span>Sl No: 1..N</span>
                </button>
              )}

              {/* Title Case Names */}
              <button
                onClick={() => setNameTitleCase((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1 ${
                  nameTitleCase
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="Format all employee names in proper Title Case (Rahim Rahman)"
              >
                <Check className={`w-3 h-3 ${nameTitleCase ? 'opacity-100' : 'opacity-0'}`} />
                <span>Title Case</span>
              </button>

              {/* Country Clean (Bangladeshi -> Bangladesh) */}
              <button
                onClick={() => setNormalizeCountry((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1 ${
                  normalizeCountry
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="Normalize nationality to standard country name (e.g., Bangladeshi -> Bangladesh)"
              >
                <Check className={`w-3 h-3 ${normalizeCountry ? 'opacity-100' : 'opacity-0'}`} />
                <span>Country Clean</span>
              </button>

              {/* Saudi Phone Clean (+966, 05 -> 5...) */}
              <button
                onClick={() => setCleanPhoneNumbers((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1 ${
                  cleanPhoneNumbers
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="Strip +966, 966, 05 prefix so phone numbers strictly start with 5"
              >
                <Check className={`w-3 h-3 ${cleanPhoneNumbers ? 'opacity-100' : 'opacity-0'}`} />
                <span>Phone: 5...</span>
              </button>

              {/* Religion Normalization (Islam -> Muslim, Others -> Non-Muslim) */}
              <button
                onClick={() => setNormalizeReligion((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1 ${
                  normalizeReligion
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="Normalize religion: Islam/Muslim -> Muslim, all other faiths/values -> Non-Muslim"
              >
                <Check className={`w-3 h-3 ${normalizeReligion ? 'opacity-100' : 'opacity-0'}`} />
                <span>Religion: Muslim</span>
              </button>

              {/* Header Color Theme Selector */}
              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[11px] font-medium">Theme:</span>
                <button
                  onClick={() => setHeaderTheme('gold')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
                    headerTheme === 'gold'
                      ? 'bg-[#7A6006] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Dark Gold / Ochre Header (matches user format)"
                >
                  Gold
                </button>
                <button
                  onClick={() => setHeaderTheme('teal')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
                    headerTheme === 'teal'
                      ? 'bg-[#004D66] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Deep Teal Blue Header"
                >
                  Teal
                </button>
              </div>

              {/* Column Mapping Toggle Button */}
              <button
                onClick={() => setShowMappingDrawer((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                  showMappingDrawer
                    ? 'bg-[#004D66] text-white border-[#004D66]'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Columns ({mappedCount}/{currentTemplate.columns.length})</span>
                {showMappingDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Right: Search Filter */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Company / Project Title & Date Banner Controls */}
          {currentTemplate.hasBannerTitle && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex-1 w-full flex items-center space-x-2">
                <span className="text-slate-500 font-bold whitespace-nowrap text-[11px]">Header 1 (Company / Project):</span>
                <input
                  type="text"
                  value={companyTitle}
                  onChange={(e) => setCompanyTitle(e.target.value)}
                  placeholder="Company / Project Title"
                  className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>
              <div className="w-full sm:w-auto flex items-center space-x-2">
                <span className="text-slate-500 font-bold whitespace-nowrap text-[11px]">Date:</span>
                <input
                  type="text"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  placeholder="Document Date"
                  className="w-full sm:w-56 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Collapsible Column Mapping Drawer (Only when requested) */}
          {showMappingDrawer && parsedData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#004D66] dark:text-teal-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {currentTemplate.name} Alignment Matrix
                  </h4>
                </div>
                <button
                  onClick={() => {
                    const auto = ExcelAutomationService.autoMapColumns(parsedData.headers, currentTemplate.columns);
                    setMappings(auto);
                    ToastService.showSuccess('Re-aligned columns automatically.');
                  }}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Auto-Detect</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {currentTemplate.columns.map((col) => {
                  const current = mappings[col.key];
                  const isMapped = current && current.sourceHeader !== null;

                  return (
                    <div
                      key={col.key}
                      className={`p-2 rounded-lg border text-left transition ${
                        isMapped
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-teal-200 dark:border-teal-900'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">
                          {col.label}
                        </span>
                        {isMapped ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <select
                        value={current?.sourceHeader || '__NONE__'}
                        onChange={(e) => handleMappingChange(col.key, e.target.value)}
                        className="w-full text-[11px] font-medium py-1 px-1.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="__NONE__">- Blank -</option>
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* High-Fidelity Excel Grid Matching User's Format Painter Reference */}
          <div className="bg-white dark:bg-slate-900 border border-black/40 rounded-xl overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto max-h-[620px] scrollbar-thin">
              <table className="w-full border-collapse text-[11px] font-sans min-w-[1300px]">
                {filteredSections.map((sec, secIdx) => {
                  const secLeading = preserveExtraColumns && sec.extraColumns?.leading ? sec.extraColumns.leading : extraCols.leading;
                  const secTrailing = preserveExtraColumns && sec.extraColumns?.trailing ? sec.extraColumns.trailing : extraCols.trailing;
                  const hasSerial = currentTemplate.columns[0]?.role === 'serial';
                  const firstCol = currentTemplate.columns[0];
                  const remainingTargetCols = hasSerial ? currentTemplate.columns.slice(1) : currentTemplate.columns;
                  const secTotalCols = (hasSerial ? 1 : 0) + secLeading.length + remainingTargetCols.length + secTrailing.length;

                  return (
                    <tbody key={sec.id || secIdx} className="divide-y divide-black/20 text-slate-900 dark:text-slate-100">
                      {/* Row 1: Section Title & Date Banner (if enabled) */}
                      {currentTemplate.hasBannerTitle && (
                        <tr
                          className={`${
                            headerTheme === 'gold' ? 'bg-[#7A6006]' : 'bg-[#004D66]'
                          } text-white border-b border-black divide-x divide-black/30 sticky top-0 z-10`}
                        >
                          <th
                            colSpan={Math.max(1, secTotalCols - 2)}
                            className="py-2.5 px-4 text-center font-bold text-xs uppercase tracking-wide whitespace-nowrap"
                          >
                            {sec.title}
                          </th>
                          <th
                            colSpan={2}
                            className="py-2.5 px-3 text-right font-medium text-[11px] whitespace-nowrap"
                          >
                            {sec.date}
                          </th>
                        </tr>
                      )}

                      {/* Row 2: Columns Headers (Repeating Header Row per Section) */}
                      <tr
                        className={`${
                          headerTheme === 'gold' ? 'bg-[#7A6006]' : 'bg-[#004D66]'
                        } text-white divide-x divide-black/30 border-b border-black ${
                          !currentTemplate.hasBannerTitle ? 'sticky top-0 z-10' : ''
                        }`}
                      >
                        {/* 1. SL NO Column if serial */}
                        {hasSerial && firstCol && (
                          <th
                            className="py-2 px-2 font-bold uppercase tracking-tight text-center whitespace-nowrap border-b border-black"
                            style={{ width: `${firstCol.width * 7.5}px` }}
                          >
                            {firstCol.label}
                          </th>
                        )}

                        {/* 2. Leading Extra Columns */}
                        {preserveExtraColumns &&
                          secLeading.map((col) => (
                            <th
                              key={`leading_${col.header}`}
                              className="py-1.5 px-2 font-bold uppercase tracking-tight text-center whitespace-nowrap border-b border-black bg-black/15"
                              style={{ width: `${Math.max(12, col.header.length + 3) * 7.5}px` }}
                              title={`Extra Column from original file (Col ${col.sourceIndex + 1})`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] opacity-75 font-mono">Extra</span>
                                <span>{col.header}</span>
                              </div>
                            </th>
                          ))}

                        {/* 3. Target Columns */}
                        {remainingTargetCols.map((col) => (
                          <th
                            key={col.key}
                            className="py-2 px-2 font-bold uppercase tracking-tight text-center whitespace-nowrap border-b border-black"
                            style={{ width: `${col.width * 7.5}px` }}
                          >
                            {col.label}
                          </th>
                        ))}

                        {/* 4. Trailing Extra Columns */}
                        {preserveExtraColumns &&
                          secTrailing.map((col) => (
                            <th
                              key={`trailing_${col.header}`}
                              className="py-1.5 px-2 font-bold uppercase tracking-tight text-center whitespace-nowrap border-b border-black bg-black/15"
                              style={{ width: `${Math.max(12, col.header.length + 3) * 7.5}px` }}
                              title={`Extra Trailing Column from original file (Col ${col.sourceIndex + 1})`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] opacity-75 font-mono">Extra</span>
                                <span>{col.header}</span>
                              </div>
                            </th>
                          ))}
                      </tr>

                      {/* Row 3+: Data Rows for this section */}
                      {sec.transformedRows.slice(0, 150).map((row, idx) => (
                        <tr
                          key={idx}
                          className="divide-x divide-black/20 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition h-8"
                        >
                          {/* 1. SL NO Column if serial */}
                          {hasSerial && firstCol && (
                            <td className="py-1 px-2 text-center font-medium border-r border-black/20">
                              {row.values?.[firstCol.key] ?? (row as any)[firstCol.key] ?? row.slNo}
                            </td>
                          )}

                          {/* 2. Leading Extra Values */}
                          {preserveExtraColumns &&
                            secLeading.map((col) => (
                              <td
                                key={`lead_val_${col.header}`}
                                className="py-1 px-2 text-center border-r border-black/20 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                {row.extraValues?.[col.header] ?? ''}
                              </td>
                            ))}

                          {/* 3. Target Columns Values */}
                          {remainingTargetCols.map((colDef) => {
                            const val = row.values?.[colDef.key] ?? (row as any)[colDef.key] ?? '';
                            return (
                              <td
                                key={colDef.key}
                                className={`py-1 px-2 border-r border-black/20 ${
                                  colDef.align === 'center'
                                    ? 'text-center'
                                    : colDef.align === 'right'
                                    ? 'text-right'
                                    : 'text-left'
                                } ${colDef.role === 'name' ? 'font-bold' : ''} ${
                                  colDef.type === 'date' ||
                                  colDef.role === 'iqama' ||
                                  colDef.role === 'mobile' ||
                                  colDef.role === 'national_id_iqama'
                                    ? 'font-mono'
                                    : ''
                                }`}
                              >
                                {val !== undefined && val !== null ? String(val) : ''}
                              </td>
                            );
                          })}

                          {/* 4. Trailing Extra Values */}
                          {preserveExtraColumns &&
                            secTrailing.map((col) => (
                              <td
                                key={`trail_val_${col.header}`}
                                className="py-1 px-2 text-center border-r border-black/20 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                {row.extraValues?.[col.header] ?? ''}
                              </td>
                            ))}
                        </tr>
                      ))}

                      {/* Spacer row between sections if there is another section */}
                      {secIdx < filteredSections.length - 1 && (
                        <tr className="h-5 bg-slate-100 dark:bg-slate-800/70 border-y border-black/20">
                          <td colSpan={secTotalCols} className="py-1 text-center text-[10px] text-slate-400 font-mono tracking-widest">
                            • • •
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </table>
            </div>

            {/* Bottom Status Footer */}
            <div className="py-2 px-4 bg-slate-50 dark:bg-slate-800/60 border-t border-black/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Showing {Math.min(filteredRows.length, 150)} of {filteredRows.length} standardized rows
                {processedSections.length > 1 && (
                  <span className="ml-1.5 text-teal-700 dark:text-teal-400 font-semibold">
                    ({processedSections.length} repeating sections detected)
                  </span>
                )}
                {preserveExtraColumns && totalExtraCount > 0 && (
                  <span className="ml-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                    ({totalExtraCount} extra columns preserved: {extraCols.leading.length} leading, {extraCols.trailing.length} trailing)
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400 font-bold">
                {activeWorkbook?.SheetNames?.length || 1} Sheets Preserved · Total Output: {totalDisplayColumns} Columns {currentTemplate.hasBannerTitle ? '· Row 1 Title Banner' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

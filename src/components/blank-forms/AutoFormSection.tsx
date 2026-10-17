import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  User,
  Shield,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Layers,
  Check,
  RotateCcw,
  Edit3,
  Award,
  Upload,
  AlertCircle,
  FileCheck,
  Eye,
  X,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  Plus,
  RefreshCw,
  Database,
  Cloud,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BlankFromRow, EMPTY_BLANK_FROM_ROW } from '../../data/initialBlankFromData';
import { MANAGEMENT_ALLOCATION_RECORDS } from '../../data/managementAllocationData';
import { BlankFromService } from '../../services/blankFromService';
import { DocxFillService } from '../../services/docxFillService';
import { ToastService } from '../../services/toastService';
import { GasService } from '../../services/gasService';
import { getTodayDateString } from '../../services/storageService';
import { ExcelImportSettings, ExcelImportSettingsService } from '../../services/excelImportSettingsService';
import { ExcelImportSettingsModal } from './ExcelImportSettingsModal';
import { ExcelImportPreviewModal, ExcelImportScanResult } from './ExcelImportPreviewModal';
import { AddEmployeeModal } from './AddEmployeeModal';
import redseaLogo from '../../assets/images/redsea-cm-logo.jpeg';

interface AutoFormSectionProps {
  onSavedToDrafts?: () => void;
}

export const AutoFormSection: React.FC<AutoFormSectionProps> = ({ onSavedToDrafts }) => {
  // Master Resident Dataset (Persisted in IndexedDB / LocalStorage, defaults to 1,438 records)
  const [rows, setRows] = useState<BlankFromRow[]>(() => {
    const existing = BlankFromService.getRows();
    return existing && existing.length > 0 ? existing : MANAGEMENT_ALLOCATION_RECORDS;
  });

  // Filter States (Excel-style Multi-Tier Filtering)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Executive' | 'Senior' | 'Junior' | 'Worker'>('ALL');

  // Currently selected resident
  const [selectedRow, setSelectedRow] = useState<BlankFromRow | null>(() => {
    const list = BlankFromService.getRows();
    const source = list && list.length > 0 ? list : MANAGEMENT_ALLOCATION_RECORDS;
    return source[0] || null;
  });

  // Live editable form values for From.docx
  const [formValues, setFormValues] = useState<BlankFromRow>(() => {
    const list = BlankFromService.getRows();
    const source = list && list.length > 0 ? list : MANAGEMENT_ALLOCATION_RECORDS;
    return source[0] ? { ...EMPTY_BLANK_FROM_ROW, ...source[0] } : EMPTY_BLANK_FROM_ROW;
  });

  const [isEditingFields, setIsEditingFields] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Smart Deduplication Import States & Settings
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importSettings, setImportSettings] = useState<ExcelImportSettings>(() =>
    ExcelImportSettingsService.getSettings()
  );
  const [previewModalData, setPreviewModalData] = useState<ExcelImportScanResult | null>(null);
  const [isSavingFromPreview, setIsSavingFromPreview] = useState(false);
  const scannedParsedRowsRef = useRef<{ file: File; rows: BlankFromRow[] } | null>(null);

  const [importSummary, setImportSummary] = useState<{
    fileName: string;
    totalScanned: number;
    skippedDuplicates: number;
    newAdded: number;
    newTotal: number;
    newRecords: BlankFromRow[];
  } | null>(null);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [showOnlyNewlyAdded, setShowOnlyNewlyAdded] = useState(false);
  const [showOnlyCustom, setShowOnlyCustom] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);

  const excelUploadRef = useRef<HTMLInputElement>(null);

  // Initialize and ensure baseline records + custom records are loaded
  useEffect(() => {
    BlankFromService.init().then((initialRows) => {
      if (initialRows && initialRows.length > 0) {
        setRows(initialRows);
        setSelectedRow((prev) => prev || initialRows[0]);
        setFormValues((prev) => (prev && prev.employmentId ? prev : { ...EMPTY_BLANK_FROM_ROW, ...initialRows[0] }));
      } else {
        setRows(MANAGEMENT_ALLOCATION_RECORDS);
        setSelectedRow(MANAGEMENT_ALLOCATION_RECORDS[0]);
        setFormValues({ ...EMPTY_BLANK_FROM_ROW, ...MANAGEMENT_ALLOCATION_RECORDS[0] });
      }
    });
  }, []);

  // Listen for background sync or cross-session/custom employee updates
  useEffect(() => {
    const handleUpdate = () => {
      const updated = BlankFromService.getRows();
      if (updated && updated.length > 0) {
        setRows(updated);
      }
    };
    window.addEventListener('tamimi_blank_from_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tamimi_blank_from_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Handler for single employee manual addition
  const handleSaveSingleEmployee = (newEmp: BlankFromRow) => {
    BlankFromService.addCustomEmployees([newEmp], true);
    const updatedAll = BlankFromService.getRows();
    setRows(updatedAll);
    setSelectedRow(newEmp);
    setFormValues({ ...EMPTY_BLANK_FROM_ROW, ...newEmp });
    confetti({ particleCount: 60, spread: 70 });
    ToastService.hub(
      `Resident "${newEmp.name}" (ID: ${newEmp.employmentId}) added! Saved locally, saved to server disk, and synced to Google Sheets.`
    );
  };

  // Handler for manual Google Sheets sync
  const handleSyncToGoogleSheet = async () => {
    setIsSyncingToSheet(true);
    try {
      const customList = BlankFromService.getCustomEmployees();
      const recordsToPush = customList.length > 0 ? customList : rows;
      if (recordsToPush.length > 0) {
        const res = await GasService.pushBatchBlankFormEmployees(recordsToPush, 'append');
        if (res && res.success) {
          ToastService.hub(
            `Google Sheets Synced! ${recordsToPush.length.toLocaleString()} resident record(s) safely stored in Google Sheet ("Blank Forms" tab).`
          );
        } else {
          ToastService.warn(res?.error || 'Google Sheets sync completed with notice.');
        }
      } else {
        ToastService.hub('System is already up to date with Google Sheets.');
      }
    } catch (err: any) {
      ToastService.warn(`Sync failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  // Synchronize when selected row changes
  useEffect(() => {
    if (selectedRow) {
      setFormValues({ ...EMPTY_BLANK_FROM_ROW, ...selectedRow });
    }
  }, [selectedRow]);

  // Reset unit filter when building changes
  const handleBuildingChange = (bldg: string) => {
    setSelectedBuilding(bldg);
    setSelectedUnit('ALL');
    setCurrentPage(1);
  };

  // Extract all unique Buildings from data with counts
  const buildingOptions = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const b = (r.buildingNo || r.house || '').trim();
      if (b) {
        map.set(b, (map.get(b) || 0) + 1);
      }
    });

    const list = Array.from(map.entries()).map(([building, count]) => ({
      building,
      count,
    }));

    // Natural sort: e.g. D01, D02, H01, L02...
    list.sort((a, b) => a.building.localeCompare(b.building, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, [rows]);

  // Extract Units cascading based on selected Building
  const unitOptions = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const b = (r.buildingNo || r.house || '').trim();
      if (selectedBuilding !== 'ALL' && b !== selectedBuilding) {
        return;
      }
      const u = (r.unitNo || r.room || '').trim();
      if (u) {
        map.set(u, (map.get(u) || 0) + 1);
      }
    });

    const list = Array.from(map.entries()).map(([unit, count]) => ({
      unit,
      count,
    }));

    // Natural sort: e.g. 101, 102, 106, 108...
    list.sort((a, b) => a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, [rows, selectedBuilding]);

  // Custom uploaded/added employees list
  const customEmployeesList = useMemo(() => {
    return BlankFromService.getCustomEmployees();
  }, [rows]);
  const customCount = customEmployeesList.length;

  // Excel-like Filtered Results
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cleanAlphaNum = q.replace(/[^a-z0-9]/g, '');

    const customIds = new Set(customEmployeesList.map((c) => c.id));
    const customEmpIds = new Set(
      customEmployeesList.map((c) => (c.employmentId || '').trim().toLowerCase()).filter(Boolean)
    );

    return rows.filter((r) => {
      if (!r) return false;

      // 0. Filter custom / uploaded only if toggled
      if (showOnlyCustom) {
        const isCustom =
          (r.id && (r.id.startsWith('custom-emp-') || r.id.startsWith('mah-new-'))) ||
          customIds.has(r.id) ||
          (r.employmentId && customEmpIds.has(String(r.employmentId).trim().toLowerCase()));
        if (!isCustom) return false;
      }

      // 0b. Filter newly imported only if toggled
      if (showOnlyNewlyAdded && newlyAddedIds.size > 0) {
        if (!newlyAddedIds.has(r.id)) return false;
      }

      // 1. Building Filter
      if (selectedBuilding !== 'ALL') {
        const b = (r.buildingNo || r.house || '').trim();
        if (b !== selectedBuilding) return false;
      }

      // 2. Unit Filter (Cascading)
      if (selectedUnit !== 'ALL') {
        const u = (r.unitNo || r.room || '').trim();
        if (u !== selectedUnit) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL') {
        const cat = (r.propertyType || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }

      // 4. Free-text Search
      if (!q) return true;

      const name = (r.name || '').toLowerCase();
      const empId = (r.employmentId || '').toLowerCase();
      const bldg = (r.buildingNo || r.house || '').toLowerCase();
      const unit = (r.unitNo || r.room || '').toLowerCase();
      const serial = (r.unitSerialNo || '').toLowerCase();
      const iqama = (r.idIqama || '').toLowerCase();
      const passport = (r.passport || '').toLowerCase();
      const mobile = (r.mobile || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      const comp = (r.company || '').toLowerCase();

      if (
        name.includes(q) ||
        empId.includes(q) ||
        bldg.includes(q) ||
        unit.includes(q) ||
        serial.includes(q) ||
        iqama.includes(q) ||
        passport.includes(q) ||
        mobile.includes(q) ||
        dept.includes(q) ||
        comp.includes(q)
      ) {
        return true;
      }

      if (cleanAlphaNum && cleanAlphaNum.length >= 2) {
        if (
          name.replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum) ||
          empId.replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum) ||
          iqama.replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum) ||
          mobile.replace(/[^a-z0-9]/g, '').includes(cleanAlphaNum)
        ) {
          return true;
        }
      }

      return false;
    });
  }, [rows, selectedBuilding, selectedUnit, categoryFilter, searchQuery, showOnlyNewlyAdded, newlyAddedIds, showOnlyCustom, customEmployeesList]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBuilding, selectedUnit, categoryFilter, pageSize, showOnlyNewlyAdded, showOnlyCustom]);

  // Paginated Results
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  // Check if any filter is active
  const isFilterActive =
    selectedBuilding !== 'ALL' ||
    selectedUnit !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    searchQuery.trim().length > 0 ||
    showOnlyNewlyAdded;

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedBuilding('ALL');
    setSelectedUnit('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
    setShowOnlyNewlyAdded(false);
    setCurrentPage(1);
    ToastService.hub('All filters reset.');
  };

  // Select resident handler
  const handleSelectEmployee = (emp: BlankFromRow) => {
    if (!emp) return;
    setSelectedRow(emp);
    setFormValues({ ...EMPTY_BLANK_FROM_ROW, ...emp });
    ToastService.hub(`Selected: ${emp.name || 'Resident'} (ID: ${emp.employmentId || 'N/A'}) - Unit ${emp.unitNo || emp.room || 'N/A'}`);
  };

  // Field change handler
  const handleFieldChange = (key: keyof BlankFromRow, value: any) => {
    setFormValues((prev) => ({
      ...(prev || EMPTY_BLANK_FROM_ROW),
      [key]: value,
    }));
  };

  // Download filled Word file (.docx)
  const handleDownloadWordDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const fileName = await DocxFillService.downloadFilledDocx(formValues);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      ToastService.hub(`Downloaded Word Form: ${fileName}`);
    } catch (err: any) {
      console.error('Word file generation error:', err);
      ToastService.warn(`Failed to generate Word document: ${err?.message || 'Error'}`);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  // Download blank template From.docx
  const handleDownloadBlankFromDocx = async () => {
    try {
      await DocxFillService.downloadBlankDocx();
      ToastService.hub('Downloaded blank From.docx');
    } catch (e: any) {
      const a = document.createElement('a');
      a.href = './From.docx';
      a.download = 'From.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      ToastService.hub('Downloaded blank From.docx');
    }
  };

  // Download master Excel file
  const handleDownloadMasterExcel = () => {
    const a = document.createElement('a');
    a.href = './Management Allocation History.xlsx';
    a.download = 'Management Allocation History.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    ToastService.hub('Downloaded Management Allocation History.xlsx');
  };

  // Strict Incremental Excel Import: Collects ONLY brand new unique records, skips duplicates
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const currentSettings = ExcelImportSettingsService.getSettings();

      const parsed = BlankFromService.parseWorkbookToRows(wb, currentSettings);

      if (parsed.rows && parsed.rows.length > 0) {
        if (currentSettings.showPreviewBeforeSave) {
          // Dry run analysis to present in interactive preview modal
          const existingList = BlankFromService.getRows();

          const cleanAlphaNum = (val?: string | number): string =>
            val ? String(val).trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          const cleanDigits = (val?: string | number): string =>
            val ? String(val).replace(/\D/g, '') : '';
          const cleanName = (val?: string | number): string =>
            val ? String(val).trim().toLowerCase().replace(/\s+/g, ' ') : '';

          const mapEmpId = new Set<string>();
          const mapIqama = new Set<string>();
          const mapPassport = new Set<string>();
          const mapNameUnit = new Set<string>();
          const mapMobile = new Set<string>();

          existingList.forEach((r) => {
            const emp = cleanAlphaNum(r.employmentId);
            if (emp && emp.length >= 2) mapEmpId.add(emp);
            const iq = cleanDigits(r.idIqama);
            if (iq && iq.length >= 7) mapIqama.add(iq);
            const p = cleanAlphaNum(r.passport);
            if (p && p.length >= 5) mapPassport.add(p);
            const n = cleanName(r.name);
            const b = cleanAlphaNum(r.buildingNo || r.house);
            const u = cleanAlphaNum(r.unitNo || r.room);
            if (n && (b || u)) mapNameUnit.add(`${n}_${b}_${u}`);
            const m = cleanDigits(r.mobile);
            if (m && m.length >= 8) mapMobile.add(m);
          });

          const newRowsFound: BlankFromRow[] = [];
          const skippedRows: Array<{ record: BlankFromRow; reason: string }> = [];
          const batchEmp = new Set<string>();
          const batchIq = new Set<string>();
          const batchPass = new Set<string>();
          const batchNu = new Set<string>();

          for (const inc of parsed.rows) {
            const emp = cleanAlphaNum(inc.employmentId);
            const iq = cleanDigits(inc.idIqama);
            const p = cleanAlphaNum(inc.passport);
            const n = cleanName(inc.name);
            const b = cleanAlphaNum(inc.buildingNo || inc.house);
            const u = cleanAlphaNum(inc.unitNo || inc.room);
            const m = cleanDigits(inc.mobile);
            const nu = n && (b || u) ? `${n}_${b}_${u}` : '';

            if (!n && !emp && !iq && !p && !m) continue;

            let isDup = false;
            let reason = '';
            if (currentSettings.matchByEmpId && emp && emp.length >= 2 && mapEmpId.has(emp)) {
              isDup = true;
              reason = `Matched Employment ID: ${inc.employmentId}`;
            } else if (currentSettings.matchByIqama && iq && iq.length >= 7 && mapIqama.has(iq)) {
              isDup = true;
              reason = `Matched Iqama/Nat ID: ${inc.idIqama}`;
            } else if (currentSettings.matchByPassport && p && p.length >= 5 && mapPassport.has(p)) {
              isDup = true;
              reason = `Matched Passport: ${inc.passport}`;
            } else if (currentSettings.matchByNameAndUnit && nu && mapNameUnit.has(nu)) {
              isDup = true;
              reason = `Matched Name & Room: ${inc.name} (${inc.unitNo || inc.room})`;
            } else if (currentSettings.matchByMobile && m && m.length >= 8 && mapMobile.has(m)) {
              isDup = true;
              reason = `Matched Mobile: ${inc.mobile}`;
            }

            if (!isDup) {
              if (emp && emp.length >= 2 && batchEmp.has(emp)) {
                isDup = true;
                reason = `File Duplicate (Emp ID: ${inc.employmentId})`;
              } else if (iq && iq.length >= 7 && batchIq.has(iq)) {
                isDup = true;
                reason = `File Duplicate (Iqama: ${inc.idIqama})`;
              } else if (p && p.length >= 5 && batchPass.has(p)) {
                isDup = true;
                reason = `File Duplicate (Passport: ${inc.passport})`;
              } else if (nu && batchNu.has(nu)) {
                isDup = true;
                reason = `File Duplicate (${inc.name} in Unit ${inc.unitNo})`;
              }
            }

            if (isDup) {
              skippedRows.push({ record: inc, reason });
            } else {
              newRowsFound.push(inc);
              if (emp) batchEmp.add(emp);
              if (iq) batchIq.add(iq);
              if (p) batchPass.add(p);
              if (nu) batchNu.add(nu);
            }
          }

          scannedParsedRowsRef.current = { file, rows: parsed.rows };
          setPreviewModalData({
            fileName: file.name,
            totalScanned: parsed.rows.length,
            skippedDuplicates: skippedRows.length,
            newUniqueCount: newRowsFound.length,
            newRecords: newRowsFound,
            skippedSample: skippedRows.slice(0, 50),
            sheetsScanned: parsed.sheetsScanned,
            currentDbTotal: existingList.length,
          });
        } else {
          // Direct merge without preview
          executeMerge(file.name, parsed.rows);
        }
      } else {
        ToastService.warn('No valid resident records recognized in the uploaded Excel.');
      }
    } catch (err: any) {
      console.error('File import error:', err);
      ToastService.warn(`Could not read Excel file: ${err?.message || 'Format error'}`);
    } finally {
      if (excelUploadRef.current) excelUploadRef.current.value = '';
    }
  };

  const executeMerge = (fileName: string, rowsToMerge: BlankFromRow[]) => {
    const result = BlankFromService.mergeNewExcelRows(rowsToMerge);
    const updatedAll = BlankFromService.getRows();
    setRows(updatedAll);

    if (result.added > 0) {
      const newIds = new Set(result.newRecords.map((r) => r.id));
      setNewlyAddedIds(newIds);
      if (result.newRecords[0]) {
        setSelectedRow(result.newRecords[0]);
        setFormValues({ ...EMPTY_BLANK_FROM_ROW, ...result.newRecords[0] });
      }
      setCurrentPage(1);
      confetti({ particleCount: 60, spread: 70 });
      ToastService.hub(
        `Import Successful: ${result.added} new unique resident(s) added! (${result.skipped.toLocaleString()} existing duplicates skipped)`
      );
    } else {
      ToastService.warn(
        `All ${result.skipped.toLocaleString()} records in "${fileName}" already exist in your saved database. 0 duplicates added.`
      );
    }

    setImportSummary({
      fileName,
      totalScanned: rowsToMerge.length,
      skippedDuplicates: result.skipped,
      newAdded: result.added,
      newTotal: result.total,
      newRecords: result.newRecords,
    });
  };

  const handleConfirmSaveFromPreview = () => {
    if (!scannedParsedRowsRef.current) return;
    setIsSavingFromPreview(true);
    try {
      executeMerge(
        scannedParsedRowsRef.current.file.name,
        scannedParsedRowsRef.current.rows
      );
      setPreviewModalData(null);
    } finally {
      setIsSavingFromPreview(false);
    }
  };

  // Save to drafts
  const handleSaveToDrafts = () => {
    const draftId = `DRAFT-AUTO-${Date.now()}`;
    const newDraft = {
      id: draftId,
      templateId: 'COMMUNITY-MGMT-MOVE-IN-OUT',
      formCode: 'CM-MOVE-IN-OUT-01',
      title: 'Community Management - Move-In & Move-Out Form',
      docRef: `TBCV/CM/${new Date().getFullYear()}/${(formValues.employmentId || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}`,
      applicant: `${formValues.name || 'Resident'} (${formValues.employmentId || 'N/A'})`,
      department: formValues.department || 'Operations',
      createdAt: new Date().toISOString(),
      formData: { ...formValues },
      status: 'SUBMITTED' as const,
    };

    try {
      const STORAGE_KEY = 'tafga_saved_form_records_v1';
      const existing = localStorage.getItem(STORAGE_KEY);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newDraft);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('blank_forms_updated'));
      ToastService.hub('Form successfully saved to drafts.');
      if (onSavedToDrafts) onSavedToDrafts();
    } catch (e) {
      ToastService.warn('Could not save draft record.');
    }
  };

  // Print form directly
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Hidden single file input */}
      <input
        type="file"
        ref={excelUploadRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleImportExcel}
        className="hidden"
      />

      {/* Top Header Card (Clean & Light, Professional UI) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
              Auto Form Portal
            </span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{rows.length.toLocaleString()} Residents Saved</span>
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition cursor-pointer"
              title="Click to view & configure unique key matching and deduplication settings"
            >
              <Shield className="w-3 h-3 text-blue-600" />
              <span>Deduplication: {importSettings.mode === 'STRICT_UNIQUE_ONLY' ? 'Unique Only (Active)' : 'Update & Add'}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 underline font-semibold ml-0.5">Settings</span>
            </button>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            From.docx Auto-Fill Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Filter by Building and Unit or search any employee from <strong className="text-slate-700 dark:text-slate-300">Management Allocation History.xlsx</strong> to populate the official <strong className="text-slate-700 dark:text-slate-300">From.docx</strong> form. One-click instant Word download and print.
          </p>
        </div>

        {/* Clean Light Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            title="Manually add a new resident or employee record"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Resident</span>
          </button>

          <button
            type="button"
            onClick={() => excelUploadRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            title="Import Excel to append new resident records"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToGoogleSheet}
            disabled={isSyncingToSheet}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Sync all resident data and custom records to Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingToSheet ? 'animate-spin' : ''}`} />
            <span>{isSyncingToSheet ? 'Syncing...' : 'Sync with Sheet'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Configure Smart Deduplication & Unique Excel Upload Settings"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Deduplication</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBlankFromDocx}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Download blank From.docx template"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Blank Form</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMasterExcel}
            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Download Management Allocation History.xlsx"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel Data</span>
          </button>
        </div>
      </div>

      {/* Selected Resident & Form Action Panel (Replaces the giant 850px preview) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {selectedRow ? (
          <div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/60 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {(formValues.name || 'EM').trim().slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {formValues.name || 'Unnamed Resident'}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                      ID: {formValues.employmentId || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                      Bldg {formValues.buildingNo || formValues.house || 'N/A'} • Unit {formValues.unitNo || formValues.room || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {formValues.propertyType || 'Executive'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block pt-0.5">
                    {formValues.designation || formValues.department || 'Operations'} • {formValues.company || 'Red Sea Global'}
                  </span>
                </div>
              </div>

              {/* Instant Form Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadWordDocx}
                  disabled={isDownloadingDocx}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Download populated From.docx with exact employee information"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingDocx ? 'Generating...' : 'Download Form (.docx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                  title="Print official Move-In & Move-Out Form"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                  title="Preview official From.docx layout on demand"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToDrafts}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  title="Save record to draft portal"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Save Draft</span>
                </button>
              </div>
            </div>

            {/* Form Fields Summary Grid (Clean & Light) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Building No:</span>
                <strong className="text-slate-900 dark:text-slate-100 truncate block">
                  {formValues.buildingNo || formValues.house || 'N/A'}
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Unit / Room No:</span>
                <strong className="text-blue-700 dark:text-blue-400 truncate block">
                  {formValues.unitNo || formValues.room || 'N/A'}
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Unit Serial No:</span>
                <strong className="text-slate-900 dark:text-slate-100 truncate block">
                  {formValues.unitSerialNo || 'N/A'}
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">National ID / Iqama:</span>
                <strong className="text-slate-900 dark:text-slate-100 truncate block">
                  {formValues.idIqama || 'N/A'}
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Mobile No:</span>
                <strong className="text-slate-900 dark:text-slate-100 truncate block">
                  {formValues.mobile || 'N/A'}
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Check-In / Out:</span>
                <strong className="text-slate-900 dark:text-slate-100 truncate block">
                  {formValues.moveInDate || '8/24/2026'} - {formValues.moveOutDate || '8/26/2026'}
                </strong>
              </div>
            </div>

            {/* Optional Collapsible Field Customizer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditingFields(!isEditingFields)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingFields ? 'Hide Field Customizer' : 'Customize Form Fields Before Downloading (Optional)'}</span>
              </button>

              {isEditingFields && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Building No</label>
                    <input
                      type="text"
                      value={formValues.buildingNo || ''}
                      onChange={(e) => handleFieldChange('buildingNo', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Unit / Room No</label>
                    <input
                      type="text"
                      value={formValues.unitNo || ''}
                      onChange={(e) => handleFieldChange('unitNo', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Resident Name</label>
                    <input
                      type="text"
                      value={formValues.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Employment ID</label>
                    <input
                      type="text"
                      value={formValues.employmentId || ''}
                      onChange={(e) => handleFieldChange('employmentId', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Check In Date</label>
                    <input
                      type="text"
                      value={formValues.moveInDate || ''}
                      onChange={(e) => handleFieldChange('moveInDate', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Check Out Date</label>
                    <input
                      type="text"
                      value={formValues.moveOutDate || ''}
                      onChange={(e) => handleFieldChange('moveOutDate', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">National ID / Iqama</label>
                    <input
                      type="text"
                      value={formValues.idIqama || ''}
                      onChange={(e) => handleFieldChange('idIqama', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Mobile No</label>
                    <input
                      type="text"
                      value={formValues.mobile || ''}
                      onChange={(e) => handleFieldChange('mobile', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 space-y-1.5">
            <User className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No resident selected</p>
            <p className="text-[11px] text-slate-500">
              Filter and click any resident from the table below to generate the official Move-In & Move-Out Form.
            </p>
          </div>
        )}
      </div>

      {/* EXCEL-LIKE MULTI-TIER FILTERING & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Excel-Style Data Filters & Search
            </h3>
            <span className="text-[11px] font-mono text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {filteredResults.length.toLocaleString()} matching
            </span>

            {customCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowOnlyCustom(!showOnlyCustom);
                  setCurrentPage(1);
                }}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
                  showOnlyCustom
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100'
                }`}
                title="Toggle to view only custom-uploaded or manually added employees"
              >
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>⭐ Custom Uploaded ({customCount})</span>
              </button>
            )}

            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Permanent Storage & Sheet Sync Active</span>
            </span>
          </div>

          {/* Reset Filters Action */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* The Filter Grid: Building -> Unit -> Category -> Text Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* 1. Building Filter Dropdown */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Filter Building</span>
            </label>
            <div className="relative">
              <select
                value={selectedBuilding}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Buildings ({buildingOptions.length} bldgs / {rows.length} total)</option>
                {buildingOptions.map((b) => (
                  <option key={`bldg-${b.building}`} value={b.building}>
                    Building {b.building} ({b.count} {b.count === 1 ? 'resident' : 'residents'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Unit Filter Dropdown (Cascading!) */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Filter Unit / Room</span>
            </label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">
                  {selectedBuilding !== 'ALL'
                    ? `All Units in Bldg ${selectedBuilding} (${unitOptions.length} units)`
                    : `All Units (${unitOptions.length} units)`}
                </option>
                {unitOptions.map((u) => (
                  <option key={`unit-${u.unit}`} value={u.unit}>
                    Unit {u.unit} ({u.count} {u.count === 1 ? 'resident' : 'residents'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Category Filter */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>3. Property Type</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Executive">Executive</option>
              <option value="Senior">Senior</option>
              <option value="Junior">Junior</option>
              <option value="Worker">Worker</option>
            </select>
          </div>

          {/* 4. Live Free-text Search Input */}
          <div className="lg:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Search Resident / ID / Phone</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, Iqama, passport, mobile..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <span className="text-slate-400 font-semibold mr-1">Active Filters:</span>

            {selectedBuilding !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                Building: {selectedBuilding}
                <button
                  type="button"
                  onClick={() => handleBuildingChange('ALL')}
                  className="hover:text-blue-950 cursor-pointer ml-1 font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedUnit !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Unit: {selectedUnit}
                <button
                  type="button"
                  onClick={() => setSelectedUnit('ALL')}
                  className="hover:text-emerald-950 cursor-pointer ml-1 font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                Category: {categoryFilter}
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className="hover:text-amber-950 cursor-pointer ml-1 font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-slate-950 cursor-pointer ml-1 font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {newlyAddedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setShowOnlyNewlyAdded(!showOnlyNewlyAdded)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  showOnlyNewlyAdded
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{showOnlyNewlyAdded ? 'Showing Newly Added Only' : `Show Newly Added (${newlyAddedIds.size})`}</span>
                {showOnlyNewlyAdded && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOnlyNewlyAdded(false);
                    }}
                    className="ml-1 hover:text-emerald-200"
                  >
                    ✕
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-blue-600 hover:underline font-semibold ml-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* EXCEL-STYLE INTERACTIVE DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Top Status Bar */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Resident Directory ({filteredResults.length.toLocaleString()} total)</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Click any row to select resident and auto-fill From.docx
            </span>
          </div>

          {/* Page size & pagination info */}
          <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span>
              {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredResults.length)} of {filteredResults.length.toLocaleString()}
            </span>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-slate-800 dark:text-slate-200 px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-slate-800/75 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 select-none">
                <th className="py-2.5 px-3 w-12 text-center">Status</th>
                <th className="py-2.5 px-3">Building</th>
                <th className="py-2.5 px-3">Unit / Room</th>
                <th className="py-2.5 px-3">Resident Name</th>
                <th className="py-2.5 px-3">Emp ID</th>
                <th className="py-2.5 px-3">Property Type</th>
                <th className="py-2.5 px-3">National ID / Iqama</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No residents found matching criteria</p>
                    <p className="text-xs text-slate-500">
                      Try resetting your filters or adjusting the search keyword.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedResults.map((emp, empIdx) => {
                  if (!emp) return null;
                  const isCur = Boolean(
                    selectedRow &&
                    (selectedRow.employmentId === emp.employmentId || selectedRow.id === emp.id)
                  );

                  return (
                    <tr
                      key={`row-${emp.id}-${emp.employmentId}-${empIdx}`}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold text-blue-950 dark:text-blue-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        {isCur ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 block mx-auto" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {emp.buildingNo || emp.house || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {emp.unitNo || emp.room || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px] flex items-center">
                          <span className="truncate">{emp.name || 'N/A'}</span>
                          {newlyAddedIds.has(emp.id) && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-emerald-500 text-white shrink-0 shadow-2xs">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal truncate block">
                          {emp.designation || emp.department || 'Operations'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {emp.employmentId || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {emp.propertyType || 'Executive'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {emp.idIqama || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                        {emp.company || 'Red Sea Global'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {emp.mobile || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEmployee(emp);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isCur
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isCur ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Pagination Bar */}
        {filteredResults.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredResults.length)} of {filteredResults.length.toLocaleString()} residents
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
              >
                Previous
              </button>

              <span className="text-slate-600 dark:text-slate-400 font-bold px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Authentic From.docx Layout Preview (Available On-Demand, zero screen clutter!) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  From.docx Preview: {formValues.name || 'Resident'} (ID: {formValues.employmentId || 'N/A'})
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadWordDocx}
                  disabled={isDownloadingDocx}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .docx</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Preview */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
              <div className="bg-white text-slate-900 border border-slate-300 shadow-lg rounded-xl p-6 sm:p-8 w-full max-w-3xl text-xs font-sans">
                {/* Header with Red Sea Global Logo */}
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div className="max-w-[220px]">
                    <img
                      src={redseaLogo}
                      alt="Red Sea Global Community Management"
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <div className="text-right">
                    <h1 className="text-sm font-black text-slate-900 tracking-tight">
                      Community Management - Move-In & Move-Out Form
                    </h1>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Red Sea Global • Turtle Bay Construction Village (TBCV)
                    </span>
                  </div>
                </div>

                {/* Property Meta Table */}
                <div className="border border-slate-400 mb-4 divide-y divide-slate-400 text-xs">
                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-4 p-2 font-bold bg-slate-50">Property Name:</div>
                    <div className="col-span-8 p-2 font-semibold">TBCV</div>
                  </div>
                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-4 p-2 font-bold bg-slate-50">Unit (Apartment No):</div>
                    <div className="col-span-8 p-2 font-bold text-blue-700 bg-blue-50/40">
                      {formValues.unit ||
                        `${formValues.buildingNo || 'Bldg 01'} - Unit ${formValues.unitNo || '101'}${
                          formValues.unitSerialNo ? ` (${formValues.unitSerialNo})` : ''
                        }`}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-4 p-2 font-bold bg-slate-50">Type of Property:</div>
                    <div className="col-span-8 p-2 flex items-center space-x-4">
                      {(['Executive', 'Senior', 'Junior', 'Worker'] as const).map((t) => {
                        const isChecked = (formValues.propertyType || '').toLowerCase() === t.toLowerCase();
                        return (
                          <label key={t} className="inline-flex items-center space-x-1.5">
                            <span
                              className={`w-3.5 h-3.5 rounded-xs border border-slate-700 flex items-center justify-center text-[9px] font-black ${
                                isChecked ? 'bg-slate-800 text-white' : 'bg-white text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span className={`text-xs ${isChecked ? 'font-black text-slate-900' : 'text-slate-600'}`}>
                              {t}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Check In Date:</div>
                    <div className="col-span-3 p-2 font-bold">{formValues.moveInDate || '8/24/2026'}</div>
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Check Out Date:</div>
                    <div className="col-span-3 p-2 font-bold">{formValues.moveOutDate || '8/26/2026'}</div>
                  </div>
                </div>

                {/* Section 1: Tenant Details */}
                <div className="mb-4 border border-slate-400 divide-y divide-slate-400 text-xs">
                  <div className="bg-slate-100 text-slate-900 px-3 py-1.5 font-bold flex items-center justify-between">
                    <span>1. Tenant Details</span>
                    <span className="text-[10px] text-blue-700 font-medium">Mapped from Management Allocation History.xlsx</span>
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Resident Name:</div>
                    <div className="col-span-5 p-2 font-bold text-slate-900">{formValues.name}</div>
                    <div className="col-span-2 p-2 font-bold bg-slate-50">Employment ID:</div>
                    <div className="col-span-2 p-2 font-bold text-blue-700">{formValues.employmentId}</div>
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Building No.:</div>
                    <div className="col-span-3 p-2 font-bold">{formValues.buildingNo || formValues.house || 'Bldg 01'}</div>
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Unit / Room No:</div>
                    <div className="col-span-3 p-2 font-bold text-blue-700">{formValues.unitNo || formValues.room || '101'}</div>
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Unit Serial Number:</div>
                    <div className="col-span-3 p-2 font-semibold text-amber-800">{formValues.unitSerialNo || 'N/A'}</div>
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Company Name:</div>
                    <div className="col-span-3 p-2">{formValues.company}</div>
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-3 p-2 font-bold bg-slate-50">National ID / Iqama:</div>
                    <div className="col-span-3 p-2 font-bold">{formValues.idIqama || 'N/A'}</div>
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Passport No:</div>
                    <div className="col-span-3 p-2 font-bold">{formValues.passport || 'N/A'}</div>
                  </div>

                  <div className="grid grid-cols-12 divide-x divide-slate-400">
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Mobile (Contact No):</div>
                    <div className="col-span-3 p-2 font-bold text-blue-800">{formValues.mobile}</div>
                    <div className="col-span-3 p-2 font-bold bg-slate-50">Email Address:</div>
                    <div className="col-span-3 p-2 truncate">{formValues.email || 'N/A'}</div>
                  </div>
                </div>

                {/* Section 4: Declaration & Official Signatures */}
                <div className="border border-slate-400 divide-y divide-slate-400 mt-4 text-xs">
                  <div className="bg-slate-100 text-slate-900 px-3 py-1.5 font-bold">
                    <span>2. Tenant Declaration & Handover Sign-off</span>
                  </div>

                  <div className="p-2 text-[10px] text-slate-600 leading-relaxed bg-slate-50">
                    I hereby acknowledge that I have inspected the unit and accepted keys and inventory items in good working condition according to Turtle Bay Construction Village camp regulations.
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-slate-400 min-h-[75px]">
                    <div className="p-2.5 flex flex-col justify-between">
                      <span className="font-bold text-slate-800">Resident / Tenant Signature:</span>
                      <div className="border-t border-slate-300 pt-1 text-[10px] flex justify-between">
                        <span className="font-serif italic font-bold text-blue-900">{formValues.name}</span>
                        <span>Date: {formValues.moveInDate || getTodayDateString()}</span>
                      </div>
                    </div>

                    <div className="p-2.5 flex flex-col justify-between">
                      <span className="font-bold text-slate-800">Community Management Officer:</span>
                      <div className="border-t border-slate-300 pt-1 text-[10px] flex justify-between">
                        <span className="font-serif italic font-bold text-emerald-800">Authorized Officer</span>
                        <span>Date: {formValues.moveInDate || getTodayDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Excel Smart Deduplication Import Report */}
      {importSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                    importSummary.newAdded > 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {importSummary.newAdded > 0 ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Excel Deduplication Report
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono truncate block max-w-xs">
                    {importSummary.fileName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-500 font-semibold block">Total Scanned in File</span>
                <strong className="text-base text-slate-900 dark:text-white font-mono block">
                  {importSummary.totalScanned.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-400">Excel Rows</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">Existing Skipped</span>
                <strong className="text-base text-amber-800 dark:text-amber-300 font-mono block">
                  {importSummary.skippedDuplicates.toLocaleString()}
                </strong>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Already in database</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">New Unique Added</span>
                <strong className="text-base text-emerald-800 dark:text-emerald-300 font-mono block">
                  +{importSummary.newAdded.toLocaleString()}
                </strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Unique Residents</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block">Total Saved in DB</span>
                <strong className="text-base text-blue-800 dark:text-blue-300 font-mono block">
                  {importSummary.newTotal.toLocaleString()}
                </strong>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">All Residents</span>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/80 dark:border-slate-700/60">
              {importSummary.newAdded > 0 ? (
                <p>
                  <strong className="text-emerald-700 dark:text-emerald-400">{importSummary.newAdded} brand-new unique resident(s)</strong> were extracted and permanently saved into your database. All {importSummary.skippedDuplicates.toLocaleString()} existing duplicates were preserved without changes.
                </p>
              ) : (
                <p>
                  All <strong>{importSummary.skippedDuplicates.toLocaleString()} residents</strong> in this Excel file already exist in your database. No duplicates were added, keeping your records 100% clean.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-1">
              {importSummary.newAdded > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOnlyNewlyAdded(true);
                    setImportSummary(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>View {importSummary.newAdded} New Records</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Smart Deduplication Settings Modal */}
      <ExcelImportSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsChanged={(updated) => setImportSettings(updated)}
      />

      {/* MODAL: Pre-Import Preview & Inspection Modal */}
      {previewModalData && (
        <ExcelImportPreviewModal
          isOpen={Boolean(previewModalData)}
          onClose={() => setPreviewModalData(null)}
          result={previewModalData}
          onConfirmSave={handleConfirmSaveFromPreview}
          isSaving={isSavingFromPreview}
        />
      )}

      {/* MODAL: Manual Add Resident / Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onSave={handleSaveSingleEmployee}
      />

      {/* HIDDEN PRINTABLE CONTAINER FOR BROWSER PRINT (WINDOW.PRINT()) */}
      <div id="printable-auto-form" className="hidden print:block print:p-0 print:m-0 text-slate-900 font-sans text-xs">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="max-w-[240px]">
            <img
              src={redseaLogo}
              alt="Red Sea Global Community Management"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="text-right">
            <h1 className="text-sm font-black text-slate-900 tracking-tight">
              Community Management - Move-In & Move-Out Form
            </h1>
            <span className="text-[10px] text-slate-500 font-medium block">
              Red Sea Global • Turtle Bay Construction Village (TBCV)
            </span>
          </div>
        </div>

        {/* Property Meta Table */}
        <div className="border border-slate-900 mb-4 divide-y divide-slate-900">
          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-4 p-2 font-bold bg-slate-50">Property Name:</div>
            <div className="col-span-8 p-2 font-semibold">TBCV</div>
          </div>
          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-4 p-2 font-bold bg-slate-50">Unit (Apartment No):</div>
            <div className="col-span-8 p-2 font-bold text-blue-700">
              {formValues.unit ||
                `${formValues.buildingNo || 'Bldg 01'} - Unit ${formValues.unitNo || '101'}${
                  formValues.unitSerialNo ? ` (${formValues.unitSerialNo})` : ''
                }`}
            </div>
          </div>
          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-4 p-2 font-bold bg-slate-50">Type of Property:</div>
            <div className="col-span-8 p-2 flex items-center space-x-4">
              {(['Executive', 'Senior', 'Junior', 'Worker'] as const).map((t) => {
                const isChecked = (formValues.propertyType || '').toLowerCase() === t.toLowerCase();
                return (
                  <span key={t} className="inline-flex items-center space-x-1">
                    <span className="border border-slate-900 px-1 font-bold text-[9px]">{isChecked ? '✓' : ' '}</span>
                    <span>{t}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-2 font-bold bg-slate-50">Check In Date:</div>
            <div className="col-span-3 p-2 font-bold">{formValues.moveInDate || '8/24/2026'}</div>
            <div className="col-span-3 p-2 font-bold bg-slate-50">Check Out Date:</div>
            <div className="col-span-3 p-2 font-bold">{formValues.moveOutDate || '8/26/2026'}</div>
          </div>
        </div>

        {/* Section 1: Tenant Details */}
        <div className="mb-4 border border-slate-900 divide-y divide-slate-900">
          <div className="bg-slate-100 text-slate-900 px-3 py-1.5 font-bold text-xs flex items-center justify-between">
            <span>1. Tenant Details</span>
            <span className="text-[10px] text-slate-600">Management Allocation Record</span>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-2 font-bold bg-slate-50">Resident Name:</div>
            <div className="col-span-5 p-2 font-bold text-slate-950">{formValues.name}</div>
            <div className="col-span-2 p-2 font-bold bg-slate-50">Employment ID:</div>
            <div className="col-span-2 p-2 font-bold text-blue-700">{formValues.employmentId}</div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-2 font-bold bg-slate-50">Building No.:</div>
            <div className="col-span-3 p-2 font-bold">{formValues.buildingNo || formValues.house || 'Bldg 01'}</div>
            <div className="col-span-3 p-2 font-bold bg-slate-50">Unit / Room No:</div>
            <div className="col-span-3 p-2 font-bold text-blue-700">{formValues.unitNo || formValues.room || '101'}</div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-2 font-bold bg-slate-50">Unit Serial Number:</div>
            <div className="col-span-3 p-2 font-semibold text-amber-800">{formValues.unitSerialNo || 'N/A'}</div>
            <div className="col-span-3 p-2 font-bold bg-slate-50">Company Name:</div>
            <div className="col-span-3 p-2">{formValues.company}</div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-2 font-bold bg-slate-50">National ID / Iqama:</div>
            <div className="col-span-3 p-2 font-bold">{formValues.idIqama || 'N/A'}</div>
            <div className="col-span-3 p-2 font-bold bg-slate-50">Passport No:</div>
            <div className="col-span-3 p-2 font-bold">{formValues.passport || 'N/A'}</div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-slate-900">
            <div className="col-span-3 p-2 font-bold bg-slate-50">Mobile (Contact No):</div>
            <div className="col-span-3 p-2 font-bold text-blue-800">{formValues.mobile}</div>
            <div className="col-span-3 p-2 font-bold bg-slate-50">Email Address:</div>
            <div className="col-span-3 p-2 truncate">{formValues.email || 'N/A'}</div>
          </div>
        </div>

        {/* Section 4: Declaration & Official Signatures */}
        <div className="border border-slate-900 divide-y divide-slate-900 mt-6">
          <div className="bg-slate-100 text-slate-900 px-3 py-1.5 font-bold text-xs">
            <span>2. Tenant Declaration & Handover Sign-off</span>
          </div>

          <div className="p-2.5 text-[10px] text-slate-700 leading-relaxed bg-slate-50">
            I hereby acknowledge that I have inspected the unit and accepted the keys and inventory items in good working condition. I agree to abide by the Turtle Bay Construction Village (TBCV) camp regulations.
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-900 min-h-[90px]">
            <div className="p-3 flex flex-col justify-between">
              <span className="font-bold text-slate-800">Resident / Tenant Signature:</span>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 flex justify-between">
                <span className="font-serif italic font-bold text-blue-900">{formValues.name}</span>
                <span>Date: {formValues.moveInDate || getTodayDateString()}</span>
              </div>
            </div>

            <div className="p-3 flex flex-col justify-between">
              <span className="font-bold text-slate-800">Community Management Officer:</span>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 flex justify-between">
                <span className="font-serif italic font-bold text-emerald-800">Authorized Officer</span>
                <span>Date: {formValues.moveInDate || getTodayDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Red Sea Global • Community Management TBCV</span>
          <span>Doc Ref: TBCV/CM/{new Date().getFullYear()}/{(formValues.employmentId || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

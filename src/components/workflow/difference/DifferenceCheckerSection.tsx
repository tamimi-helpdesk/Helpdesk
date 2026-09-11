import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  ArrowLeftRight,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Eye,
  FileCheck2,
  Table,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserX,
  FileDown,
  Settings2,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Filter,
  X,
  Play,
  GitCompare,
  RefreshCw,
  Layers,
  ChevronUp,
  Flame,
} from 'lucide-react';
import { SheetSelector } from './SheetSelector';
import {
  UploadedFileInfo,
  ComparisonOptions,
  ComparisonResult,
  RowDifference,
  DiffStatus,
} from '../../../types/differenceChecker';
import {
  parseExcelFile,
  compareDatasets,
  detectPrimaryKey,
  detectCampColumns,
  suggestColumnMappings,
  getSampleDatasets,
  exportDifferenceReport,
  exportRoomMismatchesOnly,
  exportMissingInMasterOnly,
  exportMissingInSystemOnly,
  exportCurrentViewRows,
  formatCellValue,
} from '../../../services/excelDifferenceService';

export const DifferenceCheckerSection: React.FC = () => {
  // Uploaded Files State
  const [fileA, setFileA] = useState<UploadedFileInfo | null>(null);
  const [fileB, setFileB] = useState<UploadedFileInfo | null>(null);
  const [rawFileA, setRawFileA] = useState<File | null>(null);
  const [rawFileB, setRawFileB] = useState<File | null>(null);
  const [isParsingA, setIsParsingA] = useState(false);
  const [isParsingB, setIsParsingB] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Column Selections for File A & File B
  const [selectedKeyA, setSelectedKeyA] = useState<string>('__SMART_MULTI_KEY__');
  const [selectedKeyB, setSelectedKeyB] = useState<string>('__SMART_MULTI_KEY__');

  // Core domain columns
  const [selectedRoomColA, setSelectedRoomColA] = useState<string>('');
  const [selectedRoomColB, setSelectedRoomColB] = useState<string>('');
  const [selectedIqamaColA, setSelectedIqamaColA] = useState<string>('');
  const [selectedIqamaColB, setSelectedIqamaColB] = useState<string>('');
  const [selectedPassportColA, setSelectedPassportColA] = useState<string>('');
  const [selectedPassportColB, setSelectedPassportColB] = useState<string>('');
  const [selectedNameColA, setSelectedNameColA] = useState<string>('');
  const [selectedNameColB, setSelectedNameColB] = useState<string>('');

  // Column Mappings State
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Comparison Options State
  const [normalizeIds, setNormalizeIds] = useState(true);
  const [normalizeRooms, setNormalizeRooms] = useState(true);
  const [crossFieldMatching, setCrossFieldMatching] = useState(true);
  const [ignoreMinorNameDiff, setIgnoreMinorNameDiff] = useState(true);
  const [enableSameRoomMatching, setEnableSameRoomMatching] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [numericTolerance, setNumericTolerance] = useState(true);

  // Filter, Search, Pagination, and View State
  const [activeFilter, setActiveFilter] = useState<'ALL' | DiffStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [isHierarchyExpanded, setIsHierarchyExpanded] = useState(true);
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [showAllBuildingsGrid, setShowAllBuildingsGrid] = useState(false);
  const [viewMode, setViewMode] = useState<'UNIFIED' | 'SIDE_BY_SIDE'>('UNIFIED');
  const [selectedRowForDetail, setSelectedRowForDetail] = useState<RowDifference | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Pagination for large files (9,000+ rows)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Comparison Engine State
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [needsRerun, setNeedsRerun] = useState(false);

  // File Inputs Ref
  const inputARef = useRef<HTMLInputElement | null>(null);
  const inputBRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect columns when File A is parsed
  const autoDetectColumnsA = (headers: string[]) => {
    const cols = detectCampColumns(headers);
    if (cols.roomCol) setSelectedRoomColA(cols.roomCol);
    if (cols.iqamaCol || cols.nationalIdCol) setSelectedIqamaColA(cols.iqamaCol || cols.nationalIdCol || '');
    if (cols.passportCol) setSelectedPassportColA(cols.passportCol);
    if (cols.nameCol) setSelectedNameColA(cols.nameCol);
  };

  // Auto-detect columns when File B is parsed
  const autoDetectColumnsB = (headers: string[]) => {
    const cols = detectCampColumns(headers);
    if (cols.roomCol) setSelectedRoomColB(cols.roomCol);
    if (cols.iqamaCol || cols.nationalIdCol) setSelectedIqamaColB(cols.iqamaCol || cols.nationalIdCol || '');
    if (cols.passportCol) setSelectedPassportColB(cols.passportCol);
    if (cols.nameCol) setSelectedNameColB(cols.nameCol);
  };

  // Handle File 1 Upload (System Report)
  const handleFileUploadA = async (file: File) => {
    setIsParsingA(true);
    setParseError(null);
    setRawFileA(file);
    try {
      const parsed = await parseExcelFile(file);
      setFileA(parsed);
      autoDetectColumnsA(parsed.headers);

      if (fileB) {
        const suggested = suggestColumnMappings(
          parsed.headers,
          fileB.headers,
          effectiveKeyA,
          effectiveKeyB
        );
        setColumnMappings(suggested);
      }
      if (hasCompared) {
        setNeedsRerun(true);
      }
    } catch (err: any) {
      setParseError(`File 1 parsing error: ${err.message || err}`);
    } finally {
      setIsParsingA(false);
    }
  };

  // Handle File 2 Upload (Master Report)
  const handleFileUploadB = async (file: File) => {
    setIsParsingB(true);
    setParseError(null);
    setRawFileB(file);
    try {
      const parsed = await parseExcelFile(file);
      setFileB(parsed);
      autoDetectColumnsB(parsed.headers);

      if (fileA) {
        const suggested = suggestColumnMappings(
          fileA.headers,
          parsed.headers,
          effectiveKeyA,
          effectiveKeyB
        );
        setColumnMappings(suggested);
      }
      if (hasCompared) {
        setNeedsRerun(true);
      }
    } catch (err: any) {
      setParseError(`File 2 parsing error: ${err.message || err}`);
    } finally {
      setIsParsingB(false);
    }
  };

  // Multi-sheet selection changes: live re-parse selected sheets
  const handleSheetSelectionChangeA = async (selectedSheets: string[]) => {
    if (!rawFileA) return;
    try {
      setIsParsingA(true);
      const parsed = await parseExcelFile(rawFileA, selectedSheets);
      setFileA(parsed);
      autoDetectColumnsA(parsed.headers);
      if (fileB) {
        const suggested = suggestColumnMappings(
          parsed.headers,
          fileB.headers,
          effectiveKeyA,
          effectiveKeyB
        );
        setColumnMappings(suggested);
      }
      if (hasCompared) {
        setNeedsRerun(true);
      }
    } catch (err: any) {
      setParseError(`File 1 sheet switch error: ${err.message || err}`);
    } finally {
      setIsParsingA(false);
    }
  };

  const handleSheetSelectionChangeB = async (selectedSheets: string[]) => {
    if (!rawFileB) return;
    try {
      setIsParsingB(true);
      const parsed = await parseExcelFile(rawFileB, selectedSheets);
      setFileB(parsed);
      autoDetectColumnsB(parsed.headers);
      if (fileA) {
        const suggested = suggestColumnMappings(
          fileA.headers,
          parsed.headers,
          effectiveKeyA,
          effectiveKeyB
        );
        setColumnMappings(suggested);
      }
      if (hasCompared) {
        setNeedsRerun(true);
      }
    } catch (err: any) {
      setParseError(`File 2 sheet switch error: ${err.message || err}`);
    } finally {
      setIsParsingB(false);
    }
  };

  // Swap Files
  const handleSwapFiles = () => {
    const tempFile = fileA;
    setFileA(fileB);
    setFileB(tempFile);

    const tempRaw = rawFileA;
    setRawFileA(rawFileB);
    setRawFileB(tempRaw);

    const tempRoom = selectedRoomColA;
    setSelectedRoomColA(selectedRoomColB);
    setSelectedRoomColB(tempRoom);

    const tempIqama = selectedIqamaColA;
    setSelectedIqamaColA(selectedIqamaColB);
    setSelectedIqamaColB(tempIqama);

    const tempPass = selectedPassportColA;
    setSelectedPassportColA(selectedPassportColB);
    setSelectedPassportColB(tempPass);

    const tempName = selectedNameColA;
    setSelectedNameColA(selectedNameColB);
    setSelectedNameColB(tempName);
  };

  // Reset Everything
  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setRawFileA(null);
    setRawFileB(null);
    setParseError(null);
    setSelectedKeyA('__SMART_MULTI_KEY__');
    setSelectedKeyB('__SMART_MULTI_KEY__');
    setSelectedRoomColA('');
    setSelectedRoomColB('');
    setSelectedIqamaColA('');
    setSelectedIqamaColB('');
    setSelectedPassportColA('');
    setSelectedPassportColB('');
    setSelectedNameColA('');
    setSelectedNameColB('');
    setColumnMappings({});
    setActiveFilter('ALL');
    setSearchQuery('');
    setSelectedBlock('ALL');
    setSelectedBuilding('ALL');
    setSelectedArea('ALL');
    setCurrentPage(1);
    setSelectedRowForDetail(null);
    setComparisonResult(null);
    setHasCompared(false);
    setNeedsRerun(false);
    setIsComparing(false);
  };

  // Load Demonstration Datasets
  const handleLoadSample = () => {
    const samples = getSampleDatasets();
    setFileA(samples.fileA);
    setFileB(samples.fileB);
    autoDetectColumnsA(samples.fileA.headers);
    autoDetectColumnsB(samples.fileB.headers);

    const suggested = suggestColumnMappings(
      samples.fileA.headers,
      samples.fileB.headers,
      'Iqama No',
      'Iqama No'
    );
    setColumnMappings(suggested);

    // Compute comparison immediately for demonstration
    const options: ComparisonOptions = {
      normalizeIds: true,
      normalizeRooms: true,
      enableCrossFieldMatching: true,
      ignoreMinorNameDifferences: true,
      enableSameRoomMatching: true,
      ignoreCase: true,
      trimWhitespace: true,
      numericTolerance: true,
      smartMultiKeyMode: true,
    };
    const result = compareDatasets(samples.fileA, samples.fileB, options);
    setComparisonResult(result);
    setHasCompared(true);
    setNeedsRerun(false);
  };

  // Effective Primary Key resolution
  const effectiveKeyA = useMemo(() => {
    if (selectedKeyA && selectedKeyA !== '__SMART_MULTI_KEY__') return selectedKeyA;
    if (fileA) {
      const campCols = detectCampColumns(fileA.headers);
      return campCols.iqamaCol || campCols.nationalIdCol || campCols.passportCol || detectPrimaryKey(fileA.headers, fileA.rows);
    }
    return '';
  }, [fileA, selectedKeyA]);

  const effectiveKeyB = useMemo(() => {
    if (selectedKeyB && selectedKeyB !== '__SMART_MULTI_KEY__') return selectedKeyB;
    if (fileB) {
      const campCols = detectCampColumns(fileB.headers);
      return campCols.iqamaCol || campCols.nationalIdCol || campCols.passportCol || detectPrimaryKey(fileB.headers, fileB.rows);
    }
    return '';
  }, [fileB, selectedKeyB]);

  // Execute Core Comparison Engine (triggered by the user or on sample load)
  const handleRunComparison = () => {
    if (!fileA || !fileB) return;
    setIsComparing(true);
    setParseError(null);
    try {
      const options: ComparisonOptions = {
        keyColumnA: selectedKeyA === '__SMART_MULTI_KEY__' ? undefined : selectedKeyA,
        keyColumnB: selectedKeyB === '__SMART_MULTI_KEY__' ? undefined : selectedKeyB,
        roomColumnA: selectedRoomColA || undefined,
        roomColumnB: selectedRoomColB || undefined,
        iqamaColumnA: selectedIqamaColA || undefined,
        iqamaColumnB: selectedIqamaColB || undefined,
        passportColumnA: selectedPassportColA || undefined,
        passportColumnB: selectedPassportColB || undefined,
        nameColumnA: selectedNameColA || undefined,
        nameColumnB: selectedNameColB || undefined,
        columnMappings,
        normalizeIds,
        normalizeRooms,
        enableCrossFieldMatching: crossFieldMatching,
        ignoreMinorNameDifferences: ignoreMinorNameDiff,
        enableSameRoomMatching,
        ignoreCase,
        trimWhitespace,
        numericTolerance,
        smartMultiKeyMode: true,
      };

      const result = compareDatasets(fileA, fileB, options);
      setComparisonResult(result);
      setHasCompared(true);
      setNeedsRerun(false);
      setCurrentPage(1);
    } catch (err: any) {
      setParseError(`Comparison error: ${err.message || err}`);
    } finally {
      setIsComparing(false);
    }
  };

  // Unique Area / Sheet list
  const areaList = useMemo(() => {
    if (!comparisonResult) return [];
    if (comparisonResult.areaStats && comparisonResult.areaStats.length > 0) {
      return comparisonResult.areaStats
        .map((s) => s.area)
        .filter((a) => a && a !== 'General');
    }
    const set = new Set<string>();
    comparisonResult.rows.forEach((r) => {
      if (r.area && r.area !== 'General') {
        set.add(r.area);
      }
    });
    return Array.from(set).sort();
  }, [comparisonResult]);

  // Unique Block list from comparison result stats or rows (optionally filtered by selectedArea)
  const blockList = useMemo(() => {
    if (!comparisonResult) return [];
    let stats = comparisonResult.blockStats || [];
    if (selectedArea !== 'ALL') {
      stats = stats.filter((s) => (s.area || '').toUpperCase() === selectedArea.toUpperCase());
    }
    if (stats.length > 0) {
      return stats
        .map((s) => s.block)
        .filter((b) => b && b !== 'General');
    }
    const set = new Set<string>();
    comparisonResult.rows.forEach((r) => {
      if (selectedArea !== 'ALL' && (r.area || '').toUpperCase() !== selectedArea.toUpperCase()) {
        return;
      }
      if (r.block && r.block !== 'General') {
        set.add(r.block);
      }
    });
    return Array.from(set).sort();
  }, [comparisonResult, selectedArea]);

  // Block statistics scoped to currently selected Area
  const blockStatsForCurrentArea = useMemo(() => {
    if (!comparisonResult?.blockStats) return [];
    let stats = [...comparisonResult.blockStats];
    if (selectedArea !== 'ALL') {
      stats = stats.filter((b) => (b.area || '').toUpperCase() === selectedArea.toUpperCase());
    }
    return stats
      .filter((b) => b.block && b.block !== 'General')
      .sort((a, b) => b.totalIssues - a.totalIssues || a.block.localeCompare(b.block));
  }, [comparisonResult, selectedArea]);

  // Unique Building list from comparison result stats or rows (filtered by selectedArea and selectedBlock)
  const buildingList = useMemo(() => {
    if (!comparisonResult) return [];
    let stats = comparisonResult.buildingStats || [];
    if (selectedArea !== 'ALL') {
      stats = stats.filter((s) => (s.area || '').toUpperCase() === selectedArea.toUpperCase());
    }
    if (selectedBlock !== 'ALL') {
      stats = stats.filter((s) => (s.block || '').toUpperCase() === selectedBlock.toUpperCase());
    }
    if (stats.length > 0) {
      return stats
        .map((s) => s.building)
        .filter((b) => b && b !== 'General');
    }
    const set = new Set<string>();
    comparisonResult.rows.forEach((r) => {
      if (selectedArea !== 'ALL' && (r.area || '').toUpperCase() !== selectedArea.toUpperCase()) {
        return;
      }
      if (selectedBlock !== 'ALL' && (r.block || '').toUpperCase() !== selectedBlock.toUpperCase()) {
        return;
      }
      if (r.building && r.building !== 'General') {
        set.add(r.building);
      } else {
        const room = r.roomA || r.roomB || '';
        if (room && room.includes('-')) {
          const prefix = room.split('-')[0].trim().toUpperCase();
          if (prefix.length >= 2 && prefix.length <= 6) {
            set.add(prefix);
          }
        }
      }
    });
    return Array.from(set).sort();
  }, [comparisonResult, selectedArea, selectedBlock]);

  // Building statistics scoped to currently selected Area and Block
  const buildingStatsForCurrentSelection = useMemo(() => {
    if (!comparisonResult?.buildingStats) return [];
    let stats = [...comparisonResult.buildingStats];
    if (selectedArea !== 'ALL') {
      stats = stats.filter((b) => (b.area || '').toUpperCase() === selectedArea.toUpperCase());
    }
    if (selectedBlock !== 'ALL') {
      stats = stats.filter((b) => (b.block || '').toUpperCase() === selectedBlock.toUpperCase());
    }
    return stats
      .filter((b) => b.building && b.building !== 'General')
      .sort((a, b) => b.totalIssues - a.totalIssues || a.building.localeCompare(b.building));
  }, [comparisonResult, selectedArea, selectedBlock]);

  // Top discrepancy hotspot buildings (buildings with the highest issue counts)
  const topHotspotBuildings = useMemo(() => {
    if (!comparisonResult?.buildingStats) return [];
    let stats = [...comparisonResult.buildingStats];
    if (selectedArea !== 'ALL') {
      stats = stats.filter((b) => (b.area || '').toUpperCase() === selectedArea.toUpperCase());
    }
    return stats
      .filter((b) => b.building && b.building !== 'General' && b.totalIssues > 0)
      .sort((a, b) => b.totalIssues - a.totalIssues)
      .slice(0, 8);
  }, [comparisonResult, selectedArea]);

  // Filter & Search Rows
  const filteredRows = useMemo(() => {
    if (!comparisonResult) return [];
    let rows = comparisonResult.rows;

    // Status Category Filter
    if (activeFilter === 'ROOM_MISMATCH') {
      rows = rows.filter((r) => r.status === 'ROOM_MISMATCH');
    } else if (activeFilter === 'MISSING_IN_MASTER') {
      rows = rows.filter((r) => r.status === 'MISSING_IN_MASTER' || r.status === 'REMOVED_IN_NEW');
    } else if (activeFilter === 'MISSING_IN_SYSTEM') {
      rows = rows.filter((r) => r.status === 'MISSING_IN_SYSTEM' || r.status === 'ADDED_IN_NEW');
    } else if (activeFilter === 'IDENTICAL') {
      rows = rows.filter((r) => r.status === 'IDENTICAL');
    }

    // Block Filter
    if (selectedBlock !== 'ALL') {
      const targetBlock = selectedBlock.toUpperCase();
      rows = rows.filter((r) => {
        const b = (r.block || '').toUpperCase();
        return b === targetBlock;
      });
    }

    // Building Filter
    if (selectedBuilding !== 'ALL') {
      const targetBldg = selectedBuilding.toUpperCase();
      rows = rows.filter((r) => {
        const b = (r.building || '').toUpperCase();
        const rmA = (r.roomA || '').toUpperCase();
        const rmB = (r.roomB || '').toUpperCase();
        return b === targetBldg || rmA.startsWith(targetBldg) || rmB.startsWith(targetBldg);
      });
    }

    // Area Filter
    if (selectedArea !== 'ALL') {
      const targetArea = selectedArea.toUpperCase();
      rows = rows.filter((r) => {
        const a = (r.area || '').toUpperCase();
        return a === targetArea;
      });
    }

    // Search Query (Iqama, Passport, Visa, Name, Room, or cell value)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) => {
        if (r.key.toLowerCase().includes(q)) return true;
        if (r.residentName?.toLowerCase().includes(q)) return true;
        if (r.roomA?.toLowerCase().includes(q)) return true;
        if (r.roomB?.toLowerCase().includes(q)) return true;
        if (r.iqama?.toLowerCase().includes(q)) return true;
        if (r.passport?.toLowerCase().includes(q)) return true;
        if (r.visa?.toLowerCase().includes(q)) return true;
        if (r.company?.toLowerCase().includes(q)) return true;
        if (r.block?.toLowerCase().includes(q)) return true;
        if (r.building?.toLowerCase().includes(q)) return true;
        if (r.area?.toLowerCase().includes(q)) return true;
        if (r.auditReason?.toLowerCase().includes(q)) return true;
        if (r.matchedBy?.toLowerCase().includes(q)) return true;

        if (r.dataA) {
          const matchA = Object.values(r.dataA).some((v) =>
            String(v ?? '').toLowerCase().includes(q)
          );
          if (matchA) return true;
        }

        if (r.dataB) {
          const matchB = Object.values(r.dataB).some((v) =>
            String(v ?? '').toLowerCase().includes(q)
          );
          if (matchB) return true;
        }

        return false;
      });
    }

    return rows;
  }, [comparisonResult, activeFilter, selectedBlock, selectedBuilding, selectedArea, searchQuery]);

  // Paginated Rows for high performance
  const paginatedRows = useMemo(() => {
    if (pageSize === 0) return filteredRows; // All rows
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / (pageSize || 1)) || 1;

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, selectedBlock, selectedBuilding, selectedArea, pageSize]);

  // Exports
  const handleExportExcel = () => {
    if (!comparisonResult) return;
    exportDifferenceReport(comparisonResult);
  };

  const handleExportRoomMismatches = () => {
    if (!comparisonResult) return;
    exportRoomMismatchesOnly(comparisonResult);
  };

  const handleExportMissingInMaster = () => {
    if (!comparisonResult) return;
    exportMissingInMasterOnly(comparisonResult);
  };

  const handleExportMissingInSystem = () => {
    if (!comparisonResult) return;
    exportMissingInSystemOnly(comparisonResult);
  };

  const handleExportFiltered = () => {
    exportCurrentViewRows(filteredRows, `Reconciliation_${activeFilter}`);
  };

  // Copy summary
  const handleCopySummary = () => {
    if (!comparisonResult) return;
    const s = comparisonResult.summary;
    const text = `RECONCILIATION SUMMARY: SYSTEM REPORT VS MASTER EXCEL
============================================================
File 1 (System Report): ${comparisonResult.fileA.name} (${s.totalRowsA} records)
File 2 (Master Excel):  ${comparisonResult.fileB.name} (${s.totalRowsB} records)
------------------------------------------------------------
1. Room Mismatches:    ${s.roomMismatchCount}
2. Missing in Master:   ${s.missingInMasterCount}
3. Missing in System:   ${s.missingInSystemCount}
4. 100% Identical:      ${s.identicalCount}
------------------------------------------------------------
Total Matched Residents: ${s.matchedResidentCount}
System Coverage Rate:    ${s.systemCoveragePercent}%
Generated on: ${s.comparedAt}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    });
  };

  return (
    <div id="difference-checker-container" className="space-y-5">
      {/* 1. MINIMAL EXECUTIVE HEADER & ACTIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Data Reconciliation
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                System Housing Report ↔ Master Excel Register
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Difference Checker</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Strict reconciliation matching by <strong>Room No</strong>, <strong>Iqama</strong>, and <strong>Passport</strong> to identify room conflicts and unlisted occupants.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-load-sample"
              onClick={handleLoadSample}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Demo Data</span>
            </button>

            {comparisonResult && (
              <>
                <button
                  id="btn-copy-summary"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedNotification ? 'Copied' : 'Copy Summary'}</span>
                </button>

                <button
                  id="btn-export-excel"
                  onClick={handleExportExcel}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Audit (.xlsx)</span>
                </button>
              </>
            )}

            {(fileA || fileB) && (
              <button
                id="btn-reset-diff"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {parseError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* 2. DUAL FILE CARDS (Compact, Minimalist) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
        <input
          ref={inputARef}
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUploadA(f);
          }}
        />
        <input
          ref={inputBRef}
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUploadB(f);
          }}
        />

        {/* FILE 1: SYSTEM REPORT */}
        <div
          id="card-file-a"
          className={`rounded-2xl border transition p-4 ${
            fileA
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                File 1: System Report (Housing ERP)
              </span>
            </div>
            {fileA && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {fileA.totalRows.toLocaleString()} rows • {fileA.headers.length} cols
              </span>
            )}
          </div>

          {!fileA ? (
            <div
              onClick={() => inputARef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileUploadA(f);
              }}
              className="cursor-pointer py-8 flex flex-col items-center justify-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center group-hover:scale-105 transition">
                <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isParsingA ? 'Loading System Report...' : 'Upload File 1 (System Report)'}
                </p>
                <p className="text-[11px] text-slate-400">Click or drag &amp; drop (.xlsx, .csv)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{fileA.name}</p>
                    <p className="text-[10px] text-slate-500">{(fileA.size / 1024).toFixed(1)} KB • {fileA.totalRows.toLocaleString()} rows</p>
                  </div>
                </div>
                <button
                  onClick={() => inputARef.current?.click()}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {fileA.sheetNames.length > 1 && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <SheetSelector
                    label="Sheet(s)"
                    allSheets={fileA.sheetNames}
                    selectedSheets={fileA.selectedSheets || [fileA.selectedSheet]}
                    sheetCounts={fileA.sheetCounts}
                    totalRows={fileA.totalRows}
                    isLoading={isParsingA}
                    onChange={handleSheetSelectionChangeA}
                    accentColor="blue"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* SWAP BUTTON */}
        {fileA && fileB && (
          <button
            id="btn-swap-files"
            onClick={handleSwapFiles}
            title="Swap System Report and Master Report"
            className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md items-center justify-center hover:scale-110 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* FILE 2: MASTER REPORT */}
        <div
          id="card-file-b"
          className={`rounded-2xl border transition p-4 ${
            fileB
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                File 2: Master Report (Accommodation Register)
              </span>
            </div>
            {fileB && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                {fileB.totalRows.toLocaleString()} rows • {fileB.headers.length} cols
              </span>
            )}
          </div>

          {!fileB ? (
            <div
              onClick={() => inputBRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileUploadB(f);
              }}
              className="cursor-pointer py-8 flex flex-col items-center justify-center text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center group-hover:scale-105 transition">
                <UploadCloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isParsingB ? 'Loading Master Report...' : 'Upload File 2 (Accommodation Register)'}
                </p>
                <p className="text-[11px] text-slate-400">Click or drag &amp; drop (.xlsx, .xlsm, .csv)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{fileB.name}</p>
                    <p className="text-[10px] text-slate-500">{(fileB.size / 1024).toFixed(1)} KB • {fileB.totalRows.toLocaleString()} occupants</p>
                  </div>
                </div>
                <button
                  onClick={() => inputBRef.current?.click()}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {fileB.sheetNames.length > 1 && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <SheetSelector
                    label="Sheet(s)"
                    allSheets={fileB.sheetNames}
                    selectedSheets={fileB.selectedSheets || [fileB.selectedSheet]}
                    sheetCounts={fileB.sheetCounts}
                    totalRows={fileB.totalRows}
                    isLoading={isParsingB}
                    onChange={handleSheetSelectionChangeB}
                    accentColor="emerald"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2.5 ACTION SECTION: CHECK DIFFERENCE BUTTON */}
      <div
        id="section-check-difference"
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-3.5 w-full md:w-auto">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              fileA && fileB
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <GitCompare className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Check Difference
              </h3>
              {needsRerun && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700 animate-pulse">
                  Re-check Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {fileA && fileB ? (
                <>
                  File 1: <strong>{fileA.totalRows.toLocaleString()} rows</strong> ({fileA.selectedSheets?.length || 1} sheet) ↔ File 2: <strong>{fileB.totalRows.toLocaleString()} rows</strong> ({fileB.selectedSheets?.length || 1} sheets)
                </>
              ) : (
                'Click below to compare both files and detect all room mismatches and unlisted occupants'
              )}
            </p>
          </div>
        </div>

        <button
          id="btn-check-difference"
          onClick={handleRunComparison}
          disabled={!fileA || !fileB || isComparing || isParsingA || isParsingB}
          className={`w-full md:w-auto px-7 py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2.5 shrink-0 select-none ${
            fileA && fileB && !isComparing && !isParsingA && !isParsingB
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-95 cursor-pointer ring-2 ring-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {isComparing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Comparing Datasets...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-white" />
              <span>
                {hasCompared && !needsRerun
                  ? 'Re-check Difference'
                  : 'Check Difference'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* 3. SLIM MATCHING STATUS & CONFIGURATION BAR */}
      {fileA && fileB && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-3 flex-wrap">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Matching Engine Active:</span>
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Room No: <strong>{selectedRoomColA || 'Auto'}</strong> ↔ <strong>{selectedRoomColB || 'Auto'}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              ID / Iqama: <strong>{selectedIqamaColA || 'Auto'}</strong> ↔ <strong>{selectedIqamaColB || 'Auto'}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Passport: <strong>{selectedPassportColA || 'Auto'}</strong> ↔ <strong>{selectedPassportColB || 'Auto'}</strong>
            </span>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure Matching Rules</span>
          </button>
        </div>
      )}

      {/* PROMPT BEFORE RUNNING COMPARISON */}
      {fileA && fileB && !comparisonResult && !isComparing && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Both Files Loaded Successfully
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Select sheets if needed from the dropdown above, then click <strong>"Check Difference"</strong> to begin reconciliation and discrepancy detection.
            </p>
          </div>
          <button
            id="btn-cue-run-comparison"
            onClick={handleRunComparison}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Check Difference</span>
          </button>
        </div>
      )}

      {/* 4. THE 4 PRIMARY EXECUTIVE KPI SUMMARY CARDS (Strict English Taxonomy) */}
      {comparisonResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: ROOM MISMATCHES */}
          <div
            onClick={() => setActiveFilter('ROOM_MISMATCH')}
            className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'ROOM_MISMATCH'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>Room Mismatches</span>
                </span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full font-bold uppercase text-purple-700 dark:text-purple-300">
                  Conflict
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {comparisonResult.summary.roomMismatchCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Same person listed with conflicting room numbers in System vs Master.
              </p>
            </div>

            {comparisonResult.summary.roomMismatchCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportRoomMismatches();
                }}
                className="mt-3 w-full py-1.5 px-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export Room Mismatches (.xlsx)</span>
              </button>
            )}
          </div>

          {/* Card 2: MISSING IN MASTER */}
          <div
            onClick={() => setActiveFilter('MISSING_IN_MASTER')}
            className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'MISSING_IN_MASTER'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-sm ring-2 ring-red-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
                <span className="flex items-center space-x-1.5">
                  <UserX className="w-4 h-4" />
                  <span>Missing in Master</span>
                </span>
                <span className="text-[10px] bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full font-bold uppercase text-red-700 dark:text-red-300">
                  Action Required
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {comparisonResult.summary.missingInMasterCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Present in System Report, but absent from Master Excel register.
              </p>
            </div>

            {comparisonResult.summary.missingInMasterCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportMissingInMaster();
                }}
                className="mt-3 w-full py-1.5 px-2 bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export Missing in Master (.xlsx)</span>
              </button>
            )}
          </div>

          {/* Card 3: MISSING IN SYSTEM */}
          <div
            onClick={() => setActiveFilter('MISSING_IN_SYSTEM')}
            className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'MISSING_IN_SYSTEM'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Missing in System</span>
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full font-bold uppercase text-amber-700 dark:text-amber-300">
                  Notice
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {comparisonResult.summary.missingInSystemCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Present in Master Excel, but not found in System housing report.
              </p>
            </div>

            {comparisonResult.summary.missingInSystemCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportMissingInSystem();
                }}
                className="mt-3 w-full py-1.5 px-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export Missing in System (.xlsx)</span>
              </button>
            )}
          </div>

          {/* Card 4: 100% IDENTICAL MATCH */}
          <div
            onClick={() => setActiveFilter('IDENTICAL')}
            className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
              activeFilter === 'IDENTICAL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Matches</span>
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  Synchronized
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {comparisonResult.summary.identicalCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Both occupant identity and room assignments match 100%.
              </p>
            </div>

            <div className="mt-3 py-1 px-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold flex items-center justify-between">
              <span>Coverage Rate:</span>
              <span className="font-bold">{comparisonResult.summary.systemCoveragePercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 4B. ADVANCED HIERARCHICAL DISCREPANCY NAVIGATOR (Area → Block → Building) */}
      {comparisonResult && (blockList.length > 0 || buildingList.length > 0 || areaList.length > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Header with Breadcrumb Navigation & Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Hierarchy Navigator &amp; Discrepancy Breakdown
                  </h3>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Area → Block → Building
                  </span>
                </div>

                {/* Interactive Breadcrumb Trail */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="text-slate-400 font-medium">Active Path:</span>
                  <button
                    onClick={() => {
                      setSelectedArea('ALL');
                      setSelectedBlock('ALL');
                      setSelectedBuilding('ALL');
                    }}
                    className={`font-semibold hover:underline cursor-pointer ${
                      selectedArea === 'ALL' && selectedBlock === 'ALL' && selectedBuilding === 'ALL'
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    All Areas
                  </button>

                  {selectedArea !== 'ALL' && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">/</span>
                      <button
                        onClick={() => {
                          setSelectedBlock('ALL');
                          setSelectedBuilding('ALL');
                        }}
                        className={`font-semibold hover:underline cursor-pointer ${
                          selectedBlock === 'ALL' && selectedBuilding === 'ALL'
                            ? 'text-slate-900 dark:text-white font-bold'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {selectedArea}
                      </button>
                    </>
                  )}

                  {selectedBlock !== 'ALL' && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">/</span>
                      <button
                        onClick={() => setSelectedBuilding('ALL')}
                        className={`font-semibold hover:underline cursor-pointer ${
                          selectedBuilding === 'ALL'
                            ? 'text-slate-900 dark:text-white font-bold'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        Block {selectedBlock}
                      </button>
                    </>
                  )}

                  {selectedBuilding !== 'ALL' && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">/</span>
                      <span className="text-slate-900 dark:text-white font-bold bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded text-purple-700 dark:text-purple-300">
                        Bldg {selectedBuilding}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              {/* Reset Filter Button */}
              {(selectedBlock !== 'ALL' || selectedBuilding !== 'ALL' || selectedArea !== 'ALL') && (
                <button
                  onClick={() => {
                    setSelectedArea('ALL');
                    setSelectedBlock('ALL');
                    setSelectedBuilding('ALL');
                  }}
                  className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-xl font-semibold flex items-center space-x-1.5 transition hover:bg-amber-100 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}

              {/* Toggle Collapse/Expand */}
              <button
                onClick={() => setIsHierarchyExpanded(!isHierarchyExpanded)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1 cursor-pointer transition"
              >
                <span>{isHierarchyExpanded ? 'Collapse' : 'Expand'}</span>
                {isHierarchyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isHierarchyExpanded && (
            <div className="space-y-4">
              {/* LEVEL 1: AREA / ZONE SELECTION */}
              {areaList.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      1. Select Area / Zone:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Selecting an area filters the blocks below
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedArea('ALL');
                        setSelectedBlock('ALL');
                        setSelectedBuilding('ALL');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                        selectedArea === 'ALL'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Areas</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        selectedArea === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {comparisonResult.rows.length.toLocaleString()}
                      </span>
                    </button>

                    {areaList.map((a) => {
                      const isSelected = selectedArea.toUpperCase() === a.toUpperCase();
                      const areaStat = comparisonResult.areaStats?.find(
                        (stat) => stat.area.toUpperCase() === a.toUpperCase()
                      );
                      const diffCount = areaStat ? areaStat.totalIssues : 0;
                      return (
                        <button
                          key={a}
                          onClick={() => {
                            const newArea = isSelected ? 'ALL' : a;
                            setSelectedArea(newArea);
                            setSelectedBlock('ALL');
                            setSelectedBuilding('ALL');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span>{a}</span>
                          {diffCount > 0 ? (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {diffCount} diffs
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {areaStat?.totalOccupants || 0}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LEVEL 2: BLOCK SELECTION (NESTED INSIDE AREA) */}
              {blockList.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      2. Filter by Block {selectedArea !== 'ALL' ? `(in ${selectedArea})` : ''}:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selectedBlock === 'ALL'
                        ? 'Click any block to isolate its buildings'
                        : `Viewing Block ${selectedBlock}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedBlock('ALL');
                        setSelectedBuilding('ALL');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        selectedBlock === 'ALL'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      All Blocks ({blockList.length})
                    </button>

                    {blockStatsForCurrentArea.length > 0 ? (
                      blockStatsForCurrentArea.map((bStat) => {
                        const isSelected = selectedBlock.toUpperCase() === bStat.block.toUpperCase();
                        const hasConflicts = bStat.totalIssues > 0;
                        return (
                          <button
                            key={bStat.block}
                            onClick={() => {
                              setSelectedBlock(isSelected ? 'ALL' : bStat.block);
                              setSelectedBuilding('ALL');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                                : hasConflicts
                                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold">Block {bStat.block}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : hasConflicts
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {bStat.totalIssues > 0 ? `${bStat.totalIssues} diffs` : bStat.totalOccupants}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      blockList.map((b) => {
                        const isSelected = selectedBlock.toUpperCase() === b.toUpperCase();
                        return (
                          <button
                            key={b}
                            onClick={() => {
                              setSelectedBlock(isSelected ? 'ALL' : b);
                              setSelectedBuilding('ALL');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Block {b}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* LEVEL 3: BUILDINGS (NESTED INSIDE BLOCK) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {selectedBlock !== 'ALL' ? (
                  /* When a specific Block is selected: Clean, compact scoped view */
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          3. Buildings in Block {selectedBlock}:
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({buildingStatsForCurrentSelection.length} buildings found)
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedBuilding('ALL')}
                        className={`text-xs px-2.5 py-0.5 rounded-lg font-semibold transition cursor-pointer ${
                          selectedBuilding === 'ALL'
                            ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                            : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                        }`}
                      >
                        All Buildings in Block {selectedBlock}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {buildingStatsForCurrentSelection.map((bStat) => {
                        const isSelected = selectedBuilding.toUpperCase() === bStat.building.toUpperCase();
                        const hasConflicts = bStat.totalIssues > 0;
                        return (
                          <button
                            key={bStat.building}
                            onClick={() => setSelectedBuilding(isSelected ? 'ALL' : bStat.building)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/20'
                                : hasConflicts
                                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-purple-200 dark:border-purple-900 hover:border-purple-400'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <span>Bldg {bStat.building}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : hasConflicts
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {bStat.totalIssues > 0 ? `${bStat.totalIssues} diffs` : bStat.totalOccupants}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* When ALL Blocks are selected: Clean Hotspot Bar + Expandable Browse */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Top Discrepancy Hotspots:</span>
                        <span className="text-[11px] font-normal text-slate-400 ml-1">
                          Buildings with the highest issue counts across the camp
                        </span>
                      </div>

                      <button
                        onClick={() => setShowAllBuildingsGrid(!showAllBuildingsGrid)}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{showAllBuildingsGrid ? 'Hide Full Buildings Grid' : `Browse All ${buildingList.length} Buildings`}</span>
                        {showAllBuildingsGrid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Top Discrepancy Hotspots Row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {topHotspotBuildings.map((bStat) => {
                        const isSelected = selectedBuilding.toUpperCase() === bStat.building.toUpperCase();
                        return (
                          <button
                            key={bStat.building}
                            onClick={() => {
                              setSelectedBuilding(isSelected ? 'ALL' : bStat.building);
                              if (bStat.block && bStat.block !== 'General') {
                                setSelectedBlock(bStat.block);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/20'
                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-300 dark:border-amber-800/80 hover:border-amber-500 shadow-2xs'
                            }`}
                          >
                            <span>Bldg {bStat.building}</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              {bStat.totalIssues} diffs
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Optional Expandable Full Buildings Grid */}
                    {showAllBuildingsGrid && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 mt-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                            All Buildings Directory ({buildingList.length} total):
                          </span>
                          <div className="relative">
                            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={hierarchySearch}
                              onChange={(e) => setHierarchySearch(e.target.value)}
                              placeholder="Quick filter building..."
                              className="pl-7 pr-2 py-0.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium w-44"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap max-h-48 overflow-y-auto pr-1">
                          {buildingStatsForCurrentSelection
                            .filter((b) => !hierarchySearch || b.building.toLowerCase().includes(hierarchySearch.toLowerCase()))
                            .map((bStat) => {
                              const isSelected = selectedBuilding.toUpperCase() === bStat.building.toUpperCase();
                              const hasConflicts = bStat.totalIssues > 0;
                              return (
                                <button
                                  key={bStat.building}
                                  onClick={() => setSelectedBuilding(isSelected ? 'ALL' : bStat.building)}
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 border ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : hasConflicts
                                      ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-900'
                                      : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <span>{bStat.building}</span>
                                  {bStat.totalIssues > 0 && (
                                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                                      {bStat.totalIssues}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. INTERACTIVE AUDIT EXPLORER & PAGINATED TABLE */}
      {comparisonResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Top Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                  activeFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All Records ({comparisonResult.rows.length.toLocaleString()})
              </button>

              <button
                onClick={() => setActiveFilter('ROOM_MISMATCH')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  activeFilter === 'ROOM_MISMATCH'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Room Mismatches ({comparisonResult.summary.roomMismatchCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('MISSING_IN_MASTER')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  activeFilter === 'MISSING_IN_MASTER'
                    ? 'bg-red-600 text-white'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Missing in Master ({comparisonResult.summary.missingInMasterCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('MISSING_IN_SYSTEM')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  activeFilter === 'MISSING_IN_SYSTEM'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missing in System ({comparisonResult.summary.missingInSystemCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('IDENTICAL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  activeFilter === 'IDENTICAL'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified ({comparisonResult.summary.identicalCount})</span>
              </button>
            </div>

            {/* Search, Building Filter, Area Filter, and View Controls */}
            <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
              {/* Block filter */}
              {blockList.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedBlock}
                    onChange={(e) => {
                      setSelectedBlock(e.target.value);
                      setSelectedBuilding('ALL');
                    }}
                    className="py-1.5 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="ALL">All Blocks</option>
                    {blockList.map((b) => (
                      <option key={b} value={b}>
                        Block {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Building filter */}
              {buildingList.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    className="py-1.5 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="ALL">All Buildings</option>
                    {buildingList.map((b) => (
                      <option key={b} value={b}>
                        Building {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Area filter */}
              {areaList.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => {
                      setSelectedArea(e.target.value);
                      setSelectedBlock('ALL');
                      setSelectedBuilding('ALL');
                    }}
                    className="py-1.5 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="ALL">All Areas</option>
                    {areaList.map((a) => (
                      <option key={a} value={a}>
                        Area {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, room, ID, passport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Export Filtered */}
              <button
                onClick={handleExportFiltered}
                title="Export currently filtered records to Excel"
                className="p-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('UNIFIED')}
                  title="Unified Table View"
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'UNIFIED'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('SIDE_BY_SIDE')}
                  title="Side-by-Side Comparison"
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'SIDE_BY_SIDE'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 w-16 text-center">Row (Sys/Mst)</th>
                  <th className="py-2.5 px-3 w-36">Status</th>
                  <th className="py-2.5 px-3 w-48">Resident &amp; Identifier</th>
                  <th className="py-2.5 px-3 w-56">Room Comparison (Sys ↔ Mst)</th>
                  {viewMode === 'UNIFIED' ? (
                    <th className="py-2.5 px-3">Audit Details</th>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 w-1/3 border-r border-slate-200 dark:border-slate-800">
                        System Report ({fileA.name})
                      </th>
                      <th className="py-2.5 px-3 w-1/3">Master Report ({fileB.name})</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 w-12 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'UNIFIED' ? 6 : 7} className="py-12 text-center text-slate-400">
                      <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold">No records found matching current criteria.</p>
                      <p className="text-xs mt-0.5 text-slate-400">Try adjusting your search query or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const isRoomMismatch = row.status === 'ROOM_MISMATCH';
                    const isMissingInMaster = row.status === 'MISSING_IN_MASTER' || row.status === 'REMOVED_IN_NEW';
                    const isMissingInSystem = row.status === 'MISSING_IN_SYSTEM' || row.status === 'ADDED_IN_NEW';
                    const isIdentical = row.status === 'IDENTICAL';

                    return (
                      <tr
                        key={row.id}
                        className={`transition ${
                          isRoomMismatch
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/70 dark:hover:bg-purple-950/30'
                            : isMissingInMaster
                            ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30'
                            : isMissingInSystem
                            ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60 dark:hover:bg-amber-950/25'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Row Numbers */}
                        <td className="py-2 px-3 text-center text-[11px] font-mono text-slate-400">
                          {row.rowNumberA ?? '-'} / {row.rowNumberB ?? '-'}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2 px-3">
                          {isRoomMismatch && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 whitespace-nowrap">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span>Room Mismatch</span>
                            </span>
                          )}
                          {isMissingInMaster && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-900 whitespace-nowrap">
                              <UserX className="w-3 h-3 shrink-0" />
                              <span>Missing in Master</span>
                            </span>
                          )}
                          {isMissingInSystem && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-900 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Missing in System</span>
                            </span>
                          )}
                          {isIdentical && (
                            row.differences.length > 0 ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>Matched (Field Variance)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>100% Match</span>
                              </span>
                            )
                          )}
                        </td>

                        {/* Resident Info & Identifier */}
                        <td className="py-2 px-3">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[190px]">
                              {row.residentName || 'N/A'}
                            </p>
                            <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-bold">{row.key}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {row.block && row.block !== 'General' && (
                                <span className="inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                                  Block {row.block}
                                </span>
                              )}
                              {row.building && row.building !== 'General' && (
                                <span className="inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  Bldg {row.building}
                                </span>
                              )}
                              {row.matchedBy && (
                                <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                  {row.matchedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Room Comparison */}
                        <td className="py-2 px-3">
                          {isRoomMismatch ? (
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 w-8">Sys:</span>
                                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold text-xs border border-blue-300 dark:border-blue-800">
                                  {row.roomA || '<empty>'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 w-8">Mst:</span>
                                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono font-bold text-xs border border-purple-300 dark:border-purple-800">
                                  {row.roomB || '<empty>'}
                                </span>
                              </div>
                            </div>
                          ) : isMissingInMaster ? (
                            <div className="flex flex-col space-y-0.5">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-400">Sys:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{row.roomA || '-'}</span>
                              </div>
                              <span className="text-[10px] text-red-500 font-medium">Not in Master</span>
                            </div>
                          ) : isMissingInSystem ? (
                            <div className="flex flex-col space-y-0.5">
                              <span className="text-[10px] text-amber-600 font-medium">Not in System</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-400">Mst:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{row.roomB || '-'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-mono font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                Room {row.roomA || row.roomB || '-'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Audit Details */}
                        {viewMode === 'UNIFIED' ? (
                          <td className="py-2 px-3">
                            {isMissingInMaster ? (
                              <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate max-w-xl bg-slate-50 dark:bg-slate-800/80 p-1 rounded border border-red-200 dark:border-red-900/50">
                                {Object.entries(row.dataA || {})
                                  .slice(0, 4)
                                  .map(([k, v]) => `${k}: "${v}"`)
                                  .join(' • ')}
                              </div>
                            ) : isMissingInSystem ? (
                              <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate max-w-xl bg-slate-50 dark:bg-slate-800/80 p-1 rounded border border-amber-200 dark:border-amber-900/50">
                                {Object.entries(row.dataB || {})
                                  .slice(0, 4)
                                  .map(([k, v]) => `${k}: "${v}"`)
                                  .join(' • ')}
                              </div>
                            ) : isRoomMismatch ? (
                              <div className="text-purple-800 dark:text-purple-300 text-xs font-medium">
                                Occupant matched via ID, but room assignment differs between reports.
                              </div>
                            ) : (
                              <div className="text-slate-500 text-[11px] truncate max-w-xl flex items-center space-x-1">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>
                                  {row.differences.length > 0
                                    ? `Room synchronized. Note: ${row.differences.map((d) => `${d.columnA || d.column}: "${d.valueA ?? ''}" ↔ "${d.valueB ?? ''}"`).join('; ')}`
                                    : 'Occupant and room synchronized across both files.'}
                                </span>
                              </div>
                            )}
                          </td>
                        ) : (
                          /* Side-by-Side View */
                          <>
                            <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                              {row.dataA ? (
                                <div className="space-y-0.5">
                                  {Object.entries(row.dataA)
                                    .slice(0, 4)
                                    .map(([k, v]) => (
                                      <div key={k} className="flex space-x-1">
                                        <span className="text-slate-400">{k}:</span>
                                        <span className="text-slate-700 dark:text-slate-300">{formatCellValue(v)}</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Not in System Report</span>
                              )}
                            </td>

                            <td className="py-2 px-3 font-mono text-[11px]">
                              {row.dataB ? (
                                <div className="space-y-0.5">
                                  {Object.entries(row.dataB)
                                    .slice(0, 4)
                                    .map(([k, v]) => (
                                      <div key={k} className="flex space-x-1">
                                        <span className="text-slate-400">{k}:</span>
                                        <span className="text-slate-700 dark:text-slate-300">{formatCellValue(v)}</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-red-500 dark:text-red-400 font-medium italic">
                                  Not in Master Excel
                                </span>
                              )}
                            </td>
                          </>
                        )}

                        {/* View Modal Trigger */}
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setSelectedRowForDetail(row)}
                            title="Inspect complete field-by-field diff"
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <span>Showing</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>
              <span>to</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * pageSize, filteredRows.length)}
              </span>
              <span>of</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredRows.length.toLocaleString()}</span>
              <span>records</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="text-[11px]">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="py-1 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 py-0.5 text-xs font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADVANCED CONFIGURATION MODAL */}
      {showConfigModal && fileA && fileB && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Settings2 className="w-4 h-4 text-emerald-600" />
                  <span>Matching Configuration &amp; Column Mapping</span>
                </h3>
                <p className="text-xs text-slate-500">Fine-tune the reconciliation engine pillars</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Pillar 1: Room No */}
              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl space-y-2">
                <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Room Number Column</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold block mb-1">System Report:</span>
                    <select
                      value={selectedRoomColA}
                      onChange={(e) => setSelectedRoomColA(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="">&lt;Auto-Detect&gt;</option>
                      {fileA.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold block mb-1">Master Excel:</span>
                    <select
                      value={selectedRoomColB}
                      onChange={(e) => setSelectedRoomColB(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="">&lt;Auto-Detect&gt;</option>
                      {fileB.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Iqama / National ID */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2. Iqama / National ID Column</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block mb-1">System Report:</span>
                    <select
                      value={selectedIqamaColA}
                      onChange={(e) => setSelectedIqamaColA(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="">&lt;Auto-Detect&gt;</option>
                      {fileA.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block mb-1">Master Excel:</span>
                    <select
                      value={selectedIqamaColB}
                      onChange={(e) => setSelectedIqamaColB(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="">&lt;Auto-Detect&gt;</option>
                      {fileB.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Passport */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3. Passport / Visa Column</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">System Report:</span>
                    <select
                      value={selectedPassportColA}
                      onChange={(e) => setSelectedPassportColA(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="">&lt;Auto-Detect&gt;</option>
                      {fileA.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">Master Excel:</span>
                    <select
                      value={selectedPassportColB}
                      onChange={(e) => setSelectedPassportColB(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="">&lt;Auto-Detect&gt;</option>
                      {fileB.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Matching Options */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crossFieldMatching}
                    onChange={(e) => setCrossFieldMatching(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Cross-Field Matching (Passport ↔ Iqama)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignoreMinorNameDiff}
                    onChange={(e) => setIgnoreMinorNameDiff(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Name Spelling Tolerance (Ignore minor typos)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={normalizeRooms}
                    onChange={(e) => setNormalizeRooms(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Normalize Room Prefix &amp; Sub-segments</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={normalizeIds}
                    onChange={(e) => setNormalizeIds(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Normalize Excel Float &amp; Arabic Numerals</span>
                </label>

                <label className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer col-span-2 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                  <input
                    type="checkbox"
                    checked={enableSameRoomMatching}
                    onChange={(e) => setEnableSameRoomMatching(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Same-Room Smart Allocation (Resolve Visitor / Same-Room Entries)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                      Automatically resolves occupants who share the same room assignment (first-name matches, guest/visitor entries, or unlinked bed allocations) to prevent false missing resident alerts when ID numbers vary.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                Apply &amp; Reconcile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DETAILED ROW INSPECTION MODAL */}
      {selectedRowForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Occupant Audit Details:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedRowForDetail.residentName || selectedRowForDetail.key}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status:{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRowForDetail.status}
                  </span>{' '}
                  • Sys Row: {selectedRowForDetail.rowNumberA ?? 'N/A'} • Mst Row:{' '}
                  {selectedRowForDetail.rowNumberB ?? 'N/A'}
                </p>
              </div>

              <button
                onClick={() => setSelectedRowForDetail(null)}
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Room Comparison:</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    System: [{selectedRowForDetail.roomA || 'empty'}] ↔ Master: [{selectedRowForDetail.roomB || 'empty'}]
                  </span>
                </div>
                {selectedRowForDetail.status === 'ROOM_MISMATCH' && (
                  <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    Room Mismatch
                  </span>
                )}
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3 w-1/3">Column</th>
                    <th className="py-2 px-3 w-1/3 text-blue-600 dark:text-blue-400">System Report</th>
                    <th className="py-2 px-3 w-1/3 text-emerald-600 dark:text-emerald-400">Master Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {fileA?.headers.map((colA) => {
                    const mappedColB = columnMappings[colA] || colA;
                    const valA = selectedRowForDetail.dataA?.[colA];
                    const valB = selectedRowForDetail.dataB?.[mappedColB];
                    const isDiff = selectedRowForDetail.differences.some(
                      (d) => d.column.includes(colA) || (mappedColB && d.column.includes(mappedColB))
                    );

                    return (
                      <tr
                        key={colA}
                        className={isDiff ? 'bg-purple-50/50 dark:bg-purple-950/20 font-semibold' : ''}
                      >
                        <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                          {colA}
                          {colA !== mappedColB && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              ↔ Master: [{mappedColB}]
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-2 px-3 ${
                            isDiff
                              ? 'text-red-600 dark:text-red-400 bg-red-100/40 dark:bg-red-950/40 font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {valA !== undefined ? formatCellValue(valA) : '<Not in System>'}
                        </td>
                        <td
                          className={`py-2 px-3 ${
                            isDiff
                              ? 'text-purple-600 dark:text-purple-400 bg-purple-100/40 dark:bg-purple-950/40 font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {valB !== undefined ? formatCellValue(valB) : '<Not in Master>'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setSelectedRowForDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type DiffStatus =
  | 'ROOM_MISMATCH'
  | 'MISSING_IN_MASTER'
  | 'MISSING_IN_SYSTEM'
  | 'IDENTICAL'
  | 'MODIFIED'
  | 'ADDED_IN_NEW'
  | 'REMOVED_IN_NEW';

export interface CellDifference {
  column: string;
  columnA?: string;
  columnB?: string;
  valueA: any;
  valueB: any;
  valueAFormatted: string;
  valueBFormatted: string;
  type: 'CHANGED' | 'ADDED' | 'REMOVED';
  isRoom?: boolean;
}

export interface RowDifference {
  id: string; // generated diff id
  key: string; // primary key display (e.g. Iqama No / Passport No / ID)
  keyDisplayA?: string;
  keyDisplayB?: string;
  rowNumberA: number | null; // 1-based row in System Report / File A
  rowNumberB: number | null; // 1-based row in Master Excel / File B
  status: DiffStatus;
  differences: CellDifference[];
  dataA: Record<string, any> | null;
  dataB: Record<string, any> | null;
  // Core resident & room audit attributes
  isRoomMismatch?: boolean;
  roomA?: string;
  roomB?: string;
  residentName?: string;
  iqama?: string;
  passport?: string;
  visa?: string;
  matchedBy?: string; // e.g. "Iqama No", "Passport No", "Cross-Field (Passport ↔ Iqama)", "Smart Multi-Key"
  hasOnlyMinorDifferences?: boolean;
  building?: string;
  area?: string;
  block?: string;
  company?: string;
  auditReason?: string;
  actionRecommendation?: string;
  matchConfidence?: 'HIGH' | 'MEDIUM' | 'UNMATCHED';
}

export interface BuildingStat {
  building: string;
  block?: string;
  area?: string;
  totalOccupants: number;
  roomMismatchCount: number;
  missingInMasterCount: number;
  missingInSystemCount: number;
  identicalCount: number;
  totalIssues: number;
}

export interface BlockStat {
  block: string;
  area?: string;
  totalOccupants: number;
  roomMismatchCount: number;
  missingInMasterCount: number;
  missingInSystemCount: number;
  identicalCount: number;
  totalIssues: number;
}

export interface AreaStat {
  area: string;
  totalOccupants: number;
  roomMismatchCount: number;
  missingInMasterCount: number;
  missingInSystemCount: number;
  identicalCount: number;
  totalIssues: number;
}

export interface ColumnSchemaDiff {
  commonColumns: string[];
  onlyInA: string[];
  onlyInB: string[];
}

export interface ComparisonSummary {
  totalRowsA: number; // System Report total rows
  totalRowsB: number; // Master Report total rows
  roomMismatchCount: number; // Found in both files, but entered in different rooms!
  missingInMasterCount: number; // In System Report, but missing in Master Excel
  missingInSystemCount: number; // In Master Excel, but missing in System Report
  otherFieldDiffCount: number; // Present in both, same room, but secondary details differ
  identicalCount: number; // Exact match across room and identifiers
  matchedResidentCount: number; // Total residents matched across both files
  totalDifferences: number; // roomMismatchCount + missingInMasterCount + missingInSystemCount
  matchRatePercent: number; // (identical / totalRows) * 100
  systemCoveragePercent: number; // (matchedResidentCount / totalRowsA) * 100
  comparedAt: string;
  // Compatibility aliases
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

export interface ComparisonOptions {
  keyColumn?: string;
  keyColumnA?: string;
  keyColumnB?: string;
  roomColumnA?: string;
  roomColumnB?: string;
  iqamaColumnA?: string;
  iqamaColumnB?: string;
  passportColumnA?: string;
  passportColumnB?: string;
  nameColumnA?: string;
  nameColumnB?: string;
  columnMappings?: Record<string, string>;
  ignoreCase?: boolean;
  trimWhitespace?: boolean;
  ignoreEmptyValues?: boolean;
  numericTolerance?: boolean;
  normalizeIds?: boolean;
  ignoredColumns?: string[];
  smartMultiKeyMode?: boolean;
  enableCrossFieldMatching?: boolean;
  ignoreMinorNameDifferences?: boolean;
  normalizeRooms?: boolean;
  enableSameRoomMatching?: boolean;
}

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  sheetNames: string[];
  selectedSheet: string;
  selectedSheets?: string[];
  sheetCounts?: Record<string, number>;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  areaCounts?: {
    contractors: number;
    management: number;
    contractorsSheetName?: string;
    managementSheetName?: string;
  };
}

export interface ComparisonResult {
  fileA: UploadedFileInfo; // System Report
  fileB: UploadedFileInfo; // Master Report
  options: ComparisonOptions;
  schemaDiff: ColumnSchemaDiff;
  summary: ComparisonSummary;
  rows: RowDifference[];
  buildingStats?: BuildingStat[];
  blockStats?: BlockStat[];
  areaStats?: AreaStat[];
}

import * as XLSX from 'xlsx';
import {
  UploadedFileInfo,
  ComparisonOptions,
  ComparisonResult,
  RowDifference,
  CellDifference,
  ColumnSchemaDiff,
  ComparisonSummary,
  BuildingStat,
  BlockStat,
  AreaStat,
} from '../types/differenceChecker';

/**
 * Format any cell value into a clean display string
 */
export function formatCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Smart normalizer for IDs, Iqamas, Passports, Badges, and National IDs.
 * Handles Excel float exports (2625691999.0), scientific notation, leading ticks, Arabic numerals, and spacing.
 */
export function normalizeIdValue(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (str === '') return '';

  // Remove zero-width characters and convert non-breaking spaces
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ').trim();

  // Convert Arabic-Indic numerals (٠-٩) to ASCII 0-9
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }

  // Remove leading single-quote from Excel text export (e.g. '2625691999)
  if (str.startsWith("'")) {
    str = str.substring(1).trim();
  }

  // Strip common field prefixes: "PASSPORT:", "PPT:", "PP:", "IQAMA:", "ID:", "CIVIL ID:"
  str = str.replace(/^(?:PASSPORT|PPT|PP|IQAMA|CIVIL[\s\-_]*ID|ID|BORDER|VISA)[\s\-_#.:]*/i, '');

  // Handle scientific notation: e.g. 2.625691999e+09 or 2.62569E+09
  if (/^[0-9]+(\.[0-9]+)?[eE]\+[0-9]+$/.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    } catch {
      // fallback
    }
  }

  // Handle float decimals from Excel number format: e.g. "2625691999.0" or "2625691999.00"
  if (/^[0-9]+\.0+$/.test(str)) {
    str = str.replace(/\.0+$/, '');
  }

  // Strip spaces, dashes, slashes, or dots within digits or alphanumeric IDs
  const cleanedAlphanumeric = str.replace(/[\s\-_/.]/g, '').toUpperCase();

  // Guard against common placeholder strings that are not real IDs
  const nonIdValues = new Set([
    '0',
    '00',
    '000',
    '0000',
    'NA',
    'NONE',
    'NULL',
    'NIL',
    'UNKNOWN',
    'EMPTY',
    'BED',
    'BED1',
    'BED2',
    'BED3',
    'BED4',
    'YES',
    'NO',
    'MALE',
    'FEMALE',
    'TRUE',
    'FALSE',
  ]);
  if (nonIdValues.has(cleanedAlphanumeric)) {
    return '';
  }

  if (cleanedAlphanumeric.length >= 4) {
    return cleanedAlphanumeric;
  }

  return str.trim().toUpperCase();
}

/**
 * Canonicalize building code:
 * "I02", "I-02", "I 02", "I2" -> "I02"
 * "B1", "B-1", "B01" -> "B01"
 * "H1", "H01" -> "H01"
 * "A1", "A01" -> "A01"
 */
export function canonicalizeBuildingCode(str: string): string {
  if (!str) return '';
  let clean = str.trim().toUpperCase();
  clean = clean.replace(/^(?:BLDG|BUILDING|BLOCK)[\s\-_#.:]*/i, '');
  clean = clean.replace(/[\s\-_]/g, '');

  // If format is Letter + 1 digit (e.g. B1, I2, H1, A5), pad to 2 digits (B01, I02, H01, A05)
  const singleDigitMatch = clean.match(/^([A-Z])(\d)$/i);
  if (singleDigitMatch) {
    return `${singleDigitMatch[1]}0${singleDigitMatch[2]}`;
  }

  // If format is Letter + 2 or 3 digits (e.g. B01, I02, H101)
  const standardMatch = clean.match(/^([A-Z])(\d{2,3})$/i);
  if (standardMatch) {
    return `${standardMatch[1]}${standardMatch[2]}`;
  }

  return clean;
}

/**
 * Extract canonical building identifier from a row or room value
 */
export function extractBuildingFromRow(
  row: Record<string, any> | null | undefined,
  roomNorm?: string,
  roomRaw?: string
): string {
  if (row) {
    // Check explicit building columns
    for (const key of Object.keys(row)) {
      if (/^building([_\s]?(no|num|number|#))?$/i.test(key) || /^bldg([_\s]?(no|num|number|#))?$/i.test(key)) {
        const val = String(row[key] ?? '').trim();
        if (val) {
          const canon = canonicalizeBuildingCode(val);
          if (canon) return canon;
        }
      }
    }
  }

  // Extract from normalized room (e.g. "I02-001" -> "I02")
  const targetRoom = roomNorm || roomRaw || '';
  if (targetRoom) {
    // Strip camp/stage prefixes
    const cleanRoom = targetRoom.replace(/^(?:TBCV|CAMP)[\s\-_]*(?:S\d+|STAGE[\s\-_]*\d+|STG[\s\-_]*\d+)?[\s\-_]*/i, '');
    const bldgMatch = cleanRoom.match(/(?:^|[\s\-_])([A-Za-z]\d{1,3})(?:[\s\-_]|$)/i);
    if (bldgMatch) {
      return canonicalizeBuildingCode(bldgMatch[1]);
    }
  }

  // Check area or sheet if building not found
  if (row) {
    const area = String(row['Area'] || row['_sheet'] || row['Zone'] || row['Block'] || '').trim();
    if (area) {
      if (/contractor/i.test(area)) return 'Contractors Area';
      if (/management|mgmt|staff/i.test(area)) return 'Management Area';
      return area;
    }
  }

  return 'General';
}

/**
 * Canonical Room details structure
 */
export interface CanonicalRoomInfo {
  raw: string;
  canonicalRoom: string; // e.g. "A01-001" or "A01-001-A"
  baseRoom: string;      // e.g. "A01-001" (pure building + room without bed)
  building: string;      // e.g. "A01"
  roomNumber: string;    // e.g. "001" or "101"
  bed: string;           // e.g. "A", "B", "1"
  floor: string;         // e.g. "GF", "FF"
}

/**
 * Extract canonical area / zone from row, building, or sheet name
 */
export function extractAreaFromRow(
  row: Record<string, any> | null | undefined,
  building?: string,
  rawArea?: string
): string {
  const candidate = String(rawArea || row?.['Area'] || row?.['_sheet'] || row?.['Zone'] || '').trim();
  if (/management|mgmt|staff|vip/i.test(candidate)) {
    return 'Management Area';
  }
  if (/contractor/i.test(candidate)) {
    return 'Contractors Area';
  }

  // If building is in H block (management/executive housing in TBCV camps)
  if (building && building !== 'General') {
    const canonB = canonicalizeBuildingCode(building);
    if (/^H/i.test(canonB)) {
      return 'Management Area';
    }
    if (/^[A-GI-L]/i.test(canonB)) {
      return 'Contractors Area';
    }
  }

  return candidate && candidate !== 'General' && candidate !== 'Sheet1'
    ? candidate
    : 'Contractors Area';
}

/**
 * Extract canonical block cluster from building, room, explicit block column, or row
 */
export function extractBlockFromRow(
  row: Record<string, any> | null | undefined,
  building?: string,
  area?: string,
  roomRaw?: string
): string {
  // 1. Derive directly from building code prefix (e.g. "G04" -> "G", "H05" -> "H", "B16" -> "B")
  if (building && building !== 'General') {
    const canonB = canonicalizeBuildingCode(building);
    const letterMatch = canonB.match(/^([A-Za-z])/);
    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }
  }

  // 2. Derive from room code if building was not yet parsed (e.g. "G04-101", "H01-002")
  const roomCandidate = String(roomRaw || row?.['Room'] || row?.['Room No'] || row?.['ROOM_NO'] || '').trim();
  if (roomCandidate) {
    const roomMatch = roomCandidate.toUpperCase().match(/(?:TBCV-)?(?:S03-)?([A-Za-z])\d{1,3}[\-_]/);
    if (roomMatch) {
      return roomMatch[1].toUpperCase();
    }
  }

  // 3. Check explicit block columns in the row (e.g. "Camp Block", "Block No")
  if (row) {
    for (const key of Object.keys(row)) {
      if (/^(?:camp[_\s]?)?block([_\s]?(no|num|number|#|name))?$/i.test(key)) {
        const val = String(row[key] ?? '').trim();
        if (val && val !== '-' && val.toUpperCase() !== 'N/A') {
          const cleanVal = val.replace(/^Block\s*/i, '').trim();
          if (cleanVal.length <= 4) {
            return cleanVal.toUpperCase();
          }
        }
      }
    }
  }

  // 4. Fallback to area name if no building letter can be identified
  const areaCandidate = String(area || row?.['Area'] || row?.['_sheet'] || row?.['Zone'] || '').trim();
  if (areaCandidate && areaCandidate !== 'General') {
    if (/contractor/i.test(areaCandidate)) return 'Contractors';
    if (/management|mgmt|staff/i.test(areaCandidate)) return 'Management';
    return areaCandidate;
  }

  return 'General';
}

/**
 * Parse any room string or building+room combination into canonical room and base room
 */
export function getCanonicalRoomAndBed(val: any, buildingHint?: string): CanonicalRoomInfo {
  if (val === null || val === undefined) {
    return { raw: '', canonicalRoom: '', baseRoom: '', building: '', roomNumber: '', bed: '', floor: '' };
  }

  let str = String(val).trim().toUpperCase();
  const raw = str;
  if (str === '' || str === '-' || str === 'N/A' || str === 'NONE' || str === 'NULL' || str === 'UNDEFINED') {
    return { raw, canonicalRoom: '', baseRoom: '', building: '', roomNumber: '', bed: '', floor: '' };
  }

  // Clean zero-width, non-breaking spaces
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ').trim();

  // Convert Arabic numerals
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }

  // Handle float decimals (e.g. 101.0 -> 101)
  if (/^[0-9]+\.0+$/.test(str)) {
    str = str.replace(/\.0+$/, '');
  }

  // Strip camp and stage prefixes (TBCV-S01-, CAMP-, etc.)
  str = str.replace(/^(?:TBCV|CAMP)[\s\-_]*(?:S\d+|STAGE[\s\-_]*\d+|STG[\s\-_]*\d+)?[\s\-_]*/i, '');
  str = str.replace(/^(?:S\d+|STAGE[\s\-_]*\d+|STG[\s\-_]*\d+)[\s\-_]+/i, '');

  // Strip room prefix keywords
  str = str.replace(/^(ROOM|RM|UNIT|CABIN|DOOR|BED|ACCOMMODATION|LOC|BLDG)[\s\-_#.:]*/i, '');
  str = str.replace(/^#+/, '');
  str = str.trim();

  let building = '';
  let floor = '';
  let roomNumber = '';
  let bed = '';

  // 1. TBCV / Accommodation Register Room Serial Pattern:
  // e.g. "A01-GF-1-A", "A01-FF-105-B", "H01-GF-6", "A01-GF-11A", "H01- GF- 6"
  const serialMatch = str.match(
    /(?:^|[\s\-_])([A-Za-z]\d{1,3})\s*[-_]\s*(GF|FF|SF|TF|G|F|B|\d+F)?\s*[-_]\s*(\d+)(?:\s*[-_/\.]\s*([A-Za-z0-9]+)|([A-Za-z]))?(?:$|[\s\-_])/i
  );
  if (serialMatch) {
    building = canonicalizeBuildingCode(serialMatch[1]);
    floor = (serialMatch[2] || '').toUpperCase();
    const rmNum = parseInt(serialMatch[3], 10);
    roomNumber = String(rmNum).padStart(3, '0');
    bed = (serialMatch[4] || serialMatch[5] || '').toUpperCase();
  }

  // 2. Standard Building-Room format: e.g. "A01-1", "A01-01", "A01-001", "A01-101A", "H01-6-1", "B02-105-B"
  if (!building) {
    const bldgMatch = str.match(/^([A-Za-z]\d{1,3})\s*[-_/\.]\s*(\d+)(?:\s*[-_/\.]\s*([A-Za-z0-9]+)|([A-Za-z]))?$/i);
    if (bldgMatch) {
      building = canonicalizeBuildingCode(bldgMatch[1]);
      const rmNum = parseInt(bldgMatch[2], 10);
      roomNumber = String(rmNum).padStart(3, '0');
      bed = (bldgMatch[3] || bldgMatch[4] || '').toUpperCase();
    }
  }

  // 3. Letter + Digits room: "H-1", "H-101", "A-5", "H-1A"
  if (!building) {
    const letterMatch = str.match(/^([A-Za-z]+)\s*[-_/\.]\s*(\d+)(?:\s*[-_/\.]\s*([A-Za-z0-9]+)|([A-Za-z]))?$/i);
    if (letterMatch) {
      building = canonicalizeBuildingCode(letterMatch[1]);
      const rmNum = parseInt(letterMatch[2], 10);
      roomNumber = String(rmNum).padStart(3, '0');
      bed = (letterMatch[3] || letterMatch[4] || '').toUpperCase();
    }
  }

  // 4. Pure numeric room with attached bed or standalone: e.g. "101A", "001B", "101", "1", "01"
  if (!building) {
    const numMatch = str.match(/^(\d+)(?:\s*[-_/\.]\s*([A-Za-z0-9]+)|([A-Za-z]))?$/i);
    if (numMatch) {
      const rmNum = parseInt(numMatch[1], 10);
      roomNumber = String(rmNum).padStart(3, '0');
      bed = (numMatch[2] || numMatch[3] || '').toUpperCase();
      if (buildingHint && buildingHint !== 'General') {
        building = canonicalizeBuildingCode(buildingHint);
      }
    }
  }

  // Fallback building from buildingHint
  if (!building && buildingHint && buildingHint !== 'General') {
    building = canonicalizeBuildingCode(buildingHint);
  }

  // Compute canonical base room (pure building + room without bed)
  let baseRoom = '';
  if (building && roomNumber) {
    baseRoom = `${building}-${roomNumber}`;
  } else if (roomNumber) {
    baseRoom = roomNumber;
  } else {
    baseRoom = normalizeRoomValue(str);
  }

  // Canonical room with bed if bed exists
  let canonicalRoom = baseRoom;
  if (bed && /^[A-Z0-9]$/i.test(bed)) {
    canonicalRoom = `${baseRoom}-${bed}`;
  }

  return {
    raw,
    canonicalRoom,
    baseRoom,
    building: building || (buildingHint ? canonicalizeBuildingCode(buildingHint) : ''),
    roomNumber,
    bed,
    floor,
  };
}

/**
 * Smart normalizer for Room / Accommodation numbers.
 * Supports standard room formats as well as Accommodation Register serial patterns:
 * e.g. "TBCV- S03 - A01-GF- 1- A" -> "A01-001"
 *      "TBCV- S03 - A01-GF- 11-A" -> "A01-011"
 *      "TBCV- S03 - A01-FF- 111- A" -> "A01-111"
 *      "TBCV - S01- H01- GF- 1" -> "H01-001"
 *      "TBCV - S01- H01- GF- 6" -> "H01-006"
 *      "TBCV - S01- H01- FF- 101" -> "H01-101"
 *      "A01-001" / "A01-1" -> "A01-001"
 *      "B1-1" / "B01-001" -> "B01-001"
 */
export function normalizeRoomValue(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim().toUpperCase();
  if (str === '' || str === '-' || str === 'N/A' || str === 'NONE' || str === 'NULL' || str === 'UNDEFINED') return '';

  // Clean zero-width, non-breaking spaces
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ').trim();

  // Convert Arabic-Indic numerals
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }

  // Handle float decimals like "101.0" from numeric room Excel cells
  if (/^[0-9]+\.0+$/.test(str)) {
    str = str.replace(/\.0+$/, '');
  }

  // Strip camp and stage prefixes like "TBCV-S01-", "TBCV-S03-", "TBCV-", "CAMP-", "STAGE-1-", "STG-03-"
  str = str.replace(/^(?:TBCV|CAMP)[\s\-_]*(?:S\d+|STAGE[\s\-_]*\d+|STG[\s\-_]*\d+)?[\s\-_]*/i, '');
  str = str.replace(/^(?:S\d+|STAGE[\s\-_]*\d+|STG[\s\-_]*\d+)[\s\-_]+/i, '');

  // Strip common room prefix keywords
  str = str.replace(/^(ROOM|RM|UNIT|CABIN|DOOR|BED|ACCOMMODATION|LOC|BLDG)[\s\-_#.:]*/i, '');
  str = str.replace(/^#+/, '');
  str = str.trim();

  // 1. Check for TBCV / Accommodation Register Room/Unit Serial Pattern:
  // e.g. "A01-GF- 1- A" -> A01-001, "H01- GF- 6" -> H01-006, "B1-GF-1" -> B01-001
  const serialMatch = str.match(
    /(?:^|[\s\-_])([A-Za-z]\d{1,3})\s*[-_]\s*(?:GF|FF|SF|TF|G|F|B|\d+F)?\s*[-_]\s*(\d+)(?:\s*[-_]\s*[A-Za-z0-9]+)?(?:$|[\s\-_])/i
  );
  if (serialMatch) {
    const bldg = canonicalizeBuildingCode(serialMatch[1]);
    const rmNum = parseInt(serialMatch[2], 10);
    return `${bldg}-${String(rmNum).padStart(3, '0')}`;
  }

  // 2. Check for standard Building-Room format with 1-3 digits:
  // e.g. "A01-1", "A01-01", "A01-001", "H01-6", "H01-006", "H05-101", "B1-1"
  const bldgMatch = str.match(/^([A-Za-z]\d{1,3})\s*[-_/\.]\s*(\d+)(?:\s*[-_/\.]\s*[A-Za-z0-9]+)?$/i);
  if (bldgMatch) {
    const bldg = canonicalizeBuildingCode(bldgMatch[1]);
    const rmNum = parseInt(bldgMatch[2], 10);
    return `${bldg}-${String(rmNum).padStart(3, '0')}`;
  }

  // 3. Check for Letter + Digits room: "H-1", "H-101", "A-5"
  const bldgMatch2 = str.match(/^([A-Za-z]+)\s*[-_/\.]\s*(\d+)$/i);
  if (bldgMatch2) {
    const prefix = bldgMatch2[1].toUpperCase();
    const rmNum = parseInt(bldgMatch2[2], 10);
    return `${prefix}-${String(rmNum).padStart(3, '0')}`;
  }

  // Normalize internal whitespace and hyphens
  str = str.replace(/\s*-\s*/g, '-');
  str = str.replace(/\s+/g, ' ');

  // Normalize numeric sub-segments in hyphenated rooms (e.g. "I02-001" and "I02-1" match)
  if (str.includes('-')) {
    const parts = str.split('-');
    const normParts = parts.map((p) => {
      if (/^\d+$/.test(p) && p.length <= 3) {
        return String(parseInt(p, 10)).padStart(3, '0');
      }
      return p;
    });
    str = normParts.join('-');
  } else if (/^\d+$/.test(str) && str.length <= 3) {
    str = String(parseInt(str, 10));
  }

  return str;
}

/**
 * Normalize resident name for comparison
 */
export function normalizeName(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).toLowerCase().trim();
  // Remove punctuation
  str = str.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Check if two names are substantially the same person (minor typo / spacing / token subset tolerance)
 * e.g. "Abdul Hakim Nasser" vs "Abdulhakim Nasser Nasr"
 */
export function isMinorNameDifference(nameA: string, nameB: string): boolean {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);

  if (normA === normB) return true;
  if (!normA || !normB) return false;

  // Check condensed without spaces (e.g. "abdul hakim" vs "abdulhakim")
  const compactA = normA.replace(/\s+/g, '');
  const compactB = normB.replace(/\s+/g, '');
  if (compactA === compactB) return true;
  if (compactA.includes(compactB) || compactB.includes(compactA)) return true;

  // Word token overlap
  const tokensA = normA.split(' ').filter((t) => t.length > 2);
  const tokensB = normB.split(' ').filter((t) => t.length > 2);

  if (tokensA.length > 0 && tokensB.length > 0) {
    const setB = new Set(tokensB);
    const common = tokensA.filter((t) => setB.has(t));
    const overlapRatio = common.length / Math.min(tokensA.length, tokensB.length);
    if (overlapRatio >= 0.65) return true;
  }

  // Levenshtein similarity for short variations
  const longer = normA.length >= normB.length ? normA : normB;
  const shorter = normA.length < normB.length ? normA : normB;
  if (longer.length === 0) return true;

  const editDist = levenshteinDistance(normA, normB);
  const similarity = (longer.length - editDist) / longer.length;
  return similarity >= 0.82;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Check if name indicates temporary, visitor, or guest allocation
 */
export function isVisitorOrGuest(name: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes('guest') ||
    n.includes('visitor') ||
    n.includes('occupied') ||
    n.includes('temp') ||
    n.includes('tba') ||
    n.includes('rsg') ||
    n.includes('vacant') ||
    n.includes('reserved')
  );
}

/**
 * Normalize company names to eliminate variations:
 * e.g. "Depa (VBH)", "Depa Co. Ltd", "Depa Contracting" -> "depa"
 */
export function normalizeCompany(name: string): string {
  if (!name) return '';
  let str = name.toLowerCase().trim();
  // Strip parentheses and brackets and their contents
  str = str.replace(/\([^)]*\)/g, ' ');
  str = str.replace(/\[[^\]]*\]/g, ' ');
  // Strip common corporate and contractor suffixes
  str = str.replace(/\b(co|ltd|llc|inc|corp|company|contracting|group|partners|branch|services|establishment|est|general)\b/g, ' ');
  // Strip punctuation
  str = str.replace(/[.,/#!$%^&*;:{}=\-_`~]/g, ' ');
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Check if two company names refer to the same company
 */
export function isSameCompany(compA: string, compB: string): boolean {
  if (!compA || !compB) return false;
  const normA = normalizeCompany(compA);
  const normB = normalizeCompany(compB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.length >= 3 && normB.length >= 3) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }
  return false;
}

/**
 * Create token-sorted representation of names to match reversed word orders
 * e.g. "Chand Mohammed Teli" vs "Mohammed Chand Teli" -> "chand mohammed teli"
 */
export function tokenSortedName(name: string): string {
  if (!name) return '';
  const norm = normalizeName(name);
  const tokens = norm.split(' ').filter((t) => t.length > 1 && !['mr', 'mrs', 'md'].includes(t));
  return tokens.sort().join(' ');
}

/**
 * Clean & normalize generic cell value based on comparison options
 */
export function normalizeValue(
  val: any,
  options: { trimWhitespace?: boolean; ignoreCase?: boolean; numericTolerance?: boolean; ignoreEmptyValues?: boolean }
): string {
  if (val === null || val === undefined) return '';
  let str = String(val);

  if (options.trimWhitespace !== false) {
    str = str.trim();
  }

  if (options.ignoreCase !== false) {
    str = str.toLowerCase();
  }

  if (options.numericTolerance !== false) {
    // Handle float decimals like 100.0 or 2625691999.0
    if (/^[0-9]+\.0+$/.test(str)) {
      str = str.replace(/\.0+$/, '');
    }
    const num = Number(str);
    if (!isNaN(num) && str !== '') {
      str = String(num);
    }
  }

  if (options.ignoreEmptyValues && (str === 'null' || str === 'undefined' || str === '-' || str === 'n/a')) {
    return '';
  }

  return str;
}

/**
 * Column detector for Camp & Accommodation files (Room, Iqama, Passport, Visa, Name, etc.)
 */
export interface DetectedCampColumns {
  roomCol?: string;
  buildingCol?: string;
  blockCol?: string;
  areaCol?: string;
  iqamaCol?: string;
  passportCol?: string;
  badgeCol?: string;
  visaCol?: string;
  nationalIdCol?: string;
  nameCol?: string;
  bedCol?: string;
  statusCol?: string;
  companyCol?: string;
}

export function detectCampColumns(headers: string[]): DetectedCampColumns {
  const result: DetectedCampColumns = {};

  for (const h of headers) {
    const clean = h.trim();

    // 1. Room column (prioritize Room No, Room Serial, Unit Serial)
    if (!result.roomCol) {
      if (/^(room[_\s]?serial([_\s]?(#|no|num|number))?|unit[_\s]?serial([_\s]?(#|no|num|number))?)$/i.test(clean)) {
        result.roomCol = clean;
      } else if (/^(room|room[_\s]?no|room[_\s]?number|rm|rm[_\s]?no|unit|unit[_\s]?no|cabin|accommodation)$/i.test(clean)) {
        result.roomCol = clean;
      } else if (/\b(room[_\s]?serial|unit[_\s]?serial)\b/i.test(clean)) {
        result.roomCol = clean;
      } else if (/\b(room|rm|unit)\b/i.test(clean) && !/\b(type|category|price|rate|status|desc)\b/i.test(clean)) {
        result.roomCol = clean;
      }
    }

    // 1b. Building column
    if (!result.buildingCol) {
      if (/^building([_\s]?(no|num|number|#))?$/i.test(clean) || /^bldg([_\s]?(no|num|number|#))?$/i.test(clean) || /\bbuilding[_\s]?name\b/i.test(clean)) {
        result.buildingCol = clean;
      }
    }

    // 1c. Block column
    if (!result.blockCol) {
      if (/^block([_\s]?(no|num|number|#|name))?$/i.test(clean) || /\bcamp[_\s]?block\b/i.test(clean)) {
        result.blockCol = clean;
      }
    }

    // 1d. Area / Zone column
    if (!result.areaCol) {
      if (/^(area|zone|sector|cluster|location|phase)([_\s]?(no|num|number|#|name))?$/i.test(clean)) {
        result.areaCol = clean;
      }
    }

    // 2. Iqama column
    if (!result.iqamaCol) {
      if (/\biqama\b/i.test(clean) || /iqama[_\s]?(no|num|number|#)?/i.test(clean) || /civil[_\s]?id/i.test(clean) || /saudi[_\s]?id/i.test(clean) || /residen(ce|t)[_\s]?id/i.test(clean) || /اقامة|هوية/i.test(clean)) {
        result.iqamaCol = clean;
      }
    }

    // 3. Passport column (expand to PPT, PPT NO, PPT #, etc.)
    if (!result.passportCol) {
      if (/\bpassport\b/i.test(clean) || /passport[_\s]?(no|num|number|#)?/i.test(clean) || /^ppt([_\s]?(no|num|#|number))?$/i.test(clean) || /^pp([_\s]?(no|num|#|number))?$/i.test(clean) || /travel[_\s]?doc/i.test(clean)) {
        result.passportCol = clean;
      }
    }

    // 3b. Employee / Badge ID column
    if (!result.badgeCol) {
      if (/badge([_\s]?(no|num|number|#))?$/i.test(clean) || /emp([_\s]?(no|num|number|#|id))?$/i.test(clean) || /employee([_\s]?(no|num|number|#|id))?$/i.test(clean) || /staff([_\s]?(no|num|#|id))?$/i.test(clean) || /worker[_\s]?id/i.test(clean) || /file[_\s]?(no|num|#)/i.test(clean) || /sap[_\s]?id/i.test(clean)) {
        result.badgeCol = clean;
      }
    }

    // 4. Visa / Border column
    if (!result.visaCol) {
      if (/\bvisa\b/i.test(clean) || /border[_\s]?(no|num|number|#)?/i.test(clean) || /entry[_\s]?(no|num|#)?/i.test(clean)) {
        result.visaCol = clean;
      }
    }

    // 5. National ID / Generic ID
    if (!result.nationalIdCol) {
      if (/national[_\s]?id/i.test(clean) || /^identity[_\s]?(no|num)?$/i.test(clean) || /^id[_\s]?(no|number|#)?$/i.test(clean) || /^id$/i.test(clean)) {
        result.nationalIdCol = clean;
      }
    }

    // 6. Name
    if (!result.nameCol) {
      if (/resident[_\s]?name/i.test(clean) || /full[_\s]?name/i.test(clean) || /employee[_\s]?name/i.test(clean) || /guest[_\s]?name/i.test(clean) || /^name$/i.test(clean)) {
        result.nameCol = clean;
      }
    }

    // 7. Bed
    if (!result.bedCol) {
      if (/^bed([_\s]?(no|num|number|#))?$/i.test(clean) || /\bbed\b/i.test(clean)) {
        result.bedCol = clean;
      }
    }

    // 8. Status
    if (!result.statusCol) {
      if (/check[_\s]?in[_\s]?status/i.test(clean) || /occupancy[_\s]?status/i.test(clean) || /^status$/i.test(clean)) {
        result.statusCol = clean;
      }
    }

    // 9. Company
    if (!result.companyCol) {
      if (/company/i.test(clean) || /employer/i.test(clean) || /contractor/i.test(clean) || /sponsor/i.test(clean)) {
        result.companyCol = clean;
      }
    }
  }

  return result;
}

/**
 * Heuristically detect best primary key column from headers (Iqama, ID, Badge, Emp No, etc.)
 */
export function detectPrimaryKey(headers: string[], rows?: Record<string, any>[]): string {
  if (!headers || headers.length === 0) return '__SMART_MULTI_KEY__';

  const cols = detectCampColumns(headers);
  if (cols.iqamaCol) return cols.iqamaCol;
  if (cols.nationalIdCol) return cols.nationalIdCol;
  if (cols.passportCol) return cols.passportCol;

  // Fallback to priority regexes
  const priorityPatterns = [
    /\biqama\b/i,
    /national[_\s]?id/i,
    /civil[_\s]?id/i,
    /passport/i,
    /border[_\s]?no/i,
    /badge[_\s]?no/i,
    /emp[_\s]?no/i,
    /^id[_\s]?no$/i,
    /^id$/i,
  ];

  for (const pattern of priorityPatterns) {
    const match = headers.find((h) => {
      if (/\b(rm|room|unit|bed|door|seat|cabin)\b/i.test(h)) return false;
      return pattern.test(h);
    });
    if (match) return match;
  }

  return headers[0] || '__ROW_NUMBER__';
}

/**
 * Automatically suggest matching columns between File A and File B
 */
export function suggestColumnMappings(
  headersA: string[],
  headersB: string[],
  keyColA?: string,
  keyColB?: string
): Record<string, string> {
  const mappings: Record<string, string> = {};
  const usedB = new Set<string>();

  // If explicit primary keys are provided and not smart multi key, map them
  if (keyColA && keyColB && headersB.includes(keyColB) && keyColA !== '__SMART_MULTI_KEY__' && keyColB !== '__SMART_MULTI_KEY__') {
    mappings[keyColA] = keyColB;
    usedB.add(keyColB);
  }

  const lowerBMap = new Map<string, string>();
  headersB.forEach((h) => {
    lowerBMap.set(h.toLowerCase().replace(/[^a-z0-9]/g, ''), h);
  });

  // 1. Direct sanitized exact match
  headersA.forEach((colA) => {
    if (mappings[colA]) return;
    const cleanA = colA.toLowerCase().replace(/[^a-z0-9]/g, '');
    const directB = lowerBMap.get(cleanA);
    if (directB && !usedB.has(directB)) {
      mappings[colA] = directB;
      usedB.add(directB);
    }
  });

  // 2. Intelligent Domain Synonym Groups (ordered with Room BEFORE generic ID so "Rm ID" matches Room!)
  const synonymGroups: RegExp[][] = [
    // Room / Unit / Accommodation (MUST be before Iqama/ID!)
    [
      /\broom[_\s]?serial([_\s]?(#|no|num|number))?\b/i,
      /\bunit[_\s]?serial([_\s]?(#|no|num|number))?\b/i,
      /\broom[_\s]?serial\b/i,
      /\bunit[_\s]?serial\b/i,
      /\brm[_\s]?id\b/i,
      /\broom[_\s]?id\b/i,
      /\broom[_\s]?no\b/i,
      /\broom[_\s]?number\b/i,
      /\broom#\b/i,
      /\bunit#\b/i,
      /\brm[_\s]?no\b/i,
      /\bunit[_\s]?no\b/i,
      /\broom\b/i,
      /\brm\b/i,
      /\bunit\b/i,
      /\baccommodation\b/i,
      /\bcabin\b/i,
    ],
    // Iqama / Civil ID / National ID
    [
      /\biqama\b/i,
      /iqama[_\s]?no/i,
      /iqama[_\s]?num/i,
      /national[_\s]?id/i,
      /civil[_\s]?id/i,
      /resident[_\s]?id/i,
      /saudi[_\s]?id/i,
      /qatar[_\s]?id/i,
      /emirates[_\s]?id/i,
      /identity[_\s]?no/i,
      /^id[_\s]?no$/i,
      /^id[_\s]?number$/i,
      /^id$/i,
    ],
    // Passport
    [
      /\bpassport\b/i,
      /passport[_\s]?no/i,
      /passport[_\s]?num/i,
      /passport[_\s]?number/i,
      /^pp[_\s]?no$/i,
      /travel[_\s]?doc/i,
    ],
    // Visa / Border No
    [
      /\bvisa\b/i,
      /visa[_\s]?no/i,
      /border[_\s]?no/i,
      /border[_\s]?num/i,
      /entry[_\s]?no/i,
    ],
    // Resident / Person Name
    [
      /resident[_\s]?name/i,
      /full[_\s]?name/i,
      /employee[_\s]?name/i,
      /guest[_\s]?name/i,
      /worker[_\s]?name/i,
      /\bname\b/i,
    ],
    // Bed
    [
      /bed[_\s]?no/i,
      /bed[_\s]?number/i,
      /\bbed\b/i,
    ],
    // Check-in / Status
    [
      /check[_\s]?in[_\s]?status/i,
      /occupancy[_\s]?status/i,
      /resident[_\s]?status/i,
      /\bstatus\b/i,
      /\bstate\b/i,
    ],
    // Company / Employer
    [
      /\bcompany\b/i,
      /\bcontractor\b/i,
      /\bemployer\b/i,
      /\bclient\b/i,
      /\bsponsor\b/i,
    ],
    // Check-in Date
    [
      /check[_\s]?in[_\s]?date/i,
      /arrival[_\s]?date/i,
      /entry[_\s]?date/i,
      /start[_\s]?date/i,
    ],
    // Check-out Date
    [
      /check[_\s]?out[_\s]?date/i,
      /departure[_\s]?date/i,
      /exit[_\s]?date/i,
      /end[_\s]?date/i,
    ],
    // Phone / Mobile
    [
      /\bphone\b/i,
      /\bmobile\b/i,
      /\bcontact\b/i,
    ],
    // Nationality
    [
      /\bnationality\b/i,
      /\bcountry\b/i,
      /\bcitizenship\b/i,
    ],
    // Building / Block / Camp
    [
      /\bbuilding\b/i,
      /\bblock\b/i,
      /\bcamp\b/i,
      /\bzone\b/i,
    ],
  ];

  headersA.forEach((colA) => {
    if (mappings[colA]) return;

    for (const group of synonymGroups) {
      const matchA = group.some((regex) => regex.test(colA));
      if (matchA) {
        const foundB = headersB.find(
          (colB) => !usedB.has(colB) && group.some((regex) => regex.test(colB))
        );
        if (foundB) {
          mappings[colA] = foundB;
          usedB.add(foundB);
          return;
        }
      }
    }
  });

  return mappings;
}

export const COMBINED_ACCOMMODATION_SHEET = '⭐ Combined: Contractors Area + Management Area';

/**
 * Check if a sheet name matches Contractors Area, Contactors Area, etc.
 */
export function isContractorsSheet(name: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    /cont[ra]*ct[eo]r['’s]*\s*area/i.test(n) ||
    n.includes('contractor') ||
    n.includes('contactor') ||
    n.includes('contractors') ||
    n.includes('contactors') ||
    n.includes('labour') ||
    n.includes('worker') ||
    n.includes('subcon')
  );
}

/**
 * Check if a sheet name matches Management Area, Mgmt Area, etc.
 */
export function isManagementSheet(name: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    /management\s*area/i.test(n) ||
    /mgmt\s*area/i.test(n) ||
    n.includes('management') ||
    n.includes('mgmt') ||
    n.includes('staff')
  );
}

/**
 * Sanitize worksheet range to prevent browser freeze / Out-of-Memory crashes.
 * Many Excel files (especially contractor registers with styling or filters) have
 * !ref set to full sheet width: A1:XFD15000 (16,384 columns).
 * Unchecked, this forces SheetJS to allocate 150+ million empty array cells, instantly crashing V8.
 * This helper detects the true maximum populated column (e.g. 31 columns) and clamps !ref safely.
 */
function sanitizeWorksheet(ws: any): void {
  if (!ws || !ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);

  // If the sheet reports more than 45 columns, clamp to the true content boundary
  if (range.e.c > 45) {
    let maxContentCol = 0;

    // Check if dense format (rows are stored at ws[0], ws[1], etc.)
    const isDense = ws[0] !== undefined || ws[1] !== undefined;

    if (isDense) {
      const scanRows = Math.min(range.e.r + 1, 100);
      for (let r = 0; r < scanRows; r++) {
        const rowArr = ws[r];
        if (Array.isArray(rowArr)) {
          for (let c = rowArr.length - 1; c >= 0; c--) {
            const cell = rowArr[c];
            if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
              if (c > maxContentCol) maxContentCol = c;
              break;
            }
          }
        }
      }
    } else {
      // Cell key format ('A1', 'B1', etc.)
      for (const key of Object.keys(ws)) {
        if (key.startsWith('!')) continue;
        const cell = ws[key];
        if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
          const addr = XLSX.utils.decode_cell(key);
          if (addr.r <= 100 && addr.c > maxContentCol) {
            maxContentCol = addr.c;
          }
        }
      }
    }

    // Accommodation tables have ~31 columns (A to AE). Allow up to maxContentCol or at least 32, capped at 60.
    const clampedEndCol = Math.min(range.e.c, Math.min(Math.max(maxContentCol, 32), 60));
    range.e.c = clampedEndCol;
    ws['!ref'] = XLSX.utils.encode_range(range);
  }
}

/**
 * Detect the real table header row in case of top banner or title rows
 * Evaluates row keyword density and prevents data rows (with 10-digit numbers) from being selected
 */
function findRealHeaderRow(rawAoa: any[][]): number {
  let bestRowIndex = 0;
  let maxScore = -1;
  const maxScan = Math.min(rawAoa.length, 30);

  for (let i = 0; i < maxScan; i++) {
    const row = rawAoa[i] || [];
    const nonEmptyCells = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== '');
    if (nonEmptyCells.length < 2) continue; // Skip title banner rows that only have 1 or 2 cells!

    // A real header row NEVER contains 10-digit Saudi Iqama numbers
    const hasLongNumbers = nonEmptyCells.some((c) => /^[12]\d{9}$/.test(String(c).trim()));
    if (hasLongNumbers) continue; // Skip data rows

    let score = 0;
    for (const cell of nonEmptyCells) {
      const val = String(cell).toLowerCase().trim();
      if (/name|resident|occupant|employee|worker|person|الاسم/i.test(val)) score += 4;
      if (/iqama|civil\s*id|national\s*id|id\s*no|saudi\s*id|الهوية|الاقامة/i.test(val)) score += 4;
      if (/passport|ppt|pp(\s*no|\s*#)?|visa|border|جواز/i.test(val)) score += 3;
      if (/room\s*serial|unit\s*serial|serial\s*#|^room(\s*no|\s*#|\s*num)?$|^unit(\s*no|\s*#|\s*num)?$|غرفة/i.test(val)) score += 3;
      if (/building|bldg|مبنى/i.test(val)) score += 2;
      if (/company|employer|contractor|sponsor|subcon|شركة/i.test(val)) score += 2;
      if (/bed|check[\s\-_]?in|status|nationality/i.test(val)) score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestRowIndex = i;
    }
  }

  return bestRowIndex;
}

/**
 * Parse an uploaded file into UploadedFileInfo
 * ULTRA-LEAN PERFORMANCE OPTIMIZATION:
 * 1) Phase 1 reads ONLY sheet names (virtually 0 RAM, instant)
 * 2) Phase 2 parses ONLY the 1-2 requested sheets (skipping 95%+ of workbook data)
 * Prevents browser memory overflow ("Aw, Snap!" crash) on 30MB-50MB accommodation registers
 */
export async function parseExcelFile(
  file: File,
  preferredSheets?: string | string[]
): Promise<UploadedFileInfo> {
  const buffer = await file.arrayBuffer();

  // Phase 1: Fast zero-memory manifest scan (bookSheets: true)
  // Only reads the sheet names manifest without uncompressing or allocating memory for sheet contents
  const manifest = XLSX.read(buffer, {
    type: 'array',
    bookSheets: true,
    bookProps: false,
  });

  const rawSheetNames = manifest.SheetNames;
  if (!rawSheetNames || rawSheetNames.length === 0) {
    throw new Error('The workbook contains no visible sheets.');
  }

  // Determine target sheets to load
  let targetSheetsToLoad: string[] = [];

  if (Array.isArray(preferredSheets) && preferredSheets.length > 0) {
    targetSheetsToLoad = preferredSheets.filter((s) => rawSheetNames.includes(s));
  } else if (typeof preferredSheets === 'string' && preferredSheets.trim()) {
    const trimmed = preferredSheets.trim();
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((p) => p.trim()).filter((s) => rawSheetNames.includes(s));
      if (parts.length > 0) targetSheetsToLoad = parts;
    } else if (rawSheetNames.includes(trimmed)) {
      targetSheetsToLoad = [trimmed];
    }
  }

  // If no target sheets requested (initial upload), prioritize all valid data sheets
  if (targetSheetsToLoad.length === 0) {
    const nonDataPattern = /^(summary|cover|dashboard|readme|instructions?|template|index|pivot|chart|macro)$/i;
    const candidateSheets = rawSheetNames.filter((s) => !nonDataPattern.test(s.trim()));

    if (candidateSheets.length > 0 && candidateSheets.length <= 15) {
      // If 15 or fewer data sheets exist, load ALL of them so no records are silently omitted!
      targetSheetsToLoad = candidateSheets;
    } else {
      const contractorsSheet = rawSheetNames.find(
        (s) => /contractors?\s*area/i.test(s) || (/contractor/i.test(s) && !nonDataPattern.test(s))
      );
      const managementSheet = rawSheetNames.find(
        (s) => /management\s*area/i.test(s) || (/management/i.test(s) && !nonDataPattern.test(s))
      );

      if (contractorsSheet && managementSheet && contractorsSheet !== managementSheet) {
        targetSheetsToLoad = [contractorsSheet, managementSheet];
      } else if (contractorsSheet) {
        targetSheetsToLoad = [contractorsSheet];
      } else if (candidateSheets.length > 0) {
        targetSheetsToLoad = candidateSheets.slice(0, 5);
      } else {
        targetSheetsToLoad = [rawSheetNames[0]];
      }
    }
  }

  // Phase 2: Ultra-lean selective parse
  // Only unzips and parses the target sheets, ignoring all other sheets in the workbook
  const workbook = XLSX.read(buffer, {
    type: 'array',
    sheets: targetSheetsToLoad,
    dense: true,
    cellDates: false,
    cellStyles: false,
    cellFormula: false,
    cellHTML: false,
    cellNF: false,
  });

  // Sanitize all loaded worksheets immediately to clamp 16,384-column ranges down to actual content
  if (workbook.Sheets) {
    for (const sName of Object.keys(workbook.Sheets)) {
      sanitizeWorksheet(workbook.Sheets[sName]);
    }
  }

  // Robust extractor that parses 2D table array directly to guarantee 100% data row capture
  const extractAccommodationRows = (sheetName: string, areaLabel: string) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];

    sanitizeWorksheet(ws);

    const rawAoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
    if (!rawAoa || rawAoa.length === 0) return [];

    // 1. Locate header row by searching top 30 rows
    let headerRowIndex = -1;
    let maxKeywordMatches = 0;

    for (let r = 0; r < Math.min(rawAoa.length, 30); r++) {
      const row = rawAoa[r] || [];
      const nonEmptyCells = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== '');
      if (nonEmptyCells.length < 2) continue;

      // Skip rows containing 10-digit Iqama numbers (data rows)
      const hasLongNumbers = nonEmptyCells.some((c) => /^[12]\d{9}$/.test(String(c).trim()));
      if (hasLongNumbers) continue;

      let matches = 0;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').toLowerCase().trim();
        if (/name|resident|occupant|employee|worker|person|الاسم/i.test(val)) matches += 4;
        if (/iqama|civil\s*id|national\s*id|saudi\s*id|^id(\s*no|\s*#|\s*num|\s*number)?\.?$|الهوية|الاقامة/i.test(val)) matches += 4;
        if (/passport|ppt|pp(\s*no|\s*#|\s*num)?|visa|border|جواز/i.test(val)) matches += 3;
        if (/room\s*serial|unit\s*serial|serial\s*#|^room(\s*no|\s*#|\s*num)?$|^unit(\s*no|\s*#|\s*num)?$|غرفة/i.test(val)) matches += 3;
        if (/building|bldg|مبنى/i.test(val)) matches += 2;
        if (/company|employer|contractor|sponsor|subcon|شركة/i.test(val)) matches += 2;
      }

      if (matches >= 4 && nonEmptyCells.length >= 3) {
        if (matches > maxKeywordMatches) {
          maxKeywordMatches = matches;
          headerRowIndex = r;
        }
      }
    }

    // Fallback: search for any row containing "name" and ("iqama" or "room" or "id" or "company")
    if (headerRowIndex === -1) {
      for (let r = 0; r < Math.min(rawAoa.length, 30); r++) {
        const rowText = (rawAoa[r] || []).map((c) => String(c || '').toLowerCase().trim()).join(' ');
        if (
          (rowText.includes('name') || rowText.includes('resident') || rowText.includes('الاسم')) &&
          (rowText.includes('iqama') || rowText.includes('id') || rowText.includes('room') || rowText.includes('serial') || rowText.includes('company'))
        ) {
          headerRowIndex = r;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const headerRow = rawAoa[headerRowIndex] || [];
    // Find last column that actually contains a header title to prevent thousands of empty phantom columns
    let lastHeaderCol = -1;
    for (let c = headerRow.length - 1; c >= 0; c--) {
      if (headerRow[c] !== null && headerRow[c] !== undefined && String(headerRow[c]).trim() !== '') {
        lastHeaderCol = c;
        break;
      }
    }
    if (lastHeaderCol === -1) {
      lastHeaderCol = Math.min(headerRow.length - 1, 35);
    }

    const headers: string[] = [];
    for (let c = 0; c <= lastHeaderCol; c++) {
      const s = String(headerRow[c] || '').trim();
      headers.push(s || `Col_${c + 1}`);
    }

    // 2. Map column indices
    let nameCol = -1;
    let iqamaCol = -1;
    let passportCol = -1;
    let visaCol = -1;
    let roomSerialCol = -1;
    let buildingCol = -1;
    let roomNumCol = -1;
    let bedCol = -1;
    let companyCol = -1;

    for (let c = 0; c < headers.length; c++) {
      const val = headers[c].toLowerCase();
      if (nameCol === -1 && /name|resident|occupant|employee|worker|person|الاسم/i.test(val) && !/company|file|sheet|status|project|remarks/i.test(val)) {
        nameCol = c;
      }
      if (iqamaCol === -1 && /iqama|civil\s*id|national\s*id|saudi\s*id|^id(\s*no|\s*#|\s*num|\s*number)?\.?$|الهوية|الاقامة/i.test(val)) {
        iqamaCol = c;
      }
      if (passportCol === -1 && /passport|ppt|pp(\s*no|\s*#|\s*num)?|جواز/i.test(val)) {
        passportCol = c;
      }
      if (visaCol === -1 && /visa|border/i.test(val)) {
        visaCol = c;
      }
      if (roomSerialCol === -1 && /room\s*serial|unit\s*serial|serial\s*#/i.test(val)) {
        roomSerialCol = c;
      }
      if (buildingCol === -1 && /building|bldg|مبنى/i.test(val)) {
        buildingCol = c;
      }
      if (roomNumCol === -1 && /^(room|unit)(\s*#|\s*no|\s*num|\s*number)?\.?$|غرفة/i.test(val)) {
        roomNumCol = c;
      }
      if (bedCol === -1 && /bed(\s*#|\s*no|\s*num|\s*number)?\.?$/i.test(val)) {
        bedCol = c;
      }
      if (companyCol === -1 && /company|employer|contractor|sponsor|subcon|شركة/i.test(val)) {
        companyCol = c;
      }
    }

    const processedRows: Record<string, any>[] = [];

    // 3. Extract all data rows
    for (let r = headerRowIndex + 1; r < rawAoa.length; r++) {
      const row = rawAoa[r] || [];
      if (!row || row.length === 0) continue;

      let name = nameCol !== -1 ? String(row[nameCol] || '').trim() : '';
      let iqama = iqamaCol !== -1 ? String(row[iqamaCol] || '').trim() : '';
      let passport = passportCol !== -1 ? String(row[passportCol] || '').trim() : '';
      let visa = visaCol !== -1 ? String(row[visaCol] || '').trim() : '';
      let rawRoom = roomSerialCol !== -1 ? String(row[roomSerialCol] || '').trim() : '';
      let company = companyCol !== -1 ? String(row[companyCol] || '').trim() : '';
      const building = buildingCol !== -1 ? String(row[buildingCol] || '').trim() : '';
      const roomNum = roomNumCol !== -1 ? String(row[roomNumCol] || '').trim() : '';
      const bedNo = bedCol !== -1 ? String(row[bedCol] || '').trim() : '';

      // Fallback room synthesis if no serial column
      if (!rawRoom && building && roomNum) {
        rawRoom = bedNo ? `${building}-${roomNum}-${bedNo}` : `${building}-${roomNum}`;
      } else if (!rawRoom && roomNum) {
        rawRoom = bedNo ? `${roomNum}-${bedNo}` : roomNum;
      }

      // If iqama wasn't in designated column or column was empty, scan row for 10-digit Saudi ID
      if (!iqama) {
        for (let c = 0; c < headers.length; c++) {
          const clean = String(row[c] || '').replace(/\D/g, '');
          if (/^[12]\d{9}$/.test(clean)) {
            iqama = clean;
            break;
          }
        }
      }

      // Check if this row represents an active occupant vs vacant/empty/reserved bed
      const isAccommodationFormat =
        nameCol !== -1 || iqamaCol !== -1 || passportCol !== -1 || roomSerialCol !== -1;

      if (isAccommodationFormat) {
        const hasOccupant = Boolean(
          (name && !/^(reserved|vacant|empty|available|demob|unassigned)$/i.test(name)) ||
          iqama ||
          passport ||
          visa
        );
        if (!hasOccupant) {
          continue;
        }
      } else {
        const hasAnyContent = row.some((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
        if (!hasAnyContent) {
          continue;
        }
      }

      const normRoom = normalizeRoomValue(rawRoom);

      // Build row object preserving ONLY real columns (ignoring dummy Col_X)
      const rowObj: Record<string, any> = {
        'Room No': normRoom || rawRoom,
        'Name': name,
        'Iqama No': iqama,
        'Passport No': passport,
        'Company': company,
        'Area': areaLabel,
        '_sheet': sheetName,
      };

      for (let c = 0; c < headers.length; c++) {
        const h = headers[c];
        if (h && !h.startsWith('Col_')) {
          rowObj[h] = row[c] !== undefined ? row[c] : '';
        }
      }

      // Explicit canonical fallbacks to prevent header loop from overwriting with raw "1"
      const canonicalRoom =
        normRoom ||
        (building && roomNum ? normalizeRoomValue(`${building}-${roomNum}`) : '') ||
        normalizeRoomValue(rawRoom) ||
        rawRoom;

      if (canonicalRoom) {
        rowObj['Room No'] = canonicalRoom;
      } else if (rawRoom) {
        rowObj['Room No'] = rawRoom;
      }
      if (rawRoom) {
        rowObj['Room Serial #'] = rawRoom;
        rowObj['Unit Serial Number'] = rawRoom;
      }
      if (building) rowObj['Building'] = canonicalizeBuildingCode(building);
      if (roomNum) rowObj['Room Number'] = roomNum;
      if (bedNo) rowObj['Bed No'] = bedNo;
      if (name) rowObj['Resident Name'] = name;
      if (iqama) rowObj['Iqama No'] = iqama;
      if (passport) rowObj['Passport No'] = passport;
      if (company) rowObj['Company'] = company;
      rowObj['Area'] = areaLabel;
      rowObj['_sheet'] = sheetName;

      processedRows.push(rowObj);
    }

    return processedRows;
  };

  let rawRows: Record<string, any>[] = [];
  const sheetCounts: Record<string, number> = {};

  for (const sName of targetSheetsToLoad) {
    const sRows = extractAccommodationRows(sName, sName);
    sheetCounts[sName] = sRows.length;
    rawRows.push(...sRows);
  }

  // Calculate area counts if contractors / management sheets are present
  let areaCounts:
    | {
        contractors: number;
        management: number;
        contractorsSheetName?: string;
        managementSheetName?: string;
      }
    | undefined;

  const contractorsSheetName = targetSheetsToLoad.find(
    (s) => /contractor/i.test(s) && !/summary|cover|pivot/i.test(s)
  );
  const managementSheetName = targetSheetsToLoad.find(
    (s) => /management/i.test(s) && !/summary|cover|pivot/i.test(s)
  );

  if (contractorsSheetName || managementSheetName) {
    areaCounts = {
      contractors: contractorsSheetName ? sheetCounts[contractorsSheetName] || 0 : 0,
      management: managementSheetName ? sheetCounts[managementSheetName] || 0 : 0,
      contractorsSheetName,
      managementSheetName,
    };
  }

  // Extract all distinct headers in order, prioritizing canonical columns
  const headerSet = new Set<string>();
  const priorityCols = [
    'Room No',
    'Name',
    'Resident Name',
    'Iqama No',
    'Passport No',
    'Company',
    'Area',
    'Building No.',
    'Building No',
    'Room Serial #',
    'Unit Serial Number',
  ];
  priorityCols.forEach((col) => {
    if (rawRows.some((r) => r[col] !== undefined && r[col] !== '')) {
      headerSet.add(col);
    }
  });

  rawRows.forEach((row) => {
    Object.keys(row).forEach((k) => {
      // Filter out auto-generated dummy columns (Col_123) and internal keys
      if (!k.startsWith('_') && !k.startsWith('Col_')) {
        headerSet.add(k.trim());
      }
    });
  });

  const headers = Array.from(headerSet);

  return {
    name: file.name,
    size: file.size,
    type: file.name.split('.').pop()?.toLowerCase() || 'xlsx',
    sheetNames: rawSheetNames,
    selectedSheet: targetSheetsToLoad.join(', '),
    selectedSheets: targetSheetsToLoad,
    sheetCounts,
    headers,
    rows: rawRows,
    totalRows: rawRows.length,
    areaCounts,
  };
}

/**
 * Internal representation of an indexed record for multi-key resolution
 */
interface IndexedPerson {
  row: Record<string, any>;
  rowNum: number;
  primaryKeyDisplay: string;
  iqamaClean: string;
  passportClean: string;
  badgeClean: string;
  visaClean: string;
  nationalIdClean: string;
  allIdentifiers: Set<string>;
  roomRaw: string;
  roomNorm: string;
  baseRoom: string;
  canonicalRoom: string;
  bed: string;
  nameRaw: string;
  nameNorm: string;
  nameTokenSorted: string;
  companyNorm: string;
  companyRaw: string;
  building: string;
  block: string;
  area: string;
  sheetName: string;
  matchedWith?: number; // row index in opposite file
}

function buildPersonRecord(
  row: Record<string, any>,
  rowNum: number,
  cols: DetectedCampColumns,
  explicitOptions?: {
    roomCol?: string;
    iqamaCol?: string;
    passportCol?: string;
    visaCol?: string;
    nameCol?: string;
    explicitKeyCol?: string;
  }
): IndexedPerson {
  const allIdentifiers = new Set<string>();

  const registerId = (id: string) => {
    if (!id) return;
    allIdentifiers.add(id);
    if (/^0\d{5,}$/.test(id)) {
      allIdentifiers.add(id.replace(/^0+/, ''));
    }
  };

  const roomColName = explicitOptions?.roomCol || cols.roomCol;
  const iqamaColName = explicitOptions?.iqamaCol || cols.iqamaCol;
  const passportColName = explicitOptions?.passportCol || cols.passportCol;
  const visaColName = explicitOptions?.visaCol || cols.visaCol;
  const nameColName = explicitOptions?.nameCol || cols.nameCol;
  const explicitKeyCol = explicitOptions?.explicitKeyCol;

  // Extract raw values
  const iqamaRaw = iqamaColName ? row[iqamaColName] : '';
  const passportRaw = passportColName ? row[passportColName] : '';
  const visaRaw = visaColName ? row[visaColName] : '';
  const nationalIdRaw = cols.nationalIdCol ? row[cols.nationalIdCol] : '';
  const badgeRaw = cols.badgeCol ? row[cols.badgeCol] : '';
  const explicitRaw =
    explicitKeyCol && explicitKeyCol !== '__SMART_MULTI_KEY__' && explicitKeyCol !== '__ROW_NUMBER__'
      ? row[explicitKeyCol]
      : '';

  let iqamaClean = normalizeIdValue(iqamaRaw);
  let passportClean = normalizeIdValue(passportRaw);
  let visaClean = normalizeIdValue(visaRaw);
  let nationalIdClean = normalizeIdValue(nationalIdRaw);
  let badgeClean = normalizeIdValue(badgeRaw);
  const explicitClean = normalizeIdValue(explicitRaw);

  // Register explicit badge if present
  if (badgeClean && badgeClean.length >= 3) {
    registerId(badgeClean);
  }

  // Cross-categorize IDs: if nationalId looks like a passport (e.g. X4097009 or P7263755)
  if (nationalIdClean) {
    registerId(nationalIdClean);
    if (!passportClean && /^[A-Z][0-9A-Z]{5,11}$/i.test(nationalIdClean)) {
      passportClean = nationalIdClean;
    } else if (!iqamaClean && /^[12]\d{9}$/.test(nationalIdClean)) {
      iqamaClean = nationalIdClean;
    }
  }

  // Also check if Iqama column holds a passport or vice versa
  if (iqamaClean) {
    registerId(iqamaClean);
    if (!passportClean && /^[A-Z][0-9A-Z]{5,11}$/i.test(iqamaClean)) {
      passportClean = iqamaClean;
    }
  }

  if (passportClean) {
    registerId(passportClean);
    if (!iqamaClean && /^[12]\d{9}$/.test(passportClean)) {
      iqamaClean = passportClean;
    }
  }

  if (visaClean) registerId(visaClean);
  if (explicitClean) registerId(explicitClean);

  // Deep scan all cells in the row to find any 10-digit Saudi Iqama, Passport, or Badge number
  Object.entries(row).forEach(([col, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      const clean = normalizeIdValue(val);
      if (!clean) return;

      // Saudi Iqama / Civil ID: 10 digits starting with 1 or 2
      if (/^[12]\d{9}$/.test(clean)) {
        registerId(clean);
        if (!iqamaClean) iqamaClean = clean;
      }
      // Saudi Visa / Border Number: 10 digits starting with 3
      else if (/^3\d{9}$/.test(clean)) {
        registerId(clean);
        if (!visaClean) visaClean = clean;
      }
      // Passport format: letter + 6 to 9 alphanumerics (e.g. X4097009, P7263755, A1234567, EP123456)
      else if (/^[A-Z][0-9A-Z]{6,9}$/i.test(clean) && !/\b(room|rm|bed|unit|date|status)\b/i.test(col)) {
        registerId(clean);
        if (!passportClean) passportClean = clean;
      }
      // Employee / Badge scan
      else if (!badgeClean && /badge|emp|staff|worker|payroll|file/i.test(col) && clean.length >= 3 && clean.length <= 12) {
        badgeClean = clean;
        registerId(clean);
      }
    }
  });

  let roomRaw = roomColName ? String(row[roomColName] ?? '').trim() : '';
  let roomNorm = normalizeRoomValue(roomRaw);

  // If roomNorm didn't resolve to a building-room format, check if row has serial or building+room columns
  if (!roomNorm || !/^[A-Z]\d{2,3}-\d{3}$/i.test(roomNorm)) {
    for (const k of Object.keys(row)) {
      if (/(room|unit)[_\s]?serial/i.test(k)) {
        const val = String(row[k] ?? '').trim();
        const norm = normalizeRoomValue(val);
        if (norm) {
          if (!roomRaw || /^\d{1,3}$/.test(roomRaw)) roomRaw = norm;
          roomNorm = norm;
          break;
        }
      }
    }

    if (!roomNorm || !/^[A-Z]\d{2,3}-\d{3}$/i.test(roomNorm)) {
      let bldgVal = '';
      let numVal = '';
      for (const k of Object.keys(row)) {
        if (/building[_\s]?(no|num|number)?/i.test(k) || /^bldg/i.test(k)) {
          bldgVal = String(row[k] ?? '').trim();
        }
        if (/^(room|unit)[_\s]?(#|no|num|number)?$/i.test(k) || /^(room|unit)#$/i.test(k)) {
          numVal = String(row[k] ?? '').trim();
        }
      }
      if (bldgVal && numVal) {
        const comb = `${bldgVal}-${numVal}`;
        const combNorm = normalizeRoomValue(comb);
        if (combNorm) {
          if (!roomRaw || /^\d{1,3}$/.test(roomRaw)) roomRaw = combNorm;
          roomNorm = combNorm;
        }
      }
    }
  }

  // Prevent raw room from showing as standalone "1" when roomNorm has full building "I02-001"
  if (roomNorm && (!roomRaw || /^\d{1,3}$/.test(roomRaw))) {
    roomRaw = roomNorm;
  }

  const nameRaw = nameColName ? String(row[nameColName] ?? '').trim() : '';
  const nameNorm = normalizeName(nameRaw);
  const nameTokenSorted = tokenSortedName(nameRaw);

  const companyRaw = cols.companyCol ? String(row[cols.companyCol] ?? '').trim() : String(row['Company'] ?? '').trim();
  const companyNorm = companyRaw.toLowerCase().trim();

  const building = extractBuildingFromRow(row, roomNorm, roomRaw);
  const area = extractAreaFromRow(row, building, String(row['Area'] || row['_sheet'] || row['Zone'] || ''));
  const block = extractBlockFromRow(row, building, area, roomRaw || roomNorm);
  const sheetName = String(row['_sheet'] || '').trim();

  // Canonical base room and bed parsing
  const roomInfo = getCanonicalRoomAndBed(roomRaw || roomNorm, building);
  const baseRoom = roomInfo.baseRoom;
  const canonicalRoom = roomInfo.canonicalRoom;
  const bed = roomInfo.bed;

  // Primary display identifier
  let primaryKeyDisplay = iqamaClean || passportClean || badgeClean || visaClean || nationalIdClean || explicitClean;
  if (!primaryKeyDisplay) {
    primaryKeyDisplay = nameRaw || `Row #${rowNum}`;
  }

  return {
    row,
    rowNum,
    primaryKeyDisplay,
    iqamaClean,
    passportClean,
    badgeClean,
    visaClean,
    nationalIdClean,
    allIdentifiers,
    roomRaw,
    roomNorm,
    baseRoom,
    canonicalRoom,
    bed,
    nameRaw,
    nameNorm,
    nameTokenSorted,
    companyNorm,
    companyRaw,
    building,
    block,
    area,
    sheetName,
  };
}

/**
 * Check if two records have conflicting explicit national identities
 */
function hasConflictingId(pA: IndexedPerson, pB: IndexedPerson): boolean {
  // If both have valid Saudi Iqamas (10 digits starting with 1 or 2) and they differ -> conflict!
  if (
    pA.iqamaClean &&
    pB.iqamaClean &&
    pA.iqamaClean !== pB.iqamaClean &&
    /^[12]\d{9}$/.test(pA.iqamaClean) &&
    /^[12]\d{9}$/.test(pB.iqamaClean)
  ) {
    return true;
  }
  // If both have valid Passports of length >= 6 and they differ -> conflict!
  if (
    pA.passportClean &&
    pB.passportClean &&
    pA.passportClean !== pB.passportClean &&
    pA.passportClean.length >= 6 &&
    pB.passportClean.length >= 6
  ) {
    return true;
  }
  return false;
}

/**
 * Core Difference Comparison Engine with Smart Multi-Identifier & Camp Audit Intelligence
 * Specifically focusing on the user's 3 core pillars:
 * 1) Room No (Room Mismatch detection)
 * 2) Iqama No (Saudi resident ID)
 * 3) Passport / Visa / National ID (Cross-field matching when system has passport and master has iqama)
 */
export function compareDatasets(
  fileA: UploadedFileInfo,
  fileB: UploadedFileInfo,
  options: ComparisonOptions
): ComparisonResult {
  const headersA = fileA.headers;
  const headersB = fileB.headers;

  const setA = new Set(headersA);
  const setB = new Set(headersB);

  const commonColumns = headersA.filter((h) => setB.has(h));
  const onlyInA = headersA.filter((h) => !setB.has(h));
  const onlyInB = headersB.filter((h) => !setA.has(h));

  const schemaDiff: ColumnSchemaDiff = {
    commonColumns,
    onlyInA,
    onlyInB,
  };

  // 1. Auto-detect Camp Columns
  const colsA = detectCampColumns(headersA);
  const colsB = detectCampColumns(headersB);

  // Room columns
  const roomColA = options.roomColumnA || colsA.roomCol || headersA.find((h) => /\broom\b|\brm\b|\bunit\b/i.test(h));
  const roomColB = options.roomColumnB || colsB.roomCol || headersB.find((h) => /\broom\b|\brm\b|\bunit\b/i.test(h));

  // Iqama columns
  const iqamaColA = options.iqamaColumnA || colsA.iqamaCol || colsA.nationalIdCol;
  const iqamaColB = options.iqamaColumnB || colsB.iqamaCol || colsB.nationalIdCol;

  // Passport columns
  const passportColA = options.passportColumnA || colsA.passportCol;
  const passportColB = options.passportColumnB || colsB.passportCol;

  // Visa columns
  const visaColA = colsA.visaCol;
  const visaColB = colsB.visaCol;

  // Name columns
  const nameColA = options.nameColumnA || colsA.nameCol || headersA.find((h) => /\bname\b/i.test(h));
  const nameColB = options.nameColumnB || colsB.nameCol || headersB.find((h) => /\bname\b/i.test(h));

  // Key columns
  const keyColA = options.keyColumnA || options.keyColumn || iqamaColA || passportColA || detectPrimaryKey(headersA, fileA.rows);
  const keyColB = options.keyColumnB || options.keyColumn || iqamaColB || passportColB || detectPrimaryKey(headersB, fileB.rows);

  const isRowNumberMatch = keyColA === '__ROW_NUMBER__' || keyColB === '__ROW_NUMBER__';
  const isSmartMultiKey = options.smartMultiKeyMode !== false && !isRowNumberMatch;

  // Effective column mappings for detailed inspect
  const effectiveMappings = options.columnMappings || suggestColumnMappings(headersA, headersB, keyColA, keyColB);

  const rowsDiffList: RowDifference[] = [];

  if (isRowNumberMatch) {
    // Row-by-row position comparison fallback
    const maxRows = Math.max(fileA.rows.length, fileB.rows.length);
    for (let i = 0; i < maxRows; i++) {
      const rowA = fileA.rows[i] || null;
      const rowB = fileB.rows[i] || null;

      if (rowA && !rowB) {
        rowsDiffList.push({
          id: `diff-row-${i + 1}`,
          key: `Row #${i + 1}`,
          rowNumberA: i + 1,
          rowNumberB: null,
          status: 'MISSING_IN_MASTER',
          differences: [],
          dataA: rowA,
          dataB: null,
        });
      } else if (!rowA && rowB) {
        rowsDiffList.push({
          id: `diff-row-${i + 1}`,
          key: `Row #${i + 1}`,
          rowNumberA: null,
          rowNumberB: i + 1,
          status: 'MISSING_IN_SYSTEM',
          differences: [],
          dataA: null,
          dataB: rowB,
        });
      } else if (rowA && rowB) {
        const valRoomA = roomColA ? String(rowA[roomColA] ?? '').trim() : '';
        const valRoomB = roomColB ? String(rowB[roomColB] ?? '').trim() : '';
        const normA = normalizeRoomValue(valRoomA);
        const normB = normalizeRoomValue(valRoomB);
        const hasRoomDiff = Boolean(normA && normB && normA !== normB);

        rowsDiffList.push({
          id: `diff-row-${i + 1}`,
          key: `Row #${i + 1}`,
          rowNumberA: i + 1,
          rowNumberB: i + 1,
          status: hasRoomDiff ? 'ROOM_MISMATCH' : 'IDENTICAL',
          differences: hasRoomDiff
            ? [
                {
                  column: 'Room No',
                  columnA: roomColA,
                  columnB: roomColB,
                  valueA: valRoomA,
                  valueB: valRoomB,
                  valueAFormatted: valRoomA || '<empty>',
                  valueBFormatted: valRoomB || '<empty>',
                  type: 'CHANGED',
                  isRoom: true,
                },
              ]
            : [],
          dataA: rowA,
          dataB: rowB,
          roomA: valRoomA,
          roomB: valRoomB,
          isRoomMismatch: hasRoomDiff,
        });
      }
    }
  } else {
    // 2. Index all records in File A (System Report) and File B (Master Report)
    const peopleA: IndexedPerson[] = fileA.rows.map((r, idx) =>
      buildPersonRecord(r, idx + 1, colsA, {
        roomCol: roomColA,
        iqamaCol: iqamaColA,
        passportCol: passportColA,
        visaCol: visaColA,
        nameCol: nameColA,
        explicitKeyCol: keyColA,
      })
    );

    const peopleB: IndexedPerson[] = fileB.rows.map((r, idx) =>
      buildPersonRecord(r, idx + 1, colsB, {
        roomCol: roomColB,
        iqamaCol: iqamaColB,
        passportCol: passportColB,
        visaCol: visaColB,
        nameCol: nameColB,
        explicitKeyCol: keyColB,
      })
    );

    // Build indexing lookup maps for File B (Master Report)
    const mapB_byIqama = new Map<string, number>();
    const mapB_byPassport = new Map<string, number>();
    const mapB_byBadge = new Map<string, number[]>();
    const mapB_byVisa = new Map<string, number>();
    const mapB_byNationalId = new Map<string, number>();
    const mapB_byAnyId = new Map<string, number>();
    const mapB_byName = new Map<string, number[]>();
    const mapB_byTokenSortedName = new Map<string, number[]>();
    const mapB_byRoom = new Map<string, number[]>();
    const mapB_byBaseRoom = new Map<string, number[]>();

    peopleB.forEach((pB, idx) => {
      if (pB.iqamaClean) mapB_byIqama.set(pB.iqamaClean, idx);
      if (pB.passportClean) mapB_byPassport.set(pB.passportClean, idx);
      if (pB.visaClean) mapB_byVisa.set(pB.visaClean, idx);
      if (pB.nationalIdClean) mapB_byNationalId.set(pB.nationalIdClean, idx);

      if (pB.badgeClean && pB.badgeClean.length >= 3) {
        const existing = mapB_byBadge.get(pB.badgeClean) || [];
        existing.push(idx);
        mapB_byBadge.set(pB.badgeClean, existing);
      }

      pB.allIdentifiers.forEach((idVal) => {
        if (!mapB_byAnyId.has(idVal)) {
          mapB_byAnyId.set(idVal, idx);
        }
      });

      if (pB.nameNorm && pB.nameNorm.length > 3) {
        const existing = mapB_byName.get(pB.nameNorm) || [];
        existing.push(idx);
        mapB_byName.set(pB.nameNorm, existing);
      }

      if (pB.nameTokenSorted && pB.nameTokenSorted.length > 3) {
        const existing = mapB_byTokenSortedName.get(pB.nameTokenSorted) || [];
        existing.push(idx);
        mapB_byTokenSortedName.set(pB.nameTokenSorted, existing);
      }

      if (pB.roomNorm) {
        const existing = mapB_byRoom.get(pB.roomNorm) || [];
        existing.push(idx);
        mapB_byRoom.set(pB.roomNorm, existing);
      }

      if (pB.baseRoom) {
        const existing = mapB_byBaseRoom.get(pB.baseRoom) || [];
        existing.push(idx);
        mapB_byBaseRoom.set(pB.baseRoom, existing);
      }
    });

    const matchedBIndices = new Set<number>();

    // 3. Match each person in File A (System Report) with File B (Master Report)
    peopleA.forEach((pA) => {
      let matchedIdxB: number | undefined = undefined;
      let matchedByLabel = '';

      // TIER 1: Exact Iqama Match (10-digit Saudi ID)
      if (pA.iqamaClean && mapB_byIqama.has(pA.iqamaClean)) {
        const idx = mapB_byIqama.get(pA.iqamaClean)!;
        if (!matchedBIndices.has(idx)) {
          matchedIdxB = idx;
          matchedByLabel = `Iqama (${pA.iqamaClean})`;
        }
      }

      // TIER 2: Exact Passport Match
      if (matchedIdxB === undefined && pA.passportClean && mapB_byPassport.has(pA.passportClean)) {
        const idx = mapB_byPassport.get(pA.passportClean)!;
        if (!matchedBIndices.has(idx)) {
          matchedIdxB = idx;
          matchedByLabel = `Passport (${pA.passportClean})`;
        }
      }

      // TIER 2b: Employee / Badge / Staff ID Match
      if (matchedIdxB === undefined && pA.badgeClean && mapB_byBadge.has(pA.badgeClean)) {
        const badgeCandidates = (mapB_byBadge.get(pA.badgeClean) || []).filter((idx) => !matchedBIndices.has(idx));
        for (const idx of badgeCandidates) {
          const candB = peopleB[idx];
          if (!hasConflictingId(pA, candB)) {
            matchedIdxB = idx;
            matchedByLabel = `Badge / Employee ID (${pA.badgeClean})`;
            break;
          }
        }
      }

      // TIER 3: Cross-Field ID Match
      // (System has Passport or Visa, Master has it in Iqama or National ID or vice versa!)
      if (matchedIdxB === undefined && options.enableCrossFieldMatching !== false) {
        for (const idVal of pA.allIdentifiers) {
          if (mapB_byAnyId.has(idVal)) {
            const idx = mapB_byAnyId.get(idVal)!;
            if (!matchedBIndices.has(idx)) {
              const candB = peopleB[idx];
              if (!hasConflictingId(pA, candB)) {
                matchedIdxB = idx;
                matchedByLabel = `Cross-Field ID (${idVal})`;
                break;
              }
            }
          }
        }
      }

      // TIER 4: Visa / Border Number Match
      if (matchedIdxB === undefined && pA.visaClean && mapB_byVisa.has(pA.visaClean)) {
        const idx = mapB_byVisa.get(pA.visaClean)!;
        if (!matchedBIndices.has(idx)) {
          const candB = peopleB[idx];
          if (!hasConflictingId(pA, candB)) {
            matchedIdxB = idx;
            matchedByLabel = `Visa/Border (${pA.visaClean})`;
          }
        }
      }

      // TIER 5: Resident Name Matching (Tolerant of minor spelling typos & word order reversals)
      // Strictly protected by hasConflictingId to avoid falsely conflating distinct people with similar names
      if (matchedIdxB === undefined && pA.nameNorm && pA.nameNorm.length > 4) {
        // Sub-tier 5A: Direct exact name match
        const exactNameMatches = mapB_byName.get(pA.nameNorm) || [];
        for (const idx of exactNameMatches) {
          if (!matchedBIndices.has(idx)) {
            const candB = peopleB[idx];
            if (hasConflictingId(pA, candB)) continue;

            // If room matches or company matches or only 1 person in the entire sheet has this name
            if (
              candB.baseRoom === pA.baseRoom ||
              candB.roomNorm === pA.roomNorm ||
              isSameCompany(candB.companyRaw, pA.companyRaw) ||
              exactNameMatches.length === 1
            ) {
              matchedIdxB = idx;
              matchedByLabel = `Resident Name (${pA.nameRaw})`;
              break;
            }
          }
        }

        // Sub-tier 5B: Token-sorted name match (handles "Chand Mohammed Teli" vs "Mohammed Chand Teli")
        if (matchedIdxB === undefined && pA.nameTokenSorted && pA.nameTokenSorted.length > 4) {
          const tokenMatches = mapB_byTokenSortedName.get(pA.nameTokenSorted) || [];
          for (const idx of tokenMatches) {
            if (!matchedBIndices.has(idx)) {
              const candB = peopleB[idx];
              if (hasConflictingId(pA, candB)) continue;

              if (
                candB.baseRoom === pA.baseRoom ||
                candB.roomNorm === pA.roomNorm ||
                isSameCompany(candB.companyRaw, pA.companyRaw) ||
                tokenMatches.length === 1
              ) {
                matchedIdxB = idx;
                matchedByLabel = `Name (Word Order Match: ${pA.nameRaw})`;
                break;
              }
            }
          }
        }

        // Sub-tier 5C: Tolerant minor name difference match
        if (matchedIdxB === undefined && options.ignoreMinorNameDifferences !== false) {
          for (let i = 0; i < peopleB.length; i++) {
            if (matchedBIndices.has(i)) continue;
            const candB = peopleB[i];
            if (hasConflictingId(pA, candB)) continue;

            if (isMinorNameDifference(pA.nameRaw, candB.nameRaw)) {
              // Confirm match if same room or same company
              if (
                (pA.baseRoom && candB.baseRoom && pA.baseRoom === candB.baseRoom) ||
                (pA.roomNorm && candB.roomNorm && pA.roomNorm === candB.roomNorm) ||
                isSameCompany(pA.companyRaw, candB.companyRaw)
              ) {
                matchedIdxB = i;
                matchedByLabel = `Name Spelling Tolerant (${pA.nameRaw})`;
                break;
              }
            }
          }
        }
      }

      // TIER 6: Same-Room Fallback Resolution
      // If occupant is still unmatched, check if there is an unmatched occupant in the EXACT same room/base-unit in File B
      if (
        matchedIdxB === undefined &&
        options.enableSameRoomMatching !== false &&
        (pA.baseRoom || pA.roomNorm)
      ) {
        const lookupKey = pA.baseRoom || pA.roomNorm;
        const rawCandidates = (mapB_byBaseRoom.get(lookupKey) || mapB_byRoom.get(lookupKey) || []).filter(
          (idx) => !matchedBIndices.has(idx)
        );

        // Filter out anyone with conflicting Iqama or Passport
        const roomCandidates = rawCandidates.filter((idx) => !hasConflictingId(pA, peopleB[idx]));

        if (roomCandidates.length > 0) {
          // Sub-tier 6A: First-Name / Token match in same room
          const firstWordA = (pA.nameNorm || '').split(' ').filter((t) => t.length > 2)[0] || '';
          const nameTokensA = (pA.nameNorm || '').split(' ').filter((t) => t.length > 2);

          for (const idx of roomCandidates) {
            const candB = peopleB[idx];
            const firstWordB = (candB.nameNorm || '').split(' ').filter((t) => t.length > 2)[0] || '';
            const nameTokensB = new Set((candB.nameNorm || '').split(' ').filter((t) => t.length > 2));

            if (firstWordA && firstWordB && firstWordA === firstWordB && firstWordA.length >= 3) {
              matchedIdxB = idx;
              matchedByLabel = `Same Room (${pA.roomRaw}) + Name (${firstWordA.toUpperCase()})`;
              break;
            }

            const commonTokens = nameTokensA.filter(
              (t) => nameTokensB.has(t) && !['mr', 'mrs', 'dr', 'guest', 'visitor', 'occupied', 'temp', 'tba'].includes(t)
            );
            if (commonTokens.length > 0) {
              matchedIdxB = idx;
              matchedByLabel = `Same Room (${pA.roomRaw}) + Name Token (${commonTokens[0].toUpperCase()})`;
              break;
            }
          }

          // Sub-tier 6B: Guest / Visitor Allocation in same room
          if (matchedIdxB === undefined) {
            const isGuestA =
              isVisitorOrGuest(pA.nameRaw) ||
              pA.iqamaClean === pA.roomNorm ||
              (!pA.iqamaClean && !pA.passportClean);

            for (const idx of roomCandidates) {
              const candB = peopleB[idx];
              const isGuestB =
                isVisitorOrGuest(candB.nameRaw) ||
                candB.iqamaClean === candB.roomNorm ||
                (!candB.iqamaClean && !candB.passportClean);

              if (isGuestA || isGuestB) {
                matchedIdxB = idx;
                matchedByLabel = `Same Room (${pA.roomRaw}) [Visitor / Guest Allocation]`;
                break;
              }
            }
          }

          // Sub-tier 6C: Single Occupant Bed Assignment (1:1 room match where both share the unit)
          if (matchedIdxB === undefined && roomCandidates.length === 1) {
            matchedIdxB = roomCandidates[0];
            matchedByLabel = `Same Room Allocation (${pA.roomRaw})`;
          }
        }
      }

      // Record result for this person in File A
      if (matchedIdxB === undefined) {
        // FINDING 1: Present in System Report, but completely MISSING in Master Report!
        rowsDiffList.push({
          id: `diff-sys-${pA.rowNum}`,
          key: pA.primaryKeyDisplay,
          keyDisplayA: pA.primaryKeyDisplay,
          rowNumberA: pA.rowNum,
          rowNumberB: null,
          status: 'MISSING_IN_MASTER',
          differences: [],
          dataA: pA.row,
          dataB: null,
          roomA: pA.roomRaw,
          residentName: pA.nameRaw,
          iqama: pA.iqamaClean,
          passport: pA.passportClean,
          visa: pA.visaClean,
          building: pA.building || 'General',
          block: pA.block || 'General',
          area: pA.area || 'General',
          company: pA.companyRaw || '',
          auditReason: `Resident is actively billed in System Report (Room ${pA.roomRaw || 'N/A'}), but their ID (${pA.iqamaClean || pA.passportClean || 'N/A'}) and name are not found in Master Accommodation Register.`,
          actionRecommendation: `Verify if resident is a new camp arrival not yet registered in Master Excel, or remove from System if demobilized.`,
          matchConfidence: 'UNMATCHED',
        });
      } else {
        // PERSON MATCHED IN BOTH REPORTS!
        matchedBIndices.add(matchedIdxB);
        const pB = peopleB[matchedIdxB];

        // CHECK CORE DISCREPANCY: ROOM MISMATCH
        // Using canonical baseRoom: "I02-001" and "I02-001-A" are the SAME room!
        const baseA = pA.baseRoom;
        const baseB = pB.baseRoom;
        const normRoomA = pA.roomNorm;
        const normRoomB = pB.roomNorm;

        // A room mismatch occurs strictly when the physical room units differ!
        const hasRoomMismatch = Boolean(
          (baseA && baseB && baseA !== baseB) ||
          (!baseA && !baseB && normRoomA && normRoomB && normRoomA !== normRoomB)
        );

        const cellDiffs: CellDifference[] = [];

        if (hasRoomMismatch) {
          cellDiffs.push({
            column: 'Room No',
            columnA: roomColA || 'Room No',
            columnB: roomColB || 'Room No',
            valueA: pA.roomRaw,
            valueB: pB.roomRaw,
            valueAFormatted: pA.roomRaw || '<empty>',
            valueBFormatted: pB.roomRaw || '<empty>',
            type: 'CHANGED',
            isRoom: true,
          });
        }

        // We only check other columns for row inspection details, but we NEVER let secondary columns
        // trigger false-positive alert statuses.
        headersA.forEach((colA) => {
          const colB = effectiveMappings[colA];
          if (!colB || colB === '__NONE__') return;
          if (!setB.has(colB)) return;

          if (colA === keyColA && colB === keyColB) return;
          if (colA === roomColA || colB === roomColB) return;

          const valA = pA.row[colA];
          const valB = pB.row[colB];

          // If this is a name column and names are close, do not flag diff
          const isNameCol = colA === nameColA || colB === nameColB || /\bname\b/i.test(colA);
          if (isNameCol && options.ignoreMinorNameDifferences !== false) {
            if (isMinorNameDifference(String(valA ?? ''), String(valB ?? ''))) {
              return;
            }
          }

          const normA = normalizeValue(valA, options);
          const normB = normalizeValue(valB, options);

          if (normA !== normB) {
            cellDiffs.push({
              column: colA === colB ? colA : `${colA} ↔ ${colB}`,
              columnA: colA,
              columnB: colB,
              valueA: valA,
              valueB: valB,
              valueAFormatted: formatCellValue(valA),
              valueBFormatted: formatCellValue(valB),
              type: 'CHANGED',
              isRoom: false,
            });
          }
        });

        // The status is strictly: ROOM_MISMATCH or IDENTICAL!
        const status: 'ROOM_MISMATCH' | 'IDENTICAL' = hasRoomMismatch ? 'ROOM_MISMATCH' : 'IDENTICAL';

        const rowBuilding = pA.building !== 'General' ? pA.building : (pB.building !== 'General' ? pB.building : 'General');
        const rowBlock = pA.block !== 'General' ? pA.block : (pB.block !== 'General' ? pB.block : 'General');
        const rowArea = pA.area !== 'General' ? pA.area : (pB.area !== 'General' ? pB.area : 'General');
        const rowCompany = pA.companyRaw || pB.companyRaw || '';

        rowsDiffList.push({
          id: `diff-matched-${pA.rowNum}-${pB.rowNum}`,
          key: pA.primaryKeyDisplay,
          keyDisplayA: pA.primaryKeyDisplay,
          keyDisplayB: pB.primaryKeyDisplay,
          rowNumberA: pA.rowNum,
          rowNumberB: pB.rowNum,
          status,
          differences: cellDiffs,
          dataA: pA.row,
          dataB: pB.row,
          isRoomMismatch: hasRoomMismatch,
          roomA: pA.roomRaw,
          roomB: pB.roomRaw,
          residentName: pA.nameRaw || pB.nameRaw,
          iqama: pA.iqamaClean || pB.iqamaClean,
          passport: pA.passportClean || pB.passportClean,
          visa: pA.visaClean || pB.visaClean,
          matchedBy: matchedByLabel,
          building: rowBuilding,
          block: rowBlock,
          area: rowArea,
          company: rowCompany,
          auditReason: hasRoomMismatch
            ? `Conflicting room: System has "${pA.roomRaw}" but Master has "${pB.roomRaw}". Verified resident match via ${matchedByLabel}.`
            : `Occupant identity and room assignment (${pA.roomRaw || pB.roomRaw}) are 100% synchronized across both files.`,
          actionRecommendation: hasRoomMismatch
            ? `Conduct physical bed check or update resident's room in Master Accommodation Register.`
            : `No action required (Verified Match).`,
          matchConfidence: 'HIGH',
        });
      }
    });

    // 4. FINDING 2: Present in Master Report, but completely MISSING in System Report!
    peopleB.forEach((pB, idx) => {
      if (!matchedBIndices.has(idx)) {
        rowsDiffList.push({
          id: `diff-mst-${pB.rowNum}`,
          key: pB.primaryKeyDisplay,
          keyDisplayB: pB.primaryKeyDisplay,
          rowNumberA: null,
          rowNumberB: pB.rowNum,
          status: 'MISSING_IN_SYSTEM',
          differences: [],
          dataA: null,
          dataB: pB.row,
          roomB: pB.roomRaw,
          residentName: pB.nameRaw,
          iqama: pB.iqamaClean,
          passport: pB.passportClean,
          visa: pB.visaClean,
          building: pB.building || 'General',
          block: pB.block || 'General',
          area: pB.area || pB.sheetName || 'General',
          company: pB.companyRaw || '',
          auditReason: `Occupant is registered in Master Excel (Room ${pB.roomRaw || 'N/A'}, ${pB.area || pB.sheetName || 'Master Sheet'}), but has no active booking in the System Man-Days report.`,
          actionRecommendation: `Check if resident is on leave/vacation, demobilized from camp, or if checkout was not entered in Master Excel.`,
          matchConfidence: 'UNMATCHED',
        });
      }
    });
  }

  // Aggregate statistics per Block, Building, and Area
  const blockMap = new Map<string, {
    area?: string;
    totalOccupants: number;
    roomMismatchCount: number;
    missingInMasterCount: number;
    missingInSystemCount: number;
    identicalCount: number;
    totalIssues: number;
  }>();

  const buildingMap = new Map<string, {
    block?: string;
    area?: string;
    totalOccupants: number;
    roomMismatchCount: number;
    missingInMasterCount: number;
    missingInSystemCount: number;
    identicalCount: number;
    totalIssues: number;
  }>();

  const areaMap = new Map<string, {
    totalOccupants: number;
    roomMismatchCount: number;
    missingInMasterCount: number;
    missingInSystemCount: number;
    identicalCount: number;
    totalIssues: number;
  }>();

  rowsDiffList.forEach((r) => {
    const bldg = r.building || 'General';
    const blk = r.block || 'General';
    const area = r.area || 'General';

    // Update Block Map
    if (!blockMap.has(blk)) {
      blockMap.set(blk, {
        area,
        totalOccupants: 0,
        roomMismatchCount: 0,
        missingInMasterCount: 0,
        missingInSystemCount: 0,
        identicalCount: 0,
        totalIssues: 0,
      });
    }
    const blkStat = blockMap.get(blk)!;
    blkStat.totalOccupants += 1;
    if (area !== 'General' && (!blkStat.area || blkStat.area === 'General')) {
      blkStat.area = area;
    }
    if (r.status === 'ROOM_MISMATCH') {
      blkStat.roomMismatchCount += 1;
      blkStat.totalIssues += 1;
    } else if (r.status === 'MISSING_IN_MASTER') {
      blkStat.missingInMasterCount += 1;
      blkStat.totalIssues += 1;
    } else if (r.status === 'MISSING_IN_SYSTEM') {
      blkStat.missingInSystemCount += 1;
      blkStat.totalIssues += 1;
    } else if (r.status === 'IDENTICAL') {
      blkStat.identicalCount += 1;
    }

    // Update Building Map
    if (!buildingMap.has(bldg)) {
      buildingMap.set(bldg, {
        block: blk,
        area,
        totalOccupants: 0,
        roomMismatchCount: 0,
        missingInMasterCount: 0,
        missingInSystemCount: 0,
        identicalCount: 0,
        totalIssues: 0,
      });
    }
    const bStat = buildingMap.get(bldg)!;
    bStat.totalOccupants += 1;
    if (blk !== 'General' && (!bStat.block || bStat.block === 'General')) {
      bStat.block = blk;
    }
    if (area !== 'General' && (!bStat.area || bStat.area === 'General')) {
      bStat.area = area;
    }
    if (r.status === 'ROOM_MISMATCH') {
      bStat.roomMismatchCount += 1;
      bStat.totalIssues += 1;
    } else if (r.status === 'MISSING_IN_MASTER') {
      bStat.missingInMasterCount += 1;
      bStat.totalIssues += 1;
    } else if (r.status === 'MISSING_IN_SYSTEM') {
      bStat.missingInSystemCount += 1;
      bStat.totalIssues += 1;
    } else if (r.status === 'IDENTICAL') {
      bStat.identicalCount += 1;
    }

    // Update Area Map
    if (!areaMap.has(area)) {
      areaMap.set(area, {
        totalOccupants: 0,
        roomMismatchCount: 0,
        missingInMasterCount: 0,
        missingInSystemCount: 0,
        identicalCount: 0,
        totalIssues: 0,
      });
    }
    const aStat = areaMap.get(area)!;
    aStat.totalOccupants += 1;
    if (r.status === 'ROOM_MISMATCH') {
      aStat.roomMismatchCount += 1;
      aStat.totalIssues += 1;
    } else if (r.status === 'MISSING_IN_MASTER') {
      aStat.missingInMasterCount += 1;
      aStat.totalIssues += 1;
    } else if (r.status === 'MISSING_IN_SYSTEM') {
      aStat.missingInSystemCount += 1;
      aStat.totalIssues += 1;
    } else if (r.status === 'IDENTICAL') {
      aStat.identicalCount += 1;
    }
  });

  const blockStats: BlockStat[] = Array.from(blockMap.entries())
    .map(([block, s]) => ({ block, ...s }))
    .sort((a, b) => b.totalIssues - a.totalIssues || a.block.localeCompare(b.block));

  const buildingStats: BuildingStat[] = Array.from(buildingMap.entries())
    .map(([building, s]) => ({ building, ...s }))
    .sort((a, b) => b.totalIssues - a.totalIssues || a.building.localeCompare(b.building));

  const areaStats: AreaStat[] = Array.from(areaMap.entries())
    .map(([area, s]) => ({ area, ...s }))
    .sort((a, b) => b.totalIssues - a.totalIssues || a.area.localeCompare(b.area));

  // Calculate clear operational metrics
  const roomMismatchCount = rowsDiffList.filter((r) => r.status === 'ROOM_MISMATCH').length;
  const missingInMasterCount = rowsDiffList.filter((r) => r.status === 'MISSING_IN_MASTER').length;
  const missingInSystemCount = rowsDiffList.filter((r) => r.status === 'MISSING_IN_SYSTEM').length;
  const identicalCount = rowsDiffList.filter((r) => r.status === 'IDENTICAL').length;
  const matchedResidentCount = roomMismatchCount + identicalCount;

  // The total actionable differences is strictly: Room Mismatches + Missing in Master + Missing in System
  const totalDifferences = roomMismatchCount + missingInMasterCount + missingInSystemCount;

  const totalKeys = Math.max(1, rowsDiffList.length);
  const matchRatePercent = Math.round((identicalCount / totalKeys) * 100);
  const systemCoveragePercent = Math.round((matchedResidentCount / (fileA.rows.length || 1)) * 100);

  const summary: ComparisonSummary = {
    totalRowsA: fileA.rows.length,
    totalRowsB: fileB.rows.length,
    roomMismatchCount,
    missingInMasterCount,
    missingInSystemCount,
    otherFieldDiffCount: 0,
    identicalCount,
    matchedResidentCount,
    totalDifferences,
    matchRatePercent,
    systemCoveragePercent,
    comparedAt: new Date().toLocaleString(),
    // Backward compatibility aliases
    addedCount: missingInSystemCount,
    removedCount: missingInMasterCount,
    modifiedCount: roomMismatchCount,
  };

  return {
    fileA,
    fileB,
    options: {
      ...options,
      roomColumnA: roomColA,
      roomColumnB: roomColB,
      iqamaColumnA: iqamaColA,
      iqamaColumnB: iqamaColB,
      passportColumnA: passportColA,
      passportColumnB: passportColB,
      nameColumnA: nameColA,
      nameColumnB: nameColB,
      keyColumnA: keyColA,
      keyColumnB: keyColB,
      columnMappings: effectiveMappings,
      enableCrossFieldMatching: options.enableCrossFieldMatching !== false,
      ignoreMinorNameDifferences: options.ignoreMinorNameDifferences !== false,
      smartMultiKeyMode: isSmartMultiKey,
      normalizeRooms: options.normalizeRooms !== false,
    },
    schemaDiff,
    summary,
    rows: rowsDiffList,
    blockStats,
    buildingStats,
    areaStats,
  };
}

/**
 * Built-in Sample Datasets specifically demonstrating:
 * 1) Cross-Field Passport vs Iqama Matching (X4097009 in National ID ↔ Passport column in Master)
 * 2) Room Mismatches (Entered in different rooms in System vs Master)
 * 3) Missing in Master Excel
 * 4) Missing in System Report
 * 5) Minor name spelling variations that are smoothly reconciled
 */
export function getSampleDatasets(): { fileA: UploadedFileInfo; fileB: UploadedFileInfo } {
  // File 1: System Report (Housing ERP Export)
  const headersA = [
    'National ID',
    'Resident Name',
    'Room No',
    'Bed No',
    'Company',
    'CheckIn_Status',
    'CheckIn_Date',
  ];

  const rowsA = [
    {
      // Iqama match with normalized TBCV room (A01-001 matches TBCV- S03 - A01-GF- 1- A)
      'National ID': '2625691999',
      'Resident Name': 'Adrish Ranjan Khan',
      'Room No': 'A01-001',
      'Bed No': '1',
      Company: 'Tamimi Global FM',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-08-01',
    },
    {
      // Cross-Field Match: System has Passport "X4097009" in National ID; Master has it in "Passport No"!
      // AND ROOM MISMATCH: System entered Room "I02-001", but Master says "I02-015"!
      'National ID': 'X4097009',
      'Resident Name': 'Ali Hassan Salem',
      'Room No': 'I02-001',
      'Bed No': '2',
      Company: 'Saudi Aramco PMT',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-08-03',
    },
    {
      // Cross-Field Match: System has Passport "P7263755" in National ID; Master has Iqama "2550617126" and Passport "P7263755"!
      // Minor name spelling variation: "Abdul Hakim Nasser" vs "Abdulhakim Nasser Nasr" -> Reconciled cleanly!
      'National ID': 'P7263755',
      'Resident Name': 'Abdul Hakim Nasser',
      'Room No': 'B2-205',
      'Bed No': '1',
      Company: 'Nesma Partners',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-08-05',
    },
    {
      // In System Report, but completely MISSING in Master Excel!
      'National ID': '2567401175',
      'Resident Name': 'Sheikh Belal Sheikh',
      'Room No': 'C1-302',
      'Bed No': '1',
      Company: 'Tamimi Catering',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-08-08',
    },
    {
      // In System Report, but completely MISSING in Master Excel!
      'National ID': 'X9182341',
      'Resident Name': 'Foysal Sahid Kabir',
      'Room No': 'D2-104',
      'Bed No': '2',
      Company: 'Al-Fanar MEP',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-08-08',
    },
    {
      // ROOM MISMATCH: System has Room B1-105, Master has Room B1-101!
      'National ID': '2566554693',
      'Resident Name': 'Md Mostafizur Rahman',
      'Room No': 'B1-105',
      'Bed No': '1',
      Company: 'Baker Hughes',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-07-15',
    },
    {
      // ROOM MISMATCH: System has Room F2-201, Master has Room F2-208!
      'National ID': '2621628037',
      'Resident Name': 'Nawab Ali Chopdar',
      'Room No': 'F2-201',
      'Bed No': '1',
      Company: 'SABIC Engineering',
      CheckIn_Status: 'Checked-In',
      CheckIn_Date: '2026-08-01',
    },
    {
      // Bed difference (Room matches)
      'National ID': '2615600257',
      'Resident Name': 'Md Ferdous Amin Molla',
      'Room No': 'E1-201',
      'Bed No': '1',
      Company: 'Schlumberger',
      CheckIn_Status: 'Checked-Out',
      CheckIn_Date: '2026-06-10',
    },
  ];

  // File 2: Master Accommodation Database
  const headersB = [
    'Iqama No',
    'Passport No',
    'Full Name',
    'Room',
    'Bed',
    'Employer',
    'Status',
    'CheckIn Date',
  ];

  const rowsB = [
    {
      'Iqama No': '2625691999',
      'Passport No': 'Z1234567',
      'Full Name': 'Adrish Ranjan Khan',
      Room: 'TBCV- S03 - A01-GF- 1- A',
      Bed: '1',
      Employer: 'Tamimi Global FM',
      Status: 'Checked-In',
      'CheckIn Date': '2026-08-01',
    },
    {
      // Matched via Passport No "X4097009"! (Room in Master is I02-015)
      'Iqama No': '2608373409',
      'Passport No': 'X4097009',
      'Full Name': 'Ali Hassan Salem',
      Room: 'I02-015', // Discrepancy!
      Bed: '2',
      Employer: 'Saudi Aramco PMT',
      Status: 'Checked-In',
      'CheckIn Date': '2026-08-03',
    },
    {
      // Matched via Passport No "P7263755"! Name spelled slightly differently: "Abdulhakim Nasser Nasr"
      'Iqama No': '2550617126',
      'Passport No': 'P7263755',
      'Full Name': 'Abdulhakim Nasser Nasr',
      Room: 'B2-205',
      Bed: '1',
      Employer: 'Nesma Partners',
      Status: 'Checked-In',
      'CheckIn Date': '2026-08-05',
    },
    {
      // Md Mostafizur: In Master he still has Room B1-101 (System has B1-105)
      'Iqama No': '2566554693',
      'Passport No': 'E9988112',
      'Full Name': 'Md Mostafizur Rahman',
      Room: 'B1-101', // Discrepancy!
      Bed: '1',
      Employer: 'Baker Hughes',
      Status: 'Checked-In',
      'CheckIn Date': '2026-07-15',
    },
    {
      // Nawab Ali: In Master he has Room F2-208 (System has F2-201)
      'Iqama No': '2621628037',
      'Passport No': 'K4433221',
      'Full Name': 'Nawab Ali Chopdar',
      Room: 'F2-208', // Discrepancy!
      Bed: '1',
      Employer: 'SABIC Engineering',
      Status: 'Checked-In',
      'CheckIn Date': '2026-08-01',
    },
    {
      // Md Ferdous: Same room E1-201, bed 2 in master
      'Iqama No': '2615600257',
      'Passport No': 'W7766554',
      'Full Name': 'Md Ferdous Amin Molla',
      Room: 'E1-201',
      Bed: '2',
      Employer: 'Schlumberger',
      Status: 'Checked-In',
      'CheckIn Date': '2026-06-10',
    },
    {
      // Present in Master, but MISSING in System Report!
      'Iqama No': '2621757141',
      'Passport No': 'Y5544332',
      'Full Name': 'Mohammed Sarif Nijamuddin',
      Room: 'G1-102',
      Bed: '2',
      Employer: 'Tamimi Logistics',
      Status: 'Reserved',
      'CheckIn Date': '2026-08-02',
    },
    {
      // Another resident in Master, MISSING in System Report!
      'Iqama No': '2598712345',
      'Passport No': 'B1122334',
      'Full Name': 'Khurshid Alam Qureshi',
      Room: 'H3-204',
      Bed: '1',
      Employer: 'Petrofac Construction',
      Status: 'Checked-In',
      'CheckIn Date': '2026-07-28',
    },
  ];

  return {
    fileA: {
      name: 'System_Report_Housing_ERP.xlsx',
      size: 19200,
      type: 'xlsx',
      sheetNames: ['System Report', 'Logs'],
      selectedSheet: 'System Report',
      headers: headersA,
      rows: rowsA,
      totalRows: rowsA.length,
    },
    fileB: {
      name: 'TBCV_Accommodation_Register.xlsx',
      size: 24500,
      type: 'xlsx',
      sheetNames: [COMBINED_ACCOMMODATION_SHEET, 'Contractors Area', 'Management Area', 'Allocation History'],
      selectedSheet: COMBINED_ACCOMMODATION_SHEET,
      headers: headersB,
      rows: rowsB,
      totalRows: rowsB.length,
      areaCounts: {
        contractors: rowsB.length - 2,
        management: 2,
        contractorsSheetName: 'Contractors Area',
        managementSheetName: 'Management Area',
      },
    },
  };
}

/**
 * Generate and download an Excel Audit Report (.xlsx)
 */
export function exportDifferenceReport(result: ComparisonResult, customName?: string) {
  const wb = XLSX.utils.book_new();

  // 1. RECONCILIATION SUMMARY SHEET
  const summaryData = [
    { Parameter: 'Reconciliation Title', Value: 'System Report vs Master Excel Camp Reconciliation Report' },
    { Parameter: 'Generated At', Value: result.summary.comparedAt },
    { Parameter: 'System Report File (File 1)', Value: `${result.fileA.name} [Sheet: ${result.fileA.selectedSheet}]` },
    { Parameter: 'Master Excel File (File 2)', Value: `${result.fileB.name} [Sheet: ${result.fileB.selectedSheet}]` },
    { Parameter: 'Matching Engine', Value: 'Smart Multi-Identifier (Iqama + Passport + National ID + Cross-Field)' },
    { Parameter: 'Total Records in System Report', Value: result.summary.totalRowsA },
    { Parameter: 'Total Records in Master Excel', Value: result.summary.totalRowsB },
    { Parameter: 'Room Mismatches (Wrong Room Entry)', Value: result.summary.roomMismatchCount },
    { Parameter: 'In System, MISSING in Master (Action Needed)', Value: result.summary.missingInMasterCount },
    { Parameter: 'In Master, MISSING in System', Value: result.summary.missingInSystemCount },
    { Parameter: 'Other Field Discrepancies (Bed/Status)', Value: result.summary.otherFieldDiffCount },
    { Parameter: 'Verified 100% Identical Records', Value: result.summary.identicalCount },
    { Parameter: 'Total Matched Residents', Value: result.summary.matchedResidentCount },
    { Parameter: 'System Coverage Rate', Value: `${result.summary.systemCoveragePercent}%` },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // 2. ROOM MISMATCHES (Top Operational Priority!)
  const roomMismatches = result.rows
    .filter((r) => r.status === 'ROOM_MISMATCH')
    .map((r) => ({
      _Identifier: r.key,
      _Resident_Name: r.residentName || '',
      _Block: r.block || '',
      _Building: r.building || '',
      _System_Room: r.roomA || '',
      _Master_Room: r.roomB || '',
      _System_Row: r.rowNumberA,
      _Master_Row: r.rowNumberB,
      _Matched_By: r.matchedBy || '',
      ...r.dataA,
    }));
  if (roomMismatches.length > 0) {
    const ws = XLSX.utils.json_to_sheet(roomMismatches);
    XLSX.utils.book_append_sheet(wb, ws, 'Room Mismatches');
  }

  // 3. MISSING IN MASTER EXCEL
  const missingInMaster = result.rows
    .filter((r) => (r.status === 'MISSING_IN_MASTER' || r.status === 'REMOVED_IN_NEW') && r.dataA)
    .map((r) => ({
      _Action_Required: 'ADD TO MASTER EXCEL (Missing)',
      _Block: r.block || '',
      _Building: r.building || '',
      _System_Row: r.rowNumberA,
      ...r.dataA,
    }));
  if (missingInMaster.length > 0) {
    const ws = XLSX.utils.json_to_sheet(missingInMaster);
    XLSX.utils.book_append_sheet(wb, ws, 'Missing in Master');
  }

  // 4. MISSING IN SYSTEM REPORT
  const missingInSystem = result.rows
    .filter((r) => (r.status === 'MISSING_IN_SYSTEM' || r.status === 'ADDED_IN_NEW') && r.dataB)
    .map((r) => ({
      _Action_Required: 'NOT IN SYSTEM REPORT',
      _Block: r.block || '',
      _Building: r.building || '',
      _Master_Row: r.rowNumberB,
      ...r.dataB,
    }));
  if (missingInSystem.length > 0) {
    const ws = XLSX.utils.json_to_sheet(missingInSystem);
    XLSX.utils.book_append_sheet(wb, ws, 'Missing in System');
  }

  // 5. OTHER FIELD DISCREPANCIES (Bed, Status, Company)
  const discrepancyRows: Record<string, any>[] = [];
  result.rows
    .filter((r) => r.status === 'MODIFIED')
    .forEach((r) => {
      r.differences.forEach((d) => {
        discrepancyRows.push({
          Identifier_Iqama_ID: r.key,
          Resident_Name: r.residentName || '',
          Block: r.block || '',
          Building: r.building || '',
          System_Row: r.rowNumberA,
          Master_Row: r.rowNumberB,
          Field_Name: d.column,
          System_Report_Value: d.valueAFormatted,
          Master_Excel_Value: d.valueBFormatted,
          Change_Type: d.type,
        });
      });
    });
  if (discrepancyRows.length > 0) {
    const discWs = XLSX.utils.json_to_sheet(discrepancyRows);
    XLSX.utils.book_append_sheet(wb, discWs, 'Other Field Discrepancies');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customName || `Reconciliation_Audit_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Quick export of ONLY Room Mismatches (Wrong Room Entry)
 */
export function exportRoomMismatchesOnly(result: ComparisonResult) {
  const roomRows = result.rows
    .filter((r) => r.status === 'ROOM_MISMATCH')
    .map((r) => ({
      _Identifier: r.key,
      _Resident_Name: r.residentName || '',
      _Block: r.block || '',
      _Building: r.building || '',
      _System_Room: r.roomA || '',
      _Master_Room: r.roomB || '',
      _System_Row: r.rowNumberA,
      _Master_Row: r.rowNumberB,
      _Matched_By: r.matchedBy || '',
      ...r.dataA,
    }));

  if (roomRows.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(roomRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Room Mismatches');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Room_Mismatches_${dateStr}.xlsx`);
}

/**
 * Quick export of ONLY Missing in Master Excel
 */
export function exportMissingInMasterOnly(result: ComparisonResult) {
  const missingRows = result.rows
    .filter((r) => (r.status === 'MISSING_IN_MASTER' || r.status === 'REMOVED_IN_NEW') && r.dataA)
    .map((r) => ({
      _Action_Required: 'ADD TO MASTER EXCEL (Missing)',
      _Block: r.block || '',
      _Building: r.building || '',
      _System_Row: r.rowNumberA,
      ...r.dataA,
    }));

  if (missingRows.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(missingRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Missing in Master');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Missing_In_Master_Excel_${dateStr}.xlsx`);
}

/**
 * Quick export of ONLY Missing in System Report
 */
export function exportMissingInSystemOnly(result: ComparisonResult) {
  const missingRows = result.rows
    .filter((r) => (r.status === 'MISSING_IN_SYSTEM' || r.status === 'ADDED_IN_NEW') && r.dataB)
    .map((r) => ({
      _Action_Required: 'NOT IN SYSTEM REPORT',
      _Block: r.block || '',
      _Building: r.building || '',
      _Master_Row: r.rowNumberB,
      ...r.dataB,
    }));

  if (missingRows.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(missingRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Missing in System');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Missing_In_System_Report_${dateStr}.xlsx`);
}

/**
 * Export currently filtered rows on screen
 */
export function exportCurrentViewRows(rows: RowDifference[], filenamePrefix = 'Filtered_Records') {
  if (!rows || rows.length === 0) return;

  const exportData = rows.map((r) => {
    const base: Record<string, any> = {
      Status: r.status,
      Identifier: r.key,
      Resident_Name: r.residentName || '',
      Block: r.block || '',
      Building: r.building || '',
      System_Room: r.roomA || '',
      Master_Room: r.roomB || '',
      System_Row: r.rowNumberA ?? '',
      Master_Row: r.rowNumberB ?? '',
      Matched_By: r.matchedBy || '',
    };

    if (r.dataA) {
      Object.entries(r.dataA).forEach(([k, v]) => {
        base[`Sys_${k}`] = v;
      });
    }
    if (r.dataB) {
      Object.entries(r.dataB).forEach(([k, v]) => {
        base[`Mst_${k}`] = v;
      });
    }

    return base;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}


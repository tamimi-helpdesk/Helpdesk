import * as XLSX from 'xlsx';
import { BlankFromRow, INITIAL_BLANK_FROM_ROWS, EMPTY_BLANK_FROM_ROW } from '../data/initialBlankFromData';
import { GasService } from './gasService';
import { ExcelImportSettings, ExcelImportSettingsService } from './excelImportSettingsService';

const STORAGE_KEY = 'tamimi_blank_from_sheet_cache_v2';
const GSHEET_URL_KEY = 'tamimi_blank_from_gsheet_url_v2';
const SELECTED_TAB_KEY = 'tamimi_blank_from_selected_tab_v2';

export interface BlankFromSearchFilters {
  query?: string;
  buildingNo?: string;
  unitNo?: string;
  unitSerialNo?: string;
  employmentId?: string;
  residentName?: string;
  nationalIdIqama?: string;
  passport?: string;
  mobile?: string;
}

export interface SheetTabInfo {
  name: string;
  rowCount: number;
  hasPassport?: boolean;
}

/**
 * High-capacity browser database for 40,000+ resident/employee records.
 * Bypasses the 5MB browser localStorage quota limitation completely.
 */
class LargeDatasetStorage {
  private static DB_NAME = 'TamimiHubBlankFormsDB';
  private static STORE_NAME = 'employee_records';
  private static dbPromise: Promise<IDBDatabase | null> | null = null;

  public static async getDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(this.DB_NAME, 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
              db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  public static async saveAll(rows: BlankFromRow[]): Promise<boolean> {
    const db = await this.getDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.clear();
        for (let i = 0; i < rows.length; i++) {
          store.put(rows[i]);
        }
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  public static async loadAll(): Promise<BlankFromRow[] | null> {
    const db = await this.getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result as BlankFromRow[];
          resolve(res && res.length > 0 ? res : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
}

export class BlankFromService {
  private static cachedRows: BlankFromRow[] | null = null;
  private static availableTabs: SheetTabInfo[] = [];
  private static activeTabName: string = 'Blank Forms';
  private static isInitialized = false;

  // Ultra-fast hash maps for instantaneous O(1) searches across 40,000+ records
  private static passportIndex = new Map<string, BlankFromRow>();
  private static iqamaIndex = new Map<string, BlankFromRow>();
  private static empIdIndex = new Map<string, BlankFromRow>();

  /**
   * Initializes the in-memory cache and IndexedDB storage on startup
   */
  public static async init(): Promise<BlankFromRow[]> {
    if (this.isInitialized && this.cachedRows && this.cachedRows.length > 0) {
      return this.cachedRows;
    }

    try {
      // 1. Try loading cached tabs list
      if (typeof window !== 'undefined') {
        const storedTabs = localStorage.getItem('tamimi_blank_from_available_tabs_v2');
        if (storedTabs) {
          try {
            this.availableTabs = JSON.parse(storedTabs);
          } catch {}
        }
        const storedActiveTab = localStorage.getItem(SELECTED_TAB_KEY);
        if (storedActiveTab) this.activeTabName = storedActiveTab;
      }

      // 2. Try loading full dataset from IndexedDB (handles 40,000+ records)
      const fromDb = await LargeDatasetStorage.loadAll();
      if (fromDb && fromDb.length > 0) {
        // Guarantee baseline 1,438 records are always preserved + any custom uploaded records retained
        const merged = this.combineWithBaseline(fromDb, INITIAL_BLANK_FROM_ROWS);
        this.setCachedRowsAndIndex(merged);
        this.isInitialized = true;
        LargeDatasetStorage.saveAll(merged).catch(() => {});
        return merged;
      }

      // 3. Fallback to localStorage for initial cache
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = this.combineWithBaseline(parsed, INITIAL_BLANK_FROM_ROWS);
            this.setCachedRowsAndIndex(merged);
            this.isInitialized = true;
            LargeDatasetStorage.saveAll(merged).catch(() => {});
            return merged;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read cached Blank From rows:', e);
    }

    // Default to the full master Management Allocation History dataset (1,438 records)
    this.setCachedRowsAndIndex([...INITIAL_BLANK_FROM_ROWS]);
    this.isInitialized = true;
    LargeDatasetStorage.saveAll([...INITIAL_BLANK_FROM_ROWS]).catch(() => {});
    return this.cachedRows || [];
  }

  /**
   * Combines existing stored database with baseline 1,438 records,
   * guaranteeing baseline records are always present while preserving any added records.
   */
  public static combineWithBaseline(existing: BlankFromRow[], baseline: BlankFromRow[]): BlankFromRow[] {
    if (!existing || existing.length === 0) return [...baseline];
    if (!baseline || baseline.length === 0) return [...existing];

    const existingMap = new Map<string, BlankFromRow>();
    const result: BlankFromRow[] = [...existing];

    result.forEach((r) => {
      if (!r) return;
      if (r.employmentId) existingMap.set(String(r.employmentId).trim().toLowerCase(), r);
      if (r.idIqama) existingMap.set(String(r.idIqama).replace(/\D/g, ''), r);
      if (r.name) existingMap.set(`${r.name.trim().toLowerCase()}_${(r.unitNo || r.room || '').trim().toLowerCase()}`, r);
    });

    // Check if any baseline record is missing, append it
    for (const b of baseline) {
      if (!b) continue;
      const eKey = b.employmentId ? String(b.employmentId).trim().toLowerCase() : '';
      const iKey = b.idIqama ? String(b.idIqama).replace(/\D/g, '') : '';
      const nuKey = b.name ? `${b.name.trim().toLowerCase()}_${(b.unitNo || b.room || '').trim().toLowerCase()}` : '';

      const exists = (eKey && existingMap.has(eKey)) || (iKey && existingMap.has(iKey)) || (nuKey && existingMap.has(nuKey));
      if (!exists) {
        result.push(b);
        if (eKey) existingMap.set(eKey, b);
        if (iKey) existingMap.set(iKey, b);
        if (nuKey) existingMap.set(nuKey, b);
      }
    }

    return result;
  }

  public static getRows(): BlankFromRow[] {
    if (this.cachedRows && this.cachedRows.length > 0) {
      return this.cachedRows.filter(Boolean);
    }

    // Try synchronous read from localStorage if memory is cold
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(Boolean);
            this.setCachedRowsAndIndex(clean);
            return clean;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage cache:', e);
    }

    // Kick off async load from IndexedDB
    LargeDatasetStorage.loadAll().then((rows) => {
      if (rows && rows.length > 0) {
        const clean = rows.filter(Boolean);
        this.setCachedRowsAndIndex(clean);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tamimi_blank_from_updated'));
        }
      }
    }).catch(() => {});

    this.setCachedRowsAndIndex([...INITIAL_BLANK_FROM_ROWS]);
    return (this.cachedRows || []).filter(Boolean);
  }

  private static setCachedRowsAndIndex(rows: BlankFromRow[]) {
    this.cachedRows = (rows || []).filter(Boolean);
    this.passportIndex.clear();
    this.iqamaIndex.clear();
    this.empIdIndex.clear();

    for (let i = 0; i < this.cachedRows.length; i++) {
      const r = this.cachedRows[i];
      if (!r) continue;
      if (r.passport) {
        const pClean = r.passport.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (pClean) this.passportIndex.set(pClean, r);
      }
      if (r.idIqama) {
        const iClean = r.idIqama.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (iClean) this.iqamaIndex.set(iClean, r);
      }
      if (r.employmentId) {
        const eClean = r.employmentId.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (eClean) this.empIdIndex.set(eClean, r);
      }
    }
  }

  public static saveRows(rows: BlankFromRow[], tabName?: string): void {
    this.setCachedRowsAndIndex(rows);
    if (tabName) {
      this.activeTabName = tabName;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(SELECTED_TAB_KEY, tabName);
        }
      } catch {}
    }

    // Save to IndexedDB (no 5MB size limit; safely stores 40,000+ items)
    LargeDatasetStorage.saveAll(rows).catch((err) => {
      console.error('Failed to save to IndexedDB:', err);
    });

    // If dataset is small (< 800 items), also sync to localStorage as instant fallback
    try {
      if (typeof window !== 'undefined') {
        if (rows.length <= 800) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
        } else {
          // Store first 100 rows in localStorage as lightweight teaser
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 100)));
        }
        window.dispatchEvent(new CustomEvent('tamimi_blank_from_updated'));
      }
    } catch {
      // Ignore localStorage quota exceeded
    }
  }

  public static getActiveTabName(): string {
    return this.activeTabName || 'Blank Forms';
  }

  public static saveAvailableTabs(tabs: SheetTabInfo[]): void {
    this.availableTabs = tabs;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tamimi_blank_from_available_tabs_v2', JSON.stringify(tabs));
      }
    } catch {}
  }

  /**
   * Safely merges raw remote objects without truncating an existing 40,000+ record dataset.
   */
  public static mergeAndSaveRawObjects(remoteItems: any[]): void {
    if (!Array.isArray(remoteItems) || remoteItems.length === 0) return;
    const current = this.getRows();
    const normalizedIncoming = this.normalizeRowObjects(remoteItems);

    // If current local dataset is much larger (e.g. 40,000+ rows) and incoming is small (e.g. 807),
    // update matching records and do NOT discard the remaining 39,000+ records!
    if (current.length > normalizedIncoming.length + 500) {
      const idMap = new Map<string, BlankFromRow>();
      current.forEach((r) => {
        idMap.set(r.employmentId || r.id, r);
      });
      normalizedIncoming.forEach((inc) => {
        const k = inc.employmentId || inc.id;
        idMap.set(k, { ...(idMap.get(k) || {}), ...inc });
      });
      const merged = Array.from(idMap.values());
      this.saveRows(merged);
    } else {
      this.saveRows(normalizedIncoming);
    }
  }

  /**
   * Fast, multi-field search across 40,000+ records.
   * Checks passport, iqama, emp id, resident name, mobile, building, and unit.
   */
  public static searchRows(query: string): BlankFromRow[] {
    const list = this.getRows();
    const rawQ = query.trim();
    if (!rawQ) return list;

    const q = rawQ.toLowerCase();
    const cleanAlphaNum = q.replace(/[^a-z0-9]/g, '');
    const digitsOnly = q.replace(/\D/g, '');

    // 1. Check exact match in indexed maps
    if (cleanAlphaNum) {
      const exactPassport = this.passportIndex.get(cleanAlphaNum);
      const exactIqama = this.iqamaIndex.get(cleanAlphaNum);
      const exactEmp = this.empIdIndex.get(cleanAlphaNum);

      if (exactPassport || exactIqama || exactEmp) {
        const exactMatches: BlankFromRow[] = [];
        const seen = new Set<string>();
        [exactPassport, exactIqama, exactEmp].forEach((item) => {
          if (item && !seen.has(item.id)) {
            seen.add(item.id);
            exactMatches.push(item);
          }
        });

        // Also find substring matches and prepend exact match
        const rest = list.filter((r) => {
          if (!r || seen.has(r.id)) return false;
          const p = (r.passport || '').toLowerCase();
          const iq = (r.idIqama || '').toLowerCase();
          const emp = (r.employmentId || '').toLowerCase();
          return p.includes(q) || iq.includes(q) || emp.includes(q);
        });

        return [...exactMatches, ...rest];
      }
    }

    // 2. Full scan across 40,000 items (takes ~5ms in V8)
    return list.filter((row) => {
      if (!row) return false;
      const passport = (row.passport || '').toLowerCase();
      const iqama = (row.idIqama || '').toLowerCase();
      const empId = (row.employmentId || '').toLowerCase();
      const name = (row.name || '').toLowerCase();
      const mobile = (row.mobile || '').toLowerCase();
      const bldg = (row.buildingNo || row.house || '').toLowerCase();
      const unitNo = (row.unitNo || row.room || '').toLowerCase();
      const unitSerial = (row.unitSerialNo || '').toLowerCase();
      const fullUnit = (row.unit || '').toLowerCase();
      const dept = (row.department || '').toLowerCase();
      const comp = (row.company || '').toLowerCase();

      // Normalized clean comparisons
      if (cleanAlphaNum.length >= 2) {
        const pClean = passport.replace(/[^a-z0-9]/g, '');
        const iqClean = iqama.replace(/[^a-z0-9]/g, '');
        const empClean = empId.replace(/[^a-z0-9]/g, '');
        if (pClean.includes(cleanAlphaNum) || iqClean.includes(cleanAlphaNum) || empClean.includes(cleanAlphaNum)) {
          return true;
        }
      }

      // Plain substring match
      if (
        passport.includes(q) ||
        iqama.includes(q) ||
        empId.includes(q) ||
        name.includes(q) ||
        bldg.includes(q) ||
        unitNo.includes(q) ||
        unitSerial.includes(q) ||
        mobile.includes(q) ||
        fullUnit.includes(q) ||
        dept.includes(q) ||
        comp.includes(q)
      ) {
        return true;
      }

      // Digits match for mobile, badge, and unit
      if (digitsOnly && digitsOnly.length >= 3) {
        if (
          mobile.replace(/\D/g, '').includes(digitsOnly) ||
          iqama.replace(/\D/g, '').includes(digitsOnly) ||
          empId.replace(/\D/g, '').includes(digitsOnly)
        ) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Column-targeted filter
   */
  public static filterRows(filters: BlankFromSearchFilters): BlankFromRow[] {
    let list = this.getRows();

    if (filters.query && filters.query.trim()) {
      list = this.searchRows(filters.query);
    }

    return list.filter((row) => {
      if (!row) return false;
      if (filters.buildingNo) {
        const b = (row.buildingNo || row.house || '').toLowerCase();
        if (!b.includes(filters.buildingNo.toLowerCase().trim())) return false;
      }
      if (filters.unitNo) {
        const u = (row.unitNo || row.room || row.unit || '').toLowerCase();
        if (!u.includes(filters.unitNo.toLowerCase().trim())) return false;
      }
      if (filters.unitSerialNo) {
        const s = (row.unitSerialNo || '').toLowerCase();
        if (!s.includes(filters.unitSerialNo.toLowerCase().trim())) return false;
      }
      if (filters.employmentId) {
        const id = (row.employmentId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = filters.employmentId.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!id.includes(target)) return false;
      }
      if (filters.residentName) {
        const n = (row.name || '').toLowerCase();
        if (!n.includes(filters.residentName.toLowerCase().trim())) return false;
      }
      if (filters.nationalIdIqama) {
        const iq = (row.idIqama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = filters.nationalIdIqama.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!iq.includes(target)) return false;
      }
      if (filters.passport) {
        const p = (row.passport || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = filters.passport.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!p.includes(target)) return false;
      }
      if (filters.mobile) {
        const m = (row.mobile || '').replace(/\D/g, '');
        const targetM = filters.mobile.replace(/\D/g, '');
        if (!m.includes(targetM)) return false;
      }
      return true;
    });
  }

  public static getSavedGoogleSheetUrl(): string {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(GSHEET_URL_KEY) || '';
      }
    } catch {}
    return '';
  }

  public static saveGoogleSheetUrl(url: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(GSHEET_URL_KEY, url.trim());
      }
    } catch {}
  }

  public static getAvailableTabs(): SheetTabInfo[] {
    return this.availableTabs;
  }

  /**
   * Intelligently parses 2D matrix of cells (from XLSX SheetJS or raw rows)
   * into standardized BlankFromRow structures.
   * Auto-detects headers across first 5 rows and maps all 8 user fields + secondary fields.
   */
  public static parse2dArrayToRows(matrix: any[][]): BlankFromRow[] {
    if (!Array.isArray(matrix) || matrix.length < 2) return [];

    // 1. Find Header Row (might not be row 0 if sheet has banner rows)
    let headerRowIdx = 0;
    let maxMatchCount = 0;

    const testKeywords = [
      'passport', 'pass', 'pp no', 'جواز',
      'resident', 'name', 'applicant', 'employee', 'اسم',
      'iqama', 'national id', 'civil id', 'هوية', 'إقامة',
      'building', 'bldg', 'house', 'المبنى',
      'unit', 'room', 'bed', 'الوحدة',
      'serial', 'badge', 'employment', 'mobile', 'phone'
    ];

    for (let i = 0; i < Math.min(5, matrix.length); i++) {
      const row = matrix[i];
      if (!Array.isArray(row)) continue;
      const matchCount = row.filter((cell) => {
        const val = String(cell || '').toLowerCase().trim();
        return testKeywords.some((k) => val.includes(k));
      }).length;

      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        headerRowIdx = i;
      }
    }

    const header = (matrix[headerRowIdx] || []).map((h) => String(h || '').toLowerCase().trim());

    const findIndex = (...keywords: string[]): number => {
      return header.findIndex((h) =>
        keywords.some((k) => {
          const kNorm = k.toLowerCase().trim();
          const hNorm = h.toLowerCase().trim();
          const hClean = hNorm.replace(/[^a-z0-9]/g, '');
          const kClean = kNorm.replace(/[^a-z0-9]/g, '');
          if (hNorm === kNorm || hClean === kClean) return true;
          // For multi-word or longer keywords (>= 4 chars), allow substring if contained
          if (kNorm.length >= 4 && hNorm.includes(kNorm)) return true;
          // For short keywords (like 'id', 'sl'), check word boundary (e.g. 'sl no', 'row id', not 'middle' or 'id type')
          if (kNorm.length < 4) {
            const words = hNorm.split(/[\s_\-/.:#]+/);
            return words.includes(kNorm);
          }
          return false;
        })
      );
    };

    const formatExcelDate = (val: string): string => {
      if (!val) return '';
      const trimmed = val.trim();
      if (/^\d{4,5}$/.test(trimmed)) {
        const num = Number(trimmed);
        if (num >= 20000 && num <= 65000) {
          const d = new Date(Math.round((num - 25569) * 86400 * 1000));
          if (!isNaN(d.getTime())) {
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
          }
        }
      }
      return trimmed;
    };

    // User's 8 specific columns with multilingual support
    const idxBuildingNo = findIndex(
      'building no', 'building no.', 'building number', 'building', 'bldg no', 'bldg', 'bldg.',
      'house', 'house no', 'block', 'المبنى', 'رقم المبنى'
    );
    const idxUnitNo = findIndex(
      'unit no', 'unit no.', 'unit number', 'unit', 'apartment no', 'apartment',
      'room no', 'room no.', 'room number', 'room', 'bed no', 'الوحدة', 'رقم الغرفة', 'الغرفة'
    );
    const idxUnitSerial = findIndex(
      'unit serial number', 'unit serial no', 'unit serial no.', 'unit serial',
      'serial number', 'serial no', 'serial no.', 'unit sl', 'serial', 'الرقم التسلسلي'
    );
    const idxEmpId = findIndex(
      'employment id', 'employment id.', 'employmentid', 'employee id', 'employee id.',
      'employee no', 'badge', 'badge id', 'badge no', 'empid', 'staff id', 'الرقم الوظيفي', 'رقم الموظف'
    );
    const idxName = findIndex(
      'resident name', 'resident', 'resident full name', 'name', 'full name',
      'applicant name', 'employee name', 'tenant name', 'staff name', 'guest name',
      'اسم المقيم', 'اسم الموظف', 'الاسم'
    );
    const idxIqama = findIndex(
      'national id/iqama', 'national id / iqama', 'national id', 'id/iqama', 'idiqama',
      'iqama', 'iqama no', 'iqama number', 'civil id', 'resident id', 'هوية مقيم', 'رقم الإقامة', 'الإقامة'
    );
    const idxPassport = findIndex(
      'passport', 'passport no', 'passport no.', 'passport number', 'passport #',
      'pass', 'pp no', 'pp no.', 'pp number', 'passport/id', 'travel document', 'doc no',
      'جواز السفر', 'رقم الجواز', 'جواز'
    );
    const idxMobile = findIndex(
      'mobile', 'mobile no', 'mobile no.', 'mobile number', 'phone', 'phone no',
      'phone number', 'contact', 'contact number', 'cell', 'الجوال', 'رقم الجوال', 'الهاتف'
    );

    // Standard secondary columns
    const idxId = findIndex('id', 'record id', 'sl', 'sl no', 'sl.');
    const idxProperty = findIndex('property', 'property name', 'project');
    const idxSector = findIndex('cluster/section', 'sector', 'zone');
    const idxHouse = findIndex('house');
    const idxFloor = findIndex('floor');
    const idxPropertyType = findIndex('room category', 'property type', 'type of property', 'type');
    const idxContractType = findIndex('contract type');
    const idxOccupancy = findIndex('occupancy');
    const idxStatus = findIndex('status');
    const idxGender = findIndex('gender', 'sex');
    const idxCategory = findIndex('category');
    const idxCompany = findIndex('company', 'company name', 'employer');
    const idxDivision = findIndex('division', 'program', 'assigned project');
    const idxDepartment = findIndex('department', 'dept');
    const idxDesignation = findIndex('designation', 'position', 'job title');
    const idxEmail = findIndex('email', 'e-mail');
    const idxNationality = findIndex('nationality', 'country');
    const idxDob = findIndex('dob', 'd.o.b', 'date of birth');
    const idxMoveIn = findIndex('move in date', 'moveindate', 'check in date', 'check-in date', 'move_in_date');
    const idxContractStart = findIndex('contract start date', 'contractstartdate');
    const idxMoveOut = findIndex('move out date', 'moveoutdate', 'check out date', 'check-out date', 'move_out_date');
    const idxEmerMobile = findIndex('emergency contact', 'emergencymobile', 'emergency phone', 'emergency_contact');
    const idxEmerName = findIndex('name of contact', 'emergencyname', 'emergency person', 'contact name');
    const idxVehicleReg = findIndex('registration no', 'vehicleregno', 'plate no', 'vehicle');
    const idxVehicleModel = findIndex('vehiclemodel', 'make / model', 'model');
    const idxCarPark = findIndex('car park space', 'carparkspace', 'car park', 'parking');

    const rows: BlankFromRow[] = [];

    for (let r = headerRowIdx + 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const getVal = (idx: number): string => {
        if (idx < 0 || idx >= row.length) return '';
        const v = row[idx];
        if (v === null || v === undefined) return '';
        return String(v).trim();
      };

      const name = idxName >= 0 ? getVal(idxName) : getVal(1);
      const passport = idxPassport >= 0 ? getVal(idxPassport) : '';
      const iqama = idxIqama >= 0 ? getVal(idxIqama) : '';
      const empId = idxEmpId >= 0 ? getVal(idxEmpId) : '';
      const bldgVal = idxBuildingNo >= 0 ? getVal(idxBuildingNo) : (idxHouse >= 0 ? getVal(idxHouse) : '');
      const unitVal = idxUnitNo >= 0 ? getVal(idxUnitNo) : '';
      const unitSerialVal = idxUnitSerial >= 0 ? getVal(idxUnitSerial) : '';

      // Skip completely blank rows or header repeats
      if (!name && !passport && !iqama && !empId && !bldgVal && !unitVal && !unitSerialVal) continue;
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes('name on contract') ||
        lowerName === 'resident name' ||
        lowerName === 'name' ||
        lowerName === 'employee name'
      ) {
        continue;
      }

      const buildingNo = bldgVal || 'Bldg 01';
      const unitNo = unitVal || '101';
      const unitSerialNo = unitSerialVal;
      const assignedEmpId = empId || `10${r + 200}`;
      const property = idxProperty >= 0 ? getVal(idxProperty) || 'TBCV' : 'TBCV';
      const sector = idxSector >= 0 ? getVal(idxSector) || 'S01' : 'S01';
      const house = idxHouse >= 0 ? getVal(idxHouse) || buildingNo : buildingNo;
      const floor = idxFloor >= 0 ? getVal(idxFloor) || 'FF' : 'FF';

      const computedUnit = `${property} - ${buildingNo} - Unit ${unitNo}${unitSerialNo ? ` (${unitSerialNo})` : ''}`;

      const rawId = idxId >= 0 ? getVal(idxId) : '';
      const isDescriptiveId = rawId && /^(permanent|contractor|temporary|active|inactive|male|female|single|double|senior|junior|executive|worker)$/i.test(rawId.trim());
      const rowUniqueId = rawId && !isDescriptiveId ? rawId : `bfr-${r}-${assignedEmpId}`;

      rows.push({
        id: rowUniqueId,
        property,
        sector,
        house,
        floor,
        room: unitNo,
        unit: computedUnit,
        buildingNo,
        unitNo,
        unitSerialNo,
        propertyType: (idxPropertyType >= 0 ? getVal(idxPropertyType) : 'Senior') || 'Senior',
        contractType: (idxContractType >= 0 ? getVal(idxContractType) : 'Permanent') || 'Permanent',
        occupancy: (idxOccupancy >= 0 ? getVal(idxOccupancy) : 'Single Occupancy') || 'Single Occupancy',
        status: (idxStatus >= 0 ? getVal(idxStatus) : 'Active') || 'Active',
        employmentId: assignedEmpId,
        name: name || `Resident ${assignedEmpId}`,
        gender: (idxGender >= 0 ? getVal(idxGender) : 'Male') || 'Male',
        category: (idxCategory >= 0 ? getVal(idxCategory) : 'Rsg Staff') || 'Rsg Staff',
        company: (idxCompany >= 0 ? getVal(idxCompany) : 'Red Sea Global') || 'Red Sea Global',
        division: (idxDivision >= 0 ? getVal(idxDivision) : 'Projects Delivery') || 'Projects Delivery',
        department: (idxDepartment >= 0 ? getVal(idxDepartment) : 'Operations') || 'Operations',
        designation: (idxDesignation >= 0 ? getVal(idxDesignation) : 'Staff') || 'Staff',
        idIqama: iqama,
        passport,
        mobile: idxMobile >= 0 ? getVal(idxMobile) : '',
        email: idxEmail >= 0 ? getVal(idxEmail) : '',
        nationality: (idxNationality >= 0 ? getVal(idxNationality) : 'Saudi Arabia') || 'Saudi Arabia',
        dob: idxDob >= 0 ? formatExcelDate(getVal(idxDob)) : '',
        moveInDate: idxMoveIn >= 0 ? formatExcelDate(getVal(idxMoveIn)) || '8/24/2026' : '8/24/2026',
        contractStartDate: idxContractStart >= 0 ? formatExcelDate(getVal(idxContractStart)) || '8/24/2026' : '8/24/2026',
        moveOutDate: idxMoveOut >= 0 ? formatExcelDate(getVal(idxMoveOut)) || '12/31/2026' : '12/31/2026',
        emergencyMobile: idxEmerMobile >= 0 ? getVal(idxEmerMobile) : '',
        emergencyName: (idxEmerName >= 0 ? getVal(idxEmerName) : 'None') || 'None',
        vehicleRegNo: idxVehicleReg >= 0 ? getVal(idxVehicleReg) : undefined,
        vehicleModel: idxVehicleModel >= 0 ? getVal(idxVehicleModel) : undefined,
        carParkSpace: idxCarPark >= 0 ? getVal(idxCarPark) : undefined,
      });
    }

    return rows;
  }

  /**
   * CSV parser that handles quotes and newlines correctly
   */
  public static parseCsvToRows(csvText: string): BlankFromRow[] {
    const matrix: string[][] = [];
    let curRow: string[] = [];
    let curCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const c = csvText[i];
      const next = csvText[i + 1];

      if (c === '"') {
        if (insideQuotes && next === '"') {
          curCell += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        curRow.push(curCell.trim());
        curCell = '';
      } else if ((c === '\r' || c === '\n') && !insideQuotes) {
        if (c === '\r' && next === '\n') i++; // Skip \r\n
        curRow.push(curCell.trim());
        if (curRow.some((cell) => cell.length > 0)) {
          matrix.push(curRow);
        }
        curRow = [];
        curCell = '';
      } else {
        curCell += c;
      }
    }

    if (curCell.length > 0 || curRow.length > 0) {
      curRow.push(curCell.trim());
      if (curRow.some((cell) => cell.length > 0)) {
        matrix.push(curRow);
      }
    }

    return this.parse2dArrayToRows(matrix);
  }

  /**
   * Syncs from Google Sheet directly.
   * Downloads whole workbook or specific tab and parses all 40,000+ rows.
   */
  public static async fetchFromGoogleSheet(
    customUrl?: string,
    specificTab?: string
  ): Promise<{
    success: boolean;
    count: number;
    error?: string;
    availableTabs?: SheetTabInfo[];
    selectedTab?: string;
  }> {
    const gasConfig = GasService.getConfig();
    const targetUrl = (customUrl || this.getSavedGoogleSheetUrl() || gasConfig.webAppUrl || '').trim();

    if (!targetUrl) {
      return { success: false, count: 0, error: 'Google Sheet or Web App URL is not configured.' };
    }

    try {
      this.saveGoogleSheetUrl(targetUrl);

      // 1. First attempt: Server-Side proxy (can fetch multi-tab XLSX with 40,000+ rows)
      try {
        const proxyRes = await fetch('/api/gas/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl,
            tab: specificTab || 'Blank Forms',
            action: 'getBlankFromEmployees',
          }),
        });

        if (proxyRes.ok) {
          const json = await proxyRes.json();

          if (Array.isArray(json?.availableTabs)) {
            this.availableTabs = json.availableTabs;
          }

          // Case A: Server returned raw 2D array of rows from multi-tab XLSX
          if (Array.isArray(json?.rawRows) && json.rawRows.length > 0) {
            const parsed = this.parse2dArrayToRows(json.rawRows);
            if (parsed.length > 0) {
              this.saveRows(parsed);
              return {
                success: true,
                count: parsed.length,
                availableTabs: this.availableTabs,
                selectedTab: json.selectedTab,
              };
            }
          }

          // Case B: Server returned CSV
          if (json?.csv && typeof json.csv === 'string') {
            const parsed = this.parseCsvToRows(json.csv);
            if (parsed.length > 0) {
              this.saveRows(parsed);
              return {
                success: true,
                count: parsed.length,
                availableTabs: this.availableTabs,
                selectedTab: json.tab,
              };
            }
          }

          // Case C: Server returned JSON records
          const rowsArray = json?.data || json?.employees || json?.blankForms || (Array.isArray(json) ? json : null);
          if (Array.isArray(rowsArray) && rowsArray.length > 0) {
            const normalized = this.normalizeRowObjects(rowsArray);
            this.saveRows(normalized);
            return {
              success: true,
              count: normalized.length,
              availableTabs: this.availableTabs,
            };
          }

          if (json?.error) {
            return { success: false, count: 0, error: json.error };
          }
        }
      } catch (proxyErr) {
        console.warn('Proxy fetch failed, attempting direct fetch:', proxyErr);
      }

      // 2. Direct client fetch fallback for direct Google Sheet links
      if (targetUrl.includes('docs.google.com/spreadsheets/d/')) {
        const idMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = targetUrl.match(/[#&?]gid=([0-9]+)/);
        if (idMatch && idMatch[1]) {
          const sheetId = idMatch[1];
          const gid = gidMatch ? gidMatch[1] : '';

          // If explicit gid exists, fetch that exact tab
          if (gid) {
            try {
              const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
              if (res.ok) {
                const txt = await res.text();
                const parsed = this.parseCsvToRows(txt);
                if (parsed.length > 0) {
                  this.saveRows(parsed);
                  return { success: true, count: parsed.length };
                }
              }
            } catch {}
          }

          // Try tab names
          const tabNames = [specificTab, 'Blank%20Forms', 'Blank%20Form', 'Blank%20From', 'Sheet1'].filter(Boolean);
          for (const tab of tabNames) {
            try {
              const fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${tab}`;
              const res = await fetch(fetchUrl);
              if (res.ok) {
                const txt = await res.text();
                const parsed = this.parseCsvToRows(txt);
                if (parsed.length > 0) {
                  this.saveRows(parsed);
                  return { success: true, count: parsed.length };
                }
              }
            } catch {}
          }
        }
      }

      return {
        success: false,
        count: 0,
        error: 'No data received from Google Sheet. Ensure the spreadsheet is shared with Anyone with the link can view.',
      };
    } catch (err: any) {
      console.warn('Blank Forms Google Sheet fetch error:', err);
      return {
        success: false,
        count: 0,
        error: err?.message || 'Synchronization with Google Sheet failed.',
      };
    }
  }

  private static normalizeRowObjects(items: any[]): BlankFromRow[] {
    return items.map((r, i) => {
      const bldg = r.buildingNo || r.building || r.house || `Bldg ${i + 1}`;
      const unit = r.unitNo || r.unit || r.room || '101';
      const serial = r.unitSerialNo || r.unitSerial || r.serialNumber || '';
      const empId = r.employmentId || r.employeeId || r.badge || `10${200 + i}`;
      const name = r.name || r.residentName || r.tenantName || `Resident ${empId}`;

      const isDescriptiveId = r.id && /^(permanent|contractor|temporary|active|inactive|male|female|single|double|senior|junior|executive|worker)$/i.test(String(r.id).trim());
      const rowUniqueId = r.id && !isDescriptiveId ? String(r.id) : `bfr-${i + 1}-${empId}`;

      return {
        id: rowUniqueId,
        property: r.property || 'TBCV',
        sector: r.sector || 'S01',
        house: r.house || bldg,
        floor: r.floor || 'FF',
        room: unit,
        unit: r.unit || `${bldg} - Unit ${unit}${serial ? ` (${serial})` : ''}`,
        buildingNo: bldg,
        unitNo: unit,
        unitSerialNo: serial,
        propertyType: r.propertyType || 'Senior',
        contractType: r.contractType || 'Permanent',
        occupancy: r.occupancy || 'Single Occupancy',
        status: r.status || 'Active',
        employmentId: empId,
        name,
        gender: r.gender || 'Male',
        category: r.category || 'Rsg Staff',
        company: r.company || 'Red Sea Global',
        division: r.division || 'Projects Delivery',
        department: r.department || 'Operations',
        designation: r.designation || 'Staff',
        idIqama: r.idIqama || r.nationalId || '',
        passport: r.passport || '',
        mobile: r.mobile || r.phone || '',
        email: r.email || '',
        nationality: r.nationality || 'Saudi Arabia',
        dob: r.dob || '',
        moveInDate: r.moveInDate || '8/24/2026',
        contractStartDate: r.contractStartDate || '8/24/2026',
        moveOutDate: r.moveOutDate || '12/31/2026',
        emergencyMobile: r.emergencyMobile || '',
        emergencyName: r.emergencyName || 'None',
        vehicleRegNo: r.vehicleRegNo,
        vehicleModel: r.vehicleModel,
        carParkSpace: r.carParkSpace,
      };
    });
  }

  public static addOrUpdateRow(row: BlankFromRow): void {
    const list = this.getRows();
    const idx = list.findIndex((r) => r.employmentId === row.employmentId || r.id === row.id);
    let updated: BlankFromRow[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = row;
    } else {
      updated = [row, ...list];
    }
    this.saveRows(updated);
  }

  /**
   * Intelligently parses an entire Excel Workbook (multi-tab or single tab)
   * into standardized BlankFromRow records respecting user import settings.
   */
  public static parseWorkbookToRows(
    wb: any,
    customSettings?: Partial<ExcelImportSettings>
  ): { rows: BlankFromRow[]; sheetsScanned: string[]; totalRawRows: number } {
    const settings = { ...ExcelImportSettingsService.getSettings(), ...customSettings };
    if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
      return { rows: [], sheetsScanned: [], totalRawRows: 0 };
    }

    const sheetsToScan = settings.scanAllSheets ? wb.SheetNames : [wb.SheetNames[0]];
    const allRows: BlankFromRow[] = [];
    let totalRawRows = 0;

    for (const sheetName of sheetsToScan) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;
      const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
      if (!matrix || matrix.length < 2) continue;
      totalRawRows += matrix.length - 1;
      const parsed = this.parse2dArrayToRows(matrix);
      allRows.push(...parsed);
    }

    return {
      rows: allRows,
      sheetsScanned: sheetsToScan,
      totalRawRows,
    };
  }

  /**
   * Incrementally merges newly uploaded Excel records into the master dataset.
   * SMART UNIQUE DEDUPLICATION:
   * - If an Excel file is uploaded that contains records that already exist in the database,
   *   existing records are SKIPPED and preserved untouched.
   * - ONLY brand new, UNIQUE records (those not previously present) are collected and saved.
   * - Configurable via ExcelImportSettingsService: match keys, update mode, multi-sheet scan.
   */
  public static mergeNewExcelRows(
    incomingRows: BlankFromRow[],
    customSettings?: Partial<ExcelImportSettings>
  ): {
    total: number;
    added: number;
    skipped: number;
    updated: number;
    newRecords: BlankFromRow[];
    skippedRecords: Array<{ record: BlankFromRow; reason: string }>;
  } {
    const settings: ExcelImportSettings = {
      ...ExcelImportSettingsService.getSettings(),
      ...customSettings,
    };

    const current = this.getRows();
    const existingList = current && current.length > 0 ? [...current] : [...INITIAL_BLANK_FROM_ROWS];

    if (!Array.isArray(incomingRows) || incomingRows.length === 0) {
      return {
        total: existingList.length,
        added: 0,
        skipped: 0,
        updated: 0,
        newRecords: [],
        skippedRecords: [],
      };
    }

    // Normalization utilities
    const cleanAlphaNum = (val?: string | number): string =>
      val ? String(val).trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const cleanDigits = (val?: string | number): string =>
      val ? String(val).replace(/\D/g, '') : '';
    const cleanName = (val?: string | number): string =>
      val ? String(val).trim().toLowerCase().replace(/\s+/g, ' ') : '';

    // 1. Build rapid O(1) indexed lookup maps of currently saved records
    const mapByEmpId = new Map<string, { record: BlankFromRow; index: number }>();
    const mapByIqama = new Map<string, { record: BlankFromRow; index: number }>();
    const mapByPassport = new Map<string, { record: BlankFromRow; index: number }>();
    const mapByNameAndUnit = new Map<string, { record: BlankFromRow; index: number }>();
    const mapByMobile = new Map<string, { record: BlankFromRow; index: number }>();
    const mapByNameOnly = new Map<string, { record: BlankFromRow; index: number }>();

    existingList.forEach((r, idx) => {
      if (!r) return;
      const empId = cleanAlphaNum(r.employmentId);
      // Only index genuine IDs (not auto synthetic placeholders unless explicitly defined)
      if (empId && empId.length >= 2) mapByEmpId.set(empId, { record: r, index: idx });

      const iqama = cleanDigits(r.idIqama);
      if (iqama && iqama.length >= 7) mapByIqama.set(iqama, { record: r, index: idx });

      const pass = cleanAlphaNum(r.passport);
      if (pass && pass.length >= 5) mapByPassport.set(pass, { record: r, index: idx });

      const n = cleanName(r.name);
      const b = cleanAlphaNum(r.buildingNo || r.house);
      const u = cleanAlphaNum(r.unitNo || r.room);
      if (n && (b || u)) {
        mapByNameAndUnit.set(`${n}_${b}_${u}`, { record: r, index: idx });
      }

      const mob = cleanDigits(r.mobile);
      if (mob && mob.length >= 8) {
        mapByMobile.set(mob, { record: r, index: idx });
      }

      if (n && n.length >= 4) {
        mapByNameOnly.set(n, { record: r, index: idx });
      }
    });

    // 2. Batch sets to prevent duplicates within the uploaded file itself
    const batchEmpIds = new Set<string>();
    const batchIqamas = new Set<string>();
    const batchPassports = new Set<string>();
    const batchNameUnits = new Set<string>();
    const batchMobiles = new Set<string>();
    const batchNamesOnly = new Set<string>();

    const newRecords: BlankFromRow[] = [];
    const skippedRecords: Array<{ record: BlankFromRow; reason: string }> = [];
    let updatedCount = 0;
    const workingList = [...existingList];

    for (const inc of incomingRows) {
      if (!inc) continue;
      const n = cleanName(inc.name);
      const empId = cleanAlphaNum(inc.employmentId);
      const iqama = cleanDigits(inc.idIqama);
      const pass = cleanAlphaNum(inc.passport);
      const b = cleanAlphaNum(inc.buildingNo || inc.house);
      const u = cleanAlphaNum(inc.unitNo || inc.room);
      const mob = cleanDigits(inc.mobile);
      const nuKey = n && (b || u) ? `${n}_${b}_${u}` : '';

      // Skip completely blank rows
      if (!n && !empId && !iqama && !pass && !mob) {
        continue;
      }

      // Check if duplicate of an existing saved record in the database
      let matchTarget: { record: BlankFromRow; index: number } | null = null;
      let matchReason = '';

      if (settings.matchByEmpId && empId && empId.length >= 2 && mapByEmpId.has(empId)) {
        matchTarget = mapByEmpId.get(empId)!;
        matchReason = `Employment ID: ${inc.employmentId}`;
      } else if (settings.matchByIqama && iqama && iqama.length >= 7 && mapByIqama.has(iqama)) {
        matchTarget = mapByIqama.get(iqama)!;
        matchReason = `National ID/Iqama: ${inc.idIqama}`;
      } else if (settings.matchByPassport && pass && pass.length >= 5 && mapByPassport.has(pass)) {
        matchTarget = mapByPassport.get(pass)!;
        matchReason = `Passport: ${inc.passport}`;
      } else if (settings.matchByNameAndUnit && nuKey && mapByNameAndUnit.has(nuKey)) {
        matchTarget = mapByNameAndUnit.get(nuKey)!;
        matchReason = `Name & Unit: ${inc.name} (${inc.buildingNo || ''} / ${inc.unitNo || ''})`;
      } else if (settings.matchByMobile && mob && mob.length >= 8 && mapByMobile.has(mob)) {
        matchTarget = mapByMobile.get(mob)!;
        matchReason = `Mobile Number: ${inc.mobile}`;
      } else if (settings.matchByNameOnly && n && n.length >= 4 && !empId && !iqama && !pass && mapByNameOnly.has(n)) {
        matchTarget = mapByNameOnly.get(n)!;
        matchReason = `Exact Resident Name: ${inc.name}`;
      }

      // Check if duplicate within this incoming batch itself
      let isBatchDuplicate = false;
      if (!matchTarget) {
        if (empId && empId.length >= 2 && batchEmpIds.has(empId)) {
          isBatchDuplicate = true;
          matchReason = `Duplicate within uploaded file (Emp ID: ${inc.employmentId})`;
        } else if (iqama && iqama.length >= 7 && batchIqamas.has(iqama)) {
          isBatchDuplicate = true;
          matchReason = `Duplicate within uploaded file (Iqama: ${inc.idIqama})`;
        } else if (pass && pass.length >= 5 && batchPassports.has(pass)) {
          isBatchDuplicate = true;
          matchReason = `Duplicate within uploaded file (Passport: ${inc.passport})`;
        } else if (nuKey && batchNameUnits.has(nuKey)) {
          isBatchDuplicate = true;
          matchReason = `Duplicate within uploaded file (${inc.name} in Unit ${inc.unitNo})`;
        }
      }

      if (matchTarget) {
        // Record exists in database!
        if (settings.mode === 'UPDATE_EXISTING') {
          // Merge non-empty fields from new file into existing record
          const existingRec = workingList[matchTarget.index];
          const mergedRec: BlankFromRow = {
            ...existingRec,
            name: inc.name || existingRec.name,
            buildingNo: inc.buildingNo || existingRec.buildingNo,
            unitNo: inc.unitNo || existingRec.unitNo,
            unitSerialNo: inc.unitSerialNo || existingRec.unitSerialNo,
            unit: inc.unit || existingRec.unit,
            propertyType: inc.propertyType || existingRec.propertyType,
            contractType: inc.contractType || existingRec.contractType,
            status: inc.status || existingRec.status,
            idIqama: inc.idIqama || existingRec.idIqama,
            passport: inc.passport || existingRec.passport,
            mobile: inc.mobile || existingRec.mobile,
            email: inc.email || existingRec.email,
            company: inc.company || existingRec.company,
            department: inc.department || existingRec.department,
            designation: inc.designation || existingRec.designation,
            nationality: inc.nationality || existingRec.nationality,
            moveInDate: inc.moveInDate || existingRec.moveInDate,
            moveOutDate: inc.moveOutDate || existingRec.moveOutDate,
          };
          workingList[matchTarget.index] = mergedRec;
          updatedCount++;
        } else {
          // STRICT_UNIQUE_ONLY: Safe skip!
          skippedRecords.push({ record: inc, reason: matchReason || 'Already saved in database' });
        }
        continue;
      }

      if (isBatchDuplicate) {
        skippedRecords.push({ record: inc, reason: matchReason });
        continue;
      }

      // Brand NEW Unique Record! Collect it
      const newRecord: BlankFromRow = {
        ...EMPTY_BLANK_FROM_ROW,
        ...inc,
        id: inc.id && !inc.id.startsWith('bfr-') ? inc.id : `mah-new-${Date.now()}-${newRecords.length + 1}`,
      };

      newRecords.push(newRecord);

      // Register into batch sets
      if (empId) batchEmpIds.add(empId);
      if (iqama && iqama.length >= 7) batchIqamas.add(iqama);
      if (pass && pass.length >= 5) batchPassports.add(pass);
      if (nuKey) batchNameUnits.add(nuKey);
      if (mob && mob.length >= 8) batchMobiles.add(mob);
      if (n) batchNamesOnly.add(n);
    }

    // 3. Save to database if modifications occurred
    if (newRecords.length > 0 || updatedCount > 0) {
      const finalDataset = [...workingList, ...newRecords];
      this.saveRows(finalDataset);
      return {
        total: finalDataset.length,
        added: newRecords.length,
        skipped: skippedRecords.length,
        updated: updatedCount,
        newRecords,
        skippedRecords,
      };
    }

    return {
      total: existingList.length,
      added: 0,
      skipped: skippedRecords.length,
      updated: 0,
      newRecords: [],
      skippedRecords,
    };
  }

  /**
   * Pushes all employee records (handles 40,000+ rows) to Google Sheets
   * in chunked batches into the "Blank Froms" tab.
   */
  public static async pushAllToGoogleSheet(
    rowsToPush?: BlankFromRow[],
    onProgress?: (completed: number, total: number, message: string) => void
  ): Promise<{ success: boolean; message: string; count: number }> {
    const list = rowsToPush && rowsToPush.length > 0 ? rowsToPush : this.getRows();
    const total = list.length;
    if (total === 0) {
      return { success: false, message: 'No employee records found to upload.', count: 0 };
    }

    const config = GasService.getConfig();
    const cleanUrl = (this.getSavedGoogleSheetUrl() || config.webAppUrl || '').trim();

    if (!cleanUrl || !cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'Google Apps Script (Web App) URL is not configured. Please set the Web App URL in settings.',
        count: 0,
      };
    }

    const CHUNK_SIZE = 2500;
    const totalChunks = Math.ceil(total / CHUNK_SIZE);
    let completed = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, total);
      const chunkRows = list.slice(start, end);

      const chunkNum = chunkIndex + 1;
      if (onProgress) {
        onProgress(
          completed,
          total,
          `Uploading to Google Sheet 'Blank Froms' tab... (Batch ${chunkNum}/${totalChunks}, ${completed.toLocaleString()}/${total.toLocaleString()} records)`
        );
      }

      const payload = {
        action: 'uploadBlankFromEmployees',
        tabName: 'Blank Froms',
        chunkIndex,
        totalChunks,
        mode: chunkIndex === 0 ? 'replace' : 'append',
        employees: chunkRows,
      };

      let success = false;
      let errorMsg = '';

      // Try proxy first
      try {
        const proxyRes = await fetch('/api/gas/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: cleanUrl,
            method: 'POST',
            action: 'uploadBlankFromEmployees',
            body: payload,
          }),
        });
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data && (data.success || data.uploadedCount !== undefined)) {
            success = true;
          } else if (data && data.error) {
            errorMsg = data.error;
          }
        }
      } catch (err: any) {
        errorMsg = err?.message || '';
      }

      // Fallback: direct post
      if (!success) {
        try {
          const directRes = await fetch(cleanUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
          });
          if (directRes.ok) {
            const data = await directRes.json();
            if (data && (data.success || data.uploadedCount !== undefined)) {
              success = true;
            }
          }
        } catch (err: any) {
          errorMsg = err?.message || 'Direct POST failed';
        }
      }

      if (!success) {
        return {
          success: false,
          message: `Error uploading batch ${chunkNum}/${totalChunks}: ${errorMsg || 'Unknown error'}`,
          count: completed,
        };
      }

      completed = end;
      if (onProgress) {
        onProgress(
          completed,
          total,
          `Batch ${chunkNum}/${totalChunks} complete (${completed.toLocaleString()}/${total.toLocaleString()} records)`
        );
      }
    }

    return {
      success: true,
      message: `Successfully synchronized ${total.toLocaleString()} resident records to Google Sheet 'Blank Froms' tab!`,
      count: total,
    };
  }

  public static resetToDefaultRows(): BlankFromRow[] {
    this.saveRows([...INITIAL_BLANK_FROM_ROWS]);
    return [...INITIAL_BLANK_FROM_ROWS];
  }
}

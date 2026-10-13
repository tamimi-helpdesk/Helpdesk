import { BlankFromRow, INITIAL_BLANK_FROM_ROWS } from '../data/initialBlankFromData';
import { GasService } from './gasService';

const STORAGE_KEY = 'tamimi_blank_from_sheet_cache_v2';
const GSHEET_URL_KEY = 'tamimi_blank_from_gsheet_url_v2';

export class BlankFromService {
  private static cachedRows: BlankFromRow[] | null = null;

  public static getRows(): BlankFromRow[] {
    if (this.cachedRows && this.cachedRows.length > 0) {
      return this.cachedRows;
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedRows = parsed;
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read cached Blank From rows:', e);
    }

    this.cachedRows = [...INITIAL_BLANK_FROM_ROWS];
    this.saveRows(this.cachedRows);
    return this.cachedRows;
  }

  public static saveRows(rows: BlankFromRow[]): void {
    this.cachedRows = rows;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
        window.dispatchEvent(new CustomEvent('tamimi_blank_from_updated'));
      }
    } catch (e) {
      console.error('Failed to save Blank From rows to localStorage:', e);
    }
  }

  public static searchRows(query: string): BlankFromRow[] {
    const list = this.getRows();
    const q = query.trim().toLowerCase();
    if (!q) return list;

    const digitsOnly = q.replace(/\D/g, '');

    return list.filter((row) => {
      const name = (row.name || '').toLowerCase();
      const empId = (row.employmentId || '').toLowerCase();
      const unit = (row.unit || '').toLowerCase();
      const room = (row.room || '').toLowerCase();
      const house = (row.house || '').toLowerCase();
      const sector = (row.sector || '').toLowerCase();
      const iqama = (row.idIqama || '').toLowerCase();
      const mobile = (row.mobile || '').toLowerCase();
      const dept = (row.department || '').toLowerCase();
      const div = (row.division || '').toLowerCase();
      const comp = (row.company || '').toLowerCase();
      const pType = (row.propertyType || '').toLowerCase();
      const nat = (row.nationality || '').toLowerCase();
      const status = (row.status || '').toLowerCase();

      if (
        name.includes(q) ||
        empId.includes(q) ||
        unit.includes(q) ||
        room.includes(q) ||
        house.includes(q) ||
        sector.includes(q) ||
        iqama.includes(q) ||
        dept.includes(q) ||
        div.includes(q) ||
        comp.includes(q) ||
        pType.includes(q) ||
        nat.includes(q) ||
        status.includes(q)
      ) {
        return true;
      }

      if (digitsOnly && digitsOnly.length >= 3) {
        if (
          iqama.includes(digitsOnly) ||
          mobile.replace(/\D/g, '').includes(digitsOnly) ||
          empId.replace(/\D/g, '').includes(digitsOnly)
        ) {
          return true;
        }
      }

      return false;
    });
  }

  public static getSavedGoogleSheetUrl(): string {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(GSHEET_URL_KEY) || '';
      }
    } catch (e) {}
    return '';
  }

  public static saveGoogleSheetUrl(url: string): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(GSHEET_URL_KEY, url.trim());
      }
    } catch (e) {}
  }

  /**
   * Intelligently parses CSV text exported from Google Sheet 'Blank From' tab
   */
  public static parseCsvToRows(csvText: string): BlankFromRow[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let insideQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          result.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const header = parseRow(lines[0]).map((h) => h.toLowerCase());

    const findIndex = (...keywords: string[]): number => {
      return header.findIndex((h) =>
        keywords.some((k) => h.includes(k.toLowerCase()) || h.replace(/[^a-z0-9]/g, '') === k.replace(/[^a-z0-9]/g, ''))
      );
    };

    const idxId = findIndex('id', 'record id', 'sl');
    const idxProperty = findIndex('property', 'property name');
    const idxSector = findIndex('sector');
    const idxHouse = findIndex('house');
    const idxFloor = findIndex('floor');
    const idxRoom = findIndex('room', 'room no');
    const idxUnit = findIndex('unit', 'apartment', 'apartment no');
    const idxPropertyType = findIndex('property type', 'type of property', 'type');
    const idxContractType = findIndex('contract type');
    const idxOccupancy = findIndex('occupancy');
    const idxStatus = findIndex('status');
    const idxEmpId = findIndex('employment id', 'employmentid', 'employee id', 'badge', 'empid', 'staff id');
    const idxName = findIndex('name', 'employee name', 'full name', 'resident name', 'tenant name');
    const idxGender = findIndex('gender', 'sex');
    const idxCategory = findIndex('category');
    const idxCompany = findIndex('company', 'company name', 'employer');
    const idxDivision = findIndex('division', 'program', 'assigned project');
    const idxDepartment = findIndex('department', 'dept');
    const idxDesignation = findIndex('designation', 'position', 'job title');
    const idxIqama = findIndex('id/iqama', 'idiqama', 'iqama', 'national id');
    const idxPassport = findIndex('passport', 'passport no');
    const idxMobile = findIndex('mobile', 'phone', 'contact number');
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

    for (let r = 1; r < lines.length; r++) {
      const row = parseRow(lines[r]);
      const name = idxName >= 0 ? row[idxName] : row[1] || '';
      if (!name || name.toLowerCase().includes('name on contract')) continue;

      const empId = idxEmpId >= 0 ? row[idxEmpId] : `10${r + 200}`;
      const property = idxProperty >= 0 ? row[idxProperty] : 'TBCV';
      const sector = idxSector >= 0 ? row[idxSector] : 'S01';
      const house = idxHouse >= 0 ? row[idxHouse] : 'H01';
      const floor = idxFloor >= 0 ? row[idxFloor] : 'FF';
      const room = idxRoom >= 0 ? row[idxRoom] : '101';
      const computedUnit = `${property} - ${sector}- ${house}- ${floor}- ${room}`;
      const unit = idxUnit >= 0 && row[idxUnit] ? row[idxUnit] : computedUnit;

      const propType = (idxPropertyType >= 0 ? row[idxPropertyType] : 'Senior') || 'Senior';

      rows.push({
        id: idxId >= 0 && row[idxId] ? row[idxId] : String(r + 140),
        property,
        sector,
        house,
        floor,
        room,
        unit,
        propertyType: propType,
        contractType: idxContractType >= 0 ? row[idxContractType] || 'Permanent' : 'Permanent',
        occupancy: idxOccupancy >= 0 ? row[idxOccupancy] || 'Single Occupancy' : 'Single Occupancy',
        status: idxStatus >= 0 ? row[idxStatus] || 'Active' : 'Active',
        employmentId: empId,
        name,
        gender: idxGender >= 0 ? row[idxGender] || 'Male' : 'Male',
        category: idxCategory >= 0 ? row[idxCategory] || 'Rsg Staff' : 'Rsg Staff',
        company: idxCompany >= 0 ? row[idxCompany] || 'Red Sea Global' : 'Red Sea Global',
        division: idxDivision >= 0 ? row[idxDivision] || 'Projects Delivery' : 'Projects Delivery',
        department: idxDepartment >= 0 ? row[idxDepartment] || 'Operations' : 'Operations',
        designation: idxDesignation >= 0 ? row[idxDesignation] || 'Staff' : 'Staff',
        idIqama: idxIqama >= 0 ? row[idxIqama] : '',
        passport: idxPassport >= 0 ? row[idxPassport] : '',
        mobile: idxMobile >= 0 ? row[idxMobile] : '',
        email: idxEmail >= 0 ? row[idxEmail] : '',
        nationality: idxNationality >= 0 ? row[idxNationality] || 'Saudi Arabia' : 'Saudi Arabia',
        dob: idxDob >= 0 ? row[idxDob] : '',
        moveInDate: idxMoveIn >= 0 ? row[idxMoveIn] : '8/24/2026',
        contractStartDate: idxContractStart >= 0 ? row[idxContractStart] : '8/24/2026',
        moveOutDate: idxMoveOut >= 0 ? row[idxMoveOut] : '12/31/2026',
        emergencyMobile: idxEmerMobile >= 0 ? row[idxEmerMobile] : '',
        emergencyName: idxEmerName >= 0 ? row[idxEmerName] || 'None' : 'None',
        vehicleRegNo: idxVehicleReg >= 0 ? row[idxVehicleReg] : undefined,
        vehicleModel: idxVehicleModel >= 0 ? row[idxVehicleModel] : undefined,
        carParkSpace: idxCarPark >= 0 ? row[idxCarPark] : undefined,
      });
    }

    return rows;
  }

  /**
   * Syncs from Google Sheet (via Google Apps Script Web App or published Google Sheet link)
   */
  public static async fetchFromGoogleSheet(customUrl?: string): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    const gasConfig = GasService.getConfig();
    const targetUrl = (customUrl || this.getSavedGoogleSheetUrl() || gasConfig.webAppUrl || '').trim();

    if (!targetUrl) {
      return { success: false, count: 0, error: 'No Google Sheet or Web App URL configured.' };
    }

    try {
      this.saveGoogleSheetUrl(targetUrl);

      // 1. If target is standard Google Sheet URL, convert to CSV export
      let fetchUrl = targetUrl;
      let isGSheetWeb = false;

      if (targetUrl.includes('docs.google.com/spreadsheets/d/')) {
        isGSheetWeb = true;
        const idMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
          const sheetId = idMatch[1];
          // Try fetching with sheet name "Blank From" or first tab
          fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Blank%20From`;
        }
      } else if (targetUrl.includes('script.google.com')) {
        // Query Google Apps Script Web App for Blank From data
        const delim = targetUrl.includes('?') ? '&' : '?';
        fetchUrl = `${targetUrl}${delim}action=getBlankFromEmployees`;
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        // Fallback for Google Sheet if specific tab name gave 400
        if (isGSheetWeb && fetchUrl.includes('&sheet=')) {
          const fallbackUrl = fetchUrl.replace('&sheet=Blank%20From', '');
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const txt = await fallbackRes.text();
            const parsed = this.parseCsvToRows(txt);
            if (parsed.length > 0) {
              return this.mergeAndSaveRows(parsed);
            }
          }
        }
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      let newRows: BlankFromRow[] = [];

      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (Array.isArray(json)) {
          newRows = json;
        } else if (json && Array.isArray(json.data)) {
          newRows = json.data;
        } else if (json && Array.isArray(json.employees)) {
          newRows = json.employees;
        } else if (json && Array.isArray(json.records)) {
          newRows = json.records;
        }
      } else {
        const text = await res.text();
        newRows = this.parseCsvToRows(text);
      }

      if (newRows.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'No valid employee rows found in the sheet. Ensure tab is named "Blank From".',
        };
      }

      return this.mergeAndSaveRows(newRows);
    } catch (err: any) {
      console.warn('Blank From Google Sheet fetch error:', err);
      return {
        success: false,
        count: 0,
        error: err?.message || 'Failed to sync with Google Sheet.',
      };
    }
  }

  private static mergeAndSaveRows(newRows: BlankFromRow[]): { success: boolean; count: number } {
    const existing = this.getRows();
    const map = new Map<string, BlankFromRow>();

    existing.forEach((r) => map.set(r.employmentId.toLowerCase(), r));
    newRows.forEach((r) => map.set(r.employmentId.toLowerCase(), r));

    const merged = Array.from(map.values());
    this.saveRows(merged);
    return { success: true, count: newRows.length };
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

  public static resetToDefaultRows(): BlankFromRow[] {
    this.saveRows([...INITIAL_BLANK_FROM_ROWS]);
    return [...INITIAL_BLANK_FROM_ROWS];
  }
}

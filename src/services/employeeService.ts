import { EmployeeRecord } from '../types/autoForm';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';

const STORAGE_KEY = 'tamimi_employees_sheet_cache_v2';
const GSHEET_URL_KEY = 'tamimi_employee_gsheet_source_url';

export class EmployeeService {
  private static cachedEmployees: EmployeeRecord[] | null = null;

  public static getEmployees(): EmployeeRecord[] {
    if (this.cachedEmployees && this.cachedEmployees.length > 0) {
      return this.cachedEmployees;
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedEmployees = parsed;
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read cached employees:', e);
    }

    this.cachedEmployees = [...INITIAL_EMPLOYEES];
    this.saveEmployees(this.cachedEmployees);
    return this.cachedEmployees;
  }

  public static saveEmployees(employees: EmployeeRecord[]): void {
    this.cachedEmployees = employees;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
        window.dispatchEvent(new CustomEvent('tamimi_employees_updated'));
      }
    } catch (e) {
      console.error('Failed to save employees to localStorage:', e);
    }
  }

  public static searchEmployees(query: string): EmployeeRecord[] {
    const list = this.getEmployees();
    const q = query.trim().toLowerCase();
    if (!q) return list;

    const digitsOnly = q.replace(/\D/g, '');

    return list.filter((emp) => {
      const name = (emp.fullName || '').toLowerCase();
      const badge = (emp.badgeNumber || '').toLowerCase();
      const iqama = (emp.iqamaNumber || '').toLowerCase();
      const phone = (emp.phoneNumber || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const room = (emp.roomNumber || '').toLowerCase();
      const nat = (emp.nationality || '').toLowerCase();

      if (
        name.includes(q) ||
        badge.includes(q) ||
        iqama.includes(q) ||
        dept.includes(q) ||
        desig.includes(q) ||
        room.includes(q) ||
        nat.includes(q)
      ) {
        return true;
      }

      if (digitsOnly && digitsOnly.length >= 3) {
        if (
          iqama.includes(digitsOnly) ||
          phone.replace(/\D/g, '').includes(digitsOnly) ||
          badge.replace(/\D/g, '').includes(digitsOnly)
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
   * Intelligently parses CSV text from Google Sheet export or file
   */
  public static parseCsvToEmployees(csvText: string): EmployeeRecord[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    // Simple CSV parser supporting quotes
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

    // Map column indexes by header keywords
    const findIndex = (...keywords: string[]): number => {
      return header.findIndex((h) => keywords.some((k) => h.includes(k.toLowerCase())));
    };

    const idxName = findIndex('name', 'employee name', 'full name', 'worker');
    const idxBadge = findIndex('badge', 'emp id', 'empid', 'id', 'employee id', 'staff id');
    const idxDesig = findIndex('designation', 'position', 'job title', 'role', 'trade');
    const idxDept = findIndex('department', 'dept', 'division', 'section');
    const idxNat = findIndex('nationality', 'country', 'origin');
    const idxIqama = findIndex('iqama', 'national id', 'passport', 'id number');
    const idxPhone = findIndex('phone', 'mobile', 'contact', 'telephone');
    const idxRoom = findIndex('room', 'accommodation', 'bed', 'building', 'flat');
    const idxEmail = findIndex('email', 'mail');
    const idxCompany = findIndex('company', 'contractor', 'employer');

    const employees: EmployeeRecord[] = [];

    for (let r = 1; r < lines.length; r++) {
      const row = parseRow(lines[r]);
      const name = idxName >= 0 ? row[idxName] : row[1] || '';
      if (!name || name.toLowerCase().includes('name')) continue;

      const badge = idxBadge >= 0 ? row[idxBadge] : row[0] || `TGM-${1000 + r}`;
      const desig = idxDesig >= 0 ? row[idxDesig] : 'Staff';
      const dept = idxDept >= 0 ? row[idxDept] : 'OPERATIONS';
      const nat = idxNat >= 0 ? row[idxNat] : 'General';
      const iqama = idxIqama >= 0 ? row[idxIqama] : '';
      const phone = idxPhone >= 0 ? row[idxPhone] : '';
      const room = idxRoom >= 0 ? row[idxRoom] : '';
      const email = idxEmail >= 0 ? row[idxEmail] : '';
      const company = idxCompany >= 0 ? row[idxCompany] : 'Tamimi Global Co. Ltd';

      employees.push({
        id: `EMP-${badge.replace(/[^a-zA-Z0-9]/g, '') || r}`,
        badgeNumber: badge,
        fullName: name,
        designation: desig,
        department: dept.toUpperCase(),
        nationality: nat,
        iqamaNumber: iqama,
        phoneNumber: phone,
        email,
        company,
        roomNumber: room,
        campLocation: 'Amaala Construction Village',
        status: 'ACTIVE',
      });
    }

    return employees;
  }

  /**
   * Syncs from a published Google Sheet CSV URL or Google Apps Script Web App
   */
  public static async fetchFromGoogleSheet(sourceUrl?: string): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    const url = (sourceUrl || this.getSavedGoogleSheetUrl()).trim();
    if (!url) {
      return { success: false, count: 0, error: 'No Google Sheet URL provided.' };
    }

    try {
      this.saveGoogleSheetUrl(url);

      // Check if it's a standard Google Sheet sharing link, convert to CSV export if needed
      let fetchUrl = url;
      if (url.includes('docs.google.com/spreadsheets/d/')) {
        const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
          const sheetId = idMatch[1];
          // Try fetching first sheet as CSV
          fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        }
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      let newEmployees: EmployeeRecord[] = [];

      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (Array.isArray(json)) {
          newEmployees = json;
        } else if (json && Array.isArray(json.employees)) {
          newEmployees = json.employees;
        } else if (json && Array.isArray(json.data)) {
          newEmployees = json.data;
        }
      } else {
        const text = await res.text();
        newEmployees = this.parseCsvToEmployees(text);
      }

      if (newEmployees.length === 0) {
        return {
          success: false,
          count: 0,
          error: 'No valid employee rows found in the sheet. Please ensure columns include Name, Badge/ID, Department, etc.',
        };
      }

      // Merge with existing
      const existing = this.getEmployees();
      const map = new Map<string, EmployeeRecord>();
      existing.forEach((e) => map.set(e.badgeNumber.toLowerCase(), e));
      newEmployees.forEach((e) => map.set(e.badgeNumber.toLowerCase(), e));

      const merged = Array.from(map.values());
      this.saveEmployees(merged);

      return { success: true, count: newEmployees.length };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        error: err?.message || 'Failed to fetch from Google Sheet. Ensure sheet is set to Anyone with the link can view.',
      };
    }
  }

  public static resetToDefaultEmployees(): EmployeeRecord[] {
    this.saveEmployees([...INITIAL_EMPLOYEES]);
    return [...INITIAL_EMPLOYEES];
  }
}

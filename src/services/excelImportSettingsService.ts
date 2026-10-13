export interface ExcelImportSettings {
  /**
   * Deduplication Mode:
   * - STRICT_UNIQUE_ONLY: Skips all duplicates. Saves ONLY brand new unique records. (Default & Recommended)
   * - UPDATE_EXISTING: Updates existing matched records with new data + adds new unique records.
   * - APPEND_ALL: Appends all records without checking duplicates.
   */
  mode: 'STRICT_UNIQUE_ONLY' | 'UPDATE_EXISTING' | 'APPEND_ALL';

  /** Match by Employment / Badge ID (e.g. 116423, TGM-1001) */
  matchByEmpId: boolean;

  /** Match by National ID / Saudi Iqama (e.g. 1092084308) */
  matchByIqama: boolean;

  /** Match by Passport Number */
  matchByPassport: boolean;

  /** Match by Full Resident Name + Building + Unit/Room */
  matchByNameAndUnit: boolean;

  /** Match by Mobile Contact Number */
  matchByMobile: boolean;

  /** Match by Normalized Full Name (fallback if no ID is present) */
  matchByNameOnly: boolean;

  /** Scan all worksheets across the Excel workbook, or only the first sheet */
  scanAllSheets: boolean;

  /** Show interactive review & confirmation modal before saving new rows to database */
  showPreviewBeforeSave: boolean;

  /** Automatically split compound room strings like "D01-106" or "I08-012" into Building and Room */
  autoExtractBuildingFromRoom: boolean;

  /** Normalize names to Title Case, trim spaces, normalize phone numbers */
  normalizeText: boolean;
}

export const DEFAULT_EXCEL_IMPORT_SETTINGS: ExcelImportSettings = {
  mode: 'STRICT_UNIQUE_ONLY',
  matchByEmpId: true,
  matchByIqama: true,
  matchByPassport: true,
  matchByNameAndUnit: true,
  matchByMobile: true,
  matchByNameOnly: true,
  scanAllSheets: true,
  showPreviewBeforeSave: true,
  autoExtractBuildingFromRoom: true,
  normalizeText: true,
};

const STORAGE_KEY = 'tamimi_excel_import_settings_v2';

export class ExcelImportSettingsService {
  private static cachedSettings: ExcelImportSettings | null = null;

  public static getSettings(): ExcelImportSettings {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.cachedSettings = { ...DEFAULT_EXCEL_IMPORT_SETTINGS, ...parsed };
          return this.cachedSettings;
        }
      }
    } catch (e) {
      console.warn('Error reading Excel import settings:', e);
    }

    this.cachedSettings = { ...DEFAULT_EXCEL_IMPORT_SETTINGS };
    return this.cachedSettings;
  }

  public static saveSettings(settings: Partial<ExcelImportSettings>): ExcelImportSettings {
    const current = this.getSettings();
    const updated: ExcelImportSettings = { ...current, ...settings };
    this.cachedSettings = updated;

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tamimi_excel_import_settings_updated', { detail: updated }));
      }
    } catch (e) {
      console.error('Error saving Excel import settings:', e);
    }

    return updated;
  }

  public static resetToDefaults(): ExcelImportSettings {
    this.cachedSettings = { ...DEFAULT_EXCEL_IMPORT_SETTINGS };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedSettings));
        window.dispatchEvent(new CustomEvent('tamimi_excel_import_settings_updated', { detail: this.cachedSettings }));
      }
    } catch (e) {}
    return this.cachedSettings;
  }
}

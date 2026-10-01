import {
  FormTemplateDefinition,
  FormCategory,
  FormTemplateField,
  CustomTableColumn,
  CustomTableDefinition,
} from '../types/blankForms';

export interface FormImportResult {
  success: boolean;
  template?: FormTemplateDefinition;
  warnings?: string[];
  insights?: string[];
  rawTextSummary?: string;
  detectedType: 'EXCEL' | 'WORD' | 'CSV' | 'JSON' | 'TEXT' | 'UNKNOWN';
}

/**
 * Smart Auto-Categorization based on keyword scoring
 */
export function inferCategoryFromContent(text: string): {
  category: FormCategory;
  categoryLabel: string;
  iconName: string;
  accentColor: string;
} {
  const lower = text.toLowerCase();

  const scores: Record<FormCategory, number> = {
    ALL: 0,
    RECEPTION_HELPDESK: 0,
    HR_ADMIN: 0,
    STORE_MATERIAL: 0,
    OPERATIONS: 0,
    LOGISTICS_SECURITY: 0,
    ACCOMMODATION_HK: 0,
    RECREATION_FACILITIES: 0,
    CLEARANCE: 0,
    LEGAL_COMPLIANCE: 0,
  };

  // Keywords weights
  if (/visitor|guest|reception|front desk|parcel|courier|key monitor|inquiry|complaint|lost and found/i.test(lower)) {
    scores.RECEPTION_HELPDESK += 10;
  }
  if (/attendance|roster|shift|employee|badge|hr|personnel|leave|overtime|timesheet|salary|job description|designation|worker/i.test(lower)) {
    scores.HR_ADMIN += 10;
  }
  if (/material|store|requisition|inventory|stock|issue slip|bin card|spare part|ppe|safety gear|tool|hardware/i.test(lower)) {
    scores.STORE_MATERIAL += 10;
  }
  if (/asset handover|asset transfer|maintenance|work order|facility|operations|generator|hvac|plumbing|kitchen|camp/i.test(lower)) {
    scores.OPERATIONS += 10;
  }
  if (/gate pass|dispatch|logistics|vehicle|transport|cargo|movement|driver|truck|delivery|waybill/i.test(lower)) {
    scores.LOGISTICS_SECURITY += 10;
  }
  if (/linen|laundry|room inspection|bedding|cleaning|housekeeping|accommodation|dormitory|janitorial/i.test(lower)) {
    scores.ACCOMMODATION_HK += 10;
  }
  if (/golf|padel|gym|sports|fitness|recreation|court|simulator|game room/i.test(lower)) {
    scores.RECREATION_FACILITIES += 10;
  }
  if (/clearance|exit|resignation|turnover|handover clearance|settlement|final exit|surrender/i.test(lower)) {
    scores.CLEARANCE += 10;
  }
  if (/hse|safety|hazard|ptw|permit to work|risk|compliance|audit|inspection checklist|incident|hygiene|iso/i.test(lower)) {
    scores.LEGAL_COMPLIANCE += 10;
  }

  // Find max category
  let maxCat: FormCategory = 'OPERATIONS';
  let maxScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore && cat !== 'ALL') {
      maxScore = score;
      maxCat = cat as FormCategory;
    }
  }

  const categoryMeta: Record<
    FormCategory,
    { label: string; icon: string; color: string }
  > = {
    ALL: { label: 'General Form', icon: 'FileText', color: 'blue' },
    RECEPTION_HELPDESK: { label: 'Reception & Helpdesk', icon: 'UserCheck', color: 'blue' },
    HR_ADMIN: { label: 'HR & Personnel', icon: 'Users', color: 'indigo' },
    STORE_MATERIAL: { label: 'Store & Materials', icon: 'Box', color: 'emerald' },
    OPERATIONS: { label: 'Operations & Facilities', icon: 'Layers', color: 'cyan' },
    LOGISTICS_SECURITY: { label: 'Logistics & Security', icon: 'Shield', color: 'amber' },
    ACCOMMODATION_HK: { label: 'Accommodation & Housekeeping', icon: 'Building', color: 'teal' },
    RECREATION_FACILITIES: { label: 'Recreation & Sports Facilities', icon: 'Activity', color: 'purple' },
    CLEARANCE: { label: 'Clearance & Exit', icon: 'ClipboardCheck', color: 'rose' },
    LEGAL_COMPLIANCE: { label: 'HSE & Compliance', icon: 'ShieldCheck', color: 'orange' },
  };

  const meta = categoryMeta[maxCat] || categoryMeta.OPERATIONS;

  return {
    category: maxCat,
    categoryLabel: meta.label,
    iconName: meta.icon,
    accentColor: meta.color,
  };
}

/**
 * Clean string utility: removes messy formatting, extra tabs/newlines
 */
function cleanText(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Convert arbitrary header label to safe key
 */
function toFieldKey(label: string, index: number): string {
  const cleaned = label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+([a-z0-9])/g, (_, ch) => ch.toUpperCase());
  return cleaned || `col_${index + 1}`;
}

/**
 * Infer field input type
 */
function inferFieldType(
  label: string,
  sampleValue?: any
): 'text' | 'date' | 'time' | 'select' | 'textarea' | 'number' {
  const lbl = label.toLowerCase();
  const val = String(sampleValue || '').toLowerCase();

  if (/date|dt|day/i.test(lbl) || /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(val)) {
    return 'date';
  }
  if (/time|hour|shift time/i.test(lbl) || /^\d{1,2}:\d{2}(\s?[ap]m)?$/i.test(val)) {
    return 'time';
  }
  if (/qty|quantity|amount|total|hours|ot|price|rate|cost|count|weight/i.test(lbl)) {
    return 'number';
  }
  if (/status|condition|decision|passed|action|priority|level|shift|category/i.test(lbl)) {
    return 'select';
  }
  if (/remarks|description|purpose|notes|scope|justification|details|findings/i.test(lbl)) {
    return 'textarea';
  }
  return 'text';
}

/**
 * Main Service: Process Excel Workbook (.xlsx, .xls, .csv)
 */
export async function parseExcelToFormTemplate(
  file: File | ArrayBuffer,
  fileName: string
): Promise<FormImportResult> {
  try {
    const XLSX = await import('xlsx');
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        detectedType: 'EXCEL',
        warnings: ['The uploaded Excel workbook contains no valid sheets.'],
      };
    }

    // Pick first non-empty sheet
    let sheetName = workbook.SheetNames[0];
    let sheet = workbook.Sheets[sheetName];
    let rawGrid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // If first sheet is empty, check others
    if (rawGrid.length === 0) {
      for (const name of workbook.SheetNames) {
        const altSheet = workbook.Sheets[name];
        const altGrid: any[][] = XLSX.utils.sheet_to_json(altSheet, { header: 1, defval: '' });
        if (altGrid.length > 0) {
          sheetName = name;
          sheet = altSheet;
          rawGrid = altGrid;
          break;
        }
      }
    }

    if (rawGrid.length === 0) {
      return {
        success: false,
        detectedType: 'EXCEL',
        warnings: ['All sheets in the Excel workbook are empty.'],
      };
    }

    // Clean rows
    const cleanedGrid = rawGrid
      .map((row) => row.map(cleanText))
      .filter((row) => row.some((cell) => cell.length > 0));

    return alignAndConstructTemplate({
      sourceType: 'EXCEL',
      fileName,
      cleanedGrid,
      sheetTitle: sheetName,
    });
  } catch (error: any) {
    console.error('Excel parse error:', error);
    return {
      success: false,
      detectedType: 'EXCEL',
      warnings: [`Failed to parse Excel file: ${error.message || 'Corrupted or unsupported format'}`],
    };
  }
}

/**
 * Main Service: Process Word Document (.docx)
 */
export async function parseWordToFormTemplate(
  file: File | ArrayBuffer,
  fileName: string
): Promise<FormImportResult> {
  try {
    const mammothModule = await import('mammoth');
    const mammoth = (mammothModule as any).default || mammothModule;
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlResult.value, 'text/html');

    // Extract Headings / Title
    let extractedTitle = '';
    const h1 = doc.querySelector('h1, h2, h3');
    if (h1 && h1.textContent?.trim()) {
      extractedTitle = h1.textContent.trim();
    } else {
      const firstBold = doc.querySelector('strong, b, p');
      if (firstBold && firstBold.textContent?.trim()) {
        extractedTitle = firstBold.textContent.trim();
      }
    }

    // Extract Tables
    const tables = doc.querySelectorAll('table');
    let extractedGrid: string[][] = [];

    if (tables.length > 0) {
      // Find largest table
      let bestTable: HTMLTableElement = tables[0];
      let maxCells = 0;
      tables.forEach((tbl) => {
        const cellCount = tbl.querySelectorAll('td, th').length;
        if (cellCount > maxCells) {
          maxCells = cellCount;
          bestTable = tbl;
        }
      });

      const rows = bestTable.querySelectorAll('tr');
      rows.forEach((tr) => {
        const cells = tr.querySelectorAll('th, td');
        const rowData: string[] = [];
        cells.forEach((td) => {
          rowData.push(cleanText(td.textContent));
        });
        if (rowData.some((c) => c.length > 0)) {
          extractedGrid.push(rowData);
        }
      });
    }

    // Extract Key-Value pairs from paragraphs
    const paragraphs = doc.querySelectorAll('p, li');
    const extractedKeyValues: { key: string; value: string }[] = [];

    paragraphs.forEach((p) => {
      const text = cleanText(p.textContent);
      if (!text) return;

      // Matches "Label: Value" or "Label [_____]" or "Label -"
      const match = text.match(/^([A-Za-z0-9\s/&#_\-()]{2,35})[:\-=_\.]{1,2}\s*(.*)$/);
      if (match && match[1] && match[1].length < 35) {
        const label = match[1].trim();
        const value = match[2]?.trim() || '';
        // Avoid common long sentences
        if (!label.includes('http') && !label.includes('tamimi global') && !label.includes('red sea')) {
          extractedKeyValues.push({ key: label, value });
        }
      }
    });

    return alignAndConstructTemplate({
      sourceType: 'WORD',
      fileName,
      extractedTitle,
      rawText: textResult.value,
      cleanedGrid: extractedGrid,
      extractedKeyValues,
    });
  } catch (error: any) {
    console.error('Word docx parse error:', error);
    return {
      success: false,
      detectedType: 'WORD',
      warnings: [`Failed to parse Word (.docx) document: ${error.message || 'Invalid or encrypted file'}`],
    };
  }
}

/**
 * Align and construct fully compliant FormTemplateDefinition
 */
interface AlignmentPayload {
  sourceType: 'EXCEL' | 'WORD' | 'CSV';
  fileName: string;
  sheetTitle?: string;
  extractedTitle?: string;
  rawText?: string;
  cleanedGrid?: string[][];
  extractedKeyValues?: { key: string; value: string }[];
}

export function alignAndConstructTemplate(payload: AlignmentPayload): FormImportResult {
  const {
    sourceType,
    fileName,
    sheetTitle,
    extractedTitle,
    rawText = '',
    cleanedGrid = [],
    extractedKeyValues = [],
  } = payload;

  const insights: string[] = [];
  const warnings: string[] = [];

  // 1. SMART TITLE INFERENCE & CLEANUP
  let title = '';
  if (extractedTitle && extractedTitle.length > 3 && extractedTitle.length < 80) {
    title = extractedTitle;
  } else if (cleanedGrid.length > 0 && cleanedGrid[0].length === 1 && cleanedGrid[0][0].length > 3) {
    title = cleanedGrid[0][0];
  } else if (sheetTitle && !/^sheet\d+$/i.test(sheetTitle)) {
    title = sheetTitle;
  } else {
    // Derive from file name
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[_\-+]/g, ' ');
    title = baseName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Remove corporate boilerplate from title if present
  title = title
    .replace(/^tamimi global\s*(company)?\s*(-|—|:)?/i, '')
    .replace(/^tafga\s*(-|—|:)?/i, '')
    .trim();

  if (!title) title = 'Custom Enterprise Operational Record Form';

  insights.push(`Detected Form Title: "${title}"`);

  // 2. INFER CATEGORY & DEPARTMENT
  const combinedText = `${title} ${fileName} ${rawText} ${cleanedGrid.map((r) => r.join(' ')).join(' ')}`;
  const { category, categoryLabel, iconName, accentColor } = inferCategoryFromContent(combinedText);
  insights.push(`Auto-Classified Category: ${categoryLabel}`);

  // Inferred Department
  let department = 'Enterprise Operations & Facilities Management';
  if (category === 'RECEPTION_HELPDESK') department = 'Front Desk & Guest Services Division';
  if (category === 'HR_ADMIN') department = 'Human Resources & Workforce Administration';
  if (category === 'STORE_MATERIAL') department = 'Materials Control & Central Warehousing';
  if (category === 'OPERATIONS') department = 'Camp Operations & Facilities Division';
  if (category === 'LOGISTICS_SECURITY') department = 'Security & Fleet Logistics Department';
  if (category === 'ACCOMMODATION_HK') department = 'Housing & Accommodation Services';
  if (category === 'RECREATION_FACILITIES') department = 'Sports, Wellness & Recreation Management';
  if (category === 'CLEARANCE') department = 'Employee Clearance & Asset Custody Committee';
  if (category === 'LEGAL_COMPLIANCE') department = 'Health, Safety & Environmental Compliance (HSE)';

  // 3. SEPARATE METADATA FIELDS AND TABLE ROWS
  const headerFields: FormTemplateField[] = [];
  const sampleData: Record<string, any> = {};

  // Standard Baseline Fields Always Present in Official Forms
  const baseFields: FormTemplateField[] = [
    {
      name: 'recordDate',
      label: 'Date',
      type: 'date',
      required: true,
      colSpan: 1,
      defaultValue: new Date().toISOString().split('T')[0],
    },
    {
      name: 'locationZone',
      label: 'Site / Location Zone',
      type: 'text',
      placeholder: 'e.g. Amaala Camp Loc-188',
      required: true,
      colSpan: 1,
      defaultValue: 'Amaala Core Staff Village (Loc-188)',
    },
    {
      name: 'departmentUnit',
      label: 'Department / Unit',
      type: 'text',
      required: true,
      colSpan: 1,
      defaultValue: department,
    },
    {
      name: 'supervisorInCharge',
      label: 'Supervisor / In-Charge',
      type: 'text',
      placeholder: 'e.g. Eng. Tariq Al-Otaibi',
      colSpan: 1,
      defaultValue: 'Duty Supervisor (In-Charge)',
    },
  ];

  baseFields.forEach((bf) => {
    headerFields.push(bf);
    sampleData[bf.name] = bf.defaultValue || '';
  });

  // Add Extracted Key-Values (from Docx or Excel top headers)
  const seenKeys = new Set(headerFields.map((f) => f.name));

  extractedKeyValues.slice(0, 8).forEach((kv, idx) => {
    const key = toFieldKey(kv.key, idx);
    if (!seenKeys.has(key) && kv.key.length > 2 && kv.key.length < 35) {
      seenKeys.add(key);
      const inferredType = inferFieldType(kv.key, kv.value);
      headerFields.push({
        name: key,
        label: kv.key.charAt(0).toUpperCase() + kv.key.slice(1),
        type: inferredType,
        colSpan: inferredType === 'textarea' ? 4 : 2,
        placeholder: `Enter ${kv.key}...`,
      });
      sampleData[key] = kv.value || (inferredType === 'date' ? new Date().toISOString().split('T')[0] : '');
    }
  });

  // 4. SMART TABLE DETECTION & ALIGNMENT
  let customTable: CustomTableDefinition | undefined = undefined;
  let sampleCustomRows: Record<string, any>[] = [];
  let hasDynamicTable: FormTemplateDefinition['hasDynamicTable'] = 'NONE';

  if (cleanedGrid.length > 1) {
    // Find table header row
    let headerRowIdx = -1;
    let maxColumns = 0;

    for (let i = 0; i < Math.min(cleanedGrid.length, 6); i++) {
      const row = cleanedGrid[i];
      const nonEmpty = row.filter((cell) => cell.length > 0);
      if (nonEmpty.length >= 2 && nonEmpty.length > maxColumns) {
        maxColumns = nonEmpty.length;
        headerRowIdx = i;
      }
    }

    if (headerRowIdx >= 0) {
      const rawHeaderRow = cleanedGrid[headerRowIdx];
      const dataRows = cleanedGrid.slice(headerRowIdx + 1);

      // Normalize headers
      const columns: CustomTableColumn[] = [];
      const colKeys: string[] = [];

      rawHeaderRow.forEach((colText, idx) => {
        let label = cleanText(colText);
        if (!label) label = `Column ${idx + 1}`;
        const key = toFieldKey(label, idx);
        colKeys.push(key);

        // Infer column data type based on sample values
        const columnSampleValues = dataRows.map((r) => r[idx]).filter(Boolean);
        const inferredType = inferFieldType(label, columnSampleValues[0]);
        const colType: CustomTableColumn['type'] =
          inferredType === 'number'
            ? 'number'
            : inferredType === 'date'
            ? 'date'
            : inferredType === 'select'
            ? 'select'
            : 'text';

        columns.push({
          id: `col_${idx}`,
          label,
          key,
          type: colType,
          align: colType === 'number' ? 'center' : 'left',
          width: idx === 0 ? '60px' : undefined,
        });
      });

      // Construct sample custom rows (normalized to column count)
      dataRows.slice(0, 10).forEach((row, rowIdx) => {
        const rowObj: Record<string, any> = { id: `row_${rowIdx + 1}` };
        let hasAnyData = false;

        colKeys.forEach((key, colIdx) => {
          const val = row[colIdx] !== undefined ? cleanText(row[colIdx]) : '';
          rowObj[key] = val;
          if (val) hasAnyData = true;
        });

        if (hasAnyData) {
          sampleCustomRows.push(rowObj);
        }
      });

      // If no data rows were extracted, generate 3 clean sample rows
      if (sampleCustomRows.length === 0) {
        for (let r = 1; r <= 3; r++) {
          const dummy: Record<string, any> = { id: `row_${r}` };
          colKeys.forEach((k, cIdx) => {
            if (cIdx === 0) dummy[k] = `${r}`;
            else dummy[k] = '';
          });
          sampleCustomRows.push(dummy);
        }
      }

      customTable = {
        title: 'SECTION 2: SCHEDULED ITEMS & OPERATIONAL RECORD DETAILS',
        columns,
        defaultRows: sampleCustomRows,
      };

      hasDynamicTable = 'CUSTOM';
      insights.push(`Configured Dynamic Table with ${columns.length} columns and ${sampleCustomRows.length} rows.`);
    }
  }

  // 5. OFFICIAL CODE & REF PREFIX
  const randomNum = Math.floor(100 + Math.random() * 900);
  const code = `TAFGA-FRM-CUST-${randomNum}`;
  const docRefPrefix = title
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 4) || 'CUST';

  // 6. ASSEMBLE FULL TEMPLATE DEFINITION
  const template: FormTemplateDefinition = {
    id: `custom-template-${Date.now()}-${randomNum}`,
    code,
    title,
    category,
    categoryLabel,
    description: `Official enterprise form imported and auto-aligned from ${fileName}. Managed under Tamimi Global Facilities Management System.`,
    version: 'v1.0 (2026)',
    department,
    docRefPrefix,
    iconName,
    accentColor,
    hasDynamicTable,
    customTable,
    headerFields,
    footerFields: [
      {
        name: 'preparedBy',
        label: 'Prepared By (Name & Signature)',
        type: 'text',
        placeholder: 'Officer Name & Badge ID',
        colSpan: 2,
        defaultValue: 'Habibur Rahman (TM-3388)',
      },
      {
        name: 'verifiedBy',
        label: 'Reviewed & Approved By',
        type: 'text',
        placeholder: 'Manager Name & Stamp',
        colSpan: 2,
        defaultValue: 'Eng. Khalid Al-Otaibi (Operations Mgr)',
      },
    ],
    sampleData,
    sampleCustomRows,
    isCustomUploaded: true,
    uploadedFileName: fileName,
    uploadedAt: new Date().toISOString(),
    orientation: customTable && customTable.columns.length > 5 ? 'landscape' : 'portrait',
  };

  return {
    success: true,
    template,
    insights,
    warnings: warnings.length > 0 ? warnings : undefined,
    detectedType: sourceType === 'EXCEL' ? 'EXCEL' : sourceType === 'WORD' ? 'WORD' : 'CSV',
    rawTextSummary: rawText.slice(0, 300),
  };
}

/**
 * Storage Helpers for Custom Uploaded Templates
 */
export const CUSTOM_FORMS_STORAGE_KEY = 'tafga_custom_form_templates_v2';

export function getStoredCustomTemplates(): FormTemplateDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FORMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading custom form templates from storage', e);
  }
  return [];
}

export function saveCustomTemplate(template: FormTemplateDefinition): FormTemplateDefinition[] {
  const current = getStoredCustomTemplates();
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: FormTemplateDefinition[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = template;
  } else {
    updated = [template, ...current];
  }

  try {
    localStorage.setItem(CUSTOM_FORMS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving custom form template', e);
  }

  return updated;
}

export function deleteStoredCustomTemplate(templateId: string): FormTemplateDefinition[] {
  const current = getStoredCustomTemplates();
  const updated = current.filter((t) => t.id !== templateId);

  try {
    localStorage.setItem(CUSTOM_FORMS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting custom form template', e);
  }

  return updated;
}

import JSZip from 'jszip';
import { BlankFromRow, EMPTY_BLANK_FROM_ROW } from '../data/initialBlankFromData';

export interface DocxFillOptions {
  customTemplateBuffer?: ArrayBuffer;
  overrideValues?: Partial<BlankFromRow>;
}

export class DocxFillService {
  /**
   * Fetches the authentic From.docx file from the app
   */
  public static async getDefaultTemplateBuffer(): Promise<ArrayBuffer> {
    const urls = ['./From.docx', '/From.docx', 'From.docx'];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          return await res.arrayBuffer();
        }
      } catch (e) {
        // try next fallback
      }
    }
    throw new Error('Failed to load base Word template From.docx');
  }

  /**
   * Fills From.docx with exact employee/resident data from the Google Sheet Blank Forms tab
   * and returns the generated docx Blob preserving 100% of the original Word document's styling
   */
  public static async fillDocxTemplate(
    row: BlankFromRow,
    options?: DocxFillOptions
  ): Promise<Blob> {
    const buffer = options?.customTemplateBuffer || (await this.getDefaultTemplateBuffer());
    const zip = await JSZip.loadAsync(buffer);

    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('Invalid Word file: word/document.xml not found.');
    }

    let docXml = await docXmlFile.async('string');

    // Merge any override values
    const data: BlankFromRow = {
      ...EMPTY_BLANK_FROM_ROW,
      ...(row || {}),
      ...(options?.overrideValues || {}),
    };

    // Construct the formatted unit string with building, unit no, and serial number
    const bPart = (data.buildingNo || '').trim();
    const uPart = (data.unitNo || data.room || '').trim();
    const sPart = (data.unitSerialNo || '').trim();

    let computedUnit = (data.unit || '').trim();
    if (!computedUnit || computedUnit === 'TBCV') {
      if (bPart && uPart) {
        computedUnit = `${bPart} - Unit ${uPart}${sPart ? ` (${sPart})` : ''}`;
      } else if (uPart) {
        computedUnit = `Unit ${uPart}${sPart ? ` (${sPart})` : ''}`;
      } else if (bPart) {
        computedUnit = bPart;
      }
    } else if (sPart && !computedUnit.includes(sPart)) {
      computedUnit = `${computedUnit} (${sPart})`;
    }

    // Dictionary of placeholders in From.docx
    const replacements: Record<string, string> = {
      Unit: computedUnit || 'TBCV',
      Move_In_Date: data.moveInDate || '8/24/2026',
      Move_Out_Date: data.moveOutDate || '8/26/2026',
      Name: data.name || '',
      Department: data.department || 'Projects Delivery',
      'Employment ID': data.employmentId || '',
      Company: data.company || 'Red Sea Global',
      Division: data.division || 'Operations',
      'ID/Iqama': data.idIqama || '',
      Passport: data.passport || '',
      Nationality: data.nationality || 'Saudi Arabia',
      DOB: data.dob || '',
      Gender: data.gender || 'Male',
      Mobile: data.mobile || '',
      Email: data.email || '',
      Emergency_contact: data.emergencyMobile || '',
      'Name of Contact': data.emergencyName || 'None',
    };

    // 1. Cross-run XML Regex Replacement (handles Word splitting tokens across <w:r> runs)
    for (const [key, rawVal] of Object.entries(replacements)) {
      const val = (rawVal || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const chars = key.split('');
      const tagPattern = chars
        .map((c) => c.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .join('(?:<[^>]+>)*');

      const fullRegex = new RegExp(
        '\\{\\{' + '(?:<[^>]+>)*' + tagPattern + '(?:<[^>]+>)*' + '\\}\\}',
        'gi'
      );
      docXml = docXml.replace(fullRegex, val);
    }

    // 2. Parse XML for DOM manipulation (checkboxes & optional table cells)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');
    const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    const getElems = (parent: Element | Document, tag: string) => {
      const byNs = parent.getElementsByTagNameNS(NS_W, tag);
      if (byNs && byNs.length > 0) return Array.from(byNs);
      const byPref = parent.getElementsByTagName(`w:${tag}`);
      if (byPref && byPref.length > 0) return Array.from(byPref);
      return Array.from(parent.getElementsByTagName(tag));
    };

    // Handle Property Type Checkboxes: Executive, Senior, Junior, Worker
    const paragraphs = getElems(xmlDoc, 'p');
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pText = p.textContent || '';

      if (pText.includes('Executive') && pText.includes('Senior')) {
        const checkBoxes = getElems(p, 'checkBox');
        const types = ['Executive', 'Senior', 'Junior', 'Worker'];
        const targetType = (data.propertyType || '').toLowerCase();

        for (let cbIdx = 0; cbIdx < checkBoxes.length && cbIdx < types.length; cbIdx++) {
          const cb = checkBoxes[cbIdx];
          const isMatch = types[cbIdx].toLowerCase() === targetType;
          const valStr = isMatch ? '1' : '0';

          const defElems = getElems(cb, 'default');
          let defElem = defElems[0];
          if (!defElem) {
            defElem = xmlDoc.createElementNS(NS_W, 'w:default');
            cb.appendChild(defElem);
          }
          defElem.setAttributeNS(NS_W, 'w:val', valStr);
          defElem.setAttribute('w:val', valStr);

          const checkedElems = getElems(cb, 'checked');
          let checkedElem = checkedElems[0];
          if (!checkedElem) {
            checkedElem = xmlDoc.createElementNS(NS_W, 'w:checked');
            cb.appendChild(checkedElem);
          }
          checkedElem.setAttributeNS(NS_W, 'w:val', valStr);
          checkedElem.setAttribute('w:val', valStr);
        }
      }
    }

    // 3. Fill Vehicle Details if present
    if (data.vehicleRegNo || data.vehicleModel || data.carParkSpace) {
      const tableRows = getElems(xmlDoc, 'tr');
      for (let r = 0; r < tableRows.length; r++) {
        const tr = tableRows[r];
        const cells = getElems(tr, 'tc');
        if (cells.length >= 4) {
          const cell0Text = cells[0].textContent || '';
          if (cell0Text.includes('Registration No.') && data.vehicleRegNo) {
            this.setCellText(xmlDoc, cells[1], data.vehicleRegNo);
          }
          if (cell0Text.includes('Registration No.') && data.vehicleModel) {
            this.setCellText(xmlDoc, cells[3], data.vehicleModel);
          }
        } else if (cells.length >= 2) {
          const cell0Text = cells[0].textContent || '';
          if (cell0Text.includes('Car Park space No.') && data.carParkSpace) {
            this.setCellText(xmlDoc, cells[1], data.carParkSpace);
          }
        }
      }
    }

    // Serialize modified XML back into zip
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    zip.file('word/document.xml', updatedXml);

    // Generate output blob
    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  private static setCellText(xmlDoc: Document, tc: Element, value: string): void {
    const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    let p =
      tc.getElementsByTagNameNS(NS_W, 'p')[0] ||
      tc.getElementsByTagName('w:p')[0] ||
      tc.getElementsByTagName('p')[0];
    if (!p) {
      p = xmlDoc.createElementNS(NS_W, 'w:p');
      tc.appendChild(p);
    }

    // Clean existing runs
    const runs = p.getElementsByTagNameNS(NS_W, 'r');
    while (runs.length > 0) {
      p.removeChild(runs[0]);
    }

    const r = xmlDoc.createElementNS(NS_W, 'w:r');
    const rPr = xmlDoc.createElementNS(NS_W, 'w:rPr');
    const sz = xmlDoc.createElementNS(NS_W, 'w:sz');
    sz.setAttributeNS(NS_W, 'w:val', '18');
    rPr.appendChild(sz);
    r.appendChild(rPr);

    const t = xmlDoc.createElementNS(NS_W, 'w:t');
    t.setAttribute('xml:space', 'preserve');
    t.textContent = value;
    r.appendChild(t);
    p.appendChild(r);
  }

  /**
   * Helper to download filled Word document in the browser
   */
  public static async downloadFilledDocx(
    row: BlankFromRow,
    options?: DocxFillOptions
  ): Promise<string> {
    const blob = await this.fillDocxTemplate(row, options);
    const cleanName = ((row && row.name) || 'Resident').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Community_Management_Move_In_Out_Form_${cleanName}_${(row && row.employmentId) || 'ID'}.docx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    return fileName;
  }

  /**
   * Helper to download original blank From.docx
   */
  public static async downloadBlankDocx(): Promise<void> {
    const buffer = await this.getDefaultTemplateBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'From_Original_Community_Management_Form.docx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

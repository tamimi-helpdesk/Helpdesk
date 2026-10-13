import JSZip from 'jszip';
import { BlankFromRow } from '../data/initialBlankFromData';

export interface DocxFillOptions {
  customTemplateBuffer?: ArrayBuffer;
  overrideValues?: Partial<BlankFromRow>;
}

export class DocxFillService {
  /**
   * Fetches the default From.docx file from the app
   */
  public static async getDefaultTemplateBuffer(): Promise<ArrayBuffer> {
    const res = await fetch('/From.docx');
    if (!res.ok) {
      throw new Error(`Failed to load base Word template From.docx (HTTP ${res.status})`);
    }
    return await res.arrayBuffer();
  }

  /**
   * Fills From.docx with exact employee data from the Google Sheet Blank From tab
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
      ...row,
      ...(options?.overrideValues || {}),
    };

    // Dictionary of placeholders in From.docx
    const replacements: Record<string, string> = {
      Unit: data.unit || `${data.property} - ${data.sector}- ${data.house}- ${data.floor}- ${data.room}`,
      Move_In_Date: data.moveInDate || '8/24/2026',
      Move_Out_Date: data.moveOutDate || '8/26/2026',
      Name: data.name || '',
      Department: data.department || '',
      'Employment ID': data.employmentId || '',
      Company: data.company || '',
      Division: data.division || '',
      'ID/Iqama': data.idIqama || '',
      Passport: data.passport || '',
      Nationality: data.nationality || '',
      DOB: data.dob || '',
      Gender: data.gender || 'Male',
      Mobile: data.mobile || '',
      Email: data.email || '',
      Emergency_contact: data.emergencyMobile || '',
      'Name of Contact': data.emergencyName || 'None',
    };

    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');

    const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    // Helper to find elements resiliently with or without namespace
    const getElems = (parent: Element | Document, tag: string) => {
      const byNs = parent.getElementsByTagNameNS(NS_W, tag);
      if (byNs && byNs.length > 0) return Array.from(byNs);
      const byPref = parent.getElementsByTagName(`w:${tag}`);
      if (byPref && byPref.length > 0) return Array.from(byPref);
      return Array.from(parent.getElementsByTagName(tag));
    };

    // 1. Replace all paragraph-level placeholders
    const paragraphs = getElems(xmlDoc, 'p');

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = getElems(p, 't');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }

      // Check if this paragraph contains any of our placeholder tags
      for (const [key, val] of Object.entries(replacements)) {
        const normKey = key.replace(/[\s_]/g, '').toLowerCase();
        const normPText = pText.replace(/[\s_]/g, '').toLowerCase();

        if (normPText.includes(`{{${normKey}}}`)) {
          // Find run formatting (w:rPr) from the existing runs to preserve exact font, size, and styling
          const runs = getElems(p, 'r');
          let rPrClone: Node | null = null;
          for (let rIdx = 0; rIdx < runs.length; rIdx++) {
            const rPrs = getElems(runs[rIdx], 'rPr');
            if (rPrs.length > 0) {
              rPrClone = rPrs[0].cloneNode(true);
              break;
            }
          }

          // Remove all existing runs and bookmarks
          const childNodes = Array.from(p.childNodes);
          for (const child of childNodes) {
            const localName = (child as Element).localName || (child as Element).nodeName || '';
            if (localName.includes('r') || localName.includes('bookmarkStart') || localName.includes('bookmarkEnd')) {
              p.removeChild(child);
            }
          }

          // Append new pristine run with replacement text and original styling
          const newRun = xmlDoc.createElementNS(NS_W, 'w:r');
          if (rPrClone) {
            newRun.appendChild(rPrClone);
          }
          const newText = xmlDoc.createElementNS(NS_W, 'w:t');
          newText.setAttribute('xml:space', 'preserve');
          newText.textContent = val;
          newRun.appendChild(newText);
          p.appendChild(newRun);

          break; // Process next paragraph
        }
      }

      // 2. Handle Property Type Checkboxes: Executive, Senior, Junior, Worker
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

    // 3. Fill Vehicle Details if available
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
    const cleanName = (row.name || 'Employee').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Community_Management_Move_In_Out_Form_${cleanName}_${row.employmentId || 'ID'}.docx`;

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
}

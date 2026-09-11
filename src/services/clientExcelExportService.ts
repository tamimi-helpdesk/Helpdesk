import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export interface ExportExcelOptions {
  items: any[];
  facilityName?: string;
  contractorName?: string;
  preparedBy?: string;
  dateStr?: string;
  fileName?: string;
  categoryKeywords?: Record<string, string[]>;
}

export async function exportExcelClientSide(options: ExportExcelOptions): Promise<void> {
  const {
    items = [],
    facilityName = 'Tamimi Construction Village',
    contractorName = 'Tamimi TAFGA',
    preparedBy = 'LIMON RAHMAN',
    dateStr = new Date().toISOString().slice(0, 10),
    fileName,
    categoryKeywords,
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = preparedBy;
  workbook.lastModifiedBy = preparedBy;

  const sheetNames = [
    'Hard Service',
    'Soft Services',
    'Pest Control',
    'HSE',
    'Fire Department',
  ];

  sheetNames.forEach((name) => {
    const sheet = workbook.addWorksheet(name);

    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = 'TAFGA TBCV OBSERVATION REPORT';
    sheet.getCell('A1').font = { size: 18, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    sheet.mergeCells('A2:E2');
    sheet.getCell('A2').value = `Facility/Program: ${facilityName}`;
    sheet.getCell('A2').font = { bold: true };
    sheet.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };
    sheet.getRow(2).height = 22;

    sheet.mergeCells('A3:E3');
    sheet.getCell('A3').value = `Contractor Name: ${contractorName}`;
    sheet.getCell('A3').font = { bold: true };
    sheet.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle' };
    sheet.getRow(3).height = 22;

    sheet.getCell('F2').value = 'Date:';
    sheet.getCell('F2').font = { bold: true };
    sheet.getCell('F2').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells('G2:H2');
    sheet.getCell('G2').value = dateStr;
    sheet.getCell('G2').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getCell('F3').value = 'Prepared By:';
    sheet.getCell('F3').font = { bold: true };
    sheet.getCell('F3').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells('G3:H3');
    sheet.getCell('G3').value = preparedBy;
    sheet.getCell('G3').alignment = { horizontal: 'center', vertical: 'middle' };

    const headers = [
      'No.',
      'Location',
      'Department',
      'Description',
      'Ticket Number',
      'Picture',
      'Close Out Picture',
      'Status',
    ];

    sheet.getRow(4).values = headers;
    sheet.getRow(4).height = 28;

    sheet.columns = [
      { key: 'sl', width: 6 },
      { key: 'location', width: 18 },
      { key: 'department', width: 18 },
      { key: 'desc', width: 42 },
      { key: 'ticket', width: 16 },
      { key: 'image', width: 28 },
      { key: 'closeout', width: 28 },
      { key: 'status', width: 15 },
    ];

    const headerRow = sheet.getRow(4);
    headerRow.eachCell((cell: any) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
    });

    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 8; c++) {
        sheet.getRow(r).getCell(c).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  });

  function applyFullBorder(sheet: any) {
    sheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }

  const CATEGORY_RULES: Record<string, string[]> = categoryKeywords || {
    'Civil': [
      'steel plate flooring', 'steel plate', 'ceiling cover', 'ceiling tile',
      'door handle', 'door lock', 'shower door lock', 'shower bath door lock', 'wall spots', 'dirty spots on wall',
      'wall paint', 'wall crack', 'steel rack', 'window cotton', 'curtains',
      'curtain', 'blinds', 'handrail', 'repaint', 'paint', 'wall', 'roof',
      'flooring', 'tiles', 'tile', 'door', 'lock', 'handle', 'window', 'cabinet',
      'wardrobe', 'rack', 'pillar', 'plaster', 'masonry', 'carpentry', 'welding',
      'stair', 'stairs', 'glass', 'bed', 'civil', 're-touch', 'retouch',
      'silicon', 'crack', 'cement', 'concrete'
    ],
    'Electrical': [
      'busted ceiling light', 'ceiling light', 'led light', 'damaged led light',
      'mirror lights blinking', 'lights blinking', 'lights flickering', 'tube light',
      'spot light', 'exhaust fan', 'ceiling fan', 'short circuit', 'power cut',
      'no power', 'distribution board', 'electrical panel', 'mcb', 'breaker',
      'wiring', 'cable', 'wire', 'switch', 'socket', 'plug', 'light', 'lights',
      'lamp', 'bulb', 'led', 'blinking', 'fan', 'electrical', 'electric',
      'panel'
    ],
    'HVAC': [
      'outdoor ac unit pipe hole', 'outdoor ac unit', 'indoor ac unit',
      'outdoor ac', 'indoor ac', 'pipe hole', 'proper insulation', 'insulation',
      'ac not cooling', 'not cooling', 'low cooling', 'no cooling',
      'ac water leak', 'ac water leaking', 'ac dripping', 'ac drainage', 'ac leak',
      'air conditioner', 'air conditioning', 'ac unit', 'chiller', 'cooling',
      'compressor', 'thermostat', 'freon', 'gas leak', 'duct', 'filter',
      'ventilation', 'ac', 'a/c', 'hvac'
    ],
    'Plumbing': [
      'water not draining properly', 'water not draining', 'shower tray',
      'shower bath', 'shower mixer', 'drain cover', 'handspray', 'hand spray',
      'shattaf', 'bidet spray', 'flush tank leaking', 'flush tank not working',
      'flush tank', 'flush button', 'toilet bowl', 'commode', 'wash basin',
      'water heater', 'water leak', 'leaking water', 'pipe burst', 'pipe leak',
      'angle valve', 'tap leaking', 'faucet', 'tap', 'draining', 'drain',
      'water', 'leaking', 'leak', 'leakage', 'shower', 'flush', 'pipe',
      'sink', 'basin', 'toilet', 'bidet', 'tank', 'valve', 'sewer',
      'sewage', 'clogged', 'plumbing'
    ],
    'Housekeeping': [
      'deep cleaning', 'corridor cleaning', 'room cleaning', 'cabinet cleaning',
      'curb stone cleaning', 'steel plate cleaning', 'ablution cleaning',
      'bed sheet', 'bed sheets', 'linen', 'blanket', 'pillow', 'towel',
      'laundry', 'cleaning', 'housekeeping', 'mop', 'sweeping', 'janitor',
      'dust', 'dirty', 'dirty spots', 'stains', 'stain', 'kettle cleaning',
      'kettle', 'unwanted material', 'arranging material', 'diesel cleaning'
    ],
    'Landscaping': [
      'tree need trimming', 'tree trimming', 'dry leaves removal', 'dry leaves',
      'grass cutting', 'lawn mowing', 'artificial grass', 'irrigation pipe',
      'irrigation', 'watering plants', 'watering', 'gardening', 'garden',
      'landscaping', 'landscape', 'plants', 'plant', 'grass', 'lawn',
      'trees', 'tree', 'trimming', 'pruning', 'leaves', 'flower', 'soil'
    ],
    'Waste Management': [
      'waste management', 'waste bin signage', 'waste bin', 'waste bins',
      'garbage bin', 'trash bin', 'dustbin', 'wheelie bin', 'dumpster',
      'skip', 'overflowing bin', 'litter picking', 'little picking',
      'trash collection', 'waste collection', 'discarded material',
      'discard damaged', 'scrap disposal', 'garbage', 'trash', 'waste',
      'bin', 'bins', 'rubbish', 'litter', 'discard', 'debris', 'dump',
      'scrap', 'recycling'
    ],
    'Pest Control': [
      'pest control', 'spray pest', 'pest spray', 'pest spraying',
      'bedbugs treatment', 'bedbugs need pest treatment', 'bedbugs', 'bedbug',
      'cockroaches', 'cockroach', 'insects', 'insect', 'termites', 'mosquitoes',
      'ants', 'ant', 'rodents', 'rodent', 'rats', 'rat', 'mice', 'mouse',
      'flies', 'fly', 'stray cat', 'stray dog', 'stray animals', 'cats',
      'dogs', 'pigeons', 'pigeon', 'pest', 'fumigation'
    ],
    'HSE': [
      'trip hazard', 'slip hazard', 'slip and fall', 'safety shoes',
      'hard hat', 'safety glasses', 'ppe violation', 'missing ppe', 'ppe',
      'first aid box', 'first aid', 'eyewash station', 'eyewash',
      'safety barrier', 'barricade', 'caution tape', 'warning sign',
      'scaffolding safety', 'scaffold', 'safety harness', 'harness',
      'chemical spill', 'oil spill', 'diesel spill', 'spill', 'hse',
      'health and safety', 'safety', 'hazard', 'danger', 'slip', 'fall',
      'warning', 'health', 'chemical'
    ],
    'Fire Department': [
      'fire extinguisher expired', 'fire extinguisher pressure',
      'fire extinguisher', 'extinguisher', 'smoke detector beeping',
      'smoke detector', 'fire alarm ringing', 'fire alarm panel', 'fire alarm',
      'break glass unit', 'break glass', 'manual call point', 'fire pump room',
      'fire pump', 'fire hydrant', 'hydrant', 'fire hose reel', 'fire hose',
      'hose reel', 'fire sprinkler', 'sprinkler', 'fire door blocked',
      'fire door', 'emergency exit', 'fire fighting', 'fire department',
      'fire', 'fighting'
    ]
  };

  function resolveDepartment(desc: string, currentDept?: string): string {
    const specificDepts = [
      'Civil', 'Electrical', 'HVAC', 'Plumbing',
      'Housekeeping', 'Landscaping', 'Waste Management',
      'Pest Control', 'HSE', 'Fire Department'
    ];
    const trimmed = (currentDept || '').trim();
    if (trimmed && specificDepts.includes(trimmed)) {
      return trimmed;
    }

    const text = (desc || '').toLowerCase().trim();
    if (!text) return trimmed || 'Civil';

    let best = 'Civil';
    let maxScore = 0;

    for (const [dept, keywords] of Object.entries(CATEGORY_RULES)) {
      if (!keywords || !Array.isArray(keywords)) continue;
      for (const kw of keywords) {
        const cleanKw = kw.toLowerCase().trim();
        if (!cleanKw) continue;

        let isMatch = false;
        if (cleanKw.length <= 3) {
          const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
          isMatch = wordRegex.test(text);
        } else {
          isMatch = text.includes(cleanKw);
        }

        if (isMatch) {
          let score = cleanKw.length * 10;
          if (cleanKw.includes(' ')) score += 30;
          if (text === cleanKw) score += 50;
          if (dept === 'Fire Department') score += 15;
          if (dept === 'HSE') score += 12;
          if (dept === 'Pest Control') score += 10;
          if (score > maxScore) {
            maxScore = score;
            best = dept;
          }
        }
      }
    }
    return best;
  }

  function getSheetByDepartment(wb: any, department: string) {
    if (!department) return wb.getWorksheet('Hard Service');
    const dept = String(department).trim();

    if (
      [
        'Civil',
        'CIVIL',
        'Electrical',
        'HVAC',
        'Plumbing',
        'Hard Service',
        'Hard Services',
      ].includes(dept)
    ) {
      return wb.getWorksheet('Hard Service');
    }

    if (
      [
        'Housekeeping',
        'Landscaping',
        'Waste Management',
        'Soft',
        'Soft Service',
        'Soft Services',
        'Cleaning',
      ].includes(dept)
    ) {
      return wb.getWorksheet('Soft Services');
    }

    if (dept === 'Pest Control') {
      return wb.getWorksheet('Pest Control');
    }
    if (dept === 'HSE') {
      return wb.getWorksheet('HSE');
    }
    if (dept === 'Fighting' || dept === 'Fire Department' || dept === 'Fire Fighting') {
      return wb.getWorksheet('Fire Department');
    }

    const dLower = dept.toLowerCase();
    if (
      dLower.includes('civil') ||
      dLower.includes('elect') ||
      dLower.includes('hvac') ||
      dLower.includes('plumb') ||
      dLower.includes('hard')
    ) {
      return wb.getWorksheet('Hard Service');
    }
    if (
      dLower.includes('housekeep') ||
      dLower.includes('landscape') ||
      dLower.includes('waste') ||
      dLower.includes('clean') ||
      dLower.includes('soft')
    ) {
      return wb.getWorksheet('Soft Services');
    }
    if (dLower.includes('pest')) return wb.getWorksheet('Pest Control');
    if (dLower.includes('hse') || dLower.includes('safety') || dLower.includes('health')) return wb.getWorksheet('HSE');
    if (dLower.includes('fighting') || dLower.includes('fire')) return wb.getWorksheet('Fire Department');

    return wb.getWorksheet('Hard Service');
  }

  // Normalize image URLs (handles Google Drive links and whitespace)
  function normalizeImageUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.includes('drive.google.com')) {
      const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
      }
    }
    return trimmed;
  }

  // Convert image URL, data URL, or base64 into base64 string and extension
  async function resolveImageBase64(src: string): Promise<{ base64: string; ext: 'jpeg' | 'png' } | null> {
    if (!src || typeof src !== 'string') return null;
    const str = normalizeImageUrl(src);
    if (!str) return null;

    try {
      if (str.startsWith('data:image/')) {
        const match = str.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
        if (match) {
          const ext = match[1].toLowerCase() === 'png' ? 'png' : 'jpeg';
          return { base64: match[2], ext };
        }
        const raw = str.split(',')[1];
        if (raw) return { base64: raw, ext: 'jpeg' };
      } else if (/^[A-Za-z0-9+/=]+$/.test(str) && str.length > 100) {
        return { base64: str, ext: 'jpeg' };
      }

      if (str.startsWith('http://') || str.startsWith('https://')) {
        // Attempt 1: High-speed Cloudflare image proxy (images.weserv.nl - full CORS across all domains)
        try {
          const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(str)}&output=jpg&q=85`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const r = await fetch(proxyUrl, { signal: controller.signal });
          clearTimeout(timer);
          if (r.ok) {
            const blob = await r.blob();
            const base64 = await blobToBase64(blob);
            if (base64) return { base64, ext: 'jpeg' };
          }
        } catch {}

        // Attempt 2: Backup Cloudflare proxy (wsrv.nl)
        try {
          const proxyUrl2 = `https://wsrv.nl/?url=${encodeURIComponent(str)}&output=jpg&q=85`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const r = await fetch(proxyUrl2, { signal: controller.signal });
          clearTimeout(timer);
          if (r.ok) {
            const blob = await r.blob();
            const base64 = await blobToBase64(blob);
            if (base64) return { base64, ext: 'jpeg' };
          }
        } catch {}

        // Attempt 3: imagecdn.app global proxy
        try {
          const proxyUrl3 = `https://imagecdn.app/v2/image/${encodeURIComponent(str)}?format=jpeg`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const r = await fetch(proxyUrl3, { signal: controller.signal });
          clearTimeout(timer);
          if (r.ok) {
            const blob = await r.blob();
            const base64 = await blobToBase64(blob);
            if (base64) return { base64, ext: 'jpeg' };
          }
        } catch {}

        // Attempt 4: Direct fetch (for open CORS / same-origin images)
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const r = await fetch(str, { signal: controller.signal });
          clearTimeout(timer);
          if (r.ok) {
            const blob = await r.blob();
            const ext = blob.type.includes('png') ? 'png' : 'jpeg';
            const base64 = await blobToBase64(blob);
            if (base64) return { base64, ext };
          }
        } catch {}

        // Attempt 5: Canvas from DOM or Image element
        const canvasImg = await new Promise<{ base64: string; ext: 'jpeg' | 'png' } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve({ base64: dataUrl.split(',')[1], ext: 'jpeg' });
                return;
              }
            } catch {}
            resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = str;
        });
        if (canvasImg) return canvasImg;
      }
    } catch (err) {
      console.warn('[Client Excel Export] Image resolve error:', err);
    }
    return null;
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res.split(',')[1] || '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  }

  // Pre-fetch all images in parallel for ultra-fast export
  const imageCache = new Map<string, { base64: string; ext: 'jpeg' | 'png' }>();
  const uniqueUrls = new Set<string>();

  for (const item of items) {
    const p1 = item.picture || item.pictureUrl;
    if (p1) uniqueUrls.add(p1);
    const p2 = item.closeOutPicture || (item as any).closeout;
    if (p2) uniqueUrls.add(p2);
    const thumb = (item as any).thumbnail;
    if (thumb) uniqueUrls.add(thumb);
  }

  await Promise.all(
    Array.from(uniqueUrls).map(async (url) => {
      const res = await resolveImageBase64(url);
      if (res) {
        imageCache.set(url, res);
      }
    })
  );

  const serialCounter: Record<string, number> = {};
  const ROW_HEIGHT = 115;

  for (const item of items) {
    const resolvedDept = resolveDepartment(item.description || item.rawCaption || '', item.department);
    const sheet = getSheetByDepartment(workbook, resolvedDept);
    if (!sheet) continue;

    if (!serialCounter[sheet.name]) {
      serialCounter[sheet.name] = 1;
    }

    const row = sheet.addRow({
      sl: serialCounter[sheet.name],
      location: item.location || '',
      department: resolvedDept,
      desc: item.description || '',
      ticket: item.ticketNumber || '',
      image: '',
      closeout: '',
      status: item.status || 'Open',
    });

    row.height = ROW_HEIGHT;

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

    // Resolve Main Inspection Picture
    const mainPic = item.picture || item.pictureUrl || (item as any).thumbnail || (item as any).attachedFiles?.[0]?.dataUrl;
    let img: { base64: string; ext: 'jpeg' | 'png' } | null = null;
    if (mainPic) {
      img = imageCache.get(mainPic) || await resolveImageBase64(mainPic);
    }
    // Fallback to thumbnail if high-res URL failed
    if (!img && (item as any).thumbnail) {
      img = imageCache.get((item as any).thumbnail) || await resolveImageBase64((item as any).thumbnail);
    }

    if (img) {
      try {
        const imageId = workbook.addImage({
          base64: img.base64,
          extension: img.ext,
        });

        sheet.addImage(imageId, {
          tl: { col: 5, row: row.number - 1 },
          br: { col: 6, row: row.number },
          editAs: 'twoCell',
        });
      } catch (e) {
        console.warn('[Client Excel Export] Image embed error:', e);
      }
    }

    // Resolve Close Out Picture
    const closePic = item.closeOutPicture || (item as any).closeout || (item as any).closeOutAttachedFiles?.[0]?.dataUrl;
    let cImg: { base64: string; ext: 'jpeg' | 'png' } | null = null;
    if (closePic) {
      cImg = imageCache.get(closePic) || await resolveImageBase64(closePic);
    }

    if (cImg) {
      try {
        const cId = workbook.addImage({
          base64: cImg.base64,
          extension: cImg.ext,
        });

        sheet.addImage(cId, {
          tl: { col: 6, row: row.number - 1 },
          br: { col: 7, row: row.number },
          editAs: 'twoCell',
        });
      } catch (e) {
        console.warn('[Client Excel Export] Closeout embed error:', e);
      }
    }

    serialCounter[sheet.name]++;
  }

  workbook.eachSheet((sheet: any) => {
    applyFullBorder(sheet);
  });

  const exportFileName =
    fileName || `TAFGA_TBCV_OBSERVATION_REPORT_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

  const rawBuffer = await workbook.xlsx.writeBuffer();

  let outputBlob: Blob;
  try {
    const zip = await JSZip.loadAsync(rawBuffer);
    let modified = false;
    for (const fName of Object.keys(zip.files)) {
      if (!zip.files[fName].dir && fName.startsWith('xl/drawings/drawing') && fName.endsWith('.xml')) {
        let xml = await zip.file(fName)!.async('string');
        const originalXml = xml;
        xml = xml.replace(/noChangeAspect="1"/g, 'noChangeAspect="0"');
        xml = xml.replace(/<a:picLocks\s*\/>/g, '<a:picLocks noChangeAspect="0"/>');
        xml = xml.replace(/<a:picLocks([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('noChangeAspect')) {
            return `<a:picLocks${attrs} noChangeAspect="0">`;
          }
          return match;
        });
        if (xml !== originalXml) {
          zip.file(fName, xml);
          modified = true;
        }
      }
    }
    if (modified) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      outputBlob = zipBlob;
    } else {
      outputBlob = new Blob([rawBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }
  } catch (zipErr) {
    console.warn('[Client Excel Export] JSZip drawing patch warning:', zipErr);
    outputBlob = new Blob([rawBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  // Trigger download in browser
  const blobUrl = window.URL.createObjectURL(outputBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = exportFileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(blobUrl);
}

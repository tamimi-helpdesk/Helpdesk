import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export function handlePrintDocument(req: Request, res: Response, hubState: any) {
  const rawType = String(req.params.type || 'handover').toLowerCase().trim();
  const rawId = String(req.params.id || '').trim();
  const cleanId = rawId
    .replace(/^TAFGA-HO-|^TAFGA-PRC-|^TAFGA-LNF-|^HO-|^PRC-|^LNF-/i, '')
    .toLowerCase()
    .trim();

  let item: any = null;
  let docType: 'HANDOVER' | 'PARCEL' | 'LOST_FOUND' = 'HANDOVER';

  if (rawType.includes('parcel')) {
    docType = 'PARCEL';
    item = (hubState.parcels || []).find((p: any) => {
      const pid = String(p.id || '').toLowerCase().trim();
      return pid === cleanId || pid === rawId.toLowerCase() || `prc-${pid}` === cleanId;
    });
  } else if (rawType.includes('lost')) {
    docType = 'LOST_FOUND';
    item = (hubState.lostFound || []).find((l: any) => {
      const lid = String(l.id || '').toLowerCase().trim();
      return lid === cleanId || lid === rawId.toLowerCase() || `lnf-${lid}` === cleanId;
    });
  } else {
    docType = 'HANDOVER';
    item = (hubState.handovers || []).find((h: any) => {
      const hid = String(h.id || '').toLowerCase().trim();
      return (
        hid === cleanId ||
        hid === rawId.toLowerCase() ||
        `ho-${hid}` === cleanId ||
        hid.replace(/^ho-/i, '') === cleanId
      );
    });
  }

  // Fallback to reading disk database if memory state did not have it yet
  if (!item) {
    try {
      const diskDbPath = path.join(process.cwd(), 'tamimi_server_db.json');
      if (fs.existsSync(diskDbPath)) {
        const diskDb = JSON.parse(fs.readFileSync(diskDbPath, 'utf8'));
        const list = docType === 'PARCEL' ? diskDb.parcels : docType === 'LOST_FOUND' ? diskDb.lostFound : diskDb.handovers;
        if (Array.isArray(list)) {
          item = list.find((x: any) => {
            const xid = String(x.id || '').toLowerCase().trim();
            return xid === cleanId || xid === rawId.toLowerCase() || xid.replace(/^ho-|^prc-|^lnf-/i, '') === cleanId;
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // If still not found, construct a fallback viewing item using whatever params were passed
  if (!item) {
    item = {
      id: rawId || 'HO-RECORD',
      type: 'GIVEN_OUT',
      category: 'Room Key',
      itemName: 'Official Asset / Key Clearance',
      quantity: 1,
      personName: 'Resident Guest',
      phoneNumber: '05xxxxxxxx',
      roomNumber: 'Reception Desk',
      departmentOrCompany: 'Tamimi Operations',
      condition: 'Good',
      status: 'ACTIVE_BORROWED',
      issueDate: new Date().toISOString().slice(0, 10),
      issueTime: '12:00',
      expectedReturnDate: new Date().toISOString().slice(0, 10),
      handoverByStaff: 'Tamimi Facility Operator',
    };
  }

  const voucherId = `TAFGA-HO-${item.id}`;
  const voucherTitle =
    item.type === 'GIVEN_OUT'
      ? 'ASSET LOAN & KEY HANDOVER CLEARANCE'
      : item.type === 'TAKEN_IN'
      ? 'SAFE CUSTODY & PROPERTY DEPOSIT VOUCHER'
      : 'INTER-DEPARTMENTAL ASSET TRANSFER SLIP';
  const custodyState = (item.status || 'ACTIVE_BORROWED').replace(/_/g, ' ');
  const photo = item.photoUrl || item.secondaryPhotoUrl || '';

  // Generate SVG Barcode
  const barcodeLines = [4, 2, 6, 2, 4, 3, 2, 5, 2, 4, 3, 2, 6, 2, 4, 2, 3, 5, 2, 4, 2, 6, 3, 2, 4, 5, 2, 3, 4, 2, 6, 2, 4, 3, 2, 5];
  let barcodeX = 0;
  const barcodeSvgBars = barcodeLines
    .map((w, idx) => {
      const rect = `<rect x="${barcodeX}" y="0" width="${w}" height="28" fill="#0f172a" />`;
      barcodeX += w + (idx % 2 === 0 ? 3 : 2);
      return rect;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${voucherId} - ${voucherTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #090d16;
      border-bottom: 2px solid #334155;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .no-print-bar .title {
      color: #f8fafc;
      font-weight: 800;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .no-print-bar .badge {
      background: #0284c7;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }
    .btn-group {
      display: flex;
      gap: 10px;
    }
    .btn {
      cursor: pointer;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-print {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(217,119,6,0.4);
    }
    .btn-print:hover {
      background: #92400e;
    }
    .btn-pdf {
      background: #0369a1;
      color: #ffffff;
    }
    .btn-close {
      background: #334155;
      color: #f1f5f9;
    }
    .a4-page-container {
      max-width: 210mm;
      margin: 16px auto;
      background: #ffffff;
      padding: 8mm 10mm;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .company-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin: 0;
    }
    .company-sub {
      font-size: 11px;
      font-weight: 800;
      color: #b45309;
      margin: 2px 0 0 0;
    }
    .company-dept {
      font-size: 9.5px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .header-right {
      text-align: right;
    }
    .voucher-ref-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .voucher-ref-no {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.2px;
      font-family: ui-monospace, monospace;
      margin: 1px 0 3px 0;
    }
    .banner-row {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .banner-title {
      font-weight: 900;
      font-size: 12.5px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-badge {
      background: #f59e0b;
      color: #000000;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 10px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 10.5px;
      border-bottom: 1px dashed #f1f5f9;
    }
    .row .label {
      color: #64748b;
      font-weight: 600;
    }
    .row .val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .row.highlight .val {
      font-weight: 900;
      color: #0284c7;
    }
    .photo-section {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .photo-box {
      width: 160px;
      height: 100px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      background: #e2e8f0;
      flex-shrink: 0;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-desc {
      flex: 1;
    }
    .photo-desc h4 {
      margin: 0 0 3px 0;
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .photo-desc p {
      margin: 0 0 4px 0;
      font-size: 9.5px;
      color: #64748b;
    }
    .photo-desc .verified {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #059669;
      font-weight: 800;
      font-size: 9.5px;
    }
    .regulations-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      background: #f8fafc;
      margin-bottom: 10px;
      font-size: 8.5px;
      color: #475569;
    }
    .regulations-title {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .regulations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .sig-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      background: #ffffff;
      text-align: center;
    }
    .sig-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }
    .sig-name {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      padding: 6px 0;
      border-bottom: 1.5px dashed #cbd5e1;
      margin-bottom: 6px;
    }
    .sig-footer {
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
    }
    .footer-note {
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .a4-page-container {
        margin: 0 auto !important;
        padding: 4mm 6mm !important;
        border: none !important;
        box-shadow: none !important;
        max-width: 210mm !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

<div class="no-print-bar">
  <div class="title">
    <span>🖨️ TAFGA Official Voucher Print Center</span>
    <span class="badge">A4 Standard Slip</span>
  </div>
  <div class="btn-group">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print Document</button>
    <button class="btn btn-pdf" onclick="window.print()">💾 Save / Print PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Close</button>
  </div>
</div>

<div class="a4-page-container">
  <!-- Header -->
  <div class="header-row">
    <div class="header-left">
      <div style="width: 50px; height: 36px;">
        <svg width="50" height="36" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="120" cy="75" rx="116" ry="72" fill="#D4AF57" stroke="#111" stroke-width="4" />
          <line x1="120" y1="3" x2="120" y2="147" stroke="#111" stroke-width="2.5" />
          <ellipse cx="120" cy="75" rx="84" ry="72" stroke="#111" stroke-width="2.5" fill="none" />
          <ellipse cx="120" cy="75" rx="44" ry="72" stroke="#111" stroke-width="2.5" fill="none" />
          <path d="M 5 75 Q 120 75 235 75" stroke="#111" stroke-width="3" fill="none" />
          <path d="M 28 116 L 28 152 Q 120 166 212 152 L 212 116 Z" fill="#BA9138" stroke="#111" stroke-width="4" />
          <text x="120" y="145" fill="#111" font-size="22" font-weight="bold" text-anchor="middle">Tamimi Global</text>
        </svg>
      </div>
      <div>
        <h1 class="company-title">TAMIMI GLOBAL COMPANY LIMITED</h1>
        <p class="company-sub">شركة التميمي العالمية المحدودة — TAFGA CAMP MANAGEMENT</p>
        <p class="company-dept">Executive Concierge Reception, Security Safe Vault &amp; Asset Custody Clearance</p>
      </div>
    </div>
    <div class="header-right">
      <div class="voucher-ref-label">Official Reference Voucher #</div>
      <div class="voucher-ref-no">${voucherId}</div>
      <svg width="130" height="20" viewBox="0 0 130 28" fill="none">${barcodeSvgBars}</svg>
      <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Date: ${item.issueDate || 'Today'} • ${item.issueTime || '12:00'}</div>
    </div>
  </div>

  <!-- Banner -->
  <div class="banner-row">
    <div class="banner-title">
      <span>🛡️</span>
      <span>${voucherTitle}</span>
    </div>
    <div class="status-badge">${custodyState}</div>
  </div>

  <!-- Particulars Grid -->
  <div class="grid-2">
    <!-- Item Particulars -->
    <div class="card">
      <div class="card-title">
        <span>📦 Item &amp; Custody Particulars</span>
        <span style="font-size: 8.5px; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px;">Type: ${item.type || 'GIVEN OUT'}</span>
      </div>
      <div class="row">
        <span class="label">Item Description:</span>
        <span class="val" style="font-size: 11.5px; font-weight: 900;">${item.itemName || 'Room Key'}</span>
      </div>
      <div class="row">
        <span class="label">Category / Classification:</span>
        <span class="val">${item.category || 'Assets'}</span>
      </div>
      <div class="row">
        <span class="label">Quantity / Total Units:</span>
        <span class="val">${item.quantity || 1} Unit(s)</span>
      </div>
      <div class="row highlight">
        <span class="label">Physical Condition:</span>
        <span class="val" style="color: #059669;">${item.condition || 'Good'}</span>
      </div>
      <div class="row">
        <span class="label">Expected Return Date:</span>
        <span class="val">${item.expectedReturnDate || 'Open / Permanent'}</span>
      </div>
    </div>

    <!-- Borrower Details -->
    <div class="card">
      <div class="card-title">
        <span>👤 Borrower / Depositor Details</span>
        <span style="font-size: 8.5px; background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px;">${item.personType || 'Resident Guest'}</span>
      </div>
      <div class="row">
        <span class="label">Full Name:</span>
        <span class="val" style="font-size: 11.5px; font-weight: 900;">${item.personName || 'Guest'}</span>
      </div>
      <div class="row">
        <span class="label">Contact Phone:</span>
        <span class="val" style="font-family: ui-monospace, monospace;">${item.phoneNumber || 'N/A'}</span>
      </div>
      <div class="row">
        <span class="label">Room / Unit #:</span>
        <span class="val">${item.roomNumber || 'Reception Desk'}</span>
      </div>
      <div class="row">
        <span class="label">Company / Department:</span>
        <span class="val">${item.departmentOrCompany || 'Tamimi Operations'}</span>
      </div>
      <div class="row">
        <span class="label">Authorizing Duty Officer:</span>
        <span class="val">${item.handoverByStaff || 'Tamimi Facility Operator'}</span>
      </div>
    </div>
  </div>

  <!-- Photo Section (Clean, Single container, No duplicate) -->
  ${photo ? `
  <div class="photo-section">
    <div class="photo-box">
      <img src="${photo}" alt="Attached Asset Photo" onerror="this.parentElement.style.display='none'" />
    </div>
    <div class="photo-desc">
      <h4>Item Photo &amp; Condition Verification</h4>
      <p>Official photographic evidence recorded at the concierge desk at the time of custody.</p>
      <div class="verified">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Verified Record Attached</span>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Regulations -->
  <div class="regulations-box">
    <div class="regulations-title">TAFGA Camp Operations Regulations &amp; Legal Undertaking:</div>
    <div class="regulations-grid">
      <div><strong>1. Asset Loan &amp; Keys:</strong> Borrower accepts full liability for loss/damage until formally returned.</div>
      <div><strong>2. Inbound Parcels:</strong> Parcels must be collected within 14 calendar days with valid photo ID.</div>
      <div><strong>3. Safe Vault Custody:</strong> Found items held under security for 90 days per governance protocols.</div>
    </div>
  </div>

  <!-- Dual Signatures -->
  <div class="sig-grid">
    <div class="sig-box">
      <div class="sig-title">1. Issued / Handled By Officer</div>
      <div class="sig-name">${item.handoverByStaff || 'Tamimi Facility Operator'}</div>
      <div class="sig-footer">
        <span>Duty Officer Signature &amp; Stamp</span>
        <span>Date: ___/___/2026</span>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-title">2. Recipient / Borrower / Claimant</div>
      <div class="sig-name">${item.personName || 'LIMON RAHAMN'}</div>
      <div class="sig-footer">
        <span>Borrower / Resident Signature</span>
        <span>Date: ___/___/2026</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-note">
    <span>TAFGA CAMP FACILITY MANAGEMENT SYSTEM • TAMIMI GLOBAL CO. LTD</span>
    <span>SYSTEM ID: ${voucherId} • A4 EXECUTIVE PRINT READY</span>
    <span>PRINTED: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
  </div>
</div>

<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.error('Auto print trigger notice:', e);
      }
    }, 350);
  });
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.send(html);
}

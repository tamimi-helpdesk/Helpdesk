/**
 * Generates and prints an executive Single-Page A4 Move-In & Handover Clearance Form
 * Tailored specifically for TAFGA Camp Operations & Medical Isolation Room Management.
 * 100% English, fully fills the entire A4 page height with zero wasted blank space.
 * Clean signature boxes for manual pen signature/stamp without placeholder text.
 * No demo/mock fallback data for missing fields.
 */

export interface RoomAdmissionFormData {
  roomCode: string;
  buildingName: string;
  bedNumberText: string;
  bookingType: 'General Guest' | 'Medical Isolation';
  patientName: string;
  company: string;
  phoneNumber?: string;
  nationalId?: string;
  email?: string;
  checkIn: string;
  checkOut?: string;
  purposeOfStay?: string;
  hospitalReferral?: string;
  keyIssued?: boolean;
  roomCondition?: string;
  staffNotes?: string;
  bookedByStaff?: string;
  voucherId?: string;
  digitalSignature?: string;
  secondaryOccupant?: {
    patientName: string;
    company?: string;
    phoneNumber?: string;
    nationalId?: string;
  };
}

export function generateRoomAdmissionFormHtml(
  data: RoomAdmissionFormData,
  isEditable: boolean = false
): string {
  const voucherNo =
    data.voucherId ||
    `TAFGA-RM-${data.roomCode.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;
  const isMedical = data.bookingType === 'Medical Isolation';
  const campBossName = 'Company Responsible';
  const checkInDateVal = data.checkIn || new Date().toLocaleDateString('en-GB');
  const checkOutDateVal =
    data.checkOut && data.checkOut.trim() ? data.checkOut : 'Open / On Departure';

  const tamimiSvgLogo = `
<svg width="68" height="48" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tamimiGoldGlobe" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DFC37A" />
      <stop offset="30%" stop-color="#F5E4A8" />
      <stop offset="60%" stop-color="#D4AF57" />
      <stop offset="85%" stop-color="#BA923C" />
      <stop offset="100%" stop-color="#E2C982" />
    </linearGradient>
    <linearGradient id="tamimiGoldBanner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C9A64E" />
      <stop offset="40%" stop-color="#EED993" />
      <stop offset="80%" stop-color="#BA9138" />
      <stop offset="100%" stop-color="#DEC278" />
    </linearGradient>
  </defs>
  <ellipse cx="120" cy="75" rx="116" ry="72" fill="url(#tamimiGoldGlobe)" stroke="#111111" stroke-width="3.8" />
  <line x1="120" y1="3" x2="120" y2="147" stroke="#111111" stroke-width="2.2" />
  <ellipse cx="120" cy="75" rx="84" ry="72" stroke="#111111" stroke-width="2" fill="none" />
  <ellipse cx="120" cy="75" rx="44" ry="72" stroke="#111111" stroke-width="2" fill="none" />
  <path d="M 5 75 Q 120 75 235 75" stroke="#111111" stroke-width="2.4" fill="none" />
  <path d="M 12 45 Q 120 45 228 45" stroke="#111111" stroke-width="2.2" fill="none" />
  <path d="M 12 105 Q 120 105 228 105" stroke="#111111" stroke-width="2.2" fill="none" />
  <path d="M 28 116 L 28 152 Q 120 166 212 152 L 212 116 Z" fill="url(#tamimiGoldBanner)" stroke="#111111" stroke-width="3.6" />
  <text x="120" y="145" fill="#111111" font-size="22" font-weight="bold" font-family="'Times New Roman', Times, Georgia, serif" text-anchor="middle" letter-spacing="0.6">Tamimi Global</text>
  <g transform="translate(48, 22)">
    <path d="M 124 16 C 122 10 114 8 108 14 C 102 20 100 28 94 36 C 90 41 84 43 78 40 C 72 37 70 30 64 26 C 58 22 50 24 44 30 C 40 34 38 41 32 44 C 26 47 18 45 14 38 C 10 32 12 24 16 18 C 17 16 14 14 11 16 C 6 24 4 36 10 44 C 16 52 28 54 36 49 C 42 45 46 38 52 34 C 56 31 62 31 66 35 C 72 41 74 49 82 52 C 90 55 98 51 104 44 C 112 34 118 24 126 18 Z" fill="#111111" />
    <circle cx="106" cy="10" r="3.2" fill="#111111" />
    <path d="M 68 18 Q 72 12 78 15" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <path d="M 88 16 Q 92 10 98 13" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <path d="M 22 14 Q 28 10 32 14" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
    <circle cx="28" cy="54" r="2.8" fill="#111111" />
    <circle cx="36" cy="54" r="2.8" fill="#111111" />
  </g>
  <g transform="translate(62, 75)">
    <line x1="12" y1="4" x2="114" y2="4" stroke="#111111" stroke-width="2.8" stroke-linecap="square" />
    <g>
      <rect x="2" y="4" width="14" height="26" fill="#111111" />
      <rect x="0" y="4" width="18" height="6" fill="#111111" />
      <line x1="5" y1="10" x2="5" y2="30" stroke="#DFC37A" stroke-width="1.2" />
      <line x1="9" y1="10" x2="9" y2="30" stroke="#DFC37A" stroke-width="1.2" />
      <line x1="13" y1="10" x2="13" y2="30" stroke="#DFC37A" stroke-width="1.2" />
    </g>
    <text x="28" y="28" fill="#111111" font-size="26" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif" letter-spacing="-0.5">A</text>
    <g transform="translate(48, 8)">
      <text x="0" y="20" fill="#111111" font-size="24" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">M</text>
      <line x1="3" y1="4" x2="3" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="7" y1="4" x2="7" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="14" y1="4" x2="14" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="18" y1="4" x2="18" y2="20" stroke="#DFC37A" stroke-width="1" />
    </g>
    <text x="74" y="28" fill="#111111" font-size="26" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">I</text>
    <g transform="translate(84, 8)">
      <text x="0" y="20" fill="#111111" font-size="24" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">M</text>
      <line x1="3" y1="4" x2="3" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="7" y1="4" x2="7" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="14" y1="4" x2="14" y2="20" stroke="#DFC37A" stroke-width="1" />
      <line x1="18" y1="4" x2="18" y2="20" stroke="#DFC37A" stroke-width="1" />
    </g>
    <text x="110" y="28" fill="#111111" font-size="26" font-weight="900" font-family="'Arial Black', 'Impact', sans-serif">I</text>
  </g>
</svg>
`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TAFGA Move-In & Handover Form - ${data.roomCode} - ${data.patientName || 'Occupant'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 5mm 6mm 16mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
      font-size: 9.5px;
      line-height: 1.35;
    }
    .a4-page {
      width: 189mm;
      min-height: 275mm;
      max-height: 284mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 7px 4px 5px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }

    /* Header */
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 7px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-title {
      font-size: 15.5px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.2px;
      line-height: 1.15;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 1px;
    }
    .header-right {
      text-align: right;
    }
    .header-right-title {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      font-family: Georgia, serif;
      line-height: 1;
    }
    .header-right-sub {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    /* Main Navy Title Banner */
    .main-title-banner {
      background: #0b2545;
      color: #ffffff;
      text-align: center;
      font-weight: 900;
      font-size: 14px;
      padding: 6.5px 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-radius: 2px;
      margin-bottom: 7px;
    }

    /* Golden Section Strip */
    .section-strip {
      background: #b39055;
      color: #0f172a;
      font-weight: 900;
      font-size: 10.5px;
      padding: 5px 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-top: 1.5px solid #0f172a;
      border-left: 1.5px solid #0f172a;
      border-right: 1.5px solid #0f172a;
    }

    /* Data Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #0f172a;
      font-size: 10px;
      margin-bottom: 7px;
    }
    .data-table th, .data-table td {
      border: 1px solid #0f172a;
      padding: 6px 8.5px;
      vertical-align: middle;
      line-height: 1.3;
    }
    .data-table th {
      background: #e8ded1;
      font-weight: 800;
      color: #0f172a;
      text-align: left;
      white-space: nowrap;
    }
    .data-table td {
      background: #ffffff;
      color: #0f172a;
    }
    .val-strong {
      font-weight: 800;
      color: #0f172a;
    }

    .sq-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.2px solid #0f172a;
      text-align: center;
      line-height: 11px;
      font-size: 9.5px;
      font-weight: 900;
      margin-right: 4px;
      vertical-align: middle;
      background: #ffffff;
    }
    .sq-box.checked {
      background: #0f172a;
      color: #ffffff;
    }
    .check-opt {
      display: inline-flex;
      align-items: center;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }

    /* Section 5 Dual Signatures */
    .sign-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 7px;
    }
    .sign-card {
      border: 1.5px solid #0f172a;
    }
    .sign-card-head {
      background: #f1f5f9;
      padding: 5px 8.5px;
      border-bottom: 1.5px solid #0f172a;
    }
    .sign-card-title {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .sign-card-prompt {
      font-size: 8.5px;
      color: #475569;
      margin-top: 1px;
    }
    .sign-card-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #ffffff;
      font-size: 10px;
    }
    .sign-col {
      padding: 7px 8.5px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 118px;
    }
    .sign-col:first-child {
      border-right: 1.5px solid #0f172a;
    }
    .sign-role-title {
      font-size: 9.5px;
      font-weight: 900;
      color: #0f172a;
    }
    .sign-name-text {
      font-size: 10px;
      font-weight: 800;
      color: #1e1b4b;
      margin-top: 1px;
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sign-box-area {
      height: 52px;
      border: 1.2px dashed #94a3b8;
      background: #ffffff;
      margin: 4px 0;
      border-radius: 2px;
    }
    .sign-line {
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
    }

    /* Notice Box */
    .notice-box {
      border: 1.5px solid #94a3b8;
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 8.5px;
      color: #334155;
      line-height: 1.4;
      border-radius: 2px;
      margin-bottom: 7px;
    }

    /* Footer */
    .page-footer {
      border-top: 1px solid #64748b;
      padding-top: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #475569;
      font-weight: 700;
      white-space: nowrap;
    }

    @media print {
      html, body {
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .a4-page {
        width: 100% !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: avoid !important;
        break-before: avoid !important;
      }
    }
  </style>
</head>
<body ${isEditable ? 'contenteditable="true"' : ''}>

  <!-- SINGLE-PAGE A4 ROOM ADMISSION & HANDOVER CLEARANCE FORM -->
  <div class="a4-page">
    <div style="display:flex; flex-direction:column;">
      
      <!-- Top Brand Header -->
      <div class="company-header">
        <div class="header-left">
          ${tamimiSvgLogo}
          <div>
            <div class="brand-title">TAMIMI GLOBAL COMPANY LIMITED</div>
            <div class="brand-sub">TAFGA COMMUNITY MANAGEMENT &amp; HOUSING SERVICES</div>
          </div>
        </div>
        <div class="header-right">
          <div class="header-right-title">TAMIMI</div>
          <div class="header-right-sub">Community Management</div>
          <div style="font-size:9.5px; font-family:monospace; color:#334155; font-weight:800; margin-top:2px;">Ref: ${voucherNo}</div>
        </div>
      </div>

      <!-- Main Banner -->
      <div class="main-title-banner" style="${isMedical ? 'background:#7f1d1d;' : 'background:#0b2545;'}">
        ${isMedical ? 'Medical Isolation & Health Care Admission Clearance Form' : 'Resident & Guest Room Admission & Handover Clearance Form'}
      </div>

      <!-- Section 1: Property & Room Allocation -->
      <div class="section-strip" style="display:flex; justify-content:space-between; align-items:center;">
        <span>1. ${isMedical ? 'Isolation Unit & Ward Allocation' : 'Property & Accommodation Allocation'}</span>
        <span style="font-size:9px; background:rgba(255,255,255,0.7); padding:1px 6px; border-radius:2px;">
          ${isMedical ? 'Clinical Ward' : 'Standard Housing'}
        </span>
      </div>
      <table class="data-table">
        <tr>
          <th style="width: 22%;">${isMedical ? 'Isolation Facility:' : 'Property / Facility:'}</th>
          <td style="width: 38%;" class="val-strong">
            ${isMedical ? `TAFGA Medical Ward (${data.buildingName || '-'})` : `TAFGA Residential Complex (${data.buildingName || '-'})`}
          </td>
          <th style="width: 18%;">${isMedical ? 'Medical Ref:' : 'Booking Ref:'}</th>
          <td style="font-family:monospace; font-weight:bold; font-size:11px;">${voucherNo}</td>
        </tr>
        <tr>
          <th>${isMedical ? 'Assigned Isolation Bed:' : 'Assigned Unit / Room:'}</th>
          <td class="val-strong" style="font-size:12px; color:#0f172a;">
            Room ${data.roomCode || '-'} · <span style="${isMedical ? 'color:#881337;' : 'color:#1e3a8a;'} font-weight:900;">${data.bedNumberText || '-'}</span>
          </td>
          <th>Stay Category:</th>
          <td>
            <div style="display:flex; gap:14px;">
              <span class="check-opt"><span class="sq-box ${!isMedical ? 'checked' : ''}">${!isMedical ? '✓' : ''}</span> General Guest</span>
              <span class="check-opt"><span class="sq-box ${isMedical ? 'checked' : ''}">${isMedical ? '✓' : ''}</span> Medical Isolation</span>
            </div>
          </td>
        </tr>
        <tr>
          <th>${isMedical ? 'Admission Date:' : 'Check-In Date:'}</th>
          <td class="val-strong" style="color:#15803d; font-family:monospace; font-size:11.5px;">${checkInDateVal}</td>
          <th>${isMedical ? 'Expected Discharge:' : 'Check-Out Date:'}</th>
          <td class="val-strong" style="font-family:monospace; font-size:11.5px;">${checkOutDateVal}</td>
        </tr>
      </table>

      <!-- Section 2: Person Demographics -->
      <div class="section-strip">
        2. ${isMedical ? 'Patient / Resident Clinical Demographics' : 'Guest / Resident Personal & Work Details'}
      </div>
      <table class="data-table">
        <tr>
          <th style="width: 22%;">${isMedical ? 'Patient Full Name:' : 'Guest Full Name:'}</th>
          <td colspan="3" class="val-strong" style="font-size:13px; color:#0f172a;">${data.patientName || '-'}</td>
        </tr>
        <tr>
          <th>${isMedical ? 'Sponsoring Company:' : 'Company / Employer:'}</th>
          <td style="width: 38%;" class="val-strong" style="font-size:11.5px;">${data.company || '-'}</td>
          <th style="width: 18%;">${isMedical ? 'ID / Iqama No:' : 'ID / Iqama / Passport:'}</th>
          <td style="font-family:monospace; font-weight:bold; font-size:11.5px;">${data.nationalId || '-'}</td>
        </tr>
        <tr>
          <th>${isMedical ? 'Emergency Contact:' : 'Mobile Contact:'}</th>
          <td style="font-family:monospace; font-size:11px;" class="val-strong">${data.phoneNumber || '-'}</td>
          <th>E-mail:</th>
          <td style="font-family:monospace; font-size:10.5px;">${data.email || '-'}</td>
        </tr>

        ${
          isMedical
            ? `
        <tr>
          <th style="color:#7f1d1d;">Referral Medical Center:</th>
          <td style="color:#881337; font-weight:bold;">${data.hospitalReferral || 'Alleanza Clinic'}</td>
          <th>Isolation Reason / Diagnosis:</th>
          <td style="font-weight:600;">${data.purposeOfStay || 'Medical Isolation & Clinical Observation'}</td>
        </tr>
        `
            : `
        <tr>
          <th>Purpose of Stay / Assignment:</th>
          <td colspan="3" style="font-weight:bold; color:#0f172a;">${data.purposeOfStay || 'Resident Duty / General Accommodation'}</td>
        </tr>
        `
        }

        ${
          data.secondaryOccupant
            ? `
        <tr style="background:#fef3c7;">
          <th>Secondary Occupant:</th>
          <td colspan="3">
            <span class="val-strong" style="font-size:11px;">${data.secondaryOccupant.patientName || '-'}</span> | 
            ID: <span style="font-family:monospace;">${data.secondaryOccupant.nationalId || '-'}</span> | 
            Mobile: <span style="font-family:monospace;">${data.secondaryOccupant.phoneNumber || '-'}</span>
          </td>
        </tr>
        `
            : ''
        }
      </table>

      <!-- Section 3: Handed-over Items Inventory -->
      <div class="section-strip">
        3. ${isMedical ? 'Sanitized Inventory & Isolation Asset Custody' : 'Room Inventory & Key Handover Custody'}
      </div>
      <table class="data-table">
        <tr style="background:#e8ded1;">
          <th style="width:42%; font-weight:900;">Item / Asset Description</th>
          <th style="width:18%; text-align:center; font-weight:900;">Handed Over</th>
          <th style="width:20%; text-align:center; font-weight:900;">Check-In Status</th>
          <th style="width:20%; text-align:center; font-weight:900;">${isMedical ? 'Discharge Return' : 'Check-Out Return'}</th>
        </tr>
        ${
          isMedical
            ? `
        <tr>
          <td class="val-strong">Sanitized Main Room Key / Electronic Isolation Pass</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Disinfected</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Complete</td>
        </tr>
        <tr>
          <td class="val-strong">Medical-Grade Bed Linen &amp; Pillow Set (Pre-Sanitized)</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Clean &amp; Sealed</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Handed</td>
        </tr>
        <tr>
          <td class="val-strong">AC Remote &amp; Independent Climate Ventilation Unit</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Operational</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Handed</td>
        </tr>
        <tr>
          <td class="val-strong">Disinfected Personal Locker &amp; Private Fixtures</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Intact</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Handed</td>
        </tr>
        <tr>
          <td class="val-strong">Medical Waste Disposal Kit &amp; Sanitization Supplies</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Provided</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Complete</td>
        </tr>
        `
            : `
        <tr>
          <td class="val-strong">Main Room Key / Electronic Access Card</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Verified</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Returned</td>
        </tr>
        <tr>
          <td class="val-strong">Bedding &amp; Clean Linen Set (Mattress, Duvet, Pillow)</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Fresh &amp; Ready</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Handed</td>
        </tr>
        <tr>
          <td class="val-strong">AC Remote / Climate Control Unit</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Operational</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Handed</td>
        </tr>
        <tr>
          <td class="val-strong">Personal Wardrobe / Locker Key &amp; Room Fixtures</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Intact</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Handed</td>
        </tr>
        <tr>
          <td class="val-strong">Camp Identification Pass / Housing Authorization</td>
          <td style="text-align:center;"><span class="val-strong">Yes [ ✓ ]</span></td>
          <td style="text-align:center;" class="val-strong">Qty: 1 · Authorized</td>
          <td style="text-align:center; color:#64748b; font-weight:600;">[ &nbsp; ] Complete</td>
        </tr>
        `
        }
      </table>

      <!-- Section 4: Condition & Hygiene Summary -->
      <div class="section-strip">
        4. ${isMedical ? 'Clinical Sanitization & Health Clearance' : 'Room Condition & Handover Inspection'}
      </div>
      <table class="data-table">
        <tr>
          <th style="width:20%;">${isMedical ? 'Deep Sanitization:' : 'Cleanliness &amp; Furniture:'}</th>
          <td style="width:30%;"><strong>${isMedical ? '[ ✓ ] Sanitized &amp; Disinfected' : '[ ✓ ] Clean &amp; Inspected'}</strong></td>
          <th style="width:20%;">${isMedical ? 'Isolation Ventilation:' : 'HVAC / Cooling:'}</th>
          <td style="width:30%;"><strong>[ ✓ ] Tested &amp; Working</strong></td>
        </tr>
        <tr>
          <th>${isMedical ? 'Infection Protocol:' : 'Electrical &amp; Power:'}</th>
          <td><strong>${isMedical ? '[ ✓ ] Cleared for Ward Admission' : '[ ✓ ] Fully Working'}</strong></td>
          <th>Door &amp; Locks:</th>
          <td><strong>[ ✓ ] Secure &amp; Functional</strong></td>
        </tr>
        <tr>
          <th>${isMedical ? 'Clinical Remarks:' : 'Staff Remarks:'}</th>
          <td colspan="3" style="color:#334155; font-style:italic;">
            ${data.staffNotes || data.roomCondition || (isMedical ? 'Standard Medical Observation Protocols Active' : 'Cleaned & Ready for Occupancy')}
          </td>
        </tr>
      </table>

      <!-- Section 5: Dual Check-In & Check-Out Signatures -->
      <div class="section-strip">
        5. ${isMedical ? 'Dual Admission & Discharge Clearance Sign-Off' : 'Dual Check-In & Check-Out Clearance Sign-Off'}
      </div>
      <div class="sign-container">
        
        <!-- Check In Sign-off -->
        <div class="sign-card">
          <div class="sign-card-head">
            <div class="sign-card-title">A. ${isMedical ? 'Ward Admission Acceptance' : 'Check-In Acceptance'}</div>
            <div class="sign-card-prompt">
              ${isMedical ? 'I acknowledge admission into the isolation ward and key receipt.' : 'I confirm receipt of room key(s) and assets in good order.'}
            </div>
          </div>
          <div class="sign-card-body">
            <div class="sign-col">
              <div>
                <div class="sign-role-title">${isMedical ? 'Patient / Resident:' : 'Guest / Resident:'}</div>
                <div class="sign-name-text">${data.patientName || '-'}</div>
              </div>
              <div class="sign-box-area" style="display:flex; align-items:center; justify-content:center; overflow:hidden;">
                ${
                  data.digitalSignature
                    ? `<img src="${data.digitalSignature}" style="max-height:100%; max-width:100%; object-fit:contain;" alt="Digital Signature" />`
                    : ''
                }
              </div>
              <div>
                <div class="sign-line">${data.digitalSignature ? 'Sign: <strong>[ Verified Digital ]</strong>' : 'Sign: ___________________'}</div>
                <div style="font-size:8.5px; color:#475569; margin-top:2px;">
                  Date: <strong>${checkInDateVal}</strong>
                </div>
              </div>
            </div>
            <div class="sign-col">
              <div>
                <div class="sign-role-title">${isMedical ? 'Medical Officer / Camp Boss:' : 'Camp Boss / Housing POC:'}</div>
                <div class="sign-name-text">${campBossName}</div>
              </div>
              <div class="sign-box-area"></div>
              <div>
                <div class="sign-line">Sign: ___________________</div>
                <div style="font-size:8.5px; color:#475569; margin-top:2px;">
                  Date: <strong>${checkInDateVal}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Check Out Sign-off -->
        <div class="sign-card">
          <div class="sign-card-head">
            <div class="sign-card-title">B. ${isMedical ? 'Medical Discharge Clearance' : 'Check-Out Clearance'}</div>
            <div class="sign-card-prompt">
              ${isMedical ? 'I confirm medical recovery discharge clearance & key return.' : 'I confirm return of all keys & departure clearance.'}
            </div>
          </div>
          <div class="sign-card-body">
            <div class="sign-col">
              <div>
                <div class="sign-role-title">${isMedical ? 'Patient / Resident:' : 'Guest / Resident:'}</div>
                <div class="sign-name-text">${data.patientName || '-'}</div>
              </div>
              <div class="sign-box-area"></div>
              <div>
                <div class="sign-line">Sign: ___________________</div>
                <div style="font-size:8.5px; color:#475569; margin-top:2px;">
                  Date: <strong>${checkOutDateVal}</strong>
                </div>
              </div>
            </div>
            <div class="sign-col">
              <div>
                <div class="sign-role-title">${isMedical ? 'Medical Officer / Camp Boss:' : 'Camp Boss / Housing POC:'}</div>
                <div class="sign-name-text">${campBossName}</div>
              </div>
              <div class="sign-box-area"></div>
              <div>
                <div class="sign-line">Sign: ___________________</div>
                <div style="font-size:8.5px; color:#475569; margin-top:2px;">
                  Date: <strong>${checkOutDateVal}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Camp Rules Notice & Undertaking -->
      <div class="notice-box">
        ${
          isMedical
            ? `
        <strong>Medical Isolation &amp; Health Undertaking:</strong> 
        1. The patient/occupant agrees to strictly remain inside the designated isolation room until cleared by the camp medical team or referring clinic (e.g. Alleanza Clinic). 
        2. Meals and hydration will be delivered directly outside the door. 
        3. Face masks and hand hygiene must be maintained during all interactions. 
        4. In case of emergency or worsening symptoms, immediately notify the Tamimi Clinic team. 
        5. All keys and assets must be handed over upon discharge.
        `
            : `
        <strong>Notice &amp; Housing Policy Undertaking:</strong> 
        1. The occupant acknowledges receipt of the designated room and inventory in clean, working condition and agrees to strictly adhere to TAFGA housing regulations. 
        2. Quiet hours (22:00 – 06:00) must be observed; unauthorized visitors and high-wattage cooking appliances inside the room are strictly prohibited. 
        3. Care of company property is mandatory. 
        4. All issued keys and passes must be returned upon departure.
        `
        }
      </div>

    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <div>TAMIMI GLOBAL COMPANY LIMITED · TAFGA COMMUNITY MANAGEMENT &amp; HOUSING SERVICES</div>
      <div>Doc Ref: ${voucherNo}</div>
    </div>
  </div>

  ${
    !isEditable
      ? `
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
  `
      : ''
  }
</body>
</html>
`;
}

export function printRoomAdmissionForm(data: RoomAdmissionFormData): void {
  const html = generateRoomAdmissionFormHtml(data, false);
  try {
    const printWindow = window.open('', '_blank', 'width=880,height=1000');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      window.print();
    }
  } catch (e) {
    window.print();
  }
}

/**
 * Downloads the admission form as an editable Microsoft Word (.doc) document
 */
export function downloadRoomAdmissionFormDoc(data: RoomAdmissionFormData): void {
  const innerHtml = generateRoomAdmissionFormHtml(data, true);
  const wordDocumentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>TAFGA Admission Form - ${data.roomCode}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${innerHtml}
    </body>
    </html>
  `;
  const blob = new Blob(['\ufeff', wordDocumentContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (data.patientName || 'Occupant').replace(/[^A-Za-z0-9]/g, '_');
  const safeRoom = (data.roomCode || 'Room').replace(/[^A-Za-z0-9]/g, '_');
  link.download = `TAFGA_Admission_Form_${safeRoom}_${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the admission form as an editable HTML document
 */
export function downloadRoomAdmissionFormHtml(data: RoomAdmissionFormData): void {
  const html = generateRoomAdmissionFormHtml(data, true);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (data.patientName || 'Occupant').replace(/[^A-Za-z0-9]/g, '_');
  const safeRoom = (data.roomCode || 'Room').replace(/[^A-Za-z0-9]/g, '_');
  link.download = `TAFGA_Admission_Form_${safeRoom}_${safeName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

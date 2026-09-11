import { Booking } from '../types';
import { formatDisplayDate, formatDisplayTime, getDayName } from './storageService';
import {
  printRoomAdmissionForm as printRoomAdmissionFormUtil,
  downloadRoomAdmissionFormDoc as downloadRoomAdmissionFormDocUtil,
  downloadRoomAdmissionFormHtml as downloadRoomAdmissionFormHtmlUtil,
  RoomAdmissionFormData,
} from './printAdmissionFormService';

/**
 * Service to generate high-resolution printable vouchers, downloadable receipts (.txt),
 * and shareable WhatsApp/SMS summaries for single and batch bookings.
 */
export const PrintReceiptService = {
  /**
   * Generates a plain-text official receipt for 1-click download
   */
  generateReceiptText(booking: Booking): string {
    const divider = '=======================================================';
    const subDivider = '-------------------------------------------------------';
    const dateFormatted = formatDisplayDate(booking.date);
    const day = getDayName(booking.date);
    const timeFormatted = `${formatDisplayTime(booking.startTime)} – ${formatDisplayTime(booking.endTime)}`;

    return [
      divider,
      '         TAMIMI GLOBAL COMPANY - HELPDESK PORTAL       ',
      '        TAFGA SPORTS & RECREATIONAL FACILITY PASS      ',
      divider,
      `BOOKING ID     : ${booking.id}`,
      `DATE ISSUED    : ${new Date(booking.createdAt).toLocaleString()}`,
      `STATUS         : ${booking.status.toUpperCase()}`,
      subDivider,
      'RESERVATION DETAILS:',
      `Facility       : ${booking.facilityName}`,
      `Resource/Stage : ${booking.stage}`,
      `Date & Day     : ${dateFormatted} (${day})`,
      `Time Slot      : ${timeFormatted} (${booking.durationMinutes} mins)`,
      `Number of Guests: ${booking.numberOfGuests || 1}`,
      subDivider,
      'CUSTOMER & CONTACT:',
      `Customer Name  : ${booking.customerName}`,
      `Phone Number   : ${booking.phoneNumber}`,
      booking.email ? `Email          : ${booking.email}` : null,
      booking.departmentOrTeam ? `Department/Team: ${booking.departmentOrTeam}` : null,
      booking.bookedByStaff ? `Booked By Staff: ${booking.bookedByStaff}` : null,
      booking.notes ? `Special Notes  : ${booking.notes}` : null,
      booking.isRecurring ? `Recurring Info : ${booking.recurringSummary || 'Part of recurring schedule'}` : null,
      subDivider,
      `SECURITY AUTH  : TG-VERIFIED-${booking.id.slice(-6)}`,
      divider,
      '   TAMIMI FACILITY MANAGEMENT - CENTRAL VERIFICATION   ',
      divider,
    ]
      .filter(Boolean)
      .join('\r\n');
  },

  /**
   * Generates a plain-text schedule report for batch recurring bookings
   */
  generateBatchReceiptText(bookings: Booking[]): string {
    if (!bookings || bookings.length === 0) return '';
    const first = bookings[0];
    const divider = '=======================================================';
    const subDivider = '-------------------------------------------------------';

    const sessions = bookings.map((b, i) => {
      const day = getDayName(b.date, true);
      const time = `${formatDisplayTime(b.startTime)} - ${formatDisplayTime(b.endTime)}`;
      return `  [#${i + 1}] ID: ${b.id.padEnd(16)} | ${b.date} (${day}) | ${time} | ${b.stage}`;
    });

    return [
      divider,
      '         TAMIMI GLOBAL COMPANY - HELPDESK PORTAL       ',
      '          RECURRING SEASON / MULTI-DATE SCHEDULE       ',
      divider,
      `FACILITY       : ${first.facilityName}`,
      `RESOURCE/STAGE : ${first.stage}`,
      `CUSTOMER NAME  : ${first.customerName}`,
      `PHONE NUMBER   : ${first.phoneNumber}`,
      first.departmentOrTeam ? `DEPARTMENT/TEAM: ${first.departmentOrTeam}` : null,
      first.bookedByStaff ? `BOOKED BY STAFF: ${first.bookedByStaff}` : null,
      `TOTAL SESSIONS : ${bookings.length} Confirmed Slots`,
      subDivider,
      'SCHEDULED SESSIONS LIST:',
      ...sessions,
      subDivider,
      'NOTICE & VERIFICATION:',
      'All listed slots are locked in the master registry.',
      'To manage or cancel individual sessions, lookup the respective Booking ID.',
      divider,
      '             DESIGNED BY LIMON RAHMAN                  ',
      '      TAMIMI HELPDESK - ALL RIGHTS RESERVED © 2026     ',
      divider,
    ]
      .filter(Boolean)
      .join('\r\n');
  },

  /**
   * Downloads receipt file directly (.txt)
   */
  downloadReceiptFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Formats WhatsApp/SMS shareable text
   */
  getShareableSummary(booking: Booking): string {
    const dateFormatted = formatDisplayDate(booking.date);
    const timeFormatted = `${formatDisplayTime(booking.startTime)} - ${formatDisplayTime(booking.endTime)}`;
    return [
      `🎟️ *TAMIMI HELPDESK - RESERVATION CONFIRMED*`,
      `📌 *Booking ID:* ${booking.id}`,
      `🏟️ *Facility:* ${booking.facilityName} (${booking.stage})`,
      `📅 *Date:* ${dateFormatted}`,
      `⏰ *Time:* ${timeFormatted}`,
      `👤 *Customer:* ${booking.customerName} (${booking.phoneNumber})`,
      booking.departmentOrTeam ? `🏢 *Team:* ${booking.departmentOrTeam}` : null,
      booking.notes ? `📝 *Notes:* ${booking.notes}` : null,
      `✅ *Status:* CONFIRMED`,
      `---------------------------------`,
      `Design by LIMON RAHMAN`,
    ]
      .filter(Boolean)
      .join('\n');
  },

  /**
   * Opens standalone printable pass in a new popup with auto-print
   */
  printFormattedPass(booking: Booking): void {
    this.printFacilityAdmissionForm(booking);
  },

  /**
   * Generates and prints an executive A4 size Facility Admission / Booking & Signature Form
   * Complete with facility parameters, customer details, match rules, camp guidelines, and dual signature sections.
   */
  printFacilityAdmissionForm(booking: Booking): void {
    const dateFormatted = formatDisplayDate(booking.date);
    const timeFormatted = `${formatDisplayTime(booking.startTime)} – ${formatDisplayTime(booking.endTime)}`;
    const day = getDayName(booking.date);
    const documentRefNo = `TAFGA-ADM-${booking.id.replace(/[^A-Za-z0-9]/g, '')}-${booking.date.replace(/-/g, '')}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TAFGA Official Reservation Form - ${booking.facilityName} - ${booking.customerName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 6mm 8mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .a4-page {
      background: #ffffff;
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 10mm 12mm 18mm;
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    
    /* Header Styles */
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .ref-badge {
      text-align: right;
    }
    .status-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #ffffff;
      background: #0284c7;
    }
    .ref-no {
      font-size: 9.5px;
      font-family: monospace;
      font-weight: 700;
      color: #64748b;
      margin-top: 3px;
    }

    /* Document Title Banner */
    .doc-banner {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: center;
      margin-bottom: 12px;
    }
    .doc-banner h1 {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0369a1;
    }
    .doc-banner p {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-top: 1px;
    }

    /* Metrics Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .metric-card.accent {
      background: #f0f9ff;
      border-color: #bae6fd;
    }
    .metric-lbl {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .metric-val {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }
    .metric-val.blue {
      color: #0284c7;
      font-family: monospace;
    }
    .metric-val.green {
      color: #059669;
    }

    /* Data Tables */
    .section-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #1e293b;
      background: #f1f5f9;
      padding: 5px 10px;
      border-top: 1.5px solid #cbd5e1;
      border-left: 1.5px solid #cbd5e1;
      border-right: 1.5px solid #cbd5e1;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 12px;
      border: 1.5px solid #cbd5e1;
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
      overflow: hidden;
    }
    .info-table td {
      padding: 6.5px 10px;
      border: 1px solid #e2e8f0;
    }
    .info-table .lbl {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      width: 25%;
    }
    .info-table .val {
      font-weight: 800;
      color: #0f172a;
      width: 25%;
    }

    /* Rules & Guidelines Box */
    .rules-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
      margin-bottom: 12px;
    }
    .rules-header {
      font-size: 10.5px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    .rules-list {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.45;
      padding-left: 16px;
    }
    .rules-list li {
      margin-bottom: 3px;
    }

    /* Dual Signature Box */
    .signature-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 10px;
      margin-bottom: 8px;
    }
    .sign-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 110px;
    }
    .sign-box-title {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      color: #1e293b;
    }
    .sign-prompt {
      font-size: 9px;
      color: #64748b;
      font-style: italic;
      line-height: 1.3;
    }
    .sign-line {
      border-top: 1px dashed #94a3b8;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      font-weight: 700;
      color: #334155;
    }
    .stamp-placeholder {
      width: 48px;
      height: 48px;
      border: 1px dashed #94a3b8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7.5px;
      color: #94a3b8;
      text-align: center;
      font-weight: bold;
    }

    /* Footer Styles */
    .form-footer {
      border-top: 1.5px solid #0f172a;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748b;
      margin-top: auto;
    }
    .footer-author {
      font-weight: 800;
      color: #0284c7;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .a4-page {
        border: none;
        box-shadow: none;
        width: 100%;
        min-height: auto;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="a4-page">
    <div>
      <!-- Header -->
      <div class="company-header">
        <div>
          <div class="brand-title">TAMIMI GLOBAL COMPANY LIMITED</div>
          <div class="brand-sub">TAFGA SPORTS &amp; RECREATIONAL FACILITIES · OFFICIAL RESERVATION PASS</div>
        </div>
        <div class="ref-badge">
          <div class="status-pill">${booking.status}</div>
          <div class="ref-no">Ref: ${documentRefNo}</div>
        </div>
      </div>

      <!-- Banner -->
      <div class="doc-banner">
        <h1>OFFICIAL FACILITY ADMISSION &amp; RESERVATION SLIP</h1>
        <p>Authorised Access Pass · Resident / Guest &amp; HelpDesk Operations Central Record</p>
      </div>

      <!-- 4-Card Summary Grid -->
      <div class="summary-grid">
        <div class="metric-card accent">
          <div class="metric-lbl">Booking Reference ID</div>
          <div class="metric-val blue">${booking.id}</div>
        </div>
        <div class="metric-card">
          <div class="metric-lbl">Facility Name</div>
          <div class="metric-val">${booking.facilityName}</div>
        </div>
        <div class="metric-card">
          <div class="metric-lbl">Court / Stage</div>
          <div class="metric-val">${booking.stage}</div>
        </div>
        <div class="metric-card">
          <div class="metric-lbl">Allocated Duration</div>
          <div class="metric-val green">${booking.durationMinutes} Mins</div>
        </div>
      </div>

      <!-- Section 1: Reservation & Schedule Details -->
      <div class="section-title">1. Reservation &amp; Schedule Details</div>
      <table class="info-table">
        <tr>
          <td class="lbl">Date &amp; Day</td>
          <td class="val">${dateFormatted} (${day})</td>
          <td class="lbl">Time Window</td>
          <td class="val" style="color: #059669;">${timeFormatted}</td>
        </tr>
        <tr>
          <td class="lbl">Facility Tab Name</td>
          <td class="val">${booking.sheetTabName}</td>
          <td class="lbl">Guests / Players</td>
          <td class="val">${booking.numberOfGuests || 1} Person(s)</td>
        </tr>
        <tr>
          <td class="lbl">Issued Timestamp</td>
          <td class="val" style="font-family: monospace; font-size: 10px;">${new Date(booking.createdAt).toLocaleString()}</td>
          <td class="lbl">Booking Mode</td>
          <td class="val">${booking.isRecurring ? 'Recurring Season Schedule' : 'Standard Daily Booking'}</td>
        </tr>
      </table>

      <!-- Section 2: Resident / Customer Information -->
      <div class="section-title">2. Resident &amp; Customer Information</div>
      <table class="info-table">
        <tr>
          <td class="lbl">Customer / Team Leader</td>
          <td class="val">${booking.customerName}</td>
          <td class="lbl">Contact Phone</td>
          <td class="val" style="font-family: monospace;">${booking.phoneNumber}</td>
        </tr>
        <tr>
          <td class="lbl">Department / Team</td>
          <td class="val">${booking.departmentOrTeam || 'Tamimi Resident / Staff'}</td>
          <td class="lbl">Email Address</td>
          <td class="val">${booking.email || 'N/A'}</td>
        </tr>
        <tr>
          <td class="lbl">Authorized In-Charge</td>
          <td class="val" colspan="3">${booking.bookedByStaff || 'Helpdesk Admin / Operations'}</td>
        </tr>
      </table>

      <!-- Section 3: Notes & Match Custom Rules -->
      ${
        booking.notes
          ? `
      <div class="section-title">3. Match Configuration &amp; Special Add-ons</div>
      <table class="info-table">
        <tr>
          <td class="lbl" style="width: 20%;">Instructions</td>
          <td class="val" colspan="3" style="font-weight: 600; color: #1e293b;">${booking.notes}</td>
        </tr>
      </table>
      `
          : ''
      }

      <!-- Section 4: Rules & Regulations -->
      <div class="rules-box">
        <div class="rules-header">
          <span>4. Facility Guidelines &amp; Code of Conduct</span>
          <span style="color: #64748b; font-size: 9px;">Central Policy 2026</span>
        </div>
        <ol class="rules-list">
          <li><strong>Entrance Verification:</strong> Present this printed voucher or Booking ID upon arriving at the facility.</li>
          <li><strong>Punctuality:</strong> Arrive 5-10 minutes prior to slot start time. Vacate the court/pitch promptly at session expiry.</li>
          <li><strong>Proper Attire:</strong> Clean indoor/sports shoes are strictly required. Non-marking soles for wooden and synthetic courts.</li>
          <li><strong>Zero Damage Policy:</strong> Tamimi camp assets, floodlights, turf, and equipment must be handled respectfully.</li>
          <li><strong>Cleanliness:</strong> Dispose of water bottles, towels, and waste in designated camp recycling bins.</li>
        </ol>
      </div>

      <!-- Section 5: Dual Signatures -->
      <div class="signature-container">
        
        <!-- Left: Resident / Customer Signature -->
        <div class="sign-box">
          <div class="sign-box-title">Resident / Team Leader Signature</div>
          <div class="sign-prompt">
            "I agree to follow all camp safety, footwear, and facility usage regulations."
          </div>
          <div class="sign-line">
            <div>
              <div>Signature: __________________________</div>
              <div style="font-size:8.5px; color:#64748b; margin-top:2px;">Name: ${booking.customerName}</div>
            </div>
            <div style="text-align:right;">
              <div>Date: ____/____/2026</div>
              <div style="font-size:8.5px; color:#64748b; margin-top:2px;">Phone: ${booking.phoneNumber}</div>
            </div>
          </div>
        </div>

        <!-- Right: Authorized Camp Officer / Helpdesk -->
        <div class="sign-box">
          <div class="sign-box-title">Authorized Camp Officer / Stamp</div>
          <div class="sign-prompt" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <span>Verified &amp; issued by Helpdesk Operations.</span>
            <span class="stamp-placeholder">OFFICIAL STAMP</span>
          </div>
          <div class="sign-line">
            <div>
              <div>Officer Sign: _______________________</div>
              <div style="font-size:8.5px; color:#64748b; margin-top:2px;">Staff: ${booking.bookedByStaff || 'Helpdesk Admin'}</div>
            </div>
            <div style="text-align:right;">
              <div>Date: ${new Date().toLocaleDateString('en-GB')}</div>
              <div style="font-size:8.5px; color:#64748b; margin-top:2px;">Status: CONFIRMED</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Bar -->
      <div class="form-footer">
        <div>
          TAMIMI GLOBAL COMPANY LIMITED · TAFGA SPORTS &amp; RECREATION HELPDESK<br>
          Official Admission Pass · Central Registry Record
        </div>
        <div style="text-align: right;">
          Generated: ${new Date().toLocaleString('en-GB')}<br>
          <span class="footer-author">Designed by LIMON RAHMAN</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    try {
      const printWindow = window.open('', '_blank', 'width=850,height=950');
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
  },


  /**
   * Standalone print for batch recurring schedule
   */
  printFormattedBatchPass(bookings: Booking[]): void {
    if (!bookings || bookings.length === 0) return;
    const first = bookings[0];

    const rows = bookings
      .map(
        (b, i) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${i + 1}</td>
        <td style="font-family: monospace; font-weight: bold; color: #0284c7;">${b.id}</td>
        <td><strong>${b.date}</strong> (${getDayName(b.date, true)})</td>
        <td style="color: #059669; font-weight: bold;">${formatDisplayTime(b.startTime)} - ${formatDisplayTime(b.endTime)}</td>
        <td>${b.stage}</td>
      </tr>
    `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tamimi Recurring Schedule - ${first.customerName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #f8fafc; padding: 24px; color: #0f172a; }
    .sheet { background: #fff; max-width: 700px; margin: 0 auto; border: 2px solid #059669; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
    .badge { display: inline-block; background: #059669; color: white; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; }
    .title { font-size: 22px; font-weight: 900; margin-top: 8px; }
    .info-bar { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: 800; }
    td { border: 1px solid #e2e8f0; padding: 8px; }
    .footer { text-align: center; border-top: 2px dashed #cbd5e1; padding-top: 14px; font-size: 11px; color: #64748b; }
    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border-color: #000; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <span class="badge">TAMIMI HELPDESK · RECURRING SEASON PASS</span>
      <h1 class="title">${first.facilityName} (${first.stage})</h1>
      <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Schedule Manifest for <strong>${first.customerName}</strong></p>
    </div>

    <div class="info-bar">
      <div>
        <div>Phone: <strong>${first.phoneNumber}</strong></div>
        ${first.departmentOrTeam ? `<div>Team: <strong>${first.departmentOrTeam}</strong></div>` : ''}
      </div>
      <div style="text-align: right;">
        <div>Total Sessions: <strong style="color: #059669;">${bookings.length} Slots</strong></div>
        <div>Session Time: <strong>${formatDisplayTime(first.startTime)} – ${formatDisplayTime(first.endTime)}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Booking ID</th>
          <th>Session Date</th>
          <th>Time Slot</th>
          <th>Stage</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      <div>TAMIMI GLOBAL COMPANY · TAFGA SPORTS &amp; RECREATION HELPDESK</div>
      <div style="color: #64748b; font-weight: 600; margin-top: 4px;">Official System Receipt</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    try {
      const printWindow = window.open('', '_blank', 'width=750,height=800');
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
  },

  /**
   * Alias for printFormattedBatchPass to support batch recurring schedule vouchers
   */
  printBatchReceipt(bookings: Booking[]): void {
    this.printFormattedBatchPass(bookings);
  },

  /**
   * Generates and prints an 80mm / 58mm POS thermal receipt for point-of-sale thermal printers
   */
  printThermalReceipt80mm(booking: Booking): void {
    const dateFormatted = formatDisplayDate(booking.date);
    const day = getDayName(booking.date);
    const timeFormatted = `${formatDisplayTime(booking.startTime)} - ${formatDisplayTime(booking.endTime)}`;
    const barcodeNumber = booking.id.replace(/[^0-9]/g, '').slice(-8) || Date.now().toString().slice(-8);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt-${booking.id}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      width: 76mm;
      margin: 0 auto;
      padding: 6mm 2mm;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.35;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .title { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 2px; }
    .subtitle { font-size: 10px; font-weight: bold; margin-bottom: 6px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px solid #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .label { color: #222; }
    .value { font-weight: bold; text-align: right; }
    .token-box {
      border: 2px solid #000;
      padding: 6px;
      margin: 8px 0;
      text-align: center;
    }
    .token-title { font-size: 9px; font-weight: bold; text-transform: uppercase; }
    .token-num { font-size: 18px; font-weight: 900; margin: 2px 0; }
    .barcode {
      font-family: 'Libre Barcode 39', 'Courier New', monospace;
      font-size: 24px;
      letter-spacing: 3px;
      margin-top: 6px;
      text-align: center;
    }
    .footer { font-size: 9px; margin-top: 8px; text-align: center; }
    @media print {
      body { width: 76mm; padding: 2mm; }
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title">TAMIMI GLOBAL</div>
    <div class="subtitle">TAFGA COMMUNITY SERVICES</div>
    <div style="font-size: 9.5px;">Facility Booking Receipt</div>
  </div>

  <div class="double-divider"></div>

  <div class="row">
    <span class="label">Date:</span>
    <span class="value">${new Date().toLocaleDateString('en-GB')}</span>
  </div>
  <div class="row">
    <span class="label">Time:</span>
    <span class="value">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  </div>
  <div class="row">
    <span class="label">Receipt ID:</span>
    <span class="value">${booking.id}</span>
  </div>

  <div class="divider"></div>

  <div class="token-box">
    <div class="token-title">Access Slot / Resource</div>
    <div class="token-num">${booking.facilityName}</div>
    <div style="font-size: 11px; font-weight: bold;">${booking.stage}</div>
  </div>

  <div class="row">
    <span class="label">Guest Name:</span>
    <span class="value">${booking.customerName}</span>
  </div>
  <div class="row">
    <span class="label">Phone:</span>
    <span class="value">${booking.phoneNumber}</span>
  </div>
  <div class="row">
    <span class="label">Slot Date:</span>
    <span class="value">${dateFormatted} (${day.slice(0, 3)})</span>
  </div>
  <div class="row">
    <span class="label">Slot Time:</span>
    <span class="value">${timeFormatted}</span>
  </div>
  <div class="row">
    <span class="label">Duration:</span>
    <span class="value">${booking.durationMinutes} Mins</span>
  </div>
  <div class="row">
    <span class="label">Guests:</span>
    <span class="value">${booking.numberOfGuests || 1} Pax</span>
  </div>
  ${booking.departmentOrTeam ? `
  <div class="row">
    <span class="label">Dept/Team:</span>
    <span class="value">${booking.departmentOrTeam}</span>
  </div>` : ''}
  ${booking.bookedByStaff ? `
  <div class="row">
    <span class="label">Staff:</span>
    <span class="value">${booking.bookedByStaff}</span>
  </div>` : ''}

  <div class="divider"></div>

  <div class="text-center barcode">*${barcodeNumber}*</div>
  <div class="text-center" style="font-size: 8.5px; font-family: monospace;">Ref: ${booking.id}</div>

  <div class="footer">
    <div>Please show this receipt at the entrance.</div>
    <div>Thank you for choosing Tamimi Camp.</div>
    <div style="margin-top: 4px; font-size: 8px;">Design by LIMON RAHMAN</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    try {
      const printWindow = window.open('', '_blank', 'width=420,height=600');
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
  },

  /**
   * Generates and prints an executive A4 size Room & Isolation Admission / Booking Form
   * Complete with company logo, room parameters, patient/guest demographics, medical flags,
   * camp guidelines, and dual Check-In and Check-Out signature blocks.
   */
  printRoomAdmissionForm(data: RoomAdmissionFormData): void {
    printRoomAdmissionFormUtil(data);
  },

  /**
   * Downloads the admission form as an editable Microsoft Word (.doc) document
   */
  downloadRoomAdmissionFormDoc(data: RoomAdmissionFormData): void {
    downloadRoomAdmissionFormDocUtil(data);
  },

  /**
   * Downloads the admission form as an editable HTML document
   */
  downloadRoomAdmissionFormHtml(data: RoomAdmissionFormData): void {
    downloadRoomAdmissionFormHtmlUtil(data);
  },
};

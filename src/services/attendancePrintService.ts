import { TAMIMI_LOGO_DATA_URL } from '../data/tamimiLogoBase64';
import { REDSEA_LOGO_DATA_URL } from '../data/redseaLogoBase64';
import {
  AttendanceMonthDay,
  AttendanceSheetConfig,
  DEFAULT_THEME,
} from '../components/blank-forms/attendance/attendanceTypes';

export interface DailyAttendanceRecord {
  timeIn?: string;
  timeOut?: string;
  sign?: string;
  otHours?: string;
  remarks?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'OFF' | 'DUTY';
}

export const AttendancePrintService = {
  /**
   * Generates the inner HTML for all pages
   */
  generatePagesHtml(
    days: AttendanceMonthDay[],
    config: AttendanceSheetConfig,
    recordsByDate?: Record<string, Record<string, DailyAttendanceRecord>>
  ): string {
    const staff = config.staffList || [];
    const vacation = config.vacationList || [];
    const extraRows = Math.max(0, config.extraBlankRows ?? 0);
    const blankRowsNeeded = extraRows;

    // Theme colors
    const theme = config.theme || DEFAULT_THEME;
    const headerBg = theme.headerBg || '#707070';
    const headerTextColor = theme.headerTextColor || '#ffffff';
    const borderColor = theme.borderColor || '#000000';
    const titleColor = theme.titleColor || '#000000';
    const subHeaderBg = theme.subHeaderBg || headerBg;

    // Row height expanded to 33px so the table comfortably fills down into the lower empty space
    const totalStaffTableRows = staff.length + blankRowsNeeded;
    const rowHeightPx = Math.min(36, Math.max(26, Math.floor(330 / Math.max(1, totalStaffTableRows))));
    const cellPadding = totalStaffTableRows <= 10 ? '5px 3px' : '3px 2px';

    return days
      .map((day, pageIndex) => {
        const dayRecords = (recordsByDate && recordsByDate[day.isoDate]) || {};

        // Generate staff rows with comfortable height
        const staffRowsHtml = staff
          .map((member, idx) => {
            const rec = dayRecords[member.idNo] || {};
            const timeInVal = rec.timeIn || '';
            const timeOutVal = rec.timeOut || '';
            const signVal = rec.sign || '';
            const otVal = rec.otHours || '';
            const remarksVal = rec.remarks || '';

            return `
              <tr style="height: ${rowHeightPx}px;">
                <td style="text-align: center; font-weight: bold; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${member.sNo || idx + 1}</td>
                <td style="font-weight: bold; text-transform: uppercase; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${member.name}</td>
                <td style="text-align: center; font-family: monospace; font-weight: 600; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${member.idNo}</td>
                <td style="font-weight: 600; text-transform: uppercase; padding: ${cellPadding}; font-size: 10px; border: 1px solid ${borderColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${member.jobTitle}</td>
                <td style="text-align: center; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${timeInVal}</td>
                <td style="text-align: center; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${signVal}</td>
                <td style="text-align: center; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${timeOutVal}</td>
                <td style="text-align: center; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${signVal}</td>
                <td style="text-align: center; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${otVal}</td>
                <td style="padding: ${cellPadding}; font-size: 10px; border: 1px solid ${borderColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${remarksVal}</td>
              </tr>
            `;
          })
          .join('');

        // Generate extra blank rows only if configured
        let blankRowsHtml = '';
        for (let b = 0; b < blankRowsNeeded; b++) {
          const sNo = staff.length + b + 1;
          blankRowsHtml += `
            <tr style="height: ${rowHeightPx}px;">
              <td style="text-align: center; font-weight: bold; padding: ${cellPadding}; font-size: 10.5px; border: 1px solid ${borderColor};">${sNo}</td>
              <td style="padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="text-align: center; padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="text-align: center; padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="text-align: center; padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="text-align: center; padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="text-align: center; padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="text-align: center; padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
              <td style="padding: ${cellPadding}; border: 1px solid ${borderColor};">&nbsp;</td>
            </tr>
          `;
        }

        // Generate vacation rows (exact matching original structure)
        const vacationRowsHtml =
          vacation.length > 0
            ? vacation
                .map(
                  (vac) => `
                <tr style="height: 27px;">
                  <td style="font-weight: bold; text-transform: uppercase; padding: 4px 6px; font-size: 10px; border: 1px solid ${borderColor};">${vac.name}</td>
                  <td style="text-align: center; font-family: monospace; font-weight: 600; padding: 4px 4px; font-size: 10px; border: 1px solid ${borderColor};">${vac.idNo}</td>
                  <td style="font-weight: 600; text-transform: uppercase; padding: 4px 6px; font-size: 9.5px; border: 1px solid ${borderColor};">${vac.jobTitle}</td>
                </tr>
              `
                )
                .join('')
            : `
              <tr style="height: 27px;">
                <td style="padding: 4px 6px; color: #64748b; font-style: italic; border: 1px solid ${borderColor};">None</td>
                <td style="text-align: center; padding: 4px 4px; color: #64748b; border: 1px solid ${borderColor};">-</td>
                <td style="padding: 4px 6px; color: #64748b; border: 1px solid ${borderColor};">-</td>
              </tr>
            `;

        const isLastPage = pageIndex === days.length - 1;

        return `
          <div class="attendance-day-page ${isLastPage ? 'last-page' : ''}">
            <div class="page-frame" style="border: 2px solid ${borderColor};">
              <!-- Top Content Wrapper (Shifted down inside outer border by 26px padding-top) -->
              <div>
                <!-- Header Section: 3-Column Lockup (Tamimi | Titles | Enlarged Red Sea Global) -->
                <div class="header-container" style="border: 1px solid ${borderColor};">
                  <div class="header-grid">
                    <div class="header-logo-left" style="width: 160px; display: flex; justify-content: flex-start; align-items: center;">
                      <img src="${TAMIMI_LOGO_DATA_URL}" alt="Tamimi Global Logo" style="height: 54px; width: auto; object-fit: contain; max-width: 160px;" />
                    </div>
                    <div class="header-titles">
                      <div class="title-company" style="color: ${titleColor};">${config.companyName || 'TAMIMI GLOBAL COMPANY LTD.(TAFGA)'}</div>
                      <div class="title-location" style="color: ${titleColor};">${config.locationName || 'AMAALA-Triple Bay Construction Village (Location #188)'}</div>
                      <div class="title-sheet" style="color: ${titleColor};">${config.formTitle || 'STRAIGHT DAILY ATTENDANCE SHEET'}</div>
                    </div>
                    <div class="header-logo-right" style="width: 220px; display: flex; justify-content: flex-end; align-items: center;">
                      <img src="${REDSEA_LOGO_DATA_URL}" alt="Red Sea Global" style="height: 60px; width: auto; object-fit: contain; max-width: 220px; display: block;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';" />
                      <svg width="220" height="60" viewBox="0 0 250 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none; height: 60px; width: auto; max-width: 220px;">
                        <defs>
                          <linearGradient id="rsgGoldP_${pageIndex}" x1="20%" y1="10%" x2="80%" y2="90%">
                            <stop offset="0%" stop-color="#D8B56B" />
                            <stop offset="35%" stop-color="#E9CA86" />
                            <stop offset="70%" stop-color="#C89F50" />
                            <stop offset="100%" stop-color="#A87F32" />
                          </linearGradient>
                        </defs>
                        <g transform="translate(6, 4) scale(0.36)" stroke="url(#rsgGoldP_${pageIndex})" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M 65 24 C 75 14, 90 12, 105 13 C 120 14, 138 20, 150 32" stroke-width="6.5" />
                          <path d="M 48 38 C 60 26, 80 22, 98 25 C 114 28, 132 38, 142 50" stroke-width="6" />
                          <path d="M 32 58 C 45 42, 68 38, 86 46 C 98 52, 106 66, 115 78 C 124 90, 134 98, 148 94 C 158 90, 166 78, 168 64" stroke-width="6.5" />
                          <path d="M 24 82 C 34 68, 52 64, 68 70 C 80 75, 88 88, 96 102 C 104 116, 116 128, 132 126 C 146 124, 158 110, 164 94" stroke-width="7" />
                          <path d="M 22 108 C 30 96, 46 94, 58 102 C 70 110, 78 126, 88 140 C 98 154, 112 162, 128 156 C 142 150, 152 134, 156 118" stroke-width="7.5" />
                          <path d="M 30 134 C 40 126, 54 130, 62 142 C 70 154, 80 168, 96 172 C 110 176, 124 168, 132 154" stroke-width="6.5" />
                          <path d="M 48 158 C 60 152, 72 160, 82 172 C 92 182, 108 186, 120 180" stroke-width="6" />
                          <path d="M 72 178 C 84 186, 102 188, 116 182" stroke-width="5.5" />
                          <path d="M 160 48 C 172 62, 178 80, 176 100 C 174 120, 164 140, 150 156" stroke-width="6" />
                          <path d="M 144 32 C 158 44, 168 62, 170 82" stroke-width="5.5" />
                        </g>
                        <text x="88" y="32" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#0c2340" letter-spacing="1">Red Sea</text>
                        <text x="89" y="56" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#a87f32" letter-spacing="4">GLOBAL</text>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Subheader Bar: Department on left, Date on right -->
                <div class="subheader-bar" style="background-color: ${subHeaderBg} !important; color: ${headerTextColor} !important; border: 1px solid ${borderColor};">
                  <div class="dept-text">
                    <span>DEPARTMENT:</span>
                    <span class="dept-name">${config.department || 'HELPDESK/ACCOMODATION'}</span>
                  </div>
                  <div class="date-container">
                    <span class="date-label">DATE:</span>
                    <span class="date-badge" style="border: 1px solid ${borderColor};">${day.formattedDate}</span>
                  </div>
                </div>

                <!-- Main Attendance Table -->
                <table class="attendance-table" style="border: 1px solid ${borderColor};">
                  <thead>
                    <tr class="th-dark" style="background-color: ${headerBg} !important; color: ${headerTextColor} !important;">
                      <th rowspan="2" style="width: 4%; padding: 4px 2px; border: 1px solid ${borderColor};">S. No.</th>
                      <th rowspan="2" style="width: 22%; padding: 4px 6px; border: 1px solid ${borderColor};">Name</th>
                      <th rowspan="2" style="width: 7.5%; padding: 4px 2px; border: 1px solid ${borderColor};">ID No.</th>
                      <th rowspan="2" style="width: 17%; padding: 4px 6px; border: 1px solid ${borderColor};">Job Title</th>
                      <th colspan="4" style="padding: 3px 0; border: 1px solid ${borderColor};">Timing</th>
                      <th rowspan="2" style="width: 5.5%; padding: 4px 2px; border: 1px solid ${borderColor};">O.T.<br/>HOURS</th>
                      <th rowspan="2" style="width: 9%; padding: 4px 4px; border: 1px solid ${borderColor};">REMARKS</th>
                    </tr>
                    <tr class="th-dark" style="background-color: ${headerBg} !important; color: ${headerTextColor} !important;">
                      <th style="width: 6.5%; font-weight: normal; font-size: 10px; padding: 3px 1px; border: 1px solid ${borderColor};">Time-in</th>
                      <th style="width: 11%; font-weight: bold; font-size: 10px; padding: 3px 1px; border: 1px solid ${borderColor};">Sign</th>
                      <th style="width: 6.5%; font-weight: normal; font-size: 10px; padding: 3px 1px; border: 1px solid ${borderColor};">Time- Out</th>
                      <th style="width: 11%; font-weight: bold; font-size: 10px; padding: 3px 1px; border: 1px solid ${borderColor};">Sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${staffRowsHtml}
                    ${blankRowsHtml}
                  </tbody>
                </table>

                <!-- Employee on Vacation Table -->
                <div class="vacation-container">
                  <table class="vacation-table" style="border: 1px solid ${borderColor};">
                    <thead>
                      <tr class="th-dark" style="background-color: ${headerBg} !important; color: ${headerTextColor} !important;">
                        <th colspan="3" style="text-align: center; text-transform: uppercase; font-size: 10.5px; padding: 3px; border: 1px solid ${borderColor};">EMPLOYEE ON VACATION</th>
                      </tr>
                      <tr class="th-dark" style="background-color: ${headerBg} !important; color: ${headerTextColor} !important;">
                        <th style="width: 220px; padding: 3px 6px; border: 1px solid ${borderColor};">NAME</th>
                        <th style="width: 85px; padding: 3px 4px; border: 1px solid ${borderColor};">ID</th>
                        <th style="width: 190px; padding: 3px 6px; border: 1px solid ${borderColor};">JOB</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${vacationRowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Bottom Dual Signatures Section (Cleanly anchored at the bottom inside the frame) -->
              <div class="signature-section" style="color: ${titleColor};">
                <div class="sig-col">
                  <span class="sig-title">${config.supervisorTitle || 'SUPERVISOR'} :</span>
                  <span class="sig-line" style="border-bottom: 1.5px solid ${borderColor};"></span>
                </div>
                <div class="sig-col">
                  <span class="sig-title">${config.hodTitle || 'H.O.D'} :</span>
                  <span class="sig-line" style="border-bottom: 1.5px solid ${borderColor};"></span>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('\n');
  },

  /**
   * Returns complete CSS for printing in A4 Landscape with outer border intact and inner content moved down
   */
  getPrintCss(): string {
    return `
      @media screen {
        #attendance-print-portal {
          display: none !important;
        }
      }
      @page {
        size: A4 landscape;
        margin: 8mm 6mm 6mm 6mm;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
        }
        body > *:not(#attendance-print-portal) {
          display: none !important;
        }
        #attendance-print-portal {
          display: block !important;
          position: static !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
      }
      body {
        font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
        color: #000000;
        background: #ffffff;
        padding: 0;
        margin: 0;
      }
      .attendance-day-page {
        width: 100%;
        height: 194mm;
        max-height: 194mm;
        box-sizing: border-box;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden;
        background: #ffffff;
      }
      .attendance-day-page.last-page,
      .attendance-day-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .page-frame {
        border: 2px solid #000000;
        /* 26px padding-top shifts all inner content down from the top into the red-marked empty space */
        padding: 26px 8px 8px 8px;
        background: #ffffff;
        height: 193mm;
        max-height: 193mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .header-container {
        border: 1px solid #000000;
        margin-bottom: 4px;
        padding: 3px 8px;
      }
      .header-grid {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .header-logo-left {
        width: 160px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }
      .header-titles {
        flex: 1;
        text-align: center;
        padding: 0 10px;
      }
      .title-company {
        font-size: 13.5px;
        font-weight: 900;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        line-height: 1.2;
      }
      .title-location {
        font-size: 11.5px;
        font-weight: bold;
        line-height: 1.2;
        margin-top: 2px;
      }
      .title-sheet {
        font-size: 12.5px;
        font-weight: 900;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-top: 2px;
        line-height: 1.2;
      }
      .header-logo-right {
        width: 220px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      .subheader-bar {
        background-color: #707070 !important;
        color: #ffffff !important;
        border: 1px solid #000000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 4px;
      }
      .dept-text {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .dept-name {
        text-decoration: underline;
        font-weight: 900;
      }
      .date-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .date-badge {
        background: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #000000;
        padding: 2px 10px;
        font-weight: 900;
        font-size: 11px;
        display: inline-block;
      }
      table.attendance-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #000000;
        font-size: 10.5px;
        table-layout: fixed;
      }
      table.attendance-table th, table.attendance-table td {
        border: 1px solid #000000;
      }
      .th-dark {
        background-color: #707070 !important;
        color: #ffffff !important;
        font-weight: bold;
        text-align: center;
      }
      .vacation-container {
        margin-top: 8px;
        max-width: 580px;
      }
      table.vacation-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #000000;
        font-size: 10.5px;
      }
      table.vacation-table th, table.vacation-table td {
        border: 1px solid #000000;
      }
      .signature-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding: 12px 18px 6px 18px;
        font-size: 11.5px;
        font-weight: bold;
      }
      .sig-col {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sig-title {
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .sig-line {
        display: inline-block;
        width: 290px;
        border-bottom: 1.5px solid #000000;
      }
    `;
  },

  /**
   * Generates a pristine, self-contained HTML document for standalone use or download
   */
  generateHtml(
    days: AttendanceMonthDay[],
    config: AttendanceSheetConfig,
    recordsByDate?: Record<string, Record<string, DailyAttendanceRecord>>
  ): string {
    const pagesHtml = this.generatePagesHtml(days, config, recordsByDate);
    const printCss = this.getPrintCss();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Straight Daily Attendance Sheets - ${config.department || 'Helpdesk'} - ${days.length} Days</title>
  <style>
    ${printCss}
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
  },

  /**
   * Direct print executor using an in-DOM portal, hidden iframe, and native window.print()
   */
  printSheets(
    days: AttendanceMonthDay[],
    config: AttendanceSheetConfig,
    recordsByDate?: Record<string, Record<string, DailyAttendanceRecord>>
  ): boolean {
    try {
      const pagesHtml = this.generatePagesHtml(days, config, recordsByDate);
      const printCss = this.getPrintCss();

      let styleEl = document.getElementById(
        'attendance-print-style'
      ) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'attendance-print-style';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = printCss;

      let portal = document.getElementById('attendance-print-portal');
      if (!portal) {
        portal = document.createElement('div');
        portal.id = 'attendance-print-portal';
        document.body.appendChild(portal);
      }
      portal.innerHTML = pagesHtml;

      document.body.classList.add('printing-attendance-mode');

      const cleanup = () => {
        document.body.classList.remove('printing-attendance-mode');
        if (portal) {
          portal.innerHTML = '';
        }
      };

      window.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 20000);

      const isInsideIframe = window.self !== window.top;

      if (isInsideIframe) {
        this.openInNewTab(days, config, recordsByDate);
      } else {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Direct print fallback to new tab:', e);
          this.openInNewTab(days, config, recordsByDate);
        }
      }

      return true;
    } catch (err) {
      console.error('Attendance direct print error:', err);
      try {
        this.openInNewTab(days, config, recordsByDate);
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  /**
   * Opens the printable sheets in a clean, standalone browser tab via Blob URL and automatically invokes Chrome's print dialog
   */
  openInNewTab(
    days: AttendanceMonthDay[],
    config: AttendanceSheetConfig,
    recordsByDate?: Record<string, Record<string, DailyAttendanceRecord>>
  ): void {
    const pagesHtml = this.generatePagesHtml(days, config, recordsByDate);
    const printCss = this.getPrintCss();
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Straight Daily Attendance Sheets - ${config.department || 'Helpdesk'} - ${days.length} Days</title>
  <style>
    ${printCss}
    @media screen {
      .print-helper-bar {
        position: sticky;
        top: 0;
        z-index: 99999;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      }
      .print-helper-bar .title {
        font-size: 14px;
        font-weight: bold;
      }
      .print-helper-bar .sub {
        font-size: 11px;
        color: #94a3b8;
      }
      .print-action-btn {
        background: #059669;
        color: #ffffff;
        border: none;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 13px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .print-action-btn:hover {
        background: #10b981;
      }
    }
    @media print {
      .print-helper-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body class="printing-attendance-mode">
  <div class="print-helper-bar">
    <div>
      <div class="title">TAMIMI GLOBAL COMPANY LTD. — Attendance Sheet Print</div>
      <div class="sub">${days.length} Selected Day${days.length > 1 ? 's' : ''} • A4 Landscape • Border Preserved • Content Shifted Down</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="print-action-btn" onclick="window.focus(); window.print();">
        🖨️ Click to Print Now (Ctrl+P)
      </button>
    </div>
  </div>
  <div id="attendance-print-portal" style="display:block !important;">
    ${pagesHtml}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Auto print error:', e);
        }
      }, 300);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          link.remove();
        } catch (_) {}
      }, 2000);
    } catch (e) {
      console.warn('Link click failed, fallback to window.open:', e);
      window.open(blobUrl, '_blank');
    }
  },

  /**
   * Downloads a standalone offline HTML file ready to double-click and print in any browser
   */
  downloadHtmlFile(
    days: AttendanceMonthDay[],
    config: AttendanceSheetConfig,
    recordsByDate?: Record<string, Record<string, DailyAttendanceRecord>>
  ): void {
    const html = this.generateHtml(days, config, recordsByDate);
    const firstDay = days[0];
    const monthYearStr = firstDay
      ? `${firstDay.dateObj.toLocaleString('en-US', { month: 'short' })}-${firstDay.dateObj.getFullYear()}`
      : 'Monthly';
    const filename = `TAFGA-Daily-Attendance-Sheet-${(config.department || 'Helpdesk').replace(/[^A-Za-z0-9]/g, '_')}-${monthYearStr}.html`;

    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (link.parentNode) link.parentNode.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (_) {}
      }, 2000);
    } catch (e) {
      console.warn('Blob download error:', e);
    }
  },

  /**
   * Exports the entire month's roster as a CSV spreadsheet
   */
  downloadCsvRoster(
    days: AttendanceMonthDay[],
    config: AttendanceSheetConfig
  ): void {
    const headers = [
      'Day No.',
      'Date',
      'Day of Week',
      'Department',
      'Location',
      'Staff S.No',
      'Staff Name',
      'Staff ID',
      'Job Title',
      'Status',
    ];

    const rows: string[][] = [];

    days.forEach((day) => {
      config.staffList.forEach((st) => {
        rows.push([
          String(day.dayNum),
          day.isoDate,
          day.dayOfWeek,
          config.department,
          config.locationName,
          String(st.sNo),
          `"${st.name.replace(/"/g, '""')}"`,
          st.idNo,
          `"${st.jobTitle.replace(/"/g, '""')}"`,
          'SCHEDULED',
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\r\n'
    );
    const firstDay = days[0];
    const monthYearStr = firstDay
      ? `${firstDay.dateObj.toLocaleString('en-US', { month: 'short' })}-${firstDay.dateObj.getFullYear()}`
      : 'Monthly';
    const filename = `TAFGA-Attendance-Roster-${monthYearStr}.csv`;

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (link.parentNode) link.parentNode.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (_) {}
      }, 2000);
    } catch (e) {
      console.warn('Blob CSV download error:', e);
    }
  },
};

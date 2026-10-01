/**
 * Official Tamimi Global A4 Printable Notice Poster Generator & Print Service
 * Provides reliable, high-resolution printing across all browsers, iframes, and devices.
 */

import { CampNoticeRecord } from '../data/noticeTemplates';
import { TAMIMI_LOGO_DATA_URL } from '../components/TamimiLogo';

export const printCampNoticePoster = (notice: CampNoticeRecord): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const priorityColors = {
        red: {
          bg: '#be123c',
          badge: '#ffe4e6',
          text: '#9f1239',
          border: '#f43f5e',
          label: 'CRITICAL / IMMEDIATE ACTION',
        },
        amber: {
          bg: '#d97706',
          badge: '#fef3c7',
          text: '#92400e',
          border: '#f59e0b',
          label: 'HIGH PRIORITY / URGENT ADVISORY',
        },
        emerald: {
          bg: '#047857',
          badge: '#d1fae5',
          text: '#065f46',
          border: '#10b981',
          label: 'OPERATIONAL / ROUTINE NOTICE',
        },
        purple: {
          bg: '#6d28d9',
          badge: '#ede9fe',
          text: '#5b21b6',
          border: '#8b5cf6',
          label: 'SPECIAL ANNOUNCEMENT',
        },
        blue: {
          bg: '#1d4ed8',
          badge: '#dbeafe',
          text: '#1e40af',
          border: '#3b82f6',
          label: 'GENERAL NOTICE',
        },
      };

      const theme = priorityColors[notice.themeColor as keyof typeof priorityColors] || priorityColors.blue;

      const keyPointsHtml =
        notice.keyPoints && notice.keyPoints.length > 0
          ? `
          <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; background-color:${theme.bg}; border-radius:50%;"></span>
              MANDATORY DIRECTIVES & ACTION REQUIRED:
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b; line-height: 1.6;">
              ${notice.keyPoints
                .map(
                  (pt) =>
                    `<li style="margin-bottom: 6px; font-weight: 500;">${pt}</li>`
                )
                .join('')}
            </ul>
          </div>
        `
          : '';

      const penaltyClauseHtml = notice.penaltyClause
        ? `
        <div style="background-color: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 12px; padding: 14px 18px; margin: 16px 0; font-size: 12px; color: #9f1239; line-height: 1.5;">
          <strong style="font-weight: 800; text-transform: uppercase;">COMPLIANCE & PENALTY CLAUSE: </strong>
          ${notice.penaltyClause}
        </div>
      `
        : '';

      const printableHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>NOTICE - ${notice.noticeRef} - ${notice.title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              line-height: 1.5;
            }
            .notice-poster {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff;
              padding: 24px;
              border: 3px solid #0f172a;
              border-radius: 16px;
              position: relative;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 4px solid #b45309;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .header-table td {
              vertical-align: middle;
            }
            .banner {
              background-color: ${theme.bg} !important;
              color: #ffffff !important;
              padding: 12px 18px;
              border-radius: 10px;
              margin-bottom: 18px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .banner-left {
              font-weight: 900;
              font-size: 14px;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            .banner-right {
              background: rgba(0, 0, 0, 0.25);
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              text-align: right;
            }
            .title-box {
              text-align: center;
              border-bottom: 2px solid #e2e8f0;
              padding: 10px 0 16px 0;
              margin-bottom: 16px;
            }
            .title-box h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: -0.02em;
              line-height: 1.25;
            }
            .meta-strip {
              display: table;
              width: 100%;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              margin-bottom: 16px;
              font-size: 11px;
              padding: 8px 12px;
            }
            .meta-col {
              display: table-cell;
              width: 33.33%;
              vertical-align: top;
            }
            .content-body {
              font-size: 13.5px;
              color: #1e293b;
              line-height: 1.65;
              text-align: justify;
              white-space: pre-line;
              margin: 16px 0;
            }
            .footer-grid {
              width: 100%;
              border-collapse: collapse;
              border-top: 2px solid #94a3b8;
              margin-top: 24px;
              padding-top: 14px;
            }
            .footer-grid td {
              vertical-align: top;
              font-size: 11px;
            }
            .official-stamp {
              width: 86px;
              height: 86px;
              border: 2.5px dashed #b45309;
              border-radius: 50%;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 9px;
              font-weight: 900;
              color: #b45309;
              text-transform: uppercase;
              transform: rotate(-6deg);
              line-height: 1.15;
            }
          </style>
        </head>
        <body>
          <div class="notice-poster">
            <!-- Header Table -->
            <table class="header-table">
              <tr>
                <td style="width: 75px;">
                  <img src="${TAMIMI_LOGO_DATA_URL}" alt="Tamimi Logo" style="height: 52px; width: auto; display: block;" />
                </td>
                <td style="padding-left: 12px;">
                  <div style="font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.01em;">TAMIMI GLOBAL COMPANY</div>
                  <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">TAFGA Camp Operations &amp; Facility Management</div>
                  <div style="font-size: 9px; color: #64748b; font-family: monospace;">ISO 9001:2015 • ISO 45001:2018 Certified Operations</div>
                </td>
                <td style="text-align: right; font-family: monospace; font-size: 11px;">
                  <div style="display: inline-block; background: #fef3c7; color: #92400e; font-weight: 900; padding: 3px 8px; border-radius: 4px; border: 1px solid #fde68a;">OFFICIAL NOTICE</div>
                  <div style="color: #475569; font-weight: bold; margin-top: 4px;">REF: <strong style="color: #0f172a;">${notice.noticeRef}</strong></div>
                  <div style="color: #64748b; font-size: 10px;">Date: ${notice.effectiveDate}</div>
                </td>
              </tr>
            </table>

            <!-- Priority & Facility Banner -->
            <div class="banner">
              <div class="banner-left">
                <div style="font-size: 10px; opacity: 0.85;">ATTENTION ALL RESIDENTS &amp; OCCUPANTS</div>
                <div>PRIORITY: ${notice.priority} • ${notice.category.replace(/_/g, ' ')}</div>
              </div>
              <div class="banner-right">
                <div style="font-size: 9px; opacity: 0.85;">TARGET LOCATION:</div>
                <div style="font-size: 12px;">${notice.facility}</div>
              </div>
            </div>

            <!-- Meta Strip -->
            <div class="meta-strip">
              <div class="meta-col">
                <span style="color: #64748b; font-weight: bold;">Valid From:</span>
                <strong style="color: #0f172a;">${notice.effectiveDate}</strong>
              </div>
              <div class="meta-col" style="text-align: center;">
                <span style="color: #64748b; font-weight: bold;">Expires / Post Until:</span>
                <strong style="color: #0f172a;">${notice.expiryDate}</strong>
              </div>
              <div class="meta-col" style="text-align: right;">
                <span style="color: #64748b; font-weight: bold;">Emergency Contact:</span>
                <strong style="color: #0f172a;">${notice.emergencyContact || 'Ext. 4411'}</strong>
              </div>
            </div>

            <!-- Title Box -->
            <div class="title-box">
              <h1>${notice.title}</h1>
            </div>

            <!-- Content Body -->
            <div class="content-body">
              ${notice.content}
            </div>

            <!-- Key Action Items -->
            ${keyPointsHtml}

            <!-- Compliance Clause -->
            ${penaltyClauseHtml}

            <!-- Footer Authorization & Signatures -->
            <table class="footer-grid">
              <tr>
                <td style="width: 35%;">
                  <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Issuing Authority</div>
                  <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-top: 2px;">${notice.author}</div>
                  <div style="color: #64748b; font-family: monospace; font-size: 10px;">Tamimi Camp Management Desk</div>
                  <div style="color: #64748b; font-family: monospace; font-size: 10px;">Contact: ${notice.emergencyContact || 'Central Ops Ext. 4411'}</div>
                </td>
                <td style="width: 30%; text-align: center;">
                  <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Authorized Seal</div>
                  <div class="official-stamp">
                    TAMIMI GLOBAL<br>CAMP OPERATIONS<br>AUTHORIZED<br>OFFICIAL
                  </div>
                </td>
                <td style="width: 35%; text-align: right; font-family: monospace;">
                  <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Verification Reference</div>
                  <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-top: 2px;">${notice.noticeRef}</div>
                  <div style="font-size: 10px; color: #64748b;">Status: ACTIVE OFFICIAL</div>
                  <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Generated via TAFGA Enterprise Portal</div>
                </td>
              </tr>
            </table>
          </div>
          <script>
            function doPrint() {
              window.focus();
              window.print();
            }
            if (document.readyState === 'complete') {
              setTimeout(doPrint, 300);
            } else {
              window.addEventListener('load', function() {
                setTimeout(doPrint, 300);
              });
            }
          </script>
        </body>
        </html>
      `;

      fallbackPopupPrint(printableHtml, resolve);
    } catch (err) {
      console.error('Print poster error:', err);
      window.print();
      resolve(false);
    }
  });
};

function fallbackPopupPrint(html: string, resolve: (val: boolean) => void) {
  try {
    const popup = window.open('', '_blank', 'width=900,height=1000,menubar=yes,toolbar=yes');
    if (popup) {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      setTimeout(() => {
        try {
          popup.focus();
          popup.print();
        } catch {
          // ignore
        }
        resolve(true);
      }, 500);
      return;
    }
  } catch {
    // popup blocked
  }
  window.print();
  resolve(true);
}


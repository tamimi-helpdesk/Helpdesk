import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { RedSeaLogo } from '../../RedSeaLogo';
import {
  AttendanceMonthDay,
  AttendanceSheetConfig,
  DailyStaffLog,
  DEFAULT_THEME,
} from './attendanceTypes';

interface DailyAttendanceSheetPageProps {
  day: AttendanceMonthDay;
  config: AttendanceSheetConfig;
  isPrintMode?: boolean;
  dayRecords?: Record<string, DailyStaffLog>;
  isInteractive?: boolean;
  onRecordChange?: (empId: string, field: keyof DailyStaffLog, val: string) => void;
}

export const DailyAttendanceSheetPage: React.FC<DailyAttendanceSheetPageProps> = ({
  day,
  config,
  isPrintMode = false,
  dayRecords = {},
  isInteractive = false,
  onRecordChange,
}) => {
  const staff = config.staffList || [];
  const vacation = config.vacationList || [];
  // Only add extra blank rows if explicitly specified in config (defaults to 0 so 1-10 staff cleanly fill A4)
  const extraRowsCount = Math.max(0, config.extraBlankRows ?? 0);
  const blankRowsNeeded = extraRowsCount;

  // Theme colors
  const theme = config.theme || DEFAULT_THEME;
  const headerBg = theme.headerBg || '#707070';
  const headerTextColor = theme.headerTextColor || '#ffffff';
  const borderColor = theme.borderColor || '#000000';
  const titleColor = theme.titleColor || '#000000';
  const subHeaderBg = theme.subHeaderBg || headerBg;

  const totalStaffRows = staff.length + blankRowsNeeded;
  const isCompact = totalStaffRows > 12;

  return (
    <div
      className={`attendance-day-page bg-white text-slate-900 mx-auto font-sans select-text ${
        isPrintMode
          ? 'w-full print:w-full print:m-0 print:p-0'
          : 'w-full max-w-[1060px] p-4 sm:p-6 shadow-md border border-slate-300 rounded-xl mb-8'
      }`}
      style={{
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Outer Table-style Container to exactly mirror the corporate Excel sheet border */}
      <div
        className="border-2 p-1.5 sm:p-2 bg-white flex flex-col justify-between min-h-[600px]"
        style={{ borderColor: borderColor }}
      >
        <div>
          {/* Header Block: 3 columns (Tamimi Logo | Company Title & Project Location | Red Sea Global Logo) */}
          <div className="border pb-1 mb-1" style={{ borderColor: borderColor }}>
            <div className="grid grid-cols-12 items-center px-2 py-1.5 gap-2">
              {/* Left: Tamimi Global Logo */}
              <div className="col-span-3 sm:col-span-2 flex items-center justify-start pl-1">
                <TamimiLogo size={58} />
              </div>

              {/* Middle: Titles */}
              <div className="col-span-6 sm:col-span-8 text-center px-1" style={{ color: titleColor }}>
                <div className="font-black text-xs sm:text-[14px] leading-tight tracking-wide uppercase">
                  {config.companyName || 'TAMIMI GLOBAL COMPANY LTD.(TAFGA)'}
                </div>
                <div className="font-bold text-[11px] sm:text-[12px] leading-tight mt-0.5">
                  {config.locationName || 'AMAALA-Triple Bay Construction Village (Location #188)'}
                </div>
                <div className="font-extrabold text-[11px] sm:text-[13px] leading-tight tracking-wider uppercase mt-0.5">
                  {config.formTitle || 'STRAIGHT DAILY ATTENDANCE SHEET'}
                </div>
              </div>

              {/* Right: Red Sea Global Logo (Embedded high-res Base64 for 100% reliable print & rendering) */}
              <div className="col-span-3 sm:col-span-2 flex items-center justify-end pr-1">
                <RedSeaLogo className="h-10 sm:h-12 w-auto object-contain max-w-[140px]" />
              </div>
            </div>
          </div>

          {/* Subheader Banner: Department on left, Date on right */}
          <div
            className="border flex items-stretch justify-between font-bold text-xs uppercase px-2 py-1.5 mb-1"
            style={{
              backgroundColor: subHeaderBg,
              color: headerTextColor,
              borderColor: borderColor,
            }}
          >
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs tracking-wide">
              <span>DEPARTMENT:</span>
              <span className="font-black underline decoration-white/70">
                {config.department || 'HELPDESK/ACCOMODATION'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
              <span className="font-bold">DATE:</span>
              <div
                className="bg-white text-black font-extrabold px-3 py-0.5 text-[11px] sm:text-xs border rounded-xs shadow-2xs"
                style={{ borderColor: borderColor }}
              >
                {day.formattedDate}
              </div>
            </div>
          </div>

          {/* Main Attendance Grid Table: Dynamically balanced row heights for 1-10 staff members */}
          <table
            className="w-full border-collapse border text-[10.5px] sm:text-[11px] text-black table-fixed"
            style={{ borderColor: borderColor }}
          >
            <thead>
              {/* Row 1 Header */}
              <tr
                className="text-center font-bold"
                style={{
                  backgroundColor: headerBg,
                  color: headerTextColor,
                }}
              >
                <th
                  rowSpan={2}
                  className="border px-1 py-1 w-[38px] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  S. No.
                </th>
                <th
                  rowSpan={2}
                  className="border px-2 py-1 w-[195px] text-center font-black"
                  style={{ borderColor: borderColor }}
                >
                  Name
                </th>
                <th
                  rowSpan={2}
                  className="border px-1.5 py-1 w-[72px] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  ID No.
                </th>
                <th
                  rowSpan={2}
                  className="border px-2 py-1 w-[160px] text-center font-black"
                  style={{ borderColor: borderColor }}
                >
                  Job Title
                </th>
                <th
                  colSpan={4}
                  className="border px-1 py-0.5 font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  Timing
                </th>
                <th
                  rowSpan={2}
                  className="border px-1.5 py-1 w-[58px] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  O.T.
                  <br />
                  HOURS
                </th>
                <th
                  rowSpan={2}
                  className="border px-1.5 py-1 w-[80px] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  REMARKS
                </th>
              </tr>

              {/* Row 2: Sub-columns for Timing (Widened Sign Columns: 95px) */}
              <tr
                className="text-center font-bold"
                style={{
                  backgroundColor: headerBg,
                  color: headerTextColor,
                }}
              >
                <th
                  className="border px-1 py-0.5 w-[60px] font-normal text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Time-in
                </th>
                <th
                  className="border px-1 py-0.5 w-[95px] font-bold text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Sign
                </th>
                <th
                  className="border px-1 py-0.5 w-[60px] font-normal text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Time- Out
                </th>
                <th
                  className="border px-1 py-0.5 w-[95px] font-bold text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Sign
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Active Staff Members: Balanced height so 10 staff members comfortably fill the sheet */}
              {staff.map((member, idx) => {
                const rec = dayRecords[member.idNo] || {};
                const timeInVal = rec.timeIn || '';
                const timeOutVal = rec.timeOut || '';
                const signVal = rec.sign || '';
                const otVal = rec.otHours || '';
                const remarksVal = rec.remarks || '';

                return (
                  <tr
                    key={`staff-${member.sNo || idx}-${member.idNo}`}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCompact ? 'h-7 sm:h-8' : 'h-8 sm:h-9'
                    }`}
                  >
                    <td
                      className="border px-1 py-1.5 text-center font-bold text-[11px]"
                      style={{ borderColor: borderColor }}
                    >
                      {member.sNo || idx + 1}
                    </td>
                    <td
                      className="border px-2 py-1.5 font-bold uppercase text-[10.5px]"
                      style={{ borderColor: borderColor }}
                    >
                      {member.name}
                    </td>
                    <td
                      className="border px-1 py-1.5 text-center font-semibold font-mono text-[10.5px]"
                      style={{ borderColor: borderColor }}
                    >
                      {member.idNo}
                    </td>
                    <td
                      className="border px-2 py-1.5 font-bold uppercase text-[10px]"
                      style={{ borderColor: borderColor }}
                    >
                      {member.jobTitle}
                    </td>

                    {/* Timing & OT Columns */}
                    <td
                      className="border px-1 py-1 text-center bg-white"
                      style={{ borderColor: borderColor }}
                    >
                      {isInteractive && !isPrintMode ? (
                        <input
                          type="text"
                          value={timeInVal}
                          placeholder="07:00"
                          onChange={(e) =>
                            onRecordChange?.(member.idNo, 'timeIn', e.target.value)
                          }
                          className="w-full text-center text-[10px] focus:outline-none focus:bg-emerald-50"
                        />
                      ) : (
                        timeInVal || '\u00A0'
                      )}
                    </td>
                    <td
                      className="border px-1 py-1 text-center bg-white"
                      style={{ borderColor: borderColor }}
                    >
                      {signVal || '\u00A0'}
                    </td>
                    <td
                      className="border px-1 py-1 text-center bg-white"
                      style={{ borderColor: borderColor }}
                    >
                      {isInteractive && !isPrintMode ? (
                        <input
                          type="text"
                          value={timeOutVal}
                          placeholder="19:00"
                          onChange={(e) =>
                            onRecordChange?.(member.idNo, 'timeOut', e.target.value)
                          }
                          className="w-full text-center text-[10px] focus:outline-none focus:bg-emerald-50"
                        />
                      ) : (
                        timeOutVal || '\u00A0'
                      )}
                    </td>
                    <td
                      className="border px-1 py-1 text-center bg-white"
                      style={{ borderColor: borderColor }}
                    >
                      {signVal || '\u00A0'}
                    </td>
                    <td
                      className="border px-1 py-1 text-center bg-white"
                      style={{ borderColor: borderColor }}
                    >
                      {isInteractive && !isPrintMode ? (
                        <input
                          type="text"
                          value={otVal}
                          placeholder="0"
                          onChange={(e) =>
                            onRecordChange?.(member.idNo, 'otHours', e.target.value)
                          }
                          className="w-full text-center text-[10px] focus:outline-none focus:bg-emerald-50 font-semibold"
                        />
                      ) : (
                        otVal || '\u00A0'
                      )}
                    </td>
                    <td
                      className="border px-1.5 py-1 text-left bg-white"
                      style={{ borderColor: borderColor }}
                    >
                      {isInteractive && !isPrintMode ? (
                        <input
                          type="text"
                          value={remarksVal}
                          placeholder="On Duty"
                          onChange={(e) =>
                            onRecordChange?.(member.idNo, 'remarks', e.target.value)
                          }
                          className="w-full text-left text-[10px] focus:outline-none focus:bg-emerald-50"
                        />
                      ) : (
                        remarksVal || '\u00A0'
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Additional Configurable Blank Rows for Manual Handwriting (Only rendered if configured > 0) */}
              {Array.from({ length: blankRowsNeeded }).map((_, bIdx) => {
                const currentSNo = staff.length + bIdx + 1;
                return (
                  <tr
                    key={`blank-row-${bIdx}`}
                    className={isCompact ? 'h-7 sm:h-8' : 'h-8 sm:h-9'}
                  >
                    <td
                      className="border px-1 py-1.5 text-center font-bold text-[11px]"
                      style={{ borderColor: borderColor }}
                    >
                      {currentSNo}
                    </td>
                    <td className="border px-2 py-1.5" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1.5 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-2 py-1.5" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1.5 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1.5 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1.5 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1.5 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1.5 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1.5 py-1.5 text-left" style={{ borderColor: borderColor }}>&nbsp;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Secondary Table: EMPLOYEE ON VACATION */}
          <div className="mt-4 mb-3 max-w-[580px]">
            <table
              className="w-full border-collapse border text-[10.5px] sm:text-[11px] text-black"
              style={{ borderColor: borderColor }}
            >
              <thead>
                <tr
                  className="font-bold"
                  style={{
                    backgroundColor: headerBg,
                    color: headerTextColor,
                  }}
                >
                  <th
                    colSpan={3}
                    className="border px-2 py-1 text-center font-black uppercase text-[11px]"
                    style={{ borderColor: borderColor }}
                  >
                    EMPLOYEE ON VACATION
                  </th>
                </tr>
                <tr
                  className="text-center font-bold"
                  style={{
                    backgroundColor: headerBg,
                    color: headerTextColor,
                  }}
                >
                  <th
                    className="border px-2 py-0.5 text-center min-w-[200px]"
                    style={{ borderColor: borderColor }}
                  >
                    NAME
                  </th>
                  <th
                    className="border px-1.5 py-0.5 text-center w-[80px]"
                    style={{ borderColor: borderColor }}
                  >
                    ID
                  </th>
                  <th
                    className="border px-2 py-0.5 text-center min-w-[180px]"
                    style={{ borderColor: borderColor }}
                  >
                    JOB
                  </th>
                </tr>
              </thead>
              <tbody>
                {vacation.map((vac, vIdx) => (
                  <tr key={`vac-${vac.idNo || vIdx}`} className="h-7 sm:h-7.5">
                    <td
                      className="border px-2 py-1 font-bold uppercase text-[10.5px]"
                      style={{ borderColor: borderColor }}
                    >
                      {vac.name}
                    </td>
                    <td
                      className="border px-1.5 py-1 text-center font-mono font-semibold text-[10.5px]"
                      style={{ borderColor: borderColor }}
                    >
                      {vac.idNo}
                    </td>
                    <td
                      className="border px-2 py-1 font-bold uppercase text-[10px]"
                      style={{ borderColor: borderColor }}
                    >
                      {vac.jobTitle}
                    </td>
                  </tr>
                ))}
                {vacation.length === 0 && (
                  <tr>
                    <td className="border px-2 py-1 text-slate-400 italic" style={{ borderColor: borderColor }}>None</td>
                    <td className="border px-1.5 py-1 text-center text-slate-400 italic" style={{ borderColor: borderColor }}>-</td>
                    <td className="border px-2 py-1 text-slate-400 italic" style={{ borderColor: borderColor }}>-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Section: Anchored cleanly at bottom */}
        <div
          className="pt-6 pb-2 px-3 flex items-center justify-between font-bold text-xs mt-auto"
          style={{ color: titleColor }}
        >
          <div className="flex items-center space-x-2">
            <span className="font-extrabold uppercase tracking-wide">
              {config.supervisorTitle || 'SUPERVISOR'} :
            </span>
            <span
              className="w-56 border-b inline-block"
              style={{ borderBottomColor: borderColor }}
            >
              &nbsp;
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-extrabold uppercase tracking-wide">
              {config.hodTitle || 'H.O.D'} :
            </span>
            <span
              className="w-56 border-b inline-block"
              style={{ borderBottomColor: borderColor }}
            >
              &nbsp;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

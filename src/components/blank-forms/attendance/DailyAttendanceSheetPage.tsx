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
          : 'w-full max-w-[1260px] p-2 sm:p-4 shadow-md border border-slate-300 rounded-xl mb-6'
      }`}
      style={{
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Outer Table-style Container: Black border around all 4 sides stays intact as requested */}
      <div
        className="border-2 px-2 sm:px-3 pt-6 sm:pt-8 pb-3 bg-white flex flex-col justify-between w-full box-border min-h-[680px]"
        style={{ borderColor: borderColor }}
      >
        {/* Content shifted down from top into the previously empty space */}
        <div>
          {/* Header Block: 3 columns (Tamimi Logo | Company Title & Project Location | Enlarged Red Sea Global Logo) */}
          <div className="border pb-1 mb-1.5" style={{ borderColor: borderColor }}>
            <div className="flex items-center justify-between px-2 py-1 gap-2">
              {/* Left: Tamimi Global Logo */}
              <div className="w-36 sm:w-44 md:w-48 shrink-0 flex items-center justify-start pl-1">
                <TamimiLogo size={58} />
              </div>

              {/* Middle: Titles */}
              <div className="flex-1 text-center px-1" style={{ color: titleColor }}>
                <div className="font-black text-xs sm:text-[14px] md:text-[15px] leading-tight tracking-wide uppercase">
                  {config.companyName || 'TAMIMI GLOBAL COMPANY LTD.(TAFGA)'}
                </div>
                <div className="font-bold text-[10.5px] sm:text-[12px] md:text-[12.5px] leading-tight mt-0.5">
                  {config.locationName || 'AMAALA-Triple Bay Construction Village (Location #188)'}
                </div>
                <div className="font-extrabold text-[11px] sm:text-[13px] md:text-[13.5px] leading-tight tracking-wider uppercase mt-0.5">
                  {config.formTitle || 'STRAIGHT DAILY ATTENDANCE SHEET'}
                </div>
              </div>

              {/* Right: Enlarged Red Sea Global Logo */}
              <div className="w-44 sm:w-52 md:w-60 shrink-0 flex items-center justify-end pr-1">
                <RedSeaLogo className="h-14 sm:h-16 md:h-17 w-auto object-contain max-w-[220px]" />
              </div>
            </div>
          </div>

          {/* Subheader Banner: Department on left, Date on right */}
          <div
            className="border flex items-center justify-between font-bold text-[11px] sm:text-xs uppercase px-2.5 py-1 mb-1.5"
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

          {/* Main Attendance Grid Table: Spans full width, comfortable rows filling down into the empty space */}
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
                  className="border px-1 py-1 w-[4%] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  S. No.
                </th>
                <th
                  rowSpan={2}
                  className="border px-2 py-1 w-[22%] text-center font-black"
                  style={{ borderColor: borderColor }}
                >
                  Name
                </th>
                <th
                  rowSpan={2}
                  className="border px-1 py-1 w-[7.5%] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  ID No.
                </th>
                <th
                  rowSpan={2}
                  className="border px-2 py-1 w-[17%] text-center font-black"
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
                  className="border px-1 py-1 w-[5.5%] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  O.T.
                  <br />
                  HOURS
                </th>
                <th
                  rowSpan={2}
                  className="border px-1.5 py-1 w-[9%] font-black text-center"
                  style={{ borderColor: borderColor }}
                >
                  REMARKS
                </th>
              </tr>

              {/* Row 2: Sub-columns for Timing */}
              <tr
                className="text-center font-bold"
                style={{
                  backgroundColor: headerBg,
                  color: headerTextColor,
                }}
              >
                <th
                  className="border px-1 py-0.5 w-[6.5%] font-normal text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Time-in
                </th>
                <th
                  className="border px-1 py-0.5 w-[11%] font-bold text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Sign
                </th>
                <th
                  className="border px-1 py-0.5 w-[6.5%] font-normal text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Time- Out
                </th>
                <th
                  className="border px-1 py-0.5 w-[11%] font-bold text-center text-[10px]"
                  style={{ borderColor: borderColor }}
                >
                  Sign
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Staff Rows: Height expanded so the table comfortably fills the lower space */}
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
                      isCompact ? 'h-8.5 sm:h-9' : 'h-10 sm:h-11'
                    }`}
                  >
                    <td
                      className="border px-1 py-1 text-center font-bold text-[11px]"
                      style={{ borderColor: borderColor }}
                    >
                      {member.sNo || idx + 1}
                    </td>
                    <td
                      className="border px-2 py-1 font-bold uppercase text-[10.5px] truncate"
                      style={{ borderColor: borderColor }}
                    >
                      {member.name}
                    </td>
                    <td
                      className="border px-1 py-1 text-center font-semibold font-mono text-[10.5px]"
                      style={{ borderColor: borderColor }}
                    >
                      {member.idNo}
                    </td>
                    <td
                      className="border px-2 py-1 font-bold uppercase text-[10px] truncate"
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
                      className="border px-1.5 py-1 text-left bg-white text-[10px]"
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

              {/* Extra blank rows if configured */}
              {Array.from({ length: blankRowsNeeded }).map((_, bIdx) => {
                const currentSNo = staff.length + bIdx + 1;
                return (
                  <tr
                    key={`blank-row-${bIdx}`}
                    className={isCompact ? 'h-8.5 sm:h-9' : 'h-10 sm:h-11'}
                  >
                    <td
                      className="border px-1 py-1 text-center font-bold text-[11px]"
                      style={{ borderColor: borderColor }}
                    >
                      {currentSNo}
                    </td>
                    <td className="border px-2 py-1" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-2 py-1" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1 py-1 text-center" style={{ borderColor: borderColor }}>&nbsp;</td>
                    <td className="border px-1.5 py-1 text-left" style={{ borderColor: borderColor }}>&nbsp;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Secondary Table: EMPLOYEE ON VACATION (Exact as shown in user's original photo) */}
          <div className="mt-2.5 mb-2 max-w-[580px]">
            <table
              className="w-full border-collapse border text-[10px] sm:text-[10.5px] text-black"
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
                    className="border px-2 py-0.5 text-center font-black uppercase text-[10.5px] tracking-wide"
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
                    className="border px-2 py-0.5 text-center min-w-[190px]"
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
                    className="border px-2 py-0.5 text-center min-w-[170px]"
                    style={{ borderColor: borderColor }}
                  >
                    JOB
                  </th>
                </tr>
              </thead>
              <tbody>
                {vacation.map((vac, vIdx) => (
                  <tr key={`vac-${vac.idNo || vIdx}`} className="h-7.5 sm:h-8">
                    <td
                      className="border px-2 py-1 font-bold uppercase text-[10px]"
                      style={{ borderColor: borderColor }}
                    >
                      {vac.name}
                    </td>
                    <td
                      className="border px-1.5 py-1 text-center font-mono font-semibold text-[10px]"
                      style={{ borderColor: borderColor }}
                    >
                      {vac.idNo}
                    </td>
                    <td
                      className="border px-2 py-1 font-bold uppercase text-[9.5px]"
                      style={{ borderColor: borderColor }}
                    >
                      {vac.jobTitle}
                    </td>
                  </tr>
                ))}
                {vacation.length === 0 && (
                  <tr className="h-7.5">
                    <td className="border px-2 py-1 text-slate-400 italic" style={{ borderColor: borderColor }}>None</td>
                    <td className="border px-1.5 py-1 text-center text-slate-400 italic" style={{ borderColor: borderColor }}>-</td>
                    <td className="border px-2 py-1 text-slate-400 italic" style={{ borderColor: borderColor }}>-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Signatures Section: Anchored at the bottom inside the black border */}
        <div
          className="pt-6 pb-2 px-4 flex items-center justify-between font-bold text-xs mt-auto w-full"
          style={{ color: titleColor }}
        >
          <div className="flex items-center space-x-2">
            <span className="font-extrabold uppercase tracking-wide whitespace-nowrap">
              {config.supervisorTitle || 'SUPERVISOR'} :
            </span>
            <span
              className="w-64 sm:w-72 md:w-80 border-b-2 inline-block"
              style={{ borderBottomColor: borderColor }}
            >
              &nbsp;
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-extrabold uppercase tracking-wide whitespace-nowrap">
              {config.hodTitle || 'H.O.D'} :
            </span>
            <span
              className="w-64 sm:w-72 md:w-80 border-b-2 inline-block"
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

import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface GolfSimulatorChecklistFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const GolfSimulatorChecklistForm: React.FC<GolfSimulatorChecklistFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const daysList = data.days || [];
  const daysCount = isBlankMode ? 15 : Math.max(15, daysList.length);

  const handleDayChange = (index: number, field: string, val: string) => {
    const updated = [...daysList];
    while (updated.length <= index) {
      updated.push({
        time: '',
        door: '/',
        wall: '/',
        ceiling: '/',
        window: '/',
        furniture: '/',
        appliances: '/',
        trashbin: '/',
        vinylFloor: '/',
        greenTurf: '/',
        screen: '/',
        curtain: '/',
        electronics: '/',
        remarks: '',
        housekeeperName: '',
      });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('days', updated);
    } else if (onFieldChange) {
      onFieldChange('days', updated);
    }
  };

  const handleAddDay = () => {
    const updated = [
      ...daysList,
      {
        time: '08:00',
        door: '/',
        wall: '/',
        ceiling: '/',
        window: '/',
        furniture: '/',
        appliances: '/',
        trashbin: '/',
        vinylFloor: '/',
        greenTurf: '/',
        screen: '/',
        curtain: '/',
        electronics: '/',
        remarks: 'All Clean',
        housekeeperName: '',
      },
    ];
    if (onTableChange) {
      onTableChange('days', updated);
    } else if (onFieldChange) {
      onFieldChange('days', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[1100px] mx-auto p-6 sm:p-8 font-sans text-[11px] border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[750px] flex flex-col justify-between relative select-text">
      <div>
        {/* Logo Header Landscape */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
          <div className="flex items-center gap-2">
            <TamimiLogo size={60} />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              GOLF SIMULATOR ROOM CLEANING & INSPECTION CHECKLIST
            </h1>
            <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-center">
              <span>Month/Year:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="e.g. August 2026"
                  value={data.monthYear || ''}
                  onChange={(e) => onFieldChange?.('monthYear', e.target.value)}
                  className="border-b border-slate-600 bg-blue-50/40 px-2 py-0.5 ml-1 font-normal text-xs text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="underline ml-1 font-normal min-w-[140px] inline-block">{data.monthYear || '__________________'}</span>
              )}
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* Legend for Cleaning Standards */}
        <div className="flex items-center justify-between py-2 text-xs font-bold bg-slate-50 print:bg-transparent px-3 my-2 border border-slate-300">
          <div className="text-slate-950">
            Legend for Quality Inspection:
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="font-black text-emerald-700 bg-emerald-100 px-1 rounded">✓ / /</span> Acceptable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-black text-rose-700 bg-rose-100 px-1 rounded">X</span> Unacceptable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-black text-amber-700 bg-amber-100 px-1 rounded">D</span> Damaged
            </span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddDay}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Day</span>
              </button>
            )}
          </div>
        </div>

        {/* Checklist Table */}
        <div className="my-2 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 text-center text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">DAY</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-14">TIME</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Door</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Wall</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Ceiling</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Window</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Furn</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">App</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Bin</th>
                <th rowSpan={2} className="border border-slate-900 px-1 py-1 w-8">Floor</th>
                <th colSpan={4} className="border border-slate-900 px-1 py-1 bg-amber-100/60 print:bg-transparent">
                  Golf Sim Equipment Area
                </th>
                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[110px]">Remarks / Defects</th>
                <th rowSpan={2} className="border border-slate-900 px-2 py-1 min-w-[110px]">Housekeeper Name</th>
              </tr>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-[10px] text-slate-950">
                <th className="border border-slate-900 px-1 py-1 w-8">Turf</th>
                <th className="border border-slate-900 px-1 py-1 w-8">Screen</th>
                <th className="border border-slate-900 px-1 py-1 w-8">Curtain</th>
                <th className="border border-slate-900 px-1 py-1 w-8">Sensors</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysCount }, (_, i) => {
                const dayLog = daysList[i] || {};
                return (
                  <tr key={i} className="h-6 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 font-bold text-slate-900">{i + 1}</td>
                    <td className="border border-slate-900 text-slate-700">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={dayLog.time || ''}
                          onChange={(e) => handleDayChange(i, 'time', e.target.value)}
                          className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                        />
                      ) : (
                        <span>{dayLog.time || ''}</span>
                      )}
                    </td>
                    {['door', 'wall', 'ceiling', 'window', 'furniture', 'appliances', 'trashbin', 'vinylFloor', 'greenTurf', 'screen', 'curtain', 'electronics'].map((k) => (
                      <td key={k} className="border border-slate-900 font-semibold text-center">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={dayLog[k] || ''}
                            onChange={(e) => handleDayChange(i, k, e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none font-bold"
                          />
                        ) : (
                          <span>{dayLog[k] || ''}</span>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-900 text-left px-1 text-slate-700">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={dayLog.remarks || ''}
                          onChange={(e) => handleDayChange(i, 'remarks', e.target.value)}
                          className="w-full bg-transparent focus:bg-blue-50 focus:outline-none px-1 text-[10px]"
                        />
                      ) : (
                        <span>{dayLog.remarks || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 text-left px-1 font-medium text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={dayLog.housekeeperName || ''}
                          onChange={(e) => handleDayChange(i, 'housekeeperName', e.target.value)}
                          className="w-full bg-transparent focus:bg-blue-50 focus:outline-none px-1 text-[10px]"
                        />
                      ) : (
                        <span>{dayLog.housekeeperName || ''}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Verified By and Stamp */}
      <div className="pt-4 flex justify-between items-center text-xs font-bold text-slate-900 border-t border-slate-300">
        <div>
          <span>Verified & Inspected By (Supervisor): </span>
          {isEditable && !isBlankMode ? (
            <input
              type="text"
              value={data.verifiedBy || ''}
              onChange={(e) => onFieldChange?.('verifiedBy', e.target.value)}
              className="border-b border-slate-700 ml-2 min-w-[200px] px-2 italic font-serif text-slate-800 bg-blue-50/40 focus:outline-none"
            />
          ) : (
            <span className="border-b border-slate-700 ml-2 min-w-[200px] inline-block font-normal px-2 italic font-serif text-slate-800">
              {data.verifiedBy || ''}
            </span>
          )}
        </div>

        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge
            type={data.officialStamp}
            signatory={data.verifiedBy || 'HOUSEKEEPING SUPERVISOR'}
            date={data.monthYear}
          />
        )}

        <div className="text-[10px] text-slate-500 font-medium">
          Tamimi Global & Red Sea Global Facility Standards (Loc 188)
        </div>
      </div>
    </div>
  );
};

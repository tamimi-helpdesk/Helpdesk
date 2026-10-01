import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';

interface OutGoingPermissionFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const OutGoingPermissionForm: React.FC<OutGoingPermissionFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
}) => {
  const data = isBlankMode ? {} : formData;

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              OUT GOING PERMISSION SLIP
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Amaala Project Camp Loc # 188 — Staff Exit & Camp Gate Pass Permit
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* Subtitle & Date */}
        <div className="flex justify-between items-center pt-3 pb-4">
          <div className="text-xs italic font-bold text-slate-800">
            Kindly allow employee to exit camp premises for Medical / Bank / Official / Personal Leave:
          </div>
          <div className="font-bold text-xs text-slate-900 flex items-center">
            <span>Date:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="date"
                value={data.date || ''}
                onChange={(e) => onFieldChange?.('date', e.target.value)}
                className="border-b-2 border-blue-500 bg-blue-50/50 px-2 py-0.5 ml-2 min-w-[120px] font-normal text-xs text-slate-900 focus:outline-none"
              />
            ) : (
              <span className="border-b border-slate-600 ml-1 px-3 py-0.5 min-w-[120px] inline-block font-normal">
                {data.date || ''}
              </span>
            )}
          </div>
        </div>

        {/* Structured Form Fields */}
        <div className="space-y-4 py-4 text-xs font-bold text-slate-950">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 flex items-center">
              <span className="w-20 shrink-0 text-slate-900">Name:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={data.name || ''}
                  onChange={(e) => onFieldChange?.('name', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 font-semibold px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.name || ''}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="w-16 shrink-0 text-slate-900">Sign:</span>
              <span className="flex-1 border-b border-slate-600 min-h-[22px] px-2 italic font-serif text-slate-700">
                {data.name ? `✓ ${data.name.split(' ')[0]}` : ''}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center">
              <span className="w-20 shrink-0 text-slate-900">ID No.:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="Badge ID"
                  value={data.idNo || ''}
                  onChange={(e) => onFieldChange?.('idNo', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.idNo || ''}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="w-24 shrink-0 text-slate-900">Mobile No:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="05X-XXXXXXX"
                  value={data.mobileNo || ''}
                  onChange={(e) => onFieldChange?.('mobileNo', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.mobileNo || ''}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center">
              <span className="w-24 shrink-0 text-slate-900">Department:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="Department"
                  value={data.department || ''}
                  onChange={(e) => onFieldChange?.('department', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.department || ''}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="w-24 shrink-0 text-slate-900">Designation:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="Job Title"
                  value={data.designation || ''}
                  onChange={(e) => onFieldChange?.('designation', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.designation || ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start pt-2">
            <span className="w-56 shrink-0 text-slate-900">Type of Medical / Bank / Others Issue:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="Reason / Clinical Appointment / Banking Service..."
                value={data.issueType || ''}
                onChange={(e) => onFieldChange?.('issueType', e.target.value)}
                className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
              />
            ) : (
              <div className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[38px] text-slate-900">
                {data.issueType || ''}
              </div>
            )}
          </div>

          <div className="flex items-center pt-2">
            <span className="w-32 shrink-0 text-slate-900">Place of Visit: -</span>
            <div className="flex flex-wrap items-center gap-6 font-medium text-slate-900">
              {['Duba', 'Wajah', 'Tabuk', 'Red Sea'].map((place) => (
                <label
                  key={place}
                  onClick={() => isEditable && onFieldChange?.('placeOfVisit', place)}
                  className="flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <span className="w-4 h-4 border border-slate-900 inline-flex items-center justify-center text-xs">
                    {data.placeOfVisit === place ? '✓' : ''}
                  </span>
                  <span>{place}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="flex items-center">
              <span className="w-24 shrink-0 text-slate-900">Exit Time:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="08:00 AM"
                  value={data.exitTime || ''}
                  onChange={(e) => onFieldChange?.('exitTime', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.exitTime || ''}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="w-24 shrink-0 text-slate-900">Return Time:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="05:00 PM"
                  value={data.returnTime || ''}
                  onChange={(e) => onFieldChange?.('returnTime', e.target.value)}
                  className="flex-1 border-b border-slate-600 bg-blue-50/30 px-2 py-1 text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-slate-600 font-normal px-2 min-h-[22px] text-slate-900">
                  {data.returnTime || ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approvals and Gate Security section */}
      <div className="pt-6 border-t-2 border-slate-900 space-y-6">
        <div className="grid grid-cols-2 gap-8 text-xs font-bold text-slate-950">
          <div>
            <div className="mb-2">DEPARTMENT HEAD APPROVAL:</div>
            <div className="border-b-2 border-slate-800 min-h-[36px] flex items-end px-2 pb-1 font-semibold text-slate-900">
              {data.departmentHead || 'APPROVED - HR/OPERATIONS'}
            </div>
          </div>
          <div>
            <div className="mb-2">CAMP MANAGER / DEPUTY APPROVAL:</div>
            <div className="border-b-2 border-slate-800 min-h-[36px] flex items-end px-2 pb-1 font-semibold text-slate-900">
              {data.campManager || 'AUTHORIZED - CAMP ADMIN'}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-300">
          <div>Security Gate Pass Record (Main Gate Checkpoint Verification)</div>
          {data.officialStamp && data.officialStamp !== 'NONE' && (
            <OfficialStampBadge
              type={data.officialStamp}
              signatory="CAMP SECURITY COMMANDER"
              date={data.date}
            />
          )}
        </div>
      </div>
    </div>
  );
};

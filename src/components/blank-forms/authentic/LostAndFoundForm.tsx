import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';

interface LostAndFoundFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const LostAndFoundForm: React.FC<LostAndFoundFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
}) => {
  const data = isBlankMode ? {} : formData;

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 border-b-2 border-slate-900">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-slate-950 uppercase">
              Lost and Found Form
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Tamimi Global Facilities Management — Incident &amp; Custody Registry
            </div>
          </div>
          <div className="flex flex-col items-end min-w-[120px]">
            <div className="text-xs font-bold text-slate-800 mt-1 flex items-center">
              <span>Date:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="date"
                  value={data.date || ''}
                  onChange={(e) => onFieldChange?.('date', e.target.value)}
                  className="border-b border-slate-600 bg-blue-50/40 ml-1 px-1 py-0.5 text-xs text-slate-900 focus:outline-none"
                />
              ) : (
                <span className="underline ml-1 font-normal">{data.date || '08/01/2026'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Reporter Details */}
        <div className="my-4">
          <div className="bg-[#B89650] text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider rounded-t-xs">
            1. Reporter Details
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <tbody>
              <tr className="border-b border-slate-400">
                <td className="border border-slate-400 p-2 font-bold w-40 bg-slate-100 print:bg-transparent text-slate-950">
                  Name
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Reporter Full Name..."
                      value={data.reporterName || ''}
                      onChange={(e) => onFieldChange?.('reporterName', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.reporterName || ''}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-400">
                <td className="border border-slate-400 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Company
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={data.reporterCompany || 'Tamimi Global'}
                      onChange={(e) => onFieldChange?.('reporterCompany', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.reporterCompany || 'Tamimi Global'}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-400">
                <td className="border border-slate-400 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Company ID. No
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="ID Number"
                      value={data.reporterCompanyId || ''}
                      onChange={(e) => onFieldChange?.('reporterCompanyId', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.reporterCompanyId || ''}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Contact Numbers:
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold">Mob:</span>
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="05X-XXXXXXX"
                          value={data.reporterMob || ''}
                          onChange={(e) => onFieldChange?.('reporterMob', e.target.value)}
                          className="bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                        />
                      ) : (
                        <span className="font-semibold">{data.reporterMob || ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">E-mail:</span>
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="email@example.com"
                          value={data.reporterEmail || ''}
                          onChange={(e) => onFieldChange?.('reporterEmail', e.target.value)}
                          className="bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                        />
                      ) : (
                        <span className="font-semibold">{data.reporterEmail || ''}</span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Description of found item */}
        <div className="my-4">
          <div className="bg-[#B89650] text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider rounded-t-xs">
            2. Description of Found Item
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <tbody>
              <tr className="border-b border-slate-400">
                <td className="border border-slate-400 p-2 font-bold w-40 bg-slate-100 print:bg-transparent text-slate-950 align-top">
                  Description of Item
                </td>
                <td className="border border-slate-400 p-2.5 font-normal min-h-[60px] align-top text-slate-900 leading-relaxed">
                  {isEditable && !isBlankMode ? (
                    <textarea
                      rows={2}
                      placeholder="Detailed item description, color, brand, serial..."
                      value={data.itemDescription || ''}
                      onChange={(e) => onFieldChange?.('itemDescription', e.target.value)}
                      className="w-full bg-blue-50/30 p-1 text-xs focus:outline-none rounded"
                    />
                  ) : (
                    <span>{data.itemDescription || ''}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Location Found
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Exact location found (e.g. Cinema Hall row 3)..."
                      value={data.locationFound || ''}
                      onChange={(e) => onFieldChange?.('locationFound', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.locationFound || ''}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Owner Details (When Claimed) */}
        <div className="my-4">
          <div className="bg-[#B89650] text-white font-bold px-3 py-1.5 text-xs uppercase tracking-wider rounded-t-xs">
            3. Claim / Handover Details
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <tbody>
              <tr className="border-b border-slate-400">
                <td className="border border-slate-400 p-2 font-bold w-40 bg-slate-100 print:bg-transparent text-slate-950">
                  Claimed By (Owner Name)
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Owner Name..."
                      value={data.ownerName || ''}
                      onChange={(e) => onFieldChange?.('ownerName', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.ownerName || ''}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Owner Signature & ID
                </td>
                <td className="border border-slate-400 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Owner ID and Sign..."
                      value={data.ownerSign || ''}
                      onChange={(e) => onFieldChange?.('ownerSign', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none italic"
                    />
                  ) : (
                    <span className="italic font-serif">{data.ownerSign || (data.ownerName ? `✓ ${data.ownerName}` : '')}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stamp & Custody Sign */}
      <div className="pt-4 flex justify-between items-center text-xs font-bold text-slate-950 border-t border-slate-300">
        <div>
          <span>Tamimi Global Security & Helpdesk (AMAALA Loc 188)</span>
        </div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge
            type={data.officialStamp}
            signatory={data.custodyOfficer || 'LOST & FOUND CUSTODIAN'}
            date={data.date}
          />
        )}
      </div>
    </div>
  );
};

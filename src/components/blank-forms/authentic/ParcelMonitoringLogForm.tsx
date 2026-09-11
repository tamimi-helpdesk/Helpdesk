import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface ParcelMonitoringLogFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const ParcelMonitoringLogForm: React.FC<ParcelMonitoringLogFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const rowsList = data.rows || [];
  const rowsCount = isBlankMode ? 14 : Math.max(14, rowsList.length);

  const handleRowChange = (index: number, field: string, val: string) => {
    const updated = [...rowsList];
    while (updated.length <= index) {
      updated.push({
        deliveryDate: '',
        name: '',
        roomNo: '',
        mobileNo: '',
        courier: '',
        signature: '',
        receivedDateTime: '',
      });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('rows', updated);
    } else if (onFieldChange) {
      onFieldChange('rows', updated);
    }
  };

  const handleAddRow = () => {
    const updated = [
      ...rowsList,
      {
        deliveryDate: new Date().toISOString().split('T')[0],
        name: '',
        roomNo: '',
        mobileNo: '',
        courier: 'DHL',
        signature: '',
        receivedDateTime: '',
      },
    ];
    if (onTableChange) {
      onTableChange('rows', updated);
    } else if (onFieldChange) {
      onFieldChange('rows', updated);
    }
  };

  const handleRemoveRow = (index: number) => {
    const updated = rowsList.filter((_: any, i: number) => i !== index);
    if (onTableChange) {
      onTableChange('rows', updated);
    } else if (onFieldChange) {
      onFieldChange('rows', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[1100px] mx-auto p-6 sm:p-8 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[750px] flex flex-col justify-between relative select-text">
      <div>
        {/* Landscape Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              PARCEL MONITORING LOG SHEET
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Amaala Camp Loc # 188 — Courier Dispatch & Resident Parcel Receiving Register
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* 14+ Row Table */}
        <div className="my-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 text-xs">Courier Parcel Inbound & Issuance Registry:</span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddRow}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Parcel Row</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border border-slate-900 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-2 py-2 w-10 text-center">SI.NO</th>
                <th className="border border-slate-900 px-3 py-2 w-28">DELIVERY DATE</th>
                <th className="border border-slate-900 px-3 py-2 w-44">NAME</th>
                <th className="border border-slate-900 px-2 py-2 w-20 text-center">ROOM NO</th>
                <th className="border border-slate-900 px-3 py-2 w-28 text-center">MOBILE NO</th>
                <th className="border border-slate-900 px-3 py-2 w-28">COURIER</th>
                <th className="border border-slate-900 px-2 py-2 w-24 text-center">SIGNATURE</th>
                <th className="border border-slate-900 px-3 py-2 w-36 text-center">DATE & TIME OF RECEIVED</th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1 w-8 text-center print:hidden">Del</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsCount }, (_, i) => {
                const row = rowsList[i] || {};
                return (
                  <tr key={i} className="h-8 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-1 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 font-normal text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={row.deliveryDate || ''}
                          onChange={(e) => handleRowChange(i, 'deliveryDate', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.deliveryDate || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 font-normal text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Recipient Name"
                          value={row.name || ''}
                          onChange={(e) => handleRowChange(i, 'name', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.name || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Room"
                          value={row.roomNo || ''}
                          onChange={(e) => handleRowChange(i, 'roomNo', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.roomNo || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="05X-XXXXXXX"
                          value={row.mobileNo || ''}
                          onChange={(e) => handleRowChange(i, 'mobileNo', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.mobileNo || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-slate-900 font-semibold">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="DHL / SMSA / Aramex"
                          value={row.courier || ''}
                          onChange={(e) => handleRowChange(i, 'courier', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none font-bold"
                        />
                      ) : (
                        <span>{row.courier || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center italic font-serif text-slate-700">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Sign"
                          value={row.signature || ''}
                          onChange={(e) => handleRowChange(i, 'signature', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none italic font-serif"
                        />
                      ) : (
                        <span>{row.signature || (row.receivedDateTime && row.name ? `✓ ${row.name.split(' ')[0]}` : '')}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Date & Time"
                          value={row.receivedDateTime || ''}
                          onChange={(e) => handleRowChange(i, 'receivedDateTime', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.receivedDateTime || ''}</span>
                      )}
                    </td>
                    {isEditable && !isBlankMode && (
                      <td className="border border-slate-900 px-1 py-0.5 text-center print:hidden">
                        {rowsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(i)}
                            className="text-slate-400 hover:text-red-600 p-0.5 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
        <div>Tamimi Global Reception Courier Log Registry (SMSA, DHL, Aramex, Naqel, SPL)</div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge type={data.officialStamp} signatory="HELPDESK DESK IN-CHARGE" />
        )}
      </div>
    </div>
  );
};

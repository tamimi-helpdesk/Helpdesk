import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface KeyMonitoringFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const KeyMonitoringForm: React.FC<KeyMonitoringFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const rowsList = data.rows || [];
  const rowsCount = isBlankMode ? 15 : Math.max(15, rowsList.length);

  const handleRowChange = (index: number, field: string, val: string) => {
    const updated = [...rowsList];
    while (updated.length <= index) {
      updated.push({
        name: '',
        roomNo: '',
        employeeId: '',
        mobileNo: '',
        borrowDateTime: '',
        borrowSign: '',
        returnDateTime: '',
        returnSign: '',
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
        name: '',
        roomNo: '',
        employeeId: '',
        mobileNo: '',
        borrowDateTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        borrowSign: '',
        returnDateTime: '',
        returnSign: '',
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
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950">
              Padel Court and Golf Simulator Key Monitoring
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Front Desk &amp; Helpdesk Division — Custody &amp; Access Control Register
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* Dynamic Landscape Monitoring Table */}
        <div className="my-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 text-xs">Access Keys Monitoring Register:</span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddRow}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Log Row</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border border-slate-900 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-2 py-2 w-10 text-center">No.</th>
                <th className="border border-slate-900 px-3 py-2 w-40">Name</th>
                <th className="border border-slate-900 px-2 py-2 w-20 text-center">Room No.</th>
                <th className="border border-slate-900 px-2 py-2 w-28 text-center">Employee ID</th>
                <th className="border border-slate-900 px-2 py-2 w-28 text-center">Mobile No.</th>
                <th className="border border-slate-900 px-3 py-2 w-36 text-center">Date & Time Borrowed</th>
                <th className="border border-slate-900 px-2 py-2 w-24 text-center">Signature</th>
                <th className="border border-slate-900 px-3 py-2 w-36 text-center">Date & Time Returned</th>
                <th className="border border-slate-900 px-2 py-2 w-24 text-center">Signature</th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1 w-8 text-center print:hidden">Del</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsCount }, (_, i) => {
                const row = rowsList[i] || {};
                return (
                  <tr key={i} className="h-8 border-b border-slate-900 hover:bg-slate-50">
                    <td className="border border-slate-900 px-1 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 font-normal text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Full Name..."
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
                          placeholder="Badge ID"
                          value={row.employeeId || ''}
                          onChange={(e) => handleRowChange(i, 'employeeId', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.employeeId || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Mobile"
                          value={row.mobileNo || ''}
                          onChange={(e) => handleRowChange(i, 'mobileNo', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.mobileNo || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="DD/MM/YYYY HH:MM"
                          value={row.borrowDateTime || ''}
                          onChange={(e) => handleRowChange(i, 'borrowDateTime', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.borrowDateTime || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center italic font-serif text-slate-700">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Sign"
                          value={row.borrowSign || ''}
                          onChange={(e) => handleRowChange(i, 'borrowSign', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none italic font-serif"
                        />
                      ) : (
                        <span>{row.borrowSign || (row.name ? `✓ ${row.name.split(' ')[0]}` : '')}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Return Time"
                          value={row.returnDateTime || ''}
                          onChange={(e) => handleRowChange(i, 'returnDateTime', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{row.returnDateTime || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center italic font-serif text-slate-700">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Sign"
                          value={row.returnSign || ''}
                          onChange={(e) => handleRowChange(i, 'returnSign', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/40 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none italic font-serif"
                        />
                      ) : (
                        <span>{row.returnSign || (row.returnDateTime ? `✓ ${row.name ? row.name.split(' ')[0] : ''}` : '')}</span>
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

      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-600">
        <div>Tamimi Global Front Desk / Helpdesk Key Custody Registry (RSG Amaala Loc 188)</div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge type={data.officialStamp} signatory="HELPDESK DUTY OFFICER" />
        )}
      </div>
    </div>
  );
};

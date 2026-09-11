import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface AssetsHandoverFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const AssetsHandoverForm: React.FC<AssetsHandoverFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const itemsList = data.items || [];
  const rowsCount = isBlankMode ? 13 : Math.max(13, itemsList.length);

  const handleItemChange = (index: number, field: string, val: string) => {
    const updated = [...itemsList];
    while (updated.length <= index) {
      updated.push({ assetName: '', qty: '1', remark: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('items', updated);
    } else if (onFieldChange) {
      onFieldChange('items', updated);
    }
  };

  const handleAddItem = () => {
    const updated = [...itemsList, { assetName: '', qty: '1', remark: 'Good Condition' }];
    if (onTableChange) {
      onTableChange('items', updated);
    } else if (onFieldChange) {
      onFieldChange('items', updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = itemsList.filter((_: any, i: number) => i !== index);
    if (onTableChange) {
      onTableChange('items', updated);
    } else if (onFieldChange) {
      onFieldChange('items', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <TamimiLogo size={60} />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black text-slate-950 tracking-wide uppercase">
              ASSETS HANDOVER FORM (Personal Belonging)
            </h1>
            <div className="text-[10px] text-slate-600 font-medium mt-0.5">
              Tamimi Global Co. Ltd. — Accommodation &amp; Facilities Division
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        <div className="border-b-2 border-slate-900 my-2" />

        {/* Date */}
        <div className="text-right py-2 font-bold text-slate-900 flex justify-end items-center">
          <span>Date:</span>
          {isEditable && !isBlankMode ? (
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => onFieldChange?.('date', e.target.value)}
              className="border-b-2 border-blue-500 bg-blue-50/50 hover:bg-blue-50 px-2 py-0.5 ml-2 min-w-[140px] font-normal text-xs text-slate-900 focus:outline-none rounded-xs"
            />
          ) : (
            <span className="underline font-normal inline-block min-w-[140px] text-left ml-1">
              {data.date || '------------------'}
            </span>
          )}
        </div>

        {/* Resident & Company Metadata Fields */}
        <div className="space-y-2 py-3 font-bold text-slate-950">
          <div className="flex items-center">
            <span className="w-44 shrink-0 text-slate-900">Company Name-</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                value={data.companyName || ''}
                onChange={(e) => onFieldChange?.('companyName', e.target.value)}
                placeholder="e.g. Red Sea Global (RSG) / Tamimi Global"
                className="flex-1 border-b border-slate-400 bg-blue-50/30 hover:bg-blue-50 px-2 py-0.5 text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 py-0.5 min-h-[22px] text-slate-900">
                {data.companyName || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-44 shrink-0 text-slate-900">Resident Name-</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                value={data.residentName || ''}
                onChange={(e) => onFieldChange?.('residentName', e.target.value)}
                placeholder="Full Name"
                className="flex-1 border-b border-slate-400 bg-blue-50/30 hover:bg-blue-50 px-2 py-0.5 text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 py-0.5 min-h-[22px] text-slate-900">
                {data.residentName || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-44 shrink-0 text-slate-900">Nationality-</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                value={data.nationality || ''}
                onChange={(e) => onFieldChange?.('nationality', e.target.value)}
                placeholder="Nationality"
                className="flex-1 border-b border-slate-400 bg-blue-50/30 hover:bg-blue-50 px-2 py-0.5 text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 py-0.5 min-h-[22px] text-slate-900">
                {data.nationality || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-44 shrink-0 text-slate-900">Passport/Iqama No-</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                value={data.iqamaPassportNo || ''}
                onChange={(e) => onFieldChange?.('iqamaPassportNo', e.target.value)}
                placeholder="Iqama or Passport Number"
                className="flex-1 border-b border-slate-400 bg-blue-50/30 hover:bg-blue-50 px-2 py-0.5 text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 py-0.5 min-h-[22px] text-slate-900">
                {data.iqamaPassportNo || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-44 shrink-0 text-slate-900">Room No-</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                value={data.roomNo || ''}
                onChange={(e) => onFieldChange?.('roomNo', e.target.value)}
                placeholder="e.g. J5-104"
                className="flex-1 border-b border-slate-400 bg-blue-50/30 hover:bg-blue-50 px-2 py-0.5 text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 py-0.5 min-h-[22px] text-slate-900">
                {data.roomNo || ''}
              </span>
            )}
          </div>
        </div>

        {/* Table 13+ Rows */}
        <div className="my-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 text-xs">Resident Room Asset Inventory List:</span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddItem}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Asset Row</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border border-slate-900 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-3 py-1.5 w-14 text-center">Sl.N</th>
                <th className="border border-slate-900 px-3 py-1.5">Assets Name</th>
                <th className="border border-slate-900 px-3 py-1.5 w-20 text-center">Qty</th>
                <th className="border border-slate-900 px-3 py-1.5 w-48">Remark</th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1 w-10 text-center print:hidden">Del</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsCount }, (_, i) => {
                const item = itemsList[i] || {};
                return (
                  <tr key={i} className="h-7 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Asset Description..."
                          value={item.assetName || ''}
                          onChange={(e) => handleItemChange(i, 'assetName', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.assetName || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="1"
                          value={item.qty || ''}
                          onChange={(e) => handleItemChange(i, 'qty', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none font-bold"
                        />
                      ) : (
                        <span>{item.qty || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Condition / Remark..."
                          value={item.remark || ''}
                          onChange={(e) => handleItemChange(i, 'remark', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.remark || ''}</span>
                      )}
                    </td>
                    {isEditable && !isBlankMode && (
                      <td className="border border-slate-900 px-1 py-0.5 text-center print:hidden">
                        {itemsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(i)}
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

      {/* Footer Signatures */}
      <div className="pt-4 border-t-2 border-slate-900 text-xs">
        <div className="grid grid-cols-2 gap-8">
          {/* Handover By */}
          <div className="space-y-1.5 border-r border-slate-300 pr-4">
            <div className="font-bold underline text-slate-950 uppercase">Handover By (Housekeeping):</div>
            <div className="flex items-center text-[11px]">
              <span className="w-24 text-slate-700">Name:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  value={data.hkSupervisor || ''}
                  onChange={(e) => onFieldChange?.('hkSupervisor', e.target.value)}
                  className="flex-1 border-b border-slate-400 bg-blue-50/30 px-1 text-xs focus:outline-none"
                />
              ) : (
                <span className="border-b border-slate-400 flex-1 font-semibold">{data.hkSupervisor || ''}</span>
              )}
            </div>
            <div className="flex items-center text-[11px]">
              <span className="w-24 text-slate-700">Iqama No:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  value={data.hkIqamaNo || ''}
                  onChange={(e) => onFieldChange?.('hkIqamaNo', e.target.value)}
                  className="flex-1 border-b border-slate-400 bg-blue-50/30 px-1 text-xs focus:outline-none"
                />
              ) : (
                <span className="border-b border-slate-400 flex-1 font-semibold">{data.hkIqamaNo || ''}</span>
              )}
            </div>
            <div className="flex items-center text-[11px]">
              <span className="w-24 text-slate-700">Signature:</span>
              <span className="border-b border-slate-400 flex-1 min-h-[22px] italic font-serif">
                {data.hkSupervisor ? `✓ ${data.hkSupervisor}` : ''}
              </span>
            </div>
          </div>

          {/* Takeover By */}
          <div className="space-y-1.5">
            <div className="font-bold underline text-slate-950 uppercase">Takeover By (Recipient):</div>
            <div className="flex items-center text-[11px]">
              <span className="w-24 text-slate-700">Company:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  value={data.takeoverCompany || ''}
                  onChange={(e) => onFieldChange?.('takeoverCompany', e.target.value)}
                  className="flex-1 border-b border-slate-400 bg-blue-50/30 px-1 text-xs focus:outline-none"
                />
              ) : (
                <span className="border-b border-slate-400 flex-1 font-semibold">{data.takeoverCompany || ''}</span>
              )}
            </div>
            <div className="flex items-center text-[11px]">
              <span className="w-24 text-slate-700">POC Name:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  value={data.takeoverPoc || ''}
                  onChange={(e) => onFieldChange?.('takeoverPoc', e.target.value)}
                  className="flex-1 border-b border-slate-400 bg-blue-50/30 px-1 text-xs focus:outline-none"
                />
              ) : (
                <span className="border-b border-slate-400 flex-1 font-semibold">{data.takeoverPoc || ''}</span>
              )}
            </div>
            <div className="flex items-center text-[11px]">
              <span className="w-24 text-slate-700">Mobile No:</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  value={data.takeoverMobile || ''}
                  onChange={(e) => onFieldChange?.('takeoverMobile', e.target.value)}
                  className="flex-1 border-b border-slate-400 bg-blue-50/30 px-1 text-xs focus:outline-none"
                />
              ) : (
                <span className="border-b border-slate-400 flex-1 font-semibold">{data.takeoverMobile || ''}</span>
              )}
            </div>
          </div>
        </div>

        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <div className="mt-4 flex justify-end">
            <OfficialStampBadge
              type={data.officialStamp}
              signatory={data.hkSupervisor || 'HOUSEKEEPING SUPERVISOR'}
              date={data.date}
            />
          </div>
        )}
      </div>
    </div>
  );
};

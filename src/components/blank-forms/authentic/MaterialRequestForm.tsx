import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface MaterialRequestFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const MaterialRequestForm: React.FC<MaterialRequestFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const itemsList = data.items || [];
  const rowsCount = isBlankMode ? 12 : Math.max(12, itemsList.length);

  const handleItemChange = (index: number, field: string, val: string) => {
    const updated = [...itemsList];
    while (updated.length <= index) {
      updated.push({ description: '', unit: 'Pcs', qty: '1' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('items', updated);
    } else if (onFieldChange) {
      onFieldChange('items', updated);
    }
  };

  const handleAddItem = () => {
    const updated = [...itemsList, { description: '', unit: 'Pcs', qty: '1' }];
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
        <div className="flex items-start justify-between pb-4">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              TAMIMI GLOBAL COMPANY (TAFGA)
            </h1>
            <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-wider mt-0.5">
              AMAALA CAMP LOC # 188
            </h2>
            <h3 className="text-sm font-serif font-black text-slate-900 tracking-widest underline mt-1">
              MATERIAL REQUEST
            </h3>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* Date on Right */}
        <div className="flex justify-end items-center py-2 mb-2 font-bold text-slate-900">
          <span>Date:</span>
          {isEditable && !isBlankMode ? (
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => onFieldChange?.('date', e.target.value)}
              className="border-b-2 border-blue-500 bg-blue-50/50 hover:bg-blue-50 px-2 py-0.5 ml-2 min-w-[140px] font-normal text-xs text-slate-900 focus:outline-none rounded-xs"
            />
          ) : (
            <span className="border-b border-slate-600 ml-2 px-3 py-0.5 min-w-[140px] text-center font-normal">
              {data.date || '------------------'}
            </span>
          )}
        </div>

        {/* Dynamic Material Request Table */}
        <div className="my-2 overflow-x-auto">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 text-xs">Material Requisition Items:</span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddItem}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material Row</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border-2 border-slate-900 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b-2 border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-3 py-2 w-14 text-center">S/No.</th>
                <th className="border border-slate-900 px-3 py-2">Description</th>
                <th className="border border-slate-900 px-3 py-2 w-28 text-center">Unit</th>
                <th className="border border-slate-900 px-3 py-2 w-28 text-center">Qty.</th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1 w-10 text-center print:hidden">Del</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsCount }, (_, i) => {
                const item = itemsList[i] || {};
                return (
                  <tr key={i} className="h-8 border-b border-slate-800 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Item Description & Specifications..."
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1.5 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.description || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center text-slate-800 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Unit (Pcs, Box...)"
                          value={item.unit || ''}
                          onChange={(e) => handleItemChange(i, 'unit', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.unit || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center text-slate-900 font-bold">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Qty"
                          value={item.qty || ''}
                          onChange={(e) => handleItemChange(i, 'qty', e.target.value)}
                          className="w-full text-center bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none font-bold"
                        />
                      ) : (
                        <span>{item.qty || ''}</span>
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

      {/* Signatures & Stamp at bottom */}
      <div className="pt-8 pb-4">
        <div className="flex justify-between items-end gap-8 text-xs font-bold text-slate-950">
          <div className="flex-1">
            <div className="mb-2 uppercase tracking-wide">REQUESTED BY:</div>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="Requested By Name / Title..."
                value={data.requestedBy || ''}
                onChange={(e) => onFieldChange?.('requestedBy', e.target.value)}
                className="w-full border-b-2 border-slate-800 bg-blue-50/30 px-2 py-1 font-semibold text-xs focus:outline-none"
              />
            ) : (
              <div className="border-b-2 border-slate-800 min-h-[32px] flex items-end px-2 pb-1 font-normal text-slate-900">
                {data.requestedBy || ''}
              </div>
            )}
          </div>

          {data.officialStamp && data.officialStamp !== 'NONE' && (
            <div className="shrink-0">
              <OfficialStampBadge
                type={data.officialStamp}
                signatory={data.issuedBy || 'STORE SUPERVISOR'}
                date={data.date}
              />
            </div>
          )}

          <div className="flex-1">
            <div className="mb-2 uppercase tracking-wide">ISSUED BY:</div>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="Issued By Name / Warehouse Lead..."
                value={data.issuedBy || ''}
                onChange={(e) => onFieldChange?.('issuedBy', e.target.value)}
                className="w-full border-b-2 border-slate-800 bg-blue-50/30 px-2 py-1 font-semibold text-xs focus:outline-none"
              />
            ) : (
              <div className="border-b-2 border-slate-800 min-h-[32px] flex items-end px-2 pb-1 font-normal text-slate-900">
                {data.issuedBy || ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

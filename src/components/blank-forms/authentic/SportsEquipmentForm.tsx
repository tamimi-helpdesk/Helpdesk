import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface SportsEquipmentFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const SportsEquipmentForm: React.FC<SportsEquipmentFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const borrowItemsList = data.borrowItems || [];
  const returnItemsList = data.returnItems || [];
  const borrowRows = isBlankMode ? 4 : Math.max(4, borrowItemsList.length);
  const returnRows = isBlankMode ? 4 : Math.max(4, returnItemsList.length);

  const handleBorrowItemChange = (index: number, field: string, val: string) => {
    const updated = [...borrowItemsList];
    while (updated.length <= index) {
      updated.push({ description: '', qty: '1', damage: 'NO', remarks: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('borrowItems', updated);
    } else if (onFieldChange) {
      onFieldChange('borrowItems', updated);
    }
  };

  const handleAddBorrowItem = () => {
    const updated = [...borrowItemsList, { description: '', qty: '1', damage: 'NO', remarks: '' }];
    if (onTableChange) {
      onTableChange('borrowItems', updated);
    } else if (onFieldChange) {
      onFieldChange('borrowItems', updated);
    }
  };

  const handleReturnItemChange = (index: number, field: string, val: string) => {
    const updated = [...returnItemsList];
    while (updated.length <= index) {
      updated.push({ description: '', qty: '1', damage: 'NO', remarks: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('returnItems', updated);
    } else if (onFieldChange) {
      onFieldChange('returnItems', updated);
    }
  };

  const handleAddReturnItem = () => {
    const updated = [...returnItemsList, { description: '', qty: '1', damage: 'NO', remarks: '' }];
    if (onTableChange) {
      onTableChange('returnItems', updated);
    } else if (onFieldChange) {
      onFieldChange('returnItems', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <TamimiLogo size={60} />
          <div className="text-center flex-1">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              SPORTS EQUIPMENT CUSTODY SLIP
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Recreation Facility &amp; Gear Lending Registry (Amaala Loc 188)
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* SECTION 1: Borrowers slip */}
        <div className="pt-4 pb-6 border-b-2 border-dashed border-slate-400">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
              Part 1: Borrowers Slip (Issue)
            </h2>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddBorrowItem}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Borrow Item</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3">
            <div className="space-y-1.5 font-bold text-slate-950">
              <div className="flex items-center">
                <span className="w-36 shrink-0 text-slate-900">Issued Date & Time:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY HH:MM"
                    value={data.borrowDateTime || ''}
                    onChange={(e) => onFieldChange?.('borrowDateTime', e.target.value)}
                    className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                    {data.borrowDateTime || ''}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-36 shrink-0 text-slate-900">RSG ID NO.:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="ID Number"
                    value={data.borrowRsgId || ''}
                    onChange={(e) => onFieldChange?.('borrowRsgId', e.target.value)}
                    className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                    {data.borrowRsgId || ''}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-36 shrink-0 text-slate-900">Room NO.:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Room"
                    value={data.borrowRoomNo || ''}
                    onChange={(e) => onFieldChange?.('borrowRoomNo', e.target.value)}
                    className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                    {data.borrowRoomNo || ''}
                  </span>
                )}
              </div>
            </div>

            {/* Helpdesk Box */}
            <div className="border border-slate-900 p-2.5 rounded bg-slate-50/70 print:bg-transparent flex flex-col justify-between">
              <span className="font-bold text-slate-950 text-xs">Issued by (HELPDESK OFFICER):</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="Officer Name..."
                  value={data.issuedByHelpdesk || ''}
                  onChange={(e) => onFieldChange?.('issuedByHelpdesk', e.target.value)}
                  className="border-b border-slate-700 bg-blue-50/40 px-2 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              ) : (
                <div className="border-b border-slate-700 font-medium px-1 py-1 min-h-[24px] text-slate-900">
                  {data.issuedByHelpdesk || ''}
                </div>
              )}
            </div>
          </div>

          {/* Borrowers Table */}
          <table className="w-full border-collapse border border-slate-900 text-left text-xs my-2">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-3 py-1.5">Item Description</th>
                <th className="border border-slate-900 px-2 py-1.5 w-24 text-center">Quantity</th>
                <th className="border border-slate-900 px-2 py-1.5 w-36 text-center">DAMAGE (YES/NO)</th>
                <th className="border border-slate-900 px-3 py-1.5 w-44">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: borrowRows }, (_, i) => {
                const item = borrowItemsList[i] || {};
                return (
                  <tr key={i} className="h-7 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-1 font-normal text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="e.g. Padel Racket..."
                          value={item.description || ''}
                          onChange={(e) => handleBorrowItemChange(i, 'description', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.description || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={item.qty || ''}
                          onChange={(e) => handleBorrowItemChange(i, 'qty', e.target.value)}
                          className="w-full text-center bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none font-bold"
                        />
                      ) : (
                        <span>{item.qty || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center font-normal">
                      {isEditable && !isBlankMode ? (
                        <select
                          value={item.damage || 'NO'}
                          onChange={(e) => handleBorrowItemChange(i, 'damage', e.target.value)}
                          className="bg-transparent text-xs text-center font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="NO">NO (Good)</option>
                          <option value="YES">YES (Damaged)</option>
                        </select>
                      ) : (
                        <div className="inline-flex items-center gap-3 text-[11px]">
                          <span>YES [ {item.damage === 'YES' ? '✓' : ' '} ]</span>
                          <span>NO [ {item.damage !== 'YES' ? '✓' : ' '} ]</span>
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Remarks..."
                          value={item.remarks || ''}
                          onChange={(e) => handleBorrowItemChange(i, 'remarks', e.target.value)}
                          className="w-full bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.remarks || ''}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SECTION 2: Return Slip */}
        <div className="pt-4 pb-4">
          <div className="flex justify-between items-center pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded">
              Part 2: Return Slip (Handover)
            </h2>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddReturnItem}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Return Item</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3">
            <div className="space-y-1.5 font-bold text-slate-950">
              <div className="flex items-center">
                <span className="w-36 shrink-0 text-slate-900">Returned Date & Time:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY HH:MM"
                    value={data.returnDateTime || ''}
                    onChange={(e) => onFieldChange?.('returnDateTime', e.target.value)}
                    className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                    {data.returnDateTime || ''}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-36 shrink-0 text-slate-900">Borrower Full Name:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={data.borrowerName || ''}
                    onChange={(e) => onFieldChange?.('borrowerName', e.target.value)}
                    className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                    {data.borrowerName || ''}
                  </span>
                )}
              </div>
            </div>

            {/* Received by Box */}
            <div className="border border-slate-900 p-2.5 rounded bg-slate-50/70 print:bg-transparent flex flex-col justify-between">
              <span className="font-bold text-slate-950 text-xs">Received by (HELPDESK OFFICER):</span>
              {isEditable && !isBlankMode ? (
                <input
                  type="text"
                  placeholder="Receiver Name..."
                  value={data.receivedByHelpdesk || ''}
                  onChange={(e) => onFieldChange?.('receivedByHelpdesk', e.target.value)}
                  className="border-b border-slate-700 bg-blue-50/40 px-2 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              ) : (
                <div className="border-b border-slate-700 font-medium px-1 py-1 min-h-[24px] text-slate-900">
                  {data.receivedByHelpdesk || ''}
                </div>
              )}
            </div>
          </div>

          {/* Return Items Table */}
          <table className="w-full border-collapse border border-slate-900 text-left text-xs my-2">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-3 py-1.5">Item Description</th>
                <th className="border border-slate-900 px-2 py-1.5 w-24 text-center">Quantity</th>
                <th className="border border-slate-900 px-2 py-1.5 w-36 text-center">DAMAGE (YES/NO)</th>
                <th className="border border-slate-900 px-3 py-1.5 w-44">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: returnRows }, (_, i) => {
                const item = returnItemsList[i] || {};
                return (
                  <tr key={i} className="h-7 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-1 font-normal text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="e.g. Golf Club Set..."
                          value={item.description || ''}
                          onChange={(e) => handleReturnItemChange(i, 'description', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.description || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={item.qty || ''}
                          onChange={(e) => handleReturnItemChange(i, 'qty', e.target.value)}
                          className="w-full text-center bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none font-bold"
                        />
                      ) : (
                        <span>{item.qty || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-center font-normal">
                      {isEditable && !isBlankMode ? (
                        <select
                          value={item.damage || 'NO'}
                          onChange={(e) => handleReturnItemChange(i, 'damage', e.target.value)}
                          className="bg-transparent text-xs text-center font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="NO">NO (Good)</option>
                          <option value="YES">YES (Damaged)</option>
                        </select>
                      ) : (
                        <div className="inline-flex items-center gap-3 text-[11px]">
                          <span>YES [ {item.damage === 'YES' ? '✓' : ' '} ]</span>
                          <span>NO [ {item.damage !== 'YES' ? '✓' : ' '} ]</span>
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-800">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Remarks..."
                          value={item.remarks || ''}
                          onChange={(e) => handleReturnItemChange(i, 'remarks', e.target.value)}
                          className="w-full bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.remarks || ''}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stamp & Signature */}
      <div className="pt-4 flex justify-between items-center text-xs font-bold text-slate-950 border-t border-slate-300">
        <div>
          <span>Tamimi Recreation & Welfare Dept. (AMAALA 188)</span>
        </div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge
            type={data.officialStamp}
            signatory={data.issuedByHelpdesk || 'RECREATION SUPERVISOR'}
          />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface AssetsTransferFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const AssetsTransferForm: React.FC<AssetsTransferFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const itemsList = data.items || [];
  const rowsCount = isBlankMode ? 9 : Math.max(9, itemsList.length);

  const handleItemChange = (index: number, field: string, val: string) => {
    const updated = [...itemsList];
    while (updated.length <= index) {
      updated.push({ description: '', qty: '1', locationFrom: '', locationTo: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('items', updated);
    } else if (onFieldChange) {
      onFieldChange('items', updated);
    }
  };

  const handleAddItem = () => {
    const updated = [...itemsList, { description: '', qty: '1', locationFrom: '', locationTo: '' }];
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
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <TamimiLogo size={60} />
          <div className="text-center flex-1">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              Assets Transfer Form
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Internal Asset Relocation & Custody Transfer Voucher
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        {/* Issuer Info Block */}
        <div className="pt-4 pb-2 space-y-1.5 font-bold text-slate-950">
          <div className="flex items-center">
            <span className="w-32 shrink-0 text-slate-900">Issued Date:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="date"
                value={data.issuedDate || ''}
                onChange={(e) => onFieldChange?.('issuedDate', e.target.value)}
                className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                {data.issuedDate || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-32 shrink-0 text-slate-900">Issued Time:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="HH:MM"
                value={data.issuedTime || ''}
                onChange={(e) => onFieldChange?.('issuedTime', e.target.value)}
                className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                {data.issuedTime || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-32 shrink-0 text-slate-900">NAME & ID No.:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="Issuer Name & Badge ID"
                value={data.issuerNameId || ''}
                onChange={(e) => onFieldChange?.('issuerNameId', e.target.value)}
                className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none font-semibold"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                {data.issuerNameId || ''}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="my-3 overflow-x-auto">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 text-xs">Transferred Assets List:</span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddItem}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset Row</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border border-slate-900 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-2 py-2 w-14 text-center">Sr. No.</th>
                <th className="border border-slate-900 px-3 py-2">Item Description</th>
                <th className="border border-slate-900 px-2 py-2 w-16 text-center">Qty</th>
                <th className="border border-slate-900 px-3 py-2 w-36">Location From</th>
                <th className="border border-slate-900 px-3 py-2 w-36">Location TO</th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1 w-8 text-center print:hidden">Del</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsCount }, (_, i) => {
                const item = itemsList[i] || {};
                return (
                  <tr key={i} className="h-7 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-1 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 font-normal text-slate-900">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Asset Description..."
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.description || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-1 py-1 text-center text-slate-900 font-bold">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={item.qty || ''}
                          onChange={(e) => handleItemChange(i, 'qty', e.target.value)}
                          className="w-full text-center bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none font-bold"
                        />
                      ) : (
                        <span>{item.qty || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-800 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Source loc"
                          value={item.locationFrom || ''}
                          onChange={(e) => handleItemChange(i, 'locationFrom', e.target.value)}
                          className="w-full bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.locationFrom || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-800 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Target loc"
                          value={item.locationTo || ''}
                          onChange={(e) => handleItemChange(i, 'locationTo', e.target.value)}
                          className="w-full bg-transparent focus:bg-blue-50 px-1 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{item.locationTo || ''}</span>
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

        {/* Issuer Declaration & Signature */}
        <div className="py-2 space-y-2 border-b border-slate-300">
          <p className="text-[11px] italic text-slate-800 font-medium">
            <span className="font-bold not-italic">Declaration:</span> I do hereby declare that provided item/s is/are in good working conditions and free of any apparent damage.
          </p>
          <div className="flex justify-between items-center text-xs font-bold pt-1">
            <span>ISSUER SIGNATURE:</span>
            <span className="border-b border-slate-600 min-w-[200px] text-center italic font-serif text-slate-700">
              {data.issuerNameId ? `✓ ${data.issuerNameId.split(' ')[0]}` : '______________________'}
            </span>
          </div>
        </div>

        {/* Receiver Section */}
        <div className="pt-3 pb-2 space-y-1.5 font-bold text-slate-950">
          <div className="flex items-center">
            <span className="w-32 shrink-0 text-slate-900">Received Date:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="date"
                value={data.receivedDate || ''}
                onChange={(e) => onFieldChange?.('receivedDate', e.target.value)}
                className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                {data.receivedDate || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-32 shrink-0 text-slate-900">Received Time:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="HH:MM"
                value={data.receivedTime || ''}
                onChange={(e) => onFieldChange?.('receivedTime', e.target.value)}
                className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                {data.receivedTime || ''}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="w-32 shrink-0 text-slate-900">NAME & ID No.:</span>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="Receiver Name & ID"
                value={data.receiverNameId || ''}
                onChange={(e) => onFieldChange?.('receiverNameId', e.target.value)}
                className="flex-1 border-b border-slate-400 bg-blue-50/40 px-2 py-0.5 text-xs text-slate-900 focus:outline-none font-semibold"
              />
            ) : (
              <span className="flex-1 border-b border-slate-400 font-normal px-2 min-h-[20px] text-slate-900">
                {data.receiverNameId || ''}
              </span>
            )}
          </div>
        </div>

        {/* Receiver Declaration */}
        <div className="py-2 space-y-2">
          <p className="text-[11px] italic text-slate-800 font-medium">
            <span className="font-bold not-italic">Receiver Declaration:</span> I do hereby declare that I received the transferred item/s in good working condition.
          </p>
          <div className="flex justify-between items-center text-xs font-bold pt-1">
            <span>RECEIVER SIGNATURE:</span>
            <span className="border-b border-slate-600 min-w-[200px] text-center italic font-serif text-slate-700">
              {data.receiverNameId ? `✓ ${data.receiverNameId.split(' ')[0]}` : '______________________'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Stamp & Notes */}
      <div className="pt-4 flex justify-between items-center text-xs font-bold text-slate-950 border-t border-slate-300">
        <div>
          <span>Tamimi Assets & Logistics Control Section</span>
        </div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge
            type={data.officialStamp}
            signatory="ASSET LOGISTICS CONTROLLER"
            date={data.issuedDate}
          />
        )}
      </div>
    </div>
  );
};

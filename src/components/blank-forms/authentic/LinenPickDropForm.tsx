import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { LaundryLogo } from '../../LaundryLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';

interface LinenPickDropFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

const DEFAULT_LINEN_ITEMS = [
  'Bed Sheet (King)',
  'Bed Sheet (Twin)',
  'Duvet (King)',
  'Duvet (Twin)',
  'Duvet Cover (King)',
  'Duvet Cover (Twin)',
  'Pillow',
  'Pillow Cover',
  'Blanket',
  'Bath towel',
  'Hand Towel',
  'Bathmat',
  'Laundry bag',
];

export const LinenPickDropForm: React.FC<LinenPickDropFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const receivingList = data.receiving || [];
  const deliveryList = data.delivery || [];

  const handleReceivingChange = (index: number, field: string, val: string) => {
    const updated = [...receivingList];
    while (updated.length <= index) {
      updated.push({ item: DEFAULT_LINEN_ITEMS[updated.length] || '', qty: '', diff: '', damage: '', stain: '', status: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('receiving', updated);
    } else if (onFieldChange) {
      onFieldChange('receiving', updated);
    }
  };

  const handleDeliveryChange = (index: number, field: string, val: string) => {
    const updated = [...deliveryList];
    while (updated.length <= index) {
      updated.push({ item: DEFAULT_LINEN_ITEMS[updated.length] || '', qty: '', diff: '', damage: '', stain: '', status: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('delivery', updated);
    } else if (onFieldChange) {
      onFieldChange('delivery', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[1100px] mx-auto p-6 sm:p-8 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[750px] flex flex-col justify-between relative select-text">
      <div>
        {/* Landscape Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
          <div className="flex items-center space-x-2">
            <TamimiLogo size={58} />
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              LINEN PICK UP & DROP OFF REGISTER
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-slate-900 mt-1">
              <div className="flex items-center">
                <span>PICK UP DATE:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="date"
                    value={data.pickUpDate || ''}
                    onChange={(e) => onFieldChange?.('pickUpDate', e.target.value)}
                    className="border-b border-slate-600 bg-blue-50/40 ml-1 px-1 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="underline ml-1 font-normal">{data.pickUpDate || '______________'}</span>
                )}
              </div>

              <div className="flex items-center">
                <span>AREA / BLOCK:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Block A, B..."
                    value={data.area || ''}
                    onChange={(e) => onFieldChange?.('area', e.target.value)}
                    className="border-b border-slate-600 bg-blue-50/40 ml-1 px-1 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="underline ml-1 font-normal">{data.area || '______________'}</span>
                )}
              </div>

              <div className="flex items-center">
                <span>DELIVERY DATE:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="date"
                    value={data.deliveryDate || ''}
                    onChange={(e) => onFieldChange?.('deliveryDate', e.target.value)}
                    className="border-b border-slate-600 bg-blue-50/40 ml-1 px-1 py-0.5 text-xs text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="underline ml-1 font-normal">{data.deliveryDate || '______________'}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <LaundryLogo size={44} />
          </div>
        </div>

        {/* Dual Side-by-Side Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-3">
          {/* LEFT TABLE: LINEN RECEIVING */}
          <div className="border border-slate-900 rounded p-2.5 bg-white">
            <div className="font-bold text-center text-xs pb-1.5 border-b border-slate-900 text-slate-950 uppercase tracking-wider bg-slate-100 print:bg-transparent">
              1. LINEN RECEIVING (COLLECTION)
            </div>
            <table className="w-full border-collapse border border-slate-800 text-left text-[10px] mt-1.5">
              <thead>
                <tr className="bg-slate-50 print:bg-transparent font-bold border-b border-slate-800 text-slate-950">
                  <th className="border border-slate-800 px-1 py-1 w-6 text-center">SN</th>
                  <th className="border border-slate-800 px-2 py-1">Description</th>
                  <th className="border border-slate-800 px-1 py-1 w-14 text-center">Qty rec.</th>
                  <th className="border border-slate-800 px-1 py-1 w-10 text-center">Diff</th>
                  <th className="border border-slate-800 px-1 py-1 w-12 text-center">Damage</th>
                  <th className="border border-slate-800 px-1 py-1 w-10 text-center">Stain</th>
                  <th className="border border-slate-800 px-1 py-1 w-14 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_LINEN_ITEMS.map((item, idx) => {
                  const row = receivingList[idx] || {};
                  return (
                    <tr key={idx} className="h-5 border-b border-slate-700 hover:bg-slate-50/50">
                      <td className="border border-slate-800 text-center font-bold text-slate-900">{idx + 1}</td>
                      <td className="border border-slate-800 px-1.5 font-medium text-slate-900">{row.item || item}</td>
                      <td className="border border-slate-800 text-center font-bold text-slate-900">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.qty || ''}
                            onChange={(e) => handleReceivingChange(idx, 'qty', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none font-bold"
                          />
                        ) : (
                          <span>{row.qty || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.diff || ''}
                            onChange={(e) => handleReceivingChange(idx, 'diff', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.diff || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.damage || ''}
                            onChange={(e) => handleReceivingChange(idx, 'damage', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.damage || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.stain || ''}
                            onChange={(e) => handleReceivingChange(idx, 'stain', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.stain || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.status || ''}
                            onChange={(e) => handleReceivingChange(idx, 'status', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.status || ''}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Left Signatures */}
            <div className="pt-2 space-y-1 text-[10px] font-bold text-slate-900 border-t border-slate-400 mt-2">
              <div className="flex items-center">
                <span className="w-48 shrink-0">Linen delivered by Housekeeping:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Name"
                    value={data.recHkName || ''}
                    onChange={(e) => onFieldChange?.('recHkName', e.target.value)}
                    className="flex-1 border-b border-slate-600 bg-blue-50/30 px-1 text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-600 font-normal px-1 text-slate-900">{data.recHkName || ''}</span>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-48 shrink-0">Linen received by Laundry:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Name"
                    value={data.recLaundryName || ''}
                    onChange={(e) => onFieldChange?.('recLaundryName', e.target.value)}
                    className="flex-1 border-b border-slate-600 bg-blue-50/30 px-1 text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-600 font-normal px-1 text-slate-900">{data.recLaundryName || ''}</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT TABLE: LINEN DROP OFF */}
          <div className="border border-slate-900 rounded p-2.5 bg-white">
            <div className="font-bold text-center text-xs pb-1.5 border-b border-slate-900 text-slate-950 uppercase tracking-wider bg-slate-100 print:bg-transparent">
              2. LINEN DROP OFF (DELIVERY)
            </div>
            <table className="w-full border-collapse border border-slate-800 text-left text-[10px] mt-1.5">
              <thead>
                <tr className="bg-slate-50 print:bg-transparent font-bold border-b border-slate-800 text-slate-950">
                  <th className="border border-slate-800 px-1 py-1 w-6 text-center">SN</th>
                  <th className="border border-slate-800 px-2 py-1">Description</th>
                  <th className="border border-slate-800 px-1 py-1 w-14 text-center">Qty del.</th>
                  <th className="border border-slate-800 px-1 py-1 w-10 text-center">Diff</th>
                  <th className="border border-slate-800 px-1 py-1 w-12 text-center">Damage</th>
                  <th className="border border-slate-800 px-1 py-1 w-10 text-center">Stain</th>
                  <th className="border border-slate-800 px-1 py-1 w-14 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_LINEN_ITEMS.map((item, idx) => {
                  const row = deliveryList[idx] || {};
                  return (
                    <tr key={idx} className="h-5 border-b border-slate-700 hover:bg-slate-50/50">
                      <td className="border border-slate-800 text-center font-bold text-slate-900">{idx + 1}</td>
                      <td className="border border-slate-800 px-1.5 font-medium text-slate-900">{row.item || item}</td>
                      <td className="border border-slate-800 text-center font-bold text-slate-900">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.qty || ''}
                            onChange={(e) => handleDeliveryChange(idx, 'qty', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none font-bold"
                          />
                        ) : (
                          <span>{row.qty || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.diff || ''}
                            onChange={(e) => handleDeliveryChange(idx, 'diff', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.diff || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.damage || ''}
                            onChange={(e) => handleDeliveryChange(idx, 'damage', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.damage || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.stain || ''}
                            onChange={(e) => handleDeliveryChange(idx, 'stain', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.stain || ''}</span>
                        )}
                      </td>
                      <td className="border border-slate-800 text-center text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.status || ''}
                            onChange={(e) => handleDeliveryChange(idx, 'status', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-blue-50 focus:outline-none"
                          />
                        ) : (
                          <span>{row.status || ''}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Right Signatures */}
            <div className="pt-2 space-y-1 text-[10px] font-bold text-slate-900 border-t border-slate-400 mt-2">
              <div className="flex items-center">
                <span className="w-48 shrink-0">Linen returned by Laundry:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Name"
                    value={data.delLaundryName || ''}
                    onChange={(e) => onFieldChange?.('delLaundryName', e.target.value)}
                    className="flex-1 border-b border-slate-600 bg-blue-50/30 px-1 text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-600 font-normal px-1 text-slate-900">{data.delLaundryName || ''}</span>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-48 shrink-0">Linen accepted by Housekeeping:</span>
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    placeholder="Name"
                    value={data.delHkName || ''}
                    onChange={(e) => onFieldChange?.('delHkName', e.target.value)}
                    className="flex-1 border-b border-slate-600 bg-blue-50/30 px-1 text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 border-b border-slate-600 font-normal px-1 text-slate-900">{data.delHkName || ''}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
        <div>Tamimi Commercial Laundry & Housekeeping Linen Logistics Record (Loc 188)</div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge type={data.officialStamp} signatory="LAUNDRY OPERATIONS LEAD" />
        )}
      </div>
    </div>
  );
};

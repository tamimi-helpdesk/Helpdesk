import React, { useState } from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { RedSeaLogo } from '../../RedSeaLogo';
import { BlankFromService } from '../../../services/blankFromService';
import { BlankFromRow } from '../../../data/initialBlankFromData';
import { Search } from 'lucide-react';

export type ClearanceFormVariant = 'worker' | 'senior';

export interface AccommodationClearanceFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  variant?: ClearanceFormVariant;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const WORKER_CLEARANCE_ITEMS = [
  'Bed',
  'Mattress',
  'Pillow/Pillow Case',
  'Bedsheet',
  'Blanket',
  'Steel Rack & Key',
  'Lamp',
  'Window Curtain',
  'BMS Charger',
  'BMS Charger Wire',
  'BMS Controller',
  'AC Remote',
  'BMS DHL',
];

export const SENIOR_CLEARANCE_ITEMS = [
  'Bed /Matteress',
  'Bed Sheet /Duvet/Pillow',
  'Towel',
  'Laundry Bag',
  'Wardrobe',
  'Study Table with Chair',
  'Side Table With Lamps',
  'Ac &Ac Remote',
  'IP Phone',
  'Coffee Table',
  'Study Lamp',
  'Tv & TV Remote',
  'Coffee Maker',
  'Kettle',
  'Sofa with Back Rest Pillow',
];

export const AccommodationClearanceForm: React.FC<AccommodationClearanceFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  variant = 'worker',
  onFieldChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const items = variant === 'senior' ? SENIOR_CLEARANCE_ITEMS : WORKER_CLEARANCE_ITEMS;

  // Auto-fill search helper for resident records
  const [residentQuery, setResidentQuery] = useState('');
  const [showResidentSuggestions, setShowResidentSuggestions] = useState(false);
  const [residentResults, setResidentResults] = useState<BlankFromRow[]>([]);

  const handleResidentSearch = (val: string) => {
    setResidentQuery(val);
    if (!val.trim()) {
      setResidentResults([]);
      setShowResidentSuggestions(false);
      return;
    }
    const matches = BlankFromService.searchRows(val).slice(0, 5);
    setResidentResults(matches);
    setShowResidentSuggestions(matches.length > 0);
  };

  const handleSelectResident = (res: BlankFromRow) => {
    if (!onFieldChange) return;
    onFieldChange('residentName', res.name || '');
    onFieldChange('companyId', res.employmentId || res.idIqama || '');
    onFieldChange('contactNumber', res.mobile || '');
    onFieldChange('companyName', res.company || 'Red Sea Global');
    onFieldChange('buildingNo', res.buildingNo || res.house || '');
    onFieldChange('roomNo', res.unitNo || res.room || '');
    onFieldChange('floorNo', res.floor || '1');
    setResidentQuery('');
    setShowResidentSuggestions(false);
  };

  // Item status change helper (clicking an active option unchecks/toggles it off)
  const handleItemStatus = (itemIndex: number, status: 'YES' | 'NO' | 'NP') => {
    if (!onFieldChange) return;
    const currentStatuses = { ...(data.itemStatuses || {}) };
    if (currentStatuses[itemIndex] === status) {
      delete currentStatuses[itemIndex];
    } else {
      currentStatuses[itemIndex] = status;
    }
    onFieldChange('itemStatuses', currentStatuses);
  };

  const itemStatuses = data.itemStatuses || {};

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
          {/* Left: Tamimi Logo */}
          <div className="w-24 sm:w-28 shrink-0 flex items-center justify-start">
            <TamimiLogo size={58} />
          </div>

          {/* Center: Title & Subtitle */}
          <div className="text-center flex-1 px-2 sm:px-4">
            <h1 className="text-base sm:text-lg font-bold font-sans tracking-wider text-slate-950 uppercase">
              AMAALA -TBCV
            </h1>
            <div className="bg-[#4882b8] text-white font-bold text-center py-1 px-3 text-xs sm:text-sm tracking-wide mt-1 shadow-xs">
              Accommodation Clearance Form
            </div>
          </div>

          {/* Right: Red Sea Global Logo */}
          <div className="w-28 sm:w-32 shrink-0 flex items-center justify-end">
            <RedSeaLogo height={46} className="h-10 sm:h-12 w-auto object-contain" />
          </div>
        </div>

        {/* Date Field (Aligned Left with blank line) */}
        <div className="pt-2 pb-2 text-xs font-bold text-slate-950 flex items-center">
          <span>Date:</span>
          {isEditable && !isBlankMode ? (
            <input
              type="text"
              value={data.date || ''}
              onChange={(e) => onFieldChange?.('date', e.target.value)}
              placeholder="DD/MM/YYYY or YYYY-MM-DD"
              className="border-b border-black bg-blue-50/50 hover:bg-blue-50 px-2 py-0.5 ml-1 min-w-[200px] font-normal text-xs text-slate-900 focus:outline-none"
            />
          ) : (
            <span className="font-normal inline-block min-w-[200px] border-b border-black text-left ml-1 pb-0.5">
              {data.date || '____________________________'}
            </span>
          )}

          {/* Quick Auto-Fill helper in edit mode */}
          {isEditable && !isBlankMode && (
            <div className="ml-auto relative print:hidden">
              <div className="flex items-center space-x-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <input
                  type="text"
                  placeholder="Auto-fill by resident name/ID..."
                  value={residentQuery}
                  onChange={(e) => handleResidentSearch(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none w-44"
                />
              </div>

              {showResidentSuggestions && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-300 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {residentResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectResident(res)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 cursor-pointer flex flex-col"
                    >
                      <span className="font-bold text-slate-900">{res.name}</span>
                      <span className="text-[10px] text-slate-500">
                        ID: {res.employmentId} | Room: {res.unitNo || res.room} ({res.buildingNo || res.house})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resident & Accommodation Metadata Table */}
        <table className="w-full border-collapse border border-black text-xs font-sans mb-0">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 w-44 sm:w-48 bg-white">
                Name Of The Resident
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 font-normal text-slate-900">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.residentName || ''}
                    onChange={(e) => onFieldChange?.('residentName', e.target.value)}
                    placeholder="Resident Full Name"
                    className="w-full bg-blue-50/30 px-1 py-0.5 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.residentName || ''}</span>
                )}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 bg-white">
                Company ID
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 font-normal text-slate-900">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.companyId || ''}
                    onChange={(e) => onFieldChange?.('companyId', e.target.value)}
                    placeholder="e.g. TM-10492 / 24190871"
                    className="w-full bg-blue-50/30 px-1 py-0.5 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.companyId || ''}</span>
                )}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 bg-white">
                Contact Number
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 font-normal text-slate-900">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.contactNumber || ''}
                    onChange={(e) => onFieldChange?.('contactNumber', e.target.value)}
                    placeholder="e.g. +966 5X XXX XXXX"
                    className="w-full bg-blue-50/30 px-1 py-0.5 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.contactNumber || ''}</span>
                )}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 bg-white">
                Name Of The Company
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 font-normal text-slate-900">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.companyName || ''}
                    onChange={(e) => onFieldChange?.('companyName', e.target.value)}
                    placeholder="e.g. Red Sea Global / Tamimi Global"
                    className="w-full bg-blue-50/30 px-1 py-0.5 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.companyName || ''}</span>
                )}
              </td>
            </tr>

            {/* Accommodation detail with 6 split columns */}
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 bg-white">
                Accommodation detail
              </td>
              <td className="border border-black px-2 py-1 font-bold text-slate-950 text-center w-20 sm:w-24">
                Building #
              </td>
              <td className="border border-black px-2 py-1 text-center font-normal w-16 sm:w-20">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.buildingNo || ''}
                    onChange={(e) => onFieldChange?.('buildingNo', e.target.value)}
                    placeholder="Bldg #"
                    className="w-full text-center bg-blue-50/30 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.buildingNo || ''}</span>
                )}
              </td>
              <td className="border border-black px-2 py-1 font-bold text-slate-950 text-center w-16 sm:w-20">
                Room #
              </td>
              <td className="border border-black px-2 py-1 text-center font-normal w-16 sm:w-20">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.roomNo || ''}
                    onChange={(e) => onFieldChange?.('roomNo', e.target.value)}
                    placeholder="Room #"
                    className="w-full text-center bg-blue-50/30 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.roomNo || ''}</span>
                )}
              </td>
              <td className="border border-black px-2 py-1 font-bold text-slate-950 text-center w-16 sm:w-20">
                Floor #
              </td>
              <td className="border border-black px-2 py-1 text-center font-normal w-16 sm:w-20">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.floorNo || ''}
                    onChange={(e) => onFieldChange?.('floorNo', e.target.value)}
                    placeholder="Floor #"
                    className="w-full text-center bg-blue-50/30 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.floorNo || ''}</span>
                )}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 bg-white">
                Check In Date
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 font-normal text-slate-900">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.checkInDate || ''}
                    onChange={(e) => onFieldChange?.('checkInDate', e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-blue-50/30 px-1 py-0.5 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.checkInDate || ''}</span>
                )}
              </td>
            </tr>

            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-slate-950 bg-white">
                Check Out Date
              </td>
              <td colSpan={6} className="border border-black px-2 py-1 font-normal text-slate-900">
                {isEditable && !isBlankMode ? (
                  <input
                    type="text"
                    value={data.checkOutDate || ''}
                    onChange={(e) => onFieldChange?.('checkOutDate', e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-blue-50/30 px-1 py-0.5 focus:outline-none text-xs"
                  />
                ) : (
                  <span>{data.checkOutDate || ''}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section Bar: Hand Over Detail */}
        <div className="bg-[#4882b8] text-white font-bold text-center py-1 text-xs sm:text-sm tracking-wide border-x border-b border-black">
          Hand Over Detail
        </div>

        {/* Hand Over Detail Checklist Table */}
        <table className="w-full border-collapse border-x border-b border-black text-xs text-center font-sans">
          <thead>
            <tr className="bg-[#4882b8] text-white">
              <th rowSpan={2} className="border border-black p-1.5 font-bold w-32 sm:w-36 align-middle">
                Title
              </th>
              <th rowSpan={2} className="border border-black p-1.5 font-bold w-44 sm:w-48 align-middle">
                Description
              </th>
              <th colSpan={2} className="border border-black p-1 font-bold">
                Hand Over Confirmation
              </th>
              <th rowSpan={1} className="border border-black p-1 font-bold w-12 sm:w-14">
                Not Provided
              </th>
              <th
                rowSpan={2}
                className="border border-black p-1.5 font-bold w-28 sm:w-32 align-middle leading-tight"
              >
                Confirmed By Area Hk Supervisor
              </th>
              <th rowSpan={2} className="border border-black p-1.5 font-bold w-24 sm:w-28 align-middle">
                Sign
              </th>
            </tr>
            <tr className="bg-[#4882b8] text-white">
              <th className="border border-black p-1 font-bold w-11 sm:w-12">Yes</th>
              <th className="border border-black p-1 font-bold w-11 sm:w-12">No</th>
              <th className="border border-black p-1 font-bold w-12 sm:w-14">N/P</th>
            </tr>
          </thead>
          <tbody>
            {items.map((itemName, index) => {
              const currentStatus = itemStatuses[index];

              return (
                <tr key={index} className="hover:bg-slate-50/50">
                  {/* Left Title Column: Single merged blue cell spanning all rows */}
                  {index === 0 && (
                    <td
                      rowSpan={items.length}
                      className="border border-black bg-[#4882b8] text-white font-bold p-2 text-center align-middle"
                    >
                      <div className="text-xs sm:text-sm tracking-wide leading-snug">
                        Accommodation
                        <br />
                        Housing
                      </div>
                    </td>
                  )}

                  {/* Description Item */}
                  <td className="border border-black px-2 py-1 font-bold text-slate-900 text-center text-xs">
                    {itemName}
                  </td>

                  {/* Yes confirmation */}
                  <td
                    onClick={() => isEditable && !isBlankMode && handleItemStatus(index, 'YES')}
                    className={`border border-black p-1 text-center font-bold text-xs ${
                      isEditable && !isBlankMode ? 'cursor-pointer hover:bg-emerald-50' : ''
                    }`}
                  >
                    {!isBlankMode && currentStatus === 'YES' && (
                      <span className="text-emerald-700 font-extrabold">✓</span>
                    )}
                  </td>

                  {/* No confirmation */}
                  <td
                    onClick={() => isEditable && !isBlankMode && handleItemStatus(index, 'NO')}
                    className={`border border-black p-1 text-center font-bold text-xs ${
                      isEditable && !isBlankMode ? 'cursor-pointer hover:bg-rose-50' : ''
                    }`}
                  >
                    {!isBlankMode && currentStatus === 'NO' && (
                      <span className="text-rose-700 font-extrabold">✓</span>
                    )}
                  </td>

                  {/* N/P Not Provided confirmation */}
                  <td
                    onClick={() => isEditable && !isBlankMode && handleItemStatus(index, 'NP')}
                    className={`border border-black p-1 text-center font-bold text-xs ${
                      isEditable && !isBlankMode ? 'cursor-pointer hover:bg-amber-50' : ''
                    }`}
                  >
                    {!isBlankMode && currentStatus === 'NP' && (
                      <span className="text-amber-700 font-extrabold">✓</span>
                    )}
                  </td>

                  {/* Confirmed By Area Hk Supervisor (Spans all rows as a large empty box) */}
                  {index === 0 && (
                    <td
                      rowSpan={items.length}
                      className="border border-black p-2 align-middle text-center bg-white text-slate-800"
                    >
                      {isEditable && !isBlankMode ? (
                        <textarea
                          value={data.supervisorRemarks || ''}
                          onChange={(e) => onFieldChange?.('supervisorRemarks', e.target.value)}
                          placeholder="Supervisor endorsement / inspection remarks..."
                          className="w-full h-44 bg-transparent border-none text-[11px] text-center resize-none focus:outline-none"
                        />
                      ) : (
                        <span className="text-[11px] italic text-slate-600 block">
                          {data.supervisorRemarks || ''}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Sign (Spans all rows as an empty signature/stamp box) */}
                  {index === 0 && (
                    <td
                      rowSpan={items.length}
                      className="border border-black p-2 align-middle text-center bg-white"
                    >
                      {isEditable && !isBlankMode && data.supervisorSignature ? (
                        <div className="font-serif italic text-xs text-blue-900 border-b border-blue-400 pb-1">
                          {data.supervisorSignature}
                        </div>
                      ) : null}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Declaration & Rules Text */}
        <div className="mt-4 space-y-1 text-[11px] sm:text-xs font-semibold text-slate-950 leading-tight">
          <p>All Personal Belonging are being clear from the accommodation.</p>
          <p>The accommodation is in a clean and tidy condition</p>
          <p>All Keys Laundry Bags and IDs,Should be Returned/ Submitted to the accommodation /helpdesk Team</p>
          <p>If any damage to the Accommodation,It has to be report Immediately to the concerned Supervisor and Accommodation Team.</p>
          <p className="pt-2 font-bold text-slate-950 text-xs">
            Note : Any Damage and Missing Items Will back Charged to the Company / Occupant
          </p>
        </div>
      </div>

      {/* Bottom Signatures Section */}
      <div className="mt-8 pt-4 flex items-center justify-between text-xs font-bold text-slate-950">
        {/* Left: Help Desk Employee */}
        <div className="text-left w-56 sm:w-64 space-y-7">
          <div>
            {variant === 'senior' ? 'Help Desk Employee Sign' : 'Help Desk Employee'}
          </div>
          <div className="text-[11px] font-normal text-slate-800">
            Signature____________________
          </div>
        </div>

        {/* Right: Housing Manager */}
        <div className="text-right w-56 sm:w-64 space-y-7">
          <div>Housing Manager</div>
          <div className="text-[11px] font-normal text-slate-800">
            Signature____________________
          </div>
        </div>
      </div>
    </div>
  );
};

export const AccommodationClearanceWorkerForm: React.FC<AccommodationClearanceFormProps> = (props) => (
  <AccommodationClearanceForm {...props} variant="worker" />
);

export const AccommodationClearanceSeniorForm: React.FC<AccommodationClearanceFormProps> = (props) => (
  <AccommodationClearanceForm {...props} variant="senior" />
);

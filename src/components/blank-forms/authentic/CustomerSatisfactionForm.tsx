import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';

interface CustomerSatisfactionFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

const SERVICES = [
  'Maintenance Services',
  'Housekeeping Services',
  'Laundry Services',
  'Helpdesk/Accommodation',
  'Pest Control Service',
  'Transportation Service',
];

export const CustomerSatisfactionForm: React.FC<CustomerSatisfactionFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
}) => {
  const data = isBlankMode ? {} : formData;

  const handleRatingChange = (service: string, ratingValue: string) => {
    const currentRatings = data.ratings || {};
    onFieldChange?.('ratings', {
      ...currentRatings,
      [service]: ratingValue,
    });
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              TBCVH Customer Satisfaction Survey
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Tamimi Global Co. Ltd. — Quality Assurance &amp; Guest Experience Feedback
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        <div className="border-b-2 border-slate-900 mb-3" />

        {/* Date */}
        <div className="flex justify-end items-center mb-3 font-bold text-slate-900">
          <span>Date:</span>
          {isEditable && !isBlankMode ? (
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => onFieldChange?.('date', e.target.value)}
              className="border-b-2 border-blue-500 bg-blue-50/50 px-2 py-0.5 ml-2 min-w-[140px] font-normal text-xs text-slate-900 focus:outline-none"
            />
          ) : (
            <span className="border-b border-slate-600 ml-2 px-3 py-0.5 min-w-[140px] text-center font-normal">
              {data.date || '------------------'}
            </span>
          )}
        </div>

        {/* Guest and Company Table */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-2 font-bold w-40 bg-slate-100 print:bg-transparent text-slate-950">
                  Company Name
                </td>
                <td className="border border-slate-900 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={data.companyName || ''}
                      onChange={(e) => onFieldChange?.('companyName', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.companyName || ''}</span>
                  )}
                </td>
                <td className="border border-slate-900 p-2 font-bold w-36 bg-slate-100 print:bg-transparent text-slate-950">
                  Guest Name
                </td>
                <td className="border border-slate-900 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Guest Name"
                      value={data.guestName || ''}
                      onChange={(e) => onFieldChange?.('guestName', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.guestName || ''}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Company / Iqama ID
                </td>
                <td className="border border-slate-900 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="ID"
                      value={data.companyIqamaId || ''}
                      onChange={(e) => onFieldChange?.('companyIqamaId', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.companyIqamaId || ''}</span>
                  )}
                </td>
                <td className="border border-slate-900 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Location / Room No.
                </td>
                <td className="border border-slate-900 p-2 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Room"
                      value={data.roomNo || ''}
                      onChange={(e) => onFieldChange?.('roomNo', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.roomNo || ''}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6 Assessment Categories */}
        <div className="space-y-2.5">
          {SERVICES.map((service, index) => {
            const rating = data.ratings?.[service];
            return (
              <div key={index} className="border border-slate-900 p-2.5 rounded bg-slate-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 pr-3">
                    <h3 className="font-bold text-xs text-slate-950">{index + 1}. {service}</h3>
                    <p className="text-[10px] text-slate-600 italic mt-0.5 leading-tight">
                      Please rate the responsiveness, professionalism, and quality standard of our service:
                    </p>
                  </div>
                  {/* Emoji Rating Options */}
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-900">
                    <label
                      onClick={() => isEditable && handleRatingChange(service, 'POOR')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border border-slate-300 transition ${isEditable ? 'cursor-pointer' : ''} ${rating === 'POOR' ? 'bg-red-100 border-red-500 font-black ring-1 ring-red-500' : 'bg-white'}`}
                    >
                      <span className="text-sm">😞</span>
                      <span>Poor</span>
                      <span className="text-[10px] text-slate-400">[{rating === 'POOR' ? '✓' : ' '}]</span>
                    </label>

                    <label
                      onClick={() => isEditable && handleRatingChange(service, 'NEUTRAL')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border border-slate-300 transition ${isEditable ? 'cursor-pointer' : ''} ${rating === 'NEUTRAL' ? 'bg-amber-100 border-amber-500 font-black ring-1 ring-amber-500' : 'bg-white'}`}
                    >
                      <span className="text-sm">😐</span>
                      <span>Neutral</span>
                      <span className="text-[10px] text-slate-400">[{rating === 'NEUTRAL' ? '✓' : ' '}]</span>
                    </label>

                    <label
                      onClick={() => isEditable && handleRatingChange(service, 'EXCELLENT')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border border-slate-300 transition ${isEditable ? 'cursor-pointer' : ''} ${rating === 'EXCELLENT' ? 'bg-emerald-100 border-emerald-500 font-black ring-1 ring-emerald-500' : 'bg-white'}`}
                    >
                      <span className="text-sm">😊</span>
                      <span>Excellent</span>
                      <span className="text-[10px] text-slate-400">[{rating === 'EXCELLENT' ? '✓' : ' '}]</span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guest Feedback & Suggestions */}
        <div className="mt-3">
          <div className="font-bold text-xs text-slate-950 mb-1">
            General Feedback / Suggestions for Improvement:
          </div>
          {isEditable && !isBlankMode ? (
            <textarea
              rows={2}
              placeholder="Your valuable suggestions..."
              value={data.suggestions || ''}
              onChange={(e) => onFieldChange?.('suggestions', e.target.value)}
              className="w-full border border-slate-400 bg-blue-50/30 p-2 text-xs focus:outline-none rounded"
            />
          ) : (
            <div className="border border-slate-400 p-2 min-h-[44px] text-xs font-normal text-slate-800 leading-relaxed">
              {data.suggestions || ''}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stamp & Sign */}
      <div className="pt-4 flex justify-between items-center text-xs font-bold text-slate-950 border-t border-slate-300">
        <div>
          <span>Tamimi Hospitality & Guest Experience Dept.</span>
        </div>
        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <OfficialStampBadge
            type={data.officialStamp}
            signatory="QA / GUEST RELATIONS"
            date={data.date}
          />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { MissingItemsInvoiceRecord } from '../../types/invoice';
import { TAMIMI_LOGO_DATA_URL } from '../TamimiLogo';

interface MissingItemsPrintLayoutProps {
  invoice: MissingItemsInvoiceRecord;
}

export const MissingItemsPrintLayout: React.FC<MissingItemsPrintLayoutProps> = ({
  invoice,
}) => {
  return (
    <div className="bg-white text-slate-950 p-4 max-w-[210mm] mx-auto text-[11px] font-sans leading-normal print:p-0 print:m-0 print:max-w-none print:w-full select-text min-h-[275mm] flex flex-col justify-between">
      <div>
        {/* Top Header with Tamimi Global Branding (Exact Login Page Logo) */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2.5">
          {/* Left: Tamimi Official Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <img
              src={TAMIMI_LOGO_DATA_URL}
              alt="Tamimi Global Logo"
              className="h-14 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span className="text-[13px] font-black tracking-tight text-slate-900 uppercase leading-none">
                TAMIMI GLOBAL
              </span>
              <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-widest mt-1">
                TAFGA • CAMP OPS
              </span>
              <span className="text-[9px] text-slate-500 font-serif mt-0.5">
                شركة التميمي العالمية
              </span>
            </div>
          </div>

          {/* Center: Title */}
          <div className="text-center flex-1 px-4">
            <div className="text-[17px] font-black tracking-wider text-slate-950 uppercase">
              FACILITIES DEPARTMENT
            </div>
            <div className="text-[12.5px] font-bold text-slate-800 tracking-wide mt-0.5">
              Charges for Missing Items Form
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
              Tamimi Global Company (TAFGA) • {invoice.facilities || 'TBCV'} Facilities
            </div>
          </div>

          {/* Right: Invoice Reference Badge */}
          <div className="text-right text-[10.5px] font-mono shrink-0">
            <div className="px-3 py-1 bg-slate-900 text-white font-black text-[11px] tracking-wide rounded-xs">
              INVOICE # {invoice.invoiceNumber.replace('INV-MI-', '') || invoice.date}
            </div>
            <div className="text-[10px] font-bold text-slate-700 mt-1">
              CAMP: {invoice.facilities || 'TBCV'}
            </div>
            <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
              Date: {invoice.date || new Date().toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        {/* Employee & Resident Information Section */}
        <div className="border border-slate-900 rounded-none p-2.5 mb-2.5 bg-slate-50/70 text-[11.5px]">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-300">
            <div className="font-bold text-slate-900 text-[12px]">
              Employee Information:{' '}
              <span className="font-black text-slate-950 underline decoration-slate-400 underline-offset-2">
                {invoice.roomNumber} {invoice.employeeName}
                {invoice.employeeId ? ` (${invoice.employeeId})` : ''}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-800">
              Room Ref: <span className="font-mono text-slate-950 font-black px-2 py-0.5 bg-white border border-slate-400">{invoice.roomNumber}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11.5px]">
            <div>
              <span className="font-bold text-slate-700">Company : </span>
              <span className="font-semibold text-slate-900">{invoice.company || 'Al-Ayuni'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Facilities : </span>
              <span className="font-semibold text-slate-900">{invoice.facilities || 'TBCV'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">POC Name : </span>
              <span className="font-semibold text-slate-900">{invoice.pocName || 'Naveeth'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Mobile : </span>
              <span className="font-semibold text-slate-900 font-mono">{invoice.mobile || '0536148530'}</span>
            </div>
          </div>

          {/* Employee Status & Classification Checkboxes */}
          <div className="pt-1.5 mt-1.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">Status:</span>
              {(
                [
                  { id: 'PERMANENT', label: 'Permanent' },
                  { id: 'TEMPORARY', label: 'Temporary' },
                  { id: 'CONTACT', label: 'Contact' },
                  { id: 'CONTRACTOR', label: 'Contractor' },
                ] as const
              ).map((st) => (
                <span key={st.id} className="inline-flex items-center space-x-0.5">
                  <span className="font-mono font-black text-slate-950">
                    [{invoice.employeeStatus === st.id ? '✓' : ' '}]
                  </span>
                  <span className={invoice.employeeStatus === st.id ? 'font-bold text-slate-950' : 'text-slate-700'}>
                    {st.label}
                  </span>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">Class:</span>
              {(
                [
                  { id: 'ADMINISTRATOR', label: 'Admin' },
                  { id: 'STAFF', label: 'Staff' },
                  { id: 'FACULTY', label: 'Faculty' },
                  { id: 'CONTRACTOR', label: 'Contractor' },
                ] as const
              ).map((cl) => (
                <span key={cl.id} className="inline-flex items-center space-x-0.5">
                  <span className="font-mono font-black text-slate-950">
                    [{invoice.classification === cl.id ? '✓' : ' '}]
                  </span>
                  <span className={invoice.classification === cl.id ? 'font-bold text-slate-950' : 'text-slate-700'}>
                    {cl.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Missing Items Table (Scaled with Comfortable Padding to Fill Page) */}
        <div className="w-full mb-2.5">
          <table className="w-full border-collapse border border-slate-900 text-[11px]">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-black">
                <th className="border border-slate-800 px-3 py-1.5 text-left w-52">Missing Items</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-16">Quantity</th>
                <th className="border border-slate-800 px-3 py-1.5 text-right w-24">Charges Amount</th>
                <th className="border border-slate-800 px-3 py-1.5 text-right w-24">Amount</th>
                <th className="border border-slate-800 px-3 py-1.5 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const isHighlight = item.quantity > 0 || (item.amount && item.amount > 0);
                return (
                  <tr
                    key={item.id || idx}
                    className={isHighlight ? 'bg-blue-50/90 font-bold text-slate-950' : 'bg-white text-slate-900'}
                  >
                    <td className="border border-slate-500 px-3 py-1 font-medium">
                      {item.name}
                    </td>
                    <td className="border border-slate-500 px-2 py-1 text-center font-bold font-mono text-[11.5px]">
                      {item.quantity || 0}
                    </td>
                    <td className="border border-slate-500 px-3 py-1 text-right font-mono">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-slate-500 px-3 py-1 text-right font-mono font-bold">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="border border-slate-500 px-3 py-1 text-[9.5px] text-slate-800 whitespace-pre-line font-mono leading-tight">
                      {item.remarks || ''}
                    </td>
                  </tr>
                );
              })}

              {/* Total Amount SAR Row */}
              <tr className="bg-slate-100 font-black text-[12px] border-t-2 border-slate-900">
                <td colSpan={3} className="border border-slate-900 px-3 py-2 text-right uppercase tracking-wider text-slate-950">
                  Total Amount SAR
                </td>
                <td className="border border-slate-900 px-3 py-2 text-right font-mono text-[13px] text-slate-950 font-black">
                  {invoice.totalAmount.toFixed(2)}
                </td>
                <td className="border border-slate-900 px-3 py-2 text-[11px] font-black text-slate-900">
                  {invoice.paymentStatus === 'PAID'
                    ? '★ PAID AT DESK'
                    : invoice.paymentStatus === 'DEDUCT_FROM_SALARY'
                    ? '★ DEDUCT FROM SALARY'
                    : '★ PENDING SETTLEMENT'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Condition Of Issue & Two-Party Spacious Signature Section */}
        <div className="border border-slate-900 p-2.5 bg-slate-50/70 space-y-2">
          {/* Conditions Text */}
          <div className="text-[10px] leading-relaxed text-slate-800 border-b border-slate-300 pb-1.5 font-medium">
            <div className="font-black text-slate-950 text-[11px] uppercase tracking-wide mb-0.5">
              Condition Of Issue &amp; Policy Acknowledgment
            </div>
            <div>• I am accepting the above charges and acknowledge that all items were verified before checkout clearance.</div>
            <div>• All items must be surrendered and complete before proceeding for room clearance. All missing items are charged as per Tamimi Global Company Policies.</div>
          </div>

          {/* Spacious 2-Party Signature & Official Stamp Boxes */}
          <div className="grid grid-cols-2 gap-3.5 pt-1 text-[11px]">
            {/* Left Box: Resident / POC Handover */}
            <div className="border border-slate-400 bg-white p-2.5 rounded-none space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-black text-slate-950 text-[11px] uppercase tracking-wide">
                  1. Resident / POC Acknowledgment
                </span>
                <span className="text-[9.5px] font-bold text-slate-500">HANDOVER SIGN</span>
              </div>

              <div className="text-[10.5px] space-y-1 text-slate-800">
                <div>
                  <span className="font-bold text-slate-700">POC Name: </span>
                  <span className="font-black text-slate-900">{invoice.pocName || 'Naveeth'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Mobile: </span>
                  <span className="font-mono text-slate-900">{invoice.mobile || '0536148530'}</span>
                </div>
              </div>

              {/* Signature Area */}
              <div className="pt-2.5 pb-0.5 border-t border-dashed border-slate-300">
                <div className="h-12 flex items-end">
                  <div className="w-full border-b border-slate-800 border-dashed pb-0.5 flex items-center justify-between text-[10.5px]">
                    <span className="font-bold text-slate-700">Signature:</span>
                    <span className="font-serif italic text-slate-500">
                      {invoice.pocSignature ? invoice.pocSignature : '___________________________'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1.5 font-mono">
                  <span>Date: {invoice.pocDate || invoice.date}</span>
                  <span>Receiver Sign</span>
                </div>
              </div>
            </div>

            {/* Right Box: Facilities Dept. Clearance & Stamp */}
            <div className="border border-slate-400 bg-white p-2.5 rounded-none space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-black text-slate-950 text-[11px] uppercase tracking-wide">
                  2. Facilities Dept. Approval &amp; Stamp
                </span>
                <span className="text-[9.5px] font-bold text-slate-500">CAMP SEAL</span>
              </div>

              <div className="text-[10.5px] space-y-1 text-slate-800">
                <div>
                  <span className="font-bold text-slate-700">Issued By: </span>
                  <span className="font-black text-slate-900">{invoice.issuedByName || 'Majid'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Designation: </span>
                  <span className="text-slate-900 font-medium">Facilities / Camp Operations</span>
                </div>
              </div>

              {/* Signature & Official Seal Area */}
              <div className="pt-2.5 pb-0.5 border-t border-dashed border-slate-300">
                <div className="h-12 flex items-end">
                  <div className="w-full border-b border-slate-800 border-dashed pb-0.5 flex items-center justify-between text-[10.5px]">
                    <span className="font-bold text-slate-700">Auth Sign &amp; Stamp:</span>
                    <span className="font-serif italic text-slate-500">
                      {invoice.issuedBySignature ? invoice.issuedBySignature : '___________________________'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1.5 font-mono">
                  <span>Date: {invoice.issuedDate || invoice.date}</span>
                  <span>Camp Official Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Document Verification Footer */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 px-1 font-mono border-t border-slate-200 mt-2">
        <span>Tamimi Global Company (TAFGA) • Camp Facilities Billing Management</span>
        <span>Form Ref: TAFGA-FMD-MI-2026</span>
        <span>Printed on {new Date().toISOString().split('T')[0]}</span>
      </div>
    </div>
  );
};



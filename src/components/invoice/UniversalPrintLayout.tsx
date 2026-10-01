import React, { useState, useEffect } from 'react';
import { UnifiedInvoiceRecord } from '../../types/invoice';
import { INVOICE_TYPE_DEFINITIONS } from '../../data/invoiceTemplates';
import { TAMIMI_LOGO_DATA_URL } from '../TamimiLogo';
import { generateZatcaQrCodeDataUrl } from '../../utils/zatcaUtils';

interface UniversalPrintLayoutProps {
  invoice: UnifiedInvoiceRecord;
}

export const UniversalPrintLayout: React.FC<UniversalPrintLayoutProps> = ({ invoice }) => {
  const typeDef = INVOICE_TYPE_DEFINITIONS[invoice.invoiceType] || INVOICE_TYPE_DEFINITIONS.MISSING_ITEMS;
  const isTaxable = (invoice.vatRate || 0) > 0 && (invoice.vatAmount || 0) > 0;
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (isTaxable) {
      generateZatcaQrCodeDataUrl({
        sellerName: 'Tamimi Global Company Ltd (TAFGA)',
        vatNumber: '300012345600003',
        timestamp: `${invoice.date || new Date().toISOString().split('T')[0]}T12:00:00Z`,
        totalAmount: invoice.totalAmount.toFixed(2),
        vatAmount: (invoice.vatAmount || 0).toFixed(2),
      })
        .then((url) => {
          if (isMounted) setQrCodeUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isTaxable, invoice.date, invoice.totalAmount, invoice.vatAmount]);

  const clientName = invoice.customerName || invoice.employeeName || 'Resident';
  const clientMobile = invoice.phoneNumber || invoice.mobile || '0536148530';

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
              {typeDef.title}
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
              Tamimi Global Company (TAFGA) • {invoice.facilities || 'TBCV'} Facilities
            </div>
          </div>

          {/* Right: Invoice Reference Badge & QR */}
          <div className="text-right text-[10.5px] font-mono shrink-0 flex items-center gap-2">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="ZATCA QR" className="w-12 h-12 object-contain border border-slate-300 p-0.5" />
            )}
            <div>
              <div className="px-3 py-1 bg-slate-900 text-white font-black text-[11px] tracking-wide rounded-xs">
                INVOICE # {invoice.invoiceNumber.replace(/^INV-[A-Z]+-/, '') || invoice.date}
              </div>
              <div className="text-[10px] font-bold text-slate-700 mt-1">
                CAMP: {invoice.facilities || 'TBCV'}
              </div>
              <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                Date: {invoice.date || new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Employee / Resident / Client Information Section */}
        <div className="border border-slate-900 rounded-none p-2.5 mb-2.5 bg-slate-50/70 text-[11.5px]">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-300">
            <div className="font-bold text-slate-900 text-[12px]">
              Customer / Employee Information:{' '}
              <span className="font-black text-slate-950 underline decoration-slate-400 underline-offset-2">
                {invoice.roomNumber ? `${invoice.roomNumber} - ` : ''}
                {clientName}
                {invoice.employeeId ? ` (${invoice.employeeId})` : ''}
              </span>
            </div>
            {invoice.roomNumber && (
              <div className="text-[11px] font-bold text-slate-800">
                Room Ref: <span className="font-mono text-slate-950 font-black px-2 py-0.5 bg-white border border-slate-400">{invoice.roomNumber}</span>
              </div>
            )}
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
              <span className="font-semibold text-slate-900 font-mono">{clientMobile}</span>
            </div>
          </div>

          {/* Status & Classification Checkboxes if applicable */}
          {(invoice.employeeStatus || invoice.classification) && (
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
          )}
        </div>

        {/* Main Itemized Table (Scaled to Fill A4 Page Properly) */}
        <div className="w-full mb-2.5">
          <table className="w-full border-collapse border border-slate-900 text-[11px]">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-black">
                <th className="border border-slate-800 px-3 py-1.5 text-left w-52">Description / Items</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-16">Quantity</th>
                <th className="border border-slate-800 px-3 py-1.5 text-right w-24">Unit Rate (SAR)</th>
                <th className="border border-slate-800 px-3 py-1.5 text-right w-24">Amount (SAR)</th>
                <th className="border border-slate-800 px-3 py-1.5 text-left">Remarks / Assessment</th>
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
                      {item.category && (
                        <span className="ml-2 text-[9.5px] font-normal text-slate-500">[{item.category}]</span>
                      )}
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

              {/* Subtotal if VAT is applied */}
              {isTaxable && (
                <>
                  <tr className="bg-slate-50 text-[11px] border-t border-slate-600">
                    <td colSpan={3} className="border border-slate-700 px-3 py-1 text-right font-semibold text-slate-800">
                      Subtotal (Tax Exclusive)
                    </td>
                    <td className="border border-slate-700 px-3 py-1 text-right font-mono font-bold text-slate-900">
                      {invoice.subtotal.toFixed(2)}
                    </td>
                    <td className="border border-slate-700 px-3 py-1 text-[9.5px] text-slate-600">
                      Standard VAT Base
                    </td>
                  </tr>
                  <tr className="bg-slate-50 text-[11px]">
                    <td colSpan={3} className="border border-slate-700 px-3 py-1 text-right font-semibold text-slate-800">
                      Value Added Tax (VAT 15%)
                    </td>
                    <td className="border border-slate-700 px-3 py-1 text-right font-mono font-bold text-amber-900">
                      {(invoice.vatAmount || 0).toFixed(2)}
                    </td>
                    <td className="border border-slate-700 px-3 py-1 text-[9.5px] text-slate-600">
                      ZATCA Tax ID: 300012345600003
                    </td>
                  </tr>
                </>
              )}

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
                    : invoice.paymentStatus === 'OVERDUE'
                    ? '★ OVERDUE BILL'
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
            {typeDef.policyTerms.map((term, i) => (
              <div key={i}>• {term}</div>
            ))}
          </div>

          {/* Spacious 2-Party Signature & Official Stamp Boxes */}
          <div className="grid grid-cols-2 gap-3.5 pt-1 text-[11px]">
            {/* Left Box: Resident / POC Handover */}
            <div className="border border-slate-400 bg-white p-2.5 rounded-none space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-black text-slate-950 text-[11px] uppercase tracking-wide">
                  1. Resident / Client Acknowledgment
                </span>
                <span className="text-[9.5px] font-bold text-slate-500">HANDOVER SIGN</span>
              </div>

              <div className="text-[10.5px] space-y-1 text-slate-800">
                <div>
                  <span className="font-bold text-slate-700">POC / Client: </span>
                  <span className="font-black text-slate-900">{invoice.pocName || clientName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Mobile: </span>
                  <span className="font-mono text-slate-900">{clientMobile}</span>
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
        <span>Form Ref: {typeDef.formRefCode}</span>
        <span>Printed on {new Date().toISOString().split('T')[0]}</span>
      </div>
    </div>
  );
};

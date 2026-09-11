import React, { useState } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintReceiptService } from '../services/printReceiptService';
import { TamimiLogo } from './TamimiLogo';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';

export interface RoomAdmissionFormData {
  roomCode: string;
  buildingName: string;
  bedNumberText: string;
  bookingType: 'General Guest' | 'Medical Isolation';
  patientName: string;
  company: string;
  phoneNumber?: string;
  nationalId?: string;
  email?: string;
  checkIn: string;
  checkOut?: string;
  purposeOfStay?: string;
  hospitalReferral?: string;
  keyIssued?: boolean;
  roomCondition?: string;
  staffNotes?: string;
  bookedByStaff?: string;
  voucherId?: string;
  digitalSignature?: string;
  secondaryOccupant?: {
    patientName: string;
    company?: string;
    phoneNumber?: string;
    nationalId?: string;
    email?: string;
  };
}

interface RoomAdmissionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RoomAdmissionFormData | null;
}

export const RoomAdmissionPrintModal: React.FC<RoomAdmissionPrintModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!isOpen || !data) return null;

  const currentSignature = signature || data.digitalSignature;
  const isMedical = data.bookingType === 'Medical Isolation';
  const voucherNo =
    data.voucherId ||
    `TAFGA-RM-${data.roomCode.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;

  const campBossName = 'Company Responsible';
  const checkInDateVal = data.checkIn || new Date().toLocaleDateString('en-GB');
  const checkOutDateVal =
    data.checkOut && data.checkOut.trim() ? data.checkOut : 'Open / On Departure';

  const handlePrint = () => {
    PrintReceiptService.printRoomAdmissionForm({
      ...data,
      digitalSignature: currentSignature,
    });
  };

  const handleCopyVoucher = () => {
    navigator.clipboard.writeText(voucherNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="room-admission-print-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        className="bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Action Header */}
        <div className="bg-white dark:bg-slate-950 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 shadow-md">
              <TamimiLogo size={36} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Room Admission &amp; Handover Clearance Form</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  Exact 1-Page A4
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official TAMIMI GLOBAL executive 1-Page admission &amp; key handover clearance form
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer border border-emerald-500"
              title="Share Room Pass via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </button>

            <button
              id="btn-direct-print-a4"
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-700 hover:to-yellow-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Form / Save PDF</span>
            </button>

            <button
              id="btn-close-print-modal"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - Live A4 Page Preview */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-300/60 dark:bg-slate-950/70">
          
          <div
            id="a4-single-page-preview"
            className="bg-white text-slate-900 w-full max-w-[210mm] pt-6 pb-6 pr-5 pl-10 rounded-xl shadow-2xl border border-slate-300 flex flex-col space-y-3.5 select-none font-sans text-xs"
          >
            {/* Header with Tamimi Logo */}
            <div className="flex justify-between items-center pb-2.5 border-b-2 border-slate-900">
              <div className="flex items-center space-x-3.5">
                <TamimiLogo size={52} />
                <div>
                  <div className="text-base font-black text-slate-950 tracking-tight uppercase leading-tight">
                    TAMIMI GLOBAL COMPANY LIMITED
                  </div>
                  <div className="text-[10.5px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
                    TAFGA COMMUNITY MANAGEMENT &amp; HOUSING SERVICES
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-black tracking-wider text-slate-900 uppercase font-serif leading-none">
                  TAMIMI
                </div>
                <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
                  Community Management
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold mt-1">
                  Ref: {voucherNo}
                </div>
              </div>
            </div>

            {/* Main Title Banner */}
            <div
              className={`py-2 px-3 text-center font-black text-[13px] uppercase tracking-wider rounded-t-sm shadow-xs ${
                isMedical ? 'bg-[#7f1d1d] text-white' : 'bg-[#0b2545] text-white'
              }`}
            >
              {isMedical
                ? 'Medical Isolation & Health Care Admission Clearance Form'
                : 'Resident & Guest Room Admission & Handover Clearance Form'}
            </div>

            {/* Section 1: Property / Unit Allocation */}
            <div>
              <div className="bg-[#b39055] text-slate-950 font-black text-[11px] py-1 px-2.5 uppercase tracking-wide border-t border-l border-r border-slate-900 flex justify-between items-center">
                <span>1. {isMedical ? 'Isolation Unit & Ward Allocation' : 'Property & Accommodation Allocation'}</span>
                <span className="text-[9px] font-bold text-slate-900 bg-white/70 px-1.5 py-0.2 rounded">
                  {isMedical ? 'Clinical Ward' : 'Standard Housing'}
                </span>
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[11px] bg-white">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <th className="w-1/4 bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Isolation Facility:' : 'Property / Facility:'}
                    </th>
                    <td className="w-1/3 p-2 font-bold text-slate-900 border-r border-slate-900">
                      {isMedical
                        ? `TAFGA Medical Ward (${data.buildingName || '-'})`
                        : `TAFGA Residential Complex (${data.buildingName || '-'})`}
                    </td>
                    <th className="w-1/6 bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Medical Ref:' : 'Booking Ref:'}
                    </th>
                    <td className="p-2 font-mono font-bold text-slate-900">
                      {voucherNo}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Assigned Isolation Bed:' : 'Assigned Unit / Room:'}
                    </th>
                    <td className="p-2 font-black text-slate-950 text-xs border-r border-slate-900">
                      Room {data.roomCode || '-'} · <span className={isMedical ? 'text-rose-900' : 'text-blue-900'}>{data.bedNumberText || '-'}</span>
                    </td>
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      Stay Category:
                    </th>
                    <td className="p-2">
                      <div className="flex items-center space-x-3.5 font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 border border-slate-900 flex items-center justify-center text-[9px] font-black ${!isMedical ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                            {!isMedical ? '✓' : ''}
                          </span>
                          <span>General Guest</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 border border-slate-900 flex items-center justify-center text-[9px] font-black ${isMedical ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                            {isMedical ? '✓' : ''}
                          </span>
                          <span>Medical Isolation</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Admission Date:' : 'Check-In Date:'}
                    </th>
                    <td className="p-2 font-bold text-emerald-800 border-r border-slate-900 font-mono text-xs">
                      {checkInDateVal}
                    </td>
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Expected Discharge:' : 'Check-Out Date:'}
                    </th>
                    <td className="p-2 font-bold text-slate-800 font-mono text-xs">
                      {checkOutDateVal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Person Demographics (Tailored for General Guest vs Medical Isolation) */}
            <div>
              <div className="bg-[#b39055] text-slate-950 font-black text-[11px] py-1 px-2.5 uppercase tracking-wide border-t border-l border-r border-slate-900">
                2. {isMedical ? 'Patient / Resident Clinical Demographics' : 'Guest / Resident Personal & Work Details'}
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[11px] bg-white">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <th className="w-1/4 bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Patient Full Name:' : 'Guest Full Name:'}
                    </th>
                    <td colSpan={3} className="p-2 font-black text-slate-950 text-xs">
                      {data.patientName || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Sponsoring Company:' : 'Company / Employer:'}
                    </th>
                    <td className="w-1/3 p-2 font-bold text-slate-900 border-r border-slate-900">
                      {data.company || '-'}
                    </td>
                    <th className="w-1/6 bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'ID / Iqama No:' : 'ID / Iqama / Passport:'}
                    </th>
                    <td className="p-2 font-mono font-bold text-slate-900">
                      {data.nationalId || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Emergency Contact:' : 'Mobile Contact:'}
                    </th>
                    <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-900">
                      {data.phoneNumber || '-'}
                    </td>
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      E-mail:
                    </th>
                    <td className="p-2 font-mono text-[10px] text-slate-800">
                      {data.email || '-'}
                    </td>
                  </tr>

                  {isMedical ? (
                    // MEDICAL ISOLATION SPECIFIC FIELDS
                    <tr>
                      <th className="bg-[#e8ded1] p-2 text-left font-bold text-rose-950 border-r border-slate-900">
                        Referral Medical Center:
                      </th>
                      <td className="p-2 text-rose-900 font-bold border-r border-slate-900">
                        {data.hospitalReferral || 'Alleanza Clinic'}
                      </td>
                      <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                        Isolation Reason / Diagnosis:
                      </th>
                      <td className="p-2 text-slate-900 font-semibold">
                        {data.purposeOfStay || 'Medical Isolation & Clinical Observation'}
                      </td>
                    </tr>
                  ) : (
                    // GENERAL GUEST SPECIFIC FIELDS (NO MEDICAL / HOSPITAL FIELDS)
                    <tr>
                      <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                        Purpose of Stay / Assignment:
                      </th>
                      <td colSpan={3} className="p-2 text-slate-900 font-bold">
                        {data.purposeOfStay || 'Resident Duty / General Accommodation'}
                      </td>
                    </tr>
                  )}

                  {data.secondaryOccupant && (
                    <tr className="border-t border-slate-900 bg-amber-50">
                      <th className="bg-amber-100 p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                        Secondary Occupant:
                      </th>
                      <td colSpan={3} className="p-2 font-semibold text-slate-900">
                        <span className="font-bold">{data.secondaryOccupant.patientName || '-'}</span> · ID:{' '}
                        <span className="font-mono">{data.secondaryOccupant.nationalId || '-'}</span> · Tel:{' '}
                        <span className="font-mono">{data.secondaryOccupant.phoneNumber || '-'}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 3: Handed-Over Items Inventory */}
            <div>
              <div className="bg-[#b39055] text-slate-950 font-black text-[11px] py-1 px-2.5 uppercase tracking-wide border-t border-l border-r border-slate-900">
                3. {isMedical ? 'Sanitized Inventory & Isolation Asset Custody' : 'Room Inventory & Key Handover Custody'}
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[11px] bg-white">
                <thead>
                  <tr className="bg-[#e8ded1] border-b border-slate-900 font-bold">
                    <th className="p-2 text-left border-r border-slate-900 w-2/5">Item / Asset Description</th>
                    <th className="p-2 text-center border-r border-slate-900 w-1/5">Handed Over</th>
                    <th className="p-2 text-center border-r border-slate-900 w-1/5">Check-In Status</th>
                    <th className="p-2 text-center w-1/5">{isMedical ? 'Discharge Return' : 'Check-Out Return'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(isMedical
                    ? [
                        { item: 'Sanitized Main Room Key / Electronic Isolation Pass', status: 'Qty: 1 · Disinfected' },
                        { item: 'Medical-Grade Bed Linen & Pillow Set (Pre-Sanitized)', status: 'Qty: 1 · Clean & Sealed' },
                        { item: 'AC Remote & Independent Climate Ventilation Unit', status: 'Qty: 1 · Operational' },
                        { item: 'Disinfected Personal Locker & Private Fixtures', status: 'Qty: 1 · Intact' },
                        { item: 'Medical Waste Disposal Kit & Sanitization Supplies', status: 'Qty: 1 · Provided' },
                      ]
                    : [
                        { item: 'Main Room Key / Electronic Access Card', status: 'Qty: 1 · Verified' },
                        { item: 'Bedding & Clean Linen Set (Mattress, Duvet, Pillow)', status: 'Qty: 1 · Fresh & Ready' },
                        { item: 'AC Remote / Climate Control Unit', status: 'Qty: 1 · Operational' },
                        { item: 'Personal Wardrobe / Locker Key & Room Fixtures', status: 'Qty: 1 · Intact' },
                        { item: 'Camp Identification Pass / Housing Authorization', status: 'Qty: 1 · Authorized' },
                      ]
                  ).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-900">{row.item}</td>
                      <td className="p-2 text-center font-bold border-r border-slate-900">Yes [ ✓ ]</td>
                      <td className="p-2 text-center font-bold text-slate-800 border-r border-slate-900">{row.status}</td>
                      <td className="p-2 text-center text-slate-400 font-mono font-semibold">[ &nbsp; ] Complete</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 4: Condition & Hygiene Summary */}
            <div>
              <div className="bg-[#b39055] text-slate-950 font-black text-[11px] py-1 px-2.5 uppercase tracking-wide border-t border-l border-r border-slate-900">
                4. {isMedical ? 'Clinical Sanitization & Health Clearance' : 'Room Condition & Handover Inspection'}
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[11px] bg-white">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <th className="w-1/4 bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Deep Sanitization:' : 'Cleanliness & Furniture:'}
                    </th>
                    <td className="w-1/4 p-2 font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? '[ ✓ ] Sanitized & Disinfected' : '[ ✓ ] Clean & Inspected'}
                    </td>
                    <th className="w-1/4 bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Isolation Ventilation:' : 'HVAC / Cooling:'}
                    </th>
                    <td className="w-1/4 p-2 font-bold text-slate-900">[ ✓ ] Tested &amp; Working</td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Infection Protocol:' : 'Electrical &amp; Power:'}
                    </th>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? '[ ✓ ] Cleared for Ward Admission' : '[ ✓ ] Fully Working'}
                    </td>
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">Door &amp; Locks:</th>
                    <td className="p-2 font-bold text-slate-900">[ ✓ ] Secure &amp; Functional</td>
                  </tr>
                  <tr>
                    <th className="bg-[#e8ded1] p-2 text-left font-bold text-slate-900 border-r border-slate-900">
                      {isMedical ? 'Clinical Remarks:' : 'Staff Remarks:'}
                    </th>
                    <td colSpan={3} className="p-2 text-slate-700 italic">
                      {data.staffNotes || data.roomCondition || (isMedical ? 'Standard Medical Observation Protocols Active' : 'Cleaned & Ready for Occupancy')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 5: Dual Sign-Off */}
            <div>
              <div className="bg-[#b39055] text-slate-950 font-black text-[11px] py-1 px-2.5 uppercase tracking-wide border-t border-l border-r border-slate-900">
                5. {isMedical ? 'Dual Admission & Discharge Clearance Sign-Off' : 'Dual Check-In & Check-Out Clearance Sign-Off'}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                {/* Check In Box */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-slate-100 p-1.5 border-b border-slate-900">
                    <div className="font-black text-[11px] text-slate-900 uppercase">
                      A. {isMedical ? 'Ward Admission Acceptance' : 'Check-In Acceptance'}
                    </div>
                    <div className="text-[8.5px] text-slate-600">
                      {isMedical
                        ? 'I acknowledge admission into the isolation ward and key receipt.'
                        : 'I confirm receipt of room key(s) and assets in good order.'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 gap-2.5 min-h-[115px]">
                    <div className="border-r border-slate-300 pr-2 flex flex-col justify-between">
                      <div>
                        <div className="font-black text-[9.5px] text-slate-900">
                          {isMedical ? 'Patient / Resident:' : 'Guest / Resident:'}
                        </div>
                        <div className="font-bold text-[10px] text-indigo-900 truncate">{data.patientName || '-'}</div>
                      </div>
                      <div className="h-14 border border-dashed border-slate-400 bg-white my-1 rounded-xs flex items-center justify-center overflow-hidden">
                        {currentSignature ? (
                          <img src={currentSignature} alt="Digital Signature" className="h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">Signature Canvas</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[9px] flex items-center justify-between">
                          <span>Sign: {currentSignature ? '✓ Verified Digital' : '_________________'}</span>
                          {!currentSignature && (
                            <button
                              type="button"
                              onClick={() => setIsSigningOpen(true)}
                              className="text-[8.5px] text-sky-600 font-bold hover:underline cursor-pointer"
                            >
                              + Sign Now
                            </button>
                          )}
                        </div>
                        <div className="text-[8.5px] text-slate-600 font-semibold mt-0.5">Date: {checkInDateVal}</div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="font-black text-[9.5px] text-slate-900">
                          {isMedical ? 'Medical Officer / Camp Boss:' : 'Camp Boss / Housing POC:'}
                        </div>
                        <div className="font-bold text-[10px] text-indigo-900 truncate">{campBossName}</div>
                      </div>
                      <div className="h-14 border border-dashed border-slate-400 bg-white my-1 rounded-xs"></div>
                      <div>
                        <div className="font-bold text-[9px]">Sign: _________________</div>
                        <div className="text-[8.5px] text-slate-600 font-semibold mt-0.5">Date: {checkInDateVal}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Check Out Box */}
                <div className="border border-slate-900 bg-white">
                  <div className="bg-slate-100 p-1.5 border-b border-slate-900">
                    <div className="font-black text-[11px] text-slate-900 uppercase">
                      B. {isMedical ? 'Medical Discharge Clearance' : 'Check-Out Clearance'}
                    </div>
                    <div className="text-[8.5px] text-slate-600">
                      {isMedical
                        ? 'I confirm medical recovery discharge clearance & key return.'
                        : 'I confirm return of all keys & departure clearance.'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 gap-2.5 min-h-[115px]">
                    <div className="border-r border-slate-300 pr-2 flex flex-col justify-between">
                      <div>
                        <div className="font-black text-[9.5px] text-slate-900">
                          {isMedical ? 'Patient / Resident:' : 'Guest / Resident:'}
                        </div>
                        <div className="font-bold text-[10px] text-indigo-900 truncate">{data.patientName || '-'}</div>
                      </div>
                      <div className="h-14 border border-dashed border-slate-400 bg-white my-1 rounded-xs"></div>
                      <div>
                        <div className="font-bold text-[9px]">Sign: _________________</div>
                        <div className="text-[8.5px] text-slate-600 font-semibold mt-0.5">Date: {checkOutDateVal}</div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="font-black text-[9.5px] text-slate-900">
                          {isMedical ? 'Medical Officer / Camp Boss:' : 'Camp Boss / Housing POC:'}
                        </div>
                        <div className="font-bold text-[10px] text-indigo-900 truncate">{campBossName}</div>
                      </div>
                      <div className="h-14 border border-dashed border-slate-400 bg-white my-1 rounded-xs"></div>
                      <div>
                        <div className="font-bold text-[9px]">Sign: _________________</div>
                        <div className="text-[8.5px] text-slate-600 font-semibold mt-0.5">Date: {checkOutDateVal}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice & Undertaking Box */}
            <div className="border border-slate-300 bg-slate-50 p-2.5 text-[8.5px] text-slate-700 leading-relaxed rounded-xs">
              {isMedical ? (
                <>
                  <strong>Medical Isolation &amp; Health Undertaking:</strong> 1. The patient/occupant agrees to strictly remain inside the designated isolation room until cleared by the camp medical team or referring clinic (e.g. Alleanza Clinic). 2. Meals and hydration will be delivered directly outside the door. 3. Face masks and hand hygiene must be maintained during all interactions. 4. In case of emergency or worsening symptoms, immediately notify the Tamimi Clinic team. 5. All keys and assets must be handed over upon discharge.
                </>
              ) : (
                <>
                  <strong>Notice &amp; Housing Policy Undertaking:</strong> 1. The occupant acknowledges receipt of the designated room and inventory in clean, working condition and agrees to strictly adhere to TAFGA housing regulations. 2. Quiet hours (22:00 – 06:00) must be observed; unauthorized visitors and high-wattage cooking appliances inside the room are strictly prohibited. 3. Care of company property is mandatory. 4. All issued keys and passes must be returned upon departure.
                </>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-slate-400 pt-2 flex justify-between items-center text-[9px] text-slate-600 font-semibold">
              <div>TAMIMI GLOBAL COMPANY LIMITED · TAFGA COMMUNITY MANAGEMENT &amp; HOUSING SERVICES</div>
              <div>Doc Ref: {voucherNo}</div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-white dark:bg-slate-950 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">Voucher Ref:</span>
            <code className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded font-mono text-[11px] font-black text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700">
              {voucherNo}
            </code>
            <button
              onClick={handleCopyVoucher}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Copy Reference"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsSigningOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm transition cursor-pointer border border-indigo-200 dark:border-indigo-800"
            >
              {currentSignature ? '✓ Re-sign Document' : '✍️ Sign on Screen'}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-700 hover:to-yellow-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Form / Save PDF</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Signature Capture Modal */}
      <AnimatePresence>
        {isSigningOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <DigitalSignaturePad
                title="Resident / Patient Digital Signature"
                signeeName={data.patientName}
                onSave={(dataUrl) => {
                  setSignature(dataUrl);
                  setIsSigningOpen(false);
                }}
                onCancel={() => setIsSigningOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

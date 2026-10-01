import React from 'react';
import {
  Printer,
  X,
  Building2,
  CheckCircle,
  FileText,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  QrCode,
  Download,
  Copy,
  Check,
  Users,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Booking } from '../types';
import { formatDisplayDate, formatDisplayTime, getDayName } from '../services/storageService';
import { PrintReceiptService } from '../services/printReceiptService';
import { TamimiLogo } from './TamimiLogo';

interface BookingAdmissionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const BookingAdmissionPrintModal: React.FC<BookingAdmissionPrintModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !booking) return null;

  const dateFormatted = formatDisplayDate(booking.date);
  const dayName = getDayName(booking.date);
  const timeFormatted = `${formatDisplayTime(booking.startTime)} – ${formatDisplayTime(booking.endTime)}`;
  const documentRefNo = `TAFGA-ADM-${booking.id.replace(/[^A-Za-z0-9]/g, '')}-${booking.date.replace(/-/g, '')}`;

  const handlePrint = () => {
    PrintReceiptService.printFacilityAdmissionForm(booking);
  };

  const handleDownloadTxt = () => {
    const text = PrintReceiptService.generateReceiptText(booking);
    const filename = `Tamimi-Booking-Form-${booking.id}-${booking.date}.txt`;
    PrintReceiptService.downloadReceiptFile(filename, text);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        className="bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Action Bar (Non-Print Header) */}
        <div className="bg-white dark:bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Official A4 Reservation &amp; Signature Form</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  Ready to Print / PDF
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official booking voucher with resident/guest signature and camp authority approval
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              title="Print Document or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Form / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body: High Fidelity A4 Paper Layout */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-200/70 dark:bg-slate-950/60">
          <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] pt-7 pb-7 pr-6 pl-12 rounded-xl shadow-xl border border-slate-300 flex flex-col justify-between select-none">
            
            <div>
              {/* Official Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex items-center space-x-3">
                  <TamimiLogo size={54} />
                  <div>
                    <div className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950">
                      TAMIMI GLOBAL COMPANY LIMITED
                    </div>
                    <div className="text-xs font-bold text-slate-600 tracking-wide uppercase">
                      TAFGA SPORTS &amp; RECREATIONAL FACILITIES · OFFICIAL ADMISSION FORM
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider text-white bg-sky-700">
                    {booking.status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 font-bold">
                    Ref: {documentRefNo}
                  </div>
                </div>
              </div>

              {/* Title & Document Badge */}
              <div className="text-center bg-slate-50 border border-slate-300 rounded-lg py-2.5 px-4 mb-4">
                <div className="text-xs font-black uppercase tracking-widest text-sky-800">
                  OFFICIAL FACILITY RESERVATION &amp; ADMISSION RECORD
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Authorised Access Pass · Resident &amp; Facility Operations Desk
                </div>
              </div>

              {/* Key Details Summary Cards (Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Booking ID</div>
                  <div className="text-sm font-black text-sky-700 font-mono">{booking.id}</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Facility / Venue</div>
                  <div className="text-xs font-black text-slate-900 truncate">{booking.facilityName}</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Resource / Court</div>
                  <div className="text-xs font-black text-slate-900 truncate">{booking.stage}</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-300">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total Duration</div>
                  <div className="text-xs font-black text-emerald-700">{booking.durationMinutes} Minutes</div>
                </div>
              </div>

              {/* Primary Reservation Details Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-black text-xs uppercase tracking-wider text-slate-700">
                  1. Reservation &amp; Schedule Details
                </div>
                <table className="w-full text-xs text-left">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4">Date &amp; Day</td>
                      <td className="py-2 px-3 font-black text-slate-900 w-1/4">{dateFormatted} ({dayName})</td>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4">Allocated Time Slot</td>
                      <td className="py-2 px-3 font-black text-emerald-700 w-1/4">{timeFormatted}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Facility Tab Name</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{booking.sheetTabName}</td>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Number of Guests</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{booking.numberOfGuests || 1} Person(s)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Issued Timestamp</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{new Date(booking.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Booking Category</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{booking.isRecurring ? 'Recurring Season Slot' : 'Standard Daily Slot'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Guest & Contact Information */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-black text-xs uppercase tracking-wider text-slate-700">
                  2. Resident / Customer Information
                </div>
                <table className="w-full text-xs text-left">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4">Customer / Team Leader</td>
                      <td className="py-2 px-3 font-black text-slate-950 w-1/4">{booking.customerName}</td>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4">Contact Phone</td>
                      <td className="py-2 px-3 font-bold text-slate-900 font-mono w-1/4">{booking.phoneNumber}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Department / Team</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{booking.departmentOrTeam || 'Tamimi Resident / Staff'}</td>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Email Address</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{booking.email || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 bg-slate-50 font-bold text-slate-600">Authorized By (Staff)</td>
                      <td className="py-2 px-3 font-semibold text-slate-900" colSpan={3}>
                        {booking.bookedByStaff || 'Helpdesk Admin / Operations'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Match Options / Custom Notes */}
              {booking.notes && (
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-black text-xs uppercase tracking-wider text-slate-700">
                    3. Match Configuration &amp; Special Instructions
                  </div>
                  <div className="p-2.5 text-xs text-slate-800 font-medium bg-slate-50/50 leading-relaxed">
                    {booking.notes}
                  </div>
                </div>
              )}

              {/* Camp Facility Rules & Regulations */}
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 mb-5">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  4. Camp &amp; Facility Regulations (Terms &amp; Conditions)
                </div>
                <ul className="text-[10px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed font-medium">
                  <li>
                    <strong>Access Verification:</strong> This official admission slip or Booking ID must be presented upon entering the facility.
                  </li>
                  <li>
                    <strong>Time Adherence:</strong> Please report 5-10 minutes prior to your allocated slot. Extension beyond the allotted time requires prior admin approval.
                  </li>
                  <li>
                    <strong>Appropriate Gear &amp; Conduct:</strong> Standard sports footwear and appropriate attire are strictly mandatory for all courts and fields.
                  </li>
                  <li>
                    <strong>Facility Care:</strong> All facility equipment, turf, lighting, and amenities must be maintained with care. Any damage must be reported immediately.
                  </li>
                  <li>
                    <strong>Cancellation Notice:</strong> Cancellations must be made via the Helpdesk portal prior to the start time to release the slot for other camp residents.
                  </li>
                </ul>
              </div>

            </div>

            {/* Dual Signature & Official Stamp Section */}
            <div className="pt-4 border-t-2 border-slate-900 mt-4">
              <div className="grid grid-cols-2 gap-8 mb-4">
                
                {/* Guest / Customer Signature */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex flex-col justify-between h-28">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Resident / Customer Signature
                  </div>
                  <div className="flex justify-between items-end border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-600 font-bold">
                    <span>Name: {booking.customerName}</span>
                    <span>Date: {dateFormatted}</span>
                  </div>
                </div>

                {/* Authorized Officer Signature & Stamp */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Authorized Officer &amp; Stamp
                    </div>
                    <div className="w-10 h-10 border border-dashed border-slate-400 rounded-full flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase text-center p-0.5">
                      OFFICIAL STAMP
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-600 font-bold">
                    <span>Officer: {booking.bookedByStaff || 'Helpdesk Admin'}</span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Footer Credits */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium pt-1">
                <span>Tamimi Global Co. Ltd. · Central Facility Reservation Management System</span>
                <span className="font-bold text-slate-600">All Rights Reserved © {new Date().getFullYear()}</span>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

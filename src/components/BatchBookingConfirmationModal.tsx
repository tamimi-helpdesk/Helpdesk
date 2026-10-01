import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  CalendarRange,
  Clock,
  User,
  Phone,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  X,
  Share2,
  MessageCircle,
  ChevronDown,
  UserCheck,
  Globe,
  FileText,
  Receipt,
} from 'lucide-react';
import { Booking } from '../types';
import { formatDisplayTime } from '../services/storageService';
import { PrintReceiptService } from '../services/printReceiptService';
import { WhatsAppService } from '../services/whatsappService';
import { BookingAdmissionPrintModal } from './BookingAdmissionPrintModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { motion, AnimatePresence } from 'motion/react';

interface BatchBookingConfirmationModalProps {
  bookings: Booking[] | null;
  onClose: () => void;
}

export const BatchBookingConfirmationModal: React.FC<BatchBookingConfirmationModalProps> = ({
  bookings,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [selectedBookingForA4, setSelectedBookingForA4] = useState<Booking | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);

  const shareMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!bookings || bookings.length === 0) return null;

  const first = bookings[0];

  // 1. Share With Guest (Direct WhatsApp)
  const handleShareWithGuest = () => {
    setIsShareMenuOpen(false);
    const msg = WhatsAppService.generateBatchBookingMessage(bookings);
    WhatsAppService.open(first.phoneNumber, msg);
  };

  // 2. Share Anyone (Direct WhatsApp Contact / Chat Picker)
  const handleShareAnyone = () => {
    setIsShareMenuOpen(false);
    const msg = WhatsAppService.generateBatchBookingMessage(bookings);
    WhatsAppService.shareAnyone(msg);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 3. Copy full summary text
  const handleCopyAllSummary = () => {
    const text = PrintReceiptService.generateBatchReceiptText(bookings);
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 p-5 sm:p-6 relative print:p-0 print:border-none print:shadow-none transition-colors duration-200">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition print:hidden cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Success */}
          <div className="text-center space-y-1 pt-1">
            <div className="w-13 h-13 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Recurring Schedule Confirmed!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              {bookings.length} match sessions secured in {first.facilityName} ({first.stage})
            </p>
          </div>

          {/* Executive Pass Card */}
          <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-inner space-y-4">
            
            {/* Customer & Facility Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block">
                    Recurring Schedule Pass
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">·</span>
                  <span className="text-[9px] text-sky-700 dark:text-cyan-400 font-bold">
                    Tamimi Global
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {first.customerName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {first.departmentOrTeam ? `${first.departmentOrTeam} · ` : ''} Phone: {first.phoneNumber}
                </p>
              </div>

              <div className="text-left sm:text-right bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Session Time</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {formatDisplayTime(first.startTime)} – {formatDisplayTime(first.endTime)}
                </span>
              </div>
            </div>

            {/* List of all Booked Sessions in this schedule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <span>Confirmed Sessions ({bookings.length})</span>
                <span>Actions</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {bookings.map((b, idx) => (
                  <div
                    key={`batch-bk-${b.id || 'b'}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{b.date}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">({b.stage})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedBookingForA4(b)}
                        className="px-2 py-1 bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-[10px] font-bold border border-sky-200 dark:border-sky-800 cursor-pointer"
                        title="Print A4 Form for this date"
                      >
                        A4 Form
                      </button>
                      <span className="font-mono text-sky-700 dark:text-cyan-400 text-[11px] font-bold">
                        {b.id}
                      </span>
                      <button
                        onClick={() => handleCopyId(b.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Copy Single ID"
                      >
                        {copiedId === b.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-emerald-700 dark:text-emerald-400/90 pt-1 border-t border-slate-200 dark:border-slate-800/80 font-semibold">
              <div className="flex items-center space-x-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Multi-Date Schedule Confirmed &amp; Logged</span>
              </div>
              {first.bookedByStaff && (
                <span className="text-sky-700 dark:text-sky-300 font-bold">
                  Booked By: {first.bookedByStaff}
                </span>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* STREAMLINED 3-ACTION CORE: PRINT, SHARE (WHATSAPP), COPY                 */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-1 print:hidden">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              
              {/* 1. PRINT BUTTON */}
              <div className="relative" ref={printMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                  className="w-full py-3 px-2 sm:px-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/25 border-2 border-indigo-400/50 cursor-pointer"
                  title="Print schedule passes and receipts"
                >
                  <Printer className="w-4 h-4 text-sky-200 shrink-0" />
                  <span>Print</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-sky-200 transition-transform duration-200 ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Print Dropdown */}
                <AnimatePresence>
                  {isPrintMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1"
                    >
                      <button
                        onClick={() => {
                          setIsPrintMenuOpen(false);
                          setSelectedBookingForA4(first);
                        }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-white">Official A4 Form</span>
                          <span className="block text-[10px] text-slate-500">Official Pass for Date 1</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsPrintMenuOpen(false);
                          PrintReceiptService.printFormattedBatchPass(bookings);
                        }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-white">Full Schedule Sheet</span>
                          <span className="block text-[10px] text-slate-500">Complete multi-date pass</span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. SHARE BUTTON (WhatsApp with Share With Guest & Share Anyone) */}
              <div className="relative" ref={shareMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                  className="w-full py-3 px-2 sm:px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/25 border-2 border-emerald-400/40 cursor-pointer"
                  title="Share schedule pass via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>Share</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform duration-200 ${isShareMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* WhatsApp Options Dropdown Menu */}
                <AnimatePresence>
                  {isShareMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800">
                        WhatsApp Sharing Options
                      </div>

                      {/* Option A: Share With Guest */}
                      <button
                        onClick={handleShareWithGuest}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="block font-black text-slate-900 dark:text-white">Share With Guest</span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            Direct to {first.customerName} ({first.phoneNumber})
                          </span>
                        </div>
                      </button>

                      {/* Option B: Share Anyone */}
                      <button
                        onClick={handleShareAnyone}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-white">Share Anyone</span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                            Choose any WhatsApp contact or group
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. COPY BUTTON (Full schedule summary) */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyAllSummary}
                  className="w-full py-3 px-2 sm:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 border-2 border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
                  title="Copy complete recurring schedule"
                >
                  {allCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span>Copy</span>
                    </>
                  )}
                </motion.button>
              </div>

            </div>

            {/* Bottom Footer Controls: Done */}
            <div className="flex items-center justify-end pt-2 border-t-2 border-slate-100 dark:border-slate-800">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                Done / Return
              </motion.button>
            </div>
          </div>

        </div>
      </div>

      {/* WhatsApp Custom Dispatch Modal */}
      {showWhatsAppModal && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          title={`WhatsApp Schedule - ${first.customerName}`}
          recipientName={first.customerName}
          defaultPhone={first.phoneNumber}
          messageText={WhatsAppService.generateBatchBookingMessage(bookings)}
          moduleLabel={`${first.facilityName} (${bookings.length} Sessions)`}
        />
      )}

      {/* Embedded A4 Admission & Signature Form Modal */}
      {selectedBookingForA4 && (
        <BookingAdmissionPrintModal
          isOpen={!!selectedBookingForA4}
          onClose={() => setSelectedBookingForA4(null)}
          booking={selectedBookingForA4}
        />
      )}
    </>
  );
};




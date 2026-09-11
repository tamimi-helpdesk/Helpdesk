import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  Printer,
  Calendar,
  Clock,
  User,
  Phone,
  FileSpreadsheet,
  QrCode,
  CalendarRange,
  X,
  XCircle,
  MessageCircle,
  ChevronDown,
  UserCheck,
  Globe,
  FileText,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Booking } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService, formatDisplayTime, formatDisplayDate } from '../services/storageService';
import { PrintReceiptService } from '../services/printReceiptService';
import { WhatsAppService, generateSecurityAuthToken } from '../services/whatsappService';
import { BookingAdmissionPrintModal } from './BookingAdmissionPrintModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCancelBooking: (bookingId: string) => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onCancelBooking,
}) => {
  const [activeSlot, setActiveSlot] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'single'>('single');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showA4PrintModal, setShowA4PrintModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);

  const shareMenuRef = useRef<HTMLDivElement>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);

  // Retrieve any linked bookings in the same recurring schedule
  const linkedBookings = useMemo(() => {
    if (!booking) return [];
    return StorageService.getLinkedBookings(booking);
  }, [booking]);

  // Sync activeSlot and viewMode when booking prop changes
  useEffect(() => {
    if (booking) {
      setActiveSlot(booking);
      const linked = StorageService.getLinkedBookings(booking);
      if (linked.length > 1) {
        setViewMode('unified');
      } else {
        setViewMode('single');
      }
    } else {
      setActiveSlot(null);
    }
  }, [booking]);

  // Close dropdowns on outside click
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

  if (!booking) return null;

  const currentBooking = activeSlot || booking;
  const isMultiSlot = linkedBookings.length > 1;

  // Master schedule reference key
  const masterGroupId = booking.recurringGroupId || (isMultiSlot
    ? StorageService.getMasterScheduleRef(booking)
    : booking.id);

  const handleCopyId = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySingleSlotId = (slotId: string) => {
    navigator.clipboard.writeText(slotId);
    setCopiedSlotId(slotId);
    setTimeout(() => setCopiedSlotId(null), 2000);
  };

  const handleCopyAllSlotIds = () => {
    const ids = linkedBookings.map((b, idx) => `${idx + 1}. ${b.date} | ${b.startTime}-${b.endTime} | ID: ${b.id}`).join('\n');
    navigator.clipboard.writeText(ids);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Generate WhatsApp message
  const getShareMessage = () => {
    if (viewMode === 'unified' && isMultiSlot) {
      return WhatsAppService.generateBatchBookingMessage(linkedBookings);
    }
    return WhatsAppService.generateBookingMessage(currentBooking);
  };

  // 1. Share With Guest (Direct WhatsApp)
  const handleShareWithGuest = () => {
    setIsShareMenuOpen(false);
    const msg = getShareMessage();
    WhatsAppService.open(currentBooking.phoneNumber, msg);
  };

  // 2. Share Anyone (Direct WhatsApp Contact / Chat Picker)
  const handleShareAnyone = () => {
    setIsShareMenuOpen(false);
    const msg = getShareMessage();
    WhatsAppService.shareAnyone(msg);
  };

  // 3. Copy full booking summary pass text
  const handleCopyFullPass = () => {
    const text = getShareMessage();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  // Active / Cancelled counts for multi-slot
  const activeCount = linkedBookings.filter((b) => b.status === 'CONFIRMED').length;
  const cancelledCount = linkedBookings.filter((b) => b.status === 'CANCELLED').length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 dark:bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-7 relative print:p-0 print:border-none print:shadow-none transition-colors space-y-4"
        >
          {/* Top Close Button (hidden in print) */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition print:hidden cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Header */}
          <div className="text-center space-y-1 pt-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 border-2 border-emerald-300 dark:border-emerald-400/40">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              {isMultiSlot && viewMode === 'unified' ? 'Master Schedule Pass' : 'Reservation Confirmed!'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {isMultiSlot
                ? `Booking contains ${linkedBookings.length} scheduled sessions across the calendar.`
                : 'Your pass has been generated and recorded in the system.'}
            </p>
          </div>

          {/* Segmented Switcher (Visible if booking has multiple sessions) */}
          {isMultiSlot && (
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'unified'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Unified Schedule ({linkedBookings.length} Slots)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Single Slot Details</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: UNIFIED MASTER SCHEDULE PASS (For Multi-Slot / Monthly Bookings) */}
          {/* ========================================================================= */}
          {isMultiSlot && viewMode === 'unified' ? (
            <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-2 border-emerald-300 dark:border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-emerald-200/80 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300 block bg-emerald-100 dark:bg-emerald-950/90 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                      Multi-Slot Master Pass
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[10px] text-emerald-700 dark:text-teal-400 font-black">
                      Tamimi Global
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white leading-tight">
                    {booking.facilityName}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                    {booking.stage}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">Total Slots</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{linkedBookings.length}</span>
                </div>
              </div>

              {/* Master Group Reference ID */}
              <div className="bg-white/95 dark:bg-slate-900/90 border-2 border-emerald-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block">
                    Master Schedule Reference ID
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-black text-emerald-800 dark:text-teal-300 tracking-wider">
                    {masterGroupId}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopyId(masterGroupId)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 text-emerald-800 dark:text-slate-200 rounded-xl text-xs font-black border border-emerald-300 dark:border-slate-700 transition cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </motion.button>
              </div>

              {/* Customer & Timeline Overview */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-black block">Customer</span>
                  <div className="font-black text-slate-900 dark:text-white truncate flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{booking.customerName}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-black block">Phone</span>
                  <div className="font-black text-slate-900 dark:text-white truncate flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{booking.phoneNumber}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-black block">Schedule Span</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {formatDisplayDate(linkedBookings[0].date, { short: true })} → {formatDisplayDate(linkedBookings[linkedBookings.length - 1].date, { short: true })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 dark:text-emerald-400 font-black text-xs">
                      {activeCount} Active
                    </span>
                    {cancelledCount > 0 && (
                      <span className="text-red-500 font-black text-xs ml-2">
                        ({cancelledCount} Cancelled)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Sessions Interactive Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All {linkedBookings.length} Scheduled Sessions</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAllSlotIds}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Copy All {linkedBookings.length} Slot IDs
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {linkedBookings.map((slot, idx) => {
                    const isCancelled = slot.status === 'CANCELLED';
                    const isSelected = currentBooking.id === slot.id;
                    return (
                      <div
                        key={`unified-slot-${slot.id}-${idx}`}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs border transition ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-400 dark:border-sky-600 shadow-2xs'
                            : isCancelled
                            ? 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                              {formatDisplayDate(slot.date, { short: true })}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {formatDisplayTime(slot.startTime)} – {formatDisplayTime(slot.endTime)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopySingleSlotId(slot.id)}
                            className="font-mono text-[11px] text-sky-700 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900 transition flex items-center gap-1 cursor-pointer"
                            title="Click to copy Slot ID"
                          >
                            <span>{slot.id}</span>
                            {copiedSlotId === slot.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSlot(slot);
                              setViewMode('single');
                            }}
                            className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 underline cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync confirmation */}
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 dark:text-emerald-400 pt-1 font-bold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All {linkedBookings.length} sessions synchronized with Central Register</span>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: SINGLE SLOT DETAILS PASS (COMPACT SECURE DIGITAL TICKET)          */
            /* ========================================================================= */
            <div className="relative bg-gradient-to-b from-sky-50/90 via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-2 border-sky-300 dark:border-sky-500/40 rounded-3xl p-5 shadow-xl overflow-hidden space-y-3.5">
              {/* Semicircular Ticket Cutout Notches */}
              <div className="absolute -left-3 top-[38%] -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 dark:bg-black border-r-2 border-sky-300 dark:border-sky-500/40 pointer-events-none" />
              <div className="absolute -right-3 top-[38%] -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 dark:bg-black border-l-2 border-sky-300 dark:border-sky-500/40 pointer-events-none" />

              {/* If multi-slot, compact banner to switch to master schedule */}
              {isMultiSlot && (
                <div className="bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-emerald-900 dark:text-emerald-300 font-bold">
                    Part of {linkedBookings.length}-slot schedule
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMode('unified')}
                    className="text-xs font-black text-emerald-800 dark:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <span>All Slots</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Header: Brand, Pass ID, and QR Code */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                      <span>OFFICIAL DIGITAL PASS</span>
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white leading-tight">
                    {currentBooking.facilityName}
                  </h4>
                  <p className="text-xs text-sky-700 dark:text-sky-400 font-bold">
                    {currentBooking.stage}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="p-1.5 bg-white rounded-xl shadow-xs border border-slate-300 dark:border-slate-700">
                    <QrCode className="w-7 h-7 text-slate-950" />
                  </div>
                  <span className="text-[8px] font-mono font-black text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                    SCAN VERIFIED
                  </span>
                </div>
              </div>

              {/* Pass ID Row with 1-click copy */}
              <div className="flex items-center justify-between bg-white/95 dark:bg-slate-900/90 border border-sky-200 dark:border-slate-800 rounded-2xl px-3 py-2 shadow-2xs">
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider shrink-0">
                    PASS ID:
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-black text-sky-800 dark:text-cyan-400 truncate">
                    #{currentBooking.id}
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-600">
                    CONFIRMED
                  </span>
                  <button
                    onClick={() => handleCopyId(currentBooking.id)}
                    className="p-1 text-slate-500 hover:text-sky-600 dark:hover:text-white transition cursor-pointer"
                    title="Copy Pass ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Perforated ticket tear line across the cutouts */}
              <div className="relative my-1">
                <div className="border-t-2 border-dashed border-sky-300 dark:border-slate-700/80" />
              </div>

              {/* Essential Details Only (No walls of text or repetitive boilerplate) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Guest Name</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5">
                    {currentBooking.customerName}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Phone</span>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-white truncate block mt-0.5">
                    {currentBooking.phoneNumber}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                    {formatDisplayDate(currentBooking.date, { short: true, showDayName: true })}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Time Slot</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    {formatDisplayTime(currentBooking.startTime)} – {formatDisplayTime(currentBooking.endTime)}
                  </span>
                </div>
              </div>

              {/* Note (rendered only if present) */}
              {currentBooking.notes?.trim() && (
                <div className="bg-amber-50/70 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300">
                  <span className="font-black">Note:</span> {currentBooking.notes.trim()}
                </div>
              )}

              {/* Department badge (rendered only if present) */}
              {currentBooking.departmentOrTeam && (
                <div className="bg-slate-100 dark:bg-slate-950/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span>Department/Team: <strong className="text-slate-950 dark:text-white font-black">{currentBooking.departmentOrTeam}</strong></span>
                </div>
              )}

              {/* Security Bottom Strip with Anti-Counterfeit Auth Token & Micro-Barcode */}
              <div className="pt-1.5 flex items-center justify-between border-t border-sky-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    AUTH: {generateSecurityAuthToken(currentBooking.id, currentBooking.date, currentBooking.phoneNumber)}-OK
                  </span>
                </div>
                <div className="font-mono tracking-widest text-[9px] text-slate-400 dark:text-slate-500 select-none">
                  ||| | || ||| | |||
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3-ACTION CORE CONTROLS: PRINT, SHARE (WHATSAPP), COPY                     */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-1 print:hidden">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              
              {/* 1. PRINT BUTTON (with option for A4 / POS) */}
              <div className="relative" ref={printMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                  className="w-full py-3 px-2 sm:px-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/25 border-2 border-indigo-400/50 cursor-pointer"
                  title="Print official forms and receipts"
                >
                  <Printer className="w-4 h-4 text-sky-200 shrink-0" />
                  <span>Print</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-sky-200 transition-transform duration-200 ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Print Dropdown Menu */}
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
                          setShowA4PrintModal(true);
                        }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-white">Official A4 Form</span>
                          <span className="block text-[10px] text-slate-500">Signatures &amp; Admission Pass</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsPrintMenuOpen(false);
                          PrintReceiptService.printThermalReceipt80mm(currentBooking);
                        }}
                        className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-white">80mm POS Slip</span>
                          <span className="block text-[10px] text-slate-500">Thermal Receipt Voucher</span>
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
                  title="Share booking pass via WhatsApp"
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
                            Direct to {booking.customerName} ({booking.phoneNumber})
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

              {/* 3. COPY BUTTON (Full reservation text) */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyFullPass}
                  className="w-full py-3 px-2 sm:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 border-2 border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
                  title="Copy full booking details"
                >
                  {copiedSummary ? (
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

            {/* Bottom Footer Controls: Cancel & Done */}
            <div className="flex items-center justify-between pt-2 border-t-2 border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onCancelBooking(currentBooking.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold flex items-center space-x-1 px-3 py-2 rounded-xl hover:bg-red-500/10 transition cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel {isMultiSlot && viewMode === 'single' ? 'This Slot' : 'Booking'}</span>
              </button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="px-8 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-sky-600/30 transition cursor-pointer"
              >
                Done / Return
              </motion.button>
            </div>
          </div>

        </motion.div>
      </div>

      {/* WhatsApp Custom Share Modal (for Share Anyone or editing) */}
      {showWhatsAppModal && (
        <WhatsAppShareModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          title={`WhatsApp Pass - ${currentBooking.customerName}`}
          recipientName={currentBooking.customerName}
          defaultPhone={currentBooking.phoneNumber}
          messageText={getShareMessage()}
          moduleLabel={currentBooking.facilityName}
        />
      )}

      {/* Embedded Official A4 Admission & Signature Form Modal */}
      {showA4PrintModal && (
        <BookingAdmissionPrintModal
          isOpen={showA4PrintModal}
          onClose={() => setShowA4PrintModal(false)}
          booking={currentBooking}
        />
      )}
    </>
  );
};

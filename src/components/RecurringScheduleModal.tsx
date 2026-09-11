import React, { useState, useEffect } from 'react';
import {
  CalendarRange,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Printer,
  Copy,
  Check,
  X,
  MessageCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { StorageService, formatDisplayTime, formatDisplayDate } from '../services/storageService';
import { GasService } from '../services/gasService';
import { WhatsAppService } from '../services/whatsappService';
import { PrintReceiptService } from '../services/printReceiptService';
import { BookingAdmissionPrintModal } from './BookingAdmissionPrintModal';

interface RecurringScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupIdOrBookingId: string | null;
  onScheduleUpdated?: () => void;
}

export const RecurringScheduleModal: React.FC<RecurringScheduleModalProps> = ({
  isOpen,
  onClose,
  groupIdOrBookingId,
  onScheduleUpdated,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isCancellingAll, setIsCancellingAll] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested recurring schedule cancellation');
  const [selectedBookingForA4, setSelectedBookingForA4] = useState<Booking | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reload bookings whenever modal opens or ID changes
  useEffect(() => {
    if (isOpen && groupIdOrBookingId) {
      const linked = StorageService.getLinkedBookings(groupIdOrBookingId);
      setBookings(linked);
      setShowCancelConfirmation(false);
      setNotification(null);
    }
  }, [isOpen, groupIdOrBookingId]);

  if (!isOpen || !groupIdOrBookingId) return null;

  if (bookings.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full text-center space-y-4">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No active or historical bookings found for schedule reference &quot;{groupIdOrBookingId}&quot;.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const first = bookings[0];
  const last = bookings[bookings.length - 1];
  const masterGroupId = first.recurringGroupId || `GRP-${first.id}`;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  const handleCopy = (text: string, idTag?: string) => {
    navigator.clipboard.writeText(text);
    if (idTag) {
      setCopiedId(idTag);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleCopyAllIds = () => {
    const listText = bookings
      .map((b, i) => `Session #${i + 1} (${b.date} | ${b.startTime}-${b.endTime}): ${b.id} [${b.status}]`)
      .join('\n');
    const fullText = `MASTER SCHEDULE REF: ${masterGroupId}\nCustomer: ${first.customerName} (${first.phoneNumber})\nFacility: ${first.facilityName} - ${first.stage}\nTotal Sessions: ${bookings.length}\n\n${listText}`;
    handleCopy(fullText);
  };

  const handleWhatsAppFullSchedule = () => {
    const msg = WhatsAppService.generateBatchBookingMessage(bookings);
    WhatsAppService.open(first.phoneNumber, msg);
  };

  const handlePrintFullSchedule = () => {
    PrintReceiptService.printBatchReceipt(bookings);
  };

  const handleCancelEntireSchedule = async () => {
    setIsCancellingAll(true);
    try {
      const res = StorageService.cancelRecurringGroup(masterGroupId, cancelReason);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Successfully cancelled all ${res.cancelledCount} sessions in this recurring schedule!`,
        });
        // Refresh local bookings list
        const updated = StorageService.getLinkedBookings(masterGroupId);
        setBookings(updated);
        setShowCancelConfirmation(false);
        onScheduleUpdated?.();
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to cancel recurring schedule.' });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Error occurred.' });
    } finally {
      setIsCancellingAll(false);
    }
  };

  const handleCancelSingleSession = async (booking: Booking) => {
    if (!window.confirm(`Cancel session on ${booking.date} (${booking.startTime}-${booking.endTime})?`)) return;
    try {
      StorageService.cancelBooking(booking.id, 'Single session cancelled by staff');
      GasService.pushCancelToRemote({
        bookingId: booking.id,
        phoneNumber: booking.phoneNumber,
        reason: 'Single session cancelled by staff',
        facilityName: booking.facilityName || booking.facilityId,
        sheetTabName: booking.sheetTabName,
        stage: booking.stage,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationMinutes: booking.durationMinutes,
        guestsCount: booking.numberOfGuests,
        customerName: booking.customerName,
      }).catch(console.warn);
      const updated = StorageService.getLinkedBookings(masterGroupId);
      setBookings(updated);
      onScheduleUpdated?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 dark:bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-5 sm:p-7 relative transition-colors"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Banner */}
          <div className="flex items-start justify-between pr-10">
            <div>
              <div className="flex items-center space-x-2 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <CalendarRange className="w-4 h-4" />
                <span>Monthly &amp; Recurring Schedule Overview</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                {first.facilityName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                Stage / Zone: <span className="text-sky-700 dark:text-sky-400">{first.stage}</span>
              </p>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold border ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-300'
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Master Reference ID Card (Unified Pass) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-sky-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/40 border-2 border-emerald-300/80 dark:border-emerald-600/40 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 dark:text-emerald-400 block">
                  Master Schedule Reference ID (Single ID for Entire Month)
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-slate-950 dark:text-white tracking-wide">
                  {masterGroupId}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                  Use this single Reference ID in search to look up this full multi-date booking anytime.
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCopy(masterGroupId, 'master')}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-300 dark:border-emerald-700 transition cursor-pointer shadow-xs self-start sm:self-auto"
              >
                {copiedId === 'master' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-emerald-700" />
                )}
                <span>{copiedId === 'master' ? 'Copied Master ID' : 'Copy Master ID'}</span>
              </motion.button>
            </div>

            {/* Guest & Schedule Stat Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-white/90 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Customer</span>
                <span className="font-black text-slate-900 dark:text-white flex items-center space-x-1 mt-0.5 truncate">
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{first.customerName}</span>
                </span>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Phone</span>
                <span className="font-black text-slate-900 dark:text-white flex items-center space-x-1 mt-0.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{first.phoneNumber}</span>
                </span>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Date Range</span>
                <span className="font-black text-slate-900 dark:text-white flex items-center space-x-1 mt-0.5 truncate">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{formatDisplayDate(first.date, { short: true })} – {formatDisplayDate(last.date, { short: true })}</span>
                </span>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Status Overview</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{confirmedCount} Confirmed {cancelledCount > 0 ? `· ${cancelledCount} Cancelled` : ''}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAllIds}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'All IDs Copied' : 'Copy All Session IDs'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppFullSchedule}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer border border-emerald-300 dark:border-emerald-800"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Full Schedule</span>
              </button>

              <button
                type="button"
                onClick={handlePrintFullSchedule}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 rounded-xl text-xs font-bold transition cursor-pointer border border-sky-300 dark:border-sky-800"
              >
                <Printer className="w-3.5 h-3.5 text-sky-600" />
                <span>Print Schedule Pass</span>
              </button>
            </div>

            {confirmedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-300 dark:border-rose-800"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Cancel Entire Month</span>
              </button>
            )}
          </div>

          {/* Cancellation Confirmation Sub-Dialog */}
          <AnimatePresence>
            {showCancelConfirmation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800 space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-rose-950 dark:text-rose-200">
                      Cancel all active sessions in this schedule?
                    </h4>
                    <p className="text-xs text-rose-800 dark:text-rose-300">
                      This will cancel all {confirmedCount} active sessions for {first.customerName} across all booked dates in Google Sheets and release all time slots.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-300 mb-1">
                    Reason for Cancellation:
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-semibold focus:outline-none"
                    placeholder="e.g. Schedule ended, employee reassigned, camp operations"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirmation(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Keep Schedule
                  </button>
                  <button
                    type="button"
                    disabled={isCancellingAll}
                    onClick={handleCancelEntireSchedule}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                  >
                    {isCancellingAll ? (
                      <span>Cancelling All...</span>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Confirm Cancel All Sessions</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chronological List of All Sessions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <span>All Scheduled Sessions ({bookings.length})</span>
              <span>Session ID &amp; Actions</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {bookings.map((booking, idx) => {
                const isConfirmed = booking.status === 'CONFIRMED';
                return (
                  <div
                    key={booking.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isConfirmed
                        ? 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs text-slate-950 dark:text-white">
                            {formatDisplayDate(booking.date)}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>{formatDisplayTime(booking.startTime)} – {formatDisplayTime(booking.endTime)}</span>
                          </span>
                          <span>·</span>
                          <span>{booking.stage}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-cyan-400">
                        {booking.id}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(booking.id, booking.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        title="Copy Session ID"
                      >
                        {copiedId === booking.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBookingForA4(booking)}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 rounded-lg text-[11px] font-bold border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                        title="Print A4 Admission Form for this Date"
                      >
                        A4 Pass
                      </button>

                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleCancelSingleSession(booking)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                          title="Cancel only this date"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Individual A4 Print Modal if requested */}
      {selectedBookingForA4 && (
        <BookingAdmissionPrintModal
          isOpen={true}
          onClose={() => setSelectedBookingForA4(null)}
          booking={selectedBookingForA4}
        />
      )}
    </>
  );
};

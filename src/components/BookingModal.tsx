import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  Users,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Facility, TimeSlot, Booking } from '../types';
import { StorageService, formatDisplayTime, generateBookingId, formatDisplayDate, normalizeDateString } from '../services/storageService';
import { GasService } from '../services/gasService';
import { FacilityLockdownService } from '../services/facilityLockdownService';
import { AuthService } from '../services/authService';
import { getFacilityGraphic } from './FacilityGraphics';
import { audioFeedback } from '../services/audioFeedbackService';
import { ActionFeedback } from '../services/actionFeedbackService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: Facility;
  stage: string;
  date: string;
  selectedSlots: TimeSlot[];
  customOptions?: Record<string, any>;
  onBookingSuccess: (newBooking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  facility,
  stage,
  date,
  selectedSlots,
  customOptions = {},
  onBookingSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookedByStaff, setBookedByStaff] = useState('');
  const [email, setEmail] = useState('');
  const [departmentOrTeam, setDepartmentOrTeam] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || selectedSlots.length === 0) return null;

  // Calculate start and end times from selected slots
  const sorted = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const startTime = sorted[0].startTime;
  const endTime = sorted[sorted.length - 1].endTime;

  // Calculate total minutes
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);

  const previewBookingId = generateBookingId(facility.code);

  // Derive specialized facility summary notes
  const getSpecializedSummary = () => {
    const opts = (customOptions || {}) as Record<string, any>;
    const parts: string[] = [];
    if (facility.id === 'barber-booking' && opts.barberService) {
      parts.push(`Service: ${opts.barberService}`);
    }
    if (facility.id === 'cricket-ground') {
      if (opts.cricketFormat) parts.push(`Format: ${opts.cricketFormat}`);
      if (opts.cricketBallType) parts.push(`Ball: ${opts.cricketBallType}`);
      if (opts.cricketUmpire) parts.push(`Umpire: Requested`);
      if (opts.cricketFloodlights) parts.push(`Floodlights: Active`);
    }
    if (facility.id === 'football-ground') {
      if (opts.footballFormat) parts.push(`Match: ${opts.footballFormat}`);
      if (opts.footballBibs) parts.push(`Bibs: Yes`);
      if (opts.footballReferee) parts.push(`Referee: Requested`);
    }
    if (facility.id === 'cinema') {
      if (opts.cinemaType) parts.push(`Screening: ${opts.cinemaType}`);
      if (opts.cinemaSeats && opts.cinemaSeats.length > 0) parts.push(`Seats: ${opts.cinemaSeats.join(', ')}`);
      if (opts.cinemaRefreshments && opts.cinemaRefreshments.length > 0) parts.push(`Snacks: ${opts.cinemaRefreshments.join(', ')}`);
      else if (opts.cinemaPopcorn) parts.push(`Popcorn: Included`);
    }
    if (facility.id === 'cricket-net' && opts.netBowlingSpeed) {
      parts.push(`Machine Speed: ${opts.netBowlingSpeed}`);
    }
    if (facility.id === 'multipurpose-room' && opts.roomLayout) {
      parts.push(`Layout: ${opts.roomLayout}`);
    }
    if (facility.id === 'tennis-court') {
      if (opts.tennisSurface) parts.push(`Match: ${opts.tennisSurface === 'doubles' ? 'Doubles' : 'Singles'}`);
      if (opts.tennisBallMachine) parts.push(`Ball Machine: Requested`);
      if (opts.tennisRackets) parts.push(`Rackets: Checkout`);
    }
    if (facility.id === 'basketball-court') {
      if (opts.basketMode) parts.push(`Mode: ${opts.basketMode === 'half' ? '3v3 Half Court' : opts.basketMode === 'shootout' ? 'Shooting Drill' : '5v5 Full Court'}`);
      if (opts.basketBall) parts.push(`Basketballs: Checkout`);
      if (opts.basketTimer) parts.push(`Shot Clock: Active`);
    }
    return parts.join(' | ');
  };

  const specializedSummary = getSpecializedSummary();

  const handleQuickNote = (tag: string) => {
    if (notes.includes(tag)) return;
    setNotes((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Enforce Staff RBAC Authority & Venue Clearance
    if (!AuthService.canCreateBookings(facility.id)) {
      setErrorMessage(`Access Denied: Your staff account does not have clearance to issue bookings for ${facility.name}.`);
      return;
    }

    const lockdownStatus = FacilityLockdownService.isFacilityBlocked(facility.id);
    if (lockdownStatus.isBlocked) {
      const unlockTimeStr = lockdownStatus.lockdown?.unlockAt
        ? new Date(lockdownStatus.lockdown.unlockAt).toLocaleTimeString()
        : 'further notice';
      setErrorMessage(
        `Facility Lockdown Active: ${lockdownStatus.lockdown?.reason || 'Maintenance'}. Reservations are suspended until ${unlockTimeStr}.`
      );
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter Customer or Team Leader Name.');
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length < 7) {
      setErrorMessage('Please enter a valid Phone Number for booking confirmation and SMS alerts.');
      return;
    }

    // Strict Google Sheets Check:
    const gasCfg = GasService.getConfig();
    if (!gasCfg.webAppUrl || !gasCfg.webAppUrl.trim()) {
      setErrorMessage(
        'Google Sheet is not connected. Please click "Backend & Sync" and configure your Google Apps Script Web App URL.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const slotIds = sorted.map((s) => s.id);
      const combinedNotes = [specializedSummary, notes.trim()].filter(Boolean).join(' - ');

      const bookingPayload = {
        facilityId: facility.id,
        facilityName: facility.name,
        sheetTabName: facility.sheetTabName,
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        bookedByStaff: bookedByStaff.trim() || undefined,
        email: email.trim() || undefined,
        departmentOrTeam: departmentOrTeam.trim() || undefined,
        date: normalizeDateString(date),
        stage,
        startTime,
        endTime,
        durationMinutes: totalMinutes > 0 ? totalMinutes : facility.defaultSlotDurationMinutes,
        slotIds,
        numberOfGuests: Math.max(1, numberOfGuests),
        notes: combinedNotes || undefined,
      };

      // 1. Create booking in local store
      const result = StorageService.createBooking(bookingPayload);

      if (!result.success || !result.booking) {
        setErrorMessage(result.error || 'Failed to create booking. Please try another slot.');
        setIsSubmitting(false);
        return;
      }

      // 2. Push immediately to remote Google Sheet
      const remoteRes = await GasService.pushBookingToRemote(result.booking);
      
      if (!remoteRes.success) {
        StorageService.cancelBooking(result.booking.id, result.booking.phoneNumber);
        setErrorMessage(
          `Google Sheet Connection Error: ${remoteRes.error || 'Google Sheet unreachable'}. Unable to save booking to Google Sheet. Please check "Backend & Sync".`
        );
        setIsSubmitting(false);
        return;
      }

      // Background sync
      GasService.syncWithRemote().catch((e) => console.warn('Background post-booking sync:', e));

      // Trigger Confetti Celebration & Audio Chime
      try {
        audioFeedback.playSuccessChime();
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        // Safe fallback
      }

      setIsSubmitting(false);
      onBookingSuccess(result.booking);

      ActionFeedback.showSuccess({
        title: 'Reservation Confirmed!',
        subtitle: `${facility.name} booked for ${customerName || 'Guest'}`,
        referenceCode: result.booking.id,
        facilityName: facility.name,
        facilityId: facility.id,
        details: [
          { label: 'Venue', value: facility.name },
          { label: 'Date', value: date },
          { label: 'Time Window', value: `${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)}` },
          { label: 'Reserved For', value: customerName },
        ],
        primaryActionLabel: 'View Booking Pass',
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred during reservation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-5 sm:p-7 relative transition-colors"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Vector Graphic */}
        <div className="flex items-start justify-between gap-4 pr-10">
          <div className="flex items-start space-x-3.5 sm:space-x-4">
            <div className="shrink-0 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-950 dark:to-slate-900 border-2 border-sky-200 dark:border-slate-800 shadow-md flex items-center justify-center">
              {getFacilityGraphic(facility.id, 'w-13 h-13 sm:w-18 sm:h-18 md:w-20 md:h-20 drop-shadow-md')}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-gradient-to-r from-sky-500/15 to-blue-500/15 dark:from-sky-500/25 dark:to-blue-500/25 border border-sky-300 dark:border-sky-500/40 text-sky-800 dark:text-sky-300 rounded-lg text-[11px] font-black uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>Executive Reservation</span>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                {facility.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Enter booking details to register this time slot.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Slot Summary Card */}
        <div className="bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-2 border-sky-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          {specializedSummary && (
            <div className="bg-white/90 dark:bg-sky-950/60 border-2 border-sky-200 dark:border-sky-500/30 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs shadow-2xs">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Configuration:</span>
              <span className="text-sky-700 dark:text-sky-300 font-black">{specializedSummary}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border-2 border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider block">Resource / Stage</span>
              <span className="text-slate-950 dark:text-white font-black block truncate text-xs mt-0.5">{stage}</span>
              <span className="text-sky-600 dark:text-sky-400 block truncate text-[11px] font-bold">{facility.name}</span>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border-2 border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider block">Selected Date</span>
              <span className="text-slate-950 dark:text-white font-black flex items-center space-x-1 mt-0.5 text-xs truncate">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>{formatDisplayDate(date)}</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border-2 border-slate-200/80 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider block">Time Slot</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center space-x-1 mt-0.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{formatDisplayTime(startTime)} – {formatDisplayTime(endTime)}</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold block mt-0.5">({totalMinutes} mins duration)</span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-500/40 rounded-2xl text-xs text-red-800 dark:text-red-300 flex items-start space-x-2.5 font-bold shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-sky-500/15 font-bold shadow-2xs transition-all"
                />
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-sky-500/15 font-bold shadow-2xs transition-all"
                />
                <Phone className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Booked By (Helpdesk / Staff No) */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Booked By (Staff / Desk)</span>
                <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bookedByStaff}
                  onChange={(e) => setBookedByStaff(e.target.value)}
                  placeholder="Staff name / ID (optional)"
                  className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 font-bold shadow-2xs transition-all"
                />
                <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com (optional)"
                  className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 font-bold shadow-2xs transition-all"
                />
                <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Department or Team */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Department / Team
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={departmentOrTeam}
                  onChange={(e) => setDepartmentOrTeam(e.target.value)}
                  placeholder="Department / Team name"
                  className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 font-bold shadow-2xs transition-all"
                />
                <Building className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Number of Guests with Quick Stepper */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Number of Guests</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Max: {facility.capacityPerSlot}</span>
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max={facility.capacityPerSlot}
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(Math.max(1, Math.min(facility.capacityPerSlot, parseInt(e.target.value, 10) || 1)))}
                    className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white font-bold shadow-2xs focus:outline-none focus:border-sky-500"
                  />
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setNumberOfGuests((prev) => Math.max(1, prev - 1))}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumberOfGuests((prev) => Math.min(facility.capacityPerSlot, prev + 1))}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Booking ID Indicator */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Generated Booking Reference ID
              </label>
              <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-2 border-sky-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono font-black text-sky-800 dark:text-sky-300 flex items-center justify-between shadow-2xs">
                <span>{previewBookingId}</span>
                <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-sans font-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Auto-Secured</span>
                </span>
              </div>
            </div>
          </div>

          {/* Notes / Special Requests & Quick Tag Buttons */}
          <div>
            <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Special Requests &amp; Notes</span>
              <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter additional notes or special requests (optional)..."
                className="w-full bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 font-bold shadow-2xs transition-all"
              />
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3 top-3" />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Quick Tags:</span>
              {['VIP Guest', 'Needs Equipment', 'Official Match', 'High Priority', 'Beverages'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleQuickNote(tag)}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons with Spring Animation */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-slate-100 dark:border-slate-800">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-black transition border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: AuthService.canCreateBookings() ? 1.03 : 1 }}
              whileTap={{ scale: AuthService.canCreateBookings() ? 0.97 : 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              type="submit"
              disabled={isSubmitting || !AuthService.canCreateBookings()}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/35 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {!AuthService.canCreateBookings()
                  ? 'Restricted: Read-Only Role'
                  : isSubmitting
                  ? 'Securing Slot in Google Sheets...'
                  : 'Confirm & Generate Pass'}
              </span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};


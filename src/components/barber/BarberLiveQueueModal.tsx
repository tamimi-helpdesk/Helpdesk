import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Tv,
  X,
  Play,
  UserCheck,
  UserX,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking, Facility } from '../../types';
import { StorageService, getTodayDateString } from '../../services/storageService';

interface BarberLiveQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings?: Booking[];
  facility?: Facility;
  onUpdateBookingStatus?: (bookingId: string, newStatus: string) => void;
}

export const BarberLiveQueueModal: React.FC<BarberLiveQueueModalProps> = ({
  isOpen,
  onClose,
  bookings: propBookings,
  facility,
  onUpdateBookingStatus,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [localBookings, setLocalBookings] = useState<Booking[]>(() => propBookings || StorageService.getAllBookings());

  // Keep local bookings in sync with props and external updates
  useEffect(() => {
    if (propBookings) {
      setLocalBookings(propBookings);
    } else {
      setLocalBookings(StorageService.getAllBookings());
    }
  }, [propBookings, isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalBookings(StorageService.getAllBookings());
    };
    window.addEventListener('tamimi_bookings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tamimi_bookings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Keep live time ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter barber bookings for today using timezone-immune local date
  const todayStr = getTodayDateString();
  const barberBookings = localBookings
    .filter((b) => (b.facilityId === 'barber-booking' || b.facilityId === 'barber') && b.date === todayStr && b.status !== 'CANCELLED')
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Active serving chairs (first 2 confirmed/in-progress)
  const servingChairs = [
    {
      chairNumber: 1,
      barberName: 'Master Stylist (Chair 1)',
      currentBooking: barberBookings[0] || null,
    },
    {
      chairNumber: 2,
      barberName: 'Express Grooming (Chair 2)',
      currentBooking: barberBookings[1] || null,
    },
  ];

  const upNextQueue = barberBookings.slice(2);

  // Play auditory alert for calling next customer
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime unavailable', e);
    }
  };

  const handleCallNext = (booking: Booking) => {
    playChime();
    StorageService.updateBookingStatus(booking.id, 'IN_PROGRESS');
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, 'IN_PROGRESS');
    }
    setLocalBookings(StorageService.getAllBookings());
    window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
  };

  const handleMarkNoShow = (bookingId: string) => {
    StorageService.updateBookingStatus(bookingId, 'CANCELLED');
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(bookingId, 'CANCELLED');
    }
    setLocalBookings(StorageService.getAllBookings());
    window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
  };

  const handleComplete = (bookingId: string) => {
    StorageService.updateBookingStatus(bookingId, 'COMPLETED');
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(bookingId, 'COMPLETED');
    }
    setLocalBookings(StorageService.getAllBookings());
    window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="barber-tv-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full text-white shadow-2xl flex flex-col overflow-hidden ${
            isFullscreen ? 'fixed inset-0 rounded-none z-50' : 'max-w-6xl max-h-[92vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b-2 border-amber-500/30 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide">
                    SALON LIVE QUEUE DISPLAY
                  </h2>
                  <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full animate-pulse">
                    LIVE TV MODE
                  </span>
                </div>
                <p className="text-xs text-amber-300/80 font-medium">
                  Tamimi Camp Executive Barber Shop • Real-Time Resident Queue
                </p>
              </div>
            </div>

            {/* Time & Controls */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Current Time</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <button
                id="btn-toggle-fullscreen-barber"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen TV Mode'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <button
                id="btn-close-barber-tv"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
            {/* Left 2 Cols: Currently Serving Chairs */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                  <Tv className="w-4 h-4" />
                  <span>NOW SERVING (ACTIVE STATIONS)</span>
                </h3>
                <span className="text-xs text-slate-400">2 Chairs Operational</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {servingChairs.map((chair) => (
                  <div
                    key={chair.chairNumber}
                    className="bg-slate-800/80 border-2 border-amber-500/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg"
                  >
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl font-mono">
                      STATION #{chair.chairNumber}
                    </div>

                    <div>
                      <span className="text-xs text-amber-400 font-bold tracking-wide">{chair.barberName}</span>
                      {chair.currentBooking ? (
                        <div className="mt-4 space-y-2">
                          <div className="text-xl sm:text-2xl font-black text-white">
                            {chair.currentBooking.customerName}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg border border-slate-700 font-mono">
                              Phone: {chair.currentBooking.phoneNumber || 'Resident'}
                            </span>
                            <span className="px-2.5 py-1 bg-amber-950/60 text-amber-300 rounded-lg border border-amber-500/40 font-bold">
                              Slot: {chair.currentBooking.startTime} - {chair.currentBooking.endTime}
                            </span>
                            {chair.currentBooking.departmentOrTeam && (
                              <span className="px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg border border-slate-700 font-mono">
                                Dept: {chair.currentBooking.departmentOrTeam}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Service Status</span>
                            <span className="text-emerald-400 font-bold flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                              In Chair / Grooming
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-8 text-center py-6 border-2 border-dashed border-slate-700 rounded-xl">
                          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-400">Station Available / Next Up</p>
                          <p className="text-xs text-slate-500 mt-1">Ready for next queue resident</p>
                        </div>
                      )}
                    </div>

                    {chair.currentBooking && (
                      <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleComplete(chair.currentBooking!.id)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finished</span>
                        </button>
                        <button
                          onClick={() => handleMarkNoShow(chair.currentBooking!.id)}
                          className="py-2 px-3 bg-red-900/60 hover:bg-red-800 text-red-300 text-xs font-bold rounded-xl transition border border-red-700 flex items-center justify-center space-x-1 cursor-pointer"
                          title="Resident did not show up"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>No-Show</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Live Ticker Bar */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-200 font-medium">
                    Audio announcement chime is active. Please proceed to the assigned chair when your name is called.
                  </span>
                </div>
                <button
                  onClick={playChime}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg hover:bg-amber-400 transition cursor-pointer shrink-0"
                >
                  Test Chime 🔔
                </button>
              </div>
            </div>

            {/* Right Col: Up Next Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>NEXT IN QUEUE ({upNextQueue.length})</span>
                </h3>
                <span className="text-xs text-slate-400">Est. Wait: 15-30m</span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {upNextQueue.length === 0 ? (
                  <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold">Queue is Clear</p>
                    <p className="text-xs text-slate-500 mt-1">No upcoming appointments in line</p>
                  </div>
                ) : (
                  upNextQueue.map((booking, idx) => (
                    <div
                      key={booking.id}
                      className="bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/50 rounded-xl p-3.5 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-black text-xs flex items-center justify-center font-mono shrink-0">
                          #{idx + 3}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-white">
                              {booking.customerName}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              ~{(idx + 1) * 15}m wait
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span className="text-amber-400 font-bold font-mono">⏰ {booking.startTime} - {booking.endTime}</span>
                            <span>•</span>
                            <span>Phone: {booking.phoneNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {booking.phoneNumber && (
                          <button
                            onClick={() => {
                              const cleanPhone = (booking.phoneNumber || '').replace(/[^0-9]/g, '');
                              const msg = encodeURIComponent(
                                `Hello ${booking.customerName}, your salon grooming turn at TAMIMI Barber Shop is ready soon! You are #${idx + 3} in line (Est. wait: ~${(idx + 1) * 15} mins). Please proceed to the salon.`
                              );
                              window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold rounded-lg border border-emerald-500/40 transition flex items-center space-x-1 cursor-pointer"
                            title="Alert on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCallNext(booking)}
                          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold rounded-lg border border-amber-500/40 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Call</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

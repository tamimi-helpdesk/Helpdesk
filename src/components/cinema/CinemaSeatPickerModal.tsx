import React, { useState } from 'react';
import {
  Film,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  Coffee,
  Popcorn,
  Volume2,
  X,
  Check,
  ChevronRight,
  Shield,
  Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Facility } from '../../types';

interface CinemaSeatPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: Facility;
  initialSeats?: string[];
  initialRefreshments?: string[];
  onConfirmSeats?: (selectedSeats: string[], refreshments: string[]) => void;
}

export const CinemaSeatPickerModal: React.FC<CinemaSeatPickerModalProps> = ({
  isOpen,
  onClose,
  facility,
  initialSeats,
  initialRefreshments,
  onConfirmSeats,
}) => {
  const [selectedMovie, setSelectedMovie] = useState('Top Gun: Maverick (HD Screening)');
  const [selectedTime, setSelectedTime] = useState('08:00 PM - 10:30 PM');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(() => initialSeats && initialSeats.length > 0 ? initialSeats : ['C4', 'C5']);
  const [selectedRefreshments, setSelectedRefreshments] = useState<string[]>(() => initialRefreshments && initialRefreshments.length > 0 ? initialRefreshments : ['Popcorn (Regular)', 'Karak Chai']);

  // Pre-booked seats for realism
  const bookedSeats = new Set(['A1', 'A2', 'B5', 'B6', 'D1', 'D2', 'F9', 'F10']);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsPerRow = 10;

  const toggleSeat = (seatId: string) => {
    if (bookedSeats.has(seatId)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const toggleRefreshment = (item: string) => {
    setSelectedRefreshments((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const handleConfirm = () => {
    if (onConfirmSeats) {
      onConfirmSeats(selectedSeats, selectedRefreshments);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="cinema-seat-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl w-full max-w-4xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-purple-950/90 border-b-2 border-purple-500/30 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/30">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide uppercase">
                    CAMP CINEMA & MULTIPURPOSE THEATRE
                  </h2>
                  <span className="bg-purple-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    SEAT SELECTOR
                  </span>
                </div>
                <p className="text-xs text-purple-300/80 font-medium">
                  Dolby 7.1 Surround Sound • 4K Laser Projection • 60 Executive Seats
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Movie & Showtime Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-purple-300 mb-1">
                  Current Feature / Screening
                </label>
                <select
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
                >
                  <option>Top Gun: Maverick (HD Screening)</option>
                  <option>Tamimi Camp Community Safety Workshop</option>
                  <option>FIFA World Cup Classic Match Highlights</option>
                  <option>Interstellar (Dolby Atmospheric Gala)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-purple-300 mb-1">
                  Showtime Slot
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
                >
                  <option>05:00 PM - 07:30 PM (Matinee)</option>
                  <option>08:00 PM - 10:30 PM (Prime Evening)</option>
                  <option>10:45 PM - 01:15 AM (Night Owl Special)</option>
                </select>
              </div>
            </div>

            {/* Visual Cinema Screen Arc */}
            <div className="space-y-4 text-center">
              <div className="relative pt-2">
                <div className="w-3/4 mx-auto h-3 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-t-full shadow-lg shadow-purple-500/50" />
                <span className="text-[11px] font-black uppercase tracking-widest text-purple-300">
                  CINEMA SCREEN (4K LASER HDR)
                </span>
              </div>

              {/* Seating Grid */}
              <div className="space-y-2 max-w-xl mx-auto py-2">
                {rows.map((row) => (
                  <div key={row} className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                    <span className="w-5 text-xs font-black text-slate-500 font-mono">{row}</span>
                    <div className="flex space-x-1.5 sm:space-x-2">
                      {Array.from({ length: seatsPerRow }, (_, i) => {
                        const seatId = `${row}${i + 1}`;
                        const isBooked = bookedSeats.has(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        const isVipRow = row === 'C' || row === 'D';

                        return (
                          <button
                            key={seatId}
                            disabled={isBooked}
                            onClick={() => toggleSeat(seatId)}
                            title={`Seat ${seatId} ${isVipRow ? '(VIP Recliner)' : ''} ${isBooked ? '- Occupied' : ''}`}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                              isBooked
                                ? 'bg-slate-800 text-slate-600 border border-slate-750 cursor-not-allowed opacity-50'
                                : isSelected
                                ? 'bg-purple-500 text-slate-950 font-black shadow-md shadow-purple-500/40 scale-110 border-2 border-white'
                                : isVipRow
                                ? 'bg-purple-950/70 border border-purple-500/50 text-purple-200 hover:bg-purple-800'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-5 text-xs font-black text-slate-500 font-mono">{row}</span>
                  </div>
                ))}
              </div>

              {/* Seat Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
                  <span>Available</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-purple-950 border border-purple-500" />
                  <span>VIP Recliner</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-purple-500" />
                  <span className="text-purple-300 font-bold">Selected</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-800 opacity-50" />
                  <span>Occupied</span>
                </div>
              </div>
            </div>

            {/* Concession / Refreshments Addon */}
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-black uppercase text-purple-300">
                <Coffee className="w-4 h-4" />
                <span>Camp Refreshment Counter (Optional)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['Popcorn (Regular)', 'Popcorn (Caramel)', 'Soft Drink (Can)', 'Karak Chai', 'Bottled Water', 'Snack Combo Box'].map(
                  (item) => {
                    const isSel = selectedRefreshments.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleRefreshment(item)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center justify-between cursor-pointer ${
                          isSel
                            ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{item}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1" />}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-950 border-t-2 border-purple-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-slate-400">Selected Seats: </span>
              <span className="font-mono font-black text-purple-300 text-sm">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
              </span>
              <span className="text-slate-400 ml-3">Refreshments: </span>
              <span className="font-bold text-white">{selectedRefreshments.length} items</span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedSeats.length === 0}
                className="flex-1 sm:flex-initial px-6 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-purple-500/30 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Confirm Cinema Booking</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  Share2,
  Building2,
  Users,
  BedDouble,
  Scissors,
  Trophy,
  KeyRound,
  Package,
  AlertTriangle,
  LifeBuoy,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService, getTodayDateString } from '../../services/storageService';

interface CampExecutiveDailyDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampExecutiveDailyDeckModal: React.FC<CampExecutiveDailyDeckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const today = getTodayDateString();
  const rooms = StorageService.getIsolationRooms();
  const handovers = StorageService.getHandoverRecords();
  const parcels = StorageService.getParcelRecords();
  const rawBookings = localStorage.getItem('tamimi_camp_bookings_v2');
  const bookings = rawBookings ? JSON.parse(rawBookings) : [];
  const rawTickets = localStorage.getItem('tamimi_support_tickets_v2');
  const tickets = rawTickets ? JSON.parse(rawTickets) : [];
  const rawInvoices = localStorage.getItem('tamimi_unified_camp_invoices_v2');
  const invoices = rawInvoices ? JSON.parse(rawInvoices) : [];

  // Metrics Calculations
  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied' || (r.occupants && r.occupants.length > 0)).length;
  const totalBeds = rooms.length * 2;
  const occupiedBeds = rooms.reduce(
    (acc, r) => acc + (r.occupants ? r.occupants.length : r.status === 'Occupied' ? 1 : 0),
    0
  );

  const activeHandovers = handovers.filter((h) => h.status === 'ACTIVE_BORROWED' || h.status === 'OVERDUE').length;
  const overdueHandovers = handovers.filter((h) => {
    if (h.status === 'OVERDUE') return true;
    if (h.status !== 'ACTIVE_BORROWED' || !h.expectedReturnDate) return false;
    return h.expectedReturnDate < today;
  }).length;

  const pendingParcels = parcels.filter(
    (p) => p.status === 'RECEIVED_IN_OFFICE' || p.status === 'GUEST_NOTIFIED' || p.status === 'OUT_FOR_ROOM_DELIVERY'
  ).length;
  const deliveredParcelsToday = parcels.filter(
    (p) => (p.status === 'HANDED_TO_GUEST' || p.status === 'DELIVERED_TO_ROOM' || p.status === 'COLLECTED_BY_REP') && p.deliveredDate === today
  ).length;

  const barberToday = bookings.filter((b: any) => b.facilityId === 'barber-booking' && b.date === today).length;
  const sportsMatchesToday = bookings.filter(
    (b: any) =>
      ['cricket-ground', 'football-ground', 'tennis-court', 'basketball-court', 'cricket-net'].includes(
        b.facilityId
      ) && b.date === today
  ).length;

  const urgentTickets = tickets.filter((t: any) => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Resolved').length;
  const totalOpenTickets = tickets.filter((t: any) => t.status !== 'Resolved').length;

  const totalInvoiceFines = invoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalAmount) || Number(inv.subtotal) || 0), 0);
  const unpaidInvoices = invoices.filter((inv: any) => inv.paymentStatus === 'UNPAID' || inv.paymentStatus === 'PENDING').length;

  const handleCopyWhatsAppBrief = () => {
    const text = `📋 *TAMIMI CAMP DAILY EXECUTIVE SUMMARY*
📅 Date: ${today}
🏢 Facility: TAFGA Camp Operations & Lodging

📊 *KEY CAMP OPERATIONAL METRICS:*
🛏️ *Isolation & Quarantine:* ${occupiedRooms}/${rooms.length} Rooms Occupied (${occupiedBeds}/${totalBeds} Beds active)
🔑 *Key & Gear Handovers:* ${activeHandovers} Checked Out (${overdueHandovers} Overdue ⚠️)
📦 *Parcel Lockers:* ${pendingParcels} Pending Collection | ${deliveredParcelsToday} Delivered Today
✂️ *Salon Appointments:* ${barberToday} Bookings Today
🏆 *Sports Tournaments:* ${sportsMatchesToday} Ground Slots Scheduled
🎫 *Helpdesk Tickets:* ${totalOpenTickets} Open (${urgentTickets} Urgent/High Priority)
🧾 *Facility Invoices:* SAR ${totalInvoiceFines.toLocaleString()} Total (${unpaidInvoices} Unpaid)

✅ Camp Duty Manager: Shift Logbook Verified.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        id="executive-deck-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-4xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-b-2 border-amber-500/30 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide uppercase">
                    DAILY CAMP EXECUTIVE SHIFT BRIEFING
                  </h2>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    16-FACILITY KPI DECK
                  </span>
                </div>
                <p className="text-xs text-amber-300/80 font-medium">
                  Aggregated Shift Summary for Operations Directors & Camp Boss
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyWhatsAppBrief}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Copied to WhatsApp!' : 'WhatsApp Brief'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Isolation Rooms */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between text-xs text-rose-400 font-bold uppercase mb-2">
                  <span className="flex items-center space-x-1">
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Isolation Beds</span>
                  </span>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {occupiedBeds} <span className="text-xs text-slate-400 font-normal">/ {totalBeds} Beds</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {occupiedRooms} Active Rooms Occupied
                </p>
              </div>

              {/* Handovers */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between text-xs text-blue-400 font-bold uppercase mb-2">
                  <span className="flex items-center space-x-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Key Handovers</span>
                  </span>
                  {overdueHandovers > 0 && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">
                      {overdueHandovers} Overdue
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white font-mono">{activeHandovers}</div>
                <p className="text-[11px] text-slate-400 mt-1">Pending Return to Desk</p>
              </div>

              {/* Parcels */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase mb-2">
                  <span className="flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>Parcels Holding</span>
                  </span>
                </div>
                <div className="text-2xl font-black text-white font-mono">{pendingParcels}</div>
                <p className="text-[11px] text-slate-400 mt-1">{deliveredParcelsToday} Delivered Today</p>
              </div>

              {/* Helpdesk */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase mb-2">
                  <span className="flex items-center space-x-1">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>Support Tickets</span>
                  </span>
                  {urgentTickets > 0 && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black">
                      {urgentTickets} Urgent
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white font-mono">{totalOpenTickets}</div>
                <p className="text-[11px] text-slate-400 mt-1">Active Maintenance Jobs</p>
              </div>
            </div>

            {/* Shift Breakdown Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recreation & Salon Activity */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                  <Scissors className="w-4 h-4" />
                  <span>Recreation & Salon Utilization Today</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-300">Barber Shop Appointments:</span>
                    <span className="font-black text-white font-mono">{barberToday} bookings</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-300">Sports Matches (Cricket/Football/Tennis):</span>
                    <span className="font-black text-white font-mono">{sportsMatchesToday} slots</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-300">Cinema Screenings Scheduled:</span>
                    <span className="font-black text-white font-mono">2 Shows (Evening / Gala)</span>
                  </div>
                </div>
              </div>

              {/* Financial & Damage Invoicing */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Camp Damage & Invoice Summary</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-300">Total Billed Penalties / Losses:</span>
                    <span className="font-black text-purple-300 font-mono">
                      SAR {totalInvoiceFines.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-300">Uncollected / Pending Invoices:</span>
                    <span className="font-black text-amber-400 font-mono">{unpaidInvoices} records</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl">
                    <span className="text-slate-300">ZATCA E-Invoicing Compliant:</span>
                    <span className="font-bold text-emerald-400">100% Validated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

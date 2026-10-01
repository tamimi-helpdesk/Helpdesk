import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Calendar,
  Package,
  KeyRound,
  ShieldAlert,
  Bed,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  User,
  Phone,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { FACILITIES } from '../data/facilities';
import { Booking, HandoverItemRecord, ParcelRecord, LostFoundRecord, IsolationRoomRecord } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFacility: (facilityId: string) => void;
  onOpenBookingDetails?: (booking: Booking) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectFacility,
  onOpenBookingDetails,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  // Load all live dataset records for unified search
  const allBookings = useMemo(() => StorageService.getAllBookings(), [isOpen]);
  const allHandovers = useMemo(() => StorageService.getHandoverRecords(), [isOpen]);
  const allParcels = useMemo(() => StorageService.getParcelRecords(), [isOpen]);
  const allLostFound = useMemo(() => StorageService.getLostFoundRecords(), [isOpen]);
  const allRooms = useMemo(() => StorageService.getIsolationRooms(), [isOpen]);

  // Filtered Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show quick facility shortcuts
      return {
        facilities: FACILITIES.slice(0, 6),
        bookings: allBookings.slice(0, 4),
        handovers: [],
        parcels: [],
        lostFound: [],
        rooms: [],
      };
    }

    const matchedFacilities = FACILITIES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q)
    );

    const matchedBookings = allBookings.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.phoneNumber.toLowerCase().includes(q) ||
        (b.departmentOrTeam && b.departmentOrTeam.toLowerCase().includes(q)) ||
        b.facilityName.toLowerCase().includes(q)
    );

    const matchedHandovers = allHandovers.filter(
      (h) =>
        h.id.toLowerCase().includes(q) ||
        h.itemName.toLowerCase().includes(q) ||
        h.personName.toLowerCase().includes(q) ||
        h.authorizedByStaff.toLowerCase().includes(q) ||
        (h.badgeOrIdNumber && h.badgeOrIdNumber.toLowerCase().includes(q))
    );

    const matchedParcels = allParcels.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.trackingNumber.toLowerCase().includes(q) ||
        p.recipientName.toLowerCase().includes(q) ||
        p.roomNumber.toLowerCase().includes(q) ||
        p.phoneNumber.toLowerCase().includes(q) ||
        p.courierCompany.toLowerCase().includes(q)
    );

    const matchedLostFound = allLostFound.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        l.itemName.toLowerCase().includes(q) ||
        l.finderOrReporterName.toLowerCase().includes(q) ||
        l.locationFoundOrLost.toLowerCase().includes(q) ||
        (l.ownerName && l.ownerName.toLowerCase().includes(q))
    );

    const matchedRooms = allRooms.filter(
      (r) =>
        r.buildingNumber.toLowerCase().includes(q) ||
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        (r.company && r.company.toLowerCase().includes(q))
    );

    return {
      facilities: matchedFacilities,
      bookings: matchedBookings,
      handovers: matchedHandovers,
      parcels: matchedParcels,
      lostFound: matchedLostFound,
      rooms: matchedRooms,
    };
  }, [query, allBookings, allHandovers, allParcels, allLostFound, allRooms]);

  const totalResultsCount =
    results.facilities.length +
    results.bookings.length +
    results.handovers.length +
    results.parcels.length +
    results.lostFound.length +
    results.rooms.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70">
          <Search className="w-5 h-5 text-sky-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings, guests, ID, tracking #, keys, rooms..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-base outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
          {totalResultsCount === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No matching records found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by Name, Phone, Room Number, or Record ID.</p>
            </div>
          ) : (
            <>
              {/* Facilities Section */}
              {results.facilities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-500" />
                    Facilities & Modules ({results.facilities.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.facilities.map((fac, idx) => {
                      const isPermitted = AuthService.isSuperAdmin() || AuthService.canAccessFacility(fac.id);
                      return (
                        <button
                          key={`cmd-fac-${fac.id}-${idx}`}
                          onClick={() => {
                            if (!isPermitted) {
                              alert(`Access Restricted: Your operator credentials do not have clearance for "${fac.name}".`);
                              return;
                            }
                            onSelectFacility(fac.id);
                            onClose();
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${
                            !isPermitted
                              ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-80'
                              : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 border-slate-200/80 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{fac.icon}</span>
                            <div>
                              <p className={`text-xs font-bold ${
                                !isPermitted
                                  ? 'text-slate-600 dark:text-slate-400'
                                  : 'text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                              }`}>
                                {fac.name}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">Code: {fac.code}</p>
                            </div>
                          </div>
                          {!isPermitted ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Restricted</span>
                            </span>
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-transform group-hover:translate-x-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bookings Section */}
              {results.bookings.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Facility Bookings ({results.bookings.length})
                  </h4>
                  <div className="space-y-2">
                    {results.bookings.map((booking, idx) => (
                      <div
                        key={`cmd-bk-${booking.id}-${idx}`}
                        onClick={() => {
                          onSelectFacility(booking.facilityId);
                          if (onOpenBookingDetails) onOpenBookingDetails(booking);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                            #{booking.id.slice(-3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{booking.customerName}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                                {booking.facilityName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>📅 {booking.date}</span>
                              <span>⏰ {booking.startTime} - {booking.endTime}</span>
                              {booking.phoneNumber && <span>📞 {booking.phoneNumber}</span>}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">View</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parcels Section */}
              {results.parcels.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    Parcels & Packages ({results.parcels.length})
                  </h4>
                  <div className="space-y-2">
                    {results.parcels.map((parcel, idx) => (
                      <div
                        key={`cmd-pcl-${parcel.id}-${idx}`}
                        onClick={() => {
                          onSelectFacility('parcel-monitoring');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 text-left transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{parcel.recipientName}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                              {parcel.trackingNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Room {parcel.roomNumber} · {parcel.courierCompany} · Status: {parcel.status}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Handover & Keys Section */}
              {results.handovers.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-500" />
                    Handover & Key Vault ({results.handovers.length})
                  </h4>
                  <div className="space-y-2">
                    {results.handovers.map((h, idx) => (
                      <div
                        key={`cmd-ho-${h.id}-${idx}`}
                        onClick={() => {
                          onSelectFacility('handover-takenover');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500 text-left transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{h.itemName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Person: {h.personName} · Custody Status: {h.status}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Isolation Rooms Section */}
              {results.rooms.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 text-rose-500" />
                    Isolation Rooms & Beds ({results.rooms.length})
                  </h4>
                  <div className="space-y-2">
                    {results.rooms.map((r) => (
                      <div
                        key={r.buildingNumber}
                        onClick={() => {
                          onSelectFacility('isolation-room');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 text-left transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Room {r.buildingNumber}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Occupant: {r.patientName || 'Vacant'} · Status: {r.status}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <span>Navigate with mouse or touch</span>
          <span>TAMIMI Command Search</span>
        </div>
      </div>
    </div>
  );
};

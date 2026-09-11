import React, { useState } from 'react';
import {
  Bed,
  Building2,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  HeartPulse,
  User,
  CheckCircle2,
  Calendar,
  Phone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { IsolationRoomRecord, BedOccupant } from '../types';
import { getCheckoutStatus, CheckoutStatusInfo } from '../utils/checkoutUtils';
import { playBeep } from '../utils/audioFeedback';

interface RoomBedMatrixVisualizerProps {
  rooms: IsolationRoomRecord[];
  onSelectBed: (room: IsolationRoomRecord, bedNum: 1 | 2) => void;
  onOpenRoomHub: (room: IsolationRoomRecord, tab: 'checkin' | 'details' | 'checkout') => void;
}

export const RoomBedMatrixVisualizer: React.FC<RoomBedMatrixVisualizerProps> = ({
  rooms,
  onSelectBed,
  onOpenRoomHub,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<'ALL' | 'Building R' | 'Building B'>('ALL');

  const filteredRooms = rooms.filter((r) => {
    if (selectedBuilding !== 'ALL' && r.building !== selectedBuilding) return false;
    return true;
  });

  const getBedStatus = (bed: BedOccupant | null | undefined) => {
    if (!bed || !bed.patientName || !bed.patientName.trim()) {
      return { status: 'VACANT', label: 'Vacant Bed', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
    }
    const checkoutInfo: CheckoutStatusInfo = getCheckoutStatus(bed.checkOut);
    if (checkoutInfo.status === 'OVERDUE') {
      return { status: 'OVERDUE', label: `Overdue (${Math.abs(checkoutInfo.diffDays)}d)`, badgeClass: 'bg-rose-600 text-white font-extrabold animate-pulse' };
    }
    if (checkoutInfo.status === 'DUE_TODAY') {
      return { status: 'DUE_TODAY', label: 'Checkout Due Today', badgeClass: 'bg-amber-500 text-slate-950 font-black animate-pulse' };
    }
    if (checkoutInfo.status === 'DUE_SOON') {
      return { status: 'DUE_SOON', label: `Due in ${checkoutInfo.diffDays}d`, badgeClass: 'bg-sky-500 text-white font-bold' };
    }
    return { status: 'OCCUPIED', label: 'Occupied', badgeClass: 'bg-indigo-600 text-white font-bold' };
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bed className="w-5 h-5 text-indigo-600" />
            <span>Interactive Room &amp; Bed Occupancy Matrix</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time visual map of all 24 twin beds across Building R &amp; Building B.
          </p>
        </div>

        {/* Building selector pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedBuilding('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedBuilding === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Buildings
          </button>
          <button
            type="button"
            onClick={() => setSelectedBuilding('Building R')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedBuilding === 'Building R'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Building R
          </button>
          <button
            type="button"
            onClick={() => setSelectedBuilding('Building B')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedBuilding === 'Building B'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Building B
          </button>
        </div>
      </div>

      {/* Visual Bed Grid by Building */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRooms.map((room, rIdx) => {
          const bed1 = room.occupants?.find((o) => o.bedNumber === 1);
          const bed2 = room.occupants?.find((o) => o.bedNumber === 2);
          const bed1Info = getBedStatus(bed1);
          const bed2Info = getBedStatus(bed2);
          const isMedical = bed1?.bookingType === 'Medical Isolation' || bed2?.bookingType === 'Medical Isolation';
          const isBed1Occupied = Boolean(bed1?.patientName && bed1.patientName.trim());
          const isBed2Occupied = Boolean(bed2?.patientName && bed2.patientName.trim());

          return (
            <motion.div
              key={`matrix-room-${room.id || room.buildingNumber || rIdx}-${rIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border-2 p-3.5 transition-all shadow-xs ${
                isMedical
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              {/* Room Card Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {room.buildingNumber}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {room.building} - Room {room.buildingNumber}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Capacity: 2 Twin Beds
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playBeep(600, 40);
                    onOpenRoomHub(room, 'details');
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  Manage
                </button>
              </div>

              {/* Beds Pair Display */}
              <div className="grid grid-cols-2 gap-2">
                {/* Bed 1 */}
                <div
                  onClick={() => {
                    playBeep(isBed1Occupied ? 500 : 750, 40);
                    onSelectBed(room, 1);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${
                    isBed1Occupied
                      ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-500">Twin Bed 1</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${bed1Info.badgeClass}`}>
                      {bed1Info.label}
                    </span>
                  </div>

                  {isBed1Occupied && bed1 ? (
                    <div className="space-y-1">
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {bed1.patientName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {bed1.company || 'Resident'}
                      </div>
                      {bed1.checkOut && (
                        <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-indigo-500" />
                          <span>Out: {bed1.checkOut}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-emerald-700 dark:text-emerald-400">
                      <Bed className="w-4 h-4 mx-auto mb-0.5 opacity-60" />
                      <span className="text-[10px] font-bold">+ Quick Check-In</span>
                    </div>
                  )}
                </div>

                {/* Bed 2 */}
                <div
                  onClick={() => {
                    playBeep(isBed2Occupied ? 500 : 750, 40);
                    onSelectBed(room, 2);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${
                    isBed2Occupied
                      ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-500">Twin Bed 2</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${bed2Info.badgeClass}`}>
                      {bed2Info.label}
                    </span>
                  </div>

                  {isBed2Occupied && bed2 ? (
                    <div className="space-y-1">
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {bed2.patientName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {bed2.company || 'Resident'}
                      </div>
                      {bed2.checkOut && (
                        <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-indigo-500" />
                          <span>Out: {bed2.checkOut}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-emerald-700 dark:text-emerald-400">
                      <Bed className="w-4 h-4 mx-auto mb-0.5 opacity-60" />
                      <span className="text-[10px] font-bold">+ Quick Check-In</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CalendarCheck,
  Compass,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Facility } from '../types';
import { StorageService, formatDisplayDate } from '../services/storageService';
import { getFacilityGraphic, FACILITY_THEMES } from './FacilityGraphics';
import { getFacilityBanner } from '../data/facilityImages';
import { AuthService } from '../services/authService';
import { FacilityCustomizationService } from '../services/facilityCustomizationService';
import { audioFeedback } from '../services/audioFeedbackService';
import { ActionFeedback } from '../services/actionFeedbackService';

interface GroundStageSelectorProps {
  facility: Facility;
  selectedDate: string;
  onSelectStage: (stage: string) => void;
}

export const GroundStageSelector: React.FC<GroundStageSelectorProps> = ({
  facility,
  selectedDate,
  onSelectStage,
}) => {
  const theme = FACILITY_THEMES[facility.id] || FACILITY_THEMES['cricket-ground'];
  const bannerImage = getFacilityBanner(facility.id);
  const isSuperAdmin = AuthService.isSuperAdmin();

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const res = FacilityCustomizationService.addStage(facility.id, newStageName.trim());
    if (res.success) {
      setNewStageName('');
      setIsAddingStage(false);
      setFeedback(`Added "${newStageName.trim()}"`);
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteStage = (e: React.MouseEvent, stageName: string) => {
    e.stopPropagation();
    if (facility.stages.length <= 1) {
      alert('A facility must have at least one room/stage active.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${stageName}" from ${facility.name}?`)) {
      const res = FacilityCustomizationService.deleteStage(facility.id, stageName);
      if (res.success) {
        setFeedback(`Removed "${stageName}"`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(res.message);
        setTimeout(() => setFeedback(null), 3000);
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-lg shadow-slate-900/5 dark:shadow-2xl relative overflow-hidden transition-all duration-300 space-y-5">
      {/* Background Glow */}
      <div
        className="absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-25"
        style={{ backgroundColor: theme.accentGlow }}
      />
      <div className="absolute left-1/4 -bottom-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-10 bg-sky-500/20" />

      {/* Top Header: Clean Executive Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/90 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tracking-tight leading-none">
                Select Ground / Pitch
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {facility.name}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Choose a specific area to inspect schedule and available booking slots
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-start md:self-auto">
          <CalendarCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Date:{' '}
            <strong className="text-slate-950 dark:text-white font-bold">
              {formatDisplayDate(selectedDate, { short: true })}
            </strong>
          </span>
        </div>
      </div>

      {/* Stage / Ground Interactive Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4 relative z-10">
        {facility.stages.map((stageName) => {
          // Calculate specific availability for this stage on selected date
          const slotsForThisStage = StorageService.getFacilitySlots(facility, selectedDate, stageName);
          const availableCount = slotsForThisStage.filter((s) => s.status === 'AVAILABLE').length;
          const bookedCount = StorageService.getBookedCountForStage(facility, selectedDate, stageName);
          const totalSlots = slotsForThisStage.length;

          return (
            <motion.div
              key={stageName}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              onClick={() => {
                audioFeedback.playTap();
                ActionFeedback.startLoading(`Stage: ${stageName}`, `${facility.name} schedule`, facility.id, 280);
                onSelectStage(stageName);
              }}
              className="group flex flex-col justify-between p-4 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-400 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 relative overflow-hidden"
            >
              {/* Top Row: Stage Name & Availability Badge */}
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    {getFacilityGraphic(facility.id, 'w-9 h-9 sm:w-10 sm:h-10 drop-shadow-xs')}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {stageName}
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  {bookedCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {bookedCount} Booked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Open
                    </span>
                  )}
                  {isSuperAdmin && facility.stages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteStage(e, stageName)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition cursor-pointer"
                      title={`Delete "${stageName}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Center Details */}
              <div className="space-y-2 my-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] font-medium">
                    <Users className="w-3 h-3 text-indigo-500" />
                    <span>Max {facility.capacityPerSlot}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] font-medium">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    <span>{availableCount}/{totalSlots} Slots Free</span>
                  </div>
                </div>

                {facility.amenities && facility.amenities.length > 0 && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                    {facility.amenities.slice(0, 3).join(' · ')}
                  </div>
                )}
              </div>

              {/* Bottom Action CTA Button */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/90 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioFeedback.playTap();
                    ActionFeedback.startLoading(`Stage: ${stageName}`, `${facility.name} schedule`, facility.id, 280);
                    onSelectStage(stageName);
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Select & View Slots</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* If Super Administrator, render the "+ Add New Ground / Stage / Pitch" Card right here in-place */}
        {isSuperAdmin && (
          <div className="flex flex-col justify-between p-4 rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-700/60 bg-sky-50/40 dark:bg-sky-950/20 hover:border-sky-500 transition-all duration-200">
            {!isAddingStage ? (
              <button
                type="button"
                onClick={() => setIsAddingStage(true)}
                className="w-full h-full min-h-[140px] flex flex-col items-center justify-center space-y-2 text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">+ Add Ground / Room / Stage</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Super Admin In-Place Control
                </span>
              </button>
            ) : (
              <form onSubmit={handleAddStageSubmit} className="space-y-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                    Add Room / Pitch
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingStage(false);
                      setNewStageName('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Court 3, Pitch C, VIP Room"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-sky-300 dark:border-sky-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingStage(false);
                      setNewStageName('');
                    }}
                    className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

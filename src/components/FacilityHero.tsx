import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  Link2,
  ChevronLeft,
  Calendar,
  Sliders,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Facility } from '../types';
import { StorageService } from '../services/storageService';
import { getFacilityGraphic, FACILITY_THEMES } from './FacilityGraphics';
import { getFacilityBanner } from '../data/facilityImages';
import { FacilityLockdownService } from '../services/facilityLockdownService';
import { AuthService } from '../services/authService';
import { audioFeedback } from '../services/audioFeedbackService';
import { ActionFeedback } from '../services/actionFeedbackService';
import { FacilityCustomizationService } from '../services/facilityCustomizationService';

interface FacilityHeroProps {
  facility: Facility;
  selectedStage?: string;
  selectedDate?: string;
  onSelectStage?: (stage: string) => void;
  onReturnToDashboard?: () => void;
  onSyncTrigger?: () => void;
}

export const FacilityHero: React.FC<FacilityHeroProps> = ({
  facility,
  onReturnToDashboard,
}) => {
  const theme = FACILITY_THEMES[facility.id] || FACILITY_THEMES['cricket-ground'];
  const bannerImage = getFacilityBanner(facility.id);
  const lockdownStatus = FacilityLockdownService.isFacilityBlocked(facility.id);
  const isSuperAdmin = AuthService.isSuperAdmin();

  // In-Place Super Admin Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editOpenTime, setEditOpenTime] = useState(facility.openTime || '07:00');
  const [editCloseTime, setEditCloseTime] = useState(facility.closeTime || '23:00');
  const [editCapacity, setEditCapacity] = useState(facility.capacityPerSlot || 1);
  const [editStatus, setEditStatus] = useState<any>(facility.statusOverride || 'OPERATIONAL');
  const [editCurfewExempt, setEditCurfewExempt] = useState(Boolean(facility.curfewExempt));
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUnlockNow = () => {
    FacilityLockdownService.unlockFacility(facility.id);
  };

  const handleSaveFacilitySettings = (e: React.FormEvent) => {
    e.preventDefault();
    FacilityCustomizationService.updateFacility(facility.id, {
      openTime: editOpenTime,
      closeTime: editCloseTime,
      capacityPerSlot: Number(editCapacity) || 1,
      statusOverride: editStatus,
      curfewExempt: editCurfewExempt,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 1200);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-900/5 dark:shadow-2xl transition-all duration-300 group min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] flex flex-col justify-between p-4 sm:p-5 lg:p-6">
      {/* 1. Background Artwork Banner filling the ENTIRE bar */}
      <img
        src={bannerImage}
        alt={`${facility.name} illustration`}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 pointer-events-none"
      />

      {/* 2. Sophisticated Directional Backdrop Scrim */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 sm:to-white/25 dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-950/45 backdrop-blur-[1px] pointer-events-none" />

      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25 dark:opacity-35 transition-all duration-500 group-hover:scale-110"
        style={{ backgroundColor: theme.accentGlow }}
      />
      <div className="absolute left-1/3 -bottom-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10 bg-sky-500/20" />

      {/* Lockdown Alert Banner if Facility is Locked */}
      {lockdownStatus.lockdown && (
        <div className={`relative z-10 mb-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-black backdrop-blur-md ${
          lockdownStatus.isBlocked
            ? 'bg-red-500/20 border-red-500/40 text-red-800 dark:text-red-200'
            : 'bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <span>
                {lockdownStatus.isBlocked ? 'FACILITY TEMPORARILY SUSPENDED / MAINTENANCE: ' : 'LOCKDOWN ACTIVE (ADMINISTRATIVE ACCESS): '}
                {lockdownStatus.lockdown.reason}
              </span>
              <span className="text-[10px] block opacity-85 font-medium">
                Scheduled until {lockdownStatus.lockdown.unlockAt ? new Date(lockdownStatus.lockdown.unlockAt).toLocaleTimeString() : 'manual release'} ({lockdownStatus.lockdown.unlockAt ? new Date(lockdownStatus.lockdown.unlockAt).toLocaleDateString() : 'Active'})
              </span>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleUnlockNow}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0 shadow-xs"
            >
              Unlock Now
            </button>
          )}
        </div>
      )}

      {/* Top Row: Navigation and Super Admin In-Place Edit Button */}
      <div className="relative z-10 mb-3 sm:mb-4 flex items-center justify-between gap-2 flex-wrap">
        {onReturnToDashboard ? (
          <button
            type="button"
            onClick={() => {
              audioFeedback.playTap();
              ActionFeedback.startLoading('Executive Facilities Hub', 'Returning to 20 facilities overview...', undefined, 300);
              onReturnToDashboard();
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-black transition cursor-pointer active:scale-95 border border-slate-200/90 dark:border-slate-700 shadow-sm backdrop-blur-md"
            title="Return to Facilities Hub"
          >
            <ChevronLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Back to Facilities Hub</span>
          </button>
        ) : <div />}

        {/* Super Administrator In-Place Facility Settings Trigger */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs backdrop-blur-md ${
              isEditing
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/90 dark:border-slate-700'
            }`}
            title="Super Admin: Edit facility hours, capacity, and status"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEditing ? 'Close Edit' : 'Edit Facility'}</span>
          </button>
        )}
      </div>

      {/* In-Place Facility Edit Form for Super Admin */}
      {isEditing && isSuperAdmin && (
        <form onSubmit={handleSaveFacilitySettings} className="relative z-10 mb-4 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-amber-500/40 shadow-lg backdrop-blur-md space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Edit {facility.name} Parameters
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Open Time
              </label>
              <input
                type="time"
                value={editOpenTime}
                onChange={(e) => setEditOpenTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Close Time
              </label>
              <input
                type="time"
                value={editCloseTime}
                onChange={(e) => setEditCloseTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Max Capacity / Slot
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={editCapacity}
                onChange={(e) => setEditCapacity(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Operational Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="LOCKDOWN">Lockdown</option>
                <option value="RENOVATION">Renovation</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editCurfewExempt}
                onChange={(e) => setEditCurfewExempt(e.target.checked)}
                className="rounded border-slate-400 text-amber-600 focus:ring-amber-500"
              />
              <span>Curfew Exempt (Available during night curfew hours)</span>
            </label>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Facility Identity Row: Large Graphic + Prominent Title + Code Badge + Description */}
      <div className="flex items-center space-x-3 sm:space-x-5 min-w-0 relative z-10">
        {/* Prominent Custom Vector Illustration Container */}
        <div className="shrink-0 p-2.5 sm:p-4 lg:p-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 shadow-lg backdrop-blur-md flex items-center justify-center transition-transform duration-300 hover:scale-105">
          {getFacilityGraphic(facility.id, 'w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 drop-shadow-lg')}
        </div>

        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-tight drop-shadow-xs truncate sm:whitespace-normal">
              {facility.name}
            </h1>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-sky-100/90 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-2xs backdrop-blur-xs shrink-0">
              {facility.code}
            </span>
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-slate-700 dark:text-slate-300 leading-snug font-semibold max-w-2xl drop-shadow-xs line-clamp-2 sm:line-clamp-none">
            {facility.description}
          </p>
        </div>
      </div>
    </div>
  );
};

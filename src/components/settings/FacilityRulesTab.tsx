import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  Crown,
  Building2,
} from 'lucide-react';
import { SystemPreferences, FacilityLockdown, Facility } from '../../types';
import { AuthService } from '../../services/authService';
import { FacilityLockdownService } from '../../services/facilityLockdownService';
import { FacilityCustomizationService } from '../../services/facilityCustomizationService';
import { FacilityMasterStudio } from '../facility/FacilityMasterStudio';

interface FacilityRulesTabProps {
  preferences: SystemPreferences;
  onPreferencesUpdate: (prefs: SystemPreferences) => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FacilityRulesTab: React.FC<FacilityRulesTabProps> = ({
  preferences,
  onPreferencesUpdate,
  onShowFeedback,
}) => {
  const [curfewStart, setCurfewStart] = useState(preferences.curfewStart || '23:30');
  const [curfewEnd, setCurfewEnd] = useState(preferences.curfewEnd || '06:00');
  const [maxBookings, setMaxBookings] = useState(preferences.maxDailyBookingsPerBadge || 2);
  const [allowMultiSlot, setAllowMultiSlot] = useState(preferences.allowMultiSlotBooking ?? true);
  const [showStudio, setShowStudio] = useState(false);

  // Dynamic 20 Facilities
  const [facilities, setFacilities] = useState<Facility[]>(() =>
    FacilityCustomizationService.getAllFacilities()
  );

  useEffect(() => {
    const handleFacUpdate = () => {
      setFacilities(FacilityCustomizationService.getAllFacilities());
    };
    window.addEventListener('tamimi_facilities_updated', handleFacUpdate);
    return () => window.removeEventListener('tamimi_facilities_updated', handleFacUpdate);
  }, []);

  // Lockdown Controls State
  const [lockdowns, setLockdowns] = useState<FacilityLockdown[]>(() =>
    FacilityLockdownService.getAllLockdowns()
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');
  const [lockDuration, setLockDuration] = useState<number | 'indefinite'>(120);
  const [lockReason, setLockReason] = useState<string>('Mandatory Preventive Maintenance & Safety Inspection');

  const isSuperAdmin = AuthService.isSuperAdmin();

  // Listen for lockdown updates across components
  useEffect(() => {
    const handleUpdate = () => {
      setLockdowns(FacilityLockdownService.getAllLockdowns());
    };
    window.addEventListener('tamimi_lockdown_updated', handleUpdate);
    return () => window.removeEventListener('tamimi_lockdown_updated', handleUpdate);
  }, []);

  const handleApplyLockdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      onShowFeedback('🔒 Super Administrator authority required to execute facility lockdowns.', 'error');
      return;
    }

    const durationVal = lockDuration === 'indefinite' ? null : Number(lockDuration);

    if (selectedFacilityId === 'ALL') {
      const res = FacilityLockdownService.lockAllFacilities(durationVal, lockReason);
      if (res.success) {
        setLockdowns(FacilityLockdownService.getAllLockdowns());
        onShowFeedback('🚨 Global Emergency Lockdown applied across all 20 facilities!', 'success');
      }
    } else {
      const targetFacility = facilities.find((f) => f.id === selectedFacilityId);
      const name = targetFacility ? targetFacility.name : selectedFacilityId;
      const res = FacilityLockdownService.lockFacility(selectedFacilityId, name, durationVal, lockReason);
      if (res.success) {
        setLockdowns(FacilityLockdownService.getAllLockdowns());
        onShowFeedback(`🚨 Lockdown applied to ${name} (${res.lockdown.durationLabel}).`, 'success');
      }
    }
  };

  const handleUnlock = (facilityId: string) => {
    if (!isSuperAdmin) {
      onShowFeedback('🔒 Super Administrator authority required to unlock facilities.', 'error');
      return;
    }

    if (facilityId === 'ALL') {
      const res = FacilityLockdownService.unlockAllFacilities();
      if (res.success) {
        setLockdowns([]);
        onShowFeedback('✓ All facilities have been unlocked and restored to public operation!', 'success');
      }
    } else {
      const res = FacilityLockdownService.unlockFacility(facilityId);
      if (res.success) {
        setLockdowns(FacilityLockdownService.getAllLockdowns());
        onShowFeedback(`✓ Facility has been unlocked and reservations are reopened!`, 'success');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemPreferences = {
      ...preferences,
      curfewStart,
      curfewEnd,
      maxDailyBookingsPerBadge: Number(maxBookings),
      allowMultiSlotBooking: allowMultiSlot,
    };
    const res = AuthService.saveSystemPreferences(updated);
    if (res.success) {
      onPreferencesUpdate(updated);
      onShowFeedback('Facility operating rules updated and enforced across all facilities!', 'success');
    } else {
      onShowFeedback('Failed to save facility rules.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <span>Facility Lockdowns &amp; Operating Rules</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Execute emergency maintenance lockdowns, set quiet hours curfews, and configure resident booking quotas.
        </p>
      </div>

      {/* Super Administrator 20 Facilities Studio */}
      {isSuperAdmin && (
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 text-slate-100 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-amber-300">
                    Super Administrator 20 Facilities Studio
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-black border border-amber-400/40">
                    VIP GOD-MODE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Universal CRUD control: add/delete rooms, custom booking slots, capacity limits, rules, and amenities on any of the 20 facilities.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStudio(!showStudio)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 transition-all shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              {showStudio ? 'Hide Studio' : 'Open 20 Facilities Studio'}
            </button>
          </div>

          {showStudio && (
            <div className="pt-4 border-t border-slate-800">
              <FacilityMasterStudio
                onFacilityUpdated={() => {
                  setFacilities(FacilityCustomizationService.getAllFacilities());
                  onShowFeedback('Facility customization saved!', 'success');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: EMERGENCY FACILITY LOCKDOWNS & OVERRIDES */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 dark:border-amber-900/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Emergency Facility Lockdowns &amp; Maintenance Overrides
              </h3>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Instantly close sports grounds, courts, or service hubs during weather hazards, VIP events, or turf maintenance.
              </p>
            </div>
          </div>
          {lockdowns.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse inline-flex items-center gap-1 self-start sm:self-auto">
              <Flame className="w-3.5 h-3.5" />
              {lockdowns.length} Facility Lockdown Active
            </span>
          )}
        </div>

        {/* Lockdown Trigger Form */}
        <form onSubmit={handleApplyLockdown} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Facility
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            >
              <option value="ALL">🚨 ALL FACILITIES (Camp-Wide Emergency)</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.stages.length} Stage{f.stages.length > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lockout Duration
            </label>
            <select
              value={String(lockDuration)}
              onChange={(e) =>
                setLockDuration(e.target.value === 'indefinite' ? 'indefinite' : Number(e.target.value))
              }
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            >
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={120}>2 Hours (Standard Maintenance)</option>
              <option value={240}>4 Hours (Half Day)</option>
              <option value={480}>8 Hours (Full Shift)</option>
              <option value={1440}>24 Hours (1 Day)</option>
              <option value="indefinite">Indefinite (Until Manual Reopen)</option>
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lockout Reason / Resident Notification
            </label>
            <input
              type="text"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder="e.g., Mandatory floodlight repair, turf grass chemical aeration..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              * Active lockdowns prevent standard resident bookings while Super Administrators retain bypass privilege.
            </p>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/30 transition flex items-center space-x-1.5 cursor-pointer ml-auto"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enforce Facility Lockdown</span>
            </button>
          </div>
        </form>

        {/* Active Lockdowns List */}
        {lockdowns.length > 0 && (
          <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Currently Active Lockdowns ({lockdowns.length}):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lockdowns.map((lk) => (
                <div
                  key={lk.facilityId}
                  className="p-3 bg-white/90 dark:bg-slate-900/90 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {lk.facilityName || lk.facilityId}
                      </h5>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {lk.reason}
                    </p>
                    <p className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
                      Duration: {lk.durationLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlock(lk.facilityId)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-xs transition flex items-center space-x-1 shrink-0 cursor-pointer"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Unlock</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: CURFEW & OPERATING WINDOWS */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Curfew &amp; Quiet Hours Restriction</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Curfew Start Time (Night Closure)
              </label>
              <input
                type="time"
                value={curfewStart}
                onChange={(e) => setCurfewStart(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Curfew End Time (Morning Opening)
              </label>
              <input
                type="time"
                value={curfewEnd}
                onChange={(e) => setCurfewEnd(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Slots during curfew hours will be marked unavailable for general resident bookings.
          </p>
        </div>

        {/* SECTION 3: BOOKING LIMITS & QUOTAS */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Resident Quotas &amp; Multi-Slot Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Max Daily Bookings per Badge ID / Phone
              </label>
              <select
                value={maxBookings}
                onChange={(e) => setMaxBookings(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold text-slate-900 dark:text-white"
              >
                <option value={1}>1 Booking per day (Strict)</option>
                <option value={2}>2 Bookings per day (Standard)</option>
                <option value={3}>3 Bookings per day (Flexible)</option>
                <option value={5}>5 Bookings per day (Executive)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Multi-Slot Continuous Booking
              </label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="checkbox"
                  id="multiSlotToggle"
                  checked={allowMultiSlot}
                  onChange={(e) => setAllowMultiSlot(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="multiSlotToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Allow residents to select and reserve multiple adjacent slots simultaneously
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer"
          >
            Save &amp; Apply Rules
          </button>
        </div>
      </form>
    </div>
  );
};


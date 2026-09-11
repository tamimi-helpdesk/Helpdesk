import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Zap,
  ArrowRight,
  RotateCcw,
  FileText,
  Coffee,
} from 'lucide-react';
import { Facility, CustomSlotConfig } from '../../types';
import { FacilityCustomizationService } from '../../services/facilityCustomizationService';
import { AuthService } from '../../services/authService';

interface FacilityMasterStudioProps {
  onFacilityUpdated?: (facilityId: string) => void;
  initialFacilityId?: string;
  onClose?: () => void;
}

export const FacilityMasterStudio: React.FC<FacilityMasterStudioProps> = ({
  onFacilityUpdated,
  initialFacilityId,
  onClose,
}) => {
  const [facilities, setFacilities] = useState<Facility[]>(() =>
    FacilityCustomizationService.getAllFacilities()
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    initialFacilityId || facilities[0]?.id || 'barber-booking'
  );
  const [activeSubTab, setActiveSubTab] = useState<'ROOMS' | 'SLOTS' | 'RULES' | 'AMENITIES' | 'SETTINGS'>('ROOMS');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form Inputs for Adding
  const [newRoomName, setNewRoomName] = useState('');
  const [newRuleText, setNewRuleText] = useState('');
  const [newAmenityText, setNewAmenityText] = useState('');

  // Custom Slot Form Inputs
  const [slotStart, setSlotStart] = useState('06:00');
  const [slotEnd, setSlotEnd] = useState('07:00');
  const [slotLabel, setSlotLabel] = useState('Special Dawn Session');
  const [slotIsBreak, setSlotIsBreak] = useState(false);

  // Editing Operational Settings
  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || facilities[0];
  }, [facilities, selectedFacilityId]);

  const [openTime, setOpenTime] = useState(selectedFacility?.openTime || '07:00');
  const [closeTime, setCloseTime] = useState(selectedFacility?.closeTime || '23:00');
  const [slotDuration, setSlotDuration] = useState(selectedFacility?.defaultSlotDurationMinutes || 60);
  const [capacity, setCapacity] = useState(selectedFacility?.capacityPerSlot || 1);
  const [statusOverride, setStatusOverride] = useState<any>(selectedFacility?.statusOverride || 'OPERATIONAL');
  const [statusReason, setStatusReason] = useState(selectedFacility?.statusReason || '');
  const [curfewExempt, setCurfewExempt] = useState(Boolean(selectedFacility?.curfewExempt));

  // Sync settings when selected facility changes
  useEffect(() => {
    if (selectedFacility) {
      setOpenTime(selectedFacility.openTime || '07:00');
      setCloseTime(selectedFacility.closeTime || '23:00');
      setSlotDuration(selectedFacility.defaultSlotDurationMinutes || 60);
      setCapacity(selectedFacility.capacityPerSlot || 1);
      setStatusOverride(selectedFacility.statusOverride || 'OPERATIONAL');
      setStatusReason(selectedFacility.statusReason || '');
      setCurfewExempt(Boolean(selectedFacility.curfewExempt));
    }
  }, [selectedFacilityId, selectedFacility]);

  // Refresh facilities list from service
  const reloadFacilities = () => {
    const updated = FacilityCustomizationService.getAllFacilities();
    setFacilities(updated);
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- ROOMS / STAGES HANDLERS ---
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const res = FacilityCustomizationService.addStage(selectedFacility.id, newRoomName.trim());
    if (res.success) {
      showToast(res.message, 'success');
      setNewRoomName('');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteRoom = (stageName: string) => {
    if (window.confirm(`Are you sure you want to delete room/stage "${stageName}" from ${selectedFacility.name}?`)) {
      const res = FacilityCustomizationService.deleteStage(selectedFacility.id, stageName);
      if (res.success) {
        showToast(res.message, 'success');
        reloadFacilities();
        if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // --- SLOTS HANDLERS ---
  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotStart || !slotEnd) return;

    const res = FacilityCustomizationService.addCustomSlot(selectedFacility.id, {
      startTime: slotStart,
      endTime: slotEnd,
      label: slotLabel.trim() || 'Custom Slot',
      isBreak: slotIsBreak,
      capacity: capacity || 1,
    });

    if (res.success) {
      showToast(res.message, 'success');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDisableSlot = (startTime: string) => {
    const res = FacilityCustomizationService.disableSlot(selectedFacility.id, startTime);
    if (res.success) {
      showToast(res.message, 'info');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    }
  };

  const handleEnableSlot = (startTime: string) => {
    const res = FacilityCustomizationService.enableSlot(selectedFacility.id, startTime);
    if (res.success) {
      showToast(res.message, 'success');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    }
  };

  // --- RULES HANDLERS ---
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;

    const res = FacilityCustomizationService.addRule(selectedFacility.id, newRuleText.trim());
    if (res.success) {
      showToast(res.message, 'success');
      setNewRuleText('');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteRule = (index: number) => {
    const res = FacilityCustomizationService.deleteRule(selectedFacility.id, index);
    if (res.success) {
      showToast(res.message, 'success');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    }
  };

  // --- AMENITIES HANDLERS ---
  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenityText.trim()) return;

    const res = FacilityCustomizationService.addAmenity(selectedFacility.id, newAmenityText.trim());
    if (res.success) {
      showToast(res.message, 'success');
      setNewAmenityText('');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteAmenity = (amenity: string) => {
    const res = FacilityCustomizationService.deleteAmenity(selectedFacility.id, amenity);
    if (res.success) {
      showToast(res.message, 'success');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    }
  };

  // --- OPERATIONAL SETTINGS HANDLER ---
  const handleSaveOperationalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const res = FacilityCustomizationService.updateFacilitySettings(selectedFacility.id, {
      openTime,
      closeTime,
      defaultSlotDurationMinutes: Number(slotDuration),
      capacityPerSlot: Number(capacity),
      statusOverride,
      statusReason: statusReason.trim() || undefined,
      curfewExempt,
    });

    if (res.success) {
      showToast(res.message, 'success');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    } else {
      showToast(res.message, 'error');
    }
  };

  // --- RESET TO FACTORY DEFAULT ---
  const handleResetFacility = () => {
    if (window.confirm(`Reset "${selectedFacility.name}" to original factory defaults? All custom rooms, slots, rules, and timings will be restored.`)) {
      const res = FacilityCustomizationService.resetFacilityToDefault(selectedFacility.id);
      showToast(res.message, 'info');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('CRITICAL ACTION: Reset ALL 20 facilities to pristine factory default?')) {
      const res = FacilityCustomizationService.resetAllToDefaults();
      showToast(res.message, 'info');
      reloadFacilities();
      if (onFacilityUpdated) onFacilityUpdated(selectedFacility.id);
    }
  };

  // Calculate default generated slots for reference
  const generatedSlotTimes: string[] = useMemo(() => {
    const times: string[] = [];
    const [startH, startM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const closeMins = closeH * 60 + closeM;
    const dur = Number(slotDuration) || 60;

    for (let m = startMins; m + dur <= closeMins; m += dur) {
      const h = Math.floor(m / 60).toString().padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      times.push(`${h}:${min}`);
    }
    return times;
  }, [openTime, closeTime, slotDuration]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
      
      {/* Header Bar */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              CAMP FACILITIES STUDIO &amp; MASTER CUSTOMIZER
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SUPER ADMIN LEVEL 5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full executive CRUD permissions across all 20 camp facilities: customize rooms/stages, booking slots, rules, amenities, and operational hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFacility}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            title="Reset this facility to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Reset Facility
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors"
            title="Reset all facilities"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-400" />
            Reset All 20
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : feedback.type === 'error'
              ? 'bg-red-950/90 text-red-300 border-red-500/40'
              : 'bg-blue-950/90 text-blue-300 border-blue-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Info className="w-4 h-4 text-blue-400" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Facility Selector on Left, Studio Panels on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: List of 20 Facilities */}
        <div className="w-full md:w-72 bg-slate-950/60 border-r border-slate-800 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-slate-800/80 bg-slate-950 sticky top-0 z-10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Facility ({facilities.length})
            </span>
          </div>

          <div className="p-2 space-y-1">
            {facilities.map((fac) => {
              const isSelected = fac.id === selectedFacilityId;
              const hasOverrides = fac.stages.length !== (fac as any).defaultStageCount;
              const isLocked = fac.statusOverride && fac.statusOverride !== 'OPERATIONAL';

              return (
                <button
                  key={fac.id}
                  onClick={() => setSelectedFacilityId(fac.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-xs truncate">{fac.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {fac.stages.length} Rooms • {fac.openTime} - {fac.closeTime}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-900/60 text-red-300 border border-red-500/40">
                        {fac.statusOverride}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Studio Canvas: Sub Tabs & Deep Editor */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
          
          {/* Facility Title & Navigation Tabs */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/40">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedFacility.icon}</span>
                  <h3 className="text-xl font-black text-white">{selectedFacility.name}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    ID: {selectedFacility.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">{selectedFacility.description}</p>
              </div>

              {selectedFacility.statusOverride && selectedFacility.statusOverride !== 'OPERATIONAL' && (
                <div className="px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span>Status: {selectedFacility.statusOverride} ({selectedFacility.statusReason || 'Executive Order'})</span>
                </div>
              )}
            </div>

            {/* Sub Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 -mb-5 pb-0">
              <button
                onClick={() => setActiveSubTab('ROOMS')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
                  activeSubTab === 'ROOMS'
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Rooms / Stages ({selectedFacility.stages.length})
              </button>

              <button
                onClick={() => setActiveSubTab('SLOTS')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
                  activeSubTab === 'SLOTS'
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Booking Slots ({generatedSlotTimes.length + (selectedFacility.customSlots?.length || 0)})
              </button>

              <button
                onClick={() => setActiveSubTab('RULES')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
                  activeSubTab === 'RULES'
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Rules &amp; Guidelines ({selectedFacility.rules.length})
              </button>

              <button
                onClick={() => setActiveSubTab('AMENITIES')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
                  activeSubTab === 'AMENITIES'
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Amenities ({selectedFacility.amenities.length})
              </button>

              <button
                onClick={() => setActiveSubTab('SETTINGS')}
                className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
                  activeSubTab === 'SETTINGS'
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Hours &amp; Policies
              </button>
            </div>
          </div>

          {/* Sub-Tab Content */}
          <div className="p-6 flex-1 space-y-6">

            {/* TAB 1: ROOMS / STAGES / COURTS */}
            {activeSubTab === 'ROOMS' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
                    Add New Room / Stage / Pitch / Court
                  </h4>
                  <form onSubmit={handleAddRoom} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`e.g. ${selectedFacility.stageName} 4, Executive VIP Salon, Court B...`}
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add Room
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Active Rooms / Stages ({selectedFacility.stages.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFacility.stages.map((stage, idx) => (
                      <div
                        key={stage}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-black text-sm text-slate-200">{stage}</div>
                            <div className="text-[10px] text-slate-500">
                              Sub-resource of {selectedFacility.name}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteRoom(stage)}
                          disabled={selectedFacility.stages.length <= 1}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-900/60 text-slate-400 hover:text-red-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                          title="Delete this room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BOOKING SLOTS */}
            {activeSubTab === 'SLOTS' && (
              <div className="space-y-6">
                {/* Add Custom Slot Panel */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-3">
                    Add Custom / Emergency Booking Slot
                  </h4>
                  <form onSubmit={handleAddCustomSlot} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Start Time</label>
                      <input
                        type="time"
                        value={slotStart}
                        onChange={(e) => setSlotStart(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">End Time</label>
                      <input
                        type="time"
                        value={slotEnd}
                        onChange={(e) => setSlotEnd(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Label / Purpose</label>
                      <input
                        type="text"
                        placeholder="e.g. VIP League Slot, Dawn Fitness"
                        value={slotLabel}
                        onChange={(e) => setSlotLabel(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 pb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slotIsBreak}
                          onChange={(e) => setSlotIsBreak(e.target.checked)}
                          className="rounded border-slate-700 text-amber-500"
                        />
                        <span>Is Break Time</span>
                      </label>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Slot
                      </button>
                    </div>
                  </form>
                </div>

                {/* Custom Slots Created */}
                {selectedFacility.customSlots && selectedFacility.customSlots.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                      Super Admin Custom Slots ({selectedFacility.customSlots.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedFacility.customSlots.map((cs) => (
                        <div
                          key={cs.id}
                          className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-mono font-bold text-sm text-amber-300">
                              {cs.startTime} - {cs.endTime}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {cs.label || 'Custom Slot'} {cs.isBreak && '• (Break)'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDisableSlot(cs.startTime)}
                            className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors"
                            title="Remove custom slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard Operating Slots & Disable Switcher */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Standard Operating Slot Schedule ({generatedSlotTimes.length} default slots)
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Super Admin can click "Disable" on any slot to remove it from the resident booking grid.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {generatedSlotTimes.map((time) => {
                      const isDisabled = selectedFacility.disabledSlotTimes?.includes(time);
                      return (
                        <div
                          key={time}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isDisabled
                              ? 'bg-slate-950 border-red-900/50 text-slate-500 opacity-60'
                              : 'bg-slate-950 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="font-mono text-xs font-bold">{time}</div>
                          <div className="mt-1 flex justify-center">
                            {isDisabled ? (
                              <button
                                onClick={() => handleEnableSlot(time)}
                                className="text-[10px] text-emerald-400 hover:underline font-bold"
                              >
                                Enable Slot
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDisableSlot(time)}
                                className="text-[10px] text-red-400 hover:underline font-bold"
                              >
                                Disable Slot
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RULES & GUIDELINES */}
            {activeSubTab === 'RULES' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
                    Add Custom Operating Rule
                  </h4>
                  <form onSubmit={handleAddRule} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Proper athletic attire required; strictly no food or beverages inside..."
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add Rule
                    </button>
                  </form>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Current Enforced Rules ({selectedFacility.rules.length})
                  </h4>
                  {selectedFacility.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-200">{rule}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(idx)}
                        className="p-1 text-slate-400 hover:text-red-300 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AMENITIES */}
            {activeSubTab === 'AMENITIES' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
                    Add Facility Amenity
                  </h4>
                  <form onSubmit={handleAddAmenity} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Central Air Conditioning, Wi-Fi 6, Recliner Chairs..."
                      value={newAmenityText}
                      onChange={(e) => setNewAmenityText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Amenity
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Current Amenities &amp; Features ({selectedFacility.amenities.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFacility.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-medium flex items-center gap-2"
                      >
                        <span>{amenity}</span>
                        <button
                          onClick={() => handleDeleteAmenity(amenity)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: OPERATIONAL SETTINGS & HOURS */}
            {activeSubTab === 'SETTINGS' && (
              <form onSubmit={handleSaveOperationalSettings} className="space-y-6">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Operating Schedule &amp; Slot Sizing
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400">Opening Time</label>
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400">Closing Time</label>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400">Slot Duration (Minutes)</label>
                      <select
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                        <option value={90}>90 Minutes (1.5 Hours)</option>
                        <option value={120}>120 Minutes (2 Hours)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400">Capacity Per Slot (People)</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Executive Status &amp; Policy Overrides
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400">Operational Status</label>
                      <select
                        value={statusOverride}
                        onChange={(e) => setStatusOverride(e.target.value as any)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="OPERATIONAL">🟢 Fully Operational</option>
                        <option value="MAINTENANCE">🟡 Scheduled Maintenance</option>
                        <option value="LOCKDOWN">🔴 Emergency Lockdown</option>
                        <option value="VIP_ONLY">👑 Executive VIP Delegation Only</option>
                        <option value="RENOVATION">🛠️ Facility Renovation</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400">Public Status Notice</label>
                      <input
                        type="text"
                        placeholder="e.g. Under scheduled deep maintenance until tomorrow 10 AM."
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={curfewExempt}
                        onChange={(e) => setCurfewExempt(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 w-4 h-4"
                      />
                      <span className="font-bold text-amber-300">Curfew Exemption:</span>
                      <span className="text-slate-400">Allow 24/7 round-the-clock bookings for this facility, ignoring standard camp night curfew.</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Save Operational Settings
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Users,
  Shield,
  Plus,
  Trash2,
  Search,
  Check,
  Tag,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { Facility } from '../../types';
import {
  FacilityCustomizationService,
  FacilityOverrides,
} from '../../services/facilityCustomizationService';

interface FacilityMasterTabProps {
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FacilityMasterTab: React.FC<FacilityMasterTabProps> = ({ onShowFeedback }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('barber-booking');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for the selected facility
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statusOverride, setStatusOverride] = useState<FacilityOverrides['statusOverride']>('OPERATIONAL');
  const [statusReason, setStatusReason] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [slotDuration, setSlotDuration] = useState<number>(60);
  const [capacity, setCapacity] = useState<number>(1);
  const [advanceDays, setAdvanceDays] = useState<number>(7);
  const [curfewExempt, setCurfewExempt] = useState(false);
  const [autoApproval, setAutoApproval] = useState(true);

  // Lists
  const [stages, setStages] = useState<string[]>([]);
  const [newStageInput, setNewStageInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Load facilities from service
  const reloadFacilities = () => {
    const list = FacilityCustomizationService.getAllFacilities();
    setFacilities(list);
    if (list.length > 0 && !list.some((f) => f.id === selectedFacilityId)) {
      setSelectedFacilityId(list[0].id);
    }
  };

  useEffect(() => {
    reloadFacilities();
  }, []);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  // Sync state whenever selectedFacility changes
  useEffect(() => {
    if (selectedFacility) {
      setName(selectedFacility.name);
      setDescription(selectedFacility.description || '');
      setStatusOverride(selectedFacility.statusOverride || 'OPERATIONAL');
      setStatusReason(selectedFacility.statusReason || '');
      setOpenTime(selectedFacility.openTime || '08:00');
      setCloseTime(selectedFacility.closeTime || '23:00');
      setSlotDuration(selectedFacility.defaultSlotDurationMinutes || 60);
      setCapacity(selectedFacility.capacityPerSlot || 1);
      setAdvanceDays(selectedFacility.advanceBookingDays || 7);
      setCurfewExempt(selectedFacility.curfewExempt ?? false);
      setAutoApproval(selectedFacility.autoApprovalEnabled ?? true);
      setStages(selectedFacility.stages || [selectedFacility.name]);
      setAmenities(selectedFacility.amenities || []);
      setRules(selectedFacility.rules || []);
    }
  }, [selectedFacilityId, facilities]);

  // Handle stage add/remove
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageInput.trim()) return;
    const trimmed = newStageInput.trim();
    if (stages.includes(trimmed)) {
      onShowFeedback('Stage already exists', 'error');
      return;
    }
    setStages([...stages, trimmed]);
    setNewStageInput('');
  };

  const handleRemoveStage = (stageName: string) => {
    if (stages.length <= 1) {
      onShowFeedback('Facility must have at least one stage or sub-room active.', 'error');
      return;
    }
    setStages(stages.filter((s) => s !== stageName));
  };

  // Handle amenity add/remove
  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenityInput.trim()) return;
    const trimmed = newAmenityInput.trim();
    if (amenities.includes(trimmed)) return;
    setAmenities([...amenities, trimmed]);
    setNewAmenityInput('');
  };

  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter((a) => a !== amenity));
  };

  // Handle rule add/remove
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    const trimmed = newRuleInput.trim();
    setRules([...rules, trimmed]);
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId) return;

    const updates: Partial<FacilityOverrides> = {
      name: name.trim(),
      description: description.trim(),
      statusOverride,
      statusReason: statusReason.trim(),
      openTime,
      closeTime,
      defaultSlotDurationMinutes: Number(slotDuration),
      capacityPerSlot: Number(capacity),
      advanceBookingDays: Number(advanceDays),
      curfewExempt,
      autoApprovalEnabled: autoApproval,
      stages,
      amenities,
      rules,
    };

    const res = FacilityCustomizationService.updateFacilitySettings(selectedFacilityId, updates);
    if (res.success) {
      onShowFeedback(`Successfully saved configuration for "${name}".`, 'success');
      reloadFacilities();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Reset to default
  const handleResetFacility = () => {
    if (!selectedFacilityId) return;
    if (window.confirm(`Are you sure you want to restore default factory settings for "${name}"?`)) {
      const res = FacilityCustomizationService.resetFacilityToDefault(selectedFacilityId);
      if (res.success) {
        onShowFeedback(res.message, 'success');
        reloadFacilities();
      }
    }
  };

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Facility Master &amp; Venue Control</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Super Administrator console to configure timings, capacity, stages, status lockdowns, and guidelines across all 20 camp venues.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetFacility}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Venue to Factory Default</span>
        </button>
      </div>

      {/* Two-Column Layout: Facility Selector (Left) + Detailed Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 20 Facility Selector */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Facility ({facilities.length})
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-full">
              Camp 188
            </span>
          </div>

          {/* Quick Filter Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          {/* Facility List Scrollable */}
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredFacilities.map((fac) => {
              const isSelected = fac.id === selectedFacilityId;
              const status = fac.statusOverride || 'OPERATIONAL';

              return (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => setSelectedFacilityId(fac.id)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-200 shrink-0">
                        {fac.code || 'FC'}
                      </span>
                      <p className="text-xs font-black truncate">{fac.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 pl-7 truncate">
                      {fac.openTime} - {fac.closeTime} · {fac.defaultSlotDurationMinutes}m
                    </p>
                  </div>

                  <div className="shrink-0">
                    {status === 'OPERATIONAL' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Operational" />
                    ) : status === 'MAINTENANCE' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Maintenance" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Lockdown" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Granular Venue Configuration Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Card 1: Venue Identity & Status Override */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Venue Identity &amp; Operational Status</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">ID: {selectedFacilityId}</p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Facility Code:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-black text-slate-700 dark:text-slate-200">
                    {selectedFacility?.code}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Operational Status Override
                  </label>
                  <select
                    value={statusOverride}
                    onChange={(e) => setStatusOverride(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold"
                  >
                    <option value="OPERATIONAL">🟢 Operational (Open to all)</option>
                    <option value="MAINTENANCE">🟡 Maintenance (Notice banner)</option>
                    <option value="LOCKDOWN">🔴 Lockdown (No bookings allowed)</option>
                    <option value="VIP_ONLY">🟣 VIP / Executive Only</option>
                    <option value="RENOVATION">🔵 Renovation / Temporary Upgrade</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Status Reason / Marquee Announcement (Shown to residents)
                  </label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g. Regular turf watering in progress until 4 PM"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Description &amp; Purpose
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Operating Schedule & Slot Dynamics */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Operating Hours &amp; Slot Duration</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Slot Duration
                  </label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1h)</option>
                    <option value={90}>90 Minutes</option>
                    <option value={120}>120 Minutes (2h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Capacity Per Slot
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Policy Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Curfew Exemption</h4>
                    <p className="text-[11px] text-slate-500">Accessible during night curfew (e.g. Clinic)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={curfewExempt}
                    onChange={(e) => setCurfewExempt(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Approval</h4>
                    <p className="text-[11px] text-slate-500">Instantly confirm without supervisor review</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoApproval}
                    onChange={(e) => setAutoApproval(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Stages, Pitches & Sub-Rooms */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sub-Rooms, Pitches &amp; Stages ({stages.length})</span>
                </h3>
              </div>

              {/* Add Stage Form */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newStageInput}
                  onChange={(e) => setNewStageInput(e.target.value)}
                  placeholder="e.g. Pitch 2, Chair 3, VIP Suite B..."
                  className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              </div>

              {/* Stage Chips */}
              <div className="flex flex-wrap gap-2">
                {stages.map((stg) => (
                  <span
                    key={stg}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <span>{stg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(stg)}
                      className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Remove stage"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Card 4: Rules & Guidelines */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Venue Guidelines &amp; Rules ({rules.length})</span>
              </h3>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                  placeholder="e.g. Sports shoes strictly required on turf pitch..."
                  className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300">• {rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Facility Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

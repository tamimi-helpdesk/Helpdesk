import React, { useState } from 'react';
import {
  Scissors,
  Activity,
  Shield,
  Film,
  Dumbbell,
  Target,
  Trophy,
  Building2,
  CheckCircle2,
  Sparkles,
  Users,
  Clock,
  Shirt,
  Volume2,
  Layers,
  Award,
  Zap,
  Check,
  Tv,
  Ticket,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Facility } from '../types';
import { getFacilityGraphic } from './FacilityGraphics';
import { BarberLiveQueueModal } from './barber/BarberLiveQueueModal';
import { SportsTournamentEngineModal } from './sports/SportsTournamentEngineModal';
import { CinemaSeatPickerModal } from './cinema/CinemaSeatPickerModal';
import { AuthService } from '../services/authService';
import { FacilityCustomizationService } from '../services/facilityCustomizationService';

const FacilityRulesAndAmenitiesPanel: React.FC<{ facility: Facility }> = ({ facility }) => {
  const isSuperAdmin = AuthService.isSuperAdmin();
  const [newRule, setNewRule] = useState('');
  const [newAmenity, setNewAmenity] = useState('');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    FacilityCustomizationService.addRule(facility.id, newRule.trim());
    setNewRule('');
  };

  const handleDeleteRule = (rule: string) => {
    FacilityCustomizationService.deleteRule(facility.id, rule);
  };

  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenity.trim()) return;
    FacilityCustomizationService.addAmenity(facility.id, newAmenity.trim());
    setNewAmenity('');
  };

  const handleDeleteAmenity = (amenity: string) => {
    FacilityCustomizationService.deleteAmenity(facility.id, amenity);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {facility.name} — Rules & Included Amenities
          </h3>
        </div>
        {isSuperAdmin && (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase">
            Super Admin In-Place Controls
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rules Section */}
        <div className="space-y-2">
          <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Rules & Guidelines ({facility.rules?.length || 0})</span>
          </div>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {(facility.rules && facility.rules.length > 0) ? (
              facility.rules.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug break-words">{rule}</span>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition shrink-0 cursor-pointer"
                      title="Super Admin: Remove rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic p-2">No specific restrictions posted. Follow general facility etiquette.</li>
            )}
          </ul>

          {/* Super Admin Add Rule Inline Form */}
          {isSuperAdmin && (
            <form onSubmit={handleAddRule} className="flex items-center gap-1 pt-1">
              <input
                type="text"
                placeholder="Add rule for this facility..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </form>
          )}
        </div>

        {/* Amenities Section */}
        <div className="space-y-2">
          <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            <span>Amenities & Facilities ({facility.amenities?.length || 0})</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {(facility.amenities && facility.amenities.length > 0) ? (
              facility.amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{amenity}</span>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAmenity(amenity)}
                      className="p-0.5 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                      title="Super Admin: Remove amenity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic p-2">Standard facility amenities apply.</span>
            )}
          </div>

          {/* Super Admin Add Amenity Inline Form */}
          {isSuperAdmin && (
            <form onSubmit={handleAddAmenity} className="flex items-center gap-1 pt-1">
              <input
                type="text"
                placeholder="e.g. Free Wi-Fi, Cold Towels..."
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

interface FacilityCustomExperienceProps {
  facility: Facility;
  selectedStage: string;
  onSelectStage: (stage: string) => void;
  customOptions: Record<string, any>;
  onOptionsChange: (options: Record<string, any>) => void;
}

export const FacilityCustomExperience: React.FC<FacilityCustomExperienceProps> = ({
  facility,
  selectedStage,
  onSelectStage,
  customOptions,
  onOptionsChange,
}) => {
  const [isBarberTvOpen, setIsBarberTvOpen] = useState(false);
  const [isSportsScoreboardOpen, setIsSportsScoreboardOpen] = useState(false);
  const [isCinemaSeatPickerOpen, setIsCinemaSeatPickerOpen] = useState(false);

  const updateOption = (key: string, value: any) => {
    onOptionsChange({
      ...customOptions,
      [key]: value,
    });
  };

  // 1. BARBER BOOKING EXPERIENCE
  if (facility.id === 'barber-booking') {
    const services = [
      { id: 'haircut', title: 'Haircut & Styling', time: '30 mins', icon: '✂️' },
      { id: 'beard', title: 'Beard Trim', time: '30 mins', icon: '🧔' },
      { id: 'shave', title: 'Clean Shave', time: '30 mins', icon: '🪒' },
      { id: 'facial', title: 'Facial & Head Massage', time: '30 mins', icon: '✨' },
      { id: 'vip_combo', title: 'Haircut + Beard Package', time: '60 mins', icon: '💈' },
    ];

    const selectedService = customOptions.barberService || 'haircut';

    return (
      <>
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-200/90 dark:border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border-2 border-amber-200/80 dark:border-amber-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-white dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-500/40 shadow-xs flex items-center justify-center shrink-0">
                {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Barber Shop Services
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-500/30">
                    30-Min Slots
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-amber-200/80 mt-0.5 font-medium">
                  Operating 11:00 AM – 10:30 PM (Break times: 12:00–1:00 PM & 6:30–7:30 PM).
                </p>
              </div>
            </div>

            {/* Launch Barber TV Button */}
            <button
              onClick={() => setIsBarberTvOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-2 transition shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Tv className="w-4 h-4" />
              <span>Live Queue Display (TV Mode)</span>
            </button>
          </div>

          {/* Services Selection Grid */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
              Select Service
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {services.map((srv) => {
                const isSel = selectedService === srv.id;
                return (
                  <button
                    key={srv.id}
                    onClick={() => updateOption('barberService', srv.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 border-amber-600 dark:border-amber-400 font-bold shadow-md shadow-amber-500/25 scale-[1.02]'
                        : 'bg-slate-50/80 dark:bg-slate-950/80 text-slate-800 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{srv.icon}</div>
                    <div>
                      <div className="text-xs font-black leading-snug">{srv.title}</div>
                      <div className={`text-[11px] mt-1 font-bold ${isSel ? 'text-slate-950' : 'text-amber-700 dark:text-amber-400'}`}>
                        ⏱ {srv.time}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chair / Stylist Picker */}
          <div className="pt-2 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-700 dark:text-slate-400 font-bold">Select Barber Station:</span>
            <div className="flex flex-wrap gap-2">
              {facility.stages.map((stg) => {
                const isSel = selectedStage === stg;
                return (
                  <button
                    key={stg}
                    onClick={() => onSelectStage(stg)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition text-xs flex items-center space-x-1.5 border-2 cursor-pointer ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                    }`}
                  >
                    <span>{stg}</span>
                    {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <BarberLiveQueueModal
          isOpen={isBarberTvOpen}
          onClose={() => setIsBarberTvOpen(false)}
          facility={facility}
        />
      </>
    );
  }

  // 2. CRICKET GROUND EXPERIENCE
  if (facility.id === 'cricket-ground') {
    const matchFormats = [
      { id: 't20', name: 'T20 Match', desc: '20 Overs' },
      { id: 'one_day', name: 'Full Match', desc: '30 / 40 Overs' },
      { id: 'friendly', name: 'Practice Match', desc: 'Friendly Game' },
      { id: 'practice', name: 'Pitch Practice', desc: 'Batting / Bowling Drills' },
    ];

    const selectedFormat = customOptions.cricketFormat || 't20';
    const ballType = customOptions.cricketBallType || 'leather_red';
    const needUmpire = customOptions.cricketUmpire || false;
    const needFloodlights = customOptions.cricketFloodlights || false;

    return (
      <>
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-200/90 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-2xl border-2 border-emerald-200/80 dark:border-emerald-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-white dark:bg-emerald-900/40 border-2 border-emerald-300 dark:border-emerald-500/40 shadow-xs flex items-center justify-center shrink-0">
                {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Cricket Ground
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-500/30">
                    1-Hour Slots
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-0.5 font-medium">
                  Operating 07:00 AM – 11:00 PM across grounds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSportsScoreboardOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Live Match Scoreboard</span>
              </button>

              {/* Ground Switcher */}
              <div className="flex gap-1 bg-white dark:bg-slate-950 p-1 rounded-2xl border-2 border-emerald-200 dark:border-slate-800 shrink-0">
                {facility.stages.map((stg) => (
                  <button
                    key={stg}
                    onClick={() => onSelectStage(stg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedStage === stg
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-400 hover:text-emerald-700'
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Match Format & Team Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Formats */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
                Match Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchFormats.map((fmt) => {
                  const isSel = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => updateOption('cricketFormat', fmt.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                        isSel
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold'
                          : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="text-xs font-black">{fmt.name}</div>
                      <div className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {fmt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match Essentials */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
                Match Options
              </label>
              <div className="space-y-2.5 bg-slate-50/90 dark:bg-slate-950/80 p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Ball Type:</span>
                  <select
                    value={ballType}
                    onChange={(e) => updateOption('cricketBallType', e.target.value)}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-xs text-emerald-800 dark:text-emerald-400 font-bold rounded-xl px-3 py-1.5 shadow-2xs"
                  >
                    <option value="leather_red">Red Leather Ball</option>
                    <option value="leather_white">White Leather Ball</option>
                    <option value="heavy_tennis">Heavy Tennis Ball</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t-2 border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Umpire / Scorekeeper:</span>
                  <button
                    onClick={() => updateOption('cricketUmpire', !needUmpire)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition border-2 cursor-pointer ${
                      needUmpire
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {needUmpire ? '✓ Included' : '+ Request'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t-2 border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Floodlights:</span>
                  <button
                    onClick={() => updateOption('cricketFloodlights', !needFloodlights)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition border-2 cursor-pointer ${
                      needFloodlights
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {needFloodlights ? '✓ Active' : '+ Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SportsTournamentEngineModal
          isOpen={isSportsScoreboardOpen}
          onClose={() => setIsSportsScoreboardOpen(false)}
          facility={facility}
        />
      </>
    );
  }

  // 3. FOOTBALL GROUND EXPERIENCE
  if (facility.id === 'football-ground') {
    const footballFormats = [
      { id: '11v11', name: '11v11 Match', desc: 'Full Ground' },
      { id: '7v7', name: '7v7 Match', desc: 'Half Ground' },
      { id: '5v5', name: '5v5 Training', desc: 'Practice Session' },
    ];

    const selectedFormat = customOptions.footballFormat || '11v11';
    const needBibs = customOptions.footballBibs || false;
    const needBalls = customOptions.footballBalls || true;
    const needReferee = customOptions.footballReferee || false;

    return (
      <>
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-200/90 dark:border-blue-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-2xl border-2 border-blue-200/80 dark:border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-white dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-500/40 shadow-xs flex items-center justify-center shrink-0">
                {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Football Ground
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200 text-blue-950 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-500/30">
                    09:00 AM – 11:00 PM
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-blue-200/80 mt-0.5 font-medium">
                  Hourly bookings for football matches and practice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSportsScoreboardOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
              >
                <Trophy className="w-4 h-4" />
                <span>Live Match Scoreboard</span>
              </button>

              {/* Pitch Switcher */}
              <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border-2 border-blue-200 dark:border-slate-800 shrink-0">
                {facility.stages.map((stg) => (
                  <button
                    key={stg}
                    onClick={() => onSelectStage(stg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedStage === stg
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-400 hover:text-blue-700'
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {footballFormats.map((fmt) => {
            const isSel = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => updateOption('footballFormat', fmt.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md font-bold'
                    : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="text-xs font-black">{fmt.name}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {fmt.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/90 dark:bg-slate-950/80 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <Shirt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">Training Bibs (Neon Set):</span>
            <button
              onClick={() => updateOption('footballBibs', !needBibs)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needBibs
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needBibs ? 'Included' : 'Add'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">FIFA Pro Match Balls (x2):</span>
            <button
              onClick={() => updateOption('footballBalls', !needBalls)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needBalls
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needBalls ? 'Included' : 'Add'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">Certified Referee:</span>
            <button
              onClick={() => updateOption('footballReferee', !needReferee)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needReferee
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needReferee ? 'Requested' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      <SportsTournamentEngineModal
        isOpen={isSportsScoreboardOpen}
        onClose={() => setIsSportsScoreboardOpen(false)}
        facility={facility}
      />
    </>
  );
}

// 4. BASKETBALL COURT EXPERIENCE
  if (facility.id === 'basketball-court') {
    const courtModes = [
      { id: 'full', name: '5v5 Full Court', desc: 'Full Court Match' },
      { id: 'half', name: '3v3 Half Court', desc: 'Half Court Practice' },
      { id: 'shootout', name: 'Drill Practice', desc: 'Shooting & Training' },
    ];

    const selectedMode = customOptions.basketMode || 'full';
    const needBall = customOptions.basketBall || true;
    const needTimer = customOptions.basketTimer || true;

    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-orange-200/90 dark:border-orange-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50/70 dark:bg-orange-950/30 p-3.5 rounded-2xl border-2 border-orange-200/80 dark:border-orange-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-white dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-500/40 shadow-xs flex items-center justify-center shrink-0">
              {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Basketball Court
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-200 text-orange-950 dark:bg-orange-500/20 dark:text-orange-300 px-2 py-0.5 rounded-md border border-orange-300 dark:border-orange-500/30">
                  Standard Court
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-orange-200/80 mt-0.5 font-medium">
                Standard basketball court with hoops and scoreboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {courtModes.map((cm) => {
            const isSel = selectedMode === cm.id;
            return (
              <button
                key={cm.id}
                onClick={() => updateOption('basketMode', cm.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  isSel
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md font-bold'
                    : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-orange-50/50'
                }`}
              >
                <div className="text-xs font-black">{cm.name}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-orange-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {cm.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/90 dark:bg-slate-950/80 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">Basketballs:</span>
            <button
              onClick={() => updateOption('basketBall', !needBall)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needBall
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needBall ? 'Included' : 'Add'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">Shot Clock:</span>
            <button
              onClick={() => updateOption('basketTimer', !needTimer)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needTimer
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needTimer ? 'Enabled' : 'Off'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. CINEMA EXPERIENCE
  if (facility.id === 'cinema') {
    const screenTypes = [
      { id: 'movie', title: 'Movie Screening', desc: 'Screening Session', icon: '🎬' },
      { id: 'sports', title: 'Sports Screening', desc: 'Live Match Streaming', icon: '⚽' },
      { id: 'gaming', title: 'Gaming / Console', desc: 'Big Screen Display', icon: '🎮' },
      { id: 'presentation', title: 'Presentation / Meeting', desc: 'Dual Mic & Slides', icon: '💼' },
    ];

    const selectedScreenType = customOptions.cinemaType || 'movie';
    const popcorn = customOptions.cinemaPopcorn ?? false;

    return (
      <>
        <div className="bg-white dark:bg-slate-900 border-2 border-rose-200/90 dark:border-rose-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-2xl border-2 border-rose-200/80 dark:border-rose-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl bg-white dark:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-500/40 shadow-xs flex items-center justify-center shrink-0">
                {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Cinema Hall
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-950 dark:bg-rose-500/20 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-500/30">
                    60 Luxury Seats
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-rose-200/80 mt-0.5 font-medium">
                  Surround sound screening room with laser projector & VIP recliners.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCinemaSeatPickerOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-purple-600/25 cursor-pointer shrink-0"
            >
              <Ticket className="w-4 h-4" />
              <span>
                {customOptions.cinemaSeats && customOptions.cinemaSeats.length > 0
                  ? `Seats (${customOptions.cinemaSeats.length}): ${customOptions.cinemaSeats.join(', ')}`
                  : 'Interactive Seat Selector'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {screenTypes.map((st) => {
              const isSel = selectedScreenType === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => updateOption('cinemaType', st.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                    isSel
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md font-bold'
                      : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-rose-50/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{st.icon}</div>
                  <div className="text-xs font-black">{st.title}</div>
                  <div className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {st.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/90 dark:bg-slate-950/80 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-slate-800 dark:text-slate-300 font-bold">Audio:</span>
              <span className="text-rose-700 dark:text-rose-400 font-black">Surround Sound</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-800 dark:text-slate-300 font-bold">Popcorn / Snacks:</span>
              <button
                onClick={() => updateOption('cinemaPopcorn', !popcorn)}
                className={`px-3 py-1 rounded-xl font-bold text-xs border-2 cursor-pointer ${
                  popcorn
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                {popcorn ? '✓ Added' : '+ Add'}
              </button>
            </div>
          </div>
        </div>

        <CinemaSeatPickerModal
          isOpen={isCinemaSeatPickerOpen}
          onClose={() => setIsCinemaSeatPickerOpen(false)}
          facility={facility}
          initialSeats={customOptions.cinemaSeats || []}
          initialRefreshments={customOptions.cinemaRefreshments || []}
          onConfirmSeats={(seats, refreshments) => {
            updateOption('cinemaSeats', seats);
            updateOption('cinemaRefreshments', refreshments);
            if (refreshments.some((r) => r.toLowerCase().includes('popcorn'))) {
              updateOption('cinemaPopcorn', true);
            }
          }}
        />
      </>
    );
  }

  // 6. TENNIS COURT EXPERIENCE
  if (facility.id === 'tennis-court') {
    const courtSurfaces = [
      { id: 'hard', name: 'Singles Match', desc: 'Standard Court Setup' },
      { id: 'doubles', name: 'Doubles Match', desc: 'Full Court Setup' },
    ];

    const selectedSurface = customOptions.tennisSurface || 'hard';
    const needBallMachine = customOptions.tennisBallMachine || false;
    const needRackets = customOptions.tennisRackets || true;

    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-teal-200/90 dark:border-teal-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/70 dark:bg-teal-950/30 p-3.5 rounded-2xl border-2 border-teal-200/80 dark:border-teal-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-white dark:bg-teal-900/40 border-2 border-teal-300 dark:border-teal-500/40 shadow-xs flex items-center justify-center shrink-0">
              {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Tennis Court
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-200 text-teal-950 dark:bg-teal-500/20 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-300 dark:border-teal-500/30">
                  Floodlit Court
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-teal-200/80 mt-0.5 font-medium">
                Standard hard tennis court with regulation net and lighting.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courtSurfaces.map((cs) => {
            const isSel = selectedSurface === cs.id;
            return (
              <button
                key={cs.id}
                onClick={() => updateOption('tennisSurface', cs.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                  isSel
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md font-bold'
                    : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-teal-50/50'
                }`}
              >
                <div className="text-xs font-black">{cs.name}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {cs.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/90 dark:bg-slate-950/80 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">Rackets & Balls:</span>
            <button
              onClick={() => updateOption('tennisRackets', !needRackets)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needRackets
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needRackets ? 'Included' : 'Add'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-slate-800 dark:text-slate-300 font-bold">Ball Machine:</span>
            <button
              onClick={() => updateOption('tennisBallMachine', !needBallMachine)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border-2 cursor-pointer ${
                needBallMachine
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {needBallMachine ? 'Active' : '+ Request'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. CRICKET NET EXPERIENCE
  if (facility.id === 'cricket-net') {
    const bowlingSpeeds = [
      { id: 'medium', label: 'Medium Pace (100–115 km/h)', color: 'text-emerald-700 dark:text-emerald-400' },
      { id: 'fast', label: 'Fast Bowling (116–130 km/h)', color: 'text-amber-700 dark:text-amber-400' },
      { id: 'express', label: 'Express Pace (130–145 km/h)', color: 'text-red-700 dark:text-red-400' },
      { id: 'spin', label: 'Spin Bowling', color: 'text-sky-700 dark:text-cyan-400' },
    ];

    const selectedSpeed = customOptions.netBowlingSpeed || 'fast';

    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-cyan-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/70 dark:bg-cyan-950/30 p-3.5 rounded-2xl border-2 border-sky-200/80 dark:border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-white dark:bg-cyan-900/40 border-2 border-sky-300 dark:border-cyan-500/40 shadow-xs flex items-center justify-center shrink-0">
              {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Cricket Practice Nets
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-200 text-sky-950 dark:bg-cyan-500/20 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-sky-300 dark:border-cyan-500/30">
                  Batting Nets
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-cyan-200/80 mt-0.5 font-medium">
                Enclosed batting nets with bowling machine options.
              </p>
            </div>
          </div>
          {/* Net lane selector */}
          <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border-2 border-sky-200 dark:border-slate-800 shrink-0">
            {facility.stages.map((stg) => (
              <button
                key={stg}
                onClick={() => onSelectStage(stg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedStage === stg
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-400 hover:text-sky-700'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>

        {/* Bowling Speed Selector */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
            Bowling Machine Speed
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {bowlingSpeeds.map((bs) => {
              const isSel = selectedSpeed === bs.id;
              return (
                <button
                  key={bs.id}
                  onClick={() => updateOption('netBowlingSpeed', bs.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                    isSel
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md font-bold'
                      : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-sky-50/50'
                  }`}
                >
                  <div className="text-xs font-black">{bs.label}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${isSel ? 'text-sky-100' : bs.color}`}>Speed Mode</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 8. MULTIPURPOSE ROOM EXPERIENCE
  if (facility.id === 'multipurpose-room') {
    const roomLayouts = [
      { id: 'theater', name: 'Theater Layout', desc: 'Presentation Setup', icon: '🎭' },
      { id: 'boardroom', name: 'Boardroom', desc: 'Meeting Setup', icon: '🏛️' },
      { id: 'banquet', name: 'Dining Setup', desc: 'Tables & Seating', icon: '🍽️' },
      { id: 'yoga', name: 'Open Hall', desc: 'Open Space', icon: '🧘' },
    ];

    const selectedLayout = customOptions.roomLayout || 'theater';

    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200/90 dark:border-indigo-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-white dark:bg-indigo-900/40 border-2 border-indigo-300 dark:border-indigo-500/40 shadow-xs flex items-center justify-center shrink-0">
              {getFacilityGraphic(facility.id, 'w-12 h-12 drop-shadow-xs')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Multipurpose Room
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-200 text-indigo-950 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-300 dark:border-indigo-500/30">
                  Hall Setup
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-indigo-200/80 mt-0.5 font-medium">
                Hall for meetings, workshops, and gatherings.
              </p>
            </div>
          </div>
          {/* Room Switcher */}
          <div className="flex gap-1.5 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border-2 border-indigo-200 dark:border-slate-800 shrink-0">
            {facility.stages.map((stg) => (
              <button
                key={stg}
                onClick={() => onSelectStage(stg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedStage === stg
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-400 hover:text-indigo-700'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
            Select Room Layout
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roomLayouts.map((rl) => {
              const isSel = selectedLayout === rl.id;
              return (
                <button
                  key={rl.id}
                  onClick={() => updateOption('roomLayout', rl.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                    isSel
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold'
                      : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{rl.icon}</div>
                  <div className="text-xs font-black">{rl.name}</div>
                  <div className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {rl.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

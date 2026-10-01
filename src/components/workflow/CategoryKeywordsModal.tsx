import React, { useState } from 'react';
import {
  X,
  Tags,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  Flame,
  ShieldAlert,
  Bug,
  Sparkle,
  Wrench,
  Zap,
  Wind,
  Droplets,
  TreePine,
  Search,
} from 'lucide-react';
import { ObservationDepartment } from '../../types';
import {
  getCategoryKeywords,
  saveCategoryKeywords,
  addKeywordToCategory,
  removeKeywordFromCategory,
  resetCategoryKeywords,
  WhatsAppObservationService,
} from '../../services/whatsappObservationService';
import { ToastService } from '../../services/toastService';

interface CategoryKeywordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesUpdated?: () => void;
}

interface DepartmentConfig {
  id: ObservationDepartment;
  label: string;
  family: 'Hard Service' | 'Soft Service' | 'Specialist';
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
}

const DEPARTMENTS: DepartmentConfig[] = [
  // 1. Hard Service Family
  {
    id: 'Civil',
    label: 'Civil',
    family: 'Hard Service',
    desc: 'Painting, Wall repaint, Door handle/lock, Ceiling cover, Tiles, Cabinet, Steel rack, Flooring & Carpentry',
    icon: Wrench,
    color: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300',
  },
  {
    id: 'Electrical',
    label: 'Electrical',
    family: 'Hard Service',
    desc: 'Busted ceiling light, LED replacement, Sockets, Switches, Power, Wiring, Blinking mirror lights, Exhaust fan',
    icon: Zap,
    color: 'text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/40',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 border-yellow-300',
  },
  {
    id: 'HVAC',
    label: 'HVAC',
    family: 'Hard Service',
    desc: 'Outdoor/Indoor AC units, Pipe hole sealing, Proper insulation, Chillers, Cooling, Thermostats, Ducts',
    icon: Wind,
    color: 'text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/40',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border-cyan-300',
  },
  {
    id: 'Plumbing',
    label: 'Plumbing',
    family: 'Hard Service',
    desc: 'Shower tray change, Handspray leaks, Drain covers, Flush tank refix, Water not draining, Pipes, Taps, Toilets',
    icon: Droplets,
    color: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300',
  },

  // 2. Soft Service Family
  {
    id: 'Housekeeping',
    label: 'Housekeeping',
    family: 'Soft Service',
    desc: 'Deep cleaning, Corridor/room cleaning, Mopping, Dusting, Linen, Bed sheets, Kettle & Interior sanitation',
    icon: Sparkles,
    color: 'text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-300',
  },
  {
    id: 'Landscaping',
    label: 'Landscaping',
    family: 'Soft Service',
    desc: 'Tree trimming, Dry leaves removal, Grass cutting, Lawn care, Gardening, Irrigation, Soil & Curb stones',
    icon: TreePine,
    color: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300',
  },
  {
    id: 'Waste Management',
    label: 'Waste Management',
    family: 'Soft Service',
    desc: 'Waste bins, Litter picking, Trash collection, Garbage bins signage, Discarded materials & Dump skips',
    icon: Trash2,
    color: 'text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-300',
  },

  // 3. Specialist & Safety Facilities
  {
    id: 'Pest Control',
    label: 'Pest Control',
    family: 'Specialist',
    desc: 'Insects, Cockroaches, Bedbugs, Rodents, Stray animals, Flies, Mosquitoes, Termites & Pest Spraying',
    icon: Bug,
    color: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300',
  },
  {
    id: 'HSE',
    label: 'HSE (Health & Safety)',
    family: 'Specialist',
    desc: 'Workplace hazards, PPE violations, Chemical safety, Spillages, Slip/Trip/Fall hazards, Scaffolding',
    icon: ShieldAlert,
    color: 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300',
  },
  {
    id: 'Fire Department',
    label: 'Fire Department',
    family: 'Specialist',
    desc: 'Fire extinguishers, Smoke detectors, Alarms, Fire pumps, Break glass, Hydrants, Hose reels & Fire doors',
    icon: Flame,
    color: 'text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/40',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 border-orange-300',
  },
];

export const CategoryKeywordsModal: React.FC<CategoryKeywordsModalProps> = ({
  isOpen,
  onClose,
  onRulesUpdated,
}) => {
  const [rules, setRules] = useState<Record<ObservationDepartment, string[]>>(() => getCategoryKeywords());
  const [activeTab, setActiveTab] = useState<ObservationDepartment>('Civil');
  const [newKeyword, setNewKeyword] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [isReclassifying, setIsReclassifying] = useState(false);

  if (!isOpen) return null;

  const currentKeywords = rules[activeTab] || [];
  const filteredKeywords = filterSearch.trim()
    ? currentKeywords.filter((kw) => kw.toLowerCase().includes(filterSearch.toLowerCase().trim()))
    : currentKeywords;

  const handleAddKeyword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newKeyword.trim()) return;

    // Support comma-separated entries
    const items = newKeyword
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    let updated = { ...rules };
    items.forEach((item) => {
      updated = addKeywordToCategory(activeTab, item);
    });

    setRules({ ...updated });
    setNewKeyword('');
    ToastService.showSuccess(`Added ${items.length} keyword(s) to ${activeTab}!`);
    if (onRulesUpdated) onRulesUpdated();
  };

  const handleRemoveKeyword = (kw: string) => {
    const updated = removeKeywordFromCategory(activeTab, kw);
    setRules({ ...updated });
    ToastService.showInfo(`Removed "${kw}" from ${activeTab}`);
    if (onRulesUpdated) onRulesUpdated();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all category keywords to system default definitions?')) {
      const defaults = resetCategoryKeywords();
      setRules({ ...defaults });
      ToastService.showSuccess('Category keywords reset to factory defaults.');
      if (onRulesUpdated) onRulesUpdated();
    }
  };

  const handleReclassifyAll = () => {
    setIsReclassifying(true);
    try {
      const res = WhatsAppObservationService.reclassifyAll();
      ToastService.showSuccess(
        `Auto-Categorization Complete! Re-evaluated all observations (${res.updatedCount} updated to exact departments).`
      );
      if (onRulesUpdated) onRulesUpdated();
    } finally {
      setIsReclassifying(false);
    }
  };

  const activeDeptInfo = DEPARTMENTS.find((d) => d.id === activeTab) || DEPARTMENTS[0];

  const families: ('Hard Service' | 'Soft Service' | 'Specialist')[] = [
    'Hard Service',
    'Soft Service',
    'Specialist',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Category Keywords &amp; Department Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure auto-detection keywords for Hard Service (Civil, Electrical, HVAC, Plumbing) and Soft Service (Housekeeping, Landscaping, Waste)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Department Tabs by Family */}
        <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-2 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2">
            {families.map((fam) => {
              const deptsInFamily = DEPARTMENTS.filter((d) => d.family === fam);
              return (
                <div key={fam} className="flex items-center space-x-1 bg-white/70 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 select-none">
                    {fam === 'Hard Service' ? 'Hard' : fam === 'Soft Service' ? 'Soft' : 'Other'}:
                  </span>
                  {deptsInFamily.map((dept) => {
                    const Icon = dept.icon;
                    const count = (rules[dept.id] || []).length;
                    const isActive = activeTab === dept.id;

                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(dept.id);
                          setFilterSearch('');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? `${dept.badgeBg} shadow-xs border`
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{dept.label}</span>
                        <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-black/10 dark:bg-white/10 font-mono">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Category Header Card */}
          <div className={`p-4 rounded-2xl border ${activeDeptInfo.color} flex items-start justify-between`}>
            <div>
              <div className="flex items-center space-x-2">
                <activeDeptInfo.icon className="w-5 h-5" />
                <h3 className="text-sm font-black">
                  {activeDeptInfo.family} &rarr; {activeDeptInfo.label} Auto-Classification
                </h3>
              </div>
              <p className="text-xs opacity-90 mt-1 max-w-xl">{activeDeptInfo.desc}</p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-lg bg-white/60 dark:bg-black/30 border border-current/20 shrink-0">
              {currentKeywords.length} Keywords Active
            </span>
          </div>

          {/* Add Keyword Input Form */}
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={`Add keyword for ${activeDeptInfo.label} (e.g. "pipe hole", "water leak", or comma-separated words)...`}
                className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!newKeyword.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Keyword</span>
            </button>
          </form>

          {/* Filter/Search Bar for existing keywords */}
          {currentKeywords.length > 8 && (
            <div className="relative">
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder={`Search active keywords in ${activeDeptInfo.label}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          )}

          {/* Keywords Chips Container */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Active Keywords for {activeDeptInfo.label}:
              </label>
              <span className="text-[11px] text-slate-400">
                Click <span className="text-rose-500 font-bold">×</span> to remove any keyword
              </span>
            </div>

            {filteredKeywords.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No matching keywords found. Type a keyword above to add it.
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {filteredKeywords.map((kw, kwIdx) => (
                  <span
                    key={`kw-${kwIdx}-${kw}`}
                    className="inline-flex items-center pl-2.5 pr-1 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs group hover:border-indigo-300 dark:hover:border-indigo-600 transition"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="ml-1.5 p-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                      title={`Remove "${kw}"`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Classification Behavior Info */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Classification &amp; Excel Mapping Engine:
            </span>
            <p>
              Observations are scanned against these keywords using phrase-length prioritization. Civil, Electrical, HVAC, and Plumbing defects are automatically assigned and routed to the <strong>Hard Service</strong> Excel sheet with their specific department label. Housekeeping, Landscaping, and Waste Management defects are routed to the <strong>Soft Services</strong> sheet with their specific department label.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReclassifyAll}
              disabled={isReclassifying}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Re-run these keywords on all current observations to accurately assign Civil, Electrical, HVAC, Plumbing, etc."
            >
              <Sparkles className={`w-3.5 h-3.5 ${isReclassifying ? 'animate-spin' : ''}`} />
              <span>Re-classify All Observations</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  Stethoscope,
  Activity,
  PhoneCall,
  Wrench,
  Zap,
  Siren,
  AlertTriangle,
  Users,
  Building2,
  Edit3,
  Trash2,
  Copy,
  Check,
  Plus,
  RotateCcw,
  X,
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CampEmergencyHotline, NationalEmergencyHotline, HotlineColor, HotlineIcon } from './types';

interface HotlinesTabProps {
  campHotlines: CampEmergencyHotline[];
  nationalHotlines: NationalEmergencyHotline[];
  onSaveCampHotlines: (updated: CampEmergencyHotline[]) => void;
  onSaveNationalHotlines: (updated: NationalEmergencyHotline[]) => void;
  onResetCampHotlines: () => void;
  onResetNationalHotlines: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const HotlinesTab: React.FC<HotlinesTabProps> = ({
  campHotlines,
  nationalHotlines,
  onSaveCampHotlines,
  onSaveNationalHotlines,
  onResetCampHotlines,
  onResetNationalHotlines,
  onTriggerFeedback,
}) => {
  const [copiedExtension, setCopiedExtension] = useState<string | null>(null);

  // Camp Hotline Modal States
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [editingCampId, setEditingCampId] = useState<string | null>(null);
  const [campToDelete, setCampToDelete] = useState<CampEmergencyHotline | null>(null);

  // Camp Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formExtension, setFormExtension] = useState('');
  const [formDirectPhone, setFormDirectPhone] = useState('');
  const [formBadgeLabel, setFormBadgeLabel] = useState('24/7 CRITICAL');
  const [formThemeColor, setFormThemeColor] = useState<HotlineColor>('rose');
  const [formIconType, setFormIconType] = useState<HotlineIcon>('flame');

  // National Hotline Modal States
  const [isNatModalOpen, setIsNatModalOpen] = useState(false);
  const [editingNatId, setEditingNatId] = useState<string | null>(null);
  const [natToDelete, setNatToDelete] = useState<NationalEmergencyHotline | null>(null);

  // National Form Fields
  const [formNatName, setFormNatName] = useState('');
  const [formNatNumber, setFormNatNumber] = useState('');
  const [formNatDesc, setFormNatDesc] = useState('');

  const handleCopyPhone = (ext: string) => {
    navigator.clipboard.writeText(ext);
    setCopiedExtension(ext);
    setTimeout(() => setCopiedExtension(null), 2000);
    onTriggerFeedback('success', `Copied "${ext}" to clipboard.`);
  };

  // Camp Hotline Handlers
  const handleOpenAddCamp = () => {
    setEditingCampId(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormExtension('Ext. ');
    setFormDirectPhone('+966 13 888 ');
    setFormBadgeLabel('24/7 ACTIVE');
    setFormThemeColor('rose');
    setFormIconType('flame');
    setIsCampModalOpen(true);
  };

  const handleOpenEditCamp = (hl: CampEmergencyHotline, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCampId(hl.id);
    setFormTitle(hl.title || '');
    setFormSubtitle(hl.subtitle || '');
    setFormExtension(hl.extension || '');
    setFormDirectPhone(hl.directPhone || '');
    setFormBadgeLabel(hl.badgeLabel || '');
    setFormThemeColor(hl.themeColor || 'rose');
    setFormIconType(hl.iconType || 'flame');
    setIsCampModalOpen(true);
  };

  const handleSaveCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formExtension.trim()) return;

    if (editingCampId) {
      const updated = campHotlines.map((h) =>
        h.id === editingCampId
          ? {
              ...h,
              title: formTitle.trim(),
              subtitle: formSubtitle.trim(),
              extension: formExtension.trim(),
              directPhone: formDirectPhone.trim(),
              badgeLabel: formBadgeLabel.trim(),
              themeColor: formThemeColor,
              iconType: formIconType,
            }
          : h
      );
      onSaveCampHotlines(updated);
      onTriggerFeedback('success', `Emergency hotline "${formTitle}" updated.`);
    } else {
      const newHotline: CampEmergencyHotline = {
        id: `camp-hl-${Date.now()}`,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        extension: formExtension.trim(),
        directPhone: formDirectPhone.trim(),
        badgeLabel: formBadgeLabel.trim(),
        themeColor: formThemeColor,
        iconType: formIconType,
      };
      onSaveCampHotlines([...campHotlines, newHotline]);
      onTriggerFeedback('success', `Emergency hotline "${formTitle}" created.`);
    }
    setIsCampModalOpen(false);
  };

  const handleConfirmDeleteCamp = () => {
    if (!campToDelete) return;
    const targetTitle = campToDelete.title;
    const updated = campHotlines.filter((h) => h.id !== campToDelete.id);
    onSaveCampHotlines(updated);
    setCampToDelete(null);
    onTriggerFeedback('info', `Emergency hotline "${targetTitle}" removed.`);
  };

  // National Hotline Handlers
  const handleOpenAddNat = () => {
    setEditingNatId(null);
    setFormNatName('');
    setFormNatNumber('');
    setFormNatDesc('');
    setIsNatModalOpen(true);
  };

  const handleOpenEditNat = (nh: NationalEmergencyHotline, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNatId(nh.id);
    setFormNatName(nh.name || '');
    setFormNatNumber(nh.number || '');
    setFormNatDesc(nh.desc || '');
    setIsNatModalOpen(true);
  };

  const handleSaveNat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNatName.trim() || !formNatNumber.trim()) return;

    if (editingNatId) {
      const updated = nationalHotlines.map((n) =>
        n.id === editingNatId
          ? {
              ...n,
              name: formNatName.trim(),
              number: formNatNumber.trim(),
              desc: formNatDesc.trim(),
            }
          : n
      );
      onSaveNationalHotlines(updated);
      onTriggerFeedback('success', `National service "${formNatName}" updated.`);
    } else {
      const newNat: NationalEmergencyHotline = {
        id: `nat-hl-${Date.now()}`,
        name: formNatName.trim(),
        number: formNatNumber.trim(),
        desc: formNatDesc.trim(),
      };
      onSaveNationalHotlines([...nationalHotlines, newNat]);
      onTriggerFeedback('success', `National service "${formNatName}" added.`);
    }
    setIsNatModalOpen(false);
  };

  const handleConfirmDeleteNat = () => {
    if (!natToDelete) return;
    const targetName = natToDelete.name;
    const updated = nationalHotlines.filter((n) => n.id !== natToDelete.id);
    onSaveNationalHotlines(updated);
    setNatToDelete(null);
    onTriggerFeedback('info', `National service "${targetName}" removed.`);
  };

  const renderIcon = (type: HotlineIcon) => {
    switch (type) {
      case 'flame':
        return <Flame className="w-5 h-5" />;
      case 'stethoscope':
        return <Stethoscope className="w-5 h-5" />;
      case 'activity':
        return <Activity className="w-5 h-5" />;
      case 'shield':
        return <ShieldAlert className="w-5 h-5" />;
      case 'wrench':
        return <Wrench className="w-5 h-5" />;
      case 'zap':
        return <Zap className="w-5 h-5" />;
      case 'siren':
        return <Siren className="w-5 h-5" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'users':
        return <Users className="w-5 h-5" />;
      case 'building':
        return <Building2 className="w-5 h-5" />;
      case 'phone':
      default:
        return <PhoneCall className="w-5 h-5" />;
    }
  };

  const getColorClasses = (color: HotlineColor) => {
    switch (color) {
      case 'rose':
        return {
          cardBorder: 'border-rose-200 dark:border-rose-900/60 hover:border-rose-500',
          iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-600',
          badgeBg: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
          boxBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
          labelColor: 'text-rose-700 dark:text-rose-300',
          extColor: 'text-rose-900 dark:text-rose-200',
          btnBg: 'bg-rose-200/60 text-rose-800 hover:bg-rose-200',
          directColor: 'text-rose-600 dark:text-rose-400',
        };
      case 'emerald':
        return {
          cardBorder: 'border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500',
          iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
          boxBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
          labelColor: 'text-emerald-700 dark:text-emerald-300',
          extColor: 'text-emerald-900 dark:text-emerald-200',
          btnBg: 'bg-emerald-200/60 text-emerald-800 hover:bg-emerald-200',
          directColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'teal':
        return {
          cardBorder: 'border-teal-200 dark:border-teal-900/60 hover:border-teal-500',
          iconBg: 'bg-teal-100 dark:bg-teal-950 text-teal-600',
          badgeBg: 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300',
          boxBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
          labelColor: 'text-teal-700 dark:text-teal-300',
          extColor: 'text-teal-900 dark:text-teal-200',
          btnBg: 'bg-teal-200/60 text-teal-800 hover:bg-teal-200',
          directColor: 'text-teal-600 dark:text-teal-400',
        };
      case 'amber':
        return {
          cardBorder: 'border-amber-200 dark:border-amber-900/60 hover:border-amber-500',
          iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-600',
          badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
          boxBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
          labelColor: 'text-amber-700 dark:text-amber-300',
          extColor: 'text-amber-900 dark:text-amber-200',
          btnBg: 'bg-amber-200/60 text-amber-800 hover:bg-amber-200',
          directColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'blue':
        return {
          cardBorder: 'border-blue-200 dark:border-blue-900/60 hover:border-blue-500',
          iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-600',
          badgeBg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
          boxBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
          labelColor: 'text-blue-700 dark:text-blue-300',
          extColor: 'text-blue-900 dark:text-blue-200',
          btnBg: 'bg-blue-200/60 text-blue-800 hover:bg-blue-200',
          directColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'purple':
        return {
          cardBorder: 'border-purple-200 dark:border-purple-900/60 hover:border-purple-500',
          iconBg: 'bg-purple-100 dark:bg-purple-950 text-purple-600',
          badgeBg: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
          boxBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
          labelColor: 'text-purple-700 dark:text-purple-300',
          extColor: 'text-purple-900 dark:text-purple-200',
          btnBg: 'bg-purple-200/60 text-purple-800 hover:bg-purple-200',
          directColor: 'text-purple-600 dark:text-purple-400',
        };
      case 'cyan':
      default:
        return {
          cardBorder: 'border-cyan-200 dark:border-cyan-900/60 hover:border-cyan-500',
          iconBg: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600',
          badgeBg: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300',
          boxBg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
          labelColor: 'text-cyan-700 dark:text-cyan-300',
          extColor: 'text-cyan-900 dark:text-cyan-200',
          btnBg: 'bg-cyan-200/60 text-cyan-800 hover:bg-cyan-200',
          directColor: 'text-cyan-600 dark:text-cyan-400',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
            Emergency Hotlines &amp; Command Numbers
          </h3>
          <p className="text-xs text-slate-500">24/7 Camp Rapid Response and Saudi National Services</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onResetCampHotlines}
            title="Reset Hotlines to Default"
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddCamp}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Emergency Hotline</span>
          </button>
        </div>
      </div>

      {/* Saudi National Emergency Services */}
      <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-rose-600/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-rose-600 flex items-center justify-center font-black">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Saudi National Emergency Services</h3>
              <p className="text-xs text-rose-100">Official Kingdom-wide emergency contact numbers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenAddNat}
              className="text-xs font-bold px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg flex items-center space-x-1 cursor-pointer transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add National Service</span>
            </button>
            <span className="text-[11px] font-mono bg-rose-800/80 px-2.5 py-1 rounded-lg">
              Direct Toll-Free Dial
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {nationalHotlines.map((hl) => (
            <div
              key={hl.id}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xs border border-white/20 rounded-2xl p-3.5 text-center space-y-1 transition group relative flex flex-col justify-between"
            >
              {/* Edit/Delete hover buttons */}
              <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handleOpenEditNat(hl, e)}
                  title="Edit National Number"
                  className="p-1 rounded bg-black/40 hover:bg-black/60 text-white cursor-pointer text-[10px]"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNatToDelete(hl);
                  }}
                  title="Delete National Number"
                  className="p-1 rounded bg-rose-900/80 hover:bg-rose-950 text-rose-200 cursor-pointer text-[10px]"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-rose-200">
                  {hl.name}
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight group-hover:scale-105 transition-transform">
                  {hl.number}
                </div>
              </div>
              <div className="text-[10px] text-rose-100 line-clamp-1 mt-1">{hl.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Camp Emergency Response Hotlines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campHotlines.map((hl) => {
          const cls = getColorClasses(hl.themeColor || 'rose');
          return (
            <div
              key={hl.id}
              className={`bg-white dark:bg-slate-900 border-2 ${cls.cardBorder} rounded-3xl p-5 space-y-3 relative overflow-hidden transition-all shadow-xs flex flex-col justify-between group`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cls.iconBg}`}>
                      {renderIcon(hl.iconType)}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${cls.badgeBg}`}>
                      {hl.badgeLabel}
                    </span>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditCamp(hl, e)}
                      title="Edit Emergency Hotline"
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCampToDelete(hl);
                      }}
                      title="Delete Emergency Hotline"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    {hl.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {hl.subtitle}
                  </p>
                </div>
              </div>

              {/* Extension & Phone Box */}
              <div className={`p-3.5 ${cls.boxBg} rounded-2xl space-y-1.5 mt-2`}>
                <div className={`text-xs ${cls.labelColor} font-bold`}>Extension:</div>
                <div className={`text-2xl font-black font-mono ${cls.extColor} flex items-center justify-between`}>
                  <span>{hl.extension}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(hl.extension.replace(/[^0-9]/g, '') || hl.extension)}
                    title="Copy Extension"
                    className={`p-1.5 rounded-lg ${cls.btnBg} text-xs font-bold cursor-pointer transition`}
                  >
                    {copiedExtension === (hl.extension.replace(/[^0-9]/g, '') || hl.extension) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {hl.directPhone && (
                  <div className={`text-[11px] ${cls.directColor} font-mono flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5`}>
                    <span>Direct: {hl.directPhone}</span>
                    <a
                      href={`tel:${hl.directPhone.replace(/\s+/g, '')}`}
                      className="text-[10px] font-bold underline hover:opacity-80 flex items-center gap-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT CAMP EMERGENCY HOTLINE
          ======================================================== */}
      <AnimatePresence>
        {isCampModalOpen && (
          <div
            onClick={() => setIsCampModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingCampId ? 'Edit Camp Emergency Hotline' : 'Add New Emergency Hotline'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure hotline title, extension, direct line and styling</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCampModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCamp} className="space-y-3.5 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hotline Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Camp Fire & Safety Control"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description / Scope</label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="e.g. Fire alarm trigger, gas leak, electrical hazard"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Extension Number *</label>
                    <input
                      type="text"
                      required
                      value={formExtension}
                      onChange={(e) => setFormExtension(e.target.value)}
                      placeholder="e.g. Ext. 4411"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct Phone Line</label>
                    <input
                      type="text"
                      value={formDirectPhone}
                      onChange={(e) => setFormDirectPhone(e.target.value)}
                      placeholder="e.g. +966 13 888 4411"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Badge Tag</label>
                    <input
                      type="text"
                      value={formBadgeLabel}
                      onChange={(e) => setFormBadgeLabel(e.target.value)}
                      placeholder="e.g. 24/7 CRITICAL"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme Color</label>
                    <select
                      value={formThemeColor}
                      onChange={(e) => setFormThemeColor(e.target.value as HotlineColor)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="rose">Rose Red</option>
                      <option value="emerald">Emerald Green</option>
                      <option value="teal">Teal Cyan</option>
                      <option value="amber">Amber Gold</option>
                      <option value="blue">Royal Blue</option>
                      <option value="purple">Purple</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Icon Type</label>
                    <select
                      value={formIconType}
                      onChange={(e) => setFormIconType(e.target.value as HotlineIcon)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="flame">Flame (Fire/HSE)</option>
                      <option value="stethoscope">Stethoscope (Medical)</option>
                      <option value="activity">Activity (Repairs)</option>
                      <option value="shield">Shield (Security)</option>
                      <option value="wrench">Wrench (Maintenance)</option>
                      <option value="siren">Siren (Emergency)</option>
                      <option value="zap">Zap (Electrical)</option>
                      <option value="phone">Phone (General)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCampModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    {editingCampId ? 'Save Changes' : 'Create Hotline'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE CAMP HOTLINE CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {campToDelete && (
          <div
            onClick={() => setCampToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Emergency Hotline?</h3>
                  <p className="text-xs text-slate-500">This will remove this hotline from the 24/7 dashboard.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{campToDelete.title}</div>
                <div className="text-slate-500">{campToDelete.extension} • {campToDelete.directPhone}</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCampToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCamp}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete Hotline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: ADD / EDIT NATIONAL HOTLINE
          ======================================================== */}
      <AnimatePresence>
        {isNatModalOpen && (
          <div
            onClick={() => setIsNatModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingNatId ? 'Edit Saudi National Service' : 'Add National Emergency Service'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure Kingdom emergency phone number</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNatModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNat} className="space-y-3 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formNatName}
                    onChange={(e) => setFormNatName(e.target.value)}
                    placeholder="e.g. Red Crescent Ambulance"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Emergency Number *</label>
                  <input
                    type="text"
                    required
                    value={formNatNumber}
                    onChange={(e) => setFormNatNumber(e.target.value)}
                    placeholder="e.g. 997"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <input
                    type="text"
                    value={formNatDesc}
                    onChange={(e) => setFormNatDesc(e.target.value)}
                    placeholder="e.g. Medical Emergency & Ambulance"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsNatModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    {editingNatId ? 'Save Changes' : 'Add Number'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE NATIONAL HOTLINE CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {natToDelete && (
          <div
            onClick={() => setNatToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete National Service?</h3>
                  <p className="text-xs text-slate-500">Remove this emergency number from quick dial.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{natToDelete.name} (#{natToDelete.number})</div>
                <div className="text-slate-500">{natToDelete.desc}</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNatToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteNat}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

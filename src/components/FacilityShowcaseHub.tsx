import React, { useMemo, useState } from 'react';
import {
  Clock,
  ArrowRight,
  Lock,
  ShieldAlert,
  CheckCircle2,
  Filter,
  X,
  Crown,
  Plus,
  Sliders,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Facility } from '../types';
import { getFacilityGraphic } from './FacilityGraphics';
import { StorageService } from '../services/storageService';
import { FacilityLockdownService } from '../services/facilityLockdownService';
import { AuthService } from '../services/authService';
import { FacilityCustomizationService } from '../services/facilityCustomizationService';
import { audioFeedback } from '../services/audioFeedbackService';
import { ActionFeedback } from '../services/actionFeedbackService';

interface FacilityShowcaseHubProps {
  facilities: Facility[];
  selectedDate: string;
  onSelectFacility: (facilityId: string) => void;
  onOpenSearch?: () => void;
  onOpenAdminModal?: () => void;
}

const FACILITY_ACCENT_CLASSES: Record<
  string,
  {
    topBarGradient: string;
    iconBg: string;
    hoverBorder: string;
    hoverText: string;
  }
> = {
  'barber-booking': {
    topBarGradient: 'from-indigo-500 via-indigo-400 to-purple-500',
    iconBg: 'bg-indigo-100/95 dark:bg-indigo-950/80 border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300',
    hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-600',
    hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
  },
  'cricket-ground': {
    topBarGradient: 'from-emerald-500 via-emerald-400 to-teal-500',
    iconBg: 'bg-emerald-100/95 dark:bg-emerald-950/80 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  },
  'football-ground': {
    topBarGradient: 'from-blue-500 via-blue-400 to-sky-500',
    iconBg: 'bg-blue-100/95 dark:bg-blue-950/80 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
  },
  'multipurpose-room': {
    topBarGradient: 'from-purple-500 via-purple-400 to-violet-500',
    iconBg: 'bg-purple-100/95 dark:bg-purple-950/80 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
    hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
  },
  'cinema': {
    topBarGradient: 'from-rose-500 via-rose-400 to-red-500',
    iconBg: 'bg-rose-100/95 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300',
    hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-600',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
  },
  'tennis-court': {
    topBarGradient: 'from-teal-500 via-teal-400 to-emerald-500',
    iconBg: 'bg-teal-100/95 dark:bg-teal-950/80 border-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300',
    hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-600',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
  },
  'cricket-net': {
    topBarGradient: 'from-cyan-500 via-cyan-400 to-sky-500',
    iconBg: 'bg-cyan-100/95 dark:bg-cyan-950/80 border-2 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300',
    hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  },
  'basketball-court': {
    topBarGradient: 'from-amber-500 via-orange-400 to-orange-500',
    iconBg: 'bg-orange-100/95 dark:bg-orange-950/80 border-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
    hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-600',
    hoverText: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
  },
  'isolation-room': {
    topBarGradient: 'from-purple-500 via-purple-400 to-violet-500',
    iconBg: 'bg-purple-100/95 dark:bg-purple-950/80 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
    hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
  },
  'handover-takenover': {
    topBarGradient: 'from-cyan-500 via-cyan-400 to-teal-500',
    iconBg: 'bg-cyan-100/95 dark:bg-cyan-950/80 border-2 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300',
    hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  },
  'parcel-monitoring': {
    topBarGradient: 'from-amber-500 via-amber-400 to-yellow-500',
    iconBg: 'bg-amber-100/95 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  'lost-and-found': {
    topBarGradient: 'from-emerald-500 via-teal-400 to-teal-500',
    iconBg: 'bg-emerald-100/95 dark:bg-emerald-950/80 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  },
  'blank-forms': {
    topBarGradient: 'from-sky-500 via-blue-400 to-indigo-500',
    iconBg: 'bg-sky-100/95 dark:bg-sky-950/80 border-2 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300',
    hoverBorder: 'hover:border-sky-400 dark:hover:border-sky-600',
    hoverText: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
  },
  'invoice-manager': {
    topBarGradient: 'from-teal-500 via-emerald-400 to-emerald-500',
    iconBg: 'bg-teal-100/95 dark:bg-teal-950/80 border-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300',
    hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-600',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
  },
  'announcement-notice': {
    topBarGradient: 'from-amber-500 via-orange-400 to-amber-500',
    iconBg: 'bg-amber-100/95 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  'help-support': {
    topBarGradient: 'from-teal-500 via-cyan-400 to-teal-500',
    iconBg: 'bg-teal-100/95 dark:bg-teal-950/80 border-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300',
    hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-600',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
  },
  'ticket-management': {
    topBarGradient: 'from-blue-600 via-indigo-500 to-blue-500',
    iconBg: 'bg-blue-100/95 dark:bg-blue-950/80 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
  },
  'sla-management': {
    topBarGradient: 'from-purple-500 via-violet-500 to-indigo-500',
    iconBg: 'bg-purple-100/95 dark:bg-purple-950/80 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
    hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
  },
  'automated-workflow': {
    topBarGradient: 'from-cyan-500 via-teal-400 to-blue-500',
    iconBg: 'bg-cyan-100/95 dark:bg-cyan-950/80 border-2 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300',
    hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  },
  'email-management': {
    topBarGradient: 'from-rose-500 via-pink-400 to-rose-400',
    iconBg: 'bg-rose-100/95 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300',
    hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-600',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
  },
};

export const ENTERPRISE_FACILITY_CONFIG: Record<
  string,
  {
    badgeText: string;
    timingText: string;
    liveStatus: string;
    statusColor: string;
    dotColor?: string;
  }
> = {
  'ticket-management': {
    badgeText: 'Work Orders',
    timingText: '24/7 Dispatch',
    liveStatus: 'Active Desk',
    statusColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60',
    dotColor: 'bg-blue-500',
  },
  'isolation-room': {
    badgeText: 'Bed Matrix',
    timingText: '24/7 Medical Clinic',
    liveStatus: 'Clinical Hub',
    statusColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60',
    dotColor: 'bg-rose-500',
  },
  'handover-takenover': {
    badgeText: 'Custody Log',
    timingText: 'Shift Handover',
    liveStatus: 'Active Shift',
    statusColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
  },
  'parcel-monitoring': {
    badgeText: 'Courier Log',
    timingText: '08:00 – 22:00',
    liveStatus: 'Receiving',
    statusColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60',
    dotColor: 'bg-indigo-500',
  },
  'lost-and-found': {
    badgeText: 'Security Vault',
    timingText: '24/7 Security',
    liveStatus: 'Custody Vault',
    statusColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60',
    dotColor: 'bg-purple-500',
  },
  'blank-forms': {
    badgeText: 'Digital Forms',
    timingText: 'Official Templates',
    liveStatus: '40+ Forms',
    statusColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
  },
  'invoice-manager': {
    badgeText: 'Billing & ZATCA',
    timingText: 'Tax Invoicing',
    liveStatus: 'Enterprise',
    statusColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60',
    dotColor: 'bg-teal-500',
  },
  'announcement-notice': {
    badgeText: 'Notice Board',
    timingText: 'Camp Broadcasts',
    liveStatus: 'Live Notices',
    statusColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/60',
    dotColor: 'bg-orange-500',
  },
  'help-support': {
    badgeText: 'Directory & SOS',
    timingText: '24/7 Emergency',
    liveStatus: 'Helpdesk SOS',
    statusColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-800/60',
    dotColor: 'bg-cyan-500',
  },
  'email-management': {
    badgeText: 'Email Gateway',
    timingText: 'SMTP Engine',
    liveStatus: 'Outbox Active',
    statusColor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200/60 dark:border-pink-800/60',
    dotColor: 'bg-pink-500',
  },
  'sla-management': {
    badgeText: 'SLA Radar',
    timingText: 'KPI Scorecard',
    liveStatus: 'Live Radar',
    statusColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/60',
    dotColor: 'bg-violet-500',
  },
  'automated-workflow': {
    badgeText: 'Auto Rules',
    timingText: 'Event Automation',
    liveStatus: 'Rules Active',
    statusColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/60',
    dotColor: 'bg-sky-500',
  },
};

export const FacilityShowcaseHub: React.FC<FacilityShowcaseHubProps> = ({
  facilities,
  selectedDate,
  onSelectFacility,
  onOpenSearch,
  onOpenAdminModal,
}) => {
  const isSuperAdmin = AuthService.isSuperAdmin();
  const currentUsername = AuthService.getUsername();
  const userRoleTitle = AuthService.getUserRole();
  const assignedFacilityIds = useMemo(() => {
    if (isSuperAdmin) return facilities.map((f) => f.id);
    return AuthService.getUserAssignedFacilityIds();
  }, [facilities, isSuperAdmin]);

  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>('all');
  const [deniedModal, setDeniedModal] = useState<{
    isOpen: boolean;
    facility: Facility | null;
  }>({ isOpen: false, facility: null });

  // Super Admin in-place Add / Edit state
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // Add Facility form state
  const [newFacName, setNewFacName] = useState('');
  const [newFacCode, setNewFacCode] = useState('');
  const [newFacCategory, setNewFacCategory] = useState('SPORTS_FITNESS');
  const [newFacStage, setNewFacStage] = useState('Court 1');
  const [newFacOpen, setNewFacOpen] = useState('07:00');
  const [newFacClose, setNewFacClose] = useState('23:00');
  const [newFacCapacity, setNewFacCapacity] = useState(10);
  const [newFacDuration, setNewFacDuration] = useState(60);
  const [newFacDesc, setNewFacDesc] = useState('');

  // Edit Facility form state
  const [editOpenTime, setEditOpenTime] = useState('07:00');
  const [editCloseTime, setEditCloseTime] = useState('23:00');
  const [editCapacity, setEditCapacity] = useState(10);
  const [editCurfewExempt, setEditCurfewExempt] = useState(false);
  const [editStatusOverride, setEditStatusOverride] = useState<'OPERATIONAL' | 'MAINTENANCE' | 'LOCKDOWN' | 'VIP_ONLY' | 'RENOVATION'>('OPERATIONAL');

  const handleCreateFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim() || !newFacCode.trim()) return;

    const id = newFacName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newFac: Facility = {
      id: id || `facility-${Date.now()}`,
      name: newFacName.trim(),
      shortName: newFacName.trim().slice(0, 16),
      code: newFacCode.trim().toUpperCase(),
      stageName: 'Stage / Court',
      sheetTabName: newFacName.trim(),
      icon: 'Building2',
      description: newFacDesc.trim() || `Official campus venue for ${newFacName.trim()}`,
      stages: newFacStage.split(',').map((s) => s.trim()).filter(Boolean).length > 0
        ? newFacStage.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Main Court'],
      defaultSlotDurationMinutes: Number(newFacDuration) || 60,
      openTime: newFacOpen,
      closeTime: newFacClose,
      capacityPerSlot: Number(newFacCapacity) || 10,
      amenities: ['Air Conditioning', 'Campus Security', 'Restrooms'],
      rules: ['Standard Red Sea Global campus conduct applies'],
      accentColor: '#0284c7',
    };

    FacilityCustomizationService.createNewFacility(newFac);
    setIsAddFacilityModalOpen(false);
    setNewFacName('');
    setNewFacCode('');
    setNewFacDesc('');
  };

  const handleSaveFacilitySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility) return;

    FacilityCustomizationService.updateFacility(editingFacility.id, {
      openTime: editOpenTime,
      closeTime: editCloseTime,
      capacityPerSlot: Number(editCapacity) || 10,
      curfewExempt: editCurfewExempt,
      statusOverride: editStatusOverride,
    });

    setEditingFacility(null);
  };

  // Filter facilities if user chose to view only their assigned venues
  const displayedFacilities = useMemo(() => {
    if (scopeFilter === 'assigned' && !isSuperAdmin) {
      return facilities.filter((f) => assignedFacilityIds.includes(f.id));
    }
    return facilities;
  }, [facilities, scopeFilter, assignedFacilityIds, isSuperAdmin]);

  // Calculate real-time availability for each facility
  const facilityStats = useMemo(() => {
    const stats: Record<string, { available: number; booked: number; total: number }> = {};

    facilities.forEach((fac) => {
      const slots = StorageService.getFacilitySlots(fac, selectedDate, fac.stages[0]);
      const availCount = slots.filter((s) => s.status === 'AVAILABLE').length;
      const bookedCount = StorageService.getBookedCountForFacility(fac, selectedDate);
      stats[fac.id] = {
        available: availCount,
        booked: bookedCount,
        total: slots.length,
      };
    });

    return stats;
  }, [facilities, selectedDate]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 h-full animate-in fade-in duration-300">
      {/* Main Container - 20 Facility Cards Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs xl:overflow-hidden overflow-y-auto flex-1 flex flex-col min-h-0 h-full">

        {/* Venue Scope Indicator & Filter Bar for Staff with restricted permissions */}
        {!isSuperAdmin && assignedFacilityIds.length < facilities.length && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 shrink-0 text-xs">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold text-[11px] border border-sky-200 dark:border-sky-800/80">
                <Filter className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Venue Scope: {assignedFacilityIds.length} of {facilities.length} Authorized</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Logged in as <strong className="text-slate-700 dark:text-slate-200">{currentUsername}</strong> ({userRoleTitle})
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Venues ({facilities.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  scopeFilter === 'assigned'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>My Permitted Venues ({assignedFacilityIds.length})</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-1.5 sm:p-2 lg:p-2 xl:p-2 flex-1 flex flex-col min-h-0 h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:grid-rows-4 gap-2 sm:gap-2 lg:gap-2 xl:gap-1.5 2xl:gap-2 flex-1 h-full min-h-0">
            {displayedFacilities.map((fac) => {
              const theme = FACILITY_ACCENT_CLASSES[fac.id] || FACILITY_ACCENT_CLASSES['cricket-ground'];
              const stat = facilityStats[fac.id] || { available: 0, booked: 0, total: 0 };
              const isComingSoon = Boolean(fac.isComingSoon);
              const lockdownStatus = FacilityLockdownService.isFacilityBlocked(fac.id);
              const entConfig = ENTERPRISE_FACILITY_CONFIG[fac.id];
              const isPermitted = isSuperAdmin || assignedFacilityIds.includes(fac.id);

              return (
                <motion.button
                  key={fac.id}
                  whileHover={isComingSoon || !isPermitted ? { scale: 1.003 } : { y: -2, scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={() => {
                    audioFeedback.playTap();
                    if (!isPermitted) {
                      setDeniedModal({ isOpen: true, facility: fac });
                      return;
                    }
                    ActionFeedback.startLoading(fac.name, 'Connecting live schedule & stages...', fac.id, 350);
                    onSelectFacility(fac.id);
                  }}
                  className={`group relative flex flex-col justify-between p-2.5 sm:p-2.5 lg:p-2 xl:p-2 2xl:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 text-left cursor-pointer overflow-hidden min-h-[105px] sm:min-h-[115px] xl:min-h-0 h-full ${
                    !isPermitted
                      ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/90 opacity-65 hover:opacity-85'
                      : lockdownStatus.isBlocked
                      ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                      : isComingSoon
                      ? 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                      : `bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/90 ${theme.hoverBorder} hover:shadow-md hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40 shadow-xs`
                  }`}
                >
                  {/* Top Micro-Accent Color Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${theme.topBarGradient} opacity-90 group-hover:opacity-100 transition-opacity`}
                  />

                  {/* Top Bar: Code Tag (Left) & Availability Status (Right) */}
                  <div className="flex items-center justify-between gap-1 w-full shrink-0 relative z-10 pt-0.5">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-[9px] sm:text-[9.5px] xl:text-[10px] font-bold font-mono tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0">
                        {fac.code}
                      </span>
                      {entConfig && (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate max-w-[70px] xl:max-w-[85px]">
                          {entConfig.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0">
                      {!isPermitted ? (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center space-x-1 shadow-2xs">
                          <Lock className="w-2.5 h-2.5 text-slate-500" />
                          <span>Restricted</span>
                        </span>
                      ) : lockdownStatus.isBlocked ? (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5 text-red-500" />
                          <span>Locked</span>
                        </span>
                      ) : isComingSoon ? (
                        <span className="text-[8.5px] sm:text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Coming Soon
                        </span>
                      ) : entConfig ? (
                        <span className={`text-[8.5px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-full ${entConfig.statusColor} border flex items-center space-x-1.5 shadow-2xs`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${entConfig.dotColor || 'bg-current'} animate-pulse`} />
                          <span>{entConfig.liveStatus}</span>
                        </span>
                      ) : stat.available > 0 ? (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center space-x-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{stat.available} Avail</span>
                        </span>
                      ) : (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                          <span>0 Avail</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Body: Prominently Large Icon (Left) + Name & Description (Right) */}
                  <div className="flex items-center space-x-2.5 sm:space-x-3 lg:space-x-2 xl:space-x-2.5 2xl:space-x-3 w-full my-auto min-h-0 relative z-10 py-0.5 sm:py-1">
                    {/* Modern Squircle Icon Container - Extra Large & Ultra-Crisp */}
                    <div
                      className={`relative w-[58px] h-[58px] sm:w-[66px] sm:h-[66px] lg:w-[58px] lg:h-[58px] xl:w-[66px] xl:h-[66px] 2xl:w-[76px] 2xl:h-[76px] rounded-xl sm:rounded-2xl flex items-center justify-center p-1.5 shrink-0 ${
                        !isPermitted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-700'
                          : lockdownStatus.isBlocked
                          ? 'bg-red-100 dark:bg-red-950/70 text-red-600 border-2 border-red-300 dark:border-red-800'
                          : isComingSoon
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-700'
                          : theme.iconBg
                      } shadow-sm transition-all duration-200 group-hover:scale-108 group-hover:shadow-md`}
                    >
                      {getFacilityGraphic(
                        fac.id,
                        'w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] lg:w-[48px] lg:h-[48px] xl:w-[56px] xl:h-[56px] 2xl:w-[66px] 2xl:h-[66px] drop-shadow-md'
                      )}
                      {!isPermitted && (
                        <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Facility Name & Description */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h3
                        className={`text-xs sm:text-[13px] lg:text-[12px] xl:text-[13px] 2xl:text-[14.5px] font-bold leading-tight truncate transition-colors ${
                          !isPermitted
                            ? 'text-slate-500 dark:text-slate-400'
                            : isComingSoon
                            ? 'text-slate-400'
                            : `text-slate-900 dark:text-white ${theme.hoverText}`
                        }`}
                      >
                        {fac.name}
                      </h3>
                      <p className="text-[9px] sm:text-[9.5px] lg:text-[8.5px] xl:text-[9.5px] 2xl:text-[10.5px] text-slate-500 dark:text-slate-400 font-normal line-clamp-2 leading-tight mt-0.5">
                        {!isPermitted
                          ? 'Operational clearance restricted.'
                          : fac.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Timing & Interactive Action Indicator */}
                  <div className="pt-1 sm:pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[9.5px] xl:text-[10px] font-medium text-slate-400 dark:text-slate-500 w-full shrink-0 relative z-10">
                    <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[95px] sm:max-w-[125px]">
                        {isComingSoon ? 'Standby' : entConfig ? entConfig.timingText : `${fac.openTime} – ${fac.closeTime}`}
                      </span>
                    </div>

                    {!isPermitted ? (
                      <div className="flex items-center space-x-1 text-slate-400 font-medium shrink-0">
                        <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="text-[9px] sm:text-[9.5px]">Restricted</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                        {isSuperAdmin && (
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFacility(fac);
                              setEditOpenTime(fac.openTime);
                              setEditCloseTime(fac.closeTime);
                              setEditCapacity(fac.capacityPerSlot);
                              setEditCurfewExempt(Boolean(fac.curfewExempt));
                              setEditStatusOverride(fac.statusOverride || 'OPERATIONAL');
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[8.5px] sm:text-[9px] uppercase tracking-wider transition cursor-pointer"
                            title="Super Admin: Edit Parameters"
                          >
                            Edit
                          </span>
                        )}
                        <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-semibold transition-all transform group-hover:translate-x-0.5">
                          <span className="text-[9px] sm:text-[9.5px]">{isComingSoon ? 'Details' : 'Open'}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {displayedFacilities.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-medium text-xs space-y-2">
              <Lock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-slate-600 dark:text-slate-300 font-bold">No authorized venues found</p>
              <p className="text-slate-400 text-[11px]">Your account has not been assigned clearance for any venues in this view.</p>
              {scopeFilter === 'assigned' && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-sky-800"
                >
                  View All Village Venues
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Access Denied Modal when clicking an unauthorized facility */}
      {deniedModal.isOpen && deniedModal.facility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-300 dark:border-red-900/80 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setDeniedModal({ isOpen: false, facility: null })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                Security Clearance Required
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white pt-1">
                {deniedModal.facility.name} Access Restricted
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your staff operator account (<span className="font-bold text-slate-800 dark:text-slate-100">@{currentUsername}</span>) does not have authorization to view, enter, or manage reservations for this facility.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>Assigned Venue Scope</span>
                <span className="text-sky-600 dark:text-sky-400">{assignedFacilityIds.length} of {facilities.length} Permitted</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                To request access or update your venue scope, contact your Super Administrator (<span className="font-semibold text-slate-700 dark:text-slate-300">@limon</span>).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeniedModal({ isOpen: false, facility: null })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Close
              </button>
              {scopeFilter !== 'assigned' && (
                <button
                  type="button"
                  onClick={() => {
                    setScopeFilter('assigned');
                    setDeniedModal({ isOpen: false, facility: null });
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  Show Only My Venues
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Super Admin: In-Place Add Facility Modal */}
      {isSuperAdmin && isAddFacilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    Add Campus Facility
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Super Administrator in-place venue creator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacName}
                    onChange={(e) => setNewFacName(e.target.value)}
                    placeholder="e.g. Squash Court"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Venue Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacCode}
                    onChange={(e) => setNewFacCode(e.target.value)}
                    placeholder="e.g. SQ-01"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Stages / Courts / Rooms (Comma separated)
                </label>
                <input
                  type="text"
                  value={newFacStage}
                  onChange={(e) => setNewFacStage(e.target.value)}
                  placeholder="Court 1, Court 2"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Open Time
                  </label>
                  <input
                    type="time"
                    value={newFacOpen}
                    onChange={(e) => setNewFacOpen(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Close Time
                  </label>
                  <input
                    type="time"
                    value={newFacClose}
                    onChange={(e) => setNewFacClose(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Capacity/Slot
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newFacCapacity}
                    onChange={(e) => setNewFacCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={newFacDuration}
                    onChange={(e) => setNewFacDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newFacDesc}
                  onChange={(e) => setNewFacDesc(e.target.value)}
                  placeholder="Official campus recreational venue..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddFacilityModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Facility</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin: In-Place Quick Edit Facility Modal */}
      {isSuperAdmin && editingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    Edit {editingFacility.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Super Admin in-place parameter configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFacility(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacilitySettings} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Open Time
                  </label>
                  <input
                    type="time"
                    value={editOpenTime}
                    onChange={(e) => setEditOpenTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Close Time
                  </label>
                  <input
                    type="time"
                    value={editCloseTime}
                    onChange={(e) => setEditCloseTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Capacity Per Slot (Guests/Players)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Status
                </label>
                <select
                  value={editStatusOverride}
                  onChange={(e) => setEditStatusOverride(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="OPERATIONAL">OPERATIONAL (Normal Service)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Routine Inspection)</option>
                  <option value="LOCKDOWN">LOCKDOWN (Emergency Hold)</option>
                  <option value="VIP_ONLY">VIP ONLY (Restricted Event)</option>
                  <option value="RENOVATION">RENOVATION (Temporary Closed)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="curfewExemptCheckbox"
                  checked={editCurfewExempt}
                  onChange={(e) => setEditCurfewExempt(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="curfewExemptCheckbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Exempt from 23:00 Campus Curfew
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFacility(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Parameters</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

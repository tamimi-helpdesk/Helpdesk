import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Database,
  RefreshCw,
  Layers,
  Sun,
  Moon,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  Lock,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Package,
  Key,
  HelpCircle,
  BedDouble,
  Trophy,
  Settings,
  Zap,
  TrendingUp,
  Shield,
  Users,
  LayoutGrid,
  CalendarCheck,
  PhoneCall,
  Sliders,
  Palette,
  Bell,
  SlidersHorizontal,
  Crown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GasConnectionConfig } from '../types';
import { TamimiLogo } from './TamimiLogo';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../services/authService';
import { OfflineQueueService } from '../services/offlineQueueService';
import { GasService } from '../services/gasService';
import { StorageService } from '../services/storageService';
import { NotificationPopover } from './NotificationPopover';
import { audioFeedback } from '../services/audioFeedbackService';
import { NotificationService } from '../services/notificationService';
import { CloudDatabaseService, CloudDatabaseStatus } from '../services/firebaseService';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSystemSettings?: (tab?: 'profile' | 'theme' | 'team' | 'users' | 'bookings' | 'analytics' | 'clouddb' | 'sync' | 'rules' | 'security' | 'notifications' | 'backup' | 'audit') => void;
  onOpenGasModal: () => void;
  onOpenAdminModal: () => void;
  onOpenExecutiveAnalytics?: () => void;
  onOpenSecurityAudit?: () => void;
  onOpenChangePassword: () => void;
  onOpenSystemBackup?: () => void;
  onLogout: () => void;
  onLockScreen?: () => void;
  onNavigateHome?: () => void;
  onNavigateFacility?: (facilityId: string) => void;
  activeFacilityId?: string;
  currentView?: 'dashboard' | 'booking';
  gasConfig: GasConnectionConfig;
  onSyncGas: () => void;
  isSyncing: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenCommandPalette,
  onOpenSystemSettings,
  onOpenGasModal,
  onOpenAdminModal,
  onOpenExecutiveAnalytics,
  onOpenSecurityAudit,
  onOpenChangePassword,
  onOpenSystemBackup,
  onLogout,
  onLockScreen,
  onNavigateHome,
  onNavigateFacility,
  activeFacilityId,
  currentView = 'dashboard',
  gasConfig,
  onSyncGas,
  isSyncing,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(() => NotificationService.getUnreadCount());
  const [activeSyncAction, setActiveSyncAction] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(() => OfflineQueueService.getPendingCount());
  const [currentUser, setCurrentUser] = useState(() => AuthService.getUsername());
  const [currentProfile, setCurrentProfile] = useState(() => AuthService.getOperatorProfile());
  const [cloudStatus, setCloudStatus] = useState<CloudDatabaseStatus>(() => CloudDatabaseService.getStatus());
  const [isMutedState, setIsMutedState] = useState(() => audioFeedback.getIsMuted());
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const syncMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = CloudDatabaseService.subscribeStatus(setCloudStatus);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleQueueChange = () => {
      setOfflinePendingCount(OfflineQueueService.getPendingCount());
    };
    const handleUserChange = () => {
      setCurrentUser(AuthService.getUsername());
      setCurrentProfile(AuthService.getOperatorProfile());
    };
    const handleNotificationUpdate = () => {
      setUnreadNotifCount(NotificationService.getUnreadCount());
    };
    const handleAudioMuteChange = (e: any) => {
      setIsMutedState(e.detail?.isMuted ?? audioFeedback.getIsMuted());
    };

    window.addEventListener('tamimi_audio_muted', handleAudioMuteChange);

    window.addEventListener('tamimi_offline_queue_updated', handleQueueChange);
    window.addEventListener('tamimi_staff_switched', handleUserChange);
    window.addEventListener('tamimi_profile_updated', handleUserChange);
    window.addEventListener('tamimi_staff_updated', handleUserChange);
    window.addEventListener('tamimi_notifications_updated', handleNotificationUpdate);
    window.addEventListener('tamimi_bookings_updated', handleNotificationUpdate);
    window.addEventListener('tamimi_handover_updated', handleNotificationUpdate);
    window.addEventListener('tamimi_parcels_updated', handleNotificationUpdate);
    window.addEventListener('tamimi_isolation_updated', handleNotificationUpdate);

    return () => {
      window.removeEventListener('tamimi_offline_queue_updated', handleQueueChange);
      window.removeEventListener('tamimi_staff_switched', handleUserChange);
      window.removeEventListener('tamimi_profile_updated', handleUserChange);
      window.removeEventListener('tamimi_staff_updated', handleUserChange);
      window.removeEventListener('tamimi_notifications_updated', handleNotificationUpdate);
      window.removeEventListener('tamimi_bookings_updated', handleNotificationUpdate);
      window.removeEventListener('tamimi_handover_updated', handleNotificationUpdate);
      window.removeEventListener('tamimi_parcels_updated', handleNotificationUpdate);
      window.removeEventListener('tamimi_isolation_updated', handleNotificationUpdate);
      window.removeEventListener('tamimi_audio_muted', handleAudioMuteChange);
    };
  }, []);

  // Auto-dismiss sync feedback notification
  useEffect(() => {
    if (syncFeedback) {
      const timer = setTimeout(() => setSyncFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [syncFeedback]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (syncMenuRef.current && !syncMenuRef.current.contains(event.target as Node)) {
        setIsSyncMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers for distinct sync operations inside the single Master Sync Hub
  const handleExecuteSyncAll = async () => {
    setActiveSyncAction('all');
    try {
      const res = await GasService.syncWithRemote();
      if (res.success) {
        setSyncFeedback({ message: 'Whole system successfully synced with Google Sheets!', type: 'success' });
        onSyncGas();
      } else {
        setSyncFeedback({ message: res.error || 'Sync encountered a connection issue.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Sync failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleExecutePushAll = async () => {
    setActiveSyncAction('push_all');
    try {
      const res = await GasService.pushAllDataToRemote();
      if (res.success) {
        setSyncFeedback({
          message: `Pushed ${res.bookingsCount} bookings, ${res.handoversCount} handovers, ${res.parcelsCount} parcels, ${res.lostFoundCount} lost & found, and ${res.isolationCount} isolation records to Google Sheets!`,
          type: 'success',
        });
        onSyncGas();
      } else {
        setSyncFeedback({ message: res.error || 'Failed to push all data.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Push failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleSyncFacilities = async () => {
    setActiveSyncAction('facilities');
    try {
      const res = await GasService.syncWithRemote();
      if (res.success) {
        setSyncFeedback({ message: 'All 8 Facility & Sports bookings synchronized!', type: 'success' });
        onSyncGas();
      } else {
        setSyncFeedback({ message: res.error || 'Facility sync failed.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Facility sync failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleSyncIsolation = async () => {
    setActiveSyncAction('isolation');
    try {
      await GasService.triggerSetupSheets().catch(() => {});
      const res = await GasService.syncAllIsolationRoomsToSheet();
      if (res.success) {
        setSyncFeedback({ message: `Synced ${res.pushedCount} isolation bed records to Google Sheets!`, type: 'success' });
      } else {
        setSyncFeedback({ message: res.error || 'Isolation room sync failed.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Isolation sync failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleSyncHandovers = async () => {
    setActiveSyncAction('handovers');
    try {
      const records = StorageService.getHandoverRecords();
      const res = await GasService.pushBatchHandoversToRemote(records);
      if (res.success) {
        setSyncFeedback({ message: `Synced ${records.length} handover & key custody records!`, type: 'success' });
      } else {
        setSyncFeedback({ message: res.error || 'Handover sync failed.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Handover sync failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleSyncParcels = async () => {
    setActiveSyncAction('parcels');
    try {
      const records = StorageService.getParcelRecords();
      const res = await GasService.pushBatchParcelsToRemote(records);
      if (res.success) {
        setSyncFeedback({ message: `Synced ${records.length} parcel monitoring records!`, type: 'success' });
      } else {
        setSyncFeedback({ message: res.error || 'Parcel sync failed.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Parcel sync failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleSyncLostFound = async () => {
    setActiveSyncAction('lost_found');
    try {
      const records = StorageService.getLostFoundRecords();
      const res = await GasService.pushBatchLostFoundToRemote(records);
      if (res.success) {
        setSyncFeedback({ message: `Synced ${records.length} lost & found property records!`, type: 'success' });
      } else {
        setSyncFeedback({ message: res.error || 'Lost & found sync failed.', type: 'error' });
      }
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Lost & found sync failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const handleFlushOfflineQueue = async () => {
    setActiveSyncAction('offline');
    try {
      const res = await OfflineQueueService.flushQueue(GasService);
      if (res.successful > 0 || res.total === 0) {
        setSyncFeedback({
          message: `Offline buffer processed (${res.successful} synced, ${res.failed} remaining)!`,
          type: 'success',
        });
      } else {
        setSyncFeedback({
          message: `Could not process offline items (${res.failed} failed to sync).`,
          type: 'error',
        });
      }
      setOfflinePendingCount(OfflineQueueService.getPendingCount());
    } catch (e: any) {
      setSyncFeedback({ message: e.message || 'Offline flush failed.', type: 'error' });
    } finally {
      setActiveSyncAction(null);
    }
  };

  const isAnySyncing = isSyncing || Boolean(activeSyncAction);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b-2 border-slate-200/90 dark:border-slate-800 sticky top-0 z-40 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors duration-200">
      {/* Dynamic Sync Notification Toast */}
      {syncFeedback && (
        <div
          className={`w-full py-1.5 px-4 text-xs font-black text-center flex items-center justify-center space-x-2 transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-600 text-white'
              : syncFeedback.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-sky-600 text-white'
          }`}
        >
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      <div className="w-full px-3 sm:px-4 lg:px-5 xl:px-6 py-1.5 sm:py-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
          
          {/* Brand & Logo Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-3 sm:space-x-4 text-left group cursor-pointer focus:outline-none"
              title="Return to Facility Hub Dashboard"
            >
              {/* Official Tamimi Logo with Responsive Sizing */}
              <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
                <div className="hidden sm:block">
                  <TamimiLogo size={60} />
                </div>
                <div className="block sm:hidden">
                  <TamimiLogo size={40} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                    TAMIMI GLOBAL
                  </h1>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md shrink-0">
                    ENTERPRISE
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] sm:text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px] sm:max-w-none">
                    Facilities &amp; Service Hub
                  </span>
                </div>
              </div>
            </button>

            {/* Mobile quick actions */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 lg:hidden shrink-0">
              {currentView === 'booking' && onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="p-1.5 sm:p-2 rounded-xl bg-sky-600 text-white font-bold transition shadow-xs cursor-pointer"
                  title="Return to Facilities Hub"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}

              {/* Mobile Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  data-notification-trigger="true"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  aria-label="View Notifications"
                  className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Notifications & Updates"
                >
                  <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notification Popover */}
                <NotificationPopover
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onNavigateFacility={onNavigateFacility}
                />
              </div>

              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-600" />
                )}
              </button>

              {/* Mobile User Profile Button */}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xs font-black text-xs cursor-pointer active:scale-95"
                title="User & Settings Hub"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="max-w-[70px] sm:max-w-[80px] truncate">{currentUser}</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-auto lg:mx-4 w-full">
            <form onSubmit={onSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, phone, or unit..."
                className="w-full bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-300/90 dark:border-slate-700/80 rounded-xl pl-10 pr-24 py-2 text-xs sm:text-sm text-slate-950 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25 transition shadow-xs font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
              
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="hidden lg:flex items-center space-x-2.5">
            {/* Desktop Notification Bell Button */}
            <div className="relative">
              <button
                type="button"
                data-notification-trigger="true"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                aria-label="Notifications"
                className={`relative p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                  isNotificationOpen
                    ? 'bg-sky-50 dark:bg-sky-950 border-sky-400 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Notifications Center"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              <NotificationPopover
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onNavigateFacility={onNavigateFacility}
              />
            </div>

            {/* UI Sound Effects Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const newMuted = audioFeedback.toggleMute();
                setIsMutedState(newMuted);
                if (!newMuted) audioFeedback.playTap();
              }}
              aria-label="Toggle UI Sound Effects"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
              title={isMutedState ? 'UI Sounds Muted (Click to turn sound ON)' : 'UI Sounds Active (Click to mute)'}
            >
              {isMutedState ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                audioFeedback.playTap();
                toggleTheme();
              }}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            {/* Direct Settings Button */}
            {onOpenSystemSettings && (
              <button
                type="button"
                onClick={() => onOpenSystemSettings()}
                aria-label="System Settings"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
                title="All System Settings"
              >
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            )}

            {/* User Profile & Operations Menu (Top Right) */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 via-blue-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl shadow-md shadow-sky-600/25 transition-all cursor-pointer select-none active:scale-95 border border-sky-400/30"
                title="Account, Modules & System Settings"
              >
                {currentProfile?.avatarUrl ? (
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentUser}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/40 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {currentUser.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <span className="block text-xs font-black leading-tight max-w-[120px] truncate">{currentUser}</span>
                  <span className="block text-[9px] text-sky-200 leading-none font-bold max-w-[120px] truncate">
                    {currentProfile?.roleTitle || 'Operator'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Operations & User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1.5">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl flex items-center space-x-3">
                    {currentProfile?.avatarUrl ? (
                      <img
                        src={currentProfile.avatarUrl}
                        alt={currentUser}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-sky-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                        {currentUser.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-950 dark:text-white leading-tight truncate">
                        {currentProfile?.firstName ? `${currentProfile.firstName} ${currentProfile.lastName}`.trim() : currentUser}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        @{currentUser} · {currentProfile?.roleTitle || AuthService.getUserRole()}
                      </p>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black">Logged In / Active</span>
                      </div>
                    </div>
                  </div>

                  {/* System Settings Link */}
                  {onOpenSystemSettings && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSystemSettings();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800/60 rounded-xl transition text-left cursor-pointer group"
                      >
                        <Settings className="w-4 h-4 text-sky-500 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
                        <span>All System Settings</span>
                      </button>
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

                  {/* System & Session Controls */}
                  <div className="space-y-0.5">
                    {/* Lock Screen */}
                    {onLockScreen && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLockScreen();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition text-left cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Lock Workstation</span>
                      </button>
                    )}

                    {/* Log Out */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile User Dropdown Modal/Bar if opened on mobile */}
      {isUserMenuOpen && (
        <div className="lg:hidden px-4 pb-3 pt-1 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">{currentUser}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              Active
            </span>
          </div>



          <div className="pt-1 grid grid-cols-3 gap-2">
            {onOpenSystemSettings && (
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenSystemSettings();
                }}
                className="py-2.5 px-2 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900/50 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 flex flex-col items-center justify-center space-y-1"
              >
                <Settings className="w-4 h-4 text-sky-500" />
                <span>Settings</span>
              </button>
            )}
            {onLockScreen && (
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLockScreen();
                }}
                className="py-2.5 px-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center space-y-1"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Lock</span>
              </button>
            )}
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                onLogout();
              }}
              className="py-2.5 px-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex flex-col items-center justify-center space-y-1"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { GasConnectionConfig, OperatorProfile, SystemPreferences } from '../types';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';

// Subcomponents
import { SettingsSidebar, SettingsTabId } from './settings/SettingsSidebar';
import { SettingsTopBar } from './settings/SettingsTopBar';
import { ProfileSettingsTab } from './settings/ProfileSettingsTab';
import { ThemeSettingsTab } from './settings/ThemeSettingsTab';
import { SecuritySettingsTab } from './settings/SecuritySettingsTab';
import { TeamManagementTab } from './settings/TeamManagementTab';
import { FacilityRulesTab } from './settings/FacilityRulesTab';
import { GoogleSyncTab } from './settings/GoogleSyncTab';
import { CloudDatabaseTab } from './settings/CloudDatabaseTab';
import { WhatsAppNotificationsTab } from './settings/WhatsAppNotificationsTab';
import { BookingsArchiveTab } from './settings/BookingsArchiveTab';
import { AnalyticsTab } from './settings/AnalyticsTab';
import { BackupExportTab } from './settings/BackupExportTab';
import { AuditLogsTab } from './settings/AuditLogsTab';
import { FacilityMasterTab } from './settings/FacilityMasterTab';
import { AccessPoliciesTab } from './settings/AccessPoliciesTab';
import { KioskEngineTab } from './settings/KioskEngineTab';
import { StorageDiagnosticsTab } from './settings/StorageDiagnosticsTab';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'theme' | 'team' | 'users' | 'security' | 'rules' | 'facilities-master' | 'access-policies' | 'kiosk-terminal' | 'storage-diagnostics' | 'clouddb' | 'sync' | 'notifications' | 'bookings' | 'analytics' | 'backup' | 'audit';
  gasConfig: GasConnectionConfig;
  onSaveGasConfig: (cfg: GasConnectionConfig) => void;
  onSyncGas: () => void;
  onBookingCancelled?: () => void;
  onOpenChangePassword?: () => void;
  onNavigateFacility?: (facilityId: string) => void;
  onOpenSystemBackup?: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
  gasConfig,
  onSaveGasConfig,
  onSyncGas,
  onBookingCancelled,
  onOpenChangePassword,
  onNavigateFacility,
  onOpenSystemBackup,
}) => {
  // Map tab keys to SettingsTabId
  const tabMap: Record<string, SettingsTabId> = {
    profile: 'profile',
    theme: 'theme',
    team: 'team',
    users: 'team',
    security: 'security',
    rules: 'rules',
    'facilities-master': 'facilities-master',
    facilities: 'facilities-master',
    'access-policies': 'access-policies',
    policies: 'access-policies',
    'kiosk-terminal': 'kiosk-terminal',
    kiosk: 'kiosk-terminal',
    'storage-diagnostics': 'storage-diagnostics',
    storage: 'storage-diagnostics',
    clouddb: 'clouddb',
    sync: 'sync',
    notifications: 'notifications',
    bookings: 'bookings',
    analytics: 'analytics',
    backup: 'backup',
    audit: 'audit',
  };

  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    tabMap[initialTab] || 'profile'
  );

  const [isFullscreen, setIsFullscreen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<OperatorProfile>(() => AuthService.getOperatorProfile());
  const [preferences, setPreferences] = useState<SystemPreferences>(() => AuthService.getSystemPreferences());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Live reload profile and preferences when switched or updated
  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(AuthService.getOperatorProfile());
    };
    const handleStaffUpdate = () => {
      setProfile(AuthService.getOperatorProfile());
    };

    window.addEventListener('tamimi_profile_updated', handleProfileUpdate);
    window.addEventListener('tamimi_staff_switched', handleStaffUpdate);
    window.addEventListener('tamimi_staff_updated', handleStaffUpdate);
    return () => {
      window.removeEventListener('tamimi_profile_updated', handleProfileUpdate);
      window.removeEventListener('tamimi_staff_switched', handleStaffUpdate);
      window.removeEventListener('tamimi_staff_updated', handleStaffUpdate);
    };
  }, []);

  // Sync initial tab when reopened
  useEffect(() => {
    if (isOpen) {
      if (initialTab && tabMap[initialTab]) {
        setActiveTab(tabMap[initialTab]);
      } else {
        setActiveTab('profile');
      }
      setProfile(AuthService.getOperatorProfile());
      setPreferences(AuthService.getSystemPreferences());
    }
  }, [isOpen, initialTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleResetCache = () => {
    if (
      window.confirm(
        'Are you sure you want to clear temporary offline queues and browser cache? Local reservations will remain intact.'
      )
    ) {
      localStorage.removeItem('tamimi_offline_queue_v2');
      AuthService.logSecurityEvent('CONFIG_UPDATED', 'Temporary offline queue and cache purged.');
      showFeedback('Local cache cleared successfully.', 'success');
    }
  };

  const handleGlobalSearch = (q: string) => {
    const query = q.toLowerCase().trim();
    if (!query) return;

    if (query.includes('theme') || query.includes('color') || query.includes('dark') || query.includes('light') || query.includes('font') || query.includes('template') || query.includes('amoled') || query.includes('palette')) {
      setActiveTab('theme');
    } else if (query.includes('pass') || query.includes('sec') || query.includes('pin')) {
      setActiveTab('security');
    } else if (query.includes('user') || query.includes('staff') || query.includes('team') || query.includes('role')) {
      setActiveTab('team');
    } else if (query.includes('venue') || query.includes('facility') || query.includes('facilities') || query.includes('barber') || query.includes('cricket') || query.includes('stage') || query.includes('pitch')) {
      setActiveTab('facilities-master');
    } else if (query.includes('curfew') || query.includes('quota') || query.includes('blacklist') || query.includes('hoard') || query.includes('restrict') || query.includes('policy')) {
      setActiveTab('access-policies');
    } else if (query.includes('kiosk') || query.includes('terminal') || query.includes('printer') || query.includes('thermal') || query.includes('slip') || query.includes('marquee') || query.includes('broadcast')) {
      setActiveTab('kiosk-terminal');
    } else if (query.includes('diagnostics') || query.includes('storage') || query.includes('prune') || query.includes('disk') || query.includes('health') || query.includes('memory')) {
      setActiveTab('storage-diagnostics');
    } else if (query.includes('clouddb') || query.includes('firestore') || query.includes('firebase') || query.includes('disaster')) {
      setActiveTab('clouddb');
    } else if (query.includes('sheet') || query.includes('gas') || query.includes('sync') || query.includes('cloud')) {
      setActiveTab('sync');
    } else if (query.includes('book') || query.includes('slot') || query.includes('cancel')) {
      setActiveTab('bookings');
    } else if (query.includes('rule') || query.includes('limit')) {
      setActiveTab('rules');
    } else if (query.includes('whats') || query.includes('audio') || query.includes('sound') || query.includes('print') || query.includes('desktop') || query.includes('notif') || query.includes('alert') || query.includes('bell')) {
      setActiveTab('notifications');
    } else if (query.includes('report') || query.includes('stat') || query.includes('analytic')) {
      setActiveTab('analytics');
    } else if (query.includes('backup') || query.includes('export') || query.includes('restore') || query.includes('json')) {
      setActiveTab('backup');
    } else if (query.includes('audit') || query.includes('log')) {
      setActiveTab('audit');
    } else {
      setActiveTab('profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="system-settings-modal-root"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-200 animate-fadeIn ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
    >
      {/* Modal Container */}
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-0'
            : 'w-full max-w-[98vw] h-[96vh] rounded-2xl'
        }`}
      >
        {/* Top Header Bar */}
        <SettingsTopBar
          title="Account & System Settings"
          onClose={onClose}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExecuteSearch={handleGlobalSearch}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onNavigateFacility={(facilityId) => {
            if (facilityId === 'audit') {
              setActiveTab('audit');
            } else if (facilityId === 'sync-hub') {
              setActiveTab('sync');
            } else if (onNavigateFacility) {
              onClose();
              onNavigateFacility(facilityId);
            }
          }}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        {/* Main Content Area (Sidebar + Tab View) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Sidebar Navigation */}
          <SettingsSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            profile={profile}
            username={AuthService.getUsername()}
            role={AuthService.getStaffAccounts(true).find((a) => a.username.toLowerCase() === AuthService.getUsername().toLowerCase())?.roleTitle || AuthService.getUserRole()}
            onResetCache={handleResetCache}
          />

          {/* Right Main Scrollable View */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="w-full space-y-6">
              {activeTab === 'profile' && (
                <ProfileSettingsTab
                  profile={profile}
                  onProfileUpdate={setProfile}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'theme' && (
                <ThemeSettingsTab
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'security' && (
                <SecuritySettingsTab
                  preferences={preferences}
                  onPreferencesUpdate={setPreferences}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'team' && (
                <TeamManagementTab
                  currentUsername={AuthService.getUsername()}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'facilities-master' && (
                <FacilityMasterTab onShowFeedback={showFeedback} />
              )}

              {activeTab === 'rules' && (
                <FacilityRulesTab
                  preferences={preferences}
                  onPreferencesUpdate={setPreferences}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'access-policies' && (
                <AccessPoliciesTab
                  preferences={preferences}
                  onPreferencesUpdate={setPreferences}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'kiosk-terminal' && (
                <KioskEngineTab
                  preferences={preferences}
                  onPreferencesUpdate={setPreferences}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'storage-diagnostics' && (
                <StorageDiagnosticsTab onShowFeedback={showFeedback} />
              )}

              {activeTab === 'clouddb' && (
                <CloudDatabaseTab
                  onShowFeedback={showFeedback}
                  onOpenFullDisasterRecovery={onOpenSystemBackup}
                />
              )}

              {activeTab === 'sync' && (
                <GoogleSyncTab
                  gasConfig={gasConfig}
                  onSaveGasConfig={onSaveGasConfig}
                  onSyncGas={onSyncGas}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'notifications' && (
                <WhatsAppNotificationsTab
                  preferences={preferences}
                  onPreferencesUpdate={setPreferences}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'bookings' && (
                <BookingsArchiveTab
                  onBookingCancelled={onBookingCancelled}
                  onShowFeedback={showFeedback}
                />
              )}

              {activeTab === 'analytics' && <AnalyticsTab />}

              {activeTab === 'backup' && (
                <BackupExportTab
                  onShowFeedback={showFeedback}
                  onRefreshAll={() => {
                    if (onSyncGas) onSyncGas();
                  }}
                />
              )}

              {activeTab === 'audit' && <AuditLogsTab />}
            </div>
          </main>
        </div>

        {/* Live Feedback Toast at bottom */}
        {feedback && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 animate-slideUp">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-500 shrink-0" />
            )}
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {feedback.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

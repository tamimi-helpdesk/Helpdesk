import React from 'react';
import {
  User,
  Shield,
  Users,
  SlidersHorizontal,
  RefreshCw,
  MessageSquare,
  Database,
  TrendingUp,
  HardDrive,
  Key,
  Trash2,
  CalendarCheck,
  Palette,
  CheckCircle2,
  BellRing,
  Building2,
  Monitor,
  ShieldAlert,
} from 'lucide-react';
import { OperatorProfile } from '../../types';
import { AuthService } from '../../services/authService';

export type SettingsTabId =
  | 'profile'
  | 'theme'
  | 'security'
  | 'team'
  | 'facilities-master'
  | 'rules'
  | 'bookings'
  | 'analytics'
  | 'access-policies'
  | 'kiosk-terminal'
  | 'storage-diagnostics'
  | 'clouddb'
  | 'sync'
  | 'notifications'
  | 'backup'
  | 'audit'
  | 'danger';

interface SettingsSidebarProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
  profile: OperatorProfile;
  username: string;
  role: string;
  onResetCache: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  username,
  role,
  onResetCache,
}) => {
  const isSuperAdmin = AuthService.isSuperAdmin(username);
  const accounts = AuthService.getStaffAccounts(true);
  const currentAccount = accounts.find(
    (a) =>
      a.username.toLowerCase() === username.toLowerCase() ||
      (a.email && a.email.toLowerCase() === username.toLowerCase())
  );

  const canManageUsers = isSuperAdmin || Boolean(currentAccount?.canManageUsers);
  const canModifyRules = isSuperAdmin || Boolean(currentAccount?.canModifyRules);
  const canManageSync = isSuperAdmin || Boolean(currentAccount?.canManageSync);
  const canExportData = isSuperAdmin || Boolean(currentAccount?.canExportData);
  const canAccessAuditLogs = isSuperAdmin || Boolean(currentAccount?.canAccessAuditLogs);

  // Dynamically filter sections based strictly on granted operator permissions
  const rawSections = [
    {
      group: 'IDENTITY & PREFERENCES',
      items: [
        { id: 'profile' as SettingsTabId, label: 'My Profile & Photo', icon: User, allowed: true },
        { id: 'theme' as SettingsTabId, label: 'Theme & Templates', icon: Palette, allowed: true },
        { id: 'security' as SettingsTabId, label: 'Password & Security', icon: Shield, allowed: true },
        { id: 'team' as SettingsTabId, label: 'Team & User Management', icon: Users, allowed: canManageUsers },
      ],
    },
    {
      group: 'FACILITIES & OPERATIONS',
      items: [
        { id: 'facilities-master' as SettingsTabId, label: 'Facility Master & Venues', icon: Building2, allowed: isSuperAdmin || canModifyRules },
        { id: 'rules' as SettingsTabId, label: 'Facility Lockdowns & Rules', icon: SlidersHorizontal, allowed: canModifyRules },
        { id: 'bookings' as SettingsTabId, label: 'All Bookings Archive', icon: CalendarCheck, allowed: true },
        { id: 'analytics' as SettingsTabId, label: 'Executive Analytics & KPI', icon: TrendingUp, allowed: isSuperAdmin || canExportData },
      ],
    },
    {
      group: 'SUPER ADMIN & POLICY ENGINE',
      items: [
        { id: 'access-policies' as SettingsTabId, label: 'Quota, Curfew & Policies', icon: ShieldAlert, allowed: isSuperAdmin },
        { id: 'kiosk-terminal' as SettingsTabId, label: 'Kiosk, Print & Audio Engine', icon: Monitor, allowed: isSuperAdmin },
        { id: 'storage-diagnostics' as SettingsTabId, label: 'Storage & Health Diagnostics', icon: HardDrive, allowed: isSuperAdmin },
      ],
    },
    {
      group: 'CLOUD & INTEGRATION',
      items: [
        { id: 'clouddb' as SettingsTabId, label: 'Cloud DB & Disaster Recovery', icon: Database, allowed: isSuperAdmin },
        { id: 'sync' as SettingsTabId, label: 'Google Sheets & GAS Sync', icon: RefreshCw, allowed: canManageSync },
        { id: 'notifications' as SettingsTabId, label: 'Desktop & Notifications', icon: BellRing, allowed: true },
      ],
    },
    {
      group: 'ADMINISTRATION & AUDIT',
      items: [
        { id: 'backup' as SettingsTabId, label: 'Backup & Data Export', icon: HardDrive, allowed: canExportData },
        { id: 'audit' as SettingsTabId, label: 'Security & Audit Logs', icon: Key, allowed: canAccessAuditLogs },
      ],
    },
  ];

  // Filter out any items the operator doesn't have permission to see, and omit empty groups
  const navSections = rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.allowed),
    }))
    .filter((section) => section.items.length > 0);

  const displayFullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || currentAccount?.fullName || username;
  const displayEmail = profile.email || currentAccount?.email || `${username.toLowerCase()}@tamimi.com`;
  const displayRole = currentAccount?.roleTitle || (isSuperAdmin ? 'Super Administrator' : 'Facility Operator');

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-slate-50/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-full min-h-0 shrink-0 select-none overflow-hidden">
      {/* Brand / Title at top of Sidebar */}
      <div className="p-3.5 pb-2.5 shrink-0 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center space-x-3 px-1 py-0.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-black text-base">
            T
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
              TAMIMI Executive
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              HelpDesk Settings Hub
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-5 overscroll-contain">
        <nav className="space-y-4 pb-2">
          {navSections.map((section) => (
            <div key={section.group} className="space-y-1">
              <h4 className="px-3 text-[10px] font-extrabold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                {section.group}
              </h4>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-left ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold shadow-2xs border border-sky-200/80 dark:border-sky-800/80'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Danger Zone - strictly visible to Super Administrators only */}
          {isSuperAdmin && (
            <div className="space-y-1 pt-2">
              <h4 className="px-3 text-[10px] font-extrabold tracking-wider text-red-600 dark:text-red-400 uppercase">
                DANGER ZONE
              </h4>
              <button
                onClick={onResetCache}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer select-none text-left"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Reset &amp; Purge Cache</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Operator User Card at bottom of sidebar - Always anchored & 100% visible */}
      <div className="p-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/95 dark:bg-slate-900/95 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
        <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1.5">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayFullName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs ${
                isSuperAdmin
                  ? 'bg-gradient-to-tr from-amber-500 via-indigo-600 to-sky-600'
                  : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
              }`}>
                {displayFullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {displayFullName}
                </h5>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-semibold">
                @{username} · {displayEmail}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" title="Active operator session" />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
            <span className={`px-1.5 py-0.5 rounded font-bold tracking-wide ${
              isSuperAdmin
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300/60'
            }`}>
              {displayRole}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

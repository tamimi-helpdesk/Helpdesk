import React, { useState, useMemo } from 'react';
import {
  Shield,
  Crown,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Download,
  RotateCcw,
  Users,
  Info,
  Lock,
  CalendarCheck,
  Package,
  FileSpreadsheet,
  KeyRound,
  Eye,
  Activity,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { AuthService } from '../../../services/authService';
import { StaffAccount, StaffRole } from '../../../types';

interface RbacPermissionsMatrixProps {
  staffList: StaffAccount[];
  onReload: () => void;
  onShowFeedback: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export type MatrixCategory = 'ALL' | 'BOOKINGS' | 'DESKS' | 'PRIVACY' | 'GOVERNANCE';
export type MatrixDisplayMode = 'ROLES' | 'USERS';

interface PermissionDefinition {
  key: keyof StaffAccount;
  name: string;
  category: MatrixCategory;
  categoryLabel: string;
  description: string;
  adminOnly?: boolean;
}

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // 1. Booking Operations
  {
    key: 'canCreateBookings',
    name: 'Create Bookings',
    category: 'BOOKINGS',
    categoryLabel: 'Booking Operations',
    description: 'Reserve sports facilities, courts, pitches, and meeting halls',
  },
  {
    key: 'canEditBookings',
    name: 'Edit & Reschedule',
    category: 'BOOKINGS',
    categoryLabel: 'Booking Operations',
    description: 'Update booking times, venues, notes, and guest counts',
  },
  {
    key: 'canCancelBookings',
    name: 'Cancel Bookings',
    category: 'BOOKINGS',
    categoryLabel: 'Booking Operations',
    description: 'Cancel reservations with mandatory cancellation reason',
  },
  {
    key: 'canDeleteRecords',
    name: 'Delete Records',
    category: 'BOOKINGS',
    categoryLabel: 'Booking Operations',
    description: 'Permanently purge booking records from local & cloud database',
    adminOnly: true,
  },

  // 2. Campus Logistics & Desks
  {
    key: 'canManageParcels',
    name: 'Parcel Delivery Desk',
    category: 'DESKS',
    categoryLabel: 'Campus Desks',
    description: 'Log, stage, assign locker, and deliver courier shipments',
  },
  {
    key: 'canManageLostFound',
    name: 'Lost & Found Vault',
    category: 'DESKS',
    categoryLabel: 'Campus Desks',
    description: 'Register lost/found items, tags, and verify resident claims',
  },
  {
    key: 'canManageHandovers',
    name: 'Equipment Handover',
    category: 'DESKS',
    categoryLabel: 'Campus Desks',
    description: 'Check out keys, radios, toolkits, and inspect return condition',
  },
  {
    key: 'canManageIsolation',
    name: 'Clinic & Isolation Ward',
    category: 'DESKS',
    categoryLabel: 'Campus Desks',
    description: 'Admit, monitor, and discharge medical isolation patients',
  },
  {
    key: 'canManageWorkflows',
    name: 'Automated Workflow & Pipelines',
    category: 'DESKS',
    categoryLabel: 'Campus Desks',
    description: 'Configure event triggers, automated notifications, and dispatch pipeline',
  },

  // 3. Data Privacy & Governance
  {
    key: 'canViewPii',
    name: 'View Guest PII / Contacts',
    category: 'PRIVACY',
    categoryLabel: 'Data & Privacy',
    description: 'View unmasked guest phone numbers, emails, and staff badges',
  },
  {
    key: 'canExportData',
    name: 'Export Data & CSV',
    category: 'PRIVACY',
    categoryLabel: 'Data & Privacy',
    description: 'Download operational spreadsheets, voucher slips, and PDF logs',
  },
  {
    key: 'canManageSync',
    name: 'Google Sheets & Cloud Sync',
    category: 'PRIVACY',
    categoryLabel: 'Data & Privacy',
    description: 'Trigger manual bi-directional sync to Sheets & Firestore',
  },

  // 4. Security & Administration
  {
    key: 'canManageUsers',
    name: 'Manage Staff & Roles',
    category: 'GOVERNANCE',
    categoryLabel: 'Security & Governance',
    description: 'Create, edit, suspend accounts and assign permissions',
    adminOnly: true,
  },
  {
    key: 'canModifyRules',
    name: 'System Rules & Curfew',
    category: 'GOVERNANCE',
    categoryLabel: 'Security & Governance',
    description: 'Adjust maximum slot quotas, curfew hours, and operating rules',
    adminOnly: true,
  },
  {
    key: 'canAccessAuditLogs',
    name: 'Security Audit Trail',
    category: 'GOVERNANCE',
    categoryLabel: 'Security & Governance',
    description: 'Review security events, failed login lockouts, and operator actions',
    adminOnly: true,
  },
  {
    key: 'canEmergencyLockdown',
    name: 'Emergency Lockdown',
    category: 'GOVERNANCE',
    categoryLabel: 'Security & Governance',
    description: 'Enact or override immediate facility lockdowns and curfews',
    adminOnly: true,
  },
  {
    key: 'canManageSecurity',
    name: 'Security & 2FA Controls',
    category: 'GOVERNANCE',
    categoryLabel: 'Security & Governance',
    description: 'Force password resets, clear lockouts, and manage credentials',
    adminOnly: true,
  },
];

interface RoleColumnConfig {
  role: StaffRole;
  label: string;
  subLabel: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_COLUMNS: RoleColumnConfig[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    subLabel: 'Executive Admin',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
    icon: Crown,
  },
  {
    role: 'FACILITY_OPERATOR',
    label: 'Facility Operator',
    subLabel: 'Front Desk & Sports',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80 border-sky-300 dark:border-sky-800',
    badgeText: 'text-sky-800 dark:text-sky-300',
    icon: CalendarCheck,
  },
  {
    role: 'CAMP_SERVICES_OFFICER',
    label: 'Camp Services',
    subLabel: 'Parcels & Logistics',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    icon: Package,
  },
  {
    role: 'CLINIC_OFFICER',
    label: 'Clinic Officer',
    subLabel: 'Health & Isolation',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800',
    badgeText: 'text-rose-800 dark:text-rose-300',
    icon: Activity,
  },
  {
    role: 'VIEW_ONLY',
    label: 'Viewer',
    subLabel: 'Read-Only Auditor',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    badgeText: 'text-slate-700 dark:text-slate-300',
    icon: Eye,
  },
];

export const RbacPermissionsMatrix: React.FC<RbacPermissionsMatrixProps> = ({
  staffList,
  onReload,
  onShowFeedback,
}) => {
  const [displayMode, setDisplayMode] = useState<MatrixDisplayMode>('ROLES');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<MatrixCategory>('ALL');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const isSuperAdmin = AuthService.isSuperAdmin();

  // Filtered permission rows
  const filteredPermissions = useMemo(() => {
    return PERMISSION_DEFINITIONS.filter((perm) => {
      if (activeCategory !== 'ALL' && perm.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = perm.name.toLowerCase().includes(q);
        const matchDesc = perm.description.toLowerCase().includes(q);
        const matchCat = perm.categoryLabel.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Read role defaults
  const roleDefaults = useMemo(() => {
    return AuthService.getAllRoleDefaultPermissions();
  }, [staffList]);

  // Handle toggle in "ROLES" mode
  const handleToggleRolePermission = (role: StaffRole, permKey: keyof StaffAccount) => {
    if (!isSuperAdmin) {
      onShowFeedback('Super Administrator privilege required to modify role permissions.', 'error');
      return;
    }
    const currentVal = Boolean(roleDefaults[role]?.[permKey]);
    const newVal = !currentVal;

    const res = AuthService.updateRoleDefaultPermission(role, permKey, newVal);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      onReload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Handle toggle in "USERS" mode
  const handleToggleUserPermission = (staffId: string, permKey: keyof StaffAccount) => {
    if (!isSuperAdmin) {
      onShowFeedback('Super Administrator privilege required to modify staff permissions.', 'error');
      return;
    }
    const res = AuthService.toggleStaffPermission(staffId, permKey);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      onReload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Reset all role defaults to canonical system baseline
  const handleResetBaseline = () => {
    if (!isSuperAdmin) {
      onShowFeedback('Super Administrator privilege required.', 'error');
      return;
    }
    const res = AuthService.resetAllRoleDefaultsToCanonical();
    if (res.success) {
      onShowFeedback(res.message, 'success');
      setIsResetConfirmOpen(false);
      onReload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (displayMode === 'ROLES') {
      const headers = ['Permission', 'Category', ...ROLE_COLUMNS.map((r) => r.label), 'Description'];
      const rows = PERMISSION_DEFINITIONS.map((perm) => {
        const cols = ROLE_COLUMNS.map((r) => {
          const val = Boolean(roleDefaults[r.role]?.[perm.key]);
          return val ? 'YES' : 'NO';
        });
        return [
          `"${perm.name}"`,
          `"${perm.categoryLabel}"`,
          ...cols.map((c) => `"${c}"`),
          `"${perm.description.replace(/"/g, '""')}"`,
        ];
      });

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tamimi_rbac_roles_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowFeedback('Exported Roles & Permissions Matrix as CSV', 'success');
    } else {
      const activeStaff = staffList.filter((s) => s.isActive);
      const headers = ['Permission', 'Category', ...activeStaff.map((s) => s.fullName), 'Description'];
      const rows = PERMISSION_DEFINITIONS.map((perm) => {
        const cols = activeStaff.map((s) => {
          const val = Boolean(s[perm.key]);
          return val ? 'YES' : 'NO';
        });
        return [
          `"${perm.name}"`,
          `"${perm.categoryLabel}"`,
          ...cols.map((c) => `"${c}"`),
          `"${perm.description.replace(/"/g, '""')}"`,
        ];
      });

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tamimi_rbac_users_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowFeedback('Exported Staff Overrides Matrix as CSV', 'success');
    }
  };

  return (
    <div className="space-y-4" id="rbac-permissions-matrix-container">
      {/* Top Banner (Echoes the screenshot styling: prominent badge, crisp typography) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-transparent border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/90 text-indigo-800 dark:text-indigo-300 font-extrabold text-[11px] border border-indigo-300 dark:border-indigo-800 mb-1">
              <span>RBAC</span>
              <span className="opacity-60">•</span>
              <span>Roles and Permissions</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Access Control &amp; Authority Matrix
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isSuperAdmin
                ? 'Super Administrator Mode: Click any circular cell to grant or revoke permissions.'
                : 'Read-only View: Permissions are enforced by system security rules.'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Actions */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDisplayMode('ROLES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                displayMode === 'ROLES'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Roles Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('USERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                displayMode === 'USERS'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Accounts ({staffList.length})</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            title="Export full matrix as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Reset Baseline Button (Super Admin only) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title="Reset all role defaults to standard system baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Defaults</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Permissions ({PERMISSION_DEFINITIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('BOOKINGS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'BOOKINGS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Bookings (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('DESKS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'DESKS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Campus Desks (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('PRIVACY')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'PRIVACY'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Data &amp; Privacy (3)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('GOVERNANCE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'GOVERNANCE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Security &amp; IAM (5)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main RBAC Table (Matches the screenshot layout: Permissions in rows, Roles in columns) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 sm:px-5 font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-20 min-w-[240px] sm:min-w-[300px]">
                  Permission
                </th>

                {displayMode === 'ROLES' ? (
                  // Role Columns (from screenshot: Admin, Manager, Editor, Viewer)
                  ROLE_COLUMNS.map((col) => {
                    const IconComp = col.icon;
                    return (
                      <th
                        key={col.role}
                        className="py-3 px-3 text-center min-w-[130px] border-l border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className={`p-1.5 rounded-xl border ${col.badgeBg}`}>
                            <IconComp className={`w-3.5 h-3.5 ${col.badgeText}`} />
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                            {col.label}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {col.subLabel}
                          </span>
                        </div>
                      </th>
                    );
                  })
                ) : (
                  // User Columns (Staff accounts)
                  staffList
                    .filter((s) => s.isActive)
                    .map((staff) => (
                      <th
                        key={staff.id}
                        className="py-3 px-3 text-center min-w-[140px] border-l border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[130px]">
                            {staff.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">
                            @{staff.username}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {staff.roleTitle || staff.role}
                          </span>
                        </div>
                      </th>
                    ))
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayMode === 'ROLES' ? ROLE_COLUMNS.length + 1 : staffList.length + 1}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    No permissions found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((perm) => {
                  return (
                    <tr
                      key={perm.key}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Permission Name & Description (Y-Axis) */}
                      <td className="py-3.5 px-4 sm:px-5 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {perm.name}
                            </span>
                            {perm.adminOnly && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Admin Only
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {perm.description}
                          </span>
                        </div>
                      </td>

                      {/* Cell Values */}
                      {displayMode === 'ROLES'
                        ? // 1. System Role Columns
                          ROLE_COLUMNS.map((col) => {
                            const isGranted = Boolean(roleDefaults[col.role]?.[perm.key]);
                            const isLockedAdmin = perm.adminOnly && col.role !== 'SUPER_ADMIN';

                            return (
                              <td
                                key={`${perm.key}-${col.role}`}
                                className="py-2.5 px-3 text-center border-l border-slate-100 dark:border-slate-800"
                              >
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    disabled={!isSuperAdmin || isLockedAdmin}
                                    onClick={() => handleToggleRolePermission(col.role, perm.key)}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform transform shadow-xs ${
                                      isGranted
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                                    } ${
                                      isSuperAdmin && !isLockedAdmin
                                        ? 'cursor-pointer hover:scale-110 active:scale-95'
                                        : 'cursor-default opacity-85'
                                    }`}
                                    title={
                                      isSuperAdmin
                                        ? `${perm.name} for ${col.label}: ${isGranted ? 'Granted' : 'Denied'} (Click to toggle)`
                                        : `${perm.name} for ${col.label}: ${isGranted ? 'Granted' : 'Denied'}`
                                    }
                                  >
                                    {isGranted ? (
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    ) : (
                                      <X className="w-4 h-4 stroke-[3]" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            );
                          })
                        : // 2. Individual Staff Account Columns
                          staffList
                            .filter((s) => s.isActive)
                            .map((staff) => {
                              const isGranted = Boolean(staff[perm.key]);
                              const isUserSuper = staff.role === 'SUPER_ADMIN';

                              return (
                                <td
                                  key={`${perm.key}-${staff.id}`}
                                  className="py-2.5 px-3 text-center border-l border-slate-100 dark:border-slate-800"
                                >
                                  <div className="flex items-center justify-center">
                                    <button
                                      type="button"
                                      disabled={!isSuperAdmin}
                                      onClick={() => handleToggleUserPermission(staff.id, perm.key)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform transform shadow-xs ${
                                        isGranted
                                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                          : 'bg-rose-500 hover:bg-rose-600 text-white'
                                      } ${
                                        isSuperAdmin
                                          ? 'cursor-pointer hover:scale-110 active:scale-95'
                                          : 'cursor-default opacity-85'
                                      }`}
                                      title={`${perm.name} for ${staff.fullName}: ${isGranted ? 'Granted' : 'Denied'} (Click to toggle)`}
                                    >
                                      {isGranted ? (
                                        <Check className="w-4 h-4 stroke-[3]" />
                                      ) : (
                                        <X className="w-4 h-4 stroke-[3]" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary / Legend */}
        <div className="py-3 px-4 sm:px-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Permitted / Active</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                ✕
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Restricted / Blocked</span>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            {displayMode === 'ROLES' ? 'Showing 5 Enterprise Roles' : `Showing ${staffList.filter((s) => s.isActive).length} Active Team Members`} • Total {filteredPermissions.length} Granular Permissions
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset Baseline */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Reset Baseline Permissions?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will restore all default permissions for all roles back to the initial enterprise baseline. Any custom role changes will be reset.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetBaseline}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-sm"
              >
                Yes, Reset to Baseline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

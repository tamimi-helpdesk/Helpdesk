import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Crown,
  Zap,
  Plus,
  Search,
  Key,
  Edit2,
  Trash2,
  CheckCircle2,
  Download,
  RefreshCw,
  Sparkles,
  Check,
  X,
  Sliders,
  LayoutGrid,
  Table as TableIcon,
  CheckSquare,
  Square,
  History,
  Lock,
  ArrowRightLeft,
  ChevronDown,
  UserCog,
  ShieldAlert,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { StaffAccount, StaffRole } from '../../types';
import { StaffAvatar } from './team/StaffAvatar';
import { StaffEditModal } from './team/StaffEditModal';
import { StaffDeleteModal } from './team/StaffDeleteModal';
import { StaffBulkActionsBar } from './team/StaffBulkActionsBar';
import { SwitchAccountModal } from './team/SwitchAccountModal';

interface TeamManagementTabProps {
  currentUsername?: string;
  onShowFeedback: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type ViewMode = 'table' | 'grid' | 'audit';
type RoleFilter = 'ALL' | 'ADMINS' | 'FACILITY_OPERATOR' | 'VIEW_ONLY';
type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED';
type SortOption = 'role' | 'name_asc' | 'name_desc';

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({ onShowFeedback }) => {
  // Directory state
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id?: string; username: string; role: string; fullName: string } | null>(null);

  // Filters and Views
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('role');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffAccount | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [switchTargetStaff, setSwitchTargetStaff] = useState<StaffAccount | null>(null);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // Load and subscribe
  const reload = () => {
    const list = AuthService.getStaffAccounts(true);
    setStaffList(list);
    const uname = AuthService.getUsername();
    setCurrentUsername(uname);
    setCurrentUser(AuthService.getCurrentUser());
  };

  useEffect(() => {
    reload();

    const handleStaffUpdated = () => reload();
    const handleStaffSwitched = () => reload();

    window.addEventListener('tamimi_staff_updated', handleStaffUpdated);
    window.addEventListener('tamimi_staff_switched', handleStaffSwitched);
    window.addEventListener('tamimi_profile_updated', handleStaffUpdated);

    return () => {
      window.removeEventListener('tamimi_staff_updated', handleStaffUpdated);
      window.removeEventListener('tamimi_staff_switched', handleStaffSwitched);
      window.removeEventListener('tamimi_profile_updated', handleStaffUpdated);
    };
  }, []);

  // Filter and Sort accounts
  const filteredStaff = useMemo(() => {
    return staffList
      .filter((acc) => {
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (acc.fullName || '').toLowerCase().includes(q);
          const matchUser = (acc.username || '').toLowerCase().includes(q);
          const matchRole = (acc.roleTitle || acc.role || '').toLowerCase().includes(q);
          const matchEmail = (acc.email || '').toLowerCase().includes(q);
          const matchPhone = (acc.phoneNumber || '').toLowerCase().includes(q);
          const matchBadge = (acc.badgeId || '').toLowerCase().includes(q);
          const matchDept = (acc.assignedDepartment || '').toLowerCase().includes(q);
          if (!matchName && !matchUser && !matchRole && !matchEmail && !matchPhone && !matchBadge && !matchDept) {
            return false;
          }
        }

        // Role Filter
        if (roleFilter !== 'ALL') {
          if (roleFilter === 'ADMINS') {
            if (acc.role !== 'SUPER_ADMIN' && (acc.role as any) !== 'SUPREME_SUPER_ADMIN') return false;
          } else if (acc.role !== roleFilter) {
            return false;
          }
        }

        // Department Filter
        if (deptFilter !== 'ALL' && acc.assignedDepartment !== deptFilter) {
          return false;
        }

        // Status Filter
        if (statusFilter === 'ACTIVE' && !acc.isActive) return false;
        if (statusFilter === 'SUSPENDED' && acc.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.fullName.localeCompare(b.fullName);
        }
        if (sortBy === 'name_desc') {
          return b.fullName.localeCompare(a.fullName);
        }
        // Default 'role': Super Admins first, then alphabetical
        const aIsSuper = a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN';
        const bIsSuper = b.role === 'SUPER_ADMIN' || (b.role as any) === 'SUPREME_SUPER_ADMIN';
        if (aIsSuper && !bIsSuper) return -1;
        if (!aIsSuper && bIsSuper) return 1;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [staffList, searchQuery, roleFilter, deptFilter, statusFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const admins = staffList.filter((s) => s.role === 'SUPER_ADMIN' || (s.role as any) === 'SUPREME_SUPER_ADMIN').length;
    const operators = staffList.filter(
      (s) => s.role === 'FACILITY_OPERATOR' || s.role === 'CAMP_SERVICES_OFFICER' || s.role === 'CLINIC_OFFICER'
    ).length;
    const active = staffList.filter((s) => s.isActive).length;
    return { total, admins, operators, active };
  }, [staffList]);

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    setSelectedIds(filteredStaff.map((s) => s.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkActivate = () => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: You do not have permission to manage staff status.', 'error');
      return;
    }
    const res = AuthService.bulkSetStaffStatus(selectedIds, true);
    if (res.success) {
      onShowFeedback(`Activated ${selectedIds.length} staff accounts.`, 'success');
      setSelectedIds([]);
      reload();
    }
  };

  const handleBulkSuspend = () => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: You do not have permission to manage staff status.', 'error');
      return;
    }
    const currentSessionUser = currentUser || AuthService.getCurrentUser();
    const safeIds = selectedIds.filter((id) => {
      const acc = staffList.find((s) => s.id === id);
      if (!acc) return false;
      if (currentSessionUser && (acc.username.toLowerCase() === currentSessionUser.username.toLowerCase() || acc.id === currentSessionUser.id)) {
        return false;
      }
      return true;
    });

    const res = AuthService.bulkSetStaffStatus(safeIds, false);
    if (res.success) {
      onShowFeedback(`Suspended ${safeIds.length} staff accounts.`, 'info');
      setSelectedIds([]);
      reload();
    }
  };

  const handleConfirmBulkDelete = () => {
    const currentSessionUser = currentUser || AuthService.getCurrentUser();
    const safeIds = selectedIds.filter((id) => {
      const acc = staffList.find((s) => s.id === id);
      if (!acc) return false;
      if (AuthService.isLimonAccount(acc)) return false;
      if (currentSessionUser && (acc.username.toLowerCase() === currentSessionUser.username.toLowerCase() || acc.id === currentSessionUser.id)) {
        return false;
      }
      return true;
    });

    const res = AuthService.bulkDeleteStaffAccounts(safeIds);
    setIsBulkDeleteModalOpen(false);
    setSelectedIds([]);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Export CSV
  const handleExportSelected = () => {
    const res = AuthService.exportStaffDirectoryCsv();
    if (res.success && res.csvContent) {
      const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowFeedback(`Exported staff directory to CSV`, 'success');
    }
  };

  // Switch User Session
  const handleRequestSwitchUser = (acc: StaffAccount) => {
    setSwitchTargetStaff(acc);
    setIsSwitchModalOpen(true);
  };

  const handleSwitchSuccess = (switched: StaffAccount) => {
    setIsSwitchModalOpen(false);
    setSwitchTargetStaff(null);
    onShowFeedback(`Active operational session transitioned to ${switched.fullName} (@${switched.username})`, 'success');
    reload();
  };

  const isSuperAdmin = AuthService.isSuperAdmin();
  const currentStaffAccount = staffList.find((a) => a.username.toLowerCase() === (currentUsername || '').toLowerCase());
  const canManageUsers = isSuperAdmin || Boolean(currentStaffAccount?.canManageUsers);

  // Duplicate / Clone Account
  const handleDuplicateAccount = (acc: StaffAccount) => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: You do not have permission to clone staff accounts.', 'error');
      return;
    }
    const res = AuthService.duplicateStaffAccount(acc.id);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Open Add Member
  const handleOpenAdd = () => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: Only Super Administrators or authorized managers can register new staff accounts.', 'error');
      return;
    }
    setEditingStaff(null);
    setIsEditModalOpen(true);
  };

  // Open Edit Member
  const handleOpenEdit = (acc: StaffAccount) => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: You do not have permission to modify directory members.', 'error');
      return;
    }
    setEditingStaff(acc);
    setIsEditModalOpen(true);
  };

  // Save Staff
  const handleSaveStaff = (accountToSave: StaffAccount) => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: Unauthorized save attempt.', 'error');
      return;
    }
    const res = AuthService.saveStaffAccount(accountToSave);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      setIsEditModalOpen(false);
      setEditingStaff(null);
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Toggle Single Staff Status (Active <-> Suspended)
  const handleToggleStatus = (acc: StaffAccount) => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: You do not have permission to suspend or activate accounts.', 'error');
      return;
    }
    const currentSessionUser = currentUser || AuthService.getCurrentUser();
    const currUser = (currentSessionUser?.username || currentUsername || '').toLowerCase();

    // Guard: cannot suspend own active session
    if (currUser && (acc.username.toLowerCase() === currUser || acc.id === currentSessionUser?.id)) {
      onShowFeedback(
        `⚠️ Cannot suspend your own active session (@${acc.username}). Switch to another Super Administrator first.`,
        'error'
      );
      return;
    }

    const res = AuthService.toggleStaffStatus(acc.id);
    if (res.success) {
      onShowFeedback(res.message, 'info');
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Request Delete Staff
  const handleRequestDelete = (acc: StaffAccount) => {
    if (!canManageUsers) {
      onShowFeedback('🔒 Administrator Clearance Required: You do not have permission to delete directory accounts.', 'error');
      return;
    }
    const currentSessionUser = currentUser || AuthService.getCurrentUser();
    const currUser = (currentSessionUser?.username || currentUsername || '').toLowerCase();
    const currentSessionId = currentSessionUser?.id;

    // Guard 1: Cannot delete currently active logged in user session
    if (currentSessionId && acc.id === currentSessionId) {
      onShowFeedback(
        `⚠️ Cannot delete your own active session (@${acc.username}). Switch to another Super Administrator account first.`,
        'error'
      );
      return;
    }
    if (!currentSessionId && currUser && acc.username.toLowerCase() === currUser) {
      const sameUsernames = staffList.filter((a) => a.username.toLowerCase() === currUser);
      if (sameUsernames.length <= 1) {
        onShowFeedback(
          `⚠️ Cannot delete your own active session (@${acc.username}). Switch to another Super Administrator account first.`,
          'error'
        );
        return;
      }
    }

    // Guard 2: Cannot delete the last remaining active Super Admin
    const isTargetSuper = acc.role === 'SUPER_ADMIN' || (acc.role as any) === 'SUPREME_SUPER_ADMIN';
    if (isTargetSuper) {
      const remainingActiveSuperAdmins = staffList.filter(
        (a) =>
          (a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN') &&
          a.id !== acc.id &&
          a.isActive
      );
      if (remainingActiveSuperAdmins.length === 0) {
        onShowFeedback(
          '⚠️ Cannot delete the only active Super Administrator. At least one Super Admin must always remain in the directory.',
          'error'
        );
        return;
      }
    }

    setDeletingStaff(acc);
  };

  const handleConfirmDelete = (id: string) => {
    const res = AuthService.deleteStaffAccount(id);
    setDeletingStaff(null);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Deduplicate and Clean up
  const handleDeduplicate = () => {
    if (!isSuperAdmin) {
      onShowFeedback('🔒 Super Administrator Required: Only Master Super Administrators can clean directory architecture.', 'error');
      return;
    }
    const res = AuthService.deduplicateStaffAccounts();
    if (res.success) {
      onShowFeedback(res.message, 'success');
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  // Reset to Defaults
  const handleConfirmRestoreDefaults = () => {
    const res = AuthService.restoreDefaultStaffDirectory();
    setIsRestoreModalOpen(false);
    if (res.success) {
      onShowFeedback(res.message, 'success');
      reload();
    } else {
      onShowFeedback(res.message, 'error');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ========================================================================= */}
      {/* HEADER & MAIN ACTION TOOLBAR                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Team &amp; User Management</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {stats.total} Member{stats.total !== 1 ? 's' : ''}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.admins} Super Admin · {stats.operators} Facility Operator{stats.operators !== 1 ? 's' : ''} · {stats.active} Active on duty
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Management Tools Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Management Tools</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isHeaderMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsHeaderMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-scaleIn text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      handleExportSelected();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Export Directory (CSV)</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      handleDeduplicate();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center space-x-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deduplicate &amp; Clean Accounts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setIsRestoreModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center space-x-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add Staff Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm transition cursor-pointer"
            title={!canManageUsers ? 'Administrator clearance required to add staff' : 'Register new team member'}
          >
            {!canManageUsers ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <Plus className="w-4 h-4" />}
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Streamlined View Navigation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl">
          {/* Members Directory Tab */}
          <button
            type="button"
            onClick={() => {
              if (viewMode !== 'table' && viewMode !== 'grid') setViewMode('table');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'table' || viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </button>

          {/* Inline Table / Grid View Switcher */}
          {(viewMode === 'table' || viewMode === 'grid') && (
            <div className="flex items-center bg-slate-200/60 dark:bg-slate-700/60 rounded-lg p-0.5 ml-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Table view"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Card grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Audit Trail Tab */}
          <button
            type="button"
            onClick={() => setViewMode('audit')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'audit'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Security Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar (if any selected) */}
      <StaffBulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={filteredStaff.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBulkActivate={handleBulkActivate}
        onBulkSuspend={handleBulkSuspend}
        onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        onBulkExport={handleExportSelected}
      />

      {/* Search & Role Filter Chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, @username, or badge ID..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Quick Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              roleFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Roles
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('ADMINS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              roleFilter === 'ADMINS'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Crown className="w-3 h-3" />
            <span>Admins</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('FACILITY_OPERATOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              roleFilter === 'FACILITY_OPERATOR'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Operators</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW: MODERN DATA TABLE                                                   */}
      {/* ========================================================================= */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs min-h-[160px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={selectedIds.length === filteredStaff.length && filteredStaff.length > 0 ? handleClearSelection : handleSelectAll}
                      className="text-slate-400 hover:text-sky-600 transition cursor-pointer"
                    >
                      {selectedIds.length > 0 && selectedIds.length === filteredStaff.length ? (
                        <CheckSquare className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department &amp; Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.map((acc) => {
                  const isCurrent = acc.username.toLowerCase() === (currentUsername || '').toLowerCase() || acc.id === currentUser?.id;
                  const isSuper = acc.role === 'SUPER_ADMIN' || (acc.role as any) === 'SUPREME_SUPER_ADMIN';
                  const isSelected = selectedIds.includes(acc.id);

                  return (
                    <tr
                      key={acc.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-sky-50/40 dark:bg-sky-950/20'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(acc.id)}
                          className="text-slate-400 hover:text-sky-600 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <StaffAvatar
                            fullName={acc.fullName}
                            username={acc.username}
                            avatarUrl={acc.avatarUrl}
                            gradient={isSuper ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-600'}
                            size="md"
                            isCurrent={isCurrent}
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {acc.fullName}
                              </span>
                              {isSuper && (
                                <span title="Super Administrator">
                                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              @{acc.username}{acc.badgeId ? ` · ${acc.badgeId}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {isSuper ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 inline-flex items-center space-x-1">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span>Super Admin</span>
                          </span>
                        ) : acc.role === 'VIEW_ONLY' ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 inline-block">
                            View Only
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-700 inline-flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-sky-500" />
                            <span>Facility Operator</span>
                          </span>
                        )}
                      </td>

                      {/* Department & Scope */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {acc.assignedDepartment === 'ALL' ? 'Executive Operations' : acc.assignedDepartment}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {acc.assignedFacilityIds && acc.assignedFacilityIds.length > 0
                            ? `${acc.assignedFacilityIds.length} Venues Assigned`
                            : 'All Venues'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>On Duty</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                              acc.isActive
                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                : 'bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                            title="Click to toggle status"
                          >
                            {acc.isActive ? 'Active' : 'Suspended'}
                          </button>
                        )}
                      </td>

                      {/* Actions: Clean & Multi-functional */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Quick Switch Button */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRequestSwitchUser(acc)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                              title="Switch active session into this account"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
                              <span className="hidden sm:inline">Switch</span>
                            </button>
                          )}

                          {/* Unified Manage Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(acc)}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                            title="Open comprehensive profile, credentials, permissions, venues & actions hub"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            <span>Manage</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* VIEW 2: ID CARDS GRID VIEW                                                */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map((acc) => {
            const isCurrent = acc.username.toLowerCase() === (currentUsername || '').toLowerCase() || acc.id === currentUser?.id;
            const isSuper = acc.role === 'SUPER_ADMIN' || (acc.role as any) === 'SUPREME_SUPER_ADMIN';
            const isSelected = selectedIds.includes(acc.id);

            return (
              <div
                key={acc.id}
                className={`relative p-4.5 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-3.5 overflow-hidden ${
                  !acc.isActive
                    ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-300/60 dark:border-slate-800 opacity-85'
                    : isCurrent
                    ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-md shadow-sky-500/5'
                    : isSuper
                    ? 'bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-200/90 dark:border-amber-900/60 shadow-2xs'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                {/* Top Row: Checkbox, Avatar, Info & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(acc.id)}
                      className="mt-1 text-slate-400 hover:text-sky-600 transition cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <StaffAvatar
                      fullName={acc.fullName}
                      username={acc.username}
                      avatarUrl={acc.avatarUrl}
                      gradient={isSuper ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-600'}
                      size="lg"
                      isCurrent={isCurrent}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {acc.fullName}
                        </span>
                        {isSuper && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-xs text-slate-400 block truncate">
                        @{acc.username}{acc.badgeId ? ` · ${acc.badgeId}` : ''}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block truncate mt-0.5">
                        {acc.roleTitle || (isSuper ? 'Super Administrator' : 'Staff Member')}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        On Duty
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(acc)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          acc.isActive
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {acc.isActive ? 'Active' : 'Suspended'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Scope Details */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Department &amp; Scope:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {acc.assignedDepartment === 'ALL' ? 'Executive Operations' : acc.assignedDepartment}
                  </span>
                </div>

                {/* Card Action Controls: Clean & Multi-functional */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => handleRequestSwitchUser(acc)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
                        <span>Switch</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Session</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(acc)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    <span>Manage Member</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: SECURITY & USER ACTIVITY AUDIT TRAIL                              */
        /* ========================================================================= */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <History className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Security &amp; Audit Trail</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                AuthService.clearSecurityAuditLogs();
                reload();
                onShowFeedback('Audit trail records purged successfully.', 'info');
              }}
              className="px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {AuthService.getSecurityAuditLogs().length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No security audit events recorded yet.
              </div>
            ) : (
              AuthService.getSecurityAuditLogs().map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.eventType.replace(/_/g, ' ')}
                      </span>
                      {log.username && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                          @{log.username}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED MULTI-FUNCTIONAL STAFF MANAGEMENT HUB                             */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <StaffEditModal
          key={editingStaff ? editingStaff.id : 'new-staff-modal'}
          isOpen={isEditModalOpen}
          editingStaff={editingStaff}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveStaff}
          onSwitchUser={handleRequestSwitchUser}
          onDuplicateUser={handleDuplicateAccount}
          onDeleteUser={handleRequestDelete}
        />
      )}

      {/* ========================================================================= */}
      {/* SECURE SESSION SWITCH MODAL                                               */}
      {/* ========================================================================= */}
      <SwitchAccountModal
        isOpen={isSwitchModalOpen}
        targetStaff={switchTargetStaff}
        onClose={() => {
          setIsSwitchModalOpen(false);
          setSwitchTargetStaff(null);
        }}
        onSuccess={handleSwitchSuccess}
      />

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <StaffDeleteModal
        staff={deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={() => {
          if (deletingStaff) {
            handleConfirmDelete(deletingStaff.id);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* BULK DELETE CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete {selectedIds.length} Selected Accounts?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Protected master accounts and your active session will be safeguarded and not removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                Confirm Bulk Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTORE DEFAULT DIRECTORY MODAL                                           */}
      {/* ========================================================================= */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-sky-600 dark:text-sky-400">
              <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950/60">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Restore Enterprise Directory?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reset the team list to standard enterprise roles (Supreme Admin, Super Admin,
                  Sports Coordinator, Clinic Officer, Logistics).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreDefaults}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer"
              >
                Reset &amp; Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

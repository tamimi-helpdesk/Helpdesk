import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  Lock,
  Check,
  Building,
  Crown,
  AlertCircle,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Key,
  Copy,
  CheckCircle2,
  Sliders,
  ArrowRightLeft,
  Trash2,
  Camera,
  Upload,
  User,
  Mail,
  Phone,
  BadgeCheck,
  ShieldCheck,
  Briefcase,
  Box,
  HeartPulse,
  Power,
  RotateCcw,
} from 'lucide-react';
import { StaffAccount, StaffRole } from '../../../types';
import { AuthService } from '../../../services/authService';
import { FACILITIES } from '../../../data/facilities';
import { StaffAvatar } from './StaffAvatar';

interface StaffEditModalProps {
  isOpen: boolean;
  editingStaff: StaffAccount | null;
  onClose: () => void;
  onSave: (account: StaffAccount) => void;
  onSwitchUser?: (account: StaffAccount) => void;
  onDuplicateUser?: (account: StaffAccount) => void;
  onDeleteUser?: (account: StaffAccount) => void;
}

// Curated avatar presets
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

const getRoleDefaults = (role: StaffRole): Partial<StaffAccount> => {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canDeleteRecords: true,
        canExportData: true,
        canManageSync: true,
        canManageUsers: true,
        canModifyRules: true,
        canManageSecurity: true,
        canManageParcels: true,
        canManageLostFound: true,
        canManageHandovers: true,
        canManageIsolation: true,
        canManageWorkflows: true,
        canAccessAuditLogs: true,
      };
    case 'FACILITY_OPERATOR':
      return {
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canDeleteRecords: false,
        canExportData: true,
        canManageSync: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageSecurity: false,
        canManageParcels: true,
        canManageLostFound: true,
        canManageHandovers: true,
        canManageIsolation: true,
        canManageWorkflows: true,
        canAccessAuditLogs: false,
      };
    case 'CAMP_SERVICES_OFFICER':
      return {
        canCreateBookings: false,
        canEditBookings: false,
        canCancelBookings: false,
        canDeleteRecords: false,
        canExportData: true,
        canManageSync: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageSecurity: false,
        canManageParcels: true,
        canManageLostFound: true,
        canManageHandovers: true,
        canManageIsolation: false,
        canManageWorkflows: true,
        canAccessAuditLogs: false,
      };
    case 'CLINIC_OFFICER':
      return {
        canCreateBookings: false,
        canEditBookings: false,
        canCancelBookings: false,
        canDeleteRecords: false,
        canExportData: true,
        canManageSync: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageSecurity: false,
        canManageParcels: false,
        canManageLostFound: false,
        canManageHandovers: true,
        canManageIsolation: true,
        canManageWorkflows: false,
        canAccessAuditLogs: false,
      };
    case 'VIEW_ONLY':
    default:
      return {
        canCreateBookings: false,
        canEditBookings: false,
        canCancelBookings: false,
        canDeleteRecords: false,
        canExportData: true,
        canManageSync: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageSecurity: false,
        canManageParcels: false,
        canManageLostFound: false,
        canManageHandovers: false,
        canManageIsolation: false,
        canManageWorkflows: false,
        canAccessAuditLogs: false,
      };
  }
};

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  editingStaff,
  onClose,
  onSave,
  onSwitchUser,
  onDuplicateUser,
  onDeleteUser,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'permissions' | 'venues' | 'actions'>('profile');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [venueSearch, setVenueSearch] = useState<string>('');
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const isSuperAdmin = AuthService.isSuperAdmin();
  const isLimonAccount = editingStaff ? AuthService.isLimonAccount(editingStaff) : false;
  const isTargetHelpdesk = editingStaff?.username.toLowerCase() === 'helpdesk';

  // Login credentials state
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const generateRandomPassword = () => {
    const prefixes = ['Tamimi', 'Executive', 'RedSea', 'Portal', 'Secure'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const pass = `${p}@${num}`;
    setPassword(pass);
    setConfirmPassword(pass);
  };

  const [formState, setFormState] = useState<Partial<StaffAccount>>(() => {
    if (editingStaff) {
      return {
        ...editingStaff,
        assignedFacilityIds: Array.isArray(editingStaff.assignedFacilityIds)
          ? editingStaff.assignedFacilityIds
          : (editingStaff.role === 'SUPER_ADMIN' ? FACILITIES.map((f) => f.id) : []),
      };
    }
    return {
      username: '',
      fullName: '',
      role: 'FACILITY_OPERATOR',
      roleTitle: 'Facility Operator',
      email: '',
      phoneNumber: '',
      badgeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      avatarUrl: '',
      pinCode: String(Math.floor(100000 + Math.random() * 900000)),
      assignedDepartment: 'ALL',
      assignedFacilityIds: [],
      canCreateBookings: true,
      canEditBookings: true,
      canCancelBookings: true,
      canExportData: true,
      canManageSync: false,
      canManageUsers: false,
      canModifyRules: false,
      canManageWorkflows: true,
      isActive: true,
    };
  });

  // Synchronize formState whenever editingStaff changes
  useEffect(() => {
    if (isOpen && editingStaff) {
      setFormState({
        ...editingStaff,
        username: editingStaff.username || '',
        fullName: editingStaff.fullName || '',
        role: editingStaff.role || 'FACILITY_OPERATOR',
        roleTitle: editingStaff.roleTitle || (editingStaff.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Facility Operator'),
        email: editingStaff.email || '',
        phoneNumber: editingStaff.phoneNumber || '',
        badgeId: editingStaff.badgeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        avatarUrl: editingStaff.avatarUrl || '',
        pinCode: editingStaff.pinCode || String(Math.floor(100000 + Math.random() * 900000)),
        assignedDepartment: editingStaff.assignedDepartment || 'ALL',
        assignedFacilityIds: Array.isArray(editingStaff.assignedFacilityIds)
          ? editingStaff.assignedFacilityIds
          : (editingStaff.role === 'SUPER_ADMIN' ? FACILITIES.map((f) => f.id) : []),
        canCreateBookings: editingStaff.canCreateBookings !== false,
        canEditBookings: editingStaff.canEditBookings !== false,
        canCancelBookings: editingStaff.canCancelBookings !== false,
        canDeleteRecords: Boolean(editingStaff.canDeleteRecords),
        canExportData: editingStaff.canExportData !== false,
        canManageSync: Boolean(editingStaff.canManageSync),
        canManageUsers: Boolean(editingStaff.canManageUsers),
        canModifyRules: Boolean(editingStaff.canModifyRules),
        canManageSecurity: Boolean(editingStaff.canManageSecurity),
        canManageParcels: editingStaff.canManageParcels !== false,
        canManageLostFound: editingStaff.canManageLostFound !== false,
        canManageHandovers: editingStaff.canManageHandovers !== false,
        canManageIsolation: editingStaff.canManageIsolation !== false,
        canManageWorkflows: editingStaff.canManageWorkflows !== false,
        canAccessAuditLogs: Boolean(editingStaff.canAccessAuditLogs),
        canEmergencyLockdown: Boolean(editingStaff.canEmergencyLockdown),
        isActive: editingStaff.isActive !== false,
      });
      setPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setActiveSubTab('profile');
      setConfirmDelete(false);
    } else if (isOpen && !editingStaff) {
      setFormState({
        username: '',
        fullName: '',
        role: 'FACILITY_OPERATOR',
        roleTitle: 'Facility Operator',
        email: '',
        phoneNumber: '',
        badgeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        avatarUrl: '',
        pinCode: String(Math.floor(100000 + Math.random() * 900000)),
        assignedDepartment: 'ALL',
        assignedFacilityIds: [],
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canExportData: true,
        canManageSync: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageWorkflows: true,
        isActive: true,
      });
      setPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setActiveSubTab('profile');
      setConfirmDelete(false);
    }
  }, [isOpen, editingStaff]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: StaffRole) => {
    if (isTargetHelpdesk && newRole === 'SUPER_ADMIN') {
      setErrorMessage('The helpdesk terminal account cannot be assigned the Super Admin role.');
      return;
    }
    const defaults = getRoleDefaults(newRole);
    let newTitle = formState.roleTitle;
    if (!formState.roleTitle || formState.roleTitle === 'Facility Operator' || formState.roleTitle === 'Super Administrator') {
      newTitle = newRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Facility Operator';
    }

    setFormState((prev) => ({
      ...prev,
      role: newRole,
      roleTitle: newTitle,
      ...defaults,
      assignedFacilityIds: newRole === 'SUPER_ADMIN' ? FACILITIES.map((f) => f.id) : (prev.assignedFacilityIds || []),
    }));
  };

  const handleSetRoleDefaults = () => {
    const role = (formState.role as StaffRole) || 'FACILITY_OPERATOR';
    const defaults = getRoleDefaults(role);
    setFormState((prev) => ({
      ...prev,
      ...defaults,
    }));
  };

  const handleSetGrantAll = () => {
    setFormState((prev) => ({
      ...prev,
      canCreateBookings: true,
      canEditBookings: true,
      canCancelBookings: true,
      canDeleteRecords: canAdminPerms,
      canExportData: true,
      canManageSync: canAdminPerms,
      canManageUsers: canAdminPerms,
      canModifyRules: canAdminPerms,
      canManageSecurity: canAdminPerms,
      canManageParcels: true,
      canManageLostFound: true,
      canManageHandovers: true,
      canManageIsolation: true,
      canManageWorkflows: true,
      canAccessAuditLogs: canAuditPerms,
    }));
  };

  const handleSetReadOnly = () => {
    setFormState((prev) => ({
      ...prev,
      canCreateBookings: false,
      canEditBookings: false,
      canCancelBookings: false,
      canDeleteRecords: false,
      canExportData: true,
      canManageSync: false,
      canManageUsers: false,
      canModifyRules: false,
      canManageSecurity: false,
      canManageParcels: false,
      canManageLostFound: false,
      canManageHandovers: false,
      canManageIsolation: false,
      canManageWorkflows: false,
      canAccessAuditLogs: false,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Profile image size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setFormState((prev) => ({ ...prev, avatarUrl: base64 }));
        setShowAvatarPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleFacility = (id: string) => {
    const current = formState.assignedFacilityIds || [];
    if (current.includes(id)) {
      setFormState({
        ...formState,
        assignedFacilityIds: current.filter((facId) => facId !== id),
      });
    } else {
      setFormState({
        ...formState,
        assignedFacilityIds: [...current, id],
        ...(id === 'automated-workflow' ? { canManageWorkflows: true } : {}),
      });
    }
  };

  const handleSelectAllFacilities = () => {
    setFormState({
      ...formState,
      assignedFacilityIds: FACILITIES.map((f) => f.id),
      canManageWorkflows: true,
    });
  };

  const handleDeselectAllFacilities = () => {
    setFormState({
      ...formState,
      assignedFacilityIds: [],
    });
  };

  const handleCopyCredentials = () => {
    const text = `Tamimi Global Portal Credentials:\n• Full Name: ${formState.fullName || ''}\n• Username: ${formState.username || ''}\n• PIN Code: ${formState.pinCode || ''}\n• Role: ${formState.roleTitle || formState.role || ''}\n• Department: ${formState.assignedDepartment || 'ALL'}`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = (formState.username || '').trim();
    const cleanFullName = (formState.fullName || '').trim();

    if (!cleanUsername) {
      setErrorMessage('Username is required.');
      setActiveSubTab('profile');
      return;
    }

    if (!cleanFullName) {
      setErrorMessage('Full Name is required.');
      setActiveSubTab('profile');
      return;
    }

    // Check duplicate username across directory
    const existingList = AuthService.getStaffAccounts(true);
    const usernameConflict = existingList.find(
      (a) => a.id !== editingStaff?.id && a.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (usernameConflict) {
      setErrorMessage(`The username "@${cleanUsername}" is already taken by another account (${usernameConflict.fullName}). Please choose another.`);
      setActiveSubTab('profile');
      return;
    }

    const cleanPassword = password.trim();
    if (!editingStaff && !cleanPassword) {
      setErrorMessage('Password is required for new accounts.');
      setActiveSubTab('security');
      return;
    }

    if (cleanPassword && cleanPassword !== (confirmPassword || '').trim()) {
      setErrorMessage('Passwords do not match. Please re-enter the matching password.');
      setActiveSubTab('security');
      return;
    }

    let role = (formState.role as StaffRole) || 'FACILITY_OPERATOR';
    if (isTargetHelpdesk) {
      role = 'FACILITY_OPERATOR';
    } else if (!isSuperAdmin && role === 'SUPER_ADMIN') {
      role = editingStaff?.role || 'FACILITY_OPERATOR';
    }

    const canAdmin = isSuperAdmin && !isTargetHelpdesk && role === 'SUPER_ADMIN';

    const accountToSave: StaffAccount = {
      id: editingStaff ? editingStaff.id : AuthService.generateUniqueStaffUID(),
      username: cleanUsername,
      fullName: cleanFullName,
      role: role,
      roleTitle:
        (formState.roleTitle || '').trim() ||
        (role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Staff Member'),
      email: (formState.email || '').trim(),
      phoneNumber: (formState.phoneNumber || '').trim(),
      badgeId: formState.badgeId?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      avatarUrl: formState.avatarUrl || undefined,
      pinCode: formState.pinCode ? formState.pinCode.trim() : '123456',
      password: cleanPassword ? cleanPassword : (editingStaff?.password || undefined),
      assignedDepartment: formState.assignedDepartment || 'ALL',
      assignedFacilityIds: formState.assignedFacilityIds || [],
      canCreateBookings: role === 'VIEW_ONLY' ? false : Boolean(formState.canCreateBookings),
      canEditBookings: role === 'VIEW_ONLY' ? false : Boolean(formState.canEditBookings),
      canCancelBookings: role === 'VIEW_ONLY' ? false : Boolean(formState.canCancelBookings),
      canDeleteRecords: canAdmin ? Boolean(formState.canDeleteRecords) : false,
      canExportData: Boolean(formState.canExportData),
      canManageSync: canAdmin ? Boolean(formState.canManageSync) : false,
      canManageUsers: canAdmin,
      canModifyRules: canAdmin ? Boolean(formState.canModifyRules) : false,
      canManageSecurity: canAdmin ? Boolean(formState.canManageSecurity) : false,
      canManageParcels: Boolean(formState.canManageParcels),
      canManageLostFound: Boolean(formState.canManageLostFound),
      canManageHandovers: Boolean(formState.canManageHandovers),
      canManageIsolation: Boolean(formState.canManageIsolation),
      canManageWorkflows: Boolean(formState.canManageWorkflows),
      canAccessAuditLogs: (isSuperAdmin && !isTargetHelpdesk) ? Boolean(formState.canAccessAuditLogs) : false,
      isActive: isLimonAccount ? true : formState.isActive !== undefined ? Boolean(formState.isActive) : true,
      lastLoginAt: editingStaff?.lastLoginAt,
      createdAt: editingStaff?.createdAt || new Date().toISOString(),
    };

    onSave(accountToSave);
  };

  const isSuperAdminRole = formState.role === 'SUPER_ADMIN';
  const canAdminPerms = isSuperAdmin && !isTargetHelpdesk && isSuperAdminRole;
  const canAuditPerms = isSuperAdmin && !isTargetHelpdesk;

  // Filtered facilities for tab 4
  const filteredFacilities = FACILITIES.filter((f) => {
    if (!venueSearch.trim()) return true;
    const q = venueSearch.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.shortName.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header with Avatar, Name, Role badge, and Quick Info */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3 min-w-0">
            <StaffAvatar
              fullName={formState.fullName || 'New Member'}
              username={formState.username || 'user'}
              avatarUrl={formState.avatarUrl}
              gradient={isSuperAdminRole ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-600'}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {editingStaff ? formState.fullName || editingStaff.fullName : 'Register New Team Member'}
                </h3>
                {isSuperAdminRole && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 flex items-center space-x-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {formState.username ? `@${formState.username}` : 'account setup'} · {formState.roleTitle || 'Staff Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title="Copy Credentials"
            >
              {copiedCredentials ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Functional Nested Tabs Navigation */}
        <div className="grid grid-cols-4 sm:grid-cols-5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 shrink-0 p-1.5 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('security')}
            className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Security &amp; PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('permissions')}
            className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'permissions'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Role &amp; Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('venues')}
            className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'venues'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Venues</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {formState.assignedFacilityIds?.length || 0}
            </span>
          </button>

          {editingStaff && (
            <button
              type="button"
              onClick={() => setActiveSubTab('actions')}
              className={`py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeSubTab === 'actions'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Actions</span>
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-start justify-between gap-2 shadow-xs">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* =========================================================================
              TAB 1: PROFILE & CONTACT
              ========================================================================= */}
          {activeSubTab === 'profile' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Avatar Selector Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <StaffAvatar
                    fullName={formState.fullName || 'User'}
                    username={formState.username || 'user'}
                    avatarUrl={formState.avatarUrl}
                    gradient={isSuperAdminRole ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-600'}
                    size="lg"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Profile Avatar
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Choose preset or upload custom photo
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 shadow-2xs transition cursor-pointer"
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Avatar Preset Grid */}
              {showAvatarPicker && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 animate-fadeIn">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Preset Avatar
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormState({ ...formState, avatarUrl: url });
                          setShowAvatarPicker(false);
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition cursor-pointer ${
                          formState.avatarUrl === url
                            ? 'border-sky-500 ring-2 ring-sky-500/30'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formState.fullName || ''}
                      onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Tariq Al-Mansoor"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Official Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formState.roleTitle || ''}
                      onChange={(e) => setFormState({ ...formState, roleTitle: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Senior Facilities Officer"
                    />
                  </div>
                </div>
              </div>

              {/* Username & Badge ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Username *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">@</span>
                    <input
                      type="text"
                      value={formState.username || ''}
                      onChange={(e) => setFormState({ ...formState, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900 dark:text-white"
                      placeholder="tariq_operator"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Badge ID / Employee Number
                  </label>
                  <div className="relative">
                    <BadgeCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formState.badgeId || ''}
                      onChange={(e) => setFormState({ ...formState, badgeId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono text-slate-900 dark:text-white"
                      placeholder="EMP-1042"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={formState.email || ''}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                      placeholder="operator@tamimi-redsea.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formState.phoneNumber || ''}
                      onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white font-mono"
                      placeholder="+966 50 123 4567"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: SECURITY & PIN
              ========================================================================= */}
          {activeSubTab === 'security' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Quick Terminal PIN */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Quick Terminal PIN Code
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Used for fast touch screen login &amp; shift authentication
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, pinCode: String(Math.floor(100000 + Math.random() * 900000)) })}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random PIN</span>
                  </button>
                </div>

                <div className="relative max-w-xs">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={formState.pinCode || ''}
                    onChange={(e) => setFormState({ ...formState, pinCode: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono font-black tracking-widest text-slate-900 dark:text-white shadow-2xs"
                    placeholder="123456"
                  />
                </div>
              </div>

              {/* Password Credentials */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Login Password {!editingStaff ? '*' : '(Optional change)'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {editingStaff ? 'Leave blank to preserve current password' : 'Create strong password for portal login'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Password</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900 dark:text-white"
                        placeholder={editingStaff ? '••••••••' : 'e.g. Tamimi@2026'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900 dark:text-white"
                        placeholder="Re-type password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Account Status
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Suspended accounts cannot log in or perform terminal tasks
                  </span>
                </div>
                <label className={`relative inline-flex items-center ${isLimonAccount ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={isLimonAccount}
                    checked={Boolean(formState.isActive)}
                    onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formState.isActive ? 'Active' : 'Suspended'}
                  </span>
                </label>
              </div>

              {/* Copy Credentials Quick Action */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Quickly export user login credentials slip for the operator
                </span>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center space-x-1.5"
                >
                  {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: ROLE & PERMISSIONS
              ========================================================================= */}
          {activeSubTab === 'permissions' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Role Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Select Authority Role Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Super Admin */}
                  <div
                    onClick={() => (!isSuperAdmin || isTargetHelpdesk ? null : handleRoleChange('SUPER_ADMIN'))}
                    className={`p-3 rounded-2xl border text-left transition ${
                      !isSuperAdmin || isTargetHelpdesk ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      formState.role === 'SUPER_ADMIN'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">Super Administrator</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Full system access, user administration, permanent deletion, and audit logging.
                    </p>
                  </div>

                  {/* Facility Operator */}
                  <div
                    onClick={() => handleRoleChange('FACILITY_OPERATOR')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                      formState.role === 'FACILITY_OPERATOR'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-sky-500" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">Facility Operator</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Create/edit facility bookings, manage parcels, handovers, and export logs.
                    </p>
                  </div>

                  {/* Camp Services */}
                  <div
                    onClick={() => handleRoleChange('CAMP_SERVICES_OFFICER')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                      formState.role === 'CAMP_SERVICES_OFFICER'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Box className="w-4 h-4 text-emerald-500" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">Camp Services Officer</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Manage parcels, lost &amp; found inventory, handovers, and camp amenities.
                    </p>
                  </div>

                  {/* Clinic Officer */}
                  <div
                    onClick={() => handleRoleChange('CLINIC_OFFICER')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition ${
                      formState.role === 'CLINIC_OFFICER'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">Clinic &amp; Medical Officer</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dedicated access to clinic beds, patient isolation wards, and health shifts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Department Assignment */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Assigned Department
                </label>
                <select
                  value={formState.assignedDepartment || 'ALL'}
                  onChange={(e) => setFormState({ ...formState, assignedDepartment: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Departments (Executive Operations)</option>
                  <option value="SPORTS">Sports &amp; Recreation</option>
                  <option value="CAMP_SERVICES">Camp Services &amp; Amenities</option>
                  <option value="CLINIC_ISOLATION">Medical Clinic &amp; Health</option>
                  <option value="RECREATION">Recreation &amp; Leisure</option>
                </select>
              </div>

              {/* Granular Permission Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Granular Access Permissions
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSetRoleDefaults}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSetGrantAll}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 cursor-pointer"
                    >
                      Grant All
                    </button>
                    <button
                      type="button"
                      onClick={handleSetReadOnly}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      Read Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Bookings */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Facility Bookings
                    </span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canCreateBookings)}
                        onChange={(e) => setFormState({ ...formState, canCreateBookings: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Create Reservations</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canEditBookings)}
                        onChange={(e) => setFormState({ ...formState, canEditBookings: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Edit / Reassign Bookings</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canCancelBookings)}
                        onChange={(e) => setFormState({ ...formState, canCancelBookings: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Cancel Reservations</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canExportData)}
                        onChange={(e) => setFormState({ ...formState, canExportData: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Export Reports &amp; CSV</span>
                    </label>
                  </div>

                  {/* Camp Operations */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Camp Modules
                    </span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canManageParcels)}
                        onChange={(e) => setFormState({ ...formState, canManageParcels: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Parcel Management</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canManageLostFound)}
                        onChange={(e) => setFormState({ ...formState, canManageLostFound: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Lost &amp; Found Registry</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canManageHandovers)}
                        onChange={(e) => setFormState({ ...formState, canManageHandovers: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Shift Handovers</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canManageIsolation)}
                        onChange={(e) => setFormState({ ...formState, canManageIsolation: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Clinic &amp; Isolation Beds</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.canManageWorkflows)}
                        onChange={(e) => setFormState({ ...formState, canManageWorkflows: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-sky-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Automated Workflow &amp; Rules</span>
                    </label>
                  </div>

                  {/* Administrative Governance */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 sm:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Governance &amp; Administrative Control
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`flex items-center space-x-2 ${!canAdminPerms ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!canAdminPerms}
                          checked={Boolean(formState.canDeleteRecords)}
                          onChange={(e) => setFormState({ ...formState, canDeleteRecords: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-sky-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Permanent Record Deletion</span>
                      </label>
                      <label className={`flex items-center space-x-2 ${!canAdminPerms ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!canAdminPerms}
                          checked={Boolean(formState.canManageUsers)}
                          onChange={(e) => setFormState({ ...formState, canManageUsers: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-sky-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Manage Team Accounts (IAM)</span>
                      </label>
                      <label className={`flex items-center space-x-2 ${!canAdminPerms ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!canAdminPerms}
                          checked={Boolean(formState.canManageSync)}
                          onChange={(e) => setFormState({ ...formState, canManageSync: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-sky-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">System Synchronization</span>
                      </label>
                      <label className={`flex items-center space-x-2 ${!canAuditPerms ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!canAuditPerms}
                          checked={Boolean(formState.canAccessAuditLogs)}
                          onChange={(e) => setFormState({ ...formState, canAccessAuditLogs: e.target.checked })}
                          className="w-3.5 h-3.5 rounded text-sky-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">View Security Audit Trail</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: VENUE SCOPE
              ========================================================================= */}
          {activeSubTab === 'venues' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues by name or code..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllFacilities}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllFacilities}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredFacilities.map((fac) => {
                  const isSelected = formState.assignedFacilityIds?.includes(fac.id);
                  return (
                    <button
                      key={fac.id}
                      type="button"
                      onClick={() => handleToggleFacility(fac.id)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center space-x-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-400 dark:border-sky-600 text-sky-900 dark:text-sky-200 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="truncate block">{fac.name}</span>
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 block truncate">
                          {fac.shortName} · Code: {fac.code}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: ACCOUNT ACTIONS (When editing existing staff)
              ========================================================================= */}
          {activeSubTab === 'actions' && editingStaff && (
            <div className="space-y-3 animate-fadeIn">
              {/* Switch Session Action */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Switch Active Session to This User
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Transition your current terminal session to @{editingStaff.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSwitchUser) onSwitchUser(editingStaff);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                  <span>Switch Session</span>
                </button>
              </div>

              {/* Duplicate Member */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Clone Member as Template
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Creates a duplicate with the same role, venues, and permissions
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onDuplicateUser) onDuplicateUser(editingStaff);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Duplicate Member</span>
                </button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                      Danger Zone: Delete Staff Member
                    </span>
                    <span className="text-[11px] text-rose-700/80 dark:text-rose-400 block">
                      Permanently revokes access and removes profile from the system
                    </span>
                  </div>

                  {!confirmDelete ? (
                    <button
                      type="button"
                      disabled={isLimonAccount}
                      onClick={() => setConfirmDelete(true)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                        isLimonAccount
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onDeleteUser) onDeleteUser(editingStaff);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  )}
                </div>

                {isLimonAccount && (
                  <p className="text-[10px] text-slate-500 font-medium">
                    This account is designated as the primary system administrator and cannot be deleted.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingStaff ? 'Save Changes' : 'Register Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

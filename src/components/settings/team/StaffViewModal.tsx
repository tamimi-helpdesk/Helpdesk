import React from 'react';
import {
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Crown,
  Key,
  Edit2,
  CheckCircle2,
  Shield,
  Zap,
  MapPin,
  Lock,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';
import { StaffAccount, StaffRole } from '../../../types';
import { AuthService } from '../../../services/authService';
import { FACILITIES } from '../../../data/facilities';
import { StaffAvatar } from './StaffAvatar';

interface StaffViewModalProps {
  staff: StaffAccount | null;
  currentUsername: string;
  onClose: () => void;
  onEdit: (staff: StaffAccount) => void;
  onResetPin: (staff: StaffAccount) => void;
  onToggleStatus: (staff: StaffAccount) => void;
  onDelete: (staff: StaffAccount) => void;
  onSwitchUser: (staff: StaffAccount) => void;
}

export const StaffViewModal: React.FC<StaffViewModalProps> = ({
  staff,
  currentUsername,
  onClose,
  onEdit,
  onResetPin,
  onToggleStatus,
  onDelete,
  onSwitchUser,
}) => {
  if (!staff) return null;

  const isCurrent = staff.username.toLowerCase() === currentUsername.toLowerCase();
  const isLimon = AuthService.isLimonAccount(staff);
  const isSupreme = isLimon || staff.role === 'SUPREME_SUPER_ADMIN';

  const assignedFacilitiesList = FACILITIES.filter(
    (f) => staff.assignedFacilityIds && staff.assignedFacilityIds.includes(f.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        {/* Header Profile Summary */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <StaffAvatar
              fullName={staff.fullName}
              username={staff.username}
              avatarUrl={staff.avatarUrl}
              gradient={isLimon ? 'from-amber-500 to-yellow-600' : 'from-sky-500 via-indigo-500 to-purple-600'}
              size="xl"
              isCurrent={isCurrent}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {staff.fullName}
                </h3>
                {isLimon ? (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-black text-[10px] flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                    <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Root Super Admin · Protected</span>
                  </span>
                ) : isSupreme ? (
                  <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    <Crown className="w-3.5 h-3.5" />
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                @{staff.username} · <span className="text-sky-600 dark:text-sky-400">{staff.roleTitle}</span>
              </p>
              {staff.badgeId && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Badge: {staff.badgeId}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCurrent ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchUser(staff);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
            >
              Switch To This User
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Current Session (On-Duty)</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(staff);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onResetPin(staff);
            }}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Reset Password & PIN</span>
          </button>

          {!isLimon && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleStatus(staff);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                staff.isActive
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {staff.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{staff.isActive ? 'Suspend' : 'Activate'}</span>
            </button>
          )}

          {!isLimon ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(staff);
              }}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition cursor-pointer"
              title="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-black flex items-center space-x-1 border border-amber-200 dark:border-amber-800/80"
              title="Limon Rahman cannot be deleted by anyone"
            >
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Permanent Root Owner</span>
            </span>
          )}
        </div>

        {/* Contact Details & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
              Email Address
            </span>
            {staff.email ? (
              <a
                href={`mailto:${staff.email}`}
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline truncate block"
              >
                {staff.email}
              </a>
            ) : (
              <span className="text-slate-400 italic">Not Provided</span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
              Phone / WhatsApp
            </span>
            {staff.phoneNumber ? (
              <a
                href={`tel:${staff.phoneNumber}`}
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline truncate block"
              >
                {staff.phoneNumber}
              </a>
            ) : (
              <span className="text-slate-400 italic">Not Provided</span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
              Department
            </span>
            <span className="font-black text-slate-800 dark:text-slate-200 block">
              {staff.assignedDepartment}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
              Created Date
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              {new Date(staff.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Assigned Facilities */}
        {assignedFacilitiesList.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Assigned Venues ({assignedFacilitiesList.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {assignedFacilitiesList.map((fac) => (
                <span
                  key={fac.id}
                  className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold text-[11px] border border-sky-200 dark:border-sky-800"
                >
                  {fac.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Active RBAC Rights &amp; Access Controls
            </span>
            {staff.customOverridesActive ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Custom Overrides Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Standard Role Defaults
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canCreateBookings ? 'text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canCreateBookings ? '✓' : '✕'}</span>
              <span>Create Bookings</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canEditBookings ? 'text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canEditBookings ? '✓' : '✕'}</span>
              <span>Edit Bookings</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canCancelBookings ? 'text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canCancelBookings ? '✓' : '✕'}</span>
              <span>Cancel Bookings</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canDeleteRecords ? 'text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canDeleteRecords ? '✓' : '✕'}</span>
              <span>Delete Records</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canExportData ? 'text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canExportData ? '✓' : '✕'}</span>
              <span>Export Reports</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageParcels ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageParcels ? '✓' : '✕'}</span>
              <span>📦 Parcels Desk</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageLostFound ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageLostFound ? '✓' : '✕'}</span>
              <span>🔍 Lost &amp; Found</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageHandovers ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageHandovers ? '✓' : '✕'}</span>
              <span>📋 Shift Handovers</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageIsolation ? 'text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageIsolation ? '✓' : '✕'}</span>
              <span>🏥 Medical Ward</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageWorkflows ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageWorkflows ? '✓' : '✕'}</span>
              <span>⚡ Automated Workflow</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageUsers ? 'text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageUsers ? '✓' : '✕'}</span>
              <span>👥 User Admin</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canModifyRules ? 'text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canModifyRules ? '✓' : '✕'}</span>
              <span>⚙️ Rules &amp; Curfews</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canManageSync ? 'text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canManageSync ? '✓' : '✕'}</span>
              <span>☁️ Cloud Sync</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canAccessAuditLogs ? 'text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canAccessAuditLogs ? '✓' : '✕'}</span>
              <span>🛡️ Audit Logs</span>
            </div>

            <div
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg ${
                staff.canEmergencyLockdown ? 'text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/40' : 'text-slate-400 line-through'
              }`}
            >
              <span>{staff.canEmergencyLockdown ? '✓' : '✕'}</span>
              <span>🚨 Lockdown</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

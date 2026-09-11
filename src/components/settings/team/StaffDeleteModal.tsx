import React from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Lock, ShieldCheck } from 'lucide-react';
import { StaffAccount } from '../../../types';
import { AuthService } from '../../../services/authService';
import { StaffAvatar } from './StaffAvatar';

interface StaffDeleteModalProps {
  staff: StaffAccount | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const StaffDeleteModal: React.FC<StaffDeleteModalProps> = ({
  staff,
  onClose,
  onConfirm,
}) => {
  if (!staff) return null;

  const isLimon = AuthService.isLimonAccount(staff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        {isLimon ? (
          <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Protected Root Account
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                Limon Rahman cannot be deleted by anyone.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Permanently Delete User?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will permanently revoke login credentials and access rights.
              </p>
            </div>
          </div>
        )}

        {isLimon && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-black text-amber-900 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Permanent Root Super Administrator Protection</span>
            </div>
            <p className="leading-relaxed">
              Limon Rahman is the designated Founder and Master Super Administrator. By core security architecture, this root account cannot be deleted or revoked by anyone.
            </p>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
          <StaffAvatar
            fullName={staff.fullName}
            username={staff.username}
            avatarUrl={staff.avatarUrl}
            gradient={isLimon ? 'from-amber-500 to-yellow-600' : 'from-rose-500 to-amber-600'}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-black text-slate-900 dark:text-white text-xs truncate">
              {staff.fullName}
            </p>
            <p className="text-slate-500 font-semibold text-[11px] truncate">
              @{staff.username} · {staff.roleTitle}
            </p>
            <p className="text-[10px] text-slate-400">Dept: {staff.assignedDepartment}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {isLimon ? 'Close' : 'Cancel'}
          </button>
          {!isLimon && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer"
            >
              Confirm Permanent Deletion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

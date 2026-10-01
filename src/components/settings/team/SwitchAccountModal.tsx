import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Crown,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  ArrowRightLeft,
} from 'lucide-react';
import { StaffAccount } from '../../../types';
import { AuthService } from '../../../services/authService';
import { StaffAvatar } from './StaffAvatar';

interface SwitchAccountModalProps {
  isOpen: boolean;
  targetStaff: StaffAccount | null;
  onClose: () => void;
  onSuccess: (switchedStaff: StaffAccount) => void;
}

export const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({
  isOpen,
  targetStaff,
  onClose,
  onSuccess,
}) => {
  const [secret, setSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSecret('');
      setShowSecret(false);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, targetStaff]);

  if (!isOpen || !targetStaff) return null;

  const isTargetSuper =
    targetStaff.role === 'SUPER_ADMIN' || (targetStaff.role as any) === 'SUPREME_SUPER_ADMIN';
  const isHelpdesk = targetStaff.username.toLowerCase() === 'helpdesk';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = secret.trim();

    if (!cleanSecret) {
      setErrorMessage('Please enter the account password or 6-digit Terminal PIN.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = AuthService.verifyAndSwitchStaff(targetStaff, cleanSecret);

    if (result.success) {
      setIsSubmitting(false);
      onSuccess(targetStaff);
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.message || 'Authorization rejected. Incorrect password or PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isTargetSuper
              ? 'bg-amber-500/10 border-amber-200 dark:border-amber-900/50'
              : 'bg-sky-500/10 border-sky-200 dark:border-sky-900/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl shadow-xs ${
                isTargetSuper
                  ? 'bg-amber-500 text-white shadow-amber-500/30'
                  : 'bg-sky-600 text-white shadow-sky-600/30'
              }`}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Switch Active Session
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Mandatory Credential Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Account Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center space-x-3.5">
            <StaffAvatar
              fullName={targetStaff.fullName}
              username={targetStaff.username}
              avatarUrl={targetStaff.avatarUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {targetStaff.fullName}
                </span>
                {isTargetSuper ? (
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                @{targetStaff.username} · {targetStaff.badgeId || 'No Badge ID'}
              </p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    isTargetSuper
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                  }`}
                >
                  {targetStaff.roleTitle || targetStaff.role}
                </span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
              isTargetSuper
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-start space-x-2">
              {isTargetSuper ? (
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold leading-relaxed">
                  {isTargetSuper ? (
                    <>
                      <strong>Super Administrator Authority Required:</strong> Switching to this
                      account grants full master authority over facilities, security rules, and user
                      administration. You must enter this administrator's password or terminal PIN.
                    </>
                  ) : (
                    <>
                      Enter the login password or 6-digit Terminal PIN for{' '}
                      <strong>@{targetStaff.username}</strong> to authorize this terminal handover.
                    </>
                  )}
                </p>
                {isHelpdesk && (
                  <p className="text-[11px] text-sky-700 dark:text-sky-300 font-mono font-bold">
                    Default Terminal PIN: 188188 (or password: Amaala@188)
                  </p>
                )}
                {isTargetSuper && targetStaff.username.toLowerCase() === 'limon' && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono font-bold">
                    Default Super Admin PIN: 202688 (or password: Limon@2026)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Password / PIN Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Password or 6-Digit PIN *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoFocus
                placeholder="Enter password or PIN..."
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900 dark:text-white transition"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition cursor-pointer flex items-center space-x-1.5 ${
                isTargetSuper
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
              } ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Verify & Switch Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

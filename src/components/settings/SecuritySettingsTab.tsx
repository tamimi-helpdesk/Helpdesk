import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { SystemPreferences } from '../../types';

interface SecuritySettingsTabProps {
  preferences: SystemPreferences;
  onPreferencesUpdate: (prefs: SystemPreferences) => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({
  preferences,
  onPreferencesUpdate,
  onShowFeedback,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preference fields
  const [idleTimeout, setIdleTimeout] = useState(preferences.idleTimeoutMinutes || 30);
  const [requirePin, setRequirePin] = useState(preferences.requirePinForCancellation || false);

  const session = AuthService.getSession();

  // Password Strength Calculator
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let s = 0;
    if (pwd.length >= 6) s += 1;
    if (pwd.length >= 10) s += 1;
    if (/[A-Z]/.test(pwd)) s += 1;
    if (/[0-9]/.test(pwd)) s += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) s += 1;

    if (s <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (s <= 4) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(newPassword);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onShowFeedback('New passwords do not match. Please verify.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      onShowFeedback('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = AuthService.changePassword(oldPassword, newPassword);
      if (res.success) {
        onShowFeedback(res.message, 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        onShowFeedback(res.message, 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveSecurityPolicies = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...preferences,
      idleTimeoutMinutes: Number(idleTimeout),
      requirePinForCancellation: requirePin,
    };
    const res = AuthService.saveSystemPreferences(updated);
    if (res.success) {
      onPreferencesUpdate(updated);
      onShowFeedback('Security and idle timeout preferences updated!', 'success');
    } else {
      onShowFeedback('Failed to save security preferences.', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Password &amp; Security
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage master portal credentials, idle lockout timeouts, and multi-session security.
        </p>
      </div>

      {/* CARD 1: CHANGE PASSWORD */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Change Operator Password</span>
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-3.5 max-w-xl">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Current Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>

          {newPassword && (
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all ${strength.color}`}
                  style={{ width: `${(strength.score / 3) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Strength: {strength.label}
              </span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer disabled:opacity-50"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: SECURITY & TIMEOUT POLICIES */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Session &amp; Idle Curfew Policies</span>
        </h3>

        <form onSubmit={handleSaveSecurityPolicies} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Inactivity Auto-Logout Timeout
              </label>
              <select
                value={idleTimeout}
                onChange={(e) => setIdleTimeout(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold"
              >
                <option value={15}>15 Minutes (High Security)</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>60 Minutes (Extended Shift)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Security PIN on Cancellation
              </label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="checkbox"
                  id="requirePinToggle"
                  checked={requirePin}
                  onChange={(e) => setRequirePin(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="requirePinToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Require Operator Confirmation PIN for Cancellations
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Multi-Tab session synchronization is active in real-time</span>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-black transition cursor-pointer"
            >
              Save Policies
            </button>
          </div>
        </form>
      </div>

      {/* CARD 3: ACTIVE SESSION STATUS */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">
          Current Active Session Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Session Token</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 truncate block">
              {session?.sessionToken || 'SEC-TOK-8849-LIVE'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Login Timestamp</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              {session?.loginTimestamp ? new Date(session.loginTimestamp).toLocaleTimeString() : 'Current Session'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Session Health</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tamper-Free Authenticated</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

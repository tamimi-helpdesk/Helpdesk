import React, { useState } from 'react';
import { Key, Copy, Check, X, Eye, EyeOff, Sparkles, Lock, Shield } from 'lucide-react';
import { StaffAccount } from '../../../types';
import { StaffAvatar } from './StaffAvatar';

interface StaffResetPinModalProps {
  staff: StaffAccount | null;
  onClose: () => void;
  onSave: (newPinOrPass: string) => void;
}

export const StaffResetPinModal: React.FC<StaffResetPinModalProps> = ({
  staff,
  onClose,
  onSave,
}) => {
  const [pinValue, setPinValue] = useState(
    staff?.pinCode || String(Math.floor(100000 + Math.random() * 900000))
  );
  const [passwordValue, setPasswordValue] = useState(staff?.password || 'Tamimi@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!staff) return null;

  const generateRandomPassword = () => {
    const prefixes = ['Tamimi', 'Staff', 'Secure', 'Portal', 'RedSea'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setPasswordValue(`${p}@${num}`);
  };

  const handleCopy = () => {
    const text = `Tamimi Global Portal Credentials:\nUsername: ${staff.username}\nPassword: ${passwordValue}\nPIN: ${pinValue}\nRole: ${staff.roleTitle}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    // If password changed, pass passwordValue; else pinValue
    onSave(passwordValue || pinValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Reset Login Password & PIN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update credentials for @{staff.username} ({staff.fullName})
              </p>
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

        <div className="space-y-4">
          {/* Login Password field */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-500" />
                <span>Login Password</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] font-black text-sky-600 hover:text-sky-500 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>🎲 Generate</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-900 dark:text-white pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              User will sign in to the portal with this password.
            </p>
          </div>

          {/* Security PIN field */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Security PIN (6-Digit)</span>
              </label>
              <button
                type="button"
                onClick={() => setPinValue(String(Math.floor(100000 + Math.random() * 900000)))}
                className="text-[10px] font-black text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>🎲 Random</span>
              </button>
            </div>

            <input
              type="text"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold tracking-widest text-slate-900 dark:text-white"
              placeholder="6-digit PIN"
            />
            <p className="text-[10px] text-slate-500">
              Optional PIN for quick terminal or POS authentication.
            </p>
          </div>

          {/* Copy snippet */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600 dark:text-slate-400">
                Credentials Slip
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 text-sky-600 font-bold hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-0.5">
              <p>Username: <strong className="text-sky-600 dark:text-sky-400">@{staff.username}</strong></p>
              <p>Password: <strong>{passwordValue}</strong></p>
              <p>PIN: <strong>{pinValue}</strong></p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md shadow-amber-600/30 transition cursor-pointer"
          >
            Apply Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

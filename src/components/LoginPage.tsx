import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  ShieldAlert,
  Building2,
  CheckCircle2,
  KeyRound,
  Shield,
} from 'lucide-react';
import { TamimiLogo } from './TamimiLogo';
import { AuthService } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
  theme: 'light' | 'dark' | 'amoled';
  toggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  theme,
  toggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(() =>
    AuthService.consumeLogoutReason()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickCredentials, setShowQuickCredentials] = useState(false);

  // Rate-limiting lockout state
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  useEffect(() => {
    const checkStatus = () => {
      const lockout = AuthService.checkLockout();
      if (lockout.isLocked) {
        setLockoutSec(lockout.remainingSeconds);
      } else {
        setLockoutSec(0);
      }
    };

    checkStatus();
    const interval = setInterval(() => {
      setLockoutSec((prev) => {
        if (prev <= 1) {
          checkStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSessionNotice(null);

    if (lockoutSec > 0) {
      setErrorMsg(`System locked for security. Please wait ${lockoutSec}s.`);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = AuthService.login(password, username, rememberMe);
      if (result.success) {
        onLoginSuccess();
      } else {
        if (result.isLocked && result.remainingSeconds) {
          setLockoutSec(result.remainingSeconds);
        }
        setErrorMsg(result.message);
        setIsLoading(false);
      }
    }, 200);
  };

  const isLocked = lockoutSec > 0;
  const lockoutMin = Math.floor(lockoutSec / 60);
  const lockoutSecRem = lockoutSec % 60;
  const lockoutDisplay =
    lockoutMin > 0 ? `${lockoutMin}m ${lockoutSecRem}s` : `${lockoutSecRem}s`;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-900 text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Sleek, professional geometric gradient background (zero cartoon clutter) */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,116,144,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(2,132,199,0.2),rgba(0,0,0,0))] pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              TAMIMI GLOBAL COMPANY LTD. (TAFGA)
            </span>
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-400">
            Triple Bay Village #188 • Operations Portal
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-xs font-bold shadow-xs transition cursor-pointer"
        >
          {theme === 'dark' || theme === 'amoled' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Centered Login Section: Crisp, Clean, Enterprise Professional */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900 dark:text-white">
          
          {/* Logo & Portal Branding */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 transition-transform duration-300 hover:scale-105">
              <TamimiLogo size={78} />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Tamimi Helpdesk Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Reception, Accommodations &amp; Facility Operations
            </p>
          </div>

          {/* Session Timeout / Logout Notice */}
          {sessionNotice && (
            <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-medium">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="leading-snug">{sessionNotice}</span>
            </div>
          )}

          {/* Rate-Limiting Lockout Notice */}
          {isLocked && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/60 text-red-900 dark:text-red-300 text-xs font-medium">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="space-y-0.5">
                <div className="font-bold">Security Lockout Active</div>
                <p className="text-[11px] opacity-90">
                  Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold text-red-700 dark:text-red-300">
                    {lockoutDisplay}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && !isLocked && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username / Operator ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Username / Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={isLocked}
                  placeholder="Enter Username or ID"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-slate-400 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Password / Access PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={isLocked}
                  placeholder="Enter Password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Workstation Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>Keep active on this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isLocked ? `Locked (${lockoutDisplay})` : 'Sign In to Portal'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Discreet Operator Credentials Helper */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowQuickCredentials(!showQuickCredentials)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-between w-full transition"
            >
              <span className="flex items-center space-x-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                <span>Duty Station Access Guide</span>
              </span>
              <span>{showQuickCredentials ? '▲ Hide' : '▼ View'}</span>
            </button>

            {showQuickCredentials && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Super Admin:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">admin / admin</span>
                </div>
                <div className="flex justify-between">
                  <span>Reception / Front Desk:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">reception / admin</span>
                </div>
                <div className="flex justify-between">
                  <span>Duty Supervisor:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">supervisor / admin</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Compliance Footer Badge */}
          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 dark:text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Encrypted Session • Tamimi Global Security</span>
          </div>
        </div>
      </main>

      {/* Corporate Page Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center justify-center space-x-2 max-w-fit mx-auto">
          <span>Official Portal</span>
          <span>·</span>
          <span>Tamimi Global Company Ltd. (TAFGA)</span>
          <span>·</span>
          <span>Triple Bay Village #188</span>
        </div>
      </footer>
    </div>
  );
};

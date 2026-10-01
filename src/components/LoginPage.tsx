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
  Sparkles,
  Building2,
  CheckCircle2,
  Headphones,
} from 'lucide-react';
import { TamimiLogo } from './TamimiLogo';
import { AuthService } from '../services/authService';
import receptionCartoonBanner from '../assets/images/reception_cartoon_banner_1788373756489.jpg';

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
  const [sessionNotice, setSessionNotice] = useState<string | null>(() => AuthService.consumeLogoutReason());
  const [isLoading, setIsLoading] = useState(false);
  
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
  const lockoutDisplay = lockoutMin > 0 ? `${lockoutMin}m ${lockoutSecRem}s` : `${lockoutSecRem}s`;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden font-sans">
      
      {/* 1. FULLSCREEN CARTOON RECEPTION BACKGROUND (Covers all empty spaces across the entire screen) */}
      <div className="absolute inset-0 z-0">
        <img
          src={receptionCartoonBanner}
          alt="Tamimi HelpDesk Reception Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000"
        />
        {/* Soft elegant gradient tint for contrast so text and form are crystal clear */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950/80 dark:from-slate-950/75 dark:via-slate-950/65 dark:to-slate-950/90 backdrop-blur-[0.5px]" />
      </div>

      {/* 2. PROMINENT "WELCOME TO TAMIMI HELPDESK" WRITTEN IN THE BACKGROUND */}
      <div className="absolute top-16 sm:top-20 inset-x-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 px-4 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 text-white text-xs font-black uppercase tracking-widest shadow-lg mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Executive Camp Front Desk &amp; Facilities</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] tracking-tight leading-tight uppercase">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-amber-200">Tamimi Helpdesk</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base font-bold text-slate-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mt-1 max-w-xl">
          TAFGA Centralized Reception, Facility Bookings &amp; Camp Operations Portal
        </p>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-wider text-white uppercase">
            Tamimi Global · Enterprise Security
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 text-xs font-black shadow-lg transition cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Day Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-300" />
              <span>Night Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Centered Login Card Container (Glassmorphic over the reception background) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 pt-24 sm:pt-28 pb-8">
        <div className="w-full max-w-md bg-white/92 dark:bg-slate-900/92 border-2 border-white/60 dark:border-slate-700/80 rounded-3xl shadow-2xl shadow-black/50 p-6 sm:p-8 backdrop-blur-2xl space-y-5">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 transition-transform duration-300 hover:scale-105">
              <TamimiLogo size={84} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              TAMIMI HelpDesk
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-1">
              TAFGA Sports &amp; Facilities Management Portal
            </p>
          </div>

          {/* Session Timeout / Logout Notice */}
          {sessionNotice && (
            <div className="flex items-start space-x-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold animate-in fade-in">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="leading-snug">{sessionNotice}</span>
            </div>
          )}

          {/* Rate-Limiting Lockout Notice */}
          {isLocked && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/30 text-red-900 dark:text-red-300 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="space-y-0.5">
                <div className="font-black">Security Lockout Active</div>
                <p className="text-[11px] font-medium opacity-90">
                  Too many failed attempts. Try again in <span className="font-mono font-black text-red-700 dark:text-red-300">{lockoutDisplay}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && !isLocked && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username field */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                Username / Operator ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
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
                  placeholder="Enter Username"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white font-bold text-sm focus:outline-none focus:border-sky-500 transition placeholder-slate-400 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
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
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-400 cursor-pointer select-none font-bold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 dark:bg-slate-950 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>Keep active on this station</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-sky-600/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isLocked ? `Locked (${lockoutDisplay})` : 'Secure Sign In'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-center space-x-2 font-bold bg-black/40 backdrop-blur-md py-1.5 px-4 rounded-full max-w-fit mx-auto border border-white/20">
          <span>TAMIMI Global Portal</span>
          <span>·</span>
          <span>Operations &amp; Facilities Hub</span>
        </div>
      </footer>
    </div>
  );
};

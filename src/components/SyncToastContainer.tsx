import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Database,
  CloudCheck,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ToastService, ToastItem, ToastSource } from '../services/toastService';

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration);
  const timerRef = useRef<any>(null);
  const progressAnimRef = useRef<any>(null);

  // Auto-dismiss countdown with pause-on-hover support
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const duration = remainingTimeRef.current;

    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, duration - elapsed);
      setProgress((left / toast.duration) * 100);

      if (left > 0) {
        progressAnimRef.current = requestAnimationFrame(updateProgress);
      }
    };

    progressAnimRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
      remainingTimeRef.current = Math.max(0, duration - (Date.now() - startTimeRef.current));
    };
  }, [isPaused, toast.duration, toast.id, onDismiss]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Visual archetype per source
  const getSourceConfig = (source: ToastSource, type: string) => {
    if (type === 'error') {
      return {
        icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60',
        progressBarBg: 'bg-rose-500',
        label: source,
      };
    }

    switch (source) {
      case 'Google Sheets':
        return {
          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
          progressBarBg: 'bg-emerald-500',
          label: 'Google Sheets',
        };
      case 'Cloud Database':
        return {
          icon: <CloudCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          badgeBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/60',
          progressBarBg: 'bg-sky-500',
          label: 'Cloud Database',
        };
      case 'System Hub':
        return {
          icon: <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />,
          badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60',
          progressBarBg: 'bg-indigo-500',
          label: 'Server Hub',
        };
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          progressBarBg: 'bg-slate-500',
          label: source,
        };
    }
  };

  const config = getSourceConfig(toast.source, toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 12, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-900/10 dark:shadow-black/40 backdrop-blur-md transition-all duration-200"
      role="status"
      aria-live="polite"
      id={`sync-toast-${toast.id}`}
    >
      <div className="p-4 flex items-start gap-3.5">
        {/* Source Icon Avatar */}
        <div className={`p-2 rounded-xl border flex-shrink-0 ${config.badgeBg}`}>
          {config.icon}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${config.badgeBg}`}>
              {config.label}
            </span>

            {toast.count !== undefined && toast.count > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                +{toast.count} {toast.count === 1 ? 'record' : 'records'}
              </span>
            )}

            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 ml-auto">
              Just now
            </span>
          </div>

          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            {toast.title}
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>

          {toast.details && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono line-clamp-2">
              {toast.details}
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Countdown Progress Bar Indicator */}
      <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        <div
          className={`h-full ${config.progressBarBg} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const SyncToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return ToastService.subscribe((updated) => {
      setToasts(updated);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Background Sync Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm px-4 sm:px-0 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={(id) => ToastService.dismiss(id)}
          />
        ))}
      </AnimatePresence>
    </aside>
  );
};

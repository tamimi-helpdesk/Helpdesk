import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getFacilityGraphic } from './FacilityGraphics';
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface FacilitySyncTransitionOverlayProps {
  isOpen: boolean;
  facilityName?: string;
  facilityId?: string;
  message?: string;
  isComplete?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const FacilitySyncTransitionOverlay: React.FC<FacilitySyncTransitionOverlayProps> = ({
  isOpen,
  facilityName,
  facilityId,
  message,
  isComplete = false,
  error = null,
  onRetry,
  onCancel,
}) => {
  if (!isOpen) return null;

  const hasError = Boolean(error);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-black/85 backdrop-blur-md transition-all pointer-events-auto p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex flex-col items-center justify-center gap-3.5 px-6 sm:px-7 py-6 rounded-3xl bg-slate-900/95 dark:bg-black/95 border ${
            hasError
              ? 'border-rose-500/60 shadow-2xl shadow-rose-950/50'
              : isComplete
              ? 'border-emerald-500/50 shadow-2xl shadow-emerald-950/40'
              : 'border-sky-500/40 shadow-2xl'
          } backdrop-blur-2xl max-w-sm sm:max-w-md w-full text-center relative overflow-hidden`}
        >
          {/* Top Edge Ambient Highlight */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              hasError
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-red-600'
                : isComplete
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-600'
                : 'bg-gradient-to-r from-sky-500 via-emerald-400 to-blue-600'
            }`}
          />

          {/* High-Tech Visual Container: Facility Graphic or Warning Icon */}
          <div className="relative w-20 h-20 flex items-center justify-center mt-1 shrink-0">
            {/* Ambient Outer Glow Aura */}
            <div
              className={`absolute -inset-3 rounded-full blur-xl animate-pulse ${
                hasError
                  ? 'bg-gradient-to-tr from-rose-600/40 via-amber-500/30 to-red-600/40'
                  : isComplete
                  ? 'bg-gradient-to-tr from-emerald-500/35 via-teal-400/25 to-green-500/35'
                  : 'bg-gradient-to-tr from-sky-500/35 via-emerald-500/25 to-blue-500/35'
              }`}
            />

            {/* Frosted Glass Backdrop Disk */}
            <div
              className={`relative w-18 h-18 rounded-2xl bg-slate-950/90 shadow-2xl border-2 flex items-center justify-center p-2.5 overflow-hidden ${
                hasError
                  ? 'border-rose-500/60 text-rose-400'
                  : isComplete
                  ? 'border-emerald-400/70 text-emerald-400'
                  : 'border-sky-500/40 text-sky-400'
              }`}
            >
              {hasError ? (
                <AlertTriangle className="w-9 h-9 text-rose-400 drop-shadow-md animate-bounce" />
              ) : facilityId ? (
                getFacilityGraphic(facilityId, 'w-12 h-12 drop-shadow-md animate-pulse')
              ) : (
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              )}

              {/* Orbital Spinner Ring Overlay - Only while syncing and no error */}
              {!hasError && !isComplete && (
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-sky-400 border-r-emerald-400 animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
              )}
            </div>

            {/* Success Checkmark indicator if complete */}
            {isComplete && !hasError && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-2 ring-slate-900">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Sync Status Badge & Facility Label */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            {hasError ? (
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Database Fetch Failed
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {isComplete ? 'Live Records Verified' : 'Server & Database Sync'}
              </span>
            )}

            <h4 className="text-base sm:text-lg font-black text-white tracking-tight pt-0.5">
              {hasError
                ? `Cannot Open ${facilityName || 'Facility'}`
                : facilityName
                ? `${facilityName}`
                : 'Synchronizing Facility...'}
            </h4>

            {hasError ? (
              <div className="space-y-2.5 w-full mt-1">
                <p className="text-xs text-rose-200/90 font-medium leading-relaxed">
                  Latest authoritative booking records could not be verified from the server/database.
                  Facility cannot be opened with outdated local cache.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-rose-900/60 text-[11px] text-rose-300 font-mono text-left break-words max-h-24 overflow-y-auto leading-relaxed shadow-inner">
                  {error}
                </div>
                {/* Action Buttons: Retry & Cancel */}
                <div className="flex items-center gap-2 pt-1 w-full">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Return to Hub</span>
                    </button>
                  )}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/60"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Fetch</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-sky-200/90 font-medium">
                  {isComplete
                    ? 'Authoritative records confirmed! Opening facility...'
                    : 'Fetching complete and latest booking records from server database...'}
                </p>

                <p className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed">
                  {message || 'Verifying live multi-computer schedule before opening'}
                </p>

                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-1.5">
                  <div className="bg-gradient-to-r from-sky-500 via-emerald-400 to-blue-500 h-full w-full animate-pulse" />
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

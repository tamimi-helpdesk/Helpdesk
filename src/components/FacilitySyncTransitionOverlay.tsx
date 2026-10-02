import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getFacilityGraphic } from './FacilityGraphics';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface FacilitySyncTransitionOverlayProps {
  isOpen: boolean;
  facilityName?: string;
  facilityId?: string;
  message?: string;
  isComplete?: boolean;
}

export const FacilitySyncTransitionOverlay: React.FC<FacilitySyncTransitionOverlayProps> = ({
  isOpen,
  facilityName,
  facilityId,
  message,
  isComplete = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm transition-all pointer-events-none p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: -15 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center gap-4 px-7 py-6 rounded-3xl bg-slate-900/95 dark:bg-black/95 border border-sky-500/40 shadow-2xl backdrop-blur-2xl max-w-sm w-full text-center relative overflow-hidden"
        >
          {/* Top Edge Ambient Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-emerald-400 to-blue-600" />

          {/* High-Tech Visual Container: Facility Graphic + Orbital Spinner */}
          <div className="relative w-20 h-20 flex items-center justify-center mt-1">
            {/* Ambient Outer Glow Aura */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-sky-500/35 via-emerald-500/25 to-blue-500/35 blur-xl animate-pulse" />

            {/* Frosted Glass Backdrop Disk */}
            <div className="relative w-18 h-18 rounded-2xl bg-slate-950/90 shadow-2xl border-2 border-sky-500/40 flex items-center justify-center p-2.5 overflow-hidden">
              {facilityId ? (
                getFacilityGraphic(facilityId, 'w-12 h-12 drop-shadow-md animate-pulse')
              ) : (
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              )}

              {/* Orbital Spinner Ring Overlay */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-sky-400 border-r-emerald-400 animate-spin" style={{ animationDuration: '1.4s' }} />
            </div>

            {/* Success Checkmark indicator if complete */}
            {isComplete && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-2 ring-slate-900">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Sync Status Badge & Facility Label */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {isComplete ? 'Live Sync Complete' : 'Google Sheets & Network Sync'}
            </span>

            <h4 className="text-base sm:text-lg font-black text-white tracking-tight pt-1">
              {facilityName ? `${facilityName}` : 'Synchronizing Facility...'}
            </h4>

            <p className="text-xs text-sky-200/90 font-medium">
              {isComplete
                ? 'Schedule verified! Opening facility...'
                : 'Fetching latest bookings & schedule from Google Sheets...'}
            </p>

            <p className="text-[11px] text-slate-400 max-w-[260px] leading-relaxed">
              {message || 'Verifying real-time multi-computer availability before opening booking'}
            </p>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-sky-500 via-emerald-400 to-blue-500 h-full w-full animate-pulse" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

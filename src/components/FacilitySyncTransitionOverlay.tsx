import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FacilitySyncTransitionOverlayProps {
  isOpen: boolean;
}

export const FacilitySyncTransitionOverlay: React.FC<FacilitySyncTransitionOverlayProps> = ({
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 dark:bg-black/50 backdrop-blur-[3px] transition-all pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {/* Futuristic High-Tech Dual-Orbital Circular Spinner */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Ambient Outer Glow Aura */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-sky-500/25 via-blue-500/20 to-emerald-500/20 blur-md animate-pulse" />

            {/* Frosted Glass Backdrop Disk */}
            <div className="relative w-14 h-14 rounded-full bg-white/80 dark:bg-slate-900/90 shadow-2xl border border-white/50 dark:border-slate-700/60 backdrop-blur-md flex items-center justify-center">
              {/* Outer Smooth Primary Ring */}
              <div className="absolute inset-1 rounded-full border-[2.5px] border-transparent border-t-sky-500 border-r-blue-500 animate-spin" />

              {/* Inner Reverse Secondary Orbital Arc */}
              <div 
                className="absolute inset-2.5 rounded-full border-[2px] border-transparent border-b-cyan-400 border-l-emerald-400"
                style={{ animation: 'spin 1.2s linear infinite reverse' }}
              />

              {/* Central Glowing Pulse Dot */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-3 h-3 rounded-full bg-sky-400/40 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

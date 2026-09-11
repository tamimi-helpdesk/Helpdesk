import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionFeedback, LoadingState } from '../services/actionFeedbackService';
import { getFacilityGraphic } from './FacilityGraphics';
import { Sparkles, Layers } from 'lucide-react';

export const LightweightSectionLoader: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    title: '',
  });

  useEffect(() => {
    return ActionFeedback.subscribeLoading((state) => {
      setLoadingState(state);
    });
  }, []);

  return (
    <AnimatePresence>
      {loadingState.isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-slate-950/35 dark:bg-black/60 backdrop-blur-[4px] pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="relative bg-white/95 dark:bg-slate-900/95 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-xs w-full flex flex-col items-center text-center overflow-hidden"
          >
            {/* Top ambient glowing accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 animate-pulse" />

            {/* Glowing Icon Aura */}
            <div className="relative my-2">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-sky-500/30 via-indigo-500/20 to-emerald-500/30 blur-md animate-pulse" />
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100/60 dark:from-slate-800 dark:to-slate-950 border-2 border-sky-300/80 dark:border-slate-700 flex items-center justify-center shadow-md">
                {loadingState.facilityId ? (
                  getFacilityGraphic(loadingState.facilityId, 'w-11 h-11 sm:w-12 sm:h-12 drop-shadow-md')
                ) : (
                  <div className="relative w-9 h-9 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-t-sky-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
                    <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mt-2 space-y-1">
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                <Sparkles className="w-3 h-3 text-sky-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Synchronizing View</span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white tracking-tight">
                {loadingState.title || 'Loading Content...'}
              </h4>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {loadingState.subtitle || 'Fetching schedule & live reservations'}
              </p>
            </div>

            {/* High-Tech Animated Linear Shimmer Bar */}
            <div className="w-full mt-4 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 rounded-full"
                initial={{ left: '-30%', width: '30%' }}
                animate={{ left: '100%', width: '40%' }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Check,
  Sparkles,
  Copy,
  CheckCheck,
  X,
  ArrowRight,
  Printer,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ActionFeedback, SuccessFeedbackData } from '../services/actionFeedbackService';
import { getFacilityGraphic } from './FacilityGraphics';

export const ActionCompletionCelebrationModal: React.FC = () => {
  const [data, setData] = useState<SuccessFeedbackData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return ActionFeedback.subscribeSuccess((successData) => {
      setData(successData);
      if (successData) {
        // Trigger celebratory confetti burst
        try {
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.55 },
            colors: ['#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899'],
          });
        } catch (e) {}
      }
    });
  }, []);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  if (!data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          className="relative bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl overflow-hidden space-y-4 text-center"
        >
          {/* Top Celebration Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => ActionFeedback.dismissSuccess()}
            className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated SVG Checkmark Icon */}
          <div className="flex items-center justify-center pt-2">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Outer pulsing halo */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1.25, opacity: [0, 0.4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-emerald-500/30"
              />

              {/* Central check circle */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100 dark:ring-emerald-950"
              >
                <motion.svg
                  className="w-9 h-9 text-white stroke-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17L4 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
                  />
                </motion.svg>
              </motion.div>
            </div>
          </div>

          {/* Title & Badge */}
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Action Successfully Executed</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              {data.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {data.subtitle}
            </p>
          </div>

          {/* Reference Code Tag (if provided) */}
          {data.referenceCode && (
            <div className="bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reference Code
                </span>
                <span className="text-sm font-mono font-black text-slate-950 dark:text-white">
                  {data.referenceCode}
                </span>
              </div>

              <button
                onClick={() => handleCopyCode(data.referenceCode!)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition cursor-pointer"
                title="Copy reference code"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Details List */}
          {data.details && data.details.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-left">
              {data.details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                >
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            {data.secondaryActionLabel && (
              <button
                type="button"
                onClick={() => {
                  if (data.onSecondaryAction) data.onSecondaryAction();
                  ActionFeedback.dismissSuccess();
                }}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                {data.secondaryActionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (data.onPrimaryAction) data.onPrimaryAction();
                ActionFeedback.dismissSuccess();
              }}
              className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <span>{data.primaryActionLabel || 'Done / Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

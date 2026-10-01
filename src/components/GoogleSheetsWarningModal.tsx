import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Database,
  CheckCircle2,
  X,
  ServerCrash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GasService } from '../services/gasService';

interface GoogleSheetsWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  onOpenGasModal: () => void;
  onConnectionRestored?: () => void;
  facilityName?: string;
}

export const GoogleSheetsWarningModal: React.FC<GoogleSheetsWarningModalProps> = ({
  isOpen,
  onClose,
  reason,
  onOpenGasModal,
  onConnectionRestored,
  facilityName,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryResult(null);

    try {
      const res = await GasService.verifyActiveConnection();
      if (res.connected) {
        setRetryResult({
          success: true,
          message: 'Google Sheets connected successfully! Resuming facility access...',
        });
        setTimeout(() => {
          if (onConnectionRestored) onConnectionRestored();
          onClose();
        }, 1200);
      } else {
        setRetryResult({
          success: false,
          message: res.message || 'Connection test failed. Please verify your Web App URL and network.',
        });
      }
    } catch (err: any) {
      setRetryResult({
        success: false,
        message: err.message || 'Error encountered while testing connection.',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="bg-white dark:bg-slate-900 border-2 border-red-400/80 dark:border-red-600/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Red Header Bar */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-5 py-4 sm:px-6 sm:py-5 text-white flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                  Google Sheets Disconnected!
                </h3>
                <p className="text-xs sm:text-sm text-red-100 font-medium">
                  Remote Database Disconnected • Facility Operations Locked
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Primary Warning Notice */}
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm sm:text-base text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                <span>Facility Access Temporarily Suspended Across All 20 Venues</span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-red-800 dark:text-red-300">
                {facilityName ? `Access to "${facilityName}" and all ` : 'All '}20 camp facilities requires an active Google Sheets backend connection. Making new reservations, modifying existing entries, check-ins, and cancellations are blocked until database synchronization is restored.
              </p>
              <p className="text-[11px] sm:text-xs text-red-600/90 dark:text-red-400/90 italic pt-1 border-t border-red-200/60 dark:border-red-900/40">
                Data consistency protection is active. Please reconnect Google Apps Script Web App to resume full camp operations.
              </p>
            </div>

            {/* Diagnostic Information */}
            {reason && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2.5">
                <ServerCrash className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <span className="font-semibold text-slate-900 dark:text-white">Reason: </span>
                  <span className="font-mono break-all">{reason}</span>
                </div>
              </div>
            )}

            {/* Retry Feedback Alert */}
            {retryResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in duration-200 ${
                  retryResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800'
                }`}
              >
                {retryResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{retryResult.message}</span>
              </div>
            )}

            {/* Steps to resolve */}
            <div className="bg-slate-100/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-500" />
                <span>How to resolve:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11.5px] leading-normal">
                <li>Click <strong>"Connect Google Sheets"</strong> below to configure or update your Google Apps Script Web App URL.</li>
                <li>Verify your internet connection and click <strong>"Test Connection"</strong> to retry.</li>
              </ul>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="px-5 py-4 sm:px-6 sm:py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Stay in Dashboard
            </button>

            <div className="flex items-center space-x-2.5 ml-auto">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-sky-500' : ''}`} />
                <span>{isRetrying ? 'Verifying...' : 'Test Connection'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenGasModal();
                }}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white transition flex items-center space-x-1.5 shadow-md shadow-red-500/25 cursor-pointer"
              >
                <span>Connect Google Sheets</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

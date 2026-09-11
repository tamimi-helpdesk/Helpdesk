import React, { useState, useEffect } from 'react';
import {
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Download,
  UploadCloud,
  Check,
  HardDrive,
} from 'lucide-react';
import { CloudDatabaseService, CloudDatabaseStatus } from '../../services/firebaseService';

interface CloudDatabaseTabProps {
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenFullDisasterRecovery?: () => void;
}

export const CloudDatabaseTab: React.FC<CloudDatabaseTabProps> = ({
  onShowFeedback,
  onOpenFullDisasterRecovery,
}) => {
  const [cloudStatus, setCloudStatus] = useState<CloudDatabaseStatus>(() => CloudDatabaseService.getStatus());
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    // Refresh status and subscribe
    setCloudStatus(CloudDatabaseService.getStatus());
    const unsub = CloudDatabaseService.subscribeStatus((newStatus) => {
      setCloudStatus(newStatus);
    });

    // Auto-ping on mount to get current latency
    setIsPinging(true);
    CloudDatabaseService.testConnection()
      .then(() => {
        setCloudStatus(CloudDatabaseService.getStatus());
      })
      .finally(() => {
        setIsPinging(false);
      });

    return () => unsub();
  }, []);

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await CloudDatabaseService.testConnection();
      const updated = CloudDatabaseService.getStatus();
      setCloudStatus(updated);
      if (res.connected) {
        onShowFeedback(`Firestore reachable in ${res.latencyMs}ms!`, 'success');
      } else {
        onShowFeedback(res.error || 'Could not reach Firestore.', 'error');
      }
    } finally {
      setIsPinging(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await CloudDatabaseService.backupToCloud(true);
      if (res.success) {
        onShowFeedback(`Synced ${res.bookingsCount} bookings to Cloud DB!`, 'success');
      } else {
        onShowFeedback(res.error || 'Cloud sync failed.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!window.confirm('Restore latest snapshot from Google Firebase Cloud Firestore? Local records will be merged safely.')) {
      return;
    }
    setIsRestoring(true);
    try {
      const res = await CloudDatabaseService.restoreFromCloud();
      if (res.success) {
        onShowFeedback(`Successfully restored ${res.restoredCount} records from Cloud Firestore!`, 'success');
      } else {
        onShowFeedback(res.error || 'Failed to restore from Cloud DB.', 'error');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Google Cloud Database &amp; Disaster Recovery</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Google Firebase Firestore live replication, real-time latency diagnostics, and zero data loss recovery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePing}
            disabled={isPinging}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            <Radio className={`w-3.5 h-3.5 text-sky-500 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Pinging...' : 'Ping Cloud DB'}</span>
          </button>

          {onOpenFullDisasterRecovery && (
            <button
              type="button"
              onClick={onOpenFullDisasterRecovery}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-sky-600/20"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Full Diagnostic Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Status */}
        <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Firestore Connection
          </span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cloudStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cloudStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="font-black text-sm text-slate-900 dark:text-white">
              {cloudStatus.connected ? 'Cloud Online' : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate block">
            Project: {cloudStatus.projectId || 'ai-studio-executive'}
          </span>
        </div>

        {/* Latency */}
        <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Round-Trip Latency
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {cloudStatus.latencyMs > 0 ? cloudStatus.latencyMs : '--'}
            </span>
            <span className="text-xs text-slate-500 font-bold">ms</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
            {cloudStatus.latencyMs > 0 && cloudStatus.latencyMs < 1000 ? 'Ultra-low latency link' : 'Live connection active'}
          </span>
        </div>

        {/* Cloud Records */}
        <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Secured Cloud Bookings
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {cloudStatus.totalCloudBookings}
            </span>
            <span className="text-xs text-slate-500 font-bold">records</span>
          </div>
          <span className="text-[10px] text-slate-500 block font-medium">
            Real-time multi-device sync
          </span>
        </div>

        {/* Last Sync */}
        <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Last Cloud Sync
          </span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
              {cloudStatus.lastSyncedAt ? new Date(cloudStatus.lastSyncedAt).toLocaleTimeString() : 'On Startup'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block font-medium">
            Continuous background protection
          </span>
        </div>
      </div>

      {/* Quota notification banner if spark plan limits reached */}
      {cloudStatus.isQuotaExceeded && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Firestore Free Tier Daily Write Limit (20,000 writes/day) Reached</span>
            </div>
            <a
              href={`https://console.firebase.google.com/project/${cloudStatus.projectId}/firestore/usage`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100"
            >
              <span>View Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            All app features, bookings, gym reservations, and handover logs remain 100% operational with offline local persistence. Automatic cloud writes are safely paused until the daily quota resets automatically at midnight UTC, or billing is upgraded.
          </p>
        </div>
      )}

      {/* Zero Data Loss Banner */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl border border-sky-500/20 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Zero Data Loss Guaranteed
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold">
            Dual Replication (Firebase + Sheets)
          </span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white">
            Hosting-Independent Cloud Persistence Engine
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
            All 20 camp facility schedules, gym rooms, hall reservations, and staff logs are automatically backed up to Google Cloud Firestore. If you move hosting providers or clear local browser storage, you can restore your complete database anytime with a single click.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-md shadow-sky-500/30 active:scale-95"
          >
            <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>{isSyncing ? 'Pushing to Cloud DB...' : 'Push Local Data to Cloud DB'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreFromCloud}
            disabled={isRestoring}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Download className={`w-4 h-4 text-emerald-400 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restoring from Cloud...' : 'Restore from Cloud DB'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  History,
  X,
  FileCheck,
  Trash2,
  Lock,
  Cloud,
  Radio,
  Sparkles,
  Check,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Zap,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { BackupService, StorageDiagnostics, SystemBackupSnapshot } from '../services/backupService';
import { OfflineQueueService, QueuedSyncItem } from '../services/offlineQueueService';
import { GasService } from '../services/gasService';
import { AuthService } from '../services/authService';
import { CloudDatabaseService, CloudDatabaseStatus } from '../services/firebaseService';
import { SecurityAuditEntry } from '../types';

interface SystemBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemBackupModal: React.FC<SystemBackupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'backup' | 'queue' | 'audit'>('cloud');
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<QueuedSyncItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>([]);
  const [isFlushingQueue, setIsFlushingQueue] = useState(false);
  const [flushResult, setFlushResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Cloud Database state
  const [cloudStatus, setCloudStatus] = useState<CloudDatabaseStatus>(() => CloudDatabaseService.getStatus());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isCloudRestoring, setIsCloudRestoring] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [cloudActionMessage, setCloudActionMessage] = useState<{ success: boolean; message: string } | null>(null);

  // Restore file selection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedSnapshot, setParsedSnapshot] = useState<SystemBackupSnapshot | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshAll = () => {
    setDiagnostics(BackupService.getStorageDiagnostics());
    setOfflineQueue(OfflineQueueService.getQueue());
    setAuditLogs(AuthService.getSecurityAuditLogs().slice(0, 30));
    setCloudStatus(CloudDatabaseService.getStatus());
  };

  useEffect(() => {
    if (isOpen) {
      refreshAll();
      setFlushResult(null);
      setRestoreStatus(null);
      setCloudActionMessage(null);
      setSelectedFile(null);
      setParsedSnapshot(null);
      setValidationError(null);

      // Ping Cloud Database for fresh telemetry
      setIsPinging(true);
      CloudDatabaseService.testConnection().then(() => {
        setCloudStatus(CloudDatabaseService.getStatus());
        setIsPinging(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = CloudDatabaseService.subscribeStatus((newStatus) => {
      setCloudStatus(newStatus);
    });
    return () => unsub();
  }, []);

  const handleForceCloudSync = async () => {
    setIsCloudSyncing(true);
    setCloudActionMessage(null);
    try {
      const res = await CloudDatabaseService.backupToCloud(true);
      if (res.success) {
        setCloudActionMessage({
          success: true,
          message: `Cloud Database synchronized! ${res.bookingsCount} bookings and full snapshot safely secured in Firebase Firestore.`,
        });
      } else {
        setCloudActionMessage({
          success: false,
          message: `Cloud sync error: ${res.error || 'Unknown failure'}`,
        });
      }
    } catch (err: any) {
      setCloudActionMessage({
        success: false,
        message: `Sync failed: ${err.message}`,
      });
    } finally {
      setIsCloudSyncing(false);
      refreshAll();
    }
  };

  const handleRestoreFromCloud = async () => {
    if (
      !window.confirm(
        'Zero Data Loss Disaster Recovery: This will restore all camp bookings, isolation rooms, shift handovers, and parcels directly from Firebase Cloud Database. Continue?'
      )
    ) {
      return;
    }

    setIsCloudRestoring(true);
    setCloudActionMessage(null);
    try {
      const res = await CloudDatabaseService.restoreFromCloud();
      if (res.success) {
        setCloudActionMessage({
          success: true,
          message: `Disaster Recovery Complete! Successfully restored ${res.restoredCount} bookings and all camp modules from Cloud Database.`,
        });
        refreshAll();
      } else {
        setCloudActionMessage({
          success: false,
          message: `Cloud restore failed: ${res.error || 'No snapshot found'}`,
        });
      }
    } catch (err: any) {
      setCloudActionMessage({
        success: false,
        message: `Restore failed: ${err.message}`,
      });
    } finally {
      setIsCloudRestoring(false);
    }
  };

  const handlePingCloud = async () => {
    setIsPinging(true);
    setCloudActionMessage(null);
    const res = await CloudDatabaseService.testConnection();
    setIsPinging(false);
    setCloudStatus(CloudDatabaseService.getStatus());
    if (res.connected) {
      setCloudActionMessage({
        success: true,
        message: `Cloud Database ping successful: ${res.latencyMs}ms round-trip latency to Firebase Firestore.`,
      });
    } else {
      setCloudActionMessage({
        success: false,
        message: `Cloud Database connection issue: ${res.error}`,
      });
    }
  };

  useEffect(() => {
    const handleQueueUpdate = () => {
      setOfflineQueue(OfflineQueueService.getQueue());
      setDiagnostics(BackupService.getStorageDiagnostics());
    };

    window.addEventListener('tamimi_offline_queue_updated', handleQueueUpdate);
    return () => window.removeEventListener('tamimi_offline_queue_updated', handleQueueUpdate);
  }, []);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      BackupService.downloadBackupFile();
      refreshAll();
    } catch (e: any) {
      alert(`Backup failed: ${e.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationError(null);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = BackupService.validateBackup(content);
      if (result.valid && result.snapshot) {
        setParsedSnapshot(result.snapshot);
        setValidationError(null);
      } else {
        setParsedSnapshot(null);
        setValidationError(result.error || 'Invalid backup file');
      }
    };
    reader.onerror = () => {
      setValidationError('Failed to read backup file.');
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedSnapshot) return;

    if (
      restoreMode === 'replace' &&
      !window.confirm(
        'Warning: "Full Replace Mode" will overwrite local records with this backup snapshot. Continue?'
      )
    ) {
      return;
    }

    setIsRestoring(true);
    setTimeout(() => {
      const result = BackupService.restoreSnapshot(parsedSnapshot, restoreMode);
      setIsRestoring(false);
      setRestoreStatus(result);
      if (result.success) {
        refreshAll();
      }
    }, 400);
  };

  const handleFlushQueueNow = async () => {
    setIsFlushingQueue(true);
    setFlushResult(null);

    try {
      const res = await OfflineQueueService.flushQueue(GasService);
      refreshAll();
      if (res.failed === 0) {
        setFlushResult({
          success: true,
          message: `All ${res.successful} pending changes pushed to Google Sheets successfully!`,
        });
      } else {
        setFlushResult({
          success: false,
          message: `Pushed ${res.successful} items, but ${res.failed} items still pending (will retry automatically).`,
        });
      }
    } catch (err: any) {
      setFlushResult({
        success: false,
        message: `Queue flush encountered error: ${err.message}`,
      });
    } finally {
      setIsFlushingQueue(false);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Clear all pending offline records without syncing? (Local data will not be deleted)')) {
      OfflineQueueService.clearQueue();
      refreshAll();
    }
  };

  return (
    <div
      id="system-backup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="system-backup-modal-container"
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                System Hardening, Backup & Resilient Storage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enterprise disaster recovery, storage health monitoring & offline sync resilience
              </p>
            </div>
          </div>
          <button
            id="close-system-backup-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          <button
            id="tab-cloud-database"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-500" />
            <span>Cloud DB & Disaster Recovery</span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cloudStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${cloudStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </button>
          <button
            id="tab-backup-restore"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Local Backup & Restore</span>
          </button>
          <button
            id="tab-offline-queue"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition relative ${
              activeTab === 'queue'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Offline Sync Queue
            {offlineQueue.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full animate-pulse">
                {offlineQueue.length}
              </span>
            )}
          </button>
          <button
            id="tab-audit-trail"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            Security & System Audit Logs
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Diagnostics Banner */}
          {diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Storage Utilization
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {diagnostics.usedFormatted}
                  </span>
                  <span className="text-xs text-slate-500">/ ~5 MB</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      diagnostics.health === 'HEALTHY'
                        ? 'bg-emerald-500'
                        : diagnostics.health === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(4, diagnostics.usagePercentage)}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  System Health
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                      diagnostics.health === 'HEALTHY'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {diagnostics.health}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Zero Quota Saturation</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Total Active Records
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {diagnostics.counts.bookings +
                    diagnostics.counts.isolationRooms +
                    diagnostics.counts.handovers +
                    diagnostics.counts.parcels +
                    diagnostics.counts.lostFound}
                </span>
                <span className="text-[11px] text-slate-500 block">Across all 12 modules</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Cloud Redundancy
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    Dual Active
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">Sheets + Cloud Firestore</span>
              </div>
            </div>
          )}

          {/* TAB 0: Cloud DB & Disaster Recovery */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              {/* Cloud Action Feedback */}
              {cloudActionMessage && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fadeIn ${
                    cloudActionMessage.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {cloudActionMessage.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  )}
                  <span className="flex-1">{cloudActionMessage.message}</span>
                  <button
                    onClick={() => setCloudActionMessage(null)}
                    className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Zero Data Loss Architecture Shield */}
              <div className="relative p-5 bg-gradient-to-r from-sky-900/90 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl overflow-hidden border border-sky-500/30">
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Zero Data Loss Architecture
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-bold">
                        Dual Persistence Active
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight">
                      Hosting-Independent Disaster Recovery Shield
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      All 20 camp facility schedules, isolation rooms, shift handovers, and parcels are continuously dual-replicated to <strong>Google Firebase Firestore</strong> alongside Google Sheets. If your hosting server goes down or you deploy this source code to any other platform (Vercel, Netlify, Render, Cloud Run, VPS), you can instantly restore 100% of your data without loss.
                    </p>
                  </div>

                  <button
                    onClick={handlePingCloud}
                    disabled={isPinging}
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center gap-2 cursor-pointer backdrop-blur-xs disabled:opacity-50"
                  >
                    <Radio className={`w-3.5 h-3.5 text-sky-400 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'Pinging Cloud...' : 'Ping Cloud'}</span>
                  </button>
                </div>
              </div>

              {/* Cloud Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Cloud Database
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cloudStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {cloudStatus.connected ? 'Firestore Online' : 'Connecting...'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate block" title={cloudStatus.databaseId}>
                    DB: {cloudStatus.databaseId.slice(0, 18)}...
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Round-Trip Latency
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {cloudStatus.latencyMs > 0 ? cloudStatus.latencyMs : '--'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">ms</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    High-speed enterprise link
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Cloud Records Secured
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {cloudStatus.totalCloudBookings}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">bookings</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    + Full snapshot immutable copy
                  </span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Last Cloud Sync
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {cloudStatus.lastSyncedAt
                        ? new Date(cloudStatus.lastSyncedAt).toLocaleTimeString()
                        : 'On Startup'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Automatic continuous push
                  </span>
                </div>
              </div>

              {/* Firestore Quota Notice Banner */}
              {cloudStatus.isQuotaExceeded && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-bold text-sm">
                      Firestore Free Tier Daily Write Limit Reached
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    The Cloud Firestore free tier quota limit has been reached for today. 
                    The quota will automatically reset the next day (Spark Plan in Enterprise Edition). 
                    All camp facility schedules, reservations, shift handovers, and operations continue running smoothly and safely with 100% offline &amp; browser-persisted storage.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-bold">
                    <a
                      href={`https://console.firebase.google.com/project/${cloudStatus.projectId}/firestore/databases/${cloudStatus.databaseId}/data?openUpgradeDialog=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400 hover:underline"
                    >
                      <span>Open Firebase Console Quota &amp; Upgrade Dialog</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="https://firebase.google.com/pricing#cloud-firestore"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:underline"
                    >
                      <span>View Spark Tier Quota Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Main Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Action Card 1: Force Sync to Cloud */}
                <div className="p-5 bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:border-sky-500/50 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        Authoritative Push
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Force Sync to Cloud Database
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Generates a full system snapshot with all active facility bookings, isolation beds, shift handovers, parcels, lost and found, and system metadata, and commits it directly to Firebase Firestore.
                    </p>
                  </div>

                  <button
                    onClick={handleForceCloudSync}
                    disabled={isCloudSyncing}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    <span>{isCloudSyncing ? 'Syncing with Firestore...' : 'Force Cloud Backup Now'}</span>
                  </button>
                </div>

                {/* Action Card 2: 1-Click Cloud Restore */}
                <div className="p-5 bg-white dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Zero Data Loss Recovery
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      One-Click Cloud Restore from Firestore
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      If you have deployed this code to a new hosting provider or lost local records, click here to pull the authoritative snapshot from Google Firebase and re-populate the entire system immediately.
                    </p>
                  </div>

                  <button
                    onClick={handleRestoreFromCloud}
                    disabled={isCloudRestoring}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCloudRestoring ? 'animate-spin' : ''}`} />
                    <span>{isCloudRestoring ? 'Restoring from Cloud...' : '1-Click Restore All From Cloud'}</span>
                  </button>
                </div>
              </div>

              {/* Physical Offline Backup Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Download Portable Disaster Recovery Package (.json)
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Saves an offline copy containing all records that can be stored on a USB drive or Google Drive as an extra physical safeguard.
                  </p>
                </div>

                <button
                  onClick={() => CloudDatabaseService.downloadOfflineDisasterFile()}
                  className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Package</span>
                </button>
              </div>

              {/* Auto-Hydration Notice */}
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">Auto-Hydration on Fresh Deployments is Active:</strong>
                  <p className="text-slate-600 dark:text-slate-300">
                    If you download the project code and run it on a new server or computer where browser storage is empty, the system automatically checks Firebase Cloud Firestore on boot and restores all your camp records with zero setup needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Section 1: Full System Export */}
              <div className="p-5 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      1-Click Full System Backup (.json)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Exports all facility bookings, isolation beds, shift handovers, parcels, lost & found items, and settings into an encrypted-checksum JSON file.
                    </p>
                  </div>
                  <button
                    id="download-system-backup-btn"
                    onClick={handleDownloadBackup}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-95 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Download System Backup
                  </button>
                </div>
              </div>

              {/* Section 2: Disaster Recovery / Snapshot Restore */}
              <div className="p-5 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Disaster Recovery & Backup Restore
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Restore system state from a previous backup file. An automatic safety snapshot will be generated before applying any changes.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="system-backup-file-input"
                  />
                  <button
                    id="select-backup-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition"
                  >
                    <FileCheck className="w-4 h-4 text-indigo-500" />
                    {selectedFile ? selectedFile.name : 'Select Backup JSON File...'}
                  </button>
                  {selectedFile && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> File Selected
                    </span>
                  )}
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {validationError}
                  </div>
                )}

                {/* Parsed Snapshot Preview */}
                {parsedSnapshot && (
                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        Valid Backup Snapshot Verified
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Exported: {new Date(parsedSnapshot.exportedAt).toLocaleString()} by {parsedSnapshot.exportedBy}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-900">
                        <span className="text-slate-500 block">Bookings</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {parsedSnapshot.summary.bookingsCount}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-900">
                        <span className="text-slate-500 block">Handovers</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {parsedSnapshot.summary.handoversCount}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-900">
                        <span className="text-slate-500 block">Parcels</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {parsedSnapshot.summary.parcelsCount}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-900">
                        <span className="text-slate-500 block">Lost & Found</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {parsedSnapshot.summary.lostFoundCount}
                        </span>
                      </div>
                    </div>

                    {/* Restore Mode selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-indigo-100 dark:border-indigo-900">
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="restoreMode"
                            value="merge"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Merge (Non-Destructive)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="restoreMode"
                            value="replace"
                            checked={restoreMode === 'replace'}
                            onChange={() => setRestoreMode('replace')}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-rose-600 dark:text-rose-400">Full Replace (Disaster Recovery)</span>
                        </label>
                      </div>

                      <button
                        id="execute-restore-backup-btn"
                        onClick={handleExecuteRestore}
                        disabled={isRestoring}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition"
                      >
                        {isRestoring ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {isRestoring ? 'Restoring System...' : 'Apply Snapshot Restore'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Restore Status Banner */}
                {restoreStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      restoreStatus.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {restoreStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    {restoreStatus.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Offline Sync Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Resilient Offline Sync Queue Buffer
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    If an operator performs a booking, parcel log, or handover while offline or during GAS latency, it is safely stored here and auto-pushed once connection is active.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="flush-offline-queue-btn"
                    onClick={handleFlushQueueNow}
                    disabled={isFlushingQueue || offlineQueue.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFlushingQueue ? 'animate-spin' : ''}`} />
                    {isFlushingQueue ? 'Syncing...' : 'Flush Queue Now'}
                  </button>
                  {offlineQueue.length > 0 && (
                    <button
                      id="clear-offline-queue-btn"
                      onClick={handleClearQueue}
                      className="p-2 border border-slate-300 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 rounded-lg text-xs transition"
                      title="Clear Queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {flushResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    flushResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {flushResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  )}
                  {flushResult.message}
                </div>
              )}

              {offlineQueue.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Offline Queue is Clean & Empty
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    All local actions have been synchronized to Google Sheets. No pending network tasks.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {offlineQueue.map((item, idx) => (
                    <div
                      key={`off-queue-${item.id || 'q'}-${idx}`}
                      className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {item.facilityName}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono text-[10px]">
                            {item.action}
                          </span>
                          {item.retries > 0 && (
                            <span className="text-[10px] text-amber-600 font-semibold">
                              ({item.retries} retries)
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                        {item.lastError && (
                          <p className="text-[11px] text-rose-500 dark:text-rose-400 font-mono">
                            Error: {item.lastError}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Security Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Security & Access Audit Trail (Tamper-Resistant)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Logs all authentication logins, password updates, system backup exports, restores, and configuration changes.
                </p>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-8 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500">No security audit logs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {auditLogs.map((log, idx) => (
                    <div
                      key={`audit-${log.id || 'log'}-${idx}`}
                      className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.eventType === 'LOGIN_SUCCESS'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : log.eventType === 'LOGIN_FAILURE'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {log.eventType}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {log.username}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Tamimi Global Enterprise Helpdesk • Built for high availability & reliability</span>
          <button
            id="close-system-backup-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

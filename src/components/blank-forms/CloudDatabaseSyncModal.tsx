import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Database,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  FileJson,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BlankFromService } from '../../services/blankFromService';
import { ToastService } from '../../services/toastService';
import { BlankFromRow } from '../../data/initialBlankFromData';

interface CloudDatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  localCount: number;
  onDatabaseUpdated?: (newCount: number) => void;
}

export const CloudDatabaseSyncModal: React.FC<CloudDatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  localCount,
  onDatabaseUpdated,
}) => {
  const [cloudMeta, setCloudMeta] = useState<{ totalRecords: number; updatedAt?: string; chunksCount: number } | null>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [syncDirection, setSyncDirection] = useState<'push' | 'pull' | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMeta();
    }
  }, [isOpen]);

  const loadMeta = async () => {
    setIsLoadingMeta(true);
    try {
      const meta = await BlankFromService.getCloudCatalogMeta();
      setCloudMeta(meta);
    } catch (e) {
      console.warn('Error reading cloud meta:', e);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  if (!isOpen) return null;

  const handlePushToCloud = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncDirection('push');
    setSyncProgress('Connecting to Cloud Firestore...');

    try {
      const res = await BlankFromService.pushCatalogToCloud((curr, total, msg) => {
        setSyncProgress(msg);
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 80 });
        ToastService.hub(res.message);
        await loadMeta();
        if (onDatabaseUpdated) onDatabaseUpdated(res.count);
      } else {
        ToastService.warn(res.message);
      }
    } catch (err: any) {
      ToastService.warn(`Cloud push failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
      setSyncDirection(null);
      setSyncProgress('');
    }
  };

  const handlePullFromCloud = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncDirection('pull');
    setSyncProgress('Connecting to Cloud Firestore...');

    try {
      const res = await BlankFromService.fetchCatalogFromCloud((curr, total, msg) => {
        setSyncProgress(msg);
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 80 });
        ToastService.hub(res.message);
        await loadMeta();
        if (onDatabaseUpdated) onDatabaseUpdated(res.count);
      } else {
        ToastService.warn(res.message);
      }
    } catch (err: any) {
      ToastService.warn(`Cloud fetch failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
      setSyncDirection(null);
      setSyncProgress('');
    }
  };

  const handleExportExcel = () => {
    BlankFromService.exportFullDatabaseToExcel();
    ToastService.hub(`Exported ${localCount.toLocaleString()} resident records to Excel!`);
  };

  const handleExportJson = () => {
    BlankFromService.exportDatabaseJson();
    ToastService.hub(`Exported ${localCount.toLocaleString()} resident records to JSON backup!`);
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await BlankFromService.importDatabaseJson(file);
      if (res.success) {
        confetti({ particleCount: 60, spread: 70 });
        ToastService.hub(res.message);
        if (onDatabaseUpdated) onDatabaseUpdated(res.count);
      } else {
        ToastService.warn(res.message);
      }
    } catch (err: any) {
      ToastService.warn(`File import failed: ${err?.message || 'Invalid format'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'Not yet synced';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  Global Multi-Device Cloud Sync
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Firestore Connected
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Multi-Workstation Database Synchronization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সব কম্পিউটার ও ওয়ার্কস্টেশনে ৩,৪০৪ জন রেসিডেন্টের ডাটা এক ক্লিকে সিঙ্ক করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* This Computer */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  This Workstation (Local DB)
                </span>
                <span className="text-[10px] font-semibold text-slate-400">IndexedDB</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {localCount.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">Resident Records</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {localCount >= 3400
                  ? '✓ আপনার এই কম্পিউটারে সম্পূর্ণ ৩,৪০৪ ডাটাবেজ রয়েছে।'
                  : '⚠️ এই কম্পিউটারে কিছু রেকর্ড মিসিং রয়েছে।'}
              </p>
            </div>

            {/* Cloud Firestore */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  Cloud Firestore (Global)
                </span>
                <button
                  type="button"
                  onClick={loadMeta}
                  disabled={isLoadingMeta}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isLoadingMeta ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                  {isLoadingMeta ? '...' : cloudMeta ? cloudMeta.totalRecords.toLocaleString() : '0'}
                </span>
                <span className="text-xs font-semibold text-blue-600/80 dark:text-blue-400/80">Records in Cloud</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {cloudMeta
                  ? `Last Synced: ${formatDate(cloudMeta.updatedAt)}`
                  : 'ক্লাউডে এখনও ডাটা পাঠানো হয়নি।'}
              </p>
            </div>
          </div>

          {/* Sync Progress Bar if Active */}
          {isSyncing && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  {syncDirection === 'push' ? 'Uploading to Cloud Firestore...' : 'Downloading from Cloud Firestore...'}
                </span>
              </div>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                {syncProgress || 'Processing records...'}
              </p>
            </div>
          )}

          {/* Action 1: Push from Primary PC (Recommended for 3,404 records computer) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>১. এই কম্পিউটার থেকে ক্লাউডে পাঠান (Push to Cloud)</span>
                  {localCount >= 3400 && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Recommended
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  যে কম্পিউটারে আপনি এক্সেল আপলোড করে ৩,৪০৪ টি রেকর্ড তৈরি করেছেন, সেই কম্পিউটার থেকে এই বাটনে ক্লিক করুন। এটি সম্পূর্ণ ৩,৪০৪ টি রেকর্ড ক্লাউডে জমা করবে এবং অন্য সব কম্পিউটার স্বয়ংক্রিয়ভাবে ডাটাগুলো পেয়ে যাবে।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePushToCloud}
              disabled={isSyncing || localCount === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>
                {isSyncing && syncDirection === 'push'
                  ? 'ক্লাউডে আপলোড হচ্ছে...'
                  : `Upload Local Database to Cloud (${localCount.toLocaleString()} Records)`}
              </span>
            </button>
          </div>

          {/* Action 2: Pull from Cloud (For other workstations) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                ২. ক্লাউড থেকে ডাটা ডাউনলোড করুন (Pull from Cloud)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                অন্যান্য যে কম্পিউটারগুলোতে ১,২২৩ টি রেকর্ড দেখাচ্ছে, সেগুলোতে এই বাটনে ক্লিক করলে মুহূর্তেই ক্লাউড থেকে সম্পূর্ণ ৩,৪০৪ টি রেকর্ড লোড হয়ে যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={isSyncing || !cloudMeta || cloudMeta.totalRecords === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isSyncing && syncDirection === 'pull'
                  ? 'ক্লাউড থেকে ডাউনলোড হচ্ছে...'
                  : `Fetch Database from Cloud (${cloudMeta ? cloudMeta.totalRecords.toLocaleString() : '3,404'} Records)`}
              </span>
            </button>
          </div>

          {/* Action 3: Offline Backup & File Transfer */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>অফলাইন ব্যাকআপ ও ফাইল এক্সপোর্ট / ইমপোর্ট</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                কোনো কম্পিউটার ইন্টারনেট ছাড়াই থাকলে বা ফাইল হিসেবে সংরক্ষণ করতে চাইলে নিচের অপশনগুলো ব্যবহার করুন:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Download full 3,404 database as an Excel file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Download full database as JSON backup"
              >
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Restore or import JSON backup"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Restore (.json)</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            🔒 Tamimi Global Security: Firestore 256-bit encrypted persistence
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

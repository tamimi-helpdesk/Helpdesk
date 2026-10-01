import React, { useRef, useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  FileJson,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Clock,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { StorageService, getTodayDateString } from '../../services/storageService';
import { AutoBackupService, AutoSnapshotMeta } from '../../services/autoBackupService';

interface BackupExportTabProps {
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshAll: () => void;
}

export const BackupExportTab: React.FC<BackupExportTabProps> = ({
  onShowFeedback,
  onRefreshAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snapshots, setSnapshots] = useState<AutoSnapshotMeta[]>([]);

  const loadSnapshots = () => {
    setSnapshots(AutoBackupService.listSnapshots());
  };

  useEffect(() => {
    AutoBackupService.performDailyAutoBackupIfNeeded();
    loadSnapshots();
  }, []);

  const handleExportJson = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tamimi_full_backup_${getTodayDateString()}.json`;
    link.click();
    onShowFeedback('Complete database JSON exported successfully!', 'success');
  };

  const handleCreateManualSnapshot = () => {
    const success = AutoBackupService.createSnapshot();
    if (success) {
      loadSnapshots();
      onShowFeedback('New local system snapshot created successfully!', 'success');
    } else {
      onShowFeedback('Failed to create snapshot.', 'error');
    }
  };

  const handleRestoreSnapshot = (key: string) => {
    if (!window.confirm('Restore system data from this snapshot? Current data will be merged and updated.')) return;
    const res = AutoBackupService.restoreSnapshot(key);
    if (res.success) {
      onShowFeedback('System successfully restored from snapshot!', 'success');
      onRefreshAll();
    } else {
      onShowFeedback(res.error || 'Failed to restore snapshot.', 'error');
    }
  };

  const handleDeleteSnapshot = (key: string) => {
    AutoBackupService.deleteSnapshot(key);
    loadSnapshots();
    onShowFeedback('Snapshot deleted.', 'info');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = StorageService.importData(text);
        if (res.success) {
          onShowFeedback('Database backup successfully restored!', 'success');
          onRefreshAll();
          loadSnapshots();
        } else {
          onShowFeedback(res.error || 'Failed to restore backup.', 'error');
        }
      } catch (err: any) {
        onShowFeedback('Invalid JSON backup file format.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Backup &amp; Automated Snapshots
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Daily rolling backups, manual snapshots, and complete JSON system restore.
          </p>
        </div>
        <button
          onClick={handleCreateManualSnapshot}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <HardDrive className="w-4 h-4" />
          <span>Create Snapshot Now</span>
        </button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export JSON */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 mb-2">
              <Download className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export Full JSON Database</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Downloads an offline snapshot containing all bookings, isolation beds, handovers, parcel logs, and audit trails.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileJson className="w-4 h-4" />
            <span>Download JSON Snapshot</span>
          </button>
        </div>

        {/* Restore JSON */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-2">
              <Upload className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Restore from Backup File</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Upload a previously downloaded JSON snapshot. Safely validates schemas and merges records without corruption.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select Backup JSON File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Automated Snapshots Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              7-Day Rolling Local Snapshots ({snapshots.length})
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto-protect Active
          </span>
        </div>

        {snapshots.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No local snapshots created yet. Click "Create Snapshot Now" or wait for daily schedule.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {snapshots.map((snap) => (
              <div key={snap.key} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {(snap.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex gap-2">
                    <span>Bookings: {snap.recordCounts.bookings}</span>
                    <span>•</span>
                    <span>Isolation: {snap.recordCounts.isolation}</span>
                    <span>•</span>
                    <span>Handovers: {snap.recordCounts.handovers}</span>
                    <span>•</span>
                    <span>Parcels: {snap.recordCounts.parcels}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => AutoBackupService.downloadSnapshot(snap.key)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Download Snapshot"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRestoreSnapshot(snap.key)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snap.key)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  UploadCloud,
  Check,
  Package,
  Key,
  Layers,
  Bed,
} from 'lucide-react';
import { GasConnectionConfig } from '../../types';
import { GasService } from '../../services/gasService';
import { OfflineQueueService } from '../../services/offlineQueueService';
import { StorageService } from '../../services/storageService';
import { GAS_CODE_GS } from '../../data/gasCodeGs';

interface GoogleSyncTabProps {
  gasConfig: GasConnectionConfig;
  onSaveGasConfig: (cfg: GasConnectionConfig) => void;
  onSyncGas: () => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GoogleSyncTab: React.FC<GoogleSyncTabProps> = ({
  gasConfig,
  onSaveGasConfig,
  onSyncGas,
  onShowFeedback,
}) => {
  const [webAppUrl, setWebAppUrl] = useState(gasConfig.webAppUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const pendingCount = OfflineQueueService.getPendingCount();

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = webAppUrl.trim();
    const updated = {
      ...gasConfig,
      webAppUrl: trimmed,
      syncStatus: trimmed ? ('connected' as const) : ('error' as const),
    };
    onSaveGasConfig(updated);
    onShowFeedback('Google Apps Script Web App URL saved!', 'success');
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      onShowFeedback('Please enter a Google Apps Script Web App URL first.', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const res = await GasService.testConnection(webAppUrl.trim());
      if (res.success) {
        onShowFeedback(res.message || 'Google Sheets connection verified and healthy!', 'success');
      } else {
        onShowFeedback(res.message || 'Connection failed.', 'error');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await GasService.syncWithRemote();
      if (res.success) {
        onShowFeedback('All facilities, rooms, parcels, and handovers synchronized with Google Sheets!', 'success');
        onSyncGas();
      } else {
        onShowFeedback(res.error || 'Sync encountered an issue.', 'error');
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handlePushAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await GasService.pushAllDataToRemote();
      if (res.success) {
        onShowFeedback(`Pushed ${res.bookingsCount} bookings, ${res.handoversCount} handovers, ${res.parcelsCount} parcels to Google Sheets!`, 'success');
        onSyncGas();
      } else {
        onShowFeedback(res.error || 'Push failed.', 'error');
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncHandovers = async () => {
    setIsSyncingAll(true);
    try {
      const records = StorageService.getHandoverRecords();
      const res = await GasService.pushBatchHandoversToRemote(records);
      if (res.success) {
        onShowFeedback(`Successfully synced ${records.length} Shift Handovers to Google Sheets!`, 'success');
        onSyncGas();
      } else {
        onShowFeedback(res.error || 'Handover sync failed.', 'error');
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncParcels = async () => {
    setIsSyncingAll(true);
    try {
      const records = StorageService.getParcelRecords();
      const res = await GasService.pushBatchParcelsToRemote(records);
      if (res.success) {
        onShowFeedback(`Successfully synced ${records.length} Mail & Parcels to Google Sheets!`, 'success');
        onSyncGas();
      } else {
        onShowFeedback(res.error || 'Parcel sync failed.', 'error');
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncIsolation = async () => {
    setIsSyncingAll(true);
    try {
      await GasService.triggerSetupSheets().catch(() => {});
      const res = await GasService.syncAllIsolationRoomsToSheet();
      if (res.success) {
        onShowFeedback(`Synced ${res.pushedCount} isolation bed records to Google Sheets!`, 'success');
      } else {
        onShowFeedback(res.error || 'Isolation room sync failed.', 'error');
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_CODE_GS);
    setCopiedCode(true);
    onShowFeedback('Apps Script Code.gs copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Google Sheets &amp; Apps Script Sync Hub
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Bi-directional cloud synchronization across 8 sheets (Facilities, Isolation, Handover, Parcels, Lost &amp; Found).
        </p>
      </div>

      {/* CARD 1: GAS ENDPOINT */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Google Apps Script Web App Deployment URL</span>
        </h3>

        <form onSubmit={handleSaveUrl} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Web App URL (Exec Endpoint)
            </label>
            <input
              type="url"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer"
            >
              Save Endpoint
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: SYNC ACTIONS */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Real-Time Bi-Directional Operations</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 text-left transition cursor-pointer"
          >
            <div className="flex items-center space-x-2 mb-1">
              <RefreshCw className={`w-4 h-4 text-sky-600 dark:text-sky-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <h4 className="font-black text-xs text-sky-950 dark:text-sky-200">
                Sync All from Google Sheets
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pull fresh bookings, room occupancy, parcels, and handovers from Google Cloud.
            </p>
          </button>

          <button
            onClick={handlePushAll}
            disabled={isSyncingAll}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-left transition cursor-pointer"
          >
            <div className="flex items-center space-x-2 mb-1">
              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                Force Push Local Data to Sheets
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Upload all local records into your Google Sheets spreadsheet tabs.
            </p>
          </button>
        </div>

        {/* Granular Module Sync Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Module-Specific Cloud Sync
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleSyncHandovers}
              disabled={isSyncingAll}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-left transition cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <Key className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">Shift Handovers</div>
                <div className="text-[10px] text-slate-400">Sync key & log records</div>
              </div>
            </button>

            <button
              onClick={handleSyncParcels}
              disabled={isSyncingAll}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-left transition cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <Package className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">Parcels &amp; Mail</div>
                <div className="text-[10px] text-slate-400">Sync incoming shipments</div>
              </div>
            </button>

            <button
              onClick={handleSyncIsolation}
              disabled={isSyncingAll}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-left transition cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <Bed className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">Isolation Rooms</div>
                <div className="text-[10px] text-slate-400">Sync bed occupancies</div>
              </div>
            </button>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>Offline Queue: <strong>{pendingCount} records</strong> pending background upload.</span>
            <button
              onClick={() => OfflineQueueService.flushQueue(GasService)}
              className="px-3 py-1 rounded-xl bg-amber-600 text-white font-black text-[11px] hover:bg-amber-500"
            >
              Flush Queue
            </button>
          </div>
        )}
      </div>

      {/* CARD 3: CODE GENERATOR */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Google Apps Script Code.gs Template
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
            >
              {showCode ? 'Hide Code' : 'View Code'}
            </button>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code.gs'}</span>
            </button>
          </div>
        </div>

        {showCode && (
          <pre className="mt-3 p-3.5 rounded-2xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
            {GAS_CODE_GS}
          </pre>
        )}
      </div>
    </div>
  );
};

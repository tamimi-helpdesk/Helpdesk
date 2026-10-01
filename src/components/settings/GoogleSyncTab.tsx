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
  Sparkles,
  RotateCcw,
  Link2,
} from 'lucide-react';
import { GasConnectionConfig } from '../../types';
import { GasService, TestConnectionResult } from '../../services/gasService';
import { OfflineQueueService } from '../../services/offlineQueueService';
import { StorageService } from '../../services/storageService';
import { GAS_CODE_GS } from '../../data/gasCodeGs';
import { DEFAULT_GAS_WEB_APP_URL } from '../../config/gasConfig';

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
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const pendingCount = OfflineQueueService.getPendingCount();
  const sanitized = GasService.sanitizeUrl(webAppUrl);

  const isSheetLink = sanitized.isSheetLink || webAppUrl.includes('docs.google.com/spreadsheets/d/');

  const handleSaveAndTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = sanitized.url || webAppUrl.trim();

    if (!cleanUrl) {
      const updated: GasConnectionConfig = {
        ...gasConfig,
        webAppUrl: '',
        syncStatus: 'idle',
        isCustomUrl: false,
      };
      onSaveGasConfig(updated);
      setTestResult(null);
      onShowFeedback('Web App URL cleared.', 'info');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await GasService.testConnection(cleanUrl);
      setTestResult(res);

      const updated: GasConnectionConfig = {
        ...gasConfig,
        webAppUrl: cleanUrl,
        sheetId: sanitized.sheetId || gasConfig.sheetId,
        syncStatus: res.success ? 'connected' : 'error',
        lastSyncedAt: res.success ? new Date().toISOString() : gasConfig.lastSyncedAt,
        isCustomUrl: true,
      };
      onSaveGasConfig(updated);

      if (res.success) {
        onShowFeedback(res.message || 'Google Sheets connection verified and healthy!', 'success');
        onSyncGas();
      } else {
        onShowFeedback(res.message || 'Google Sheets connection test failed.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection failed.',
        diagnosis: 'NETWORK_ERROR',
      });
      onShowFeedback('Connection test encountered an error.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleFixUrl = () => {
    if (sanitized.url) {
      setWebAppUrl(sanitized.url);
    }
  };

  const handleResetToDefault = () => {
    const updated = GasService.resetToDefaultUrl();
    setWebAppUrl(updated.webAppUrl);
    setTestResult(null);
    onSaveGasConfig(updated);
    onShowFeedback('Master default Web App URL restored!', 'success');
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const res = await GasService.syncWithRemote(true);
      if (res.success) {
        onShowFeedback('All 20 facilities, rooms, parcels, and handovers synchronized with Google Sheets!', 'success');
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
        onShowFeedback(`Pushed ${res.bookingsCount} bookings, ${res.handoversCount} handovers, ${res.parcelsCount} parcels directly into Google Sheets!`, 'success');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Google Sheets &amp; Apps Script Sync Hub</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bi-directional cloud synchronization across 20 facilities (Facilities, Isolation, Handover, Parcels, Lost &amp; Found, Tickets).
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center space-x-2 ${
            gasConfig.syncStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : gasConfig.syncStatus === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              gasConfig.syncStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : gasConfig.syncStatus === 'error'
                ? 'bg-red-500'
                : 'bg-slate-400'
            }`} />
            <span>
              {gasConfig.syncStatus === 'connected'
                ? 'সংযুক্ত (Connected)'
                : gasConfig.syncStatus === 'error'
                ? 'সংযোগ বিচ্ছিন্ন (Not Connected)'
                : 'অপেক্ষমাণ (Idle)'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 1: GAS ENDPOINT */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Google Apps Script Web App Deployment URL</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Enter your deployed Google Apps Script Web App Exec URL (starts with <code className="font-mono text-emerald-600 dark:text-emerald-400">https://script.google.com/macros/s/.../exec</code>).
          </p>
        </div>

        <form onSubmit={handleSaveAndTest} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Google Apps Script Web App URL (Exec Endpoint)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webAppUrl}
                onChange={(e) => {
                  setWebAppUrl(e.target.value);
                  setTestResult(null);
                }}
                className={`flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border-2 rounded-xl focus:outline-none transition ${
                  isSheetLink
                    ? 'border-amber-400 dark:border-amber-500/70 bg-amber-50/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                }`}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                required
              />

              {sanitized.warning && sanitized.url !== webAppUrl && (
                <button
                  type="button"
                  onClick={handleFixUrl}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shrink-0"
                  title="Auto-fix /edit or /dev to /exec"
                >
                  Fix URL to /exec
                </button>
              )}
            </div>
          </div>

          {/* SPREADSHEET LINK WARNING & 4-STEP BENGALI GUIDANCE */}
          {isSheetLink && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-black">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⚠️ এটি Google Spreadsheet-এর সরাসরি লিংক (Direct Spreadsheet Link Detected)</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                আপনি সরাসরি গুগল স্প্রেডশিটের লিংক (<code>docs.google.com/spreadsheets/d/...</code>) দিয়েছেন। পোর্টাল থেকে গুগল শিটে স্বয়ংক্রিয়ভাবে বুকিং ও ডেটা সেভ করার জন্য <strong>Google Apps Script Web App Exec URL</strong> প্রয়োজন।
              </p>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-[11px] text-slate-800 dark:text-slate-200">
                <div className="font-black text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>সহজ ৪-স্টেপ সেটআপ নির্দেশিকা (মাত্র ১ মিনিট সময় লাগবে):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 font-medium">
                  <li>আপনার Google Sheet খুলে উপরের মেনু থেকে <strong>Extensions &gt; Apps Script</strong>-এ যান।</li>
                  <li>নিচের <strong>"Copy 20-Facility Code.gs"</strong> বাটনে ক্লিক করে পুরো কোডটি কপি করে Apps Script-এর <code>Code.gs</code>-এ পেস্ট করে <strong>Save</strong> করুন।</li>
                  <li>উপরে <strong>Deploy &gt; New deployment</strong>-এ ক্লিক করে type সিলেক্ট করুন <strong>"Web app"</strong>।</li>
                  <li><strong>Execute as:</strong> "Me" এবং <strong>Who has access:</strong> <span className="text-rose-600 dark:text-rose-400 font-black">"Anyone"</span> সিলেক্ট করে Deploy করুন এবং প্রাপ্ত Web App Exec URL টি কপি করে এখানে দিন!</li>
                </ol>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied 20-Facility Code.gs!' : 'Copy 20-Facility Code.gs'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {showCode ? 'Hide Code' : 'View Code'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEST RESULT FEEDBACK */}
          {testResult && (
            <div className={`p-4 rounded-2xl border-2 text-xs space-y-2 ${
              testResult.diagnosis === 'OUTDATED_CODE_GS'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200'
                : testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-black text-sm">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <span>
                    {testResult.success
                      ? 'কানেকশন সফল (Connected Successfully)'
                      : 'কানেকশন ব্যর্থ (Connection Failed)'}
                  </span>
                </div>
                {testResult.latencyMs && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700">
                    {testResult.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="font-medium text-xs leading-relaxed opacity-95">{testResult.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={isTesting}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>পরীক্ষা করা হচ্ছে (Testing &amp; Saving)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Save &amp; Test Connection</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center space-x-1.5 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Reset to Master Fallback Web App URL"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Master Default URL</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: SYNC ACTIONS */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Real-Time Bi-Directional Operations (All 20 Facilities)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll || !gasConfig.webAppUrl}
            className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-left transition cursor-pointer disabled:opacity-50"
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
            disabled={isSyncingAll || !gasConfig.webAppUrl}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-left transition cursor-pointer disabled:opacity-50"
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
              disabled={isSyncingAll || !gasConfig.webAppUrl}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-left transition cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <Key className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">Shift Handovers</div>
                <div className="text-[10px] text-slate-400">Sync key &amp; log records</div>
              </div>
            </button>

            <button
              onClick={handleSyncParcels}
              disabled={isSyncingAll || !gasConfig.webAppUrl}
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
              disabled={isSyncingAll || !gasConfig.webAppUrl}
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
              className="px-3 py-1 rounded-xl bg-amber-600 text-white font-black text-[11px] hover:bg-amber-500 cursor-pointer"
            >
              Flush Queue
            </button>
          </div>
        )}
      </div>

      {/* CARD 3: CODE GENERATOR */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Google Apps Script Code.gs Template
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste this complete script into Apps Script for 20 facilities support.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
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

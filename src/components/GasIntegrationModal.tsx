import React, { useState } from 'react';
import {
  X,
  FileCode,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Link2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GAS_CODE_GS } from '../data/gasTemplates';
import { GasConnectionConfig } from '../types';
import { GasService, TestConnectionResult } from '../services/gasService';
import { StorageService } from '../services/storageService';

interface GasIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConnectionConfig;
  onSaveConfig: (cfg: GasConnectionConfig) => void;
  onSync: () => void;
}

export const GasIntegrationModal: React.FC<GasIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSync,
}) => {
  const [activeTab, setActiveTab] = useState<'SETUP' | 'CODE_GS'>('SETUP');
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [pushingAll, setPushingAll] = useState(false);
  const [pushAllResult, setPushAllResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const sanitized = GasService.sanitizeUrl(webAppUrl);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handlePushAllData = async () => {
    setPushingAll(true);
    setPushAllResult(null);
    try {
      const res = await GasService.pushAllDataToRemote();
      if (res.success) {
        setPushAllResult({
          success: true,
          message: `Successfully pushed ${res.bookingsCount} Bookings, ${res.handoversCount} Handovers, ${res.parcelsCount} Parcels, ${res.lostFoundCount} Lost & Found, ${res.isolationCount} Isolation, ${res.blankFormsCount || 0} Blank Forms, ${res.invoicesCount || 0} Invoices, ${res.noticesCount || 0} Notices, ${res.supportTicketsCount || 0} Support Tickets, ${res.workOrderTicketsCount || 0} Work Orders, ${res.slaPoliciesCount || 0} SLA Policies, ${res.workflowsCount || 0} Workflows, and ${res.emailLogsCount || 0} Email Logs directly into Google Sheets!`,
        });
        onSync();
      } else {
        setPushAllResult({
          success: false,
          message: res.error || 'Failed to push all data to Google Sheets.',
        });
      }
    } catch (err: any) {
      setPushAllResult({
        success: false,
        message: err.message || 'Error occurred while pushing to Google Sheets.',
      });
    } finally {
      setPushingAll(false);
    }
  };

  const handleSaveAndTest = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const targetUrl = sanitized.url || webAppUrl.trim();

    const newConfig: GasConnectionConfig = {
      ...config,
      webAppUrl: targetUrl,
      sheetId: sanitized.sheetId || config.sheetId,
    };

    onSaveConfig(newConfig);

    if (targetUrl) {
      const res = await GasService.testConnection(targetUrl);
      setTestResult(res);
      if (res.success) {
        onSync();
      }
    } else {
      setTestResult({
        success: true,
        message: 'Saved. Web App URL cleared.',
        diagnosis: 'OK',
      });
    }

    setTestingConnection(false);
  };

  const handleClearUrl = () => {
    setWebAppUrl('');
    const newConfig: GasConnectionConfig = {
      ...config,
      webAppUrl: '',
      syncStatus: 'idle',
    };
    onSaveConfig(newConfig);
    setTestResult(null);
  };

  const handleDownloadCodeGs = () => {
    const element = document.createElement('a');
    const file = new Blob([GAS_CODE_GS], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'Code.gs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 dark:bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="bg-white dark:bg-slate-900 border-2 border-emerald-300/80 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 p-5 sm:p-7 relative transition-colors"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pr-10 space-y-1">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-black uppercase tracking-wider">
            <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Live Cloud Synchronization</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Backend &amp; Google Sheets</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Connect directly to your Google Sheet deployment or copy the backend Apps Script code.
          </p>
        </div>

        {/* Two Tabs: Connect Web App and Code.gs */}
        <div className="flex space-x-2 border-b-2 border-slate-200/90 dark:border-slate-800 pb-3">
          {[
            { id: 'SETUP', label: 'Connect Web App', icon: Link2 },
            { id: 'CODE_GS', label: 'Code.gs Script', icon: FileCode },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Connect Web App */}
        {activeTab === 'SETUP' && (
          <div className="space-y-4 pt-1">
            
            {/* Status Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between ${
                config.webAppUrl
                  ? config.syncStatus === 'error'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
              }`}>
                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Connection Status
                </div>
                <div className="mt-1.5 flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    config.webAppUrl
                      ? config.syncStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-400'
                  }`} />
                  <span className="text-xs font-black text-slate-950 dark:text-white truncate">
                    {config.webAppUrl
                      ? config.syncStatus === 'error'
                        ? 'Disconnected'
                        : 'Connected'
                      : 'Not Connected'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Synced 20 Facilities
                </div>
                <div className="mt-1.5 text-xs font-black text-sky-700 dark:text-sky-400">
                  {StorageService.getAllBookings().length} Bookings · {StorageService.getHandoverRecords().length + StorageService.getParcelRecords().length + StorageService.getLostFoundRecords().length + StorageService.getIsolationRooms().length} Records
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Last Sync
                </div>
                <div className="mt-1.5 text-xs font-black text-slate-900 dark:text-slate-200 truncate">
                  {config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </div>
              </div>
            </div>

            {/* Clean URL Input Form */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Google Apps Script Web App URL
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => {
                    setWebAppUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                />
                
                {webAppUrl && (
                  <button
                    type="button"
                    onClick={handleClearUrl}
                    className="px-3 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Clear URL"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAndTest}
                  disabled={testingConnection}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 transition disabled:opacity-50 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  {testingConnection ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Testing...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save &amp; Test</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-2xl text-xs space-y-2 font-bold ${
                    testResult.diagnosis === 'OUTDATED_CODE_GS'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-200'
                      : testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/30 text-red-900 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {testResult.diagnosis === 'OUTDATED_CODE_GS' ? (
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : testResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                      <span className="text-sm font-black">
                        {testResult.diagnosis === 'OUTDATED_CODE_GS'
                          ? 'Google Apps Script Update Required (Outdated Script Detected)'
                          : testResult.success
                          ? 'Connection Successful (All 20 Facilities Ready)'
                          : 'Connection Error'}
                      </span>
                    </div>
                    {testResult.diagnosis === 'OUTDATED_CODE_GS' && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase">
                        Action Required
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-xs leading-relaxed opacity-95">
                    {testResult.diagnosis === 'OUTDATED_CODE_GS'
                      ? 'Your Google Sheet connection is active, but your Apps Script deployment is running an older version. To automatically synchronize and save data for all 20 facilities into your Google Sheet, paste the latest Code.gs into Apps Script and deploy a New Version.'
                      : testResult.message}
                  </p>

                  {testResult.diagnosis === 'OUTDATED_CODE_GS' && (
                    <div className="mt-3 p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-300 dark:border-amber-700/60 space-y-2 text-[11px] text-slate-900 dark:text-slate-100">
                      <div className="font-black text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Quick 4-step update instructions (under 1 minute):</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-800 dark:text-slate-200 font-medium">
                        <li>Click <strong>"Copy Latest 20-Facility Code.gs"</strong> below.</li>
                        <li>In your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong>.</li>
                        <li>Clear the existing code in <code>Code.gs</code>, paste the new code, and click <strong>Save</strong>.</li>
                        <li>Go to <strong>Deploy &gt; Manage deployments</strong> &gt; click the <strong>Edit (pencil)</strong> icon &gt; select Version: <strong>"New version"</strong> and click <strong>Deploy</strong>.</li>
                      </ol>
                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(GAS_CODE_GS, 'code_gs_banner')}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                        >
                          {copiedSection === 'code_gs_banner' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Copied Latest 20-Facility Code.gs!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Latest 20-Facility Code.gs</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('CODE_GS')}
                          className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          View Code
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sync Actions & Push to Google Sheets */}
            <div className="space-y-2.5">
              {/* Master Push All Demo & Local Data Button */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-2 border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Push All Data to Google Sheet (All 20 Facilities)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Pushes all local records (Bookings, Handovers, Parcels, Lost &amp; Found, Isolation, Blank Forms, Invoices, Notices, Tickets, SLA, Workflows, Emails) into your Sheet tabs.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePushAllData}
                  disabled={pushingAll || !config.webAppUrl}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black flex items-center space-x-1.5 transition shadow-md shadow-emerald-600/20 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${pushingAll ? 'animate-spin' : ''}`} />
                  <span>{pushingAll ? 'Pushing Data...' : 'Push All Data Now'}</span>
                </motion.button>
              </div>

              {/* Push All Result Feedback */}
              {pushAllResult && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl text-xs space-y-1 font-bold ${
                    pushAllResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/30 text-red-900 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {pushAllResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <span>{pushAllResult.success ? 'Data Push Successful' : 'Data Push Error'}</span>
                  </div>
                  <p className="font-medium text-[11px] opacity-90 pl-6">{pushAllResult.message}</p>
                </motion.div>
              )}

              {/* Standard Bi-directional Sync Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-sky-50/80 dark:bg-sky-950/30 border-2 border-sky-200 dark:border-sky-800/40 rounded-2xl text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-900 dark:text-white font-black text-sm">
                      Central System Sync
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                      Auto-syncs on Login
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Syncs all 20 facilities, bookings, isolation rooms, parcels, handovers, lost &amp; found, blank forms, invoices, notices, and tickets with Google Sheets.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSync}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black flex items-center space-x-2 transition shadow-md shadow-sky-600/20 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Whole System Now</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Code.gs */}
        {activeTab === 'CODE_GS' && (
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                Google Apps Script Source Code (Code.gs)
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCopy(GAS_CODE_GS, 'code_gs')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  {copiedSection === 'code_gs' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </motion.button>
                <button
                  onClick={handleDownloadCodeGs}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black flex items-center space-x-1.5 border-2 border-slate-300 dark:border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed rounded-2xl border-2 border-slate-800 overflow-x-auto max-h-[420px] select-all shadow-inner">
                <code>{GAS_CODE_GS}</code>
              </pre>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};



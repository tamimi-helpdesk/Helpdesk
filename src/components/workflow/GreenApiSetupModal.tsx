import React, { useState } from 'react';
import { X, ShieldCheck, Key, Globe, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check, RefreshCw, Smartphone, MessageSquare, Users } from 'lucide-react';
import { GreenApiService, GreenApiConfig, GreenApiChat } from '../../services/greenApiService';
import { GasService } from '../../services/gasService';
import { ToastService } from '../../services/toastService';

interface GreenApiSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: GreenApiConfig) => void;
}

export const GreenApiSetupModal: React.FC<GreenApiSetupModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = GreenApiService.getConfig();
  const gasConfig = GasService.getConfig();

  const [instanceId, setInstanceId] = useState(currentConfig.instanceId || '');
  const [apiToken, setApiToken] = useState(currentConfig.apiToken || '');
  const [targetGroupChatId, setTargetGroupChatId] = useState(currentConfig.targetGroupChatId || '');
  const [targetGroupName, setTargetGroupName] = useState(currentConfig.targetGroupName || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isDetectingGroups, setIsDetectingGroups] = useState(false);
  const [detectedGroups, setDetectedGroups] = useState<GreenApiChat[]>([]);

  if (!isOpen) return null;

  const webhookUrl = gasConfig.webAppUrl
    ? `${gasConfig.webAppUrl}?action=greenApiWebhook`
    : 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=greenApiWebhook';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    ToastService.showSuccess('Webhook URL copied to clipboard');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await GreenApiService.testConnection(instanceId, apiToken);
      setTestResult(res);
      if (res.success) {
        ToastService.showSuccess('Green API Connected Successfully!');
      } else {
        ToastService.showError(res.message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleDetectGroups = async () => {
    if (!instanceId.trim() || !apiToken.trim()) {
      ToastService.showError('Please enter Instance ID and API Token first.');
      return;
    }
    setIsDetectingGroups(true);
    try {
      const res = await GreenApiService.getChats(instanceId, apiToken);
      if (res.success && res.chats.length > 0) {
        // Filter group chats
        const groupsOnly = res.chats.filter((c) => c.id.includes('@g.us') || c.type === 'group');
        const listToUse = groupsOnly.length > 0 ? groupsOnly : res.chats;
        setDetectedGroups(listToUse);
        ToastService.showSuccess(`Found ${listToUse.length} WhatsApp chats/groups! Click one to select.`);
      } else {
        ToastService.showInfo(res.error || 'No chats found or Green API phone is offline. You can manually enter your Group Chat ID.');
      }
    } catch (err: any) {
      ToastService.showError(`Error searching groups: ${err.message}`);
    } finally {
      setIsDetectingGroups(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = GreenApiService.saveConfig({
      instanceId: instanceId.trim(),
      apiToken: apiToken.trim(),
      targetGroupChatId: targetGroupChatId.trim(),
      targetGroupName: targetGroupName.trim(),
      webhookUrl,
    });
    onConfigSaved(updated);
    ToastService.showSuccess(
      updated.isConfigured
        ? 'Green API Configuration Saved & Activated'
        : 'Configuration Updated'
    );
    onClose();
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect and clear Green API credentials?')) {
      GreenApiService.clearConfig();
      setInstanceId('');
      setApiToken('');
      setTargetGroupChatId('');
      setTargetGroupName('');
      setTestResult(null);
      onConfigSaved(GreenApiService.getConfig());
      ToastService.showInfo('Green API Disconnected. Switched to Free WhatsApp Direct Mode.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Green API WhatsApp Webhook Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure live field inspection sync from WhatsApp group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 ${
              currentConfig.isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}
          >
            {currentConfig.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-sm mb-0.5">
                {currentConfig.isConfigured
                  ? 'Green API Configured & Active'
                  : 'Green API Not Configured (Offline Mode)'}
              </span>
              <p>
                {currentConfig.isConfigured
                  ? 'Your WhatsApp group webhooks will automatically push field inspection photos and room numbers into your Google Sheet.'
                  : 'Green API is currently disconnected. Enter your Green API Instance ID and Token below to enable automatic synchronization with your WhatsApp inspection group.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Instance ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Green API Instance ID:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  placeholder="e.g. 7103847291"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* API Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Green API Token (apiTokenInstance):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="e.g. d76b5421a9c34e6f98..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Target WhatsApp Group ID & Detection */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target WhatsApp Group ID:</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectGroups}
                  disabled={isDetectingGroups || !instanceId || !apiToken}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingGroups ? 'animate-spin' : ''}`} />
                  <span>Auto-Detect My Groups</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={targetGroupChatId}
                  onChange={(e) => setTargetGroupChatId(e.target.value)}
                  placeholder="e.g. 120363028392819283@g.us or paste WhatsApp group link/ID"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              {/* Group Name input optional */}
              <div>
                <input
                  type="text"
                  value={targetGroupName}
                  onChange={(e) => setTargetGroupName(e.target.value)}
                  placeholder="Group Name / Label (optional, e.g. Tamimi TBCV Inspection Group)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-hidden"
                />
              </div>

              {/* Detected Groups Dropdown List */}
              {detectedGroups.length > 0 && (
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 max-h-36 overflow-y-auto space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block px-1">
                    Select your WhatsApp Inspection Group:
                  </span>
                  {detectedGroups.map((g, gIdx) => (
                    <button
                      key={`setup-grp-${g.id || 'grp'}-${gIdx}`}
                      type="button"
                      onClick={() => {
                        setTargetGroupChatId(g.id);
                        setTargetGroupName(g.name || '');
                        ToastService.showSuccess(`Selected: ${g.name || g.id}`);
                      }}
                      className="w-full text-left p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs flex items-center justify-between transition cursor-pointer border border-transparent hover:border-emerald-200"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate mr-2">
                        {g.name || 'Unnamed Group'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {g.id}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-tight">
                Enter the exact Group ID where inspectors post daily reports (e.g. <code>1203630...@g.us</code>). Click <strong>"Auto-Detect My Groups"</strong> to discover available groups.
              </p>
            </div>

            {/* Webhook Endpoint */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Webhook URL (for Green API Console):</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex items-center space-x-1 cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {webhookUrl}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                In Green API Console, go to <strong>Settings &gt; Webhook URL</strong>, paste this URL, and enable <strong>incomingMessageReceived</strong>.
              </p>
            </div>

            {/* Test Connection Results */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
                }`}
              >
                {testResult.message}
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !instanceId || !apiToken}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ml-auto shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Activate</span>
              </button>

              {currentConfig.isConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>

          {/* Quick Guide Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Green API Quick Overview:
            </span>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed">
              <li>
                <strong>Automated Integration:</strong> When enabled, field inspectors post defect photos and captions in WhatsApp, and they are automatically categorized and loaded into the operations registry.
              </li>
              <li>
                <strong>Direct Manual Input:</strong> You can also use the <strong>"Paste Text"</strong> tool to ingest messages directly at any time without an API key.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

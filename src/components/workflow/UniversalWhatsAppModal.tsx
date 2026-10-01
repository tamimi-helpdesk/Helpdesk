import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  MessageSquare,
  Users,
  Server,
  Cloud,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  WhatsAppUniversalService,
  UniversalWhatsAppConfig,
  WhatsAppProviderType,
} from '../../services/whatsappUniversalService';
import { GreenApiService, GreenApiChat } from '../../services/greenApiService';
import { GasService } from '../../services/gasService';
import { ToastService } from '../../services/toastService';

interface UniversalWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: UniversalWhatsAppConfig) => void;
}

export const UniversalWhatsAppModal: React.FC<UniversalWhatsAppModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = WhatsAppUniversalService.getConfig();
  const gasConfig = GasService.getConfig();

  const [activeProvider, setActiveProvider] = useState<WhatsAppProviderType>(
    currentConfig.activeProvider || 'green_api'
  );

  // Green API state
  const [greenInstanceId, setGreenInstanceId] = useState(currentConfig.greenApi.instanceId || '');
  const [greenApiToken, setGreenApiToken] = useState(currentConfig.greenApi.apiToken || '');
  const [greenTargetGroup, setGreenTargetGroup] = useState(currentConfig.greenApi.targetGroupChatId || '');
  const [greenGroupName, setGreenGroupName] = useState(currentConfig.greenApi.targetGroupName || '');

  // Meta Cloud API state
  const [metaPhoneId, setMetaPhoneId] = useState(currentConfig.metaCloud.phoneNumberId || '');
  const [metaWabaId, setMetaWabaId] = useState(currentConfig.metaCloud.wabaId || '');
  const [metaToken, setMetaToken] = useState(currentConfig.metaCloud.accessToken || '');
  const [metaVerifyToken, setMetaVerifyToken] = useState(
    currentConfig.metaCloud.verifyToken || 'tafga_tbcv_secret_verify_token_2026'
  );
  const [metaRecipient, setMetaRecipient] = useState(currentConfig.metaCloud.targetRecipient || '');

  // Custom Gateway state (Evolution API, Whapi, Baileys, etc.)
  const [gatewayName, setGatewayName] = useState(
    currentConfig.customGateway.gatewayName || 'Evolution API / Custom Webhook'
  );
  const [gatewayEndpoint, setGatewayEndpoint] = useState(currentConfig.customGateway.endpointUrl || '');
  const [gatewayFetchUrl, setGatewayFetchUrl] = useState(currentConfig.customGateway.fetchUrl || '');
  const [gatewayApiKey, setGatewayApiKey] = useState(currentConfig.customGateway.apiKey || '');
  const [gatewayHeaderName, setGatewayHeaderName] = useState(
    currentConfig.customGateway.authHeaderName || 'apikey'
  );
  const [gatewayScheme, setGatewayScheme] = useState<'Bearer' | 'ApiKey' | 'Custom' | 'None'>(
    currentConfig.customGateway.authScheme || 'ApiKey'
  );
  const [gatewayTargetChat, setGatewayTargetChat] = useState(
    currentConfig.customGateway.targetChatId || ''
  );

  // Test & UI states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isDetectingGroups, setIsDetectingGroups] = useState(false);
  const [detectedGroups, setDetectedGroups] = useState<GreenApiChat[]>([]);

  // Synchronize state with latest config whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const syncState = (cfg: UniversalWhatsAppConfig) => {
      setActiveProvider(cfg.activeProvider || 'green_api');
      setGreenInstanceId(cfg.greenApi?.instanceId || '');
      setGreenApiToken(cfg.greenApi?.apiToken || '');
      setGreenTargetGroup(cfg.greenApi?.targetGroupChatId || '');
      setGreenGroupName(cfg.greenApi?.targetGroupName || '');
      setMetaPhoneId(cfg.metaCloud?.phoneNumberId || '');
      setMetaWabaId(cfg.metaCloud?.wabaId || '');
      setMetaToken(cfg.metaCloud?.accessToken || '');
      setMetaVerifyToken(cfg.metaCloud?.verifyToken || 'tafga_tbcv_secret_verify_token_2026');
      setMetaRecipient(cfg.metaCloud?.targetRecipient || '');
      setGatewayName(cfg.customGateway?.gatewayName || 'Evolution API / Custom Webhook');
      setGatewayEndpoint(cfg.customGateway?.endpointUrl || '');
      setGatewayFetchUrl(cfg.customGateway?.fetchUrl || '');
      setGatewayApiKey(cfg.customGateway?.apiKey || '');
      setGatewayHeaderName(cfg.customGateway?.authHeaderName || 'apikey');
      setGatewayScheme(cfg.customGateway?.authScheme || 'ApiKey');
      setGatewayTargetChat(cfg.customGateway?.targetChatId || '');
    };

    // Load local cache immediately
    const fresh = WhatsAppUniversalService.getConfig();
    syncState(fresh);

    // Also check server disk in background to guarantee credentials never vanish
    WhatsAppUniversalService.fetchAndHydrateServerConfig().then((serverCfg) => {
      syncState(serverCfg);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const directWebhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/incoming`
      : '/api/whatsapp/incoming';

  const gasWebhookUrl = gasConfig.webAppUrl
    ? `${gasConfig.webAppUrl}?action=whatsappWebhook`
    : 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=whatsappWebhook';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    ToastService.showSuccess('URL copied to clipboard!');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    let configPayload: any = {};
    if (activeProvider === 'green_api') {
      configPayload = { instanceId: greenInstanceId, apiToken: greenApiToken };
    } else if (activeProvider === 'meta_cloud') {
      configPayload = { phoneNumberId: metaPhoneId, accessToken: metaToken };
    } else if (activeProvider === 'custom_gateway') {
      configPayload = {
        endpointUrl: gatewayEndpoint,
        apiKey: gatewayApiKey,
        authHeaderName: gatewayHeaderName,
        authScheme: gatewayScheme,
      };
    }

    try {
      const res = await WhatsAppUniversalService.testConnection(activeProvider, configPayload);
      setTestResult(res);
      if (res.success) {
        ToastService.showSuccess(res.message);
      } else {
        ToastService.showError(res.message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleDetectGreenGroups = async () => {
    if (!greenInstanceId.trim() || !greenApiToken.trim()) {
      ToastService.showError('Please enter Instance ID and API Token first.');
      return;
    }
    setIsDetectingGroups(true);
    try {
      const res = await GreenApiService.getChats(greenInstanceId, greenApiToken);
      if (res.success && res.chats.length > 0) {
        const groupsOnly = res.chats.filter((c) => c.id.includes('@g.us') || c.type === 'group');
        const listToUse = groupsOnly.length > 0 ? groupsOnly : res.chats;
        setDetectedGroups(listToUse);
        ToastService.showSuccess(`Found ${listToUse.length} chats/groups! Select one below.`);
      } else {
        ToastService.showInfo('No chats found or instance is offline. You can manually enter your Group ID.');
      }
    } catch (err: any) {
      ToastService.showError(`Error searching groups: ${err.message}`);
    } finally {
      setIsDetectingGroups(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated = WhatsAppUniversalService.saveConfig({
      activeProvider,
      greenApi: {
        instanceId: greenInstanceId.trim(),
        apiToken: greenApiToken.trim(),
        targetGroupChatId: greenTargetGroup.trim(),
        targetGroupName: greenGroupName.trim(),
      },
      metaCloud: {
        phoneNumberId: metaPhoneId.trim(),
        wabaId: metaWabaId.trim(),
        accessToken: metaToken.trim(),
        verifyToken: metaVerifyToken.trim(),
        targetRecipient: metaRecipient.trim(),
      },
      customGateway: {
        gatewayName: gatewayName.trim(),
        endpointUrl: gatewayEndpoint.trim(),
        fetchUrl: gatewayFetchUrl.trim(),
        apiKey: gatewayApiKey.trim(),
        authHeaderName: gatewayHeaderName.trim(),
        authScheme: gatewayScheme,
        targetChatId: gatewayTargetChat.trim(),
      },
      directWebhook: {
        webhookUrl: directWebhookUrl,
      },
    });

    onConfigSaved(updated);
    ToastService.showSuccess(
      updated.isConfigured
        ? `${activeProvider.toUpperCase()} Configuration Activated!`
        : 'Configuration Saved'
    );
    onClose();
  };

  const handleDisconnect = () => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to disconnect WhatsApp and remove your saved API credentials?')) {
      return;
    }
    WhatsAppUniversalService.clearConfig();
    const resetCfg = WhatsAppUniversalService.getConfig();
    onConfigSaved(resetCfg);
    ToastService.showInfo('WhatsApp Integration disconnected and credentials cleared.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Universal WhatsApp Integration Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect Green API, Meta WhatsApp Business Cloud API, or any Custom Gateway
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

        {/* Provider Switcher Tabs */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveProvider('green_api');
              setTestResult(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeProvider === 'green_api'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Green API</span>
            {currentConfig.activeProvider === 'green_api' && currentConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('meta_cloud');
              setTestResult(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeProvider === 'meta_cloud'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Meta WhatsApp Cloud API</span>
            {currentConfig.activeProvider === 'meta_cloud' && currentConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('custom_gateway');
              setTestResult(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeProvider === 'custom_gateway'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Evolution / Custom Gateway</span>
            {currentConfig.activeProvider === 'custom_gateway' && currentConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('direct_webhook');
              setTestResult(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeProvider === 'direct_webhook'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Direct Webhook / Ingest</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Provider Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 ${
              currentConfig.isConfigured && currentConfig.activeProvider === activeProvider
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {currentConfig.isConfigured && currentConfig.activeProvider === activeProvider ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-sm mb-0.5">
                {activeProvider === 'green_api' && 'Green API Gateway'}
                {activeProvider === 'meta_cloud' && 'Official Meta WhatsApp Business Cloud API'}
                {activeProvider === 'custom_gateway' && 'Universal Custom REST Gateway (Evolution, Whapi, Baileys)'}
                {activeProvider === 'direct_webhook' && 'Direct Webhook Receiver (Google Sheets / Apps Script)'}
              </span>
              <p>
                {activeProvider === 'green_api' &&
                  'Enables automated group message synchronization using your Green API Instance ID and Token.'}
                {activeProvider === 'meta_cloud' &&
                  'Official enterprise WhatsApp API powered by Meta Graph API. Supports Webhook verification and direct messaging.'}
                {activeProvider === 'custom_gateway' &&
                  'Connect self-hosted or third-party WhatsApp servers (Evolution API, Whapi.cloud, WPPConnect, Baileys, or Z-API).'}
                {activeProvider === 'direct_webhook' &&
                  'Push observation defect payloads directly from Google Apps Script, Zapier, n8n, or external automations.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. GREEN API FIELDS */}
            {activeProvider === 'green_api' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Green API Instance ID:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={greenInstanceId}
                      onChange={(e) => setGreenInstanceId(e.target.value)}
                      placeholder="e.g. 7103847291"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Green API Token (apiTokenInstance):
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={greenApiToken}
                      onChange={(e) => setGreenApiToken(e.target.value)}
                      placeholder="e.g. d76b5421a9c34e6f98..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Target WhatsApp Group ID:</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGreenGroups}
                      disabled={isDetectingGroups || !greenInstanceId || !greenApiToken}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isDetectingGroups ? 'animate-spin' : ''}`} />
                      <span>Auto-Detect My Groups</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={greenTargetGroup}
                    onChange={(e) => setGreenTargetGroup(e.target.value)}
                    placeholder="e.g. 120363028392819283@g.us"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />

                  {detectedGroups.length > 0 && (
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 max-h-36 overflow-y-auto space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block px-1">
                        Select your group:
                      </span>
                      {detectedGroups.map((g, idx) => (
                        <button
                          key={`grp-sel-${idx}`}
                          type="button"
                          onClick={() => {
                            setGreenTargetGroup(g.id);
                            setGreenGroupName(g.name || '');
                            ToastService.showSuccess(`Selected: ${g.name || g.id}`);
                          }}
                          className="w-full text-left p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate mr-2">
                            {g.name || 'Group'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{g.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={greenGroupName}
                    onChange={(e) => setGreenGroupName(e.target.value)}
                    placeholder="Group Name / Label (optional)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-hidden"
                  />
                </div>
              </>
            )}

            {/* 2. META CLOUD API FIELDS */}
            {activeProvider === 'meta_cloud' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meta Phone Number ID:
                  </label>
                  <input
                    type="text"
                    value={metaPhoneId}
                    onChange={(e) => setMetaPhoneId(e.target.value)}
                    placeholder="e.g. 104859281749281 (from Meta App Dashboard)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Business Account (WABA) ID:
                  </label>
                  <input
                    type="text"
                    value={metaWabaId}
                    onChange={(e) => setMetaWabaId(e.target.value)}
                    placeholder="e.g. 294827105829104"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Permanent System User Access Token:
                  </label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="EAABw..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Meta Webhook Callback URL:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(directWebhookUrl)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {directWebhookUrl}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Verify Token:{' '}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{metaVerifyToken}</span>
                  </p>
                </div>
              </>
            )}

            {/* 3. UNIVERSAL CUSTOM GATEWAY (EVOLUTION / WHAPI / BAILEYS) */}
            {activeProvider === 'custom_gateway' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gateway Server / Software:
                  </label>
                  <input
                    type="text"
                    value={gatewayName}
                    onChange={(e) => setGatewayName(e.target.value)}
                    placeholder="e.g. Evolution API, Whapi, WPPConnect, Baileys"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gateway API Base / Endpoint URL:
                  </label>
                  <input
                    type="url"
                    value={gatewayEndpoint}
                    onChange={(e) => setGatewayEndpoint(e.target.value)}
                    placeholder="https://my-evolution-server.com/message/sendText/instance1"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      API Key / Bearer Token:
                    </label>
                    <input
                      type="password"
                      value={gatewayApiKey}
                      onChange={(e) => setGatewayApiKey(e.target.value)}
                      placeholder="Auth secret key"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Header Name:
                    </label>
                    <input
                      type="text"
                      value={gatewayHeaderName}
                      onChange={(e) => setGatewayHeaderName(e.target.value)}
                      placeholder="apikey, Authorization, x-api-key"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target WhatsApp Chat / Group JID:
                  </label>
                  <input
                    type="text"
                    value={gatewayTargetChat}
                    onChange={(e) => setGatewayTargetChat(e.target.value)}
                    placeholder="120363028392819283@g.us"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {/* 4. DIRECT WEBHOOK RECEIVER */}
            {activeProvider === 'direct_webhook' && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-600" />
                      <span>Direct Ingest Webhook URL:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(directWebhookUrl)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {directWebhookUrl}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <Server className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Google Apps Script Sync Webhook:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(gasWebhookUrl)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {gasWebhookUrl}
                  </p>
                </div>
              </div>
            )}

            {/* Test Results Banner */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
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
              {activeProvider !== 'direct_webhook' && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              )}

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
        </div>
      </div>
    </div>
  );
};

/**
 * Universal WhatsApp Integration Service
 * Provider-agnostic engine supporting:
 * - Green API
 * - Meta WhatsApp Business Cloud API (Graph API)
 * - Universal Custom Gateway (Evolution API, Whapi, Baileys, WPPConnect, Z-API, Custom Webhooks)
 * - Direct Inbound Webhooks
 */

import { GreenApiService } from './greenApiService';

export type WhatsAppProviderType = 'green_api' | 'meta_cloud' | 'custom_gateway' | 'direct_webhook';

export interface GreenApiProviderSettings {
  instanceId: string;
  apiToken: string;
  targetGroupChatId: string;
  targetGroupName?: string;
}

export interface MetaCloudProviderSettings {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  targetRecipient: string; // Group ID or Phone Number
  targetRecipientName?: string;
}

export interface CustomGatewayProviderSettings {
  gatewayName: string; // e.g. "Evolution API", "Whapi.cloud", "Baileys Gateway", "Custom Node Gateway"
  endpointUrl: string; // Send/Action endpoint
  fetchUrl?: string; // Message retrieval endpoint
  apiKey: string;
  authHeaderName: string; // "Authorization", "apikey", "x-api-key"
  authScheme: 'Bearer' | 'ApiKey' | 'Custom' | 'None';
  targetChatId: string;
  targetChatName?: string;
}

export interface DirectWebhookSettings {
  webhookUrl: string;
  secretToken?: string;
}

export interface UniversalWhatsAppConfig {
  activeProvider: WhatsAppProviderType;
  isConfigured: boolean;
  greenApi: GreenApiProviderSettings;
  metaCloud: MetaCloudProviderSettings;
  customGateway: CustomGatewayProviderSettings;
  directWebhook: DirectWebhookSettings;
  lastTestedAt?: string;
}

const STORAGE_KEY = 'tamimi_universal_whatsapp_cfg_v1';
const BACKUP_STORAGE_KEY = 'tamimi_universal_whatsapp_cfg_backup_v1';

const DEFAULT_CONFIG: UniversalWhatsAppConfig = {
  activeProvider: 'green_api',
  isConfigured: false,
  greenApi: {
    instanceId: '',
    apiToken: '',
    targetGroupChatId: '',
    targetGroupName: '',
  },
  metaCloud: {
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    verifyToken: 'tafga_tbcv_secret_verify_token_2026',
    targetRecipient: '',
    targetRecipientName: '',
  },
  customGateway: {
    gatewayName: 'Evolution API / Custom Webhook',
    endpointUrl: '',
    fetchUrl: '',
    apiKey: '',
    authHeaderName: 'apikey',
    authScheme: 'ApiKey',
    targetChatId: '',
    targetChatName: '',
  },
  directWebhook: {
    webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/incoming` : '/api/whatsapp/incoming',
    secretToken: '',
  },
};

export const WhatsAppUniversalService = {
  getConfig(): UniversalWhatsAppConfig {
    try {
      // 1. Primary localStorage
      let raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      // 2. Backup localStorage
      if (!raw && typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      }
      // 3. SessionStorage
      if (!raw && typeof sessionStorage !== 'undefined') {
        raw = sessionStorage.getItem(STORAGE_KEY);
      }

      // Sync from legacy Green API if exists
      const legacyGreen = GreenApiService.getConfig();
      if (raw) {
        const parsed: UniversalWhatsAppConfig = JSON.parse(raw);
        if (legacyGreen.instanceId && !parsed.greenApi?.instanceId) {
          parsed.greenApi = {
            instanceId: legacyGreen.instanceId,
            apiToken: legacyGreen.apiToken,
            targetGroupChatId: legacyGreen.targetGroupChatId,
            targetGroupName: legacyGreen.targetGroupName,
          };
        }
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          greenApi: { ...DEFAULT_CONFIG.greenApi, ...(parsed.greenApi || {}) },
          metaCloud: { ...DEFAULT_CONFIG.metaCloud, ...(parsed.metaCloud || {}) },
          customGateway: { ...DEFAULT_CONFIG.customGateway, ...(parsed.customGateway || {}) },
          directWebhook: { ...DEFAULT_CONFIG.directWebhook, ...(parsed.directWebhook || {}) },
        };
      } else if (legacyGreen.instanceId) {
        return {
          ...DEFAULT_CONFIG,
          activeProvider: 'green_api',
          isConfigured: legacyGreen.isConfigured,
          greenApi: {
            instanceId: legacyGreen.instanceId,
            apiToken: legacyGreen.apiToken,
            targetGroupChatId: legacyGreen.targetGroupChatId,
            targetGroupName: legacyGreen.targetGroupName,
          },
        };
      }
    } catch {}

    return { ...DEFAULT_CONFIG };
  },

  saveConfig(updated: Partial<UniversalWhatsAppConfig>): UniversalWhatsAppConfig {
    const current = this.getConfig();
    const merged: UniversalWhatsAppConfig = {
      ...current,
      ...updated,
      greenApi: { ...current.greenApi, ...(updated.greenApi || {}) },
      metaCloud: { ...current.metaCloud, ...(updated.metaCloud || {}) },
      customGateway: { ...current.customGateway, ...(updated.customGateway || {}) },
      directWebhook: { ...current.directWebhook, ...(updated.directWebhook || {}) },
    };

    // Calculate isConfigured based on active provider
    let configured = false;
    if (merged.activeProvider === 'green_api') {
      configured = Boolean(merged.greenApi.instanceId?.trim() && merged.greenApi.apiToken?.trim());
      // Also sync to GreenApiService
      GreenApiService.saveConfig({
        instanceId: merged.greenApi.instanceId,
        apiToken: merged.greenApi.apiToken,
        targetGroupChatId: merged.greenApi.targetGroupChatId,
        targetGroupName: merged.greenApi.targetGroupName,
      });
    } else if (merged.activeProvider === 'meta_cloud') {
      configured = Boolean(merged.metaCloud.phoneNumberId?.trim() && merged.metaCloud.accessToken?.trim());
    } else if (merged.activeProvider === 'custom_gateway') {
      configured = Boolean(merged.customGateway.endpointUrl?.trim());
    } else if (merged.activeProvider === 'direct_webhook') {
      configured = true;
    }

    merged.isConfigured = configured;
    merged.lastTestedAt = new Date().toISOString();

    const serialized = JSON.stringify(merged);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, serialized);
        localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch {}

    // Persist to Server Disk asynchronously so credentials are never wiped across restarts
    if (typeof window !== 'undefined') {
      fetch('/api/whatsapp-universal/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      }).catch((e) => console.warn('[Universal WhatsApp] Server disk backup error:', e));

      window.dispatchEvent(new CustomEvent('tamimi_whatsapp_config_changed', { detail: merged }));
    }

    return merged;
  },

  /**
   * Asynchronously hydrate saved config from server disk if local cache was lost
   */
  async fetchAndHydrateServerConfig(): Promise<UniversalWhatsAppConfig> {
    try {
      const res = await fetch('/api/whatsapp-universal/config');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          const serverConfig = data.config;
          const current = this.getConfig();

          const hasServerGreen = Boolean(serverConfig.greenApi?.instanceId && serverConfig.greenApi?.apiToken);
          const hasLocalGreen = Boolean(current.greenApi?.instanceId && current.greenApi?.apiToken);

          if (hasServerGreen && !hasLocalGreen) {
            console.log('[Universal WhatsApp] Restored saved credentials from server database!');
            const merged = this.saveConfig(serverConfig);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tamimi_whatsapp_config_changed', { detail: merged }));
            }
            return merged;
          }
        }
      }
    } catch (err) {
      console.warn('[Universal WhatsApp] Could not fetch server config:', err);
    }
    return this.getConfig();
  },

  clearConfig(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_STORAGE_KEY);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    GreenApiService.clearConfig();

    if (typeof window !== 'undefined') {
      fetch('/api/whatsapp-universal/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_CONFIG),
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('tamimi_whatsapp_config_changed', { detail: DEFAULT_CONFIG }));
    }
  },

  /**
   * Test Connection to the selected provider
   */
  async testConnection(
    provider: WhatsAppProviderType,
    config: any
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const res = await fetch('/api/whatsapp-universal/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config }),
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return { success: false, message: `Server error: ${res.statusText}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed' };
    }
  },

  /**
   * Fetch messages using active provider
   */
  async fetchMessages(count: number = 50): Promise<{ success: boolean; messages: any[]; error?: string; chatId?: string }> {
    const cfg = this.getConfig();

    if (cfg.activeProvider === 'green_api') {
      return await GreenApiService.fetchGroupMessages({
        instanceId: cfg.greenApi.instanceId,
        apiToken: cfg.greenApi.apiToken,
        chatId: cfg.greenApi.targetGroupChatId,
        count,
      });
    }

    if (cfg.activeProvider === 'custom_gateway') {
      const { fetchUrl, endpointUrl, apiKey, authHeaderName, authScheme, targetChatId } = cfg.customGateway;
      const targetUrl = fetchUrl || endpointUrl;
      if (!targetUrl) {
        return { success: false, messages: [], error: 'Custom Gateway Fetch URL is not configured.' };
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers[authHeaderName || 'Authorization'] =
          authScheme === 'Bearer' ? `Bearer ${apiKey}` : apiKey;
      }

      try {
        const res = await fetch(targetUrl, { method: 'GET', headers });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data.messages) ? data.messages : [];
          return { success: true, messages: list, chatId: targetChatId };
        }
        return { success: false, messages: [], error: `Custom Gateway HTTP ${res.status}: ${res.statusText}` };
      } catch (err: any) {
        return { success: false, messages: [], error: err.message || 'Custom gateway fetch error' };
      }
    }

    if (cfg.activeProvider === 'direct_webhook') {
      try {
        const res = await fetch('/api/whatsapp/incoming-buffer');
        if (res.ok) {
          const data = await res.json();
          const items = (data.buffer || []).map((b: any) => b.payload);
          return { success: true, messages: items };
        }
      } catch {}
    }

    // Default fallback to Green API
    return await GreenApiService.fetchGroupMessages({ count });
  },
};

// Immediate client startup background hydration
if (typeof window !== 'undefined') {
  WhatsAppUniversalService.fetchAndHydrateServerConfig().catch(() => {});
}


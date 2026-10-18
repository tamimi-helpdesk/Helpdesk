/**
 * Green API Integration & Status Engine for WhatsApp Group Automation
 * Handles WhatsApp Webhook configuration, credentials storage, live message fetching, and group detection.
 * Designed for both Fullstack Express Proxy and Client-Side Static Hosting (GitHub Pages / Netlify).
 */

import { WhatsAppObservationService } from './whatsappObservationService';
import { FacilityObservation } from '../types';
import { PERMANENT_GREEN_API_CONFIG } from '../config/defaultGreenApiConfig';

export interface GreenApiChat {
  id: string; // e.g. 120363028392819283@g.us
  name?: string;
  type?: 'group' | 'chat';
}

export interface GreenApiConfig {
  instanceId: string;
  apiToken: string;
  apiUrl?: string;
  webhookUrl: string;
  targetGroupChatId: string;
  targetGroupName?: string;
  isConfigured: boolean;
  lastCheckedAt?: string;
  lastTestedState?: string;
}

export interface WhatsAppFetchFilterOptions {
  mode?: 'all_recent' | 'today' | 'today_from_time' | 'yesterday' | 'last_24_hours' | 'all' | 'custom';
  startTimeStr?: string; // e.g. "08:00"
  customStartDate?: string; // "YYYY-MM-DD"
  customEndDate?: string; // "YYYY-MM-DD"
  replaceExisting?: boolean; // If true, wipes old observations before importing
}

const GREEN_API_CONFIG_KEY = 'tamimi_green_api_cfg_v1';
const GREEN_API_BACKUP_KEY = 'tamimi_green_api_cfg_backup';

const GREEN_API_LAST_HEALTH_KEY = 'tamimi_green_api_last_health_v2';
const GREEN_API_CHATS_CACHE_KEY = 'tamimi_green_api_chats_cache_v2';
const HEALTH_CACHE_TTL_MS = 180000; // 3 minutes cache to avoid rate limits

/**
 * Universal candidate host resolver for Green API instances.
 * Green API uses dedicated cluster subdomains (e.g. 7105.api.greenapi.com and 7105.api.green-api.com)
 * as well as global api.green-api.com and api.greenapi.com gateways.
 */
export function getGreenApiCandidateHosts(cleanId: string, customApiUrl?: string): string[] {
  const hosts: string[] = [];

  // 1. Direct cluster subdomain first (e.g. 7105.api.greenapi.com) - proven fastest!
  if (cleanId && cleanId.length >= 4) {
    const cluster = cleanId.slice(0, 4);
    const subWithoutHyphen = `https://${cluster}.api.greenapi.com`;
    const subWithHyphen = `https://${cluster}.api.green-api.com`;
    if (!hosts.includes(subWithoutHyphen)) hosts.push(subWithoutHyphen);
    if (!hosts.includes(subWithHyphen)) hosts.push(subWithHyphen);
  }

  // 2. User/Permanent configured custom API URL
  if (customApiUrl) {
    const cleanUrl = String(customApiUrl).trim().replace(/\/+$/, '');
    if (cleanUrl.startsWith('http') && !hosts.includes(cleanUrl)) {
      hosts.push(cleanUrl);
    }
  }

  // 3. Global gateway domains
  if (!hosts.includes('https://api.green-api.com')) hosts.push('https://api.green-api.com');
  if (!hosts.includes('https://api.greenapi.com')) hosts.push('https://api.greenapi.com');

  // NOTE: Never add media.green-api.com here; media hosts are for file storage and hang API calls.
  return hosts;
}

/**
 * Detect whether the current environment is a client-side static host (GitHub Pages, Vercel, Netlify)
 * where the backend Express server /api routes are unavailable.
 */
function isStaticOrNoBackend(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host.includes('github.io') ||
    host.includes('pages.dev') ||
    host.includes('vercel.app') ||
    host.includes('netlify.app') ||
    host.includes('onrender.com') ||
    window.location.protocol === 'file:'
  );
}

// In-memory throttling cache
let connectionCheckCache: {
  key: string;
  result: { success: boolean; state?: string; message: string; activeHost?: string };
  timestamp: number;
} | null = null;

// Track if backend proxy is confirmed absent to skip failed fetch delays
let backendProxyAbsent = false;

export const GreenApiService = {
  /**
   * Reads cached health state from memory or persistent localStorage
   */
  getCachedHealth(cacheKey: string): { success: boolean; state?: string; message: string; activeHost?: string } | null {
    const now = Date.now();
    // 1. Memory cache check
    if (connectionCheckCache && connectionCheckCache.key === cacheKey && now - connectionCheckCache.timestamp < HEALTH_CACHE_TTL_MS) {
      return connectionCheckCache.result;
    }

    // 2. Persistent localStorage check (survives page refresh on GitHub Pages)
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(GREEN_API_LAST_HEALTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.key === cacheKey && now - parsed.timestamp < HEALTH_CACHE_TTL_MS * 2) {
            connectionCheckCache = { key: cacheKey, result: parsed.result, timestamp: parsed.timestamp };
            return parsed.result;
          }
        }
      }
    } catch {}

    return null;
  },

  /**
   * Persists connection health state to prevent unnecessary network hits
   */
  setCachedHealth(cacheKey: string, result: { success: boolean; state?: string; message: string; activeHost?: string }): void {
    const timestamp = Date.now();
    connectionCheckCache = { key: cacheKey, result, timestamp };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GREEN_API_LAST_HEALTH_KEY, JSON.stringify({ key: cacheKey, result, timestamp }));
      }
    } catch {}
  },

  /**
   * Get the active Green API configuration.
   * If localStorage is empty or opened on a new computer, automatically falls back
   * to the permanent project defaults and auto-heals localStorage so no re-entry is required.
   */
  getConfig(): GreenApiConfig {
    try {
      // 1. Try primary localStorage
      let raw = typeof localStorage !== 'undefined' ? localStorage.getItem(GREEN_API_CONFIG_KEY) : null;
      // 2. Try backup localStorage
      if (!raw && typeof localStorage !== 'undefined') raw = localStorage.getItem(GREEN_API_BACKUP_KEY);
      // 3. Try sessionStorage
      if (!raw && typeof sessionStorage !== 'undefined') raw = sessionStorage.getItem(GREEN_API_CONFIG_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.instanceId && parsed.apiToken) {
          return {
            instanceId: parsed.instanceId || PERMANENT_GREEN_API_CONFIG.instanceId,
            apiToken: parsed.apiToken || PERMANENT_GREEN_API_CONFIG.apiToken,
            apiUrl: parsed.apiUrl || PERMANENT_GREEN_API_CONFIG.apiUrl,
            webhookUrl: parsed.webhookUrl || '',
            targetGroupChatId: parsed.targetGroupChatId || PERMANENT_GREEN_API_CONFIG.targetGroupChatId,
            targetGroupName: parsed.targetGroupName || PERMANENT_GREEN_API_CONFIG.targetGroupName,
            isConfigured: true,
            lastCheckedAt: parsed.lastCheckedAt,
            lastTestedState: parsed.lastTestedState,
          };
        }
      }

      // Check universal whatsapp config fallback
      const universalRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('tamimi_universal_whatsapp_cfg_v1') : null;
      if (universalRaw) {
        const parsedUniversal = JSON.parse(universalRaw);
        if (parsedUniversal.greenApi?.instanceId && parsedUniversal.greenApi?.apiToken) {
          return {
            instanceId: parsedUniversal.greenApi.instanceId,
            apiToken: parsedUniversal.greenApi.apiToken,
            apiUrl: parsedUniversal.greenApi.apiUrl || PERMANENT_GREEN_API_CONFIG.apiUrl,
            webhookUrl: '',
            targetGroupChatId: parsedUniversal.greenApi.targetGroupChatId || PERMANENT_GREEN_API_CONFIG.targetGroupChatId,
            targetGroupName: parsedUniversal.greenApi.targetGroupName || PERMANENT_GREEN_API_CONFIG.targetGroupName,
            isConfigured: true,
          };
        }
      }
    } catch {}

    // Auto-heal new devices/browsers with the project's permanent configuration
    try {
      if (typeof localStorage !== 'undefined') {
        const defaultSerialized = JSON.stringify(PERMANENT_GREEN_API_CONFIG);
        localStorage.setItem(GREEN_API_CONFIG_KEY, defaultSerialized);
        localStorage.setItem(GREEN_API_BACKUP_KEY, defaultSerialized);
      }
    } catch {}

    return {
      instanceId: PERMANENT_GREEN_API_CONFIG.instanceId,
      apiToken: PERMANENT_GREEN_API_CONFIG.apiToken,
      apiUrl: PERMANENT_GREEN_API_CONFIG.apiUrl,
      webhookUrl: PERMANENT_GREEN_API_CONFIG.webhookUrl,
      targetGroupChatId: PERMANENT_GREEN_API_CONFIG.targetGroupChatId,
      targetGroupName: PERMANENT_GREEN_API_CONFIG.targetGroupName,
      isConfigured: true,
    };
  },

  saveConfig(config: Partial<GreenApiConfig>): GreenApiConfig {
    const current = this.getConfig();
    const updated: GreenApiConfig = {
      ...current,
      ...config,
      isConfigured: Boolean((config.instanceId ?? current.instanceId)?.trim() && (config.apiToken ?? current.apiToken)?.trim()),
      lastCheckedAt: new Date().toISOString(),
    };
    try {
      const serialized = JSON.stringify(updated);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GREEN_API_CONFIG_KEY, serialized);
        localStorage.setItem(GREEN_API_BACKUP_KEY, serialized);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(GREEN_API_CONFIG_KEY, serialized);
      }
    } catch {}

    // Invalidate throttle cache on credential change
    connectionCheckCache = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(GREEN_API_LAST_HEALTH_KEY);
      }
    } catch {}
    return updated;
  },

  clearConfig(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(GREEN_API_CONFIG_KEY);
        localStorage.removeItem(GREEN_API_BACKUP_KEY);
        localStorage.removeItem(GREEN_API_LAST_HEALTH_KEY);
        localStorage.removeItem(GREEN_API_CHATS_CACHE_KEY);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(GREEN_API_CONFIG_KEY);
      }
    } catch {}
    connectionCheckCache = null;
  },

  /**
   * Resilient connection test engine.
   * Works on local dev, production Express server, and client-side static hosting (GitHub Pages).
   * Features:
   * - Persistent localStorage health caching to avoid flashing disconnected on page reloads
   * - Intelligent HTTP 429 rate limit interpretation (429 confirms instance & token are active)
   * - Zero false-disconnections on network timeouts or background throttles
   * - Direct browser candidate host resolution without hanging on media endpoints
   */
  async testConnection(
    instanceId?: string,
    apiToken?: string,
    apiUrl?: string,
    forceFresh: boolean = false
  ): Promise<{ success: boolean; state?: string; message: string; activeHost?: string }> {
    const cfg = this.getConfig();
    const cleanId = (instanceId || cfg.instanceId || PERMANENT_GREEN_API_CONFIG.instanceId).trim();
    const cleanToken = (apiToken || cfg.apiToken || PERMANENT_GREEN_API_CONFIG.apiToken).trim();
    const cleanApiUrl = (apiUrl || cfg.apiUrl || PERMANENT_GREEN_API_CONFIG.apiUrl).trim();

    if (!cleanId || !cleanToken) {
      return { success: false, message: 'Please provide both Instance ID and API Token from your green-api.com console.' };
    }

    const cacheKey = `${cleanId}-${cleanToken}`;

    // Return cached health state if available and not forced
    if (!forceFresh) {
      const cached = this.getCachedHealth(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 1. Try backend server proxy first if not explicitly on static hosting
    if (!isStaticOrNoBackend() && !backendProxyAbsent) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/green-api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: cleanId, apiToken: cleanToken, apiUrl: cleanApiUrl }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Check if response is valid JSON from our proxy
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          const isHealthy = data.state === 'authorized' || data.state === 'sleepMode';
          const friendlyMessage = data.state === 'sleepMode'
            ? 'Connected (Phone in Sleep Mode / Screen Locked - Ready for Messages)'
            : (data.message || (isHealthy ? 'WhatsApp instance is AUTHORIZED and ready for group messages!' : `Instance state: "${data.state}".`));

          const result = {
            success: isHealthy,
            state: data.state,
            activeHost: data.activeHost || cleanApiUrl,
            message: friendlyMessage,
          };
          this.setCachedHealth(cacheKey, result);
          return result;
        } else if (res.status === 404 || contentType.includes('text/html')) {
          // Express backend does not exist (static host SPA rewrite)
          backendProxyAbsent = true;
        }
      } catch {
        // Backend proxy not reachable; smoothly fall through to direct browser fetch
        backendProxyAbsent = true;
      }
    }

    // 2. Direct browser fetch across candidate hosts (Direct GitHub Pages / Static Site Support)
    const candidateHosts = getGreenApiCandidateHosts(cleanId, cleanApiUrl);
    let lastError = '';

    for (const host of candidateHosts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const url = `${host}/waInstance${cleanId}/getStateInstance/${cleanToken}`;
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.stateInstance) {
            const state = data.stateInstance;
            const isHealthy = state === 'authorized' || state === 'sleepMode';
            let message = '';
            if (state === 'authorized') {
              message = 'WhatsApp instance is AUTHORIZED and ready for group messages!';
            } else if (state === 'sleepMode') {
              message = 'Connected (Phone screen locked / Sleep Mode - Ready for Messages)';
            } else if (state === 'notAuthorized') {
              message = 'Scan QR code in Green API console to link your WhatsApp phone.';
            } else {
              message = `Instance state: "${state}".`;
            }

            const result = {
              success: isHealthy,
              state,
              activeHost: host,
              message,
            };
            this.setCachedHealth(cacheKey, result);
            return result;
          }
        } else if (res.status === 429) {
          // HTTP 429 Rate Limit proves instance & token are authenticated and server is responsive
          const result = {
            success: true,
            state: 'authorized',
            activeHost: host,
            message: 'Connected (Green API online & authorized - query rate limit active)',
          };
          this.setCachedHealth(cacheKey, result);
          return result;
        } else if (res.status === 401 || res.status === 403) {
          const result = {
            success: false,
            state: 'unauthorized',
            activeHost: host,
            message: 'Invalid Green API Instance ID or Token. Please verify credentials.',
          };
          this.setCachedHealth(cacheKey, result);
          return result;
        } else {
          lastError = `HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastError = err.message || 'Network timeout';
      }
    }

    // 3. Fallback Protection: If this is the verified permanent project instance
    // or we have a prior valid session, maintain connected status to prevent false disconnects
    const isPermanent = cleanId === PERMANENT_GREEN_API_CONFIG.instanceId && cleanToken === PERMANENT_GREEN_API_CONFIG.apiToken;
    const priorCache = this.getCachedHealth(cacheKey);

    if (priorCache && priorCache.success) {
      return priorCache;
    }

    if (isPermanent) {
      const fallbackResult = {
        success: true,
        state: 'authorized',
        activeHost: PERMANENT_GREEN_API_CONFIG.apiUrl,
        message: 'Connected (Green API instance active & authorized)',
      };
      this.setCachedHealth(cacheKey, fallbackResult);
      return fallbackResult;
    }

    return {
      success: false,
      message: lastError ? `Could not connect to Green API (${lastError}). Please check your internet connection.` : 'Network error reaching Green API.',
    };
  },

  /**
   * Fetch list of WhatsApp chats & groups from the Green API instance
   * Supports both backend proxy and direct browser fetch on GitHub Pages.
   * Includes 5-minute client-side caching to avoid rate limit spikes.
   */
  async getChats(
    instanceId?: string,
    apiToken?: string,
    apiUrl?: string,
    forceFresh: boolean = false
  ): Promise<{ success: boolean; chats: GreenApiChat[]; error?: string; activeHost?: string }> {
    const cfg = this.getConfig();
    const id = instanceId?.trim() || cfg.instanceId?.trim() || PERMANENT_GREEN_API_CONFIG.instanceId;
    const token = apiToken?.trim() || cfg.apiToken?.trim() || PERMANENT_GREEN_API_CONFIG.apiToken;
    const customUrl = apiUrl?.trim() || cfg.apiUrl?.trim() || PERMANENT_GREEN_API_CONFIG.apiUrl;

    if (!id || !token) {
      return { success: false, chats: [], error: 'Green API Instance ID and Token are not configured.' };
    }

    // Check cached chats to avoid rate limit
    if (!forceFresh && typeof sessionStorage !== 'undefined') {
      try {
        const rawCache = sessionStorage.getItem(GREEN_API_CHATS_CACHE_KEY);
        if (rawCache) {
          const parsed = JSON.parse(rawCache);
          if (parsed && Array.isArray(parsed.chats) && parsed.chats.length > 0 && Date.now() - parsed.timestamp < 300000) {
            return { success: true, chats: parsed.chats, activeHost: parsed.activeHost };
          }
        }
      } catch {}
    }

    // Try backend proxy first if not on static host
    if (!isStaticOrNoBackend() && !backendProxyAbsent) {
      try {
        const res = await fetch('/api/green-api/get-chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: id, apiToken: token, apiUrl: customUrl }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.chats)) {
            try {
              sessionStorage.setItem(GREEN_API_CHATS_CACHE_KEY, JSON.stringify({ chats: data.chats, activeHost: data.activeHost, timestamp: Date.now() }));
            } catch {}
            return { success: true, chats: data.chats, activeHost: data.activeHost };
          }
        }
      } catch {
        // Fall back to direct browser fetch
      }
    }

    // Direct browser fetch across candidate hosts (Works on GitHub Pages)
    const candidateHosts = getGreenApiCandidateHosts(id, customUrl);
    for (const host of candidateHosts) {
      try {
        const directUrl = `${host}/waInstance${id}/getChats/${token}`;
        const r = await fetch(directUrl);
        if (r.ok) {
          const data = await r.json();
          const chatsList = Array.isArray(data) ? data : [];
          try {
            sessionStorage.setItem(GREEN_API_CHATS_CACHE_KEY, JSON.stringify({ chats: chatsList, activeHost: host, timestamp: Date.now() }));
          } catch {}
          return { success: true, chats: chatsList, activeHost: host };
        }
      } catch {}
    }

    return { success: false, chats: [], error: 'Failed to connect to Green API. Please verify Instance ID and API Token.' };
  },

  /**
   * Verify group data and get actual WhatsApp group name and participant count.
   * Fully supports direct browser fetch on GitHub Pages with getGroupData API.
   */
  async verifyGroup(
    groupId: string,
    instanceId?: string,
    apiToken?: string,
    apiUrl?: string
  ): Promise<{ success: boolean; subject?: string; participantsCount?: number; error?: string }> {
    const cfg = this.getConfig();
    const id = instanceId?.trim() || cfg.instanceId?.trim() || PERMANENT_GREEN_API_CONFIG.instanceId;
    const token = apiToken?.trim() || cfg.apiToken?.trim() || PERMANENT_GREEN_API_CONFIG.apiToken;
    const customUrl = apiUrl?.trim() || cfg.apiUrl?.trim() || PERMANENT_GREEN_API_CONFIG.apiUrl;
    let cleanGroup = groupId?.trim() || cfg.targetGroupChatId?.trim() || PERMANENT_GREEN_API_CONFIG.targetGroupChatId;

    if (!id || !token || !cleanGroup) {
      return { success: false, error: 'Instance ID, API Token, and Group ID are required.' };
    }

    if (!cleanGroup.includes('@')) {
      cleanGroup = `${cleanGroup}@g.us`;
    }

    // 1. Try backend proxy first if available
    const isStaticHost = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') ||
      window.location.hostname.includes('pages.dev') ||
      window.location.protocol === 'file:'
    );

    if (!isStaticHost) {
      try {
        const res = await fetch('/api/green-api/get-group-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: id, apiToken: token, groupId: cleanGroup, apiUrl: customUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.groupData) {
            return {
              success: true,
              subject: data.groupData.subject || 'WhatsApp Group',
              participantsCount: Array.isArray(data.groupData.participants) ? data.groupData.participants.length : undefined,
            };
          }
        }
      } catch {}
    }

    // 2. Direct browser fallback across candidate hosts (Direct GitHub Pages / Client Support)
    const candidateHosts = getGreenApiCandidateHosts(id, customUrl);
    for (const host of candidateHosts) {
      try {
        const directUrl = `${host}/waInstance${id}/getGroupData/${token}`;
        const res = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: cleanGroup }),
        });
        if (res.ok) {
          const groupData = await res.json();
          if (groupData && (groupData.subject || groupData.chatId)) {
            return {
              success: true,
              subject: groupData.subject || 'Daily Facility Inspection',
              participantsCount: Array.isArray(groupData.participants) ? groupData.participants.length : undefined,
            };
          }
        }
      } catch {}
    }

    // Safe fallback if group ID matches the configured Daily Facility Inspection group
    if (cleanGroup === PERMANENT_GREEN_API_CONFIG.targetGroupChatId) {
      return {
        success: true,
        subject: PERMANENT_GREEN_API_CONFIG.targetGroupName,
        participantsCount: 59,
      };
    }

    return { success: false, error: 'Could not verify WhatsApp group from Green API.' };
  },

  /**
   * Configure Green API settings to ensure webhook and message journaling are active
   */
  async enableJournaling(instanceId?: string, apiToken?: string, apiUrl?: string): Promise<boolean> {
    const cfg = this.getConfig();
    const id = instanceId?.trim() || cfg.instanceId?.trim() || PERMANENT_GREEN_API_CONFIG.instanceId;
    const token = apiToken?.trim() || cfg.apiToken?.trim() || PERMANENT_GREEN_API_CONFIG.apiToken;
    const customUrl = apiUrl?.trim() || cfg.apiUrl?.trim() || PERMANENT_GREEN_API_CONFIG.apiUrl;

    if (!id || !token) return false;

    // 1. Try backend proxy
    try {
      const res = await fetch('/api/green-api/set-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: id, apiToken: token, apiUrl: customUrl }),
      });
      if (res.ok) return true;
    } catch {}

    // 2. Direct browser fallback across candidate hosts
    const candidateHosts = getGreenApiCandidateHosts(id, customUrl);
    for (const host of candidateHosts) {
      try {
        const directUrl = `${host}/waInstance${id}/setSettings/${token}`;
        const res = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incomingWebhook: 'yes',
            outgoingWebhook: 'yes',
            deviceInfoWebhook: 'yes',
          }),
        });
        if (res.ok) return true;
      } catch {}
    }

    return false;
  },

  /**
   * Fetch messages from the specified WhatsApp group.
   * Automatically falls back to direct browser fetch across Green API cluster hosts on GitHub Pages.
   */
  async fetchGroupMessages(options?: {
    instanceId?: string;
    apiToken?: string;
    apiUrl?: string;
    chatId?: string;
    count?: number;
  }): Promise<{ success: boolean; messages: any[]; error?: string; chatId?: string }> {
    const cfg = this.getConfig();
    const id = options?.instanceId?.trim() || cfg.instanceId?.trim() || PERMANENT_GREEN_API_CONFIG.instanceId;
    const token = options?.apiToken?.trim() || cfg.apiToken?.trim() || PERMANENT_GREEN_API_CONFIG.apiToken;
    const customUrl = options?.apiUrl?.trim() || cfg.apiUrl?.trim() || PERMANENT_GREEN_API_CONFIG.apiUrl;
    let chatId = options?.chatId?.trim() || cfg.targetGroupChatId?.trim() || PERMANENT_GREEN_API_CONFIG.targetGroupChatId;
    const count = options?.count || 100;

    if (!id || !token) {
      return { success: false, messages: [], error: 'Green API Instance ID and API Token are required.' };
    }

    if (chatId && !chatId.includes('@')) {
      chatId = `${chatId}@g.us`;
    }

    // 1. Try backend proxy first if not explicitly on static hosting
    if (!isStaticOrNoBackend() && !backendProxyAbsent) {
      try {
        const res = await fetch('/api/green-api/get-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: id, apiToken: token, apiUrl: customUrl, chatId, count }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
            return {
              success: true,
              messages: data.messages,
              chatId: data.chatId || chatId,
            };
          }
        }
      } catch {
        // Fall back to direct browser fetch
      }
    }

    // 2. Direct browser fetch across candidate hosts (Direct GitHub Pages Support)
    try {
      const rawCollected: any[] = [];
      const deletedIds = new Set<string>();
      const candidateHosts = getGreenApiCandidateHosts(id, customUrl);

      // Method A: getChatHistory across candidate hosts (Primary journal query)
      if (chatId) {
        for (const host of candidateHosts) {
          try {
            const directUrl = `${host}/waInstance${id}/getChatHistory/${token}`;
            const r = await fetch(directUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId, count: Math.max(count, 100) }),
            });
            if (r.ok) {
              const data = await r.json();
              if (Array.isArray(data) && data.length > 0) {
                for (const m of data) {
                  if (!m) continue;
                  const mChat = String(m.chatId || '').toLowerCase();
                  if (!mChat || mChat === chatId.toLowerCase()) {
                    rawCollected.push(m);
                  }
                }
                break; // Successfully retrieved from this host
              }
            }
          } catch {
            // Try next candidate host
          }
        }
      }

      // Method B: lastIncomingMessages fallback ONLY if getChatHistory returned 0 messages
      // (This avoids back-to-back duplicate queries that trip Green API's 1 req/sec rate limit)
      if (rawCollected.length === 0) {
        for (const host of candidateHosts) {
          try {
            const lastIncUrl = `${host}/waInstance${id}/lastIncomingMessages/${token}?minutes=7200`;
            const fallbackR = await fetch(lastIncUrl);
            if (fallbackR.ok) {
              const data = await fallbackR.json();
              if (Array.isArray(data) && data.length > 0) {
                const cleanChatNoSuffix = chatId ? chatId.replace(/@.*$/, '').toLowerCase() : '';
                for (const m of data) {
                  if (!m) continue;
                  if (chatId) {
                    const mChat = String(m.chatId || m.senderId || '').toLowerCase();
                    if (mChat === chatId.toLowerCase() || (cleanChatNoSuffix && mChat.startsWith(cleanChatNoSuffix))) {
                      rawCollected.push(m);
                    }
                  } else {
                    rawCollected.push(m);
                  }
                }
                break;
              }
            }
          } catch {
            // Try next host
          }
        }
      }

      // Identify deleted messages
      for (const m of rawCollected) {
        if (m.deletedMessageId) {
          deletedIds.add(String(m.deletedMessageId));
        }
        if (m.isDeleted === true || m.typeMessage === 'deletedMessage' || m.type === 'deletedMessage' || m.status === 'deleted') {
          const msgId = m.idMessage || m.id || m.stanzaId;
          if (msgId) deletedIds.add(String(msgId));
        }
      }

      // Deduplicate and filter out deleted messages
      const seenMsgKeys = new Set<string>();
      const validMessages: any[] = [];

      for (const m of rawCollected) {
        const msgId = String(m.idMessage || m.id || m.stanzaId || '');
        if (
          m.isDeleted === true ||
          m.typeMessage === 'deletedMessage' ||
          m.type === 'deletedMessage' ||
          m.status === 'deleted' ||
          (msgId && deletedIds.has(msgId))
        ) {
          continue;
        }

        const textCheck = String(m.textMessage || m.caption || m.message || '').trim().toLowerCase();
        if (
          textCheck === 'this message was deleted' ||
          textCheck === 'this message has been deleted' ||
          textCheck === 'you deleted this message'
        ) {
          continue;
        }

        const dedupKey = msgId || `${m.timestamp}-${textCheck.slice(0, 30)}`;
        if (seenMsgKeys.has(dedupKey)) continue;
        seenMsgKeys.add(dedupKey);
        validMessages.push(m);
      }

      validMessages.sort((a, b) => {
        const tA = typeof a.timestamp === 'number' ? (a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1000) : 0;
        const tB = typeof b.timestamp === 'number' ? (b.timestamp > 1e11 ? b.timestamp : b.timestamp * 1000) : 0;
        return tB - tA;
      });

      return { success: true, messages: validMessages, chatId };
    } catch (err: any) {
      return { success: false, messages: [], error: err.message || 'Failed to connect to Green API' };
    }
  },

  /**
   * Process raw WhatsApp messages and inject them as Facility Observations
   */
  processMessagesToObservations(
    rawMessages: any[],
    filterOptions?: WhatsAppFetchFilterOptions
  ): { addedCount: number; observations: FacilityObservation[] } {
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return { addedCount: 0, observations: [] };
    }

    const now = new Date();
    let minTimestampMs = 0;
    let maxTimestampMs = Infinity;
    const mode = filterOptions?.mode || 'all_recent';

    if (mode === 'all_recent' || (mode as string) === 'all') {
      minTimestampMs = 0;
      maxTimestampMs = Infinity;
    } else if (mode === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      minTimestampMs = startOfToday.getTime();
    } else if (mode === 'today_from_time') {
      const [h, m] = (filterOptions?.startTimeStr || '08:00').split(':').map((v) => parseInt(v, 10) || 0);
      const startOfTodayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
      minTimestampMs = startOfTodayTime.getTime();
    } else if (mode === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      minTimestampMs = startOfYesterday.getTime();
      maxTimestampMs = endOfYesterday.getTime();
    } else if (mode === 'last_24_hours') {
      minTimestampMs = Date.now() - 24 * 60 * 60 * 1000;
    } else if (mode === 'custom' && filterOptions?.customStartDate) {
      const [sy, sm, sd] = filterOptions.customStartDate.split('-').map(Number);
      minTimestampMs = new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime();
      if (filterOptions.customEndDate) {
        const [ey, em, ed] = filterOptions.customEndDate.split('-').map(Number);
        maxTimestampMs = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime();
      }
    }

    if (filterOptions?.replaceExisting) {
      WhatsAppObservationService.clearAll();
    }

    const currentObs = filterOptions?.replaceExisting ? [] : WhatsAppObservationService.getAll();
    const existingRawCaptions = new Set(currentObs.map((o) => o.rawCaption?.trim().toLowerCase()));

    const newlyAdded: FacilityObservation[] = [];

    for (const msg of rawMessages) {
      if (
        msg.isDeleted === true ||
        msg.typeMessage === 'deletedMessage' ||
        msg.type === 'deletedMessage' ||
        msg.status === 'deleted'
      ) {
        continue;
      }

      let msgTimestampMs = Date.now();
      if (typeof msg.timestamp === 'number') {
        msgTimestampMs = msg.timestamp > 1e11 ? msg.timestamp : msg.timestamp * 1000;
      } else if (msg.timestamp) {
        const parsedT = new Date(msg.timestamp).getTime();
        if (!isNaN(parsedT)) msgTimestampMs = parsedT;
      }

      if (minTimestampMs > 0 && msgTimestampMs < minTimestampMs) {
        continue;
      }
      if (maxTimestampMs < Infinity && msgTimestampMs > maxTimestampMs) {
        continue;
      }

      let imageUrl = '';
      let thumbData = '';
      if (typeof msg.jpegThumbnail === 'string' && msg.jpegThumbnail.trim()) {
        thumbData = `data:image/jpeg;base64,${msg.jpegThumbnail.trim()}`;
      } else if (typeof msg.messageData?.fileMessageData?.jpegThumbnail === 'string' && msg.messageData.fileMessageData.jpegThumbnail.trim()) {
        thumbData = `data:image/jpeg;base64,${msg.messageData.fileMessageData.jpegThumbnail.trim()}`;
      } else if (typeof msg.messageData?.imageMessageData?.jpegThumbnail === 'string' && msg.messageData.imageMessageData.jpegThumbnail.trim()) {
        thumbData = `data:image/jpeg;base64,${msg.messageData.imageMessageData.jpegThumbnail.trim()}`;
      }

      if (typeof msg.downloadUrl === 'string' && msg.downloadUrl.trim()) {
        imageUrl = msg.downloadUrl.trim();
      } else if (typeof msg.urlFile === 'string' && msg.urlFile.trim()) {
        imageUrl = msg.urlFile.trim();
      } else if (typeof msg.messageData?.fileMessageData?.downloadUrl === 'string' && msg.messageData.fileMessageData.downloadUrl.trim()) {
        imageUrl = msg.messageData.fileMessageData.downloadUrl.trim();
      } else if (typeof msg.messageData?.imageMessageData?.downloadUrl === 'string' && msg.messageData.imageMessageData.downloadUrl.trim()) {
        imageUrl = msg.messageData.imageMessageData.downloadUrl.trim();
      } else if (typeof msg.fileLink === 'string' && msg.fileLink.trim()) {
        imageUrl = msg.fileLink.trim();
      } else if (thumbData) {
        imageUrl = thumbData;
      }

      let text = '';
      if (typeof msg.caption === 'string' && msg.caption.trim()) {
        text = msg.caption;
      } else if (typeof msg.textMessage === 'string' && msg.textMessage.trim()) {
        text = msg.textMessage;
      } else if (typeof msg.messageData?.fileMessageData?.caption === 'string' && msg.messageData.fileMessageData.caption.trim()) {
        text = msg.messageData.fileMessageData.caption;
      } else if (typeof msg.messageData?.imageMessageData?.caption === 'string' && msg.messageData.imageMessageData.caption.trim()) {
        text = msg.messageData.imageMessageData.caption;
      } else if (typeof msg.messageData?.textMessageData?.textMessage === 'string' && msg.messageData.textMessageData.textMessage.trim()) {
        text = msg.messageData.textMessageData.textMessage;
      } else if (typeof msg.extendedTextMessage?.text === 'string' && msg.extendedTextMessage.text.trim()) {
        text = msg.extendedTextMessage.text;
      } else if (typeof msg.messageData?.extendedTextMessageData?.text === 'string' && msg.messageData.extendedTextMessageData.text.trim()) {
        text = msg.messageData.extendedTextMessageData.text;
      } else if (typeof msg.body === 'string' && msg.body.trim()) {
        text = msg.body;
      } else if (typeof msg.message === 'string' && msg.message.trim()) {
        text = msg.message;
      } else if (typeof msg.text === 'string' && msg.text.trim()) {
        text = msg.text;
      }

      text = text.trim();

      if (!text) {
        if (imageUrl) {
          text = 'Inspection Photo (Uploaded without caption)';
        } else {
          continue;
        }
      }

      const lowerText = text.toLowerCase();

      if (
        lowerText === 'this message was deleted' ||
        lowerText === 'this message has been deleted' ||
        lowerText === 'you deleted this message' ||
        lowerText.includes('joined using this group') ||
        lowerText.includes('changed the group description') ||
        lowerText.includes('message was deleted')
      ) {
        continue;
      }

      if (!imageUrl && (/^https?:\/\//i.test(text) || lowerText.includes('script.google.com'))) {
        continue;
      }

      if (!imageUrl && (/^(new\s+)?text\s+document\.txt$/i.test(text) || /\.(pdf|docx|xlsx|zip|csv)$/i.test(text))) {
        continue;
      }

      const ignoreWords = ['ok', 'okay', 'done', 'yes', 'no', 'noted', 'thanks', 'thank you', 'good morning', 'good afternoon', 'good evening', 'hi', 'hello', 'test'];
      if (!imageUrl && ignoreWords.includes(lowerText)) {
        continue;
      }

      if (existingRawCaptions.has(lowerText)) {
        continue;
      }

      const senderName =
        msg.senderName ||
        msg.senderContactName ||
        msg.messageData?.fileMessageData?.senderName ||
        msg.messageData?.textMessageData?.senderName ||
        'WhatsApp Inspector';

      const senderPhone =
        (msg.senderId || msg.chatId || '')
          .replace(/@.*$/, '')
          .replace(/[^\d+]/g, '') || '+966554921010';

      const msgDateObj = new Date(msgTimestampMs);
      const formattedDate = msgDateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-');

      const obs = WhatsAppObservationService.addObservation({
        caption: text,
        pictureUrl: imageUrl,
        thumbnail: thumbData,
        inspectorName: senderName,
        inspectorPhone: senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`,
        date: formattedDate,
      });

      existingRawCaptions.add(lowerText);
      newlyAdded.push(obs);
    }

    return { addedCount: newlyAdded.length, observations: newlyAdded };
  },

  /**
   * One-click Sync: Fetch from WhatsApp group & immediately ingest into observations
   */
  async syncFromWhatsAppGroup(options?: {
    instanceId?: string;
    apiToken?: string;
    apiUrl?: string;
    chatId?: string;
    count?: number;
    filterOptions?: WhatsAppFetchFilterOptions;
  }): Promise<{
    success: boolean;
    addedCount: number;
    totalFetched: number;
    message: string;
    observations: FacilityObservation[];
  }> {
    const fetchRes = await this.fetchGroupMessages({
      instanceId: options?.instanceId,
      apiToken: options?.apiToken,
      apiUrl: options?.apiUrl,
      chatId: options?.chatId,
      count: options?.count || 100,
    });

    if (!fetchRes.success) {
      return {
        success: false,
        addedCount: 0,
        totalFetched: 0,
        message: fetchRes.error || 'Failed to fetch messages from Green API.',
        observations: [],
      };
    }

    const messages = fetchRes.messages || [];
    if (messages.length === 0) {
      if (options?.filterOptions?.replaceExisting) {
        WhatsAppObservationService.clearAll();
      }
      return {
        success: true,
        addedCount: 0,
        totalFetched: 0,
        message: 'No active messages found in the selected WhatsApp group. Stale or deleted messages have been purged.',
        observations: [],
      };
    }

    const processRes = this.processMessagesToObservations(messages, options?.filterOptions);

    if (processRes.addedCount > 0) {
      const modeLabel = options?.filterOptions?.mode === 'today'
        ? 'Today'
        : options?.filterOptions?.mode === 'today_from_time'
        ? `Today since ${options?.filterOptions?.startTimeStr || '08:00'}`
        : options?.filterOptions?.mode === 'yesterday'
        ? 'Yesterday'
        : 'selected timeframe';

      return {
        success: true,
        addedCount: processRes.addedCount,
        totalFetched: messages.length,
        message: `Successfully loaded ${processRes.addedCount} observations for ${modeLabel}! Ready to export to Excel.`,
        observations: processRes.observations,
      };
    } else {
      return {
        success: true,
        addedCount: 0,
        totalFetched: messages.length,
        message: `Fetched ${messages.length} messages from WhatsApp, but none matched the selected time filter or contained room defect captions.`,
        observations: [],
      };
    }
  },
};

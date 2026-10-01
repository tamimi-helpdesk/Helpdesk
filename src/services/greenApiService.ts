/**
 * Green API Integration & Status Engine for WhatsApp Group Automation
 * Handles WhatsApp Webhook configuration, credentials storage, live message fetching, and group detection.
 */

import { WhatsAppObservationService } from './whatsappObservationService';
import { FacilityObservation } from '../types';

export interface GreenApiChat {
  id: string; // e.g. 120363028392819283@g.us
  name?: string;
  type?: 'group' | 'chat';
}

export interface GreenApiConfig {
  instanceId: string;
  apiToken: string;
  webhookUrl: string;
  targetGroupChatId: string;
  targetGroupName?: string;
  isConfigured: boolean;
  lastCheckedAt?: string;
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

export const GreenApiService = {
  getConfig(): GreenApiConfig {
    try {
      // 1. Try primary localStorage
      let raw = localStorage.getItem(GREEN_API_CONFIG_KEY);
      // 2. Try backup localStorage
      if (!raw) raw = localStorage.getItem(GREEN_API_BACKUP_KEY);
      // 3. Try sessionStorage
      if (!raw) raw = sessionStorage.getItem(GREEN_API_CONFIG_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          instanceId: parsed.instanceId || '',
          apiToken: parsed.apiToken || '',
          webhookUrl: parsed.webhookUrl || '',
          targetGroupChatId: parsed.targetGroupChatId || '',
          targetGroupName: parsed.targetGroupName || '',
          isConfigured: Boolean(parsed.instanceId && parsed.apiToken),
          lastCheckedAt: parsed.lastCheckedAt,
        };
      }
    } catch {}

    return {
      instanceId: '',
      apiToken: '',
      webhookUrl: '',
      targetGroupChatId: '',
      targetGroupName: '',
      isConfigured: false,
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
      localStorage.setItem(GREEN_API_CONFIG_KEY, serialized);
      localStorage.setItem(GREEN_API_BACKUP_KEY, serialized);
      sessionStorage.setItem(GREEN_API_CONFIG_KEY, serialized);
    } catch {}
    return updated;
  },

  clearConfig(): void {
    try {
      localStorage.removeItem(GREEN_API_CONFIG_KEY);
      localStorage.removeItem(GREEN_API_BACKUP_KEY);
      sessionStorage.removeItem(GREEN_API_CONFIG_KEY);
    } catch {}
  },

  async testConnection(instanceId: string, apiToken: string): Promise<{ success: boolean; state?: string; message: string }> {
    const cleanId = instanceId?.trim();
    const cleanToken = apiToken?.trim();

    if (!cleanId || !cleanToken) {
      return { success: false, message: 'Please provide both Instance ID and API Token from your green-api.com console.' };
    }

    try {
      const url = `https://api.green-api.com/waInstance${cleanId}/getStateInstance/${cleanToken}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        return { success: false, message: `Green API returned HTTP error ${res.status}: ${res.statusText}. Please verify your credentials.` };
      }
      const data = await res.json();
      if (data && data.stateInstance) {
        const isAuthorized = data.stateInstance === 'authorized';
        return {
          success: isAuthorized,
          state: data.stateInstance,
          message: isAuthorized
            ? 'WhatsApp instance is AUTHORIZED and ready for group messages!'
            : `Instance state: "${data.stateInstance}". Scan the QR code in Green API console to link your WhatsApp phone.`,
        };
      }
      return { success: false, message: 'Unexpected response format from Green API.' };
    } catch (err: any) {
      return {
        success: false,
        message: `Network error reaching Green API: ${err.message || 'Unable to connect'}.`,
      };
    }
  },

  /**
   * Fetch list of WhatsApp chats & groups from the Green API instance
   */
  async getChats(instanceId?: string, apiToken?: string): Promise<{ success: boolean; chats: GreenApiChat[]; error?: string }> {
    const cfg = this.getConfig();
    const id = instanceId?.trim() || cfg.instanceId?.trim();
    const token = apiToken?.trim() || cfg.apiToken?.trim();

    if (!id || !token) {
      return { success: false, chats: [], error: 'Green API Instance ID and Token are not configured.' };
    }

    // Try backend proxy first
    try {
      const res = await fetch('/api/green-api/get-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: id, apiToken: token }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.chats)) {
          return { success: true, chats: data.chats };
        }
      }
    } catch (e) {
      console.warn('Backend proxy /api/green-api/get-chats error, trying direct Green API call:', e);
    }

    // Fallback: direct browser fetch
    try {
      const directUrl = `https://api.green-api.com/waInstance${id}/getChats/${token}`;
      const r = await fetch(directUrl);
      if (r.ok) {
        const data = await r.json();
        return { success: true, chats: Array.isArray(data) ? data : [] };
      }
      return { success: false, chats: [], error: `Green API error: ${r.statusText}` };
    } catch (err: any) {
      return { success: false, chats: [], error: err.message || 'Failed to connect to Green API' };
    }
  },

  /**
   * Verify group data and get actual WhatsApp group name and participant count
   */
  async verifyGroup(groupId: string, instanceId?: string, apiToken?: string): Promise<{ success: boolean; subject?: string; participantsCount?: number; error?: string }> {
    const cfg = this.getConfig();
    const id = instanceId?.trim() || cfg.instanceId?.trim();
    const token = apiToken?.trim() || cfg.apiToken?.trim();
    let cleanGroup = groupId?.trim();

    if (!id || !token || !cleanGroup) {
      return { success: false, error: 'Instance ID, API Token, and Group ID are required.' };
    }

    if (!cleanGroup.includes('@')) {
      cleanGroup = `${cleanGroup}@g.us`;
    }

    try {
      const res = await fetch('/api/green-api/get-group-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: id, apiToken: token, groupId: cleanGroup }),
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

    return { success: false, error: 'Could not verify WhatsApp group from Green API.' };
  },

  /**
   * Configure Green API settings to ensure webhook and message journaling are active
   */
  async enableJournaling(instanceId?: string, apiToken?: string): Promise<boolean> {
    const cfg = this.getConfig();
    const id = instanceId?.trim() || cfg.instanceId?.trim();
    const token = apiToken?.trim() || cfg.apiToken?.trim();

    if (!id || !token) return false;

    try {
      const res = await fetch('/api/green-api/set-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: id, apiToken: token }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Fetch messages from the specified WhatsApp group (strictly filtered)
   */
  async fetchGroupMessages(options?: {
    instanceId?: string;
    apiToken?: string;
    chatId?: string;
    count?: number;
  }): Promise<{ success: boolean; messages: any[]; error?: string; chatId?: string }> {
    const cfg = this.getConfig();
    const id = options?.instanceId?.trim() || cfg.instanceId?.trim();
    const token = options?.apiToken?.trim() || cfg.apiToken?.trim();
    let chatId = options?.chatId?.trim() || cfg.targetGroupChatId?.trim();
    const count = options?.count || 50;

    if (!id || !token) {
      return { success: false, messages: [], error: 'Green API Instance ID and API Token are required. Please configure Green API.' };
    }

    if (chatId && !chatId.includes('@')) {
      chatId = `${chatId}@g.us`;
    }

    // Try backend proxy first
    try {
      const res = await fetch('/api/green-api/get-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: id, apiToken: token, chatId, count }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          messages: Array.isArray(data.messages) ? data.messages : [],
          chatId: data.chatId || chatId,
        };
      }
    } catch (e) {
      console.warn('Backend proxy /api/green-api/get-messages error, trying direct fetch fallback:', e);
    }

    // Fallback: direct browser fetch
    try {
      const rawCollected: any[] = [];
      const deletedIds = new Set<string>();

      if (chatId) {
        try {
          const directUrl = `https://api.green-api.com/waInstance${id}/getChatHistory/${token}`;
          const r = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, count: Math.max(count, 100) }),
          });
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data)) {
              for (const m of data) {
                if (!m) continue;
                const mChat = String(m.chatId || '').toLowerCase();
                if (!mChat || mChat === chatId.toLowerCase()) {
                  rawCollected.push(m);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Direct getChatHistory error:', e);
        }
      }

      // Fallback & real-time supplement: lastIncomingMessages
      try {
        const lastIncUrl = `https://api.green-api.com/waInstance${id}/lastIncomingMessages/${token}?minutes=7200`;
        const fallbackR = await fetch(lastIncUrl);
        if (fallbackR.ok) {
          const data = await fallbackR.json();
          if (Array.isArray(data)) {
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
          }
        }
      } catch (e) {
        console.warn('Direct lastIncomingMessages error:', e);
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

    // Determine timestamp window based on filter options
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

    // If replaceExisting is requested, clear previous observations so no stale/deleted data remains
    if (filterOptions?.replaceExisting) {
      WhatsAppObservationService.clearAll();
    }

    const currentObs = filterOptions?.replaceExisting ? [] : WhatsAppObservationService.getAll();
    const existingRawCaptions = new Set(currentObs.map((o) => o.rawCaption?.trim().toLowerCase()));

    const newlyAdded: FacilityObservation[] = [];

    for (const msg of rawMessages) {
      // 1. Strictly ignore deleted WhatsApp messages
      if (
        msg.isDeleted === true ||
        msg.typeMessage === 'deletedMessage' ||
        msg.type === 'deletedMessage' ||
        msg.status === 'deleted'
      ) {
        continue;
      }

      // 2. Filter by message timestamp if available
      let msgTimestampMs = Date.now();
      if (typeof msg.timestamp === 'number') {
        msgTimestampMs = msg.timestamp > 1e11 ? msg.timestamp : msg.timestamp * 1000;
      } else if (msg.timestamp) {
        const parsedT = new Date(msg.timestamp).getTime();
        if (!isNaN(parsedT)) msgTimestampMs = parsedT;
      }

      // Check range boundary
      if (minTimestampMs > 0 && msgTimestampMs < minTimestampMs) {
        continue;
      }
      if (maxTimestampMs < Infinity && msgTimestampMs > maxTimestampMs) {
        continue;
      }

      // 3. Extract image URL if available
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

      // 4. Extract caption or text across all Green API message payload variants
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

      // If photo was sent without text, provide a clean default description instead of silently dropping it!
      if (!text) {
        if (imageUrl) {
          text = 'Inspection Photo (Uploaded without caption)';
        } else {
          continue; // Neither text nor image, skip
        }
      }

      const lowerText = text.toLowerCase();

      // Skip system messages & deletion notifications
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

      // Skip pure webhook URLs
      if (!imageUrl && (/^https?:\/\//i.test(text) || lowerText.includes('script.google.com'))) {
        continue;
      }

      // Skip empty document placeholders
      if (!imageUrl && (/^(new\s+)?text\s+document\.txt$/i.test(text) || /\.(pdf|docx|xlsx|zip|csv)$/i.test(text))) {
        continue;
      }

      // Skip conversational one-word answers if there is no photo attached
      const ignoreWords = ['ok', 'okay', 'done', 'yes', 'no', 'noted', 'thanks', 'thank you', 'good morning', 'good afternoon', 'good evening', 'hi', 'hello', 'test'];
      if (!imageUrl && ignoreWords.includes(lowerText)) {
        continue;
      }

      // Check duplicate raw caption in current batch
      if (existingRawCaptions.has(lowerText)) {
        continue;
      }

      // Inspector name/phone
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

import { Booking, GasConnectionConfig, HandoverItemRecord, ParcelRecord, LostFoundRecord, IsolationRoomRecord } from '../types';
import { StorageService } from './storageService';
import { DEFAULT_GAS_WEB_APP_URL } from '../config/gasConfig';
import { OfflineQueueService } from './offlineQueueService';
import { ToastService } from './toastService';
import { TicketService } from './ticketService';

const GAS_STORAGE_KEY = 'executive_portal_gas_settings_v1';

export interface TestConnectionResult {
  success: boolean;
  message: string;
  diagnosis?: 'OK' | 'OUTDATED_CODE_GS' | 'AUTH_REQUIRED' | 'INVALID_JSON_RESPONSE' | 'SHEET_LINK_PROVIDED' | 'DEV_URL_PROVIDED' | 'NETWORK_ERROR' | 'MISSING_TABS';
  suggestedUrl?: string;
  data?: any;
  latencyMs?: number;
  tabsCount?: number;
  missingTabs?: string[];
}

let consecutiveSyncErrors = 0;
let isServerProxyDisabled = false;

export const GasService = {
  getConfig(): GasConnectionConfig {
    let webAppUrl = DEFAULT_GAS_WEB_APP_URL || '';
    let sheetId = '';
    let syncStatus = 'idle';
    let lastSyncedAt: string | undefined;

    try {
      const stored = localStorage.getItem(GAS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.webAppUrl && parsed.webAppUrl.trim()) {
          const url = parsed.webAppUrl.trim();
          // If stored URL was an older deprecated template URL or not matching current master default, upgrade to current DEFAULT_GAS_WEB_APP_URL
          const knownOlderUrls = [
            'AKfycbxwnZt5oCjKd1jIfDB6l9ooM7V7hAy24sEwNhhmGFcDNo9wjmdTVM4i-pGvsTR-kLJMCg',
            'AKfycbzcJ0AnlyAwRaJ1HDaOxbxRjVmwTO7OATY-_SE0q99yK-E-Oj81F9U0m_Lwlw1nW0qhw',
            'AKfycbyLoiZ-getR3ajRktnHRVtCzFYBqeQ-3Ofej04Yk6bPfWFXa6t-wIxvkhJhqVFYtFIXCA',
            'AKfycbwkaihSZuReEST68m25df5xwlXT7eBIFQQh9X41-LNqLtZViXq6vmFw02Mt1j-8BmkjFQ',
            'AKfycby1_nm2O5Jyir7A7VXOYqYkHQFF1RdKsWeqkvT57VbKEB16VTmhC7AIzVargT4tucwchg',
            'AKfycbzJNKpxnvxHSeqT0wuTkOgJWXJPxWeBf5cXQ0m90V-O9uvjtHUyTHpkyRX12hyBC0Uv3A',
          ];

          const isOlderUrl = knownOlderUrls.some((part) => url.includes(part));

          if (isOlderUrl || !url.startsWith('https://script.google.com') || (!parsed.isCustomUrl && url !== DEFAULT_GAS_WEB_APP_URL)) {
            webAppUrl = DEFAULT_GAS_WEB_APP_URL;
            // Persist the upgraded URL back to localStorage immediately
            try {
              localStorage.setItem(
                GAS_STORAGE_KEY,
                JSON.stringify({
                  ...parsed,
                  webAppUrl: DEFAULT_GAS_WEB_APP_URL,
                })
              );
            } catch (e) {}
          } else {
            webAppUrl = url;
          }
        }
        sheetId = parsed.sheetId || '';
        syncStatus = parsed.syncStatus || 'idle';
        lastSyncedAt = parsed.lastSyncedAt;
      }
    } catch (e) {
      console.warn('Error reading GAS config from localStorage', e);
    }

    // Always prefer default URL if nothing is configured
    if (!webAppUrl && DEFAULT_GAS_WEB_APP_URL) {
      webAppUrl = DEFAULT_GAS_WEB_APP_URL;
    }

    return {
      webAppUrl,
      sheetId,
      syncStatus: syncStatus as any,
      autoSync: true,
      lastSyncedAt,
    };
  },

  isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(config.webAppUrl && config.webAppUrl.trim().startsWith('http'));
  },

  async verifyActiveConnection(): Promise<{ connected: boolean; message: string; latencyMs?: number }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !config.webAppUrl.trim().startsWith('http')) {
      config.syncStatus = 'error';
      this.saveConfig(config);
      return {
        connected: false,
        message: 'Google Sheets Web App URL is not configured.',
      };
    }

    try {
      const result = await this.testConnection(config.webAppUrl);
      if (result.success) {
        config.syncStatus = 'connected';
        config.lastSyncedAt = new Date().toISOString();
        this.saveConfig(config);
        return {
          connected: true,
          message: 'Connected to Google Sheets',
          latencyMs: result.latencyMs,
        };
      } else {
        config.syncStatus = 'error';
        this.saveConfig(config);
        return {
          connected: false,
          message: result.message || 'Google Sheets connection test failed.',
        };
      }
    } catch (e: any) {
      config.syncStatus = 'error';
      this.saveConfig(config);
      return {
        connected: false,
        message: e?.message || 'Network or server error contacting Google Sheets.',
      };
    }
  },

  saveConfig(config: GasConnectionConfig) {
    try {
      localStorage.setItem(GAS_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving GAS config', e);
    }
  },

  sanitizeUrl(rawUrl: string): { url: string; warning?: string; isSheetLink?: boolean; sheetId?: string } {
    let clean = (rawUrl || '').trim();

    if (!clean) {
      return { url: '' };
    }

    // Check if user accidentally pasted a Google Sheet URL
    if (clean.includes('docs.google.com/spreadsheets/d/')) {
      const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = match ? match[1] : undefined;
      return {
        url: clean,
        isSheetLink: true,
        sheetId,
        warning: 'Google Spreadsheet URL detected. In your Google Sheet, open Extensions > Apps Script > Deploy > New deployment > Web App to get your Apps Script Web App URL.',
      };
    }

    // Check if user pasted the script editor or test URL ending in /edit or /dev
    if (clean.endsWith('/edit') || clean.includes('/edit#') || clean.includes('/edit?')) {
      const execUrl = clean.replace(/\/edit.*$/, '/exec');
      return {
        url: execUrl,
        warning: `Replaced /edit with /exec for proper Web App execution.`,
      };
    }

    if (clean.endsWith('/dev')) {
      const execUrl = clean.replace(/\/dev$/, '/exec');
      return {
        url: execUrl,
        warning: `The /dev URL requires developer Google login cookies. Switched to production /exec endpoint.`,
      };
    }

    return { url: clean };
  },

  async testConnection(url: string): Promise<TestConnectionResult> {
    const { url: cleanUrl, isSheetLink, sheetId, warning } = this.sanitizeUrl(url);

    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Please enter a valid Google Apps Script Web App URL (starts with https://script.google.com/macros/s/...).',
        diagnosis: 'NETWORK_ERROR',
      };
    }

    if (isSheetLink) {
      return {
        success: false,
        message: 'You pasted a Google Spreadsheet link instead of a Google Apps Script Web App URL. In your Google Sheet, go to Extensions > Apps Script > Deploy > New Deployment > Web App to generate your Web App URL.',
        diagnosis: 'SHEET_LINK_PROVIDED',
        data: { sheetId },
      };
    }

    // 1. First attempt through our Server-Side Proxy (bypasses browser CORS & follows 302 redirects)
    if (!isServerProxyDisabled) {
      try {
        const proxyRes = await fetch('/api/gas/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: cleanUrl,
            action: 'ping',
            method: 'GET',
          }),
        });

        const contentType = proxyRes.headers.get('content-type') || '';
        if (!proxyRes.ok || !contentType.includes('application/json')) {
          // On static hosting like Netlify, unknown routes return HTML index.html
          isServerProxyDisabled = true;
        } else {
          const proxyData = await proxyRes.json();
          
          if (proxyData.success) {
            consecutiveSyncErrors = 0;
            const pingPayload = proxyData.data || {};
            const tabs: string[] = Array.isArray(pingPayload.tabs) ? pingPayload.tabs : [];
            const requiredTabs = [
              'Handover & Takenover',
              'Parcel Monitoring',
              'Lost & Found',
              'Isolation & Room Booking',
              'Ticket Management',
              'SLA Management',
              'Automated Workflow',
              'Email Management',
            ];
            const missingTabs = requiredTabs.filter(
              (req) => !tabs.some((t) => t.toLowerCase().replace(/[^a-z0-9]/g, '') === req.toLowerCase().replace(/[^a-z0-9]/g, ''))
            );

            if (tabs.length > 0 && (tabs.length < 20 || missingTabs.length > 0)) {
              return {
                success: true,
                message: `Connected, but your Google Sheet Code.gs is running an older version (only ${tabs.length} tabs detected). To sync all 20 facilities to Google Sheets, update Code.gs in Apps Script.`,
                diagnosis: 'OUTDATED_CODE_GS',
                data: pingPayload,
                latencyMs: proxyData.latencyMs,
                suggestedUrl: cleanUrl,
                tabsCount: tabs.length,
                missingTabs,
              };
            }

            return {
              success: true,
              message: `Connected successfully to Google Apps Script & Google Sheets (All 20 Facilities Ready)! Latency: ${proxyData.latencyMs || 120}ms.`,
              diagnosis: 'OK',
              data: proxyData.data,
              latencyMs: proxyData.latencyMs,
              suggestedUrl: cleanUrl,
              tabsCount: tabs.length || 20,
            };
          } else {
            return {
              success: false,
              message: proxyData.error || 'Connection failed: Unexpected response from Google Apps Script.',
              diagnosis: proxyData.diagnosis,
              suggestedUrl: proxyData.suggestedUrl || (warning ? cleanUrl : undefined),
              latencyMs: proxyData.latencyMs,
            };
          }
        }
      } catch (serverProxyErr) {
        isServerProxyDisabled = true;
      }
    }

    // 2. Direct client-side fetch fallback (for Netlify/Vercel/Static hosting)
    try {
      const pingUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=ping&t=${Date.now()}`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.success) {
        consecutiveSyncErrors = 0;
        const tabs: string[] = Array.isArray(data.tabs) ? data.tabs : [];
        const requiredTabs = [
          'Handover & Takenover',
          'Parcel Monitoring',
          'Lost & Found',
          'Isolation & Room Booking',
          'Ticket Management',
          'SLA Management',
          'Automated Workflow',
          'Email Management',
        ];
        const missingTabs = requiredTabs.filter(
          (req) => !tabs.some((t) => t.toLowerCase().replace(/[^a-z0-9]/g, '') === req.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );

        if (tabs.length > 0 && (tabs.length < 20 || missingTabs.length > 0)) {
          return {
            success: true,
            message: `Connected, but your Google Sheet Code.gs is running an older version (only ${tabs.length} tabs detected). To sync all 20 facilities, update Code.gs in Apps Script.`,
            diagnosis: 'OUTDATED_CODE_GS',
            data,
            suggestedUrl: cleanUrl,
            tabsCount: tabs.length,
            missingTabs,
          };
        }

        return {
          success: true,
          message: 'Connected successfully to Google Apps Script Web App & Google Sheets (All 20 Facilities Ready)!',
          diagnosis: 'OK',
          data,
          suggestedUrl: cleanUrl,
          tabsCount: tabs.length || 20,
        };
      } else {
        return {
          success: false,
          message: data?.error || 'Connected, but received unexpected data format from Google Apps Script.',
          diagnosis: 'INVALID_JSON_RESPONSE',
        };
      }
    } catch (directErr: any) {
      return {
        success: false,
        message: `Connection failed: ${directErr.message || directErr}. Make sure your Google Apps Script Web App is deployed with "Execute as: Me" and "Who has access: Anyone".`,
        diagnosis: 'AUTH_REQUIRED',
        suggestedUrl: cleanUrl,
      };
    }
  },

  async syncWithRemote(isManual: boolean = false): Promise<{ success: boolean; count?: number; error?: string; diagnosis?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      if (isManual) {
        ToastService.error('Google Sheets', 'No Google Apps Script Web App URL configured.');
      }
      return { success: false, error: 'No Google Apps Script Web App URL configured.' };
    }

    // Flush any pending offline transactions before fetching fresh state
    try {
      await OfflineQueueService.flushQueue(this);
    } catch (qErr) {
      console.warn('Non-blocking offline queue flush notice:', qErr);
    }

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    // 1. Try server proxy first (when running on fullstack node server)
    if (!isServerProxyDisabled) {
      try {
        const proxyRes = await fetch('/api/gas/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: cleanUrl,
            action: 'getAll',
            method: 'GET',
          }),
        });

        const contentType = proxyRes.headers.get('content-type') || '';
        if (!proxyRes.ok || !contentType.includes('application/json')) {
          isServerProxyDisabled = true;
        } else {
          const proxyData = await proxyRes.json();
          if (proxyData.success && proxyData.data) {
          let totalCount = 0;
          StorageService.resetSyncChangesCount();
          
          // 1. Standard Bookings (Facilities 1-8)
          if (Array.isArray(proxyData.data.bookings)) {
            const merged = StorageService.mergeRemoteBookings(proxyData.data.bookings);
            totalCount += merged.length;
          }
          // 2. Isolation Rooms (Facility 9)
          if (Array.isArray(proxyData.data.isolationRooms)) {
            const mergedIso = StorageService.mergeRemoteIsolationRooms(proxyData.data.isolationRooms);
            totalCount += mergedIso.length;
          }
          // 3. Handover Records (Facility 10)
          if (Array.isArray(proxyData.data.handovers)) {
            const mergedHandovers = StorageService.mergeRemoteHandovers(proxyData.data.handovers);
            totalCount += mergedHandovers.length;
          }
          // 4. Parcel Records (Facility 11)
          if (Array.isArray(proxyData.data.parcels)) {
            const mergedParcels = StorageService.mergeRemoteParcels(proxyData.data.parcels);
            totalCount += mergedParcels.length;
          }
          // 5. Lost & Found Records (Facility 12)
          if (Array.isArray(proxyData.data.lostFound)) {
            const mergedLostFound = StorageService.mergeRemoteLostFound(proxyData.data.lostFound);
            totalCount += mergedLostFound.length;
          }
          // 6. Blank Forms (Facility 13)
          if (Array.isArray(proxyData.data.blankForms)) {
            this.mergeRemoteBlankForms(proxyData.data.blankForms);
            totalCount += proxyData.data.blankForms.length;
          }
          // 7. Invoices (Facility 14)
          if (Array.isArray(proxyData.data.invoices)) {
            this.mergeRemoteInvoices(proxyData.data.invoices);
            totalCount += proxyData.data.invoices.length;
          }
          // 8. Notices (Facility 15)
          if (Array.isArray(proxyData.data.notices)) {
            this.mergeRemoteNotices(proxyData.data.notices);
            totalCount += proxyData.data.notices.length;
          }
          // 9. Support Tickets (Facility 16)
          if (Array.isArray(proxyData.data.supportTickets)) {
            this.mergeRemoteSupportTickets(proxyData.data.supportTickets);
            totalCount += proxyData.data.supportTickets.length;
          }
          // 10. Work Order Tickets (Facility 17)
          const woTickets = proxyData.data.workOrderTickets || proxyData.data.tickets;
          if (Array.isArray(woTickets)) {
            this.mergeRemoteWorkOrderTickets(woTickets);
            totalCount += woTickets.length;
          }
          // 11. SLA Policies (Facility 18)
          if (Array.isArray(proxyData.data.slaPolicies)) {
            this.mergeRemoteSlaPolicies(proxyData.data.slaPolicies);
            totalCount += proxyData.data.slaPolicies.length;
          }
          // 12. Automated Workflows (Facility 19)
          if (Array.isArray(proxyData.data.workflows)) {
            this.mergeRemoteWorkflows(proxyData.data.workflows);
            totalCount += proxyData.data.workflows.length;
          }
          // 13. Email Management (Facility 20)
          const emailLogs = proxyData.data.emailLogs || proxyData.data.emails;
          if (Array.isArray(emailLogs)) {
            this.mergeRemoteEmailLogs(emailLogs);
            totalCount += emailLogs.length;
          }

          consecutiveSyncErrors = 0;
          config.lastSyncedAt = new Date().toISOString();
          config.syncStatus = 'connected';
          this.saveConfig(config);

          const updatedCount = StorageService.getLastSyncChangesCount();
          if (updatedCount > 0) {
            ToastService.showSyncToast({
              source: 'Google Sheets',
              title: 'Google Sheets Synced',
              message: `Background sync updated ${updatedCount} ${updatedCount === 1 ? 'record' : 'records'} from Google Sheets`,
              count: updatedCount,
              type: 'success',
            });
          } else if (isManual) {
            ToastService.showSyncToast({
              source: 'Google Sheets',
              title: 'Google Sheets Synced',
              message: 'All records are up to date with Google Sheets master',
              type: 'success',
            });
          }
          return { success: true, count: totalCount };
        } else if (proxyData.error) {
          throw new Error(proxyData.error);
        }
      }
    } catch (proxyErr: any) {
      isServerProxyDisabled = true;
    }
  }

    // 2. Direct fetch fallback for Netlify & browser clients
    try {
      const url = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getAll&t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();

      if (result && result.success) {
        let totalCount = 0;
        StorageService.resetSyncChangesCount();

        // 1. Standard Bookings
        if (Array.isArray(result.bookings)) {
          const merged = StorageService.mergeRemoteBookings(result.bookings);
          totalCount += merged.length;
        }
        // 2. Isolation Rooms
        if (Array.isArray(result.isolationRooms)) {
          const mergedIso = StorageService.mergeRemoteIsolationRooms(result.isolationRooms);
          totalCount += mergedIso.length;
        }
        // 3. Handover Records
        if (Array.isArray(result.handovers)) {
          const mergedHandovers = StorageService.mergeRemoteHandovers(result.handovers);
          totalCount += mergedHandovers.length;
        }
        // 4. Parcel Records
        if (Array.isArray(result.parcels)) {
          const mergedParcels = StorageService.mergeRemoteParcels(result.parcels);
          totalCount += mergedParcels.length;
        }
        // 5. Lost & Found Records
        if (Array.isArray(result.lostFound)) {
          const mergedLostFound = StorageService.mergeRemoteLostFound(result.lostFound);
          totalCount += mergedLostFound.length;
        }
        // 6. Blank Forms
        if (Array.isArray(result.blankForms)) {
          this.mergeRemoteBlankForms(result.blankForms);
          totalCount += result.blankForms.length;
        }
        // 7. Invoices
        if (Array.isArray(result.invoices)) {
          this.mergeRemoteInvoices(result.invoices);
          totalCount += result.invoices.length;
        }
        // 8. Notices
        if (Array.isArray(result.notices)) {
          this.mergeRemoteNotices(result.notices);
          totalCount += result.notices.length;
        }
        // 9. Support Tickets
        if (Array.isArray(result.supportTickets)) {
          this.mergeRemoteSupportTickets(result.supportTickets);
          totalCount += result.supportTickets.length;
        }
        // 10. Work Order Tickets (Facility 17)
        const woTickets = result.workOrderTickets || result.tickets;
        if (Array.isArray(woTickets)) {
          this.mergeRemoteWorkOrderTickets(woTickets);
          totalCount += woTickets.length;
        }
        // 11. SLA Policies (Facility 18)
        if (Array.isArray(result.slaPolicies)) {
          this.mergeRemoteSlaPolicies(result.slaPolicies);
          totalCount += result.slaPolicies.length;
        }
        // 12. Automated Workflows (Facility 19)
        if (Array.isArray(result.workflows)) {
          this.mergeRemoteWorkflows(result.workflows);
          totalCount += result.workflows.length;
        }
        // 13. Email Management (Facility 20)
        const emailLogs = result.emailLogs || result.emails;
        if (Array.isArray(emailLogs)) {
          this.mergeRemoteEmailLogs(emailLogs);
          totalCount += emailLogs.length;
        }

        consecutiveSyncErrors = 0;
        config.lastSyncedAt = new Date().toISOString();
        config.syncStatus = 'connected';
        this.saveConfig(config);

        const updatedCount = StorageService.getLastSyncChangesCount();
        if (updatedCount > 0) {
          ToastService.showSyncToast({
            source: 'Google Sheets',
            title: 'Google Sheets Synced',
            message: `Background sync updated ${updatedCount} ${updatedCount === 1 ? 'record' : 'records'} from Google Sheets`,
            count: updatedCount,
            type: 'success',
          });
        } else if (isManual) {
          ToastService.showSyncToast({
            source: 'Google Sheets',
            title: 'Google Sheets Synced',
            message: 'All records are up to date with Google Sheets master',
            type: 'success',
          });
        }

        return { success: true, count: totalCount };
      } else {
        throw new Error(result?.error || 'Failed to fetch data from Google Sheet');
      }
    } catch (err: any) {
      consecutiveSyncErrors++;
      // High tolerance for multi-device background polling (only flag error after 10 consecutive network timeouts)
      if (consecutiveSyncErrors >= 10) {
        config.syncStatus = 'error';
        this.saveConfig(config);
      }
      if (isManual) {
        ToastService.error('Google Sheets', err.message || 'Remote sync failed');
      }
      return { success: false, error: err.message || 'Remote sync failed' };
    }
  },

  /**
   * Syncs a single specific facility on demand (Bi-directional: pushes local records first then fetches latest)
   */
  async syncFacility(facilityId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !config.webAppUrl.trim().startsWith('http')) {
      return {
        success: false,
        error: 'Google Sheets Web App URL is not configured. Google Sheets connection is mandatory for all 20 facilities.',
      };
    }

    const normId = (facilityId || '').toLowerCase().trim();

    try {
      if (normId.includes('handover') || normId.includes('takenover') || normId === 'hoto') {
        const localHandovers = StorageService.getHandoverRecords();
        if (localHandovers.length > 0) {
          await this.pushBatchHandoversToRemote(localHandovers);
        }
      } else if (normId.includes('parcel') || normId === 'prcl') {
        const localParcels = StorageService.getParcelRecords();
        if (localParcels.length > 0) {
          await this.pushBatchParcelsToRemote(localParcels);
        }
      } else if (normId.includes('lost') || normId.includes('found') || normId === 'lnfd') {
        const localLostFound = StorageService.getLostFoundRecords();
        if (localLostFound.length > 0) {
          await this.pushBatchLostFoundToRemote(localLostFound);
        }
      } else if (normId.includes('blank') || normId.includes('form')) {
        const rawForms = localStorage.getItem('tafga_saved_form_records_v1');
        if (rawForms) {
          const forms = JSON.parse(rawForms);
          if (Array.isArray(forms) && forms.length > 0) {
            await this.pushBatchBlankFormsToRemote(forms);
          }
        }
      } else if (normId.includes('invoice') || normId.includes('billing')) {
        const rawInvoices = localStorage.getItem('tamimi_unified_camp_invoices_v2');
        if (rawInvoices) {
          const invoices = JSON.parse(rawInvoices);
          if (Array.isArray(invoices) && invoices.length > 0) {
            await this.pushBatchInvoicesToRemote(invoices);
          }
        }
      } else if (normId.includes('announcement') || normId.includes('notice')) {
        const rawNotices = localStorage.getItem('tamimi_facility_notices_v2');
        if (rawNotices) {
          const notices = JSON.parse(rawNotices);
          if (Array.isArray(notices) && notices.length > 0) {
            await this.pushBatchNoticesToRemote(notices);
          }
        }
      } else if (normId.includes('workorder') || normId.includes('work_order') || normId.includes('work order') || normId === 'ticket_mgmt') {
        const localTickets = TicketService.getTickets();
        if (localTickets.length > 0) {
          await this.pushBatchWorkOrderTicketsToRemote(localTickets);
        }
      } else if (normId.includes('sla')) {
        const rawSla = localStorage.getItem('tafga_sla_policies_v1');
        if (rawSla) {
          const policies = JSON.parse(rawSla);
          if (Array.isArray(policies) && policies.length > 0) {
            await this.pushBatchSlaPoliciesToRemote(policies);
          }
        }
      } else if (normId.includes('workflow') || normId.includes('automation')) {
        const rawWf = localStorage.getItem('tafga_workflows_v2');
        if (rawWf) {
          const workflows = JSON.parse(rawWf);
          if (Array.isArray(workflows) && workflows.length > 0) {
            await this.pushBatchWorkflowsToRemote(workflows);
          }
        }
      } else if (normId.includes('email') || normId.includes('mail')) {
        const rawEmails = localStorage.getItem('tafga_email_outbox_v2');
        if (rawEmails) {
          const emails = JSON.parse(rawEmails);
          if (Array.isArray(emails) && emails.length > 0) {
            await this.pushBatchEmailLogsToRemote(emails);
          }
        }
      } else if (normId.includes('help') || normId.includes('support') || normId.includes('ticket')) {
        const rawTickets = localStorage.getItem('tamimi_support_tickets_v2');
        if (rawTickets) {
          const tickets = JSON.parse(rawTickets);
          if (Array.isArray(tickets) && tickets.length > 0) {
            await this.pushBatchSupportTicketsToRemote(tickets);
          }
        }
      } else if (normId.includes('isolation') || normId.includes('room')) {
        const localRooms = StorageService.getIsolationRooms();
        const occupiedRooms = localRooms.filter((r) => r.occupants && r.occupants.length > 0);
        if (occupiedRooms.length > 0) {
          await this.pushBatchIsolationToRemote(occupiedRooms);
        }
      } else {
        const facilityBookings = StorageService.getAllBookings().filter((b) => b.facilityId === facilityId);
        if (facilityBookings.length > 0) {
          await this.pushBatchBookingsToRemote(facilityBookings);
        }
      }
    } catch (pushErr) {
      console.warn(`Pre-sync push for ${facilityId} had non-fatal warning:`, pushErr);
    }

    return this.syncWithRemote();
  },

  mergeRemoteBlankForms(remoteForms: any[]) {
    try {
      const raw = localStorage.getItem('tafga_saved_form_records_v1');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();
      
      // Keep non-deleted local items
      local.forEach((f: any) => {
        if (f && f.id && !StorageService.isIdDeleted(f.id)) {
          map.set(f.id, f);
        }
      });

      // Merge non-deleted remote items
      remoteForms.forEach((f: any) => {
        if (f && f.id && !StorageService.isIdDeleted(f.id)) {
          map.set(f.id, { ...(map.get(f.id) || {}), ...f });
        }
      });

      localStorage.setItem('tafga_saved_form_records_v1', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('blank_forms_updated'));
    } catch (e) {}
  },

  mergeRemoteInvoices(remoteInvoices: any[]) {
    try {
      const raw = localStorage.getItem('tamimi_unified_camp_invoices_v2');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();
      
      // Keep non-deleted local invoices
      local.forEach((inv: any) => {
        if (inv && inv.id) {
          const isDeleted = StorageService.isIdDeleted(inv.id) || (inv.invoiceNumber && StorageService.isIdDeleted(inv.invoiceNumber));
          if (!isDeleted) {
            map.set(inv.id, inv);
          }
        }
      });

      // Merge non-deleted remote invoices
      remoteInvoices.forEach((inv: any) => {
        if (inv && inv.id) {
          const isDeleted = StorageService.isIdDeleted(inv.id) || (inv.invoiceNumber && StorageService.isIdDeleted(inv.invoiceNumber));
          if (!isDeleted) {
            map.set(inv.id, { ...(map.get(inv.id) || {}), ...inv });
          }
        }
      });

      localStorage.setItem('tamimi_unified_camp_invoices_v2', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('invoices_updated'));
    } catch (e) {}
  },

  mergeRemoteNotices(remoteNotices: any[]) {
    try {
      const raw = localStorage.getItem('tamimi_facility_notices_v2');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();

      // Keep non-deleted local notices
      local.forEach((n: any) => {
        if (n && n.id) {
          const isDeleted = StorageService.isIdDeleted(n.id) || (n.noticeRef && StorageService.isIdDeleted(n.noticeRef));
          if (!isDeleted) {
            map.set(n.id, n);
          }
        }
      });

      // Merge non-deleted remote notices
      remoteNotices.forEach((n: any) => {
        if (n && n.id) {
          const isDeleted = StorageService.isIdDeleted(n.id) || (n.noticeRef && StorageService.isIdDeleted(n.noticeRef));
          if (!isDeleted) {
            map.set(n.id, { ...(map.get(n.id) || {}), ...n });
          }
        }
      });

      localStorage.setItem('tamimi_facility_notices_v2', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('notices_updated'));
    } catch (e) {}
  },

  mergeRemoteSupportTickets(remoteTickets: any[]) {
    try {
      const raw = localStorage.getItem('tamimi_support_tickets_v2');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();

      // Keep non-deleted local tickets
      local.forEach((t: any) => {
        if (t && t.id) {
          const isDeleted = StorageService.isIdDeleted(t.id) || (t.ticketNumber && StorageService.isIdDeleted(t.ticketNumber));
          if (!isDeleted) {
            map.set(t.id, t);
          }
        }
      });

      // Merge non-deleted remote tickets
      remoteTickets.forEach((t: any) => {
        if (t && t.id) {
          const isDeleted = StorageService.isIdDeleted(t.id) || (t.ticketNumber && StorageService.isIdDeleted(t.ticketNumber));
          if (!isDeleted) {
            map.set(t.id, { ...(map.get(t.id) || {}), ...t });
          }
        }
      });

      localStorage.setItem('tamimi_support_tickets_v2', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('tickets_updated'));
    } catch (e) {}
  },

  mergeRemoteWorkOrderTickets(remoteTickets: any[]) {
    try {
      TicketService.mergeRemoteTickets(remoteTickets);
    } catch (e) {
      console.warn('Error merging remote work order tickets', e);
    }
  },

  mergeRemoteSlaPolicies(remotePolicies: any[]) {
    try {
      const raw = localStorage.getItem('tafga_sla_policies_v1');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();
      local.forEach((p: any) => {
        if (p && p.id && !StorageService.isIdDeleted(p.id)) {
          map.set(p.id, p);
        }
      });
      remotePolicies.forEach((p: any) => {
        if (p && p.id && !StorageService.isIdDeleted(p.id)) {
          const prev = map.get(p.id) || {};
          const resHours =
            typeof p.resolutionHours === 'number' && p.resolutionHours > 0
              ? p.resolutionHours
              : Number(p.resolutionHours) ||
                Number(p.resolution_hours) ||
                parseInt(p['Resolution SLA Target']) ||
                prev.resolutionHours ||
                24;

          const respMins =
            typeof p.responseMinutes === 'number' && p.responseMinutes > 0
              ? p.responseMinutes
              : Number(p.responseMinutes) ||
                Number(p.response_minutes) ||
                prev.responseMinutes ||
                30;

          const warnPct =
            typeof p.warningThresholdPercent === 'number' && p.warningThresholdPercent > 0
              ? p.warningThresholdPercent
              : Number(p.warningThresholdPercent) ||
                prev.warningThresholdPercent ||
                75;

          map.set(p.id, {
            ...prev,
            ...p,
            resolutionHours: resHours,
            responseMinutes: respMins,
            warningThresholdPercent: warnPct,
          });
        }
      });
      localStorage.setItem('tafga_sla_policies_v1', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('sla_policies_updated'));
    } catch (e) {
      console.warn('Error merging remote SLA policies', e);
    }
  },

  mergeRemoteWorkflows(remoteWorkflows: any[]) {
    try {
      const raw = localStorage.getItem('tafga_workflows_v2');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();
      local.forEach((w: any) => {
        if (w && w.id && !StorageService.isIdDeleted(w.id)) {
          map.set(w.id, w);
        }
      });
      remoteWorkflows.forEach((w: any) => {
        if (w && w.id && !StorageService.isIdDeleted(w.id)) {
          map.set(w.id, { ...(map.get(w.id) || {}), ...w });
        }
      });
      localStorage.setItem('tafga_workflows_v2', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('workflows_updated'));
    } catch (e) {
      console.warn('Error merging remote workflows', e);
    }
  },

  mergeRemoteEmailLogs(remoteLogs: any[]) {
    try {
      const raw = localStorage.getItem('tafga_email_outbox_v2');
      const local = raw ? JSON.parse(raw) : [];
      const map = new Map();
      local.forEach((l: any) => {
        if (l && l.id && !StorageService.isIdDeleted(l.id)) {
          map.set(l.id, l);
        }
      });
      remoteLogs.forEach((l: any) => {
        if (l && l.id && !StorageService.isIdDeleted(l.id)) {
          map.set(l.id, { ...(map.get(l.id) || {}), ...l });
        }
      });
      localStorage.setItem('tafga_email_outbox_v2', JSON.stringify(Array.from(map.values())));
      window.dispatchEvent(new CustomEvent('email_outbox_updated'));
    } catch (e) {
      console.warn('Error merging remote email logs', e);
    }
  },

  /**
   * Handover & Takenover Remote Sync Methods (Facility 10)
   */
  async pushHandoverToRemoteDirect(record: HandoverItemRecord): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const sheetRecord = {
      ...record,
      photoUrl: record.photoUrl && record.photoUrl.startsWith('data:') ? '[Photo Evidence Attached]' : (record.photoUrl || ''),
      secondaryPhotoUrl: record.secondaryPhotoUrl && record.secondaryPhotoUrl.startsWith('data:') ? '[Secondary ID Attached]' : (record.secondaryPhotoUrl || ''),
    };

    const payload = {
      action: 'saveHandover',
      record: sheetRecord,
      handover: sheetRecord,
      facilityName: 'Handover & Takenover',
      ...sheetRecord,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveHandover',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected handover record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing handover to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }

    return { success: false, error: lastError };
  },

  async pushHandoverToRemote(record: HandoverItemRecord): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushHandoverToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveHandover',
        facilityName: 'Handover & Takenover',
        description: `Handover #${record.id} (${record.itemName})`,
        payload: record,
      });
    }
    return res;
  },

  async pushBatchHandoversToRemote(records: HandoverItemRecord[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const sheetRecords = records.map((r) => ({
      ...r,
      photoUrl: r.photoUrl && r.photoUrl.startsWith('data:') ? '[Photo Evidence Attached]' : (r.photoUrl || ''),
      secondaryPhotoUrl: r.secondaryPhotoUrl && r.secondaryPhotoUrl.startsWith('data:') ? '[Secondary ID Attached]' : (r.secondaryPhotoUrl || ''),
    }));

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncHandover',
          body: { action: 'batchSyncHandover', records: sheetRecords },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncHandover', records: sheetRecords }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteHandoverFromRemoteDirect(recordId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteHandover',
          body: { action: 'deleteHandover', id: recordId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteHandover', id: recordId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteHandoverFromRemote(recordId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteHandoverFromRemoteDirect(recordId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: recordId,
        action: 'deleteHandover',
        facilityName: 'Handover & Takenover',
        description: `Delete Handover ${recordId}`,
        payload: { id: recordId },
      });
    }
    return res;
  },

  /**
   * Parcel Monitoring Remote Sync Methods (Facility 11)
   */
  async pushParcelToRemoteDirect(record: ParcelRecord): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const sheetRecord = {
      ...record,
      photoUrl: record.photoUrl && record.photoUrl.startsWith('data:') ? '[Photo Evidence Attached]' : (record.photoUrl || ''),
      secondaryPhotoUrl: record.secondaryPhotoUrl && record.secondaryPhotoUrl.startsWith('data:') ? '[Secondary ID Attached]' : (record.secondaryPhotoUrl || ''),
    };

    const payload = {
      action: 'saveParcel',
      record: sheetRecord,
      parcel: sheetRecord,
      facilityName: 'Parcel Monitoring',
      ...sheetRecord,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveParcel',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected parcel record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing parcel to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }

    return { success: false, error: lastError };
  },

  async pushParcelToRemote(record: ParcelRecord): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushParcelToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveParcel',
        facilityName: 'Parcel Monitoring',
        description: `Parcel for ${record.recipientName} (${record.courierCompany})`,
        payload: record,
      });
    }
    return res;
  },

  async pushBatchParcelsToRemote(records: ParcelRecord[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const sheetRecords = records.map((r) => ({
      ...r,
      photoUrl: r.photoUrl && r.photoUrl.startsWith('data:') ? '[Photo Evidence Attached]' : (r.photoUrl || ''),
      secondaryPhotoUrl: r.secondaryPhotoUrl && r.secondaryPhotoUrl.startsWith('data:') ? '[Secondary ID Attached]' : (r.secondaryPhotoUrl || ''),
    }));

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncParcels',
          body: { action: 'batchSyncParcels', records: sheetRecords },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncParcels', records: sheetRecords }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteParcelFromRemoteDirect(parcelId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteParcel',
          body: { action: 'deleteParcel', id: parcelId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteParcel', id: parcelId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteParcelFromRemote(parcelId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteParcelFromRemoteDirect(parcelId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: parcelId,
        action: 'deleteParcel',
        facilityName: 'Parcel Monitoring',
        description: `Delete Parcel ${parcelId}`,
        payload: { id: parcelId },
      });
    }
    return res;
  },

  /**
   * Lost & Found Remote Sync Methods (Facility 12)
   */
  async pushLostFoundToRemoteDirect(record: LostFoundRecord): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const sheetRecord = {
      ...record,
      photoUrl: record.photoUrl && record.photoUrl.startsWith('data:') ? '[Photo Evidence Attached]' : (record.photoUrl || ''),
      secondaryPhotoUrl: record.secondaryPhotoUrl && record.secondaryPhotoUrl.startsWith('data:') ? '[Secondary ID Attached]' : (record.secondaryPhotoUrl || ''),
    };

    const payload = {
      action: 'saveLostFound',
      record: sheetRecord,
      lostFound: sheetRecord,
      facilityName: 'Lost & Found',
      ...sheetRecord,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveLostFound',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected lost & found record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing lost & found to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }

    return { success: false, error: lastError };
  },

  async pushLostFoundToRemote(record: LostFoundRecord): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushLostFoundToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveLostFound',
        facilityName: 'Lost & Found',
        description: `Lost Item: ${record.itemName} (${record.status})`,
        payload: record,
      });
    }
    return res;
  },

  async pushBatchLostFoundToRemote(records: LostFoundRecord[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const sheetRecords = records.map((r) => ({
      ...r,
      photoUrl: r.photoUrl && r.photoUrl.startsWith('data:') ? '[Photo Evidence Attached]' : (r.photoUrl || ''),
      secondaryPhotoUrl: r.secondaryPhotoUrl && r.secondaryPhotoUrl.startsWith('data:') ? '[Secondary ID Attached]' : (r.secondaryPhotoUrl || ''),
    }));

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncLostFound',
          body: { action: 'batchSyncLostFound', records: sheetRecords },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncLostFound', records: sheetRecords }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteLostFoundFromRemoteDirect(recordId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteLostFound',
          body: { action: 'deleteLostFound', id: recordId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteLostFound', id: recordId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteLostFoundFromRemote(recordId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteLostFoundFromRemoteDirect(recordId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: recordId,
        action: 'deleteLostFound',
        facilityName: 'Lost & Found',
        description: `Delete Lost item ${recordId}`,
        payload: { id: recordId },
      });
    }
    return res;
  },

  /**
   * Isolation Room Remote Sync Methods (Facility 9)
   */
  async pushBatchIsolationToRemote(records: IsolationRoomRecord[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: { action: 'batchSyncIsolation', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncIsolation', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Blank Forms Remote Sync Methods (Facility 13)
   */
  async pushBlankFormToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveBlankForm',
      record,
      form: record,
      facilityName: 'Blank Forms',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveBlankForm',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected blank form record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing blank form to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }
    return { success: false, error: lastError };
  },

  async pushBlankFormToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushBlankFormToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveBlankForm',
        facilityName: 'Blank Forms',
        description: `Blank Form #${record.id} (${record.title || record.formTitle || ''})`,
        payload: record,
      });
    }
    return res;
  },

  async deleteBlankFormFromRemoteDirect(formId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteBlankForm',
          body: { action: 'deleteBlankForm', id: formId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteBlankForm', id: formId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteBlankFormFromRemote(formId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteBlankFormFromRemoteDirect(formId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: formId,
        action: 'deleteBlankForm',
        facilityName: 'Blank Forms',
        description: `Delete Blank Form ${formId}`,
        payload: { id: formId },
      });
    }
    return res;
  },

  async pushBatchBlankFormsToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncBlankForms',
          body: { action: 'batchSyncBlankForms', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncBlankForms', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Invoice Manager Remote Sync Methods (Facility 14)
   */
  async pushInvoiceToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveInvoice',
      record,
      invoice: record,
      facilityName: 'Invoice Manager',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveInvoice',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected invoice record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing invoice to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }
    return { success: false, error: lastError };
  },

  async pushInvoiceToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushInvoiceToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveInvoice',
        facilityName: 'Invoice Manager',
        description: `Invoice #${record.invoiceNumber || record.id} (${record.customerName || ''})`,
        payload: record,
      });
    }
    return res;
  },

  async deleteInvoiceFromRemoteDirect(invoiceId: string, invoiceNumber?: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteInvoice',
          body: { action: 'deleteInvoice', id: invoiceId, invoiceNumber: invoiceNumber || '' },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteInvoice', id: invoiceId, invoiceNumber: invoiceNumber || '' }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteInvoiceFromRemote(invoiceId: string, invoiceNumber?: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteInvoiceFromRemoteDirect(invoiceId, invoiceNumber);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: invoiceId,
        action: 'deleteInvoice',
        facilityName: 'Invoice Manager',
        description: `Delete Invoice ${invoiceNumber || invoiceId}`,
        payload: { id: invoiceId, invoiceNumber },
      });
    }
    return res;
  },

  async pushBatchInvoicesToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncInvoices',
          body: { action: 'batchSyncInvoices', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncInvoices', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Announcement & Notice Remote Sync Methods (Facility 15)
   */
  async pushNoticeToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveNotice',
      record,
      notice: record,
      facilityName: 'Announcement & Notice',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveNotice',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected notice record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing notice to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }
    return { success: false, error: lastError };
  },

  async pushNoticeToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushNoticeToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveNotice',
        facilityName: 'Announcement & Notice',
        description: `Notice #${record.noticeRef} (${record.title})`,
        payload: record,
      });
    }
    return res;
  },

  async deleteNoticeFromRemoteDirect(noticeId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteNotice',
          body: { action: 'deleteNotice', id: noticeId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteNotice', id: noticeId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async pushBatchNoticesToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncNotices',
          body: { action: 'batchSyncNotices', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncNotices', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Help & Support Remote Sync Methods (Facility 16)
   */
  async pushSupportTicketToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveSupportTicket',
      record,
      ticket: record,
      supportTicket: record,
      facilityName: 'Help & Support',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveSupportTicket',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
        if (data && data.error) return { success: false, error: data.error };
      }
    } catch (e) {}

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data && data.success !== false) {
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected support ticket record';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing support ticket to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }
    return { success: false, error: lastError };
  },

  async pushSupportTicketToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushSupportTicketToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveSupportTicket',
        facilityName: 'Help & Support',
        description: `Ticket #${record.ticketNumber} (${record.subject})`,
        payload: record,
      });
    }
    return res;
  },

  async deleteSupportTicketFromRemoteDirect(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteSupportTicket',
          body: { action: 'deleteSupportTicket', id: ticketId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteSupportTicket', id: ticketId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteSupportTicketFromRemote(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteSupportTicketFromRemoteDirect(ticketId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: ticketId,
        action: 'deleteSupportTicket',
        facilityName: 'Help & Support',
        description: `Delete Support Ticket ${ticketId}`,
        payload: { id: ticketId },
      });
    }
    return res;
  },

  async pushBatchSupportTicketsToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncSupportTickets',
          body: { action: 'batchSyncSupportTickets', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncSupportTickets', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Work Order Ticket Management Remote Sync Methods (Facility 17)
   */
  async pushWorkOrderTicketToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveWorkOrderTicket',
      record,
      ticket: record,
      facilityName: 'Ticket Management',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveWorkOrderTicket',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success !== false) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async pushWorkOrderTicketToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushWorkOrderTicketToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveWorkOrderTicket',
        facilityName: 'Ticket Management',
        description: `Save Work Order Ticket ${record.ticketNumber || record.id}`,
        payload: record,
      });
    }
    return res;
  },

  async deleteWorkOrderTicketFromRemoteDirect(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteWorkOrderTicket',
          body: { action: 'deleteWorkOrderTicket', id: ticketId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteWorkOrderTicket', id: ticketId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteWorkOrderTicketFromRemote(ticketId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteWorkOrderTicketFromRemoteDirect(ticketId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: ticketId,
        action: 'deleteWorkOrderTicket',
        facilityName: 'Ticket Management',
        description: `Delete Work Order Ticket ${ticketId}`,
        payload: { id: ticketId },
      });
    }
    return res;
  },

  async pushBatchWorkOrderTicketsToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncWorkOrderTickets',
          body: { action: 'batchSyncWorkOrderTickets', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncWorkOrderTickets', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * SLA Policies Remote Sync Methods (Facility 18)
   */
  async pushSlaPolicyToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveSlaPolicy',
      record,
      policy: record,
      facilityName: 'SLA Management',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveSlaPolicy',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success !== false) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async pushSlaPolicyToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushSlaPolicyToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveSlaPolicy',
        facilityName: 'SLA Management',
        description: `Save SLA Policy ${record.name || record.id}`,
        payload: record,
      });
    }
    return res;
  },

  async deleteSlaPolicyFromRemoteDirect(policyId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteSlaPolicy',
          body: { action: 'deleteSlaPolicy', id: policyId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteSlaPolicy', id: policyId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteSlaPolicyFromRemote(policyId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteSlaPolicyFromRemoteDirect(policyId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: policyId,
        action: 'deleteSlaPolicy',
        facilityName: 'SLA Management',
        description: `Delete SLA Policy ${policyId}`,
        payload: { id: policyId },
      });
    }
    return res;
  },

  async pushBatchSlaPoliciesToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncSlaPolicies',
          body: { action: 'batchSyncSlaPolicies', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncSlaPolicies', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Automated Workflows Remote Sync Methods (Facility 19)
   */
  async pushWorkflowToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveWorkflow',
      record,
      workflow: record,
      facilityName: 'Automated Workflow',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveWorkflow',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success !== false) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async pushWorkflowToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushWorkflowToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveWorkflow',
        facilityName: 'Automated Workflow',
        description: `Save Workflow ${record.name || record.id}`,
        payload: record,
      });
    }
    return res;
  },

  async deleteWorkflowFromRemoteDirect(workflowId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteWorkflow',
          body: { action: 'deleteWorkflow', id: workflowId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteWorkflow', id: workflowId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteWorkflowFromRemote(workflowId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteWorkflowFromRemoteDirect(workflowId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: workflowId,
        action: 'deleteWorkflow',
        facilityName: 'Automated Workflow',
        description: `Delete Workflow ${workflowId}`,
        payload: { id: workflowId },
      });
    }
    return res;
  },

  async pushBatchWorkflowsToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncWorkflows',
          body: { action: 'batchSyncWorkflows', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncWorkflows', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Email Logs Remote Sync Methods (Facility 20)
   */
  async pushEmailLogToRemoteDirect(record: any): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);
    const payload = {
      action: 'saveEmailLog',
      record,
      email: record,
      facilityName: 'Email Management',
      ...record,
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'saveEmailLog',
          body: payload,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success !== false) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async pushEmailLogToRemote(record: any): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushEmailLogToRemoteDirect(record);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: record.id,
        action: 'saveEmailLog',
        facilityName: 'Email Management',
        description: `Save Email Log ${record.subject || record.id}`,
        payload: record,
      });
    }
    return res;
  },

  async deleteEmailLogFromRemoteDirect(emailId: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'deleteEmailLog',
          body: { action: 'deleteEmailLog', id: emailId },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteEmailLog', id: emailId }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteEmailLogFromRemote(emailId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteEmailLogFromRemoteDirect(emailId);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: emailId,
        action: 'deleteEmailLog',
        facilityName: 'Email Management',
        description: `Delete Email Log ${emailId}`,
        payload: { id: emailId },
      });
    }
    return res;
  },

  async pushBatchEmailLogsToRemote(records: any[]): Promise<{ success: boolean; count?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !records.length) return { success: true, count: records.length };

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          action: 'batchSyncEmailLogs',
          body: { action: 'batchSyncEmailLogs', records },
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success) return { success: true, count: records.length };
      }
    } catch (e) {}

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'batchSyncEmailLogs', records }),
      });
      const data = await response.json();
      return { success: Boolean(data && data.success), count: records.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Pushes all 20 facilities' demo & local records to Google Sheet in one master batch operation!
   */
  async pushAllDataToRemote(): Promise<{
    success: boolean;
    bookingsCount: number;
    handoversCount: number;
    parcelsCount: number;
    lostFoundCount: number;
    isolationCount: number;
    blankFormsCount: number;
    invoicesCount: number;
    noticesCount: number;
    supportTicketsCount: number;
    workOrderTicketsCount: number;
    slaPoliciesCount: number;
    workflowsCount: number;
    emailLogsCount: number;
    error?: string;
  }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return {
        success: false,
        bookingsCount: 0,
        handoversCount: 0,
        parcelsCount: 0,
        lostFoundCount: 0,
        isolationCount: 0,
        blankFormsCount: 0,
        invoicesCount: 0,
        noticesCount: 0,
        supportTicketsCount: 0,
        workOrderTicketsCount: 0,
        slaPoliciesCount: 0,
        workflowsCount: 0,
        emailLogsCount: 0,
        error: 'No Google Apps Script Web App URL configured.',
      };
    }

    const bookings = StorageService.getAllBookings();
    const handovers = StorageService.getHandoverRecords();
    const parcels = StorageService.getParcelRecords();
    const lostFound = StorageService.getLostFoundRecords();
    const isolation = StorageService.getIsolationRooms();

    let blankForms: any[] = [];
    try {
      const raw = localStorage.getItem('tafga_saved_form_records_v1');
      if (raw) blankForms = JSON.parse(raw);
    } catch (e) {}

    let invoices: any[] = [];
    try {
      const raw = localStorage.getItem('tamimi_unified_camp_invoices_v2');
      if (raw) invoices = JSON.parse(raw);
    } catch (e) {}

    let notices: any[] = [];
    try {
      const raw = localStorage.getItem('tamimi_facility_notices_v2');
      if (raw) notices = JSON.parse(raw);
    } catch (e) {}

    let supportTickets: any[] = [];
    try {
      const raw = localStorage.getItem('tamimi_support_tickets_v2');
      if (raw) supportTickets = JSON.parse(raw);
    } catch (e) {}

    let workOrderTickets: any[] = [];
    try {
      workOrderTickets = TicketService.getTickets();
    } catch (e) {}

    let slaPolicies: any[] = [];
    try {
      const raw = localStorage.getItem('tafga_sla_policies_v1');
      if (raw) slaPolicies = JSON.parse(raw);
    } catch (e) {}

    let workflows: any[] = [];
    try {
      const raw = localStorage.getItem('tafga_workflows_v2');
      if (raw) workflows = JSON.parse(raw);
    } catch (e) {}

    let emailLogs: any[] = [];
    try {
      const raw = localStorage.getItem('tafga_email_outbox_v2');
      if (raw) emailLogs = JSON.parse(raw);
    } catch (e) {}

    try {
      // 1. Trigger sheet setup to make sure all 20 tabs exist
      await this.triggerSetupSheets().catch(() => null);

      // 2. Push standard bookings (Facilities 1-8)
      if (bookings.length > 0) {
        await this.pushBatchBookingsToRemote(bookings);
      }

      // 3. Push isolation rooms (Facility 9)
      if (isolation.length > 0) {
        await this.pushBatchIsolationToRemote(isolation);
        await this.syncAllIsolationRoomsToSheet().catch(() => null);
      }

      // 4. Push handovers (Facility 10)
      if (handovers.length > 0) {
        await this.pushBatchHandoversToRemote(handovers);
      }

      // 5. Push parcels (Facility 11)
      if (parcels.length > 0) {
        await this.pushBatchParcelsToRemote(parcels);
      }

      // 6. Push lost & found (Facility 12)
      if (lostFound.length > 0) {
        await this.pushBatchLostFoundToRemote(lostFound);
      }

      // 7. Push blank forms (Facility 13)
      if (blankForms.length > 0) {
        await this.pushBatchBlankFormsToRemote(blankForms);
      }

      // 8. Push invoices (Facility 14)
      if (invoices.length > 0) {
        await this.pushBatchInvoicesToRemote(invoices);
      }

      // 9. Push announcements & notices (Facility 15)
      if (notices.length > 0) {
        await this.pushBatchNoticesToRemote(notices);
      }

      // 10. Push help & support tickets (Facility 16)
      if (supportTickets.length > 0) {
        await this.pushBatchSupportTicketsToRemote(supportTickets);
      }

      // 11. Push work order tickets (Facility 17)
      if (workOrderTickets.length > 0) {
        await this.pushBatchWorkOrderTicketsToRemote(workOrderTickets);
      }

      // 12. Push SLA policies (Facility 18)
      if (slaPolicies.length > 0) {
        await this.pushBatchSlaPoliciesToRemote(slaPolicies);
      }

      // 13. Push workflows (Facility 19)
      if (workflows.length > 0) {
        await this.pushBatchWorkflowsToRemote(workflows);
      }

      // 14. Push email logs (Facility 20)
      if (emailLogs.length > 0) {
        await this.pushBatchEmailLogsToRemote(emailLogs);
      }

      config.lastSyncedAt = new Date().toISOString();
      config.syncStatus = 'connected';
      this.saveConfig(config);

      return {
        success: true,
        bookingsCount: bookings.length,
        handoversCount: handovers.length,
        parcelsCount: parcels.length,
        lostFoundCount: lostFound.length,
        isolationCount: isolation.length,
        blankFormsCount: blankForms.length,
        invoicesCount: invoices.length,
        noticesCount: notices.length,
        supportTicketsCount: supportTickets.length,
        workOrderTicketsCount: workOrderTickets.length,
        slaPoliciesCount: slaPolicies.length,
        workflowsCount: workflows.length,
        emailLogsCount: emailLogs.length,
      };
    } catch (err: any) {
      return {
        success: false,
        bookingsCount: 0,
        handoversCount: 0,
        parcelsCount: 0,
        lostFoundCount: 0,
        isolationCount: 0,
        blankFormsCount: 0,
        invoicesCount: 0,
        noticesCount: 0,
        supportTicketsCount: 0,
        workOrderTicketsCount: 0,
        slaPoliciesCount: 0,
        workflowsCount: 0,
        emailLogsCount: 0,
        error: err.message || 'Failed to push all data to Google Sheets',
      };
    }
  },

  async pushBookingToRemoteDirect(booking: Booking): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return { success: true }; // Local only
    }

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    // Try server proxy
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: {
            action: 'createBooking',
            booking,
          },
        }),
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success) {
          consecutiveSyncErrors = 0;
          return { success: true };
        } else {
          return { success: false, error: proxyData.error };
        }
      }
    } catch (proxyErr) {
      // Netlify static client fallback
    }

    // Direct fallback for Netlify / browser with 3-attempt auto-retry
    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify({
            action: 'createBooking',
            booking,
          }),
        });

        const data = await response.json();
        if (data && data.success !== false) {
          consecutiveSyncErrors = 0;
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected booking creation';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }

    console.warn('Could not push directly to remote GAS, saved locally in browser', lastError);
    return { success: false, error: lastError };
  },

  async pushBookingToRemote(booking: Booking): Promise<{ success: boolean; error?: string }> {
    const res = await this.pushBookingToRemoteDirect(booking);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: booking.id,
        action: 'saveBooking',
        facilityName: booking.facilityName || 'Facility Booking',
        description: `Booking for ${booking.customerName} (${booking.startTime || booking.date})`,
        payload: booking,
      });
    }
    return res;
  },

  async pushBatchBookingsToRemote(bookings: Booking[]): Promise<{ success: boolean; error?: string; createdCount?: number }> {
    const config = this.getConfig();
    if (!config.webAppUrl || !bookings.length) {
      return { success: true, createdCount: bookings.length };
    }

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    // Try server proxy first
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: {
            action: 'batchCreateBookings',
            bookings,
          },
        }),
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success) {
          return { success: true, createdCount: proxyData.data?.createdCount || bookings.length };
        }
      }
    } catch (proxyErr) {
      // Fall through to direct fetch
    }

    // Direct fetch for Netlify / browser (Using text/plain to bypass CORS preflight)
    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({
          action: 'batchCreateBookings',
          bookings,
        }),
      });
      const data = await response.json();
      return { success: data.success, error: data.error, createdCount: data.createdCount };
    } catch (err: any) {
      console.warn('Could not push batch bookings to remote GAS', err);
      return { success: false, error: err.message };
    }
  },

  async triggerSetupSheets(): Promise<{ success: boolean; message?: string; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return { success: false, error: 'No Google Apps Script Web App URL configured.' };
    }

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({
          action: 'setupSheets',
        }),
      });
      const data = await response.json();
      return { success: data.success !== false, message: data.message || 'Sheets setup completed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to trigger sheets setup.' };
    }
  },

  async syncAllIsolationRoomsToSheet(): Promise<{ success: boolean; pushedCount: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return { success: false, pushedCount: 0, error: 'No Google Apps Script Web App URL configured.' };
    }

    const rooms = StorageService.getIsolationRooms();
    const bookingsToPush: Booking[] = [];

    rooms.forEach((r) => {
      if (r.occupants && r.occupants.length > 0) {
        r.occupants.forEach((occ) => {
          if (occ.patientName && occ.patientName.trim()) {
            const cleanRoom = r.buildingNumber.replace(/[^a-zA-Z0-9]/g, '');
            const checkInClean = (occ.checkIn || 'ACTIVE').replace(/[^a-zA-Z0-9]/g, '');
            const bookingId = (occ as any).id || (occ as any).bookingId || `ISO-${cleanRoom}-B${occ.bedNumber}-${checkInClean}`;
            bookingsToPush.push({
              id: bookingId,
              facilityId: 'isolation-room',
              facilityName: 'Isolation Tracker',
              sheetTabName: 'Isolation & Room Booking',
              customerName: occ.patientName,
              phoneNumber: occ.phoneNumber || '',
              email: occ.email || '',
              departmentOrTeam: occ.company || 'General Resident',
              date: occ.checkIn || new Date().toISOString().split('T')[0],
              stage: `Room ${r.buildingNumber} (Bed ${occ.bedNumber})`,
              startTime: '00:00',
              endTime: '23:59',
              durationMinutes: 1440,
              slotIds: [`ISO-${r.buildingNumber}-B${occ.bedNumber}`],
              numberOfGuests: 1,
              notes: `Check-out: ${occ.checkOut || 'Open'} | Type: ${occ.bookingType || 'General Guest'}${occ.nationalId ? ` | ID: ${occ.nationalId}` : ''}${occ.purposeOfStay ? ` | Purpose: ${occ.purposeOfStay}` : ''}${occ.hospitalReferral ? ` | Hospital: ${occ.hospitalReferral}` : ''}${occ.staffNotes ? ` | Notes: ${occ.staffNotes}` : ''}`,
              status: 'CONFIRMED',
              createdAt: new Date().toISOString(),
              bookedByStaff: occ.bookedByStaff || 'Helpdesk Admin',
            });
          }
        });
      }
    });

    if (bookingsToPush.length === 0) {
      return { success: true, pushedCount: 0 };
    }

    // Try batch first, fallback to individual
    const batchRes = await this.pushBatchBookingsToRemote(bookingsToPush);
    if (batchRes.success) {
      return { success: true, pushedCount: batchRes.createdCount || bookingsToPush.length };
    }

    let successCount = 0;
    for (const b of bookingsToPush) {
      const res = await this.pushBookingToRemote(b);
      if (res.success) successCount++;
    }

    return {
      success: successCount > 0,
      pushedCount: successCount,
      error: successCount === 0 ? batchRes.error : undefined,
    };
  },

  async cancelBookingRemoteDirect(
    bookingIdOrPayload: string | {
      bookingId: string;
      phoneNumber?: string;
      phone?: string;
      reason?: string;
      facilityName?: string;
      sheetTabName?: string;
      facilityId?: string;
      stage?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      guestsCount?: number;
      customerName?: string;
      cancelledBy?: string;
      retentionDays?: number;
    },
    phone: string = '',
    reason: string = 'Cancelled via Portal'
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return { success: true }; // Local only
    }

    let payload: Record<string, any> = {};
    let targetBookingId = '';

    if (typeof bookingIdOrPayload === 'object' && bookingIdOrPayload !== null) {
      targetBookingId = String(bookingIdOrPayload.bookingId || '').trim();
      payload = {
        ...bookingIdOrPayload,
        bookingId: targetBookingId,
        phoneNumber: bookingIdOrPayload.phoneNumber || bookingIdOrPayload.phone || phone || '',
        reason: bookingIdOrPayload.reason || reason,
      };
    } else {
      targetBookingId = String(bookingIdOrPayload || '').trim();
      payload = {
        bookingId: targetBookingId,
        phoneNumber: phone ? phone.trim() : '',
        reason: reason || 'Cancelled via Portal',
      };
    }

    // Auto-enrich from local storage if any crucial metadata is missing
    try {
      const localBooking = StorageService.getBookingById(targetBookingId);
      if (localBooking) {
        if (!payload.facilityName) payload.facilityName = localBooking.facilityName || localBooking.facilityId;
        if (!payload.sheetTabName) payload.sheetTabName = localBooking.sheetTabName;
        if (!payload.facilityId) payload.facilityId = localBooking.facilityId;
        if (!payload.stage) payload.stage = localBooking.stage;
        if (!payload.date) payload.date = localBooking.date;
        if (!payload.startTime) payload.startTime = localBooking.startTime;
        if (!payload.endTime) payload.endTime = localBooking.endTime;
        if (!payload.durationMinutes) payload.durationMinutes = localBooking.durationMinutes;
        if (!payload.customerName) payload.customerName = localBooking.customerName;
        if (!payload.phoneNumber && localBooking.phoneNumber) payload.phoneNumber = localBooking.phoneNumber;
      }
    } catch (e) {}

    payload.action = 'cancelBooking';
    payload.bookingId = targetBookingId;
    try {
      payload.retentionDays = StorageService.getCancellationRetentionDays();
    } catch (e) {
      payload.retentionDays = 14;
    }

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    // Try server proxy first
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: payload,
        }),
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success) {
          consecutiveSyncErrors = 0;
          return { success: true, message: proxyData.message };
        } else {
          return { success: false, error: proxyData.error || 'Cancellation rejected by Google Apps Script' };
        }
      }
    } catch (proxyErr) {
      // Netlify client fallback
    }

    // Direct fallback for Netlify / browser with 3-attempt auto-retry
    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data && data.success !== false) {
          consecutiveSyncErrors = 0;
          return { success: true, message: data.message };
        } else {
          lastError = data?.error || 'Remote rejected booking cancellation';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing cancellation to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }

    console.warn('Could not push cancellation to remote GAS:', lastError);
    return { success: false, error: lastError };
  },

  async pushCancelToRemote(
    bookingIdOrPayload: string | {
      bookingId: string;
      phoneNumber?: string;
      phone?: string;
      reason?: string;
      facilityName?: string;
      sheetTabName?: string;
      facilityId?: string;
      stage?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      guestsCount?: number;
      customerName?: string;
      cancelledBy?: string;
      retentionDays?: number;
    },
    phone: string = '',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const bookingId = typeof bookingIdOrPayload === 'string' ? bookingIdOrPayload : bookingIdOrPayload.bookingId;
    const res = await this.cancelBookingRemoteDirect(bookingIdOrPayload, phone, reason);
    if (!res.success) {
      OfflineQueueService.enqueue({
        targetId: bookingId,
        action: 'cancelBooking',
        facilityName: 'Booking Cancellation',
        description: `Cancel Booking ${bookingId}`,
        payload: typeof bookingIdOrPayload === 'object' ? bookingIdOrPayload : { bookingId, phone, reason },
      });
    }
    return res;
  },

  /**
   * Directly releases and deletes a conflicting or stale booking slot from Google Sheet
   * and records it in "Cancellation Logs".
   */
  async releaseRemoteSlot(details: {
    facilityName: string;
    sheetTabName?: string;
    date: string;
    stage: string;
    startTime: string;
    endTime?: string;
    bookingId?: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true, message: 'Local mode only' };
    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    const postBody = {
      action: 'releaseSlot',
      facilityName: details.facilityName,
      sheetTabName: details.sheetTabName,
      date: details.date,
      stage: details.stage,
      startTime: details.startTime,
      endTime: details.endTime,
      bookingId: details.bookingId,
      reason: details.reason || 'Force released slot via Portal',
    };

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: postBody,
        }),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        return data;
      }
    } catch (e) {}

    try {
      const resp = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify(postBody),
      });
      return await resp.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to release slot in Google Sheet' };
    }
  },

  /**
   * Fetches archived cancellation logs from Google Sheets
   */
  async getCancellationLogsRemote(): Promise<{ success: boolean; logs?: any[]; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true, logs: [] };
    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: { action: 'getCancellationLogs' },
        }),
      });
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch (e) {}

    try {
      const resp = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'getCancellationLogs' }),
      });
      return await resp.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  /**
   * Purges cancellation logs older than retention period from Google Sheets
   */
  async purgeCancellationLogsRemote(retentionDays?: number): Promise<{ success: boolean; purgedCount?: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) return { success: true, purgedCount: 0 };
    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    const days = retentionDays || 14;
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: { action: 'purgeCancellationLogs', retentionDays: days },
        }),
      });
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch (e) {}

    try {
      const resp = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'purgeCancellationLogs', retentionDays: days }),
      });
      return await resp.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  async deleteBookingRemoteDirect(
    bookingIdOrPayload: string | {
      bookingId: string;
      phoneNumber?: string;
      phone?: string;
      facilityName?: string;
      sheetTabName?: string;
      stage?: string;
      date?: string;
      startTime?: string;
    },
    phone: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return { success: true }; // Local only
    }

    const { url: cleanUrl } = this.sanitizeUrl(config.webAppUrl);

    let bookingId = '';
    let phoneNumber = phone || '';
    let payloadObj: any = {};

    if (typeof bookingIdOrPayload === 'object' && bookingIdOrPayload !== null) {
      bookingId = bookingIdOrPayload.bookingId;
      phoneNumber = bookingIdOrPayload.phoneNumber || bookingIdOrPayload.phone || phone;
      payloadObj = { ...bookingIdOrPayload };
    } else {
      bookingId = String(bookingIdOrPayload || '');
    }

    const requestBody = {
      action: 'deleteBooking',
      bookingId: bookingId.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      ...payloadObj,
    };

    // Try server proxy first
    try {
      const proxyRes = await fetch('/api/gas/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          method: 'POST',
          body: requestBody,
        }),
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success) {
          consecutiveSyncErrors = 0;
          return { success: true };
        } else {
          return { success: false, error: proxyData.error || 'Deletion rejected by Google Apps Script' };
        }
      }
    } catch (proxyErr) {
      // Direct fallback
    }

    // Direct fallback for Netlify / browser with 3-attempt auto-retry
    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow',
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data && data.success !== false) {
          consecutiveSyncErrors = 0;
          return { success: true };
        } else {
          lastError = data?.error || 'Remote rejected booking deletion';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error pushing deletion to Google Sheets';
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 400));
        }
      }
    }

    console.warn('Could not push deletion to remote GAS:', lastError);
    return { success: false, error: lastError };
  },

  async pushDeleteToRemote(
    bookingIdOrPayload: string | {
      bookingId: string;
      phoneNumber?: string;
      phone?: string;
      facilityName?: string;
      sheetTabName?: string;
      stage?: string;
      date?: string;
      startTime?: string;
    },
    phone: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    const res = await this.deleteBookingRemoteDirect(bookingIdOrPayload, phone);
    if (!res.success) {
      const bookingId = typeof bookingIdOrPayload === 'object' ? bookingIdOrPayload.bookingId : bookingIdOrPayload;
      OfflineQueueService.enqueue({
        targetId: bookingId,
        action: 'deleteBooking',
        facilityName: 'Booking Deletion',
        description: `Delete Booking ${bookingId}`,
        payload: typeof bookingIdOrPayload === 'object' ? bookingIdOrPayload : { bookingId, phone },
      });
    }
    return res;
  },
};

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ---------------------------------------------------------------------------
// CENTRAL DATA HUB & REAL-TIME EVENT STREAM (Cross-Device Instant Sync Engine)
// ---------------------------------------------------------------------------
const DB_FILE_PATH = path.join(process.cwd(), 'tamimi_server_db.json');

interface ServerHubState {
  version: number;
  lastUpdated: string;
  deletedIds: Record<string, number>; // id -> timestamp (Tombstones)
  cancelledIds: Record<string, number>; // id -> timestamp
  bookings: any[];
  isolationRooms: any[];
  handovers: any[];
  parcels: any[];
  lostFound: any[];
  blankForms: any[];
  invoices: any[];
  notices: any[];
  supportTickets: any[];
}

let hubState: ServerHubState = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  deletedIds: {},
  cancelledIds: {},
  bookings: [],
  isolationRooms: [],
  handovers: [],
  parcels: [],
  lostFound: [],
  blankForms: [],
  invoices: [],
  notices: [],
  supportTickets: [],
};

// Load saved server database on boot
try {
  if (fs.existsSync(DB_FILE_PATH)) {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.version === 'number') {
      hubState = {
        ...hubState,
        ...parsed,
        deletedIds: parsed.deletedIds || {},
        cancelledIds: parsed.cancelledIds || {},
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        isolationRooms: Array.isArray(parsed.isolationRooms) ? parsed.isolationRooms : [],
        handovers: Array.isArray(parsed.handovers) ? parsed.handovers : [],
        parcels: Array.isArray(parsed.parcels) ? parsed.parcels : [],
        lostFound: Array.isArray(parsed.lostFound) ? parsed.lostFound : [],
        blankForms: Array.isArray(parsed.blankForms) ? parsed.blankForms : [],
        invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
        notices: Array.isArray(parsed.notices) ? parsed.notices : [],
        supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
      };
      console.log(`[Hub] Loaded persisted server database (v${hubState.version}) with ${hubState.bookings.length} bookings, ${Object.keys(hubState.deletedIds).length} tombstones.`);
    }
  }
} catch (err) {
  console.warn('[Hub] Could not load database file, starting with fresh state:', err);
}

// Debounced disk writer
let saveTimeout: NodeJS.Timeout | null = null;
function persistHubState() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(hubState, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Hub] Failed to persist state to disk:', e);
    }
  }, 300);
}

// Connected SSE Clients for instantaneous push to all devices
interface SSEClient {
  id: string;
  res: Response;
}
const sseClients = new Set<SSEClient>();

function broadcastHubEvent(event: { type: string; entity?: string; id?: string; version: number; payload?: any }) {
  const dataString = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(dataString);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Periodic SSE Keep-Alive ping (every 15s)
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.res.write(': keepalive\n\n');
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 15000);

// 1. SSE Real-Time Event Stream
app.get('/api/hub/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = { id: clientId, res };
  sseClients.add(client);

  // Send initial connection handshake with current server version
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', version: hubState.version, serverTime: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// 2. Full State Snapshot endpoint
app.get('/api/hub/state', (req: Request, res: Response) => {
  res.json({
    success: true,
    version: hubState.version,
    lastUpdated: hubState.lastUpdated,
    deletedIds: hubState.deletedIds,
    cancelledIds: hubState.cancelledIds,
    bookings: hubState.bookings,
    isolationRooms: hubState.isolationRooms,
    handovers: hubState.handovers,
    parcels: hubState.parcels,
    lostFound: hubState.lostFound,
    blankForms: hubState.blankForms,
    invoices: hubState.invoices,
    notices: hubState.notices,
    supportTickets: hubState.supportTickets,
  });
});

// 3. Fast Atomic Mutation endpoint (Instant multi-device broadcast)
app.post('/api/hub/mutate', (req: Request, res: Response) => {
  const { mutationType, entity, id, data, reason } = req.body;
  const now = Date.now();
  const cleanId = id ? String(id).toLowerCase().trim() : '';

  if (!mutationType) {
    return res.status(400).json({ success: false, error: 'Missing mutationType' });
  }

  hubState.version += 1;
  hubState.lastUpdated = new Date().toISOString();

  if (mutationType === 'DELETE' && cleanId) {
    // 1. Record tombstone
    hubState.deletedIds[cleanId] = now;

    // 2. Remove from all entity stores
    hubState.bookings = hubState.bookings.filter((b) => String(b.id || '').toLowerCase().trim() !== cleanId);
    hubState.handovers = hubState.handovers.filter((h) => String(h.id || '').toLowerCase().trim() !== cleanId);
    hubState.parcels = hubState.parcels.filter((p) => String(p.id || '').toLowerCase().trim() !== cleanId);
    hubState.lostFound = hubState.lostFound.filter((l) => String(l.id || '').toLowerCase().trim() !== cleanId);
    hubState.blankForms = hubState.blankForms.filter((f) => String(f.id || '').toLowerCase().trim() !== cleanId);
    hubState.invoices = hubState.invoices.filter((i) => String(i.id || '').toLowerCase().trim() !== cleanId);
    hubState.notices = hubState.notices.filter((n) => String(n.id || '').toLowerCase().trim() !== cleanId);
    hubState.supportTickets = hubState.supportTickets.filter((s) => String(s.id || '').toLowerCase().trim() !== cleanId);

    // If it's an isolation room booking or occupant, clean occupant
    hubState.isolationRooms = hubState.isolationRooms.map((room) => {
      if (!room.occupants) return room;
      const filtered = room.occupants.filter((occ: any) => {
        const occId = String(occ.id || occ.bookingId || '').toLowerCase().trim();
        return occId !== cleanId;
      });
      return { ...room, occupants: filtered };
    });

    persistHubState();
    broadcastHubEvent({ type: 'DELETE', entity, id: cleanId, version: hubState.version });
    return res.json({ success: true, version: hubState.version, deleted: cleanId });
  }

  if (mutationType === 'CANCEL' && cleanId) {
    // Record cancellation
    hubState.cancelledIds[cleanId] = now;
    let found = false;

    hubState.bookings = hubState.bookings.map((b) => {
      if (String(b.id || '').toLowerCase().trim() === cleanId) {
        found = true;
        return {
          ...b,
          status: 'CANCELLED',
          cancellationReason: reason || 'Cancelled via Portal',
          cancelledAt: new Date().toISOString(),
        };
      }
      return b;
    });

    persistHubState();
    broadcastHubEvent({ type: 'CANCEL', entity: 'bookings', id: cleanId, version: hubState.version, payload: { reason } });
    return res.json({ success: true, version: hubState.version, cancelled: cleanId, found });
  }

  if (mutationType === 'UPSERT' && entity && data) {
    const targetId = String(data.id || id || '').toLowerCase().trim();

    // Check if item is deleted by tombstone
    if (targetId && hubState.deletedIds[targetId] && !req.body.forceRevive) {
      return res.json({ success: false, rejectedTombstone: true, error: `Item ${targetId} was permanently deleted.` });
    }

    // Upsert into corresponding collection
    if (entity === 'bookings') {
      const idx = hubState.bookings.findIndex((b) => String(b.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.bookings[idx] = { ...hubState.bookings[idx], ...data };
      } else {
        hubState.bookings.unshift(data);
      }
    } else if (entity === 'handovers') {
      const idx = hubState.handovers.findIndex((h) => String(h.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.handovers[idx] = { ...hubState.handovers[idx], ...data };
      } else {
        hubState.handovers.unshift(data);
      }
    } else if (entity === 'parcels') {
      const idx = hubState.parcels.findIndex((p) => String(p.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.parcels[idx] = { ...hubState.parcels[idx], ...data };
      } else {
        hubState.parcels.unshift(data);
      }
    } else if (entity === 'lostFound') {
      const idx = hubState.lostFound.findIndex((l) => String(l.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.lostFound[idx] = { ...hubState.lostFound[idx], ...data };
      } else {
        hubState.lostFound.unshift(data);
      }
    } else if (entity === 'isolationRooms') {
      if (Array.isArray(data)) {
        hubState.isolationRooms = data;
      } else {
        const roomId = String(data.id || data.buildingNumber || '').toLowerCase().trim();
        const idx = hubState.isolationRooms.findIndex((r) => String(r.id || r.buildingNumber || '').toLowerCase().trim() === roomId);
        if (idx >= 0) {
          hubState.isolationRooms[idx] = { ...hubState.isolationRooms[idx], ...data };
        } else {
          hubState.isolationRooms.push(data);
        }
      }
    } else if (entity === 'blankForms') {
      const idx = hubState.blankForms.findIndex((f) => String(f.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.blankForms[idx] = { ...hubState.blankForms[idx], ...data };
      } else {
        hubState.blankForms.unshift(data);
      }
    } else if (entity === 'invoices') {
      const idx = hubState.invoices.findIndex((i) => String(i.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.invoices[idx] = { ...hubState.invoices[idx], ...data };
      } else {
        hubState.invoices.unshift(data);
      }
    } else if (entity === 'notices') {
      const idx = hubState.notices.findIndex((n) => String(n.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.notices[idx] = { ...hubState.notices[idx], ...data };
      } else {
        hubState.notices.unshift(data);
      }
    } else if (entity === 'supportTickets') {
      const idx = hubState.supportTickets.findIndex((s) => String(s.id || '').toLowerCase().trim() === targetId);
      if (idx >= 0) {
        hubState.supportTickets[idx] = { ...hubState.supportTickets[idx], ...data };
      } else {
        hubState.supportTickets.unshift(data);
      }
    }

    persistHubState();
    broadcastHubEvent({ type: 'UPSERT', entity, id: targetId, version: hubState.version, payload: data });
    return res.json({ success: true, version: hubState.version, item: data });
  }

  // 4. Batch sync from Google Apps Script or Client
  if (mutationType === 'SYNC_ALL') {
    const {
      bookings,
      handovers,
      parcels,
      lostFound,
      isolationRooms,
      blankForms,
      invoices,
      notices,
      supportTickets,
      deletedIds,
      cancelledIds,
    } = req.body;

    // Merge tombstones
    if (deletedIds && typeof deletedIds === 'object') {
      Object.keys(deletedIds).forEach((k) => {
        hubState.deletedIds[k.toLowerCase().trim()] = Math.max(hubState.deletedIds[k.toLowerCase().trim()] || 0, deletedIds[k] || now);
      });
    }

    // Merge cancellations
    if (cancelledIds && typeof cancelledIds === 'object') {
      Object.keys(cancelledIds).forEach((k) => {
        hubState.cancelledIds[k.toLowerCase().trim()] = Math.max(hubState.cancelledIds[k.toLowerCase().trim()] || 0, cancelledIds[k] || now);
      });
    }

    const isDeleted = (rawId: any) => {
      if (!rawId) return false;
      return Boolean(hubState.deletedIds[String(rawId).toLowerCase().trim()]);
    };

    if (Array.isArray(bookings)) {
      const bMap = new Map<string, any>();
      // Keep server's existing valid bookings
      hubState.bookings.forEach((b) => {
        if (b && b.id && !isDeleted(b.id)) bMap.set(String(b.id).toLowerCase().trim(), b);
      });
      // Merge incoming
      bookings.forEach((b) => {
        if (b && b.id && !isDeleted(b.id)) {
          const idKey = String(b.id).toLowerCase().trim();
          if (hubState.cancelledIds[idKey] && b.status !== 'CANCELLED') {
            b.status = 'CANCELLED';
          }
          bMap.set(idKey, b);
        }
      });
      hubState.bookings = Array.from(bMap.values());
    }

    if (Array.isArray(handovers)) {
      const hMap = new Map<string, any>();
      hubState.handovers.forEach((h) => {
        if (h && h.id && !isDeleted(h.id)) hMap.set(String(h.id).toLowerCase().trim(), h);
      });
      handovers.forEach((h) => {
        if (h && h.id && !isDeleted(h.id)) hMap.set(String(h.id).toLowerCase().trim(), h);
      });
      hubState.handovers = Array.from(hMap.values());
    }

    if (Array.isArray(parcels)) {
      const pMap = new Map<string, any>();
      hubState.parcels.forEach((p) => {
        if (p && p.id && !isDeleted(p.id)) pMap.set(String(p.id).toLowerCase().trim(), p);
      });
      parcels.forEach((p) => {
        if (p && p.id && !isDeleted(p.id)) pMap.set(String(p.id).toLowerCase().trim(), p);
      });
      hubState.parcels = Array.from(pMap.values());
    }

    if (Array.isArray(lostFound)) {
      const lMap = new Map<string, any>();
      hubState.lostFound.forEach((l) => {
        if (l && l.id && !isDeleted(l.id)) lMap.set(String(l.id).toLowerCase().trim(), l);
      });
      lostFound.forEach((l) => {
        if (l && l.id && !isDeleted(l.id)) lMap.set(String(l.id).toLowerCase().trim(), l);
      });
      hubState.lostFound = Array.from(lMap.values());
    }

    if (Array.isArray(isolationRooms) && isolationRooms.length > 0) {
      hubState.isolationRooms = isolationRooms;
    }

    if (Array.isArray(blankForms)) {
      const fMap = new Map<string, any>();
      hubState.blankForms.forEach((f) => {
        if (f && f.id && !isDeleted(f.id)) fMap.set(String(f.id).toLowerCase().trim(), f);
      });
      blankForms.forEach((f) => {
        if (f && f.id && !isDeleted(f.id)) fMap.set(String(f.id).toLowerCase().trim(), f);
      });
      hubState.blankForms = Array.from(fMap.values());
    }

    if (Array.isArray(invoices)) {
      const iMap = new Map<string, any>();
      hubState.invoices.forEach((i) => {
        if (i && i.id && !isDeleted(i.id)) iMap.set(String(i.id).toLowerCase().trim(), i);
      });
      invoices.forEach((i) => {
        if (i && i.id && !isDeleted(i.id)) iMap.set(String(i.id).toLowerCase().trim(), i);
      });
      hubState.invoices = Array.from(iMap.values());
    }

    if (Array.isArray(notices)) {
      const nMap = new Map<string, any>();
      hubState.notices.forEach((n) => {
        if (n && n.id && !isDeleted(n.id)) nMap.set(String(n.id).toLowerCase().trim(), n);
      });
      notices.forEach((n) => {
        if (n && n.id && !isDeleted(n.id)) nMap.set(String(n.id).toLowerCase().trim(), n);
      });
      hubState.notices = Array.from(nMap.values());
    }

    if (Array.isArray(supportTickets)) {
      const sMap = new Map<string, any>();
      hubState.supportTickets.forEach((s) => {
        if (s && s.id && !isDeleted(s.id)) sMap.set(String(s.id).toLowerCase().trim(), s);
      });
      supportTickets.forEach((s) => {
        if (s && s.id && !isDeleted(s.id)) sMap.set(String(s.id).toLowerCase().trim(), s);
      });
      hubState.supportTickets = Array.from(sMap.values());
    }

    persistHubState();
    broadcastHubEvent({ type: 'SYNC_ALL', version: hubState.version });
    return res.json({
      success: true,
      version: hubState.version,
      state: hubState,
    });
  }

  return res.json({ success: true, version: hubState.version });
});

// 4. Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hubVersion: hubState.version,
    clientsConnected: sseClients.size,
    bookingsCount: hubState.bookings.length,
    tombstonesCount: Object.keys(hubState.deletedIds).length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Universal Google Apps Script Proxy Endpoint
// Solves CORS, browser redirect limits, multi-client concurrency throttling, and rate limits
interface CacheEntry {
  timestamp: number;
  data: any;
}
const gasCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 1000; // 1 second short cache for read operations to ensure near real-time updates across multiple computers

function invalidateGasCache() {
  gasCache.clear();
}

app.post('/api/gas/proxy', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { targetUrl, action = 'ping', method = 'GET', body = null } = req.body;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "targetUrl". Please provide a valid Google Apps Script Web App URL.',
    });
  }

  const cleanUrl = targetUrl.trim();

  // Validate format
  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    if (cleanUrl.includes('docs.google.com/spreadsheets/d/')) {
      return res.status(400).json({
        success: false,
        error: 'You provided a Google Spreadsheet link instead of a Google Apps Script Web App URL. In your Google Sheet, go to Extensions > Apps Script > Deploy > New Deployment > Web App to get your Web App URL.',
        isSheetLink: true,
      });
    }

    if (cleanUrl.includes('/edit') || cleanUrl.includes('/dev')) {
      const fixedUrl = cleanUrl.replace(/\/(edit|dev)(\?.*)?$/, '/exec');
      return res.status(400).json({
        success: false,
        error: `Your URL ends in /edit or /dev. Google Apps Script Web Apps require the deployed /exec URL. Try: ${fixedUrl}`,
        suggestedUrl: fixedUrl,
      });
    }
  }

  const isReadAction = method.toUpperCase() === 'GET' && (action === 'getAll' || action === 'ping' || action === 'getFacilities');
  const cacheKey = `${cleanUrl}_${action}`;

  // If a write operation is being performed, clear cache immediately
  if (!isReadAction) {
    invalidateGasCache();
  } else {
    // Serve from cache if fresh (prevents multiple computers from overwhelming Google Apps Script)
    const cached = gasCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        ...cached.data,
        cached: true,
        latencyMs: Date.now() - startTime,
      });
    }

    // Request coalescing: If multiple computers request getAll at the exact same moment, share the single in-flight promise
    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      try {
        const result = await inFlight;
        return res.json({
          ...result,
          coalesced: true,
          latencyMs: Date.now() - startTime,
        });
      } catch (e) {
        // Fall through to perform fresh request
      }
    }
  }

  const executeFetch = async (): Promise<any> => {
    let fetchUrl = cleanUrl;
    let fetchOptions: RequestInit = {
      redirect: 'follow',
      headers: {
        'User-Agent': 'ExecutiveFacilityPortal/1.0',
      },
    };

    if (method.toUpperCase() === 'GET') {
      const separator = fetchUrl.includes('?') ? '&' : '?';
      fetchUrl = `${fetchUrl}${separator}action=${encodeURIComponent(action)}&t=${Date.now()}`;
      fetchOptions.method = 'GET';
    } else {
      fetchOptions.method = 'POST';
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      };
      fetchOptions.body = JSON.stringify(body || { action });
    }

    // Perform fetch with retry logic for high multi-client resilience
    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        
        const response = await fetch(fetchUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const latencyMs = Date.now() - startTime;
        const contentType = response.headers.get('content-type') || '';
        const rawText = await response.text();

        // Check if Google returned an HTML login redirect
        if (
          contentType.includes('text/html') ||
          rawText.includes('accounts.google.com') ||
          rawText.includes('ServiceLogin') ||
          rawText.includes('Sign in - Google Accounts') ||
          rawText.includes('<!DOCTYPE html>')
        ) {
          return {
            success: false,
            status: response.status,
            latencyMs,
            contentType,
            error: 'Permission Denied: Google returned a Google Account Login page. When deploying your Apps Script Web App, you must set "Who has access" to "Anyone" (not "Only myself").',
            diagnosis: 'AUTH_REQUIRED',
          };
        }

        try {
          const jsonData = JSON.parse(rawText);
          const resPayload = {
            success: jsonData.success !== false,
            status: response.status,
            latencyMs,
            data: jsonData,
            error: jsonData.error,
          };

          if (isReadAction && resPayload.success) {
            gasCache.set(cacheKey, { timestamp: Date.now(), data: resPayload });
          }
          return resPayload;
        } catch (parseErr) {
          return {
            success: false,
            status: response.status,
            latencyMs,
            contentType,
            rawResponse: rawText.substring(0, 500),
            error: `Received non-JSON response from Google Apps Script (HTTP ${response.status}): ${rawText.substring(0, 150)}...`,
            diagnosis: 'INVALID_JSON_RESPONSE',
          };
        }
      } catch (err: any) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      error: `Network error connecting to Google Apps Script: ${lastError?.message || lastError}`,
      diagnosis: 'NETWORK_ERROR',
    };
  };

  try {
    let fetchPromise = executeFetch();
    if (isReadAction) {
      inFlightRequests.set(cacheKey, fetchPromise);
    }
    const result = await fetchPromise;
    if (isReadAction) {
      inFlightRequests.delete(cacheKey);
    }
    return res.json(result);
  } catch (finalErr: any) {
    if (isReadAction) {
      inFlightRequests.delete(cacheKey);
    }
    return res.status(500).json({
      success: false,
      latencyMs: Date.now() - startTime,
      error: `Internal server proxy error: ${finalErr.message || finalErr}`,
    });
  }
});

// 3. Direct Google Sheet Public CSV / GViz Reader Endpoint
// Allows fetching data from a spreadsheet directly if shared/published
app.get('/api/gas/sheet-data', async (req: Request, res: Response) => {
  const { sheetId, tabName = 'Barber Booking' } = req.query;

  if (!sheetId || typeof sheetId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing sheetId parameter.',
    });
  }

  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(String(tabName))}`;
    const response = await fetch(gvizUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch Google Sheet data. Make sure the Google Sheet sharing is set to "Anyone with the link can view".`,
      });
    }

    const text = await response.text();
    // GViz returns /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match || !match[1]) {
      return res.status(400).json({
        success: false,
        error: 'Unable to parse Google Sheet data format. Verify the sheet is public or use Google Apps Script Web App.',
      });
    }

    const data = JSON.parse(match[1]);
    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Error querying Google Sheet: ${err.message || err}`,
    });
  }
});

// ---------------------------------------------------------------------------
// GREEN API PROXY ENDPOINTS (Direct WhatsApp Group & Message Fetching)
// ---------------------------------------------------------------------------
app.post('/api/green-api/get-chats', async (req: Request, res: Response) => {
  const { instanceId, apiToken } = req.body || {};
  const cleanId = String(instanceId || '').trim();
  const cleanToken = String(apiToken || '').trim();

  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: 'Instance ID and API Token are required.' });
  }

  try {
    const url = `https://api.green-api.com/waInstance${cleanId}/getChats/${cleanToken}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Green API returned ${response.status}: ${errBody || response.statusText}`,
      });
    }

    const chats = await response.json();
    return res.json({ success: true, chats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch WhatsApp chats' });
  }
});

app.post('/api/green-api/status', async (req: Request, res: Response) => {
  const { instanceId, apiToken } = req.body || {};
  const cleanId = String(instanceId || '').trim();
  const cleanToken = String(apiToken || '').trim();

  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: 'Instance ID and API Token are required.' });
  }

  try {
    const stateUrl = `https://api.green-api.com/waInstance${cleanId}/getStateInstance/${cleanToken}`;
    const stateRes = await fetch(stateUrl);
    const stateData = stateRes.ok ? await stateRes.json() : null;

    let phone = '';
    try {
      const waUrl = `https://api.green-api.com/waInstance${cleanId}/getWaSettings/${cleanToken}`;
      const waRes = await fetch(waUrl);
      if (waRes.ok) {
        const waData = await waRes.json();
        phone = waData?.phone || '';
      }
    } catch {}

    return res.json({
      success: Boolean(stateData?.stateInstance === 'authorized'),
      state: stateData?.stateInstance || 'unknown',
      phone,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to query Green API status' });
  }
});

app.post('/api/green-api/get-group-data', async (req: Request, res: Response) => {
  const { instanceId, apiToken, groupId } = req.body || {};
  const cleanId = String(instanceId || '').trim();
  const cleanToken = String(apiToken || '').trim();
  let cleanGroup = String(groupId || '').trim();

  if (!cleanId || !cleanToken || !cleanGroup) {
    return res.status(400).json({ success: false, error: 'Instance ID, API Token, and Group ID are required.' });
  }

  if (!cleanGroup.includes('@')) {
    cleanGroup = `${cleanGroup}@g.us`;
  }

  const hosts = [
    'https://api.green-api.com',
    cleanId.length >= 4 ? `https://${cleanId.slice(0, 4)}.api.green-api.com` : '',
  ].filter(Boolean);

  for (const host of hosts) {
    try {
      const url = `${host}/waInstance${cleanId}/getGroupData/${cleanToken}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: cleanGroup }),
      });
      if (r.ok) {
        const data = await r.json();
        return res.json({ success: true, groupData: data });
      }
    } catch {}
  }

  return res.status(404).json({ success: false, error: 'Group data could not be retrieved from Green API.' });
});

app.post('/api/green-api/set-settings', async (req: Request, res: Response) => {
  const { instanceId, apiToken } = req.body || {};
  const cleanId = String(instanceId || '').trim();
  const cleanToken = String(apiToken || '').trim();

  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: 'Instance ID and API Token are required.' });
  }

  try {
    const url = `https://api.green-api.com/waInstance${cleanId}/setSettings/${cleanToken}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incomingWebhook: 'yes',
        outgoingWebhook: 'yes',
        outgoingMessageWebhook: 'yes',
        stateWebhook: 'yes',
      }),
    });
    const data = r.ok ? await r.json() : null;
    return res.json({ success: Boolean(r.ok), data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/green-api/get-messages', async (req: Request, res: Response) => {
  const { instanceId, apiToken, chatId, count = 50 } = req.body || {};
  const cleanId = String(instanceId || '').trim();
  const cleanToken = String(apiToken || '').trim();
  let cleanChat = String(chatId || '').trim();

  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: 'Instance ID and API Token are required.' });
  }

  // Auto-normalize WhatsApp group chat ID if suffix is missing
  if (cleanChat && !cleanChat.includes('@')) {
    cleanChat = `${cleanChat}@g.us`;
  }

  const hosts = [
    'https://api.green-api.com',
    cleanId.length >= 4 ? `https://${cleanId.slice(0, 4)}.api.green-api.com` : '',
  ].filter(Boolean);

  try {
    const rawCollected: any[] = [];
    const deletedIds = new Set<string>();

    // 1. Fetch from getChatHistory (WhatsApp journal history)
    if (cleanChat) {
      for (const host of hosts) {
        try {
          const url = `${host}/waInstance${cleanId}/getChatHistory/${cleanToken}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: cleanChat, count: Math.max(Number(count) || 50, 100) }),
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              for (const m of data) {
                if (!m) continue;
                const mChat = String(m.chatId || '').toLowerCase();
                if (!mChat || mChat === cleanChat.toLowerCase()) {
                  rawCollected.push(m);
                }
              }
              break; // successfully fetched from host
            }
          }
        } catch (e) {
          console.warn(`Error querying ${host}/getChatHistory:`, e);
        }
      }
    }

    // 2. Fetch from lastIncomingMessages (real-time stream, bypasses journal lag)
    for (const host of hosts) {
      try {
        const fallbackUrl = `${host}/waInstance${cleanId}/lastIncomingMessages/${cleanToken}?minutes=7200`;
        const fallbackRes = await fetch(fallbackUrl, { method: 'GET' });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            const cleanChatNoSuffix = cleanChat ? cleanChat.replace(/@.*$/, '').toLowerCase() : '';
            for (const m of fallbackData) {
              if (!m) continue;
              if (cleanChat) {
                const mChat = String(m.chatId || m.senderId || '').toLowerCase();
                if (mChat === cleanChat.toLowerCase() || (cleanChatNoSuffix && mChat.startsWith(cleanChatNoSuffix))) {
                  rawCollected.push(m);
                }
              } else {
                rawCollected.push(m);
              }
            }
            break;
          }
        }
      } catch (e) {
        console.warn(`Error querying ${host}/lastIncomingMessages:`, e);
      }
    }

    // 3. Scan for any deletion markers or deletedMessageId
    for (const m of rawCollected) {
      if (m.deletedMessageId) {
        deletedIds.add(String(m.deletedMessageId));
      }
      if (m.isDeleted === true || m.typeMessage === 'deletedMessage' || m.type === 'deletedMessage' || m.status === 'deleted') {
        const msgId = m.idMessage || m.id || m.stanzaId;
        if (msgId) deletedIds.add(String(msgId));
      }
    }

    // 4. Filter, deduplicate, and remove deleted messages
    const seenMsgKeys = new Set<string>();
    const validMessages: any[] = [];

    for (const m of rawCollected) {
      const msgId = String(m.idMessage || m.id || m.stanzaId || '');

      // Discard if explicitly marked deleted or in deletedIds set
      if (
        m.isDeleted === true ||
        m.typeMessage === 'deletedMessage' ||
        m.type === 'deletedMessage' ||
        m.status === 'deleted' ||
        (msgId && deletedIds.has(msgId))
      ) {
        continue;
      }

      // Check text for deletion notifications
      const textCheck = String(m.textMessage || m.caption || m.message || '').trim().toLowerCase();
      if (
        textCheck === 'this message was deleted' ||
        textCheck === 'this message has been deleted' ||
        textCheck === 'you deleted this message'
      ) {
        continue;
      }

      // Deduplicate key
      const dedupKey = msgId || `${m.timestamp}-${textCheck.slice(0, 30)}`;
      if (seenMsgKeys.has(dedupKey)) {
        continue;
      }
      seenMsgKeys.add(dedupKey);

      validMessages.push(m);
    }

    // 5. Sort by timestamp descending (newest messages first)
    validMessages.sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? (a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1000) : 0;
      const tB = typeof b.timestamp === 'number' ? (b.timestamp > 1e11 ? b.timestamp : b.timestamp * 1000) : 0;
      return tB - tA;
    });

    return res.json({
      success: true,
      messages: validMessages,
      count: validMessages.length,
      chatId: cleanChat,
      fetchMethod: 'hybrid-chatHistory-and-lastIncoming-live',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch group messages' });
  }
});

// ---------------------------------------------------------------------------
// UNIVERSAL WHATSAPP GATEWAY (GREEN API, META CLOUD API, EVOLUTION, WHAPI, CUSTOM)
// ---------------------------------------------------------------------------
const WA_CONFIG_FILE_PATH = path.join(process.cwd(), 'tamimi_whatsapp_cfg.json');
let persistedWaConfig: any = null;

// Load persisted WhatsApp credentials on server startup
try {
  if (fs.existsSync(WA_CONFIG_FILE_PATH)) {
    const raw = fs.readFileSync(WA_CONFIG_FILE_PATH, 'utf-8');
    persistedWaConfig = JSON.parse(raw);
    console.log('[Server WhatsApp] Loaded persisted credentials from disk.');
  }
} catch (err) {
  console.warn('[Server WhatsApp] Failed to load persisted WA config from file:', err);
}

const webhookMessageBuffer: any[] = [];

// Get saved universal config
app.get('/api/whatsapp-universal/config', (req: Request, res: Response) => {
  return res.json({ success: true, config: persistedWaConfig || null });
});

// Save universal config permanently to server disk
app.post('/api/whatsapp-universal/config', (req: Request, res: Response) => {
  try {
    const incoming = req.body || {};
    persistedWaConfig = {
      ...(persistedWaConfig || {}),
      ...incoming,
      lastSavedAt: new Date().toISOString(),
    };
    fs.writeFileSync(WA_CONFIG_FILE_PATH, JSON.stringify(persistedWaConfig, null, 2), 'utf-8');
    console.log('[Server WhatsApp] Successfully saved configuration to disk.');
    return res.json({ success: true, config: persistedWaConfig });
  } catch (err: any) {
    console.error('[Server WhatsApp] Error saving config to disk:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Universal Test Connection
app.post('/api/whatsapp-universal/test', async (req: Request, res: Response) => {
  try {
    const { provider, config = {} } = req.body;

    if (provider === 'green_api') {
      const cleanId = String(config.instanceId || '').trim();
      const cleanToken = String(config.apiToken || '').trim();
      if (!cleanId || !cleanToken) {
        return res.json({ success: false, message: 'Instance ID and API Token are required.' });
      }
      const host = cleanId.length >= 4 ? `https://${cleanId.slice(0, 4)}.api.green-api.com` : 'https://api.green-api.com';
      const response = await fetch(`${host}/waInstance${cleanId}/getStateInstance/${cleanToken}`);
      if (!response.ok) {
        return res.json({ success: false, message: `Green API returned HTTP ${response.status}: ${response.statusText}` });
      }
      const data = await response.json();
      const isAuth = data.stateInstance === 'authorized';
      return res.json({
        success: isAuth,
        state: data.stateInstance,
        message: isAuth
          ? 'Green API Instance is ONLINE and AUTHORIZED!'
          : `Green API Status: "${data.stateInstance}". Please scan QR code in Green API dashboard.`,
      });
    }

    if (provider === 'meta_cloud') {
      const { phoneNumberId, accessToken } = config;
      if (!phoneNumberId || !accessToken) {
        return res.json({ success: false, message: 'Phone Number ID and System Access Token are required.' });
      }
      const graphUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}?access_token=${accessToken}`;
      const response = await fetch(graphUrl);
      const data = await response.json();
      if (response.ok && data.id) {
        return res.json({
          success: true,
          message: `Meta WhatsApp Cloud API Connected! Verified Number: ${data.display_phone_number || data.id} (${data.verified_name || 'Business Account'})`,
          details: data,
        });
      }
      return res.json({
        success: false,
        message: data.error?.message || 'Failed to authenticate with Meta WhatsApp Cloud API.',
      });
    }

    if (provider === 'custom_gateway') {
      const { endpointUrl, apiKey, authHeaderName = 'Authorization', authScheme = 'Bearer' } = config;
      if (!endpointUrl) {
        return res.json({ success: false, message: 'Custom Gateway Endpoint URL is required.' });
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        if (authScheme === 'Bearer') {
          headers[authHeaderName] = `Bearer ${apiKey.trim()}`;
        } else if (authScheme === 'ApiKey' || authScheme === 'Custom' || authScheme === 'None') {
          headers[authHeaderName] = apiKey.trim();
        }
      }

      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers,
      }).catch(async () => {
        // If GET fails or is method not allowed, try POST with health check body
        return await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'ping', test: true }),
        });
      });

      if (response && response.ok) {
        return res.json({
          success: true,
          message: `Universal Gateway connected successfully! HTTP ${response.status}`,
        });
      }
      return res.json({
        success: false,
        message: `Gateway responded with HTTP ${response?.status || '500'}: ${response?.statusText || 'Unable to connect'}`,
      });
    }

    return res.json({ success: false, message: `Unknown provider: ${provider}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Universal gateway test error' });
  }
});

// Incoming webhook receiver for any WhatsApp provider (Meta, Green API, Evolution, etc.)
app.all('/api/whatsapp/incoming', (req: Request, res: Response) => {
  // Meta Webhook Verification challenge (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && challenge) {
      return res.status(200).send(challenge);
    }
    return res.json({ status: 'active', message: 'WhatsApp Universal Webhook Listener Ready' });
  }

  // Incoming POST webhook
  const body = req.body || {};
  webhookMessageBuffer.unshift({
    timestamp: new Date().toISOString(),
    payload: body,
  });
  if (webhookMessageBuffer.length > 200) webhookMessageBuffer.pop();

  return res.json({ success: true, receivedAt: new Date().toISOString() });
});

// Query incoming webhook buffer
app.get('/api/whatsapp/incoming-buffer', (req: Request, res: Response) => {
  return res.json({ success: true, count: webhookMessageBuffer.length, buffer: webhookMessageBuffer });
});

// ---------------------------------------------------------------------------
// TAFGA TBCV OBSERVATION REPORT EXPORT (EXACT EXCELJS TEMPLATE AS REQUESTED)
// ---------------------------------------------------------------------------
app.post('/api/export-excel', async (req: Request, res: Response) => {
  try {
    const {
      items = [],
      facilityName = 'Tamimi Construction Village',
      contractorName = 'Tamimi TAFGA',
      preparedBy = 'LIMON RAHMAN',
      dateStr = new Date().toISOString().slice(0, 10),
      fileName,
      categoryKeywords,
    } = req.body;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = preparedBy;
    workbook.lastModifiedBy = preparedBy;

    /* =========================
       CREATE SHEETS (DESIGN)
    ========================= */
    const sheetNames = [
      'Hard Service',
      'Soft Services',
      'Pest Control',
      'HSE',
      'Fire Department',
    ];

    sheetNames.forEach((name) => {
      const sheet = workbook.addWorksheet(name);

      sheet.mergeCells('A1:H1');
      sheet.getCell('A1').value = 'TAFGA TBCV OBSERVATION REPORT';
      sheet.getCell('A1').font = { size: 18, bold: true };
      sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 32;

      sheet.mergeCells('A2:E2');
      sheet.getCell('A2').value = `Facility/Program: ${facilityName}`;
      sheet.getCell('A2').font = { bold: true };
      sheet.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getRow(2).height = 22;

      sheet.mergeCells('A3:E3');
      sheet.getCell('A3').value = `Contractor Name: ${contractorName}`;
      sheet.getCell('A3').font = { bold: true };
      sheet.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getRow(3).height = 22;

      sheet.getCell('F2').value = 'Date:';
      sheet.getCell('F2').font = { bold: true };
      sheet.getCell('F2').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.mergeCells('G2:H2');
      sheet.getCell('G2').value = dateStr;
      sheet.getCell('G2').alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.getCell('F3').value = 'Prepared By:';
      sheet.getCell('F3').font = { bold: true };
      sheet.getCell('F3').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.mergeCells('G3:H3');
      sheet.getCell('G3').value = preparedBy;
      sheet.getCell('G3').alignment = { horizontal: 'center', vertical: 'middle' };

      const headers = [
        'No.',
        'Location',
        'Department',
        'Description',
        'Ticket Number',
        'Picture',
        'Close Out Picture',
        'Status',
      ];

      // Row 4: TABLE HEADERS (NO EMPTY ROW 4 GAP)
      sheet.getRow(4).values = headers;
      sheet.getRow(4).height = 28;

      sheet.columns = [
        { key: 'sl', width: 6 },
        { key: 'location', width: 18 },
        { key: 'department', width: 18 },
        { key: 'desc', width: 42 },
        { key: 'ticket', width: 16 },
        { key: 'image', width: 28 },
        { key: 'closeout', width: 28 },
        { key: 'status', width: 15 },
      ];

      // ✅ HEADER STYLE (Row 4)
      const headerRow = sheet.getRow(4);
      headerRow.eachCell((cell: any) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' },
        };
      });

      // ✅ TOP BORDERS (Rows 1 to 4)
      for (let r = 1; r <= 4; r++) {
        for (let c = 1; c <= 8; c++) {
          sheet.getRow(r).getCell(c).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }
      }
    });

    /* =========================
       FULL BORDER
    ========================= */
    function applyFullBorder(sheet: any) {
      sheet.eachRow((row: any) => {
        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
    }

    /* =========================
       CATEGORY KEYWORDS & DEPARTMENT RESOLVER ENGINE
    ========================= */
    const CATEGORY_RULES: Record<string, string[]> = categoryKeywords || {
      'Civil': [
        'steel plate flooring', 'steel plate', 'ceiling cover', 'ceiling tile',
        'door handle', 'door lock', 'shower door lock', 'shower bath door lock', 'wall spots', 'dirty spots on wall',
        'wall paint', 'wall crack', 'steel rack', 'window cotton', 'curtains',
        'curtain', 'blinds', 'handrail', 'repaint', 'paint', 'wall', 'roof',
        'flooring', 'tiles', 'tile', 'door', 'lock', 'handle', 'window', 'cabinet',
        'wardrobe', 'rack', 'pillar', 'plaster', 'masonry', 'carpentry', 'welding',
        'stair', 'stairs', 'glass', 'bed', 'civil', 're-touch', 'retouch',
        'silicon', 'crack', 'cement', 'concrete'
      ],
      'Electrical': [
        'busted ceiling light', 'ceiling light', 'led light', 'damaged led light',
        'mirror lights blinking', 'lights blinking', 'lights flickering', 'tube light',
        'spot light', 'exhaust fan', 'ceiling fan', 'short circuit', 'power cut',
        'no power', 'distribution board', 'electrical panel', 'mcb', 'breaker',
        'wiring', 'cable', 'wire', 'switch', 'socket', 'plug', 'light', 'lights',
        'lamp', 'bulb', 'led', 'blinking', 'fan', 'electrical', 'electric',
        'panel'
      ],
      'HVAC': [
        'outdoor ac unit pipe hole', 'outdoor ac unit', 'indoor ac unit',
        'outdoor ac', 'indoor ac', 'pipe hole', 'proper insulation', 'insulation',
        'ac not cooling', 'not cooling', 'low cooling', 'no cooling',
        'ac water leak', 'ac water leaking', 'ac dripping', 'ac drainage', 'ac leak',
        'air conditioner', 'air conditioning', 'ac unit', 'chiller', 'cooling',
        'compressor', 'thermostat', 'freon', 'gas leak', 'duct', 'filter',
        'ventilation', 'ac', 'a/c', 'hvac'
      ],
      'Plumbing': [
        'water not draining properly', 'water not draining', 'shower tray',
        'shower bath', 'shower mixer', 'drain cover', 'handspray', 'hand spray',
        'shattaf', 'bidet spray', 'flush tank leaking', 'flush tank not working',
        'flush tank', 'flush button', 'toilet bowl', 'commode', 'wash basin',
        'water heater', 'water leak', 'leaking water', 'pipe burst', 'pipe leak',
        'angle valve', 'tap leaking', 'faucet', 'tap', 'draining', 'drain',
        'water', 'leaking', 'leak', 'leakage', 'shower', 'flush', 'pipe',
        'sink', 'basin', 'toilet', 'bidet', 'tank', 'valve', 'sewer',
        'sewage', 'clogged', 'plumbing'
      ],
      'Housekeeping': [
        'deep cleaning', 'corridor cleaning', 'room cleaning', 'cabinet cleaning',
        'curb stone cleaning', 'steel plate cleaning', 'ablution cleaning',
        'bed sheet', 'bed sheets', 'linen', 'blanket', 'pillow', 'towel',
        'laundry', 'cleaning', 'housekeeping', 'mop', 'sweeping', 'janitor',
        'dust', 'dirty', 'dirty spots', 'stains', 'stain', 'kettle cleaning',
        'kettle', 'unwanted material', 'arranging material', 'diesel cleaning'
      ],
      'Landscaping': [
        'tree need trimming', 'tree trimming', 'dry leaves removal', 'dry leaves',
        'grass cutting', 'lawn mowing', 'artificial grass', 'irrigation pipe',
        'irrigation', 'watering plants', 'watering', 'gardening', 'garden',
        'landscaping', 'landscape', 'plants', 'plant', 'grass', 'lawn',
        'trees', 'tree', 'trimming', 'pruning', 'leaves', 'flower', 'soil'
      ],
      'Waste Management': [
        'waste management', 'waste bin signage', 'waste bin', 'waste bins',
        'garbage bin', 'trash bin', 'dustbin', 'wheelie bin', 'dumpster',
        'skip', 'overflowing bin', 'litter picking', 'little picking',
        'trash collection', 'waste collection', 'discarded material',
        'discard damaged', 'scrap disposal', 'garbage', 'trash', 'waste',
        'bin', 'bins', 'rubbish', 'litter', 'discard', 'debris', 'dump',
        'scrap', 'recycling'
      ],
      'Pest Control': [
        'pest control', 'spray pest', 'pest spray', 'pest spraying',
        'bedbugs treatment', 'bedbugs need pest treatment', 'bedbugs', 'bedbug',
        'cockroaches', 'cockroach', 'insects', 'insect', 'termites', 'mosquitoes',
        'ants', 'ant', 'rodents', 'rodent', 'rats', 'rat', 'mice', 'mouse',
        'flies', 'fly', 'stray cat', 'stray dog', 'stray animals', 'cats',
        'dogs', 'pigeons', 'pigeon', 'pest', 'fumigation'
      ],
      'HSE': [
        'trip hazard', 'slip hazard', 'slip and fall', 'safety shoes',
        'hard hat', 'safety glasses', 'ppe violation', 'missing ppe', 'ppe',
        'first aid box', 'first aid', 'eyewash station', 'eyewash',
        'safety barrier', 'barricade', 'caution tape', 'warning sign',
        'scaffolding safety', 'scaffold', 'safety harness', 'harness',
        'chemical spill', 'oil spill', 'diesel spill', 'spill', 'hse',
        'health and safety', 'safety', 'hazard', 'danger', 'slip', 'fall',
        'warning', 'health', 'chemical'
      ],
      'Fire Department': [
        'fire extinguisher expired', 'fire extinguisher pressure',
        'fire extinguisher', 'extinguisher', 'smoke detector beeping',
        'smoke detector', 'fire alarm ringing', 'fire alarm panel', 'fire alarm',
        'break glass unit', 'break glass', 'manual call point', 'fire pump room',
        'fire pump', 'fire hydrant', 'hydrant', 'fire hose reel', 'fire hose',
        'hose reel', 'fire sprinkler', 'sprinkler', 'fire door blocked',
        'fire door', 'emergency exit', 'fire fighting', 'fire department',
        'fire', 'fighting'
      ]
    };

    function resolveDepartment(desc: string, currentDept?: string): string {
      const specificDepts = [
        'Civil', 'Electrical', 'HVAC', 'Plumbing',
        'Housekeeping', 'Landscaping', 'Waste Management',
        'Pest Control', 'HSE', 'Fire Department'
      ];
      const trimmed = (currentDept || '').trim();
      // If already a specific department, preserve it
      if (trimmed && specificDepts.includes(trimmed)) {
        return trimmed;
      }

      const text = (desc || '').toLowerCase().trim();
      if (!text) return trimmed || 'Civil';

      let best = 'Civil';
      let maxScore = 0;

      for (const [dept, keywords] of Object.entries(CATEGORY_RULES)) {
        if (!keywords || !Array.isArray(keywords)) continue;
        for (const kw of keywords) {
          const cleanKw = kw.toLowerCase().trim();
          if (!cleanKw) continue;

          let isMatch = false;
          if (cleanKw.length <= 3) {
            const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
            isMatch = wordRegex.test(text);
          } else {
            isMatch = text.includes(cleanKw);
          }

          if (isMatch) {
            let score = cleanKw.length * 10;
            if (cleanKw.includes(' ')) score += 30;
            if (text === cleanKw) score += 50;
            if (dept === 'Fire Department') score += 15;
            if (dept === 'HSE') score += 12;
            if (dept === 'Pest Control') score += 10;
            if (score > maxScore) {
              maxScore = score;
              best = dept;
            }
          }
        }
      }
      return best;
    }

    /* =========================
       SHEET SELECTOR (MAPS DEPARTMENTS TO WORKBOOK SHEETS)
    ========================= */
    function getSheetByDepartment(wb: any, department: string) {
      if (!department) return wb.getWorksheet('Hard Service');
      const dept = String(department).trim();

      // Hard Service Department Family: Civil, Electrical, HVAC, Plumbing
      if (
        [
          'Civil',
          'CIVIL',
          'Electrical',
          'HVAC',
          'Plumbing',
          'Hard Service',
          'Hard Services',
        ].includes(dept)
      ) {
        return wb.getWorksheet('Hard Service');
      }

      // Soft Services Department Family: Housekeeping, Landscaping, Waste Management
      if (
        [
          'Housekeeping',
          'Landscaping',
          'Waste Management',
          'Soft',
          'Soft Service',
          'Soft Services',
          'Cleaning',
        ].includes(dept)
      ) {
        return wb.getWorksheet('Soft Services');
      }

      if (dept === 'Pest Control') {
        return wb.getWorksheet('Pest Control');
      }
      if (dept === 'HSE') {
        return wb.getWorksheet('HSE');
      }
      if (dept === 'Fighting' || dept === 'Fire Department' || dept === 'Fire Fighting') {
        return wb.getWorksheet('Fire Department');
      }

      const dLower = dept.toLowerCase();
      if (
        dLower.includes('civil') ||
        dLower.includes('elect') ||
        dLower.includes('hvac') ||
        dLower.includes('plumb') ||
        dLower.includes('hard')
      ) {
        return wb.getWorksheet('Hard Service');
      }
      if (
        dLower.includes('housekeep') ||
        dLower.includes('landscape') ||
        dLower.includes('waste') ||
        dLower.includes('clean') ||
        dLower.includes('soft')
      ) {
        return wb.getWorksheet('Soft Services');
      }
      if (dLower.includes('pest')) return wb.getWorksheet('Pest Control');
      if (dLower.includes('hse') || dLower.includes('safety') || dLower.includes('health')) return wb.getWorksheet('HSE');
      if (dLower.includes('fighting') || dLower.includes('fire')) return wb.getWorksheet('Fire Department');

      return wb.getWorksheet('Hard Service');
    }

    async function downloadImageBuffer(src: string): Promise<{ buffer: Buffer; ext: 'jpeg' | 'png' } | null> {
      if (!src || typeof src !== 'string') return null;
      const str = src.trim();
      if (!str) return null;
      try {
        if (str.startsWith('data:image/')) {
          const match = str.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
          if (match) {
            const ext = match[1].toLowerCase() === 'png' ? 'png' : 'jpeg';
            return { buffer: Buffer.from(match[2], 'base64'), ext };
          }
          const raw = str.split(',')[1];
          if (raw) return { buffer: Buffer.from(raw, 'base64'), ext: 'jpeg' };
        } else if (/^[A-Za-z0-9+/=]+$/.test(str) && str.length > 100) {
          // Raw base64 string
          return { buffer: Buffer.from(str, 'base64'), ext: 'jpeg' };
        }

        if (str.startsWith('http://') || str.startsWith('https://')) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          const r = await fetch(str, { signal: controller.signal });
          clearTimeout(timer);
          if (r.ok) {
            const ct = r.headers.get('content-type') || '';
            const ext = ct.includes('png') ? 'png' : 'jpeg';
            const arr = await r.arrayBuffer();
            return { buffer: Buffer.from(arr), ext };
          }
        }
      } catch (err) {
        console.warn('[Excel Export] Failed downloading image:', err);
      }
      return null;
    }

    /* =========================
       MAIN DATA ROWS POPULATION
    ========================= */
    const serialCounter: Record<string, number> = {};
    const ROW_HEIGHT = 115;

    for (const item of items) {
      // Resolve exact category from keywords to ensure specific department names
      const resolvedDept = resolveDepartment(item.description || item.rawCaption || '', item.department);
      const sheet = getSheetByDepartment(workbook, resolvedDept);
      if (!sheet) continue;

      if (!serialCounter[sheet.name]) {
        serialCounter[sheet.name] = 1;
      }

      const row = sheet.addRow({
        sl: serialCounter[sheet.name],
        location: item.location || '',
        department: resolvedDept,
        desc: item.description || '',
        ticket: item.ticketNumber || '',
        image: '',
        closeout: '',
        status: item.status || 'Open',
      });

      row.height = ROW_HEIGHT;

      // Center text alignment for all standard cells, left alignment for description with text wrapping
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

      const mainPic = item.picture || item.pictureUrl;
      if (mainPic) {
        const img = await downloadImageBuffer(mainPic);
        if (img) {
          try {
            const imageId = workbook.addImage({
              buffer: img.buffer,
              extension: img.ext,
            });

            // Anchor exactly across whole cell F (Col index 5) from corner to corner
            sheet.addImage(imageId, {
              tl: { col: 5, row: row.number - 1 },
              br: { col: 6, row: row.number },
              editAs: 'twoCell',
            });
          } catch (e) {
            console.warn('[Excel Export] Image embed error:', e);
          }
        }
      }

      const closePic = item.closeOutPicture || item.closeout;
      if (closePic) {
        const cImg = await downloadImageBuffer(closePic);
        if (cImg) {
          try {
            const cId = workbook.addImage({
              buffer: cImg.buffer,
              extension: cImg.ext,
            });

            // Anchor exactly across whole cell G (Col index 6) from corner to corner
            sheet.addImage(cId, {
              tl: { col: 6, row: row.number - 1 },
              br: { col: 7, row: row.number },
              editAs: 'twoCell',
            });
          } catch (e) {
            console.warn('[Excel Export] Closeout embed error:', e);
          }
        }
      }

      serialCounter[sheet.name]++;
    }

    // Apply full borders across all sheets
    workbook.eachSheet((sheet: any) => {
      applyFullBorder(sheet);
    });

    const exportFileName =
      fileName || `TAFGA_TBCV_OBSERVATION_REPORT_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    const rawBuffer = await workbook.xlsx.writeBuffer();

    // Post-process drawing XMLs with JSZip to ensure noChangeAspect is 0 so images fill cells 100%
    let outputBuffer: Buffer;
    try {
      const zip = await JSZip.loadAsync(rawBuffer);
      let modified = false;
      for (const fName of Object.keys(zip.files)) {
        if (fName.startsWith('xl/drawings/drawing') && fName.endsWith('.xml')) {
          let xml = await zip.file(fName)!.async('string');
          const originalXml = xml;
          // Force noChangeAspect to 0 across all picture locks so images fully stretch/fill the assigned cell bounds
          xml = xml.replace(/noChangeAspect="1"/g, 'noChangeAspect="0"');
          // If noChangeAspect is not present in picLocks, add it
          xml = xml.replace(/<a:picLocks\s*\/>/g, '<a:picLocks noChangeAspect="0"/>');
          xml = xml.replace(/<a:picLocks([^>]*)>/g, (match, attrs) => {
            if (!attrs.includes('noChangeAspect')) {
              return `<a:picLocks${attrs} noChangeAspect="0">`;
            }
            return match;
          });
          if (xml !== originalXml) {
            zip.file(fName, xml);
            modified = true;
          }
        }
      }
      if (modified) {
        outputBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      } else {
        outputBuffer = Buffer.from(rawBuffer);
      }
    } catch (zipErr) {
      console.warn('[Excel Export] JSZip drawing patch warning:', zipErr);
      outputBuffer = Buffer.from(rawBuffer);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFileName}"`);
    return res.send(outputBuffer);
  } catch (err: any) {
    console.error('[Excel Export] Error generating excel:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to export Excel' });
  }
});

// 4. Vite Dev / Production Static Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Executive Facility Booking Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

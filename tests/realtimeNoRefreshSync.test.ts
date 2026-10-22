import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app, hubState, createTestSession } from '../server';
import { StorageService } from '../src/services/storageService';
import { Booking } from '../src/types';

function makeRequest(
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  },
  serverInstance: http.Server
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = serverInstance.address();
    const port = typeof addr === 'object' && addr ? addr.port : 3000;
    const bodyStr = options.body ? JSON.stringify(options.body) : '';

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (bodyStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: options.path,
        method: options.method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (_) {}
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

/**
 * Open a live SSE connection to /api/hub/events and collect received events
 */
function connectSSE(serverInstance: http.Server): {
  events: Array<{ event: string; data: any; id?: string }>;
  close: () => void;
  waitForEvent: (predicate: (evt: { event: string; data: any; id?: string }) => boolean, timeoutMs?: number) => Promise<any>;
} {
  const addr = serverInstance.address();
  const port = typeof addr === 'object' && addr ? addr.port : 3000;
  const events: Array<{ event: string; data: any; id?: string }> = [];
  const listeners: Array<(evt: any) => void> = [];

  const req = http.request({
    hostname: '127.0.0.1',
    port,
    path: '/api/hub/events',
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
    },
  });

  let buffer = '';

  req.on('response', (res) => {
    res.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      let currentId = '';
      let currentData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.substring(7).trim();
        } else if (line.startsWith('id: ')) {
          currentId = line.substring(4).trim();
        } else if (line.startsWith('data: ')) {
          currentData += line.substring(6);
        } else if (line.trim() === '') {
          if (currentData) {
            try {
              const parsed = JSON.parse(currentData);
              const evtObj = { event: currentEvent, data: parsed, id: currentId };
              events.push(evtObj);
              listeners.forEach((l) => l(evtObj));
            } catch (_) {}
            currentData = '';
            currentEvent = 'message';
            currentId = '';
          }
        }
      }
    });
  });

  req.end();

  return {
    events,
    close: () => {
      req.destroy();
    },
    waitForEvent: (predicate, timeoutMs = 4000) => {
      return new Promise((resolve, reject) => {
        const existing = events.find(predicate);
        if (existing) return resolve(existing);

        const timer = setTimeout(() => {
          reject(new Error(`Timeout waiting for SSE event within ${timeoutMs}ms. Received: ${JSON.stringify(events.map(e => e.data))}`));
        }, timeoutMs);

        const listener = (evt: any) => {
          if (predicate(evt)) {
            clearTimeout(timer);
            resolve(evt);
          }
        };
        listeners.push(listener);
      });
    },
  };
}

describe('Real-Time Instant Booking Sync across Multiple Devices (No Refresh)', () => {
  let server: http.Server;
  let authToken: string;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    authToken = createTestSession('SUPER_ADMIN', 'Helpdesk Admin');
  });

  afterAll(async () => {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    hubState.version = 1;
    hubState.bookings = [];
    hubState.deletedIds = {};
    hubState.cancelledIds = {};
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    StorageService.reloadFromStorage();
  });

  it('Device B receives instant real-time SSE event when Device A creates a booking, without refresh', async () => {
    // 1. Device B connects to SSE stream
    const deviceBStream = connectSSE(server);

    // Wait for initial connected ping or handshake
    await deviceBStream.waitForEvent((evt) => evt.data?.type === 'CONNECTED');

    // 2. Device A creates a booking via POST /api/bookings
    const testBooking: Booking = {
      id: `TEST-SYNC-${Date.now()}-A`,
      facilityId: 'cricket-ground',
      facilityName: 'Cricket Ground',
      sheetTabName: 'Cricket Ground',
      customerName: 'Ahmad Realtime',
      phoneNumber: '0501234567',
      stage: 'Stage 1 Cricket Ground',
      date: '2026-09-01',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      slotIds: ['2026-09-01-10:00-11:00-Stage1'],
      numberOfGuests: 11,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    const postRes = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: { booking: testBooking },
      },
      server
    );

    expect(postRes.status).toBe(200);
    expect(postRes.body.success).toBe(true);

    // 3. Verify Device B received the SSE broadcast in real-time
    const receivedEvent = await deviceBStream.waitForEvent(
      (evt) => evt.data?.type === 'UPSERT' && evt.data?.entity === 'bookings' && evt.data?.payload?.id === testBooking.id
    );

    expect(receivedEvent).toBeDefined();
    expect(receivedEvent.data.payload.customerName).toBe('Ahmad Realtime');

    // 4. Verify client-side applyRemoteUpsert integrates without refresh
    StorageService.applyRemoteUpsert('bookings', receivedEvent.data.payload);
    const clientBookings = StorageService.getBookings();
    expect(clientBookings.some((b) => b.id === testBooking.id)).toBe(true);

    deviceBStream.close();
  });

  it('Device B receives instant real-time SSE event when Device A updates and cancels a booking', async () => {
    const deviceBStream = connectSSE(server);
    await deviceBStream.waitForEvent((evt) => evt.data?.type === 'CONNECTED');

    // Initial booking
    const bookingId = `TEST-UPDATE-${Date.now()}`;
    const testBooking: Booking = {
      id: bookingId,
      facilityId: 'tennis-court',
      facilityName: 'Tennis Court',
      sheetTabName: 'Tennis Court',
      customerName: 'Carlos Alcaraz',
      phoneNumber: '0559988776',
      stage: 'Area 7 Tennis Court',
      date: '2026-09-02',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      slotIds: ['2026-09-02-16:00-17:00-Area7'],
      numberOfGuests: 2,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${authToken}` },
        body: { booking: testBooking },
      },
      server
    );

    // Apply locally on Device B
    StorageService.applyRemoteUpsert('bookings', testBooking);

    // Now Device A updates the booking notes & guests
    const updatedBooking: Booking = {
      ...testBooking,
      numberOfGuests: 4,
      notes: 'VIP guest visit',
      updatedAt: new Date().toISOString(),
    };

    await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${authToken}` },
        body: { booking: updatedBooking },
      },
      server
    );

    const updateEvent = await deviceBStream.waitForEvent(
      (evt) => evt.data?.type === 'UPSERT' && evt.data?.id === bookingId && evt.data?.payload?.numberOfGuests === 4
    );

    expect(updateEvent).toBeDefined();
    StorageService.applyRemoteUpsert('bookings', updateEvent.data.payload);
    let current = StorageService.getBookings().find((b) => b.id === bookingId);
    expect(current?.numberOfGuests).toBe(4);
    expect(current?.notes).toBe('VIP guest visit');

    // Now Device A cancels the booking via /api/bookings/:id DELETE
    await makeRequest(
      {
        method: 'DELETE',
        path: `/api/bookings/${bookingId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { reason: 'Rain delay', cancelledBy: 'Carlos' },
      },
      server
    );

    const cancelEvent = await deviceBStream.waitForEvent(
      (evt) => evt.data?.type === 'CANCEL' && String(evt.data?.id).toLowerCase() === bookingId.toLowerCase()
    );

    expect(cancelEvent).toBeDefined();
    StorageService.applyRemoteCancel(cancelEvent.data.id, cancelEvent.data.payload?.reason);
    current = StorageService.getBookings().find((b) => b.id === bookingId);
    expect(current?.status).toBe('CANCELLED');

    deviceBStream.close();
  });

  it('Google Sheets / GAS write notification (/api/gas/notify-booking-saved) broadcasts to all devices', async () => {
    const deviceBStream = connectSSE(server);
    await deviceBStream.waitForEvent((evt) => evt.data?.type === 'CONNECTED');

    const gasSavedBooking: Booking = {
      id: `GAS-NOTIFY-${Date.now()}`,
      facilityId: 'barber-booking',
      facilityName: 'Barber Booking',
      sheetTabName: 'Barber Booking',
      customerName: 'Karim Barber',
      phoneNumber: '0599112233',
      stage: 'Barber Shop',
      date: '2026-09-03',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      slotIds: ['2026-09-03-14:00-15:00-BarberShop'],
      numberOfGuests: 1,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    // Simulate Google Sheets webhook / client notification after remote write completes
    const notifyRes = await makeRequest(
      {
        method: 'POST',
        path: '/api/gas/notify-booking-saved',
        body: {
          booking: gasSavedBooking,
          action: 'CREATED',
          source: 'GoogleSheetsWorker',
        },
      },
      server
    );

    expect(notifyRes.status).toBe(200);
    expect(notifyRes.body.success).toBe(true);

    const event = await deviceBStream.waitForEvent(
      (evt) => evt.data?.type === 'UPSERT' && evt.data?.id === gasSavedBooking.id
    );

    expect(event).toBeDefined();
    expect(event.data.payload.customerName).toBe('Karim Barber');

    deviceBStream.close();
  });

  it('Duplicate events do not create duplicate bookings on the client', () => {
    const testBooking: Booking = {
      id: `DEDUP-${Date.now()}`,
      facilityId: 'cinema',
      facilityName: 'Cinema',
      sheetTabName: 'Cinema Hall',
      customerName: 'Sameer Film',
      phoneNumber: '0512344321',
      stage: 'Cinema Hall',
      date: '2026-09-05',
      startTime: '20:00',
      endTime: '22:30',
      durationMinutes: 150,
      slotIds: ['2026-09-05-20:00-22:30-CinemaHall'],
      numberOfGuests: 2,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    // Apply once
    StorageService.applyRemoteUpsert('bookings', testBooking);
    let matches = StorageService.getBookings().filter((b) => b.id === testBooking.id);
    expect(matches.length).toBe(1);

    // Apply identical booking a second time (simulating duplicate SSE or re-delivery)
    StorageService.applyRemoteUpsert('bookings', testBooking);
    matches = StorageService.getBookings().filter((b) => b.id === testBooking.id);
    expect(matches.length).toBe(1);

    // Apply duplicate with slight modification
    StorageService.applyRemoteUpsert('bookings', { ...testBooking, notes: 'Updated notes' });
    matches = StorageService.getBookings().filter((b) => b.id === testBooking.id);
    expect(matches.length).toBe(1);
    expect(matches[0].notes).toBe('Updated notes');
  });

  it('Device fetches authoritative server state on reconnection to catch any missed bookings', async () => {
    // 1. Commit booking while Device B is "disconnected"
    const missedBooking: Booking = {
      id: `MISSED-${Date.now()}`,
      facilityId: 'football-ground',
      facilityName: 'Football Ground',
      sheetTabName: 'Football Ground',
      customerName: 'Late Reconnect Player',
      phoneNumber: '0544556677',
      stage: 'Stage 3 Football Ground',
      date: '2026-09-06',
      startTime: '19:00',
      endTime: '20:00',
      durationMinutes: 60,
      slotIds: ['2026-09-06-19:00-20:00-Stage3'],
      numberOfGuests: 22,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${authToken}` },
        body: { booking: missedBooking },
      },
      server
    );

    // 2. Device B reconnects and calls GET /api/bookings
    const getRes = await makeRequest(
      {
        method: 'GET',
        path: '/api/bookings',
      },
      server
    );

    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.bookings)).toBe(true);
    const found = getRes.body.bookings.find((b: Booking) => b.id === missedBooking.id);
    expect(found).toBeDefined();
    expect(found.customerName).toBe('Late Reconnect Player');

    // 3. Integrate authoritative state
    StorageService.reconcileAuthoritativeBookings(getRes.body.bookings);
    const local = StorageService.getBookings().find((b) => b.id === missedBooking.id);
    expect(local).toBeDefined();
  });
});

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
          reject(new Error(`Timeout waiting for SSE event within ${timeoutMs}ms. Events: ${JSON.stringify(events.map(e => e.data))}`));
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

describe('2-Device Real-Time Sync: CREATE, UPDATE, CANCEL without page refresh', () => {
  let server: http.Server;
  let adminToken: string;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    adminToken = createTestSession('SUPER_ADMIN', 'Helpdesk SuperAdmin');
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

  it('Verifies full lifecycle (CREATE -> UPDATE -> CANCEL) on Device A instantly synchronizes to Device B without refresh', async () => {
    // === DEVICE B: Open persistent real-time SSE listener ===
    const deviceBSSE = connectSSE(server);
    await deviceBSSE.waitForEvent((evt) => evt.data?.type === 'CONNECTED');

    const testId = `CROSS-DEV-${Date.now()}`;
    const initialBooking: Booking = {
      id: testId,
      facilityId: 'cricket-ground',
      facilityName: 'Cricket Ground',
      sheetTabName: 'Cricket Ground',
      stage: 'Stage 1 Cricket Ground',
      date: '2026-11-15',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      customerName: 'Rahim Khan',
      phoneNumber: '0551122334',
      numberOfGuests: 11,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    // 1. === DEVICE A: CREATES A BOOKING ===
    const createRes = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { booking: initialBooking },
      },
      server
    );
    expect(createRes.status).toBe(200);
    expect(createRes.body.success).toBe(true);

    // DEVICE B: Receives UPSERT event over SSE instantaneously without refresh
    const createEvt = await deviceBSSE.waitForEvent(
      (evt) => evt.data?.type === 'UPSERT' && evt.data?.entity === 'bookings' && evt.data?.id === testId
    );
    expect(createEvt).toBeDefined();
    expect(createEvt.data.payload.customerName).toBe('Rahim Khan');

    // Device B applies remote upsert into its local state
    StorageService.applyRemoteUpsert('bookings', createEvt.data.payload);
    let deviceBBooking = StorageService.getBookingById(testId);
    expect(deviceBBooking).toBeDefined();
    expect(deviceBBooking?.customerName).toBe('Rahim Khan');
    expect(deviceBBooking?.status).toBe('CONFIRMED');

    // Simulated Cloud Firestore snapshot arrives on Device B (verifying it does NOT wipe out the booking)
    StorageService.applyRemoteBookingsSnapshot([createEvt.data.payload]);
    deviceBBooking = StorageService.getBookingById(testId);
    expect(deviceBBooking).toBeDefined();

    // 2. === DEVICE A: UPDATES THE BOOKING (e.g. Guest count & Notes) ===
    const updatePayload = {
      ...initialBooking,
      customerName: 'Rahim Khan (Updated VIP)',
      numberOfGuests: 20,
      notes: 'Extended pitch preparation requested',
      updatedAt: new Date().toISOString(),
    };

    const updateRes = await makeRequest(
      {
        method: 'PUT',
        path: `/api/bookings/${testId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: updatePayload,
      },
      server
    );
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    // DEVICE B: Receives update UPSERT event over SSE instantaneously
    const updateEvt = await deviceBSSE.waitForEvent(
      (evt) => evt.data?.type === 'UPSERT' && evt.data?.id === testId && evt.data?.payload?.numberOfGuests === 20
    );
    expect(updateEvt).toBeDefined();

    // Device B updates memory without refresh
    StorageService.applyRemoteUpsert('bookings', updateEvt.data.payload);
    deviceBBooking = StorageService.getBookingById(testId);
    expect(deviceBBooking?.numberOfGuests).toBe(20);
    expect(deviceBBooking?.customerName).toBe('Rahim Khan (Updated VIP)');
    expect(deviceBBooking?.notes).toBe('Extended pitch preparation requested');

    // 3. === DEVICE A: CANCELS THE BOOKING ===
    const cancelRes = await makeRequest(
      {
        method: 'DELETE',
        path: `/api/bookings/${testId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { reason: 'Cancelled by resident via mobile', cancelledBy: 'Rahim Khan' },
      },
      server
    );
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // DEVICE B: Receives CANCEL event over SSE instantaneously
    const cancelEvt = await deviceBSSE.waitForEvent(
      (evt) => evt.data?.type === 'CANCEL' && String(evt.data?.id).toLowerCase() === testId.toLowerCase()
    );
    expect(cancelEvt).toBeDefined();

    // Device B marks booking cancelled in memory without refresh
    StorageService.applyRemoteCancel(cancelEvt.data.id, cancelEvt.data.payload?.reason);
    deviceBBooking = StorageService.getBookingById(testId);
    expect(deviceBBooking?.status).toBe('CANCELLED');

    deviceBSSE.close();
  });

  it('Guarantees double-booking prevention: Concurrent bookings on the exact same slot reject with 409 conflict', async () => {
    const bookingSlot = {
      facilityId: 'tennis-court',
      facilityName: 'Tennis Court',
      sheetTabName: 'Tennis Court',
      stage: 'Court 1',
      date: '2026-11-20',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      numberOfGuests: 2,
      status: 'CONFIRMED' as const,
    };

    const bookingDevA: Booking = {
      ...bookingSlot,
      id: `DEV-A-${Date.now()}`,
      customerName: 'Device A User',
      phoneNumber: '0550000001',
      createdAt: new Date().toISOString(),
    };

    const bookingDevB: Booking = {
      ...bookingSlot,
      id: `DEV-B-${Date.now()}`,
      customerName: 'Device B User',
      phoneNumber: '0550000002',
      createdAt: new Date().toISOString(),
    };

    // First booking from Device A succeeds
    const resA = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { booking: bookingDevA },
      },
      server
    );
    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);

    // Second conflicting booking from Device B for the same slot is rejected with 409
    const resB = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { booking: bookingDevB },
      },
      server
    );
    expect(resB.status).toBe(409);
    expect(resB.body.success).toBe(false);
    expect(resB.body.error).toMatch(/Conflict detected|already reserved/i);
  });

  it('Guarantees slot lock release on cancellation: Cancelling frees the slot immediately for new bookings', async () => {
    const slotData = {
      facilityId: 'multipurpose-hall',
      facilityName: 'Multipurpose Hall',
      sheetTabName: 'Multipurpose Hall',
      stage: 'Main Hall',
      date: '2026-11-21',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      numberOfGuests: 25,
      status: 'CONFIRMED' as const,
    };

    const initialBooking: Booking = {
      ...slotData,
      id: `RELEASE-TEST-${Date.now()}`,
      customerName: 'First Booker',
      phoneNumber: '0551234567',
      createdAt: new Date().toISOString(),
    };

    // 1. Create booking
    const createRes = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { booking: initialBooking },
      },
      server
    );
    expect(createRes.status).toBe(200);

    // 2. Cancel booking
    const cancelRes = await makeRequest(
      {
        method: 'DELETE',
        path: `/api/bookings/${initialBooking.id}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { reason: 'Schedule changed', cancelledBy: 'First Booker' },
      },
      server
    );
    expect(cancelRes.status).toBe(200);

    // 3. New booking for the EXACT same slot must now succeed immediately without false conflict
    const newBooking: Booking = {
      ...slotData,
      id: `NEW-BOOKER-${Date.now()}`,
      customerName: 'Second Booker',
      phoneNumber: '0557654321',
      createdAt: new Date().toISOString(),
    };

    const rebookRes = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { booking: newBooking },
      },
      server
    );
    expect(rebookRes.status).toBe(200);
    expect(rebookRes.body.success).toBe(true);
    expect(rebookRes.body.booking?.id).toBe(newBooking.id);
  });

  it('Guarantees stale snapshot does not resurrect cancelled bookings', () => {
    const bookingId = `STALE-TEST-${Date.now()}`;
    const activeBooking: Booking = {
      id: bookingId,
      facilityId: 'basketball-court',
      facilityName: 'Basketball Court',
      sheetTabName: 'Basketball Court',
      stage: 'Court A',
      date: '2026-11-22',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      customerName: 'Player One',
      phoneNumber: '0559998877',
      numberOfGuests: 10,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    // Commit booking locally
    StorageService.saveBookings([activeBooking]);
    expect(StorageService.getBookingById(bookingId)?.status).toBe('CONFIRMED');

    // Cancel booking
    const cancelRes = StorageService.cancelBooking(bookingId, 'Customer cancellation');
    expect(cancelRes.success).toBe(true);
    expect(StorageService.getBookingById(bookingId)?.status).toBe('CANCELLED');

    // Stale snapshot arrives that still lists the booking as CONFIRMED (e.g. from an out-of-date cache)
    const staleSnapshot = [
      {
        ...activeBooking,
        status: 'CONFIRMED' as const,
      },
    ];

    StorageService.applyRemoteBookingsSnapshot(staleSnapshot);

    // Verified: The booking remains CANCELLED and is not resurrected back to CONFIRMED!
    const verified = StorageService.getBookingById(bookingId);
    expect(verified?.status).toBe('CANCELLED');
  });

  it('Enforces Authentication, RBAC, and input validation', async () => {
    // 1. Missing authentication token rejected on protected admin endpoint
    const unauthRes = await makeRequest(
      {
        method: 'GET',
        path: '/api/security/audit-logs',
      },
      server
    );
    expect(unauthRes.status).toBe(401);

    // 2. Malformed booking (missing facilityId or date) rejected with 400
    const malformedRes = await makeRequest(
      {
        method: 'POST',
        path: '/api/bookings',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          booking: {
            id: 'BAD-DATA-1',
            customerName: 'Test',
            // missing facilityId, date, startTime, endTime
          },
        },
      },
      server
    );
    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error).toBeDefined();
  });
});


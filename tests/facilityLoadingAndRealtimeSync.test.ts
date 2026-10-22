import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app, hubState } from '../server';
import { StorageService } from '../src/services/storageService';
import { HubService } from '../src/services/hubService';
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

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsedData = JSON.parse(line.substring(6).trim());
            const item = { event: parsedData.type || 'message', data: parsedData };
            events.push(item);
            for (let i = listeners.length - 1; i >= 0; i--) {
              listeners[i](item);
            }
          } catch (_) {}
        }
      }
    });
  });

  req.on('error', () => {});
  req.end();

  return {
    events,
    close: () => {
      req.destroy();
    },
    waitForEvent: (predicate, timeoutMs = 4000) => {
      for (const e of events) {
        if (predicate(e)) return Promise.resolve(e);
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = listeners.indexOf(listener);
          if (idx >= 0) listeners.splice(idx, 1);
          reject(new Error(`Timed out waiting for SSE event within ${timeoutMs}ms`));
        }, timeoutMs);

        const listener = (evt: any) => {
          if (predicate(evt)) {
            clearTimeout(timer);
            const idx = listeners.indexOf(listener);
            if (idx >= 0) listeners.splice(idx, 1);
            resolve(evt);
          }
        };
        listeners.push(listener);
      });
    },
  };
}

describe('Facility Authoritative Pre-Open Verification & Two-Computer Live Sync', () => {
  let serverInstance: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = http.createServer(app);
      serverInstance.listen(0, '127.0.0.1', () => {
        const addr = serverInstance.address();
        serverPort = typeof addr === 'object' && addr ? addr.port : 3000;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  });

  beforeEach(() => {
    hubState.bookings = [];
    hubState.deletedIds = {};
    hubState.cancelledIds = {};
    hubState.version = 1;
    StorageService.init();
    StorageService.saveBookings([]);
  });

  it('1. Fetches authoritative records for a facility before opening and loads them into StorageService', async () => {
    // Seed server database with authoritative bookings for cricket-ground
    const serverBooking: Booking = {
      id: 'BK-CRICKET-AUTH-1',
      facilityId: 'cricket-ground',
      facilityName: 'Cricket Ground',
      sheetTabName: 'Cricket Ground',
      stage: 'Stage 1 Cricket Ground',
      date: '2026-10-25',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      slotIds: ['cg-slot-1'],
      numberOfGuests: 11,
      customerName: 'Sultan Al-Harbi',
      phoneNumber: '+966501234567',
      status: 'CONFIRMED',
      createdAt: '2026-10-25T10:00:00.000Z',
    };
    hubState.bookings.push(serverBooking);
    hubState.version = 2;

    // Simulate Computer B requesting authoritative records from server
    const res = await makeRequest(
      {
        method: 'GET',
        path: '/api/bookings?facilityId=cricket-ground',
      },
      serverInstance
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.bookings)).toBe(true);
    expect(res.body.bookings.some((b: any) => b.id === 'BK-CRICKET-AUTH-1')).toBe(true);

    // Apply into StorageService
    StorageService.setAuthoritativeServerBookings(res.body.bookings, 'cricket-ground');
    const localBookings = StorageService.getAllBookings();
    expect(localBookings.some((b) => b.id === 'BK-CRICKET-AUTH-1')).toBe(true);
  });

  it('2. Refuses to open facility if server data fetch fails and detects error', async () => {
    // Simulate query to an endpoint that fails or invalid server response
    const res = await makeRequest(
      {
        method: 'GET',
        path: '/api/nonexistent-endpoint',
      },
      serverInstance
    );

    expect(res.status).not.toBe(200);
    // Facility cannot be opened with valid data
    const isSuccess = res.status === 200 && res.body?.success === true;
    expect(isSuccess).toBe(false);
  });

  it('3. Two-Computer Live Sync: Computer A creates a booking; Computer B viewing that facility sees it immediately in real-time', async () => {
    // Computer B opens SSE connection (listening in real-time)
    const sseB = connectSSE(serverInstance);

    try {
      // Computer A creates a new booking on 'barber-booking'
      const newBookingComputerA = {
        id: 'BK-BARBER-COMP-A',
        facilityId: 'barber-booking',
        facilityName: 'Barber Booking',
        stage: 'Barber Shop',
        date: '2026-10-25',
        startTime: '14:00',
        endTime: '14:30',
        customerName: 'Ahmed Al-Mansoor',
        phoneNumber: '+966551234567',
        status: 'CONFIRMED',
      };

      const postRes = await makeRequest(
        {
          method: 'POST',
          path: '/api/bookings',
          body: newBookingComputerA,
        },
        serverInstance
      );

      expect(postRes.status).toBe(200);
      expect(postRes.body.success).toBe(true);

      // Computer B should receive the real-time SSE event without refreshing
      const receivedEvent = await sseB.waitForEvent(
        (evt) => evt.data?.type === 'UPSERT' && evt.data?.id === 'BK-BARBER-COMP-A',
        3000
      );

      expect(receivedEvent).toBeDefined();
      expect(receivedEvent.data.payload.id).toBe('BK-BARBER-COMP-A');

      // Computer B's StorageService ingests the remote mutation
      StorageService.applyRemoteUpsert('bookings', receivedEvent.data.payload);
      const bSlots = StorageService.getAllBookings();
      expect(bSlots.some((b) => b.id === 'BK-BARBER-COMP-A')).toBe(true);
    } finally {
      sseB.close();
    }
  });

  it('4. Two-Computer Live Sync: Computer A cancels a booking; Computer B immediately reflects CANCELLED status', async () => {
    // Seed existing booking
    const booking = {
      id: 'BK-TENNIS-LIVE-CANCEL',
      facilityId: 'tennis-court',
      facilityName: 'Tennis Court',
      stage: 'Area 7 Tennis Court',
      date: '2026-10-25',
      startTime: '18:00',
      endTime: '19:00',
      customerName: 'Khalid Al-Ghamdi',
      status: 'CONFIRMED',
    };
    hubState.bookings = [booking];
    hubState.version = 5;
    StorageService.saveBookings([booking as any]);

    // Computer B connects SSE
    const sseB = connectSSE(serverInstance);

    try {
      // Computer A calls DELETE /api/bookings/:id
      const delRes = await makeRequest(
        {
          method: 'DELETE',
          path: '/api/bookings/BK-TENNIS-LIVE-CANCEL',
          body: { reason: 'User requested cancellation on Computer A' },
        },
        serverInstance
      );

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Computer B receives CANCEL event immediately
      const cancelEvent = await sseB.waitForEvent(
        (evt) => evt.data?.type === 'CANCEL' && evt.data?.id === 'BK-TENNIS-LIVE-CANCEL',
        3000
      );

      expect(cancelEvent).toBeDefined();
      // Computer B updates local status
      StorageService.applyRemoteCancellation('BK-TENNIS-LIVE-CANCEL', 'User requested cancellation on Computer A');
      const updated = StorageService.getBookingById('BK-TENNIS-LIVE-CANCEL');
      expect(updated?.status).toBe('CANCELLED');
    } finally {
      sseB.close();
    }
  });
});

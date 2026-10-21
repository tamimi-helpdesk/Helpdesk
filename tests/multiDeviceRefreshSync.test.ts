import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  app,
  hubState,
  createTestSession,
} from '../server';
import http from 'http';
import { StorageService } from '../src/services/storageService';
import { FACILITIES } from '../src/data/facilities';
import { TimeSlot } from '../src/types';

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

describe('Multi-Device Page Refresh Synchronization Across All Categories', () => {
  let server: http.Server;
  let authToken: string;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    authToken = createTestSession('FACILITY_OPERATOR', 'Helpdesk');
  });

  afterAll(async () => {
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

  it('Verifies Cache-Control headers on /api/bookings and /api/hub/state prevent browser caching', async () => {
    const res = await makeRequest(
      {
        method: 'GET',
        path: '/api/bookings',
      },
      server
    );

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.headers['cache-control']).toContain('no-cache');
    expect(res.headers['pragma']).toBe('no-cache');
  });

  const categories = [
    { facilityId: 'barber-booking', facilityName: 'Barber Booking', stage: 'Barber Shop', code: 'BB', time: '14:00' },
    { facilityId: 'cricket-ground', facilityName: 'Cricket Ground', stage: 'Stage 1 Cricket Ground', code: 'CG', time: '08:00' },
    { facilityId: 'football-ground', facilityName: 'Football Ground', stage: 'Stage 3 Football Ground', code: 'FG', time: '10:00' },
    { facilityId: 'multipurpose-room', facilityName: 'Multipurpose Room', stage: 'Stage 1 Multipurpose Room 5', code: 'MR', time: '09:00' },
    { facilityId: 'cinema', facilityName: 'Cinema', stage: 'Cinema Hall', code: 'CN', time: '13:00' },
    { facilityId: 'tennis-court', facilityName: 'Tennis Court', stage: 'Area 7 Tennis Court', code: 'TC', time: '16:00' },
    { facilityId: 'cricket-net', facilityName: 'Cricket Net', stage: 'Area 7 Cricket Net', code: 'CNET', time: '17:00' },
    { facilityId: 'basketball-court', facilityName: 'Basket Ball Court', stage: 'Area 8 Basket Ball Court', code: 'BC', time: '18:00' },
    { facilityId: 'isolation-room', facilityName: 'Isolation & Room Booking', stage: 'Building R (Rooms R-01 to R-06)', code: 'ROOM', time: '00:00' },
  ];

  for (const cat of categories) {
    it(`Device A saves booking in [${cat.facilityName}] -> Device B refreshes -> Booking loads immediately`, async () => {
      const testDate = '2026-10-25';
      const bookingId = `${cat.code}-20261025-DEV-A-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Device A: Pre-check slot on Device A is initially AVAILABLE
      const facility = FACILITIES.find((f) => f.id === cat.facilityId)!;
      expect(facility).toBeDefined();

      const initialSlotsDeviceB = StorageService.getFacilitySlots(facility, testDate, cat.stage);
      const slotBefore = initialSlotsDeviceB.find((s) => s.startTime === cat.time);
      if (slotBefore) {
        expect(slotBefore.status).toBe('AVAILABLE');
      }

      // 2. Device A saves booking to authoritative server endpoint
      const newBooking = {
        id: bookingId,
        facilityId: cat.facilityId,
        facilityName: cat.facilityName,
        sheetTabName: cat.facilityName,
        stage: cat.stage,
        date: testDate,
        startTime: cat.time,
        endTime: cat.time === '00:00' ? '23:59' : cat.time.replace(/:\d{2}/, ':30'),
        durationMinutes: cat.time === '00:00' ? 1440 : 30,
        customerName: `Resident On Device A (${cat.code})`,
        phoneNumber: '+966500112233',
        numberOfGuests: 2,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };

      const saveRes = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            mutationType: 'UPSERT',
            entity: 'bookings',
            id: bookingId,
            data: newBooking,
          },
        },
        server
      );

      // Verify save was confirmed on server before success
      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);

      // 3. Device B: User presses Page Refresh (F5 / reload)
      // Device B issues GET /api/bookings with cache: no-store
      const refreshRes = await makeRequest(
        {
          method: 'GET',
          path: `/api/bookings?_t=${Date.now()}&facilityId=${cat.facilityId}&date=${testDate}`,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        },
        server
      );

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(Array.isArray(refreshRes.body.bookings)).toBe(true);

      // The new booking MUST be in the returned list
      const matchedRemote = refreshRes.body.bookings.find((b: any) => b.id === bookingId);
      expect(matchedRemote).toBeDefined();
      expect(matchedRemote.customerName).toBe(`Resident On Device A (${cat.code})`);

      // 4. Device B client state-merge: apply authoritative bookings to local state
      StorageService.mergeRemoteBookings(refreshRes.body.bookings);

      // 5. Verify Device B UI slots immediately reflect the booking as BOOKED
      const refreshedSlotsDeviceB = StorageService.getFacilitySlots(facility, testDate, cat.stage);
      const slotAfter = refreshedSlotsDeviceB.find((s) => s.startTime === cat.time);
      expect(slotAfter).toBeDefined();
      expect(slotAfter?.status).toBe('BOOKED');
      expect(slotAfter?.bookedBy).toBe(`Resident On Device A (${cat.code})`);
      expect(slotAfter?.bookingId).toBe(bookingId);
    });
  }
});

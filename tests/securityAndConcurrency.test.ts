import { describe, it, expect, beforeEach } from 'vitest';
import {
  app,
  hubState,
  serverSessions,
  createTestSession,
  verifySignedToken,
  signSessionToken,
  checkServerBookingConflict,
  reconcileServerIsolationRooms,
  doTimeRangesOverlap,
  mutationMutex,
} from '../server';
import http from 'http';

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

describe('PART 3: Backend Security, Concurrency and Data Reconciliation', () => {
  let testServer: http.Server;

  beforeEach(async () => {
    // Reset hubState
    hubState.version = 1;
    hubState.bookings = [];
    hubState.isolationRooms = [];
    hubState.deletedIds = {};
    hubState.cancelledIds = {};

    if (!testServer) {
      await new Promise<void>((resolve) => {
        testServer = http.createServer(app);
        testServer.listen(0, '127.0.0.1', () => resolve());
      });
    }
  });

  describe('1. Endpoint Security & Authorization', () => {
    it('strictly disables arbitrary code execution in production (/api/execute-code returns 403 Forbidden)', async () => {
      const res = await makeRequest(
        {
          method: 'POST',
          path: '/api/execute-code',
          body: { code: 'console.log("malicious code");' },
        },
        testServer
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('disabled for production security');
    });

    it('rejects unauthenticated mutations to /api/hub/mutate with 401 Unauthorized', async () => {
      const res = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          body: {
            mutationType: 'UPSERT',
            entity: 'bookings',
            id: 'bk-unauth-1',
            data: { id: 'bk-unauth-1', customerName: 'Intruder' },
          },
        },
        testServer
      );

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('rejects DELETE mutations by non-admin users with 403 Forbidden', async () => {
      const regularToken = createTestSession('FACILITY_OPERATOR', 'StaffMember');
      const res = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: {
            Authorization: `Bearer ${regularToken}`,
          },
          body: {
            mutationType: 'DELETE',
            entity: 'bookings',
            id: 'bk-delete-attempt-1',
          },
        },
        testServer
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('allows DELETE mutations by Super Administrator / Admin', async () => {
      const adminToken = createTestSession('SUPER_ADMIN', 'ExecutiveAdmin');
      // Pre-seed booking
      hubState.bookings.push({
        id: 'bk-to-delete',
        customerName: 'Old Booking',
        status: 'CONFIRMED',
      });

      const res = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: {
            mutationType: 'DELETE',
            entity: 'bookings',
            id: 'bk-to-delete',
          },
        },
        testServer
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(hubState.deletedIds['bk-to-delete']).toBeDefined();
    });

    it('validates mutation request structure (rejects invalid mutationType and invalid entities)', async () => {
      const adminToken = createTestSession('SUPER_ADMIN', 'ExecutiveAdmin');

      const invalidTypeRes = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            mutationType: 'MALICIOUS_DROP_TABLE',
            entity: 'bookings',
            id: '123',
          },
        },
        testServer
      );
      expect(invalidTypeRes.status).toBe(400);

      const invalidEntityRes = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            mutationType: 'UPSERT',
            entity: 'passwords_table',
            id: '123',
            data: {},
          },
        },
        testServer
      );
      expect(invalidEntityRes.status).toBe(400);
    });

    it('blocks path traversal and malicious ID formats', async () => {
      const adminToken = createTestSession('SUPER_ADMIN', 'ExecutiveAdmin');
      const res = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            mutationType: 'DELETE',
            entity: 'bookings',
            id: '../../etc/passwd',
          },
        },
        testServer
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid record ID format');
    });

    it('enforces CSRF protection for cookie-only requests from mismatched external origins', async () => {
      const validToken = createTestSession('Admin', 'limon');
      const res = await makeRequest(
        {
          method: 'POST',
          path: '/api/hub/mutate',
          headers: {
            Cookie: `tamimi_session=${validToken}`,
            Origin: 'https://evil-attacker-site.com',
            Host: '127.0.0.1',
          },
          body: {
            mutationType: 'UPSERT',
            entity: 'bookings',
            id: 'csrf-test-bk',
            data: { customerName: 'CSRF Exploit' },
          },
        },
        testServer
      );

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('CSRF protection: untrusted origin');
    });

    it('generates cryptographically verifiable signed session tokens with tamper detection', () => {
      const token = signSessionToken({
        username: 'test_manager',
        role: 'Admin',
        fullName: 'Test Manager',
      });

      expect(typeof token).toBe('string');
      const verified = verifySignedToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.username).toBe('test_manager');
      expect(verified?.role).toBe('Admin');

      // Tampered token test: change payload or signature
      const parts = token.split('.');
      const tampered = parts[0] + '.' + parts[1].slice(0, -2) + 'aa.' + parts[2];
      const verifiedTampered = verifySignedToken(tampered);
      expect(verifiedTampered).toBeNull();
    });
  });

  describe('2. Simultaneous Conflicting Booking Prevention', () => {
    it('detects overlapping time ranges correctly', () => {
      expect(doTimeRangesOverlap('10:00', '11:00', '10:30', '11:30')).toBe(true);
      expect(doTimeRangesOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false);
      expect(doTimeRangesOverlap('14:00', '16:00', '14:30', '15:30')).toBe(true);
      expect(doTimeRangesOverlap('14:00', '15:00', '16:00', '17:00')).toBe(false);
    });

    it('detects resource conflict for exclusive resources (Cinema Hall)', () => {
      hubState.bookings = [
        {
          id: 'BK-EXISTING-1',
          facilityId: 'cinema',
          facilityName: 'Cinema',
          stage: 'Cinema Hall',
          date: '2026-11-20',
          startTime: '14:00',
          endTime: '16:00',
          status: 'CONFIRMED',
          customerName: 'User A',
        },
      ];

      const conflictCheck = checkServerBookingConflict({
        id: 'BK-NEW-2',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-11-20',
        startTime: '15:00',
        endTime: '17:00',
        status: 'CONFIRMED',
      });

      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflictingBooking?.id).toBe('BK-EXISTING-1');
    });

    it('allows bookings on different dates or non-overlapping hours', () => {
      hubState.bookings = [
        {
          id: 'BK-EXISTING-1',
          facilityId: 'cinema',
          facilityName: 'Cinema',
          stage: 'Cinema Hall',
          date: '2026-11-20',
          startTime: '14:00',
          endTime: '16:00',
          status: 'CONFIRMED',
        },
      ];

      // Non-overlapping time same day
      const nonOverlapping = checkServerBookingConflict({
        id: 'BK-NEW-2',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-11-20',
        startTime: '16:00',
        endTime: '18:00',
        status: 'CONFIRMED',
      });
      expect(nonOverlapping.hasConflict).toBe(false);

      // Different day
      const differentDay = checkServerBookingConflict({
        id: 'BK-NEW-3',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-11-21',
        startTime: '14:00',
        endTime: '16:00',
        status: 'CONFIRMED',
      });
      expect(differentDay.hasConflict).toBe(false);
    });

    it('allows bookings on different resource stages (e.g. Chair 1 vs Chair 2 in Barbershop)', () => {
      hubState.bookings = [
        {
          id: 'BK-BARBER-CHAIR1',
          facilityId: 'barbershop',
          facilityName: 'Barbershop',
          stage: 'Chair 1',
          date: '2026-11-20',
          startTime: '10:00',
          endTime: '11:00',
          status: 'CONFIRMED',
        },
      ];

      const chair2Booking = checkServerBookingConflict({
        id: 'BK-BARBER-CHAIR2',
        facilityId: 'barbershop',
        facilityName: 'Barbershop',
        stage: 'Chair 2',
        date: '2026-11-20',
        startTime: '10:00',
        endTime: '11:00',
        status: 'CONFIRMED',
      });

      expect(chair2Booking.hasConflict).toBe(false);
    });

    it('ignores cancelled or rejected bookings during conflict detection', () => {
      hubState.bookings = [
        {
          id: 'BK-CANCELLED-1',
          facilityId: 'cinema',
          facilityName: 'Cinema',
          stage: 'Cinema Hall',
          date: '2026-11-20',
          startTime: '14:00',
          endTime: '16:00',
          status: 'CANCELLED',
        },
      ];

      const check = checkServerBookingConflict({
        id: 'BK-REUSE-SLOT',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-11-20',
        startTime: '14:00',
        endTime: '16:00',
        status: 'CONFIRMED',
      });

      expect(check.hasConflict).toBe(false);
    });

    it('ensures idempotent updates: resaving the same booking ID does not trigger self-conflict', () => {
      const existing = {
        id: 'BK-IDEMPOTENT-1',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-11-20',
        startTime: '14:00',
        endTime: '16:00',
        status: 'CONFIRMED',
        numberOfGuests: 2,
      };
      hubState.bookings = [existing];

      const updateCheck = checkServerBookingConflict({
        ...existing,
        numberOfGuests: 4, // updating field on same booking
      });

      expect(updateCheck.hasConflict).toBe(false);
    });

    it('handles simultaneous competing booking mutations over HTTP, accepting only 1 and rejecting the other with 409 Conflict', async () => {
      const userTokenA = createTestSession('FACILITY_OPERATOR', 'OperatorA');
      const userTokenB = createTestSession('FACILITY_OPERATOR', 'OperatorB');

      const bookingA = {
        id: 'BK-CONCURRENT-A',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-12-01',
        startTime: '18:00',
        endTime: '20:00',
        customerName: 'Guest Alice',
        status: 'CONFIRMED',
      };

      const bookingB = {
        id: 'BK-CONCURRENT-B',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-12-01',
        startTime: '18:30', // Overlaps with bookingA
        endTime: '20:30',
        customerName: 'Guest Bob',
        status: 'CONFIRMED',
      };

      // Send both requests concurrently
      const [resA, resB] = await Promise.all([
        makeRequest(
          {
            method: 'POST',
            path: '/api/hub/mutate',
            headers: { Authorization: `Bearer ${userTokenA}` },
            body: {
              mutationType: 'UPSERT',
              entity: 'bookings',
              id: bookingA.id,
              data: bookingA,
            },
          },
          testServer
        ),
        makeRequest(
          {
            method: 'POST',
            path: '/api/hub/mutate',
            headers: { Authorization: `Bearer ${userTokenB}` },
            body: {
              mutationType: 'UPSERT',
              entity: 'bookings',
              id: bookingB.id,
              data: bookingB,
            },
          },
          testServer
        ),
      ]);

      const statuses = [resA.status, resB.status];
      // Exactly one must succeed (200) and exactly one must fail with 409 Conflict
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      // Verify that the server's confirmed bookings count contains only 1 booking for this slot
      const cinemaBookings = hubState.bookings.filter(
        (b) => b.facilityId === 'cinema' && b.date === '2026-12-01'
      );
      expect(cinemaBookings.length).toBe(1);
    });
  });

  describe('3. Isolation Data Reconciliation & Occupancy Preservation', () => {
    it('preserves existing occupant details (medical notes, check-in, bed) when incoming update has partial/empty data', () => {
      // Pre-seed room R-01 with occupant
      hubState.isolationRooms = [
        {
          id: 'ISO-R-01',
          buildingNumber: 'R-01',
          status: 'Occupied',
          occupants: [
            {
              bedNumber: 1,
              patientName: 'Mohammad Al-Harbi',
              medicalNotes: 'Under 14-day observation',
              admissionDate: '2026-10-10',
            },
          ],
          patientName: 'Mohammad Al-Harbi',
          checkIn: '2026-10-10',
        },
      ];

      // Simulate incoming partial synchronization data where patientName and notes are omitted
      const incomingPartial = [
        {
          id: 'ISO-R-01',
          buildingNumber: 'R-01',
          status: 'Occupied',
          occupants: [], // empty/missing from partial client import
        },
      ];

      const reconciled = reconcileServerIsolationRooms(incomingPartial);
      const r01 = reconciled.find((r) => r.buildingNumber === 'R-01' || r.id === 'ISO-R-01');

      expect(r01).toBeDefined();
      expect(r01.status).toBe('Occupied');
      expect(r01.occupants.length).toBe(1);
      expect(r01.occupants[0].patientName).toBe('Mohammad Al-Harbi');
      expect(r01.occupants[0].medicalNotes).toBe('Under 14-day observation');
    });

    it('accurately records transfer history without duplicating or losing patient records', () => {
      hubState.isolationRooms = [
        {
          id: 'ISO-R-01',
          buildingNumber: 'R-01',
          status: 'Occupied',
          occupants: [{ bedNumber: 1, patientName: 'Patient Transfer Test' }],
        },
        {
          id: 'ISO-R-02',
          buildingNumber: 'R-02',
          status: 'VACANT',
          occupants: [],
        },
      ];

      // Perform transfer mutation simulation
      const transferUpdate = [
        {
          id: 'ISO-R-01',
          buildingNumber: 'R-01',
          status: 'VACANT',
          occupants: [],
          transferHistory: [{ toRoom: 'R-02', date: '2026-10-14' }],
        },
        {
          id: 'ISO-R-02',
          buildingNumber: 'R-02',
          status: 'Occupied',
          occupants: [{ bedNumber: 1, patientName: 'Patient Transfer Test' }],
        },
      ];

      const reconciled = reconcileServerIsolationRooms(transferUpdate);
      const r01 = reconciled.find((r) => r.buildingNumber === 'R-01');
      const r02 = reconciled.find((r) => r.buildingNumber === 'R-02');

      expect(r01.status).toBe('VACANT');
      expect(r01.occupants.length).toBe(0);
      expect(r02.status).toBe('Occupied');
      expect(r02.occupants[0].patientName).toBe('Patient Transfer Test');
    });

    it('correctly handles normal discharge without resurrecting discharged occupants', () => {
      hubState.isolationRooms = [
        {
          id: 'ISO-B-01',
          buildingNumber: 'B-01',
          status: 'Occupied',
          occupants: [{ bedNumber: 1, patientName: 'Recovered Patient' }],
        },
      ];

      // Explicit discharge mutation
      const dischargeUpdate = [
        {
          id: 'ISO-B-01',
          buildingNumber: 'B-01',
          status: 'VACANT',
          occupants: [],
          dischargeDate: '2026-10-14',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const reconciled = reconcileServerIsolationRooms(dischargeUpdate);
      const b01 = reconciled.find((r) => r.buildingNumber === 'B-01');

      expect(b01.status).toBe('VACANT');
      expect(b01.occupants.length).toBe(0);
    });
  });
});

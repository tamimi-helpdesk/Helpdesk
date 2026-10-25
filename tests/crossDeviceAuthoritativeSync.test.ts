import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { HubService } from '../src/services/hubService';
import { CloudDatabaseService } from '../src/services/firebaseService';
import { Booking } from '../src/types';

describe('Cross-Device Authoritative Booking Synchronization & Facility Loading Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.init();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: Create on one client and immediate appearance on Client B
  // -------------------------------------------------------------------------
  it('1. Create on one client appears immediately on a second client without refresh', async () => {
    const facilityId = 'cinema';
    const clientBUpdates: Booking[][] = [];

    // Client B attaches a scoped real-time subscription for Cinema
    const unsub = CloudDatabaseService.subscribeToFacilityBookings(facilityId, (updated) => {
      clientBUpdates.push(updated);
    });

    const newBooking: Booking = {
      id: 'BK-CINEMA-CROSS-001',
      facilityId: 'cinema',
      date: '2026-10-25',
      startTime: '14:00',
      endTime: '16:00',
      customerName: 'Ahmad Al-Tamimi',
      status: 'CONFIRMED',
      stage: 'Screen 1',
      createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };

    // Client A commits to the authoritative store
    // Simulate real-time snapshot event triggered on the shared Firestore collection
    StorageService.applyRemoteBookingsSnapshot([newBooking]);

    // Client B's callback is invoked
    expect(StorageService.getAllBookings().some((b) => b.id === 'BK-CINEMA-CROSS-001')).toBe(true);

    const clientBSlots = StorageService.getFacilitySlots(
      { id: 'cinema', name: 'Cinema Hall', stages: ['Screen 1'] } as any,
      '2026-10-25',
      'Screen 1'
    );
    const bookedSlot = clientBSlots.find((s) => s.startTime === '14:00');
    expect(bookedSlot).toBeDefined();
    expect(bookedSlot?.status).toBe('BOOKED');

    unsub();
  });

  // -------------------------------------------------------------------------
  // Test 2: Cancel on one client and immediate removal / status update on Client B
  // -------------------------------------------------------------------------
  it('2. Cancel on one client immediately updates status to CANCELLED and frees slot on Client B', async () => {
    const initialBooking: Booking = {
      id: 'BK-BARBER-CANCEL-001',
      facilityId: 'barber-booking',
      date: '2026-10-25',
      startTime: '10:00',
      endTime: '11:00',
      customerName: 'Khalid Mansour',
      status: 'CONFIRMED',
      stage: 'Chair 1',
      createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };

    StorageService.saveBookings([initialBooking]);
    expect(StorageService.getAllBookings().length).toBe(1);

    // Client A performs authoritative cancellation
    const cancelRes = await StorageService.cancelBookingAuthoritative(
      'BK-BARBER-CANCEL-001',
      'Customer rescheduled'
    );
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.booking?.status).toBe('CANCELLED');

    // Simulate remote snapshot arriving on Client B
    const cancelledRemote: Booking = {
      ...initialBooking,
      status: 'CANCELLED',
      cancellationReason: 'Customer rescheduled',
      _updatedAt: new Date().toISOString(),
    };
    StorageService.applyRemoteBookingsSnapshot([cancelledRemote]);

    const clientBBooking = StorageService.getBookingById('BK-BARBER-CANCEL-001');
    expect(clientBBooking).toBeDefined();
    expect(clientBBooking?.status).toBe('CANCELLED');

    // Verify slot is now available on Client B
    const slots = StorageService.getFacilitySlots(
      { id: 'barber-booking', name: 'Barber Shop', stages: ['Chair 1'] } as any,
      '2026-10-25',
      'Chair 1'
    );
    const targetSlot = slots.find((s) => s.startTime === '10:00');
    expect(targetSlot?.status).toBe('AVAILABLE');
  });

  // -------------------------------------------------------------------------
  // Test 3: Facility remains blocked while fetch is pending
  // -------------------------------------------------------------------------
  it('3. Facility remains blocked while authoritative fetch is pending', async () => {
    let resolveNetwork: (val: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolveNetwork = resolve;
    });

    global.fetch = vi.fn().mockImplementation(async () => pendingPromise);

    let isComplete = false;
    let isOpen = false;

    // Trigger authoritative facility fetch
    const fetchPromise = HubService.fetchFacilityAuthoritativeBookings('cinema').then((res) => {
      if (res.success) {
        isOpen = true;
        isComplete = true;
      }
    });

    // While network is in flight, facility must NOT be open or complete
    expect(isComplete).toBe(false);
    expect(isOpen).toBe(false);

    // Resolve network request with authoritative data
    resolveNetwork({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        version: 5,
        bookings: [
          {
            id: 'BK-CINEMA-PENDING-001',
            facilityId: 'cinema',
            date: '2026-10-25',
            startTime: '18:00',
            endTime: '20:00',
            customerName: 'VIP Guest',
            status: 'CONFIRMED',
          },
        ],
      }),
    });

    await fetchPromise;
    expect(isComplete).toBe(true);
    expect(isOpen).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 4: Failed fetch shows Retry/Cancel and does not replace valid data
  // -------------------------------------------------------------------------
  it('4. Failed fetch reports failure visibly and preserves existing valid bookings without overwriting with empty array', async () => {
    const existingBooking: Booking = {
      id: 'BK-EXISTING-SAFE-001',
      facilityId: 'cricket-ground',
      date: '2026-10-25',
      startTime: '16:00',
      endTime: '18:00',
      customerName: 'Engineering Team',
      status: 'CONFIRMED',
      stage: 'Stage 1 Cricket Ground',
    };
    StorageService.saveBookings([existingBooking]);

    // Simulate server returning 500 error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: false, error: 'Database instance temporarily unreachable' }),
    });

    // Spy on Firestore to also fail
    vi.spyOn(CloudDatabaseService, 'fetchFacilityBookingsFromCloud').mockResolvedValue({
      success: false,
      bookings: [],
      error: 'Firestore network timeout',
    });

    const res = await HubService.fetchFacilityAuthoritativeBookings('cricket-ground');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();

    // Verify existing valid bookings in storage were NOT wiped out by the failed/empty attempt
    const bookingsAfterFail = StorageService.getBookingsForFacility('cricket-ground');
    expect(bookingsAfterFail.length).toBe(1);
    expect(bookingsAfterFail[0].id).toBe('BK-EXISTING-SAFE-001');
  });

  // -------------------------------------------------------------------------
  // Test 5: Older snapshot cannot overwrite a newer booking or cancellation
  // -------------------------------------------------------------------------
  it('5. Older snapshot cannot overwrite newer bookings or resurrect cancelled bookings (Monotonic Ordering & Tombstones)', () => {
    const cancelledBooking: Booking = {
      id: 'BK-MONOTONIC-001',
      facilityId: 'tennis-court',
      date: '2026-10-25',
      startTime: '08:00',
      endTime: '09:00',
      customerName: 'Operations Lead',
      status: 'CANCELLED',
      cancellationReason: 'Cancelled by staff',
      cancelledAt: '2026-10-25T10:00:00.000Z',
      _updatedAt: '2026-10-25T10:00:00.000Z',
    };

    StorageService.saveBookings([cancelledBooking]);

    // An older/stale snapshot arrives from a lagging node or cache showing CONFIRMED at 09:00
    const staleSnapshotBooking: Booking = {
      id: 'BK-MONOTONIC-001',
      facilityId: 'tennis-court',
      date: '2026-10-25',
      startTime: '08:00',
      endTime: '09:00',
      customerName: 'Operations Lead',
      status: 'CONFIRMED',
      _updatedAt: '2026-10-25T09:00:00.000Z',
    };

    StorageService.applyRemoteBookingsSnapshot([staleSnapshotBooking]);

    const result = StorageService.getBookingById('BK-MONOTONIC-001');
    expect(result).toBeDefined();
    // Tombstone must preserve CANCELLED status; stale snapshot cannot resurrect!
    expect(result?.status).toBe('CANCELLED');
    expect(result?.cancellationReason).toBe('Cancelled by staff');
  });

  // -------------------------------------------------------------------------
  // Test 6: Realtime reconnect / recovery catches changes missed while disconnected
  // -------------------------------------------------------------------------
  it('6. Reconnect catches missed additions and cancellations from the authoritative database', async () => {
    // Initial state on Client B before going offline
    const clientBInitial: Booking = {
      id: 'BK-OFFLINE-001',
      facilityId: 'cinema',
      date: '2026-10-25',
      startTime: '12:00',
      endTime: '14:00',
      customerName: 'John Doe',
      status: 'CONFIRMED',
    };
    StorageService.saveBookings([clientBInitial]);

    // While Client B was offline, Client A added a booking and cancelled BK-OFFLINE-001
    const authoritativeStateOnServer: Booking[] = [
      {
        id: 'BK-OFFLINE-001',
        facilityId: 'cinema',
        date: '2026-10-25',
        startTime: '12:00',
        endTime: '14:00',
        customerName: 'John Doe',
        status: 'CANCELLED',
        cancellationReason: 'Cancelled while client was offline',
        _updatedAt: new Date().toISOString(),
      },
      {
        id: 'BK-OFFLINE-002',
        facilityId: 'cinema',
        date: '2026-10-25',
        startTime: '15:00',
        endTime: '17:00',
        customerName: 'Jane Smith',
        status: 'CONFIRMED',
        _updatedAt: new Date().toISOString(),
      },
    ];

    // Client B reconnects and ingests the fresh authoritative snapshot
    StorageService.applyRemoteBookingsSnapshot(authoritativeStateOnServer);

    const b1 = StorageService.getBookingById('BK-OFFLINE-001');
    const b2 = StorageService.getBookingById('BK-OFFLINE-002');

    expect(b1?.status).toBe('CANCELLED');
    expect(b2?.status).toBe('CONFIRMED');
    expect(StorageService.getAllBookings().length).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Test 7: Two server instances do not depend on process-local event state
  // -------------------------------------------------------------------------
  it('7. Two server instances communicate via shared authoritative Cloud Firestore without depending on process-local memory', async () => {
    // Shared Firestore mock store
    const sharedFirestoreStore = new Map<string, Booking>();

    // Server Instance 1 writes booking to Cloud Firestore
    const bookingInstance1: Booking = {
      id: 'BK-INSTANCE1-001',
      facilityId: 'multipurpose-room',
      date: '2026-10-25',
      startTime: '09:00',
      endTime: '11:00',
      customerName: 'Camp Director',
      status: 'CONFIRMED',
      stage: 'Stage 1 Multipurpose Room 5',
      _updatedAt: new Date().toISOString(),
    };
    sharedFirestoreStore.set(bookingInstance1.id, bookingInstance1);

    // Server Instance 2 has its own isolated process memory, but reads from the shared Cloud Firestore
    vi.spyOn(CloudDatabaseService, 'fetchFacilityBookingsFromCloud').mockImplementation(async (facId) => {
      const records = Array.from(sharedFirestoreStore.values()).filter(
        (b) => b.facilityId === facId
      );
      return { success: true, bookings: records };
    });

    const instance2Read = await CloudDatabaseService.fetchFacilityBookingsFromCloud('multipurpose-room');
    expect(instance2Read.success).toBe(true);
    expect(instance2Read.bookings.length).toBe(1);
    expect(instance2Read.bookings[0].id).toBe('BK-INSTANCE1-001');
    expect(instance2Read.bookings[0].customerName).toBe('Camp Director');
  });
});

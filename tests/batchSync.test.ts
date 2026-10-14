import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { Booking } from '../src/types';

describe('Batch and Recurring Booking Synchronization', () => {
  beforeEach(() => {
    // Clean mock localStorage
    localStorage.clear();
    StorageService.clearAllBookings();
  });

  it('correctly handles an array of recurring bookings and creates distinct records', () => {
    const recurringBatch: Booking[] = Array.from({ length: 7 }, (_, i) => ({
      id: `BK-REC-${i + 1}`,
      facilityId: 'barber-booking',
      facilityName: 'Barber Booking',
      sheetTabName: 'Barber Shop',
      date: `2026-11-0${i + 1}`,
      startTime: '10:00',
      endTime: '10:30',
      durationMinutes: 30,
      slotIds: [`SLOT-${i + 1}`],
      numberOfGuests: 1,
      customerName: 'Ahmad Al-Mansoor',
      phoneNumber: '+966501234567',
      status: 'CONFIRMED' as const,
      stage: 'Barber Shop',
      createdAt: new Date().toISOString(),
      isRecurring: true,
      recurringGroupId: 'GRP-BARBER-001',
    }));

    // Apply remote upsert with array of 7 bookings
    StorageService.applyRemoteUpsert('bookings', recurringBatch);

    const all = StorageService.getAllBookings();
    expect(all.length).toBe(7);

    // Verify all 7 IDs exist
    for (let i = 0; i < 7; i++) {
      const found = all.find((b) => b.id === `BK-REC-${i + 1}`);
      expect(found).toBeDefined();
      expect(found?.customerName).toBe('Ahmad Al-Mansoor');
      expect(found?.status).toBe('CONFIRMED');
    }
  });

  it('submitting a batch repeatedly is idempotent and does not produce duplicate records', () => {
    const recurringBatch: Booking[] = [
      {
        id: 'BK-IDEMP-1',
        facilityId: 'football-ground',
        facilityName: 'Football Ground',
        sheetTabName: 'Football Stadium',
        date: '2026-11-10',
        startTime: '18:00',
        endTime: '19:00',
        durationMinutes: 60,
        slotIds: ['SLOT-FB-1'],
        numberOfGuests: 22,
        customerName: 'Team Red Sea',
        phoneNumber: '+966551122334',
        status: 'CONFIRMED' as const,
        stage: 'Stage 3 Football Ground',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'BK-IDEMP-2',
        facilityId: 'football-ground',
        facilityName: 'Football Ground',
        sheetTabName: 'Football Stadium',
        date: '2026-11-11',
        startTime: '18:00',
        endTime: '19:00',
        durationMinutes: 60,
        slotIds: ['SLOT-FB-2'],
        numberOfGuests: 22,
        customerName: 'Team Red Sea',
        phoneNumber: '+966551122334',
        status: 'CONFIRMED' as const,
        stage: 'Stage 3 Football Ground',
        createdAt: new Date().toISOString(),
      },
    ];

    // First application
    StorageService.applyRemoteUpsert('bookings', recurringBatch);
    expect(StorageService.getAllBookings().length).toBe(2);

    // Replay identical batch
    StorageService.applyRemoteUpsert('bookings', recurringBatch);
    expect(StorageService.getAllBookings().length).toBe(2);

    // Third replay with slight modification to customerName
    const updatedBatch = recurringBatch.map((b) => ({ ...b, customerName: 'Team Red Sea Stars' }));
    StorageService.applyRemoteUpsert('bookings', updatedBatch);

    const all = StorageService.getAllBookings();
    expect(all.length).toBe(2);
    expect(all[0].customerName).toBe('Team Red Sea Stars');
    expect(all[1].customerName).toBe('Team Red Sea Stars');
  });

  it('handles empty arrays, malformed entries, and mixed-validity batches without corrupting state', () => {
    // Empty array
    StorageService.applyRemoteUpsert('bookings', []);
    expect(StorageService.getAllBookings().length).toBe(0);

    // Mixed validity batch containing null, undefined, primitives, and valid items
    const mixedBatch: any[] = [
      null,
      undefined,
      'invalid-string',
      12345,
      {
        id: 'BK-VALID-1',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        sheetTabName: 'Cinema',
        date: '2026-11-12',
        startTime: '20:00',
        endTime: '22:00',
        durationMinutes: 120,
        slotIds: ['SLOT-CINEMA-1'],
        numberOfGuests: 15,
        customerName: 'Movie Night Group',
        phoneNumber: '+966500000000',
        status: 'CONFIRMED',
        stage: 'Cinema Hall',
        createdAt: new Date().toISOString(),
      },
      {}, // Missing ID - sanitizeBooking should assign stable ID
    ];

    StorageService.applyRemoteUpsert('bookings', mixedBatch);

    const all = StorageService.getAllBookings();
    // Only the valid objects should be upserted
    expect(all.length).toBe(2);
    expect(all.some((b) => b.id === 'BK-VALID-1')).toBe(true);
  });

  it('verifies single-booking creation and remote updates continue to work seamlessly', () => {
    const singleBooking: Booking = {
      id: 'BK-SINGLE-1',
      facilityId: 'tennis-court',
      facilityName: 'Tennis Court',
      sheetTabName: 'Tennis Court',
      date: '2026-11-15',
      startTime: '07:00',
      endTime: '08:00',
      durationMinutes: 60,
      slotIds: ['SLOT-TC-1'],
      numberOfGuests: 2,
      customerName: 'Dr. Sarah',
      phoneNumber: '+966567890123',
      status: 'CONFIRMED' as const,
      stage: 'Area 7 Tennis Court',
      createdAt: new Date().toISOString(),
    };

    // Single record upsert
    StorageService.applyRemoteUpsert('bookings', singleBooking);

    let all = StorageService.getAllBookings();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('BK-SINGLE-1');
    expect(all[0].customerName).toBe('Dr. Sarah');

    // Update single booking
    const updatedSingle: Booking = {
      ...singleBooking,
      customerName: 'Dr. Sarah Mitchell',
      status: 'CONFIRMED',
    };
    StorageService.applyRemoteUpsert('bookings', updatedSingle);

    all = StorageService.getAllBookings();
    expect(all.length).toBe(1);
    expect(all[0].customerName).toBe('Dr. Sarah Mitchell');
  });

  it('creates a seven-occurrence recurring booking series and cancels the entire group cleanly', () => {
    const dates = [
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-05',
      '2026-12-06',
      '2026-12-07',
    ];

    const result = StorageService.createRecurringBookings({
      facilityId: 'football-ground',
      facilityName: 'Football Ground',
      sheetTabName: 'Football Stadium',
      stage: 'Stage 3 Football Ground',
      dates,
      startTime: '17:00',
      endTime: '18:00',
      durationMinutes: 60,
      customerName: 'Amaala Tournament League',
      phoneNumber: '+966509998888',
      numberOfGuests: 22,
      recurringSummary: '7-day Amaala Tournament League',
    });

    expect(result.success).toBe(true);
    expect(result.createdBookings.length).toBe(7);
    expect(result.skippedDates.length).toBe(0);

    const recurringGroupId = result.createdBookings[0].recurringGroupId!;
    expect(recurringGroupId).toBeDefined();

    const all = StorageService.getAllBookings();
    expect(all.filter((b) => b.recurringGroupId === recurringGroupId).length).toBe(7);

    // Now cancel the recurring group
    const cancelRes = StorageService.cancelRecurringGroup(recurringGroupId, 'Tournament rescheduled');
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.cancelledCount).toBe(7);

    const updated = StorageService.getAllBookings();
    const groupBookings = updated.filter((b) => b.recurringGroupId === recurringGroupId);
    expect(groupBookings.length).toBe(7);
    groupBookings.forEach((b) => {
      expect(b.status).toBe('CANCELLED');
      expect(b.cancellationReason).toBe('Tournament rescheduled');
      expect(b.cancelledAt).toBeDefined();
    });

    // Verify slots are freed: checkRecurringAvailability for the same 7 dates now shows 0 conflicts!
    const recheckAvail = StorageService.checkRecurringAvailability({
      facilityId: 'football-ground',
      stage: 'Stage 3 Football Ground',
      dates,
      startTime: '17:00',
      endTime: '18:00',
    });
    expect(recheckAvail.availableDates.length).toBe(7);
    expect(recheckAvail.conflictDates.length).toBe(0);

    // Verify retried batch delivery does NOT resurrect the cancelled group
    StorageService.applyRemoteUpsert('bookings', result.createdBookings);
    const afterRetry = StorageService.getAllBookings();
    const groupAfterRetry = afterRetry.filter((b) => b.recurringGroupId === recurringGroupId);
    groupAfterRetry.forEach((b) => {
      expect(b.status).toBe('CANCELLED');
    });
  });

  it('tests applyRemoteBatchCancellation releases slots and updates all occurrences atomically', () => {
    const b1: Booking = {
      id: 'BK-BTC-1',
      facilityId: 'tennis-court',
      facilityName: 'Tennis Court',
      sheetTabName: 'Tennis Court',
      stage: 'Area 7 Tennis Court',
      date: '2026-12-10',
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      slotIds: ['SLOT-TC-B1'],
      numberOfGuests: 2,
      customerName: 'Player One',
      phoneNumber: '+966501112233',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    const b2: Booking = {
      id: 'BK-BTC-2',
      facilityId: 'tennis-court',
      facilityName: 'Tennis Court',
      sheetTabName: 'Tennis Court',
      stage: 'Area 7 Tennis Court',
      date: '2026-12-11',
      startTime: '08:00',
      endTime: '09:00',
      durationMinutes: 60,
      slotIds: ['SLOT-TC-B2'],
      numberOfGuests: 2,
      customerName: 'Player One',
      phoneNumber: '+966501112233',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveBookings([b1, b2]);
    expect(StorageService.getAllBookings().length).toBe(2);

    // Apply batch cancellation via remote broadcast
    StorageService.applyRemoteBatchCancellation(['BK-BTC-1', 'BK-BTC-2'], 'Weather Condition');

    const all = StorageService.getAllBookings();
    expect(all[0].status).toBe('CANCELLED');
    expect(all[0].cancellationReason).toBe('Weather Condition');
    expect(all[1].status).toBe('CANCELLED');
    expect(all[1].cancellationReason).toBe('Weather Condition');
  });
});


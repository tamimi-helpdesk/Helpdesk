import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { OfflineQueueService } from '../src/services/offlineQueueService';
import { Booking } from '../src/types';

describe('Recurring Series Cancellation and Conflict Resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.clearAllBookings();
  });

  it('cancels all bookings belonging to a recurring group while preserving IDs and metadata', () => {
    const groupId = 'GRP-TEST-RECURRING-100';
    const bookings: Booking[] = [
      {
        id: 'BK-GRP-1',
        facilityId: 'barber-booking',
        facilityName: 'Barber Booking',
        sheetTabName: 'Barber Shop',
        date: '2026-12-01',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        slotIds: ['SLOT-BARBER-1'],
        numberOfGuests: 1,
        customerName: 'Sultan Al-Otaibi',
        phoneNumber: '+966509988776',
        status: 'CONFIRMED',
        stage: 'Barber Shop',
        createdAt: new Date().toISOString(),
        isRecurring: true,
        recurringGroupId: groupId,
      },
      {
        id: 'BK-GRP-2',
        facilityId: 'barber-booking',
        facilityName: 'Barber Booking',
        sheetTabName: 'Barber Shop',
        date: '2026-12-02',
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        slotIds: ['SLOT-BARBER-2'],
        numberOfGuests: 1,
        customerName: 'Sultan Al-Otaibi',
        phoneNumber: '+966509988776',
        status: 'CONFIRMED',
        stage: 'Barber Shop',
        createdAt: new Date().toISOString(),
        isRecurring: true,
        recurringGroupId: groupId,
      },
      {
        id: 'BK-OTHER-3',
        facilityId: 'barber-booking',
        facilityName: 'Barber Booking',
        sheetTabName: 'Barber Shop',
        date: '2026-12-03',
        startTime: '11:00',
        endTime: '11:30',
        durationMinutes: 30,
        slotIds: ['SLOT-BARBER-3'],
        numberOfGuests: 1,
        customerName: 'Other Resident',
        phoneNumber: '+966501112222',
        status: 'CONFIRMED',
        stage: 'Barber Shop',
        createdAt: new Date().toISOString(),
      },
    ];

    StorageService.saveBookings(bookings);
    expect(StorageService.getAllBookings().length).toBe(3);

    // Cancel the recurring group
    const cancelRes = StorageService.cancelRecurringGroup(groupId, 'Emergency Project Meeting', 'Admin Lead');
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.cancelledCount).toBe(2);

    const all = StorageService.getAllBookings();
    expect(all.length).toBe(3);

    const b1 = all.find((b) => b.id === 'BK-GRP-1');
    const b2 = all.find((b) => b.id === 'BK-GRP-2');
    const b3 = all.find((b) => b.id === 'BK-OTHER-3');

    expect(b1?.status).toBe('CANCELLED');
    expect(b1?.cancellationReason).toBe('Emergency Project Meeting');
    expect(b1?.cancelledBy).toBe('Admin Lead');
    expect(b1?.cancelledAt).toBeDefined();

    expect(b2?.status).toBe('CANCELLED');
    expect(b2?.cancellationReason).toBe('Emergency Project Meeting');

    // Unrelated booking is unaffected
    expect(b3?.status).toBe('CONFIRMED');
  });

  it('enforces offline queue conflict resolution: cancel purges pending save for same record', () => {
    // 1. Enqueue a pending saveBooking
    OfflineQueueService.enqueue({
      targetId: 'BK-QUEUE-1',
      action: 'saveBooking',
      facilityName: 'Football Ground',
      description: 'Pending save for match',
      payload: { id: 'BK-QUEUE-1', customerName: 'Initial Player' },
    });

    let queue = OfflineQueueService.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].action).toBe('saveBooking');

    // 2. Enqueue a cancelBooking for the exact same targetId
    OfflineQueueService.enqueue({
      targetId: 'BK-QUEUE-1',
      action: 'cancelBooking',
      facilityName: 'Football Ground',
      description: 'Cancel booking for match',
      payload: { id: 'BK-QUEUE-1', reason: 'Field closed due to weather' },
    });

    queue = OfflineQueueService.getQueue();
    // The older pending saveBooking MUST have been purged so it cannot overwrite the cancellation!
    expect(queue.length).toBe(1);
    expect(queue[0].action).toBe('cancelBooking');
    expect(queue[0].targetId).toBe('BK-QUEUE-1');
  });

  it('guarantees remote upsert cannot resurrect a cancelled booking without forceRevive', () => {
    const b: Booking = {
      id: 'BK-RESURRECT-TEST',
      facilityId: 'cinema',
      facilityName: 'Cinema',
      sheetTabName: 'Cinema',
      date: '2026-11-20',
      startTime: '19:00',
      endTime: '21:00',
      durationMinutes: 120,
      slotIds: ['SLOT-CINEMA-RES'],
      numberOfGuests: 4,
      customerName: 'VIP Group',
      phoneNumber: '+966500000000',
      status: 'CONFIRMED',
      stage: 'Cinema Hall',
      createdAt: new Date().toISOString(),
    };

    StorageService.saveBookings([b]);
    // Cancel the booking locally
    StorageService.cancelBooking('BK-RESURRECT-TEST', 'User request');

    expect(StorageService.getAllBookings()[0].status).toBe('CANCELLED');

    // Attempt remote upsert of older CONFIRMED snapshot
    StorageService.applyRemoteUpsert('bookings', {
      ...b,
      status: 'CONFIRMED',
    });

    // Must remain CANCELLED
    const current = StorageService.getAllBookings()[0];
    expect(current.status).toBe('CANCELLED');
  });
});

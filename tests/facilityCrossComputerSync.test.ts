import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { HubService } from '../src/services/hubService';
import { Booking } from '../src/types';

describe('Cross-Computer Facility Real-Time Sync & Live Mutation Test', () => {
  beforeEach(() => {
    StorageService.init();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('demonstrates instantaneous cross-computer sync: Computer B booking arrives on Computer A without page refresh', async () => {
    // Computer A initial facility state for Cinema
    const initialBooking: Booking = {
      id: 'BK-CINEMA-COMP-A-001',
      name: 'Computer A User',
      phone: '0501111111',
      facilityId: 'cinema',
      facilityName: 'Cinema',
      stage: 'Cinema Hall',
      date: '2026-10-25',
      startTime: '14:00',
      endTime: '16:00',
      slotIds: ['slot-cinema-1400'],
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    StorageService.setAuthoritativeServerBookings([initialBooking], 'cinema');
    expect(StorageService.getLatestBookingForFacility('cinema').count).toBe(1);

    // Simulate Computer B creating a new booking on Cinema at 18:00
    const computerBBooking: Booking = {
      id: 'BK-CINEMA-COMP-B-002',
      name: 'Computer B User (Remote)',
      phone: '0509999999',
      facilityId: 'cinema',
      facilityName: 'Cinema',
      stage: 'Cinema Hall',
      date: '2026-10-25',
      startTime: '18:00',
      endTime: '20:00',
      slotIds: ['slot-cinema-1800'],
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    // Computer A's real-time event listener receives the live UPSERT broadcast from Server SSE
    StorageService.applyRemoteUpsert('bookings', computerBBooking);

    // Computer A's state now immediately contains the remote booking from Computer B
    const computerABookings = StorageService.getAllBookings();
    expect(computerABookings.some((b) => b.id === 'BK-CINEMA-COMP-B-002')).toBe(true);

    const latest = StorageService.getLatestBookingForFacility('cinema');
    expect(latest.count).toBe(2);
    expect(latest.latestBooking?.name).toBe('Computer B User (Remote)');
    expect(latest.latestTime).toBe('18:00');
  });

  it('demonstrates instantaneous cross-computer cancellation sync: Computer B cancels, Computer A unlocks slot immediately', () => {
    const bookingToCancel: Booking = {
      id: 'BK-CANCEL-CROSS-COMP-1',
      name: 'User Cancelling',
      phone: '0505555555',
      facilityId: 'barber-booking',
      facilityName: 'Barber Booking',
      stage: 'Barber Shop',
      date: '2026-10-25',
      startTime: '11:00',
      endTime: '11:30',
      slotIds: ['barber-1100'],
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    StorageService.setAuthoritativeServerBookings([bookingToCancel], 'barber-booking');
    const activeBefore = StorageService.getAllBookings().filter(
      (b) => b.status === 'CONFIRMED' && b.facilityId === 'barber-booking' && b.slotIds?.includes('barber-1100')
    );
    expect(activeBefore.length).toBe(1);

    // Computer B cancels the booking via Server SSE broadcast
    StorageService.applyRemoteCancel('BK-CANCEL-CROSS-COMP-1', 'Cancelled by Computer B');

    // Computer A immediately sees the slot freed and status updated to CANCELLED
    const afterCancel = StorageService.getBookingById('BK-CANCEL-CROSS-COMP-1');
    expect(afterCancel?.status).toBe('CANCELLED');

    const activeAfter = StorageService.getAllBookings().filter(
      (b) => b.status === 'CONFIRMED' && b.facilityId === 'barber-booking' && b.slotIds?.includes('barber-1100')
    );
    expect(activeAfter.length).toBe(0);
  });
});

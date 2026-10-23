import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HubService } from '../src/services/hubService';
import { StorageService } from '../src/services/storageService';
import { Booking } from '../src/types';

describe('Facility Authoritative Loading Flow & Guard', () => {
  beforeEach(() => {
    StorageService.init();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully fetches authoritative facility bookings and commits them to StorageService', async () => {
    const mockBookings: Booking[] = [
      {
        id: 'BK-CINEMA-LIVE-001',
        name: 'Mansour Al-Otaibi',
        phone: '0501112233',
        department: 'Operations',
        facilityId: 'cinema',
        facilityName: 'Cinema',
        stage: 'Cinema Hall',
        date: '2026-10-25',
        startTime: '10:00',
        endTime: '12:00',
        slotIds: ['slot-1'],
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/bookings')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            version: 10,
            lastUpdated: new Date().toISOString(),
            facilityId: 'cinema',
            bookings: mockBookings,
            deletedIds: {},
            cancelledIds: {},
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const result = await HubService.fetchFacilityAuthoritativeBookings('cinema');
    expect(result.success).toBe(true);
    expect(result.bookingsCount).toBe(1);

    const stored = StorageService.getAllBookings();
    expect(stored.some((b) => b.id === 'BK-CINEMA-LIVE-001')).toBe(true);
  });

  it('correctly handles non-JSON or server failure when cloud fallback also fails, surfacing exact error without silent bypass', async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>503 Service Unavailable</html>',
      };
    });

    const { CloudDatabaseService } = await import('../src/services/firebaseService');
    vi.spyOn(CloudDatabaseService, 'fetchFacilityBookingsFromCloud').mockResolvedValue({
      success: false,
      bookings: [],
      error: 'Simulated Firestore connection failure',
    });

    const result = await HubService.fetchFacilityAuthoritativeBookings('barber-booking');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('503');
    expect(result.error).toContain('Simulated Firestore connection failure');
  });

  it('handles network timeout and abort cleanly with descriptive error when cloud also fails', async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    });

    const { CloudDatabaseService } = await import('../src/services/firebaseService');
    vi.spyOn(CloudDatabaseService, 'fetchFacilityBookingsFromCloud').mockResolvedValue({
      success: false,
      bookings: [],
      error: 'Simulated Firestore offline',
    });

    const result = await HubService.fetchFacilityAuthoritativeBookings('tennis-court');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects invalid facility identifier cleanly', async () => {
    const result = await HubService.fetchFacilityAuthoritativeBookings('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid facility identifier');
  });
});

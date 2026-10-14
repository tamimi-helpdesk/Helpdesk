import { describe, it, expect, beforeEach } from 'vitest';
import { isResourceOrStageMatch, getCanonicalResourceName } from '../src/utils/resourceMatching';
import { isStageMatch, StorageService } from '../src/services/storageService';
import { FACILITIES } from '../src/data/facilities';

describe('Multi-Stage and Facility-Aware Resource Matching and Collision Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.clearAllBookings();
  });

  it('prevents collisions between Multipurpose Room 5 and Room 6', () => {
    // Room 5 vs Room 6 must NEVER collide
    expect(isResourceOrStageMatch('Stage 1 Multipurpose Room 5', 'Stage 1 Multipurpose Room 6', 'multipurpose-room')).toBe(false);
    expect(isResourceOrStageMatch('Multipurpose Room 6', 'Multipurpose Room 5', 'multipurpose-room')).toBe(false);
    expect(isResourceOrStageMatch('MR-5', 'MR-6', 'multipurpose-room')).toBe(false);

    // Same room matches correctly
    expect(isResourceOrStageMatch('Stage 1 Multipurpose Room 5', 'Multipurpose Room 5', 'multipurpose-room')).toBe(true);
    expect(isResourceOrStageMatch('Stage 1 Multipurpose Room 6', 'MR-6', 'multipurpose-room')).toBe(true);
  });

  it('prevents collisions between Cricket Ground Stage 1 and Stage 2', () => {
    // Pitch 1 / Stage 1 vs Pitch 2 / Stage 2 must NEVER collide
    expect(isResourceOrStageMatch('Stage 1 Cricket Ground', 'Stage 2 Cricket Ground', 'cricket-ground')).toBe(false);
    expect(isResourceOrStageMatch('Pitch 1', 'Pitch 2', 'cricket-ground')).toBe(false);
    expect(isResourceOrStageMatch('CG-1', 'CG-2', 'cricket-ground')).toBe(false);

    // Same stage matches
    expect(isResourceOrStageMatch('Stage 1 Cricket Ground', 'Pitch 1', 'cricket-ground')).toBe(true);
    expect(isResourceOrStageMatch('Stage 2 Cricket Ground', 'Turf Pitch 2', 'cricket-ground')).toBe(true);
  });

  it('prevents collisions between Barbershop Chair 1 and Chair 2', () => {
    expect(isResourceOrStageMatch('Chair 1', 'Chair 2', 'barber-booking')).toBe(false);
    expect(isResourceOrStageMatch('Chair A', 'Chair B', 'barber-booking')).toBe(false);

    // Same chair matches
    expect(isResourceOrStageMatch('Chair 1', 'Chair 1', 'barber-booking')).toBe(true);
  });

  it('correctly matches Cinema, Tennis Court, Cricket Net, and Football Ground resources', () => {
    // Cinema Screen / Hall
    expect(isResourceOrStageMatch('Cinema Hall', 'Screen 1', 'cinema')).toBe(true);
    expect(isResourceOrStageMatch('Cinema Hall', 'Hall 1', 'cinema')).toBe(true);

    // Tennis Court
    expect(isResourceOrStageMatch('Area 7 Tennis Court', 'Court A', 'tennis-court')).toBe(true);
    expect(isResourceOrStageMatch('Area 7 Tennis Court', 'Court 1', 'tennis-court')).toBe(true);

    // Cricket Net
    expect(isResourceOrStageMatch('Area 7 Cricket Net', 'Net 1', 'cricket-net')).toBe(true);
    expect(isResourceOrStageMatch('Area 7 Cricket Net', 'Batting Net', 'cricket-net')).toBe(true);

    // Football Ground
    expect(isResourceOrStageMatch('Stage 3 Football Ground', 'Football Field', 'football-ground')).toBe(true);
    expect(isResourceOrStageMatch('Stage 3 Football Ground', 'Stage 3', 'football-ground')).toBe(true);
  });

  it('does not blindly equate resources across different facilities', () => {
    // Chair 1 vs Court A vs Screen 1 vs Stage 1 without facility are distinct strings
    expect(isResourceOrStageMatch('Chair 1', 'Screen 1')).toBe(false);
    expect(isResourceOrStageMatch('Court A', 'Stage 1')).toBe(false);
    expect(isResourceOrStageMatch('Chair 1', 'Court A')).toBe(false);
  });

  it('prevents collisions between Isolation Room R-01 and Room R-02 and across buildings', () => {
    // Room R-01 vs Room R-02
    expect(isResourceOrStageMatch('Room R-01', 'Room R-02', 'isolation-room')).toBe(false);
    expect(isResourceOrStageMatch('R-01', 'R-02', 'isolation-room')).toBe(false);

    // Building R vs Building B
    expect(isResourceOrStageMatch('Room R-01', 'Room B-01', 'isolation-room')).toBe(false);
    expect(isResourceOrStageMatch('Building R', 'Building B', 'isolation-room')).toBe(false);

    // Same room matches
    expect(isResourceOrStageMatch('Room R-01', 'R-01', 'isolation-room')).toBe(true);
    expect(isResourceOrStageMatch('Room B-05', 'B-05', 'isolation-room')).toBe(true);
  });

  it('resolves canonical resource names accurately', () => {
    expect(getCanonicalResourceName('multipurpose-room', 'room 5')).toBe('Stage 1 Multipurpose Room 5');
    expect(getCanonicalResourceName('multipurpose-room', 'mr-6')).toBe('Stage 1 Multipurpose Room 6');
    expect(getCanonicalResourceName('cricket-ground', 'pitch 1')).toBe('Stage 1 Cricket Ground');
    expect(getCanonicalResourceName('cricket-ground', 'pitch 2')).toBe('Stage 2 Cricket Ground');
    expect(getCanonicalResourceName('cinema', 'screen 1')).toBe('Cinema Hall');
    expect(getCanonicalResourceName('tennis-court', 'court a')).toBe('Area 7 Tennis Court');
    expect(getCanonicalResourceName('cricket-net', 'batting net')).toBe('Area 7 Cricket Net');
    expect(getCanonicalResourceName('football-ground', 'turf field')).toBe('Stage 3 Football Ground');
    expect(getCanonicalResourceName('barber-booking', 'chair 1')).toBe('Barber Shop');
    expect(getCanonicalResourceName('barber-booking', 'chair 2')).toBe('Chair 2');
    expect(getCanonicalResourceName('isolation-room', 'r-02')).toBe('Room R-02');
  });

  it('enforces booking collision detection on same stage but allows concurrent booking on different stages', () => {
    // 1. Create a booking on Cricket Ground Stage 1
    const res1 = StorageService.createBooking({
      facilityId: 'cricket-ground',
      facilityName: 'Cricket Ground',
      sheetTabName: 'Cricket Ground',
      stage: 'Stage 1 Cricket Ground',
      date: '2026-11-25',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      slotIds: ['SLOT-CG-1'],
      customerName: 'Team Red Sea A',
      phoneNumber: '+966501112222',
      numberOfGuests: 11,
    });
    expect(res1.success).toBe(true);

    // 2. Attempt duplicate booking on SAME stage at SAME time -> MUST CONFLICT
    const resDuplicate = StorageService.createBooking({
      facilityId: 'cricket-ground',
      facilityName: 'Cricket Ground',
      sheetTabName: 'Cricket Ground',
      stage: 'Stage 1 Cricket Ground',
      date: '2026-11-25',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      slotIds: ['SLOT-CG-1-DUP'],
      customerName: 'Team Red Sea B',
      phoneNumber: '+966503334444',
      numberOfGuests: 11,
    });
    expect(resDuplicate.success).toBe(false);
    expect(resDuplicate.error).toContain('Slot Conflict');

    // 3. Attempt booking on DIFFERENT stage (Stage 2) at SAME time -> MUST SUCCEED
    const resStage2 = StorageService.createBooking({
      facilityId: 'cricket-ground',
      facilityName: 'Cricket Ground',
      sheetTabName: 'Cricket Ground',
      stage: 'Stage 2 Cricket Ground',
      date: '2026-11-25',
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      slotIds: ['SLOT-CG-2'],
      customerName: 'Team Red Sea C',
      phoneNumber: '+966505556666',
      numberOfGuests: 11,
    });
    expect(resStage2.success).toBe(true);

    // 4. Test checkRecurringAvailability detects collision properly
    const availCheck = StorageService.checkRecurringAvailability({
      facilityId: 'cricket-ground',
      stage: 'Stage 1 Cricket Ground',
      dates: ['2026-11-25', '2026-11-26'],
      startTime: '16:00',
      endTime: '17:00',
    });
    expect(availCheck.conflictDates.length).toBe(1);
    expect(availCheck.conflictDates[0].date).toBe('2026-11-25');
    expect(availCheck.availableDates).toEqual(['2026-11-26']);
  });

  it('verifies Cinema screens (Screen 1 vs Screen 2) separate cleanly without collision', () => {
    // Screen 1 vs Screen 2 must NEVER collide
    expect(isResourceOrStageMatch('Screen 1', 'Screen 2', 'cinema')).toBe(false);
    expect(isResourceOrStageMatch('Cinema Hall', 'Screen 2', 'cinema')).toBe(false);
    expect(isResourceOrStageMatch('Screen 1', 'Cinema Hall', 'cinema')).toBe(true);
    expect(isResourceOrStageMatch('Screen 2', 'Screen 2', 'cinema')).toBe(true);

    // Book Screen 1
    const b1 = StorageService.createBooking({
      facilityId: 'cinema',
      facilityName: 'Cinema',
      sheetTabName: 'Cinema',
      stage: 'Screen 1',
      date: '2026-11-28',
      startTime: '20:00',
      endTime: '22:00',
      durationMinutes: 120,
      slotIds: ['SLOT-CINEMA-S1'],
      customerName: 'Movie Night A',
      phoneNumber: '+966501110001',
      numberOfGuests: 20,
    });
    expect(b1.success).toBe(true);

    // Concurrent booking on Screen 2 MUST SUCCEED
    const b2 = StorageService.createBooking({
      facilityId: 'cinema',
      facilityName: 'Cinema',
      sheetTabName: 'Cinema',
      stage: 'Screen 2',
      date: '2026-11-28',
      startTime: '20:00',
      endTime: '22:00',
      durationMinutes: 120,
      slotIds: ['SLOT-CINEMA-S2'],
      customerName: 'Movie Night B',
      phoneNumber: '+966501110002',
      numberOfGuests: 20,
    });
    expect(b2.success).toBe(true);

    // Duplicate on Screen 1 MUST CONFLICT
    const bDup = StorageService.createBooking({
      facilityId: 'cinema',
      facilityName: 'Cinema',
      sheetTabName: 'Cinema',
      stage: 'Screen 1',
      date: '2026-11-28',
      startTime: '20:00',
      endTime: '22:00',
      durationMinutes: 120,
      slotIds: ['SLOT-CINEMA-S1-DUP'],
      customerName: 'Movie Night C',
      phoneNumber: '+966501110003',
      numberOfGuests: 15,
    });
    expect(bDup.success).toBe(false);
    expect(bDup.error).toContain('Slot Conflict');
  });

  it('verifies Barbershop chairs (Chair 1 vs Chair 2) separate cleanly without collision', () => {
    // Book Chair 1
    const b1 = StorageService.createBooking({
      facilityId: 'barber-booking',
      facilityName: 'Barber Booking',
      sheetTabName: 'Barber Shop',
      stage: 'Chair 1',
      date: '2026-11-29',
      startTime: '14:00',
      endTime: '14:30',
      durationMinutes: 30,
      slotIds: ['SLOT-BB-CH1'],
      customerName: 'Resident A',
      phoneNumber: '+966502220001',
      numberOfGuests: 1,
    });
    expect(b1.success).toBe(true);

    // Concurrent booking on Chair 2 MUST SUCCEED
    const b2 = StorageService.createBooking({
      facilityId: 'barber-booking',
      facilityName: 'Barber Booking',
      sheetTabName: 'Barber Shop',
      stage: 'Chair 2',
      date: '2026-11-29',
      startTime: '14:00',
      endTime: '14:30',
      durationMinutes: 30,
      slotIds: ['SLOT-BB-CH2'],
      customerName: 'Resident B',
      phoneNumber: '+966502220002',
      numberOfGuests: 1,
    });
    expect(b2.success).toBe(true);

    // Duplicate on Chair 1 MUST CONFLICT
    const bDup = StorageService.createBooking({
      facilityId: 'barber-booking',
      facilityName: 'Barber Booking',
      sheetTabName: 'Barber Shop',
      stage: 'Chair 1',
      date: '2026-11-29',
      startTime: '14:00',
      endTime: '14:30',
      durationMinutes: 30,
      slotIds: ['SLOT-BB-CH1-DUP'],
      customerName: 'Resident C',
      phoneNumber: '+966502220003',
      numberOfGuests: 1,
    });
    expect(bDup.success).toBe(false);
    expect(bDup.error).toContain('Slot Conflict');
  });

  it('verifies Tennis Court (Court 1 vs Court 2) and Cricket Net (Net 1 vs Net 2) do not collide', () => {
    // Tennis Court
    expect(isResourceOrStageMatch('Court 1', 'Court 2', 'tennis-court')).toBe(false);
    expect(isResourceOrStageMatch('Court A', 'Court B', 'tennis-court')).toBe(false);
    expect(isResourceOrStageMatch('Court 1', 'Court A', 'tennis-court')).toBe(true);

    // Cricket Net
    expect(isResourceOrStageMatch('Net 1', 'Net 2', 'cricket-net')).toBe(false);
    expect(isResourceOrStageMatch('Net 1', 'Net 1', 'cricket-net')).toBe(true);

    // Cricket Net vs Tennis Court (even in same Area 7) never match
    expect(isResourceOrStageMatch('Area 7 Cricket Net', 'Area 7 Tennis Court')).toBe(false);
  });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/services/storageService';
import { IsolationRoomRecord } from '../src/types';

describe('Isolation Room Data Preservation and Occupancy Transfers', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.resetIsolationRoomsToDefault();
  });

  it('performs an atomic bed occupant transfer between rooms without losing history or other rooms', () => {
    // Setup initial patient in Room R-01 Bed 1
    const admitRes = StorageService.admitIsolationPatient('Room R-01', {
      patientName: 'Fahad Al-Harbi',
      company: 'Red Sea Global',
      checkIn: '2026-11-01',
      checkOut: '2026-11-14',
      phoneNumber: '+966540001122',
      email: 'fahad@redsea.example',
      bookingType: 'Medical Isolation',
      nationalId: '1098765432',
      purposeOfStay: 'Preventative isolation observation',
      staffNotes: 'Patient stable, no fever',
      targetBed: 1,
    });

    expect(admitRes).toBeDefined();

    const roomsBefore = StorageService.getIsolationRooms();
    const r01Before = roomsBefore.find((r) => r.buildingNumber === 'R-01');
    const r02Before = roomsBefore.find((r) => r.buildingNumber === 'R-02');

    expect(r01Before?.occupants?.length).toBe(1);
    expect(r01Before?.occupants?.[0].patientName).toBe('Fahad Al-Harbi');
    expect(r02Before?.occupants?.length || 0).toBe(0);

    // Execute atomic transfer from R-01 Bed 1 to R-02 Bed 2
    const transferRes = StorageService.transferBedOccupant('R-01', 1, 'R-02', 2);
    expect(transferRes.success).toBe(true);

    const roomsAfter = StorageService.getIsolationRooms();
    const r01After = roomsAfter.find((r) => r.buildingNumber === 'R-01');
    const r02After = roomsAfter.find((r) => r.buildingNumber === 'R-02');

    // Source room Bed 1 must be vacant
    expect(r01After?.occupants?.some((o) => o.bedNumber === 1)).toBe(false);

    // Target room Bed 2 must have the occupant with preserved details and transfer audit note
    const movedOcc = r02After?.occupants?.find((o) => o.bedNumber === 2);
    expect(movedOcc).toBeDefined();
    expect(movedOcc?.patientName).toBe('Fahad Al-Harbi');
    expect(movedOcc?.company).toBe('Red Sea Global');
    expect(movedOcc?.phoneNumber).toBe('+966540001122');
    expect(movedOcc?.nationalId).toBe('1098765432');
    expect(movedOcc?.staffNotes).toContain('Transferred from Room R-01 Bed 1');

    // Total rooms count must still be the full facility catalog (20+ rooms)
    expect(roomsAfter.length).toBe(roomsBefore.length);
  });

  it('rejects transfer if the destination bed is already occupied', () => {
    // Admit occupant 1 in Room R-01 Bed 1
    StorageService.admitIsolationPatient('Room R-01', {
      patientName: 'Patient One',
      company: 'Vendor A',
      checkIn: '2026-11-01',
      targetBed: 1,
    });

    // Admit occupant 2 in Room R-02 Bed 1
    StorageService.admitIsolationPatient('Room R-02', {
      patientName: 'Patient Two',
      company: 'Vendor B',
      checkIn: '2026-11-01',
      targetBed: 1,
    });

    // Attempt transfer into occupied Bed 1 of Room R-02
    const transferRes = StorageService.transferBedOccupant('R-01', 1, 'R-02', 1);
    expect(transferRes.success).toBe(false);
    expect(transferRes.error).toContain('already occupied');

    // Verify neither room was mutated
    const r01 = StorageService.getIsolationRooms().find((r) => r.buildingNumber === 'R-01');
    const r02 = StorageService.getIsolationRooms().find((r) => r.buildingNumber === 'R-02');
    expect(r01?.occupants?.find((o) => o.bedNumber === 1)?.patientName).toBe('Patient One');
    expect(r02?.occupants?.find((o) => o.bedNumber === 1)?.patientName).toBe('Patient Two');
  });

  it('safely merges remote isolation rooms without clobbering other rooms or valid occupants', () => {
    // Have a local occupant in R-05
    StorageService.admitIsolationPatient('Room R-05', {
      patientName: 'Local Resident',
      company: 'Contractor X',
      checkIn: '2026-11-05',
      targetBed: 1,
    });

    const remoteR06: IsolationRoomRecord = {
      id: 'ISO-R-06',
      slNo: 6,
      buildingNumber: 'R-06',
      building: 'Building R',
      beds: '2x1=2',
      bedCount: 2,
      patientName: 'Remote Arrival',
      company: 'Red Sea Security',
      checkIn: '2026-11-06',
      checkOut: '2026-11-12',
      status: 'Occupied',
      roomCondition: 'Cleaned & Ready',
      occupants: [
        {
          bedNumber: 1,
          patientName: 'Remote Arrival',
          company: 'Red Sea Security',
          checkIn: '2026-11-06',
          bookingType: 'Medical Isolation',
        },
      ],
    };

    StorageService.applyRemoteUpsert('isolationRooms', remoteR06);

    const rooms = StorageService.getIsolationRooms();
    const r05 = rooms.find((r) => r.buildingNumber === 'R-05');
    const r06 = rooms.find((r) => r.buildingNumber === 'R-06');

    // Local R-05 must be preserved
    expect(r05?.occupants?.find((o) => o.bedNumber === 1)?.patientName).toBe('Local Resident');
    // Remote R-06 must be merged
    expect(r06?.occupants?.find((o) => o.bedNumber === 1)?.patientName).toBe('Remote Arrival');
  });

  it('correctly discharges a single bed occupant while preserving the other occupant', () => {
    // Admit Bed 1
    StorageService.admitBedOccupant('Room R-03', 1, {
      patientName: 'Occupant One',
      company: 'Tamimi',
    });
    // Admit Bed 2
    StorageService.admitBedOccupant('Room R-03', 2, {
      patientName: 'Occupant Two',
      company: 'Tamimi',
    });

    const before = StorageService.getIsolationRooms().find((r) => r.buildingNumber === 'R-03');
    expect(before?.occupants?.length).toBe(2);

    // Discharge Bed 1
    const updated = StorageService.dischargeBedOccupant('Room R-03', 1);
    expect(updated).toBeDefined();

    const after = StorageService.getIsolationRooms().find((r) => r.buildingNumber === 'R-03');
    expect(after?.occupants?.length).toBe(1);
    expect(after?.occupants?.[0].bedNumber).toBe(2);
    expect(after?.occupants?.[0].patientName).toBe('Occupant Two');
    expect(after?.status).toBe('Occupied');
  });

  it('correctly discharges all patients in a room via dischargeIsolationPatient', () => {
    StorageService.admitBedOccupant('Room R-04', 1, {
      patientName: 'Departing Patient',
      company: 'RSG',
    });

    const discharged = StorageService.dischargeIsolationPatient('Room R-04');
    expect(discharged).toBeDefined();
    expect(discharged?.status).toBe('VACANT');
    expect(discharged?.occupants?.length).toBe(0);
    expect(discharged?.patientName).toBe('');

    const room = StorageService.getIsolationRooms().find((r) => r.buildingNumber === 'R-04');
    expect(room?.status).toBe('VACANT');
    expect(room?.occupants?.length).toBe(0);
  });

  it('handles interrupted transfers and retry behavior via offline queue without duplicate occupancy', () => {
    // Admit occupant in Room B-01 Bed 1
    StorageService.admitBedOccupant('Room B-01', 1, {
      patientName: 'Tariq Mansoor',
      company: 'Amaala Medical Team',
      nationalId: '9876543210',
    });

    // Execute transfer from B-01 Bed 1 to B-02 Bed 1
    const res = StorageService.transferBedOccupant('B-01', 1, 'B-02', 1);
    expect(res.success).toBe(true);

    // Simulate network retry: re-applying the transfer payload or retrying via applyRemoteUpsert
    const retryRooms = [res.sourceRoom!, res.targetRoom!];
    StorageService.applyRemoteUpsert('isolationRooms', retryRooms);

    const rooms = StorageService.getIsolationRooms();
    const b01 = rooms.find((r) => r.buildingNumber === 'B-01');
    const b02 = rooms.find((r) => r.buildingNumber === 'B-02');

    // B-01 must remain vacant
    expect(b01?.status).toBe('VACANT');
    expect(b01?.occupants?.length || 0).toBe(0);

    // B-02 must be occupied once by Tariq Mansoor
    expect(b02?.status).toBe('Occupied');
    expect(b02?.occupants?.length).toBe(1);
    expect(b02?.occupants?.[0].patientName).toBe('Tariq Mansoor');
    expect(b02?.occupants?.[0].nationalId).toBe('9876543210');

    // Verify patient Tariq Mansoor is NOT duplicated in any other room in the portal
    const allTariqOccs = rooms.flatMap((r) => r.occupants || []).filter((o) => o.patientName === 'Tariq Mansoor');
    expect(allTariqOccs.length).toBe(1);
  });

  it('preserves patient identifiers, nationalId, company, and timestamps during complete admission -> transfer -> discharge cycle', async () => {
    // 1. Admission
    const admitted = StorageService.admitBedOccupant('Room R-06', 1, {
      patientName: 'Dr. Zaid Al-Ghamdi',
      company: 'Tamimi Global Health',
      nationalId: '1122334455',
      phoneNumber: '+966550001122',
      staffNotes: 'Direct admission for monitoring',
    });
    expect(admitted).toBeDefined();

    // 2. Transfer
    const transferRes = StorageService.transferBedOccupant('R-06', 1, 'B-06', 2);
    expect(transferRes.success).toBe(true);

    const targetOcc = transferRes.targetRoom?.occupants?.find((o) => o.bedNumber === 2);
    expect(targetOcc?.patientName).toBe('Dr. Zaid Al-Ghamdi');
    expect(targetOcc?.company).toBe('Tamimi Global Health');
    expect(targetOcc?.nationalId).toBe('1122334455');
    expect(targetOcc?.phoneNumber).toBe('+966550001122');
    expect(targetOcc?.staffNotes).toContain('Transferred from Room R-06 Bed 1');

    // 3. Discharge
    const discharged = StorageService.dischargeBedOccupant('Room B-06', 2);
    expect(discharged).toBeDefined();
    expect(discharged?.status).toBe('VACANT');
    expect(discharged?.occupants?.length).toBe(0);

    // 4. Verify historical stays archive preserved records
    const history = await StorageService.getHistoricalIsolationArchive();
    expect(history.length).toBeGreaterThan(0);
    const transferRecord = history.find((h) => h.patientName === 'Dr. Zaid Al-Ghamdi' && h.action === 'TRANSFER');
    expect(transferRecord).toBeDefined();
    expect(transferRecord?.nationalId).toBe('1122334455');
  });
});

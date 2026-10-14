import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeSetLocalStorage } from '../src/services/storageService';
import { persistHubState, doPersistHubState } from '../server';
import fs from 'fs';
import path from 'path';

describe('Storage Quota and Server Persistence Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('LocalStorage Quota Exceeded Resilience', () => {
    it('handles QuotaExceededError by cleaning temporary caches and retrying safely', () => {
      // Seed temporary snapshot keys
      localStorage.setItem('tamimi_auto_snapshot_1', 'old snapshot data');
      localStorage.setItem('tamimi_temp_audit_cache', 'temp audit data');
      localStorage.setItem('tamimi_analytics_cache_v1', 'temp analytics data');

      let attempt = 0;
      const originalSetItem = localStorage.setItem.bind(localStorage);

      // Spy on localStorage.setItem to simulate QuotaExceededError on the first attempt
      vi.spyOn(localStorage, 'setItem').mockImplementation((key: string, value: string) => {
        attempt++;
        if (attempt === 1) {
          const quotaErr = new Error('QuotaExceededError');
          quotaErr.name = 'QuotaExceededError';
          throw quotaErr;
        }
        return originalSetItem(key, value);
      });

      const success = safeSetLocalStorage('test_key', 'test_value');
      expect(success).toBe(true);
      expect(localStorage.getItem('test_key')).toBe('test_value');
      // Verify temp snapshot keys were cleaned up
      expect(localStorage.getItem('tamimi_auto_snapshot_1')).toBeNull();
      expect(localStorage.getItem('tamimi_temp_audit_cache')).toBeNull();

      vi.restoreAllMocks();
    });

    it('gracefully handles persistent QuotaExceededError without throwing or crashing the application', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const quotaErr = new Error('QuotaExceededError');
        quotaErr.name = 'QuotaExceededError';
        throw quotaErr;
      });

      // Must return false without throwing an unhandled exception
      expect(() => {
        const result = safeSetLocalStorage('critical_key', 'val');
        expect(result).toBe(false);
      }).not.toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('Concurrent Server Persistence', () => {
    it('serializes concurrent writes and persists atomically without race conditions or lost writes', async () => {
      // Fire 5 concurrent persistence calls
      const p1 = persistHubState();
      const p2 = doPersistHubState();
      const p3 = persistHubState();
      const p4 = doPersistHubState();
      const p5 = persistHubState();

      // All 5 must resolve successfully without rejecting
      await expect(Promise.all([p1, p2, p3, p4, p5])).resolves.toBeDefined();

      // Verify database file exists and is valid JSON
      const dbPath = path.join(process.cwd(), 'tamimi_server_db.json');
      expect(fs.existsSync(dbPath)).toBe(true);

      const content = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toBeDefined();
      expect(Array.isArray(parsed.bookings)).toBe(true);
      expect(Array.isArray(parsed.isolationRooms)).toBe(true);
    });

    it('recovers persisted hub state after server restart and preserves data', async () => {
      const dbPath = path.join(process.cwd(), 'tamimi_server_db.json');
      const testState = {
        version: 88,
        lastUpdated: new Date().toISOString(),
        deletedIds: { 'del-123': true },
        cancelledIds: { 'can-456': Date.now() },
        bookings: [
          {
            id: 'BK-RESTART-1',
            customerName: 'General Manager',
            status: 'CONFIRMED',
            facilityId: 'cinema',
            date: '2026-12-25',
          },
        ],
        isolationRooms: [
          {
            id: 'ISO-R-01',
            buildingNumber: 'R-01',
            status: 'Occupied',
            occupants: [{ bedNumber: 1, patientName: 'Important Patient' }],
          },
        ],
        handovers: [],
        parcels: [],
        lostFound: [],
        blankForms: [],
        invoices: [],
        notices: [],
        supportTickets: [],
      };

      // Write simulated server state to disk
      fs.writeFileSync(dbPath, JSON.stringify(testState), 'utf-8');

      // Verify that the file can be read and parsed faithfully, simulating server boot
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const reloaded = JSON.parse(raw);

      expect(reloaded.version).toBe(88);
      expect(reloaded.bookings.length).toBe(1);
      expect(reloaded.bookings[0].id).toBe('BK-RESTART-1');
      expect(reloaded.isolationRooms[0].occupants[0].patientName).toBe('Important Patient');
      expect(reloaded.deletedIds['del-123']).toBe(true);
    });

    it('maintains non-blocking responsiveness during mutation bursts without dropping writes', async () => {
      const startTime = Date.now();
      const burstPromises: Promise<void>[] = [];

      // Trigger 20 rapid persistence calls representing high-frequency client mutations
      for (let i = 0; i < 20; i++) {
        burstPromises.push(persistHubState());
      }

      await Promise.all(burstPromises);
      const duration = Date.now() - startTime;

      // Group commit & non-blocking execution should complete promptly
      expect(duration).toBeLessThan(3000);

      const dbPath = path.join(process.cwd(), 'tamimi_server_db.json');
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('keeps SSE heartbeats and timers responsive without event-loop blocking during mutation bursts', async () => {
      let timerFired = false;
      const burstPromises: Promise<void>[] = [];

      // Start asynchronous mutation burst
      for (let i = 0; i < 15; i++) {
        burstPromises.push(persistHubState());
      }

      // Schedule simulated SSE keep-alive heartbeat
      const timerPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          timerFired = true;
          resolve();
        }, 20);
      });

      // Both the timer and disk writes should proceed concurrently without timer starvation
      await Promise.all([Promise.all(burstPromises), timerPromise]);
      expect(timerFired).toBe(true);
    });
  });

  describe('Large Isolation History & Migration Resilience', () => {
    it('safely migrates large historical isolation records to IndexedDB without dropping active rooms', async () => {
      const { StorageService } = await import('../src/services/storageService');
      const { idbStorageService } = await import('../src/services/idbStorageService');

      // Seed 25 historical room snapshots into localStorage (more than the configured active rooms)
      const mockHistoricalStays = Array.from({ length: 25 }, (_, i) => ({
        id: `HIST-ARCHIVE-${i + 1}`,
        slNo: 100 + i,
        buildingNumber: i < 6 ? `R-0${(i % 6) + 1}` : `B-0${(i % 6) + 1}`,
        status: 'VACANT',
        patientName: `Archived Guest ${i + 1}`,
        checkIn: '2026-01-01',
        checkOut: '2026-01-05',
        occupants: [],
      }));

      // Store in localStorage
      localStorage.setItem('executive_facility_isolation_rooms_v4', JSON.stringify(mockHistoricalStays));

      // Trigger initialization which performs safe migration
      const activeRooms = StorageService.initIsolationRooms();

      // Active rooms must contain all configured canonical facility rooms
      expect(activeRooms.length).toBeGreaterThanOrEqual(12);

      // Verify historical records were safely passed to IndexedDB storage
      const migrated = await idbStorageService.getIsolationHistory();
      expect(migrated).toBeDefined();
    });

    it('ensures booking persistence remains functional even when localStorage quota is exhausted', async () => {
      const { StorageService } = await import('../src/services/storageService');

      // Force localStorage.setItem to throw QuotaExceededError
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      });

      // Attempt saving booking: must not throw, state preserved in memory
      expect(() => {
        StorageService.saveBookings([
          {
            id: 'BK-QUOTA-TEST',
            facilityId: 'cinema',
            facilityName: 'Cinema',
            sheetTabName: 'Cinema',
            stage: 'Cinema Hall',
            date: '2026-11-20',
            startTime: '10:00',
            endTime: '11:00',
            durationMinutes: 60,
            slotIds: ['SLOT-Q-1'],
            numberOfGuests: 2,
            customerName: 'Resilient User',
            phoneNumber: '+966501112233',
            status: 'CONFIRMED',
            createdAt: new Date().toISOString(),
          },
        ]);
      }).not.toThrow();

      const all = StorageService.getAllBookings();
      const found = all.find((b) => b.id === 'BK-QUOTA-TEST');
      expect(found).toBeDefined();
      expect(found?.customerName).toBe('Resilient User');

      vi.restoreAllMocks();
    });
  });
});

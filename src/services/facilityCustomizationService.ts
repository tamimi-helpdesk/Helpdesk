import { Facility, CustomSlotConfig, CampusBroadcastAlert } from '../types';
import { FACILITIES } from '../data/facilities';
import { AuthService } from './authService';

const STORAGE_KEY_FACILITIES = 'tamimi_facility_customizations_v2';
const STORAGE_KEY_BROADCASTS = 'tamimi_campus_broadcasts_v2';

export interface FacilityOverrides {
  stages?: string[];
  customSlots?: CustomSlotConfig[];
  disabledSlotTimes?: string[];
  rules?: string[];
  amenities?: string[];
  openTime?: string;
  closeTime?: string;
  defaultSlotDurationMinutes?: number;
  capacityPerSlot?: number;
  statusOverride?: 'OPERATIONAL' | 'MAINTENANCE' | 'LOCKDOWN' | 'VIP_ONLY' | 'RENOVATION';
  statusReason?: string;
  curfewExempt?: boolean;
  autoApprovalEnabled?: boolean;
  advanceBookingDays?: number;
  name?: string;
  description?: string;
}

export interface CustomFacilityStore {
  overrides: Record<string, FacilityOverrides>;
  additionalFacilities: Facility[];
  deletedFacilityIds: string[];
}

export class FacilityCustomizationService {
  private static getStore(): CustomFacilityStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FACILITIES);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse facility customizations:', e);
    }
    return {
      overrides: {},
      additionalFacilities: [],
      deletedFacilityIds: [],
    };
  }

  private static saveStore(store: CustomFacilityStore): void {
    try {
      localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(store));
      window.dispatchEvent(new CustomEvent('tamimi_facilities_updated'));
    } catch (e) {
      console.error('Failed to save facility customizations:', e);
    }
  }

  /**
   * Get all facilities merged with Super Admin customizations
   */
  public static getAllFacilities(): Facility[] {
    const store = this.getStore();
    const deletedSet = new Set(store.deletedFacilityIds || []);

    // 1. Process standard base facilities
    const baseList = FACILITIES.filter((f) => !deletedSet.has(f.id)).map((base) => {
      const override = store.overrides[base.id];
      if (!override) return { ...base };

      return {
        ...base,
        name: override.name ?? base.name,
        description: override.description ?? base.description,
        stages: override.stages ? [...override.stages] : [...base.stages],
        customSlots: override.customSlots ? [...override.customSlots] : undefined,
        disabledSlotTimes: override.disabledSlotTimes ? [...override.disabledSlotTimes] : undefined,
        rules: override.rules ? [...override.rules] : [...base.rules],
        amenities: override.amenities ? [...override.amenities] : [...base.amenities],
        openTime: override.openTime ?? base.openTime,
        closeTime: override.closeTime ?? base.closeTime,
        defaultSlotDurationMinutes: override.defaultSlotDurationMinutes ?? base.defaultSlotDurationMinutes,
        capacityPerSlot: override.capacityPerSlot ?? base.capacityPerSlot,
        statusOverride: override.statusOverride,
        statusReason: override.statusReason,
        curfewExempt: override.curfewExempt,
        autoApprovalEnabled: override.autoApprovalEnabled,
        advanceBookingDays: override.advanceBookingDays,
      };
    });

    // 2. Append additional custom facilities created by Super Admin
    const additional = (store.additionalFacilities || []).filter((f) => !deletedSet.has(f.id));

    return [...baseList, ...additional];
  }

  /**
   * Get a single facility by ID
   */
  public static getFacility(id: string): Facility | undefined {
    return this.getAllFacilities().find((f) => f.id === id);
  }

  /**
   * Add a new Stage / Room / Pitch / Court to a facility
   */
  public static addStage(facilityId: string, stageName: string): { success: boolean; message: string } {
    const trimmed = stageName.trim();
    if (!trimmed) return { success: false, message: 'Room/Stage name cannot be empty.' };

    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentStages = fac.stages || [];
    if (currentStages.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `Room "${trimmed}" already exists in this facility.` };
    }

    const newStages = [...currentStages, trimmed];
    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      stages: newStages,
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_ROOM_ADDED', `Super Admin added room/stage "${trimmed}" to ${fac.name}`);
    return { success: true, message: `Added room/stage "${trimmed}" to ${fac.name}.` };
  }

  /**
   * Delete a Stage / Room / Pitch / Court from a facility
   */
  public static deleteStage(facilityId: string, stageName: string): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentStages = fac.stages || [];
    if (currentStages.length <= 1) {
      return { success: false, message: 'A facility must have at least one room/stage active.' };
    }

    const filtered = currentStages.filter((s) => s !== stageName);
    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      stages: filtered,
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_ROOM_DELETED', `Super Admin deleted room/stage "${stageName}" from ${fac.name}`);
    return { success: true, message: `Removed room/stage "${stageName}".` };
  }

  /**
   * Add a Custom Booking Slot (e.g. Early Bird, Night League, VIP Block)
   */
  public static addCustomSlot(facilityId: string, slot: Omit<CustomSlotConfig, 'id'>): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentCustomSlots = fac.customSlots || [];
    const id = `custom-${facilityId}-${slot.startTime}-${slot.endTime}-${Date.now()}`;
    const newSlot: CustomSlotConfig = { ...slot, id };

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      customSlots: [...currentCustomSlots, newSlot],
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_SLOT_ADDED', `Super Admin added custom slot ${slot.startTime}-${slot.endTime} (${slot.label || 'Special Slot'}) to ${fac.name}`);
    return { success: true, message: `Custom slot (${slot.startTime} - ${slot.endTime}) added successfully.` };
  }

  /**
   * Remove or disable a slot from a facility
   */
  public static disableSlot(facilityId: string, slotStartTime: string): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    // Check if it was a custom slot
    const customSlots = fac.customSlots || [];
    const remainingCustom = customSlots.filter((s) => s.startTime !== slotStartTime);
    const hadCustom = customSlots.length !== remainingCustom.length;

    const disabledList = fac.disabledSlotTimes || [];
    const newDisabled = disabledList.includes(slotStartTime) ? disabledList : [...disabledList, slotStartTime];

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      customSlots: remainingCustom,
      disabledSlotTimes: hadCustom ? disabledList : newDisabled,
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_SLOT_DISABLED', `Super Admin removed/disabled slot at ${slotStartTime} for ${fac.name}`);
    return { success: true, message: `Slot at ${slotStartTime} removed/disabled.` };
  }

  /**
   * Enable a previously disabled slot
   */
  public static enableSlot(facilityId: string, slotStartTime: string): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const disabledList = fac.disabledSlotTimes || [];
    const filtered = disabledList.filter((t) => t !== slotStartTime);

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      disabledSlotTimes: filtered,
    };

    this.saveStore(store);
    return { success: true, message: `Slot at ${slotStartTime} re-enabled.` };
  }

  /**
   * Add a facility rule
   */
  public static addRule(facilityId: string, ruleText: string): { success: boolean; message: string } {
    const trimmed = ruleText.trim();
    if (!trimmed) return { success: false, message: 'Rule text cannot be empty.' };

    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentRules = fac.rules || [];
    const newRules = [...currentRules, trimmed];

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      rules: newRules,
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_RULE_ADDED', `Super Admin added rule to ${fac.name}: "${trimmed}"`);
    return { success: true, message: `New rule added to ${fac.name}.` };
  }

  /**
   * Delete a facility rule by index or rule string
   */
  public static deleteRule(facilityId: string, ruleIndexOrText: number | string): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentRules = fac.rules || [];
    const newRules = typeof ruleIndexOrText === 'number'
      ? currentRules.filter((_, idx) => idx !== ruleIndexOrText)
      : currentRules.filter((r) => r !== ruleIndexOrText);

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      rules: newRules,
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_RULE_DELETED', `Super Admin removed rule from ${fac.name}`);
    return { success: true, message: `Rule removed from ${fac.name}.` };
  }

  /**
   * Add an amenity/feature
   */
  public static addAmenity(facilityId: string, amenityText: string): { success: boolean; message: string } {
    const trimmed = amenityText.trim();
    if (!trimmed) return { success: false, message: 'Amenity cannot be empty.' };

    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentAmenities = fac.amenities || [];
    if (currentAmenities.includes(trimmed)) {
      return { success: false, message: 'Amenity already exists.' };
    }

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      amenities: [...currentAmenities, trimmed],
    };

    this.saveStore(store);
    return { success: true, message: `Amenity "${trimmed}" added.` };
  }

  /**
   * Delete an amenity
   */
  public static deleteAmenity(facilityId: string, amenityText: string): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    const currentAmenities = fac.amenities || [];
    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      amenities: currentAmenities.filter((a) => a !== amenityText),
    };

    this.saveStore(store);
    return { success: true, message: `Amenity "${amenityText}" removed.` };
  }

  /**
   * Update operational parameters (openTime, closeTime, duration, capacity, status, etc.)
   */
  public static updateFacilitySettings(
    facilityId: string,
    updates: Partial<FacilityOverrides>
  ): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    if (!fac) return { success: false, message: 'Facility not found.' };

    store.overrides[facilityId] = {
      ...store.overrides[facilityId],
      ...updates,
    };

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_SETTINGS_UPDATED', `Super Admin updated operational settings for ${fac.name}`);
    return { success: true, message: `Updated operational settings for ${fac.name}.` };
  }

  /**
   * Alias for updateFacilitySettings
   */
  public static updateFacility(
    facilityId: string,
    updates: Partial<FacilityOverrides>
  ): { success: boolean; message: string } {
    return this.updateFacilitySettings(facilityId, updates);
  }

  /**
   * Add a completely new facility to the campus (e.g. 21st facility: Squash Court, Boardroom, VIP Spa)
   */
  public static createNewFacility(newFacility: Facility): { success: boolean; message: string } {
    const store = this.getStore();
    if (this.getFacility(newFacility.id)) {
      return { success: false, message: `Facility with ID "${newFacility.id}" already exists.` };
    }

    store.additionalFacilities = [...(store.additionalFacilities || []), newFacility];
    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_CREATED', `Super Admin created new campus facility: "${newFacility.name}"`);
    return { success: true, message: `Created new facility "${newFacility.name}".` };
  }

  /**
   * Delete a facility (or hide base facility)
   */
  public static deleteFacility(facilityId: string): { success: boolean; message: string } {
    const store = this.getStore();
    const fac = this.getFacility(facilityId);
    const facName = fac?.name || facilityId;

    store.deletedFacilityIds = Array.from(new Set([...(store.deletedFacilityIds || []), facilityId]));
    store.additionalFacilities = (store.additionalFacilities || []).filter((f) => f.id !== facilityId);

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_DELETED', `Super Admin deleted/archived facility: "${facName}"`);
    return { success: true, message: `Facility "${facName}" has been removed.` };
  }

  /**
   * Reset a facility back to pristine system default
   */
  public static resetFacilityToDefault(facilityId: string): { success: boolean; message: string } {
    const store = this.getStore();
    delete store.overrides[facilityId];
    store.deletedFacilityIds = (store.deletedFacilityIds || []).filter((id) => id !== facilityId);

    this.saveStore(store);
    AuthService.logAuditEvent('FACILITY_RESET', `Super Admin restored default settings for facility ID: ${facilityId}`);
    return { success: true, message: 'Facility restored to original factory defaults.' };
  }

  /**
   * Reset ALL facilities back to pristine defaults
   */
  public static resetAllToDefaults(): { success: boolean; message: string } {
    localStorage.removeItem(STORAGE_KEY_FACILITIES);
    window.dispatchEvent(new CustomEvent('tamimi_facilities_updated'));
    AuthService.logAuditEvent('ALL_FACILITIES_RESET', 'Super Admin restored all 20 facilities to pristine defaults.');
    return { success: true, message: 'All 20 facilities restored to default campus configuration.' };
  }

  // =========================================================================
  // CAMPUS BROADCAST ALERTS (Executive Global Banner to all users)
  // =========================================================================

  public static getBroadcasts(): CampusBroadcastAlert[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BROADCASTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  public static getActiveBroadcast(): CampusBroadcastAlert | null {
    const all = this.getBroadcasts();
    const active = all.filter((b) => b.active);
    if (active.length === 0) return null;

    // Check expiration
    const now = new Date().toISOString();
    return active.find((b) => !b.expiresAt || b.expiresAt > now) || null;
  }

  public static publishBroadcast(alert: Omit<CampusBroadcastAlert, 'id' | 'createdAt' | 'active'>): { success: boolean; message: string } {
    const all = this.getBroadcasts();
    const newAlert: CampusBroadcastAlert = {
      ...alert,
      id: `broadcast-${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Keep active single top priority or list
    const updated = [newAlert, ...all.map((b) => ({ ...b, active: false }))];
    localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('tamimi_broadcast_updated'));

    AuthService.logAuditEvent('CAMPUS_BROADCAST_PUBLISHED', `Super Admin published campus alert: "${alert.title}" (${alert.priority})`);
    return { success: true, message: `Campus broadcast "${alert.title}" is now LIVE across all terminals.` };
  }

  public static dismissBroadcast(broadcastId?: string): { success: boolean } {
    const all = this.getBroadcasts();
    const updated = all.map((b) => (broadcastId ? (b.id === broadcastId ? { ...b, active: false } : b) : { ...b, active: false }));
    localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('tamimi_broadcast_updated'));
    return { success: true };
  }
}

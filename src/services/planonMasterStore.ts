import { PLANON_LOCATION_CODES, PLANON_SPACES_DATA, PlanonSpaceItem } from '../data/planonMasterData';
import { BuildingFloor } from '../types/ticket';

export interface PlanonCategoryItem {
  id: string;
  code: string;
  name: string;
  discipline: string;
}

export interface PlanonRequestorItem {
  badge: string;
  name: string;
  dept: string;
  role: string;
}

export interface PlanonAssetItem {
  code: string;
  name: string;
  category: string;
}

export interface PlanonPropertyItem {
  code: string;
  stage: string;
  cluster: string;
  building: string;
  type: string;
  description?: string;
}

const STORAGE_KEY = 'planon_master_store_v1';
const EVENT_NAME = 'planon_master_store_updated';

// Initial default categories
export const DEFAULT_CATEGORIES: PlanonCategoryItem[] = [
  { id: 'cat-cv01', code: 'CV01', name: 'Civil - Wall painting and plaster repair', discipline: 'Civil' },
  { id: 'cat-cv02', code: 'CV02', name: 'Civil - Door lock / hinge / alignment repair', discipline: 'Civil' },
  { id: 'cat-cv03', code: 'CV03', name: 'Civil - Ceiling tile damage replacement', discipline: 'Civil' },
  { id: 'cat-cv04', code: 'CV04', name: 'Civil - Flooring / vinyl / tile replacement', discipline: 'Civil' },
  { id: 'cat-cv05', code: 'CV05', name: 'FM REACTIVE WORK ORDER - Drawers Fixing & Door Alignment', discipline: 'Civil' },
  { id: 'cat-cv06', code: 'CV06', name: 'Civil - Window frame and glass glazing', discipline: 'Civil' },
  { id: 'cat-cv07', code: 'CV07', name: 'Civil - Furniture woodwork and runner fixing', discipline: 'Civil' },
  { id: 'cat-cl01', code: 'CL01', name: 'Cleaning - Deep cleaning & sanitization', discipline: 'Cleaning' },
  { id: 'cat-cl02', code: 'CL02', name: 'Cleaning - Common corridor & staircase wash', discipline: 'Cleaning' },
  { id: 'cat-cl03', code: 'CL03', name: 'Cleaning - Waste bin empty & disposal', discipline: 'Cleaning' },
  { id: 'cat-el01', code: 'EL01', name: 'Electrical - Power socket outlet trip/defect', discipline: 'Electrical' },
  { id: 'cat-el02', code: 'EL02', name: 'Electrical - Light fitting / LED bulb replacement', discipline: 'Electrical' },
  { id: 'cat-el03', code: 'EL03', name: 'Electrical - Distribution Board (DB) breaker tripped', discipline: 'Electrical' },
  { id: 'cat-el04', code: 'EL04', name: 'Electrical - Water heater power supply cut', discipline: 'Electrical' },
  { id: 'cat-eq01', code: 'EQ01', name: 'Equipment - Commercial kitchen bain-marie warmer', discipline: 'Equipment' },
  { id: 'cat-eq02', code: 'EQ02', name: 'Equipment - Commercial refrigerator / cold room', discipline: 'Equipment' },
  { id: 'cat-eq03', code: 'EQ03', name: 'Equipment - Industrial laundry washing machine', discipline: 'Equipment' },
  { id: 'cat-fs01', code: 'FS01', name: 'Fire Systems - Optical smoke detector trouble', discipline: 'Fire Systems' },
  { id: 'cat-fs02', code: 'FS02', name: 'Fire Systems - Fire extinguisher inspection & refill', discipline: 'Fire Systems' },
  { id: 'cat-fs03', code: 'FS03', name: 'Fire Systems - Break glass call point damaged', discipline: 'Fire Systems' },
  { id: 'cat-gn01', code: 'GN01', name: 'General - Miscellaneous handyman repairs', discipline: 'General' },
  { id: 'cat-gn02', code: 'GN02', name: 'General - Signage, notice board mounting', discipline: 'General' },
  { id: 'cat-hk01', code: 'HK01', name: 'Housekeeping - Mattress / linen change', discipline: 'Housekeeping' },
  { id: 'cat-hk02', code: 'HK02', name: 'Housekeeping - Room amenities replenishment', discipline: 'Housekeeping' },
  { id: 'cat-hs01', code: 'HS01', name: 'HSE - Safety barrier / trip hazard rectification', discipline: 'HSE' },
  { id: 'cat-hs02', code: 'HS02', name: 'HSE - Chemical storage inspection', discipline: 'HSE' },
  { id: 'cat-hv01', code: 'HV01', name: 'HVAC - Split AC unit not cooling / warm air', discipline: 'HVAC' },
  { id: 'cat-hv02', code: 'HV02', name: 'HVAC - AC water leakage inside room', discipline: 'HVAC' },
  { id: 'cat-hv03', code: 'HV03', name: 'HVAC - AC remote control not responding', discipline: 'HVAC' },
  { id: 'cat-hv04', code: 'HV04', name: 'HVAC - Fan coil unit loud abnormal noise', discipline: 'HVAC' },
  { id: 'cat-it01', code: 'IT01', name: 'IT - Wi-Fi access point offline / weak signal', discipline: 'IT' },
  { id: 'cat-it02', code: 'IT02', name: 'IT - Network RJ45 data port damaged', discipline: 'IT' },
  { id: 'cat-ls01', code: 'LS01', name: 'Landscaping - Irrigation sprinkler leakage', discipline: 'Landscaping' },
  { id: 'cat-ls02', code: 'LS02', name: 'Landscaping - Lawn mowing & tree trimming', discipline: 'Landscaping' },
  { id: 'cat-ld01', code: 'LD01', name: 'Laundry - Dryer machine lint trap & heating', discipline: 'Laundry' },
  { id: 'cat-ld02', code: 'LD02', name: 'Laundry - Ironing board & press iron repair', discipline: 'Laundry' },
  { id: 'cat-me01', code: 'ME01', name: 'Mechanical - Water booster pump vibration', discipline: 'Mechanical' },
  { id: 'cat-me02', code: 'ME02', name: 'Mechanical - Sewage lifting station fault', discipline: 'Mechanical' },
  { id: 'cat-pc01', code: 'PC01', name: 'Pest Control - General insect spray treatment', discipline: 'Pest Control' },
  { id: 'cat-pc02', code: 'PC02', name: 'Pest Control - Rodent bait station inspection', discipline: 'Pest Control' },
  { id: 'cat-pl01', code: 'PL01', name: 'Plumbing - Toilet flush mechanism / siphon leak', discipline: 'Plumbing' },
  { id: 'cat-pl02', code: 'PL02', name: 'Plumbing - Wash basin tap / mixer leaking', discipline: 'Plumbing' },
  { id: 'cat-pl03', code: 'PL03', name: 'Plumbing - Shower mixer / head blockage', discipline: 'Plumbing' },
  { id: 'cat-pl04', code: 'PL04', name: 'Plumbing - Sewer floor drain blocked / overflow', discipline: 'Plumbing' },
  { id: 'cat-wm01', code: 'WM01', name: 'Waste Management - Compactor bin clearing', discipline: 'Waste Management' },
  { id: 'cat-wm02', code: 'WM02', name: 'Waste Management - Recycling skips exchange', discipline: 'Waste Management' },
];

export const DEFAULT_REQUESTORS: PlanonRequestorItem[] = [
  { badge: 'TBCV_2616191', name: 'YADAV, RAMRESH', dept: 'Civil Operations Helpdesk', role: 'Civil Lead' },
  { badge: '2292922578', name: 'KHURSHID', dept: 'F&B Operations / Catering', role: 'Supervisor' },
  { badge: 'RSG-DIR-104', name: 'Eng. Mansour Al-Ghamdi', dept: 'RSG Project Delivery', role: 'Director' },
  { badge: 'RSG-ENG-290', name: 'David Sterling', dept: 'RSG Marine Works', role: 'Resident Eng' },
  { badge: 'TAM-SUP-339', name: 'Kareem Abdul-Nasser', dept: 'Camp Maintenance', role: 'Facility Supervisor' },
  { badge: 'TAM-QA-109', name: 'Majed Al-Mutairi', dept: 'QA/QC Inspection', role: 'QA Inspector' },
  { badge: 'TAM-CIV-884', name: 'Rajesh Kumar', dept: 'Civil & Carpentry', role: 'Lead Carpenter' },
  { badge: 'TAM-ELE-301', name: 'Farooq Ahmed', dept: 'Electrical Works', role: 'Master Electrician' },
  { badge: 'TAM-PLM-402', name: 'Bilal Hassan', dept: 'Plumbing & Drainage', role: 'Plumbing Foreman' },
  { badge: 'TAM-HVC-503', name: 'Sanjay Patel', dept: 'HVAC Operations', role: 'HVAC Specialist' },
  { badge: 'TBCV_184920', name: 'Mohammed Al-Harbi', dept: 'Village Helpdesk', role: 'Helpdesk Officer' },
];

export const DEFAULT_ASSETS: PlanonAssetItem[] = [
  { code: 'AST-DRW-01', name: 'Furniture Drawer Runner / Slider', category: 'Civil / Furniture' },
  { code: 'AST-DSK-004', name: 'Executive Work Desk 160cm', category: 'Furniture' },
  { code: 'AST-CHR-012', name: 'Ergonomic Office Swivel Chair', category: 'Furniture' },
  { code: 'AST-WRD-002', name: 'Double Door Wardrobe Cabinet', category: 'Civil / Woodwork' },
  { code: 'AST-HVC-SPLIT-09', name: 'O-General Split AC 2.0 Ton', category: 'HVAC' },
  { code: 'AST-HVC-THERM-01', name: 'Digital Wall Thermostat Controller', category: 'HVAC' },
  { code: 'AST-PLM-MXR-02', name: 'Grohe Basin Mixer Chrome Tap', category: 'Plumbing' },
  { code: 'AST-PLM-WC-01', name: 'Dual Flush Water Closet Ceramic Tank', category: 'Plumbing' },
  { code: 'AST-ELE-DB-03', name: 'Schneider 12-Way Distribution Board', category: 'Electrical' },
  { code: 'AST-ELE-LED-18W', name: 'Philips 600x600 LED Panel 40W', category: 'Electrical' },
  { code: 'AST-WTR-HTR-80L', name: 'Ariston 80L Electric Water Heater', category: 'Electrical / Plumbing' },
  { code: 'AST-FS-SMK-01', name: 'Simplex Optical Smoke Sensor', category: 'Fire Systems' },
];

export const DEFAULT_CUSTOMERS: string[] = [
  'Red Sea Global (RSG) - Amaala Project',
  'TAMIMI Global Company Ltd (TAFGA)',
  'Amaala Camp Management & Hospitality',
  'Amaala Base Camp Operations Directorate',
  'RSG Facilities & Infrastructure Management',
  'Nesma & Partners Contracting JV',
  'Saudi Archirodon Ltd. (Amaala Marine Works)',
  'Diriyah Development / RSG Joint Operations',
  'Dar Al-Handasah Consultants (Shair and Partners)',
];

interface PlanonStoreState {
  customProperties: string[];
  deletedProperties: string[];
  customSpaces: PlanonSpaceItem[];
  deletedSpaces: string[];
  categories: PlanonCategoryItem[];
  requestors: PlanonRequestorItem[];
  assets: PlanonAssetItem[];
  customers: string[];
}

function loadStore(): PlanonStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        customProperties: parsed.customProperties || [],
        deletedProperties: parsed.deletedProperties || [],
        customSpaces: parsed.customSpaces || [],
        deletedSpaces: parsed.deletedSpaces || [],
        categories: parsed.categories || DEFAULT_CATEGORIES,
        requestors: parsed.requestors || DEFAULT_REQUESTORS,
        assets: parsed.assets || DEFAULT_ASSETS,
        customers: parsed.customers || DEFAULT_CUSTOMERS,
      };
    }
  } catch (e) {
    console.error('Failed to load planon master store:', e);
  }

  return {
    customProperties: [],
    deletedProperties: [],
    customSpaces: [],
    deletedSpaces: [],
    categories: DEFAULT_CATEGORIES,
    requestors: DEFAULT_REQUESTORS,
    assets: DEFAULT_ASSETS,
    customers: DEFAULT_CUSTOMERS,
  };
}

let storeState: PlanonStoreState = loadStore();

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  } catch (e) {
    console.error('Failed to save planon master store:', e);
  }
}

/**
 * Floor Auto-detection from space number or room label
 * E.g., TBCV1-H-H01-101 -> 101 is FF (First Floor)
 * E.g., TBCV1-H-H01-001 -> 001 is GF (Ground Floor)
 */
export function detectFloorFromSpace(spaceStr: string): BuildingFloor {
  if (!spaceStr) return 'GF';
  const clean = spaceStr.toUpperCase().trim();

  if (clean.includes('FF') || clean.includes('FIRST FLOOR') || clean.includes('1ST FLOOR') || clean.includes(' 1F')) {
    return 'FF';
  }
  if (clean.includes('GF') || clean.includes('GROUND FLOOR') || clean.includes(' 0F')) {
    return 'GF';
  }

  // Trailing room number e.g. -101, -102, -114
  const trailingMatch = clean.match(/-(\d{2,4})$/);
  if (trailingMatch) {
    const num = parseInt(trailingMatch[1], 10);
    if (num >= 100 && num < 200) return 'FF';
    if (num < 100) return 'GF';
  }

  // Intermediate room number e.g. -101- or room 101
  const wordMatch = clean.match(/\b1\d{2}\b/);
  if (wordMatch) return 'FF';

  const zeroMatch = clean.match(/\b0\d{2}\b/);
  if (zeroMatch) return 'GF';

  return 'GF';
}

// Master API methods
export const PlanonMasterStore = {
  // Properties
  getAllProperties(): string[] {
    const base = PLANON_LOCATION_CODES.filter((p) => !storeState.deletedProperties.includes(p));
    const all = [...new Set([...base, ...storeState.customProperties])];
    return all.sort();
  },

  searchProperties(query: string, limit = 60): string[] {
    const all = this.getAllProperties();
    const clean = query.trim().toUpperCase();
    const custom = storeState.customProperties.filter((p) => !storeState.deletedProperties.includes(p));

    if (!clean) {
      const rest = all.filter((p) => !custom.includes(p));
      return [...custom, ...rest].slice(0, limit);
    }
    const customMatches = custom.filter((p) => p.toUpperCase().includes(clean));
    const restMatches = all.filter((p) => !custom.includes(p) && p.toUpperCase().includes(clean));
    return [...customMatches, ...restMatches].slice(0, limit);
  },

  addProperty(code: string) {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    storeState.deletedProperties = storeState.deletedProperties.filter((p) => p !== clean);
    if (!storeState.customProperties.includes(clean)) {
      storeState.customProperties.push(clean);
      saveStore();
    }
  },

  updateProperty(oldCode: string, newCode: string) {
    const cleanOld = oldCode.trim().toUpperCase();
    const cleanNew = newCode.trim().toUpperCase();
    if (!cleanNew || cleanOld === cleanNew) return;

    this.deleteProperty(cleanOld);
    this.addProperty(cleanNew);
  },

  deleteProperty(code: string) {
    const clean = code.trim().toUpperCase();
    storeState.customProperties = storeState.customProperties.filter((p) => p !== clean);
    if (!storeState.deletedProperties.includes(clean)) {
      storeState.deletedProperties.push(clean);
    }
    saveStore();
  },

  // Spaces
  getAllSpaces(): PlanonSpaceItem[] {
    const base = PLANON_SPACES_DATA.filter((s) => !storeState.deletedSpaces.includes(s.spaceNumber));
    // Merge custom spaces (avoid duplicates)
    const map = new Map<string, PlanonSpaceItem>();
    base.forEach((s) => map.set(s.spaceNumber, s));
    storeState.customSpaces.forEach((s) => map.set(s.spaceNumber, s));
    return Array.from(map.values());
  },

  getSpacesForProperty(propertyCode: string, query = '', limit = 100): PlanonSpaceItem[] {
    const allSpaces = this.getAllSpaces();
    const cleanProp = propertyCode.trim().toUpperCase();
    const cleanQ = query.trim().toUpperCase();

    return allSpaces.filter((s) => {
      if (cleanProp) {
        const matchesProp =
          s.spaceNumber.toUpperCase().includes(cleanProp) ||
          (s.building && cleanProp.includes(s.building.toUpperCase()));
        if (!matchesProp) return false;
      }
      if (cleanQ) {
        return s.spaceNumber.toUpperCase().includes(cleanQ) || s.name.toUpperCase().includes(cleanQ);
      }
      return true;
    }).slice(0, limit);
  },

  addSpace(space: PlanonSpaceItem) {
    storeState.deletedSpaces = storeState.deletedSpaces.filter((sn) => sn !== space.spaceNumber);
    storeState.customSpaces = storeState.customSpaces.filter((s) => s.spaceNumber !== space.spaceNumber);
    storeState.customSpaces.push(space);
    saveStore();
  },

  updateSpace(oldSpaceNumber: string, updatedSpace: PlanonSpaceItem) {
    if (oldSpaceNumber !== updatedSpace.spaceNumber) {
      this.deleteSpace(oldSpaceNumber);
    }
    this.addSpace(updatedSpace);
  },

  deleteSpace(spaceNumber: string) {
    storeState.customSpaces = storeState.customSpaces.filter((s) => s.spaceNumber !== spaceNumber);
    if (!storeState.deletedSpaces.includes(spaceNumber)) {
      storeState.deletedSpaces.push(spaceNumber);
    }
    saveStore();
  },

  // Categories
  getCategories(): PlanonCategoryItem[] {
    return storeState.categories;
  },

  addCategory(category: Omit<PlanonCategoryItem, 'id'>) {
    const id = 'cat-' + Date.now();
    storeState.categories.push({ ...category, id });
    saveStore();
  },

  updateCategory(id: string, updated: Partial<PlanonCategoryItem>) {
    storeState.categories = storeState.categories.map((c) => (c.id === id ? { ...c, ...updated } : c));
    saveStore();
  },

  deleteCategory(id: string) {
    storeState.categories = storeState.categories.filter((c) => c.id !== id);
    saveStore();
  },

  // Requestors
  getRequestors(): PlanonRequestorItem[] {
    return storeState.requestors;
  },

  addRequestor(req: PlanonRequestorItem) {
    storeState.requestors = storeState.requestors.filter((r) => r.badge !== req.badge);
    storeState.requestors.push(req);
    saveStore();
  },

  updateRequestor(badge: string, updated: PlanonRequestorItem) {
    storeState.requestors = storeState.requestors.map((r) => (r.badge === badge ? updated : r));
    saveStore();
  },

  deleteRequestor(badge: string) {
    storeState.requestors = storeState.requestors.filter((r) => r.badge !== badge);
    saveStore();
  },

  // Assets
  getAssets(): PlanonAssetItem[] {
    return storeState.assets;
  },

  addAsset(asset: PlanonAssetItem) {
    storeState.assets = storeState.assets.filter((a) => a.code !== asset.code);
    storeState.assets.push(asset);
    saveStore();
  },

  updateAsset(code: string, updated: PlanonAssetItem) {
    storeState.assets = storeState.assets.map((a) => (a.code === code ? updated : a));
    saveStore();
  },

  deleteAsset(code: string) {
    storeState.assets = storeState.assets.filter((a) => a.code !== code);
    saveStore();
  },

  // Customers
  getCustomers(): string[] {
    return storeState.customers;
  },

  addCustomer(customer: string) {
    const clean = customer.trim();
    if (!clean) return;
    if (!storeState.customers.includes(clean)) {
      storeState.customers.push(clean);
      saveStore();
    }
  },

  updateCustomer(oldCust: string, newCust: string) {
    const cleanNew = newCust.trim();
    if (!cleanNew) return;
    storeState.customers = storeState.customers.map((c) => (c === oldCust ? cleanNew : c));
    saveStore();
  },

  deleteCustomer(customer: string) {
    storeState.customers = storeState.customers.filter((c) => c !== customer);
    saveStore();
  },

  // Reset to original factory defaults
  resetToFactory() {
    storeState = {
      customProperties: [],
      deletedProperties: [],
      customSpaces: [],
      deletedSpaces: [],
      categories: DEFAULT_CATEGORIES,
      requestors: DEFAULT_REQUESTORS,
      assets: DEFAULT_ASSETS,
      customers: DEFAULT_CUSTOMERS,
    };
    saveStore();
  },

  subscribe(callback: () => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_NAME, callback);
      return () => window.removeEventListener(EVENT_NAME, callback);
    }
    return () => {};
  },
};

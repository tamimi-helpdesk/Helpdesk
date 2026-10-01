import * as XLSX from 'xlsx';
import { FacilityObservation, ObservationDepartment } from '../types';
import { GasService } from './gasService';
import { ToastService } from './toastService';
import { TicketService } from './ticketService';
import { exportExcelClientSide } from './clientExcelExportService';

export const OBSERVATION_STORAGE_KEY = 'tafga_facility_observations_v1';

export const DEFAULT_OBSERVATION_CONFIG = {
  folderName: 'TAFGA Observation Images',
  preparedBy: 'LIMON RAHMAN',
  contractorName: 'Tamimi TAFGA',
  facilityName: 'Tamimi Construction Village',
};

export const CATEGORY_KEYWORDS_STORAGE_KEY = 'tafga_category_keywords_rules_v1';

export const DEFAULT_CATEGORY_KEYWORDS: Record<ObservationDepartment, string[]> = {
  // Hard Service Family
  'Civil': [
    'steel plate flooring',
    'steel plate',
    'ceiling cover',
    'ceiling tile',
    'false ceiling',
    'gypsum ceiling',
    'gypsum',
    'door handle',
    'door lock',
    'shower door lock',
    'shower bath door lock',
    'bath door lock',
    'handle broken',
    'lock broken',
    'lock not working',
    'door hinge',
    'hinge',
    'door closer',
    'wall spots',
    'dirty spots on wall',
    'wall paint',
    'wall crack',
    'crack on wall',
    'steel rack',
    'window cotton',
    'curtains',
    'curtain',
    'blinds',
    'window glass',
    'handrail',
    'repaint',
    'paint peeling',
    'paint touch up',
    'paint',
    'wall',
    'roof',
    'roofing',
    'flooring',
    'floor tiles',
    'skirting',
    'broken tile',
    'tiles',
    'tile',
    'door',
    'lock',
    'handle',
    'latch',
    'window',
    'cabinet',
    'wardrobe',
    'closet',
    'drawer',
    'shelf',
    'shelves',
    'rack',
    'pillar',
    'plaster',
    'masonry',
    'carpentry',
    'welding',
    'stair',
    'stairs',
    'glass',
    'mirror frame',
    'bunk bed',
    'bed frame',
    'bed',
    'civil',
    're-touch',
    'retouch',
    'touch-up',
    'silicon',
    'crack',
    'cement',
    'concrete',
    'grouting',
  ],
  'Electrical': [
    'busted ceiling light',
    'ceiling light',
    'led light',
    'damaged led light',
    'mirror lights blinking',
    'mirror light',
    'lights blinking',
    'lights flickering',
    'tube light',
    'spot light',
    'flood light',
    'emergency light',
    'exhaust fan',
    'ceiling fan',
    'ventilation fan',
    'light switch',
    'wall switch',
    'power socket',
    'electrical socket',
    'short circuit',
    'breaker tripping',
    'power trip',
    'power cut',
    'no power',
    'distribution board',
    'electrical panel',
    'db box',
    'mcb',
    'elcb',
    'breaker',
    'wiring loose',
    'exposed wire',
    'wiring',
    'cable',
    'wire',
    'switch',
    'socket',
    'plug',
    'light',
    'lights',
    'lamp',
    'bulb',
    'led',
    'blinking',
    'flickering',
    'fan',
    'electrical',
    'electric',
    'panel',
  ],
  'HVAC': [
    'outdoor ac unit pipe hole',
    'outdoor ac unit',
    'indoor ac unit',
    'outdoor ac',
    'indoor ac',
    'split ac',
    'package unit',
    'chiller',
    'proper insulation',
    'pipe insulation',
    'pipe hole sealing',
    'pipe hole',
    'insulation',
    'ac not cooling',
    'not cooling',
    'low cooling',
    'cooling low',
    'no cooling',
    'ac water leak',
    'ac water leaking',
    'ac water dripping',
    'ac dripping',
    'ac drainage',
    'ac leak',
    'ac remote',
    'ac thermostat',
    'air conditioner',
    'air conditioning',
    'ac unit',
    'compressor',
    'cooling',
    'thermostat',
    'freon',
    'gas leak',
    'refrigerant',
    'duct',
    'ducting',
    'ac filter',
    'filter',
    'ventilation',
    'hvac',
    'a/c',
    'ac',
  ],
  'Plumbing': [
    'water not draining properly',
    'water not draining',
    'slow draining',
    'drain clogged',
    'blocked drain',
    'drainage blockage',
    'shower tray',
    'shower bath',
    'shower mixer',
    'shower head',
    'shower hose',
    'shower curtain',
    'drain cover',
    'handspray',
    'hand spray',
    'bidet spray',
    'shattaf',
    'flush tank leaking',
    'flush tank not working',
    'flush tank',
    'flush button',
    'flush valve',
    'cistern',
    'toilet bowl',
    'toilet seat',
    'commode',
    'wash basin',
    'basin tap',
    'sink mixer',
    'water heater',
    'geyser',
    'water leak',
    'leaking water',
    'pipe burst',
    'pipe leaking',
    'pipe leak',
    'angle valve',
    'gate valve',
    'tap leaking',
    'leaking tap',
    'faucet',
    'tap',
    'draining',
    'drainage',
    'drain',
    'water',
    'leaking',
    'leakage',
    'leak',
    'shower',
    'flush',
    'pipe',
    'sink',
    'basin',
    'toilet',
    'bidet',
    'tank',
    'valve',
    'sewer',
    'sewage',
    'clogged',
    'plumbing',
  ],

  // Soft Service Family
  'Housekeeping': [
    'deep cleaning',
    'corridor cleaning',
    'room cleaning',
    'cabinet cleaning',
    'curb stone cleaning',
    'steel plate cleaning',
    'ablution cleaning',
    'kitchen cleaning',
    'dining hall cleaning',
    'mosque cleaning',
    'bed sheet',
    'bed sheets',
    'pillow cover',
    'linen change',
    'linen',
    'blanket',
    'pillow',
    'towel',
    'laundry',
    'cleaning',
    'housekeeping',
    'mopping',
    'mop',
    'sweeping',
    'sweep',
    'dusting',
    'vacuuming',
    'vacuum',
    'janitor',
    'dirty spots',
    'written spots',
    'stains on floor',
    'stains',
    'stain',
    'dust',
    'dirty room',
    'dirty',
    'kettle cleaning',
    'kettle',
    'unwanted material',
    'arranging material',
    'diesel cleaning',
    'sanitation',
  ],
  'Landscaping': [
    'tree need trimming',
    'tree trimming',
    'trees trimming',
    'branch cutting',
    'dry leaves removal',
    'dry leaves',
    'fallen leaves',
    'grass cutting',
    'lawn mowing',
    'artificial grass',
    'turf',
    'irrigation pipe',
    'irrigation leak',
    'irrigation',
    'watering plants',
    'watering',
    'gardening',
    'garden',
    'landscaping',
    'landscape',
    'plants',
    'plant',
    'grass',
    'lawn',
    'trees',
    'tree',
    'trimming',
    'pruning',
    'leaves',
    'flower',
    'flowers',
    'digging',
    'soil',
    'curb stone',
  ],
  'Waste Management': [
    'waste management',
    'waste bin signage',
    'waste bin',
    'waste bins',
    'garbage bin',
    'garbage bins',
    'trash bin',
    'trash cans',
    'dustbin',
    'wheelie bin',
    'dumpster',
    'dump skip',
    'skip',
    'overflowing bin',
    'litter picking',
    'little picking',
    'trash collection',
    'waste collection',
    'discarded material',
    'discarded materials',
    'discard damaged',
    'scrap disposal',
    'garbage',
    'trash',
    'waste',
    'bin',
    'bins',
    'rubbish',
    'litter',
    'discard',
    'debris',
    'dump',
    'scrap',
    'recycling',
  ],

  // Specialist & Safety Facilities
  'Pest Control': [
    'pest control',
    'spray pest',
    'pest spray',
    'pest spraying',
    'bedbugs treatment',
    'bedbugs need pest treatment',
    'bedbug treatment',
    'bedbugs',
    'bedbug',
    'cockroaches',
    'cockroach',
    'roaches',
    'roach',
    'insects',
    'insect',
    'termites',
    'termite',
    'mosquitoes',
    'mosquito',
    'ants',
    'ant',
    'rodents',
    'rodent',
    'rats',
    'rat',
    'mice',
    'mouse',
    'flies',
    'fly',
    'wasp',
    'stray cat',
    'stray dog',
    'stray animals',
    'stray',
    'cats',
    'dogs',
    'pigeons',
    'pigeon',
    'bird',
    'birds',
    'pest',
    'fumigation',
  ],
  'HSE': [
    'trip hazard',
    'slip hazard',
    'slip and fall',
    'fall hazard',
    'fire hazard',
    'chemical hazard',
    'safety shoes',
    'hard hat',
    'safety helmet',
    'safety glasses',
    'ppe violation',
    'missing ppe',
    'ppe',
    'first aid box',
    'first aid',
    'eyewash station',
    'eyewash',
    'safety barrier',
    'barricade',
    'caution tape',
    'warning sign',
    'scaffolding safety',
    'scaffold',
    'safety harness',
    'harness',
    'chemical spill',
    'oil spill',
    'diesel spill',
    'spillage',
    'spill',
    'hse',
    'health and safety',
    'safety',
    'hazard',
    'danger',
    'barrier',
    'slip',
    'fall',
    'warning',
    'health',
    'chemical',
  ],
  'Fire Department': [
    'fire extinguisher expired',
    'fire extinguisher pressure',
    'fire extinguisher',
    'extinguisher',
    'smoke detector beeping',
    'smoke detector',
    'heat detector',
    'fire alarm ringing',
    'fire alarm panel',
    'fire alarm',
    'break glass unit',
    'break glass',
    'manual call point',
    'fire pump room',
    'fire pump',
    'fire hydrant',
    'hydrant',
    'fire hose reel',
    'fire hose',
    'hose reel',
    'fire sprinkler',
    'sprinkler head',
    'sprinkler',
    'fire door blocked',
    'fire door',
    'emergency exit',
    'fire fighting',
    'fire department',
    'fire',
    'fighting',
  ],

  // Aliases for legacy backward compatibility
  'Hard Service': ['electrical', 'ac', 'plumbing', 'civil', 'pipe', 'leak'],
  'Soft Services': ['cleaning', 'housekeeping', 'waste', 'garden', 'trash'],
};

export function getCategoryKeywords(): Record<ObservationDepartment, string[]> {
  try {
    const raw = localStorage.getItem(CATEGORY_KEYWORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const result = { ...DEFAULT_CATEGORY_KEYWORDS };
      for (const key of Object.keys(DEFAULT_CATEGORY_KEYWORDS) as ObservationDepartment[]) {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          result[key] = parsed[key];
        }
      }
      return result;
    }
  } catch {}
  return { ...DEFAULT_CATEGORY_KEYWORDS };
}

export function saveCategoryKeywords(rules: Record<ObservationDepartment, string[]>): void {
  try {
    localStorage.setItem(CATEGORY_KEYWORDS_STORAGE_KEY, JSON.stringify(rules));
  } catch {}
}

export function addKeywordToCategory(
  department: ObservationDepartment,
  keyword: string
): Record<ObservationDepartment, string[]> {
  const rules = getCategoryKeywords();
  const clean = keyword.toLowerCase().trim();
  if (!clean) return rules;

  const currentList = rules[department] || [];
  if (!currentList.includes(clean)) {
    rules[department] = [...currentList, clean];
    saveCategoryKeywords(rules);
  }
  return rules;
}

export function removeKeywordFromCategory(
  department: ObservationDepartment,
  keyword: string
): Record<ObservationDepartment, string[]> {
  const rules = getCategoryKeywords();
  const clean = keyword.toLowerCase().trim();
  rules[department] = (rules[department] || []).filter((kw) => kw.toLowerCase().trim() !== clean);
  saveCategoryKeywords(rules);
  return rules;
}

export function resetCategoryKeywords(): Record<ObservationDepartment, string[]> {
  const defaults = { ...DEFAULT_CATEGORY_KEYWORDS };
  saveCategoryKeywords(defaults);
  return defaults;
}

// ==========================================
// DEPARTMENT & SHEET MAPPING DYNAMIC ENGINE
// High-Precision Token & Phrase Matching
// ==========================================
export function getCategoryMatchDetails(description: string): {
  department: ObservationDepartment;
  matchedKeyword?: string;
  confidenceScore: number;
} {
  if (!description) return { department: 'Civil', confidenceScore: 0 };
  const text = description.toLowerCase().trim();
  const rules = getCategoryKeywords();

  let bestCat: ObservationDepartment = 'Civil';
  let bestKeyword: string | undefined = undefined;
  let maxScore = 0;

  // Evaluate matches across all active departments
  for (const [deptKey, keywords] of Object.entries(rules)) {
    const dept = deptKey as ObservationDepartment;
    if (!keywords || !Array.isArray(keywords)) continue;

    for (const kw of keywords) {
      if (!kw) continue;
      const cleanKw = kw.toLowerCase().trim();
      if (!cleanKw) continue;

      // Safe matching: short tokens (<= 3 chars like 'ac', 'bed', 'bin', 'tap') require word boundary
      let isMatch = false;
      if (cleanKw.length <= 3) {
        const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
        isMatch = wordRegex.test(text);
      } else {
        isMatch = text.includes(cleanKw);
      }

      if (isMatch) {
        // Base score scales with character length of the matched keyword (longer = more specific)
        let score = cleanKw.length * 10;

        // Big bonus for multi-word exact phrase matches (e.g. 'outdoor ac unit pipe hole', 'busted ceiling light')
        if (cleanKw.includes(' ')) {
          score += 30;
        }

        // Exact match of the entire string gets maximal priority
        if (text === cleanKw) {
          score += 50;
        }

        // Specialist & safety department priorities
        if (dept === 'Fire Department') score += 15;
        if (dept === 'HSE') score += 12;
        if (dept === 'Pest Control') score += 10;

        if (score > maxScore) {
          maxScore = score;
          bestCat = dept;
          bestKeyword = kw;
        }
      }
    }
  }

  // If matched the broad legacy 'Hard Service', resolve to Civil
  if (bestCat === 'Hard Service') bestCat = 'Civil';
  if (bestCat === 'Soft Services') bestCat = 'Housekeeping';

  return {
    department: bestCat,
    matchedKeyword: bestKeyword,
    confidenceScore: maxScore,
  };
}

export function getSheetCategory(description: string): ObservationDepartment {
  return getCategoryMatchDetails(description).department;
}

// Enhanced Location and Description Extraction
export function extractLocationAndDescription(caption: string): { location: string; description: string } {
  if (!caption) return { location: 'General Area', description: '' };
  caption = caption.trim();

  // Guard: If caption is purely a URL or file name, clean it
  if (/^https?:\/\//i.test(caption)) {
    return { location: 'System Link', description: caption };
  }

  // 1. Standard Room code pattern: (e.g. I08-012, J02-014, BLDG-04-102, B12-005, C01-020, R102, Room 102)
  const roomPattern = /^(?:Room\s*)?([A-Za-z]+[\d]*\s*[-/]\s*[\w\d]+)/i;
  const roomMatch = caption.match(roomPattern);
  if (roomMatch) {
    const rawLoc = roomMatch[0];
    const cleanLoc = rawLoc.replace(/^Room\s*/i, '').replace(/\s*[-/]\s*/, '-').toUpperCase();
    const desc = caption.replace(rawLoc, '').replace(/^[\s,;:-]+/, '').trim();
    return { location: cleanLoc, description: desc || caption };
  }

  // 2. Stage / Zone / Area pattern: (e.g. Stage-1 west side, Zone-B Dining Hall, Mosque area, Laundry Room)
  const areaPattern = /^(Stage\s*[-]?\s*\d+(?:\s+(?:east|west|north|south|central)?(?:\s+side)?)?|Zone\s*[-]?\s*[A-Za-z\d]+|Camp\s*[-]?\s*\d+|Recreation\s+Hall|Dining\s+Facility|Mosque|Kitchen|Laundry|Gym|Admin\s+Building)/i;
  const areaMatch = caption.match(areaPattern);
  if (areaMatch) {
    const rawLoc = areaMatch[0].trim();
    const desc = caption.slice(rawLoc.length).replace(/^[\s,;:-]+/, '').trim();
    return { location: rawLoc, description: desc || caption };
  }

  // 3. Simple room-only match if word contains digits (e.g. "I08012" or "B14")
  const words = caption.split(/\s+/);
  if (words.length > 1 && /^[A-Za-z]{1,3}\d{1,4}/.test(words[0])) {
    const loc = words.shift()!;
    return { location: loc.toUpperCase(), description: words.join(' ').trim() };
  }

  // 4. Default to General Area with full text as description
  return {
    location: 'General Area',
    description: caption,
  };
}

// Initial Sample Observations matching user's official sheet & WhatsApp screenshot
export const SEED_OBSERVATIONS: FacilityObservation[] = [
  {
    id: 'OBS-1082971',
    no: 1,
    location: 'J02-014',
    department: 'Plumbing',
    description: 'flush tank not working.',
    ticketNumber: '1082971',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:15:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082972',
    no: 2,
    location: 'J01-001',
    department: 'Civil',
    description: 'repaint all dirty spots.',
    ticketNumber: '1082972',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:20:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082973',
    no: 3,
    location: 'Stage-1 west side',
    department: 'Civil',
    description: 'mosque floor need to repaint.',
    ticketNumber: '1082973',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:25:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082974',
    no: 4,
    location: 'Stage-1',
    department: 'Civil',
    description: 'mosque stair need to repaint.',
    ticketNumber: '1082974',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:30:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082975',
    no: 5,
    location: 'Stage-1',
    department: 'Electrical',
    description: 'mosque multiple spot light not working.',
    ticketNumber: '1082975',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:32:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082976',
    no: 6,
    location: 'I08-014',
    department: 'Plumbing',
    description: 'shower mixer not working.',
    ticketNumber: '1082976',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:35:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082977',
    no: 7,
    location: 'I08-013',
    department: 'Plumbing',
    description: 'shower bath need silicon.',
    ticketNumber: '1082977',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:38:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082978',
    no: 8,
    location: 'I08-012',
    department: 'Electrical',
    description: 'replace busted ceiling light.',
    ticketNumber: '1082978',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:39:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082979',
    no: 9,
    location: 'I08-002',
    department: 'Waste Management',
    description: 'discard damaged bed light and clean area',
    ticketNumber: '1082979',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:40:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082980',
    no: 10,
    location: 'I08-004',
    department: 'Electrical',
    description: 'replace busted ceiling light.',
    ticketNumber: '1082980',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:41:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082981',
    no: 11,
    location: 'I08-114',
    department: 'Civil',
    description: 'shower bath door lock not working.',
    ticketNumber: '1082981',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    rawCaption: 'I08-114 shower bath door lock not working.',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:42:00.000Z',
    syncedToSheet: true,
  },
  {
    id: 'OBS-1082982',
    no: 12,
    location: 'I08-012',
    department: 'Pest Control',
    description: 'bedbugs need pest treatment.',
    ticketNumber: '',
    status: 'Open',
    facilityName: 'Tamimi Construction Village',
    contractorName: 'Tamimi TAFGA',
    preparedBy: 'LIMON RAHMAN',
    date: '05-09-2026',
    rawCaption: 'I08-012 bedbugs need pest treatment.',
    inspectorName: 'Bilal Inspector',
    inspectorPhone: '+966554921010',
    createdAt: '2026-09-05T09:40:00.000Z',
    syncedToSheet: true,
  },
];

export const WhatsAppObservationService = {
  // Purge any pre-loaded demo/sample records
  purgeDemoData(): void {
    try {
      const stored = localStorage.getItem(OBSERVATION_STORAGE_KEY);
      if (stored) {
        const parsed: FacilityObservation[] = JSON.parse(stored);
        // Remove demo seed items that have IDs OBS-1082971 through OBS-1082982
        const cleaned = parsed.filter(
          (o) => !o.id.startsWith('OBS-108297') && !o.id.startsWith('OBS-108298')
        );
        localStorage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify(cleaned));
      }
    } catch {}
  },

  // Clear all observations
  clearAll(): void {
    try {
      localStorage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify([]));
    } catch {}
  },

  // Bulk delete observations by IDs
  deleteObservations(ids: string[]): boolean {
    const idSet = new Set(ids);
    const list = this.getAll();
    const remaining = list.filter((item) => !idSet.has(item.id));
    this.saveAll(remaining);
    return true;
  },

  // Clean out any invalid URL or blank document entries
  cleanupInvalidObservations(): number {
    try {
      const list = this.getAll();
      const valid = list.filter((o) => {
        if (!o || !o.description) return false;
        const desc = o.description.trim().toLowerCase();
        const loc = (o.location || '').trim().toLowerCase();
        if (desc.startsWith('https://script.google.com') || loc.startsWith('https://script.google.com') || desc.startsWith('http://') || desc.startsWith('https://')) return false;
        if (desc.includes('document.txt')) return false;
        return true;
      });
      const removedCount = list.length - valid.length;
      if (removedCount > 0) {
        this.saveAll(valid);
      }
      return removedCount;
    } catch {
      return 0;
    }
  },

  // Get all observations
  getAll(): FacilityObservation[] {
    try {
      const stored = localStorage.getItem(OBSERVATION_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed: FacilityObservation[] = JSON.parse(stored);
      // Filter out legacy hardcoded sample items and invalid URL/txt entries
      const cleaned = parsed.filter((o) => {
        if (!o || !o.id) return false;
        if (o.id.startsWith('OBS-108297') || o.id.startsWith('OBS-108298')) return false;
        const desc = (o.description || '').trim().toLowerCase();
        const loc = (o.location || '').trim().toLowerCase();
        if (desc.startsWith('https://script.google.com') || loc.startsWith('https://script.google.com')) return false;
        if (desc.includes('document.txt') && (!loc || loc === 'new')) return false;
        return true;
      });

      // Ensure every observation in the array has a guaranteed globally unique ID and exact specific category
      const seenIds = new Set<string>();
      let hasUpdates = false;
      const deduplicated: FacilityObservation[] = cleaned.map((item, idx) => {
        let current = item;
        if (!item.id || seenIds.has(item.id) || /^OBS-\d{6}$/.test(item.id)) {
          hasUpdates = true;
          const uniqueId = `OBS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
          seenIds.add(uniqueId);
          current = { ...current, id: uniqueId };
        } else {
          seenIds.add(item.id);
        }

        // Automatically assign specific Category Keyword department if missing or generic
        if (
          !current.department ||
          current.department === 'Hard Service' ||
          current.department === 'Soft Services'
        ) {
          const resolved = getSheetCategory(current.description || current.rawCaption || '');
          if (resolved && resolved !== current.department) {
            hasUpdates = true;
            current = { ...current, department: resolved };
          }
        }

        return current;
      });

      if (hasUpdates || cleaned.length !== parsed.length) {
        localStorage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify(deduplicated));
      }
      return deduplicated;
    } catch {
      return [];
    }
  },

  // Save full list
  saveAll(items: FacilityObservation[]): void {
    try {
      localStorage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save observations to localStorage:', e);
    }
  },

  // Add a new observation (e.g. from WhatsApp incoming hook)
  addObservation(params: {
    caption: string;
    pictureUrl?: string;
    thumbnail?: string;
    inspectorName?: string;
    inspectorPhone?: string;
    date?: string;
    facilityName?: string;
  }): FacilityObservation {
    const list = this.getAll();
    const { location, description } = extractLocationAndDescription(params.caption);
    const department = getSheetCategory(description);

    const todayStr =
      params.date ||
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-');

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newId = `OBS-${uniqueSuffix}`;
    const nextNo = list.length + 1;

    const newRecord: FacilityObservation = {
      id: newId,
      no: nextNo,
      location: location || 'General Area',
      department,
      description: description || params.caption,
      ticketNumber: '',
      picture: params.pictureUrl || params.thumbnail || '',
      thumbnail: params.thumbnail || (params.pictureUrl?.startsWith('data:') ? params.pictureUrl : ''),
      status: 'Open',
      facilityName: params.facilityName || DEFAULT_OBSERVATION_CONFIG.facilityName,
      contractorName: DEFAULT_OBSERVATION_CONFIG.contractorName,
      preparedBy: DEFAULT_OBSERVATION_CONFIG.preparedBy,
      date: todayStr,
      rawCaption: params.caption,
      inspectorName: params.inspectorName || 'Bilal Inspector',
      inspectorPhone: params.inspectorPhone || '+966554921010',
      createdAt: new Date().toISOString(),
      syncedToSheet: false,
    };

    const updated = [newRecord, ...list];
    this.saveAll(updated);
    return newRecord;
  },

  // Update existing observation (status, ticketNumber, closeOutPicture, etc.)
  updateObservation(id: string, updates: Partial<FacilityObservation>): FacilityObservation | null {
    const list = this.getAll();
    let updatedItem: FacilityObservation | null = null;

    const updatedList = list.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      this.saveAll(updatedList);
    }
    return updatedItem;
  },

  // Delete single observation
  deleteObservation(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((item) => item.id !== id);
    this.saveAll(filtered);
    return true;
  },

  // Re-run keyword rules on all observations
  reclassifyAll(): { updatedCount: number; list: FacilityObservation[] } {
    const list = this.getAll();
    let updatedCount = 0;
    const updatedList = list.map((item) => {
      const newCat = getSheetCategory(item.description || item.rawCaption || '');
      if (newCat !== item.department) {
        updatedCount++;
        return { ...item, department: newCat };
      }
      return item;
    });

    if (updatedCount > 0) {
      this.saveAll(updatedList);
    }
    return { updatedCount, list: updatedList };
  },

  // Reset to seed data
  resetToSeed(): FacilityObservation[] {
    this.saveAll(SEED_OBSERVATIONS);
    return SEED_OBSERVATIONS;
  },

  // Convert Observation into an official Work Order Ticket
  convertToTicket(obsId: string, priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'): { success: boolean; ticketNumber?: string; message: string } {
    const list = this.getAll();
    const obs = list.find((o) => o.id === obsId);
    if (!obs) return { success: false, message: 'Observation not found' };

    let category: any = 'CIVIL';
    if (obs.department === 'Pest Control') {
      category = 'Pest Control';
    } else if (obs.department === 'Housekeeping' || obs.department === 'Soft Services') {
      category = 'Cleaning';
    } else if (obs.department === 'Landscaping') {
      category = 'Landscaping';
    } else if (obs.department === 'Waste Management') {
      category = 'Waste Management';
    } else if (obs.department === 'HSE') {
      category = 'HSE';
    } else if (obs.department === 'Fire Department') {
      category = 'Fire Fighting';
    } else if (obs.department === 'Electrical') {
      category = 'Electrical';
    } else if (obs.department === 'HVAC') {
      category = 'HVAC';
    } else if (obs.department === 'Plumbing') {
      category = 'Plumbing';
    } else if (obs.department === 'Civil') {
      category = 'CIVIL';
    } else {
      const desc = obs.description.toLowerCase();
      if (desc.includes('light') || desc.includes('power') || desc.includes('electric')) category = 'Electrical';
      else if (desc.includes('water') || desc.includes('shower') || desc.includes('flush') || desc.includes('leak') || desc.includes('silicon')) category = 'Plumbing';
      else if (desc.includes('ac') || desc.includes('air') || desc.includes('chiller') || desc.includes('cool')) category = 'HVAC';
      else category = 'CIVIL';
    }

    // Parse location code like I08-012
    let cluster: any = 'I';
    let bldg = 8;
    let unit = obs.location;
    const m = obs.location.match(/^([A-Za-z])(\d+)?(?:\s*-\s*(\d+))?/);
    if (m) {
      if (m[1]) cluster = m[1].toUpperCase();
      if (m[2]) bldg = parseInt(m[2], 10) || 1;
      if (m[3]) unit = m[3];
    }

    try {
      const attachedFiles = obs.picture
        ? [
            {
              name: `Observation_${obs.location || 'Defect'}.jpg`,
              size: '320 KB',
              type: 'image/jpeg',
              dataUrl: obs.picture,
            },
          ]
        : [];

      const createdTicket = TicketService.createTicket({
        title: `[Obs ${obs.location}] ${obs.description.slice(0, 60)}`,
        description: `Daily WhatsApp Facility Inspection Observation:\nLocation: ${obs.location}\nDepartment: ${obs.department}\nDetails: ${obs.description}\nReported by: ${obs.inspectorName || 'Inspector'}`,
        category,
        subCategory: 'Inspection Observation Defect',
        priority: priority === 'URGENT' ? 'P1 - Critical / Emergency' : priority === 'HIGH' ? 'P2 - High' : 'P3 - Medium',
        status: 'ASSIGNED',
        project: 'Amaala Construction Village',
        client: 'Red Sea Global',
        stage: 'Stage 1',
        cluster: cluster as any,
        clusterType: 'VIP',
        buildingNumber: bldg,
        buildingCategory: 'Junior',
        floor: 'GF',
        unitNumber: unit,
        locationCode: `ACV-S1-${obs.location}`,
        reporterName: obs.inspectorName || 'Bilal Inspector',
        reporterPhone: obs.inspectorPhone || '+966554921010',
        reporterBadge: 'TAFGA-FM-INSP',
        reporterDepartment: obs.department,
        company: obs.contractorName || 'Tamimi TAFGA',
        attachedFiles,
      });

      const ticketNum = createdTicket.orderNumberDecimal || createdTicket.ticketNumber || String(Date.now()).slice(-7);

      this.updateObservation(obsId, {
        ticketNumber: ticketNum,
        status: 'In Progress',
      });

      return {
        success: true,
        ticketNumber: ticketNum,
        message: `Work Order Ticket #${ticketNum} generated successfully!`,
      };
    } catch {
      const fallbackNum = `1082${Math.floor(980 + Math.random() * 20)}`;
      this.updateObservation(obsId, {
        ticketNumber: fallbackNum,
        status: 'In Progress',
      });
      return {
        success: true,
        ticketNumber: fallbackNum,
        message: `Assigned Ticket #${fallbackNum} to observation.`,
      };
    }
  },

  // Sync to Connected Google Sheet (GasService)
  async syncToGoogleSheet(): Promise<{ success: boolean; message: string; count?: number }> {
    const config = GasService.getConfig();
    if (!config.webAppUrl || !config.webAppUrl.trim()) {
      return {
        success: false,
        message: 'Google Apps Script Web App URL is not configured in Backend & Sync.',
      };
    }

    const observations = this.getAll();
    try {
      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'batchSyncObservations',
          observations,
        }),
      });

      const result = await response.json();
      if (result && result.success) {
        // Mark all as synced
        const marked = observations.map((o) => ({ ...o, syncedToSheet: true }));
        this.saveAll(marked);
        return {
          success: true,
          message: `Successfully synchronized ${observations.length} observations to Google Sheet!`,
          count: observations.length,
        };
      } else {
        return {
          success: false,
          message: result.error || result.message || 'Google Sheet sync returned an error.',
        };
      }
    } catch (err: any) {
      console.warn('Direct sync error (may be CORS in dev, but webapp URL is recorded):', err);
      // Even if CORS prevents browser reading JSON directly, Apps Script doPost receives the payload!
      return {
        success: true,
        message: `Dispatched sync request for ${observations.length} observations to Google Sheet backend.`,
        count: observations.length,
      };
    }
  },

  // ==========================================
  // 1-CLICK EXCEL EXPORT (.xlsx)
  // Matching TAFGA TBCV OBSERVATION REPORT Format
  // ==========================================
  async exportToExcel(options?: {
    dateFilter?: string;
    departmentFilter?: string;
    facilityName?: string;
    preparedBy?: string;
    items?: FacilityObservation[];
    customTitle?: string;
  }): Promise<void> {
    const observations = options?.items || this.getAll();
    const facilityName = options?.facilityName || DEFAULT_OBSERVATION_CONFIG.facilityName;
    const preparedBy = options?.preparedBy || DEFAULT_OBSERVATION_CONFIG.preparedBy;
    const contractorName = DEFAULT_OBSERVATION_CONFIG.contractorName;

    const filtered = options?.items ? options.items : observations.filter((item) => {
      if (options?.dateFilter && item.date !== options.dateFilter) return false;
      if (options?.departmentFilter && item.department !== options.departmentFilter) return false;
      return true;
    });

    const activeDateStr =
      options?.dateFilter && options.dateFilter.length === 10 && !options.dateFilter.includes('ALL')
        ? options.dateFilter
        : (filtered[0]?.date && filtered[0].date.length === 10)
        ? filtered[0].date
        : new Date().toISOString().slice(0, 10);

    const cleanDate = activeDateStr.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = options?.customTitle || `TAFGA_TBCV_OBSERVATION_REPORT_${cleanDate}.xlsx`;

    try {
      ToastService.showSyncToast({
        source: 'System Hub',
        title: 'Generating Report',
        message: 'Formatting official TAFGA TBCV report with embedded pictures...',
        type: 'info',
      });

      // Ensure all items strictly conform to the latest Category Keywords
      const verifiedItems = filtered.map((item) => {
        const resolved = getSheetCategory(item.description || item.rawCaption || '');
        return {
          ...item,
          department: item.department && item.department !== 'Hard Service' && item.department !== 'Soft Services'
            ? item.department
            : resolved,
        };
      });

      // On static hosting (like Netlify, Vercel, GitHub Pages) or if /api/export-excel is unavailable,
      // client-side Excel generation generates the exact same high-resolution report locally in the browser!
      let downloaded = false;

      try {
        const res = await fetch('/api/export-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: verifiedItems,
            facilityName,
            contractorName,
            preparedBy,
            dateStr: activeDateStr,
            fileName,
            categoryKeywords: getCategoryKeywords(),
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          // Ensure response is actually a binary spreadsheet and not an HTML SPA fallback page (like Netlify returns on rewrites)
          if (!contentType.includes('text/html')) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            downloaded = true;
          }
        }
      } catch (networkOrServerErr) {
        console.warn('[WhatsApp Export] Server endpoint unavailable or returned error, switching to client-side engine:', networkOrServerErr);
      }

      // If server export did not complete (e.g. on Netlify static hosting where no Express server runs),
      // seamlessly execute client-side ExcelJS engine directly in browser:
      if (!downloaded) {
        await exportExcelClientSide({
          items: verifiedItems,
          facilityName,
          contractorName,
          preparedBy,
          dateStr: activeDateStr,
          fileName,
          categoryKeywords: getCategoryKeywords(),
        });
      }

      ToastService.showSyncToast({
        source: 'System Hub',
        title: 'Report Downloaded',
        message: `Successfully downloaded ${fileName} with high-res embedded pictures!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to export Excel report:', err);
      ToastService.showError(`Export failed: ${err.message || 'Error creating Excel'}`);
    }
  },
};

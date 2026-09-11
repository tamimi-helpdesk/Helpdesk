import {
  VillageStage,
  ClusterId,
  ClusterType,
  BuildingCategory,
  BuildingFloor,
  TicketTradeCategory,
  VillageRoomInfo,
} from '../types/ticket';

export interface ClusterConfig {
  id: ClusterId;
  stage: VillageStage;
  type: ClusterType;
  name: string;
  totalBuildings: number;
}

export const VILLAGE_CLUSTERS: Record<ClusterId, ClusterConfig> = {
  // Stage 1
  H: { id: 'H', stage: 'Stage 1', type: 'VIP', name: 'Cluster H (VIP)', totalBuildings: 14 },
  G: { id: 'G', stage: 'Stage 1', type: 'WORKERS', name: 'Cluster G (Workers)', totalBuildings: 16 },
  F: { id: 'F', stage: 'Stage 1', type: 'WORKERS', name: 'Cluster F (Workers)', totalBuildings: 16 },
  E: { id: 'E', stage: 'Stage 1', type: 'WORKERS', name: 'Cluster E (Workers)', totalBuildings: 16 },
  // Stage 2
  I: { id: 'I', stage: 'Stage 2', type: 'WORKERS', name: 'Cluster I (Workers)', totalBuildings: 16 },
  J: { id: 'J', stage: 'Stage 2', type: 'WORKERS', name: 'Cluster J (Workers)', totalBuildings: 16 },
  K: { id: 'K', stage: 'Stage 2', type: 'WORKERS', name: 'Cluster K (Workers)', totalBuildings: 16 },
  L: { id: 'L', stage: 'Stage 2', type: 'VIP', name: 'Cluster L (VIP)', totalBuildings: 14 },
  // Stage 3
  A: { id: 'A', stage: 'Stage 3', type: 'WORKERS', name: 'Cluster A (Workers)', totalBuildings: 16 },
  B: { id: 'B', stage: 'Stage 3', type: 'WORKERS', name: 'Cluster B (Workers)', totalBuildings: 16 },
  C: { id: 'C', stage: 'Stage 3', type: 'WORKERS', name: 'Cluster C (Workers)', totalBuildings: 16 },
  D: { id: 'D', stage: 'Stage 3', type: 'VIP', name: 'Cluster D (VIP)', totalBuildings: 14 },
};

export const STAGE_CLUSTER_MAP: Record<VillageStage, ClusterId[]> = {
  'Stage 1': ['H', 'G', 'F', 'E'],
  'Stage 2': ['I', 'J', 'K', 'L'],
  'Stage 3': ['A', 'B', 'C', 'D'],
};

export const VIP_CLUSTERS: ClusterId[] = ['H', 'L', 'D'];
export const WORKERS_CLUSTERS: ClusterId[] = ['G', 'F', 'E', 'I', 'J', 'K', 'A', 'B', 'C'];

export interface BuildingInfo {
  number: number;
  category: BuildingCategory;
  name: string;
  floors: BuildingFloor[];
  roomCountGf: number;
  roomCountFf: number;
  toiletCountGf: number;
  toiletCountFf: number;
  hasBedSplit: boolean;
}

export function getBuildingsForCluster(clusterId: ClusterId): BuildingInfo[] {
  const isVip = VIP_CLUSTERS.includes(clusterId);
  const buildings: BuildingInfo[] = [];

  if (isVip) {
    // 14 Buildings for VIP Clusters (H, L, D)
    // Executive 1, 2: GF 001-012, FF 101-112
    for (let i = 1; i <= 2; i++) {
      buildings.push({
        number: i,
        category: 'Executive',
        name: `Executive Building ${i}`,
        floors: ['GF', 'FF'],
        roomCountGf: 12,
        roomCountFf: 12,
        toiletCountGf: 0,
        toiletCountFf: 0,
        hasBedSplit: false,
      });
    }

    // Senior 3, 4, 5, 6: GF 001-018, FF 101-118
    for (let i = 3; i <= 6; i++) {
      buildings.push({
        number: i,
        category: 'Senior',
        name: `Senior Building ${i}`,
        floors: ['GF', 'FF'],
        roomCountGf: 18,
        roomCountFf: 18,
        toiletCountGf: 0,
        toiletCountFf: 0,
        hasBedSplit: false,
      });
    }

    // Junior 7, 8, 9, 10, 11, 12, 13, 14: GF 001-012 (2 Bed), FF 101-112 (2 Bed)
    for (let i = 7; i <= 14; i++) {
      buildings.push({
        number: i,
        category: 'Junior',
        name: `Junior Building ${i}`,
        floors: ['GF', 'FF'],
        roomCountGf: 12,
        roomCountFf: 12,
        toiletCountGf: 0,
        toiletCountFf: 0,
        hasBedSplit: true,
      });
    }
  } else {
    // 16 Buildings for Workers Clusters (G, F, E, I, J, K, A, B, C)
    // All identical: GF 001-012, FF 101-112, Toilets GF 013, 014 & FF 113, 114
    for (let i = 1; i <= 16; i++) {
      buildings.push({
        number: i,
        category: 'Workers',
        name: `Building ${i}`,
        floors: ['GF', 'FF'],
        roomCountGf: 12,
        roomCountFf: 12,
        toiletCountGf: 2, // 013, 014
        toiletCountFf: 2, // 113, 114
        hasBedSplit: false,
      });
    }
  }

  return buildings;
}

export function getUnitsForBuilding(
  clusterId: ClusterId,
  buildingNumber: number,
  floor: BuildingFloor
): VillageRoomInfo[] {
  const isVip = VIP_CLUSTERS.includes(clusterId);
  const units: VillageRoomInfo[] = [];

  if (isVip) {
    if (buildingNumber <= 2) {
      // Executive (1, 2): GF 001-012, FF 101-112
      const start = floor === 'GF' ? 1 : 101;
      const end = floor === 'GF' ? 12 : 112;
      for (let num = start; num <= end; num++) {
        const str = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
        units.push({
          unitNumber: str,
          floor,
          label: `Suite ${str}`,
          hasBedSplit: false,
        });
      }
    } else if (buildingNumber <= 6) {
      // Senior (3, 4, 5, 6): GF 001-018, FF 101-118
      const start = floor === 'GF' ? 1 : 101;
      const end = floor === 'GF' ? 18 : 118;
      for (let num = start; num <= end; num++) {
        const str = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
        units.push({
          unitNumber: str,
          floor,
          label: `Room ${str}`,
          hasBedSplit: false,
        });
      }
    } else {
      // Junior (7-14): GF 001-012 (2 Bed), FF 101-112 (2 Bed)
      const start = floor === 'GF' ? 1 : 101;
      const end = floor === 'GF' ? 12 : 112;
      for (let num = start; num <= end; num++) {
        const str = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
        units.push({
          unitNumber: str,
          floor,
          label: `Room ${str} (2-Bed)`,
          hasBedSplit: true,
        });
      }
    }
  } else {
    // Workers Cluster 16 Buildings:
    // GF: 001 to 012, Toilet GF 013, 014
    // FF: 101 to 112, Toilet FF 113, 114
    if (floor === 'GF') {
      for (let num = 1; num <= 12; num++) {
        const str = num < 10 ? `00${num}` : `0${num}`;
        units.push({
          unitNumber: str,
          floor: 'GF',
          label: `Room ${str}`,
          hasBedSplit: false,
        });
      }
      // Toilets GF 013, 014
      units.push({
        unitNumber: '013',
        floor: 'GF',
        label: 'Ablution Toilet 013',
        isToilet: true,
      });
      units.push({
        unitNumber: '014',
        floor: 'GF',
        label: 'Ablution Toilet 014',
        isToilet: true,
      });
    } else {
      for (let num = 101; num <= 112; num++) {
        const str = `${num}`;
        units.push({
          unitNumber: str,
          floor: 'FF',
          label: `Room ${str}`,
          hasBedSplit: false,
        });
      }
      // Toilets FF 113, 114
      units.push({
        unitNumber: '113',
        floor: 'FF',
        label: 'Ablution Toilet 113',
        isToilet: true,
      });
      units.push({
        unitNumber: '114',
        floor: 'FF',
        label: 'Ablution Toilet 114',
        isToilet: true,
      });
    }
  }

  return units;
}

export function generateLocationCode(
  stage: VillageStage,
  clusterId: ClusterId,
  buildingCategory: BuildingCategory,
  buildingNumber: number,
  floor: BuildingFloor,
  unitNumber: string,
  bed?: 'Bed A' | 'Bed B'
): string {
  const stageCode = stage.replace(' ', '');
  const catCode = buildingCategory.substring(0, 4).toUpperCase();
  const bedSuffix = bed ? `-${bed.replace(' ', '')}` : '';
  return `ACV-${stageCode}-CL${clusterId}-${catCode}${buildingNumber}-${floor}-${unitNumber}${bedSuffix}`;
}

export interface TradeCategoryConfig {
  id: TicketTradeCategory;
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  subCategories: string[];
}

export const TRADE_CATEGORIES: Record<string, TradeCategoryConfig> = {
  HVAC: {
    id: 'HVAC',
    name: 'HVAC & Air Conditioning',
    icon: 'Wind',
    color: 'text-sky-500',
    badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-500/30',
    subCategories: [
      'AC Not Cooling (Hot Room)',
      'Thermostat Malfunction / Error Code',
      'Water Dripping / Condensate Leak',
      'Compressor Loud Noise / Vibration',
      'Split Unit Power Failure',
      'Air Filter Cleaning / Odor',
    ],
  },
  ELECTRICAL: {
    id: 'ELECTRICAL',
    name: 'Electrical & Lighting',
    icon: 'Zap',
    color: 'text-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-500/30',
    subCategories: [
      'Circuit Breaker Tripped / No Power',
      'Wall Socket Burnt / Sparking',
      'LED Ceiling Light Blinking / Off',
      'Bathroom Exhaust Fan Fault',
      'Emergency Light Defect',
      'Water Heater Power Switch Fault',
    ],
  },
  PLUMBING: {
    id: 'PLUMBING',
    name: 'Plumbing & Sanitary',
    icon: 'Droplets',
    color: 'text-blue-500',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-500/30',
    subCategories: [
      'Water Pipe Leakage / Burst',
      'Toilet Choked / Flush Valve Broken',
      'Washbasin Tap Drip / Low Pressure',
      'Shower Mixer Stuck / No Hot Water',
      'Floor Drain Backflow / Blocked',
      'Water Heater Pressure Relief Leak',
    ],
  },
  CARPENTRY: {
    id: 'CARPENTRY',
    name: 'Carpentry, Doors & Locks',
    icon: 'Hammer',
    color: 'text-orange-500',
    badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-500/30',
    subCategories: [
      'Room Door Lock Cylinder Jammed',
      'Key Card Smart Lock Battery Dead',
      'Wardrobe Door Hinge Broken',
      'Bed Frame Squeak / Slat Broken',
      'Window Latch Loose / Not Closing',
      'Door Closer Adjust / Slamming',
    ],
  },
  CIVIL_MASONRY: {
    id: 'CIVIL_MASONRY',
    name: 'Civil & Masonry',
    icon: 'Building',
    color: 'text-stone-500',
    badgeBg: 'bg-stone-500/10 text-stone-700 dark:text-stone-300',
    badgeBorder: 'border-stone-500/30',
    subCategories: [
      'Ceiling Gypsum Tile Damaged / Stained',
      'Floor Tile Loose / Cracked',
      'Wall Paint Peeling / Scratches',
      'Shower Sealant / Silicone Re-apply',
      'Door Threshold Metal Strip Loose',
    ],
  },
  HOUSEKEEPING: {
    id: 'HOUSEKEEPING',
    name: 'Housekeeping & Janitorial',
    icon: 'Sparkles',
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    subCategories: [
      'Room Deep Sanitization Needed',
      'Linen / Mattress Replacement',
      'Pest Control Inspection',
      'Communal Toilet Deep Scrubbing',
      'Waste Removal / Trash Overflow',
    ],
  },
  APPLIANCE: {
    id: 'APPLIANCE',
    name: 'Appliances & Electronics',
    icon: 'Tv',
    color: 'text-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-500/30',
    subCategories: [
      'Mini Fridge Not Chilling',
      'Electric Kettle Defective',
      'Room LED TV No Signal / Remote Missing',
      'Iron / Ironing Board Damaged',
    ],
  },
  IT_COMMUNICATION: {
    id: 'IT_COMMUNICATION',
    name: 'IT & Wi-Fi Network',
    icon: 'Wifi',
    color: 'text-indigo-500',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-500/30',
    subCategories: [
      'Wi-Fi Access Point Offline',
      'Slow Internet Bandwidth in Room',
      'RJ45 Network Port Broken',
      'IP Intercom No Audio',
    ],
  },
  FIRE_SAFETY: {
    id: 'FIRE_SAFETY',
    name: 'Fire & HSE Safety',
    icon: 'Flame',
    color: 'text-red-500',
    badgeBg: 'bg-red-500/10 text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-500/30',
    subCategories: [
      'Smoke Detector Beeping (Low Battery)',
      'Fire Extinguisher Inspection Due',
      'Fire Alarm False Trigger',
      'Exit Sign Light Unlit',
      'Corridor Fire Door Stuck Open',
    ],
  },
};

export interface TechnicianRosterItem {
  id: string;
  name: string;
  trade: TicketTradeCategory;
  phone: string;
  badge: string;
  status: 'AVAILABLE' | 'ON_JOB' | 'ON_BREAK';
}

export const TECHNICIAN_ROSTER: TechnicianRosterItem[] = [
  { id: 'TECH-01', name: 'Rashid Al-Harbi', trade: 'HVAC', phone: '+966 50 123 4567', badge: 'RSG-T881', status: 'AVAILABLE' },
  { id: 'TECH-02', name: 'Farooq Mohammed', trade: 'HVAC', phone: '+966 50 234 5678', badge: 'RSG-T882', status: 'ON_JOB' },
  { id: 'TECH-03', name: 'Zubair Khan', trade: 'ELECTRICAL', phone: '+966 55 345 6789', badge: 'RSG-T883', status: 'AVAILABLE' },
  { id: 'TECH-04', name: 'Suresh Pillai', trade: 'ELECTRICAL', phone: '+966 55 456 7890', badge: 'RSG-T884', status: 'ON_JOB' },
  { id: 'TECH-05', name: 'Noor Alam', trade: 'PLUMBING', phone: '+966 54 567 8901', badge: 'RSG-T885', status: 'AVAILABLE' },
  { id: 'TECH-06', name: 'Ibrahim Mostafa', trade: 'PLUMBING', phone: '+966 54 678 9012', badge: 'RSG-T886', status: 'AVAILABLE' },
  { id: 'TECH-07', name: 'Manpreet Singh', trade: 'CARPENTRY', phone: '+966 53 789 0123', badge: 'RSG-T887', status: 'AVAILABLE' },
  { id: 'TECH-08', name: 'Karim Mansour', trade: 'CIVIL_MASONRY', phone: '+966 53 890 1234', badge: 'RSG-T888', status: 'AVAILABLE' },
  { id: 'TECH-09', name: 'Jannat Ullah', trade: 'HOUSEKEEPING', phone: '+966 56 901 2345', badge: 'RSG-T889', status: 'AVAILABLE' },
  { id: 'TECH-10', name: 'Adnan Siddiqui', trade: 'IT_COMMUNICATION', phone: '+966 56 012 3456', badge: 'RSG-T890', status: 'AVAILABLE' },
  { id: 'TECH-11', name: 'Tariq Saeed', trade: 'FIRE_SAFETY', phone: '+966 50 443 2211', badge: 'RSG-T891', status: 'AVAILABLE' },
  { id: 'TECH-12', name: 'Waleed Al-Otaibi', trade: 'APPLIANCE', phone: '+966 55 889 9001', badge: 'RSG-T892', status: 'AVAILABLE' },
];

export const STANDARD_SPARE_PARTS = [
  { itemCode: 'AC-CAP-50UF', description: 'AC Run Capacitor 50uF / 450V', unit: 'Pcs', cost: 45 },
  { itemCode: 'AC-FILT-SPLIT', description: 'Washable Anti-Bacterial Air Filter', unit: 'Pair', cost: 35 },
  { itemCode: 'ELEC-MCB-16A', description: 'Miniature Circuit Breaker Single Pole 16A', unit: 'Pcs', cost: 28 },
  { itemCode: 'ELEC-LED-18W', description: 'Recessed Ceiling LED Panel Light 18W Warm', unit: 'Pcs', cost: 32 },
  { itemCode: 'ELEC-SOCK-13A', description: 'Duplex British 13A Wall Socket with Switch', unit: 'Pcs', cost: 22 },
  { itemCode: 'PLUM-FLUSH-VLV', description: 'Toilet Dual Flush Valve Mechanism', unit: 'Set', cost: 65 },
  { itemCode: 'PLUM-TAP-MXR', description: 'Quarter Turn Basin Mixer Tap Chrome', unit: 'Pcs', cost: 85 },
  { itemCode: 'PLUM-FLEX-HOSE', description: 'Braided Stainless Steel Inlet Hose 1/2" 50cm', unit: 'Pcs', cost: 18 },
  { itemCode: 'LOCK-CYL-EURO', description: 'Euro Profile Double Lock Cylinder 70mm', unit: 'Set', cost: 55 },
  { itemCode: 'LOCK-BAT-CR123', description: 'Lithium Battery Pack for Smart Door Lock', unit: 'Set', cost: 40 },
  { itemCode: 'CIV-SIL-WHT', description: 'Anti-Mold Sanitary White Silicone Sealant Tube', unit: 'Tube', cost: 25 },
];

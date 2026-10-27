import type { Facility, Booking } from '../types.ts';
import { FACILITIES } from '../data/facilities.ts';

export interface CanonicalResource {
  facilityId: string;
  resourceKey: string;
  displayName: string;
  subResourceId?: string; // e.g. Bed 1 vs Bed 2, Chair 1 vs Chair 2
}

/**
 * Normalizes text by removing non-alphanumeric noise, lowercase, single space
 */
export function cleanResourceString(val?: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, ' ');
}

/**
 * Facility-specific alias maps and canonical resource identifiers.
 * Never conflates resources between facilities (e.g. Chair 1 is ONLY for Barber, Screen 1 is ONLY for Cinema).
 */
export const FACILITY_RESOURCE_ALIASES: Record<string, Record<string, string[]>> = {
  'barber-booking': {
    'Barber Shop': ['barber shop', 'barber', 'salon', 'main', 'default', 'stage 1', 'chair 1', 'chair a', 'seat 1', 'station 1'],
    'Chair 2': ['chair 2', 'chair b', 'barber chair 2', 'stage 2', 'seat 2', 'station 2'],
    'Chair 3': ['chair 3', 'chair c', 'barber chair 3', 'stage 3', 'seat 3', 'station 3'],
  },
  'cinema': {
    'Cinema Hall': ['cinema hall', 'cinema', 'screening room', 'hall 1', 'screen 1', 'screen a', 'main screen', 'main', 'default', 'theater 1'],
    'Screen 2': ['screen 2', 'screen b', 'cinema hall 2', 'screening room 2', 'hall 2', 'theater 2'],
    'Screen 3': ['screen 3', 'screen c', 'cinema hall 3', 'screening room 3', 'hall 3', 'theater 3'],
  },
  'cricket-ground': {
    'Stage 1 Cricket Ground': [
      'stage 1 cricket ground',
      'stage 1',
      'stg 1',
      'cg-1',
      'cg 1',
      'pitch 1',
      'ground 1',
      'turf pitch 1',
      'main ground',
    ],
    'Stage 2 Cricket Ground': [
      'stage 2 cricket ground',
      'stage 2',
      'stg 2',
      'cg-2',
      'cg 2',
      'pitch 2',
      'ground 2',
      'turf pitch 2',
    ],
    'Stage 3 Cricket Ground': [
      'stage 3 cricket ground',
      'stage 3',
      'stg 3',
      'cg-3',
      'cg 3',
      'pitch 3',
      'ground 3',
    ],
  },
  'football-ground': {
    'Stage 3 Football Ground': [
      'stage 3 football ground',
      'stage 3',
      'stg 3',
      'fg-1',
      'fg 1',
      'football field',
      'turf field',
      'main football',
      'football pitch 1',
      'pitch 1',
      'main',
      'default',
    ],
    'Football Pitch 2': [
      'football pitch 2',
      'pitch 2',
      'fg-2',
      'fg 2',
      'football field 2',
    ],
  },
  'multipurpose-room': {
    'Stage 1 Multipurpose Room 5': [
      'stage 1 multipurpose room 5',
      'multipurpose room 5',
      'room 5',
      'rm 5',
      'rm-5',
      'mr-5',
      'mr 5',
      'hall 5',
    ],
    'Stage 1 Multipurpose Room 6': [
      'stage 1 multipurpose room 6',
      'multipurpose room 6',
      'room 6',
      'rm 6',
      'rm-6',
      'mr-6',
      'mr 6',
      'hall 6',
    ],
    'Stage 1 Multipurpose Room 7': [
      'stage 1 multipurpose room 7',
      'multipurpose room 7',
      'room 7',
      'rm 7',
      'rm-7',
      'mr-7',
      'mr 7',
      'hall 7',
    ],
  },
  'tennis-court': {
    'Area 7 Tennis Court': [
      'area 7 tennis court',
      'tennis court',
      'court 1',
      'court a',
      'tennis',
      'tennis court 1',
      'main',
      'default',
    ],
    'Tennis Court 2': [
      'tennis court 2',
      'court 2',
      'court b',
      'tennis 2',
    ],
  },
  'cricket-net': {
    'Area 7 Cricket Net': [
      'area 7 cricket net',
      'cricket net',
      'net 1',
      'net a',
      'batting net',
      'batting net 1',
      'net',
      'main',
      'default',
    ],
    'Cricket Net 2': [
      'cricket net 2',
      'net 2',
      'net b',
      'batting net 2',
    ],
  },
  'basketball-court': {
    'Area 8 Basket Ball Court': [
      'area 8 basket ball court',
      'area 8 basketball court',
      'basketball court',
      'court 1',
      'court a',
      'basketball',
      'main',
      'default',
    ],
    'Basketball Court 2': [
      'basketball court 2',
      'court 2',
      'court b',
      'basketball 2',
    ],
  },
};

/**
 * Resolves a given stage string to its canonical resource name within a specific facility
 */
export function getCanonicalResourceName(facilityId: string, stageInput?: string): string {
  const facId = (facilityId || '').toLowerCase().trim();
  const raw = cleanResourceString(stageInput);

  if (!raw || raw === 'all' || raw === 'all stages' || raw === 'all areas' || raw === 'all rooms') {
    return 'ALL';
  }

  // Facility-specific alias matching
  const aliasGroup = FACILITY_RESOURCE_ALIASES[facId];
  if (aliasGroup) {
    // 1. Direct canonical name exact match first
    for (const canonicalName of Object.keys(aliasGroup)) {
      if (cleanResourceString(canonicalName) === raw) {
        return canonicalName;
      }
    }
    // 2. Exact alias match
    for (const [canonicalName, aliases] of Object.entries(aliasGroup)) {
      if (aliases.includes(raw)) {
        return canonicalName;
      }
    }
    // 3. Substring/word alias match (longest alias first for precision)
    const sortedEntries = Object.entries(aliasGroup).map(([can, aliases]) => ({
      can,
      aliases: [...aliases].sort((a, b) => b.length - a.length),
    }));
    for (const { can, aliases } of sortedEntries) {
      for (const alias of aliases) {
        const regex = new RegExp(`(^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|$)`, 'i');
        if (regex.test(raw)) {
          return can;
        }
      }
    }
  }

  // Isolation Room canonical resolution
  if (facId === 'isolation-room' || raw.includes('room r-') || raw.includes('room b-') || raw.includes('building r') || raw.includes('building b')) {
    const alphaMatch = raw.match(/([rb])[\s\-_]*0?([0-9]{1,2})/i);
    if (alphaMatch) {
      const bldg = alphaMatch[1].toUpperCase();
      const num = parseInt(alphaMatch[2], 10).toString().padStart(2, '0');
      return `Room ${bldg}-${num}`;
    }
    if (raw.includes('building r') || raw.includes('rooms r-')) return 'Building R';
    if (raw.includes('building b') || raw.includes('rooms b-')) return 'Building B';
  }

  // Fallback to configured facility stages
  const facility = FACILITIES.find((f) => f.id === facId);
  if (facility && facility.stages && facility.stages.length > 0) {
    const matched = facility.stages.find((st) => cleanResourceString(st) === raw);
    if (matched) return matched;
    // If facility has only 1 stage and input is empty/default
    if (facility.stages.length === 1 && (!raw || raw === 'default' || raw === 'main')) {
      return facility.stages[0];
    }
  }

  return stageInput?.trim() || 'Stage 1';
}

/**
 * Extracts the physical resource category (chair, screen, court, net, field, room, stage)
 */
function getResourceCategory(s: string): string | null {
  if (/\b(chair|barber|salon|seat|station)\b/i.test(s)) return 'chair';
  if (/\b(screen|cinema|screening|theater|movie)\b/i.test(s)) return 'screen';
  if (/\b(court|tennis|basketball)\b/i.test(s)) return 'court';
  if (/\b(net|batting)\b/i.test(s)) return 'net';
  if (/\b(pitch|football|ground|turf|stadium)\b/i.test(s)) return 'field';
  if (/\b(room|rm|hall|iso|quarantine|building)\b/i.test(s)) return 'room';
  if (/\bstage\b/i.test(s)) return 'stage';
  return null;
}

/**
 * Canonical resource matching: Determines whether two resource/stage strings refer to the same resource.
 * Facility-aware: ensures "Chair 1" in Barbershop never matches "Screen 1" in Cinema,
 * and "Stage 1" vs "Stage 2" in Cricket Ground or "Room 5" vs "Room 6" in Multipurpose Room NEVER match.
 * Prevents blindly equating "Stage 1", "Court A", "Screen 1", and "Chair 1".
 */
export function isResourceOrStageMatch(
  bookingStage?: string,
  selectedStage?: string,
  facilityOrId?: Facility | string
): boolean {
  if (!selectedStage || !bookingStage) return true;

  const bs = cleanResourceString(bookingStage);
  const ss = cleanResourceString(selectedStage);

  if (bs === ss) return true;

  // Wildcards and "all" stages match everything within the facility
  if (
    bs === '' || bs === 'default' || bs === 'main' || bs === 'n/a' || bs === 'all' || bs === 'general' ||
    ss === '' || ss === 'default' || ss === 'main' || ss === 'n/a' || ss === 'all' || ss === 'general' ||
    ss.includes('all buildings') || ss.includes('all rooms') || ss.includes('all stages') || ss.includes('all areas') ||
    bs.includes('all buildings') || bs.includes('all rooms') || bs.includes('all stages') || bs.includes('all areas')
  ) {
    return true;
  }

  const facilityId = typeof facilityOrId === 'string'
    ? facilityOrId
    : facilityOrId?.id || '';

  // 1. Facility-Aware Canonical Resolution (First and authoritative when facility is known)
  if (facilityId) {
    const canBooking = getCanonicalResourceName(facilityId, bookingStage);
    const canSelected = getCanonicalResourceName(facilityId, selectedStage);
    if (canBooking && canSelected && canBooking !== 'ALL' && canSelected !== 'ALL') {
      const aliasGroup = FACILITY_RESOURCE_ALIASES[facilityId];
      const isKnownInAliases = Boolean(aliasGroup && (aliasGroup[canBooking] || aliasGroup[canSelected]));
      const facilityObj = typeof facilityOrId === 'object' && facilityOrId ? facilityOrId : FACILITIES.find((f) => f.id === facilityId);
      const facilityStages = facilityObj?.stages || [];
      const isKnownInStages = facilityStages.includes(canBooking) || facilityStages.includes(canSelected);

      if (isKnownInAliases || isKnownInStages) {
        return canBooking === canSelected;
      }
    }
  }

  // 2. Cross-Domain Category Check:
  // If one is clearly a Chair and the other is a Court, Screen, Net, or Room, they MUST NEVER match!
  const bCat = getResourceCategory(bs);
  const sCat = getResourceCategory(ss);
  if (bCat && sCat && bCat !== sCat) {
    // Exception: Cricket Ground uses both 'stage' and 'field'/'pitch'
    const isBothCricketOrFootball = (bCat === 'stage' || bCat === 'field') && (sCat === 'stage' || sCat === 'field');
    if (!isBothCricketOrFootball) {
      return false;
    }
  }

  // 3. Multipurpose Room Disambiguation (Room 5 vs Room 6 vs Room 7 must NEVER collide)
  const isMultipurpose = facilityId === 'multipurpose-room' || bs.includes('multipurpose') || ss.includes('multipurpose') || bs.includes('room 5') || bs.includes('room 6') || ss.includes('room 5') || ss.includes('room 6');
  if (isMultipurpose) {
    const bRoom5 = bs.includes('room 5') || bs.includes('rm 5') || bs.includes('mr 5') || bs.includes('hall 5');
    const bRoom6 = bs.includes('room 6') || bs.includes('rm 6') || bs.includes('mr 6') || bs.includes('hall 6');
    const sRoom5 = ss.includes('room 5') || ss.includes('rm 5') || ss.includes('mr 5') || ss.includes('hall 5');
    const sRoom6 = ss.includes('room 6') || ss.includes('rm 6') || ss.includes('mr 6') || ss.includes('hall 6');

    if ((bRoom5 && sRoom6) || (bRoom6 && sRoom5)) {
      return false;
    }
    if ((bRoom5 && sRoom5) || (bRoom6 && sRoom6)) {
      return true;
    }
  }

  // 4. Cinema Screen Disambiguation (Screen 1 vs Screen 2 must NEVER collide)
  const isCinema = facilityId === 'cinema' || bs.includes('cinema') || ss.includes('cinema');
  if (isCinema) {
    const bScr1 = bs.includes('screen 1') || bs.includes('screen a') || bs.includes('hall 1');
    const bScr2 = bs.includes('screen 2') || bs.includes('screen b') || bs.includes('hall 2');
    const sScr1 = ss.includes('screen 1') || ss.includes('screen a') || ss.includes('hall 1');
    const sScr2 = ss.includes('screen 2') || ss.includes('screen b') || ss.includes('hall 2');

    if ((bScr1 && sScr2) || (bScr2 && sScr1)) {
      return false;
    }
    if ((bScr1 && sScr1) || (bScr2 && sScr2)) {
      return true;
    }
  }

  // 5. Cricket Ground Disambiguation (Stage 1 vs Stage 2 must NEVER collide)
  const isCricketGround = facilityId === 'cricket-ground' || bs.includes('cricket ground') || ss.includes('cricket ground');
  if (isCricketGround && !bs.includes('net') && !ss.includes('net')) {
    const bStg1 = bs.includes('stage 1') || bs.includes('pitch 1') || bs.includes('ground 1') || bs.includes('cg 1');
    const bStg2 = bs.includes('stage 2') || bs.includes('pitch 2') || bs.includes('ground 2') || bs.includes('cg 2');
    const sStg1 = ss.includes('stage 1') || ss.includes('pitch 1') || ss.includes('ground 1') || ss.includes('cg 1');
    const sStg2 = ss.includes('stage 2') || ss.includes('pitch 2') || ss.includes('ground 2') || ss.includes('cg 2');

    if ((bStg1 && sStg2) || (bStg2 && sStg1)) {
      return false;
    }
    if ((bStg1 && sStg1) || (bStg2 && sStg2)) {
      return true;
    }
  }

  // 6. Barbershop Disambiguation (Chair 1 vs Chair 2)
  const isBarber = facilityId === 'barber-booking' || bs.includes('barber') || ss.includes('barber');
  if (isBarber) {
    const bCh1 = bs.includes('chair 1') || bs.includes('chair a') || bs === 'chair 1';
    const bCh2 = bs.includes('chair 2') || bs.includes('chair b') || bs === 'chair 2';
    const sCh1 = ss.includes('chair 1') || ss.includes('chair a') || ss === 'chair 1';
    const sCh2 = ss.includes('chair 2') || ss.includes('chair b') || ss === 'chair 2';

    if ((bCh1 && sCh2) || (bCh2 && sCh1)) {
      return false;
    }
    if ((bCh1 && sCh1) || (bCh2 && sCh2)) {
      return true;
    }
    // If standard "Barber Shop" is selected and booking has generic stage, match
    if ((bs === 'barber shop' || ss === 'barber shop') && !bCh2 && !sCh2) {
      return true;
    }
  }

  // 7. Tennis Court Disambiguation (Court 1 vs Court 2)
  const isTennis = facilityId === 'tennis-court' || bs.includes('tennis') || ss.includes('tennis');
  if (isTennis) {
    const bCt1 = bs.includes('court 1') || bs.includes('court a') || bs.includes('court 01');
    const bCt2 = bs.includes('court 2') || bs.includes('court b') || bs.includes('court 02');
    const sCt1 = ss.includes('court 1') || ss.includes('court a') || ss.includes('court 01');
    const sCt2 = ss.includes('court 2') || ss.includes('court b') || ss.includes('court 02');

    if ((bCt1 && sCt2) || (bCt2 && sCt1)) {
      return false;
    }
    if ((bCt1 && sCt1) || (bCt2 && sCt2)) {
      return true;
    }
  }

  // 8. Cricket Net Disambiguation (Net 1 vs Net 2)
  const isNet = facilityId === 'cricket-net' || bs.includes('net') || ss.includes('net');
  if (isNet) {
    const bNet1 = bs.includes('net 1') || bs.includes('net a');
    const bNet2 = bs.includes('net 2') || bs.includes('net b');
    const sNet1 = ss.includes('net 1') || ss.includes('net a');
    const sNet2 = ss.includes('net 2') || ss.includes('net b');

    if ((bNet1 && sNet2) || (bNet2 && sNet1)) {
      return false;
    }
    if ((bNet1 && sNet1) || (bNet2 && sNet2)) {
      return true;
    }
  }

  // 9. Isolation Room Alphanumeric Matching (R-01 vs R-02, Building R vs Building B)
  const isIsolation = facilityId === 'isolation-room' || bs.includes('room') || ss.includes('building');
  if (isIsolation) {
    const bAlpha = bs.match(/(?:room\s*)?([rb])[\s\-_]*0?([0-9]{1,2})/i);
    const sAlpha = ss.match(/(?:room\s*)?([rb])[\s\-_]*0?([0-9]{1,2})/i);

    const sHasBldgR = ss.includes('building r') || ss.includes('rooms r');
    const sHasBldgB = ss.includes('building b') || ss.includes('rooms b');

    if (sHasBldgR && !sHasBldgB) {
      if (bAlpha) return bAlpha[1].toLowerCase() === 'r';
      if (bs.includes('building r') || bs.includes('room r')) return true;
      if (bs.includes('building b') || bs.includes('room b')) return false;
    }
    if (sHasBldgB && !sHasBldgR) {
      if (bAlpha) return bAlpha[1].toLowerCase() === 'b';
      if (bs.includes('building b') || bs.includes('room b')) return true;
      if (bs.includes('building r') || bs.includes('room r')) return false;
    }

    if (bAlpha && sAlpha) {
      const bBldg = bAlpha[1].toLowerCase();
      const sBldg = sAlpha[1].toLowerCase();
      const bNum = parseInt(bAlpha[2], 10);
      const sNum = parseInt(sAlpha[2], 10);
      return bBldg === sBldg && bNum === sNum;
    }
  }

  // 10. Generic Stage numbers: Stage 1 vs Stage 2
  const bStageNum = bs.match(/stage\s*([0-9]+)/i);
  const sStageNum = ss.match(/stage\s*([0-9]+)/i);
  if (bStageNum && sStageNum) {
    if (bStageNum[1] !== sStageNum[1]) {
      return false;
    }
    return true;
  }

  // 11. Word boundary regex match
  const escapedSs = ss.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedBs = bs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ssWordRegex = new RegExp(`(?:^|\\b)${escapedSs}(?:\\b|$)`, 'i');
  const bsWordRegex = new RegExp(`(?:^|\\b)${escapedBs}(?:\\b|$)`, 'i');
  if (ssWordRegex.test(bs) || bsWordRegex.test(ss)) {
    return true;
  }

  return false;
}


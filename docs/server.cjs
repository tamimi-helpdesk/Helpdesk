var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  AsyncMutex: () => AsyncMutex,
  app: () => app,
  checkServerBookingConflict: () => checkServerBookingConflict,
  createTestSession: () => createTestSession,
  doPersistHubState: () => doPersistHubState,
  doTimeRangesOverlap: () => doTimeRangesOverlap,
  hubState: () => hubState,
  loadServerSessions: () => loadServerSessions,
  logServerSecurity: () => logServerSecurity,
  markHubStateDirty: () => markHubStateDirty,
  mutationMutex: () => mutationMutex,
  persistHubState: () => persistHubState,
  persistServerSessions: () => persistServerSessions,
  reconcileServerIsolationRooms: () => reconcileServerIsolationRooms,
  requireAuth: () => requireAuth,
  resolveServerFacilityId: () => resolveServerFacilityId,
  serverAuditLogs: () => serverAuditLogs,
  serverIsolationHistory: () => serverIsolationHistory,
  serverSessions: () => serverSessions,
  signSessionToken: () => signSessionToken,
  verifyServerSession: () => verifyServerSession,
  verifySignedToken: () => verifySignedToken
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_exceljs = __toESM(require("exceljs"), 1);
var XLSX = __toESM(require("xlsx"), 1);
var import_jszip = __toESM(require("jszip"), 1);
var import_vite = require("vite");
var import_crypto = __toESM(require("crypto"), 1);

// src/data/facilities.ts
var FACILITIES = [
  {
    id: "barber-booking",
    name: "Barber Booking",
    shortName: "Barber",
    code: "BB",
    stageName: "Barber Shop",
    sheetTabName: "Barber Booking",
    icon: "Scissors",
    description: "Haircut, beard trimming, and salon services.",
    stages: ["Barber Shop"],
    defaultSlotDurationMinutes: 30,
    openTime: "11:00",
    closeTime: "22:30",
    breaks: [
      { start: "12:00", end: "13:00", label: "Break (12:00 PM \u2013 1:00 PM)" },
      { start: "18:30", end: "19:30", label: "Break (6:30 PM \u2013 7:30 PM)" }
    ],
    capacityPerSlot: 1,
    amenities: ["Haircut", "Beard Trim", "Shave", "Head Massage"],
    rules: ["Please arrive on time", "Cancel at least 1 hour in advance if unable to attend"],
    accentColor: "indigo"
  },
  {
    id: "cricket-ground",
    name: "Cricket Ground",
    shortName: "Cricket Ground",
    code: "CG",
    stageName: "Stage 1, Stage 2",
    sheetTabName: "Cricket Ground",
    icon: "Activity",
    description: "Natural turf cricket ground with pavilion and lighting.",
    stages: ["Stage 1 Cricket Ground", "Stage 2 Cricket Ground"],
    defaultSlotDurationMinutes: 60,
    openTime: "07:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 30,
    amenities: ["Turf Pitch", "Scoreboard", "Pavilion", "Floodlights"],
    rules: ["Sports shoes required", "Report any equipment damage to staff"],
    accentColor: "emerald"
  },
  {
    id: "football-ground",
    name: "Football Ground",
    shortName: "Football Ground",
    code: "FG",
    stageName: "Stage 3 Football Ground",
    sheetTabName: "Football Ground",
    icon: "Shield",
    description: "Turf football ground for practice and matches.",
    stages: ["Stage 3 Football Ground"],
    defaultSlotDurationMinutes: 60,
    openTime: "09:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 24,
    amenities: ["Turf Field", "Goal Posts", "Dressing Rooms", "Floodlights"],
    rules: ["Turf shoes or trainers only (no metal studs)", "Respect allocated time limits"],
    accentColor: "blue"
  },
  {
    id: "multipurpose-room",
    name: "Multipurpose Room",
    shortName: "Multipurpose Room",
    code: "MR",
    stageName: "Stage 1 Multipurpose Room 5, Room 6",
    sheetTabName: "Multipurpose Room",
    icon: "Building2",
    description: "Hall for meetings, workshops, seminars, and events.",
    stages: ["Stage 1 Multipurpose Room 5", "Stage 1 Multipurpose Room 6"],
    defaultSlotDurationMinutes: 60,
    openTime: "08:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 50,
    amenities: ["Projector", "Microphones", "Seating", "Sound System"],
    rules: ["Reset seating arrangement after use", "Keep the room clean"],
    accentColor: "indigo"
  },
  {
    id: "ticket-management",
    name: "Ticket & Work Order",
    shortName: "Ticket & Work Order",
    code: "TKT",
    stageName: "Amaala Village Work Orders",
    sheetTabName: "Ticket Management",
    icon: "Ticket",
    description: "Stages 1-3 VIP & Workers Cluster defect tracking, technician dispatch & SLA compliance.",
    stages: ["Amaala Village Ticket & Work Order"],
    defaultSlotDurationMinutes: 60,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 100,
    amenities: ["Village Heatmap Matrix", "P1-P4 SLA Targets", "Technician Dispatch", "Printable Work Slips", "Material Requisition"],
    rules: ["Emergency P1 defects require immediate phone dispatch", "Client digital sign-off mandatory on closure"],
    accentColor: "blue"
  },
  {
    id: "cinema",
    name: "Cinema",
    shortName: "Cinema",
    code: "CN",
    stageName: "Cinema Hall",
    sheetTabName: "Cinema",
    icon: "Film",
    description: "Screening room with surround sound and projector.",
    stages: ["Cinema Hall"],
    defaultSlotDurationMinutes: 120,
    openTime: "09:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 40,
    amenities: ["Laser Projection", "Surround Sound", "Seating", "Air Conditioning"],
    rules: ["Silence mobile phones during screening", "Keep hall clean"],
    accentColor: "rose"
  },
  {
    id: "tennis-court",
    name: "Tennis Court",
    shortName: "Tennis Court",
    code: "TC",
    stageName: "Area 7 Tennis Court",
    sheetTabName: "Tennis Court",
    icon: "Dumbbell",
    description: "Hard surface tennis court with floodlights.",
    stages: ["Area 7 Tennis Court"],
    defaultSlotDurationMinutes: 60,
    openTime: "07:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 6,
    amenities: ["Hard Court", "Net", "Floodlights", "Seating"],
    rules: ["Non-marking tennis shoes required", "Maximum 4 players per court"],
    accentColor: "teal"
  },
  {
    id: "cricket-net",
    name: "Cricket Net",
    shortName: "Cricket Net",
    code: "CNET",
    stageName: "Area 7 Cricket Net",
    sheetTabName: "Cricket Net",
    icon: "Target",
    description: "Enclosed batting practice nets with bowling machine.",
    stages: ["Area 7 Cricket Net"],
    defaultSlotDurationMinutes: 60,
    openTime: "07:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 6,
    amenities: ["Batting Net", "Turf Mat", "Bowling Machine", "Protective Gear"],
    rules: ["Helmets required inside the net", "Follow safety guidelines"],
    accentColor: "cyan"
  },
  {
    id: "basketball-court",
    name: "Basket Ball Court",
    shortName: "Basketball Court",
    code: "BC",
    stageName: "Area 8 Basket Ball Court",
    sheetTabName: "Basket Ball Court",
    icon: "Trophy",
    description: "Basketball court with standard hoops and markings.",
    stages: ["Area 8 Basket Ball Court"],
    defaultSlotDurationMinutes: 60,
    openTime: "07:00",
    closeTime: "23:00",
    breaks: [],
    capacityPerSlot: 15,
    amenities: ["Basketball Hoops", "Hardwood Surface", "Scoreboard", "Lighting"],
    rules: ["Non-marking sneakers required", "No hanging on rims"],
    accentColor: "orange"
  },
  {
    id: "sla-management",
    name: "SLA Management",
    shortName: "SLA Mgmt",
    code: "SLA",
    stageName: "SLA Tracking & Compliance Desk",
    sheetTabName: "SLA Management",
    icon: "ClockCheck",
    description: "Service level agreements, response deadline tracking, and compliance metrics.",
    stages: ["SLA Compliance Center"],
    defaultSlotDurationMinutes: 60,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 50,
    amenities: ["Breach Alerts", "Turnaround Timers", "Response Escalations", "Compliance Reports"],
    rules: ["Adhere strictly to agreed target hours", "Escalated items notify shift supervisor"],
    accentColor: "purple"
  },
  {
    id: "isolation-room",
    name: "Isolation Tracker",
    shortName: "Isolation Tracker",
    code: "ROOM",
    stageName: "Building R & Building B (12 Rooms)",
    sheetTabName: "Isolation & Room Booking",
    icon: "Building2",
    description: "Room and bed tracking for accommodation and isolation (2 beds per room).",
    stages: ["All Buildings & Rooms", "Building R (Rooms R-01 to R-06)", "Building B (Rooms B-01 to B-06)"],
    defaultSlotDurationMinutes: 1440,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 2,
    amenities: ["2 Beds per Room", "Ensuite Bathroom", "Air Conditioning", "Key Card Access"],
    rules: ["Valid ID required on check-in", "Quiet hours 23:00 \u2013 06:00"],
    accentColor: "purple"
  },
  {
    id: "handover-takenover",
    name: "Handover & Takenover",
    shortName: "Handover & Takenover",
    code: "HOTO",
    stageName: "Handover & Takenover Desk",
    sheetTabName: "Handover & Takenover",
    icon: "ArrowLeftRight",
    description: "Asset borrowing, key loans, and duty shift handover registry.",
    stages: ["Handover & Takenover Desk"],
    defaultSlotDurationMinutes: 60,
    openTime: "08:00",
    closeTime: "22:00",
    breaks: [],
    capacityPerSlot: 10,
    amenities: ["Key Registry", "Item Loan Log", "Custody Locker", "Receipt Record"],
    rules: ["ID or badge required for asset checkout", "Return items on or before due date"],
    accentColor: "cyan"
  },
  {
    id: "parcel-monitoring",
    name: "Parcel Monitoring",
    shortName: "Parcel Monitoring",
    code: "PRCL",
    stageName: "Parcel Desk",
    sheetTabName: "Parcel Monitoring",
    icon: "Package",
    description: "Inbound courier package logging and collection tracking.",
    stages: ["Parcel Desk"],
    defaultSlotDurationMinutes: 60,
    openTime: "08:00",
    closeTime: "22:00",
    breaks: [],
    capacityPerSlot: 20,
    amenities: ["Package Log", "Storage Shelves", "Collection Sign-off"],
    rules: ["Provide recipient name or unit number for collection"],
    accentColor: "amber"
  },
  {
    id: "lost-and-found",
    name: "Lost & Found",
    shortName: "Lost & Found",
    code: "LNFD",
    stageName: "Lost & Found Desk",
    sheetTabName: "Lost & Found",
    icon: "Search",
    description: "Found article logging and claim retrieval.",
    stages: ["Lost & Found Desk"],
    defaultSlotDurationMinutes: 60,
    openTime: "08:00",
    closeTime: "20:00",
    breaks: [],
    capacityPerSlot: 10,
    amenities: ["Item Storage", "Verification Register", "Claim Receipt"],
    rules: ["Provide valid ID and item description to claim property"],
    accentColor: "emerald"
  },
  {
    id: "automated-workflow",
    name: "Automated Workflow",
    shortName: "Workflow",
    code: "AUTO",
    stageName: "Workflow & Automation Control",
    sheetTabName: "Automated Workflow",
    icon: "GitBranch",
    description: "Smart triggers, automated dispatch rules, and multi-stage workflow pipeline.",
    stages: ["Workflow Automation Engine"],
    defaultSlotDurationMinutes: 60,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 50,
    amenities: ["Event Triggers", "Condition Filters", "Instant Webhooks", "Execution Logs"],
    rules: ["Verify flow dependencies before activation", "Audit logs retained for 90 days"],
    accentColor: "cyan"
  },
  {
    id: "blank-forms",
    name: "Blank Forms",
    shortName: "Blank Forms",
    code: "FORM",
    stageName: "Facility Forms & Requisition Desk",
    sheetTabName: "Blank Forms",
    icon: "FileText",
    description: "Download, print, and submit facility request & clearance blank forms.",
    stages: ["Blank Forms Center"],
    defaultSlotDurationMinutes: 60,
    openTime: "08:00",
    closeTime: "22:00",
    breaks: [],
    capacityPerSlot: 20,
    amenities: ["Printable PDF Templates", "Requisition Forms", "Clearance Slips", "Digital Sign-off"],
    rules: ["Submit completed forms to the duty desk", "Authorized signatures required"],
    accentColor: "blue"
  },
  {
    id: "invoice-manager",
    name: "Invoice Manager",
    shortName: "Invoice Manager",
    code: "INVC",
    stageName: "Billing & Invoicing Desk",
    sheetTabName: "Invoice Manager",
    icon: "Receipt",
    description: "Facility billing, receipt generation, and payment transaction manager.",
    stages: ["Invoice & Billing Desk"],
    defaultSlotDurationMinutes: 60,
    openTime: "08:00",
    closeTime: "22:00",
    breaks: [],
    capacityPerSlot: 15,
    amenities: ["Thermal Receipts", "Official Tax Invoices", "Payment Records", "QR Verification"],
    rules: ["Always issue official receipt for transactions", "Keep billing records for audit"],
    accentColor: "emerald"
  },
  {
    id: "announcement-notice",
    name: "Announcement & Notice",
    shortName: "Announcement & Notice",
    code: "NOTC",
    stageName: "Official Bulletin & Broadcast Board",
    sheetTabName: "Announcement & Notice",
    icon: "Megaphone",
    description: "Broadcast notices, facility maintenance alerts, and official bulletins.",
    stages: ["Official Notice Board"],
    defaultSlotDurationMinutes: 60,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 50,
    amenities: ["Live Bulletins", "Priority Broadcasts", "Printable Notice Posters", "Maintenance Alerts"],
    rules: ["Only authorized operators can publish notices", "Verify information before broadcast"],
    accentColor: "amber"
  },
  {
    id: "help-support",
    name: "Help & Support",
    shortName: "Help & Support",
    code: "HELP",
    stageName: "24/7 Helpdesk & Support Center",
    sheetTabName: "Help & Support",
    icon: "LifeBuoy",
    description: "24/7 Facility helpdesk assistance, emergency hotline, and ticket support.",
    stages: ["24/7 Helpdesk Desk"],
    defaultSlotDurationMinutes: 60,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 25,
    amenities: ["Support Ticket Tracking", "Emergency Hotline", "Help Center FAQ", "Direct WhatsApp Escalation"],
    rules: ["For emergency incidents, call the direct hotline immediately", "Ticket resolution SLA is 24 hours"],
    accentColor: "teal"
  },
  {
    id: "email-management",
    name: "Email Management",
    shortName: "Email Mgmt",
    code: "MAIL",
    stageName: "Enterprise Email & Broadcast Gateway",
    sheetTabName: "Email Management",
    icon: "Mail",
    description: "Automated guest notifications, facility email dispatch, and campaign templates.",
    stages: ["Email Dispatch Center"],
    defaultSlotDurationMinutes: 60,
    openTime: "00:00",
    closeTime: "23:59",
    breaks: [],
    capacityPerSlot: 50,
    amenities: ["Template Builder", "SMTP Logs", "Delivery Tracking", "Batch Notification"],
    rules: ["Adhere to official communication guidelines", "Test email templates before batch broadcast"],
    accentColor: "rose"
  }
];

// src/utils/resourceMatching.ts
function cleanResourceString(val) {
  if (val === null || val === void 0) return "";
  return String(val).toLowerCase().trim().replace(/[\s\-_]+/g, " ");
}
var FACILITY_RESOURCE_ALIASES = {
  "barber-booking": {
    "Barber Shop": ["barber shop", "barber", "salon", "main", "default", "stage 1", "chair 1", "chair a", "seat 1", "station 1"],
    "Chair 2": ["chair 2", "chair b", "barber chair 2", "stage 2", "seat 2", "station 2"],
    "Chair 3": ["chair 3", "chair c", "barber chair 3", "stage 3", "seat 3", "station 3"]
  },
  "cinema": {
    "Cinema Hall": ["cinema hall", "cinema", "screening room", "hall 1", "screen 1", "screen a", "main screen", "main", "default", "theater 1"],
    "Screen 2": ["screen 2", "screen b", "cinema hall 2", "screening room 2", "hall 2", "theater 2"],
    "Screen 3": ["screen 3", "screen c", "cinema hall 3", "screening room 3", "hall 3", "theater 3"]
  },
  "cricket-ground": {
    "Stage 1 Cricket Ground": [
      "stage 1 cricket ground",
      "stage 1",
      "stg 1",
      "cg-1",
      "cg 1",
      "pitch 1",
      "ground 1",
      "turf pitch 1",
      "main ground"
    ],
    "Stage 2 Cricket Ground": [
      "stage 2 cricket ground",
      "stage 2",
      "stg 2",
      "cg-2",
      "cg 2",
      "pitch 2",
      "ground 2",
      "turf pitch 2"
    ],
    "Stage 3 Cricket Ground": [
      "stage 3 cricket ground",
      "stage 3",
      "stg 3",
      "cg-3",
      "cg 3",
      "pitch 3",
      "ground 3"
    ]
  },
  "football-ground": {
    "Stage 3 Football Ground": [
      "stage 3 football ground",
      "stage 3",
      "stg 3",
      "fg-1",
      "fg 1",
      "football field",
      "turf field",
      "main football",
      "football pitch 1",
      "pitch 1",
      "main",
      "default"
    ],
    "Football Pitch 2": [
      "football pitch 2",
      "pitch 2",
      "fg-2",
      "fg 2",
      "football field 2"
    ]
  },
  "multipurpose-room": {
    "Stage 1 Multipurpose Room 5": [
      "stage 1 multipurpose room 5",
      "multipurpose room 5",
      "room 5",
      "rm 5",
      "rm-5",
      "mr-5",
      "mr 5",
      "hall 5"
    ],
    "Stage 1 Multipurpose Room 6": [
      "stage 1 multipurpose room 6",
      "multipurpose room 6",
      "room 6",
      "rm 6",
      "rm-6",
      "mr-6",
      "mr 6",
      "hall 6"
    ],
    "Stage 1 Multipurpose Room 7": [
      "stage 1 multipurpose room 7",
      "multipurpose room 7",
      "room 7",
      "rm 7",
      "rm-7",
      "mr-7",
      "mr 7",
      "hall 7"
    ]
  },
  "tennis-court": {
    "Area 7 Tennis Court": [
      "area 7 tennis court",
      "tennis court",
      "court 1",
      "court a",
      "tennis",
      "tennis court 1",
      "main",
      "default"
    ],
    "Tennis Court 2": [
      "tennis court 2",
      "court 2",
      "court b",
      "tennis 2"
    ]
  },
  "cricket-net": {
    "Area 7 Cricket Net": [
      "area 7 cricket net",
      "cricket net",
      "net 1",
      "net a",
      "batting net",
      "batting net 1",
      "net",
      "main",
      "default"
    ],
    "Cricket Net 2": [
      "cricket net 2",
      "net 2",
      "net b",
      "batting net 2"
    ]
  },
  "basketball-court": {
    "Area 8 Basket Ball Court": [
      "area 8 basket ball court",
      "area 8 basketball court",
      "basketball court",
      "court 1",
      "court a",
      "basketball",
      "main",
      "default"
    ],
    "Basketball Court 2": [
      "basketball court 2",
      "court 2",
      "court b",
      "basketball 2"
    ]
  }
};
function getCanonicalResourceName(facilityId, stageInput) {
  const facId = (facilityId || "").toLowerCase().trim();
  const raw = cleanResourceString(stageInput);
  if (!raw || raw === "all" || raw === "all stages" || raw === "all areas" || raw === "all rooms") {
    return "ALL";
  }
  const aliasGroup = FACILITY_RESOURCE_ALIASES[facId];
  if (aliasGroup) {
    for (const canonicalName of Object.keys(aliasGroup)) {
      if (cleanResourceString(canonicalName) === raw) {
        return canonicalName;
      }
    }
    for (const [canonicalName, aliases] of Object.entries(aliasGroup)) {
      if (aliases.includes(raw)) {
        return canonicalName;
      }
    }
    const sortedEntries = Object.entries(aliasGroup).map(([can, aliases]) => ({
      can,
      aliases: [...aliases].sort((a, b) => b.length - a.length)
    }));
    for (const { can, aliases } of sortedEntries) {
      for (const alias of aliases) {
        const regex = new RegExp(`(^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\b|$)`, "i");
        if (regex.test(raw)) {
          return can;
        }
      }
    }
  }
  if (facId === "isolation-room" || raw.includes("room r-") || raw.includes("room b-") || raw.includes("building r") || raw.includes("building b")) {
    const alphaMatch = raw.match(/([rb])[\s\-_]*0?([0-9]{1,2})/i);
    if (alphaMatch) {
      const bldg = alphaMatch[1].toUpperCase();
      const num = parseInt(alphaMatch[2], 10).toString().padStart(2, "0");
      return `Room ${bldg}-${num}`;
    }
    if (raw.includes("building r") || raw.includes("rooms r-")) return "Building R";
    if (raw.includes("building b") || raw.includes("rooms b-")) return "Building B";
  }
  const facility = FACILITIES.find((f) => f.id === facId);
  if (facility && facility.stages && facility.stages.length > 0) {
    const matched = facility.stages.find((st) => cleanResourceString(st) === raw);
    if (matched) return matched;
    if (facility.stages.length === 1 && (!raw || raw === "default" || raw === "main")) {
      return facility.stages[0];
    }
  }
  return stageInput?.trim() || "Stage 1";
}
function getResourceCategory(s) {
  if (/\b(chair|barber|salon|seat|station)\b/i.test(s)) return "chair";
  if (/\b(screen|cinema|screening|theater|movie)\b/i.test(s)) return "screen";
  if (/\b(court|tennis|basketball)\b/i.test(s)) return "court";
  if (/\b(net|batting)\b/i.test(s)) return "net";
  if (/\b(pitch|football|ground|turf|stadium)\b/i.test(s)) return "field";
  if (/\b(room|rm|hall|iso|quarantine|building)\b/i.test(s)) return "room";
  if (/\bstage\b/i.test(s)) return "stage";
  return null;
}
function isResourceOrStageMatch(bookingStage, selectedStage, facilityOrId) {
  if (!selectedStage || !bookingStage) return true;
  const bs = cleanResourceString(bookingStage);
  const ss = cleanResourceString(selectedStage);
  if (bs === ss) return true;
  if (bs === "" || bs === "default" || bs === "main" || bs === "n/a" || bs === "all" || bs === "general" || ss === "" || ss === "default" || ss === "main" || ss === "n/a" || ss === "all" || ss === "general" || ss.includes("all buildings") || ss.includes("all rooms") || ss.includes("all stages") || ss.includes("all areas") || bs.includes("all buildings") || bs.includes("all rooms") || bs.includes("all stages") || bs.includes("all areas")) {
    return true;
  }
  const facilityId = typeof facilityOrId === "string" ? facilityOrId : facilityOrId?.id || "";
  if (facilityId) {
    const canBooking = getCanonicalResourceName(facilityId, bookingStage);
    const canSelected = getCanonicalResourceName(facilityId, selectedStage);
    if (canBooking && canSelected && canBooking !== "ALL" && canSelected !== "ALL") {
      const aliasGroup = FACILITY_RESOURCE_ALIASES[facilityId];
      const isKnownInAliases = Boolean(aliasGroup && (aliasGroup[canBooking] || aliasGroup[canSelected]));
      const facilityObj = typeof facilityOrId === "object" && facilityOrId ? facilityOrId : FACILITIES.find((f) => f.id === facilityId);
      const facilityStages = facilityObj?.stages || [];
      const isKnownInStages = facilityStages.includes(canBooking) || facilityStages.includes(canSelected);
      if (isKnownInAliases || isKnownInStages) {
        return canBooking === canSelected;
      }
    }
  }
  const bCat = getResourceCategory(bs);
  const sCat = getResourceCategory(ss);
  if (bCat && sCat && bCat !== sCat) {
    const isBothCricketOrFootball = (bCat === "stage" || bCat === "field") && (sCat === "stage" || sCat === "field");
    if (!isBothCricketOrFootball) {
      return false;
    }
  }
  const isMultipurpose = facilityId === "multipurpose-room" || bs.includes("multipurpose") || ss.includes("multipurpose") || bs.includes("room 5") || bs.includes("room 6") || ss.includes("room 5") || ss.includes("room 6");
  if (isMultipurpose) {
    const bRoom5 = bs.includes("room 5") || bs.includes("rm 5") || bs.includes("mr 5") || bs.includes("hall 5");
    const bRoom6 = bs.includes("room 6") || bs.includes("rm 6") || bs.includes("mr 6") || bs.includes("hall 6");
    const sRoom5 = ss.includes("room 5") || ss.includes("rm 5") || ss.includes("mr 5") || ss.includes("hall 5");
    const sRoom6 = ss.includes("room 6") || ss.includes("rm 6") || ss.includes("mr 6") || ss.includes("hall 6");
    if (bRoom5 && sRoom6 || bRoom6 && sRoom5) {
      return false;
    }
    if (bRoom5 && sRoom5 || bRoom6 && sRoom6) {
      return true;
    }
  }
  const isCinema = facilityId === "cinema" || bs.includes("cinema") || ss.includes("cinema");
  if (isCinema) {
    const bScr1 = bs.includes("screen 1") || bs.includes("screen a") || bs.includes("hall 1");
    const bScr2 = bs.includes("screen 2") || bs.includes("screen b") || bs.includes("hall 2");
    const sScr1 = ss.includes("screen 1") || ss.includes("screen a") || ss.includes("hall 1");
    const sScr2 = ss.includes("screen 2") || ss.includes("screen b") || ss.includes("hall 2");
    if (bScr1 && sScr2 || bScr2 && sScr1) {
      return false;
    }
    if (bScr1 && sScr1 || bScr2 && sScr2) {
      return true;
    }
  }
  const isCricketGround = facilityId === "cricket-ground" || bs.includes("cricket ground") || ss.includes("cricket ground");
  if (isCricketGround && !bs.includes("net") && !ss.includes("net")) {
    const bStg1 = bs.includes("stage 1") || bs.includes("pitch 1") || bs.includes("ground 1") || bs.includes("cg 1");
    const bStg2 = bs.includes("stage 2") || bs.includes("pitch 2") || bs.includes("ground 2") || bs.includes("cg 2");
    const sStg1 = ss.includes("stage 1") || ss.includes("pitch 1") || ss.includes("ground 1") || ss.includes("cg 1");
    const sStg2 = ss.includes("stage 2") || ss.includes("pitch 2") || ss.includes("ground 2") || ss.includes("cg 2");
    if (bStg1 && sStg2 || bStg2 && sStg1) {
      return false;
    }
    if (bStg1 && sStg1 || bStg2 && sStg2) {
      return true;
    }
  }
  const isBarber = facilityId === "barber-booking" || bs.includes("barber") || ss.includes("barber");
  if (isBarber) {
    const bCh1 = bs.includes("chair 1") || bs.includes("chair a") || bs === "chair 1";
    const bCh2 = bs.includes("chair 2") || bs.includes("chair b") || bs === "chair 2";
    const sCh1 = ss.includes("chair 1") || ss.includes("chair a") || ss === "chair 1";
    const sCh2 = ss.includes("chair 2") || ss.includes("chair b") || ss === "chair 2";
    if (bCh1 && sCh2 || bCh2 && sCh1) {
      return false;
    }
    if (bCh1 && sCh1 || bCh2 && sCh2) {
      return true;
    }
    if ((bs === "barber shop" || ss === "barber shop") && !bCh2 && !sCh2) {
      return true;
    }
  }
  const isTennis = facilityId === "tennis-court" || bs.includes("tennis") || ss.includes("tennis");
  if (isTennis) {
    const bCt1 = bs.includes("court 1") || bs.includes("court a") || bs.includes("court 01");
    const bCt2 = bs.includes("court 2") || bs.includes("court b") || bs.includes("court 02");
    const sCt1 = ss.includes("court 1") || ss.includes("court a") || ss.includes("court 01");
    const sCt2 = ss.includes("court 2") || ss.includes("court b") || ss.includes("court 02");
    if (bCt1 && sCt2 || bCt2 && sCt1) {
      return false;
    }
    if (bCt1 && sCt1 || bCt2 && sCt2) {
      return true;
    }
  }
  const isNet = facilityId === "cricket-net" || bs.includes("net") || ss.includes("net");
  if (isNet) {
    const bNet1 = bs.includes("net 1") || bs.includes("net a");
    const bNet2 = bs.includes("net 2") || bs.includes("net b");
    const sNet1 = ss.includes("net 1") || ss.includes("net a");
    const sNet2 = ss.includes("net 2") || ss.includes("net b");
    if (bNet1 && sNet2 || bNet2 && sNet1) {
      return false;
    }
    if (bNet1 && sNet1 || bNet2 && sNet2) {
      return true;
    }
  }
  const isIsolation = facilityId === "isolation-room" || bs.includes("room") || ss.includes("building");
  if (isIsolation) {
    const bAlpha = bs.match(/(?:room\s*)?([rb])[\s\-_]*0?([0-9]{1,2})/i);
    const sAlpha = ss.match(/(?:room\s*)?([rb])[\s\-_]*0?([0-9]{1,2})/i);
    const sHasBldgR = ss.includes("building r") || ss.includes("rooms r");
    const sHasBldgB = ss.includes("building b") || ss.includes("rooms b");
    if (sHasBldgR && !sHasBldgB) {
      if (bAlpha) return bAlpha[1].toLowerCase() === "r";
      if (bs.includes("building r") || bs.includes("room r")) return true;
      if (bs.includes("building b") || bs.includes("room b")) return false;
    }
    if (sHasBldgB && !sHasBldgR) {
      if (bAlpha) return bAlpha[1].toLowerCase() === "b";
      if (bs.includes("building b") || bs.includes("room b")) return true;
      if (bs.includes("building r") || bs.includes("room r")) return false;
    }
    if (bAlpha && sAlpha) {
      const bBldg = bAlpha[1].toLowerCase();
      const sBldg = sAlpha[1].toLowerCase();
      const bNum = parseInt(bAlpha[2], 10);
      const sNum = parseInt(sAlpha[2], 10);
      return bBldg === sBldg && bNum === sNum;
    }
  }
  const bStageNum = bs.match(/stage\s*([0-9]+)/i);
  const sStageNum = ss.match(/stage\s*([0-9]+)/i);
  if (bStageNum && sStageNum) {
    if (bStageNum[1] !== sStageNum[1]) {
      return false;
    }
    return true;
  }
  const escapedSs = ss.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedBs = bs.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ssWordRegex = new RegExp(`(?:^|\\b)${escapedSs}(?:\\b|$)`, "i");
  const bsWordRegex = new RegExp(`(?:^|\\b)${escapedBs}(?:\\b|$)`, "i");
  if (ssWordRegex.test(bs) || bsWordRegex.test(ss)) {
    return true;
  }
  return false;
}

// server.ts
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-session-token");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const cookies = parseCookies(req.headers.cookie);
    const authHeader = req.headers.authorization;
    const xSessionToken = req.headers["x-session-token"];
    if (cookies["tamimi_session"] && !authHeader && !xSessionToken) {
      const host = req.headers.host;
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return res.status(403).json({ success: false, error: "CSRF protection: untrusted origin." });
          }
        } catch (_) {
          return res.status(403).json({ success: false, error: "CSRF protection: invalid origin." });
        }
      }
    }
  }
  next();
});
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((part) => {
    const [name, ...val] = part.trim().split("=");
    if (name) cookies[name.trim()] = decodeURIComponent(val.join("="));
  });
  return cookies;
}
var DB_FILE_PATH = import_path.default.join(process.cwd(), "tamimi_server_db.json");
var DB_HISTORY_FILE_PATH = import_path.default.join(process.cwd(), "tamimi_historical_isolation_archive.json");
try {
  const dirEntries = import_fs.default.readdirSync(process.cwd());
  for (const entry of dirEntries) {
    if (entry.startsWith("tamimi_server_db.json.tmp.") || entry.startsWith("tamimi_server_db.json.tmp.exit")) {
      try {
        import_fs.default.unlinkSync(import_path.default.join(process.cwd(), entry));
      } catch (_) {
      }
    }
  }
} catch (_) {
}
var hubState = {
  version: 1,
  lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
  deletedIds: {},
  cancelledIds: {},
  bookings: [],
  isolationRooms: [],
  handovers: [],
  parcels: [],
  lostFound: [],
  blankForms: [],
  invoices: [],
  notices: [],
  supportTickets: []
};
var serverIsolationHistory = [];
try {
  if (import_fs.default.existsSync(DB_HISTORY_FILE_PATH)) {
    const rawHist = import_fs.default.readFileSync(DB_HISTORY_FILE_PATH, "utf-8");
    const parsedHist = JSON.parse(rawHist);
    if (Array.isArray(parsedHist)) {
      serverIsolationHistory = parsedHist;
    }
  }
} catch (err) {
  console.warn("[Hub] Notice reading historical isolation archive:", err);
}
try {
  if (import_fs.default.existsSync(DB_FILE_PATH)) {
    const raw = import_fs.default.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.version === "number") {
      let loadedIsolationRooms = Array.isArray(parsed.isolationRooms) ? parsed.isolationRooms : [];
      if (Array.isArray(parsed.isolationHistory) && parsed.isolationHistory.length > 0) {
        const existingKeys = new Set(serverIsolationHistory.map((r) => r.id || `${r.buildingNumber}_${r.checkIn}`));
        parsed.isolationHistory.forEach((r) => {
          const k = r.id || `${r.buildingNumber}_${r.checkIn}`;
          if (!existingKeys.has(k)) {
            serverIsolationHistory.push(r);
            existingKeys.add(k);
          }
        });
      }
      if (loadedIsolationRooms.length > 50) {
        console.log(`[Hub] Preserving and migrating ${loadedIsolationRooms.length} isolation room records to separate archive...`);
        const existingKeys = new Set(serverIsolationHistory.map((r) => r.id || `${r.buildingNumber}_${r.checkIn}`));
        const activeRoomMap = /* @__PURE__ */ new Map();
        const isStandardRoom = (code) => /^[RB]-0?[1-9]|1[0-2]$/i.test(code);
        loadedIsolationRooms.forEach((r) => {
          if (!r) return;
          const canonical = getCanonicalServerRoomNumber(r.buildingNumber || r.id);
          const key = (canonical || r.id || r.buildingNumber || "").toUpperCase().trim();
          if (key && isStandardRoom(key)) {
            if (!activeRoomMap.has(key)) {
              activeRoomMap.set(key, r);
            } else {
              const existing = activeRoomMap.get(key);
              const existingOccCount = (existing.occupants || []).length;
              const rOccCount = (r.occupants || []).length;
              if (rOccCount > existingOccCount || !existing.lastUpdated && r.lastUpdated) {
                const archKey = existing.id || `${existing.buildingNumber}_${existing.checkIn}`;
                if (!existingKeys.has(archKey)) {
                  serverIsolationHistory.push(existing);
                  existingKeys.add(archKey);
                }
                activeRoomMap.set(key, r);
              } else {
                const archKey = r.id || `${r.buildingNumber}_${r.checkIn}`;
                if (!existingKeys.has(archKey)) {
                  serverIsolationHistory.push(r);
                  existingKeys.add(archKey);
                }
              }
            }
          } else {
            const archKey = r.id || `${r.buildingNumber}_${r.checkIn}`;
            if (!existingKeys.has(archKey)) {
              serverIsolationHistory.push(r);
              existingKeys.add(archKey);
            }
          }
        });
        loadedIsolationRooms = Array.from(activeRoomMap.values());
        try {
          import_fs.default.writeFileSync(DB_HISTORY_FILE_PATH, JSON.stringify(serverIsolationHistory), "utf-8");
          console.log(`[Hub] Successfully persisted ${serverIsolationHistory.length} historical isolation records in archive.`);
        } catch (histErr) {
          console.error("[Hub] Failed to write historical archive:", histErr);
        }
      }
      hubState = {
        version: parsed.version || 1,
        lastUpdated: parsed.lastUpdated || (/* @__PURE__ */ new Date()).toISOString(),
        deletedIds: parsed.deletedIds || {},
        cancelledIds: parsed.cancelledIds || {},
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        isolationRooms: loadedIsolationRooms,
        handovers: Array.isArray(parsed.handovers) ? parsed.handovers : [],
        parcels: Array.isArray(parsed.parcels) ? parsed.parcels : [],
        lostFound: Array.isArray(parsed.lostFound) ? parsed.lostFound : [],
        blankForms: Array.isArray(parsed.blankForms) ? parsed.blankForms : [],
        invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
        notices: Array.isArray(parsed.notices) ? parsed.notices : [],
        supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : []
      };
      console.log(`[Hub] Loaded persisted server database (v${hubState.version}) with ${hubState.bookings.length} bookings, ${hubState.isolationRooms.length} active rooms, ${Object.keys(hubState.deletedIds).length} tombstones.`);
    }
  }
} catch (err) {
  console.warn("[Hub] Could not load database file, starting with fresh state:", err);
}
var isWriting = false;
var isDirty = true;
var lastPersistedVersion = -1;
var writeWaiters = [];
var currentDiskWritePromise = null;
async function executeAtomicDiskWrite(maxRetries = 3) {
  const targetVersion = hubState.version;
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const tempPath = `${DB_FILE_PATH}.tmp.${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      const serialized = JSON.stringify(hubState);
      await import_fs.default.promises.writeFile(tempPath, serialized, "utf-8");
      await import_fs.default.promises.rename(tempPath, DB_FILE_PATH);
      lastPersistedVersion = Math.max(lastPersistedVersion, targetVersion);
      if (hubState.version === targetVersion) {
        isDirty = false;
      }
      return;
    } catch (e) {
      lastError = e;
      console.warn(`[Hub] Disk write attempt ${attempt}/${maxRetries} failed:`, e);
      try {
        if (import_fs.default.existsSync(tempPath)) await import_fs.default.promises.unlink(tempPath);
      } catch (_) {
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 50));
      }
    }
  }
  console.error("[Hub] All atomic disk write attempts failed:", lastError);
  throw lastError;
}
function processDiskWriteQueue() {
  if (isWriting) {
    return;
  }
  if (writeWaiters.length === 0) {
    if (isDirty && hubState.version !== lastPersistedVersion) {
      isWriting = true;
      currentDiskWritePromise = executeAtomicDiskWrite().catch((e) => console.error("[Hub] Background flush error:", e)).finally(() => {
        isWriting = false;
        currentDiskWritePromise = null;
        if (writeWaiters.length > 0 || isDirty && hubState.version !== lastPersistedVersion) {
          setImmediate(processDiskWriteQueue);
        }
      });
    }
    return;
  }
  const batch = [...writeWaiters];
  writeWaiters = [];
  const versionPersisting = hubState.version;
  isWriting = true;
  currentDiskWritePromise = (async () => {
    try {
      await executeAtomicDiskWrite();
      batch.forEach((w) => w.resolve());
    } catch (err) {
      batch.forEach((w) => w.reject(err));
    } finally {
      isWriting = false;
      currentDiskWritePromise = null;
      if (writeWaiters.length > 0 || isDirty && hubState.version !== lastPersistedVersion) {
        setImmediate(processDiskWriteQueue);
      }
    }
  })();
}
function markHubStateDirty() {
  isDirty = true;
}
function persistHubState(immediate = true) {
  markHubStateDirty();
  const currentVer = hubState.version;
  if (!isDirty && currentVer <= lastPersistedVersion) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    writeWaiters.push({ version: currentVer, resolve, reject });
    processDiskWriteQueue();
  });
}
var doPersistHubState = persistHubState;
function getCanonicalServerRoomNumber(input) {
  if (!input && input !== 0) return "";
  const s = String(input).toUpperCase().trim();
  const rMatch = s.match(/(?:BUILDING\s*R|ROOM\s*R|ISO-?R|^R)[\s\-_#]*0?([0-9]{1,2})(?![0-9])/i);
  if (rMatch) {
    const num = rMatch[1].padStart(2, "0");
    return `R-${num}`;
  }
  const bMatch = s.match(/(?:BUILDING\s*B|ROOM\s*B|ISO-?B|^B)[\s\-_#]*0?([0-9]{1,2})(?![0-9])/i);
  if (bMatch) {
    const num = bMatch[1].padStart(2, "0");
    return `B-${num}`;
  }
  const numOnlyMatch = s.match(/^0?([1-9]|1[0-2])$/);
  if (numOnlyMatch) {
    const n = parseInt(numOnlyMatch[1], 10);
    if (n <= 6) return `R-0${n}`;
    return `B-0${n - 6}`;
  }
  return s;
}
function findServerIsolationRoomIndex(rooms, roomIdOrBldg) {
  if (!roomIdOrBldg || !Array.isArray(rooms)) return -1;
  const clean = String(roomIdOrBldg).trim().toLowerCase();
  const canonical = getCanonicalServerRoomNumber(roomIdOrBldg).trim().toLowerCase();
  return rooms.findIndex((r) => {
    if (!r) return false;
    const rId = String(r.id || "").trim().toLowerCase();
    const rBldg = String(r.buildingNumber || "").trim().toLowerCase();
    const rCan = getCanonicalServerRoomNumber(r.buildingNumber || r.id).trim().toLowerCase();
    return rId === clean || rBldg === clean || canonical !== "" && (rCan === canonical || rBldg === canonical);
  });
}
function flushHubStateSync() {
  if (!isDirty && hubState.version === lastPersistedVersion) {
    return;
  }
  try {
    const serialized = JSON.stringify(hubState);
    const tempPath = `${DB_FILE_PATH}.tmp.exit_${process.pid}_${Date.now()}`;
    import_fs.default.writeFileSync(tempPath, serialized, "utf-8");
    import_fs.default.renameSync(tempPath, DB_FILE_PATH);
    isDirty = false;
    lastPersistedVersion = hubState.version;
  } catch (e) {
    console.error("[Hub] Synchronous flush on shutdown failed:", e);
  }
}
process.on("SIGTERM", () => {
  flushHubStateSync();
  process.exit(0);
});
process.on("SIGINT", () => {
  flushHubStateSync();
  process.exit(0);
});
process.on("beforeExit", () => {
  flushHubStateSync();
});
var sseClients = /* @__PURE__ */ new Set();
function broadcastHubEvent(event) {
  const dataString = `data: ${JSON.stringify(event)}

`;
  for (const client of sseClients) {
    try {
      client.res.write(dataString);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.res.write(": keepalive\n\n");
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 15e3);
app.get("/api/hub/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const client = { id: clientId, res };
  sseClients.add(client);
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", version: hubState.version, serverTime: (/* @__PURE__ */ new Date()).toISOString() })}

`);
  req.on("close", () => {
    sseClients.delete(client);
  });
});
app.get("/api/hub/version", (req, res) => {
  res.json({
    success: true,
    version: hubState.version,
    lastUpdated: hubState.lastUpdated
  });
});
var SESSION_SECRET_FILE = import_path.default.join(process.cwd(), ".server_session_secret");
var SESSIONS_STORAGE_FILE = import_path.default.join(process.cwd(), "tamimi_server_sessions.json");
var SESSION_SECRET;
try {
  if (import_fs.default.existsSync(SESSION_SECRET_FILE)) {
    SESSION_SECRET = import_fs.default.readFileSync(SESSION_SECRET_FILE, "utf-8").trim();
  } else {
    SESSION_SECRET = import_crypto.default.randomBytes(32).toString("hex");
    import_fs.default.writeFileSync(SESSION_SECRET_FILE, SESSION_SECRET, "utf-8");
  }
} catch (_) {
  SESSION_SECRET = "tamimi_secure_session_secret_2026_enterprise";
}
function signSessionToken(sessionData) {
  const payload = Buffer.from(JSON.stringify({
    u: sessionData.username,
    r: sessionData.role,
    f: sessionData.fullName,
    e: sessionData.email || "",
    iat: Date.now(),
    nonce: import_crypto.default.randomBytes(8).toString("hex")
  })).toString("base64url");
  const hmac = import_crypto.default.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `tkn_${payload}.${hmac}`;
}
function verifySignedToken(token) {
  if (!token || !token.startsWith("tkn_")) return null;
  const parts = token.slice(4).split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;
  const expectedHmac = import_crypto.default.createHmac("sha256", SESSION_SECRET).update(payloadStr).digest("base64url");
  if (signature.length !== expectedHmac.length) return null;
  const isMatch = import_crypto.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));
  if (!isMatch) return null;
  try {
    const data = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    const now = Date.now();
    const MAX_LIFESPAN = 12 * 60 * 60 * 1e3;
    if (now - data.iat > MAX_LIFESPAN) return null;
    return {
      token,
      username: data.u,
      role: data.r,
      fullName: data.f,
      email: data.e || void 0,
      createdAt: data.iat,
      lastActiveAt: now
    };
  } catch (_) {
    return null;
  }
}
var serverSessions = /* @__PURE__ */ new Map();
var serverAuditLogs = [];
function persistServerSessions() {
  try {
    const sessionsObj = {};
    for (const [k, v] of serverSessions.entries()) {
      sessionsObj[k] = v;
    }
    import_fs.default.writeFileSync(SESSIONS_STORAGE_FILE, JSON.stringify(sessionsObj, null, 2), "utf-8");
  } catch (e) {
    console.warn("[Security] Notice persisting server sessions:", e);
  }
}
function loadServerSessions() {
  try {
    if (import_fs.default.existsSync(SESSIONS_STORAGE_FILE)) {
      const raw = import_fs.default.readFileSync(SESSIONS_STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const now = Date.now();
        const IDLE_LIMIT = 30 * 60 * 1e3;
        const MAX_LIFESPAN = 12 * 60 * 60 * 1e3;
        for (const [k, v] of Object.entries(parsed)) {
          const s = v;
          if (s && s.token && now - s.lastActiveAt <= IDLE_LIMIT && now - s.createdAt <= MAX_LIFESPAN) {
            serverSessions.set(k, s);
          }
        }
      }
    }
  } catch (e) {
    console.warn("[Security] Notice loading server sessions:", e);
  }
}
loadServerSessions();
function logServerSecurity(eventType, details, req, user) {
  const clientIp = req ? String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") : "internal";
  const entry = {
    id: `SEC-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    eventType,
    details,
    ip: clientIp,
    username: user?.username,
    role: user?.role
  };
  serverAuditLogs.unshift(entry);
  if (serverAuditLogs.length > 200) serverAuditLogs.pop();
  if (eventType === "FORBIDDEN_ATTEMPT" || eventType === "UNAUTHORIZED_ATTEMPT" || eventType === "LOGIN_FAILED") {
    console.warn(`[Security Alert] ${eventType}: ${details} (IP: ${clientIp})`);
  }
}
function createTestSession(role = "FACILITY_OPERATOR", username = "Helpdesk") {
  const token = signSessionToken({
    username,
    role,
    fullName: username === "Helpdesk" ? "Tamimi Helpdesk Operator" : "Super Administrator",
    email: username === "Helpdesk" ? "helpdesk@tamimi.com" : "limon.voice@gmail.com"
  });
  const session = {
    token,
    username,
    role,
    fullName: username === "Helpdesk" ? "Tamimi Helpdesk Operator" : "Super Administrator",
    email: username === "Helpdesk" ? "helpdesk@tamimi.com" : "limon.voice@gmail.com",
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  };
  serverSessions.set(token, session);
  persistServerSessions();
  return token;
}
var defaultInitialToken = signSessionToken({
  username: "Helpdesk",
  role: "FACILITY_OPERATOR",
  fullName: "Tamimi Helpdesk Operator",
  email: "helpdesk@tamimi.com"
});
serverSessions.set(defaultInitialToken, {
  token: defaultInitialToken,
  username: "Helpdesk",
  role: "FACILITY_OPERATOR",
  fullName: "Tamimi Helpdesk Operator",
  email: "helpdesk@tamimi.com",
  createdAt: Date.now(),
  lastActiveAt: Date.now()
});
function getClientToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const xToken = req.headers["x-session-token"];
  if (typeof xToken === "string" && xToken.trim()) {
    return xToken.trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies["tamimi_session"]) {
    return cookies["tamimi_session"].trim();
  }
  return null;
}
function verifyServerSession(req) {
  const token = getClientToken(req);
  if (!token) return null;
  let session = serverSessions.get(token);
  if (!session) {
    const verified = verifySignedToken(token);
    if (verified) {
      serverSessions.set(token, verified);
      session = verified;
    } else {
      return null;
    }
  }
  const now = Date.now();
  const IDLE_LIMIT = 30 * 60 * 1e3;
  const MAX_LIFESPAN = 12 * 60 * 60 * 1e3;
  if (now - session.lastActiveAt > IDLE_LIMIT || now - session.createdAt > MAX_LIFESPAN) {
    serverSessions.delete(token);
    persistServerSessions();
    return null;
  }
  session.lastActiveAt = now;
  return session;
}
function requireAuth(allowedRoles) {
  return (req, res, next) => {
    const session = verifyServerSession(req);
    if (!session) {
      logServerSecurity("UNAUTHORIZED_ATTEMPT", `Unauthorized access to ${req.method} ${req.path}`, req);
      return res.status(401).json({
        success: false,
        error: "Unauthorized: A valid authenticated session is required to perform this action."
      });
    }
    if (allowedRoles && allowedRoles.length > 0) {
      const userRoleClean = session.role.toLowerCase().trim();
      const hasPermission = allowedRoles.some((r) => r.toLowerCase().trim() === userRoleClean);
      if (!hasPermission) {
        logServerSecurity("FORBIDDEN_ATTEMPT", `User "${session.username}" with role "${session.role}" attempted restricted action on ${req.method} ${req.path}`, req, session);
        return res.status(403).json({
          success: false,
          error: `Forbidden: Insufficient role privileges for this operation. Required: ${allowedRoles.join(" or ")}.`
        });
      }
    }
    req.user = session;
    next();
  };
}
var AsyncMutex = class {
  constructor() {
    this.queue = Promise.resolve();
  }
  async runExclusive(fn) {
    let release = () => {
    };
    const waitPromise = new Promise((resolve) => {
      release = resolve;
    });
    const currentQueue = this.queue;
    this.queue = this.queue.then(() => waitPromise);
    await currentQueue;
    try {
      return await fn();
    } finally {
      release();
    }
  }
};
var mutationMutex = new AsyncMutex();
app.all("/api/execute-code", (req, res) => {
  logServerSecurity("FORBIDDEN_ATTEMPT", `Blocked attempt to invoke arbitrary code execution via ${req.method} /api/execute-code`, req);
  return res.status(403).json({ success: false, error: "Arbitrary code execution endpoint is permanently disabled for production security." });
});
app.get("/api/hub/state", requireAuth(), (req, res) => {
  res.json({
    success: true,
    version: hubState.version,
    lastUpdated: hubState.lastUpdated,
    deletedIds: hubState.deletedIds,
    cancelledIds: hubState.cancelledIds,
    bookings: hubState.bookings,
    isolationRooms: hubState.isolationRooms,
    isolationHistoryCount: (serverIsolationHistory.length > 0 ? serverIsolationHistory : hubState.isolationHistory || []).length,
    handovers: hubState.handovers,
    parcels: hubState.parcels,
    lostFound: hubState.lostFound,
    blankForms: hubState.blankForms,
    invoices: hubState.invoices,
    notices: hubState.notices,
    supportTickets: hubState.supportTickets
  });
});
app.get("/api/hub/isolation-history", requireAuth(["Super Administrator", "Admin", "SUPER_ADMIN", "CLINIC_OFFICER", "FACILITY_OPERATOR"]), (req, res) => {
  const historyList = serverIsolationHistory.length > 0 ? serverIsolationHistory : hubState.isolationHistory || [];
  res.json({
    success: true,
    count: historyList.length,
    history: historyList
  });
});
app.post("/api/auth/login", (req, res) => {
  const { username, password, sessionToken } = req.body || {};
  const cleanUser = String(username || "").trim();
  const cleanPass = String(password || "").trim();
  let matchedUser = null;
  if (cleanUser.toLowerCase() === "limon.voice@gmail.com" && (cleanPass === "Limon@2026" || cleanPass === "202688")) {
    matchedUser = {
      username: "limon.voice@gmail.com",
      role: "Super Administrator",
      fullName: "Supreme Administrator (Limon)",
      email: "limon.voice@gmail.com"
    };
  } else if (cleanUser.toLowerCase() === "limon" && (cleanPass === "Limon@2026" || cleanPass === "202688")) {
    matchedUser = {
      username: "limon",
      role: "Super Administrator",
      fullName: "Supreme Administrator (Limon)",
      email: "limon.voice@gmail.com"
    };
  } else if ((cleanPass === "Amaala@188" || cleanPass === "188188") && (cleanUser.toLowerCase() === "helpdesk" || cleanUser === "")) {
    matchedUser = {
      username: "Helpdesk",
      role: "FACILITY_OPERATOR",
      fullName: "Tamimi Helpdesk Operator",
      email: "helpdesk@tamimi.com"
    };
  } else if (cleanPass === "Amaala@188" || cleanPass === "188188") {
    matchedUser = {
      username: cleanUser,
      role: "FACILITY_OPERATOR",
      fullName: cleanUser
    };
  }
  if (!matchedUser) {
    logServerSecurity("LOGIN_FAILED", `Failed login attempt for username "${cleanUser}"`, req);
    return res.status(401).json({ success: false, error: "Invalid username or password." });
  }
  const token = signSessionToken({
    username: matchedUser.username,
    role: matchedUser.role,
    fullName: matchedUser.fullName,
    email: matchedUser.email
  });
  const session = {
    token,
    username: matchedUser.username,
    role: matchedUser.role,
    fullName: matchedUser.fullName,
    email: matchedUser.email,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    ip: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
  };
  serverSessions.set(token, session);
  persistServerSessions();
  res.setHeader("Set-Cookie", `tamimi_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200`);
  logServerSecurity("LOGIN_SUCCESS", `User "${session.username}" logged in with role "${session.role}"`, req, session);
  return res.json({
    success: true,
    sessionToken: token,
    role: session.role,
    username: session.username,
    fullName: session.fullName,
    email: session.email
  });
});
app.post("/api/auth/verify", (req, res) => {
  const session = verifyServerSession(req);
  if (!session) {
    return res.json({ success: false, valid: false });
  }
  return res.json({
    success: true,
    valid: true,
    user: {
      username: session.username,
      role: session.role,
      fullName: session.fullName,
      email: session.email
    }
  });
});
app.post("/api/auth/logout", (req, res) => {
  const token = getClientToken(req);
  if (token) {
    serverSessions.delete(token);
    persistServerSessions();
  }
  res.setHeader("Set-Cookie", "tamimi_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
  return res.json({ success: true });
});
app.get("/api/security/audit-logs", requireAuth(["Super Administrator", "Admin"]), (req, res) => {
  return res.json({ success: true, count: serverAuditLogs.length, logs: serverAuditLogs });
});
function parseTimeToMinutes(timeStr, isEndTime = false) {
  if (!timeStr && timeStr !== 0) return 0;
  const s = String(timeStr).trim();
  const ampmMatch = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridian = ampmMatch[3].toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    const total = hours * 60 + minutes;
    if (isEndTime && total === 0) return 1440;
    return total;
  }
  const match24 = s.match(/(?:[T\s]|^)(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    const total = hours % 24 * 60 + minutes % 60;
    if (isEndTime && (total === 0 || hours === 24)) return 1440;
    return total;
  }
  return 0;
}
function doTimeRangesOverlap(startA, endA, startB, endB) {
  const sA = parseTimeToMinutes(startA, false);
  const eA = parseTimeToMinutes(endA, true);
  const sB = parseTimeToMinutes(startB, false);
  const eB = parseTimeToMinutes(endB, true);
  return sA < eB && eA > sB;
}
function resolveServerFacilityId(nameOrTab) {
  if (!nameOrTab) return "barber-booking";
  const s = String(nameOrTab).toLowerCase().trim();
  if (s.includes("barber") || s === "bb") return "barber-booking";
  if (s.includes("football") || s === "fg") return "football-ground";
  if (s.includes("cricket") && s.includes("net")) return "cricket-net";
  if (s.includes("cricket") || s === "cg") return "cricket-ground";
  if (s.includes("multipurpose") || s.includes("multi-purpose") || s.includes("multi") || s === "mr") return "multipurpose-room";
  if (s.includes("cinema") || s.includes("movie") || s === "cn") return "cinema";
  if (s.includes("tennis") || s === "tc") return "tennis-court";
  if (s.includes("basket") || s === "bc") return "basketball-court";
  if (s.includes("isolation") || s.includes("iso") || s.includes("quarantine") || s.includes("hospital")) return "isolation-room";
  return nameOrTab;
}
function checkServerBookingConflict(newB, existingBookings = hubState.bookings || [], cancelledIds = hubState.cancelledIds || {}, deletedIds = hubState.deletedIds || {}) {
  if (!newB || typeof newB !== "object") return { conflict: false, hasConflict: false };
  const newStatus = String(newB.status || "").toUpperCase().trim();
  if (newStatus === "CANCELLED" || newStatus === "CANCELED" || newStatus === "REJECTED" || newStatus === "VOID") {
    return { conflict: false, hasConflict: false };
  }
  const newId = String(newB.id || "").toLowerCase().trim();
  const newDate = String(newB.date || "").trim();
  const newFacId = resolveServerFacilityId(newB.facilityId || newB.sheetTabName || newB.facilityName);
  const newStage = String(newB.stage || "").trim();
  const newStart = String(newB.startTime || "").trim();
  const newEnd = String(newB.endTime || "").trim();
  if (!newDate || !newStart || !newEnd) return { conflict: false, hasConflict: false };
  const bookingsList = Array.isArray(existingBookings) ? existingBookings : hubState.bookings || [];
  for (const existB of bookingsList) {
    if (!existB || typeof existB !== "object") continue;
    const existId = String(existB.id || "").toLowerCase().trim();
    if (newId && existId && newId === existId) continue;
    if (deletedIds[existId] || cancelledIds[existId]) continue;
    const existStatus = String(existB.status || "").toUpperCase().trim();
    if (existStatus === "CANCELLED" || existStatus === "CANCELED" || existStatus === "REJECTED" || existStatus === "VOID") {
      continue;
    }
    if (String(existB.date || "").trim() !== newDate) continue;
    const existFacId = resolveServerFacilityId(existB.facilityId || existB.sheetTabName || existB.facilityName);
    if (newFacId !== existFacId) continue;
    if (!isResourceOrStageMatch(newStage, existB.stage, newFacId)) {
      continue;
    }
    if (doTimeRangesOverlap(newStart, newEnd, existB.startTime, existB.endTime)) {
      return { conflict: true, hasConflict: true, conflictingBooking: existB };
    }
  }
  return { conflict: false, hasConflict: false };
}
function reconcileServerIsolationRooms(incomingRooms) {
  if (!Array.isArray(incomingRooms) || incomingRooms.length === 0) {
    return hubState.isolationRooms;
  }
  const roomMap = /* @__PURE__ */ new Map();
  (hubState.isolationRooms || []).forEach((r) => {
    if (!r) return;
    const can = getCanonicalServerRoomNumber(r.buildingNumber || r.id);
    if (can) {
      roomMap.set(can.toUpperCase(), {
        ...r,
        id: can,
        buildingNumber: can,
        occupants: Array.isArray(r.occupants) ? [...r.occupants] : []
      });
    }
  });
  incomingRooms.forEach((inR) => {
    if (!inR) return;
    const can = getCanonicalServerRoomNumber(inR.buildingNumber || inR.id);
    if (!can) return;
    const canKey = can.toUpperCase();
    const existing = roomMap.get(canKey);
    const inOccs = Array.isArray(inR.occupants) ? inR.occupants : [];
    const isDeletedOccupant = (occ) => {
      if (!occ) return true;
      const occId = String(occ.id || occ.bookingId || "").toLowerCase().trim();
      const bedKey = `${canKey}-B${occ.bedNumber}`.toLowerCase();
      return Boolean(occId && hubState.deletedIds[occId] || hubState.deletedIds[bedKey]);
    };
    const validInOccs = inOccs.filter((o) => !isDeletedOccupant(o));
    if (!existing) {
      roomMap.set(canKey, {
        id: can,
        buildingNumber: can,
        occupants: validInOccs,
        status: validInOccs.length > 0 ? "Occupied" : inR.status || "VACANT",
        lastUpdated: inR.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
      });
      return;
    }
    const exOccs = Array.isArray(existing.occupants) ? existing.occupants : [];
    const validExOccs = exOccs.filter((o) => !isDeletedOccupant(o));
    const inTime = inR.lastUpdated ? new Date(inR.lastUpdated).getTime() : 0;
    const exTime = existing.lastUpdated ? new Date(existing.lastUpdated).getTime() : 0;
    const hasExplicitDischargeOrTransfer = Boolean(
      inR.transferHistory && inR.transferHistory.length > 0 || inR.dischargeDate || inR.status === "VACANT" && validInOccs.length === 0 && (inTime >= exTime || inR.transferHistory || inR.dischargeDate) || inR.status === "VACANT" && (!existing.status || existing.status === "VACANT")
    );
    let mergedOccs = [];
    if (hasExplicitDischargeOrTransfer) {
      mergedOccs = validInOccs;
    } else if (inTime > exTime) {
      mergedOccs = validInOccs.map((inOcc) => {
        const matchingEx = validExOccs.find((e) => e.bedNumber === inOcc.bedNumber);
        if (!matchingEx) return inOcc;
        return {
          ...matchingEx,
          ...inOcc,
          staffNotes: inOcc.staffNotes || matchingEx.staffNotes,
          hospitalReferral: inOcc.hospitalReferral || matchingEx.hospitalReferral,
          purposeOfStay: inOcc.purposeOfStay || matchingEx.purposeOfStay,
          nationalId: inOcc.nationalId || matchingEx.nationalId,
          company: inOcc.company && inOcc.company !== "General Resident" ? inOcc.company : matchingEx.company || inOcc.company
        };
      });
    } else {
      mergedOccs = [...validExOccs];
      validInOccs.forEach((inOcc) => {
        if (!mergedOccs.some((e) => e.bedNumber === inOcc.bedNumber)) {
          mergedOccs.push(inOcc);
        }
      });
    }
    mergedOccs.sort((a, b) => (a.bedNumber || 1) - (b.bedNumber || 1));
    const finalStatus = inR.status === "Maintenance" ? "Maintenance" : mergedOccs.length > 0 ? "Occupied" : hasExplicitDischargeOrTransfer ? "VACANT" : existing.status || "VACANT";
    roomMap.set(canKey, {
      ...existing,
      ...inR,
      id: can,
      buildingNumber: can,
      occupants: mergedOccs,
      status: finalStatus,
      transferHistory: inR.transferHistory || existing.transferHistory,
      dischargeDate: inR.dischargeDate || existing.dischargeDate,
      lastUpdated: new Date(Math.max(inTime, exTime, Date.now())).toISOString()
    });
  });
  const seenOccNames = /* @__PURE__ */ new Set();
  const finalRooms = Array.from(roomMap.values());
  finalRooms.forEach((r) => {
    if (Array.isArray(r.occupants) && r.occupants.length > 0) {
      r.occupants = r.occupants.filter((occ) => {
        const nameKey = String(occ.id || occ.patientName || "").toLowerCase().trim();
        if (!nameKey) return true;
        if (seenOccNames.has(nameKey)) return false;
        seenOccNames.add(nameKey);
        return true;
      });
      r.status = r.occupants.length > 0 ? "Occupied" : r.status === "Maintenance" ? "Maintenance" : "VACANT";
      if (r.occupants.length === 0) {
        r.patientName = "";
        r.company = "";
      }
    }
  });
  hubState.isolationRooms = finalRooms;
  return hubState.isolationRooms;
}
var ALLOWED_MUTATION_TYPES = /* @__PURE__ */ new Set(["UPSERT", "UPSERT_BATCH", "BATCH_UPSERT", "DELETE", "CANCEL", "CANCEL_BATCH", "SYNC_ALL", "TRANSFER"]);
var ALLOWED_ENTITIES = /* @__PURE__ */ new Set([
  "bookings",
  "isolationRooms",
  "handovers",
  "parcels",
  "lostFound",
  "blankForms",
  "invoices",
  "notices",
  "supportTickets"
]);
app.post("/api/hub/mutate", (req, res) => {
  return mutationMutex.runExclusive(async () => {
    const session = verifyServerSession(req);
    if (!session) {
      logServerSecurity("UNAUTHORIZED_ATTEMPT", `Unauthorized attempt to call /api/hub/mutate (${req.body?.mutationType} ${req.body?.entity})`, req);
      return res.status(401).json({
        success: false,
        error: "Unauthorized: A valid authenticated session is required to perform mutations."
      });
    }
    const { mutationType, entity, id, data, reason } = req.body;
    const now = Date.now();
    const cleanId = id ? String(id).toLowerCase().trim() : "";
    if (cleanId && (cleanId.includes("..") || cleanId.includes("/") || cleanId.includes("\\") || cleanId.length > 200)) {
      return res.status(400).json({ success: false, error: "Invalid record ID format." });
    }
    if (!mutationType || !ALLOWED_MUTATION_TYPES.has(mutationType)) {
      return res.status(400).json({ success: false, error: `Invalid or unsupported mutationType: "${mutationType}"` });
    }
    const effectiveMutationType = mutationType === "UPSERT_BATCH" || mutationType === "BATCH_UPSERT" ? "UPSERT" : mutationType;
    const targetEntity = entity || (req.body.bookings ? "bookings" : void 0);
    if (targetEntity && !ALLOWED_ENTITIES.has(targetEntity)) {
      return res.status(400).json({ success: false, error: `Invalid entity target: "${targetEntity}"` });
    }
    hubState.version += 1;
    hubState.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    try {
      if (effectiveMutationType === "DELETE") {
        const isPrivileged = session.role === "Super Administrator" || session.role === "Admin" || session.role === "SUPER_ADMIN";
        if (!isPrivileged) {
          logServerSecurity("FORBIDDEN_ATTEMPT", `User "${session.username}" lacking admin privileges attempted DELETE on ${cleanId}`, req, session);
          return res.status(403).json({
            success: false,
            error: "Forbidden: Deleting records requires Administrative or Super Administrator privileges."
          });
        }
        if (!cleanId) {
          return res.status(400).json({ success: false, error: "Target ID is required for DELETE operation." });
        }
        hubState.deletedIds[cleanId] = now;
        hubState.bookings = hubState.bookings.filter((b) => String(b.id || "").toLowerCase().trim() !== cleanId);
        hubState.handovers = hubState.handovers.filter((h) => String(h.id || "").toLowerCase().trim() !== cleanId);
        hubState.parcels = hubState.parcels.filter((p) => String(p.id || "").toLowerCase().trim() !== cleanId);
        hubState.lostFound = hubState.lostFound.filter((l) => String(l.id || "").toLowerCase().trim() !== cleanId);
        hubState.blankForms = hubState.blankForms.filter((f) => String(f.id || "").toLowerCase().trim() !== cleanId);
        hubState.invoices = hubState.invoices.filter((i) => String(i.id || "").toLowerCase().trim() !== cleanId);
        hubState.notices = hubState.notices.filter((n) => String(n.id || "").toLowerCase().trim() !== cleanId);
        hubState.supportTickets = hubState.supportTickets.filter((s) => String(s.id || "").toLowerCase().trim() !== cleanId);
        hubState.isolationRooms = hubState.isolationRooms.map((room) => {
          if (!room.occupants) return room;
          const filtered = room.occupants.filter((occ) => {
            const occId = String(occ.id || occ.bookingId || "").toLowerCase().trim();
            return occId !== cleanId;
          });
          return { ...room, occupants: filtered };
        });
        await persistHubState();
        broadcastHubEvent({ type: "DELETE", entity: targetEntity, id: cleanId, version: hubState.version });
        return res.json({ success: true, version: hubState.version, deleted: cleanId });
      }
      if (effectiveMutationType === "CANCEL") {
        if (!cleanId) {
          return res.status(400).json({ success: false, error: "Target ID is required for CANCEL operation." });
        }
        hubState.cancelledIds[cleanId] = now;
        let found = false;
        hubState.bookings = hubState.bookings.map((b) => {
          if (String(b.id || "").toLowerCase().trim() === cleanId) {
            found = true;
            return {
              ...b,
              status: "CANCELLED",
              cancellationReason: reason || "Cancelled via Portal",
              cancelledAt: (/* @__PURE__ */ new Date()).toISOString()
            };
          }
          return b;
        });
        invalidateGasCache();
        await persistHubState();
        broadcastHubEvent({ type: "CANCEL", entity: "bookings", id: cleanId, version: hubState.version, payload: { reason } });
        return res.json({ success: true, version: hubState.version, cancelled: cleanId, found });
      }
      if (effectiveMutationType === "CANCEL_BATCH") {
        const rawIds = Array.isArray(req.body.ids) ? req.body.ids : Array.isArray(data) ? data : req.body.id ? [req.body.id] : [];
        const cleanIds = rawIds.map((x) => String(x || "").toLowerCase().trim()).filter(Boolean);
        const targetGroupId = String(req.body.recurringGroupId || req.body.groupId || "").trim().toLowerCase();
        const cleanGroupNoDashes = targetGroupId.replace(/[^a-z0-9]/g, "");
        if (targetGroupId) {
          hubState.bookings.forEach((b) => {
            if (!b) return;
            const bGrp = String(b.recurringGroupId || "").toLowerCase().trim();
            const bGrpClean = bGrp.replace(/[^a-z0-9]/g, "");
            if (bGrp === targetGroupId || cleanGroupNoDashes && bGrpClean === cleanGroupNoDashes) {
              if (b.id) {
                const bIdClean = String(b.id).toLowerCase().trim();
                if (!cleanIds.includes(bIdClean)) {
                  cleanIds.push(bIdClean);
                }
              }
            }
          });
        }
        if (cleanIds.length === 0) {
          return res.status(400).json({ success: false, error: "Missing or empty ids/groupId for CANCEL_BATCH" });
        }
        cleanIds.forEach((cId) => {
          hubState.cancelledIds[cId] = now;
        });
        let cancelCount = 0;
        const cancelledTimestamp = (/* @__PURE__ */ new Date()).toISOString();
        const effectiveReason = reason || "Cancelled via Batch Operation";
        hubState.bookings = hubState.bookings.map((b) => {
          const bId = String(b.id || "").toLowerCase().trim();
          if (cleanIds.includes(bId)) {
            cancelCount++;
            return {
              ...b,
              status: "CANCELLED",
              cancellationReason: effectiveReason,
              cancelledAt: cancelledTimestamp
            };
          }
          return b;
        });
        invalidateGasCache();
        await persistHubState();
        broadcastHubEvent({
          type: "CANCEL_BATCH",
          entity: "bookings",
          version: hubState.version,
          payload: { ids: cleanIds, recurringGroupId: targetGroupId || void 0, reason: effectiveReason }
        });
        for (const cId of cleanIds) {
          broadcastHubEvent({ type: "CANCEL", entity: "bookings", id: cId, version: hubState.version, payload: { reason: effectiveReason } });
        }
        return res.json({ success: true, version: hubState.version, cancelledCount: cancelCount, cancelledIds: cleanIds });
      }
      if (mutationType === "TRANSFER") {
        const { sourceRoomId, sourceBedNumber, targetRoomId, targetBedNumber } = req.body;
        const transferTimestamp = (/* @__PURE__ */ new Date()).toISOString();
        let updatedSrcRoom = null;
        let updatedTgtRoom = null;
        if (Array.isArray(data) && data.length > 0) {
          for (const r of data) {
            const roomTarget = String(r.id || r.buildingNumber || "").trim();
            const idx = findServerIsolationRoomIndex(hubState.isolationRooms, roomTarget);
            if (idx >= 0) {
              hubState.isolationRooms[idx] = { ...hubState.isolationRooms[idx], ...r, lastUpdated: transferTimestamp };
            } else {
              hubState.isolationRooms.push({ ...r, lastUpdated: transferTimestamp });
            }
          }
          updatedSrcRoom = data[0];
          updatedTgtRoom = data.length > 1 ? data[1] : data[0];
        } else if (sourceRoomId && targetRoomId && sourceBedNumber && targetBedNumber) {
          const srcIdx = findServerIsolationRoomIndex(hubState.isolationRooms, sourceRoomId);
          const tgtIdx = findServerIsolationRoomIndex(hubState.isolationRooms, targetRoomId);
          if (srcIdx === -1 || tgtIdx === -1) {
            return res.status(404).json({ success: false, error: "Source or target isolation room not found." });
          }
          const srcRoom = hubState.isolationRooms[srcIdx];
          const tgtRoom = hubState.isolationRooms[tgtIdx];
          const occToMove = (srcRoom.occupants || []).find((o) => o.bedNumber === sourceBedNumber);
          if (!occToMove) {
            return res.status(400).json({ success: false, error: `No occupant found on Bed ${sourceBedNumber} in Room ${srcRoom.buildingNumber || srcRoom.id}.` });
          }
          const targetOccupant = (tgtRoom.occupants || []).find((o) => o.bedNumber === targetBedNumber);
          if (targetOccupant && targetOccupant.patientName && targetOccupant.patientName.trim()) {
            if (!(srcIdx === tgtIdx && sourceBedNumber === targetBedNumber)) {
              return res.status(409).json({ success: false, error: `Bed ${targetBedNumber} in ${tgtRoom.buildingNumber || tgtRoom.id} is already occupied.` });
            }
          }
          const transferredOccupant = {
            ...occToMove,
            bedNumber: targetBedNumber,
            staffNotes: `${occToMove.staffNotes ? occToMove.staffNotes + " | " : ""}Transferred from Room ${srcRoom.buildingNumber || srcRoom.id} Bed ${sourceBedNumber} on ${transferTimestamp.slice(0, 10)}`
          };
          if (srcIdx === tgtIdx) {
            const remaining = (srcRoom.occupants || []).filter((o) => o.bedNumber !== sourceBedNumber && o.bedNumber !== targetBedNumber);
            remaining.push(transferredOccupant);
            remaining.sort((a, b) => a.bedNumber - b.bedNumber);
            hubState.isolationRooms[srcIdx] = {
              ...srcRoom,
              occupants: remaining,
              lastUpdated: transferTimestamp,
              status: remaining.length > 0 ? "Occupied" : "VACANT"
            };
            updatedSrcRoom = hubState.isolationRooms[srcIdx];
            updatedTgtRoom = updatedSrcRoom;
          } else {
            const remainingSrc = (srcRoom.occupants || []).filter((o) => o.bedNumber !== sourceBedNumber);
            hubState.isolationRooms[srcIdx] = {
              ...srcRoom,
              occupants: remainingSrc,
              lastUpdated: transferTimestamp,
              status: remainingSrc.length > 0 ? "Occupied" : "VACANT"
            };
            const remainingTgt = (tgtRoom.occupants || []).filter((o) => o.bedNumber !== targetBedNumber);
            remainingTgt.push(transferredOccupant);
            remainingTgt.sort((a, b) => a.bedNumber - b.bedNumber);
            hubState.isolationRooms[tgtIdx] = {
              ...tgtRoom,
              occupants: remainingTgt,
              lastUpdated: transferTimestamp,
              status: remainingTgt.length > 0 ? "Occupied" : "VACANT"
            };
            updatedSrcRoom = hubState.isolationRooms[srcIdx];
            updatedTgtRoom = hubState.isolationRooms[tgtIdx];
          }
        } else {
          return res.status(400).json({ success: false, error: "Invalid TRANSFER payload: missing rooms or beds." });
        }
        const targetOccs = updatedTgtRoom.occupants || [];
        const occKeys = targetOccs.map((o) => String(o.id || o.patientName || "").toLowerCase().trim()).filter(Boolean);
        if (occKeys.length > 0) {
          hubState.isolationRooms.forEach((r, idx) => {
            const isTarget = String(r.id || r.buildingNumber).toLowerCase().trim() === String(updatedTgtRoom.id || updatedTgtRoom.buildingNumber).toLowerCase().trim();
            if (!isTarget && Array.isArray(r.occupants) && r.occupants.length > 0) {
              r.occupants = r.occupants.filter((occ) => {
                const k = String(occ.id || occ.patientName || "").toLowerCase().trim();
                return !k || !occKeys.includes(k);
              });
              r.status = r.occupants.length > 0 ? "Occupied" : "VACANT";
            }
          });
        }
        const historyAudit = {
          id: `HIST-XFER-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          action: "TRANSFER",
          timestamp: transferTimestamp,
          sourceRoom: sourceRoomId || updatedSrcRoom.buildingNumber,
          sourceBed: sourceBedNumber,
          targetRoom: targetRoomId || updatedTgtRoom.buildingNumber,
          targetBed: targetBedNumber
        };
        serverIsolationHistory.unshift(historyAudit);
        const multiRecordPayload = [updatedSrcRoom, updatedTgtRoom].filter(Boolean);
        broadcastHubEvent({
          type: "UPSERT_BATCH",
          entity: "isolationRooms",
          version: hubState.version,
          payload: multiRecordPayload
        });
        for (const r of multiRecordPayload) {
          broadcastHubEvent({
            type: "UPSERT",
            entity: "isolationRooms",
            id: String(r.id || ""),
            version: hubState.version,
            payload: r
          });
        }
        await persistHubState();
        return res.json({
          success: true,
          version: hubState.version,
          sourceRoom: updatedSrcRoom,
          targetRoom: updatedTgtRoom
        });
      }
      if (effectiveMutationType === "UPSERT") {
        const rawPayload = data !== void 0 && data !== null ? data : req.body.bookings !== void 0 ? req.body.bookings : req.body.items;
        if (rawPayload === void 0 || rawPayload === null) {
          return res.status(400).json({ success: false, error: "Missing data payload for UPSERT mutation." });
        }
        if (!targetEntity) {
          return res.status(400).json({ success: false, error: "Target entity is required for UPSERT mutation." });
        }
        const rawList = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
        const flatList = rawList.flat();
        const validItems = [];
        const invalidItems = [];
        for (let i = 0; i < flatList.length; i++) {
          const raw = flatList[i];
          if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            invalidItems.push({ index: i, error: "Record must be a non-null object" });
            continue;
          }
          const cleanItem = {};
          for (const [k, v] of Object.entries(raw)) {
            if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
            cleanItem[k] = v;
          }
          if (targetEntity === "bookings") {
            if (!cleanItem.id || String(cleanItem.id).trim() === "") {
              cleanItem.id = !Array.isArray(rawPayload) && id ? String(id).trim() : `BK-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
            } else {
              cleanItem.id = String(cleanItem.id).trim();
            }
            if (cleanItem.status) {
              const rawStat = String(cleanItem.status).toUpperCase().trim();
              if (rawStat === "CANCELLED" || rawStat === "CANCELED" || rawStat === "VOID") {
                cleanItem.status = "CANCELLED";
              } else {
                cleanItem.status = "CONFIRMED";
              }
            } else {
              cleanItem.status = "CONFIRMED";
            }
          }
          validItems.push(cleanItem);
        }
        let upsertedCount = 0;
        const broadcastedItems = [];
        for (const item of validItems) {
          const targetId = String(item.id || id || "").toLowerCase().trim();
          if (targetId && hubState.deletedIds[targetId] && !req.body.forceRevive) {
            continue;
          }
          if (targetEntity === "bookings") {
            const conflictCheck = checkServerBookingConflict(item, hubState.bookings, hubState.cancelledIds, hubState.deletedIds);
            if (conflictCheck.conflict) {
              const c = conflictCheck.conflictingBooking;
              logServerSecurity(
                "CONFLICT_DETECTED",
                `Prevented conflicting simultaneous booking on ${item.stage} (${item.date} ${item.startTime}-${item.endTime}) by ${item.customerName || "Resident"}. Collides with existing booking ${c?.id}.`,
                req,
                session
              );
              return res.status(409).json({
                success: false,
                conflict: true,
                error: `Booking Conflict: Resource "${item.stage}" is already reserved on ${item.date} from ${c?.startTime} to ${c?.endTime} by ${c?.customerName}.`,
                conflictingBooking: c
              });
            }
            const existingIdx = hubState.bookings.findIndex((b) => String(b.id || "").toLowerCase().trim() === targetId);
            const wasCancelled = targetId && hubState.cancelledIds[targetId] || existingIdx >= 0 && hubState.bookings[existingIdx].status === "CANCELLED";
            if (wasCancelled && item.status !== "CANCELLED" && !req.body.forceRevive) {
              item.status = "CANCELLED";
              if (existingIdx >= 0) {
                item.cancellationReason = hubState.bookings[existingIdx].cancellationReason || item.cancellationReason || "Cancelled";
                item.cancelledAt = hubState.bookings[existingIdx].cancelledAt || item.cancelledAt || (/* @__PURE__ */ new Date()).toISOString();
              }
            }
            if (existingIdx >= 0) {
              hubState.bookings[existingIdx] = { ...hubState.bookings[existingIdx], ...item };
            } else {
              hubState.bookings.unshift(item);
            }
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "isolationRooms") {
            const roomTarget = String(item.id || item.buildingNumber || "").trim();
            const idx = findServerIsolationRoomIndex(hubState.isolationRooms, roomTarget);
            if (idx >= 0) {
              hubState.isolationRooms[idx] = { ...hubState.isolationRooms[idx], ...item };
            } else {
              hubState.isolationRooms.push(item);
            }
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "handovers") {
            const idx = hubState.handovers.findIndex((h) => String(h.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.handovers[idx] = { ...hubState.handovers[idx], ...item };
            else hubState.handovers.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "parcels") {
            const idx = hubState.parcels.findIndex((p) => String(p.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.parcels[idx] = { ...hubState.parcels[idx], ...item };
            else hubState.parcels.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "lostFound") {
            const idx = hubState.lostFound.findIndex((l) => String(l.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.lostFound[idx] = { ...hubState.lostFound[idx], ...item };
            else hubState.lostFound.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "blankForms") {
            const idx = hubState.blankForms.findIndex((f) => String(f.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.blankForms[idx] = { ...hubState.blankForms[idx], ...item };
            else hubState.blankForms.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "invoices") {
            const idx = hubState.invoices.findIndex((i) => String(i.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.invoices[idx] = { ...hubState.invoices[idx], ...item };
            else hubState.invoices.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "notices") {
            const idx = hubState.notices.findIndex((n) => String(n.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.notices[idx] = { ...hubState.notices[idx], ...item };
            else hubState.notices.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          } else if (targetEntity === "supportTickets") {
            const idx = hubState.supportTickets.findIndex((s) => String(s.id || "").toLowerCase().trim() === targetId);
            if (idx >= 0) hubState.supportTickets[idx] = { ...hubState.supportTickets[idx], ...item };
            else hubState.supportTickets.unshift(item);
            upsertedCount++;
            broadcastedItems.push(item);
          }
        }
        if (targetEntity === "isolationRooms" && broadcastedItems.length > 0) {
          const seenOccKeys = /* @__PURE__ */ new Set();
          broadcastedItems.forEach((updatedR) => {
            if (Array.isArray(updatedR.occupants)) {
              updatedR.occupants.forEach((occ) => {
                const k = String(occ.id || occ.patientName || "").toLowerCase().trim();
                if (k) seenOccKeys.add(k);
              });
            }
          });
          hubState.isolationRooms.forEach((r) => {
            const isJustUpdated = broadcastedItems.some(
              (bi) => String(bi.id || bi.buildingNumber).toLowerCase().trim() === String(r.id || r.buildingNumber).toLowerCase().trim()
            );
            if (!isJustUpdated && Array.isArray(r.occupants) && r.occupants.length > 0) {
              const origLen = r.occupants.length;
              r.occupants = r.occupants.filter((occ) => {
                const k = String(occ.id || occ.patientName || "").toLowerCase().trim();
                return !k || !seenOccKeys.has(k);
              });
              if (r.occupants.length !== origLen) {
                r.status = r.occupants.length > 0 ? "Occupied" : "VACANT";
                if (r.occupants.length === 0) {
                  r.patientName = "";
                  r.company = "";
                }
              }
            }
          });
        }
        if (Array.isArray(rawPayload)) {
          for (const item of broadcastedItems) {
            broadcastHubEvent({
              type: "UPSERT",
              entity: targetEntity,
              id: String(item.id || ""),
              version: hubState.version,
              payload: item
            });
          }
          broadcastHubEvent({
            type: "UPSERT_BATCH",
            entity: targetEntity,
            version: hubState.version,
            payload: broadcastedItems
          });
        } else {
          broadcastHubEvent({
            type: "UPSERT",
            entity: targetEntity,
            id: cleanId || broadcastedItems[0] && broadcastedItems[0].id,
            version: hubState.version,
            payload: broadcastedItems[0] || rawPayload
          });
        }
        if (upsertedCount > 0) {
          invalidateGasCache();
          await persistHubState();
        }
        return res.json({
          success: true,
          version: hubState.version,
          upsertedCount,
          invalidCount: invalidItems.length,
          invalidItems: invalidItems.length > 0 ? invalidItems : void 0,
          item: broadcastedItems[0] || rawPayload,
          items: broadcastedItems
        });
      }
      if (mutationType === "SYNC_ALL") {
        const {
          bookings,
          handovers,
          parcels,
          lostFound,
          isolationRooms,
          blankForms,
          invoices,
          notices,
          supportTickets,
          deletedIds,
          cancelledIds
        } = req.body;
        if (deletedIds && typeof deletedIds === "object") {
          Object.keys(deletedIds).forEach((k) => {
            hubState.deletedIds[k.toLowerCase().trim()] = Math.max(hubState.deletedIds[k.toLowerCase().trim()] || 0, deletedIds[k] || now);
          });
        }
        if (cancelledIds && typeof cancelledIds === "object") {
          Object.keys(cancelledIds).forEach((k) => {
            hubState.cancelledIds[k.toLowerCase().trim()] = Math.max(hubState.cancelledIds[k.toLowerCase().trim()] || 0, cancelledIds[k] || now);
          });
        }
        const isDeleted = (rawId) => {
          if (!rawId) return false;
          return Boolean(hubState.deletedIds[String(rawId).toLowerCase().trim()]);
        };
        if (Array.isArray(bookings)) {
          const bMap = /* @__PURE__ */ new Map();
          hubState.bookings.forEach((b) => {
            if (b && b.id && !isDeleted(b.id)) bMap.set(String(b.id).toLowerCase().trim(), b);
          });
          bookings.forEach((b) => {
            if (b && b.id && !isDeleted(b.id)) {
              const idKey = String(b.id).toLowerCase().trim();
              if (hubState.cancelledIds[idKey] && b.status !== "CANCELLED") {
                b.status = "CANCELLED";
              }
              bMap.set(idKey, b);
            }
          });
          hubState.bookings = Array.from(bMap.values());
        }
        if (Array.isArray(handovers)) {
          const hMap = /* @__PURE__ */ new Map();
          hubState.handovers.forEach((h) => {
            if (h && h.id && !isDeleted(h.id)) hMap.set(String(h.id).toLowerCase().trim(), h);
          });
          handovers.forEach((h) => {
            if (h && h.id && !isDeleted(h.id)) hMap.set(String(h.id).toLowerCase().trim(), h);
          });
          hubState.handovers = Array.from(hMap.values());
        }
        if (Array.isArray(parcels)) {
          const pMap = /* @__PURE__ */ new Map();
          hubState.parcels.forEach((p) => {
            if (p && p.id && !isDeleted(p.id)) pMap.set(String(p.id).toLowerCase().trim(), p);
          });
          parcels.forEach((p) => {
            if (p && p.id && !isDeleted(p.id)) pMap.set(String(p.id).toLowerCase().trim(), p);
          });
          hubState.parcels = Array.from(pMap.values());
        }
        if (Array.isArray(lostFound)) {
          const lMap = /* @__PURE__ */ new Map();
          hubState.lostFound.forEach((l) => {
            if (l && l.id && !isDeleted(l.id)) lMap.set(String(l.id).toLowerCase().trim(), l);
          });
          lostFound.forEach((l) => {
            if (l && l.id && !isDeleted(l.id)) lMap.set(String(l.id).toLowerCase().trim(), l);
          });
          hubState.lostFound = Array.from(lMap.values());
        }
        if (Array.isArray(isolationRooms) && isolationRooms.length > 0) {
          hubState.isolationRooms = isolationRooms;
        }
        if (Array.isArray(blankForms)) {
          const fMap = /* @__PURE__ */ new Map();
          hubState.blankForms.forEach((f) => {
            if (f && f.id && !isDeleted(f.id)) fMap.set(String(f.id).toLowerCase().trim(), f);
          });
          blankForms.forEach((f) => {
            if (f && f.id && !isDeleted(f.id)) fMap.set(String(f.id).toLowerCase().trim(), f);
          });
          hubState.blankForms = Array.from(fMap.values());
        }
        if (Array.isArray(invoices)) {
          const iMap = /* @__PURE__ */ new Map();
          hubState.invoices.forEach((i) => {
            if (i && i.id && !isDeleted(i.id)) iMap.set(String(i.id).toLowerCase().trim(), i);
          });
          invoices.forEach((i) => {
            if (i && i.id && !isDeleted(i.id)) iMap.set(String(i.id).toLowerCase().trim(), i);
          });
          hubState.invoices = Array.from(iMap.values());
        }
        if (Array.isArray(notices)) {
          const nMap = /* @__PURE__ */ new Map();
          hubState.notices.forEach((n) => {
            if (n && n.id && !isDeleted(n.id)) nMap.set(String(n.id).toLowerCase().trim(), n);
          });
          notices.forEach((n) => {
            if (n && n.id && !isDeleted(n.id)) nMap.set(String(n.id).toLowerCase().trim(), n);
          });
          hubState.notices = Array.from(nMap.values());
        }
        if (Array.isArray(supportTickets)) {
          const sMap = /* @__PURE__ */ new Map();
          hubState.supportTickets.forEach((s) => {
            if (s && s.id && !isDeleted(s.id)) sMap.set(String(s.id).toLowerCase().trim(), s);
          });
          supportTickets.forEach((s) => {
            if (s && s.id && !isDeleted(s.id)) sMap.set(String(s.id).toLowerCase().trim(), s);
          });
          hubState.supportTickets = Array.from(sMap.values());
        }
        invalidateGasCache();
        await persistHubState();
        broadcastHubEvent({ type: "SYNC_ALL", version: hubState.version });
        return res.json({
          success: true,
          version: hubState.version,
          state: hubState
        });
      }
      return res.json({ success: true, version: hubState.version });
    } catch (err) {
      console.error("[Hub] Mutation error:", err);
      return res.status(500).json({ success: false, error: "Database persistence error: " + (err?.message || err) });
    }
  });
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hubVersion: hubState.version,
    clientsConnected: sseClients.size,
    bookingsCount: hubState.bookings.length,
    tombstonesCount: Object.keys(hubState.deletedIds).length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var gasCache = /* @__PURE__ */ new Map();
var inFlightRequests = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 15e3;
function invalidateGasCache() {
  gasCache.clear();
}
app.post("/api/gas/proxy", async (req, res) => {
  const session = verifyServerSession(req);
  if (!session) {
    logServerSecurity("UNAUTHORIZED_ATTEMPT", "Unauthorized access attempt to /api/gas/proxy", req);
    return res.status(401).json({ success: false, error: "Unauthorized: Authentication required to access proxy." });
  }
  const startTime = Date.now();
  const { targetUrl, action, method = "GET", body = null } = req.body;
  const effectiveAction = body && body.action || action || (method.toUpperCase() === "GET" ? "ping" : "save");
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.json({
      success: false,
      error: 'Missing or invalid "targetUrl". Please provide a valid Google Apps Script Web App URL.',
      diagnosis: "NETWORK_ERROR"
    });
  }
  const cleanUrl = targetUrl.trim();
  const lowerUrl = cleanUrl.toLowerCase();
  if (lowerUrl.includes("localhost") || lowerUrl.includes("127.0.0.1") || lowerUrl.includes("169.254.") || lowerUrl.includes("10.") || lowerUrl.includes("192.168.") || lowerUrl.includes("172.16.") || lowerUrl.includes("0.0.0.0") || lowerUrl.startsWith("file:") || lowerUrl.startsWith("ftp:")) {
    logServerSecurity("FORBIDDEN_ATTEMPT", `SSRF blocked attempt to access internal URL: ${cleanUrl}`, req, session);
    return res.status(403).json({ success: false, error: "Access denied: Target URL is not allowed." });
  }
  if (!cleanUrl.startsWith("https://script.google.com/macros/s/")) {
    if (cleanUrl.includes("docs.google.com/spreadsheets/d/")) {
      const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = match ? match[1] : void 0;
      const gidMatch = cleanUrl.match(/[#&?]gid=([0-9]+)/);
      const requestedGid = gidMatch ? gidMatch[1] : req.body && (req.body.gid || req.body.tabGid);
      const requestedTab = req.body && (req.body.tab || req.body.tabName) || "";
      if (sheetId) {
        try {
          if (requestedGid) {
            try {
              const gidUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${requestedGid}`;
              const gidRes = await fetch(gidUrl);
              if (gidRes.ok) {
                const csv = await gidRes.text();
                if (csv && csv.trim().length > 10 && !csv.includes("<!DOCTYPE html>")) {
                  return res.json({
                    success: true,
                    csv,
                    sheetId,
                    gid: requestedGid,
                    tab: requestedTab || `gid-${requestedGid}`,
                    latencyMs: Date.now() - startTime
                  });
                }
              }
            } catch (gidErr) {
              console.warn("GID direct CSV fetch failed, falling back to XLSX:", gidErr);
            }
          }
          try {
            const xlsxUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
            const xlsxRes = await fetch(xlsxUrl);
            if (xlsxRes.ok) {
              const arrayBuffer = await xlsxRes.arrayBuffer();
              const wb = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
              const tabDetails = wb.SheetNames.map((name) => {
                const ws = wb.Sheets[name];
                const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const hasPassport = rawRows.some(
                  (r, i) => i < 5 && Array.isArray(r) && r.some((c) => {
                    const str = String(c || "").toLowerCase();
                    return str.includes("passport") || str.includes("\u062C\u0648\u0627\u0632") || str.includes("pass") || str.includes("\u09AA\u09BE\u09B8\u09AA\u09CB\u09B0\u09CD\u099F");
                  })
                );
                const hasIqama = rawRows.some(
                  (r, i) => i < 5 && Array.isArray(r) && r.some((c) => {
                    const str = String(c || "").toLowerCase();
                    return str.includes("iqama") || str.includes("\u0625\u0642\u0627\u0645\u0629") || str.includes("national id") || str.includes("\u0647\u0648\u064A\u0629");
                  })
                );
                return {
                  name,
                  rowCount: rawRows.length,
                  hasPassport,
                  hasIqama
                };
              });
              const sortedByRows = tabDetails.slice().sort((a, b) => b.rowCount - a.rowCount);
              const maxRowTab = sortedByRows[0];
              let bestTab = requestedTab ? tabDetails.find((t) => t.name.toLowerCase().includes(requestedTab.toLowerCase())) : void 0;
              if (!bestTab) {
                if (maxRowTab && maxRowTab.rowCount > 1500) {
                  bestTab = maxRowTab;
                } else {
                  bestTab = tabDetails.find((t) => t.hasPassport && t.rowCount > 50) || tabDetails.find((t) => t.name.toLowerCase().includes("blank") || t.name.toLowerCase().includes("form")) || tabDetails.find((t) => t.hasPassport) || maxRowTab;
                }
              }
              if (bestTab) {
                const activeWs = wb.Sheets[bestTab.name];
                const rawRows = XLSX.utils.sheet_to_json(activeWs, { header: 1 });
                return res.json({
                  success: true,
                  sheetId,
                  selectedTab: bestTab.name,
                  rowCount: rawRows.length,
                  rawRows,
                  availableTabs: tabDetails.map((t) => ({ name: t.name, rowCount: t.rowCount, hasPassport: t.hasPassport })),
                  latencyMs: Date.now() - startTime
                });
              }
            }
          } catch (xlsxErr) {
            console.warn("Direct XLSX workbook export failed, trying CSV fallbacks:", xlsxErr);
          }
          const tabNamesToTry = [requestedTab, "Bank Froms", "Bank From", "Blank Forms", "Blank Form", "Blank From", "16. Blank Forms"].filter(Boolean);
          for (const tab of tabNamesToTry) {
            const fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
            const csvRes = await fetch(fetchUrl);
            if (csvRes.ok) {
              const csv = await csvRes.text();
              if (csv && csv.trim().length > 10 && !csv.includes("<!DOCTYPE html>")) {
                return res.json({
                  success: true,
                  csv,
                  sheetId,
                  tab,
                  latencyMs: Date.now() - startTime
                });
              }
            }
          }
          const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
          const expRes = await fetch(exportUrl);
          if (expRes.ok) {
            const csv = await expRes.text();
            if (csv && csv.trim().length > 10 && !csv.includes("<!DOCTYPE html>")) {
              return res.json({
                success: true,
                csv,
                sheetId,
                latencyMs: Date.now() - startTime
              });
            }
          }
        } catch (csvErr) {
          console.warn("Direct spreadsheet fetch error in proxy:", csvErr);
        }
      }
      return res.json({
        success: false,
        error: 'Direct Google Spreadsheet link provided. To sync directly, set spreadsheet sharing to "Anyone with the link can view", or check the sheet link.',
        isSheetLink: true,
        sheetId,
        diagnosis: "SHEET_LINK_PROVIDED"
      });
    }
    if (cleanUrl.includes("/edit") || cleanUrl.includes("/dev")) {
      const fixedUrl = cleanUrl.replace(/\/(edit|dev)(\?.*)?$/, "/exec");
      return res.json({
        success: false,
        error: `Your URL ends in /edit or /dev. Google Apps Script Web Apps require the deployed /exec URL. Try: ${fixedUrl}`,
        suggestedUrl: fixedUrl,
        diagnosis: "DEV_URL_PROVIDED"
      });
    }
  }
  const bodyObj = body && typeof body === "object" ? body : {};
  const tabOrFacility = req.body && (req.body.tab || req.body.facility || req.body.facilityName || req.body.tabName) || (bodyObj.tab || bodyObj.facility || bodyObj.facilityName || bodyObj.tabName) || "";
  const isReadAction = method.toUpperCase() === "GET" && (effectiveAction === "getAll" || effectiveAction === "getAllBookings" || effectiveAction === "getBookings" || effectiveAction === "getFacilityBookings" || effectiveAction === "ping" || effectiveAction === "getFacilities" || effectiveAction === "getHandover" || effectiveAction === "getParcels" || effectiveAction === "getLostFound" || effectiveAction === "getIsolation" || effectiveAction === "getBlankForms" || effectiveAction === "getBlankFromEmployees" || effectiveAction === "getBlankFormsData" || effectiveAction === "getBlankFormsEmployees" || effectiveAction === "getAutoFormData" || effectiveAction === "getInvoices" || effectiveAction === "getNotices" || effectiveAction === "getSupportTickets" || effectiveAction === "getWorkOrderTickets" || effectiveAction === "getSlaPolicies" || effectiveAction === "getWorkflows" || effectiveAction === "getEmailLogs");
  const cacheKey = `${cleanUrl}_${effectiveAction}_${tabOrFacility}`;
  const shouldSkipCache = Boolean(
    req.body.skipCache || req.body.fresh || req.body.forceFresh || bodyObj.skipCache || bodyObj.fresh || bodyObj.forceFresh || !isReadAction
  );
  if (shouldSkipCache) {
    if (!isReadAction) {
      invalidateGasCache();
    }
  } else {
    const cached = gasCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        ...cached.data,
        cached: true,
        latencyMs: Date.now() - startTime
      });
    }
    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      try {
        const result = await inFlight;
        return res.json({
          ...result,
          coalesced: true,
          latencyMs: Date.now() - startTime
        });
      } catch (e) {
      }
    }
  }
  const executeFetch = async () => {
    let fetchUrl = cleanUrl;
    let fetchOptions = {
      redirect: "follow",
      headers: {
        "User-Agent": "ExecutiveFacilityPortal/1.0"
      }
    };
    if (method.toUpperCase() === "GET") {
      const separator = fetchUrl.includes("?") ? "&" : "?";
      const qParams = new URLSearchParams();
      qParams.set("action", action || effectiveAction);
      qParams.set("t", String(Date.now()));
      const tabVal = req.body.tab || bodyObj.tab || req.body.tabName || bodyObj.tabName;
      const facVal = req.body.facility || bodyObj.facility || req.body.facilityName || bodyObj.facilityName;
      const facIdVal = req.body.facilityId || bodyObj.facilityId;
      const dateVal = req.body.date || bodyObj.date;
      const stageVal = req.body.stage || bodyObj.stage;
      const qVal = req.body.q || bodyObj.q || req.body.query || bodyObj.query;
      if (tabVal) {
        qParams.set("tab", tabVal);
        qParams.set("tabName", tabVal);
      }
      if (facVal) {
        qParams.set("facility", facVal);
        qParams.set("facilityName", facVal);
      }
      if (facIdVal) qParams.set("facilityId", facIdVal);
      if (dateVal) qParams.set("date", dateVal);
      if (stageVal) qParams.set("stage", stageVal);
      if (qVal) qParams.set("q", qVal);
      fetchUrl = `${fetchUrl}${separator}${qParams.toString()}`;
      fetchOptions.method = "GET";
    } else {
      fetchOptions.method = "POST";
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "Content-Type": "application/json"
      };
      fetchOptions.body = JSON.stringify(body || { action });
    }
    let lastError = null;
    const fetchTimeoutMs = action === "getAll" || action === "syncAll" ? 6e4 : 35e3;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
        const response = await fetch(fetchUrl, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs2 = Date.now() - startTime;
        const contentType = response.headers.get("content-type") || "";
        const rawText = await response.text();
        if (contentType.includes("text/html") || rawText.includes("accounts.google.com") || rawText.includes("ServiceLogin") || rawText.includes("Sign in - Google Accounts") || rawText.includes("<!DOCTYPE html>")) {
          if (rawText.includes("too many scripts running simultaneously") || rawText.includes("Service invoked too many times")) {
            return {
              success: false,
              status: 429,
              latencyMs: latencyMs2,
              contentType,
              error: "Google Sheets Rate Limit: Google Apps Script concurrent quota reached. Retrying automatically.",
              diagnosis: "RATE_LIMITED",
              suggestedUrl: cleanUrl
            };
          }
          return {
            success: false,
            status: response.status,
            latencyMs: latencyMs2,
            contentType,
            error: 'Permission Denied (Google Login Required). When deploying your Apps Script Web App, you must set "Who has access" to "Anyone" (not "Only myself").',
            diagnosis: "AUTH_REQUIRED",
            suggestedUrl: cleanUrl
          };
        }
        try {
          const jsonData = JSON.parse(rawText);
          const resPayload = {
            success: jsonData.success !== false,
            status: response.status,
            latencyMs: latencyMs2,
            data: jsonData,
            error: jsonData.error
          };
          if (isReadAction && resPayload.success) {
            gasCache.set(cacheKey, { timestamp: Date.now(), data: resPayload });
            const isBookingsAction = action === "getAll" || action === "getBookings" || action === "getFacilityBookings" || action === "getAllBookings";
            if (isBookingsAction && jsonData.bookings && Array.isArray(jsonData.bookings)) {
              try {
                const bMap = /* @__PURE__ */ new Map();
                hubState.bookings.forEach((b) => {
                  if (b && b.id) bMap.set(String(b.id).toLowerCase().trim(), b);
                });
                jsonData.bookings.forEach((b) => {
                  if (b && b.id) {
                    const k = String(b.id).toLowerCase().trim();
                    if (!hubState.deletedIds[k]) {
                      bMap.set(k, b);
                    }
                  }
                });
                hubState.bookings = Array.from(bMap.values());
                if (Array.isArray(jsonData.handovers)) {
                  hubState.handovers = jsonData.handovers;
                }
                if (Array.isArray(jsonData.isolationRooms)) {
                  hubState.isolationRooms = jsonData.isolationRooms;
                }
                await persistHubState();
              } catch (mergeErr) {
              }
            }
          }
          if (resPayload.success) {
            try {
              const reqAction = body && body.action || action || effectiveAction;
              if (reqAction === "createBooking" || reqAction === "batchCreateBookings") {
                const newBookings = reqAction === "batchCreateBookings" ? body?.bookings || [] : [jsonData?.booking || body?.booking].filter(Boolean);
                newBookings.forEach((nb) => {
                  if (nb && nb.id) {
                    const k = String(nb.id).toLowerCase().trim();
                    const idx = hubState.bookings.findIndex((b) => String(b.id || "").toLowerCase().trim() === k);
                    if (idx >= 0) {
                      hubState.bookings[idx] = { ...hubState.bookings[idx], ...nb };
                    } else {
                      hubState.bookings.unshift(nb);
                    }
                    broadcastHubEvent({ type: "UPSERT", entity: "bookings", payload: nb, version: hubState.version });
                  }
                });
                await persistHubState();
              } else if (reqAction === "cancelBooking") {
                const cancelId = String(body?.bookingId || body?.id || jsonData?.bookingId || "").toLowerCase().trim();
                if (cancelId) {
                  hubState.cancelledIds[cancelId] = Date.now();
                  hubState.bookings = hubState.bookings.map((b) => {
                    if (String(b.id || "").toLowerCase().trim() === cancelId) {
                      return { ...b, status: "CANCELLED", cancellationReason: body?.reason || "Cancelled" };
                    }
                    return b;
                  });
                  await persistHubState();
                  broadcastHubEvent({ type: "CANCEL", entity: "bookings", id: cancelId, payload: { reason: body?.reason }, version: hubState.version });
                }
              } else if (reqAction === "deleteBooking") {
                const delId = String(body?.bookingId || body?.id || "").toLowerCase().trim();
                if (delId) {
                  hubState.deletedIds[delId] = Date.now();
                  hubState.bookings = hubState.bookings.filter((b) => String(b.id || "").toLowerCase().trim() !== delId);
                  await persistHubState();
                  broadcastHubEvent({ type: "DELETE", entity: "bookings", id: delId, version: hubState.version });
                }
              }
            } catch (broadcastErr) {
            }
          }
          return resPayload;
        } catch (parseErr) {
          return {
            success: false,
            status: response.status,
            latencyMs: latencyMs2,
            contentType,
            rawResponse: rawText.substring(0, 500),
            error: `Received non-JSON response from Google Apps Script (HTTP ${response.status}): ${rawText.substring(0, 150)}...`,
            diagnosis: "INVALID_JSON_RESPONSE"
          };
        }
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      error: `Network error connecting to Google Apps Script: ${lastError?.message || lastError}`,
      diagnosis: "NETWORK_ERROR"
    };
  };
  try {
    let fetchPromise = executeFetch();
    if (isReadAction) {
      inFlightRequests.set(cacheKey, fetchPromise);
    }
    const result = await fetchPromise;
    if (isReadAction) {
      inFlightRequests.delete(cacheKey);
    }
    return res.json(result);
  } catch (finalErr) {
    if (isReadAction) {
      inFlightRequests.delete(cacheKey);
    }
    return res.json({
      success: false,
      latencyMs: Date.now() - startTime,
      error: `Internal server proxy error: ${finalErr.message || finalErr}`,
      diagnosis: "NETWORK_ERROR"
    });
  }
});
app.get("/api/gas/sheet-data", async (req, res) => {
  const { sheetId, tabName = "Barber Booking" } = req.query;
  if (!sheetId || typeof sheetId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Missing sheetId parameter."
    });
  }
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(String(tabName))}`;
    const response = await fetch(gvizUrl);
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch Google Sheet data. Make sure the Google Sheet sharing is set to "Anyone with the link can view".`
      });
    }
    const text = await response.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match || !match[1]) {
      return res.status(400).json({
        success: false,
        error: "Unable to parse Google Sheet data format. Verify the sheet is public or use Google Apps Script Web App."
      });
    }
    const data = JSON.parse(match[1]);
    return res.json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Error querying Google Sheet: ${err.message || err}`
    });
  }
});
function getGreenApiCandidateHosts(cleanId, customApiUrl) {
  const list = [];
  if (customApiUrl) {
    const cleanUrl = String(customApiUrl).trim().replace(/\/+$/, "");
    if (cleanUrl.startsWith("http")) {
      list.push(cleanUrl);
    }
  }
  if (!list.includes("https://api.green-api.com")) {
    list.push("https://api.green-api.com");
  }
  if (cleanId.length >= 4) {
    const cluster = cleanId.slice(0, 4);
    const subNoHyphen = `https://${cluster}.api.greenapi.com`;
    const subHyphen = `https://${cluster}.api.green-api.com`;
    if (!list.includes(subNoHyphen)) list.push(subNoHyphen);
    if (!list.includes(subHyphen)) list.push(subHyphen);
  }
  if (!list.includes("https://api.greenapi.com")) {
    list.push("https://api.greenapi.com");
  }
  if (!list.includes("https://media.green-api.com")) {
    list.push("https://media.green-api.com");
  }
  return list;
}
app.post("/api/green-api/get-chats", async (req, res) => {
  const { instanceId, apiToken, apiUrl } = req.body || {};
  const cleanId = String(instanceId || "").trim();
  const cleanToken = String(apiToken || "").trim();
  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: "Instance ID and API Token are required." });
  }
  const hosts = getGreenApiCandidateHosts(cleanId, apiUrl);
  let lastError = "Failed to fetch WhatsApp chats";
  for (const host of hosts) {
    try {
      const url = `${host}/waInstance${cleanId}/getChats/${cleanToken}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const chats = await response.json();
        return res.json({ success: true, chats, activeHost: host });
      } else {
        const errBody = await response.text();
        lastError = `Green API returned ${response.status}: ${errBody || response.statusText}`;
      }
    } catch (err) {
      lastError = err.message || "Connection failed";
    }
  }
  return res.status(500).json({ success: false, error: lastError });
});
app.post("/api/green-api/status", async (req, res) => {
  const { instanceId, apiToken, apiUrl } = req.body || {};
  const cleanId = String(instanceId || "").trim();
  const cleanToken = String(apiToken || "").trim();
  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: "Instance ID and API Token are required.", message: "Instance ID and API Token are required." });
  }
  const hosts = getGreenApiCandidateHosts(cleanId, apiUrl);
  let lastError = "Failed to query Green API status";
  let respondedState = null;
  for (const host of hosts) {
    try {
      const stateUrl = `${host}/waInstance${cleanId}/getStateInstance/${cleanToken}`;
      const stateRes = await fetch(stateUrl);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        respondedState = { host, data: stateData };
        break;
      } else if (stateRes.status === 401 || stateRes.status === 403) {
        return res.json({
          success: false,
          state: "unauthorized",
          message: "Invalid Green API Instance ID or API Token. Please verify in your green-api.com dashboard.",
          activeHost: host
        });
      } else {
        const errText = await stateRes.text();
        lastError = `HTTP ${stateRes.status}: ${errText || stateRes.statusText}`;
      }
    } catch (err) {
      lastError = err.message || "Network error";
    }
  }
  if (respondedState) {
    const stateInstance = respondedState.data?.stateInstance || "unknown";
    let phone = "";
    try {
      const waUrl = `${respondedState.host}/waInstance${cleanId}/getWaSettings/${cleanToken}`;
      const waRes = await fetch(waUrl);
      if (waRes.ok) {
        const waData = await waRes.json();
        phone = waData?.phone || "";
      }
    } catch {
    }
    const isAuthorized = stateInstance === "authorized";
    let message = "";
    if (isAuthorized) {
      message = "Green API Instance is ONLINE and AUTHORIZED!";
    } else if (stateInstance === "notAuthorized") {
      message = "Green API connected! WhatsApp account is not linked. Please scan the QR code in your green-api.com console.";
    } else if (stateInstance === "sleepMode") {
      message = "WhatsApp phone is in Sleep Mode or screen locked. Open WhatsApp on phone to wake it up.";
    } else if (stateInstance === "blocked") {
      message = "WhatsApp account or instance is blocked by Green API.";
    } else if (stateInstance === "starting") {
      message = "Green API instance is starting up. Please wait 10-20 seconds and retry.";
    } else {
      message = `Green API Instance state: "${stateInstance}".`;
    }
    return res.json({
      success: isAuthorized,
      state: stateInstance,
      phone,
      activeHost: respondedState.host,
      message
    });
  }
  return res.json({
    success: false,
    state: "error",
    message: `Network error connecting to Green API: ${lastError}`,
    error: lastError
  });
});
app.post("/api/green-api/get-group-data", async (req, res) => {
  const { instanceId, apiToken, groupId, apiUrl } = req.body || {};
  const cleanId = String(instanceId || "").trim();
  const cleanToken = String(apiToken || "").trim();
  let cleanGroup = String(groupId || "").trim();
  if (!cleanId || !cleanToken || !cleanGroup) {
    return res.status(400).json({ success: false, error: "Instance ID, API Token, and Group ID are required." });
  }
  if (!cleanGroup.includes("@")) {
    cleanGroup = `${cleanGroup}@g.us`;
  }
  const hosts = getGreenApiCandidateHosts(cleanId, apiUrl);
  for (const host of hosts) {
    try {
      const url = `${host}/waInstance${cleanId}/getGroupData/${cleanToken}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: cleanGroup })
      });
      if (r.ok) {
        const data = await r.json();
        return res.json({ success: true, groupData: data, activeHost: host });
      }
    } catch {
    }
  }
  return res.status(404).json({ success: false, error: "Group data could not be retrieved from Green API." });
});
app.post("/api/green-api/set-settings", async (req, res) => {
  const { instanceId, apiToken, apiUrl } = req.body || {};
  const cleanId = String(instanceId || "").trim();
  const cleanToken = String(apiToken || "").trim();
  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: "Instance ID and API Token are required." });
  }
  const hosts = getGreenApiCandidateHosts(cleanId, apiUrl);
  for (const host of hosts) {
    try {
      const url = `${host}/waInstance${cleanId}/setSettings/${cleanToken}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomingWebhook: "yes",
          outgoingWebhook: "yes",
          outgoingMessageWebhook: "yes",
          stateWebhook: "yes"
        })
      });
      if (r.ok) {
        const data = await r.json();
        return res.json({ success: true, data, activeHost: host });
      }
    } catch {
    }
  }
  return res.status(500).json({ success: false, error: "Failed to update Green API settings." });
});
app.post("/api/green-api/get-messages", async (req, res) => {
  const { instanceId, apiToken, chatId, count = 50, apiUrl } = req.body || {};
  const cleanId = String(instanceId || "").trim();
  const cleanToken = String(apiToken || "").trim();
  let cleanChat = String(chatId || "").trim();
  if (!cleanId || !cleanToken) {
    return res.status(400).json({ success: false, error: "Instance ID and API Token are required." });
  }
  if (cleanChat && !cleanChat.includes("@")) {
    cleanChat = `${cleanChat}@g.us`;
  }
  const hosts = getGreenApiCandidateHosts(cleanId, apiUrl);
  try {
    const rawCollected = [];
    const deletedIds = /* @__PURE__ */ new Set();
    if (cleanChat) {
      for (const host of hosts) {
        try {
          const url = `${host}/waInstance${cleanId}/getChatHistory/${cleanToken}`;
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: cleanChat, count: Math.max(Number(count) || 50, 100) })
          });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              for (const m of data) {
                if (!m) continue;
                const mChat = String(m.chatId || "").toLowerCase();
                if (!mChat || mChat === cleanChat.toLowerCase()) {
                  rawCollected.push(m);
                }
              }
              break;
            }
          }
        } catch (e) {
          console.warn(`Error querying ${host}/getChatHistory:`, e);
        }
      }
    }
    for (const host of hosts) {
      try {
        const fallbackUrl = `${host}/waInstance${cleanId}/lastIncomingMessages/${cleanToken}?minutes=7200`;
        const fallbackRes = await fetch(fallbackUrl, { method: "GET" });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            const cleanChatNoSuffix = cleanChat ? cleanChat.replace(/@.*$/, "").toLowerCase() : "";
            for (const m of fallbackData) {
              if (!m) continue;
              if (cleanChat) {
                const mChat = String(m.chatId || m.senderId || "").toLowerCase();
                if (mChat === cleanChat.toLowerCase() || cleanChatNoSuffix && mChat.startsWith(cleanChatNoSuffix)) {
                  rawCollected.push(m);
                }
              } else {
                rawCollected.push(m);
              }
            }
            break;
          }
        }
      } catch (e) {
        console.warn(`Error querying ${host}/lastIncomingMessages:`, e);
      }
    }
    for (const m of rawCollected) {
      if (m.deletedMessageId) {
        deletedIds.add(String(m.deletedMessageId));
      }
      if (m.isDeleted === true || m.typeMessage === "deletedMessage" || m.type === "deletedMessage" || m.status === "deleted") {
        const msgId = m.idMessage || m.id || m.stanzaId;
        if (msgId) deletedIds.add(String(msgId));
      }
    }
    const seenMsgKeys = /* @__PURE__ */ new Set();
    const validMessages = [];
    for (const m of rawCollected) {
      const msgId = String(m.idMessage || m.id || m.stanzaId || "");
      if (m.isDeleted === true || m.typeMessage === "deletedMessage" || m.type === "deletedMessage" || m.status === "deleted" || msgId && deletedIds.has(msgId)) {
        continue;
      }
      const textCheck = String(m.textMessage || m.caption || m.message || "").trim().toLowerCase();
      if (textCheck === "this message was deleted" || textCheck === "this message has been deleted" || textCheck === "you deleted this message") {
        continue;
      }
      const dedupKey = msgId || `${m.timestamp}-${textCheck.slice(0, 30)}`;
      if (seenMsgKeys.has(dedupKey)) {
        continue;
      }
      seenMsgKeys.add(dedupKey);
      validMessages.push(m);
    }
    validMessages.sort((a, b) => {
      const tA = typeof a.timestamp === "number" ? a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1e3 : 0;
      const tB = typeof b.timestamp === "number" ? b.timestamp > 1e11 ? b.timestamp : b.timestamp * 1e3 : 0;
      return tB - tA;
    });
    return res.json({
      success: true,
      messages: validMessages,
      count: validMessages.length,
      chatId: cleanChat,
      fetchMethod: "hybrid-chatHistory-and-lastIncoming-live"
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Failed to fetch group messages" });
  }
});
var WA_CONFIG_FILE_PATH = import_path.default.join(process.cwd(), "tamimi_whatsapp_cfg.json");
var persistedWaConfig = null;
try {
  if (import_fs.default.existsSync(WA_CONFIG_FILE_PATH)) {
    const raw = import_fs.default.readFileSync(WA_CONFIG_FILE_PATH, "utf-8");
    persistedWaConfig = JSON.parse(raw);
    console.log("[Server WhatsApp] Loaded persisted credentials from disk.");
  }
} catch (err) {
  console.warn("[Server WhatsApp] Failed to load persisted WA config from file:", err);
}
var webhookMessageBuffer = [];
app.get("/api/whatsapp-universal/config", (req, res) => {
  return res.json({ success: true, config: persistedWaConfig || null });
});
app.post("/api/whatsapp-universal/config", (req, res) => {
  try {
    const incoming = req.body || {};
    persistedWaConfig = {
      ...persistedWaConfig || {},
      ...incoming,
      lastSavedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    import_fs.default.writeFileSync(WA_CONFIG_FILE_PATH, JSON.stringify(persistedWaConfig, null, 2), "utf-8");
    console.log("[Server WhatsApp] Successfully saved configuration to disk.");
    return res.json({ success: true, config: persistedWaConfig });
  } catch (err) {
    console.error("[Server WhatsApp] Error saving config to disk:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/whatsapp-universal/test", async (req, res) => {
  try {
    const { provider, config = {} } = req.body;
    if (provider === "green_api") {
      const cleanId = String(config.instanceId || "").trim();
      const cleanToken = String(config.apiToken || "").trim();
      if (!cleanId || !cleanToken) {
        return res.json({ success: false, message: "Instance ID and API Token are required." });
      }
      const hosts = getGreenApiCandidateHosts(cleanId, config.apiUrl);
      let lastError = "Unable to connect to Green API";
      let respondedState = null;
      for (const host of hosts) {
        try {
          const response = await fetch(`${host}/waInstance${cleanId}/getStateInstance/${cleanToken}`);
          if (response.ok) {
            const data = await response.json();
            respondedState = { host, data };
            break;
          } else if (response.status === 401 || response.status === 403) {
            return res.json({
              success: false,
              state: "unauthorized",
              message: "Invalid Green API Instance ID or API Token. Please check your credentials in green-api.com.",
              activeHost: host
            });
          } else {
            const errText = await response.text();
            lastError = `HTTP ${response.status}: ${errText || response.statusText}`;
          }
        } catch (err) {
          lastError = err.message || "Network error";
        }
      }
      if (respondedState) {
        const stateInstance = respondedState.data?.stateInstance || "unknown";
        const isAuth = stateInstance === "authorized";
        let message = "";
        if (isAuth) {
          message = "Green API Instance is ONLINE and AUTHORIZED!";
        } else if (stateInstance === "notAuthorized") {
          message = "Green API connected! WhatsApp account is not linked. Please scan the QR code in your green-api.com dashboard.";
        } else if (stateInstance === "sleepMode") {
          message = "WhatsApp phone is in Sleep Mode. Open WhatsApp on your phone to reconnect.";
        } else if (stateInstance === "blocked") {
          message = "WhatsApp instance is blocked by Green API.";
        } else if (stateInstance === "starting") {
          message = "Green API instance is starting up. Please retry in a few moments.";
        } else {
          message = `Green API Instance state: "${stateInstance}".`;
        }
        return res.json({
          success: isAuth,
          state: stateInstance,
          activeHost: respondedState.host,
          message
        });
      }
      return res.json({
        success: false,
        state: "error",
        message: `Failed to connect to Green API: ${lastError}`,
        error: lastError
      });
    }
    if (provider === "meta_cloud") {
      const { phoneNumberId, accessToken } = config;
      if (!phoneNumberId || !accessToken) {
        return res.json({ success: false, message: "Phone Number ID and System Access Token are required." });
      }
      const graphUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}?access_token=${accessToken}`;
      const response = await fetch(graphUrl);
      const data = await response.json();
      if (response.ok && data.id) {
        return res.json({
          success: true,
          message: `Meta WhatsApp Cloud API Connected! Verified Number: ${data.display_phone_number || data.id} (${data.verified_name || "Business Account"})`,
          details: data
        });
      }
      return res.json({
        success: false,
        message: data.error?.message || "Failed to authenticate with Meta WhatsApp Cloud API."
      });
    }
    if (provider === "custom_gateway") {
      const { endpointUrl, apiKey, authHeaderName = "Authorization", authScheme = "Bearer" } = config;
      if (!endpointUrl) {
        return res.json({ success: false, message: "Custom Gateway Endpoint URL is required." });
      }
      const headers = { "Content-Type": "application/json" };
      if (apiKey) {
        if (authScheme === "Bearer") {
          headers[authHeaderName] = `Bearer ${apiKey.trim()}`;
        } else if (authScheme === "ApiKey" || authScheme === "Custom" || authScheme === "None") {
          headers[authHeaderName] = apiKey.trim();
        }
      }
      const response = await fetch(endpointUrl, {
        method: "GET",
        headers
      }).catch(async () => {
        return await fetch(endpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "ping", test: true })
        });
      });
      if (response && response.ok) {
        return res.json({
          success: true,
          message: `Universal Gateway connected successfully! HTTP ${response.status}`
        });
      }
      return res.json({
        success: false,
        message: `Gateway responded with HTTP ${response?.status || "500"}: ${response?.statusText || "Unable to connect"}`
      });
    }
    return res.json({ success: false, message: `Unknown provider: ${provider}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Universal gateway test error" });
  }
});
app.all("/api/whatsapp/incoming", (req, res) => {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && challenge) {
      return res.status(200).send(challenge);
    }
    return res.json({ status: "active", message: "WhatsApp Universal Webhook Listener Ready" });
  }
  const body = req.body || {};
  webhookMessageBuffer.unshift({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    payload: body
  });
  if (webhookMessageBuffer.length > 200) webhookMessageBuffer.pop();
  return res.json({ success: true, receivedAt: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/whatsapp/incoming-buffer", (req, res) => {
  return res.json({ success: true, count: webhookMessageBuffer.length, buffer: webhookMessageBuffer });
});
app.post("/api/export-excel", async (req, res) => {
  try {
    let applyFullBorder = function(sheet) {
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
        });
      });
    }, resolveDepartment = function(desc, currentDept) {
      const specificDepts = [
        "Civil",
        "Electrical",
        "HVAC",
        "Plumbing",
        "Housekeeping",
        "Landscaping",
        "Waste Management",
        "Pest Control",
        "HSE",
        "Fire Department"
      ];
      const trimmed = (currentDept || "").trim();
      if (trimmed && specificDepts.includes(trimmed)) {
        return trimmed;
      }
      const text = (desc || "").toLowerCase().trim();
      if (!text) return trimmed || "Civil";
      let best = "Civil";
      let maxScore = 0;
      for (const [dept, keywords] of Object.entries(CATEGORY_RULES)) {
        if (!keywords || !Array.isArray(keywords)) continue;
        for (const kw of keywords) {
          const cleanKw = kw.toLowerCase().trim();
          if (!cleanKw) continue;
          let isMatch = false;
          if (cleanKw.length <= 3) {
            const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const wordRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
            isMatch = wordRegex.test(text);
          } else {
            isMatch = text.includes(cleanKw);
          }
          if (isMatch) {
            let score = cleanKw.length * 10;
            if (cleanKw.includes(" ")) score += 30;
            if (text === cleanKw) score += 50;
            if (dept === "Fire Department") score += 15;
            if (dept === "HSE") score += 12;
            if (dept === "Pest Control") score += 10;
            if (score > maxScore) {
              maxScore = score;
              best = dept;
            }
          }
        }
      }
      return best;
    }, getSheetByDepartment = function(wb, department) {
      if (!department) return wb.getWorksheet("Hard Service");
      const dept = String(department).trim();
      if ([
        "Civil",
        "CIVIL",
        "Electrical",
        "HVAC",
        "Plumbing",
        "Hard Service",
        "Hard Services"
      ].includes(dept)) {
        return wb.getWorksheet("Hard Service");
      }
      if ([
        "Housekeeping",
        "Landscaping",
        "Waste Management",
        "Soft",
        "Soft Service",
        "Soft Services",
        "Cleaning"
      ].includes(dept)) {
        return wb.getWorksheet("Soft Services");
      }
      if (dept === "Pest Control") {
        return wb.getWorksheet("Pest Control");
      }
      if (dept === "HSE") {
        return wb.getWorksheet("HSE");
      }
      if (dept === "Fighting" || dept === "Fire Department" || dept === "Fire Fighting") {
        return wb.getWorksheet("Fire Department");
      }
      const dLower = dept.toLowerCase();
      if (dLower.includes("civil") || dLower.includes("elect") || dLower.includes("hvac") || dLower.includes("plumb") || dLower.includes("hard")) {
        return wb.getWorksheet("Hard Service");
      }
      if (dLower.includes("housekeep") || dLower.includes("landscape") || dLower.includes("waste") || dLower.includes("clean") || dLower.includes("soft")) {
        return wb.getWorksheet("Soft Services");
      }
      if (dLower.includes("pest")) return wb.getWorksheet("Pest Control");
      if (dLower.includes("hse") || dLower.includes("safety") || dLower.includes("health")) return wb.getWorksheet("HSE");
      if (dLower.includes("fighting") || dLower.includes("fire")) return wb.getWorksheet("Fire Department");
      return wb.getWorksheet("Hard Service");
    };
    const {
      items = [],
      facilityName = "Tamimi Construction Village",
      contractorName = "Tamimi TAFGA",
      preparedBy = "LIMON RAHMAN",
      dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      fileName,
      categoryKeywords
    } = req.body;
    const workbook = new import_exceljs.default.Workbook();
    workbook.creator = preparedBy;
    workbook.lastModifiedBy = preparedBy;
    const sheetNames = [
      "Hard Service",
      "Soft Services",
      "Pest Control",
      "HSE",
      "Fire Department"
    ];
    sheetNames.forEach((name) => {
      const sheet = workbook.addWorksheet(name);
      sheet.mergeCells("A1:H1");
      sheet.getCell("A1").value = "TAFGA TBCV OBSERVATION REPORT";
      sheet.getCell("A1").font = { size: 18, bold: true };
      sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 32;
      sheet.mergeCells("A2:E2");
      sheet.getCell("A2").value = `Facility/Program: ${facilityName}`;
      sheet.getCell("A2").font = { bold: true };
      sheet.getCell("A2").alignment = { horizontal: "left", vertical: "middle" };
      sheet.getRow(2).height = 22;
      sheet.mergeCells("A3:E3");
      sheet.getCell("A3").value = `Contractor Name: ${contractorName}`;
      sheet.getCell("A3").font = { bold: true };
      sheet.getCell("A3").alignment = { horizontal: "left", vertical: "middle" };
      sheet.getRow(3).height = 22;
      sheet.getCell("F2").value = "Date:";
      sheet.getCell("F2").font = { bold: true };
      sheet.getCell("F2").alignment = { horizontal: "center", vertical: "middle" };
      sheet.mergeCells("G2:H2");
      sheet.getCell("G2").value = dateStr;
      sheet.getCell("G2").alignment = { horizontal: "center", vertical: "middle" };
      sheet.getCell("F3").value = "Prepared By:";
      sheet.getCell("F3").font = { bold: true };
      sheet.getCell("F3").alignment = { horizontal: "center", vertical: "middle" };
      sheet.mergeCells("G3:H3");
      sheet.getCell("G3").value = preparedBy;
      sheet.getCell("G3").alignment = { horizontal: "center", vertical: "middle" };
      const headers = [
        "No.",
        "Location",
        "Department",
        "Description",
        "Ticket Number",
        "Picture",
        "Close Out Picture",
        "Status"
      ];
      sheet.getRow(4).values = headers;
      sheet.getRow(4).height = 28;
      sheet.columns = [
        { key: "sl", width: 6 },
        { key: "location", width: 18 },
        { key: "department", width: 18 },
        { key: "desc", width: 42 },
        { key: "ticket", width: 16 },
        { key: "image", width: 28 },
        { key: "closeout", width: 28 },
        { key: "status", width: 15 }
      ];
      const headerRow = sheet.getRow(4);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9D9D9" }
        };
      });
      for (let r = 1; r <= 4; r++) {
        for (let c = 1; c <= 8; c++) {
          sheet.getRow(r).getCell(c).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
        }
      }
    });
    const CATEGORY_RULES = categoryKeywords || {
      "Civil": [
        "steel plate flooring",
        "steel plate",
        "ceiling cover",
        "ceiling tile",
        "door handle",
        "door lock",
        "shower door lock",
        "shower bath door lock",
        "wall spots",
        "dirty spots on wall",
        "wall paint",
        "wall crack",
        "steel rack",
        "window cotton",
        "curtains",
        "curtain",
        "blinds",
        "handrail",
        "repaint",
        "paint",
        "wall",
        "roof",
        "flooring",
        "tiles",
        "tile",
        "door",
        "lock",
        "handle",
        "window",
        "cabinet",
        "wardrobe",
        "rack",
        "pillar",
        "plaster",
        "masonry",
        "carpentry",
        "welding",
        "stair",
        "stairs",
        "glass",
        "bed",
        "civil",
        "re-touch",
        "retouch",
        "silicon",
        "crack",
        "cement",
        "concrete"
      ],
      "Electrical": [
        "busted ceiling light",
        "ceiling light",
        "led light",
        "damaged led light",
        "mirror lights blinking",
        "lights blinking",
        "lights flickering",
        "tube light",
        "spot light",
        "exhaust fan",
        "ceiling fan",
        "short circuit",
        "power cut",
        "no power",
        "distribution board",
        "electrical panel",
        "mcb",
        "breaker",
        "wiring",
        "cable",
        "wire",
        "switch",
        "socket",
        "plug",
        "light",
        "lights",
        "lamp",
        "bulb",
        "led",
        "blinking",
        "fan",
        "electrical",
        "electric",
        "panel"
      ],
      "HVAC": [
        "outdoor ac unit pipe hole",
        "outdoor ac unit",
        "indoor ac unit",
        "outdoor ac",
        "indoor ac",
        "pipe hole",
        "proper insulation",
        "insulation",
        "ac not cooling",
        "not cooling",
        "low cooling",
        "no cooling",
        "ac water leak",
        "ac water leaking",
        "ac dripping",
        "ac drainage",
        "ac leak",
        "air conditioner",
        "air conditioning",
        "ac unit",
        "chiller",
        "cooling",
        "compressor",
        "thermostat",
        "freon",
        "gas leak",
        "duct",
        "filter",
        "ventilation",
        "ac",
        "a/c",
        "hvac"
      ],
      "Plumbing": [
        "water not draining properly",
        "water not draining",
        "shower tray",
        "shower bath",
        "shower mixer",
        "drain cover",
        "handspray",
        "hand spray",
        "shattaf",
        "bidet spray",
        "flush tank leaking",
        "flush tank not working",
        "flush tank",
        "flush button",
        "toilet bowl",
        "commode",
        "wash basin",
        "water heater",
        "water leak",
        "leaking water",
        "pipe burst",
        "pipe leak",
        "angle valve",
        "tap leaking",
        "faucet",
        "tap",
        "draining",
        "drain",
        "water",
        "leaking",
        "leak",
        "leakage",
        "shower",
        "flush",
        "pipe",
        "sink",
        "basin",
        "toilet",
        "bidet",
        "tank",
        "valve",
        "sewer",
        "sewage",
        "clogged",
        "plumbing"
      ],
      "Housekeeping": [
        "deep cleaning",
        "corridor cleaning",
        "room cleaning",
        "cabinet cleaning",
        "curb stone cleaning",
        "steel plate cleaning",
        "ablution cleaning",
        "bed sheet",
        "bed sheets",
        "linen",
        "blanket",
        "pillow",
        "towel",
        "laundry",
        "cleaning",
        "housekeeping",
        "mop",
        "sweeping",
        "janitor",
        "dust",
        "dirty",
        "dirty spots",
        "stains",
        "stain",
        "kettle cleaning",
        "kettle",
        "unwanted material",
        "arranging material",
        "diesel cleaning"
      ],
      "Landscaping": [
        "tree need trimming",
        "tree trimming",
        "dry leaves removal",
        "dry leaves",
        "grass cutting",
        "lawn mowing",
        "artificial grass",
        "irrigation pipe",
        "irrigation",
        "watering plants",
        "watering",
        "gardening",
        "garden",
        "landscaping",
        "landscape",
        "plants",
        "plant",
        "grass",
        "lawn",
        "trees",
        "tree",
        "trimming",
        "pruning",
        "leaves",
        "flower",
        "soil"
      ],
      "Waste Management": [
        "waste management",
        "waste bin signage",
        "waste bin",
        "waste bins",
        "garbage bin",
        "trash bin",
        "dustbin",
        "wheelie bin",
        "dumpster",
        "skip",
        "overflowing bin",
        "litter picking",
        "little picking",
        "trash collection",
        "waste collection",
        "discarded material",
        "discard damaged",
        "scrap disposal",
        "garbage",
        "trash",
        "waste",
        "bin",
        "bins",
        "rubbish",
        "litter",
        "discard",
        "debris",
        "dump",
        "scrap",
        "recycling"
      ],
      "Pest Control": [
        "pest control",
        "spray pest",
        "pest spray",
        "pest spraying",
        "bedbugs treatment",
        "bedbugs need pest treatment",
        "bedbugs",
        "bedbug",
        "cockroaches",
        "cockroach",
        "insects",
        "insect",
        "termites",
        "mosquitoes",
        "ants",
        "ant",
        "rodents",
        "rodent",
        "rats",
        "rat",
        "mice",
        "mouse",
        "flies",
        "fly",
        "stray cat",
        "stray dog",
        "stray animals",
        "cats",
        "dogs",
        "pigeons",
        "pigeon",
        "pest",
        "fumigation"
      ],
      "HSE": [
        "trip hazard",
        "slip hazard",
        "slip and fall",
        "safety shoes",
        "hard hat",
        "safety glasses",
        "ppe violation",
        "missing ppe",
        "ppe",
        "first aid box",
        "first aid",
        "eyewash station",
        "eyewash",
        "safety barrier",
        "barricade",
        "caution tape",
        "warning sign",
        "scaffolding safety",
        "scaffold",
        "safety harness",
        "harness",
        "chemical spill",
        "oil spill",
        "diesel spill",
        "spill",
        "hse",
        "health and safety",
        "safety",
        "hazard",
        "danger",
        "slip",
        "fall",
        "warning",
        "health",
        "chemical"
      ],
      "Fire Department": [
        "fire extinguisher expired",
        "fire extinguisher pressure",
        "fire extinguisher",
        "extinguisher",
        "smoke detector beeping",
        "smoke detector",
        "fire alarm ringing",
        "fire alarm panel",
        "fire alarm",
        "break glass unit",
        "break glass",
        "manual call point",
        "fire pump room",
        "fire pump",
        "fire hydrant",
        "hydrant",
        "fire hose reel",
        "fire hose",
        "hose reel",
        "fire sprinkler",
        "sprinkler",
        "fire door blocked",
        "fire door",
        "emergency exit",
        "fire fighting",
        "fire department",
        "fire",
        "fighting"
      ]
    };
    async function downloadImageBuffer(src) {
      if (!src || typeof src !== "string") return null;
      const str = src.trim();
      if (!str) return null;
      try {
        if (str.startsWith("data:image/")) {
          const match = str.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
          if (match) {
            const ext = match[1].toLowerCase() === "png" ? "png" : "jpeg";
            return { buffer: Buffer.from(match[2], "base64"), ext };
          }
          const raw = str.split(",")[1];
          if (raw) return { buffer: Buffer.from(raw, "base64"), ext: "jpeg" };
        } else if (/^[A-Za-z0-9+/=]+$/.test(str) && str.length > 100) {
          return { buffer: Buffer.from(str, "base64"), ext: "jpeg" };
        }
        if (str.startsWith("http://") || str.startsWith("https://")) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1e4);
          const r = await fetch(str, { signal: controller.signal });
          clearTimeout(timer);
          if (r.ok) {
            const ct = r.headers.get("content-type") || "";
            const ext = ct.includes("png") ? "png" : "jpeg";
            const arr = await r.arrayBuffer();
            return { buffer: Buffer.from(arr), ext };
          }
        }
      } catch (err) {
        console.warn("[Excel Export] Failed downloading image:", err);
      }
      return null;
    }
    const serialCounter = {};
    const ROW_HEIGHT = 115;
    for (const item of items) {
      const resolvedDept = resolveDepartment(item.description || item.rawCaption || "", item.department);
      const sheet = getSheetByDepartment(workbook, resolvedDept);
      if (!sheet) continue;
      if (!serialCounter[sheet.name]) {
        serialCounter[sheet.name] = 1;
      }
      const row = sheet.addRow({
        sl: serialCounter[sheet.name],
        location: item.location || "",
        department: resolvedDept,
        desc: item.description || "",
        ticket: item.ticketNumber || "",
        image: "",
        closeout: "",
        status: item.status || "Open"
      });
      row.height = ROW_HEIGHT;
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
      const mainPic = item.picture || item.pictureUrl;
      if (mainPic) {
        const img = await downloadImageBuffer(mainPic);
        if (img) {
          try {
            const imageId = workbook.addImage({
              buffer: img.buffer,
              extension: img.ext
            });
            sheet.addImage(imageId, {
              tl: { col: 5, row: row.number - 1 },
              br: { col: 6, row: row.number },
              editAs: "twoCell"
            });
          } catch (e) {
            console.warn("[Excel Export] Image embed error:", e);
          }
        }
      }
      const closePic = item.closeOutPicture || item.closeout;
      if (closePic) {
        const cImg = await downloadImageBuffer(closePic);
        if (cImg) {
          try {
            const cId = workbook.addImage({
              buffer: cImg.buffer,
              extension: cImg.ext
            });
            sheet.addImage(cId, {
              tl: { col: 6, row: row.number - 1 },
              br: { col: 7, row: row.number },
              editAs: "twoCell"
            });
          } catch (e) {
            console.warn("[Excel Export] Closeout embed error:", e);
          }
        }
      }
      serialCounter[sheet.name]++;
    }
    workbook.eachSheet((sheet) => {
      applyFullBorder(sheet);
    });
    const exportFileName = fileName || `TAFGA_TBCV_OBSERVATION_REPORT_${dateStr.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
    const rawBuffer = await workbook.xlsx.writeBuffer();
    let outputBuffer;
    try {
      const zip = await import_jszip.default.loadAsync(rawBuffer);
      let modified = false;
      for (const fName of Object.keys(zip.files)) {
        if (fName.startsWith("xl/drawings/drawing") && fName.endsWith(".xml")) {
          let xml = await zip.file(fName).async("string");
          const originalXml = xml;
          xml = xml.replace(/noChangeAspect="1"/g, 'noChangeAspect="0"');
          xml = xml.replace(/<a:picLocks\s*\/>/g, '<a:picLocks noChangeAspect="0"/>');
          xml = xml.replace(/<a:picLocks([^>]*)>/g, (match, attrs) => {
            if (!attrs.includes("noChangeAspect")) {
              return `<a:picLocks${attrs} noChangeAspect="0">`;
            }
            return match;
          });
          if (xml !== originalXml) {
            zip.file(fName, xml);
            modified = true;
          }
        }
      }
      if (modified) {
        outputBuffer = await zip.generateAsync({ type: "nodebuffer" });
      } else {
        outputBuffer = Buffer.from(rawBuffer);
      }
    } catch (zipErr) {
      console.warn("[Excel Export] JSZip drawing patch warning:", zipErr);
      outputBuffer = Buffer.from(rawBuffer);
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${exportFileName}"`);
    return res.send(outputBuffer);
  } catch (err) {
    console.error("[Excel Export] Error generating excel:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to export Excel" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Executive Facility Booking Server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VITEST) {
  startServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AsyncMutex,
  app,
  checkServerBookingConflict,
  createTestSession,
  doPersistHubState,
  doTimeRangesOverlap,
  hubState,
  loadServerSessions,
  logServerSecurity,
  markHubStateDirty,
  mutationMutex,
  persistHubState,
  persistServerSessions,
  reconcileServerIsolationRooms,
  requireAuth,
  resolveServerFacilityId,
  serverAuditLogs,
  serverIsolationHistory,
  serverSessions,
  signSessionToken,
  verifyServerSession,
  verifySignedToken
});
//# sourceMappingURL=server.cjs.map

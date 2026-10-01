export interface NoticeTemplate {
  id: string;
  category: 'RULES_POLICY' | 'MAINTENANCE' | 'SERVICE_SUSPENSION' | 'SAFETY_HEALTH' | 'FACILITY_TIMING' | 'GENERAL';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  title: string;
  subtitle?: string;
  badgeLabel: string;
  themeColor: 'red' | 'amber' | 'emerald' | 'blue' | 'purple' | 'slate';
  facility: string;
  defaultAuthor: string;
  formRefCode: string;
  content: string;
  keyPoints?: string[];
  penaltyClause?: string;
  emergencyContact?: string;
}

export interface CampNoticeRecord {
  id: string;
  noticeRef: string;
  title: string;
  category: 'RULES_POLICY' | 'MAINTENANCE' | 'SERVICE_SUSPENSION' | 'SAFETY_HEALTH' | 'FACILITY_TIMING' | 'GENERAL';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  themeColor: 'red' | 'amber' | 'emerald' | 'blue' | 'purple' | 'slate';
  facility: string;
  effectiveDate: string;
  expiryDate: string;
  content: string;
  keyPoints?: string[];
  penaltyClause?: string;
  emergencyContact?: string;
  author: string;
  authorTitle?: string;
  isPinned: boolean;
  publishedAt: string;
  qrVerificationCode?: string;
}

export const NOTICE_TEMPLATES: NoticeTemplate[] = [
  // --- 1. RULES & COMPLIANCE ---
  {
    id: 'tpl-no-smoking',
    category: 'RULES_POLICY',
    priority: 'URGENT',
    title: 'STRICTLY NO SMOKING - Designated Areas Only',
    subtitle: 'Camp Health, Safety & Fire Prevention Compliance',
    badgeLabel: 'FIRE SAFETY / HSE MANDATE',
    themeColor: 'red',
    facility: 'All Living Quarters, Corridors & Indoor Facilities',
    defaultAuthor: 'HSE Directorate • Tamimi Global Camp Operations',
    formRefCode: 'TAFGA-HSE-NOTC-01',
    content:
      'In accordance with Saudi Civil Defense regulations and Tamimi Global HSE Fire Prevention Guidelines, smoking of any tobacco, electronic cigarettes, shisha, or vape devices is STRICTLY PROHIBITED inside all residential rooms, corridors, dining halls, recreation halls, and washrooms.\n\nSmoking is ONLY permitted inside officially marked outdoor "DESIGNATED SMOKING AREAS" equipped with metal sand ashtrays. Tampering with smoke detectors or smoking indoors poses an extreme fire threat to all camp residents.',
    keyPoints: [
      'No smoking in bedrooms, hallways, offices, or common indoor zones.',
      'Always dispose of cigarette butts safely in designated outdoor sand bins.',
      'Never discard burning cigarette filters into waste paper baskets or dry terrain.',
      'Tampering with room optical smoke detectors is a severe criminal safety violation.',
    ],
    penaltyClause:
      'Violation of this policy will result in an immediate SAR 500 safety penalty, disciplinary reporting to company sponsor HR, and potential cancellation of camp residency.',
    emergencyContact: 'Security & Fire Alarm Control: Ext. 4411 / +966 13 800 4411',
  },
  {
    id: 'tpl-designated-smoking',
    category: 'RULES_POLICY',
    priority: 'NORMAL',
    title: 'DESIGNATED SMOKING AREA - Resident Cleanliness Guidelines',
    subtitle: 'Authorized Outdoor Zone Guidelines & Ash Disposal',
    badgeLabel: 'AUTHORIZED ZONE',
    themeColor: 'emerald',
    facility: 'Outdoor Smoking Gazebos (Zones A, B, C & D)',
    defaultAuthor: 'Camp Administration & Housekeeping Lead',
    formRefCode: 'TAFGA-OPS-NOTC-02',
    content:
      'This area is officially designated for tobacco smoking. All residents and contractors utilizing this gazebo must cooperate to maintain pristine environmental cleanliness and fire safety.\n\nPlease ensure all cigarette butts are completely extinguished and dropped directly into the designated metal sand ashtrays. Do not throw cigarette filters or wrappers on the ground or surrounding grass.',
    keyPoints: [
      'Extinguish all cigarettes fully before leaving the gazebo.',
      'Use the metal sand bins provided; do not litter.',
      'Maintain polite conversation volume so as not to disturb adjacent accommodation blocks.',
      'Do not bring flammable liquids or electrical heating devices into the smoking area.',
    ],
    penaltyClause: 'Littering or improper disposal of burning butts will result in environmental citations.',
    emergencyContact: 'Camp Housekeeping Desk: Ext. 4430',
  },
  {
    id: 'tpl-no-cooking',
    category: 'RULES_POLICY',
    priority: 'URGENT',
    title: 'STRICT PROHIBITION OF IN-ROOM COOKING APPLIANCES',
    subtitle: 'Electrical Overload & Fire Hazard Prevention',
    badgeLabel: 'ELECTRICAL & FIRE HAZARD',
    themeColor: 'red',
    facility: 'All Accommodation Buildings (Blocks 1 through 16)',
    defaultAuthor: 'Camp Boss & Safety Inspector',
    formRefCode: 'TAFGA-HSE-NOTC-03',
    content:
      'Notice is hereby served to all camp occupants that the use of electric hotplates, gas cylinders, induction cooktops, open coil heaters, pressure cookers, and deep fryers inside personal living quarters is STRICTLY FORBIDDEN.\n\nAccommodation electrical circuitry is engineered specifically for lighting, HVAC, and low-wattage personal electronics. High-wattage cooking appliances cause severe circuit breaker overloads, melting of cables, and catastrophic fire risks.',
    keyPoints: [
      'Zero tolerance for electric stoves, hotplates, gas burners, or fryers in bedrooms.',
      'Nutritious hot meals are provided 3 times daily at the Central Mess Hall.',
      'Pantry microwave stations are available in designated common lounge areas.',
      'Unannounced room inspections will confiscate unauthorized heating equipment immediately.',
    ],
    penaltyClause:
      'Unauthorized cooking gear will be confiscated without return. A SAR 300 safety surcharge will be debited to the resident account.',
    emergencyContact: 'Camp Electrical Supervisor: Ext. 4455',
  },
  {
    id: 'tpl-disruptive-behavior',
    category: 'RULES_POLICY',
    priority: 'HIGH',
    title: 'ZERO TOLERANCE ON DISRUPTIVE CONDUCT & ABUSIVE LANGUAGE',
    subtitle: 'Camp Mutual Respect, Harmony & Professional Code of Conduct',
    badgeLabel: 'CAMP CODE OF CONDUCT',
    themeColor: 'purple',
    facility: 'All Camp Premises, Mess Halls, Recreation Centers & Quarters',
    defaultAuthor: 'Camp Manager & Corporate Security Liaison',
    formRefCode: 'TAFGA-ADM-NOTC-04',
    content:
      'Tamimi Global is committed to fostering a peaceful, respectful, and safe living environment for all workforce nationalities and disciplines. Abusive language, shouting, physical altercation, harassment, insubordination to camp staff, or disruptive arguments will NOT be tolerated under any circumstances.\n\nAll residents must conduct themselves with professional maturity, respect diversity, and address personal disagreements through the official Camp Administration grievance desk.',
    keyPoints: [
      'Treat all fellow residents, catering crew, security guards, and cleaners with utmost dignity.',
      'Verbal abuse, profanity, bullying, or threats of violence are grounds for immediate eviction.',
      'Report any interpersonal conflicts directly to Camp Management for peaceful mediation.',
      'Maintain courteous, respectful interactions across all communal facilities.',
    ],
    penaltyClause:
      'Involvement in altercations or severe abusive behavior results in immediate security reporting, police notification, and employer contract termination.',
    emergencyContact: 'Camp Security Chief: Ext. 4411 / 4412',
  },
  {
    id: 'tpl-quiet-hours',
    category: 'RULES_POLICY',
    priority: 'HIGH',
    title: 'CAMP QUIET HOURS NOTICE (22:00 TO 06:00)',
    subtitle: 'Respect for Night Shift Personnel & Rest Periods',
    badgeLabel: 'RESIDENT WELLBEING',
    themeColor: 'blue',
    facility: 'All Accommodation Corridors, Walkways & Outdoor Courtyards',
    defaultAuthor: 'Camp Resident Services Desk',
    formRefCode: 'TAFGA-OPS-NOTC-05',
    content:
      'Please be reminded that mandatory CAMP QUIET HOURS are observed daily from 22:00 hours until 06:00 hours. A significant percentage of camp residents operate on rotating night and early morning project shifts and require uninterrupted sleep.\n\nDuring quiet hours, keep TV and music volumes strictly inside room boundaries (or use personal headphones), refrain from loud telephone speaker calls in corridors, and avoid slamming room doors.',
    keyPoints: [
      'Quiet Hours: 22:00 (10:00 PM) to 06:00 (6:00 AM) every day.',
      'Use headphones for mobile games, movies, and video phone calls.',
      'No congregating or loud conversations in hallway corridors during quiet hours.',
      'Close doors gently using door handles to minimize vibration.',
    ],
    penaltyClause: 'Repeated noise complaints will result in formal written warning to company management.',
    emergencyContact: 'Duty Night Patrol: Ext. 4412',
  },
  {
    id: 'tpl-waste-disposal',
    category: 'RULES_POLICY',
    priority: 'NORMAL',
    title: 'DAILY ROOM HYGIENE & PROPER WASTE DISPOSAL PROTOCOL',
    subtitle: 'Vector Control, Cleanliness & Sanitation Standards',
    badgeLabel: 'HEALTH & HYGIENE',
    themeColor: 'emerald',
    facility: 'All Residential Blocks & Garbage Chute Stations',
    defaultAuthor: 'Camp Sanitation & Pest Control Lead',
    formRefCode: 'TAFGA-HSE-NOTC-06',
    content:
      'To maintain sanitary living conditions and prevent attraction of pests, rodents, and insects, all residents are required to bag their daily bedroom trash and deposit it into the large covered dumpster bins located outside each building wing.\n\nDo not leave open food containers, beverage cans, or leftover meals inside bedrooms overnight. Housekeeping teams will conduct routine weekly sanitation sweeps.',
    keyPoints: [
      'Tie garbage bags securely before placing them into outdoor metal collection bins.',
      'Do not place trash bags on corridor floors or stairwell landings.',
      'Keep room surfaces wiped and food stored in sealed plastic containers.',
      'Notify housekeeping immediately if extra trash bin liners are required.',
    ],
    penaltyClause: 'Accumulation of unhygienic waste inside rooms will trigger mandatory sanitation cleaning fee.',
    emergencyContact: 'Housekeeping Desk: Ext. 4430',
  },

  // --- 2. SERVICE SUSPENSIONS & MAINTENANCE DISRUPTIONS ---
  {
    id: 'tpl-service-suspension-today',
    category: 'SERVICE_SUSPENSION',
    priority: 'URGENT',
    title: 'TEMPORARY SERVICE SUSPENSION NOTICE - TODAY',
    subtitle: 'Urgent Facility Maintenance & System Calibration',
    badgeLabel: 'SERVICE CLOSED TODAY',
    themeColor: 'amber',
    facility: 'Specified Service / Central Facility',
    defaultAuthor: 'Operations & Maintenance Directorate',
    formRefCode: 'TAFGA-MNT-NOTC-07',
    content:
      'NOTICE IS HEREBY GIVEN THAT THE SPECIFIED FACILITY / SERVICE WILL BE TEMPORARILY CLOSED AND SUSPENDED TODAY for mandatory emergency maintenance, safety inspections, and technical overhaul.\n\nAll existing appointments and slot bookings for today have been automatically rescheduled or placed on priority hold. Normal operations are anticipated to resume tomorrow morning as scheduled. We apologize for any inconvenience caused.',
    keyPoints: [
      'Service / Facility is strictly closed to all residents today.',
      'Authorized maintenance engineers and technicians only are permitted in the work zone.',
      'All automated slot reservations for today will be refunded or credited.',
      'Emergency requests should be directed to the Central Helpdesk.',
    ],
    penaltyClause: 'Do not attempt to bypass safety barrier tape or enter closed maintenance zones.',
    emergencyContact: 'Facilities Helpdesk Desk: Ext. 4400 / 4455',
  },
  {
    id: 'tpl-water-shutdown',
    category: 'MAINTENANCE',
    priority: 'URGENT',
    title: 'SCHEDULED WATER SUPPLY INTERRUPTION & TANK CLEANING',
    subtitle: 'Main Water Distribution Pipeline Sterilization & Filter Servicing',
    badgeLabel: 'WATER UTILITY SHUTDOWN',
    themeColor: 'amber',
    facility: 'Accommodation Blocks 1, 2, 3 & 4 (All Wings)',
    defaultAuthor: 'Plumbing & Utilities Engineering Lead',
    formRefCode: 'TAFGA-UTL-NOTC-08',
    content:
      'Please be advised that the main domestic water supply will be temporarily shut off on the specified date between 09:00 and 15:00 hours for scheduled water storage tank disinfection, booster pump maintenance, and pipeline pressure testing.\n\nResidents are advised to store sufficient drinking and washing water in clean buckets or bottles prior to 09:00 hours. Emergency water tankers will be staged at the central courtyard for essential needs.',
    keyPoints: [
      'Water Shutdown Window: 09:00 to 15:00 (6 Hours Total).',
      'Please ensure all room faucets are turned OFF firmly to prevent overflow when water pressure returns.',
      'When supply resumes, allow taps to run for 60 seconds to clear residual air.',
      'Central Mess Hall water supply remains operating via independent reserve tank.',
    ],
    penaltyClause: 'Ensure bathroom taps are closed to prevent accidental flooding upon supply restoration.',
    emergencyContact: 'Emergency Plumbing Response: Ext. 4455 / 055 800 4455',
  },
  {
    id: 'tpl-power-shutdown',
    category: 'MAINTENANCE',
    priority: 'URGENT',
    title: 'SCHEDULED ELECTRICAL SUBSTATION SERVICING & POWER OUTAGE',
    subtitle: 'High Voltage Transformer Inspection & Backup Generator Load Testing',
    badgeLabel: 'POWER SHUTDOWN',
    themeColor: 'red',
    facility: 'Entire Camp Complex (Excluding Medical Clinic & Security Gate)',
    defaultAuthor: 'Chief Electrical Engineer • Tamimi Maintenance',
    formRefCode: 'TAFGA-ELEC-NOTC-09',
    content:
      'A planned electrical power shutdown is scheduled to carry out mandatory preventive maintenance on the primary 13.8kV distribution substation, switchgear panels, and automatic transfer switches (ATS).\n\nEssential emergency lighting and medical clinic power will be supported by dedicated backup diesel generators. Air conditioning units and standard wall sockets will be deactivated during the maintenance window.',
    keyPoints: [
      'Outage Window: Friday morning from 06:00 to 11:00 hours.',
      'Unplug sensitive electronic devices (laptops, chargers, TVs) before 06:00 to protect against power surge.',
      'Refrigeration units in the Central Mess will be connected to emergency generator bus.',
      'Elevators and high-voltage HVAC compressors will automatically restart after grid synchronization.',
    ],
    penaltyClause: 'Do not attempt to access electrical distribution panels or transformer enclosures.',
    emergencyContact: 'Electrical Dispatch Control: Ext. 4455',
  },
  {
    id: 'tpl-laundry-maintenance',
    category: 'MAINTENANCE',
    priority: 'NORMAL',
    title: 'CENTRAL LAUNDRY FACILITY - SCHEDULED MACHINE MAINTENANCE',
    subtitle: 'Industrial Washer Descaling & Steam Boiler Overhaul',
    badgeLabel: 'LAUNDRY ADJUSTMENT',
    themeColor: 'blue',
    facility: 'Central Camp Laundry & Dry Cleaning Facility',
    defaultAuthor: 'Laundry Services Supervisor',
    formRefCode: 'TAFGA-LND-NOTC-10',
    content:
      'The Central Laundry Facility will undergo comprehensive equipment servicing, steam boiler descaling, and dryer lint exhaust duct cleaning on Wednesday.\n\nLinen collection and personal laundry drop-off will be suspended for 24 hours. Items submitted before Tuesday 18:00 will be processed and returned per standard turnaround schedule.',
    keyPoints: [
      'No laundry drop-offs accepted on Wednesday.',
      'Normal drop-off and pickup resumes Thursday at 07:00 AM.',
      'Emergency uniform cleaning for shift staff is available at Gate 2 Express Station.',
    ],
    emergencyContact: 'Laundry Desk: Ext. 4425',
  },
  {
    id: 'tpl-wifi-upgrade',
    category: 'MAINTENANCE',
    priority: 'NORMAL',
    title: 'HIGH-SPEED WI-FI & OPTICAL FIBER NETWORK UPGRADE',
    subtitle: 'Access Point Firmware Overhaul & Bandwidth Enhancement',
    badgeLabel: 'IT & WI-FI NOTICE',
    themeColor: 'purple',
    facility: 'All Residential Wi-Fi Access Points (TAFGA-GUEST & TAFGA-RESIDENT)',
    defaultAuthor: 'IT Infrastructure & Telecom Lead',
    formRefCode: 'TAFGA-IT-NOTC-11',
    content:
      'Tamimi IT Department will deploy high-capacity fiber backbone updates and firmware optimizations across all residential access points to improve streaming bandwidth and gaming latency.\n\nIntermittent Wi-Fi signal drops lasting between 5 to 10 minutes per building wing are expected during the overnight maintenance hours (01:00 to 04:00 AM).',
    keyPoints: [
      'Maintenance Hours: 01:00 AM to 04:00 AM.',
      'No change in Wi-Fi password or SSID credentials required.',
      'If your connection does not automatically reconnect, simply toggle Wi-Fi on your device OFF and ON.',
    ],
    emergencyContact: 'IT Support Helpdesk: Ext. 4480 / itsupport@tamimi.com',
  },

  // --- 3. SAFETY, HEALTH & DRILLS ---
  {
    id: 'tpl-fire-drill',
    category: 'SAFETY_HEALTH',
    priority: 'URGENT',
    title: 'MANDATORY CAMP-WIDE EMERGENCY FIRE EVACUATION DRILL',
    subtitle: 'Quarterly Civil Defense Fire Alarm & Muster Station Protocol',
    badgeLabel: 'MANDATORY DRILL',
    themeColor: 'red',
    facility: 'All Buildings, Offices, Kitchens, Quarters & Workshops',
    defaultAuthor: 'HSE Fire Safety Officer & Security Chief',
    formRefCode: 'TAFGA-HSE-NOTC-12',
    content:
      'In compliance with Saudi Civil Defense and Company Safety Directives, a MANDATORY quarterly Fire Alarm & Evacuation Drill will be conducted across all camp zones on the announced date.\n\nWhen the continuous audible fire alarm sounds, ALL occupants must immediately cease work, evacuate buildings in an orderly fashion using nearest emergency exit routes, and proceed directly to their designated ASSEMBLY MUSTER POINTS (P1 to P6).',
    keyPoints: [
      'Do not use elevators during fire alarm activation; use marked stairwells only.',
      'Walk briskly; do not run or push others.',
      'Report immediately to your designated building Floor Warden at the Muster Station for head-count roll call.',
      'Do not re-enter any building until the "ALL CLEAR" siren sounds.',
    ],
    penaltyClause: 'Failure to participate in mandatory safety drills will result in formal HSE non-conformance logging.',
    emergencyContact: 'Camp HSE Command: Ext. 4411 / Ext. 4499',
  },
  {
    id: 'tpl-pest-fumigation',
    category: 'SAFETY_HEALTH',
    priority: 'HIGH',
    title: 'CAMP-WIDE PEST CONTROL & ROOM FUMIGATION SCHEDULE',
    subtitle: 'Vector Eradication & Preventive Insecticide Application',
    badgeLabel: 'FUMIGATION ADVISORY',
    themeColor: 'amber',
    facility: 'Accommodation Blocks 5 through 10 & Kitchen Pantries',
    defaultAuthor: 'Environmental Health & Sanitation Unit',
    formRefCode: 'TAFGA-HSE-NOTC-13',
    content:
      'Certified pest control specialists will carry out routine thermal fogging, drain treatment, and indoor residual spraying to eradicate mosquitoes, flies, and crawling insects.\n\nResidents must ensure all personal food items, toothbrushes, and open drinking water are enclosed inside cabinets. Keep room windows closed for 30 minutes following chemical application.',
    keyPoints: [
      'Cover all open food, beverages, and cutlery.',
      'Vacate rooms during spraying and remain outside for 20 minutes.',
      'All chemical agents used are approved by Saudi Food & Drug Authority (SFDA) and non-hazardous to humans when settled.',
    ],
    emergencyContact: 'Sanitation Officer: Ext. 4430',
  },

  // --- 4. FACILITY TIMINGS & EVENTS ---
  {
    id: 'tpl-mess-timing',
    category: 'FACILITY_TIMING',
    priority: 'NORMAL',
    title: 'CENTRAL MESS HALL - REVISED MEAL SERVICE TIMINGS',
    subtitle: 'Dining Schedule Optimization & Weekend Buffet Timing',
    badgeLabel: 'DINING SCHEDULE',
    themeColor: 'blue',
    facility: 'Main Dining Facility (Halls 1, 2 & VIP Mess)',
    defaultAuthor: 'Executive Catering Manager • Tamimi Food Services',
    formRefCode: 'TAFGA-CAT-NOTC-14',
    content:
      'Please take note of the updated dining service hours across all mess halls. All meals are served buffet-style. Takeaway meal boxes for shift workers must be requested via supervisor requisition 2 hours in advance.',
    keyPoints: [
      'Breakfast: 05:30 to 08:30 Daily',
      'Lunch: 11:30 to 14:30 Daily',
      'Dinner: 18:00 to 21:30 Daily',
      'Night Shift Packed Meals: 23:00 to 01:00 (Dining Hall 2)',
    ],
    emergencyContact: 'Catering Helpdesk: Ext. 4420',
  },
  {
    id: 'tpl-cinema-weekend',
    category: 'FACILITY_TIMING',
    priority: 'NORMAL',
    title: 'CINEMA HALL - WEEKEND 4K BLOCKBUSTER SCREENING SCHEDULE',
    subtitle: 'Recreation & Leisure Weekend Program',
    badgeLabel: 'ENTERTAINMENT',
    themeColor: 'purple',
    facility: 'Camp Cinema & Auditorium (40-Seat Laser Theatre)',
    defaultAuthor: 'Recreation & Welfare Committee',
    formRefCode: 'TAFGA-REC-NOTC-15',
    content:
      'Join us this weekend for curated 4K laser movie screenings in Dolby Surround Sound! Complimentary popcorn and beverages will be served at the entrance lounge. Pre-booking via the Facility Booking portal is recommended.',
    keyPoints: [
      'Friday Matinee: 16:30 (Action / Adventure)',
      'Friday Night Premier: 19:30 & 22:00 (Multilingual Blockbuster)',
      'Saturday Feature: 19:00 (Sports & Classic Feature)',
      'Maintain auditorium cleanliness; deposit popcorn cups in trash cans upon exit.',
    ],
    emergencyContact: 'Recreation Desk: Ext. 4470',
  },

  // --- 5. OPERATIONAL SCHEDULES & CAMP DIRECTORY NOTICES (EXTRACTED FROM SCANS) ---
  {
    id: 'tpl-laundry-master-schedule',
    category: 'FACILITY_TIMING',
    priority: 'HIGH',
    title: 'OFFICIAL LAUNDRY COLLECTION & DELIVERY SCHEDULE (CLUSTERS H, D & L)',
    subtitle: 'Weekly Linen & Personal Laundry Turnaround Roster',
    badgeLabel: 'LAUNDRY ROSTER',
    themeColor: 'blue',
    facility: 'Central Laundry Facilities (Stage 1, 2 & Stage 3)',
    defaultAuthor: 'Laundry Management Directorate • Tamimi Global',
    formRefCode: 'TAFGA-LND-SCHED-01',
    content:
      'All residents across Cluster H, Cluster D, and Cluster L are hereby advised of the official laundry collection and delivery timetable.\n\nImportant Delivery Rule: Clean laundry delivery is strictly executed on the NEXT DAY of your designated collection day.\n\nSummary of Collection Days:\n• Buildings 01 & 02 (Rooms 001-012 & 101-112):\n  - H01, D01, L01: Sun & Wed\n  - H02, D02, L02: Mon & Thu\n• Buildings 03 to 06 (Rooms 001-018 & 101-118):\n  - Ground Floor: Tue & Sat (H03/D03/L03, H06/D06/L06) or Thu & Mon (H04/D04/L04) or Sun & Wed (H05/D05/L05)\n  - First Floor: Wed & Sun (H03/D03/L03, H06/D06/L06) or Sat & Tue (H04/D04/L04) or Mon & Thu (H05/D05/L05)\n• Buildings 07 to 14: Regular alternating cycle.',
    keyPoints: [
      'Always place items in assigned mesh laundry bags labeled with your Room Number.',
      'Delivery is guaranteed on the next day following collection day.',
      'For Stage 1 & Stage 2 contractor and staff schedules, consult your Block Supervisor.',
    ],
    emergencyContact: 'Stage 1 Laundry: Ext. 4418 | Stage 2: Ext. 4451 | Stage 3 Manager: Ext. 4452',
  },
  {
    id: 'tpl-fuel-station-schedule',
    category: 'FACILITY_TIMING',
    priority: 'NORMAL',
    title: 'ALDREES FUEL STATION & FLEET MANAGEMENT DISPATCH TIMINGS',
    subtitle: 'Vehicle Refueling Timetable, Fleet Logistics & PPE Incharge',
    badgeLabel: 'FLEET & FUEL',
    themeColor: 'amber',
    facility: 'TBCV Fuel Station & Fleet Depot',
    defaultAuthor: 'Fleet & Fuel Station Management',
    formRefCode: 'TAFGA-FLT-NOTC-02',
    content:
      'The Aldrees Camp Fuel Station operates on the following authorized schedule:\n• Saturday to Thursday: 06:00 AM to 10:00 PM\n• Friday: 01:00 PM to 10:00 PM\n\nKey Operational Contacts:\n• Fuel Station Incharge: Hamza (0506632540 / 0575580137 | hhussain@aldrees.com)\n• Fleet Team Management: Miss Hanin (0535758011) / Miss Ruqayyah (0548389037)\n• PPE Incharge: Mr. Naveed (0596054768)\n• Security Supervisor: Mr. Abu Hatem (0596919910)\n• Transport Supervisors: Mr. Khalid (0573052460) / Mr. Khairul (0551440039)\n• Vehicle Mechanic: Mr. Niaz (0576175978)',
    keyPoints: [
      'All official project vehicles must strictly adhere to designated fueling windows.',
      'For vehicle breakdown recovery or maintenance, contact Mr. Niaz immediately.',
      'Safety vests and PPE must be worn at all times inside the fuel station depot.',
    ],
    emergencyContact: 'Transport Helpdesk: Ext. 4430 / Ext. 4421 | Hamza: 0506632540',
  },
  {
    id: 'tpl-camp-address-guide',
    category: 'GENERAL',
    priority: 'NORMAL',
    title: 'OFFICIAL CAMP POSTAL ADDRESS & INBOUND DELIVERY NOTICE',
    subtitle: 'National Address, Courier Parcels & Location Coordinates',
    badgeLabel: 'ADDRESS & LOGISTICS',
    themeColor: 'emerald',
    facility: 'Facility Management Office & Parcel Reception Counter',
    defaultAuthor: 'Camp Administration & Logistics Department',
    formRefCode: 'TAFGA-LOG-NOTC-03',
    content:
      'Residents and contracting companies ordering goods, packages, or courier shipments (DHL, SMSA, SPL, Aramex, Amazon) must use the official Saudi National Address format:\n\n• Building: Facility Management Office\n• Main Location: Amaala Construction Village (Triple Bay)\n• City / District: Al Wajh, Al Balad\n• Province: Tabuk, Kingdom of Saudi Arabia\n• National Address Short Code: KKJA7917\n• Postal / Zip Code: 49244\n\nIncoming parcels will be received at the Main Parcel Counter and logged for SMS resident pickup.',
    keyPoints: [
      'Specify National Address KKJA7917 on all shipping delivery notes.',
      'Present your resident badge ID at the Parcel Counter upon receipt of SMS notification.',
      'Parcels are held in custody for up to 14 days before return to sender.',
    ],
    emergencyContact: 'Parcel Counter: Ext. 4445 | Reception: Ext. 4422',
  },
];

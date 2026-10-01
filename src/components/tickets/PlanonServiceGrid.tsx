import React from 'react';
import { TicketTradeCategory } from '../../types/ticket';
import {
  Monitor,
  FileText,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CivilIllustration,
  CleaningIllustration,
  ElectricalIllustration,
  EquipmentIllustration,
  FightingIllustration,
  GeneralIllustration,
  HousekeepingIllustration,
  HseIllustration,
  HvacIllustration,
  ItIllustration,
  LandscapingIllustration,
  LaundryIllustration,
  MechanicalIllustration,
  PestControlIllustration,
  PulmingIllustration,
  WasteManagementIllustration,
} from './PlanonIllustrations';

export interface PlanonServiceDiscipline {
  id: TicketTradeCategory;
  code: string;
  name: string;
  nameAr?: string;
  department: 'MEP' | 'CIVIL' | 'SOFT_FM' | 'SAFETY_IT';
  description: string;
  renderIllustration: (className?: string) => React.ReactNode;
  defaultCategoryCode: string;
  defaultDescription: string;
  sampleAsset: string;
}

// Exactly ordered 16 services as shown in Screenshot 1
export const PLANON_SERVICES: PlanonServiceDiscipline[] = [
  // Row 1
  {
    id: 'CIVIL',
    code: '01.01',
    name: 'CIVIL',
    nameAr: 'أعمال مدنية',
    department: 'CIVIL',
    description: 'Doors, windows, drawers, tiles, ceiling & carpentry',
    renderIllustration: (cls) => <CivilIllustration className={cls} />,
    defaultCategoryCode: 'CV05, FM REACTIVE WORK ORDER - Drawers Fixing',
    defaultDescription: 'FM REACTIVE WORK ORDER - Drawers Fixing & Door Alignment',
    sampleAsset: 'AST-DRW-01 - Furniture Runner',
  },
  {
    id: 'Cleaning',
    code: '01.05',
    name: 'Cleaning',
    nameAr: 'نظافة عامة',
    department: 'SOFT_FM',
    description: 'Deep sanitization, corridor buffing & janitorial',
    renderIllustration: (cls) => <CleaningIllustration className={cls} />,
    defaultCategoryCode: 'CL01, FM REACTIVE WORK ORDER - Deep Sanitization',
    defaultDescription: 'FM REACTIVE WORK ORDER - Comprehensive Room Deep Cleaning',
    sampleAsset: 'AST-CLN-04 - High-Pressure Scrubber',
  },
  {
    id: 'Electrical',
    code: '01.02',
    name: 'Electrical',
    nameAr: 'كهرباء وإنارة',
    department: 'MEP',
    description: 'Lighting, breakers, DB panels, switches & sockets',
    renderIllustration: (cls) => <ElectricalIllustration className={cls} />,
    defaultCategoryCode: 'EL01, FM REACTIVE WORK ORDER - Lighting & DB Fault',
    defaultDescription: 'FM REACTIVE WORK ORDER - Circuit Breaker Tripped / Light Out',
    sampleAsset: 'AST-DB-101 - Main Distribution Board',
  },
  {
    id: 'Equipment',
    code: '01.06',
    name: 'Equipment',
    nameAr: 'معدات المطابخ',
    department: 'SOFT_FM',
    description: 'Bain-maries, food warmers, combi ovens & cold rooms',
    renderIllustration: (cls) => <EquipmentIllustration className={cls} />,
    defaultCategoryCode: 'EQ01, FM REACTIVE WORK ORDER - Food Warmer Thermostat',
    defaultDescription: 'FM REACTIVE WORK ORDER - Dining Hall Bain Marie Element Repair',
    sampleAsset: 'AST-FW-02 - Food Warmer (Bain Marie)',
  },

  // Row 2
  {
    id: 'Fighting',
    code: '01.18',
    name: 'Fighting',
    nameAr: 'مكافحة الحريق',
    department: 'SAFETY_IT',
    description: 'Smoke detectors, extinguishers, fire alarms & FM200',
    renderIllustration: (cls) => <FightingIllustration className={cls} />,
    defaultCategoryCode: 'FS01, FM REACTIVE WORK ORDER - Smoke Detector Fault',
    defaultDescription: 'FM REACTIVE WORK ORDER - Corridor Smoke Detector Inspection',
    sampleAsset: 'AST-SD-C10-004 - Optical Smoke Detector',
  },
  {
    id: 'General',
    code: '01.10',
    name: 'General',
    nameAr: 'صيانة عامة',
    department: 'CIVIL',
    description: 'Signage, mirrors, curtains, caulking & locks',
    renderIllustration: (cls) => <GeneralIllustration className={cls} />,
    defaultCategoryCode: 'GN01, FM REACTIVE WORK ORDER - General Fixture Repair',
    defaultDescription: 'FM REACTIVE WORK ORDER - Mirror & Wall Fixture Repair',
    sampleAsset: 'AST-FIX-12 - Room Mirror Fixture',
  },
  {
    id: 'Housekeeping',
    code: '01.13',
    name: 'Housekeeping',
    nameAr: 'خدمات الغرف',
    department: 'SOFT_FM',
    description: 'VIP room linen replenishment, toiletries & bed making',
    renderIllustration: (cls) => <HousekeepingIllustration className={cls} />,
    defaultCategoryCode: 'HK01, FM REACTIVE WORK ORDER - Linen Replacement',
    defaultDescription: 'FM REACTIVE WORK ORDER - VIP Bed Linen & Hygiene Replenishment',
    sampleAsset: 'AST-HK-10 - VIP Linen Set',
  },
  {
    id: 'HSE',
    code: '01.12',
    name: 'HSE',
    nameAr: 'الصحة والسلامة',
    department: 'SAFETY_IT',
    description: 'Emergency lights, trip hazards, eye-wash & railing',
    renderIllustration: (cls) => <HseIllustration className={cls} />,
    defaultCategoryCode: 'HS01, FM REACTIVE WORK ORDER - Safety Hazard Rectification',
    defaultDescription: 'FM REACTIVE WORK ORDER - Stairwell Handrail Securing & Inspection',
    sampleAsset: 'AST-SAF-08 - Emergency Exit Light GF',
  },

  // Row 3
  {
    id: 'HVAC',
    code: '01.03',
    name: 'HVAC',
    nameAr: 'تكييف وتهوية',
    department: 'MEP',
    description: 'Split ACs, package units, chillers, thermostat & filters',
    renderIllustration: (cls) => <HvacIllustration className={cls} />,
    defaultCategoryCode: 'AC01, FM REACTIVE WORK ORDER - AC Not Cooling',
    defaultDescription: 'FM REACTIVE WORK ORDER - Split AC Unit Blowing Warm Air',
    sampleAsset: 'AST-AC-8821 - Split AC Inverter 2.5T',
  },
  {
    id: 'IT',
    code: '01.08',
    name: 'IT',
    nameAr: 'تقنية المعلومات',
    department: 'SAFETY_IT',
    description: 'Access points, fiber patching, IP intercoms & CCTV',
    renderIllustration: (cls) => <ItIllustration className={cls} />,
    defaultCategoryCode: 'IT01, FM REACTIVE WORK ORDER - Wi-Fi AP Offline',
    defaultDescription: 'FM REACTIVE WORK ORDER - Wi-Fi Access Point Re-patching',
    sampleAsset: 'AST-WAP-33 - Cisco Enterprise AP',
  },
  {
    id: 'Landscaping',
    code: '01.14',
    name: 'Landscaping',
    nameAr: 'تشجير وري',
    department: 'CIVIL',
    description: 'Sprinklers, lawn trimming, walkway paving & plants',
    renderIllustration: (cls) => <LandscapingIllustration className={cls} />,
    defaultCategoryCode: 'LS01, FM REACTIVE WORK ORDER - Irrigation Valve Stuck',
    defaultDescription: 'FM REACTIVE WORK ORDER - Walkway Drip Irrigation Line Broken',
    sampleAsset: 'AST-IRR-02 - Solenoid Valve Cluster L',
  },
  {
    id: 'Laundry',
    code: '01.15',
    name: 'Laundry',
    nameAr: 'مغاسل مركزية',
    department: 'SOFT_FM',
    description: 'Industrial washers, dryers, steam presses & uniform washing',
    renderIllustration: (cls) => <LaundryIllustration className={cls} />,
    defaultCategoryCode: 'LD01, FM REACTIVE WORK ORDER - Commercial Washer Fault',
    defaultDescription: 'FM REACTIVE WORK ORDER - Industrial Washer Spin Cycle Error',
    sampleAsset: 'AST-WSH-01 - Primus 35kg Industrial Washer',
  },

  // Row 4
  {
    id: 'Mechanical',
    code: '01.09',
    name: 'Mechanical',
    nameAr: 'أعمال ميكانيكية',
    department: 'MEP',
    description: 'Booster pumps, water chillers, motors & exhaust fans',
    renderIllustration: (cls) => <MechanicalIllustration className={cls} />,
    defaultCategoryCode: 'ME01, FM REACTIVE WORK ORDER - Pump Motor Overheat',
    defaultDescription: 'FM REACTIVE WORK ORDER - Booster Pump Low Pressure',
    sampleAsset: 'AST-PMP-03 - Booster Pump Stage 2',
  },
  {
    id: 'Pest Control',
    code: '01.16',
    name: 'Pest Control',
    nameAr: 'مكافحة الحشرات',
    department: 'SOFT_FM',
    description: 'ULV misting, rodent traps, thermal fogging & baiting',
    renderIllustration: (cls) => <PestControlIllustration className={cls} />,
    defaultCategoryCode: 'PC01, FM REACTIVE WORK ORDER - Targeted Pest Treatment',
    defaultDescription: 'FM REACTIVE WORK ORDER - Perimeter Pest Control Spraying',
    sampleAsset: 'AST-PST-05 - Gel Baiting Stations',
  },
  {
    id: 'Plumbing',
    code: '01.04',
    name: 'Pulming',
    nameAr: 'سباكة وصرف صحي',
    department: 'MEP',
    description: 'Flush valves, pipe leaks, mixers, water heaters & drains',
    renderIllustration: (cls) => <PulmingIllustration className={cls} />,
    defaultCategoryCode: 'PL01, FM REACTIVE WORK ORDER - Water Pipe Leakage',
    defaultDescription: 'FM REACTIVE WORK ORDER - Water Line Leakage in Toilet',
    sampleAsset: 'AST-VLV-04 - Pressure Reducing Valve',
  },
  {
    id: 'Waste Management',
    code: '01.17',
    name: 'Waste Management',
    nameAr: 'إدارة النفايات',
    department: 'SOFT_FM',
    description: 'Dumpster clearance, hydraulic compactors & recycling bins',
    renderIllustration: (cls) => <WasteManagementIllustration className={cls} />,
    defaultCategoryCode: 'WM01, FM REACTIVE WORK ORDER - Bin Overflow Clearance',
    defaultDescription: 'FM REACTIVE WORK ORDER - Compactor Chute Unblocking',
    sampleAsset: 'AST-CMP-02 - Hydraulic Waste Compactor',
  },
];

interface PlanonServiceGridProps {
  onSelectDiscipline: (discipline: PlanonServiceDiscipline) => void;
  onOpenReports: () => void;
  onOpenManage?: () => void;
  ticketCountByTrade: Record<string, number>;
  onBack?: () => void;
}

export const PlanonServiceGrid: React.FC<PlanonServiceGridProps> = ({
  onSelectDiscipline,
  onOpenReports,
  onOpenManage,
  ticketCountByTrade,
  onBack,
}) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      {/* Full desktop width and full height container - filling available space with zero vertical scroll */}
      <div className="w-full h-full flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden animate-in fade-in duration-200">
        
        {/* 4 columns x 4 rows matrix (16 disciplines), filling 100% height and width with zero scrolling */}
        <div className="flex-1 min-h-0 p-2 sm:p-2.5 lg:p-3 grid grid-cols-2 sm:grid-cols-4 grid-rows-[repeat(8,minmax(0,1fr))] sm:grid-rows-[repeat(4,minmax(0,1fr))] gap-2 sm:gap-2.5 lg:gap-3">
          {PLANON_SERVICES.map((srv) => {
            const activeCount = ticketCountByTrade[srv.id] || 0;

            return (
              <div
                key={srv.id}
                onClick={() => onSelectDiscipline(srv)}
                role="button"
                tabIndex={0}
                className="group relative flex flex-col justify-between items-center p-2 sm:p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500/80 hover:shadow-md transition-all duration-150 cursor-pointer text-center h-full w-full overflow-hidden"
              >
                {/* Top: Discipline Code & Active Ticket badge */}
                <div className="w-full flex items-center justify-between shrink-0 px-0.5">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 dark:text-slate-400">
                    {srv.code}
                  </span>
                  {activeCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xs">
                      {activeCount}
                    </span>
                  ) : <span />}
                </div>

                {/* Centered Large Vector Illustration */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 my-0.5 py-0.5">
                  {srv.renderIllustration('w-auto h-full max-h-[4rem] sm:max-h-[4.75rem] lg:max-h-[5.5rem] object-contain drop-shadow-xs')}
                </div>

                {/* Service Label (English only, no Arabic) */}
                <div className="w-full px-1 shrink-0 pb-0.5">
                  <span className="text-xs sm:text-sm lg:text-base font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight block truncate">
                    {srv.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


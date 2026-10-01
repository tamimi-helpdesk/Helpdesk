import React, { useState, useEffect, useMemo } from 'react';
import {
  TicketTradeCategory,
  TicketPriority,
  VillageStage,
  ClusterId,
  ClusterType,
  BuildingFloor,
  BuildingCategory,
  WorkOrderTicket,
} from '../../types/ticket';
import { PlanonServiceDiscipline } from './PlanonServiceGrid';
import {
  PlanonMasterStore,
  detectFloorFromSpace,
} from '../../services/planonMasterStore';
import {
  PlanonSpaceItem,
} from '../../data/planonMasterData';
import {
  Monitor,
  X,
  ChevronRight,
  Upload,
  FileText,
  Trash2,
  Check,
  AlertCircle,
  Building,
  User,
  Tag,
  MapPin,
  Layers,
  Wrench,
  Camera,
  Search,
} from 'lucide-react';

interface PlanonWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: any) => void;
  initialDiscipline?: PlanonServiceDiscipline | null;
}

// Comprehensive Master Datasets for Real-time Autocomplete Suggestions
const MASTER_CUSTOMERS = [
  'Red Sea Global (RSG) - Amaala Project',
  'TAMIMI Global Co. Ltd. (TAFGA)',
  'Al-Bawani Construction Joint Venture',
  'Amaala Base Camp Operations Directorate',
  'RSG Facilities & Infrastructure Management',
  'Nesma & Partners Contracting JV',
  'Saudi Archirodon Ltd. (Amaala Marine Works)',
  'Diriyah Development / RSG Joint Operations',
  'Dar Al-Handasah Consultants (Shair and Partners)',
];

const MASTER_REQUESTORS = [
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

const MASTER_REQUEST_CATEGORIES = [
  // Civil & Carpentry
  { code: 'CV01', name: 'Civil - Wall painting and plaster repair' },
  { code: 'CV02', name: 'Civil - Door lock / hinge / alignment repair' },
  { code: 'CV03', name: 'Civil - Ceiling tile damage replacement' },
  { code: 'CV04', name: 'Civil - Flooring / vinyl / tile replacement' },
  { code: 'CV05', name: 'FM REACTIVE WORK ORDER - Drawers Fixing & Door Alignment' },
  { code: 'CV06', name: 'Civil - Window frame and glass glazing' },
  { code: 'CV07', name: 'Civil - Furniture woodwork and runner fixing' },
  // Cleaning
  { code: 'CL01', name: 'Cleaning - Deep cleaning & sanitization' },
  { code: 'CL02', name: 'Cleaning - Common corridor & staircase wash' },
  { code: 'CL03', name: 'Cleaning - Waste bin empty & disposal' },
  // Electrical
  { code: 'EL01', name: 'Electrical - Power socket outlet trip/defect' },
  { code: 'EL02', name: 'Electrical - Light fitting / LED bulb replacement' },
  { code: 'EL03', name: 'Electrical - Distribution Board (DB) breaker tripped' },
  { code: 'EL04', name: 'Electrical - Water heater power supply cut' },
  // Equipment
  { code: 'EQ01', name: 'Equipment - Commercial kitchen bain-marie warmer' },
  { code: 'EQ02', name: 'Equipment - Commercial refrigerator / cold room' },
  { code: 'EQ03', name: 'Equipment - Industrial laundry washing machine' },
  // Fighting / Fire Systems
  { code: 'FS01', name: 'Fire Systems - Optical smoke detector trouble' },
  { code: 'FS02', name: 'Fire Systems - Fire extinguisher inspection & refill' },
  { code: 'FS03', name: 'Fire Systems - Break glass call point damaged' },
  // General Maintenance
  { code: 'GN01', name: 'General - Miscellaneous handyman repairs' },
  { code: 'GN02', name: 'General - Signage, notice board mounting' },
  // Housekeeping
  { code: 'HK01', name: 'Housekeeping - Mattress / linen change' },
  { code: 'HK02', name: 'Housekeeping - Room amenities replenishment' },
  // HSE
  { code: 'HS01', name: 'HSE - Safety barrier / trip hazard rectification' },
  { code: 'HS02', name: 'HSE - Chemical storage inspection' },
  // HVAC
  { code: 'HV01', name: 'HVAC - Split AC unit not cooling / warm air' },
  { code: 'HV02', name: 'HVAC - AC water leakage inside room' },
  { code: 'HV03', name: 'HVAC - AC remote control not responding' },
  { code: 'HV04', name: 'HVAC - Fan coil unit loud abnormal noise' },
  // IT
  { code: 'IT01', name: 'IT - Wi-Fi access point offline / weak signal' },
  { code: 'IT02', name: 'IT - Network RJ45 data port damaged' },
  // Landscaping
  { code: 'LS01', name: 'Landscaping - Irrigation sprinkler leakage' },
  { code: 'LS02', name: 'Landscaping - Lawn mowing & tree trimming' },
  // Laundry
  { code: 'LD01', name: 'Laundry - Dryer machine lint trap & heating' },
  { code: 'LD02', name: 'Laundry - Ironing board & press iron repair' },
  // Mechanical
  { code: 'ME01', name: 'Mechanical - Water booster pump vibration' },
  { code: 'ME02', name: 'Mechanical - Sewage lifting station fault' },
  // Pest Control
  { code: 'PC01', name: 'Pest Control - General insect spray treatment' },
  { code: 'PC02', name: 'Pest Control - Rodent bait station inspection' },
  // Plumbing
  { code: 'PL01', name: 'Plumbing - Toilet flush mechanism / siphon leak' },
  { code: 'PL02', name: 'Plumbing - Wash basin tap / mixer leaking' },
  { code: 'PL03', name: 'Plumbing - Shower mixer / head blockage' },
  { code: 'PL04', name: 'Plumbing - Sewer floor drain blocked / overflow' },
  // Waste Management
  { code: 'WM01', name: 'Waste Management - Compactor bin clearing' },
  { code: 'WM02', name: 'Waste Management - Recycling skips exchange' },
];

const MASTER_ASSETS = [
  { code: 'AST-DRW-01', name: 'Furniture Drawer Runner / Slider', category: 'Civil / Furniture' },
  { code: 'AST-DSK-004', name: 'Executive Work Desk 160cm', category: 'Furniture' },
  { code: 'AST-CHR-012', name: 'Ergonomic Office Swivel Chair', category: 'Furniture' },
  { code: 'AST-DRW-02', name: 'Bedside 3-Drawer Nightstand', category: 'Furniture' },
  { code: 'AST-WRD-001', name: 'Wooden 2-Door Bedroom Wardrobe', category: 'Furniture' },
  { code: 'AST-BED-005', name: 'Single Bed Frame & Orthopedic Mattress', category: 'Furniture' },
  { code: 'AST-AC-8821', name: 'Split AC Inverter 2.5 Ton (Gree)', category: 'HVAC' },
  { code: 'AST-AC-8822', name: 'Ceiling Cassette AC 3.0 Ton (Carrier)', category: 'HVAC' },
  { code: 'AST-AC-4410', name: 'Window AC 1.5 Ton (Zamil)', category: 'HVAC' },
  { code: 'AST-FW-02', name: 'Food Warmer (Bain Marie 4-Pot)', category: 'Kitchen Equipment' },
  { code: 'AST-REF-220', name: 'Double Door Refrigerator 450L', category: 'Appliances' },
  { code: 'AST-LT-204', name: 'LED Troffer Diffuser Panel 60x60', category: 'Electrical' },
  { code: 'AST-LT-108', name: 'LED Downlight Circular 18W', category: 'Electrical' },
  { code: 'AST-SD-C10-004', name: 'Optical Smoke Detector Addressable', category: 'Fire Systems' },
  { code: 'AST-BLR-100L', name: 'Commercial Water Boiler / Heater 100L', category: 'Plumbing' },
  { code: 'AST-PMP-03', name: 'Booster Water Pump 5.5kW', category: 'Mechanical' },
  { code: 'AST-WAP-33', name: 'Cisco Enterprise Wi-Fi 6 AP', category: 'IT Network' },
  { code: 'AST-TV-55', name: 'Smart LED Display TV 55-inch', category: 'Appliances' },
  { code: 'AST-WSH-10K', name: 'Industrial Washing Machine 10KG', category: 'Laundry' },
  { code: 'AST-FLS-01', name: 'Dual Flush Water Valve System', category: 'Plumbing' },
  { code: 'AST-MIX-02', name: 'Hot/Cold Ceramic Basin Mixer Tap', category: 'Plumbing' },
];

export const PlanonWorkOrderModal: React.FC<PlanonWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDiscipline,
}) => {
  // Form State: clean initial state (nothing auto-selected by default)
  const [customer, setCustomer] = useState('');
  const [requestor, setRequestor] = useState('');
  const [requestCategory, setRequestCategory] = useState('');
  const [property, setProperty] = useState('');
  const [space, setSpace] = useState('');
  const [floor, setFloor] = useState<BuildingFloor>('GF');
  const [assetId, setAssetId] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('P3 - Medium');
  const [planonPriority, setPlanonPriority] = useState<
    'AMA_P1, Critical (Immediate)' | 'AMA_P2, High (Urgent)' | 'AMA_P3, Low (Routine)' | 'AMA_P4, Scheduled'
  >('AMA_P3, Low (Routine)');
  
  // Attachments
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; type: string }>>([]);

  // Active Autocomplete Dropdown State (which field has suggestions open)
  const [activeSuggestionField, setActiveSuggestionField] = useState<
    'CUSTOMER' | 'REQUESTOR' | 'CATEGORY' | 'PROPERTY' | 'SPACE' | 'ASSET' | null
  >(null);

  // Full Lookup modal helper
  const [activeLookup, setActiveLookup] = useState<
    'NONE' | 'CUSTOMER' | 'REQUESTOR' | 'CATEGORY' | 'PROPERTY' | 'SPACE' | 'ASSET'
  >('NONE');
  const [lookupFilterText, setLookupFilterText] = useState('');

  // Live master store subscription
  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => {
    return PlanonMasterStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  // Always reset fields when modal opens to ensure nothing is pre-selected
  useEffect(() => {
    if (isOpen) {
      setCustomer('');
      setRequestor('');
      setRequestCategory('');
      setProperty('');
      setSpace('');
      setFloor('GF');
      setAssetId('');
      setDescription('');
      setComment('');
      setAttachments([]);
      setActiveSuggestionField(null);
      setActiveLookup('NONE');
      setLookupFilterText('');
    }
  }, [isOpen]);

  const masterCustomers = useMemo(() => PlanonMasterStore.getCustomers(), [storeTick]);
  const masterRequestors = useMemo(() => PlanonMasterStore.getRequestors(), [storeTick]);
  const masterCategories = useMemo(() => PlanonMasterStore.getCategories(), [storeTick]);
  const masterAssets = useMemo(() => PlanonMasterStore.getAssets(), [storeTick]);

  // Space updater with automatic floor detection
  const handleUpdateSpace = (newSpace: string) => {
    setSpace(newSpace);
    const detected = detectFloorFromSpace(newSpace);
    setFloor(detected);
  };

  // Real-time lookup lists including custom properties added in Manage
  const filteredProperties = useMemo(() => {
    return PlanonMasterStore.searchProperties(lookupFilterText, 100);
  }, [lookupFilterText, storeTick]);

  // Space lookup filtered strictly by the selected property
  const filteredSpaces = useMemo(() => {
    return PlanonMasterStore.getSpacesForProperty(property, lookupFilterText, 100);
  }, [property, lookupFilterText, storeTick]);

  // Real-time Autocomplete Suggestions for typing 1-2+ letters
  const customerSuggestions = useMemo(() => {
    const q = customer.trim().toLowerCase();
    if (!q) return masterCustomers.slice(0, 6);
    return masterCustomers.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [customer, masterCustomers]);

  const requestorSuggestions = useMemo(() => {
    const q = requestor.trim().toLowerCase();
    if (!q) return masterRequestors.slice(0, 6);
    return masterRequestors.filter(
      (r) =>
        r.badge.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.dept.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [requestor, masterRequestors]);

  const categorySuggestions = useMemo(() => {
    const q = requestCategory.trim().toLowerCase();
    const list = masterCategories;
    if (!q) {
      if (initialDiscipline) {
        const match = list.filter(
          (c) =>
            c.code.toLowerCase().startsWith(initialDiscipline.code.slice(0, 2).toLowerCase()) ||
            c.name.toLowerCase().includes(initialDiscipline.name.toLowerCase())
        );
        return match.length > 0 ? match.concat(list.filter((c) => !match.includes(c))).slice(0, 8) : list.slice(0, 8);
      }
      return list.slice(0, 8);
    }
    return list.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [requestCategory, initialDiscipline, masterCategories]);

  // Property suggestions derived from PlanonMasterStore (Includes custom properties created in Manage)
  const propertySuggestions = useMemo(() => {
    const q = property.trim();
    const locationMatches = PlanonMasterStore.searchProperties(q, 20);
    return locationMatches.map((loc) => {
      let tag = 'Location';
      if (loc.startsWith('TBCV1')) tag = 'Stage 1';
      else if (loc.startsWith('TBCV2')) tag = 'Stage 2';
      else if (loc.startsWith('TBCV3')) tag = 'Stage 3';
      else tag = 'Custom';
      return {
        code: loc,
        label: loc,
        tag,
      };
    });
  }, [property, storeTick]);

  // Space suggestions strictly filtered by current property
  const spaceSuggestions = useMemo(() => {
    const q = space.trim();
    const isFullCode = property && q.toLowerCase().startsWith(property.toLowerCase());
    const searchQuery = isFullCode ? '' : q;

    const spaces = PlanonMasterStore.getSpacesForProperty(property, searchQuery, 40);
    return spaces.map((s) => ({
      spaceNumber: s.spaceNumber,
      name: s.name,
      desc: `${s.stage || ''} • Cluster ${s.cluster || ''} • Bldg ${s.building || ''} (Unit ${s.unit || ''})`,
    }));
  }, [property, space, storeTick]);

  const assetSuggestions = useMemo(() => {
    const q = assetId.trim().toLowerCase();
    if (!q) return masterAssets.slice(0, 7);
    return masterAssets.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [assetId, masterAssets]);

  // Discipline is preserved for header and category trade matching, without auto-filling default fields

  if (!isOpen) return null;

  const currentDisciplineName = initialDiscipline ? initialDiscipline.name : 'CIVIL';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        type: f.type || 'image/jpeg',
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Deduce property details dynamically from CSV structure
    let deducedStage: VillageStage = 'Stage 2';
    let deducedCluster: ClusterId = 'I';
    let deducedType: ClusterType = 'WORKERS';
    let deducedBuilding = 1;

    if (property.includes('TBCV1') || property.includes('Stage 1')) {
      deducedStage = 'Stage 1';
    } else if (property.includes('TBCV3') || property.includes('Stage 3')) {
      deducedStage = 'Stage 3';
    }

    // Extract cluster letter e.g. TBCV2-I-I09
    const propTokens = property.replace(/,/g, ' ').split(/[\s-]+/);
    for (const tok of propTokens) {
      if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'].includes(tok.toUpperCase())) {
        deducedCluster = tok.toUpperCase() as ClusterId;
        break;
      }
    }

    if (['H', 'L', 'D'].includes(deducedCluster)) {
      deducedType = 'VIP';
    }

    // Extract building number e.g. I09 -> 9
    const bldMatch = property.match(/[A-Za-z](\d{2})/);
    if (bldMatch && bldMatch[1]) {
      deducedBuilding = parseInt(bldMatch[1], 10);
    }

    const categoryTrade: TicketTradeCategory = initialDiscipline ? initialDiscipline.id : 'CIVIL';
    const orderGroupCode = initialDiscipline ? initialDiscipline.code : '01.01';

    const finalCustomer = customer || 'Red Sea Global (RSG) - Amaala Project';
    const finalRequestor = requestor || 'TBCV_2616191, YADAV, RAMRESH';

    const ticketPayload = {
      project: 'Amaala Construction Village',
      client: finalCustomer,
      customer: finalCustomer,
      stage: deducedStage,
      cluster: deducedCluster,
      clusterType: deducedType,
      buildingNumber: deducedBuilding,
      buildingCategory: (deducedType === 'VIP' ? 'Executive' : 'Workers') as BuildingCategory,
      floor,
      unitNumber: space ? (space.includes('Room') ? space.split('Room ')[1] : space) : 'General',
      locationCode: space ? `${property} / ${space}` : property,
      propertyName: property,
      spaceName: space || property,
      requestCategoryCode: requestCategory,
      assetId: assetId || 'N/A',
      orderGroup: `${orderGroupCode}, ${currentDisciplineName}`,
      category: categoryTrade,
      subCategory: description,
      priority,
      planonPriority,
      status: 'NEW' as const,
      title: description,
      description: comment ? `${description} (${comment})` : description,
      comment: comment || description,
      reporterName: finalRequestor.includes(', ') ? finalRequestor.split(', ')[1] : finalRequestor,
      reporterBadge: finalRequestor.includes(', ') ? finalRequestor.split(', ')[0] : 'TBCV_STAFF',
      reporterPhone: '+966 50 261 6191',
      reporterDepartment: 'Operations & Maintenance',
      company: 'TAMIMI Global' as const,
      timeToCompleteScore: 1,
      attachedFiles: attachments,
    };

    onSubmit(ticketPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* 1. Modal Header (Exact Planon Style from Screenshot 2) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                {currentDisciplineName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                FM Reactive Work Order Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto"
        >
          {/* Customer */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-rose-500 font-black mr-1">*</span> Customer
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Type or select</span>
            </div>
            <div className="relative">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden shadow-sm transition-all">
                <input
                  type="text"
                  required
                  value={customer}
                  onFocus={() => setActiveSuggestionField('CUSTOMER')}
                  onBlur={() => setTimeout(() => setActiveSuggestionField((cur) => (cur === 'CUSTOMER' ? null : cur)), 200)}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setActiveSuggestionField('CUSTOMER');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customerSuggestions.length > 0) {
                        setCustomer(customerSuggestions[0]);
                        setActiveSuggestionField(null);
                      }
                    }
                  }}
                  placeholder=""
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuggestionField(null);
                    setActiveLookup('CUSTOMER');
                  }}
                  title="Lookup Customer"
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Customer Suggestions Dropdown */}
              {activeSuggestionField === 'CUSTOMER' && customerSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Matching Customers ({customerSuggestions.length})
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Click to select</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {customerSuggestions.map((cust, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCustomer(cust);
                          setActiveSuggestionField(null);
                        }}
                        className="px-3.5 py-2 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cust}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requestor */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Requestor
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Search by name, badge, or department</span>
            </div>
            <div className="relative">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden shadow-sm transition-all">
                <input
                  type="text"
                  value={requestor}
                  onFocus={() => setActiveSuggestionField('REQUESTOR')}
                  onBlur={() => setTimeout(() => setActiveSuggestionField((cur) => (cur === 'REQUESTOR' ? null : cur)), 200)}
                  onChange={(e) => {
                    setRequestor(e.target.value);
                    setActiveSuggestionField('REQUESTOR');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (requestorSuggestions.length > 0) {
                        const r = requestorSuggestions[0];
                        setRequestor(`${r.badge}, ${r.name}`);
                        setActiveSuggestionField(null);
                      }
                    }
                  }}
                  placeholder=""
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuggestionField(null);
                    setActiveLookup('REQUESTOR');
                  }}
                  title="Lookup Requestor"
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Requestor Suggestions Dropdown */}
              {activeSuggestionField === 'REQUESTOR' && requestorSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Matching Personnel ({requestorSuggestions.length})
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Click to select</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {requestorSuggestions.map((r, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setRequestor(`${r.badge}, ${r.name}`);
                          setActiveSuggestionField(null);
                        }}
                        className="px-3.5 py-2.5 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                              {r.badge}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{r.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {r.dept} • {r.role}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Request Category */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-rose-500 font-black mr-1">*</span> Request Category
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Type code or defect description</span>
            </div>
            <div className="relative">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden shadow-sm transition-all">
                <input
                  type="text"
                  required
                  value={requestCategory}
                  onFocus={() => setActiveSuggestionField('CATEGORY')}
                  onBlur={() => setTimeout(() => setActiveSuggestionField((cur) => (cur === 'CATEGORY' ? null : cur)), 200)}
                  onChange={(e) => {
                    setRequestCategory(e.target.value);
                    setActiveSuggestionField('CATEGORY');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (categorySuggestions.length > 0) {
                        const cat = categorySuggestions[0];
                        setRequestCategory(`${cat.code}, ${cat.name}`);
                        setDescription(cat.name);
                        setActiveSuggestionField(null);
                      }
                    }
                  }}
                  placeholder=""
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuggestionField(null);
                    setActiveLookup('CATEGORY');
                  }}
                  title="Lookup Category"
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Category Suggestions Dropdown */}
              {activeSuggestionField === 'CATEGORY' && categorySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Categories ({categorySuggestions.length})
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Click to select & apply</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {categorySuggestions.map((cat, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setRequestCategory(`${cat.code}, ${cat.name}`);
                          setDescription(cat.name);
                          setActiveSuggestionField(null);
                        }}
                        className="px-3.5 py-2.5 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 pr-2">
                          <span className="font-mono text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                            {cat.code}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                            {cat.name}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                          Apply
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-rose-500 font-black mr-1">*</span> Property
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Type building or location code</span>
            </div>
            <div className="relative">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden shadow-sm transition-all">
                <input
                  type="text"
                  required
                  value={property}
                  onFocus={() => setActiveSuggestionField('PROPERTY')}
                  onBlur={() => setTimeout(() => setActiveSuggestionField((cur) => (cur === 'PROPERTY' ? null : cur)), 200)}
                  onChange={(e) => {
                    setProperty(e.target.value);
                    setActiveSuggestionField('PROPERTY');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (propertySuggestions.length > 0) {
                        const prop = propertySuggestions[0];
                        setProperty(prop.code);
                        setActiveSuggestionField(null);
                      }
                    }
                  }}
                  placeholder=""
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuggestionField(null);
                    setActiveLookup('PROPERTY');
                  }}
                  title="Lookup Property"
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Property Suggestions Dropdown */}
              {activeSuggestionField === 'PROPERTY' && propertySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Matching Properties ({propertySuggestions.length})
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Click to select</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {propertySuggestions.map((prop, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setProperty(prop.code);
                          setActiveSuggestionField(null);
                        }}
                        className="px-3.5 py-2 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {prop.code}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {prop.label}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {prop.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Two-column layout: Floor and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Floor
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value as BuildingFloor)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="GF">Ground Floor (GF)</option>
                <option value="FF">First Floor (FF)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Priority SLA
              </label>
              <select
                value={planonPriority}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPlanonPriority(val);
                  if (val.includes('P1')) setPriority('P1 - Critical / Emergency');
                  else if (val.includes('P2')) setPriority('P2 - High');
                  else if (val.includes('P3')) setPriority('P3 - Medium');
                  else setPriority('P4 - Low / Normal');
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-semibold"
              >
                <option value="AMA_P1, Critical (Immediate)">AMA_P1, Critical (Immediate - 2h SLA)</option>
                <option value="AMA_P2, High (Urgent)">AMA_P2, High (Urgent - 4h SLA)</option>
                <option value="AMA_P3, Low (Routine)">AMA_P3, Low (Routine - 12h SLA)</option>
                <option value="AMA_P4, Scheduled">AMA_P4, Scheduled (48h SLA)</option>
              </select>
            </div>
          </div>

          {/* Space */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Space
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Type room name or space number</span>
            </div>
            <div className="relative">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden shadow-sm transition-all">
                <input
                  type="text"
                  value={space}
                  onFocus={() => setActiveSuggestionField('SPACE')}
                  onBlur={() => setTimeout(() => setActiveSuggestionField((cur) => (cur === 'SPACE' ? null : cur)), 200)}
                  onChange={(e) => {
                    handleUpdateSpace(e.target.value);
                    setActiveSuggestionField('SPACE');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (spaceSuggestions.length > 0) {
                        handleUpdateSpace(spaceSuggestions[0].spaceNumber);
                        setActiveSuggestionField(null);
                      }
                    }
                  }}
                  placeholder=""
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuggestionField(null);
                    setActiveLookup('SPACE');
                  }}
                  title="Lookup Space"
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Space Suggestions Dropdown */}
              {activeSuggestionField === 'SPACE' && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {property ? `Rooms in ${property} (${spaceSuggestions.length})` : `Matching Spaces (${spaceSuggestions.length})`}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Click to select</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {spaceSuggestions.length === 0 ? (
                      <div className="px-3.5 py-4 text-center text-xs text-slate-400">
                        No rooms found matching "{space}" in {property || 'this property'}.
                      </div>
                    ) : (
                      spaceSuggestions.map((spc, idx) => (
                        <div
                          key={idx}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            handleUpdateSpace(spc.spaceNumber);
                            setActiveSuggestionField(null);
                          }}
                          className="px-3.5 py-2.5 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {spc.spaceNumber}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {spc.name} • {spc.desc}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                            Select
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asset ID */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Asset ID
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Type asset name or tag</span>
            </div>
            <div className="relative">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden shadow-sm transition-all">
                <input
                  type="text"
                  value={assetId}
                  onFocus={() => setActiveSuggestionField('ASSET')}
                  onBlur={() => setTimeout(() => setActiveSuggestionField((cur) => (cur === 'ASSET' ? null : cur)), 200)}
                  onChange={(e) => {
                    setAssetId(e.target.value);
                    setActiveSuggestionField('ASSET');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (assetSuggestions.length > 0) {
                        const ast = assetSuggestions[0];
                        setAssetId(`${ast.code} - ${ast.name}`);
                        setActiveSuggestionField(null);
                      }
                    }
                  }}
                  placeholder=""
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuggestionField(null);
                    setActiveLookup('ASSET');
                  }}
                  title="Lookup Asset"
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Real-time Asset Suggestions Dropdown */}
              {activeSuggestionField === 'ASSET' && assetSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Matching Assets ({assetSuggestions.length})
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Click to select</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {assetSuggestions.map((ast, idx) => (
                      <div
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setAssetId(`${ast.code} - ${ast.name}`);
                          setActiveSuggestionField(null);
                        }}
                        className="px-3.5 py-2.5 hover:bg-blue-50/80 dark:hover:bg-slate-700/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {ast.code}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{ast.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Category: {ast.category}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Comment
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Files (Dropzone) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Files & Photos
            </label>
            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-5 text-center hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click or drag and drop defect photos
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, JPEG, PDF up to 10MB
                </p>
              </div>
            </div>

            {/* Uploaded List */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Action Buttons (Submit & Cancel matching Screenshot 2) */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              type="submit"
              className="min-w-[120px] rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-6 shadow-md shadow-blue-700/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[120px] rounded-full bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-6 shadow-md shadow-slate-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Quick Lookup Sub-Modal Dialogs */}
        {activeLookup !== 'NONE' && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Select {activeLookup}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveLookup('NONE')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {activeLookup === 'CUSTOMER' &&
                  masterCustomers.map((cust) => (
                    <button
                      key={cust}
                      type="button"
                      onClick={() => {
                        setCustomer(cust);
                        setActiveLookup('NONE');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between group cursor-pointer"
                    >
                      <span className="font-medium">{cust}</span>
                      <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}

                {activeLookup === 'REQUESTOR' &&
                  masterRequestors.map((req) => (
                    <button
                      key={req.badge}
                      type="button"
                      onClick={() => {
                        setRequestor(`${req.badge}, ${req.name}`);
                        setActiveLookup('NONE');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{req.badge}, {req.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{req.dept} • {req.role}</div>
                      </div>
                      <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}

                {activeLookup === 'PROPERTY' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={lookupFilterText}
                        onChange={(e) => setLookupFilterText(e.target.value)}
                        placeholder="Search property or cluster code..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredProperties.map((propCode) => (
                        <button
                          key={propCode}
                          type="button"
                          onClick={() => {
                            setProperty(propCode);
                            setActiveLookup('NONE');
                            setLookupFilterText('');
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between group font-mono cursor-pointer"
                        >
                          <div>
                            <div className="font-bold">{propCode}</div>
                            <div className="text-[10px] text-slate-400 font-sans">Amaala Construction Village Location</div>
                          </div>
                          <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeLookup === 'SPACE' && (
                  <div className="space-y-2">
                    {property && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          Filtered by Property: <strong className="font-mono">{property}</strong>
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          {filteredSpaces.length} rooms
                        </span>
                      </div>
                    )}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={lookupFilterText}
                        onChange={(e) => setLookupFilterText(e.target.value)}
                        placeholder={`Search room in ${property || 'property'}...`}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredSpaces.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No rooms found matching "{lookupFilterText}" in {property || 'this property'}.
                        </div>
                      ) : (
                        filteredSpaces.map((sp) => (
                          <button
                            key={sp.spaceNumber}
                            type="button"
                            onClick={() => {
                              handleUpdateSpace(sp.spaceNumber);
                              setActiveLookup('NONE');
                              setLookupFilterText('');
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <div className="font-bold font-mono text-blue-600 dark:text-blue-400">{sp.spaceNumber}</div>
                              <div className="text-[10px] text-slate-400">{sp.name} · {sp.stage} Cluster {sp.cluster} Bldg {sp.building} (Unit {sp.unit})</div>
                            </div>
                            <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeLookup === 'ASSET' &&
                  masterAssets.map((ast) => (
                    <button
                      key={ast.code}
                      type="button"
                      onClick={() => {
                        setAssetId(`${ast.code} - ${ast.name}`);
                        setActiveLookup('NONE');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between group font-mono cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{ast.code} - {ast.name}</span>
                        <div className="text-[10px] text-slate-400 font-sans">Category: {ast.category}</div>
                      </div>
                      <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}

                {activeLookup === 'CATEGORY' && (
                  <div className="space-y-1">
                    {masterCategories.map((cat) => (
                      <button
                        key={cat.code}
                        type="button"
                        onClick={() => {
                          setRequestCategory(`${cat.code}, ${cat.name}`);
                          setDescription(cat.name);
                          setActiveLookup('NONE');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{cat.code}</span>
                          <span>{cat.name}</span>
                        </div>
                        <Check className="h-3.5 w-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

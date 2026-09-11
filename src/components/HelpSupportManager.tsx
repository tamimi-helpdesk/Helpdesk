import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  PhoneCall,
  Building2,
  DoorOpen,
  BookOpen,
  LifeBuoy,
  FileQuestion,
  RotateCcw,
  CheckCircle2,
  Info,
  ShieldCheck,
  Headphones,
  ChevronLeft,
  LayoutGrid,
} from 'lucide-react';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_ROOM_EXTENSIONS,
  EMERGENCY_SCRIPTS,
  FIELD_SUPERVISORS,
  LAUNDRY_SCHEDULES,
  CAMP_ADDRESS,
} from '../data/departmentDirectory';
import {
  DepartmentContact,
  RoomExtension,
  EmergencyScript,
  SupportTicket,
  CampEmergencyHotline,
  NationalEmergencyHotline,
  FAQItem,
} from './help/types';
import { HotlinesTab } from './help/HotlinesTab';
import { DirectoryTab } from './help/DirectoryTab';
import { RoomsTab } from './help/RoomsTab';
import { TicketsTab } from './help/TicketsTab';
import { EmergencyScriptsTab } from './help/EmergencyScriptsTab';
import { FaqTab } from './help/FaqTab';
import { SupervisorsTab } from './help/SupervisorsTab';
import { LaundryScheduleTab } from './help/LaundryScheduleTab';
import { CampAddressCard } from './help/CampAddressCard';
import { Users, Sparkles, MapPin } from 'lucide-react';
import { StorageService, safeSetLocalStorage } from '../services/storageService';

// Initial default Hotlines
const DEFAULT_CAMP_HOTLINES: CampEmergencyHotline[] = [
  {
    id: 'camp-hl-1',
    title: 'Camp Fire & Safety Control',
    subtitle: 'Fire alarm trigger, gas leak, electrical hazard, building evacuation',
    extension: 'Ext. 4411',
    directPhone: '+966 13 888 4411',
    badgeLabel: '24/7 CRITICAL',
    themeColor: 'rose',
    iconType: 'flame',
  },
  {
    id: 'camp-hl-2',
    title: 'Camp Medical Clinic & First Aid',
    subtitle: 'Doctor on-call, paramedic dispatch, trauma care, ambulance triage',
    extension: 'Ext. 4422',
    directPhone: '+966 13 888 4422',
    badgeLabel: '24/7 MEDICAL',
    themeColor: 'emerald',
    iconType: 'stethoscope',
  },
  {
    id: 'camp-hl-3',
    title: 'Emergency Maintenance Hotline',
    subtitle: 'Major water burst, power blackout, sewage backup, AC chiller failure',
    extension: 'Ext. 4433',
    directPhone: '+966 13 888 4433',
    badgeLabel: '24/7 REPAIRS',
    themeColor: 'teal',
    iconType: 'wrench',
  },
];

const DEFAULT_NATIONAL_HOTLINES: NationalEmergencyHotline[] = [
  { id: 'nat-1', name: 'Unified Emergency', number: '911', desc: 'All Incidents & Police Dispatch' },
  { id: 'nat-2', name: 'Ambulance (Red Crescent)', number: '997', desc: 'Emergency Medical & Trauma' },
  { id: 'nat-3', name: 'Civil Defense (Fire)', number: '998', desc: 'Fire, Rescue & Hazardous Ops' },
  { id: 'nat-4', name: 'Police (General)', number: '999', desc: 'Public Security & Law Enforcement' },
  { id: 'nat-5', name: 'Saudi Electricity Co', number: '920000560', desc: 'Grid Outages & Power Supply' },
  { id: 'nat-6', name: 'Municipal Emergency', number: '940', desc: 'Environmental & Road Services' },
];

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    q: 'How do I submit a residential maintenance request (AC, plumbing, electricity)?',
    a: 'You can submit a ticket right in this Helpdesk module under "Support Tickets", or dial the Maintenance Helpdesk at Ext. 4433 for 24/7 dispatch. Urgent water/power issues are prioritized immediately.',
  },
  {
    id: 'faq-2',
    q: 'What are the Dining Hall (Mess Hall) meal timings?',
    a: 'Breakfast: 05:00 - 08:30 | Lunch: 11:30 - 14:30 | Dinner: 17:30 - 21:00. Midnight snacks are available at Mess Hall 1 from 23:00 - 01:00 for night shifts.',
  },
  {
    id: 'faq-3',
    q: 'How can I access the Camp Recreation facilities (Gym, Cinema, Barber)?',
    a: 'The Gym is open 24/7 with badge access. Barber appointments and Cinema reservations can be booked via the Facility Booking tab or by visiting the Recreation Office at Ext. 4488.',
  },
  {
    id: 'faq-4',
    q: 'Where do I collect laundry or report missing linen?',
    a: 'Visit the Central Laundry Depot in Block D (open 06:00 - 20:00) or call Housekeeping dispatch at Ext. 4425.',
  },
  {
    id: 'faq-5',
    q: 'How do I request an airport shuttle or local transport?',
    a: 'Submit a transport request in the Fleet & Transport tab 24 hours prior to travel, or call Logistics Dispatch at Ext. 4470.',
  },
];

const DEFAULT_INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TK-8491',
    name: 'Mohammed Al-Harbi',
    badgeId: 'TG-4820',
    roomNumber: 'R-204',
    phone: '055 918 2731',
    category: 'MAINTENANCE_DEFECT',
    priority: 'HIGH',
    subject: 'AC cooling unit blowing ambient air',
    description: 'Split AC in bedroom 204 is not cooling properly despite thermostat set to 21C.',
    status: 'IN_PROGRESS',
    createdAt: '2026-09-01 08:15',
    assignedOfficer: 'Eng. Khalid (HVAC Team)',
    resolutionNotes: 'Technician on-site checking freon gas pressure and capacitor.',
  },
  {
    id: 'tkt-2',
    ticketNumber: 'TK-8492',
    name: 'Ahmed Tariq',
    badgeId: 'TG-1049',
    roomNumber: 'A-108',
    phone: '050 334 1199',
    category: 'FACILITY_BOOKING',
    priority: 'MEDIUM',
    subject: 'Football pitch reservation for Friday tournament',
    description: 'Requesting 2-hour slot for departmental friendly football match this Friday 17:00-19:00.',
    status: 'RESOLVED',
    createdAt: '2026-08-31 16:40',
    assignedOfficer: 'Sports Coordinator',
    resolutionNotes: 'Booking confirmed and logged in sports schedule.',
  },
];

export const HelpSupportManager: React.FC<{ onRefresh?: () => void; onReturnToDashboard?: () => void }> = ({
  onRefresh,
  onReturnToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<
    'HOTLINES' | 'DIRECTORY' | 'SUPERVISORS' | 'LAUNDRY' | 'ROOMS' | 'CAMP_ADDRESS' | 'TICKETS' | 'SOPS' | 'FAQS'
  >('HOTLINES');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // 1. Camp Hotlines
  const [campHotlines, setCampHotlines] = useState<CampEmergencyHotline[]>(() => {
    const saved = localStorage.getItem('tamimi_camp_hotlines_v2');
    return saved ? JSON.parse(saved) : DEFAULT_CAMP_HOTLINES;
  });

  // 2. National Hotlines
  const [nationalHotlines, setNationalHotlines] = useState<NationalEmergencyHotline[]>(() => {
    const saved = localStorage.getItem('tamimi_national_hotlines_v2');
    return saved ? JSON.parse(saved) : DEFAULT_NATIONAL_HOTLINES;
  });

  // 3. Department Directory
  const [departments, setDepartments] = useState<DepartmentContact[]>(() => {
    const saved = localStorage.getItem('tamimi_department_directory_v2');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  // 4. Room Extensions
  const [roomExtensions, setRoomExtensions] = useState<RoomExtension[]>(() => {
    const saved = localStorage.getItem('tamimi_room_extensions_directory_v2');
    return saved ? JSON.parse(saved) : INITIAL_ROOM_EXTENSIONS;
  });

  // 5. Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('tamimi_support_tickets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t: SupportTicket) =>
              t &&
              t.id &&
              !StorageService.isIdDeleted(t.id) &&
              !(t.ticketNumber && StorageService.isIdDeleted(t.ticketNumber))
          );
        }
      }
      return DEFAULT_INITIAL_TICKETS.filter(
        (t) =>
          !StorageService.isIdDeleted(t.id) &&
          !(t.ticketNumber && StorageService.isIdDeleted(t.ticketNumber))
      );
    } catch {
      return DEFAULT_INITIAL_TICKETS;
    }
  });

  // 6. Emergency Scripts
  const [scripts, setScripts] = useState<EmergencyScript[]>(() => {
    const saved = localStorage.getItem('tamimi_emergency_scripts_v2');
    return saved ? JSON.parse(saved) : EMERGENCY_SCRIPTS;
  });

  // 7. FAQs
  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem('tamimi_resident_faqs_v2');
    return saved ? JSON.parse(saved) : DEFAULT_FAQS;
  });

  // 8. Field Supervisors & Operations Staff
  const [supervisors, setSupervisors] = useState(() => {
    const saved = localStorage.getItem('tamimi_field_supervisors_v2');
    return saved ? JSON.parse(saved) : FIELD_SUPERVISORS;
  });

  // 9. Laundry Master Schedules
  const [laundrySchedules, setLaundrySchedules] = useState(() => {
    const saved = localStorage.getItem('tamimi_laundry_schedules_v2');
    return saved ? JSON.parse(saved) : LAUNDRY_SCHEDULES;
  });

  // 10. Official Camp Address
  const [campAddress, setCampAddress] = useState(() => {
    const saved = localStorage.getItem('tamimi_camp_address_v2');
    return saved ? JSON.parse(saved) : CAMP_ADDRESS;
  });

  // Listen to background sync updates for support tickets
  useEffect(() => {
    const handleTicketsUpdate = () => {
      try {
        const saved = localStorage.getItem('tamimi_support_tickets_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(
              (t: SupportTicket) =>
                t &&
                t.id &&
                !StorageService.isIdDeleted(t.id) &&
                !(t.ticketNumber && StorageService.isIdDeleted(t.ticketNumber))
            );
            setTickets(valid);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('tickets_updated', handleTicketsUpdate);
    window.addEventListener('storage', handleTicketsUpdate);
    return () => {
      window.removeEventListener('tickets_updated', handleTicketsUpdate);
      window.removeEventListener('storage', handleTicketsUpdate);
    };
  }, []);

  // Trigger feedback toast
  const handleTriggerFeedback = (type: 'success' | 'info', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3000);
    if (onRefresh) onRefresh();
  };

  // Handlers for updating & persisting state
  const handleSaveCampHotlines = (updated: CampEmergencyHotline[]) => {
    setCampHotlines(updated);
    safeSetLocalStorage('tamimi_camp_hotlines_v2', JSON.stringify(updated));
  };
  const handleResetCampHotlines = () => {
    if (window.confirm('Reset all Emergency Hotlines to standard defaults?')) {
      handleSaveCampHotlines(DEFAULT_CAMP_HOTLINES);
      handleTriggerFeedback('info', 'Emergency Hotlines reset to defaults.');
    }
  };

  const handleSaveNationalHotlines = (updated: NationalEmergencyHotline[]) => {
    setNationalHotlines(updated);
    safeSetLocalStorage('tamimi_national_hotlines_v2', JSON.stringify(updated));
  };
  const handleResetNationalHotlines = () => {
    if (window.confirm('Reset National Emergency Numbers to defaults?')) {
      handleSaveNationalHotlines(DEFAULT_NATIONAL_HOTLINES);
      handleTriggerFeedback('info', 'National numbers reset to defaults.');
    }
  };

  const handleSaveDepartments = (updated: DepartmentContact[]) => {
    setDepartments(updated);
    safeSetLocalStorage('tamimi_department_directory_v2', JSON.stringify(updated));
  };
  const handleResetDepartments = () => {
    if (window.confirm('Reset Department Directory to standard list?')) {
      handleSaveDepartments(INITIAL_DEPARTMENTS);
      handleTriggerFeedback('info', 'Department directory reset to defaults.');
    }
  };

  const handleSaveRoomExtensions = (updated: RoomExtension[]) => {
    setRoomExtensions(updated);
    safeSetLocalStorage('tamimi_room_extensions_directory_v2', JSON.stringify(updated));
  };
  const handleResetRoomExtensions = () => {
    if (window.confirm('Reset all Room Extensions to standard dataset?')) {
      handleSaveRoomExtensions(INITIAL_ROOM_EXTENSIONS);
      handleTriggerFeedback('info', 'Room extensions reset to defaults.');
    }
  };

  const handleSaveTickets = (updated: SupportTicket[]) => {
    setTickets(updated);
    safeSetLocalStorage('tamimi_support_tickets_v2', JSON.stringify(updated));
  };
  const handleResetTickets = () => {
    if (window.confirm('Reset Support Tickets to sample tickets?')) {
      handleSaveTickets(DEFAULT_INITIAL_TICKETS);
      handleTriggerFeedback('info', 'Tickets reset to defaults.');
    }
  };

  const handleSaveScripts = (updated: EmergencyScript[]) => {
    setScripts(updated);
    safeSetLocalStorage('tamimi_emergency_scripts_v2', JSON.stringify(updated));
  };
  const handleResetScripts = () => {
    if (window.confirm('Reset Emergency SOPs to standard crisis scripts?')) {
      handleSaveScripts(EMERGENCY_SCRIPTS);
      handleTriggerFeedback('info', 'Emergency SOPs reset to defaults.');
    }
  };

  const handleSaveFaqs = (updated: FAQItem[]) => {
    setFaqs(updated);
    safeSetLocalStorage('tamimi_resident_faqs_v2', JSON.stringify(updated));
  };
  const handleResetFaqs = () => {
    if (window.confirm('Reset FAQs to standard resident handbook questions?')) {
      handleSaveFaqs(DEFAULT_FAQS);
      handleTriggerFeedback('info', 'FAQs reset to defaults.');
    }
  };

  // Supervisors Handlers
  const handleSaveSupervisors = (updated: typeof FIELD_SUPERVISORS) => {
    setSupervisors(updated);
    safeSetLocalStorage('tamimi_field_supervisors_v2', JSON.stringify(updated));
  };
  const handleResetSupervisors = () => {
    if (window.confirm('Reset Field Supervisors & Operations staff to official standard list?')) {
      handleSaveSupervisors(FIELD_SUPERVISORS);
      handleTriggerFeedback('info', 'Field Supervisors reset to standard team list.');
    }
  };

  // Laundry Schedule Handlers
  const handleSaveLaundrySchedules = (updated: typeof LAUNDRY_SCHEDULES) => {
    setLaundrySchedules(updated);
    safeSetLocalStorage('tamimi_laundry_schedules_v2', JSON.stringify(updated));
  };
  const handleResetLaundrySchedules = () => {
    if (window.confirm('Reset Camp Laundry Master Schedules to official rosters?')) {
      handleSaveLaundrySchedules(LAUNDRY_SCHEDULES);
      handleTriggerFeedback('info', 'Laundry rosters reset to standard schedules.');
    }
  };

  // Camp Address Handlers
  const handleSaveCampAddress = (updated: typeof CAMP_ADDRESS) => {
    setCampAddress(updated);
    safeSetLocalStorage('tamimi_camp_address_v2', JSON.stringify(updated));
  };
  const handleResetCampAddress = () => {
    if (window.confirm('Reset Camp Address to default National Address info?')) {
      handleSaveCampAddress(CAMP_ADDRESS);
      handleTriggerFeedback('info', 'Camp Address reset to defaults.');
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-teal-900 text-teal-100 border-teal-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Main Applet Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Help &amp; Support Directory
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[11px] font-black">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Camp directory, 24/7 hotlines, field supervisors, laundry rosters, room intercoms &amp; ticketing.
              </p>
            </div>
          </div>

          {/* Quick Tabs Navigation */}
          <div className="flex items-center space-x-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('HOTLINES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'HOTLINES'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Hotlines</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DIRECTORY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'DIRECTORY'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Directory ({departments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUPERVISORS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'SUPERVISORS'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Field Supervisors ({FIELD_SUPERVISORS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LAUNDRY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'LAUNDRY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Laundry Schedules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CAMP_ADDRESS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'CAMP_ADDRESS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Camp Address</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ROOMS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'ROOMS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Rooms ({roomExtensions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TICKETS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'TICKETS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Tickets ({tickets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SOPS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'SOPS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>SOPs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FAQS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'FAQS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>FAQs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'HOTLINES' && (
        <HotlinesTab
          campHotlines={campHotlines}
          nationalHotlines={nationalHotlines}
          onSaveCampHotlines={handleSaveCampHotlines}
          onSaveNationalHotlines={handleSaveNationalHotlines}
          onResetCampHotlines={handleResetCampHotlines}
          onResetNationalHotlines={handleResetNationalHotlines}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'DIRECTORY' && (
        <DirectoryTab
          departments={departments}
          onSaveDepartments={handleSaveDepartments}
          onResetDepartments={handleResetDepartments}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'SUPERVISORS' && (
        <SupervisorsTab
          supervisors={supervisors}
          onSaveSupervisors={handleSaveSupervisors}
          onResetSupervisors={handleResetSupervisors}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'LAUNDRY' && (
        <LaundryScheduleTab
          schedules={laundrySchedules}
          onSaveSchedules={handleSaveLaundrySchedules}
          onResetSchedules={handleResetLaundrySchedules}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'CAMP_ADDRESS' && (
        <div className="space-y-6">
          <CampAddressCard
            address={campAddress}
            onSaveAddress={handleSaveCampAddress}
            onResetAddress={handleResetCampAddress}
            onTriggerFeedback={handleTriggerFeedback}
          />
        </div>
      )}

      {activeTab === 'ROOMS' && (
        <RoomsTab
          roomExtensions={roomExtensions}
          onSaveRoomExtensions={handleSaveRoomExtensions}
          onResetRoomExtensions={handleResetRoomExtensions}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'TICKETS' && (
        <TicketsTab
          tickets={tickets}
          onSaveTickets={handleSaveTickets}
          onResetTickets={handleResetTickets}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'SOPS' && (
        <EmergencyScriptsTab
          scripts={scripts}
          onSaveScripts={handleSaveScripts}
          onResetScripts={handleResetScripts}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}

      {activeTab === 'FAQS' && (
        <FaqTab
          faqs={faqs}
          onSaveFaqs={handleSaveFaqs}
          onResetFaqs={handleResetFaqs}
          onTriggerFeedback={handleTriggerFeedback}
        />
      )}
    </div>
  );
};

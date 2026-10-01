import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Zap,
  Smartphone,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  Eye,
  FileText,
  Layers,
  Globe,
  Check,
  Share2,
  Users,
  Bell,
  Sparkles,
  Sliders,
  History,
  QrCode,
  Package,
  KeyRound,
  BedDouble,
  Flame,
  FileSpreadsheet,
  ChevronLeft,
} from 'lucide-react';
import { WhatsAppService, cleanWhatsAppNumber } from '../../services/whatsappService';
import { ToastService } from '../../services/toastService';
import { WhatsAppObservationManager } from './WhatsAppObservationManager';

export interface WhatsAppAutomationSectionProps {
  initialTab?: 'OBSERVATIONS' | 'OUTBOUND_PASSES';
  onBackToHub?: () => void;
}

export interface WhatsAppAutomationRule {
  id: string;
  name: string;
  category: 'Bookings' | 'Maintenance' | 'Parcels' | 'Handovers' | 'Accommodation' | 'Daily Digest';
  triggerEvent: string;
  templateType: 'BOOKING_PASS' | 'EMERGENCY_P1' | 'PARCEL_ARRIVAL' | 'KEY_HANDOVER' | 'ROOM_ADMISSION' | 'DAILY_DIGEST' | 'CUSTOM';
  recipientType: 'Resident / Guest Phone' | 'Emergency Maintenance Lead' | 'Supervisor Group' | 'Custom Number';
  defaultRecipientPhone: string;
  isActive: boolean;
  executionsCount: number;
  lastExecuted: string;
  customTemplateText?: string;
}

export interface WhatsAppLogItem {
  id: string;
  ruleId: string;
  ruleName: string;
  recipientPhone: string;
  messagePreview: string;
  timestamp: string;
  status: 'DELIVERED' | 'DISPATCHED' | 'SIMULATED';
  durationMs: number;
}

const DEFAULT_WHATSAPP_RULES: WhatsAppAutomationRule[] = [
  {
    id: 'WA-001',
    name: 'Instant Booking Digital Pass Auto-Dispatch',
    category: 'Bookings',
    triggerEvent: 'When facility slot booking status becomes CONFIRMED',
    templateType: 'BOOKING_PASS',
    recipientType: 'Resident / Guest Phone',
    defaultRecipientPhone: '+966554921010',
    isActive: true,
    executionsCount: 0,
    lastExecuted: 'Never',
  },
  {
    id: 'WA-002',
    name: 'P1 Emergency Incident Maintenance Lead Alert',
    category: 'Maintenance',
    triggerEvent: 'When new P1 Critical / Emergency ticket is logged',
    templateType: 'EMERGENCY_P1',
    recipientType: 'Emergency Maintenance Lead',
    defaultRecipientPhone: '+96655492101',
    isActive: true,
    executionsCount: 0,
    lastExecuted: 'Never',
  },
  {
    id: 'WA-003',
    name: 'Parcel & Courier Arrival Resident Alert',
    category: 'Parcels',
    triggerEvent: 'When new courier parcel is logged at Front Desk',
    templateType: 'PARCEL_ARRIVAL',
    recipientType: 'Resident / Guest Phone',
    defaultRecipientPhone: '+966501234567',
    isActive: true,
    executionsCount: 0,
    lastExecuted: 'Never',
  },
  {
    id: 'WA-004',
    name: 'Asset & Master Key Custody Handover Voucher',
    category: 'Handovers',
    triggerEvent: 'When key or critical maintenance tool is issued',
    templateType: 'KEY_HANDOVER',
    recipientType: 'Resident / Guest Phone',
    defaultRecipientPhone: '+966559876543',
    isActive: true,
    executionsCount: 0,
    lastExecuted: 'Never',
  },
  {
    id: 'WA-005',
    name: 'Resident Room & Medical Isolation Admission Voucher',
    category: 'Accommodation',
    triggerEvent: 'When resident is assigned to twin bed or isolation room',
    templateType: 'ROOM_ADMISSION',
    recipientType: 'Resident / Guest Phone',
    defaultRecipientPhone: '+966541122334',
    isActive: true,
    executionsCount: 0,
    lastExecuted: 'Never',
  },
  {
    id: 'WA-006',
    name: 'Daily 07:00 AM Camp Facility Readiness Digest',
    category: 'Daily Digest',
    triggerEvent: 'Scheduled daily cron trigger at 07:00 AM Arabia Standard Time',
    templateType: 'DAILY_DIGEST',
    recipientType: 'Supervisor Group',
    defaultRecipientPhone: '+96655492101',
    isActive: true,
    executionsCount: 0,
    lastExecuted: 'Never',
  },
];

const INITIAL_WA_LOGS: WhatsAppLogItem[] = [];

const COUNTRY_CODES = [
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
];

export const WhatsAppAutomationSection: React.FC<WhatsAppAutomationSectionProps> = ({
  initialTab = 'OBSERVATIONS',
  onBackToHub,
}) => {
  const [rules, setRules] = useState<WhatsAppAutomationRule[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_whatsapp_automations_v1');
      if (saved) {
        const parsed: WhatsAppAutomationRule[] = JSON.parse(saved);
        return parsed.map((r) =>
          r.executionsCount >= 20 ? { ...r, executionsCount: 0, lastExecuted: 'Never' } : r
        );
      }
      return DEFAULT_WHATSAPP_RULES;
    } catch {
      return DEFAULT_WHATSAPP_RULES;
    }
  });

  const [logs, setLogs] = useState<WhatsAppLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_whatsapp_logs_v1');
      if (saved) {
        const parsed: WhatsAppLogItem[] = JSON.parse(saved);
        return parsed.filter((l) => !['WAL-901', 'WAL-900', 'WAL-899'].includes(l.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [mainSubTab, setMainSubTab] = useState<'OBSERVATIONS' | 'OUTBOUND_PASSES'>(initialTab);
  const [copiedText, setCopiedText] = useState(false);

  // Test Dispatch / Sandbox State
  const [testCountryCode, setTestCountryCode] = useState('+966');
  const [testPhoneNumber, setTestPhoneNumber] = useState('554921010');
  const [testTemplate, setTestTemplate] = useState<WhatsAppAutomationRule['templateType']>('BOOKING_PASS');
  const [testRecipientName, setTestRecipientName] = useState('Eng. Tariq Al-Mansoor');
  const [testFacilityName, setTestFacilityName] = useState('VIP Bowling Alley & Lounge');
  const [testRoomNumber, setTestRoomNumber] = useState('Cluster H - Room 204');
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);

  // Persist rules & logs
  useEffect(() => {
    try {
      localStorage.setItem('tafga_whatsapp_automations_v1', JSON.stringify(rules));
    } catch {}
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem('tafga_whatsapp_logs_v1', JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Toggle rule
  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  // Generate Message based on selected template
  const getCompiledMessage = (type: WhatsAppAutomationRule['templateType']) => {
    const fullPhone = `${testCountryCode}${testPhoneNumber.replace(/^0+/, '')}`;
    const cleanPhone = cleanWhatsAppNumber(fullPhone);

    switch (type) {
      case 'BOOKING_PASS':
        return `🎫 *TAMIMI GLOBAL • DIGITAL PASS*
\`\`\`
┌──────────────────────────────┐
  PASS ID : #TG-9428-OK
  STATUS  : CONFIRMED [VERIFIED]
  ────────────────────────────
  FACILITY: ${testFacilityName}
  STAGE   : Court / Lane 01
  GUEST   : ${testRecipientName}
  PHONE   : ${fullPhone}
  DATE    : Today, 05-Sep-2026
  TIME    : 19:00 – 20:30
  ────────────────────────────
  AUTH-KEY: TG-7A1B-4C9D-OK
└──────────────────────────────┘
\`\`\`
📌 *FACILITY ACCESS RULES:*
• Present this digital barcode at entrance turnstile.
• Tamimi Camp Recreation & Sports Desk (+966-13-800-4400)
_Tamimi Global Hospitality_`;

      case 'EMERGENCY_P1':
        return `🚨 *CRITICAL EMERGENCY P1 DISPATCH ALERT*
━━━━━━━━━━━━━━━━━━━━━━
⚠️ *URGENT ACTION REQUIRED (SLA: 15 MINS)*
📄 *Ticket ID:* #WO-08942-P1
📍 *Location:* ${testRoomNumber}
🏢 *Facility:* VIP Residential Cluster
🏷️ *Discipline:* HVAC & Chiller Water Pipeline
👤 *Caller:* ${testRecipientName} (${fullPhone})
🕒 *Logged At:* ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━
⚡ *SUPERVISOR DIRECTIVE:*
• On-duty MEP Quick Response Team must dispatch immediately.
• Report physical arrival via Mobile CAFM Console.

_Tamimi Global Emergency Operations Center_`;

      case 'PARCEL_ARRIVAL':
        return `📦 *TAMIMI RECEPTION & PARCEL NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
✅ *PARCEL READY FOR COLLECTION*
📄 *Package ID:* #DHL-88912-SA
👤 *Recipient:* ${testRecipientName}
🏢 *Assigned Room:* ${testRoomNumber}
🚚 *Courier:* DHL Express (Saudi Post Tracking)
📍 *Pickup Desk:* Main Administration Reception Counter #2
📅 *Arrival Time:* Today, ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━
📌 *COLLECTION NOTICE:*
• Please show this WhatsApp notification & Staff ID to collect.
• Reception operates 24/7 for resident parcel handovers.

_Tamimi Global Camp Services_`;

      case 'KEY_HANDOVER':
        return `🔑 *TAMIMI CUSTODY & HANDOVER NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
✅ *ASSET & KEY HANDOVER ISSUED*
📄 *Handover Ref:* #HO-4419-KEY
🏷️ *Asset:* Master Substation Access Key #04 & Fluke Meter
👤 *Issued To:* ${testRecipientName} (${fullPhone})
🏢 *Unit / Location:* ${testRoomNumber}
📅 *Issue Date:* Today, ${new Date().toLocaleDateString()}
⏳ *Expected Return:* By 18:00 Today
━━━━━━━━━━━━━━━━━━━━━━
⚠️ *SECURITY & CUSTODY NOTICE:*
• Keep camp keys and calibration tools in secure custody.
• Return to Camp Security Desk upon duty shift handover.

_Tamimi Global Asset Management_`;

      case 'ROOM_ADMISSION':
        return `🏢 *TAMIMI RESIDENT & ROOM ADMISSION PASS*
━━━━━━━━━━━━━━━━━━━━━━
✅ *ADMISSION & CHECK-IN CONFIRMED*
📄 *Voucher Ref:* #ADM-2026-${testRoomNumber.replace(/[^a-zA-Z0-9]/g, '')}
🏢 *Building / Cluster:* ${testRoomNumber}
👤 *Resident / Guest:* ${testRecipientName}
📞 *Contact Mobile:* ${fullPhone}
📅 *Check-In Date:* Today, 05-Sep-2026
📅 *Check-Out Date:* 30-Sep-2026 (Open Rotation)
🏷️ *Category:* Executive Camp Accommodation
━━━━━━━━━━━━━━━━━━━━━━
📌 *CAMP INFORMATION & AMENITIES:*
• Daily Catering: Dining Hall 01 (Breakfast 05:30 - 08:30)
• Free Wi-Fi: "Tamimi-Resident-HighSpeed"
• 24/7 Helpdesk Hotline: Ext. 4400 or WhatsApp +966 55 492 101

_Tamimi Global Camp Operations_`;

      case 'DAILY_DIGEST':
        return `📊 *TAMIMI CAMP FACILITY DAILY READINESS DIGEST*
━━━━━━━━━━━━━━━━━━━━━━
🌅 *Date:* Saturday, 05 September 2026 (07:00 AM AST)
🏢 *Camp Location:* Tamimi Global Executive Complex (10 Facilities)

✅ *STATUS SNAPSHOT:*
• Active Facilities: 10 / 10 Operational (100% Ready)
• Confirmed Bookings Today: 48 Slots
• Open Maintenance Tickets: 4 (0 Critical P1, 2 Medium, 2 Low)
• Available Beds: 28 Units (Isolation: 6 Vacant)
• Parcels Waiting at Reception: 14 Packages

🛡️ *DUTY SUPERVISOR:* Eng. Khalid Al-Otaibi (+966-55-492-101)
_Automated Dispatch from CAFM System Engine_`;

      default:
        return `🔔 *TAMIMI GLOBAL CAMP ALERT*
Hello ${testRecipientName},
This is an automated operational notification regarding ${testFacilityName} (${testRoomNumber}).
For assistance, contact Camp Reception at +966 55 492 101.`;
    }
  };

  const compiledMessage = getCompiledMessage(testTemplate);

  const showNotice = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    ToastService.showSyncToast({
      source: 'System Hub',
      title,
      message,
      type,
    });
  };

  // Send via WhatsApp
  const handleLaunchWhatsApp = () => {
    const fullPhone = `${testCountryCode}${testPhoneNumber.replace(/^0+/, '')}`;
    const success = WhatsAppService.open(fullPhone, compiledMessage);

    if (success) {
      showNotice('WhatsApp', `Launching WhatsApp chat to ${fullPhone}...`, 'success');
      // Record log
      const newLog: WhatsAppLogItem = {
        id: `WAL-${Date.now().toString().slice(-4)}`,
        ruleId: 'WA-TEST',
        ruleName: `Direct Test: ${testTemplate}`,
        recipientPhone: fullPhone,
        messagePreview: compiledMessage.slice(0, 75) + '...',
        timestamp: 'Just now',
        status: 'DISPATCHED',
        durationMs: 64,
      };
      setLogs((prev) => [newLog, ...prev]);
    } else {
      showNotice('WhatsApp', 'Failed to launch WhatsApp window. Please enable popups.', 'error');
    }
  };

  // Share to Anyone / Group
  const handleShareAnyone = () => {
    WhatsAppService.shareAnyone(compiledMessage);
    showNotice('WhatsApp Share', 'Opening WhatsApp contact / group selector...', 'info');
  };

  // Copy text
  const handleCopyText = () => {
    navigator.clipboard.writeText(compiledMessage);
    setCopiedText(true);
    showNotice('Copied', 'WhatsApp message copied to clipboard!', 'success');
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Run Simulated Automated Trigger
  const handleSimulateRule = (rule: WhatsAppAutomationRule) => {
    setIsSimulatingDispatch(true);
    showNotice('WhatsApp Automation', `Simulating automated trigger for: ${rule.name}...`, 'info');

    setTimeout(() => {
      setIsSimulatingDispatch(false);
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id
            ? { ...r, executionsCount: r.executionsCount + 1, lastExecuted: 'Just now' }
            : r
        )
      );

      const newLog: WhatsAppLogItem = {
        id: `WAL-${Date.now().toString().slice(-4)}`,
        ruleId: rule.id,
        ruleName: rule.name,
        recipientPhone: rule.defaultRecipientPhone,
        messagePreview: `[AUTOMATED DISPATCH] Triggered by: ${rule.triggerEvent}`,
        timestamp: 'Just now',
        status: 'DELIVERED',
        durationMs: Math.floor(Math.random() * 40 + 60),
      };
      setLogs((prev) => [newLog, ...prev]);
      showNotice('Automation Triggered', `WhatsApp dispatch delivered to ${rule.defaultRecipientPhone}`, 'success');
    }, 800);
  };

  const filteredRules = rules.filter((r) => {
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
    return true;
  });

  const activeCount = rules.filter((r) => r.isActive).length;
  const totalSent = rules.reduce((acc, curr) => acc + curr.executionsCount, 0);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Sub-Navigation Switcher between Daily Observations & Outbound Dispatch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Return to Automation Hub"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-black hidden sm:inline">Back to Hub</span>
            </button>
          )}

          <button
            onClick={() => setMainSubTab('OBSERVATIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer ${
              mainSubTab === 'OBSERVATIONS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Daily Facility Inspection &amp; Live Observations</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-1" />
          </button>

          <button
            onClick={() => setMainSubTab('OUTBOUND_PASSES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              mainSubTab === 'OUTBOUND_PASSES'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Outbound Digital Passes &amp; Alert Gateway</span>
          </button>
        </div>
      </div>

      {mainSubTab === 'OBSERVATIONS' ? (
        <WhatsAppObservationManager
          onOpenOutboundPasses={() => setMainSubTab('OUTBOUND_PASSES')}
          onBack={onBackToHub}
        />
      ) : (
        <>
          {/* WhatsApp Section Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-emerald-700/50">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
              <MessageSquare className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  WhatsApp Automation Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 flex items-center space-x-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse" />
                  <span>wa.me Live Gateway</span>
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                Automated dispatch for facility booking passes, emergency maintenance alerts, parcel arrival notifications, and guest access vouchers.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setTestTemplate('BOOKING_PASS');
                handleLaunchWhatsApp();
              }}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-black rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Test Dispatch</span>
            </button>
            <button
              onClick={handleShareAnyone}
              className="px-3.5 py-2.5 bg-emerald-700/70 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-emerald-600/60 transition flex items-center space-x-1.5 cursor-pointer"
              title="Share with any contact or group"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share with Anyone</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Active Automation Rules
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {activeCount} of {rules.length}
            </span>
            <span className="text-xs text-emerald-600 font-bold">Active</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Automated WhatsApp triggers
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Dispatches Sent
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSent} Passes
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            100% Direct wa.me delivery
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Average Response Time
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              &lt; 85 ms
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Zero queue backlog
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Pass Security Authentication
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              Tamper-Proof
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Algorithmic auth hash verification
          </span>
        </div>
      </div>

      {/* Main 2-Column Split: Active Pipelines & Live Interactive Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Automated Pipelines List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Automated WhatsApp Rules &amp; Triggers</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configured pipeline rules for instant event-driven dispatch to residents and duty leads
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Categories</option>
                <option value="Bookings">Bookings</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Parcels">Parcels</option>
                <option value="Handovers">Handovers</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Daily Digest">Daily Digest</option>
              </select>
            </div>
          </div>

          {/* List of Rules */}
          <div className="space-y-3">
            {filteredRules.map((rule, idx) => (
              <div
                key={`wa-rule-${rule.id || 'rule'}-${idx}`}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        rule.templateType === 'EMERGENCY_P1'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                          : rule.templateType === 'BOOKING_PASS'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : rule.templateType === 'PARCEL_ARRIVAL'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : rule.templateType === 'KEY_HANDOVER'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                      }`}
                    >
                      {rule.templateType === 'EMERGENCY_P1' && <Flame className="w-4 h-4" />}
                      {rule.templateType === 'BOOKING_PASS' && <QrCode className="w-4 h-4" />}
                      {rule.templateType === 'PARCEL_ARRIVAL' && <Package className="w-4 h-4" />}
                      {rule.templateType === 'KEY_HANDOVER' && <KeyRound className="w-4 h-4" />}
                      {rule.templateType === 'ROOM_ADMISSION' && <BedDouble className="w-4 h-4" />}
                      {rule.templateType === 'DAILY_DIGEST' && <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {rule.id}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {rule.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {rule.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <strong className="text-slate-700 dark:text-slate-300">Trigger:</strong> {rule.triggerEvent}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    {/* Test simulate button */}
                    <button
                      disabled={isSimulatingDispatch}
                      onClick={() => handleSimulateRule(rule)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      title="Simulate this rule execution"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Test Trigger</span>
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        rule.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {rule.isActive ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-slate-500" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span>
                      Recipient: <strong className="text-slate-700 dark:text-slate-300">{rule.recipientType}</strong> ({rule.defaultRecipientPhone})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>
                      Dispatches: <strong className="text-emerald-600 dark:text-emerald-400">{rule.executionsCount}</strong>
                    </span>
                    <span>•</span>
                    <span>Last: {rule.lastExecuted}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Sandbox & Live Message Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Direct Dispatcher &amp; Live Preview
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Sandbox Mode
              </span>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Message Template
              </label>
              <select
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="BOOKING_PASS">🎫 1. Booking Digital Pass</option>
                <option value="EMERGENCY_P1">🚨 2. Emergency P1 Maintenance Alert</option>
                <option value="PARCEL_ARRIVAL">📦 3. Parcel Ready for Pickup</option>
                <option value="KEY_HANDOVER">🔑 4. Asset &amp; Key Handover</option>
                <option value="ROOM_ADMISSION">🏢 5. Room &amp; Bed Admission</option>
                <option value="DAILY_DIGEST">📊 6. Daily 07:00 AM Camp Digest</option>
              </select>
            </div>

            {/* Phone Number Input with Country Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Recipient WhatsApp Mobile Number
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={testCountryCode}
                  onChange={(e) => setTestCountryCode(e.target.value)}
                  className="w-28 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  {COUNTRY_CODES.map((c, cIdx) => (
                    <option key={`wa-cc-${c.code}-${cIdx}`} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="554921010"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Dynamic Parameter Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                  Resident / Guest Name
                </label>
                <input
                  type="text"
                  value={testRecipientName}
                  onChange={(e) => setTestRecipientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                  Room / Unit Location
                </label>
                <input
                  type="text"
                  value={testRoomNumber}
                  onChange={(e) => setTestRoomNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Simulated WhatsApp Phone Bubble Screen */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span>WhatsApp Message Preview</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {testCountryCode} {testPhoneNumber}
                </span>
              </div>

              {/* Realistic WhatsApp Chat Box */}
              <div className="p-3.5 rounded-2xl bg-[#efeae2] dark:bg-[#0b141a] border border-[#d1d7db] dark:border-[#222e35] shadow-inner font-sans">
                {/* Chat Bubble */}
                <div className="bg-white dark:bg-[#202c33] text-slate-800 dark:text-[#e9edef] rounded-2xl rounded-tl-xs p-3 shadow-xs space-y-2 border border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/10 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>Tamimi Global CAFM</span>
                    <span>Automated Dispatch</span>
                  </div>

                  <pre className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto text-slate-800 dark:text-slate-200 selection:bg-emerald-200">
                    {compiledMessage}
                  </pre>

                  <div className="flex items-center justify-end space-x-1 text-[10px] text-slate-400 dark:text-slate-400 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-cyan-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleLaunchWhatsApp}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </button>

              <button
                onClick={handleCopyText}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp Dispatch Audit Logs</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological record of automated trigger dispatches and simulated passes
            </p>
          </div>

          <button
            onClick={() => {
              const testLog: WhatsAppLogItem = {
                id: `WAL-${Date.now().toString().slice(-4)}`,
                ruleId: 'WA-001',
                ruleName: 'Manual Gateway Health Check Ping',
                recipientPhone: '+96655492101',
                messagePreview: '✅ WhatsApp Gateway connection heartbeat ping verified.',
                timestamp: 'Just now',
                status: 'DELIVERED',
                durationMs: 52,
              };
              setLogs((l) => [testLog, ...l]);
              showNotice('Ping Sent', 'Gateway health check recorded in log', 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Gateway Ping
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Pipeline Rule</th>
                <th className="py-2.5 px-3">Recipient Phone</th>
                <th className="py-2.5 px-3">Message Preview</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Delivery</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {logs.map((log, lIdx) => (
                <tr key={`wa-log-${log.id || 'log'}-${lIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {log.id}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{log.ruleName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.ruleId}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {log.recipientPhone}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-sm truncate">
                    {log.messagePreview}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {log.durationMs}ms
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Flame,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Sliders,
  Bell,
  Eye,
  Calendar,
  X,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Info,
  Check,
  Building2,
  ChevronLeft,
} from 'lucide-react';
import { TicketService } from '../../services/ticketService';
import { WorkOrderTicket, TicketPriority } from '../../types/ticket';
import * as XLSX from 'xlsx';

interface SLAManagerProps {
  onBack: () => void;
  onOpenTicketDetails?: (ticket: WorkOrderTicket) => void;
}

interface SLAPolicy {
  id: string;
  priority: TicketPriority;
  name: string;
  responseMinutes: number; // e.g. 15 mins
  resolutionHours: number; // e.g. 2 hours
  warningThresholdPercent: number; // e.g. 75%
  escalationRole: string;
  coverage: '24/7 Continuous' | 'Standard Working Hours (07:00 - 19:00)';
  penaltyClause: string;
  color: string;
}

const DEFAULT_SLA_POLICIES: SLAPolicy[] = [
  {
    id: 'SLA-P1',
    priority: 'P1 - Critical / Emergency',
    name: 'Critical Emergency (Life, Safety, Power Outage, Major Chiller Trip)',
    responseMinutes: 15,
    resolutionHours: 2,
    warningThresholdPercent: 70,
    escalationRole: 'Camp Operations Director & Duty Shift Supervisor',
    coverage: '24/7 Continuous',
    penaltyClause: 'SR 1,500/hr contract breach penalty per unmitigated hour',
    color: 'red',
  },
  {
    id: 'SLA-P2',
    priority: 'P2 - High',
    name: 'High Impact (VIP Cluster AC Issue, Main Corridor Lighting, Water Pressure)',
    responseMinutes: 30,
    resolutionHours: 6,
    warningThresholdPercent: 75,
    escalationRole: 'Facility Maintenance Manager & Lead Engineer',
    coverage: '24/7 Continuous',
    penaltyClause: 'SR 500/hr contract penalty after 6h threshold',
    color: 'amber',
  },
  {
    id: 'SLA-P3',
    priority: 'P3 - Medium',
    name: 'Standard Request (Room Fixtures, Minor Plumbing, Routine Defect)',
    responseMinutes: 120, // 2h
    resolutionHours: 24,
    warningThresholdPercent: 80,
    escalationRole: 'Lead Field Supervisor & Trade Dispatcher',
    coverage: 'Standard Working Hours (07:00 - 19:00)',
    penaltyClause: 'Warning flag logged in RSG Monthly KPI Scorecard',
    color: 'blue',
  },
  {
    id: 'SLA-P4',
    priority: 'P4 - Low / Normal',
    name: 'Scheduled / Minor Maintenance (Carpentry Touch-up, Non-urgent Inspection)',
    responseMinutes: 360, // 6h
    resolutionHours: 48,
    warningThresholdPercent: 85,
    escalationRole: 'Routine Trade Dispatch Queue',
    coverage: 'Standard Working Hours (07:00 - 19:00)',
    penaltyClause: 'Re-prioritized on next planned preventive route',
    color: 'slate',
  },
];

interface BreachRecord {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  cluster: string;
  date: string;
  breachMinutes: number;
  rootCause: string;
  resolutionNote: string;
  remedyAction: string;
}

const INITIAL_BREACH_LOG: BreachRecord[] = [
  {
    id: 'BR-2026-009',
    ticketNumber: 'WO-0144',
    title: 'VIP Villa H-04 Central AC Compressor Inverter Board Failure',
    priority: 'P1 - Critical',
    cluster: 'Cluster H (Executive VIP)',
    date: '2026-08-28',
    breachMinutes: 35,
    rootCause: 'Specialized Daikin inverter spare board had to be couriered from Duba central warehouse.',
    resolutionNote: 'Temporary portable industrial cooler deployed while board was replaced and tested.',
    remedyAction: 'Added 2x Daikin inverter boards to local ACV emergency buffer stock.',
  },
  {
    id: 'BR-2026-008',
    ticketNumber: 'WO-0112',
    title: 'Cluster G Sewage Lift Station High Level Alarm',
    priority: 'P2 - High',
    cluster: 'Cluster G (VIP)',
    date: '2026-08-19',
    breachMinutes: 20,
    rootCause: 'Float sensor clogged with construction debris, delayed access during client delegation inspection.',
    resolutionNote: 'Submersible sump pump cleaned and float switch recalibrated with dual redundancy.',
    remedyAction: 'Weekly preventative sensor flush added to Stage 1 MEP checklist.',
  },
];

// Helper to sanitize and guarantee all policies have valid numeric thresholds
const sanitizePolicies = (raw: any): SLAPolicy[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_SLA_POLICIES;
  }

  return DEFAULT_SLA_POLICIES.map((defPolicy) => {
    const found = raw.find(
      (p: any) =>
        p &&
        (p.id === defPolicy.id ||
          p.priority === defPolicy.priority ||
          (typeof p.priority === 'string' &&
            typeof defPolicy.priority === 'string' &&
            p.priority.slice(0, 2) === defPolicy.priority.slice(0, 2)))
    );

    if (!found) return { ...defPolicy };

    const resHours =
      typeof found.resolutionHours === 'number' && found.resolutionHours > 0
        ? found.resolutionHours
        : Number(found.resolutionHours) ||
          Number(found.resolution_hours) ||
          parseInt(found['Resolution SLA Target']) ||
          defPolicy.resolutionHours;

    const respMins =
      typeof found.responseMinutes === 'number' && found.responseMinutes > 0
        ? found.responseMinutes
        : Number(found.responseMinutes) || defPolicy.responseMinutes;

    const warnPct =
      typeof found.warningThresholdPercent === 'number' && found.warningThresholdPercent > 0
        ? found.warningThresholdPercent
        : Number(found.warningThresholdPercent) || defPolicy.warningThresholdPercent;

    return {
      id: defPolicy.id,
      priority: found.priority || defPolicy.priority,
      name: found.name || defPolicy.name,
      responseMinutes: respMins,
      resolutionHours: resHours,
      warningThresholdPercent: warnPct,
      escalationRole: found.escalationRole || defPolicy.escalationRole,
      coverage: found.coverage || defPolicy.coverage,
      penaltyClause: found.penaltyClause || defPolicy.penaltyClause,
      color: found.color || defPolicy.color,
    };
  });
};

// Safe helper to resolve the exact SLA policy for any ticket without crashing
const getPolicyForTicket = (ticket: WorkOrderTicket, activePolicies: SLAPolicy[]): SLAPolicy => {
  const safeList =
    Array.isArray(activePolicies) && activePolicies.length > 0
      ? activePolicies
      : DEFAULT_SLA_POLICIES;

  const prio = String(ticket?.priority || '').toUpperCase();

  let matched = safeList.find((p) => p && p.priority === ticket?.priority);

  if (!matched) {
    if (prio.includes('P1') || prio.includes('CRITICAL') || prio.includes('EMERGENCY')) {
      matched = safeList.find((p) => p && (p.id === 'SLA-P1' || String(p.priority).includes('P1')));
    } else if (prio.includes('P2') || prio.includes('HIGH')) {
      matched = safeList.find((p) => p && (p.id === 'SLA-P2' || String(p.priority).includes('P2')));
    } else if (prio.includes('P4') || prio.includes('LOW') || prio.includes('ROUTINE')) {
      matched = safeList.find((p) => p && (p.id === 'SLA-P4' || String(p.priority).includes('P4')));
    } else {
      matched = safeList.find((p) => p && (p.id === 'SLA-P3' || String(p.priority).includes('P3')));
    }
  }

  const base =
    matched ||
    safeList[2] ||
    safeList[0] ||
    DEFAULT_SLA_POLICIES[2] ||
    DEFAULT_SLA_POLICIES[0];

  return {
    ...base,
    resolutionHours: Number(base?.resolutionHours) > 0 ? Number(base.resolutionHours) : 24,
    warningThresholdPercent: Number(base?.warningThresholdPercent) > 0 ? Number(base.warningThresholdPercent) : 80,
    responseMinutes: Number(base?.responseMinutes) > 0 ? Number(base.responseMinutes) : 120,
  };
};

export const SLAManager: React.FC<SLAManagerProps> = ({ onBack, onOpenTicketDetails }) => {
  const [activeTab, setActiveTab] = useState<'RADAR' | 'POLICIES' | 'ESCALATION' | 'BREACHES'>('RADAR');
  const [tickets, setTickets] = useState<WorkOrderTicket[]>([]);
  const [policies, setPolicies] = useState<SLAPolicy[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_sla_policies_v1');
      if (saved) {
        return sanitizePolicies(JSON.parse(saved));
      }
      return DEFAULT_SLA_POLICIES;
    } catch {
      return DEFAULT_SLA_POLICIES;
    }
  });

  const [breachLog, setBreachLog] = useState<BreachRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_sla_breach_logs_v1');
      return saved ? JSON.parse(saved) : INITIAL_BREACH_LOG;
    } catch {
      return INITIAL_BREACH_LOG;
    }
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterHealth, setFilterHealth] = useState<'ALL' | 'SAFE' | 'WARNING' | 'BREACHED'>('ALL');
  const [filterTrade, setFilterTrade] = useState<string>('ALL');

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);

  // Escalate modal state
  const [escalateTicketModal, setEscalateTicketModal] = useState<WorkOrderTicket | null>(null);
  const [escalationNote, setEscalationNote] = useState('');
  const [escalateSuccessMsg, setEscalateSuccessMsg] = useState<string | null>(null);

  // Load tickets
  const loadTickets = () => {
    const list = TicketService.getTickets();
    setTickets(list);
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, []);

  // Listen to remote / custom sync events for SLA policies
  useEffect(() => {
    const handleSlaUpdate = () => {
      try {
        const raw = localStorage.getItem('tafga_sla_policies_v1');
        if (raw) {
          setPolicies(sanitizePolicies(JSON.parse(raw)));
        }
      } catch {}
    };
    window.addEventListener('sla_policies_updated', handleSlaUpdate);
    return () => window.removeEventListener('sla_policies_updated', handleSlaUpdate);
  }, []);

  // Save policies
  useEffect(() => {
    try {
      localStorage.setItem('tafga_sla_policies_v1', JSON.stringify(policies));
    } catch {}
  }, [policies]);

  // Compute live SLA health for each ticket
  const computedTickets = useMemo(() => {
    const now = new Date().getTime();

    return tickets.map((t) => {
      // Find policy safely with zero chance of undefined
      const pol = getPolicyForTicket(t, policies);
      const resolutionHours = Number(pol.resolutionHours) || 24;

      const createdTime = new Date(t.createdAt).getTime() || now - 3600000;
      const targetDurationMs = Math.max(resolutionHours * 3600 * 1000, 60000);
      const targetTime = t.targetResolutionTime ? new Date(t.targetResolutionTime).getTime() : createdTime + targetDurationMs;

      const isClosed = t.status === 'COMPLETED' || t.status === 'CLOSED';
      const elapsedMs = isClosed
        ? (t.updatedAt ? new Date(t.updatedAt).getTime() : now) - createdTime
        : now - createdTime;

      const percent = Math.min(Math.round((elapsedMs / targetDurationMs) * 100), 200);
      const remainingMs = targetTime - now;

      let health: 'SAFE' | 'WARNING' | 'BREACHED' = 'SAFE';
      if (isClosed) {
        health = elapsedMs <= targetDurationMs ? 'SAFE' : 'BREACHED';
      } else {
        if (remainingMs <= 0 || percent >= 100) {
          health = 'BREACHED';
        } else if (percent >= (pol.warningThresholdPercent || 75)) {
          health = 'WARNING';
        } else {
          health = 'SAFE';
        }
      }

      const hoursRemaining = Math.floor(Math.abs(remainingMs) / (1000 * 3600));
      const minsRemaining = Math.floor((Math.abs(remainingMs) % (1000 * 3600)) / (1000 * 60));

      return {
        ...t,
        slaPolicy: pol,
        targetTime,
        elapsedMs,
        percent,
        health,
        isClosed,
        remainingLabel:
          remainingMs <= 0
            ? `${hoursRemaining}h ${minsRemaining}m Overdue`
            : `${hoursRemaining > 0 ? `${hoursRemaining}h ` : ''}${minsRemaining}m left`,
      };
    });
  }, [tickets, policies]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return computedTickets.filter((t) => {
      if (filterPriority !== 'ALL' && !t.priority?.includes(filterPriority)) return false;
      if (filterHealth !== 'ALL' && t.health !== filterHealth) return false;
      if (filterTrade !== 'ALL' && t.category !== filterTrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchNum = t.ticketNumber?.toLowerCase().includes(q);
        const matchLoc = t.locationCode?.toLowerCase().includes(q) || t.unitNumber?.toLowerCase().includes(q);
        const matchReporter = t.reporterName?.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchLoc && !matchReporter) return false;
      }
      return true;
    });
  }, [computedTickets, filterPriority, filterHealth, filterTrade, searchQuery]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = computedTickets.length || 1;
    const open = computedTickets.filter((t) => !t.isClosed);
    const breached = computedTickets.filter((t) => t.health === 'BREACHED').length;
    const warning = computedTickets.filter((t) => !t.isClosed && t.health === 'WARNING').length;
    const safe = computedTickets.filter((t) => t.health === 'SAFE').length;
    const metCount = total - breached;
    const complianceRate = Math.round((metCount / total) * 1000) / 10;

    const p1Tickets = computedTickets.filter((t) => t.priority?.includes('P1'));
    const p1Breached = p1Tickets.filter((t) => t.health === 'BREACHED').length;
    const p1Compliance = p1Tickets.length ? Math.round(((p1Tickets.length - p1Breached) / p1Tickets.length) * 100) : 100;

    return {
      total,
      openCount: open.length,
      breached,
      warning,
      safe,
      complianceRate,
      p1Compliance,
    };
  }, [computedTickets]);

  // Handle policy edit save
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setPolicies((prev) => prev.map((p) => (p.id === editingPolicy.id ? editingPolicy : p)));
    setIsPolicyModalOpen(false);
    setEditingPolicy(null);
  };

  // Handle Escalation submit
  const handleConfirmEscalation = () => {
    if (!escalateTicketModal) return;
    const author = 'SLA Operations Lead';
    const note = `[EMERGENCY SLA ESCALATION] ${escalationNote.trim() || 'Threshold reached, dispatched to supervisory level.'}`;
    TicketService.updateStatus(escalateTicketModal.id, 'IN_PROGRESS', author, note);
    loadTickets();
    setEscalateSuccessMsg(`Ticket ${escalateTicketModal.ticketNumber} successfully escalated to ${escalateTicketModal.priority.includes('P1') ? 'Camp Operations Director' : 'Shift Lead Supervisor'}!`);
    setTimeout(() => {
      setEscalateSuccessMsg(null);
      setEscalateTicketModal(null);
      setEscalationNote('');
    }, 2000);
  };

  // Export SLA Report
  const handleExportSlaExcel = () => {
    const data = computedTickets.map((t) => ({
      'Ticket Number': t.ticketNumber,
      'Order Group': t.orderGroup || t.category,
      'Title / Issue': t.title,
      'Priority': t.priority,
      'Status': t.status,
      'Cluster / Stage': `${t.stage} - Cluster ${t.cluster}`,
      'Location': `${t.buildingCategory} Bldg ${t.buildingNumber} - Unit ${t.unitNumber}`,
      'Created At': t.createdAt,
      'Resolution SLA Target': `${t.slaPolicy?.resolutionHours ?? 24} Hours`,
      'SLA Health Status': t.health,
      'Remaining / Overdue': t.remainingLabel,
      'Assigned Tech': t.assignedTechnician?.name || 'Unassigned',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SLA Compliance Report');
    XLSX.writeFile(wb, `Tamimi_SLA_Compliance_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Service Level Agreement (SLA) Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target response &amp; resolution tracking, real-time countdowns, automated escalation, and contractual compliance matrix.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadTickets}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportSlaExcel}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (XLSX)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Overall Compliance
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {stats.complianceRate}%
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              +0.4%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Target: ≥ 95.0% contract standard
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            P1 Critical SLA Met
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.p1Compliance}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
            Zero critical breaches this week
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Active Work Orders
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.openCount}
            </span>
            <span className="text-xs text-slate-400">Under SLA Timer</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1 block">
            {stats.safe} on track, {stats.warning} warning
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            At-Risk / Warning
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.warning}
            </span>
            <span className="text-[10px] font-bold text-amber-600">&gt;75% Elapsed</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Automated alerts dispatched
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Breaches Logged
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-black ${stats.breached > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {stats.breached}
            </span>
            <span className="text-xs text-slate-400">This Period</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            Penalty mitigated: 100%
          </span>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('RADAR')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'RADAR'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Active Incidents Radar ({filteredTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('POLICIES')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'POLICIES'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          SLA Matrix &amp; Policies ({policies.length})
        </button>
        <button
          onClick={() => setActiveTab('ESCALATION')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'ESCALATION'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Escalation Hierarchy &amp; Protocols
        </button>
        <button
          onClick={() => setActiveTab('BREACHES')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'BREACHES'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Contractual Breach Log ({breachLog.length})
        </button>
      </div>

      {/* TAB 1: RADAR (LIVE COUNTDOWN & ACTIONS) */}
      {activeTab === 'RADAR' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket #, issue, location or reporter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                value={filterHealth}
                onChange={(e) => setFilterHealth(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All SLA Status</option>
                <option value="SAFE">🟢 On Track (Safe)</option>
                <option value="WARNING">🟡 Warning (&gt;70%)</option>
                <option value="BREACHED">🔴 Breached / Overdue</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Priorities</option>
                <option value="P1">P1 Critical</option>
                <option value="P2">P2 High</option>
                <option value="P3">P3 Medium</option>
                <option value="P4">P4 Normal</option>
              </select>
            </div>
          </div>

          {/* Incidents Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTickets.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
                <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Incidents Found</h3>
                <p className="text-xs text-slate-400 mt-1">No work orders match the current SLA filter parameters.</p>
              </div>
            ) : (
              filteredTickets.map((ticket, tIdx) => {
                const isBreached = ticket.health === 'BREACHED';
                const isWarning = ticket.health === 'WARNING';

                return (
                  <div
                    key={`sla-tkt-${ticket.id || 'tkt'}-${tIdx}`}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 shadow-xs flex flex-col justify-between space-y-3 ${
                      isBreached
                        ? 'border-red-300 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/10'
                        : isWarning
                        ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Badge and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {ticket.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              ticket.priority?.includes('P1')
                                ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300'
                                : ticket.priority?.includes('P2')
                                ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {ticket.priority?.split(' - ')[0] || 'P3'}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-black flex items-center space-x-1 ${
                            isBreached
                              ? 'text-red-600 dark:text-red-400'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{ticket.remainingLabel}</span>
                        </span>
                      </div>

                      {/* Title and Category */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {ticket.category} • {ticket.stage} Cluster {ticket.cluster} (Unit {ticket.unitNumber})
                      </p>

                      {/* SLA Progress Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isBreached ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(ticket.percent, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Target: {ticket.slaPolicy?.resolutionHours ?? 24}h</span>
                          <span
                            className={`font-bold ${
                              isBreached
                                ? 'text-red-600'
                                : isWarning
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {ticket.percent}% Elapsed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Tech: </span>
                        <strong className="text-slate-700 dark:text-slate-200">
                          {ticket.assignedTechnician?.name || 'Unassigned'}
                        </strong>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {ticket.health === 'WARNING' || ticket.health === 'BREACHED' ? (
                          <button
                            onClick={() => setEscalateTicketModal(ticket)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Flame className="w-3 h-3" />
                            <span>Escalate</span>
                          </button>
                        ) : null}

                        {onOpenTicketDetails && (
                          <button
                            onClick={() => onOpenTicketDetails(ticket)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            title="Inspect ticket"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POLICIES & TARGET MATRIX */}
      {activeTab === 'POLICIES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Configured SLA Tiers &amp; Thresholds</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official contract SLA thresholds agreed with Red Sea Global (RSG) for Amaala Construction Village.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800">
                {policies.length} Active SLA Tiers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-3">Priority Level</th>
                    <th className="py-3 px-3">Response Target</th>
                    <th className="py-3 px-3">Resolution Target</th>
                    <th className="py-3 px-3">Warning Threshold</th>
                    <th className="py-3 px-3">Hours of Coverage</th>
                    <th className="py-3 px-3">Escalation Recipient</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {policies.map((pol, pIdx) => (
                    <tr key={`sla-pol-${pol.id || 'pol'}-${pIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${
                              pol.id === 'SLA-P1'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                                : pol.id === 'SLA-P2'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {pol.priority}
                          </span>
                          <p className="text-[11px] text-slate-500 max-w-xs truncate">{pol.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {pol.responseMinutes} Minutes
                      </td>
                      <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                        {pol?.resolutionHours ?? 24} Hours
                      </td>
                      <td className="py-3 px-3 text-amber-600 font-bold">
                        {pol.warningThresholdPercent}% Elapsed
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {pol.coverage}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs">
                        {pol.escalationRole}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setEditingPolicy(pol);
                            setIsPolicyModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          Edit Target
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESCALATION PROTOCOLS */}
      {activeTab === 'ESCALATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Tier 1: Shift Supervisor Alert
                </h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Triggered automatically at <strong>50% of resolution SLA target</strong> if no technician has commenced work on site.
              </p>
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1">
                <div className="font-bold text-blue-900 dark:text-blue-200">Action:</div>
                <div className="text-blue-800 dark:text-blue-300">• Automated WhatsApp dispatch to On-Duty Shift Lead</div>
                <div className="text-blue-800 dark:text-blue-300">• Audio alarm on Reception Dispatch Console</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Tier 2: FM Operations Manager
                </h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Triggered automatically at <strong>75% of resolution SLA target</strong> (Warning Stage) when work order remains unresolved.
              </p>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200">Action:</div>
                <div className="text-amber-800 dark:text-amber-300">• Push notice to FM Operations Head</div>
                <div className="text-amber-800 dark:text-amber-300">• Immediate technician reallocation from routine tasks</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Tier 3: Executive Intervention
                </h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Triggered at <strong>90% SLA threshold or critical breach</strong> on P1 emergency issues (power/water/HVAC).
              </p>
              <div className="p-3 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-200/60 dark:border-red-800/40 text-xs space-y-1">
                <div className="font-bold text-red-900 dark:text-red-200">Action:</div>
                <div className="text-red-800 dark:text-red-300">• Direct notification to Camp Operations Director</div>
                <div className="text-red-800 dark:text-red-300">• Emergency parts courier dispatch authorized</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BREACH LOG */}
      {activeTab === 'BREACHES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Contractual SLA Breach &amp; Root Cause Audit</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed incident breakdown of historical SLA delays, corrective actions, and prevention measures.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-3">Ticket</th>
                    <th className="py-3 px-3">Priority / Cluster</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Overdue Time</th>
                    <th className="py-3 px-3">Root Cause Analysis</th>
                    <th className="py-3 px-3">Remedy &amp; Prevention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {breachLog.map((b, bIdx) => (
                    <tr key={`sla-esc-${b.id || 'esc'}-${bIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <span className="font-mono text-xs">{b.ticketNumber}</span>
                        <div className="text-[11px] text-slate-500 font-normal">{b.title}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-bold text-red-600 block">{b.priority}</span>
                        <span className="text-[10px] text-slate-400">{b.cluster}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{b.date}</td>
                      <td className="py-3 px-3 font-mono font-bold text-red-600">
                        +{b.breachMinutes} Mins
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs text-[11px] leading-relaxed">
                        {b.rootCause}
                      </td>
                      <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 max-w-xs text-[11px] font-medium leading-relaxed">
                        {b.remedyAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POLICY MODAL */}
      {isPolicyModalOpen && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Edit SLA Tier: {editingPolicy.priority}
              </h3>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Response Target (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  required
                  value={editingPolicy.responseMinutes}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, responseMinutes: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  required
                  value={editingPolicy?.resolutionHours ?? 24}
                  onChange={(e) =>
                    setEditingPolicy({ ...editingPolicy, resolutionHours: parseInt(e.target.value) || 2 })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Warning Threshold (% of total time)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  required
                  value={editingPolicy.warningThresholdPercent}
                  onChange={(e) =>
                    setEditingPolicy({
                      ...editingPolicy,
                      warningThresholdPercent: parseInt(e.target.value) || 75,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Escalation Recipient
                </label>
                <input
                  type="text"
                  required
                  value={editingPolicy.escalationRole}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, escalationRole: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCALATE MODAL */}
      {escalateTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Escalate Ticket: {escalateTicketModal.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setEscalateTicketModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {escalateSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold text-center">
                {escalateSuccessMsg}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{escalateTicketModal.title}</div>
                  <div className="text-slate-500">Priority: {escalateTicketModal.priority}</div>
                  <div className="text-red-600 font-bold">Target SLA: {escalateTicketModal.targetResolutionTime || '2 Hours'}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Escalation Note / Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide reason for escalation (e.g. resident escalation, parts delay, VIP priority)..."
                    value={escalationNote}
                    onChange={(e) => setEscalationNote(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEscalateTicketModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEscalation}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
                  >
                    Confirm Escalation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

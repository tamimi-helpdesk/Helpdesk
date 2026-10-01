import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  Send,
  Mail,
  Play,
  Pause,
  RefreshCw,
  Layers,
  Zap,
  ArrowRight,
  Eye,
  User,
  MapPin,
  Tag,
  Sparkles,
  X,
  ChevronRight,
  BarChart3,
  AlertCircle,
  FileText,
  Building2,
  Check,
  Sliders,
  History,
} from 'lucide-react';
import { Facility } from '../types';
import { SLAManager } from './sla/SLAManager';
import { AutomatedWorkflowManager } from './workflow/AutomatedWorkflowManager';
import { EmailManager } from './email/EmailManager';

interface FutureFacilityManagerProps {
  facility: Facility;
  onReturnToDashboard: () => void;
}

// ----------------------------------------------------
// TICKET MANAGEMENT TYPES & DATA
// ----------------------------------------------------
interface TicketRecord {
  id: string;
  title: string;
  category: string;
  location: string;
  priority: 'P1 - Critical' | 'P2 - High' | 'P3 - Medium' | 'P4 - Normal';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  reporter: string;
  assignee: string;
  createdAt: string;
  description: string;
}

const INITIAL_TICKETS: TicketRecord[] = [
  {
    id: 'TKT-2026-081',
    title: 'AC Chiller Malfunction & High Temperature in Block C',
    category: 'HVAC & Cooling',
    location: 'Residential Block C, Room 204',
    priority: 'P1 - Critical',
    status: 'IN_PROGRESS',
    reporter: 'Tariq Al-Mansoor (Unit 12)',
    assignee: 'Eng. Khalid (Facility Crew A)',
    createdAt: 'Today, 08:30 AM',
    description: 'Central air handler tripped, room temperature exceeded 28°C. Technicians dispatched with spare capacitor.',
  },
  {
    id: 'TKT-2026-082',
    title: 'High-Speed Wi-Fi AP Offline in Recreation Lounge',
    category: 'IT & Telecom',
    location: 'Cinema & Rec Hall Building',
    priority: 'P2 - High',
    status: 'OPEN',
    reporter: 'Recreation Supervisor',
    assignee: 'IT Infrastructure Helpdesk',
    createdAt: 'Today, 09:15 AM',
    description: 'Cisco PoE switch port flapping. Residents unable to connect to camp public Wi-Fi network.',
  },
  {
    id: 'TKT-2026-083',
    title: 'Drinking Water Cooler Filter Replacement & Sanitization',
    category: 'Plumbing',
    location: 'Mess Hall 1 Exterior Corridor',
    priority: 'P3 - Medium',
    status: 'RESOLVED',
    reporter: 'Catering Lead',
    assignee: 'Plumbing Maintenance Team',
    createdAt: 'Yesterday, 04:20 PM',
    description: 'Filter cartridge cycle complete. Dual cartridge replaced and flow rate verified at 4.2 L/min.',
  },
  {
    id: 'TKT-2026-084',
    title: 'Floodlight Tower 3 Bulb Replacement for Cricket Ground',
    category: 'Electrical',
    location: 'Cricket Ground Perimeter',
    priority: 'P3 - Medium',
    status: 'OPEN',
    reporter: 'Sports Coordinator',
    assignee: 'High-Voltage Team',
    createdAt: 'Today, 10:45 AM',
    description: 'Two 400W LED arrays dimmed on northeast mast. Scheduled for boom lift inspection before evening match.',
  },
];

// ----------------------------------------------------
// SLA MANAGEMENT TYPES & DATA
// ----------------------------------------------------
interface SLARule {
  priority: string;
  badgeColor: string;
  responseTarget: string;
  resolutionTarget: string;
  escalationTier: string;
  complianceRate: string;
}

const SLA_TIERS: SLARule[] = [
  {
    priority: 'P1 - Critical (Life/Safety/Outage)',
    badgeColor: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800',
    responseTarget: '15 Minutes',
    resolutionTarget: '2 Hours',
    escalationTier: 'Camp Operations Director & Shift Supervisor',
    complianceRate: '100%',
  },
  {
    priority: 'P2 - High (Major Facility Impact)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    responseTarget: '30 Minutes',
    resolutionTarget: '6 Hours',
    escalationTier: 'Facility Maintenance Manager',
    complianceRate: '97.8%',
  },
  {
    priority: 'P3 - Medium (Standard Request)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    responseTarget: '2 Hours',
    resolutionTarget: '24 Hours',
    escalationTier: 'Lead Field Supervisor',
    complianceRate: '98.5%',
  },
  {
    priority: 'P4 - Normal (Planned / Minor)',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    responseTarget: '6 Hours',
    resolutionTarget: '48 Hours',
    escalationTier: 'Routine Dispatch Queue',
    complianceRate: '99.2%',
  },
];

// ----------------------------------------------------
// WORKFLOW TYPES & DATA
// ----------------------------------------------------
interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
  executionsCount: number;
  lastExecuted: string;
}

const INITIAL_WORKFLOWS: WorkflowRule[] = [
  {
    id: 'WF-001',
    name: 'Auto-Dispatch P1 Emergency Incidents',
    trigger: 'On Ticket Created',
    condition: 'Priority == P1 - Critical',
    action: 'SMS On-Duty Maintenance Crew & Alert Operations Lead',
    isActive: true,
    executionsCount: 38,
    lastExecuted: 'Today, 08:31 AM',
  },
  {
    id: 'WF-002',
    name: 'Booking Confirmation Email Dispatch',
    trigger: 'On Slot Reserved',
    condition: 'Booking Status == Confirmed',
    action: 'Send Branded Email with Calendar ICS & Passcode',
    isActive: true,
    executionsCount: 412,
    lastExecuted: '12 minutes ago',
  },
  {
    id: 'WF-003',
    name: 'SLA Escalation Warning at 75% Target Time',
    trigger: 'Hourly Timer Check',
    condition: 'Remaining SLA Time < 25%',
    action: 'Send Telegram / Push Notice to Shift Supervisor',
    isActive: true,
    executionsCount: 94,
    lastExecuted: '45 minutes ago',
  },
  {
    id: 'WF-004',
    name: 'Auto-Archive Resolved Records',
    trigger: 'Nightly 02:00 AM Cron',
    condition: 'Ticket Status == Resolved > 72 Hours',
    action: 'Archive to Tamimi Historical Google Sheet Tab',
    isActive: false,
    executionsCount: 180,
    lastExecuted: 'Yesterday, 02:00 AM',
  },
];

// ----------------------------------------------------
// EMAIL TYPES & DATA
// ----------------------------------------------------
interface EmailTemplate {
  id: string;
  title: string;
  category: string;
  subject: string;
  previewSnippet: string;
  recipientType: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'EM-TMP-01',
    title: 'Facility Reservation Confirmation',
    category: 'Sports & Amenities',
    subject: 'Confirmed: Your Facility Reservation at Tamimi Global',
    previewSnippet: 'Dear Guest, your slot booking for {{facility_name}} on {{booking_date}} has been confirmed...',
    recipientType: 'Camp Resident / Guest',
    body: 'Dear {{resident_name}},\n\nYour reservation for {{facility_name}} ({{stage_name}}) has been approved.\nDate: {{booking_date}}\nTime: {{slot_time}}\nPasscode: {{access_code}}\n\nPlease present this email or your Badge ID upon arrival.\n\nBest Regards,\nTamimi Global Facilities Team',
  },
  {
    id: 'EM-TMP-02',
    title: 'Support Ticket Acknowledgment & SLA Notice',
    category: 'Customer Support',
    subject: '[{{ticket_id}}] Support Request Received - Target SLA {{target_hours}}h',
    previewSnippet: 'Your support ticket has been logged in our queue. A technician has been assigned...',
    recipientType: 'Incident Reporter',
    body: 'Hello {{reporter_name}},\n\nYour incident report "{{ticket_title}}" has been assigned to our maintenance team.\nTicket ID: {{ticket_id}}\nPriority: {{priority}}\nSLA Target Resolution: {{sla_target}}\n\nYou will receive a notification as soon as field technicians update the status.',
  },
  {
    id: 'EM-TMP-03',
    title: 'Camp Maintenance Bulletin & Alert',
    category: 'Broadcast & Operations',
    subject: 'Official Notice: Scheduled Facility Maintenance & Upgrade',
    previewSnippet: 'Notice to all residents: Scheduled routine maintenance will take place on {{date}}...',
    recipientType: 'All Camp Residents',
    body: 'Attention Residents,\n\nPlease be advised that scheduled maintenance will take place across the camp facilities on {{maintenance_date}} from {{start_time}} to {{end_time}}.\n\nServices affected:\n- {{affected_facilities}}\n\nWe apologize for any temporary inconvenience and thank you for your cooperation.',
  },
];

export const FutureFacilityManager: React.FC<FutureFacilityManagerProps> = ({
  facility,
  onReturnToDashboard,
}) => {
  if (facility.id === 'sla-management') {
    return <SLAManager onBack={onReturnToDashboard} />;
  }
  if (facility.id === 'automated-workflow') {
    return <AutomatedWorkflowManager onBack={onReturnToDashboard} />;
  }
  if (facility.id === 'email-management') {
    return <EmailManager onBack={onReturnToDashboard} />;
  }

  // Dynamic state for Ticket Management
  const [tickets, setTickets] = useState<TicketRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`tafga_tickets_${facility.id}`);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicketFilter, setSelectedTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketLocation, setNewTicketLocation] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('HVAC & Cooling');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketRecord['priority']>('P2 - High');
  const [newTicketDesc, setNewTicketDesc] = useState('');

  // Dynamic state for Automated Workflow
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(() => {
    try {
      const saved = localStorage.getItem('tafga_workflow_rules');
      return saved ? JSON.parse(saved) : INITIAL_WORKFLOWS;
    } catch {
      return INITIAL_WORKFLOWS;
    }
  });

  // Dynamic state for Email Management
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  // Save tickets
  useEffect(() => {
    try {
      localStorage.setItem(`tafga_tickets_${facility.id}`, JSON.stringify(tickets));
    } catch {}
  }, [tickets, facility.id]);

  // Save workflows
  useEffect(() => {
    try {
      localStorage.setItem('tafga_workflow_rules', JSON.stringify(workflows));
    } catch {}
  }, [workflows]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;

    const newTicket: TicketRecord = {
      id: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newTicketTitle,
      category: newTicketCategory,
      location: newTicketLocation || 'General Facility Area',
      priority: newTicketPriority,
      status: 'OPEN',
      reporter: 'Duty Staff / Administrator',
      assignee: 'Unassigned (Auto-Routing)',
      createdAt: 'Just now',
      description: newTicketDesc || 'No additional details specified.',
    };

    setTickets([newTicket, ...tickets]);
    setNewTicketTitle('');
    setNewTicketLocation('');
    setNewTicketDesc('');
    setIsNewTicketModalOpen(false);
  };

  const handleUpdateTicketStatus = (id: string, newStatus: TicketRecord['status']) => {
    setTickets(tickets.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id
          ? {
              ...w,
              isActive: !w.isActive,
              lastExecuted: !w.isActive ? 'Just now (Enabled)' : w.lastExecuted,
            }
          : w
      )
    );
  };

  const handleTriggerTestEmail = () => {
    setEmailSentNotice(true);
    setTimeout(() => {
      setEmailSentNotice(false);
    }, 4000);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = selectedTicketFilter === 'ALL' || t.status === selectedTicketFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.location.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* ========================================================
          SPECIFIC FACILITY CONTROLS (TKT / SLA / AW / EM)
          ======================================================== */}

      {/* A. TICKET MANAGEMENT CONTROLS */}
      {facility.id === 'ticket-management' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Tickets
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {tickets.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Logged in queue</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Open Issues
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                {tickets.filter((t) => t.status === 'OPEN').length}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Awaiting action</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                In Progress
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Technicians on-site</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Resolved Today
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {tickets.filter((t) => t.status === 'RESOLVED').length}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Completed closed</span>
            </div>
          </div>

          {/* Header Action Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tickets, rooms, ID..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedTicketFilter(status)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedTicketFilter === status
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status === 'IN_PROGRESS' ? 'In Progress' : status === 'OPEN' ? 'Open' : 'Resolved'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Ticket</span>
            </button>
          </div>

          {/* Tickets List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredTickets.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">
                <Ticket className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-bold text-sm">No tickets found</p>
                <p className="text-xs mt-0.5">Try changing your search query or status filter.</p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {t.id}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          t.priority.startsWith('P1')
                            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                            : t.priority.startsWith('P2')
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {t.status === 'RESOLVED' ? 'Resolved' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Open'}
                      </span>
                      <span className="text-xs text-slate-400">{t.createdAt}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assignee: <strong className="text-slate-800 dark:text-slate-200">{t.assignee}</strong></span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {t.status !== 'IN_PROGRESS' && t.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateTicketStatus(t.id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 cursor-pointer transition"
                        >
                          Start Progress
                        </button>
                      )}
                      {t.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateTicketStatus(t.id, 'RESOLVED')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* B. SLA MANAGEMENT CONTROLS */}
      {facility.id === 'sla-management' && (
        <div className="space-y-4">
          {/* SLA Performance Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Overall Compliance
              </span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                98.6%
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Exceeds Target (95%)</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Avg Response Time
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                14.2 Mins
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Benchmark: &lt; 30 Mins
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Active Timers Running
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
                3 Incidents
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                All currently within SLA
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Escalations This Month
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                0 Critical
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1">
                Zero SLA breaches
              </span>
            </div>
          </div>

          {/* Active Incidents Live SLA Countdown Timers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Active Incident SLA Countdowns (Live Tracking)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">3 active work orders within threshold</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    P1 Critical
                  </span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline" />
                    <span>1h 15m remaining</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">AC cooling compressor trip</h4>
                  <p className="text-[11px] text-slate-500">Block C - Bedroom 204 • Target: 2h 00m</p>
                </div>
                <div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '38%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                    <span>Elapsed: 45 mins</span>
                    <span className="text-emerald-600 font-bold">On Track (38%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    P2 High
                  </span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline" />
                    <span>4h 40m remaining</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Central laundry drainage valve</h4>
                  <p className="text-[11px] text-slate-500">Laundry Facility • Target: 6h 00m</p>
                </div>
                <div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '22%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                    <span>Elapsed: 1h 20m</span>
                    <span className="text-emerald-600 font-bold">On Track (22%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    P3 Medium
                  </span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 inline" />
                    <span>20h 50m remaining</span>
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cinema AV projector flicker</h4>
                  <p className="text-[11px] text-slate-500">Cinema Hall • Target: 24h 00m</p>
                </div>
                <div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '13%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                    <span>Elapsed: 3h 10m</span>
                    <span className="text-blue-600 font-bold">On Track (13%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SLA Target Matrix Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Tamimi Official SLA Targets Matrix
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Standard Camp Protocol</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Priority Level</th>
                    <th className="py-2.5 px-3">Target Response</th>
                    <th className="py-2.5 px-3">Resolution SLA</th>
                    <th className="py-2.5 px-3">Escalation Recipient</th>
                    <th className="py-2.5 px-3 text-right">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {SLA_TIERS.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${tier.badgeColor}`}>
                          {tier.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {tier.responseTarget}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {tier.resolutionTarget}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {tier.escalationTier}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {tier.complianceRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* C. AUTOMATED WORKFLOW CONTROLS */}
      {facility.id === 'automated-workflow' && (
        <div className="space-y-4">
          {/* Workflow KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Active Pipelines
              </span>
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5 block">
                {workflows.filter((w) => w.isActive).length} of {workflows.length}
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">Rules operational</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Executions
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                724 Runs
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Logged this month</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Avg Response Latency
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                &lt; 180 ms
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Instant event hook</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Execution Reliability
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                100%
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">0 failed triggers</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Configured Automation Pipelines</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rules triggered automatically when facility events and bookings occur.
              </p>
            </div>

            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 px-3 py-1 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 rounded-xl">
              {workflows.filter((w) => w.isActive).length} / {workflows.length} Rules Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      {wf.id}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {wf.name}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-400">
                      Runs: <strong className="text-slate-800 dark:text-slate-200">{wf.executionsCount}</strong>
                    </span>

                    {/* Active / Paused Toggle Button */}
                    <button
                      onClick={() => toggleWorkflow(wf.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        wf.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {wf.isActive ? (
                        <>
                          <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" />
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

                {/* Pipeline Flow Diagram Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      1. Trigger
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {wf.trigger}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      2. Filter Condition
                    </span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 font-mono">
                      {wf.condition}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      3. Dispatched Action
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {wf.action}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  Last executed: {wf.lastExecuted}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. EMAIL MANAGEMENT CONTROLS */}
      {facility.id === 'email-management' && (
        <div className="space-y-4">
          {/* Email KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Email Templates
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {EMAIL_TEMPLATES.length} Configured
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Active formats</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Delivery Gateway
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                Online
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">SMTP connected</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Sent Today
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                148 Emails
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Auto-dispatched</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Delivery Success
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                99.8%
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">0 bounce issues</span>
            </div>
          </div>

          {emailSentNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Test Email Broadcast triggered successfully to registered gateway outbox.</span>
              </div>
              <button
                onClick={() => setEmailSentNotice(false)}
                className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Mail className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Enterprise Email Templates & Gateway</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated resident notices, booking vouchers, and clearance notification templates.
              </p>
            </div>

            <button
              onClick={handleTriggerTestEmail}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Broadcast</span>
            </button>
          </div>

          {/* Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EMAIL_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 rounded-2xl p-4 shadow-xs transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {tmpl.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {tmpl.id}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {tmpl.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Subject: <strong className="text-slate-700 dark:text-slate-300">{tmpl.subject}</strong>
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{tmpl.previewSnippet}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Target: {tmpl.recipientType}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEmailTemplate(tmpl);
                      setIsEmailPreviewOpen(true);
                    }}
                    className="flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE NEW TICKET
          ======================================================== */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Ticket className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Create Support Ticket
                </h3>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Ticket Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water leak in washroom, Chiller issue..."
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="HVAC & Cooling">HVAC & Cooling</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="IT & Telecom">IT & Telecom</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="P1 - Critical">P1 - Critical</option>
                    <option value="P2 - High">P2 - High</option>
                    <option value="P3 - Medium">P3 - Medium</option>
                    <option value="P4 - Normal">P4 - Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block B, Room 108 or Gym"
                  value={newTicketLocation}
                  onChange={(e) => setNewTicketLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide any relevant details for the assigned technician..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EMAIL TEMPLATE PREVIEW
          ======================================================== */}
      {isEmailPreviewOpen && selectedEmailTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedEmailTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 font-medium">
                <div>
                  <span className="text-slate-400">From:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    Tamimi Global Automated Gateway &lt;notifications@tamimi-global.com&gt;
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Subject:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{selectedEmailTemplate.subject}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Recipient Scope:</span>{' '}
                  <strong className="text-rose-600 dark:text-rose-400">{selectedEmailTemplate.recipientType}</strong>
                </div>
              </div>

              {/* Formatted Email Content Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200 shadow-inner">
                {selectedEmailTemplate.body}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setIsEmailPreviewOpen(false);
                  handleTriggerTestEmail();
                }}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

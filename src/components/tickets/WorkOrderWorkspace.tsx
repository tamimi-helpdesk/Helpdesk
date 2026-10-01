import React, { useState, useMemo } from 'react';
import {
  WorkOrderTicket,
  TicketStatus,
  TicketPriority,
  AssignedTechnician,
  MaterialPartUsed,
  VillageStage,
} from '../../types/ticket';
import {
  TECHNICIAN_ROSTER,
  STANDARD_SPARE_PARTS,
  TRADE_CATEGORIES,
} from '../../data/villageStructure';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Printer,
  Edit3,
  Trash2,
  Phone,
  MessageSquare,
  Plus,
  Package,
  Star,
  User,
  Building2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Wrench,
  DollarSign,
  Calendar,
  Check,
} from 'lucide-react';

interface WorkOrderWorkspaceProps {
  tickets: WorkOrderTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: WorkOrderTicket) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, note?: string) => void;
  onAssignTechnician: (ticketId: string, tech: AssignedTechnician, note?: string) => void;
  onAddMaterial: (ticketId: string, material: MaterialPartUsed) => void;
  onSubmitRating: (ticketId: string, rating: number, feedback?: string) => void;
  onEditTicket: (ticket: WorkOrderTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onOpenPrint: (ticket: WorkOrderTicket) => void;
  onOpenCreate: () => void;
}

export const WorkOrderWorkspace: React.FC<WorkOrderWorkspaceProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onUpdateStatus,
  onAssignTechnician,
  onAddMaterial,
  onSubmitRating,
  onEditTicket,
  onDeleteTicket,
  onOpenPrint,
  onOpenCreate,
}) => {
  // Local Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tradeFilter, setTradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Detail View Sub-Tab State
  const [detailTab, setDetailTab] = useState<'overview' | 'dispatch' | 'materials' | 'sla' | 'audit'>('overview');

  // Form states for inline operations
  const [selectedTechId, setSelectedTechId] = useState('');
  const [techEta, setTechEta] = useState(30);

  const [partCode, setPartCode] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [customPartName, setCustomPartName] = useState('');
  const [customPartPrice, setCustomPartPrice] = useState(0);

  const [ratingScore, setRatingScore] = useState(5);
  const [ratingNote, setRatingNote] = useState('');

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          t.ticketNumber.toLowerCase().includes(q) ||
          (t.orderNumberDecimal && t.orderNumberDecimal.toLowerCase().includes(q)) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.locationCode.toLowerCase().includes(q) ||
          t.reporterName.toLowerCase().includes(q) ||
          (t.assignedTechnician && t.assignedTechnician.name.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Trade
      if (tradeFilter !== 'ALL') {
        if (t.category.toLowerCase() !== tradeFilter.toLowerCase() && !t.orderGroup?.toLowerCase().includes(tradeFilter.toLowerCase())) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OPEN') {
          if (t.status === 'COMPLETED' || t.status === 'CLOSED') return false;
        } else if (statusFilter === 'RESOLVED') {
          if (t.status !== 'COMPLETED' && t.status !== 'CLOSED') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Priority
      if (priorityFilter !== 'ALL') {
        if (!t.priority.includes(priorityFilter)) return false;
      }

      // Stage
      if (stageFilter !== 'ALL') {
        if (t.stage !== stageFilter) return false;
      }

      return true;
    });
  }, [tickets, searchTerm, tradeFilter, statusFilter, priorityFilter, stageFilter]);

  // Determine current active ticket
  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      const found = tickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return filteredTickets[0] || null;
  }, [tickets, selectedTicketId, filteredTickets]);

  // Status progression flow
  const statusSequence: TicketStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS', 'COMPLETED', 'CLOSED'];

  const getNextLogicalStatus = (current: TicketStatus): TicketStatus => {
    switch (current) {
      case 'NEW':
        return 'ASSIGNED';
      case 'ASSIGNED':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'COMPLETED';
      case 'PENDING_PARTS':
        return 'IN_PROGRESS';
      case 'COMPLETED':
        return 'CLOSED';
      case 'CLOSED':
        return 'IN_PROGRESS';
      default:
        return 'IN_PROGRESS';
    }
  };

  // WhatsApp Dispatch Generator
  const generateWhatsAppUrl = (ticket: WorkOrderTicket) => {
    const tech = ticket.assignedTechnician;
    const phone = tech ? tech.phone.replace(/[^0-9]/g, '') : '966501234567';
    const text = encodeURIComponent(
      `*TAMIMI / RSG WORK ORDER DISPATCH*\n` +
      `--------------------------------\n` +
      `*Order #:* ${ticket.ticketNumber} (Ref: ${ticket.orderNumberDecimal || 'N/A'})\n` +
      `*Priority:* ${ticket.priority}\n` +
      `*Discipline:* ${ticket.category} - ${ticket.subCategory}\n` +
      `*Location:* ${ticket.propertyName || ticket.stage} · ${ticket.spaceName || ticket.locationCode}\n` +
      `*Issue:* ${ticket.title}\n` +
      `*Description:* ${ticket.description}\n` +
      `*Reported by:* ${ticket.reporterName} (${ticket.reporterPhone || 'Helpdesk'})\n` +
      `*Technician:* ${tech ? tech.name : 'Unassigned'}\n` +
      `--------------------------------\n` +
      `Please report to site immediately. Reply ACK to confirm reception.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  // Assign Tech
  const handleAssignTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !selectedTechId) return;
    const foundTech = TECHNICIAN_ROSTER.find((t) => t.id === selectedTechId);
    if (foundTech) {
      onAssignTechnician(
        activeTicket.id,
        {
          id: foundTech.id,
          name: foundTech.name,
          trade: foundTech.trade,
          phone: foundTech.phone,
          badge: foundTech.badge,
          etaMinutes: techEta,
          assignedAt: new Date().toISOString(),
        },
        `Dispatched to ${foundTech.name} (${foundTech.trade}) with ETA ${techEta} mins.`
      );
      setSelectedTechId('');
    }
  };

  // Add Material
  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    if (partCode) {
      const std = STANDARD_SPARE_PARTS.find((p) => p.itemCode === partCode);
      if (std) {
        onAddMaterial(activeTicket.id, {
          id: `MAT-${Date.now()}`,
          itemCode: std.itemCode,
          description: std.description,
          quantity: partQty,
          unit: std.unit,
          cost: std.cost * partQty,
          unitCost: std.cost,
          totalCost: std.cost * partQty,
          name: std.description,
          partCode: std.itemCode,
        });
        setPartCode('');
        setPartQty(1);
        return;
      }
    }

    if (customPartName.trim() && customPartPrice > 0) {
      onAddMaterial(activeTicket.id, {
        id: `MAT-${Date.now()}`,
        itemCode: `CUST-${Date.now().toString().slice(-4)}`,
        description: customPartName.trim(),
        quantity: partQty,
        unit: 'Pcs',
        cost: customPartPrice * partQty,
        unitCost: customPartPrice,
        totalCost: customPartPrice * partQty,
        name: customPartName.trim(),
        partCode: `CUST-${Date.now().toString().slice(-4)}`,
      });
      setCustomPartName('');
      setCustomPartPrice(0);
      setPartQty(1);
    }
  };

  // Submit Feedback
  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    onSubmitRating(activeTicket.id, ratingScore, ratingNote);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Master-Detail Split Workspace Container */}
      <div className="flex flex-col lg:flex-row h-[740px] max-h-[82vh]">
        {/* =========================================================================
            LEFT COLUMN: WORK ORDER QUEUE & QUICK CATEGORY SELECTOR (MASTER PANE)
            ========================================================================= */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-900/60">
          {/* Top Search & Filter Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket #, space, resident, trade..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Compact Filter Selectors */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                aria-label="Filter by trade"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Trades</option>
                <option value="CIVIL">Civil</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Electrical">Electrical</option>
                <option value="Equipment">Equipment</option>
                <option value="Fighting">Fire Fighting</option>
                <option value="General">General FM</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="HSE">HSE Safety</option>
                <option value="HVAC">HVAC</option>
                <option value="IT">IT</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Waste Management">Waste Mgmt</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                aria-label="Filter by stage"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Stages</option>
                <option value="Stage 1">TBCV-1 (VIP/Work)</option>
                <option value="Stage 2">TBCV-2 (VIP/Work)</option>
                <option value="Stage 3">TBCV-3 (Work/Bld)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">All Active</option>
                <option value="NEW">New</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_PARTS">Pending Parts</option>
                <option value="RESOLVED">Completed/Closed</option>
              </select>
            </div>

            {/* Quick Priority Strip */}
            <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
              {(['ALL', 'P1', 'P2', 'P3', 'P4'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all shrink-0 ${
                    priorityFilter === p
                      ? p === 'P1'
                        ? 'bg-rose-600 text-white'
                        : p === 'P2'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {p === 'ALL' ? 'All Priorities' : p === 'P1' ? 'P1 Critical' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Header with Active Count */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span>Work Orders ({filteredTickets.length})</span>
            <button
              onClick={onOpenCreate}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
            >
              <Plus className="h-3 w-3" />
              <span>Log New</span>
            </button>
          </div>

          {/* Scrollable Work Order Queue */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No work orders matching filter.
              </div>
            ) : (
              filteredTickets.map((ticket, tIdx) => {
                const isSelected = activeTicket?.id === ticket.id;
                const isP1 = ticket.priority.includes('P1');
                const isResolved = ticket.status === 'COMPLETED' || ticket.status === 'CLOSED';

                return (
                  <div
                    key={`wow-tkt-${ticket.id || ticket.ticketNumber || 'wo'}-${tIdx}`}
                    onClick={() => onSelectTicket(ticket)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-2xs'
                        : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                    } ${isP1 && !isResolved ? 'bg-rose-50/25 dark:bg-rose-950/15' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                          {ticket.ticketNumber}
                        </span>
                        {ticket.orderNumberDecimal && (
                          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                            {ticket.orderNumberDecimal}
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          ticket.status === 'COMPLETED' || ticket.status === 'CLOSED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : ticket.status === 'PENDING_PARTS'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Title & Trade */}
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                      {ticket.title}
                    </div>

                    {/* Meta location & SLA */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate max-w-[190px] font-medium">
                        {ticket.propertyName?.split(',')[0] || ticket.stage} · {ticket.spaceName || ticket.locationCode}
                      </span>

                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isP1
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                            : ticket.priority.includes('P2')
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {ticket.priority.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: ACTIVE WORK ORDER OPERATIONAL TERMINAL (DETAIL PANE)
            Nested detailed view - Everything integrated right here with zero clutter!
            ========================================================================= */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
          {activeTicket ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 1. Ticket Action & Executive Header Ribbon */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                        {activeTicket.ticketNumber}
                      </span>
                      {activeTicket.orderNumberDecimal && (
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          Ref: {activeTicket.orderNumberDecimal}
                        </span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {activeTicket.orderGroup || activeTicket.category}
                      </span>
                      {activeTicket.timeToCompleteScore !== undefined && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            activeTicket.timeToCompleteScore === 1
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          SLA {activeTicket.timeToCompleteScore === 1 ? '+1 (Met)' : '-1 (Breached)'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {activeTicket.title}
                    </h2>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Advance Status Button */}
                    <button
                      onClick={() => onUpdateStatus(activeTicket.id, getNextLogicalStatus(activeTicket.status), `Quick advanced status from Helpdesk`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span>
                        Advance: {getNextLogicalStatus(activeTicket.status).replace('_', ' ')}
                      </span>
                    </button>

                    {/* WhatsApp Dispatch Button */}
                    <a
                      href={generateWhatsAppUrl(activeTicket)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>WhatsApp Dispatch</span>
                    </a>

                    {/* Print Work Order Slip */}
                    <button
                      onClick={() => onOpenPrint(activeTicket)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Print Work Order Dispatch Slip"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditTicket(activeTicket)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Edit Ticket Details"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete Work Order ${activeTicket.ticketNumber}?`)) {
                          onDeleteTicket(activeTicket.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Interactive Status Stepper */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1 overflow-x-auto">
                    {statusSequence.map((st, idx) => {
                      const isCurrent = activeTicket.status === st;
                      const currentIndex = statusSequence.indexOf(activeTicket.status);
                      const isPast = idx < currentIndex;

                      return (
                        <button
                          key={st}
                          onClick={() => onUpdateStatus(activeTicket.id, st, `Status set to ${st} via lifecycle stepper`)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs'
                              : isPast
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {isPast ? (
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-[10px] opacity-70">0{idx + 1}</span>
                          )}
                          <span>{st.replace('_', ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Operational Sub-Tabs Navigation */}
              <div className="flex items-center gap-2 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview & Location' },
                  { id: 'dispatch', label: 'Technician & WhatsApp' },
                  { id: 'materials', label: 'Parts & Cost Calculator' },
                  { id: 'sla', label: 'SLA & Resident Feedback' },
                  { id: 'audit', label: 'Activity Audit Log' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      detailTab === t.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 4. Sub-Tab Content Workspace */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* SUB-TAB 1: OVERVIEW & SPECIFICATIONS */}
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Facility Specs Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Property</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {activeTicket.propertyName || `${activeTicket.stage}, AMAALA`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Space / Room</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {activeTicket.spaceName || activeTicket.locationCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Asset ID</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {activeTicket.assetId || 'General Facility Asset'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Priority & Target</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {activeTicket.planonPriority || activeTicket.priority}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Issue Description */}
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Work Order Scope & Description
                      </span>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {activeTicket.description}
                      </div>
                    </div>

                    {/* Resident Remarks */}
                    {activeTicket.comment && activeTicket.comment !== activeTicket.description && (
                      <div>
                        <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">
                          Resident / Site Comment
                        </span>
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-slate-800 dark:text-slate-200">
                          {activeTicket.comment}
                        </div>
                      </div>
                    )}

                    {/* Reporter & Customer Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Requestor / Reporter</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{activeTicket.reporterName}</p>
                        <p className="text-slate-500">Badge: {activeTicket.reporterBadge || 'N/A'}</p>
                        <p className="text-slate-500">Dept: {activeTicket.reporterDepartment || 'Helpdesk'}</p>
                        <p className="text-slate-500">Phone: {activeTicket.reporterPhone || 'N/A'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Customer Organization</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{activeTicket.customer || 'Red Sea Global (RSG)'}</p>
                        <p className="text-slate-500">Operator: TAMIMI Global Co. Ltd.</p>
                        <p className="text-slate-500">Created At: {new Date(activeTicket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: TECHNICIAN & DISPATCH */}
                {detailTab === 'dispatch' && (
                  <div className="space-y-4">
                    {/* Current Assigned Tech Card */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Current Assigned Specialist</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {activeTicket.assignedTechnician ? activeTicket.assignedTechnician.name : 'No Technician Assigned'}
                        </h4>
                        {activeTicket.assignedTechnician && (
                          <div className="flex items-center gap-2 mt-1 text-slate-500">
                            <span>Trade: {activeTicket.assignedTechnician.trade}</span>
                            <span>·</span>
                            <span>Phone: {activeTicket.assignedTechnician.phone}</span>
                            <span>·</span>
                            <span>ETA: {activeTicket.assignedTechnician.etaMinutes || 30} mins</span>
                          </div>
                        )}
                      </div>

                      <a
                        href={generateWhatsAppUrl(activeTicket)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 text-xs shadow-xs"
                      >
                        <Send className="h-4 w-4" />
                        <span>Open WhatsApp Message</span>
                      </a>
                    </div>

                    {/* Reassign / Assign Technician Form */}
                    <form onSubmit={handleAssignTechSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Assign / Reassign On-Duty Technician
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Select Specialist from Village Roster
                          </label>
                          <select
                            value={selectedTechId}
                            onChange={(e) => setSelectedTechId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-medium"
                          >
                            <option value="">-- Choose Technician --</option>
                            {TECHNICIAN_ROSTER.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name} ({tech.trade}) - {tech.phone} [{tech.status}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Estimated Response Time (ETA Minutes)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="240"
                            value={techEta}
                            onChange={(e) => setTechEta(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedTechId}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs"
                      >
                        Assign Technician to Work Order
                      </button>
                    </form>
                  </div>
                )}

                {/* SUB-TAB 3: PARTS & MATERIALS CALCULATOR */}
                {detailTab === 'materials' && (
                  <div className="space-y-4">
                    {/* Parts Table */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                          <tr>
                            <th className="p-2.5">Part Name</th>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Qty</th>
                            <th className="p-2.5">Unit Price</th>
                            <th className="p-2.5 text-right">Total (SAR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {(!activeTicket.materialsUsed || activeTicket.materialsUsed.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-400">
                                No spare parts logged for this work order yet.
                              </td>
                            </tr>
                          ) : (
                            activeTicket.materialsUsed.map((m, mIdx) => {
                              const uCost = m.unitCost ?? (m.cost && m.quantity ? m.cost / m.quantity : 0);
                              const tCost = m.totalCost ?? (m.cost ?? 0);
                              return (
                                <tr key={`wow-mat-${m.id || m.itemCode || 'mat'}-${mIdx}`}>
                                  <td className="p-2.5 font-bold">{m.description || m.name}</td>
                                  <td className="p-2.5 font-mono text-slate-500">{m.itemCode || m.partCode}</td>
                                  <td className="p-2.5">{m.quantity} {m.unit}</td>
                                  <td className="p-2.5">SAR {uCost.toFixed(2)}</td>
                                  <td className="p-2.5 font-mono font-bold text-right">
                                    SAR {tCost.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Cost Summary */}
                    <div className="flex justify-end">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-3">
                        <span className="text-slate-500">Total Materials Cost:</span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                          SAR {(activeTicket.materialsUsed || []).reduce((acc, m) => acc + (m.totalCost ?? m.cost ?? 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Add Spare Part Form */}
                    <form onSubmit={handleAddMaterialSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Add Replacement Part from Camp Store
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Standard Inventory Part
                          </label>
                          <select
                            value={partCode}
                            onChange={(e) => setPartCode(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs"
                          >
                            <option value="">-- Choose Standard Inventory Part --</option>
                            {STANDARD_SPARE_PARTS.map((p) => (
                              <option key={p.itemCode} value={p.itemCode}>
                                {p.description} [{p.itemCode}] - SAR {p.cost}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={partQty}
                            onChange={(e) => setPartQty(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!partCode && !customPartName}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs"
                      >
                        Add Part to Work Order Cost
                      </button>
                    </form>
                  </div>
                )}

                {/* SUB-TAB 4: SLA & RESIDENT FEEDBACK */}
                {detailTab === 'sla' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Target Resolution SLA</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(activeTicket.targetResolutionTime).toLocaleString()}
                        </p>
                        <span className="text-slate-500">Standard for {activeTicket.priority}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">SLA Performance Score</span>
                        <p className={`font-black text-sm ${activeTicket.timeToCompleteScore === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {activeTicket.timeToCompleteScore === 1 ? '+1 (On Time / Met SLA)' : '-1 (Breached SLA)'}
                        </p>
                        <span className="text-slate-500">Technically completed on: {activeTicket.technicallyCompletedOn || 'Pending completion'}</span>
                      </div>
                    </div>

                    {/* Resident Satisfaction Rating */}
                    <form onSubmit={handleRatingSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Resident Feedback & Quality Score
                      </span>

                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRatingScore(star)}
                            className={`p-1 text-base ${star <= ratingScore ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">
                          {ratingScore} of 5 Stars
                        </span>
                      </div>

                      <textarea
                        value={ratingNote}
                        onChange={(e) => setRatingNote(e.target.value)}
                        placeholder="Enter resident feedback notes, cleanliness after job, speed of technician..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs h-20"
                      />

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        Save Resident Rating
                      </button>
                    </form>
                  </div>
                )}

                {/* SUB-TAB 5: ACTIVITY AUDIT LOG */}
                {detailTab === 'audit' && (
                  <div className="space-y-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Work Order Timeline & System Logs
                    </span>

                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
                      {(activeTicket.logs || []).map((log, lIdx) => (
                        <div key={`wow-log-${log.id || 'log'}-${lIdx}`} className="relative">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{log.action}</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{log.note}</p>
                          <span className="text-[10px] text-slate-400">By: {log.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Package className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Work Order Selected</h3>
              <p className="text-xs max-w-xs mt-1">
                Select a ticket from the left queue to open its full operational file, dispatch technicians, or advance status.
              </p>
              <button
                onClick={onOpenCreate}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Log New Work Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

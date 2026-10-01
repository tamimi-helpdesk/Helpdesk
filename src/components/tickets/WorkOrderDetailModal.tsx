import React, { useState } from 'react';
import {
  WorkOrderTicket,
  TicketStatus,
  AssignedTechnician,
  MaterialPartUsed,
} from '../../types/ticket';
import {
  TRADE_CATEGORIES,
  TECHNICIAN_ROSTER,
  STANDARD_SPARE_PARTS,
} from '../../data/villageStructure';
import {
  X,
  Printer,
  Edit3,
  Trash2,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  User,
  Shield,
  MapPin,
  Package,
  Plus,
  Star,
  Send,
  Calendar,
  Share2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface WorkOrderDetailModalProps {
  ticket: WorkOrderTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, note?: string) => void;
  onAssignTechnician: (ticketId: string, tech: AssignedTechnician, note?: string) => void;
  onAddMaterial: (ticketId: string, material: MaterialPartUsed) => void;
  onSubmitRating: (ticketId: string, rating: number, feedback?: string) => void;
  onEditTicket: (ticket: WorkOrderTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onOpenPrint: (ticket: WorkOrderTicket) => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdateStatus,
  onAssignTechnician,
  onAddMaterial,
  onSubmitRating,
  onEditTicket,
  onDeleteTicket,
  onOpenPrint,
}) => {
  if (!isOpen || !ticket) return null;

  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [techEta, setTechEta] = useState<number>(30);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const [newPartCode, setNewPartCode] = useState<string>('');
  const [partQty, setPartQty] = useState<number>(1);
  const [isAddingPart, setIsAddingPart] = useState<boolean>(false);

  const [rating, setRating] = useState<number>(ticket.satisfactionRating || 5);
  const [feedback, setFeedback] = useState<string>(ticket.feedbackNotes || '');
  const [isRatingSubmitted, setIsRatingSubmitted] = useState<boolean>(!!ticket.satisfactionRating);

  const [statusNote, setStatusNote] = useState<string>('');

  const tradeConfig = TRADE_CATEGORIES[ticket.category] || TRADE_CATEGORIES.HVAC;

  // Next status options based on current status
  const getNextStatuses = (status: TicketStatus): TicketStatus[] => {
    switch (status) {
      case 'NEW':
        return ['ASSIGNED', 'IN_PROGRESS'];
      case 'ASSIGNED':
        return ['IN_PROGRESS', 'PENDING_PARTS'];
      case 'IN_PROGRESS':
        return ['PENDING_PARTS', 'COMPLETED'];
      case 'PENDING_PARTS':
        return ['IN_PROGRESS', 'COMPLETED'];
      case 'COMPLETED':
        return ['CLOSED', 'IN_PROGRESS'];
      case 'CLOSED':
        return ['IN_PROGRESS'];
      default:
        return [];
    }
  };

  const handleQuickStatusChange = (newStatus: TicketStatus) => {
    onUpdateStatus(ticket.id, newStatus, statusNote || undefined);
    setStatusNote('');
  };

  const handleConfirmAssign = () => {
    if (!selectedTechId) return;
    const tech = TECHNICIAN_ROSTER.find((t) => t.id === selectedTechId);
    if (!tech) return;

    onAssignTechnician(ticket.id, {
      id: tech.id,
      name: tech.name,
      trade: tech.trade,
      phone: tech.phone,
      assignedAt: new Date().toISOString(),
      etaMinutes: techEta,
    });
    setIsAssigning(false);
  };

  const handleConfirmAddPart = () => {
    if (!newPartCode) return;
    const part = STANDARD_SPARE_PARTS.find((p) => p.itemCode === newPartCode);
    if (!part) return;

    onAddMaterial(ticket.id, {
      id: `MAT-${Date.now()}`,
      itemCode: part.itemCode,
      description: part.description,
      quantity: partQty,
      unit: part.unit,
      cost: part.cost,
    });
    setIsAddingPart(false);
    setNewPartCode('');
    setPartQty(1);
  };

  const handleSaveRating = () => {
    onSubmitRating(ticket.id, rating, feedback);
    setIsRatingSubmitted(true);
  };

  // WhatsApp dispatch message
  const handleWhatsAppDispatch = () => {
    const text = `*RED SEA GLOBAL - AMAALA VILLAGE WORK ORDER*\n` +
      `*Work Order:* ${ticket.ticketNumber}\n` +
      `*Location:* Stage ${ticket.stage.split(' ')[1]}, Cluster ${ticket.cluster} (${ticket.clusterType})\n` +
      `*Building & Unit:* ${ticket.buildingCategory} ${ticket.buildingNumber} - Floor ${ticket.floor} - Unit ${ticket.unitNumber}\n` +
      `*Location Code:* ${ticket.locationCode}\n` +
      `*Trade:* ${ticket.category} (${ticket.subCategory})\n` +
      `*Priority:* ${ticket.priority}\n` +
      `*Issue:* ${ticket.title}\n` +
      `*Details:* ${ticket.description}\n` +
      `*Reporter:* ${ticket.reporterName} (${ticket.reporterPhone})\n` +
      `*Status:* ${ticket.status}\n\n` +
      `Please report to site immediately.`;

    const encoded = encodeURIComponent(text);
    const phone = ticket.assignedTechnician?.phone.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header with Title and Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {ticket.ticketNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                    ticket.priority.includes('P1')
                      ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse'
                      : ticket.priority.includes('P2')
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {ticket.priority}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    ticket.status === 'COMPLETED' || ticket.status === 'CLOSED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : ticket.status === 'IN_PROGRESS'
                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Amaala Construction Village · Red Sea Global (RSG)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(ticket)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleWhatsAppDispatch}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => onEditTicket(ticket)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              title="Edit Ticket"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this work order ticket?')) {
                  onDeleteTicket(ticket.id);
                  onClose();
                }
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-600"
              title="Delete Ticket"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Location Banner Breadcrumb */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                <MapPin className="h-4 w-4 text-sky-600" />
                <span>{ticket.stage}</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span>
                  Cluster {ticket.cluster} ({ticket.clusterType})
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span>
                  {ticket.buildingCategory} Building {ticket.buildingNumber}
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="font-bold underline">
                  Floor {ticket.floor} - Unit {ticket.unitNumber}
                  {ticket.isToilet ? ' (Communal Toilet)' : ''}
                  {ticket.bedNumber ? ` [${ticket.bedNumber}]` : ''}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Tag: {ticket.locationCode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-md bg-white dark:bg-slate-800 px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-400 mr-1">Created:</span>
                {new Date(ticket.createdAt).toLocaleDateString()} at{' '}
                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* 2. Quick Status Advance Pipeline */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Operational Status Transition
              </span>
              <span className="text-[11px] text-slate-400">Current: {ticket.status}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS', 'COMPLETED', 'CLOSED'] as TicketStatus[]).map(
                (st) => {
                  const isCurrent = ticket.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleQuickStatusChange(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/40'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-400'
                      }`}
                    >
                      {st}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 3. Issue Title & Description + Planon Enterprise Specs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${tradeConfig.badgeBg}`}>
                {ticket.orderGroup || `${ticket.category}: ${ticket.subCategory}`}
              </span>
              {ticket.orderNumberDecimal && (
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Order Ref: {ticket.orderNumberDecimal}
                </span>
              )}
              {ticket.timeToCompleteScore !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                    ticket.timeToCompleteScore === 1
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  SLA Score: {ticket.timeToCompleteScore === 1 ? '+1 (Met)' : '-1 (Breached)'}
                </span>
              )}
              {ticket.planonPriority && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {ticket.planonPriority}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {ticket.title}
            </h3>

            {/* Planon Facility Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Property</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.propertyName || 'TBCV Village'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Space</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.spaceName || ticket.unitNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Asset ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ticket.assetId || 'N/A (General)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Technically Completed</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{ticket.technicallyCompletedOn || 'Pending'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {ticket.description}
            </div>

            {ticket.comment && ticket.comment !== ticket.description && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Resident / Site Comment:</span>
                <p className="text-slate-700 dark:text-slate-300">{ticket.comment}</p>
              </div>
            )}

            {/* Attached Files Section */}
            {ticket.attachedFiles && ticket.attachedFiles.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Attached Photos & Work Order Documents ({ticket.attachedFiles.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ticket.attachedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Package className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="font-medium truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-400">({f.size})</span>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Reporter & Technician Split Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reporter Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-sky-500" />
                  Reporter / Resident
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {ticket.company}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {ticket.reporterName}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Badge: <strong className="text-slate-700 dark:text-slate-200">{ticket.reporterBadge || 'N/A'}</strong>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Dept: {ticket.reporterDepartment}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${ticket.reporterPhone}`}
                    className="inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                  >
                    <Phone className="h-3 w-3" />
                    {ticket.reporterPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Assigned Technician Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                  Assigned Technician
                </span>
                <button
                  type="button"
                  onClick={() => setIsAssigning(!isAssigning)}
                  className="text-[11px] font-semibold text-sky-600 hover:underline"
                >
                  {ticket.assignedTechnician ? 'Re-assign' : '+ Assign'}
                </button>
              </div>

              {ticket.assignedTechnician ? (
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {ticket.assignedTechnician.name}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Trade: {ticket.assignedTechnician.trade}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${ticket.assignedTechnician.phone}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                    >
                      <Phone className="h-3 w-3" />
                      {ticket.assignedTechnician.phone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-2">
                  No technician assigned yet. Click "+ Assign" above to dispatch from the roster.
                </div>
              )}

              {/* Assign Drawer */}
              {isAssigning && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Technician...</option>
                    {TECHNICIAN_ROSTER.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.trade}) - {tech.phone}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAssigning(false)}
                      className="text-xs text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAssign}
                      className="rounded bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700"
                    >
                      Confirm Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Spare Parts & Materials Requisition */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-500" />
                Store Spare Parts & Materials Used ({ticket.materialsUsed.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingPart(!isAddingPart)}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                + Add Requisition
              </button>
            </div>

            {ticket.materialsUsed.length > 0 ? (
              <div className="space-y-1.5">
                {ticket.materialsUsed.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {m.description}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400">
                        [{m.itemCode}]
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Qty: {m.quantity} {m.unit}
                      </span>
                      {m.cost && (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {(m.cost * m.quantity).toFixed(0)} SAR
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                No spare parts logged yet for this work order.
              </div>
            )}

            {isAddingPart && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                <select
                  value={newPartCode}
                  onChange={(e) => setNewPartCode(e.target.value)}
                  className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Standard Part...</option>
                  {STANDARD_SPARE_PARTS.map((p) => (
                    <option key={p.itemCode} value={p.itemCode}>
                      {p.description} ({p.cost} SAR)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partQty}
                  onChange={(e) => setPartQty(Number(e.target.value))}
                  className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleConfirmAddPart}
                  className="rounded bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* 6. Customer / Client Satisfaction Feedback */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              RSG Client Satisfaction Rating & Sign-off
            </span>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating >= star
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Client feedback remarks..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSaveRating}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
              >
                Save Feedback
              </button>
            </div>
          </div>

          {/* 7. Audit Activity Timeline */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-500" />
              Official Audit Trail & Activity Log ({ticket.logs.length})
            </span>

            <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3 ml-2 text-xs">
              {ticket.logs.map((log) => (
                <div key={log.id} className="relative space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      by {log.author} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

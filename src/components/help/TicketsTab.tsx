import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Sliders,
  Plus,
  RotateCcw,
  Edit3,
  Trash2,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  User,
  X,
  MessageSquare,
  Wrench,
  Star,
  Zap,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportTicket } from './types';
import { StorageService } from '../../services/storageService';
import { GasService } from '../../services/gasService';
import { TicketService } from '../../services/ticketService';

interface TicketsTabProps {
  tickets: SupportTicket[];
  onSaveTickets: (updated: SupportTicket[]) => void;
  onResetTickets: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const TicketsTab: React.FC<TicketsTabProps> = ({
  tickets,
  onSaveTickets,
  onResetTickets,
  onTriggerFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState<SupportTicket['category']>('MAINTENANCE_DEFECT');
  const [formPriority, setFormPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<SupportTicket['status']>('OPEN');
  const [formOfficer, setFormOfficer] = useState('Camp Duty Desk');
  const [formResolutionNotes, setFormResolutionNotes] = useState('');
  const [formTechName, setFormTechName] = useState('');
  const [formTechPhone, setFormTechPhone] = useState('');
  const [formEtaMinutes, setFormEtaMinutes] = useState<number | ''>('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formFeedbackComment, setFormFeedbackComment] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.badgeId.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        (t.roomNumber && t.roomNumber.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const handleOpenAdd = () => {
    setEditingTicketId(null);
    setFormName('');
    setFormBadge('');
    setFormRoom('');
    setFormPhone('055 ');
    setFormCategory('MAINTENANCE_DEFECT');
    setFormPriority('MEDIUM');
    setFormSubject('');
    setFormDescription('');
    setFormStatus('OPEN');
    setFormOfficer('Camp Duty Desk');
    setFormResolutionNotes('');
    setFormTechName('');
    setFormTechPhone('');
    setFormEtaMinutes('');
    setFormRating(5);
    setFormFeedbackComment('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: SupportTicket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTicketId(t.id);
    setFormName(t.name);
    setFormBadge(t.badgeId);
    setFormRoom(t.roomNumber || '');
    setFormPhone(t.phone);
    setFormCategory(t.category);
    setFormPriority(t.priority);
    setFormSubject(t.subject);
    setFormDescription(t.description);
    setFormStatus(t.status);
    setFormOfficer(t.assignedOfficer || 'Camp Duty Desk');
    setFormResolutionNotes(t.resolutionNotes || '');
    setFormTechName(t.technicianName || '');
    setFormTechPhone(t.technicianPhone || '');
    setFormEtaMinutes(t.dispatchEtaMinutes !== undefined ? t.dispatchEtaMinutes : '');
    setFormRating(t.satisfactionRating || 5);
    setFormFeedbackComment(t.feedbackComment || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSubject.trim()) return;

    if (editingTicketId) {
      let savedTicket: SupportTicket | null = null;
      const updated = tickets.map((t) => {
        if (t.id === editingTicketId) {
          savedTicket = {
            ...t,
            name: formName.trim(),
            badgeId: formBadge.trim(),
            roomNumber: formRoom.trim(),
            phone: formPhone.trim(),
            category: formCategory,
            priority: formPriority,
            subject: formSubject.trim(),
            description: formDescription.trim(),
            status: formStatus,
            assignedOfficer: formOfficer.trim(),
            resolutionNotes: formResolutionNotes.trim(),
            technicianName: formTechName.trim() || undefined,
            technicianPhone: formTechPhone.trim() || undefined,
            dispatchEtaMinutes: formEtaMinutes !== '' ? Number(formEtaMinutes) : undefined,
            satisfactionRating: formStatus === 'RESOLVED' || formStatus === 'CLOSED' ? formRating : undefined,
            feedbackComment: formFeedbackComment.trim() || undefined,
          };
          return savedTicket;
        }
        return t;
      });
      onSaveTickets(updated);
      window.dispatchEvent(new CustomEvent('tickets_updated'));
      if (savedTicket) {
        GasService.pushSupportTicketToRemote(savedTicket).catch((err) =>
          console.warn('Background support ticket push error:', err)
        );
      }
      onTriggerFeedback('success', `Ticket "${formSubject}" updated with dispatch info.`);
    } else {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const newTicket: SupportTicket = {
        id: `tkt-${Date.now()}`,
        ticketNumber: `TK-${randNum}`,
        name: formName.trim(),
        badgeId: formBadge.trim() || 'RSG-GUEST',
        roomNumber: formRoom.trim() || 'Unassigned',
        phone: formPhone.trim() || '055 000 0000',
        category: formCategory,
        priority: formPriority,
        subject: formSubject.trim(),
        description: formDescription.trim(),
        status: formStatus,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        assignedOfficer: formOfficer.trim() || 'Camp Duty Desk',
        resolutionNotes: formResolutionNotes.trim(),
        technicianName: formTechName.trim() || undefined,
        technicianPhone: formTechPhone.trim() || undefined,
        dispatchEtaMinutes: formEtaMinutes !== '' ? Number(formEtaMinutes) : undefined,
        satisfactionRating: formStatus === 'RESOLVED' || formStatus === 'CLOSED' ? formRating : undefined,
        feedbackComment: formFeedbackComment.trim() || undefined,
      };
      onSaveTickets([newTicket, ...tickets]);
      window.dispatchEvent(new CustomEvent('tickets_updated'));

      // Bridge maintenance requests directly to FM Planon Work Orders
      if (formCategory === 'MAINTENANCE_DEFECT') {
        try {
          const priority: any =
            formPriority === 'CRITICAL'
              ? 'P1 - Critical / Emergency'
              : formPriority === 'HIGH'
              ? 'P2 - High'
              : 'P3 - Medium';

          TicketService.createTicket({
            title: formSubject.trim(),
            description: `[Resident Helpdesk ${newTicket.ticketNumber}] ${formDescription.trim()}`,
            category: 'General',
            subCategory: 'Resident Maintenance Request',
            priority,
            status: 'NEW',
            project: 'Amaala Construction Village',
            client: 'Red Sea Global',
            stage: 'Stage 1',
            cluster: 'A',
            clusterType: 'VIP',
            buildingNumber: 1,
            buildingCategory: 'Executive',
            floor: 'GF',
            unitNumber: formRoom.trim() || 'General',
            locationCode: `ACV-S1-${formRoom.trim() || 'CAMP'}`,
            reporterName: formName.trim(),
            reporterPhone: formPhone.trim(),
            reporterBadge: formBadge.trim() || 'RSG-GUEST',
            reporterDepartment: 'Camp Residents',
            company: 'TAMIMI Global',
            assignedTechnician: formTechName
              ? {
                  id: `tech-${Date.now()}`,
                  name: formTechName.trim(),
                  trade: 'General',
                  phone: formTechPhone.trim() || '',
                  assignedAt: new Date().toISOString(),
                  etaMinutes: formEtaMinutes !== '' ? Number(formEtaMinutes) : undefined,
                }
              : undefined,
          });
        } catch (bridgeErr) {
          console.warn('Could not mirror ticket to TicketService:', bridgeErr);
        }
      }

      GasService.pushSupportTicketToRemote(newTicket).catch((err) =>
        console.warn('Background support ticket push error:', err)
      );
      onTriggerFeedback('success', `Ticket ${newTicket.ticketNumber} created & logged in FM Work Orders.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!ticketToDelete) return;
    const targetNum = ticketToDelete.ticketNumber;
    
    // 1. Record ID and Ticket Number in deletion registry
    StorageService.recordDeletedId(ticketToDelete.id);
    if (ticketToDelete.ticketNumber) {
      StorageService.recordDeletedId(ticketToDelete.ticketNumber);
    }

    // 2. Remove locally
    const updated = tickets.filter((t) => t.id !== ticketToDelete.id);
    onSaveTickets(updated);
    window.dispatchEvent(new CustomEvent('tickets_updated'));

    // 3. Remote deletion
    GasService.deleteSupportTicketFromRemote(ticketToDelete.id).catch((err) =>
      console.warn('Background support ticket deletion error:', err)
    );

    setTicketToDelete(null);
    onTriggerFeedback('info', `Ticket "${targetNum}" deleted.`);
  };

  const handleQuickStatusChange = (t: SupportTicket, newStatus: SupportTicket['status'], e: React.MouseEvent) => {
    e.stopPropagation();
    let updatedItem: SupportTicket | null = null;
    const updated = tickets.map((item) => {
      if (item.id === t.id) {
        updatedItem = { ...item, status: newStatus };
        return updatedItem;
      }
      return item;
    });
    onSaveTickets(updated);
    window.dispatchEvent(new CustomEvent('tickets_updated'));
    if (updatedItem) {
      GasService.pushSupportTicketToRemote(updatedItem).catch((err) =>
        console.warn('Background ticket status update error:', err)
      );
    }
    onTriggerFeedback('info', `Ticket ${t.ticketNumber} marked as ${newStatus}.`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Tickets</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{tickets.length}</div>
          <div className="text-[10px] text-slate-400">All resident inquiries</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">Open Pending</div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {tickets.filter((t) => t.status === 'OPEN').length}
          </div>
          <div className="text-[10px] text-slate-400">Awaiting assignment</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-teal-500 font-bold uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-black text-teal-600 font-mono">
            {tickets.filter((t) => t.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-[10px] text-slate-400">Under active repair</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
          </div>
          <div className="text-[10px] text-slate-400">Completed requests</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket #, resident name, badge ID, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition"
          />
        </div>

        {/* Filters and Add */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            type="button"
            onClick={onResetTickets}
            title="Reset to Defaults"
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Open Ticket</span>
          </button>
        </div>
      </div>

      {/* Tickets List / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((tkt, tIdx) => (
          <div
            key={`help-tkt-${tkt.id || tkt.ticketNumber || 'tkt'}-${tIdx}`}
            onClick={() => setViewingTicket(tkt)}
            className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-teal-500/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all group"
          >
            <div className="space-y-2.5">
              {/* Top Meta */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {tkt.ticketNumber}
                </span>

                <div className="flex items-center space-x-1">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      tkt.status === 'OPEN'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : tkt.status === 'IN_PROGRESS'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {tkt.status}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <h4 className="font-black text-slate-900 dark:text-white text-base leading-snug group-hover:text-teal-600 transition-colors">
                {tkt.subject}
              </h4>

              {/* Description preview */}
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {tkt.description}
              </p>

              {/* Resident & Room */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{tkt.name}</span>
                  <span className="font-mono text-[11px] text-teal-600 font-bold">Room: {tkt.roomNumber || 'N/A'}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Badge: {tkt.badgeId}</span>
                  <span>{tkt.phone}</span>
                </div>
              </div>

              {/* SLA Target & Dispatch Info */}
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Timer className="w-3 h-3 text-teal-500" />
                  <span>
                    SLA:{' '}
                    {tkt.priority === 'CRITICAL'
                      ? '2h (Urgent)'
                      : tkt.priority === 'HIGH'
                      ? '6h (High)'
                      : tkt.priority === 'MEDIUM'
                      ? '24h (Standard)'
                      : '48h (Scheduled)'}
                  </span>
                </div>
                {tkt.technicianName && (
                  <div className="flex items-center space-x-1 text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                    <Wrench className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[100px]">{tkt.technicianName}</span>
                    {tkt.dispatchEtaMinutes !== undefined && <span>({tkt.dispatchEtaMinutes}m)</span>}
                  </div>
                )}
              </div>

              {/* Resident Rating Stars if Resolved */}
              {tkt.satisfactionRating && (
                <div className="flex items-center space-x-1.5 text-xs bg-amber-50/80 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/60 dark:border-amber-900/50">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (tkt.satisfactionRating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    {tkt.satisfactionRating}/5
                  </span>
                  {tkt.feedbackComment && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      "{tkt.feedbackComment}"
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Status Buttons & Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1 text-[11px]">
                {tkt.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={(e) => handleQuickStatusChange(tkt, 'RESOLVED', e)}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
                {tkt.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={(e) => handleQuickStatusChange(tkt, 'IN_PROGRESS', e)}
                    className="px-2 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Start Work
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(tkt, e)}
                  title="Edit Ticket"
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTicketToDelete(tkt);
                  }}
                  title="Delete Ticket"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT TICKET
          ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingTicketId ? 'Edit Support Ticket' : 'Open Support Ticket'}
                    </h3>
                    <p className="text-xs text-slate-500">Record maintenance and facility issues</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Resident Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Badge / Employee ID</label>
                    <input
                      type="text"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="e.g. TG-10928"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Room Number</label>
                    <input
                      type="text"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      placeholder="e.g. R-204"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. 055 123 4567"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="MAINTENANCE_DEFECT">Maintenance Defect</option>
                      <option value="FACILITY_BOOKING">Facility Booking</option>
                      <option value="BARBER_CINEMA">Barber &amp; Cinema</option>
                      <option value="BILLING_PAYMENT">Billing &amp; Payment</option>
                      <option value="SECURITY_ACCESS">Security &amp; Access</option>
                      <option value="CATERING_MESS">Catering &amp; Dining</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="CRITICAL">Critical (Immediate)</option>
                      <option value="HIGH">High (Within 4 hrs)</option>
                      <option value="MEDIUM">Medium (Same day)</option>
                      <option value="LOW">Low (Scheduled)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="OPEN">Open Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject / Title *</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. AC cooling malfunction in bedroom"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description of Issue</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detailed explanation of the issue..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
                </div>

                {/* Technician Job Dispatch Section */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Wrench className="w-3.5 h-3.5 text-teal-600" />
                    <span>Technician Job Dispatch (Optional)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500">Technician Name</label>
                      <input
                        type="text"
                        value={formTechName}
                        onChange={(e) => setFormTechName(e.target.value)}
                        placeholder="e.g. Tariq Al-Ghamdi"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500">Technician Mobile</label>
                      <input
                        type="text"
                        value={formTechPhone}
                        onChange={(e) => setFormTechPhone(e.target.value)}
                        placeholder="e.g. 055 987 6543"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500">Arrival ETA (Mins)</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={formEtaMinutes}
                        onChange={(e) => setFormEtaMinutes(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 25"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Resolution Notes / Action Taken</label>
                  <input
                    type="text"
                    value={formResolutionNotes}
                    onChange={(e) => setFormResolutionNotes(e.target.value)}
                    placeholder="e.g. Technician replaced thermostat capacitor. Fully tested."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
                </div>

                {/* Resident Rating Stars if Resolved / Closed */}
                {(formStatus === 'RESOLVED' || formStatus === 'CLOSED') && (
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Resident Satisfaction Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            className="p-0.5 hover:scale-110 transition cursor-pointer"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= formRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formFeedbackComment}
                      onChange={(e) => setFormFeedbackComment(e.target.value)}
                      placeholder="Resident comments: e.g. Quick repair, very polite technician"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs shadow-md shadow-teal-600/20 cursor-pointer"
                  >
                    {editingTicketId ? 'Save Changes' : 'Open Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE TICKET CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {ticketToDelete && (
          <div
            onClick={() => setTicketToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Ticket?</h3>
                  <p className="text-xs text-slate-500">Remove this ticket record from history.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  {ticketToDelete.ticketNumber} - {ticketToDelete.subject}
                </div>
                <div className="text-slate-500">
                  {ticketToDelete.name} (Room: {ticketToDelete.roomNumber || 'N/A'})
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: VIEW TICKET DETAILS
          ======================================================== */}
      <AnimatePresence>
        {viewingTicket && (
          <div
            onClick={() => setViewingTicket(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {viewingTicket.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      viewingTicket.status === 'OPEN'
                        ? 'bg-amber-100 text-amber-800'
                        : viewingTicket.status === 'IN_PROGRESS'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {viewingTicket.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingTicket(null)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {viewingTicket.subject}
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Created: {viewingTicket.createdAt}</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Resident Information</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="text-slate-400">Name:</span> <span className="font-bold">{viewingTicket.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Badge ID:</span> <span className="font-mono">{viewingTicket.badgeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Room:</span> <span className="font-bold text-teal-600">{viewingTicket.roomNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span> <span className="font-mono">{viewingTicket.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Issue Description</div>
                  <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {viewingTicket.description || 'No description provided.'}
                  </p>
                </div>

                {/* Technician Dispatch Info */}
                {viewingTicket.technicianName && (
                  <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Assigned Technician &amp; Job Dispatch</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                      <div>
                        <span className="text-slate-400">Technician:</span> <span className="font-bold">{viewingTicket.technicianName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Mobile:</span> <span className="font-mono">{viewingTicket.technicianPhone || 'N/A'}</span>
                      </div>
                      {viewingTicket.dispatchEtaMinutes !== undefined && (
                        <div className="col-span-2">
                          <span className="text-slate-400">Estimated Arrival:</span> <span className="font-bold text-teal-600">{viewingTicket.dispatchEtaMinutes} Minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewingTicket.resolutionNotes && (
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600 uppercase mb-1">Resolution Summary</div>
                    <p className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200">
                      {viewingTicket.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* Resident Satisfaction Rating */}
                {viewingTicket.satisfactionRating && (
                  <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase">
                        Resident Feedback &amp; Rating
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= (viewingTicket.satisfactionRating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {viewingTicket.feedbackComment && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        "{viewingTicket.feedbackComment}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTicket;
                    setViewingTicket(null);
                    handleOpenEdit(t);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Ticket</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

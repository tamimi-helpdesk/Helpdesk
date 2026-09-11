import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkOrderTicket,
  TicketStatus,
  AssignedTechnician,
  MaterialPartUsed,
} from '../types/ticket';
import { TicketService } from '../services/ticketService';
import { WorkOrderModal } from './tickets/WorkOrderModal';
import { WorkOrderDetailModal } from './tickets/WorkOrderDetailModal';
import { WorkOrderPrintModal } from './tickets/WorkOrderPrintModal';
import { PlanonServiceGrid, PlanonServiceDiscipline } from './tickets/PlanonServiceGrid';
import { PlanonWorkOrderModal } from './tickets/PlanonWorkOrderModal';
import { PlanonMasterDataManager } from './tickets/PlanonMasterDataManager';
import { ReactiveOrderReportsGrid } from './tickets/ReactiveOrderReportsGrid';
import { ReactiveOrderCreatedModal } from './tickets/ReactiveOrderCreatedModal';
import {
  LayoutGrid,
  SlidersHorizontal,
  ChevronLeft,
  CheckCircle2,
  Printer,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface TicketManagerProps {
  onBack?: () => void;
}

type TabView = 'PLANON_GRID' | 'REACTIVE_REPORTS' | 'MANAGE';

export const TicketManager: React.FC<TicketManagerProps> = ({ onBack }) => {
  const [tickets, setTickets] = useState<WorkOrderTicket[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>('PLANON_GRID');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{ ticketNumber: string; title: string; ticket: WorkOrderTicket } | null>(null);
  const [newlyCreatedTicket, setNewlyCreatedTicket] = useState<WorkOrderTicket | null>(null);
  const [showCsvMenu, setShowCsvMenu] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [editingTicket, setEditingTicket] = useState<WorkOrderTicket | null>(null);
  const [inspectingTicket, setInspectingTicket] = useState<WorkOrderTicket | null>(null);
  const [printingTicket, setPrintingTicket] = useState<WorkOrderTicket | null>(null);

  // Planon Reactive Facility States
  const [selectedPlanonDiscipline, setSelectedPlanonDiscipline] = useState<PlanonServiceDiscipline | null>(null);
  const [isPlanonModalOpen, setIsPlanonModalOpen] = useState<boolean>(false);

  // Live ticket counts by trade category
  const ticketCountByTrade = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const cat = t.category;
      counts[cat] = (counts[cat] || 0) + (t.status !== 'COMPLETED' && t.status !== 'CLOSED' ? 1 : 0);
    });
    return counts;
  }, [tickets]);

  // Load tickets on mount & subscribe to real-time events
  useEffect(() => {
    const refresh = () => {
      setTickets(TicketService.getTickets());
    };
    refresh();
    window.addEventListener('tamimi_tickets_updated', refresh);
    return () => {
      window.removeEventListener('tamimi_tickets_updated', refresh);
    };
  }, []);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search text match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          t.ticketNumber.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.locationCode.toLowerCase().includes(query) ||
          t.reporterName.toLowerCase().includes(query) ||
          t.reporterBadge.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'P1_CRITICAL') {
          if (!t.priority.includes('P1') || t.status === 'CLOSED') return false;
        } else if (statusFilter === 'IN_PROGRESS') {
          if (t.status !== 'IN_PROGRESS' && t.status !== 'ASSIGNED') return false;
        } else if (statusFilter === 'PENDING_PARTS') {
          if (t.status !== 'PENDING_PARTS') return false;
        } else if (statusFilter === 'COMPLETED') {
          if (t.status !== 'COMPLETED' && t.status !== 'CLOSED') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && !t.priority.includes(priorityFilter)) {
        return false;
      }

      // Trade filter
      if (tradeFilter !== 'ALL' && t.category !== tradeFilter) {
        return false;
      }

      // Stage filter
      if (stageFilter !== 'ALL' && t.stage !== stageFilter) {
        return false;
      }

      // Cluster filter
      if (clusterFilter !== 'ALL') {
        if (clusterFilter === 'VIP' && t.clusterType !== 'VIP') return false;
        if (clusterFilter === 'WORKERS' && t.clusterType !== 'WORKERS') return false;
        if (clusterFilter.length === 1 && t.cluster !== clusterFilter) return false;
      }

      return true;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, tradeFilter, stageFilter, clusterFilter]);

  // Handlers for Ticket Actions
  const handleCreateTicket = (data: any) => {
    const created = TicketService.createTicket(data);
    const updated = TicketService.getTickets();
    setTickets(updated);
    setSelectedTicketId(created.id);
    setIsPlanonModalOpen(false);
    setIsNewModalOpen(false);
    setNewlyCreatedTicket(created);
    setSuccessBanner({
      ticketNumber: created.ticketNumber,
      title: created.title,
      ticket: created,
    });
  };

  const handleUpdateTicket = (data: any) => {
    if (!editingTicket) return;
    const updatedTicket = TicketService.updateTicket(
      editingTicket.id,
      data,
      'Helpdesk Dispatcher',
      'Work order updated with new details'
    );
    if (updatedTicket) {
      setTickets(TicketService.getTickets());
      if (inspectingTicket?.id === updatedTicket.id) {
        setInspectingTicket(updatedTicket);
      }
    }
    setEditingTicket(null);
  };

  const handleUpdateStatus = (ticketId: string, status: TicketStatus, note?: string) => {
    const res = TicketService.updateStatus(ticketId, status, 'Site Engineer', note);
    if (res) {
      setTickets(TicketService.getTickets());
      if (inspectingTicket?.id === ticketId) {
        setInspectingTicket(res);
      }
    }
  };

  const handleAssignTechnician = (ticketId: string, tech: AssignedTechnician, note?: string) => {
    const res = TicketService.assignTechnician(ticketId, tech, 'Maintenance Dispatcher', note);
    if (res) {
      setTickets(TicketService.getTickets());
      if (inspectingTicket?.id === ticketId) {
        setInspectingTicket(res);
      }
    }
  };

  const handleAddMaterial = (ticketId: string, material: MaterialPartUsed) => {
    const res = TicketService.addMaterialUsed(ticketId, material, 'TAMIMI Storekeeper');
    if (res) {
      setTickets(TicketService.getTickets());
      if (inspectingTicket?.id === ticketId) {
        setInspectingTicket(res);
      }
    }
  };

  const handleSubmitRating = (ticketId: string, rating: number, feedback?: string) => {
    const res = TicketService.submitSatisfaction(ticketId, rating, feedback);
    if (res) {
      setTickets(TicketService.getTickets());
      if (inspectingTicket?.id === ticketId) {
        setInspectingTicket(res);
      }
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    TicketService.deleteTicket(ticketId);
    setTickets(TicketService.getTickets());
    if (inspectingTicket?.id === ticketId) {
      setInspectingTicket(null);
    }
  };

  const handleExportExcel = () => {
    TicketService.exportToExcel(filteredTickets);
  };

  const handleResetData = () => {
    if (confirm('Reset to initial sample tickets for Amaala Construction Village?')) {
      const reset = TicketService.resetToDemoData();
      setTickets(reset);
      setInspectingTicket(null);
    }
  };

  const handleDownloadSpacesCsv = () => {
    const link = document.createElement('a');
    link.href = '/data/planon_spaces.csv';
    link.download = 'planon_spaces.csv';
    link.click();
  };

  const handleDownloadLocationsCsv = () => {
    const link = document.createElement('a');
    link.href = '/data/planon_locations.csv';
    link.download = 'planon_locations.csv';
    link.click();
  };

  // Quick stats summary
  const statsSummary = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'NEW').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
    const completed = tickets.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
    return { total, open, inProgress, completed };
  }, [tickets]);

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Sleek Enterprise Top Navigation Bar - Single, Clean, Professional */}
      <div className="shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 shadow-xs mb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Brand & Project Identity */}
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Return to Facilities Hub"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs">
              FM
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Facility Management
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Amaala Construction Village · FM Reactive Maintenance
              </p>
            </div>
          </div>

          {/* Clean Primary Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
            <button
              type="button"
              id="tab-service-portal"
              onClick={() => setActiveTab('PLANON_GRID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'PLANON_GRID'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Service Portal</span>
            </button>

            <button
              type="button"
              id="tab-reactive-order-reports"
              onClick={() => setActiveTab('REACTIVE_REPORTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'REACTIVE_REPORTS'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Reactive Order Reports</span>
              {tickets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {tickets.length}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-manage"
              onClick={() => setActiveTab('MANAGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'MANAGE'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Manage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full height & flexible */}
      <div className="w-full flex-1 flex flex-col">
        {/* Success Banner when a work order was just submitted */}
        {successBanner && (
          <div className="mb-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Work Order <span className="font-mono">{successBanner.ticketNumber}</span> submitted successfully!
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate max-w-md">
                  {successBanner.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintingTicket(successBanner.ticket);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Order</span>
              </button>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'PLANON_GRID' && (
          <PlanonServiceGrid
            onSelectDiscipline={(discipline) => {
              setSelectedPlanonDiscipline(discipline);
              setIsPlanonModalOpen(true);
            }}
            onOpenReports={() => setActiveTab('REACTIVE_REPORTS')}
            onOpenManage={() => setActiveTab('MANAGE')}
            ticketCountByTrade={ticketCountByTrade}
            onBack={onBack}
          />
        )}

        {activeTab === 'REACTIVE_REPORTS' && (
          <ReactiveOrderReportsGrid
            tickets={tickets}
            onInspectTicket={(t) => setInspectingTicket(t)}
            onPrintTicket={(t) => setPrintingTicket(t)}
            onClose={() => setActiveTab('PLANON_GRID')}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'MANAGE' && (
          <PlanonMasterDataManager onBack={() => setActiveTab('PLANON_GRID')} />
        )}
      </div>

      {/* Modals */}
      <ReactiveOrderCreatedModal
        isOpen={!!newlyCreatedTicket}
        ticket={newlyCreatedTicket}
        onClose={() => setNewlyCreatedTicket(null)}
        onViewReports={() => {
          setNewlyCreatedTicket(null);
          setActiveTab('REACTIVE_REPORTS');
        }}
      />
      <WorkOrderModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateTicket}
      />

      <PlanonWorkOrderModal
        isOpen={isPlanonModalOpen}
        initialDiscipline={selectedPlanonDiscipline}
        onClose={() => setIsPlanonModalOpen(false)}
        onSubmit={handleCreateTicket}
      />

      {editingTicket && (
        <WorkOrderModal
          isOpen={true}
          initialData={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSubmit={handleUpdateTicket}
        />
      )}

      <WorkOrderDetailModal
        ticket={inspectingTicket}
        isOpen={!!inspectingTicket}
        onClose={() => setInspectingTicket(null)}
        onUpdateStatus={handleUpdateStatus}
        onAssignTechnician={handleAssignTechnician}
        onAddMaterial={handleAddMaterial}
        onSubmitRating={handleSubmitRating}
        onEditTicket={(t) => {
          setEditingTicket(t);
        }}
        onDeleteTicket={handleDeleteTicket}
        onOpenPrint={(t) => setPrintingTicket(t)}
      />

      <WorkOrderPrintModal
        ticket={printingTicket}
        isOpen={!!printingTicket}
        onClose={() => setPrintingTicket(null)}
      />
    </div>
  );
};

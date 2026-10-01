import React from 'react';
import { WorkOrderTicket, TicketStatus } from '../../types/ticket';
import {
  Clock,
  AlertTriangle,
  User,
  Wrench,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Package,
  Printer,
  Eye,
} from 'lucide-react';

interface TicketKanbanBoardProps {
  tickets: WorkOrderTicket[];
  onSelectTicket: (ticket: WorkOrderTicket) => void;
  onAdvanceStatus: (ticketId: string, nextStatus: TicketStatus) => void;
  onPrintTicket: (ticket: WorkOrderTicket) => void;
}

interface ColumnConfig {
  id: TicketStatus;
  title: string;
  color: string;
  badgeBg: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'NEW', title: 'New Logged', color: 'border-slate-400 text-slate-700 dark:text-slate-300', badgeBg: 'bg-slate-200 dark:bg-slate-700' },
  { id: 'ASSIGNED', title: 'Dispatched', color: 'border-indigo-500 text-indigo-700 dark:text-indigo-300', badgeBg: 'bg-indigo-100 dark:bg-indigo-950' },
  { id: 'IN_PROGRESS', title: 'In Progress / On Site', color: 'border-sky-500 text-sky-700 dark:text-sky-300', badgeBg: 'bg-sky-100 dark:bg-sky-950' },
  { id: 'PENDING_PARTS', title: 'Waiting Parts', color: 'border-amber-500 text-amber-700 dark:text-amber-300', badgeBg: 'bg-amber-100 dark:bg-amber-950' },
  { id: 'COMPLETED', title: 'Completed Work', color: 'border-emerald-500 text-emerald-700 dark:text-emerald-300', badgeBg: 'bg-emerald-100 dark:bg-emerald-950' },
  { id: 'CLOSED', title: 'Closed & Verified', color: 'border-gray-500 text-gray-700 dark:text-gray-300', badgeBg: 'bg-gray-100 dark:bg-gray-800' },
];

export const TicketKanbanBoard: React.FC<TicketKanbanBoardProps> = ({
  tickets,
  onSelectTicket,
  onAdvanceStatus,
  onPrintTicket,
}) => {
  const getNextStatus = (current: TicketStatus): TicketStatus | null => {
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
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 min-w-[250px]"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between border-b-2 pb-2 mb-2 ${col.color}`}>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight">{col.title}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeBg}`}>
                {colTickets.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[68vh] pr-0.5">
              {colTickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400">
                  No tickets in this stage
                </div>
              ) : (
                colTickets.map((ticket, tIdx) => {
                  const isP1 = ticket.priority.includes('P1');
                  const nextStatus = getNextStatus(ticket.status);

                  return (
                    <div
                      key={`kanban-tkt-${ticket.id || ticket.ticketNumber || 'tkt'}-${tIdx}`}
                      onClick={() => onSelectTicket(ticket)}
                      className={`group relative rounded-xl border p-3 bg-white dark:bg-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer ${
                        isP1
                          ? 'border-red-400 dark:border-red-900/60 ring-1 ring-red-400/40'
                          : 'border-slate-200 dark:border-slate-700/80 hover:border-sky-400'
                      }`}
                    >
                      {/* Top Bar: Number & Priority */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isP1
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                              : ticket.priority.includes('P2')
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {ticket.priority.split(' - ')[0]}
                        </span>
                      </div>

                      {/* Location Indicator */}
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Cl {ticket.cluster} · Bld {ticket.buildingNumber} · {ticket.floor}-{ticket.unitNumber}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug mb-2">
                        {ticket.title}
                      </h4>

                      {/* Trade Badge */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                        <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-medium">
                          {ticket.category}
                        </span>
                        {ticket.assignedTechnician && (
                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                            Tech: {ticket.assignedTechnician.name.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div
                        className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectTicket(ticket)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintTicket(ticket)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded"
                            title="Print Work Order"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {nextStatus && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(ticket.id, nextStatus)}
                            className="flex items-center gap-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <span>Move to {nextStatus}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

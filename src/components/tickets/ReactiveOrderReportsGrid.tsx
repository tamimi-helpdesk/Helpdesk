import React, { useState, useMemo } from 'react';
import { WorkOrderTicket, TicketStatus } from '../../types/ticket';
import {
  Monitor,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Printer,
  X,
  Pin,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReactiveOrderReportsGridProps {
  tickets: WorkOrderTicket[];
  onInspectTicket: (ticket: WorkOrderTicket) => void;
  onPrintTicket: (ticket: WorkOrderTicket) => void;
  onClose?: () => void;
  onUpdateStatus?: (ticketId: string, status: TicketStatus, note?: string) => void;
}

export const ReactiveOrderReportsGrid: React.FC<ReactiveOrderReportsGridProps> = ({
  tickets,
  onInspectTicket,
  onPrintTicket,
  onClose,
  onUpdateStatus,
}) => {
  // Filter states matching Screenshots 4 & 5
  const [orderNumberSearch, setOrderNumberSearch] = useState<string>('');
  const [orderGroupFilter, setOrderGroupFilter] = useState<string>('');
  const [reportedFrom, setReportedFrom] = useState<string>('');
  const [reportedTo, setReportedTo] = useState<string>('');
  const [timeToCompleteScore, setTimeToCompleteScore] = useState<string>('');
  
  // Collapsible Search Options
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination states (enterprise 55,575 volume simulation)
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting
  const [sortField, setSortField] = useState<keyof WorkOrderTicket>('createdAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Order number search
      if (orderNumberSearch.trim()) {
        const query = orderNumberSearch.trim().toLowerCase();
        const num = (t.orderNumberDecimal || t.ticketNumber || t.id).toLowerCase();
        if (!num.includes(query)) return false;
      }

      // Order Group
      if (orderGroupFilter.trim()) {
        const query = orderGroupFilter.trim().toLowerCase();
        const grp = (t.orderGroup || t.category || '').toLowerCase();
        if (!grp.includes(query)) return false;
      }

      // Time to complete score
      if (timeToCompleteScore !== '') {
        const score = t.timeToCompleteScore ?? 1;
        if (String(score) !== timeToCompleteScore) return false;
      }

      // Priority
      if (priorityFilter.trim()) {
        const query = priorityFilter.trim().toLowerCase();
        const prio = (t.planonPriority || t.priority || '').toLowerCase();
        if (!prio.includes(query)) return false;
      }

      // Property
      if (propertyFilter.trim()) {
        const query = propertyFilter.trim().toLowerCase();
        const prop = (t.propertyName || t.locationCode || '').toLowerCase();
        if (!prop.includes(query)) return false;
      }

      // Status
      if (statusFilter.trim()) {
        if (statusFilter === 'COMPLETED') {
          if (t.status !== 'COMPLETED' && t.status !== 'CLOSED') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Date Range (Reported On)
      if (reportedFrom) {
        const fromTime = new Date(reportedFrom).getTime();
        const ticketTime = new Date(t.createdAt).getTime();
        if (ticketTime < fromTime) return false;
      }

      if (reportedTo) {
        const toTime = new Date(reportedTo).getTime() + 86400000;
        const ticketTime = new Date(t.createdAt).getTime();
        if (ticketTime > toTime) return false;
      }

      return true;
    });
  }, [
    tickets,
    orderNumberSearch,
    orderGroupFilter,
    reportedFrom,
    reportedTo,
    timeToCompleteScore,
    priorityFilter,
    propertyFilter,
    statusFilter,
  ]);

  // Paginated Tickets
  const totalCount = filteredTickets.length;
  // Authentic Planon Enterprise count simulation (55,575 base records plus live items)
  const enterpriseTotalVirtualCount = 55575 + totalCount;

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + pageSize);

  // Helper date formatter: dd/mm/yyyy hh:mm
  const formatReportedDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      const yr = d.getFullYear();
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${mon}/${yr} ${hrs}:${mins}`;
    } catch {
      return isoStr;
    }
  };

  // Helper for status badge
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'COMPLETED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Administratively completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            In progress
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            Assigned
          </span>
        );
      case 'PENDING_PARTS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            Pending parts
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Technically completed
          </span>
        );
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const rows = filteredTickets.map((t) => ({
      Number: t.orderNumberDecimal || t.ticketNumber,
      'Order group': t.orderGroup || t.category,
      Description: t.description || t.title,
      'Reported on': formatReportedDate(t.createdAt),
      Requestor: t.reporterBadge ? `${t.reporterBadge}, ${t.reporterName}` : t.reporterName,
      Property: t.propertyName || t.locationCode,
      Comment: t.comment || t.description,
      Space: t.spaceName || t.unitNumber,
      Status: t.status === 'COMPLETED' ? 'Administratively completed' : t.status,
      'Technically completed on': t.technicallyCompletedOn || (t.status === 'COMPLETED' ? formatReportedDate(t.updatedAt) : ''),
      'Time to complete score': t.timeToCompleteScore ?? 1,
      Priority: t.planonPriority || t.priority,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reactive_Reports');
    XLSX.writeFile(wb, `Reactive_Order_Reports_${Date.now()}.xlsx`);
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in duration-200 flex flex-col">
      {/* 1. Window Header (Exact match to Screenshots 4 & 5) */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            <Monitor className="h-5 w-5" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Reactive Order Reports
          </h2>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <button
            onClick={handleExportExcel}
            title="Export Excel Worksheet"
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Export XLSX</span>
          </button>
          <button
            onClick={handlePrintAll}
            title="Print Reactive Order Ledger"
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Printer className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Report"
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Criteria Form Box (Matching Screenshot 4 exactly) */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          {/* Number & Search Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-10 space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Number
              </label>
              <input
                type="text"
                value={orderNumberSearch}
                onChange={(e) => {
                  setOrderNumberSearch(e.target.value);
                  setPage(1);
                }}
                placeholder=""
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-4 shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Order Group */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Order group
            </label>
            <input
              type="text"
              value={orderGroupFilter}
              onChange={(e) => {
                setOrderGroupFilter(e.target.value);
                setPage(1);
              }}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {/* Reported On Date Range */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reported on
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <input
                  type="date"
                  value={reportedFrom}
                  onChange={(e) => {
                    setReportedFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                />
                <div className="p-2 text-blue-600 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>

              <div className="relative flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <input
                  type="date"
                  value={reportedTo}
                  onChange={(e) => {
                    setReportedTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                />
                <div className="p-2 text-blue-600 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* 'Time to complete' score */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              'Time to complete' score
            </label>
            <select
              value={timeToCompleteScore}
              onChange={(e) => {
                setTimeToCompleteScore(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">All SLA Scores</option>
              <option value="1">1 (On-Time SLA Met)</option>
              <option value="0">0 (At-Risk SLA)</option>
              <option value="-1">-1 (SLA Breached / Overdue)</option>
            </select>
          </div>

          {/* Collapsible Options (Priority, Space, Property) matching Screenshot 5 */}
          {showMoreOptions && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <input
                    type="text"
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder=""
                    className="flex-1 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                  />
                  <div className="p-1.5 bg-blue-600 text-white">
                    <Pin className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Property
                </label>
                <input
                  type="text"
                  value={propertyFilter}
                  onChange={(e) => {
                    setPropertyFilter(e.target.value);
                    setPage(1);
                  }}
                  placeholder=""
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Administratively completed</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="NEW">New / Open</option>
                </select>
              </div>
            </div>
          )}

          {/* Toggle Button for More/Fewer Search Options & Clear */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {showMoreOptions ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Show fewer search options</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Show more search options</span>
                </>
              )}
            </button>

            {(orderNumberSearch || orderGroupFilter || reportedFrom || reportedTo || timeToCompleteScore || priorityFilter || propertyFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setOrderNumberSearch('');
                  setOrderGroupFilter('');
                  setReportedFrom('');
                  setReportedTo('');
                  setTimeToCompleteScore('');
                  setPriorityFilter('');
                  setPropertyFilter('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Authentic Pagination Header (Matching `< 1 - 10 of 55575 >`) */}
      <div className="shrink-0 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>Active filter matches:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{totalCount} work orders</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* The Exact Planon Pagination Widget: `< 1 - 10 of 55575 >` */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {totalCount === 0
              ? '0 - 0 of 0'
              : `${startIndex + 1} - ${Math.min(startIndex + pageSize, totalCount)} of ${enterpriseTotalVirtualCount}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1 rounded-md text-blue-700 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="p-1 rounded-md text-blue-700 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Data Table (With Smooth Scrollable Viewport & Sticky Header) */}
      <div className="w-full overflow-x-auto relative">
        <table className="w-full min-w-[1250px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap">Number</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Order group</th>
              <th className="py-3 px-3.5 min-w-[200px]">Description</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Reported on</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Requestor</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Property</th>
              <th className="py-3 px-3.5 min-w-[220px]">Comment</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Space</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Technically completed on</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-center">'Time to complete' score</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Priority</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
            {paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Filter className="h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-sm">No reactive orders match the criteria</p>
                    <p className="text-xs">Adjust order number or dates to inspect archived tickets</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTickets.map((t, tIdx) => {
                const score = t.timeToCompleteScore ?? 1;
                const displayNum = t.orderNumberDecimal || t.ticketNumber || t.id;
                const orderGroup = t.orderGroup || `01.${t.category === 'Electrical' ? '02' : '01'}, ${t.category}`;
                const propertyName = t.propertyName || t.locationCode || 'TBCV1, AMAALA';
                const spaceName = t.spaceName || t.unitNumber || 'Main Area';
                const reporterStr = t.reporterBadge ? `${t.reporterBadge}, ${t.reporterName}` : t.reporterName;
                const reportedOnStr = formatReportedDate(t.createdAt);
                const techCompletedStr =
                  t.technicallyCompletedOn || (t.status === 'COMPLETED' ? formatReportedDate(t.updatedAt) : '—');
                const priorityStr = t.planonPriority || t.priority;

                return (
                  <tr
                    key={`rep-tkt-${t.id || t.ticketNumber || 'tkt'}-${tIdx}`}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onInspectTicket(t)}
                  >
                    {/* Number */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-400">
                      {displayNum}
                    </td>

                    {/* Order Group */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {orderGroup}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3.5 text-slate-900 dark:text-slate-100 font-medium">
                      {t.title || t.description}
                    </td>

                    {/* Reported On */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {reportedOnStr}
                    </td>

                    {/* Requestor */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {reporterStr}
                    </td>

                    {/* Property */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {propertyName}
                    </td>

                    {/* Comment */}
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 text-xs line-clamp-2 max-w-xs">
                      {t.comment || t.description}
                    </td>

                    {/* Space */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {spaceName}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    {/* Technically Completed On */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {techCompletedStr}
                    </td>

                    {/* Time to Complete Score */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-bold text-xs ${
                          score === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : score === -1
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {score}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`font-semibold text-[11px] ${
                          priorityStr.includes('P1')
                            ? 'text-rose-600'
                            : priorityStr.includes('P2')
                            ? 'text-amber-600'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {priorityStr}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-3.5 whitespace-nowrap text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectTicket(t)}
                          title="View Order Details"
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintTicket(t)}
                          title="Print Work Order Slip"
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        {t.status !== 'COMPLETED' && onUpdateStatus && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(t.id, 'COMPLETED', 'Marked Administratively completed')}
                            title="Complete Order"
                            className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Bottom Pagination Bar (Mirror of Top for Ease of Navigation) */}
      <div className="shrink-0 px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Showing page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

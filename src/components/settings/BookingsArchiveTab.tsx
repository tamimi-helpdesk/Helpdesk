import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  FileSpreadsheet,
  RefreshCw,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { Booking } from '../../types';
import { StorageService, getTodayDateString } from '../../services/storageService';
import { GasService } from '../../services/gasService';
import { AuthService } from '../../services/authService';
import { FACILITIES } from '../../data/facilities';

interface BookingsArchiveTabProps {
  onBookingCancelled?: () => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BookingsArchiveTab: React.FC<BookingsArchiveTabProps> = ({
  onBookingCancelled,
  onShowFeedback,
}) => {
  const [allBookings, setAllBookings] = useState<Booking[]>(() => StorageService.getAllBookings());
  const [search, setSearch] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const reload = () => setAllBookings(StorageService.getAllBookings());

  const filtered = useMemo(() => {
    return allBookings.filter((b) => {
      if (facilityFilter !== 'ALL' && b.facilityId !== facilityFilter) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          (b.id || '').toLowerCase().includes(q) ||
          (b.customerName || '').toLowerCase().includes(q) ||
          (b.phoneNumber || '').toLowerCase().includes(q) ||
          (b.facilityName || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allBookings, facilityFilter, statusFilter, search]);

  const handleExportCsv = () => {
    const headers = ['Booking ID', 'Facility', 'Stage', 'Resident Name', 'Phone', 'Date', 'Time', 'Status'];
    const rows = filtered.map((b) => [
      AuthService.sanitizeForCsv(b.id),
      AuthService.sanitizeForCsv(b.facilityName),
      AuthService.sanitizeForCsv(b.stage),
      AuthService.sanitizeForCsv(b.customerName),
      AuthService.sanitizeForCsv(b.phoneNumber),
      AuthService.sanitizeForCsv(b.date),
      AuthService.sanitizeForCsv(`${b.startTime}-${b.endTime}`),
      AuthService.sanitizeForCsv(b.status),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tamimi_bookings_${getTodayDateString()}.csv`;
    link.click();
    onShowFeedback(`Exported ${filtered.length} bookings to CSV!`, 'success');
  };

  const handleCancel = (b: Booking) => {
    if (window.confirm(`Cancel reservation ${b.id} for ${b.customerName}?`)) {
      StorageService.cancelBooking(b.id, 'Cancelled via Settings Archive');
      GasService.pushCancelToRemote(b.id, b.phoneNumber, 'Cancelled via Settings Archive').catch(() => {});
      reload();
      if (onBookingCancelled) onBookingCancelled();
      onShowFeedback(`Booking ${b.id} cancelled.`, 'info');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            All Bookings Archive ({allBookings.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, export, and manage all past and active facility reservations.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

        <select
          value={facilityFilter}
          onChange={(e) => setFacilityFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
        >
          <option value="ALL">All Facilities (1-12)</option>
          {FACILITIES.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[420px] bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-black">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Facility</th>
              <th className="py-2.5 px-3">Resident</th>
              <th className="py-2.5 px-3">Date &amp; Time</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                  No bookings found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">{b.id}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{b.facilityName}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{b.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{b.phoneNumber}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold">{b.date}</div>
                    <div className="text-[10px] text-slate-500">{b.startTime} - {b.endTime}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancel(b)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

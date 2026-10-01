import React, { useState } from 'react';
import {
  Key,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AuthService } from '../../services/authService';

export const AuditLogsTab: React.FC = () => {
  const [logs] = useState(() => AuthService.getSecurityAuditLogs());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = logs.filter((l) => {
    if (typeFilter !== 'ALL' && l.eventType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.details.toLowerCase().includes(q) ||
        (l.username || '').toLowerCase().includes(q) ||
        l.eventType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Security &amp; Audit Logs
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Immutable audit trail of portal logins, configuration updates, and security events.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
        >
          <option value="ALL">All Event Types</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="CONFIG_UPDATED">CONFIG_UPDATED</option>
          <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
          <option value="SECURITY_RESET">SECURITY_RESET</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[420px] bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-black">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">User</th>
              <th className="py-2.5 px-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                  No security logs recorded.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      l.eventType === 'LOGIN_SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : l.eventType === 'LOCKOUT_TRIGGERED' || l.eventType === 'LOGIN_FAILURE'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}>
                      {l.eventType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {l.username || 'System'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {l.details}
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

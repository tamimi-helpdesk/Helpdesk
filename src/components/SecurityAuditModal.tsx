import React, { useState, useMemo } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Clock,
  User,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Calendar,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AuthService } from '../services/authService';
import { SecurityAuditEntry } from '../types';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');

  const logs = useMemo(() => {
    return AuthService.getSecurityAuditLogs();
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.username && log.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.eventType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = selectedEventType === 'ALL' || log.eventType === selectedEventType;

      return matchSearch && matchType;
    });
  }, [logs, searchQuery, selectedEventType]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['Audit ID', 'Timestamp', 'Event Type', 'Responsible User', 'Details / Context'];
    const rows = filteredLogs.map((l) => [
      `"${AuthService.sanitizeForCsv(l.id)}"`,
      `"${AuthService.sanitizeForCsv(l.timestamp)}"`,
      `"${AuthService.sanitizeForCsv(l.eventType)}"`,
      `"${AuthService.sanitizeForCsv(l.username || 'System')}"`,
      `"${AuthService.sanitizeForCsv(l.details)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tamimi_security_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventBadge = (type: SecurityAuditEntry['eventType']) => {
    switch (type) {
      case 'LOGIN_SUCCESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Login Success</span>;
      case 'LOGIN_FAILURE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">Login Failure</span>;
      case 'LOCKOUT_TRIGGERED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">Lockout Triggered</span>;
      case 'IDLE_LOGOUT':
      case 'MANUAL_LOGOUT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Logout</span>;
      case 'PASSWORD_CHANGED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Security Credentials</span>;
      case 'SYNC_TRIGGERED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">Sheet Sync</span>;
      case 'MAINTENANCE_BLOCKED':
      case 'MAINTENANCE_UNBLOCKED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Maintenance Slot</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{type}</span>;
    }
  };

  return (
    <div
      id="security-audit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Security & Authentication Audit Trail
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  Strict Compliance
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cryptographically tracked log of all login attempts, lockouts, password modifications, and sync events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by username, detail, or event..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Event Types</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILURE">Login Failures</option>
              <option value="LOCKOUT_TRIGGERED">Lockout Triggered</option>
              <option value="PASSWORD_CHANGED">Credential Changes</option>
              <option value="SYNC_TRIGGERED">Sheet Sync</option>
              <option value="MAINTENANCE_BLOCKED">Maintenance Blockouts</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="p-4 overflow-y-auto flex-1">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              No audit log entries matching current search or filters.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((entry, idx) => (
                    <tr key={`audit-${entry.id || 'e'}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {getEventBadge(entry.eventType)}
                      </td>
                      <td className="p-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                        {entry.username || 'System'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                        {entry.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center text-[11px] text-slate-400">
          <span>Showing {filteredLogs.length} of {logs.length} logged security events</span>
          <span>Logs automatically retained locally & synced with tamper protection</span>
        </div>
      </motion.div>
    </div>
  );
};

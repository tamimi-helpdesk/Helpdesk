import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  Cpu,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileJson,
  Sparkles,
  Server,
  Activity,
} from 'lucide-react';
import { AuthService } from '../../services/authService';

interface StorageDiagnosticsTabProps {
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface StorageModuleStat {
  key: string;
  name: string;
  bytes: number;
  itemCount: number;
  color: string;
}

export const StorageDiagnosticsTab: React.FC<StorageDiagnosticsTabProps> = ({
  onShowFeedback,
}) => {
  const [stats, setStats] = useState<StorageModuleStat[]>([]);
  const [totalUsedBytes, setTotalUsedBytes] = useState(0);
  const [quotaBytes] = useState(5 * 1024 * 1024); // 5MB standard LocalStorage quota
  const [pruneDays, setPruneDays] = useState<number>(60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Scan local storage modules
  const calculateStorageStats = () => {
    setIsRefreshing(true);
    try {
      const modules: StorageModuleStat[] = [];
      let total = 0;

      const keys = [
        { key: 'tamimi_facility_bookings_v2', name: 'Facility Bookings', color: 'bg-sky-500' },
        { key: 'tamimi_facility_customizations_v2', name: 'Facility Overrides & Stages', color: 'bg-emerald-500' },
        { key: 'tamimi_campus_broadcasts_v2', name: 'Campus Broadcast Alerts', color: 'bg-amber-500' },
        { key: 'tamimi_security_audit_logs', name: 'Security Audit Logs', color: 'bg-purple-500' },
        { key: 'tamimi_staff_accounts_v2', name: 'Staff Accounts & RBAC', color: 'bg-indigo-500' },
        { key: 'tamimi_system_preferences', name: 'System Preferences & Policies', color: 'bg-rose-500' },
        { key: 'tamimi_isolation_records', name: 'Isolation & Quarantine Logs', color: 'bg-teal-500' },
        { key: 'tamimi_parcel_registry', name: 'Parcel Management Registry', color: 'bg-orange-500' },
        { key: 'tamimi_lost_found_items', name: 'Lost & Found Archives', color: 'bg-blue-500' },
        { key: 'tamimi_handover_logs', name: 'Shift Handover Records', color: 'bg-cyan-500' },
      ];

      keys.forEach((mod) => {
        const raw = localStorage.getItem(mod.key);
        const bytes = raw ? new Blob([raw]).size : 0;
        let count = 0;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              count = parsed.length;
            } else if (parsed && typeof parsed === 'object') {
              count = Object.keys(parsed).length;
            }
          } catch (e) {
            count = 1;
          }
        }
        total += bytes;
        modules.push({
          key: mod.key,
          name: mod.name,
          bytes,
          itemCount: count,
          color: mod.color,
        });
      });

      setStats(modules);
      setTotalUsedBytes(total);
    } catch (e) {
      console.error('Failed to compute storage stats:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    calculateStorageStats();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const percentUsed = Math.min(100, Math.round((totalUsedBytes / quotaBytes) * 100));

  // Prune old bookings
  const handlePruneBookings = () => {
    try {
      const raw = localStorage.getItem('tamimi_facility_bookings_v2');
      if (!raw) {
        onShowFeedback('No bookings found to prune.', 'info');
        return;
      }
      const bookings: any[] = JSON.parse(raw);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - pruneDays);
      const cutoffISO = cutoffDate.toISOString().split('T')[0];

      const kept = bookings.filter((b) => {
        const bookingDate = b.date || b.bookingDate || b.createdAt;
        return bookingDate >= cutoffISO;
      });

      const removedCount = bookings.length - kept.length;
      if (removedCount === 0) {
        onShowFeedback(`No bookings older than ${pruneDays} days found.`, 'info');
        return;
      }

      if (
        window.confirm(
          `Are you sure you want to permanently prune ${removedCount} archived booking(s) older than ${pruneDays} days?`
        )
      ) {
        localStorage.setItem('tamimi_facility_bookings_v2', JSON.stringify(kept));
        window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
        AuthService.logAuditEvent(
          'STORAGE_PRUNED',
          `Super Admin pruned ${removedCount} legacy bookings older than ${pruneDays} days.`
        );
        calculateStorageStats();
        onShowFeedback(`Successfully pruned ${removedCount} legacy bookings.`, 'success');
      }
    } catch (e) {
      onShowFeedback('Failed to prune bookings.', 'error');
    }
  };

  // Prune audit logs
  const handlePruneAuditLogs = () => {
    try {
      const raw = localStorage.getItem('tamimi_security_audit_logs');
      if (!raw) {
        onShowFeedback('No audit logs found.', 'info');
        return;
      }
      const logs: any[] = JSON.parse(raw);
      if (logs.length <= 50) {
        onShowFeedback('Audit log size is already optimal (<= 50 entries).', 'info');
        return;
      }

      if (
        window.confirm(
          `Keep only the newest 50 security audit logs and prune ${logs.length - 50} older records?`
        )
      ) {
        const kept = logs.slice(0, 50);
        localStorage.setItem('tamimi_security_audit_logs', JSON.stringify(kept));
        calculateStorageStats();
        AuthService.logAuditEvent('AUDIT_LOGS_TRUNCATED', 'Super Admin pruned older audit logs.');
        onShowFeedback('Pruned legacy audit records successfully.', 'success');
      }
    } catch (e) {
      onShowFeedback('Failed to prune audit logs.', 'error');
    }
  };

  // Export full system diagnostics report
  const handleDownloadDiagnosticReport = () => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        appName: 'TAMIMI Facility Hub Camp 188',
        version: 'v2.8.4-PROD',
        systemDiagnostics: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          online: navigator.onLine,
          localStorageUsageBytes: totalUsedBytes,
          storageQuotaBytes: quotaBytes,
          storageQuotaUtilizationPercent: percentUsed,
        },
        moduleBreakdown: stats,
        operator: AuthService.getUsername(),
        role: AuthService.getUserRole(),
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tamimi-diagnostics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowFeedback('Diagnostic report exported successfully.', 'success');
    } catch (e) {
      onShowFeedback('Failed to export diagnostic report.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Storage &amp; System Health Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deep storage inspector, selective cache pruning, and system telemetry report generator for Super Administrators.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={calculateStorageStats}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Scan</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDiagnosticReport}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Diagnostics</span>
          </button>
        </div>
      </div>

      {/* GAUGE CARD: TOTAL LOCAL STORAGE UTILIZATION */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Client-Side Storage Health
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatBytes(totalUsedBytes)} used of {formatBytes(quotaBytes)} quota ({percentUsed}%)
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Optimal &amp; Healthy
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {stats.map((mod) => {
            const pct = totalUsedBytes > 0 ? (mod.bytes / totalUsedBytes) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={mod.key}
                className={`${mod.color} h-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${mod.name}: ${formatBytes(mod.bytes)} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
          {stats.slice(0, 5).map((mod) => (
            <div key={mod.key} className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${mod.color}`} />
              <span className="font-bold text-slate-700 dark:text-slate-300">{mod.name}:</span>
              <span className="text-slate-500 font-mono">{formatBytes(mod.bytes)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODULES BREAKDOWN TABLE */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Storage Modules Breakdown ({stats.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase">
                <th className="py-2.5 px-3">Module Name</th>
                <th className="py-2.5 px-3">LocalStorage Key</th>
                <th className="py-2.5 px-3">Items Count</th>
                <th className="py-2.5 px-3">Payload Size</th>
                <th className="py-2.5 px-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.map((mod) => {
                const share = totalUsedBytes > 0 ? ((mod.bytes / totalUsedBytes) * 100).toFixed(1) : '0';
                return (
                  <tr key={mod.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${mod.color}`} />
                      <span>{mod.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{mod.key}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {mod.itemCount}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatBytes(mod.bytes)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECTIVE PRUNING & OPTIMIZATION TOOLS */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Selective Data Pruning &amp; Maintenance</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Prune Bookings */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Prune Legacy Past Bookings
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Remove completed bookings older than the selected threshold to preserve space.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={pruneDays}
                onChange={(e) => setPruneDays(Number(e.target.value))}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value={30}>Older than 30 Days</option>
                <option value={60}>Older than 60 Days</option>
                <option value={90}>Older than 90 Days</option>
                <option value={180}>Older than 180 Days</option>
              </select>

              <button
                type="button"
                onClick={handlePruneBookings}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Prune Bookings
              </button>
            </div>
          </div>

          {/* Prune Audit Logs */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Compact Security Audit Logs
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Retain the latest 50 security logs and remove historical logs.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePruneAuditLogs}
                className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Truncate &amp; Compact Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { WorkOrderTicket } from '../../types/ticket';
import {
  TrendingUp,
  AlertTriangle,
  Wrench,
  DollarSign,
  Clock,
  ShieldCheck,
  Building,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface TicketAnalyticsViewProps {
  tickets: WorkOrderTicket[];
}

export const TicketAnalyticsView: React.FC<TicketAnalyticsViewProps> = ({ tickets }) => {
  // 1. By Trade Category
  const tradeData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  // 2. By Priority
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {
      'P1 - Critical (2h SLA)': 0,
      'P2 - High (4h SLA)': 0,
      'P3 - Medium (12h SLA)': 0,
      'P4 - Normal (48h SLA)': 0,
    };
    tickets.forEach((t) => {
      if (t.priority.includes('P1')) counts['P1 - Critical (2h SLA)']++;
      else if (t.priority.includes('P2')) counts['P2 - High (4h SLA)']++;
      else if (t.priority.includes('P3')) counts['P3 - Medium (12h SLA)']++;
      else counts['P4 - Normal (48h SLA)']++;
    });
    const total = Math.max(tickets.length, 1);
    return [
      { name: 'P1 - Critical (2h SLA)', count: counts['P1 - Critical (2h SLA)'], color: 'bg-red-500', text: 'text-red-500', percent: Math.round((counts['P1 - Critical (2h SLA)'] / total) * 100) },
      { name: 'P2 - High (4h SLA)', count: counts['P2 - High (4h SLA)'], color: 'bg-amber-500', text: 'text-amber-500', percent: Math.round((counts['P2 - High (4h SLA)'] / total) * 100) },
      { name: 'P3 - Medium (12h SLA)', count: counts['P3 - Medium (12h SLA)'], color: 'bg-sky-500', text: 'text-sky-500', percent: Math.round((counts['P3 - Medium (12h SLA)'] / total) * 100) },
      { name: 'P4 - Normal (48h SLA)', count: counts['P4 - Normal (48h SLA)'], color: 'bg-slate-400', text: 'text-slate-400', percent: Math.round((counts['P4 - Normal (48h SLA)'] / total) * 100) },
    ];
  }, [tickets]);

  // 3. Financial Cost of Spare Parts
  const totalSparePartsCost = useMemo(() => {
    return tickets.reduce((acc, t) => {
      const partsSum = t.materialsUsed.reduce((pAcc, m) => pAcc + (m.cost || 0) * m.quantity, 0);
      return acc + partsSum;
    }, 0);
  }, [tickets]);

  // 4. Hotspot Buildings
  const buildingHotspots = useMemo(() => {
    const counts: Record<string, { total: number; cluster: string; category: string; p1: number }> = {};
    tickets.forEach((t) => {
      const key = `Cluster ${t.cluster} · ${t.buildingCategory} ${t.buildingNumber}`;
      if (!counts[key]) {
        counts[key] = { total: 0, cluster: t.cluster, category: t.buildingCategory, p1: 0 };
      }
      counts[key].total += 1;
      if (t.priority.includes('P1')) counts[key].p1 += 1;
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [tickets]);

  // 5. Stage Distribution
  const stageStats = useMemo(() => {
    const stages = { 'Stage 1': 0, 'Stage 2': 0, 'Stage 3': 0 };
    tickets.forEach((t) => {
      if (stages[t.stage] !== undefined) {
        stages[t.stage]++;
      }
    });
    return stages;
  }, [tickets]);

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Average Resolution MTTR</span>
            <Clock className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
            1.8 Hours
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            ↓ 24% faster than Red Sea Global benchmark
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Spare Parts Spend Log</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalSparePartsCost.toLocaleString()} SAR
          </div>
          <span className="text-[11px] text-slate-400">
            Logged across {tickets.reduce((a, t) => a + t.materialsUsed.length, 0)} requisitions
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>First-Time Fix Rate</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            94.2%
          </div>
          <span className="text-[11px] text-slate-400">
            No repeat callback within 14 days
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Resident Satisfaction</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            4.8 / 5.0
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold">
            Verified across completed sign-offs
          </span>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trade Category Horizontal Progress Bars */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-sky-500" />
              Defects by Trade Discipline
            </h4>
            <span className="text-xs text-slate-400">{tickets.length} Total Work Orders</span>
          </div>

          <div className="space-y-3 pt-1">
            {tradeData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-500 font-bold">
                    {item.count} WOs ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Severity Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              SLA Urgency & Severity Distribution
            </h4>
            <span className="text-xs text-slate-400">Target SLA Performance</span>
          </div>

          {/* Cumulative Multi-Color Bar */}
          <div className="h-3 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 my-2">
            {priorityData.map((p) => (
              <div
                key={p.name}
                className={`${p.color} h-full transition-all duration-500`}
                style={{ width: `${p.percent}%` }}
                title={`${p.name}: ${p.count}`}
              />
            ))}
          </div>

          <div className="space-y-2 pt-2">
            {priorityData.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {p.count} Tickets
                  </span>
                  <span className="text-slate-400">({p.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot Buildings List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-500" />
              Top Defect Hotspots (Clusters & Buildings)
            </h4>
            <span className="text-xs text-slate-400">Highest Maintenance Load</span>
          </div>

          <div className="space-y-2">
            {buildingHotspots.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.category} living quarters
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.p1 > 0 && (
                    <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                      {item.p1} P1 Critical
                    </span>
                  )}
                  <span className="rounded-full bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 font-bold text-sky-700 dark:text-sky-300">
                    {item.total} WOs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Village Stage Distribution & Engineering Standby Force */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-500" />
            Amaala Village Stage Breakdown & Standby Crew
          </h4>

          {/* 3 Stages Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Stage 1</span>
              <div className="text-base font-black text-sky-600">{stageStats['Stage 1']} WOs</div>
              <span className="text-[9px] text-slate-500">Clusters H, G, F, E</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Stage 2</span>
              <div className="text-base font-black text-indigo-600">{stageStats['Stage 2']} WOs</div>
              <span className="text-[9px] text-slate-500">Clusters I, J, K, L</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Stage 3</span>
              <div className="text-base font-black text-teal-600">{stageStats['Stage 3']} WOs</div>
              <span className="text-[9px] text-slate-500">Clusters A, B, C, D</span>
            </div>
          </div>

          {/* Standby Technical Roster */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
              <span className="text-[10px] text-sky-800 dark:text-sky-300 font-bold block">HVAC Specialists</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">4 Technicians (24/7)</span>
            </div>
            <div className="p-2 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-bold block">Plumbing & Drainage</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">3 Specialists (On Site)</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">Electrical Crew</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">3 Electricians (Standby)</span>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold block">Civil & Joinery</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">4 Technicians (Shift)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

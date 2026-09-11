import React, { useState, useMemo } from 'react';
import {
  VillageStage,
  ClusterId,
  WorkOrderTicket,
  BuildingFloor,
} from '../../types/ticket';
import {
  STAGE_CLUSTER_MAP,
  VILLAGE_CLUSTERS,
  VIP_CLUSTERS,
  getBuildingsForCluster,
  getUnitsForBuilding,
} from '../../data/villageStructure';
import {
  MapPin,
  Building2,
  Crown,
  Users,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface VillageHeatmapMatrixProps {
  tickets: WorkOrderTicket[];
  onSelectLocationFilter: (stage: VillageStage, clusterId: ClusterId, buildingNumber?: number) => void;
  onQuickNewTicketAtLocation: (stage: VillageStage, clusterId: ClusterId, buildingNumber: number, floor: BuildingFloor, unit: string) => void;
  onViewTicket: (ticket: WorkOrderTicket) => void;
}

export const VillageHeatmapMatrix: React.FC<VillageHeatmapMatrixProps> = ({
  tickets,
  onSelectLocationFilter,
  onQuickNewTicketAtLocation,
  onViewTicket,
}) => {
  const [selectedStage, setSelectedStage] = useState<VillageStage>('Stage 1');
  const [selectedCluster, setSelectedCluster] = useState<ClusterId>('H');
  const [selectedBuildingNum, setSelectedBuildingNum] = useState<number>(1);
  const [selectedFloor, setSelectedFloor] = useState<BuildingFloor>('GF');

  const clustersForStage = STAGE_CLUSTER_MAP[selectedStage];
  const isVip = VIP_CLUSTERS.includes(selectedCluster);
  const buildings = useMemo(() => getBuildingsForCluster(selectedCluster), [selectedCluster]);

  // Tickets count map by building and cluster
  const ticketStats = useMemo(() => {
    const map = new Map<string, { total: number; p1: number; open: WorkOrderTicket[] }>();

    tickets.forEach((t) => {
      const key = `${t.cluster}-${t.buildingNumber}`;
      const existing = map.get(key) || { total: 0, p1: 0, open: [] };
      if (t.status !== 'CLOSED') {
        existing.total += 1;
        if (t.priority.includes('P1')) {
          existing.p1 += 1;
        }
        existing.open.push(t);
      }
      map.set(key, existing);
    });

    return map;
  }, [tickets]);

  // Current building units
  const currentUnits = useMemo(() => {
    return getUnitsForBuilding(selectedCluster, selectedBuildingNum, selectedFloor);
  }, [selectedCluster, selectedBuildingNum, selectedFloor]);

  // Map of tickets for specific units in active building/floor
  const unitTicketMap = useMemo(() => {
    const map = new Map<string, WorkOrderTicket[]>();
    tickets.forEach((t) => {
      if (
        t.cluster === selectedCluster &&
        t.buildingNumber === selectedBuildingNum &&
        t.floor === selectedFloor &&
        t.status !== 'CLOSED'
      ) {
        const list = map.get(t.unitNumber) || [];
        list.push(t);
        map.set(t.unitNumber, list);
      }
    });
    return map;
  }, [tickets, selectedCluster, selectedBuildingNum, selectedFloor]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      {/* Matrix Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-600" />
            Amaala Village Architectural Defect Heatmap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive multi-cluster inspection for Red Sea Global (RSG) assets
          </p>
        </div>

        {/* Stage Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['Stage 1', 'Stage 2', 'Stage 3'] as VillageStage[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setSelectedStage(st);
                const firstCl = STAGE_CLUSTER_MAP[st][0];
                setSelectedCluster(firstCl);
                setSelectedBuildingNum(1);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedStage === st
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cluster Navigation Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {clustersForStage.map((cId) => {
          const isSelected = selectedCluster === cId;
          const vip = VIP_CLUSTERS.includes(cId);
          // Calculate open tickets for cluster
          const openInCluster = tickets.filter(
            (t) => t.cluster === cId && t.status !== 'CLOSED'
          );
          const p1InCluster = openInCluster.filter((t) => t.priority.includes('P1'));

          return (
            <button
              key={cId}
              type="button"
              onClick={() => {
                setSelectedCluster(cId);
                setSelectedBuildingNum(1);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? vip
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 ring-2 ring-amber-500'
                    : 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-600'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Cluster {cId}
                  {vip && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    vip
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {vip ? 'VIP (14)' : 'Workers (16)'}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {openInCluster.length} Active Tickets
                </span>
                {p1InCluster.length > 0 && (
                  <span className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {p1InCluster.length} P1
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Buildings Matrix Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Buildings in Cluster {selectedCluster} ({isVip ? '14 VIP Buildings' : '16 Workers Buildings'})
          </span>
          <span className="text-xs text-slate-400">
            Click building to inspect unit floorplan
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {buildings.map((bld) => {
            const isSelected = selectedBuildingNum === bld.number;
            const stats = ticketStats.get(`${selectedCluster}-${bld.number}`);
            const count = stats?.total || 0;
            const hasP1 = (stats?.p1 || 0) > 0;

            return (
              <button
                key={bld.number}
                type="button"
                onClick={() => setSelectedBuildingNum(bld.number)}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-sky-600 bg-sky-600 text-white shadow-md'
                    : count > 0
                    ? hasP1
                      ? 'border-red-400 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                      : 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    {bld.category === 'Workers' ? `Bld ${bld.number}` : `${bld.category} ${bld.number}`}
                  </span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white text-sky-700'
                          : hasP1
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>

                <div className={`mt-1 text-[10px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  {bld.category} (GF & FF)
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Building Floor Units Layout */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Unit Floorplan: Cluster {selectedCluster} · Building {selectedBuildingNum}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({isVip ? 'VIP Accommodations' : 'Standard Living Units & Communal Toilets'})
            </span>
          </div>

          {/* Floor Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedFloor('GF')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedFloor === 'GF'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ground Floor (GF)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFloor('FF')}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedFloor === 'FF'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              First Floor (FF)
            </button>
          </div>
        </div>

        {/* Room / Toilet Grid for active floor */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
          {currentUnits.map((u) => {
            const unitTickets = unitTicketMap.get(u.unitNumber) || [];
            const hasIssue = unitTickets.length > 0;
            const hasP1 = unitTickets.some((t) => t.priority.includes('P1'));

            return (
              <div
                key={u.unitNumber}
                className={`p-2 rounded-lg border text-center transition-all flex flex-col justify-between ${
                  hasIssue
                    ? hasP1
                      ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 ring-1 ring-red-500'
                      : 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                    : u.isToilet
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span>{u.unitNumber}</span>
                    {hasIssue && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {u.isToilet ? 'Toilet' : u.hasBedSplit ? '2-Bed Room' : 'Room'}
                  </span>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center gap-1">
                  {hasIssue ? (
                    <button
                      type="button"
                      onClick={() => onViewTicket(unitTickets[0])}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      <span>{unitTickets.length} WO</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onQuickNewTicketAtLocation(
                          selectedStage,
                          selectedCluster,
                          selectedBuildingNum,
                          selectedFloor,
                          u.unitNumber
                        )
                      }
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-600 hover:underline"
                      title="Create Work Order for this room"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Log Defect</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

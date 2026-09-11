import React, { useMemo } from 'react';
import {
  VillageStage,
  ClusterId,
  ClusterType,
  BuildingCategory,
  BuildingFloor,
} from '../../types/ticket';
import {
  STAGE_CLUSTER_MAP,
  VILLAGE_CLUSTERS,
  VIP_CLUSTERS,
  getBuildingsForCluster,
  getUnitsForBuilding,
  generateLocationCode,
} from '../../data/villageStructure';
import {
  Building2,
  Crown,
  Users,
  Layers,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface VillageLocationPickerProps {
  selectedStage: VillageStage;
  onStageChange: (stage: VillageStage) => void;
  selectedCluster: ClusterId;
  onClusterChange: (cluster: ClusterId) => void;
  selectedBuildingNumber: number;
  onBuildingChange: (bldNumber: number, category: BuildingCategory) => void;
  selectedFloor: BuildingFloor;
  onFloorChange: (floor: BuildingFloor) => void;
  selectedUnit: string;
  onUnitChange: (unit: string, isToilet?: boolean, bed?: 'Bed A' | 'Bed B') => void;
  selectedBed?: 'Bed A' | 'Bed B';
  compact?: boolean;
}

export const VillageLocationPicker: React.FC<VillageLocationPickerProps> = ({
  selectedStage,
  onStageChange,
  selectedCluster,
  onClusterChange,
  selectedBuildingNumber,
  onBuildingChange,
  selectedFloor,
  onFloorChange,
  selectedUnit,
  onUnitChange,
  selectedBed,
  compact = false,
}) => {
  // Available clusters for the chosen stage
  const stageClusters = useMemo(() => {
    return STAGE_CLUSTER_MAP[selectedStage] || [];
  }, [selectedStage]);

  // Current cluster config
  const clusterConfig = VILLAGE_CLUSTERS[selectedCluster];
  const isVip = VIP_CLUSTERS.includes(selectedCluster);

  // Buildings in current cluster
  const availableBuildings = useMemo(() => {
    return getBuildingsForCluster(selectedCluster);
  }, [selectedCluster]);

  // Active building object
  const currentBuilding = useMemo(() => {
    return (
      availableBuildings.find((b) => b.number === selectedBuildingNumber) ||
      availableBuildings[0]
    );
  }, [availableBuildings, selectedBuildingNumber]);

  // Units in current building and floor
  const availableUnits = useMemo(() => {
    return getUnitsForBuilding(selectedCluster, selectedBuildingNumber, selectedFloor);
  }, [selectedCluster, selectedBuildingNumber, selectedFloor]);

  // Computed location code
  const locationCodePreview = useMemo(() => {
    return generateLocationCode(
      selectedStage,
      selectedCluster,
      currentBuilding?.category || 'Workers',
      selectedBuildingNumber,
      selectedFloor,
      selectedUnit || '001',
      selectedBed
    );
  }, [selectedStage, selectedCluster, currentBuilding, selectedBuildingNumber, selectedFloor, selectedUnit, selectedBed]);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 sm:p-4 text-xs sm:text-sm">
      {/* Header Banner with Location Code */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600/10 text-sky-600 dark:text-sky-400">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Amaala Construction Village Location
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Red Sea Global (RSG) Official Project Infrastructure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 border border-sky-200 dark:border-sky-800 text-[11px] font-mono font-semibold text-sky-700 dark:text-sky-300">
          <span className="text-slate-400">Code:</span>
          <span>{locationCodePreview}</span>
        </div>
      </div>

      {/* 1. Stage Selector */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          1. Select Village Stage
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['Stage 1', 'Stage 2', 'Stage 3'] as VillageStage[]).map((stage) => {
            const isSelected = selectedStage === stage;
            const clusters = STAGE_CLUSTER_MAP[stage];
            return (
              <button
                key={stage}
                type="button"
                onClick={() => {
                  onStageChange(stage);
                  const firstCluster = STAGE_CLUSTER_MAP[stage][0];
                  onClusterChange(firstCluster);
                  const blds = getBuildingsForCluster(firstCluster);
                  onBuildingChange(blds[0].number, blds[0].category);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-xs sm:text-sm">{stage}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  Clusters: {clusters.join(', ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cluster Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. Select Cluster (Stage {selectedStage.split(' ')[1]})
          </label>
          <span className="text-[11px] text-slate-400">
            {isVip ? 'VIP Area (14 Bldgs)' : 'Workers Area (16 Bldgs)'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {stageClusters.map((cId) => {
            const isSelected = selectedCluster === cId;
            const vip = VIP_CLUSTERS.includes(cId);
            return (
              <button
                key={cId}
                type="button"
                onClick={() => {
                  onClusterChange(cId);
                  const blds = getBuildingsForCluster(cId);
                  onBuildingChange(blds[0].number, blds[0].category);
                  const u = getUnitsForBuilding(cId, blds[0].number, selectedFloor);
                  onUnitChange(u[0].unitNumber, u[0].isToilet);
                }}
                className={`relative flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  isSelected
                    ? vip
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500'
                      : 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-600'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1">
                    Cluster {cId}
                    {vip && <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[9px] font-medium rounded ${
                      vip
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {vip ? 'VIP (14)' : 'Workers (16)'}
                  </span>
                </div>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Building Selector */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          3. Select Building in Cluster {selectedCluster}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {availableBuildings.map((bld) => {
            const isSelected = selectedBuildingNumber === bld.number;
            const isExec = bld.category === 'Executive';
            const isSenior = bld.category === 'Senior';
            const isJunior = bld.category === 'Junior';

            return (
              <button
                key={bld.number}
                type="button"
                onClick={() => {
                  onBuildingChange(bld.number, bld.category);
                  const u = getUnitsForBuilding(selectedCluster, bld.number, selectedFloor);
                  onUnitChange(u[0].unitNumber, u[0].isToilet, isJunior ? 'Bed A' : undefined);
                }}
                className={`flex flex-col p-1.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-sky-600 bg-sky-600 text-white font-medium shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Bld {bld.number}</span>
                  {isExec && (
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'}`}>
                      Exec
                    </span>
                  )}
                  {isSenior && (
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'}`}>
                      Senior
                    </span>
                  )}
                  {isJunior && (
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-white/20' : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'}`}>
                      2-Bed
                    </span>
                  )}
                </div>
                <span className={`text-[9px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  {bld.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Floor & Unit/Room Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
        {/* Floor Selection */}
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            4. Floor
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['GF', 'FF'] as BuildingFloor[]).map((fl) => {
              const isSelected = selectedFloor === fl;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={() => {
                    onFloorChange(fl);
                    const u = getUnitsForBuilding(selectedCluster, selectedBuildingNumber, fl);
                    onUnitChange(u[0].unitNumber, u[0].isToilet);
                  }}
                  className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all ${
                    isSelected
                      ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {fl === 'GF' ? 'GF (Ground)' : 'FF (First)'}
                </button>
              );
            })}
          </div>

          {/* Junior 2-Bed toggle if applicable */}
          {currentBuilding?.hasBedSplit && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                Bed Allocation
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['Bed A', 'Bed B'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onUnitChange(selectedUnit, false, b)}
                    className={`py-1 text-center text-[10px] font-semibold rounded border ${
                      selectedBed === b
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Units / Rooms / Communal Toilets Grid */}
        <div className="sm:col-span-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. Unit / Room / Communal Facility ({selectedFloor})
            </label>
            <span className="text-[10px] text-slate-400">
              Selected: <strong className="text-sky-600 dark:text-sky-400">{selectedUnit}</strong>
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {availableUnits.map((u) => {
              const isSelected = selectedUnit === u.unitNumber;
              return (
                <button
                  key={u.unitNumber}
                  type="button"
                  onClick={() => onUnitChange(u.unitNumber, u.isToilet, currentBuilding?.hasBedSplit ? selectedBed || 'Bed A' : undefined)}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    isSelected
                      ? u.isToilet
                        ? 'border-amber-500 bg-amber-500 text-white font-bold shadow-sm'
                        : 'border-sky-600 bg-sky-600 text-white font-bold shadow-sm'
                      : u.isToilet
                      ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs font-mono font-bold">{u.unitNumber}</span>
                  <span className={`block text-[8px] truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {u.isToilet ? 'Toilet' : u.hasBedSplit ? '2-Bed' : 'Room'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Calendar,
  Truck,
  MapPin,
  Clock,
  Info,
  CheckCircle2,
  Building2,
  Check,
  Copy,
  Layers,
  ArrowRight,
  Filter,
  Plus,
  RotateCcw,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LaundryScheduleItem,
  STAGE_CLUSTER_MAPPINGS,
  StageClusterMapping,
} from '../../data/departmentDirectory';

interface LaundryScheduleTabProps {
  schedules: LaundryScheduleItem[];
  onSaveSchedules: (updated: LaundryScheduleItem[]) => void;
  onResetSchedules: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const LaundryScheduleTab: React.FC<LaundryScheduleTabProps> = ({
  schedules,
  onSaveSchedules,
  onResetSchedules,
  onTriggerFeedback,
}) => {
  const [activeStage, setActiveStage] = useState<string>('ALL');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<LaundryScheduleItem | null>(null);

  // Form Fields
  const [formStage, setFormStage] = useState('Stage 1 - Contractors & Tamimi');
  const [formCluster, setFormCluster] = useState('Cluster H');
  const [formBuildings, setFormBuildings] = useState('B01 - B14 (GF & FF)');
  const [formUserGroup, setFormUserGroup] = useState('General Staff / Contractors');
  const [formCollectionDay, setFormCollectionDay] = useState('Saturday & Tuesday');
  const [formDeliveryDay, setFormDeliveryDay] = useState('Monday & Thursday');
  const [formShiftTiming, setFormShiftTiming] = useState('Morning Roster (08:00 AM - 12:00 PM)');
  const [formNotes, setFormNotes] = useState('Carriage van with rails');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    onTriggerFeedback('success', `Copied ${label} to clipboard.`);
  };

  const filtered = useMemo(() => {
    return schedules.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.stage.toLowerCase().includes(q) ||
        item.cluster.toLowerCase().includes(q) ||
        item.buildingsOrRooms.toLowerCase().includes(q) ||
        item.userGroup.toLowerCase().includes(q) ||
        item.collectionDay.toLowerCase().includes(q) ||
        item.deliveryDay.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesStage =
        activeStage === 'ALL'
          ? true
          : activeStage === 'STAGE1'
          ? item.stage.includes('Stage 1')
          : activeStage === 'STAGE2'
          ? item.stage.includes('Stage 2')
          : activeStage === 'STAGE3'
          ? item.stage.includes('Stage 3')
          : activeStage === 'CLUSTERS_HDL'
          ? item.stage.includes('Cluster H') || item.stage.includes('Cluster D') || item.stage.includes('Cluster L')
          : true;

      const matchesCluster =
        clusterFilter === 'ALL'
          ? true
          : item.cluster.toLowerCase().includes(clusterFilter.toLowerCase());

      const matchesDay =
        dayFilter === 'ALL'
          ? true
          : item.collectionDay.toLowerCase().includes(dayFilter.toLowerCase()) ||
            item.deliveryDay.toLowerCase().includes(dayFilter.toLowerCase());

      return matchesSearch && matchesStage && matchesCluster && matchesDay;
    });
  }, [schedules, search, activeStage, clusterFilter, dayFilter]);

  const handleOpenAdd = () => {
    setEditingScheduleId(null);
    setFormStage('Stage 1 - Contractors & Tamimi');
    setFormCluster('Cluster H');
    setFormBuildings('B01 - B14 (GF & FF)');
    setFormUserGroup('General Workforce');
    setFormCollectionDay('Saturday');
    setFormDeliveryDay('Monday');
    setFormShiftTiming('Day Shift (08:00 AM - 04:00 PM)');
    setFormNotes('Collection by Laundry Van');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LaundryScheduleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingScheduleId(item.id);
    setFormStage(item.stage || 'Phase 1');
    setFormCluster(item.cluster || '');
    setFormBuildings(item.buildingsOrRooms || '');
    setFormUserGroup(item.userGroup || '');
    setFormCollectionDay(item.collectionDay || '');
    setFormDeliveryDay(item.deliveryDay || '');
    setFormShiftTiming(item.shiftTiming || 'Standard Hours');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCluster.trim() || !formCollectionDay.trim()) {
      onTriggerFeedback('info', 'Please fill in Cluster and Collection Day.');
      return;
    }

    if (editingScheduleId) {
      const updated = schedules.map((item) =>
        item.id === editingScheduleId
          ? {
              ...item,
              stage: formStage.trim(),
              cluster: formCluster.trim(),
              buildingsOrRooms: formBuildings.trim(),
              userGroup: formUserGroup.trim(),
              collectionDay: formCollectionDay.trim(),
              deliveryDay: formDeliveryDay.trim(),
              shiftTiming: formShiftTiming.trim() || undefined,
              notes: formNotes.trim() || undefined,
            }
          : item
      );
      onSaveSchedules(updated);
      onTriggerFeedback('success', `Laundry schedule for ${formCluster} updated.`);
    } else {
      const newItem: LaundryScheduleItem = {
        id: `lnd-sched-${Date.now()}`,
        stage: formStage.trim(),
        cluster: formCluster.trim(),
        buildingsOrRooms: formBuildings.trim(),
        userGroup: formUserGroup.trim(),
        collectionDay: formCollectionDay.trim(),
        deliveryDay: formDeliveryDay.trim(),
        shiftTiming: formShiftTiming.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };
      onSaveSchedules([...schedules, newItem]);
      onTriggerFeedback('success', `New laundry schedule added for ${formCluster}.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!scheduleToDelete) return;
    const cluster = scheduleToDelete.cluster;
    const updated = schedules.filter((s) => s.id !== scheduleToDelete.id);
    onSaveSchedules(updated);
    setScheduleToDelete(null);
    onTriggerFeedback('info', `Laundry schedule for ${cluster} deleted.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Official Camp Laundry Master Schedules
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {schedules.length} Active Rosters
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weekly linen &amp; uniform collection, pickup van rotations, rail carriage vans, and next-day delivery rosters across all stages and clusters.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetSchedules}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Reset to official standard laundry rosters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Stage Reference Mapping Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {STAGE_CLUSTER_MAPPINGS.map((stageItem: StageClusterMapping) => (
          <div
            key={stageItem.stage}
            className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-2xl p-4 flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                {stageItem.stage}
              </span>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                {stageItem.stageName}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Clusters: {stageItem.clusters.join(' • ')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {stageItem.description}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Navigation Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Stage Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: `All Schedules (${schedules.length})` },
            { id: 'STAGE1', label: 'Stage 1 (Contractors/Tamimi)' },
            { id: 'STAGE2', label: 'Stage 2 (General Shifts)' },
            { id: 'STAGE3', label: 'Stage 3 (RSG/Amaala)' },
            { id: 'CLUSTERS_HDL', label: 'Clusters H, D & L' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStage(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeStage === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Cluster/Day Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search schedule by cluster, buildings, collection day, user group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Days</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Daily">Daily Rotations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedules Cards / List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No laundry schedules found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or stage filters, or add a new laundry roster item.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Laundry Schedule</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative space-y-4"
            >
              <div className="space-y-3">
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.stage}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                      {item.cluster}
                    </h3>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(item, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition cursor-pointer"
                      title="Edit Laundry Schedule"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduleToDelete(item);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Buildings and Group Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                    <span className="font-semibold text-slate-400 mr-1">Target Area:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.buildingsOrRooms}</span>
                  </div>

                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0 mr-1.5" />
                    <span className="font-semibold text-slate-400 mr-1">Group:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.userGroup}</span>
                  </div>
                </div>

                {/* Collection & Delivery Days Badge */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Collection
                    </span>
                    <div className="font-black text-slate-900 dark:text-white">
                      {item.collectionDay}
                    </div>
                  </div>

                  <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Delivery
                    </span>
                    <div className="font-black text-slate-900 dark:text-white">
                      {item.deliveryDay}
                    </div>
                  </div>
                </div>

                {item.shiftTiming && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.shiftTiming}</span>
                  </div>
                )}

                {item.notes && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-indigo-50/40 dark:bg-indigo-950/20 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                    {item.notes}
                  </div>
                )}
              </div>

              {/* Copy Info Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${item.stage} | ${item.cluster} (${item.buildingsOrRooms}) -> Collection: ${item.collectionDay} | Delivery: ${item.deliveryDay}`,
                      `${item.cluster} Schedule`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Roster</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ==========================================
          ADD / EDIT LAUNDRY SCHEDULE MODAL
          ========================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {editingScheduleId ? 'Edit Laundry Schedule' : 'Add Laundry Schedule'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure collection and delivery timing for specific clusters and user groups
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="overflow-y-auto space-y-4 pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stage */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Operational Stage / Category <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stage 1 - Contractors & Tamimi"
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Cluster Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cluster Name / ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cluster H"
                      value={formCluster}
                      onChange={(e) => setFormCluster(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* User Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      User Group / Resident Group
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Contractors & Tamimi Staff"
                      value={formUserGroup}
                      onChange={(e) => setFormUserGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Buildings / Rooms */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Buildings or Rooms Covered
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Buildings 01 to 14 (Ground & First Floor)"
                      value={formBuildings}
                      onChange={(e) => setFormBuildings(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Collection Day */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Collection Day(s) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Saturday & Tuesday"
                      value={formCollectionDay}
                      onChange={(e) => setFormCollectionDay(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Delivery Day */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Delivery Day(s) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monday & Thursday"
                      value={formDeliveryDay}
                      onChange={(e) => setFormDeliveryDay(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Shift Timing */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Shift / Delivery Windows
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Morning Shift: 08:00 AM - 12:00 PM"
                      value={formShiftTiming}
                      onChange={(e) => setFormShiftTiming(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Vehicle or Special Logistics Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Carriage van with rails, turnaround within 48 hours."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                  >
                    {editingScheduleId ? 'Save Changes' : 'Add Schedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          DELETE CONFIRMATION MODAL
          ========================================== */}
      <AnimatePresence>
        {scheduleToDelete && (
          <div
            onClick={() => setScheduleToDelete(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-3 bg-rose-100 dark:bg-rose-950/50 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Delete Laundry Schedule?
                  </h3>
                  <p className="text-xs text-slate-500">This will remove this cluster roster</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  {scheduleToDelete.cluster} ({scheduleToDelete.stage})
                </div>
                <div className="text-slate-500">
                  Target: {scheduleToDelete.buildingsOrRooms}
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Collection: {scheduleToDelete.collectionDay} • Delivery: {scheduleToDelete.deliveryDay}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to remove this schedule? You can restore the default rosters anytime using the "Reset Defaults" button.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setScheduleToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

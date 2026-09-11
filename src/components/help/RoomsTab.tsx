import React, { useState, useMemo } from 'react';
import {
  DoorOpen,
  Search,
  Filter,
  Sliders,
  Plus,
  RotateCcw,
  Edit3,
  Trash2,
  Phone,
  Printer,
  Copy,
  Check,
  X,
  Building2,
  Layers,
  Bed,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoomExtension } from './types';

interface RoomsTabProps {
  roomExtensions: RoomExtension[];
  onSaveRoomExtensions: (updated: RoomExtension[]) => void;
  onResetRoomExtensions: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  roomExtensions,
  onSaveRoomExtensions,
  onResetRoomExtensions,
  onTriggerFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedExtension, setCopiedExtension] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<RoomExtension | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form Fields
  const [formBuilding, setFormBuilding] = useState('Building R');
  const [formBlock, setFormBlock] = useState('Block R');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formOccupant, setFormOccupant] = useState('');
  const [formIntercom, setFormIntercom] = useState('');
  const [formExtension, setFormExtension] = useState('');
  const [formDirectPhone, setFormDirectPhone] = useState('');
  const [formCategory, setFormCategory] = useState<RoomExtension['category']>('RESIDENTIAL_STANDARD');
  const [formFloor, setFormFloor] = useState<RoomExtension['floor']>('Ground Floor');
  const [formNotes, setFormNotes] = useState('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedExtension(code);
    setTimeout(() => setCopiedExtension(null), 2000);
    onTriggerFeedback('success', `Copied "${code}" to clipboard.`);
  };

  // Distinct Buildings
  const buildingsList = useMemo(() => {
    const set = new Set<string>();
    roomExtensions.forEach((r) => {
      if (r.building) set.add(r.building);
    });
    return Array.from(set).sort();
  }, [roomExtensions]);

  const filteredRooms = useMemo(() => {
    return roomExtensions.filter((r) => {
      const matchesSearch =
        r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.extension.toLowerCase().includes(search.toLowerCase()) ||
        r.intercomCode.toLowerCase().includes(search.toLowerCase()) ||
        r.assignedDepartmentOrWing.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());

      const matchesBuilding = buildingFilter === 'ALL' || r.building === buildingFilter;
      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      return matchesSearch && matchesBuilding && matchesCategory;
    });
  }, [roomExtensions, search, buildingFilter, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingRoomId(null);
    setFormBuilding(buildingsList[0] || 'Building A');
    setFormBlock('Block 1');
    setFormRoomNumber('');
    setFormOccupant('');
    setFormIntercom('');
    setFormExtension('Ext. 4');
    setFormDirectPhone('+966 13 888 0000');
    setFormCategory('RESIDENTIAL_STANDARD');
    setFormFloor('Ground Floor');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: RoomExtension, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRoomId(room.id);
    setFormBuilding(room.building);
    setFormBlock(room.block || 'Block 1');
    setFormRoomNumber(room.roomNumber);
    setFormOccupant(room.assignedDepartmentOrWing);
    setFormIntercom(room.intercomCode);
    setFormExtension(room.extension);
    setFormDirectPhone(room.directDial || '');
    setFormCategory(room.category);
    setFormFloor(room.floor || 'Ground Floor');
    setFormNotes(room.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomNumber.trim() || !formExtension.trim()) return;

    if (editingRoomId) {
      const updated = roomExtensions.map((r) =>
        r.id === editingRoomId
          ? {
              ...r,
              building: formBuilding.trim(),
              block: formBlock.trim(),
              roomNumber: formRoomNumber.trim(),
              assignedDepartmentOrWing: formOccupant.trim() || `Room ${formRoomNumber}`,
              intercomCode: formIntercom.trim() || formRoomNumber.replace(/[^0-9]/g, '').slice(-3) || '101',
              extension: formExtension.trim(),
              directDial: formDirectPhone.trim() || '+966 13 888 0000',
              category: formCategory,
              floor: formFloor,
              notes: formNotes.trim(),
            }
          : r
      );
      onSaveRoomExtensions(updated);
      onTriggerFeedback('success', `Room "${formRoomNumber}" extension updated.`);
    } else {
      const newRoom: RoomExtension = {
        id: `room-${Date.now()}`,
        building: formBuilding.trim(),
        block: formBlock.trim(),
        roomNumber: formRoomNumber.trim(),
        assignedDepartmentOrWing: formOccupant.trim() || `Room ${formRoomNumber}`,
        intercomCode: formIntercom.trim() || formRoomNumber.replace(/[^0-9]/g, '').slice(-3) || '101',
        extension: formExtension.trim(),
        directDial: formDirectPhone.trim() || '+966 13 888 0000',
        category: formCategory,
        floor: formFloor,
        status: 'ACTIVE',
        notes: formNotes.trim(),
      };
      onSaveRoomExtensions([newRoom, ...roomExtensions]);
      onTriggerFeedback('success', `Room "${formRoomNumber}" extension added.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!roomToDelete) return;
    const targetRoom = roomToDelete.roomNumber;
    const updated = roomExtensions.filter((r) => r.id !== roomToDelete.id);
    onSaveRoomExtensions(updated);
    setRoomToDelete(null);
    onTriggerFeedback('info', `Room "${targetRoom}" extension removed.`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Extensions</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{roomExtensions.length}</div>
          <div className="text-[10px] text-teal-600 font-semibold">Active Intercom Connections</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-rose-500 font-bold uppercase tracking-wider">Isolation / Clinic</div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {roomExtensions.filter((r) => r.category === 'ISOLATION_CLINIC').length}
          </div>
          <div className="text-[10px] text-slate-400">Medical Isolation Wing</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">Executive / VIP</div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {roomExtensions.filter((r) => r.category === 'VIP_EXECUTIVE' || r.category === 'RESIDENTIAL_SENIOR').length}
          </div>
          <div className="text-[10px] text-slate-400">Senior Staff Accommodations</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-xs">
          <div className="text-[11px] text-teal-500 font-bold uppercase tracking-wider">Total Buildings</div>
          <div className="text-2xl font-black text-teal-600 font-mono">{buildingsList.length}</div>
          <div className="text-[10px] text-slate-400">Residential &amp; Ops Blocks</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by room #, intercom code, extension, or building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Buildings ({buildingsList.length})</option>
            {buildingsList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Wings</option>
            <option value="RESIDENTIAL_STANDARD">Standard Residential</option>
            <option value="RESIDENTIAL_SENIOR">Senior Staff</option>
            <option value="VIP_EXECUTIVE">VIP / Executive</option>
            <option value="ISOLATION_CLINIC">Isolation / Medical</option>
            <option value="OPERATIONS_OFFICE">Operations Office</option>
            <option value="FACILITY_ROOM">Facility Room</option>
          </select>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Directory</span>
          </button>

          <button
            type="button"
            onClick={onResetRoomExtensions}
            title="Reset Room Extensions to Defaults"
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Room Ext</span>
          </button>
        </div>
      </div>

      {/* Grid of Room Extensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all group"
          >
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono font-black text-xs border border-teal-200 dark:border-teal-800">
                    {room.roomNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{room.building}</span>
                </div>

                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                    room.category === 'ISOLATION_CLINIC'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : room.category === 'VIP_EXECUTIVE'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {room.category.replace('RESIDENTIAL_', '').replace('_', ' ')}
                </span>
              </div>

              {/* Occupant / Assignment */}
              <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                {room.assignedDepartmentOrWing}
              </div>

              {/* Intercom & Extension Badges */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Intercom:</div>
                  <div className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>#{room.intercomCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(room.intercomCode)}
                      className="text-slate-400 hover:text-teal-600 cursor-pointer"
                    >
                      {copiedExtension === room.intercomCode ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40">
                  <div className="text-[9px] uppercase font-bold text-teal-700 dark:text-teal-400">Extension:</div>
                  <div className="font-mono font-black text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between">
                    <span>{room.extension}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(room.extension.replace(/[^0-9]/g, '') || room.extension)}
                      className="text-teal-600 hover:text-teal-800 cursor-pointer"
                    >
                      {copiedExtension === (room.extension.replace(/[^0-9]/g, '') || room.extension) ? (
                        <Check className="w-3 h-3 text-teal-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">{room.floor || 'Ground'}</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(room, e)}
                  title="Edit Room Extension"
                  className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-md cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoomToDelete(room);
                  }}
                  title="Delete Room Extension"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT ROOM EXTENSION
          ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingRoomId ? 'Edit Room Extension' : 'Add New Room Extension'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure building room intercom &amp; extension</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Building Name *</label>
                    <input
                      type="text"
                      required
                      value={formBuilding}
                      onChange={(e) => setFormBuilding(e.target.value)}
                      placeholder="e.g. Building R"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Room Number *</label>
                    <input
                      type="text"
                      required
                      value={formRoomNumber}
                      onChange={(e) => setFormRoomNumber(e.target.value)}
                      placeholder="e.g. R-101 or 204"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Intercom Code (#) *</label>
                    <input
                      type="text"
                      required
                      value={formIntercom}
                      onChange={(e) => setFormIntercom(e.target.value)}
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Extension *</label>
                    <input
                      type="text"
                      required
                      value={formExtension}
                      onChange={(e) => setFormExtension(e.target.value)}
                      placeholder="e.g. Ext. 4101"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Occupant / Designation</label>
                  <input
                    type="text"
                    value={formOccupant}
                    onChange={(e) => setFormOccupant(e.target.value)}
                    placeholder="e.g. Senior Project Manager / Isolation Bed 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category / Wing</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="RESIDENTIAL_STANDARD">Standard Residential</option>
                      <option value="RESIDENTIAL_SENIOR">Senior Staff</option>
                      <option value="VIP_EXECUTIVE">VIP / Executive</option>
                      <option value="ISOLATION_CLINIC">Isolation / Clinic</option>
                      <option value="OPERATIONS_OFFICE">Operations Office</option>
                      <option value="FACILITY_ROOM">Facility Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Floor Level</label>
                    <select
                      value={formFloor}
                      onChange={(e) => setFormFloor(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="First Floor">First Floor</option>
                      <option value="Second Floor">Second Floor</option>
                      <option value="Third Floor">Third Floor</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs shadow-md shadow-teal-600/20 cursor-pointer"
                  >
                    {editingRoomId ? 'Save Changes' : 'Add Room Extension'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE ROOM EXTENSION CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {roomToDelete && (
          <div
            onClick={() => setRoomToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Room Extension?</h3>
                  <p className="text-xs text-slate-500">This will remove this room from the active directory.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  {roomToDelete.roomNumber} ({roomToDelete.building})
                </div>
                <div className="text-slate-500">
                  Intercom #{roomToDelete.intercomCode} • {roomToDelete.extension}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoomToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete Room
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: PRINT DIRECTORY SHEET
          ======================================================== */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div
            onClick={() => setIsPrintModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Official Intercom &amp; Extension Directory Sheet
                    </h3>
                    <p className="text-xs text-slate-500">Tamimi Global Camp Management • Red Sea Global Project</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-slate-900 dark:text-slate-100 print:text-black">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-teal-700 dark:text-teal-400">
                      Red Sea Global Camp Operations
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      Complete Camp Room &amp; Building Extension Guide
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-500">
                    Total: {roomExtensions.length} Rooms Active
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Building</th>
                        <th className="p-3">Room #</th>
                        <th className="p-3">Occupant / Designation</th>
                        <th className="p-3">Intercom #</th>
                        <th className="p-3">Extension</th>
                        <th className="p-3">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {roomExtensions.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-sans font-semibold text-slate-800 dark:text-slate-200">{r.building}</td>
                          <td className="p-3 font-black text-teal-700 dark:text-teal-400">{r.roomNumber}</td>
                          <td className="p-3 font-sans text-slate-700 dark:text-slate-300">{r.assignedDepartmentOrWing}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">#{r.intercomCode}</td>
                          <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{r.extension}</td>
                          <td className="p-3 font-sans text-[10px] font-bold uppercase text-slate-500">{r.category.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

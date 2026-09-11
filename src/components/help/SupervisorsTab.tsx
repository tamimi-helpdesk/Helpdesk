import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Clock,
  MapPin,
  Building,
  Shield,
  Truck,
  Fuel,
  Wrench,
  Sparkles,
  TreePine,
  Check,
  Copy,
  Plus,
  RotateCcw,
  Edit3,
  Trash2,
  X,
  PhoneCall,
  IdCard,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FieldSupervisorContact } from '../../data/departmentDirectory';

interface SupervisorsTabProps {
  supervisors: FieldSupervisorContact[];
  onSaveSupervisors: (updated: FieldSupervisorContact[]) => void;
  onResetSupervisors: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const SupervisorsTab: React.FC<SupervisorsTabProps> = ({
  supervisors,
  onSaveSupervisors,
  onResetSupervisors,
  onTriggerFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupervisorId, setEditingSupervisorId] = useState<string | null>(null);
  const [supervisorToDelete, setSupervisorToDelete] = useState<FieldSupervisorContact | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmpNo, setFormEmpNo] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState<FieldSupervisorContact['department']>('HOUSEKEEPING');
  const [formWorkingArea, setFormWorkingArea] = useState('');
  const [formWorkingCluster, setFormWorkingCluster] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formShift, setFormShift] = useState('Day Shift (06:00 - 18:00)');
  const [formNotes, setFormNotes] = useState('');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    onTriggerFeedback('success', `Copied ${label} "${text}" to clipboard.`);
  };

  const departmentIcons: Record<string, React.ReactNode> = {
    HOUSEKEEPING: <Sparkles className="w-4 h-4 text-emerald-500" />,
    LANDSCAPING: <TreePine className="w-4 h-4 text-lime-500" />,
    EXTERNAL: <Building className="w-4 h-4 text-amber-500" />,
    TRANSPORT: <Truck className="w-4 h-4 text-blue-500" />,
    FLEET: <Truck className="w-4 h-4 text-indigo-500" />,
    SECURITY: <Shield className="w-4 h-4 text-rose-500" />,
    PPE_SUPPLY: <Shield className="w-4 h-4 text-amber-600" />,
    FUEL_STATION: <Fuel className="w-4 h-4 text-orange-500" />,
    MECHANIC: <Wrench className="w-4 h-4 text-purple-500" />,
  };

  const departmentBadgeColors: Record<string, string> = {
    HOUSEKEEPING: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    LANDSCAPING: 'bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300 border-lime-200 dark:border-lime-800',
    EXTERNAL: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    TRANSPORT: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    FLEET: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    SECURITY: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    PPE_SUPPLY: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    FUEL_STATION: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    MECHANIC: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };

  const filtered = useMemo(() => {
    return supervisors.filter((sup) => {
      const q = search.toLowerCase();
      const matchesSearch =
        sup.name.toLowerCase().includes(q) ||
        sup.position.toLowerCase().includes(q) ||
        sup.workingArea.toLowerCase().includes(q) ||
        sup.workingCluster.toLowerCase().includes(q) ||
        sup.mobile.includes(q) ||
        (sup.empNo && sup.empNo.includes(q)) ||
        (sup.notes && sup.notes.toLowerCase().includes(q));

      const matchesDept = departmentFilter === 'ALL' || sup.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [supervisors, search, departmentFilter]);

  const handleOpenAdd = () => {
    setEditingSupervisorId(null);
    setFormName('');
    setFormEmpNo('');
    setFormPosition('Field Supervisor');
    setFormDepartment('HOUSEKEEPING');
    setFormWorkingArea('Cluster Buildings');
    setFormWorkingCluster('Cluster H');
    setFormMobile('05');
    setFormEmail('');
    setFormShift('Day Shift (06:00 AM - 06:00 PM)');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: FieldSupervisorContact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSupervisorId(sup.id);
    setFormName(sup.name || '');
    setFormEmpNo(sup.empNo || '');
    setFormPosition(sup.position || '');
    setFormDepartment(sup.department || 'HOUSEKEEPING');
    setFormWorkingArea(sup.workingArea || '');
    setFormWorkingCluster(sup.workingCluster || '');
    setFormMobile(sup.mobile || '');
    setFormEmail(sup.email || '');
    setFormShift(sup.shiftOrTimings || 'Day Shift (06:00 AM - 06:00 PM)');
    setFormNotes(sup.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim()) {
      onTriggerFeedback('info', 'Please provide at least a Name and Mobile Number.');
      return;
    }

    if (editingSupervisorId) {
      const updated = supervisors.map((s) =>
        s.id === editingSupervisorId
          ? {
              ...s,
              name: formName.trim(),
              empNo: formEmpNo.trim() || undefined,
              position: formPosition.trim(),
              department: formDepartment,
              workingArea: formWorkingArea.trim(),
              workingCluster: formWorkingCluster.trim(),
              mobile: formMobile.trim(),
              email: formEmail.trim() || undefined,
              shiftOrTimings: formShift.trim() || undefined,
              notes: formNotes.trim() || undefined,
            }
          : s
      );
      onSaveSupervisors(updated);
      onTriggerFeedback('success', `Supervisor "${formName}" updated successfully.`);
    } else {
      const newSup: FieldSupervisorContact = {
        id: `sup-${Date.now()}`,
        name: formName.trim(),
        empNo: formEmpNo.trim() || undefined,
        position: formPosition.trim(),
        department: formDepartment,
        workingArea: formWorkingArea.trim(),
        workingCluster: formWorkingCluster.trim(),
        mobile: formMobile.trim(),
        email: formEmail.trim() || undefined,
        shiftOrTimings: formShift.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };
      onSaveSupervisors([...supervisors, newSup]);
      onTriggerFeedback('success', `New supervisor "${formName}" added successfully.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!supervisorToDelete) return;
    const name = supervisorToDelete.name;
    const updated = supervisors.filter((s) => s.id !== supervisorToDelete.id);
    onSaveSupervisors(updated);
    setSupervisorToDelete(null);
    onTriggerFeedback('info', `Supervisor "${name}" removed from directory.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Field Supervisors &amp; Operations Team
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {supervisors.length} Total Staff
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Direct mobile contacts and cluster assignments for Fuel Station, Fleet, PPE, Housekeeping, External Grounds, Transport &amp; Maintenance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetSupervisors}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Reset to official standard list"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supervisor</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, EMP number, cluster, working area, position or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">All Departments ({supervisors.length})</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="LANDSCAPING">Landscaping</option>
              <option value="EXTERNAL">External Grounds</option>
              <option value="TRANSPORT">Transport</option>
              <option value="FLEET">Fleet Team</option>
              <option value="SECURITY">Security</option>
              <option value="PPE_SUPPLY">PPE Supplies</option>
              <option value="FUEL_STATION">Fuel Station</option>
              <option value="MECHANIC">Mechanic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supervisors Grid Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            No supervisors match your search
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or department filter, or add a new supervisor.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Staff / Supervisor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup) => (
            <motion.div
              key={sup.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              <div className="space-y-3.5">
                {/* Top Badge Strip & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        departmentBadgeColors[sup.department] || 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {departmentIcons[sup.department] || <Building className="w-3.5 h-3.5" />}
                      <span>{sup.department.replace('_', ' ')}</span>
                    </span>

                    {sup.empNo && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-bold">
                        EMP: {sup.empNo}
                      </span>
                    )}
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(sup, e)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-lg transition cursor-pointer"
                      title="Edit Supervisor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSupervisorToDelete(sup);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                      title="Delete Supervisor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Name and Position */}
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {sup.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {sup.position}
                  </p>
                </div>

                {/* Assignment & Location Details */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mr-1.5" />
                    <span className="font-semibold text-slate-400 mr-1">Cluster:</span>
                    <span className="font-bold text-sky-700 dark:text-sky-400">{sup.workingCluster}</span>
                  </div>

                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                    <span className="font-semibold text-slate-400 mr-1">Area:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{sup.workingArea}</span>
                  </div>

                  {sup.shiftOrTimings && (
                    <div className="flex items-center text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-1.5" />
                      <span className="font-semibold text-slate-400 mr-1">Shift:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{sup.shiftOrTimings}</span>
                    </div>
                  )}

                  {sup.notes && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      "{sup.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Footer Strip */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={`tel:${sup.mobile.split('/')[0].trim()}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">{sup.mobile}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(sup.mobile, 'Mobile Number')}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
                  title="Copy Phone Number"
                >
                  {copiedId === sup.mobile ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ==========================================
          ADD / EDIT SUPERVISOR MODAL
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
                  <div className="p-2.5 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-2xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {editingSupervisorId ? 'Edit Supervisor / Staff' : 'Add Field Supervisor'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update personnel directory details and cluster assignments
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
                  {/* Full Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Supervisor / Staff Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Irene Caballero"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* EMP No */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Employee Number (EMP No.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 504077"
                      value={formEmpNo}
                      onChange={(e) => setFormEmpNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Position / Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Housekeeping Field Supervisor"
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value as FieldSupervisorContact['department'])}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    >
                      <option value="HOUSEKEEPING">Housekeeping</option>
                      <option value="LANDSCAPING">Landscaping</option>
                      <option value="EXTERNAL">External Grounds</option>
                      <option value="TRANSPORT">Transport</option>
                      <option value="FLEET">Fleet Team</option>
                      <option value="SECURITY">Security</option>
                      <option value="PPE_SUPPLY">PPE Supply In-Charge</option>
                      <option value="FUEL_STATION">Fuel Station</option>
                      <option value="MECHANIC">Mechanic / Maintenance</option>
                    </select>
                  </div>

                  {/* Working Cluster */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Assigned Cluster <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cluster H (or Fleet Hub)"
                      value={formWorkingCluster}
                      onChange={(e) => setFormWorkingCluster(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Working Area */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Working Area / Buildings Covered
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Buildings 01 to 14, Ground & First Floor"
                      value={formWorkingArea}
                      onChange={(e) => setFormWorkingArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0551234567"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. supervisor@tamimi-global.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Shift / Timings */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Operating Shift / Timings
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sat-Thu: 06:00 AM - 06:00 PM"
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Operational Notes &amp; Scope
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. First contact for room key replacements and linen requests in Cluster H."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
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
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                  >
                    {editingSupervisorId ? 'Save Changes' : 'Add Supervisor'}
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
        {supervisorToDelete && (
          <div
            onClick={() => setSupervisorToDelete(null)}
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
                    Delete Field Supervisor?
                  </h3>
                  <p className="text-xs text-slate-500">This action will remove the record</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  {supervisorToDelete.name}
                </div>
                <div className="text-slate-500">
                  {supervisorToDelete.position} • {supervisorToDelete.workingCluster}
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  Mobile: {supervisorToDelete.mobile}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to remove this supervisor? You can restore the default team list anytime using the "Reset Defaults" button.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSupervisorToDelete(null)}
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

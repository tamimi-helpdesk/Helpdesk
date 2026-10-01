import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  Sliders,
  Plus,
  RotateCcw,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  Copy,
  X,
  PhoneCall,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DepartmentContact } from './types';

interface DirectoryTabProps {
  departments: DepartmentContact[];
  onSaveDepartments: (updated: DepartmentContact[]) => void;
  onResetDepartments: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({
  departments,
  onSaveDepartments,
  onResetDepartments,
  onTriggerFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedExtension, setCopiedExtension] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<DepartmentContact | null>(null);

  // Form fields
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptRole, setDeptRole] = useState('');
  const [deptCategory, setDeptCategory] = useState<DepartmentContact['category']>('OPERATIONS');
  const [deptPriority, setDeptPriority] = useState<DepartmentContact['priorityLevel']>('ESSENTIAL');
  const [deptExtension, setDeptExtension] = useState('');
  const [deptPhone, setDeptPhone] = useState('');
  const [deptEmail, setDeptEmail] = useState('');
  const [deptLocation, setDeptLocation] = useState('');
  const [deptHours, setDeptHours] = useState('07:00 - 19:00 Daily');
  const [deptIs24x7, setDeptIs24x7] = useState(false);
  const [deptServicesInput, setDeptServicesInput] = useState('');

  const handleCopyPhone = (ext: string) => {
    navigator.clipboard.writeText(ext);
    setCopiedExtension(ext);
    setTimeout(() => setCopiedExtension(null), 2000);
    onTriggerFeedback('success', `Copied "${ext}" to clipboard.`);
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        d.departmentName.toLowerCase().includes(search.toLowerCase()) ||
        d.headOfficer.toLowerCase().includes(search.toLowerCase()) ||
        d.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
        d.extension.toLowerCase().includes(search.toLowerCase()) ||
        d.directPhone.includes(search) ||
        d.services.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [departments, search, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingDeptId(null);
    setDeptName('');
    setDeptHead('');
    setDeptRole('');
    setDeptCategory('OPERATIONS');
    setDeptPriority('ESSENTIAL');
    setDeptExtension('Ext. 44');
    setDeptPhone('055 ');
    setDeptEmail('admin.camp@tamimi-global.com');
    setDeptLocation('Main Camp Administration Block');
    setDeptHours('07:00 - 19:00 Daily');
    setDeptIs24x7(false);
    setDeptServicesInput('General inquiries\nService requests');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentContact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingDeptId(dept.id);
    setDeptName(dept.departmentName);
    setDeptHead(dept.headOfficer);
    setDeptRole(dept.roleTitle);
    setDeptCategory(dept.category);
    setDeptPriority(dept.priorityLevel);
    setDeptExtension(dept.extension);
    setDeptPhone(dept.directPhone);
    setDeptEmail(dept.email);
    setDeptLocation(dept.location);
    setDeptHours(dept.workingHours);
    setDeptIs24x7(dept.is24x7);
    setDeptServicesInput(dept.services ? dept.services.join('\n') : '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    const services = deptServicesInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (editingDeptId) {
      const updated = departments.map((d) =>
        d.id === editingDeptId
          ? {
              ...d,
              departmentName: deptName.trim(),
              headOfficer: deptHead.trim() || 'Camp Administration',
              roleTitle: deptRole.trim() || d.roleTitle,
              category: deptCategory,
              priorityLevel: deptPriority,
              extension: deptExtension.trim(),
              directPhone: deptPhone.trim(),
              email: deptEmail.trim(),
              location: deptLocation.trim(),
              workingHours: deptHours.trim(),
              is24x7: deptIs24x7,
              services: services.length > 0 ? services : ['General Department Services'],
            }
          : d
      );
      onSaveDepartments(updated);
      onTriggerFeedback('success', `Department "${deptName}" updated.`);
    } else {
      const newDept: DepartmentContact = {
        id: `dept-${Date.now()}`,
        departmentName: deptName.trim(),
        headOfficer: deptHead.trim() || 'Camp Administration',
        roleTitle: deptRole.trim() || 'Officer in Charge',
        category: deptCategory,
        priorityLevel: deptPriority,
        extension: deptExtension.trim() || 'Ext. 4400',
        directPhone: deptPhone.trim() || '055 000 0000',
        email: deptEmail.trim() || 'admin.camp@tamimi-global.com',
        location: deptLocation.trim() || 'Main Camp Administration Block',
        workingHours: deptHours.trim() || '07:00 - 19:00 Daily',
        is24x7: deptIs24x7,
        services: services.length > 0 ? services : ['General Department Inquiries'],
      };
      onSaveDepartments([newDept, ...departments]);
      onTriggerFeedback('success', `Department "${deptName}" created.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deptToDelete) return;
    const targetTitle = deptToDelete.departmentName;
    const updated = departments.filter((d) => d.id !== deptToDelete.id);
    onSaveDepartments(updated);
    setDeptToDelete(null);
    onTriggerFeedback('info', `Department "${targetTitle}" removed.`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by department, officer, role, extension, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition"
          />
        </div>

        {/* Category Filters & Add Button */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Categories ({departments.length})</option>
            <option value="OPERATIONS">Operations</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="SECURITY_HSE">Security &amp; HSE</option>
            <option value="MEDICAL">Medical &amp; Clinic</option>
            <option value="CATERING_LODGING">Catering &amp; Lodging</option>
            <option value="ADMIN_HR">Admin &amp; HR</option>
            <option value="IT_LOGISTICS">IT &amp; Logistics</option>
            <option value="RECREATION_FACILITIES">Sports &amp; Recreation</option>
          </select>

          <button
            type="button"
            onClick={onResetDepartments}
            title="Reset to Defaults"
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
            <span>+ Add Department</span>
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-teal-500/50 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all group"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {dept.category.replace('_', ' ')}
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-white text-base mt-1.5 leading-snug group-hover:text-teal-600 transition-colors">
                    {dept.departmentName}
                  </h4>
                </div>

                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    dept.priorityLevel === 'EMERGENCY'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : dept.is24x7
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {dept.is24x7 ? '24/7 ACTIVE' : dept.priorityLevel}
                </span>
              </div>

              {/* Head Officer & Role */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{dept.headOfficer}</div>
                <div className="text-slate-500 text-[11px]">{dept.roleTitle}</div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-1 pt-1">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{dept.location}</span>
                </div>
              </div>

              {/* Contact numbers */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40">
                  <span className="font-bold text-teal-800 dark:text-teal-300 font-mono">{dept.extension}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(dept.extension.replace(/[^0-9]/g, '') || dept.extension)}
                    className="p-1 rounded-md bg-teal-200/60 text-teal-800 hover:bg-teal-200 cursor-pointer"
                  >
                    {copiedExtension === (dept.extension.replace(/[^0-9]/g, '') || dept.extension) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-mono">
                  <span>Direct: {dept.directPhone}</span>
                  <span>{dept.workingHours}</span>
                </div>
              </div>

              {/* Services tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {dept.services?.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer with Edit and Delete actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">{dept.email}</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(dept, e)}
                  title="Edit Department"
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeptToDelete(dept);
                  }}
                  title="Delete Department"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT DEPARTMENT
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
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingDeptId ? 'Edit Department Contact' : 'Add New Department'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure management directory listing</p>
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department Name *</label>
                    <input
                      type="text"
                      required
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="e.g. Facilities Management"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={deptCategory}
                      onChange={(e) => setDeptCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="OPERATIONS">Operations</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="SECURITY_HSE">Security &amp; HSE</option>
                      <option value="MEDICAL">Medical &amp; Clinic</option>
                      <option value="CATERING_LODGING">Catering &amp; Lodging</option>
                      <option value="ADMIN_HR">Admin &amp; HR</option>
                      <option value="IT_LOGISTICS">IT &amp; Logistics</option>
                      <option value="RECREATION_FACILITIES">Sports &amp; Recreation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Head / Duty Officer</label>
                    <input
                      type="text"
                      value={deptHead}
                      onChange={(e) => setDeptHead(e.target.value)}
                      placeholder="e.g. Eng. Tariq Al-Mansoor"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role Title</label>
                    <input
                      type="text"
                      value={deptRole}
                      onChange={(e) => setDeptRole(e.target.value)}
                      placeholder="e.g. Operations Manager"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Extension Number *</label>
                    <input
                      type="text"
                      required
                      value={deptExtension}
                      onChange={(e) => setDeptExtension(e.target.value)}
                      placeholder="e.g. Ext. 4455"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct Phone</label>
                    <input
                      type="text"
                      value={deptPhone}
                      onChange={(e) => setDeptPhone(e.target.value)}
                      placeholder="e.g. 055 881 1223"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                    <input
                      type="email"
                      value={deptEmail}
                      onChange={(e) => setDeptEmail(e.target.value)}
                      placeholder="e.g. fm.camp@tamimi-global.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Office Location</label>
                    <input
                      type="text"
                      value={deptLocation}
                      onChange={(e) => setDeptLocation(e.target.value)}
                      placeholder="e.g. Admin Block - Office 12"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Working Hours</label>
                    <input
                      type="text"
                      value={deptHours}
                      onChange={(e) => setDeptHours(e.target.value)}
                      placeholder="e.g. 07:00 - 19:00 Daily"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div className="flex items-center pt-5 space-x-2">
                    <input
                      type="checkbox"
                      id="deptIs24x7"
                      checked={deptIs24x7}
                      onChange={(e) => setDeptIs24x7(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <label htmlFor="deptIs24x7" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      24/7 Round the Clock
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Services Handled (One per line)</label>
                  <textarea
                    rows={3}
                    value={deptServicesInput}
                    onChange={(e) => setDeptServicesInput(e.target.value)}
                    placeholder="General repairs&#10;Key replacement&#10;Emergency dispatch"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
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
                    {editingDeptId ? 'Save Changes' : 'Create Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE DEPARTMENT CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {deptToDelete && (
          <div
            onClick={() => setDeptToDelete(null)}
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
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Department?</h3>
                  <p className="text-xs text-slate-500">This will remove this department from the active directory.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{deptToDelete.departmentName}</div>
                <div className="text-slate-500">{deptToDelete.headOfficer} • {deptToDelete.extension}</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete Department
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

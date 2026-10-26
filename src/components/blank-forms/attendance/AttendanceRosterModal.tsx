import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Users,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  Clock,
  PenTool,
  Search,
  UserCheck,
  Check,
  Palette,
  Type,
} from 'lucide-react';
import {
  AttendanceSheetConfig,
  AttendanceStaffMember,
  VacationStaffMember,
  DEFAULT_ATTENDANCE_CONFIG,
  DEFAULT_THEME,
  COLOR_THEME_PRESETS,
  TITLE_PRESETS,
  DEPARTMENT_PRESETS,
  SHIFT_PRESETS,
} from './attendanceTypes';
import { BlankFromService } from '../../../services/blankFromService';
import { BlankFromRow } from '../../../data/initialBlankFromData';

interface AttendanceRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AttendanceSheetConfig;
  onSaveConfig: (newConfig: AttendanceSheetConfig) => void;
}

export const AttendanceRosterModal: React.FC<AttendanceRosterModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<AttendanceSheetConfig>(() => ({
    ...config,
    formTitle: config.formTitle || 'STRAIGHT DAILY ATTENDANCE SHEET',
    extraBlankRows: config.extraBlankRows ?? 0,
    theme: config.theme || DEFAULT_THEME,
    staffList: [...config.staffList],
    vacationList: [...config.vacationList],
  }));

  const [isDirPickerOpen, setIsDirPickerOpen] = useState(false);
  const [dirPickerTarget, setDirPickerTarget] = useState<'STAFF' | 'VACATION'>('STAFF');
  const [dirSearchQuery, setDirSearchQuery] = useState('');

  // Cached directory rows
  const directoryRows = useMemo(() => {
    return BlankFromService.getRows();
  }, []);

  // Filtered directory results
  const filteredDirectory = useMemo(() => {
    const q = dirSearchQuery.toLowerCase().trim();
    if (!q) return directoryRows.slice(0, 15);
    return directoryRows
      .filter((r) => {
        return (
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.employmentId && r.employmentId.toLowerCase().includes(q)) ||
          (r.designation && r.designation.toLowerCase().includes(q)) ||
          (r.department && r.department.toLowerCase().includes(q))
        );
      })
      .slice(0, 25);
  }, [directoryRows, dirSearchQuery]);

  if (!isOpen) return null;

  // Handle staff row change
  const handleStaffChange = (
    index: number,
    field: keyof AttendanceStaffMember,
    val: any
  ) => {
    const updated = [...formData.staffList];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, staffList: updated });
  };

  const handleAddStaff = () => {
    const nextSNo = formData.staffList.length + 1;
    setFormData({
      ...formData,
      staffList: [
        ...formData.staffList,
        {
          sNo: nextSNo,
          name: '',
          idNo: '',
          jobTitle: 'RECEPTIONIST',
        },
      ],
    });
  };

  const handleRemoveStaff = (index: number) => {
    const updated = formData.staffList
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, sNo: idx + 1 }));
    setFormData({ ...formData, staffList: updated });
  };

  // Handle vacation staff change
  const handleVacationChange = (
    index: number,
    field: keyof VacationStaffMember,
    val: any
  ) => {
    const updated = [...formData.vacationList];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, vacationList: updated });
  };

  const handleAddVacation = () => {
    setFormData({
      ...formData,
      vacationList: [
        ...formData.vacationList,
        {
          name: '',
          idNo: '',
          jobTitle: 'RECEPTIONIST',
        },
      ],
    });
  };

  const handleRemoveVacation = (index: number) => {
    const updated = formData.vacationList.filter((_, i) => i !== index);
    setFormData({ ...formData, vacationList: updated });
  };

  // Import selected employee from directory
  const handleSelectFromDirectory = (row: BlankFromRow) => {
    const empName = (row.name || 'STAFF MEMBER').toUpperCase();
    const empId = row.employmentId || row.idIqama || 'N/A';
    const empJob = (row.designation || row.department || 'RECEPTIONIST').toUpperCase();

    if (dirPickerTarget === 'STAFF') {
      const nextSNo = formData.staffList.length + 1;
      setFormData({
        ...formData,
        staffList: [
          ...formData.staffList,
          {
            sNo: nextSNo,
            name: empName,
            idNo: empId,
            jobTitle: empJob,
          },
        ],
      });
    } else {
      setFormData({
        ...formData,
        vacationList: [
          ...formData.vacationList,
          {
            name: empName,
            idNo: empId,
            jobTitle: empJob,
          },
        ],
      });
    }
    setIsDirPickerOpen(false);
    setDirSearchQuery('');
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Reset staff roster, sheet title and color theme back to default corporate template?'
      )
    ) {
      setFormData({
        ...DEFAULT_ATTENDANCE_CONFIG,
        staffList: [...DEFAULT_ATTENDANCE_CONFIG.staffList],
        vacationList: [...DEFAULT_ATTENDANCE_CONFIG.vacationList],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Customize Attendance Sheet &amp; Roster
              </h2>
              <p className="text-xs text-slate-500">
                Edit sheet title, colors, company headers, duty roster, and vacation staff
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scrollable Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Section 1: Sheet Title & Header Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-600" />
              <span>Sheet Title &amp; Document Headings</span>
            </h3>

            {/* Editable Form Title (STRAIGHT DAILY ATTENDANCE SHEET) */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Attendance Sheet Title (Form Heading)</span>
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData({ ...formData, formTitle: e.target.value });
                    }
                  }}
                  value=""
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded cursor-pointer border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="">Choose Title Preset...</option>
                  {TITLE_PRESETS.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={formData.formTitle}
                onChange={(e) =>
                  setFormData({ ...formData, formTitle: e.target.value.toUpperCase() })
                }
                placeholder="e.g. STRAIGHT DAILY ATTENDANCE SHEET"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-black text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 tracking-wide"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {TITLE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, formTitle: p })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                      formData.formTitle === p
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Department Name
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, department: e.target.value });
                      }
                    }}
                    value=""
                    className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1 py-0.5 rounded cursor-pointer"
                  >
                    <option value="">Choose preset...</option>
                    {DEPARTMENT_PRESETS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. HELPDESK/ACCOMODATION"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Location
                </label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) =>
                    setFormData({ ...formData, locationName: e.target.value })
                  }
                  placeholder="e.g. AMAALA-Triple Bay Construction Village (Location #188)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="e.g. TAMIMI GLOBAL COMPANY LTD.(TAFGA)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Extra Blank Rows for Handwriting
                </label>
                <select
                  value={formData.extraBlankRows ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extraBlankRows: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>0 Blank Rows (Fit roster perfectly to page)</option>
                  <option value={1}>1 Blank Row</option>
                  <option value={2}>2 Blank Rows</option>
                  <option value={3}>3 Blank Rows</option>
                  <option value={4}>4 Blank Rows</option>
                  <option value={5}>5 Blank Rows</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Signature Title
                </label>
                <input
                  type="text"
                  value={formData.supervisorTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisorTitle: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SUPERVISOR"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  H.O.D Signature Title
                </label>
                <input
                  type="text"
                  value={formData.hodTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, hodTitle: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. H.O.D"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sheet Color Customization & Styling */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>Sheet Color Themes &amp; Custom Palette</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                Apply color styles to headers, department banner &amp; borders
              </span>
            </div>

            {/* Quick Preset Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLOR_THEME_PRESETS.map((preset) => {
                const currentHeaderBg = formData.theme?.headerBg || DEFAULT_THEME.headerBg;
                const isSelected = currentHeaderBg.toLowerCase() === preset.headerBg.toLowerCase();

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        theme: {
                          headerBg: preset.headerBg,
                          headerTextColor: preset.headerTextColor,
                          borderColor: preset.borderColor,
                          titleColor: preset.titleColor,
                          subHeaderBg: preset.subHeaderBg,
                        },
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shadow-2xs shrink-0"
                        style={{ backgroundColor: preset.headerBg }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shadow-2xs shrink-0"
                        style={{ backgroundColor: preset.subHeaderBg }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shadow-2xs shrink-0"
                        style={{ backgroundColor: preset.borderColor }}
                      />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto" />
                      )}
                    </div>
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Individual Color Pickers */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                Custom Color Pickers (Click swatch to select any color):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Table Header Color */}
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      Table Header Bg
                    </div>
                    <div className="text-[10px] text-slate-400">Header rows</div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="color"
                      value={formData.theme?.headerBg || '#707070'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          theme: {
                            ...(formData.theme || DEFAULT_THEME),
                            headerBg: e.target.value,
                          },
                        })
                      }
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[10px] text-slate-500">
                      {formData.theme?.headerBg || '#707070'}
                    </span>
                  </div>
                </div>

                {/* Subheader / Department Bar */}
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      Dept &amp; Date Bar
                    </div>
                    <div className="text-[10px] text-slate-400">Banner strip</div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="color"
                      value={formData.theme?.subHeaderBg || '#707070'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          theme: {
                            ...(formData.theme || DEFAULT_THEME),
                            subHeaderBg: e.target.value,
                          },
                        })
                      }
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[10px] text-slate-500">
                      {formData.theme?.subHeaderBg || '#707070'}
                    </span>
                  </div>
                </div>

                {/* Sheet & Table Borders */}
                <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      Borders &amp; Grid
                    </div>
                    <div className="text-[10px] text-slate-400">Lines &amp; frames</div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="color"
                      value={formData.theme?.borderColor || '#000000'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          theme: {
                            ...(formData.theme || DEFAULT_THEME),
                            borderColor: e.target.value,
                          },
                        })
                      }
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[10px] text-slate-500">
                      {formData.theme?.borderColor || '#000000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Active Duty Staff List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Duty Staff List ({formData.staffList.length} members)</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDirPickerTarget('STAFF');
                    setIsDirPickerOpen(true);
                  }}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer hover:bg-blue-100"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Import from Directory</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer hover:bg-emerald-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Manual</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2 w-12 text-center">S.No</th>
                    <th className="p-2">Employee Full Name</th>
                    <th className="p-2 w-28">ID Number</th>
                    <th className="p-2">Job Title</th>
                    <th className="p-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {formData.staffList.map((st, idx) => (
                    <tr key={`staff-edit-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) =>
                            handleStaffChange(idx, 'name', e.target.value.toUpperCase())
                          }
                          placeholder="e.g. HASSAN ABBAS"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold uppercase text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={st.idNo}
                          onChange={(e) =>
                            handleStaffChange(idx, 'idNo', e.target.value)
                          }
                          placeholder="e.g. 420938"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-semibold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={st.jobTitle}
                          onChange={(e) =>
                            handleStaffChange(idx, 'jobTitle', e.target.value.toUpperCase())
                          }
                          placeholder="e.g. RECEPTIONIST"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold uppercase text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remove employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Vacation Staff List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Employee on Vacation ({formData.vacationList.length})</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDirPickerTarget('VACATION');
                    setIsDirPickerOpen(true);
                  }}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer hover:bg-blue-100"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Import from Directory</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddVacation}
                  className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer hover:bg-amber-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vacation Employee</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2">Employee Full Name</th>
                    <th className="p-2 w-28">ID Number</th>
                    <th className="p-2">Job Title</th>
                    <th className="p-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {formData.vacationList.map((vac, idx) => (
                    <tr key={`vac-edit-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={vac.name}
                          onChange={(e) =>
                            handleVacationChange(idx, 'name', e.target.value.toUpperCase())
                          }
                          placeholder="e.g. KASUN DHANUSHKA"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold uppercase text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={vac.idNo}
                          onChange={(e) =>
                            handleVacationChange(idx, 'idNo', e.target.value)
                          }
                          placeholder="e.g. 903961"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-semibold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={vac.jobTitle}
                          onChange={(e) =>
                            handleVacationChange(idx, 'jobTitle', e.target.value.toUpperCase())
                          }
                          placeholder="e.g. RECEPTIONIST"
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold uppercase text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVacation(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remove vacation employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.vacationList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-400 italic">
                        No employees currently on vacation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Roster</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Directory Staff Picker Sub-modal */}
      {isDirPickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-4 space-y-3 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Pick Staff from Camp Directory
                </h4>
                <span className="text-[11px] text-slate-500">
                  Target: {dirPickerTarget === 'STAFF' ? 'Duty Staff List' : 'Vacation List'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDirPickerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={dirSearchQuery}
                onChange={(e) => setDirSearchQuery(e.target.value)}
                placeholder="Search name, ID, designation, department..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {filteredDirectory.map((emp, i) => (
                <div
                  key={`dir-pick-${emp.id || i}`}
                  onClick={() => handleSelectFromDirectory(emp)}
                  className="p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {emp.name || 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                      <span>ID: {emp.employmentId || 'N/A'}</span>
                      <span>•</span>
                      <span>{emp.designation || emp.department || 'Operations'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    + Select
                  </span>
                </div>
              ))}
              {filteredDirectory.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching employees found in directory.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

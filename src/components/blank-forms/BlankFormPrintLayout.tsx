import React from 'react';
import {
  FormTemplateDefinition,
  AttendanceRow,
  MaterialItemRow,
  ClearanceDeptCheck,
  GatePassMaterialRow,
} from '../../types/blankForms';
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  FileCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { TamimiLogo } from '../TamimiLogo';
import { OfficialStampBadge } from './OfficialStampBadge';
import { AuthenticFormRenderer } from './authentic/AuthenticFormRenderer';

interface BlankFormPrintLayoutProps {
  template: FormTemplateDefinition;
  formData: Record<string, any>;
  attendanceRows?: AttendanceRow[];
  materialRows?: MaterialItemRow[];
  clearanceRows?: ClearanceDeptCheck[];
  gatePassRows?: GatePassMaterialRow[];
  customRows?: Record<string, any>[];
  docRefNumber?: string;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const BlankFormPrintLayout: React.FC<BlankFormPrintLayoutProps> = ({
  template,
  formData,
  attendanceRows = [],
  materialRows = [],
  clearanceRows = [],
  gatePassRows = [],
  customRows = [],
  docRefNumber,
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  // If template is one of the 13 authentic company forms from photos, render exact authentic replica
  if (template.id.startsWith('TAFGA-FRM-')) {
    return (
      <div className="w-full">
        <AuthenticFormRenderer
          template={template}
          formData={formData}
          isBlankMode={isBlankMode}
          isEditable={isEditable}
          onFieldChange={onFieldChange}
          onTableChange={onTableChange}
        />
      </div>
    );
  }

  const effectiveRef =
    docRefNumber ||
    formData.docRef ||
    `${template.docRefPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const printDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isLandscape =
    template.orientation === 'landscape' ||
    template.id === 'TAFGA-FRM-03-GOLF-CHK' ||
    template.id === 'TAFGA-FRM-04-KEY-MON' ||
    template.id === 'TAFGA-FRM-07-PARCEL-LOG' ||
    template.id === 'TAFGA-FRM-13-LINEN-PICK' ||
    template.id === 'attendance-sheet' ||
    template.id === 'vehicle-inspection' ||
    template.id === 'catering-hygiene';

  // -------------------------------------------------------------
  // Dynamic Row Handlers
  // -------------------------------------------------------------
  const handleAddAttendanceRow = () => {
    const newRow: AttendanceRow = {
      id: `att-${Date.now()}`,
      sl: attendanceRows.length + 1,
      empName: '',
      badgeId: '',
      designation: '',
      shift: formData.shift?.split(' ')[0] || 'Morning',
      timeIn: '06:00',
      timeOut: '14:00',
      status: 'PRESENT',
      otHours: 0,
      signature: '',
    };
    onTableChange?.('attendanceRows', [...attendanceRows, newRow]);
  };

  const handleUpdateAttendanceRow = (index: number, field: keyof AttendanceRow, value: any) => {
    const updated = [...attendanceRows];
    updated[index] = { ...updated[index], [field]: value };
    onTableChange?.('attendanceRows', updated);
  };

  const handleDeleteAttendanceRow = (index: number) => {
    const updated = attendanceRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sl: i + 1 }));
    onTableChange?.('attendanceRows', updated);
  };

  const handleAddMaterialRow = () => {
    const newRow: MaterialItemRow = {
      id: `mat-${Date.now()}`,
      sl: materialRows.length + 1,
      itemCode: '',
      description: '',
      unit: 'Pcs',
      qtyRequested: 1,
      qtyIssued: 1,
      unitPrice: 0,
      purpose: '',
      remarks: '',
    };
    onTableChange?.('materialRows', [...materialRows, newRow]);
  };

  const handleUpdateMaterialRow = (index: number, field: keyof MaterialItemRow, value: any) => {
    const updated = [...materialRows];
    updated[index] = { ...updated[index], [field]: value };
    onTableChange?.('materialRows', updated);
  };

  const handleDeleteMaterialRow = (index: number) => {
    const updated = materialRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sl: i + 1 }));
    onTableChange?.('materialRows', updated);
  };

  const handleAddGatePassRow = () => {
    const newRow: GatePassMaterialRow = {
      id: `gp-${Date.now()}`,
      sl: gatePassRows.length + 1,
      description: '',
      serialNo: '',
      qty: 1,
      unit: 'Pcs',
      purpose: '',
      returnable: false,
      expectedReturnDate: '',
    };
    onTableChange?.('gatePassRows', [...gatePassRows, newRow]);
  };

  const handleUpdateGatePassRow = (index: number, field: keyof GatePassMaterialRow, value: any) => {
    const updated = [...gatePassRows];
    updated[index] = { ...updated[index], [field]: value };
    onTableChange?.('gatePassRows', updated);
  };

  const handleDeleteGatePassRow = (index: number) => {
    const updated = gatePassRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sl: i + 1 }));
    onTableChange?.('gatePassRows', updated);
  };

  const handleUpdateClearanceRow = (index: number, field: keyof ClearanceDeptCheck, value: any) => {
    const updated = [...clearanceRows];
    updated[index] = { ...updated[index], [field]: value };
    onTableChange?.('clearanceRows', updated);
  };

  const handleAddCustomRow = () => {
    const columns = template.customTable?.columns || [];
    const newRow: Record<string, any> = { id: `row-${Date.now()}` };
    columns.forEach((col, idx) => {
      newRow[col.key] = idx === 0 ? String(customRows.length + 1) : '';
    });
    onTableChange?.('customRows', [...customRows, newRow]);
  };

  const handleUpdateCustomRow = (index: number, key: string, value: any) => {
    const updated = [...customRows];
    updated[index] = { ...updated[index], [key]: value };
    onTableChange?.('customRows', updated);
  };

  const handleDeleteCustomRow = (index: number) => {
    const updated = customRows.filter((_, i) => i !== index);
    onTableChange?.('customRows', updated);
  };

  // Blank Placeholders for 100% Blank Printing
  const blankAttendance = Array.from({ length: 12 }, (_, i) => ({
    id: `blank-att-${i}`,
    sl: i + 1,
    empName: '',
    badgeId: '',
    designation: '',
    shift: '',
    timeIn: '',
    timeOut: '',
    status: 'PRESENT' as const,
    otHours: '',
    signature: '',
  }));

  const blankMaterials = Array.from({ length: 8 }, (_, i) => ({
    id: `blank-mat-${i}`,
    sl: i + 1,
    itemCode: '',
    description: '',
    unit: '',
    qtyRequested: '',
    qtyIssued: '',
    unitPrice: '',
    purpose: '',
    remarks: '',
  }));

  const blankGatePass = Array.from({ length: 7 }, (_, i) => ({
    id: `blank-gp-${i}`,
    sl: i + 1,
    description: '',
    serialNo: '',
    qty: '',
    unit: '',
    purpose: '',
    returnable: false,
    expectedReturnDate: '',
  }));

  const blankCustomRows = Array.from({ length: 8 }, (_, i) => {
    const dummy: Record<string, any> = { id: `blank-custom-${i}` };
    (template.customTable?.columns || []).forEach((col, cIdx) => {
      dummy[col.key] = cIdx === 0 ? String(i + 1) : '';
    });
    return dummy;
  });

  const displayAttendance = isBlankMode ? blankAttendance : attendanceRows;
  const displayMaterials = isBlankMode ? blankMaterials : materialRows;
  const displayGatePass = isBlankMode ? blankGatePass : gatePassRows;
  const displayCustomRows = isBlankMode
    ? blankCustomRows
    : customRows.length > 0
    ? customRows
    : template.sampleCustomRows || [];

  // Render input helper for header fields
  const renderFieldInput = (field: any) => {
    const val = isBlankMode ? '' : formData[field.name] ?? field.defaultValue ?? '';

    if (!isEditable || isBlankMode) {
      return (
        <div
          className={`border-b-2 border-slate-700 bg-white/80 px-2 py-1 text-xs font-semibold min-h-[26px] flex items-center ${
            isBlankMode ? 'border-dashed text-transparent' : 'text-slate-950'
          }`}
        >
          {val || (isBlankMode ? '' : '—')}
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          value={val}
          onChange={(e) => onFieldChange?.(field.name, e.target.value)}
          className="w-full border-b-2 border-blue-600 bg-blue-50/50 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:bg-blue-100/60 transition"
        >
          <option value="">-- Select {field.label} --</option>
          {field.options.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'date') {
      return (
        <input
          type="date"
          value={val}
          onChange={(e) => onFieldChange?.(field.name, e.target.value)}
          className="w-full border-b-2 border-blue-600 bg-blue-50/50 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:bg-blue-100/60"
        />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          rows={2}
          value={val}
          placeholder={field.placeholder || `Enter ${field.label}...`}
          onChange={(e) => onFieldChange?.(field.name, e.target.value)}
          className="w-full border border-blue-400 bg-blue-50/30 p-1.5 rounded text-xs text-slate-900 focus:outline-none focus:bg-blue-100/40"
        />
      );
    }

    return (
      <input
        type="text"
        value={val}
        placeholder={field.placeholder || `Enter ${field.label}...`}
        onChange={(e) => onFieldChange?.(field.name, e.target.value)}
        className="w-full border-b-2 border-blue-600 bg-blue-50/50 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-blue-100/60"
      />
    );
  };

  return (
    <div
      className={`bg-white text-slate-950 w-full ${
        isLandscape ? 'max-w-[1100px]' : 'max-w-[840px]'
      } mx-auto p-6 sm:p-8 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between select-text relative`}
    >
      <div>
        {/* ========================================================================= */}
        {/* OFFICIAL HEADER                                                           */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
          {/* Left: Tamimi Global Logo */}
          <div className="flex items-center space-x-3">
            <TamimiLogo size={58} />
            <div>
              <div className="text-base font-black tracking-tight text-slate-950 uppercase font-serif">
                TAMIMI GLOBAL COMPANY LTD.
              </div>
              <div className="text-[11px] font-bold text-sky-900 tracking-wide">
                TAFGA CAMP & ENTERPRISE FACILITIES MANAGEMENT
              </div>
              <div className="text-[9px] text-slate-600 font-semibold mt-0.5">
                Division: {template.department} • ISO 9001 / 45001 Certified System
              </div>
            </div>
          </div>

          {/* Right: Form Metadata */}
          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-black px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wide uppercase">
              {template.code}
            </div>
            <div className="text-[10px] text-slate-700 font-mono mt-1">
              REF: <strong className="text-slate-950">{effectiveRef}</strong>
            </div>
            <div className="text-[9px] text-slate-500 font-medium">
              Version: {template.version} • {printDate}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORM TITLE BANNER                                                         */}
        {/* ========================================================================= */}
        <div className="text-center bg-slate-100 border-y-2 border-slate-900 py-2 mb-4">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
            {template.title}
          </h1>
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
            Official Operational Protocol Record & Verification Document
          </div>
        </div>

        {/* Blank Stamp for print preview mode */}
        {isBlankMode && (
          <div className="mb-3 text-center print:hidden">
            <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full">
              📄 PRINTING 100% BLANK TEMPLATE (DESIGNED FOR HANDWRITING WITH PEN)
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: GENERAL PARTICULARS / METADATA GRID                            */}
        {/* ========================================================================= */}
        <div className="mb-4">
          <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
            <span>SECTION 1: GENERAL INFORMATION & ADMINISTRATIVE PARTICULARS</span>
            <span className="text-[9px] font-normal text-slate-300">
              {isEditable && !isBlankMode ? '✏️ Editable In-Place' : 'Official Record'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 border-x border-b border-slate-400">
            {template.headerFields.map((field) => {
              const colClass =
                field.colSpan === 4
                  ? 'col-span-4'
                  : field.colSpan === 3
                  ? 'col-span-3'
                  : field.colSpan === 2
                  ? 'col-span-2'
                  : 'col-span-1';

              return (
                <div key={field.name} className={`${colClass} space-y-1`}>
                  <div className="text-[10px] font-black uppercase text-slate-700 flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-red-600">*</span>}:
                    </span>
                  </div>
                  {renderFieldInput(field)}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: PURPOSE-BUILT DOMAIN TABLES & CHECKLISTS                       */}
        {/* ========================================================================= */}

        {/* 1. ATTENDANCE & DUTY ROSTER TABLE */}
        {(template.hasDynamicTable === 'ATTENDANCE' || template.id === 'attendance-sheet') && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 2: STAFF DUTY ROSTER & ATTENDANCE REGISTER</span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-slate-300">Total Staff: {displayAttendance.length}</span>
                {isEditable && !isBlankMode && (
                  <button
                    type="button"
                    onClick={handleAddAttendanceRow}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer print:hidden"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Staff</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900">
                    <th className="border border-slate-900 p-1.5 w-7 text-center">#</th>
                    <th className="border border-slate-900 p-1.5 text-left min-w-[140px]">Employee Full Name</th>
                    <th className="border border-slate-900 p-1.5 w-20 text-center">Badge ID</th>
                    <th className="border border-slate-900 p-1.5 text-left min-w-[120px]">Designation / Trade</th>
                    <th className="border border-slate-900 p-1.5 w-16 text-center">Shift</th>
                    <th className="border border-slate-900 p-1.5 w-16 text-center">Time In</th>
                    <th className="border border-slate-900 p-1.5 w-16 text-center">Time Out</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-center">Duty Status</th>
                    <th className="border border-slate-900 p-1.5 w-14 text-center">OT (Hrs)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-center">Signature</th>
                    {isEditable && !isBlankMode && (
                      <th className="border border-slate-900 p-1 w-8 text-center print:hidden">Del</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayAttendance.map((row, idx) => (
                    <tr key={row.id || idx} className="border-b border-slate-400 hover:bg-slate-50/80">
                      <td className="border border-slate-900 text-center font-bold">{row.sl || idx + 1}</td>

                      {/* Name */}
                      <td className="border border-slate-900 p-1 font-bold text-slate-950">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.empName}
                            placeholder="Employee Name"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'empName', e.target.value)}
                            className="w-full bg-transparent font-bold text-xs text-slate-950 focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.empName}</span>
                        )}
                      </td>

                      {/* Badge */}
                      <td className="border border-slate-900 p-1 text-center font-mono font-semibold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.badgeId}
                            placeholder="TM-0000"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'badgeId', e.target.value)}
                            className="w-full text-center bg-transparent font-mono text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.badgeId}</span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="border border-slate-900 p-1 text-slate-800">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.designation}
                            placeholder="Job Title"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'designation', e.target.value)}
                            className="w-full bg-transparent text-xs focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.designation}</span>
                        )}
                      </td>

                      {/* Shift */}
                      <td className="border border-slate-900 p-1 text-center">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.shift}
                            placeholder="Morning"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'shift', e.target.value)}
                            className="w-full text-center bg-transparent text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.shift}</span>
                        )}
                      </td>

                      {/* Time In */}
                      <td className="border border-slate-900 p-1 text-center font-mono">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.timeIn}
                            placeholder="06:00"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'timeIn', e.target.value)}
                            className="w-full text-center bg-transparent font-mono text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.timeIn}</span>
                        )}
                      </td>

                      {/* Time Out */}
                      <td className="border border-slate-900 p-1 text-center font-mono">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.timeOut}
                            placeholder="14:00"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'timeOut', e.target.value)}
                            className="w-full text-center bg-transparent font-mono text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.timeOut}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="border border-slate-900 p-1 text-center">
                        {isEditable && !isBlankMode ? (
                          <select
                            value={row.status}
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'status', e.target.value)}
                            className="w-full text-center bg-transparent text-[10px] font-bold focus:outline-none"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="OVERTIME">OVERTIME</option>
                            <option value="LEAVE">LEAVE</option>
                            <option value="OFF">OFF</option>
                            <option value="ABSENT">ABSENT</option>
                            <option value="SICK">SICK</option>
                          </select>
                        ) : isBlankMode ? (
                          ''
                        ) : (
                          <span
                            className={`px-1 py-0.5 rounded text-[9px] font-black ${
                              row.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-900'
                                : row.status === 'OVERTIME'
                                ? 'bg-blue-100 text-blue-900'
                                : row.status === 'LEAVE'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-900'
                            }`}
                          >
                            {row.status}
                          </span>
                        )}
                      </td>

                      {/* OT Hours */}
                      <td className="border border-slate-900 p-1 text-center font-bold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="number"
                            step="0.5"
                            value={row.otHours}
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'otHours', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.otHours || (isBlankMode ? '' : '0')}</span>
                        )}
                      </td>

                      {/* Signature */}
                      <td className="border border-slate-900 p-1 text-center font-serif italic text-xs">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.signature}
                            placeholder="Sign / Initial"
                            onChange={(e) => handleUpdateAttendanceRow(idx, 'signature', e.target.value)}
                            className="w-full text-center bg-transparent italic text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{row.signature || (isBlankMode ? '' : 'Signed')}</span>
                        )}
                      </td>

                      {/* Delete */}
                      {isEditable && !isBlankMode && (
                        <td className="border border-slate-900 p-1 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteAttendanceRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attendance Live Statistics Footer */}
            {!isBlankMode && (
              <div className="mt-2 flex flex-wrap items-center justify-between bg-slate-100 border border-slate-400 p-2 text-xs font-bold text-slate-900">
                <span>Total Staff: {displayAttendance.length}</span>
                <span className="text-emerald-700">
                  Present: {displayAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'OVERTIME').length}
                </span>
                <span className="text-amber-700">
                  On Leave/Off: {displayAttendance.filter((r) => r.status === 'LEAVE' || r.status === 'OFF').length}
                </span>
                <span className="text-red-700">
                  Absent/Sick: {displayAttendance.filter((r) => r.status === 'ABSENT' || r.status === 'SICK').length}
                </span>
                <span className="text-blue-700">
                  Total OT Hours: {displayAttendance.reduce((sum, r) => sum + (Number(r.otHours) || 0), 0)} Hrs
                </span>
              </div>
            )}
          </div>
        )}

        {/* 2. MATERIALS / STORE REQUISITION TABLE */}
        {(template.hasDynamicTable === 'MATERIALS' ||
          template.hasDynamicTable === 'STORE' ||
          template.id === 'materials-request' ||
          template.id === 'store-request' ||
          template.id === 'ppe-issue' ||
          template.id === 'tool-issue') && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 2: LINE ITEMS & MATERIAL SPECIFICATIONS</span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-slate-300">Items: {displayMaterials.length}</span>
                {isEditable && !isBlankMode && (
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer print:hidden"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900">
                    <th className="border border-slate-900 p-1.5 w-7 text-center">#</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-center">Item / Part Code</th>
                    <th className="border border-slate-900 p-1.5 text-left min-w-[180px]">Item Description & Specs</th>
                    <th className="border border-slate-900 p-1.5 w-14 text-center">Unit</th>
                    <th className="border border-slate-900 p-1.5 w-16 text-center">Qty Req</th>
                    <th className="border border-slate-900 p-1.5 w-16 text-center">Qty Issued</th>
                    <th className="border border-slate-900 p-1.5 text-left min-w-[140px]">Purpose / Target Area</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-left">Remarks</th>
                    {isEditable && !isBlankMode && (
                      <th className="border border-slate-900 p-1 w-8 text-center print:hidden">Del</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayMaterials.map((row, idx) => (
                    <tr key={row.id || idx} className="border-b border-slate-400 hover:bg-slate-50/80">
                      <td className="border border-slate-900 text-center font-bold">{row.sl || idx + 1}</td>

                      {/* Code */}
                      <td className="border border-slate-900 p-1 text-center font-mono font-bold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.itemCode}
                            placeholder="PRT-001"
                            onChange={(e) => handleUpdateMaterialRow(idx, 'itemCode', e.target.value)}
                            className="w-full text-center bg-transparent font-mono text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.itemCode}</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="border border-slate-900 p-1 font-semibold text-slate-950">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.description}
                            placeholder="Detailed Item Description"
                            onChange={(e) => handleUpdateMaterialRow(idx, 'description', e.target.value)}
                            className="w-full bg-transparent font-semibold text-xs text-slate-950 focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.description}</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="border border-slate-900 p-1 text-center">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.unit}
                            placeholder="Pcs/Roll"
                            onChange={(e) => handleUpdateMaterialRow(idx, 'unit', e.target.value)}
                            className="w-full text-center bg-transparent text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.unit}</span>
                        )}
                      </td>

                      {/* Qty Requested */}
                      <td className="border border-slate-900 p-1 text-center font-bold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="number"
                            value={row.qtyRequested}
                            onChange={(e) => handleUpdateMaterialRow(idx, 'qtyRequested', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.qtyRequested}</span>
                        )}
                      </td>

                      {/* Qty Issued */}
                      <td className="border border-slate-900 p-1 text-center font-bold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="number"
                            value={row.qtyIssued}
                            onChange={(e) => handleUpdateMaterialRow(idx, 'qtyIssued', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.qtyIssued || (isBlankMode ? '' : '—')}</span>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="border border-slate-900 p-1 text-slate-800">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.purpose}
                            placeholder="e.g. Floodlight Repair"
                            onChange={(e) => handleUpdateMaterialRow(idx, 'purpose', e.target.value)}
                            className="w-full bg-transparent text-xs focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.purpose}</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="border border-slate-900 p-1 text-slate-700">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.remarks || ''}
                            placeholder="OEM / Approved"
                            onChange={(e) => handleUpdateMaterialRow(idx, 'remarks', e.target.value)}
                            className="w-full bg-transparent text-xs focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.remarks || ''}</span>
                        )}
                      </td>

                      {/* Delete */}
                      {isEditable && !isBlankMode && (
                        <td className="border border-slate-900 p-1 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterialRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CLEARANCE & ASSET DEPARTMENTS TABLE */}
        {(template.hasDynamicTable === 'CLEARANCE' || template.id === 'employee-clearance') && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 2: MULTI-DEPARTMENT CLEARANCE & ASSET RECOVERY</span>
              <span className="text-[9px] text-slate-300">Mandatory Verification Across All Units</span>
            </div>

            <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900">
                  <th className="border border-slate-900 p-1.5 w-36 text-left">Department / Unit</th>
                  <th className="border border-slate-900 p-1.5 text-left">Custody Items & Handover Scope</th>
                  <th className="border border-slate-900 p-1.5 w-24 text-center">Status</th>
                  <th className="border border-slate-900 p-1.5 w-28 text-left">Officer Name</th>
                  <th className="border border-slate-900 p-1.5 w-20 text-center">Date</th>
                  <th className="border border-slate-900 p-1.5 w-24 text-center">Sign & Stamp</th>
                </tr>
              </thead>
              <tbody>
                {(clearanceRows.length > 0
                  ? clearanceRows
                  : [
                      {
                        id: '1',
                        department: 'Accommodation & Housing',
                        custodyItems: 'Room key, bedding linen set, AC remote, room inspection passed',
                        status: 'CLEARED' as const,
                        officerName: 'Tariq Mansoor',
                        officerBadge: 'TM-3100',
                        signDate: printDate,
                        remarks: 'All OK',
                      },
                      {
                        id: '2',
                        department: 'Store & Tool Custody',
                        custodyItems: 'Tools, uniform sets, safety boots, PPE gear returned in full',
                        status: 'CLEARED' as const,
                        officerName: 'Sultan Al-Harbi',
                        officerBadge: 'TM-4200',
                        signDate: printDate,
                        remarks: 'Returned',
                      },
                      {
                        id: '3',
                        department: 'IT & Security Badges',
                        custodyItems: 'Access badge, walkie-talkie, corporate SIM, biometric deregistered',
                        status: 'CLEARED' as const,
                        officerName: 'Fahad Al-Qarni',
                        officerBadge: 'TM-1050',
                        signDate: printDate,
                        remarks: 'Deactivated',
                      },
                      {
                        id: '4',
                        department: 'Finance & Accounts',
                        custodyItems: 'Petty cash, advances, mess hall bills settled, zero balance',
                        status: 'CLEARED' as const,
                        officerName: 'Zubair Ahmed',
                        officerBadge: 'TM-5500',
                        signDate: printDate,
                        remarks: 'Settled',
                      },
                      {
                        id: '5',
                        department: 'Camp Security & Gate',
                        custodyItems: 'Vehicle access pass surrendered, final gate exit pass issued',
                        status: 'CLEARED' as const,
                        officerName: 'Capt. Mansoor',
                        officerBadge: 'TM-8000',
                        signDate: printDate,
                        remarks: 'Gate Pass Validated',
                      },
                    ]
                ).map((row, idx) => (
                  <tr key={row.id || idx} className="border-b border-slate-400">
                    <td className="border border-slate-900 p-1.5 font-bold text-slate-950">{row.department}</td>
                    <td className="border border-slate-900 p-1.5 text-slate-800 leading-snug">{row.custodyItems}</td>
                    <td className="border border-slate-900 p-1 text-center font-bold">
                      {isEditable && !isBlankMode ? (
                        <select
                          value={row.status}
                          onChange={(e) => handleUpdateClearanceRow(idx, 'status', e.target.value as any)}
                          className="w-full text-center bg-transparent text-[10px] font-black focus:outline-none"
                        >
                          <option value="CLEARED">CLEARED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="DEDUCTION">DEDUCTION</option>
                          <option value="N/A">N/A</option>
                        </select>
                      ) : isBlankMode ? (
                        <span className="text-[8px] text-slate-400">[ ] OK  [ ] DUE</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[9px] font-black">
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-900 p-1 font-semibold">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          value={row.officerName}
                          onChange={(e) => handleUpdateClearanceRow(idx, 'officerName', e.target.value)}
                          className="w-full bg-transparent text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{isBlankMode ? '' : row.officerName}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 p-1 text-center font-mono text-[9px]">
                      {isBlankMode ? '' : row.signDate || printDate}
                    </td>
                    <td className="border border-slate-900 p-1 text-center font-serif italic text-xs">
                      {isBlankMode ? '' : '✓ Cleared & Signed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. GATE PASS / DISPATCH TABLE */}
        {(template.hasDynamicTable === 'GATE_PASS' || template.id === 'material-gatepass') && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 2: OUTGOING MATERIALS & ASSET SPECIFICATIONS</span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-slate-300">Total Items: {displayGatePass.length}</span>
                {isEditable && !isBlankMode && (
                  <button
                    type="button"
                    onClick={handleAddGatePassRow}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer print:hidden"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900">
                    <th className="border border-slate-900 p-1.5 w-7 text-center">#</th>
                    <th className="border border-slate-900 p-1.5 text-left min-w-[180px]">Item Description & Model</th>
                    <th className="border border-slate-900 p-1.5 w-28 text-center">Serial / Tag #</th>
                    <th className="border border-slate-900 p-1.5 w-14 text-center">Qty</th>
                    <th className="border border-slate-900 p-1.5 w-14 text-center">Unit</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-center">Returnable?</th>
                    <th className="border border-slate-900 p-1.5 text-left min-w-[140px]">Purpose / Site Destination</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-center">Return Due Date</th>
                    {isEditable && !isBlankMode && (
                      <th className="border border-slate-900 p-1 w-8 text-center print:hidden">Del</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayGatePass.map((row, idx) => (
                    <tr key={row.id || idx} className="border-b border-slate-400 hover:bg-slate-50/80">
                      <td className="border border-slate-900 text-center font-bold">{row.sl || idx + 1}</td>

                      {/* Description */}
                      <td className="border border-slate-900 p-1 font-bold text-slate-950">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.description}
                            placeholder="Item description"
                            onChange={(e) => handleUpdateGatePassRow(idx, 'description', e.target.value)}
                            className="w-full bg-transparent font-bold text-xs text-slate-950 focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.description}</span>
                        )}
                      </td>

                      {/* Serial */}
                      <td className="border border-slate-900 p-1 text-center font-mono font-bold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.serialNo}
                            placeholder="SN-12345"
                            onChange={(e) => handleUpdateGatePassRow(idx, 'serialNo', e.target.value)}
                            className="w-full text-center bg-transparent font-mono text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.serialNo}</span>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="border border-slate-900 p-1 text-center font-bold">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="number"
                            value={row.qty}
                            onChange={(e) => handleUpdateGatePassRow(idx, 'qty', e.target.value)}
                            className="w-full text-center bg-transparent font-bold text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.qty}</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="border border-slate-900 p-1 text-center">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.unit}
                            placeholder="Pcs"
                            onChange={(e) => handleUpdateGatePassRow(idx, 'unit', e.target.value)}
                            className="w-full text-center bg-transparent text-xs focus:outline-none focus:bg-blue-50"
                          />
                        ) : (
                          <span>{row.unit}</span>
                        )}
                      </td>

                      {/* Returnable */}
                      <td className="border border-slate-900 p-1 text-center font-bold">
                        {isEditable && !isBlankMode ? (
                          <select
                            value={row.returnable ? 'YES' : 'NO'}
                            onChange={(e) => handleUpdateGatePassRow(idx, 'returnable', e.target.value === 'YES')}
                            className="w-full text-center bg-transparent text-[10px] font-black focus:outline-none"
                          >
                            <option value="NO">NO (Permanent)</option>
                            <option value="YES">YES (Returnable)</option>
                          </select>
                        ) : isBlankMode ? (
                          ''
                        ) : (
                          <span className={row.returnable ? 'text-blue-800' : 'text-slate-700'}>
                            {row.returnable ? 'YES (Returnable)' : 'NO (Permanent)'}
                          </span>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="border border-slate-900 p-1 text-slate-800">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="text"
                            value={row.purpose}
                            placeholder="Purpose / Destination"
                            onChange={(e) => handleUpdateGatePassRow(idx, 'purpose', e.target.value)}
                            className="w-full bg-transparent text-xs focus:outline-none focus:bg-blue-50 px-1"
                          />
                        ) : (
                          <span>{row.purpose}</span>
                        )}
                      </td>

                      {/* Return Date */}
                      <td className="border border-slate-900 p-1 text-center font-mono text-[9px]">
                        {isEditable && !isBlankMode ? (
                          <input
                            type="date"
                            value={row.expectedReturnDate || ''}
                            onChange={(e) => handleUpdateGatePassRow(idx, 'expectedReturnDate', e.target.value)}
                            className="w-full text-center bg-transparent text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{row.expectedReturnDate || (isBlankMode ? '' : '—')}</span>
                        )}
                      </td>

                      {/* Delete */}
                      {isEditable && !isBlankMode && (
                        <td className="border border-slate-900 p-1 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteGatePassRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOM / IMPORTED DYNAMIC TABLE */}
        {(template.hasDynamicTable === 'CUSTOM' || template.customTable) && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>{template.customTable?.title || 'SECTION 2: SCHEDULED ITEMS & OPERATIONAL RECORD DETAILS'}</span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-slate-300">
                  Total Rows: {displayCustomRows.length}
                </span>
                {isEditable && !isBlankMode && (
                  <button
                    type="button"
                    onClick={handleAddCustomRow}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer print:hidden"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Row</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900">
                    <th className="border border-slate-900 p-1.5 w-8 text-center">#</th>
                    {(template.customTable?.columns || []).map((col) => (
                      <th
                        key={col.id || col.key}
                        style={{ width: col.width }}
                        className={`border border-slate-900 p-1.5 text-${col.align || 'left'}`}
                      >
                        {col.label}
                      </th>
                    ))}
                    {isEditable && !isBlankMode && (
                      <th className="border border-slate-900 p-1 w-8 text-center print:hidden">Del</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayCustomRows.map((row, idx) => (
                    <tr key={row.id || idx} className="border-b border-slate-400 hover:bg-slate-50/80">
                      <td className="border border-slate-900 text-center font-bold">{idx + 1}</td>
                      {(template.customTable?.columns || []).map((col) => (
                        <td
                          key={col.id || col.key}
                          className={`border border-slate-900 p-1 text-${col.align || 'left'}`}
                        >
                          {isEditable && !isBlankMode ? (
                            col.type === 'select' && col.options && col.options.length > 0 ? (
                              <select
                                value={row[col.key] || ''}
                                onChange={(e) => handleUpdateCustomRow(idx, col.key, e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-950 focus:outline-none px-1 font-semibold"
                              >
                                <option value="">Select...</option>
                                {col.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                value={row[col.key] ?? ''}
                                placeholder={isBlankMode ? '' : col.placeholder || col.label}
                                onChange={(e) => handleUpdateCustomRow(idx, col.key, e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-950 focus:outline-none focus:bg-blue-50 px-1"
                              />
                            )
                          ) : (
                            <span>{isBlankMode ? '' : (row[col.key] ?? '—')}</span>
                          )}
                        </td>
                      ))}
                      {isEditable && !isBlankMode && (
                        <td className="border border-slate-900 p-1 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PERMIT TO WORK / SAFETY HAZARDS MATRIX */}
        {template.id === 'permit-to-work' && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 2: HIGH-RISK HAZARD IDENTIFICATION & PRECAUTION PROTOCOLS</span>
              <span className="text-[9px] text-slate-300">Mandatory EHS Compliance</span>
            </div>

            <div className="p-3 bg-slate-50 border-x-2 border-b-2 border-slate-900 grid grid-cols-3 gap-3">
              {[
                { title: '1. Hot Work & Welding', desc: 'Fire watcher, 2x CO2 extinguisher within 3m, spark shields in place.' },
                { title: '2. Working at Heights (>1.8m)', desc: 'Full-body safety harness with dual lanyards anchored to certified lifeline.' },
                { title: '3. Electrical Isolation (LOTO)', desc: 'Main circuit locked & tagged out, zero voltage verified by multimeter.' },
                { title: '4. Confined Space Entry', desc: 'Continuous 4-gas monitoring (O2 > 19.5%, H2S < 10ppm, LEL < 5%), standby rescuer.' },
                { title: '5. Heavy Lifting / Crane Rigging', desc: 'Certified crane operator, load charts checked, 10m exclusion perimeter.' },
                { title: '6. Chemical & Solvent Use', desc: 'MSDS reviewed, chemical splash goggles, nitrile gloves, eyewash station.' },
              ].map((item, idx) => (
                <div key={idx} className="border border-slate-400 bg-white p-2 rounded">
                  <div className="font-black text-slate-950 text-xs flex items-center space-x-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <div className="text-[9px] text-slate-700 mt-1 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ROOM & FACILITY INSPECTION CHECKLIST */}
        {template.id === 'room-inspection' && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 2: ROOM AMENITIES & HVAC CONDITION AUDIT</span>
              <span className="text-[9px] text-slate-300">Passing Threshold: 100% Operational</span>
            </div>

            <table className="w-full border-collapse border-2 border-slate-900 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900">
                  <th className="border border-slate-900 p-1.5 w-8 text-center">#</th>
                  <th className="border border-slate-900 p-1.5 w-44 text-left">Facility Component</th>
                  <th className="border border-slate-900 p-1.5 text-left">Standard Inspection Criteria</th>
                  <th className="border border-slate-900 p-1.5 w-24 text-center">Condition</th>
                  <th className="border border-slate-900 p-1.5 w-32 text-left">Action Required</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sl: 1, comp: 'Split AC & Thermostat', crit: 'Cooling at 21°C, filters cleaned, remote display functioning', cond: 'PASS' },
                  { sl: 2, comp: 'Plumbing & Faucets', crit: 'Zero leaks under washbasin, water pressure > 2.5 bar, hot water active', cond: 'PASS' },
                  { sl: 3, comp: 'Electrical Outlets & Lighting', crit: 'All 6 gang sockets grounded, LED tubes bright, switchboards clean', cond: 'PASS' },
                  { sl: 4, comp: 'Bed Frame & Orthopedic Mattress', crit: 'Linen fresh, mattress protector fitted, no sagging or structural damage', cond: 'PASS' },
                  { sl: 5, comp: 'Door Smart Card Lock & Handle', crit: 'RFID reader beeps, deadbolt engages smoothly, closer adjusted', cond: 'PASS' },
                  { sl: 6, comp: 'Smoke Detector & Fire Sprinkler', crit: 'Green LED flashing, sprinkler bulb intact, minimum 50cm clearance', cond: 'PASS' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-400">
                    <td className="border border-slate-900 text-center font-bold">{row.sl}</td>
                    <td className="border border-slate-900 p-1.5 font-bold text-slate-950">{row.comp}</td>
                    <td className="border border-slate-900 p-1.5 text-slate-800">{row.crit}</td>
                    <td className="border border-slate-900 p-1 text-center font-black">
                      {isBlankMode ? (
                        <span className="text-[8px] text-slate-400">[ ] OK  [ ] DEFECT</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[9px]">
                          {row.cond}
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-900 p-1 text-slate-600 font-mono text-[9px]">
                      {isBlankMode ? '' : 'None (Inspected OK)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: FOOTER FIELDS / REMARKS / SCOPE OF WORK                        */}
        {/* ========================================================================= */}
        {template.footerFields && template.footerFields.length > 0 && (
          <div className="mb-4">
            <div className="bg-slate-900 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center justify-between">
              <span>SECTION 3: SCOPE OF WORK, TECHNICAL NOTES & JUSTIFICATIONS</span>
            </div>

            <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 border-x border-b border-slate-400">
              {template.footerFields.map((field) => {
                const colClass =
                  field.colSpan === 4
                    ? 'col-span-4'
                    : field.colSpan === 3
                    ? 'col-span-3'
                    : field.colSpan === 2
                    ? 'col-span-2'
                    : 'col-span-1';

                return (
                  <div key={field.name} className={`${colClass} space-y-1`}>
                    <div className="text-[10px] font-black uppercase text-slate-700">
                      {field.label}:
                    </div>
                    {renderFieldInput(field)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: MULTI-TIER OFFICIAL AUTHORIZATION & SIGN-OFF BLOCKS            */}
        {/* ========================================================================= */}
        <div className="mt-6 border-t-2 border-slate-900 pt-3">
          <div className="text-[10px] font-black uppercase text-slate-700 mb-2 flex items-center justify-between">
            <span>SECTION 4: OFFICIAL CORPORATE VERIFICATION & AUTHORIZATION SIGN-OFFS</span>
            <span className="text-[9px] font-normal text-slate-500">Corporate Seal Required</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Box 1 */}
            <div className="border-2 border-slate-900 rounded p-2 text-center bg-slate-50/70 flex flex-col justify-between h-28">
              <div className="text-[9px] font-black uppercase text-slate-800">
                1. INITIATED & PREPARED BY
              </div>
              <div className="font-serif italic text-slate-950 text-sm font-bold">
                {isBlankMode
                  ? ''
                  : formData.applicantName ||
                    formData.preparedBy ||
                    formData.employeeName ||
                    formData.supervisorName ||
                    'Staff Member'}
              </div>
              <div className="border-t border-slate-700 pt-1 text-[8px] text-slate-600 font-bold uppercase">
                Initiator / Supervisor Signature & Date
              </div>
            </div>

            {/* Box 2 */}
            <div className="border-2 border-slate-900 rounded p-2 text-center bg-slate-50/70 flex flex-col justify-between h-28">
              <div className="text-[9px] font-black uppercase text-slate-800">
                2. VERIFIED BY DEPARTMENT HEAD
              </div>
              <div className="font-serif italic text-slate-950 text-sm font-bold">
                {isBlankMode
                  ? ''
                  : formData.deptHeadApproval ||
                    formData.supervisorSign ||
                    formData.deptManagerApproval ||
                    'Eng. Salem Al-Zahrani'}
              </div>
              <div className="border-t border-slate-700 pt-1 text-[8px] text-slate-600 font-bold uppercase">
                Department Manager Stamp & Sign
              </div>
            </div>

            {/* Box 3 */}
            <div className="border-2 border-slate-900 rounded p-2 text-center bg-slate-50/70 flex flex-col justify-between h-28">
              <div className="text-[9px] font-black uppercase text-slate-800">
                3. CAMP OPERATIONS / GENERAL MANAGER
              </div>
              <div className="font-serif italic text-slate-950 text-sm font-bold">
                {isBlankMode
                  ? ''
                  : formData.procurementApproval ||
                    formData.gmApproval ||
                    formData.campDirectorSign ||
                    'Eng. Khalid Al-Otaibi'}
              </div>
              <div className="border-t border-slate-700 pt-1 text-[8px] text-slate-600 font-bold uppercase">
                Director Approval & Corporate Seal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: OFFICIAL WATERMARK & CORPORATE SECURITY FOOTER                */}
      {/* ========================================================================= */}
      <div className="mt-6 pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[8px] text-slate-500 font-mono">
        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-slate-700" />
          <span>TAMIMI GLOBAL (TAFGA) ENTERPRISE FACILITY PORTAL • VALIDATED OFFICIAL RECORD</span>
        </div>
        <div>
          PRINTED: {new Date().toLocaleString()} • DOC REF: {effectiveRef}
        </div>
      </div>
    </div>
  );
};

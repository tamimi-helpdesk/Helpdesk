import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface JobDescriptionFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

const DEFAULT_TASKS = [
  'Front Desk Attendance & Staff Deployment Tracking',
  'Email Daily Facility Observation & Maintenance Log to RSG FM',
  'TBCVH Weekly Camp Accommodation & Occupancy Report',
  'Staff Village Weekly Operations & Quality Summary',
  'Forward TBCVH Gate Pass & Resident Entry Approvals',
  'Attend RSG Client FM coordination meetings for Accommodation & Helpdesk',
  'Helpdesk Supervisor email escalation and ticketing resolution',
  "Implement Front Desk (Helpdesk & Accommodation) Standard Operating Procedures (SOPs)",
  'Maintain and issue Front Desk (Helpdesk & Accommodation) Official Forms',
  'Monitor Data accuracy across ERP - Camp Registry - Actual physical headcounts',
  'Oversee Management Registry updates and VIP resident room allocations',
  'Ensure 100% Data accuracy for Room Asset Inventories and Transfer Logs',
  'Coordinate and respond to RSG client directives within SLA timeframes',
  'Monitor Amaala Accommodation official inbox and dispatch urgent work orders',
];

export const JobDescriptionForm: React.FC<JobDescriptionFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  
  // Extract or default tasks list
  const rawTasks = data.tasks && data.tasks.length > 0 ? data.tasks : DEFAULT_TASKS;
  const tasksList: string[] = rawTasks.map((t: any) => (typeof t === 'string' ? t : t?.task || ''));
  const rowsCount = isBlankMode ? 14 : Math.max(14, tasksList.length);

  const handleTaskChange = (index: number, val: string) => {
    const updated = [...tasksList];
    while (updated.length <= index) updated.push('');
    updated[index] = val;
    if (onTableChange) {
      onTableChange('tasks', updated);
    } else if (onFieldChange) {
      onFieldChange('tasks', updated);
    }
  };

  const handleAddTask = () => {
    const updated = [...tasksList, ''];
    if (onTableChange) {
      onTableChange('tasks', updated);
    } else if (onFieldChange) {
      onFieldChange('tasks', updated);
    }
  };

  const handleRemoveTask = (index: number) => {
    const updated = tasksList.filter((_, i) => i !== index);
    if (onTableChange) {
      onTableChange('tasks', updated);
    } else if (onFieldChange) {
      onFieldChange('tasks', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Official Header */}
        <div className="flex items-center justify-between pb-3">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              Job Description Form
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Tamimi Global Co. Ltd. — HR &amp; Operational Responsibilities Document
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        <div className="border-b-2 border-slate-900 mb-3" />

        {/* Date Field */}
        <div className="flex justify-end items-center mb-3 font-bold text-slate-900">
          <span>Date:</span>
          {isEditable && !isBlankMode ? (
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => onFieldChange?.('date', e.target.value)}
              className="border-b-2 border-blue-500 bg-blue-50/50 hover:bg-blue-50 px-2 py-0.5 ml-2 min-w-[140px] font-normal text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xs"
            />
          ) : (
            <span className="border-b border-slate-600 ml-2 px-3 py-0.5 min-w-[140px] text-center font-normal">
              {data.date || '------------------'}
            </span>
          )}
        </div>

        {/* Employee Metadata Table */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-2 font-bold w-40 bg-slate-100 print:bg-transparent text-slate-950">
                  Employee Name
                </td>
                <td className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Type Employee Name..."
                      value={data.employeeName || ''}
                      onChange={(e) => onFieldChange?.('employeeName', e.target.value)}
                      className="w-full bg-blue-50/40 hover:bg-blue-50 px-2 py-1 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="px-1">{data.employeeName || ''}</span>
                  )}
                </td>
                <td className="border border-slate-900 p-2 font-bold w-36 bg-slate-100 print:bg-transparent text-slate-950">
                  Employee ID
                </td>
                <td className="border border-slate-900 p-1.5 font-normal w-36 text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="e.g. 1021948"
                      value={data.employeeId || ''}
                      onChange={(e) => onFieldChange?.('employeeId', e.target.value)}
                      className="w-full bg-blue-50/40 hover:bg-blue-50 px-2 py-1 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="px-1">{data.employeeId || ''}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Department
                </td>
                <td colSpan={3} className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Department Name..."
                      value={data.department || ''}
                      onChange={(e) => onFieldChange?.('department', e.target.value)}
                      className="w-full bg-blue-50/40 hover:bg-blue-50 px-2 py-1 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="px-1">{data.department || ''}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Job Title
                </td>
                <td colSpan={3} className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Job Title / Role..."
                      value={data.jobTitle || ''}
                      onChange={(e) => onFieldChange?.('jobTitle', e.target.value)}
                      className="w-full bg-blue-50/40 hover:bg-blue-50 px-2 py-1 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="px-1">{data.jobTitle || ''}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Task List & Core Duties (100% IN-PLACE DIRECT EDITABLE!) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-bold text-sm underline text-slate-950">
              Task List & Daily Operations Scope
            </div>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddTask}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task Row</span>
              </button>
            )}
          </div>

          <table className="w-full border-collapse border border-slate-900 text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent font-bold border-b border-slate-900 text-slate-950">
                <th className="border border-slate-900 px-2 py-1.5 w-12 text-center">S.N</th>
                <th className="border border-slate-900 px-3 py-1.5 text-left">
                  Responsibilities / Core Duties
                </th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1.5 w-10 text-center print:hidden">
                    Del
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowsCount }, (_, i) => {
                const taskVal = tasksList[i] || '';
                return (
                  <tr key={i} className="h-6 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder={`Enter responsibility ${i + 1}...`}
                          value={taskVal}
                          onChange={(e) => handleTaskChange(i, e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/40 focus:bg-blue-50/60 px-1.5 py-0.5 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                        />
                      ) : (
                        <span>{isBlankMode ? '' : taskVal}</span>
                      )}
                    </td>
                    {isEditable && !isBlankMode && (
                      <td className="border border-slate-900 px-1 py-0.5 text-center print:hidden">
                        {tasksList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(i)}
                            className="text-slate-400 hover:text-red-600 p-0.5 transition cursor-pointer"
                            title="Remove Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Acknowledgment & Signatures */}
      <div className="pt-3">
        <div className="border border-slate-900 p-3 bg-slate-50/50 rounded-xs mb-3 text-[11px] leading-relaxed text-slate-800">
          <span className="font-bold">Employee Acknowledgment:</span> I hereby acknowledge and confirm that I have received, reviewed, and fully understand the duties, key responsibilities, and operational scope outlined in this job description.
        </div>

        <div className="flex justify-between items-end gap-6 pt-2">
          <div className="flex-1 space-y-1">
            <div className="font-bold text-xs text-slate-950">Employee Signature:</div>
            <div className="border-b-2 border-slate-800 min-h-[32px] flex items-end px-2 italic font-serif text-slate-700">
              {data.employeeName ? `✓ ${data.employeeName}` : ''}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold">
              Date: {data.date || '----------'}
            </div>
          </div>

          {data.officialStamp && data.officialStamp !== 'NONE' && (
            <div className="shrink-0">
              <OfficialStampBadge
                type={data.officialStamp}
                signatory={data.supervisorName || 'HR & OPERATIONS MANAGER'}
                date={data.date}
              />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <div className="font-bold text-xs text-slate-950">Supervisor / Manager Signature:</div>
            {isEditable && !isBlankMode ? (
              <input
                type="text"
                placeholder="Supervisor Name..."
                value={data.supervisorName || ''}
                onChange={(e) => onFieldChange?.('supervisorName', e.target.value)}
                className="w-full border-b-2 border-slate-800 min-h-[32px] px-2 italic font-serif text-slate-800 bg-blue-50/30 hover:bg-blue-50 focus:bg-blue-50 text-xs focus:outline-none"
              />
            ) : (
              <div className="border-b-2 border-slate-800 min-h-[32px] flex items-end px-2 italic font-serif text-slate-700">
                {data.supervisorName ? `✓ ${data.supervisorName}` : ''}
              </div>
            )}
            <div className="text-[10px] text-slate-500 font-semibold">
              {data.supervisorName || 'Tamimi Operations Head'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

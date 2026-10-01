import React from 'react';
import { TamimiLogo } from '../../TamimiLogo';
import { OfficialStampBadge } from '../OfficialStampBadge';
import { Plus, Trash2 } from 'lucide-react';

interface WorkHandoverFormProps {
  formData?: Record<string, any>;
  isBlankMode?: boolean;
  isEditable?: boolean;
  onFieldChange?: (name: string, value: any) => void;
  onTableChange?: (key: string, rows: any[]) => void;
}

export const WorkHandoverForm: React.FC<WorkHandoverFormProps> = ({
  formData = {},
  isBlankMode = false,
  isEditable = false,
  onFieldChange,
  onTableChange,
}) => {
  const data = isBlankMode ? {} : formData;
  const tasksList = data.tasks || [];
  const taskRows = isBlankMode ? 13 : Math.max(13, tasksList.length);

  const handleTaskChange = (index: number, field: string, val: string) => {
    const updated = [...tasksList];
    while (updated.length <= index) {
      updated.push({ task: '', handedTo: '' });
    }
    updated[index] = { ...updated[index], [field]: val };
    if (onTableChange) {
      onTableChange('tasks', updated);
    } else if (onFieldChange) {
      onFieldChange('tasks', updated);
    }
  };

  const handleAddTask = () => {
    const updated = [...tasksList, { task: '', handedTo: data.takenOverByName || '' }];
    if (onTableChange) {
      onTableChange('tasks', updated);
    } else if (onFieldChange) {
      onFieldChange('tasks', updated);
    }
  };

  const handleRemoveTask = (index: number) => {
    const updated = tasksList.filter((_: any, i: number) => i !== index);
    if (onTableChange) {
      onTableChange('tasks', updated);
    } else if (onFieldChange) {
      onFieldChange('tasks', updated);
    }
  };

  return (
    <div className="bg-white text-slate-900 w-full max-w-[840px] mx-auto p-6 sm:p-10 font-sans text-xs border border-slate-300 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none shadow-lg print:shadow-none min-h-[1050px] flex flex-col justify-between relative select-text">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <TamimiLogo size={60} />
          <div className="text-center flex-1 px-4">
            <h1 className="text-base sm:text-lg font-serif font-black tracking-wide text-slate-950 uppercase">
              Work Handover Form
            </h1>
            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
              Tamimi Global Co. Ltd. — Operational Shift &amp; Duties Transfer Certificate
            </div>
          </div>
          <div className="w-[60px] shrink-0" />
        </div>

        <div className="border-b-2 border-slate-900 mb-2" />

        {/* Date */}
        <div className="flex justify-end items-center mb-2 font-bold text-slate-900">
          <span>Date:</span>
          {isEditable && !isBlankMode ? (
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => onFieldChange?.('date', e.target.value)}
              className="border-b-2 border-blue-500 bg-blue-50/50 px-2 py-0.5 ml-2 min-w-[140px] font-normal text-xs text-slate-900 focus:outline-none rounded-xs"
            />
          ) : (
            <span className="border-b border-slate-600 ml-2 px-3 py-0.5 min-w-[140px] text-center font-normal">
              {data.date || '------------------'}
            </span>
          )}
        </div>

        {/* Top Table */}
        <div className="mb-3">
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-1.5 font-bold w-36 bg-slate-100 print:bg-transparent text-slate-950">
                  Employee name
                </td>
                <td className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Outgoing Employee..."
                      value={data.employeeName || ''}
                      onChange={(e) => onFieldChange?.('employeeName', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.employeeName || ''}</span>
                  )}
                </td>
                <td className="border border-slate-900 p-1.5 font-bold w-32 bg-slate-100 print:bg-transparent text-slate-950">
                  Employee ID
                </td>
                <td className="border border-slate-900 p-1.5 font-normal w-28 text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="ID"
                      value={data.employeeId || ''}
                      onChange={(e) => onFieldChange?.('employeeId', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.employeeId || ''}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-1.5 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Department
                </td>
                <td className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Department"
                      value={data.department || ''}
                      onChange={(e) => onFieldChange?.('department', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.department || ''}</span>
                  )}
                </td>
                <td className="border border-slate-900 p-1.5 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Job Title
                </td>
                <td className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Role"
                      value={data.jobTitle || ''}
                      onChange={(e) => onFieldChange?.('jobTitle', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span>{data.jobTitle || ''}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-1.5 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Reason For Handover
                </td>
                <td colSpan={3} className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    {['Leave', 'Transfer', 'End of employment', 'Other'].map((r) => (
                      <label
                        key={r}
                        onClick={() => isEditable && onFieldChange?.('reason', r)}
                        className="flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span className="w-4 h-4 border border-slate-800 inline-flex items-center justify-center text-[10px] font-bold">
                          {data.reason === r ? '✓' : ''}
                        </span>{' '}
                        {r}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-1.5 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Taken over by
                </td>
                <td className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="Incoming Colleague Name..."
                      value={data.takenOverByName || ''}
                      onChange={(e) => onFieldChange?.('takenOverByName', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.takenOverByName || ''}</span>
                  )}
                </td>
                <td className="border border-slate-900 p-1.5 font-bold bg-slate-100 print:bg-transparent text-slate-950">
                  Employee #
                </td>
                <td className="border border-slate-900 p-1.5 font-normal text-slate-900">
                  {isEditable && !isBlankMode ? (
                    <input
                      type="text"
                      placeholder="ID"
                      value={data.takenOverById || ''}
                      onChange={(e) => onFieldChange?.('takenOverById', e.target.value)}
                      className="w-full bg-blue-50/30 px-1 py-0.5 text-xs focus:outline-none font-semibold"
                    />
                  ) : (
                    <span>{data.takenOverById || ''}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Task List */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 text-xs">Assigned Tasks & Handover Scope:</span>
            {isEditable && !isBlankMode && (
              <button
                type="button"
                onClick={handleAddTask}
                className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
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
                <th className="border border-slate-900 px-3 py-1.5 text-left">Task Description / Duty Scope</th>
                <th className="border border-slate-900 px-3 py-1.5 w-48 text-left">Handed Over To</th>
                {isEditable && !isBlankMode && (
                  <th className="border border-slate-900 px-1 py-1 w-8 text-center print:hidden">Del</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: taskRows }, (_, i) => {
                const t = tasksList[i] || {};
                return (
                  <tr key={i} className="h-6 border-b border-slate-900 hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900">
                      {i + 1}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Task responsibility description..."
                          value={t.task || ''}
                          onChange={(e) => handleTaskChange(i, 'task', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1.5 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{t.task || ''}</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-1 text-slate-900 font-normal">
                      {isEditable && !isBlankMode ? (
                        <input
                          type="text"
                          placeholder="Name..."
                          value={t.handedTo || ''}
                          onChange={(e) => handleTaskChange(i, 'handedTo', e.target.value)}
                          className="w-full bg-transparent hover:bg-blue-50/30 focus:bg-blue-50 px-1.5 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <span>{t.handedTo || ''}</span>
                      )}
                    </td>
                    {isEditable && !isBlankMode && (
                      <td className="border border-slate-900 px-1 py-0.5 text-center print:hidden">
                        {tasksList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(i)}
                            className="text-slate-400 hover:text-red-600 p-0.5 transition cursor-pointer"
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

      {/* Footer Signatures */}
      <div className="pt-3 text-xs border-t-2 border-slate-900">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="font-bold text-slate-950">Handed Over By (Outgoing):</div>
            <div className="flex items-center text-[11px]">
              <span className="w-16 text-slate-700">Signature:</span>
              <span className="border-b border-slate-400 flex-1 min-h-[22px] italic font-serif">
                {data.employeeName ? `✓ ${data.employeeName}` : ''}
              </span>
            </div>
            <div className="flex items-center text-[11px]">
              <span className="w-16 text-slate-700">Date:</span>
              <span className="border-b border-slate-400 flex-1 min-h-[22px] font-normal">
                {data.handoverDate || data.date || ''}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-950">Taken Over By (Incoming):</div>
            <div className="flex items-center text-[11px]">
              <span className="w-16 text-slate-700">Signature:</span>
              <span className="border-b border-slate-400 flex-1 min-h-[22px] italic font-serif">
                {data.takenOverByName ? `✓ ${data.takenOverByName}` : ''}
              </span>
            </div>
            <div className="flex items-center text-[11px]">
              <span className="w-16 text-slate-700">Date:</span>
              <span className="border-b border-slate-400 flex-1 min-h-[22px] font-normal">
                {data.takeoverDate || data.date || ''}
              </span>
            </div>
          </div>
        </div>

        {data.officialStamp && data.officialStamp !== 'NONE' && (
          <div className="mt-4 flex justify-end">
            <OfficialStampBadge
              type={data.officialStamp}
              signatory={data.supervisorName || 'FACILITIES OPERATIONS HEAD'}
              date={data.date}
            />
          </div>
        )}
      </div>
    </div>
  );
};

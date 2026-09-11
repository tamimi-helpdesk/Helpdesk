import React from 'react';
import { Trash2, UserCheck, UserX, Download, CheckSquare, X } from 'lucide-react';

interface StaffBulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkActivate: () => void;
  onBulkSuspend: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
}

export const StaffBulkActionsBar: React.FC<StaffBulkActionsBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkActivate,
  onBulkSuspend,
  onBulkDelete,
  onBulkExport,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center space-x-3">
        <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-black">
          {selectedCount} Selected
        </span>
        <span className="text-xs text-slate-300 hidden sm:inline">
          Manage multiple staff accounts simultaneously
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <button
          type="button"
          onClick={onBulkActivate}
          className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Activate</span>
        </button>

        <button
          type="button"
          onClick={onBulkSuspend}
          className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Suspend</span>
        </button>

        <button
          type="button"
          onClick={onBulkExport}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Selected</span>
        </button>

        <button
          type="button"
          onClick={onBulkDelete}
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition flex items-center space-x-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-1"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

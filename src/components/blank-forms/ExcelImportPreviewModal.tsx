import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Database,
  ArrowRight,
  Filter,
  Check,
  Search,
  Building,
  User,
  CreditCard,
  Phone,
  Layers,
} from 'lucide-react';
import { BlankFromRow } from '../../data/initialBlankFromData';

export interface ExcelImportScanResult {
  fileName: string;
  totalScanned: number;
  skippedDuplicates: number;
  newUniqueCount: number;
  newRecords: BlankFromRow[];
  skippedSample: Array<{ record: BlankFromRow; reason: string }>;
  sheetsScanned?: string[];
  currentDbTotal: number;
}

interface ExcelImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExcelImportScanResult;
  onConfirmSave: () => void;
  isSaving?: boolean;
}

export const ExcelImportPreviewModal: React.FC<ExcelImportPreviewModalProps> = ({
  isOpen,
  onClose,
  result,
  onConfirmSave,
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState<'NEW_UNIQUE' | 'SKIPPED_DUPLICATES'>('NEW_UNIQUE');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredNewRecords = result.newRecords.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.name || '').toLowerCase().includes(q) ||
      (r.employmentId || '').toLowerCase().includes(q) ||
      (r.buildingNo || '').toLowerCase().includes(q) ||
      (r.unitNo || '').toLowerCase().includes(q) ||
      (r.idIqama || '').toLowerCase().includes(q) ||
      (r.mobile || '').toLowerCase().includes(q)
    );
  });

  const filteredSkippedRecords = result.skippedSample.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.record.name || '').toLowerCase().includes(q) ||
      (item.record.employmentId || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-2xs shrink-0 ${
                result.newUniqueCount > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {result.newUniqueCount > 0 ? (
                <Sparkles className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Excel Smart Deduplication Analysis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {result.fileName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {result.newUniqueCount > 0
                  ? `Identified ${result.newUniqueCount.toLocaleString()} new unique resident records ready to import.`
                  : 'All records in this file already exist in the database. 0 duplicates will be added.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 shrink-0 text-xs">
          {/* Card 1: Total Scanned */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
              Total Scanned
            </span>
            <strong className="text-xl text-slate-900 dark:text-white font-mono block mt-0.5">
              {result.totalScanned.toLocaleString()}
            </strong>
            <span className="text-[11px] text-slate-500">Rows in Excel file</span>
          </div>

          {/* Card 2: Skipped Existing Duplicates */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block uppercase tracking-wider">
              Skipped Duplicates
            </span>
            <strong className="text-xl text-amber-800 dark:text-amber-300 font-mono block mt-0.5">
              {result.skippedDuplicates.toLocaleString()}
            </strong>
            <span className="text-[11px] text-amber-600 dark:text-amber-400">Already in database</span>
          </div>

          {/* Card 3: Brand New Unique */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 ring-2 ring-emerald-500/20">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black block uppercase tracking-wider">
              New Unique Found
            </span>
            <strong className="text-xl text-emerald-800 dark:text-emerald-200 font-mono block mt-0.5">
              +{result.newUniqueCount.toLocaleString()}
            </strong>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
              Ready to collect &amp; save
            </span>
          </div>

          {/* Card 4: Projected Total */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold block uppercase tracking-wider">
              Final Database Total
            </span>
            <strong className="text-xl text-blue-800 dark:text-blue-300 font-mono block mt-0.5">
              {(result.currentDbTotal + result.newUniqueCount).toLocaleString()}
            </strong>
            <span className="text-[11px] text-blue-600 dark:text-blue-400">Total permanent residents</span>
          </div>
        </div>

        {/* Tab Selector & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 shrink-0">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('NEW_UNIQUE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'NEW_UNIQUE'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>New Unique Records ({result.newUniqueCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SKIPPED_DUPLICATES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'SKIPPED_DUPLICATES'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Skipped Duplicates ({result.skippedDuplicates})</span>
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records in preview..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
            />
          </div>
        </div>

        {/* Table Body Content (Scrollable) */}
        <div className="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
          {activeTab === 'NEW_UNIQUE' ? (
            result.newRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  No New Unique Records in this File
                </p>
                <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
                  All {result.totalScanned.toLocaleString()} records in "{result.fileName}" are already saved in your database. 0 duplicates added, keeping your database completely clean!
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Building</th>
                    <th className="py-2.5 px-3">Unit / Room</th>
                    <th className="py-2.5 px-3">Resident Name</th>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Iqama / Nat ID</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNewRecords.map((r, i) => (
                    <tr
                      key={r.id || i}
                      className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-200"
                    >
                      <td className="py-2 px-3 text-emerald-600 font-bold">{i + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                        {r.buildingNo || r.house || 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">
                        {r.unitNo || r.room || 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-semibold">
                        <span className="truncate block max-w-[200px]">{r.name}</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-300">
                        {r.employmentId || 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {r.idIqama || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {r.mobile || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">
                        {r.company || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            // Skipped duplicates tab
            filteredSkippedRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No duplicate records to show.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Resident Name</th>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Room / Unit</th>
                    <th className="py-2.5 px-3">Iqama / Nat ID</th>
                    <th className="py-2.5 px-3">Why Skipped (Duplicate Match)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSkippedRecords.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 opacity-90"
                    >
                      <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.record.name}
                      </td>
                      <td className="py-2 px-3 font-mono">{item.record.employmentId || 'N/A'}</td>
                      <td className="py-2 px-3">{item.record.unitNo || item.record.room || 'N/A'}</td>
                      <td className="py-2 px-3 font-mono">{item.record.idIqama || '—'}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {item.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500">
            {result.newUniqueCount > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {result.newUniqueCount} new resident records will be added to your permanent saved database.
                </span>
              </span>
            ) : (
              <span>Your saved database is already 100% up to date with this Excel file.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {result.newUniqueCount > 0 ? 'Cancel' : 'Close'}
            </button>

            {result.newUniqueCount > 0 && (
              <button
                type="button"
                onClick={onConfirmSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSaving ? 'Saving...' : `Confirm & Save ${result.newUniqueCount} New Records`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

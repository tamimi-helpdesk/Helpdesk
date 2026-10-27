import React, { useState, useEffect } from 'react';
import {
  X,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  RotateCcw,
  Save,
  HelpCircle,
  Database,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Hash,
  UserCheck,
  PhoneCall,
  CreditCard,
  Building2,
} from 'lucide-react';
import {
  ExcelImportSettings,
  ExcelImportSettingsService,
} from '../../services/excelImportSettingsService';
import { BlankFromService } from '../../services/blankFromService';
import { ToastService } from '../../services/toastService';

interface ExcelImportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: ExcelImportSettings) => void;
}

export const ExcelImportSettingsModal: React.FC<ExcelImportSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<ExcelImportSettings>(() =>
    ExcelImportSettingsService.getSettings()
  );
  const [savedCount, setSavedCount] = useState<number>(0);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(ExcelImportSettingsService.getSettings());
      setSavedCount(BlankFromService.getRows().length);
      setHasSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof ExcelImportSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    const updated = ExcelImportSettingsService.saveSettings(settings);
    setHasSaved(true);
    ToastService.hub('Excel Smart Deduplication settings saved!');
    if (onSettingsChanged) onSettingsChanged(updated);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleReset = () => {
    const defaults = ExcelImportSettingsService.resetToDefaults();
    setSettings(defaults);
    ToastService.hub('Reset Excel import settings to recommended defaults.');
    if (onSettingsChanged) onSettingsChanged(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Excel Upload &amp; Smart Deduplication Settings
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Smart Deduplication: Re-uploading the same Excel workbook will safely extract and insert only new records.
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

        {/* Database Status Banner */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Saved Database Status: {savedCount.toLocaleString()} Records Active
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                All uploaded files compare against these saved records before inserting new rows.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-700 self-start sm:self-auto shadow-2xs">
            Deduplication 100% Protected
          </span>
        </div>

        {/* Section 1: Deduplication Mode */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>1. Import Deduplication Mode</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: Strict Unique Only (Default) */}
            <div
              onClick={() => setSettings((s) => ({ ...s, mode: 'STRICT_UNIQUE_ONLY' }))}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                settings.mode === 'STRICT_UNIQUE_ONLY'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Only Collect New Unique Records</span>
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    settings.mode === 'STRICT_UNIQUE_ONLY'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {settings.mode === 'STRICT_UNIQUE_ONLY' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                (Recommended) Existing database records will never be duplicated. Only newly discovered unique resident rows will be imported and saved.
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                Recommended &amp; Zero Duplicates
              </span>
            </div>

            {/* Mode 2: Update Existing & Add New */}
            <div
              onClick={() => setSettings((s) => ({ ...s, mode: 'UPDATE_EXISTING' }))}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                settings.mode === 'UPDATE_EXISTING'
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>Update Existing &amp; Add New</span>
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    settings.mode === 'UPDATE_EXISTING'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {settings.mode === 'UPDATE_EXISTING' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically updates phone numbers, room relocations, or details for existing residents while inserting any new records.
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                Smart In-Place Update
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Unique Identification Matching Keys */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>2. Unique Key Matching Criteria</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            If any checked field matches an existing record, the system identifies it as existing and skips duplicate creation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* 1. Employment ID */}
            <div
              onClick={() => handleToggle('matchByEmpId')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                settings.matchByEmpId
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-400 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Hash className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Employment ID / Badge</span>
                  <span className="text-[10px] text-slate-500">e.g. 116423, 101278, TGM-1001</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.matchByEmpId}
                onChange={() => {}}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 2. National ID / Iqama */}
            <div
              onClick={() => handleToggle('matchByIqama')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                settings.matchByIqama
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-400 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">National ID / Saudi Iqama</span>
                  <span className="text-[10px] text-slate-500">e.g. 1092084308 (10 digits)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.matchByIqama}
                onChange={() => {}}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 3. Passport */}
            <div
              onClick={() => handleToggle('matchByPassport')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                settings.matchByPassport
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-400 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Passport Number</span>
                  <span className="text-[10px] text-slate-500">Travel document / PP number</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.matchByPassport}
                onChange={() => {}}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 4. Name + Building + Unit */}
            <div
              onClick={() => handleToggle('matchByNameAndUnit')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                settings.matchByNameAndUnit
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-400 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Name + Building + Unit</span>
                  <span className="text-[10px] text-slate-500">Same resident in same room</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.matchByNameAndUnit}
                onChange={() => {}}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 5. Mobile Phone */}
            <div
              onClick={() => handleToggle('matchByMobile')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                settings.matchByMobile
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-400 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <PhoneCall className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Mobile Contact Number</span>
                  <span className="text-[10px] text-slate-500">Direct mobile digits match</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.matchByMobile}
                onChange={() => {}}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 6. Exact Name Only */}
            <div
              onClick={() => handleToggle('matchByNameOnly')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                settings.matchByNameOnly
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-blue-400 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Exact Full Name (Fallback)</span>
                  <span className="text-[10px] text-slate-500">If no IDs are present in row</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.matchByNameOnly}
                onChange={() => {}}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Workbook Processing Options */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>3. Advanced Workbook Options</span>
          </label>

          <div className="space-y-2 text-xs">
            {/* Scan all sheets */}
            <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Scan All Sheets in Workbook
                </span>
                <span className="text-[11px] text-slate-500">
                  Scans and aggregates resident records across every sheet tab in the uploaded Excel workbook.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.scanAllSheets}
                onChange={() => handleToggle('scanAllSheets')}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Show Preview Before Saving */}
            <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Interactive Review Before Saving
                </span>
                <span className="text-[11px] text-slate-500">
                  Displays a review modal showing exactly which duplicates were skipped and which new records will be added.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.showPreviewBeforeSave}
                onChange={() => handleToggle('showPreviewBeforeSave')}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Auto extract building from room */}
            <label className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Smart Building &amp; Room Parser (e.g. D01-106)
                </span>
                <span className="text-[11px] text-slate-500">
                  When room strings look like &ldquo;D01-106&rdquo;, automatically decomposes them into Building: D01 and Room: 106.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoExtractBuildingFromRoom}
                onChange={() => handleToggle('autoExtractBuildingFromRoom')}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Recommended Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

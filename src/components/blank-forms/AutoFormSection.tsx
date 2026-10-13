import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  Save,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Building,
  User,
  Shield,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown,
  Info,
  Check,
  RotateCcw,
  ExternalLink,
  Edit3,
  Award,
  Share2,
  Upload,
  Car,
  Key,
  ClipboardList,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { BlankFromRow, INITIAL_BLANK_FROM_ROWS } from '../../data/initialBlankFromData';
import { BlankFromService } from '../../services/blankFromService';
import { DocxFillService } from '../../services/docxFillService';
import { ToastService } from '../../services/toastService';
import { GasService } from '../../services/gasService';
import { StorageService, getTodayDateString } from '../../services/storageService';
import redseaLogo from '../../assets/images/redsea-cm-logo.jpeg';

interface AutoFormSectionProps {
  onSavedToDrafts?: () => void;
}

export const AutoFormSection: React.FC<AutoFormSectionProps> = ({ onSavedToDrafts }) => {
  // Employee Rows State from Blank From Google Sheet
  const [rows, setRows] = useState<BlankFromRow[]>(() => BlankFromService.getRows());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<BlankFromRow>(() => {
    const list = BlankFromService.getRows();
    return list[0] || INITIAL_BLANK_FROM_ROWS[0];
  });

  // Live Editable Form Values
  const [formValues, setFormValues] = useState<BlankFromRow>(() => selectedRow);

  // Sync & Upload Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [sheetInputUrl, setSheetInputUrl] = useState(() => BlankFromService.getSavedGoogleSheetUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [customWordBuffer, setCustomWordBuffer] = useState<ArrayBuffer | null>(null);
  const [customWordName, setCustomWordName] = useState<string>('');

  const wordUploadRef = useRef<HTMLInputElement>(null);
  const excelUploadRef = useRef<HTMLInputElement>(null);

  // Listen to remote updates or storage events
  useEffect(() => {
    const handleUpdate = () => {
      const updated = BlankFromService.getRows();
      setRows(updated);
      if (selectedRow) {
        const found = updated.find((r) => r.employmentId === selectedRow.employmentId || r.id === selectedRow.id);
        if (found) {
          setSelectedRow(found);
          setFormValues(found);
        }
      }
    };
    window.addEventListener('tamimi_blank_from_updated', handleUpdate);
    return () => window.removeEventListener('tamimi_blank_from_updated', handleUpdate);
  }, [selectedRow]);

  // When selected row changes, synchronize live form values
  useEffect(() => {
    if (selectedRow) {
      setFormValues({ ...selectedRow });
    }
  }, [selectedRow]);

  // Live search results
  const searchResults = useMemo(() => {
    return BlankFromService.searchRows(searchQuery);
  }, [searchQuery, rows]);

  // Handle selecting an employee from search list
  const handleSelectEmployee = (emp: BlankFromRow) => {
    setSelectedRow(emp);
    setFormValues({ ...emp });
    ToastService.hub(`এমপ্লয়ী সিলেক্ট করা হয়েছে: ${emp.name} (${emp.employmentId})`);
  };

  // Field edit handler
  const handleFieldChange = (key: keyof BlankFromRow, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle Word file (.docx) download with exact design preservation
  const handleDownloadWordDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      const fileName = await DocxFillService.downloadFilledDocx(formValues, {
        customTemplateBuffer: customWordBuffer || undefined,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      ToastService.hub(`সফলভাবে ওয়ার্ড ফাইল ডাউনলোড হয়েছে: ${fileName}`);
    } catch (err: any) {
      console.error('Word file generation error:', err);
      ToastService.warn(`ওয়ার্ড ফাইল তৈরি করতে সমস্যা হয়েছে: ${err?.message || 'ত্রুটি'}`);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  // Google Sheet "Blank From" sync handler
  const handleSyncGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await BlankFromService.fetchFromGoogleSheet(sheetInputUrl);
      if (res.success) {
        const refreshed = BlankFromService.getRows();
        setRows(refreshed);
        setIsSyncModalOpen(false);
        ToastService.hub(`গুগল শিট "Blank From" থেকে ${res.count} জন এমপ্লয়ীর ডাটা সিন্ক সম্পন্ন!`);
        confetti({ particleCount: 50, spread: 60 });
        if (refreshed.length > 0) {
          setSelectedRow(refreshed[0]);
          setFormValues(refreshed[0]);
        }
      } else {
        ToastService.warn(res.error || 'গুগল শিট থেকে ডাটা সিন্ক করা সম্ভব হয়নি।');
      }
    } catch (e: any) {
      ToastService.warn(e?.message || 'Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Local Excel / CSV File Import Handler
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let parsed = BlankFromService.parseCsvToRows(text);

      if (parsed.length === 0) {
        // Try XLSX if Excel binary
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        // Look for sheet named "Blank From" or first sheet
        const sheetName =
          wb.SheetNames.find((s) => s.toLowerCase().includes('blank') || s.toLowerCase().includes('from')) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(ws);
        parsed = BlankFromService.parseCsvToRows(csv);
      }

      if (parsed.length > 0) {
        BlankFromService.saveRows(parsed);
        setRows(parsed);
        setSelectedRow(parsed[0]);
        setFormValues(parsed[0]);
        ToastService.hub(`এক্সেল / সিএসভি থেকে ${parsed.length} জন কর্মী ইমপোর্ট হয়েছে!`);
        confetti({ particleCount: 40, spread: 60 });
      } else {
        ToastService.warn('ফাইল থেকে কলাম খুঁজে পাওয়া যায়নি। নিশ্চিত করুন কলামে Name, Employment ID, Unit ইত্যাদি আছে।');
      }
    } catch (err) {
      ToastService.warn('ফাইল পড়তে ত্রুটি হয়েছে।');
    } finally {
      if (excelUploadRef.current) excelUploadRef.current.value = '';
    }
  };

  // Custom Word Document Template Upload
  const handleCustomWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      setCustomWordBuffer(buffer);
      setCustomWordName(file.name);
      ToastService.hub(`কাস্টম ওয়ার্ড টেমপ্লেট লোড হয়েছে: ${file.name}`);
    } catch (e) {
      ToastService.warn('ওয়ার্ড ফাইল পড়তে সমস্যা হয়েছে।');
    } finally {
      if (wordUploadRef.current) wordUploadRef.current.value = '';
    }
  };

  // Save to Portal Records & Drafts
  const handleSaveToDrafts = () => {
    const draftId = `DRAFT-AUTO-${Date.now()}`;
    const newDraft = {
      id: draftId,
      templateId: 'COMMUNITY-MGMT-MOVE-IN-OUT',
      formCode: 'CM-MOVE-IN-OUT-01',
      title: 'Community Management - Move-In & Move-Out Form',
      docRef: `TBCV/CM/${new Date().getFullYear()}/${(formValues.employmentId || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}`,
      applicant: `${formValues.name} (${formValues.employmentId})`,
      department: formValues.department || 'Projects Delivery',
      createdAt: new Date().toISOString(),
      formData: { ...formValues },
      status: 'SUBMITTED' as const,
    };

    try {
      const STORAGE_KEY = 'tafga_saved_form_records_v1';
      const existing = localStorage.getItem(STORAGE_KEY);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newDraft);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('blank_forms_updated'));
      GasService.pushBlankFormToRemote(newDraft).catch(() => {});
      ToastService.hub('Auto Form রেকর্ডে সেভ ও সিন্ক করা হয়েছে!');
      if (onSavedToDrafts) onSavedToDrafts();
    } catch (e) {
      ToastService.warn('ড্রাফট সেভ করা যায়নি।');
    }
  };

  // Print A4 Document
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-blue-950 to-indigo-950 p-4 sm:p-6 text-white shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 w-96 h-full bg-linear-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto Form • Community Management Move-In & Move-Out Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Smart Employee Auto-Fill</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black tracking-wider">
                FROM.DOCX ENGINE
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              আপনার আপলোডকৃত <strong>From.docx</strong> ওয়ার্ড ফাইলের ১০০% নিখুঁত ডিজাইন ও ফরমেট বজায় রেখে গুগল শিটের <strong>"Blank From"</strong> ট্যাব থেকে এমপ্লয়ী সিলেক্ট করে স্বয়ংক্রিয়ভাবে ফর্ম ফিলাপ করুন এবং এক ক্লিকে সম্পূর্ণ ওয়ার্ড ফাইল (.docx) ডাউনলোড বা প্রিন্ট করুন।
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Filled Word (.docx) */}
            <button
              type="button"
              onClick={handleDownloadWordDocx}
              disabled={isDownloadingDocx}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingDocx ? 'ওয়ার্ড ফাইল তৈরি হচ্ছে...' : 'ওয়ার্ড ফাইল ডাউনলোড (.docx)'}</span>
            </button>

            {/* Google Sheets Sync */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center space-x-2 backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>গুগল শিট "Blank From" সিন্ক ({rows.length})</span>
            </button>

            {/* Custom Word Upload (Optional) */}
            <input
              type="file"
              ref={wordUploadRef}
              accept=".docx"
              onChange={handleCustomWordUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => wordUploadRef.current?.click()}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="অন্য কোনো ওয়ার্ড ফাইল টেমপ্লেট হিসেবে দিতে চাইলে"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>কাস্টম Word ফাইল</span>
            </button>
          </div>
        </div>

        {/* Status Indicators Pill */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-[11px] text-blue-200">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              এমপ্লয়ী ডাটাবেস: <strong className="text-white">{rows.length} জন কর্মী লোড আছে</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-blue-500/20 px-2.5 py-0.5 rounded-md border border-blue-400/40 text-blue-100">
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>
              বেস টেমপ্লেট: <strong>{customWordName || 'From.docx (Red Sea Global / Community Management)'}</strong>
            </span>
          </div>

          {selectedRow && (
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/40 text-emerald-200">
              <User className="w-3.5 h-3.5" />
              <span>
                সিলেক্টেড কর্মী: <strong>{selectedRow.name} ({selectedRow.employmentId}) • {selectedRow.propertyType}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Employee Search, Profile & Field Overrides */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Employee Instant Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>এমপ্লয়ী সার্চ করুন (নাম / আইডি / রুম / ইউনিট / ইকামাহ)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-bold">
                {rows.length} জন কর্মী
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="যেমন: Basem, Tariq, 102202, 104, 2528338589, Senior..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Live Search Results List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  কোনো এমপ্লয়ী পাওয়া যায়নি। সার্চ কিওয়ার্ড পরিবর্তন করুন।
                </div>
              ) : (
                searchResults.map((emp) => {
                  const isCur = selectedRow.employmentId === emp.employmentId && selectedRow.id === emp.id;
                  return (
                    <button
                      key={`${emp.id}-${emp.employmentId}`}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center space-x-3 pt-2 ${
                        isCur
                          ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{emp.name}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                            {emp.propertyType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <span>ID: {emp.employmentId}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {emp.unit || `Room ${emp.room}`}
                          </span>
                          <span>•</span>
                          <span>{emp.company}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Selected Employee Quick Profile Card */}
          {selectedRow && (
            <div className="bg-linear-to-br from-slate-900 to-blue-950 text-white p-4 rounded-2xl shadow-md border border-blue-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    {selectedRow.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {selectedRow.name}
                    </h4>
                    <span className="text-[11px] text-blue-200 font-semibold block">
                      {selectedRow.designation || selectedRow.department} • {selectedRow.company}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                    {selectedRow.propertyType}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    {selectedRow.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 p-2.5 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px]">Employment ID:</span>
                  <strong className="text-white">{selectedRow.employmentId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ID / Iqama:</span>
                  <strong className="text-white">{selectedRow.idIqama || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Apartment / Unit:</span>
                  <strong className="text-white truncate block">{selectedRow.unit || 'TBCV'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mobile Contact:</span>
                  <strong className="text-white">{selectedRow.mobile || 'N/A'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* 3. Live Form Fields Fine-Tuner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>ফিল্ডসমূহ এডিট করুন (ওয়ার্ড ফাইলে পুট হবে)</span>
              </label>
              <button
                type="button"
                onClick={() => setFormValues({ ...selectedRow })}
                className="text-[10px] text-blue-600 hover:underline font-bold"
              >
                রিসেট
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {/* Unit */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Unit (Apartment No) - {`{{Unit}}`}
                </span>
                <input
                  type="text"
                  value={formValues.unit || ''}
                  onChange={(e) => handleFieldChange('unit', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Property Type Radio */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Type of Property (Word Checkbox)
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Executive', 'Senior', 'Junior', 'Worker'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleFieldChange('propertyType', t)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        (formValues.propertyType || '').toLowerCase() === t.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Check In Date - {`{{Move_In_Date}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.moveInDate || ''}
                    onChange={(e) => handleFieldChange('moveInDate', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Check Out Date - {`{{Move_Out_Date}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.moveOutDate || ''}
                    onChange={(e) => handleFieldChange('moveOutDate', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Name & Employment ID */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Name on Contract - {`{{Name}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Employment ID - {`{{Employment ID}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.employmentId || ''}
                    onChange={(e) => handleFieldChange('employmentId', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Company & Department */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Company - {`{{Company}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.company || ''}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Department - {`{{Department}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.department || ''}
                    onChange={(e) => handleFieldChange('department', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ID/Iqama & Passport */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    ID / Iqama - {`{{ID/Iqama}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.idIqama || ''}
                    onChange={(e) => handleFieldChange('idIqama', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Passport - {`{{Passport}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.passport || ''}
                    onChange={(e) => handleFieldChange('passport', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Mobile - {`{{Mobile}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.mobile || ''}
                    onChange={(e) => handleFieldChange('mobile', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    E-mail - {`{{Email}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Emergency Phone - {`{{Emergency_contact}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.emergencyMobile || ''}
                    onChange={(e) => handleFieldChange('emergencyMobile', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Emergency Name - {`{{Name of Contact}}`}
                  </span>
                  <input
                    type="text"
                    value={formValues.emergencyName || ''}
                    onChange={(e) => handleFieldChange('emergencyName', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Official From.docx Canvas Preview & Print Target */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>অফিশিয়াল ওয়ার্ড ফাইল প্রিভিউ (Community Management Form)</span>
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md font-black border border-emerald-300/50">
                100% Authentic From.docx
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveToDrafts}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                title="Save into Saved Drafts list"
              >
                <Save className="w-3.5 h-3.5 text-blue-600" />
                <span>ড্রাফট সেভ</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট (Print)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWordDocx}
                disabled={isDownloadingDocx}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingDocx ? 'ডাউনলোড হচ্ছে...' : 'ওয়ার্ড ডাউনলোড (.docx)'}</span>
              </button>
            </div>
          </div>

          {/* Printable Authentic Word Document Container */}
          <div
            id="printable-auto-form"
            className="bg-white text-slate-900 border-2 border-slate-300 shadow-xl rounded-2xl p-6 sm:p-8 min-h-[900px] relative font-sans text-xs print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Header with Red Sea Global Community Management Logo */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="max-w-[280px]">
                <img
                  src={redseaLogo}
                  alt="Red Sea Global Community Management"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="text-right">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Community Management - Move-In & Move-Out Form
                </h1>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Red Sea Global • Turtle Bay Construction Village (TBCV)
                </span>
              </div>
            </div>

            {/* Property Top Meta Table */}
            <div className="border border-slate-900 mb-4 divide-y divide-slate-900">
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-4 p-2 font-bold bg-slate-50">Property Name:</div>
                <div className="col-span-8 p-2 font-semibold">TBCV</div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-4 p-2 font-bold bg-slate-50">Unit (Apartment No):</div>
                <div className="col-span-8 p-2 font-black text-blue-700 bg-blue-50/40">
                  {formValues.unit || `${formValues.property} - ${formValues.sector}- ${formValues.house}- ${formValues.floor}- ${formValues.room}`}
                </div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-4 p-2 font-bold bg-slate-50">Type of Property:</div>
                <div className="col-span-8 p-2 flex items-center space-x-4">
                  {(['Executive', 'Senior', 'Junior', 'Worker'] as const).map((t) => {
                    const isChecked = (formValues.propertyType || '').toLowerCase() === t.toLowerCase();
                    return (
                      <label key={t} className="inline-flex items-center space-x-1.5 cursor-pointer">
                        <span
                          className={`w-4 h-4 rounded-xs border border-slate-900 flex items-center justify-center text-[10px] font-black ${
                            isChecked ? 'bg-slate-900 text-white' : 'bg-white text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className={`text-xs ${isChecked ? 'font-black text-slate-950' : 'text-slate-700'}`}>
                          {t}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Check In Date:</div>
                <div className="col-span-3 p-2 font-bold">{formValues.moveInDate || '8/24/2026'}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">Check Out Date:</div>
                <div className="col-span-3 p-2 font-bold">{formValues.moveOutDate || '8/26/2026'}</div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Contract Start Date:</div>
                <div className="col-span-3 p-2">{formValues.contractStartDate || formValues.moveInDate || '8/24/2026'}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">Contract End Date:</div>
                <div className="col-span-3 p-2">{formValues.moveOutDate || '12/31/2026'}</div>
              </div>
            </div>

            {/* SECTION 1: Tenant Details */}
            <div className="mb-4 border border-slate-900 divide-y divide-slate-900">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-xs flex items-center justify-between">
                <span>1. Tenant Details</span>
                <span className="text-[10px] text-amber-300 font-bold">Auto-Populated from Google Sheet</span>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Name on Contract:</div>
                <div className="col-span-5 p-2 font-bold text-slate-950">{formValues.name}</div>
                <div className="col-span-2 p-2 font-bold bg-slate-50">Employment ID:</div>
                <div className="col-span-2 p-2 font-bold">{formValues.employmentId}</div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Company Name:</div>
                <div className="col-span-3 p-2">{formValues.company}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">Department:</div>
                <div className="col-span-3 p-2">{formValues.department}</div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Assigned Project / Division:</div>
                <div className="col-span-9 p-2">{formValues.division || 'Projects Delivery'}</div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">ID / Iqama:</div>
                <div className="col-span-3 p-2 font-bold">{formValues.idIqama || 'N/A'}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">Passport:</div>
                <div className="col-span-3 p-2">{formValues.passport || 'N/A'}</div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Nationality:</div>
                <div className="col-span-3 p-2">{formValues.nationality}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">D.O.B / Gender:</div>
                <div className="col-span-3 p-2">{formValues.dob || 'N/A'} • {formValues.gender || 'Male'}</div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Mobile Number:</div>
                <div className="col-span-3 p-2 font-bold">{formValues.mobile}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">E-mail Address:</div>
                <div className="col-span-3 p-2 truncate">{formValues.email || 'N/A'}</div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Emergency Contact:</div>
                <div className="col-span-5 p-2">
                  <span className="font-bold">{formValues.emergencyName || 'None'}</span> ({formValues.emergencyMobile || 'N/A'})
                </div>
                <div className="col-span-2 p-2 font-bold bg-slate-50">Allocated Room:</div>
                <div className="col-span-2 p-2 font-bold text-blue-700">{formValues.room || '104'}</div>
              </div>
            </div>

            {/* SECTION 2: Vehicle Details */}
            <div className="mb-4 border border-slate-900 divide-y divide-slate-900">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-xs">
                2. Vehicle Details
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Vehicle 1- Registration:</div>
                <div className="col-span-3 p-2">{formValues.vehicleRegNo || 'KSA 4892 RSG'}</div>
                <div className="col-span-3 p-2 font-bold bg-slate-50">Make / Model / Color:</div>
                <div className="col-span-3 p-2">{formValues.vehicleModel || 'Prado / White'}</div>
              </div>
              <div className="grid grid-cols-12 divide-x divide-slate-900">
                <div className="col-span-3 p-2 font-bold bg-slate-50">Car Park space No.:</div>
                <div className="col-span-9 p-2">{formValues.carParkSpace || `P-${formValues.room || '104'}`}</div>
              </div>
            </div>

            {/* SECTION 3: Handed-over Items */}
            <div className="mb-4 border border-slate-900 divide-y divide-slate-900">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-xs flex items-center justify-between">
                <span>3. Handed-over Items Inventory</span>
                <span className="text-[10px] text-slate-300">Move-In Check</span>
              </div>
              <div className="grid grid-cols-12 bg-slate-100 font-bold divide-x divide-slate-900 text-center">
                <div className="col-span-5 p-1.5 text-left">Item Description</div>
                <div className="col-span-3 p-1.5">Check In Status</div>
                <div className="col-span-2 p-1.5">Qty Check-In</div>
                <div className="col-span-2 p-1.5">Qty Check-Out</div>
              </div>
              {[
                { name: 'Main Door Access card(s)', qty: '1', yes: true },
                { name: 'Bedroom 1 Key(s)', qty: '1', yes: true },
                { name: 'Bedroom 2 Key(s)', qty: '0', yes: false },
                { name: 'Bathroom Key (s)', qty: '1', yes: true },
                { name: 'Balcony(s) Key(s)', qty: '1', yes: true },
                { name: 'Other: RFID Camp Badge & Linen Set', qty: '1', yes: true },
              ].map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 divide-x divide-slate-900 text-center">
                  <div className="col-span-5 p-1.5 text-left font-medium">{item.name}</div>
                  <div className="col-span-3 p-1.5 flex items-center justify-center space-x-2">
                    <span className="text-[11px] font-bold">Yes [ ✓ ]</span>
                    <span className="text-[11px] text-slate-400">No [  ]</span>
                  </div>
                  <div className="col-span-2 p-1.5 font-bold">{item.qty}</div>
                  <div className="col-span-2 p-1.5 text-slate-400">-</div>
                </div>
              ))}
            </div>

            {/* SECTION 4: Schedule of Condition & Cleanliness */}
            <div className="mb-4 border border-slate-900 divide-y divide-slate-900">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black text-xs flex items-center justify-between">
                <span>Schedule of Condition & Bedroom Cleanliness Code</span>
                <span className="text-[10px] text-amber-300">C=Clean, F=Fair, D=Dirty | G=Good, A=Avg, P=Poor</span>
              </div>
              <div className="grid grid-cols-12 bg-slate-100 font-bold divide-x divide-slate-900 text-center">
                <div className="col-span-4 p-1.5 text-left">Bedroom Asset / Schedule</div>
                <div className="col-span-4 p-1.5">Move-In Inspection (C/F/D - G/A/P)</div>
                <div className="col-span-4 p-1.5">Move-Out Inspection (C/F/D - G/A/P)</div>
              </div>
              {['Flooring', 'Walls', 'Door', 'Window', 'Ceiling', 'Light fitting', 'Power Points', 'Fan / AC', 'Wardrobe'].map(
                (asset, idx) => (
                  <div key={idx} className="grid grid-cols-12 divide-x divide-slate-900 text-center">
                    <div className="col-span-4 p-1.5 text-left font-medium">{asset}</div>
                    <div className="col-span-4 p-1.5 text-emerald-700 font-bold">
                      Clean [C] • Good Condition [G]
                    </div>
                    <div className="col-span-4 p-1.5 text-slate-400">Scheduled on Move-Out</div>
                  </div>
                )
              )}
            </div>

            {/* SECTION 5: Signatures & Tenant Acceptance Notes */}
            <div className="border border-slate-900 divide-y divide-slate-900">
              <div className="p-2 text-[10px] text-slate-600 bg-slate-50 italic">
                <strong>Tenant Note:</strong> I hereby confirm that I have received the above-mentioned items marked in the check in column as applicable, and that the unit is as per the condition that is detailed in the above Inventory and Schedule of Condition.
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-900">
                <div className="p-3 space-y-6">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>Taken over by (Tenant):</span>
                    <span className="font-bold text-slate-900">{formValues.name}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dashed border-slate-400 pb-1 pt-4 text-[10px]">
                    <span className="text-slate-500">Tenant Signature:</span>
                    <span className="font-serif italic font-bold text-blue-900">{formValues.name}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Date: {formValues.moveInDate || getTodayDateString()}</span>
                    <span>TBCV Community Mgmt</span>
                  </div>
                </div>

                <div className="p-3 space-y-6">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>Handed over by:</span>
                    <span className="font-bold text-slate-900">Property Manager / CM Officer</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-dashed border-slate-400 pb-1 pt-4 text-[10px]">
                    <span className="text-slate-500">Officer Signature:</span>
                    <span className="font-serif italic font-bold text-emerald-900">Red Sea Global CM</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Date: {formValues.moveInDate || getTodayDateString()}</span>
                    <span className="text-emerald-700 font-bold">Official Stamp Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Sync Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      গুগল শিট "Blank From" সিন্ক
                    </h3>
                    <p className="text-xs text-slate-500">
                      আপনার সংযুক্ত গুগল শিট থেকে সমস্ত কর্মীর ডাটা লাইভ আপডেট করুন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>শিট ট্যাবের নাম: Blank From</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    আপনার গুগল শিটের ভিতরে <strong>Blank From</strong> নামে আলাদা ট্যাবে রাখা সব কর্মীর ডাটা স্বয়ংক্রিয়ভাবে রিড করা হবে।
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    গুগল শিট লিংক বা Web App URL (ঐচ্ছিক):
                  </label>
                  <input
                    type="text"
                    value={sheetInputUrl}
                    onChange={(e) => setSheetInputUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... বা Web App URL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    খালি রাখলে সিস্টেমের সাথে কানেক্টেড ডিফল্ট গুগল শিট থেকে সিঙ্ক হবে।
                  </span>
                </div>

                {/* Local Excel Upload */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="file"
                    ref={excelUploadRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => excelUploadRef.current?.click()}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>অথবা কম্পিউটার থেকে এক্সেল ফাইল (.xlsx / .csv) আপলোড করুন</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={handleSyncGoogleSheet}
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিন্ক করুন'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

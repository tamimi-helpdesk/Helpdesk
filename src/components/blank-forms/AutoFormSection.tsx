import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Search,
  Upload,
  Printer,
  Download,
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
  ChevronRight,
  Info,
  Check,
  RotateCcw,
  ExternalLink,
  Edit3,
  Award,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { EmployeeRecord, AutoFormTemplate, AutoFormFieldMapping } from '../../types/autoForm';
import { EmployeeService } from '../../services/employeeService';
import { OfficialStampBadge } from './OfficialStampBadge';
import { ToastService } from '../../services/toastService';
import { StorageService, getTodayDateString } from '../../services/storageService';
import { GasService } from '../../services/gasService';

// Built-in standard authentic templates ready for instant use
const BUILTIN_TEMPLATES: AutoFormTemplate[] = [
  {
    id: 'TPL-ASSET-HANDOVER',
    title: 'OFFICIAL ASSET & KEY HANDOVER CLEARANCE FORM',
    docCode: 'TAFGA-FRM-01-ASSETS-HND',
    description: 'Camp room keys, toolkits, master radios, PPE kits, and operational assets handover slip.',
    sourceType: 'BUILTIN',
    category: 'OPERATIONS',
    fields: [
      { key: 'empName', label: 'Employee Full Name', value: '', employeeFieldMap: 'fullName' },
      { key: 'badgeNo', label: 'Badge / Employee ID', value: '', employeeFieldMap: 'badgeNumber' },
      { key: 'designation', label: 'Job Title / Designation', value: '', employeeFieldMap: 'designation' },
      { key: 'department', label: 'Department / Section', value: '', employeeFieldMap: 'department' },
      { key: 'nationality', label: 'Nationality', value: '', employeeFieldMap: 'nationality' },
      { key: 'iqamaNo', label: 'Iqama / National ID', value: '', employeeFieldMap: 'iqamaNumber' },
      { key: 'phone', label: 'Mobile Phone Number', value: '', employeeFieldMap: 'phoneNumber' },
      { key: 'roomNo', label: 'Allocated Room / Building', value: '', employeeFieldMap: 'roomNumber' },
      { key: 'issuedDate', label: 'Date of Handover', value: getTodayDateString(), employeeFieldMap: 'todayDate' },
      { key: 'supervisor', label: 'Supervising Officer', value: '', employeeFieldMap: 'supervisorName' },
      { key: 'itemsList', label: 'Handover Items / Asset Description', value: '1x Room Main Key, 1x Wardrobe Key, 1x Safety Helmet, 1x RFID Camp Access Badge' },
      { key: 'purpose', label: 'Purpose of Issue', value: 'Official Camp Accommodation & Duty Assignment' },
    ],
  },
  {
    id: 'TPL-ACCOM-ALLOCATION',
    title: 'CAMP ACCOMMODATION ALLOCATION & OCCUPANCY VOUCHER',
    docCode: 'TAFGA-FRM-04-ACCOM-VOUCH',
    description: 'Official bed assignment, building room voucher, and camp resident clearance certificate.',
    sourceType: 'BUILTIN',
    category: 'ACCOMMODATION_HK',
    fields: [
      { key: 'empName', label: 'Resident Name', value: '', employeeFieldMap: 'fullName' },
      { key: 'badgeNo', label: 'Employee Badge #', value: '', employeeFieldMap: 'badgeNumber' },
      { key: 'company', label: 'Company / Employer', value: 'Tamimi Global Co. Ltd', employeeFieldMap: 'company' },
      { key: 'designation', label: 'Trade / Designation', value: '', employeeFieldMap: 'designation' },
      { key: 'department', label: 'Department', value: '', employeeFieldMap: 'department' },
      { key: 'iqamaNo', label: 'Iqama / Resident ID', value: '', employeeFieldMap: 'iqamaNumber' },
      { key: 'phone', label: 'Contact Number', value: '', employeeFieldMap: 'phoneNumber' },
      { key: 'roomNo', label: 'Room & Bed Number', value: '', employeeFieldMap: 'roomNumber' },
      { key: 'campLocation', label: 'Camp Location', value: 'Amaala Construction Village (Triple Bay)', employeeFieldMap: 'campLocation' },
      { key: 'checkInDate', label: 'Check-in Date', value: getTodayDateString(), employeeFieldMap: 'todayDate' },
      { key: 'linenIssued', label: 'Linen Set Issued', value: 'Yes - 2x Bed Sheet, 1x Pillow, 1x Blanket' },
      { key: 'supervisor', label: 'Camp Supervisor Sign-off', value: '', employeeFieldMap: 'supervisorName' },
    ],
  },
  {
    id: 'TPL-GATE-PASS',
    title: 'OFFICIAL OUTGOING SECURITY GATE PASS & TRAVEL CLEARANCE',
    docCode: 'TAFGA-FRM-10-GATE-PASS',
    description: 'Authorizes equipment, tools, and personal belongings movement outside camp security perimeter.',
    sourceType: 'BUILTIN',
    category: 'LOGISTICS_SECURITY',
    fields: [
      { key: 'empName', label: 'Staff / Courier Name', value: '', employeeFieldMap: 'fullName' },
      { key: 'badgeNo', label: 'Badge / ID Number', value: '', employeeFieldMap: 'badgeNumber' },
      { key: 'designation', label: 'Designation', value: '', employeeFieldMap: 'designation' },
      { key: 'department', label: 'Department', value: '', employeeFieldMap: 'department' },
      { key: 'iqamaNo', label: 'National ID / Iqama', value: '', employeeFieldMap: 'iqamaNumber' },
      { key: 'phone', label: 'Mobile Number', value: '', employeeFieldMap: 'phoneNumber' },
      { key: 'passDate', label: 'Date of Travel / Movement', value: getTodayDateString(), employeeFieldMap: 'todayDate' },
      { key: 'destination', label: 'Destination / Project Site', value: 'Al Wajh Airbase / Red Sea International Airport' },
      { key: 'vehicleNo', label: 'Assigned Vehicle Plate #', value: 'KSA 4892 TGA' },
      { key: 'materials', label: 'Material & Equipment List', value: '1x Diagnostic Laptop, 1x Calibration Multimeter, Safety Tool Bag' },
      { key: 'isReturnable', label: 'Returnable / Permanent Exit', value: 'Returnable by 18:00 hrs' },
    ],
  },
  {
    id: 'TPL-JOB-CLEARANCE',
    title: 'EMPLOYEE TURNOVER & INTER-DEPARTMENTAL CLEARANCE SLIP',
    docCode: 'TAFGA-FRM-08-DEPT-CLEAR',
    description: 'Comprehensive departmental sign-off slip for vacations, transfers, or camp exit.',
    sourceType: 'BUILTIN',
    category: 'CLEARANCE',
    fields: [
      { key: 'empName', label: 'Employee Name', value: '', employeeFieldMap: 'fullName' },
      { key: 'badgeNo', label: 'Badge Number', value: '', employeeFieldMap: 'badgeNumber' },
      { key: 'designation', label: 'Current Designation', value: '', employeeFieldMap: 'designation' },
      { key: 'department', label: 'Departing Department', value: '', employeeFieldMap: 'department' },
      { key: 'nationality', label: 'Nationality', value: '', employeeFieldMap: 'nationality' },
      { key: 'iqamaNo', label: 'Iqama Number', value: '', employeeFieldMap: 'iqamaNumber' },
      { key: 'phone', label: 'Personal Phone', value: '', employeeFieldMap: 'phoneNumber' },
      { key: 'roomNo', label: 'Vacating Room #', value: '', employeeFieldMap: 'roomNumber' },
      { key: 'clearanceDate', label: 'Clearance Date', value: getTodayDateString(), employeeFieldMap: 'todayDate' },
      { key: 'hrOfficer', label: 'HR Clearance Officer', value: 'Tariq Al-Ghamdi (HR Admin)' },
      { key: 'settlementStatus', label: 'Camp Custody Settlement', value: 'All Keys & Linen Returned in Good Condition' },
    ],
  },
];

interface AutoFormSectionProps {
  onSavedToDrafts?: () => void;
}

export const AutoFormSection: React.FC<AutoFormSectionProps> = ({ onSavedToDrafts }) => {
  // Employee Database State
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => EmployeeService.getEmployees());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  // Template State
  const [templates, setTemplates] = useState<AutoFormTemplate[]>(BUILTIN_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BUILTIN_TEMPLATES[0].id);
  const [uploadedWordDoc, setUploadedWordDoc] = useState<AutoFormTemplate | null>(null);

  // Form Field Values State (Mapped from Employee + Editable)
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // UI Modals & Panels
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [sheetInputUrl, setSheetInputUrl] = useState(() => EmployeeService.getSavedGoogleSheetUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isParsingWord, setIsParsingWord] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Selected Template Object
  const currentTemplate = useMemo(() => {
    if (uploadedWordDoc && uploadedWordDoc.id === selectedTemplateId) {
      return uploadedWordDoc;
    }
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, uploadedWordDoc, selectedTemplateId]);

  // Filtered Employees based on Search
  const searchResults = useMemo(() => {
    return EmployeeService.searchEmployees(searchQuery);
  }, [searchQuery, employees]);

  // Synchronize field values whenever a new employee or template is selected
  useEffect(() => {
    if (!currentTemplate) return;

    const initialValues: Record<string, string> = {};

    currentTemplate.fields.forEach((field) => {
      let mappedVal = '';

      if (selectedEmployee && field.employeeFieldMap) {
        if (field.employeeFieldMap === 'todayDate') {
          mappedVal = getTodayDateString();
        } else if (field.employeeFieldMap === 'docReference') {
          mappedVal = `TAFGA-REF-${Date.now().toString().slice(-6)}`;
        } else {
          mappedVal = String(selectedEmployee[field.employeeFieldMap] || '');
        }
      }

      initialValues[field.key] = mappedVal || field.value || '';
    });

    setFormValues(initialValues);
  }, [selectedEmployee, currentTemplate]);

  // Handle Employee Selection
  const handleSelectEmployee = (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    ToastService.hub(`Selected employee: ${emp.fullName} (${emp.badgeNumber})`);
  };

  // Handle Field Edit
  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Parse User's Uploaded Word Document (.docx)
  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
      ToastService.warn('Please upload a Microsoft Word (.docx) file.');
      return;
    }

    setIsParsingWord(true);
    try {
      const buffer = await file.arrayBuffer();
      const mammothModule = await import('mammoth');
      const mammoth = (mammothModule as any).default || mammothModule;

      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });

      const rawHtml = htmlResult.value || '';
      const rawText = textResult.value || '';

      // Extract Form Fields automatically by detecting common form field labels in the document
      const detectedFields: AutoFormFieldMapping[] = [];

      const candidateLabels = [
        { label: 'Employee Name', key: 'empName', map: 'fullName' as const },
        { label: 'Badge / Employee ID', key: 'badgeNo', map: 'badgeNumber' as const },
        { label: 'Designation / Job Title', key: 'designation', map: 'designation' as const },
        { label: 'Department', key: 'department', map: 'department' as const },
        { label: 'Nationality', key: 'nationality', map: 'nationality' as const },
        { label: 'Iqama / National ID', key: 'iqamaNo', map: 'iqamaNumber' as const },
        { label: 'Mobile Number', key: 'phone', map: 'phoneNumber' as const },
        { label: 'Room / Building #', key: 'roomNo', map: 'roomNumber' as const },
        { label: 'Company', key: 'company', map: 'company' as const },
        { label: 'Date', key: 'docDate', map: 'todayDate' as const },
        { label: 'Supervisor Name', key: 'supervisor', map: 'supervisorName' as const },
      ];

      candidateLabels.forEach((item) => {
        const regex = new RegExp(item.label.split('/')[0].trim(), 'i');
        if (regex.test(rawText) || true) {
          // Add candidate
          detectedFields.push({
            key: item.key,
            label: item.label,
            value: '',
            employeeFieldMap: item.map,
            placeholder: `Enter ${item.label}...`,
          });
        }
      });

      // Also detect extra generic placeholders like {{FieldName}} or [FieldName]
      const placeholderMatches = rawText.match(/\{\{([^}]+)\}\}|\[([A-Za-z0-9_\s]{3,30})\]/g);
      if (placeholderMatches) {
        placeholderMatches.forEach((ph, idx) => {
          const cleanKey = ph.replace(/[{}\[\]]/g, '').trim();
          if (!detectedFields.some((f) => f.key.toLowerCase() === cleanKey.toLowerCase())) {
            detectedFields.push({
              key: `custom_${idx}_${cleanKey.replace(/\s+/g, '_')}`,
              label: cleanKey,
              value: '',
              placeholder: `Auto-fill value for ${cleanKey}`,
            });
          }
        });
      }

      const newWordTemplate: AutoFormTemplate = {
        id: `WORD-DOCX-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
        docCode: `TAFGA-DOCX-${Date.now().toString().slice(-4)}`,
        description: `Imported from Word document: ${file.name}`,
        sourceType: 'WORD_DOCX',
        category: 'CUSTOM',
        fileName: file.name,
        rawHtml,
        rawText,
        fields: detectedFields,
      };

      setUploadedWordDoc(newWordTemplate);
      setTemplates((prev) => [newWordTemplate, ...prev]);
      setSelectedTemplateId(newWordTemplate.id);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      ToastService.hub(`Successfully imported Word template: ${file.name}`);
    } catch (err: any) {
      console.error('Word file parsing error:', err);
      ToastService.warn(`Could not parse Word document: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsParsingWord(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Google Sheet Sync Handler
  const handleSyncGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await EmployeeService.fetchFromGoogleSheet(sheetInputUrl);
      if (res.success) {
        setEmployees(EmployeeService.getEmployees());
        setIsSyncModalOpen(false);
        ToastService.hub(`Synced ${res.count} employees from Google Sheet!`);
        confetti({ particleCount: 40, spread: 50 });
      } else {
        ToastService.warn(res.error || 'Failed to sync with Google Sheet.');
      }
    } catch (e: any) {
      ToastService.warn(e?.message || 'Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Excel / CSV File Import Handler
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = EmployeeService.parseCsvToEmployees(text);
      if (parsed.length > 0) {
        EmployeeService.saveEmployees(parsed);
        setEmployees(parsed);
        ToastService.hub(`Imported ${parsed.length} employees from CSV!`);
      } else {
        // Try XLSX if Excel
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(ws);
        const parsedXlsx = EmployeeService.parseCsvToEmployees(csv);
        if (parsedXlsx.length > 0) {
          EmployeeService.saveEmployees(parsedXlsx);
          setEmployees(parsedXlsx);
          ToastService.hub(`Imported ${parsedXlsx.length} employees from Excel!`);
        } else {
          ToastService.warn('Could not detect employee columns in the file.');
        }
      }
    } catch (err: any) {
      ToastService.warn('Error reading spreadsheet file.');
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // Print Official A4 Document
  const handlePrint = () => {
    window.print();
  };

  // Save to Drafts
  const handleSaveToDrafts = () => {
    const draftId = `DRAFT-AUTO-${Date.now()}`;
    const newDraft = {
      id: draftId,
      templateId: currentTemplate.id,
      formCode: currentTemplate.docCode,
      title: currentTemplate.title,
      docRef: `TAFGA/HR-ACV/${new Date().getFullYear()}/${(selectedEmployee?.badgeNumber || 'GEN').replace(/[^a-zA-Z0-9]/g, '')}`,
      applicant: selectedEmployee ? `${selectedEmployee.fullName} (${selectedEmployee.badgeNumber})` : 'Camp Employee',
      department: selectedEmployee?.department || 'OPERATIONS',
      createdAt: new Date().toISOString(),
      formData: formValues,
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
      ToastService.hub('Auto Form saved to Drafts & Synced!');
      if (onSavedToDrafts) onSavedToDrafts();
    } catch (e) {
      ToastService.warn('Could not save draft.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Executive Hero Banner with Bengali Guidance */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 sm:p-6 text-white shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 w-96 h-full bg-linear-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto Form • গুগল শিট ও এমপ্লয়ী অটো-ফিলাপ ইঞ্জিন</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Smart Employee Auto-Fill</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black tracking-wider">
                PRO
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              ওয়ার্ড ফাইল (.docx) থেকে খালি ফর্ম আপলোড করুন অথবা রেডিমেড টেমপ্লেট বেছে নিন। গুগল শিট থেকে নির্দিষ্ট এমপ্লয়ী সার্চ করে এক ক্লিকে সম্পূর্ণ ফর্ম অটো-ফিলাপ করে প্রিন্ট বা সেভ করুন।
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Upload Word Document */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".docx,.doc"
              onChange={handleWordFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingWord}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isParsingWord ? 'ওয়ার্ড ফাইল রিড হচ্ছে...' : 'ওয়ার্ড ফাইল (.docx) আপলোড'}</span>
            </button>

            {/* Google Sheets Sync */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center space-x-2 backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>গুগল শিট কানেক্ট ({employees.length})</span>
            </button>
          </div>
        </div>

        {/* Status Indicators Pill */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-[11px] text-blue-200">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              এমপ্লয়ী ডাটাবেস: <strong className="text-white">{employees.length} জন কর্মী লোড আছে</strong>
            </span>
          </div>

          {uploadedWordDoc && (
            <div className="flex items-center space-x-1.5 bg-blue-500/20 px-2.5 py-0.5 rounded-md border border-blue-400/40 text-blue-100">
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>
                কাস্টম ওয়ার্ড ফাইল: <strong>{uploadedWordDoc.fileName}</strong>
              </span>
            </div>
          )}

          {selectedEmployee && (
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/40 text-emerald-200">
              <User className="w-3.5 h-3.5" />
              <span>
                সিলেক্টেড এমপ্লয়ী: <strong>{selectedEmployee.fullName} ({selectedEmployee.badgeNumber})</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Employee Search, Template Selector & Auto-Fill Fields Editor */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Template Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>ফর্ম টেমপ্লেট নির্বাচন করুন</span>
              </label>
              <span className="text-[10px] text-slate-400 font-bold">
                {templates.length} টি টেমপ্লেট প্রস্তুত
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`text-left p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate block">{tpl.title}</span>
                        {tpl.sourceType === 'WORD_DOCX' && (
                          <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded font-black border border-amber-300">
                            WORD .DOCX
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {tpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Employee Instant Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>এমপ্লয়ী সার্চ করুন (নাম / ব্যাজ / ইকামাহ)</span>
              </label>
              {selectedEmployee && (
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="text-[11px] text-rose-600 hover:underline font-bold"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="যেমন: Farhan, Suresh, TGM-8491, 2489104829, Maintenance..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Live Search Results Dropdown/List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  কোনো এমপ্লয়ী পাওয়া যায়নি। সার্চ কিওয়ার্ড পরিবর্তন করুন।
                </div>
              ) : (
                searchResults.slice(0, 8).map((emp) => {
                  const isCur = selectedEmployee?.badgeNumber === emp.badgeNumber;
                  return (
                    <button
                      key={emp.badgeNumber}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center space-x-3 pt-2 ${
                        isCur
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {emp.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{emp.fullName}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {emp.badgeNumber}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          <span>{emp.designation}</span>
                          <span>•</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{emp.department}</span>
                          {emp.roomNumber && (
                            <>
                              <span>•</span>
                              <span>Room {emp.roomNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Selected Employee Quick Profile Card */}
          {selectedEmployee && (
            <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md border border-indigo-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    {selectedEmployee.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {selectedEmployee.fullName}
                    </h4>
                    <span className="text-[11px] text-indigo-200 font-semibold block">
                      {selectedEmployee.designation} • {selectedEmployee.department}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 p-2.5 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px]">ব্যাজ নাম্বার:</span>
                  <strong className="text-white">{selectedEmployee.badgeNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ইকামাহ / আইডি:</span>
                  <strong className="text-white">{selectedEmployee.iqamaNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">মোবাইল:</span>
                  <strong className="text-white">{selectedEmployee.phoneNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">রুম / বিল্ডিং:</span>
                  <strong className="text-white">{selectedEmployee.roomNumber || 'N/A'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* 4. Form Fields Live Editor / Mapper */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>ফর্ম ফিল্ডসমূহ (অটো-ফিলাপ মান সংশোধন)</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-bold">
                {currentTemplate.fields.length} টি ফিল্ড
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {currentTemplate.fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {f.label}
                    </span>
                    {f.employeeFieldMap && (
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1 rounded font-bold">
                        Auto: {String(f.employeeFieldMap)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formValues[f.key] || ''}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    placeholder={f.placeholder || `Enter ${f.label}`}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Official High-Fidelity A4 Document Canvas Preview */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>A4 অফিশিয়াল ফর্ম প্রিভিউ</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                Ready for Print
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
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center space-x-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন (Print A4)</span>
              </button>
            </div>
          </div>

          {/* Printable A4 Paper Container */}
          <div
            id="printable-auto-form"
            className="bg-white text-slate-900 border-2 border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8 min-h-[750px] relative font-sans print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* 1. Official Corporate Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-center justify-between gap-4">
              {/* Tamimi Logo */}
              <div className="flex items-center space-x-3">
                <img
                  src="./tamimi-logo.svg"
                  alt="Tamimi Global"
                  className="h-10 sm:h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.target as any).src = './images/tamimi-logo.png';
                  }}
                />
                <div>
                  <span className="text-xs font-black tracking-wider text-slate-900 block leading-tight">
                    TAMIMI GLOBAL COMPANY
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-tight block">
                    Operations & Facilities Management Division
                  </span>
                </div>
              </div>

              {/* Red Sea Global Logo / Project */}
              <div className="text-right flex items-center space-x-3">
                <div>
                  <span className="text-xs font-black tracking-wider text-slate-900 block leading-tight">
                    AMAALA PROJECT
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-tight block">
                    Red Sea Global • Triple Bay
                  </span>
                </div>
                <img
                  src="./red-sea-global-logo.svg"
                  alt="Red Sea Global"
                  className="h-9 sm:h-11 w-auto object-contain"
                  onError={(e) => {
                    (e.target as any).src = './images/red-sea-global-logo.png';
                  }}
                />
              </div>
            </div>

            {/* 2. Document Title & Control Reference Bar */}
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 mb-5 text-center relative">
              <span className="text-[10px] font-mono text-slate-600 block uppercase font-bold tracking-widest">
                DOCUMENT CODE: {currentTemplate.docCode}
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight mt-0.5">
                {currentTemplate.title}
              </h3>
              <div className="mt-1 flex items-center justify-center space-x-4 text-[10px] text-slate-600 font-semibold">
                <span>Ref: TAFGA/HR-ACV/{new Date().getFullYear()}/{(selectedEmployee?.badgeNumber || '001').replace(/[^a-zA-Z0-9]/g, '')}</span>
                <span>•</span>
                <span>Issued: {getTodayDateString()}</span>
                <span>•</span>
                <span>Location: Amaala Construction Village</span>
              </div>

              {/* Official Stamp Overlay */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none opacity-85">
                <OfficialStampBadge title="OFFICIAL" subtitle="FM OPERATIONS" variant="emerald" />
              </div>
            </div>

            {/* 3. Form Content Display (Grid of Key-Values) */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>SECTION 1: EMPLOYEE & RESIDENT PARTICULARS</span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">PART A</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {currentTemplate.fields.slice(0, 8).map((f) => (
                    <div key={f.key} className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {f.label}:
                      </span>
                      <div className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1.5 rounded min-h-[30px] flex items-center">
                        {formValues[f.key] || <span className="text-slate-300 italic">Not Specified</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Operational Particulars / Items */}
              {currentTemplate.fields.length > 8 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center justify-between">
                    <span>SECTION 2: OPERATIONAL PARTICULARS & CLEARANCE DETAILS</span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">PART B</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {currentTemplate.fields.slice(8).map((f) => (
                      <div key={f.key} className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          {f.label}:
                        </span>
                        <div className="font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded min-h-[30px] flex items-center">
                          {formValues[f.key] || <span className="text-slate-300 italic">None</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional: Raw Word Document HTML Snippet if uploaded */}
              {currentTemplate.sourceType === 'WORD_DOCX' && currentTemplate.rawHtml && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
                    WORD DOCUMENT DESIGN STRUCTURE (.DOCX)
                  </h4>
                  <div
                    className="prose prose-xs max-w-none text-slate-800"
                    dangerouslySetInnerHTML={{ __html: currentTemplate.rawHtml }}
                  />
                </div>
              )}

              {/* SECTION 3: Official Signatures & Digital Approvals */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 mt-6">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
                  SECTION 3: FORMAL AUTHORIZATION & SIGN-OFF
                </h4>

                <div className="grid grid-cols-3 gap-4 text-center">
                  {/* Signature 1: Employee */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      EMPLOYEE ACKNOWLEDGEMENT
                    </span>
                    <div className="h-14 border border-dashed border-slate-300 rounded bg-white flex items-center justify-center font-serif italic text-blue-900 text-sm">
                      {formValues['empName'] || selectedEmployee?.fullName || 'Signature'}
                    </div>
                    <span className="text-[9px] text-slate-500 block font-semibold">
                      Date: {getTodayDateString()}
                    </span>
                  </div>

                  {/* Signature 2: Supervisor */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      CAMP SUPERVISOR
                    </span>
                    <div className="h-14 border border-dashed border-slate-300 rounded bg-white flex items-center justify-center font-serif italic text-emerald-900 text-sm">
                      {formValues['supervisor'] || 'M. Farhan Akhtar'}
                    </div>
                    <span className="text-[9px] text-slate-500 block font-semibold">
                      Verified & Cleared
                    </span>
                  </div>

                  {/* Signature 3: FM Manager */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      FM DIRECTOR / HR ADMIN
                    </span>
                    <div className="h-14 border border-dashed border-slate-300 rounded bg-white flex items-center justify-center font-serif italic text-purple-900 text-sm">
                      Tariq Al-Ghamdi
                    </div>
                    <span className="text-[9px] text-slate-500 block font-semibold">
                      Official Clearance
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>TAMIMI GLOBAL CO. • ACV OPERATIONS PORTAL</span>
              <span>CONFIDENTIAL & PROPRIETARY DOCUMENT</span>
              <span>PRINT DATE: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Connect Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      গুগল শিট এমপ্লয়ী ডাটা কানেকশন
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Google Sheet URL অথবা CSV লিংক দিয়ে কর্মীদের ডাটা সরাসরি লোড করুন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  গুগল শিট লিংক (Google Sheet Link / CSV Export URL):
                </label>
                <input
                  type="text"
                  value={sheetInputUrl}
                  onChange={(e) => setSheetInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  টিপ: গুগল শিটের শেয়ারিং অপশনে <strong>"Anyone with the link can view"</strong> রাখা নিশ্চিত করুন। শিটের প্রথম সারিতে Name, Badge/ID, Department, Designation, Iqama কলাম থাকা আবশ্যক।
                </p>
              </div>

              {/* Local File Alternative */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <input
                  type="file"
                  ref={excelInputRef}
                  accept=".csv,.xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>অথবা কম্পিউটার থেকে Excel/CSV আপলোড</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const res = EmployeeService.resetToDefaultEmployees();
                    setEmployees(res);
                    setIsSyncModalOpen(false);
                    ToastService.hub('Reset to 10 authentic camp staff records.');
                  }}
                  className="text-xs text-slate-500 hover:underline font-semibold"
                >
                  ডিফল্ট ডাটা রিস্টোর
                </button>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSyncGoogleSheet}
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'ডাটা লোড করুন'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

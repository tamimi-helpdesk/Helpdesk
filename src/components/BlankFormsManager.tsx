import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Search,
  CheckCircle2,
  Sparkles,
  Eye,
  Plus,
  Save,
  Trash2,
  FolderOpen,
  ArrowRight,
  ClipboardCheck,
  Shield,
  Layers,
  Clock,
  Download,
  Share2,
  Filter,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { FORM_TEMPLATES } from '../data/blankFormTemplates';
import {
  FormTemplateDefinition,
  FormCategory,
  SavedFormRecord,
} from '../types/blankForms';
import { BlankFormFillModal } from './blank-forms/BlankFormFillModal';
import { BlankFormPrintLayout } from './blank-forms/BlankFormPrintLayout';
import { AddCustomFormModal } from './blank-forms/AddCustomFormModal';
import {
  getStoredCustomTemplates,
  deleteStoredCustomTemplate,
} from '../services/formImportService';
import { StorageService } from '../services/storageService';
import { GasService } from '../services/gasService';
import { AuthService } from '../services/authService';

interface BlankFormsManagerProps {
  onRefresh?: () => void;
}

const STORAGE_KEY = 'tafga_saved_form_records_v1';

export const BlankFormsManager: React.FC<BlankFormsManagerProps> = ({ onRefresh }) => {
  const [selectedCategory, setSelectedCategory] = useState<FormCategory | 'CUSTOM_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<FormTemplateDefinition | null>(null);
  const [activeDraft, setActiveDraft] = useState<SavedFormRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Custom uploaded templates
  const [customTemplates, setCustomTemplates] = useState<FormTemplateDefinition[]>(() => {
    return getStoredCustomTemplates();
  });

  // Saved draft records
  const [savedForms, setSavedForms] = useState<SavedFormRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((f: SavedFormRecord) => f && f.id && !StorageService.isIdDeleted(f.id));
        }
      }
    } catch (e) {
      console.error('Error loading saved forms', e);
    }
    return [];
  });

  // Listen to background sync updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((f: SavedFormRecord) => f && f.id && !StorageService.isIdDeleted(f.id));
            setSavedForms(valid);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('blank_forms_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('blank_forms_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Direct print hidden target state
  const [directPrintTarget, setDirectPrintTarget] = useState<{
    template: FormTemplateDefinition;
    isBlank: boolean;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'SAVED_DRAFTS'>('TEMPLATES');

  // Reload custom templates if updated
  const refreshCustomTemplates = () => {
    setCustomTemplates(getStoredCustomTemplates());
  };

  // Combine custom templates (at top) with standard built-in templates
  const allTemplates: FormTemplateDefinition[] = [...customTemplates, ...FORM_TEMPLATES];

  // Save drafts to localStorage and sync remote
  const handleSaveDraft = (record: SavedFormRecord) => {
    const existingIndex = savedForms.findIndex((f) => f.id === record.id);
    let updated: SavedFormRecord[];
    if (existingIndex >= 0) {
      updated = [...savedForms];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...savedForms];
    }
    setSavedForms(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('blank_forms_updated'));
    } catch (e) {
      console.error(e);
    }
    GasService.pushBlankFormToRemote(record).catch((err) =>
      console.warn('Background blank form push error:', err)
    );
    if (onRefresh) onRefresh();
  };

  // Delete saved draft
  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Record ID in deletion tombstone registry to prevent resurrecting on sync
    StorageService.recordDeletedId(id);

    // 2. Remove from state
    const updated = savedForms.filter((f) => f.id !== id);
    setSavedForms(updated);

    // 3. Persist locally & notify
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('blank_forms_updated'));
    } catch (e) {
      console.error(e);
    }

    // 4. Push remote deletion
    GasService.deleteBlankFormFromRemote(id).catch((err) =>
      console.warn('Background blank form deletion error:', err)
    );
  };

  // Delete custom uploaded form template
  const handleDeleteTemplate = (template: FormTemplateDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete "${template.title}" (${template.code})? This form will be permanently removed from your Blank Forms list.`
      )
    ) {
      const updated = deleteStoredCustomTemplate(template.id);
      setCustomTemplates(updated);
      if (activeTemplate?.id === template.id) {
        setActiveTemplate(null);
      }
    }
  };

  // Handle new custom template added
  const handleCustomFormAdded = (newTemplate: FormTemplateDefinition) => {
    refreshCustomTemplates();
    setActiveTemplate(newTemplate);
    setActiveDraft(null);
  };

  // Quick Direct Print (Blank or Filled Sample)
  const triggerQuickPrint = (template: FormTemplateDefinition, isBlank = true, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTemplate(template);
    setActiveDraft(null);
  };

  // Filter templates
  const filteredTemplates = allTemplates.filter((tpl) => {
    if (selectedCategory === 'CUSTOM_ONLY') {
      if (!tpl.isCustomUploaded) return false;
    } else if (selectedCategory !== 'ALL') {
      if (tpl.category !== selectedCategory) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      tpl.title.toLowerCase().includes(q) ||
      tpl.code.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.department.toLowerCase().includes(q) ||
      (tpl.uploadedFileName && tpl.uploadedFileName.toLowerCase().includes(q))
    );
  });

  const categories: { id: FormCategory | 'CUSTOM_ONLY'; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Forms', count: allTemplates.length },
    ...(customTemplates.length > 0
      ? [
          {
            id: 'CUSTOM_ONLY' as const,
            label: '⭐ Uploaded & Custom',
            count: customTemplates.length,
          },
        ]
      : []),
    {
      id: 'RECEPTION_HELPDESK',
      label: 'Reception & Helpdesk',
      count: allTemplates.filter((t) => t.category === 'RECEPTION_HELPDESK').length,
    },
    {
      id: 'HR_ADMIN',
      label: 'HR & Personnel',
      count: allTemplates.filter((t) => t.category === 'HR_ADMIN').length,
    },
    {
      id: 'STORE_MATERIAL',
      label: 'Store & Materials',
      count: allTemplates.filter((t) => t.category === 'STORE_MATERIAL').length,
    },
    {
      id: 'OPERATIONS',
      label: 'Operations & Facilities',
      count: allTemplates.filter((t) => t.category === 'OPERATIONS').length,
    },
    {
      id: 'LOGISTICS_SECURITY',
      label: 'Logistics & Security',
      count: allTemplates.filter((t) => t.category === 'LOGISTICS_SECURITY').length,
    },
    {
      id: 'CLEARANCE',
      label: 'Clearance & Exit',
      count: allTemplates.filter((t) => t.category === 'CLEARANCE').length,
    },
    {
      id: 'LEGAL_COMPLIANCE',
      label: 'HSE & Compliance',
      count: allTemplates.filter((t) => t.category === 'LEGAL_COMPLIANCE').length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main View Switcher, Search Bar & Add Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'TEMPLATES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Form Catalog ({allTemplates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SAVED_DRAFTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'SAVED_DRAFTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Saved Drafts ({savedForms.length})</span>
          </button>
        </div>

        {/* Live Search & Add Form Button */}
        <div className="flex items-center space-x-2.5 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms, code, department..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {AuthService.isSuperAdmin() && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
              title="Super Admin: Upload Excel or Word file to add a new form template"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Blank Form</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'TEMPLATES' ? (
        <>
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedCategory === cat.id
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Form Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900 border-2 rounded-3xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                  template.isCustomUploaded
                    ? 'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                          template.isCustomUploaded
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {template.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {template.categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {template.isCustomUploaded && (
                        <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {template.version}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {template.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Department Tag */}
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5 pt-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{template.department}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplate(template);
                      setActiveDraft(null);
                    }}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Open &amp; Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => triggerQuickPrint(template, true, e)}
                    className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Quick Print A4"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print</span>
                  </button>

                  {/* Delete Button for Custom Forms (Super Admin Only) */}
                  {template.isCustomUploaded && AuthService.isSuperAdmin() && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTemplate(template, e)}
                      className="p-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition cursor-pointer border border-red-200 dark:border-red-800"
                      title="Super Admin: Delete Custom Form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No official forms found matching "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500">
                Try searching by form code or click below to upload and add a new blank form.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Form</span>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Saved Drafts Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Saved Form Drafts &amp; Archive
              </h2>
              <p className="text-xs text-slate-500">
                Continue editing previously saved forms, reprint receipts, or export data.
              </p>
            </div>

            {savedForms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all saved form drafts?')) {
                    setSavedForms([]);
                    localStorage.removeItem(STORAGE_KEY);
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Drafts</span>
              </button>
            )}
          </div>

          {savedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedForms.map((draft) => {
                const tpl = allTemplates.find((t) => t.id === draft.templateId);
                return (
                  <div
                    key={draft.id}
                    onClick={() => {
                      if (tpl) {
                        setActiveTemplate(tpl);
                        setActiveDraft(draft);
                      }
                    }}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-lg transition cursor-pointer space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        {draft.formCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500 transition"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {draft.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        REF: {draft.docRef}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div>
                        <strong>Applicant:</strong> {draft.applicant}
                      </div>
                      <div>
                        <strong>Department:</strong> {draft.department}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Saved on: {draft.createdAt}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                        <span>Open &amp; Print</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold">
                        Draft
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No saved drafts yet
              </h3>
              <p className="text-xs text-slate-500">
                When you fill any form and click "Save Draft", your work will be archived here for instant reloading.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Form Fill & Live A4 Preview Modal */}
      {activeTemplate && (
        <BlankFormFillModal
          template={activeTemplate}
          initialDraft={activeDraft}
          onClose={() => {
            setActiveTemplate(null);
            setActiveDraft(null);
          }}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {/* Add Custom Form / Upload File Modal */}
      <AddCustomFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFormAdded={handleCustomFormAdded}
      />

      {/* Hidden container for 1-Click Quick Print */}
      {directPrintTarget && (
        <div className="hidden print:block">
          <BlankFormPrintLayout
            template={directPrintTarget.template}
            formData={directPrintTarget.isBlank ? {} : directPrintTarget.template.sampleData}
            attendanceRows={directPrintTarget.isBlank ? [] : directPrintTarget.template.sampleAttendanceRows}
            materialRows={directPrintTarget.isBlank ? [] : directPrintTarget.template.sampleMaterialRows}
            clearanceRows={directPrintTarget.isBlank ? [] : directPrintTarget.template.sampleClearanceRows}
            gatePassRows={directPrintTarget.isBlank ? [] : directPrintTarget.template.sampleGatePassRows}
            customRows={directPrintTarget.isBlank ? [] : directPrintTarget.template.sampleCustomRows}
            isBlankMode={directPrintTarget.isBlank}
          />
        </div>
      )}
    </div>
  );
};

export default BlankFormsManager;

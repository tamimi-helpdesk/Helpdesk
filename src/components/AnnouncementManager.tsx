import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  AlertTriangle,
  Bell,
  Clock,
  Printer,
  Share2,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  ShieldAlert,
  Flame,
  Volume2,
  Ban,
  FileText,
  Copy,
  Check,
  Building2,
  Phone,
  QrCode,
  Sliders,
  ChevronRight,
  Send,
  Eye,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { TAMIMI_LOGO_DATA_URL } from './TamimiLogo';
import { NOTICE_TEMPLATES, NoticeTemplate, CampNoticeRecord } from '../data/noticeTemplates';
import { GasService } from '../services/gasService';
import { printCampNoticePoster } from '../services/printNoticeService';
import { getTodayDateString } from '../services/storageService';
import { EmergencyBroadcastModal } from './announcement/EmergencyBroadcastModal';
import { AuthService } from '../services/authService';

const STORAGE_KEY_NOTICES = 'tamimi_facility_notices_v2';

// Initial pre-populated camp notices based on top templates
const SEED_NOTICES: CampNoticeRecord[] = NOTICE_TEMPLATES.slice(0, 6).map((tpl, idx) => {
  const today = getTodayDateString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return {
    id: `notc-seed-${idx + 1}`,
    noticeRef: tpl.formRefCode,
    title: tpl.title,
    category: tpl.category,
    priority: tpl.priority,
    themeColor: tpl.themeColor,
    facility: tpl.facility,
    effectiveDate: today,
    expiryDate: nextMonth,
    content: tpl.content,
    keyPoints: tpl.keyPoints,
    penaltyClause: tpl.penaltyClause,
    emergencyContact: tpl.emergencyContact,
    author: tpl.defaultAuthor,
    authorTitle: 'Authorized Camp Authority',
    isPinned: idx < 2,
    publishedAt: today,
    qrVerificationCode: `TAFGA-VERIFY-${tpl.formRefCode}`,
  };
});

export const AnnouncementManager: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => {
  const isSuperAdmin = AuthService.isSuperAdmin();
  const loadNoticesFromStorage = (): CampNoticeRecord[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SEED_NOTICES;
    } catch {
      return SEED_NOTICES;
    }
  };

  const [notices, setNotices] = useState<CampNoticeRecord[]>(loadNoticesFromStorage);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals & Active Views
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isNoticeEditorOpen, setIsNoticeEditorOpen] = useState(false);
  const [isEmergencyBroadcastOpen, setIsEmergencyBroadcastOpen] = useState(false);
  const [viewingNotice, setViewingNotice] = useState<CampNoticeRecord | null>(null);
  const [printTargetNotice, setPrintTargetNotice] = useState<CampNoticeRecord | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<CampNoticeRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Editor Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRef, setFormRef] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CampNoticeRecord['category']>('RULES_POLICY');
  const [formPriority, setFormPriority] = useState<CampNoticeRecord['priority']>('URGENT');
  const [formThemeColor, setFormThemeColor] = useState<CampNoticeRecord['themeColor']>('red');
  const [formFacility, setFormFacility] = useState('All Living Quarters & Facilities');
  const [formEffectiveDate, setFormEffectiveDate] = useState(getTodayDateString());
  const [formExpiryDate, setFormExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [formContent, setFormContent] = useState('');
  const [formKeyPoints, setFormKeyPoints] = useState<string[]>([]);
  const [newKeyPointText, setNewKeyPointText] = useState('');
  const [formPenalty, setFormPenalty] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formAuthor, setFormAuthor] = useState('Camp Administration & HSE Directorate');

  // Save notices to localStorage & sync event
  const saveNotices = useCallback((updated: CampNoticeRecord[]) => {
    setNotices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('notices_updated'));
    } catch (e) {
      console.warn('Failed to save notices to storage:', e);
    }
  }, []);

  // Listen to external updates & ESC key listener for all modals
  useEffect(() => {
    const handleExternalUpdate = () => {
      setNotices(loadNoticesFromStorage());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingNotice(null);
        setPrintTargetNotice(null);
        setIsTemplatePickerOpen(false);
        setIsNoticeEditorOpen(false);
        setNoticeToDelete(null);
      }
    };

    window.addEventListener('notices_updated', handleExternalUpdate);
    window.addEventListener('storage', handleExternalUpdate);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('notices_updated', handleExternalUpdate);
      window.removeEventListener('storage', handleExternalUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Show temporary feedback banner
  const triggerFeedback = (type: 'success' | 'info', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Filtered and sorted notices
  const filteredNotices = useMemo(() => {
    return notices
      .filter((n) => {
        const matchesSearch =
          searchTerm === '' ||
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.noticeRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.author && n.author.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCat = categoryFilter === 'ALL' || n.category === categoryFilter;
        const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;

        return matchesSearch && matchesCat && matchesPriority;
      })
      .sort((a, b) => {
        // Pinned first, then newest
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
      });
  }, [notices, searchTerm, categoryFilter, priorityFilter]);

  // Open Template Picker
  const handleOpenTemplatePicker = () => {
    setIsTemplatePickerOpen(true);
  };

  // Load Template into Editor
  const handleSelectTemplate = (tpl: NoticeTemplate) => {
    setEditingId(null);
    setFormRef(`TAFGA-${tpl.formRefCode}-${Math.floor(100 + Math.random() * 900)}`);
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormPriority(tpl.priority);
    setFormThemeColor(tpl.themeColor);
    setFormFacility(tpl.facility);
    setFormEffectiveDate(getTodayDateString());
    setFormExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormContent(tpl.content);
    setFormKeyPoints(tpl.keyPoints ? [...tpl.keyPoints] : []);
    setFormPenalty(tpl.penaltyClause || '');
    setFormEmergencyContact(tpl.emergencyContact || 'Central Security Desk: Ext. 4411');
    setFormAuthor(tpl.defaultAuthor);

    setIsTemplatePickerOpen(false);
    setIsNoticeEditorOpen(true);
  };

  // Open blank editor
  const handleCreateBlankNotice = () => {
    setEditingId(null);
    setFormRef(`TAFGA-GEN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setFormTitle('');
    setFormCategory('GENERAL');
    setFormPriority('NORMAL');
    setFormThemeColor('blue');
    setFormFacility('All Camp Facilities');
    setFormEffectiveDate(getTodayDateString());
    setFormExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormContent('');
    setFormKeyPoints([]);
    setFormPenalty('');
    setFormEmergencyContact('Camp Helpdesk: Ext. 4400');
    setFormAuthor('Camp Administration');

    setIsNoticeEditorOpen(true);
  };

  // Edit existing notice
  const handleEditNotice = (n: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(n.id);
    setFormRef(n.noticeRef);
    setFormTitle(n.title);
    setFormCategory(n.category);
    setFormPriority(n.priority);
    setFormThemeColor(n.themeColor);
    setFormFacility(n.facility);
    setFormEffectiveDate(n.effectiveDate);
    setFormExpiryDate(n.expiryDate);
    setFormContent(n.content);
    setFormKeyPoints(n.keyPoints ? [...n.keyPoints] : []);
    setFormPenalty(n.penaltyClause || '');
    setFormEmergencyContact(n.emergencyContact || '');
    setFormAuthor(n.author);

    setViewingNotice(null);
    setIsNoticeEditorOpen(true);
  };

  // View notice modal
  const handleViewNotice = (notice: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingNotice(notice);
  };

  // Save notice (Create or Update)
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingId) {
      // Update existing notice
      const updatedNotice: CampNoticeRecord = {
        id: editingId,
        noticeRef: formRef || `TAFGA-NOTC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formTitle,
        category: formCategory,
        priority: formPriority,
        themeColor: formThemeColor,
        facility: formFacility,
        effectiveDate: formEffectiveDate,
        expiryDate: formExpiryDate,
        content: formContent,
        keyPoints: formKeyPoints,
        penaltyClause: formPenalty,
        emergencyContact: formEmergencyContact,
        author: formAuthor,
        authorTitle: 'Authorized Camp Administration',
        isPinned: notices.find((n) => n.id === editingId)?.isPinned || false,
        publishedAt: notices.find((n) => n.id === editingId)?.publishedAt || getTodayDateString(),
        qrVerificationCode: `TAFGA-VERIFY-${formRef}`,
      };

      const updatedList = notices.map((item) => (item.id === editingId ? updatedNotice : item));
      saveNotices(updatedList);
      triggerFeedback('success', `Notice "${formTitle}" updated successfully!`);

      // Push update to Google Sheets in background
      GasService.pushNoticeToRemote(updatedNotice);
    } else {
      // Create new notice
      const newNotice: CampNoticeRecord = {
        id: `notc-${Date.now()}`,
        noticeRef: formRef || `TAFGA-NOTC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formTitle,
        category: formCategory,
        priority: formPriority,
        themeColor: formThemeColor,
        facility: formFacility,
        effectiveDate: formEffectiveDate,
        expiryDate: formExpiryDate,
        content: formContent,
        keyPoints: formKeyPoints,
        penaltyClause: formPenalty,
        emergencyContact: formEmergencyContact,
        author: formAuthor,
        authorTitle: 'Authorized Camp Administration',
        isPinned: false,
        publishedAt: getTodayDateString(),
        qrVerificationCode: `TAFGA-VERIFY-${formRef}`,
      };

      const updatedList = [newNotice, ...notices];
      saveNotices(updatedList);
      confetti({ particleCount: 40, spread: 60 });
      triggerFeedback('success', `New notice "${formTitle}" published successfully!`);

      // Push to Google Sheets in background
      GasService.pushNoticeToRemote(newNotice);
    }

    setIsNoticeEditorOpen(false);
  };

  // Pin / Unpin
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notices.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    saveNotices(updated);
  };

  // Request delete
  const handleRequestDelete = (notice: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoticeToDelete(notice);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!noticeToDelete) return;
    const targetId = noticeToDelete.id;
    const targetTitle = noticeToDelete.title;
    const updated = notices.filter((n) => n.id !== targetId);
    saveNotices(updated);
    setNoticeToDelete(null);
    if (viewingNotice?.id === targetId) {
      setViewingNotice(null);
    }

    triggerFeedback('info', `Notice "${targetTitle}" has been deleted.`);

    // Push delete to Google Sheets in background
    GasService.deleteNoticeFromRemoteDirect(targetId);
  };

  // Copy notice text to clipboard
  const handleCopyNotice = (notice: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text =
      `📢 *OFFICIAL NOTICE: ${notice.title}*\n` +
      `🏷️ *Ref:* ${notice.noticeRef} | *Priority:* ${notice.priority}\n` +
      `📍 *Location:* ${notice.facility}\n` +
      `📅 *Effective Date:* ${notice.effectiveDate}\n\n` +
      `${notice.content}\n\n` +
      (notice.keyPoints && notice.keyPoints.length > 0
        ? `*Key Directives:*\n${notice.keyPoints.map((p) => `• ${p}`).join('\n')}\n\n`
        : '') +
      (notice.penaltyClause ? `⚠️ *Compliance Penalty:* ${notice.penaltyClause}\n\n` : '') +
      `📞 *Helpdesk/Emergency:* ${notice.emergencyContact || 'Ext. 4411'}\n` +
      `— Authorized by ${notice.author}`;

    navigator.clipboard.writeText(text);
    setCopiedId(notice.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // WhatsApp Share
  const handleShareWhatsApp = (notice: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = encodeURIComponent(
      `📢 *OFFICIAL TAMIMI CAMP NOTICE*\n\n` +
        `*${notice.title}*\n` +
        `Ref: ${notice.noticeRef} | Priority: ${notice.priority}\n` +
        `Target Area: ${notice.facility}\n\n` +
        `${notice.content}\n\n` +
        (notice.emergencyContact ? `Contact: ${notice.emergencyContact}\n` : '') +
        `— Tamimi Global Camp Operations`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Direct Print Modal Action & Poster Generator
  const handlePrint = (notice: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintTargetNotice(notice);
  };

  const handleExecutePrintNotice = async (notice: CampNoticeRecord) => {
    const printContent = document.getElementById('printable-notice-poster');
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=950,height=1200');
      if (printWindow) {
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map((el) => el.outerHTML)
          .join('\n');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>${notice.noticeRef} - ${notice.title}</title>
            ${styles}
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              * {
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                color: #0f172a;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .printable-doc-sheet {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                padding: 24px;
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="printable-doc-sheet">
              ${printContent.innerHTML}
            </div>
            <script>
              function doPrint() {
                window.focus();
                window.print();
              }
              if (document.readyState === 'complete') {
                setTimeout(doPrint, 350);
              } else {
                window.addEventListener('load', function() {
                  setTimeout(doPrint, 350);
                });
              }
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    }

    // Fallback
    await printCampNoticePoster(notice);
  };

  const handleDownloadNoticeTxt = (notice: CampNoticeRecord) => {
    const textContent = `=====================================================
TAMIMI GLOBAL COMPANY - TAFGA CAMP OPERATIONS
OFFICIAL NOTICE & BROADCAST POSTER
=====================================================
REFERENCE NO: ${notice.noticeRef}
DATE OF ISSUE: ${notice.effectiveDate}
EXPIRY / POST UNTIL: ${notice.expiryDate}
PRIORITY LEVEL: ${notice.priority}
CATEGORY: ${notice.category.replace(/_/g, ' ').toUpperCase()}
TARGET FACILITY / LOCATION: ${notice.facility}
ISSUING AUTHORITY: ${notice.author}
EMERGENCY CONTACT: ${notice.emergencyContact || 'Central Operations Ext. 4411'}

-----------------------------------------------------
NOTICE TITLE:
${notice.title.toUpperCase()}
-----------------------------------------------------

NOTICE DETAILS:
${notice.content}

${
  notice.keyPoints && notice.keyPoints.length > 0
    ? `DIRECTIVES & ACTION ITEMS:\n` +
      notice.keyPoints.map((pt, i) => `  ${i + 1}. ${pt}`).join('\n') +
      '\n'
    : ''
}${
  notice.penaltyClause
    ? `\nCOMPLIANCE & PENALTY CLAUSE:\n  ${notice.penaltyClause}\n`
    : ''
}
=====================================================
AUTHORIZED BY TAMIMI CAMP MANAGEMENT DESK
ISO 9001:2015 • ISO 45001:2018 Certified Operations
Generated via TAFGA Executive Facility Booking Portal
=====================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tamimi-Notice-${notice.noticeRef.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionFeedback({
      type: 'success',
      message: `Downloaded text notice for "${notice.noticeRef}"`,
    });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCopyNoticeText = (notice: CampNoticeRecord) => {
    const text = `📢 *OFFICIAL NOTICE - TAMIMI CAMP OPERATIONS*\n*Ref:* ${notice.noticeRef} | *Date:* ${notice.effectiveDate}\n*Target:* ${notice.facility}\n*Priority:* ${notice.priority}\n\n*${notice.title}*\n\n${notice.content}\n\n${
      notice.keyPoints && notice.keyPoints.length > 0
        ? `*Mandatory Directives:*\n` +
          notice.keyPoints.map((p) => `• ${p}`).join('\n') +
          '\n\n'
        : ''
    }${
      notice.penaltyClause
        ? `⚠️ *Compliance Note:* ${notice.penaltyClause}\n\n`
        : ''
    }— Tamimi Camp Management (Contact: ${notice.emergencyContact || 'Ext. 4411'})`;

    navigator.clipboard.writeText(text);
    setActionFeedback({
      type: 'success',
      message: 'Notice text copied to clipboard!',
    });
    setTimeout(() => setActionFeedback(null), 2500);
  };

  const handleDirectInstantPrint = async (notice: CampNoticeRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintTargetNotice(notice);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Helper for Category Badge Color
  const getThemePill = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'purple':
        return 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Action Feedback Banner */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-all">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                <span>OFFICIAL CAMP BULLETIN &amp; NOTICES</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold hidden sm:inline">
                • Tamimi Global Authorized Broadcasts &amp; A4 Posters ({notices.length} Total)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <span>Camp Announcements &amp; Notice Generator</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Create, edit, view, print, and manage official Tamimi-branded notices for service suspensions, safety rules, quiet hours, maintenance outages, and dining schedules.
            </p>
          </div>

          {/* Quick Action Buttons (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setIsEmergencyBroadcastOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-rose-600/25 hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-4 h-4 text-rose-200 animate-pulse" />
                <span>Emergency Siren / WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleOpenTemplatePicker}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-amber-600/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Use Template ({NOTICE_TEMPLATES.length})</span>
              </button>

              <button
                type="button"
                onClick={handleCreateBlankNotice}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Notice</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, keyword, rule, or notice ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Notices' },
            { id: 'RULES_POLICY', label: 'Rules & Safety' },
            { id: 'SERVICE_SUSPENSION', label: 'Disruptions' },
            { id: 'MAINTENANCE', label: 'Maintenance' },
            { id: 'SAFETY_HEALTH', label: 'Health & Fire' },
            { id: 'FACILITY_TIMING', label: 'Timings' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Grid */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">No announcements found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No notices match your filter or search keyword. Try clearing filters or create a new announcement.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={handleOpenTemplatePicker}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Templates</span>
            </button>
            <button
              onClick={handleCreateBlankNotice}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Blank Notice</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredNotices.map((notice) => (
            <motion.div
              key={notice.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleViewNotice(notice)}
              className={`bg-white dark:bg-slate-900 border-2 ${
                notice.isPinned
                  ? 'border-amber-400 dark:border-amber-600 shadow-md shadow-amber-500/10'
                  : 'border-slate-200/90 dark:border-slate-800 shadow-xs'
              } rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-amber-400/80 transition-all duration-200 relative overflow-hidden group cursor-pointer`}
            >
              {/* Top accent bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  notice.themeColor === 'red'
                    ? 'bg-rose-500'
                    : notice.themeColor === 'amber'
                    ? 'bg-amber-500'
                    : notice.themeColor === 'emerald'
                    ? 'bg-emerald-500'
                    : notice.themeColor === 'purple'
                    ? 'bg-purple-500'
                    : 'bg-blue-500'
                }`}
              />

              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border font-mono ${getThemePill(notice.themeColor)}`}>
                      {notice.noticeRef}
                    </span>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        notice.priority === 'URGENT'
                          ? 'bg-rose-600 text-white'
                          : notice.priority === 'HIGH'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {notice.priority}
                    </span>

                    {notice.isPinned && (
                      <span className="flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                        <span>PINNED</span>
                      </span>
                    )}
                  </div>

                  {/* Pin and View Details action */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(notice.id, e)}
                      title={notice.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        notice.isPinned
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'text-slate-300 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${notice.isPinned ? 'fill-amber-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                    <span>{notice.title}</span>
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap gap-y-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>{notice.facility}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Effective: {notice.effectiveDate}</span>
                    </span>
                  </div>
                </div>

                {/* Content snippet */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 line-clamp-3">
                  {notice.content}
                </div>

                {/* Key Points Bullet List */}
                {notice.keyPoints && notice.keyPoints.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Key Directives:</span>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {notice.keyPoints.slice(0, 2).map((pt, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{pt}</span>
                        </li>
                      ))}
                      {notice.keyPoints.length > 2 && (
                        <li className="text-[11px] font-bold text-amber-600 pl-5">
                          + {notice.keyPoints.length - 2} more points (Click to view)
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Penalty Clause Warning if present */}
                {notice.penaltyClause && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-300 text-[11px] font-medium flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1"><strong>Compliance:</strong> {notice.penaltyClause}</span>
                  </div>
                )}
              </div>

              {/* Card Footer & Actions */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                  By <strong>{notice.author}</strong>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto flex-wrap gap-y-1">
                  {/* View Details */}
                  <button
                    type="button"
                    onClick={(e) => handleViewNotice(notice, e)}
                    title="View Full Notice Details"
                    className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Copy Text */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyNotice(notice, e)}
                    title="Copy Notice Text"
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedId === notice.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Share WhatsApp */}
                  <button
                    type="button"
                    onClick={(e) => handleShareWhatsApp(notice, e)}
                    title="Share to WhatsApp"
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  {/* Super Admin Notice Management Actions */}
                  {isSuperAdmin && (
                    <>
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={(e) => handleEditNotice(notice, e)}
                        title="Super Admin: Edit Notice"
                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleRequestDelete(notice, e)}
                        title="Super Admin: Delete Notice"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Print Official A4 Poster Button */}
                  <button
                    type="button"
                    onClick={(e) => handlePrint(notice, e)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Poster</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ========================================================
          1. NOTICE DETAILS & PREVIEW MODAL (WITH PROMINENT CLOSE)
          ======================================================== */}
      <AnimatePresence>
        {viewingNotice && (
          <div
            onClick={() => setViewingNotice(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col relative"
            >
              {/* Top Bar with Clear Close Button */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border font-mono ${getThemePill(viewingNotice.themeColor)}`}>
                      {viewingNotice.noticeRef}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {viewingNotice.priority}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white pt-1">
                    {viewingNotice.title}
                  </h3>
                </div>

                {/* Big Close Button at Top */}
                <button
                  type="button"
                  onClick={() => setViewingNotice(null)}
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                  title="Close Notice (Esc)"
                >
                  <X className="w-5 h-5" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>

              {/* Notice Body */}
              <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-slate-800 dark:text-slate-200">
                {/* Meta details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Target Location:</span>
                    <div className="font-bold text-slate-900 dark:text-white">{viewingNotice.facility}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Effective Dates:</span>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {viewingNotice.effectiveDate} to {viewingNotice.expiryDate}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Issuing Authority:</span>
                    <div className="font-bold text-slate-900 dark:text-white">{viewingNotice.author}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Emergency / Contact:</span>
                    <div className="font-bold text-slate-900 dark:text-white">{viewingNotice.emergencyContact || 'Central Security Ext. 4411'}</div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Official Announcement Text:</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {viewingNotice.content}
                  </div>
                </div>

                {/* Key Points */}
                {viewingNotice.keyPoints && viewingNotice.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Key Directives &amp; Mandatory Rules:</h4>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      {viewingNotice.keyPoints.map((pt, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Penalty Clause */}
                {viewingNotice.penaltyClause && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-900 dark:text-rose-200 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Compliance &amp; Penalty:</strong> {viewingNotice.penaltyClause}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer with Clear Close & Action Buttons */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handlePrint(viewingNotice)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition shadow-xs flex-1 sm:flex-none"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print A4 Poster</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditNotice(viewingNotice)}
                    className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition flex-1 sm:flex-none"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestDelete(viewingNotice)}
                    className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Primary High-Contrast Close Button */}
                <button
                  type="button"
                  onClick={() => setViewingNotice(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Close Window</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          2. PRE-BUILT TEMPLATE PICKER MODAL
          ======================================================== */}
      <AnimatePresence>
        {isTemplatePickerOpen && (
          <div
            onClick={() => setIsTemplatePickerOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Official Notice Template Library
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select any pre-formatted camp operational notice to customize with 1-click
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTemplatePickerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <X className="w-5 h-5" />
                  <span>Close</span>
                </button>
              </div>

              {/* Template Cards Grid */}
              <div className="overflow-y-auto space-y-3 pr-1 py-1 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {NOTICE_TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className="bg-slate-50 dark:bg-slate-950/80 border-2 border-slate-200/80 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border font-mono ${getThemePill(tpl.themeColor)}`}>
                            {tpl.badgeLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {tpl.formRefCode}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors leading-snug">
                          {tpl.title}
                        </h4>

                        {tpl.subtitle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {tpl.subtitle}
                          </p>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                          {tpl.content}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                          📍 {tpl.facility}
                        </span>
                        <span className="font-bold text-amber-600 flex items-center gap-1 text-[11px]">
                          <span>Use Template</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-400">
                  {NOTICE_TEMPLATES.length} standardized official templates available
                </span>
                <button
                  type="button"
                  onClick={() => setIsTemplatePickerOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-black dark:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          3. NOTICE BUILDER & LIVE EDITOR MODAL
          ======================================================== */}
      <AnimatePresence>
        {isNoticeEditorOpen && (
          <div
            onClick={() => setIsNoticeEditorOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {editingId ? 'Edit Camp Notice' : 'Create Official Notice & A4 Poster'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fill in the official details to broadcast and generate a high-res printable poster
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNoticeEditorOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveNotice} className="overflow-y-auto space-y-4 pr-1 flex-1">
                {/* Row 1: Title */}
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Notice Title (Heading) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Appears prominent on A4 poster</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. STRICTLY NO SMOKING - DESIGNATED AREAS ONLY"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400 mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Row 2: Reference, Category, Priority & Theme Color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notice Reference Code</label>
                    <input
                      type="text"
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                      placeholder="e.g. TAFGA-HSE-NOTC-01"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white mt-1"
                    >
                      <option value="RULES_POLICY">Rules &amp; Safety Policy</option>
                      <option value="SERVICE_SUSPENSION">Service Suspension</option>
                      <option value="MAINTENANCE">Maintenance &amp; Outages</option>
                      <option value="SAFETY_HEALTH">Health &amp; Fire Safety</option>
                      <option value="FACILITY_TIMING">Facility Timings</option>
                      <option value="GENERAL">General Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Banner Theme Color</label>
                    <select
                      value={formThemeColor}
                      onChange={(e) => setFormThemeColor(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white mt-1"
                    >
                      <option value="red">Red (Urgent / Ban / Warning)</option>
                      <option value="amber">Amber (Maintenance / Shutdown)</option>
                      <option value="emerald">Emerald (Authorized Zone / Policy)</option>
                      <option value="blue">Blue (Schedule / Info)</option>
                      <option value="purple">Purple (Recreation / Events)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Target Facility & Effective Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Facility / Location</label>
                    <input
                      type="text"
                      value={formFacility}
                      onChange={(e) => setFormFacility(e.target.value)}
                      placeholder="e.g. All Accommodation Blocks 1-16"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Effective Date</label>
                    <input
                      type="date"
                      value={formEffectiveDate}
                      onChange={(e) => setFormEffectiveDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiry Date</label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* Row 4: Main Content */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notice Body Paragraphs *</label>
                  <textarea
                    required
                    rows={4}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Enter detailed notice content in English..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white mt-1 leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans"
                  />
                </div>

                {/* Row 5: Key Directives (Bullet Points) */}
                <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Key Bullet Points / Directives
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">({formKeyPoints.length} points)</span>
                  </div>

                  {formKeyPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs text-amber-600 font-bold">•</span>
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => {
                          const updated = [...formKeyPoints];
                          updated[idx] = e.target.value;
                          setFormKeyPoints(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormKeyPoints(formKeyPoints.filter((_, i) => i !== idx))}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      value={newKeyPointText}
                      onChange={(e) => setNewKeyPointText(e.target.value)}
                      placeholder="Add a new bullet point directive..."
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newKeyPointText.trim()) {
                            setFormKeyPoints([...formKeyPoints, newKeyPointText.trim()]);
                            setNewKeyPointText('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newKeyPointText.trim()) {
                          setFormKeyPoints([...formKeyPoints, newKeyPointText.trim()]);
                          setNewKeyPointText('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Row 6: Penalty Clause & Author */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Penalty / Compliance Clause (Optional)</label>
                    <input
                      type="text"
                      value={formPenalty}
                      onChange={(e) => setFormPenalty(e.target.value)}
                      placeholder="e.g. Violation incurs SAR 500 safety citation..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Emergency / Helpdesk Contact</label>
                    <input
                      type="text"
                      value={formEmergencyContact}
                      onChange={(e) => setFormEmergencyContact(e.target.value)}
                      placeholder="e.g. Security Control Room: Ext. 4411"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Author / Issuing Authority</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. HSE Directorate • Tamimi Global Camp Operations"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white mt-1"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsNoticeEditorOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs shadow-md shadow-amber-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingId ? 'Save & Update Notice' : 'Publish & Broadcast Notice'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          4. OFFICIAL TAMIMI GLOBAL A4 PRINTABLE POSTER MODAL
          ======================================================== */}
      <AnimatePresence>
        {printTargetNotice && (
          <div
            onClick={() => setPrintTargetNotice(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-slate-950 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 flex flex-col border border-slate-300 relative"
            >
              {/* Modal Top Bar (Clean & Simple) */}
              <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-white">Notice Poster Preview</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintTargetNotice(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Official A4 Document Sheet */}
              <div id="printable-notice-poster" className="p-8 sm:p-12 space-y-6 bg-white printable-doc-sheet print:p-0 print:m-0 print:space-y-4">
                {/* Official Tamimi Header */}
                <div className="border-b-4 border-amber-600 pb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={TAMIMI_LOGO_DATA_URL}
                      alt="Tamimi Global Company"
                      className="h-14 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-tight">
                        TAMIMI GLOBAL COMPANY
                      </div>
                      <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        TAFGA Camp Operations &amp; Facility Management
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ISO 9001:2015 • ISO 45001:2018 Certified Operations
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs space-y-0.5">
                    <div className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black rounded border border-amber-300 text-[11px] inline-block">
                      OFFICIAL NOTICE
                    </div>
                    <div className="text-slate-500 font-bold text-[11px] pt-1">
                      REF: <strong>{printTargetNotice.noticeRef}</strong>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Date: {printTargetNotice.effectiveDate}
                    </div>
                  </div>
                </div>

                {/* Priority & Target Facility Banner */}
                <div
                  className={`p-4 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm ${
                    printTargetNotice.themeColor === 'red'
                      ? 'bg-rose-700'
                      : printTargetNotice.themeColor === 'amber'
                      ? 'bg-amber-600'
                      : printTargetNotice.themeColor === 'emerald'
                      ? 'bg-emerald-700'
                      : printTargetNotice.themeColor === 'purple'
                      ? 'bg-purple-700'
                      : 'bg-blue-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                        ATTENTION ALL RESIDENTS &amp; OCCUPANTS
                      </div>
                      <div className="font-black text-sm uppercase">
                        PRIORITY LEVEL: {printTargetNotice.priority} • {printTargetNotice.category.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs bg-black/20 px-3 py-1.5 rounded-xl">
                    <div className="text-[10px] text-white/80 font-medium">TARGET FACILITY / AREA:</div>
                    <div className="font-bold">{printTargetNotice.facility}</div>
                  </div>
                </div>

                {/* Notice Title Heading */}
                <div className="text-center py-2 border-b-2 border-slate-200">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                    {printTargetNotice.title}
                  </h1>
                </div>

                {/* Body Content */}
                <div className="text-sm text-slate-800 leading-relaxed text-justify whitespace-pre-line font-sans">
                  {printTargetNotice.content}
                </div>

                {/* Key Directives / Bullet Points */}
                {printTargetNotice.keyPoints && printTargetNotice.keyPoints.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2">
                    <div className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Mandatory Rules &amp; Action Items:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-800 font-medium">
                      {printTargetNotice.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Penalty / Compliance Clause Warning */}
                {printTargetNotice.penaltyClause && (
                  <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-900 font-medium flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">COMPLIANCE &amp; PENALTY NOTICE: </strong>
                      {printTargetNotice.penaltyClause}
                    </div>
                  </div>
                )}

                {/* Signatory & Authorization Box */}
                <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Issuing Authority:</div>
                    <div className="font-bold text-slate-900">{printTargetNotice.author}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Contact: {printTargetNotice.emergencyContact || 'Ext. 4411'}</div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Official Camp Stamp</div>
                    <div className="w-20 h-20 border-2 border-dashed border-amber-600/60 rounded-full mx-auto flex items-center justify-center text-[9px] font-black text-amber-800 uppercase tracking-tighter text-center rotate-[-6deg] p-1">
                      TAMIMI GLOBAL<br />CAMP OPERATIONS<br />AUTHORIZED
                    </div>
                  </div>

                  <div className="text-right space-y-1 font-mono">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Verification QR / Ref:</div>
                    <div className="text-[11px] font-bold text-slate-800">{printTargetNotice.noticeRef}</div>
                    <div className="text-[10px] text-slate-400">Post Until: {printTargetNotice.expiryDate}</div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer (Clean with Close & Print) */}
              <div className="print:hidden bg-slate-100 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPrintTargetNotice(null)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-sm cursor-pointer transition flex items-center space-x-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Close Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecutePrintNotice(printTargetNotice)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-black rounded-xl text-sm shadow-md flex items-center space-x-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Poster (A4)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          5. DELETE CONFIRMATION MODAL
          ======================================================== */}
      <AnimatePresence>
        {noticeToDelete && (
          <div
            onClick={() => setNoticeToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Announcement?</h3>
                  <p className="text-xs text-slate-500">This will permanently remove this notice from the bulletin board.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{noticeToDelete.title}</div>
                <div className="text-slate-500 font-mono">{noticeToDelete.noticeRef} • {noticeToDelete.facility}</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNoticeToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete Notice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          6. EMERGENCY SIREN & WHATSAPP BROADCAST MODAL
          ======================================================== */}
      <EmergencyBroadcastModal
        isOpen={isEmergencyBroadcastOpen}
        onClose={() => setIsEmergencyBroadcastOpen(false)}
        onBroadcast={(notice) => {
          setNotices((prev) => [notice, ...prev]);
        }}
      />
    </div>
  );
};

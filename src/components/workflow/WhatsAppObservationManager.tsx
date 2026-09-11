import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Camera,
  Layers,
  Wrench,
  Bug,
  Sparkles,
  Ticket,
  ChevronLeft,
  Info,
  Trash2,
  Image as ImageIcon,
  Send,
  Eye,
  X,
  Code,
  ShieldCheck,
  Building2,
  Smartphone,
  MessageSquare,
  Settings2,
  Plus,
  Users,
  Calendar,
  SlidersHorizontal,
  Tags,
  Flame,
  ShieldAlert,
  Server,
  Cloud,
  Maximize2,
  Upload,
} from 'lucide-react';
import { FacilityObservation, ObservationDepartment } from '../../types';
import {
  WhatsAppObservationService,
  extractLocationAndDescription,
  getSheetCategory,
  getCategoryMatchDetails,
} from '../../services/whatsappObservationService';
import { ToastService } from '../../services/toastService';
import { GreenApiService, GreenApiConfig, GreenApiChat } from '../../services/greenApiService';
import {
  WhatsAppUniversalService,
  UniversalWhatsAppConfig,
} from '../../services/whatsappUniversalService';
import { GreenApiSetupModal } from './GreenApiSetupModal';
import { CategoryKeywordsModal } from './CategoryKeywordsModal';
import { UniversalWhatsAppModal } from './UniversalWhatsAppModal';
import { TicketService } from '../../services/ticketService';
import { WorkOrderTicket } from '../../types/ticket';

interface WhatsAppObservationManagerProps {
  onOpenOutboundPasses?: () => void;
  onBack?: () => void;
}

export const WhatsAppObservationManager: React.FC<WhatsAppObservationManagerProps> = ({
  onOpenOutboundPasses,
  onBack,
}) => {
  const [observations, setObservations] = useState<FacilityObservation[]>(() =>
    WhatsAppObservationService.getAll()
  );

  const [greenApiConfig, setGreenApiConfig] = useState<GreenApiConfig>(() =>
    GreenApiService.getConfig()
  );
  const [universalConfig, setUniversalConfig] = useState<UniversalWhatsAppConfig>(() =>
    WhatsAppUniversalService.getConfig()
  );

  const [isGreenApiModalOpen, setIsGreenApiModalOpen] = useState(false);
  const [isUniversalApiModalOpen, setIsUniversalApiModalOpen] = useState(false);
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [isGroupSelectModalOpen, setIsGroupSelectModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingGroup, setIsFetchingGroup] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Time-Filtered Fetch Modal states
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [fetchTimeMode, setFetchTimeMode] = useState<'all_recent' | 'today' | 'today_from_time' | 'yesterday' | 'last_24_hours' | 'custom'>('all_recent');
  const [fetchStartTime, setFetchStartTime] = useState('08:00');
  const [fetchCustomStart, setFetchCustomStart] = useState(new Date().toISOString().slice(0, 10));
  const [fetchCustomEnd, setFetchCustomEnd] = useState(new Date().toISOString().slice(0, 10));
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [fetchDepth, setFetchDepth] = useState<number>(100);

  // Group selection states
  const [manualGroupId, setManualGroupId] = useState(greenApiConfig.targetGroupChatId || '');
  const [manualGroupName, setManualGroupName] = useState(greenApiConfig.targetGroupName || '');
  const [detectedGroups, setDetectedGroups] = useState<GreenApiChat[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [groupVerification, setGroupVerification] = useState<{
    checking: boolean;
    result?: { valid: boolean; groupName?: string; participantCount?: number; error?: string };
  } | null>(null);

  // Row selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Manual paste state
  const [pastedText, setPastedText] = useState('');

  // Filters
  const [activeDepartment, setActiveDepartment] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL_TIME' | 'TODAY' | 'YESTERDAY' | 'LAST_3_DAYS' | 'LAST_7_DAYS'>('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingTicket, setViewingTicket] = useState<WorkOrderTicket | null>(null);

  // Photo Cell Display Mode: 'full' (image fills entire cell container), 'medium', or 'compact'
  const [cellPhotoMode, setCellPhotoMode] = useState<'full' | 'medium' | 'compact'>('full');
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');

  // Close-out rectification picture upload support
  const closeOutFileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeCloseOutObsId, setActiveCloseOutObsId] = useState<string | null>(null);

  const handleTriggerCloseOutUpload = (obsId: string) => {
    setActiveCloseOutObsId(obsId);
    closeOutFileInputRef.current?.click();
  };

  const handleCloseOutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCloseOutObsId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      WhatsAppObservationService.updateObservation(activeCloseOutObsId, {
        closeOutPicture: dataUrl,
        status: 'Closed',
      });
      refreshList();
      ToastService.showSuccess('Close-Out photo attached and defect status marked as Closed!');
      setActiveCloseOutObsId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Re-verify and auto-categorize all observations using Category Keywords
  const handleReclassifyAll = () => {
    const res = WhatsAppObservationService.reclassifyAll();
    refreshList();
    if (res.updatedCount > 0) {
      ToastService.showSuccess(`Updated ${res.updatedCount} observation(s) to strictly match Category Keywords!`);
    } else {
      ToastService.showSuccess('Verified! All observations are already 100% matched to Category Keywords.');
    }
  };

  // Real-time API Connection Health status: 'connected' (GREEN) | 'error' (RED) | 'unconfigured' (RED) | 'checking'
  const [apiHealth, setApiHealth] = useState<{
    status: 'connected' | 'error' | 'unconfigured' | 'checking';
    message: string;
    providerName: string;
    lastChecked?: Date;
  }>({
    status: 'checking',
    message: 'Checking WhatsApp Gateway connection...',
    providerName: 'Green API',
  });

  const checkApiHealth = useCallback(async () => {
    const uCfg = WhatsAppUniversalService.getConfig();
    const gCfg = GreenApiService.getConfig();

    const providerTitle =
      uCfg.activeProvider === 'green_api'
        ? 'Green API'
        : uCfg.activeProvider === 'meta_cloud'
        ? 'Meta Cloud API'
        : uCfg.activeProvider === 'custom_gateway'
        ? (uCfg.customGateway.gatewayName || 'Custom Gateway')
        : 'Direct Webhook';

    if (uCfg.activeProvider === 'green_api') {
      const instanceId = uCfg.greenApi?.instanceId || gCfg.instanceId;
      const apiToken = uCfg.greenApi?.apiToken || gCfg.apiToken;

      if (!instanceId || !apiToken) {
        setApiHealth({
          status: 'unconfigured',
          message: 'Green API Instance ID or API Token missing',
          providerName: providerTitle,
          lastChecked: new Date(),
        });
        return;
      }

      setApiHealth((prev) => ({
        ...prev,
        status: 'checking',
        message: 'Verifying Green API connection...',
        providerName: providerTitle,
      }));

      try {
        const result = await GreenApiService.testConnection(instanceId, apiToken);
        if (result.success) {
          setApiHealth({
            status: 'connected',
            message: `Connected (${result.state || 'Authorized'})`,
            providerName: providerTitle,
            lastChecked: new Date(),
          });
        } else {
          setApiHealth({
            status: 'error',
            message: result.message || 'Connection failed or unauthorized',
            providerName: providerTitle,
            lastChecked: new Date(),
          });
        }
      } catch (e: any) {
        setApiHealth({
          status: 'error',
          message: e?.message || 'Network error connecting to Green API',
          providerName: providerTitle,
          lastChecked: new Date(),
        });
      }
    } else if (uCfg.activeProvider === 'meta_cloud') {
      if (!uCfg.metaCloud.phoneNumberId || !uCfg.metaCloud.accessToken) {
        setApiHealth({
          status: 'unconfigured',
          message: 'Meta Cloud credentials missing',
          providerName: providerTitle,
          lastChecked: new Date(),
        });
        return;
      }
      const res = await WhatsAppUniversalService.testConnection('meta_cloud', uCfg.metaCloud);
      setApiHealth({
        status: res.success ? 'connected' : 'error',
        message: res.message || (res.success ? 'Connected' : 'Connection failed'),
        providerName: providerTitle,
        lastChecked: new Date(),
      });
    } else if (uCfg.activeProvider === 'custom_gateway') {
      if (!uCfg.customGateway.endpointUrl) {
        setApiHealth({
          status: 'unconfigured',
          message: 'Custom Gateway URL missing',
          providerName: providerTitle,
          lastChecked: new Date(),
        });
        return;
      }
      const res = await WhatsAppUniversalService.testConnection('custom_gateway', uCfg.customGateway);
      setApiHealth({
        status: res.success ? 'connected' : 'error',
        message: res.message || (res.success ? 'Connected' : 'Connection failed'),
        providerName: providerTitle,
        lastChecked: new Date(),
      });
    } else {
      setApiHealth({
        status: 'connected',
        message: 'Direct Webhook Ingest Ready',
        providerName: providerTitle,
        lastChecked: new Date(),
      });
    }
  }, []);

  const refreshList = () => {
    setObservations(WhatsAppObservationService.getAll());
    setGreenApiConfig(GreenApiService.getConfig());
    setUniversalConfig(WhatsAppUniversalService.getConfig());
    checkApiHealth();
  };

  // Auto clean invalid data and ensure accurate category classifications upon mount
  useEffect(() => {
    WhatsAppObservationService.cleanupInvalidObservations();
    WhatsAppObservationService.reclassifyAll();
    refreshList();
    checkApiHealth();

    const handleConfigChange = () => {
      refreshList();
      checkApiHealth();
    };
    window.addEventListener('tamimi_whatsapp_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('tamimi_whatsapp_config_changed', handleConfigChange);
    };
  }, [checkApiHealth]);

  // Keep local group states synced when config changes
  useEffect(() => {
    setManualGroupId(greenApiConfig.targetGroupChatId || '');
    setManualGroupName(greenApiConfig.targetGroupName || '');
  }, [greenApiConfig]);

  // Date filter helper
  const isDateInRange = (dateStr: string, range: typeof dateFilter): boolean => {
    if (range === 'ALL_TIME') return true;
    if (!dateStr) return true;

    let d: Date;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    } else {
      d = new Date(dateStr);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));

    if (range === 'TODAY') return diffDays === 0;
    if (range === 'YESTERDAY') return diffDays === 1;
    if (range === 'LAST_3_DAYS') return diffDays >= 0 && diffDays <= 3;
    if (range === 'LAST_7_DAYS') return diffDays >= 0 && diffDays <= 7;
    return true;
  };

  // Filtered observations
  const filteredObservations = useMemo(() => {
    return observations.filter((item) => {
      if (activeDepartment !== 'ALL') {
        if (activeDepartment === 'Hard Service') {
          if (!['Hard Service', 'Civil', 'Electrical', 'HVAC', 'Plumbing'].includes(item.department)) return false;
        } else if (activeDepartment === 'Soft Services') {
          if (!['Soft Services', 'Housekeeping', 'Landscaping', 'Waste Management'].includes(item.department)) return false;
        } else if (item.department !== activeDepartment) {
          return false;
        }
      }
      if (activeStatus !== 'ALL' && item.status !== activeStatus) return false;
      if (!isDateInRange(item.date, dateFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTicket = (item.ticketNumber || '').toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        if (!matchLoc && !matchDesc && !matchTicket && !matchDept) return false;
      }
      return true;
    });
  }, [observations, activeDepartment, activeStatus, dateFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const total = observations.length;
    const hard = observations.filter((o) =>
      ['Hard Service', 'Civil', 'Electrical', 'HVAC', 'Plumbing'].includes(o.department)
    ).length;
    const soft = observations.filter((o) =>
      ['Soft Services', 'Housekeeping', 'Landscaping', 'Waste Management'].includes(o.department)
    ).length;
    const pest = observations.filter((o) => o.department === 'Pest Control').length;
    const hse = observations.filter((o) => o.department === 'HSE').length;
    const fire = observations.filter((o) => o.department === 'Fire Department').length;
    const ticketed = observations.filter((o) => !!o.ticketNumber && o.ticketNumber.trim().length > 0).length;
    return { total, hard, soft, pest, hse, fire, ticketed };
  }, [observations]);

  // Open the Time-Filtered Fetch Dialog
  const handleFetchGroupMessages = () => {
    if (!greenApiConfig.isConfigured && !universalConfig.isConfigured) {
      ToastService.showError('WhatsApp Gateway is not configured. Please set your credentials in API Gateway.');
      setIsUniversalApiModalOpen(true);
      return;
    }
    setIsFetchModalOpen(true);
  };

  // Execute Fetch Group Messages with selected Time Filter & Replacement Option
  const handleExecuteFetchMessages = async () => {
    if (!greenApiConfig.instanceId || !greenApiConfig.apiToken) {
      ToastService.showError('WhatsApp API Gateway is not configured. Please enter your credentials first.');
      setIsUniversalApiModalOpen(true);
      return;
    }

    setIsFetchingGroup(true);
    setSyncFeedback(null);

    try {
      const uConfig = WhatsAppUniversalService.getConfig();
      const targetChatId =
        manualGroupId?.trim() ||
        greenApiConfig.targetGroupChatId?.trim() ||
        uConfig.greenApi.targetGroupChatId?.trim() ||
        uConfig.customGateway.targetChatId?.trim() ||
        '';

      const res = await GreenApiService.syncFromWhatsAppGroup({
        chatId: targetChatId,
        count: fetchDepth,
        filterOptions: {
          mode: fetchTimeMode,
          startTimeStr: fetchStartTime,
          customStartDate: fetchCustomStart,
          customEndDate: fetchCustomEnd,
          replaceExisting,
        },
      });

      if (res.success) {
        setSyncFeedback({
          type: res.addedCount > 0 ? 'success' : 'info',
          message: res.message,
        });
        if (res.addedCount > 0) {
          ToastService.showSuccess(res.message);
        } else {
          ToastService.showInfo(res.message);
        }
        setIsFetchModalOpen(false);
        refreshList();
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message,
        });
        ToastService.showError(res.message);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to WhatsApp via Gateway.';
      setSyncFeedback({ type: 'error', message: errMsg });
      ToastService.showError(errMsg);
    } finally {
      setIsFetchingGroup(false);
    }
  };

  // Auto-detect groups from Green API
  const handleDetectGroups = async () => {
    if (!greenApiConfig.instanceId || !greenApiConfig.apiToken) {
      ToastService.showError('Instance ID and API Token are required first.');
      setIsGreenApiModalOpen(true);
      return;
    }

    setIsDetecting(true);
    try {
      const res = await GreenApiService.getChats(greenApiConfig.instanceId, greenApiConfig.apiToken);
      if (res.success && res.chats.length > 0) {
        const groupsOnly = res.chats.filter((c) => c.id.includes('@g.us') || c.type === 'group');
        const listToUse = groupsOnly.length > 0 ? groupsOnly : res.chats;
        setDetectedGroups(listToUse);
        ToastService.showSuccess(`Found ${listToUse.length} WhatsApp chats/groups!`);
      } else {
        ToastService.showInfo(res.error || 'No chats found. Check if your WhatsApp phone is linked in Green API.');
      }
    } catch (e: any) {
      ToastService.showError(`Error searching WhatsApp chats: ${e.message}`);
    } finally {
      setIsDetecting(false);
    }
  };

  // Save selected group
  const handleSaveGroupSelection = () => {
    let cleanId = manualGroupId.trim();
    if (cleanId && !cleanId.includes('@')) {
      cleanId = `${cleanId}@g.us`;
    }

    const updated = GreenApiService.saveConfig({
      targetGroupChatId: cleanId,
      targetGroupName: manualGroupName.trim() || 'WhatsApp Inspection Group',
    });

    setGreenApiConfig(updated);
    setIsGroupSelectModalOpen(false);
    ToastService.showSuccess(`Target Group set to: ${updated.targetGroupName || updated.targetGroupChatId}`);
  };

  // Handle manual paste intake
  const handleProcessManualPaste = () => {
    if (!pastedText.trim()) {
      ToastService.showError('Please paste WhatsApp messages first.');
      return;
    }

    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    let count = 0;
    lines.forEach((line) => {
      const clean = line.replace(/^\[?[\d:.\s\w/,-]+\]?:\s*/i, '').trim();
      if (clean) {
        WhatsAppObservationService.addObservation({
          caption: clean,
          inspectorName: 'Manual Intake',
          inspectorPhone: '+966554921010',
        });
        count++;
      }
    });

    setPastedText('');
    setIsPasteModalOpen(false);
    refreshList();
    ToastService.showSuccess(`Added ${count} new inspection records!`);
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const targetItems = selectedIds.size > 0
        ? filteredObservations.filter((o) => selectedIds.has(o.id))
        : filteredObservations;
      const todayIso = new Date().toISOString().slice(0, 10);
      await WhatsAppObservationService.exportToExcel({
        departmentFilter: activeDepartment !== 'ALL' ? activeDepartment : undefined,
        items: targetItems,
        dateFilter: todayIso,
        customTitle: `TAFGA_TBCV_OBSERVATION_REPORT_${todayIso}.xlsx`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Ticket creation
  const handleConvertToTicket = (obs: FacilityObservation) => {
    const res = WhatsAppObservationService.convertToTicket(obs.id);
    if (res.success) {
      ToastService.showSuccess(res.message);
      refreshList();
    }
  };

  // View Planon Ticket Details
  const handleViewTicket = (obs: FacilityObservation) => {
    if (!obs.ticketNumber) return;
    const allTickets = TicketService.getTickets();
    const match = allTickets.find(
      (t) =>
        t.orderNumberDecimal === obs.ticketNumber ||
        t.ticketNumber === obs.ticketNumber ||
        t.id.includes(obs.ticketNumber!)
    );

    if (match) {
      setViewingTicket(match);
    } else {
      // Fallback virtual ticket object for instant viewing
      const fallback: WorkOrderTicket = {
        id: `WO-${obs.ticketNumber}`,
        ticketNumber: obs.ticketNumber,
        orderNumberDecimal: obs.ticketNumber,
        orderGroup: `01.01, ${obs.department}`,
        customer: 'Red Sea Global (RSG) / Amaala',
        project: 'Amaala Construction Village',
        client: 'Red Sea Global',
        stage: 'Stage 1',
        cluster: 'I' as any,
        clusterType: 'VIP',
        buildingNumber: 8,
        buildingCategory: 'Junior',
        floor: 'GF',
        unitNumber: obs.location,
        locationCode: `ACV-S1-${obs.location}`,
        category: (obs.department as any) || 'CIVIL',
        subCategory: 'Inspection Observation Defect',
        priority: 'P2 - High',
        status: obs.status === 'Closed' ? 'CLOSED' : 'ASSIGNED',
        title: `[Obs ${obs.location}] ${obs.description.slice(0, 60)}`,
        description: obs.description,
        reporterName: obs.inspectorName || 'Field Inspector',
        reporterBadge: 'TAFGA-FM-INSP',
        reporterPhone: obs.inspectorPhone || '+966554921010',
        reporterDepartment: obs.department,
        company: 'TAMIMI Global',
        materialsUsed: [],
        logs: [
          {
            id: `LOG-OBS-1`,
            timestamp: obs.date || new Date().toISOString(),
            author: obs.inspectorName || 'Field Inspector',
            action: 'Converted from WhatsApp Observation',
            note: obs.description,
          },
        ],
        createdAt: obs.date || new Date().toISOString(),
        updatedAt: obs.date || new Date().toISOString(),
        targetResolutionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        attachedFiles: obs.picture
          ? [
              {
                name: `Observation_${obs.location || 'Defect'}.jpg`,
                size: '320 KB',
                type: 'image/jpeg',
                dataUrl: obs.picture,
              },
            ]
          : [],
      };
      setViewingTicket(fallback);
    }
  };

  const handleNavigateToTicketManagement = () => {
    setViewingTicket(null);
    window.dispatchEvent(
      new CustomEvent('tamimi_navigate_facility', {
        detail: { facilityId: 'ticket-management' },
      })
    );
    ToastService.showInfo('Opened Ticket Management facility.');
  };

  // Status toggle
  const handleStatusChange = (obs: FacilityObservation, newStatus: 'Open' | 'In Progress' | 'Closed') => {
    WhatsAppObservationService.updateObservation(obs.id, { status: newStatus });
    refreshList();
  };

  // Category Manual Change (Single)
  const handleCategoryChange = (obs: FacilityObservation, newDept: ObservationDepartment) => {
    WhatsAppObservationService.updateObservation(obs.id, { department: newDept });
    refreshList();
    ToastService.showSuccess(`Updated #${obs.no} to "${newDept}" category.`);
  };

  // Category Batch Change (Multiple Selected)
  const handleBatchSetCategory = (newDept: ObservationDepartment) => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    selectedIds.forEach((id) => {
      WhatsAppObservationService.updateObservation(id, { department: newDept });
    });
    setSelectedIds(new Set());
    refreshList();
    ToastService.showSuccess(`Moved ${count} observation(s) to "${newDept}".`);
  };

  // Row Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredObservations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredObservations.map((o) => o.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    WhatsAppObservationService.deleteObservations(Array.from(selectedIds));
    setSelectedIds(new Set());
    refreshList();
    ToastService.showSuccess(`Deleted ${count} selected observation(s).`);
  };

  const handleBatchCreateTickets = () => {
    if (selectedIds.size === 0) return;
    let created = 0;
    selectedIds.forEach((id) => {
      const res = WhatsAppObservationService.convertToTicket(id);
      if (res.success) created++;
    });
    setSelectedIds(new Set());
    refreshList();
    ToastService.showSuccess(`Generated ${created} Work Order Ticket(s).`);
  };

  const handleBatchSetStatus = (status: 'Open' | 'In Progress' | 'Closed') => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      WhatsAppObservationService.updateObservation(id, { status });
    });
    setSelectedIds(new Set());
    refreshList();
    ToastService.showSuccess(`Updated ${selectedIds.size} observation(s) to ${status}.`);
  };

  // Single Row Delete (Instant delete, no iframe-blocking alert)
  const handleDeleteSingle = (id: string) => {
    WhatsAppObservationService.deleteObservation(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    refreshList();
    ToastService.showSuccess('Observation removed.');
  };

  // Verify group via Green API
  const handleVerifyManualGroup = async () => {
    let cleanId = manualGroupId.trim();
    if (!cleanId) {
      ToastService.showError('Please enter a Group ID first.');
      return;
    }
    if (!cleanId.includes('@')) {
      cleanId = `${cleanId}@g.us`;
      setManualGroupId(cleanId);
    }

    setGroupVerification({ checking: true });
    try {
      const res = await GreenApiService.verifyGroup(cleanId);
      const mapped = {
        valid: res.success,
        groupName: res.subject,
        participantCount: res.participantsCount,
        error: res.error,
      };
      setGroupVerification({ checking: false, result: mapped });
      if (mapped.valid) {
        if (mapped.groupName && !manualGroupName) {
          setManualGroupName(mapped.groupName);
        }
        ToastService.showSuccess(`Group Verified: ${mapped.groupName || cleanId} (${mapped.participantCount || 0} participants)`);
      } else {
        ToastService.showError(mapped.error || 'Green API cannot access this group.');
      }
    } catch (err: any) {
      setGroupVerification({
        checking: false,
        result: { valid: false, error: err.message || 'Verification failed.' },
      });
      ToastService.showError(err.message || 'Verification failed.');
    }
  };

  // Clean invalid data helper
  const handleCleanInvalidRecords = () => {
    const cleaned = WhatsAppObservationService.cleanupInvalidObservations();
    refreshList();
    ToastService.showSuccess(`Scanned & cleaned observation registry (${cleaned} total valid records).`);
  };

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      {/* ============================================================ */}
      {/* 1. TOP LIVE WHATSAPP GROUP SYNC BAR (MAIN FEATURE CARD)      */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: WhatsApp Provider Status & Target WhatsApp Group */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  WhatsApp Field Inspection &amp; TBCV Report Engine
                </h2>
                {apiHealth.status === 'connected' ? (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1.5 shadow-2xs"
                    title={`Connected to ${apiHealth.providerName}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Online ({apiHealth.providerName})</span>
                  </span>
                ) : apiHealth.status === 'checking' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center space-x-1.5">
                    <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
                    <span>Connecting...</span>
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
                    title={apiHealth.message || 'WhatsApp API is in standby'}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Standby</span>
                  </span>
                )}
              </div>

              {/* Group ID & Target indicator */}
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Group:
                </span>
                <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 max-w-xs truncate">
                  {greenApiConfig.targetGroupName || greenApiConfig.targetGroupChatId || universalConfig.customGateway.targetChatId || 'Daily Facility Inspection'}
                </span>
                {greenApiConfig.targetGroupChatId && (
                  <span className="font-mono text-[10px] text-slate-400">
                    ({greenApiConfig.targetGroupChatId})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* 1-Click Fetch Group Messages */}
            <button
              onClick={handleFetchGroupMessages}
              disabled={isFetchingGroup}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              title="Fetch latest inspection messages from configured WhatsApp provider"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingGroup ? 'animate-spin' : ''}`} />
              <span>{isFetchingGroup ? 'Fetching Data...' : 'Fetch Group Messages'}</span>
            </button>

            {/* Keyword Rules Modal Button */}
            <button
              onClick={() => setIsKeywordsModalOpen(true)}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Manage classification keywords for Hard Service, Soft Services, Pest Control, HSE, and Fire Department"
            >
              <Tags className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Category Keywords</span>
            </button>

            {/* Quick Auto-Categorize by Keywords Button */}
            <button
              onClick={() => {
                const res = WhatsAppObservationService.reclassifyAll();
                refreshList();
                ToastService.showSuccess(`Auto-Categorized! ${res.updatedCount} observation(s) updated to match Category Keywords.`);
              }}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Re-run Category Keywords engine across all observations"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Auto-Categorize</span>
            </button>

            {/* Manual Text Paste Intake */}
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
              title="Paste WhatsApp text messages directly if API is unavailable"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>

            {/* Export Official TAFGA TBCV Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className={`px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer ${
                isExporting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title="Download formatted official TAFGA TBCV Excel report with embedded photos"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>
                {isExporting
                  ? 'Exporting...'
                  : selectedIds.size > 0
                  ? `Export Selected (${selectedIds.size})`
                  : 'Export Excel'}
              </span>
            </button>

            {/* Universal API Gateway Hub Settings */}
            <button
              onClick={() => setIsUniversalApiModalOpen(true)}
              className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border transition flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                apiHealth.status === 'connected'
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Configure WhatsApp API Gateway (Green API, Meta Cloud, Custom Gateway)"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>API Settings</span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  apiHealth.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sync Feedback Banner */}
        {syncFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                : syncFeedback.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : syncFeedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="font-medium">{syncFeedback.message}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-slate-600 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. STATS & CATEGORY METRICS (CLEAN MODERN CARDS)            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Observations */}
        <button
          onClick={() => setActiveDepartment('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            activeDepartment === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Total</span>
            <Layers className="w-3.5 h-3.5 opacity-50" />
          </div>
          <p className="text-xl font-black mt-1.5">{counts.total}</p>
          <span className="text-[10px] opacity-70 block mt-0.5">All Categories</span>
        </button>

        {/* Hard Service */}
        <button
          onClick={() => setActiveDepartment('Hard Service')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            activeDepartment === 'Hard Service'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Hard Service</span>
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black mt-1.5 text-amber-900 dark:text-amber-300">{counts.hard}</p>
          <span className="text-[10px] text-amber-600/80 block mt-0.5">Electrical, Civil, AC</span>
        </button>

        {/* Soft Services */}
        <button
          onClick={() => setActiveDepartment('Soft Services')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            activeDepartment === 'Soft Services'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Soft Services</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-black mt-1.5 text-blue-900 dark:text-blue-300">{counts.soft}</p>
          <span className="text-[10px] text-blue-600/80 block mt-0.5">Housekeeping, Waste</span>
        </button>

        {/* Pest Control */}
        <button
          onClick={() => setActiveDepartment('Pest Control')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            activeDepartment === 'Pest Control'
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Pest Control</span>
            <Bug className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xl font-black mt-1.5 text-rose-900 dark:text-rose-300">{counts.pest}</p>
          <span className="text-[10px] text-rose-600/80 block mt-0.5">Insects &amp; Rodents</span>
        </button>

        {/* HSE */}
        <button
          onClick={() => setActiveDepartment('HSE')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            activeDepartment === 'HSE'
              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">HSE</span>
            <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-black mt-1.5 text-purple-900 dark:text-purple-300">{counts.hse}</p>
          <span className="text-[10px] text-purple-600/80 block mt-0.5">Hazards &amp; Safety</span>
        </button>

        {/* Fire Department */}
        <button
          onClick={() => setActiveDepartment('Fire Department')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            activeDepartment === 'Fire Department'
              ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">Fire Dept</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <p className="text-xl font-black mt-1.5 text-orange-900 dark:text-orange-300">{counts.fire}</p>
          <span className="text-[10px] text-orange-600/80 block mt-0.5">Alarms &amp; Safety</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. FILTERS & SEARCH TOOLBAR                                  */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Date Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Date:
          </span>
          {(['ALL_TIME', 'TODAY', 'YESTERDAY', 'LAST_3_DAYS', 'LAST_7_DAYS'] as const).map((range) => {
            const labels: Record<string, string> = {
              ALL_TIME: 'All Time',
              TODAY: 'Today',
              YESTERDAY: 'Yesterday',
              LAST_3_DAYS: 'Last 3 Days',
              LAST_7_DAYS: 'Last 7 Days',
            };
            const active = dateFilter === range;
            return (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room (I08-012), issue..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Photo Size & Layout Controls */}
          <div className="flex items-center space-x-1.5">
            {/* Cell Photo Mode Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCellPhotoMode('full')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                  cellPhotoMode === 'full'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Full Cell View (Image fills entire cell bounds)"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Full Cell</span>
              </button>
              <button
                onClick={() => setCellPhotoMode('medium')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  cellPhotoMode === 'medium'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Medium cell view"
              >
                Med
              </button>
              <button
                onClick={() => setCellPhotoMode('compact')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  cellPhotoMode === 'compact'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
                title="Compact thumbnail view"
              >
                Min
              </button>
            </div>

            {/* Fit mode toggle */}
            <button
              onClick={() => setImageFit(prev => prev === 'cover' ? 'contain' : 'cover')}
              className="p-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer flex items-center space-x-1"
              title={`Switch photo fit: currently ${imageFit === 'cover' ? 'Cover (Fills entire cell)' : 'Contain (Show complete aspect ratio)'}`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">{imageFit === 'cover' ? 'Fill' : 'Fit'}</span>
            </button>
          </div>

          {observations.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleReclassifyAll}
                className="px-2.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                title="Re-verify all observations against Category Keywords"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Verify Keywords</span>
              </button>
              <button
                onClick={handleCleanInvalidRecords}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center space-x-1"
                title="Clean invalid or corrupted URLs and entries"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Clean Data</span>
              </button>
              <button
                onClick={() => {
                  WhatsAppObservationService.clearAll();
                  setSelectedIds(new Set());
                  refreshList();
                  ToastService.showSuccess('All observation records cleared.');
                }}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Clear all records"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn border border-slate-800 dark:border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
              {selectedIds.size}
            </div>
            <span className="text-xs font-bold">
              {selectedIds.size} observation{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            {/* Batch Category Selector */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBatchSetCategory(e.target.value as ObservationDepartment);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-2.5 py-1.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700 dark:border-slate-300 focus:outline-hidden"
              title="Change category for all selected observations"
            >
              <option value="" disabled>
                Move to Department...
              </option>
              <optgroup label="Hard Service">
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Hard Service">Hard Service (General)</option>
              </optgroup>
              <optgroup label="Soft Service">
                <option value="Housekeeping">Housekeeping</option>
                <option value="Landscaping">Landscaping</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Soft Services">Soft Services (General)</option>
              </optgroup>
              <optgroup label="Specialist & Safety">
                <option value="Pest Control">Pest Control</option>
                <option value="HSE">HSE</option>
                <option value="Fire Department">Fire Department</option>
              </optgroup>
            </select>

            <button
              onClick={handleBatchCreateTickets}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Create Work Orders ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => {
                const selectedItems = observations.filter((o) => selectedIds.has(o.id));
                WhatsAppObservationService.exportToExcel({
                  items: selectedItems,
                  customTitle: `TAFGA_TBCV_OBSERVATION_REPORT_Selected_${selectedIds.size}.xlsx`,
                });
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => handleBatchSetStatus('Closed')}
              className="px-3 py-1.5 bg-slate-700 dark:bg-slate-200 hover:bg-slate-600 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Set Closed
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              title="Permanently remove selected observations from report"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white dark:hover:text-slate-900 transition cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MODERN OBSERVATIONS DATA TABLE                            */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredObservations.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 opacity-60" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No WhatsApp Observations Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                {searchQuery || activeDepartment !== 'ALL' || dateFilter !== 'ALL_TIME'
                  ? 'No results match your current search or date filters.'
                  : 'No observations have been loaded yet from your WhatsApp group. Click "Fetch Group Messages" above to synchronize, or click "Paste Text Directly" to enter defects manually.'}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleFetchGroupMessages}
                disabled={isFetchingGroup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGroup ? 'animate-spin' : ''}`} />
                <span>Fetch Group Messages</span>
              </button>
              <button
                onClick={() => setIsPasteModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Paste Text Directly</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredObservations.length > 0 && selectedIds.size === filteredObservations.length}
                      onChange={handleToggleSelectAll}
                      className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className={`py-3 px-3 text-center transition-all ${
                    cellPhotoMode === 'full' ? 'w-40 min-w-[155px]' : cellPhotoMode === 'medium' ? 'w-32 min-w-[125px]' : 'w-24 min-w-[95px]'
                  }`}>
                    Picture (Inspection)
                  </th>
                  <th className={`py-3 px-3 text-center transition-all ${
                    cellPhotoMode === 'full' ? 'w-40 min-w-[155px]' : cellPhotoMode === 'medium' ? 'w-32 min-w-[125px]' : 'w-24 min-w-[95px]'
                  }`}>
                    Close Out Picture
                  </th>
                  <th className="py-3 px-4 w-32">Location / Room</th>
                  <th className="py-3 px-4">Observation / Defect Description</th>
                  <th className="py-3 px-4 w-36">Category (Keywords)</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-36">Work Order</th>
                  <th className="py-3 px-4 w-32 text-right">Date &amp; Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredObservations.map((obs, idx) => {
                  const isSelected = selectedIds.has(obs.id);

                  return (
                    <tr
                      key={`obs-${obs.id || 'row'}-${idx}`}
                      className={`transition ${
                        isSelected
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(obs.id)}
                          className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Row Number */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 align-middle">
                        {obs.no || idx + 1}
                      </td>

                      {/* Photo Cell (Inspection Picture) - Fills Cell Container */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        {(obs.pictureUrl || obs.picture) ? (
                          <div
                            onClick={() => setPreviewImage(obs.pictureUrl || obs.picture || null)}
                            className={`relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs cursor-pointer mx-auto transition-all ${
                              cellPhotoMode === 'full'
                                ? 'w-44 h-32 sm:w-48 sm:h-32'
                                : cellPhotoMode === 'medium'
                                ? 'w-32 h-24'
                                : 'w-24 h-16'
                            }`}
                            title="Click to view full inspection photo"
                          >
                            <img
                              src={obs.pictureUrl || obs.picture}
                              alt={obs.location}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200 block"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-white">
                              <Eye className="w-4 h-4 text-emerald-400" />
                              <span className="text-[10px] font-bold">View Full</span>
                            </div>
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-white">
                              Photo
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex flex-col items-center justify-center text-slate-400 text-[10px] mx-auto ${
                              cellPhotoMode === 'full'
                                ? 'w-44 h-32 sm:w-48 sm:h-32'
                                : cellPhotoMode === 'medium'
                                ? 'w-32 h-24'
                                : 'w-24 h-16'
                            }`}
                          >
                            <ImageIcon className="w-4 h-4 opacity-40 mb-0.5" />
                            <span>No Photo</span>
                          </div>
                        )}
                      </td>

                      {/* Close Out Rectification Picture Cell */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        {obs.closeOutPicture ? (
                          <div
                            onClick={() => setPreviewImage(obs.closeOutPicture || null)}
                            className={`relative group rounded-xl overflow-hidden border border-emerald-400 dark:border-emerald-600 bg-slate-100 dark:bg-slate-800 shadow-2xs cursor-pointer mx-auto transition-all ${
                              cellPhotoMode === 'full'
                                ? 'w-44 h-32 sm:w-48 sm:h-32'
                                : cellPhotoMode === 'medium'
                                ? 'w-32 h-24'
                                : 'w-24 h-16'
                            }`}
                            title="Click to view close-out rectification proof"
                          >
                            <img
                              src={obs.closeOutPicture}
                              alt={`${obs.location} rectified`}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200 block"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-white">
                              <Eye className="w-4 h-4 text-emerald-400" />
                              <span className="text-[10px] font-bold">Proof</span>
                            </div>
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
                              Resolved
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTriggerCloseOutUpload(obs.id)}
                            className={`rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-[10px] transition cursor-pointer mx-auto group p-1.5 ${
                              cellPhotoMode === 'full'
                                ? 'w-44 h-32 sm:w-48 sm:h-32'
                                : cellPhotoMode === 'medium'
                                ? 'w-32 h-24'
                                : 'w-24 h-16'
                            }`}
                            title="Upload/Attach close-out rectification photo proof"
                          >
                            <Plus className="w-4 h-4 mb-0.5 group-hover:scale-110 transition text-slate-400 group-hover:text-emerald-500" />
                            <span className="font-bold">Add Closeout</span>
                            <span className="text-[9px] opacity-70 hidden sm:inline">Attach Proof</span>
                          </button>
                        )}
                      </td>

                      {/* Location / Room */}
                      <td className="py-3 px-4 align-middle">
                        <span className="font-mono font-black text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                          {obs.location || 'General'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md leading-relaxed align-middle">
                        <span>{obs.description}</span>
                        {obs.inspectorName && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            by {obs.inspectorName}
                          </span>
                        )}
                      </td>

                      {/* Category Selector Dropdown & Keyword Match Indicator */}
                      <td className="py-3 px-4 align-middle">
                        <select
                          value={obs.department}
                          onChange={(e) =>
                            handleCategoryChange(obs, e.target.value as ObservationDepartment)
                          }
                          className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-hidden transition shadow-2xs w-full max-w-[150px] ${
                            obs.department === 'Civil' || obs.department === 'Hard Service'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : obs.department === 'Electrical'
                              ? 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                              : obs.department === 'HVAC'
                              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                              : obs.department === 'Plumbing'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                              : obs.department === 'Housekeeping'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                              : obs.department === 'Landscaping'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : obs.department === 'Waste Management'
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                              : obs.department === 'Soft Services'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                              : obs.department === 'Pest Control'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                              : obs.department === 'HSE'
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                              : 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                          }`}
                          title="Click to change department / Excel sheet"
                        >
                          <optgroup label="Hard Service">
                            <option value="Civil">Civil</option>
                            <option value="Electrical">Electrical</option>
                            <option value="HVAC">HVAC</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Hard Service">Hard Service (General)</option>
                          </optgroup>
                          <optgroup label="Soft Service">
                            <option value="Housekeeping">Housekeeping</option>
                            <option value="Landscaping">Landscaping</option>
                            <option value="Waste Management">Waste Management</option>
                            <option value="Soft Services">Soft Services (General)</option>
                          </optgroup>
                          <optgroup label="Specialist & Safety">
                            <option value="Pest Control">Pest Control</option>
                            <option value="HSE">HSE</option>
                            <option value="Fire Department">Fire Department</option>
                          </optgroup>
                        </select>

                        {/* Category Keyword Match Tag */}
                        {(() => {
                          const match = getCategoryMatchDetails(obs.description || obs.rawCaption || '');
                          if (match.matchedKeyword) {
                            return (
                              <div
                                className="mt-1.5 flex items-center space-x-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80 truncate max-w-[150px]"
                                title={`Matched Category Keyword: "${match.matchedKeyword}" -> Auto-classified as ${match.department} (Confidence: ${match.confidenceScore})`}
                              >
                                <Sparkles className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                <span className="truncate">&ldquo;{match.matchedKeyword}&rdquo;</span>
                              </div>
                            );
                          }
                          return (
                            <div className="mt-1 text-[9px] text-slate-400 italic">
                              Keyword: Default
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={obs.status}
                          onChange={(e) =>
                            handleStatusChange(obs, e.target.value as 'Open' | 'In Progress' | 'Closed')
                          }
                          className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer focus:outline-hidden ${
                            obs.status === 'Closed'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              : obs.status === 'In Progress'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      {/* Work Order Ticket */}
                      <td className="py-3 px-4">
                        {obs.ticketNumber ? (
                          <button
                            type="button"
                            onClick={() => handleViewTicket(obs)}
                            className="font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs transition flex items-center space-x-1.5 cursor-pointer group"
                            title="Click to view full Planon Work Order details"
                          >
                            <Ticket className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span>#{obs.ticketNumber}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConvertToTicket(obs)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center space-x-1 shadow-2xs hover:border-emerald-400"
                          >
                            <Ticket className="w-3 h-3 text-emerald-500" />
                            <span>Create Ticket</span>
                          </button>
                        )}
                      </td>

                      {/* Date & Actions */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-slate-400 block">
                          {obs.date || 'Today'}
                        </span>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSingle(obs.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            title="Delete this observation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL: TIME-FILTERED FETCH GROUP MESSAGES                 */}
      {/* ============================================================ */}
      {isFetchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <RefreshCw className={`w-5 h-5 ${isFetchingGroup ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Fetch WhatsApp Group Messages
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select inspection timeframe and data ingestion mode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFetchModalOpen(false)}
                disabled={isFetchingGroup}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Target Channel Banner with Green / Red Status */}
              <div
                className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  apiHealth.status === 'connected'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs ${
                      apiHealth.status === 'connected' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {apiHealth.status === 'connected' ? (
                      <MessageSquare className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {greenApiConfig.targetGroupName || 'Daily Facility Inspection'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {greenApiConfig.targetGroupChatId || 'Channel: 120363046746721856@g.us'}
                    </span>
                  </div>
                </div>

                {apiHealth.status === 'connected' ? (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>API CONNECTED (ONLINE)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFetchModalOpen(false);
                      setIsUniversalApiModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-xs cursor-pointer transition self-start sm:self-auto animate-pulse"
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>API OFFLINE - CLICK TO FIX &rarr;</span>
                  </button>
                )}
              </div>

              {/* 1. Time Range Mode Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  1. Select Time Range (When to Fetch From):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* All Recent (Live Sync - Recommended) */}
                  <button
                    type="button"
                    onClick={() => setFetchTimeMode('all_recent')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 sm:col-span-2 ${
                      fetchTimeMode === 'all_recent'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      fetchTimeMode === 'all_recent' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {fetchTimeMode === 'all_recent' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black">All Recent Messages (Live Sync)</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>
                      <span className="text-[10px] opacity-75 mt-0.5 block">
                        Fetches active WhatsApp messages in real time without timezone or date cutoffs. New messages appear immediately and deleted messages are excluded.
                      </span>
                    </div>
                  </button>

                  {/* Today (Full) */}
                  <button
                    type="button"
                    onClick={() => setFetchTimeMode('today')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                      fetchTimeMode === 'today'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      fetchTimeMode === 'today' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {fetchTimeMode === 'today' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-black block">Today (All Day)</span>
                      <span className="text-[10px] opacity-75">All messages from 00:00 AM today to current time</span>
                    </div>
                  </button>

                  {/* Today from Specific Time */}
                  <button
                    type="button"
                    onClick={() => setFetchTimeMode('today_from_time')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                      fetchTimeMode === 'today_from_time'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      fetchTimeMode === 'today_from_time' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {fetchTimeMode === 'today_from_time' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-black block">Today from Specific Time</span>
                      <span className="text-[10px] opacity-75">Fetch messages starting from a shift time (e.g. 08:00 AM)</span>
                    </div>
                  </button>

                  {/* Yesterday */}
                  <button
                    type="button"
                    onClick={() => setFetchTimeMode('yesterday')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                      fetchTimeMode === 'yesterday'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      fetchTimeMode === 'yesterday' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {fetchTimeMode === 'yesterday' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-black block">Yesterday (Full Day)</span>
                      <span className="text-[10px] opacity-75">All inspection messages received throughout yesterday</span>
                    </div>
                  </button>

                  {/* Last 24 Hours */}
                  <button
                    type="button"
                    onClick={() => setFetchTimeMode('last_24_hours')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                      fetchTimeMode === 'last_24_hours'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      fetchTimeMode === 'last_24_hours' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {fetchTimeMode === 'last_24_hours' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-black block">Last 24 Hours</span>
                      <span className="text-[10px] opacity-75">Messages received within the past 24-hour window</span>
                    </div>
                  </button>
                </div>

                {/* Specific Time Selector (Visible when mode === 'today_from_time') */}
                {fetchTimeMode === 'today_from_time' && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Shift Start Time (Filter Today's Messages After This Hour):</span>
                      </span>
                      <input
                        type="time"
                        value={fetchStartTime}
                        onChange={(e) => setFetchStartTime(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono font-black text-xs text-amber-900 dark:text-amber-200 focus:outline-hidden"
                      />
                    </div>

                    {/* Quick Time Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 mr-1">Quick Presets:</span>
                      {['06:00', '07:30', '08:00', '09:00', '10:00', '12:00', '14:00'].map((timePreset) => (
                        <button
                          key={timePreset}
                          type="button"
                          onClick={() => setFetchStartTime(timePreset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                            fetchStartTime === timePreset
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {timePreset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Data Replacement Policy */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  2. Data Ingestion Mode (Previous Records Handling):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Replace Old (Fresh Load) */}
                  <button
                    type="button"
                    onClick={() => setReplaceExisting(true)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                      replaceExisting
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      replaceExisting ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {replaceExisting && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black">Fresh Load (Wipe Old Data)</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
                        Permanently removes previous inspection entries and loads only freshly fetched messages for this timeframe. Recommended for daily clean Excel reporting.
                      </p>
                    </div>
                  </button>

                  {/* Append */}
                  <button
                    type="button"
                    onClick={() => setReplaceExisting(false)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start space-x-3 ${
                      !replaceExisting
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      !replaceExisting ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}>
                      {!replaceExisting && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-black block">Append to Existing Records</span>
                      <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
                        Keeps current table observations and appends new incoming messages to the list.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Scan Depth */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Message Scan Depth:</span>
                <div className="flex items-center space-x-1.5">
                  {[50, 100, 200].map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      onClick={() => setFetchDepth(depth)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        fetchDepth === depth
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {depth} Messages
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setIsFetchModalOpen(false)}
                disabled={isFetchingGroup}
                className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteFetchMessages}
                disabled={isFetchingGroup}
                className="px-6 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingGroup ? 'animate-spin' : ''}`} />
                <span>
                  {isFetchingGroup
                    ? 'Fetching WhatsApp Messages...'
                    : 'Fetch & Load Observations Now'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL: MANUAL TEXT INTAKE                                 */}
      {/* ============================================================ */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Paste WhatsApp Messages Directly
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy text lines from WhatsApp and paste them below
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`I08-012 bedbugs need pest treatment\nI08-114 shower door lock broken\nJ02-014 flush tank leaking\nStage-1 mosque floor repaint needed`}
                rows={8}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400">
                Enter room codes and defect descriptions (one per line). The engine will automatically parse and categorize each issue into Hard Service, Soft Services, or Pest Control.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessManualPaste}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
              >
                Process &amp; Add Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL: PHOTO PREVIEW ZOOM                                 */}
      {/* ============================================================ */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl">
            <img
              src={previewImage}
              alt="Inspection Preview"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. MODAL: PLANON WORK ORDER TICKET QUICK VIEW                */}
      {/* ============================================================ */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Planon Work Order #{viewingTicket.orderNumberDecimal || viewingTicket.ticketNumber}
                    </h3>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        viewingTicket.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : viewingTicket.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}
                    >
                      {viewingTicket.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Linked to WhatsApp Daily Field Inspection Observation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Room</span>
                  <span className="font-mono font-black text-xs text-slate-900 dark:text-white mt-0.5 block">
                    {viewingTicket.unitNumber || viewingTicket.locationCode}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category / Trade</span>
                  <span className="font-black text-xs text-slate-900 dark:text-white mt-0.5 block">
                    {viewingTicket.category}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority</span>
                  <span className="font-black text-xs text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {viewingTicket.priority}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project</span>
                  <span className="font-black text-xs text-slate-900 dark:text-white mt-0.5 block">
                    {viewingTicket.project}
                  </span>
                </div>
              </div>

              {/* Description Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Defect Description
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {viewingTicket.description}
                </p>
              </div>

              {/* Attached Observation Picture (if present) */}
              {viewingTicket.attachedFiles && viewingTicket.attachedFiles.length > 0 && viewingTicket.attachedFiles[0]?.dataUrl && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Inspection Photographic Proof
                  </span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center max-h-56">
                    <img
                      src={viewingTicket.attachedFiles[0].dataUrl}
                      alt="Defect proof"
                      className="max-h-56 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* Reporter Info */}
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Field Inspector / Reporter
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {viewingTicket.reporterName} ({viewingTicket.reporterBadge})
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  {viewingTicket.reporterPhone}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleNavigateToTicketManagement}
                className="px-5 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition flex items-center space-x-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Ticket Management</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Keywords & Auto-Classification Rules Modal */}
      <CategoryKeywordsModal
        isOpen={isKeywordsModalOpen}
        onClose={() => setIsKeywordsModalOpen(false)}
        onRulesUpdated={refreshList}
      />

      {/* Universal WhatsApp API Gateway Hub Modal (Single Centralized Gateway) */}
      <UniversalWhatsAppModal
        isOpen={isUniversalApiModalOpen}
        onClose={() => setIsUniversalApiModalOpen(false)}
        onConfigSaved={(cfg) => {
          setUniversalConfig(cfg);
          refreshList();
        }}
      />
      {/* Hidden file input for close-out photo upload */}
      <input
        type="file"
        ref={closeOutFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleCloseOutFileChange}
      />
    </div>
  );
};

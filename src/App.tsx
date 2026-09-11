import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { GroundStageSelector } from './components/GroundStageSelector';
import { FacilityHero } from './components/FacilityHero';
import { FacilityCustomExperience } from './components/FacilityCustomExperience';
import { DatePickerStrip } from './components/DatePickerStrip';
import { SlotGrid } from './components/SlotGrid';
import { BookingModal } from './components/BookingModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { BatchBookingConfirmationModal } from './components/BatchBookingConfirmationModal';
import { RecurringBookingEngine } from './components/RecurringBookingEngine';
import { LoginPage } from './components/LoginPage';
import { FacilityShowcaseHub } from './components/FacilityShowcaseHub';
import { FacilitySyncTransitionOverlay } from './components/FacilitySyncTransitionOverlay';
import { SyncToastContainer } from './components/SyncToastContainer';
import { TopLoadingBar } from './components/TopLoadingBar';
import { LightweightSectionLoader } from './components/LightweightSectionLoader';
import { ActionCompletionCelebrationModal } from './components/ActionCompletionCelebrationModal';
import { audioFeedback } from './services/audioFeedbackService';
import { ActionFeedback } from './services/actionFeedbackService';

// Lazy load heavy managers and administration modals to drastically reduce initial bundle size
const SearchAndManageModal = React.lazy(() => import('./components/SearchAndManageModal').then((m) => ({ default: m.SearchAndManageModal })));
const GasIntegrationModal = React.lazy(() => import('./components/GasIntegrationModal').then((m) => ({ default: m.GasIntegrationModal })));
const AdminBookingsTable = React.lazy(() => import('./components/AdminBookingsTable').then((m) => ({ default: m.AdminBookingsTable })));
const ChangePasswordModal = React.lazy(() => import('./components/ChangePasswordModal').then((m) => ({ default: m.ChangePasswordModal })));
const IsolationRoomManager = React.lazy(() => import('./components/IsolationRoomManager').then((m) => ({ default: m.IsolationRoomManager })));
const HandoverManager = React.lazy(() => import('./components/HandoverManager').then((m) => ({ default: m.HandoverManager })));
const ParcelManager = React.lazy(() => import('./components/ParcelManager').then((m) => ({ default: m.ParcelManager })));
const LostFoundManager = React.lazy(() => import('./components/LostFoundManager').then((m) => ({ default: m.LostFoundManager })));
const BlankFormsManager = React.lazy(() => import('./components/BlankFormsManager').then((m) => ({ default: m.BlankFormsManager || m.default })));
const InvoiceManager = React.lazy(() => import('./components/InvoiceManager').then((m) => ({ default: m.InvoiceManager })));
const AnnouncementManager = React.lazy(() => import('./components/AnnouncementManager').then((m) => ({ default: m.AnnouncementManager })));
const HelpSupportManager = React.lazy(() => import('./components/HelpSupportManager').then((m) => ({ default: m.HelpSupportManager })));
const TicketManager = React.lazy(() => import('./components/TicketManager').then((m) => ({ default: m.TicketManager })));
const SLAManager = React.lazy(() => import('./components/sla/SLAManager').then((m) => ({ default: m.SLAManager })));
const AutomatedWorkflowManager = React.lazy(() => import('./components/workflow/AutomatedWorkflowManager').then((m) => ({ default: m.AutomatedWorkflowManager })));
const EmailManager = React.lazy(() => import('./components/email/EmailManager').then((m) => ({ default: m.EmailManager })));
const SystemBackupModal = React.lazy(() => import('./components/SystemBackupModal').then((m) => ({ default: m.SystemBackupModal })));
const CommandPaletteModal = React.lazy(() => import('./components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal })));
const ExecutiveAnalyticsModal = React.lazy(() => import('./components/ExecutiveAnalyticsModal').then((m) => ({ default: m.ExecutiveAnalyticsModal })));
const SecurityAuditModal = React.lazy(() => import('./components/SecurityAuditModal').then((m) => ({ default: m.SecurityAuditModal })));
const SystemSettingsModal = React.lazy(() => import('./components/SystemSettingsModal').then((m) => ({ default: m.SystemSettingsModal })));
const CampExecutiveDailyDeckModal = React.lazy(() => import('./components/reports/CampExecutiveDailyDeckModal').then((m) => ({ default: m.CampExecutiveDailyDeckModal })));
import { getFacilityGraphic, FACILITY_THEMES } from './components/FacilityGraphics';
import { FACILITIES } from './data/facilities';
import { Facility, TimeSlot, Booking, GasConnectionConfig } from './types';
import { StorageService, getTodayDateString } from './services/storageService';
import { GasService } from './services/gasService';
import { AuthService } from './services/authService';
import { OfflineQueueService } from './services/offlineQueueService';
import { CloudDatabaseService } from './services/firebaseService';
import { HubService } from './services/hubService';
import { FacilityCustomizationService } from './services/facilityCustomizationService';
import { DesktopNotificationService } from './services/desktopNotificationService';
import { CampusBroadcastBanner } from './components/CampusBroadcastBanner';
import { useTheme } from './context/ThemeContext';
import {
  CalendarRange,
  Calendar,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Zap,
  Layers,
  CheckCircle2,
  CalendarCheck,
  ShieldAlert,
  Lock,
  Crown,
} from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => AuthService.isLoggedIn());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [sessionExpiringWarning, setSessionExpiringWarning] = useState<{ isExpiring: boolean; remainingSec: number }>({
    isExpiring: false,
    remainingSec: 0,
  });

  // Enterprise Security: User Activity Tracker, 30-Min Idle Auto-Logout & Multi-Tab Sync
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Activity touch throttled handler
    let lastTouchTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastTouchTime > 10000) { // throttle touching to once per 10s
        lastTouchTime = now;
        AuthService.touchActivity();
        setSessionExpiringWarning({ isExpiring: false, remainingSec: 0 });
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // 2. Periodic 2-second session validity check & warning calculation (Enforces 30-minute idle auto-logout)
    const securityInterval = setInterval(() => {
      const sessionCheck = AuthService.validateSession();
      if (!sessionCheck.isValid) {
        setIsAuthenticated(false);
        setIsBookingModalOpen(false);
        setIsSearchModalOpen(false);
        setIsGasModalOpen(false);
        setIsAdminModalOpen(false);
        setIsChangePasswordOpen(false);
        return;
      }

      const warning = AuthService.isSessionExpiringSoon();
      if (warning.isExpiring) {
        setSessionExpiringWarning({ isExpiring: true, remainingSec: warning.remainingSeconds });
      } else {
        setSessionExpiringWarning({ isExpiring: false, remainingSec: 0 });
      }
    }, 2000);

    // 3. Multi-Tab Session Synchronization (Instantly logs out if another tab logs out)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tamimi_helpdesk_auth_session_v2') {
        const loggedIn = AuthService.isLoggedIn();
        if (!loggedIn) {
          setIsAuthenticated(false);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(securityInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  // 1. Initial State Initialization
  const [facilities, setFacilities] = useState<Facility[]>(() =>
    FacilityCustomizationService.getAllFacilities()
  );

  useEffect(() => {
    const handleFacilitiesUpdate = () => {
      setFacilities(FacilityCustomizationService.getAllFacilities());
    };
    window.addEventListener('tamimi_facilities_updated', handleFacilitiesUpdate);
    return () => window.removeEventListener('tamimi_facilities_updated', handleFacilitiesUpdate);
  }, []);

  const [currentView, setCurrentView] = useState<'dashboard' | 'booking'>('dashboard');
  const [activeFacilityId, setActiveFacilityId] = useState<string>('barber-booking');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());

  // Booking Mode: 'single' (daily slot booking) | 'recurring' (1 month / long term market system)
  const [bookingMode, setBookingMode] = useState<'single' | 'recurring'>('single');
  const [isCustomOptionsOpen, setIsCustomOptionsOpen] = useState(false);
  
  // Custom Facility Domain Options (Service, Format, Balls, Screen type, etc.)
  const [customOptions, setCustomOptions] = useState<Record<string, any>>({
    barberService: 'haircut',
    cricketFormat: 't20',
    cricketBallType: 'leather_red',
    cricketUmpire: true,
    cricketFloodlights: true,
    footballFormat: '11v11',
    footballBibs: true,
    footballBalls: true,
    footballReferee: false,
    basketMode: 'full',
    basketBall: true,
    basketTimer: true,
    cinemaType: 'movie',
    cinemaPopcorn: true,
    tennisSurface: 'hard',
    tennisRackets: true,
    tennisBallMachine: false,
    netBowlingSpeed: 'fast',
    roomLayout: 'theater',
  });
  
  // Current active facility object
  const activeFacility = useMemo(() => {
    return facilities.find((f) => f.id === activeFacilityId) || facilities[0];
  }, [facilities, activeFacilityId]);

  // Selected stage / sub-resource
  const [selectedStage, setSelectedStage] = useState<string>(() => {
    return activeFacility.stages[0] || '';
  });

  // Stylish Circular Facility Sync Transition State
  const [isFacilitySyncing, setIsFacilitySyncing] = useState<boolean>(false);

  // When facility is clicked from any device/view, show stylish spinner, await live Google Sheets sync, then open
  const handleSelectFacility = useCallback(async (facilityId: string) => {
    // 0. Security Clearance Check: verify user has permission to access this facility
    if (!AuthService.isSuperAdmin() && !AuthService.canAccessFacility(facilityId)) {
      const target = facilities.find((f) => f.id === facilityId);
      alert(`Access Restricted: Your staff account (@${AuthService.getUsername()}) does not have security clearance for "${target?.name || facilityId}". Please contact your administrator.`);
      return;
    }

    const targetFac = facilities.find((f) => f.id === facilityId) || facilities[0];
    
    // 1. Show sleek stylish circular loader and top loading progress immediately
    ActionFeedback.startLoading(targetFac.name, 'Connecting live schedule & stages...', facilityId, 500);
    setIsFacilitySyncing(true);

    const minDelay = new Promise((r) => setTimeout(r, 650));
    const syncPromise = GasService.syncFacility(facilityId).catch((err) => {
      console.warn('Facility sync notice:', err);
    });
    const maxTimeout = new Promise((r) => setTimeout(r, 1600));

    // 2. Await both real sync (or max timeout) AND minimum smooth animation delay
    await Promise.all([
      minDelay,
      Promise.race([syncPromise, maxTimeout]),
    ]);

    // 3. Update active facility & route to booking screen with fresh data
    setActiveFacilityId(facilityId);
    setSelectedStage(targetFac.stages[0] || '');
    setSelectedSlotIds([]);
    setCurrentView('booking');
    setRefreshTrigger((prev) => prev + 1);

    // 4. Smoothly hide spinner and stop loading
    setIsFacilitySyncing(false);
    ActionFeedback.stopLoading();
  }, [facilities]);

  // Selected slot IDs for booking
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  // Facility carousel horizontal scroll handling
  const facilityScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = useCallback(() => {
    if (facilityScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = facilityScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState, facilities]);

  const handleFacilityScroll = (direction: 'left' | 'right') => {
    if (facilityScrollRef.current) {
      const scrollDistance = 280;
      facilityScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth',
      });
      setTimeout(checkScrollState, 200);
    }
  };

  const handleWheelOnFacilityList = (e: React.WheelEvent<HTMLDivElement>) => {
    if (facilityScrollRef.current) {
      // If user scrolls vertical wheel, translate it into horizontal smooth scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        facilityScrollRef.current.scrollLeft += e.deltaY;
        checkScrollState();
      }
    }
  };

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [confirmedBatchBookings, setConfirmedBatchBookings] = useState<Booking[] | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSystemBackupOpen, setIsSystemBackupOpen] = useState(false);
  const [isExecutiveAnalyticsOpen, setIsExecutiveAnalyticsOpen] = useState(false);
  const [isExecutiveDeckOpen, setIsExecutiveDeckOpen] = useState(false);
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [systemSettingsTab, setSystemSettingsTab] = useState<'profile' | 'theme' | 'team' | 'users' | 'bookings' | 'analytics' | 'clouddb' | 'sync' | 'rules' | 'security' | 'notifications' | 'backup' | 'audit'>('profile');

  // Listen for staff switches to keep UI 100% updated in real-time
  useEffect(() => {
    const handleStaffSwitch = () => {
      setIsAuthenticated(AuthService.isLoggedIn());
      setRefreshTrigger((prev) => prev + 1);
      // Auto-validate current facility clearance upon staff switch
      const accessible = AuthService.getAccessibleFacilities();
      if (accessible.length > 0 && !AuthService.canAccessFacility(activeFacilityId)) {
        setActiveFacilityId(accessible[0].id);
        setCurrentView('dashboard');
      }
    };
    window.addEventListener('tamimi_staff_switched', handleStaffSwitch);
    window.addEventListener('tamimi_staff_updated', handleStaffSwitch);
    return () => {
      window.removeEventListener('tamimi_staff_switched', handleStaffSwitch);
      window.removeEventListener('tamimi_staff_updated', handleStaffSwitch);
    };
  }, [activeFacilityId]);

  // Global Keyboard Shortcut: Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Google Apps Script Connection Config
  const [gasConfig, setGasConfig] = useState<GasConnectionConfig>(() => GasService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize storage, real-time hub sync & auto-sync from Google Sheets on mount, window focus, cross-tab events
  useEffect(() => {
    StorageService.init();
    StorageService.recoverFromIndexedDBIfNeeded().then((recovered) => {
      if (recovered) setRefreshTrigger((prev) => prev + 1);
    });
    HubService.init();
    DesktopNotificationService.init();

    // Trigger local refresh handler
    const handleLocalRefresh = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    // Listen to custom local update events for all facilities
    window.addEventListener('tamimi_bookings_updated', handleLocalRefresh);
    window.addEventListener('tamimi_lockdown_updated', handleLocalRefresh);
    window.addEventListener('tamimi_isolation_updated', handleLocalRefresh);
    window.addEventListener('tamimi_handover_updated', handleLocalRefresh);
    window.addEventListener('tamimi_parcels_updated', handleLocalRefresh);
    window.addEventListener('tamimi_lost_found_updated', handleLocalRefresh);
    window.addEventListener('blank_forms_updated', handleLocalRefresh);
    window.addEventListener('invoices_updated', handleLocalRefresh);
    window.addEventListener('notices_updated', handleLocalRefresh);
    window.addEventListener('tickets_updated', handleLocalRefresh);
    window.addEventListener('storage', handleLocalRefresh);

    // Listen to BroadcastChannel for real-time multi-tab syncing
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('tamimi_helpdesk_sync_channel');
      bc.onmessage = (evt) => {
        if (
          evt.data?.type === 'BOOKINGS_UPDATED' ||
          evt.data?.type === 'LOCKDOWN_UPDATED' ||
          evt.data?.type === 'ISOLATION_UPDATED' ||
          evt.data?.type === 'HANDOVER_UPDATED' ||
          evt.data?.type === 'PARCELS_UPDATED' ||
          evt.data?.type === 'LOST_FOUND_UPDATED' ||
          evt.data?.type === 'INVOICES_UPDATED' ||
          evt.data?.type === 'NOTICES_UPDATED'
        ) {
          handleLocalRefresh();
        }
      };
    }

    // Initial background sync from Google Sheets if configured
    const cfg = GasService.getConfig();
    if (cfg.webAppUrl) {
      GasService.syncWithRemote().then((res) => {
        if (res.success) {
          setRefreshTrigger((prev) => prev + 1);
        }
      }).catch(() => {});
    }

    // Cloud Database (Firebase Firestore) Connectivity & Auto-Hydration for Disaster Recovery:
    // When hosted on a fresh server with empty local storage, pull authoritative cloud copy!
    CloudDatabaseService.checkConnectivity().then(() => {
      CloudDatabaseService.autoHydrateIfEmpty().then((hydrated) => {
        if (hydrated) {
          console.info('Disaster Recovery: System state auto-hydrated from Firebase Cloud Firestore.');
          setRefreshTrigger((prev) => prev + 1);
        }
      });
    });

    // Debounced automatic background sync to Cloud Database on local updates
    const handleCloudSync = () => {
      CloudDatabaseService.scheduleDebouncedCloudSync(15000);
    };
    window.addEventListener('tamimi_bookings_updated', handleCloudSync);
    window.addEventListener('tamimi_isolation_updated', handleCloudSync);
    window.addEventListener('tamimi_handover_updated', handleCloudSync);
    window.addEventListener('tamimi_parcels_updated', handleCloudSync);
    window.addEventListener('tamimi_lost_found_updated', handleCloudSync);

    // Window focus / visibility sync (pull fresh bookings if other users booked while user was away)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const currentCfg = GasService.getConfig();
        if (currentCfg.webAppUrl) {
          GasService.syncWithRemote().then((res) => {
            if (res.success) {
              setRefreshTrigger((prev) => prev + 1);
            }
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Resilient offline queue auto-flush on online / request
    const handleRequestFlush = () => {
      OfflineQueueService.flushQueue(GasService).catch(() => {});
    };
    window.addEventListener('tamimi_request_flush_queue', handleRequestFlush);

    const handleNavigateFacility = (e: any) => {
      const targetId = e?.detail?.facilityId;
      if (targetId) {
        handleSelectFacility(targetId);
      }
    };
    window.addEventListener('tamimi_navigate_facility', handleNavigateFacility);

    // Multi-device background polling (every 20 seconds) to ensure changes from other computers arrive automatically
    const interval = setInterval(() => {
      const currentCfg = GasService.getConfig();
      if (currentCfg.webAppUrl) {
        GasService.syncWithRemote().then((res) => {
          if (res.success) {
            setRefreshTrigger((prev) => prev + 1);
          }
        }).catch(() => {});
      }
    }, 20000);

    return () => {
      window.removeEventListener('tamimi_bookings_updated', handleLocalRefresh);
      window.removeEventListener('tamimi_isolation_updated', handleLocalRefresh);
      window.removeEventListener('tamimi_handover_updated', handleLocalRefresh);
      window.removeEventListener('tamimi_parcels_updated', handleLocalRefresh);
      window.removeEventListener('tamimi_lost_found_updated', handleLocalRefresh);
      window.removeEventListener('tamimi_bookings_updated', handleCloudSync);
      window.removeEventListener('tamimi_isolation_updated', handleCloudSync);
      window.removeEventListener('tamimi_handover_updated', handleCloudSync);
      window.removeEventListener('tamimi_parcels_updated', handleCloudSync);
      window.removeEventListener('tamimi_lost_found_updated', handleCloudSync);
      window.removeEventListener('blank_forms_updated', handleLocalRefresh);
      window.removeEventListener('invoices_updated', handleLocalRefresh);
      window.removeEventListener('notices_updated', handleLocalRefresh);
      window.removeEventListener('tickets_updated', handleLocalRefresh);
      window.removeEventListener('storage', handleLocalRefresh);
      if (bc) bc.close();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('tamimi_request_flush_queue', handleRequestFlush);
      window.removeEventListener('tamimi_navigate_facility', handleNavigateFacility);
      clearInterval(interval);
    };
  }, []);

  // Update selected stage if active facility changes
  useEffect(() => {
    if (!activeFacility.stages.includes(selectedStage)) {
      setSelectedStage(activeFacility.stages[0]);
    }
    setSelectedSlotIds([]);
  }, [activeFacility, selectedStage]);

  // Generate Slots for current view
  const currentSlots = useMemo(() => {
    if (refreshTrigger < 0) return [];
    return StorageService.getFacilitySlots(activeFacility, selectedDate, selectedStage);
  }, [activeFacility, selectedDate, selectedStage, refreshTrigger]);

  // Calculate available slot counts and booked counts for all 8 facilities for the selected date
  const { availableSlotCounts, bookedSlotCounts } = useMemo(() => {
    if (refreshTrigger < 0) return { availableSlotCounts: {}, bookedSlotCounts: {} };
    const avail: Record<string, number> = {};
    const booked: Record<string, number> = {};

    facilities.forEach((fac) => {
      const slots = StorageService.getFacilitySlots(fac, selectedDate, fac.stages[0]);
      avail[fac.id] = slots.filter((s) => s.status === 'AVAILABLE').length;
      booked[fac.id] = StorageService.getBookedCountForFacility(fac, selectedDate);
    });

    return { availableSlotCounts: avail, bookedSlotCounts: booked };
  }, [facilities, selectedDate, refreshTrigger]);

  // Handle slot toggle
  const handleToggleSlot = useCallback((slot: TimeSlot) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slot.id)) {
        return prev.filter((id) => id !== slot.id);
      } else {
        return [...prev, slot.id];
      }
    });
  }, []);

  // Handle proceed to booking modal
  const handleProceedToBooking = useCallback(() => {
    if (selectedSlotIds.length === 0) return;
    setIsBookingModalOpen(true);
  }, [selectedSlotIds]);

  // Handle Single Booking Success
  const handleBookingSuccess = useCallback((newBooking: Booking) => {
    setIsBookingModalOpen(false);
    setSelectedSlotIds([]);
    if (newBooking && newBooking.date) {
      setSelectedDate(newBooking.date);
    }
    setRefreshTrigger((prev) => prev + 1);
    setConfirmedBooking(newBooking);
  }, []);

  // Handle Batch / Recurring Booking Success
  const handleBatchBookingSuccess = useCallback((newBookings: Booking[]) => {
    audioFeedback.playSuccessChime();
    setRefreshTrigger((prev) => prev + 1);
    setConfirmedBatchBookings(newBookings);
    ActionFeedback.showSuccess({
      title: 'Recurring Series Created!',
      subtitle: `${newBookings.length} scheduled reservations generated`,
      facilityName: activeFacility.name,
      facilityId: activeFacility.id,
      details: [
        { label: 'Facility', value: activeFacility.name },
        { label: 'Total Sessions', value: `${newBookings.length} reserved slots` },
        { label: 'Lead Session', value: newBookings[0]?.date || selectedDate },
      ],
      primaryActionLabel: 'View Schedule Series',
    });
  }, [activeFacility, selectedDate]);

  // Handle Booking Cancellation from search or confirmation modal
  const handleBookingCancelled = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    if (confirmedBooking) {
      setConfirmedBooking(null);
    }
  }, [confirmedBooking]);

  const handleOpenSearchWithQuery = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchModalOpen(true);
  }, []);

  const handleViewBookingDetails = useCallback((bookingId: string) => {
    const b = StorageService.getBookingById(bookingId);
    if (b) {
      setConfirmedBooking(b);
    } else {
      setSearchQuery(bookingId);
      setIsSearchModalOpen(true);
    }
  }, []);

  // Direct double click on a slot -> immediately select slot and open booking modal (no prior selection needed)
  const handleDirectSlotBooking = useCallback((slot: TimeSlot) => {
    setSelectedSlotIds([slot.id]);
    setIsBookingModalOpen(true);
  }, []);

  // Handle GAS Sync (Whole System)
  const handleSyncGas = async () => {
    setIsSyncing(true);
    try {
      const res = await GasService.syncWithRemote(true);
      if (res.success) {
        setRefreshTrigger((prev) => prev + 1);
        window.dispatchEvent(new CustomEvent('tamimi_bookings_updated'));
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setGasConfig(GasService.getConfig());
      setIsSyncing(false);
    }
  };

  const handleSaveGasConfig = (newConfig: GasConnectionConfig) => {
    GasService.saveConfig(newConfig);
    setGasConfig(newConfig);
  };

  // If user is not logged in, show secure login page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          // Automatically sync the whole system with Google Sheets upon login
          handleSyncGas();
        }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  const isFullHeightLocked = currentView === 'dashboard';

  return (
    <div className={`min-h-screen ${isFullHeightLocked ? 'xl:h-screen xl:overflow-hidden overflow-y-auto' : ''} bg-slate-100/90 dark:bg-slate-950 text-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-sky-600 selection:text-white transition-colors duration-300 relative`}>
      {/* High-Definition Ambient Light Backdrop */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/50 via-slate-100/20 to-slate-200/50 dark:from-sky-950/25 dark:via-transparent dark:to-slate-950/60 -z-10" />

      {/* Campus Emergency Broadcast Alert Banner */}
      <CampusBroadcastBanner />

      {/* Top Header */}
      <Header
        onOpenSearch={() => {
          audioFeedback.playTap();
          setIsSearchModalOpen(true);
        }}
        onOpenSystemSettings={(tab) => {
          audioFeedback.playTap();
          setSystemSettingsTab(tab || 'profile');
          setIsSystemSettingsOpen(true);
        }}
        onOpenGasModal={() => {
          audioFeedback.playTap();
          setIsGasModalOpen(true);
        }}
        onOpenAdminModal={() => {
          audioFeedback.playTap();
          setIsAdminModalOpen(true);
        }}
        onOpenExecutiveAnalytics={() => {
          audioFeedback.playTap();
          ActionFeedback.startLoading('Executive Analytics', 'Loading live metrics & utilization...', undefined, 260);
          setIsExecutiveAnalyticsOpen(true);
        }}
        onOpenSecurityAudit={() => {
          audioFeedback.playTap();
          ActionFeedback.startLoading('Security & Audit Log', 'Scanning authorization trails...', undefined, 260);
          setIsSecurityAuditOpen(true);
        }}
        onOpenChangePassword={() => {
          audioFeedback.playTap();
          setIsChangePasswordOpen(true);
        }}
        onOpenSystemBackup={() => {
          audioFeedback.playTap();
          setIsSystemBackupOpen(true);
        }}
        onLogout={() => {
          audioFeedback.playTap();
          AuthService.logout('user_manual');
          setIsAuthenticated(false);
        }}
        onLockScreen={() => {
          audioFeedback.playTap();
          AuthService.logout('lock_screen');
          setIsAuthenticated(false);
        }}
        onNavigateHome={() => {
          audioFeedback.playTap();
          ActionFeedback.startLoading('Executive Facilities Hub', 'Returning to 20 facilities overview...', undefined, 300);
          setCurrentView('dashboard');
        }}
        onNavigateFacility={(facilityId) => {
          handleSelectFacility(facilityId);
        }}
        activeFacilityId={activeFacilityId}
        onOpenCommandPalette={() => {
          audioFeedback.playTap();
          setIsCommandPaletteOpen(true);
        }}
        currentView={currentView}
        gasConfig={gasConfig}
        onSyncGas={handleSyncGas}
        isSyncing={isSyncing}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleOpenSearchWithQuery}
      />

      {/* Inactivity Security Warning Banner */}
      {sessionExpiringWarning.isExpiring && (
        <div className="w-full bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between shadow-md z-40 text-xs font-black animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
            <span>
              Security Notice: Session will automatically log out in{' '}
              <span className="font-mono underline">{sessionExpiringWarning.remainingSec}s</span> due to 30 minutes of inactivity.
            </span>
          </div>
          <button
            onClick={() => {
              AuthService.touchActivity();
              setSessionExpiringWarning({ isExpiring: false, remainingSec: 0 });
            }}
            className="px-3.5 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
          >
            Stay Logged In
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full px-2 sm:px-2.5 lg:px-3 ${isFullHeightLocked ? 'py-0.5 sm:py-1 flex flex-col min-h-0 xl:overflow-hidden overflow-y-auto' : 'py-1.5 sm:py-2 space-y-3'}`}>
        {currentView === 'dashboard' ? (
          /* ========================================================
             1. MAIN LANDING DASHBOARD: FACILITY SHOWCASE HUB
             Shows all 20 facilities, fitted cleanly to screen with zero scrolling
             ======================================================== */
          <FacilityShowcaseHub
            facilities={facilities}
            selectedDate={selectedDate}
            onSelectFacility={(facilityId) => {
              handleSelectFacility(facilityId);
            }}
            onOpenSearch={() => setIsSearchModalOpen(true)}
            onOpenAdminModal={() => setIsAdminModalOpen(true)}
          />
        ) : !AuthService.isSuperAdmin() && !AuthService.canAccessFacility(activeFacilityId) ? (
          <div className="w-full max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-red-300 dark:border-red-900/80 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                Security Clearance Restricted
              </span>
              <h2 className="text-xl font-black text-slate-950 dark:text-white pt-1">
                {activeFacility.name} Access Denied
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Your staff account (<strong className="text-slate-900 dark:text-white">@{AuthService.getUsername()}</strong>) does not have authorization to view or manage reservations for this facility.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Role: <strong className="text-slate-800 dark:text-slate-200">{AuthService.getUserRole()}</strong> · Assigned Venues: <strong className="text-slate-800 dark:text-slate-200">{AuthService.getUserAssignedFacilityIds().length}</strong>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition shadow-md cursor-pointer"
              >
                ← Return to Hub Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             2. FACILITY RESERVATION & MANAGEMENT SCREEN
             (Strict single-facility view: to change facility, user clicks Back to Home)
             ======================================================== */
          <>
            {/* Selected Facility Hero Banner - Excluded for ticket-management & automated-workflow as requested */}
            {!['ticket-management', 'automated-workflow'].includes(activeFacilityId) && (
              <FacilityHero
                facility={activeFacility}
                onReturnToDashboard={() => setCurrentView('dashboard')}
              />
            )}

        {/* Specialized Facility Managers & Gatekeeper */}
        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 min-h-[300px]">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-sm font-semibold tracking-wide">Loading module...</span>
            </div>
          }
        >
          {activeFacilityId === 'isolation-room' ? (
            <IsolationRoomManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'handover-takenover' ? (
            <HandoverManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'parcel-monitoring' ? (
            <ParcelManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'lost-and-found' ? (
            <LostFoundManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'blank-forms' ? (
            <BlankFormsManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'invoice-manager' ? (
            <InvoiceManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'announcement-notice' ? (
            <AnnouncementManager onRefresh={() => setRefreshTrigger((prev) => prev + 1)} />
          ) : activeFacilityId === 'help-support' ? (
            <HelpSupportManager
              onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
              onReturnToDashboard={() => setCurrentView('dashboard')}
            />
          ) : activeFacilityId === 'ticket-management' ? (
            <TicketManager onBack={() => setCurrentView('dashboard')} />
          ) : activeFacilityId === 'sla-management' ? (
            <SLAManager onBack={() => setCurrentView('dashboard')} />
          ) : activeFacilityId === 'automated-workflow' ? (
            <AutomatedWorkflowManager onBack={() => setCurrentView('dashboard')} />
          ) : activeFacilityId === 'email-management' ? (
            <EmailManager onBack={() => setCurrentView('dashboard')} />
          ) : activeFacility.stages.length > 1 && !selectedStage ? (
            /* Step 1: Force User to Select Ground / Stage first for multi-stage facilities (Cricket Ground & Multipurpose Room) */
            <GroundStageSelector
              facility={activeFacility}
              selectedDate={selectedDate}
              onSelectStage={(stage) => {
                setSelectedStage(stage);
                setSelectedSlotIds([]);
              }}
            />
          ) : (
            <>
              {/* Collapsible Facility Custom Experience Drawer */}
              {isCustomOptionsOpen && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <FacilityCustomExperience
                  facility={activeFacility}
                  selectedStage={selectedStage}
                  onSelectStage={(stage) => {
                    setSelectedStage(stage);
                    setSelectedSlotIds([]);
                  }}
                  customOptions={customOptions}
                  onOptionsChange={setCustomOptions}
                />
              </div>
            )}

            {/* Mode A: Daily Single Slot Booking */}
            {bookingMode === 'single' && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
                {/* Date Selector Strip (Accurate Booking Counts filtered by facility and stage) */}
                <DatePickerStrip
                  selectedDate={selectedDate}
                  onSelectDate={(newDate) => {
                    setSelectedDate(newDate);
                    setSelectedSlotIds([]);
                  }}
                  facility={activeFacility}
                  selectedStage={selectedStage}
                />

                {/* Operational Slot Grid with integrated executive controls */}
                <SlotGrid
                  slots={currentSlots}
                  facility={activeFacility}
                  selectedSlotIds={selectedSlotIds}
                  onToggleSlot={handleToggleSlot}
                  onSlotDoubleClick={handleDirectSlotBooking}
                  onClearSlots={() => setSelectedSlotIds([])}
                  onProceedToBooking={handleProceedToBooking}
                  onViewBookingDetails={handleViewBookingDetails}
                  bookingMode={bookingMode}
                  onSelectBookingMode={setBookingMode}
                  isCustomOptionsOpen={isCustomOptionsOpen}
                  onToggleCustomOptions={() => setIsCustomOptionsOpen(!isCustomOptionsOpen)}
                  onReturnToDashboard={() => setCurrentView('dashboard')}
                  selectedStage={selectedStage}
                  onSelectStage={(stage) => {
                    setSelectedStage(stage);
                    setSelectedSlotIds([]);
                  }}
                />
              </div>
            )}

            {/* Mode B: Long-Term & Season Recurring Booking (e.g. 1 Month Cricket Ground Booking) */}
            {bookingMode === 'recurring' && (
              <div className="animate-in fade-in duration-150">
                <RecurringBookingEngine
                  facility={activeFacility}
                  selectedStage={selectedStage}
                  customOptions={customOptions}
                  onBatchBooked={handleBatchBookingSuccess}
                  onSwitchToSingle={() => setBookingMode('single')}
                  onToggleCustomOptions={() => setIsCustomOptionsOpen(!isCustomOptionsOpen)}
                  isCustomOptionsOpen={isCustomOptionsOpen}
                  onReturnToDashboard={() => setCurrentView('dashboard')}
                  onSelectStage={(stage) => {
                    setSelectedStage(stage);
                    setSelectedSlotIds([]);
                  }}
                />
              </div>
            )}
          </>
        )}
        </React.Suspense>
      </>
    )}
  </main>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        facility={activeFacility}
        stage={selectedStage}
        date={selectedDate}
        selectedSlots={currentSlots.filter((s) => selectedSlotIds.includes(s.id))}
        customOptions={customOptions}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Booking Confirmation & Pass Modal (Single Slot) */}
      <BookingConfirmationModal
        booking={confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
        onCancelBooking={(id) => {
          const cancelRes = StorageService.cancelBooking(id, 'Cancelled from Pass Modal');
          const b = cancelRes.booking || confirmedBooking;
          if (b) {
            GasService.pushCancelToRemote({
              bookingId: b.id,
              phoneNumber: b.phoneNumber,
              reason: 'Cancelled from Pass Modal',
              facilityName: b.facilityName || b.facilityId,
              sheetTabName: b.sheetTabName,
              stage: b.stage,
              date: b.date,
              startTime: b.startTime,
              endTime: b.endTime,
              durationMinutes: b.durationMinutes,
              guestsCount: b.numberOfGuests,
              customerName: b.customerName,
            }).catch(console.warn);
          } else {
            GasService.pushCancelToRemote(id, confirmedBooking?.phoneNumber || '', 'Cancelled from Pass Modal').catch(console.warn);
          }
          handleBookingCancelled();
        }}
      />

      {/* Batch Booking Confirmation Modal (Multi-Date / Season Schedule) */}
      <BatchBookingConfirmationModal
        bookings={confirmedBatchBookings}
        onClose={() => setConfirmedBatchBookings(null)}
      />

      {/* Lazy Loaded Administration & Settings Modals */}
      <React.Suspense fallback={null}>
        {/* Search & Manage Bookings Modal (Instant Search Engine) */}
        {isSearchModalOpen && (
          <SearchAndManageModal
            isOpen={isSearchModalOpen}
            onClose={() => {
              setIsSearchModalOpen(false);
              setSearchQuery('');
            }}
            initialQuery={searchQuery}
            onBookingCancelled={handleBookingCancelled}
          />
        )}

        {/* Google Apps Script & Sheets Integration Modal */}
        {isGasModalOpen && (
          <GasIntegrationModal
            isOpen={isGasModalOpen}
            onClose={() => setIsGasModalOpen(false)}
            config={gasConfig}
            onSaveConfig={handleSaveGasConfig}
            onSync={handleSyncGas}
          />
        )}

        {/* Master 8-Sheet Admin Table */}
        {isAdminModalOpen && (
          <AdminBookingsTable
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
            onBookingCancelled={handleBookingCancelled}
          />
        )}

        {/* User Security & Change Password Modal */}
        {isChangePasswordOpen && (
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
          />
        )}

        {/* Enterprise System Backup, Storage Diagnostics & Offline Sync Resilience */}
        {isSystemBackupOpen && (
          <SystemBackupModal
            isOpen={isSystemBackupOpen}
            onClose={() => setIsSystemBackupOpen(false)}
          />
        )}

        {/* Executive Analytics, Shift Closing Summary & Maintenance Blockouts */}
        {isExecutiveAnalyticsOpen && (
          <ExecutiveAnalyticsModal
            isOpen={isExecutiveAnalyticsOpen}
            onClose={() => setIsExecutiveAnalyticsOpen(false)}
            onBlockoutChanged={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}

        {/* Enterprise Executive Daily Operations & KPI Slide Deck */}
        {isExecutiveDeckOpen && (
          <CampExecutiveDailyDeckModal
            isOpen={isExecutiveDeckOpen}
            onClose={() => setIsExecutiveDeckOpen(false)}
          />
        )}

        {/* Enterprise Security Audit Trail & Verification */}
        {isSecurityAuditOpen && (
          <SecurityAuditModal
            isOpen={isSecurityAuditOpen}
            onClose={() => setIsSecurityAuditOpen(false)}
          />
        )}

        {/* Central System Administration & Settings Hub (RBAC, All Bookings, Analytics, Sync, Rules, Security) */}
        {isSystemSettingsOpen && (
          <SystemSettingsModal
            isOpen={isSystemSettingsOpen}
            onClose={() => setIsSystemSettingsOpen(false)}
            initialTab={systemSettingsTab}
            gasConfig={gasConfig}
            onSaveGasConfig={(cfg) => {
              setGasConfig(cfg);
              GasService.saveConfig(cfg);
            }}
            onSyncGas={handleSyncGas}
            onBookingCancelled={handleBookingCancelled}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            onNavigateFacility={(facId) => handleSelectFacility(facId)}
            onOpenSystemBackup={() => setIsSystemBackupOpen(true)}
          />
        )}

        {/* Global Command Palette & Unified Search (Ctrl+K) */}
        {isCommandPaletteOpen && (
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectFacility={(facId) => {
              handleSelectFacility(facId);
            }}
          />
        )}
      </React.Suspense>

      {/* Facility Google Sheet Real-Time Sync Transition Overlay */}
      <FacilitySyncTransitionOverlay
        isOpen={isFacilitySyncing}
      />

      {/* Minimal Footer with Designer Tag */}
      <footer className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-1 sm:py-1.5 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center space-x-2 text-slate-500 text-[10.5px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Engine Active</span>
              <span>·</span>
              <span>© {new Date().getFullYear()} All Rights Reserved</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Real-Time Sync Toast Notification Engine */}
      <SyncToastContainer />

      {/* Global Lightweight Top Progress Indicator */}
      <TopLoadingBar />

      {/* Seamless Lightweight Section Transition Loader */}
      <LightweightSectionLoader />

      {/* Action Completion & Celebratory Confetti Feedback Modal */}
      <ActionCompletionCelebrationModal />

    </div>
  );
}

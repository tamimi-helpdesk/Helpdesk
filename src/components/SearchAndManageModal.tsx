import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  XCircle,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Building,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sparkles,
  ShieldCheck,
  Crown,
  FileText,
  Printer,
  MessageCircle,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Bed,
  Layers,
  Package,
  Receipt,
  LifeBuoy,
  KeyRound,
  Archive,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking, IsolationRoomRecord, BedOccupant, HandoverItemRecord, ParcelRecord, LostFoundRecord, CancellationLogEntry } from '../types';
import { StorageService, formatDisplayTime, formatDisplayDate } from '../services/storageService';
import { GasService } from '../services/gasService';
import { BookingAdmissionPrintModal } from './BookingAdmissionPrintModal';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { AuthService } from '../services/authService';

interface SearchAndManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onBookingCancelled: () => void;
}

export const SearchAndManageModal: React.FC<SearchAndManageModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onBookingCancelled,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'ALL' | 'FACILITY' | 'RECURRING' | 'ISOLATION' | 'HANDOVER' | 'PARCEL' | 'LOST_FOUND' | 'INVOICES' | 'TICKETS' | 'CANCELLATIONS'
  >('ALL');
  const [dataVersion, setDataVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & confirmation state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [selectedGroupForCancel, setSelectedGroupForCancel] = useState<{ groupId: string; summary: string; count: number } | null>(null);
  const [selectedBookingForDelete, setSelectedBookingForDelete] = useState<Booking | null>(null);
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<Booking | null>(null);
  const [selectedBookingForWhatsApp, setSelectedBookingForWhatsApp] = useState<Booking | null>(null);
  const [whatsAppCustomMessage, setWhatsAppCustomMessage] = useState<string | null>(null);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState<{ name: string; phone: string } | null>(null);

  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync initial query and reload fresh data whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialQuery !== undefined) {
        setSearchTerm(initialQuery);
      }
      StorageService.init();
      setDataVersion((v) => v + 1);
    }
  }, [isOpen, initialQuery]);

  // Real-time synchronization: listen to storage and background sync events
  useEffect(() => {
    const handleStorageUpdate = () => {
      setDataVersion((v) => v + 1);
    };

    window.addEventListener('tamimi_bookings_updated', handleStorageUpdate);
    window.addEventListener('tamimi_isolation_updated', handleStorageUpdate);
    window.addEventListener('tamimi_handover_updated', handleStorageUpdate);
    window.addEventListener('tamimi_parcels_updated', handleStorageUpdate);
    window.addEventListener('tamimi_lost_found_updated', handleStorageUpdate);
    window.addEventListener('invoices_updated', handleStorageUpdate);
    window.addEventListener('tickets_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('tamimi_bookings_updated', handleStorageUpdate);
      window.removeEventListener('tamimi_isolation_updated', handleStorageUpdate);
      window.removeEventListener('tamimi_handover_updated', handleStorageUpdate);
      window.removeEventListener('tamimi_parcels_updated', handleStorageUpdate);
      window.removeEventListener('tamimi_lost_found_updated', handleStorageUpdate);
      window.removeEventListener('invoices_updated', handleStorageUpdate);
      window.removeEventListener('tickets_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Manual refresh handler to pull latest updates
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      StorageService.init();
      await GasService.syncWithRemote();
      setDataVersion((v) => v + 1);
      setNotification({
        type: 'success',
        message: 'Records synchronized with latest cloud and local register.',
      });
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: 'Could not complete cloud refresh: ' + (e?.message || 'Network error'),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle group expansion
  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // 1. Process Facility Bookings (with multi-slot schedule grouping and all camp records)
  const {
    singleBookings,
    recurringScheduleGroups,
    isolationMatches,
    handoverMatches,
    parcelMatches,
    lostFoundMatches,
    invoiceMatches,
    ticketMatches,
    cancellationLogs,
  } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _v = dataVersion;
    const term = (searchTerm || '').trim();
    let rawBookings: Booking[] = [];

    try {
      if (!term) {
        rawBookings = StorageService.getAllBookings() || [];
      } else {
        rawBookings = StorageService.searchBookings(term) || [];
      }
    } catch (err) {
      console.warn('Error retrieving bookings in SearchAndManageModal:', err);
      rawBookings = [];
    }

    if (statusFilter !== 'ALL') {
      rawBookings = rawBookings.filter((b) => b && b.status === statusFilter);
    }

    // Filter out invalid items
    const validBookings = rawBookings.filter(
      (b) => b && b.id && b.id !== 'Booking ID' && b.date !== 'Date'
    );

    // Grouping logic:
    // If a booking belongs to a recurringGroupId or is part of a linked multi-slot series,
    // collect all related bookings together so searching for 1 slot returns the entire 1-month or multi-day series!
    const groupedMap = new Map<string, Booking[]>();
    const singles: Booking[] = [];
    const processedIds = new Set<string>();

    validBookings.forEach((b) => {
      if (!b || !b.id || processedIds.has(b.id)) return;

      const linked = StorageService.getLinkedBookings(b) || [];
      const isMultiSlot = linked.length > 1;

      if (isMultiSlot) {
        const groupKey = b.recurringGroupId || StorageService.getMasterScheduleRef(b);
        
        // Ensure we retrieve all bookings in the system for this group, even if search matched just one slot
        const allInGroup = StorageService.getLinkedBookings(b) || [];
        const filteredGroup = statusFilter === 'ALL' 
          ? allInGroup 
          : allInGroup.filter((slot) => slot && slot.status === statusFilter);

        if (filteredGroup.length > 0) {
          groupedMap.set(groupKey, filteredGroup);
        }

        allInGroup.forEach((slot) => {
          if (slot && slot.id) processedIds.add(slot.id);
        });
      } else {
        singles.push(b);
        if (b.id) processedIds.add(b.id);
      }
    });

    // Format schedule groups
    const scheduleGroups: {
      groupId: string;
      bookings: Booking[];
      facilityName: string;
      facilityId: string;
      stage: string;
      customerName: string;
      phoneNumber: string;
      departmentOrTeam?: string;
      summary: string;
      totalCount: number;
      activeCount: number;
      cancelledCount: number;
      startDate: string;
      endDate: string;
    }[] = [];

    groupedMap.forEach((slots, groupId) => {
      slots.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.startTime || '').localeCompare(String(b.startTime || '')));
      const first = slots[0];
      const last = slots[slots.length - 1];
      if (!first || !last) return;
      const activeCount = slots.filter((s) => s && s.status === 'CONFIRMED').length;
      const cancelledCount = slots.filter((s) => s && s.status === 'CANCELLED').length;

      scheduleGroups.push({
        groupId,
        bookings: slots,
        facilityName: first.facilityName || 'Facility',
        facilityId: first.facilityId || '',
        stage: first.stage || '',
        customerName: first.customerName || 'Guest',
        phoneNumber: first.phoneNumber || '',
        departmentOrTeam: first.departmentOrTeam,
        summary: first.recurringSummary || `${slots.length} Booked Slots (${first.date || ''} to ${last.date || ''})`,
        totalCount: slots.length,
        activeCount,
        cancelledCount,
        startDate: first.date || '',
        endDate: last.date || '',
      });
    });

    scheduleGroups.sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));

    // Sort single facility bookings so newest bookings are always at the top!
    singles.sort((a, b) => {
      const createdA = a.createdAt || '';
      const createdB = b.createdAt || '';
      const createdComp = createdB.localeCompare(createdA);
      if (createdComp !== 0) return createdComp;
      return String(b.date || '').localeCompare(String(a.date || ''));
    });

    // 2. Isolation Room Search
    let isoResults: { room: IsolationRoomRecord; occupants: BedOccupant[] }[] = [];
    try {
      if (term) {
        isoResults = StorageService.searchIsolationRooms(term) || [];
      } else {
        // Show all occupied rooms if no search term
        const rooms = StorageService.getIsolationRooms() || [];
        isoResults = rooms
          .filter((r) => r && Array.isArray(r.occupants) && r.occupants.length > 0)
          .map((r) => ({ room: r, occupants: r.occupants || [] }));
      }
    } catch (err) {
      console.warn('Error searching isolation rooms in SearchAndManageModal:', err);
      isoResults = [];
    }

    // 3. Handover Items Search
    let handoverRes: HandoverItemRecord[] = [];
    try {
      const handovers = StorageService.getHandoverRecords() || [];
      const lowerTerm = term.toLowerCase();
      handoverRes = term
        ? handovers.filter((h) => {
            if (!h) return false;
            return (
              String(h.itemName || '').toLowerCase().includes(lowerTerm) ||
              String(h.personName || '').toLowerCase().includes(lowerTerm) ||
              String(h.badgeOrIdNumber || '').toLowerCase().includes(lowerTerm) ||
              String(h.roomNumber || '').toLowerCase().includes(lowerTerm) ||
              String(h.id || '').toLowerCase().includes(lowerTerm) ||
              String(h.phoneNumber || '').toLowerCase().includes(lowerTerm) ||
              String(h.type || '').toLowerCase().includes(lowerTerm)
            );
          })
        : handovers;
    } catch (err) {
      console.warn('Error filtering handovers in SearchAndManageModal:', err);
      handoverRes = [];
    }

    // 4. Parcels Search
    let parcelRes: ParcelRecord[] = [];
    try {
      const parcels = StorageService.getParcelRecords() || [];
      const lowerTerm = term.toLowerCase();
      parcelRes = term
        ? parcels.filter((p) => {
            if (!p) return false;
            return (
              String(p.recipientName || '').toLowerCase().includes(lowerTerm) ||
              String(p.roomNumber || '').toLowerCase().includes(lowerTerm) ||
              String(p.trackingNumber || '').toLowerCase().includes(lowerTerm) ||
              String(p.courierCompany || '').toLowerCase().includes(lowerTerm) ||
              String(p.phoneNumber || '').toLowerCase().includes(lowerTerm) ||
              String(p.id || '').toLowerCase().includes(lowerTerm)
            );
          })
        : parcels;
    } catch (err) {
      console.warn('Error filtering parcels in SearchAndManageModal:', err);
      parcelRes = [];
    }

    // 5. Lost & Found Search
    let lostFoundRes: LostFoundRecord[] = [];
    try {
      const lostItems = StorageService.getLostFoundRecords() || [];
      const lowerTerm = term.toLowerCase();
      lostFoundRes = term
        ? lostItems.filter((l) => {
            if (!l) return false;
            return (
              String(l.itemName || '').toLowerCase().includes(lowerTerm) ||
              String(l.finderOrReporterName || '').toLowerCase().includes(lowerTerm) ||
              String(l.locationFoundOrLost || '').toLowerCase().includes(lowerTerm) ||
              String(l.ownerName || '').toLowerCase().includes(lowerTerm) ||
              String(l.id || '').toLowerCase().includes(lowerTerm)
            );
          })
        : lostItems;
    } catch (err) {
      console.warn('Error filtering lost & found in SearchAndManageModal:', err);
      lostFoundRes = [];
    }

    // 6. Invoices Search
    let invoiceRes: any[] = [];
    try {
      const invoices = StorageService.getInvoices() || [];
      const lowerTerm = term.toLowerCase();
      invoiceRes = term
        ? invoices.filter((i: any) => {
            if (!i) return false;
            return (
              String(i.invoiceNumber || '').toLowerCase().includes(lowerTerm) ||
              String(i.guestOrClientName || '').toLowerCase().includes(lowerTerm) ||
              String(i.roomNumber || '').toLowerCase().includes(lowerTerm) ||
              String(i.companyName || '').toLowerCase().includes(lowerTerm) ||
              String(i.id || '').toLowerCase().includes(lowerTerm)
            );
          })
        : invoices;
    } catch (err) {
      console.warn('Error filtering invoices in SearchAndManageModal:', err);
      invoiceRes = [];
    }

    // 7. Support Tickets Search
    let ticketRes: any[] = [];
    try {
      const tickets = StorageService.getSupportTickets() || [];
      const lowerTerm = term.toLowerCase();
      ticketRes = term
        ? tickets.filter((t: any) => {
            if (!t) return false;
            return (
              String(t.ticketId || '').toLowerCase().includes(lowerTerm) ||
              String(t.title || '').toLowerCase().includes(lowerTerm) ||
              String(t.requesterName || '').toLowerCase().includes(lowerTerm) ||
              String(t.department || '').toLowerCase().includes(lowerTerm) ||
              String(t.roomNumber || '').toLowerCase().includes(lowerTerm) ||
              String(t.id || '').toLowerCase().includes(lowerTerm)
            );
          })
        : tickets;
    } catch (err) {
      console.warn('Error filtering tickets in SearchAndManageModal:', err);
      ticketRes = [];
    }

    // 8. Cancellation Logs (14-Day Audit Trail)
    let cancellationLogsRes: CancellationLogEntry[] = [];
    try {
      StorageService.purgeExpiredCancellationLogs();
      const logs = StorageService.getCancellationLogs() || [];
      const lowerTerm = term.toLowerCase();
      cancellationLogsRes = term
        ? logs.filter((l) => {
            if (!l) return false;
            return (
              String(l.bookingId || '').toLowerCase().includes(lowerTerm) ||
              String(l.customerName || '').toLowerCase().includes(lowerTerm) ||
              String(l.phoneNumber || '').toLowerCase().includes(lowerTerm) ||
              String(l.facilityName || '').toLowerCase().includes(lowerTerm) ||
              String(l.stage || '').toLowerCase().includes(lowerTerm) ||
              String(l.cancellationReason || '').toLowerCase().includes(lowerTerm) ||
              String(l.cancelledBy || '').toLowerCase().includes(lowerTerm) ||
              String(l.date || '').toLowerCase().includes(lowerTerm)
            );
          })
        : logs;
    } catch (err) {
      console.warn('Error filtering cancellation logs in SearchAndManageModal:', err);
      cancellationLogsRes = [];
    }

    return {
      singleBookings: singles,
      recurringScheduleGroups: scheduleGroups,
      isolationMatches: isoResults,
      handoverMatches: handoverRes,
      parcelMatches: parcelRes,
      lostFoundMatches: lostFoundRes,
      invoiceMatches: invoiceRes,
      ticketMatches: ticketRes,
      cancellationLogs: cancellationLogsRes,
    };
  }, [searchTerm, statusFilter, dataVersion]);

  if (!isOpen) return null;

  // Execute cancellation for a single booking slot
  const handleExecuteCancel = async () => {
    if (!selectedBookingForCancel) return;

    if (!AuthService.canCancelBookings()) {
      setNotification({ type: 'error', message: 'Access Denied: Your staff role does not have permission to cancel bookings.' });
      return;
    }

    setIsCancelling(true);
    setNotification(null);

    try {
      const result = StorageService.cancelBooking(selectedBookingForCancel.id, cancelReason);

      if (!result.success) {
        setNotification({ type: 'error', message: result.error || 'Failed to cancel booking.' });
        setIsCancelling(false);
        return;
      }

      // Sync with GAS backend - deletes row from facility sheet and archives in Cancellation Logs
      GasService.pushCancelToRemote({
        bookingId: selectedBookingForCancel.id,
        phoneNumber: selectedBookingForCancel.phoneNumber,
        reason: cancelReason || 'Cancelled via Portal',
        facilityName: selectedBookingForCancel.facilityName || selectedBookingForCancel.facilityId,
        sheetTabName: selectedBookingForCancel.sheetTabName,
        stage: selectedBookingForCancel.stage,
        date: selectedBookingForCancel.date,
        startTime: selectedBookingForCancel.startTime,
        endTime: selectedBookingForCancel.endTime,
        durationMinutes: selectedBookingForCancel.durationMinutes,
        guestsCount: selectedBookingForCancel.numberOfGuests,
        customerName: selectedBookingForCancel.customerName,
        cancelledBy: AuthService.getCurrentUser()?.username || 'Staff',
      }).catch(console.warn);

      setNotification({
        type: 'success',
        message: `Booking ${selectedBookingForCancel.id} was successfully cancelled. Slot is now AVAILABLE!`,
      });

      setSelectedBookingForCancel(null);
      setCancelReason('');
      setIsCancelling(false);
      setDataVersion((v) => v + 1);
      onBookingCancelled();
    } catch (err: any) {
      setIsCancelling(false);
      setNotification({ type: 'error', message: err.message || 'Error occurred during cancellation.' });
    }
  };

  // Execute cancellation for an entire recurring schedule group
  const handleExecuteCancelGroup = async () => {
    if (!selectedGroupForCancel) return;

    if (!AuthService.canCancelBookings()) {
      setNotification({ type: 'error', message: 'Access Denied: Your staff role does not have permission to cancel bookings.' });
      return;
    }

    setIsCancelling(true);
    setNotification(null);

    try {
      const result = StorageService.cancelRecurringGroup(
        selectedGroupForCancel.groupId,
        cancelReason || 'Cancelled entire multi-slot recurring schedule'
      );

      if (!result.success) {
        setNotification({ type: 'error', message: result.error || 'Failed to cancel schedule group.' });
        setIsCancelling(false);
        return;
      }

      setNotification({
        type: 'success',
        message: `Successfully cancelled all ${result.cancelledCount} slots in schedule "${selectedGroupForCancel.groupId}". All time slots are now released!`,
      });

      setSelectedGroupForCancel(null);
      setCancelReason('');
      setIsCancelling(false);
      setDataVersion((v) => v + 1);
      onBookingCancelled();
    } catch (err: any) {
      setIsCancelling(false);
      setNotification({ type: 'error', message: err.message || 'Error occurred during group cancellation.' });
    }
  };

  // Permanent deletion of a booking
  const handleExecuteDelete = async () => {
    if (!selectedBookingForDelete) return;

    if (!AuthService.canDeleteRecords()) {
      setNotification({ type: 'error', message: 'Access Denied: Only Super Administrators can permanently delete records.' });
      return;
    }

    setIsDeleting(true);
    setNotification(null);

    try {
      const bookingId = selectedBookingForDelete.id;
      const phone = selectedBookingForDelete.phoneNumber;

      StorageService.deleteBooking(bookingId);

      GasService.pushDeleteToRemote({
        bookingId: selectedBookingForDelete.id,
        phoneNumber: selectedBookingForDelete.phoneNumber || phone,
        facilityName: selectedBookingForDelete.facilityName || selectedBookingForDelete.facilityId,
        sheetTabName: selectedBookingForDelete.sheetTabName,
        stage: selectedBookingForDelete.stage,
        date: selectedBookingForDelete.date,
        startTime: selectedBookingForDelete.startTime,
      }).catch(console.warn);

      setNotification({
        type: 'success',
        message: `Booking ${bookingId} has been permanently deleted from both the system and Google Sheets.`,
      });

      setSelectedBookingForDelete(null);
      setIsDeleting(false);
      setDataVersion((v) => v + 1);
      onBookingCancelled();
    } catch (err: any) {
      setIsDeleting(false);
      setNotification({ type: 'error', message: err.message || 'Error occurred during deletion.' });
    }
  };

  // Discharge isolation room occupant from search
  const handleDischargeIsolationOccupant = (roomId: string, bedNumber: 1 | 2, patientName: string) => {
    if (!AuthService.canManageIsolation()) {
      setNotification({ type: 'error', message: 'Access Denied: Your staff role is not authorized to manage clinic isolation wards.' });
      return;
    }

    StorageService.dischargeBedOccupant(roomId, bedNumber);
    setDataVersion((v) => v + 1);
    setNotification({
      type: 'success',
      message: `Checked out guest ${patientName} from Bed ${bedNumber}. Bed is now clean & vacant!`,
    });
  };

  // Purge a cancellation log record early
  const handlePurgeLog = (logId: string) => {
    StorageService.deleteCancellationLog(logId);
    setDataVersion((v) => v + 1);
    setNotification({
      type: 'success',
      message: 'Cancellation audit record was removed from the log.',
    });
  };

  // Re-verify & force release remote slot on Google Sheets
  const handleForceReleaseRemoteSlot = async (log: CancellationLogEntry) => {
    setNotification({ type: 'success', message: `Verifying & freeing slot on Google Sheets for ${log.bookingId}...` });
    try {
      const res = await GasService.releaseRemoteSlot({
        facilityName: log.facilityName,
        sheetTabName: log.sheetTabName,
        stage: log.stage,
        date: log.date,
        startTime: log.startTime,
        endTime: log.endTime,
        bookingId: log.bookingId,
      });
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Google Sheets slot confirmed FREE for ${log.date} (${log.startTime}-${log.endTime}).`,
        });
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to release slot on Google Sheet.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Remote sync failed.',
      });
    }
  };

  // Share full recurring schedule pass via WhatsApp
  const handleShareGroupWhatsApp = (group: typeof recurringScheduleGroups[0]) => {
    let msg = `*TAMIMI GLOBAL - MULTI-SLOT / RECURRING SCHEDULE PASS*\n`;
    msg += `-------------------------------------------\n`;
    msg += `Facility: *${group.facilityName}* (${group.stage})\n`;
    msg += `Customer: *${group.customerName}*\n`;
    msg += `Phone: *${group.phoneNumber}*\n`;
    msg += `Total Slots: *${group.totalCount} Sessions*\n`;
    msg += `Date Range: *${group.startDate} to ${group.endDate}*\n`;
    msg += `-------------------------------------------\n`;
    msg += `*SCHEDULED BOOKING SESSIONS:*\n`;

    group.bookings.forEach((b, idx) => {
      const statusMark = b.status === 'CONFIRMED' ? 'CONFIRMED' : 'CANCELLED';
      msg += `${idx + 1}. ${formatDisplayDate(b.date, { short: true })} | ${formatDisplayTime(b.startTime)}-${formatDisplayTime(b.endTime)} | ID: ${b.id} [${statusMark}]\n`;
    });

    msg += `-------------------------------------------\n`;
    msg += `Status: Verified & Registered with Camp Operations Management.`;

    setWhatsAppCustomMessage(msg);
    setWhatsAppRecipient({ name: group.customerName, phone: group.phoneNumber });
    setSelectedBookingForWhatsApp(group.bookings[0]);
  };

  const totalResultsCount =
    singleBookings.length +
    recurringScheduleGroups.length +
    isolationMatches.length +
    handoverMatches.length +
    parcelMatches.length +
    lostFoundMatches.length +
    invoiceMatches.length +
    ticketMatches.length +
    cancellationLogs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 dark:bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="bg-white dark:bg-slate-900 border-2 border-sky-200/90 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 p-5 sm:p-7 relative transition-colors"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-80" />

        {/* Top Action Buttons */}
        <div className="absolute right-4 top-4 flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-sky-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center space-x-1"
            title="Refresh from cloud & local storage"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span className="text-[11px] font-bold hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-28">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-800 dark:text-sky-300 rounded-lg text-[11px] font-black uppercase tracking-wider">
              <Search className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>Universal Search &amp; Management</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-black">
              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Live Synced</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
            Search Registry &amp; Multi-Slot Schedules
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Search by Booking ID, Group ID, Phone Number, Guest Name, or Room Number. 1-Month recurring bookings and multi-slot reservations are automatically linked.
          </p>
        </div>

        {/* Notification Toast */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border-2 shadow-xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-bold'
                : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-500/40 text-red-900 dark:text-red-300 font-bold'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Search Input and Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID (e.g. CRK- or Group ID), phone, guest name, or room..."
                className="w-full bg-slate-50/90 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 font-bold shadow-2xs transition-all"
              />
              <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 absolute left-3.5 top-3" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shrink-0">
              {(['ALL', 'CONFIRMED', 'CANCELLED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-black overflow-x-auto">
            <button
              onClick={() => setActiveCategoryTab('ALL')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeCategoryTab === 'ALL'
                  ? 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>All Results</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-200 dark:bg-sky-900 text-sky-950 dark:text-sky-200">
                {totalResultsCount}
              </span>
            </button>

            {recurringScheduleGroups.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('RECURRING')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'RECURRING'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Multi-Slot Schedules</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200">
                  {recurringScheduleGroups.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveCategoryTab('FACILITY')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeCategoryTab === 'FACILITY'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Single Facility Slots</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-950 dark:text-blue-200">
                {singleBookings.length}
              </span>
            </button>

            {isolationMatches.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('ISOLATION')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'ISOLATION'
                    ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bed className="w-3.5 h-3.5" />
                <span>Isolation Room Beds</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-200">
                  {isolationMatches.length}
                </span>
              </button>
            )}

            {handoverMatches.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('HANDOVER')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'HANDOVER'
                    ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Handovers ({handoverMatches.length})</span>
              </button>
            )}

            {parcelMatches.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('PARCEL')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'PARCEL'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Parcels ({parcelMatches.length})</span>
              </button>
            )}

            {lostFoundMatches.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('LOST_FOUND')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'LOST_FOUND'
                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Lost & Found ({lostFoundMatches.length})</span>
              </button>
            )}

            {invoiceMatches.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('INVOICES')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'INVOICES'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoices ({invoiceMatches.length})</span>
              </button>
            )}

            {ticketMatches.length > 0 && (
              <button
                onClick={() => setActiveCategoryTab('TICKETS')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeCategoryTab === 'TICKETS'
                    ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Tickets ({ticketMatches.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveCategoryTab('CANCELLATIONS')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeCategoryTab === 'CANCELLATIONS'
                  ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 ring-2 ring-rose-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Cancellation Logs ({cancellationLogs.length})</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200">
                14d
              </span>
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
          {totalResultsCount === 0 ? (
            <div className="text-center py-12 bg-slate-50/80 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
              <Search className="w-9 h-9 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">No matching records found</p>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Check the booking reference code or try searching by customer phone number, guest name, or room number.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: RECURRING & MULTI-SLOT SCHEDULE GROUPS */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'RECURRING') &&
                recurringScheduleGroups.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        <CalendarRange className="w-4 h-4 text-emerald-600" />
                        <span>Recurring &amp; Multi-Slot Schedules ({recurringScheduleGroups.length})</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        All dates &amp; slots aggregated in a single schedule view
                      </span>
                    </div>

                    {recurringScheduleGroups.map((group) => {
                      const isExpanded = expandedGroupIds.has(group.groupId);
                      const allCancelled = group.activeCount === 0;

                      return (
                        <div
                          key={`rec-grp-${group.groupId}`}
                          className={`bg-white dark:bg-slate-950/90 border-2 rounded-2xl p-4 transition-all space-y-3 shadow-xs ${
                            allCancelled
                              ? 'border-red-200 dark:border-red-950/60 bg-red-50/20 opacity-80'
                              : 'border-emerald-300/80 dark:border-emerald-500/40 hover:border-emerald-500'
                          }`}
                        >
                          {/* Top Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 dark:border-slate-800/80 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-black text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/90 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-500/40">
                                Schedule ID: {group.groupId}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600">
                                {group.totalCount} Total Booked Slots
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                {group.activeCount} Active
                              </span>
                              {group.cancelledCount > 0 && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300">
                                  {group.cancelledCount} Cancelled
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{group.facilityName}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-sky-600 dark:text-sky-400 font-black">{group.stage}</span>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Customer</span>
                              <span className="text-slate-950 dark:text-white font-black flex items-center space-x-1 mt-0.5 truncate">
                                <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span className="truncate">{group.customerName}</span>
                              </span>
                            </div>

                            <div className="bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Phone Number</span>
                              <span className="text-slate-950 dark:text-slate-200 font-black flex items-center space-x-1 mt-0.5 truncate">
                                <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span className="truncate">{group.phoneNumber}</span>
                              </span>
                            </div>

                            <div className="bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 col-span-2">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Schedule Timeline</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center space-x-1.5 mt-0.5">
                                <CalendarRange className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{group.startDate} to {group.endDate} ({group.totalCount} Sessions)</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Toolbar for Group */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleGroupExpanded(group.groupId)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span>{isExpanded ? 'Hide Slot List' : `View All ${group.totalCount} Booked Dates`}</span>
                              </button>

                              <button
                                onClick={() => {
                                  const summary = group.bookings
                                    .map((b) => `${b.date} | ${b.startTime}-${b.endTime} | ID: ${b.id}`)
                                    .join('\n');
                                  handleCopyText(summary, group.groupId);
                                }}
                                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-xl font-bold flex items-center space-x-1 border border-sky-200 dark:border-sky-800 cursor-pointer"
                                title="Copy all IDs and dates in this schedule"
                              >
                                {copiedId === group.groupId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-sky-600" />}
                                <span>{copiedId === group.groupId ? 'Copied Schedule' : 'Copy All IDs'}</span>
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleShareGroupWhatsApp(group)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center space-x-1.5 border border-emerald-300 dark:border-emerald-600 cursor-pointer"
                                title="Share complete schedule pass via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp Schedule</span>
                              </button>

                              {group.activeCount > 0 && (
                                <button
                                  onClick={() =>
                                    setSelectedGroupForCancel({
                                      groupId: group.groupId,
                                      summary: group.summary,
                                      count: group.activeCount,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-xl font-bold flex items-center space-x-1.5 border border-rose-300 dark:border-rose-600 cursor-pointer"
                                  title="Cancel all slots in this recurring schedule"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Cancel Entire Schedule</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Collapsible Slots Sub-List */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2"
                            >
                              <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                All {group.totalCount} Individual Sessions &amp; IDs:
                              </div>
                              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                                {group.bookings.map((slot, sIdx) => {
                                  const isSlotConfirmed = slot.status === 'CONFIRMED';
                                  return (
                                    <div
                                      key={`slot-item-${slot.id}-${sIdx}`}
                                      className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                                        isSlotConfirmed
                                          ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                          : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-slate-400'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                          #{sIdx + 1}. {formatDisplayDate(slot.date, { short: true })}
                                        </span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-black">
                                          {formatDisplayTime(slot.startTime)} – {formatDisplayTime(slot.endTime)}
                                        </span>
                                        <span className="font-mono text-[10px] text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                          {slot.id}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0">
                                        <span
                                          className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                            isSlotConfirmed
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                          }`}
                                        >
                                          {slot.status}
                                        </span>

                                        <button
                                          onClick={() => handleCopyText(slot.id, slot.id)}
                                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                          title="Copy Slot ID"
                                        >
                                          {copiedId === slot.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>

                                        {isSlotConfirmed && (
                                          <button
                                            onClick={() => setSelectedBookingForCancel(slot)}
                                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg text-[10px] font-bold border border-amber-300 dark:border-amber-600 cursor-pointer"
                                          >
                                            Cancel This Slot
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* SECTION 2: SINGLE FACILITY BOOKINGS */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'FACILITY') &&
                singleBookings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-sky-800 dark:text-sky-300">
                        <Building className="w-4 h-4 text-sky-600" />
                        <span>Facility Bookings ({singleBookings.length})</span>
                      </div>
                    </div>

                    {singleBookings.map((booking, idx) => {
                      const isConfirmed = booking.status === 'CONFIRMED';
                      const itemKey = booking.id ? `srch-${booking.id}-${idx}` : `srch-res-${idx}`;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={itemKey}
                          className={`bg-white dark:bg-slate-950/80 border-2 rounded-2xl p-4 transition-all space-y-3 shadow-xs ${
                            isConfirmed
                              ? 'border-slate-200/90 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500/40'
                              : 'border-red-200 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/15 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 dark:border-slate-800/80 pb-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono text-xs font-black text-sky-800 dark:text-cyan-400 bg-sky-50 dark:bg-slate-900 px-3 py-1 rounded-xl border-2 border-sky-200/80 dark:border-slate-800 shadow-2xs">
                                {booking.id}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                  isConfirmed
                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                                    : 'bg-red-50 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-500/40'
                                }`}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-slate-600 dark:text-slate-400 font-bold">{booking.facilityName}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-sky-600 dark:text-sky-400 font-black">{booking.stage}</span>
                            </div>
                          </div>

                          {/* Booking Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Customer</span>
                              <span className="text-slate-950 dark:text-white font-black flex items-center space-x-1 mt-0.5 truncate">
                                <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span className="truncate">{booking.customerName}</span>
                              </span>
                            </div>

                            <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Phone</span>
                              <span className="text-slate-950 dark:text-slate-200 font-black flex items-center space-x-1 mt-0.5 truncate">
                                <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span className="truncate">
                                  {AuthService.canViewPii()
                                    ? booking.phoneNumber
                                    : AuthService.maskPii(booking.phoneNumber, 'phone')}
                                </span>
                              </span>
                            </div>

                            <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Date &amp; Day</span>
                              <span className="text-slate-950 dark:text-slate-200 font-black flex items-center space-x-1 mt-0.5 truncate">
                                <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span className="truncate">{formatDisplayDate(booking.date, { short: true })}</span>
                              </span>
                            </div>

                            <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Time Slot</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center space-x-1 mt-0.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  {formatDisplayTime(booking.startTime)} – {formatDisplayTime(booking.endTime)}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Notes & Actions Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t-2 border-slate-100 dark:border-slate-800/60 text-xs">
                            <div className="text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {booking.bookedByStaff && (
                                <span className="text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-sky-200 dark:border-sky-500/30">
                                  Booked By: <strong>{booking.bookedByStaff}</strong>
                                </span>
                              )}
                              {booking.notes && (
                                <span className="italic text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                                  Notes: &quot;{booking.notes}&quot;
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setWhatsAppCustomMessage(null);
                                  setWhatsAppRecipient(null);
                                  setSelectedBookingForWhatsApp(booking);
                                }}
                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-black transition cursor-pointer"
                                title="Share Official Booking Pass via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>WhatsApp</span>
                              </button>

                              <button
                                onClick={() => setSelectedBookingForPrint(booking)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border-2 border-sky-200 dark:border-sky-500/40 rounded-xl text-xs font-black transition cursor-pointer"
                                title="Open & Print Official A4 Admission Form"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>A4 Form</span>
                              </button>

                              {isConfirmed ? (
                                <>
                                  {AuthService.canCancelBookings() && (
                                    <button
                                      onClick={() => {
                                        setSelectedBookingForDelete(null);
                                        setSelectedBookingForCancel(booking);
                                      }}
                                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-2 border-amber-200 dark:border-amber-500/40 rounded-xl text-xs font-black transition cursor-pointer"
                                      title="Cancel Booking and Release Time Slot"
                                    >
                                      <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      <span>Cancel</span>
                                    </button>
                                  )}

                                  {AuthService.canDeleteRecords() && (
                                    <button
                                      onClick={() => {
                                        setSelectedBookingForCancel(null);
                                        setSelectedBookingForDelete(booking);
                                      }}
                                      className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-500/40 rounded-xl text-xs font-black transition cursor-pointer"
                                      title="Permanently Delete Booking from System & Sheet"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                AuthService.canDeleteRecords() && (
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForCancel(null);
                                      setSelectedBookingForDelete(booking);
                                    }}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-500/40 rounded-xl text-xs font-black transition cursor-pointer"
                                    title="Permanently Delete Cancelled Record from System & Sheet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    <span>Delete</span>
                                  </button>
                                )
                              )}
                            </div>

                            {!isConfirmed && booking.cancelledAt && (
                              <span className="text-[11px] text-red-600 dark:text-red-400 italic font-bold">
                                Cancelled on {new Date(booking.cancelledAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

              {/* SECTION 3: ISOLATION ROOMS & GUESTS */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'ISOLATION') &&
                isolationMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-rose-800 dark:text-rose-300">
                        <Bed className="w-4 h-4 text-rose-600" />
                        <span>Isolation Rooms &amp; Guests ({isolationMatches.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {isolationMatches.map((match, mIdx) => (
                        <div
                          key={`iso-match-${match.room.id}-${mIdx}`}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-rose-200 dark:border-rose-900/60 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-black text-xs text-slate-900 dark:text-white">
                              Room {match.room.buildingNumber}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              {match.occupants.length}/2 Occupants
                            </span>
                          </div>

                          <div className="space-y-2">
                            {match.occupants.map((occ, oIdx) => (
                              <div
                                key={`occ-${occ.bedNumber}-${oIdx}`}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-900 dark:text-white">
                                    Bed {occ.bedNumber}: {occ.patientName}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    In: {occ.checkIn}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {occ.company || 'Resident'} · {occ.phoneNumber || 'No phone'}
                                </div>

                                <div className="pt-1 flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() =>
                                      handleDischargeIsolationOccupant(
                                        match.room.id,
                                        occ.bedNumber as 1 | 2,
                                        occ.patientName
                                      )
                                    }
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                  >
                                    <LogOut className="w-3 h-3" />
                                    <span>Check-Out Bed {occ.bedNumber}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 4: HANDOVER & TAKEN-OVER ITEMS */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'HANDOVER') &&
                handoverMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-cyan-800 dark:text-cyan-300">
                        <KeyRound className="w-4 h-4 text-cyan-600" />
                        <span>Handover &amp; Taken Over Items ({handoverMatches.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {handoverMatches.map((item, idx) => (
                        <div
                          key={`handover-${item.id}-${idx}`}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-cyan-200 dark:border-cyan-900/60 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-mono font-black text-xs text-cyan-900 dark:text-cyan-300">
                              {item.id}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                item.type === 'GIVEN_OUT'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                              }`}
                            >
                              {String(item.type || '').replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {item.itemName}
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Person: <span className="font-bold text-slate-700 dark:text-slate-300">{item.personName}</span> (Badge: {item.badgeOrIdNumber || 'N/A'})</div>
                            <div>Room: {item.roomNumber || 'N/A'} · Phone: {item.phoneNumber || 'N/A'}</div>
                            <div>Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">{String(item.status || '').replace(/_/g, ' ')}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 5: PARCEL MONITORING */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'PARCEL') &&
                parcelMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-amber-800 dark:text-amber-300">
                        <Package className="w-4 h-4 text-amber-600" />
                        <span>Incoming &amp; Logged Parcels ({parcelMatches.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {parcelMatches.map((parcel, idx) => (
                        <div
                          key={`parcel-${parcel.id}-${idx}`}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-mono font-black text-xs text-amber-900 dark:text-amber-300">
                              {parcel.trackingNumber || parcel.id}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                parcel.status === 'DELIVERED_TO_ROOM' || parcel.status === 'HANDED_TO_GUEST'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {String(parcel.status || '').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            Recipient: {parcel.recipientName}
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Room: {parcel.roomNumber || 'N/A'} · Courier: {parcel.courierCompany || 'Standard'}</div>
                            <div>Mobile: {parcel.phoneNumber || 'N/A'}</div>
                            {parcel.receivedDate && <div>Received: {parcel.receivedDate}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 6: LOST & FOUND INVENTORY */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'LOST_FOUND') &&
                lostFoundMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-purple-800 dark:text-purple-300">
                        <Archive className="w-4 h-4 text-purple-600" />
                        <span>Lost &amp; Found Registry ({lostFoundMatches.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lostFoundMatches.map((item, idx) => (
                        <div
                          key={`lost-${item.id}-${idx}`}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-purple-200 dark:border-purple-900/60 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-mono font-black text-xs text-purple-900 dark:text-purple-300">
                              {item.id}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                item.status === 'RETURNED_TO_OWNER'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {String(item.status || '').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {item.itemName}
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Location: {item.locationFoundOrLost || 'Camp Area'}</div>
                            <div>Found By: {item.finderOrReporterName || 'Security'}</div>
                            {item.ownerName && <div>Claimed By: <span className="font-bold text-emerald-600">{item.ownerName}</span></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 7: CAMP INVOICES & BILLING */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'INVOICES') &&
                invoiceMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        <span>Camp Invoices &amp; Billing ({invoiceMatches.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {invoiceMatches.map((inv: any, idx) => (
                        <div
                          key={`inv-${inv.id || inv.invoiceNumber}-${idx}`}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-mono font-black text-xs text-emerald-900 dark:text-emerald-300">
                              {inv.invoiceNumber || inv.id}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {inv.status || 'ISSUED'}
                            </span>
                          </div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            Client: {inv.guestOrClientName || 'Resident'}
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Company: {inv.companyName || 'N/A'} · Room: {inv.roomNumber || 'N/A'}</div>
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              Total Amount: SAR {Number(inv.totalAmount || inv.amount || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 8: SUPPORT & MAINTENANCE TICKETS */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'TICKETS') &&
                ticketMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black text-teal-800 dark:text-teal-300">
                        <LifeBuoy className="w-4 h-4 text-teal-600" />
                        <span>Support &amp; Maintenance Tickets ({ticketMatches.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ticketMatches.map((ticket: any, idx) => (
                        <div
                          key={`smm-ticket-${ticket.id || ticket.ticketId || ticket.ticketNumber || 'tkt'}-${idx}`}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border-2 border-teal-200 dark:border-teal-900/60 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="font-mono font-black text-xs text-teal-900 dark:text-teal-300">
                              {ticket.ticketId || ticket.id}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {ticket.priority || 'NORMAL'}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                }`}
                              >
                                {ticket.status || 'OPEN'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {ticket.title || ticket.subject || 'Maintenance Request'}
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Requester: {ticket.requesterName || 'Resident'} · Dept: {ticket.department || 'Camp'}</div>
                            <div>Room: {ticket.roomNumber || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 9: CANCELLATION LOGS (14-DAY AUDIT RETENTION) */}
              {(activeCategoryTab === 'ALL' || activeCategoryTab === 'CANCELLATIONS') &&
                cancellationLogs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-rose-200 dark:border-rose-900/60 pb-2">
                      <div className="flex items-center space-x-2 text-xs font-black text-rose-800 dark:text-rose-300">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Cancellation Logs &amp; Audit Trail ({cancellationLogs.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Deleted from Google Sheet &bull; Kept for 14 days before auto-purge
                      </span>
                    </div>

                    <div className="space-y-3">
                      {cancellationLogs.map((log) => {
                        const cancelDate = new Date(log.cancelledAt || Date.now());
                        const daysAgo = Math.floor((Date.now() - cancelDate.getTime()) / (1000 * 60 * 60 * 24));
                        const daysRemaining = Math.max(0, 14 - daysAgo);

                        return (
                          <div
                            key={`clog-${log.id}`}
                            className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3 transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 dark:border-rose-900/60 pb-2.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-xs text-rose-950 dark:text-rose-200 bg-rose-200/80 dark:bg-rose-900/80 px-2 py-0.5 rounded-md">
                                  {log.bookingId}
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white flex items-center space-x-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>CANCELLED &amp; REMOVED FROM SHEET</span>
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                                  Purges in {daysRemaining} days
                                </span>
                                <button
                                  onClick={() => handlePurgeLog(log.id)}
                                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 hover:underline cursor-pointer"
                                  title="Delete this log entry immediately"
                                >
                                  Purge Now
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              {/* Facility & Stage */}
                              <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Facility / Resource
                                </div>
                                <div className="font-black text-slate-900 dark:text-white">
                                  {log.facilityName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-bold">
                                  Stage: {log.stage || 'N/A'}
                                </div>
                              </div>

                              {/* Slot Schedule */}
                              <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Scheduled Time (Now Released)
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-sky-500" />
                                  <span>{formatDisplayDate(log.date)}</span>
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-bold flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-emerald-500" />
                                  <span>{formatDisplayTime(log.startTime)} - {formatDisplayTime(log.endTime)}</span>
                                </div>
                              </div>

                              {/* Guest & Cancellation Details */}
                              <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Guest &amp; Cancellation Reason
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{log.customerName}</span>
                                  {log.phoneNumber && (
                                    <span className="text-[10px] font-normal text-slate-400">
                                      ({log.phoneNumber})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                                  Reason: {log.cancellationReason || 'No reason provided'}
                                </div>
                              </div>
                            </div>

                            {/* Bottom row metadata & re-verification action */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                              <div>
                                Cancelled on{' '}
                                <strong className="text-slate-700 dark:text-slate-300">
                                  {cancelDate.toLocaleDateString()} {cancelDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </strong>{' '}
                                by <strong className="text-slate-700 dark:text-slate-300">{log.cancelledBy}</strong>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleForceReleaseRemoteSlot(log)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200 font-bold cursor-pointer border border-emerald-300 dark:border-emerald-800 transition flex items-center space-x-1"
                                  title="Ensure Google Sheets has removed this slot so others can book"
                                >
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Force Verify Remote Slot Free</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Cancellation Sub-Dialog for Single Booking */}
        {selectedBookingForCancel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0 border border-amber-300 dark:border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Confirm Cancellation of {selectedBookingForCancel.id}?
                </h4>
                <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                  This will immediately release the time slot (
                  <strong>
                    {formatDisplayTime(selectedBookingForCancel.startTime)} – {formatDisplayTime(selectedBookingForCancel.endTime)}
                  </strong>{' '}
                  on {selectedBookingForCancel.date}) back to{' '}
                  <span className="font-black text-emerald-700 dark:text-emerald-400">AVAILABLE</span> for other reservations.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, meeting rescheduled..."
                className="w-full bg-white dark:bg-slate-950 border-2 border-amber-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold shadow-2xs"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-black border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleExecuteCancel}
                disabled={isCancelling}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isCancelling ? 'Releasing Slot in Google Sheet...' : 'Confirm Release Slot'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Cancellation Sub-Dialog for Entire Recurring Schedule Group */}
        {selectedGroupForCancel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-slate-900 border-2 border-rose-300 dark:border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 shrink-0 border border-rose-300 dark:border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Cancel Entire Schedule: {selectedGroupForCancel.groupId}?
                </h4>
                <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                  This will cancel all <strong>{selectedGroupForCancel.count} active sessions</strong> across the entire booking schedule and release all time slots back to AVAILABLE in both local system and Google Sheets.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-slate-200 mb-1.5">
                Cancellation Reason
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Project finished, full month schedule cancelled..."
                className="w-full bg-white dark:bg-slate-950 border-2 border-rose-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 font-bold shadow-2xs"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setSelectedGroupForCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-black border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleExecuteCancelGroup}
                disabled={isCancelling}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isCancelling ? 'Releasing All Slots...' : `Confirm Release All ${selectedGroupForCancel.count} Slots`}
              </button>
            </div>
          </motion.div>
        )}

        {/* Permanent Deletion Confirmation Sub-Dialog */}
        {selectedBookingForDelete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-slate-900 border-2 border-red-300 dark:border-red-500/40 rounded-3xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-red-500/20 rounded-2xl text-red-600 dark:text-red-400 shrink-0 border border-red-300 dark:border-red-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                  Permanently Delete Booking {selectedBookingForDelete.id}?
                </h4>
                <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                  This will completely remove booking <strong>{selectedBookingForDelete.id}</strong> ({selectedBookingForDelete.customerName} - {selectedBookingForDelete.facilityName}) from the local system and permanently delete the corresponding row from Google Sheets.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setSelectedBookingForDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-black border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting from Google Sheet...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Embedded A4 Admission & Signature Form Modal */}
      {selectedBookingForPrint && (
        <BookingAdmissionPrintModal
          isOpen={!!selectedBookingForPrint}
          onClose={() => setSelectedBookingForPrint(null)}
          booking={selectedBookingForPrint}
        />
      )}

      {/* WhatsApp Booking Pass Share Modal */}
      {selectedBookingForWhatsApp && (
        <WhatsAppShareModal
          isOpen={!!selectedBookingForWhatsApp}
          onClose={() => {
            setSelectedBookingForWhatsApp(null);
            setWhatsAppCustomMessage(null);
            setWhatsAppRecipient(null);
          }}
          title={
            whatsAppCustomMessage
              ? `Schedule Pass - WhatsApp`
              : `Booking ${selectedBookingForWhatsApp.id} - WhatsApp Pass`
          }
          recipientName={whatsAppRecipient?.name || selectedBookingForWhatsApp.customerName}
          defaultPhone={whatsAppRecipient?.phone || selectedBookingForWhatsApp.phoneNumber}
          messageText={
            whatsAppCustomMessage || WhatsAppService.generateBookingMessage(selectedBookingForWhatsApp)
          }
          moduleLabel={selectedBookingForWhatsApp.facilityName}
        />
      )}
    </div>
  );
};

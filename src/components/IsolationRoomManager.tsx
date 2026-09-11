import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  BedDouble,
  UserCheck,
  UserX,
  Search,
  Download,
  Calendar,
  Phone,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  X,
  User,
  Users,
  KeyRound,
  Layers,
  LayoutGrid,
  List,
  Mail,
  CreditCard,
  Tag,
  Wrench,
  Stethoscope,
  Eye,
  Check,
  Bed,
  MapPin,
  Clock,
  ArrowUpRight,
  UserPlus,
  LogOut,
  Edit3,
  Sparkles,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Filter,
  RotateCcw,
  HeartPulse,
  ShieldAlert,
  ArrowRight,
  Lock,
  Zap,
  Printer,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IsolationRoomRecord, BedOccupant, Booking } from '../types';
import { StorageService, getTodayDateString } from '../services/storageService';
import { AuthService } from '../services/authService';
import { GasService } from '../services/gasService';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { IsolationRoomSlotSticker } from './FacilitySlotStickers';
import { RoomAdmissionPrintModal, RoomAdmissionFormData } from './RoomAdmissionPrintModal';
import { RoomBedMatrixVisualizer } from './RoomBedMatrixVisualizer';
import { MedicalVitalsModal } from './isolation/MedicalVitalsModal';
import { MedicalClearanceCertModal } from './isolation/MedicalClearanceCertModal';
import confetti from 'canvas-confetti';
import {
  getCheckoutStatus,
  getRoomCheckoutSummary,
  CheckoutStatusInfo,
  RoomCheckoutSummary,
} from '../utils/checkoutUtils';

interface IsolationRoomManagerProps {
  onRefresh?: () => void;
}

export const IsolationRoomManager: React.FC<IsolationRoomManagerProps> = ({ onRefresh }) => {
  const [rooms, setRooms] = useState<IsolationRoomRecord[]>(() => StorageService.getIsolationRooms());
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<'ALL' | 'R' | 'B'>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'Occupied' | 'Partially Occupied' | 'VACANT' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON'
  >('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'General Guest' | 'Medical Isolation'>('ALL');
  const [viewLayout, setViewLayout] = useState<'compact-grid' | 'detailed-list' | 'bed-matrix'>('compact-grid');

  // Unified Room Hub Modal State
  const [isRoomHubOpen, setIsRoomHubOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<IsolationRoomRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'checkin' | 'details' | 'transfer' | 'checkout' | 'maintenance'>('checkin');
  const [activeBedSelect, setActiveBedSelect] = useState<1 | 2 | 'BOTH'>(1);

  // Group Multi-Booking Modal
  const [isGroupBookOpen, setIsGroupBookOpen] = useState(false);
  const [groupBuilding, setGroupBuilding] = useState<'R' | 'B'>('R');
  const [groupRoomsCount, setGroupRoomsCount] = useState<number>(2);

  // A4 Printable Signature Form State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalData, setPrintModalData] = useState<RoomAdmissionFormData | null>(null);

  // Clinical Vitals and Fit-To-Work Clearance Certificate
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsTargetRoom, setVitalsTargetRoom] = useState<IsolationRoomRecord | null>(null);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [clearanceTargetRoom, setClearanceTargetRoom] = useState<IsolationRoomRecord | null>(null);

  // WhatsApp Share Modal State
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    phone: string;
    name: string;
    message: string;
    title: string;
  } | null>(null);

  // Form State for Check-In / Guest Details
  const [formData, setFormData] = useState({
    patientName: '',
    company: '',
    checkIn: getTodayDateString(),
    checkOut: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    bookingType: 'Medical Isolation' as 'General Guest' | 'Medical Isolation',
    purposeOfStay: '',
    hospitalReferral: '',
    roomCondition: 'Cleaned & Ready' as 'Cleaned & Ready' | 'Under Maintenance' | 'Deep Sanitization Required',
    keyIssued: true,
    staffNotes: '',
    bookedByStaff: 'Helpdesk Admin',
    // 2nd guest fields when booking both beds
    bed2GuestName: '',
    bed2Company: '',
    bed2Phone: '',
    bed2Email: '',
    bed2NationalId: '',
  });

  // Transfer Form State
  const [transferTargetRoomId, setTransferTargetRoomId] = useState<string>('');
  const [transferTargetBed, setTransferTargetBed] = useState<1 | 2>(1);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);

  // Sync state from StorageService
  const reloadRooms = () => {
    const fresh = StorageService.getIsolationRooms();
    setRooms(fresh);
    if (selectedRoom) {
      const updatedSelected = fresh.find((r) => r.id === selectedRoom.id);
      if (updatedSelected) setSelectedRoom(updatedSelected);
    }
    if (onRefresh) onRefresh();
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSyncToGoogleSheet = async (manual = false) => {
    setIsSyncingToSheet(true);
    try {
      // First ensure the sheet tab "Isolation & Room Booking" is initialized
      await GasService.triggerSetupSheets().catch(() => {});
      // Push all currently occupied beds to the Google Sheet
      const res = await GasService.syncAllIsolationRoomsToSheet();
      // Pull authoritative remote data
      await GasService.syncWithRemote().catch(() => {});
      reloadRooms();

      if (res.success) {
        if (manual) {
          showNotification(
            `Google Sheets Synced: ${res.pushedCount} isolation bed occupant(s) updated in "Isolation & Room Booking" tab!`,
            'success'
          );
        }
      } else {
        if (manual) {
          showNotification(`Sync note: ${res.error || 'Check Google Sheet connection.'}`, 'info');
        }
      }
    } catch (e: any) {
      if (manual) {
        showNotification(`Sync error: ${e.message || e}`, 'error');
      }
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  useEffect(() => {
    const handleUpdate = () => reloadRooms();
    window.addEventListener('tamimi_bookings_updated', handleUpdate);
    window.addEventListener('tamimi_isolation_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Initial background pull on mount to ensure fresh remote data is fetched
    GasService.syncWithRemote().then((res) => {
      if (res.success) {
        reloadRooms();
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('tamimi_bookings_updated', handleUpdate);
      window.removeEventListener('tamimi_isolation_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Metrics Calculations (12 rooms * 2 beds = 24 twin beds)
  const totalRooms = rooms.length;
  const totalBeds = rooms.length * 2;
  let occupiedBeds = 0;
  let generalGuestBeds = 0;
  let medicalIsolationBeds = 0;
  let overdueGuestsCount = 0;
  let dueTodayGuestsCount = 0;
  let dueSoonGuestsCount = 0;

  rooms.forEach((r) => {
    const occs = r.occupants || [];
    occs.forEach((o) => {
      if (o.patientName && o.patientName.trim() !== '') {
        occupiedBeds++;
        if (o.bookingType === 'Medical Isolation') {
          medicalIsolationBeds++;
        } else {
          generalGuestBeds++;
        }

        if (o.checkOut) {
          const st = getCheckoutStatus(o.checkOut);
          if (st) {
            if (st.status === 'OVERDUE') overdueGuestsCount++;
            else if (st.status === 'DUE_TODAY') dueTodayGuestsCount++;
            else if (st.status === 'DUE_SOON') dueSoonGuestsCount++;
          }
        }
      }
    });
  });
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const fullyOccupiedRooms = rooms.filter((r) => (r.occupants || []).length >= 2).length;
  const partiallyOccupiedRooms = rooms.filter((r) => (r.occupants || []).length === 1).length;
  const fullyVacantRooms = rooms.filter((r) => (r.occupants || []).length === 0).length;
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const totalCheckoutAlerts = overdueGuestsCount + dueTodayGuestsCount;

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (buildingFilter !== 'ALL') {
      const matchBuilding =
        r.buildingNumber.toUpperCase().includes(`BUILDING ${buildingFilter}`) ||
        r.buildingNumber.toUpperCase().startsWith(buildingFilter);
      if (!matchBuilding) return false;
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'Occupied' && (r.occupants || []).length < 2) return false;
      if (statusFilter === 'Partially Occupied' && (r.occupants || []).length !== 1) return false;
      if (statusFilter === 'VACANT' && (r.occupants || []).length > 0) return false;
      
      if (statusFilter === 'OVERDUE') {
        const summary = getRoomCheckoutSummary(r);
        if (!summary.isOverdue) return false;
      }
      if (statusFilter === 'DUE_TODAY') {
        const summary = getRoomCheckoutSummary(r);
        if (!summary.isDueToday) return false;
      }
      if (statusFilter === 'DUE_SOON') {
        const summary = getRoomCheckoutSummary(r);
        if (!summary.isDueSoon) return false;
      }
    }

    if (typeFilter !== 'ALL') {
      const hasType = (r.occupants || []).some(
        (o) => (o.bookingType || 'General Guest') === typeFilter && o.patientName && o.patientName.trim() !== ''
      );
      if (!hasType) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchBuilding = r.buildingNumber.toLowerCase().includes(q);
      const matchOccupants = (r.occupants || []).some((o) => {
        return (
          (o.patientName || '').toLowerCase().includes(q) ||
          (o.company || '').toLowerCase().includes(q) ||
          (o.phoneNumber || '').toLowerCase().includes(q) ||
          (o.email || '').toLowerCase().includes(q) ||
          (o.nationalId || '').toLowerCase().includes(q) ||
          (o.bookingType || '').toLowerCase().includes(q)
        );
      });
      return matchBuilding || matchOccupants;
    }

    return true;
  });

  // Open Unified Room Hub
  const openRoomHub = (
    room: IsolationRoomRecord,
    initialTab: 'checkin' | 'details' | 'transfer' | 'checkout' | 'maintenance' = 'checkin',
    initialBed: 1 | 2 | 'BOTH' = 1
  ) => {
    setSelectedRoom(room);
    setActiveBedSelect(initialBed);
    setActiveTab(initialTab);

    const occs = room.occupants || [];
    const occ1 = occs.find((o) => o.bedNumber === 1);
    const occ2 = occs.find((o) => o.bedNumber === 2);
    const primaryOcc = (initialBed === 2 ? occ2 : occ1) || occ1 || occ2;

    setFormData({
      patientName: primaryOcc ? primaryOcc.patientName : '',
      company: primaryOcc ? primaryOcc.company || '' : '',
      checkIn: primaryOcc ? primaryOcc.checkIn : getTodayDateString(),
      checkOut: primaryOcc ? primaryOcc.checkOut || '' : '',
      phoneNumber: primaryOcc ? primaryOcc.phoneNumber || '' : '',
      email: primaryOcc ? primaryOcc.email || '' : '',
      nationalId: primaryOcc ? primaryOcc.nationalId || '' : '',
      bookingType: primaryOcc ? primaryOcc.bookingType || 'Medical Isolation' : 'Medical Isolation',
      purposeOfStay: primaryOcc ? primaryOcc.purposeOfStay || '' : '',
      hospitalReferral: primaryOcc ? primaryOcc.hospitalReferral || '' : '',
      roomCondition: room.roomCondition || 'Cleaned & Ready',
      keyIssued: primaryOcc ? primaryOcc.keyIssued ?? true : true,
      staffNotes: room.staffNotes || (primaryOcc ? primaryOcc.staffNotes || '' : ''),
      bookedByStaff: primaryOcc ? primaryOcc.bookedByStaff || 'Helpdesk Admin' : 'Helpdesk Admin',
      bed2GuestName: occ2 ? occ2.patientName : '',
      bed2Company: occ2 ? occ2.company || '' : '',
      bed2Phone: occ2 ? occ2.phoneNumber || '' : '',
      bed2Email: occ2 ? occ2.email || '' : '',
      bed2NationalId: occ2 ? occ2.nationalId || '' : '',
    });

    // Preset available transfer targets
    const otherRooms = rooms.filter((r) => r.id !== room.id);
    if (otherRooms.length > 0) {
      setTransferTargetRoomId(otherRooms[0].id);
      setTransferTargetBed(1);
    }

    setIsRoomHubOpen(true);
  };

  // Switch bed inside Room Hub
  const handleBedSelectChange = (bedNum: 1 | 2 | 'BOTH') => {
    setActiveBedSelect(bedNum);
    if (!selectedRoom) return;

    const occs = selectedRoom.occupants || [];
    if (bedNum === 'BOTH') {
      const occ1 = occs.find((o) => o.bedNumber === 1);
      const occ2 = occs.find((o) => o.bedNumber === 2);
      setFormData((prev) => ({
        ...prev,
        patientName: occ1 ? occ1.patientName : '',
        company: occ1 ? occ1.company || '' : '',
        phoneNumber: occ1 ? occ1.phoneNumber || '' : '',
        email: occ1 ? occ1.email || '' : '',
        nationalId: occ1 ? occ1.nationalId || '' : '',
        bed2GuestName: occ2 ? occ2.patientName : '',
        bed2Company: occ2 ? occ2.company || '' : '',
        bed2Phone: occ2 ? occ2.phoneNumber || '' : '',
        bed2Email: occ2 ? occ2.email || '' : '',
        bed2NationalId: occ2 ? occ2.nationalId || '' : '',
      }));
    } else {
      const occ = occs.find((o) => o.bedNumber === bedNum);
      setFormData((prev) => ({
        ...prev,
        patientName: occ ? occ.patientName : '',
        company: occ ? occ.company || '' : '',
        phoneNumber: occ ? occ.phoneNumber || '' : '',
        email: occ ? occ.email || '' : '',
        nationalId: occ ? occ.nationalId || '' : '',
        checkIn: occ ? occ.checkIn : getTodayDateString(),
        checkOut: occ ? occ.checkOut || '' : '',
        purposeOfStay: occ ? occ.purposeOfStay || '' : '',
        hospitalReferral: occ ? occ.hospitalReferral || '' : '',
        bookingType: occ ? occ.bookingType || 'Medical Isolation' : 'Medical Isolation',
      }));
    }
  };

  // Open A4 Printable Admission Form Modal
  const handleOpenAdmissionPrintForm = (
    room: IsolationRoomRecord,
    bedNum?: 1 | 2 | 'BOTH',
    explicitOccupant?: BedOccupant
  ) => {
    const occ1 = (room.occupants || []).find((o) => o.bedNumber === 1);
    const occ2 = (room.occupants || []).find((o) => o.bedNumber === 2);
    const activeOcc = explicitOccupant || (bedNum === 2 ? occ2 : occ1) || occ1 || occ2;

    const primaryName = activeOcc ? activeOcc.patientName : room.patientName || 'Resident Guest';
    const primaryCompany = activeOcc ? (activeOcc.company || room.company) : room.company;
    const primaryType = ((activeOcc?.bookingType || room.bookingType || 'General Guest') === 'Medical Isolation'
      ? 'Medical Isolation'
      : 'General Guest') as 'General Guest' | 'Medical Isolation';

    let bedText = 'Twin Bed 1';
    if (bedNum === 'BOTH' || (!explicitOccupant && occ1 && occ2)) {
      bedText = '2 Beds (Whole Room)';
    } else if (bedNum === 2 || (explicitOccupant && explicitOccupant.bedNumber === 2)) {
      bedText = 'Twin Bed 2';
    }

    setPrintModalData({
      roomCode: room.buildingNumber,
      buildingName: room.building,
      bedNumberText: bedText,
      bookingType: primaryType,
      patientName: primaryName,
      company: primaryCompany || 'Tamimi Resident',
      phoneNumber: activeOcc?.phoneNumber || room.phoneNumber,
      nationalId: activeOcc?.nationalId || room.nationalId,
      email: activeOcc?.email || room.email,
      checkIn: activeOcc?.checkIn || room.checkIn || getTodayDateString(),
      checkOut: activeOcc?.checkOut || room.checkOut,
      purposeOfStay: activeOcc?.purposeOfStay || room.purposeOfStay,
      hospitalReferral: activeOcc?.hospitalReferral || room.hospitalReferral,
      keyIssued: activeOcc?.keyIssued ?? room.keyIssued ?? true,
      roomCondition: room.roomCondition,
      staffNotes: activeOcc?.staffNotes || room.staffNotes,
      bookedByStaff: activeOcc?.bookedByStaff || room.bookedByStaff || 'Helpdesk Admin',
      secondaryOccupant:
        (bedText === '2 Beds (Whole Room)' || bedNum === 'BOTH') && occ2
          ? {
              patientName: occ2.patientName,
              company: occ2.company,
              phoneNumber: occ2.phoneNumber,
              nationalId: occ2.nationalId,
            }
          : undefined,
    });
    setIsPrintModalOpen(true);
  };

  // WhatsApp Share Dispatch Handler
  const handleOpenWhatsAppShare = (
    room: IsolationRoomRecord,
    bedNum: 1 | 2 = 1,
    explicitOccupant?: BedOccupant
  ) => {
    const occ1 = (room.occupants || []).find((o) => o.bedNumber === 1);
    const occ2 = (room.occupants || []).find((o) => o.bedNumber === 2);
    const occ = explicitOccupant || (bedNum === 2 ? occ2 : occ1) || occ1 || occ2;
    const phone = occ?.phoneNumber || room.phoneNumber || '';
    const name = occ?.patientName || room.patientName || 'Resident Guest';
    const msg = WhatsAppService.generateRoomAdmissionMessage(room, bedNum, occ);
    setWhatsAppModalData({
      phone,
      name,
      message: msg,
      title: `Room ${room.buildingNumber} - Bed ${bedNum} Admission Pass`,
    });
  };

  const handleDirectWhatsAppOpen = (
    room: IsolationRoomRecord,
    bedNum: 1 | 2 = 1,
    explicitOccupant?: BedOccupant
  ) => {
    const occ1 = (room.occupants || []).find((o) => o.bedNumber === 1);
    const occ2 = (room.occupants || []).find((o) => o.bedNumber === 2);
    const occ = explicitOccupant || (bedNum === 2 ? occ2 : occ1) || occ1 || occ2;
    const phone = occ?.phoneNumber || room.phoneNumber || '';
    const msg = WhatsAppService.generateRoomAdmissionMessage(room, bedNum, occ);
    WhatsAppService.open(phone, msg);
  };

  // Helper to push isolation room admissions directly into the Google Sheets "Isolation & Room Booking" tab
  const pushGuestToSheet = async (
    roomCode: string,
    bedNumber: 1 | 2,
    guest: {
      patientName: string;
      company?: string;
      phoneNumber?: string;
      email?: string;
      nationalId?: string;
      checkIn: string;
      checkOut?: string;
      bookingType?: string;
      purposeOfStay?: string;
      hospitalReferral?: string;
      staffNotes?: string;
      bookedByStaff?: string;
    }
  ) => {
    if (!guest.patientName) return;
    const cleanRoom = roomCode.replace(/[^a-zA-Z0-9]/g, '');
    const bookingId = `ISO-${cleanRoom}-B${bedNumber}-${Date.now().toString().slice(-4)}`;
    const newBooking: Booking = {
      id: bookingId,
      facilityId: 'isolation-room',
      facilityName: 'Isolation Tracker',
      sheetTabName: 'Isolation & Room Booking',
      customerName: guest.patientName,
      phoneNumber: guest.phoneNumber || '',
      email: guest.email || '',
      departmentOrTeam: guest.company || 'General Resident',
      date: guest.checkIn || getTodayDateString(),
      stage: `Room ${roomCode} (Bed ${bedNumber})`,
      startTime: '00:00',
      endTime: '23:59',
      durationMinutes: 1440,
      slotIds: [`ISO-${roomCode}-B${bedNumber}`],
      numberOfGuests: 1,
      notes: `Check-out: ${guest.checkOut || 'Open'} | Type: ${guest.bookingType || 'General Guest'}${guest.nationalId ? ` | ID: ${guest.nationalId}` : ''}${guest.purposeOfStay ? ` | Purpose: ${guest.purposeOfStay}` : ''}${guest.hospitalReferral ? ` | Hospital: ${guest.hospitalReferral}` : ''}${guest.staffNotes ? ` | Notes: ${guest.staffNotes}` : ''}`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      bookedByStaff: guest.bookedByStaff || 'Helpdesk Admin',
    };

    try {
      StorageService.createBooking(newBooking);
      GasService.pushBookingToRemote(newBooking).catch(console.warn);
    } catch (e) {
      console.warn('Background sync isolation booking error:', e);
    }
  };

  const pushCheckoutToSheet = async (roomCode: string, bedNumber?: 1 | 2) => {
    try {
      const allBookings = StorageService.getAllBookings();
      const cleanCode = roomCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matching = allBookings.filter((b) => {
        if (b.facilityId !== 'isolation-room') return false;
        if (b.status === 'CANCELLED') return false;
        const bStage = (b.stage || '').toLowerCase();
        const bSlot = (b.slotIds || []).join(' ').toLowerCase();
        const bId = (b.id || '').toLowerCase();
        const codeMatches = bStage.includes(roomCode.toLowerCase()) || bSlot.includes(cleanCode) || bId.includes(cleanCode);
        if (!codeMatches) return false;
        if (bedNumber) {
          const bedMatches = bStage.includes(`bed ${bedNumber}`) || bSlot.includes(`b${bedNumber}`) || bId.includes(`-b${bedNumber}`);
          return bedMatches;
        }
        return true;
      });

      for (const b of matching) {
        StorageService.cancelBooking(b.id, 'Checked out / Released');
        GasService.pushCancelToRemote(b.id, b.phoneNumber, 'Checked out / Released').catch(console.warn);
      }
    } catch (e) {
      console.warn('Background sync checkout error:', e);
    }
  };

  // Submit Check-in or Update
  const handleSaveOccupancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!formData.patientName.trim()) {
      showNotification('Please enter the guest / occupant name.', 'error');
      return;
    }

    if (activeBedSelect === 'BOTH') {
      StorageService.admitIsolationPatient(selectedRoom.id, {
        patientName: formData.patientName,
        company: formData.company || 'General Resident',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        nationalId: formData.nationalId,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay,
        hospitalReferral: formData.hospitalReferral,
        roomCondition: formData.roomCondition,
        keyIssued: formData.keyIssued,
        staffNotes: formData.staffNotes,
        bookedByStaff: formData.bookedByStaff || 'Helpdesk Admin',
        targetBed: 'BOTH',
        bed2Guest: {
          patientName: formData.bed2GuestName.trim() || `${formData.patientName} (2nd Guest)`,
          company: formData.bed2Company || formData.company,
          phoneNumber: formData.bed2Phone,
          email: formData.bed2Email,
          nationalId: formData.bed2NationalId,
        },
      });

      // Sync Bed 1 & Bed 2 to Google Sheets
      pushGuestToSheet(selectedRoom.buildingNumber, 1, {
        patientName: formData.patientName,
        company: formData.company,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        nationalId: formData.nationalId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay,
        hospitalReferral: formData.hospitalReferral,
        staffNotes: formData.staffNotes,
        bookedByStaff: formData.bookedByStaff,
      });

      pushGuestToSheet(selectedRoom.buildingNumber, 2, {
        patientName: formData.bed2GuestName.trim() || `${formData.patientName} (2nd Guest)`,
        company: formData.bed2Company || formData.company,
        phoneNumber: formData.bed2Phone,
        email: formData.bed2Email,
        nationalId: formData.bed2NationalId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay,
        hospitalReferral: formData.hospitalReferral,
        staffNotes: formData.staffNotes,
        bookedByStaff: formData.bookedByStaff,
      });

      showNotification(`Room ${selectedRoom.buildingNumber} booked for 2 Guests (Bed 1 & Bed 2)!`, 'success');
    } else {
      StorageService.admitBedOccupant(selectedRoom.id, activeBedSelect, {
        patientName: formData.patientName,
        company: formData.company || 'General Resident',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        nationalId: formData.nationalId,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay,
        hospitalReferral: formData.hospitalReferral,
        keyIssued: formData.keyIssued,
        staffNotes: formData.staffNotes,
        bookedByStaff: formData.bookedByStaff || 'Helpdesk Admin',
      });

      // Sync specific bed to Google Sheets
      pushGuestToSheet(selectedRoom.buildingNumber, activeBedSelect, {
        patientName: formData.patientName,
        company: formData.company,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        nationalId: formData.nationalId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay,
        hospitalReferral: formData.hospitalReferral,
        staffNotes: formData.staffNotes,
        bookedByStaff: formData.bookedByStaff,
      });

      showNotification(`Bed ${activeBedSelect} in ${selectedRoom.buildingNumber} registered for ${formData.patientName}!`, 'success');
    }

    // Auto trigger A4 Admission & Signature Form preview directly upon booking completion
    setPrintModalData({
      roomCode: selectedRoom.buildingNumber,
      buildingName: selectedRoom.building,
      bedNumberText: activeBedSelect === 'BOTH' ? '2 Beds (Whole Room)' : `Twin Bed ${activeBedSelect}`,
      bookingType: formData.bookingType,
      patientName: formData.patientName,
      company: formData.company || 'General Resident',
      phoneNumber: formData.phoneNumber,
      nationalId: formData.nationalId,
      email: formData.email,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      purposeOfStay: formData.purposeOfStay,
      hospitalReferral: formData.hospitalReferral,
      keyIssued: formData.keyIssued,
      roomCondition: formData.roomCondition,
      staffNotes: formData.staffNotes,
      bookedByStaff: formData.bookedByStaff || 'Helpdesk Admin',
      secondaryOccupant:
        activeBedSelect === 'BOTH'
          ? {
              patientName: formData.bed2GuestName.trim() || `${formData.patientName} (2nd Guest)`,
              company: formData.bed2Company || formData.company,
              phoneNumber: formData.bed2Phone,
              email: formData.bed2Email,
              nationalId: formData.bed2NationalId,
            }
          : undefined,
    });
    setIsPrintModalOpen(true);

    reloadRooms();
    setIsRoomHubOpen(false);
  };

  // Perform Transfer from inside Hub
  const handleExecuteTransfer = () => {
    if (!selectedRoom || !transferTargetRoomId) return;
    const sourceBed = activeBedSelect === 'BOTH' ? 1 : activeBedSelect;

    const res = StorageService.transferBedOccupant(
      selectedRoom.id,
      sourceBed,
      transferTargetRoomId,
      transferTargetBed
    );

    if (res.success) {
      const targetRoom = rooms.find((r) => r.id === transferTargetRoomId);
      // Transfer in Google Sheets: Release old bed and push new booking
      pushCheckoutToSheet(selectedRoom.buildingNumber, sourceBed);
      if (targetRoom) {
        const sourceOccupant = selectedRoom.occupants?.find((o) => o.bedNumber === sourceBed);
        if (sourceOccupant) {
          pushGuestToSheet(targetRoom.buildingNumber, transferTargetBed, {
            patientName: sourceOccupant.patientName,
            company: sourceOccupant.company,
            phoneNumber: sourceOccupant.phoneNumber,
            email: sourceOccupant.email,
            nationalId: sourceOccupant.nationalId,
            checkIn: sourceOccupant.checkIn,
            checkOut: sourceOccupant.checkOut,
            bookingType: sourceOccupant.bookingType,
            purposeOfStay: sourceOccupant.purposeOfStay,
            hospitalReferral: sourceOccupant.hospitalReferral,
            staffNotes: sourceOccupant.staffNotes,
            bookedByStaff: sourceOccupant.bookedByStaff,
          });
        }
      }

      reloadRooms();
      setIsRoomHubOpen(false);
      showNotification(
        `Transferred occupant to Room ${targetRoom?.buildingNumber || transferTargetRoomId} (Bed ${transferTargetBed})!`,
        'success'
      );
    } else {
      showNotification(res.error || 'Failed to transfer occupant.', 'error');
    }
  };

  // Perform Discharge from inside Hub
  const handleExecuteDischarge = (target: 'ACTIVE_BED' | 'ALL_BEDS' | 1 | 2) => {
    if (!selectedRoom) return;

    if (target === 'ALL_BEDS') {
      StorageService.dischargeIsolationPatient(selectedRoom.id);
      pushCheckoutToSheet(selectedRoom.buildingNumber);
      showNotification(`Room ${selectedRoom.buildingNumber} fully checked out.`, 'info');
    } else {
      let bed: 1 | 2 = 1;
      if (target === 1 || target === 2) {
        bed = target;
      } else {
        const occs = selectedRoom.occupants || [];
        if (activeBedSelect === 2) {
          bed = 2;
        } else if (activeBedSelect === 1) {
          bed = 1;
        } else {
          // 'BOTH' was selected, prefer whichever bed is occupied
          const occ2 = occs.find((o) => o.bedNumber === 2);
          const occ1 = occs.find((o) => o.bedNumber === 1);
          bed = occ1 ? 1 : occ2 ? 2 : 1;
        }
      }
      StorageService.dischargeBedOccupant(selectedRoom.id, bed);
      pushCheckoutToSheet(selectedRoom.buildingNumber, bed);
      showNotification(`Bed ${bed} in Room ${selectedRoom.buildingNumber} checked out and released.`, 'info');
    }

    reloadRooms();
    setIsRoomHubOpen(false);
  };

  // Update room condition notes
  const handleSaveMaintenance = () => {
    if (!selectedRoom) return;
    StorageService.updateIsolationRoom(selectedRoom.id, {
      roomCondition: formData.roomCondition,
      staffNotes: formData.staffNotes,
    });
    showNotification(`Room ${selectedRoom.buildingNumber} status updated.`, 'success');
    reloadRooms();
    setIsRoomHubOpen(false);
  };

  // Bulk / Multi-Room Allocation
  const handleGroupAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const vacantRoomsInBuilding = rooms.filter(
      (r) => (r.occupants || []).length === 0 && r.buildingNumber.toUpperCase().startsWith(groupBuilding)
    );

    if (vacantRoomsInBuilding.length === 0) {
      showNotification(`No vacant rooms available in Building ${groupBuilding}!`, 'error');
      return;
    }

    const allocateRooms = vacantRoomsInBuilding.slice(0, groupRoomsCount);
    allocateRooms.forEach((r, idx) => {
      const guest1Name = formData.patientName ? `${formData.patientName} #${idx * 2 + 1}` : `Group Guest #${idx * 2 + 1}`;
      const guest2Name = formData.patientName ? `${formData.patientName} #${idx * 2 + 2}` : `Group Guest #${idx * 2 + 2}`;

      StorageService.admitIsolationPatient(r.id, {
        patientName: guest1Name,
        company: formData.company || 'Corporate Group',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        phoneNumber: formData.phoneNumber,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay || 'Group Stay',
        staffNotes: formData.staffNotes,
        targetBed: 'BOTH',
        bed2Guest: {
          patientName: guest2Name,
          company: formData.company || 'Corporate Group',
        },
      });

      // Sync both occupants to Google Sheets
      pushGuestToSheet(r.buildingNumber, 1, {
        patientName: guest1Name,
        company: formData.company || 'Corporate Group',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        phoneNumber: formData.phoneNumber,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay || 'Group Stay',
        staffNotes: formData.staffNotes,
      });

      pushGuestToSheet(r.buildingNumber, 2, {
        patientName: guest2Name,
        company: formData.company || 'Corporate Group',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        bookingType: formData.bookingType,
        purposeOfStay: formData.purposeOfStay || 'Group Stay',
        staffNotes: formData.staffNotes,
      });
    });

    reloadRooms();
    setIsGroupBookOpen(false);
    showNotification(`Allocated ${allocateRooms.length} rooms (${allocateRooms.length * 2} beds) in Building ${groupBuilding}!`, 'success');
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = StorageService.exportIsolationRoomsCsv(rooms);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TAFGA_Room_Roster_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Room Registry exported as CSV.', 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold text-white ${
              notification.type === 'error'
                ? 'bg-rose-600'
                : notification.type === 'info'
                ? 'bg-sky-600'
                : 'bg-emerald-600'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Clean Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Rooms & Beds</div>
            <div className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">{totalRooms} Rooms</div>
            <div className="text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400">{totalBeds} Twin Beds (2x1)</div>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
            <BedDouble className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 p-3 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Occupied Beds</div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 leading-tight mt-0.5">{occupiedBeds} / {totalBeds} Beds</div>
            <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">{fullyOccupiedRooms} Full · {partiallyOccupiedRooms} Partial</div>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Available Beds</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">{vacantBeds} Beds</div>
            <div className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">{fullyVacantRooms} Rooms Empty</div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <UserX className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="flex-1 pr-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Bed Occupancy</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">{bedOccupancyRate}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  bedOccupancyRate > 75 ? 'bg-rose-500' : bedOccupancyRate > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${bedOccupancyRate}%` }}
              />
            </div>
          </div>
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Unified & Streamlined Filter & Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          
          {/* Left: Master Category Segmented Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                typeFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Types <span className="opacity-70 text-[10.5px]">({rooms.length}R)</span>
            </button>
            <button
              onClick={() => setTypeFilter('General Guest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                typeFilter === 'General Guest'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>General Guest</span>
              <span className="bg-indigo-500/30 text-[10.5px] px-1.5 py-0.2 rounded-md font-extrabold">{generalGuestBeds}</span>
            </button>
            <button
              onClick={() => setTypeFilter('Medical Isolation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                typeFilter === 'Medical Isolation'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Medical Isolation</span>
              <span className="bg-rose-500/30 text-[10.5px] px-1.5 py-0.2 rounded-md font-extrabold">{medicalIsolationBeds}</span>
            </button>
          </div>

          {/* Right: Merged Filters, Search & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Merged Filter: Building Dropdown */}
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value as any)}
                className={`pl-8 pr-7 py-1.5 text-xs font-bold rounded-xl border appearance-none transition cursor-pointer focus:outline-none ${
                  buildingFilter !== 'ALL'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <option value="ALL">🏢 All Buildings ({rooms.length} Rooms)</option>
                <option value="R">🏢 Building R (6 Rooms)</option>
                <option value="B">🏢 Building B (6 Rooms)</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Merged Filter: Bed / Room Occupancy Status Dropdown */}
            <div className="relative">
              <BedDouble className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`pl-8 pr-7 py-1.5 text-xs font-bold rounded-xl border appearance-none transition cursor-pointer focus:outline-none ${
                  statusFilter === 'DUE_TODAY'
                    ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-950 dark:text-amber-200 font-extrabold'
                    : statusFilter === 'OVERDUE'
                    ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-200 font-extrabold'
                    : statusFilter === 'DUE_SOON'
                    ? 'bg-sky-100 dark:bg-sky-950/80 border-sky-500 text-sky-950 dark:text-sky-200 font-extrabold'
                    : statusFilter !== 'ALL'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <option value="ALL">🛏️ All Statuses</option>
                {dueTodayGuestsCount > 0 && (
                  <option value="DUE_TODAY">🚨 Checkout Due Today ({dueTodayGuestsCount})</option>
                )}
                {overdueGuestsCount > 0 && (
                  <option value="OVERDUE">⚠️ Checkout Overdue ({overdueGuestsCount})</option>
                )}
                {dueSoonGuestsCount > 0 && (
                  <option value="DUE_SOON">⏰ Checkout Due Soon 1-3D ({dueSoonGuestsCount})</option>
                )}
                <option value="VACANT">🟢 Vacant ({fullyVacantRooms} Rooms)</option>
                <option value="Partially Occupied">🟡 1/2 Bed Partial ({partiallyOccupiedRooms} Rooms)</option>
                <option value="Occupied">🔴 Full ({fullyOccupiedRooms} Rooms)</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search guest, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset Filters Pill (Only when filters are active) */}
            {(buildingFilter !== 'ALL' || statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery.trim() !== '') && (
              <button
                onClick={() => {
                  setBuildingFilter('ALL');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                  setSearchQuery('');
                }}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="text-[11px]">Reset</span>
              </button>
            )}

            {/* Action Buttons: Group Book, CSV, Clinical Vitals, Certificate & Layout Switcher */}
            <button
              onClick={() => {
                const firstOcc = rooms.find((r) => (r.occupants || []).length > 0) || rooms[0];
                setVitalsTargetRoom(firstOcc);
                setIsVitalsModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              title="Record Clinical Vitals Log"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Vitals Log</span>
            </button>

            <button
              onClick={() => {
                const firstOcc = rooms.find((r) => (r.occupants || []).length > 0) || rooms[0];
                setClearanceTargetRoom(firstOcc);
                setIsClearanceModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              title="Generate Medical Fit-To-Work Certificate"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Medical Cert</span>
            </button>

            <button
              onClick={() => setIsGroupBookOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              title="Group Booking"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group Book</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewLayout('compact-grid')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  viewLayout === 'compact-grid'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Room Slots Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('bed-matrix')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  viewLayout === 'bed-matrix'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Bed Occupancy Matrix (Visualizer)"
              >
                <Bed className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('detailed-list')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  viewLayout === 'detailed-list'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Detailed Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPERATIONAL ROOM SLOT GRID - Clean & Professional Grid Layout */}
      {/* ========================================================================= */}
      {viewLayout === 'compact-grid' && (
        <div className="w-full bg-white dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 shadow-md shadow-slate-900/5 dark:shadow-2xl space-y-4 sm:space-y-5 transition-colors">
          {/* Top Header & Slot Statistics Legend */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 sm:pb-4 border-b-2 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
                <span>Operational Slot Grid</span>
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  — Isolation & Residential Rooms
                </span>
              </h3>
            </div>

            {/* Live Status Counter Legend */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
              {/* Due Today / Overdue Indicators Legend */}
              {dueTodayGuestsCount > 0 && (
                <div className="flex items-center space-x-1.5 bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 px-2.5 py-1 rounded-xl shadow-xs animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                  <span className="font-black text-amber-950 dark:text-amber-200">Due Today ({dueTodayGuestsCount})</span>
                </div>
              )}

              {overdueGuestsCount > 0 && (
                <div className="flex items-center space-x-1.5 bg-rose-100 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-700 px-2.5 py-1 rounded-xl shadow-xs animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-xs" />
                  <span className="font-black text-rose-950 dark:text-rose-200">Overdue ({overdueGuestsCount})</span>
                </div>
              )}

              {/* Available (Vacant) */}
              <div className="flex items-center space-x-1.5 bg-teal-50/90 border-2 border-teal-400 dark:bg-teal-950/40 dark:border-teal-700 px-3 py-1 rounded-xl shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-xs" />
                <span className="font-black text-teal-950 dark:text-teal-100">Available ({fullyVacantRooms})</span>
              </div>

              {/* Partial (1/2 Bed) */}
              <div className="flex items-center space-x-1.5 bg-amber-50/90 border-2 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 px-3 py-1 rounded-xl shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                <span className="font-black text-amber-950 dark:text-amber-100">1/2 Bed ({partiallyOccupiedRooms})</span>
              </div>

              {/* Booked (Full) */}
              <div className="flex items-center space-x-1.5 bg-slate-200/90 border-2 border-dashed border-slate-400/80 dark:bg-slate-800/80 dark:border-slate-700 px-3 py-1 rounded-xl opacity-75 shadow-xs">
                <Lock className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                <span className="font-black text-slate-700 dark:text-slate-300">Booked ({fullyOccupiedRooms})</span>
              </div>
            </div>
          </div>

          {/* Slots Grid Container - 6 columns max so 12 rooms form 2 clean lines */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-3.5">
            {filteredRooms.map((room, rIdx) => {
              const roomCode = room.buildingNumber.replace('Building ', '');

              const occs = room.occupants || [];
              const bed1 = occs.find((o) => o.bedNumber === 1);
              const bed2 = occs.find((o) => o.bedNumber === 2);

              const occupiedCount = (bed1 ? 1 : 0) + (bed2 ? 1 : 0);
              const isFullyOccupied = occupiedCount === 2;
              const isPartiallyOccupied = occupiedCount === 1;
              const isFullyVacant = occupiedCount === 0;

              // Checkout Status Calculation
              const checkoutSummary = getRoomCheckoutSummary(room);
              const isOverdue = checkoutSummary.isOverdue;
              const isDueToday = checkoutSummary.isDueToday;
              const primaryStatus = checkoutSummary.primaryStatus;

              const slotStatusCategory = isFullyOccupied
                ? 'BOOKED'
                : isPartiallyOccupied
                ? 'NEXT'
                : 'AVAILABLE';

              return (
                <div key={`iso-room-grid-${room.id || room.buildingNumber || rIdx}-${rIdx}`} className="relative group">
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: Math.min(rIdx * 0.015, 0.3) }}
                    whileHover={isFullyOccupied ? { scale: 1.01 } : { y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openRoomHub(room, isFullyVacant ? 'checkin' : 'details', isFullyVacant ? 'BOTH' : (bed1 ? 1 : 2))}
                    className={`relative min-h-[156px] rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 select-none cursor-pointer overflow-hidden border-2 z-10 ${
                      isOverdue
                        ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/25 text-slate-950 dark:text-slate-100 shadow-xs'
                        : isDueToday
                        ? 'border-amber-500 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/25 text-slate-950 dark:text-slate-100 shadow-xs'
                        : isFullyOccupied
                        ? 'border-slate-200/90 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/50 opacity-65 hover:opacity-85 hover:border-slate-300 dark:hover:border-slate-700 shadow-none'
                        : isPartiallyOccupied
                        ? 'border-amber-400/90 hover:border-amber-500 dark:border-amber-600/80 dark:hover:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 hover:shadow-md text-slate-950 dark:text-slate-100'
                        : 'border-teal-400 hover:border-teal-600 dark:border-teal-600 dark:hover:border-teal-400 bg-teal-50/20 dark:bg-teal-950/20 hover:shadow-md text-slate-950 dark:text-slate-100'
                    }`}
                  >
                    {/* Room-Specific Background Sticker / Watermark Art - Vibrant & Darker */}
                    <div className={`absolute -right-2.5 -bottom-2.5 pointer-events-none z-0 transition-transform duration-300 group-hover:scale-125 ${
                      isFullyOccupied ? 'opacity-20 grayscale' : isPartiallyOccupied ? 'opacity-60' : 'opacity-80 group-hover:opacity-100'
                    }`}>
                      <IsolationRoomSlotSticker
                        variant={room.slNo - 1}
                        status={slotStatusCategory}
                        className="w-24 h-24"
                      />
                    </div>

                    {/* Top Row: Room Code Badge & Capacity / Alert Status */}
                    <div className="relative z-10 flex items-center justify-between text-xs gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          isFullyOccupied
                            ? 'bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            : isPartiallyOccupied
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}>
                          <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>{roomCode}</span>
                        </span>

                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs animate-pulse">
                            <span>⚠️</span>
                            <span>Overdue</span>
                          </span>
                        )}

                        {isDueToday && !isOverdue && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs animate-pulse">
                            <span>🚨</span>
                            <span>Today</span>
                          </span>
                        )}
                      </div>

                      {isFullyOccupied ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-black border border-slate-400 dark:border-slate-600 shadow-2xs">
                          <Lock className="w-2.5 h-2.5" />
                          <span>FULL</span>
                        </span>
                      ) : isPartiallyOccupied ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-black border border-amber-300 dark:border-amber-700 shadow-2xs">
                          <span>1/2 Free</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                          2 Beds Ready
                        </span>
                      )}
                    </div>

                    {/* Center: Dual-Bed Allocation Status */}
                    <div className="relative z-10 space-y-1.5 my-auto">
                      {/* Room Heading */}
                      <div className="flex items-center justify-between">
                        <div className={`text-[13px] sm:text-[14px] font-black tracking-tight leading-none ${
                          isFullyOccupied
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-950 dark:text-white'
                        }`}>
                          Room {roomCode}
                        </div>
                        {isFullyVacant && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                            2 Beds Vacant
                          </span>
                        )}
                      </div>

                      {/* Bed 1 & Bed 2 Allocation Rows */}
                      <div className="space-y-1">
                        {/* BED 1 (B1) */}
                        <div
                          className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                            bed1
                              ? 'bg-slate-900/90 dark:bg-slate-950/95 text-white border border-slate-700/60 shadow-2xs'
                              : 'bg-emerald-50/80 dark:bg-emerald-950/25 border border-dashed border-emerald-400/60 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300'
                          }`}
                          title={bed1 ? `Bed 1: ${bed1.patientName} (${bed1.company || 'Tamimi'})` : 'Bed 1: Available'}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`text-[9px] font-black uppercase px-1 py-0.2 rounded shrink-0 ${
                                bed1
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                              }`}
                            >
                              B1
                            </span>
                            <span
                              className={`truncate font-bold text-[11px] ${
                                bed1 ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-300 font-medium'
                              }`}
                            >
                              {bed1 ? bed1.patientName : 'Available'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {bed1?.company && (
                              <span className="text-[9px] font-medium text-slate-400 truncate max-w-[45px]">
                                {bed1.company}
                              </span>
                            )}
                            {bed1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWhatsAppShare(room, 1, bed1);
                                }}
                                className="p-0.5 rounded-sm hover:bg-emerald-600/50 text-emerald-400 hover:text-white transition cursor-pointer"
                                title="Send WhatsApp Pass"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* BED 2 (B2) */}
                        <div
                          className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                            bed2
                              ? 'bg-slate-900/90 dark:bg-slate-950/95 text-white border border-slate-700/60 shadow-2xs'
                              : 'bg-emerald-50/80 dark:bg-emerald-950/25 border border-dashed border-emerald-400/60 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300'
                          }`}
                          title={bed2 ? `Bed 2: ${bed2.patientName} (${bed2.company || 'Tamimi'})` : 'Bed 2: Available'}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`text-[9px] font-black uppercase px-1 py-0.2 rounded shrink-0 ${
                                bed2
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                              }`}
                            >
                              B2
                            </span>
                            <span
                              className={`truncate font-bold text-[11px] ${
                                bed2 ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-300 font-medium'
                              }`}
                            >
                              {bed2 ? bed2.patientName : 'Available'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {bed2?.company && (
                              <span className="text-[9px] font-medium text-slate-400 truncate max-w-[45px]">
                                {bed2.company}
                              </span>
                            )}
                            {bed2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWhatsAppShare(room, 2, bed2);
                                }}
                                className="p-0.5 rounded-sm hover:bg-emerald-600/50 text-emerald-400 hover:text-white transition cursor-pointer"
                                title="Send WhatsApp Pass"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className={`relative z-10 pt-2 border-t flex items-center justify-between text-xs ${
                      isOverdue
                        ? 'border-rose-200/80 dark:border-rose-800/80'
                        : isDueToday
                        ? 'border-amber-200/80 dark:border-amber-800/80'
                        : isFullyOccupied
                        ? 'border-slate-300 dark:border-slate-700'
                        : isPartiallyOccupied
                        ? 'border-amber-200 dark:border-amber-800'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}>
                      {isFullyOccupied ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                            Occupied (2/2)
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-black text-[10px] transition-all flex items-center gap-1 shadow-2xs">
                            <span>Manage</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      ) : isPartiallyOccupied ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>1 Bed Free</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] transition-all shadow-xs group-hover:scale-105">
                            Book +
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                            <span>Available</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all shadow-xs group-hover:scale-105">
                            Book +
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewLayout === 'detailed-list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-bold">Room</th>
                  <th className="py-2.5 px-3 font-bold">Bed 1 Status & Checkout</th>
                  <th className="py-2.5 px-3 font-bold">Bed 2 Status & Checkout</th>
                  <th className="py-2.5 px-3 font-bold">Occupancy</th>
                  <th className="py-2.5 px-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRooms.map((room, rIdx) => {
                  const occs = room.occupants || [];
                  const bed1 = occs.find((o) => o.bedNumber === 1);
                  const bed2 = occs.find((o) => o.bedNumber === 2);
                  const occCount = (bed1 ? 1 : 0) + (bed2 ? 1 : 0);

                  const b1Status = bed1?.checkOut ? getCheckoutStatus(bed1.checkOut) : null;
                  const b2Status = bed2?.checkOut ? getCheckoutStatus(bed2.checkOut) : null;

                  return (
                    <tr
                      key={`iso-room-row-${room.id || room.buildingNumber || rIdx}-${rIdx}`}
                      onClick={() => openRoomHub(room, occCount === 0 ? 'checkin' : 'details', occCount === 0 ? 'BOTH' : (bed1 ? 1 : 2))}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {room.buildingNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        {bed1 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">{bed1.patientName}</span>
                              {b1Status && (
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${b1Status.pillClass}`}>
                                  {b1Status.shortLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span>{bed1.company || 'Resident'}</span>
                              {bed1.checkOut && <span className="font-mono opacity-80">· Out: {bed1.checkOut}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Available</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {bed2 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">{bed2.patientName}</span>
                              {b2Status && (
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${b2Status.pillClass}`}>
                                  {b2Status.shortLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span>{bed2.company || 'Resident'}</span>
                              {bed2.checkOut && <span className="font-mono opacity-80">· Out: {bed2.checkOut}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Available</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            occCount === 2
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : occCount === 1
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {occCount === 2 ? '2/2 Full' : occCount === 1 ? '1/2 Partial' : 'Vacant'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {occCount > 0 && (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWhatsAppShare(room, 1);
                                }}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
                                title="Send Direct WhatsApp Pass"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAdmissionPrintForm(room);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                                title="Print A4 Admission Form"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRoomHub(room, occCount === 0 ? 'checkin' : 'details', occCount === 0 ? 'BOTH' : (bed1 ? 1 : 2));
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REAL-TIME INTERACTIVE BED OCCUPANCY MATRIX (Visual Heatmap Grid) */}
      {/* ========================================================================= */}
      {viewLayout === 'bed-matrix' && (
        <RoomBedMatrixVisualizer
          rooms={filteredRooms}
          onSelectBed={(room, bedNum) => {
            const occs = room.occupants || [];
            const existingOccupant = occs.find((o) => o.bedNumber === bedNum);
            if (existingOccupant) {
              openRoomHub(room, 'details', bedNum);
            } else {
              openRoomHub(room, 'checkin', bedNum);
            }
          }}
          onOpenRoomHub={(room, tab) => {
            openRoomHub(room, tab, 1);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* UNIFIED MULTI-FUNCTIONAL ROOM CONTROL HUB (Nested, Step-by-Step Flow) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRoomHubOpen && selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Hub Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {selectedRoom.buildingNumber} Control Hub
                      </h2>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-md text-[10px] font-bold">
                        2x Twin Beds
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Condition: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedRoom.roomCondition || 'Cleaned & Ready'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {(selectedRoom.occupants || []).length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppShare(selectedRoom, activeBedSelect === 'BOTH' ? 1 : activeBedSelect)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                        title="Send Direct WhatsApp Pass"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdmissionPrintForm(selectedRoom, activeBedSelect)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                        title="Print Official A4 Admission / Signature Form"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Print A4 Form</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setIsRoomHubOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Step 1: Bed Target Selector Bar */}
              <div className="px-4 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>SELECT TARGET BED / OCCUPANT:</span>
                  <span className="text-[10px] text-slate-500">
                    Active: {activeBedSelect === 'BOTH' ? 'Whole Room (Both Beds)' : `Bed ${activeBedSelect}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Bed 1 Selector */}
                  {(() => {
                    const occ = (selectedRoom.occupants || []).find((o) => o.bedNumber === 1);
                    const isSelected = activeBedSelect === 1;
                    return (
                      <button
                        type="button"
                        onClick={() => handleBedSelectChange(1)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-black text-xs text-slate-900 dark:text-white">Bed 1</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              occ ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                          {occ ? occ.patientName : 'Empty / Ready'}
                        </div>
                      </button>
                    );
                  })()}

                  {/* Bed 2 Selector */}
                  {(() => {
                    const occ = (selectedRoom.occupants || []).find((o) => o.bedNumber === 2);
                    const isSelected = activeBedSelect === 2;
                    return (
                      <button
                        type="button"
                        onClick={() => handleBedSelectChange(2)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-black text-xs text-slate-900 dark:text-white">Bed 2</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              occ ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                          {occ ? occ.patientName : 'Empty / Ready'}
                        </div>
                      </button>
                    );
                  })()}

                  {/* Both Beds Selector */}
                  {(() => {
                    const isSelected = activeBedSelect === 'BOTH';
                    const occCount = (selectedRoom.occupants || []).length;
                    return (
                      <button
                        type="button"
                        onClick={() => handleBedSelectChange('BOTH')}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-black text-xs text-slate-900 dark:text-white">Both Beds</span>
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                          {occCount === 0 ? 'Book Dual Guests' : `${occCount}/2 Occupied`}
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Step 2: Nested Functional Action Tabs */}
              <div className="flex items-center space-x-1 px-4 py-2 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                    activeTab === 'checkin'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Check-In / Edit</span>
                </button>

                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                    activeTab === 'details'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Guest Profile</span>
                </button>

                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                    activeTab === 'transfer'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Bed</span>
                </button>

                <button
                  onClick={() => setActiveTab('checkout')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                    activeTab === 'checkout'
                      ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check-Out</span>
                </button>

                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                    activeTab === 'maintenance'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Maintenance</span>
                </button>
              </div>

              {/* Step 3: Tab Content Body */}
              <div className="p-4 overflow-y-auto flex-1 text-xs">
                {/* TAB 1: CHECK-IN / ASSIGN FORM */}
                {activeTab === 'checkin' && (
                  <form onSubmit={handleSaveOccupancy} className="space-y-3.5">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                      <span className="font-bold">
                        Targeting: {activeBedSelect === 'BOTH' ? '2 Guests (Bed 1 & Bed 2)' : `Bed ${activeBedSelect}`}
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {selectedRoom.buildingNumber}
                      </span>
                    </div>

                    {/* Header for Guest/Bed targeting */}
                    <div className="font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{activeBedSelect === 'BOTH' ? 'Primary Guest (Bed 1 Details)' : `Guest Details (Bed ${activeBedSelect})`}</span>
                    </div>

                    {/* Stay Category Switcher (Top of Check-In) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Stay Category / Admission Type *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              bookingType: 'Medical Isolation',
                              hospitalReferral: formData.hospitalReferral || 'Alleanza Clinic',
                            })
                          }
                          className={`p-3 rounded-2xl border flex items-center space-x-2.5 text-xs font-bold transition cursor-pointer text-left ${
                            formData.bookingType === 'Medical Isolation'
                              ? 'bg-rose-50/90 dark:bg-rose-950/70 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/25 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              formData.bookingType === 'Medical Isolation'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <HeartPulse className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-xs leading-tight">Medical Isolation</div>
                            <div className="text-[10.5px] font-semibold text-rose-600 dark:text-rose-400 truncate">
                              Quarantine, Clinic Referral &amp; Care
                            </div>
                          </div>
                          {formData.bookingType === 'Medical Isolation' && (
                            <Check className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              bookingType: 'General Guest',
                              hospitalReferral: '',
                            })
                          }
                          className={`p-3 rounded-2xl border flex items-center space-x-2.5 text-xs font-bold transition cursor-pointer text-left ${
                            formData.bookingType === 'General Guest'
                              ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/25 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              formData.bookingType === 'General Guest'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-xs leading-tight">General Guest</div>
                            <div className="text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                              Normal Resident, Staff &amp; Visitor
                            </div>
                          </div>
                          {formData.bookingType === 'General Guest' && (
                            <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* CONDITIONAL FORM: MEDICAL ISOLATION SPECIFIC FIELDS       */}
                    {/* ========================================================= */}
                    {formData.bookingType === 'Medical Isolation' && (
                      <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-black text-xs text-rose-900 dark:text-rose-200 flex items-center space-x-1.5">
                            <HeartPulse className="w-4 h-4 text-rose-600" />
                            <span>Medical Isolation Patient Demographics</span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300">
                            Clinical Record
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Patient Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Muhammad Afnan"
                              value={formData.patientName}
                              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Sponsoring Company / Employer *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Tamimi Global / Subcontractor"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Phone / Mobile Contact *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. +966 50 123 4567"
                              value={formData.phoneNumber}
                              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. guest@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              National ID / Iqama Number *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2389104821"
                              value={formData.nationalId}
                              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>

                        {/* Referral Clinic & Medical Reason */}
                        <div className="space-y-2 pt-1 border-t border-rose-200/80 dark:border-rose-900/40">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200">
                                Referral Medical Center / Clinic *
                              </label>
                              <span className="text-[10px] font-bold text-rose-600">Hospital / Clinic Source</span>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Alleanza Clinic / Regional General Hospital"
                              value={formData.hospitalReferral}
                              onChange={(e) => setFormData({ ...formData, hospitalReferral: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-900 dark:text-rose-200 focus:outline-none focus:border-rose-500"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                              {[
                                'Alleanza Clinic',
                                'Referred from Regional General Hospital',
                                'Tamimi Camp Clinic',
                                'Occupational Health Clinic',
                                'Post-Discharge Observation',
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, hospitalReferral: preset })}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                                    formData.hospitalReferral === preset
                                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Medical Condition / Isolation Diagnosis *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Scabies / Chickenpox / Viral Infection Care"
                              value={formData.purposeOfStay}
                              onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold">Diagnosis Presets:</span>
                              {[
                                'Scabies',
                                'Chickenpox',
                                'Conjunctivitis (Eye Infection)',
                                'Viral Flu / Fever',
                                'COVID-19 / Respiratory',
                                'Gastroenteritis / Food Poisoning',
                                'Mumps / Measles',
                                'Preventive Quarantine',
                              ].map((reason) => (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, purposeOfStay: reason })}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer border ${
                                    formData.purposeOfStay === reason
                                      ? 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 hover:bg-rose-50'
                                  }`}
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* CONDITIONAL FORM: GENERAL GUEST SPECIFIC FIELDS           */}
                    {/* ========================================================= */}
                    {formData.bookingType === 'General Guest' && (
                      <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-black text-xs text-indigo-900 dark:text-indigo-200 flex items-center space-x-1.5">
                            <User className="w-4 h-4 text-indigo-600" />
                            <span>Resident &amp; General Guest Information</span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-300">
                            Standard Housing
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Guest Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Tariq Mansoor / Ahmed Ali"
                              value={formData.patientName}
                              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Company / Organization / Project *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Tamimi Global / Aramco Operations"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Phone / Mobile Number *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. +966 50 987 6543"
                              value={formData.phoneNumber}
                              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. resident@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              National ID / Iqama / Passport No
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2489012345"
                              value={formData.nationalId}
                              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Purpose of Stay / Assignment */}
                        <div className="space-y-1.5 pt-1 border-t border-indigo-200/80 dark:border-indigo-900/40">
                          <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                            Purpose of Stay / Assignment / Department
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Project Site Engineer / Routine Camp Stay / Business Trip"
                            value={formData.purposeOfStay}
                            onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                            {[
                              'Project & Site Duty',
                              'Camp Routine Stay',
                              'Official Business Visit',
                              'Contractor / Subcontractor',
                              'Temporary Accommodation',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setFormData({ ...formData, purposeOfStay: preset })}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                                  formData.purposeOfStay === preset
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                    : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dual Booking: Guest 2 Section */}
                    {activeBedSelect === 'BOTH' && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                        <div className="font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-sky-600" />
                          <span>Guest 2 (Bed 2 Details)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              2nd Guest Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Tariq Mansoor"
                              value={formData.bed2GuestName}
                              onChange={(e) => setFormData({ ...formData, bed2GuestName: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              2nd Guest Company
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Tamimi Global"
                              value={formData.bed2Company}
                              onChange={(e) => setFormData({ ...formData, bed2Company: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              2nd Guest Phone
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. +966 50 123 4567"
                              value={formData.bed2Phone}
                              onChange={(e) => setFormData({ ...formData, bed2Phone: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              2nd Guest Email
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. guest2@example.com"
                              value={formData.bed2Email}
                              onChange={(e) => setFormData({ ...formData, bed2Email: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              2nd Guest National ID / Iqama
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2389104822"
                              value={formData.bed2NationalId}
                              onChange={(e) => setFormData({ ...formData, bed2NationalId: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dates & Duration */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {formData.bookingType === 'Medical Isolation' ? 'Admission Date *' : 'Check-In Date *'}
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.checkIn}
                            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {formData.bookingType === 'Medical Isolation'
                              ? 'Expected Clearance / Discharge Date'
                              : 'Check-Out Date (Expected)'}
                          </label>
                          <input
                            type="date"
                            value={formData.checkOut}
                            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsRoomHubOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm & Save Check-In</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: DETAILED GUEST PROFILES */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1, 2].map((bedNum) => {
                        const occ = (selectedRoom.occupants || []).find((o) => o.bedNumber === bedNum);
                        return (
                          <div
                            key={`hub-bed-slot-${selectedRoom.id || selectedRoom.buildingNumber}-${bedNum}`}
                            className={`p-3.5 rounded-2xl border ${
                              occ
                                ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-dashed border-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2.5">
                              <span className="font-black text-xs text-slate-900 dark:text-white">
                                Twin Bed {bedNum}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  occ ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                {occ ? 'Occupied' : 'Vacant'}
                              </span>
                            </div>

                            {occ ? (
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-[10px] text-slate-400">Guest Name</div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">{occ.patientName}</div>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center space-x-1 ${
                                      occ.bookingType === 'Medical Isolation'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                    }`}
                                  >
                                    {occ.bookingType === 'Medical Isolation' ? (
                                      <>
                                        <HeartPulse className="w-3 h-3" />
                                        <span>Medical Isolation</span>
                                      </>
                                    ) : (
                                      <>
                                        <User className="w-3 h-3" />
                                        <span>General Guest</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <div className="text-[10px] text-slate-400">Company</div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">{occ.company || 'Resident'}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400">Phone</div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">{occ.phoneNumber || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400">National ID</div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">{occ.nationalId || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400">Email</div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={occ.email || 'N/A'}>{occ.email || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400">Check-In</div>
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">{occ.checkIn}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400">Check-Out</div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">{occ.checkOut || 'Open'}</span>
                                      {occ.checkOut && (() => {
                                        const cStatus = getCheckoutStatus(occ.checkOut);
                                        return (
                                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${cStatus.pillClass}`}>
                                            {cStatus.shortLabel}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                {occ.hospitalReferral && (
                                  <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs">
                                    <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400">Referral / Medical:</div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{occ.hospitalReferral}</div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 mt-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppShare(selectedRoom, bedNum as 1 | 2, occ)}
                                    className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer shadow-2xs"
                                    title="Send WhatsApp Pass"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAdmissionPrintForm(selectedRoom, bedNum as 1 | 2, occ)}
                                    className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center space-x-1 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-2xs"
                                    title="Print Official Form"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Form</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteDischarge(bedNum as 1 | 2)}
                                    className="col-span-2 py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center space-x-1 border border-rose-200 dark:border-rose-800 transition cursor-pointer shadow-2xs"
                                    title={`Check-Out and release Bed ${bedNum}`}
                                  >
                                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Check-Out Bed {bedNum} ({occ.patientName})</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                                  This bed is currently empty
                                </p>
                                <button
                                  onClick={() => {
                                    handleBedSelectChange(bedNum as 1 | 2);
                                    setActiveTab('checkin');
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                                >
                                  + Check-In Bed {bedNum}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: BED TRANSFER */}
                {activeTab === 'transfer' && (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                      <div className="font-bold flex items-center space-x-1.5">
                        <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                        <span>Transfer Occupant to Another Room / Bed</span>
                      </div>
                      <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                        Transfer the guest from Bed {activeBedSelect === 'BOTH' ? 1 : activeBedSelect} to another available twin bed without deleting records.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Destination Room
                        </label>
                        <select
                          value={transferTargetRoomId}
                          onChange={(e) => setTransferTargetRoomId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {rooms
                            .filter((r) => r.id !== selectedRoom.id)
                            .map((r, rIdx) => (
                              <option key={`transfer-target-${r.id || r.buildingNumber || rIdx}-${rIdx}`} value={r.id}>
                                {r.buildingNumber} ({(r.occupants || []).length}/2 Occupied)
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Destination Bed Slot
                        </label>
                        <select
                          value={transferTargetBed}
                          onChange={(e: any) => setTransferTargetBed(Number(e.target.value) as 1 | 2)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value={1}>Bed 1 (Twin A)</option>
                          <option value={2}>Bed 2 (Twin B)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsRoomHubOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteTransfer}
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                      >
                        Confirm Bed Transfer
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: CHECK-OUT / RELEASE */}
                {activeTab === 'checkout' && (() => {
                  const occupants = selectedRoom.occupants || [];
                  const occBed1 = occupants.find((o) => o.bedNumber === 1);
                  const occBed2 = occupants.find((o) => o.bedNumber === 2);
                  const hasAnyOccupant = occupants.length > 0;

                  return (
                    <div className="space-y-3.5">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200">
                        <div className="font-bold flex items-center space-x-1.5">
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Check-Out & Room Release Hub</span>
                        </div>
                        <p className="text-[11px] mt-0.5 text-rose-700 dark:text-rose-300">
                          Release individual twin beds or check out all guests to mark Room {selectedRoom.buildingNumber} clean and vacant.
                        </p>
                      </div>

                      {!hasAnyOccupant ? (
                        <div className="p-6 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                          <div className="text-xs font-black text-slate-900 dark:text-white">Room is Currently Vacant</div>
                          <p className="text-[11px] text-slate-500">
                            Both Bed 1 and Bed 2 in Room {selectedRoom.buildingNumber} are empty and ready for admissions.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Bed 1 Checkout Card */}
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-900 dark:text-white">Twin Bed 1</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black ${occBed1 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                  {occBed1 ? 'Occupied' : 'Vacant'}
                                </span>
                              </div>
                              {occBed1 ? (
                                <div className="space-y-2">
                                  <div className="text-xs">
                                    <div className="font-black text-slate-900 dark:text-white truncate">{occBed1.patientName}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{occBed1.company || 'Resident'} · In: {occBed1.checkIn}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteDischarge(1)}
                                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-xs flex items-center justify-center space-x-1.5"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Check-Out Bed 1</span>
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic py-3">Bed 1 is already vacant.</p>
                              )}
                            </div>

                            {/* Bed 2 Checkout Card */}
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-900 dark:text-white">Twin Bed 2</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black ${occBed2 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                  {occBed2 ? 'Occupied' : 'Vacant'}
                                </span>
                              </div>
                              {occBed2 ? (
                                <div className="space-y-2">
                                  <div className="text-xs">
                                    <div className="font-black text-slate-900 dark:text-white truncate">{occBed2.patientName}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{occBed2.company || 'Resident'} · In: {occBed2.checkIn}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteDischarge(2)}
                                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-xs flex items-center justify-center space-x-1.5"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Check-Out Bed 2</span>
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic py-3">Bed 2 is already vacant.</p>
                              )}
                            </div>
                          </div>

                          {/* Full Room Discharge Button */}
                          <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200/80 dark:border-rose-900/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
                            <div>
                              <div className="font-black text-xs text-rose-950 dark:text-rose-200">Release Entire Room (All Guests)</div>
                              <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                                Discharges all active occupants ({occupants.length} guest{occupants.length > 1 ? 's' : ''}) and marks Room {selectedRoom.buildingNumber} ready for housekeeping.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleExecuteDischarge('ALL_BEDS')}
                              className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-rose-800 dark:hover:bg-rose-900 text-white rounded-xl font-bold text-xs cursor-pointer shrink-0 transition active:scale-95 shadow-xs flex items-center space-x-1.5"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Release Room {selectedRoom.buildingNumber}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 5: MAINTENANCE & NOTES */}
                {activeTab === 'maintenance' && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Room Condition Status
                      </label>
                      <select
                        value={formData.roomCondition}
                        onChange={(e: any) => setFormData({ ...formData, roomCondition: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Cleaned & Ready">Cleaned & Ready</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Deep Sanitization Required">Deep Sanitization Required</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Staff Notes / Remarks
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. AC serviced, keys returned to front desk."
                        value={formData.staffNotes}
                        onChange={(e) => setFormData({ ...formData, staffNotes: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsRoomHubOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMaintenance}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                      >
                        Save Room Status
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GROUP BOOKING MODAL */}
      <AnimatePresence>
        {isGroupBookOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Multi-Room Group Booking</h3>
                </div>
                <button onClick={() => setIsGroupBookOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGroupAllocation} className="space-y-3 mt-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Building</label>
                    <select
                      value={groupBuilding}
                      onChange={(e: any) => setGroupBuilding(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="R">Building R</option>
                      <option value="B">Building B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Rooms</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={groupRoomsCount}
                      onChange={(e) => setGroupRoomsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Group / Leader Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project Alpha Team"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Tamimi Global"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Group Stay Category *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          bookingType: 'Medical Isolation',
                          hospitalReferral: formData.hospitalReferral || 'Alleanza Clinic',
                        })
                      }
                      className={`p-2.5 rounded-xl border flex items-center justify-center space-x-1.5 font-bold transition cursor-pointer text-xs ${
                        formData.bookingType === 'Medical Isolation'
                          ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                      <span>Medical Isolation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          bookingType: 'General Guest',
                          hospitalReferral: '',
                        })
                      }
                      className={`p-2.5 rounded-xl border flex items-center justify-center space-x-1.5 font-bold transition cursor-pointer text-xs ${
                        formData.bookingType === 'General Guest'
                          ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>General Guest</span>
                    </button>
                  </div>
                </div>

                {formData.bookingType === 'Medical Isolation' ? (
                  <div className="space-y-2 p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1">
                        Referral Medical Clinic / Center *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alleanza Clinic / Regional General Hospital"
                        value={formData.hospitalReferral}
                        onChange={(e) => setFormData({ ...formData, hospitalReferral: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-xl font-bold text-xs"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Alleanza Clinic', 'Referred from Regional General Hospital', 'Tamimi Camp Clinic'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({ ...formData, hospitalReferral: p })}
                            className="px-2 py-0.5 text-[9.5px] font-bold bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded cursor-pointer hover:bg-rose-50"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1">
                        Isolation Diagnosis / Condition *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Scabies / Chickenpox / Viral Flu"
                        value={formData.purposeOfStay}
                        onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-xl font-bold text-xs"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[
                          'Scabies',
                          'Chickenpox',
                          'Conjunctivitis (Eye Infection)',
                          'Viral Flu / Fever',
                          'COVID-19 / Respiratory',
                          'Preventive Quarantine',
                        ].map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setFormData({ ...formData, purposeOfStay: reason })}
                            className={`px-2 py-0.5 text-[9.5px] font-semibold rounded cursor-pointer border ${
                              formData.purposeOfStay === reason
                                ? 'bg-rose-600 text-white border-rose-700 font-bold'
                                : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl">
                    <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                      Purpose of Stay / Assignment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Project Operations / Routine Camp Stay"
                      value={formData.purposeOfStay}
                      onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-xl font-bold text-xs"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['Project & Site Duty', 'Camp Routine Stay', 'Official Business Visit'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, purposeOfStay: p })}
                          className="px-2 py-0.5 text-[9.5px] font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 rounded cursor-pointer hover:bg-indigo-50"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsGroupBookOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Allocate Group
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* A4 OFFICIAL RESIDENTIAL & ISOLATION ADMISSION / SIGNATURE PRINT MODAL     */}
      {/* ========================================================================= */}
      <RoomAdmissionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={printModalData}
      />

      {/* ========================================================================= */}
      {/* DIRECT WHATSAPP PASS & RECEIPT DISPATCH MODAL                             */}
      {/* ========================================================================= */}
      <WhatsAppShareModal
        isOpen={Boolean(whatsAppModalData)}
        onClose={() => setWhatsAppModalData(null)}
        title={whatsAppModalData?.title || 'Room Admission WhatsApp Dispatch'}
        recipientName={whatsAppModalData?.name || 'Resident Guest'}
        defaultPhone={whatsAppModalData?.phone || ''}
        messageText={whatsAppModalData?.message || ''}
        moduleLabel="Room & Isolation"
      />

      {/* ========================================================================= */}
      {/* CLINICAL VITALS LOGGING MODAL                                              */}
      {/* ========================================================================= */}
      <MedicalVitalsModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        room={vitalsTargetRoom}
        onVitalsSaved={reloadRooms}
      />

      {/* ========================================================================= */}
      {/* MEDICAL FIT-TO-WORK CLEARANCE CERTIFICATE MODAL                           */}
      {/* ========================================================================= */}
      <MedicalClearanceCertModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
        room={clearanceTargetRoom}
      />
    </div>
  );
};

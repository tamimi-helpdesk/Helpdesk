import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  Printer,
  Calendar,
  Clock,
  User,
  Phone,
  Share2,
  X,
  MessageCircle,
  ChevronDown,
  UserCheck,
  Globe,
  FileText,
  Building2,
  Package,
  ArrowLeftRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HandoverItemRecord, ParcelRecord, LostFoundRecord } from '../types';
import { formatDisplayDate, formatDisplayTime } from '../services/storageService';
import { WhatsAppService } from '../services/whatsappService';
import { FacilityDocumentPrintModal } from './FacilityDocumentPrintModal';

interface FacilityEntryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'HANDOVER' | 'PARCEL' | 'LOST_FOUND';
  handoverData?: HandoverItemRecord | null;
  parcelData?: ParcelRecord | null;
  lostFoundData?: LostFoundRecord | null;
  isSyncedToRemote?: boolean;
}

export const FacilityEntryConfirmationModal: React.FC<FacilityEntryConfirmationModalProps> = ({
  isOpen,
  onClose,
  documentType,
  handoverData,
  parcelData,
  lostFoundData,
  isSyncedToRemote = true,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  let title = '';
  let id = '';
  let recipientName = '';
  let phoneNumber = '';
  let primaryLabel = '';
  let primaryValue = '';
  let secondaryLabel = '';
  let secondaryValue = '';
  let dateStr = '';
  let timeStr = '';
  let statusBadge = '';
  let staffName = '';
  let whatsappMsg = '';

  if (documentType === 'HANDOVER' && handoverData) {
    title =
      handoverData.type === 'GIVEN_OUT'
        ? 'Asset Loan & Key Handover Registered'
        : handoverData.type === 'TAKEN_IN'
        ? 'Safe Custody Deposit Registered'
        : 'Inter-Department Transfer Registered';
    id = `HO-${handoverData.id}`;
    recipientName = handoverData.personName;
    phoneNumber = handoverData.phoneNumber;
    primaryLabel = 'Item Name & Qty';
    primaryValue = `${handoverData.itemName} (${handoverData.quantity || 1} pcs)`;
    secondaryLabel = 'Room / Dept';
    secondaryValue = [handoverData.roomNumber ? `Room ${handoverData.roomNumber}` : '', handoverData.departmentOrCompany].filter(Boolean).join(' - ') || 'N/A';
    dateStr = handoverData.issueDate;
    timeStr = handoverData.issueTime;
    statusBadge = handoverData.status.replace(/_/g, ' ');
    staffName = handoverData.authorizedByStaff;
    whatsappMsg = WhatsAppService.generateHandoverMessage(handoverData);
  } else if (documentType === 'PARCEL' && parcelData) {
    title = 'Inbound Parcel Successfully Logged';
    id = `PRC-${parcelData.id}`;
    recipientName = parcelData.recipientName;
    phoneNumber = parcelData.phoneNumber;
    primaryLabel = 'Tracking & Courier';
    primaryValue = `${parcelData.trackingNumber} (${parcelData.courierCompany})`;
    secondaryLabel = 'Room & Location';
    secondaryValue = `Room ${parcelData.roomNumber} - ${parcelData.storageLocation}`;
    dateStr = parcelData.receivedDate;
    timeStr = parcelData.receivedTime;
    statusBadge = parcelData.status.replace(/_/g, ' ');
    staffName = parcelData.receivedByStaff;
    whatsappMsg = WhatsAppService.generateParcelMessage(parcelData);
  } else if (documentType === 'LOST_FOUND' && lostFoundData) {
    title =
      lostFoundData.recordType === 'FOUND_ITEM'
        ? 'Found Property Vault Custody Logged'
        : 'Lost Property Inquiry Registered';
    id = `LNF-${lostFoundData.id}`;
    recipientName = lostFoundData.ownerName || lostFoundData.finderOrReporterName;
    phoneNumber = lostFoundData.ownerPhone || lostFoundData.finderOrReporterPhone;
    primaryLabel = 'Item & Category';
    primaryValue = `${lostFoundData.itemName} (${lostFoundData.category})`;
    secondaryLabel = 'Location';
    secondaryValue = lostFoundData.locationFoundOrLost;
    dateStr = lostFoundData.dateRecorded;
    timeStr = lostFoundData.timeRecorded;
    statusBadge = lostFoundData.status.replace(/_/g, ' ');
    staffName = lostFoundData.handedOverByStaff || 'Security Desk';
    whatsappMsg = WhatsAppService.generateLostFoundMessage(lostFoundData);
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareWithGuest = () => {
    setIsShareMenuOpen(false);
    WhatsAppService.open(phoneNumber, whatsappMsg);
  };

  const handleShareAnyone = () => {
    setIsShareMenuOpen(false);
    WhatsAppService.shareAnyone(whatsappMsg);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-5 sm:p-7 relative transition-colors"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Header Icon & Title */}
          <div className="flex items-center space-x-3.5 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Ref ID: <strong className="text-slate-900 dark:text-white font-black">{id}</strong>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>{isSyncedToRemote ? 'Synced to Google Sheet ✓' : 'Saved Locally'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Key Summary Details Grid */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Guest / Person Name
                </span>
                <span className="font-black text-slate-900 dark:text-white text-xs mt-0.5 flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>{recipientName || 'Guest'}</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Phone Number
                </span>
                <span className="font-black text-slate-900 dark:text-white text-xs mt-0.5 flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{phoneNumber || 'N/A'}</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  {primaryLabel}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 block truncate">
                  {primaryValue}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  {secondaryLabel}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 block truncate">
                  {secondaryValue}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatDisplayDate(dateStr)} • {formatDisplayTime(timeStr)}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300">
                  {statusBadge}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Print, Share (WhatsApp), Copy, Done */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-3 gap-2">
              {/* 1. Print Button */}
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-xs transition cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Slip</span>
              </button>

              {/* 2. Share Dropdown (WhatsApp) */}
              <div className="relative" ref={shareMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsShareMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isShareMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isShareMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      className="absolute left-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        WhatsApp Sharing
                      </div>
                      <button
                        type="button"
                        onClick={handleShareWithGuest}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-100 text-xs font-bold transition text-left cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div>Share With Guest</div>
                          <div className="text-[10px] text-slate-400 font-normal">Direct to {phoneNumber || 'guest'}</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareAnyone}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-800 dark:text-slate-100 text-xs font-bold transition text-left cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <div>Share Anyone</div>
                          <div className="text-[10px] text-slate-400 font-normal">Pick contact or group</div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Copy ID Button */}
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
              </button>
            </div>

            {/* 4. Done Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-sm transition cursor-pointer shadow-md active:scale-98"
            >
              Done / Back to List
            </button>
          </div>
        </motion.div>
      </div>

      {/* A4 Print Document Modal */}
      {showPrintPreview && (
        <FacilityDocumentPrintModal
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          documentType={documentType}
          handoverData={handoverData}
          parcelData={parcelData}
          lostFoundData={lostFoundData}
        />
      )}
    </>
  );
};

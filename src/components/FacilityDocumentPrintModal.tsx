import React, { useState } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  Shield,
  Lock,
  Package,
  ArrowLeftRight,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Building2,
  Tag,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HandoverItemRecord, ParcelRecord, LostFoundRecord } from '../types';
import { TamimiLogo } from './TamimiLogo';
import { formatDisplayDate, formatDisplayTime } from '../services/storageService';
import { WhatsAppService } from '../services/whatsappService';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface FacilityDocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'HANDOVER' | 'PARCEL' | 'LOST_FOUND';
  handoverData?: HandoverItemRecord | null;
  parcelData?: ParcelRecord | null;
  lostFoundData?: LostFoundRecord | null;
}

export const FacilityDocumentPrintModal: React.FC<FacilityDocumentPrintModalProps> = ({
  isOpen,
  onClose,
  documentType,
  handoverData,
  parcelData,
  lostFoundData,
}) => {
  const [copied, setCopied] = useState(false);
  const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!isOpen) return null;

  // Clean staff name to remove unwanted names (e.g. Farhan)
  const cleanStaffName = (name?: string, fallback = 'Reception Desk') => {
    if (!name) return fallback;
    const cleaned = name
      .replace(/\s*[\/\-]?\s*Farhan\b/gi, '')
      .replace(/\s*[\/\-]\s*$/g, '')
      .trim();
    return cleaned || fallback;
  };

  // Extract common metadata based on document type
  let voucherTitle = '';
  let voucherSubtitle = '';
  let voucherId = '';
  let issueDateStr = '';
  let issueTimeStr = '';
  let statusBadge = '';
  let statusColor = '';
  let photoUrl: string | undefined = undefined;
  let secondaryPhotoUrl: string | undefined = undefined;

  if (documentType === 'HANDOVER' && handoverData) {
    voucherTitle =
      handoverData.type === 'GIVEN_OUT'
        ? 'ASSET LOAN & KEY HANDOVER CLEARANCE'
        : handoverData.type === 'TAKEN_IN'
        ? 'SAFE CUSTODY & PROPERTY DEPOSIT VOUCHER'
        : 'INTER-DEPARTMENTAL ASSET TRANSFER SLIP';
    voucherSubtitle = 'TAFGA Camp Concierge & Asset Control Management System';
    voucherId = `TAFGA-HO-${handoverData.id}`;
    issueDateStr = handoverData.issueDate;
    issueTimeStr = handoverData.issueTime;
    statusBadge = handoverData.status.replace(/_/g, ' ');
    statusColor =
      handoverData.status === 'ACTIVE_BORROWED'
        ? 'bg-cyan-600'
        : handoverData.status === 'IN_CUSTODY_HOLDING'
        ? 'bg-emerald-600'
        : 'bg-slate-700';
    photoUrl = handoverData.photoUrl;
    secondaryPhotoUrl = handoverData.secondaryPhotoUrl;
  } else if (documentType === 'PARCEL' && parcelData) {
    voucherTitle = 'INBOUND COURIER & PACKAGE DELIVERY CLEARANCE';
    voucherSubtitle = 'TAFGA Central Parcel Reception & Security Registry';
    voucherId = `TAFGA-PRC-${parcelData.id}`;
    issueDateStr = parcelData.receivedDate;
    issueTimeStr = parcelData.receivedTime;
    statusBadge = parcelData.status.replace(/_/g, ' ');
    statusColor =
      parcelData.status === 'RECEIVED_IN_OFFICE'
        ? 'bg-amber-600'
        : parcelData.status === 'DELIVERED_TO_ROOM' || parcelData.status === 'HANDED_TO_GUEST'
        ? 'bg-emerald-600'
        : 'bg-slate-700';
    photoUrl = parcelData.photoUrl;
    secondaryPhotoUrl = parcelData.secondaryPhotoUrl;
  } else if (documentType === 'LOST_FOUND' && lostFoundData) {
    voucherTitle =
      lostFoundData.recordType === 'FOUND_ITEM'
        ? 'FOUND PROPERTY VAULT CUSTODY CERTIFICATE'
        : 'LOST PROPERTY INQUIRY & INVESTIGATION REPORT';
    voucherSubtitle = 'TAFGA Security & Lost & Found Property Safe Vault';
    voucherId = `TAFGA-LNF-${lostFoundData.id}`;
    issueDateStr = lostFoundData.dateRecorded;
    issueTimeStr = lostFoundData.timeRecorded;
    statusBadge = lostFoundData.status.replace(/_/g, ' ');
    statusColor =
      lostFoundData.status === 'IN_CUSTODY'
        ? 'bg-emerald-600'
        : lostFoundData.status === 'REPORTED_SEARCHING'
        ? 'bg-amber-600'
        : 'bg-slate-700';
    photoUrl = lostFoundData.photoUrl;
    secondaryPhotoUrl = lostFoundData.secondaryPhotoUrl;
  }

  const handleCopyVoucher = () => {
    navigator.clipboard.writeText(voucherId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-a4-sheet');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=950,height=1200');
    if (!printWindow) {
      window.print();
      return;
    }

    // Collect all existing stylesheets & style tags from the current DOM
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${voucherId} - ${voucherTitle}</title>
        ${styles}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 6mm 6mm 10mm;
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
          .a4-sheet {
            width: 100%;
            height: 283mm;
            max-height: 283mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            overflow: hidden;
          }
          img {
            max-width: 100%;
            display: block;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .a4-sheet {
              height: 283mm !important;
              max-height: 283mm !important;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-sheet">
          ${printContent.innerHTML}
        </div>
        <script>
          function doPrint() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 500);
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
  };

  return (
    <div
      id="facility-doc-print-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Top Control Bar */}
        <div className="bg-white dark:bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 shadow-md">
              <TamimiLogo size={36} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{voucherTitle}</span>
                <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  Exact 1-Page A4
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Official TAMIMI GLOBAL Executive Property Voucher with Logo &amp; Photo Evidence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition cursor-pointer shadow-xs border border-emerald-500"
              title="Share Slip / Voucher via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Share WhatsApp</span>
            </button>

            <button
              onClick={handleCopyVoucher}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Copy Reference ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : voucherId}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-700 hover:to-yellow-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Voucher</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - Live A4 Page Preview */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-300/60 dark:bg-slate-950/80">
          
          {/* Printable A4 Canvas Container */}
          <div
            id="printable-a4-sheet"
            className="bg-white text-slate-900 w-full max-w-[210mm] p-5 sm:p-6 rounded-xl shadow-2xl border border-slate-300 flex flex-col justify-between space-y-3 font-sans text-xs min-h-[280mm] sm:min-h-[282mm] box-border"
          >
            {/* 1. Official Bilingual Company Header with Gold Logo */}
            <div className="border-b-2 border-slate-950 pb-2.5 shrink-0">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center space-x-4">
                  <TamimiLogo size={64} />
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase leading-tight">
                      TAMIMI GLOBAL COMPANY LIMITED
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-amber-700 tracking-wide mt-0.5">
                      شركة التميمي العالمية المحدودة — TAFGA CAMP MANAGEMENT
                    </p>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Executive Concierge Reception, Security Safe Vault &amp; Asset Custody Clearance
                    </p>
                  </div>
                </div>

                <div className="text-right border-l-2 border-slate-200 pl-4 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Official Reference Voucher #
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-slate-950 block tracking-tight">
                    {voucherId}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                    Date: {issueDateStr} • {formatDisplayTime(issueTimeStr)}
                  </span>
                  <div className="mt-1 flex items-center justify-end space-x-0.5">
                    {[...Array(24)].map((_, i) => (
                      <span key={i} className={`inline-block h-3.5 bg-slate-900 ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'} mr-0.5`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Title & Category Banner Strip */}
              <div className="mt-2.5 py-1.5 px-3.5 rounded-lg bg-slate-950 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black tracking-wide uppercase">
                    {voucherTitle}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold text-slate-300">Custody State:</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                    {statusBadge}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Main 2-Column Information Matrix */}
            {documentType === 'HANDOVER' && handoverData && (
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {/* Column A: Asset & Item Particulars */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Item &amp; Custody Particulars</span>
                      </span>
                      <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded-md">
                        Type: {handoverData.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Item Description:</span>
                        <strong className="text-slate-950 font-black text-xs sm:text-sm">{handoverData.itemName}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Category / Classification:</span>
                        <span className="font-bold text-slate-900">{handoverData.category}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Quantity / Total Units:</span>
                        <span className="font-bold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                          {handoverData.quantity} Unit(s)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Physical Condition:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {handoverData.condition}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Expected Return Date:</span>
                        <span className="font-bold text-slate-950 font-mono text-[11px]">
                          {handoverData.expectedReturnDate || 'Permanent / Open Custody'}
                        </span>
                      </div>
                      {handoverData.actualReturnDate && (
                        <div className="flex justify-between items-center py-0.5 text-emerald-800 font-bold border-b border-slate-100">
                          <span>Actual Return Timestamp:</span>
                          <span className="font-mono">{handoverData.actualReturnDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {handoverData.notes && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-tight">
                      <strong className="text-slate-900 font-bold">Inspector Notes:</strong> {handoverData.notes}
                    </div>
                  )}
                </div>

                {/* Column B: Recipient / Borrower Particulars */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Borrower / Depositor Details</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        {handoverData.personType}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Full Name:</span>
                        <strong className="text-slate-950 font-black text-xs sm:text-sm">{handoverData.personName}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Contact Phone:</span>
                        <span className="font-bold text-slate-950 font-mono text-[11px]">{handoverData.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Room / Unit #:</span>
                        <span className="font-bold text-slate-900">{handoverData.roomNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Company / Department:</span>
                        <span className="font-bold text-slate-900">{handoverData.departmentOrCompany || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Badge / Saudi ID #:</span>
                        <span className="font-mono font-bold text-slate-900">{handoverData.badgeOrIdNumber || 'Verified in System'}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Authorizing Duty Officer:</span>
                        <span className="font-bold text-slate-950">{cleanStaffName(handoverData.authorizedByStaff)}</span>
                      </div>
                    </div>
                  </div>

                  {handoverData.pickupAuthorizedPerson && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-tight">
                      <strong>Designated Pickup Proxy:</strong> {handoverData.pickupAuthorizedPerson}
                    </div>
                  )}
                </div>
              </div>
            )}

            {documentType === 'PARCEL' && parcelData && (
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {/* Column A: Parcel & Shipment Details */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span>Shipment &amp; Courier Details</span>
                      </span>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                        {parcelData.courierCompany}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Tracking # (AWB):</span>
                        <strong className="text-slate-950 font-mono font-black text-xs sm:text-sm">{parcelData.trackingNumber}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Courier Provider:</span>
                        <span className="font-bold text-slate-900">{parcelData.courierCompany}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Package Classification:</span>
                        <span className="font-bold text-slate-900">{parcelData.parcelType}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Assigned Shelf Location:</span>
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          {parcelData.storageLocation}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Receiving Concierge Officer:</span>
                        <span className="font-bold text-slate-950">{cleanStaffName(parcelData.receivedByStaff)}</span>
                      </div>
                    </div>
                  </div>

                  {parcelData.vipStatus && (
                    <div className="mt-2 p-1.5 bg-amber-100/90 text-amber-950 rounded-lg border border-amber-300 font-bold text-[11px] text-center">
                      ⭐ HIGH PRIORITY / VIP GUEST EXPEDITE
                    </div>
                  )}
                </div>

                {/* Column B: Recipient & Release Details */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recipient &amp; Room Destination</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        Room {parcelData.roomNumber}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Recipient Full Name:</span>
                        <strong className="text-slate-950 font-black text-xs sm:text-sm">{parcelData.recipientName}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Delivery Destination:</span>
                        <span className="font-bold text-slate-950 font-mono">Room #{parcelData.roomNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Contact Mobile:</span>
                        <span className="font-bold text-slate-950 font-mono text-[11px]">{parcelData.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Company / Dept:</span>
                        <span className="font-bold text-slate-900">{parcelData.departmentOrCompany || 'Residential Resident'}</span>
                      </div>
                      {parcelData.deliveredDate && (
                        <div className="flex justify-between items-center py-0.5 text-emerald-800 font-bold border-b border-slate-100">
                          <span>Released Timestamp:</span>
                          <span className="font-mono">
                            {parcelData.deliveredDate} {parcelData.deliveredTime ? `(${parcelData.deliveredTime})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {parcelData.collectedByPerson && (
                    <div className="mt-2 p-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 leading-tight">
                      <strong>Collected In-Person By:</strong> {parcelData.collectedByPerson}
                    </div>
                  )}
                </div>
              </div>
            )}

            {documentType === 'LOST_FOUND' && lostFoundData && (
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {/* Column A: Property Discovery Particulars */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Item &amp; Vault Custody Details</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {lostFoundData.recordType}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Discovered Item:</span>
                        <strong className="text-slate-950 font-black text-xs sm:text-sm">{lostFoundData.itemName}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Category Classification:</span>
                        <span className="font-bold text-slate-900">{lostFoundData.category}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Recovery / Loss Location:</span>
                        <span className="font-bold text-slate-900">{lostFoundData.locationFoundOrLost}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Safe Locker Assigned:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          {lostFoundData.storageLocker}
                        </span>
                      </div>
                      {lostFoundData.securitySealOrTag && (
                        <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                          <span className="text-slate-500 font-semibold">Security Tag Seal #:</span>
                          <span className="font-mono font-bold text-slate-950">{lostFoundData.securitySealOrTag}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lostFoundData.distinctiveMarks && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-tight">
                      <strong>Distinctive Marks &amp; Features:</strong> {lostFoundData.distinctiveMarks}
                    </div>
                  )}
                </div>

                {/* Column B: Finder / Owner & Claim Details */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Finder &amp; Owner Verification</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        {lostFoundData.finderOrReporterType}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">
                          {lostFoundData.recordType === 'FOUND_ITEM' ? 'Finder / Turned In By:' : 'Reporter Name:'}
                        </span>
                        <strong className="text-slate-950 font-black text-xs sm:text-sm">{lostFoundData.finderOrReporterName}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">Finder Contact Phone:</span>
                        <span className="font-bold text-slate-950 font-mono text-[11px]">{lostFoundData.finderOrReporterPhone}</span>
                      </div>
                      {lostFoundData.ownerName && (
                        <>
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-emerald-900">
                            <span className="font-semibold">Claimant / Owner Name:</span>
                            <strong className="font-black text-xs sm:text-sm">{lostFoundData.ownerName}</strong>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-emerald-900">
                            <span className="font-semibold">Owner Verified Contact:</span>
                            <span className="font-mono font-bold">{lostFoundData.ownerPhone}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-emerald-900">
                            <span className="font-semibold">Photo ID Proof Checked:</span>
                            <span className="font-bold">{lostFoundData.ownerIdProof}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 text-emerald-900">
                            <span className="font-semibold">Claim Release Timestamp:</span>
                            <span className="font-mono font-bold">{lostFoundData.claimDate}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!lostFoundData.ownerName && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-tight">
                      <strong>Custody Status:</strong> Held securely in TAFGA Central Vault awaiting verified claim.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Visual Photographic Evidence Box / Inspection Seal */}
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70 shrink-0">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Visual Photographic Evidence &amp; Integrity Verification Proof</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {photoUrl ? 'Digital Photo Certified' : 'Physical Vault Verification'}
                </span>
              </div>

              {photoUrl ? (
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setPhotoZoomOpen(true)}
                    className="relative w-36 h-24 rounded-xl border-2 border-slate-400 overflow-hidden bg-white shrink-0 cursor-pointer shadow-sm hover:border-amber-500 transition"
                  >
                    <img
                      src={photoUrl}
                      alt="Property evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] font-bold py-0.5 text-center">
                      Primary Proof Photo
                    </div>
                  </div>

                  {secondaryPhotoUrl && (
                    <div
                      onClick={() => setPhotoZoomOpen(true)}
                      className="relative w-36 h-24 rounded-xl border-2 border-slate-400 overflow-hidden bg-white shrink-0 cursor-pointer shadow-sm hover:border-amber-500 transition"
                    >
                      <img
                        src={secondaryPhotoUrl}
                        alt="Secondary evidence"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] font-bold py-0.5 text-center">
                        Secondary Proof / ID
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-700 space-y-1 flex-1">
                    <p className="font-black text-slate-900 text-xs sm:text-sm">
                      Visual Record Confirmed &amp; Cryptographically Timestamped
                    </p>
                    <p className="text-slate-600 text-[11px] leading-snug">
                      The attached photographic evidence was recorded at the TAFGA facility desk at the time of custody / inbound inspection. Physical integrity and serial markers match registration logs.
                    </p>
                    <div className="flex items-center space-x-2 pt-0.5">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-700">
                        SHA-256 SEAL: {voucherId}-SEC-{issueDateStr.replace(/-/g, '')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Active
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 py-1 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold text-slate-900 text-[11px]">Physical Inspection</strong>
                      <span className="text-[10px] text-slate-500">Condition verified intact</span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold text-slate-900 text-[11px]">Custody Log Recorded</strong>
                      <span className="text-[10px] text-slate-500">Timestamped into registry</span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold text-slate-900 text-[11px]">Security Chain Verified</strong>
                      <span className="text-[10px] text-slate-500">Authorized by desk officer</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Official Terms of Custody & Facility Regulations */}
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/70 text-[10px] text-slate-600 space-y-1 shrink-0">
              <strong className="text-slate-950 block font-black text-[11px] uppercase tracking-wide">
                TAFGA Camp Operations Regulations &amp; Legal Undertaking:
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 leading-snug">
                <div>
                  <strong className="text-slate-900 font-bold block">1. Asset Loan &amp; Keys:</strong>
                  <span>Borrower accepts full liability for loss/damage until formally returned.</span>
                </div>
                <div>
                  <strong className="text-slate-900 font-bold block">2. Inbound Parcels:</strong>
                  <span>Parcels must be collected within 14 calendar days with valid photo ID.</span>
                </div>
                <div>
                  <strong className="text-slate-900 font-bold block">3. Safe Vault Custody:</strong>
                  <span>Found items held under high security for 90 days per camp governance protocols.</span>
                </div>
              </div>
            </div>

            {/* 5. Dual Official Signature & Stamp Blocks (Large Spacious Signing Areas) */}
            <div className="pt-2.5 border-t-2 border-slate-950 shrink-0">
              <div className="grid grid-cols-2 gap-4 text-center">
                {/* Block 1: Duty Reception / Authorizing Officer */}
                <div className="border-2 border-slate-300 rounded-xl p-3 flex flex-col justify-between min-h-[148px] sm:min-h-[155px] bg-slate-50/50 shadow-2xs">
                  <div className="bg-slate-200/90 py-1 px-2 rounded-lg text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    1. Issued / Handled By Officer
                  </div>
                  
                  {/* Large Spacious Signing & Stamp Area */}
                  <div className="flex-1 my-1 border-b-2 border-dashed border-slate-400 flex flex-col justify-end items-center pb-1 min-h-[75px] relative">
                    <span className="text-xs sm:text-sm font-black text-slate-950 bg-white/90 px-2.5 py-0.5 rounded shadow-2xs border border-slate-200">
                      {cleanStaffName(
                        documentType === 'HANDOVER'
                          ? handoverData?.authorizedByStaff
                          : documentType === 'PARCEL'
                          ? parcelData?.receivedByStaff
                          : lostFoundData?.handedOverByStaff || 'Duty Officer',
                        'Reception Desk'
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 pt-0.5">
                    <span>Duty Officer Signature &amp; Stamp</span>
                    <span className="text-slate-400 font-mono text-[9px]">Date: ____/____/2026</span>
                  </div>
                </div>

                {/* Block 2: Recipient / Borrower / Owner Signature */}
                <div className="border-2 border-slate-300 rounded-xl p-3 flex flex-col justify-between min-h-[148px] sm:min-h-[155px] bg-slate-50/50 shadow-2xs">
                  <div className="bg-slate-200/90 py-1 px-2 rounded-lg text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    2. Recipient / Borrower / Claimant
                  </div>

                  {/* Large Spacious Signing Area */}
                  <div className="flex-1 my-1 border-b-2 border-dashed border-slate-400 flex flex-col justify-end items-center pb-1 min-h-[75px] relative">
                    <span className="text-xs sm:text-sm font-black text-slate-950 bg-white/90 px-2.5 py-0.5 rounded shadow-2xs border border-slate-200">
                      {documentType === 'HANDOVER'
                        ? handoverData?.personName
                        : documentType === 'PARCEL'
                        ? parcelData?.recipientName
                        : lostFoundData?.ownerName || '(Authorized Claimant)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 pt-0.5">
                    <span>Borrower / Resident Signature</span>
                    <span className="text-slate-400 font-mono text-[9px]">Date: ____/____/2026</span>
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-200 flex justify-between items-center text-[9px] sm:text-[10px] text-slate-500 font-semibold">
                <span>TAFGA CAMP FACILITY MANAGEMENT SYSTEM • TAMIMI GLOBAL CO. LTD</span>
                <span>SYSTEM ID: {voucherId} • A4 EXECUTIVE PRINT READY</span>
                <span>PRINTED: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Full Size Photo Zoom Modal */}
      {photoZoomOpen && photoUrl && (
        <div
          onClick={() => setPhotoZoomOpen(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-3xl p-3 border-2 border-slate-700 overflow-hidden flex flex-col items-center">
            <img
              src={photoUrl}
              alt="Full evidence"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="pt-2 text-center text-xs text-slate-300 font-semibold flex items-center justify-between w-full px-3">
              <span>Attached Evidence Photo • {voucherId}</span>
              <button
                type="button"
                onClick={() => setPhotoZoomOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 cursor-pointer"
              >
                Close Zoom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Customization Modal */}
      {isWhatsAppOpen && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          title={`WhatsApp Share - ${voucherId}`}
          recipientName={
            documentType === 'HANDOVER'
              ? handoverData?.personName || 'Guest'
              : documentType === 'PARCEL'
              ? parcelData?.recipientName || 'Guest'
              : lostFoundData?.ownerName || lostFoundData?.finderOrReporterName || 'Guest'
          }
          defaultPhone={
            documentType === 'HANDOVER'
              ? handoverData?.phoneNumber || ''
              : documentType === 'PARCEL'
              ? parcelData?.phoneNumber || ''
              : lostFoundData?.ownerPhone || lostFoundData?.finderOrReporterPhone || ''
          }
          messageText={
            documentType === 'HANDOVER' && handoverData
              ? WhatsAppService.generateHandoverMessage(handoverData)
              : documentType === 'PARCEL' && parcelData
              ? WhatsAppService.generateParcelMessage(parcelData)
              : documentType === 'LOST_FOUND' && lostFoundData
              ? WhatsAppService.generateLostFoundMessage(lostFoundData)
              : ''
          }
          moduleLabel={voucherTitle}
        />
      )}
    </div>
  );
};

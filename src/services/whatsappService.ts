import { Booking, ParcelRecord, HandoverItemRecord, LostFoundRecord, IsolationRoomRecord, BedOccupant } from '../types';
import { formatDisplayDate, formatDisplayTime } from './storageService';

/**
 * Enterprise WhatsApp Direct Notification Service
 * Allows instantaneous dispatch of formatted passes, receipts, and vouchers
 * directly to any WhatsApp number worldwide without needing to save the contact in the phonebook.
 */

/**
 * Formats raw phone numbers to clean international format required by wa.me (digits only without + or symbols)
 * Automatically handles Saudi mobile format (05xxxxxxxx -> 9665xxxxxxxx), Bangladesh format (01xxxxxxxxx -> 8801xxxxxxxxx),
 * and standard international number cleaning.
 */
export function cleanWhatsAppNumber(rawPhone?: string): string {
  if (!rawPhone) return '';
  // Remove all non-numeric characters except leading '+'
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.\,\/]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle leading 00 international prefix
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Handle Saudi local formats: 05xxxxxxxx (10 digits) -> 9665xxxxxxxx
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5') && (cleaned.length === 9 || cleaned.length === 10)) {
    cleaned = '966' + cleaned;
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    // Bangladesh local format: 01xxxxxxxxx -> 8801xxxxxxxxx
    cleaned = '880' + cleaned.substring(1);
  }

  return cleaned.replace(/[^0-9]/g, '');
}

/**
 * Strips country code (+966, 00966, 966, 05) so Saudi numbers strictly start with 5
 */
export function stripToSaudiLocal(rawPhone?: string): string {
  if (!rawPhone) return '';
  let str = String(rawPhone).trim();
  let digits = str.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('966')) digits = digits.slice(3);
  if (digits.startsWith('05')) digits = digits.slice(1);
  else if (digits.startsWith('0') && digits.length >= 10 && digits[1] === '5') digits = digits.slice(1);
  if (digits.startsWith('5')) return digits;
  return digits || str;
}

/**
 * Generates direct wa.me / api.whatsapp.com URL
 */
export function getWhatsAppDirectUrl(rawPhone: string, message: string): string {
  const phone = cleanWhatsAppNumber(rawPhone);
  const encodedText = encodeURIComponent(message);
  if (!phone) {
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
}

/**
 * Direct safe launch of WhatsApp web/mobile
 * NEVER replaces window.location.href to avoid iframe / history destruction and blank screens
 */
export function openWhatsAppDirect(rawPhone: string, message: string): boolean {
  const url = getWhatsAppDirectUrl(rawPhone, message);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 300);
    return true;
  } catch (e) {
    console.warn('Anchor dispatch failed, falling back to window.open:', e);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch (winErr) {
      console.error('Failed to open WhatsApp window safely:', winErr);
      return false;
    }
  }
}

/**
 * Direct launch of WhatsApp Contact / Chat picker to share with ANYONE
 */
export function openWhatsAppShareAnyone(message: string): boolean {
  return openWhatsAppDirect('', message);
}

/**
 * Deterministic security authentication key for digital passes.
 * Generated algorithmically from booking details so it cannot be casually typed or faked.
 */
export function generateSecurityAuthToken(bookingId: string, date: string, phone: string): string {
  let hash = 0x811c9dc5;
  const str = `${bookingId || ''}|${date || ''}|${phone || ''}|TAMIMI_TAFGA_2026`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `TG-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export const WhatsAppService = {
  cleanNumber: cleanWhatsAppNumber,
  getUrl: getWhatsAppDirectUrl,
  open: openWhatsAppDirect,
  shareAnyone: openWhatsAppShareAnyone,
  generateSecurityAuthToken,

  /**
   * 1. Facility Booking WhatsApp Notification (Compact, Unique Digital Pass)
   * Designed to be tamper-evident, concise, and unforgeable via normal keyboard typing.
   */
  generateBookingMessage(booking: Booking): string {
    const formattedDate = formatDisplayDate(booking.date);
    const timeFormatted = `${formatDisplayTime(booking.startTime)} – ${formatDisplayTime(booking.endTime)}`;
    const authToken = generateSecurityAuthToken(booking.id, booking.date, booking.phoneNumber);
    const noteLine = booking.notes?.trim() ? `  NOTE    : ${booking.notes.trim()}\n` : '';

    return `🎫 *TAMIMI GLOBAL • DIGITAL PASS*
\`\`\`
┌──────────────────────────────┐
  PASS ID : #${booking.id}
  STATUS  : CONFIRMED [VERIFIED]
  ────────────────────────────
  FACILITY: ${booking.facilityName}
  STAGE   : ${booking.stage}
  GUEST   : ${booking.customerName}
  PHONE   : ${booking.phoneNumber}
  DATE    : ${formattedDate}
  TIME    : ${timeFormatted}
${noteLine}  ────────────────────────────
  AUTH-KEY: ${authToken}-OK
└──────────────────────────────┘
\`\`\``;
  },

  /**
   * 2. Recurring / Batch Booking WhatsApp Notification (Compact Master Schedule Pass)
   */
  generateBatchBookingMessage(bookings: Booking[]): string {
    if (!bookings || bookings.length === 0) return '';
    const first = bookings[0];
    const masterId = first.recurringGroupId || first.id;
    const authToken = generateSecurityAuthToken(masterId, first.date, first.phoneNumber);
    const sessions = bookings
      .slice(0, 10)
      .map(
        (b, i) =>
          `  ${String(i + 1).padStart(2, ' ')}. ${formatDisplayDate(b.date, { short: true })} | ${formatDisplayTime(b.startTime)}-${formatDisplayTime(b.endTime)}`
      )
      .join('\n');
    const extra = bookings.length > 10 ? `\n  ... +${bookings.length - 10} more sessions` : '';

    return `🎫 *TAMIMI GLOBAL • MASTER PASS*
\`\`\`
┌──────────────────────────────┐
  REF ID  : #${masterId}
  STATUS  : ${bookings.length} SESSIONS CONFIRMED
  ────────────────────────────
  FACILITY: ${first.facilityName}
  STAGE   : ${first.stage}
  GUEST   : ${first.customerName}
  PHONE   : ${first.phoneNumber}
  ────────────────────────────
  SCHEDULE:
${sessions}${extra}
  ────────────────────────────
  AUTH-KEY: ${authToken}-MASTER
└──────────────────────────────┘
\`\`\``;
  },

  /**
   * 3. Parcel / Courier WhatsApp Notification
   */
  generateParcelMessage(parcel: ParcelRecord): string {
    const isDelivered =
      parcel.status === 'HANDED_TO_GUEST' ||
      parcel.status === 'DELIVERED_TO_ROOM' ||
      parcel.status === 'COLLECTED_BY_REP';

    const statusHeader = isDelivered ? '✅ PARCEL COLLECTED / DELIVERED' : '📦 PARCEL ARRIVAL - READY FOR PICKUP';

    return `📦 *TAMIMI RECEPTION & PARCEL NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
${statusHeader}
📄 *Record ID:* #${parcel.id}
🔖 *AWB / Tracking #:* ${parcel.trackingNumber}
🚚 *Courier / Carrier:* ${parcel.courierCompany}
👤 *Recipient Name:* ${parcel.recipientName}
🏢 *Room / Unit:* Room ${parcel.roomNumber}
${parcel.departmentOrCompany ? `🏛️ *Company / Dept:* ${parcel.departmentOrCompany}\n` : ''}📦 *Package Type:* ${parcel.parcelType}
📍 *Storage Location:* ${parcel.storageLocation}
📅 *Received Date:* ${parcel.receivedDate} at ${formatDisplayTime(parcel.receivedTime)}
${parcel.vipStatus ? '⭐ *Priority:* VIP Priority Delivery\n' : ''}${isDelivered && parcel.deliveredDate ? `🕒 *Delivered On:* ${parcel.deliveredDate} ${formatDisplayTime(parcel.deliveredTime || '')}\n` : ''}${parcel.notes ? `📝 *Notes:* ${parcel.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
📌 *COLLECTION INSTRUCTIONS:*
• Please collect your parcel from the *Main Reception & Helpdesk*.
• Kindly present your Staff ID / Room Key to receive your shipment.

_Tamimi Global Camp Services_`;
  },

  /**
   * 4. Asset / Key Handover WhatsApp Notification
   */
  generateHandoverMessage(handover: HandoverItemRecord): string {
    const isReturned = handover.status === 'RETURNED' || handover.status === 'CLAIMED_PICKED_UP';
    const statusHeader = isReturned ? '✅ ASSET / KEY RETURNED & CLEARED' : '🔑 ASSET & KEY HANDOVER PASS';

    return `🔑 *TAMIMI CUSTODY & HANDOVER NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
${statusHeader}
📄 *Handover Ref:* #${handover.id}
🏷️ *Asset / Item:* ${handover.itemName} (Qty: ${handover.quantity})
📂 *Category:* ${handover.category}
👤 *Issued To:* ${handover.personName} (${handover.personType})
${handover.roomNumber ? `🏢 *Room / Unit:* Room ${handover.roomNumber}\n` : ''}${handover.departmentOrCompany ? `🏛️ *Company / Dept:* ${handover.departmentOrCompany}\n` : ''}${handover.badgeOrIdNumber ? `🪪 *Badge / ID:* ${handover.badgeOrIdNumber}\n` : ''}📅 *Issue Date:* ${handover.issueDate} at ${formatDisplayTime(handover.issueTime)}
⏳ *Expected Return:* ${handover.expectedReturnDate || 'Open / End of Project'}
🛡️ *Item Condition:* ${handover.condition}
👨‍💼 *Authorized Staff:* ${handover.authorizedByStaff}
${isReturned && handover.actualReturnDate ? `🕒 *Actual Return Date:* ${handover.actualReturnDate}\n` : ''}${handover.notes ? `📝 *Notes:* ${handover.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
⚠️ *SAFETY NOTICE:*
• Keep camp assets safe. Return to Operations Desk upon task completion.

_Tamimi Global Asset Management_`;
  },

  /**
   * 5. Room & Isolation Admission WhatsApp Notification
   */
  generateRoomAdmissionMessage(room: IsolationRoomRecord, bedNum: 1 | 2 = 1, customOccupant?: BedOccupant): string {
    const occ = customOccupant || (room.occupants && room.occupants.find((o) => o.bedNumber === bedNum)) || {
      bedNumber: bedNum,
      patientName: room.patientName,
      company: room.company,
      phoneNumber: room.phoneNumber,
      checkIn: room.checkIn,
      checkOut: room.checkOut,
      bookingType: room.bookingType,
      purposeOfStay: room.purposeOfStay,
      staffNotes: room.staffNotes,
    };

    const isMedical = occ.bookingType === 'Medical Isolation';

    return `🏢 *TAMIMI RESIDENT & ROOM ADMISSION PASS*
━━━━━━━━━━━━━━━━━━━━━━
✅ *Status:* ADMISSION CONFIRMED
📄 *Room Ref:* ${room.buildingNumber} - Bed #${bedNum}
🏢 *Building:* ${room.building}
🚪 *Room Number:* Room ${room.buildingNumber}
🛏️ *Bed Assignment:* Twin Bed ${bedNum}
👤 *Resident / Guest:* ${occ.patientName}
${occ.phoneNumber ? `📞 *Phone:* ${occ.phoneNumber}\n` : ''}${occ.company ? `🏛️ *Company / Sponsor:* ${occ.company}\n` : ''}${occ.nationalId ? `🪪 *National ID / Iqama:* ${occ.nationalId}\n` : ''}📅 *Check-In Date:* ${occ.checkIn}
📅 *Check-Out Date:* ${occ.checkOut || 'Open / On Departure'}
🏷️ *Stay Category:* ${occ.bookingType || (isMedical ? 'Medical Isolation' : 'General Guest Stay')}
${occ.purposeOfStay ? `🎯 *Purpose:* ${occ.purposeOfStay}\n` : ''}${occ.hospitalReferral ? `🏥 *Medical Referral:* ${occ.hospitalReferral}\n` : ''}${occ.staffNotes ? `📝 *Staff Remarks:* ${occ.staffNotes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
📌 *CAMP INFORMATION:*
• Tamimi Global Camp Accommodation & Clinic
• For room maintenance or medical emergencies, contact 24/7 Operations.

_Tamimi Global Hospitality & Safety_`;
  },

  /**
   * 5b. Room Admission from Form Data Modal
   */
  generateRoomFormDataMessage(data: {
    roomCode: string;
    buildingName: string;
    bedNumberText: string;
    bookingType: string;
    patientName: string;
    company: string;
    phoneNumber?: string;
    nationalId?: string;
    checkIn: string;
    checkOut?: string;
    purposeOfStay?: string;
    hospitalReferral?: string;
    voucherId?: string;
  }): string {
    const isMedical = data.bookingType === 'Medical Isolation';
    return `🏢 *TAMIMI RESIDENT & ROOM ADMISSION PASS*
━━━━━━━━━━━━━━━━━━━━━━
✅ *Status:* ADMISSION CONFIRMED
📄 *Voucher Ref:* ${data.voucherId || `TAFGA-RM-${data.roomCode}`}
🏢 *Building:* ${data.buildingName}
🚪 *Room Number:* Room ${data.roomCode}
🛏️ *Bed Allocation:* ${data.bedNumberText}
👤 *Resident / Guest:* ${data.patientName}
${data.phoneNumber ? `📞 *Phone:* ${data.phoneNumber}\n` : ''}${data.company ? `🏛️ *Company / Sponsor:* ${data.company}\n` : ''}${data.nationalId ? `🪪 *National ID / Iqama:* ${data.nationalId}\n` : ''}📅 *Check-In Date:* ${data.checkIn}
📅 *Check-Out Date:* ${data.checkOut || 'Open / On Departure'}
🏷️ *Stay Category:* ${data.bookingType || (isMedical ? 'Medical Isolation' : 'General Guest Stay')}
${data.purposeOfStay ? `🎯 *Purpose:* ${data.purposeOfStay}\n` : ''}${data.hospitalReferral ? `🏥 *Medical Referral:* ${data.hospitalReferral}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
📌 *CAMP INFORMATION:*
• Tamimi Global Camp Accommodation & Clinic
• For room maintenance or medical emergencies, contact 24/7 Operations.

_Tamimi Global Hospitality & Safety_`;
  },

  /**
   * 6. Lost & Found WhatsApp Notification
   */
  generateLostFoundMessage(record: LostFoundRecord): string {
    const isReturned = record.status === 'RETURNED_TO_OWNER';
    const isFound = record.recordType === 'FOUND_ITEM';

    return `🔍 *TAMIMI LOST & FOUND NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
${isReturned ? '✅ ITEM RETURNED TO OWNER' : isFound ? '🔒 FOUND ITEM LOGGED IN SECURITY VAULT' : '📋 LOST ITEM INQUIRY REGISTERED'}
📄 *Report Ref:* #${record.id}
🏷️ *Item Name:* ${record.itemName}
📂 *Category:* ${record.category}
📍 *Location Found / Lost:* ${record.locationFoundOrLost}
📅 *Date Recorded:* ${record.dateRecorded} at ${formatDisplayTime(record.timeRecorded)}
👤 *Reported By:* ${record.finderOrReporterName} (${record.finderOrReporterPhone})
🔒 *Vault Storage Locker:* ${record.storageLocker}
${record.securitySealOrTag ? `🏷️ *Security Seal:* ${record.securitySealOrTag}\n` : ''}${record.distinctiveMarks ? `✨ *Distinctive Marks:* ${record.distinctiveMarks}\n` : ''}${record.ownerName ? `👤 *Claimant / Owner:* ${record.ownerName} (${record.ownerPhone || '-'})\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
📌 *CLAIM & INQUIRY HELP:*
• Visit the Camp Security Desk to claim verified items.

_Tamimi Global Security & Operations_`;
  },

  /**
   * 7. Room Checkout & Key Clearance Notification
   */
  generateRoomCheckoutMessage(roomCode: string, guestName: string, bedNumberText: string, departureDate: string, notes?: string): string {
    return `🏢 *TAMIMI RESIDENTIAL CHECKOUT & CLEARANCE PASS*
━━━━━━━━━━━━━━━━━━━━━━
✅ *Status:* CHECKOUT & KEY RETURN COMPLETED
🚪 *Room Number:* Room ${roomCode}
🛏️ *Bed Released:* ${bedNumberText}
👤 *Resident / Guest:* ${guestName}
📅 *Departure Date:* ${departureDate}
🔑 *Key Card Status:* Returned & Reconciled
${notes ? `📝 *Remarks:* ${notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━
📌 *CLEARANCE NOTICE:*
• Room inventory and key card have been safely surrendered to Reception.
• Thank you for staying at Tamimi Global Accommodation.

_Tamimi Global Camp Management_`;
  },
};

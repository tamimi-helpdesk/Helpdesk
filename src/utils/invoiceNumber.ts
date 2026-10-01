import { InvoiceType, UnifiedInvoiceRecord } from '../types/invoice';

/**
 * Prefix mapping for invoice types
 */
const TYPE_PREFIX_MAP: Record<InvoiceType, string> = {
  MISSING_ITEMS: 'MI',
  DAMAGE_REPAIR: 'DMG',
  KEY_REPLACEMENT: 'KEY',
  ACCOMMODATION_UTILITY: 'ACC',
  CATERING_MESS: 'CAT',
  LAUNDRY_LINEN: 'LND',
  FACILITY_POS: 'POS',
};

/**
 * Format a Date object or YYYY-MM-DD string into YYYYMMDD
 */
export function formatDateCompact(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generate a guaranteed unique, daily sequential invoice number.
 * Format: INV-{TYPE_CODE}-{YYYYMMDD}-{SEQ}
 * Example: INV-MI-20260901-001
 */
export function generateDailyUniqueInvoiceNumber(
  type: InvoiceType,
  dateString?: string,
  existingInvoices: UnifiedInvoiceRecord[] = []
): string {
  const typeCode = TYPE_PREFIX_MAP[type] || 'GEN';
  const dateCompact = formatDateCompact(dateString);
  const prefixPattern = `INV-${typeCode}-${dateCompact}-`;

  // Find all existing invoices matching today's prefix pattern
  let maxSeq = 0;
  existingInvoices.forEach((inv) => {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefixPattern)) {
      const suffix = inv.invoiceNumber.replace(prefixPattern, '');
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefixPattern}${nextSeq}`;
}

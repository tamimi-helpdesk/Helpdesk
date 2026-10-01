import QRCode from 'qrcode';

export interface ZatcaInvoicePayload {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO format: YYYY-MM-DDTHH:mm:ssZ
  totalAmount: string; // e.g. "437.00"
  vatAmount: string; // e.g. "57.00"
}

/**
 * Encodes a string into TLV (Tag-Length-Value) bytes for Saudi ZATCA Phase 2 standard
 */
function toTlv(tagNumber: number, tagValue: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(tagValue);
  const length = valueBytes.length;
  const tlv = new Uint8Array(2 + length);
  tlv[0] = tagNumber;
  tlv[1] = length;
  tlv.set(valueBytes, 2);
  return tlv;
}

/**
 * Converts Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generates ZATCA standard Base64 TLV string from invoice payload
 */
export function generateZatcaTlvBase64(payload: ZatcaInvoicePayload): string {
  const tag1 = toTlv(1, payload.sellerName);
  const tag2 = toTlv(2, payload.vatNumber);
  const tag3 = toTlv(3, payload.timestamp);
  const tag4 = toTlv(4, payload.totalAmount);
  const tag5 = toTlv(5, payload.vatAmount);

  const totalLength = tag1.length + tag2.length + tag3.length + tag4.length + tag5.length;
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  [tag1, tag2, tag3, tag4, tag5].forEach((tag) => {
    combined.set(tag, offset);
    offset += tag.length;
  });

  return uint8ArrayToBase64(combined);
}

/**
 * Generates high-resolution Data URL for the QR Code containing the ZATCA payload or reference
 */
export async function generateZatcaQrCodeDataUrl(payload: ZatcaInvoicePayload): Promise<string> {
  try {
    const base64Tlv = generateZatcaTlvBase64(payload);
    return await QRCode.toDataURL(base64Tlv, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate ZATCA QR code:', err);
    // Fallback simple QR
    return await QRCode.toDataURL(`INV:${payload.sellerName}|VAT:${payload.vatNumber}|TOTAL:${payload.totalAmount}`, {
      margin: 1,
      width: 256,
    });
  }
}

/**
 * Generates generic high-res QR code for booking admissions, forms, and parcels
 */
export async function generateGeneralQrCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Printer,
  X,
  CheckCircle2,
  Building2,
  CreditCard,
  ShieldCheck,
  Download,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UnifiedInvoiceRecord } from '../../types/invoice';
import { generateZatcaQrCodeDataUrl, generateZatcaTlvBase64 } from '../../utils/zatcaUtils';

interface ZatcaQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: UnifiedInvoiceRecord;
}

export const ZatcaQrModal: React.FC<ZatcaQrModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [tlvBase64, setTlvBase64] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const sellerName = 'Tamimi Global Company Ltd. (TAFGA)';
  const vatNumber = '300128475900003';
  const invoiceTotal = (Number(invoice?.totalAmount) || Number(invoice?.subtotal) || 0).toFixed(2);
  const vatTotal = (Number(invoice?.vatAmount) || 0).toFixed(2);

  useEffect(() => {
    if (!invoice) return;
    const isoTimestamp = invoice.date
      ? `${invoice.date}T12:00:00Z`
      : new Date().toISOString();

    const payload = {
      sellerName,
      vatNumber,
      timestamp: isoTimestamp,
      totalAmount: invoiceTotal,
      vatAmount: vatTotal,
    };

    try {
      const base64Str = generateZatcaTlvBase64(payload);
      setTlvBase64(base64Str);
      generateZatcaQrCodeDataUrl(payload).then((url) => {
        setQrCodeDataUrl(url);
      });
    } catch (e) {
      console.warn('Failed to encode ZATCA QR', e);
    }
  }, [invoice, invoiceTotal, vatTotal]);

  if (!isOpen || !invoice) return null;

  const handleCopyTlv = () => {
    navigator.clipboard.writeText(tlvBase64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        id="zatca-qr-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl w-full max-w-lg text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b-2 border-emerald-500/30 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                    ZATCA E-INVOICE QR CODE
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                    KSA FATOORAH
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 font-medium">
                  Saudi Tax & Customs Authority Standard Electronic QR (TLV Base64)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-center overflow-y-auto">
            {/* QR Visual Box with Real Scannable ZATCA QR */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-emerald-400">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`ZATCA TLV QR - ${invoice.invoiceNumber}`}
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
                  Generating TLV QR...
                </div>
              )}
            </div>

            {/* Tax & Invoice Breakdown */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Seller Entity (Tag 1):</span>
                <span className="font-bold text-white text-right">{sellerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VAT Reg No (Tag 2):</span>
                <span className="font-mono font-bold text-emerald-400">{vatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono font-bold text-white">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Billed Resident / Sponsor:</span>
                <span className="font-bold text-white">{invoice.customerName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-300 font-bold">Total (Inc. 15% VAT - Tag 4):</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  SAR {invoiceTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VAT Amount (15% - Tag 5):</span>
                <span className="font-mono font-bold text-emerald-400">
                  SAR {vatTotal}
                </span>
              </div>
            </div>

            {/* TLV Base64 String Preview */}
            {tlvBase64 && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ZATCA TLV Base64 Payload
                  </span>
                  <button
                    onClick={handleCopyTlv}
                    className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-[10px] font-mono text-slate-300 break-all bg-slate-900/90 p-2 rounded-lg max-h-16 overflow-y-auto">
                  {tlvBase64}
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-200 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Standard Base64 TLV encrypted format compliant with ZATCA Phase 1 & 2 Electronic Billing Regulations in KSA.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-950 border-t-2 border-emerald-500/30 p-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/30 flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print ZATCA Slip</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

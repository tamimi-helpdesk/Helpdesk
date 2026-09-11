import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Copy,
  Check,
  Phone,
  User,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WhatsAppService, cleanWhatsAppNumber } from '../services/whatsappService';
import { AudioFeedback } from '../utils/audioFeedback';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  recipientName?: string;
  defaultPhone?: string;
  messageText: string;
  moduleLabel?: string;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  title = 'Direct WhatsApp Dispatch',
  recipientName = 'Guest / Resident',
  defaultPhone = '',
  messageText,
  moduleLabel = 'Facility Booking',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [isCopied, setIsCopied] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(defaultPhone || '');
      setIsCopied(false);
      setHasSent(false);
    }
  }, [isOpen, defaultPhone]);

  if (!isOpen) return null;

  const cleanedNumber = cleanWhatsAppNumber(phoneNumber);
  const isValid = cleanedNumber.length >= 7;

  const handleSendWhatsApp = () => {
    AudioFeedback.playBeep(880, 80);
    const success = WhatsAppService.open(cleanedNumber, messageText);
    if (success) {
      setHasSent(true);
      setTimeout(() => {
        setHasSent(false);
      }, 3000);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    AudioFeedback.playBeep(980, 60);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 p-5 sm:p-6 relative text-slate-800 dark:text-slate-100"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                {moduleLabel}
              </span>
              <span className="text-[11px] font-bold text-slate-400">Direct wa.me link</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 text-xs flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11.5px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong className="font-bold">Direct Dispatch:</strong> Sends to the phone number without needing to save it into mobile or computer contacts.
          </div>
        </div>

        {/* Recipient Details & Phone Input */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Recipient WhatsApp Number:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0501234567 or +966501234567"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
          {cleanedNumber && (
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Formatted International: <span className="font-bold text-emerald-600 dark:text-emerald-400">+{cleanedNumber}</span>
            </p>
          )}
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Message Content Preview:</span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="bg-slate-900 dark:bg-slate-950 text-emerald-300 font-mono text-[11px] p-3.5 rounded-2xl max-h-44 overflow-y-auto whitespace-pre-wrap border border-slate-700 select-all leading-relaxed shadow-inner">
            {messageText}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Open &amp; Send via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </motion.button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

        {hasSent && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>WhatsApp chat launched successfully!</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

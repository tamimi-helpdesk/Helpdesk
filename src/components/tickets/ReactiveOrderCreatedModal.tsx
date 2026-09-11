import React, { useState } from 'react';
import { WorkOrderTicket } from '../../types/ticket';
import { Monitor, X, Copy, Check } from 'lucide-react';

interface ReactiveOrderCreatedModalProps {
  isOpen: boolean;
  ticket: WorkOrderTicket | null;
  onClose: () => void;
  onViewReports?: () => void;
}

export const ReactiveOrderCreatedModal: React.FC<ReactiveOrderCreatedModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onViewReports,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticket) return null;

  // Exact header format from Screenshot: "FM Reactive Work Order - <Title or Issue>"
  const rawTitle = ticket.title || ticket.category || 'Maintenance Request';
  const headerTitle = rawTitle.toLowerCase().startsWith('fm reactive work order')
    ? rawTitle
    : `FM Reactive Work Order - ${rawTitle}`;

  // Exact number display matching Planon format (e.g. 1083111.00)
  const orderNumber = ticket.orderNumberDecimal || ticket.ticketNumber || ticket.id;

  // Exact description display matching screenshot (e.g. "J2-114 toilet shower mixer not working")
  const description = ticket.comment || ticket.description || ticket.title || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="reactive-order-created-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reactive-order-created-window"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Modal Window Header matching Planon Reactive Work Order screenshot */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <Monitor className="w-5 h-5 text-slate-800 dark:text-slate-200 shrink-0" />
            <h2
              className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate"
              title={headerTitle}
            >
              {headerTitle}
            </h2>
          </div>
          <button
            type="button"
            id="btn-close-reactive-modal-top"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with exact fields: Number & Description */}
        <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col min-h-[300px]">
          {/* Number Field */}
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 font-normal mb-1.5">
              Number
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={orderNumber}
                className="w-full bg-[#e2e8f0]/80 dark:bg-slate-800/90 border border-[#94a3b8] dark:border-slate-600 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none select-all pr-9"
              />
              <button
                type="button"
                id="btn-copy-ticket-number"
                onClick={handleCopy}
                className="absolute right-2 p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title={copied ? 'Copied to clipboard' : 'Copy ticket number'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 font-normal mb-1.5">
              Description
            </label>
            <input
              type="text"
              readOnly
              value={description}
              className="w-full bg-[#e2e8f0]/80 dark:bg-slate-800/90 border border-[#94a3b8] dark:border-slate-600 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none select-all"
            />
          </div>

          {/* Clean whitespace area as shown in screenshot */}
          <div className="flex-1 min-h-[140px]" />
        </div>

        {/* Modal Window Footer with centered Close button */}
        <div className="py-4 px-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900">
          <button
            type="button"
            id="btn-close-reactive-modal-bottom"
            onClick={onClose}
            className="px-8 py-1.5 rounded-full bg-[#64748b] hover:bg-[#475569] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ClipboardList,
  Wrench,
  Key,
  Building2,
  UtensilsCrossed,
  Shirt,
  Receipt,
  X,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvoiceType } from '../../types/invoice';
import { INVOICE_TYPE_DEFINITIONS } from '../../data/invoiceTemplates';

interface InvoiceTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: InvoiceType) => void;
  onOpenMultiRoom?: () => void;
}

export const InvoiceTypeSelectorModal: React.FC<InvoiceTypeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  onOpenMultiRoom,
}) => {
  if (!isOpen) return null;

  const iconMap: Record<string, React.ReactNode> = {
    ClipboardList: <ClipboardList className="w-6 h-6" />,
    Wrench: <Wrench className="w-6 h-6" />,
    Key: <Key className="w-6 h-6" />,
    Building2: <Building2 className="w-6 h-6" />,
    UtensilsCrossed: <UtensilsCrossed className="w-6 h-6" />,
    Shirt: <Shirt className="w-6 h-6" />,
    Receipt: <Receipt className="w-6 h-6" />,
  };

  const typesList = Object.values(INVOICE_TYPE_DEFINITIONS);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Create New Invoice / Billing Form
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-normal border border-amber-400/30">
                    Enterprise Edition
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select an official Tamimi Global template designed for camp operations, clearance, or POS billing.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Template Grid */}
          <div className="p-6 bg-slate-50/50 max-h-[75vh] overflow-y-auto space-y-4">
            {/* Multi-Room Batch Invoicing Special Banner */}
            {onOpenMultiRoom && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  onClose();
                  onOpenMultiRoom();
                }}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border-2 border-amber-500/60 hover:border-amber-500 cursor-pointer shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                    <Sparkles className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        ⚡ Multi-Room Batch &amp; Split Invoice Generator
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white uppercase tracking-wider">
                        Advanced
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Need to bill 5+ rooms for shared missing items (e.g. BMS Charger &amp; Cable) split by varying person counts (2, 4, 5 persons)? Click here!
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1.5 rounded-lg border border-amber-300 flex items-center gap-1">
                    Open Batch Matrix <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typesList.map((def) => {
                const isPrimary = def.type === 'MISSING_ITEMS';
                return (
                  <motion.div
                    key={def.type}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectType(def.type)}
                    className={`relative p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isPrimary
                        ? 'bg-amber-50/40 border-amber-300 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    {isPrimary && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-700" />
                        Most Used
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm ${def.badgeColor}`}
                        >
                          {iconMap[def.iconName] || <Receipt className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-slate-600 tracking-wider">
                            {def.formRefCode}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {def.title}
                          </h3>
                          <div className="text-[11px] font-serif text-slate-700 mt-0.5">
                            {def.arabicTitle}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed mb-3">
                        {def.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-700">
                          {def.defaultItems.length} Default Items
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-semibold text-slate-700">
                          {def.defaultVatRate > 0 ? `VAT ${def.defaultVatRate}%` : 'Tax Exempt (0%)'}
                        </span>
                      </div>

                      <div className="flex items-center font-bold text-slate-900 text-xs group-hover:translate-x-1 transition-transform">
                        <span>Select Template</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-600" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Quick Advice */}
            <div className="mt-6 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  All forms produce authentic <strong>Tamimi Global A4 single-page printouts</strong> with official Arabic/English headers and dual signatures.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

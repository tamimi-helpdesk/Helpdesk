import React, { useState } from 'react';
import {
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  X,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQItem } from './types';

interface FaqTabProps {
  faqs: FAQItem[];
  onSaveFaqs: (updated: FAQItem[]) => void;
  onResetFaqs: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const FaqTab: React.FC<FaqTabProps> = ({
  faqs,
  onSaveFaqs,
  onResetFaqs,
  onTriggerFeedback,
}) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQItem | null>(null);

  // Form Fields
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');

  const handleOpenAdd = () => {
    setEditingFaqId(null);
    setFormQuestion('');
    setFormAnswer('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: FAQItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingFaqId(faq.id);
    setFormQuestion(faq.q);
    setFormAnswer(faq.a);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) return;

    if (editingFaqId) {
      const updated = faqs.map((f) =>
        f.id === editingFaqId
          ? { ...f, q: formQuestion.trim(), a: formAnswer.trim() }
          : f
      );
      onSaveFaqs(updated);
      onTriggerFeedback('success', `FAQ updated.`);
    } else {
      const newFaq: FAQItem = {
        id: `faq-${Date.now()}`,
        q: formQuestion.trim(),
        a: formAnswer.trim(),
      };
      onSaveFaqs([...faqs, newFaq]);
      onTriggerFeedback('success', `New FAQ added.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!faqToDelete) return;
    const updated = faqs.filter((f) => f.id !== faqToDelete.id);
    onSaveFaqs(updated);
    setFaqToDelete(null);
    onTriggerFeedback('info', `FAQ removed.`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
            Frequently Asked Resident Questions
          </h3>
          <p className="text-xs text-slate-500">Quick operational answers regarding camp rules, facilities, and maintenance</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onResetFaqs}
            title="Reset FAQs to Default"
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add FAQ</span>
          </button>
        </div>
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-2.5 pt-1">
        {faqs.map((faq, idx) => (
          <div
            key={faq.id}
            className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition group"
          >
            <div className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 transition">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="flex-1 text-left flex items-center space-x-2.5 cursor-pointer font-bold text-xs sm:text-sm text-slate-900 dark:text-white mr-2"
              >
                <span className="w-5 h-5 rounded-md bg-teal-600 text-white text-xs flex items-center justify-center font-black shrink-0">
                  Q
                </span>
                <span className="leading-snug">{faq.q}</span>
              </button>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(faq, e)}
                  title="Edit FAQ"
                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFaqToDelete(faq);
                  }}
                  title="Delete FAQ"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="p-1 text-slate-400 cursor-pointer"
                >
                  {expandedFaq === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedFaq === idx && (
              <div className="p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800 whitespace-pre-line">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT FAQ
          ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingFaqId ? 'Edit Resident Question' : 'Add New Resident FAQ'}
                    </h3>
                    <p className="text-xs text-slate-500">Provide clear answers to common resident inquiries</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-left">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Question *</label>
                  <input
                    type="text"
                    required
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="e.g. How do I request extra blankets or linen exchange?"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Answer / Instructions *</label>
                  <textarea
                    rows={4}
                    required
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder="e.g. Contact Housekeeping supervisor at Ext. 4425 or visit the linen dispatch desk..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs shadow-md shadow-teal-600/20 cursor-pointer"
                  >
                    {editingFaqId ? 'Save Changes' : 'Create FAQ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE FAQ CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {faqToDelete && (
          <div
            onClick={() => setFaqToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete FAQ Entry?</h3>
                  <p className="text-xs text-slate-500">This will remove this item from the resident help center.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {faqToDelete.q}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFaqToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete FAQ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

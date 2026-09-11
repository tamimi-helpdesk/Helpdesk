import React, { useState } from 'react';
import {
  BookOpen,
  MapPin,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  X,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmergencyScript } from './types';

interface EmergencyScriptsTabProps {
  scripts: EmergencyScript[];
  onSaveScripts: (updated: EmergencyScript[]) => void;
  onResetScripts: () => void;
  onTriggerFeedback: (type: 'success' | 'info', message: string) => void;
}

export const EmergencyScriptsTab: React.FC<EmergencyScriptsTabProps> = ({
  scripts,
  onSaveScripts,
  onResetScripts,
  onTriggerFeedback,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [scriptToDelete, setScriptToDelete] = useState<EmergencyScript | null>(null);

  // Form Fields
  const [formScenario, setFormScenario] = useState('');
  const [formUrgency, setFormUrgency] = useState<EmergencyScript['urgency']>('HIGH');
  const [formWhoToCall, setFormWhoToCall] = useState('');
  const [formRecommendedExt, setFormRecommendedExt] = useState('');
  const [formRecommendedPhone, setFormRecommendedPhone] = useState('');
  const [formWhatToSayEnglish, setFormWhatToSayEnglish] = useState('');
  const [formWhatToSayArabic, setFormWhatToSayArabic] = useState('');
  const [formActionChecklistText, setFormActionChecklistText] = useState('');
  const [formKeyAdvice, setFormKeyAdvice] = useState('');

  const handleOpenAdd = () => {
    setEditingScriptId(null);
    setFormScenario('');
    setFormUrgency('HIGH');
    setFormWhoToCall('Camp Emergency Command Desk');
    setFormRecommendedExt('Ext. 4411');
    setFormRecommendedPhone('+966 13 888 4411');
    setFormWhatToSayEnglish('');
    setFormWhatToSayArabic('');
    setFormActionChecklistText('Report exact building & room\nFollow duty officer instructions\nDo not enter hazardous area');
    setFormKeyAdvice('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (script: EmergencyScript, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingScriptId(script.id);
    setFormScenario(script.scenario);
    setFormUrgency(script.urgency);
    setFormWhoToCall(script.whoToCall);
    setFormRecommendedExt(script.recommendedExt);
    setFormRecommendedPhone(script.recommendedPhone);
    setFormWhatToSayEnglish(script.whatToSayEnglish || '');
    setFormWhatToSayArabic(script.whatToSayArabic || '');
    setFormActionChecklistText(script.actionChecklist ? script.actionChecklist.join('\n') : '');
    setFormKeyAdvice(script.keyAdvice || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formScenario.trim() || !formWhoToCall.trim()) return;

    const checklist = formActionChecklistText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (editingScriptId) {
      const updated = scripts.map((s) =>
        s.id === editingScriptId
          ? {
              ...s,
              scenario: formScenario.trim(),
              urgency: formUrgency,
              whoToCall: formWhoToCall.trim(),
              recommendedExt: formRecommendedExt.trim(),
              recommendedPhone: formRecommendedPhone.trim(),
              whatToSayEnglish: formWhatToSayEnglish.trim(),
              whatToSayArabic: formWhatToSayArabic.trim(),
              actionChecklist: checklist.length > 0 ? checklist : ['Follow emergency instructions'],
              keyAdvice: formKeyAdvice.trim(),
            }
          : s
      );
      onSaveScripts(updated);
      onTriggerFeedback('success', `Emergency SOP "${formScenario}" updated.`);
    } else {
      const newScript: EmergencyScript = {
        id: `script-${Date.now()}`,
        scenario: formScenario.trim(),
        urgency: formUrgency,
        whoToCall: formWhoToCall.trim(),
        recommendedExt: formRecommendedExt.trim(),
        recommendedPhone: formRecommendedPhone.trim(),
        whatToSayEnglish: formWhatToSayEnglish.trim(),
        whatToSayArabic: formWhatToSayArabic.trim(),
        actionChecklist: checklist.length > 0 ? checklist : ['Follow emergency instructions'],
        keyAdvice: formKeyAdvice.trim(),
      };
      onSaveScripts([...scripts, newScript]);
      onTriggerFeedback('success', `Emergency SOP "${formScenario}" added.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!scriptToDelete) return;
    const target = scriptToDelete.scenario;
    const updated = scripts.filter((s) => s.id !== scriptToDelete.id);
    onSaveScripts(updated);
    setScriptToDelete(null);
    onTriggerFeedback('info', `Emergency SOP "${target}" removed.`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
            Emergency Standard Operating Procedures (SOPs)
          </h3>
          <p className="text-xs text-slate-500">Step-by-step incident response scripts and duty dispatch</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onResetScripts}
            title="Reset Scripts to Default"
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
            <span>+ Add Emergency SOP</span>
          </button>
        </div>
      </div>

      {/* Grid of Scripts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scripts.map((script) => (
          <div
            key={script.id}
            className="bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs border ${
                      script.urgency === 'CRITICAL'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                        : script.urgency === 'HIGH'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    URGENCY: {script.urgency}
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-white text-base pt-1">
                    {script.scenario}
                  </h4>
                </div>

                <div className="flex items-center space-x-1">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-black text-slate-700 dark:text-slate-300">
                    {script.recommendedExt}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(script, e)}
                    title="Edit Emergency SOP"
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScriptToDelete(script);
                    }}
                    title="Delete Emergency SOP"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Directives */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Immediate Emergency Actions:
                </div>
                <div className="space-y-1.5">
                  {script.actionChecklist.map((action, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-800 dark:text-slate-200">
                      <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phrases to say if available */}
              {script.whatToSayEnglish && (
                <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-900 text-xs space-y-1">
                  <div className="text-teal-800 dark:text-teal-300 font-bold">What to state to operator:</div>
                  <div className="italic text-slate-700 dark:text-slate-300 font-medium">"{script.whatToSayEnglish}"</div>
                  {script.whatToSayArabic && (
                    <div className="italic text-teal-700 dark:text-teal-400 font-arabic text-right dir-rtl">"{script.whatToSayArabic}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Duty Contact */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">{script.whoToCall}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono font-bold">{script.recommendedPhone}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================
          MODAL: ADD / EDIT EMERGENCY SCRIPT
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
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingScriptId ? 'Edit Emergency SOP' : 'Add Emergency SOP'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure scenario protocol and action directives</p>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Scenario Title *</label>
                    <input
                      type="text"
                      required
                      value={formScenario}
                      onChange={(e) => setFormScenario(e.target.value)}
                      placeholder="e.g. Fire in Residential Room / Smoke Detected"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Urgency</label>
                    <select
                      value={formUrgency}
                      onChange={(e) => setFormUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold mt-1"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Who to Call *</label>
                    <input
                      type="text"
                      required
                      value={formWhoToCall}
                      onChange={(e) => setFormWhoToCall(e.target.value)}
                      placeholder="e.g. Safety Control"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Extension</label>
                    <input
                      type="text"
                      value={formRecommendedExt}
                      onChange={(e) => setFormRecommendedExt(e.target.value)}
                      placeholder="e.g. Ext. 4411"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct Phone</label>
                    <input
                      type="text"
                      value={formRecommendedPhone}
                      onChange={(e) => setFormRecommendedPhone(e.target.value)}
                      placeholder="e.g. +966 13 888 4411"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Action Checklist (One per line)</label>
                  <textarea
                    rows={3}
                    value={formActionChecklistText}
                    onChange={(e) => setFormActionChecklistText(e.target.value)}
                    placeholder="Pull manual alarm call point&#10;Evacuate through nearest stairwell&#10;Report to primary assembly point"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operator Script (English)</label>
                    <textarea
                      rows={2}
                      value={formWhatToSayEnglish}
                      onChange={(e) => setFormWhatToSayEnglish(e.target.value)}
                      placeholder="This is room 204 reporting smoke in corridor..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operator Script (Arabic)</label>
                    <textarea
                      rows={2}
                      value={formWhatToSayArabic}
                      onChange={(e) => setFormWhatToSayArabic(e.target.value)}
                      placeholder="هنا بلاغ طوارئ في المبنى..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs mt-1"
                    />
                  </div>
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
                    {editingScriptId ? 'Save Changes' : 'Create SOP'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: DELETE SCRIPT CONFIRMATION
          ======================================================== */}
      <AnimatePresence>
        {scriptToDelete && (
          <div
            onClick={() => setScriptToDelete(null)}
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
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Emergency SOP?</h3>
                  <p className="text-xs text-slate-500">This will remove this scenario script.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{scriptToDelete.scenario}</div>
                <div className="text-slate-500">{scriptToDelete.whoToCall} • {scriptToDelete.recommendedExt}</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScriptToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Yes, Delete SOP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

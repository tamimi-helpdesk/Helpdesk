import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  Thermometer,
  Stethoscope,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  X,
  Plus,
  Save,
  Check,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IsolationRoomRecord } from '../../types';

interface MedicalVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: IsolationRoomRecord | null;
  onVitalsSaved?: () => void;
  onSaveVitals?: (vitalsRecord: any) => void;
}

export const MedicalVitalsModal: React.FC<MedicalVitalsModalProps> = ({
  isOpen,
  onClose,
  room,
  onVitalsSaved,
  onSaveVitals,
}) => {
  const [temperature, setTemperature] = useState('36.8');
  const [spO2, setSpO2] = useState('98');
  const [pulse, setPulse] = useState('74');
  const [bp, setBp] = useState('120/80');
  const [pcrStatus, setPcrStatus] = useState<'NEGATIVE' | 'POSITIVE' | 'PENDING_LAB'>('NEGATIVE');
  
  // Symptoms
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    shortnessOfBreath: false,
    lossOfTasteSmell: false,
    bodyAche: false,
    fatigue: false,
  });

  // Daily Meal & Care Delivery Matrix
  const [careChecklist, setCareChecklist] = useState({
    breakfastDelivered: true,
    lunchDelivered: true,
    dinnerDelivered: false,
    drinkingWaterBottles: true,
    freshLinenProvided: true,
    roomSanitized: true,
  });

  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient is stable, no respiratory distress observed. Temperature normal throughout the morning round.'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !room) return null;

  const patientName = room.patientName || (room.occupants && room.occupants[0]?.patientName) || 'Resident Patient';
  const roomNumber = room.buildingNumber || room.id;

  const handleSave = () => {
    const record = {
      roomId: room.id,
      roomNumber,
      patientName,
      timestamp: new Date().toISOString(),
      temperature,
      spO2,
      pulse,
      bp,
      pcrStatus,
      symptoms,
      careChecklist,
      clinicalNotes,
    };

    if (onSaveVitals) {
      onSaveVitals(record);
    }
    if (onVitalsSaved) {
      onVitalsSaved();
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      <div
        id="medical-vitals-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border-2 border-rose-500/40 rounded-3xl w-full max-w-3xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-b-2 border-rose-500/30 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-rose-500/30">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide uppercase">
                    DAILY MEDICAL VITALS & CARE LOG
                  </h2>
                  <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    CLINICAL DESK
                  </span>
                </div>
                <p className="text-xs text-rose-300/80 font-medium">
                  Room {roomNumber} ({room.building}) • Guest: {patientName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Primary Vitals Strip */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-2">
                1. Core Physiological Measurements
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Temp */}
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>Body Temp (°C)</span>
                  </div>
                  <input
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-lg font-black text-white font-mono focus:border-rose-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Normal (36.5–37.5)</span>
                </div>

                {/* SpO2 */}
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Blood SpO2 (%)</span>
                  </div>
                  <input
                    type="text"
                    value={spO2}
                    onChange={(e) => setSpO2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-lg font-black text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-cyan-400 font-bold mt-1 block">Optimal (≥95%)</span>
                </div>

                {/* Pulse */}
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <HeartPulse className="w-4 h-4 text-pink-400" />
                    <span>Pulse (BPM)</span>
                  </div>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-lg font-black text-white font-mono focus:border-pink-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-pink-400 font-bold mt-1 block">Resting (60–100)</span>
                </div>

                {/* Blood Pressure */}
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <Stethoscope className="w-4 h-4 text-purple-400" />
                    <span>Blood Pressure</span>
                  </div>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-lg font-black text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-purple-400 font-bold mt-1 block">Systolic / Diastolic</span>
                </div>
              </div>
            </div>

            {/* Symptoms Checklist */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-2">
                2. Symptom Evaluation Checklist
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(symptoms).map(([key, val]) => (
                  <label
                    key={key}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      val
                        ? 'bg-rose-950/70 border-rose-500 text-rose-200 font-bold'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={() =>
                        setSymptoms((prev: any) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="w-4 h-4 text-rose-500 rounded border-slate-700"
                    />
                    <span className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Daily Meal & Care Delivery Matrix */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-2">
                3. Resident Meal & Sanitization Service Log
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(careChecklist).map(([key, val]) => (
                  <label
                    key={key}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      val
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={() =>
                        setCareChecklist((prev: any) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="w-4 h-4 text-emerald-500 rounded border-slate-700"
                    />
                    <span className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clinical Observations */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-1">
                4. Medical Officer / Nurse Daily Notes
              </label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-rose-400 focus:outline-none"
                placeholder="Enter doctor/nurse observations, medication administered, etc."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-950 border-t-2 border-rose-500/30 p-4 sm:p-5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Recorded by: Duty Medical Officer</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-500/30 flex items-center space-x-2 cursor-pointer"
              >
                {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'Vitals Logged!' : 'Save Medical Vitals'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

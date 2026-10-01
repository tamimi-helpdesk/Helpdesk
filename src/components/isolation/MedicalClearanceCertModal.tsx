import React from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Calendar,
  User,
  HeartPulse,
  Award,
  QrCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IsolationRoomRecord } from '../../types';

interface MedicalClearanceCertModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: IsolationRoomRecord | null;
}

export const MedicalClearanceCertModal: React.FC<MedicalClearanceCertModalProps> = ({
  isOpen,
  onClose,
  room,
}) => {
  if (!isOpen || !room) return null;

  const todayStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const guestName = room.patientName || (room.occupants && room.occupants[0]?.patientName) || 'Resident Patient';
  const company = room.company || (room.occupants && room.occupants[0]?.company) || 'Tamimi Global Co.';
  const nationalId = room.nationalId || (room.occupants && room.occupants[0]?.nationalId) || 'TAM-99214';
  const checkInDate = room.checkIn || (room.occupants && room.occupants[0]?.checkIn) || '2026-08-20';
  const roomNumber = room.buildingNumber || room.id;
  const certId = `MED-CLR-${roomNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        id="medical-cert-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Action Bar (Not visible in Print) */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold">Medical Clearance Certificate Preview</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Certificate Page */}
          <div className="p-8 sm:p-12 space-y-6 bg-white border-8 border-slate-100 m-4 rounded-2xl relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Building2 className="w-96 h-96 text-slate-950" />
            </div>

            {/* Header / Brand */}
            <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-950 tracking-wide uppercase">
                  TAMIMI GLOBAL COMPANY (TAFGA)
                </h1>
                <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase mt-0.5">
                  CAMP MEDICAL & OCCUPATIONAL HEALTH DIVISION
                </p>
                <p className="text-[11px] text-slate-500">Facility Health & Safety Compliance Desk</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Certificate No:</span>
                <p className="text-xs font-black text-slate-900 font-mono">{certId}</p>
                <p className="text-[11px] text-slate-500 mt-1">{todayStr}</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-widest bg-emerald-50 text-emerald-900 py-1.5 px-4 rounded-xl inline-block border border-emerald-200">
                CERTIFICATE OF MEDICAL CLEARANCE & FIT-TO-WORK
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Official Release from Isolation & Quarantine Observation
              </p>
            </div>

            {/* Patient Credentials */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-bold">Resident Name:</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">{guestName}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Badge / National ID:</span>
                <p className="font-black text-slate-900 text-sm font-mono mt-0.5">{nationalId}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Sponsoring Company:</span>
                <p className="font-bold text-slate-900 mt-0.5">{company}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold">Isolation Room:</span>
                <p className="font-black text-slate-900 font-mono mt-0.5">
                  Building {room.building} - Room {roomNumber}
                </p>
              </div>
            </div>

            {/* Declaration Text */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p>
                This is to officially certify that the individual named above has successfully completed the
                mandatory medical isolation and health observation period commencing from{' '}
                <strong className="text-slate-900 font-bold">{checkInDate}</strong> to{' '}
                <strong className="text-slate-900 font-bold">{todayStr}</strong>.
              </p>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950 font-medium">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Body temperature, vital signs, and oxygen saturation (SpO2) are stable within normal physiological limits.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PCR / Antigen screening tests completed with negative clinical pathology findings.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>The patient is declared asymptomatic and medically fit to resume standard camp duties and lodging.</span>
                </div>
              </div>
            </div>

            {/* Signature & Seal Block */}
            <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-4 items-end text-center">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center font-serif italic text-sm text-slate-600">
                  Dr. M. Al-Hassan, MD
                </div>
                <p className="text-[11px] font-bold text-slate-900">Duty Medical Officer</p>
                <p className="text-[10px] text-slate-500">Camp Health Clinic</p>
              </div>

              {/* Official Seal Mock */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-600 border-dashed flex items-center justify-center text-[9px] font-black text-emerald-800 uppercase text-center p-1 leading-tight">
                  TAMIMI CAMP HEALTH APPROVED
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Official Clinic Seal</p>
              </div>

              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center font-serif italic text-sm text-slate-600">
                  Capt. S. Al-Harbi
                </div>
                <p className="text-[11px] font-bold text-slate-900">Camp Operations Manager</p>
                <p className="text-[10px] text-slate-500">Occupational Safety</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

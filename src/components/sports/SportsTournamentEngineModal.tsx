import React, { useState } from 'react';
import {
  Trophy,
  Activity,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  Zap,
  Clock,
  X,
  Plus,
  Minus,
  Sun,
  CloudRain,
  Sliders,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Facility } from '../../types';

interface SportsTournamentEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: Facility;
}

export const SportsTournamentEngineModal: React.FC<SportsTournamentEngineModalProps> = ({
  isOpen,
  onClose,
  facility,
}) => {
  const isCricket = facility.id === 'cricket-ground' || facility.id === 'cricket-net';
  const isFootball = facility.id === 'football-ground';
  const isTennisOrBasketball = facility.id === 'tennis-court' || facility.id === 'basketball-court';

  // Team Details & Score State
  const [teamAName, setTeamA] = useState('Camp Titans');
  const [teamBName, setTeamB] = useState('Desert Eagles');

  // Cricket State
  const [runsA, setRunsA] = useState(64);
  const [wicketsA, setWicketsA] = useState(3);
  const [oversA, setOversA] = useState('7.4');

  const [runsB, setRunsB] = useState(0);
  const [wicketsB, setWicketsB] = useState(0);
  const [oversB, setOversB] = useState('0.0');
  const [currentBattingTeam, setCurrentBattingTeam] = useState<'A' | 'B'>('A');

  // Football / Basketball Score State
  const [scoreA, setScoreA] = useState(2);
  const [scoreB, setScoreB] = useState(1);
  const [matchHalf, setMatchHalf] = useState('1st Half (34m)');
  const [yellowCardsA, setYellowCardsA] = useState(1);
  const [yellowCardsB, setYellowCardsB] = useState(2);

  // Equipment Checklist
  const [equipmentChecks, setEquipmentChecks] = useState({
    matchBallInspected: true,
    boundaryFlagsMarked: true,
    firstAidKitReady: true,
    refereeWhistleAssigned: true,
    floodlightsOperational: true,
  });

  // Pitch Condition & Lock
  const [pitchCondition, setPitchCondition] = useState<'EXCELLENT' | 'GOOD' | 'WET_SLIPPERY' | 'UNDER_MAINTENANCE'>('EXCELLENT');
  const [isPitchLocked, setIsPitchLocked] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="sports-engine-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl w-full max-w-4xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-b-2 border-emerald-500/30 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide uppercase">
                    {facility.name} • LIVE MATCH SCOREBOARD
                  </h2>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    TOURNAMENT ENGINE
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 font-medium">
                  Real-time camp sports scoring, equipment verification & pitch conditions
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
            {/* Live Score Display Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-3">
                <span className="flex items-center space-x-2 text-emerald-400">
                  <Flame className="w-4 h-4" />
                  <span>CAMP PREMIER LEAGUE 2026</span>
                </span>
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/40 animate-pulse font-mono">
                  LIVE IN PROGRESS
                </span>
              </div>

              {isCricket ? (
                /* Cricket Scorekeeper */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Team A */}
                  <div
                    className={`p-4 rounded-2xl border-2 transition ${
                      currentBattingTeam === 'A'
                        ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={teamAName}
                        onChange={(e) => setTeamA(e.target.value)}
                        className="bg-transparent text-base sm:text-lg font-black text-white focus:outline-none border-b border-dashed border-slate-600 focus:border-emerald-400 pb-0.5"
                      />
                      {currentBattingTeam === 'A' && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-black uppercase px-2 py-0.5 rounded-md">
                          🏏 Batting
                        </span>
                      )}
                    </div>
                    <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      {runsA}/{wicketsA}{' '}
                      <span className="text-sm sm:text-lg text-slate-400 font-normal">({oversA} Ov)</span>
                    </div>

                    {/* Scoring Controls */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[1, 2, 4, 6].map((run) => (
                        <button
                          key={run}
                          onClick={() => setRunsA((r) => r + run)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-black rounded-lg text-xs border border-emerald-500/30 transition cursor-pointer"
                        >
                          +{run} Run
                        </button>
                      ))}
                      <button
                        onClick={() => setWicketsA((w) => (w < 10 ? w + 1 : w))}
                        className="px-3 py-1.5 bg-red-900/60 hover:bg-red-600 text-red-200 font-black rounded-lg text-xs border border-red-500/40 transition cursor-pointer"
                      >
                        🔴 Wicket
                      </button>
                    </div>
                  </div>

                  {/* Team B */}
                  <div
                    className={`p-4 rounded-2xl border-2 transition ${
                      currentBattingTeam === 'B'
                        ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={teamBName}
                        onChange={(e) => setTeamB(e.target.value)}
                        className="bg-transparent text-base sm:text-lg font-black text-white focus:outline-none border-b border-dashed border-slate-600 focus:border-emerald-400 pb-0.5"
                      />
                      {currentBattingTeam === 'B' && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-black uppercase px-2 py-0.5 rounded-md">
                          🏏 Batting
                        </span>
                      )}
                    </div>
                    <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      {runsB}/{wicketsB}{' '}
                      <span className="text-sm sm:text-lg text-slate-400 font-normal">({oversB} Ov)</span>
                    </div>

                    {/* Scoring Controls */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[1, 2, 4, 6].map((run) => (
                        <button
                          key={run}
                          onClick={() => setRunsB((r) => r + run)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-black rounded-lg text-xs border border-emerald-500/30 transition cursor-pointer"
                        >
                          +{run} Run
                        </button>
                      ))}
                      <button
                        onClick={() => setWicketsB((w) => (w < 10 ? w + 1 : w))}
                        className="px-3 py-1.5 bg-red-900/60 hover:bg-red-600 text-red-200 font-black rounded-lg text-xs border border-red-500/40 transition cursor-pointer"
                      >
                        🔴 Wicket
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Football / Basketball Scorekeeper */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center">
                  {/* Team A */}
                  <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                    <input
                      type="text"
                      value={teamAName}
                      onChange={(e) => setTeamA(e.target.value)}
                      className="bg-transparent text-center text-lg font-black text-white focus:outline-none border-b border-dashed border-slate-600 focus:border-emerald-400 pb-1 w-full"
                    />
                    <div className="text-5xl font-black text-emerald-400 font-mono my-3">{scoreA}</div>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setScoreA((s) => s + 1)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setScoreA((s) => Math.max(0, s - 1))}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* VS / Match Clock */}
                  <div className="py-3">
                    <span className="text-2xl font-black text-slate-600">VS</span>
                    <div className="mt-2 text-xs font-black text-emerald-400 font-mono bg-emerald-950/60 py-1.5 px-3 rounded-full border border-emerald-500/30 inline-block">
                      {matchHalf}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                    <input
                      type="text"
                      value={teamBName}
                      onChange={(e) => setTeamB(e.target.value)}
                      className="bg-transparent text-center text-lg font-black text-white focus:outline-none border-b border-dashed border-slate-600 focus:border-emerald-400 pb-1 w-full"
                    />
                    <div className="text-5xl font-black text-emerald-400 font-mono my-3">{scoreB}</div>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setScoreB((s) => s + 1)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setScoreB((s) => Math.max(0, s - 1))}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Equipment & Ground Maintenance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pre-Match Safety & Equipment Checklist */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm font-black uppercase text-emerald-400">
                  <Shield className="w-4 h-4" />
                  <span>Ground Safety & Equipment Check</span>
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries(equipmentChecks).map(([key, val]) => (
                    <label
                      key={key}
                      className="flex items-center space-x-3 p-2 bg-slate-900/60 rounded-xl cursor-pointer hover:bg-slate-900 transition"
                    >
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() =>
                          setEquipmentChecks((prev: any) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pitch Condition & Maintenance Lock */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm font-black uppercase text-emerald-400">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" />
                    <span>Pitch & Weather Status</span>
                  </div>
                  <button
                    onClick={() => setIsPitchLocked(!isPitchLocked)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition ${
                      isPitchLocked
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {isPitchLocked ? '🔒 Ground Locked' : '🔓 Ground Open'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['EXCELLENT', 'GOOD', 'WET_SLIPPERY', 'UNDER_MAINTENANCE'] as const).map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setPitchCondition(cond)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        pitchCondition === cond
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {cond.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {isPitchLocked && (
                  <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      Ground is locked for maintenance/weather. New bookings will be flagged as pending.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

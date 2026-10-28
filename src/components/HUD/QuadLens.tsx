import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Compass, ShieldAlert, Cpu, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

export const QuadLens: React.FC = () => {
  const { quadLens, testUserIdea, turn } = useGameStore();
  const [candidateInput, setCandidateInput] = useState('');

  const handleTestIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateInput.trim()) return;
    testUserIdea(candidateInput.trim());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
      {/* LENS 1: YOUR LEVEL (1200-1400 CLUB PERSPECTIVE) */}
      <div className="glass-panel p-3 rounded-xl border border-sky-500/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-sky-400 font-mono text-xs font-semibold">
              <Compass className="w-4 h-4" />
              <span>LENS 01 :: CLUB TACTICS (~1400)</span>
            </div>
            <span className="text-[10px] bg-sky-950/70 border border-sky-500/40 text-sky-300 px-1.5 py-0.5 rounded font-mono">
              REALISTIC
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-sky-200">
                {quadLens.currentLevel.move?.san || '—'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Eval: {((quadLens.currentLevel.move?.evalCp || 0) / 100).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {quadLens.currentLevel.move?.explanation || 'Awaiting position calculation...'}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-sky-500/10 flex items-center justify-between text-[11px] text-sky-400/80 font-mono">
          <span>Target: {quadLens.currentLevel.targetRating} Elo</span>
          <span>Difficulty: ★★☆☆☆</span>
        </div>
      </div>

      {/* LENS 2: MASTER VISION (STOCKFISH 2800+ OPTIMAL PV) */}
      <div className="glass-panel p-3 rounded-xl border border-cyan-400/40 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        <div>
          <div className="flex items-center justify-between border-b border-cyan-400/20 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-xs font-semibold">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>LENS 02 :: MASTER VISION (2800+)</span>
            </div>
            <span className="text-[10px] bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 px-1.5 py-0.5 rounded font-mono">
              DEPTH {quadLens.masterVision.depth}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-black text-cyan-300">
                  {quadLens.masterVision.move?.san || '—'}
                </span>
                <span className="text-xs px-1 bg-cyan-400/20 text-cyan-200 rounded font-mono">
                  MultiPV 1
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-cyan-400">
                {((quadLens.masterVision.evalScore || 0) / 100).toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {quadLens.masterVision.move?.explanation || 'Scanning candidate trees...'}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-cyan-400/10 text-[11px] font-mono text-slate-400 flex items-center gap-1 overflow-x-auto">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>PV:</span>
          <span className="text-cyan-300 font-bold">{quadLens.masterVision.move?.pv?.join(' → ') || '...'}</span>
        </div>
      </div>

      {/* LENS 3: THREAT MATRIX (OPPONENT PREDICTION & ATTACKS) */}
      <div className="glass-panel p-3 rounded-xl border border-rose-500/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>LENS 03 :: THREAT MATRIX</span>
            </div>
            <span className="text-[10px] bg-rose-950/80 border border-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded font-mono">
              OPPONENT: {turn === 'w' ? 'BLACK' : 'WHITE'}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-rose-200/90 font-mono">
              {quadLens.threatMatrix.threatSummary}
            </p>

            <div className="space-y-1">
              {quadLens.threatMatrix.opponentTopThreats.slice(0, 2).map((threat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-rose-950/40 border border-rose-900/50 p-1 rounded font-mono">
                  <span className="text-rose-300 font-bold">1... {threat.san}</span>
                  <span className="text-slate-400 text-[10px]">{threat.explanation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-rose-500/10 flex items-center justify-between text-[11px] text-rose-400 font-mono">
          <span>King Pressure: {quadLens.threatMatrix.kingDangerScore}%</span>
          <span className="text-slate-400">Counter-attack alert</span>
        </div>
      </div>

      {/* LENS 4: YOUR IDEA SANDBOX (WHAT-IF VALIDATION) */}
      <div className="glass-panel p-3 rounded-xl border border-amber-500/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-semibold">
              <Lightbulb className="w-4 h-4" />
              <span>LENS 04 :: WHAT-IF SANDBOX</span>
            </div>
            <span className="text-[10px] bg-amber-950/80 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded font-mono">
              VERIFIER
            </span>
          </div>

          <form onSubmit={handleTestIdea} className="flex gap-1.5 mb-2">
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              placeholder="e.g. Qh5 or Nf6"
              className="flex-1 bg-black/50 border border-amber-500/40 rounded px-2 py-1 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded text-xs font-mono font-bold transition-colors"
            >
              Analyze
            </button>
          </form>

          {quadLens.userIdea.candidateMove ? (
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-mono font-bold text-amber-300">
                  {quadLens.userIdea.candidateMove}
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono">
                  {quadLens.userIdea.verdict}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-tight font-sans">
                {quadLens.userIdea.refutation}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
              <span>Input any candidate move to evaluate before playing.</span>
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-amber-500/10 text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>Zero-hallucination engine check</span>
          <span className="text-amber-400">Active</span>
        </div>
      </div>
    </div>
  );
};


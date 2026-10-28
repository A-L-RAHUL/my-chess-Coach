import React, { useEffect } from 'react';
import { ChessScene } from './scene/ChessScene';
import { EvalBar } from './components/HUD/EvalBar';
import { AnalysisTabs } from './components/HUD/AnalysisTabs';
import { RatingSlider } from './components/Game/RatingSlider';
import { GameControls } from './components/Game/GameControls';
import { CoachPanel } from './components/Coach/CoachPanel';
import { useStockfish } from './hooks/useStockfish';
import { useThemeStore } from './store/themeStore';
import { useEngineStore } from './store/engineStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck, Activity, Sparkles, Settings } from 'lucide-react';

export const App: React.FC = () => {
  const { theme } = useThemeStore();
  const { initialized, initializing, targetRating } = useStockfish({ initialRating: 1400 });

  return (
    <div className={`min-h-screen bg-[#060610] text-white font-sans relative selection:bg-cyan-500/30 selection:text-white overflow-x-hidden`}>
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="relative z-40 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              ♟
            </motion.div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
                OmniChess AI
                <span className="text-[10px] text-zinc-500 font-normal bg-zinc-800/80 px-1.5 py-0.5 rounded-full">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-zinc-500">
                Stockfish NNUE • Local AI Coach • Zero Cloud
              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <AnimatePresence>
              {initializing && (
                <motion.div
                  className="flex items-center gap-1.5 text-amber-400"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Loading Engines...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {initialized && (
              <motion.div
                className="flex items-center gap-1.5 text-emerald-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3 Engines Active</span>
              </motion.div>
            )}

            <div className="flex items-center gap-1.5 text-cyan-400/80 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg">
              <Cpu className="w-3.5 h-3.5" />
              <span>Stockfish 19</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>$0 Cost</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto p-3 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: 3D Board + Eval Bar + Controls */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Board with eval bar */}
            <div className="flex gap-3 items-start">
              <EvalBar />
              <ChessScene />
            </div>

            {/* Game controls */}
            <GameControls />
          </div>

          {/* Right Column: Analysis + Rating + Coach */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Rating selector */}
            <RatingSlider />

            {/* Analysis tabs */}
            <AnalysisTabs />

            {/* Coach panel */}
            <CoachPanel />
          </div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.04] bg-black/20 backdrop-blur-sm px-4 py-2.5 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-cyan-500/50" />
            <span>OmniChess AI v2.0 — Stockfish 19 NNUE WASM • React Three Fiber • Framer Motion</span>
          </div>
          <div>
            <span>100% Local • Zero API Cost • MacBook Optimized</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

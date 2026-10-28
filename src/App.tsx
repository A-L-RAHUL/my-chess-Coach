import React from 'react';
import { ChessBoard } from './components/Board/ChessBoard';
import { QuadLens } from './components/HUD/QuadLens';
import { GameControls } from './components/Game/GameControls';
import { CoachPanel } from './components/Coach/CoachPanel';
import { useThemeStore } from './store/themeStore';
import { ShieldCheck, Cpu, Terminal, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const { theme } = useThemeStore();

  return (
    <div className={`min-h-screen theme-${theme} bg-[var(--bg-primary)] text-[var(--text-main)] font-sans relative selection:bg-cyan-500 selection:text-black`}>
      {/* Visual Scanline Effect */}
      <div className="absolute inset-0 scanlines pointer-events-none z-50 opacity-40" />

      {/* Top Header HUD Bar */}
      <header className="border-b border-cyan-500/20 bg-black/40 backdrop-blur-md px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center font-mono font-bold text-cyan-400 text-lg shadow-[0_0_12px_rgba(34,211,238,0.5)]">
            ♟
          </div>
          <div>
            <h1 className="text-sm font-mono font-bold tracking-wider text-cyan-300 flex items-center gap-2">
              OMNICHESS AI <span className="text-[10px] text-slate-400 font-normal">v1.0.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              GRANDMASTER MULTI-LENS ENGINE • ZERO-CLOUD MAC ENVELOPE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>M2 ENGINE: 60 FPS</span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded">
            <Cpu className="w-3.5 h-3.5" />
            <span>LOCAL STOCKFISH</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>ZERO API COST</span>
          </div>
        </div>
      </header>

      {/* Main Tactical Grid Viewport */}
      <main className="max-w-7xl mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Left Column: Primary Battle Board + Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ChessBoard interactive={true} />
          <GameControls />
        </div>

        {/* Right Column: Quad-Lens Tactical Matrix + AI Coach (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <QuadLens />
          <CoachPanel />
        </div>
      </main>

      {/* Bottom Telemetry Footer */}
      <footer className="border-t border-slate-900 bg-black/60 px-4 py-2 text-[11px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-cyan-500" />
          <span>OmniChess AI Core: Ready • WebAssembly • Offline-First</span>
        </div>
        <div>
          <span>MacBook Air M2 Optimized • Thermal Cap: 15% CPU Max</span>
        </div>
      </footer>
    </div>
  );
};


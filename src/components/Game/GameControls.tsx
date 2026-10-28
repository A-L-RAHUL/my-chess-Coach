import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useThemeStore } from '../../store/themeStore';
import { RotateCcw, Undo2, Play, Award, Volume2, VolumeX, Sparkles, Terminal } from 'lucide-react';
import { VisualTheme, PiecePack } from '../../types/chess';

export const GameControls: React.FC = () => {
  const {
    turn,
    isCheck,
    isCheckmate,
    isDraw,
    history,
    resetGame,
    undoMove,
    gameMode,
    setGameMode,
  } = useGameStore();

  const {
    theme,
    piecePack,
    soundEnabled,
    setTheme,
    setPiecePack,
    toggleSound,
  } = useThemeStore();

  const themes: VisualTheme[] = ['cyber', 'glass', 'kingdom', 'space', 'ascii'];
  const packs: PiecePack[] = ['cyber', 'glass', 'royal', 'ascii', 'classic'];

  return (
    <div className="glass-panel p-3 rounded-xl flex flex-col gap-3">
      {/* Game status telemetry bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${turn === 'w' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            {turn === 'w' ? 'WHITE TO PLAY' : 'BLACK TO PLAY'}
          </span>
          {isCheck && (
            <span className="text-[10px] bg-rose-500/20 border border-rose-500 text-rose-300 px-1.5 py-0.5 rounded font-mono animate-bounce font-bold">
              CHECK!
            </span>
          )}
          {isCheckmate && (
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
              CHECKMATE
            </span>
          )}
          {isDraw && (
            <span className="text-[10px] bg-amber-500/20 border border-amber-500 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
              DRAW
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-cyan-400">
          MOVES: {Math.ceil(history.length / 2)}
        </div>
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={undoMove}
          disabled={history.length === 0}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        <button
          onClick={resetGame}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>

      {/* Mode and Theme Selectors */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Game Mode:</span>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as any)}
            className="bg-black/60 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="play_ai">Play vs Local AI</option>
            <option value="play_local">Local Pass & Play</option>
            <option value="analysis">Deep Analysis Mode</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Theme:</span>
          </div>
          <div className="flex gap-1">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  theme === t
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Pieces:</span>
          </div>
          <div className="flex gap-1">
            {packs.map((p) => (
              <button
                key={p}
                onClick={() => setPiecePack(p)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  piecePack === p
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs font-mono text-slate-400">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>FX Audio: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Zero-Cloud Local
          </span>
        </div>
      </div>
    </div>
  );
};


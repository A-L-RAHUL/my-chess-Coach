import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngineStore } from '../../store/engineStore';
import { motion } from 'framer-motion';
import {
  RotateCcw, Undo2, Flag, Play, Pause,
  SkipBack, SkipForward, Monitor, Users, Brain, BookOpen,
} from 'lucide-react';
import type { GameMode } from '../../store/gameStore';

const MODE_OPTIONS: Array<{ id: GameMode; label: string; icon: React.ReactNode; description: string }> = [
  { id: 'play_ai',    label: 'vs AI',     icon: <Brain className="w-3.5 h-3.5" />,    description: 'Play against Stockfish' },
  { id: 'play_local', label: 'Local',     icon: <Users className="w-3.5 h-3.5" />,    description: 'Two players, one board' },
  { id: 'analysis',   label: 'Analysis',  icon: <Monitor className="w-3.5 h-3.5" />,  description: 'Free analysis mode' },
  { id: 'training',   label: 'Training',  icon: <BookOpen className="w-3.5 h-3.5" />, description: 'Practice positions' },
];

export const GameControls: React.FC = () => {
  const {
    resetGame, undoMove, gameMode, setGameMode,
    isCheckmate, isStalemate, isDraw, isGameOver, history, turn,
  } = useGameStore();
  const { isThinking, isAnalyzing } = useEngineStore();

  return (
    <div className="glass-panel rounded-xl p-3 space-y-3">
      {/* Game mode selector */}
      <div className="flex gap-1.5">
        {MODE_OPTIONS.map((mode) => {
          const isActive = gameMode === mode.id;
          return (
            <motion.button
              key={mode.id}
              onClick={() => {
                setGameMode(mode.id);
                resetGame();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border border-transparent'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {mode.icon}
              <span className="hidden sm:inline">{mode.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Game status */}
      {isGameOver && (
        <motion.div
          className={`text-center py-2 rounded-lg text-xs font-bold ${
            isCheckmate ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-zinc-800/50 text-zinc-400 border border-zinc-700/30'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {isCheckmate ? `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins!` :
           isStalemate ? 'Stalemate — Draw!' :
           isDraw ? 'Draw!' : 'Game Over'}
        </motion.div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-cyan-400 py-1">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Stockfish thinking...</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-xs font-mono text-zinc-300 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Game
        </motion.button>

        <motion.button
          onClick={undoMove}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-xs font-mono text-zinc-300 transition-colors disabled:opacity-30"
          whileTap={{ scale: 0.95 }}
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </motion.button>

        <div className="flex-1" />

        {/* Turn indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono ${
          turn === 'w'
            ? 'bg-white/[0.08] text-white border border-white/[0.1]'
            : 'bg-zinc-900 text-zinc-400 border border-zinc-700/30'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${
            turn === 'w' ? 'bg-white shadow-sm shadow-white/20' : 'bg-zinc-600'
          }`} />
          {turn === 'w' ? 'White' : 'Black'} to move
        </div>
      </div>

      {/* Move count */}
      <div className="text-[10px] font-mono text-zinc-600 text-center">
        {history.length === 0 ? 'Game not started' : `${history.length} moves played • Move ${Math.ceil(history.length / 2)}`}
      </div>
    </div>
  );
};

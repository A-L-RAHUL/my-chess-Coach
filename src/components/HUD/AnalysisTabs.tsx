/**
 * AnalysisTabs.tsx
 * Tabbed analysis panel showing engine lines, opponent threats,
 * what-if sandbox, and move history with classifications.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngineStore } from '../../store/engineStore';
import { useGameStore } from '../../store/gameStore';
import { getClassificationMeta } from '../../engine/MoveClassifier';
import {
  Cpu, ShieldAlert, Lightbulb, History,
  TrendingUp, AlertTriangle, ChevronRight,
} from 'lucide-react';

type TabId = 'lines' | 'threats' | 'ideas' | 'history';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TABS: Tab[] = [
  { id: 'lines',   label: 'Engine Lines',    icon: <Cpu className="w-3.5 h-3.5" />,         color: '#00e5ff' },
  { id: 'threats', label: 'Opponent Plan',    icon: <ShieldAlert className="w-3.5 h-3.5" />, color: '#f44336' },
  { id: 'ideas',   label: 'Test Ideas',       icon: <Lightbulb className="w-3.5 h-3.5" />,   color: '#ffc107' },
  { id: 'history', label: 'Move History',     icon: <History className="w-3.5 h-3.5" />,     color: '#8b5cf6' },
];

// ─── Engine Lines Tab ───────────────────────────────────────────

const EngineLinesPanel: React.FC = () => {
  const { currentAnalysis, isAnalyzing, liveDepth } = useEngineStore();

  if (!currentAnalysis && !isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-500 text-xs font-mono">
        Make a move to see engine analysis
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Analyzing indicator */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Analyzing at depth {liveDepth}...
        </div>
      )}

      {/* PV Lines */}
      {currentAnalysis?.lines.map((line, idx) => {
        const isFirst = idx === 0;
        const eval_ = line.score;
        const evalText = eval_.type === 'mate'
          ? (eval_.value > 0 ? `M${eval_.value}` : `-M${Math.abs(eval_.value)}`)
          : `${eval_.value >= 0 ? '+' : ''}${(eval_.value / 100).toFixed(2)}`;

        return (
          <motion.div
            key={idx}
            className={`p-2 rounded-lg border ${
              isFirst
                ? 'bg-cyan-950/30 border-cyan-500/30'
                : 'bg-zinc-900/40 border-zinc-800/50'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isFirst ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  PV {idx + 1}
                </span>
                <span className={`text-sm font-mono font-bold ${
                  isFirst ? 'text-cyan-300' : 'text-zinc-300'
                }`}>
                  {line.pvUCI[0] || '—'}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold ${
                eval_.value > 0 ? 'text-green-400' : eval_.value < 0 ? 'text-red-400' : 'text-zinc-400'
              }`}>
                {evalText}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 overflow-x-auto">
              <TrendingUp className="w-3 h-3 text-zinc-600 shrink-0" />
              {line.pvUCI.slice(0, 8).map((move, mIdx) => (
                <React.Fragment key={mIdx}>
                  {mIdx > 0 && <ChevronRight className="w-2 h-2 text-zinc-700 shrink-0" />}
                  <span className="whitespace-nowrap">{move}</span>
                </React.Fragment>
              ))}
              {line.pvUCI.length > 8 && <span className="text-zinc-600">...</span>}
            </div>
          </motion.div>
        );
      })}

      {currentAnalysis && (
        <div className="text-[10px] font-mono text-zinc-600 flex items-center justify-between pt-1">
          <span>Depth: {currentAnalysis.depth}</span>
          <span>Stockfish NNUE (WASM)</span>
        </div>
      )}
    </div>
  );
};

// ─── Opponent Threats Tab ───────────────────────────────────────

const OpponentThreatsPanel: React.FC = () => {
  const { opponentPrediction, isPredicting } = useEngineStore();
  const { turn } = useGameStore();

  if (!opponentPrediction && !isPredicting) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-500 text-xs font-mono">
        Make a move to see opponent predictions
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-mono text-rose-400">
        {isPredicting ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Predicting opponent responses...
          </>
        ) : (
          <>
            <ShieldAlert className="w-3 h-3" />
            Opponent's best responses ({turn === 'w' ? 'Black' : 'White'} to move)
          </>
        )}
      </div>

      {opponentPrediction?.lines.map((line, idx) => {
        const eval_ = line.score;
        const evalText = eval_.type === 'mate'
          ? `M${Math.abs(eval_.value)}`
          : `${(Math.abs(eval_.value) / 100).toFixed(2)}`;

        return (
          <motion.div
            key={idx}
            className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-300">
                  {line.pvUCI[0] || '—'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-rose-400/80">
                eval: {evalText}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-600 mt-1">
              {line.pvUCI.slice(0, 6).map((move, mIdx) => (
                <React.Fragment key={mIdx}>
                  {mIdx > 0 && <ChevronRight className="w-2 h-2 text-zinc-700" />}
                  <span>{move}</span>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Test Ideas Tab ─────────────────────────────────────────────

const TestIdeasPanel: React.FC = () => {
  const [inputVal, setInputVal] = useState('');

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: Wire to engine analysis of specific move
          setInputVal('');
        }}
        className="flex gap-1.5"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type a move: e.g. Qh5, Nf6, e2e4"
          className="flex-1 bg-black/40 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-200 placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono font-bold transition-colors"
        >
          Analyze
        </button>
      </form>

      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono p-4 border border-dashed border-zinc-800 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400/60 shrink-0" />
        <span>Type any candidate move to see its engine evaluation before committing to it.</span>
      </div>
    </div>
  );
};

// ─── Move History Tab ───────────────────────────────────────────

const MoveHistoryPanel: React.FC = () => {
  const { history, goToMove, currentMoveIndex } = useGameStore();

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-500 text-xs font-mono">
        No moves yet
      </div>
    );
  }

  // Group moves into pairs (white, black)
  const movePairs: Array<{ number: number; white: string; black?: string; whiteIdx: number; blackIdx?: number }> = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
      whiteIdx: i,
      blackIdx: history[i + 1] ? i + 1 : undefined,
    });
  }

  return (
    <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
      {movePairs.map((pair) => (
        <div key={pair.number} className="flex items-center gap-1 text-xs font-mono">
          <span className="text-zinc-600 w-6 text-right shrink-0">{pair.number}.</span>
          <button
            onClick={() => goToMove(pair.whiteIdx)}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              currentMoveIndex === pair.whiteIdx
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {pair.white}
          </button>
          {pair.black && pair.blackIdx !== undefined && (
            <button
              onClick={() => goToMove(pair.blackIdx!)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                currentMoveIndex === pair.blackIdx
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {pair.black}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Main Tabbed Container ──────────────────────────────────────

export const AnalysisTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('lines');

  const renderPanel = () => {
    switch (activeTab) {
      case 'lines': return <EngineLinesPanel />;
      case 'threats': return <OpponentThreatsPanel />;
      case 'ideas': return <TestIdeasPanel />;
      case 'history': return <MoveHistoryPanel />;
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-800/80">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[10px] font-mono font-bold transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={isActive ? { color: tab.color } : undefined}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ backgroundColor: tab.color }}
                  layoutId="tab-indicator"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-3 min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * EvalBar.tsx
 * Vertical evaluation bar showing engine advantage, similar to Chess.com/Lichess.
 * White advantage fills from bottom, black advantage fills from top.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngineStore } from '../../store/engineStore';
import { evalToBarPercent } from '../../hooks/useStockfish';

export const EvalBar: React.FC = () => {
  const { currentAnalysis, isAnalyzing, liveEval } = useEngineStore();

  const eval_ = liveEval || currentAnalysis?.evalScore || null;
  const whitePercent = evalToBarPercent(eval_);

  // Format evaluation text
  const evalText = (() => {
    if (!eval_) return '0.0';
    if (eval_.type === 'mate') {
      return eval_.value > 0 ? `M${eval_.value}` : `M${Math.abs(eval_.value)}`;
    }
    return Math.abs(eval_.value / 100).toFixed(1);
  })();

  const isWhiteAdvantage = eval_ ? (eval_.type === 'mate' ? eval_.value > 0 : eval_.value >= 0) : true;

  return (
    <div className="relative flex flex-col items-center gap-1.5">
      {/* Eval text */}
      <div className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
        isWhiteAdvantage ? 'bg-white/90 text-black' : 'bg-zinc-900 text-white border border-zinc-700'
      }`}>
        {evalText}
      </div>

      {/* Bar container */}
      <div className="relative w-6 h-[400px] rounded-full overflow-hidden border border-zinc-700/50"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d15 100%)',
        }}
      >
        {/* White portion (fills from bottom) */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-b-full"
          initial={{ height: '50%' }}
          animate={{ height: `${whitePercent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            background: 'linear-gradient(180deg, #f0ead6 0%, #d4c5a9 100%)',
          }}
        />

        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-zinc-500/50 z-10" />

        {/* Analyzing pulse */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              className="absolute inset-0 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ background: 'linear-gradient(180deg, #00e5ff22 0%, transparent 50%, #00e5ff22 100%)' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Depth indicator */}
      <div className="text-[9px] font-mono text-zinc-500">
        d{currentAnalysis?.depth || 0}
      </div>
    </div>
  );
};

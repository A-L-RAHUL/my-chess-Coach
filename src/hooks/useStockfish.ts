/**
 * useStockfish.ts
 * React hook that initializes Stockfish engines on mount and provides
 * convenient access to engine state and actions.
 */

import { useEffect } from 'react';
import { useEngineStore } from '../store/engineStore';

interface UseStockfishOptions {
  /** Initial ELO rating for the AI opponent. Default: 1400 */
  initialRating?: number;
  /** Auto-initialize on mount. Default: true */
  autoInit?: boolean;
}

/**
 * Hook to initialize and interact with Stockfish engines.
 * Call this once at the app root level.
 */
export function useStockfish(options: UseStockfishOptions = {}) {
  const { initialRating = 1400, autoInit = true } = options;

  const {
    initialized,
    initializing,
    error,
    targetRating,
    isAnalyzing,
    isThinking,
    isPredicting,
    currentAnalysis,
    opponentPrediction,
    liveDepth,
    liveEval,
    initEngine,
    setRating,
    analyzePosition,
    predictOpponent,
    getAIMove,
    clearAnalysis,
    destroyEngine,
  } = useEngineStore();

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInit && !initialized && !initializing) {
      initEngine(initialRating);
    }

    // Cleanup on unmount
    return () => {
      // Don't destroy on hot reload — only on full unmount
      // destroyEngine();
    };
  }, [autoInit]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Status
    initialized,
    initializing,
    error,
    targetRating,

    // Loading states
    isAnalyzing,
    isThinking,
    isPredicting,
    isEngineWorking: isAnalyzing || isThinking || isPredicting,

    // Results
    currentAnalysis,
    opponentPrediction,

    // Live progress
    liveDepth,
    liveEval,

    // Formatted eval display
    evalDisplay: formatEval(liveEval || currentAnalysis?.evalScore || null),

    // Actions
    setRating,
    analyzePosition,
    predictOpponent,
    getAIMove,
    clearAnalysis,
    destroyEngine,
    initEngine,
  };
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Format an engine evaluation for display.
 * Examples: "+1.35", "-0.50", "M3", "-M5", "0.00"
 */
function formatEval(eval_: { type: 'cp' | 'mate'; value: number } | null): string {
  if (!eval_) return '—';
  if (eval_.type === 'mate') {
    return eval_.value > 0 ? `M${eval_.value}` : `-M${Math.abs(eval_.value)}`;
  }
  const cp = eval_.value / 100;
  if (cp > 0) return `+${cp.toFixed(2)}`;
  if (cp < 0) return cp.toFixed(2);
  return '0.00';
}

/**
 * Get evaluation bar percentage (0-100 where 50 = equal).
 */
export function evalToBarPercent(eval_: { type: 'cp' | 'mate'; value: number } | null): number {
  if (!eval_) return 50;
  if (eval_.type === 'mate') {
    return eval_.value > 0 ? 95 : 5;
  }
  // Sigmoid-like mapping: cp → percentage
  // At +300cp → ~85%, at -300cp → ~15%
  const cp = eval_.value / 100;
  const percent = 50 + 50 * (2 / (1 + Math.exp(-cp / 2)) - 1);
  return Math.max(2, Math.min(98, percent));
}

/**
 * engineStore.ts
 * Zustand store managing Stockfish engine state — initialization, analysis results,
 * loading states, and engine configuration.
 *
 * This store acts as the bridge between StockfishManager (Web Workers)
 * and the React UI components.
 */

import { create } from 'zustand';
import { StockfishManager, type AnalysisResult } from '../engine/StockfishManager';
import { RATING_PRESETS, type RatingPreset } from '../engine/EloMapper';
import type { EngineLine, EngineAnalysis } from '../types/chess';

// ─── Store Shape ────────────────────────────────────────────────

interface EngineStore {
  // Engine lifecycle
  initialized: boolean;
  initializing: boolean;
  error: string | null;

  // Rating config
  targetRating: number;
  ratingPresets: RatingPreset[];

  // Analysis state
  isAnalyzing: boolean;
  isThinking: boolean; // AI opponent thinking
  isPredicting: boolean; // opponent move prediction

  // Latest analysis results
  currentAnalysis: EngineAnalysis | null;
  opponentPrediction: EngineAnalysis | null;

  // Live progress (during analysis)
  liveDepth: number;
  liveEval: { type: 'cp' | 'mate'; value: number } | null;
  liveLines: EngineLine[];

  // Actions
  initEngine: (rating?: number) => Promise<void>;
  setRating: (rating: number) => Promise<void>;
  analyzePosition: (fen: string, depth?: number) => Promise<EngineAnalysis | null>;
  predictOpponent: (fen: string, depth?: number) => Promise<EngineAnalysis | null>;
  getAIMove: (fen: string, legalMoves: string[]) => Promise<{ move: string; wasRandomized: boolean } | null>;
  clearAnalysis: () => void;
  destroyEngine: () => void;
}

// ─── Helper: Convert AnalysisResult to EngineAnalysis ───────────

function toEngineAnalysis(result: AnalysisResult): EngineAnalysis {
  return {
    bestMoveUCI: result.bestMove,
    bestMoveSAN: '', // Will be resolved by the game store using chess.js
    ponder: result.ponder,
    lines: result.lines.map((line) => ({
      pvIndex: line.pvIndex,
      depth: line.depth,
      score: line.score,
      pvUCI: line.pv,
      pvSAN: [], // Will be resolved by the game store
      nodes: line.nodes,
      nps: line.nps,
    })),
    depth: result.depth,
    evalScore: result.evalScore,
    timestamp: Date.now(),
  };
}

// ─── Store Implementation ───────────────────────────────────────

export const useEngineStore = create<EngineStore>((set, get) => ({
  // Initial state
  initialized: false,
  initializing: false,
  error: null,

  targetRating: 1400,
  ratingPresets: RATING_PRESETS,

  isAnalyzing: false,
  isThinking: false,
  isPredicting: false,

  currentAnalysis: null,
  opponentPrediction: null,

  liveDepth: 0,
  liveEval: null,
  liveLines: [],

  // ── Initialize all 3 Stockfish workers ──
  initEngine: async (rating = 1400) => {
    if (get().initialized || get().initializing) return;

    set({ initializing: true, error: null });
    try {
      await StockfishManager.init(rating);
      set({
        initialized: true,
        initializing: false,
        targetRating: rating,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Engine initialization failed';
      console.error('[EngineStore]', errorMsg);
      set({
        initializing: false,
        error: errorMsg,
      });
    }
  },

  // ── Change AI opponent rating ──
  setRating: async (rating: number) => {
    try {
      await StockfishManager.setRating(rating);
      set({ targetRating: rating });
    } catch (err) {
      console.error('[EngineStore] Failed to set rating:', err);
    }
  },

  // ── Run full-strength analysis (MultiPV) ──
  analyzePosition: async (fen: string, depth = 20) => {
    if (!get().initialized) return null;

    set({
      isAnalyzing: true,
      liveDepth: 0,
      liveEval: null,
      liveLines: [],
    });

    try {
      const result = await StockfishManager.analyzePosition(fen, depth, (info) => {
        // Live progress updates during search
        if (info.multipv === 1 || !info.multipv) {
          set({
            liveDepth: info.depth,
            liveEval: info.score,
          });
        }
      });

      const analysis = toEngineAnalysis(result);
      set({
        currentAnalysis: analysis,
        isAnalyzing: false,
      });
      return analysis;
    } catch (err) {
      console.error('[EngineStore] Analysis failed:', err);
      set({ isAnalyzing: false });
      return null;
    }
  },

  // ── Predict opponent's best responses ──
  predictOpponent: async (fen: string, depth = 16) => {
    if (!get().initialized) return null;

    set({ isPredicting: true });

    try {
      const result = await StockfishManager.predictOpponentMoves(fen, depth);
      const prediction = toEngineAnalysis(result);
      set({
        opponentPrediction: prediction,
        isPredicting: false,
      });
      return prediction;
    } catch (err) {
      console.error('[EngineStore] Prediction failed:', err);
      set({ isPredicting: false });
      return null;
    }
  },

  // ── Get AI opponent's move (rating-limited) ──
  getAIMove: async (fen: string, legalMoves: string[]) => {
    if (!get().initialized) return null;

    set({ isThinking: true });

    try {
      const result = await StockfishManager.getAIMove(fen, legalMoves);
      set({ isThinking: false });
      return { move: result.move, wasRandomized: result.wasRandomized };
    } catch (err) {
      console.error('[EngineStore] AI move failed:', err);
      set({ isThinking: false });
      return null;
    }
  },

  // ── Clear analysis state ──
  clearAnalysis: () => {
    set({
      currentAnalysis: null,
      opponentPrediction: null,
      liveDepth: 0,
      liveEval: null,
      liveLines: [],
    });
  },

  // ── Destroy all engine workers ──
  destroyEngine: () => {
    StockfishManager.destroy();
    set({
      initialized: false,
      initializing: false,
      currentAnalysis: null,
      opponentPrediction: null,
      isAnalyzing: false,
      isThinking: false,
      isPredicting: false,
    });
  },
}));

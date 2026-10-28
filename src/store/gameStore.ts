/**
 * gameStore.ts
 * Core chess game state — manages board, moves, turns, and game modes.
 *
 * Key change from v1: No longer uses fake `positionEval.ts` heuristics.
 * All engine work is delegated to `engineStore.ts` (Stockfish WASM workers).
 * This store handles only chess.js game logic and coordinates engine calls.
 */

import { create } from 'zustand';
import { Chess, Square } from 'chess.js';
import { soundEngine } from '../audio/soundEngine';
import { useEngineStore } from './engineStore';
import { parseUCIMove } from '../engine/StockfishManager';
import type { MoveRecord, MoveClassification } from '../types/chess';
import { classifyMove, calculateCpLoss } from '../engine/MoveClassifier';

export type GameMode = 'play_ai' | 'play_local' | 'analysis' | 'training';

// ─── Store Shape ────────────────────────────────────────────────

interface GameStore {
  chess: Chess;
  fen: string;
  history: string[];
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  selectedSquare: Square | null;
  validMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  gameMode: GameMode;
  aiDifficulty: number;

  // Move records for game review
  moveRecords: MoveRecord[];
  currentMoveIndex: number;

  // Actions
  selectSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  makeAiMove: () => Promise<void>;
  resetGame: () => void;
  undoMove: () => void;
  setGameMode: (mode: GameMode) => void;
  setAiDifficulty: (depth: number) => void;
  goToMove: (index: number) => void;

  // Engine integration
  triggerAnalysis: () => Promise<void>;
}

// ─── Helper: Convert UCI move to from/to squares ────────────────

function uciToSquares(uci: string): { from: Square; to: Square; promotion?: string } {
  const parsed = parseUCIMove(uci);
  return {
    from: parsed.from as Square,
    to: parsed.to as Square,
    promotion: parsed.promotion,
  };
}

// ─── Helper: Get all legal moves as UCI strings ─────────────────

function getLegalMovesUCI(chess: Chess): string[] {
  return chess.moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion || ''}`);
}

// ─── Store Implementation ───────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => {
  const initialChess = new Chess();

  return {
    chess: initialChess,
    fen: initialChess.fen(),
    history: [],
    turn: 'w',
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    selectedSquare: null,
    validMoves: [],
    lastMove: null,
    gameMode: 'play_ai',
    aiDifficulty: 10,
    moveRecords: [],
    currentMoveIndex: -1,

    // ── Select a square (piece selection or move target) ──
    selectSquare: (square) => {
      const { chess, selectedSquare, makeMove } = get();

      if (!square) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }

      // If already selected, try to complete the move
      if (selectedSquare) {
        const moveMade = makeMove(selectedSquare, square);
        if (moveMade) {
          set({ selectedSquare: null, validMoves: [] });
          return;
        }
      }

      // Try selecting a new piece
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        const moves = chess.moves({ square, verbose: true });
        set({
          selectedSquare: square,
          validMoves: moves.map((m) => m.to as Square),
        });
      } else {
        set({ selectedSquare: null, validMoves: [] });
      }
    },

    // ── Execute a move on the board ──
    makeMove: (from, to, promotion = 'q') => {
      const { chess, gameMode, makeAiMove, triggerAnalysis } = get();
      try {
        const move = chess.move({ from, to, promotion });
        if (!move) return false;

        // Sound triggers
        if (chess.isCheckmate() || chess.isDraw()) {
          soundEngine.playVictory();
        } else if (chess.inCheck()) {
          soundEngine.playCheck();
        } else if (move.captured) {
          soundEngine.playCapture();
        } else {
          soundEngine.playMove();
        }

        const newFen = chess.fen();
        const gameOver = chess.isGameOver();

        set({
          fen: newFen,
          history: chess.history(),
          turn: chess.turn(),
          isCheck: chess.inCheck(),
          isCheckmate: chess.isCheckmate(),
          isStalemate: chess.isStalemate(),
          isDraw: chess.isDraw(),
          isGameOver: gameOver,
          lastMove: { from, to },
          selectedSquare: null,
          validMoves: [],
          currentMoveIndex: chess.history().length - 1,
        });

        // Trigger Stockfish analysis in background (non-blocking)
        triggerAnalysis();

        // Trigger AI response if playing vs AI and game not over
        if (gameMode === 'play_ai' && !gameOver && chess.turn() === 'b') {
          // Small delay for visual feedback before AI thinks
          setTimeout(() => { makeAiMove(); }, 300);
        }

        return true;
      } catch {
        return false;
      }
    },

    // ── AI opponent makes a move using Stockfish ──
    makeAiMove: async () => {
      const { chess } = get();
      if (chess.isGameOver() || chess.turn() !== 'b') return;

      const engineStore = useEngineStore.getState();

      if (!engineStore.initialized) {
        // Fallback: random move if engine not ready yet
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return;
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        get().makeMove(randomMove.from as Square, randomMove.to as Square, randomMove.promotion);
        return;
      }

      // Get AI move from Stockfish (rating-limited)
      const legalMoves = getLegalMovesUCI(chess);
      const result = await engineStore.getAIMove(chess.fen(), legalMoves);

      if (result && !chess.isGameOver()) {
        const { from, to, promotion } = uciToSquares(result.move);
        get().makeMove(from, to, promotion);
      }
    },

    // ── Trigger background Stockfish analysis ──
    triggerAnalysis: async () => {
      const { chess } = get();
      const engineStore = useEngineStore.getState();

      if (!engineStore.initialized || chess.isGameOver()) return;

      const fen = chess.fen();

      // Run deep analysis and opponent prediction in parallel
      const [analysis, _prediction] = await Promise.all([
        engineStore.analyzePosition(fen, 20),
        engineStore.predictOpponent(fen, 16),
      ]);

      // Record move quality for the last player move
      if (analysis && get().history.length > 0) {
        const { moveRecords, history } = get();
        const lastMoveIndex = history.length - 1;

        // Only classify if we haven't already classified this move
        if (moveRecords.length < history.length) {
          const lastMoveSAN = history[lastMoveIndex];
          const bestEval = analysis.evalScore;

          // Create a new move record
          const record: MoveRecord = {
            fen,
            san: lastMoveSAN,
            uci: analysis.bestMoveUCI,
            evaluation: bestEval,
            bestMoveUCI: analysis.bestMoveUCI,
            bestMoveSAN: analysis.bestMoveSAN,
            classification: 'good' as MoveClassification, // Will be refined
            cpLoss: 0,
            depth: analysis.depth,
            moveNumber: Math.ceil(history.length / 2),
            color: history.length % 2 === 1 ? 'w' : 'b',
          };

          set({
            moveRecords: [...moveRecords, record],
          });
        }
      }
    },

    // ── Reset the game ──
    resetGame: () => {
      const freshChess = new Chess();
      const engineStore = useEngineStore.getState();
      engineStore.clearAnalysis();

      set({
        chess: freshChess,
        fen: freshChess.fen(),
        history: [],
        turn: 'w',
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isGameOver: false,
        selectedSquare: null,
        validMoves: [],
        lastMove: null,
        moveRecords: [],
        currentMoveIndex: -1,
      });

      // Trigger initial analysis
      get().triggerAnalysis();
    },

    // ── Undo last move(s) ──
    undoMove: () => {
      const { chess, gameMode } = get();
      chess.undo();
      if (gameMode === 'play_ai') {
        chess.undo(); // undo both player and AI moves
      }
      const newFen = chess.fen();
      const engineStore = useEngineStore.getState();
      engineStore.clearAnalysis();

      set({
        fen: newFen,
        history: chess.history(),
        turn: chess.turn(),
        isCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        isGameOver: chess.isGameOver(),
        selectedSquare: null,
        validMoves: [],
        lastMove: null,
        currentMoveIndex: chess.history().length - 1,
      });

      // Re-analyze the new position
      get().triggerAnalysis();
    },

    // ── Navigate to a specific move in history ──
    goToMove: (index: number) => {
      const { history } = get();
      if (index < -1 || index >= history.length) return;

      const newChess = new Chess();
      for (let i = 0; i <= index; i++) {
        newChess.move(history[i]);
      }

      set({
        chess: newChess,
        fen: newChess.fen(),
        turn: newChess.turn(),
        isCheck: newChess.inCheck(),
        currentMoveIndex: index,
        selectedSquare: null,
        validMoves: [],
      });
    },

    setGameMode: (gameMode) => set({ gameMode }),
    setAiDifficulty: (aiDifficulty) => set({ aiDifficulty }),
  };
});

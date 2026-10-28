import { create } from 'zustand';
import { Chess, Square } from 'chess.js';
import { QuadLensState, TacticalAlert } from '../types/chess';
import { soundEngine } from '../audio/soundEngine';
import { simulateMultiLens, evaluatePositionTactics } from '../chess/positionEval';

export type GameMode = 'play_ai' | 'play_local' | 'analysis' | 'training';

interface GameStore {
  chess: Chess;
  fen: string;
  history: string[];
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  selectedSquare: Square | null;
  validMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  tacticalAlerts: TacticalAlert[];
  quadLens: QuadLensState;
  gameMode: GameMode;
  aiDifficulty: number; // 1-20
  isThinking: boolean;

  // Actions
  selectSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  makeAiMove: () => void;
  resetGame: () => void;
  undoMove: () => void;
  setGameMode: (mode: GameMode) => void;
  setAiDifficulty: (depth: number) => void;
  testUserIdea: (sanOrUci: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  const initialChess = new Chess();
  const initialLens = simulateMultiLens(initialChess.fen());
  const initialTactics = evaluatePositionTactics(initialChess);

  return {
    chess: initialChess,
    fen: initialChess.fen(),
    history: [],
    turn: 'w',
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    selectedSquare: null,
    validMoves: [],
    lastMove: null,
    tacticalAlerts: initialTactics,
    quadLens: initialLens,
    gameMode: 'play_ai',
    aiDifficulty: 10,
    isThinking: false,

    selectSquare: (square) => {
      const { chess, selectedSquare, makeMove } = get();

      if (!square) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }

      // If already selected, try moving to clicked square
      if (selectedSquare) {
        const moveMade = makeMove(selectedSquare, square);
        if (moveMade) {
          set({ selectedSquare: null, validMoves: [] });
          return;
        }
      }

      // Try selecting the new square
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

    makeMove: (from, to, promotion = 'q') => {
      const { chess, gameMode, makeAiMove } = get();
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
        const tactics = evaluatePositionTactics(chess);
        const lensData = simulateMultiLens(newFen);

        set({
          fen: newFen,
          history: chess.history(),
          turn: chess.turn(),
          isCheck: chess.inCheck(),
          isCheckmate: chess.isCheckmate(),
          isStalemate: chess.isStalemate(),
          isDraw: chess.isDraw(),
          lastMove: { from, to },
          tacticalAlerts: tactics,
          quadLens: lensData,
          selectedSquare: null,
          validMoves: [],
        });

        // Trigger AI response if playing vs AI
        if (gameMode === 'play_ai' && !chess.isGameOver() && chess.turn() === 'b') {
          setTimeout(() => {
            makeAiMove();
          }, 450);
        }

        return true;
      } catch {
        return false;
      }
    },

    makeAiMove: () => {
      const { chess, quadLens } = get();
      if (chess.isGameOver() || chess.turn() !== 'b') return;

      set({ isThinking: true });

      // Use simulated engine choice
      const candidate = quadLens.masterVision.move;
      const allMoves = chess.moves({ verbose: true });
      const targetMove = allMoves.find((m) => m.san === candidate?.san) || allMoves[Math.floor(Math.random() * allMoves.length)];

      if (targetMove) {
        get().makeMove(targetMove.from as Square, targetMove.to as Square, targetMove.promotion);
      }
      set({ isThinking: false });
    },

    resetGame: () => {
      const freshChess = new Chess();
      const newFen = freshChess.fen();
      set({
        chess: freshChess,
        fen: newFen,
        history: [],
        turn: 'w',
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        selectedSquare: null,
        validMoves: [],
        lastMove: null,
        tacticalAlerts: evaluatePositionTactics(freshChess),
        quadLens: simulateMultiLens(newFen),
        isThinking: false,
      });
    },

    undoMove: () => {
      const { chess, gameMode } = get();
      chess.undo();
      if (gameMode === 'play_ai') {
        chess.undo(); // undo player and AI moves
      }
      const newFen = chess.fen();
      set({
        fen: newFen,
        history: chess.history(),
        turn: chess.turn(),
        isCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        selectedSquare: null,
        validMoves: [],
        lastMove: null,
        tacticalAlerts: evaluatePositionTactics(chess),
        quadLens: simulateMultiLens(newFen),
      });
    },

    setGameMode: (gameMode) => set({ gameMode }),
    setAiDifficulty: (aiDifficulty) => set({ aiDifficulty }),

    testUserIdea: (sanOrUci) => {
      const { fen } = get();
      const updatedLens = simulateMultiLens(fen, sanOrUci);
      set({ quadLens: updatedLens });
    },
  };
});


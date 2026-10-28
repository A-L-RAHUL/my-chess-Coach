import React from 'react';
import { Square } from 'chess.js';
import { Piece } from './Piece';
import { useGameStore } from '../../store/gameStore';
import { useThemeStore } from '../../store/themeStore';

interface BoardProps {
  interactive?: boolean;
}

export const ChessBoard: React.FC<BoardProps> = ({ interactive = true }) => {
  const {
    chess,
    selectedSquare,
    validMoves,
    lastMove,
    isCheck,
    turn,
    selectSquare,
  } = useGameStore();

  const { theme, piecePack } = useThemeStore();
  const board = chess.board();

  return (
    <div className="relative p-2 md:p-3 rounded-2xl glass-panel shadow-2xl overflow-hidden flex flex-col items-center">
      {/* Dynamic Board Matrix */}
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[540px] aspect-square rounded-xl overflow-hidden border border-cyan-500/30">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const squareName = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
            const isLight = (r + c) % 2 === 0;
            const isSelected = selectedSquare === squareName;
            const isValidMove = validMoves.includes(squareName);
            const isLastMove = lastMove?.from === squareName || lastMove?.to === squareName;
            const isKingInCheck = isCheck && piece?.type === 'k' && piece?.color === turn;

            // Background styles depending on theme and highlights
            let bgClass = isLight ? 'bg-slate-800/40' : 'bg-slate-900/80';
            if (theme === 'kingdom') {
              bgClass = isLight ? 'bg-amber-100/90' : 'bg-amber-800/90';
            } else if (theme === 'glass') {
              bgClass = isLight ? 'bg-white/10' : 'bg-black/30';
            } else if (theme === 'ascii') {
              bgClass = isLight ? 'bg-emerald-950/40' : 'bg-black/90';
            }

            if (isSelected) bgClass = 'bg-cyan-500/40 ring-2 ring-cyan-400 inset-0';
            if (isLastMove) bgClass = 'bg-yellow-500/25 ring-1 ring-yellow-400/50';
            if (isKingInCheck) bgClass = 'bg-rose-600/60 animate-pulse ring-2 ring-rose-500';

            return (
              <div
                key={squareName}
                onClick={() => interactive && selectSquare(squareName)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${bgClass}`}
              >
                {/* Board notation indicators */}
                {c === 0 && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono text-cyan-400/50 select-none">
                    {8 - r}
                  </span>
                )}
                {r === 7 && (
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-cyan-400/50 select-none">
                    {String.fromCharCode(97 + c)}
                  </span>
                )}

                {/* Valid move dot indicator */}
                {isValidMove && (
                  <div
                    className={`absolute z-10 rounded-full transition-transform ${
                      piece
                        ? 'w-full h-full border-2 border-cyan-400/80 bg-cyan-400/10'
                        : 'w-3 h-3 bg-cyan-400/90 ring-4 ring-cyan-400/30'
                    }`}
                  />
                )}

                {/* Piece representation */}
                {piece && (
                  <div className="z-20 transform transition-transform duration-100 hover:scale-105 active:scale-95">
                    <Piece type={piece.type} color={piece.color} pack={piecePack} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


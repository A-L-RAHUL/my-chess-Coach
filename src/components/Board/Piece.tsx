import React from 'react';
import { PieceType, PieceColor, PiecePack } from '../../types/chess';

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  pack: PiecePack;
}

const UNICODE_PIECES: Record<string, string> = {
  'w-k': '♔',
  'w-q': '♕',
  'w-r': '♖',
  'w-b': '♗',
  'w-n': '♘',
  'w-p': '♙',
  'b-k': '♚',
  'b-q': '♛',
  'b-r': '♜',
  'b-b': '♝',
  'b-n': '♞',
  'b-p': '♟',
};

export const Piece: React.FC<PieceProps> = ({ type, color, pack }) => {
  const isWhite = color === 'w';

  // ASCII/Unicode theme
  if (pack === 'ascii') {
    return (
      <span className={`text-4xl md:text-5xl font-mono select-none drop-shadow-md ${isWhite ? 'text-green-300' : 'text-emerald-700'}`}>
        {UNICODE_PIECES[`${color}-${type}`]}
      </span>
    );
  }

  // Neon / Cyber style piece rendering
  if (pack === 'cyber') {
    return (
      <div className={`relative flex items-center justify-center font-bold text-3xl md:text-4xl select-none transition-transform duration-200 hover:scale-110 ${isWhite ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]' : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]'}`}>
        <span className="font-mono">{UNICODE_PIECES[`${color}-${type}`]}</span>
      </div>
    );
  }

  // Glass style
  if (pack === 'glass') {
    return (
      <div className={`relative flex items-center justify-center font-bold text-3xl md:text-4xl select-none backdrop-blur-sm p-1 rounded-full ${isWhite ? 'text-blue-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]'}`}>
        <span>{UNICODE_PIECES[`${color}-${type}`]}</span>
      </div>
    );
  }

  // Royal Kingdom style
  if (pack === 'royal') {
    return (
      <div className={`relative flex items-center justify-center font-serif text-4xl md:text-5xl select-none ${isWhite ? 'text-amber-200 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]' : 'text-stone-900 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'}`}>
        <span>{UNICODE_PIECES[`${color}-${type}`]}</span>
      </div>
    );
  }

  // Classic fallback
  return (
    <div className={`text-4xl md:text-5xl select-none ${isWhite ? 'text-slate-100' : 'text-slate-900'}`}>
      {UNICODE_PIECES[`${color}-${type}`]}
    </div>
  );
};


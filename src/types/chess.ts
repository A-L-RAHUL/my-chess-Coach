export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export type VisualTheme = 'cyber' | 'glass' | 'kingdom' | 'space' | 'ascii';
export type PiecePack = 'classic' | 'cyber' | 'royal' | 'glass' | 'ascii' | 'minimal';
export type PerformanceMode = 'ultra' | 'balanced' | 'battery' | 'low';

export type MoveClassification = 'brilliant' | 'great' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  san: string;
  from: string;
  to: string;
  evalCp: number;
  mateIn?: number;
  depth: number;
  pv: string[];
  classification?: MoveClassification;
  explanation?: string;
  difficulty?: number;
}

export interface QuadLensState {
  currentLevel: {
    move?: MoveAnalysis;
    targetRating: number;
    insight: string;
    loading: boolean;
  };
  masterVision: {
    move?: MoveAnalysis;
    depth: number;
    lines: MoveAnalysis[];
    evalScore: number;
    loading: boolean;
  };
  threatMatrix: {
    opponentTopThreats: MoveAnalysis[];
    hangingSquares: string[];
    kingDangerScore: number;
    threatSummary: string;
    loading: boolean;
  };
  userIdea: {
    candidateMove?: string;
    analysis?: MoveAnalysis;
    refutation?: string;
    verdict?: string;
    evalDifference?: number;
    loading: boolean;
  };
}

export interface TacticalAlert {
  type: 'fork' | 'pin' | 'skewer' | 'check' | 'threat' | 'hanging';
  square: string;
  description: string;
}

export interface PlayerSkillProfile {
  tactics: number;
  openings: number;
  calculation: number;
  endgame: number;
  positional: number;
  kingSafety: number;
  pieceSafety: number;
  timeManagement: number;
  estimatedRating: number;
}


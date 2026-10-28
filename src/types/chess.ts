export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export type VisualTheme = 'cyber' | 'glass' | 'kingdom' | 'space' | 'ascii' | 'obsidian' | 'royal' | 'neon' | 'minimalist' | 'tournament';
export type PiecePack = 'classic' | 'cyber' | 'royal' | 'glass' | 'ascii' | 'minimal';
export type PerformanceMode = 'ultra' | 'balanced' | 'battery' | 'low';

export type MoveClassification = 'brilliant' | 'great' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

// ─── Move Analysis ──────────────────────────────────────────────

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

// ─── Engine Analysis Types ──────────────────────────────────────

export interface EngineLine {
  pvIndex: number;
  depth: number;
  score: { type: 'cp' | 'mate'; value: number };
  pvUCI: string[];           // UCI moves (e2e4 format)
  pvSAN: string[];           // SAN moves (e4 format) — resolved by game store
  nodes?: number;
  nps?: number;
}

export interface EngineAnalysis {
  bestMoveUCI: string;
  bestMoveSAN: string;
  ponder?: string;
  lines: EngineLine[];
  depth: number;
  evalScore: { type: 'cp' | 'mate'; value: number };
  timestamp: number;
}

export interface MoveRecord {
  fen: string;
  san: string;
  uci: string;
  evaluation: { type: 'cp' | 'mate'; value: number };
  bestMoveUCI: string;
  bestMoveSAN: string;
  classification: MoveClassification;
  cpLoss: number;
  depth: number;
  moveNumber: number;
  color: PieceColor;
}

// ─── Quad-Lens State ────────────────────────────────────────────

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

// ─── Tactical Alerts ────────────────────────────────────────────

export interface TacticalAlert {
  type: 'fork' | 'pin' | 'skewer' | 'check' | 'threat' | 'hanging';
  square: string;
  description: string;
}

// ─── Player Skill Profile ───────────────────────────────────────

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

// ─── Coach Types ────────────────────────────────────────────────

export interface CoachMessage {
  id: string;
  sender: 'coach' | 'user' | 'system';
  text: string;
  timestamp: number;
  agentSource?: 'coach' | 'analyst' | 'planner' | 'profiler' | 'detector';
}

export interface StrategicPlan {
  title: string;
  moves: string[];
  explanation: string;
  confidence: number;
}

// ─── Game History ───────────────────────────────────────────────

export interface GameRecord {
  id: string;
  pgn: string;
  date: string;
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  opponentRating: number;
  playerColor: PieceColor;
  accuracy: number;
  moveRecords: MoveRecord[];
  opening?: string;
}

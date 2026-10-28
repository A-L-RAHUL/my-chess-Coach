/**
 * MoveClassifier.ts
 * Classifies chess moves based on centipawn loss relative to the engine's best move.
 * Uses the same classification system as Chess.com / Lichess.
 */

import type { MoveClassification } from '../types/chess';

// ─── Classification Thresholds (centipawn loss) ─────────────────

interface ClassificationRule {
  classification: MoveClassification;
  maxCpLoss: number;
  label: string;
  emoji: string;
  color: string;
  glowColor: string;
  description: string;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    classification: 'brilliant',
    maxCpLoss: 0,
    label: 'Brilliant',
    emoji: '💎',
    color: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.5)',
    description: 'An exceptional, only move that is also a sacrifice or deep tactic.',
  },
  {
    classification: 'best',
    maxCpLoss: 0,
    label: 'Best Move',
    emoji: '🟢',
    color: '#4caf50',
    glowColor: 'rgba(76, 175, 80, 0.4)',
    description: 'The strongest move in the position.',
  },
  {
    classification: 'great',
    maxCpLoss: 20,
    label: 'Great',
    emoji: '✅',
    color: '#66bb6a',
    glowColor: 'rgba(102, 187, 106, 0.3)',
    description: 'Nearly as strong as the best move.',
  },
  {
    classification: 'good',
    maxCpLoss: 50,
    label: 'Good',
    emoji: '🔵',
    color: '#42a5f5',
    glowColor: 'rgba(66, 165, 245, 0.3)',
    description: 'A solid, reasonable move.',
  },
  {
    classification: 'inaccuracy',
    maxCpLoss: 100,
    label: 'Inaccuracy',
    emoji: '🟡',
    color: '#ffc107',
    glowColor: 'rgba(255, 193, 7, 0.3)',
    description: 'Not the best — missed a stronger continuation.',
  },
  {
    classification: 'mistake',
    maxCpLoss: 300,
    label: 'Mistake',
    emoji: '🟠',
    color: '#ff9800',
    glowColor: 'rgba(255, 152, 0, 0.3)',
    description: 'A significant error losing substantial advantage.',
  },
  {
    classification: 'blunder',
    maxCpLoss: Infinity,
    label: 'Blunder',
    emoji: '🔴',
    color: '#f44336',
    glowColor: 'rgba(244, 67, 54, 0.4)',
    description: 'A game-changing mistake — drops material or position.',
  },
];

// ─── Classification Functions ───────────────────────────────────

/**
 * Classify a move based on centipawn loss from the best engine move.
 *
 * @param cpLoss - Centipawn loss (bestEval - moveEval). Always >= 0.
 * @param isBestMove - Whether this was the #1 engine choice.
 * @param isSacrifice - Whether this move sacrificed material.
 * @param isOnlyGoodMove - Whether there was only one reasonable move.
 */
export function classifyMove(
  cpLoss: number,
  isBestMove: boolean = false,
  isSacrifice: boolean = false,
  isOnlyGoodMove: boolean = false,
): MoveClassification {
  // Brilliant: best move + sacrifice or only move with a non-obvious tactic
  if (isBestMove && isSacrifice && isOnlyGoodMove) {
    return 'brilliant';
  }

  // Best: the engine's top choice
  if (isBestMove || cpLoss === 0) {
    return 'best';
  }

  // Walk through thresholds
  const absCpLoss = Math.abs(cpLoss);
  if (absCpLoss <= 20) return 'great';
  if (absCpLoss <= 50) return 'good';
  if (absCpLoss <= 100) return 'inaccuracy';
  if (absCpLoss <= 300) return 'mistake';
  return 'blunder';
}

/**
 * Get the visual metadata for a classification.
 */
export function getClassificationMeta(classification: MoveClassification): ClassificationRule {
  return CLASSIFICATION_RULES.find((r) => r.classification === classification) || CLASSIFICATION_RULES[CLASSIFICATION_RULES.length - 1];
}

/**
 * Calculate centipawn loss between the best move eval and the played move eval.
 * Handles score perspective (positive = good for white).
 *
 * @param bestEval - Engine evaluation of the position after the best move (centipawns)
 * @param playedEval - Engine evaluation after the move actually played (centipawns)
 * @param playerColor - 'w' or 'b' — who played the move
 */
export function calculateCpLoss(
  bestEval: { type: 'cp' | 'mate'; value: number },
  playedEval: { type: 'cp' | 'mate'; value: number },
  playerColor: 'w' | 'b',
): number {
  const bestCp = evalToCentipawns(bestEval, playerColor);
  const playedCp = evalToCentipawns(playedEval, playerColor);
  // CP loss is how much worse the played move is vs the best
  return Math.max(0, bestCp - playedCp);
}

/**
 * Convert an engine eval (cp or mate) to a centipawn equivalent.
 * Mate scores are converted to large centipawn values.
 */
function evalToCentipawns(
  eval_: { type: 'cp' | 'mate'; value: number },
  perspective: 'w' | 'b',
): number {
  const sign = perspective === 'w' ? 1 : -1;
  if (eval_.type === 'mate') {
    // Mate in N moves → treat as +/- 10000 adjusted by distance
    const mateValue = eval_.value > 0 ? 10000 - eval_.value : -10000 - eval_.value;
    return mateValue * sign;
  }
  return eval_.value * sign;
}

/**
 * Calculate game accuracy percentage from move classifications.
 * Uses the same weighted formula as Chess.com.
 */
export function calculateGameAccuracy(classifications: MoveClassification[]): number {
  if (classifications.length === 0) return 0;

  const weights: Record<MoveClassification, number> = {
    brilliant: 100,
    best: 100,
    great: 90,
    good: 75,
    inaccuracy: 50,
    mistake: 25,
    blunder: 0,
  };

  const totalScore = classifications.reduce((sum, cls) => sum + (weights[cls] || 0), 0);
  return Math.round(totalScore / classifications.length);
}

/**
 * Generate a summary of move quality distribution.
 */
export function summarizeClassifications(
  classifications: MoveClassification[],
): Record<MoveClassification, number> {
  const counts: Record<MoveClassification, number> = {
    brilliant: 0,
    best: 0,
    great: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  for (const cls of classifications) {
    counts[cls]++;
  }
  return counts;
}

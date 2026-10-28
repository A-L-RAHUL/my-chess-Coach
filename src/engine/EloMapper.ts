/**
 * EloMapper.ts
 * Maps user-selected ELO ratings to Stockfish UCI engine configuration.
 *
 * Stockfish's native ELO floor is ~1320 (Skill Level 0).
 * For ratings below 1320, we use Stockfish at Skill Level 0 combined with
 * a JavaScript randomization wrapper that substitutes the engine's move
 * with a random legal move at a calculated probability.
 */

import type { UCIOption } from './UCIProtocol';

// ─── Rating Presets ─────────────────────────────────────────────

export interface RatingPreset {
  label: string;
  elo: number;
  description: string;
  tier: 'beginner' | 'intermediate' | 'advanced' | 'master' | 'grandmaster';
}

export const RATING_PRESETS: RatingPreset[] = [
  { label: '800',  elo: 800,  description: 'Absolute Beginner',   tier: 'beginner' },
  { label: '1000', elo: 1000, description: 'Casual Player',       tier: 'beginner' },
  { label: '1200', elo: 1200, description: 'Club Beginner',       tier: 'intermediate' },
  { label: '1400', elo: 1400, description: 'Club Player',         tier: 'intermediate' },
  { label: '1600', elo: 1600, description: 'Strong Club',         tier: 'advanced' },
  { label: '1800', elo: 1800, description: 'Tournament Player',   tier: 'advanced' },
  { label: '2000', elo: 2000, description: 'Expert',              tier: 'master' },
  { label: '2200', elo: 2200, description: 'National Master',     tier: 'master' },
  { label: '2400', elo: 2400, description: 'International Master', tier: 'grandmaster' },
  { label: '2500+', elo: 2500, description: 'Grandmaster',        tier: 'grandmaster' },
];

// ─── Engine Configuration ───────────────────────────────────────

export interface EngineConfig {
  /** UCI options to send before searching */
  uciOptions: UCIOption[];
  /** Probability (0-1) of substituting a random legal move. 0 = always play engine move. */
  randomMoveProbability: number;
  /** Search depth to use */
  searchDepth: number;
  /** Human-readable label for this config */
  label: string;
}

/**
 * Stockfish Skill Level → approximate CCRL engine ELO mapping.
 * Based on Stockfish documentation and community benchmarks.
 */
const SKILL_LEVEL_TO_ELO: [number, number][] = [
  [0, 1320],
  [1, 1444],
  [2, 1566],
  [3, 1729],
  [4, 1953],
  [5, 2197],
  [6, 2383],
  [7, 2518],
  [8, 2624],
  [9, 2700],
  [10, 2776],
  [11, 2835],
  [12, 2882],
  [13, 2925],
  [14, 2965],
  [15, 3000],
  [16, 3034],
  [17, 3066],
  [18, 3096],
  [19, 3125],
  [20, 3650], // Full strength (uncapped NNUE)
];

/**
 * Map a target ELO rating to Stockfish engine configuration.
 */
export function mapEloToConfig(targetElo: number): EngineConfig {
  // ── Sub-1320: Stockfish can't play this weak natively ──
  if (targetElo < 1320) {
    // Use Skill Level 0 (~1320) with random move substitution
    const randomProb = calculateRandomProbability(targetElo);
    return {
      uciOptions: [
        { name: 'UCI_LimitStrength', value: true },
        { name: 'UCI_Elo', value: 1320 },
        { name: 'Skill Level', value: 0 },
      ],
      randomMoveProbability: randomProb,
      searchDepth: 5,
      label: `~${targetElo} ELO (Simulated)`,
    };
  }

  // ── 1320-3100: Use UCI_LimitStrength for precise control ──
  if (targetElo <= 3100) {
    const skillLevel = findClosestSkillLevel(targetElo);
    return {
      uciOptions: [
        { name: 'UCI_LimitStrength', value: true },
        { name: 'UCI_Elo', value: Math.max(1320, Math.min(targetElo, 3190)) },
        { name: 'Skill Level', value: skillLevel },
      ],
      randomMoveProbability: 0,
      searchDepth: Math.min(8 + skillLevel, 22),
      label: `~${targetElo} ELO`,
    };
  }

  // ── 3100+: Full strength, no limits ──
  return {
    uciOptions: [
      { name: 'UCI_LimitStrength', value: false },
      { name: 'Skill Level', value: 20 },
    ],
    randomMoveProbability: 0,
    searchDepth: 22,
    label: 'Full Strength (~3650+ ELO)',
  };
}

/**
 * Get the engine configuration for the full-strength analysis engine.
 * Used by the Deep Analyzer and Opponent Predictor workers.
 */
export function getAnalysisConfig(multiPV: number = 1): UCIOption[] {
  return [
    { name: 'UCI_LimitStrength', value: false },
    { name: 'Skill Level', value: 20 },
    { name: 'MultiPV', value: multiPV },
    { name: 'Threads', value: 1 },
    { name: 'Hash', value: 32 },
  ];
}

// ─── Internal Helpers ───────────────────────────────────────────

/**
 * Calculate the probability of substituting a random legal move
 * to simulate sub-1320 ELO play.
 *
 * At 800 ELO: ~55% random moves
 * At 1000 ELO: ~30% random moves
 * At 1200 ELO: ~10% random moves
 * At 1320 ELO: 0% random moves (native Stockfish)
 */
function calculateRandomProbability(targetElo: number): number {
  if (targetElo >= 1320) return 0;
  // Linear interpolation from 800 (55%) to 1320 (0%)
  const minElo = 600;
  const maxElo = 1320;
  const maxProb = 0.65;
  const t = Math.max(0, Math.min(1, (maxElo - targetElo) / (maxElo - minElo)));
  return t * maxProb;
}

/**
 * Find the closest Skill Level for a given ELO target.
 */
function findClosestSkillLevel(targetElo: number): number {
  let bestLevel = 0;
  let bestDiff = Infinity;
  for (const [level, elo] of SKILL_LEVEL_TO_ELO) {
    const diff = Math.abs(elo - targetElo);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestLevel = level;
    }
  }
  return bestLevel;
}

/**
 * Get the approximate ELO for a given Stockfish Skill Level.
 */
export function skillLevelToElo(skillLevel: number): number {
  const entry = SKILL_LEVEL_TO_ELO.find(([level]) => level === skillLevel);
  return entry ? entry[1] : 1320;
}

/**
 * Get tier color for UI display.
 */
export function getTierColor(tier: RatingPreset['tier']): string {
  switch (tier) {
    case 'beginner':     return '#4ade80'; // green
    case 'intermediate': return '#38bdf8'; // sky blue
    case 'advanced':     return '#a78bfa'; // purple
    case 'master':       return '#f59e0b'; // amber
    case 'grandmaster':  return '#ef4444'; // red
  }
}

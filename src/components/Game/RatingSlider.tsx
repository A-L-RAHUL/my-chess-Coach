/**
 * RatingSlider.tsx
 * Beautiful horizontal ELO rating selector with preset stops,
 * tier coloring, and dynamic label display.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useEngineStore } from '../../store/engineStore';
import { RATING_PRESETS, getTierColor } from '../../engine/EloMapper';
import { Zap, Crown, Swords, GraduationCap, Star } from 'lucide-react';

const TIER_ICONS: Record<string, React.ReactNode> = {
  beginner: <Star className="w-3.5 h-3.5" />,
  intermediate: <Swords className="w-3.5 h-3.5" />,
  advanced: <GraduationCap className="w-3.5 h-3.5" />,
  master: <Zap className="w-3.5 h-3.5" />,
  grandmaster: <Crown className="w-3.5 h-3.5" />,
};

export const RatingSlider: React.FC = () => {
  const { targetRating, setRating, initialized } = useEngineStore();

  const currentPreset = RATING_PRESETS.find((p) => p.elo === targetRating)
    || RATING_PRESETS.find((p) => Math.abs(p.elo - targetRating) < 100)
    || RATING_PRESETS[3]; // default to 1400

  const tierColor = getTierColor(currentPreset.tier);

  return (
    <div className="glass-panel rounded-xl p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-zinc-300">
          OPPONENT STRENGTH
        </span>
        <motion.div
          className="flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}
          key={currentPreset.elo}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {TIER_ICONS[currentPreset.tier]}
          <span>{currentPreset.label} ELO</span>
        </motion.div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {RATING_PRESETS.map((preset) => {
          const isActive = targetRating === preset.elo;
          const color = getTierColor(preset.tier);

          return (
            <motion.button
              key={preset.elo}
              onClick={() => initialized && setRating(preset.elo)}
              disabled={!initialized}
              className="relative px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all disabled:opacity-40"
              style={{
                backgroundColor: isActive ? `${color}30` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : '#888',
                border: isActive ? `1.5px solid ${color}66` : '1px solid rgba(255,255,255,0.08)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {preset.label}
              {isActive && (
                <motion.div
                  className="absolute -bottom-0.5 left-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: color }}
                  layoutId="rating-indicator"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Description */}
      <motion.p
        className="text-[10px] font-mono text-zinc-500"
        key={currentPreset.elo}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {currentPreset.description} — {
          currentPreset.tier === 'beginner' ? 'Makes frequent mistakes, misses basic tactics' :
          currentPreset.tier === 'intermediate' ? 'Solid fundamentals, occasional tactical oversights' :
          currentPreset.tier === 'advanced' ? 'Strong positional play, sharp tactical awareness' :
          currentPreset.tier === 'master' ? 'Deep calculation, rarely makes tactical errors' :
          'Near-perfect play, engine-level accuracy'
        }
      </motion.p>

      {!initialized && (
        <div className="text-[10px] font-mono text-amber-400/80 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Engine loading...
        </div>
      )}
    </div>
  );
};

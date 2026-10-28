import { create } from 'zustand';
import { VisualTheme, PiecePack, PerformanceMode } from '../types/chess';

interface ThemeStore {
  theme: VisualTheme;
  piecePack: PiecePack;
  performanceMode: PerformanceMode;
  particlesEnabled: boolean;
  soundEnabled: boolean;
  setTheme: (theme: VisualTheme) => void;
  setPiecePack: (pack: PiecePack) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  toggleSound: () => void;
  toggleParticles: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'cyber',
  piecePack: 'cyber',
  performanceMode: 'balanced',
  particlesEnabled: true,
  soundEnabled: true,
  setTheme: (theme) => set({ theme }),
  setPiecePack: (piecePack) => set({ piecePack }),
  setPerformanceMode: (performanceMode) => set({ 
    performanceMode,
    particlesEnabled: performanceMode === 'ultra' || performanceMode === 'balanced'
  }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleParticles: () => set((state) => ({ particlesEnabled: !state.particlesEnabled })),
}));


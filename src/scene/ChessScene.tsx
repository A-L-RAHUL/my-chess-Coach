/**
 * ChessScene.tsx
 * Main 3D chess scene: combines Canvas, board, pieces, lighting,
 * post-processing, camera, and particles into a single cinematic viewport.
 */

import React, { useMemo, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Board3D } from './Board3D';
import { Piece3D } from './Piece3D';
import { Particles } from './Particles';
import { useGameStore } from '../store/gameStore';
import { useThemeStore } from '../store/themeStore';
import type { Square } from 'chess.js';

// ─── Constants ──────────────────────────────────────────────────

const SQUARE_SIZE = 1.0;
const BOARD_OFFSET = (8 * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2;

/**
 * Convert a chess square name (e.g., "e4") to 3D world coordinates.
 */
function squareTo3D(square: string): [number, number, number] {
  const col = square.charCodeAt(0) - 97; // a=0, h=7
  const row = 8 - parseInt(square[1]);    // 8=0, 1=7
  const x = col * SQUARE_SIZE - BOARD_OFFSET;
  const z = row * SQUARE_SIZE - BOARD_OFFSET;
  return [x, 0.01, z]; // Slightly above board surface
}

// ─── Scene Content ──────────────────────────────────────────────

const SceneContent: React.FC = () => {
  const {
    chess,
    selectedSquare,
    validMoves,
    lastMove,
    isCheck,
    turn,
    selectSquare,
  } = useGameStore();

  const { theme, particlesEnabled } = useThemeStore();
  const board = chess.board();

  // Build piece data from board state
  const pieces = useMemo(() => {
    const result: Array<{
      key: string;
      type: string;
      color: 'w' | 'b';
      square: string;
      position: [number, number, number];
    }> = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const square = `${String.fromCharCode(97 + c)}${8 - r}`;
          result.push({
            key: `${piece.color}${piece.type}-${square}`,
            type: piece.type,
            color: piece.color,
            square,
            position: squareTo3D(square),
          });
        }
      }
    }
    return result;
  }, [board]);

  // Highlight sets
  const highlightedSquares = useMemo(
    () => new Set(validMoves as string[]),
    [validMoves],
  );

  const lastMoveSquares = useMemo(
    () => new Set(lastMove ? [lastMove.from, lastMove.to] as string[] : []),
    [lastMove],
  );

  // Find king square if in check
  const checkSquare = useMemo(() => {
    if (!isCheck) return null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          return `${String.fromCharCode(97 + c)}${8 - r}`;
        }
      }
    }
    return null;
  }, [isCheck, turn, board]);

  const handleSquareClick = useCallback((square: string) => {
    selectSquare(square as Square);
  }, [selectSquare]);

  const handlePieceClick = useCallback((square: string) => {
    selectSquare(square as Square);
  }, [selectSquare]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} color={0xccddff} />
      <directionalLight
        position={[5, 12, 5]}
        intensity={2.0}
        color={0xfff5e6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />
      {/* Cyan rim light for cinematic edge separation */}
      <directionalLight
        position={[-8, 6, -3]}
        intensity={0.6}
        color={0x00ccff}
      />
      {/* Warm fill from the other side */}
      <pointLight
        position={[6, 4, -6]}
        intensity={0.4}
        color={0xff9944}
        distance={20}
      />

      {/* Environment for reflections */}
      <Environment preset="city" background={false} />

      {/* Board */}
      <Board3D
        theme={theme}
        highlightedSquares={highlightedSquares}
        lastMoveSquares={lastMoveSquares}
        selectedSquare={selectedSquare}
        checkSquare={checkSquare}
        onSquareClick={handleSquareClick}
      />

      {/* Pieces */}
      {pieces.map((p) => (
        <Piece3D
          key={p.key}
          type={p.type}
          color={p.color}
          position={p.position}
          isSelected={selectedSquare === p.square}
          isLastMoved={lastMove?.from === p.square || lastMove?.to === p.square}
          isInCheck={checkSquare === p.square}
          theme={theme}
          onClick={() => handlePieceClick(p.square)}
        />
      ))}

      {/* Atmospheric particles */}
      {particlesEnabled && <Particles theme={theme} count={400} radius={14} />}

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minPolarAngle={0.3}
        minDistance={5}
        maxDistance={22}
        target={[0, 0, 0]}
      />
    </>
  );
};

// ─── Main Canvas Wrapper ────────────────────────────────────────

export const ChessScene: React.FC = () => {
  const { performanceMode } = useThemeStore();

  return (
    <div className="w-full aspect-square max-w-[640px] rounded-2xl overflow-hidden relative"
      style={{
        boxShadow: '0 0 60px rgba(0, 229, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Canvas
        camera={{
          position: [0, 10, 9],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={performanceMode === 'ultra' ? [1, 2] : [1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: performanceMode === 'battery' ? 'low-power' : 'high-performance',
        }}
        style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #050510 50%, #0a0a0f 100%)' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        {/* Post-processing */}
        {performanceMode !== 'low' && performanceMode !== 'battery' && (
          <EffectComposer>
            <Bloom
              intensity={0.15}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.4}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Gradient overlay at bottom for seamless blending */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a1a] to-transparent pointer-events-none" />
    </div>
  );
};

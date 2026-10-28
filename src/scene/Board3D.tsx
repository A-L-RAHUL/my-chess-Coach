/**
 * Board3D.tsx
 * The 3D chess board component rendered in React Three Fiber.
 * Creates an 8x8 board with PBR materials, coordinate labels, and hover effects.
 */

import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface Board3DProps {
  theme?: string;
  highlightedSquares?: Set<string>;
  lastMoveSquares?: Set<string>;
  selectedSquare?: string | null;
  checkSquare?: string | null;
  onSquareClick?: (square: string) => void;
  onSquareHover?: (square: string | null) => void;
}

// ─── Constants ──────────────────────────────────────────────────

const BOARD_SIZE = 8;
const SQUARE_SIZE = 1.0;
const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2 - SQUARE_SIZE / 2;
const BOARD_Y = 0;
const BORDER_WIDTH = 0.3;

// ─── Materials ──────────────────────────────────────────────────

function createBoardMaterials(theme: string) {
  const lightColor = theme === 'neon' ? 0x1a1a3e : theme === 'royal' ? 0xf5e6c8 : 0x2a2a3a;
  const darkColor = theme === 'neon' ? 0x0a0a1e : theme === 'royal' ? 0x8b4513 : 0x151520;

  return {
    light: new THREE.MeshPhysicalMaterial({
      color: lightColor,
      metalness: theme === 'neon' ? 0.6 : 0.05,
      roughness: theme === 'neon' ? 0.3 : 0.45,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    }),
    dark: new THREE.MeshPhysicalMaterial({
      color: darkColor,
      metalness: theme === 'neon' ? 0.7 : 0.1,
      roughness: theme === 'neon' ? 0.25 : 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    }),
    highlight: new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.25,
      metalness: 0.3,
      roughness: 0.3,
      transparent: true,
      opacity: 0.55,
    }),
    selected: new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7,
    }),
    lastMove: new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.15,
      metalness: 0.2,
      roughness: 0.4,
      transparent: true,
      opacity: 0.4,
    }),
    check: new THREE.MeshPhysicalMaterial({
      color: 0xff2222,
      emissive: 0xff0000,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7,
    }),
    border: new THREE.MeshPhysicalMaterial({
      color: theme === 'neon' ? 0x0a0a1e : 0x0d0d15,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 1.0,
    }),
    validMove: new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
    }),
  };
}

// ─── Square Component ───────────────────────────────────────────

const BoardSquare: React.FC<{
  position: [number, number, number];
  isLight: boolean;
  squareName: string;
  materials: ReturnType<typeof createBoardMaterials>;
  isSelected: boolean;
  isHighlighted: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = React.memo(({
  position,
  isLight,
  squareName,
  materials,
  isSelected,
  isHighlighted,
  isLastMove,
  isCheck,
  onClick,
  onHover,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Determine material
  let material = isLight ? materials.light : materials.dark;
  if (isCheck) material = materials.check;
  else if (isSelected) material = materials.selected;
  else if (isLastMove) material = materials.lastMove;

  // Slight lift on hover
  const y = hovered ? 0.02 : 0;

  return (
    <group position={position}>
      {/* Main square */}
      <mesh
        ref={meshRef}
        position={[0, y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); onHover(true); }}
        onPointerLeave={() => { setHovered(false); onHover(false); }}
        receiveShadow
      >
        <planeGeometry args={[SQUARE_SIZE * 0.98, SQUARE_SIZE * 0.98]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Valid move indicator dot */}
      {isHighlighted && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 16]} />
          <primitive object={materials.validMove} attach="material" />
        </mesh>
      )}
    </group>
  );
});

BoardSquare.displayName = 'BoardSquare';

// ─── Board Component ────────────────────────────────────────────

export const Board3D: React.FC<Board3DProps> = ({
  theme = 'obsidian',
  highlightedSquares = new Set(),
  lastMoveSquares = new Set(),
  selectedSquare = null,
  checkSquare = null,
  onSquareClick,
  onSquareHover,
}) => {
  const materials = useMemo(() => createBoardMaterials(theme), [theme]);

  // Generate squares
  const squares = useMemo(() => {
    const result: Array<{
      key: string;
      position: [number, number, number];
      isLight: boolean;
      squareName: string;
    }> = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = col * SQUARE_SIZE - BOARD_OFFSET;
        const z = row * SQUARE_SIZE - BOARD_OFFSET;
        const isLight = (row + col) % 2 === 0;
        const squareName = `${String.fromCharCode(97 + col)}${8 - row}`;

        result.push({
          key: squareName,
          position: [x, BOARD_Y, z],
          isLight,
          squareName,
        });
      }
    }
    return result;
  }, []);

  // Coordinate labels
  const labels = useMemo(() => {
    const files = 'abcdefgh'.split('');
    const ranks = '87654321'.split('');
    const items: Array<{ text: string; position: [number, number, number]; key: string }> = [];

    // File labels (a-h) along bottom
    files.forEach((file, i) => {
      items.push({
        text: file,
        position: [i * SQUARE_SIZE - BOARD_OFFSET, 0.01, BOARD_OFFSET + 0.6],
        key: `file-${file}`,
      });
    });

    // Rank labels (1-8) along left
    ranks.forEach((rank, i) => {
      items.push({
        text: rank,
        position: [-BOARD_OFFSET - 0.6, 0.01, i * SQUARE_SIZE - BOARD_OFFSET],
        key: `rank-${rank}`,
      });
    });

    return items;
  }, []);

  return (
    <group>
      {/* Board base / border */}
      <mesh
        position={[0, -0.08, 0]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[
          BOARD_SIZE * SQUARE_SIZE + BORDER_WIDTH * 2,
          0.15,
          BOARD_SIZE * SQUARE_SIZE + BORDER_WIDTH * 2,
        ]} />
        <primitive object={materials.border} attach="material" />
      </mesh>

      {/* Board squares */}
      {squares.map((sq) => (
        <BoardSquare
          key={sq.key}
          position={sq.position}
          isLight={sq.isLight}
          squareName={sq.squareName}
          materials={materials}
          isSelected={selectedSquare === sq.squareName}
          isHighlighted={highlightedSquares.has(sq.squareName)}
          isLastMove={lastMoveSquares.has(sq.squareName)}
          isCheck={checkSquare === sq.squareName}
          onClick={() => onSquareClick?.(sq.squareName)}
          onHover={(h) => h ? onSquareHover?.(sq.squareName) : onSquareHover?.(null)}
        />
      ))}

      {/* Coordinate labels */}
      {labels.map((lbl) => (
        <Text
          key={lbl.key}
          position={lbl.position}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color={theme === 'neon' ? '#00e5ff' : '#667788'}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {lbl.text}
        </Text>
      ))}

      {/* Ambient glow plane underneath the board */}
      <mesh position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial
          color={theme === 'neon' ? 0x001133 : 0x050510}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

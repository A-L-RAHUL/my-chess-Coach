/**
 * Piece3D.tsx
 * Individual 3D chess piece component with selection highlight,
 * hover glow, and smooth GSAP-powered animations.
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getPieceGeometry, getPieceMaterial, getPieceScale } from './PieceFactory';

interface Piece3DProps {
  type: string;        // p, n, b, r, q, k
  color: 'w' | 'b';
  position: [number, number, number];
  isSelected?: boolean;
  isLastMoved?: boolean;
  isInCheck?: boolean;
  theme?: string;
  onClick?: () => void;
}

const SQUARE_SIZE = 1.0;

export const Piece3D: React.FC<Piece3DProps> = React.memo(({
  type,
  color,
  position,
  isSelected = false,
  isLastMoved = false,
  isInCheck = false,
  theme = 'obsidian',
  onClick,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Target position for smooth animation
  const targetPos = useRef(new THREE.Vector3(...position));
  const currentPos = useRef(new THREE.Vector3(...position));
  const animating = useRef(false);

  // Update target when position prop changes
  useEffect(() => {
    const newTarget = new THREE.Vector3(...position);
    if (!currentPos.current.equals(newTarget)) {
      targetPos.current.copy(newTarget);
      animating.current = true;
    }
  }, [position]);

  // Geometry and material
  const geometry = useMemo(() => getPieceGeometry(type), [type]);
  const material = useMemo(() => {
    const mat = getPieceMaterial(color, theme).clone();
    return mat;
  }, [color, theme]);

  // Scale based on piece type
  const scale = useMemo(() => getPieceScale(type), [type]);

  // Animate position + hover/selection effects
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const group = meshRef.current;

    // Smooth position interpolation (piece gliding)
    if (animating.current) {
      currentPos.current.lerp(targetPos.current, Math.min(1, delta * 8));
      group.position.copy(currentPos.current);

      if (currentPos.current.distanceTo(targetPos.current) < 0.01) {
        currentPos.current.copy(targetPos.current);
        group.position.copy(targetPos.current);
        animating.current = false;
      }
    }

    // Hover bob effect
    if (hovered || isSelected) {
      group.position.y = currentPos.current.y + Math.sin(Date.now() * 0.004) * 0.05 + 0.08;
    }

    // Check flash effect
    if (isInCheck) {
      const flash = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
      material.emissive.setRGB(flash * 0.8, 0, 0);
      material.emissiveIntensity = flash * 0.6;
    } else if (isSelected) {
      material.emissive.setHex(0x00e5ff);
      material.emissiveIntensity = 0.3;
    } else if (isLastMoved) {
      material.emissive.setHex(0xffd700);
      material.emissiveIntensity = 0.15;
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <mesh
        geometry={geometry}
        material={material}
        scale={[scale, scale, scale]}
        castShadow
        receiveShadow
      />

      {/* Selection ring glow */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.42, 32]} />
          <meshBasicMaterial
            color={isSelected ? 0x00e5ff : 0xffffff}
            transparent
            opacity={isSelected ? 0.6 : 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
});

Piece3D.displayName = 'Piece3D';

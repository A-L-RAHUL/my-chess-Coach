/**
 * Particles.tsx
 * Background atmospheric particle system for the 3D chess scene.
 * Creates a slowly drifting field of glowing particles for a cinematic atmosphere.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ParticlesProps {
  count?: number;
  radius?: number;
  color?: string;
  theme?: string;
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 500,
  radius = 15,
  color,
  theme = 'obsidian',
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Determine particle color based on theme
  const particleColor = useMemo(() => {
    if (color) return new THREE.Color(color);
    switch (theme) {
      case 'neon': return new THREE.Color(0x00e5ff);
      case 'royal': return new THREE.Color(0xffd700);
      case 'minimalist': return new THREE.Color(0x888888);
      case 'tournament': return new THREE.Color(0x44aa44);
      default: return new THREE.Color(0x4488cc);
    }
  }, [color, theme]);

  // Generate random particle positions
  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Random position in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.3 + Math.random() * 0.7);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = (Math.random() - 0.3) * radius * 0.6; // Slightly above center
      pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Slow drift velocities
      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.002 + 0.001; // Slight upward drift
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003;

      // Random sizes
      sz[i] = 0.02 + Math.random() * 0.06;
    }

    return [pos, vel, sz];
  }, [count, radius]);

  // Animate particles
  useFrame(() => {
    if (!pointsRef.current) return;
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      posArray[i3] += velocities[i3];
      posArray[i3 + 1] += velocities[i3 + 1];
      posArray[i3 + 2] += velocities[i3 + 2];

      // Wrap around when particles drift too far
      const dist = Math.sqrt(
        posArray[i3] ** 2 +
        posArray[i3 + 1] ** 2 +
        posArray[i3 + 2] ** 2,
      );

      if (dist > radius * 1.2) {
        posArray[i3] *= -0.5;
        posArray[i3 + 1] = (Math.random() - 0.3) * radius * 0.4;
        posArray[i3 + 2] *= -0.5;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={0.05}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

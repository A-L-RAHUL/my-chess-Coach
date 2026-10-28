/**
 * PieceFactory.ts
 * Procedural 3D chess piece geometry generator using Three.js.
 * Creates all 6 piece types using lathe geometries and Boolean-like compositions.
 * No external model files needed — everything is generated in code.
 */

import * as THREE from 'three';

// ─── Piece Profiles (Lathe points for each piece type) ──────────

/**
 * Generate a lathe geometry from a silhouette profile.
 * Points describe the right-side outline, rotated around the Y axis.
 */
function createLatheGeometry(points: THREE.Vector2[], segments: number = 32): THREE.LatheGeometry {
  return new THREE.LatheGeometry(points, segments);
}

// ── Pawn ──
function createPawnPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.35, 0),
    new THREE.Vector2(0.38, 0.02),
    new THREE.Vector2(0.38, 0.05),
    new THREE.Vector2(0.30, 0.08),
    new THREE.Vector2(0.22, 0.15),
    new THREE.Vector2(0.20, 0.20),
    new THREE.Vector2(0.18, 0.30),
    new THREE.Vector2(0.12, 0.40),
    new THREE.Vector2(0.10, 0.45),
    new THREE.Vector2(0.14, 0.48),
    new THREE.Vector2(0.15, 0.50),
    new THREE.Vector2(0.14, 0.52),
    new THREE.Vector2(0.10, 0.55),
    new THREE.Vector2(0.18, 0.58),
    new THREE.Vector2(0.20, 0.65),
    new THREE.Vector2(0.18, 0.72),
    new THREE.Vector2(0.12, 0.76),
    new THREE.Vector2(0, 0.78),
  ];
}

// ── Rook ──
function createRookPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.40, 0),
    new THREE.Vector2(0.42, 0.02),
    new THREE.Vector2(0.42, 0.06),
    new THREE.Vector2(0.32, 0.10),
    new THREE.Vector2(0.24, 0.18),
    new THREE.Vector2(0.22, 0.30),
    new THREE.Vector2(0.20, 0.50),
    new THREE.Vector2(0.22, 0.65),
    new THREE.Vector2(0.18, 0.70),
    new THREE.Vector2(0.16, 0.72),
    new THREE.Vector2(0.20, 0.74),
    new THREE.Vector2(0.28, 0.76),
    new THREE.Vector2(0.30, 0.80),
    new THREE.Vector2(0.30, 0.90),
    new THREE.Vector2(0.25, 0.90),
    new THREE.Vector2(0.25, 0.85),
    new THREE.Vector2(0.18, 0.85),
    new THREE.Vector2(0.18, 0.90),
    new THREE.Vector2(0, 0.90),
  ];
}

// ── Knight (simplified profile + neck tilt) ──
function createKnightPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.38, 0),
    new THREE.Vector2(0.40, 0.02),
    new THREE.Vector2(0.40, 0.06),
    new THREE.Vector2(0.30, 0.10),
    new THREE.Vector2(0.22, 0.18),
    new THREE.Vector2(0.20, 0.30),
    new THREE.Vector2(0.18, 0.45),
    new THREE.Vector2(0.15, 0.55),
    new THREE.Vector2(0.20, 0.60),
    new THREE.Vector2(0.25, 0.70),
    new THREE.Vector2(0.22, 0.80),
    new THREE.Vector2(0.16, 0.90),
    new THREE.Vector2(0.10, 0.95),
    new THREE.Vector2(0.08, 1.00),
    new THREE.Vector2(0, 1.02),
  ];
}

// ── Bishop ──
function createBishopPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.38, 0),
    new THREE.Vector2(0.40, 0.02),
    new THREE.Vector2(0.40, 0.06),
    new THREE.Vector2(0.30, 0.10),
    new THREE.Vector2(0.22, 0.18),
    new THREE.Vector2(0.20, 0.30),
    new THREE.Vector2(0.16, 0.45),
    new THREE.Vector2(0.13, 0.55),
    new THREE.Vector2(0.15, 0.58),
    new THREE.Vector2(0.16, 0.60),
    new THREE.Vector2(0.14, 0.62),
    new THREE.Vector2(0.10, 0.70),
    new THREE.Vector2(0.14, 0.78),
    new THREE.Vector2(0.16, 0.85),
    new THREE.Vector2(0.12, 0.92),
    new THREE.Vector2(0.06, 0.97),
    new THREE.Vector2(0.04, 1.02),
    new THREE.Vector2(0.06, 1.04),
    new THREE.Vector2(0, 1.06),
  ];
}

// ── Queen ──
function createQueenPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.42, 0),
    new THREE.Vector2(0.44, 0.03),
    new THREE.Vector2(0.44, 0.07),
    new THREE.Vector2(0.34, 0.12),
    new THREE.Vector2(0.26, 0.22),
    new THREE.Vector2(0.22, 0.35),
    new THREE.Vector2(0.20, 0.50),
    new THREE.Vector2(0.18, 0.60),
    new THREE.Vector2(0.14, 0.70),
    new THREE.Vector2(0.16, 0.72),
    new THREE.Vector2(0.18, 0.74),
    new THREE.Vector2(0.16, 0.76),
    new THREE.Vector2(0.12, 0.80),
    new THREE.Vector2(0.15, 0.85),
    new THREE.Vector2(0.20, 0.92),
    new THREE.Vector2(0.22, 0.96),
    new THREE.Vector2(0.18, 1.02),
    new THREE.Vector2(0.12, 1.08),
    new THREE.Vector2(0.08, 1.12),
    new THREE.Vector2(0.04, 1.15),
    new THREE.Vector2(0.06, 1.17),
    new THREE.Vector2(0, 1.18),
  ];
}

// ── King ──
function createKingPoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.42, 0),
    new THREE.Vector2(0.44, 0.03),
    new THREE.Vector2(0.44, 0.07),
    new THREE.Vector2(0.34, 0.12),
    new THREE.Vector2(0.26, 0.22),
    new THREE.Vector2(0.22, 0.38),
    new THREE.Vector2(0.20, 0.52),
    new THREE.Vector2(0.18, 0.62),
    new THREE.Vector2(0.14, 0.72),
    new THREE.Vector2(0.16, 0.74),
    new THREE.Vector2(0.18, 0.76),
    new THREE.Vector2(0.16, 0.78),
    new THREE.Vector2(0.12, 0.82),
    new THREE.Vector2(0.15, 0.88),
    new THREE.Vector2(0.20, 0.95),
    new THREE.Vector2(0.22, 1.00),
    new THREE.Vector2(0.18, 1.06),
    new THREE.Vector2(0.12, 1.12),
    new THREE.Vector2(0.08, 1.16),
    new THREE.Vector2(0, 1.18),
  ];
}

// ─── Geometry Cache ─────────────────────────────────────────────

const geometryCache = new Map<string, THREE.BufferGeometry>();

/**
 * Get or create a geometry for a piece type.
 * Geometries are cached for performance.
 */
export function getPieceGeometry(type: string): THREE.BufferGeometry {
  if (geometryCache.has(type)) {
    return geometryCache.get(type)!;
  }

  let geometry: THREE.BufferGeometry;

  switch (type) {
    case 'p':
      geometry = createLatheGeometry(createPawnPoints(), 24);
      break;
    case 'r':
      geometry = createLatheGeometry(createRookPoints(), 24);
      break;
    case 'n': {
      // Knight: use lathe for base, but stretch to give horse-like shape
      const base = createLatheGeometry(createKnightPoints(), 16);
      base.scale(1, 1, 0.65); // Flatten slightly for horse silhouette
      geometry = base;
      break;
    }
    case 'b':
      geometry = createLatheGeometry(createBishopPoints(), 24);
      break;
    case 'q':
      geometry = createLatheGeometry(createQueenPoints(), 32);
      break;
    case 'k': {
      // King: lathe body + cross on top
      const kingBody = createLatheGeometry(createKingPoints(), 32);
      // Add a cross on top using box geometries
      const crossVertical = new THREE.BoxGeometry(0.04, 0.18, 0.04);
      crossVertical.translate(0, 1.27, 0);
      const crossHorizontal = new THREE.BoxGeometry(0.12, 0.04, 0.04);
      crossHorizontal.translate(0, 1.22, 0);

      // Merge geometries
      const merged = mergeGeometries([kingBody, crossVertical, crossHorizontal]);
      geometry = merged || kingBody;
      break;
    }
    default:
      geometry = new THREE.SphereGeometry(0.3, 16, 16);
  }

  // Center and compute normals
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  geometryCache.set(type, geometry);
  return geometry;
}

/**
 * Simple geometry merge (concatenate vertex buffers).
 */
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0];

  const positions: number[] = [];
  const normals: number[] = [];

  for (const geo of geometries) {
    const pos = geo.getAttribute('position');
    const norm = geo.getAttribute('normal');
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }
    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  return merged;
}

// ─── Materials ──────────────────────────────────────────────────

const materialCache = new Map<string, THREE.MeshPhysicalMaterial>();

/**
 * Get PBR material for a piece color.
 */
export function getPieceMaterial(
  color: 'w' | 'b',
  theme: string = 'obsidian',
): THREE.MeshPhysicalMaterial {
  const key = `${color}-${theme}`;
  if (materialCache.has(key)) {
    return materialCache.get(key)!;
  }

  let material: THREE.MeshPhysicalMaterial;

  if (color === 'w') {
    material = new THREE.MeshPhysicalMaterial({
      color: theme === 'neon' ? 0x00ffff : 0xf0ead6,
      metalness: theme === 'neon' ? 0.8 : 0.1,
      roughness: theme === 'neon' ? 0.2 : 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      envMapIntensity: 1.2,
      emissive: theme === 'neon' ? 0x001a1a : 0x000000,
      emissiveIntensity: theme === 'neon' ? 0.3 : 0,
    });
  } else {
    material = new THREE.MeshPhysicalMaterial({
      color: theme === 'neon' ? 0xff00ff : 0x1a1a2e,
      metalness: theme === 'neon' ? 0.8 : 0.6,
      roughness: theme === 'neon' ? 0.2 : 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
      envMapIntensity: 1.5,
      emissive: theme === 'neon' ? 0x1a001a : 0x000000,
      emissiveIntensity: theme === 'neon' ? 0.3 : 0,
    });
  }

  materialCache.set(key, material);
  return material;
}

/**
 * Get highlight material for selected/hovered pieces.
 */
export function getHighlightMaterial(type: 'selected' | 'lastMove' | 'check'): THREE.MeshPhysicalMaterial {
  switch (type) {
    case 'selected':
      return new THREE.MeshPhysicalMaterial({
        color: 0x00e5ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.4,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9,
      });
    case 'lastMove':
      return new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.2,
        metalness: 0.2,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
    case 'check':
      return new THREE.MeshPhysicalMaterial({
        color: 0xff4444,
        emissive: 0xff0000,
        emissiveIntensity: 0.6,
        metalness: 0.3,
        roughness: 0.2,
      });
  }
}

/**
 * Get piece height for proper placement.
 */
export function getPieceHeight(type: string): number {
  switch (type) {
    case 'p': return 0.78;
    case 'r': return 0.90;
    case 'n': return 1.02;
    case 'b': return 1.06;
    case 'q': return 1.18;
    case 'k': return 1.36;
    default: return 0.6;
  }
}

/**
 * Get piece scale factor based on type.
 */
export function getPieceScale(type: string): number {
  switch (type) {
    case 'p': return 0.85;
    case 'r': return 0.90;
    case 'n': return 0.92;
    case 'b': return 0.88;
    case 'q': return 0.95;
    case 'k': return 1.0;
    default: return 0.8;
  }
}

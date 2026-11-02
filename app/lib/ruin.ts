// "Stepped digital ruin" — the signature object of the home page, described as voxel blocks (integer grid,
// y = layer from the ground). Shared by the WebGL scene (lib/space-scene.ts) and the static SVG drawing
// (components/space/Monument.vue), so both show exactly the same object.
//
//   · a four-tier ziggurat (9×9 → 7×7 → 5×5 → 3×3);
//   · one corner (+x, −z) has crumbled away — the missing blocks float above it as drifting fragments;
//   · a central stair on the +z face, marked with orange inlays, leads to a gate on the summit.
export const RUIN_UNIT = 0.42
export const RUIN_LEVELS = 4

export interface Block { x: number; y: number; z: number; glyph?: boolean }
// `rank` 0 → 1: from just broken off (low, near the bite) to fully drifted. The top few are `decoded`
// (orange outline): the eye meets the collapse first, the decoding last.
export interface Fragment extends Block { rx: number; ry: number; phase: number; rank: number; decoded: boolean }
export const DECODED_FRAGMENTS = 3
// Fragment clearance around the summit door: pillars reach |x| = 2.5 and the lintel's top is y = RUIN_LEVELS + 4;
// add a fragment's spin half-diagonal + bob.
const CLEAR_X = 3.4
const LINTEL_CLEAR = RUIN_LEVELS + 4.9

/** Deterministic 0..1 hash of an integer triple (same object on every load, server and client). */
export function hash(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}

export function ruinBlocks() {
  const solid: Block[] = []
  const fallen: Block[] = []
  for (let y = 0; y < RUIN_LEVELS; y++) {
    const r = RUIN_LEVELS - y // 9×9, 7×7, 5×5, 3×3
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        const stair = x === 0 && z === r // the stair path stays intact
        // The crumbled corner: a diagonal bite into +x / −z, deeper toward the top.
        const bite = x - z + y * 1.1 > 4.6 + hash(x, y, z) * 1.8
        // A few loose stones along the outer ring.
        const loose = y < RUIN_LEVELS - 1 && (Math.abs(x) === r || Math.abs(z) === r) && hash(z, x, y) < 0.05
        if (!stair && (bite || loose)) fallen.push({ x, y, z })
        else solid.push({ x, y, z, glyph: stair })
      }
    }
  }
  // Fallen blocks drift above the broken corner, highest-first so the stream reads upward.
  const drifting = fallen.slice(0, 16)
  const fragments: Fragment[] = drifting.map((b, i) => {
    const x = b.x + 0.6 + hash(i, 1, 2) * 1.2
    let y = b.y + 1.6 + i * 0.18 + hash(i, 3, 4) * 0.6
    const z = b.z - 0.6 - hash(i, 5, 6) * 1.2
    // Keep clear of the summit door, its landing and the stairway descending behind it (|x| < 2.5 blocks, up to
    // the lintel): a fragment that would float there rises above the lintel instead, so the stream carries on
    // upward over the door rather than piling up beside it (with room for its bob and spin, half-diagonal ≈ 0.8).
    if (Math.abs(x) < CLEAR_X && z < 2 && y < LINTEL_CLEAR) y = LINTEL_CLEAR + (i / drifting.length) * 0.7 + hash(i, 4, 7) * 0.3
    return {
      x, y, z,
      rx: hash(i, 7, 8) * 0.9,
      ry: hash(i, 9, 1) * 1.6,
      phase: hash(i, 2, 9) * Math.PI * 2,
      rank: drifting.length > 1 ? i / (drifting.length - 1) : 1,
      decoded: i >= drifting.length - DECODED_FRAGMENTS,
    }
  })
  return { solid, fragments }
}

/**
 * Summit gate, opening toward +z (the stair): a 3×3-block doorway framed by pillars standing on the 5×5 tier
 * either side of the summit, two blocks deep, under a lintel. Big and deep enough to read as a door (not a slit)
 * from the hero camera; the 3D scene continues it into a stairway down to the corridor.
 */
export const GATE: Block[] = []
for (const z of [0, -1]) {
  for (let y = RUIN_LEVELS - 1; y <= RUIN_LEVELS + 2; y++) GATE.push({ x: -2, y, z }, { x: 2, y, z })
  for (let x = -2; x <= 2; x++) GATE.push({ x, y: RUIN_LEVELS + 3, z })
}

<script setup lang="ts">
import { GATE, hash, RUIN_LEVELS, ruinBlocks } from '~/lib/ruin'
import type { Block, Fragment } from '~/lib/ruin'

// Static drawing of the stepped digital ruin — isometric projection of the same blocks as the 3D scene.
// Used on phones, low-power devices and whenever WebGL is unavailable. Decorative: aria-hidden.
// Only faces with no neighbouring block are drawn, painter's order (back to front).
const S = 26 // px per block
const iso = (x: number, y: number, z: number) => `${((x - z) * 0.866 * S).toFixed(1)},${(((x + z) * 0.5 - y) * S).toFixed(1)}`

const { solid, fragments } = ruinBlocks()
const masonry: Block[] = [...solid, ...GATE]
const occupied = new Set(masonry.map(b => `${b.x},${b.y},${b.z}`))
const has = (x: number, y: number, z: number) => occupied.has(`${x},${y},${z}`)
const shade = (b: Block, k: number) => {
  const t = (b.y / (RUIN_LEVELS + 2)) * 0.8 + hash(b.x, b.z, b.y) * 0.25
  const v = Math.round((58 + (117 - 58) * t) * k)
  return `rgb(${v} ${v + 3} ${v + 9})`
}

type Poly = { d: string; fill: string; stroke?: string }
const L = RUIN_LEVELS
const items: { key: number; polys: Poly[] }[] = [
  ...[...masonry.map(b => ({ b, loose: false })), ...fragments.map(b => ({ b, loose: true }))].map(({ b, loose }: { b: Block | Fragment; loose: boolean }) => {
    // Block spans [x-.5, x+.5] × [y, y+1] × [z-.5, z+.5]; visible sides from the viewer: +y, +x, +z.
    const [x0, x1, z0, z1, y0, y1] = [b.x - 0.5, b.x + 0.5, b.z - 0.5, b.z + 0.5, b.y, b.y + 1]
    const edge = 'decoded' in b && b.decoded ? '#FF5B1F' : undefined
    const polys: Poly[] = []
    if (loose || !has(b.x, b.y + 1, b.z)) polys.push({ d: [iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)].join(' '), fill: shade(b, 1.15), stroke: edge })
    if (loose || !has(b.x + 1, b.y, b.z)) polys.push({ d: [iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1), iso(x1, y0, z0)].join(' '), fill: shade(b, 0.62), stroke: edge })
    if (loose || !has(b.x, b.y, b.z + 1)) polys.push({ d: [iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y0, z1), iso(x0, y0, z1)].join(' '), fill: shade(b, 0.85), stroke: edge })
    // Orange inlay on each stair tread.
    if (b.glyph) polys.push({ d: [iso(-0.14, y1, z0 + 0.03), iso(0.14, y1, z0 + 0.03), iso(0.14, y1, z1 - 0.03), iso(-0.14, y1, z1 - 0.03)].join(' '), fill: '#FF5B1F' })
    return { key: b.x + b.y + b.z, polys }
  }),
  // The door (same as the 3D scene): a warm, dark recess at the back of the opening, drawn before the pillars,
  // and an orange outline on its front face, drawn last.
  { key: -99, polys: [{ d: [iso(-1.5, L, -1.5), iso(1.5, L, -1.5), iso(1.5, L + 3, -1.5), iso(-1.5, L + 3, -1.5)].join(' '), fill: '#3A1A0E' }] },
  { key: 99, polys: [{ d: [iso(-1.5, L, 0.5), iso(1.5, L, 0.5), iso(1.5, L + 3, 0.5), iso(-1.5, L + 3, 0.5)].join(' '), fill: 'none', stroke: '#FF5B1F' }] },
]
const polys = items.sort((p, q) => p.key - q.key).flatMap(i => i.polys)
const pts = polys.flatMap(p => p.d.split(' ').map(xy => xy.split(',').map(Number) as [number, number]))
const [minX, maxX] = [Math.min(...pts.map(p => p[0])) - 4, Math.max(...pts.map(p => p[0])) + 4]
const [minY, maxY] = [Math.min(...pts.map(p => p[1])) - 4, Math.max(...pts.map(p => p[1])) + 4]
const viewBox = `${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`
</script>

<template>
  <svg :viewBox="viewBox" fill="none" aria-hidden="true">
    <polygon v-for="(f, i) in polys" :key="i" :points="f.d" :fill="f.fill" :stroke="f.stroke ?? '#0C0D0F'" :stroke-width="f.stroke ? 1 : 0.8" stroke-linejoin="round" />
  </svg>
</template>

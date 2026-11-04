<script setup lang="ts">
import type { projects } from '~/data/home'

// Data-driven node/edge diagram for a case study. Coordinates in the data are on a 100 × 62 grid.
// Labelled "示意" in the caption: it explains structure described in the project text; it is not a screenshot.
type Diagram = NonNullable<NonNullable<(typeof projects)[number]['detail']>['diagram']>
const props = defineProps<{ diagram: Diagram; accent: string }>()

const NW = 184
const NH = 66
const byId = computed(() => Object.fromEntries(props.diagram.nodes.map(n => [n.id, { x: n.x * 10, y: n.y * 10 + 10 }])))
const edges = computed(() => props.diagram.edges.map(([a, b, label]) => {
  const p = byId.value[a]!
  const q = byId.value[b]!
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
  const name = (id: string) => props.diagram.nodes.find(n => n.id === id)?.label ?? id
  // The gap between two nodes in a row is narrower than most labels, so those sit above the row; a vertical line
  // keeps its label beside it. Labels are drawn after the nodes, so a long one is never hidden behind a box.
  const at = p.y === q.y ? { x: mid.x, y: p.y - NH / 2 - 12, anchor: 'middle' }
    : p.x === q.x ? { x: mid.x + 12, y: mid.y + 6, anchor: 'start' }
    : { x: mid.x, y: mid.y - 14, anchor: 'middle' }
  return { key: `${a}-${b}`, points: `${p.x},${p.y} ${mid.x},${mid.y} ${q.x},${q.y}`, mid, at, label, text: `${name(a)} → ${name(b)}${label ? ` (${label})` : ''}` }
}))
const uid = useId()

// SVG text never wraps, so a long label (Japanese runs longer than Chinese) shrinks to fit its box instead of
// spilling out. Width estimate: CJK / kana / full-width glyphs ≈ 1em, everything else ≈ 0.6em.
const fit = (text: string, size: number, max = NW - 24) => {
  const em = [...text].reduce((w, c) => w + (/[　-鿿＀-￯]/.test(c) ? 1 : 0.6), 0)
  return Math.min(size, Math.floor(max / em))
}
</script>

<template>
  <figure class="space-y-3">
    <div class="overflow-x-auto rounded-sm bg-surface-container-lowest shadow-sm">
      <svg viewBox="0 0 1000 640" class="block min-w-[560px]" role="img" :aria-labelledby="`${uid}-t ${uid}-d`">
        <title :id="`${uid}-t`">{{ diagram.title }}</title>
        <desc :id="`${uid}-d`">{{ diagram.caption }} {{ $t('projects.diagramEdges') }}{{ edges.map(e => e.text).join(', ') }}</desc>
        <defs>
          <marker :id="`${uid}-arrow`" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M1 1 L9 5 L1 9 z" fill="#6B6E74" />
          </marker>
        </defs>
        <g fill="none" stroke="#9A9DA3" stroke-width="1.5">
          <polyline v-for="e in edges" :key="e.key" :points="e.points" :marker-mid="`url(#${uid}-arrow)`" />
        </g>
        <g v-for="n in diagram.nodes" :key="n.id" :transform="`translate(${n.x * 10 - NW / 2} ${n.y * 10 + 10 - NH / 2})`">
          <rect :width="NW" :height="NH" rx="3" fill="#ffffff" stroke="#CFCCC5" stroke-width="1.5" />
          <rect width="5" :height="NH" :fill="accent" />
          <text :x="NW / 2 + 2" :y="n.sub ? 29 : 40" text-anchor="middle" :font-size="fit(n.label, 21)" font-weight="600" fill="#0C0D0F">{{ n.label }}</text>
          <text v-if="n.sub" :x="NW / 2 + 2" y="52" text-anchor="middle" :font-size="fit(n.sub, 15)" fill="#55575C" font-family="'Geist Mono', monospace">{{ n.sub }}</text>
        </g>
        <g font-family="'Geist Mono', monospace" font-size="18" fill="#55575C">
          <template v-for="e in edges" :key="e.key">
            <text v-if="e.label" :x="e.at.x" :y="e.at.y" :text-anchor="e.at.anchor" paint-order="stroke" stroke="#ffffff" stroke-width="6">{{ e.label }}</text>
          </template>
        </g>
      </svg>
    </div>
    <figcaption class="flex gap-2 text-body-sm text-on-surface-variant">
      <span class="shrink-0 self-start rounded-sm border border-hairline-strong px-1.5 font-mono text-label-sm text-on-surface-variant">{{ $t('projects.diagramTag') }}</span>
      {{ diagram.caption }}
    </figcaption>
  </figure>
</template>

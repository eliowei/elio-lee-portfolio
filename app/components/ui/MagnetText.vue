<script setup lang="ts">
// Display text whose letters behave like jelly standing on the baseline when the mouse pointer comes near (hero title):
// each letter stays where it is, but its top leans toward the pointer (skew) and stretches or squashes (scale), driven by a
// slightly under-damped spring, so it overshoots and wobbles back when the pointer leaves. Mouse only, off for reduced motion.
// Letters are separate inline-blocks, so Latin words are wrapped in a nowrap box (they must not break mid-word) while CJK
// characters may wrap between each other. A screen reader gets the plain text; the split letters are aria-hidden.
// `plain` renders ordinary text with no effect: split letters cannot follow Japanese line-breaking rules (small kana, phrase breaks).
const props = defineProps<{ text: string; plain?: boolean }>()

const WORD = /^[\w'’,.-]+$/
const tokens = computed(() => (props.text.match(/\s+|[\w'’,.-]+|./gu) ?? []).map(t => ({
  space: /^\s+$/.test(t),
  word: WORD.test(t),
  chars: [...t],
})))

const RADIUS = 170 // px around the pointer that reaches a letter
const LEAN = 16 // deg a letter's top can lean toward the pointer
const STRETCH = 0.16 // how much a letter grows (pointer above it) or shrinks (below it)
const STIFFNESS = 170 // spring: higher = snappier
const DAMPING = 9 // spring: lower = more wobble (critical damping would be ~26)
const root = ref<HTMLElement>()

type Jelly = { lean: number; leanV: number; grow: number; growV: number; tLean: number; tGrow: number }

onMounted(() => {
  if (props.plain || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const html = document.documentElement
  const chars = [...root.value!.querySelectorAll<HTMLElement>('[data-ch]')]
  for (const c of chars) c.style.transformOrigin = '50% 88%' // stands on the baseline
  const st: Jelly[] = chars.map(() => ({ lean: 0, leanV: 0, grow: 0, growV: 0, tLean: 0, tGrow: 0 }))
  let px = 0, py = 0, near = false, dirty = false, raf = 0, last = 0

  const spring = (x: number, v: number, target: number, dt: number) => {
    v += (STIFFNESS * (target - x) - DAMPING * v) * dt
    return [x + v * dt, v] as const
  }

  const tick = (t: number) => {
    const dt = Math.min((t - last) / 1000, 0.032)
    last = t
    let busy = false
    chars.forEach((c, i) => {
      const s = st[i]!
      if (dirty) {
        if (near) {
          const r = c.getBoundingClientRect()
          const dx = px - (r.left + r.width / 2)
          const dy = py - (r.top + r.height / 2)
          const d = Math.hypot(dx, dy)
          const f = d < RADIUS ? (1 - d / RADIUS) ** 2 : 0
          s.tLean = -Math.max(-1, Math.min(1, dx / 90)) * LEAN * f // skewX turns the top left for a positive angle, so flip it
          s.tGrow = -Math.max(-1, Math.min(1, dy / 90)) * STRETCH * f // pointer above (dy < 0) → taller
        }
        else s.tLean = s.tGrow = 0
      }
      ;[s.lean, s.leanV] = spring(s.lean, s.leanV, s.tLean, dt)
      ;[s.grow, s.growV] = spring(s.grow, s.growV, s.tGrow, dt)
      const rest = !s.tLean && !s.tGrow && Math.abs(s.lean) + Math.abs(s.leanV) + Math.abs(s.grow * 10) + Math.abs(s.growV) < 0.05
      if (rest) { s.lean = s.leanV = s.grow = s.growV = 0; c.style.transform = '' }
      else { c.style.transform = `skewX(${s.lean.toFixed(2)}deg) scale(${(1 - s.grow * 0.5).toFixed(3)}, ${(1 + s.grow).toFixed(3)})`; busy = true }
    })
    dirty = false
    raf = busy ? requestAnimationFrame(tick) : 0
  }
  const kick = () => {
    dirty = true
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
  }

  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduced.matches) return
    px = e.clientX
    py = e.clientY
    const r = root.value!.getBoundingClientRect()
    const was = near
    near = px > r.left - RADIUS && px < r.right + RADIUS && py > r.top - RADIUS && py < r.bottom + RADIUS
    if (near || was) kick()
  }
  const leave = () => { if (near) { near = false; kick() } }

  document.addEventListener('pointermove', move, { passive: true })
  html.addEventListener('pointerleave', leave)
  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    document.removeEventListener('pointermove', move)
    html.removeEventListener('pointerleave', leave)
    for (const c of chars) { c.style.transform = ''; c.style.transformOrigin = '' }
  })
})
</script>

<template>
  <span v-if="plain">{{ text }}</span>
  <span v-else ref="root">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">
      <template v-for="(t, i) in tokens" :key="i">
        <template v-if="t.space">{{ ' ' }}</template>
        <span v-else-if="t.word" class="inline-block whitespace-nowrap"><span v-for="(c, j) in t.chars" :key="j" data-ch class="inline-block">{{ c }}</span></span>
        <template v-else><span v-for="(c, j) in t.chars" :key="j" data-ch class="inline-block">{{ c }}</span></template>
      </template>
    </span>
  </span>
</template>

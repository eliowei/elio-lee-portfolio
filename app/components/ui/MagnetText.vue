<script setup lang="ts">
// Display text whose letters behave like jelly standing on the baseline when the mouse pointer comes near (hero title):
// each letter stays where it is, but its top leans toward the pointer (skew) and stretches or squashes (scale), driven by a
// slightly under-damped spring, so it overshoots and wobbles back when the pointer leaves. Mouse only, off for reduced motion.
// Letters are separate inline-blocks. To keep line breaking sensible, every WORD is one nowrap box: Latin words by their spaces,
// Chinese and Japanese words by Intl.Segmenter (so a small kana or a compound is never split, and punctuation stays with the
// word before it). Lines can break only between words. A screen reader gets the plain text; the split letters are aria-hidden.
// `entrance` adds the opening animation of each letter (only while <html data-intro> is set, see the styles below).
const props = defineProps<{ text: string; lang?: string; entrance?: boolean; entranceDelay?: number }>()

const LATIN = /^[\w'’,.-]+$/
const tokens = computed(() => {
  const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(props.lang === 'ja' ? 'ja' : 'zh', { granularity: 'word' }) : null
  const out: { space: boolean; chars: string[]; start: number }[] = []
  for (const m of props.text.matchAll(/\s+|[\w'’,.-]+|[^\s\w'’,.-]+/gu)) {
    const t = m[0]
    const start = m.index!
    if (/^\s+$/.test(t)) out.push({ space: true, chars: [' '], start })
    else if (LATIN.test(t) || !segmenter) out.push({ space: false, chars: [...t], start })
    else {
      const words: string[] = []
      for (const s of segmenter.segment(t)) {
        if (!s.isWordLike && words.length) words[words.length - 1] += s.segment
        else words.push(s.segment)
      }
      let at = start
      for (const w of words) {
        out.push({ space: false, chars: [...w], start: at })
        at += w.length
      }
    }
  }
  return out
})

const entranceStyle = (index: number) => ({ '--scan-delay': ((props.entranceDelay ?? 0) + index / Math.max(1, props.text.length - 1) * 800) + 'ms' })

const RADIUS = 170 // px around the pointer that reaches a letter
const LEAN = 16 // deg a letter's top can lean toward the pointer
const STRETCH = 0.16 // how much a letter grows (pointer above it) or shrinks (below it)
const STIFFNESS = 170 // spring: higher = snappier
const DAMPING = 9 // spring: lower = more wobble (critical damping would be ~26)
const root = ref<HTMLElement>()

type Jelly = { lean: number; leanV: number; grow: number; growV: number; tLean: number; tGrow: number }

onMounted(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
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
    if (e.pointerType !== 'mouse' || reduced.matches || document.documentElement.dataset.intro === '1') return // the letters are busy waking up
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
  <span ref="root">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">
      <template v-for="(t, i) in tokens" :key="i">
        <template v-if="t.space">{{ ' ' }}</template>
        <span v-else class="inline-block whitespace-nowrap"><span v-for="(c, j) in t.chars" :key="j" data-ch class="inline-block"><span :class="{ 'scan-char': entrance }" :style="entrance ? entranceStyle(t.start + j) : undefined">{{ c }}</span></span></span>
      </template>
    </span>
  </span>
</template>

<style scoped>
/* Only while <html data-intro> is set (every full load of the home page): without it the title is simply there. */
:global(html[data-intro='1'] .scan-char) { display: inline-block; transform-origin: 50% 100%; animation: glyph-awaken 550ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: var(--scan-delay); }
@keyframes glyph-awaken {
  0% { opacity: 0.12; color: var(--lab-signal); transform: perspective(500px) translateY(0.32em) rotateY(-65deg) rotateX(35deg) scaleY(0.6); }
  45% { opacity: 1; color: var(--lab-signal); }
  100% { opacity: 1; color: inherit; transform: none; }
}
</style>

<script setup lang="ts">
// Display text whose letters lean toward the mouse pointer when it comes near (hero title). Mouse only, off for reduced motion.
// Letters are separate inline-blocks, so Latin words are wrapped in a nowrap box (they must not break mid-word) while CJK
// characters may wrap between each other. A screen reader gets the plain text; the split letters are aria-hidden.
// The offset uses the `translate` property, so it never clashes with the parent's own transform / animation.
// `plain` renders ordinary text with no effect: split letters cannot follow Japanese line-breaking rules (small kana, phrase breaks).
const props = defineProps<{ text: string; plain?: boolean }>()

const WORD = /^[\w'’,.-]+$/
const tokens = computed(() => (props.text.match(/\s+|[\w'’,.-]+|./gu) ?? []).map(t => ({
  space: /^\s+$/.test(t),
  word: WORD.test(t),
  chars: [...t],
})))

const RADIUS = 140 // px around the pointer that reaches a letter
const MAX = 16 // px a letter can lean
const root = ref<HTMLElement>()

onMounted(() => {
  if (props.plain || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const html = document.documentElement
  const chars = [...root.value!.querySelectorAll<HTMLElement>('[data-ch]')]
  const st = chars.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 }))
  let px = 0, py = 0, near = false, dirty = false, raf = 0, last = 0

  const tick = (t: number) => {
    const k = 1 - Math.pow(1 - 0.18, Math.min(t - last, 50) / 16.7)
    last = t
    let busy = false
    chars.forEach((c, i) => {
      const s = st[i]!
      if (dirty) {
        if (near) {
          const r = c.getBoundingClientRect()
          const dx = px - (r.left + r.width / 2 - s.x) // undo our own offset, or the centre would chase itself
          const dy = py - (r.top + r.height / 2 - s.y)
          const d = Math.hypot(dx, dy)
          const pull = d < RADIUS ? (1 - d / RADIUS) ** 2 * MAX * Math.min(1, d / 40) : 0 // eases to 0 right under the pointer, no flip-flop
          s.tx = d ? (dx / d) * pull : 0
          s.ty = d ? (dy / d) * pull : 0
        }
        else s.tx = s.ty = 0
      }
      s.x += (s.tx - s.x) * k
      s.y += (s.ty - s.y) * k
      if (!s.tx && !s.ty && Math.abs(s.x) + Math.abs(s.y) < 0.05) { s.x = s.y = 0; c.style.translate = '' }
      else { c.style.translate = `${s.x.toFixed(1)}px ${s.y.toFixed(1)}px`; busy = true }
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
    for (const c of chars) c.style.translate = ''
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

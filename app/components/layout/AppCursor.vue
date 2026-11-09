<script setup lang="ts">
// Custom cursor for mouse users: a dot that follows at once, plus an always-visible ring that trails slightly.
// Over interactive elements the ring grows and shows a short hint ("VIEW", or the element's data-cursor-label).
// Pressing (and holding, e.g. while dragging) turns the ring into a diamond.
// Touch / coarse pointers never activate it. The native cursor is hidden only after the first mouse move, so if this
// script fails the page keeps its normal cursor. Text fields keep the native I-beam.
const root = ref<HTMLElement>()
const ring = ref<HTMLElement>()
const dot = ref<HTMLElement>()
const label = ref<HTMLElement>()

const INTERACTIVE = 'a[href],button,[role="button"],summary,select,label[for],[data-cursor="hover"]'
// Navigation, the footer and links inside articles show the hover ring without a hint (or opt out per element with data-cursor-label="").
const QUIET = '.nav-bar,#mobile-nav,.app-footer,.prose-post,[data-cursor-label=""]'
const TEXT = 'input,textarea,[contenteditable]:not([contenteditable="false"])'
const FOLLOW = 0.22 // ring catch-up per 60fps frame: a short trail, not a drag

onMounted(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const el = root.value!
  const dotEl = dot.value!
  const ringEl = ring.value!
  const labelEl = label.value!
  let hint = ''
  const html = document.documentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let x = 0, y = 0, rx = 0, ry = 0, raf = 0, last = 0, active = false

  const tick = (t: number) => {
    const k = reduced.matches ? 1 : 1 - Math.pow(1 - FOLLOW, Math.min(t - last, 50) / 16.7)
    last = t
    rx += (x - rx) * k
    ry += (y - ry) * k
    ringEl.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(tick) : 0
  }

  const off = () => {
    active = false
    el.dataset.on = '0'
    el.dataset.press = '0'
    html.classList.remove('has-cursor')
  }

  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    x = e.clientX
    y = e.clientY
    if (!active) {
      active = true
      rx = x
      ry = y
      el.dataset.on = '1'
      html.classList.add('has-cursor')
    }
    dotEl.style.transform = `translate3d(${x}px,${y}px,0)`
    const t = e.target instanceof Element ? e.target : null
    const hit = t?.closest(INTERACTIVE)
    el.dataset.out = '0'
    // A modal <dialog> sits in the browser's top layer, above any z-index, so the custom cursor would be hidden behind it:
    // hand the pointer back to the native cursor while one is open.
    const modal = !!document.querySelector('dialog[open]')
    html.classList.toggle('has-cursor', !modal)
    el.dataset.hide = modal || t?.closest(TEXT) ? '1' : '0'
    const on = !!hit && !hit.matches(':disabled,[aria-disabled="true"]')
    el.dataset.hover = on ? '1' : '0'
    const quiet = on && !!hit.closest(QUIET)
    el.dataset.quiet = quiet ? '1' : '0'
    const next = on && !quiet ? (hit as HTMLElement).dataset.cursorLabel || 'VIEW' : hint
    if (next !== hint) labelEl.textContent = hint = next
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
  }
  // Held until release, so a drag keeps the diamond even when the pointer leaves the element it started on.
  const down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') el.dataset.press = '1'
    else if (active) off()
  }
  const up = () => { el.dataset.press = '0' }
  const leave = () => { el.dataset.out = '1' }

  document.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerdown', down, true)
  for (const ev of ['pointerup', 'pointercancel', 'dragend']) window.addEventListener(ev, up, true)
  window.addEventListener('blur', up)
  html.addEventListener('pointerleave', leave)

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerdown', down, true)
    for (const ev of ['pointerup', 'pointercancel', 'dragend']) window.removeEventListener(ev, up, true)
    window.removeEventListener('blur', up)
    html.removeEventListener('pointerleave', leave)
    html.classList.remove('has-cursor')
  })
})
</script>

<template>
  <div ref="root" class="app-cursor" aria-hidden="true">
    <span ref="ring" class="app-cursor-pos"><span class="app-cursor-ring" /><span ref="label" class="app-cursor-label" /></span>
    <span ref="dot" class="app-cursor-pos"><span class="app-cursor-dot" /></span>
  </div>
</template>

<style>
html.has-cursor,
html.has-cursor *:not(input):not(textarea):not(select) { cursor: none !important; }

/* Idle: white, blended with the page so it reads on both the dark stage and the light paper.
   Hover / press: plain signal orange (a blend would turn it blue on light paper). */
.app-cursor { position: fixed; inset: 0; z-index: 200; pointer-events: none; opacity: 0; mix-blend-mode: difference; transition: opacity 0.2s; }
.app-cursor[data-on='1'] { opacity: 1; }
.app-cursor[data-out='1'], .app-cursor[data-hide='1'] { opacity: 0; }
.app-cursor[data-hover='1'], .app-cursor[data-press='1'] { mix-blend-mode: normal; }

.app-cursor-pos { position: absolute; left: 0; top: 0; will-change: transform; }

.app-cursor-dot {
  position: absolute; left: -3px; top: -3px; width: 6px; height: 6px;
  border-radius: 9999px; background: #fff;
  transition: transform 0.15s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.15s;
}
.app-cursor-ring {
  position: absolute; left: -21px; top: -21px; width: 42px; height: 42px;
  border-radius: 9999px; border: 1px solid #fff; background: transparent;
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), border-color 0.2s, background-color 0.2s, border-radius 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), backdrop-filter 0.3s, -webkit-backdrop-filter 0.3s;
}
.app-cursor-label {
  position: absolute; left: -32px; top: -32px; width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  font: 600 9px/1 var(--font-mono, ui-monospace, monospace); color: var(--lab-signal);
  /* padding-left offsets the trailing letter-space so the word stays centred as the spacing animates */
  padding-left: 0.02em; letter-spacing: 0.02em;
  opacity: 0; transform: translateY(5px);
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), letter-spacing 0.4s cubic-bezier(0.2, 0.7, 0.2, 1), padding-left 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}

/* Hover: the ring keeps its size and gets a frosted dark-brown ground (tint + blur), so the orange hint reads on light and dark
   pages alike. Navigation (data-quiet) only turns the ring orange. Idle and press keep a see-through ring. */
.app-cursor[data-hover='1'] .app-cursor-ring { border-color: var(--lab-signal); }
.app-cursor[data-hover='1']:not([data-quiet='1']) .app-cursor-ring { background: rgb(58 26 14 / 0.72); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.app-cursor[data-hover='1'] .app-cursor-dot { background: var(--lab-signal); }
.app-cursor[data-hover='1']:not([data-quiet='1']) .app-cursor-dot { transform: scale(0); }
.app-cursor[data-hover='1']:not([data-quiet='1']) .app-cursor-label { opacity: 1; transform: translateY(0); letter-spacing: 0.14em; padding-left: 0.14em; }

/* Press (held): the ring becomes a diamond (the shape of the station markers); the dot stays at its centre. */
.app-cursor[data-press='1'] .app-cursor-ring { border-color: var(--lab-signal); border-radius: 2px; transform: rotate(45deg) scale(0.72); transition-duration: 0.6s, 0.3s, 0.3s, 0.6s, 0.3s, 0.3s; transition-timing-function: cubic-bezier(0.3, 0.6, 0.2, 1); }
.app-cursor[data-press='1'] .app-cursor-dot { background: var(--lab-signal); transform: scale(1); }
.app-cursor[data-press='1'] .app-cursor-label { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .app-cursor, .app-cursor-dot, .app-cursor-ring, .app-cursor-label { transition: none; }
  .app-cursor-label { transform: none; }
}
</style>

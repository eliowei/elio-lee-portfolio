<script setup lang="ts">
import type { FrameInfo, SpaceScene } from '~/lib/space-scene'

const { projects, projectImages } = useData()

// Sticky full-viewport 3D stage behind the home hero + project space. Three.js is loaded lazily, only on
// screens >= 768px with enough memory/cores and no Save-Data. Otherwise (and on WebGL failure) the static
// <SpaceMonument> drawing stands in. Station labels are HTML, positioned from the 3D projection each frame;
// they duplicate the keyboard-accessible list in <HomeSpace>, so they are mouse-only (tabindex -1).
// `selected` is the project shown in the HTML panel; `preview` is the gate the camera goes to (null: the
// corridor's exploring spot). `enter()` flies through a gate before the page navigates.
const props = defineProps<{ selected: string | null; preview: string | null; activeNote: number | null }>()
const emit = defineEmits<{ select: [slug: string]; archiveReady: [ready: boolean]; activeWork: [slug: string] }>()

const host = ref<HTMLElement>()
const status = ref<'static' | 'ready'>('static')
const labelEls = ref<Record<string, HTMLElement | null>>({})
const readout = ref<HTMLElement>()
const img = useImage()

const stations = projects.map(p => ({ slug: p.slug, code: p.code, title: p.title, accent: p.accent }))

let scene: SpaceScene | undefined
let wide: MediaQueryList | undefined
let motion: MediaQueryList | undefined
let alive = true
let starting = false

const capable = () => {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return !nav.connection?.saveData && (nav.deviceMemory ?? 8) > 4 && (nav.hardwareConcurrency ?? 8) > 4
}

let lastArchiveReady: boolean | undefined
let lastActiveWork: string | null = null
function onFrame(info: FrameInfo) {
  if (info.activeWork && info.activeWork !== lastActiveWork) {
    lastActiveWork = info.activeWork
    emit('activeWork', info.activeWork)
  }
  const wrap = host.value?.closest<HTMLElement>('[data-space]')
  wrap?.style.setProperty('--guide-x', info.guideX + 'px')
  const about = wrap?.querySelector<HTMLElement>('#about')
  if (about) about.style.setProperty('--guide-start', Math.max(0, info.guideY - about.getBoundingClientRect().top) + 'px')
  if (info.archiveReady !== lastArchiveReady) {
    lastArchiveReady = info.archiveReady
    emit('archiveReady', info.archiveReady)
  }
  for (const l of info.labels) {
    const el = labelEls.value[l.slug]
    if (!el) continue
    // Keep the label below the fixed header (h-20 on desktop); close-up cameras can project it above the viewport.
    const y = Math.max(l.y, 88 + el.offsetHeight)
    el.style.transform = `translate3d(${l.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
    el.style.opacity = l.visible ? '1' : '0'
    el.style.pointerEvents = l.visible ? 'auto' : 'none'
  }
  if (readout.value) readout.value.textContent = `AZ ${info.azimuth.toFixed(1).padStart(5, '0')}° EL ${info.elevation.toFixed(1)}°`
}

// 0 at the top of the space, 1 once the project space fills the viewport.
function progress() {
  const wrap = host.value?.closest('[data-space]')
  if (!wrap) return 0
  const approach = wrap.querySelector('[data-archive-approach]')
  const arrival = approach ? Math.min(Math.max(-approach.getBoundingClientRect().top / Math.max(approach.clientHeight, 1), 0), 1) : 0
  const notes = wrap.querySelector('[data-notes]')
  const notesProgress = notes ? Math.min(Math.max((innerHeight * 0.75 - notes.getBoundingClientRect().top) / (innerHeight * 0.75), 0), 1) : 0
  const works = wrap.querySelector('#works')
  const worksProgress = works ? Math.min(Math.max(-works.getBoundingClientRect().top / Math.max(works.clientHeight, 1), 0), 1) : 0
  return Math.min(Math.max(-wrap.getBoundingClientRect().top / (innerHeight * 0.85), 0), 1) + worksProgress + arrival + notesProgress
}
function onScroll() {
  const p = progress()
  scene?.setProgress(p)
  // The view readout belongs to the hero; fade it out as the project space takes over.
  if (readout.value) readout.value.style.opacity = p < 0.3 ? '1' : '0'
}

function stop() {
  scene?.dispose()
  scene = undefined
  status.value = 'static'
  lastArchiveReady = undefined
  emit('archiveReady', true)
  host.value?.closest('[data-space]')?.removeAttribute('data-scene-ready')
}

async function start() {
  if (scene || starting || !host.value || !capable()) return
  starting = true
  try {
    const { createSpaceScene } = await import('~/lib/space-scene')
    if (!alive || !wide?.matches || !host.value) return
    scene = createSpaceScene(host.value, {
      reduced: !!motion?.matches,
      onLost: stop,
      onFrame,
      stations: projects.map((p) => {
        const cover = projectImages[p.slug]?.cover
        return {
          slug: p.slug,
          featured: p.slug === 'game-together',
          texture: cover ? img(cover.src, { width: 640 }) : '',
          aspect: cover ? cover.w / cover.h : 16 / 10,
        }
      }),
    })
    scene.setProgress(progress())
    scene.focus(props.preview)
    scene.focusNote(props.activeNote)
    status.value = 'ready'
    host.value.closest('[data-space]')?.setAttribute('data-scene-ready', '')
  }
  catch (err) {
    console.warn('[SpaceStage] WebGL unavailable, showing the static drawing.', err)
    status.value = 'static'
  }
  finally {
    starting = false
  }
}

const sync = () => (wide?.matches ? start() : stop())
const onMotion = () => scene?.setReducedMotion(!!motion?.matches)

watch(() => props.preview, s => scene?.focus(s))
watch(() => props.activeNote, index => scene?.focusNote(index))

/** Fly through the gate (resolves at once without 3D or with reduced motion; never waits more than 1.6s). */
function enter(slug: string) {
  return scene ? Promise.race([scene.enter(slug), new Promise<void>(r => setTimeout(r, 1600))]) : Promise.resolve()
}
defineExpose({ enter })

onMounted(() => {
  wide = matchMedia('(min-width: 768px)')
  motion = matchMedia('(prefers-reduced-motion: reduce)')
  wide.addEventListener('change', sync)
  motion.addEventListener('change', onMotion)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  sync()
})

onBeforeUnmount(() => {
  alive = false
  wide?.removeEventListener('change', sync)
  motion?.removeEventListener('change', onMotion)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  stop()
})
</script>

<template>
  <div class="overflow-hidden">
    <div ref="host" aria-hidden="true" class="stage-arrival absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none" :class="status === 'ready' ? 'opacity-100' : 'opacity-0'" />
    <!-- Keeps the HTML column (title / project list) on a dark ground whatever the camera is looking at. -->
    <div aria-hidden="true" class="stage-reading-veil pointer-events-none absolute inset-y-0 left-0 w-[58%]" />
    <SpaceMonument v-if="status === 'static'" class="absolute bottom-[8%] right-[4%] h-[78%] w-auto opacity-90" />

    <template v-if="status === 'ready'">
      <button
        v-for="s in stations"
        :key="s.slug"
        :ref="el => (labelEls[s.slug] = el as HTMLElement | null)"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="station-label absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap rounded-sm border px-3 py-2 text-label-md font-medium opacity-0 transition-[opacity,background-color,border-color] duration-200 motion-reduce:transition-none"
        :class="{ 'station-label-selected': s.slug === selected }"
        @click="emit('select', s.slug)"
      >
        <span class="h-2 w-2 rotate-45" :style="{ background: s.accent }" />
        {{ s.code }} {{ s.title }}
      </button>
      <p class="pointer-events-none absolute bottom-6 right-8 z-0 font-mono text-label-sm tracking-wider text-lab-on-dark-muted" aria-hidden="true">
        <span ref="readout" class="transition-opacity duration-300">AZ 000.0° EL 0.0°</span>
      </p>
    </template>
  </div>
</template>

<style scoped>
/* Arrival push stays on the canvas layer so scroll camera and labels retain their coordinates after arrival. */
:global(html[data-intro='1'] .stage-arrival) { animation: stage-arrive 1800ms cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: 70% 50%; }
@keyframes stage-arrive { from { transform: scale(0.96); } to { transform: none; } }
.stage-reading-veil { background: linear-gradient(to right, rgb(var(--c-background)), rgb(var(--c-background) / 0.85), transparent); }

.station-label { color: #eae6de; background: #22201d; border-color: #777168; box-shadow: 0 3px 12px rgb(0 0 0 / 0.25); }
.station-label:hover, .station-label-selected { color: #fff; background: #171614; border-color: #c8c2b6; }
</style>

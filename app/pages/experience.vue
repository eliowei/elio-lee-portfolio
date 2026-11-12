<script setup lang="ts">
const { t } = useI18n()
const { roles, transitions } = useData()
const title = `${t('experience.title')} | Elio Lee`
const description = t('experience.description')

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: usePageUrl() })

// Told in time order (roles are stored newest-first): each chapter is a light reading section; the
// transitions between them — in Elio's own words — are dark full-width bands.
const chapters = [...roles].reverse().map((role, i) => ({ role, n: String(i + 1).padStart(2, '0'), turn: transitions.find(t => t.after === role.no) }))

// A thin timeline joins the chapters. The grey line is always there; the orange part follows the reader, measured at a fixed
// reading line (62% down the screen) instead of the page percentage, so it matches the chapter being read. A chapter's node turns
// orange once that line passes it, and the latest one is "current" (its dates get a little stronger). Without JS only the grey line shows.
const wrap = ref<HTMLElement>()
onMounted(() => {
  const el = wrap.value!
  const track = el.querySelector<HTMLElement>('.tl-track')!
  const nodes = [...el.querySelectorAll<HTMLElement>('[data-tl-node]')]
  if (nodes.length < 2) return
  const secs = nodes.map(n => n.closest<HTMLElement>('[data-tl-sec]')!)
  let raf = 0

  const update = () => {
    raf = 0
    const line = innerHeight * 0.62
    const tr = track.getBoundingClientRect()
    track.style.setProperty('--p', String(Math.max(0, Math.min(1, (line - tr.top) / tr.height))))
    let current = -1
    nodes.forEach((n, i) => {
      const r = n.getBoundingClientRect()
      const reached = r.top + r.height / 2 <= line
      secs[i]!.classList.toggle('is-on', reached)
      if (reached) current = i
    })
    secs.forEach((s, i) => s.classList.toggle('is-current', i === current))
  }
  // The track runs from the first node to the last one; measured because the column position depends on the page width.
  const measure = () => {
    const w = el.getBoundingClientRect()
    const a = nodes[0]!.getBoundingClientRect()
    const b = nodes[nodes.length - 1]!.getBoundingClientRect()
    const top = a.top - w.top + a.height / 2
    track.style.left = `${a.left - w.left + a.width / 2 - 1}px`
    track.style.top = `${top}px`
    track.style.height = `${b.top - w.top + b.height / 2 - top}px`
    update()
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }

  el.classList.add('tl-ready')
  measure()
  const ro = new ResizeObserver(measure) // the cards change height as images and fonts arrive
  ro.observe(el)
  addEventListener('scroll', schedule, { passive: true })
  onBeforeUnmount(() => {
    ro.disconnect()
    removeEventListener('scroll', schedule)
    cancelAnimationFrame(raf)
  })
})
</script>

<template>
  <div>
    <ExperienceIntroHeader />

    <div ref="wrap" class="tl relative">
      <template v-for="c in chapters" :key="c.role.no">
        <section class="section-x relative py-space-2xl" data-tl-sec :aria-labelledby="`chapter-${c.n}`">
          <!-- outside the sticky column, so the node stays where the chapter starts -->
          <span class="tl-node" data-tl-node aria-hidden="true" />
          <div class="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
            <div class="lg:sticky lg:top-24 lg:self-start">
              <p class="lab-eyebrow [&::before]:hidden">{{ $t('experience.chapter', { n: c.n }) }}</p>
              <time class="tl-period mt-4 block font-mono text-label-md text-on-surface">{{ c.role.period }}</time>
              <p class="mt-1 text-body-sm text-on-surface-variant">{{ c.role.badge }}</p>
              <p class="text-body-sm text-on-surface-variant">{{ c.role.place }}</p>
            </div>
            <ExperienceRoleCard :id="`chapter-${c.n}`" v-reveal :role="c.role" />
          </div>
        </section>

        <section v-if="c.turn" class="lab-dark relative isolate overflow-hidden" :aria-label="c.turn.title">
          <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-80" aria-hidden="true" />
          <div class="section-x grid gap-8 py-space-2xl lg:grid-cols-[14rem_1fr] lg:gap-12">
            <p class="text-label-md font-medium text-lab-on-dark-muted">{{ $t('experience.transition') }}</p>
            <div class="max-w-3xl border-l-2 border-lab-signal pl-6 md:pl-8">
              <h2 class="font-heading text-headline-lg-mobile text-white [word-break:keep-all] [overflow-wrap:break-word] md:text-headline-lg">{{ c.turn.title }}</h2>
              <p v-for="p in c.turn.body" :key="p" class="lab-muted mt-5 text-body-lg">{{ p }}</p>
            </div>
          </div>
        </section>
      </template>

      <div class="tl-track" aria-hidden="true"><div class="tl-fill" /></div>
    </div>

    <div class="section-x border-t border-hairline-strong">
      <ExperienceStackMatrix />
      <ExperiencePrinciples />
      <ExperienceResumeCta />
    </div>
  </div>
</template>

<style scoped>
/* 2px lines, no glow, no easing: the line moves exactly as far as the reader has scrolled. */
.tl-track { position: absolute; z-index: 5; width: 2px; pointer-events: none; background: rgb(122 116 104 / 0.38); }
.tl-fill { position: absolute; inset: 0; background: #ff5b1f; transform: scaleY(var(--p, 0)); transform-origin: top; }
/* the node sits in the page gutter, level with the chapter label (section padding-top 5rem + 0.4rem) */
.tl-node { position: absolute; top: 5.4rem; left: 0.45rem; width: 9px; height: 9px; transform: rotate(45deg); background: #b9b3a6; transition: background-color 0.3s; }
@media (min-width: 768px) { .tl-node { left: 1.2rem; } }
@media (min-width: 1024px) { .tl-node { left: 0.6rem; } }
.is-on .tl-node { background: #ff5b1f; }
.tl-ready .tl-period { color: rgb(var(--c-on-surface-variant)); }
.tl-ready .is-current .tl-period { color: rgb(var(--c-on-surface)); font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .tl-node { transition: none; } }
</style>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { projects, projectImages } = useData()
const route = useRoute()
const idx = projects.findIndex(p => p.slug === route.params.slug)
if (idx < 0) throw createError({ statusCode: 404, statusMessage: t('projects.notFound'), fatal: true })

const project = projects[idx]!
const { track } = useAnalytics()
const detail = project.detail ?? {}
const next = projects[(idx + 1) % projects.length]!
const dev = import.meta.dev

// Screenshots: every image (cover included) is a slide in one viewer; the grid shows all but the cover.
const images = projectImages[project.slug]
const cover = images?.cover
const gallery = images?.gallery ?? []
const coverAt = cover ? gallery.findIndex(i => i.w === cover.w && i.h === cover.h) : -1
const slides = cover && coverAt < 0 ? [{ ...cover, caption: t('projects.coverCaption') }, ...gallery] : gallery
const coverSlide = cover ? Math.max(coverAt, 0) : -1
const thumbs = slides.map((s, i) => ({ ...s, i })).filter(t => t.i !== coverSlide)
const lightbox = ref<number | null>(null)

// Editorial case study: Context → Challenge → Decision → Implementation → Validation → Reflection.
// A chapter with no real data is hidden in production; Validation / Reflection show a TODO box in dev only.
const challenges = detail.challenges ?? []
const has = {
  context: true, // falls back to the project summary
  challenge: challenges.length > 0,
  decision: challenges.length > 0 || !!detail.stack?.length,
  implementation: true,
  validation: !!(detail.verification?.length || detail.results?.length),
  reflection: !!detail.retrospective,
}
const labels = { context: 'Context', challenge: 'Challenge', decision: 'Decision', implementation: 'Implementation', validation: 'Validation', reflection: 'Reflection' }
type Chapter = keyof typeof has
const chapters = (Object.keys(has) as Chapter[]).filter(k => has[k] || (dev && (k === 'validation' || k === 'reflection')))
const no = (k: Chapter) => String(chapters.indexOf(k) + 1).padStart(2, '0')
const todo = (field: string) => `TODO（僅開發環境顯示）：在 data/home.ts → projects「${project.slug}」→ detail.${field} 補上真實內容後，這一段才會在正式環境出現。`

// Scroll spy for the chapter index.
const active = ref<Chapter>(chapters[0]!)
onMounted(() => {
  track('project_view', { project_slug: project.slug })
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) active.value = e.target.id as Chapter
  }, { rootMargin: '-35% 0px -60% 0px' })
  for (const k of chapters) {
    const el = document.getElementById(k)
    if (el) io.observe(el)
  }
  onBeforeUnmount(() => io.disconnect())
})

const title = `${project.title} | Elio Lee`
const url = usePageUrl()
const ogImage = cover ? `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}${cover.src}` : undefined
useSeoMeta({ title, description: project.body, ogTitle: title, ogDescription: project.body, ogType: 'article', ogUrl: url, ogImage, ogImageAlt: ogImage ? title : undefined, twitterImage: ogImage })
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'CreativeWork', name: project.title, description: project.body, keywords: project.tags.join(', '), author: { '@type': 'Person', name: '李柏偉', alternateName: 'Elio Lee' }, url }),
  }],
})

const back = `${localePath('/')}?project=${project.slug}#works`
const eyebrow = 'font-mono text-label-sm uppercase tracking-[0.18em] text-lab-signal-ink'
const h2 = 'mt-3 text-headline-lg-mobile md:text-headline-lg'
const chapter = 'scroll-mt-24 border-t border-hairline-strong pb-space-2xl pt-space-lg'
const todoBox = 'rounded-sm border border-dashed border-lab-signal-ink/40 bg-lab-signal/5 p-4 font-mono text-label-md text-lab-signal-ink'
</script>

<template>
  <div>
    <!-- Cover: dark, the landing point of the cover morph from the project space. -->
    <header class="lab-dark relative isolate overflow-hidden">
      <div class="section-x pb-space-xl pt-24 md:pt-28">
        <NuxtLink :to="back" data-cursor-label="" class="inline-flex items-center gap-1.5 font-mono text-label-md text-lab-on-dark-muted transition-colors hover:text-white">
          <UiIcon name="arrow_back" class="text-[15px]" /> {{ $t('projects.back') }}
        </NuxtLink>
        <div class="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-5">
            <p class="flex items-center gap-2.5 font-mono text-label-sm uppercase tracking-[0.18em] text-lab-on-dark-muted">
              <span class="h-2.5 w-2.5 rotate-45" :style="{ background: project.accent }" aria-hidden="true" />
              {{ project.code }} · {{ project.kind }}
            </p>
            <h1 class="mt-5 font-heading text-display-mobile text-white [text-wrap:balance] md:text-display"><template v-for="w in project.title.split(' ')" :key="w"><span class="inline-block">{{ w }}</span>{{ ' ' }}</template></h1>
            <p v-if="detail.headline" class="mt-5 text-headline-sm font-normal text-lab-on-dark">{{ detail.headline }}</p>
          </div>
          <!-- Capped at 24rem tall (by narrowing it, keeping its ratio): a squarish cover would otherwise make the
               header taller and push the bottom-aligned title down. -->
          <figure v-if="cover" class="lg:col-span-7">
            <button
              type="button" class="ml-auto block w-full cursor-zoom-in"
              :style="{ viewTransitionName: `cover-${project.slug}`, maxWidth: `min(${cover.w}px, ${(24 * cover.w / cover.h).toFixed(2)}rem)` }"
              :aria-label="$t('projects.zoom', { caption: $t('projects.coverAlt', { title: project.title }) })" @click="lightbox = coverSlide"
            >
              <NuxtPicture
                :src="cover.src" :width="cover.w" :height="cover.h" sizes="xs:100vw sm:100vw md:100vw lg:680px"
                :alt="$t('projects.coverAlt', { title: project.title })" loading="eager" :preload="{ fetchPriority: 'high' }"
                :img-attrs="{ class: 'h-auto w-full rounded-sm border border-white/10', fetchpriority: 'high', decoding: 'async' }"
                class="block"
              />
            </button>
          </figure>
        </div>
      </div>
      <div class="h-1" :style="{ background: project.accent }" aria-hidden="true" />
    </header>

    <div class="section-x py-space-xl lg:grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-16">
      <!-- Left: facts + chapter index (sticky on desktop) -->
      <aside class="mb-space-xl lg:mb-0">
        <div class="space-y-8 lg:sticky lg:top-24">
          <dl class="space-y-4 text-body-sm">
            <div v-if="detail.period">
              <dt :class="eyebrow">{{ $t('projects.year') }}</dt>
              <dd class="mt-1 font-medium">{{ detail.period }}</dd>
            </div>
            <div v-if="detail.role">
              <dt :class="eyebrow">{{ $t('projects.role') }}</dt>
              <dd class="mt-1 font-medium">{{ detail.role }}</dd>
            </div>
            <div>
              <dt :class="eyebrow">{{ $t('projects.tech') }}</dt>
              <dd class="mt-2 flex flex-wrap gap-1.5"><span v-for="t in project.tags" :key="t" class="lab-chip-light">{{ t }}</span></dd>
            </div>
            <div v-if="detail.demo || detail.github">
              <dt :class="eyebrow">{{ $t('projects.links') }}</dt>
              <dd class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <a v-if="detail.demo" :href="detail.demo" data-cursor-label="DEMO" target="_blank" rel="noopener noreferrer" @click="track('project_demo_click', { project_slug: project.slug })" class="inline-flex items-center gap-1 font-medium text-lab-signal-ink underline decoration-lab-signal-ink/40 underline-offset-4 hover:decoration-lab-signal-ink">
                  {{ $t('projects.demo') }} <UiIcon name="arrow_outward" class="text-[14px]" />
                </a>
                <a v-if="detail.github" :href="detail.github" data-cursor-label="CODE" target="_blank" rel="noopener noreferrer" @click="track('project_github_click', { project_slug: project.slug })" class="inline-flex items-center gap-1 font-medium text-on-surface underline decoration-hairline-strong underline-offset-4 hover:decoration-on-surface">
                  GitHub <UiIcon name="arrow_outward" class="text-[14px]" />
                </a>
              </dd>
            </div>
          </dl>

          <nav class="hidden lg:block" data-cursor-label="" :aria-label="$t('projects.chapters')">
            <ol class="border-l border-hairline-strong">
              <li v-for="k in chapters" :key="k">
                <a
                  :href="`#${k}`"
                  class="-ml-px flex gap-3 border-l-2 py-1.5 pl-4 text-body-sm transition-colors"
                  :class="active === k ? 'border-lab-signal font-medium text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
                  :aria-current="active === k ? 'true' : undefined"
                >
                  <span class="font-mono text-label-sm">{{ no(k) }}</span>{{ labels[k] }}
                </a>
              </li>
            </ol>
          </nav>
        </div>
      </aside>

      <!-- Phones / tablets: chapter index as a scrollable row -->
      <nav class="-mx-margin-mobile mb-space-lg overflow-x-auto px-margin-mobile lg:hidden" data-cursor-label="" :aria-label="$t('projects.chaptersMobile')">
        <ol class="flex gap-2 whitespace-nowrap">
          <li v-for="k in chapters" :key="k"><a :href="`#${k}`" class="lab-chip-light">{{ no(k) }} {{ labels[k] }}</a></li>
        </ol>
      </nav>

      <!-- Right: the narrative -->
      <div class="min-w-0 max-w-[46rem]">
        <section id="context" :class="chapter" aria-labelledby="context-h">
          <p :class="eyebrow">{{ no('context') }} / Context</p>
          <h2 id="context-h" :class="h2">{{ $t('projects.chapterTitles.context') }}</h2>
          <div class="mt-6 space-y-4 text-body-lg text-on-surface-variant">
            <p v-for="p in detail.overview?.length ? detail.overview : [project.body]" :key="p">{{ p }}</p>
          </div>
        </section>

        <section v-if="has.challenge" id="challenge" :class="chapter" aria-labelledby="challenge-h">
          <p :class="eyebrow">{{ no('challenge') }} / Challenge</p>
          <h2 id="challenge-h" :class="h2">{{ $t('projects.chapterTitles.challenge') }}</h2>
          <ol class="mt-6 divide-y divide-hairline border-y border-hairline">
            <li v-for="(c, i) in challenges" :key="c.title" class="grid gap-2 py-5 sm:grid-cols-[3.5rem_1fr]">
              <span class="font-mono text-label-md text-on-surface-variant">C{{ i + 1 }}</span>
              <div>
                <h3 class="text-headline-sm">{{ c.title }}</h3>
                <p class="mt-1.5 text-body-md text-on-surface-variant">{{ c.problem }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section v-if="has.decision" id="decision" :class="chapter" aria-labelledby="decision-h">
          <p :class="eyebrow">{{ no('decision') }} / Decision</p>
          <h2 id="decision-h" :class="h2">{{ $t('projects.chapterTitles.decision') }}</h2>
          <ol v-if="challenges.length" class="mt-6 space-y-4">
            <li v-for="(c, i) in challenges" :key="c.title" class="rounded-sm bg-surface-container-lowest p-5 shadow-sm">
              <p class="font-mono text-label-sm text-on-surface-variant">C{{ i + 1 }} → {{ c.label }}</p>
              <p class="mt-2 text-body-md text-on-surface">{{ c.solution }}</p>
              <ul v-if="c.tags?.length" class="mt-3 flex flex-wrap gap-1.5"><li v-for="t in c.tags" :key="t" class="lab-chip-light">{{ t }}</li></ul>
            </li>
          </ol>
          <template v-if="detail.stack?.length">
            <h3 class="mt-10 text-headline-sm">{{ $t('projects.stack') }}</h3>
            <dl class="mt-4 divide-y divide-hairline border-y border-hairline">
              <div v-for="g in detail.stack" :key="g.group" class="grid gap-2 py-3 sm:grid-cols-[8rem_1fr]">
                <dt class="font-mono text-label-md uppercase tracking-wider text-on-surface-variant">{{ g.group }}</dt>
                <dd>
                  <span class="text-body-md">{{ g.items.join(' · ') }}</span>
                  <p v-if="g.why" class="mt-1 text-body-sm text-on-surface-variant">{{ g.why }}</p>
                </dd>
              </div>
            </dl>
          </template>
        </section>

        <section id="implementation" :class="chapter" aria-labelledby="implementation-h">
          <p :class="eyebrow">{{ no('implementation') }} / Implementation</p>
          <h2 id="implementation-h" :class="h2">{{ $t('projects.chapterTitles.implementation') }}</h2>

          <ProjectCaseDiagram v-if="detail.diagram" class="mt-6" :diagram="detail.diagram" :accent="project.accent" />

          <ol v-if="detail.features?.length" class="mt-10 space-y-8">
            <li v-for="(f, i) in detail.features" :key="f.title" class="grid gap-2 sm:grid-cols-[3.5rem_1fr]">
              <span class="font-mono text-label-md text-on-surface-variant">F{{ i + 1 }}</span>
              <div>
                <h3 class="text-headline-sm">{{ f.title }}</h3>
                <p class="mt-1.5 text-body-md text-on-surface-variant">{{ f.body }}</p>
                <ul v-if="f.points?.length" class="mt-3 flex flex-wrap gap-1.5"><li v-for="p in f.points" :key="p" class="lab-chip-light">{{ p }}</li></ul>
              </div>
            </li>
          </ol>
          <ul v-else class="mt-6 divide-y divide-hairline border-y border-hairline">
            <li v-for="i in project.side.items" :key="i" class="py-3 text-body-md">{{ i }}</li>
          </ul>

          <template v-if="thumbs.length">
            <h3 class="mt-12 text-headline-sm">{{ $t('projects.screens') }}</h3>
            <p class="mt-1 text-body-sm text-on-surface-variant">{{ $t('projects.screensHint') }}</p>
            <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <li v-for="t in thumbs" :key="t.src">
                <figure class="space-y-1.5">
                  <button
                    type="button"
                    class="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-sm bg-surface-container-lowest p-1.5 shadow-sm transition-shadow hover:shadow-md"
                    :aria-label="$t('projects.zoom', { caption: t.caption })"
                    @click="lightbox = t.i"
                  >
                    <NuxtPicture
                      :src="t.src" :width="t.w" :height="t.h" sizes="xs:50vw sm:33vw md:33vw lg:240px"
                      :alt="`${project.title}：${t.caption}`" loading="lazy"
                      :img-attrs="{ class: 'h-full w-full object-contain', decoding: 'async' }"
                      class="block h-full w-full"
                    />
                  </button>
                  <figcaption class="font-mono text-label-sm text-on-surface-variant">{{ t.caption }}</figcaption>
                </figure>
              </li>
            </ul>
          </template>
        </section>

        <section v-if="chapters.includes('validation')" id="validation" :class="chapter" aria-labelledby="validation-h">
          <p :class="eyebrow">{{ no('validation') }} / Validation</p>
          <h2 id="validation-h" :class="h2">{{ $t('projects.chapterTitles.validation') }}</h2>
          <template v-if="has.validation">
            <ul v-if="detail.verification?.length" class="mt-6 divide-y divide-hairline border-y border-hairline">
              <li v-for="v in detail.verification" :key="v" class="py-3 text-body-md">{{ v }}</li>
            </ul>
            <dl v-if="detail.results?.length" class="mt-6 grid gap-4 sm:grid-cols-2">
              <div v-for="r in detail.results" :key="r.label" class="rounded-sm bg-surface-container-lowest p-5 shadow-sm">
                <dt class="text-body-sm text-on-surface-variant">{{ r.label }}</dt>
                <dd class="mt-1 font-mono text-headline-md">{{ r.value }}</dd>
                <dd v-if="r.body" class="mt-1 text-body-sm text-on-surface-variant">{{ r.body }}</dd>
              </div>
            </dl>
          </template>
          <p v-else :class="[todoBox, 'mt-6']">{{ todo('verification / detail.results') }}</p>
        </section>

        <section v-if="chapters.includes('reflection')" id="reflection" :class="chapter" aria-labelledby="reflection-h">
          <p :class="eyebrow">{{ no('reflection') }} / Reflection</p>
          <h2 id="reflection-h" :class="h2">{{ $t('projects.chapterTitles.reflection') }}</h2>
          <div v-if="has.reflection" class="mt-6 grid gap-8 sm:grid-cols-2">
            <div v-if="detail.retrospective?.learned">
              <h3 class="text-headline-sm">{{ $t('projects.learned') }}</h3>
              <p class="mt-1.5 text-body-md text-on-surface-variant">{{ detail.retrospective.learned }}</p>
            </div>
            <div v-if="detail.retrospective?.next">
              <h3 class="text-headline-sm">{{ $t('projects.next') }}</h3>
              <p class="mt-1.5 text-body-md text-on-surface-variant">{{ detail.retrospective.next }}</p>
            </div>
          </div>
          <p v-else :class="[todoBox, 'mt-6']">{{ todo('retrospective') }}</p>
        </section>
      </div>
    </div>

    <nav class="lab-dark" :aria-label="$t('projects.projectNav')">
      <div class="section-x flex flex-col gap-6 py-space-xl sm:flex-row sm:items-center sm:justify-between">
        <NuxtLink :to="back" data-cursor-label="" class="inline-flex items-center gap-2 font-mono text-label-md text-lab-on-dark-muted transition-colors hover:text-white">
          <UiIcon name="arrow_back" class="text-[16px]" /> {{ $t('projects.back') }}
        </NuxtLink>
        <NuxtLink :to="localePath(`/projects/${next.slug}`)" class="group sm:text-right">
          <span class="block font-mono text-label-sm uppercase tracking-[0.18em] text-lab-on-dark-muted">Next · {{ next.code }}</span>
          <span class="mt-1 inline-flex items-center gap-2 font-heading text-headline-md text-white">
            {{ next.title }} <UiIcon name="arrow_forward" class="text-[22px] text-lab-signal transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
        </NuxtLink>
      </div>
    </nav>

    <ProjectLightbox v-model:index="lightbox" :slides="slides" />
  </div>
</template>

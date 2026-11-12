<script setup lang="ts">
const { hero, projects, projectImages } = useData()
const { locale } = useI18n()
const localePath = useLocalePath()

// Hero + project space share one sticky 3D stage (desktop). Scrolling carries the camera from the ruin through
// its summit door, down into the corridor. There:
//   · preview (hover / keyboard focus / ↑ ↓ / first tap on touch / clicking a 3D label) → the camera runs to that
//     project's gate and the HTML panel shows its summary; leaving the list returns the camera to the exploring spot;
//   · enter (click / Enter / second tap) → the camera carries on through the gate, then the case study opens.
// Every project is a real link in an HTML list, so the 3D is never the only way in (modified clicks open normally).
// Selection lives in useState so Back restores it; the case study's return link passes ?project=<slug>.
const route = useRoute()
const fromQuery = typeof route.query.project === 'string' && projects.some(p => p.slug === route.query.project) ? route.query.project : null
const selected = useState<string>('space-selected', () => 'game-together')
const preview = useState<string | null>('space-preview', () => null)
if (fromQuery) selected.value = preview.value = fromQuery

const current = computed(() => projects.find(p => p.slug === selected.value) ?? projects[0]!)
const cover = (slug: string) => projectImages[slug]?.cover
const items = ref<HTMLElement[]>([])
const stage = ref<{ enter(slug: string): Promise<void> }>()
const column = ref<HTMLElement>()
let pointerType = 'mouse'

function show(slug: string) {
  selected.value = slug
  preview.value = slug
}
// Back to the exploring spot once neither pointer nor keyboard focus is on the project column.
function onFocusOut(e: FocusEvent) {
  if (!column.value?.contains(e.relatedTarget as Node | null)) preview.value = null
}

async function open(e: MouseEvent, slug: string) {
  if (!(e.target as HTMLElement).closest('a')) return
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // new tab etc.: plain link
  e.preventDefault()
  // Touch has no hover: the first tap previews, the second enters (Enter key clicks have detail 0).
  if (pointerType === 'touch' && e.detail > 0 && preview.value !== slug) return show(slug)
  show(slug)
  await stage.value?.enter(slug)
  await navigateTo(localePath(`/projects/${slug}`))
}

function onKey(e: KeyboardEvent, i: number) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + projects.length) % projects.length
  items.value[next]?.focus()
}

// A click on a station label previews it; a second click on the previewed one enters the case study.
async function onStage(slug: string) {
  if (slug !== preview.value) return show(slug)
  await stage.value?.enter(slug)
  await navigateTo(localePath(`/projects/${slug}`))
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-body-md font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <div data-space class="lab-dark relative">
    <SpaceStage ref="stage" :selected="selected" :preview="preview" class="sticky top-0 hidden h-[100svh] md:block" @select="onStage" />

    <div class="relative md:-mt-[100svh]">
      <!-- Hero -->
      <section class="pointer-events-none relative flex min-h-[100svh] flex-col justify-end pb-20 pt-28 md:pb-24" aria-labelledby="hero-title">
        <div class="section-x pointer-events-auto">
          <p class="lab-eyebrow lab-in">{{ hero.eyebrow }}</p>
          <h1 id="hero-title" class="space-title lab-in mt-6 max-w-[12em] text-white [text-wrap:balance] [word-break:auto-phrase]" style="--d: 80ms">
            <span class="block"><UiMagnetText :text="hero.title[0]!" :plain="locale === 'ja'" /></span>
            <span class="block"><UiMagnetText :text="hero.title[1]!" :plain="locale === 'ja'" /></span>
          </h1>
          <SpaceMonument class="mx-auto mt-10 h-72 w-auto max-w-full md:hidden" />
          <p class="lab-in lab-muted mt-8 max-w-[36rem] text-body-lg" style="--d: 160ms">{{ hero.intro }}</p>
          <div class="lab-in mt-10 flex flex-wrap items-center gap-3" style="--d: 240ms">
            <a href="#works" :class="[btn, 'bg-lab-signal text-lab-bg hover:bg-white']">
              {{ $t('home.explore') }}
            </a>
            <a href="#about" :class="[btn, 'border border-white/25 text-white hover:border-white']">
              {{ $t('home.aboutMe') }}
            </a>
          </div>
        </div>
        <p class="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-mono text-label-sm tracking-wider text-lab-on-dark-muted md:flex" aria-hidden="true">
          {{ $t('home.scrollHint') }} <UiIcon name="south" class="text-[14px]" />
        </p>
      </section>

      <!-- Project space -->
      <section id="works" class="pointer-events-none relative scroll-mt-0 py-24 md:flex md:min-h-[100svh] md:items-center" aria-labelledby="works-title">
        <div class="section-x pointer-events-auto">
          <div ref="column" class="md:max-w-[26rem]" @mouseleave="preview = null" @focusout="onFocusOut" @pointerdown="pointerType = $event.pointerType">
            <h2 id="works-title" class="font-heading text-headline-lg-mobile text-white md:text-headline-lg">{{ $t('home.worksTitle') }}</h2>
            <p class="lab-muted mt-3 hidden text-body-sm md:block">{{ $t('home.worksHint') }}</p>

            <!-- Desktop: the list drives the 3D focus. Each item is a real link. -->
            <ol class="mt-8 hidden border-t border-white/10 md:block" :aria-label="$t('home.worksList')">
              <li v-for="(p, i) in projects" :key="p.slug" class="border-b border-white/10" @click.capture="open($event, p.slug)">
                <NuxtLink
                  :ref="el => (items[i] = (el as { $el: HTMLElement } | null)?.$el as HTMLElement)"
                  :to="localePath(`/projects/${p.slug}`)"
                  class="group flex items-baseline gap-4 py-3.5 transition-colors"
                  :class="p.slug === selected ? 'text-white' : 'text-lab-on-dark-muted hover:text-white'"
                  :aria-current="p.slug === selected ? 'true' : undefined"
                  @mouseenter="show(p.slug)"
                  @focus="show(p.slug)"
                  @keydown="onKey($event, i)"
                >
                  <span class="w-12 shrink-0 font-mono text-label-sm" :style="p.slug === selected ? { color: p.accent } : undefined">{{ p.code }}</span>
                  <span :class="i === 0 ? 'text-headline-md' : 'text-headline-sm'" class="font-heading">{{ p.title }}</span>
                  <UiIcon name="arrow_forward" class="ml-auto self-center text-[18px] transition-[opacity,transform] motion-reduce:transition-none" :class="p.slug === selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'" />
                </NuxtLink>
              </li>
            </ol>

            <!-- Desktop: focus panel for the selected project. Its thumbnail morphs into the case-study cover. -->
            <div class="mt-8 hidden md:block" aria-live="polite" @click.capture="open($event, current.slug)">
              <div class="flex gap-4">
                <NuxtImg
                  v-if="cover(current.slug)"
                  :key="current.slug"
                  :src="cover(current.slug)!.src" 
                  :width="160" 
                  :height="Math.round(160 * cover(current.slug)!.h / cover(current.slug)!.w)"
                  sizes="(max-width: 768px) 100vw, 160px"
                  format="webp" 
                  loading="lazy"
                  alt="" 
                  class="h-auto w-40 shrink-0 self-start rounded-sm border border-white/10"
                  :style="{ viewTransitionName: `cover-${current.slug}` }"
                />
                <div class="min-w-0">
                  <p class="text-label-sm text-lab-on-dark-muted">{{ current.kind }}</p>
                  <p class="mt-1 line-clamp-3 text-body-sm text-lab-on-dark">{{ current.body }}</p>
                </div>
              </div>
              <ul class="mt-4 flex flex-wrap gap-1.5" :aria-label="$t('common.techUsed')">
                <li v-for="t in current.tags" :key="t" class="lab-chip">{{ t }}</li>
              </ul>
              <NuxtLink :to="localePath(`/projects/${current.slug}`)" class="mt-6 inline-flex items-center gap-2 font-medium text-lab-signal underline-offset-4 hover:underline">
                {{ $t('home.enterCase', { title: current.title }) }} <UiIcon name="arrow_forward" class="text-[18px]" />
              </NuxtLink>
            </div>

            <!-- Phones: no 3D. Lead project as a large card, the rest as smaller rows. -->
            <ol class="mt-8 space-y-4 md:hidden" :aria-label="$t('home.worksList')">
              <li v-for="(p, i) in projects" :key="p.slug">
                <NuxtLink :to="localePath(`/projects/${p.slug}`)" class="group block rounded-sm border border-white/10 bg-lab-bg-soft" :class="i === 0 ? 'p-3' : 'flex items-center gap-4 p-3'">
                  <NuxtImg
                    v-if="cover(p.slug)"
                    :src="cover(p.slug)!.src" 
                    :width="i === 0 ? 720 : 160" 
                    :height="i === 0 ? 450 : 160"
                    :sizes="i === 0 ? '100vw' : '80px'"
                    format="webp" 
                    loading="lazy" 
                    alt=""
                    :class="i === 0 ? 'aspect-[16/10] w-full' : 'aspect-square w-20 shrink-0'" 
                    class="rounded-sm object-cover object-top"
                    :style="{ viewTransitionName: `cover-${p.slug}` }"
                  />
                  <div :class="i === 0 ? 'mt-4 px-1 pb-1' : 'min-w-0'">
                    <p class="flex items-center gap-2 text-label-sm text-lab-on-dark-muted">
                      <span class="h-2 w-2 rotate-45" :style="{ background: p.accent }" aria-hidden="true" /><span class="font-mono">{{ p.code }}</span> {{ p.kind }}
                    </p>
                    <h3 class="mt-1 font-heading text-white" :class="i === 0 ? 'text-headline-md' : 'text-headline-sm'">{{ p.title }}</h3>
                    <p v-if="i === 0" class="lab-muted mt-2 text-body-sm">{{ p.body }}</p>
                  </div>
                </NuxtLink>
              </li>
            </ol>

            <!-- Skip the 3D: the plain project index. -->
            <NuxtLink :to="localePath('/projects')" class="mt-8 inline-flex items-center gap-2 text-label-sm text-lab-on-dark-muted underline-offset-4 hover:text-white hover:underline">
              {{ $t('home.allWorks') }} <UiIcon name="arrow_forward" class="text-[16px]" />
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ preview: [index: number | null] }>()
const active = ref<number | null>(null)
const focused = ref<number | null>(null)
function select(index: number | null) { active.value = index; emit('preview', index) }
onBeforeUnmount(() => emit('preview', null))
const localePath = useLocalePath()
const collection = useBlogCollection()
const { track, slugOf } = useAnalytics()

// Only published articles; drafts never appear. The section hides itself if there are none.
const { data: posts } = await useAsyncData(`home-notes-${collection}`, () =>
  queryCollection(collection).select('path', 'title', 'description', 'date', 'category', 'tags', 'readingTime').where('draft', '=', false).order('date', 'DESC').limit(3).all(),
)
</script>

<template>
  <section v-if="posts?.length" data-notes class="home-notes notes-vault relative py-space-2xl md:py-space-3xl" aria-labelledby="notes-title">
    <div class="notes-guide" aria-hidden="true" />
    <div class="section-x grid gap-10 lg:grid-cols-12 lg:gap-20">
      <div class="lg:col-span-5">
        <div class="home-chapter" aria-hidden="true"><span>03</span><span class="home-chapter-line" /></div>
        <h2 id="notes-title" v-reveal.mask="0.08" class="text-headline-lg-mobile md:text-headline-lg">{{ $t('home.notesTitle') }}</h2>
        <p v-reveal="0.08" class="mt-4 text-body-md text-on-surface-variant">{{ $t('home.notesBody') }}</p>
        <NuxtLink v-reveal="0.14" :to="localePath('/blog')" class="mt-6 inline-flex items-center gap-2 font-medium text-lab-signal-ink u-link">
          {{ $t('home.notesLink') }} <UiIcon name="arrow_forward" class="text-[18px]" />
        </NuxtLink>
      </div>

      <ol class="home-index min-w-0 lg:col-span-7">
        <li v-for="(p, i) in posts" :key="p.path" v-reveal="i * 0.08" class="notes-record border-b border-hairline" :class="{ 'is-active': active === i }" @pointerenter="select(i)" @pointerleave="select(focused)" @focusin="focused = i; select(i)" @focusout="focused = null; select(null)">
          <NuxtLink :to="p.path" class="notes-link group relative grid min-w-0 gap-4 p-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6" @click="track('note_click', { note_slug: slugOf(p.path), source: 'home' })">
            <div class="notes-meta font-mono text-label-md text-on-surface-variant">
              <div class="notes-meta-row">
              <span class="notes-code inline-flex items-center gap-2 text-primary"><span class="notes-slot-marker" aria-hidden="true" />N–0{{ i + 1 }}</span>
              <time :datetime="p.date">{{ p.date.replaceAll('-', '/') }}</time>
              </div>
              <p class="mt-1 text-label-sm text-lab-signal-ink">{{ $t('blog.readingTime', { n: p.readingTime }) }}</p>
            </div>
            <div class="min-w-0">
              <p class="text-label-sm font-medium text-lab-signal-ink">{{ $t(`categories.${p.category}`) }}</p>
              <h3 class="mt-3 text-headline-sm transition-colors group-hover:text-lab-signal-ink">{{ p.title }}</h3>
              <p class="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">{{ p.description }}</p>
            </div>
          </NuxtLink>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.notes-vault { color: rgb(var(--c-on-surface)); background: linear-gradient(to right, rgb(var(--c-background) / 0.96), rgb(var(--c-background) / 0.35)); }
.notes-guide { position: absolute; top: 0; bottom: 0; left: var(--guide-x, 50%); width: 1px; background: linear-gradient(rgb(var(--c-primary) / 0.5), transparent); pointer-events: none; }
.notes-record { margin-bottom: 1rem; border: 1px solid rgb(var(--c-hairline-strong)); background: rgb(var(--c-surface-container-lowest)); transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease; }
.notes-record:hover, .notes-record:focus-within { transform: translateY(-4px); border-color: rgb(var(--c-primary)); box-shadow: 0 8px 24px rgb(var(--c-primary) / 0.1); }
.notes-record::before { transition: width 220ms ease; }
.notes-record:hover::before, .notes-record:focus-within::before { width: 4rem; }
@media (prefers-reduced-motion: reduce) { .notes-record, .notes-record::before { transition: none; } .notes-record:hover, .notes-record:focus-within { transform: none; } }
.notes-record.is-active { border-color: rgb(var(--c-primary)); }
.notes-code { letter-spacing: 0.12em; }
.notes-record.is-active .notes-code { text-shadow: 0 0 18px rgb(var(--c-primary) / 0.25); }

.notes-record { position: relative; }
.notes-record::after { content: ''; position: absolute; top: 2rem; right: 100%; width: 2rem; height: 1px; background: rgb(var(--c-primary) / 0.25); pointer-events: none; transform: scaleX(0.35); transform-origin: right; transition: transform 220ms ease, background-color 220ms ease; }
.notes-record.is-active::after { transform: scaleX(1); background: rgb(var(--c-primary)); }
.notes-slot-marker { width: 6px; height: 6px; border: 1px solid currentColor; transform: rotate(45deg); }
.is-active .notes-slot-marker { background: currentColor; }
@media (max-width: 1023px) {
  .notes-guide, .notes-record::after { display: none; }
  .notes-vault { background: rgb(var(--c-background)); }
}
@media (prefers-reduced-motion: reduce) { .notes-record::after { transition: none; } }

.notes-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 1rem; }
.notes-code, .notes-meta time { white-space: nowrap; }
.notes-meta > p { margin-top: 0.75rem; }
.notes-link { overflow-wrap: anywhere; }
.notes-record { margin-bottom: 1.5rem; }
@media (min-width: 640px) { .notes-meta-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; } }
@media (max-width: 639px) { .notes-link { padding: 1.25rem; gap: 1.25rem; } }
</style>

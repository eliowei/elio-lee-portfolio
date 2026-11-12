<script setup lang="ts">
import { categories } from '~/data/site'

const { t } = useI18n()
const { page } = useData()
const { track, slugOf } = useAnalytics()
const title = `${t('blog.title')} | Elio Lee`
const description = page.lead

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: usePageUrl() })

// Published articles only (drafts = sample posts). The list appears once there is something to list.
const collection = useBlogCollection()
const { data: posts } = await useAsyncData(`blog-list-${collection}`, () => queryCollection(collection).select('path', 'title', 'description', 'date', 'category', 'tags', 'readingTime').where('draft', '=', false).order('date', 'DESC').all())

// Category filter: plain client state, so the page stays cacheable as one document. Empty categories are not offered.
const active = ref<(typeof categories)[number] | null>(null)
const filters = computed(() => categories
  .map(key => ({ key, label: t(`categories.${key}`), count: posts.value?.filter(p => p.category === key).length ?? 0 }))
  .filter(f => f.count))
// Search matches the title, description and tags, on top of the category filter.
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return posts.value?.filter(p => (!active.value || p.category === active.value)
    && (!q || [p.title, p.description, ...(p.tags ?? [])].join(' ').toLowerCase().includes(q))) ?? []
})
// note_search: sent once the reader pauses typing for a second; the term is cut to 50 characters.
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, (value) => {
  clearTimeout(searchTimer)
  const term = value.trim()
  if (term.length < 2) return
  searchTimer = setTimeout(() => track('note_search', { search_term: term.slice(0, 50), results: shown.value.length }), 1000)
})
onBeforeUnmount(() => clearTimeout(searchTimer))
const chip = (on: boolean) => ['lab-chip-light gap-1.5 transition-colors motion-reduce:transition-none', on ? '!border-lab-signal-ink !text-lab-signal-ink' : 'hover:!border-on-surface-variant']
</script>

<template>
  <div>
    <LabPageHeader :title="page.title" :lead="page.lead">
      <ul class="flex flex-wrap gap-2" :aria-label="$t('blog.facts')">
        <li v-for="f in page.facts" :key="f" class="lab-chip">{{ f }}</li>
      </ul>
    </LabPageHeader>

    <!-- Editorial index of real articles -->
    <section v-if="posts?.length" class="section-x py-space-2xl" aria-labelledby="latest">
      <div class="flex items-end justify-between pb-6">
        <h2 id="latest" class="text-headline-md">{{ $t('blog.latest') }}</h2>
        <span class="hidden text-label-sm text-on-surface-variant sm:inline">{{ $t('blog.articles', { n: shown.length }) }}</span>
      </div>
      <div class="relative mb-4 max-w-md">
        <label for="note-search" class="sr-only">{{ $t('blog.search') }}</label>
        <UiIcon name="search" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" />
        <input
          id="note-search"
          v-model="query"
          type="search"
          :placeholder="$t('blog.searchPlaceholder')"
          class="w-full rounded-sm border border-hairline-strong bg-surface-container-lowest py-2.5 pl-10 pr-3 text-body-md text-on-surface transition-colors hover:border-on-surface-variant motion-reduce:transition-none"
        >
      </div>
      <div class="flex flex-wrap gap-2 pb-6" data-cursor-label="" role="group" :aria-label="$t('blog.filter')">
        <button type="button" :class="chip(!active)" :aria-pressed="!active" @click="active = null">{{ $t('blog.all') }} {{ posts.length }}</button>
        <button v-for="f in filters" :key="f.key" type="button" :class="chip(active === f.key)" :aria-pressed="active === f.key" @click="active = f.key">{{ f.label }} {{ f.count }}</button>
      </div>
      <p v-if="!shown.length" class="border-t border-hairline py-12 text-center text-body-md text-on-surface-variant" role="status">
        {{ $t('blog.empty') }}
      </p>
      <ol v-else class="border-t border-hairline">
        <li v-for="p in shown" :key="p.path" class="border-b border-hairline">
          <NuxtLink :to="p.path" class="group grid gap-2 py-8 md:grid-cols-12 md:gap-8" @click="track('note_click', { note_slug: slugOf(p.path), source: 'list' })">
            <div class="font-mono text-label-md text-on-surface-variant md:col-span-2">
              <time :datetime="p.date">{{ p.date.replaceAll('-', '/') }}</time>
              <p class="mt-1 text-label-sm text-lab-signal-ink">{{ $t('blog.readingTime', { n: p.readingTime }) }}</p>
            </div>
            <div class="md:col-span-8">
              <p class="text-label-sm font-medium text-lab-signal-ink">{{ $t(`categories.${p.category}`) }}</p>
              <h3 class="mt-1 text-headline-sm transition-colors group-hover:text-lab-signal-ink md:text-headline-md">{{ p.title }}</h3>
              <p class="mt-2 text-body-md text-on-surface-variant">{{ p.description }}</p>
            </div>
            <div class="hidden items-center justify-end md:col-span-2 md:flex">
              <UiIcon name="arrow_forward" class="text-[22px] text-lab-signal-ink transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </div>
          </NuxtLink>
        </li>
      </ol>
    </section>
  </div>
</template>

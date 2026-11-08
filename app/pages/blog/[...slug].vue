<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const collection = useBlogCollection()
const { data: post } = await useAsyncData(`post-${route.path}`, () => queryCollection(collection).path(route.path).first())

// Drafts (sample articles) are previewable in dev only.
if (!post.value || (post.value.draft && !import.meta.dev)) throw createError({ statusCode: 404, statusMessage: t('blog.notFound'), fatal: true })

const { track, slugOf } = useAnalytics()
const article = ref<HTMLElement>()

// note_read: once per visit, when the reader has scrolled 75% of the way through the article. Only a real scroll
// counts, so a short article that already fits on screen doesn't report as "read" on load.
onMounted(() => {
  const onScroll = () => {
    const rect = article.value?.getBoundingClientRect()
    if (!rect || innerHeight - rect.top < rect.height * 0.75) return
    removeEventListener('scroll', onScroll)
    track('note_read', { note_slug: slugOf(route.path), note_category: post.value?.category ?? '' })
  }
  addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => removeEventListener('scroll', onScroll))
})

const url = usePageUrl()
const title = `${post.value.title} | Elio Lee`
// Same default share image the layout sets (per language).
const ogImage = computed(() => `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}/og-image-${useNuxtApp().$i18n.locale.value}.jpg`)

useSeoMeta({
  title,
  description: post.value.description,
  ogTitle: title,
  ogDescription: post.value.description,
  ogType: 'article',
  ogUrl: url,
  articlePublishedTime: post.value.date,
  robots: post.value.draft ? 'noindex, nofollow' : undefined,
})
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.value.title,
      description: post.value.description,
      datePublished: post.value.date,
      dateModified: post.value.updated ?? post.value.date,
      image: ogImage.value,
      keywords: post.value.tags.join(', '),
      inLanguage: useNuxtApp().$i18n.localeProperties.value.language,
      author: { '@type': 'Person', name: '李柏偉', alternateName: 'Elio Lee' },
      mainEntityOfPage: url,
    }),
  }],
})
</script>

<template>
  <div v-if="post" class="section-x pb-space-xl pt-28 md:pt-32">
    <nav aria-label="Breadcrumb" class="mb-space-md flex flex-wrap items-center gap-2 font-mono text-label-md">
      <NuxtLink :to="localePath('/blog')" class="inline-flex items-center gap-1 text-secondary transition-colors hover:text-lab-signal-ink">
        <UiIcon name="arrow_back" class="text-[15px]" /> {{ $t('blog.breadcrumb') }}
      </NuxtLink>
      <span class="text-outline-variant">/</span>
      <span class="text-on-surface-variant">{{ $t(`categories.${post.category}`) }}</span>
    </nav>

    <!-- Reading view: one centred 720px column, with a static low-contrast TOC (220px) on wide screens. -->
    <div class="lg:grid lg:grid-cols-[minmax(0,720px)_220px] lg:justify-center lg:gap-14">
      <div class="min-w-0">
        <p v-if="post.draft" class="mb-4 rounded bg-tertiary-fixed px-3 py-2 font-mono text-label-sm text-on-tertiary-fixed">
          {{ $t('blog.draft') }}
        </p>

        <header class="space-y-4 pb-space-lg">
          <div class="flex flex-wrap items-center gap-3 font-mono text-label-md text-secondary">
            <UiChip tone="secondary">{{ $t(`categories.${post.category}`) }}</UiChip>
            <time :datetime="post.date">{{ post.date.replaceAll('-', '/') }}</time>
            <span class="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">{{ $t('blog.readingTime', { n: post.readingTime }) }}</span>
          </div>
          <h1 class="text-headline-lg-mobile md:text-headline-lg">{{ post.title }}</h1>
          <p class="text-body-lg text-on-surface-variant">{{ post.description }}</p>
        </header>

        <article ref="article" class="border-t border-hairline pt-space-lg">
          <ContentRenderer :value="post" class="prose-post" />
        </article>

        <footer class="mt-space-xl flex flex-col gap-4 border-t border-hairline pt-space-md sm:flex-row sm:items-center sm:justify-between">
          <ul class="flex flex-wrap gap-1.5 font-mono text-label-sm" :aria-label="$t('blog.tags')">
            <li v-for="t in post.tags" :key="t" class="rounded bg-surface-container px-2 py-0.5 text-on-surface-variant">{{ t }}</li>
          </ul>
          <NuxtLink :to="localePath('/blog')" class="inline-flex items-center justify-center gap-2 rounded border border-hairline px-4 py-2 text-body-sm font-medium transition-colors hover:border-hairline-strong hover:bg-surface-container-low">
            <UiIcon name="arrow_back" class="text-sm" /> {{ $t('blog.back') }}
          </NuxtLink>
        </footer>
      </div>

      <aside class="hidden lg:block">
        <BlogPostToc v-if="post.body.toc?.links?.length" :links="post.body.toc.links" />
      </aside>
    </div>
  </div>
</template>

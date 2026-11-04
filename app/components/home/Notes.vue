<script setup lang="ts">
const localePath = useLocalePath()
const collection = useBlogCollection()

// Only published articles; drafts never appear. The section hides itself if there are none.
const { data: posts } = await useAsyncData(`home-notes-${collection}`, () =>
  queryCollection(collection).where('draft', '=', false).order('date', 'DESC').limit(4).all(),
)
</script>

<template>
  <section v-if="posts?.length" class="section-x overflow-x-clip py-space-2xl md:py-space-3xl" aria-labelledby="notes-title">
    <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div class="lg:col-span-4">
        <p v-reveal="{ x: -32 }" class="lab-eyebrow">{{ $t('home.notesEyebrow') }}</p>
        <h2 id="notes-title" v-reveal="{ x: -32 }" class="mt-4 text-headline-lg-mobile md:text-headline-lg">{{ $t('home.notesTitle') }}</h2>
        <p v-reveal="{ x: -32, delay: 0.1 }" class="mt-4 text-body-md text-on-surface-variant">{{ $t('home.notesBody') }}</p>
        <NuxtLink v-reveal="{ x: -32, delay: 0.2 }" :to="localePath('/blog')" class="mt-6 inline-flex items-center gap-2 font-medium text-lab-signal-ink underline-offset-4 hover:underline">
          {{ $t('home.notesLink') }} <UiIcon name="arrow_forward" class="text-[18px]" />
        </NuxtLink>
      </div>

      <ol class="border-t border-hairline lg:col-span-8">
        <li v-for="(p, i) in posts" :key="p.path" v-reveal="i * 0.1" class="border-b border-hairline">
          <NuxtLink :to="p.path" class="group grid gap-1 py-6 sm:grid-cols-[7.5rem_1fr] sm:gap-6">
            <div class="font-mono text-label-md text-on-surface-variant">
              <time :datetime="p.date">{{ p.date.replaceAll('-', '/') }}</time>
              <p class="mt-1 text-label-sm uppercase tracking-wider text-lab-signal-ink">{{ p.readingTime }} min</p>
            </div>
            <div>
              <p class="font-mono text-label-sm uppercase tracking-wider text-lab-signal-ink">{{ $t(`categories.${p.category}`) }}</p>
              <h3 class="mt-1 text-headline-sm transition-colors group-hover:text-lab-signal-ink">{{ p.title }}</h3>
              <p class="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">{{ p.description }}</p>
            </div>
          </NuxtLink>
        </li>
      </ol>
    </div>
  </section>
</template>

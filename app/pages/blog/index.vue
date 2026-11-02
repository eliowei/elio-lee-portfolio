<script setup lang="ts">
import { method, page } from '~/data/notes'
import { categories } from '~/data/site'

const title = '技術筆記 | Elio Lee'
const description = page.lead
const url = `${useRuntimeConfig().public.siteUrl}/blog`

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: url })
useHead({ link: [{ rel: 'canonical', href: url }] })

// Published articles only (drafts = sample posts). The list appears once there is something to list.
const { data: posts } = await useAsyncData('blog-list', () => queryCollection('blog').where('draft', '=', false).order('date', 'DESC').all())
</script>

<template>
  <div>
    <LabPageHeader :eyebrow="page.eyebrow" :title="page.title" :lead="page.lead">
      <ul class="flex flex-wrap gap-2" aria-label="筆記特色">
        <li v-for="f in page.facts" :key="f" class="lab-chip">{{ f }}</li>
      </ul>
    </LabPageHeader>

    <!-- Editorial index of real articles -->
    <section v-if="posts?.length" class="section-x py-space-2xl" aria-labelledby="latest">
      <div class="flex items-end justify-between pb-6">
        <h2 id="latest" class="text-headline-md">最新筆記</h2>
        <span class="hidden font-mono text-label-sm uppercase tracking-wider text-on-surface-variant sm:inline">{{ posts.length }} articles</span>
      </div>
      <ol class="border-t border-hairline">
        <li v-for="p in posts" :key="p.path" class="border-b border-hairline">
          <NuxtLink :to="p.path" class="group grid gap-2 py-8 md:grid-cols-12 md:gap-8">
            <div class="font-mono text-label-md text-on-surface-variant md:col-span-2">
              <time :datetime="p.date">{{ p.date.replaceAll('-', '/') }}</time>
              <p class="mt-1 text-label-sm uppercase tracking-wider text-lab-signal-ink">{{ p.readingTime }} min read</p>
            </div>
            <div class="md:col-span-8">
              <p class="font-mono text-label-sm uppercase tracking-wider text-lab-signal-ink">{{ categories[p.category] }}</p>
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

    <section class="border-t border-hairline bg-white" aria-labelledby="method">
      <div class="section-x py-space-2xl">
        <p class="lab-eyebrow">{{ method.eyebrow }}</p>
        <h2 id="method" class="mt-4 max-w-2xl text-headline-lg-mobile md:text-headline-lg">{{ method.title }}</h2>
        <p class="mt-4 max-w-2xl text-body-md text-on-surface-variant">{{ method.body }}</p>
        <ol class="mt-10 grid gap-x-8 gap-y-8 border-t border-hairline pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="(s, i) in method.steps" :key="s.title">
            <div class="font-mono text-label-sm text-lab-signal-ink">STEP 0{{ i + 1 }}</div>
            <h3 class="mt-2 text-headline-sm">{{ s.title }}</h3>
            <p class="mt-1 text-body-sm text-on-surface-variant">{{ s.body }}</p>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { site } from '~/data/site'

const { cta } = useData()
const localePath = useLocalePath()
const { track } = useAnalytics()

const btn = 'inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-body-sm font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <section class="mb-space-xl py-space-md">
    <div class="lab-dark relative isolate overflow-hidden rounded-lg p-space-lg md:p-space-xl">
      <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div class="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div class="max-w-2xl space-y-3">
          <p class="lab-eyebrow">{{ cta.badge }}</p>
          <h3 class="font-heading text-headline-lg-mobile text-white md:text-headline-lg">{{ cta.title }}</h3>
          <p class="lab-muted text-body-md">{{ cta.body }}</p>
        </div>
        <div class="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <NuxtLink :to="localePath('/contact')" :class="[btn, 'bg-lab-signal text-lab-bg hover:bg-white']" @click="track('contact_click', { source: 'experience' })">
            {{ $t('common.contactMe') }} <UiIcon name="arrow_forward" class="text-[18px]" />
          </NuxtLink>
          <a :href="site.github" target="_blank" rel="noopener noreferrer" :class="[btn, 'border border-white/20 text-white hover:border-lab-signal hover:text-lab-signal']" @click="track('social_click', { platform: 'github', source: 'experience' })">GitHub</a>
        </div>
      </div>
    </div>
  </section>
</template>

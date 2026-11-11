<script setup lang="ts">
import { site } from '~/data/site'

const { contact } = useData()
const localePath = useLocalePath()
const { track } = useAnalytics()

const btn = 'inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-body-md font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <section id="contact" class="lab-dark relative isolate scroll-mt-20 overflow-hidden border-t border-white/10" aria-labelledby="contact-title">
    <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
    <div class="section-x grid items-end gap-10 py-space-2xl md:py-space-3xl lg:grid-cols-12">
      <div class="lg:col-span-8">
        <p v-reveal="{ x: -32 }" class="lab-eyebrow">{{ contact.eyebrow }}</p>
        <h2 id="contact-title" v-reveal="{ x: -32 }" class="mt-4 font-heading text-display-mobile text-white md:text-display">{{ contact.title }}</h2>
        <p class="lab-muted mt-5 max-w-xl text-body-lg">{{ contact.body }}</p>
      </div>
      <div class="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
        <NuxtLink :to="localePath('/contact')" :class="[btn, 'bg-lab-signal text-lab-bg hover:bg-white']" @click="track('contact_click', { source: 'home' })">{{ $t('common.contactMe') }} <UiIcon name="arrow_forward" class="text-[18px]" /></NuxtLink>
        <a :href="site.github" target="_blank" rel="noopener noreferrer" :class="[btn, 'border border-white/20 text-white hover:border-lab-signal hover:text-lab-signal']" @click="track('social_click', { platform: 'github', source: 'home' })">GitHub</a>
      </div>
    </div>
  </section>
</template>

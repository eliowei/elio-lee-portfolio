<script setup lang="ts">
import { site } from '~/data/site'

const { contact } = useData()
const localePath = useLocalePath()
const { track } = useAnalytics()

const btn = 'inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-body-md font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <section id="contact" class="home-signal lab-dark relative isolate scroll-mt-20 overflow-hidden border-t border-white/10" aria-labelledby="contact-title">
    <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
    <div class="section-x grid items-end gap-10 py-space-2xl md:py-space-3xl lg:grid-cols-12">
      <div class="lg:col-span-8">
        <div class="home-chapter" aria-hidden="true"><span>04</span><span class="home-chapter-line" /></div>
        <h2 id="contact-title" v-reveal.mask="0.08" class="font-heading text-display-mobile text-white md:text-display">{{ contact.title }}</h2>
        <p class="lab-muted mt-5 max-w-xl text-body-lg">{{ contact.body }}</p>
      </div>
      <div class="contact-actions lg:col-span-4">
        <div class="home-gate" aria-hidden="true"><span /></div>
        <div class="contact-buttons flex flex-wrap gap-3 lg:justify-end">
        <NuxtLink :to="localePath('/contact')" :class="[btn, 'bg-lab-signal text-lab-bg hover:bg-white']" @click="track('contact_click', { source: 'home' })">{{ $t('common.contactMe') }} <UiIcon name="arrow_forward" class="text-[18px]" /></NuxtLink>
        <a :href="site.github" target="_blank" rel="noopener noreferrer" :class="[btn, 'border border-white/20 text-white hover:border-lab-signal hover:text-lab-signal']" @click="track('social_click', { platform: 'github', source: 'home' })">GitHub</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact-actions { position: relative; isolation: isolate; padding-top: 4.5rem; padding-bottom: 2.5rem; }
.contact-buttons { position: relative; z-index: 1; }
.contact-actions .home-gate { top: 0; bottom: -8rem; left: -2rem; right: -2rem; width: auto; }
@media (min-width: 1024px) {
  .contact-actions { justify-self: end; width: max-content; max-width: 100%; }
}
@media (min-width: 1280px) { .contact-actions .home-gate { left: -4rem; right: -4rem; } }
@media (max-width: 1023px) {
  .contact-actions .home-gate { left: auto; right: 0; width: min(10rem, 35%); bottom: 0; opacity: 0.3; }
  .contact-actions .home-gate::before { display: none; }
  .contact-actions { padding-top: 2rem; padding-bottom: 1rem; }
  .contact-buttons { width: fit-content; padding: 0.5rem; margin: -0.5rem; background: var(--lab-bg); }
}
</style>

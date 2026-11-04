<script setup lang="ts">
import { legalLinks, navLinks, site } from '~/data/site'

const localePath = useLocalePath()
const { reopen } = useConsent()
const { track } = useAnalytics()
const heading = 'mb-3 font-mono text-label-sm uppercase tracking-[0.18em] text-lab-on-dark-muted'
const link = 'text-body-sm text-lab-on-dark-muted transition-colors hover:text-white'
</script>

<template>
  <footer class="lab-dark w-full border-t border-white/10">
    <div class="section-x">
      <div class="flex flex-col justify-between gap-10 py-space-xl md:flex-row">
        <div class="space-y-2">
          <div class="font-heading text-headline-sm text-white">{{ site.name }}</div>
          <p class="lab-muted max-w-md text-body-sm">{{ $t('footer.tagline') }}</p>
        </div>
        <div class="flex flex-wrap gap-x-16 gap-y-8">
          <nav :aria-label="$t('nav.footer')">
            <h2 :class="heading">{{ $t('footer.explore') }}</h2>
            <ul class="space-y-2">
              <li v-for="l in navLinks" :key="l.to"><NuxtLink :to="localePath(l.to)" :class="link" @click="l.key === 'contact' && track('contact_click', { source: 'footer' })">{{ $t(`nav.${l.key}`) }}</NuxtLink></li>
            </ul>
          </nav>
          <nav :aria-label="$t('footer.legal')">
            <h2 :class="heading">{{ $t('footer.legal') }}</h2>
            <ul class="space-y-2">
              <li v-for="k in legalLinks" :key="k"><NuxtLink :to="localePath(`/legal/${k}`)" :class="link">{{ $t(`legal.${k}`) }}</NuxtLink></li>
              <li><button type="button" :class="link" @click="reopen">{{ $t('footer.cookieSettings') }}</button></li>
            </ul>
          </nav>
        </div>
      </div>
      <div class="flex flex-col items-start justify-between gap-2 border-t border-white/10 py-5 font-mono text-label-sm text-lab-on-dark-muted sm:flex-row sm:items-center">
        <p>© {{ new Date().getFullYear() }} 李柏偉 (Elio Lee)</p>
      </div>
    </div>
  </footer>
</template>

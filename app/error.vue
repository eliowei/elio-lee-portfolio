<script setup lang="ts">
import type { NuxtError } from '#app'

// Error page for the whole app (unknown URLs and fatal errors thrown by pages). It replaces app.vue, so it brings its own layout.
// Same look as the section headers: dark stage, survey contours, signal orange. The server still answers with the real status
// code (404 / 500…), and the page is noindex so it never shows up in search or AI answers.
const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error.statusCode === 404)
const isDev = import.meta.dev // technical detail only while developing
const code = computed(() => String(props.error.statusCode || 500))
const title = computed(() => (is404.value ? t('error.title404') : t('error.titleGeneric')))
const lead = computed(() => (is404.value ? t('error.lead404') : t('error.leadGeneric')))

useSeoMeta({ title: () => `${code.value} | Elio Lee`, robots: 'noindex, nofollow' })

const links = computed(() => [
  { to: '/', label: t('error.home'), primary: true },
  { to: '/projects', label: t('nav.projects') },
  { to: '/blog', label: t('nav.blog') },
])

// An error page isn't a route: clearing the error and redirecting is how you leave it.
const go = (to: string) => clearError({ redirect: localePath(to) })
const btn = 'inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-body-md font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <NuxtLayout>
    <section class="lab-dark relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden" aria-labelledby="error-title">
      <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
      <!-- The code, huge and hollow, like a contour line on the survey map. -->
      <p
        class="pointer-events-none absolute -right-4 top-1/2 -z-10 -translate-y-1/2 select-none font-heading text-[clamp(10rem,34vw,26rem)] font-semibold leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.14)]"
        aria-hidden="true"
      >{{ code }}</p>

      <div class="section-x py-28 md:py-36">
        <p class="lab-eyebrow lab-in">{{ $t('error.eyebrow') }} {{ code }}</p>
        <h1 id="error-title" class="lab-in mt-5 max-w-3xl font-heading text-display-mobile text-white [text-wrap:balance] md:text-display" style="--d: 80ms">{{ title }}</h1>
        <p class="lab-in lab-muted mt-5 max-w-xl text-body-lg" style="--d: 160ms">{{ lead }}</p>
        <p v-if="isDev && !is404 && error.message" class="lab-in mt-4 max-w-xl font-mono text-label-sm text-lab-on-dark-muted" style="--d: 200ms">{{ error.message }}</p>

        <div class="lab-in mt-10 flex flex-wrap items-center gap-3" style="--d: 240ms">
          <a
            v-for="l in links"
            :key="l.to"
            :href="localePath(l.to)"
            :class="[btn, l.primary ? 'bg-lab-signal text-lab-bg hover:bg-white' : 'border border-white/25 text-white hover:border-white']"
            @click.prevent="go(l.to)"
          >{{ l.label }}</a>
        </div>

        <p class="lab-in mt-14 font-mono text-label-sm tracking-wider text-lab-on-dark-muted" style="--d: 320ms" aria-hidden="true">
          X —.— Y —.— {{ $t('error.readout') }}
        </p>
      </div>
    </section>
  </NuxtLayout>
</template>

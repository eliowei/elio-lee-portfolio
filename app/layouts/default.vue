<script setup lang="ts">
useScrollTracker()
// <html lang>, hreflang alternates, canonical and og:locale for every page.
const head = useLocaleHead({ seo: true })
useHead(() => ({ htmlAttrs: head.value.htmlAttrs, link: head.value.link, meta: head.value.meta }))

const { locale } = useI18n()

// Preload the fonts every page paints with, so they start downloading with the HTML instead of after the CSS is parsed.
// Chinese / Japanese pages also need the Noto Sans TC "ui" subset (regular + bold); English pages almost never do.
const fontFiles = ['inter-400-600', 'barlow-600', 'material-symbols-outlined-300-500']
const cjkFiles = ['noto-sans-tc-ui-400', 'noto-sans-tc-ui-700']
useHead(() => ({
  link: [...fontFiles, ...(locale.value === 'en' ? [] : cjkFiles)].map(f => ({ rel: 'preload', as: 'font', type: 'font/woff2', href: `/fonts/${f}.woff2`, crossorigin: 'anonymous' })),
}))

// Default share image, one per language (public/og-image-{zh,en,ja}.jpg). A page's own useSeoMeta (e.g. a project
// cover) overrides it.
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
const ogImage = computed(() => `${siteUrl}/og-image-${locale.value}.jpg`)
useSeoMeta({ ogImage, ogImageAlt: 'Elio Lee | Frontend Engineer, Creative Development', twitterCard: 'summary_large_image', twitterImage: ogImage })
</script>

<template>
  <div>
    <a href="#main" class="sr-only z-[70] rounded bg-lab-signal px-4 py-2 font-medium text-lab-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">{{ $t('skip') }}</a>
    <div class="page-scan" aria-hidden="true" />
    <LayoutAppHeader />
    <!-- No top padding: the first block of every page (hero / page header / breadcrumb) clears the fixed header itself. -->
    <main id="main" class="min-h-screen w-full bg-background">
      <slot />
    </main>
    <LayoutAppFooter />
    <LayoutBackToTop />
    <LayoutConsentBanner />
    <LayoutAppCursor />
  </div>
</template>

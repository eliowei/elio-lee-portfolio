<script setup lang="ts">
useScrollTracker()
// <html lang>, hreflang alternates, canonical and og:locale for every page.
const head = useLocaleHead({ seo: true })
useHead(() => ({ htmlAttrs: head.value.htmlAttrs, link: head.value.link, meta: head.value.meta }))

const { locale } = useI18n()

// Preload only the font files the first screen paints with (measured on the home page), so they start with the HTML instead of
// after the CSS is parsed. Pages in English also paint with the Noto Sans TC "en" subset; Chinese and Japanese pages with the
// "article" subset as well. Other subsets (ui, ja, bold variants) stay lazy: preloading what is not painted only competes for bandwidth.
const fontFiles = ['barlow-500', 'ibm-plex-mono-500', 'noto-sans-tc-en-400', 'noto-sans-tc-en-700']
const cjkFiles = ['noto-sans-tc-article-400']
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

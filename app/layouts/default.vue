<script setup lang="ts">
useScrollTracker()
// <html lang>, hreflang alternates, canonical and og:locale for every page.
const head = useLocaleHead({ seo: true })
useHead(() => ({ htmlAttrs: head.value.htmlAttrs, link: head.value.link, meta: head.value.meta }))
</script>

<template>
  <div>
    <a href="#main" class="sr-only z-[70] rounded bg-lab-signal px-4 py-2 font-medium text-lab-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">{{ $t('skip') }}</a>
    <LayoutAppHeader />
    <!-- No top padding: the first block of every page (hero / page header / breadcrumb) clears the fixed header itself. -->
    <main id="main" class="min-h-screen w-full bg-background">
      <slot />
    </main>
    <LayoutAppFooter />
    <LayoutBackToTop />
    <LayoutConsentBanner />
  </div>
</template>

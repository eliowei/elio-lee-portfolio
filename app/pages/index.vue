<script setup lang="ts">
import { hero } from '~/data/home'
import { site } from '~/data/site'

const title = '李柏偉 Elio Lee | 前端工程師'
const description = hero.intro
const url = useRuntimeConfig().public.siteUrl
const HomeSpace = defineAsyncComponent(() => import('~/components/home/Space.vue'))

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: url, twitterCard: 'summary' })
useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: '李柏偉',
      alternateName: 'Elio Lee',
      jobTitle: '前端工程師',
      ...(site.email && { email: site.email }),
      url,
      sameAs: [site.github, site.linkedin].filter(Boolean),
    }),
  }],
})
</script>

<template>
  <div class="flex w-full flex-col">
    <HomeSpace />
    <HomeAbout />
    <HomeNotes />
    <HomeContact />
  </div>
</template>

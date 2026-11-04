<script setup lang="ts">
import { site } from '~/data/site'

const { t } = useI18n()
const { hero } = useData()
// `|` can't live in an i18n message (vue-i18n reads it as a plural separator), so titles are joined here.
const title = `${t('home.title')} | ${t('home.titleTagline')}`
const description = hero.intro
const url = usePageUrl()
const HomeSpace = defineAsyncComponent(() => import('~/components/home/Space.vue'))

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: url })
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: '李柏偉',
      alternateName: 'Elio Lee',
      jobTitle: t('home.jobTitle'),
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

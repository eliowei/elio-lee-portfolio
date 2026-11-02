<script setup lang="ts">
import { roles, transitions } from '~/data/experience'

const title = '工作經歷 | Elio Lee'
const description = '從軍職、職訓到前端工程：Vue 2 / Vue 3 與 Vuetify 專案開發、元件互動問題排查、OpenLayers 空間圖資互動整合。'
const url = `${useRuntimeConfig().public.siteUrl}/experience`

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: url })
useHead({ link: [{ rel: 'canonical', href: url }] })

// Told in time order (roles are stored newest-first): each chapter is a light reading section; the
// transitions between them — in Elio's own words — are dark full-width bands.
const chapters = [...roles].reverse().map((role, i) => ({ role, n: String(i + 1).padStart(2, '0'), turn: transitions.find(t => t.after === role.no) }))
</script>

<template>
  <div>
    <ExperienceIntroHeader />

    <template v-for="c in chapters" :key="c.role.no">
      <section class="section-x py-space-2xl" :aria-labelledby="`chapter-${c.n}`">
        <div class="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
          <div class="lg:sticky lg:top-24 lg:self-start">
            <p class="lab-eyebrow">Chapter {{ c.n }}</p>
            <time class="mt-4 block font-mono text-label-md text-on-surface">{{ c.role.period }}</time>
            <p class="mt-1 text-body-sm text-on-surface-variant">{{ c.role.badge }}</p>
            <p class="text-body-sm text-on-surface-variant">{{ c.role.place }}</p>
          </div>
          <ExperienceRoleCard :id="`chapter-${c.n}`" v-reveal :role="c.role" />
        </div>
      </section>

      <section v-if="c.turn" class="lab-dark relative isolate overflow-hidden" :aria-label="c.turn.title">
        <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-80" aria-hidden="true" />
        <div class="section-x grid gap-8 py-space-2xl lg:grid-cols-[14rem_1fr] lg:gap-12">
          <p class="font-mono text-label-sm uppercase tracking-[0.18em] text-lab-on-dark-muted">Transition</p>
          <div class="max-w-3xl border-l-2 border-lab-signal pl-6 md:pl-8">
            <h2 class="font-heading text-headline-lg-mobile text-white md:text-headline-lg">{{ c.turn.title }}</h2>
            <p v-for="p in c.turn.body" :key="p" class="lab-muted mt-5 text-body-lg">{{ p }}</p>
          </div>
        </div>
      </section>
    </template>

    <div class="section-x border-t border-hairline-strong">
      <ExperienceStackMatrix />
      <ExperiencePrinciples />
      <ExperienceResumeCta />
    </div>
  </div>
</template>

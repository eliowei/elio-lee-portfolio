<script setup lang="ts">
const { about } = useData()
const localePath = useLocalePath()

const isDev = import.meta.dev
</script>

<template>
  <section id="about" class="section-x scroll-mt-8 overflow-x-clip py-space-2xl md:py-space-3xl" aria-labelledby="about-title">
    <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div class="lg:col-span-5">
        <p v-reveal="{ x: -32 }" class="lab-eyebrow">{{ about.eyebrow }}</p>
        <h2 id="about-title" v-reveal="{ x: -32 }" class="mt-4 text-headline-lg-mobile md:text-headline-lg">{{ about.title }}</h2>
        <figure v-if="about.photo" v-reveal="{ x: -32, delay: 0.15 }" class="mt-8 max-w-xs overflow-hidden rounded-lg shadow-sm">
          <NuxtPicture :src="about.photo" :alt="$t('home.photoAlt')" width="800" height="1000" sizes="320px" class="block" :img-attrs="{ class: 'aspect-[4/5] w-full object-cover', loading: 'lazy' }" />
        </figure>
        <p v-else-if="isDev" class="mt-8 max-w-xs rounded border border-dashed border-hairline-strong px-4 py-10 text-center font-mono text-label-sm text-secondary">
          TODO 個人照片：放入 public/images/ 後填入 data/home.ts 的 about.photo
        </p>
      </div>

      <div class="lg:col-span-7">
        <div class="max-w-2xl space-y-5 text-body-lg text-on-surface-variant">
          <p v-for="(p, i) in about.body" :key="p" v-reveal="i * 0.1">{{ p }}</p>
        </div>
        <dl class="mt-10 divide-y divide-hairline border-y border-hairline">
          <div v-for="(f, i) in about.facts" :key="f.label" v-reveal="i * 0.1" class="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
            <dt class="font-mono text-label-md uppercase tracking-wider text-lab-signal-ink">{{ f.label }}</dt>
            <dd class="text-body-md">{{ f.text }}</dd>
          </div>
        </dl>
        <NuxtLink v-reveal :to="localePath('/experience')" class="mt-8 inline-flex items-center gap-2 font-medium text-lab-signal-ink underline-offset-4 hover:underline">
          {{ $t('home.aboutLink') }} <UiIcon name="arrow_forward" class="text-[18px]" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

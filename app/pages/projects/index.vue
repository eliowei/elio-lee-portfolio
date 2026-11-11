<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { projects, projectImages } = useData()
const title = `${t('projects.title')} | Elio Lee`
const description = t('projects.description')

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: usePageUrl() })

// Plain HTML index of every project — the non-3D way in. Lead project first and larger.
const cover = (slug: string) => projectImages[slug]?.cover
</script>

<template>
  <div>
    <LabPageHeader
      :eyebrow="$t('projects.eyebrow')"
      :title="$t('projects.heading')"
      :lead="$t('projects.lead')"
    />
    <section class="section-x py-space-2xl" :aria-label="$t('projects.list')">
      <ol class="divide-y divide-hairline-strong border-y border-hairline-strong">
        <li v-for="(p, i) in projects" :key="p.slug">
          <NuxtLink :to="localePath(`/projects/${p.slug}`)" class="group grid items-center gap-6 py-8 md:grid-cols-12 md:gap-10">
            <div :class="i === 0 ? 'md:col-span-7' : 'md:col-span-4'">
              <NuxtImg
                v-if="cover(p.slug)"
                :src="cover(p.slug)!.src" :width="i === 0 ? 840 : 600" format="webp" loading="lazy" :alt="$t('projects.screenshotAlt', { title: p.title })"
                class="aspect-[16/10] w-full rounded-sm bg-surface-container object-cover object-top shadow-sm transition-shadow group-hover:shadow-md"
                :style="{ viewTransitionName: `cover-${p.slug}` }"
              />
            </div>
            <div :class="i === 0 ? 'md:col-span-5' : 'md:col-span-8'">
              <p class="flex items-center gap-2 font-mono text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
                <span class="h-2 w-2 rotate-45 bg-lab-signal" aria-hidden="true" />{{ p.code }} {{ p.kind }}
              </p>
              <h2 class="mt-3 font-heading text-headline-md md:text-headline-lg">{{ p.title }}</h2>
              <p class="mt-3 text-body-md text-on-surface-variant">{{ p.body }}</p>
              <ul class="mt-4 flex flex-wrap gap-1.5" :aria-label="$t('common.techUsed')">
                <li v-for="t in p.tags" :key="t" class="lab-chip-light">{{ t }}</li>
              </ul>
              <span class="mt-6 inline-flex items-center gap-2 font-medium text-lab-signal-ink">
                {{ $t('projects.readCase') }} <UiIcon name="arrow_forward" class="text-[18px] transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
              </span>
            </div>
          </NuxtLink>
        </li>
      </ol>
    </section>
  </div>
</template>

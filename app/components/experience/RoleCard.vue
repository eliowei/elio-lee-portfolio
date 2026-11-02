<script setup lang="ts">
import type { Role } from '~/data/experience'

// One career chapter's content. Period / place are rendered by the page's chapter column.
defineProps<{ role: Role }>()
</script>

<template>
  <article class="rounded-sm bg-surface-container-lowest p-space-md shadow-sm md:p-space-lg">
      <div class="flex flex-col justify-between gap-3 pb-space-md sm:flex-row sm:items-start">
        <div>
          <div class="mb-1 flex items-center gap-2">
            <h2 class="text-headline-md">{{ role.title }}</h2>
          </div>
          <p class="mt-1 text-body-md text-on-surface-variant">{{ role.summary }}</p>
        </div>
        <span class="inline-flex shrink-0 items-center gap-1 self-start rounded-md bg-surface-container-low px-3 py-1 font-mono text-label-sm text-on-surface-variant">
          <UiIcon :name="role.tagIcon" class="text-label-sm text-primary" /> {{ role.tagLabel }}
        </span>
      </div>

      <ul v-if="role.stack" class="mb-4 flex flex-wrap gap-2" aria-label="使用技術">
        <li v-for="t in role.stack" :key="t.label" class="rounded-full bg-surface-container-low px-2.5 py-1 font-mono text-label-sm font-medium" :class="t.primary ? 'text-primary' : 'text-secondary'">{{ t.label }}</li>
      </ul>

      <div class="mb-6">
        <h3 class="mb-3 flex items-center gap-2 text-headline-sm">
          <UiIcon :name="role.listIcon" class="text-headline-sm text-primary" /> {{ role.listTitle }}
        </h3>
        <ul class="space-y-3">
          <li v-for="i in role.items" :key="i.title" class="flex items-start gap-3 rounded bg-surface-container-low/50 p-3">
            <UiIcon :name="i.icon ?? 'check_circle'" class="mt-0.5 shrink-0 text-body-md text-primary" />
            <div>
              <div class="text-body-md font-medium">{{ i.title }}</div>
              <p class="mt-0.5 text-body-sm text-on-surface-variant">{{ i.body }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="role.highlight" class="rounded-lg border border-surface-container-high/60 bg-surface-container-low p-4">
        <div class="mb-2 flex items-center gap-2">
          <UiIcon :name="role.highlight.icon" class="text-body-md text-primary" />
          <span class="text-headline-sm">{{ role.highlight.title }}</span>
        </div>
        <p class="text-body-sm text-on-surface-variant">{{ role.highlight.body }}</p>
      </div>

      <div v-if="role.quote" class="flex items-start gap-3 rounded-lg border border-surface-container-high/60 bg-surface-container-low p-4">
        <UiIcon name="format_quote" class="mt-0.5 shrink-0 text-headline-sm text-primary" />
        <p class="text-body-sm font-medium text-on-surface-variant">{{ role.quote }}</p>
      </div>
  </article>
</template>

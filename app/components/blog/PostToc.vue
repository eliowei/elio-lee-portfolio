<script setup lang="ts">
import type { TocLink } from '@nuxt/content'

defineProps<{ links: TocLink[] }>()
</script>

<template>
  <nav class="sticky top-28" aria-label="文章大綱">
    <div class="mb-3 font-mono text-label-sm uppercase tracking-wider text-secondary">On this page</div>
    <ul class="border-l border-hairline">
      <li v-for="l in links" :key="l.id">
        <a
          :href="`#${l.id}`"
          class="-ml-px block border-l border-transparent py-1 pl-3 text-body-sm text-secondary transition-colors hover:border-primary-container hover:text-on-surface"
        >{{ l.text }}</a>
      </li>
    </ul>
  </nav>
</template>

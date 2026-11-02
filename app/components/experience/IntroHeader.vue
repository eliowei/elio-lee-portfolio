<script setup lang="ts">
import { intro } from '~/data/experience'
</script>

<template>
  <LabPageHeader :eyebrow="intro.eyebrow" :title="intro.title" :lead="intro.body">
    <ul class="flex flex-wrap gap-2" aria-label="經歷重點">
      <li v-for="p in intro.pills" :key="p.label" class="lab-chip gap-2">
        <UiIcon :name="p.icon" class="text-label-md text-lab-signal" /> {{ p.label }}
      </li>
    </ul>
  </LabPageHeader>
</template>

<script setup lang="ts">
const { intro } = useData()
</script>

<template>
  <LabPageHeader :eyebrow="intro.eyebrow" :title="intro.title" :lead="intro.body">
    <ul class="flex flex-wrap gap-2" :aria-label="$t('experience.highlights')">
      <li v-for="p in intro.pills" :key="p.label" class="lab-chip gap-2">
        <UiIcon :name="p.icon" class="text-label-md text-lab-signal" /> {{ p.label }}
      </li>
    </ul>
  </LabPageHeader>
</template>

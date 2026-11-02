<script setup lang="ts">
const tones = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  primary: 'bg-primary-fixed text-on-primary-fixed',
  secondary: 'bg-secondary-container text-on-secondary-fixed',
  tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
  solid: 'bg-primary text-on-primary',
  deep: 'bg-primary-container text-on-primary-container',
} as const

withDefaults(defineProps<{ tone?: keyof typeof tones }>(), { tone: 'neutral' })
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded px-3 py-0.5 font-mono text-label-sm" :class="tones[tone]">
    <slot />
  </span>
</template>

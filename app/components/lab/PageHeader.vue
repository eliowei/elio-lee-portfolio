<script setup lang="ts">
// Dark page header shared by the section index pages (experience / projects / notes).
defineProps<{ eyebrow?: string; title: string; lead?: string }>()
</script>

<template>
  <header class="lab-dark relative isolate overflow-hidden">
    <div class="lab-grid pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
    <div class="section-x pb-14 pt-28 md:pb-20 md:pt-36">
      <p v-if="eyebrow" class="lab-eyebrow lab-in">{{ eyebrow }}</p>
      <h1 class="lab-in mt-5 max-w-4xl font-heading [word-break:keep-all] [overflow-wrap:break-word] text-display-mobile text-white [text-wrap:balance] md:text-display" style="--d: 80ms">{{ title }}</h1>
      <p v-if="lead" class="lab-in lab-muted mt-5 max-w-2xl text-body-lg" style="--d: 160ms">{{ lead }}</p>
      <div class="lab-in mt-8 empty:hidden" style="--d: 220ms"><slot /></div>
    </div>
  </header>
</template>

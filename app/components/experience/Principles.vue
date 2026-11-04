<script setup lang="ts">
const { principles, principlesSection: s } = useData()
</script>

<template>
  <section class="pb-space-xl">
    <div class="mb-space-md flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container font-mono text-label-sm text-on-secondary-container">03</span>
        <span class="font-mono text-label-sm uppercase tracking-widest text-secondary">{{ s.eyebrow }}</span>
      </div>
      <h2 class="text-headline-lg tracking-tight">{{ s.title }}</h2>
      <p class="max-w-2xl text-body-md text-on-surface-variant">{{ s.body }}</p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div v-for="(p, i) in principles" :key="p.title" v-reveal="i * 0.1" class="flex flex-col justify-between rounded-lg bg-surface-container-low p-space-md">
        <div>
          <div class="mb-4 flex h-10 w-10 items-center justify-center rounded bg-surface-container-lowest text-primary shadow-sm">
            <UiIcon :name="p.icon" class="text-headline-sm" />
          </div>
          <h3 class="mb-2 text-headline-sm">{{ p.title }}</h3>
          <p class="text-body-sm text-on-surface-variant">{{ p.body }}</p>
        </div>
        <div class="mt-4 pt-3 font-mono text-label-sm text-secondary">{{ p.foot }}</div>
      </div>
    </div>
  </section>
</template>

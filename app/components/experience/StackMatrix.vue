<script setup lang="ts">
import { matrix } from '~/data/experience'
</script>

<template>
  <section class="py-space-xl md:py-space-2xl">
    <div class="mb-space-md flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container font-mono text-label-sm text-on-secondary-container">02</span>
        <span class="font-mono text-label-sm uppercase tracking-widest text-secondary">{{ matrix.eyebrow }}</span>
      </div>
      <h2 class="text-headline-lg tracking-tight">{{ matrix.title }}</h2>
      <p class="max-w-2xl text-body-md text-on-surface-variant">{{ matrix.body }}</p>
    </div>

    <div v-reveal class="w-full overflow-x-auto rounded-lg bg-surface-container-lowest shadow-sm">
      <table class="w-full min-w-[700px] text-left">
        <thead>
          <tr class="bg-surface-container-low">
            <th v-for="h in matrix.heads" :key="h" scope="col" class="px-4 py-3.5 font-mono text-label-md font-medium uppercase tracking-wider text-secondary">{{ h }}</th>
          </tr>
        </thead>
        <tbody class="text-body-sm text-on-surface-variant">
          <tr v-for="(r, i) in matrix.rows" :key="r.domain" class="transition-colors hover:bg-surface-container-low/50" :class="{ 'bg-surface-container-lowest': i % 2 }">
            <th scope="row" class="px-4 py-4 text-left font-medium text-on-surface">
              <div class="flex items-center gap-2"><UiIcon :name="r.icon" class="text-body-md text-primary" /> {{ r.domain }}</div>
            </th>
            <td class="px-4 py-4 font-mono text-label-md text-on-surface">{{ r.stack }}</td>
            <td class="px-4 py-4">{{ r.scope }}</td>
            <td class="px-4 py-4"><UiChip tone="secondary" class="!font-medium">{{ r.source }}</UiChip></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

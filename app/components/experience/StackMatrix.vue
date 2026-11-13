<script setup lang="ts">
const { matrix } = useData()
</script>

<template>
  <section class="py-space-xl md:py-space-2xl">
    <div class="mb-space-md flex flex-col gap-2">
      <h2 class="text-headline-lg tracking-tight">{{ matrix.title }}</h2>
      <p class="max-w-2xl text-body-md text-on-surface-variant">{{ matrix.body }}</p>
    </div>

    <!-- Phone: each row becomes a stacked card (labels from the header cells); md and up: a normal table. -->
    <div class="w-full rounded-lg bg-surface-container-lowest shadow-sm md:overflow-x-auto">
      <table class="block w-full text-left md:table">
        <thead class="sr-only md:table-header-group md:not-sr-only">
          <tr class="bg-surface-container-low">
            <th v-for="h in matrix.heads" :key="h" scope="col" class="px-4 py-3.5 text-label-md font-medium text-secondary">{{ h }}</th>
          </tr>
        </thead>
        <tbody class="block text-body-sm text-on-surface-variant md:table-row-group">
          <tr v-for="(r, i) in matrix.rows" :key="r.domain" class="block border-t border-hairline-strong px-4 py-4 first:border-t-0 md:table-row md:border-0 md:p-0 md:transition-colors md:hover:bg-surface-container-low/50" :class="{ 'md:bg-surface-container-lowest': i % 2 }">
            <th scope="row" class="block text-left font-medium text-on-surface md:table-cell md:px-4 md:py-4">
              <div class="flex items-center gap-2"><UiIcon :name="r.icon" class="text-body-md text-primary" /> {{ r.domain }}</div>
            </th>
            <td class="mt-2 block text-label-md text-on-surface md:mt-0 md:table-cell md:px-4 md:py-4">
              <span class="mr-2 font-semibold text-on-surface md:hidden">{{ matrix.heads[1] }}</span>{{ r.stack }}
            </td>
            <td class="mt-1 block md:mt-0 md:table-cell md:px-4 md:py-4">
              <span class="mr-2 font-semibold text-on-surface md:hidden">{{ matrix.heads[2] }}</span>{{ r.scope }}
            </td>
            <td class="mt-2 block md:mt-0 md:table-cell md:px-4 md:py-4"><UiChip tone="secondary" class="!font-medium">{{ r.source }}</UiChip></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

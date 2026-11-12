<script setup lang="ts">
const { principles, principlesSection: s } = useData()
</script>

<template>
  <section class="pb-space-xl">
    <div class="mb-space-md flex flex-col gap-2">
      <h2 class="text-headline-lg tracking-tight">{{ s.title }}</h2>
      <p class="max-w-2xl text-body-md text-on-surface-variant">{{ s.body }}</p>
    </div>

    <!-- Three stone blocks standing on one line, each a step taller: the outline of the ruin. The thickness is a solid offset, not a blur. -->
    <ol class="grid grid-cols-1 items-end gap-6 pr-2 md:grid-cols-3">
      <li
        v-for="(p, i) in principles"
        :key="p.title"
        class="border-t-8 border-[#3A3833] bg-lab-bg-raise p-space-md pb-space-lg text-lab-on-dark shadow-[8px_8px_0_#12110F]"
        :class="['md:min-h-[15.5rem]', 'md:min-h-[19.5rem]', 'md:min-h-[23rem]'][i]"
      >
        <h3 class="flex items-baseline gap-2.5 text-headline-sm">
          <span class="relative -top-0.5 h-[7px] w-[7px] shrink-0 rotate-45 bg-lab-signal" aria-hidden="true" />{{ p.title }}
        </h3>
        <p class="mt-3 text-body-sm leading-[1.8] text-lab-on-dark-muted">{{ p.body }}</p>
      </li>
    </ol>
  </section>
</template>

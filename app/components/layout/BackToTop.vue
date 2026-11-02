<script setup lang="ts">
const { y, progress } = useScroll()
const visible = computed(() => y.value > 400)
const toTop = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
</script>

<template>
  <Transition
    enter-active-class="transition duration-300"
    leave-active-class="transition duration-200"
    enter-from-class="translate-y-4 opacity-0"
    leave-to-class="translate-y-4 opacity-0"
  >
    <button
      v-if="visible"
      type="button"
      class="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-lab-bg px-4 py-2.5 text-body-sm text-white shadow-lg transition-colors hover:border-lab-signal hover:text-lab-signal motion-reduce:transition-none"
      @click="toTop"
    >
      <UiIcon name="arrow_upward" class="text-[18px]" />
      回到最上面
      <span class="font-mono text-label-sm text-lab-signal">{{ progress }}%</span>
    </button>
  </Transition>
</template>

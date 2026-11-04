<script setup lang="ts">
const { visible, restore, decide } = useConsent()
const localePath = useLocalePath()

onMounted(restore)

const btn = 'inline-flex items-center justify-center rounded-sm px-4 py-2 text-body-sm font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <Transition name="consent">
    <section
      v-if="visible"
      class="lab-dark fixed inset-x-4 bottom-4 z-[65] max-w-xl rounded-sm border border-white/15 p-5 shadow-[0_8px_30px_rgb(0_0_0/0.35)] md:left-8"
      :aria-label="$t('consent.label')"
    >
      <h2 class="font-heading text-headline-sm text-white">{{ $t('consent.title') }}</h2>
      <p class="lab-muted mt-2 text-body-sm">
        {{ $t('consent.body') }}
        <NuxtLink :to="localePath('/legal/privacy')" class="text-white underline underline-offset-4">{{ $t('consent.policy') }}</NuxtLink>
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" :class="[btn, 'bg-lab-signal text-lab-bg hover:bg-white']" @click="decide('granted')">{{ $t('consent.accept') }}</button>
        <button type="button" :class="[btn, 'border border-white/25 text-white hover:border-white']" @click="decide('denied')">{{ $t('consent.reject') }}</button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.consent-enter-active, .consent-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.consent-enter-from, .consent-leave-to { opacity: 0; transform: translateY(0.75rem); }
@media (prefers-reduced-motion: reduce) {
  .consent-enter-active, .consent-leave-active { transition: none; }
}
</style>

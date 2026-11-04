<script setup lang="ts">
import type { TocLink } from '@nuxt/content'

const props = defineProps<{ links: TocLink[] }>()

// Scroll spy: the active section is the last heading that has scrolled above the reading line (below the fixed header).
const active = ref<string | null>(null)
let frame = 0

function update() {
  frame = 0
  let current: string | null = null
  for (const l of props.links) {
    const el = document.getElementById(l.id)
    if (el && el.getBoundingClientRect().top <= 140) current = l.id
  }
  active.value = current
}
const onScroll = () => { frame ||= requestAnimationFrame(update) }

onMounted(() => {
  update()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <nav class="sticky top-28" :aria-label="$t('toc')">
    <div class="mb-3 font-mono text-label-sm uppercase tracking-wider text-secondary">On this page</div>
    <ul class="border-l border-hairline">
      <li v-for="l in links" :key="l.id">
        <a
          :href="`#${l.id}`"
          class="-ml-px block border-l py-1 pl-3 text-body-sm transition-colors motion-reduce:transition-none"
          :class="active === l.id ? 'border-lab-signal-ink font-medium text-lab-signal-ink' : 'border-transparent text-secondary hover:border-primary-container hover:text-on-surface'"
          :aria-current="active === l.id ? 'location' : undefined"
        >{{ l.text }}</a>
      </li>
    </ul>
  </nav>
</template>

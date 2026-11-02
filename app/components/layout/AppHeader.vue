<script setup lang="ts">
import { contactHref, navLinks, site } from '~/data/site'

const route = useRoute()
const { y, direction } = useScroll()

const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()

// Requested behaviour: scrolling down reveals the bar, scrolling up hides it (always shown near the top,
// and while the mobile menu is open). Flip to the usual pattern by changing `=== 'down'` to `=== 'up'`.
const shown = computed(() => menuOpen.value || y.value < 80 || direction.value === 'down')

const isActive = (to: string) => route.path.startsWith(to)
const contactExternal = contactHref.startsWith('http')

function closeMenu(returnFocus = false) {
  menuOpen.value = false
  if (returnFocus) menuButton.value?.focus()
}

watch(() => route.fullPath, () => closeMenu())

onMounted(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpen.value) closeMenu(true) }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <!-- No bar: text only. `mix-blend-difference` (on the fixed element itself, so it blends with the page) keeps
       the white text legible on both the dark stage and light paper. The mobile menu is a sibling, not blended. -->
  <header
    class="fixed inset-x-0 top-0 z-50 text-white mix-blend-difference transition-transform duration-300 motion-reduce:transition-none"
    :class="shown ? 'translate-y-0' : '-translate-y-full'"
  >
    <div class="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-margin-mobile md:h-20 md:px-margin">
      <NuxtLink to="/" class="flex flex-col font-mono text-label-sm uppercase leading-tight tracking-[0.16em]" aria-label="李柏偉 Elio Lee — 首頁">
        <span class="font-medium">Elio Lee</span>
        <span class="opacity-60">/ Digital Space</span>
      </NuxtLink>

      <nav class="hidden items-center gap-7 md:flex" aria-label="主要導覽">
        <NuxtLink
          v-for="l in navLinks"
          :key="l.to"
          :to="l.to"
          class="text-body-sm underline-offset-[6px] transition-opacity hover:underline"
          :class="isActive(l.to) ? 'underline' : 'opacity-75 hover:opacity-100'"
          :aria-current="isActive(l.to) ? 'page' : undefined"
        >{{ l.label }}</NuxtLink>
        <a :href="contactHref" :target="contactExternal ? '_blank' : undefined" :rel="contactExternal ? 'noopener noreferrer' : undefined" class="text-body-sm opacity-75 underline-offset-[6px] transition-opacity hover:underline hover:opacity-100">聯絡</a>
        <a :href="site.github" target="_blank" rel="noopener noreferrer" class="font-mono text-label-sm opacity-75 transition-opacity hover:opacity-100">GitHub ↗</a>
      </nav>

      <button
        ref="menuButton"
        type="button"
        class="inline-flex h-10 items-center gap-2 font-mono text-label-sm uppercase tracking-[0.16em] md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        :aria-label="menuOpen ? '關閉選單' : '開啟選單'"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>
    </div>
  </header>

  <nav v-if="menuOpen" id="mobile-nav" class="lab-dark fixed inset-x-0 top-16 z-50 border-b border-white/10 px-margin-mobile pb-6 pt-2 md:hidden" aria-label="主要導覽（手機）">
      <ul class="divide-y divide-white/10">
        <li v-for="l in navLinks" :key="l.to">
          <NuxtLink
            :to="l.to"
            class="flex items-center justify-between py-3.5 text-body-lg"
            :class="isActive(l.to) ? 'font-medium text-white' : 'text-lab-on-dark-muted'"
            :aria-current="isActive(l.to) ? 'page' : undefined"
          >
            {{ l.label }}
            <span v-if="isActive(l.to)" class="h-1.5 w-1.5 rotate-45 bg-lab-signal" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>
      <div class="mt-4 flex gap-3">
        <a
          :href="contactHref"
          :target="contactExternal ? '_blank' : undefined"
          :rel="contactExternal ? 'noopener noreferrer' : undefined"
          class="flex-1 rounded-sm bg-lab-signal px-4 py-3 text-center text-body-md font-medium text-lab-bg"
        >聯絡我</a>
        <a :href="site.github" target="_blank" rel="noopener noreferrer" class="rounded-sm border border-white/15 px-4 py-3 font-mono text-label-md text-white">GitHub</a>
      </div>
  </nav>
</template>

<script setup lang="ts">
import { navLinks, site } from '~/data/site'

const route = useRoute()
const { y, direction } = useScroll()

const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()

// Requested behaviour: scrolling down reveals the bar, scrolling up hides it (always shown near the top,
// and while the mobile menu is open). Flip to the usual pattern by changing `=== 'down'` to `=== 'up'`.
const shown = computed(() => menuOpen.value || y.value < 80 || direction.value === 'down')
const scrolled = computed(() => y.value >= 80)

const isActive = (to: string) => route.path.startsWith(to)

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
  <!-- At the top: no bar, and `mix-blend-difference` keeps the white text legible on both the dark stage and light paper.
       Past the top: a floating glass bar. Its negative margin keeps the logo and links aligned with the page content.
       Open mobile menu: the whole header turns the menu's solid colour, so the two read as one panel. -->
  <header
    class="fixed inset-x-0 top-0 z-50 text-white transition-[transform,background-color] duration-300 motion-reduce:transition-none"
    :class="[shown ? 'translate-y-0' : '-translate-y-full', menuOpen ? 'bg-lab-bg' : { 'mix-blend-difference': !scrolled }]"
  >
    <div class="mx-auto max-w-page px-margin-mobile md:px-margin">
    <div
      class="-mx-3 flex items-center justify-between gap-4 rounded-sm border px-3 transition-[height,margin,background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none md:-mx-5 md:px-5"
      :class="scrolled && !menuOpen ? 'mt-3 h-14 border-white/10 bg-lab-bg/90 shadow-[0_8px_30px_rgb(0_0_0/0.25)] backdrop-blur-xl' : 'h-16 border-transparent md:h-20'"
    >
      <NuxtLink to="/" class="text-body-md font-medium" aria-label="李柏偉 Elio Lee — 首頁">
        Elio Lee
      </NuxtLink>

      <nav class="hidden items-center gap-7 md:flex" aria-label="主要導覽">
        <NuxtLink
          v-for="l in navLinks"
          :key="l.to"
          :to="l.to"
          class="relative py-1 text-body-sm transition-opacity after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:transition-transform after:duration-300 motion-reduce:after:transition-none"
          :class="[isActive(l.to) ? 'after:scale-x-100' : 'opacity-70 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100', scrolled ? 'after:bg-lab-signal' : 'after:bg-current']"
          :aria-current="isActive(l.to) ? 'page' : undefined"
        >{{ l.label }}</NuxtLink>
        <a :href="site.github" target="_blank" rel="noopener noreferrer" class="text-body-sm opacity-70 transition-opacity hover:opacity-100">GitHub ↗</a>
      </nav>

      <button
        ref="menuButton"
        type="button"
        class="inline-flex h-10 items-center gap-2 text-body-sm md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        :aria-label="menuOpen ? '關閉選單' : '開啟選單'"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>
    </div>
    </div>
  </header>

  <Transition name="menu">
  <nav v-if="menuOpen" id="mobile-nav" class="lab-dark fixed inset-x-0 top-16 z-50 border-b border-white/10 px-margin-mobile pb-6 pt-2 md:hidden" aria-label="主要導覽（手機）">
      <ul class="divide-y divide-white/10">
        <li v-for="(l, i) in navLinks" :key="l.to" class="menu-item" :style="{ '--i': i }">
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
      <a :href="site.github" target="_blank" rel="noopener noreferrer" class="menu-item mt-4 block rounded-sm border border-white/15 px-4 py-3 text-center text-body-md text-white" :style="{ '--i': navLinks.length }">GitHub</a>
  </nav>
  </Transition>
</template>

<style scoped>
/* The panel unfolds downward from the bar, then its rows rise in one after another. */
.menu-enter-active { transition: clip-path 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); }
.menu-leave-active { transition: clip-path 0.22s ease-in; }
.menu-enter-from, .menu-leave-to { clip-path: inset(0 0 100% 0); }
.menu-enter-to, .menu-leave-from { clip-path: inset(0 0 0 0); }
.menu-enter-active .menu-item { animation: menu-rise 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(60ms + var(--i) * 40ms); }
@keyframes menu-rise { from { opacity: 0; transform: translateY(-0.5rem); } }

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active, .menu-leave-active { transition: none; }
  .menu-enter-active .menu-item { animation: none; }
}
</style>

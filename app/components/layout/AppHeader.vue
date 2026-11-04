<script setup lang="ts">
import { navLinks } from '~/data/site'

const route = useRoute()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale, locales } = useI18n()
const { track } = useAnalytics()
const short: Record<string, string> = { zh: '中', en: 'EN', ja: 'JP' }
const langOpen = ref(false)
const langButton = ref<HTMLButtonElement>()
const langBox = ref<HTMLElement>()
const { y, direction } = useScroll()

const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()

// Requested behaviour: scrolling down reveals the bar, scrolling up hides it (always shown near the top,
// and while the mobile menu is open). Flip to the usual pattern by changing `=== 'down'` to `=== 'up'`.
const shown = computed(() => menuOpen.value || langOpen.value || y.value < 80 || direction.value === 'down')
// An open panel (mobile menu or language list) needs a solid header: mix-blend-difference would wash it out.
const solid = computed(() => menuOpen.value || langOpen.value)
const scrolled = computed(() => y.value >= 80)

const isActive = (to: string) => route.path.startsWith(localePath(to))

function closeMenu(returnFocus = false) {
  menuOpen.value = false
  if (returnFocus) menuButton.value?.focus()
}
function closeLang(returnFocus = false) {
  langOpen.value = false
  if (returnFocus) langButton.value?.focus()
}
function toggleMenu() {
  langOpen.value = false
  menuOpen.value = !menuOpen.value
}
function toggleLang() {
  menuOpen.value = false
  langOpen.value = !langOpen.value
}

watch(() => route.fullPath, () => {
  closeMenu()
  closeLang()
})

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    if (langOpen.value) closeLang(true)
    else if (menuOpen.value) closeMenu(true)
  }
  // Clicking or tabbing anywhere outside the language box closes it.
  const onOutside = (e: Event) => { if (langOpen.value && !langBox.value?.contains(e.target as Node)) closeLang() }
  window.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('focusin', onOutside)
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    document.removeEventListener('pointerdown', onOutside)
    document.removeEventListener('focusin', onOutside)
  })
})
</script>

<template>
  <!-- At the top: no bar, and `mix-blend-difference` keeps the white text legible on both the dark stage and light paper.
       Past the top: a floating glass bar. Its negative margin keeps the logo and links aligned with the page content.
       Open mobile menu: the whole header turns the menu's solid colour, so the two read as one panel. -->
  <header
    class="fixed inset-x-0 top-0 z-50 text-white transition-[transform,background-color] duration-300 motion-reduce:transition-none"
    :class="[shown ? 'translate-y-0' : '-translate-y-full', solid ? 'bg-lab-bg' : { 'mix-blend-difference': !scrolled }]"
  >
    <div class="mx-auto max-w-page px-margin-mobile md:px-margin">
    <div
      class="-mx-3 flex items-center justify-between gap-4 rounded-sm border px-3 transition-[height,margin,background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none md:-mx-5 md:px-5"
      :class="scrolled && !solid ? 'mt-3 h-14 border-white/10 bg-lab-bg/90 shadow-[0_8px_30px_rgb(0_0_0/0.25)] backdrop-blur-xl' : 'h-16 border-transparent md:h-20'"
    >
      <NuxtLink :to="localePath('/')" class="text-body-md font-medium" :aria-label="$t('nav.home')">
        Elio Lee
      </NuxtLink>

      <nav class="ml-auto hidden items-center gap-7 md:flex" :aria-label="$t('nav.main')">
        <NuxtLink
          v-for="l in navLinks"
          :key="l.to"
          :to="localePath(l.to)"
          class="relative py-1 text-body-sm transition-opacity after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:transition-transform after:duration-300 motion-reduce:after:transition-none"
          :class="[isActive(l.to) ? 'after:scale-x-100' : 'opacity-70 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100', scrolled ? 'after:bg-lab-signal' : 'after:bg-current']"
          :aria-current="isActive(l.to) ? 'page' : undefined"
          @click="l.key === 'contact' && track('contact_click', { source: 'navbar' })"
        >{{ $t(`nav.${l.key}`) }}</NuxtLink>
      </nav>

      <!-- Language switch: a disclosure button over plain links to the same page in each language. -->
      <div ref="langBox" class="relative ml-auto md:ml-0">
        <button
          ref="langButton"
          type="button"
          class="inline-flex h-10 items-center gap-1 rounded-sm px-1.5 font-mono text-label-sm opacity-80 transition-opacity hover:opacity-100"
          :aria-expanded="langOpen"
          aria-controls="lang-menu"
          @click="toggleLang"
        >
          <UiIcon name="language" class="text-[16px]" />
          <span class="sr-only">{{ $t('nav.language') }}：</span>{{ short[locale] }}
          <UiIcon name="expand_more" class="text-[16px] transition-transform motion-reduce:transition-none" :class="{ 'rotate-180': langOpen }" />
        </button>
        <Transition name="lang">
          <ul v-if="langOpen" id="lang-menu" class="absolute right-0 top-full mt-2 min-w-[9rem] rounded-sm border border-white/10 bg-lab-bg py-1 shadow-[0_8px_30px_rgb(0_0_0/0.35)]">
            <li v-for="l in locales" :key="l.code">
              <NuxtLink
                :to="switchLocalePath(l.code)"
                :lang="l.language"
                class="flex items-center justify-between gap-4 px-4 py-2.5 text-body-sm transition-colors hover:bg-white/5"
                :class="l.code === locale ? 'text-white' : 'text-lab-on-dark-muted hover:text-white'"
                :aria-current="l.code === locale ? 'true' : undefined"
                @click="track('language_change', { language_from: locale, language_to: l.code })"
              >
                {{ l.name }}
                <span v-if="l.code === locale" class="h-1.5 w-1.5 rotate-45 bg-lab-signal" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </Transition>
      </div>

      <button
        ref="menuButton"
        type="button"
        class="inline-flex h-10 items-center gap-2 text-body-sm md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        :aria-label="menuOpen ? $t('nav.closeMenu') : $t('nav.openMenu')"
        @click="toggleMenu"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>
    </div>
    </div>
  </header>

  <Transition name="menu">
  <nav v-if="menuOpen" id="mobile-nav" class="lab-dark fixed inset-x-0 top-16 z-50 border-b border-white/10 px-margin-mobile pb-6 pt-2 md:hidden" :aria-label="$t('nav.mainMobile')">
      <ul class="divide-y divide-white/10">
        <li v-for="(l, i) in navLinks" :key="l.to" class="menu-item" :style="{ '--i': i }">
          <NuxtLink
            :to="localePath(l.to)"
            class="flex items-center justify-between py-3.5 text-body-lg"
            :class="isActive(l.to) ? 'font-medium text-white' : 'text-lab-on-dark-muted'"
            :aria-current="isActive(l.to) ? 'page' : undefined"
            @click="l.key === 'contact' && track('contact_click', { source: 'navbar' })"
          >
            {{ $t(`nav.${l.key}`) }}
            <span v-if="isActive(l.to)" class="h-1.5 w-1.5 rotate-45 bg-lab-signal" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>
  </nav>
  </Transition>
</template>

<style scoped>
/* The panel unfolds downward from the bar, then its rows rise in one after another. */
.menu-enter-active { transition: clip-path 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); }
.menu-leave-active { transition: clip-path 0.22s ease-in; }
.menu-enter-from, .menu-leave-to { clip-path: inset(0 0 100% 0); }
.menu-enter-to, .menu-leave-from { clip-path: inset(0 0 0 0); }
.lang-enter-active, .lang-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.lang-enter-from, .lang-leave-to { opacity: 0; transform: translateY(-0.25rem); }
.menu-enter-active .menu-item { animation: menu-rise 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(60ms + var(--i) * 40ms); }
@keyframes menu-rise { from { opacity: 0; transform: translateY(-0.5rem); } }

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active, .menu-leave-active, .lang-enter-active, .lang-leave-active { transition: none; }
  .menu-enter-active .menu-item { animation: none; }
}
</style>

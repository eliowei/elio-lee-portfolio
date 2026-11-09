<script setup lang="ts">
// Moon in light mode, sun in dark mode; they swap with a turn. Which one shows is pure CSS keyed on <html data-theme> (see main.css), so the
// server-rendered markup is identical for both themes and there is no hydration mismatch.
const { theme, toggle } = useTheme()
// aria-pressed is only known on the client; start false so server and first client render match.
const mounted = ref(false)

// The reveal circle grows from the click; keyboard activation (no real pointer position) grows from the button's centre.
function onClick(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const fromPointer = e.detail > 0
  toggle({ x: fromPointer ? e.clientX : r.left + r.width / 2, y: fromPointer ? e.clientY : r.top + r.height / 2 })
}
onMounted(() => (mounted.value = true))
</script>

<template>
  <button
    type="button"
    data-cursor-label=""
    class="inline-flex h-10 w-10 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
    :aria-pressed="mounted && theme === 'dark'"
    :aria-label="$t('nav.darkMode')"
    @click="onClick"
  >
    <span class="theme-toggle-icons" aria-hidden="true">
      <UiIcon name="dark_mode" class="theme-icon-moon text-[18px]" />
      <UiIcon name="light_mode" class="theme-icon-sun text-[18px]" />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { ProjectImage } from '~/data/project-images'

// Full-screen screenshot viewer: dark overlay, centred image, prev/next, close, "01 / 04" counter.
// Keys: ← → to navigate, Esc to close. Swipe left/right on touch. Focus is kept inside and restored on close.
const props = defineProps<{ slides: ProjectImage[]; index: number | null }>()
const emit = defineEmits<{ 'update:index': [value: number | null] }>()

const current = computed(() => (props.index === null ? undefined : props.slides[props.index]))
const dialog = ref<HTMLElement>()
const closeBtn = ref<HTMLButtonElement>()
let opener: HTMLElement | null = null
let touchX = 0

const pad = (n: number) => String(n).padStart(2, '0')
const close = () => emit('update:index', null)
function go(step: number) {
  if (props.index === null) return
  emit('update:index', (props.index + step + props.slides.length) % props.slides.length)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === 'Tab') {
    const buttons = dialog.value?.querySelectorAll<HTMLElement>('button')
    if (!buttons?.length) return
    const first = buttons[0]!
    const last = buttons[buttons.length - 1]!
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0]!.clientX - touchX
  if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
}

watch(() => props.index !== null, async (open) => {
  if (open) {
    opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    addEventListener('keydown', onKey)
    await nextTick()
    closeBtn.value?.focus()
  }
  else {
    document.body.style.overflow = ''
    removeEventListener('keydown', onKey)
    opener?.focus()
    opener = null
  }
})

// Warm the cache for the neighbours so ← → feel instant. Same `sizes` + AVIF as <NuxtPicture> above,
// so the browser picks the very candidate it will need (preloading the original PNG would waste bandwidth).
const VIEWER_SIZES = 'xs:100vw sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw'
const $img = useImage()
watch(() => props.index, (i) => {
  if (i === null) return
  for (const d of [1, -1]) {
    const s = props.slides[(i + d + props.slides.length) % props.slides.length]
    if (!s) continue
    const { srcset, sizes } = $img.getSizes(s.src, { sizes: VIEWER_SIZES, modifiers: { width: s.w, height: s.h, format: 'avif' } })
    const pre = new Image()
    pre.sizes = sizes ?? ''
    pre.srcset = srcset ?? ''
  }
})

onBeforeUnmount(() => {
  removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

const circle = 'absolute flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-white motion-reduce:transition-none'
</script>

<template>
  <Teleport to="body">
    <div
      v-if="current"
      ref="dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('projects.viewer')"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      @click.self="close"
      @touchstart.passive="touchX = $event.touches[0]!.clientX"
      @touchend.passive="onTouchEnd"
    >
      <button ref="closeBtn" type="button" :aria-label="$t('common.close')" :class="[circle, 'right-3 top-3 sm:right-5 sm:top-5']" @click="close">
        <UiIcon name="close" class="text-[22px]" />
      </button>

      <template v-if="slides.length > 1">
        <button type="button" :aria-label="$t('projects.prev')" :class="[circle, 'left-2 top-1/2 -translate-y-1/2 sm:left-6']" @click="go(-1)">
          <UiIcon name="chevron_left" class="text-[26px]" />
        </button>
        <button type="button" :aria-label="$t('projects.nextSlide')" :class="[circle, 'right-2 top-1/2 -translate-y-1/2 sm:right-6']" @click="go(1)">
          <UiIcon name="chevron_right" class="text-[26px]" />
        </button>
      </template>

      <NuxtPicture
        :key="current.src"
        :src="current.src"
        :width="current.w"
        :height="current.h"
        :sizes="VIEWER_SIZES"
        :alt="current.caption ?? $t('projects.viewer')"
        :img-attrs="{ class: 'h-auto max-h-[78vh] w-auto max-w-[calc(100vw-6rem)] rounded object-contain sm:max-w-[calc(100vw-10rem)]' }"
        class="contents"
      />

      <div class="absolute inset-x-0 bottom-4 flex justify-center px-4" aria-live="polite">
        <span class="max-w-full truncate rounded-full bg-black/60 px-4 py-1.5 font-mono text-label-md text-white">
          {{ pad((index ?? 0) + 1) }} / {{ pad(slides.length) }}<template v-if="current.caption"> · {{ current.caption }}</template>
        </span>
      </div>
    </div>
  </Teleport>
</template>

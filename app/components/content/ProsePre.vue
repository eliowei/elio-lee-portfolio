<script setup lang="ts">
// Overrides Nuxt Content's code block: "Code Snippets" from the design system —
// dark #09090B container, file/language header in label-sm, discrete Copy button.
const props = defineProps<{
  code?: string
  language?: string | null
  filename?: string | null
  class?: string | null
  highlights?: number[]
  meta?: string | null
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code ?? '')
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1500)
  }
  catch { /* clipboard unavailable (insecure context / denied): leave the button as is */ }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="my-6 overflow-hidden rounded-lg bg-[#09090b] ring-1 ring-hairline">
    <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 font-mono text-label-sm text-slate-400">
      <span class="truncate">{{ filename || language || 'code' }}</span>
      <span class="flex shrink-0 items-center gap-3">
        <span v-if="filename && language" class="rounded bg-white/10 px-1.5 py-0.5">{{ language }}</span>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-white/10 hover:text-white"
          @click="copy"
        >
          <UiIcon :name="copied ? 'check' : 'content_copy'" class="text-[14px]" />
          <span aria-live="polite">{{ copied ? $t('code.copied') : $t('code.copy') }}</span>
        </button>
      </span>
    </div>
    <pre :class="props.class"><slot /></pre>
  </div>
</template>

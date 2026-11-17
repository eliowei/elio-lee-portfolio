<script setup lang="ts">
const props = withDefaults(defineProps<{ ready?: boolean }>(), { ready: true })
const { about } = useData()
const { t } = useI18n()
const localePath = useLocalePath()
const id = useId()
const active = ref<number | null>(null)
const section = ref<HTMLElement>()
const triggers = ref<HTMLButtonElement[]>([])
const entries = computed(() => [
  { label: t('home.aboutHeading'), body: about.body.length > 1 ? about.body.slice(1) : about.body },
  ...about.facts.map(f => ({ label: f.label, body: [f.text] })),
])
function preview(event: PointerEvent, index: number) {
  if (event.pointerType === 'mouse') active.value = index
}
function leave(event: PointerEvent) {
  if (!(event.currentTarget as HTMLElement).contains(document.activeElement)) active.value = null
}
function blur(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) active.value = null
}
function close() {
  const index = active.value
  if (index !== null) triggers.value[index]?.focus()
  active.value = null
}
function outside(event: PointerEvent) {
  if (!section.value?.contains(event.target as Node) || !(event.target as Element).closest('.archive-item')) active.value = null
}
watch(() => props.ready, ready => { if (!ready) active.value = null })
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>

<template>
  <section id="about" ref="section" class="home-archive scroll-mt-20" :class="{ 'archive-ready': ready }" aria-labelledby="about-title" @keydown.esc.stop.prevent="close">
    <div class="archive-axis" aria-hidden="true"><span /></div>
    <div class="section-x archive-content grid gap-12 py-space-2xl lg:grid-cols-12 lg:gap-20">
      <div class="archive-identity lg:col-span-5">
        <div class="archive-arrival" style="--delay: 100ms; --from-x: 48px">
          <div class="home-chapter" aria-hidden="true"><span>02</span><span class="home-chapter-line" /></div>
          <h2 id="about-title" class="text-headline-lg-mobile md:text-headline-lg">{{ about.title }}</h2>
          <p class="mt-5 max-w-sm text-body-md text-on-surface-variant">{{ $t('home.aboutPositioning') }}</p>
        </div>
        <figure v-if="about.photo" class="archive-arrival home-portrait mt-8 max-w-xs overflow-hidden" style="--delay: 240ms; --from-x: 64px">
          <NuxtPicture :src="about.photo" :alt="$t('home.photoAlt')" width="800" height="1000" sizes="320px" densities="x1 x1.75" class="block" :img-attrs="{ class: 'aspect-[4/5] w-full object-cover', loading: 'lazy' }" />
        </figure>
      </div>
      <div class="archive-biography lg:col-span-7">
        <div class="archive-nodes">
          <div v-for="(entry, i) in entries" :key="entry.label" class="archive-arrival archive-item" :class="{ 'is-active': active === i }" :style="{ '--delay': (380 + i * 140) + 'ms', '--from-x': '-40px' }" @pointerenter="preview($event, i)" @pointerleave="leave" @focusout="blur">
            <button :id="id + '-trigger-' + i" :ref="el => { if (el) triggers[i] = el as HTMLButtonElement }" type="button" class="archive-trigger" :aria-expanded="active === i" :aria-controls="id + '-panel-' + i" @focus="active = i" @click="active = i">
              <span class="archive-node" aria-hidden="true" />
              <span class="font-mono text-label-sm text-on-surface-variant">0{{ i + 1 }}</span>
              <span>{{ entry.label }}</span>
              <span class="ml-auto text-primary" aria-hidden="true">+</span>
            </button>
            <Transition name="archive-popup"><div v-show="active === i" :id="id + '-panel-' + i" class="archive-popover" role="region" :aria-labelledby="id + '-trigger-' + i">
              <div class="flex items-center justify-between gap-4 mb-4">
                <span class="text-primary text-label-md">{{ entry.label }}</span>
                <button type="button" class="archive-close" :aria-label="$t('home.closeDetail')" @click="close">×</button>
              </div>
              <div class="space-y-4 text-body-md text-on-surface">
                <p v-for="paragraph in entry.body" :key="paragraph">{{ paragraph }}</p>
              </div>
            </div></Transition>
          </div>
        </div>
        <NuxtLink :to="localePath('/experience')" class="archive-arrival mt-10 inline-flex items-center gap-2 font-medium text-primary u-link" style="--delay: 960ms; --from-x: -24px">
          {{ $t('home.aboutLink') }} <UiIcon name="arrow_forward" class="text-[18px]" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-archive { --archive-panel: rgb(var(--c-surface-bright)); --archive-ink: rgb(var(--c-on-surface)); --archive-edge: rgb(var(--c-hairline-strong)); --archive-signal: rgb(var(--c-primary)); color: var(--archive-ink); background: rgb(var(--c-background) / 0.72); position: relative; isolation: isolate; padding: 4rem 0; min-height: 85svh; }
.archive-content { position: relative; }
.archive-axis { position: absolute; top: var(--guide-start, 0px); bottom: 3rem; left: var(--guide-x, 46%); width: 1px; background: rgb(255 91 31 / 0.14); pointer-events: none; }
.archive-axis span { display: block; height: 100%; background: linear-gradient(var(--archive-signal), rgb(255 91 31 / 0.1)); transform: scaleY(0); transform-origin: top; transition: transform 650ms ease; }
.archive-ready .archive-axis span { transform: scaleY(1); }
.archive-arrival { opacity: 0; visibility: hidden; transform: translate(var(--from-x, 0px), 22px); transition: opacity 650ms ease, transform 800ms cubic-bezier(.2,.7,.2,1), visibility 0s 800ms; }
.archive-ready .archive-arrival { opacity: 1; visibility: visible; transform: none; transition-delay: var(--delay, 0ms); }
.archive-identity { position: relative; }
.home-portrait { border-color: rgb(234 230 222 / 0.2); background: var(--archive-panel); box-shadow: 12px 12px 0 rgb(0 0 0 / 0.2); }
.archive-biography { padding-top: 3rem; }
.archive-nodes { display: grid; gap: 1.5rem; }
.archive-item { position: relative; width: min(100%, 25rem); }
.archive-item:nth-child(even) { justify-self: end; }
.archive-item.is-active { z-index: 5; }
.archive-trigger { display: flex; align-items: center; gap: 1rem; width: 100%; min-height: 4.5rem; padding: 1rem 1.25rem; border: 1px solid var(--archive-edge); background: var(--archive-panel); color: var(--archive-ink); text-align: left; font-size: 1.125rem; box-shadow: 0 12px 28px rgb(0 0 0 / 0.15); }
.archive-trigger:hover, .archive-trigger[aria-expanded='true'] { border-color: var(--archive-signal); }
.archive-node { width: 7px; height: 7px; flex-shrink: 0; border: 1px solid var(--archive-signal); transform: rotate(45deg); }
.is-active .archive-node { background: var(--archive-signal); box-shadow: 0 0 12px rgb(255 91 31 / 0.5); }
.archive-popover { position: absolute; top: 100%; inset-inline: 0; padding: 1.25rem; max-height: min(24rem, 55svh); overflow-y: auto; overscroll-behavior: contain; background: var(--archive-panel); color: var(--archive-ink); border: 1px solid var(--archive-signal); box-shadow: 0 12px 32px rgb(0 0 0 / 0.18); }
.archive-close { display: grid; place-items: center; width: 2rem; height: 2rem; color: var(--archive-ink); border: 1px solid var(--archive-edge); }
@media (min-width: 768px) {
  :global([data-scene-ready] .home-archive) { background: linear-gradient(to bottom, rgb(var(--c-background) / 0.35), rgb(var(--c-background) / 0.85)); }
}
@media (max-width: 1023px) {
  .archive-axis { display: none; }
  .home-archive { min-height: auto; padding: 1.5rem 0; }
  .archive-arrival { transform: translateY(22px); }
  .archive-item:nth-child(even) { justify-self: stretch; }
  .home-portrait { max-width: min(20rem, calc(100% - 12px)); }
  .archive-biography { padding-top: 0; }
  .archive-item { width: 100%; }
  .archive-popover { position: relative; top: auto; border-top: 0; box-shadow: none; }
  .archive-trigger:hover, .archive-trigger:focus-visible { transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .archive-arrival, .archive-ready .archive-arrival { transition: none; transform: none; }
  .archive-axis span { transition: none; }
}

.archive-trigger { transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease; }
.archive-trigger:hover, .archive-trigger:focus-visible { transform: translateY(-5px); background: rgb(var(--c-surface-bright)); box-shadow: 0 8px 24px rgb(255 91 31 / 0.14); }
.archive-popup-enter-active, .archive-popup-leave-active { transition: opacity 180ms ease, transform 220ms ease; }
.archive-popup-enter-from, .archive-popup-leave-to { opacity: 0; transform: translateY(-8px) scale(0.98); }
@media (prefers-reduced-motion: reduce) {
  .archive-trigger, .archive-popup-enter-active, .archive-popup-leave-active { transition: none; }
  .archive-trigger:hover, .archive-trigger:focus-visible { transform: none; }
}
</style>

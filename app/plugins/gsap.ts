import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// `v-reveal` / `v-reveal="0.2"` (delay in seconds): fade + rise once when scrolled into view.
// `v-reveal="{ x: -32, delay: 0.2 }"`: slide in sideways instead of rising, from `lg` up where sections have two columns (the section needs overflow-x-clip).
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) gsap.registerPlugin(ScrollTrigger)

  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement & { _reveal?: gsap.core.Tween }, { value }) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const { x: slide = 0, delay = 0 } = typeof value === 'object' ? value : { delay: value }
      const x = matchMedia('(min-width: 1024px)').matches ? slide : 0
      el._reveal = gsap.from(el, {
        opacity: 0,
        x,
        y: x ? 0 : 24,
        duration: 0.7,
        delay,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      })
    },
    unmounted(el: HTMLElement & { _reveal?: gsap.core.Tween }) {
      el._reveal?.scrollTrigger?.kill()
      el._reveal?.kill()
    },
    getSSRProps: () => ({}),
  })
})

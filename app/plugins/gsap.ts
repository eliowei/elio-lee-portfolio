import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// `v-reveal` / `v-reveal="0.2"` (delay in seconds): fade + rise once when scrolled into view.
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) gsap.registerPlugin(ScrollTrigger)

  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement & { _reveal?: gsap.core.Tween }, { value }) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      el._reveal = gsap.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        delay: value || 0,
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

// `v-reveal` / `v-reveal="0.2"` (delay in seconds): fade + rise once when scrolled into view.
// `v-reveal="{ x: -32, delay: 0.2 }"`: slide in sideways instead of rising, from `lg` up where sections have two columns (the section needs overflow-x-clip).
// Plain IntersectionObserver + Web Animations API (no animation library in the bundle). Like before, the element is
// hidden when the directive mounts and revealed once its top crosses 92% of the viewport height.
type Revealable = HTMLElement & { _reveal?: { io: IntersectionObserver; anim?: Animation } }

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: Revealable, { value }) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const { x: slide = 0, delay = 0 } = typeof value === 'object' ? value : { delay: value }
      const x = matchMedia('(min-width: 1024px)').matches ? slide : 0
      const y = x ? 0 : 24
      el.style.opacity = '0'
      const state: NonNullable<Revealable['_reveal']> = {
        io: new IntersectionObserver((entries, io) => {
          // Also reveal elements already scrolled past (reload mid-page): their top is above the viewport's bottom edge.
          if (!entries.some(e => e.isIntersecting || e.boundingClientRect.top < (e.rootBounds?.bottom ?? innerHeight))) return
          io.disconnect()
          state.anim = el.animate(
            [{ opacity: 0, transform: `translate(${x}px, ${y}px)` }, { opacity: 1, transform: 'none' }],
            { duration: 700, delay: delay * 1000, easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)', fill: 'backwards' },
          )
          el.style.opacity = ''
        }, { rootMargin: '0px 0px -8% 0px' }),
      }
      el._reveal = state
      state.io.observe(el)
    },
    unmounted(el: Revealable) {
      el._reveal?.io.disconnect()
      el._reveal?.anim?.cancel()
    },
    getSSRProps: () => ({}),
  })
})

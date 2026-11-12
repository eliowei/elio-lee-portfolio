// `v-reveal` shows an element once, when it scrolls into view. `v-reveal="0.2"`: delay in seconds.
//   plain          → fades in (no movement)
//   `.mask`        → wipes up from its bottom edge while rising a little: the same direction and curve as the page scan (headings, images)
// Plain IntersectionObserver + Web Animations API (no animation library). The element is hidden when the directive mounts
// and revealed once its top crosses 92% of the viewport height. Reduced motion: nothing is hidden or animated.
type Kind = 'fade' | 'mask'
type Revealable = HTMLElement & { _reveal?: { io: IntersectionObserver; anim?: Animation } }

const SWEEP = 'cubic-bezier(0.76, 0, 0.24, 1)' // page scan / theme circle
const SOFT = 'cubic-bezier(0.2, 0.7, 0.2, 1)' // the site's ease-out for entrances
const HIDDEN: Record<Kind, Record<string, string>> = {
  fade: { opacity: '0' },
  mask: { 'clip-path': 'inset(100% 0 0 0)' },
}
const FRAMES: Record<Kind, [Keyframe[], KeyframeAnimationOptions]> = {
  fade: [[{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: SOFT }],
  // the end clip is a little larger than the box, so descenders and shadows are not cut
  mask: [[{ clipPath: 'inset(100% 0 0 0)', transform: 'translateY(0.3em)' }, { clipPath: 'inset(-0.3em -0.2em -0.3em -0.2em)', transform: 'none' }], { duration: 900, easing: SWEEP }],
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: Revealable, { value, modifiers }) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const kind: Kind = modifiers.mask ? 'mask' : 'fade'
      const delay = Number(value) || 0
      for (const [prop, v] of Object.entries(HIDDEN[kind])) el.style.setProperty(prop, v)
      const state: NonNullable<Revealable['_reveal']> = {
        io: new IntersectionObserver((entries, io) => {
          // Also reveal elements already scrolled past (reload mid-page): their top is above the viewport's bottom edge.
          if (!entries.some(e => e.isIntersecting || e.boundingClientRect.top < (e.rootBounds?.bottom ?? innerHeight))) return
          io.disconnect()
          const [keyframes, options] = FRAMES[kind]
          state.anim = el.animate(keyframes, { ...options, delay: delay * 1000, fill: 'backwards' })
          for (const prop of Object.keys(HIDDEN[kind])) el.style.removeProperty(prop)
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

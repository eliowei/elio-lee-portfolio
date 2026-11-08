// Page transition: a survey-orange scan line sweeps across the screen and the new page is revealed behind it.
// Forward navigation sweeps bottom → top; Back sweeps top → bottom, so the direction reads as "going forward / back".
// Nuxt starts the View Transition (experimental.viewTransition) and skips it for reduced motion and browser swipe gestures;
// this plugin only supplies the animation. The static CSS (`.page-scan`, root pseudo defaults) is in main.css.
const DURATION = 700
const EASING = 'cubic-bezier(0.76, 0, 0.24, 1)'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  // vue-router keeps a `position` counter in history.state. When the transition starts, the browser has already updated
  // history.state for Back / Forward (a popstate), but not yet for a normal link click (router.push updates it afterwards).
  // So a smaller counter than the last settled page means Back. (A popstate listener is too late: vue-router's own listener
  // runs first and, with the route already loaded, reaches this hook within the same event.)
  let position: number = history.state?.position ?? 0
  router.afterEach(() => {
    position = history.state?.position ?? position
  })

  nuxtApp.hook('page:view-transition:start', (transition) => {
    const root = document.documentElement
    const current = history.state?.position
    const reverse = typeof current === 'number' && current < position
    root.classList.add('vt-scan')
    // Animations aimed at `::view-transition-*` pseudos are tied to the document, not to one transition: any that is
    // left behind (finished, fill forwards) would be applied to the NEXT transition's pseudos. So cancel them all at the end.
    const running: Animation[] = []
    transition.finished.catch(() => {}).finally(() => {
      running.forEach(a => a.cancel())
      root.classList.remove('vt-scan')
    })

    transition.ready.then(() => {
      const timing = { duration: DURATION, easing: EASING }
      const play = (keyframes: PropertyIndexedKeyframes, options: KeyframeAnimationOptions) => {
        running.push(root.animate(keyframes, options))
      }
      const travel = innerHeight - 2

      // New page: uncovered from the leading edge of the line.
      play(
        { clipPath: [reverse ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)', 'inset(0 0 0 0)'] },
        { ...timing, pseudoElement: '::view-transition-new(root)' },
      )
      // Old page: drifts away and dims, giving the sweep some depth.
      play(
        { transform: ['translateY(0) scale(1)', `translateY(${reverse ? 4 : -4}vh) scale(0.985)`], filter: ['brightness(1)', 'brightness(0.45)'] },
        { ...timing, pseudoElement: '::view-transition-old(root)' },
      )
      // The line itself rides the reveal edge (same easing), and fades out over the last stretch.
      const line = { pseudoElement: '::view-transition-group(page-scan)' }
      play(
        { transform: reverse ? ['translateY(0)', `translateY(${travel}px)`] : [`translateY(${travel}px)`, 'translateY(0)'] },
        { ...timing, ...line },
      )
      play({ opacity: [1, 1, 0], offset: [0, 0.82, 1] }, { ...timing, easing: 'linear', ...line })
    }).catch(() => { /* transition skipped */ })
  })
})

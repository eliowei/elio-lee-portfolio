// Light / dark theme. The real work happens before first paint: an inline script (nuxt.config.ts → app.head.script) sets
// `data-theme` on <html> from the saved choice, else from the OS preference. This composable only mirrors that into state
// for the toggle and saves the visitor's explicit choice. Until they choose, the theme keeps following the OS setting.
export const THEME_KEY = 'theme'
export type Theme = 'light' | 'dark'

// Reveal circle: slow in, quick through the middle, soft landing.
const REVEAL_MS = 950
const REVEAL_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'light')

  function apply(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
  }

  /**
   * Switch theme. With a pointer/keyboard origin (the toggle button) and View Transitions support, the new theme is revealed
   * by a circle growing from that point to cover the screen. Reduced motion or no support: switches instantly.
   */
  async function toggle(origin?: { x: number; y: number }) {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(THEME_KEY, next) }
    catch { /* storage blocked: the choice lasts until reload */ }

    const root = document.documentElement
    const canAnimate = origin && 'startViewTransition' in document && !matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canAnimate) return apply(next)

    root.classList.add('theme-vt') // main.css turns off the default cross-fade for this transition
    let ring: HTMLElement | undefined
    const transition = document.startViewTransition(async () => {
      apply(next)
      // The ring lives in the NEW page, so it is part of the snapshot that the circle reveals (see `.theme-ring` in main.css).
      ring = document.createElement('div')
      ring.className = 'theme-ring'
      ring.setAttribute('aria-hidden', 'true')
      ring.style.setProperty('--theme-x', `${origin.x}px`)
      ring.style.setProperty('--theme-y', `${origin.y}px`)
      document.body.append(ring)
      await nextTick()
    })
    try {
      await transition.ready
      // Reach the farthest corner so the circle always covers the whole screen.
      const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y))
      const timing = { duration: REVEAL_MS, easing: REVEAL_EASE }
      root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
        { ...timing, pseudoElement: '::view-transition-new(root)' },
      )
      // Same radius, duration and easing as the circle, so the ring stays on its edge; it fades out just before the end.
      ring?.animate({ '--theme-r': ['0px', `${radius}px`] }, { ...timing, fill: 'forwards' })
      ring?.animate({ opacity: [1, 1, 0], offset: [0, 0.8, 1] }, { duration: REVEAL_MS, easing: 'linear', fill: 'forwards' })
      await transition.finished
    }
    catch { /* transition skipped (e.g. tab hidden): the theme is already applied */ }
    finally {
      ring?.remove()
      root.classList.remove('theme-vt')
    }
  }

  /** Client only: read what the inline script decided, and follow OS changes while there is no saved choice. */
  function init() {
    theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', (e) => {
      let saved: string | null = null
      try { saved = localStorage.getItem(THEME_KEY) }
      catch { /* ignore */ }
      if (saved !== 'light' && saved !== 'dark') apply(e.matches ? 'dark' : 'light')
    })
  }

  return { theme, toggle, init }
}

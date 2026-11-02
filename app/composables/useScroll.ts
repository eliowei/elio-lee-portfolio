// Shared scroll state. Call `useScrollTracker()` once (layout); read with `useScroll()` anywhere.
export const useScroll = () => ({
  y: useState('scroll-y', () => 0),
  direction: useState<'up' | 'down'>('scroll-dir', () => 'up'),
  progress: useState('scroll-progress', () => 0),
})

export function useScrollTracker() {
  const { y, direction, progress } = useScroll()
  let last = 0

  const update = () => {
    const cur = window.scrollY
    if (Math.abs(cur - last) > 4) {
      direction.value = cur > last ? 'down' : 'up'
      last = cur
    }
    y.value = cur
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(100, Math.round((cur / max) * 100)) : 0
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  })
}

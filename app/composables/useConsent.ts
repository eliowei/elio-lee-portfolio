export type ConsentChoice = 'granted' | 'denied'

const KEY = 'cookie-consent'

/**
 * Cookie / analytics consent. The choice lives in localStorage (per browser). `choice === null` means "not asked yet",
 * which is when the banner shows; `reopen()` shows it again from the footer.
 */
export function useConsent() {
  const nuxtApp = useNuxtApp()
  const choice = useState<ConsentChoice | null>('consent-choice', () => null)
  const ready = useState('consent-ready', () => false) // false until localStorage was read on the client
  const asking = useState('consent-asking', () => false) // true while the visitor reopened the banner

  /** Called once by the analytics plugin after mount. */
  function restore() {
    let saved: string | null = null
    try { saved = localStorage.getItem(KEY) }
    catch { /* storage blocked: treat as not asked yet, and ask every visit */ }
    choice.value = saved === 'granted' || saved === 'denied' ? saved : null
    ready.value = true
    if (choice.value === 'granted') nuxtApp.$analytics.load()
  }

  function decide(next: ConsentChoice) {
    try { localStorage.setItem(KEY, next) }
    catch { /* the choice still applies for this visit */ }
    choice.value = next
    asking.value = false
    if (next === 'granted') nuxtApp.$analytics.load()
    else nuxtApp.$analytics.stop()
  }

  const visible = computed(() => ready.value && (choice.value === null || asking.value))
  const reopen = () => { asking.value = true }

  return { choice, visible, restore, decide, reopen }
}

// GA4 custom events, sent with gtag. Nothing is sent unless the visitor agreed to analytics (see useConsent).
// Never put personal data in params: no name, email or message text.
export type AnalyticsEvent
  = | 'project_view' | 'project_demo_click' | 'project_github_click'
    | 'note_click' | 'note_read' | 'note_search'
    | 'contact_click' | 'contact_form_open' | 'contact_submit' | 'contact_submit_error'
    | 'social_click' | 'language_change'

type Gtag = (...args: unknown[]) => void

export function useAnalytics() {
  const { locale } = useI18n()

  function track(event: AnalyticsEvent, params: Record<string, string | number> = {}) {
    if (!import.meta.client) return
    // Read the saved choice directly, so an event fired on page load never races the banner's own restore().
    let granted = false
    try { granted = localStorage.getItem(CONSENT_KEY) === 'granted' }
    catch { /* storage blocked: no consent, no events */ }
    if (!granted) return
    ;(window as unknown as { gtag?: Gtag }).gtag?.('event', event, { locale: locale.value, ...params })
  }

  /** `/en/blog/js-event-loop` → `js-event-loop` */
  const slugOf = (path: string) => path.split('/').filter(Boolean).pop() ?? path

  return { track, slugOf }
}

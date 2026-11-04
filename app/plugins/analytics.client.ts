// GTM, loaded only after the visitor agrees (see useConsent). The script uses `trigger: 'manual'`, so nothing is
// requested until `load()` runs. `$analytics.stop()` is for a visitor who withdraws consent later.
//
// GA4 is NOT loaded from here: the GTM container (GTM-KT7VR4Q3) now holds the Google tag for G-6P4Z8FF93C, and loading
// gtag.js as well would count every visit twice. Custom events are dataLayer pushes (see useAnalytics) that GTM
// forwards to GA4.
export default defineNuxtPlugin(() => {
  const { gtmId, ga4Id } = useRuntimeConfig().public
  const scriptOptions = { trigger: 'manual' as const }
  const gtm = useScriptGoogleTagManager({ id: gtmId, scriptOptions })

  const win = window as unknown as Record<string, unknown>
  let loaded = false

  function load() {
    win[`ga-disable-${ga4Id}`] = false
    if (loaded) return
    loaded = true
    gtm.load()
  }

  // GA's documented opt-out switch (it also covers the Google tag GTM loads), plus clearing the _ga cookies it already set (host and parent-domain variants).
  function stop() {
    win[`ga-disable-${ga4Id}`] = true
    const hosts = location.hostname.split('.').map((_, i, a) => a.slice(i).join('.'))
    for (const name of document.cookie.split(';').map(c => c.split('=')[0]!.trim()).filter(n => n.startsWith('_ga'))) {
      for (const domain of [undefined, ...hosts, ...hosts.map(h => `.${h}`)]) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`
      }
    }
  }

  return { provide: { analytics: { load, stop } } }
})

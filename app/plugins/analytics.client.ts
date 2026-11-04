// GTM + GA4, loaded only after the visitor agrees (see useConsent). Both scripts use `trigger: 'manual'`, so nothing
// is requested until `load()` runs. `$analytics.stop()` is for a visitor who withdraws consent later.
//
// The GTM container (GTM-KT7VR4Q3) currently holds no GA4 tag, so GA4 is sent straight from here via gtag.js.
// If a GA4 tag is ever added inside GTM, remove the GA4 half below, or every visit is counted twice.
export default defineNuxtPlugin(() => {
  const { gtmId, ga4Id } = useRuntimeConfig().public
  const scriptOptions = { trigger: 'manual' as const }
  const gtm = useScriptGoogleTagManager({ id: gtmId, scriptOptions })
  const ga = useScriptGoogleAnalytics({ id: ga4Id, scriptOptions })

  const win = window as unknown as Record<string, unknown>
  let loaded = false

  function load() {
    win[`ga-disable-${ga4Id}`] = false
    if (loaded) return
    loaded = true
    gtm.load()
    ga.load()
  }

  // GA's documented opt-out switch, plus clearing the _ga cookies it already set (host and parent-domain variants).
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

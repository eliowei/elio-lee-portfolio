---
title: 'Adding GTM and GA4 to a Nuxt Site: From Loading the Script to Custom Events'
description: How I added Google Tag Manager and GA4 to my personal brand site, including deferred loading, cookie consent, and tracking project and contact interactions with the dataLayer.
date: 2026-07-30
category: case
tags: [GTM, GA4, Nuxt]
readingTime: 6
---

While building my personal brand site, I wanted to know which projects visitors looked at and whether they clicked to get in touch, so I added Google Tag Manager (GTM) and Google Analytics 4 (GA4). At first I couldn't tell the two tools apart; only after doing it did it become clear.

## How GTM and GA4 differ

| Tool | What it does |
|---|---|
| GA4 | Collects and analyses data, such as page views and events |
| GTM | Manages the tracking code on the site and decides when it fires |

Put simply, GA4 is where you read reports and GTM is where the code lives. Once the site loads GTM, most new or changed tracking can be done in the GTM dashboard without changing the code each time.

The site and GTM communicate through the `dataLayer`: the site pushes events into it, and GTM sends them to GA4 according to its configuration.

## Trying the Nuxt module first, then loading it myself

I first found that Nuxt has an official module, `@nuxt/scripts`, for managing third-party scripts, so I used it to connect GA4:

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  useScriptGoogleAnalytics({ id: 'G-XXXXXXXXXX' })
})
```

Later, to manage tracking with GTM, I switched to `useScriptGoogleTagManager`, moved the settings to `nuxt.config.ts`, and pushed events through the module's `proxy.dataLayer`:

```ts
const { proxy } = useScriptGoogleTagManager()
proxy.dataLayer?.push({ event, ...params })
```

But after launch, no data came through. The custom events couldn't wait, so I removed the module configuration and loaded GTM's JS directly instead, pushing events straight into `window.dataLayer`, and the data started coming in.

Reading the docs afterwards, I found that `@nuxt/scripts` v1 changed its behaviour: if a registry entry has no `trigger` configured, the script isn't inserted automatically, and my configuration at the time had none.

The upside of this approach is that the whole flow is visible, and controlling when it loads is easier later; the cost is having to handle duplicate loading and server-side rendering myself.

## Loading GTM without slowing the first paint

The GTM script doesn't affect the site's functionality, so I load it only when the browser is idle:

```ts
onMounted(() => {
  const run = () => initializeAnalytics()

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 3000 })
  } else {
    setTimeout(run, 1000)
  }
})
```

`requestIdleCallback` waits until the main thread is free, and `timeout` makes sure it doesn't wait forever. Browsers that don't support it wait one second instead.

The actual loading creates the `dataLayer` and inserts the script dynamically. Nuxt renders on the server, and `window` and `document` only exist in the browser, so check the environment first:

```ts
const loadGTM = () => {
  if (!import.meta.client || document.getElementById('gtm-script')) return

  const { public: { gtmId } } = useRuntimeConfig()

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  document.head.appendChild(script)
}
```

Checking for a fixed `id` prevents loading it twice.

## Cookie consent: remember the choice

You may need consent before tracking visitor behaviour, so I built a cookie banner and a `useConsent` composable that stores the visitor's choice in `localStorage` and only loads GTM after they agree:

```ts
const accept = () => {
  localStorage.setItem('cookie-consent', JSON.stringify({ analytics: true }))
  loadGTM()
}

const reject = () => {
  localStorage.setItem('cookie-consent', JSON.stringify({ analytics: false }))
}
```

I also added a switch for whether to enable the banner at all, so it can be changed later without touching the flow.

## Custom events: keep tracking in one place

Page views can't answer "what are visitors interested in", so I defined custom events and kept the push logic in one place, `useAnalytics`:

```ts
export const useAnalytics = () => {
  const push = (event: string, params: Record<string, unknown> = {}) => {
    if (!import.meta.client) return
    window.dataLayer?.push({ event, ...params })
  }

  const trackProjectView = (project: { id: string; title: string }) =>
    push('project_view', { project_id: project.id, project_name: project.title })

  return { trackProjectView }
}
```

Components just call `trackProjectView(project)` without knowing the `dataLayer` format. Event names live in one place too, so the same thing never ends up with two names.

The main events I track:

| Event | What I want to know |
|---|---|
| `project_view` | Which project the visitor looked at |
| `project_demo_click` | Who clicked the live demo |
| `project_github_click` | Who clicked GitHub |
| `contact_click` | Where they clicked contact from, such as the nav bar or footer |
| `contact_submit` | Who submitted the contact form |
| `social_click` | Which social link was clicked |

After an event is pushed into the `dataLayer`, you still have to create matching triggers and GA4 event tags in the GTM dashboard before the data reaches GA4. Writing the frontend alone isn't enough.

## What I learned

- First decide which questions you want answered, then decide what to track; more events isn't better.
- Third-party scripts are part of performance too; defer them when you can.
- Wrapping tracking logic in a composable keeps components much cleaner, and renaming or adjusting later only touches one place.

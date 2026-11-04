---
title: 'Adding GTM and GA4 to a Nuxt Site: From Loading the Script to Custom Events'
description: How I added Google Tag Manager and GA4 to my personal brand site, including loading only after cookie consent, avoiding double-counted GA4 hits, and tracking project and contact interactions with the dataLayer.
date: 2026-07-30
updated: 2026-11-04
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

## Loading through a Nuxt module, but deciding the timing myself

Nuxt has an official module, `@nuxt/scripts`, for managing third-party scripts, so I first used it to connect GA4 directly:

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  useScriptGoogleAnalytics({ id: 'G-XXXXXXXXXX' })
})
```

Later, to manage tracking with GTM, I switched to `useScriptGoogleTagManager` and pushed events through the module's `proxy.dataLayer`.

But after launch, no data came through. The custom events couldn't wait, so I dropped the module, created the `dataLayer` myself and inserted GTM's script dynamically, and the data started coming in.

Reading the docs afterwards, I found the module wasn't the problem: `@nuxt/scripts` v1 changed its behaviour so that, without a `trigger`, the script isn't inserted automatically, and I hadn't set one.

Once I knew that, I switched back to the module and set `trigger: 'manual'` explicitly, so I decide when it loads:

```ts
const gtm = useScriptGoogleTagManager({
  id: gtmId,
  scriptOptions: { trigger: 'manual' },
})

// call this only after the visitor agrees
gtm.load()
```

`manual` means nothing is requested until I call `load()`. That fits the next section exactly, and I don't have to handle duplicate loading and server-side rendering myself.

## Let GTM load GA4, not the site too

The GTM container already holds the Google tag for GA4. If the site also loaded gtag.js itself, every visit would be counted twice. So I removed GA4 loading from the code: the site only loads GTM, and GA4 is managed entirely in the GTM dashboard.

This was the easiest thing to overlook in the whole process: both sides can load GA4, but only one of them should.

## Cookie consent: no consent, no loading, no events

You may need consent before tracking visitor behaviour, so I built a cookie banner and a `useConsent` composable that stores the choice in `localStorage`:

```ts
const decide = (next: 'granted' | 'denied') => {
  localStorage.setItem('cookie-consent', next)
  if (next === 'granted') nuxtApp.$analytics.load()
  else nuxtApp.$analytics.stop()
}
```

- If the visitor agrees, `load()` loads GTM. On later visits the saved choice is read on page load, and `granted` loads it automatically.
- If the visitor declines or withdraws, `stop()` sets GA's official opt-out switch, `ga-disable-<GA4 ID>`, and clears the `_ga` cookies already written.
- If they change their mind, a "Cookie settings" link in the footer reopens the banner at any time.

## Custom events: keep tracking in one place

Page views can't answer "what are visitors interested in", so I defined custom events and kept the push logic in one place, `useAnalytics`:

```ts
function track(event: AnalyticsEvent, params: Record<string, string | number> = {}) {
  if (!import.meta.client) return
  // no consent, no events
  if (localStorage.getItem(CONSENT_KEY) !== 'granted') return
  window.dataLayer ||= []
  window.dataLayer.push({ event, locale: locale.value, ...params })
}
```

Components just call `track('project_view', { project_slug })` without knowing the `dataLayer` format. Two details:

- `AnalyticsEvent` is a type listing every valid event name, so a typo is flagged by the editor and the same thing never ends up with two names.
- Every event automatically carries the current `locale`, so GA4 can be broken down by language later. Event parameters never include names, emails or message text.

The main events I track:

| Event | What I want to know |
|---|---|
| `project_view` | Which project the visitor looked at |
| `project_demo_click` | Who clicked the live demo |
| `project_github_click` | Who clicked a project's GitHub link |
| `note_click` | Which note was clicked from the home page or the list |
| `note_read` | Which note was read to 75% (only a real scroll counts) |
| `note_search` | What visitors searched for |
| `contact_click` | Where they clicked contact from, such as the nav bar or footer |
| `contact_form_open` | Someone opened the contact form |
| `contact_submit` / `contact_submit_error` | The form was submitted successfully or failed |
| `social_click` | Which social link was clicked |
| `language_change` | Which language they switched from and to |

After an event is pushed into the `dataLayer`, you still have to create a matching "Custom Event" trigger and GA4 event tag in the GTM dashboard before the data reaches GA4. Writing the frontend alone isn't enough.

Note that GTM's "Custom Event" trigger matches on the `event` name in the `dataLayer`, so events must be sent with `dataLayer.push`; a `gtag('event', ...)` call would not match it.

## What I learned

- First decide which questions you want answered, then decide what to track; more events isn't better.
- When data doesn't arrive, check the tool's version changes first. I briefly thought the module was unusable, but I was only missing one setting.
- Only one side should load GA4; if both GTM and the site do, hits are counted twice.
- Consent has to govern two things: loading the script and sending events. Withdrawing should also clear the cookies already written.
- Wrapping tracking logic in a composable keeps components much cleaner, and renaming or adjusting later only touches one place.

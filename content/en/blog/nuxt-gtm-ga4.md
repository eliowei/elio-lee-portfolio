---
title: 'Adding GTM and GA4 to a Nuxt Site: From Loading the Script to Custom Events'
description: How I added Google Tag Manager and GA4 to my personal brand site, including loading only after cookie consent, avoiding double-counted GA4 hits, and tracking project and contact interactions with the dataLayer.
date: 2026-07-30
updated: 2026-11-04
category: case
tags: [GTM, GA4, Nuxt]
readingTime: 8
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

## Setting up GTM and GA4

The frontend only pushes events into the `dataLayer`; the dashboards still need setting up before the data reaches GA4. I handle every event with one trigger and one event tag, so adding an event later doesn't need a new tag.

**1. Create Data Layer Variables**

In GTM, add "Data Layer Variable" entries whose names match the parameter names the code sends exactly, such as `project_slug`, `note_slug`, `source` and `locale`. When an event doesn't send a parameter, the variable is empty and GA4 simply skips it, with no error.

**2. Create one trigger**

Choose the "Custom Event" type, match all the events at once with a regular expression, and tick "Use regex matching":

```
^(project_view|project_demo_click|project_github_click|note_click|note_read|note_search|contact_click|contact_form_open|contact_submit|contact_submit_error|social_click|language_change)$
```

GTM's "Custom Event" matches on the `event` name in the `dataLayer`, so events must be sent with `dataLayer.push`; a `gtag('event', ...)` call would not match it.

**3. Create one GA4 event tag**

Set the event name to the built-in `{{Event}}` variable, which brings in the `dataLayer` event name (enable the Event built-in variable first). Then add the variables from step 1 as event parameters and pick the trigger from step 2. To add an event later, just add its name to the regex.

GA4 itself is loaded by the Google tag inside GTM; the site no longer loads its own copy, for the reason given earlier.

**4. Register custom dimensions in GA4**

GA4 doesn't put custom parameters into reports automatically. Under "Admin → Custom definitions", create event-scoped custom dimensions such as `project_slug`, `note_slug` and `source`. Without them the data arrives, but reports can't show which project or which note. I also marked `contact_submit` as a key event, since it's the behaviour I most want to know about.

**5. Preview, then publish**

Open the site in GTM's preview mode and confirm in GA4's DebugView. The site only loads GTM after consent, so accept the cookie banner first when testing, or no events will appear. Once the parameters come through correctly, submit and publish; until you publish, the live site is unaffected.

Common problems: an event fires but its parameters are empty, usually a misspelt or wrongly capitalised variable name; no events at all, so check that you accepted cookies and that the container is published.

## What I learned

- First decide which questions you want answered, then decide what to track; more events isn't better.
- When data doesn't arrive, check the tool's version changes first. I briefly thought the module was unusable, but I was only missing one setting.
- Only one side should load GA4; if both GTM and the site do, hits are counted twice.
- For data to reach GA4, all three stages must work: the code pushing to the `dataLayer`, GTM's trigger and tag, and GA4's custom dimensions. The frontend alone isn't enough.
- Consent has to govern two things: loading the script and sending events. Withdrawing should also clear the cookies already written.
- Wrapping tracking logic in a composable keeps components much cleaner, and renaming or adjusting later only touches one place.

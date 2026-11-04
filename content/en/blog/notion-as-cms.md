---
title: 'Using the Notion API as a CMS: Building My Tokyo Trip Website'
description: For my September trip to Tokyo, I built a travel itinerary site with Nuxt 4, used Notion as the content back end, and isolated Notion's data structure behind server routes, transformers and caching.
date: 2026-09-11
category: case
tags: [Notion API, CMS, Nuxt]
readingTime: 10
---

For my September trip to Tokyo, I built a travel itinerary website with Nuxt 4 that I could check on my phone while out and about. The itinerary, packing list, shopping list and tickets kept changing, so instead of building a separate admin, I used Notion as the CMS: all content is edited in Notion, and the site only reads and displays it.

## Why Notion

An itinerary naturally fits a table: date, order, area and mode of transport are all fields. Notion databases can be used directly as an admin, and can be edited on a phone too, so I didn't have to build login, forms or a database myself.

The overall flow:

```text
Notion database → Nuxt server route → transformer → frontend page
```

## The API key stays on the server

The Notion API needs a key, so it can't be called directly from the browser. I put the key in the private part of `runtimeConfig` and created a shared client on the server:

```ts
// server/utils/notion.ts
import { Client } from '@notionhq/client'

const config = useRuntimeConfig()

export const notion = new Client({
  auth: config.notionApiKey,
})
```

The frontend only calls its own `/api/notion/*` routes; it never sees the key or talks to Notion directly.

## Isolating Notion's data structure with transformers

Notion's responses are deeply nested; reading a title means writing `page.properties[key].title[0].plain_text`. If the frontend used that directly, Notion's structure would be scattered across every component.

So I first wrote a set of getter functions that handle empty values:

```ts
export function getTitle(page: any, key: string) {
  return page.properties[key]?.title?.[0]?.plain_text ?? ''
}

export function getMultiSelect(page: any, key: string) {
  return page.properties[key]?.multi_select?.map((item: any) => item.name) ?? []
}
```

Then a transformer converts a Notion page into the site's own type:

```ts
export function transformItinerary(page: any): Itinerary {
  return {
    id: page.id,
    title: getTitle(page, 'Trip Name'),
    date: getDate(page, 'Date'),
    day: getSelect(page, 'Day'),
    order: getNumber(page, 'Order'),
    category: getMultiSelect(page, 'Category'),
    // ...
  }
}
```

Now the frontend only knows about `Itinerary`. When a Notion field is renamed, only the transformer has to change.

## Caching: don't hit Notion on every request

The Notion API isn't especially fast and has rate limits, and the itinerary doesn't change every second. So I wrapped the route in Nitro's `defineCachedEventHandler` with a 60-second cache:

```ts
export default defineCachedEventHandler(async () => {
  const response = await notion.dataSources.query({
    data_source_id: config.notionDataSourceId,
  })

  return response.results
    .map(transformItinerary)
    .sort((a, b) => a.date !== b.date
      ? a.date.localeCompare(b.date)
      : a.order - b.order)
}, { maxAge: 60 })
```

The trade-off is that after editing content in Notion, it can take up to a minute to show up. For an itinerary site, that is perfectly acceptable.

## A pitfall: slugs aren't necessarily unique

The itinerary detail page originally queried by slug only, until I noticed that staying at the same hotel twice produced two entries with the same slug. Notion doesn't enforce unique values on fields, so I also distinguish entries by day:

```ts
const trip = (day ? matches.find(item => item.day === `Day ${day}`) : null)
  ?? matches[0]
```

Once the route takes a query parameter, the cache key has to change too, or different days would get the same cached result:

```ts
{ maxAge: 60, getKey: event => `${getRouterParam(event, 'slug') ?? ''}:${getQuery(event).day ?? ''}` }
```

This is something to keep in mind when using Notion as a CMS: it is an editing tool, not a database, and the code itself has to guard data correctness.

## Keeping content easy to edit

Transport directions are a multi-step description, and splitting them into many fields would make editing a pain. So I keep them as plain text in Notion, using `#` for headings and `⏱` for times, and wrote a parser that turns them into structured data for the frontend.

Tickets live on an ordinary Notion page, and their titles, images and files are read with `blocks.children.list`. That part is more sensitive, so it has an extra password check before it can be read.

## Separating content from user state

The packing list items come from Notion, but "checked" is each user's own state and shouldn't be written back to Notion. So check states and user-added items are stored in `localStorage` and merged at display time:

```ts
const items = computed(() =>
  [...(data.value ?? []), ...customItems.value].map(item => ({
    ...item,
    checked: checkedMap.value[item.id] ?? false,
  })),
)
```

## Integrating Google Maps

Each itinerary entry has a Google Maps link maintained in Notion, which opens the map with one tap on the detail page.

The Disneyland plan uses the Google Maps JavaScript API to mark each attraction on the map and connect them with a line, showing the day's route. Clicking a marker focuses the matching item:

```ts
markers = props.items.map((item, index) => {
  const marker = new g.maps.Marker({ /* position and label */ })
  marker.addListener('click', () => focusItem(index))
  return marker
})
```

The Maps script isn't small and isn't needed on every page, so it is only loaded when needed. I keep the loading Promise so that even if several places call it at once, it only loads once:

```ts
let loaderPromise: Promise<void> | null = null

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Maps 載入失敗'))
    document.head.appendChild(script)
  })

  return loaderPromise
}
```

## Not everything belongs in Notion: Disney restaurant data

While planning Tokyo Disney, I wanted to see each restaurant's menu directly, but the official site has no Traditional Chinese, and looking them up one by one takes a long time. This kind of data is large and almost never changes, so it isn't suited to maintaining by hand in Notion; I scraped it instead.

I wrote a script that runs in the browser and reads the official restaurant pages one by one, collecting 154 restaurants, 122 of them with menus, for 1,842 items in total, then translated them into Traditional Chinese with GPT. This data is for personal travel use only; it sits behind the password check and isn't public.

Each restaurant is stored as a JSON file keeping both the original text and the Traditional Chinese, along with the source URL and the date it was retrieved, so there is a basis for checking or updating it later:

```json
{
  "source": {
    "official_url": "...",
    "retrieved_date": "2026-09-10",
    "language_original": "en"
  },
  "restaurant": {
    "name": {
      "original": "La Taverne de Gaston",
      "zh_tw": "加斯頓餐館"
    }
  }
}
```

### Works locally, files missing on Vercel

At first the API read these JSON files with `node:fs`'s `readdirSync` and `readFileSync` together with `process.cwd()`. It worked perfectly locally, but after deploying to Vercel the files couldn't be found.

The reason is that Vercel's serverless function bundler can't statically trace file reads whose paths are only decided at runtime, so these files were never included in the deployment at all.

The fix was to use Nitro's `serverAssets` to embed the JSON in the server build, and read it with `useStorage()`:

```ts
// nuxt.config.ts
nitro: {
  serverAssets: [{ baseName: 'tdr-menu', dir: 'data/tdr-menu' }],
}

// API route
const storage = useStorage('assets:tdr-menu')
const keys = await storage.getKeys(park)
```

There is one more small trap here: `dir` must be `data/tdr-menu`, relative to `server/`. Write `server/data/tdr-menu` and the path stacks up to `server/server/data/tdr-menu`, which can't be found either.

## Also integrating GPT and Gemini

On a trip, questions often come up on the spot, so the site also has an AI chat, again called through server routes so the keys never appear on the frontend. You can choose GPT or Gemini, and upload images with your question.

When Gemini returns 429 (too many requests), it automatically falls back to OpenAI, so the user doesn't have to switch:

```ts
try {
  return { message: await askGemini({ history, images }) }
} catch (error: any) {
  if (error.status === 429) {
    return { provider: 'openai', message: await askOpenAI({ history, images }) }
  }
  throw error
}
```

## Current limitations

- Queries don't handle pagination. Notion returns at most 100 entries per query; beyond that, you have to keep reading with `next_cursor`.
- Notion fields are read by name; if someone renames a field in the dashboard, the data silently becomes empty without any error.

## What I learned

- Not every project needs its own admin; first work out who maintains the content and how often it changes.
- Convert third-party data into your own types at the boundary; don't let external structures leak into components.
- The cache key has to include every parameter that affects the result.

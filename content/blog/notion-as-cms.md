---
title: 用 Notion API 當 CMS：東京自由行旅遊網站的實作紀錄
description: 為了 9 月的東京自由行，用 Nuxt 4 做了一個旅遊行程網站，把 Notion 當成內容後台，並用伺服器路由、transformer 與快取隔開 Notion 的資料結構。
date: 2026-09-11
category: case
tags: [Notion API, CMS, Nuxt]
readingTime: 10
---

為了 9 月去日本東京自由行，我用 Nuxt 4 做了一個旅遊行程網站，出門時可以直接用手機查看。行程、行李清單、購物清單和票券這些內容會一直調整，所以我不想另外做一套後台，而是把 Notion 當成 CMS：內容都在 Notion 編輯，網站只負責讀取和顯示。

## 為什麼選 Notion

行程內容本來就適合用表格管理，日期、順序、地區、交通方式都是欄位。Notion 的資料庫可以直接當後台使用，在手機上也能編輯，我不用自己做登入、表單和資料庫。

整體流程是這樣：

```text
Notion 資料庫 → Nuxt 伺服器路由 → transformer → 前端頁面
```

## 金鑰只留在伺服器

Notion API 需要金鑰，所以不能從瀏覽器直接呼叫。我把金鑰放在 `runtimeConfig` 的私有區塊，在伺服器建立共用的 client：

```ts
// server/utils/notion.ts
import { Client } from '@notionhq/client'

const config = useRuntimeConfig()

export const notion = new Client({
  auth: config.notionApiKey,
})
```

前端只呼叫自己的 `/api/notion/*` 路由，看不到金鑰，也不會直接接觸 Notion。

## 用 transformer 隔開 Notion 的資料結構

Notion 回傳的資料巢狀很深，例如讀一個標題要寫到 `page.properties[key].title[0].plain_text`。如果前端直接用，Notion 的結構就會散落在每個元件裡。

所以我先寫一組取值函式，處理空值：

```ts
export function getTitle(page: any, key: string) {
  return page.properties[key]?.title?.[0]?.plain_text ?? ''
}

export function getMultiSelect(page: any, key: string) {
  return page.properties[key]?.multi_select?.map((item: any) => item.name) ?? []
}
```

再用 transformer 把 Notion 的頁面轉成網站自己的型別：

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

這樣前端只認識 `Itinerary`。Notion 的欄位改名時，只要改 transformer 這一個地方。

## 快取：不要每次請求都打 Notion

Notion API 的回應不算快，也有請求速率限制，而行程內容不會每秒變動。所以我用 Nitro 的 `defineCachedEventHandler` 包住路由，快取 60 秒：

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

代價是在 Notion 改完內容後，最多要等一分鐘才會更新。對行程網站來說完全可以接受。

## 踩到的坑：slug 不一定唯一

行程詳情頁一開始只用 slug 查詢，後來發現同一間飯店住兩次，就會有兩筆相同的 slug。Notion 不會幫欄位檢查唯一值，所以我再用第幾天來區分：

```ts
const trip = (day ? matches.find(item => item.day === `Day ${day}`) : null)
  ?? matches[0]
```

路由帶了查詢參數之後，快取的 key 也要跟著改，否則不同天會拿到同一份快取：

```ts
{ maxAge: 60, getKey: event => `${getRouterParam(event, 'slug') ?? ''}:${getQuery(event).day ?? ''}` }
```

這也是用 Notion 當 CMS 要注意的事：它是編輯工具，不是資料庫，資料的正確性要由程式自己把關。

## 讓內容維持好編輯

交通方式是一段多步驟的說明，如果拆成很多欄位，編輯起來很麻煩。所以我讓它在 Notion 裡維持一段純文字，用 `#` 當標題、`⏱` 當時間，再寫一個 parser 轉成結構化資料給前端顯示。

票券則是放在一般的 Notion 頁面，由 `blocks.children.list` 讀取標題、圖片和檔案。這部分比較敏感，所以另外加了密碼驗證，通過後才能讀取。

## 內容和使用者狀態分開

行李清單的項目來自 Notion，但「打勾」是每個使用者自己的狀態，不該寫回 Notion。所以打勾狀態和自己新增的項目都存在 `localStorage`，顯示時再合併：

```ts
const items = computed(() =>
  [...(data.value ?? []), ...customItems.value].map(item => ({
    ...item,
    checked: checkedMap.value[item.id] ?? false,
  })),
)
```

## 串接 Google Maps

每個行程都有 Notion 裡維護的 Google Maps 連結，在詳情頁點一下就能開啟地圖。

迪士尼樂園的規劃則用 Google Maps JavaScript API，在地圖上標出每個項目，再用線連起來，看得出當天的動線。點擊標記可以聚焦到對應的項目：

```ts
markers = props.items.map((item, index) => {
  const marker = new g.maps.Marker({ /* 位置與標籤 */ })
  marker.addListener('click', () => focusItem(index))
  return marker
})
```

地圖腳本不小，也不是每頁都需要，所以只在要用時才載入。我把載入的 Promise 存起來，多個地方同時呼叫也只會載入一次：

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

## 不是所有資料都放 Notion：迪士尼餐廳資料

規劃東京迪士尼時，我想直接看到各餐廳的菜單，但官網沒有繁體中文，一間一間查也很花時間。這類資料量大、又幾乎不會改，不適合在 Notion 手動維護，所以我用爬蟲把資料整理下來。

我寫了在瀏覽器裡執行的腳本，逐間讀取官網的餐廳頁面，總共整理出 154 間餐廳，其中 122 間有菜單，合計 1,842 個品項，再用 GPT 翻譯成繁體中文。這批資料只供個人旅遊使用，放在密碼驗證之後，沒有公開。

每間餐廳存成一個 JSON 檔，並保留原文和繁體中文，也記下來源網址和取得日期，之後要核對或更新才有依據：

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

### 本機正常，部署到 Vercel 卻找不到檔案

一開始 API 用 `node:fs` 的 `readdirSync` 和 `readFileSync` 搭配 `process.cwd()` 讀取這些 JSON，本機完全正常，部署到 Vercel 後卻找不到檔案。

原因是這種在執行時才動態決定路徑的讀檔方式，Vercel 的 serverless function 打包器無法靜態追蹤，這批檔案根本沒有被包進部署結果裡。

解法是改用 Nitro 的 `serverAssets`，把 JSON 內嵌進 server build，再用 `useStorage()` 讀取：

```ts
// nuxt.config.ts
nitro: {
  serverAssets: [{ baseName: 'tdr-menu', dir: 'data/tdr-menu' }],
}

// API 路由
const storage = useStorage('assets:tdr-menu')
const keys = await storage.getKeys(park)
```

這裡還有一個小坑：`dir` 要寫相對於 `server/` 的 `data/tdr-menu`。如果寫成 `server/data/tdr-menu`，路徑會疊成 `server/server/data/tdr-menu`，一樣找不到。

## 另外串接 GPT 與 Gemini

旅途中常會遇到臨時想問的問題，所以網站裡也做了 AI 聊天，同樣由伺服器路由呼叫，金鑰不會出現在前端。可以選擇 GPT 或 Gemini，也可以上傳圖片一起詢問。

Gemini 遇到 429（請求過多）時，會自動改用 OpenAI 回答，使用者不用自己切換：

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

## 目前的限制

- 查詢沒有處理分頁。Notion 每次查詢最多回傳 100 筆，資料超過之後要用 `next_cursor` 繼續讀取。
- Notion 欄位是用名稱取值，有人在後台改欄位名稱，資料就會變成空值，不會報錯。

## 這次學到的事

- 不是每個專案都需要自己做後台，先想清楚內容由誰維護、多常更新。
- 第三方資料要在邊界轉換成自己的型別，不要讓外部結構滲進元件。
- 快取的 key 要包含所有會影響結果的參數。

---
title: 在 Nuxt 網站導入 GTM 與 GA4：從載入腳本到自訂事件
description: 記錄在個人品牌網站導入 Google Tag Manager 與 GA4 的做法，包含延後載入、Cookie 同意機制，以及用 dataLayer 追蹤專案與聯絡行為。
date: 2026-07-30
category: case
tags: [GTM, GA4, Nuxt]
readingTime: 6
---

做個人品牌網站時，我想知道訪客看了哪些作品、有沒有點聯絡，所以導入了 Google Tag Manager（GTM）和 Google Analytics 4（GA4）。一開始我分不清這兩個工具的差別，實際做過才比較清楚。

## GTM 和 GA4 差在哪

| 工具 | 負責的事 |
|---|---|
| GA4 | 收集並分析數據，例如瀏覽量和事件 |
| GTM | 管理網站上的追蹤代碼，決定什麼時候觸發 |

簡單來說，GA4 是看報表的地方，GTM 是放代碼的地方。網站只要載入 GTM，之後新增或調整追蹤，大多可以在 GTM 後台完成，不用每次都改程式。

網站和 GTM 之間靠 `dataLayer` 溝通：網站把事件推進去，GTM 再依照設定送到 GA4。

## 先試 Nuxt 模組，後來改成自己載入

我一開始查到 Nuxt 有官方模組 `@nuxt/scripts`，可以管理第三方腳本，所以先用它接 GA4：

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  useScriptGoogleAnalytics({ id: 'G-XXXXXXXXXX' })
})
```

之後為了用 GTM 管理追蹤，我換成 `useScriptGoogleTagManager`，再把設定移到 `nuxt.config.ts`，並透過模組提供的 `proxy.dataLayer` 推送事件：

```ts
const { proxy } = useScriptGoogleTagManager()
proxy.dataLayer?.push({ event, ...params })
```

但上線後資料一直讀取不到。自訂事件不能等，我就先拿掉模組的設定，改成直接引用 GTM 的 JS，事件也直接推進 `window.dataLayer`，資料才順利進來。

事後查文件才發現，`@nuxt/scripts` v1 調整了行為：registry 沒有設定 `trigger` 時不會自動插入腳本，而我當時的設定正好沒有寫。

這個做法的好處是流程全部看得見，之後要控制載入時機也比較容易；代價是要自己處理重複載入和伺服器端渲染的問題。

## 載入 GTM：不要拖慢首屏

GTM 的腳本不影響網站功能，所以我把它放到瀏覽器閒置時才載入：

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

`requestIdleCallback` 會等主執行緒有空才執行，`timeout` 則確保不會一直等不到。不支援的瀏覽器就延遲一秒。

實際載入的方式，是建立 `dataLayer` 並動態插入 script。Nuxt 會在伺服器端渲染，`window` 和 `document` 只存在於瀏覽器，所以要先判斷環境：

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

用固定的 `id` 檢查，可以避免重複載入。

## Cookie 同意：把選擇存起來

追蹤訪客行為前，可能需要先取得同意，所以我做了一個 Cookie 橫幅和 `useConsent` composable，把訪客的選擇存在 `localStorage`，同意之後才載入 GTM：

```ts
const accept = () => {
  localStorage.setItem('cookie-consent', JSON.stringify({ analytics: true }))
  loadGTM()
}

const reject = () => {
  localStorage.setItem('cookie-consent', JSON.stringify({ analytics: false }))
}
```

我也加了一個開關，決定要不要啟用橫幅，之後調整時不用改動流程。

## 自訂事件：把追蹤集中在一個地方

頁面瀏覽量回答不了「訪客對什麼有興趣」，所以我另外定義了自訂事件，並把推送邏輯集中在 `useAnalytics`：

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

元件只要呼叫 `trackProjectView(project)`，不需要知道 `dataLayer` 的格式。事件名稱也集中在一起，不會出現同一件事有兩種名字。

我追蹤的事件主要有這些：

| 事件 | 想知道的事 |
|---|---|
| `project_view` | 訪客看了哪個專案 |
| `project_demo_click` | 誰點了線上展示 |
| `project_github_click` | 誰點了 GitHub |
| `contact_click` | 從哪裡點了聯絡，例如導覽列或頁尾 |
| `contact_submit` | 誰送出了聯絡表單 |
| `social_click` | 點了哪個社群連結 |

事件推進 `dataLayer` 之後，還要在 GTM 後台建立對應的觸發條件和 GA4 事件代碼，資料才會進到 GA4。只寫前端是不夠的。

## 這次學到的事

- 先想清楚要回答什麼問題，再決定追蹤什麼，不是事件越多越好。
- 第三方腳本也算效能的一部分，能延後就延後。
- 把追蹤邏輯包成 composable，元件會乾淨很多，之後改名或調整也只要改一個地方。

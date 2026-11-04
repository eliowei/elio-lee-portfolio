---
title: 在 Nuxt 網站導入 GTM 與 GA4：從載入腳本到自訂事件
description: 記錄在個人品牌網站導入 Google Tag Manager 與 GA4 的做法，包含 Cookie 同意後才載入、避免 GA4 重複計算，以及用 dataLayer 追蹤專案與聯絡行為。
date: 2026-07-30
updated: 2026-11-04
category: case
tags: [GTM, GA4, Nuxt]
readingTime: 8
---

做個人品牌網站時，我想知道訪客看了哪些作品、有沒有點聯絡，所以導入了 Google Tag Manager（GTM）和 Google Analytics 4（GA4）。一開始我分不清這兩個工具的差別，實際做過才比較清楚。

## GTM 和 GA4 差在哪

| 工具 | 負責的事 |
|---|---|
| GA4 | 收集並分析數據，例如瀏覽量和事件 |
| GTM | 管理網站上的追蹤代碼，決定什麼時候觸發 |

簡單來說，GA4 是看報表的地方，GTM 是放代碼的地方。網站只要載入 GTM，之後新增或調整追蹤，大多可以在 GTM 後台完成，不用每次都改程式。

網站和 GTM 之間靠 `dataLayer` 溝通：網站把事件推進去，GTM 再依照設定送到 GA4。

## 用 Nuxt 模組載入，但要自己決定時機

Nuxt 有官方模組 `@nuxt/scripts`，可以管理第三方腳本，所以我一開始先用它直接接 GA4：

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  useScriptGoogleAnalytics({ id: 'G-XXXXXXXXXX' })
})
```

之後為了用 GTM 管理追蹤，我換成 `useScriptGoogleTagManager`，並透過模組提供的 `proxy.dataLayer` 推送事件。

但上線後資料一直讀取不到。自訂事件不能等，我就先拿掉模組，改成自己建立 `dataLayer`、動態插入 GTM 的 script，資料才順利進來。

事後查文件才發現問題不在模組：`@nuxt/scripts` v1 調整了行為，沒有設定 `trigger` 時不會自動插入腳本，而我當時正好沒有寫。

知道原因之後，我又換回模組，並明確指定 `trigger: 'manual'`，由我決定什麼時候載入：

```ts
const gtm = useScriptGoogleTagManager({
  id: gtmId,
  scriptOptions: { trigger: 'manual' },
})

// 訪客同意之後才呼叫
gtm.load()
```

`manual` 的意思是：在我呼叫 `load()` 之前，什麼請求都不會發出。這正好符合下一節的需求，也不用自己處理重複載入和伺服器端渲染的問題。

## GA4 交給 GTM，不要再自己載一次

GTM 容器裡已經放了 GA4 的 Google tag，如果網站又自己載一份 gtag.js，每次造訪就會被算兩次。所以我把 GA4 的載入從程式裡拿掉，網站只負責載入 GTM，GA4 完全由 GTM 後台管理。

這也是我在這個過程中最容易忽略的一點：兩邊都能載 GA4，但只能選一邊。

## Cookie 同意：沒同意就不載入、不送事件

追蹤訪客行為前，可能需要先取得同意，所以我做了一個 Cookie 橫幅和 `useConsent` composable，把選擇存在 `localStorage`：

```ts
const decide = (next: 'granted' | 'denied') => {
  localStorage.setItem('cookie-consent', next)
  if (next === 'granted') nuxtApp.$analytics.load()
  else nuxtApp.$analytics.stop()
}
```

- 訪客同意：才呼叫 `load()` 載入 GTM。下次再來，頁面載入時會讀取已存的選擇，是 `granted` 就自動載入。
- 訪客拒絕或撤回：呼叫 `stop()`，設定 GA 官方的停用開關 `ga-disable-<GA4 ID>`，並把已經寫入的 `_ga` Cookie 清掉。
- 訪客改變主意：頁尾有「Cookie 設定」，可以隨時重新打開橫幅。

## 自訂事件：把追蹤集中在一個地方

頁面瀏覽量回答不了「訪客對什麼有興趣」，所以我另外定義了自訂事件，並把推送邏輯集中在 `useAnalytics`：

```ts
function track(event: AnalyticsEvent, params: Record<string, string | number> = {}) {
  if (!import.meta.client) return
  // 沒有同意就不送
  if (localStorage.getItem(CONSENT_KEY) !== 'granted') return
  window.dataLayer ||= []
  window.dataLayer.push({ event, locale: locale.value, ...params })
}
```

元件只要呼叫 `track('project_view', { project_slug })`，不需要知道 `dataLayer` 的格式。有兩個細節：

- `AnalyticsEvent` 是型別，列出所有合法的事件名稱，打錯字編輯器就會提醒，不會出現同一件事有兩種名字。
- 每個事件都會自動帶上目前的語言 `locale`，之後在 GA4 可以分語言看。事件參數不放姓名、Email、訊息內容等個人資料。

我追蹤的事件主要有這些：

| 事件 | 想知道的事 |
|---|---|
| `project_view` | 訪客看了哪個專案 |
| `project_demo_click` | 誰點了線上展示 |
| `project_github_click` | 誰點了專案的 GitHub |
| `note_click` | 從首頁或列表點了哪篇筆記 |
| `note_read` | 哪篇筆記被讀到 75%（真的有捲動才算） |
| `note_search` | 訪客搜尋了什麼關鍵字 |
| `contact_click` | 從哪裡點了聯絡，例如導覽列或頁尾 |
| `contact_form_open` | 有人打開了聯絡表單 |
| `contact_submit` / `contact_submit_error` | 表單送出成功或失敗 |
| `social_click` | 點了哪個社群連結 |
| `language_change` | 從哪個語言切換到哪個語言 |

## 在 GTM 與 GA4 後台設定

前端只負責把事件推進 `dataLayer`，資料要進到 GA4，後台還要設定。我用「一個觸發條件加一個事件代碼」處理所有事件，之後新增事件，不必再建新的代碼。

**1. 建立資料層變數**

在 GTM 新增「資料層變數」，名稱要跟程式送出的參數名一字不差，例如 `project_slug`、`note_slug`、`source`、`locale`。事件沒有送某個參數時，變數是空的，GA4 會直接略過，不會出錯。

**2. 建立一個觸發條件**

類型選「自訂事件」，事件名稱用規則運算式一次比對所有事件，並勾選「使用規則運算式比對」：

```
^(project_view|project_demo_click|project_github_click|note_click|note_read|note_search|contact_click|contact_form_open|contact_submit|contact_submit_error|social_click|language_change)$
```

GTM 的「自訂事件」比對的是 `dataLayer` 裡的 `event` 名稱，所以事件必須用 `dataLayer.push` 推送，改用 `gtag('event', ...)` 是比對不到的。

**3. 建立一個 GA4 事件代碼**

事件名稱填內建變數 `{{Event}}`，它會自動帶入 `dataLayer` 的事件名稱（要先在變數設定裡勾選 Event）。再把第一步的變數加進事件參數，觸發條件選上一步建立的。新增事件時，只要把名稱加進規則運算式就好。

GA4 本身由 GTM 裡的 Google 代碼載入，網站不再自己載一份，原因前面提過。

**4. 在 GA4 註冊自訂維度**

GA4 不會自動把自訂參數放進報表。到「管理 → 自訂定義」建立範圍為「事件」的自訂維度，例如 `project_slug`、`note_slug`、`source`，沒有註冊的話，資料雖然收到了，報表裡卻看不到「哪個專案」、「哪篇筆記」。另外把 `contact_submit` 標成關鍵事件，這是我最想知道的行為。

**5. 預覽測試，再發布**

用 GTM 的預覽模式開網站，並搭配 GA4 的 DebugView 確認。因為網站要同意才會載入 GTM，測試時要先按同意 Cookie，不然看不到任何事件。確認參數都有帶進去，再提交發布，沒發布的話正式站不會生效。

常見的問題：事件有觸發但參數是空的，多半是資料層變數名稱拼錯或大小寫不一致；完全沒有事件，先確認有同意 Cookie，以及容器有發布。

## 這次學到的事

- 先想清楚要回答什麼問題，再決定追蹤什麼，不是事件越多越好。
- 資料進不來時，先查工具的版本變更說明，我一度以為模組不能用，其實只是少了一個設定。
- GA4 只能由一邊載入，GTM 和網站同時載會重複計算。
- 資料要進到 GA4，三段都要通：程式推進 `dataLayer`、GTM 的觸發與代碼、GA4 的自訂維度。只有前端是不夠的。
- 同意機制要同時管兩件事：載入腳本、送出事件。撤回時也要把已經寫入的 Cookie 清掉。
- 把追蹤邏輯包成 composable，元件會乾淨很多，之後改名或調整也只要改一個地方。

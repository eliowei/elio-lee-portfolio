---
title: 弱點掃描的提醒：為什麼不要用 CDN 的 @latest
description: 弱點掃描回報中風險的跨網域設定問題，追查後發現來自一行 CDN 引入。記錄第三方資源的風險，以及改成自己託管的做法與取捨。
date: 2026-03-06
category: quality
tags: [Security, CDN, Vite]
readingTime: 5
---

公司專案做弱點掃描時，報告列出一個中風險項目：「跨網域設定錯誤」。我一開始以為是後端的 CORS 設定，追查後才發現，跟前端載入的一個圖示字型有關。

## 問題出在一行 @import

專案為了使用 Material Design Icons，寫了一個 CSS 檔，從 CDN 載入圖示：

```css
@import url("https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css");
```

這行寫起來很方便，也很常見，但它有幾個問題。

## 第三方資源的風險

### 1. 你的網站依賴別人的伺服器

CDN 上的 CSS 和字型是從另一個網域載入的。只要 CDN 服務異常，或使用者的網路環境擋掉該網域，圖示就全部顯示不出來。

對於網路環境受限的單位，這點特別容易發生，而且開發時完全看不出來。

### 2. `@latest` 代表內容隨時會變

`@latest` 不是固定的檔案，而是「目前最新的版本」。這代表：

- 套件發新版時，網站的內容會在你沒有部署的情況下改變。
- 如果新版調整了圖示名稱，畫面可能突然壞掉，程式碼卻完全沒動過。
- 上游被植入惡意內容時，你的網站也會直接載入。

CSS 雖然不能直接執行 JavaScript，但第三方內容能影響你的畫面，本身就是一個信任問題。

### 3. 無法做完整性檢查

瀏覽器有 Subresource Integrity（SRI），可以檢查檔案內容是否被改過：

```html
<link
  rel="stylesheet"
  href="https://cdn.example.com/lib@1.2.3/style.css"
  integrity="sha384-..."
  crossorigin="anonymous"
>
```

但 SRI 比對的是固定內容的雜湊值，`@latest` 的內容會變，一更新就會比對失敗。而且用 CSS `@import` 載入時，也沒有地方可以寫 `integrity`。

## 解法：改成自己託管

修法很單純：把 CSS 和字型檔放進專案，由自己的伺服器提供。

```text
src/assets/
├── customized/
│   └── materialdesignicons.min.css
└── fonts/
    ├── materialdesignicons-webfont.woff2
    └── materialdesignicons-webfont.woff
```

入口檔改成載入本地的 CSS：

```js
// main.js
import './assets/customized/materialdesignicons.min.css'
```

再把 CSS 裡 `@font-face` 的路徑指到本地字型。這樣所有資源都來自同一個來源，版本也固定了，要更新時才手動更換。

## 代價是什麼

自己託管不是完全沒有成本：

- 字型檔不小，專案也要多負責這些資源的快取和傳輸。
- 版本不會自動更新，要自己留意有沒有安全修正。
- CSS 檔會進版本控制。這個檔案就有兩萬多行。

如果重新做一次，我會改用 npm 安裝固定版本的 `@mdi/font`：

```js
import '@mdi/font/css/materialdesignicons.min.css'
```

打包工具會幫忙處理字型路徑，版本寫在 `package-lock.json`，比手動複製檔案好維護。如果只用到少量圖示，也可以改用 SVG，只打包需要的部分。

現代瀏覽器都支援 woff2，通常只保留 woff2 就夠了，不需要把 eot、ttf 都帶上。

## 怎麼檢查專案裡還有沒有類似問題

```bash
# 找出程式碼裡的外部資源
grep -rnE "https?://" src index.html

# 特別留意沒有固定版本的引入
grep -rn "@latest" src index.html
```

也可以打開 DevTools 的 Network 面板，篩選第三方網域，看實際載入了哪些資源。

## 這次學到的事

- 弱點掃描的項目不一定在你想的地方，要追到實際的來源。
- 方便的一行引入，背後是對第三方的信任。上線前要想清楚值不值得。
- 不要在正式環境使用 `@latest`，固定版本才能掌握網站實際載入的內容。

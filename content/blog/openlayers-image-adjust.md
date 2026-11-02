---
title: OpenLayers 影像調整：CSS filter 與彈窗拖曳的互動問題
description: 在 OpenLayers 地圖上用 CSS filter 做即時的明暗、對比、飽和調整，並記錄彈窗內操作地圖時，後方視窗跟著移動的問題如何修正。
date: 2025-12-01
category: case
tags: [OpenLayers, Canvas, Events]
readingTime: 6
---

工作上有一個查看影像的彈窗，裡面用 OpenLayers 顯示影像，使用者可以平移和縮放。這次要加上調整明暗、對比和飽和度的功能，同時也修掉一個彈窗互動的問題。

## 用 CSS filter 調整影像

OpenLayers 預設用 canvas 繪製圖層。要改變影像外觀，我一開始想到的是讀取像素、重新計算，但這樣要處理每個圖磚，平移和縮放時還要重來。

其實需求只是「看起來」不同，不需要改變資料，所以直接在 canvas 元素上套用 CSS filter 就好：

```js
updateFilterStyle() {
  const canvas = document.querySelector('#imageMap .ol-layer canvas')
  if (!canvas) return

  canvas.style.filter = `
    contrast(${this.contrast / 100})
    saturate(${this.saturation / 100})
    brightness(${this.exposure / 100})
  `
}
```

介面用滑桿綁定數值，範圍 50 到 200，預設 100：

```html
<v-slider v-model="contrast" min="50" max="200" step="10" @input="updateFilterStyle" />
```

這個做法有幾個好處：

- **效能好**：濾鏡由瀏覽器處理，不用重新繪製圖磚。
- **不影響資料**：原始影像完全不變，重設數值就能還原。
- **互動即時**：拖動滑桿時馬上看到結果。

### 範圍要限定

選擇器一定要指定到彈窗內的地圖。頁面上還有主地圖，如果只寫 `.ol-layer canvas`，就可能改到別的地圖。

### 什麼時候不適合

CSS filter 只改變顯示結果。如果要匯出調整後的影像，或是做像素分析，就要用 Canvas API 或 OpenLayers 的圖層處理。另外它會作用在整個 canvas 上，同一張 canvas 裡的所有圖層都會受到影響。

## 修 Bug：操作地圖時，後面的視窗跟著動

這個專案有好幾個可拖曳的彈窗。使用者先開啟「訂單」視窗，再開啟「查看影像」視窗，然後在地圖上拖曳時，後面的訂單視窗竟然也跟著移動；拖曳比例尺的縮放工具時也一樣。

### 原因

拖曳功能是這樣註冊的：

```js
document.addEventListener('mousedown', (e) => {
  if (e.target.tagName !== 'CANVAS') dragMouseDown(e)
})
```

問題有兩個：

- 監聽器掛在 `document`，**頁面上任何位置按下滑鼠都會觸發**，不只是彈窗本身。
- 判斷條件只排除了 canvas。地圖上的縮放工具不是 canvas，按下去就被當成要拖曳視窗。

換句話說，程式檢查的是「按到的不是什麼」，而不是「按到的是不是我」。

### 修正

改成確認事件真的發生在這個彈窗內，而且不是在地圖上：

```js
document.addEventListener('mousedown', (e) => {
  const popup = document.getElementById('orderPopup')
  const imageMap = document.querySelector('.imageMap')

  const isInPopup = popup?.contains(e.target)
  const isInMap = imageMap?.contains(e.target)

  if (isInPopup && !isInMap && e.target.tagName !== 'CANVAS') {
    dragMouseDown(e)
  }
})
```

`element.contains(target)` 可以判斷點擊的目標是否在某個元素裡面，比單看 `tagName` 可靠。

這次修正後，地圖的平移和縮放就和視窗拖曳分開了，使用者調整影像時，後面的視窗不會再亂跑。

### 更好的寫法

如果重新設計，我不會把監聽器掛在 `document`，而是掛在彈窗的標題列，只有抓著標題列才能拖曳。這樣根本不用判斷目標，也能避免監聽器在元件關閉後還留著。

## 這次學到的事

- 先想需求是改變資料，還是只改變顯示。後者通常有更簡單的做法。
- 事件綁在 `document` 時，要特別小心影響範圍。
- 條件寫成「確認是我」，比「排除不是我的」安全，因為排除清單永遠列不完。

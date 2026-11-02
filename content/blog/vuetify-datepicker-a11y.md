---
title: 讓 Vuetify 日期選擇器支援鍵盤與螢幕報讀器
description: 無障礙改寫時遇到元件庫支援不足的日期選擇器，如何補上鍵盤操作、焦點管理與報讀標籤，並用 NVDA 驗證。
date: 2026-04-22
category: quality
tags: [Accessibility, Vuetify, NVDA]
readingTime: 6
---

依無障礙標準改寫 Vue 3 專案時，我遇到一個元件庫解決不了的問題：Vuetify 的日期選擇器，無法完全用鍵盤完成操作，螢幕報讀器的導讀也不完整。

日期欄位出現在多個表單裡，所以我把處理方式整理成一個共用的 mixin，讓每個頁面不用各寫一次。

## 先列出使用者需要完成的操作

與其一個一個修問題，我先列出只用鍵盤的人要怎麼選日期：

| 按鍵 | 預期行為 |
|---|---|
| 方向鍵 | 左右移動一天，上下移動一週 |
| Enter | 選定日期，並回到輸入框 |
| Escape | 關閉選擇器，並回到輸入框 |
| 切換月份或年份時 | 焦點移到清單中對應的項目，選完回到日期 |

這張表同時也是驗收標準。

## 方向鍵：移動的是日期，不是 DOM

日期的相鄰關係不該靠找隔壁的按鈕來判斷，因為跨月時隔壁的按鈕可能不存在。把按鍵換算成天數，再交給 `Date` 處理跨月和跨年，邏輯簡單很多：

```js
const OFFSETS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

function moveDate(current, key) {
  const next = new Date(current)
  next.setDate(current.getDate() + OFFSETS[key])
  return next
}
```

超出可選範圍的日期不移動，其餘由呼叫方更新畫面並移動焦點。

## 焦點管理：畫面換了，焦點要跟著走

這是最花時間的部分。選擇月份後，月份清單會被日期格取代，原本有焦點的按鈕消失，焦點就會掉回頁面開頭，鍵盤使用者等於迷路了。

所以每次畫面切換，都要明確決定焦點的去向：

- 開啟月份或年份清單：聚焦到目前日期所在的項目。
- 選完月份或年份：回到日期格，依序找相同的日期、已選定的日期、今天，最後才是第一個可用的日期。
- 按 Enter 或 Escape 關閉：回到原本的輸入框。

月份和年份清單的方向鍵也要另外處理，因為它們是多欄排列，上下鍵要跳過一整欄的數量，不是移動一格。

## 報讀標籤：用 MutationObserver 補上

日期按鈕需要完整的名稱，報讀器才能念出「2026年11月2日 星期一」這樣的內容。但這些按鈕由 Vuetify 產生，換月份時會重新渲染，只在開啟時設定一次是不夠的。

我的做法是監看選擇器的變化，只替還沒有標籤的按鈕補上 `aria-label`：

```js
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function labelDays(picker) {
  picker.querySelectorAll('.v-date-picker-month__day button').forEach((btn) => {
    const iso = btn.closest('.v-date-picker-month__day')?.dataset.vDate
    if (!iso || btn.hasAttribute('aria-label')) return
    const d = new Date(iso)
    btn.setAttribute('aria-label', `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}`)
  })
}

const observer = new MutationObserver(() => labelDays(picker))
observer.observe(picker, { childList: true, subtree: true })
```

選擇器關閉時要記得 `disconnect()`，否則觀察器會留在記憶體裡。「只補沒有標籤的按鈕」也不是多餘的判斷：這個回呼自己也會修改 DOM，如果每次都重寫，就容易造成不必要的重複處理。

## 用 NVDA 驗證，不要只看程式碼

`aria-label` 寫了不代表念得對。修改後我實際開啟 NVDA，只用鍵盤走完整個流程：開啟選擇器、移動日期、切換月份和年份、選定、關閉，確認每一步的焦點位置和報讀內容都符合預期。

## 這次學到的事

- 元件庫不等於無障礙。它能省下很多工，但實際走過流程之前，不能假設它都處理好了。
- 無障礙不只是加屬性，焦點管理才是鍵盤操作體驗的核心。
- 這個做法依賴 Vuetify 的 class 名稱和 DOM 結構，升級版本時可能失效，所以每次升級都要重新驗證。

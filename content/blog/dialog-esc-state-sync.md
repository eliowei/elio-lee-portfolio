---
title: Dialog 按 ESC 關閉後，再也打不開
description: Vuetify Dialog 用 ESC 關閉後，再次點擊卻打不開。問題出在元件內部狀態和外部狀態沒有同步，記錄原因與修正方式。
date: 2025-12-05
category: vue
tags: [Vuetify, Vuex, State]
readingTime: 3
---

有一個常見問題的 Dialog，用按鈕關閉完全正常，但按鍵盤 ESC 關閉之後，再點一次開啟按鈕，視窗就打不開了。

## 原因：兩個地方都記著開關狀態

這個 Dialog 的開關是由 Vuex 控制的，外部用 action 打開：

```js
store.dispatch('toggleFAQdialog', { action: true })
```

按鈕關閉時會走 `closeFAQ`，把狀態改回 `false`。問題是 ESC 不會經過這條路。Vuetify 的 Dialog 內建 ESC 關閉，它自己把視窗收起來了，但我們的關閉邏輯沒有執行。

於是狀態變成這樣：

| 時機 | Vuex 狀態 | 畫面 |
|---|---|---|
| 開啟 | `true` | 顯示 |
| 按 ESC | 仍然是 `true` | 關閉 |
| 再按開啟 | `true` → `true` | 沒有變化 |

狀態沒有改變，Vue 也就不會觸發更新，畫面當然沒有反應。

## 修法：讓 ESC 走同一條關閉流程

在 Dialog 上監聽 ESC，呼叫同一個關閉方法：

```html
<v-dialog v-model="FAQdialog" @keydown.esc="closeFAQ">
```

這樣不管從哪裡關閉，最後都會把狀態改回 `false`，兩邊就一致了。

## 其他會發生同樣問題的情況

只要元件有自己關閉的方式，就要確認狀態有同步：

- 按 ESC
- 點擊遮罩
- 路由切換

這也是 `v-model` 重要的原因：雙向綁定的 setter 要真的把值寫回狀態來源，元件內部的關閉才會同步到外面。如果綁定的是只有 getter 的 computed，或用單向的 `:value`，就很容易遇到這個問題。

```js
computed: {
  dialog: {
    get() {
      return this.$store.state.showDialog
    },
    set(value) {
      this.$store.commit('setShowDialog', value)
    },
  },
}
```

## 這次學到的事

- 同一個狀態存在兩個地方時，遲早會不同步。
- 測試關閉功能時，不只要測按鈕，鍵盤和遮罩也要測。
- 「只有第二次失敗」的 Bug，通常代表狀態沒有被重設。

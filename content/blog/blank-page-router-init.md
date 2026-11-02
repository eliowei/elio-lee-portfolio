---
title: 頁面一片空白：路由 404、初始化 API 與重複登入
description: 後台系統在幾種情況下會顯示空白畫面。記錄如何補上 404 路由、調整初始化 API 的載入方式，以及處理重複登入與密碼逾期的流程。
date: 2026-03-18
category: case
tags: [Vue Router, Promise, Error Handling]
readingTime: 6
---

空白畫面是最難受的錯誤之一：沒有提示、沒有按鈕，使用者只能重新整理。我在維護一個 Vue 2 後台系統時，一次處理了幾個會造成空白畫面的情況。

## 情況一：進入不存在的路由

輸入錯誤的網址時，頁面只有外框，內容完全空白。

原因很單純：Vue Router 找不到對應路由時不會報錯，只是 `<router-view>` 什麼都不渲染。Vue Router 3 要自己加上萬用路由：

```js
export function abort(code = 404) {
  return {
    name: 'FourOhFour',
    path: '*',
    component: () => error(code),
  }
}
```

因為 `*` 會配對所有路徑，它一定要放在路由清單的最後。這個專案把它放在初始化完成後，用 `addRoute` 註冊：

```js
router.addRoute(abort())
```

## 情況二：初始化 API

系統進站時要載入幾份基礎資料，原本是一支一支等：

```js
async function getData() {
  await store.dispatch('getFormatInGroups')
  await store.dispatch('setCityLists')
  await store.dispatch('setPaymentType')
  await checkLogin()
  await getUserRoles()
}
```

這段有兩個問題：

- **串行**：總時間是每支 API 的時間相加。
- **沒有錯誤處理**：任何一支失敗，後面都不會執行，也沒有人接住錯誤。

這幾份資料彼此獨立，不需要等前一支完成，所以改成並行，並加上錯誤處理：

```js
async function getData() {
  try {
    await Promise.all([
      store.dispatch('getFormatInGroups'),
      store.dispatch('setCityLists'),
      store.dispatch('setPaymentType'),
      checkLogin(),
      getUserRoles(),
    ])
    router.addRoute(abort())
  } catch (error) {
    console.error('資料載入錯誤：', error)
  }
}
```

### 改成 Promise.all 要注意什麼

`Promise.all` 不是把 `await` 換掉就好：

- **有依賴關係的不能並行**。如果 B 要用 A 的結果，就要維持先後順序。
- **一支失敗就會進 `catch`**，其他成功的結果也拿不到。

如果希望部分失敗時，其他資料還能用，可以改成 `Promise.allSettled`：

```js
const results = await Promise.allSettled(tasks)
const failed = results.filter(r => r.status === 'rejected')
```

上面的寫法還有一個可以再改進的地方：`addRoute` 放在 `try` 裡，初始化失敗時就不會註冊 404 路由。如果重做一次，我會把它移到 `finally`，或在路由建立時就註冊，讓 404 不受 API 影響。

## 情況三：重複登入

已經登入的使用者再次登入時，API 回傳失敗訊息，但程式沒有處理這個情況，只顯示「缺少必要的權限信息」，接著畫面就空白了。

修法是區分失敗的原因：

```js
if (result.message?.includes('已登入')) {
  alert(result.message)
  await router.push({ name: 'Dashboard' })
} else {
  alert('登入失敗，請稍後再試。')
}
```

用訊息文字判斷不是最理想的做法，後端有明確的錯誤代碼會更穩定，但在不動後端的情況下，這樣能先解決問題。

## 順便補上：密碼逾期

登入時也可能遇到密碼逾期。原本使用者只會卡住，所以我新增了一個設定新密碼的視窗：後端回傳逾期狀態時打開，更新成功後關閉，讓使用者不用離開登入流程。

## 這次學到的事

- 空白畫面通常代表某個情況沒有被處理，不是程式壞掉，而是流程沒有終點。
- 每個流程都要想失敗時的畫面：找不到頁面、API 失敗、狀態不符。
- 串行改並行前，先確認資料之間的依賴關係。
- 錯誤被 `catch` 住只是第一步，還要讓使用者看得到結果。

---
title: 登入後回到原本的頁面：把一堆旗標收斂成一個機制
description: 原本每個頁面各用一個旗標記錄登入後要去哪裡，新增頁面就要多一個。記錄如何改用 Router Guard 統一處理，以及需要排除的邊界情況。
date: 2026-03-10
category: case
tags: [Vue Router, Vuex, Refactoring]
readingTime: 5
---

使用者點進需要登入的頁面時，會先被帶去登入。登入完應該回到原本要去的頁面，而不是回首頁。

這個需求很常見，但我接手的 Vue 2 專案只處理了其中幾個頁面，而且做法不好擴充。這篇記錄我怎麼重構它。

## 原本的做法：每個頁面一個旗標

Vuex 裡有一組旗標，記錄使用者是從哪個功能過來的：

```js
state: {
  loginToCart: false,
  loginToApplication: false,
  // ...
}
```

進入頁面前設定旗標，登入成功後再逐一判斷：

```js
if (state.loginToCart) {
  router.push({ name: 'Cart' })
} else if (state.loginToApplication) {
  router.push({ name: 'Application' })
} else {
  router.push({ name: 'Home' })
}
```

這樣的問題是，新增一個要登入的頁面，就要多一個旗標、多一個 mutation、多一段判斷，還要記得在對的地方清除。沒有列進去的頁面，登入後就只能回首頁。

而且它只記得「哪個頁面」，記不住網址上的參數。

## 改成：記住使用者要去的路由

其實這些旗標都在表達同一件事：登入後要去哪裡。所以我把它們換成一個狀態：

```js
state: {
  redirectAfterLogin: null,
},
mutations: {
  setRedirectAfterLogin(state, route) {
    state.redirectAfterLogin = route
  },
  clearRedirectAfterLogin(state) {
    state.redirectAfterLogin = null
  },
}
```

記錄的時機也不用分散在各個頁面，全部放進 Router Guard。發現使用者沒有登入時，把目標路由存下來：

```js
router.beforeEach((to, from, next) => {
  const isPageRefresh = from.name && from.path === to.path
  const skip = ['Login', 'Register', 'Home']

  if (
    !isLoggedIn() &&
    !store.state.redirectAfterLogin &&
    !skip.includes(to.name) &&
    from.name !== undefined &&
    !isPageRefresh
  ) {
    store.commit('setRedirectAfterLogin', {
      name: to.name,
      params: to.params,
      query: to.query,
    })
  }

  // ...
})
```

登入成功後只要看這一個值：

```js
const route = store.state.redirectAfterLogin
store.commit('clearRedirectAfterLogin')
router.push(route ?? { name: 'Home' })
```

現在新增要登入的頁面，不用再改任何跳轉邏輯。

## 為什麼要存 params 和 query

只存路徑名稱的話，帶參數的頁面回來後內容會不見。例如從訂單詳情或搜尋結果被帶去登入，回來應該還是同一筆資料。

所以我把 `name`、`params`、`query` 都存起來，回來時就能還原完整的頁面狀態。

## 要排除的邊界情況

機制本身很簡單，大部分的條件都在處理例外：

- **登入、註冊、首頁不記錄**：不然使用者登入後又跳回登入頁。
- **已經有值就不覆蓋**：使用者被帶去登入的途中，還可能經過其他路由，保留第一個才是原本的目的地。
- **第一次進站不記錄**：`from.name` 是 `undefined` 時，代表直接開啟網址，不是站內導覽。
- **重新整理不記錄**：這時來源和目標是同一個路徑。
- **登出時要清除**：不然下一個人登入後，會跳到上一個使用者的頁面。

最後一點最容易忘記。兩個人共用一台電腦時，這不只是體驗問題，也可能看到不該看的頁面。

## 為什麼不用網址參數

另一種常見做法是把目的地放在網址，例如 `/login?redirect=/orders/123`。它的好處是重新整理不會消失，也方便分享。

但要注意 Open Redirect：如果直接跳轉網址參數的值，攻擊者可以做出 `?redirect=https://evil.example` 的連結，用你的網域騙使用者。使用這種做法時，要檢查目的地只能是站內路徑。

這個專案把路由物件存在 Vuex，目的地不來自外部輸入，所以沒有這個問題；代價是整頁重新整理後狀態會消失，回到首頁。

## 這次學到的事

- 看到一排相似的旗標時，先想它們是不是在表達同一件事。
- 共用邏輯放在 Router Guard，比散落在各頁面好維護。
- 重構後程式變少了，但邊界條件才是真正要花時間想清楚的地方。

---
title: JWT 要存哪裡：從 localStorage 到 Cookie + CSRF Token
description: 比較 JWT 存在 localStorage 與 HttpOnly Cookie 的差異，說明 XSS 與 CSRF 的風險，並記錄實際專案改用 Cookie 加 CSRF Token 的做法與踩坑。
date: 2026-09-30
category: quality
tags: [JWT, CSRF, XSS]
readingTime: 9
---

我的第一個全端專案「遊戲揪團平台」，是把 JWT 存在 Pinia，再持久化到 localStorage。做法簡單，每次請求放進 `Authorization` header 就好。當時我對權限這塊的理解還比較薄弱，沒有想太多。

後來做 LINE OA 商家管理平台，後台可以管理多間店家的內容和帳號權限，登入憑證被偷的影響大很多，所以我改成 HttpOnly Cookie 加 CSRF Token。這篇整理兩種做法的風險，以及實作時遇到的問題。

## JWT + localStorage 的風險：XSS

localStorage 的優點是簡單，缺點是**任何在頁面上執行的 JavaScript 都讀得到**。

XSS（跨站腳本攻擊）是指攻擊者讓自己的腳本在你的網站上執行，例如透過沒有處理好的使用者輸入，或被植入惡意程式的第三方套件。一旦發生，偷走 token 只要一行：

```js
const token = localStorage.getItem('token')
```

攻擊者把 token 傳回自己的伺服器後，就能在別的地方假冒使用者，直到 token 過期。JWT 通常是無狀態的，簽發後伺服器很難提前作廢，所以有效期越長，風險越高。

## 改放 HttpOnly Cookie

加上 `HttpOnly` 的 Cookie，JavaScript 讀不到，瀏覽器會在請求時自動帶上：

```js
export const accessTokenCookieConfig = {
  httpOnly: true, // JavaScript 讀不到
  secure: process.env.NODE_ENV === 'production', // 只走 HTTPS
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
}
```

前端的 axios 要開啟 `withCredentials: true`，跨網域請求才會帶上 Cookie。

這樣 XSS 就偷不走 token 了。但「瀏覽器會自動帶上」這個特性，帶來了另一個問題。

## Cookie 的風險：CSRF

CSRF（跨站請求偽造）是使用者已經登入你的網站時，瀏覽惡意網站，對方偷偷發出一個請求到你的 API。因為 Cookie 會自動帶上，伺服器會以為是使用者本人操作。

攻擊者不需要讀到 Cookie，只要讓瀏覽器幫忙送出就好。

`SameSite` 可以擋掉大部分情況，但我的 Cookie 在正式環境設成 `SameSite=None`，這個設定不會限制跨站請求，所以還需要 CSRF Token。

## Safari：前後端要放在同一個網域

這個問題是我用手機測試時才發現的。前後端在完全不同的網域時，例如前端在 `xxx.pages.dev`、API 在 `xxx.onrender.com`，對瀏覽器來說這就是第三方 Cookie。

Safari 預設會封鎖第三方 Cookie，就算設了 `SameSite=None; Secure` 也一樣。結果是登入 API 回傳成功，Cookie 卻沒有被存下來，一直是未登入狀態。

後來我把網域改掉，讓前後端使用同一個主網域，例如 `admin.example.com` 和 `api.example.com`。這樣 Cookie 就不算第三方，Safari 也能正常運作。

## CSRF Token 怎麼運作

登入時後端產生一組隨機值，放在一個**前端可以取得**的地方，之後每次修改資料的請求都要放進自訂 header：

```js
// 前端：每個請求帶上 CSRF Token
api.interceptors.request.use((config) => {
  if (authStore.csrfToken) {
    config.headers['x-csrf-token'] = authStore.csrfToken
  }
  return config
})
```

後端比對 Cookie 和 header 裡的值是否相同：

```js
const a = Buffer.from(String(req.cookies.csrf_token))
const b = Buffer.from(String(req.headers['x-csrf-token']))

if (a.length !== b.length || !timingSafeEqual(a, b)) {
  return res.status(403).json({ success: false, message: 'CSRF invalid' })
}
```

惡意網站雖然能讓瀏覽器帶上 Cookie，但讀不到 Token，也就寫不進自訂 header。這裡用 `timingSafeEqual` 比對，避免從回應時間猜出內容。

## Access Token 與 Refresh Token

Access Token 我設定 15 分鐘，就算外洩，影響時間也短。為了不讓使用者一直重新登入，再搭配 7 天的 Refresh Token。

Refresh Token 我多做了幾件事：

- **資料庫只存 SHA-256 雜湊**：一開始是明碼存入，後來才改掉。就算資料庫外洩，也拿不到能用的 token。
- **每次更新都輪替**：舊的 Refresh Token 用過就失效。
- **限制同時登入的數量**：超過上限時移除最舊的一筆。

JWT 無法提前作廢的問題，也因此得到緩解：把資料庫裡的 Refresh Token 刪掉，使用者最多 15 分鐘後就要重新登入。

## 踩到的坑：多支請求同時 401

頁面通常會同時發出多支 API。Access Token 過期時，這些請求會同時收到 401，然後同時呼叫 `/refresh`。

因為 Refresh Token 每次都會輪替，第一支成功後，其他請求拿的是舊 token，就會被拒絕，接著觸發登出，把 CSRF Token 也清掉，後面的請求全部失敗。

解法是讓同一時間只有一次 refresh，其他請求共用結果：

```js
let refreshPromise = null

refreshPromise ??= authApi.post('/refresh').finally(() => {
  refreshPromise = null
})
const { data } = await refreshPromise
```

另一個坑是多分頁。如果每次登入都產生新的 CSRF Token，其他分頁手上的值就對不上了，所以我改成已經有的話就沿用。

## 這樣就安全了嗎

沒有絕對安全的做法。HttpOnly Cookie 只是讓 token 不會被偷走，如果網站真的有 XSS，攻擊者還是能在頁面上直接發送請求。所以輸入處理、依賴套件管理這些基本功還是要做。

| 做法 | 主要風險 | 需要的防護 |
|---|---|---|
| JWT + localStorage | XSS 偷走 token | 防 XSS、縮短有效期 |
| JWT + HttpOnly Cookie | CSRF | SameSite、CSRF Token |
| 再加 Refresh Token 機制 | 實作較複雜 | 輪替、雜湊儲存、處理並發 |

## 這次學到的事

- 沒有最好的存法，只有不同的風險。localStorage 防不了 XSS，Cookie 要處理 CSRF。
- 我做揪團平台時對權限這塊還比較薄弱，那個專案也沒有改回來。後來做管理多間店家資料的後台，才真正開始思考憑證被偷的影響。
- 只在電腦上測試不夠。這個問題是拿手機實測才發現的，Cookie 這類行為要連 Safari 一起測。
- 機制越多，邊界情況越多。真正花時間的不是加上 Cookie，而是處理並發和多分頁。

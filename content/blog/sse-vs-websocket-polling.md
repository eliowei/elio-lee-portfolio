---
title: 即時通知怎麼選：Polling、SSE 與 WebSocket 比較
description: 比較 Short Polling、Long Polling、SSE 與 WebSocket 的運作方式與適用情境，並記錄 LINE OA 商家管理平台為什麼選 SSE 做後台通知，以及實作時遇到的限制。
date: 2026-11-06
category: case
tags: [SSE, WebSocket, Polling]
readingTime: 8
---

LINE OA 商家管理平台的後台有一個通知鈴鐺：資料被修改、預約被審核、有新使用者加入好友時，商家要馬上看到，不需要重新整理頁面。

HTTP 原本是「瀏覽器問、伺服器答」，伺服器不能主動說話。要做到即時通知，就得選一種方式讓伺服器把訊息送過來。這篇整理常見的幾種做法，以及我為什麼選 SSE。

## 四種做法

### Short Polling：固定間隔問一次

前端用 `setInterval` 每幾秒打一次 API，問「有新通知嗎？」。

```js
setInterval(async () => {
  const { data } = await api.get('/notifications')
  notifications.value = data.result
}, 5000)
```

最簡單，任何環境都能用。缺點是大部分請求都是白問，間隔拉長就不即時，拉短又浪費流量與伺服器資源。

### Long Polling：問了就等

前端送出請求，伺服器**先不回應**，等到有新資料才回，前端收到後立刻再發下一個請求。比 Short Polling 即時，但每筆通知都要重新建立一次請求，伺服器要同時撐著很多等待中的連線，逾時與重連也要自己處理。

**兩者的差別，在於誰決定什麼時候回應。** Short Polling 是前端按固定節奏問，伺服器有沒有新資料都立刻回；Long Polling 是前端問了之後，伺服器等到有資料（或逾時）才回。所以 Long Polling 不是沒有輪詢，只是把「多久問一次」，換成由伺服器的事件或逾時來決定。

![Short Polling 與 Long Polling 的請求流程比較：Short Polling 由前端固定間隔發送請求，伺服器立即回應，多數為空回應；Long Polling 的請求會被伺服器暫時留住，有新資料或逾時才回應，前端收到後馬上再發下一個請求。](/images/blog/short-vs-long-polling.svg)

### SSE（Server-Sent Events）：單向的長連線

瀏覽器發一個一般的 HTTP 請求，伺服器**不結束回應**，而是把訊息一段一段寫進去。瀏覽器內建 `EventSource` 可以直接接收。

伺服器的回應是純文字，格式很固定：

```
event: notification
data: {"title":"預約已核准"}

:ping
```

每則訊息以空行結尾；開頭是冒號的行是註解，瀏覽器會忽略，常拿來當心跳。

### WebSocket：雙向連線

先用 HTTP 發出升級請求（回應 `101 Switching Protocols`），這個過程稱為握手（Handshake）。握手完成後，這條連線就不再是 HTTP，而是前後端都能隨時傳資料的雙向通道。

```js
const ws = new WebSocket('wss://example.com/chat')
ws.onmessage = (e) => console.log(e.data)
ws.send('hello')
```

聊天室、多人遊戲、協作編輯這種「兩邊都頻繁傳資料」的情境，它是正解。

## 比較表

| | Short Polling | Long Polling | SSE | WebSocket |
|---|---|---|---|---|
| 方向 | 前端問 | 前端問，伺服器延遲回 | 伺服器 → 前端 | 雙向 |
| 協定 | HTTP | HTTP | HTTP | HTTP 握手後升級為 WebSocket |
| 即時性 | 取決於間隔 | 高 | 高 | 高 |
| 斷線重連 | 不需要 | 自己寫 | 瀏覽器自動 | 自己寫 |
| 資料格式 | 任意 | 任意 | UTF-8 文字（可傳 JSON 字串） | 文字或二進位 |
| 自訂 Header | 可以 | 可以 | `EventSource` 不行 | 瀏覽器 API 不行 |
| 伺服器負擔 | 請求處理量大 | 大量等待中的請求 | 要維持長連線並推送資料 | 要維持長連線，並管理連線狀態與訊息 |
| 適合 | 低頻、簡單 | 無法用其他方式時 | 通知、進度、即時看板 | 聊天、遊戲、協作 |

還有一種常被拿來比較的是 Web Push：它是瀏覽器或系統層級的推播，網頁關掉也收得到，但要申請權限、處理訂閱，和「頁面開著時的即時更新」是不同層級的問題，這次沒有用。

## 為什麼我選 SSE

挑之前我先問自己：資料需要雙向傳嗎？

後台通知只有伺服器往前端送。商家要標示已讀，用一般的 `PATCH` 請求就行，不需要為此維持雙向通道。所以：

- **WebSocket 的雙向能力用不到**，卻要自己處理心跳、重連與驗證。
- **SSE 就是一般的 HTTP 請求**，登入用的 HttpOnly Cookie 會跟著送，原本的驗證中介層可以直接沿用。WebSocket 的握手也會帶 Cookie，但還要自己檢查來源（Origin）、處理升級階段的驗證，這些都是額外的工作。
- **`EventSource` 斷線會自動重連**，不用自己寫。
- **Polling 太浪費**：通知不頻繁，大部分請求都會空手而回，部署在資源有限的 Render 免費方案，更不想白白增加請求。

## 實作長什麼樣子

### 後端：把回應留著不關

```js
export const stream = (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  res.flushHeaders()

  const listener = (doc) => {
    res.write(`event: notification\ndata: ${JSON.stringify(doc)}\n\n`)
  }
  notificationBus.on(shopId, listener)

  // 定時送註解行，避免中間的 proxy 判定連線閒置而斷線
  const keepAlive = setInterval(() => res.write(':ping\n\n'), 30 * 1000)

  req.on('close', () => {
    clearInterval(keepAlive)
    notificationBus.off(shopId, listener)
  })
}
```

重點有三個：標頭設成 `text/event-stream`、不呼叫 `res.end()`、連線關閉時要把監聽器與計時器清掉，否則會一直累積。

通知產生時，先寫進 資料庫，再用 Node.js 內建的 `EventEmitter` 發出事件，正在連線的 SSE 就會收到。先寫資料庫，是因為連線可能剛好斷掉，通知不能只存在推送的那一瞬間。

### 前端：EventSource

```js
const url = `${import.meta.env.VITE_API}/notifications/stream?shopId=${shopId}`
eventSource = new EventSource(url, { withCredentials: true })

eventSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data)
  if (notifications.value.some(n => n._id === notification._id)) return
  notifications.value.unshift(notification)
  unreadCount.value++
})
```

## 踩到的限制

**`EventSource` 不能自訂 Header。** 一般 API 請求可以把「要看哪一間店」放在 Header，但 `EventSource` 沒辦法加，所以串流這支只能改成用網址參數帶。`withCredentials: true` 則讓 Cookie 跟著送出去。

**切換店家要重連。** 商家可以管理多間店，切換時要先關掉舊的連線、清空列表，再用新店的識別建立新連線。如果舊店的請求比較晚回來，還要丟掉，避免蓋掉新店的資料。

**要防止重複。** 同一則通知可能同時從「載入列表」和「SSE 推送」進來，所以用 `_id` 去重。

**目前只支援單一伺服器。** 現在的 `EventEmitter` 只存在單一 Node.js 程序的記憶體裡。如果之後要多台伺服器，A 機器產生的通知，連在 B 機器的使用者就收不到，要改用 Redis Pub/Sub 之類的方案。我在程式碼裡留了註解標記這個上限。

**重連後不會補抓漏掉的通知。** `EventSource` 會自動重連，但斷線期間錯過的通知，目前只有重新整理或切換店家時才會從列表補回來。比較完整的做法是重連後重新呼叫一次列表 API，或用 SSE 的 `id` 欄位搭配 `Last-Event-ID` 讓伺服器補送，這是還沒做的部分。

另外，HTTP/1.1 下瀏覽器對同一網域的連線數有上限（通常是 6 條），一個 SSE 連線就佔一條，同一個網站開很多分頁時會互相排擠；HTTP/2 可以在同一條連線上多工，上限高很多，這個問題就不明顯。

## 怎麼選

1. 資料只由伺服器往前端送（通知、進度條、即時看板）→ **SSE**。
2. 兩邊都要頻繁傳資料（聊天、遊戲、協作）→ **WebSocket**。
3. 更新不頻繁、環境受限、可以接受延遲 → **Short Polling**。
4. 頁面關掉也要收到 → **Web Push**。

## 這次學到的事

選技術時，先問「資料往哪個方向走」比先問「哪個比較強」更有用。WebSocket 功能比較多，但多出來的能力用不到時，只是多出一堆要自己維護的東西。

另外，即時推送只是「讓使用者更快看到」，資料本身還是要先存起來。把通知寫進資料庫，推送失敗或斷線都不會遺失，這也是我覺得這個設計裡最重要的一步。

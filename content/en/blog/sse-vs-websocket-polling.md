---
title: 'Choosing Real-Time Notifications: Polling vs SSE vs WebSocket'
description: Comparing how Short Polling, Long Polling, SSE and WebSocket work and when to use each, with notes on why the LINE OA management platform uses SSE for admin notifications and the limits I ran into.
date: 2026-11-06
category: case
tags: [SSE, WebSocket, Polling]
readingTime: 8
---

The admin of the LINE OA management platform has a notification bell. When data is edited, a reservation is reviewed, or a new user follows the account, the shop owner should see it straight away, without refreshing the page.

HTTP is "the browser asks, the server answers", so the server cannot speak first. To get real-time notifications, you have to pick a way for the server to get messages to the browser. This note goes through the common options and why I chose SSE.

## Four approaches

### Short Polling: ask on a fixed interval

The frontend calls an API every few seconds with `setInterval` and asks, "anything new?"

```js
setInterval(async () => {
  const { data } = await api.get('/notifications')
  notifications.value = data.result
}, 5000)
```

It is the simplest and works anywhere. The downside is that most requests are wasted. A longer interval is less real-time, and a shorter one burns bandwidth and server resources.

### Long Polling: ask, then wait

The frontend sends a request and the server **does not answer yet**. It waits until there is new data, and the frontend sends the next request as soon as it gets a response. It is more real-time than Short Polling, but every notification costs a fresh request, the server has to hold many waiting connections, and timeouts and reconnects are yours to handle.

**The difference is who decides when the answer comes.** With Short Polling, the frontend asks at a fixed rhythm and the server replies straight away, whether or not there is new data. With Long Polling, the server holds the request until there is data (or a timeout). So Long Polling is not free of polling: "how often to ask" is simply replaced by the server's events or timeouts.

![Request flow of Short Polling versus Long Polling: in Short Polling the client sends requests at a fixed interval and the server replies immediately, mostly with empty responses; in Long Polling the server holds each request until there is new data or a timeout, and the client sends the next request right after it gets a response.](/images/blog/short-vs-long-polling.svg)

### SSE (Server-Sent Events): a one-way long connection

The browser sends an ordinary HTTP request, and the server **never finishes the response**. It writes messages into it piece by piece. Browsers have a built-in `EventSource` that receives them.

The response is plain text in a fixed format:

```
event: notification
data: {"title":"Reservation approved"}

:ping
```

Each message ends with a blank line. A line that starts with a colon is a comment the browser ignores, often used as a heartbeat.

### WebSocket: a two-way connection

It starts with an HTTP upgrade request (answered with `101 Switching Protocols`). After that, the connection is no longer HTTP but a two-way channel where both sides can send data at any time.

```js
const ws = new WebSocket('wss://example.com/chat')
ws.onmessage = (e) => console.log(e.data)
ws.send('hello')
```

For chat, multiplayer games and collaborative editing, where both sides send data often, it is the right answer.

## Comparison

| | Short Polling | Long Polling | SSE | WebSocket |
|---|---|---|---|---|
| Direction | Frontend asks | Frontend asks, server delays the reply | Server → frontend | Two-way |
| Protocol | HTTP | HTTP | HTTP | HTTP handshake, then upgrade to WebSocket |
| Real-time | Depends on interval | High | High | High |
| Reconnect | Not needed | Write it yourself | Automatic in the browser | Write it yourself |
| Data format | Any | Any | UTF-8 text (JSON strings are fine) | Text or binary |
| Custom headers | Yes | Yes | Not with `EventSource` | Not with the browser API |
| Server cost | Lots of requests to handle | Lots of waiting requests | Long-lived connections and pushing data | Long-lived connections, plus connection state and messages to manage |
| Good for | Low frequency, simple | When nothing else is possible | Notifications, progress, live boards | Chat, games, collaboration |

Web Push often comes up in this comparison too. It is a browser or OS-level push that arrives even when the page is closed, but it needs permission and subscription handling, and it solves a different problem from live updates while a page is open. I did not use it here.

## Why I chose SSE

Before choosing, I asked myself: does data need to travel both ways?

Admin notifications only go from the server to the frontend. Marking one as read is an ordinary `PATCH` request, so there is no reason to keep a two-way channel open. So:

- **I would not use WebSocket's two-way ability**, but I would have to handle heartbeats, reconnects and authentication myself.
- **SSE is an ordinary HTTP request**, so the HttpOnly login cookie is sent along and the existing authentication middleware works as it is. A WebSocket handshake also carries cookies, but I would still have to check the origin and handle authentication during the upgrade, which is extra work.
- **`EventSource` reconnects automatically** after a drop.
- **Polling is wasteful**: notifications are infrequent, so most requests would come back empty, and on Render's free plan I did not want to add requests for nothing.

## What it looks like

### Backend: keep the response open

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

  // send a comment line regularly so proxies do not treat the connection as idle
  const keepAlive = setInterval(() => res.write(':ping\n\n'), 30 * 1000)

  req.on('close', () => {
    clearInterval(keepAlive)
    notificationBus.off(shopId, listener)
  })
}
```

Three things matter: the header is `text/event-stream`, `res.end()` is never called, and the listener and timer are cleaned up when the connection closes, or they pile up.

When a notification is created, it is saved to the database first, then an event is emitted through Node.js's built-in `EventEmitter`, and any open SSE connection receives it. It is saved first because the connection may drop at that very moment, and a notification should not exist only for the instant it is pushed.

### Frontend: EventSource

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

## Limits I ran into

**`EventSource` cannot set custom headers.** Normal API requests can put "which shop to look at" in a header, but `EventSource` cannot add one, so the stream endpoint has to take it from the URL instead. `withCredentials: true` makes the cookie go along.

**Switching shops means reconnecting.** An owner can manage several shops. On switching, I close the old connection, clear the list, and open a new one for the new shop. If the old shop's response arrives late, it has to be discarded so it does not overwrite the new shop's data.

**Duplicates need guarding.** The same notification can arrive from both the list request and the SSE push, so I deduplicate by `_id`.

**It only supports a single server for now.** The `EventEmitter` lives in the memory of one Node.js process. With several servers, a notification created on machine A would not reach a user connected to machine B, and I would need something like Redis Pub/Sub. I left a comment in the code marking that ceiling.

**Missed notifications are not backfilled after a reconnect.** `EventSource` reconnects by itself, but notifications missed during the drop are only recovered when the page is refreshed or the shop is switched and the list is fetched again. A fuller approach is to call the list API again after a reconnect, or to use the SSE `id` field with `Last-Event-ID` so the server can resend what was missed. I have not done this yet.

Also, over HTTP/1.1 browsers limit connections per domain (usually 6), and one SSE connection takes one of them, so many tabs on the same site compete for slots. HTTP/2 multiplexes streams over one connection with a much higher limit, so the problem mostly goes away.

## How to choose

1. Data only goes from server to frontend (notifications, progress bars, live boards) → **SSE**.
2. Both sides send data often (chat, games, collaboration) → **WebSocket**.
3. Updates are infrequent, the environment is restricted, or delay is acceptable → **Short Polling**.
4. It must arrive even when the page is closed → **Web Push**.

## What I learned

When choosing a technology, asking "which way does the data travel?" helps more than asking "which one is stronger?" WebSocket can do more, but when you do not need the extra, it is just more to maintain.

Also, real-time push only makes users see things sooner. The data still has to be stored first. Saving the notification to the database means a failed push or a dropped connection loses nothing, and I think that is the most important step in this design.

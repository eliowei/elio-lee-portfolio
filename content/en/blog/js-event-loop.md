---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: Understanding the JavaScript Event Loop, Async Code and Scope
description: Practical lessons on the event loop, the Promise microtask queue and closures, building a clear mental model of how code actually runs.
date: 2025-03-20
category: js
tags: [Event Loop, Promise, Closure]
readingTime: 8
---

In the browser, JavaScript is single-threaded: only one piece of code runs on the call stack at a time. Asynchronous code doesn't "run at the same time"; work is queued and taken out one item at a time, by fixed rules, once the stack is empty. Understanding those rules explains most "why isn't the order what I expected" problems.

## The basic model of the event loop

One turn of the loop goes roughly like this:

1. Take one task from the task queue (macrotask queue) and run it, for example the whole script, a `setTimeout` callback or a user event.
2. When that task finishes, **drain the entire microtask queue**, for example `Promise.then` and `queueMicrotask`.
3. The browser renders if needed.
4. Go back to step 1 and take the next task.

Step 2 is the key: microtasks all run before the next task, so they always come earlier than `setTimeout(fn, 0)`.

```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
queueMicrotask(() => console.log('4'))
console.log('5')

// Output order: 1 5 3 4 2
```

The synchronous `1` and `5` run first; then the microtasks `3` and `4` are drained; only then does `2` in the task queue get its turn.

## async / await is just Promise syntax

Code after an `await` is equivalent to a callback inside `.then()`, which means it is a microtask.

```js
async function run() {
  console.log('a')
  await null
  console.log('b') // microtask: runs after the current synchronous code finishes
}

run()
console.log('c')
// a c b
```

## Common problem 1: race conditions

When a user types several search terms in a row, an earlier request may come back later and overwrite new data with old. The fix is to cancel the old request before sending a new one:

```js
let controller

async function search(query) {
  controller?.abort()
  controller = new AbortController()

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
    render(await res.json())
  }
  catch (err) {
    if (err.name !== 'AbortError') throw err
  }
}
```

Where requests can't be cancelled (for example a third-party SDK), use a request sequence number instead and only accept the result of the latest request.

## Common problem 2: Promise.all vs allSettled

| Method | When one fails | Use when |
| --- | --- | --- |
| `Promise.all` | Rejects immediately and discards the other results | It only makes sense if everything succeeds |
| `Promise.allSettled` | Waits for all of them and reports each success or failure | You still want to show the rest when some fail |

```js
const results = await Promise.allSettled([loadProfile(), loadOrders(), loadCoupons()])
const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value)
```

## Closures and scope

A closure is a function "remembering" the scope it was created in. The classic example is `var` in a loop:

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)) // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)) // 0 1 2
```

`var` is function-scoped, so all three callbacks share the same `i`; `let` is block-scoped, so each iteration has its own `i`.

Closures also keep the objects they reference from ever being garbage collected. Common sources of hidden leaks are event listeners that are never removed, timers that are never cleared, and long-lived objects holding references to large data. Remember to clean them up when a component is destroyed:

```js
const onResize = () => { /* ... */ }
window.addEventListener('resize', onResize)

// When the component unmounts
window.removeEventListener('resize', onResize)
```

## Summary

- Microtasks all run before the next task, so `Promise.then` comes before `setTimeout(fn, 0)`.
- Code after `await` is a microtask.
- When handling async UI, think about both failure and stale results: cancel old requests, or only accept the latest result.
- Use `let` / `const` instead of `var`, and release listeners and timers when a component unmounts.

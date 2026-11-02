---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: JavaScript 事件循環、非同步與作用域理解
description: 梳理 Event Loop、Promise 微任務隊列與閉包機制的實務踩坑心得，建立清晰的底層執行模型。
date: 2026-10-29
category: js
tags: [Event Loop, Promise, Closure]
readingTime: 8
---

JavaScript 在瀏覽器裡是單執行緒：同一時間只有一段程式碼在呼叫堆疊（call stack）上執行。非同步並不是「同時執行」，而是把工作排進佇列，等堆疊清空後再依規則一個一個取出來。看懂這套規則，就能解釋大部分「為什麼順序跟我想的不一樣」的問題。

## 事件循環的基本模型

一次循環大致是這樣：

1. 從任務佇列（macrotask queue）取出一個任務執行，例如整段 script、`setTimeout` 的回呼、使用者事件。
2. 這個任務結束後，**清空整個微任務佇列**（microtask queue），例如 `Promise.then`、`queueMicrotask`。
3. 瀏覽器視情況進行渲染。
4. 回到第 1 步，取下一個任務。

重點是第 2 步：微任務會在「下一個任務之前」全部執行完，所以它永遠比 `setTimeout(fn, 0)` 更早。

```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
queueMicrotask(() => console.log('4'))
console.log('5')

// 輸出順序：1 5 3 4 2
```

同步的 `1`、`5` 先跑完；接著清空微任務 `3`、`4`；最後才輪到任務佇列裡的 `2`。

## async / await 只是 Promise 的語法

`await` 之後的程式碼，等於放進 `.then()` 的回呼，也就是微任務。

```js
async function run() {
  console.log('a')
  await null
  console.log('b') // 微任務：等目前同步程式碼結束後才執行
}

run()
console.log('c')
// a c b
```

## 常見問題一：Race Condition

使用者連續輸入搜尋字，較早送出的請求可能比較晚才回來，結果用舊資料蓋掉新資料。處理方式是在送出新請求前先取消舊的：

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

不能取消的情境（例如第三方 SDK），可以改用「請求序號」：只接受最新一次請求的結果。

## 常見問題二：Promise.all 與 allSettled

| 方法 | 其中一個失敗時 | 適合情境 |
| --- | --- | --- |
| `Promise.all` | 立刻 reject，丟掉其他結果 | 全部成功才有意義 |
| `Promise.allSettled` | 等全部結束，逐一回報成功或失敗 | 部分失敗仍要顯示其他資料 |

```js
const results = await Promise.allSettled([loadProfile(), loadOrders(), loadCoupons()])
const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value)
```

## 閉包與作用域

閉包是函式「記住」它被建立時所在的作用域。經典例子是迴圈裡的 `var`：

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)) // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)) // 0 1 2
```

`var` 是函式作用域，三個回呼共用同一個 `i`；`let` 是區塊作用域，每一圈都有自己的 `i`。

閉包也會讓被參考的物件一直無法被回收。常見的隱性洩漏來源有：忘記移除的事件監聽、未清除的計時器，以及長期存活的物件持有大型資料的參考。元件銷毀時記得清理它們：

```js
const onResize = () => { /* ... */ }
window.addEventListener('resize', onResize)

// 元件卸載時
window.removeEventListener('resize', onResize)
```

## 小結

- 微任務在下一個任務之前全部執行完，所以 `Promise.then` 早於 `setTimeout(fn, 0)`。
- `await` 之後的程式碼是微任務。
- 處理非同步 UI 時，要同時想「失敗」與「過期的結果」：取消舊請求，或只接受最新結果。
- 用 `let` / `const` 取代 `var`，並在元件卸載時釋放監聽與計時器。

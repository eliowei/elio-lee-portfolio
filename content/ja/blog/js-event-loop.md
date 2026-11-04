---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: JavaScript のイベントループ、非同期処理、スコープを理解する
description: Event Loop、Promise のマイクロタスクキュー、クロージャの仕組みについて、実務でつまずいた点を整理し、内部の実行モデルを明確にします。
date: 2025-03-20
category: js
tags: [Event Loop, Promise, Closure]
readingTime: 8
---

ブラウザの JavaScript はシングルスレッドです。同時にコールスタック（call stack）上で実行されるコードは 1 つだけです。非同期とは「同時に実行する」ことではなく、作業をキューに並べ、スタックが空になってから決まったルールで 1 つずつ取り出すことです。このルールがわかれば、「なぜ思っていた順番と違うのか」という問題の大半を説明できます。

## イベントループの基本モデル

1 回のループはおおよそ次のとおりです：

1. タスクキュー（macrotask queue）からタスクを 1 つ取り出して実行する。たとえばスクリプト全体、`setTimeout` のコールバック、ユーザーのイベント。
2. そのタスクが終わったら、**マイクロタスクキュー（microtask queue）を空になるまで処理する**。たとえば `Promise.then`、`queueMicrotask`。
3. 必要に応じてブラウザが描画する。
4. ステップ 1 に戻り、次のタスクを取り出す。

重要なのはステップ 2 です。マイクロタスクは「次のタスクの前に」すべて実行されるので、常に `setTimeout(fn, 0)` より先に実行されます。

```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
queueMicrotask(() => console.log('4'))
console.log('5')

// 出力順：1 5 3 4 2
```

同期処理の `1`、`5` が先に実行され、次にマイクロタスクの `3`、`4` が処理され、最後にタスクキューの `2` の番になります。

## async / await は Promise の構文にすぎない

`await` 以降のコードは `.then()` のコールバックに入れたのと同じで、つまりマイクロタスクです。

```js
async function run() {
  console.log('a')
  await null
  console.log('b') // マイクロタスク：現在の同期コードが終わってから実行される
}

run()
console.log('c')
// a c b
```

## よくある問題 1：Race Condition

ユーザーが検索語を続けて入力すると、先に送ったリクエストのほうが後から返ってきて、古いデータで新しいデータを上書きしてしまうことがあります。対処法は、新しいリクエストを送る前に古いものをキャンセルすることです：

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

キャンセルできない場面（サードパーティの SDK など）では、「リクエスト番号」を使い、最新のリクエストの結果だけを受け入れるようにします。

## よくある問題 2：Promise.all と allSettled

| メソッド | 1 つが失敗したとき | 向いている場面 |
| --- | --- | --- |
| `Promise.all` | すぐに reject し、ほかの結果は捨てられる | すべて成功してはじめて意味がある |
| `Promise.allSettled` | すべての完了を待ち、それぞれの成功・失敗を返す | 一部が失敗してもほかのデータは表示したい |

```js
const results = await Promise.allSettled([loadProfile(), loadOrders(), loadCoupons()])
const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value)
```

## クロージャとスコープ

クロージャとは、関数が作られたときのスコープを「覚えている」ことです。典型的な例がループ内の `var` です：

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)) // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)) // 0 1 2
```

`var` は関数スコープなので、3 つのコールバックが同じ `i` を共有します。`let` はブロックスコープなので、ループの各回が自分の `i` を持ちます。

クロージャは、参照しているオブジェクトがいつまでも回収されない原因にもなります。気づきにくいリークのよくある原因は、解除し忘れたイベントリスナー、クリアしていないタイマー、そして長く生き続けるオブジェクトが大きなデータへの参照を持ち続けることです。コンポーネントを破棄するときは忘れずに片付けます：

```js
const onResize = () => { /* ... */ }
window.addEventListener('resize', onResize)

// コンポーネントのアンマウント時
window.removeEventListener('resize', onResize)
```

## まとめ

- マイクロタスクは次のタスクの前にすべて実行されるので、`Promise.then` は `setTimeout(fn, 0)` より先になる。
- `await` 以降のコードはマイクロタスク。
- 非同期の UI を扱うときは、「失敗」と「古くなった結果」の両方を考える。古いリクエストをキャンセルするか、最新の結果だけを受け入れる。
- `var` の代わりに `let` / `const` を使い、コンポーネントのアンマウント時にリスナーとタイマーを解放する。

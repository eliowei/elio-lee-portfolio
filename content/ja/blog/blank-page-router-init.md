---
title: 画面が真っ白に：404 ルート、初期化 API、二重ログイン
description: 管理システムがいくつかの状況で真っ白な画面になっていました。404 ルートの追加、初期化 API の読み込み方の見直し、二重ログインとパスワード期限切れのフローへの対応を記録します。
date: 2026-03-18
category: case
tags: [Vue Router, Promise, Error Handling]
readingTime: 6
---

真っ白な画面は、もっともつらいエラーのひとつです。メッセージもボタンもなく、ユーザーはリロードするしかありません。Vue 2 の管理システムを保守していたとき、真っ白な画面になるいくつかの状況をまとめて対応しました。

## ケース 1：存在しないルートに入る

間違った URL を入力すると、ページは枠だけで、中身がまったく表示されませんでした。

理由は単純です。Vue Router は対応するルートが見つからなくてもエラーを出さず、`<router-view>` が何も描画しないだけです。Vue Router 3 では、ワイルドカードのルートを自分で追加する必要があります：

```js
export function abort(code = 404) {
  return {
    name: 'FourOhFour',
    path: '*',
    component: () => error(code),
  }
}
```

`*` はすべてのパスにマッチするので、必ずルート一覧の最後に置く必要があります。このプロジェクトでは、初期化が終わったあとに `addRoute` で登録しています：

```js
router.addRoute(abort())
```

## ケース 2：初期化 API

システムに入るときにいくつかの基本データを読み込みますが、もともとは 1 本ずつ待っていました：

```js
async function getData() {
  await store.dispatch('getFormatInGroups')
  await store.dispatch('setCityLists')
  await store.dispatch('setPaymentType')
  await checkLogin()
  await getUserRoles()
}
```

これには 2 つの問題があります：

- **直列**：合計時間がすべての API の時間の合計になる。
- **エラー処理がない**：どれか 1 本が失敗すると、それ以降は実行されず、誰もエラーを受け止めない。

これらのデータは互いに独立していて、前の API の完了を待つ必要がないので、並列にしてエラー処理を加えました：

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

### Promise.all に変えるときの注意点

`Promise.all` は `await` を置き換えれば済むわけではありません：

- **依存関係があるものは並列にできない。** B が A の結果を使うなら、順番を守る必要があります。
- **1 本でも失敗すると `catch` に入り**、成功したほかの結果も受け取れません。

一部が失敗してもほかのデータを使えるようにしたいなら、`Promise.allSettled` にします：

```js
const results = await Promise.allSettled(tasks)
const failed = results.filter(r => r.status === 'rejected')
```

上のコードにはもうひとつ改善できる点があります。`addRoute` が `try` の中にあるので、初期化に失敗すると 404 ルートが登録されません。やり直すなら `finally` に移すか、ルーター作成時に登録して、404 が API の影響を受けないようにします。

## ケース 3：二重ログイン

すでにログインしているユーザーがもう一度ログインすると、API は失敗メッセージを返しますが、プログラムはそのケースを処理しておらず、「必要な権限情報がありません」と表示したあと画面が真っ白になっていました。

修正方法は、失敗の原因を区別することです：

```js
if (result.message?.includes('已登入')) {
  alert(result.message)
  await router.push({ name: 'Dashboard' })
} else {
  alert('登入失敗，請稍後再試。')
}
```

メッセージの文字列で判定するのは理想的ではなく、バックエンドが明確なエラーコードを返すほうが安定します。ただバックエンドに手を入れない前提では、これでひとまず問題を解決できます。

## ついでに：パスワードの期限切れ

ログイン時にはパスワードの期限切れに当たることもあります。以前はユーザーがそこで行き詰まるだけだったので、新しいパスワードを設定するダイアログを追加しました。バックエンドが期限切れの状態を返したら開き、更新に成功したら閉じるので、ユーザーはログインのフローから離れずに済みます。

## 今回学んだこと

- 真っ白な画面は、たいていどこかのケースが処理されていないことを意味する。プログラムが壊れているのではなく、フローに終わりがない。
- どのフローも、失敗したときの画面を考える。ページが見つからない、API の失敗、想定外の状態。
- 直列を並列に変える前に、データ間の依存関係を確認する。
- エラーを `catch` で受け止めるのは第一歩にすぎない。ユーザーに結果が見えるようにする必要がある。

---
title: JWT をどこに保存するか：localStorage から Cookie + CSRF Token へ
description: JWT を localStorage に保存する場合と HttpOnly Cookie に保存する場合の違いを比べ、XSS と CSRF のリスクを説明し、実際のプロジェクトで Cookie と CSRF Token に切り替えた方法とつまずいた点を記録します。
date: 2026-09-30
category: quality
tags: [JWT, CSRF, XSS]
readingTime: 9
---

最初のフルスタックのプロジェクト「ゲーム仲間募集プラットフォーム」では、JWT を Pinia に保存し、localStorage に永続化していました。リクエストのたびに `Authorization` ヘッダーに入れるだけの簡単なやり方です。当時は権限まわりの理解がまだ浅く、深く考えていませんでした。

その後 LINE 公式アカウント管理プラットフォームを作ったときは、管理画面で複数の店舗の内容やアカウントの権限を管理できるため、ログインの認証情報が盗まれたときの影響がずっと大きくなります。そこで HttpOnly Cookie と CSRF Token に切り替えました。この記事では、2 つのやり方のリスクと、実装中にぶつかった問題をまとめます。

## JWT + localStorage のリスク：XSS

localStorage の利点は簡単なことで、欠点は**ページ上で実行されるどんな JavaScript からも読み取れる**ことです。

XSS（クロスサイトスクリプティング）とは、攻撃者が自分のスクリプトをあなたのサイト上で実行させることです。たとえば適切に処理されていないユーザーの入力や、悪意のあるコードが仕込まれたサードパーティのパッケージを通じて起こります。いったん起きれば、トークンを盗むのは 1 行で済みます：

```js
const token = localStorage.getItem('token')
```

攻撃者はトークンを自分のサーバーに送れば、トークンの期限が切れるまで別の場所でユーザーになりすませます。JWT は通常ステートレスなので、発行後にサーバー側で早めに無効化するのは難しく、有効期間が長いほどリスクも高くなります。

## HttpOnly Cookie に移す

`HttpOnly` を付けた Cookie は JavaScript から読み取れず、ブラウザがリクエスト時に自動で送ります：

```js
export const accessTokenCookieConfig = {
  httpOnly: true, // JavaScript から読み取れない
  secure: process.env.NODE_ENV === 'production', // HTTPS のみ
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
}
```

フロントエンドの axios では `withCredentials: true` を有効にしないと、クロスオリジンのリクエストに Cookie が付きません。

これで XSS でトークンを盗まれることはなくなります。しかし「ブラウザが自動で送る」という性質が、別の問題を生みます。

## Cookie のリスク：CSRF

CSRF（クロスサイトリクエストフォージェリ）とは、ユーザーがあなたのサイトにログインしたまま悪意のあるサイトを閲覧すると、そのサイトがこっそりあなたの API にリクエストを送ることです。Cookie は自動で送られるので、サーバーはユーザー本人の操作だと思い込みます。

攻撃者は Cookie を読み取る必要はなく、ブラウザに送らせるだけでよいのです。

`SameSite` で大半のケースは防げますが、私の Cookie は本番環境で `SameSite=None` に設定していて、この設定はクロスサイトのリクエストを制限しないので、CSRF Token も必要になります。

## Safari：フロントエンドとバックエンドは同じドメインに置く

この問題はスマートフォンでテストしてはじめて気づきました。フロントエンドとバックエンドがまったく別のドメインにある場合、たとえばフロントエンドが `xxx.pages.dev`、API が `xxx.onrender.com` にある場合、ブラウザにとってはサードパーティ Cookie になります。

Safari はデフォルトでサードパーティ Cookie をブロックし、`SameSite=None; Secure` を設定していても同じです。その結果、ログイン API は成功を返すのに Cookie は保存されず、ずっと未ログインの状態でした。

そこでドメインを変更し、フロントエンドとバックエンドを同じメインドメイン、たとえば `admin.example.com` と `api.example.com` にしました。これで Cookie はサードパーティ扱いでなくなり、Safari でも正常に動作するようになりました。

## CSRF Token の仕組み

ログイン時にバックエンドがランダムな値を生成し、**フロントエンドが取得できる**場所に置きます。以降、データを変更するリクエストのたびに、それを独自のヘッダーに入れて送る必要があります：

```js
// フロントエンド：すべてのリクエストに CSRF Token を付ける
api.interceptors.request.use((config) => {
  if (authStore.csrfToken) {
    config.headers['x-csrf-token'] = authStore.csrfToken
  }
  return config
})
```

バックエンドは Cookie とヘッダーの値が一致するかを比較します：

```js
const a = Buffer.from(String(req.cookies.csrf_token))
const b = Buffer.from(String(req.headers['x-csrf-token']))

if (a.length !== b.length || !timingSafeEqual(a, b)) {
  return res.status(403).json({ success: false, message: 'CSRF invalid' })
}
```

悪意のあるサイトはブラウザに Cookie を送らせることはできても、トークンを読み取れないので、独自のヘッダーに書き込むことはできません。ここでは `timingSafeEqual` で比較し、応答時間から内容を推測されないようにしています。

## Access Token と Refresh Token

Access Token は 15 分に設定しているので、たとえ漏れても影響する時間は短くなります。ユーザーに何度もログインし直させないよう、7 日間の Refresh Token と組み合わせています。

Refresh Token にはいくつか追加の対策をしました：

- **データベースには SHA-256 のハッシュだけを保存する**：最初は平文で保存していて、あとから変えました。データベースが漏れても、使えるトークンは手に入りません。
- **更新のたびにローテーションする**：古い Refresh Token は一度使うと無効になります。
- **同時ログインの数を制限する**：上限を超えたら最も古いものを削除します。

JWT を早めに無効化できない問題も、これで緩和されます。データベースの Refresh Token を削除すれば、ユーザーは最長でも 15 分後には再ログインが必要になります。

## つまずいた点：複数のリクエストが同時に 401 になる

ページは通常、複数の API を同時に呼び出します。Access Token の期限が切れると、それらのリクエストが同時に 401 を受け取り、同時に `/refresh` を呼び出します。

Refresh Token は毎回ローテーションされるので、最初の 1 本が成功すると、ほかのリクエストが持っているのは古いトークンになって拒否されます。それがログアウトを引き起こして CSRF Token まで消してしまい、以降のリクエストがすべて失敗していました。

解決策は、同時に 1 回だけ refresh を行い、ほかのリクエストはその結果を共有することです：

```js
let refreshPromise = null

refreshPromise ??= authApi.post('/refresh').finally(() => {
  refreshPromise = null
})
const { data } = await refreshPromise
```

もうひとつの落とし穴は複数タブでした。ログインのたびに新しい CSRF Token を生成すると、ほかのタブが持っている値と合わなくなるので、すでにある場合はそれを使い続けるように変えました。

## これで安全になったのか

絶対に安全なやり方はありません。HttpOnly Cookie はトークンを盗まれなくするだけで、サイトに本当に XSS の穴があれば、攻撃者はページ上から直接リクエストを送れてしまいます。入力の処理や依存パッケージの管理といった基本は、やはり欠かせません。

| やり方 | 主なリスク | 必要な対策 |
|---|---|---|
| JWT + localStorage | XSS でトークンが盗まれる | XSS の防止、有効期間の短縮 |
| JWT + HttpOnly Cookie | CSRF | SameSite、CSRF Token |
| さらに Refresh Token の仕組みを加える | 実装が複雑になる | ローテーション、ハッシュでの保存、並行処理への対応 |

## 今回学んだこと

- 最良の保存場所はなく、リスクが違うだけ。localStorage は XSS を防げず、Cookie は CSRF に対処する必要がある。
- 募集プラットフォームを作ったときは権限まわりの理解がまだ浅く、そのプロジェクトも直していない。のちに複数店舗のデータを管理する管理画面を作ってはじめて、認証情報が盗まれたときの影響を本気で考えるようになった。
- パソコンだけでテストするのでは足りない。この問題はスマートフォンで実際に試してはじめて見つかった。Cookie のような挙動は Safari でもあわせてテストする必要がある。
- 仕組みが増えるほど境界ケースも増える。本当に時間がかかったのは Cookie を追加することではなく、並行処理と複数タブへの対応だった。

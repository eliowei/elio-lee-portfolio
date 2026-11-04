---
title: Nuxt サイトに GTM と GA4 を導入する：スクリプトの読み込みからカスタムイベントまで
description: 個人ブランドサイトに Google Tag Manager と GA4 を導入した方法を記録します。Cookie の同意後にだけ読み込む仕組み、GA4 の二重計測の回避、dataLayer を使ったプロジェクト閲覧とお問い合わせの計測を含みます。
date: 2026-07-30
updated: 2026-11-04
category: case
tags: [GTM, GA4, Nuxt]
readingTime: 6
---

個人ブランドサイトを作っていたとき、訪問者がどの作品を見たのか、お問い合わせをクリックしたのかを知りたくて、Google Tag Manager（GTM）と Google Analytics 4（GA4）を導入しました。最初はこの 2 つのツールの違いがよくわからず、実際にやってみてようやく理解できました。

## GTM と GA4 の違い

| ツール | 担当すること |
|---|---|
| GA4 | ページビューやイベントなどのデータを収集・分析する |
| GTM | サイト上の計測コードを管理し、いつ発火するかを決める |

簡単に言えば、GA4 はレポートを見る場所で、GTM はコードを置く場所です。サイトで GTM を読み込んでおけば、その後の計測の追加や調整はほとんど GTM の管理画面で行え、毎回コードを変える必要はありません。

サイトと GTM は `dataLayer` を通じてやり取りします。サイトがイベントを送り込み、GTM が設定に従って GA4 に送ります。

## Nuxt のモジュールで読み込み、タイミングは自分で決める

Nuxt にはサードパーティのスクリプトを管理できる公式モジュール `@nuxt/scripts` があるので、最初はそれで GA4 を直接接続しました：

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  useScriptGoogleAnalytics({ id: 'G-XXXXXXXXXX' })
})
```

その後、GTM で計測を管理するために `useScriptGoogleTagManager` に切り替え、モジュールが提供する `proxy.dataLayer` でイベントを送るようにしました。

ところが公開後、データがまったく取れませんでした。カスタムイベントを待たせるわけにはいかないので、いったんモジュールをやめ、`dataLayer` を自分で作って GTM のスクリプトを動的に挿入したところ、ようやくデータが入るようになりました。

あとでドキュメントを調べて、原因はモジュールではなかったとわかりました。`@nuxt/scripts` v1 では `trigger` を指定しないとスクリプトが自動で挿入されない仕様に変わっていて、私はそれを書いていなかったのです。

原因がわかったので、モジュールに戻して `trigger: 'manual'` を明示し、読み込むタイミングを自分で決めるようにしました：

```ts
const gtm = useScriptGoogleTagManager({
  id: gtmId,
  scriptOptions: { trigger: 'manual' },
})

// 訪問者が同意してから呼ぶ
gtm.load()
```

`manual` は、`load()` を呼ぶまで何もリクエストしないという意味です。次の節の要件にそのまま合い、重複読み込みやサーバーサイドレンダリングの問題を自分で処理する必要もありません。

## GA4 は GTM に任せ、サイトでは読み込まない

GTM コンテナにはすでに GA4 の Google タグが入っています。サイト側でも gtag.js を読み込むと、訪問のたびに 2 回カウントされてしまいます。そこで GA4 の読み込みをコードから外し、サイトは GTM だけを読み込み、GA4 は完全に GTM の管理画面で管理するようにしました。

作業の中で最も見落としやすかった点です。どちらからでも GA4 は読み込めますが、読み込むのは片方だけにします。

## Cookie の同意：同意がなければ読み込まず、イベントも送らない

訪問者の行動を計測する前に同意が必要な場合があるので、Cookie のバナーと `useConsent` composable を作り、選択を `localStorage` に保存しました：

```ts
const decide = (next: 'granted' | 'denied') => {
  localStorage.setItem('cookie-consent', next)
  if (next === 'granted') nuxtApp.$analytics.load()
  else nuxtApp.$analytics.stop()
}
```

- 同意した場合：`load()` で GTM を読み込みます。次回以降は、ページ読み込み時に保存済みの選択を読み取り、`granted` なら自動で読み込みます。
- 拒否または撤回した場合：`stop()` が GA 公式のオプトアウト用スイッチ `ga-disable-<GA4 ID>` を設定し、すでに書き込まれた `_ga` Cookie を削除します。
- 気が変わった場合：フッターに「Cookie 設定」があり、いつでもバナーを開き直せます。

## カスタムイベント：計測を 1 か所にまとめる

ページビューだけでは「訪問者が何に興味を持っているか」はわからないので、カスタムイベントを別に定義し、送信のロジックを `useAnalytics` にまとめました：

```ts
function track(event: AnalyticsEvent, params: Record<string, string | number> = {}) {
  if (!import.meta.client) return
  // 同意がなければ送らない
  if (localStorage.getItem(CONSENT_KEY) !== 'granted') return
  window.dataLayer ||= []
  window.dataLayer.push({ event, locale: locale.value, ...params })
}
```

コンポーネントは `track('project_view', { project_slug })` を呼ぶだけでよく、`dataLayer` の形式を知る必要はありません。ポイントは 2 つあります。

- `AnalyticsEvent` は有効なイベント名をすべて列挙した型なので、打ち間違えるとエディタが教えてくれ、同じことに 2 つの名前が付くこともありません。
- すべてのイベントに現在の言語 `locale` が自動で付くので、あとから GA4 で言語別に見られます。イベントのパラメータには、氏名・メールアドレス・メッセージ本文などの個人情報は入れません。

計測している主なイベントは次のとおりです：

| イベント | 知りたいこと |
|---|---|
| `project_view` | 訪問者がどのプロジェクトを見たか |
| `project_demo_click` | 誰がデモをクリックしたか |
| `project_github_click` | 誰がプロジェクトの GitHub をクリックしたか |
| `note_click` | ホームや一覧からどの記事がクリックされたか |
| `note_read` | どの記事が 75% まで読まれたか（実際にスクロールした場合のみ） |
| `note_search` | 訪問者が何を検索したか |
| `contact_click` | どこからお問い合わせをクリックしたか（ナビゲーションバーやフッターなど） |
| `contact_form_open` | お問い合わせフォームが開かれたか |
| `contact_submit` / `contact_submit_error` | フォームの送信が成功したか、失敗したか |
| `social_click` | どの SNS のリンクをクリックしたか |
| `language_change` | どの言語からどの言語に切り替えたか |

イベントを `dataLayer` に送ったあと、GTM の管理画面で対応する「カスタムイベント」トリガーと GA4 のイベントタグを作らないと、データは GA4 に届きません。フロントエンドを書くだけでは足りないのです。

なお、GTM の「カスタムイベント」トリガーは `dataLayer` 内の `event` 名で照合するため、イベントは `dataLayer.push` で送る必要があります。`gtag('event', ...)` では一致しません。

## 今回学んだこと

- まずどんな問いに答えたいのかを明確にしてから、何を計測するかを決める。イベントは多ければよいわけではない。
- データが入らないときは、まずツールのバージョン変更を調べる。モジュールが使えないと思いかけたが、足りなかったのは設定 1 つだけだった。
- GA4 は片方からだけ読み込む。GTM とサイトの両方で読み込むと二重にカウントされる。
- 同意の仕組みは、スクリプトの読み込みとイベントの送信の両方を管理する必要がある。撤回したときは、すでに書き込んだ Cookie も削除する。
- 計測のロジックを composable にまとめると、コンポーネントがずっとすっきりし、あとで名前を変えたり調整したりするときも 1 か所を直すだけで済む。

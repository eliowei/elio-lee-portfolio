---
title: Nuxt サイトに GTM と GA4 を導入する：スクリプトの読み込みからカスタムイベントまで
description: 個人ブランドサイトに Google Tag Manager と GA4 を導入した方法を記録します。読み込みの遅延、Cookie の同意の仕組み、dataLayer を使ったプロジェクト閲覧とお問い合わせの計測を含みます。
date: 2026-07-30
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

## まず Nuxt のモジュールを試し、のちに自分で読み込む方式へ

最初に、Nuxt にはサードパーティのスクリプトを管理できる公式モジュール `@nuxt/scripts` があると知り、それで GA4 を接続しました：

```ts
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  useScriptGoogleAnalytics({ id: 'G-XXXXXXXXXX' })
})
```

その後、GTM で計測を管理するために `useScriptGoogleTagManager` に切り替え、設定を `nuxt.config.ts` に移して、モジュールが提供する `proxy.dataLayer` でイベントを送るようにしました：

```ts
const { proxy } = useScriptGoogleTagManager()
proxy.dataLayer?.push({ event, ...params })
```

ところが公開後、データがまったく取れませんでした。カスタムイベントを待たせるわけにはいかないので、モジュールの設定をいったん外し、GTM の JS を直接読み込んで、イベントも `window.dataLayer` に直接送るようにしたところ、ようやくデータが入るようになりました。

あとでドキュメントを調べて、`@nuxt/scripts` v1 で挙動が変わっていたことがわかりました。registry に `trigger` が設定されていないとスクリプトは自動で挿入されず、当時の私の設定にはちょうどそれが書かれていなかったのです。

この方法の利点は、流れがすべて目に見え、あとで読み込みのタイミングを制御するのも簡単なことです。その代わり、重複読み込みやサーバーサイドレンダリングの問題は自分で処理する必要があります。

## GTM の読み込み：初期表示を遅くしない

GTM のスクリプトはサイトの機能に影響しないので、ブラウザがアイドル状態になってから読み込むようにしました：

```ts
onMounted(() => {
  const run = () => initializeAnalytics()

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 3000 })
  } else {
    setTimeout(run, 1000)
  }
})
```

`requestIdleCallback` はメインスレッドが空くのを待ってから実行し、`timeout` はいつまでも待ち続けないことを保証します。対応していないブラウザでは 1 秒遅らせます。

実際の読み込みでは、`dataLayer` を作成してスクリプトを動的に挿入します。Nuxt はサーバー側でレンダリングし、`window` と `document` はブラウザにしか存在しないので、まず環境を判定します：

```ts
const loadGTM = () => {
  if (!import.meta.client || document.getElementById('gtm-script')) return

  const { public: { gtmId } } = useRuntimeConfig()

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  document.head.appendChild(script)
}
```

固定の `id` で確認することで、重複して読み込むのを防げます。

## Cookie の同意：選択を保存する

訪問者の行動を計測する前に同意が必要な場合があるので、Cookie のバナーと `useConsent` composable を作り、訪問者の選択を `localStorage` に保存して、同意を得てから GTM を読み込むようにしました：

```ts
const accept = () => {
  localStorage.setItem('cookie-consent', JSON.stringify({ analytics: true }))
  loadGTM()
}

const reject = () => {
  localStorage.setItem('cookie-consent', JSON.stringify({ analytics: false }))
}
```

バナーを有効にするかどうかを決めるスイッチも加えたので、あとで調整するときに流れを変える必要はありません。

## カスタムイベント：計測を 1 か所にまとめる

ページビューだけでは「訪問者が何に興味を持っているか」はわからないので、カスタムイベントを別に定義し、送信のロジックを `useAnalytics` にまとめました：

```ts
export const useAnalytics = () => {
  const push = (event: string, params: Record<string, unknown> = {}) => {
    if (!import.meta.client) return
    window.dataLayer?.push({ event, ...params })
  }

  const trackProjectView = (project: { id: string; title: string }) =>
    push('project_view', { project_id: project.id, project_name: project.title })

  return { trackProjectView }
}
```

コンポーネントは `trackProjectView(project)` を呼ぶだけでよく、`dataLayer` の形式を知る必要はありません。イベント名も 1 か所にまとまるので、同じことに 2 つの名前が付くこともありません。

計測している主なイベントは次のとおりです：

| イベント | 知りたいこと |
|---|---|
| `project_view` | 訪問者がどのプロジェクトを見たか |
| `project_demo_click` | 誰がデモをクリックしたか |
| `project_github_click` | 誰が GitHub をクリックしたか |
| `contact_click` | どこからお問い合わせをクリックしたか（ナビゲーションバーやフッターなど） |
| `contact_submit` | 誰がお問い合わせフォームを送信したか |
| `social_click` | どの SNS のリンクをクリックしたか |

イベントを `dataLayer` に送ったあと、GTM の管理画面で対応するトリガーと GA4 のイベントタグを作らないと、データは GA4 に届きません。フロントエンドを書くだけでは足りないのです。

## 今回学んだこと

- まずどんな問いに答えたいのかを明確にしてから、何を計測するかを決める。イベントは多ければよいわけではない。
- サードパーティのスクリプトもパフォーマンスの一部。遅らせられるなら遅らせる。
- 計測のロジックを composable にまとめると、コンポーネントがずっとすっきりし、あとで名前を変えたり調整したりするときも 1 か所を直すだけで済む。

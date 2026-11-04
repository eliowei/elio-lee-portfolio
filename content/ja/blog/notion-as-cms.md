---
title: Notion API を CMS として使う：東京旅行サイトの実装記録
description: 9 月の東京旅行のために Nuxt 4 で旅程サイトを作り、Notion をコンテンツの管理画面として使い、サーバールート、transformer、キャッシュで Notion のデータ構造を切り離しました。
date: 2026-09-11
category: case
tags: [Notion API, CMS, Nuxt]
readingTime: 10
---

9 月の東京への個人旅行のために、Nuxt 4 で旅程サイトを作り、出かけている間もスマートフォンでそのまま確認できるようにしました。旅程、持ち物リスト、買い物リスト、チケットといった内容は何度も変わるので、管理画面を別に作るのではなく、Notion を CMS として使うことにしました。内容はすべて Notion で編集し、サイトは読み込みと表示だけを担当します。

## なぜ Notion を選んだのか

旅程はもともと表で管理するのに向いていて、日付、順番、地域、交通手段はどれもフィールドです。Notion のデータベースはそのまま管理画面として使え、スマートフォンでも編集できるので、ログイン、フォーム、データベースを自分で作る必要がありません。

全体の流れはこうです：

```text
Notion データベース → Nuxt サーバールート → transformer → フロントエンドのページ
```

## API キーはサーバーにだけ置く

Notion API にはキーが必要なので、ブラウザから直接呼ぶことはできません。キーを `runtimeConfig` の非公開部分に置き、サーバー側で共通のクライアントを作りました：

```ts
// server/utils/notion.ts
import { Client } from '@notionhq/client'

const config = useRuntimeConfig()

export const notion = new Client({
  auth: config.notionApiKey,
})
```

フロントエンドは自分の `/api/notion/*` ルートを呼ぶだけで、キーは見えず、Notion に直接触れることもありません。

## transformer で Notion のデータ構造を切り離す

Notion が返すデータは入れ子が深く、たとえばタイトルを 1 つ読むのに `page.properties[key].title[0].plain_text` と書く必要があります。フロントエンドがそれを直接使うと、Notion の構造があらゆるコンポーネントに散らばってしまいます。

そこでまず、空の値を処理する取得関数をいくつか書きました：

```ts
export function getTitle(page: any, key: string) {
  return page.properties[key]?.title?.[0]?.plain_text ?? ''
}

export function getMultiSelect(page: any, key: string) {
  return page.properties[key]?.multi_select?.map((item: any) => item.name) ?? []
}
```

次に transformer で、Notion のページをサイト独自の型に変換します：

```ts
export function transformItinerary(page: any): Itinerary {
  return {
    id: page.id,
    title: getTitle(page, 'Trip Name'),
    date: getDate(page, 'Date'),
    day: getSelect(page, 'Day'),
    order: getNumber(page, 'Order'),
    category: getMultiSelect(page, 'Category'),
    // ...
  }
}
```

こうすればフロントエンドが知っているのは `Itinerary` だけです。Notion のフィールド名が変わっても、直すのは transformer の 1 か所だけで済みます。

## キャッシュ：リクエストのたびに Notion を呼ばない

Notion API の応答は速いとは言えず、リクエストのレート制限もあります。一方で旅程の内容が毎秒変わることはありません。そこで Nitro の `defineCachedEventHandler` でルートを包み、60 秒キャッシュするようにしました：

```ts
export default defineCachedEventHandler(async () => {
  const response = await notion.dataSources.query({
    data_source_id: config.notionDataSourceId,
  })

  return response.results
    .map(transformItinerary)
    .sort((a, b) => a.date !== b.date
      ? a.date.localeCompare(b.date)
      : a.order - b.order)
}, { maxAge: 60 })
```

その代わり、Notion で内容を変えてから反映されるまで最大 1 分かかります。旅程サイトとしてはまったく問題ありません。

## つまずいた点：slug は一意とは限らない

旅程の詳細ページは最初 slug だけで検索していましたが、同じホテルに 2 回泊まると同じ slug のデータが 2 件できることに気づきました。Notion はフィールドの値が一意かどうかをチェックしてくれないので、何日目かでも区別するようにしました：

```ts
const trip = (day ? matches.find(item => item.day === `Day ${day}`) : null)
  ?? matches[0]
```

ルートにクエリパラメーターを付けたら、キャッシュのキーも変える必要があります。そうしないと、別の日でも同じキャッシュを受け取ってしまいます：

```ts
{ maxAge: 60, getKey: event => `${getRouterParam(event, 'slug') ?? ''}:${getQuery(event).day ?? ''}` }
```

これも Notion を CMS として使うときに注意すべき点です。Notion は編集ツールであってデータベースではないので、データの正しさはプログラム側で担保する必要があります。

## 内容を編集しやすいまま保つ

交通手段は複数ステップの説明なので、たくさんのフィールドに分けると編集が面倒になります。そこで Notion ではひとまとまりのプレーンテキストのままにしておき、`#` を見出し、`⏱` を時間として使い、パーサーを書いて構造化データに変換してからフロントエンドで表示するようにしました。

チケットは通常の Notion ページに置き、`blocks.children.list` でタイトル、画像、ファイルを読み込みます。この部分は機密性が高いので、パスワード認証を追加し、通過したあとでなければ読めないようにしています。

## 内容とユーザーの状態を分ける

持ち物リストの項目は Notion から来ますが、「チェック」はユーザーごとの状態なので、Notion に書き戻すべきではありません。そこでチェックの状態と自分で追加した項目は `localStorage` に保存し、表示するときに結合します：

```ts
const items = computed(() =>
  [...(data.value ?? []), ...customItems.value].map(item => ({
    ...item,
    checked: checkedMap.value[item.id] ?? false,
  })),
)
```

## Google Maps との連携

各旅程には Notion で管理している Google Maps のリンクがあり、詳細ページでタップすれば地図を開けます。

ディズニーリゾートの計画では Google Maps JavaScript API を使い、地図上に各アトラクションを示して線でつなぎ、その日の動線がわかるようにしました。マーカーをクリックすると、対応する項目にフォーカスします：

```ts
markers = props.items.map((item, index) => {
  const marker = new g.maps.Marker({ /* 位置とラベル */ })
  marker.addListener('click', () => focusItem(index))
  return marker
})
```

地図のスクリプトは小さくなく、すべてのページで必要なわけでもないので、使うときだけ読み込みます。読み込みの Promise を保持しておくことで、複数の場所から同時に呼ばれても読み込みは 1 回だけになります：

```ts
let loaderPromise: Promise<void> | null = null

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Maps 載入失敗'))
    document.head.appendChild(script)
  })

  return loaderPromise
}
```

## すべてのデータを Notion に置くわけではない：ディズニーのレストランのデータ

東京ディズニーリゾートの計画を立てるとき、各レストランのメニューを直接見たかったのですが、公式サイトには繁体字中国語がなく、1 軒ずつ調べるのも時間がかかります。こうしたデータは量が多いうえにほとんど変わらないので、Notion で手作業で管理するのには向きません。そこでスクレイピングでデータをまとめました。

ブラウザで実行するスクリプトを書き、公式サイトのレストランのページを 1 軒ずつ読み込んで、合計 154 軒、そのうちメニューのある 122 軒、合わせて 1,842 品目をまとめ、GPT で繁体字中国語に翻訳しました。このデータは個人の旅行用で、パスワード認証の内側に置いて公開していません。

レストランごとに 1 つの JSON ファイルとして保存し、原文と繁体字中国語の両方を残し、出典の URL と取得日も記録しています。あとで照合したり更新したりするときの根拠にするためです：

```json
{
  "source": {
    "official_url": "...",
    "retrieved_date": "2026-09-10",
    "language_original": "en"
  },
  "restaurant": {
    "name": {
      "original": "La Taverne de Gaston",
      "zh_tw": "加斯頓餐館"
    }
  }
}
```

### ローカルでは動くのに、Vercel にデプロイするとファイルが見つからない

最初、API は `node:fs` の `readdirSync` と `readFileSync` を `process.cwd()` と組み合わせてこれらの JSON を読み込んでいました。ローカルではまったく問題ないのに、Vercel にデプロイするとファイルが見つかりません。

原因は、実行時に動的にパスを決めるこうした読み込み方は、Vercel の serverless function のバンドラーが静的に追跡できず、これらのファイルがそもそもデプロイ結果に含まれていなかったことです。

解決策は、Nitro の `serverAssets` で JSON をサーバービルドに埋め込み、`useStorage()` で読み込むことでした：

```ts
// nuxt.config.ts
nitro: {
  serverAssets: [{ baseName: 'tdr-menu', dir: 'data/tdr-menu' }],
}

// API ルート
const storage = useStorage('assets:tdr-menu')
const keys = await storage.getKeys(park)
```

ここにはもうひとつ小さな落とし穴があります。`dir` は `server/` からの相対パスで `data/tdr-menu` と書く必要があります。`server/data/tdr-menu` と書くとパスが `server/server/data/tdr-menu` と重なってしまい、やはり見つかりません。

## GPT と Gemini との連携

旅行中はその場で聞きたいことがよく出てくるので、サイトには AI チャットも作りました。これもサーバールートから呼び出すので、キーがフロントエンドに出ることはありません。GPT と Gemini を選べ、画像をアップロードして一緒に質問することもできます。

Gemini が 429（リクエスト過多）を返したときは、自動的に OpenAI で回答するので、ユーザーが自分で切り替える必要はありません：

```ts
try {
  return { message: await askGemini({ history, images }) }
} catch (error: any) {
  if (error.status === 429) {
    return { provider: 'openai', message: await askOpenAI({ history, images }) }
  }
  throw error
}
```

## 現時点での制約

- クエリはページネーションに対応していません。Notion は 1 回のクエリで最大 100 件しか返さないので、それを超えたら `next_cursor` で続きを読む必要があります。
- Notion のフィールドは名前で値を取っているので、誰かが管理画面でフィールド名を変えると、エラーにならないままデータが空になります。

## 今回学んだこと

- すべてのプロジェクトに独自の管理画面が必要なわけではない。まず、誰が内容を管理し、どのくらいの頻度で更新するのかを考える。
- サードパーティのデータは境界で自分の型に変換し、外部の構造をコンポーネントに染み込ませない。
- キャッシュのキーには、結果に影響するすべてのパラメーターを含める。

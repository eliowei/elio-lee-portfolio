---
title: Nuxt Content で独自の Markdown 構文パーサーと AST マイクロコンポーネントを作る
description: remark プラグインで抽象構文木を捕捉し、独自タグをインタラクティブな Vue コンポーネントに変換します。
date: 2025-02-10
category: vue
tags: [Remark, MDC]
readingTime: 8
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

技術者でない書き手でも Markdown にインタラクティブな Vue コンポーネントを自然に埋め込めること。それが Nuxt Content の MDC 構文のいちばんの価値です。

## MDC 構文

`components/content/` の下に作ったコンポーネントは、Markdown の中でそのまま使えます：

```md
::callout{type="warning"}
これは注意書きです。
::
```

## 独自の remark プラグイン

`nuxt.config.ts` にプラグインを登録すれば AST を捕捉できます：

```ts
export default defineNuxtConfig({
  content: {
    build: { markdown: { remarkPlugins: { 'my-plugin': { src: './plugins/my-plugin' } } } },
  },
})
```

## セキュリティ

props を動的に渡すときは、受け付ける属性を必ずホワイトリスト化し、任意の値が注入されないようにしてください。

---
title: Nuxt Content 自訂 Markdown 語法解析器與 AST 微元件
description: 利用 remark 外掛攔截抽象語法樹，將自訂標籤轉譯為高互動性的 Vue 元件。
date: 2025-02-10
category: vue
tags: [Remark, MDC]
readingTime: 8
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

讓非技術寫作者在 Markdown 中無縫嵌入互動式 Vue 元件，是 Nuxt Content 的 MDC 語法最有價值的地方。

## MDC 語法

在 `components/content/` 下建立的元件，可直接在 Markdown 中使用：

```md
::callout{type="warning"}
這是一段提醒文字。
::
```

## 自訂 remark 外掛

在 `nuxt.config.ts` 註冊外掛即可攔截 AST：

```ts
export default defineNuxtConfig({
  content: {
    build: { markdown: { remarkPlugins: { 'my-plugin': { src: './plugins/my-plugin' } } } },
  },
})
```

## 安全性

動態傳遞 props 時，務必白名單化可接受的屬性，避免任意注入。

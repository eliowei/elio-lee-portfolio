---
title: A Custom Markdown Parser and AST Micro-components in Nuxt Content
description: Intercepting the abstract syntax tree with a remark plugin to turn custom tags into highly interactive Vue components.
date: 2025-02-10
category: vue
tags: [Remark, MDC]
readingTime: 8
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

Letting non-technical writers embed interactive Vue components in Markdown seamlessly is the most valuable part of Nuxt Content's MDC syntax.

## MDC syntax

Components created under `components/content/` can be used directly in Markdown:

```md
::callout{type="warning"}
This is a reminder.
::
```

## A custom remark plugin

Register the plugin in `nuxt.config.ts` to intercept the AST:

```ts
export default defineNuxtConfig({
  content: {
    build: { markdown: { remarkPlugins: { 'my-plugin': { src: './plugins/my-plugin' } } } },
  },
})
```

## Security

When passing props dynamically, always allowlist the accepted attributes to prevent arbitrary injection.

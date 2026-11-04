---
title: 'Hunting Ghost Reactivity: When Pinia Store State Is Mutated Outside Its Getters'
description: A render loop caused by destructuring away reactivity tracking and then mutating a deep reactive object directly in a child component.
date: 2025-01-29
category: case
tags: [Reactivity, Devtools]
readingTime: 6
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

A subtle render loop caused by losing reactivity tracking through destructuring, then mutating the store object directly.

## Symptoms

After filtering, the list kept re-rendering and CPU usage spiked.

## Root cause

```ts
// Destructuring loses reactivity
const { items } = store
items.push(newItem)
```

## Fix

Use `storeToRefs` to get reactive references, and change state through an action:

```ts
const { items } = storeToRefs(store)
store.addItem(newItem)
```

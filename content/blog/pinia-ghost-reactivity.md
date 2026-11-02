---
title: 排查幽靈響應：Pinia Store 狀態在 Getters 外部被意外修改的歷程
description: 解構賦值失去響應追蹤後，在子元件直接突變 deep reactive 物件所引發的渲染死循環。
date: 2025-01-29
category: debug
tags: [Reactivity, Devtools]
readingTime: 6
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

一次因解構賦值失去響應追蹤後，直接突變 store 物件所引發的隱密渲染死循環。

## 症狀

列表在篩選後不斷重新渲染，CPU 使用率飆高。

## 根因

```ts
// 解構會丟失響應性
const { items } = store
items.push(newItem)
```

## 修正

使用 `storeToRefs` 取得響應式參照，並透過 action 變更狀態：

```ts
const { items } = storeToRefs(store)
store.addItem(newItem)
```

---
title: 幽霊のようなリアクティビティを追う：Pinia Store の状態が Getters の外で意図せず変更されていた件
description: 分割代入でリアクティブな追跡が失われたあと、子コンポーネントで deep reactive なオブジェクトを直接変更したことで起きたレンダリングの無限ループ。
date: 2025-01-29
category: case
tags: [Reactivity, Devtools]
readingTime: 6
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

分割代入でリアクティブな追跡が失われたあと、store のオブジェクトを直接変更したことで起きた、気づきにくいレンダリングの無限ループです。

## 症状

絞り込み後にリストが再レンダリングを繰り返し、CPU 使用率が跳ね上がりました。

## 根本原因

```ts
// 分割代入するとリアクティブ性が失われる
const { items } = store
items.push(newItem)
```

## 修正

`storeToRefs` でリアクティブな参照を取得し、状態の変更は action を通して行います：

```ts
const { items } = storeToRefs(store)
store.addItem(newItem)
```

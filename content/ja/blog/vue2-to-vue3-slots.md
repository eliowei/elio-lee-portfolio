---
title: Vue 2 から Vue 3 へのコンポーネント移行の実践：Slot のスコープと Adapter レイヤー
description: $scopedSlots が $slots に統合された破壊的変更を読み解き、Adapter レイヤーで新旧のコンポーネントを同じルートに共存させます。
date: 2025-02-18
category: vue
tags: [Vue 3, Migration, Slots]
readingTime: 12
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

Vue 2.7 から Vue 3.4+ へ段階的にアップグレードする中で、もっとも過小評価されがちな破綻ポイントは、`this.$scopedSlots` が関数型の `$slots` に統合されたことです。

## 破壊的変更の分析

| 観点 | Vue 2.7 | Vue 3.4+ | 移行の提案 |
| --- | --- | --- | --- |
| Slot へのアクセス | `$slots` / `$scopedSlots` | `slots.default?.()` | `useSlots()` を使う |
| スコープ付きプロパティ | `slot-scope="props"` | `#default="{ item }"` | すべて `#` の省略記法に置き換える |
| ルートノード | 単一のルートノード | Fragments | fallthrough attributes に注意 |

## Adapter レイヤーでのラップ

数十ある業務ページを一度に書き直さずに済むよう、互換性のためのアダプターを用意します：

```vue
<script setup lang="ts">
import { useSlots, type VNode } from 'vue'

const slots = useSlots()

const renderSlot = (name: string, ctx: Record<string, unknown>): VNode[] | null => {
  const slotFn = slots[name]
  return slotFn ? slotFn(ctx) : null
}
</script>
```

> コンポーネントに `this.$on` / `this.$off` が残っている場合、これらは Vue 3 で削除されています。`mitt` か Pinia の action の購読に置き換えてください。

## メモリリークの防止

非同期コールバックの中で動的に作られた watcher には同期的な所有者のコンテキストがないため、アンマウント時に自動で破棄されません。`effectScope` や `onScopeDispose` で手動で登録する必要があります。

## パフォーマンスの検証

Slot の Adapter レイヤーとリアクティビティの最適化により、100 万件規模のデータテーブルを絞り込むときの DOM 再計算時間は 84ms から 19ms に短縮され、メモリ使用量は 34% 減りました。

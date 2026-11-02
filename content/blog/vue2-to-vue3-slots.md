---
title: 從 Vue 2 到 Vue 3 元件遷移實戰：Slot 作用域與 Adapter 轉接層
description: 解析 $scopedSlots 收斂為 $slots 的破壞性變更，並以 Adapter 轉接層讓新舊元件在同一路由共存。
date: 2025-02-18
category: vue
tags: [Vue 3, Migration, Slots]
readingTime: 12
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

在 Vue 2.7 漸進升級至 Vue 3.4+ 的過程中，最容易被低估的崩潰點往往是 `this.$scopedSlots` 被統一收斂至 `$slots` 函式型態。

## 破壞性變更分析

| 面向 | Vue 2.7 | Vue 3.4+ | 遷移建議 |
| --- | --- | --- | --- |
| Slot 存取 | `$slots` / `$scopedSlots` | `slots.default?.()` | 使用 `useSlots()` |
| 作用域屬性 | `slot-scope="props"` | `#default="{ item }"` | 全面替換為 `#` 縮寫 |
| 根節點 | 單一根節點 | Fragments | 注意 fallthrough attributes |

## Adapter 轉接層封裝

為避免數十個業務頁面同時重寫，建立一層相容轉接器：

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

> 若元件仍殘留 `this.$on` / `this.$off`，它們在 Vue 3 已被移除，請改用 `mitt` 或 Pinia action 訂閱。

## 記憶體洩漏防範

在非同步回呼中動態產生的 watcher 缺乏同步所有權上下文，不會在卸載時自動銷毀，需手動以 `effectScope` 或 `onScopeDispose` 註冊。

## 效能基準驗證

經過 Slot 轉接層與響應式優化後，百萬級資料表格篩選的 DOM 重新運算時間自 84ms 降至 19ms，記憶體佔用降低 34%。

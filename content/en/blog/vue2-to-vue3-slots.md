---
title: 'Migrating Components from Vue 2 to Vue 3: Scoped Slots and an Adapter Layer'
description: Unpacking the breaking change that merges $scopedSlots into $slots, and using an adapter layer so old and new components can coexist on the same route.
date: 2025-02-18
category: vue
tags: [Vue 3, Migration, Slots]
readingTime: 12
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

When gradually upgrading from Vue 2.7 to Vue 3.4+, the most underestimated breaking point is often that `this.$scopedSlots` is merged into `$slots` as functions.

## Analysing the breaking changes

| Aspect | Vue 2.7 | Vue 3.4+ | Migration advice |
| --- | --- | --- | --- |
| Accessing slots | `$slots` / `$scopedSlots` | `slots.default?.()` | Use `useSlots()` |
| Scoped props | `slot-scope="props"` | `#default="{ item }"` | Replace everything with the `#` shorthand |
| Root node | Single root node | Fragments | Watch out for fallthrough attributes |

## Wrapping it in an adapter layer

To avoid rewriting dozens of business pages at once, build a compatibility adapter:

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

> If a component still uses `this.$on` / `this.$off`, note that they were removed in Vue 3; switch to `mitt` or Pinia action subscriptions.

## Preventing memory leaks

Watchers created dynamically inside async callbacks have no synchronous owner context, so they are not destroyed automatically on unmount; register them manually with `effectScope` or `onScopeDispose`.

## Benchmarking the result

After the slot adapter and reactivity optimisations, DOM recalculation when filtering a table with a million rows dropped from 84 ms to 19 ms, and memory usage fell by 34%.

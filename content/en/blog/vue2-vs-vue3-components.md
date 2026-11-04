---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: Component Lifecycle and Two-Way Binding in Vue 2 vs Vue 3
description: From the evolution of v-model and defineModel to reactive/ref pitfalls, a summary of the key differences in how components are written.
date: 2025-07-15
category: vue
tags: [Vue 3, Migration, v-model]
readingTime: 9
---

When migrating from Vue 2 to Vue 3, what goes wrong most often is not the syntax but **changed default behaviour**: the same code still runs in the new version, but behaves differently. This note covers the component-level differences you run into most, and what to check when migrating.

## Reactivity: from defineProperty to Proxy

Vue 2 intercepts properties with `Object.defineProperty`, which comes with limits: adding a new property or changing an array element by index can't be detected, and you have to use `Vue.set`. Vue 3 switched to `Proxy`, and those limits are gone.

```js
// Vue 2: adding a property does not trigger an update
this.user.age = 30        // not reactive
this.$set(this.user, 'age', 30)

// Vue 3: just assign it
state.user.age = 30
```

But Proxy brings another trap: **destructuring loses reactivity**.

```js
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0 })

const { count } = state          // count is just a plain number, no longer reactive
const { count: c } = toRefs(state) // c is a ref and stays reactive
```

## Lifecycle hooks compared

| Vue 2 | Vue 3 (Options API) | Composition API |
| --- | --- | --- |
| `beforeCreate` / `created` | Same | Written directly in `setup()` |
| `beforeMount` / `mounted` | Same | `onBeforeMount` / `onMounted` |
| `beforeUpdate` / `updated` | Same | `onBeforeUpdate` / `onUpdated` |
| `beforeDestroy` | `beforeUnmount` | `onBeforeUnmount` |
| `destroyed` | `unmounted` | `onUnmounted` |

The key point is that `destroy` was renamed to `unmount`. If you miss it during migration, hooks with the old names simply don't run in Vue 3, and the cleanup inside them (removing listeners, clearing timers) silently stops working.

## Changes to v-model

In Vue 2, `v-model` binds the `value` prop and the `input` event by default; Vue 3 uses `modelValue` and `update:modelValue`, and supports multiple `v-model`s.

```vue
<!-- Parent -->
<UserForm v-model:name="name" v-model:email="email" />
```

```vue
<!-- Child (Vue 3.4+): defineModel replaces declaring props and emits by hand -->
<script setup>
const name = defineModel('name')
const email = defineModel('email')
</script>

<template>
  <input v-model="name">
  <input v-model="email">
</template>
```

If a custom component relied on `value` / `input` in Vue 2, change it to `modelValue` / `update:modelValue` when migrating, or the parent's `v-model` will stop working.

## Slot and event APIs

- Vue 3 merges `$scopedSlots` into `$slots`, and every slot is a function; templates use `v-slot` or `#` throughout.
- `$on`, `$off` and `$once` were removed in Vue 3. Code that used a component instance as an event bus has to switch to a library such as `mitt`, or to props / emits or `provide` / `inject`.
- Components can have multiple root nodes (fragments). In that case fallthrough attributes such as `class` are no longer applied to a single root automatically, and you need `v-bind="$attrs"` to say where they go.

## Migration checklist

1. Find every custom `v-model` in the `value` / `input` style and change it to `modelValue`.
2. Search for `beforeDestroy`, `destroyed`, `$on`, `$off`, `$scopedSlots` and `$set`.
3. Check every place that destructures a `reactive` object, and switch to `toRefs` or access the property directly.
4. Multi-root components: confirm `$attrs` lands on the intended element.
5. If you use a UI component library, read that version's migration guide too, as component APIs and default styles often differ.

## Summary

The heart of migration is "understand the difference, then change it", not moving old code over to the new version unchanged. Renamed lifecycle hooks, the `v-model` protocol and destructuring losing reactivity are the three most likely to cause wrong behaviour without any error message, so they are worth checking one by one first.

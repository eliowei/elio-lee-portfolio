---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: Vue 2 與 Vue 3 元件生命週期與雙向綁定差異解析
description: 從 v-model 演進、defineModel 到 reactive/ref 踩坑實錄，記錄升級專案中的元件實作關鍵要點。
date: 2026-10-29
category: vue
tags: [Vue 3, Migration, v-model]
readingTime: 9
---

從 Vue 2 遷移到 Vue 3，最容易出問題的不是語法本身，而是「預設行為改變」：同樣的程式碼在新版仍能跑，但行為不一樣。這篇整理元件層級最常碰到的幾個差異，以及遷移時的檢查重點。

## 響應式系統：defineProperty 到 Proxy

Vue 2 用 `Object.defineProperty` 攔截屬性，所以有幾個限制：新增屬性、用索引改陣列元素，都偵測不到，必須使用 `Vue.set`。Vue 3 改用 `Proxy`，這些限制消失了。

```js
// Vue 2：新增屬性不會觸發更新
this.user.age = 30        // 無響應
this.$set(this.user, 'age', 30)

// Vue 3：直接指定即可
state.user.age = 30
```

但 Proxy 帶來另一個陷阱：**解構會丟失響應性**。

```js
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0 })

const { count } = state          // count 只是一個普通數字，不再響應
const { count: c } = toRefs(state) // c 是 ref，保持響應
```

## 生命週期對照

| Vue 2 | Vue 3（Options API） | Composition API |
| --- | --- | --- |
| `beforeCreate` / `created` | 同左 | 直接寫在 `setup()` 內 |
| `beforeMount` / `mounted` | 同左 | `onBeforeMount` / `onMounted` |
| `beforeUpdate` / `updated` | 同左 | `onBeforeUpdate` / `onUpdated` |
| `beforeDestroy` | `beforeUnmount` | `onBeforeUnmount` |
| `destroyed` | `unmounted` | `onUnmounted` |

重點是 `destroy` 改名為 `unmount`。遷移時如果漏改，舊名稱的鉤子在 Vue 3 不會執行，原本放在裡面的清理工作（移除監聽、清除計時器）就默默失效了。

## v-model 的改變

Vue 2 的 `v-model` 預設綁 `value` prop 與 `input` 事件；Vue 3 改成 `modelValue` 與 `update:modelValue`，並且支援多個 `v-model`。

```vue
<!-- 父層 -->
<UserForm v-model:name="name" v-model:email="email" />
```

```vue
<!-- 子層（Vue 3.4+）：defineModel 取代手動宣告 props 與 emit -->
<script setup>
const name = defineModel('name')
const email = defineModel('email')
</script>

<template>
  <input v-model="name">
  <input v-model="email">
</template>
```

自訂元件如果在 Vue 2 依賴 `value` / `input`，遷移時要改成 `modelValue` / `update:modelValue`，否則父層的 `v-model` 會失效。

## 插槽與事件 API

- Vue 3 把 `$scopedSlots` 併入 `$slots`，所有插槽都是函式；範本語法統一用 `v-slot` 或 `#`。
- `$on`、`$off`、`$once` 在 Vue 3 被移除。以往拿元件實例當 Event Bus 的寫法需要改用 `mitt` 之類的函式庫，或改成 props / emits、`provide` / `inject`。
- 元件可以有多個根節點（Fragments）。這時 `class` 等 fallthrough 屬性不再自動套用到單一根節點，需要用 `v-bind="$attrs"` 指定位置。

## 遷移檢查清單

1. 找出所有 `value` / `input` 風格的自訂 `v-model`，改成 `modelValue`。
2. 搜尋 `beforeDestroy`、`destroyed`、`$on`、`$off`、`$scopedSlots`、`$set`。
3. 檢查所有解構 `reactive` 物件的地方，改用 `toRefs` 或直接存取屬性。
4. 多根節點元件：確認 `$attrs` 套用在預期的元素上。
5. 使用 UI 元件庫時，同步查閱該版本的遷移指南，因為元件 API 與預設樣式常有差異。

## 小結

遷移的核心是「理解差異再改」，而不是把舊版寫法原封不動搬到新版。生命週期改名、`v-model` 協議、解構失去響應性這三項，最容易在沒有錯誤訊息的情況下造成行為異常，值得優先逐項檢查。

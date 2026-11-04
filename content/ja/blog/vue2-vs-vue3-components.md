---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: Vue 2 と Vue 3 のコンポーネントのライフサイクルと双方向バインディングの違い
description: v-model の進化、defineModel、reactive/ref のハマりどころまで、コンポーネント実装の重要な違いをまとめます。
date: 2025-07-15
category: vue
tags: [Vue 3, Migration, v-model]
readingTime: 9
---

Vue 2 から Vue 3 に移行するとき、問題になりやすいのは構文そのものではなく「デフォルトの挙動の変化」です。同じコードが新しいバージョンでも動くのに、挙動が違うのです。この記事では、コンポーネントのレベルでよく出会う違いと、移行時に確認すべきポイントをまとめます。

## リアクティビティ：defineProperty から Proxy へ

Vue 2 は `Object.defineProperty` でプロパティを捕捉するため、いくつかの制約があります。新しいプロパティの追加や、インデックスによる配列要素の変更は検知できず、`Vue.set` を使う必要があります。Vue 3 は `Proxy` に切り替わり、こうした制約はなくなりました。

```js
// Vue 2：プロパティを追加しても更新はトリガーされない
this.user.age = 30        // リアクティブにならない
this.$set(this.user, 'age', 30)

// Vue 3：そのまま代入すればよい
state.user.age = 30
```

ただし Proxy には別の落とし穴があります。**分割代入するとリアクティブ性が失われる**のです。

```js
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0 })

const { count } = state          // count はただの数値になり、リアクティブではない
const { count: c } = toRefs(state) // c は ref なので、リアクティブなまま
```

## ライフサイクルの対応表

| Vue 2 | Vue 3（Options API） | Composition API |
| --- | --- | --- |
| `beforeCreate` / `created` | 同じ | `setup()` の中に直接書く |
| `beforeMount` / `mounted` | 同じ | `onBeforeMount` / `onMounted` |
| `beforeUpdate` / `updated` | 同じ | `onBeforeUpdate` / `onUpdated` |
| `beforeDestroy` | `beforeUnmount` | `onBeforeUnmount` |
| `destroyed` | `unmounted` | `onUnmounted` |

ポイントは `destroy` が `unmount` に改名されたことです。移行時に直し忘れると、古い名前のフックは Vue 3 では実行されず、その中に書いていた後片付け（リスナーの解除、タイマーのクリア）が気づかないうちに効かなくなります。

## v-model の変更

Vue 2 の `v-model` はデフォルトで `value` プロパティと `input` イベントにバインドされます。Vue 3 では `modelValue` と `update:modelValue` に変わり、複数の `v-model` にも対応しました。

```vue
<!-- 親 -->
<UserForm v-model:name="name" v-model:email="email" />
```

```vue
<!-- 子（Vue 3.4+）：defineModel が props と emit の手動宣言を置き換える -->
<script setup>
const name = defineModel('name')
const email = defineModel('email')
</script>

<template>
  <input v-model="name">
  <input v-model="email">
</template>
```

Vue 2 で `value` / `input` に依存していたカスタムコンポーネントは、移行時に `modelValue` / `update:modelValue` に変更しないと、親の `v-model` が効かなくなります。

## スロットとイベントの API

- Vue 3 では `$scopedSlots` が `$slots` に統合され、すべてのスロットが関数になりました。テンプレートの構文は `v-slot` か `#` に統一されます。
- `$on`、`$off`、`$once` は Vue 3 で削除されました。コンポーネントのインスタンスをイベントバスとして使っていた書き方は、`mitt` のようなライブラリか、props / emits、`provide` / `inject` に置き換える必要があります。
- コンポーネントが複数のルートノード（Fragments）を持てるようになりました。この場合、`class` などの fallthrough 属性は単一のルートノードに自動で適用されなくなるため、`v-bind="$attrs"` で適用先を指定する必要があります。

## 移行チェックリスト

1. `value` / `input` スタイルのカスタム `v-model` をすべて探し、`modelValue` に変更する。
2. `beforeDestroy`、`destroyed`、`$on`、`$off`、`$scopedSlots`、`$set` を検索する。
3. `reactive` オブジェクトを分割代入している箇所をすべて確認し、`toRefs` を使うかプロパティに直接アクセスする。
4. 複数ルートのコンポーネント：`$attrs` が意図した要素に適用されているか確認する。
5. UI コンポーネントライブラリを使っている場合は、そのバージョンの移行ガイドもあわせて確認する。コンポーネントの API やデフォルトのスタイルがよく変わるためです。

## まとめ

移行の核心は「違いを理解してから直す」ことであり、古い書き方をそのまま新しいバージョンに持ち込むことではありません。ライフサイクルの改名、`v-model` の取り決め、分割代入によるリアクティブ性の喪失の 3 つは、エラーメッセージが出ないまま挙動がおかしくなりやすいので、優先的に一つずつ確認する価値があります。

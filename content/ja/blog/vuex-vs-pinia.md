---
title: Vuex と Pinia の書き方の違い：Vue 2 から Vue 3 へ
description: Vuex 3、Vuex 4、Pinia について、store の作成、コンポーネントでの利用、モジュールの分割の書き方を比較し、移行時に間違えやすい点をまとめます。
date: 2025-08-20
category: vue
tags: [Vuex, Pinia, Migration]
readingTime: 6
---

個人プロジェクトの「ゲーム仲間募集プラットフォーム」は Vue 3 と Pinia で書いていて、当時は状態管理とはこういうものだと思っていました。入社後、Vue 2 と Vue 3 のプロジェクトに同時に関わるようになってはじめて Vuex に触れ、振り返って考えるようになりました。なぜ Vuex には mutation という層が 1 つ多いのか。そしてなぜ Pinia はそれをなくしたのか。

この記事では、同じカウンターの例で両者の書き方を比べ、その違いから見えたことを記録します。

## バージョンの対応

| 状態管理 | 対応する Vue のバージョン |
|---|---|
| Vuex 3 | Vue 2 |
| Vuex 4 | Vue 3 |
| Pinia 2 | Vue 2、Vue 3 |
| Pinia 3 | Vue 3 |

つまり、Vue 3 にアップグレードしても Vuex を置き換える必要があるとは限らず、Vuex 4 の API はおおむね同じです。ただし新しいプロジェクトでは Pinia を使うことが推奨されており、Vuex は現在メンテナンスモードにあります。

## 作成と登録

Vue 2 と Vuex 3 では、インスタンスを作ってルートコンポーネントに渡します：

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({ /* ... */ })
```

Vue 3 では関数スタイルになり、Vuex 4 も Pinia も同じです：

```js
// Vuex 4
const store = createStore({ /* ... */ })
createApp(App).use(store).mount('#app')

// Pinia
createApp(App).use(createPinia()).mount('#app')
```

## store の定義：最大の違いは mutations がないこと

Vuex では state の変更は mutation を通す決まりで、非同期処理は action に書きます：

```js
export default {
  namespaced: true,
  state: () => ({ count: 0 }),
  getters: {
    double: state => state.count * 2,
  },
  mutations: {
    SET_COUNT(state, value) {
      state.count = value
    },
  },
  actions: {
    async fetchCount({ commit }) {
      const { count } = await api.getCount()
      commit('SET_COUNT', count)
    },
  },
}
```

Pinia は mutations をなくし、action から state を直接変更できます。同期も非同期も一緒に書けます：

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: state => state.count * 2,
  },
  actions: {
    async fetchCount() {
      const { count } = await api.getCount()
      this.count = count
    },
  },
})
```

Pinia は Composition API に似た書き方もできます。`ref` が state、`computed` が getter、関数が action です：

```js
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  async function fetchCount() {
    count.value = (await api.getCount()).count
  }

  return { count, double, fetchCount }
})
```

## コンポーネントでの利用

### Options API

Vue 3 のプロジェクトが必ずしも Composition API に移行しているとは限りません。Options API を使う場合、Vuex にも Pinia にも対応するヘルパー関数があり、書き方はよく似ています：

```js
// Vuex
computed: {
  ...mapState('counter', ['count']),
  ...mapGetters('counter', ['double']),
},
methods: {
  ...mapActions('counter', ['fetchCount']),
},

// Pinia
computed: {
  ...mapState(useCounterStore, ['count', 'double']),
},
methods: {
  ...mapActions(useCounterStore, ['fetchCount']),
},
```

Pinia では `mapGetters` は不要で、getter も `mapState` で取得する点に注意してください。コンポーネントから state を変更したい場合は `mapWritableState` を使います。

### Composition API

```js
// Vuex 4
const store = useStore()
const count = computed(() => store.state.counter.count)
store.dispatch('counter/fetchCount')

// Pinia
const counter = useCounterStore()
counter.count
counter.fetchCount()
```

Pinia には文字列のパスがないので、名前を打ち間違えたときにエディターや TypeScript が気づかせてくれやすくなります。

## いちばんよくある落とし穴：分割代入でリアクティブ性が失われる

store は reactive なオブジェクトなので、state を直接分割代入するとリアクティブ性が失われます。`storeToRefs` を使いましょう。action はそのまま分割代入できます：

```js
const counter = useCounterStore()

const { count } = counter // 誤り：store の更新に追従しない
const { count, double } = storeToRefs(counter) // 正しい
const { fetchCount } = counter // action はそのまま分割代入してよい
```

## モジュールと store 間の呼び出し

Vuex は store が 1 つだけで、modules で分割します。ほかのモジュールを呼ぶには文字列のパスに頼ります：

```js
dispatch('user/fetchProfile', null, { root: true })
```

Pinia には modules がなく、各 store が独立していて、必要なときに直接インポートします：

```js
actions: {
  async checkout() {
    const user = useUserStore()
    await user.fetchProfile()
  },
}
```

`useUserStore()` は関数の中で呼ぶ必要があり、ファイルの最上位には書けない点に注意してください。router guard のようなコンポーネントの外でも同じで、`app.use(pinia)` のあとでなければ使えません。

## 私の実感：Vuex はなぜ手間がかかるのか

募集プラットフォームでは、Setup Store で複数ステップの「募集作成」フォームを管理し、永続化プラグインでデータを保持していました。状態を変えたければそのまま変えればよく、直感的に書けました。

会社の Vuex のプロジェクトに触れて、最初に感じたのは手間がかかるということでした。ひとつの値を変えるのに、Pinia なら直接変えられます：

```js
const counter = useCounterStore()
counter.count++
```

Vuex ではまず mutation を定義し、それをコンポーネントから呼び出す必要があります。Options API なら `methods` にマッピングするか、`this.$store.commit` を直接使います。会社のプロジェクトではどちらの書き方も見かけました：

```js
// store
mutations: {
  INCREMENT(state) {
    state.count++
  },
},

// コンポーネント：mapMutations で methods にマッピング
methods: {
  ...mapMutations('counter', ['INCREMENT']),
},

// コンポーネント：または直接 commit
this.$store.commit('counter/INCREMENT')
```

非同期処理が必要なら、さらに action を書いて action から `commit` します。流れ全体で、書く場所がいくつも増えます。

あとになって、この決まりの目的がわかりました。すべての変更を mutation に集約すれば、状態の変化に決まった入り口ができ、追跡しやすくなるのです。Pinia はこの層をなくしたことで自由に書けるようになりましたが、どこからでも state を直接変えられるので、ルールは開発者自身が守る必要があります。たとえば複雑な変更は action にまとめる、といった具合です。

## Vuex から Pinia に移行するなら

- `commit` を state の直接変更か action の呼び出しに置き換える。
- 文字列のパスを store の関数に置き換える。
- 大きな store の modules を、複数の独立した store に分ける。
- state を分割代入している箇所はすべて `storeToRefs` に変える。
- `$reset()` は Option Store にしか組み込まれていないので、Setup Store ではリセット関数を自分で書く。
- 永続化は `pinia-plugin-persistedstate` のような Pinia のプラグインに切り替える。

## まとめ

Vuex の要点は流れを統一することで、すべての変更が mutation を通ります。Pinia の要点は書く量が少なく型が強いことで、store を普通の関数とデータとして扱います。先に Pinia を使ってから Vuex を振り返ったことで、フレームワークの「面倒さ」は、多くの場合チームのために別の問題を解決しているのだと理解できました。

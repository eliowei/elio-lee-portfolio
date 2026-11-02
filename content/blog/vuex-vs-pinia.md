---
title: Vuex 與 Pinia 的寫法差異：從 Vue 2 到 Vue 3
description: 比較 Vuex 3、Vuex 4 與 Pinia 在建立 store、元件取用、模組拆分上的寫法，並整理遷移時容易出錯的地方。
date: 2025-08-20
category: vue
tags: [Vuex, Pinia, Migration]
readingTime: 6
---

我的 side project「遊戲揪團平台」是用 Vue 3 和 Pinia 寫的，當時只覺得狀態管理就是這樣。進公司後，因為同時接觸 Vue 2 和 Vue 3 的專案，才第一次碰到 Vuex，也才開始回頭想：為什麼它要多一層 mutation？Pinia 又為什麼拿掉了？

這篇用同一個計數器範例比較兩者的寫法，並記錄我從這個差異看到的事。

## 版本怎麼對應

| 狀態管理 | 支援的 Vue 版本 |
|---|---|
| Vuex 3 | Vue 2 |
| Vuex 4 | Vue 3 |
| Pinia 2 | Vue 2、Vue 3 |
| Pinia 3 | Vue 3 |

換句話說，升級到 Vue 3 不一定要換掉 Vuex，Vuex 4 的 API 大致相同。但新專案建議直接使用 Pinia，Vuex 目前也處於維護狀態。

## 建立與註冊

Vue 2 搭配 Vuex 3 是建立實例，再傳給根元件：

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({ /* ... */ })
```

Vue 3 改成函式寫法，Vuex 4 和 Pinia 都一樣：

```js
// Vuex 4
const store = createStore({ /* ... */ })
createApp(App).use(store).mount('#app')

// Pinia
createApp(App).use(createPinia()).mount('#app')
```

## 定義 store：最大的差別是沒有 mutations

Vuex 規定修改 state 要透過 mutation，非同步要放在 action：

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

Pinia 拿掉了 mutations，action 可以直接修改 state，同步和非同步都寫在一起：

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

Pinia 也可以用類似 Composition API 的寫法，`ref` 就是 state，`computed` 就是 getter，函式就是 action：

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

## 在元件裡使用

### Options API

Vue 3 專案不一定都改用 Composition API。使用 Options API 時，Vuex 和 Pinia 都有對應的輔助函式，寫法很接近：

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

要注意 Pinia 沒有 `mapGetters` 的必要，getter 也用 `mapState` 取得。如果要在元件裡修改 state，要改用 `mapWritableState`。

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

Pinia 少了字串路徑，打錯名稱時編輯器和 TypeScript 比較容易提示。

## 最常踩的坑：解構失去響應式

store 是 reactive 物件，直接解構 state 會失去響應式。要用 `storeToRefs`，action 則可以直接解構：

```js
const counter = useCounterStore()

const { count } = counter // 錯誤：不會隨 store 更新
const { count, double } = storeToRefs(counter) // 正確
const { fetchCount } = counter // action 可以直接解構
```

## 模組與 store 之間的呼叫

Vuex 只有一個 store，再用 modules 拆分，呼叫其他模組要靠字串路徑：

```js
dispatch('user/fetchProfile', null, { root: true })
```

Pinia 沒有 modules，每個 store 各自獨立，需要時直接引入：

```js
actions: {
  async checkout() {
    const user = useUserStore()
    await user.fetchProfile()
  },
}
```

要注意 `useUserStore()` 要在函式裡呼叫，不能寫在檔案最上層。在 router guard 這類元件外的地方也一樣，要等 `app.use(pinia)` 之後才能使用。

## 我的體會：Vuex 為什麼比較繁瑣

在揪團平台裡，我用 Setup Store 管理多步驟的建立揪團表單，再搭配持久化外掛保留資料。要改狀態就直接改，寫起來很直覺。

接觸公司的 Vuex 專案後，我的第一個感覺就是繁瑣。同樣是修改一個值，Pinia 可以直接改：

```js
const counter = useCounterStore()
counter.count++
```

Vuex 則要先定義 mutation，再從元件呼叫它。使用 Options API 時，可以在 `methods` 裡對應進來，或直接用 `this.$store.commit`，公司專案裡兩種寫法我都看過：

```js
// store
mutations: {
  INCREMENT(state) {
    state.count++
  },
},

// 元件：用 mapMutations 對應到 methods
methods: {
  ...mapMutations('counter', ['INCREMENT']),
},

// 元件：或直接 commit
this.$store.commit('counter/INCREMENT')
```

需要非同步時還要再多寫一個 action，由 action 去 `commit`。整個流程多了好幾個地方要寫。

後來我才理解這層規定的目的：把所有修改集中在 mutation，狀態的變化就有固定的入口，比較容易追蹤。Pinia 拿掉這層後寫起來更自由，但任何地方都能直接改 state，所以規範要由開發者自己維持，例如把複雜的修改集中在 action 裡。

## 如果要從 Vuex 換到 Pinia

- 把 `commit` 改成直接修改 state，或呼叫 action。
- 把字串路徑改成 store 函式。
- 把一個大 store 的 modules 拆成多個獨立 store。
- 解構 state 的地方都改用 `storeToRefs`。
- `$reset()` 只有 Option Store 內建，Setup Store 要自己寫重置函式。
- 持久化改用 `pinia-plugin-persistedstate` 這類 Pinia 的外掛。

## 小結

Vuex 的重點是流程要統一，所有修改都走 mutation。Pinia 的重點是寫法更少、型別更好，把 store 當成一般的函式和資料來用。先用過 Pinia 再回頭看 Vuex，讓我理解到一個框架的「麻煩」，常常是在替團隊解決另一個問題。

---
title: 'How Vuex and Pinia Differ in Practice: From Vue 2 to Vue 3'
description: Comparing how Vuex 3, Vuex 4 and Pinia handle creating stores, using them in components and splitting modules, plus the things that commonly go wrong during migration.
date: 2025-08-20
category: vue
tags: [Vuex, Pinia, Migration]
readingTime: 6
---

My side project, a gaming meetup platform, was written with Vue 3 and Pinia, and at the time I just assumed that was what state management looked like. After joining my company and working on both Vue 2 and Vue 3 projects, I ran into Vuex for the first time and started to wonder: why does it have an extra layer of mutations? And why did Pinia remove it?

This note compares the two using the same counter example, and records what that difference taught me.

## Which versions go together

| State management | Supported Vue version |
|---|---|
| Vuex 3 | Vue 2 |
| Vuex 4 | Vue 3 |
| Pinia 2 | Vue 2, Vue 3 |
| Pinia 3 | Vue 3 |

In other words, upgrading to Vue 3 doesn't necessarily mean replacing Vuex; Vuex 4's API is largely the same. But Pinia is recommended for new projects, and Vuex is now in maintenance mode.

## Creating and registering

With Vue 2 and Vuex 3, you create an instance and pass it to the root component:

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({ /* ... */ })
```

Vue 3 switches to a function style, the same for Vuex 4 and Pinia:

```js
// Vuex 4
const store = createStore({ /* ... */ })
createApp(App).use(store).mount('#app')

// Pinia
createApp(App).use(createPinia()).mount('#app')
```

## Defining a store: the biggest difference is no mutations

Vuex requires state changes to go through mutations, with async work in actions:

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

Pinia removes mutations; actions can change state directly, with sync and async code written together:

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

Pinia can also be written in a Composition API style: a `ref` is state, a `computed` is a getter, and a function is an action:

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

## Using them in components

### Options API

Vue 3 projects don't necessarily switch to the Composition API. With the Options API, both Vuex and Pinia have matching helper functions, and the code looks very similar:

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

Note that Pinia has no need for `mapGetters`; getters are also accessed with `mapState`. To change state from a component, use `mapWritableState` instead.

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

Pinia has no string paths, so the editor and TypeScript are better at flagging a mistyped name.

## The most common pitfall: destructuring loses reactivity

A store is a reactive object, so destructuring its state directly loses reactivity. Use `storeToRefs`; actions, however, can be destructured directly:

```js
const counter = useCounterStore()

const { count } = counter // wrong: won't update with the store
const { count, double } = storeToRefs(counter) // correct
const { fetchCount } = counter // actions can be destructured directly
```

## Modules and calls between stores

Vuex has a single store split into modules, and calling another module relies on string paths:

```js
dispatch('user/fetchProfile', null, { root: true })
```

Pinia has no modules; each store is independent, and you import one directly when you need it:

```js
actions: {
  async checkout() {
    const user = useUserStore()
    await user.fetchProfile()
  },
}
```

Note that `useUserStore()` has to be called inside a function, not at the top level of the file. The same goes for places outside components such as router guards: it can only be used after `app.use(pinia)`.

## My takeaway: why Vuex feels more verbose

In the meetup platform, I used a setup store to manage a multi-step "create a meetup" form, with a persistence plugin to keep the data. To change state, you just change it; it felt natural.

When I started working on the company's Vuex projects, my first impression was that it was verbose. To change a single value, Pinia lets you change it directly:

```js
const counter = useCounterStore()
counter.count++
```

With Vuex, you first define a mutation, then call it from the component. With the Options API you can map it into `methods` or call `this.$store.commit` directly; I have seen both in company projects:

```js
// store
mutations: {
  INCREMENT(state) {
    state.count++
  },
},

// Component: map it into methods with mapMutations
methods: {
  ...mapMutations('counter', ['INCREMENT']),
},

// Component: or commit directly
this.$store.commit('counter/INCREMENT')
```

For async work you also need an action that does the `commit`. The whole flow has several more places to write code.

Later I understood the purpose of this rule: with every change centralised in mutations, state changes have a fixed entry point and are easier to trace. Removing that layer makes Pinia freer to write, but since anything can change state directly, developers have to maintain the discipline themselves, for example by keeping complex changes in actions.

## If you are moving from Vuex to Pinia

- Replace `commit` with direct state changes, or with calls to actions.
- Replace string paths with store functions.
- Split a big store's modules into several independent stores.
- Use `storeToRefs` wherever state is destructured.
- `$reset()` is only built into option stores; setup stores need their own reset function.
- For persistence, switch to a Pinia plugin such as `pinia-plugin-persistedstate`.

## Summary

Vuex's focus is a uniform flow, with every change going through a mutation. Pinia's focus is less code and better typing, treating a store as ordinary functions and data. Using Pinia first and then looking back at Vuex taught me that a framework's "hassle" is often solving a different problem for the team.

---
title: A Dialog That Never Opens Again After Closing It with ESC
description: After closing a Vuetify dialog with ESC, clicking the button again did nothing. The component's internal state and the external state had fallen out of sync; here is why and how I fixed it.
date: 2025-12-05
category: vue
tags: [Vuetify, Vuex, State]
readingTime: 3
---

We had an FAQ dialog that worked perfectly when closed with its button. But after closing it with the ESC key, clicking the open button again did nothing.

## Cause: the open state lived in two places

The dialog's open state was controlled by Vuex and opened from outside with an action:

```js
store.dispatch('toggleFAQdialog', { action: true })
```

Closing with the button goes through `closeFAQ`, which sets the state back to `false`. The problem is that ESC doesn't take that path. Vuetify's dialog closes on ESC by itself; it hid the window, but our closing logic never ran.

So the state ended up like this:

| When | Vuex state | Screen |
|---|---|---|
| Open | `true` | Shown |
| Press ESC | Still `true` | Closed |
| Click open again | `true` → `true` | No change |

The state didn't change, so Vue didn't trigger an update, and of course the screen didn't react.

## Fix: send ESC through the same closing flow

Listen for ESC on the dialog and call the same close method:

```html
<v-dialog v-model="FAQdialog" @keydown.esc="closeFAQ">
```

Now wherever it is closed from, the state ends up back at `false`, and both sides agree.

## Other cases with the same problem

Whenever a component has its own way of closing, make sure the state stays in sync:

- Pressing ESC
- Clicking the overlay
- Changing routes

This is also why `v-model` matters: the setter of the two-way binding has to actually write the value back to the source of the state, so that closing inside the component is reflected outside. If you bind a getter-only computed, or use a one-way `:value`, you will easily run into this problem.

```js
computed: {
  dialog: {
    get() {
      return this.$store.state.showDialog
    },
    set(value) {
      this.$store.commit('setShowDialog', value)
    },
  },
}
```

## What I learned

- When the same state lives in two places, it will eventually fall out of sync.
- When testing a close feature, don't just test the button; test the keyboard and the overlay too.
- A bug that "only fails the second time" usually means some state was never reset.

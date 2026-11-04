---
title: 'Returning to the Original Page After Login: Collapsing a Pile of Flags into One Mechanism'
description: Each page used to have its own flag recording where to go after login, so every new page meant another flag. How I switched to handling it in one Router Guard, and the edge cases that had to be excluded.
date: 2026-03-10
category: case
tags: [Vue Router, Vuex, Refactoring]
readingTime: 5
---

When a user opens a page that requires login, they are sent to log in first. After logging in, they should return to the page they were going to, not the home page.

It is a very common requirement, but the Vue 2 project I took over only handled a few of those pages, in a way that didn't scale. This note records how I refactored it.

## The original approach: one flag per page

Vuex had a set of flags recording which feature the user came from:

```js
state: {
  loginToCart: false,
  loginToApplication: false,
  // ...
}
```

A flag was set before entering the page, then checked one by one after login:

```js
if (state.loginToCart) {
  router.push({ name: 'Cart' })
} else if (state.loginToApplication) {
  router.push({ name: 'Application' })
} else {
  router.push({ name: 'Home' })
}
```

The problem: each new page requiring login meant another flag, another mutation, another branch, and remembering to clear it in the right place. Pages that weren't listed could only return to the home page after login.

And it only remembered *which page*, not the parameters in the URL.

## The new approach: remember the route the user was heading to

All these flags were really expressing the same thing: where to go after login. So I replaced them with a single piece of state:

```js
state: {
  redirectAfterLogin: null,
},
mutations: {
  setRedirectAfterLogin(state, route) {
    state.redirectAfterLogin = route
  },
  clearRedirectAfterLogin(state) {
    state.redirectAfterLogin = null
  },
}
```

Recording it no longer has to be scattered across pages; it all lives in the Router Guard. When the user turns out not to be logged in, the target route is saved:

```js
router.beforeEach((to, from, next) => {
  const isPageRefresh = from.name && from.path === to.path
  const skip = ['Login', 'Register', 'Home']

  if (
    !isLoggedIn() &&
    !store.state.redirectAfterLogin &&
    !skip.includes(to.name) &&
    from.name !== undefined &&
    !isPageRefresh
  ) {
    store.commit('setRedirectAfterLogin', {
      name: to.name,
      params: to.params,
      query: to.query,
    })
  }

  // ...
})
```

After a successful login, there is just this one value to look at:

```js
const route = store.state.redirectAfterLogin
store.commit('clearRedirectAfterLogin')
router.push(route ?? { name: 'Home' })
```

Now adding a page that requires login doesn't require changing any redirect logic.

## Why save params and query

If you only save the route name, pages with parameters lose their content when you come back. For example, if you are sent to log in from an order detail page or search results, you should come back to the same record.

So I save `name`, `params` and `query`, which restores the full page state on return.

## Edge cases to exclude

The mechanism itself is simple; most of the conditions deal with exceptions:

- **Don't record login, sign-up or the home page**: otherwise users are sent back to the login page after logging in.
- **Don't overwrite an existing value**: on the way to the login page, the user may pass through other routes; keeping the first one preserves the original destination.
- **Don't record the first visit**: when `from.name` is `undefined`, the URL was opened directly rather than navigated to within the site.
- **Don't record reloads**: the source and target are then the same path.
- **Clear it on logout**: otherwise the next person to log in is sent to the previous user's page.

The last point is the easiest to forget. When two people share a computer, it isn't just a UX issue; someone might see a page they shouldn't.

## Why not use a URL parameter

Another common approach is to put the destination in the URL, for example `/login?redirect=/orders/123`. Its advantages are that it survives reloads and is easy to share.

But beware of open redirects: if you redirect directly to the value of a URL parameter, an attacker can craft a link like `?redirect=https://evil.example` and use your domain to fool users. With this approach, check that the destination can only be a path within the site.

This project stores the route object in Vuex, so the destination never comes from external input and that problem doesn't arise; the trade-off is that the state disappears after a full page reload, and the user goes to the home page.

## What I learned

- When you see a row of similar flags, first ask whether they express the same thing.
- Shared logic is easier to maintain in a Router Guard than scattered across pages.
- The refactor made the code smaller, but the edge cases are what really take time to think through.

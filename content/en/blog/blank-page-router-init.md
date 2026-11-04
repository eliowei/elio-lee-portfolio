---
title: 'A Blank Page: 404 Routes, Initialisation APIs and Duplicate Logins'
description: An admin system showed a blank screen in several situations. How I added a 404 route, changed how the initialisation APIs load, and handled duplicate logins and expired passwords.
date: 2026-03-18
category: case
tags: [Vue Router, Promise, Error Handling]
readingTime: 6
---

A blank screen is one of the worst errors: no message, no buttons, and all the user can do is reload. While maintaining a Vue 2 admin system, I dealt with several situations that caused blank screens in one go.

## Case 1: visiting a route that doesn't exist

When you typed a wrong URL, the page showed only its frame, with the content completely blank.

The reason is simple: when Vue Router can't find a matching route, it doesn't throw; `<router-view>` just renders nothing. In Vue Router 3 you have to add a catch-all route yourself:

```js
export function abort(code = 404) {
  return {
    name: 'FourOhFour',
    path: '*',
    component: () => error(code),
  }
}
```

Because `*` matches every path, it must go at the end of the route list. This project registers it with `addRoute` once initialisation has finished:

```js
router.addRoute(abort())
```

## Case 2: the initialisation APIs

When you enter the system, it loads several pieces of base data. Originally they were awaited one by one:

```js
async function getData() {
  await store.dispatch('getFormatInGroups')
  await store.dispatch('setCityLists')
  await store.dispatch('setPaymentType')
  await checkLogin()
  await getUserRoles()
}
```

This has two problems:

- **Sequential**: the total time is the sum of every API call.
- **No error handling**: if any one fails, nothing after it runs, and nobody catches the error.

These pieces of data are independent and don't need to wait for each other, so I made them run in parallel and added error handling:

```js
async function getData() {
  try {
    await Promise.all([
      store.dispatch('getFormatInGroups'),
      store.dispatch('setCityLists'),
      store.dispatch('setPaymentType'),
      checkLogin(),
      getUserRoles(),
    ])
    router.addRoute(abort())
  } catch (error) {
    console.error('資料載入錯誤：', error)
  }
}
```

### What to watch out for when switching to Promise.all

`Promise.all` isn't just a matter of swapping out the `await`s:

- **Things with dependencies can't run in parallel.** If B needs A's result, keep them in order.
- **One failure goes straight to `catch`**, and you don't get the other successful results either.

If you want the rest of the data to stay usable when some calls fail, use `Promise.allSettled` instead:

```js
const results = await Promise.allSettled(tasks)
const failed = results.filter(r => r.status === 'rejected')
```

The code above has one more thing that could be improved: `addRoute` sits inside the `try`, so if initialisation fails, the 404 route is never registered. If I did it again, I would move it to `finally`, or register it when the router is created, so the 404 doesn't depend on the APIs.

## Case 3: duplicate logins

When a user who was already logged in logged in again, the API returned a failure message, but the code didn't handle that case. It just showed "missing required permission information", and then the screen went blank.

The fix was to tell the failure reasons apart:

```js
if (result.message?.includes('已登入')) {
  alert(result.message)
  await router.push({ name: 'Dashboard' })
} else {
  alert('登入失敗，請稍後再試。')
}
```

Checking the message text isn't ideal; an explicit error code from the backend would be more reliable. But without touching the backend, this solved the problem for now.

## While I was at it: expired passwords

Logging in could also hit an expired password. Before, the user would just get stuck, so I added a dialog for setting a new password: it opens when the backend returns the expired status and closes once the update succeeds, so the user doesn't have to leave the login flow.

## What I learned

- A blank screen usually means some case isn't handled. The code isn't broken; the flow just has no ending.
- For every flow, think about the screen when it fails: page not found, API failure, unexpected state.
- Before turning sequential calls into parallel ones, check the dependencies between the data.
- Catching the error is only the first step; the user also needs to see a result.

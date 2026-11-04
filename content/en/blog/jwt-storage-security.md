---
title: 'Where to Store a JWT: From localStorage to Cookies + a CSRF Token'
description: Comparing storing a JWT in localStorage versus an HttpOnly cookie, the XSS and CSRF risks involved, and how a real project switched to cookies plus a CSRF token, with the pitfalls along the way.
date: 2026-09-30
category: quality
tags: [JWT, CSRF, XSS]
readingTime: 9
---

My first full-stack project, a gaming meetup platform, stored the JWT in Pinia and persisted it to localStorage. It was simple: just put it in the `Authorization` header on every request. At the time my understanding of authorisation was still thin, and I didn't think much about it.

Later, while building the LINE OA management platform, whose admin can manage the content and account permissions of several shops, a stolen login credential would do far more damage, so I switched to an HttpOnly cookie plus a CSRF token. This note covers the risks of both approaches and the problems I hit while implementing it.

## The risk of JWT + localStorage: XSS

localStorage is simple, but **any JavaScript running on the page can read it**.

XSS (cross-site scripting) means an attacker gets their own script to run on your site, for example through user input that wasn't handled properly, or a third-party package with malicious code injected. Once that happens, stealing the token takes one line:

```js
const token = localStorage.getItem('token')
```

Once the attacker sends the token back to their own server, they can impersonate the user elsewhere until the token expires. JWTs are usually stateless, so it is hard for the server to revoke one early after issuing it; the longer it is valid, the higher the risk.

## Moving it into an HttpOnly cookie

A cookie with `HttpOnly` can't be read by JavaScript, and the browser sends it automatically with requests:

```js
export const accessTokenCookieConfig = {
  httpOnly: true, // not readable from JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
}
```

On the frontend, axios needs `withCredentials: true` so that cross-origin requests include the cookie.

Now XSS can't steal the token. But the fact that "the browser sends it automatically" brings another problem.

## The risk with cookies: CSRF

CSRF (cross-site request forgery) is when a user who is logged into your site visits a malicious site, which quietly sends a request to your API. Because the cookie is sent automatically, the server thinks the user did it themselves.

The attacker doesn't need to read the cookie; they only need the browser to send it.

`SameSite` blocks most cases, but my cookie is set to `SameSite=None` in production, which doesn't restrict cross-site requests, so a CSRF token is still needed.

## Safari: frontend and backend must share a domain

I only found this problem when testing on a phone. When the frontend and backend are on completely different domains, for example the frontend on `xxx.pages.dev` and the API on `xxx.onrender.com`, the browser treats the cookie as a third-party cookie.

Safari blocks third-party cookies by default, even with `SameSite=None; Secure`. The result: the login API returned success, but the cookie was never stored, and the user stayed logged out.

I changed the domains so the frontend and backend use the same main domain, for example `admin.example.com` and `api.example.com`. The cookie is then no longer third-party, and Safari works normally.

## How the CSRF token works

At login, the backend generates a random value and puts it somewhere **the frontend can read**; from then on, every request that changes data has to include it in a custom header:

```js
// Frontend: send the CSRF token with every request
api.interceptors.request.use((config) => {
  if (authStore.csrfToken) {
    config.headers['x-csrf-token'] = authStore.csrfToken
  }
  return config
})
```

The backend checks that the values in the cookie and the header match:

```js
const a = Buffer.from(String(req.cookies.csrf_token))
const b = Buffer.from(String(req.headers['x-csrf-token']))

if (a.length !== b.length || !timingSafeEqual(a, b)) {
  return res.status(403).json({ success: false, message: 'CSRF invalid' })
}
```

A malicious site can get the browser to send the cookie, but it can't read the token, so it can't put it in the custom header. `timingSafeEqual` is used for the comparison so the content can't be guessed from response times.

## Access tokens and refresh tokens

I set the access token to 15 minutes, so even if it leaks, the window of impact is short. To keep users from having to log in again and again, it is paired with a 7-day refresh token.

I did a few more things for the refresh token:

- **Store only a SHA-256 hash in the database**: at first it was stored in plain text, and I changed it later. Even if the database leaks, no usable token can be obtained.
- **Rotate it on every refresh**: an old refresh token stops working once used.
- **Limit concurrent logins**: when the limit is exceeded, the oldest one is removed.

This also eases the problem of JWTs not being revocable early: delete the refresh token from the database, and the user has to log in again within 15 minutes at most.

## A pitfall: several requests getting 401 at once

A page usually sends several API requests at the same time. When the access token expires, they all get 401 at once and all call `/refresh` at once.

Because the refresh token rotates every time, once the first one succeeds, the other requests are holding the old token and get rejected, which triggers a logout that also clears the CSRF token, and every later request fails.

The fix is to allow only one refresh at a time and have other requests share its result:

```js
let refreshPromise = null

refreshPromise ??= authApi.post('/refresh').finally(() => {
  refreshPromise = null
})
const { data } = await refreshPromise
```

Another pitfall was multiple tabs. If every login generates a new CSRF token, the value held by other tabs no longer matches, so I changed it to reuse the existing one if there is one.

## Is it safe now?

There is no absolutely safe approach. An HttpOnly cookie only keeps the token from being stolen; if the site really has an XSS hole, the attacker can still send requests directly from the page. So the basics, such as handling input and managing dependencies, still have to be done.

| Approach | Main risk | Protection needed |
|---|---|---|
| JWT + localStorage | XSS steals the token | Prevent XSS, shorten validity |
| JWT + HttpOnly cookie | CSRF | SameSite, CSRF token |
| Plus a refresh token mechanism | More complex to implement | Rotation, hashed storage, handling concurrency |

## What I learned

- There is no best place to store it, only different risks. localStorage can't defend against XSS; cookies have to deal with CSRF.
- When I built the meetup platform, my grasp of authorisation was still thin, and I never changed that project back. Only when building an admin that manages several shops' data did I really start thinking about the impact of stolen credentials.
- Testing only on a computer isn't enough. I only found this problem by testing on a phone; cookie behaviour needs to be tested in Safari too.
- The more mechanisms, the more edge cases. What really took time wasn't adding the cookie, but handling concurrency and multiple tabs.

---
title: 'A Vulnerability Scan''s Warning: Why Not to Use @latest from a CDN'
description: A vulnerability scan reported a medium-risk cross-origin misconfiguration, which turned out to come from a single CDN import. The risks of third-party resources, and the trade-offs of self-hosting them instead.
date: 2026-03-06
category: quality
tags: [Security, CDN, Vite]
readingTime: 5
---

When a company project went through a vulnerability scan, the report listed a medium-risk item: "cross-origin misconfiguration". At first I assumed it was the backend's CORS settings, but after tracking it down it turned out to be related to an icon font loaded by the frontend.

## The problem was one @import line

To use Material Design Icons, the project had a CSS file that loaded the icons from a CDN:

```css
@import url("https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css");
```

This line is convenient and very common, but it has several problems.

## The risks of third-party resources

### 1. Your site depends on someone else's server

The CSS and fonts on the CDN are loaded from another domain. If the CDN has an outage, or the user's network blocks that domain, none of the icons show up.

For organisations with restricted networks this happens especially easily, and you can't see it at all during development.

### 2. `@latest` means the content can change at any time

`@latest` isn't a fixed file; it means "whatever the latest version is right now". That means:

- When the package releases a new version, your site's content changes without you deploying anything.
- If the new version renames icons, the screen can suddenly break while the code hasn't changed at all.
- If malicious content is injected upstream, your site loads it directly.

CSS can't run JavaScript directly, but third-party content being able to affect your screen is a trust issue in itself.

### 3. No integrity check is possible

Browsers support Subresource Integrity (SRI), which checks whether a file's content has been altered:

```html
<link
  rel="stylesheet"
  href="https://cdn.example.com/lib@1.2.3/style.css"
  integrity="sha384-..."
  crossorigin="anonymous"
>
```

But SRI compares the hash of fixed content. The content behind `@latest` changes, so the check fails as soon as it updates. And when loading through CSS `@import`, there is nowhere to put `integrity` anyway.

## The fix: host it yourself

The fix is simple: put the CSS and font files in the project and serve them from your own server.

```text
src/assets/
├── customized/
│   └── materialdesignicons.min.css
└── fonts/
    ├── materialdesignicons-webfont.woff2
    └── materialdesignicons-webfont.woff
```

Change the entry file to load the local CSS:

```js
// main.js
import './assets/customized/materialdesignicons.min.css'
```

Then point the `@font-face` paths in the CSS to the local fonts. Now every resource comes from the same origin and the version is fixed; it only changes when you replace it by hand.

## What it costs

Self-hosting isn't free:

- The font files aren't small, and the project now has to take care of caching and serving them.
- The version doesn't update automatically, so you have to keep an eye out for security fixes yourself.
- The CSS file goes into version control. This one alone is over twenty thousand lines.

If I did it again, I would install a fixed version of `@mdi/font` from npm:

```js
import '@mdi/font/css/materialdesignicons.min.css'
```

The bundler takes care of the font paths and the version is recorded in `package-lock.json`, which is easier to maintain than copying files by hand. If you only use a few icons, you can also switch to SVGs and bundle only what you need.

Modern browsers all support woff2, so keeping just woff2 is usually enough; there is no need to bring along eot and ttf.

## How to check the project for similar problems

```bash
# Find external resources in the code
grep -rnE "https?://" src index.html

# Pay special attention to imports without a fixed version
grep -rn "@latest" src index.html
```

You can also open the Network panel in DevTools and filter by third-party domains to see which resources are actually loaded.

## What I learned

- A vulnerability scan finding isn't necessarily where you think it is; trace it to the actual source.
- A convenient one-line import means trusting a third party. Think about whether that is worth it before going live.
- Don't use `@latest` in production; only a fixed version lets you know what your site actually loads.

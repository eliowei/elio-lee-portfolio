---
title: 'From Rejection to Pass: Notes on Fixing a Website for an Accessibility Audit'
description: A website went through several rejections in its accessibility audit before finally passing at level A. How I actually fixed alt text, heading levels, keyboard operation, form labels, skip links and accesskey landmarks.
date: 2026-05-13
category: quality
tags: [Accessibility, Vue 3, Vuetify]
readingTime: 9
---

This was the longest fix I have worked on: a Vue 3 + Vuetify website had to go through an accessibility audit. Earlier in the project it had already been checked and fixed over several rounds with FreeGo, Taiwan's automated accessibility checker. I took over the results of the manual audit and the fixes after each rejection; it was rejected several times before it earned the level A badge.

At first I thought accessibility meant adding `alt` and `aria-label`. Only after finishing did I realise it tests the structure of the whole site, and that passing an automated tool like FreeGo doesn't mean you will pass the manual audit. This note groups what I fixed by type of problem.

## Semantics and basic information

### Page language

Screen readers decide which language to read in based on `lang`. The project's default `en` caused Chinese content to be handled the wrong way:

```html
<html lang="zh-Hant">
```

### The page title has to change with the page

In a single-page app, the title doesn't change on its own when the route changes. Users can't hear that the page changed, so I set titles in the routes and update them in one place:

```js
{
  path: '/member-login',
  meta: { title: '會員中心 > 會員登入' },
}

router.afterEach((to) => {
  document.title = `${to.meta.title} | 網站名稱`
})
```

### Heading levels

This was the item rejected most often. The audit looks at the document outline, not the font size.

Vuetify's `text-h3` is only a style and doesn't make something a real heading. Many things looked like headings but were actually `div`s; in other places `<h1>` was used just to get large text. The fix is to separate visuals from semantics:

```html
<!-- The tag decides the semantics, the class decides the size -->
<h1 class="text-h5">會員中心</h1>
<h2 class="text-h3">會員登入</h2>
```

The rule is one `h1` per page, with no skipped levels.

I also removed patterns like `<h1 role="alert">`. `alert` makes the screen reader interrupt the user immediately, which isn't appropriate for an ordinary heading.

## Alternative text

Not every image needs alt text:

- **Informative images**: describe the content.
- **Purely decorative images**: set `alt` to an empty string so screen readers skip them.

```html
<!-- Before: the screen reader reads out something meaningless -->
<v-img alt="登入頁插圖" src="login.svg" />

<!-- After: decorative images don't disturb the user -->
<v-img alt="" src="login.svg" />
```

This is counter-intuitive. Omitting `alt` isn't the same as `alt=""`; the former may cause the file name to be read out.

## Links and buttons must state their purpose

Text such as "Download", "<" or ">" tells you nothing when heard on its own. Buttons need names that make sense in isolation:

```html
<v-btn icon="mdi-chevron-left" aria-label="上一項說明" />
<a href="manual.pdf" aria-label="下載手機版操作手冊 PDF">下載</a>
```

## Forms

### Say that a field is required

A red asterisk alone isn't necessarily announced by the screen reader, so I put "required" in the label text:

```html
<v-text-field>
  <template #label>
    <span>驗證碼(必填)</span>
  </template>
</v-text-field>
```

### Labels must be associated with their fields

Every field needs a matching `label`. Fields like the CAPTCHA, where the label was dropped to save space, are easily flagged.

### Date fields must work with the keyboard

Vuetify's date picker needed keyboard operation and focus management added; I wrote about that separately in "Making the Vuetify Date Picker Work with the Keyboard and Screen Readers".

## Keyboard users: skip links

People using only the keyboard have to Tab through the whole menu on every page before reaching the content. So every page needs a link at the very top, hidden normally and shown when focused with Tab:

```css
.skip-link {
  position: absolute;
  top: -100px;
}

.skip-link:focus {
  top: 0;
}
```

```js
function skipToMain() {
  document.getElementById('main-content')?.focus()
}
```

The main content needs `tabindex="-1"` to receive programmatic focus:

```html
<main id="main-content" tabindex="-1">...</main>
```

## Accesskey landmarks: jumping to regions quickly

In Taiwan's accessibility guidelines, pages carry `:::` markers (known as "guide bricks") that let users jump to the main regions with shortcut keys. The common convention is:

| Shortcut | Region |
|---|---|
| Alt + U | Top region |
| Alt + C | Main content in the middle |
| Alt + Z | Bottom region |

They are implemented with `accesskey`:

```html
<a accesskey="C" href="#C" title="中間主要內容">:::</a>
```

The syntax isn't hard, and some pages in the project already had them; what really took time was filling in the rest. The audit requires these markers on every page, but the existing pages weren't designed with that in mind and their layouts all differed, so adding one shared component wasn't enough.

I had to adjust page by page: some needed the title area re-laid out, others needed positioning to fit into the existing layout, all while watching that the mobile version didn't squeeze the content. The markers also had to be consistent in position and style on every page, so users don't have to look for them again on each new page.

That alone touched twenty files. If the top, middle and bottom regions had been built into the shared page layout from the start, this would have been a change in one place. The usage instructions also have to explain the shortcuts clearly so users know how to use them.

## What I learned

- Accessibility is a structural problem, not a few attributes added at the end. The later you deal with it, the more pages you have to change.
- Automated tools like FreeGo only catch some problems; only walking through with a keyboard and a screen reader is reliable.
- Think about visuals and semantics separately; looking like a heading doesn't make something a heading.
- Get shared components right first, and you save fixing many pages later.
- Rejections aren't a bad thing. Every rejection made it clearer to me where the problems were.

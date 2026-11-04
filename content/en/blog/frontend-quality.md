---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: 'Frontend Engineering and Quality: Testing Strategy, Accessibility and Web Vitals'
description: Testing, automated verification, accessible design, performance optimisation and how to think about maintaining large projects.
date: 2026-06-18
category: quality
tags: [Testing, Accessibility, Web Vitals]
readingTime: 8
---

When I used to build web pages, I would usually first check whether the features worked and whether the screen looked as expected.

But as I worked on more projects, I started to notice that working features don't mean a page has no other problems.

Whether a change broke existing features, whether users can complete tasks with the keyboard, whether the page loads quickly enough: these details are easy to overlook during development, but they really affect the user experience.

This note covers three common aspects of frontend quality: testing strategy, accessibility and performance metrics.

## 1. Testing strategy: test behaviour, not implementation

Frontend tests commonly fall into three layers:

| Layer | Example tool | What it verifies | Cost |
| --- | --- | --- | --- |
| Unit tests | Vitest | Functions, utilities, isolated logic | Low |
| Component tests | Vue Test Utils | The component output the user sees | Medium |
| End-to-end tests | Playwright | Complete flows (login, ordering and so on) | High |

The principle for component tests is "interact like a user and check what the user can see", not checking variable names inside the component.

For example, with Vue Test Utils and Vitest:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('increments the displayed number when the button is clicked', async () => {
    const wrapper = mount(Counter)

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('1')
  })
})
```

What this test cares about is whether the screen updates correctly after the user clicks the button, not which variable the component uses internally.

### Where to draw the line with mocks

Mocks are best placed as close to the system boundary as possible.

For example, use MSW to mock API responses rather than mocking your own internal functions or component state.

If you mock away internal code too, the test may end up verifying the mock itself rather than the application's actual behaviour.

## 2. Accessibility: start with the keyboard

Accessibility isn't just a visual design issue; it is about whether users can operate the page at all.

The easiest way to start checking is to try using the page with only the keyboard:

- Does `Tab` reach every interactive element in a sensible order?
- Is it clear where focus currently is? (Don't remove `outline`, or use `:focus-visible` for custom styles.)
- When a dialog opens, does focus move into it? Can `Esc` close it? Does focus return to the original button afterwards?
- Use semantic elements such as `<button>`, `<a>` and `<label>`, rather than `<div>`s with click handlers everywhere.

For example:

```css
:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
```

This gives the focused element a clear visual indicator during keyboard use.

Automated tools (such as axe) catch some accessibility problems, but they can't judge whether a flow makes sense, so manual keyboard checks are still needed.

## 3. Performance: Core Web Vitals

Google's Core Web Vitals currently consist of three metrics:

| Metric | Measures | Good |
| --- | --- | --- |
| LCP (Largest Contentful Paint) | Time to render the largest content | ≤ 2.5 s |
| INP (Interaction to Next Paint) | How quickly the screen responds to interaction | ≤ 200 ms |
| CLS (Cumulative Layout Shift) | How much the layout shifts | ≤ 0.1 |

They reflect page loading, interaction responsiveness and visual stability respectively.

### Common ways to improve

- **LCP**: serve the largest image in a suitable format and size, raise the loading priority of the main content (for example with `fetchpriority="high"`), and reduce render-blocking resources.
- **INP**: break long-running JavaScript into smaller pieces to avoid blocking the main thread.
- **CLS**: give images and embeds `width`, `height` or `aspect-ratio` in advance so the browser reserves space for them.

For example:

```html
<img
  src="/cover.webp"
  width="1600"
  height="728"
  alt="Project cover"
  fetchpriority="high"
/>
```

With the image size specified up front, the browser can reserve space before the image loads, reducing the chance of a layout shift once it arrives.

## 4. Thinking about maintenance in large projects

As a project grows, quality can't depend on developers checking things themselves.

I think you can start from a few directions:

- **Make errors surface early**: TypeScript, ESLint and typed API responses catch errors while editing and committing.
- **Small, reversible changes**: small changes are easier to review and easier to roll back.
- **Turn rules into tools**: whatever CI can check automatically (formatting, types, tests) shouldn't rely on people remembering.
- **Leave the "why"**: comments and documentation recording the reasons for decisions let whoever takes over judge when something can be changed.

You don't have to adopt a full engineering process from the start; these can be built up gradually according to the project's size and the team's needs.

## What I learned

When I used to build web pages, I would usually first check whether the features worked and whether the screen looked as expected. But as I worked on more projects, I started to notice that working features don't mean a page has no other problems.

Whether users can complete tasks with the keyboard, whether a change broke existing features, whether the page loads quickly enough: these details are easy to overlook during development, but they really affect the user experience.

Testing, accessibility and performance optimisation look like different things, but they all deal with the same question: how to make finished features not just work, but keep their quality over time.

I have also come to understand that engineering quality isn't something you check once the project is done; verification should be part of the process while developing and changing code.

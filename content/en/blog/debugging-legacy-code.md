---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: 'Debugging an Existing System: From Reproducing the Problem to Preventing It'
description: How to work through problems in legacy code you didn't write, step by step, with a clear minimal reproduction, breakpoints and decoupling components.
date: 2026-01-15
category: case
tags: [Debugging, Legacy Code, DevTools]
readingTime: 7
---

When taking over an existing system, the hardest part is often not the technology but "not knowing what changing this will affect".

Especially with unfamiliar code, changing things as soon as you see a problem easily fixes only the surface without really solving it.

Over time I found that in these situations, rather than rushing to find which line is wrong, it matters more to first set up a clear debugging process: **reproduce, locate, find the cause, fix, prevent**.

This note collects the directions of thinking I use when maintaining existing systems.

## 1. Reproduce: make the problem happen reliably

If you can't reproduce a problem reliably, you can't prove it is fixed even after fixing it.

So the first step isn't changing code, but confirming the conditions under which the problem happens:

- Which page, which sequence of actions, which data?
- Does it only happen in a particular browser, screen size or user role?
- Can you narrow it down to a minimal reproduction? If you remove unrelated code and the problem is still there, you have narrowed the scope correctly.

If the problem only happens under certain conditions, write those conditions down, so you don't test a different scenario each time and end up unable to tell whether a change actually worked.

## 2. Locate: narrow it down by bisection

Once the problem can be reproduced, the next step is finding where it happens.

I usually start with the browser's DevTools:

- **Console**: check for errors or warnings first; they often point straight in the right direction.
- **Network**: check whether the request was sent, its status code, and whether the response is as expected.
- **Elements**: look at the CSS actually applied, and whether the rule you care about is being overridden.
- **Sources**: set breakpoints at suspicious places, or use Event Listener Breakpoints to pause when a specific event fires.

Don't start by reading through the whole project's code.

First establish whether the problem happens in the frontend interaction, the API request, or after the data comes back, then narrow it down step by step.

## 3. Find the cause: verify hypotheses instead of guessing

Common causes of UI behaviour problems can be checked against a list first:

| Symptom | Common cause | How to verify |
| --- | --- | --- |
| A popup or outer UI closes immediately, or won't close | Event bubbling or event order; a parent intercepts the click | Log the event path in the capture phase |
| A component value doesn't update | Lost reactivity (destructuring, a non-reactive object) | Check in DevTools whether the value is still reactive |
| A style change has no effect | Lower selector specificity, or overridden by a rule of equal weight | Look at the overridden rules in the Elements panel |
| An overlay is hidden behind something | A stacking context makes `z-index` ineffective | Check ancestors for `transform`, `opacity` and similar |
| Intermittent errors | Async timing or request races | Add timestamped logs and compare the order |

For example, to find out which layer is intercepting a click, you can watch the event path in the capture phase:

```js
document.addEventListener('click', (e) => {
  console.log('capture:', e.target, e.composedPath())
}, true)
```

This shows which elements the event actually passes through before you decide whether to change how events are handled.

The point is not to apply a familiar fix as soon as you see a symptom, but to form a hypothesis and verify it with tools.

## 4. Fix: keep the scope small and assess the impact

Finding the cause doesn't mean you can make sweeping changes straight away.

Before changing anything, answer three questions:

1. Where else is this code used? (Search globally, look at references.)
2. Which existing behaviours will the change alter?
3. Is there a smaller change? For example, fixing the component itself rather than patching every caller.

Existing systems usually lack thorough tests, so after a change it is even more important to manually walk through the affected flows, not just the one scenario that was reported.

For example, when fixing event behaviour in a shared component, it isn't enough to check that the current page works; also check that other pages using the component aren't affected.

## 5. Prevent: keep the same problem from happening again

Once the problem is fixed, you can think one step further: can you make it easier to catch next time?

- Add a test that reproduces the original problem; without a test environment, at least write the reproduction steps in the PR description.
- Whatever a tool can catch, turn into a rule, such as an ESLint rule or constraints on a component's props.
- Record the context in code comments or documentation, describing *why* it was done this way, not *what* was done.

These don't all have to be done at once, but they gradually lower the chance of the same problem coming back.

## What I learned

When maintaining an existing system, the most common trap is wanting to fix a problem as soon as you see it. But without first understanding the conditions under which it happens and how the original code runs, it is easy to fix only the surface, or even break other features that used to work.

Writing this down, I realised that debugging isn't just finding where an error happens; what matters more is understanding why it happens, and whether the change will cause other effects.

Especially with unfamiliar code, narrowing the problem down and confirming the cause before deciding how to change it is usually more efficient than rushing in.

For me, maintaining an existing system is also a way of understanding program design. Besides getting things working again, it is worth thinking about how to keep the same problem from happening again.

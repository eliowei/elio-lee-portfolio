---
title: 'One Change, Several Projects: Lessons from Maintaining Multiple Frontends'
description: My company maintains several Vue 2 and Vue 3 frontends at once, so one requirement often has to be implemented several times. The problems I ran into, the changes I missed, and when it is actually worth extracting a shared module.
date: 2026-08-11
category: quality
tags: [Maintenance, Vue 2, Vue 3]
readingTime: 5
---

At work I don't maintain one frontend but several: a Vue 2 + Vuex project, a Vue 3 + Pinia project, and systems with separate desktop and mobile versions. They serve the same business, so one requirement often has to be implemented several times.

This is something you don't learn in class. Here is what I have actually run into.

## The same requirement, done several times

A few real examples:

- Changing the name field at sign-up: both the desktop and mobile versions had to change.
- Returning to the original page after login: implemented once in each version.
- Renaming image files from Chinese to English: every project had to be handled.
- Accessibility fixes: several projects had to comply.

The idea behind each change is the same, but the implementation can't always be copied:

| Difference | Vue 2 project | Vue 3 project |
|---|---|---|
| State management | Vuex | Pinia |
| UI component library | Vuetify 2 | Vuetify 3 |
| Router | Vue Router 3 | Vue Router 4 |

Take the 404 route: Vue Router 3 uses `path: '*'`, while Vue Router 4 needs `/:pathMatch(.*)*`. Same idea, different code, and it has to be tested again.

## The biggest risk is missing a spot

With more changes, the time spent is not the worst part; the real problem is missing something.

It happened to me: I once removed the name-splitting logic from the sign-up page and testing passed, only to find out later that the profile-completion form on the login page had the same logic. Both projects were like that.

The reason was simple: the same logic was written twice within one project, and again in each project. The ticket only said "sign-up", so I only changed sign-up.

## What I do now

### Search before touching anything

Before changing anything, I search every project for the same functions and keywords to see what is affected:

```bash
grep -rn "splitName" src
```

Changing only the file in front of you is the easiest way to miss something.

### Keep a feature list for each project in Notion

After that missed change, I started listing each project's features in Notion, for example sign-up, login, profile completion and member profile.

When a requirement comes in, I check it against the list to see which features are affected, and when testing I walk through the list item by item. That way a change like the name field is not only tested on the sign-up page; the profile-completion form on the login page is in the test scope too.

The list is only useful if it is kept up to date. If you add to it whenever you add a feature, it becomes a test scope that doesn't depend on memory.

### Finish everything in one go

I try to handle the same requirement in every project on the same day. Leave it too long and you forget the context, and versions are more likely to drift apart.

## When to extract a shared module

When you see duplication, the first instinct is usually to extract a shared package. But I no longer do that right away.

**Good candidates for extraction**:

- Framework-independent logic, such as date formatting or data validation.
- Rules that really are identical and always change together.
- Logic shared by several pages in the same project, such as keyboard support for a date picker, can be extracted into a mixin or composable first.

**Not worth extracting yet**:

- Screens tied to a UI component library; Vuetify 2 and 3 are very different.
- Things that only look alike for now, but whose requirements will grow in different directions.

Shared modules have costs too: you have to deal with versions and releases, and one change can affect every project. Sharing components between Vue 2 and Vue 3 is especially hard.

My rule of thumb: extract it within the project first, make sure it is stable and really changes in several places together, and only then consider sharing it across projects.

## What I learned

- When maintaining several projects, "knowing where to change" takes more time than "how to change".
- Searching is the cheapest safeguard.
- Duplicated code doesn't have to be removed immediately; the wrong abstraction is harder to maintain than duplication.
- The scope written on the ticket is not necessarily the scope that is actually affected.

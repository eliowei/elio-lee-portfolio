---
title: I Wrote a Name Splitter, Then Removed It from Sign-up Two Months Later
description: To support Indigenous names at sign-up, I wrote rules to split a full name. The problems with those rules, and how the team decided not to split names at all and store a single field instead.
date: 2026-02-25
category: case
tags: [Forms, Refactoring, Edge Cases]
readingTime: 4
---

The requirement: the name field at sign-up had to support the names of Taiwan's Indigenous peoples. Indigenous names can't always be split into a one-character surname followed by a given name, and some are joined with an interpunct `·`. So the form was changed to a single "Name" field, but the backend still expected two values, `first_name` and `last_name`.

My first idea was the obvious one: write a function that splits the name the user enters. Two months later, I deleted that logic from the sign-up flow.

## The splitting rules at the time

I wrote a few rules based on common name formats:

1. If there is an interpunct `·` or a space, split at the first one.
2. If it starts with a Chinese character, use the first character as the surname and the rest as the given name.
3. Otherwise, put the whole string into one field.

In code, it looked roughly like this:

```js
function splitName(name) {
  const trimmed = name.trim()
  const index = trimmed.search(/[·\s]/)

  if (index !== -1) {
    return {
      surname: trimmed.slice(0, index),
      givenName: trimmed.slice(index + 1),
    }
  }

  if (/^[一-龥]/.test(trimmed)) {
    return { surname: trimmed[0], givenName: trimmed.slice(1) }
  }

  return { surname: trimmed, givenName: '' }
}
```

When I tested it with "王小明", the result was exactly right, and everything looked fine.

## The problem: the rules are never finished

Names aren't a format you can describe with a few rules:

| Input | Split result | Problem |
|---|---|---|
| 歐陽小明 | 歐 / 陽小明 | Two-character surname split apart |
| 范姜小明 | 范 / 姜小明 | Two-character surname split apart |
| 張李小明 | 張 / 李小明 | Can't tell whether it's a double surname |
| 瓦旦·達路 | 瓦旦 / 達路 | The order isn't necessarily surname first |
| John Smith | John / Smith | English puts the given name first |
| Mary Ann Smith | Mary / Ann Smith | What about middle names? |

You could of course keep adding rules, such as a list of two-character surnames, but a case like "張李" simply can't be decided from the string alone. The code was only guessing, and what it guessed wrong was the user's name.

## The final fix: after discussion, the team decided not to split

The original plan was to split the name and store the parts. Later the team discussed it, checked the database fields, and found that splitting wasn't necessary at all: after receiving the surname and given name, the backend joined them straight back into one full name before saving. The frontend worked hard to split it and the backend joined it back together, so splitting added no value.

So at sign-up, whatever the user types is now stored as is:

```js
// Before
const { surname, givenName } = splitName(form.name)

// After
const payload = {
  last_name: form.name,
  first_name: '',
}
```

This change deleted over 40 lines and left just two. The database fields weren't changed, so the full name goes into `last_name` and `first_name` is left empty.

It isn't the prettiest data structure, but the system no longer has to guess which part is the surname, and Indigenous names are stored in full.

## When splitting is actually needed

The data still stores the full name, and it is only split when that is genuinely needed. For example, to show "Hello, Mr. Wang", it is split automatically at the point of use, with adjusted rules:

- If there is an interpunct `·` or a space, split at the first one.
- For a Chinese name without symbols, use the first character as the surname.
- When it can't be decided, show the full name.

The biggest difference from before is that the split result is only used for display and never written back to the database. Even if a rule guesses wrong, the full name is still there; adjusting the rule later fixes it, without leaving wrongly split data behind.

If the surname and given name matter for something important, such as matching against ID documents, rules aren't appropriate; let users fill in the parts separately.

## What I learned

- All test data passing doesn't mean the rules are right. I had only thought of "王小明".
- With real-world data like names and addresses, question your own assumptions first.
- When a rule keeps needing exceptions, first ask whether that code should exist at all.
- Before starting, confirm with the team how the data is actually used; after discussing it, you often find you don't need to do as much.
- Deleting code is also a fix, and often the best kind.

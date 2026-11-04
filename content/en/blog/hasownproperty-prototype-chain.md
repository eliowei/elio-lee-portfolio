---
title: hasOwnProperty and the Prototype Chain, Seen Through One TypeError
description: After adding a new data type, the map data processing suddenly threw an error. Tracking it down, I also sorted out the prototype chain, why hasOwnProperty should be called through Object.prototype, and what actually caused the error.
date: 2025-10-15
category: js
tags: [JavaScript, Prototype, Debugging]
readingTime: 5
---

A project once added a new image type, and after the feature was finished, the code that processes query results started throwing errors. This code maps the field names returned by the API to the names the screen uses, depending on the image type:

```js
const mapFields = (obj) => {
  for (const field in obj) {
    if (obj.hasOwnProperty(field) && mappings[obj.imagetype][field]) {
      obj[mappings[obj.imagetype][field]] = obj[field]
    }
  }
}
```

To fix it, I changed the condition to this:

```js
if (
  Object.prototype.hasOwnProperty.call(obj, field) &&
  mappings[obj.imagetype] &&
  mappings[obj.imagetype][field]
) {
  // ...
}
```

Two things changed here, but they solve different problems. At first I mixed them up; only later did I sort them out.

## First, understand the prototype chain

When a JavaScript object looks up a property it doesn't have, it looks in its prototype one level up, all the way to `Object.prototype`, and finally `null`.

```js
const obj = { name: 'Elio' }

obj.name            // an own property
obj.toString()      // not on the object itself; comes from Object.prototype
```

That is the prototype chain. `hasOwnProperty` isn't the object's own method either; it is inherited from `Object.prototype`.

It tells you whether a property is the object's **own**, which matters in `for...in`, because `for...in` also visits enumerable properties on the prototype chain.

## Why not just call obj.hasOwnProperty

Normally `obj.hasOwnProperty()` works fine, but there are two cases where it breaks.

**The object has no prototype:**

```js
const obj = Object.create(null)
obj.hasOwnProperty('a') // TypeError: obj.hasOwnProperty is not a function
```

**The object has a field with the same name:**

```js
const obj = { hasOwnProperty: 'oops' }
obj.hasOwnProperty('a') // TypeError
```

When data comes from an API, you can't guarantee the field names, so the safer way is to use the method on the prototype directly and set the target with `call`:

```js
Object.prototype.hasOwnProperty.call(obj, field)
```

That way it doesn't depend on what the object itself has. ESLint's `no-prototype-builtins` rule checks exactly this.

These days you can also use `Object.hasOwn`:

```js
Object.hasOwn(obj, field)
```

## What actually caused the error

However, this TypeError wasn't actually caused by `hasOwnProperty`, but by this part:

```js
mappings[obj.imagetype][field]
```

The new image type had no matching configuration, so `mappings[obj.imagetype]` was `undefined`, and reading `[field]` from it throws:

```text
TypeError: Cannot read properties of undefined
```

So what fixed the error was this extra check:

```js
mappings[obj.imagetype] &&
```

It can also be written with optional chaining:

```js
mappings[obj.imagetype]?.[field]
```

`Object.prototype.hasOwnProperty.call` was a robustness improvement made along the way. Both changes are good, but if an interviewer asks "why did it break", the answer is the former.

## Beyond skipping it, should you warn?

Optional chaining keeps the program from crashing, but it can also hide the problem. If someone forgets to add the configuration for a new image type, its fields silently go unmapped and the screen is just missing data.

If this is something that "should never happen", leaving a warning in development is better:

```js
if (!mappings[obj.imagetype]) {
  console.warn(`缺少影像類型對應：${obj.imagetype}`)
  return
}
```

## What I learned

- `hasOwnProperty` comes from the prototype chain; calling it directly depends on whether the object has that method.
- When you see a TypeError, first find out what is `undefined`; don't just look at the most eye-catching method on that line.
- When adding a new type, find every place that depends on a type lookup.
- No error doesn't mean no problem; think about what you want to see when it fails.

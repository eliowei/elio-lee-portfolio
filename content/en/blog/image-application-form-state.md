---
title: 'Designing Dynamic Vue Forms: Mutually Exclusive Conditions, Per-Group Reset and Multi-Group Data'
description: Using a standalone product search form to explain switching conditions, resetting data and validation, stable keys and ref mapping, and how form validation APIs differ between Vuetify 2 and 3.
date: 2026-11-17
category: vue
tags: [Vue 2, Vue 3, Vuetify, Forms]
readingTime: 8
---

A dynamic form looks like it just shows different fields depending on an option, but once there are many conditions, there is more to handle than the screen. After switching modes, should the old data be cleared? Will resetting one group affect the others? After deleting an item in the middle, do the validation messages still line up?

This post works through these questions with a self-designed "multi-condition product search form". Users can search by listing date or by product code, and can add several groups of conditions.

> The scenario, data structures and code in this post are standalone teaching examples. They don't correspond to the business flow of any specific project, and they are not a complete runnable demo.

## 1. Why a Dynamic Form Needs to Manage Mutually Exclusive Conditions

In the example, each group of conditions can use only one search mode:

| Mode | Data used | Data no longer used after switching |
| --- | --- | --- |
| By listing date | Date value and display text | Product code |
| By product code | Product code | Date value and display text |

You can show the matching fields with `v-if`, but it only controls whether a component exists. It doesn't clear the data that lives in an object in the parent.

If we only switch the screen and then submit the whole condition object, the values from the previous mode may be sent along with it.

So defining the state of each group of conditions comes before the layout. The sketch below uses the Options API to make it easy to compare the two Vue / Vuetify combinations:

```js
let nextConditionId = 0

function createCondition() {
  return {
    id: ++nextConditionId,
    mode: null,
    selectedDate: null,
    displayDate: "",
    productCode: "",
    datePickerOpen: false,
  }
}

// the component's data()
data() {
  return { conditions: [createCondition()] }
}
```

These fields are all declared when the condition is created. Each call produces a new object, so groups can't accidentally share one set of data. The incrementing ID is only for identifying items within a single page in this example; it is not a database ID or a cross-user identifier.

## 2. Resetting Data and Validation State Together When Switching

When the mode switches, keep the group's `id` and the newly chosen `mode`, and return everything else to its initial state. Resetting a single group clears `mode` as well.

```js
// the methods below go in the component's methods
clearConditionValues(condition) {
  Object.assign(condition, {
    selectedDate: null,
    displayDate: "",
    productCode: "",
    datePickerOpen: false,
  })
},

async changeMode(condition, newMode) {
  condition.mode = newMode
  this.clearConditionValues(condition)
  await this.$nextTick()
  this.resetConditionValidation(condition.id)
},

async resetCondition(condition) {
  condition.mode = null
  this.clearConditionValues(condition)
  await this.$nextTick()
  this.resetConditionValidation(condition.id)
},
```

`changeMode()` explicitly receives and sets the new mode, so it doesn't depend on the order in which `v-model` and events run. For example, a Vue 3 select can use `:model-value="condition.mode"` together with `@update:model-value="changeMode(condition, $event)"`; other components pass in the new value according to their own event contracts.

Clearing values and resetting validation are deliberately separate. After the data changes, the fields behind `v-if` may need to be recreated, so we wait for the next DOM update and then deal with the field components that exist at that point. `$nextTick` doesn't wait for an API, and it isn't a universal fix for every screen-update problem.

### A Data Value and Its Display Text Are Not the Same State

Suppose a date component uses a `Date`, but a text field shows `YYYY-MM-DD`. You may then need two pieces of state, `selectedDate` and `displayDate`. That is the component contract this example chose; it doesn't mean every date component needs it.

When a date is picked, both must be updated together, and a reset must clear both. Otherwise the screen may still show a date while the query data is already empty.

If the display text can be derived entirely from the date value, prefer a computed property or a formatting function, which leaves less state to keep in sync by hand. Keep a second value only when there is a real need for independent input or temporary state.

### Validation Refs Must Map to This Group

Below, the ref is built from the condition ID plus the field name, and the case where the ref doesn't exist after conditional rendering is handled. The example assumes the component provides `resetValidation()`; check the actual component API before relying on it.

```js
resetConditionValidation(id) {
  const fields = ["mode", "selectedDate", "productCode"]

  fields.forEach(field => {
    const ref = this.$refs[`condition_${id}_${field}`]
    const instances = Array.isArray(ref) ? ref : ref ? [ref] : []

    instances.forEach(instance => {
      instance.resetValidation?.()
    })
  })
},
```

This only resets field components that still exist and provide `resetValidation()`. After a `v-if` switch, the original field may already be unmounted. If validation state is stored elsewhere, such as in a parent form or another state store, it has to be cleared in line with the actual architecture.

The ref names in the template must match, for example `:ref="`condition_${condition.id}_productCode`"`. If the real component also validates the date display field, include that field too.

## 3. Adding, Deleting and Stable Keys in a Multi-Group Form

When adding a condition, create a new object. A reset keeps the original ID. Deleting finds the target by ID.

```js
addCondition() {
  this.conditions.push(createCondition())
},

removeCondition(id) {
  const index = this.conditions.findIndex(item => item.id === id)
  if (index !== -1) this.conditions.splice(index, 1)
},
```

The template uses the stable ID as the key:

```vue
<div v-for="condition in conditions" :key="condition.id">
  <!-- condition type and matching fields -->
  <button type="button" @click="resetCondition(condition)">Reset condition</button>
  <button type="button" @click="removeCondition(condition.id)">Delete condition</button>
</div>
```

If the array index is used as the key, then after deleting an item in the middle, the components after it may be reused to show a different record. For components that hold their own input or validation state, this is behavior to watch for. It doesn't mean every index key necessarily causes a bug. [Vue docs on maintaining state with key](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)

**A stable key and ref mapping have to be handled separately.** The key uses the ID, but if refs are still named `field_0`, `field_1`, the index shifts after a deletion still need to be managed. That's why this example keys both on the condition ID.

### The Query Is Built from the Condition Type

At submit time, make one more explicit choice of data, so the UI state isn't used directly as the query:

```js
// The example builds YYYY-MM-DD from the local calendar date, without converting to UTC
function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid date")
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toQuery(condition) {
  if (condition.mode === "date") {
    return {
      type: "date",
      date: condition.selectedDate ? formatDate(condition.selectedDate) : null,
    }
  }
  if (condition.mode === "code") {
    return { type: "code", code: condition.productCode.trim() }
  }
  throw new Error("Please choose a search mode")
}
```

Here `selectedDate` is the source of the date data, and `displayDate` is only for display. `formatDate()` is a formatting function defined for this example. It turns the local date into `YYYY-MM-DD`, so converting straight to a UTC string doesn't cross a day boundary. The real query format and time zone should follow the API contract.

This is only a sketch of tidying data after validation passes. It doesn't replace checks for required fields, format and date validity, and the backend still needs to validate the query it receives.

## 4. How Form Validation Differs Across Vue / Vuetify Combinations

When comparing Vue 2 + Vuetify 2 with Vue 3 + Vuetify 3, keep the responsibilities of the framework and of the component library apart. The differences below come from the Vuetify form API, not from Vue's reactivity.

In Vuetify 2, `validate()` returns a boolean. Taking Vuetify 3.6.13 as an example, `validate()` is an asynchronous function that, when done, returns an object with `valid` and `errors`.

If you want the current conditions to be filled in before the next group can be added, you can change the earlier add method to the following:

```js
// Vue 2 + Vuetify 2: sketch method
function addCondition() {
  const valid = this.$refs.form.validate()
  if (!valid) return
  this.conditions.push(createCondition())
}
```

```js
// Vue 3 + Vuetify 3: sketch method
async function addCondition() {
  const { valid } = await this.$refs.form.validate()
  if (!valid) return
  this.conditions.push(createCondition())
}
```

The two snippets are alternative implementations for different stacks, not to be put in the same methods block. Also confirm whether `form` points to the whole form or to a single group's form, since that decides the scope of validation.

Treating the Promise as a boolean can't tell you whether validation passed. For the return types and usage, see the [Vuetify 2 form API](https://v2.vuetifyjs.com/en/api/v-form/) and the [Vuetify form API](https://vuetifyjs.com/en/api/v-form/).

Bind the mode-switch event according to the component's contract too. The `change` of a custom select and the `update:modelValue` of another component shouldn't be treated as firing at the same moment just because they serve a similar purpose.

## 5. Testing the Order of Operations, and Some Takeaways

With a dynamic form, it isn't enough to test whether each field accepts input. You need to chain the operations together:

- Enter a date, then switch to product code, and confirm the date data and its validation state are cleared.
- Reset one group and confirm the others are unaffected.
- Add three groups with different data, delete the middle one, then operate the remaining fields.
- Reset the date and confirm the component value and the display text are cleared together.
- When validation fails, confirm nothing is added or submitted.
- After validation succeeds, confirm the query contains only the data the current mode needs.
- Use the keyboard to switch, reset and delete, and confirm focus can still move on.

These are the scenarios the example needs to verify. They don't mean a complete demo or automated tests already exist.

Form development isn't just adding fields. You also have to think about how conditions relate to each other, and how data and screen state stay consistent.

In an existing project especially, the same requirement may have to be built on different versions of a framework and component library. Rather than reusing the original approach as is, first confirm each project's data structures, component behavior and API differences, so problems aren't carried into the new flow.

---
title: 'From Vue Project Structure to Frontend Architecture: How Finely Should a Project Be Split?'
description: From the Vue project structure you meet while learning to architecture observed in real projects, how to split a frontend project by feature, component and responsibility, and how to balance maintainability against complexity.
date: 2025-09-10
category: vue
tags:
  - Vue
  - Frontend
  - Architecture
  - Project Structure
  - Engineering
readingTime: 15
draft: false
---

# From Vue Project Structure to Frontend Architecture: How Finely Should a Project Be Split?

When you start with Vue, you usually begin with a basic project structure:

- `components/`: components
- `views/` or `pages/`: pages
- `composables/`: reusable logic
- `services/`: API requests
- `stores/`: global state
- `utils/`: shared utility functions

For a project that is just starting out, this structure is usually enough.

But as features grow, a project may no longer have just a few pages and components; different business modules, data management, state handling and logic shared across pages gradually appear.

At that point, organising purely by technical type may start to cause problems:

- The code for one feature is scattered across different directories.
- The logic in a single page keeps getting more complex.
- The line between shared components and business components blurs.
- Different features start depending on each other.
- Changing one feature may require changing other places too.

This made me start to wonder:

**How far should a frontend project be split? And how do you decide whether a feature deserves to be managed on its own?**

This note starts from common Vue project structures, collects the different ways of organising code I have observed in real projects, and goes on to discuss the responsibilities of features, components, composables, services and stores, and what to consider when splitting modules.

---

## 1. Starting from the Vue project structure common while learning

Early on, Vue projects are usually organised by technical responsibility:

```text
src/
├── assets/
├── components/
├── composables/
├── router/
├── services/
├── stores/
├── utils/
├── views/
├── App.vue
└── main.ts
```

This structure has a few advantages:

1. Easy to understand: every folder has a clear purpose.
2. Easy to find things: when you need to change a component, an API call or state, you go straight to the matching directory.
3. Low maintenance cost at first: no extra directories for every small feature.

But as the project grows, you may run into something else.

For example:

```text
components/
├── Button.vue
├── UserTable.vue
├── UserForm.vue
├── PermissionDialog.vue
├── MapToolbar.vue
└── ReportChart.vue

composables/
├── useAuth.ts
├── usePermission.ts
├── useMap.ts
├── useReport.ts
└── useUser.ts
```

Every component and composable is grouped by technical type.

There is nothing wrong with that, but as features multiply, developers may have to jump between directories to understand the full flow of a single feature.

For example, to change member management, you might need to find all of:

- Member components
- Member data handling logic
- Member APIs
- Member state management
- Member type definitions

All of this code belongs to the same feature, yet it is spread across different places.

So once a project grows, you need to start thinking about whether to reorganise the code by business feature.

---

## 2. Different ways of organising code observed in real projects

After working with Vue projects of different sizes, I found that there isn't just one way to structure a project.

Some projects use `features/` as the main grouping, some use `modules/`, and some keep shared directories organised by technical responsibility.

The structures below are abstracted from what I observed, keeping only the folder levels for illustration; they don't represent the full directory of any particular project.

### Structure A: organised around features

```text
src/
├── app/
│   ├── pages/
│   ├── layouts/
│   └── router/
│
├── features/
│   ├── auth/
│   ├── permission/
│   ├── member/
│   ├── map/
│   └── workflow/
│
├── components/
│   ├── common/
│   ├── table/
│   ├── form/
│   └── map/
│
├── composables/
├── services/
├── stores/
├── constants/
├── types/
├── utils/
└── styles/
```

This approach gathers features with their own business responsibilities into `features/`.

Depending on the actual need, each feature can manage its own:

- Components
- Composables
- Services
- Stores
- Types

For example, permission-related components, logic and data handling can live together in `permission/`, rather than being scattered across global directories.

Directories such as `components/`, `composables/` and `services/` are then reserved for capabilities shared across features.

### Structure B: organised around modules

```text
src/
├── app/
│   ├── layouts/
│   └── router/
│
├── pages/
│   ├── home/
│   ├── system/
│   ├── report/
│   └── profile/
│
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── workflow/
│   └── map/
│
├── components/
│   ├── base/
│   ├── responsive/
│   └── ui/
│
├── composables/
├── services/
├── stores/
├── constants/
├── types/
├── utils/
└── styles/
```

This approach manages pages and feature modules separately.

`pages/` is mainly responsible for composing pages, while `modules/` manages modules with their own functional responsibilities.

For example, a page can combine different modules to present a complete user flow.

Structures like this may also split layouts and page organisation further for desktop, mobile or responsive needs.

### How do the two differ?

| Aspect | Structure A | Structure B |
| --- | --- | --- |
| Main grouping | Feature | Module |
| Page management | Inside app/pages | Separate pages |
| Feature management | features | modules |
| Shared components | components | components |
| Shared logic | composables, services | composables, services |
| Way of thinking | Centred on features | Pages and features managed separately |

Neither is absolutely better.

It is worth stressing that "feature" and "module" aren't two architectural patterns with a fixed, standard difference, nor are they directory names prescribed by Vue. Different teams may use different names for similar ways of organising features.

So the point of the comparison isn't the names themselves, but:

- How work is divided between pages and feature modules.
- Who owns a feature's code.
- Where shared capabilities live.
- How dependencies between modules are set up.

What really matters isn't what the folders are called, but whether each module has a clear responsibility and whether the dependencies between modules make sense.

---

## 3. How the responsibilities of pages, sections, components and features differ

Once you start splitting a project, the question you hit first is:

**What belongs in a page? When should something become a component? And when does it need to become its own feature?**

I start by looking at their responsibilities.

### Page: composing the page

A page usually corresponds to a route, a screen the user can navigate to.

Its main jobs are:

- Composing different components.
- Managing page-level data.
- Handling what needs to happen on entering and leaving the page.
- Connecting different feature modules.

A page doesn't have to own all the business logic.

If a page contains a lot of data processing, state management and interaction logic, consider moving some of that responsibility into a suitable module or composable.

### Section: a region of the page

A section is usually a region within a page with its own presentational purpose.

For example:

- A search area
- A statistics area
- A data list area
- A chart area

When a page gets complex, splitting it into sections makes the page easier to read.

But sections aren't a level every project has to adopt; whether to split still depends on how complex the page is.

### Component: reusable UI

Components are mainly responsible for presentation and user interaction.

For example:

- Button
- Dialog
- Table
- Form
- Card

A component can be pure UI, or include a certain amount of interaction logic.

But if a component starts carrying a whole business flow, it is time to reconsider whether it belongs to a feature.

### Feature: a complete business function

A feature isn't just a set of components put together; it groups a function with a clear purpose.

For example, member management might include:

- The member list
- Editing member details
- Member state management
- Member APIs
- Member data types

These pieces may span different technical types, but because they all serve the same business function, they can be considered for a single feature.

In short:

| Level | Main responsibility |
| --- | --- |
| Page | Composes the whole page |
| Section | Organises regions of the page |
| Component | Presents UI and handles interaction |
| Feature | Manages a business function with its own responsibility |

These levels aren't a fixed hierarchy; they help us think about who should own a piece of code.

---

## 4. How do you tell composables, services and stores apart?

Besides components and feature modules, Vue projects have a few other ways of organising code you use all the time.

### Composables: encapsulating reusable logic

Composables usually start with `use`, for example:

```ts
useAuth()
usePagination()
useWindowSize()
```

Their main purpose is to encapsulate Composition API logic so different components can reuse it.

Good candidates for a composable include:

- Reactive state
- Lifecycle handling
- Event listeners
- UI interaction logic
- Reusable interaction logic

But not all logic belongs in the global `composables/`.

If a composable only serves a particular feature and is closely tied to it, consider placing it inside that feature.

### Services: talking to external data and services

Services usually handle communication with external systems, such as API requests.

```ts
export const getMembers = () => {
  return api.get('/members')
}

export const updateMember = (id: string, data: unknown) => {
  return api.put(`/members/${id}`, data)
}
```

Centralising API requests keeps components from handling lots of request details directly, and makes the way data is fetched easier to maintain.

Services aren't limited to HTTP; depending on the project, they can integrate with other external services too.

### Stores: state shared across components or pages

Using Pinia as an example:

```ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    permissions: []
  })
})
```

Stores are for state that needs to be shared between components or pages.

For example:

- User information
- Login state
- Permission data
- Global settings

But not every piece of state needs to go in a store.

If state is only used within a single component, `ref()` or `reactive()` is usually enough.

### How the three differ

| Type | Main responsibility | Common uses |
| --- | --- | --- |
| Composable | Encapsulates reusable logic | UI, reactive logic, lifecycle |
| Service | Integrates with external services | APIs, data requests |
| Store | Manages shared state | User info, permissions, global state |

They don't replace one another; they divide the work by responsibility.

---

## 5. Feature-based architecture vs organising by technical responsibility

The two structures above actually reflect two different ways of thinking about organisation.

### Organising by technical responsibility

```text
src/
├── components/
├── composables/
├── services/
├── stores/
├── types/
└── utils/
```

This organises code by its technical purpose.

It is easy to understand and suits smaller projects.

But as features grow, the code for one business feature may be spread across different directories.

### Organising by business feature

```text
src/
├── features/
│   ├── auth/
│   ├── member/
│   ├── permission/
│   └── report/
│
└── shared/
    ├── components/
    ├── composables/
    ├── services/
    └── utils/
```

This first divides modules by business feature, then gathers the code each feature needs.

The advantage is that when you need to change a feature, you can find what is related within a fairly contained area.

But it can create new problems:

- Too many features.
- Unclear feature boundaries.
- Features depending on each other.
- The same shared logic implemented more than once.

So feature-based architecture doesn't mean turning everything into a feature; it means judging which functions really deserve to be managed on their own.

### How is this different from layered architecture?

You will also often see the idea of layered architecture.

It divides the system into layers by responsibility and dependency, for example:

```text
src/
├── presentation/
├── application/
├── domain/
└── infrastructure/
```

A simple way to think about it:

| Layer | Responsibility |
| --- | --- |
| Presentation | User interface and interaction |
| Application | Application flows and use cases |
| Domain | Core business rules |
| Infrastructure | External services, data sources and technical implementation |

Feature-based and layered architectures aren't mutually exclusive.

The former leans towards organising code by business feature; the latter towards layering by responsibility and dependency.

Larger systems may use both ways of thinking at once.

However, not every Vue project needs a full layered approach.

If a project isn't complex enough, introducing too many abstraction layers only raises the cost of understanding and maintaining it.

---

## 6. How do I decide whether a function should become its own feature?

After looking at different project structures, I think this is one of the questions most worth thinking about.

At first, my instinct was:

If a function is needed in more than two places, consider making it independent.

That can serve as a first rule of thumb, but in reality, how often something is used doesn't fully determine whether it should be a feature.

For example, a date-formatting function may be used by ten pages, but it is just a simple utility; `utils/` is enough.

Conversely, a member management function may be used by only one page today, yet already include full data management, state handling and workflows, and may well deserve to be managed on its own.

So I look at it from a few directions.

### 6.1 Scope of use: is it needed in several places?

Once a function is used by two or more pages or modules, I start evaluating whether to pull it out.

For example:

```text
pages/
├── dashboard/
├── member/
└── report/
```

If all of these pages need permission-checking logic, you can consider whether permission-related functionality should be managed in one place.

But this is only a threshold for evaluation; being used in two places doesn't mean you must create a feature.

You also need to check whether it has its own functional responsibility.

### 6.2 Business responsibility: does it have a clear, independent purpose?

If a piece of code just provides a general utility, such as:

- Date formatting
- Number formatting
- String handling
- Generic validation functions

it usually doesn't need to become a feature.

But if it represents a complete business function, such as:

- Member management
- Permission management
- Login and authentication
- Workflow management

consider gathering the related code into its own feature.

I think this is one of the most important criteria when deciding whether to split.

### 6.3 Data and state: does it have its own management needs?

When a function starts to have its own data, state and workflows, it is worth considering managing it separately.

For example, permission management might include:

- Fetching permission data
- Managing permission state
- Evaluating permission rules
- Changing permissions

When this logic gradually spreads across different pages or components, it can make maintenance harder.

Managing it in one place makes permission-related changes easier to trace.

### 6.4 Maintenance: does it need to be changed and extended on its own?

Another thing I consider is whether the function has its own reasons to change.

For example, permission rules may keep being adjusted as requirements grow.

If every change means hunting for related logic across different pages, the current organisation probably isn't centralised enough.

Then organising the related code into its own feature gives future maintenance a clear scope.

### 6.5 Dependencies: does splitting really reduce coupling?

Finally, consider the result after splitting.

If creating a feature means different features have to reference each other's internals heavily, or even creates circular dependencies, the split probably hasn't really improved the architecture.

For example, suppose two features end up with this dependency:

```text
member ──────> permission
   ↑               │
   └───────────────┘
```

This means `member` depends on `permission`, and `permission` in turn depends on `member`.

If two features reference each other's internal implementation directly, they can form a circular dependency and blur the responsibilities between modules.

Then it is time to rethink who owns what. You can consider:

- Exposing the necessary functionality through a public interface.
- Avoiding direct references to other features' internals.
- Moving genuinely shared capabilities into shared.
- Re-checking which module should own the data and business logic.

### My rules of thumb for splitting features

Putting these directions together, this is how I decide:

| Condition | What I do |
| --- | --- |
| Used in two or more places | Start evaluating whether to extract it |
| Has its own business responsibility | Strongly consider managing it separately |
| Has its own data and state | Evaluate centralising it |
| Has its own maintenance and extension needs | Consider splitting it |
| Splitting would add module dependencies | Re-examine the responsibility boundaries |
| Just a general utility or simple shared logic | Shared or utils is enough |

I don't treat these conditions as absolute rules, but as criteria for evaluation.

**For me, what really deserves to be its own feature isn't the code used most often, but functionality that already has its own responsibility and needs to be understood, maintained and extended on its own.**

---

## 7. How finely should a project be split?

Once you understand the different ways of organising code, another question remains:

Does splitting more finely make the architecture better?

I don't think so.

The purpose of splitting should be to make code easier to understand and maintain, not to maximise the number of directories.

For example, a simple feature may only need:

```text
features/
└── member/
    ├── components/
    ├── services/
    └── composables/
```

But creating many more layers of directories just for a small feature:

```text
features/
└── member/
    ├── components/
    │   └── internal/
    │       └── shared/
    ├── application/
    │   └── use-cases/
    ├── infrastructure/
    │   └── repositories/
    └── domain/
        └── entities/
```

doesn't necessarily make it more maintainable.

If every directory holds just one simple file and the responsibilities aren't really separated, it may only make things harder to find.

I consider these factors:

1. Complexity: is there already enough logic to warrant splitting?
2. Clarity of responsibility: do the different pieces of code have different responsibilities?
3. Reuse: do other features need to share it?
4. Maintenance: might it be changed or extended independently in future?
5. Dependencies: will splitting reduce coupling?

If splitting makes responsibilities clearer and dependencies simpler without adding too much cost to understanding, then it is worth it.

---

## 8. Over-abstraction and coupling

When designing a project's architecture, I think two directions need watching.

### Over-abstraction

Sometimes, wanting cleaner code, we create lots of abstraction layers in advance.

For example:

- Creating shared modules before any duplication has appeared.
- Splitting even tiny features into several directories.
- Creating a separate composable for every component.
- Adding unnecessary intermediate layers to conform to some architectural pattern.

None of these is necessarily wrong, but if the abstraction doesn't solve a real problem, it can make code harder to understand.

### Coupling between modules

The other problem is dependencies between modules.

Even if every feature has its own directory, that doesn't mean they aren't coupled.

For example:

```text
features/
├── member/
├── permission/
└── workflow/
```

On the surface they look separate, but if `member` directly references `permission`'s internals, and `permission` in turn depends on `member`, you may get a circular dependency.

So after creating features, you also need to consider:

- Which module owns this data?
- Which module is responsible for this business logic?
- How should other modules use it?
- Is there a genuinely shared capability that can be extracted?
- Are there unnecessary two-way dependencies?

A good module boundary isn't just putting code into different folders; it gives different features clear responsibilities and a clear direction of dependency.

### A folder structure isn't the whole system architecture

This is something I noticed particularly while writing this note.

Looking only at the folder structure, you can't fully judge the quality of a project's architecture.

For example, from folders alone you can't:

- Tell the actual direction of import dependencies.
- Confirm that state is managed by the right module.
- Judge whether the data flow makes sense.
- Confirm whether there are circular dependencies.
- Know whether different modules really have independent responsibilities.

So a directory structure is only a starting point for understanding how a project is organised.

To really evaluate an architecture, you still need to read the code, observe how modules interact, and understand what a change to a feature affects.

---

## 9. What I learned

From the basic directory structure I met when first learning Vue to observing how different projects are organised, I gradually realised that frontend architecture isn't simply deciding how many folders to create.

What really needs thinking about is:

- Who should own a feature?
- Which logic should be managed in one place?
- Which code is suitable for sharing?
- How should different features depend on each other?
- When should you split, and when should you keep things simple?

I also came to understand that features, composables, services and stores don't exist to make a project look more architected.

Each has a different responsibility and should be used according to real needs.

Especially when deciding whether something should become its own feature, you can't just count how many times a piece of code is used; you also have to consider whether it has its own business responsibility, its own data management needs, and a real need for future maintenance and extension.

For me, **a good project architecture isn't one split as finely as possible, but one where every piece of code has a sensible place and every feature can be understood and maintained within a clear scope of responsibility.**

That is the deeper understanding of frontend architecture I gained as I moved from simply building frontend features to thinking about how projects are organised and maintained.

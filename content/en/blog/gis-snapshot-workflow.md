---
title: 'Integrating GIS Snapshot Codes: Understand the Existing Flow Before Extending It'
description: Notes from extending an existing GIS map viewer on the front end, from understanding how snapshot codes work and checking what the API returns, to tracing when each entry point fetches its data, and deciding how much existing code to reuse and how much to change.
date: 2025-06-15
category: case
tags: [Vue, OpenLayers, REST API, Maintenance]
readingTime: 7
---

The GIS map viewer I work on already had a snapshot code feature. It records a particular map view, so a user can enter the code and return to the same layers and position.

While extending the viewer, I needed to bring that existing snapshot capability into a new way of using the map. This post focuses on the technical decisions and leaves out the actual business conditions and interface details.

I was mainly responsible for the front-end work. I first studied the existing code to see how snapshot codes work and what data the API provides, and only then planned the interface and the flow.

This is a record of that front-end integration. The stack was Vue, OpenLayers and a REST API, and the emphasis is on understanding the existing feature and its data flow.

## First, Confirm How the Existing Feature Works

When the requirement came in, I read the code of the existing snapshot feature to understand how it connects to map positioning.

The things I needed to confirm:

- How the existing snapshot feature is triggered and what flow it runs.
- Once the code has a snapshot, how it brings the map back to the matching view.
- Which existing logic the new requirement could reuse.
- Which original flows the new action would pass through.

Only after these relationships were clear could I confirm that the existing snapshot mechanism could be reused and connected to the new scenario, with no need to build a second one.

For me, the time-consuming part of this step was finding how the features relate to each other. Knowing what a single function does doesn't tell you when it is called, or which data it needs before and after.

## Not Sure the Data Is Enough? Test the Existing API First

Next I needed to find out where the data for the new feature would come from.

I called the existing API repeatedly and compared its responses with how the original code used them, to understand what each field is for, and then checked whether that data could support the new requirement.

I mainly looked at:

- Whether the data the new feature needs is already returned.
- What each field originally means.
- How the existing feature uses those fields.
- Whether putting them into the new flow would affect their original purpose.

The tests showed that the fields already returned were enough for this front-end feature.

I then discussed with the PM whether reusing the existing API was feasible and what it would affect, and we confirmed that the front-end integration could be done with the existing interface.

**No extra backend API was built for this integration, but the data checks up front were still necessary.** If you see that a field's value works and plug it straight into a feature, it's easy to overlook what the field was originally for.

## Same Requirement, Different Entry Points, Different Order of Execution

During the integration I found that different entry points need similar data, but when the data is fetched and how it is handled afterwards are not necessarily the same. So besides checking what the API returns, I also had to trace when the data is obtained and how later code uses it.

I had to confirm, for each entry point:

1. The original execution flow.
2. At which step the data query is triggered.
3. What data processing runs after the query.
4. What data the new feature needs, and how it connects to the processing that follows.

After confirming the original execution order of each entry point, I adjusted the corresponding logic so that querying, data processing and the related features connect correctly.

This made me pay more attention to one thing: **needing a similar kind of data does not mean the operation flow is the same.**

When extending an existing system, it isn't enough to look at what the API returns. You also have to trace when the data is obtained and when the code after it uses it.

## Turn the Requirement into a Front-end Flow

With the relationship between data and features understood, the next step was designing the front-end interface and how it is operated.

Having confirmed the existing features and data sources, I organized them into a flow the user can operate, and built the related screens and features:

- Design a new operation interface from the requirement.
- Fetch and process the data the new feature needs.
- Integrate the existing snapshot positioning feature.
- Adjust the order of execution for each entry point.
- Fit the new operation flow into the existing interface.

After a first implementation, I checked with the PM whether the feature met the requirement.

The front-end scope of this work covered understanding the requirement, confirming whether the data was enough, and deciding how the feature should connect to the existing flow.

## Reusing an API Still Means Paying Attention to What a Field Is For

Reusing the existing API kept the changes mostly on the front end and avoided extending the backend interface and the integration work around it.

But that doesn't mean that for every future requirement we should reach for existing fields first. We still need to check whether a field's purpose fits the requirement and whether it will be easy to maintain later.

For example:

- Does the field's original meaning match the data the new feature needs?
- Does the new feature depend on a response format that was never clearly agreed?
- If the backend changes the field, can they tell that the new feature uses it too?
- If the two features move in different directions later, do they need to be separated?

These are the maintenance issues I'll watch more closely after this experience. If the data merely looks similar but is used for something different, it's worth discussing a better approach with the backend.

## What Improved, and What We Can't Conclude Yet

This work integrated the existing snapshot capability with the new front-end feature, and confirmed the required data could be obtained without extending the backend API.

It let existing features and data be reused in the new scenario instead of redeveloping the same capability. Whether it actually reduced operation time or improved efficiency still needs usage data to confirm.

Also, not changing the backend API doesn't mean regression testing isn't needed. The new logic enters the existing flow, so we still need to check each entry point's behavior, the original positioning feature, and what happens when data is missing or a query fails.

## What I Learned

The most effort went into lining up the existing features, the API data and the order of operations before writing any code.

A few points I'll remember:

- **Trace the existing flow first.** Know what a function does, and also when it runs and which data it depends on.
- **Confirm the data before deciding whether to extend the API.** Whether something can be reused depends on the actual response and what the fields are for.
- **Check each entry point separately.** Similar data needs can appear in different execution flows.
- **A small change still needs verification.** Especially logic that plugs into an existing flow: you can't just check that the new screen looks fine.

This extension showed me that adding a feature doesn't always mean starting from zero. Start from the requirement, understand how the existing system runs, then confirm which features and data can be reused. That gives you a better basis for deciding how much to change and how to implement it.

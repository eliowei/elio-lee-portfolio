---
title: 'Adjusting Imagery in OpenLayers: CSS Filters and a Draggable Popup Bug'
description: Real-time brightness, contrast and saturation adjustment on an OpenLayers map using CSS filters, and how I fixed the window behind the popup moving along while the map was being dragged.
date: 2025-12-01
category: case
tags: [OpenLayers, Canvas, Events]
readingTime: 6
---

At work there is a popup for viewing imagery, which shows the image with OpenLayers so users can pan and zoom. This time I needed to add brightness, contrast and saturation adjustments, and I also fixed an interaction bug in the popup along the way.

## Adjusting the image with CSS filters

OpenLayers draws layers on a canvas by default. To change how the image looks, my first idea was to read the pixels and recalculate them, but that means processing every tile and doing it all again on every pan and zoom.

In fact the requirement was only for it to *look* different, not to change the data, so applying a CSS filter directly to the canvas element was enough:

```js
updateFilterStyle() {
  const canvas = document.querySelector('#imageMap .ol-layer canvas')
  if (!canvas) return

  canvas.style.filter = `
    contrast(${this.contrast / 100})
    saturate(${this.saturation / 100})
    brightness(${this.exposure / 100})
  `
}
```

The interface binds the values to sliders ranging from 50 to 200, defaulting to 100:

```html
<v-slider v-model="contrast" min="50" max="200" step="10" @input="updateFilterStyle" />
```

This approach has a few advantages:

- **Performance**: the browser handles the filter, with no need to redraw tiles.
- **Data untouched**: the original image doesn't change at all, and resetting the values restores it.
- **Instant feedback**: you see the result immediately while dragging a slider.

### Scope the selector

The selector must target the map inside the popup. The page also has a main map, so writing just `.ol-layer canvas` could change the wrong map.

### When it doesn't fit

CSS filters only change what is displayed. If you need to export the adjusted image or analyse pixels, use the Canvas API or OpenLayers' layer processing. Also, the filter applies to the whole canvas, so every layer drawn on the same canvas is affected.

## Fixing a bug: the window behind moves while you use the map

This project has several draggable popups. A user would open the "Order" window, then the "View image" window, and when dragging on the map, the order window behind it moved too; dragging the zoom control did the same.

### Cause

Dragging was registered like this:

```js
document.addEventListener('mousedown', (e) => {
  if (e.target.tagName !== 'CANVAS') dragMouseDown(e)
})
```

There were two problems:

- The listener is on `document`, so **pressing the mouse anywhere on the page triggers it**, not just on the popup itself.
- The condition only excludes canvases. The map's zoom control isn't a canvas, so pressing it was treated as dragging the window.

In other words, the code checked "what I didn't press" rather than "whether I pressed this window".

### Fix

I changed it to check that the event really happened inside this popup, and not on the map:

```js
document.addEventListener('mousedown', (e) => {
  const popup = document.getElementById('orderPopup')
  const imageMap = document.querySelector('.imageMap')

  const isInPopup = popup?.contains(e.target)
  const isInMap = imageMap?.contains(e.target)

  if (isInPopup && !isInMap && e.target.tagName !== 'CANVAS') {
    dragMouseDown(e)
  }
})
```

`element.contains(target)` tells you whether the clicked target is inside an element, which is more reliable than looking only at `tagName`.

After this fix, panning and zooming the map were separated from dragging the window, and the window behind no longer wanders off while users adjust the image.

### A better design

If I redesigned it, I wouldn't put the listener on `document` but on the popup's title bar, so you can only drag by holding the title bar. Then there is no need to check the target at all, and it avoids the listener lingering after the component closes.

## What I learned

- First ask whether the requirement changes the data or only the display. The latter usually has a simpler solution.
- When binding events on `document`, be especially careful about their scope.
- Writing the condition as "confirm it's me" is safer than "exclude what isn't me", because the exclusion list is never complete.

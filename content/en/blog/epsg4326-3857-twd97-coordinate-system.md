---
title: 'EPSG:4326, EPSG:3857 and TWD97: Understanding GIS Coordinate Systems and Coordinate Transforms in OpenLayers'
description: From latitude and longitude and Web Mercator to TWD97 TM2 coordinates common in Taiwan, the differences between coordinate systems and how to transform between them with OpenLayers.
date: 2025-06-14
category: gis
tags:
  - GIS
  - OpenLayers
  - TWD97
  - EPSG:4326
  - EPSG:3857
  - EPSG:3826
  - Coordinate System
readingTime: 9
draft: false
---

# EPSG:4326, EPSG:3857 and TWD97: Understanding GIS Coordinate Systems and Coordinate Transforms in OpenLayers

In everyday web development, we are used to positioning elements on screen with X and Y coordinates.

But in GIS development, coordinates aren't just numbers; you also need to know which coordinate system those numbers were calculated in.

For example, coordinates for the same place in Taiwan might be expressed as latitude and longitude, or as planar coordinates after a map projection.

If you put data on a map without first checking its coordinate system, you may end up with shifted positions, the wrong map centre, or layers that don't line up.

This note starts from EPSG:4326 and EPSG:3857, which are common in GIS development, and TWD97, which is common in Taiwan, and covers how they differ and how to transform between them in OpenLayers.

## 1. Why does GIS need coordinate systems?

The Earth is a three-dimensional, roughly spherical object, but web maps are usually shown as a two-dimensional plane.

So we need coordinate systems and map projections to turn positions on the Earth's surface into coordinates on a plane.

That is why GIS has different coordinate reference systems (CRS).

Different coordinate systems may use different:

- Datums
- Ways of expressing coordinates
- Map projections
- Coordinate units

For example, latitude and longitude are usually expressed in degrees, while projected planar coordinates may be in metres.

Even when they represent the same geographic location, the two will have completely different values.

## 2. EPSG:4326: positions as latitude and longitude

EPSG:4326 corresponds to the WGS 84 geographic coordinate system, common in GPS, geographic data exchange and many map services.

It expresses positions on Earth with longitude and latitude, in degrees.

For example:

```js
const coordinate = [121.5654, 25.0330]
```

This coordinate is a location near Taipei, Taiwan.

In an ordinary OpenLayers coordinate array, the order is:

```js
[longitude, latitude]
```

That is:

- X: longitude
- Y: latitude

Note that EPSG:4326 is a geographic coordinate system, not a projection that flattens the Earth onto a plane.

## 3. EPSG:3857: the Web Mercator projection

EPSG:3857 is Web Mercator, also often called Web or Spherical Mercator.

It projects geographic coordinates onto a plane, in metres, which makes it well suited to displaying, zooming and panning web maps.

Many common web map services, such as OpenStreetMap's standard tiles, use Web Mercator.

Unlike EPSG:4326, EPSG:3857 coordinates aren't longitude and latitude but projected X and Y planar coordinates.

For example:

```js
const coordinate = [13519300, 2870000]
```

These values represent a position on the projected plane and can't be used directly as latitude and longitude.

### Why project at all?

Because the Earth's surface is curved, it can't be flattened completely onto a two-dimensional plane without distortion.

Web Mercator is well suited to browsing web maps, but distances and areas are distorted with latitude, more so the closer you get to high latitudes.

So EPSG:3857 is good for ordinary web map display, but shouldn't be used directly for precise distance or area calculations.

## 4. TWD97, common in Taiwan

Besides EPSG:4326 and EPSG:3857, GIS development in Taiwan often involves TWD97.

TWD97 (Taiwan Datum 1997) is Taiwan's common geodetic datum. Combined with the 2-degree Transverse Mercator projection (TM2), it turns geographic positions into planar coordinates in metres.

The two most common EPSG codes are:

| EPSG | Coordinate system | Central meridian |
| --- | --- | --- |
| EPSG:3826 | TWD97 / TM2 zone 121 | 121°E |
| EPSG:3825 | TWD97 / TM2 zone 119 | 119°E |

### Why does Taiwan use 2-degree zones?

If positions are expressed directly as latitude and longitude, the unit is degrees, which isn't convenient for planar distance and area calculations.

The TM2 projection turns a given region into planar coordinates in metres.

Taiwan's common 2-degree zones use different central meridians depending on the region:

- Zone 121: the TWD97 planar coordinate system commonly used for the main island of Taiwan.
- Zone 119: the other zone, commonly used for regions such as Kinmen and Matsu.

So when you receive GIS data for Taiwan, besides checking whether it uses TWD97, you also need to check which zone it uses.

### How does TWD97 differ from EPSG:4326?

The biggest difference is how coordinates are expressed:

| Aspect | EPSG:4326 | EPSG:3826 |
| --- | --- | --- |
| Datum | WGS 84 | TWD97 |
| Projection | Geographic coordinates | TM2 2-degree zone |
| Unit | Degrees | Metres |
| Coordinates | Longitude, latitude | X, Y planar coordinates |
| Common uses | GPS, geographic data exchange | Surveying and GIS spatial data in Taiwan |

Although both can express positions on Earth, you can't use one kind of coordinate directly as the other.

## 5. How does OpenLayers transform coordinates?

OpenLayers has built-in transforms between common coordinate systems, available through the `ol/proj` module.

### 1. fromLonLat()

Converts longitude/latitude coordinates to a given projection.

```js
import { fromLonLat } from 'ol/proj'

const lonLat = [121.5654, 25.0330]

const mercatorCoordinate = fromLonLat(lonLat, 'EPSG:3857')

console.log(mercatorCoordinate)
```

This is useful once you have latitude/longitude data and want to convert it to OpenLayers' default Web Mercator coordinates.

If no target projection is given, EPSG:3857 is used by default.

### 2. toLonLat()

If you already have EPSG:3857 coordinates and want latitude and longitude back, use `toLonLat()`.

```js
import { toLonLat } from 'ol/proj'

const mercatorCoordinate = [13519300, 2870000]

const lonLat = toLonLat(mercatorCoordinate)

console.log(lonLat)
```

The result is longitude and latitude coordinates.

### 3. transform()

To convert between other projections, you can also use `transform()`.

```js
import { transform } from 'ol/proj'

const coordinate = [121.5654, 25.0330]

const result = transform(coordinate, 'EPSG:4326', 'EPSG:3857')

console.log(result)
```

Compared with `fromLonLat()`, `transform()` lets you state the source and target coordinate systems explicitly, which is more flexible when dealing with several projections.

### 4. transformExtent()

Besides single points, GIS development often deals with map extents.

For example, an extent may contain:

```js
[minX, minY, maxX, maxY]
```

If the source data's coordinate system differs from the map's, the extent has to be transformed as well.

That is what `transformExtent()` is for:

```js
import { transformExtent } from 'ol/proj'

const extent = [120.0, 21.0, 122.0, 25.0]

const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')

console.log(transformedExtent)
```

This converts a geographic extent expressed in latitude and longitude into an extent in the Web Mercator projection.

You may need this when zooming the map, fitting to an extent, or making WMS requests.

## 6. How does OpenLayers handle TWD97 coordinates?

Unlike EPSG:4326 and EPSG:3857, OpenLayers doesn't necessarily ship a definition for EPSG:3826 by default.

To use TWD97 / TM2 zone 121 in OpenLayers, you usually register the projection with Proj4js.

First install the package:

```bash
npm install proj4
```

Then define EPSG:3826:

```js
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs'
)

register(proj4)
```

Once registered, you can transform coordinates with OpenLayers' `transform()`.

For example, converting TWD97 / TM2 zone 121 to Web Mercator:

```js
import { transform } from 'ol/proj'

const twd97Coordinate = [250000, 2760000]

const mercatorCoordinate = transform(twd97Coordinate, 'EPSG:3826', 'EPSG:3857')

console.log(mercatorCoordinate)
```

`[250000, 2760000]` here only illustrates the coordinate format and doesn't represent a particular place.

To use EPSG:3825, you have to register its own projection definition; you can't reuse the EPSG:3826 settings.

## 7. Can layers in different coordinate systems share one map?

Yes, provided the frontend knows the coordinate system of each data source.

OpenLayers supports transforms between some common projections, and can reproject layers automatically when a layer source's projection differs from the View's.

For example, if the map View uses EPSG:3857 and a WMS service provides EPSG:4326 imagery, OpenLayers can reproject the imagery into the map's projection, as long as the source projection is configured correctly.

However, not every coordinate system works out of the box.

For projections OpenLayers doesn't support natively, such as TWD97 / TM2, you may need to register the projection definition with Proj4js.

So when integrating GIS data from different sources, besides checking the data itself, first find out which coordinate system it uses.

## 8. What I learned

Only after starting GIS development did I gradually understand that coordinates aren't a set of numbers you can just use.

For the same geographic location, latitude/longitude and projected coordinates can have completely different values. If you put data into OpenLayers without checking its coordinate system first, you easily end up with wrong map positions or layers that don't line up.

When I used to see `EPSG:4326` or `EPSG:3857`, I might have treated them as just another config parameter. Now I pay attention to the data source, the projection the View uses, and whether a transform is needed between them.

And in Taiwan's GIS context, besides the usual latitude/longitude and Web Mercator, you often deal with planar coordinate systems such as TWD97.

So when handling map layers, I no longer only care whether the data loaded; I first check whether the coordinates themselves match the map's settings.

---

**References:**

- EPSG Geodetic Parameter Dataset
- OpenLayers documentation: Projection
- OpenLayers documentation: Raster Reprojection
- Proj4js documentation

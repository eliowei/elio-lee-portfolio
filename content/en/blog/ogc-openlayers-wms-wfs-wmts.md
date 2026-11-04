---
title: 'From OGC to OpenLayers: Getting to Know WMS, WFS and WMTS Map Services'
description: Starting from the OGC standards, an introduction to the three common map services, WMS, WFS and WMTS, and how they are used with OpenLayers.
date: 2025-06-05
category: gis
tags:
  - GIS
  - OGC
  - WMS
  - WFS
  - WMTS
  - OpenLayers
readingTime: 8
draft: false
---

# From OGC to OpenLayers: Getting to Know WMS, WFS and WMTS Map Services

When I first started GIS (geographic information system) development, I mostly cared about how to show a map on a web page with OpenLayers and how to load different layers.

But as I learned more, I realised there is more than one way to provide the data on a map. Some services provide ready-made map images, some provide spatial data that can be queried and processed further, and some speed up loading with pre-cut map tiles.

Behind each of these ways of providing data, there is a corresponding standard.

This note collects what I gradually learned about the OGC standards while working with GIS, and how WMS, WFS and WMTS relate to OpenLayers.

## 1. What is OGC?

The OGC (Open Geospatial Consortium) is an international organisation that sets standards for geographic information. Its main aim is to let different systems, platforms and services exchange and use spatial data through shared specifications.

In GIS development, different services may use different data formats or transport methods. If every system used completely different rules, the frontend would have to handle each service separately.

OGC standards let map services use relatively consistent ways of making requests and exchanging data, lowering the cost of integrating different systems.

A few common related standards and formats:

| Name | Main use |
| --- | --- |
| WMS | Provides map images |
| WFS | Provides spatial feature data |
| WMTS | Provides tiled map services |
| CSW | Searching and querying catalogues of spatial data |
| GML | An XML-based language for describing geographic data |
| GeoJSON | A spatial data exchange format common on the web |

Of these, WMS, WFS and WMTS are the services you meet most often in web map development.

## 2. WMS: requesting map images

WMS (Web Map Service) mainly provides map images, usually returned in raster formats such as PNG or JPEG.

Simply put, the frontend sends a request to the map server saying which layers to show, the map extent and the image size, and the server generates a map image to match.

Common uses include:

- Showing base maps or imagery layers.
- Overlaying other image layers on an existing map.
- Combining map data from different sources on one screen.

### The GetMap request

The common WMS operation for requesting a map image is GetMap.

A simplified example request:

```text
GET https://example.com/geoserver/ows?
service=WMS&
version=1.3.0&
request=GetMap&
layers=workspace:layer_name&
styles=&
bbox=120,21,122,25&
width=800&
height=600&
crs=EPSG:4326&
format=image/png
```

What the parameters mean:

| Parameter | Description |
| --- | --- |
| service | The type of service, such as WMS |
| version | The WMS service version |
| request | The operation, such as GetMap |
| layers | The layers to show |
| styles | The layer styles |
| bbox | The map extent to show |
| crs / srs | The coordinate reference system |
| width / height | The width and height of the returned image |
| format | The image format, such as image/png |
| transparent | Whether to use a transparent background |

`BBOX`, `CRS`, `WIDTH` and `HEIGHT` are especially important for understanding WMS requests.

That is because the server needs to know which geographic area to render and the size of the final image.

Also, WMS returns a map image, not a full set of features you can use directly as ordinary vector data. If you need the features and their attributes, you would usually look at other services such as WFS.

## 3. WFS: getting spatial features and attributes

The biggest difference between WFS (Web Feature Service) and WMS is that it provides spatial feature data rather than just a map image.

That data may include:

- Points
- Lines (LineString)
- Polygons
- Feature attributes

Once the frontend has the data, it can display, query or otherwise process it further.

Common uses include:

- Querying the attributes of a feature on the map.
- Getting spatial data within a given extent.
- Converting the data into a format the frontend can use.
- Displaying vector features with an OpenLayers vector layer.

### The GetFeature request

The common WFS operation for querying data is GetFeature.

A simplified example request:

```text
GET https://example.com/geoserver/ows?
service=WFS&
version=2.0.0&
request=GetFeature&
typeNames=workspace:layer_name&
outputFormat=application/json&
srsName=EPSG:4326
```

A few common parameters:

| Parameter | Description |
| --- | --- |
| service | Use the WFS service |
| version | The WFS service version |
| request | The GetFeature operation |
| typeNames | The layer to query |
| outputFormat | The output format of the data |
| srsName | The coordinate reference system of the output |
| bbox | Limits the spatial extent of the query |

For example, `outputFormat=application/json` makes the service return JSON, which is easy for the frontend to process.

## 4. WMTS: faster display with map tiles

WMTS (Web Map Tile Service) provides pre-cut map images, commonly called tiles.

Unlike WMS, which generates a map image for the requested extent each time, WMTS cuts the map in advance into image tiles at different zoom levels and positions.

When the user zooms or pans, the frontend loads the matching tiles for the current zoom level and position.

Common uses include:

- Fast display of large-area maps.
- Base maps used all the time.
- Map applications that zoom and pan frequently.

### The GetTile request

The common WMTS operation is GetTile.

```text
GET https://example.com/geoserver/gwc/service/wmts?
SERVICE=WMTS&
REQUEST=GetTile&
VERSION=1.0.0&
LAYER=workspace:layer_name&
STYLE=default&
TILEMATRIXSET=EPSG:3857&
TILEMATRIX=10&
TILEROW=220&
TILECOL=356&
FORMAT=image/png
```

Common parameters:

| Parameter | Description |
| --- | --- |
| LAYER | The layer to load |
| STYLE | The layer style |
| TILEMATRIXSET | The tile matrix set |
| TILEMATRIX | The zoom level |
| TILEROW | The row of the tile |
| TILECOL | The column of the tile |
| FORMAT | The image format |

Because WMTS uses pre-generated tiles, the server doesn't have to render a whole map image for every request, so it usually loads faster when lots of map browsing is involved.

## 5. How do WMS, WFS and WMTS differ?

With their uses in mind, you can compare the three by how they provide data:

| Aspect | WMS | WFS | WMTS |
| --- | --- | --- | --- |
| Provides | Map images | Spatial feature data | Tiled images |
| Data type | Raster | Vector | Raster tiles |
| Common operation | GetMap | GetFeature | GetTile |
| Main use | Showing maps | Querying and processing data | Showing maps quickly |

A more intuitive way to think about them:

- WMS: ask the server for a map image of a given extent.
- WFS: ask the server for spatial data you can process further.
- WMTS: ask the server for map images that have already been cut into tiles.

They don't replace one another; you choose the right service for what the application needs.

## 6. How does OpenLayers work with these services?

OpenLayers is a JavaScript library for web map development. It can combine map data from different sources and manages map content through layers and sources.

Common building blocks in OpenLayers include:

- Map: the map itself, managing the whole map view.
- View: controls the map centre, zoom level and coordinate system.
- Layer: a layer on the map.
- Source: the data source a layer actually uses.

Different map services pair with different sources.

### 1. WMS: TileWMS

OpenLayers provides `TileWMS`, used together with `TileLayer`.

```js
import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

const wmsLayer = new TileLayer({
  source: new TileWMS({
    url: 'https://example.com/geoserver/ows',
    params: {
      LAYERS: 'workspace:layer_name',
      TILED: true,
    },
    serverType: 'geoserver',
  }),
})
```

This lets OpenLayers get map images from a WMS service and show them in a map layer.

### 2. WFS: VectorLayer and VectorSource

To get vector data, display it with a `VectorSource` and a `VectorLayer`.

```js
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'https://example.com/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=workspace:layer_name&outputFormat=application/json',
    format: new GeoJSON(),
  }),
})
```

Here the GeoJSON format reads the spatial data returned by the service, and OpenLayers creates the matching vector features.

### 3. WMTS: loading via tiles

WMTS is used with OpenLayers' WMTS source and a TileLayer.

```js
import TileLayer from 'ol/layer/Tile'
import WMTS from 'ol/source/WMTS'

const wmtsLayer = new TileLayer({
  source: new WMTS({
    url: 'https://example.com/geoserver/gwc/service/wmts',
    layer: 'workspace:layer_name',
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    style: 'default',
    tileGrid,
  }),
})
```

In practice, you also need to configure the TileGrid according to the service's Capabilities, including the tile matrix, resolutions and origin.

## 7. How do you find a map service's settings?

When integrating an unfamiliar OGC map service, start by reading its Capabilities to see what it supports.

For WMS:

```text
https://example.com/geoserver/ows?service=WMS&request=GetCapabilities
```

For WFS:

```text
https://example.com/geoserver/ows?service=WFS&request=GetCapabilities
```

Capabilities usually list the supported versions, layer information, coordinate systems and other settings.

WMTS has a matching GetCapabilities operation too, for finding the supported layers, TileMatrixSets and tiling settings.

This information helps developers understand what data a service offers and which parameters the frontend needs to use.

## 8. What I learned

Before getting into GIS development, my understanding of maps leaned towards the frontend view: creating a Map, loading Layers, and controlling zoom and panning.

But once I started learning about the OGC standards, I realised that the layers on a map come from different data sources and are provided in different ways.

WMS, WFS and WMTS may all end up on the same map, but the data behind them differs. Understanding those differences made it much clearer, looking back at OpenLayers' layer and source configuration, why different data needs different ways of loading.

For me, that is one of the gains from GIS development: not just knowing how to get a layer on screen, but gradually understanding where the data comes from, how it is obtained and how the frontend should handle it.

---

Further reading:

- Open Geospatial Consortium (OGC) standards
- OpenLayers documentation
- GeoServer documentation

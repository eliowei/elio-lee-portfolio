---
title: 從 OGC 到 OpenLayers：認識 WMS、WFS 與 WMTS 地圖服務
description: 從 OGC 標準出發，認識 WMS、WFS、WMTS 三種常見地圖服務，以及它們如何與 OpenLayers 搭配使用。
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

# 從 OGC 到 OpenLayers：認識 WMS、WFS 與 WMTS 地圖服務

剛開始接觸 GIS（地理資訊系統）開發時，我比較關注的是如何透過 OpenLayers 將地圖顯示在網頁上，以及如何載入不同的圖層。

但隨著接觸的內容增加，我開始發現，地圖上的資料並不只有一種提供方式。有些服務提供的是已經產生好的地圖影像，有些則提供可以進一步查詢與處理的空間資料，也有些是透過預先切好的地圖磚來加快載入速度。

這些不同的資料提供方式，背後其實有各自對應的標準。

這篇文章整理我在接觸 GIS 技術時，逐漸認識的 OGC 標準，以及 WMS、WFS、WMTS 與 OpenLayers 之間的關係。

## 一、什麼是 OGC？

OGC（Open Geospatial Consortium）是一個制定地理資訊相關標準的國際組織，主要目的是讓不同系統、平台與服務之間，能夠透過共同的規格交換及使用空間資料。

在 GIS 開發中，不同服務可能使用不同的資料格式或傳輸方式。如果每個系統都採用完全不同的規則，前端就需要針對各種服務分別處理。

透過 OGC 標準，可以讓地圖服務使用相對一致的請求與資料交換方式，降低不同系統之間的整合成本。

幾個常見的相關標準與格式：

| 名稱 | 主要用途 |
| --- | --- |
| WMS | 提供地圖影像 |
| WFS | 提供空間要素資料 |
| WMTS | 提供切片地圖服務 |
| CSW | 空間資料目錄的檢索與查詢 |
| GML | XML 格式的地理資料描述語言 |
| GeoJSON | Web 常見的空間資料交換格式 |

其中，WMS、WFS 與 WMTS 是網頁地圖開發中經常會接觸到的服務。

## 二、WMS：透過請求取得地圖影像

WMS（Web Map Service）主要提供地圖影像，通常以 PNG 或 JPEG 等 Raster 格式回傳。

簡單來說，前端向地圖伺服器提出請求，告訴伺服器想要顯示哪些圖層、地圖範圍以及影像尺寸，伺服器再依照這些條件產生地圖影像。

常見用途包括：

- 顯示地圖底圖或影像圖層。
- 在既有地圖上疊加其他影像圖層。
- 將不同來源的地圖資料整合在同一個畫面中。

### GetMap 請求

WMS 常見的地圖影像請求操作為 GetMap。

以下是一個簡化的請求範例：

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

這些參數各自代表不同的意義：

| 參數 | 說明 |
| --- | --- |
| service | 指定使用的服務類型，例如 WMS |
| version | WMS 服務版本 |
| request | 請求操作，例如 GetMap |
| layers | 指定要顯示的圖層 |
| styles | 指定圖層樣式 |
| bbox | 定義地圖顯示範圍 |
| crs / srs | 指定座標參考系統 |
| width / height | 回傳影像的寬度與高度 |
| format | 指定影像格式，例如 image/png |
| transparent | 是否使用透明背景 |

其中，`BBOX`、`CRS`、`WIDTH` 與 `HEIGHT` 是理解 WMS 請求時很重要的參數。

因為伺服器需要知道目前要產生哪個地理範圍的影像，以及最終影像要輸出的尺寸。

另外，WMS 回傳的是地圖影像，而不是可以直接當作一般向量資料使用的完整圖徵集合。如果需要取得圖徵及其屬性，通常會考慮 WFS 等其他服務。

## 三、WFS：取得空間要素與屬性資料

WFS（Web Feature Service）與 WMS 最大的差異，在於它提供的是空間要素資料，而不是單純的地圖影像。

這些資料可能包含：

- 點（Point）
- 線（LineString）
- 面（Polygon）
- 圖徵的屬性資訊

前端取得資料後，可以進一步進行顯示、查詢或其他空間資料處理。

常見用途包括：

- 查詢地圖上某個圖徵的屬性。
- 取得指定範圍內的空間資料。
- 將取得的資料轉換成前端可以使用的格式。
- 搭配 OpenLayers 的 Vector Layer 顯示向量圖徵。

### GetFeature 請求

WFS 常見的資料查詢操作為 GetFeature。

以下是一個簡化的請求範例：

```text
GET https://example.com/geoserver/ows?
service=WFS&
version=2.0.0&
request=GetFeature&
typeNames=workspace:layer_name&
outputFormat=application/json&
srsName=EPSG:4326
```

幾個常見參數：

| 參數 | 說明 |
| --- | --- |
| service | 指定使用 WFS 服務 |
| version | WFS 服務版本 |
| request | 指定 GetFeature 操作 |
| typeNames | 指定要查詢的圖層 |
| outputFormat | 指定資料輸出格式 |
| srsName | 指定輸出的座標參考系統 |
| bbox | 限定空間查詢範圍 |

例如，使用 `outputFormat=application/json`，可以讓服務以 JSON 格式回傳資料，方便前端進一步處理。

## 四、WMTS：透過地圖磚提升顯示效率

WMTS（Web Map Tile Service）提供的是預先切割好的地圖影像，也就是常說的 Tile（地圖磚）。

與 WMS 每次依照請求範圍產生地圖影像不同，WMTS 會事先將地圖切割成不同層級與位置的影像磚。

當使用者縮放或移動地圖時，前端可以依照目前的縮放層級與地圖位置，載入對應的影像磚。

常見用途包括：

- 大範圍地圖的快速顯示。
- 常態使用的地圖底圖。
- 需要頻繁縮放與平移的地圖應用。

### GetTile 請求

WMTS 常見的請求操作為 GetTile。

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

常見參數：

| 參數 | 說明 |
| --- | --- |
| LAYER | 指定要載入的圖層 |
| STYLE | 指定圖層樣式 |
| TILEMATRIXSET | 指定切片矩陣集合 |
| TILEMATRIX | 指定地圖縮放層級 |
| TILEROW | 指定地圖磚所在列 |
| TILECOL | 指定地圖磚所在欄 |
| FORMAT | 指定影像格式 |

WMTS 透過預先產生的地圖磚，減少每次請求都重新產生整張地圖影像的需求，因此在大量地圖瀏覽的情境中，通常能提供較好的載入效率。

## 五、WMS、WFS 與 WMTS 有什麼差異？

了解三種服務的用途後，可以從資料提供方式來比較：

| 比較項目 | WMS | WFS | WMTS |
| --- | --- | --- | --- |
| 提供內容 | 地圖影像 | 空間要素資料 | 切片影像資料 |
| 資料類型 | Raster | Vector | Raster Tiles |
| 常見操作 | GetMap | GetFeature | GetTile |
| 主要用途 | 顯示地圖 | 查詢與處理資料 | 快速顯示地圖 |

可以用比較直覺的方式理解：

- WMS：向伺服器取得指定範圍的地圖影像。
- WFS：向伺服器取得可以進一步處理的空間資料。
- WMTS：向伺服器取得已經切割完成的地圖影像。

它們並不是互相取代的關係，而是依照應用需求選擇適合的服務。

## 六、OpenLayers 如何搭配這些地圖服務？

OpenLayers 是一套用於網頁地圖開發的 JavaScript 函式庫，可以整合不同來源的地圖資料，並透過 Layer 與 Source 管理地圖內容。

在 OpenLayers 中，常見的結構包括：

- Map：地圖本身，負責管理整個地圖畫面。
- View：控制地圖中心點、縮放層級與座標系統。
- Layer：地圖上的圖層。
- Source：圖層實際使用的資料來源。

不同的地圖服務可以搭配不同的 Source。

### 1. WMS：TileWMS

OpenLayers 提供 `TileWMS`，可以搭配 `TileLayer` 使用。

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

這種方式可以讓 OpenLayers 透過 WMS 服務取得地圖影像，並將其呈現在地圖圖層中。

### 2. WFS：VectorLayer 與 VectorSource

如果需要取得向量資料，可以透過 `VectorSource` 搭配 `VectorLayer` 顯示。

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

這裡使用 GeoJSON 格式讀取服務回傳的空間資料，再交由 OpenLayers 建立對應的向量圖徵。

### 3. WMTS：透過地圖磚載入

WMTS 則可以透過 OpenLayers 的 WMTS Source 搭配 TileLayer 使用。

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

實際使用時，還需要依照服務提供的 Capabilities 與 TileGrid 設定，包含切片矩陣、解析度及原點等資訊。

## 七、如何取得地圖服務的設定資訊？

當需要串接一個不熟悉的 OGC 地圖服務時，可以先透過 Capabilities 了解服務支援的內容。

例如 WMS：

```text
https://example.com/geoserver/ows?service=WMS&request=GetCapabilities
```

WFS：

```text
https://example.com/geoserver/ows?service=WFS&request=GetCapabilities
```

Capabilities 通常會提供服務支援的版本、圖層資訊、座標系統及其他相關設定。

WMTS 也有對應的 GetCapabilities 操作，可以用來查詢支援的圖層、TileMatrixSet 與切片設定。

這些資訊可以幫助開發者了解服務提供了哪些資料，以及前端需要使用哪些參數進行串接。

## 八、這次學到的事

接觸 GIS 開發之前，我對地圖的理解比較偏向前端畫面，會先想到如何建立 Map、載入 Layer，以及控制地圖的縮放與移動。

但開始了解 OGC 標準後，才發現地圖上的圖層其實有不同的資料來源與提供方式。

WMS、WFS 與 WMTS 雖然最後都可能呈現在同一張地圖上，但它們背後處理的資料並不相同。理解這些差異後，再回頭看 OpenLayers 的 Layer 與 Source 設定，就比較能知道為什麼不同圖資需要使用不同的載入方式。

對我來說，這也是接觸 GIS 開發後的一個收穫：除了知道如何把圖層顯示出來，也要逐漸理解資料是從哪裡來、透過什麼方式取得，以及前端應該如何處理。

---

參考方向：

- Open Geospatial Consortium（OGC）標準
- OpenLayers 官方文件
- GeoServer 官方文件

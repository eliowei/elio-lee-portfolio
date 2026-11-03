---
title: OpenLayers 圖層管理實作：新增、移除、切換與狀態同步
description: 從前端開發角度出發，透過 OpenLayers 實作圖層註冊、動態新增、移除、切換與 Vue 狀態同步，並整理圖層重複加入、zIndex 與資源清理等常見問題。
date: 2025-06-05
category: gis
tags:
  - GIS
  - OpenLayers
  - Layer
  - Vue
  - Frontend
readingTime: 10
draft: false
---

# OpenLayers 圖層管理實作：新增、移除、切換與狀態同步

在地圖應用中，圖層管理是很常見的開發需求。

一張地圖可能同時包含道路底圖、衛星影像、行政區域、道路資料、標記點位，以及不同分析結果。隨著功能增加，使用者通常需要透過圖層清單，決定哪些資料要顯示、隱藏或切換。

剛開始實作時，可能只需要呼叫幾個 OpenLayers API：

```js
map.addLayer(layer)
map.removeLayer(layer)
layer.setVisible(false)
```

但當圖層數量增加，且需要與 Vue 的 Checkbox、選單或其他操作介面整合時，就會開始遇到一些問題：

- 如何避免同一個圖層被重複加入？
- 如何透過名稱找到指定圖層？
- 切換圖層時，如何維持正確的顯示順序？
- 如何讓 Vue 的 UI 狀態與地圖保持同步？
- 移除圖層後，是否還需要清理其他資源？

這篇文章會透過一個簡化的 OpenLayers 範例，逐步建立圖層管理方式。

## 一、先理解 OpenLayers 的圖層結構

在開始管理圖層之前，先了解 OpenLayers 中幾個重要物件的關係。

- Map：負責管理地圖、View、圖層與互動事件。
- Layer：負責定義地圖資料如何呈現。
- Source：負責提供圖層所需的資料來源。
- LayerGroup：將多個圖層組合在一起管理。

例如，一張地圖可能有以下結構：

```text
Map
│
├── BaseMapGroup
│   ├── RoadLayer
│   └── SatelliteLayer
│
├── DataLayerGroup
│   ├── AdministrativeLayer
│   └── TrafficLayer
│
└── InteractionLayer
    ├── MarkerLayer
    └── DrawingLayer
```

這樣的結構可以讓不同用途的圖層分開管理。

例如切換底圖時，只需要操作 BaseMapGroup，而不需要影響其他資料圖層。

OpenLayers 可以透過 `LayerGroup` 建立這種分組結構：

```js
import LayerGroup from 'ol/layer/Group.js'

const baseMapGroup = new LayerGroup({
  layers: [
    roadLayer,
    satelliteLayer,
  ],
})

map.addLayer(baseMapGroup)
```

如果需要取得群組內的圖層，可以透過：

```js
const layers = baseMapGroup.getLayers()
```

需要注意的是，`map.getLayers()` 取得的是地圖最上層的圖層集合，不會自動將所有子群組展開。若需要取得巢狀群組內的圖層，可以使用 `map.getAllLayers()`。

## 二、建立地圖與基本圖層

先建立一張簡單的地圖，作為後續範例的基礎。

```js
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import OSM from 'ol/source/OSM.js'

const baseMap = new TileLayer({
  source: new OSM(),
})

const map = new Map({
  target: 'map',
  layers: [baseMap],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
})
```

這裡建立了一個使用 OpenStreetMap 的底圖圖層。

後續不論是新增 WMS、WMTS 或 VectorLayer，都可以透過相同的 Map 圖層管理 API 進行操作。

## 三、新增與移除圖層

OpenLayers 提供兩個最基本的 API：

### 1. 新增圖層

```js
map.addLayer(layer)
```

`addLayer()` 會將指定圖層加入地圖的圖層集合，預設加入最上層。

### 2. 移除圖層

```js
map.removeLayer(layer)
```

`removeLayer()` 會將指定圖層從地圖的圖層集合移除。

這裡要注意一個容易混淆的地方：

**從地圖移除圖層，不等於將圖層物件或資料來源完全銷毀。**

例如：

```js
map.removeLayer(layer)
```

執行後，原本的 `layer` 物件仍然可以被其他程式碼持有，也可以在需要時重新加入地圖。

因此，如果後續還要重新使用相同圖層，不一定需要重新建立 Layer 與 Source。

## 四、避免重複加入相同圖層

當圖層是透過不同功能或事件動態新增時，需要考慮重複加入的問題。

例如：

```js
map.addLayer(trafficLayer)
map.addLayer(trafficLayer)
```

OpenLayers 的圖層集合是 Collection，預設不會替你以業務上的圖層名稱去重複。因此，管理圖層時應自行定義識別方式，避免同一個圖層實例被重複註冊。

一個簡單的方式，是在圖層建立時設定自訂屬性：

```js
const trafficLayer = new TileLayer({
  source: new OSM(),
  properties: {
    layerId: 'traffic',
  },
})
```

新增前先檢查：

```js
function addLayerSafely(map, layer) {
  const layerId = layer.get('layerId')

  const exists = map
    .getAllLayers()
    .some(item => item.get('layerId') === layerId)

  if (exists) {
    return false
  }

  map.addLayer(layer)

  return true
}
```

這裡使用 `getAllLayers()`，是為了讓檢查範圍包含巢狀 LayerGroup 裡面的圖層。

這個範例假設每個圖層都有唯一的 `layerId`，實際使用時也應避免未設定識別值的圖層被誤判為同一個圖層。

## 五、建立簡單的 LayerManager

當專案中的圖層越來越多，如果每個功能都直接操作 `map.addLayer()`、`map.removeLayer()`，圖層管理邏輯就容易分散在不同地方。

這時候可以建立一個 LayerManager，集中管理圖層的註冊與操作。

```js
class LayerManager {
  constructor(map) {
    this.map = map
    this.layers = new Map()
  }

  add(name, layer) {
    if (this.layers.has(name)) {
      return false
    }

    layer.set('layerId', name)

    this.layers.set(name, layer)
    this.map.addLayer(layer)

    return true
  }

  remove(name) {
    const layer = this.layers.get(name)

    if (!layer) {
      return false
    }

    this.map.removeLayer(layer)
    this.layers.delete(name)

    return true
  }

  get(name) {
    return this.layers.get(name) ?? null
  }

  show(name) {
    const layer = this.get(name)

    if (!layer) return false

    layer.setVisible(true)

    return true
  }

  hide(name) {
    const layer = this.get(name)

    if (!layer) return false

    layer.setVisible(false)

    return true
  }
}
```

建立管理器：

```js
const layerManager = new LayerManager(map)
```

新增圖層：

```js
layerManager.add('traffic', trafficLayer)
```

隱藏圖層：

```js
layerManager.hide('traffic')
```

重新顯示：

```js
layerManager.show('traffic')
```

移除圖層：

```js
layerManager.remove('traffic')
```

這種方式的主要優點，是將圖層註冊與操作集中管理。

不過這只是簡化版的管理器，假設圖層都由這個管理器建立與管理。如果地圖中還有其他模組直接呼叫 `map.addLayer()`，就需要額外處理管理器與實際圖層集合之間的一致性。

## 六、切換圖層：隱藏與移除有什麼差別？

這是實際開發時很常遇到的判斷。

OpenLayers 提供：

```js
layer.setVisible(false)
```

以及：

```js
map.removeLayer(layer)
```

兩者的用途不同。

| 操作 | 行為 | 是否保留圖層物件 | 是否可重新顯示 | 適合情境 |
|---|---|---|---|---|
| `setVisible(false)` | 只是隱藏 | 是 | 是 | 暫時切換底圖、切換分析主題 |
| `removeLayer()` | 從地圖集合中移除 | 是 | 需要重新 `addLayer` | 不再需要、一次性圖層 |

例如，底圖切換通常不需要每次都重新建立圖層，可以先建立多個底圖，再透過 `setVisible()` 控制顯示狀態。

```js
const roadLayer = new TileLayer({
  source: roadSource,
  visible: true,
})

const satelliteLayer = new TileLayer({
  source: satelliteSource,
  visible: false,
})

map.addLayer(roadLayer)
map.addLayer(satelliteLayer)
```

切換底圖：

```js
function switchBaseMap(type) {
  roadLayer.setVisible(type === 'road')
  satelliteLayer.setVisible(type === 'satellite')
}
```

這種做法可以保留圖層物件與來源設定，避免每次切換都重新建立。

但如果圖層本身只在特定操作時短暫使用，例如一次性的分析結果，就可以考慮在操作結束後移除。

因此，並不是所有圖層都應該使用同一種切換方式。

## 七、圖層顯示順序：zIndex

除了圖層是否顯示之外，還需要考慮不同圖層之間的堆疊順序。

OpenLayers 提供 `setZIndex()` 控制圖層的顯示層級：

```js
baseMap.setZIndex(0)
administrativeLayer.setZIndex(10)
trafficLayer.setZIndex(20)
markerLayer.setZIndex(30)
```

數值越大，圖層通常會顯示在越上層。

不過，圖層的渲染順序不只取決於 zIndex，也會受到圖層集合順序影響。

當 zIndex 相同時，集合中的順序也會參與渲染排序。

另外，如果使用 LayerGroup，群組本身的可見性、層級與子圖層設定也會影響最終結果。

因此，實際開發時可以先規劃圖層層級：

```text
0   底圖
10  行政區域
20  一般資料圖層
30  分析結果
40  互動標記
```

這樣比在各個功能中隨意設定 zIndex 更容易維護。

## 八、Vue 3 與 OpenLayers：同步 UI 和圖層狀態

如果使用 Vue 3 開發地圖介面，常見的需求是讓使用者透過 Checkbox 控制圖層顯示。

例如：

```vue
<template>
  <div>
    <label>
      <input
        type="checkbox"
        v-model="layerVisibility.traffic"
        @change="updateLayer('traffic')"
      />
      交通圖層
    </label>

    <label>
      <input
        type="checkbox"
        v-model="layerVisibility.road"
        @change="updateLayer('road')"
      />
      道路圖層
    </label>

    <div id="map"></div>
  </div>
</template>
```

在 Vue 中保存 UI 狀態：

```js
import { reactive } from 'vue'

const layerVisibility = reactive({
  traffic: true,
  road: true,
})
```

當狀態改變時，同步更新 OpenLayers：

```js
function updateLayer(name) {
  const layer = layerManager.get(name)

  if (!layer) return

  layer.setVisible(layerVisibility[name])
}
```

這裡的設計重點是：

- Vue 負責管理使用者介面的狀態。
- OpenLayers 負責實際地圖圖層的顯示。
- 透過明確的方法將 UI 狀態同步至地圖。

不要讓 UI 和圖層各自維護一套沒有同步機制的狀態。

如果專案有其他程式碼也會直接修改 `layer.setVisible()`，就需要另外設計事件同步或統一操作入口，避免狀態不一致。

另外，OpenLayers 的 Map、Layer 等物件並不需要直接當作一般深層響應式資料處理。Vue 3 整合時，可以考慮使用 `shallowRef()` 保存 Map 實例，避免不必要的深層代理。

```js
import { shallowRef } from 'vue'

const mapInstance = shallowRef(null)
```

## 九、移除圖層時，真的需要清理 Source 嗎？

這是另一個容易混淆的地方。

例如：

```js
map.removeLayer(layer)
```

這個方法的責任是將圖層從地圖中移除，不會自動代表所有相關物件都被銷毀。

但也不代表每次移除圖層，都需要呼叫：

```js
layer.getSource().clear()
```

因為 `clear()` 對 VectorSource 而言，是清除其中的 Features。

假設這個 VectorSource 還需要保留原本資料，或後續要重新加入地圖，就不應該隨意清空。

比較合理的處理方式是依照需求決定：

**情境一：暫時隱藏圖層**

```js
layer.setVisible(false)
```

保留圖層與資料來源。

**情境二：從地圖移除，但之後可能重新使用**

```js
map.removeLayer(layer)
```

保留 Layer 與 Source 物件，由程式其他部分管理。

**情境三：移除一次性分析結果**

```js
map.removeLayer(layer)
source.clear()
```

只有在確定這份資料不再需要，且沒有其他地方共用該 Source 時，才清除資料。

如果有額外註冊事件監聽器，也要在不再需要時解除，例如：

```js
import { unByKey } from 'ol/Observable.js'

const eventKey = layer.on('change:visible', () => {
  console.log('圖層顯示狀態已變更')
})

// 不再需要監聽時
unByKey(eventKey)
```

因此，圖層移除、資料清除與事件解除監聽，是不同的生命週期管理工作，不應混為一談。

## 十、實務上如何選擇圖層管理方式？

整理前面的內容，可以依照不同需求選擇適合的管理方式。

| 開發需求 | 建議方式 |
|---|---|
| 切換不同底圖 | `setVisible()` |
| 暫時隱藏資料圖層 | `setVisible()` |
| 動態新增資料圖層 | `addLayer()` |
| 不再需要某個圖層 | `removeLayer()` |
| 管理多個相關圖層 | `LayerGroup` |
| 圖層數量多且操作分散 | `LayerManager` |
| Vue Checkbox 控制圖層 | Vue 狀態同步 + `setVisible()` |
| 清除一次性 Vector 資料 | `source.clear()` |

需要注意的是，LayerManager 並不是 OpenLayers 必備的功能，而是一種可以依專案複雜度採用的封裝方式。

如果只有兩三個固定圖層，直接使用 OpenLayers API 就足夠了。當圖層操作開始分散在多個元件或功能模組時，再考慮抽離管理邏輯，會比較符合實際需求。

## 十一、這次學到的事

整理 OpenLayers 圖層管理時，我發現真正需要注意的並不是 API 本身有多複雜，而是不同操作背後代表的意義。

例如，隱藏圖層不等於移除圖層，移除圖層也不等於銷毀資料來源。

如果沒有先區分這些行為，很容易在功能增加後，讓圖層狀態、資料來源與 UI 操作變得難以追蹤。

另外，當 OpenLayers 與 Vue 一起使用時，也需要清楚劃分兩邊的責任：Vue 管理介面狀態，OpenLayers 負責地圖渲染，再透過明確的操作方法保持同步。

我認為圖層管理最重要的不是一開始就建立很複雜的管理器，而是先理解圖層的生命週期與操作方式，再根據專案規模決定是否需要抽象化。

這樣在後續增加圖層、切換底圖或整合其他 GIS 功能時，才比較容易維持程式碼的可讀性與可維護性。
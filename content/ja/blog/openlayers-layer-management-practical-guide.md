---
title: OpenLayers のレイヤー管理の実装：追加、削除、切り替え、状態の同期
description: フロントエンド開発の視点から、OpenLayers でレイヤーの登録、動的な追加と削除、切り替え、Vue の状態との同期を実装し、レイヤーの重複追加、zIndex、リソースの後片付けといったよくある問題を整理します。
date: 2025-06-26
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

# OpenLayers のレイヤー管理の実装：追加、削除、切り替え、状態の同期

地図アプリケーションでは、レイヤー管理はよくある開発の要件です。

1 枚の地図に、道路のベースマップ、衛星画像、行政区域、道路データ、マーカー、さまざまな分析結果が同時に含まれることがあります。機能が増えるにつれ、ユーザーはたいていレイヤーの一覧から、どのデータを表示・非表示・切り替えするかを決める必要が出てきます。

実装し始めたばかりの頃は、OpenLayers の API をいくつか呼ぶだけで済むかもしれません：

```js
map.addLayer(layer)
map.removeLayer(layer)
layer.setVisible(false)
```

しかしレイヤーの数が増え、Vue のチェックボックスやメニューなどの操作画面と統合する必要が出てくると、次のような問題にぶつかり始めます：

- 同じレイヤーが重複して追加されるのをどう防ぐか。
- 名前から特定のレイヤーをどう見つけるか。
- レイヤーを切り替えるとき、正しい表示順をどう保つか。
- Vue の UI の状態と地図をどう同期させるか。
- レイヤーを削除したあと、ほかのリソースも片付ける必要があるか。

この記事では、簡略化した OpenLayers の例を使って、レイヤー管理の方法を段階的に組み立てていきます。

## 1. まず OpenLayers のレイヤー構造を理解する

レイヤーを管理する前に、OpenLayers の主要なオブジェクトの関係を理解しておきましょう。

- Map：地図、View、レイヤー、インタラクションのイベントを管理する。
- Layer：地図データをどう表示するかを定義する。
- Source：レイヤーが必要とするデータソースを提供する。
- LayerGroup：複数のレイヤーをまとめて管理する。

たとえば、1 枚の地図は次のような構造になることがあります：

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

このような構造にすれば、用途の異なるレイヤーを分けて管理できます。

たとえばベースマップを切り替えるときは BaseMapGroup を操作するだけでよく、ほかのデータレイヤーに影響を与えずに済みます。

OpenLayers では `LayerGroup` でこうしたグループ構造を作れます：

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

グループ内のレイヤーを取得したい場合は、次のようにします：

```js
const layers = baseMapGroup.getLayers()
```

注意したいのは、`map.getLayers()` が返すのは地図の最上位のレイヤーの集合で、サブグループを自動で展開しないことです。入れ子になったグループ内のレイヤーを取得したい場合は `map.getAllLayers()` を使います。

## 2. 地図と基本のレイヤーを作る

まず、以降の例の土台となるシンプルな地図を作ります。

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

ここでは OpenStreetMap を使ったベースマップのレイヤーを作りました。

このあと WMS、WMTS、VectorLayer のどれを追加する場合でも、同じ Map のレイヤー管理 API で操作できます。

## 3. レイヤーの追加と削除

OpenLayers には、もっとも基本的な API が 2 つあります：

### 1. レイヤーを追加する

```js
map.addLayer(layer)
```

`addLayer()` は指定したレイヤーを地図のレイヤーの集合に追加し、デフォルトでは最上位に追加します。

### 2. レイヤーを削除する

```js
map.removeLayer(layer)
```

`removeLayer()` は指定したレイヤーを地図のレイヤーの集合から取り除きます。

ここには混同しやすい点がひとつあります：

**地図からレイヤーを削除することは、レイヤーのオブジェクトやデータソースを完全に破棄することと同じではありません。**

たとえば：

```js
map.removeLayer(layer)
```

これを実行したあとも、元の `layer` オブジェクトはほかのコードが保持し続けられ、必要になればまた地図に追加できます。

そのため、同じレイヤーをあとで再利用するなら、Layer と Source を作り直す必要があるとは限りません。

## 4. 同じレイヤーの重複追加を防ぐ

レイヤーをさまざまな機能やイベントから動的に追加する場合は、重複して追加される問題を考える必要があります。

たとえば：

```js
map.addLayer(trafficLayer)
map.addLayer(trafficLayer)
```

OpenLayers のレイヤーの集合は Collection で、業務上のレイヤー名による重複排除をデフォルトでは行ってくれません。そのためレイヤーを管理するときは、自分で識別方法を決め、同じレイヤーのインスタンスが重複して登録されないようにする必要があります。

簡単な方法は、レイヤーを作るときに独自のプロパティを設定することです：

```js
const trafficLayer = new TileLayer({
  source: new OSM(),
  properties: {
    layerId: 'traffic',
  },
})
```

追加する前にチェックします：

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

ここで `getAllLayers()` を使っているのは、入れ子になった LayerGroup の中のレイヤーまでチェックの範囲に含めるためです。

この例はすべてのレイヤーに一意の `layerId` があることを前提にしています。実際に使うときは、識別値が設定されていないレイヤーが同じレイヤーと誤判定されないようにも注意してください。

## 5. シンプルな LayerManager を作る

プロジェクトのレイヤーが増えてくると、各機能が直接 `map.addLayer()`、`map.removeLayer()` を操作していては、レイヤー管理のロジックがあちこちに散らばりやすくなります。

そんなときは LayerManager を作り、レイヤーの登録と操作をまとめて管理できます。

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

マネージャーを作る：

```js
const layerManager = new LayerManager(map)
```

レイヤーを追加する：

```js
layerManager.add('traffic', trafficLayer)
```

レイヤーを非表示にする：

```js
layerManager.hide('traffic')
```

もう一度表示する：

```js
layerManager.show('traffic')
```

レイヤーを削除する：

```js
layerManager.remove('traffic')
```

この方法の主な利点は、レイヤーの登録と操作を一か所にまとめられることです。

ただしこれは簡略化したマネージャーで、すべてのレイヤーがこのマネージャーによって作られ管理されることを前提にしています。地図のほかのモジュールが直接 `map.addLayer()` を呼んでいる場合は、マネージャーと実際のレイヤーの集合との整合性を別に扱う必要があります。

## 6. レイヤーの切り替え：非表示と削除の違いは何か

これは実際の開発でよく迫られる判断です。

OpenLayers には次のものがあります：

```js
layer.setVisible(false)
```

そして：

```js
map.removeLayer(layer)
```

両者は用途が異なります。

| 操作 | 挙動 | レイヤーのオブジェクトを残すか | 再表示できるか | 向いている場面 |
|---|---|---|---|---|
| `setVisible(false)` | 非表示にするだけ | 残す | できる | ベースマップや分析テーマの一時的な切り替え |
| `removeLayer()` | 地図の集合から取り除く | 残す | もう一度 `addLayer` が必要 | もう不要なレイヤー、一度きりのレイヤー |

たとえばベースマップの切り替えでは、毎回レイヤーを作り直す必要はふつうありません。先に複数のベースマップを作っておき、`setVisible()` で表示状態を制御できます。

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

ベースマップを切り替える：

```js
function switchBaseMap(type) {
  roadLayer.setVisible(type === 'road')
  satelliteLayer.setVisible(type === 'satellite')
}
```

この方法ならレイヤーのオブジェクトとソースの設定を残せるので、切り替えのたびに作り直さずに済みます。

ただし、一度きりの分析結果のように、特定の操作のときだけ短時間使うレイヤーなら、操作が終わったら削除することを検討できます。

つまり、すべてのレイヤーを同じ方法で切り替えるべきだというわけではありません。

## 7. レイヤーの表示順：zIndex

レイヤーを表示するかどうかに加えて、レイヤー同士の重なり順も考える必要があります。

OpenLayers には、レイヤーの表示階層を制御する `setZIndex()` があります：

```js
baseMap.setZIndex(0)
administrativeLayer.setZIndex(10)
trafficLayer.setZIndex(20)
markerLayer.setZIndex(30)
```

値が大きいほど、レイヤーはたいてい上に表示されます。

ただし、レイヤーの描画順は zIndex だけで決まるのではなく、レイヤーの集合の順番にも影響されます。

zIndex が同じ場合は、集合内の順番も描画の並びに関わります。

さらに LayerGroup を使っている場合は、グループ自体の可視性や階層、子レイヤーの設定も最終的な結果に影響します。

そのため実際の開発では、先にレイヤーの階層を計画しておくとよいでしょう：

```text
0   ベースマップ
10  行政区域
20  一般的なデータレイヤー
30  分析結果
40  インタラクティブなマーカー
```

こうしておけば、機能ごとにばらばらに zIndex を設定するより保守しやすくなります。

## 8. Vue 3 と OpenLayers：UI とレイヤーの状態を同期させる

Vue 3 で地図の画面を開発する場合、よくある要件は、ユーザーがチェックボックスでレイヤーの表示を制御できるようにすることです。

たとえば：

```vue
<template>
  <div>
    <label>
      <input
        type="checkbox"
        v-model="layerVisibility.traffic"
        @change="updateLayer('traffic')"
      />
      交通レイヤー
    </label>

    <label>
      <input
        type="checkbox"
        v-model="layerVisibility.road"
        @change="updateLayer('road')"
      />
      道路レイヤー
    </label>

    <div id="map"></div>
  </div>
</template>
```

Vue で UI の状態を保持します：

```js
import { reactive } from 'vue'

const layerVisibility = reactive({
  traffic: true,
  road: true,
})
```

状態が変わったら OpenLayers も同期して更新します：

```js
function updateLayer(name) {
  const layer = layerManager.get(name)

  if (!layer) return

  layer.setVisible(layerVisibility[name])
}
```

この設計のポイントは次のとおりです：

- Vue はユーザーインターフェースの状態を管理する。
- OpenLayers は実際の地図レイヤーの表示を担当する。
- 明確なメソッドで UI の状態を地図に同期させる。

UI とレイヤーが、同期の仕組みのないまま別々に状態を持つことのないようにしましょう。

プロジェクトのほかのコードも直接 `layer.setVisible()` を変更する場合は、状態の不一致を防ぐために、イベントによる同期や操作の入り口の一本化を別に設計する必要があります。

また、OpenLayers の Map や Layer などのオブジェクトは、一般的な深いリアクティブなデータとして扱う必要はありません。Vue 3 と統合するときは、`shallowRef()` で Map のインスタンスを保持し、不要な深いプロキシ化を避けることを検討できます。

```js
import { shallowRef } from 'vue'

const mapInstance = shallowRef(null)
```

## 9. レイヤーを削除するとき、本当に Source を片付ける必要があるか

これも混同しやすい点です。

たとえば：

```js
map.removeLayer(layer)
```

このメソッドの役割はレイヤーを地図から取り除くことであり、関連するすべてのオブジェクトが自動で破棄されることを意味するわけではありません。

かといって、レイヤーを削除するたびに次を呼ぶ必要があるわけでもありません：

```js
layer.getSource().clear()
```

VectorSource にとって `clear()` は、中の Feature を消去することだからです。

その VectorSource が元のデータを残しておく必要がある場合や、あとでまた地図に追加する場合は、むやみに空にすべきではありません。

より妥当なのは、要件に応じて決めることです：

**ケース 1：レイヤーを一時的に非表示にする**

```js
layer.setVisible(false)
```

レイヤーとデータソースは残します。

**ケース 2：地図から取り除くが、あとで再利用するかもしれない**

```js
map.removeLayer(layer)
```

Layer と Source のオブジェクトは残し、プログラムのほかの部分で管理します。

**ケース 3：一度きりの分析結果を削除する**

```js
map.removeLayer(layer)
source.clear()
```

そのデータがもう必要なく、ほかにその Source を共有している箇所がないと確信できるときだけ、データを消去します。

イベントリスナーを別に登録している場合も、不要になったら解除します。たとえば：

```js
import { unByKey } from 'ol/Observable.js'

const eventKey = layer.on('change:visible', () => {
  console.log('レイヤーの表示状態が変わりました')
})

// 監視が不要になったら
unByKey(eventKey)
```

このように、レイヤーの削除、データの消去、イベントリスナーの解除は別々のライフサイクル管理の作業であり、一緒くたにすべきではありません。

## 10. 実務ではレイヤー管理の方法をどう選ぶか

ここまでの内容をまとめると、要件に応じて適した管理方法を選べます。

| 開発の要件 | おすすめの方法 |
|---|---|
| ベースマップを切り替える | `setVisible()` |
| データレイヤーを一時的に非表示にする | `setVisible()` |
| データレイヤーを動的に追加する | `addLayer()` |
| あるレイヤーがもう不要 | `removeLayer()` |
| 関連する複数のレイヤーを管理する | `LayerGroup` |
| レイヤーが多く、操作が分散している | `LayerManager` |
| Vue のチェックボックスでレイヤーを制御する | Vue の状態の同期 + `setVisible()` |
| 一度きりの Vector データを消去する | `source.clear()` |

注意したいのは、LayerManager は OpenLayers に必須の機能ではなく、プロジェクトの複雑さに応じて採用できるラッパーの一形態だということです。

固定のレイヤーが 2、3 枚しかないなら、OpenLayers の API を直接使えば十分です。レイヤーの操作が複数のコンポーネントや機能モジュールに散らばり始めたら、管理のロジックを切り出すことを考えるのが実際のニーズに合っています。

## 11. 今回学んだこと

OpenLayers のレイヤー管理をまとめてみて、本当に注意すべきなのは API そのものの複雑さではなく、それぞれの操作が何を意味しているかだと気づきました。

たとえば、レイヤーを非表示にすることは削除することではなく、レイヤーを削除することはデータソースを破棄することではありません。

こうした挙動を最初に区別しておかないと、機能が増えるにつれて、レイヤーの状態、データソース、UI の操作が追いにくくなりがちです。

また、OpenLayers と Vue を一緒に使うときは、両者の責任をはっきり分ける必要もあります。Vue はインターフェースの状態を管理し、OpenLayers は地図の描画を担当し、明確な操作メソッドで同期を保ちます。

レイヤー管理でいちばん大切なのは、最初から複雑なマネージャーを作ることではなく、まずレイヤーのライフサイクルと操作の仕方を理解し、そのうえでプロジェクトの規模に応じて抽象化が必要かを決めることだと思います。

そうすれば、あとでレイヤーを追加したり、ベースマップを切り替えたり、ほかの GIS の機能を統合したりするときも、コードの読みやすさと保守性を保ちやすくなります。

---
title: EPSG:4326、EPSG:3857、TWD97：GIS の座標系と OpenLayers での座標変換を理解する
description: 緯度経度、Web Mercator から台湾でよく使われる TWD97 の 2 度帯座標まで、座標系ごとの違いと、OpenLayers で座標変換を行う方法を理解します。
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

# EPSG:4326、EPSG:3857、TWD97：GIS の座標系と OpenLayers での座標変換を理解する

一般的なウェブ開発では、画面上の要素の位置を X、Y 座標で指定することに慣れています。

しかし GIS の開発では、座標は単なる数値ではなく、その数値がどの座標系に基づいて計算されたものかも知る必要があります。

たとえば、台湾のある場所を表す座標でも、緯度経度で表されることもあれば、地図投影を経た平面座標で表されることもあります。

座標系を確認しないままデータを地図に載せると、位置がずれる、地図の中心がおかしくなる、レイヤーが正しく重ならない、といったことが起こりえます。

この記事では、GIS 開発でよく使われる EPSG:4326 と EPSG:3857、そして台湾でよく使われる TWD97 座標系から、それぞれの違いと、OpenLayers で座標変換を行う方法を整理します。

## 1. なぜ GIS には座標系が必要なのか

地球は球に近い三次元の物体ですが、ウェブの地図はふつう二次元の平面で表示されます。

そのため、座標系と地図投影によって、地表の位置を平面上の座標に変換する必要があります。

これが、GIS にさまざまな座標参照系（Coordinate Reference System、CRS）がある理由です。

座標系によって、次のものが異なることがあります：

- 測地基準系（Datum）
- 座標の表し方
- 地図投影の方法
- 座標の単位

たとえば緯度経度は通常角度で表し、投影された平面座標はメートルで表すことがあります。

この 2 つは同じ地理的な位置を表していても、数値はまったく異なります。

## 2. EPSG:4326：緯度経度で位置を表す

EPSG:4326 は WGS 84 の地理座標系に対応し、GPS、地理データの交換、さまざまな地図サービスでよく使われます。

経度（Longitude）と緯度（Latitude）で地球上の位置を表し、単位は度（Degree）です。

たとえば：

```js
const coordinate = [121.5654, 25.0330]
```

この座標は台湾の台北付近を表しています。

OpenLayers の一般的な座標配列では、順番は次のとおりです：

```js
[経度, 緯度]
```

つまり：

- X：Longitude（経度）
- Y：Latitude（緯度）

注意したいのは、EPSG:4326 は地理座標系であって、地球をそのまま平面の地図に広げる投影法ではないという点です。

## 3. EPSG:3857：Web Mercator 投影

EPSG:3857 は Web Mercator で、Web Mercator や Spherical Mercator とも呼ばれます。

地理座標を平面に投影し、座標の単位はメートルなので、ウェブ地図の表示、ズーム、パンに適しています。

OpenStreetMap の標準タイルなど、よく使われるウェブ地図サービスの多くは Web Mercator を使っています。

EPSG:4326 とは違い、EPSG:3857 の座標は経度と緯度ではなく、投影後の X、Y の平面座標です。

たとえば：

```js
const coordinate = [13519300, 2870000]
```

こうした数値は投影面上の位置を表しており、そのまま緯度経度として使うことはできません。

### なぜ投影が必要なのか

地表は曲面なので、ゆがみを生じさせずに二次元の平面へ完全に広げることはできません。

Web Mercator はウェブ地図の閲覧に向いていますが、距離と面積は緯度によってゆがみ、高緯度に近づくほど顕著になります。

そのため EPSG:3857 は一般的なウェブ地図の表示には向いていますが、高精度な距離や面積の計算の根拠としてそのまま使うべきではありません。

## 4. 台湾でよく使われる TWD97 座標系

EPSG:4326 と EPSG:3857 のほかに、台湾の GIS 開発では TWD97 に触れることもよくあります。

TWD97（Taiwan Datum 1997）は台湾でよく使われる測地基準系で、2 度帯の横メルカトル投影（TM2）と組み合わせることで、地理的な位置をメートル単位の平面座標に変換できます。

よく使われる EPSG コードは次の 2 つです：

| EPSG | 座標系 | 中央子午線 |
| --- | --- | --- |
| EPSG:3826 | TWD97 / TM2 zone 121 | 121°E |
| EPSG:3825 | TWD97 / TM2 zone 119 | 119°E |

### なぜ台湾には 2 度帯が必要なのか

緯度経度で位置を表すと単位は度になり、平面上の距離や面積の計算にはそのままでは使いにくくなります。

TM2 投影を使えば、指定した地域を平面座標に変換し、メートルで表せます。

台湾でよく使われる 2 度帯は、対象地域によって異なる中央子午線を使います：

- 121 帯：台湾本島でよく使われる TWD97 の平面座標系。
- 119 帯：金門、馬祖などの地域でよく使われるもうひとつの帯。

そのため台湾の GIS データを受け取ったときは、TWD97 を使っているかどうかに加えて、どの帯を使っているかも確認する必要があります。

### TWD97 と EPSG:4326 の違いは何か

両者の最大の違いは、座標の表し方です：

| 比較項目 | EPSG:4326 | EPSG:3826 |
| --- | --- | --- |
| 測地基準系 | WGS 84 | TWD97 |
| 投影法 | 地理座標 | TM2 2 度帯 |
| 座標の単位 | 度 | メートル |
| 座標の内容 | 経度、緯度 | X、Y の平面座標 |
| 主な用途 | GPS、地理データの交換 | 台湾の測量と GIS の空間データ |

どちらも地球上の位置を表せますが、一方の座標をそのままもう一方として使うことはできません。

## 5. OpenLayers ではどう座標変換するのか

OpenLayers には一般的な座標系間の変換機能が組み込まれており、`ol/proj` モジュールの関数で使えます。

### 1. fromLonLat()

緯度経度の座標を、指定した投影の座標に変換します。

```js
import { fromLonLat } from 'ol/proj'

const lonLat = [121.5654, 25.0330]

const mercatorCoordinate = fromLonLat(lonLat, 'EPSG:3857')

console.log(mercatorCoordinate)
```

この関数は、緯度経度のデータを取得したあと、OpenLayers のデフォルトである Web Mercator の座標に変換したいときに向いています。

変換先の投影を指定しなければ、デフォルトで EPSG:3857 が使われます。

### 2. toLonLat()

EPSG:3857 の座標を取得していて、緯度経度に戻したい場合は `toLonLat()` を使います。

```js
import { toLonLat } from 'ol/proj'

const mercatorCoordinate = [13519300, 2870000]

const lonLat = toLonLat(mercatorCoordinate)

console.log(lonLat)
```

変換すると経度と緯度の座標が得られます。

### 3. transform()

異なる投影の間で変換したい場合は、`transform()` も使えます。

```js
import { transform } from 'ol/proj'

const coordinate = [121.5654, 25.0330]

const result = transform(coordinate, 'EPSG:4326', 'EPSG:3857')

console.log(result)
```

`fromLonLat()` と比べると、`transform()` は変換元と変換先の座標系を明示的に指定できるので、複数の投影を扱うときにより柔軟です。

### 4. transformExtent()

単一の座標点だけでなく、GIS の開発では地図の範囲（Extent）を扱うこともよくあります。

たとえば、範囲は次のような値を持ちます：

```js
[minX, minY, maxX, maxY]
```

元データの座標系と地図が使う座標系が異なる場合は、範囲もあわせて変換する必要があります。

そのときは `transformExtent()` を使います：

```js
import { transformExtent } from 'ol/proj'

const extent = [120.0, 21.0, 122.0, 25.0]

const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')

console.log(transformedExtent)
```

この関数で、緯度経度で表された地理的な範囲を、Web Mercator 投影での範囲に変換できます。

地図のズーム、範囲への移動、WMS のリクエストといった場面で、こうした処理が必要になることがあります。

## 6. OpenLayers は TWD97 の座標をどう扱うのか

EPSG:4326 や EPSG:3857 と違い、OpenLayers はデフォルトの環境で EPSG:3826 の投影定義を提供しているとは限りません。

OpenLayers で TWD97 / TM2 zone 121 を使いたい場合は、通常 Proj4js と組み合わせて投影を登録します。

まずパッケージをインストールします：

```bash
npm install proj4
```

次に EPSG:3826 を定義します：

```js
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs'
)

register(proj4)
```

登録が終われば、OpenLayers の `transform()` で座標変換ができます。

たとえば、TWD97 / TM2 zone 121 を Web Mercator に変換するには：

```js
import { transform } from 'ol/proj'

const twd97Coordinate = [250000, 2760000]

const mercatorCoordinate = transform(twd97Coordinate, 'EPSG:3826', 'EPSG:3857')

console.log(mercatorCoordinate)
```

ここでの `[250000, 2760000]` は座標の形式を示すための値で、特定の場所を表すものではありません。

EPSG:3825 を使う場合は、対応する投影定義を別に登録する必要があり、EPSG:3826 の設定をそのまま流用することはできません。

## 7. 座標系の異なるレイヤーを同じ地図に載せられるか

載せられます。ただし、フロントエンドがそれぞれのデータソースの座標系を知っていることが前提です。

OpenLayers は一部の一般的な投影間の変換に対応しており、レイヤーのソースと View の投影が異なる場合には、レイヤーを自動で再投影することもできます。

たとえば地図の View が EPSG:3857 を使い、WMS サービスが EPSG:4326 の画像を提供している場合、ソースの投影が正しく設定されていれば、OpenLayers が画像を現在の地図の投影に変換してくれます。

ただし、すべての座標系がそのまま使えるわけではありません。

TWD97 / TM2 のように OpenLayers が標準で対応していない投影を扱う場合は、Proj4js で投影定義を登録する必要があるかもしれません。

そのため、さまざまなソースの GIS データを統合するときは、データそのものに加えて、それが使っている座標系をまず把握する必要があります。

## 8. 今回学んだこと

GIS の開発に触れてから、座標はそのまま使える数値の組ではないのだと少しずつ理解するようになりました。

同じ地理的な位置を表していても、緯度経度と投影座標ではまったく違う値になることがあります。座標系を確認しないまま OpenLayers にデータを入れると、地図の位置がおかしくなったり、レイヤーが正しく重ならなかったりする問題にすぐぶつかります。

以前は `EPSG:4326` や `EPSG:3857` を見ても、設定のパラメーターのひとつとしか思っていなかったかもしれません。今は、データソース、View が使っている投影、そして両者の間に変換が必要かどうかに注意を払うようになりました。

そして台湾の GIS 開発では、よく使われる緯度経度や Web Mercator に加えて、TWD97 のような平面座標系に触れることもよくあります。

おかげで地図のレイヤーを扱うときも、データが読み込めたかどうかだけでなく、座標そのものが現在の地図の設定に合っているかをまず確認するようになりました。

---

**参考資料：**

- EPSG Geodetic Parameter Dataset
- OpenLayers 公式ドキュメント：Projection
- OpenLayers 公式ドキュメント：Raster Reprojection
- Proj4js 公式ドキュメント

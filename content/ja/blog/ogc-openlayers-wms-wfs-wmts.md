---
title: OGC から OpenLayers へ：WMS、WFS、WMTS の地図サービスを知る
description: OGC の標準を出発点に、よく使われる 3 つの地図サービス WMS、WFS、WMTS と、それらを OpenLayers と組み合わせて使う方法を紹介します。
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

# OGC から OpenLayers へ：WMS、WFS、WMTS の地図サービスを知る

GIS（地理情報システム）の開発に触れ始めた頃、私が主に気にしていたのは、OpenLayers でウェブページに地図を表示する方法と、さまざまなレイヤーを読み込む方法でした。

しかし学ぶ内容が増えるにつれ、地図上のデータの提供方法は 1 つではないと気づきました。すでに生成された地図画像を提供するサービスもあれば、さらに検索や処理ができる空間データを提供するサービスもあり、あらかじめ切り分けた地図タイルで読み込みを速くするサービスもあります。

こうしたさまざまなデータの提供方法の背後には、それぞれに対応する標準があります。

この記事では、GIS の技術に触れる中で少しずつ理解した OGC の標準と、WMS、WFS、WMTS と OpenLayers の関係をまとめます。

## 1. OGC とは

OGC（Open Geospatial Consortium）は地理情報に関する標準を定める国際的な団体で、異なるシステム、プラットフォーム、サービスの間で、共通の仕様を通じて空間データを交換・利用できるようにすることを主な目的としています。

GIS の開発では、サービスによってデータ形式や通信方法が異なることがあります。各システムがまったく異なるルールを採用していたら、フロントエンドはサービスごとに別々の処理をしなければなりません。

OGC の標準によって、地図サービスは比較的一貫したリクエストとデータ交換の方法を使えるようになり、システム間の統合のコストが下がります。

よく使われる関連の標準や形式をいくつか挙げます：

| 名称 | 主な用途 |
| --- | --- |
| WMS | 地図画像を提供する |
| WFS | 空間フィーチャーのデータを提供する |
| WMTS | タイル地図サービスを提供する |
| CSW | 空間データのカタログの検索と照会 |
| GML | XML 形式の地理データ記述言語 |
| GeoJSON | ウェブでよく使われる空間データの交換形式 |

このうち WMS、WFS、WMTS は、ウェブ地図の開発でよく触れるサービスです。

## 2. WMS：リクエストで地図画像を取得する

WMS（Web Map Service）は主に地図画像を提供し、通常は PNG や JPEG などのラスター形式で返します。

簡単に言うと、フロントエンドが地図サーバーにリクエストを送り、表示したいレイヤー、地図の範囲、画像のサイズを伝えると、サーバーがその条件に従って地図画像を生成します。

主な用途は次のとおりです：

- ベースマップや画像レイヤーを表示する。
- 既存の地図にほかの画像レイヤーを重ねる。
- 異なるソースの地図データを 1 つの画面にまとめる。

### GetMap リクエスト

WMS で地図画像を要求する一般的な操作は GetMap です。

簡略化したリクエストの例を示します：

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

各パラメーターの意味は次のとおりです：

| パラメーター | 説明 |
| --- | --- |
| service | 使用するサービスの種類（WMS など） |
| version | WMS サービスのバージョン |
| request | 操作（GetMap など） |
| layers | 表示するレイヤー |
| styles | レイヤーのスタイル |
| bbox | 地図の表示範囲 |
| crs / srs | 座標参照系 |
| width / height | 返される画像の幅と高さ |
| format | 画像の形式（image/png など） |
| transparent | 背景を透明にするかどうか |

なかでも `BBOX`、`CRS`、`WIDTH`、`HEIGHT` は、WMS のリクエストを理解するうえで重要なパラメーターです。

サーバーは、どの地理的な範囲の画像を生成するのか、そして最終的な画像をどのサイズで出力するのかを知る必要があるからです。

また、WMS が返すのは地図画像であって、一般的なベクターデータとしてそのまま使えるフィーチャーの集合ではありません。フィーチャーとその属性を取得したい場合は、通常 WFS などほかのサービスを検討します。

## 3. WFS：空間フィーチャーと属性データを取得する

WFS（Web Feature Service）と WMS の最大の違いは、単なる地図画像ではなく、空間フィーチャーのデータを提供することです。

このデータには次のようなものが含まれます：

- 点（Point）
- 線（LineString）
- 面（Polygon）
- フィーチャーの属性情報

フロントエンドはデータを取得したあと、表示、検索、その他の空間データの処理をさらに行えます。

主な用途は次のとおりです：

- 地図上のあるフィーチャーの属性を調べる。
- 指定した範囲内の空間データを取得する。
- 取得したデータをフロントエンドで使える形式に変換する。
- OpenLayers の Vector Layer と組み合わせてベクターのフィーチャーを表示する。

### GetFeature リクエスト

WFS でデータを検索する一般的な操作は GetFeature です。

簡略化したリクエストの例を示します：

```text
GET https://example.com/geoserver/ows?
service=WFS&
version=2.0.0&
request=GetFeature&
typeNames=workspace:layer_name&
outputFormat=application/json&
srsName=EPSG:4326
```

よく使われるパラメーター：

| パラメーター | 説明 |
| --- | --- |
| service | WFS サービスを使うことを指定する |
| version | WFS サービスのバージョン |
| request | GetFeature 操作を指定する |
| typeNames | 検索するレイヤー |
| outputFormat | データの出力形式 |
| srsName | 出力の座標参照系 |
| bbox | 空間検索の範囲を限定する |

たとえば `outputFormat=application/json` を使えば、サービスに JSON 形式でデータを返させることができ、フロントエンドでの処理がしやすくなります。

## 4. WMTS：地図タイルで表示を効率化する

WMTS（Web Map Tile Service）が提供するのは、あらかじめ切り分けられた地図画像、いわゆるタイルです。

WMS がリクエストの範囲に応じて毎回地図画像を生成するのに対し、WMTS は地図をあらかじめ、ズームレベルと位置ごとの画像タイルに切り分けておきます。

ユーザーが地図をズームしたり移動したりすると、フロントエンドは現在のズームレベルと地図の位置に応じて、対応するタイルを読み込みます。

主な用途は次のとおりです：

- 広い範囲の地図をすばやく表示する。
- 常時使うベースマップ。
- ズームやパンを頻繁に行う地図アプリケーション。

### GetTile リクエスト

WMTS の一般的なリクエスト操作は GetTile です。

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

よく使われるパラメーター：

| パラメーター | 説明 |
| --- | --- |
| LAYER | 読み込むレイヤー |
| STYLE | レイヤーのスタイル |
| TILEMATRIXSET | タイルマトリックスセット |
| TILEMATRIX | 地図のズームレベル |
| TILEROW | タイルのある行 |
| TILECOL | タイルのある列 |
| FORMAT | 画像の形式 |

WMTS はあらかじめ生成したタイルを使うことで、リクエストのたびに地図画像全体を生成し直す必要を減らせるので、地図を大量に閲覧する場面では一般に読み込みの効率が良くなります。

## 5. WMS、WFS、WMTS の違いは何か

3 つのサービスの用途がわかったら、データの提供方法で比べてみましょう：

| 比較項目 | WMS | WFS | WMTS |
| --- | --- | --- | --- |
| 提供する内容 | 地図画像 | 空間フィーチャーのデータ | タイル画像 |
| データの種類 | Raster | Vector | Raster Tiles |
| 主な操作 | GetMap | GetFeature | GetTile |
| 主な用途 | 地図を表示する | データを検索・処理する | 地図をすばやく表示する |

もっと直感的に言えば：

- WMS：指定した範囲の地図画像をサーバーから取得する。
- WFS：さらに処理できる空間データをサーバーから取得する。
- WMTS：すでに切り分けられた地図画像をサーバーから取得する。

これらは互いに置き換えるものではなく、アプリケーションの要件に応じて適したサービスを選ぶものです。

## 6. OpenLayers ではこれらの地図サービスをどう使うのか

OpenLayers はウェブ地図の開発に使う JavaScript のライブラリで、さまざまなソースの地図データを統合し、Layer と Source で地図の内容を管理できます。

OpenLayers のよくある構成要素は次のとおりです：

- Map：地図そのもので、地図の画面全体を管理する。
- View：地図の中心点、ズームレベル、座標系を制御する。
- Layer：地図上のレイヤー。
- Source：レイヤーが実際に使うデータソース。

地図サービスごとに、組み合わせる Source が異なります。

### 1. WMS：TileWMS

OpenLayers には `TileWMS` があり、`TileLayer` と組み合わせて使えます。

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

この方法で、OpenLayers は WMS サービスから地図画像を取得し、地図のレイヤーに表示できます。

### 2. WFS：VectorLayer と VectorSource

ベクターデータを取得したい場合は、`VectorSource` と `VectorLayer` を組み合わせて表示します。

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

ここでは GeoJSON 形式でサービスが返した空間データを読み込み、OpenLayers に対応するベクターのフィーチャーを作らせています。

### 3. WMTS：タイルで読み込む

WMTS は、OpenLayers の WMTS Source と TileLayer を組み合わせて使えます。

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

実際に使うときは、サービスが提供する Capabilities に従って、タイルマトリックス、解像度、原点などの TileGrid の設定も行う必要があります。

## 7. 地図サービスの設定情報はどう取得するのか

なじみのない OGC の地図サービスと連携するときは、まず Capabilities でサービスが対応している内容を確認できます。

たとえば WMS なら：

```text
https://example.com/geoserver/ows?service=WMS&request=GetCapabilities
```

WFS なら：

```text
https://example.com/geoserver/ows?service=WFS&request=GetCapabilities
```

Capabilities には通常、サービスが対応しているバージョン、レイヤーの情報、座標系、その他の関連設定が記載されています。

WMTS にも対応する GetCapabilities 操作があり、対応しているレイヤー、TileMatrixSet、タイルの設定を調べられます。

こうした情報は、サービスがどんなデータを提供しているのか、フロントエンドがどのパラメーターを使って連携すればよいのかを理解する助けになります。

## 8. 今回学んだこと

GIS の開発に触れる前は、地図についての理解はフロントエンドの画面寄りで、Map をどう作るか、Layer をどう読み込むか、地図のズームや移動をどう制御するかをまず考えていました。

しかし OGC の標準を学び始めてから、地図上のレイヤーにはそれぞれ異なるデータソースと提供方法があることに気づきました。

WMS、WFS、WMTS は最終的に同じ地図の上に表示されることもありますが、その裏で扱っているデータは異なります。この違いを理解してから OpenLayers の Layer と Source の設定を見直すと、なぜデータによって読み込み方を変える必要があるのかがよくわかるようになりました。

私にとって、これも GIS の開発に触れて得たもののひとつです。レイヤーを表示する方法を知るだけでなく、データがどこから来て、どのような方法で取得され、フロントエンドでどう処理すべきかを少しずつ理解していくことです。

---

参考：

- Open Geospatial Consortium（OGC）の標準
- OpenLayers 公式ドキュメント
- GeoServer 公式ドキュメント

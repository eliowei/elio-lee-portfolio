---
title: EPSG:4326、EPSG:3857 與 TWD97：理解 GIS 座標系統與 OpenLayers 座標轉換
description: 從經緯度、Web Mercator 到台灣常見的 TWD97 二度分帶座標，理解不同座標系統的差異，以及如何透過 OpenLayers 進行座標轉換。
date: 2025-06-05
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

# EPSG:4326、EPSG:3857 與 TWD97：理解 GIS 座標系統與 OpenLayers 座標轉換

在一般網頁開發中，我們習慣使用 X、Y 座標來定位畫面上的元素。

但在 GIS 開發中，座標不只是單純的數字，還需要知道這組數字是依照哪一種座標系統計算出來的。

例如，同樣代表台灣某個位置的座標，可能會以經緯度表示，也可能是經過地圖投影後的平面座標。

如果沒有先確認座標系統，就直接將資料放進地圖中，可能會發生位置偏移、地圖中心錯誤，甚至圖層無法正確對齊的情況。

這篇文章會從 GIS 開發中常見的 EPSG:4326、EPSG:3857，以及台灣常見的 TWD97 座標系統開始，整理它們之間的差異，以及在 OpenLayers 中如何進行座標轉換。

## 一、為什麼 GIS 需要座標系統？

地球是一個接近球體的三維物體，但網頁地圖通常是以二維平面呈現。

因此，我們需要透過座標系統與地圖投影，將地球表面的位置轉換成平面上的座標。

這也是為什麼 GIS 會有不同的座標參考系統（Coordinate Reference System，CRS）。

不同座標系統可能使用不同的：

- 座標基準（Datum）
- 座標表示方式
- 地圖投影方式
- 座標單位

例如，經緯度座標通常使用角度表示，而經過投影的平面座標則可能使用公尺表示。

這兩種座標即使代表同一個地理位置，數值也會完全不同。

## 二、EPSG:4326：以經緯度表示位置

EPSG:4326 對應 WGS 84 地理座標系統，常見於 GPS、地理資料交換與各種地圖服務。

它使用經度（Longitude）與緯度（Latitude）表示地球上的位置，單位是度（Degree）。

例如：

```js
const coordinate = [121.5654, 25.0330]
```

這組座標代表台灣台北附近的位置。

在 OpenLayers 的一般座標陣列中，順序是：

```js
[經度, 緯度]
```

也就是：

- X：Longitude（經度）
- Y：Latitude（緯度）

需要注意的是，EPSG:4326 是地理座標系統，並不是將地球直接攤平成平面地圖的投影方式。

## 三、EPSG:3857：Web Mercator 投影

EPSG:3857 是 Web Mercator，也常稱為 Web 或 Spherical Mercator。

它將地理座標投影到平面上，座標單位使用公尺，因此很適合用於網頁地圖的顯示、縮放與平移。

許多常見的網頁地圖服務，例如 OpenStreetMap 的標準地圖磚，都使用 Web Mercator。

與 EPSG:4326 不同，EPSG:3857 的座標不是經度與緯度，而是投影後的 X、Y 平面座標。

例如：

```js
const coordinate = [13519300, 2870000]
```

這類數值代表投影平面上的位置，不能直接當成經緯度使用。

### 為什麼需要投影？

因為地球表面是曲面，無法在不產生變形的情況下，完整攤平成二維平面。

Web Mercator 適合網頁地圖瀏覽，但距離與面積會隨緯度產生變形，越接近高緯度地區越明顯。

因此，EPSG:3857 很適合一般網頁地圖顯示，但不應直接拿來當作高精度距離或面積計算的依據。

## 四、台灣常見的 TWD97 座標系統

除了 EPSG:4326 與 EPSG:3857，在台灣 GIS 開發中，還經常會接觸到 TWD97。

TWD97（Taiwan Datum 1997）是台灣常見的地理基準系統，搭配二度分帶橫麥卡托投影（TM2）後，可以將地理位置轉換成以公尺表示的平面座標。

其中比較常見的兩種 EPSG 編號：

| EPSG | 座標系統 | 中央經線 |
| --- | --- | --- |
| EPSG:3826 | TWD97 / TM2 zone 121 | 121°E |
| EPSG:3825 | TWD97 / TM2 zone 119 | 119°E |

### 為什麼台灣需要二度分帶？

如果直接使用經緯度表示位置，座標單位會是度，不方便直接進行平面距離與面積相關的計算。

透過 TM2 投影，可以將指定區域轉換成平面座標，並以公尺表示。

台灣常見的二度分帶會依照適用區域使用不同的中央經線：

- 121 分帶：台灣本島常見的 TWD97 平面座標系統。
- 119 分帶：金門、馬祖等適用區域常見的另一種分帶。

因此，當取得台灣的 GIS 圖資時，除了確認資料是否使用 TWD97，也需要進一步確認使用的是哪一個分帶。

### TWD97 與 EPSG:4326 有什麼不同？

兩者最大的差異在於座標的表示方式：

| 比較項目 | EPSG:4326 | EPSG:3826 |
| --- | --- | --- |
| 座標基準 | WGS 84 | TWD97 |
| 投影方式 | 地理座標 | TM2 二度分帶 |
| 座標單位 | 度 | 公尺 |
| 座標內容 | 經度、緯度 | X、Y 平面座標 |
| 常見用途 | GPS、地理資料交換 | 台灣測量與 GIS 空間資料 |

雖然兩者都能表示地球上的位置，但不能直接將其中一種座標當成另一種使用。

## 五、OpenLayers 如何進行座標轉換？

OpenLayers 內建了常見座標系統之間的轉換功能，可以透過 `ol/proj` 模組使用相關方法。

### 1. fromLonLat()

將經緯度座標轉換成指定的投影座標。

```js
import { fromLonLat } from 'ol/proj'

const lonLat = [121.5654, 25.0330]

const mercatorCoordinate = fromLonLat(lonLat, 'EPSG:3857')

console.log(mercatorCoordinate)
```

這個方法適合在取得經緯度資料後，將座標轉換成 OpenLayers 預設的 Web Mercator 座標。

如果沒有指定目標投影，預設會使用 EPSG:3857。

### 2. toLonLat()

如果已經取得 EPSG:3857 的座標，想要轉回經緯度，可以使用 `toLonLat()`。

```js
import { toLonLat } from 'ol/proj'

const mercatorCoordinate = [13519300, 2870000]

const lonLat = toLonLat(mercatorCoordinate)

console.log(lonLat)
```

轉換後就會得到經度與緯度座標。

### 3. transform()

如果需要在不同投影之間進行轉換，也可以使用 `transform()`。

```js
import { transform } from 'ol/proj'

const coordinate = [121.5654, 25.0330]

const result = transform(coordinate, 'EPSG:4326', 'EPSG:3857')

console.log(result)
```

與 `fromLonLat()` 相比，`transform()` 可以明確指定來源與目標座標系統，因此在處理多種投影時會更有彈性。

### 4. transformExtent()

除了單一座標點之外，GIS 開發也經常需要處理地圖範圍（Extent）。

例如，一個範圍可能包含：

```js
[minX, minY, maxX, maxY]
```

如果來源資料的座標系統與地圖使用的座標系統不同，也需要將範圍一起轉換。

這時可以使用 `transformExtent()`：

```js
import { transformExtent } from 'ol/proj'

const extent = [120.0, 21.0, 122.0, 25.0]

const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')

console.log(transformedExtent)
```

這個方法可以將原本以經緯度表示的地理範圍，轉換成 Web Mercator 投影下的範圍。

在地圖縮放、範圍定位，以及 WMS 請求等情境中，都可能用到這類處理。

## 六、OpenLayers 如何處理 TWD97 座標？

與 EPSG:4326、EPSG:3857 不同，OpenLayers 不一定會在預設環境中提供 EPSG:3826 的投影定義。

如果要在 OpenLayers 中使用 TWD97 / TM2 zone 121，通常可以搭配 Proj4js 註冊投影。

首先安裝相關套件：

```bash
npm install proj4
```

接著定義 EPSG:3826：

```js
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs'
)

register(proj4)
```

完成註冊後，就可以使用 OpenLayers 的 `transform()` 進行座標轉換。

例如，將 TWD97 / TM2 zone 121 轉換成 Web Mercator：

```js
import { transform } from 'ol/proj'

const twd97Coordinate = [250000, 2760000]

const mercatorCoordinate = transform(twd97Coordinate, 'EPSG:3826', 'EPSG:3857')

console.log(mercatorCoordinate)
```

這裡的 `[250000, 2760000]` 是用來示範座標格式的數值，不代表特定地點。

如果需要使用 EPSG:3825，也必須另外註冊對應的投影定義，不能直接沿用 EPSG:3826 的設定。

## 七、不同座標系統的圖層可以放在同一張地圖嗎？

可以，但前提是前端必須知道各個資料來源使用的座標系統。

OpenLayers 支援部分常見投影之間的轉換，也能在特定圖層來源與 View 投影不同時，自動進行圖層重投影。

例如，地圖 View 使用 EPSG:3857，而 WMS 服務提供 EPSG:4326 的影像，在來源投影設定正確的情況下，OpenLayers 可以協助將影像轉換到目前地圖使用的投影。

不過，並不是所有座標系統都能直接使用。

如果需要處理 OpenLayers 沒有內建支援的投影，例如 TWD97 / TM2，就可能需要搭配 Proj4js 註冊投影定義。

因此，在整合不同來源的 GIS 資料時，除了確認資料本身，也需要先了解它使用的座標系統。

## 八、這次學到的事

接觸 GIS 開發後，我才逐漸理解座標並不是一組可以直接拿來使用的數字。

同樣是代表某個地理位置，經緯度與投影座標可能會有完全不同的數值。如果沒有先確認座標系統，就直接將資料放進 OpenLayers，很容易遇到地圖位置錯誤或圖層無法正確對齊的問題。

以前看到 `EPSG:4326`、`EPSG:3857` 時，可能只會把它們當成設定中的一個參數。現在則會開始注意資料來源、View 使用的投影，以及兩者之間是否需要轉換。

而在台灣的 GIS 開發情境中，除了常見的經緯度與 Web Mercator，也經常需要接觸 TWD97 這類平面座標系統。

這讓我在處理地圖圖層時，不再只關注資料有沒有成功載入，也會先確認座標本身是否符合目前地圖的設定。

---

**參考資料：**

- EPSG Geodetic Parameter Dataset
- OpenLayers 官方文件：Projection
- OpenLayers 官方文件：Raster Reprojection
- Proj4js 官方文件

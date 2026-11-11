# Elio Lee Portfolio

繁體中文 | [English](README.en.md)

李柏偉 Elio Lee 的個人作品集網站。首頁是一座可以走進去的 3D 數位遺跡：往下捲動，鏡頭會穿過山頂的石門、走下階梯進入迴廊，每個作品都是迴廊裡的一扇門。

## 功能特色

- **連續的 3D 鏡頭**：從遺跡外到迴廊內都走同一條軌道，由捲動進度驅動，中途不換場景。
- **作品預覽與進入**：hover 時鏡頭推進到作品門前，點擊後穿過石門進入案例頁，快速切換作品時動畫可以中斷並接續。
- **自訂 Shader**：以 GLSL 修改 Three.js 材質，做出石材紋理、數位刻痕，以及作品圖的解碼掃描效果。
- **替代瀏覽方式**：每個作品都是真實連結，3D 不是唯一入口。支援鍵盤 ↑ ↓ 與 Enter、觸控點兩下進入；手機版改用 SVG 與卡片列表，並尊重系統的減少動態效果設定。
- **頁面轉場**：使用 View Transitions API，讓作品縮圖在頁面切換時延續到案例頁封面。
- **內容管理**：技術筆記以 Markdown 撰寫，由 Nuxt Content 管理。

## 設計方向

以「數位遺跡」為概念：深灰石材搭配單一橘色訊號。3D 場景裡的能量元素都只用橘色，作品識別色只出現在 HTML 與截圖，避免視覺分散。

- 深色區塊負責敘事與 3D，淺色區塊負責閱讀。
- 字體使用 Barlow 與 Noto Sans TC，等寬字用於標籤與編號。
- 動畫尊重系統的減少動態效果設定。

## 技術

| 類別 | 使用技術 |
|---|---|
| 框架 | Nuxt 4、Vue 3、TypeScript |
| 3D 與動態 | Three.js、GLSL |
| 樣式 | Tailwind CSS |
| 內容與 SEO | Nuxt Content、Nuxt Image、Sitemap |
| 聯絡表單 | EmailJS |

3D 場景的鏡頭與動畫由 Three.js 自行實作；一般頁面區塊的捲動淡入效果以 IntersectionObserver 與 Web Animations API 實作。

## 效能與字型

Lighthouse（手機、預設節流）實測：筆記、聯絡、文章頁約 96–97；首頁、專案、經歷約 60–80；桌機首頁 96。無障礙、最佳做法、SEO 皆為 100（文章頁無障礙 96：導覽列使用 `mix-blend-difference`，對比檢查為誤報）。

- Lighthouse 的 LCP 是模擬慢速 4G 推算的數字，實測 LCP 約 0.5–1 秒；首頁 TBT 每次量測落差大（約 300–1,100 ms），分數會上下跳動。
- **字型全部自架**（`public/fonts/`），頁面不載入外部字型 CSS。
  - `scripts/fetch-fonts.py`：下載 Inter、Barlow、IBM Plex Mono（僅 Latin）與 Material Symbols 圖示子集，並產生 `app/assets/css/latin-fonts.generated.css`。**新增圖示名稱時，要加進該腳本的 `ICONS` 清單後重跑**，否則圖示會顯示成文字。
  - `scripts/subset-font.py`：把 Noto Sans TC 裁成網站實際用到的字，分成 `en`／`ui`／`article`／`ja` 四組（`unicode-range` 互不重疊），頁面只下載用得到的組別。新增大量文章後請重跑；缺字會退回系統字型，不會壞版。兩支腳本需要 `pip install fonttools brotli`，字型來源網址寫在腳本開頭。
  - 不要用 `media="print"` + `onload` 這種「非阻塞載入 Google Fonts」的寫法：在這個專案裡 `onload` 不會生效，樣式表永遠停在 `print`，字型與圖示不會載入。
- `/blog` 與首頁筆記區的查詢用 `.select()` 只取列表需要的欄位，避免整篇文章內容進入 payload。
- 捲動淡入（`v-reveal`）改用 IntersectionObserver + Web Animations API（`app/plugins/reveal.ts`），不再打包動畫函式庫。
- three.js 的 chunk 不預取（`nuxt.config.ts` 的 `build:manifest` hook）；手機不會用到，桌機仍按需載入。
- 圖示固定為 1em 方框，字型載入前不會造成版面位移。
- `nitro.compressPublicAssets` 只是讓本機 `node-server` 預覽的壓縮接近 CDN，量測才準；部署在 Vercel 時不影響。

已知取捨：選單按鈕不再設 `aria-label`（改以可見文字 `Menu`／`Close` 作為名稱，以通過「可見文字需包含在名稱內」檢查），中日文使用者的螢幕閱讀器會念英文；複製程式碼按鈕改顯示在地化文字。

## 設計系統與暗色模式

網站支援亮色／暗色主題（預設跟隨系統，導覽列可手動切換並記住選擇）。顏色、字體、間距、元件與主題機制的完整說明見 [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)。主題色值在 `app/assets/css/theme.css`，Tailwind 設定在 `tailwind.config.ts`。

## 專案結構

```text
app/
├── components/   頁面區塊與 3D 舞台元件
├── data/         網站文案與作品資料
├── lib/          3D 場景（space-scene.ts）與遺跡結構（ruin.ts）
├── pages/        首頁、作品、經歷、技術筆記、聯絡
└── plugins/      捲動淡入（v-reveal）
content/blog/     技術筆記 Markdown
public/images/    作品截圖與個人照片
public/fonts/     自架字型（由 scripts/ 產生）
DESIGN-SYSTEM.md  設計系統說明
scripts/          字型下載與裁切腳本
```

## 本機開發

需要 Node.js 22.5 以上版本。

```bash
npm install
npm run dev
```

啟動後開啟 <http://localhost:3000>。

建置與預覽正式版本：

```bash
npm run build
npm run preview
```

環境變數請參考 `.env.example`：`NUXT_PUBLIC_SITE_URL` 是網站網址，canonical 連結與 Sitemap 會使用這個值；`NUXT_PUBLIC_EMAILJS_*` 是聯絡表單使用的 EmailJS 設定。

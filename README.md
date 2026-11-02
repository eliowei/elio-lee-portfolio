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
- 字體使用 Geist 與 Noto Sans TC，等寬字用於標籤與編號。
- 動畫尊重系統的減少動態效果設定。

## 技術

| 類別 | 使用技術 |
|---|---|
| 框架 | Nuxt 4、Vue 3、TypeScript |
| 3D 與動態 | Three.js、GLSL、GSAP |
| 樣式 | Tailwind CSS |
| 內容與 SEO | Nuxt Content、Nuxt Image、Sitemap |
| 聯絡表單 | EmailJS |

3D 場景的鏡頭與動畫由 Three.js 自行實作；GSAP 用於一般頁面區塊的捲動淡入效果。

## 專案結構

```text
app/
├── components/   頁面區塊與 3D 舞台元件
├── data/         網站文案與作品資料
├── lib/          3D 場景（space-scene.ts）與遺跡結構（ruin.ts）
├── pages/        首頁、作品、經歷、技術筆記、聯絡
└── plugins/      GSAP 捲動淡入
content/blog/     技術筆記 Markdown
public/images/    作品截圖與個人照片
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

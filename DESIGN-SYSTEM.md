# Design System — Elio Lee / Digital Space

這份文件說明網站的視覺規範與實作方式：顏色、主題（亮色／暗色）、字體、間距、元件樣式、動態與無障礙。
單一事實來源在程式碼裡，本文件只負責說明「為什麼」和「怎麼用」；數值有出入時以程式碼為準。

## 1. 設計方向

- **兩個場景：**深色**舞台**（首頁、作品、案例封面，營造沉浸感）與**閱讀區**（技術筆記、經歷、聯絡等需要長時間閱讀的頁面）。
- **單一識別色：**測量橘 `#FF5B1F`，其他一律是近黑／灰階，讓橘色成為唯一的視覺焦點。
- **舞台永遠是深色。**`lab-dark` 區塊（頁首、頁尾、CTA、首頁主視覺）在亮色與暗色主題下都維持深色；閱讀區才會隨主題切換。
- **語意名稱優先。**元件使用 `surface`、`on-surface`、`primary` 這類語意 token，不直接寫色碼，所以換色或加主題時元件不用改。

## 2. 檔案地圖

| 內容 | 位置 |
|---|---|
| 色票、字級、間距、圓角、陰影（Tailwind 設定） | `tailwind.config.ts` |
| **主題色值（亮／暗）** | `app/assets/css/theme.css` |
| 共用樣式類別、動畫、Markdown 內文樣式、轉場 | `app/assets/css/main.css` |
| 自架字型的 `@font-face`（自動產生，勿手改） | `app/assets/css/latin-fonts.generated.css`、`noto-sans-tc.generated.css` |
| 字型檔 | `public/fonts/` |
| 字型產生腳本 | `scripts/fetch-fonts.py`、`scripts/subset-font.py` |
| 主題狀態與切換 | `app/composables/useTheme.ts`、`app/plugins/theme.client.ts`、`app/components/layout/ThemeToggle.vue` |
| 防閃爍的主題初始化腳本 | `nuxt.config.ts` 的 `app.head.script` |
| 錯誤頁（404 / 500） | `app/error.vue`；文案在三份 i18n 的 `error` 區塊。深色舞台、等高線背景、鏤空的大狀態碼；`noindex`，伺服器仍回傳真實狀態碼 |
| 換頁轉場（掃描線） | `app/plugins/page-transition.client.ts`、`main.css` 的 `.page-scan` 與 `::view-transition-*` 規則 |
| 共用元件 | `app/components/ui/`（`Chip`、`Icon`）、`app/components/lab/PageHeader.vue` |

## 3. 顏色

### 3.1 舞台固定色（不隨主題變）

| Token | 值 | 用途 |
|---|---|---|
| `lab-bg` | `#0C0D0F` | 深色區塊底色 |
| `lab-bg-soft` | `#15171A` | 深色區塊內的卡片、手機版作品卡 |
| `lab-bg-raise` | `#1F2125` | 更高一層的深色表面 |
| `lab-signal` | `#FF5B1F` | 品牌橘：深色底上的文字、按鈕底色、非文字標記 |
| `lab-on-dark` | `#ECEBE7` | 深色底上的主要文字 |
| `lab-on-dark-muted` | `#9A9DA3` | 深色底上的次要文字 |
| `lab-signal-ink` | 隨主題（見 3.2） | 閱讀區的橘色文字與連結 |
| `lab-paper` | 隨主題（= `background`） | 閱讀區底色 |

這幾個固定色也以 CSS 變數 `--lab-*` 放在 `main.css` 的 `:root`，給 CSS 與 Three.js canvas 使用（Three.js 不能用 Tailwind class）。**改舞台色時，`tailwind.config.ts` 與 `main.css` 兩處都要改。**

### 3.2 語意色票（隨主題變）

數值定義在 `theme.css`，以空白分隔的 RGB 通道存放（例如 `--c-primary: 184 61 14`），Tailwind 以 `rgb(var(--c-primary) / <alpha-value>)` 讀取，所以透明度寫法（`text-on-surface/70`、`bg-primary/10`）照常可用。

#### 背景與表面

| Token | Tailwind class 範例 | 亮色 | 暗色 | 用途 |
|---|---|---|---|---|
| `background` | `bg-background` / `text-background` | `#f3f2ee` | `#111316` | 頁面底色（閱讀區） |
| `surface` | `bg-surface` / `text-surface` | `#f3f2ee` | `#111316` | 同 `background`，一般表面 |
| `surface-dim` | `bg-surface-dim` / `text-surface-dim` | `#dcdad4` | `#0c0d0f` |  |
| `surface-bright` | `bg-surface-bright` / `text-surface-bright` | `#ffffff` | `#2a2d32` |  |
| `surface-variant` | `bg-surface-variant` / `text-surface-variant` | `#e8e6e1` | `#1f2226` |  |
| `surface-container-lowest` | `bg-surface-container-lowest` / `text-surface-container-lowest` | `#ffffff` | `#181a1e` | 卡片、輸入框、圖表節點（亮色為白、暗色略比底色亮） |
| `surface-container-low` | `bg-surface-container-low` / `text-surface-container-low` | `#ecebe6` | `#15171a` |  |
| `surface-container` | `bg-surface-container` / `text-surface-container` | `#e6e4df` | `#1b1d21` | 標籤、行內程式碼底色 |
| `surface-container-high` | `bg-surface-container-high` / `text-surface-container-high` | `#dfddd7` | `#212429` | `UiChip` 預設底色 |
| `surface-container-highest` | `bg-surface-container-highest` / `text-surface-container-highest` | `#d6d4ce` | `#282b30` |  |
| `surface-tint` | `bg-surface-tint` / `text-surface-tint` | `#b83d0e` | `#ff7a47` | 強調色疊色 |

#### 文字與邊線

| Token | Tailwind class 範例 | 亮色 | 暗色 | 用途 |
|---|---|---|---|---|
| `on-background` | `bg-on-background` / `text-on-background` | `#0c0d0f` | `#ecebe7` |  |
| `on-surface` | `bg-on-surface` / `text-on-surface` | `#0c0d0f` | `#ecebe7` | 主要文字 |
| `on-surface-variant` | `bg-on-surface-variant` / `text-on-surface-variant` | `#55575c` | `#a8abb1` | 次要文字、說明 |
| `outline` | `bg-outline` / `text-outline` | `#6b6e74` | `#8a8d94` | 非文字元素的邊線（圖表連線等） |
| `outline-variant` | `bg-outline-variant` / `text-outline-variant` | `#cfccc5` | `#3a3d43` |  |
| `hairline` | `bg-hairline` / `text-hairline` | `#dedcd6` | `#26292e` | 卡片外框（`shadow-sm` 的 1px 描邊）、分隔線 |
| `hairline-strong` | `bg-hairline-strong` / `text-hairline-strong` | `#cfccc5` | `#373a40` | 輸入框、hover 時加深的描邊 |
| `inverse-surface` | `bg-inverse-surface` / `text-inverse-surface` | `#0c0d0f` | `#ecebe7` | 反色表面（與目前主題相反） |
| `inverse-on-surface` | `bg-inverse-on-surface` / `text-inverse-on-surface` | `#ecebe7` | `#0c0d0f` |  |

#### 品牌色（橘）

| Token | Tailwind class 範例 | 亮色 | 暗色 | 用途 |
|---|---|---|---|---|
| `primary` | `bg-primary` / `text-primary` | `#b83d0e` | `#ff7a47` | 文字與連結用的橘（亮色為較深的 `signal-ink`，暗色為較亮的橘，皆通過 4.5:1） |
| `on-primary` | `bg-on-primary` / `text-on-primary` | `#ffffff` | `#0c0d0f` |  |
| `primary-container` | `bg-primary-container` / `text-primary-container` | `#ff5b1f` | `#ff5b1f` | 實心橘底（兩個主題相同） |
| `on-primary-container` | `bg-on-primary-container` / `text-on-primary-container` | `#0c0d0f` | `#0c0d0f` |  |
| `primary-fixed` | `bg-primary-fixed` / `text-primary-fixed` | `#ffe4d8` | `#3a1a0e` | 淡橘底（暗色為深棕） |
| `primary-fixed-dim` | `bg-primary-fixed-dim` / `text-primary-fixed-dim` | `#ffc2a8` | `#5a2410` |  |
| `on-primary-fixed` | `bg-on-primary-fixed` / `text-on-primary-fixed` | `#4a1703` | `#ffe4d8` |  |
| `on-primary-fixed-variant` | `bg-on-primary-fixed-variant` / `text-on-primary-fixed-variant` | `#8f2f0a` | `#ffc2a8` |  |
| `inverse-primary` | `bg-inverse-primary` / `text-inverse-primary` | `#ff9a72` | `#b83d0e` |  |

#### 次要與第三色

| Token | Tailwind class 範例 | 亮色 | 暗色 | 用途 |
|---|---|---|---|---|
| `secondary` | `bg-secondary` / `text-secondary` | `#55575c` | `#a8abb1` | 灰階次要色 |
| `on-secondary` | `bg-on-secondary` / `text-on-secondary` | `#ffffff` | `#0c0d0f` |  |
| `secondary-container` | `bg-secondary-container` / `text-secondary-container` | `#e6e4df` | `#2a2d32` |  |
| `on-secondary-container` | `bg-on-secondary-container` / `text-on-secondary-container` | `#3a3c40` | `#dcdad4` |  |
| `secondary-fixed` | `bg-secondary-fixed` / `text-secondary-fixed` | `#e6e4df` | `#2a2d32` |  |
| `secondary-fixed-dim` | `bg-secondary-fixed-dim` / `text-secondary-fixed-dim` | `#cfccc5` | `#3a3d43` |  |
| `on-secondary-fixed` | `bg-on-secondary-fixed` / `text-on-secondary-fixed` | `#0c0d0f` | `#ecebe7` |  |
| `on-secondary-fixed-variant` | `bg-on-secondary-fixed-variant` / `text-on-secondary-fixed-variant` | `#3a3c40` | `#dcdad4` |  |
| `tertiary` | `bg-tertiary` / `text-tertiary` | `#b83d0e` | `#ff7a47` | 目前與 `primary` 相同，保留是為了語意名稱完整 |
| `on-tertiary` | `bg-on-tertiary` / `text-on-tertiary` | `#ffffff` | `#0c0d0f` |  |
| `tertiary-container` | `bg-tertiary-container` / `text-tertiary-container` | `#ff5b1f` | `#ff5b1f` |  |
| `on-tertiary-container` | `bg-on-tertiary-container` / `text-on-tertiary-container` | `#0c0d0f` | `#0c0d0f` |  |
| `tertiary-fixed` | `bg-tertiary-fixed` / `text-tertiary-fixed` | `#ffe4d8` | `#3a1a0e` |  |
| `tertiary-fixed-dim` | `bg-tertiary-fixed-dim` / `text-tertiary-fixed-dim` | `#ffc2a8` | `#5a2410` |  |
| `on-tertiary-fixed` | `bg-on-tertiary-fixed` / `text-on-tertiary-fixed` | `#4a1703` | `#ffe4d8` |  |
| `on-tertiary-fixed-variant` | `bg-on-tertiary-fixed-variant` / `text-on-tertiary-fixed-variant` | `#8f2f0a` | `#ffc2a8` |  |

#### 狀態

| Token | Tailwind class 範例 | 亮色 | 暗色 | 用途 |
|---|---|---|---|---|
| `error` | `bg-error` / `text-error` | `#ba1a1a` | `#ffb4ab` | 錯誤訊息（表單驗證、送出失敗） |
| `on-error` | `bg-on-error` / `text-on-error` | `#ffffff` | `#690005` |  |
| `error-container` | `bg-error-container` / `text-error-container` | `#ffdad6` | `#93000a` |  |
| `on-error-container` | `bg-on-error-container` / `text-on-error-container` | `#93000a` | `#ffdad6` |  |

#### 其他

| Token | Tailwind class 範例 | 亮色 | 暗色 | 用途 |
|---|---|---|---|---|
| `signal-ink` | `bg-signal-ink` / `text-signal-ink` | `#b83d0e` | `#ff7a47` | `lab-signal-ink`：閱讀區文字安全的橘，等同 `primary` |

### 3.3 對比度

| 組合 | 亮色 | 暗色 |
|---|---|---|
| `on-surface` 在 `background` | 17.4:1 | 15.6:1 |
| `on-surface-variant` 在 `background` | 6.5:1 | 8.1:1 |
| `primary` 在 `background` | 5.1:1 | 7.2:1 |
| `primary` 在 `surface-container-lowest` | 5.7:1 | 6.7:1 |
| `on-primary` 在 `primary` | 5.7:1 | 7.5:1 |
| `lab-signal` 在 `lab-bg` | 6.3:1 | 6.3:1 |
| `lab-on-dark-muted` 在 `lab-bg` | 7.2:1 | 7.2:1 |

規則：

- `#FF5B1F`（`lab-signal`）只用在**深色底**與**非文字標記**。亮色底上的橘色文字要用 `primary` / `lab-signal-ink`。
- 一般文字至少 4.5:1；大字（18px 以上，或 14px 以上粗體）至少 3:1。新增顏色組合時請用 Lighthouse 或瀏覽器的對比檢查驗證**兩個主題**。
- `primary-container`（`#FF5B1F`）與 `on-primary-container`（`#0C0D0F`）刻意不隨主題變：橘底配近黑字在兩個主題下對比都是 6.3:1。

### 3.4 使用慣例

- 閱讀區元件用語意 token：`bg-background`、`bg-surface-container-lowest`（卡片）、`text-on-surface`、`text-on-surface-variant`、`text-primary`、`border-hairline`。
- 深色區塊內用 `lab-*`：`bg-lab-bg`、`text-lab-on-dark`、`text-lab-signal`，區塊最外層加 `lab-dark`。
- **不要**在閱讀區元件寫 `bg-white`、`text-slate-*`、`text-zinc-*` 或十六進位色碼，暗色主題下會失效。需要「白色卡片」請用 `bg-surface-container-lowest`。
- 深色區塊裡的 `text-white`、`border-white/10`、`bg-white/10` 是合理的（該區永遠是深色），不需改。
- SVG 內需要隨主題變色時，用 `style="fill: rgb(var(--c-surface-container-lowest))"` 這類寫法（見 `app/components/project/CaseDiagram.vue`），因為 `fill="#fff"` 屬性不會跟著主題變。

## 4. 主題（亮色／暗色）

### 4.1 運作方式

1. `<html data-theme="light|dark">` 決定主題。`theme.css` 的 `:root` 是亮色值，`:root[data-theme='dark']` 覆寫成暗色值，同時設定 `color-scheme`（讓捲軸、表單控制項跟著變）。
2. **首次繪製前**，`nuxt.config.ts` 的 `app.head.script` 內嵌一小段腳本：讀 `localStorage.theme`，沒有就看系統 `prefers-color-scheme`，然後設定 `data-theme`。所以不會先閃一下亮色再變暗色。
3. `useTheme()` 只負責把 `<html>` 的狀態同步到 Vue、儲存使用者的明確選擇，以及在**使用者還沒選過**時跟隨系統主題的變動。
4. `ThemeToggle.vue` 是切換鈕，放在導覽列。月亮／太陽圖示的顯示由 CSS 依 `data-theme` 切換（`main.css` 的 `.theme-icon-*`），所以伺服器輸出的 HTML 在兩個主題下完全相同，沒有 hydration 不一致，也不影響 ISR 快取。這兩條規則要用 `:root[...]` 開頭的選擇器，才壓得過 `.material-symbols-outlined { display: inline-block }`，否則兩個圖示會同時顯示。
5. **切換動畫：**按下切換鈕時，用 View Transitions API 讓新主題從點擊位置以圓形往外擴散（950ms，`cubic-bezier(0.76, 0, 0.24, 1)`：起步慢、中段快、收尾柔），圓的邊緣有一圈測量橘細環，後面拖著淡淡的光暈（`.theme-ring`，是新頁面的一部分，所以會被圓一起揭開，半徑與圓同步，快結束時淡出）。切換鈕上的月亮與太陽疊在一起，以旋轉加縮放交換。鍵盤操作時從按鈕中心擴散。圓的半徑取該點到最遠螢幕角落的距離，所以一定蓋滿整個畫面。切換期間 `<html>` 會暫時加上 `theme-vt`，讓 `main.css` 關掉預設的淡入淡出，由 `useTheme.ts` 以 `clip-path` 驅動。使用者偏好減少動態，或瀏覽器不支援 View Transitions 時，直接切換、沒有動畫。

### 4.2 行為

| 情境 | 結果 |
|---|---|
| 第一次訪問 | 跟隨系統主題 |
| 按下切換鈕 | 切換並存入 `localStorage.theme`，之後固定使用這個選擇 |
| 系統主題改變，且使用者從未選過 | 跟著變 |
| 無法使用 `localStorage`（隱私模式等） | 本次瀏覽有效，重新整理後回到系統主題 |
| 關閉 JavaScript | 亮色 |

### 4.3 新增或調整主題色

1. 在 `theme.css` 兩個區塊（`:root` 與 `:root[data-theme='dark']`）加入 `--c-<名稱>: R G B; /* #hex */`。
2. 在 `tailwind.config.ts` 的 `SEMANTIC` 陣列加入 `<名稱>`，就能使用 `bg-<名稱>`、`text-<名稱>`。
3. 用 Lighthouse 以兩種主題檢查對比（見 §12）。

### 4.4 刻意不隨主題變的部分

- 所有 `lab-dark` 區塊與 3D 舞台（Three.js 場景、靜態 Monument SVG）。
- 程式碼區塊：固定深色底 `#09090B`，語法高亮使用 `github-dark-default`（註解色在這個底上達 4.5:1 以上）。
- 作品截圖與照片本身。
- 預設分享圖（Open Graph）。

## 5. 字體

| 角色 | 字型 | 備援 |
|---|---|---|
| 內文 `font-sans` | Inter | Noto Sans TC → PingFang TC → 微軟正黑體 → Hiragino Sans → Yu Gothic → Meiryo → sans-serif |
| 標題（`display`、`headline-*`） | Geist | 同上 |
| 程式碼、標籤、代號 `font-mono` | Geist Mono | `ui-monospace` → monospace |
| 圖示 | Material Symbols Outlined（子集） | — |

- 標題字型用一個 Tailwind 外掛為每個標題字級類別補上 `font-family`（`fontSize` 本身不能帶字型）。圖示用 `:not(.material-symbols-outlined)` 排除，避免圖示被套上標題字型。
- 所有字型自架在 `public/fonts/`，頁面不載入外部字型 CSS。Noto Sans TC 依用途切成 `en`／`ui`／`article`／`ja` 四組（`unicode-range` 互不重疊），頁面只下載用得到的組別。細節與維護方式見 `README.md` 的「效能與字型」。

### 字級

每個字級同時綁定字號、行高、字距、字重。

| 類別 | 字號 | 行高 | 字距 | 字重 |
|---|---|---|---|---|
| `text-display` | 4rem（64px） | 1.1 | -0.02em | 600 |
| `text-display-mobile` | 2.5rem（40px） | 1.15 | -0.02em | 600 |
| `text-headline-lg` | 2.25rem（36px） | 1.2 | -0.015em | 600 |
| `text-headline-lg-mobile` | 1.75rem（28px） | 1.25 | -0.01em | 600 |
| `text-headline-md` | 1.625rem（26px） | 1.3 | -0.01em | 600 |
| `text-headline-sm` | 1.25rem（20px） | 1.35 | 0 | 600 |
| `text-body-lg` | 1.125rem（18px） | 1.7 | 0 | 400 |
| `text-body-md` | 1rem（16px） | 1.7 | 0 | 400 |
| `text-body-sm` | 0.875rem（14px） | 1.65 | 0 | 400 |
| `text-label-md` | 0.8125rem（13px） | 1.4 | 0 | 500 |
| `text-label-sm` | 0.75rem（12px） | 1.4 | 0.04em | 500 |
| `text-code-block` | 0.875rem（14px） | 1.7 | 0 | 400 |

- 常見搭配：`text-display-mobile md:text-display`、`text-headline-lg-mobile md:text-headline-lg`。
- 首頁主標題另用 `.space-title`：手機 `clamp(2.5rem, 10.5vw, 3rem)`，桌機 `clamp(3.5rem, 6.4vw, 6.5rem)`，字重 600、行高 1.08、字距 -0.03em，刻意與 3D 紀念碑重疊。
- 文章內文欄寬約 720px，每行約 65–72 個字元。

## 6. 間距與版面

| Token | 值 | 用途 |
|---|---|---|
| `space-xs` / `sm` / `md` / `lg` | 0.25 / 0.5 / 1 / 1.5 rem | 元件內間距 |
| `space-xl` | 2.5rem | 區塊內大間距 |
| `space-2xl` | 5rem | 區塊上下間距（section rhythm） |
| `space-3xl` | 7rem | 大區塊上下間距 |
| `gutter` / `gutter-mobile` | 1.5rem / 1rem | 欄間距 |
| `margin` / `margin-mobile` | 2rem / 1.25rem | 頁面左右留白 |

- **`max-w-page`：1200px。**`.section-x` = `mx-auto w-full max-w-page px-margin-mobile md:px-margin`，是所有區塊的標準容器。
- **斷點**使用 Tailwind 預設（`sm` 640、`md` 768、`lg` 1024、`xl` 1280），以手機優先撰寫。`md`（768px）是 3D 舞台與桌機導覽列的分界；`lg`（1024px）是雙欄版面與左右滑入動畫的分界。
- 頁首留白：導覽列是 `fixed`，所以每頁第一個區塊要自己讓出頂部空間（頁首約 `pt-28 md:pt-36`）。

## 7. 圓角、陰影、邊框

| 項目 | 規範 |
|---|---|
| 圓角 | `sm` 2px（按鈕、卡片、輸入框，偏硬朗）、`DEFAULT` 4px、`md` 6px、`lg` 8px（程式碼區塊、表格）、`xl` 12px、`full` |
| 卡片 | 不用傳統陰影，改 1px 描邊：`shadow-sm` = `0 0 0 1px rgb(var(--c-hairline))` |
| hover | `shadow-md`：描邊加深為 `hairline-strong`，再加幾乎看不見的 `0 1px 3px rgba(0,0,0,0.08)` |
| 深色區塊的邊線 | `border-white/10`（淡）、`border-white/15–25`（一般按鈕）、`border-white/40`（hover／選取） |
| 分隔線 | 閱讀區 `border-hairline`；深色區 `divide-white/10` |

## 8. 元件與樣式類別

### 8.1 `main.css` 的共用類別

| 類別 | 說明 |
|---|---|
| `.lab-dark` | 深色區塊：`lab-bg` 底、`lab-on-dark` 文字。區塊內的 `.lab-muted` 變成 `lab-on-dark-muted` |
| `.lab-eyebrow` | 小標籤（mono、全大寫、字距 0.18em、前綴 6px 方塊）。閱讀區用 `lab-signal-ink`，`.lab-dark` 內自動改 `lab-signal` |
| `.lab-grid` | 深色頁首的淡淡等高線背景，放在 `aria-hidden` 覆蓋層，不放在內容上 |
| `.lab-chip` | 深色區的標籤（白 15% 外框） |
| `.lab-chip-light` | 閱讀區的標籤（`hairline-strong` 外框、`surface-container-lowest` 底） |
| `.lab-in` | 頁面進場動畫（見 §9）；用 `style="--d: 80ms"` 設延遲 |
| `.section-x` | 標準內容容器（見 §6） |
| `.eyebrow` | 較小的閱讀區標籤（`text-secondary`） |
| `.prose-post` | Markdown 文章內文（見 8.3） |
| `.space-title` | 首頁主標題（見 §5） |
| `.material-symbols-outlined` | 圖示（見 §10） |

### 8.2 Vue 元件

- **`UiChip`**：`tone` 可選 `neutral`（預設）、`primary`、`secondary`、`tertiary`、`solid`、`deep`，分別對應 `surface-container-high`、`primary-fixed`、`secondary-container`、`tertiary-fixed`、`primary`、`primary-container` 底色。
- **`LabPageHeader`**：區段首頁（經歷、作品、筆記）共用的深色頁首，接收 `eyebrow`、`title`、`lead` 與預設 slot；各項依序以 0／80／160／220ms 延遲進場。
- **按鈕**（定義在使用處）：實心按鈕 `bg-lab-signal text-lab-bg hover:bg-white`；外框按鈕 `border border-white/25 text-white hover:border-white`。尺寸 `px-6 py-3 text-body-md font-medium rounded-sm`。
- **`LayoutThemeToggle`**：主題切換鈕（見 §4）。

### 8.3 文章內文 `.prose-post`

- 字級 `text-body-lg`，段落間距 `space-y-5`。
- 標題：`h2` 為 `text-headline-md`、`h3` 為 `text-headline-sm`，使用 Geist；`scroll-margin-top: 6rem` 避開固定導覽列。
- 連結：`primary` 色加底線，底線為 40% 透明度，hover 時變實色。
- 行內程式碼：`surface-container` 底、`on-surface` 字、mono 13px。
- 程式碼區塊：`ProsePre` 元件，固定深色底，標題列含檔名／語言與複製按鈕。
- 表格：`ProseTable` 元件，外層可橫向捲動，表頭用 `surface-container-low`。
- 引用：左側 2px `hairline-strong` 線，文字 `on-surface-variant`。

## 9. 動態

| 項目 | 實作 | 說明 |
|---|---|---|
| 頁面進場 | `.lab-in`（CSS） | 0.6s、`cubic-bezier(0.2, 0.7, 0.2, 1)`，由下 14px 淡入；純 CSS，內容不會因為等 JavaScript 而被隱藏 |
| 捲動淡入 | `v-reveal`（`app/plugins/reveal.ts`） | IntersectionObserver + Web Animations API；0.7s，進入視窗 92% 處觸發一次。`v-reveal="0.2"` 設延遲（秒）；`v-reveal="{ x: -32, delay: 0.2 }"` 在 `lg` 以上改為橫向滑入（父層需 `overflow-x-clip`） |
| 換頁轉場 | View Transitions API（`app/plugins/page-transition.client.ts`） | **掃描線**：一條測量橘的細線掃過畫面，新頁面在線的後方被揭開，舊頁面同時微微上移並變暗（700ms，`cubic-bezier(0.76, 0, 0.24, 1)`）。點連結／瀏覽器前進由下往上，返回由上往下，讓使用者感覺得到前進或後退。線是 layout 裡的 `.page-scan` 元素（有自己的 transition group，平常 `opacity: 0`）。作品封面仍以 `view-transition-name: cover-<slug>` 在首頁、作品列表、案例頁之間變形；只在一側出現的封面，進場的會等掃描揭開後才淡入、離場的立刻淡出 |
| 主題切換 | View Transitions + `clip-path`（`useTheme.ts`） | 新主題從點擊處以圓形擴散 950ms，邊緣帶橘色環；圖示旋轉交換；偏好減少動態時直接切換 |
| 手機選單 | `clip-path` | 由上往下展開 0.35s，項目依序上升 |
| 3D 場景 | Three.js | 見 `app/lib/space-scene.ts`；只在 768px 以上、記憶體與核心數足夠、未開啟省流量時載入 |

**換頁轉場的注意事項：**以 `::view-transition-*` 為目標的動畫屬於整份文件，不屬於單次轉場，結束後若不 `cancel()`，殘留的動畫會套用到下一次轉場，所以 plugin 在轉場結束時會取消全部動畫（新增相關動畫時請照做）。Nuxt 在偏好減少動態、瀏覽器自己的滑動返回手勢時會略過轉場。

**減少動態：**所有動畫都尊重 `prefers-reduced-motion: reduce`——`.lab-in`、`v-reveal`、主題切換與換頁轉場直接停用，轉場使用 `motion-reduce:transition-none`，3D 場景改為降級行為。新增動畫時請一併處理。

## 10. 圖示

- 使用 Material Symbols Outlined，透過 `<UiIcon name="arrow_forward" />`；尺寸用 `text-[16px]` 這類 class 控制（字型大小即圖示大小），顏色繼承文字色。
- 圖示是**字型子集**，只含清單內的圖示。**新增圖示名稱時**，把名稱加進 `scripts/fetch-fonts.py` 的 `ICONS` 清單並重新執行，否則會顯示成文字（例如 `arrow_forward`）。
- 圖示固定為 1em 的方框（`width/height: 1em; overflow: hidden`），字型載入前即使顯示成文字也不會讓版面位移。
- 圖示一律 `aria-hidden="true"`；純圖示的按鈕要有 `aria-label`。

## 11. 無障礙

- **焦點：**`:focus-visible` 為 2px 外框、外移 2px。閱讀區用 `lab-signal-ink`（隨主題），`.lab-dark` 內用 `lab-signal`。
- **對比：**見 §3.3。兩個主題都以 Lighthouse 驗證，目前文字對比全數通過；導覽列使用 `mix-blend-difference`，Lighthouse 會在亮色的閱讀頁誤報一項，屬已知誤報。
- **跳到主要內容：**頁面最前面有 skip link。
- **標籤：**按鈕的可見文字要包含在可存取名稱內（目前選單按鈕以可見文字 `Menu`／`Close` 作為名稱）。
- **鍵盤：**作品列表是真的連結；3D 標籤只給滑鼠用（`tabindex="-1"`），鍵盤使用者走 HTML 清單。
- **語言：**`<html lang>`、hreflang 與 `og:locale` 由 layout 依語言輸出。
- **減少動態：**見 §9。

## 12. 驗證與維護

**驗證兩個主題**

```bash
npm run build
PORT=3111 node .output/server/index.mjs   # 另開終端機
# 亮色
npx lighthouse http://localhost:3111/ --chrome-flags="--blink-settings=preferredColorScheme=1"
# 暗色
npx lighthouse http://localhost:3111/ --chrome-flags="--blink-settings=preferredColorScheme=0"
```

> `preferredColorScheme` 在 Chrome 裡 `0` 是暗色、`1` 是亮色（與直覺相反）。

**修改前後檢查清單**

- [ ] 新顏色已放進 `theme.css` 兩個主題，並加入 `SEMANTIC`。
- [ ] 閱讀區元件沒有 `bg-white`、`text-slate-*`、十六進位色碼。
- [ ] 兩個主題下的文字對比都 ≥ 4.5:1。
- [ ] 新圖示名稱已加入 `ICONS` 並重新產生字型。
- [ ] 新動畫尊重 `prefers-reduced-motion`。
- [ ] 大量新增文字後，重新執行 `scripts/subset-font.py`。
- [ ] 改了舞台固定色（`lab-*`）時，`tailwind.config.ts` 與 `main.css` 的 `:root` 兩處同步。

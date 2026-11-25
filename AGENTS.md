# AGENTS.md — 開發規範

給所有在這個專案工作的人與 AI 助手（Claude Code、Codex 等）。`CLAUDE.md` 只是引用本檔，**規範只維護這一份**。

- 視覺規範（顏色、字體、間距、元件外觀）：`DESIGN-SYSTEM.md`，**本檔不重複**。
- 已知問題、技術債與修復進度：`CODE-REVIEW.md`。本檔的許多規則，是從那份審查報告裡「已經出過問題的地方」長出來的，條目後面會標 `（R#）` 對應。

---

## 1. 專案概要

這是**面試用的個人作品集**（李柏偉 Elio Lee），首頁是可探索的 3D 數位遺跡。三語：中文（預設，網址無前綴）、`/en`、`/ja`。

| 項目 | 選擇 |
|---|---|
| 框架 | Nuxt 4（`app/` 目錄）、Vue 3.5、TypeScript |
| 樣式 | Tailwind CSS 3（`@nuxtjs/tailwindcss`），token 在 `tailwind.config.ts` 與 `app/assets/css/theme.css` |
| 內容 | `@nuxt/content` v3（`nativeSqlite: true`，使用 Node 內建 `node:sqlite`） |
| i18n | `@nuxtjs/i18n`，`prefix_except_default`，不做瀏覽器語言自動轉址 |
| 3D | `three`，場景在 `app/lib/space-scene.ts` |
| 圖片 | `@nuxt/image`（`<NuxtPicture>` / `<NuxtImg>`） |
| 部署 | Vercel，Node **22.x**；`/`、`/blog`、`/blog/**` 為 ISR（3600 秒） |

### 常用指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發 |
| `npm run check` | **提交前必跑**：`check:content` + `lint` + `typecheck`（約 30 秒） |
| `npm run check:content` | 三語內容檔名、`draft` 狀態、i18n 鍵、重複鍵的對照 |
| `npm run lint` / `npm run typecheck` | ESLint / `nuxt typecheck`（含 `.vue`） |
| `npm run build` | 建置。**Vercel 會先跑 `npm run check` 再建置**（`vercel.json`），檢查沒過就不部署 |

專案目前**沒有自動化測試**，驗證靠 `check` + 建置 + 實際在瀏覽器看（見 §9）。

---

## 2. 目錄與架構分工

```
app/
  pages/        路由頁。每個檔案都是公開路由（不要放實驗用頁面，R1）
  layouts/      default.vue（header、footer、全域 SEO 預設）
  components/   依「功能區域」分組：home / layout / space / project / experience / blog / content / lab / ui
  composables/  帶狀態或依賴 Nuxt/Vue 生命週期的邏輯（useData、useConsent、useTheme…）
  plugins/      全域指令與啟動邏輯（v-reveal、v-elastic、頁面轉場、analytics、theme）
  lib/          與 Vue 無關的純邏輯（ruin.ts 方塊資料、space-scene.ts three.js 場景）
  data/         頁面文案與專案資料。zh 是基準，en / ja 以 typeof 約束成同形狀
content/        Markdown：blog、legal。zh 在根，en/ja 各一個子目錄
i18n/locales/   介面字串（zh / en / ja 三份）
scripts/        開發腳本（check-content.mjs；字型腳本為 Python）
server/api/     只有 sitemap 來源
```

**判斷放哪裡：**

- 用到 `ref`、`useNuxtApp`、`onMounted` → `composables/` 或元件。
- 純函式、不依賴 Vue（可獨立測試）→ `lib/`。`lib/` 不得 import Vue 或 Nuxt。
- 只有單一頁面使用的元件 → 放在對應功能區域，不放 `ui/`。`ui/` 只放跨頁面、與業務無關的小零件。
- 沒有 `utils/` 目錄，**不要因為要抽函式就新建一個**。先放在使用它的檔案旁；出現第三處使用再決定（見 §4）。
- Nuxt 自動匯入 `composables/` 與 `components/`。`ref`、`computed`、`useI18n`、`useLocalePath` 等不需要手動 import。

---

## 3. Vue / Nuxt / TypeScript

1. 有 script 的元件一律 `<script setup lang="ts">`，不得有沒有 `lang="ts"` 的 `<script>`（純模板元件如 `app.vue`、`ProseTable.vue` 不需要 script）。
2. **不使用 `any`、`@ts-ignore`**（目前專案內是 0）。真的需要斷言用 `as` 並說明原因。
3. 頁面資料用 `useData()`。它回傳**一般物件、不是 reactive**：切換語言會換路由、頁面重建，所以在 `setup` 讀一次就夠。**常駐元件（header、footer）不會重建，要用 `$t()`**。
4. 跨元件共享狀態只用 `useState`（目前的 `space-selected`、`scroll-y` 等）。**不要引入 Pinia、lodash、動畫庫**；先問。
5. `data/en/*`、`data/ja/*` 一律以 `typeof zh.x` 標型別。**這是專案最重要的型別保護之一，別弱化它**。新增欄位時只改 zh 的型別，編譯器會告訴你其他語言缺什麼。
6. **新增欄位前先確認有人讀它**。審查時發現過 5 個「資料裡有、但沒有任何程式讀取」的欄位（已移除）。要判斷欄位是否被使用，**把它從型別拿掉再跑 `typecheck`**，不要只靠 grep（同名欄位會誤導）。
7. 頁面的 `useSeoMeta` 由各頁自己宣告 title / description（這是正確的）；站台網址不要再手寫 `String(...siteUrl).replace(/\/$/, '')`（R7，待收斂為統一來源）。
8. 草稿文章（`draft: true`）：列表與 sitemap 不出現、正式環境 404、開發環境可預覽。

### 3.1 ESLint 的注意事項

- 規則只有 recommended；**排版偏好不在檢查範圍**（`vue/attributes-order` 已關）。**不要加 Prettier、不要啟用 stylistic**：專案有自己刻意的緊湊排版，重排會讓整份 diff 失去意義。
- **模板內被賦值的 `let` 不是 `const`**：`@pointerdown="pointerType = ..."` 這種寫法 ESLint 看不見，`prefer-const` 會誤報；改 `const` 會壞掉。處理方式是 `// eslint-disable-next-line prefer-const -- 理由`，**disable 一定要寫理由**。
- 模板內 TS 的 `as 'a' | 'b'` 會被誤判為 filter，改用具名型別（`type SocialKey = ...`）。
- `v-for` 的變數**不要叫 `t`**：會蓋過 i18n 的 `t()`（`vue/no-template-shadow`，目前仍有 6 個警告待改名）。
- 修 lint 時要**先判斷是不是誤報**，不要為了零警告改壞程式。

---

## 4. 元件、Composables、Utils：何時抽離

- **出現第三次才抽。** 兩處相同先保留；第三處出現再抽。審查時刻意保留的重複：`elastic.ts` 與 `MagnetText.vue` 的彈簧常數（只有兩處，L5）。
- **共用外觀 ≠ 共用行為。** 只需要共用外觀時，優先用 `main.css` 的 `@layer components` class（例如現有的 `.lab-chip`、`.lab-chip-light`），不要為了外觀去做 Vue 元件。需要共用結構、插槽或行為時才做元件。
- 不要為了共用而共用：不加只有一個實作的介面、不加只用在一處的設定項、不加 `UiButton` 這類多型元件除非 `<a>` / `<NuxtLink>` / `<button>` 的差異真的被處理（R8 的待辦，見 §10）。
- 元件的 props 以最少為原則；未使用的 variant 不要保留（`UiChip` 目前 6 種色調只用到 1 種，L4）。
- `createSpaceScene`（約 800 行的單一函式）、`elastic.ts`、`MagnetText.vue` 是**自成一體、清理完整**的模擬/互動，**不要為了「檔案太長」拆分**。若要拆，理由必須是「要為純數學寫測試」。

---

## 5. Tailwind 與 Design Tokens

詳細的色票與使用方式見 `DESIGN-SYSTEM.md`。這裡只放**會出事的規則**：

1. **`.vue` 內不寫新的 `#hex` 或 `rgb(…)` 色碼。** 跟著主題變的顏色用 `theme.css` 的 `--c-*`（Tailwind 語意名稱：`bg-surface`、`text-on-surface`…）；不跟主題變的舞台色與品牌橘用 `--lab-*` / `lab-*`。例外要在旁邊註明為什麼不能用 token（R9）。
2. 品牌橘 `#FF5B1F` **只用在深色底與非文字標記**；淺色底上的文字用 `signal-ink`。
3. 需要品牌橘加透明度時，現在沒有通道值變數，這是已知缺口（R9）；**不要再貼新的 `rgb(255 91 31 / x)`**，先問。
4. **`font-heading` 沒有定義**（`tailwind.config.ts` 的 `fontFamily` 沒有 `heading`），加了不會有任何效果。標題字型實際由 `text-display*` / `text-headline-*` 字級 class 提供。要讓元素用標題字型，請用這些字級 class（R5）。
5. 響應式：mobile-first；手機版以「斷點 class」切換，不寫兩份結構以外的 JS 判斷（3D 場景例外，它依 `matchMedia` 與裝置能力決定）。
6. 用 Tailwind 的 `motion-reduce:` 或 `@media (prefers-reduced-motion)` 處理動畫（見 §6）。

---

## 6. 動畫、事件監聽與資源清理

**每一個「開啟」都要有對應的「關閉」，而且在同一個元件內找得到。**

| 開啟 | 必須有 |
|---|---|
| `addEventListener` / `matchMedia(...).addEventListener` | `removeEventListener`（`onBeforeUnmount` 或指令的 `unmounted`） |
| `requestAnimationFrame` | `cancelAnimationFrame` |
| `setTimeout` / `setInterval` | `clearTimeout` / `clearInterval` |
| `IntersectionObserver` / `ResizeObserver` / `MutationObserver` | `disconnect()` |
| three.js 幾何 / 材質 / 貼圖 / renderer | `dispose()`（用 `track()` 登記，`dispose()` 統一清；`forceContextLoss`） |
| Web Animations API / `view-transition` 動畫 | 結束時 `cancel()`（pseudo-element 動畫會污染下一次轉場） |

- **所有動畫與互動都必須處理 `prefers-reduced-motion`**（目前每一處都有，包含指令與 3D）。新增動畫沒處理 = 不合格。
- 只在滑鼠使用者啟用的互動，用 `matchMedia('(hover: hover) and (pointer: fine)')` 判斷。
- 在 `onMounted` 內建立的資源，就在同一處註冊清理（兩種寫法在專案內都存在、都正確，L18）。
- **DOM 讀寫不要交錯**：先全部讀（`getBoundingClientRect`），再全部寫（`style`）。`MagnetText` 目前是交錯的（L6，待量測確認是否有影響）。
- **不要在元件內用 `querySelector` / `closest` 找「別的元件」的 DOM。** 專案目前有一組刻意的例外：`Stage.vue` 依賴 `[data-space]`、`#about`、`#works`、`[data-archive-approach]`、`[data-notes]`，並寫入 `--guide-x`、`--guide-start`（R10）。**改動這些元素的 id / data 屬性前，先看 `Stage.vue`**；之後會把它集中成具名常數並加上「找不到就警告」。
- 手動用 `classList` 改 Vue 渲染的元素（`experience.vue` 的 `is-on`、`is-current`）只在該元素 class 是靜態時才安全；改成動態綁定前先處理它（L12）。

---

## 7. SSR、SEO、i18n、無障礙、效能

### SSR

- `window`、`document`、`localStorage`、`matchMedia` **只能在 `onMounted`、事件處理或 `.client.ts` 外掛內使用**；`setup` 頂層不要碰。
- 所有 `localStorage` 讀寫要 `try/catch`（隱私模式會拋例外），且在讀不到時頁面仍要正常。
- 水合要一致：只在客戶端才知道的狀態（如 `aria-pressed`）用 `mounted` 旗標，避免 SSR 與首次客戶端渲染不同。
- 自訂指令要有 `getSSRProps: () => ({})`；`.client.ts` 外掛放只在瀏覽器執行的邏輯。

### SEO

- 每個頁面都要有 `useSeoMeta`（title、description、og:*）。文章頁另有 `BlogPosting` JSON-LD，案例頁有 `CreativeWork`。
- canonical / hreflang 由 i18n 的 `useLocaleHead` 在 layout 產生。**hreflang 會對所有語言輸出，所以任何頁面缺語言版本就是 SEO 缺陷**（R2）。
- 不該被索引的頁面：加 `robots: 'noindex, nofollow'`（草稿、`error.vue` 已有）。
- `app/pages/` 下**每個檔案都會進 sitemap**。

### i18n

- **模板內的可見文字與 `aria-label` 一律 `$t('...')`**（lint 的 `no-raw-text` 會擋）。只有品牌與技術名詞（`GitHub`、`Elio Lee`）與純符號例外，且要加進 `eslint.config.mjs` 的忽略清單並註明理由——**不是為了消除警告而加**。
- 新增語系鍵：**zh / en / ja 三份一起加**，鍵不能重複（`check:content` 會擋）。
- 標點（如冒號）屬於各語言：用 `common.colon`，不要在模板裡寫死全形或半形。
- 新增文章：`content/blog/<slug>.md` 要同時有 `content/en/blog/<slug>.md`、`content/ja/blog/<slug>.md`，**或**在 zh 版標 `draft: true`。三語檔名必須相同（語言切換靠它）。
- `data/` 與 `content/` 的**文案是作者的內容**，沒有明確同意不要改寫或「潤飾」。

### 無障礙

- 純裝飾元素 `aria-hidden="true"`；互動元素要有可存取名稱。
- 浮層（modal）優先用原生 `<dialog>`（`contact.vue` 的做法）：焦點陷阱、Esc、焦點還原由瀏覽器處理。`Lightbox.vue` 是手刻的，行為目前正確，但**不要再新增第二個手刻的**（L9）。
- 焦點樣式沿用 `:focus-visible`（`main.css`）；不要 `outline: none`。
- 標題層級不要跳級（`ResumeCta` 的 `h3` 是已知小問題，L20）。

### 效能

- **three.js 只在 ≥768px、非 Save-Data、記憶體與核心數足夠時才載入**，並且 `nuxt.config.ts` 的 `build:manifest` 鉤子刻意取消它的 prefetch。**不要讓它進入首屏必載的 bundle。**
- 字型：只預載 `barlow-500`，其餘靠 CSS 解析後載入（`font-display: swap`）。**預載越多，慢速網路上 FCP 越差**（實測過）。不要加預載。
- 圖片用 `<NuxtPicture>` / `<NuxtImg>`，`sizes` 要用 `image.screens` 的名稱（`xs:100vw sm:...`）。**單獨寫 `sizes="100vw"` 會被解析成 `1w`，只產出 1×1 的圖**（真實發生過）。
- **效能問題先量測再改**：用 Chrome Performance 面板或 Lighthouse，沒有量測結果就不要重構。

---

## 8. 提交前與 Code Review 的標準

### 什麼叫「完成」

一項改動要說「完成」，必須**全部**成立：

1. `npm run check` 通過（0 錯誤）。
2. `npm run build` 成功。
3. **有實際看過結果**：改動畫面或互動的，要在瀏覽器看三語、手機寬度與亮/暗主題；改資料或重構的，**比對修改前後渲染的 HTML 是否一致**（做法：存下前後 HTML，排除每次建置都會變的 `__NUXT__.config` 與 `_payload.json?_b=`）。
4. 動到錯誤路徑的（逾時、失敗），要**實際觸發那條路徑**，例如用替身 `fetch`，不是只讀程式碼。

**沒有驗證過的，不要標成「已修復」**；要寫「已修改，尚未驗證」，並說明缺什麼驗證。

### Code Review 的原則

- 區分：**實際缺陷**、**潛在風險**、**技術債**、**風格偏好**、**待確認**。證據不足就標待確認。
- 不因為「行數多」就認定要重構；不因為「寫法不同」就認定有一種是錯的。
- **工具的警告要先判斷是不是誤報。** 專案裡已出現過 3 個（模板內賦值、`as` 被當 filter、grep 找不到被讀取的欄位）。
- 保留已確認合理的設計（`CODE-REVIEW.md` §5）：3D 的資源回收、降級路徑、指令的清理契約、主題無閃爍、三語型別約束、同意機制先於分析、原生 `<dialog>`、`zod` 約束的內容 schema。**重構時不要破壞它們。**
- 發現 `CODE-REVIEW.md` 的判斷有誤，**拿出證據並更正報告**，不要硬照報告執行。

---

## 9. 給 AI 助手的工作規則

這些規則優先於「把事情做完」。

1. **先說明計畫，等確認再改。** 內容：對應的問題、目前程式碼與位置、目前流程、為什麼要改、建議方案與替代方案、修改前後差異、風險與影響範圍、驗證方式。小到不影響行為的（錯字、註解）可以直接改。
2. **不自動 `git commit` / `git push`。** 做完後列出變動，由使用者決定怎麼提交。分階段建議的提交切分可以提供，但不要代為執行。
3. **安裝或移除套件前先說明原因並取得同意。** 移除依賴不能只靠 grep：要在分支驗證 `build` 通過。
4. **不改文案。** `data/*.ts`、`i18n/locales/*.json`、`content/**` 的文字屬於作者。翻譯、潤飾、刪欄位都要先問。使用者要求翻譯時，提醒他自己審閱。
5. **不改變視覺、不破壞既有功能、3D 場景與動畫。** 重構前後要有證據證明畫面一致。
6. **不擅自換技術棧**，也不為了「更現代」引入新工具。
7. **不為了減少行數犧牲可讀性，不為了統一而過度抽象。**
8. **誠實回報。** 失敗就說失敗並附輸出；跳過的步驟要說跳過；無法驗證的要說明限制（例如「這是 iframe 模擬，不是真機」）。
9. 判斷依據要有證據（指令輸出、檔案與行號），不確定就標「待確認」，不要猜。
10. 用**繁體中文**溝通，包含提問與選項。
11. **作品集是面試用，不放接案內容**；哪些經歷能寫，見使用者的記憶規則（`portfolio-site-purpose`）。
12. 設計主題是「**數位遺跡**」，不是測繪；視覺、色彩、質感都從遺跡出發。

### 環境注意

- 開發機是 **Windows**，檔案換行混用 LF 與 CRLF。**做多行字串替換前先確認該檔的換行**，否則樣式比對會失敗（真實發生過：`space-scene.ts`、`Space.vue` 是 CRLF）。
- `.env` 含 EmailJS 設定（公開金鑰，但仍不要讀出或複製值）。需要鍵名看 `.env.example`。
- `.claude/` 與 `.agents/` 被 `.gitignore` 忽略（本機技能），不要把它們加進版本控制。

---

## 10. 已知技術債（改動相關區域時請順手留意）

完整清單與證據在 `CODE-REVIEW.md`。目前尚未處理的重點：

| 編號 | 內容 |
|---|---|
| R5 | `font-heading` 沒有定義（`error.vue` 的 404 數字實際是 Inter） |
| R7 | 站台網址、SEO meta、JSON-LD 作者名在多處重複 |
| R8 | 按鈕（6 份 `const btn`）、chip（3 套）、石板卡片（3 份）的外觀重複 |
| R9 | 品牌橘、標題字型堆疊、3D 場景亮色主題色在多處硬編碼 |
| R10 | `Stage` 與 `Space/About/Notes` 靠 selector 耦合；每幀讀版面（**需先量測**） |
| — | 6 個 `vue/no-template-shadow` 警告 |
| — | 沒有自動化測試（第六階段評估） |

**處理這些之前，不要為了「順便」去改。** 需要時先提出計畫。

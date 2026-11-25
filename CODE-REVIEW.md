# Code Review 報告：frontend-portfolio

> 審查日期：2026-11-25　審查範圍：`app/`、`server/`、`nuxt.config.ts`、`tailwind.config.ts`、`content.config.ts`、`i18n/`、`content/` 結構、`package.json`
> 審查方式：靜態閱讀（約 7,200 行非生成程式碼）＋ 唯讀檢查。**未修改任何程式碼、未安裝套件、未啟動 dev server。**
> 未涵蓋：`DESIGN-SYSTEM.md`、blog / legal 的 Markdown 內文、`lib/space-scene.ts` 中 GLSL 與場景佈置細節（只審了生命週期與介面）、`data/*` 的文案內容。

## 0.0 修復進度

### 第一階段：既有缺陷與環境整理（2026-11-25 完成，**尚未 commit**）

| # | 項目 | 狀態 | 實際做了什麼 / 驗證結果 |
|---|---|---|---|
| R1 | `pages/test.vue` | ✅ 已修復並驗證 | 移除前 grep `app server nuxt.config.ts content.config.ts i18n README` 無任何引用。移除後 build 通過，`/test` 由 200 變 404，三份 sitemap（zh-Hant / en / ja）內的 `/test` 由各 1 筆變 0 筆。**原報告「可能在 sitemap」的 ⚪ 推測已證實** |
| R2 | 兩篇文章缺 en/ja | ✅ 已修復並驗證 | 新增 4 個翻譯檔（**翻譯為 AI 所寫，請自行審閱後再發布**）。preview 實測：zh / en / ja 兩篇文章共 6 個網址全部 200；zh 文章 `<head>` 的 hreflang（x-default、zh、zh-Hant、en、ja）指向的網址都存在。內容對照腳本（防線）屬第二階段，尚未做 |
| R3 | 三處寫死英文 | ✅ 已修復並驗證 | 改用 `common.close`、`nav.menu`、`nav.breadcrumb`、`projects.nextProject`。實測 HTML：zh「選單」、ja「メニュー」、en「Menu」；展開後「關閉 / Close / 閉じる」；案例頁「下一個 / Next」。以 390px 寬 iframe 模擬手機，三語 header 皆無換行、無橫向溢出。**限制：這是 iframe 模擬，不是真機** |
| R4 | contact 送出無逾時 | ✅ 已修復並驗證 | 在瀏覽器中把 EmailJS 的 `fetch` 換成「永不回應、只聽 abort」的替身：請求確實帶 `signal`；約 16 秒後對話框關閉、出現「送出失敗」，且訊息內容保留（沒有被清掉）。**限制：驗證的是「signal 有傳入且逾時後流程正確」，不是真實網路環境** |
| — | `.env.example` | ✅ 已新增 | 列出 4 個必要鍵（`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_EMAILJS_{SERVICE_ID,TEMPLATE_ID,PUBLIC_KEY}`）與 2 個選用覆寫（GTM / GA4）；只寫鍵名與說明，沒有讀取或複製 `.env` 的值 |
| L1 | `cjkFiles` 死程式碼 | ✅ 已移除 | `layouts/default.vue` |
| L2 | `.home-reading`、`--lab-paper` | ✅ 已移除 | `main.css`（含 max-width:767px 內兩條相關規則）。移除前確認模板與 TS 皆無引用 |
| — | 未使用 i18n 鍵 | ✅ 已移除（經你同意） | `nav.openMenu`、`nav.closeMenu`、`home.photoPull`；三語各移除，鍵總數仍為 170（刪 3、為 R3 新增 3），三份對照零差異 |
| R6 | `better-sqlite3` | ✅ 已移除並驗證 | 見下方「證據」。移除後 build 通過、首頁與文章頁 200、文章內容正常渲染 |
| R6 | `gsap` | ✅ 已移除並驗證 | `app/`、`server/`、`nuxt.config.ts` 零 import，`package-lock.json` 中沒有其他套件依賴它。移除後 build 通過。**「關於我」文案提到 GSAP 一事，由你自行判斷，我沒有改文案** |
| L17 | 未使用的專案資料欄位 | ✅ 已移除並驗證（經你同意） | 從型別與三份資料檔（`data/home.ts`、`data/en/home.ts`、`data/ja/home.ts`）移除 `no`（專案層級）、`side.icon`、`side.title`、`detail.scope`（型別）、`challenges[].label`。三語替換筆數一致（各 5 / 5 / 15）。驗證：`nuxt typecheck` 0 錯誤；`nuxt build` 成功；**逐頁比對修改前後的 HTML（3 語 × 9 種頁面 = 27 頁，已排除每次建置都會變的 `__NUXT__.config` 與 `_payload.json?_b=` 建置 ID），內容完全一致**，證明畫面無任何變化 |

**共同驗證**：`nuxt build` 3 次皆成功（Node 22.23.4）；`tsc --noEmit`（僅 `.ts`）退出碼 0；i18n 三語各 170 鍵零差異；三個內容目錄檔名一致。

#### 本階段發現並修正的判斷

1. **`better-sqlite3` 不只是「疑似可移除」，而是本機從未真正在用**：
   - `node_modules/better-sqlite3/build` 不存在（沒有編譯成功過）。
   - 執行 `npm uninstall gsap` 時，npm 會觸發 `better-sqlite3` 的 install script（`node-gyp rebuild`），在這台 Windows 機器上因找不到 Visual Studio 而失敗。**也就是說，只要它還在 `dependencies` 裡，任何人在沒有 C++ 編譯環境的機器上做 `npm install` / `npm uninstall` 都可能失敗。**
   - 它是 `@nuxt/content` 的**可選** peer 依賴（`peerDependenciesMeta.optional: true`），不是被連帶安裝，而是被明確寫進了你的 `package.json`。
   - 部署端確認：Vercel。**更正**：當時依你的口頭說法記為 Node 22.x，但 Vercel 專案設定實際是 **26.x**（後來從部署日誌才發現）；兩者都 ≥ 22.5，`node:sqlite` 皆可用，所以移除 `better-sqlite3` 的結論不受影響，但「我確認過部署端」這句話當時並沒有查證 Vercel 設定。
   - 因此原本報告 R6 的「⚪ 待確認」可以改判為「已確認可移除」。
2. **`engines` 的建議值需修正**：報告原文寫「補 `engines: { node: '>=22.5' }`」。實際上 `nuxt` 自己宣告 `^22.22.3 || ^24.15.0 || >=26.0.0`，應以此為準。這項屬第二階段，到時一起處理。
3. **對移除依賴的順序有影響**：因為上面第 1 點，**必須先移除 `better-sqlite3`，才能順利移除其他套件**。

#### 第一階段未解決 / 需要留意

- 全部變更**尚未 commit**（你還沒回答 commit 方式）。
- R3 的手機驗證是 iframe 模擬；R4 的是替身 `fetch`。若要更高信心，建議部署到 Vercel preview 後用真機再看一次。
- `package-lock.json` 的 diff 只有 `better-sqlite3` 與 `gsap` 相關條目，沒有其他套件版本被連帶改動（已看 diff）。
- git 的 CRLF 警告是 Windows `autocrlf` 的提醒，與本次修改無關。

### 第二階段：自動化品質防線（進行中）

| 項目 | 狀態 | 內容 / 驗證結果 |
|---|---|---|
| 2.1 內容與 i18n 對照檢查 | ✅ 完成並驗證（尚未 commit） | 新增 `scripts/check-content.mjs`（純 Node，零依賴），`npm run check:content`。檢查：①`content/{blog,legal}` 三語檔名一致 ②同一篇文章三語 `draft` 狀態一致 ③`en`、`ja` 的 i18n 鍵與 `zh` 完全相同 ④同一層 JSON 物件內沒有重複鍵。目前通過（170 鍵）。**負向測試**：分別故意刪翻譯檔、讓 `draft` 不一致、刪一個 i18n 鍵、加重複鍵，四種都正確紅燈，還原後恢復綠燈 |
| 2.2 Node 版本規範 | 🔄 **已更正** | 原本加了 `"engines": { "node": "22.x" }` 與 `.nvmrc`（`22`），**我沒有核實 Vercel 專案設定**（實際是 **26.x**，你當時說 22.x）。`engines` 會覆蓋專案設定，把 Vercel 的 Node 從 26.x 降成 22.x（Vercel 日誌有警告），而第一次啟用 `check` 的部署就失敗了（exit 2）。**已移除 `engines`**，Vercel 回到使用專案設定的 26.x；`.nvmrc` 保留，僅作為本機開發的版本提示。**本機以乾淨安裝在失敗的那個 commit（`6c00824`）跑 `npm run check`，Node 22.23.4 上通過**，所以程式碼本身沒問題；失敗的確切原因**仍待確認**（需要 Vercel 日誌中 `check` 開始後的輸出）。此外，`npm run check` 在 Node 26 上是否通過，**尚未驗證** |
| 檢查入口 | ✅ | `npm run check` = `check:content` + `lint` + `typecheck`（約 30 秒） |
| 2.3 型別檢查 | ✅ 完成並驗證（尚未 commit） | 安裝 devDependencies：`vue-tsc` 3.3.14、`typescript` 6.0.3；新增 `npm run typecheck`（`nuxt typecheck`，約 25 秒），並併入 `npm run check`。**基準：整個專案含 `.vue` 目前 0 個型別錯誤**，所以不需要「記錄基準再逐步降低」，可以直接設為必須通過。**負向測試**：故意在元件裡寫 `const x: number = 'a'`、在模板傳不存在的 prop 值，兩者都被抓到（已還原）。注意：`typescript` 被裝成 **6.0.3**（原本只是間接依賴的 5.9.3），目前與 Nuxt 配合沒有問題，但屬於主版本較新的選擇，若日後遇到相容問題可退回 5.x |
| 2.4 ESLint | ✅ 完成並驗證（尚未 commit） | 安裝 devDependencies `eslint` 10.15.0、`@nuxt/eslint` 1.17.0（`nuxt.config.ts` 的 `modules` 加入 `@nuxt/eslint`，`stylistic: false`、`checker: false`）；新增 `eslint.config.mjs`（只用 recommended，關閉 `vue/attributes-order`）與 `npm run lint`，併入 `npm run check`。**量測**：67 個檔案共 16 個命中（8 錯誤、8 警告），約 13 秒。**逐一判斷後的處理**：①`prefer-const` ×2（`Space.vue` 的 `pointerType`、`Lightbox.vue` 的 `touchX`）是**誤報**——這兩個變數在**模板裡被賦值**，ESLint 看不到；照規則改成 `const` 會直接壞掉，所以加上帶理由的 `eslint-disable-next-line`。②`vue/no-deprecated-filter` ×1（`contact.vue`）是**誤報**——eslint-plugin-vue 把模板裡 TS 的 `as 'a' \| 'b'` 的 `\|` 誤認成已淘汰的 filter 語法；改用具名型別 `SocialKey`。③`no-irregular-whitespace` ×1（`CaseDiagram.vue` 的正規式藏了一個肉眼看不見的全形空白 U+3000）：改成 `　-鿿＀-￯`，語意相同（已用 `）`、`あ`、`ａ`、`a`、空白驗證）。④`no-unused-expressions` ×4（`space-scene.ts` 用逗號把多個動作串成一句）：改成分號加大括號，語意相同。⑤`vue/attributes-order` ×2：排版偏好，規則關閉。⑥`vue/no-template-shadow` ×6（迴圈變數 `t` 蓋過 i18n 的 `t()`）：**真實但低風險**的隱患，目前沒出事，**保留為警告，沒有修改**。**結果**：0 錯誤、6 警告；`npm run check` 通過（約 31 秒）；`nuxt build` 成功；實際在瀏覽器開首頁，3D 場景正常啟動（遺跡、階梯、迴廊、作品門、封面貼圖比例、橘色門框、標籤都正常）。**限制**：3D 的 4 處改動是語意相同的語法改寫，我只用肉眼確認畫面正常，沒有做像素級比對 |
| 2.5 i18n lint 規則 | ✅ 完成並驗證（尚未 commit） | 安裝 devDependency `@intlify/eslint-plugin-vue-i18n` 4.5.1，在 `eslint.config.mjs` 對 `app/**/*.{vue,ts}` 啟用兩條規則：`no-missing-keys`（`$t('鍵')` 的鍵必須存在於語系檔）與 `no-raw-text`（模板裡的可見文字必須來自 i18n）。**量測**：`no-missing-keys` 命中 0；`no-raw-text` 命中 27，其中約 24 個是合理的非翻譯內容（編號、符號、`GitHub`、`Elio Lee`），所以設定一份明確的忽略清單（無字母的符號文字用樣式忽略；其餘品牌名、列表標記、裝飾讀數逐項列出並註明理由）。**負向測試**：把 `'Close'` 寫死回去、把 `nav.menu` 打成 `nav.menuu`，兩條規則都正確報錯，已還原。**刻意不啟用** `no-unused-keys`：專案有 `$t(` + 反引號 `nav.${key}` + `)` 這類動態鍵，以及用 `tm()` 一次取整個陣列（`contact.topics`、`contact.info`）的寫法，都會被誤判為未使用（我第一階段的腳本列出 17 個「未使用」鍵，其中 16 個是這類誤報、只有 1 個是真的；而真正未使用的 `nav.openMenu`、`nav.closeMenu` 反而因為被動態鍵規則排除，沒被那份腳本列出，是用 grep 另外找到的。這說明自動判斷未使用鍵不可靠）。目前**沒有**未使用鍵的自動檢查，之後若累積太多再手動用腳本找 |
| 2.6 檢查自動化（方案 B） | ✅ 已設定、**尚未實際部署驗證** | 新增 `vercel.json`：`"buildCommand": "npm run check && npm run build"`。之後每次部署（push 後）Vercel 會先跑 `check`（內容對照 + lint + 型別），沒過就不建置、不部署。本機完整流程（`check` + `build`）約 1.5 分鐘。**重要**：Vercel 建置失敗時，**既有的正式站台會繼續維持舊版**，不會下線。**風險 / 限制**：我無法在本機模擬 Vercel 的 Linux 環境，第一次 push 後請看 Vercel 部署日誌確認 `check` 在雲端也通過；若因環境差異失敗，刪除 `vercel.json` 即可回到原本行為。已放棄 GitHub Actions（見討論：Vercel 已自動建置，且一個人開發用方案 B 更簡單） |

**2.6 的部署失敗與修正（2026-11-25）**：啟用 `vercel.json` 後的第一次部署失敗（exit 2）。**根因不是 Node 版本**（我和你當時都先猜是它），而是 `nuxt typecheck` 的結果**依環境不同**：Vercel 上 `@nuxt/image` 自動切成 `vercel` provider，其型別不允許 `format` 修飾子，而本機用 `ipx` 允許，所以 `Lightbox.vue:67`、`Stage.vue:104` 兩處的 `format` 在本機通過、在 Vercel 報 `TS2353`。**重現**：本機設 `VERCEL=1` 後出現一模一樣的兩個錯誤與行號。**為何安全**：Vercel provider 原始碼只產生 `url`、`w`、`q` 三個參數，`format`（與 `height`）在正式環境本來就被忽略，所以拿掉不改變線上網址。**修正**：①移除這兩處 `format`（並更新 `Lightbox.vue` 的註解）；②新增 `scripts/typecheck.mjs`，讓 `npm run typecheck` 自帶 `VERCEL=1`，本機與部署用同一組型別。**驗證**：`npm run check` 通過；`nuxt build` 成功；**負向測試**：把 `format` 放回去，**本機**現在會失敗（exit 2），還原後恢復。**限制**：尚未在 Vercel 實際部署驗證；本機的 `ipx` 預覽（`npm run preview`）的 3D 貼圖與燈箱預載不再指定 webp/avif（只影響本機預覽，不影響線上）。這也推翻了我先前的判斷：「第一次 push 要看雲端是為了 Linux 差異」——實際是 image provider 差異。

**未解決 / 注意**
- ✅ 2.5 發現的兩處全形冒號問題（`AppHeader.vue:110`、`legal/[slug].vue:19`）已處理（經你同意）：沒有改你原有的文字，只新增 `common.colon`（中、日為 `：`，英為 `: `），兩處改用它。渲染驗證：`/legal/privacy` 中文「最後更新：」、英文「Last updated: 」、日文「最終更新：」。`AppHeader` 的 sr-only 文字用同一個鍵，但我沒有單獨檢查它的渲染結果。同時把 `：` 從 lint 忽略樣式移除，之後再有寫死的全形冒號會被攔下。**尚未 commit**
- 2.1 的「重複鍵」是逐行掃描，只適用目前這種一行一鍵的排版；若有人把 JSON 改成壓縮成單行，這項檢查會失效（其他三項不受影響）。
- Vercel Build Command 啟用後，**任何檢查失敗都會擋住新的部署**（舊版仍在線）。目前 lint 有 6 個警告（`vue/no-template-shadow`），警告不會擋；只有錯誤才會擋。

### 第三階段：開發規範（草稿完成，**待你審閱**；尚未 commit）

| 項目 | 狀態 | 內容 |
|---|---|---|
| `AGENTS.md` | ✅ 已建立（草稿） | 繁體中文，共 10 章：專案概要與指令、目錄與架構分工、Vue/Nuxt/TS（含 ESLint 注意事項）、抽離原則、Tailwind 與 Design Tokens、動畫與資源清理、SSR/SEO/i18n/無障礙/效能、完成標準與 Code Review、**給 AI 助手的工作規則**、已知技術債。視覺規範不重複，引用既有的 `DESIGN-SYSTEM.md`。多數規則標註來源（R#、L#），都是這次審查中「實際出過問題」的地方 |
| `CLAUDE.md` | ✅ 已建立 | 以 `@AGENTS.md` 引用共用規範，加上 Claude Code 專屬的三條補充，避免兩份內容分叉。Codex 原生讀 `AGENTS.md` |
| 驗證 | ⚠️ 限制 | 規範是文件，沒有自動驗證手段。我核對了其中可查證的事實（`any` / `@ts-ignore` 為 0、`.vue` 皆為 `lang="ts"`、沒有 `utils/` 目錄、`AGENTS.md` / `CLAUDE.md` 不會被 `.gitignore` 忽略）。**沒有驗證**的是「Codex 是否會讀 `AGENTS.md`」與「`CLAUDE.md` 的 `@AGENTS.md` 引用在你的 Claude Code 版本是否生效」，需要你實際開新對話確認 |

### 其餘階段

| # | 項目 | 狀態 |
|---|---|---|
| R5、R7、R8、R9 | 一致性與可維護性重構 | ⏳ 第四階段 |
| R10、L6、L7 | 架構與效能 | ⏳ 第五階段（先量測） |
| 測試 | ⏳ 第六階段 |

---

## 0. 先看這裡

### 0.1 實際執行的檢查

| 檢查 | 指令 | 結果 |
|---|---|---|
| ESLint / Prettier | — | **專案沒有**（`node_modules/.bin` 無 eslint、prettier） |
| 單元 / E2E 測試 | — | **專案沒有**（無 vitest / playwright，`package.json` 也沒有 test script） |
| Vue 型別檢查 | `vue-tsc` | **沒安裝**，無法對 `.vue` 做型別檢查 |
| TS 型別檢查 | `node node_modules/typescript/bin/tsc --noEmit -p .nuxt/tsconfig.app.json` | 退出碼 0、無輸出。**但這只涵蓋 `.ts` 檔，不含 `.vue`，所以只能說「`.ts` 沒有型別錯誤」，不能說整個專案型別正確** |
| i18n 鍵值對照 | 自寫 node 一行指令比對 `zh/en/ja.json` | 三份各 170 個鍵，**完全一致** |
| 內容檔對照 | `diff` 比對 `content/blog` 與 `content/{en,ja}/blog` | **zh 有 2 篇沒有 en/ja 版本**（見 R2） |

### 0.2 標記說明

| 標記 | 意思 |
|---|---|
| 🔴 缺陷 | 已能從程式碼確認會出錯 |
| 🟠 風險 | 特定情境會出事，或之後很容易出事 |
| 🟡 技術債 | 現在沒壞，但會讓後續修改變貴 |
| 🔵 偏好 | 風格或取捨問題，不改也行 |
| ⚪ 待確認 | 證據不足，需要實測才能判定 |

### 0.3 一句話結論

這個專案的**工程品質高於一般作品集**：生命週期清理、SSR 安全、減少動態、無障礙、降級路徑都做得很用心，而且註解多半寫「為什麼」。真正的問題不在「寫得差」，而在三件事：**(1) 一些會被面試官撞見的小缺陷**（`/test` 頁、切語言 404、寫死英文）；**(2) 「同一件事做了好幾次」的重複**（按鈕、chip、石板卡片、品牌色、SEO meta）；**(3) 完全沒有自動化防線**（沒 lint、沒型別檢查、沒測試），所以前兩類問題沒人攔得住。

---

## 1. 專案整體評估

### 1.1 架構概況

```
app/
  pages/        路由頁（8 個，含 1 個不該存在的 test.vue）
  components/   按功能分組：home / layout / space / project / experience / ui / content / lab / blog
  composables/  useData（三語資料）useConsent useAnalytics useTheme useScroll
  plugins/      reveal / elastic 兩個指令、頁面轉場、analytics、theme
  lib/          ruin.ts（方塊資料，3D 與 SVG 共用）space-scene.ts（1048 行，three.js）
  data/         zh 為主，en/ja 以 `typeof zh.x` 約束同形狀
content/        zh 在根，en/ja 各一個子目錄；每個語言一個 collection
```

### 1.2 七個面向評分

評分只是方便比較，不是給你壓力。5 = 幾乎無可挑剔。

| 面向 | 分數 | 一句話 |
|---|---|---|
| 可讀性 | 4 / 5 | 命名清楚、註解講「為什麼」。扣分：About/Notes 的 scoped CSS 一行塞很多宣告；`createSpaceScene` 單一函式 800 行；註解語言中英混用 |
| 可維護性 | 3 / 5 | 結構分得清楚，但「改一個東西要改多處」的地方不少（品牌色、按鈕、SEO meta、3D 與 HTML 靠 CSS selector 溝通） |
| 可擴充性 | 3.5 / 5 | 新增語言、新增專案很容易（資料驅動、型別約束）。扣分：寫死 `'game-together'`、`Principles` 寫死 3 欄高度、內容檔缺翻譯沒有防線 |
| 一致性 | 3 / 5 | 這是最大落差：同一視覺有 6 份按鈕字串、3 套 chip、3 份石板卡片；Lightbox 手刻焦點陷阱而 contact 用原生 `<dialog>`；`font-heading` 這個 class 根本沒有定義 |
| 可靠性 | 4 / 5 | 事件、rAF、observer、GPU 資源清得很乾淨。扣分：contact 送出無逾時、`v-reveal` 的 SSR 閃爍待確認、切語言 404 |
| 可測試性 | 2.5 / 5 | 0 個測試。好消息是「可以被測的純邏輯」其實不少（`fit()`、`tokens`、`rules`、`useData`、`ruinBlocks`），只是沒人抽出來 |
| 簡潔性 | 4 / 5 | 沒有過度抽象，沒有不必要的狀態管理套件。扣分：未使用的 `gsap`、`UiChip` 的 6 種色調只用 1 種、死 CSS、`cjkFiles` 空陣列 |

---

## 2. 問題清單與優先級總覽

| # | 問題 | 面向 | 類型 | 嚴重度 | 建議 |
|---|---|---|---|---|---|
| R1 | ✅ 已修復：`pages/test.vue` 練習頁上線 | 可靠性 / 簡潔 | 🔴 缺陷 | 高 | 已完成 |
| R2 | ✅ 已修復：兩篇文章缺 en/ja，切語言 404、hreflang 指向 404 | 可靠性 / 可擴充 | 🔴 缺陷 | 高 | 已補翻譯；防線腳本待做 |
| R3 | ✅ 已修復：三處寫死英文，沒走 i18n | 一致性 | 🔴 缺陷 | 中 | 已完成 |
| R4 | ✅ 已修復：contact 送出沒有逾時，對話框可能被鎖死 | 可靠性 | 🟠 風險 | 中 | 已完成（`.env.example` 待補） |
| R5 | `font-heading` class 沒有定義（15 處使用） | 一致性 | 🔴 缺陷（輕微視覺） | 低～中 | 待決定 |
| R6 | 沒有 lint / 型別檢查 / 測試；依賴與環境衛生 | 可測試 / 可維護 | 🟡 技術債 | 中 | 立即（工具）＋後續（測試） |
| R7 | 站台網址、SEO meta、JSON-LD 作者名重複 | 可維護 | 🟡 技術債 | 中 | 後續 |
| R8 | 按鈕 / chip / 石板卡片：同視覺多份實作 | 一致性 | 🟡 技術債 | 中 | 後續 |
| R9 | Design Token 外洩：色碼、品牌橘、標題字型多處硬編碼 | 一致性 | 🟡 技術債 | 中 | 後續 |
| R10 | Stage ↔ Space / About / Notes 靠 CSS selector 暗中耦合，且每幀讀版面 | 可維護 / 效能 | 🟡 技術債＋⚪ | 中 | 後續 |
| — | 其餘低嚴重度項目 | 各面向 | 見 §4 | 低 | 見 §4 |

> 嚴重度是依「面試官有沒有機會看到」＋「修改成本」排的，不是依「程式碼多醜」。

---

## 3. 重點問題詳述

### R1　`pages/test.vue` 練習頁上線　🔴 高 → ✅ 已移除

- **面向**：可靠性、簡潔性
- **位置**：`app/pages/test.vue:1-79`
- **現況程式碼**（節錄）

  ```vue
  <template>
    <div class="flex w-full flex-col">
      test
    </div>
    <input type="text" v-model="keyword">
  </template>
  <script setup>            <!-- 注意：不是 lang="ts" -->
  ...
      `api/products?q=${encodeURIComponent(value)}`,   // 相對路徑，且這個 API 不存在
  ```
- **問題**：這是一份「防抖 + AbortController + 請求序號」的練習碼。檔案在 `app/pages/`，Nuxt 會把它**自動變成公開路由 `/test`**。它：
  1. 頁面內容只有 `test` 和一個輸入框，面試官如果亂輸入網址會看到；
  2. 沒有 `useSeoMeta`、沒有 `noindex`，`robots.txt` 是 `Disallow:`（全部允許），而 `@nuxtjs/sitemap` 預設會收錄 router 裡的靜態頁——**很可能已經出現在 sitemap**（⚪ 待確認：`curl <site>/sitemap_index.xml` 看看）；
  3. 是唯一沒有 `lang="ts"` 的檔案，也是唯一用相對 `fetch('api/...')` 的地方，風格與其餘專案完全不同。
- **為什麼要改**：這是整個專案**唯一一個「別人打開網址就會看到未完成內容」的缺陷**，對作品集特別傷。
- **建議**（二選一）
  - **A. 直接刪掉（推薦）**：它在 git 歷史裡找得回來，也沒有任何程式碼引用它。
  - **B. 想保留這個學習筆記**：它的內容其實是「如何處理搜尋輸入的 race condition」，跟你 `content/blog/` 的主題很合——可以改寫成一篇筆記（`blog/` 的 `search-race-condition.md`），而不是留在 `pages/`。
- **修改前後**：`pages/` 少一個檔案；`/test` 變 404；sitemap 少一筆（若有）。
- **效益**：消除「半成品被看到」風險；`pages/` 目錄語意乾淨。
- **副作用**：無。沒有任何元件 import 它。
- **推薦理由**：方案 A 成本最低；若你想保留知識，B 才是正確位置，但不是在 `pages/`。

---

### R2　兩篇文章缺 en/ja 版本，切語言會 404　🔴 高 → ✅ 已補翻譯（防線腳本待做）

- **面向**：可靠性、可擴充性
- **位置**
  - `content/blog/gis-snapshot-workflow.md`、`content/blog/image-application-form-state.md`（zh 有，`content/en/blog`、`content/ja/blog` 沒有；兩篇的 frontmatter 都沒有 `draft: true`，所以是**已發布**）
  - `app/layouts/default.vue:4`（`useLocaleHead({ seo: true })`）
  - `app/components/layout/AppHeader.vue:117`（`switchLocalePath(l.code)`）
- **現況**：`content.config.ts` 的註解寫「檔名（slug）三語相同，切換語言時網址才對得上」——這是個**靠人記得遵守的約定**，沒有任何東西檢查。
- **問題**
  1. 讀者在 `/blog/gis-snapshot-workflow` 按語言選單→「English」，會被導到 `/en/blog/gis-snapshot-workflow`，`blog/[...slug].vue:9` 找不到文章，拋 404。
  2. `useLocaleHead` 會替**每個語言**輸出 `<link rel="alternate" hreflang>`，所以這兩篇的 zh 頁面 `<head>` 裡會宣告「這頁有英文版 / 日文版」，但那兩個網址是 404。搜尋引擎會把這當成 hreflang 錯誤。（⚪ hreflang 部分建議用瀏覽器檢視原始碼實際確認一次）
- **為什麼要改**：這兩篇是 2025-06 與 2026-11-17 才新增的，正是「新增內容時漏了翻譯」的實證，**之後一定還會再發生**。
- **建議**：分兩層處理。
  1. **內容層（治本）**：補上兩篇的 en / ja，或在 zh 版暫時加 `draft: true` 到翻譯完成。
  2. **防線層（治標，但可以自動化）**：一個很小的檢查腳本，比對三個目錄的檔名：

     ```ts
     // scripts/check-content-parity.ts（示意；執行：node --experimental-strip-types scripts/check-content-parity.ts）
     import { readdirSync } from 'node:fs'
     const base = new Set(readdirSync('content/blog'))
     for (const l of ['en', 'ja']) {
       const have = new Set(readdirSync(`content/${l}/blog`))
       const missing = [...base].filter(f => !have.has(f))
       if (missing.length) { console.error(`[${l}] 缺少：`, missing); process.exitCode = 1 }
     }
     ```
- **修改前後**：前＝漏翻譯無人知曉，上線後才被讀者撞到；後＝漏翻譯時 CI / 本地腳本直接紅燈。
- **效益**：消除一整類「語言切換 404」缺陷；也讓 hreflang 輸出正確。
- **副作用**：`draft: true` 的 zh 文章會從列表、sitemap 消失（這正是 draft 的設計）。
- **方案比較**

  | 方案 | 優點 | 缺點 |
  |---|---|---|
  | A. 補翻譯＋檢查腳本（推薦） | 治本，行為最直覺 | 要花翻譯時間 |
  | B. 缺翻譯時，語言選單自動導到該語言的 `/blog` 列表 | 不用翻譯就不 404 | 要自己寫「這篇有沒有翻譯」的查詢，hreflang 仍要另外處理；複雜度變高 |
  | C. 缺翻譯時 fallback 顯示中文內容 | 讀者不會 404 | 英文網址顯示中文，SEO 會被視為重複內容 |

  推薦 A：問題的根源是「內容缺失」，不是「程式不夠聰明」。B、C 都是用程式碼掩蓋內容問題。

---

### R3　三處寫死英文，沒走 i18n　🔴 中 → ✅ 已修復並驗證

- **面向**：一致性
- **位置與原始碼**

  | 位置 | 原始碼 | 影響 |
  |---|---|---|
  | `components/layout/AppHeader.vue:140` | `{{ menuOpen ? 'Close' : 'Menu' }}` | 中文 / 日文手機版選單按鈕顯示英文 |
  | `pages/blog/[...slug].vue:64` | `aria-label="Breadcrumb"` | 螢幕閱讀器在中文頁面唸英文 |
  | `pages/projects/[slug].vue:288` | `Next {{ next.code }}` | 案例頁底部「下一個」永遠英文 |

  另外 `layouts/default.vue:22` 的 `ogImageAlt` 也是英文（這個屬於 SEO 文案，可接受，列在這裡提醒）。
- **為什麼要改**：這個站有三語，且 i18n 鍵值對照我實測 170 鍵完全一致——代表你本來就有把 i18n 守得很好，這三處是漏網之魚。其中 `Menu / Close` 在手機上每個頁面都看得到。
- **建議**：`common.close` 已存在（`Lightbox.vue` 就在用），只需新增 `nav.menu`、`blog.breadcrumb`（已有 `blog.breadcrumb` 但那是文字「技術筆記」，需另取名如 `nav.breadcrumb`）、`projects.next`。

  ```diff
  - {{ menuOpen ? 'Close' : 'Menu' }}
  + {{ menuOpen ? $t('common.close') : $t('nav.menu') }}
  ```
- **效益**：三語體驗完整；無障礙語言一致。
- **副作用**：日文「Menu」可能維持英文 `メニュー` 較自然，翻譯內容要你定。視覺上字寬可能改變（中文兩字比 `Menu` 窄），手機版 header 版面需看一眼。
- **建議**：立即改。可配合 ESLint 規則 `@intlify/vue-i18n/no-raw-text` 自動攔截（見 §7）。

---

### R4　contact 送出沒有逾時，對話框可能被鎖死　🟠 中 → ✅ 已修復並驗證

- **面向**：可靠性
- **位置**：`app/pages/contact.vue:38`、`:79-91`、`:176`
- **現況程式碼**

  ```ts
  const onCancel = (e: Event) => { if (sending.value) e.preventDefault() } // Esc must not interrupt a send
  ...
  const [res] = await Promise.all([
    fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', ... }),   // 沒有 signal
    new Promise(r => setTimeout(r, 1600)),
  ])
  ```
  關閉鈕：`:disabled="sending"`。
- **問題**：送出期間，**Esc 被擋、關閉鈕被停用、全螢幕 loading 遮罩蓋住**。如果網路卡住（例如訪客在需要登入的公共 Wi-Fi，請求既不成功也不失敗），瀏覽器預設逾時可能長達數分鐘，使用者只能重新整理頁面，剛寫的訊息就沒了。
- **為什麼要改**：「為了避免中斷送出而把所有出口堵住」是合理的，但前提是**送出一定會在有限時間內結束**。目前這個前提沒有被保證。
- **建議**：加逾時，讓 catch 路徑接手（失敗 toast 已存在）。

  ```diff
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
  +   signal: AbortSignal.timeout(15_000),
      headers: { ... },
  ```
- **修改前後**：前＝最壞情況永久鎖住；後＝最多 15 秒後顯示「送出失敗」並關閉對話框。
- **效益**：消除唯一一個會讓使用者卡死的路徑。
- **副作用**：若 EmailJS 在第 15 秒之後才回應，使用者看到「失敗」但信其實寄出了，可能重複寄信。EmailJS 正常在 1–2 秒內回應，15 秒很寬鬆；`AbortSignal.timeout` 支援 Safari 16+、Chrome 103+，與你目前的 View Transitions 要求相比更寬鬆，不增加相容性門檻。
- **附帶（⚪ 待確認 / 低）**：`runtimeConfig.public.emailjs` 預設三個值都是空字串（`nuxt.config.ts`），註解說「see .env.example」，但 repo 裡**沒有 `.env.example`**（`.gitignore` 有 `!.env.example` 例外，檔案卻不存在）。新環境忘了設環境變數時，表單會一直送出失敗。建議補一個 `.env.example` 列出 `NUXT_PUBLIC_EMAILJS_*` 與 `NUXT_PUBLIC_SITE_URL`。

---

### R5　`font-heading` class 沒有定義　🔴 低～中 → 待你決定

- **面向**：一致性
- **位置**：15 處使用（例：`components/home/Space.vue:120`、`components/home/Contact.vue:17`、`error.vue:37`…）；定義處：**不存在**
- **證據**：`tailwind.config.ts` 的 `fontFamily` 只有 `sans`、`mono`；標題字型是由 plugin 對 `.text-display`、`.text-headline-*` 這幾個**字級 class** 附加 `font-family`（`tailwind.config.ts:85`）。所以 `font-heading` 是**不會產生任何 CSS 的 class**。
- **為什麼多數情況沒出事**：絕大部分用 `font-heading` 的元素同時有 `text-headline-*` 或 `text-display`，標題字型是靠後者套上的，`font-heading` 只是個「看起來有作用」的安慰劑。
- **唯一例外**：`error.vue:37` 的 404 巨大空心數字用 `font-heading text-[clamp(10rem,34vw,26rem)]`——它**沒有** `text-headline-*`，所以實際渲染的是 Inter（`sans`），不是 Barlow。如果你的設計意圖是 Barlow，這是個小視覺 bug。
- **建議**（三選一，**會不會改視覺要你決定**）
  - **A. 讓 `font-heading` 真的存在**：`fontFamily: { heading: [HEADING_FONT] }`。其他 14 處視覺不變（它們本來就是 Barlow）；`error.vue` 的 404 數字會從 Inter 變 Barlow。
  - **B. 把 class 全部拿掉**：視覺零變化，但 `error.vue` 要改用別的方式指定字型。
  - **C. 維持現狀**：承認它是無作用 class。
- **推薦**：A，同時搭配 R9 把 `HEADING_FONT` 抽成 CSS 變數。**因為你要求保留視覺，404 數字字型這一點請你決定**。

---

### R6　沒有自動化防線；依賴與環境衛生　🟡 中 → 工具立即、測試後續

- **面向**：可測試性、可維護性、簡潔性
- **證據**
  - `package.json` 的 scripts 只有 `build / dev / generate / preview / postinstall`，**沒有 lint、typecheck、test**。
  - `gsap`（`package.json:14`）：`grep` 全專案 `app/ server/ nuxt.config.ts` **零個 import**。`PROGRESS.md` 還寫著「`v-reveal` 在 `plugins/gsap.ts`」，現在 `v-reveal` 已改成 IntersectionObserver + WAAPI（`plugins/reveal.ts`）。
  - `better-sqlite3`（`package.json:11`）：`nuxt.config.ts:31` 已設 `nativeSqlite: true`，註解還寫「avoids native better-sqlite3」。⚪ 是否仍被 `@nuxt/content` 當 peer / fallback 需要，要實測移除後 `npm run build` 是否通過。
  - 沒有 `engines` 欄位、沒有 `.nvmrc`，但 `nuxt.config.ts` 註解說明需要 Node ≥ 22.5（`node:sqlite`）。
  - **內容與程式不一致**：`app/data/home.ts` 的「核心技術」寫「Three.js、GLSL Shader 與 **GSAP**」，但這個站本身已沒有用 GSAP。個人專案可能有用，所以我標 ⚪，請你自己確認這句話是否仍正確——這是面試時會被問到的內容。
- **為什麼要改**：沒有型別檢查，`.vue` 檔裡的型別錯誤永遠沒人會發現（我跑的 `tsc` 只涵蓋 `.ts`）。沒有 lint，R3 這種「寫死字串」也沒人攔。依賴放著不用，會增加 `npm install` 時間、安全更新噪音，也會被面試官用 `package.json` 反推你的技術判斷。
- **建議**（全部不改任何現有程式碼）
  1. 加 `nuxt typecheck`（需裝 `vue-tsc`）當 script，這是官方做法。
  2. 加 `@nuxt/eslint`（官方預設規則，幾乎零設定）。
  3. 補 `engines: { "node": ">=22.5" }` 與 `.nvmrc`。
  4. 補 `.env.example`。
  5. 移除 `gsap`（確認 About 文案後）；`better-sqlite3` 在分支驗證 build 後再決定。
- **副作用**：第 2 項首次執行會噴一批既有警告，要分批處理，不要一次全修。
- **推薦**：先做 1～4，風險為零；5 要你確認。

---

### R7　站台網址、SEO meta、JSON-LD 作者名重複　🟡 中 → 後續

- **面向**：可維護性、一致性
- **位置與原始碼**

  `String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')` 一模一樣出現在：

  - `composables/useData.ts:47`
  - `layouts/default.vue:20`
  - `pages/blog/[...slug].vue:30`
  - `pages/projects/[slug].vue:56`
  - （`nuxt.config.ts:10` 也有一份，但那裡在 config 層級，合理）

  `useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: usePageUrl() })` 這條近乎相同的呼叫出現在 **8 個頁面**（`index.vue:12`、`projects/index.vue:8`、`blog/index.vue:10`、`experience.vue:7`、`contact.vue:10`、`legal/[slug].vue:10`、`blog/[...slug].vue:32`、`projects/[slug].vue:58`），其中 6 個連 `` `${x} | Elio Lee` `` 的標題組法都一樣（`grep "| Elio Lee"` 8 筆）。

  JSON-LD 的作者 `{ name: '李柏偉', alternateName: 'Elio Lee' }` 在 `index.vue:19`、`projects/[slug].vue:62`、`blog/[...slug].vue:55` 各寫一次，而 `data/site.ts` 的 `name` 已經是 `'李柏偉 Elio Lee'`。
- **問題**：想把網站名稱 `| Elio Lee` 改成別的、或改 JSON-LD 作者，要改 8 + 3 處；漏一處就不一致，而且**不會有任何錯誤提示**。
- **為什麼要改**：這是「改一個需求要改多處」的典型。但注意 **「8 個頁面都呼叫 useSeoMeta」本身不是問題**，每頁各自宣告自己的 title / description 是正確的；重複的是「周邊的固定部分」。
- **建議**：先用已安裝的東西，**不要自己寫**——`@nuxtjs/sitemap` 依賴的 `nuxt-site-config` 已經提供 `useSiteConfig()`（⚪ 請確認此專案可直接 auto-import），而且你已經在 `nuxt.config.ts` 設了 `site: { url, name }`。

  ```ts
  // 方案 A：只收斂「站台網址」，最小改動
  const { url } = useSiteConfig()      // 取代 4 處手寫 replace(/\/$/, '')

  // 方案 B：再加一層薄封裝，收斂 title 後綴與 og:*
  export function usePageMeta(o: { title: string; description: string; type?: 'website' | 'article'; image?: string }) {
    const title = `${o.title} | Elio Lee`
    useSeoMeta({ title, description: o.description, ogTitle: title, ogDescription: o.description,
      ogType: o.type ?? 'website', ogUrl: usePageUrl(), ogImage: o.image, twitterImage: o.image })
  }
  ```
- **方案比較**

  | | A 只用 `useSiteConfig` | B `usePageMeta` | C Nuxt `titleTemplate` |
  |---|---|---|---|
  | 解決站台網址重複 | ✅ | ✅ | ❌ |
  | 解決 `\| Elio Lee` 重複 | ❌ | ✅ | ✅ |
  | 新增程式碼 | 0 行（只刪） | ~10 行 | 1 行設定 |
  | 風險 | 低 | 低 | 首頁 title 組法不同，需例外處理 |

  推薦 **A + C 的組合**：先 A（刪除重複、不新增程式碼，符合「別為共用而共用」），title 後綴用 `titleTemplate`；`usePageMeta` 等 A、C 做完後若仍覺得重複再決定。
- **副作用**：`titleTemplate` 會影響所有頁面標題，改完要逐頁看 `<title>`。`error.vue` 目前自己拼 `` `${code} | Elio Lee` ``，要同步調整。
- **效益**：改站名 / 網域時改動點從 11 處降到 1～2 處。

---

### R8　按鈕 / chip / 石板卡片：同視覺多份實作　🟡 中 → 後續

- **面向**：一致性、可維護性

#### 8a. 按鈕：6 份 `const btn = '...'`

| 位置 | padding |
|---|---|
| `components/home/Space.vue:62`、`components/home/Contact.vue:8`、`error.vue:28` | `px-6 py-3` |
| `components/experience/ResumeCta.vue:8` | `px-5 py-3` |
| `pages/contact.vue:24` | `px-5 py-2.5` |
| `components/layout/ConsentBanner.vue:7` | `px-4 py-2` |

再加上配色字串 `'bg-lab-signal text-lab-bg hover:bg-white'`（主要）與 `'border border-white/25 text-white hover:border-white'`（次要）在 6 處重複貼上，連 `contact.vue:140` 與 `Contact.vue:24` 的「次要鈕 hover 變橘」也是兩個略不同的版本。

**問題**：品牌主按鈕要改 hover 色，要改 6 份字串；而且 4 種 padding 是刻意的設計還是複製貼上時的漂移，現在沒有人說得清。

#### 8b. chip：3 套實作

1. `components/ui/Chip.vue`：6 種 tone，**實際只用到 1 種**（`secondary`，在 `blog/[...slug].vue:81` 與 `StackMatrix.vue:31`）。
2. `main.css:79-80` 的 `.lab-chip`、`.lab-chip-light`：全專案使用 11 處。
3. `blog/[...slug].vue:95` 直接寫 `rounded bg-surface-container px-2 py-0.5 …` 的 `<li>` 標籤；`RoleCard.vue:23` 又是另一套 `rounded-full bg-surface-container-low px-2.5 py-1`。

視覺上這些都是「小標籤」，內部卻是四種寫法。

#### 8c. 石板卡片：3 份

`border-t-8 border-[#3A3833] bg-lab-bg-raise …` 這組「石板」出現在 `Principles.vue:17`、`ResumeCta.vue:14`、`contact.vue:121`（註解還寫著「the same stone as the experience page」，說明作者知道是同一個東西，只是沒有名字）。

- **建議**：**用 CSS component class，不要做 Vue 元件**，沿用你已經有的 `.lab-chip` 模式。

  ```css
  /* main.css @layer components */
  .btn { @apply inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors motion-reduce:transition-none; }
  .btn-primary { @apply bg-lab-signal text-lab-bg hover:bg-white; }
  .btn-outline { @apply border border-white/25 text-white hover:border-white; }
  .lab-slab { @apply border-t-8 border-[#3A3833] bg-lab-bg-raise; }
  ```
  ```diff
  - <NuxtLink :class="[btn, 'bg-lab-signal text-lab-bg hover:bg-white']">
  + <NuxtLink class="btn btn-primary px-6 py-3 text-body-md">
  ```
- **方案比較**

  | | CSS class（推薦） | `UiButton.vue` 元件 |
  |---|---|---|
  | 改動量 | 小：替換字串 | 大：要處理 `<a>` / `<NuxtLink>` / `<button>` 三種標籤的多型 |
  | 與現有慣例一致 | ✅ 已有 `.lab-chip` | ❌ |
  | 能強制 props 型別 | ❌ | ✅ |
  | 風險 | 低 | 多型元件容易寫得比被取代的程式碼更複雜 |

  推薦 CSS class：這裡的需求只是「共用外觀」，不是「共用行為」。
- **chip 的建議**：決定以 `.lab-chip` / `.lab-chip-light` 為唯一來源；`UiChip` 若維持只有 `secondary` 一種用法，就把另 5 種 tone 刪掉（YAGNI），或整個換成 class。
- **⚠️ 要先問你的事**：4 種 padding 與兩種 chip 圓角，**統一會造成肉眼可見的細微差異**。你要求保留視覺，所以第一步應該是「**用修飾 class 保留每個現有尺寸**」（`.btn-lg` = `px-6 py-3` 等），不統一；統一尺寸是之後另外決定的事。
- **效益**：改品牌按鈕外觀從 6 處變 1 處。
- **副作用**：Tailwind 的 `@apply` 在 `@layer components` 內會產生新 class，權重低於 utility，所以頁面上額外加的 utility（如 `px-6`）仍能覆蓋，行為符合預期。

---

### R9　Design Token 外洩　🟡 中 → 後續

- **面向**：一致性
- **你的做法本身是好的**：`theme.css` 把「跟著主題變」的顏色做成 CSS 變數、Tailwind 讀變數，這個分層正確。問題是**不跟主題變的品牌色與字型**沒有同等待遇。
- **證據**

  | 項目 | 重複位置 |
  |---|---|
  | 品牌橘 `#ff5b1f` / `rgb(255 91 31 / x)` | `main.css:41,42,54-56,218`、`About.vue:81,82,97`、`Space.vue:234`、`experience.vue:111,116`、`Monument.vue:27,34,39,40`、`space-scene.ts:65`（`SIGNAL`），`tailwind.config.ts`（`lab.signal`）。`main.css:9` 明明已經有 `--lab-signal`，但 **`rgb(255 91 31 / 0.14)` 這類帶透明度的寫法 CSS 變數表達不了**（因為它存的是 `#hex`，不是通道值），所以大家只好硬寫 |
  | 標題字型堆疊 `Barlow, 'Noto Sans TC', 'PingFang TC', …` | `tailwind.config.ts:26`、`main.css:67`、`:77`、`:103`（共 **4 份**，內容目前一致） |
  | 石板色 `#3A3833`、`#12110F` | `Principles.vue:17`、`ResumeCta.vue:14`、`contact.vue:121` |
  | 程式碼區塊底色 `#09090b` | `ProsePre.vue:30` |
  | 3D 場景在亮色主題下的顏色 | `space-scene.ts` 的 `applyTheme`（約 L967 起）寫死 `0xf3f0e9`、`0xb83d0e`、`0xd2cbc0`…，對應的是 `theme.css` 的 `--c-background`、`--c-signal-ink`。**改了 CSS，3D 場景不會跟著變** |
  | 時間軸顏色 | `experience.vue:111-116` 的 `#ff5b1f`、`#b9b3a6`、`rgb(122 116 104 / 0.38)` |
- **為什麼要改**：這是「全站換個橘色」時一定會漏的那種東西，尤其 3D 場景那份在 JS 裡，用全域搜尋 `#ff5b1f` 都找不到（它寫成 `0xff5b1f`）。
- **建議**：不要一次做完，先做收益最大的兩個。
  1. **標題字型**：`theme.css` 加 `--font-heading: Barlow, …`，Tailwind、`.lab-eyebrow`、`.space-title`、`.prose-post` 都引用它（順便解決 R5）。
  2. **品牌橘通道值**：`--lab-signal-rgb: 255 91 31;`，需要透明度的地方寫 `rgb(var(--lab-signal-rgb) / 0.14)`。
  3. 3D 場景那份：可在 `applyTheme` 內用 `getComputedStyle(document.documentElement).getPropertyValue('--c-background')` 讀值，**但這會增加每次切主題的版面讀取，且要處理 `"243 240 233"` 空白分隔的格式**，所以我標「可選，後續」。
- **副作用**：全是等值替換，視覺不應有變化；每換一處要用截圖比對。
- **維持現狀的部分**：`About.vue` 的 `.archive-axis` 用固定橘（`rgb(255 91 31 / 0.14)`）而不是 `--c-primary`，在亮色主題會比 `--c-primary` 亮——這看起來是**刻意**的（`--c-primary` 在亮色是較深的 `#b83d0e`），不是缺陷，但值得補一行註解說明。

---

### R10　`Stage` ↔ `Space` / `About` / `Notes`：暗中耦合與每幀讀版面　🟡 中（⚪ 效能）→ 後續

- **面向**：可維護性、可擴充性、可靠性（效能）
- **位置**：`components/space/Stage.vue:36-72`、`components/home/Space.vue:207`、`About.vue:37`、`Notes.vue:18`
- **現況**：Stage 不是透過 props / emit / provide 與其他元件溝通，而是**用 CSS selector 與 data attribute 在 DOM 裡找人**：

  ```ts
  const wrap = host.value?.closest<HTMLElement>('[data-space]')
  wrap?.style.setProperty('--guide-x', info.guideX + 'px')
  const about = wrap?.querySelector<HTMLElement>('#about')
  if (about) about.style.setProperty('--guide-start', Math.max(0, info.guideY - about.getBoundingClientRect().top) + 'px')
  ...
  wrap.querySelector('[data-archive-approach]') / '[data-notes]' / '#works'
  ```
  隱含契約共 5 個：`[data-space]`、`#about`、`#works`、`[data-archive-approach]`、`[data-notes]`，加上兩個 CSS 變數 `--guide-x`、`--guide-start`，分散在 4 個檔案。
- **問題**
  1. **可維護性**：把 `About.vue` 的 `id="about"` 改名，3D 的導引線會**默默失效**（`if (about)` 吃掉了錯誤），沒有任何警告。Space.vue 的 `scroll-mt-0`、About 的 `scroll-mt-20` 也牽涉相同的位置假設。
  2. **效能（⚪ 待實測）**：`onFrame`（每個 3D 幀）呼叫 `about.getBoundingClientRect()`（`Stage.vue:44`），`onScroll` 的 `progress()` 每次捲動呼叫 4 次 `getBoundingClientRect` + 3 次 `querySelector`。`getBoundingClientRect` 在版面已髒時會強制重排。你的 3D 迴圈有 `IntersectionObserver` 在不可見時停止，所以影響限於首頁；是否造成掉幀要用 Chrome Performance 面板實測，**我沒有證據說它造成問題，只是它的成本沒有被量過**。
  3. **可擴充性**：`Stage.vue:103` `featured: p.slug === 'game-together'` 與 `Space.vue:17` `useState('space-selected', () => 'game-together')` 把「第一個專案」的 slug 寫死兩次。第一個專案換了，3D 的 featured 門和預設選取會悄悄指向不存在或不對的專案。
- **建議**（由小到大）
  1. **立即可做、零風險**：資料裡加 `featured?: true` 欄位或約定 `projects[0]`，兩處改為讀資料。
  2. **後續**：把 5 個 selector 集中成**一個具名常數物件**或在 Stage 用 `defineProps` 接收 `HTMLElement` refs（由 `Space.vue` 傳入）。不要為了解耦而引入 Pinia / event bus——一份父→子的 props 就夠。
  3. **選擇性**：先用 Performance 面板錄一次首頁捲動；若沒有長任務，就**不要改**。
- **為什麼不要急著重構**：這 4 個元件是**為同一個頁面設計的一組零件**，耦合是設計的一部分，不是意外。重點不是消除耦合，而是**讓耦合可見、壞了會報錯**。
- **副作用**：改 props 會動到 `Space.vue` 模板；風險在於 3D 與捲動時序，需要手動走完首頁一遍（含手機與 reduced-motion）。

---

## 4. 其他發現（低嚴重度，濃縮格式）

> 為了讓報告可讀，低嚴重度項目用表格；每一項我都能展開成完整的 12 欄格式，告訴我要哪幾項即可。

| # | 問題名稱 | 面向 | 位置 | 現況與問題 | 建議 | 類型 / 嚴重度 | 處置 |
|---|---|---|---|---|---|---|---|
| L1 | 死程式碼：`cjkFiles` 永遠是空陣列 | 簡潔 | `layouts/default.vue:11-13` | `const cjkFiles: string[] = []`，下面還寫了 `locale.value === 'en' ? [] : cjkFiles` 分支，永遠不會執行 | 刪掉 `cjkFiles` 與該分支；`fontFiles` 直接 map | 🟡 低 | 立即（零風險） |
| L2 | 死 CSS：`.home-reading`、`--lab-paper` | 簡潔 | `main.css:120-134`、`main.css:8` | `grep` 全專案沒有任何模板使用 `home-reading`；`--lab-paper` 也沒人引用 | 刪除（刪前再 grep 一次） | 🟡 低 | 立即 |
| L3 | 重複 / 覆蓋的 CSS 規則 | 可讀性 | `About.vue:93,118`（`.archive-trigger` 兩次）、`Notes.vue:55,79`（`.notes-record margin-bottom` 1rem 後又 1.5rem）、`Notes.vue:64`（`position: relative` 另起一條） | 後面的規則覆蓋前面的，改前面那條沒效果，是「改了沒用」的陷阱 | 合併成一條 | 🟡 低 | 後續 |
| L4 | `UiChip` 6 種色調只用 1 種 | 簡潔 | `ui/Chip.vue:2-9` | `primary / solid / deep / tertiary / neutral` 沒有任何使用處 | 見 R8b | 🟡 低 | 後續 |
| L5 | 彈簧常數與物理在兩處重複 | 可維護 | `plugins/elastic.ts:13-14`、`ui/MagnetText.vue:41-42` | 兩處都是 `STIFFNESS = 170`、`DAMPING = 9`，註解逐字相同，彈簧積分公式也相同 | 如果之後要調「手感」，抽成 `lib/spring.ts`；**現在不抽也可以**，只有兩處 | 🔵 | 維持現狀（有第 3 處時再抽） |
| L6 | `MagnetText` 讀寫交錯 | 可靠性（效能） | `ui/MagnetText.vue:65-84` | 在同一個 `forEach` 裡，每個字元先 `getBoundingClientRect()`（讀）再寫 `style.transform`（寫），N 個字元就交錯 N 次，可能觸發 N 次強制重排 | 兩個迴圈：先全部讀、再全部寫。**只在 `dirty` 時（滑鼠在附近）才跑，字數約 20 字，影響大概有限** | ⚪ 待實測 | 後續（先量測） |
| L7 | `v-reveal` 可能在水合時閃一下 | 可靠性 | `plugins/reveal.ts:23-37`、`getSSRProps: () => ({})` | SSR 輸出的元素是可見的；`mounted` 才把它設為隱藏再動畫進場。若元素在首屏內，會有「可見 → 消失 → 淡入」。目前用法 6 處，多數在首屏外；`experience.vue:81` 的第一張卡片可能在首屏邊緣 | 實際用手機慢速網路錄影確認。若真有閃爍，可在 SSR 階段加 `style="opacity:0"` + `<noscript>` 例外，但那會讓無 JS 時看不到內容，要權衡 | ⚪ 待確認 | 先確認 |
| L8 | `AppCursor` 每次 pointermove 都 `querySelector('dialog[open]')` | 效能 | `layout/AppCursor.vue:62` | 每次滑鼠移動做一次 DOM 查詢；專案裡真正用 `<dialog>` 的只有 contact 頁 | 可改成監聽 dialog 的 `toggle` 事件維護一個旗標；**但 querySelector 對這麼小的 DOM 很便宜，影響極小** | 🔵 | 維持現狀 |
| L9 | `Lightbox` 手刻焦點陷阱，contact 用原生 `<dialog>` | 一致性 | `project/Lightbox.vue:22-34,41-55` vs `pages/contact.vue:30-37` | 同樣是 modal，一個手刻 Tab 陷阱、`body.style.overflow`、Esc；另一個交給 `<dialog>.showModal()`。手刻版**目前行為正確**（我檢查了 Esc、Tab 循環、焦點還原、卸載清理），但維護成本較高；且 `Lightbox` 只攔 `button`，若之後放進連結就攔不到 | 若改 `<dialog>`，要重新驗證觸控滑動、`AppCursor` 的 `dialog[open]` 分支（那段邏輯其實是為了這種情況而寫的）。**可改可不改** | 🔵 | 維持現狀，列為選配 |
| L10 | Lightbox 預載圖片沒有留住參照 | 可靠性 | `project/Lightbox.vue:67-69` | `const pre = new Image(); pre.srcset = ...` 之後 `pre` 離開作用域。多數瀏覽器仍會完成下載，但規格上未保證不被 GC 中止 | 把預載物件放進模組層 `Set`，載入完成再移除。**⚪ 沒有實測證據顯示失效，優先度低** | ⚪ | 後續 |
| L11 | `Principles` 寫死 3 欄高度 | 可擴充 | `experience/Principles.vue:18` | `['md:min-h-[15.5rem]', 'md:min-h-[19.5rem]', 'md:min-h-[23rem]'][i]`：只要 `principles` 資料變成 4 筆，第 4 筆 `undefined`（沒有高度，階梯形斷掉）；且 Tailwind 需要完整字串才能掃描，所以寫在陣列裡是對的 | 在資料型別上約束長度為 3（`[P, P, P]` tuple），或改成 `i`-based CSS | 🟡 低 | 後續 |
| L12 | `experience.vue` 以 `classList.toggle` 直接改 Vue 渲染的元素 | 可靠性 | `pages/experience.vue:34-37` | 手動對 Vue 管理的 `<section>` 加減 `is-on` / `is-current`。目前能運作，因為這些 section 的 `class` 是靜態的，Vue 不會在重繪時重寫；**但只要有人把該 section 的 class 改成動態綁定，這些手動 class 就會被覆蓋** | 加一行註解說明這個限制；或改成 `ref` 陣列＋響應式狀態。**不要為此重寫** | 🔵 | 維持現狀＋註解 |
| L13 | `topicKey` 靠中文標籤的位置反查 key | 可靠性 | `pages/contact.vue:14` | `['job','tech','correction','other'][topics.indexOf(label)]`：依賴 `contact.topics` 陣列順序與這個硬編碼陣列一致，翻譯人員重排選項就會把資料算到錯的 key（只影響分析報表，不影響功能） | 讓 `<select>` 的 `value` 直接用 key | 🟡 低 | 後續 |
| L14 | 內容集合名稱在三處各自推導 | 可維護 | `composables/useData.ts:35-44`、`server/api/__sitemap__/urls.ts:10`、`content.config.ts` | `blog_en` 這類字串在 3 個檔案各寫一次；新增語言要改 3 處 | 只有 3 種語言，**不建議現在抽**；若新增第 4 種語言再統一 | 🔵 | 維持現狀 |
| L15 | 首頁「最新筆記」與筆記列表的查詢重複 | 可維護 | `home/Notes.vue:12-14`、`pages/blog/index.vue:14` | 兩處都是 `queryCollection(c).select(5 個欄位).where('draft','=',false).order('date','DESC')`，差別只在 `.limit(3)` | 兩處而已，**先維持現狀**；第三處出現再抽成 `useNoteList({ limit })` | 🔵 | 維持現狀 |
| L16 | 註解語言中英混用 | 一致性 | `space-scene.ts`（中文教學註解含 `〔泛型〕` 說明）、`data/*`、`useData.ts`（中文）；其餘多為英文 | 閱讀時要切換語言；`space-scene.ts` 的教學註解對你自己有價值，但若面試官看原始碼會覺得是筆記而非註解 | 在 §6 規範裡**選一個**：例如「為什麼 → 英文；學習筆記 → 中文且放 `docs/` 或 PROGRESS.md」。**不需要回頭統一** | 🔵 | 訂規範即可 |
| L17 | 資料型別有疑似未使用的欄位 | 簡潔 | `data/home.ts` 的 `projects[].no`、`side.icon/title`、`detail.scope`、`challenges[].label` | 全專案 `grep` 找不到 `p.no`（專案層級）、`detail.scope`、`c.label` 的讀取；`side.items` 只在無 `features` 時作 fallback | ⚪ 先確認是否有保留用意（`detail.scope` 註解寫「尚未提供」），再決定是否刪 | ⚪ | 先確認 |
| L18 | `<script setup>` 內在 `onMounted` 裡註冊 `onBeforeUnmount` | 一致性 | `AppHeader.vue:60`、`projects/[slug].vue:51`、`blog/[...slug].vue:24`、`experience.vue:57`、`AppCursor.vue:90`、`MagnetText.vue:106` | 6 個檔案採此寫法，其餘（`Stage.vue`、`About.vue`、`PostToc.vue`）則在頂層註冊。**兩者都正確**——Vue 在 mounted hook 執行期間仍保有當前實例——只是風格不一 | 選一種寫進規範；建議「在 `onMounted` 內才有的資源，就在同一處註冊清理」，現狀可接受 | 🔵 | 維持現狀 |
| L19 | JSON-LD 以 `innerHTML: JSON.stringify(...)` 注入 | 可靠性（安全） | `index.vue:16`、`projects/[slug].vue:62`、`blog/[...slug].vue:45` | 若字串內容含 `</script>` 可能提早結束標籤。目前資料全是第一方、你自己寫的，**風險極低**；blog 文章的 `title/description` 來自 frontmatter，同樣是你自己控制 | 若要保險，把 `<` 轉成 `<`；或確認 `unhead` 的版本是否已自動轉義 | ⚪ | 低優先 |
| L20 | 標題層級跳級 | 一致性（a11y） | `experience/ResumeCta.vue:18`（`h3`）緊跟在 `Principles` 的 `h2` 區塊後，但自己不在任何 `h2` 之下 | 螢幕閱讀器的標題導覽會看到 `h2 → h3` 沒有明確從屬。很輕微 | 改 `h2` | 🔵 | 後續 |

---

## 5. 目前值得保留的良好設計

這一節不是客套。審查原則是「合理的實作要說明為什麼該保留」。

| 設計 | 位置 | 為什麼好 / 為什麼不該動 |
|---|---|---|
| **3D 場景的資源回收完整** | `lib/space-scene.ts` 的 `dispose()`、`track()`、`textures` | 有登記表、取消 rAF、移除全部監聽與 observer、`forceContextLoss`、**非同步貼圖在 dispose 後才載完會自行釋放**（`if (disposed) return tex.dispose()`）。這是多數 three.js 專案漏掉的細節。不要為了「拆小函式」動它 |
| **漸進降級路徑** | `Stage.vue` 的 `capable()`、`Monument.vue`、`webglcontextlost` 處理 | 低記憶體 / Save-Data / 無 WebGL / 手機都有 SVG 備援，而且 3D 與 SVG **共用 `lib/ruin.ts` 同一份方塊資料**，不會漂移 |
| **指令的清理契約** | `plugins/reveal.ts`、`plugins/elastic.ts` | `unmounted` 對應的 observer / 動畫 / 事件 / rAF / timer 全部清；`getSSRProps` 避免 SSR 警告；reduced-motion 時直接略過 |
| **主題切換無水合不一致** | `nuxt.config.ts` 的 inline script ＋ `ThemeToggle.vue` 以 CSS 控制圖示 | 首繪前就決定主題，避免閃爍；圖示用 CSS 而不是 `v-if`，SSR 與客戶端 HTML 相同；`aria-pressed` 用 `mounted` 旗標避免 mismatch。註解把理由寫清楚了 |
| **三語資料以型別約束同形狀** | `data/en/home.ts` 的 `typeof zh.hero` | 翻譯檔少一個欄位、多一個欄位，編譯期就報錯。**這是你專案裡最值得向面試官炫耀的型別設計之一** |
| **同意機制先於分析** | `useConsent.ts`、`useAnalytics.ts`、`analytics.client.ts` | 預設不載 GTM；`localStorage` 全部 try/catch；`track()` 每次直接讀儲存值，避免與 banner 的 `restore()` 競態（註解有講）；撤回時清 `_ga` cookie（含父網域變體） |
| **聯絡表單用原生 `<dialog>`** | `pages/contact.vue` | 焦點陷阱、Esc、焦點還原由瀏覽器處理；honeypot；`aria-invalid` / `aria-describedby` 完整；Esc 在送出中被擋是有意識的設計 |
| **內容 schema 以 zod 約束** | `content.config.ts` | `category` 是 enum，打錯分類編譯 / 建置就失敗；`draft` 預設 `false`；`updated` 與 `date` 分離並餵給 JSON-LD 與 sitemap |
| **無不必要的狀態管理 / 工具庫** | 全專案 | 沒有 Pinia、沒有 lodash、沒有動畫庫（除了未使用的 gsap）；共享狀態只用 `useState` |
| **頁面轉場的「為什麼」註解** | `plugins/page-transition.client.ts` | 解釋為何不用 popstate、為何要在結束時取消所有動畫（pseudo-element 動畫會污染下一次轉場）。這是踩過坑才寫得出來的註解 |
| **i18n 鍵值零漂移** | `i18n/locales/*.json` | 我實測三份各 170 鍵、完全對應；建議保持並讓 CI 擋住（見 §7） |

---

## 6. 建議建立的開發規範

> 以下是「寫下來、讓未來的你與 AI 都遵守」的規則，不需要新增程式碼。

1. **新增內容**：`content/blog/<slug>.md` 新增時，必須同時有 `en/`、`ja/` 同名檔，或 zh 版標 `draft: true`。
2. **可見文字**：模板內的可見文字與 `aria-label` 一律走 `$t()`；唯一例外是品牌 / 技術名詞（`GitHub`、`Nuxt`）。
3. **顏色**：新增顏色先找 `theme.css`（跟主題變）或 `--lab-*`（不跟主題變）；不允許在 `.vue` 裡新增 `#hex` 或 `rgb(…)` 字面值，除非附上註解說明為何不能用 token。
4. **共用外觀**：同一個視覺（按鈕 / chip / 石板）出現第 3 次時才抽成 class；不到 3 次不抽。
5. **頁面 meta**：新頁面走統一的 meta 封裝（R7 完成後），不直接貼 `useSeoMeta` 的整串。
6. **事件與計時器**：任何 `addEventListener` / `setTimeout` / `requestAnimationFrame` / `IntersectionObserver` / `ResizeObserver` 都要在同一個元件內找得到對應的清理。
7. **DOM 查詢**：不在元件內用 `querySelector` 或 `closest` 找「別的元件」的 DOM；若非用不可，把 selector 集中成具名常數並註明對方檔案。
8. **註解語言**：對外說明（為什麼這樣做）用英文；學習筆記用中文且放在 `PROGRESS.md` / `docs/`，不放在程式碼註解裡。
9. **頁面目錄**：`app/pages/` 下每個檔案都是公開路由；實驗用頁面放在 `.gitignore` 的目錄（例如 `app/pages/_scratch/` 搭配忽略規則，或 playground repo）。
10. **新依賴**：加依賴前先過一遍「stdlib → 已安裝套件 → 新套件」；移除功能時，同步檢查 `package.json`。

---

## 7. 可以交給工具強制驗證的規則

> 這是回答你最後一個要求。每一條都標了「它能擋下本報告的哪一項」。

| 工具 | 規則 / 設定 | 能擋什麼 |
|---|---|---|
| **vue-tsc**（`nuxt typecheck`） | CI 跑 `nuxt typecheck` | 擋 `.vue` 內的型別錯誤（目前完全沒人檢查）；`data/en`、`data/ja` 與 zh 不同形狀 |
| **@nuxt/eslint** | `vue/no-unused-vars`、`@typescript-eslint/no-unused-vars` | L1 `cjkFiles` 這類死程式碼 |
| **@intlify/eslint-plugin-vue-i18n** | `no-raw-text`（模板寫死字串）、`no-missing-keys`、`no-unused-keys`、`no-dynamic-keys` 警告 | **R3 三處硬編碼**；也能驗證 `$t(\`categories.${p.category}\`)` 之類的動態鍵 |
| **eslint-plugin-vue** | `vue/no-v-html`（已經沒用到，但鎖住）、`vue/require-default-prop` | 防止未來引入 XSS 面 |
| **stylelint**（可選） | `color-no-hex` 搭配只允許 `theme.css` 例外；`declaration-block-no-duplicate-properties` | R9 新增硬編碼色碼；L3 重複宣告 |
| **自寫小腳本**（`scripts/check-content-parity.ts`） | 比對 `content/blog`、`content/en/blog`、`content/ja/blog` 檔名；比對 `i18n/locales/*.json` 鍵值 | **R2**，以及 i18n 鍵值漂移 |
| **knip**（可選，`npx knip`） | 偵測未使用的依賴 / 匯出 / 檔案 | R6 `gsap`；L2 死檔案；`pages/test.vue` 這類孤兒檔 |
| **Vitest + `@nuxt/test-utils`** | 見下方「值得測的核心邏輯」 | 可測試性 |
| **Playwright**（可選，少量） | 見下方 E2E | 語言切換、表單、主題 |

### 7.1 值得建立測試的核心邏輯（依投資報酬率排序）

| 優先 | 對象 | 類型 | 理由 / 測什麼 |
|---|---|---|---|
| 1 | `scripts/check-content-parity`（R2） | 腳本，CI 直接跑 | 一次寫好，永遠防止「切語言 404」 |
| 2 | `contact.vue` 的 `rules` 與 `check` | 單元（需先抽成可 import 的純函式，或用元件測試） | 空值、email 格式、訊息長度邊界（9 / 10 字元）、`trim` |
| 3 | `MagnetText.vue` 的 `tokens` 計算（斷詞） | 單元 | 純函式（輸入字串與語言、輸出 token 陣列）；中日文標點跟前一字、拉丁字不拆、空白保留 |
| 4 | `CaseDiagram.vue` 的 `fit()` 與 `edges` 標籤位置 | 單元 | 純數學；日文超長標籤縮字邏輯有邊界 |
| 5 | `lib/ruin.ts`：`ruinBlocks()`、`hash()` | 單元 | 確定性（同輸入同輸出）、不重疊、`GATE` 內無方塊；它是 3D 與 SVG 共用的資料源，**壞了兩邊一起壞** |
| 6 | `useData` / `useBlogCollection` | 單元 | 三種 locale 回傳正確 collection 名；缺語系資料時 `withCaptions` 退回中文 |
| 7 | `useConsent`、`useAnalytics.track` | 單元 | localStorage 拋例外（隱私模式）時不爆；未同意時 `dataLayer` 不被推入；撤回時 cookie 清除 |
| 8 | E2E：語言切換、主題切換、聯絡表單送出（mock EmailJS）、首頁無 WebGL 時顯示 SVG | Playwright | 這些是「整合後才會壞」的路徑 |
| **不建議測** | `space-scene.ts` 的場景佈置 / 材質 | — | 結果是視覺，單元測試很難說明什麼；用手動 + 截圖比對即可。若要測，只測抽出來的純數學（`contour()`、彈簧積分） |
| **不建議測** | `elastic.ts`、`reveal.ts` | — | 與瀏覽器 API 深度耦合，mock 成本高於價值；人工驗證即可 |

---

## 8. 建議的分階段重構計畫

每個階段都**可以獨立停下**，不會留下半成品。

### 階段 0：衛生清理（約 1～2 小時，零視覺風險）

| 工作 | 對應 |
|---|---|
| 刪除 `pages/test.vue`（或改寫成筆記） | R1 |
| ~~補 `nav.menu` 等 i18n 鍵，替換 3 處英文~~ ✅ | R3 |
| ~~contact 送出加 `AbortSignal.timeout`~~ ✅ | R4 |
| ~~補 en / ja 兩篇文章~~ ✅（防線腳本仍待做，見階段 1） | R2 |
| 刪 `cjkFiles`、`.home-reading`、`--lab-paper` | L1、L2 |
| `package.json` 補 `engines`；補 `.nvmrc`、`.env.example` | R6 |

**驗證**：`nuxt build` 通過；手動走一次三語切換 + 手機選單 + 聯絡表單。

### 階段 1：加上防線（約半天，不改既有程式碼）

| 工作 | 對應 |
|---|---|
| 安裝並設定 `@nuxt/eslint`、`vue-tsc`（`nuxt typecheck`） | R6 |
| 加 `scripts/check-content-parity.ts` 與 i18n 鍵值檢查 | R2、§7 |
| `package.json` 補 `lint`、`typecheck`、`check:content` scripts | R6 |
| 首次 lint 的既有警告**只記錄，不一次修** | — |

**驗證**：三個指令都能跑；把 `Close` 還原成硬編碼，確認 lint 會紅燈（證明防線有效）。

### 階段 2：收斂重複（約 1 天，需截圖比對）

| 工作 | 對應 | 風險 |
|---|---|---|
| 用 `useSiteConfig()` 取代 4 處手寫站台網址 | R7 方案 A | 低 |
| 決定 `font-heading` 方案；抽 `--font-heading` | R5、R9-1 | 低；404 數字字型要你決定 |
| 抽 `.btn` / `.btn-primary` / `.btn-outline` / `.lab-slab`（**保留每個現有尺寸**） | R8 | 中；逐頁截圖比對 |
| `--lab-signal-rgb` 通道值；替換 CSS 內的橘色字面值 | R9-2 | 低 |
| 刪除未使用的依賴 `gsap`（先確認 About 文案） | R6 | 低 |

**驗證**：每個子步驟一個 commit；用瀏覽器的亮 / 暗主題各截首頁、案例頁、經歷頁、聯絡頁比對。

### 階段 3：讓耦合可見（約半天，先量測再決定）

| 工作 | 對應 |
|---|---|
| 把 `'game-together'` 兩處寫死改為讀資料 | R10-1 |
| Chrome Performance 錄一次首頁捲動；**若無長任務就停在這裡** | R10-3、L6 |
| 若需要：把 Stage 的 5 個 selector 集中成常數並加「找不到就 `console.warn`」 | R10-2 |

### 階段 4：測試（持續進行）

依 §7.1 的順序，一次補一個，**每個測試都要能說出「它擋的是哪一類 bug」**。第 1～3 項做完，就已經比大多數作品集專案更有防護。

### 階段 5：選配（有餘力再說）

- `Lightbox` 改用原生 `<dialog>`（L9）
- 3D 場景主題色改由 CSS 變數讀取（R9-3）
- `createSpaceScene` 把純數學（`contour`、彈簧、鏡頭軌道）抽出以便測試——**前提是你真的要寫測試**，否則不動

---

## 9. 審查結論與下一步

### 如果只做三件事

1. **刪 `pages/test.vue`**（5 分鐘，消除唯一一個「別人會看到半成品」的缺陷）。
2. **補兩篇文章的 en / ja，並加內容對照腳本**（防止切語言 404 再發生）。
3. **加 ESLint + `nuxt typecheck`**（讓這份報告裡的大部分問題未來自動被抓到）。

### 我刻意**沒有**建議改的東西

- **`createSpaceScene` 單一 800 行函式**：它是一個有明確生命週期、內部高度共享閉包狀態（camera、progress、focused…）的模擬迴圈；硬拆成多個檔案只會把閉包變成一堆要傳來傳去的參數。除非你要為它寫測試，否則不動。
- **`elastic.ts`（321 行單檔）、`MagnetText.vue`**：都是自成一體、清理完整的互動，沒有被別處重用；拆分不會帶來可見效益。
- **About / Notes 的 scoped CSS 風格**（與其他頁用 Tailwind utility 不同）：這是「這兩個元件的視覺是高度客製的」造成的，不是不一致的疏忽。要統一的是**顏色與字型的來源**（R9），不是寫法。
- **`useData()` 回傳非響應式物件**：註解說明了原因（切語言會換路由、頁面重建），而且 `Header` / `Footer` 這種常駐元件用 `t()`，分工清楚。
- **每頁各自呼叫 `useSeoMeta`**：重複的是周邊固定部分（R7），不是這個呼叫本身。

### 我不確定、需要你補資訊或實測的

| 項目 | 需要 |
|---|---|
| R1：`/test` 是否已在 sitemap | `curl` 線上 `sitemap_index.xml` 一次 |
| R2：hreflang 是否真的輸出到 404 網址 | 開 zh 版那兩篇文章，檢視 `<head>` |
| R5：404 數字應該是 Barlow 還是 Inter | 設計意圖由你決定 |
| R6：`better-sqlite3` 能否移除 | 在分支移除並 `nuxt build` |
| R6：About 文案「GSAP」是否仍屬實 | 你的其他專案是否有用 GSAP |
| L7：`v-reveal` 水合閃爍 | 手機慢速網路錄影 |
| R10-2 / L6：效能是否真有問題 | Chrome Performance 面板 |

---

*本報告只依據我實際讀到的程式碼。凡標 ⚪ 的項目都是因為缺乏執行期證據，請勿當成已確認的缺陷。*

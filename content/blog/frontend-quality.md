---
# AI 草擬的技術說明（不含個人經歷與數據），發布前請審閱並補上自己的實務案例。
title: 前端工程化與品質：測試策略、無障礙與 Web Vitals
description: 測試、自動化驗證、無障礙設計、效能優化與大型專案的維護思維。
date: 2026-10-29
category: quality
tags: [Testing, Accessibility, Web Vitals]
readingTime: 8
---

「品質」不是上線前才補的一道工序，而是讓每次修改都能被驗證、被理解、被安全地回復。這篇整理前端常見的三個面向：測試策略、無障礙，以及效能指標。

## 測試策略：測行為，不測實作

前端測試常見分三層：

| 層級 | 工具範例 | 驗證什麼 | 成本 |
| --- | --- | --- | --- |
| 單元測試 | Vitest | 純函式、工具函式、狀態邏輯 | 低 |
| 元件測試 | Vue Test Utils | 使用者看得到的互動結果 | 中 |
| 端對端測試 | Playwright | 完整流程（登入、下單…） | 高 |

元件測試的原則是「像使用者一樣操作，檢查使用者看得到的結果」，而不是檢查元件內部的變數名稱。這樣重構內部實作時，測試不會跟著壞。

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('點擊按鈕後，顯示的數字加一', async () => {
    const wrapper = mount(Counter)

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('1')
  })
})
```

### Mock 的邊界

Mock 的位置越靠近系統邊界越好：mock 網路請求（例如使用 MSW），而不是 mock 自己的內部函式。內部函式被 mock 掉，測試就只是在驗證 mock 本身。

## 無障礙：從鍵盤開始

最容易檢查、效益也最大的一項是**鍵盤操作**。不用滑鼠，只用鍵盤走過一遍頁面：

- `Tab` 能依合理順序走遍所有可互動元素嗎？
- 目前焦點的位置看得出來嗎？（不要移除 `outline`，改用 `:focus-visible` 自訂樣式）
- 彈窗打開時，焦點有進入彈窗嗎？按 `Esc` 能關閉嗎？關閉後焦點有回到觸發按鈕嗎？
- 用 `<button>`、`<a>`、`<label>` 等語意化元素，而不是在 `<div>` 上綁點擊事件。

```css
:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
```

自動化工具（例如 axe）能抓到缺少 `alt`、對比不足、表單欄位沒有標籤等問題，但無法判斷操作流程是否合理，所以仍需要搭配手動檢查。

## 效能：Core Web Vitals

Google 的 Core Web Vitals 目前有三項，「良好」的門檻是：

| 指標 | 衡量 | 良好 |
| --- | --- | --- |
| LCP（Largest Contentful Paint） | 最大內容多快出現 | ≤ 2.5 秒 |
| INP（Interaction to Next Paint） | 互動後多快有畫面回應 | ≤ 200 毫秒 |
| CLS（Cumulative Layout Shift） | 版面在載入過程中跳動多少 | ≤ 0.1 |

常見的改善方向：

- **LCP**：最大的圖片使用適當格式與尺寸，並提高載入優先權（例如 `fetchpriority="high"`）；減少阻塞渲染的資源。
- **INP**：把長時間執行的 JavaScript 拆小，避免佔住主執行緒。
- **CLS**：圖片與嵌入內容事先指定 `width` / `height`（或 `aspect-ratio`），讓瀏覽器先保留空間。

```html
<img src="/cover.webp" width="1600" height="728" alt="專案封面" fetchpriority="high">
```

## 大型專案的維護思維

- **讓錯誤盡早出現**：TypeScript、ESLint、型別化的 API 回傳，把錯誤擋在編譯與提交階段。
- **小步修改、可回復**：每次變更範圍小，才容易 review，也容易回退。
- **把規則寫成工具**：能由 CI 自動檢查的（格式、型別、測試），就不要靠人記得。
- **留下「為什麼」**：註解與文件記錄決策原因，接手的人才能判斷何時可以改。

## 小結

測試守住「行為」、無障礙守住「每個人都能用」、Web Vitals 守住「用起來順不順」。三者都可以從很小的習慣開始：寫一個行為測試、用鍵盤走一遍頁面、替圖片加上尺寸。

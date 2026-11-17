---
title: Vue 動態表單設計：互斥條件、單組重設與多組資料管理
description: 以獨立設計的商品查詢表單，說明條件切換、資料與驗證重設、穩定 key 與 ref 對應，並比較 Vuetify 2、3 的表單驗證 API。
date: 2026-11-17
category: vue
tags: [Vue 2, Vue 3, Vuetify, Forms]
readingTime: 8
---

動態表單看起來只是依選項顯示不同欄位，但條件一多，需要處理的就不只是畫面。切換方式後，舊資料要不要清除？重設其中一組，會不會影響其他組？刪除中間項目後，驗證訊息還對得上嗎？

這篇用一個自行設計的「多條件商品查詢表單」整理這些問題。使用者可以依上架日期或商品編號查詢，也能新增多組條件。

> 本文情境、資料結構與程式碼皆為獨立教學示意，不對應特定專案的業務流程，也不是完整可執行的 Demo。

## 一、為什麼動態表單需要管理互斥條件

範例中，每組條件只能選擇一種查詢方式：

| 方式 | 使用的資料 | 切換後不再使用的資料 |
| --- | --- | --- |
| 依上架日期 | 日期值與顯示文字 | 商品編號 |
| 依商品編號 | 商品編號 | 日期值與顯示文字 |

可以用 `v-if` 顯示對應欄位，但它只控制元件是否存在，不會替我們清除放在父層物件裡的資料。

如果只切換畫面，送出時又直接使用整個條件物件，就可能把上一次填的值一起送出去。

因此，先定義每組條件的狀態，比先排版更重要。以下示意沿用 Options API，方便比較兩種 Vue／Vuetify 組合：

```js
let nextConditionId = 0

function createCondition() {
  return {
    id: ++nextConditionId,
    mode: null,
    selectedDate: null,
    displayDate: "",
    productCode: "",
    datePickerOpen: false,
  }
}

// 元件的 data()
data() {
  return { conditions: [createCondition()] }
}
```

這些欄位在建立時就完整宣告。每次呼叫都產生新的物件，避免多組條件意外共用同一份資料。這個遞增 ID 只用於單一頁面中的範例識別，不作為資料庫或跨使用者識別碼。

## 二、切換條件時，如何同步重設資料與驗證狀態

切換方式時，保留這組條件的 `id` 與新選擇的 `mode`，其餘內容回到初始狀態。單組重設則連 `mode` 一起清除。

```js
// 以下方法放在元件的 methods 中
clearConditionValues(condition) {
  Object.assign(condition, {
    selectedDate: null,
    displayDate: "",
    productCode: "",
    datePickerOpen: false,
  })
},

async changeMode(condition, newMode) {
  condition.mode = newMode
  this.clearConditionValues(condition)
  await this.$nextTick()
  this.resetConditionValidation(condition.id)
},

async resetCondition(condition) {
  condition.mode = null
  this.clearConditionValues(condition)
  await this.$nextTick()
  this.resetConditionValidation(condition.id)
},
```

`changeMode()` 明確接收並設定新模式，不依賴 `v-model` 與事件的執行順序。例如 Vue 3 的選單可使用 `:model-value="condition.mode"`，搭配 `@update:model-value="changeMode(condition, $event)"`；其他元件則依各自的事件契約傳入新值。

這裡刻意分開「清值」與「重設驗證」。資料變更後，`v-if` 對應的欄位可能需要重新建立，因此等待下一次 DOM 更新，再處理目前存在的欄位元件。`$nextTick` 不會等待 API，也不是所有畫面更新問題的通用解法。

### 資料值與顯示文字不是同一種狀態

假設某個日期元件使用 `Date`，但文字欄位顯示 `YYYY-MM-DD`，就可能需要 `selectedDate` 與 `displayDate` 兩份狀態。這是範例選擇的元件契約，不代表所有日期元件都要求這種做法。

選取日期時，兩者要一起更新；重設時也要一起清除。否則可能出現畫面仍有日期，但查詢資料已清空的情況。

如果顯示文字完全可以從日期值推導，優先用 computed 或格式化函式計算，減少需要手動同步的狀態。只有確實需要獨立的輸入或暫存狀態時，才保留第二份值。

### 驗證 ref 要對應到這一組

下面用條件 ID 與欄位名稱組合 ref，並處理條件渲染後 ref 不存在的情況。範例假設元件提供 `resetValidation()`，實際使用仍需確認元件 API。

```js
resetConditionValidation(id) {
  const fields = ["mode", "selectedDate", "productCode"]

  fields.forEach(field => {
    const ref = this.$refs[`condition_${id}_${field}`]
    const instances = Array.isArray(ref) ? ref : ref ? [ref] : []

    instances.forEach(instance => {
      instance.resetValidation?.()
    })
  })
},
```

這裡只重設目前仍存在、且提供 `resetValidation()` 的欄位元件。切換 `v-if` 後，原本的欄位可能已經卸載；如果驗證狀態另外保存在父層表單或其他狀態管理中，也需要依實際架構同步清除。

模板中的 ref 命名也要配合，例如 `:ref="`condition_${condition.id}_productCode`"`。若實際元件也會驗證日期顯示欄位，就要把那個欄位一起納入。

## 三、多組表單的新增、刪除與穩定 key

新增條件時建立新物件，重設時保留原本 ID，刪除則依 ID 找到目標。

```js
addCondition() {
  this.conditions.push(createCondition())
},

removeCondition(id) {
  const index = this.conditions.findIndex(item => item.id === id)
  if (index !== -1) this.conditions.splice(index, 1)
},
```

模板以穩定 ID 作為 key：

```vue
<div v-for="condition in conditions" :key="condition.id">
  <!-- 條件類型與對應欄位 -->
  <button type="button" @click="resetCondition(condition)">重設條件</button>
  <button type="button" @click="removeCondition(condition.id)">刪除條件</button>
</div>
```

如果使用陣列索引當 key，刪除中間項目後，後面的元件可能被用來顯示另一筆資料。對有內部輸入或驗證狀態的元件，這是需要留意的行為，不代表所有索引 key 都一定造成 Bug。[Vue 列表狀態維護說明](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)

**穩定 key 與 ref 對應需要分別處理。** key 使用 ID，但 ref 若仍叫 `field_0`、`field_1`，刪除後的索引變化還是需要重新管理。因此這個範例讓兩者都以條件 ID 對應。

### 查詢資料依條件類型產生

送出時再做一次明確的資料選擇，避免把介面狀態直接當成查詢內容：

```js
// 範例以本地日曆日期組成 YYYY-MM-DD，不轉換為 UTC
function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("日期無效")
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toQuery(condition) {
  if (condition.mode === "date") {
    return {
      type: "date",
      date: condition.selectedDate ? formatDate(condition.selectedDate) : null,
    }
  }
  if (condition.mode === "code") {
    return { type: "code", code: condition.productCode.trim() }
  }
  throw new Error("請選擇查詢方式")
}
```

這裡以 `selectedDate` 作為日期資料來源，`displayDate` 只負責畫面顯示。`formatDate()` 是範例自行定義的格式化函式，將本地日期轉成 `YYYY-MM-DD`，避免直接轉 UTC 字串時跨日。實際查詢格式與時區仍應依 API 契約決定。

這只是驗證通過後的資料整理示意，不取代必填、格式與日期有效性檢查。後端仍需要驗證收到的查詢內容。

## 四、Vue／Vuetify 不同組合的表單驗證差異

比較 Vue 2＋Vuetify 2 與 Vue 3＋Vuetify 3 時，要分清楚框架與元件庫各自的責任。以下差異來自 Vuetify 表單 API，不是 Vue 響應式機制。

Vuetify 2 的 `validate()` 回傳布林值。以 Vuetify 3.6.13 為例，`validate()` 是非同步函式，完成後回傳包含 `valid` 與 `errors` 的物件。

如果希望填完目前條件才能新增下一組，可以將前面的新增方法分別改成以下寫法：

```js
// Vue 2 + Vuetify 2：示意方法
function addCondition() {
  const valid = this.$refs.form.validate()
  if (!valid) return
  this.conditions.push(createCondition())
}
```

```js
// Vue 3 + Vuetify 3：示意方法
async function addCondition() {
  const { valid } = await this.$refs.form.validate()
  if (!valid) return
  this.conditions.push(createCondition())
}
```

兩段是不同技術組合的替代實作，不放在同一個 methods 裡。也要確認 `form` 指向整張表單還是單組表單，因為這會決定驗證範圍。

直接把 Promise 當成布林值，不能判斷是否通過驗證。回傳型別與使用方式可參考 [Vuetify 2 表單 API](https://v2.vuetifyjs.com/en/api/v-form/) 與 [Vuetify 表單 API](https://vuetifyjs.com/en/api/v-form/)。

條件切換事件也應依元件契約綁定。自訂選單的 `change` 與另一個元件的 `update:modelValue`，不應只因用途相近就視為觸發時機完全相同。

## 五、測試操作順序與開發心得

動態表單不能只測每個欄位能不能輸入，還需要把操作串起來：

- 填入日期，再切換商品編號，確認日期資料與驗證狀態清除。
- 重設其中一組，確認其他組不受影響。
- 新增三組不同資料，刪除中間一組，再操作剩下欄位。
- 重設日期，確認元件值與顯示文字同步清除。
- 驗證失敗時，確認沒有新增或送出。
- 驗證成功後，確認查詢內容只包含目前模式需要的資料。
- 使用鍵盤完成切換、重設與刪除，確認焦點仍能繼續操作。

以上是示例需要驗證的情境，尚不代表已有完整 Demo 或自動化測試成果。

表單開發不只是新增欄位，還需要考慮不同條件之間的關係，以及資料與畫面狀態如何保持一致。

尤其在既有專案中，同一套需求可能需要在不同版本的框架與元件庫上實作。比起直接沿用原本的寫法，先確認各專案的資料結構、元件行為與 API 差異，才能避免把問題帶進新的流程。

---
title: 從一個 TypeError 看 hasOwnProperty 與原型鏈
description: 新增資料類型後，地圖資料處理突然報錯。追查時順便釐清原型鏈、hasOwnProperty 為什麼要透過 Object.prototype 呼叫，以及真正造成錯誤的原因。
date: 2025-10-15
category: js
tags: [JavaScript, Prototype, Debugging]
readingTime: 5
---

有一次專案新增一種影像類型，功能做完後，處理查詢結果的地方開始報錯。這段程式會把 API 回傳的欄位名稱，依影像類型對應成畫面要用的名稱：

```js
const mapFields = (obj) => {
  for (const field in obj) {
    if (obj.hasOwnProperty(field) && mappings[obj.imagetype][field]) {
      obj[mappings[obj.imagetype][field]] = obj[field]
    }
  }
}
```

修這個問題時，我把判斷改成了這樣：

```js
if (
  Object.prototype.hasOwnProperty.call(obj, field) &&
  mappings[obj.imagetype] &&
  mappings[obj.imagetype][field]
) {
  // ...
}
```

這裡改了兩件事，但它們解決的是不同的問題。我一開始把兩者混在一起，後來才理清楚。

## 先搞懂原型鏈

JavaScript 的物件在找屬性時，自己身上沒有，就會往上一層的原型找，一路找到 `Object.prototype`，最後是 `null`。

```js
const obj = { name: 'Elio' }

obj.name            // 自己的屬性
obj.toString()      // 自己沒有，來自 Object.prototype
```

這就是原型鏈。`hasOwnProperty` 也不是物件自己的方法，而是從 `Object.prototype` 繼承來的。

它的作用是判斷屬性是不是物件**自己的**，這在 `for...in` 裡很重要，因為 `for...in` 也會走訪原型鏈上可列舉的屬性。

## 為什麼不直接呼叫 obj.hasOwnProperty

一般情況下 `obj.hasOwnProperty()` 都能用，但有兩種情況會出問題。

**物件沒有原型：**

```js
const obj = Object.create(null)
obj.hasOwnProperty('a') // TypeError: obj.hasOwnProperty is not a function
```

**物件有同名欄位：**

```js
const obj = { hasOwnProperty: 'oops' }
obj.hasOwnProperty('a') // TypeError
```

資料來自 API 時，你無法保證欄位名稱，所以比較安全的寫法是直接用原型鏈上的方法，再用 `call` 指定檢查對象：

```js
Object.prototype.hasOwnProperty.call(obj, field)
```

這樣就不依賴物件自己身上有什麼。ESLint 的 `no-prototype-builtins` 規則檢查的就是這件事。

現在也可以直接使用 `Object.hasOwn`：

```js
Object.hasOwn(obj, field)
```

## 真正造成錯誤的原因

不過，這次的 TypeError 其實不是 `hasOwnProperty` 造成的，而是這一段：

```js
mappings[obj.imagetype][field]
```

新增的影像類型沒有對應的設定，`mappings[obj.imagetype]` 是 `undefined`，再往下讀 `[field]` 就會報錯：

```text
TypeError: Cannot read properties of undefined
```

所以修好錯誤的，是多加的這個判斷：

```js
mappings[obj.imagetype] &&
```

也可以寫成可選串連：

```js
mappings[obj.imagetype]?.[field]
```

`Object.prototype.hasOwnProperty.call` 則是順手提升穩健性。兩個改動都是好的，但如果面試被問到「為什麼會壞」，答案是前者。

## 跳過之外，要不要提醒

可選串連讓程式不會崩潰，但也可能把問題藏起來。新的影像類型如果忘了加設定，欄位會默默沒有對應，畫面只是少了資料。

如果這是「不應該發生」的情況，在開發環境留下警告會更好：

```js
if (!mappings[obj.imagetype]) {
  console.warn(`缺少影像類型對應：${obj.imagetype}`)
  return
}
```

## 這次學到的事

- `hasOwnProperty` 來自原型鏈，直接呼叫要看物件有沒有這個方法。
- 看到 TypeError 要先看是誰是 `undefined`，不要只看那一行最顯眼的方法。
- 新增類型時，要找出所有依賴類型對照的地方。
- 不報錯不等於沒問題，要想清楚失敗時希望看到什麼。

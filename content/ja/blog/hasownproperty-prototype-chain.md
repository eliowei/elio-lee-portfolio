---
title: ひとつの TypeError から見る hasOwnProperty とプロトタイプチェーン
description: 新しいデータの種類を追加したら、地図データの処理で突然エラーが出ました。調べるついでに、プロトタイプチェーン、hasOwnProperty を Object.prototype 経由で呼ぶ理由、そして本当のエラーの原因を整理します。
date: 2025-10-15
category: js
tags: [JavaScript, Prototype, Debugging]
readingTime: 5
---

あるとき、プロジェクトに新しい画像の種類を追加しました。機能を作り終えると、検索結果を処理する箇所でエラーが出始めました。このコードは、API が返すフィールド名を画像の種類に応じて画面で使う名前に対応付けています：

```js
const mapFields = (obj) => {
  for (const field in obj) {
    if (obj.hasOwnProperty(field) && mappings[obj.imagetype][field]) {
      obj[mappings[obj.imagetype][field]] = obj[field]
    }
  }
}
```

この問題を直すとき、条件を次のように変えました：

```js
if (
  Object.prototype.hasOwnProperty.call(obj, field) &&
  mappings[obj.imagetype] &&
  mappings[obj.imagetype][field]
) {
  // ...
}
```

ここでは 2 つのことを変えていますが、解決している問題は別々です。最初は 2 つを混同していて、あとになってようやく整理できました。

## まずプロトタイプチェーンを理解する

JavaScript のオブジェクトはプロパティを探すとき、自分自身になければひとつ上のプロトタイプを探し、`Object.prototype` まで、最後は `null` までたどります。

```js
const obj = { name: 'Elio' }

obj.name            // 自分自身のプロパティ
obj.toString()      // 自分にはなく、Object.prototype から来ている
```

これがプロトタイプチェーンです。`hasOwnProperty` もオブジェクト自身のメソッドではなく、`Object.prototype` から継承したものです。

その役割は、プロパティがオブジェクト**自身の**ものかどうかを判定することです。`for...in` はプロトタイプチェーン上の列挙可能なプロパティもたどるので、`for...in` の中ではこれが重要になります。

## なぜ obj.hasOwnProperty を直接呼ばないのか

通常は `obj.hasOwnProperty()` で問題ありませんが、2 つのケースでうまくいきません。

**オブジェクトにプロトタイプがない場合：**

```js
const obj = Object.create(null)
obj.hasOwnProperty('a') // TypeError: obj.hasOwnProperty is not a function
```

**オブジェクトに同じ名前のフィールドがある場合：**

```js
const obj = { hasOwnProperty: 'oops' }
obj.hasOwnProperty('a') // TypeError
```

データが API から来る場合、フィールド名は保証できません。そのため、プロトタイプ上のメソッドを直接使い、`call` で対象を指定するほうが安全です：

```js
Object.prototype.hasOwnProperty.call(obj, field)
```

これならオブジェクト自身が何を持っているかに左右されません。ESLint の `no-prototype-builtins` ルールがチェックしているのはまさにこの点です。

今は `Object.hasOwn` も使えます：

```js
Object.hasOwn(obj, field)
```

## 本当のエラーの原因

ただし、今回の TypeError は実は `hasOwnProperty` が原因ではなく、この部分でした：

```js
mappings[obj.imagetype][field]
```

新しい画像の種類には対応する設定がなかったため、`mappings[obj.imagetype]` が `undefined` になり、そこから `[field]` を読もうとしてエラーになっていました：

```text
TypeError: Cannot read properties of undefined
```

つまりエラーを直したのは、追加したこの条件です：

```js
mappings[obj.imagetype] &&
```

オプショナルチェーンで書くこともできます：

```js
mappings[obj.imagetype]?.[field]
```

`Object.prototype.hasOwnProperty.call` のほうは、ついでに堅牢性を高めたものです。どちらの変更も良いものですが、面接で「なぜ壊れたのか」と聞かれたら、答えは前者です。

## スキップするだけでなく、知らせるべきか

オプショナルチェーンを使えばプログラムはクラッシュしませんが、問題を隠してしまうこともあります。新しい画像の種類の設定を追加し忘れても、フィールドは黙って対応付けされず、画面のデータが欠けるだけです。

これが「起きてはいけない」状況なら、開発環境で警告を残すほうがよいでしょう：

```js
if (!mappings[obj.imagetype]) {
  console.warn(`缺少影像類型對應：${obj.imagetype}`)
  return
}
```

## 今回学んだこと

- `hasOwnProperty` はプロトタイプチェーンから来ている。直接呼べるかどうかは、オブジェクトがそのメソッドを持っているか次第。
- TypeError を見たら、まず何が `undefined` なのかを確認する。その行でいちばん目立つメソッドだけを見ない。
- 新しい種類を追加するときは、種類の対応表に依存している箇所をすべて探す。
- エラーが出ないことは問題がないことではない。失敗したときに何が見えてほしいかを考える。

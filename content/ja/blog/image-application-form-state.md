---
title: Vue の動的フォーム設計：排他的な条件、グループ単位のリセット、複数グループのデータ管理
description: 独自に設計した商品検索フォームを例に、条件の切り替え、データと検証のリセット、安定した key と ref の対応、Vuetify 2 と 3 のフォーム検証 API の違いを説明します。
date: 2026-11-17
category: vue
tags: [Vue 2, Vue 3, Vuetify, Forms]
readingTime: 8
---

動的フォームは、選択肢に応じて表示する項目を変えるだけに見えますが、条件が増えると、画面以外にも扱うことが増えます。方式を切り替えたとき、古いデータは消すべきか。一つのグループをリセットしたら、ほかのグループに影響しないか。途中の項目を削除したあとも、検証メッセージは正しい項目に対応しているか。

この記事では、自分で設計した「複数条件の商品検索フォーム」を使って、これらの問題を整理します。ユーザーは出品日または商品コードで検索でき、条件を複数グループ追加することもできます。

> 本文のシナリオ、データ構造、コードはすべて独立した教材用の例であり、特定のプロジェクトの業務フローとは対応しません。また、そのまま動く完全なデモでもありません。

## 一、動的フォームで排他的な条件を管理する理由

この例では、各条件グループで選べる検索方式は一つだけです。

| 方式 | 使うデータ | 切り替え後に使わなくなるデータ |
| --- | --- | --- |
| 出品日で検索 | 日付の値と表示テキスト | 商品コード |
| 商品コードで検索 | 商品コード | 日付の値と表示テキスト |

`v-if` で対応する項目を表示することはできますが、それはコンポーネントが存在するかどうかを制御するだけで、親にあるオブジェクトのデータは消してくれません。

画面だけを切り替え、送信時に条件オブジェクトをそのまま使うと、前回入力した値まで一緒に送ってしまうことがあります。

そのため、レイアウトよりも先に、各条件グループの状態を定義することが大切です。以下の例は Options API を使い、二つの Vue / Vuetify の組み合わせを比べやすくしています。

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

// コンポーネントの data()
data() {
  return { conditions: [createCondition()] }
}
```

これらのフィールドは作成時にすべて宣言します。呼び出すたびに新しいオブジェクトを作るので、複数の条件が誤って同じデータを共有することはありません。この連番 ID は、この例で一つのページ内の識別に使うだけで、データベースやユーザー間の識別子としては使いません。

## 二、切り替え時にデータと検証状態を一緒にリセットする

方式を切り替えるときは、そのグループの `id` と新しく選んだ `mode` を残し、それ以外を初期状態に戻します。グループ単位のリセットでは `mode` もクリアします。

```js
// 以下のメソッドはコンポーネントの methods に置く
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

`changeMode()` は新しいモードを明示的に受け取って設定するので、`v-model` とイベントの実行順序に依存しません。たとえば Vue 3 のセレクトでは `:model-value="condition.mode"` と `@update:model-value="changeMode(condition, $event)"` を組み合わせられます。ほかのコンポーネントでは、それぞれのイベント仕様に合わせて新しい値を渡します。

ここでは「値のクリア」と「検証のリセット」を意図的に分けています。データが変わると、`v-if` に対応する項目が作り直される場合があるので、次の DOM 更新を待ってから、その時点で存在する項目コンポーネントを処理します。`$nextTick` は API を待つものではなく、画面更新の問題すべてに効く万能な解決策でもありません。

### データの値と表示テキストは同じ状態ではない

たとえば日付コンポーネントは `Date` を使い、テキスト項目は `YYYY-MM-DD` を表示する場合、`selectedDate` と `displayDate` の二つの状態が必要になることがあります。これはこの例が選んだコンポーネントの仕様であり、すべての日付コンポーネントでこうする必要があるわけではありません。

日付を選んだときは両方を一緒に更新し、リセットのときも両方をクリアします。そうしないと、画面には日付が残っているのに、検索用のデータは空になっている、という状態になりえます。

表示テキストが日付の値から完全に導出できるなら、computed や整形関数で計算するのを優先し、手動で同期する状態を減らします。独立した入力や一時的な状態が本当に必要なときだけ、二つ目の値を持ちます。

### 検証用の ref をこのグループに対応させる

下では、条件 ID と項目名を組み合わせて ref を作り、条件付きレンダリングで ref が存在しない場合も扱います。この例ではコンポーネントが `resetValidation()` を提供すると仮定しているので、実際に使うときはコンポーネントの API を確認してください。

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

ここでリセットするのは、まだ存在していて `resetValidation()` を提供している項目コンポーネントだけです。`v-if` で切り替えたあとは、元の項目がすでにアンマウントされていることもあります。検証状態が親のフォームや別の状態管理に保存されている場合は、実際の構成に合わせてそちらも同期して消す必要があります。

テンプレート側の ref の命名も合わせます。たとえば `:ref="`condition_${condition.id}_productCode`"` のようにします。実際のコンポーネントが日付の表示項目も検証するなら、その項目も対象に含めてください。

## 三、複数グループの追加・削除と安定した key

条件を追加するときは新しいオブジェクトを作り、リセットでは元の ID を保ち、削除では ID で対象を探します。

```js
addCondition() {
  this.conditions.push(createCondition())
},

removeCondition(id) {
  const index = this.conditions.findIndex(item => item.id === id)
  if (index !== -1) this.conditions.splice(index, 1)
},
```

テンプレートでは、安定した ID を key にします。

```vue
<div v-for="condition in conditions" :key="condition.id">
  <!-- 条件の種類と対応する項目 -->
  <button type="button" @click="resetCondition(condition)">条件をリセット</button>
  <button type="button" @click="removeCondition(condition.id)">条件を削除</button>
</div>
```

配列のインデックスを key にすると、途中の項目を削除したあと、後ろのコンポーネントが別のデータを表示するために再利用されることがあります。内部に入力や検証の状態を持つコンポーネントでは、これは注意が必要な挙動です。ただし、インデックスの key がすべて必ずバグを起こすという意味ではありません。[Vue のリスト状態維持に関する説明](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)

**安定した key と ref の対応は、別々に扱う必要があります。** key に ID を使っても、ref が `field_0`、`field_1` のままだと、削除後のインデックスのずれは別途管理が必要です。そのためこの例では、どちらも条件 ID で対応させています。

### 検索データは条件の種類から作る

送信時にもう一度、使うデータを明示的に選び、画面の状態をそのまま検索内容にしないようにします。

```js
// この例ではローカルの暦日から YYYY-MM-DD を作り、UTC には変換しない
function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("日付が無効です")
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
  throw new Error("検索方式を選択してください")
}
```

ここでは `selectedDate` を日付データの元とし、`displayDate` は画面表示だけを担当します。`formatDate()` はこの例で自分で定義した整形関数で、ローカルの日付を `YYYY-MM-DD` に変換します。UTC の文字列に直接変換したときに日付がずれるのを避けるためです。実際の検索形式やタイムゾーンは API の仕様に従って決めてください。

これは検証を通ったあとのデータ整理の例にすぎず、必須、形式、日付の有効性のチェックの代わりにはなりません。バックエンドでも、受け取った検索内容を検証する必要があります。

## 四、Vue / Vuetify の組み合わせによるフォーム検証の違い

Vue 2 + Vuetify 2 と Vue 3 + Vuetify 3 を比べるときは、フレームワークとコンポーネントライブラリのそれぞれの責任を分けて考える必要があります。以下の違いは Vuetify のフォーム API によるもので、Vue のリアクティビティによるものではありません。

Vuetify 2 の `validate()` は真偽値を返します。Vuetify 3.6.13 を例にすると、`validate()` は非同期の関数で、完了すると `valid` と `errors` を含むオブジェクトを返します。

現在の条件を入力し終えないと次のグループを追加できないようにしたい場合は、前に示した追加メソッドを、それぞれ次のように書き換えられます。

```js
// Vue 2 + Vuetify 2：メソッドの例
function addCondition() {
  const valid = this.$refs.form.validate()
  if (!valid) return
  this.conditions.push(createCondition())
}
```

```js
// Vue 3 + Vuetify 3：メソッドの例
async function addCondition() {
  const { valid } = await this.$refs.form.validate()
  if (!valid) return
  this.conditions.push(createCondition())
}
```

この二つは異なる技術の組み合わせでの代替実装であり、同じ methods に入れるものではありません。また、`form` がフォーム全体を指すのか、一つのグループのフォームを指すのかも確認してください。それが検証の範囲を決めます。

Promise をそのまま真偽値として扱うと、検証に通ったかどうかは判断できません。戻り値の型と使い方は、[Vuetify 2 のフォーム API](https://v2.vuetifyjs.com/en/api/v-form/) と [Vuetify のフォーム API](https://vuetifyjs.com/en/api/v-form/) を参照してください。

条件切り替えのイベントも、コンポーネントの仕様に従ってバインドします。独自のセレクトの `change` と別のコンポーネントの `update:modelValue` を、用途が似ているからといって、発火のタイミングが同じだと見なしてはいけません。

## 五、操作順序のテストと開発の所感

動的フォームでは、各項目に入力できるかを試すだけでは足りず、操作を続けてテストする必要があります。

- 日付を入力してから商品コードに切り替え、日付のデータと検証状態が消えることを確認する。
- 一つのグループをリセットし、ほかのグループに影響がないことを確認する。
- 異なるデータで三つのグループを追加し、真ん中を削除してから、残った項目を操作する。
- 日付をリセットし、コンポーネントの値と表示テキストが一緒に消えることを確認する。
- 検証に失敗したとき、追加も送信も行われないことを確認する。
- 検証に成功したとき、検索内容に現在のモードで必要なデータだけが含まれることを確認する。
- キーボードで切り替え、リセット、削除を行い、フォーカスがその後も操作を続けられることを確認する。

以上は、この例で確認が必要な場面です。完全なデモや自動テストの成果がすでにあるという意味ではありません。

フォーム開発は項目を追加するだけではなく、条件同士の関係や、データと画面の状態をどう一致させ続けるかも考える必要があります。

特に既存のプロジェクトでは、同じ要件を異なるバージョンのフレームワークとコンポーネントライブラリで実装することがあります。元の書き方をそのまま流用するより、各プロジェクトのデータ構造、コンポーネントの挙動、API の違いを先に確認することで、問題を新しい流れに持ち込まずに済みます。

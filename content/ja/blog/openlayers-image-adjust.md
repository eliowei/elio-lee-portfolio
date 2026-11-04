---
title: OpenLayers での画像調整：CSS filter とポップアップのドラッグの不具合
description: OpenLayers の地図上で CSS filter を使って明るさ・コントラスト・彩度をリアルタイムに調整し、ポップアップ内で地図を操作すると後ろのウィンドウまで動いてしまう問題をどう直したかを記録します。
date: 2025-12-01
category: case
tags: [OpenLayers, Canvas, Events]
readingTime: 6
---

仕事で画像を確認するポップアップがあり、その中で OpenLayers を使って画像を表示し、ユーザーがパンやズームをできるようにしています。今回は明るさ、コントラスト、彩度を調整する機能を追加し、あわせてポップアップの操作に関する不具合も直しました。

## CSS filter で画像を調整する

OpenLayers はデフォルトで canvas にレイヤーを描画します。画像の見た目を変えるには、最初はピクセルを読み取って再計算することを考えましたが、それだとタイルごとに処理する必要があり、パンやズームのたびにやり直しになります。

実際の要件は「見た目」が変わればよく、データを変える必要はありません。そこで canvas 要素に直接 CSS filter を適用することにしました：

```js
updateFilterStyle() {
  const canvas = document.querySelector('#imageMap .ol-layer canvas')
  if (!canvas) return

  canvas.style.filter = `
    contrast(${this.contrast / 100})
    saturate(${this.saturation / 100})
    brightness(${this.exposure / 100})
  `
}
```

UI はスライダーに値をバインドし、範囲は 50〜200、デフォルトは 100 です：

```html
<v-slider v-model="contrast" min="50" max="200" step="10" @input="updateFilterStyle" />
```

この方法にはいくつかの利点があります：

- **パフォーマンスが良い**：フィルターはブラウザが処理するので、タイルを再描画する必要がない。
- **データに影響しない**：元の画像はまったく変わらず、値をリセットすれば元に戻る。
- **即座に反映される**：スライダーを動かすとすぐに結果が見える。

### 範囲を限定する

セレクターは必ずポップアップ内の地図を指定します。ページにはメインの地図もあるので、`.ol-layer canvas` とだけ書くと別の地図を変えてしまう可能性があります。

### 向いていない場面

CSS filter は表示結果を変えるだけです。調整後の画像を書き出したい場合やピクセルを解析したい場合は、Canvas API や OpenLayers のレイヤー処理を使う必要があります。また canvas 全体に作用するので、同じ canvas に描かれたすべてのレイヤーが影響を受けます。

## 不具合の修正：地図を操作すると後ろのウィンドウも動く

このプロジェクトにはドラッグできるポップアップがいくつもあります。ユーザーが「注文」ウィンドウを開き、次に「画像の確認」ウィンドウを開いて地図をドラッグすると、なんと後ろの注文ウィンドウまで一緒に動いていました。縮尺のズームツールをドラッグしたときも同じでした。

### 原因

ドラッグ機能はこのように登録されていました：

```js
document.addEventListener('mousedown', (e) => {
  if (e.target.tagName !== 'CANVAS') dragMouseDown(e)
})
```

問題は 2 つありました：

- リスナーが `document` に付いているので、**ページ上のどこでマウスを押しても発火する**。ポップアップ自体に限らない。
- 条件は canvas を除外しているだけ。地図上のズームツールは canvas ではないので、押すとウィンドウをドラッグするものとして扱われる。

つまりプログラムが確認していたのは「押したのが何でないか」であって、「押したのが自分かどうか」ではなかったのです。

### 修正

イベントが本当にこのポップアップの中で起きていて、しかも地図の上ではないことを確認するように変えました：

```js
document.addEventListener('mousedown', (e) => {
  const popup = document.getElementById('orderPopup')
  const imageMap = document.querySelector('.imageMap')

  const isInPopup = popup?.contains(e.target)
  const isInMap = imageMap?.contains(e.target)

  if (isInPopup && !isInMap && e.target.tagName !== 'CANVAS') {
    dragMouseDown(e)
  }
})
```

`element.contains(target)` を使うと、クリックした対象がある要素の中にあるかどうかを判定でき、`tagName` だけを見るより確実です。

この修正で地図のパンやズームとウィンドウのドラッグが切り離され、ユーザーが画像を調整しているときに後ろのウィンドウが勝手に動くことはなくなりました。

### よりよい書き方

設計し直すなら、リスナーを `document` ではなくポップアップのタイトルバーに付け、タイトルバーをつかんだときだけドラッグできるようにします。そうすれば対象を判定する必要がそもそもなく、コンポーネントを閉じたあとにリスナーが残ることも防げます。

## 今回学んだこと

- まず、要件がデータを変えることなのか、表示を変えるだけなのかを考える。後者にはたいていもっと簡単な方法がある。
- イベントを `document` にバインドするときは、影響範囲に特に注意する。
- 条件は「自分であることを確認する」形で書くほうが、「自分以外を除外する」より安全。除外リストはいつまでも書き終わらないから。

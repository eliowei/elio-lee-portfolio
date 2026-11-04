---
title: ログイン後に元のページへ戻る：大量のフラグをひとつの仕組みにまとめる
description: もともとはページごとにフラグを用意してログイン後の行き先を記録しており、ページを追加するたびにフラグが増えていました。Router Guard でまとめて扱う方法と、除外すべき境界ケースを記録します。
date: 2026-03-10
category: case
tags: [Vue Router, Vuex, Refactoring]
readingTime: 5
---

ユーザーがログインの必要なページを開くと、まずログイン画面に案内されます。ログインしたら、トップページではなく、もともと行こうとしていたページに戻るべきです。

よくある要件ですが、私が引き継いだ Vue 2 のプロジェクトでは一部のページにしか対応しておらず、しかも拡張しにくいやり方でした。この記事では、どうリファクタリングしたかを記録します。

## 元のやり方：ページごとに 1 つのフラグ

Vuex に、ユーザーがどの機能から来たかを記録するフラグが並んでいました：

```js
state: {
  loginToCart: false,
  loginToApplication: false,
  // ...
}
```

ページに入る前にフラグを立て、ログイン成功後に一つずつ判定します：

```js
if (state.loginToCart) {
  router.push({ name: 'Cart' })
} else if (state.loginToApplication) {
  router.push({ name: 'Application' })
} else {
  router.push({ name: 'Home' })
}
```

問題は、ログインの必要なページを 1 つ追加するたびに、フラグも mutation も判定も 1 つずつ増え、さらに正しい場所でクリアすることも覚えておかなければならない点です。一覧に入っていないページは、ログイン後にトップページへ戻るしかありません。

しかも覚えているのは「どのページか」だけで、URL のパラメーターは覚えていません。

## 変更後：ユーザーが行こうとしていたルートを覚える

実はこれらのフラグはすべて同じこと、つまり「ログイン後にどこへ行くか」を表していました。そこでひとつの状態に置き換えました：

```js
state: {
  redirectAfterLogin: null,
},
mutations: {
  setRedirectAfterLogin(state, route) {
    state.redirectAfterLogin = route
  },
  clearRedirectAfterLogin(state) {
    state.redirectAfterLogin = null
  },
}
```

記録するタイミングも各ページに散らばらせる必要はなく、すべて Router Guard にまとめます。ユーザーがログインしていないとわかったら、行き先のルートを保存します：

```js
router.beforeEach((to, from, next) => {
  const isPageRefresh = from.name && from.path === to.path
  const skip = ['Login', 'Register', 'Home']

  if (
    !isLoggedIn() &&
    !store.state.redirectAfterLogin &&
    !skip.includes(to.name) &&
    from.name !== undefined &&
    !isPageRefresh
  ) {
    store.commit('setRedirectAfterLogin', {
      name: to.name,
      params: to.params,
      query: to.query,
    })
  }

  // ...
})
```

ログイン成功後は、この値ひとつを見るだけです：

```js
const route = store.state.redirectAfterLogin
store.commit('clearRedirectAfterLogin')
router.push(route ?? { name: 'Home' })
```

これで、ログインの必要なページを追加しても、リダイレクトのロジックを変更する必要はなくなりました。

## なぜ params と query も保存するのか

ルート名だけを保存すると、パラメーター付きのページは戻ってきたときに内容が消えてしまいます。たとえば注文の詳細や検索結果からログインに案内された場合、戻ってきたら同じデータが表示されるべきです。

そこで `name`、`params`、`query` をすべて保存し、戻ったときにページの状態を完全に復元できるようにしました。

## 除外すべき境界ケース

仕組み自体は単純で、条件のほとんどは例外の処理です：

- **ログイン、会員登録、トップページは記録しない**：そうしないと、ログイン後にまたログインページへ戻されてしまう。
- **すでに値があれば上書きしない**：ログインへ案内される途中で、ほかのルートを通ることがある。最初のものを残してこそ、本来の目的地になる。
- **初回アクセスは記録しない**：`from.name` が `undefined` のときは、サイト内の移動ではなく URL を直接開いたことを意味する。
- **リロードは記録しない**：このとき遷移元と遷移先が同じパスになる。
- **ログアウト時にクリアする**：そうしないと、次にログインした人が前のユーザーのページに飛ばされてしまう。

最後の点がいちばん忘れやすいものです。2 人で 1 台のパソコンを共有している場合、これは体験の問題にとどまらず、見るべきでないページが見えてしまうおそれもあります。

## なぜ URL パラメーターを使わないのか

よくある別の方法は、行き先を URL に入れることです。たとえば `/login?redirect=/orders/123` のようにします。リロードしても消えず、共有もしやすいという利点があります。

ただし Open Redirect には注意が必要です。URL パラメーターの値にそのままリダイレクトすると、攻撃者が `?redirect=https://evil.example` のようなリンクを作り、あなたのドメインを使ってユーザーをだますことができます。この方法を使う場合は、行き先がサイト内のパスに限られるかを確認する必要があります。

このプロジェクトはルートオブジェクトを Vuex に保存していて、行き先が外部からの入力に由来しないので、この問題はありません。その代わり、ページ全体をリロードすると状態が消え、トップページに戻ります。

## 今回学んだこと

- 似たようなフラグが並んでいるのを見たら、まずそれらが同じことを表していないかを考える。
- 共通のロジックは、各ページに散らばらせるより Router Guard に置くほうが保守しやすい。
- リファクタリングでコードは減ったが、本当に時間をかけて考える必要があるのは境界条件のほうだった。

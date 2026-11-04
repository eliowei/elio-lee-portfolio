---
title: Postman から cURL へ：HTTP リクエストを本当に理解し始めるとき
description: Postman で API をテストしていた頃から、バックエンドが渡してくれる curl コマンドの裏にある HTTP の仕組みを理解するまでに学んだ、cURL の実践的な考え方をまとめます。
date: 2025-05-08
category: js
tags: [HTTP, cURL, API, Debugging, Postman]
readingTime: 8
draft: false
---

バックエンドの API に触れ始めた頃、いちばんよく使っていたツールは Postman でした。

グラフィカルな画面で URL、HTTP メソッド、ヘッダー、ボディを設定すれば、すぐに API をテストでき、サーバーが返した結果もそのまま確認できます。

しかし実際にバックエンドと一緒に仕事をしてみると、受け取るのが Postman の例ではなく、cURL のコマンドであることがありました。

最初はコマンドをターミナルにコピーして実行し、API が正常かを確認するだけでした。あとになって少しずつ中のパラメーターを理解するようになりました。なぜ Authorization ヘッダーが必要なのか。`Content-Type` は何に影響するのか。リクエストボディの形式が違うと、バックエンドの解析にどう影響するのか。

こうした細かな点から HTTP リクエストを改めて知るようになり、cURL は API をテストするもうひとつのツールというだけでなく、リクエストを再現して問題を調べるのにとても役立つ手段だと気づきました。

このノートでは、Postman から cURL に触れるようになった過程と、開発でよく使うコマンド、API のデバッグの考え方をまとめます。

## 1. Postman と cURL の違い

Postman は HTTP リクエストをグラフィカルな画面にまとめ、フォームで次のものを設定できるようにしています：

- HTTP メソッド：GET、POST、PUT、DELETE
- URL：API のリクエスト先
- Headers：リクエストヘッダー
- Body：送信するデータ
- Response：サーバーが返した結果

一方 cURL は、コマンドラインからネットワークリクエストを送るツールです。

たとえば：

```bash
curl https://api.example.com/users
```

これがいちばん基本的な GET リクエストです。

両者は互いに置き換えるものではありません：

- Postman：API リクエストをすばやく作成、管理、テストするのに向いている。
- cURL：コマンドラインでリクエストを再現し、パラメーターを確認し、デバッグするのに向いている。

実際の開発では、バックエンドが提供した cURL コマンドをそのまま実行して、API が正常に応答するかを確認することもできます。

本当に大切なのはどちらのツールを選ぶかではなく、その裏で使われている HTTP リクエストの構造を理解できるかどうかです。

## 2. cURL の基本的なリクエスト：GET から POST まで

いちばん基本になるのは HTTP メソッドです。

### 2.1 GET：データを取得する

```bash
curl https://api.example.com/users
```

これは指定した URL に GET リクエストを送るもので、通常はサーバー上のデータを取得するのに使います。

クエリパラメーターを渡したい場合は、URL に直接書けます：

```bash
curl "https://api.example.com/users?page=1&limit=10"
```

この方法はページネーション、絞り込み、検索でよく使われます。

### 2.2 POST：データを送る

バックエンドがユーザーを作成する API を提供しているとします：

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elio","email":"elio@example.com"}'
```

このコマンドには重要な設定がいくつか含まれています：

- `-X POST`：HTTP メソッドを POST に指定する。
- `-H`：HTTP ヘッダーを設定する。
- `Content-Type: application/json`：リクエストボディが JSON 形式であることをサーバーに伝える。
- `-d`：リクエストボディのデータを送る。

注意したい細かな点がひとつあります：

HTTP メソッドを別に指定していない場合、`-d` だけで cURL は POST を使います。そのため、次の書き方でも POST が正しく送られます：

```bash
curl https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elio"}'
```

つまり、`-d` と `-X POST` はまったく同じ機能ではありません。

前者はデータを送る役割、後者はリクエストのメソッドを明示する役割です。

## 3. ヘッダーとボディ：サーバーはリクエストをどう理解するのか

自分で cURL のコマンドを組み立てるようになって、いちばん理解する価値があると感じたのがヘッダーとボディです。

### 3.1 よく使われるヘッダー

```bash
curl https://api.example.com/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

ここにはよく使われるヘッダーが 2 つあります：

**Authorization**

Bearer Token など、API の認証情報を渡すのに使います。

**Content-Type**

リクエストボディのメディアタイプを示し、サーバーがデータをどう解析すべきかを知らせます。

よく使われる形式は次のとおりです：

- `application/json`
- `application/x-www-form-urlencoded`
- `multipart/form-data`

API が 401 や 415 を返す場合、問題はプログラムのロジックではなく、認証情報やデータ形式がバックエンドの要件に合っていないことがあります。

### 3.2 JSON と Form Data の違い

この 2 つのリクエストはどちらもデータを送っているように見えますが、実際の形式は異なります。

**JSON：**

```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

**application/x-www-form-urlencoded：**

```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "email=user@example.com&password=123456"
```

両者の違いはデータのエンコード方法です。

JSON は JSON 形式でデータを送り、`application/x-www-form-urlencoded` は URL のクエリパラメーターのような形でデータをエンコードします。

さらに、ファイルのアップロードでよく使われる `multipart/form-data` も別の形式で、`-F` でフォームのリクエストを作れます：

```bash
curl https://api.example.com/upload \
  -F "file=@./image.png"
```

`-F` を使うと、cURL が multipart の boundary を自動で処理してくれるので、`Content-Type` を自分で設定する必要はありません。

これらの形式は単なる書き方の違いではなく、サーバーがリクエストボディをどう解析するかに直接影響します。

## 4. cURL でよく使うデバッグ用のオプション

実際に cURL を使い始めて、いちばん実感したのは、リクエストを送るだけでなく、HTTP の通信の過程を観察するのにも役立つということです。

### 4.1 `-v`：詳しい接続情報を見る

```bash
curl -v https://api.example.com/profile
```

`-v` は verbose モードで、たとえば次のような詳しい情報を見られます：

- DNS と接続の過程
- TLS ハンドシェイクの情報
- リクエストヘッダー
- レスポンスヘッダー
- HTTP プロトコルとサーバーの応答の情報

接続の失敗、証明書の問題、HTTP ステータスコードの異常にぶつかったとき、とても役立つデバッグの入り口になります。

### 4.2 `-i`：レスポンスヘッダーとボディを一緒に表示する

```bash
curl -i https://api.example.com/profile
```

`-i` を付けるとレスポンスヘッダーも一緒に出力されます。

たとえば次のものを確認できます：

- `Content-Type`
- `Set-Cookie`
- `Location`
- HTTP ステータスコード

レスポンスヘッダーだけを見たい場合は、次のようにもできます：

```bash
curl -I https://api.example.com/profile
```

この `-I` は HEAD リクエストを送るもので、通常はレスポンスヘッダーだけを取得し、レスポンスボディは取得しません。

HEAD と GET は別の HTTP メソッドであり、サーバー側も HEAD の動作に対応している必要がある点に注意してください。

### 4.3 `-sS` と `-w`：HTTP ステータスコードだけを見る

API が返すステータスコードだけを確認したく、レスポンスボディ全体は必要ないこともあります。

そのときは次のようにします：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://api.example.com/profile
```

各オプションの役割：

- `-s`：進捗や一般的なメッセージの出力を止める。
- `-S`：silent モードと組み合わせ、エラーが起きたときはエラーメッセージを表示する。
- `-o /dev/null`：レスポンスボディを出力しない。
- `-w`：リクエスト完了後の出力形式をカスタマイズする。
- `%{http_code}`：HTTP ステータスコードを出力する。

たとえば次のように返ってきたら：

```bash
200
```

この HTTP リクエストが 200 のステータスコードを受け取ったということです。

ただし HTTP のステータスコードはサーバーの応答結果を表すもので、業務の流れ全体が成功したことを意味するとは限りません。

### 4.4 `-L`：リダイレクトを自動で追う

```bash
curl -L https://example.com
```

`-L` は Follow Redirects を意味します。

サーバーが 301、302 などのリダイレクトを返したとき、cURL はリダイレクト先の URL に続けてリクエストを送ります。

サイトの遷移、ログインのフロー、API のリダイレクトをテストするときに役立ちます。

### 4.5 `-b`：Cookie を送る

```bash
curl https://api.example.com/orders \
  -b "session=abc123"
```

`-b` は Cookie を送るのに使います。

API がログイン状態を必要とする場合は、Cookie か Authorization ヘッダーで認証情報を渡せます。どちらを使うかはバックエンドの認証の設計次第です。

たとえば：

```bash
curl https://api.example.com/orders \
  -b "session=abc123" \
  -H "Authorization: Bearer <token>"
```

この例では Cookie と Bearer Token の両方を送っています。

ただし実際には両方が必要とは限らず、API の認証仕様に従って決めるべきです。

## 5. HTTP ステータスコードから問題を判断する

API でエラーが起きたとき、最初のステップはたいてい、サーバーが返した HTTP ステータスコードを確認することです。

開発中によく見るステータスコードは次のとおりです：

| Status Code | 意味 | よくある調査の方向 |
| --- | --- | --- |
| 200 | OK | リクエスト成功 |
| 201 | Created | リソースの作成に成功 |
| 204 | No Content | リクエストは成功したが、レスポンスボディがない |
| 301 / 302 | Redirect | リダイレクト先を確認する |
| 400 | Bad Request | リクエストボディやパラメーターを確認する |
| 401 | Unauthorized | ログイン状態と Token を確認する |
| 403 | Forbidden | 権限を確認する |
| 404 | Not Found | API のパスやリソースを確認する |
| 415 | Unsupported Media Type | Content-Type を確認する |
| 500 | Internal Server Error | サーバー側のエラーを確認する |

たとえばフロントエンドが API を呼んで 401 を受け取った場合、まず cURL で同じリクエストを再現し、Authorization ヘッダー、Cookie、Token が正しいかを確認できます。

こうすれば、問題がリクエストの組み立てにあるのか、認証のフローにあるのか、サーバー側の処理にあるのかを、ひとまず判断できます。

ただし CORS の問題に当たったときは、特に注意が必要です：

cURL はブラウザの CORS のセキュリティ制限を受けないので、cURL のリクエストが成功しても、ブラウザ側の CORS の設定に問題がないとは限りません。

その場合は、やはりブラウザの DevTools の Network と Console に戻って確認する必要があります。

## 6. 実践的な API のデバッグ：バックエンドが提供したリクエストを再現する

これは、実際の開発で cURL がいちばん価値を発揮する場面のひとつだと思います。

フロントエンドとバックエンドが協力するとき、バックエンドが次のような API の例を提供してくれることがあります：

```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

このとき、ただコピーして貼り付けるのではなく、まずこのコマンドを理解します：

1. Endpoint：`/auth/login`
2. Method：POST
3. Header：JSON 形式を使う。
4. Body：email と password を含む。
5. Response：返されるステータスコードとデータの構造を確認する必要がある。

そのうえでターミナルで直接実行し、API が正常に応答するかを確認できます。

cURL では成功するのにフロントエンドのプログラムでは失敗する場合は、さらに両方のリクエストを比べられます：

- HTTP メソッドは同じか。
- URL は正しいか。
- ヘッダーが抜けていないか。
- リクエストボディの形式は同じか。
- Cookie や Token は正しく送られているか。

こうすれば API のデバッグに方向性が生まれ、勘だけでフロントエンドのコードを変えることがなくなります。

### 実用的な API デバッグのテンプレート

最後に、開発中に使える例をまとめておきます：

```bash
curl -sS -D - \
  -o response.txt \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  https://api.example.com/profile
```

このコマンドでは次のことができます：

- `-sS`：一般的な進捗情報を隠しつつ、エラーメッセージは残す。
- `-D -`：レスポンスヘッダーをターミナルに出力する。
- `-o response.txt`：レスポンスボディをファイルに保存する。
- `-H`：API に必要なヘッダーを設定する。

実行後はレスポンスヘッダーとボディを別々に確認でき、すべての情報が混ざった状態で読む必要がありません。

実際に使うときは、例の URL と Token を自分の API の情報に置き換えるのを忘れずに。また、本物の Token、パスワード、Cookie を公開のコードや記事に載せないようにしてください。

## 7. 今回学んだこと

この学習の過程を振り返ると、Postman と cURL がもたらしてくれた価値はそれぞれ違うと感じます。

Postman はリクエストをすばやく作って結果を確認させてくれ、cURL は HTTP リクエストの細部により直接触れさせてくれました。

Method、Header、Body、Cookie、Status Code、そしてサーバーのレスポンスを理解し始めると、API はツールを通してしか操作できないブラックボックスではなくなります。

自分でリクエストを再現し、フロントエンドとバックエンドの違いを比べ、バックエンドとも問題をより正確に話し合えるようになります。

私にとって Postman から cURL への移行は、コマンドラインのツールをひとつ覚えただけでなく、「API を使える」から「API がどう動いているかを理解する」へと進み始めたことでした。

もし今あなたも API を学んでいるなら、バックエンドが提供する cURL の例から始めてみることをおすすめします。まず一度実際に実行してみて、それから各パラメーターの役割を一つずつ分解してみてください。

こうしたコマンドが読めるようになれば、HTTP リクエストは Postman のフォームのひとつではなく、観察し、検証し、デバッグできるエンジニアリングの流れになります。

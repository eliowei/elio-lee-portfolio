---
title: 從 Postman 到 cURL：當你開始真正理解 HTTP 請求
description: 從使用 Postman 測 API，到理解後端提供 curl 指令背後的 HTTP 原理，這篇筆記整理我一路學到的 cURL 實務觀念。
date: 2025-05-08
category: js
tags: [HTTP, cURL, API, Debugging, Postman]
readingTime: 8
draft: false
---

剛開始接觸後端 API 時，我最常使用的工具就是 Postman。

透過圖形化介面設定 URL、HTTP Method、Header 與 Body，就能快速測試 API，也能直接查看伺服器回傳的結果。

但在實際與後端合作時，我發現有時候收到的不是 Postman 範例，而是一段 cURL 指令。

一開始，我通常只是複製指令到終端機執行，確認 API 是否正常。後來才慢慢開始理解裡面的參數：為什麼需要 Authorization Header？`Content-Type` 有什麼影響？不同的 Request Body 格式又會如何影響後端解析？

這些細節讓我開始重新認識 HTTP 請求，也發現 cURL 不只是另一種測試 API 的工具，更是重現請求與排查問題時很實用的方法。

這篇筆記整理我從 Postman 接觸 cURL 的過程，以及開發時常用的指令與 API 除錯觀念。

## 1. Postman 與 cURL 的差異

Postman 將 HTTP 請求封裝成圖形化介面，讓我們可以透過表單設定：

- HTTP Method：GET、POST、PUT、DELETE
- URL：API 的請求位置
- Headers：請求標頭
- Body：傳送的資料
- Response：伺服器回傳的結果

而 cURL 則是透過命令列發送網路請求的工具。

例如：

```bash
curl https://api.example.com/users
```

這就是一個最基本的 GET 請求。

兩者並不是互相取代的關係：

- Postman：適合快速建立、管理與測試 API 請求。
- cURL：適合透過命令列重現請求、檢查參數，以及進行除錯。

在實際開發中，後端提供的 cURL 指令也可以直接拿來執行，確認 API 是否能正常回應。

真正重要的不是選擇哪個工具，而是能不能理解它們背後使用的 HTTP 請求結構。

## 2. cURL 基本請求：從 GET 到 POST

最基本的部分就是 HTTP Method。

### 2.1 GET：取得資料

```bash
curl https://api.example.com/users
```

這會對指定網址發送 GET 請求，通常用來取得伺服器上的資料。

如果需要傳遞查詢參數，可以直接放在 URL：

```bash
curl "https://api.example.com/users?page=1&limit=10"
```

這種方式常見於分頁、篩選與搜尋功能。

### 2.2 POST：傳送資料

假設後端提供一支建立使用者的 API：

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elio","email":"elio@example.com"}'
```

這段指令包含幾個重要設定：

- `-X POST`：指定 HTTP Method 為 POST。
- `-H`：設定 HTTP Header。
- `Content-Type: application/json`：告訴伺服器 Request Body 使用 JSON 格式。
- `-d`：傳送 Request Body 資料。

有一個細節值得注意：

`-d` 本身在沒有另外指定 HTTP Method 時，就會讓 cURL 使用 POST。因此，以下寫法也可以正常發送 POST：

```bash
curl https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elio"}'
```

所以，`-d` 與 `-X POST` 並不是完全相同的功能。

前者負責傳送資料，後者則是明確指定請求方法。

## 3. Header 與 Body：伺服器如何理解請求？

當開始自己組裝 cURL 指令時，我覺得最值得理解的就是 Header 與 Body。

### 3.1 常見的 Header

```bash
curl https://api.example.com/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

這裡有兩個常見的 Header：

**Authorization**

用來傳遞 API 認證資訊，例如 Bearer Token。

**Content-Type**

用來描述 Request Body 的媒體類型，讓伺服器知道應該如何解析資料。

常見格式包括：

- `application/json`
- `application/x-www-form-urlencoded`
- `multipart/form-data`

如果 API 回傳 401 或 415，有時候問題不是程式邏輯，而是認證資訊或資料格式不符合後端要求。

### 3.2 JSON 與 Form Data 的差別

這兩種請求看起來都在傳送資料，但實際格式不同。

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

兩者的差異在於資料編碼方式。

JSON 使用 JSON 格式傳送資料；`application/x-www-form-urlencoded` 則使用類似 URL 查詢參數的方式編碼資料。

另外，檔案上傳常見的 `multipart/form-data` 也是另一種格式，可以使用 `-F` 來建立表單請求：

```bash
curl https://api.example.com/upload \
  -F "file=@./image.png"
```

使用 `-F` 時，cURL 會自動處理 multipart boundary，不需要自行設定 `Content-Type`。

這些格式不是單純的語法差異，而是會直接影響伺服器如何解析 Request Body。

## 4. cURL 常用的除錯參數

真正開始使用 cURL 後，我最有感的地方是：它不只是發送請求，也能幫助我們觀察 HTTP 通訊過程。

### 4.1 `-v`：查看詳細連線資訊

```bash
curl -v https://api.example.com/profile
```

`-v` 是 verbose 模式，可以查看比較詳細的資訊，例如：

- DNS 與連線過程
- TLS 握手資訊
- Request Header
- Response Header
- HTTP 協定與伺服器回應資訊

當遇到連線失敗、憑證問題或 HTTP 狀態碼異常時，這是很實用的除錯入口。

### 4.2 `-i`：同時顯示 Response Header 與 Body

```bash
curl -i https://api.example.com/profile
```

`-i` 會將 Response Header 一起輸出。

例如可以觀察：

- `Content-Type`
- `Set-Cookie`
- `Location`
- HTTP Status Code

如果只是想查看 Response Header，也可以使用：

```bash
curl -I https://api.example.com/profile
```

這裡的 `-I` 會發送 HEAD 請求，通常只取得 Response Header，不取得 Response Body。

要注意的是，HEAD 與 GET 是不同的 HTTP Method，伺服器也必須支援對應的 HEAD 行為。

### 4.3 `-sS` 與 `-w`：只看 HTTP Status Code

有時候我們只想確認 API 回傳的狀態碼，不需要完整的 Response Body。

可以使用：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://api.example.com/profile
```

參數的用途：

- `-s`：關閉進度與一般訊息輸出。
- `-S`：搭配 silent 模式，在發生錯誤時仍顯示錯誤訊息。
- `-o /dev/null`：不輸出 Response Body。
- `-w`：自訂請求完成後的輸出格式。
- `%{http_code}`：輸出 HTTP Status Code。

例如回傳：

```bash
200
```

就代表這次 HTTP 請求收到 200 狀態碼。

不過，HTTP 狀態碼代表的是伺服器回應結果，不等於整個業務流程一定成功。

### 4.4 `-L`：自動跟隨 Redirect

```bash
curl -L https://example.com
```

`-L` 表示 Follow Redirects。

當伺服器回傳 301、302 等重新導向回應時，cURL 可以繼續請求重新導向後的網址。

這在測試網站跳轉、登入流程或 API Redirect 時很有幫助。

### 4.5 `-b`：帶入 Cookie

```bash
curl https://api.example.com/orders \
  -b "session=abc123"
```

`-b` 可以用來傳送 Cookie。

如果 API 需要登入狀態，可以透過 Cookie 或 Authorization Header 傳遞認證資訊，實際使用哪一種方式則取決於後端的驗證設計。

例如：

```bash
curl https://api.example.com/orders \
  -b "session=abc123" \
  -H "Authorization: Bearer <token>"
```

這個例子同時帶入 Cookie 與 Bearer Token。

但實際上不一定需要兩者，應該依照 API 的認證規格決定。

## 5. 從 HTTP Status Code 判斷問題

當 API 發生錯誤時，第一步通常是確認伺服器回傳的 HTTP Status Code。

以下是開發時常見的幾種狀態碼：

| Status Code | 意義 | 常見排查方向 |
| --- | --- | --- |
| 200 | OK | 請求成功 |
| 201 | Created | 資源建立成功 |
| 204 | No Content | 請求成功，但沒有 Response Body |
| 301 / 302 | Redirect | 檢查重新導向位置 |
| 400 | Bad Request | 檢查 Request Body 或參數 |
| 401 | Unauthorized | 檢查登入狀態與 Token |
| 403 | Forbidden | 檢查權限 |
| 404 | Not Found | 檢查 API 路徑或資源 |
| 415 | Unsupported Media Type | 檢查 Content-Type |
| 500 | Internal Server Error | 檢查伺服器端錯誤 |

例如，當前端呼叫 API 得到 401 時，可以先使用 cURL 重現相同的請求，再檢查 Authorization Header、Cookie 與 Token 是否正確。

這樣就能初步判斷問題是發生在請求組裝、認證流程，還是伺服器端處理。

不過，如果遇到 CORS 問題，需要特別注意：

cURL 不會受到瀏覽器的 CORS 安全限制，因此即使 cURL 請求成功，也不代表瀏覽器端的 CORS 設定沒有問題。

這時仍然需要回到瀏覽器 DevTools 的 Network 與 Console 檢查。

## 6. 實際 API 除錯：重現後端提供的請求

這是我認為 cURL 在實際開發中最有價值的情境之一。

前後端合作時，後端可能會提供一段 API 範例：

```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

這時候不應該只是複製貼上，而是先理解這段指令：

1. Endpoint：`/auth/login`
2. Method：POST
3. Header：使用 JSON 格式。
4. Body：包含 email 與 password。
5. Response：需要確認回傳的狀態碼與資料結構。

接著可以直接在終端機執行，確認 API 是否正常回應。

如果 cURL 可以成功，但前端程式卻失敗，就可以進一步比較兩邊的請求：

- HTTP Method 是否一致？
- URL 是否正確？
- Header 是否有遺漏？
- Request Body 格式是否一致？
- Cookie 或 Token 是否有正確帶入？

這能讓 API 除錯更有方向，而不是只憑感覺修改前端程式。

### 一個實用的 API 除錯模板

最後整理一個可以在開發時使用的範例：

```bash
curl -sS -D - \
  -o response.txt \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  https://api.example.com/profile
```

這段指令可以：

- `-sS`：隱藏一般進度資訊，但保留錯誤訊息。
- `-D -`：將 Response Header 輸出到終端機。
- `-o response.txt`：將 Response Body 儲存到檔案。
- `-H`：設定 API 所需的 Header。

執行後，就能分別檢查 Response Header 與 Body，不需要將所有資訊混在一起閱讀。

實際使用時，記得將範例網址與 Token 換成自己的 API 資訊，也不要將真實 Token、密碼或 Cookie 上傳到公開程式碼或文章中。

## 7. 這次學到的事

回頭看這段學習過程，我覺得 Postman 與 cURL 帶給我的價值並不相同。

Postman 讓我可以快速建立請求、檢查結果；cURL 則讓我更直接地接觸 HTTP 請求的細節。

當你開始理解 Method、Header、Body、Cookie、Status Code，以及伺服器的 Response，就會發現 API 不再是一個只能透過工具操作的黑盒子。

你可以自己重現請求、比較前後端的差異，也能更精準地和後端討論問題。

對我來說，從 Postman 到 cURL，不只是多學會一個命令列工具，而是開始從「會使用 API」，走向「理解 API 如何運作」。

如果你目前也在學習 API，建議可以從後端提供的 cURL 範例開始，先實際執行一次，再逐一拆解每個參數的用途。

當你開始看懂這些指令，HTTP 請求就不再只是 Postman 裡的一個表單，而是可以觀察、驗證與除錯的工程流程。

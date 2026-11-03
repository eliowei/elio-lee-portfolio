---
title: 從 HTTP 請求到 TCP 連線：一次 API 呼叫究竟發生了什麼？
description: 從 cURL 到 DNS、TCP、TLS，我們一起把一次 API 呼叫拆解成一整段網路協定流程，理解 HTTP 背後其實不是單純的請求，而是整套連線與安全機制共同完成的。
date: 2025-05-22
category: js
tags: [HTTP, TCP, API, DNS, HTTPS, Networking]
readingTime: 7
draft: false
---

當你在終端機執行一段 cURL 時，通常只會看到一個請求，以及伺服器回傳的結果。

```bash
curl https://api.example.com/users
```

但這個請求真正發生時，並不是直接從電腦傳到伺服器這麼簡單。

在 HTTP Request 送出之前，系統可能已經完成網域解析、建立網路連線，以及 HTTPS 所需的安全協商。

這些步驟分別由不同的網路協定負責。

這篇筆記想從一次 API 呼叫出發，拆解 DNS、TCP、TLS 與 HTTP 之間的關係，並理解當請求失敗時，應該如何判斷問題發生在哪個階段。

## 1. 一次 API 呼叫，實際上經過哪些步驟？

先以這個 HTTPS 請求為例：

```bash
curl https://api.example.com/users
```

在一般使用 HTTP/1.1 或 HTTP/2 的情況下，可以先把流程理解成：

```text
Client
  |
  v
DNS 查詢
  |
  v
取得 Server IP
  |
  v
TCP 三次握手
  |
  v
TLS 握手
  |
  v
HTTP Request
  |
  v
Server 處理請求
  |
  v
HTTP Response
  |
  v
Client 接收資料
```

每個階段都有不同的責任：

- DNS：將網域名稱解析成 IP 位址。
- TCP：建立可靠的資料傳輸連線。
- TLS：建立加密通道並驗證伺服器身份。
- HTTP：定義請求與回應的格式及語意。

不過，這是用來理解流程的簡化模型。實際上，DNS 可能使用快取，TCP 連線也可能重複使用，不一定每次 API 呼叫都要從頭開始。

## 2. DNS：先找到伺服器的位置

當我們輸入：

```bash
https://api.example.com/users
```

電腦並不會直接使用 `api.example.com` 進行底層網路連線，而是需要取得對應的 IP 位址。

這就是 DNS（Domain Name System）的工作。

```text
api.example.com
       |
       v
    DNS 查詢
       |
       v
  203.0.113.42
```

DNS 負責將容易閱讀的網域名稱解析成 IP 位址，讓 Client 知道應該連線到哪個目的地。

但有一點需要注意：

**DNS 不代表每次請求都會重新查詢。**

作業系統、瀏覽器與 DNS Resolver 都可能保存解析結果，在快取有效期間直接使用先前取得的 IP。

### DNS 解析失敗會發生什麼事？

如果網域無法解析，請求可能會出現：

- `Could not resolve host`
- `Temporary failure in name resolution`
- `DNS_PROBE_FINISHED_NXDOMAIN`

這時候問題通常還沒進入 TCP 連線階段。

可以先使用：

```bash
nslookup api.example.com
```

或：

```bash
dig api.example.com
```

確認網域是否能正常解析。

## 3. TCP：透過三次握手建立連線

取得伺服器 IP 後，Client 還需要建立連線，才能傳輸資料。

在 HTTP/1.1 與 HTTP/2 over TCP 的情境下，這個工作由 TCP（Transmission Control Protocol）負責。

TCP 會透過三次握手（Three-way Handshake）建立連線：

```text
Client                  Server
  |                        |
  |-------- SYN ---------->|
  |                        |
  |<----- SYN + ACK -------|
  |                        |
  |-------- ACK ---------->|
  |                        |
  |     Connection Ready   |
```

三個步驟分別代表：

1. SYN：Client 表示想建立連線。
2. SYN-ACK：Server 確認收到請求，並回覆連線資訊。
3. ACK：Client 確認收到回應。

完成後，雙方就建立了 TCP 連線。

### TCP 為什麼重要？

TCP 不只是負責把資料送出去，也提供可靠傳輸機制，例如：

- 確認資料是否成功接收。
- 遺失的資料可以重新傳送。
- 確保資料依照正確順序交付。
- 透過流量控制與壅塞控制調整傳輸。

因此，HTTP 使用 TCP 時，不需要自行處理底層封包遺失與重新排序等問題。

如果 TCP 連線無法建立，可能會看到：

- `Connection refused`
- `Connection timed out`
- `No route to host`

這類問題可能與伺服器是否監聽指定 Port、網路路由、防火牆或服務狀態有關。

## 4. TLS：HTTPS 如何建立安全連線？

如果使用的是 `https://`，在 HTTP 資料傳送之前，還需要建立 TLS（Transport Layer Security）安全連線。

TLS 主要負責：

- 身份驗證：透過憑證驗證伺服器身份。
- 資料加密：避免傳輸內容被第三方直接讀取。
- 完整性保護：降低資料在傳輸過程中遭到竄改的風險。

以 TLS 1.3 的握手流程簡化說明：

```text
Client                  Server
  |                        |
  |----- ClientHello ----->|
  |                        |
  |<---- ServerHello ------|
  |<---- Certificate ------|
  |<---- Finished ---------|
  |                        |
  |----- Finished -------->|
  |                        |
  |   Secure Connection    |
```

實際訊息交換會依照 TLS 版本與協商情況有所不同，但核心目標是讓雙方協商出後續通訊使用的加密金鑰，並完成必要的身份驗證。

### TLS 失敗會發生什麼事？

例如：

- 憑證過期。
- 憑證與請求的網域不符。
- 憑證鏈無法驗證。
- TLS 版本或加密套件不相容。
- Proxy 或網路設備干擾握手。

這些情況可能導致 TLS 握手失敗。

此時 HTTP Request 通常還沒有真正送出。

也就是說，當 HTTPS 連線在 TLS 階段就失敗時，問題不一定是 API 本身，而可能是憑證或連線配置。

## 5. HTTP：正式送出 Request

當連線建立完成，HTTP 才開始傳送應用層資料。

例如：

```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

這個請求包含幾個重要部分：

| 項目 | 內容 |
| --- | --- |
| Method | POST |
| Path | /login |
| Header | Content-Type: application/json |
| Body | JSON 格式的登入資料 |

HTTP 負責定義這些資料的格式與語意，讓 Client 與 Server 能夠理解彼此的請求與回應。

例如：

- GET：取得資源。
- POST：提交資料或執行資源建立等操作。
- PUT：取代資源。
- PATCH：部分更新資源。
- DELETE：刪除資源。

這也是為什麼前面學習 cURL 時，會一直看到 Method、Header、Body 這些參數。

因為它們其實就是 HTTP Request 的重要組成部分。

## 6. Server 收到 Request 後會做什麼？

HTTP Request 抵達伺服器後，接下來才是後端應用程式的工作。

以登入 API 為例，可能經過以下流程：

```text
HTTP Request
     |
     v
Web Server / Reverse Proxy
     |
     v
Backend Application
     |
     v
驗證登入資料
     |
     v
查詢資料庫
     |
     v
產生 Token
     |
     v
HTTP Response
```

實際架構可能包含 Nginx、API Gateway、負載平衡器、應用伺服器，以及其他內部服務。

後端收到請求後，通常會：

1. 解析 HTTP Header 與 Body。
2. 驗證 Token、Session 或其他認證資訊。
3. 執行對應的業務邏輯。
4. 視需求存取資料庫或其他服務。
5. 組裝 HTTP Response 並回傳。

所以 HTTP Request 只是進入後端系統的入口，真正的資料處理與業務邏輯仍然由伺服器端負責。

## 7. HTTP Response：伺服器如何回傳結果？

當伺服器處理完成，就會將結果回傳給 Client。

例如：

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "abc123",
  "user": {
    "id": 1,
    "name": "Elio"
  }
}
```

Response 可以分成三個主要部分：

- Status Code：表示請求處理結果。
- Response Header：描述回應的相關資訊。
- Response Body：實際回傳的資料。

常見狀態碼包括：

| Status Code | 意義 |
| --- | --- |
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 204 | 請求成功，但沒有回應內容 |
| 400 | 請求格式或內容有問題 |
| 401 | 尚未通過身份驗證 |
| 403 | 沒有執行該操作的權限 |
| 404 | 找不到指定資源 |
| 500 | 伺服器內部錯誤 |

Client 收到 Response 後，才會進一步解析資料，交給前端應用程式使用。

## 8. 實際除錯：如何從錯誤判斷問題在哪一層？

理解整個流程後，最有價值的地方其實是除錯。

以前遇到 API 失敗時，可能只會先檢查 URL、Method 或參數。

但現在可以先判斷：請求到底有沒有成功進入 HTTP 階段？

| 階段 | 常見問題 | 可先檢查 |
| --- | --- | --- |
| DNS | 找不到網域 | `nslookup`、`dig` |
| TCP | 連線拒絕或逾時 | IP、Port、防火牆 |
| TLS | 憑證或握手失敗 | 憑證、TLS 設定 |
| HTTP | 400、401、403、404 | Method、Header、Body |
| Server | 500、服務異常 | 後端 Log、資料庫、服務狀態 |

### 使用 cURL 查看連線細節

如果想知道請求實際發生了什麼，可以使用：

```bash
curl -v https://api.example.com/users
```

`-v`（verbose）可以顯示更詳細的連線資訊，例如：

- DNS 解析後使用的 IP。
- TCP 連線建立過程。
- TLS 握手與憑證資訊。
- 送出的 Request Header。
- 收到的 Response Header。

如果只想確認 HTTP 狀態碼，也可以使用：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://api.example.com/users
```

這樣就能直接取得 HTTP Status Code。

需要注意的是，如果 DNS、TCP 或 TLS 階段就失敗，可能不會取得有效的 HTTP 狀態碼。

另外，`curl -v` 的輸出可能包含 Cookie、Authorization 等敏感資訊，分享除錯紀錄之前，記得先遮蔽。

## 9. 延伸理解：HTTP/1.1、HTTP/2 與 HTTP/3 的差異

前面介紹的 TCP 三次握手與 TLS 流程，主要是以常見的 HTTP/1.1、HTTP/2 over TCP 為例。

但 HTTP 並不是只有一種傳輸方式。

目前常見的版本可以簡單區分：

| 協定 | 傳輸基礎 | 主要特性 |
| --- | --- | --- |
| HTTP/1.1 | TCP | 支援持續連線，但多個請求的傳輸效率有限 |
| HTTP/2 | TCP | 支援多工傳輸，改善多個請求的處理效率 |
| HTTP/3 | QUIC（UDP） | 將傳輸與安全機制整合，改善連線建立與傳輸表現 |

其中最值得注意的是 HTTP/3。

它不再使用 TCP，而是採用 QUIC 作為傳輸基礎。

QUIC 建立在 UDP 之上，並整合 TLS 1.3 的安全機制，提供可靠傳輸、多工與連線管理等能力。

因此，並不是所有 HTTP 請求都一定會經過 TCP 三次握手。

這也說明了為什麼理解網路協定時，不能只把 HTTP、TCP 與 HTTPS 當成同一個層次的概念。

## 10. 這次學到的事

從一開始使用 cURL 測試 API，到進一步理解 DNS、TCP、TLS 與 HTTP，我發現真正需要掌握的不是某一個指令，而是整個請求的生命週期。

這次整理後，我認為有幾個重要觀念：

- DNS 負責解析網域，但不代表每次請求都會重新查詢。
- TCP 提供可靠傳輸，但 HTTP/3 使用的是 QUIC，而不是 TCP。
- HTTPS 不只是 HTTP 加密，而是透過 TLS 建立安全通訊。
- HTTP 負責定義 Request 與 Response 的格式及語意。
- API 發生錯誤時，應該先判斷問題發生在哪個網路或應用層級。

**真正理解 API，不只是知道怎麼發送請求，而是知道請求如何建立連線、如何傳輸，以及失敗時該從哪裡開始排查。**

這也是我從 cURL 延伸學習網路協定後，最大的收穫。

---
title: 'From Postman to cURL: When You Start Really Understanding HTTP Requests'
description: From testing APIs in Postman to understanding the HTTP behind the curl commands backend developers hand you, the practical cURL ideas I picked up along the way.
date: 2025-05-08
category: js
tags: [HTTP, cURL, API, Debugging, Postman]
readingTime: 8
draft: false
---

When I first started working with backend APIs, the tool I used most was Postman.

With its graphical interface you set the URL, HTTP method, headers and body, test the API quickly, and see the server's response directly.

But when actually working with backend developers, I found that what I sometimes received wasn't a Postman example but a cURL command.

At first I would just copy the command into the terminal and run it to check whether the API worked. Only gradually did I start to understand the parameters: why is an Authorization header needed? What does `Content-Type` affect? How do different request body formats change how the backend parses them?

These details made me look at HTTP requests afresh, and I realised cURL isn't just another way to test APIs, but a very practical way to reproduce requests and track down problems.

This note covers how I went from Postman to cURL, the commands I use most during development, and some ideas about debugging APIs.

## 1. How Postman and cURL differ

Postman wraps HTTP requests in a graphical interface, letting us set through forms:

- HTTP method: GET, POST, PUT, DELETE
- URL: where the API request goes
- Headers: request headers
- Body: the data sent
- Response: what the server returns

cURL, on the other hand, is a tool for sending network requests from the command line.

For example:

```bash
curl https://api.example.com/users
```

That is the most basic GET request.

The two don't replace each other:

- Postman: good for quickly building, organising and testing API requests.
- cURL: good for reproducing requests from the command line, checking parameters and debugging.

In real development, a cURL command from the backend can be run as is to check whether the API responds properly.

What really matters isn't which tool you choose, but whether you understand the HTTP request structure behind them.

## 2. Basic cURL requests: from GET to POST

The most basic part is the HTTP method.

### 2.1 GET: fetching data

```bash
curl https://api.example.com/users
```

This sends a GET request to the URL, usually to fetch data from the server.

If you need query parameters, put them straight in the URL:

```bash
curl "https://api.example.com/users?page=1&limit=10"
```

This is common for pagination, filtering and search.

### 2.2 POST: sending data

Suppose the backend provides an API for creating users:

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elio","email":"elio@example.com"}'
```

This command contains a few important settings:

- `-X POST`: sets the HTTP method to POST.
- `-H`: sets an HTTP header.
- `Content-Type: application/json`: tells the server the request body is JSON.
- `-d`: sends the request body.

One detail worth noting:

When no HTTP method is specified, `-d` on its own makes cURL use POST. So this also sends a POST:

```bash
curl https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elio"}'
```

So `-d` and `-X POST` aren't quite the same thing.

The former sends data; the latter explicitly sets the request method.

## 3. Headers and body: how does the server understand a request?

When I started building cURL commands myself, headers and the body were what I found most worth understanding.

### 3.1 Common headers

```bash
curl https://api.example.com/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

There are two common headers here:

**Authorization**

Carries the API credentials, such as a bearer token.

**Content-Type**

Describes the media type of the request body, so the server knows how to parse it.

Common formats include:

- `application/json`
- `application/x-www-form-urlencoded`
- `multipart/form-data`

If an API returns 401 or 415, sometimes the problem isn't the code's logic but credentials or a data format that doesn't match what the backend expects.

### 3.2 JSON vs form data

Both of these requests send data, but in different formats.

**JSON:**

```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

**application/x-www-form-urlencoded:**

```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "email=user@example.com&password=123456"
```

The difference is how the data is encoded.

JSON sends the data as JSON; `application/x-www-form-urlencoded` encodes it like URL query parameters.

`multipart/form-data`, common for file uploads, is yet another format, and you can build a form request with `-F`:

```bash
curl https://api.example.com/upload \
  -F "file=@./image.png"
```

With `-F`, cURL handles the multipart boundary automatically, and you don't need to set `Content-Type` yourself.

These formats aren't just syntactic differences; they directly affect how the server parses the request body.

## 4. Common cURL debugging options

Once I really started using cURL, what struck me most was that it doesn't just send requests; it also helps you observe the HTTP exchange.

### 4.1 `-v`: detailed connection information

```bash
curl -v https://api.example.com/profile
```

`-v` is verbose mode and shows more detail, such as:

- DNS and the connection process
- TLS handshake information
- Request headers
- Response headers
- The HTTP protocol and server response information

When you hit connection failures, certificate problems or unexpected status codes, this is a very useful starting point.

### 4.2 `-i`: show response headers and body together

```bash
curl -i https://api.example.com/profile
```

`-i` includes the response headers in the output.

For example, you can look at:

- `Content-Type`
- `Set-Cookie`
- `Location`
- The HTTP status code

If you only want the response headers, you can also use:

```bash
curl -I https://api.example.com/profile
```

`-I` here sends a HEAD request, which usually returns only the response headers and no body.

Note that HEAD and GET are different HTTP methods, and the server has to support HEAD properly.

### 4.3 `-sS` and `-w`: just the status code

Sometimes you only want to check the status code the API returns, without the whole response body.

You can use:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://api.example.com/profile
```

What the options do:

- `-s`: turns off progress and general messages.
- `-S`: with silent mode, still shows error messages when something goes wrong.
- `-o /dev/null`: doesn't output the response body.
- `-w`: customises the output once the request completes.
- `%{http_code}`: outputs the HTTP status code.

For example, an output of:

```bash
200
```

means this HTTP request received a 200 status code.

But an HTTP status code is the server's response; it doesn't mean the whole business process necessarily succeeded.

### 4.4 `-L`: follow redirects automatically

```bash
curl -L https://example.com
```

`-L` means follow redirects.

When the server returns a redirect such as 301 or 302, cURL keeps going and requests the redirected URL.

This is helpful when testing site redirects, login flows or API redirects.

### 4.5 `-b`: sending cookies

```bash
curl https://api.example.com/orders \
  -b "session=abc123"
```

`-b` sends cookies.

If an API requires a logged-in state, you can pass credentials via a cookie or the Authorization header; which one depends on how the backend's authentication is designed.

For example:

```bash
curl https://api.example.com/orders \
  -b "session=abc123" \
  -H "Authorization: Bearer <token>"
```

This example sends both a cookie and a bearer token.

In practice you don't necessarily need both; follow the API's authentication spec.

## 5. Diagnosing problems from the HTTP status code

When an API call fails, the first step is usually to check the status code the server returned.

These are the status codes you meet most during development:

| Status code | Meaning | Where to look |
| --- | --- | --- |
| 200 | OK | The request succeeded |
| 201 | Created | A resource was created |
| 204 | No Content | Succeeded, with no response body |
| 301 / 302 | Redirect | Check where it redirects to |
| 400 | Bad Request | Check the request body or parameters |
| 401 | Unauthorized | Check the login state and token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check the API path or resource |
| 415 | Unsupported Media Type | Check Content-Type |
| 500 | Internal Server Error | Check for server-side errors |

For example, when the frontend gets a 401 from an API, you can first reproduce the same request with cURL, then check whether the Authorization header, cookies and token are correct.

That gives you a first idea of whether the problem is in how the request is built, in the authentication flow, or on the server.

However, with CORS problems, take special care:

cURL isn't subject to the browser's CORS restrictions, so even if a cURL request succeeds, that doesn't mean the browser-side CORS configuration is fine.

In that case you still need to go back to the Network and Console panels in the browser's DevTools.

## 6. Debugging an API in practice: reproducing the backend's request

This is one of the situations where I think cURL is most valuable in real development.

When frontend and backend work together, the backend may provide an API example like this:

```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

Rather than just copying and pasting, first understand the command:

1. Endpoint: `/auth/login`
2. Method: POST
3. Header: uses JSON.
4. Body: contains email and password.
5. Response: check the returned status code and data structure.

Then run it in the terminal to check whether the API responds properly.

If cURL succeeds but the frontend code fails, you can compare the two requests:

- Is the HTTP method the same?
- Is the URL correct?
- Are any headers missing?
- Is the request body format the same?
- Are the cookie or token sent correctly?

This gives API debugging a direction, rather than changing frontend code on a hunch.

### A handy API debugging template

Finally, an example you can use during development:

```bash
curl -sS -D - \
  -o response.txt \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  https://api.example.com/profile
```

This command:

- `-sS`: hides general progress information but keeps error messages.
- `-D -`: writes the response headers to the terminal.
- `-o response.txt`: saves the response body to a file.
- `-H`: sets the headers the API needs.

After running it, you can check the response headers and body separately, instead of reading everything mixed together.

When you use it, remember to replace the example URL and token with your own API details, and never put real tokens, passwords or cookies in public code or articles.

## 7. What I learned

Looking back, I think Postman and cURL gave me different things.

Postman let me build requests and check results quickly; cURL brought me closer to the details of HTTP requests.

Once you start to understand methods, headers, bodies, cookies, status codes and the server's response, you find that an API is no longer a black box you can only operate through a tool.

You can reproduce requests yourself, compare the frontend and backend, and discuss problems with backend developers more precisely.

For me, going from Postman to cURL wasn't just learning another command-line tool; it was the start of moving from "knowing how to use an API" to "understanding how an API works".

If you are learning about APIs too, I suggest starting with the cURL examples the backend gives you: run one first, then take apart what each option does.

Once you can read these commands, an HTTP request is no longer just a form in Postman but an engineering process you can observe, verify and debug.

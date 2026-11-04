---
title: 'From HTTP Request to TCP Connection: What Actually Happens in One API Call?'
description: From cURL to DNS, TCP and TLS, breaking one API call down into its full chain of network protocols, to see that behind HTTP is not a single request but a whole set of connection and security mechanisms working together.
date: 2025-05-22
category: js
tags: [HTTP, TCP, API, DNS, HTTPS, Networking]
readingTime: 7
draft: false
---

When you run a cURL command in the terminal, you usually only see one request and the result the server sends back.

```bash
curl https://api.example.com/users
```

But when that request actually happens, it isn't as simple as going straight from your computer to the server.

Before the HTTP request is sent, the system may already have resolved the domain name, established a network connection and completed the security negotiation HTTPS requires.

Each of these steps is handled by a different network protocol.

This note starts from a single API call, breaks down how DNS, TCP, TLS and HTTP relate to each other, and looks at how to tell which stage a failed request broke at.

## 1. Which steps does one API call actually go through?

Take this HTTPS request as an example:

```bash
curl https://api.example.com/users
```

In the usual case of HTTP/1.1 or HTTP/2, you can think of the flow like this:

```text
Client
  |
  v
DNS lookup
  |
  v
Get the server IP
  |
  v
TCP three-way handshake
  |
  v
TLS handshake
  |
  v
HTTP request
  |
  v
Server handles the request
  |
  v
HTTP response
  |
  v
Client receives the data
```

Each stage has a different job:

- DNS: resolves the domain name to an IP address.
- TCP: establishes a reliable connection for transferring data.
- TLS: sets up an encrypted channel and verifies the server's identity.
- HTTP: defines the format and meaning of requests and responses.

This is a simplified model for understanding the flow, though. In practice, DNS may be cached and TCP connections may be reused, so not every API call starts from scratch.

## 2. DNS: first, find where the server is

When we enter:

```bash
https://api.example.com/users
```

the computer doesn't use `api.example.com` directly for the low-level network connection; it needs the matching IP address.

That is the job of DNS (Domain Name System).

```text
api.example.com
       |
       v
   DNS lookup
       |
       v
  203.0.113.42
```

DNS resolves human-readable domain names to IP addresses, so the client knows where to connect.

But one thing to note:

**DNS doesn't mean a fresh lookup on every request.**

The operating system, the browser and the DNS resolver may all keep resolution results and reuse the previously obtained IP while the cache is valid.

### What happens when DNS resolution fails?

If the domain can't be resolved, the request may fail with:

- `Could not resolve host`
- `Temporary failure in name resolution`
- `DNS_PROBE_FINISHED_NXDOMAIN`

At this point, the problem usually hasn't even reached the TCP connection stage.

You can start with:

```bash
nslookup api.example.com
```

or:

```bash
dig api.example.com
```

to check whether the domain resolves properly.

## 3. TCP: establishing a connection with the three-way handshake

Once the client has the server's IP, it still needs to establish a connection before it can transfer data.

For HTTP/1.1 and HTTP/2 over TCP, that is the job of TCP (Transmission Control Protocol).

TCP establishes a connection with a three-way handshake:

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

The three steps mean:

1. SYN: the client says it wants to connect.
2. SYN-ACK: the server acknowledges the request and replies with its connection details.
3. ACK: the client acknowledges the reply.

After that, the two sides have a TCP connection.

### Why does TCP matter?

TCP doesn't just send data; it also provides reliable delivery, for example:

- Confirming whether data was received.
- Retransmitting lost data.
- Delivering data in the right order.
- Adjusting transmission with flow control and congestion control.

So when HTTP runs over TCP, it doesn't have to deal with low-level packet loss and reordering itself.

If the TCP connection can't be established, you may see:

- `Connection refused`
- `Connection timed out`
- `No route to host`

Problems like these may relate to whether the server is listening on the given port, network routing, firewalls or the state of the service.

## 4. TLS: how does HTTPS establish a secure connection?

If you use `https://`, a TLS (Transport Layer Security) connection has to be established before any HTTP data is sent.

TLS is mainly responsible for:

- Authentication: verifying the server's identity with a certificate.
- Encryption: preventing third parties from reading what is transmitted.
- Integrity: reducing the risk of data being tampered with in transit.

A simplified view of the TLS 1.3 handshake:

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

The actual messages exchanged vary with the TLS version and negotiation, but the core goal is for both sides to agree on the encryption keys for the rest of the communication and complete the necessary authentication.

### What happens when TLS fails?

For example:

- The certificate has expired.
- The certificate doesn't match the requested domain.
- The certificate chain can't be verified.
- The TLS versions or cipher suites aren't compatible.
- A proxy or network device interferes with the handshake.

Any of these can make the TLS handshake fail.

At that point, the HTTP request usually hasn't actually been sent yet.

In other words, when an HTTPS connection fails at the TLS stage, the problem isn't necessarily the API itself; it may be the certificate or the connection configuration.

## 5. HTTP: actually sending the request

Once the connection is established, HTTP starts sending application-layer data.

For example:

```bash
curl -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

This request contains a few important parts:

| Item | Content |
| --- | --- |
| Method | POST |
| Path | /login |
| Header | Content-Type: application/json |
| Body | Login data in JSON |

HTTP defines the format and meaning of this data, so the client and server can understand each other's requests and responses.

For example:

- GET: retrieve a resource.
- POST: submit data or perform operations such as creating a resource.
- PUT: replace a resource.
- PATCH: partially update a resource.
- DELETE: delete a resource.

That is why, when learning cURL, you keep seeing parameters such as the method, headers and body.

They are in fact the key parts of an HTTP request.

## 6. What does the server do once it receives the request?

Once the HTTP request reaches the server, it is the backend application's turn.

For a login API, the flow might be:

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
Validate login data
     |
     v
Query the database
     |
     v
Generate a token
     |
     v
HTTP Response
```

The real architecture may include Nginx, an API gateway, a load balancer, application servers and other internal services.

After receiving the request, the backend usually:

1. Parses the HTTP headers and body.
2. Verifies the token, session or other credentials.
3. Runs the relevant business logic.
4. Accesses the database or other services as needed.
5. Builds and sends the HTTP response.

So the HTTP request is only the entry point into the backend; the actual data processing and business logic are still handled on the server.

## 7. The HTTP response: how does the server send back the result?

When the server is done, it sends the result back to the client.

For example:

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

A response has three main parts:

- Status code: the outcome of the request.
- Response headers: information about the response.
- Response body: the data actually returned.

Common status codes include:

| Status code | Meaning |
| --- | --- |
| 200 | The request succeeded |
| 201 | A resource was created |
| 204 | The request succeeded, with no content in the response |
| 400 | Something is wrong with the request's format or content |
| 401 | Not yet authenticated |
| 403 | No permission to perform the operation |
| 404 | The resource wasn't found |
| 500 | Internal server error |

Only once the client receives the response does it parse the data and hand it to the frontend application.

## 8. Debugging in practice: which layer does an error point to?

Once you understand the whole flow, the most valuable part is debugging.

When an API call failed, I used to check only the URL, method or parameters first.

Now I can first ask: did the request actually make it to the HTTP stage?

| Stage | Common problem | Check first |
| --- | --- | --- |
| DNS | Domain not found | `nslookup`, `dig` |
| TCP | Connection refused or timed out | IP, port, firewall |
| TLS | Certificate or handshake failure | Certificate, TLS settings |
| HTTP | 400, 401, 403, 404 | Method, headers, body |
| Server | 500, service problems | Backend logs, database, service status |

### Seeing connection details with cURL

To see what actually happens during a request, use:

```bash
curl -v https://api.example.com/users
```

`-v` (verbose) shows more detailed connection information, such as:

- The IP used after DNS resolution.
- How the TCP connection was established.
- The TLS handshake and certificate details.
- The request headers sent.
- The response headers received.

If you only want the HTTP status code, you can use:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://api.example.com/users
```

This gives you the HTTP status code directly.

Note that if the DNS, TCP or TLS stage fails, you may not get a valid HTTP status code at all.

Also, the output of `curl -v` may include sensitive information such as cookies and the Authorization header, so mask it before sharing debugging logs.

## 9. Going further: HTTP/1.1 vs HTTP/2 vs HTTP/3

The TCP three-way handshake and TLS flow above mainly use the common case of HTTP/1.1 and HTTP/2 over TCP.

But HTTP doesn't have just one way of being transported.

The common versions today can be summarised like this:

| Protocol | Transport | Main characteristics |
| --- | --- | --- |
| HTTP/1.1 | TCP | Supports persistent connections, but transferring many requests is less efficient |
| HTTP/2 | TCP | Supports multiplexing, handling many requests more efficiently |
| HTTP/3 | QUIC (UDP) | Integrates transport and security, improving connection setup and transfer performance |

HTTP/3 is the one most worth noting.

It no longer uses TCP, but QUIC as its transport.

QUIC is built on UDP and integrates TLS 1.3's security, providing reliable delivery, multiplexing and connection management.

So not every HTTP request necessarily goes through a TCP three-way handshake.

This also shows why, when learning network protocols, you can't treat HTTP, TCP and HTTPS as concepts at the same level.

## 10. What I learned

From first testing APIs with cURL to understanding DNS, TCP, TLS and HTTP, I realised that what really needs mastering isn't any single command, but the whole lifecycle of a request.

After writing this up, I think a few ideas matter most:

- DNS resolves domains, but that doesn't mean every request does a fresh lookup.
- TCP provides reliable delivery, but HTTP/3 uses QUIC rather than TCP.
- HTTPS isn't just HTTP with encryption; it establishes secure communication through TLS.
- HTTP defines the format and meaning of requests and responses.
- When an API fails, first work out which network or application layer the problem is in.

**Really understanding an API isn't just knowing how to send a request, but knowing how the request establishes a connection, how it is transmitted, and where to start investigating when it fails.**

That is the biggest thing I gained from going from cURL on to network protocols.

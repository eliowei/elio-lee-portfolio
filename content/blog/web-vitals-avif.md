---
title: 生產環境 Web Vitals 調校：Nuxt Image 搭配 AVIF 達到極速 LCP
description: 透過 CDN Edge 動態轉碼與預載入，將產品首頁 LCP 從 2.8 秒壓縮至 0.9 秒。
date: 2025-01-14
category: perf
tags: [LCP, IPX Edge]
readingTime: 5
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

LCP 直接影響搜尋引擎排名與使用者留存。

## 圖片管線

將 4.2MB 原圖轉為 AVIF 後僅約 85KB：

```vue
<NuxtImg src="/hero.jpg" format="avif" width="1200" fetchpriority="high" />
```

## 預載入與快取

- 首屏圖片加上 `fetchpriority="high"`
- CDN 設定長效快取與 immutable
- 明確指定寬高避免 CLS

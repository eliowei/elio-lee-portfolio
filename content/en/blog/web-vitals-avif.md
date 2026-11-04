---
title: 'Tuning Web Vitals in Production: Fast LCP with Nuxt Image and AVIF'
description: Using on-the-fly CDN edge transcoding and preloading to cut a product home page's LCP from 2.8 s to 0.9 s.
date: 2025-01-14
category: quality
tags: [LCP, IPX Edge]
readingTime: 5
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

LCP directly affects search rankings and user retention.

## The image pipeline

A 4.2 MB original image is only about 85 KB once converted to AVIF:

```vue
<NuxtImg src="/hero.jpg" format="avif" width="1200" fetchpriority="high" />
```

## Preloading and caching

- Add `fetchpriority="high"` to above-the-fold images
- Configure long-lived, immutable caching on the CDN
- Set explicit width and height to avoid CLS

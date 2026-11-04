---
title: 本番環境の Web Vitals チューニング：Nuxt Image と AVIF で LCP を高速化
description: CDN エッジでの動的な変換とプリロードにより、プロダクトのトップページの LCP を 2.8 秒から 0.9 秒に短縮しました。
date: 2025-01-14
category: quality
tags: [LCP, IPX Edge]
readingTime: 5
draft: true # 範例文章（非本人內容），換成正式文章後移除這行
---

LCP は検索順位とユーザーの定着率に直接影響します。

## 画像パイプライン

4.2MB の元画像は、AVIF に変換するとわずか約 85KB になります：

```vue
<NuxtImg src="/hero.jpg" format="avif" width="1200" fetchpriority="high" />
```

## プリロードとキャッシュ

- ファーストビューの画像に `fetchpriority="high"` を付ける
- CDN で長期間の immutable キャッシュを設定する
- 幅と高さを明示して CLS を防ぐ

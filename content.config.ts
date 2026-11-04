import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const schema = z.object({
  date: z.string(),
  // 最後一次實質修改（改錯字不算）。會輸出成 JSON-LD 的 dateModified 與 sitemap 的 lastmod；沒填就用 date。
  updated: z.string().optional(),
  category: z.enum(['js', 'vue', 'gis', 'case', 'quality']),
  tags: z.array(z.string()),
  readingTime: z.number(),
  // 草稿不會列在技術筆記、sitemap，正式環境直接 404；開發環境可用網址預覽版型。
  draft: z.boolean().default(false),
})

const legalSchema = z.object({ updated: z.string() })

// 每個語言一個 collection，檔名（slug）三語相同，切換語言時網址才對得上。
export default defineContentConfig({
  collections: {
    blog: defineCollection({ type: 'page', source: 'blog/*.md', schema }),
    blog_en: defineCollection({ type: 'page', source: 'en/blog/*.md', schema }),
    blog_ja: defineCollection({ type: 'page', source: 'ja/blog/*.md', schema }),
    // Privacy / terms / disclaimer / corrections. `updated` is shown on the page; bump it whenever the text changes.
    legal: defineCollection({ type: 'page', source: 'legal/*.md', schema: legalSchema }),
    legal_en: defineCollection({ type: 'page', source: 'en/legal/*.md', schema: legalSchema }),
    legal_ja: defineCollection({ type: 'page', source: 'ja/legal/*.md', schema: legalSchema }),
  },
})

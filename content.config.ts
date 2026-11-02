import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        date: z.string(),
        category: z.enum(['js', 'vue', 'nuxt', 'debug', 'perf', 'quality']),
        tags: z.array(z.string()),
        readingTime: z.number(),
        // 草稿不會列在技術筆記、sitemap，正式環境直接 404；開發環境可用網址預覽版型。
        draft: z.boolean().default(false),
      }),
    }),
  },
})

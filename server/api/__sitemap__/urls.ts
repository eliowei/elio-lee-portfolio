import { queryCollection } from '@nuxt/content/server'
import { projects } from '../../../app/data/home'
import { legalLinks } from '../../../app/data/site'

// 每個語言列出一份；中文沒有前綴。
const prefixes = ['', '/en', '/ja']

export default defineSitemapEventHandler(async (event) => {
  const posts = (await Promise.all((['blog', 'blog_en', 'blog_ja'] as const)
    .map(c => queryCollection(event, c).where('draft', '=', false).all()))).flat()
  return [
    ...prefixes.flatMap(l => [
      { loc: `${l}/projects` },
      { loc: `${l}/contact` },
      ...legalLinks.map(p => ({ loc: `${l}/legal/${p}` })),
      ...projects.map(p => ({ loc: `${l}/projects/${p.slug}` })),
    ]),
    ...posts.map(p => ({ loc: p.path, lastmod: p.updated ?? p.date })),
  ]
})

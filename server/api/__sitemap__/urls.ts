import { queryCollection } from '@nuxt/content/server'
import { projects } from '../../../app/data/home'

export default defineSitemapEventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog').where('draft', '=', false).all()
  return [
    { loc: '/projects' },
    { loc: '/contact' },
    ...projects.map(p => ({ loc: `/projects/${p.slug}` })),
    ...posts.map(p => ({ loc: p.path, lastmod: p.date })),
  ]
})

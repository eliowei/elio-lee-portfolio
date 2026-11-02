export const site = {
  name: '李柏偉 Elio Lee',
  title: '前端工程師',
  // 只放確實存在的聯絡方式。TODO: 之後有 Email / LinkedIn 再填入，頁面會自動顯示。
  email: '',
  github: 'https://github.com/eliowei', // 取自 elioflowra.com 專案頁連結的 repo 擁有者
  linkedin: '',
  // 目前唯一的聯絡管道：elioflowra.com 的合作洽詢表單。有 Email 後以 Email 為主。
  contactForm: 'https://elioflowra.com/contact',
}

/** Primary "contact me" target: email when available, otherwise the contact form. */
export const contactHref = site.email ? `mailto:${site.email}` : site.contactForm

export const navLinks = [
  { label: '作品', to: '/projects' },
  { label: '經歷', to: '/experience' },
  { label: '筆記', to: '/blog' },
]

export const categories = {
  js: 'JavaScript 核心概念',
  vue: 'Vue 響應式與組件',
  nuxt: 'Nuxt 架構探索',
  debug: '前端除錯紀錄',
  perf: '效能調校與 SEO',
  quality: '前端工程化與品質',
} as const

export const site = {
  name: '李柏偉 Elio Lee',
  title: '前端工程師',
  // 只放確實存在的聯絡方式。TODO: 之後有 Email / LinkedIn 再填入，頁面會自動顯示。聯絡表單在 /contact。
  email: '',
  github: 'https://github.com/eliowei', // 取自 elioflowra.com 專案頁連結的 repo 擁有者
  linkedin: '',
}

export const navLinks = [
  { label: '作品', to: '/projects' },
  { label: '經歷', to: '/experience' },
  { label: '筆記', to: '/blog' },
  { label: '聯絡', to: '/contact' },
]

export const categories = {
  js: 'JavaScript',
  vue: 'Vue / Nuxt',
  case: '實戰紀錄',
  quality: '工程品質與資安',
} as const

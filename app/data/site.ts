export const site = {
  name: '李柏偉 Elio Lee',
  title: '前端工程師',
  // 只放確實存在的聯絡方式。TODO: 之後有 Email / LinkedIn 再填入，頁面會自動顯示。聯絡表單在 /contact。
  email: '',
  github: 'https://github.com/eliowei', // 取自 elioflowra.com 專案頁連結的 repo 擁有者
  linkedin: '',
}

// 標籤文字在 i18n/locales/*.json 的 nav.<key>；分類名稱在 categories.<key>。
export const navLinks = [
  { key: 'projects', to: '/projects' },
  { key: 'experience', to: '/experience' },
  { key: 'blog', to: '/blog' },
  { key: 'contact', to: '/contact' },
]

// 頁尾「法律與信任」。標籤在 legal.<key>；內容在 content/{,en/,ja/}legal/<key>.md。
export const legalLinks = ['privacy', 'terms', 'disclaimer', 'corrections'] as const

export const categories = ['js', 'vue', 'gis', 'case', 'quality'] as const

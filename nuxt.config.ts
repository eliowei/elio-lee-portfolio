const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://portfolio.elioflowra.com/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/sitemap', '@nuxt/image'],
  // 中文維持原網址，英文 /en/...、日文 /ja/...。不做瀏覽器語言自動轉址：首頁有 ISR 快取，轉址會讓快取錯亂。
  // 文案：介面字串在 i18n/locales/*.json；頁面資料在 app/data/{,en/,ja/}；筆記在 content/{,en/,ja/}blog。
  i18n: {
    baseUrl: siteUrl.replace(/\/$/, ''),
    defaultLocale: 'zh',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      { code: 'zh', language: 'zh-Hant', name: '中文', file: 'zh.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' },
    ],
  },
  image: {
    // <NuxtPicture> emits AVIF first, then WebP, then the original format as the fallback.
    format: ['avif', 'webp'],
    quality: 70, // AVIF at ~70 is visually close to the source for screenshots
    // Remote images that may be optimised (the profile photo); local images come from /public.
    domains: ['lh3.googleusercontent.com'],
  },
  content: {
    experimental: { nativeSqlite: true }, // node:sqlite (Node >= 22.5); avoids native better-sqlite3
    // Code blocks sit on a dark (#09090B) container, so use the dark theme only (light-theme tokens are unreadable there).
    build: { markdown: { highlight: { theme: 'github-dark' } } },
  },
  // Route changes run inside document.startViewTransition (skipped for reduced motion / unsupported browsers).
  // Project covers morph between home, /projects and the case study via `view-transition-name`.
  experimental: { viewTransition: true },
  css: ['~/assets/css/main.css'],
  tailwindcss: { cssPath: '~/assets/css/main.css' },

  site: { url: siteUrl, name: '李柏偉 Elio Lee' },
  // EmailJS keys are public by design; filled from NUXT_PUBLIC_EMAILJS_* (see .env.example).
  runtimeConfig: { public: { siteUrl, emailjs: { serviceId: '', templateId: '', publicKey: '' } } },
  sitemap: { sources: ['/api/__sitemap__/urls'] },

  // ISR: needs a host preset that supports it (vercel / netlify); a no-op on `node-server`.
  routeRules: {
    '/': { isr: 3600 },
    '/blog': { isr: 3600 },
    '/blog/**': { isr: 3600 },
    ...Object.fromEntries(['en', 'ja'].flatMap(l => [`/${l}`, `/${l}/blog`, `/${l}/blog/**`].map(r => [r, { isr: 3600 }]))),
  },

  app: {
    head: {
      link: [
        // Files in public/: SVG for modern browsers, PNG / ICO as fallbacks, apple-touch-icon for iOS home screens.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0,0&display=swap',
        },
      ],
    },
  },
})

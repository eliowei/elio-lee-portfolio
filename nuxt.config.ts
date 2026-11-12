const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://portfolio.elioflowra.com/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@nuxt/scripts', '@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/sitemap', '@nuxt/image'],
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
    // Code blocks sit on a dark (#09090B) container in both themes, so use a dark theme only. github-dark-default (not github-dark): its comment colour passes 4.5:1 on that container.
    build: { markdown: { highlight: { theme: 'github-dark-default' } } },
  },
  // Route changes run inside document.startViewTransition (skipped for reduced motion / unsupported browsers).
  // Project covers morph between home, /projects and the case study via `view-transition-name`.
  experimental: { viewTransition: true },
  // All fonts are self-hosted from public/fonts (no external font CSS): scripts/fetch-fonts.py (Latin + icons), scripts/subset-font.py (Noto Sans TC).
  css: ['~/assets/css/theme.css', '~/assets/css/latin-fonts.generated.css', '~/assets/css/noto-sans-tc.generated.css', '~/assets/css/main.css'],
  tailwindcss: { cssPath: '~/assets/css/main.css' },

  site: { url: siteUrl, name: '李柏偉 Elio Lee' },
  // EmailJS keys are public by design; filled from NUXT_PUBLIC_EMAILJS_* (see .env.example).
  // gtmId / ga4Id are public by design and can be overridden with NUXT_PUBLIC_GTM_ID / NUXT_PUBLIC_GA4_ID. Never leave them
  // empty: @nuxt/scripts skips a script with invalid options (dev: only an info log), which looks like "not loading".
  runtimeConfig: { public: { siteUrl, gtmId: 'GTM-KT7VR4Q3', ga4Id: 'G-6P4Z8FF93C', emailjs: { serviceId: '', templateId: '', publicKey: '' } } },
  sitemap: { sources: ['/api/__sitemap__/urls'] },

  // ISR: needs a host preset that supports it (vercel / netlify); a no-op on `node-server`.
  routeRules: {
    '/': { isr: 3600 },
    '/blog': { isr: 3600 },
    '/blog/**': { isr: 3600 },
    ...Object.fromEntries(['en', 'ja'].flatMap(l => [`/${l}`, `/${l}/blog`, `/${l}/blog/**`].map(r => [r, { isr: 3600 }]))),
  },

  // Precompress /_nuxt assets (gzip + brotli) so `node-server` previews match what a CDN would serve.
  nitro: { compressPublicAssets: true },

  hooks: {
    // The three.js scene only runs on wide, capable screens; stop Nuxt from prefetching its ~570 KB chunk on every visit
    // (phones never use it and it competes with the page for bandwidth). It is still fetched on demand.
    'build:manifest': (manifest) => {
      for (const [key, entry] of Object.entries(manifest)) {
        if (/space-scene|node_modules\/three\//.test(key)) entry.prefetch = entry.preload = false
      }
    },
  },

  app: {
    head: {
      // Theme before first paint (no flash of the wrong theme): saved choice, else the OS preference. Keep in sync with useTheme.ts.
      script: [{
        // Opening sequence on the home page (see Space.vue): every full load of the home page, never for reduced motion, a hash or a query (so coming back from a case study does not replay it).
        // `data-intro="1"` on <html> switches the CSS animations on; Space.vue sets it to "done" when they have finished (or on the first input), and this timer does so after 4.5 s at the latest.
        innerHTML: "(function(){try{var p=location.pathname.replace(/\\/$/,'');if(['','/en','/ja'].indexOf(p)<0||location.hash||location.search||matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.dataset.intro='1';setTimeout(function(){d.dataset.intro='done'},4500)}catch(e){}})()",
        tagPosition: 'head',
      }, {
        innerHTML: "(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t})()",
        tagPosition: 'head',
      }],
      link: [
        // Files in public/: a 96px PNG and an ICO for browser tabs (the old favicon.svg was a 1.7 MB PNG inside an SVG wrapper), apple-touch-icon for iOS home screens.
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
})

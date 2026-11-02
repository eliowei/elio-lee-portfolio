const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://alexchen.dev'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss', '@nuxtjs/sitemap', '@nuxt/image'],
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
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      link: [
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

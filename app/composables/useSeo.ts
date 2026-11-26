import { pageTitle } from '~/data/site'

/** 站台網址，不含結尾斜線。 */
export const useSiteUrl = () => String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')

/** 目前頁面的完整網址（og:url 用；canonical / hreflang 由 i18n 的 useLocaleHead 產生）。 */
export const usePageUrl = () => `${useSiteUrl()}${useRoute().path}`

/**
 * 內頁共用的 meta：標題加站名後綴，og:* 跟著標題與描述。回傳完整標題。
 * 只收每頁都有的欄位；其他標籤（分享圖、robots…）由頁面自己再呼叫 useSeoMeta。
 */
export function usePageSeo(page: { title: string; description?: string; type?: 'website' | 'article' }) {
  const title = pageTitle(page.title)
  useSeoMeta({ title, description: page.description, ogTitle: title, ogDescription: page.description, ogType: page.type ?? 'website', ogUrl: usePageUrl() })
  return title
}

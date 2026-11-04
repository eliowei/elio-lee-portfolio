import * as zhHome from '~/data/home'
import * as zhExperience from '~/data/experience'
import * as zhNotes from '~/data/notes'
import { projectImages } from '~/data/project-images'
import * as enHome from '~/data/en/home'
import * as enExperience from '~/data/en/experience'
import * as enNotes from '~/data/en/notes'
import * as jaHome from '~/data/ja/home'
import * as jaExperience from '~/data/ja/experience'
import * as jaNotes from '~/data/ja/notes'

type Data = typeof zh
type Locale = 'zh' | 'en' | 'ja'

// 圖說以中文為 key 對照翻譯；沒有翻譯的維持中文。
const withCaptions = (captions: Record<string, string>) => Object.fromEntries(Object.entries(projectImages).map(([slug, v]) => [slug, {
  cover: v.cover,
  gallery: v.gallery.map(g => ({ ...g, caption: g.caption && (captions[g.caption] ?? g.caption) })),
}])) as typeof projectImages

const zh = { ...zhHome, ...zhExperience, ...zhNotes, projectImages }
const data: Record<Locale, Data> = {
  zh,
  en: { ...enHome, ...enExperience, ...enNotes, projectImages: withCaptions(enHome.captions) },
  ja: { ...jaHome, ...jaExperience, ...jaNotes, projectImages: withCaptions(jaHome.captions) },
}

/**
 * 目前語言的頁面資料。回傳一般物件（非 reactive）：切換語言會換路由、頁面重新建立，所以在 setup 讀一次就夠。
 * 常駐的 layout（header / footer）不會重建，那裡改用 `t()`。
 */
export const useData = () => data[useNuxtApp().$i18n.locale.value as Locale]

/** 目前語言的筆記 collection。 */
export const useBlogCollection = () => {
  const l = useNuxtApp().$i18n.locale.value as Locale
  return l === 'zh' ? 'blog' : (`blog_${l}` as const)
}

/** 目前語言的法律頁 collection。 */
export const useLegalCollection = () => {
  const l = useNuxtApp().$i18n.locale.value as Locale
  return l === 'zh' ? 'legal' : (`legal_${l}` as const)
}

/** 目前頁面的完整網址（og:url 用；canonical / hreflang 由 i18n 的 useLocaleHead 產生）。 */
export const usePageUrl = () => `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}${useRoute().path}`

// 首頁文案與專案資料。專案詳情頁（/projects/[slug]）也讀這份 `projects`。
export const hero = {
  eyebrow: 'Frontend Engineer · Creative Development',
  title: ['以程式實現想法', '讓互動創造更多'],
  titleAccent: '更多', // the part of the second line set in signal orange (its ending)
  intro: '專注於前端開發與互動實作，運用現代前端技術，打造兼具效能、可用性與視覺表現的網站。',
}

export const about = {
  // 個人照片：把檔案放進 public/images/（建議直式 4:5、寬 ≥ 800px），再填路徑，例如 '/images/profile.jpg'
  photo: '/images/image0.webp',
  eyebrow: 'About / 關於我',
  title: '從完成需求，到理解問題。',
  body: [
    '我是 Elio，一名前端工程師，主要使用 Vue 進行網頁介面開發。剛開始工作時，我更在意如何把畫面做出來、讓功能正常運作。隨著參與 Vue 2 遷移至 Vue 3 的專案，我開始學會理解既有程式的設計原因、框架之間的差異，以及修改可能影響的範圍，再決定合適的實作方式。',
    '工作之外，我也透過個人專案探索前端技術與互動設計。這個網站的 3D 遺跡與迴廊，便是我運用 Three.js 與 GLSL Shader 探索空間感、動態效果與網頁互動的實驗。',
  ],
  facts: [
    { label: '核心技術', text: '以 Vue 2、Vue 3 為主要開發技術，具備 Vuetify、PrimeVue 與 Nuxt UI 等 UI 元件框架的使用經驗，並運用 Nuxt、TypeScript 與 Tailwind CSS 建構網頁應用。在互動與視覺開發方面，持續探索 Three.js、GLSL Shader 與 GSAP 的應用。' },
    { label: '實務經驗', text: '具備既有系統維護、Vue 2 至 Vue 3 框架遷移、介面調整與元件行為除錯經驗，曾處理框架差異造成的互動異常與樣式問題，並在修改過程中兼顧既有功能。' },
    { label: '工程思維', text: '重視程式碼可讀性、元件結構與可維護性。面對開發問題時，先釐清原因與影響範圍，再進行修改並驗證結果，讓每次變更都有明確的目標與依據。' },
  ],
}

export const projects: {
  slug: string
  code: string // 測站代號，例如 GT-01
  accent: string // 作品識別色：只用在深色底與非文字標記
  no: string; kind: string; tags: string[]; title: string; body: string
  side: { icon: string; title: string; items: string[] }
  // 專案詳情頁（/projects/[slug]）：全部選填，有填才會顯示對應區塊，沒填就不顯示，不放佔位文字。
  detail?: {
    period?: string
    role?: string
    demo?: string // 線上展示連結
    github?: string // 專案 repo
    headline?: string
    overview?: string[]
    scope?: string[] // 個人負責範圍（尚未提供；有填才顯示，開發環境會提示待補）
    stack?: { group: string; items: string[]; why?: string }[] // why = 為什麼這樣選（尚未提供）
    verification?: string[] // 驗證方式（尚未提供）
    features?: { title: string; body: string; points?: string[] }[]
    challenges?: { label: string; title: string; problem: string; solution: string; tags?: string[] }[]
    // 案例頁的技術示意圖（依專案文字內容繪製，頁面上標示為「示意」，不是產品畫面）
    diagram?: { title: string; caption: string; nodes: { id: string; label: string; sub?: string; x: number; y: number }[]; edges: [string, string, string?][] }
    results?: { value: string; label: string; body?: string }[]
    retrospective?: { learned?: string; next?: string }
  }
}[] = [
  {
    slug: 'game-together', code: 'GT-01', accent: '#A79BFF', no: '01', kind: '全端專案 · 2025',
    tags: ['Vue 3', 'Vuetify', 'Node.js', 'MongoDB', 'WebSocket'],
    title: '遊戲社群揪團平台',
    body: '一個專為玩家打造的即時社群揪團平台，結合搜尋篩選、活動管理與即時聊天室，幫助玩家快速找到隊友並建立長期遊戲社群。',
    side: { icon: 'sports_esports', title: 'FEATURE HIGHLIGHTS', items: ['多條件搜尋與排序（關鍵字、地區、標籤、日期）', 'Socket.IO 即時聊天室與聊天紀錄保存', 'JWT 身份驗證與揪團建立 / 管理流程'] },
    detail: {
      role: '獨立開發',
      diagram: {
        title: '揪團資料關聯與即時聊天室',
        caption: '依專案內容繪製的示意圖：揪團活動為中心，聊天室在揪團詳情頁才建立 Socket 連線，離開即斷開。',
        nodes: [
          { id: 'user', label: '使用者', sub: 'JWT 驗證', x: 12, y: 30 },
          { id: 'group', label: '揪團活動', sub: 'Mongoose Schema', x: 44, y: 30 },
          { id: 'comment', label: '留言板', x: 44, y: 6 },
          { id: 'room', label: '獨立聊天室', sub: 'Socket.IO', x: 76, y: 30 },
          { id: 'msg', label: '聊天紀錄', sub: 'MongoDB', x: 76, y: 54 },
          { id: 'page', label: '揪團詳情頁', sub: '進入連線 / 離開斷開', x: 44, y: 54 },
        ],
        edges: [['user', 'group', '建立 / 參加'], ['group', 'comment', '留言'], ['group', 'room', '每團一間'], ['room', 'msg', '保存'], ['page', 'room', 'connect']],
      },
      period: '2025',
      demo: 'https://eliowei.github.io/game-together',
      github: 'https://github.com/eliowei/game-together',
      headline: '為玩家打造更有效率的揪團體驗。',
      overview: [
        '玩家在尋找遊戲夥伴時，經常需要透過社群貼文、即時通訊群組與不同平台反覆搜尋資訊，不僅效率低落，也難以管理活動與參與狀態。',
        '本專案整合揪團管理、活動報名、即時聊天室與留言互動功能，讓玩家能在單一平台完成從發起活動到交流互動的完整流程，提升揪團效率與社群參與體驗。',
      ],
      stack: [
        { group: 'frontend', items: ['Vue 3', 'Vuetify', 'Pinia', 'Axios'] },
        { group: 'backend', items: ['Node.js', 'Express', 'Socket.IO', 'JWT'] },
        { group: 'database', items: ['MongoDB', 'Mongoose'] },
        { group: 'tools', items: ['GitHub Actions', 'Render'] },
      ],
      features: [
        { title: '揪團搜尋系統', body: '提供多條件搜尋與排序功能，協助玩家快速找到符合需求的揪團活動。', points: ['關鍵字搜尋', '地區搜尋', '標籤搜尋', '日期搜尋', '排序功能'] },
        { title: '揪團管理功能', body: '建立完整的揪團建立、參與與管理流程，讓主辦者與參加者能有效協作。', points: ['建立揪團', '編輯揪團', '收藏功能', '留言板', '參加申請管理'] },
        { title: '即時聊天室', body: '透過 WebSocket 即時通訊，提升活動前後的互動與協調效率。', points: ['Socket.IO', '即時訊息同步', '聊天紀錄保存', '獨立聊天室'] },
      ],
      challenges: [
        { label: 'Realtime Communication', title: 'WebSocket 連線管理', problem: '若使用者頻繁切換頁面，容易建立重複 WebSocket 連線。', solution: '僅在揪團詳情頁建立連線，離開頁面立即斷開連線，避免重複建立 Socket 實例。', tags: ['WebSocket', 'MongoDB'] },
        { label: 'Authentication', title: 'JWT 權限驗證', problem: '會員功能與管理功能需要權限控管，避免未登入或非授權使用者存取敏感資源。', solution: '使用 Passport JWT 驗證，並於 Middleware 中驗證 Token 與使用者身份，確保受保護資源僅能由授權使用者存取。', tags: ['JWT', 'Passport'] },
        { label: 'Search Experience', title: '多條件搜尋設計', problem: '玩家通常會依照遊戲類型、地區、日期等條件尋找活動。', solution: '設計多條件搜尋與排序機制，支援關鍵字、標籤、地區與日期篩選，提升活動媒合效率。', tags: ['MongoDB', 'Express'] },
        { label: 'Data Modeling', title: '資料關聯設計', problem: '活動、使用者、聊天室與留言之間存在多層資料關聯，若結構設計不佳容易造成查詢複雜度提升。', solution: '透過 Mongoose Schema 建立資料關聯結構，並依照使用情境進行資料拆分與引用設計，兼顧查詢效率與維護性。', tags: ['MongoDB', 'Mongoose'] },
      ],
    },
  },
  {
    slug: 'personal-portfolio', code: 'PF-02', accent: '#E6E1D6', no: '02', kind: '個人網站 · 2026',
    tags: ['Nuxt 3', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Nuxt Content'],
    title: '個人作品集',
    body: '使用 Nuxt 3 建立的個人品牌作品集網站，整合 SEO、頁面轉場動畫與專案案例展示，作為個人品牌與相關服務的展示平台。',
    side: { icon: 'web', title: 'SITE ARCHITECTURE', items: ['SEO 優化（Sitemap、Meta Tags、Open Graph）', 'GSAP 頁面轉場與捲動動畫', 'Nuxt Content 內容驅動架構'] },
    detail: {
      role: '獨立開發',
      diagram: {
        title: '內容驅動的頁面產生流程',
        caption: '依專案內容繪製的示意圖：作品以 Markdown 結構化管理，透過同一套模板產生頁面，並由 SSR 輸出 Meta 與 Sitemap。',
        nodes: [
          { id: 'md', label: 'Markdown', sub: '作品資料', x: 10, y: 30 },
          { id: 'content', label: 'Nuxt Content', sub: '結構化查詢', x: 36, y: 30 },
          { id: 'tpl', label: '頁面模板', sub: 'Case Study', x: 62, y: 30 },
          { id: 'ssr', label: 'SSR 輸出', sub: 'Meta / OG', x: 88, y: 18 },
          { id: 'map', label: 'Sitemap', x: 88, y: 46 },
        ],
        edges: [['md', 'content'], ['content', 'tpl', '同一模板'], ['tpl', 'ssr'], ['tpl', 'map']],
      },
      period: '2026',
      demo: 'https://elioflowra.com/',
      headline: '建立個人品牌與專業形象展示平台。',
      overview: ['展示作品、技術能力與服務內容的個人品牌網站，重視搜尋能見度、頁面轉場體驗與內容維護效率。'],
      stack: [
        { group: 'frontend', items: ['Nuxt 3', 'Vue 3', 'TypeScript', 'Tailwind CSS'] },
        { group: 'animation', items: ['GSAP', 'Vue Transition'] },
        { group: 'content', items: ['Nuxt Content', 'Markdown'] },
      ],
      features: [
        { title: 'Case Study 展示', body: '以案例研究形式展示專案內容，清楚呈現問題、解決方案與技術實作。', points: ['專案分類', '圖片展示', '技術標籤', '專案細節頁'] },
        { title: 'SEO 與內容管理', body: '透過 Nuxt Content 與 Meta 設定，提升搜尋引擎收錄效果與內容維護效率。', points: ['Sitemap', 'Meta Tags', 'Open Graph', '搜尋引擎收錄'] },
        { title: '動畫與使用體驗', body: '使用 GSAP 建立頁面轉場與互動效果，強化品牌網站的視覺體驗。', points: ['Page Transition', 'Scroll Animation', 'Responsive Layout'] },
      ],
      challenges: [
        { label: 'Search Optimization', title: 'SEO 架構規劃', problem: '個人網站需要具備良好的搜尋能見度，同時兼顧內容維護與頁面效能。', solution: '透過 Nuxt SSR、Meta 管理與 Sitemap 建立，提升搜尋引擎索引效率與網站曝光度。', tags: ['Nuxt SEO', 'Sitemap'] },
        { label: 'User Experience', title: '頁面轉場體驗', problem: '頁面切換過於生硬，容易降低整體瀏覽體驗。', solution: '使用 GSAP 建立 Page Transition 與動畫效果，提升網站的互動感與品牌印象。', tags: ['GSAP', 'Vue Transition'] },
        { label: 'Content Architecture', title: '內容架構設計', problem: '隨著作品數量增加，若缺乏統一資料結構，容易造成維護成本提高與版面不一致。', solution: '使用 Nuxt Content 與 Markdown 建立內容驅動架構，將作品資料結構化管理，讓頁面能透過相同模板快速產生內容。', tags: ['Nuxt Content', 'Markdown'] },
      ],
    },
  },
  {
    slug: 'line-oa-platform', code: 'OA-03', accent: '#4CC38A', no: '03', kind: '商業系統實務',
    tags: ['Vue 3', 'PrimeVue', 'Node.js', 'MongoDB', 'LINE Messaging API'],
    title: 'LINE OA 商家管理平台',
    body: '提供商家自行管理 LINE 官方帳號內容的後台管理平台，讓店家不用找工程師，自己就能更新 FAQ、公告與價目表。',
    side: { icon: 'storefront', title: 'MANAGEMENT CAPABILITY', items: ['內容管理：FAQ、公告、價目表', '多店家與權限管理', '圖文選單點擊與熱門內容數據分析'] },
    detail: {
      role: '獨立開發',
      diagram: {
        title: '後台內容同步至 LINE 官方帳號',
        caption: '依專案內容繪製的示意圖：商家在後台編輯內容，同步至 LINE 官方帳號；使用者的點擊行為回到後台做數據分析。',
        nodes: [
          { id: 'admin', label: '商家後台', sub: 'Vue 3 · PrimeVue', x: 12, y: 30 },
          { id: 'api', label: 'Node.js API', sub: '多店家 / 權限', x: 40, y: 30 },
          { id: 'db', label: 'MongoDB', sub: 'FAQ · 公告 · 價目表', x: 40, y: 56 },
          { id: 'line', label: 'LINE Messaging API', x: 68, y: 30 },
          { id: 'oa', label: '官方帳號使用者', x: 90, y: 30 },
          { id: 'stats', label: '數據分析', sub: '點擊與熱門內容', x: 68, y: 6 },
        ],
        edges: [['admin', 'api', '編輯內容'], ['api', 'db'], ['api', 'line', '同步'], ['line', 'oa'], ['oa', 'stats', '點擊紀錄'], ['stats', 'admin']],
      },
      headline: '讓店家不用找工程師，自己就能更新 LINE 官方帳號。',
      overview: [
        '專為貓舍、寵物旅館與寵物美容打造，支援商家自主更新與多店管理。',
        '商家經營 LINE 官方帳號常見的痛點包括：重複回答相同問題、貓咪資訊更新困難、公告資訊容易過期，以及無法了解客戶對哪些服務有興趣。',
      ],
      stack: [
        { group: 'frontend', items: ['Vue 3', 'PrimeVue'] },
        { group: 'backend', items: ['Node.js', 'LINE Messaging API'] },
        { group: 'database', items: ['MongoDB'] },
      ],
      features: [
        { title: '內容管理', body: '包含 FAQ、公告、價目表等基礎內容，皆可透過後台自由編輯，無需工程開發。', points: ['FAQ', '公告', '價目表'] },
        { title: 'LINE OA 整合', body: '將後台內容同步至 LINE 官方帳號，提供一致且即時的資訊體驗。' },
        { title: '多店家與權限管理', body: '專為連鎖品牌設計，可個別調整分店專屬的服務與資料。' },
        { title: '數據分析', body: '追蹤商家 LINE 內容的使用情形，作為優化經營策略的依據。', points: ['圖文選單點擊紀錄', '熱門內容排行', '使用者行為分析', '點擊成效統計'] },
      ],
    },
  },
  {
    slug: 'weather-bike-bot', code: 'WB-04', accent: '#5AB8F0', no: '04', kind: 'LINE Bot · 2024',
    tags: ['Node.js', 'Express', 'LINE Bot', 'Flex Message', 'API Integration'],
    title: '天氣 Bike 小幫手',
    body: '透過 LINE 聊天介面整合 YouBike 與天氣查詢功能，讓使用者能快速取得即時站點資訊與天氣預報，減少在不同 App 與網站之間切換的成本。',
    side: { icon: 'pedal_bike', title: 'BOT CAPABILITY', items: ['YouBike 站點查詢（車輛數量與空位）', '即時天氣、3 小時、3 天與 1 週預報', 'Flex Message 與功能選單互動'] },
    detail: {
      role: '獨立開發',
      diagram: {
        title: '多來源 API 的資料轉換層',
        caption: '依專案內容繪製的示意圖：不同來源與城市的資料先經過轉換層統一格式，再組成 Flex Message 回覆。',
        nodes: [
          { id: 'user', label: 'LINE 使用者', sub: '關鍵字 / 功能選單', x: 10, y: 30 },
          { id: 'bot', label: 'Express Webhook', sub: 'LINE Bot SDK', x: 34, y: 30 },
          { id: 'norm', label: '資料轉換層', sub: '統一格式 · 錯誤處理', x: 60, y: 30 },
          { id: 'bike', label: 'YouBike API', sub: '多城市', x: 88, y: 12 },
          { id: 'cwa', label: '中央氣象署 API', x: 88, y: 48 },
          { id: 'flex', label: 'Flex Message', x: 34, y: 56 },
        ],
        edges: [['user', 'bot', '查詢'], ['bot', 'norm'], ['norm', 'bike'], ['norm', 'cwa'], ['norm', 'flex', '組成回覆'], ['flex', 'user']],
      },
      period: '2024',
      github: 'https://github.com/eliowei/linebot',
      headline: '在 LINE 中快速查詢天氣與 YouBike 資訊。',
      stack: [
        { group: 'backend', items: ['Node.js', 'Express', 'LINE Bot SDK'] },
        { group: 'api', items: ['YouBike API', '中央氣象署 API'] },
        { group: 'messaging', items: ['Flex Message', 'Rich Menu'] },
      ],
      features: [
        { title: 'YouBike 站點查詢', body: '快速取得附近 YouBike 站點資訊，包含可借車輛數量與剩餘停車格資訊。', points: ['站點查詢', '車輛數量顯示', '空位資訊顯示', '多城市支援'] },
        { title: '天氣預報查詢', body: '查詢即時天氣與未來天氣預報，協助使用者規劃通勤與外出行程。', points: ['即時天氣', '3 小時預報', '3 天預報', '1 週預報'] },
        { title: 'LINE 互動體驗', body: '利用 Flex Message 與功能選單，提供更直覺的聊天式操作體驗。', points: ['關鍵字觸發', '功能選單', 'Flex Message', '圖文訊息互動'] },
      ],
      challenges: [
        { label: 'Data Integration', title: '整合多個第三方 API', problem: 'YouBike 與中央氣象署 API 提供的資料格式與欄位定義不同，若直接使用將增加後續維護成本，同時也需要考量 API 請求失敗或資料異常情況。', solution: '建立資料轉換層，統一資料結構與回傳格式，並加入錯誤處理機制，提升系統穩定性與維護性。', tags: ['Node.js', 'Express'] },
        { label: 'User Experience', title: '聊天流程設計', problem: '使用者無法像網站一樣透過導覽列操作，若功能過多容易增加學習成本。', solution: '設計功能選單與關鍵字觸發流程，搭配 Flex Message 呈現資訊，提供更清晰的操作體驗。', tags: ['LINE Bot SDK', 'Flex Message'] },
        { label: 'Data Normalization', title: '多城市資料整合', problem: '不同城市的 YouBike API 結構與資料格式存在差異，增加資料處理與維護難度。', solution: '建立統一資料格式與轉換邏輯，將不同來源資料整理成一致結構，讓後續功能擴充更加容易。', tags: ['Node.js', 'API Integration'] },
      ],
    },
  },
]

export const contact = {
  eyebrow: 'Contact / 聯絡資訊',
  title: '有合適的職缺或合作，歡迎聊聊。',
  body: '我對新的前端工作機會保持開放，也接受網站開發、LINE 官方帳號與後台系統的專案合作。如果你的團隊正在找熟悉 Vue、遇到問題會追到根源的前端工程師，歡迎來信。',
}

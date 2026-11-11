// 工作經歷頁文案。來源：Stitch「工作經歷」畫面（李柏偉 Elio Lee）。
export const intro = {
  eyebrow: '工作經歷',
  title: '從介面實作到​工程品質的​持續累積',
  body: '整理我的工作經驗、技術應用與開發過程中累積的工程理解。',
  pills: [
    { icon: 'domain', color: 'text-primary', label: '北極星測繪公司 前端工程師' },
    { icon: 'school', color: 'text-primary', label: '健行科技大學 資訊管理系' },
    { icon: 'layers', color: 'text-primary', label: 'Vue 2 / Vue 3 & Vuetify 專案' },
    { icon: 'accessibility_new', color: 'text-primary', label: '無障礙改寫與 NVDA 驗證' },
    { icon: 'map', color: 'text-secondary', label: 'OpenLayers 空間圖資' },
    { icon: 'code', color: 'text-tertiary-container', label: '資料流追查與下單流程擴充' },
  ],
}

export interface Role {
  no: string
  dot: 'primary' | 'secondary' | 'outline'
  badge: string
  period: string
  place: string
  title: string
  summary: string
  tagIcon: string
  tagLabel: string
  stack?: { label: string; primary?: boolean }[]
  listTitle: string
  listIcon: string
  items: { icon?: string; title: string; body: string }[]
  highlight?: { icon: string; title: string; body: string }
  quote?: string
}


export const roles: Role[] = [
  {
    no: '01',
    dot: 'primary',
    badge: '全職',
    period: '2025/04 — 至今',
    place: '北極星測繪公司',
    title: '前端工程師 ｜ 北極星測繪公司',
    summary: '負責公司系統的前端開發與維護，包含介面開發、既有問題追查與功能擴充。',
    tagIcon: 'explore',
    tagLabel: 'GIS / Web Frontend',
    stack: [
      { label: 'Vue 2', primary: true }, { label: 'Vue 3', primary: true }, { label: 'Vuetify 2', primary: true },
      { label: 'Vuetify 3', primary: true }, { label: 'JavaScript' }, { label: 'OpenLayers' },
    ],
    listTitle: '主要工作職責與開發重點',
    listIcon: 'task_alt',
    items: [
      { title: 'Vue 2 與 Vue 3 專案開發維護', body: '公司同時有 Vue 2 與 Vue 3 的專案，皆以 Options API 撰寫。在專案中處理 Dialog、Menu、表單驗證等元件的行為與樣式問題。' },
      { title: '無障礙檢測修正', body: '接手網站無障礙檢測的退件修正，涵蓋標題結構、鍵盤操作、表單標籤、跳過區塊與導盲磚，協助網站通過 A 等級檢測。' },
      { title: '追查既有程式的缺陷', body: '遇到由既有程式本身缺陷造成的錯誤時，實際追蹤資料流與業務邏輯找出根源後修正，並運用 JavaScript 原型鏈調整寫法，而不是只處理表面症狀。' },
      { title: '擴充下單流程', body: '擴充整個下單流程：先從程式面理解原有功能，再從使用者角度調整操作步驟，讓流程更直覺。' },
      { title: '從使用者角度完善需求', body: '收到後台 CRUD 功能的需求時，主動補上圖片預覽與放大檢視，讓管理者不必下載就能確認內容。' },
      { title: 'OpenLayers 空間圖資', body: '理解 OpenLayers 在測繪系統中的應用，協助整合地圖圖層與前端介面，並依需求調整相關參數。' },
    ].map(i => ({ ...i, icon: 'check_circle' })),
    highlight: {
      icon: 'accessibility_new',
      title: '案例：補足日期選擇器的無障礙操作',
      body: '依無障礙標準改寫 Vue 3 專案時，發現 Vuetify 日期選擇器的鍵盤操作與報讀支援不完整。我撰寫共用的 mixin，補上方向鍵操作、焦點管理與日期報讀標籤，並套用到多個表單，最後以 NVDA 實測確認導讀正常。',
    },
  },
  {
    no: '02',
    dot: 'secondary',
    badge: '職業訓練 軟體開發',
    period: '2024/09 — 2025/03',
    place: '泰山職訓局',
    title: '前端網頁開發培訓 ｜ 泰山職訓局',
    summary: '完成為期約半年的前端網頁開發訓練，從網頁基礎、Vue 元件化開發到前後端整合，建立完整的網站開發基礎。',
    tagIcon: 'school',
    tagLabel: '全端技術扎根',
    stack: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Vue.js', 'Vuetify', 'Node.js', 'Express', 'MongoDB', 'Git']
      .map(label => ({ label, primary: ['HTML', 'CSS', 'JavaScript', 'Vue.js', 'Vuetify'].includes(label) })),
    listTitle: '主要學習內容與實作重點',
    listIcon: 'auto_stories',
    items: [
      { title: '前端基礎與互動開發', body: '學習 HTML、CSS、JavaScript、jQuery 與響應式網頁設計，透過實作熟悉網頁結構、樣式與互動邏輯。' },
      { title: 'Vue 元件化開發', body: '學習 Vue.js 與 Vuetify，理解元件拆分、資料傳遞及使用者介面建構方式。' },
      { title: '後端與資料庫基礎', body: '接觸 Node.js、Express、MongoDB 與 RESTful API，理解前後端資料交換及基本資料操作流程。' },
      { title: '完整專題開發流程', body: '從需求發想、Figma 視覺設計、心智圖、網站地圖與資料庫規劃，到前後端功能開發及網站部署，實際參與完整的專案流程。' },
    ].map(i => ({ ...i, icon: 'check_circle' })),
    highlight: {
      icon: 'group_work',
      title: '專題實作：遊戲揪團網站',
      body: '以遊戲玩家的揪團需求為出發點，開發前後端整合的網站。前端使用 Vue 與 Vuetify 建構介面，後端採用 Node.js、Express 開發 API，並以 MongoDB 儲存與操作資料，完成網站功能整合與部署。',
    },
  },
  {
    no: '03',
    dot: 'outline',
    badge: '軍職 全職',
    period: '2017/12 — 2023/12',
    place: '陸軍第 21 砲指部',
    title: '志願役士兵 ｜ 陸軍第六軍團第二一砲兵指揮部',
    summary: '服役六年期間，主要負責軍車維修與鑑定工作。',
    tagIcon: 'shield',
    tagLabel: '紀律與執行力',
    listTitle: '主要工作職責與能力累積',
    listIcon: 'fact_check',
    items: [
      { icon: 'build', title: '軍車維修與鑑定', body: '依照作業規範逐項檢查車輛狀況，判斷故障原因後再進行維修。' },
      { icon: 'assignment_turned_in', title: '任務執行', body: '依任務需求安排工作進度，並如期完成。' },
      { icon: 'groups', title: '團隊協作', body: '在團隊分工與既定流程下執行任務，培養責任感與紀律。' },
    ],
    quote: '六年的維修與鑑定工作，讓我習慣先依規範檢查、找出問題根源再動手修理。這個習慣延續到前端開發：遇到錯誤時，我會先追查原因與影響範圍，再決定怎麼修改。',
  },
]

// 章節之間的轉折（本人撰寫）。`after` = 接在哪一段經歷之後（依時間順序）。
export const transitions = [
  {
    after: '03',
    title: '從軍職出發 重新探索程式開發',
    body: ['退伍後，我開始思考下一階段的職涯方向。由於小時候就對程式有興趣，因此決定透過泰山職訓局的培訓課程，重新接觸程式開發，並從 HTML、CSS、JavaScript 等前端基礎開始，逐步建立網頁開發的知識與實作能力。'],
  },
  {
    after: '02',
    title: '從專題實作 走進實際的軟體開發',
    body: [
      '透過職訓期間的專題開發，我累積了從需求規劃、介面設計到前後端整合的實作經驗，並以此為基礎，取得第一份前端工程師的工作。',
      '進入業界後，我開始更深入地理解實際的軟體開發流程，也逐漸認識到課堂學習與工作實務之間的差異。從功能開發、問題排查到既有系統的維護與調整，我持續累積經驗，並學習如何在實際專案中兼顧功能需求、程式可維護性與使用者體驗。',
    ],
  },
]

export const matrix = {
  eyebrow: '技術與實踐',
  title: '技術與實際應用',
  body: '整理我在公司專案與個人專案中實際用過的技術，以及用在哪些地方。',
  heads: ['技術領域', '技術與工具', '實際應用', '經驗來源'],
  rows: [
    { icon: 'devices', domain: '前端框架', stack: 'Vue 2 / Vue 3, JavaScript, TypeScript', scope: '公司的 Vue 2 與 Vue 3 專案以 Options API 撰寫；個人專案使用 Composition API 與 TypeScript', source: '公司＋個人專案' },
    { icon: 'brush', domain: 'UI 元件庫與樣式調整', stack: 'Vuetify 2 / Vuetify 3, CSS / SASS', scope: 'Dialog、Menu 浮層定位、表單驗證、CSS 覆蓋與響應式排版修正', source: '公司專案' },
    { icon: 'accessibility_new', domain: '無障礙', stack: 'JavaScript, NVDA', scope: '依無障礙標準改寫 Vue 3 介面，以共用 mixin 補足日期選擇器的鍵盤操作、焦點管理與報讀標籤，並以 NVDA 實測導讀', source: '公司專案' },
    { icon: 'map', domain: '地理空間圖台', stack: 'OpenLayers', scope: '協助整合地圖圖層與前端介面，並依需求調整相關參數', source: '公司專案' },
    { icon: 'hub', domain: '全端延伸', stack: 'Vue 3, PrimeVue, Node.js, MongoDB, LINE Messaging API', scope: '為朋友開發 LINE 官方帳號機器人，並延伸出後台管理與資料庫，讓店家能從後台修改 LINE OA 上顯示的資料', source: '個人專案' },
    { icon: 'build', domain: '建置與版本控管', stack: 'Vite, Webpack, Git, GitLab', scope: '依 Lighthouse 檢測出 JS 檔案過大的問題，調整打包時的 chunk 切分；獨立開發，並以 Merge Request 流程審查 AI 產生的程式碼', source: '實務經驗' },
    { icon: 'api', domain: 'API 整合與介面排查', stack: 'Postman, Axios, Chrome DevTools', scope: '驗證後端 API、對齊 Payload 格式，透過 Console 與 Network 面板追蹤問題', source: '公司專案' },
  ],
}

export const principlesSection = {
  eyebrow: '工程心得',
  title: '工作中的技術累積',
  body: '在專案開發與維護的過程中，逐步養成的三個工作習慣。',
}

export const principles = [
  { icon: 'compare', title: '框架差異分析', body: '同時接觸 Vue 2 與 Vue 3 專案，理解不同版本的元件 API、預設行為與樣式差異，不把一邊的寫法直接套到另一邊。', foot: 'Framework Behavior Analysis' },
  { icon: 'troubleshoot', title: '追到問題根源', body: '從重現問題開始，追蹤資料流與業務邏輯，分辨是既有程式的缺陷、事件傳遞、生命週期順序還是 CSS 層級造成的，修正後再驗證結果。', foot: 'Root Cause Debugging' },
  { icon: 'person_search', title: '從使用者角度完善需求', body: '收到需求時，不只做到規格要求，也會思考實際使用的情境，例如在後台 CRUD 加上圖片預覽與放大，或在擴充下單流程時讓操作更直覺。', foot: 'User-Centered Development' },
]

export const cta = {
  badge: '聯絡',
  title: '想進一步聊聊嗎？',
  body: '看完經歷後，如果有想進一步了解的地方，歡迎留言給我。',
}

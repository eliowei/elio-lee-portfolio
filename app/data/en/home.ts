// English version of data/home.ts. Same shape; slugs, links, accents and tags stay the same as the Chinese file.
import type * as zh from '../home'

export const hero: typeof zh.hero = {
  eyebrow: 'Frontend Engineer · Creative Development',
  title: ['Building ideas in code,', 'letting interaction do more'],
  titleAccent: 'more', // must be the ending of title[1]
  intro: 'I focus on frontend development and interaction, using modern frontend technology to build websites that balance performance, usability and visual expression.',
}

export const about: typeof zh.about = {
  photo: '/images/image0.webp',
  eyebrow: 'About',
  title: 'From finishing tasks to understanding problems.',
  body: [
    'I’m Elio Lee (李柏偉), a frontend engineer who mainly builds web interfaces with Vue. When I started out, I cared most about getting screens built and features working. At my company I work on both Vue 2 and Vue 3 projects, and I have learned to understand why existing code was designed the way it was, how the frameworks differ, and what a change might affect, before deciding how to implement it.',
    'Outside of work, I explore frontend technology and interaction design through personal projects. The 3D ruin and corridor on this site are my experiments with Three.js and GLSL shaders, exploring space, motion and web interaction.',
  ],
  facts: [
    { label: 'Core stack', text: 'I mainly develop with Vue 2 and Vue 3, have experience with UI frameworks such as Vuetify, PrimeVue and Nuxt UI, and build web applications with Nuxt, TypeScript and Tailwind CSS. For interaction and visuals, I keep exploring Three.js, GLSL shaders and GSAP.' },
    { label: 'Experience', text: 'I have maintained existing systems, developed Vue 2 and Vue 3 projects, adjusted interfaces and debugged component behaviour, including broken component interactions and styling issues, while keeping existing features intact.' },
    { label: 'Mindset', text: 'I care about readable code, component structure and maintainability. When a problem comes up, I first work out its cause and scope, then make the change and verify the result, so every change has a clear goal and reason.' },
  ],
}

export const projects: typeof zh.projects = [
  {
    slug: 'game-together', code: 'GT-01', accent: '#A79BFF', no: '01', kind: 'Full-stack project · 2025',
    tags: ['Vue 3', 'Vuetify', 'Node.js', 'MongoDB', 'WebSocket'],
    title: 'Gaming Meetup Platform',
    body: 'A real-time community platform for gamers that combines search and filtering, event management and live chat rooms, helping players quickly find teammates and build long-term gaming communities.',
    side: { icon: 'sports_esports', title: 'FEATURE HIGHLIGHTS', items: ['Multi-criteria search and sorting (keyword, region, tags, date)', 'Socket.IO live chat with saved history', 'JWT authentication and meetup creation / management'] },
    detail: {
      role: 'Solo developer',
      diagram: {
        title: 'Meetup data relations and live chat',
        caption: 'Diagram drawn from the project description: the meetup is at the centre, and the chat room only opens a socket connection on the meetup detail page, disconnecting when you leave.',
        nodes: [
          { id: 'user', label: 'User', sub: 'JWT auth', x: 12, y: 30 },
          { id: 'group', label: 'Meetup', sub: 'Mongoose Schema', x: 44, y: 30 },
          { id: 'comment', label: 'Comments', x: 44, y: 6 },
          { id: 'room', label: 'Chat room', sub: 'Socket.IO', x: 76, y: 30 },
          { id: 'msg', label: 'Chat history', sub: 'MongoDB', x: 76, y: 54 },
          { id: 'page', label: 'Detail page', sub: 'join / leave', x: 44, y: 54 },
        ],
        edges: [['user', 'group', 'create / join'], ['group', 'comment', 'comment'], ['group', 'room', 'one per meetup'], ['room', 'msg', 'save'], ['page', 'room', 'connect']],
      },
      period: '2025',
      demo: 'https://eliowei.github.io/game-together',
      github: 'https://github.com/eliowei/game-together',
      headline: 'A more efficient way for gamers to team up.',
      overview: [
        'When looking for people to play with, gamers often have to search back and forth through social posts, chat groups and different platforms. It is slow, and it is hard to keep track of events and who is joining.',
        'This project brings meetup management, event sign-ups, live chat and comments together, so players can go from starting an event to talking with the group on a single platform, making it easier to team up and take part in the community.',
      ],
      stack: [
        { group: 'frontend', items: ['Vue 3', 'Vuetify', 'Pinia', 'Axios'] },
        { group: 'backend', items: ['Node.js', 'Express', 'Socket.IO', 'JWT'], why: 'Handling WebSocket myself for live chat would have been a lot of work. Socket.IO already takes care of many connection details, so I used it directly.' },
        { group: 'database', items: ['MongoDB', 'Mongoose'], why: 'MongoDB is what I learned in vocational training. Compared with relational databases such as SQL Server, NoSQL syntax is closer to JavaScript, which made it easier to learn and develop with.' },
        { group: 'tools', items: ['GitHub Actions', 'Render'] },
      ],
      features: [
        { title: 'Meetup search', body: 'Multi-criteria search and sorting help players quickly find meetups that suit them.', points: ['Keyword search', 'Region search', 'Tag search', 'Date search', 'Sorting'] },
        { title: 'Meetup management', body: 'A complete flow for creating, joining and managing meetups, so hosts and participants can work together.', points: ['Create meetups', 'Edit meetups', 'Favourites', 'Comments', 'Join requests'] },
        { title: 'Live chat', body: 'Real-time messaging over WebSocket makes it easier to talk and coordinate before and after an event.', points: ['Socket.IO', 'Real-time sync', 'Saved history', 'Per-meetup rooms'] },
      ],
      challenges: [
        { label: 'Realtime Communication', title: 'Managing WebSocket connections', problem: 'When users switch pages often, duplicate WebSocket connections are easily created.', solution: 'Connect only on the meetup detail page and disconnect as soon as the user leaves, so no duplicate socket instances are created.', tags: ['WebSocket', 'MongoDB'] },
        { label: 'Authentication', title: 'JWT authorisation', problem: 'Member and admin features need access control, so that signed-out or unauthorised users cannot reach sensitive resources.', solution: 'Use Passport JWT and verify the token and user identity in middleware, so protected resources are only available to authorised users.', tags: ['JWT', 'Passport'] },
        { label: 'Search Experience', title: 'Designing multi-criteria search', problem: 'Players usually look for events by game type, region, date and similar criteria.', solution: 'A multi-criteria search and sorting mechanism supporting keyword, tag, region and date filters, making it easier to match players with events.', tags: ['MongoDB', 'Express'] },
        { label: 'Data Modeling', title: 'Designing data relations', problem: 'Events, users, chat rooms and comments have several layers of relations; a poor structure would make queries increasingly complex.', solution: 'Model the relations with Mongoose schemas, splitting and referencing data according to how it is used, balancing query efficiency and maintainability.', tags: ['MongoDB', 'Mongoose'] },
      ],
      verification: [
        'Mainly manual testing so far, going through the main flows: creating and joining meetups, commenting and chatting',
        'Fixed UI issues such as the favourites display one by one during development, and adjusted the responsive layout',
      ],
      retrospective: {
        learned: 'This was my first time building both the frontend and the backend end to end. I learned to plan data relations first so queries don’t get more and more complicated, and that real-time connections need clear rules for when to connect and disconnect, not just whether they connect.',
        next: 'There are no automated tests yet, so every change needs manual regression testing. Next I will add tests for authorisation and the meetup flow first.',
      },
    },
  },
  {
    slug: 'tokyo-travel-site', code: 'TR-02', accent: '#7C96F2', no: '02', kind: 'Personal project · 2026',
    tags: ['Nuxt 4', 'Notion API', 'OpenAI', 'Gemini', 'Google Maps'],
    title: 'Tokyo Trip Planner',
    body: 'A travel itinerary site built for my September trip to Tokyo. It uses Notion as the CMS and brings together an AI assistant, maps, expense tracking and a packing list.',
    side: { icon: 'travel_explore', title: 'TRIP TOOLKIT', items: ['Content managed with the Notion API', 'GPT and Gemini AI assistant', 'Route planning with Google Maps'] },
    detail: {
      period: '2026/06 — 2026/09',
      role: 'Solo developer',
      diagram: {
        title: 'Data flow with Notion as the content source',
        caption: 'Diagram drawn from the project description: content is edited in Notion, converted and cached by server routes and transformers, then served to the frontend.',
        nodes: [
          { id: 'notion', label: 'Notion', sub: 'Trips · lists', x: 10, y: 30 },
          { id: 'api', label: 'Nuxt server', sub: '60 s cache', x: 36, y: 30 },
          { id: 'tf', label: 'Transformer', sub: 'to own types', x: 62, y: 30 },
          { id: 'web', label: 'Website', x: 88, y: 18 },
          { id: 'ai', label: 'GPT / Gemini', sub: 'AI assistant', x: 88, y: 46 },
        ],
        edges: [['notion', 'api', 'Notion API'], ['api', 'tf'], ['tf', 'web'], ['web', 'ai', 'server route']],
      },
      headline: 'A tool I actually needed for my own trip to Tokyo.',
      overview: [
        'Built for my September trip to Tokyo. The itinerary, packing list and shopping list kept changing, so I used Notion as the content back end and let the site read and display it, with no separate admin interface to build.',
        'Besides the itinerary, it also brings in an AI assistant, Google Maps, expense tracking and Disneyland planning.',
      ],
      stack: [
        { group: 'frontend', items: ['Nuxt 4', 'Vue 3', 'TypeScript', 'Nuxt UI', 'Tailwind CSS'] },
        { group: 'content', items: ['Notion API'], why: 'Building my own admin would have cost too much. Notion is already good for organising data and has an API for reading content, so I used it directly as the CMS.' },
        { group: 'ai', items: ['OpenAI', 'Gemini'] },
        { group: 'services', items: ['Google Maps', 'Vercel'] },
      ],
      features: [
        { title: 'Content in Notion', body: 'The itinerary, packing list, shopping list and tickets are all kept in Notion and read through server routes, so the API key never reaches the frontend.', points: ['Server routes', 'Transformer', '60 s cache'] },
        { title: 'AI travel assistant', body: 'Choose GPT or Gemini, and upload images with your question. When Gemini has too many requests, it automatically falls back to OpenAI.', points: ['GPT', 'Gemini', 'Image questions', 'Automatic fallback'] },
        { title: 'Maps and Disney planning', body: 'The Google Maps JavaScript API marks places and routes, and restaurant menus can be viewed in Traditional Chinese.', points: ['Marker', 'Polyline', 'Menu translation'] },
        { title: 'Expenses and lists', body: 'Expense tracking supports categories, payment methods and yen conversion; checkbox states are stored in the browser and never written back to Notion.', points: ['Charts', 'localStorage', 'Zod validation'] },
      ],
      challenges: [
        { label: 'Deployment', title: 'Data file missing after deployment', problem: 'The API read a JSON file at runtime with node:fs. It worked locally but the file could not be found on Vercel, because the bundler cannot trace dynamic paths.', solution: 'Embed the data in the server build with Nitro serverAssets and read it with useStorage().', tags: ['Nitro', 'Vercel'] },
        { label: 'Data Integrity', title: 'Notion slugs are not guaranteed to be unique', problem: 'Staying at the same hotel twice produces the same slug, so a detail page that only queries by slug gets the wrong entry.', solution: 'Also distinguish entries by day number, and include that parameter in the cache key so different days never share one cached result.', tags: ['Notion API', 'Cache'] },
        { label: 'Reliability', title: 'Fallback when the AI quota runs out', problem: 'When Gemini returned 429, the chat stopped working.', solution: 'Catch the 429 on the server and answer with OpenAI instead, so the user does not have to switch manually.', tags: ['Gemini', 'OpenAI'] },
      ],
      verification: [
        'Used it on the actual trip to Tokyo in September; the main features were used constantly and caused no problems during the trip',
        'Tested both locally and on the Vercel deployment, which is how I found that the menu data could not be read once deployed',
        'Confirmed that staying at the same hotel twice shows the right itinerary for each day',
        'No automated tests yet; testing is mainly manual',
      ],
      retrospective: {
        learned: 'Using Notion as the CMS saved me from building an admin and let me adjust the itinerary at any time. But its fields are matched by name and renaming one raises no error, so the code itself has to make sure the data is correct.',
        next: 'Notion queries do not handle pagination yet, so more than 100 entries will not all be read; itinerary images are signed URLs that expire, so the caching strategy still needs work; expense and list states live in the browser, so they are lost on another device.',
      },
    },
  },
  {
    slug: 'personal-portfolio', code: 'PF-03', accent: '#E6E1D6', no: '03', kind: 'Personal website · 2026',
    tags: ['Nuxt 4', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Nuxt Content', 'GA4', 'GTM'],
    title: 'Personal Brand Website',
    body: 'A personal brand website built with Nuxt that presents services and case studies, with SEO, GA4 and GTM integrated.',
    side: { icon: 'web', title: 'SITE ARCHITECTURE', items: ['SEO (sitemap, meta tags, Open Graph)', 'GSAP page transitions and scroll animation', 'Content-driven architecture with Nuxt Content'] },
    detail: {
      role: 'Solo developer',
      diagram: {
        title: 'Content-driven page generation',
        caption: 'Diagram drawn from the project description: work is managed as structured Markdown, pages are generated from one shared template, and SSR outputs the meta tags and sitemap.',
        nodes: [
          { id: 'md', label: 'Markdown', sub: 'Project data', x: 10, y: 30 },
          { id: 'content', label: 'Nuxt Content', sub: 'Structured queries', x: 36, y: 30 },
          { id: 'tpl', label: 'Page template', sub: 'Case Study', x: 62, y: 30 },
          { id: 'ssr', label: 'SSR output', sub: 'Meta / OG', x: 88, y: 18 },
          { id: 'map', label: 'Sitemap', x: 88, y: 46 },
        ],
        edges: [['md', 'content'], ['content', 'tpl', 'one template'], ['tpl', 'ssr'], ['tpl', 'map']],
      },
      period: '2026',
      demo: 'https://elioflowra.com/',
      headline: 'A platform for a personal brand and professional image.',
      overview: ['A personal brand website presenting work, technical skills and services, with an emphasis on search visibility, smooth page transitions and easy content maintenance.'],
      stack: [
        { group: 'frontend', items: ['Nuxt 4', 'Vue 3', 'TypeScript', 'Tailwind CSS'] },
        { group: 'animation', items: ['GSAP', 'Vue Transition'] },
        { group: 'content', items: ['Nuxt Content', 'Markdown'] },
        { group: 'analytics', items: ['GA4', 'GTM'] },
      ],
      features: [
        { title: 'Case studies', body: 'Projects are presented as case studies that clearly show the problem, the solution and the technical implementation.', points: ['Project categories', 'Image gallery', 'Tech tags', 'Project detail pages'] },
        { title: 'SEO and content management', body: 'Nuxt Content and meta settings improve search engine indexing and make content easier to maintain.', points: ['Sitemap', 'Meta Tags', 'Open Graph', 'Search indexing'] },
        { title: 'Traffic analytics', body: 'Added Google Tag Manager and Google Analytics 4 to the site, learning to track traffic and user behaviour.' },
        { title: 'Animation and experience', body: 'Page transitions and interactions built with GSAP strengthen the visual experience of the brand site.', points: ['Page Transition', 'Scroll Animation', 'Responsive Layout'] },
      ],
      challenges: [
        { label: 'Search Optimization', title: 'Planning the SEO architecture', problem: 'A personal website needs good search visibility while keeping content maintenance and page performance in mind.', solution: 'Nuxt SSR, meta management and a sitemap improve indexing efficiency and site exposure.', tags: ['Nuxt SEO', 'Sitemap'] },
        { label: 'User Experience', title: 'Page transitions', problem: 'Abrupt page changes make browsing feel worse.', solution: 'Page transitions and animation built with GSAP make the site feel more interactive and leave a stronger brand impression.', tags: ['GSAP', 'Vue Transition'] },
        { label: 'Content Architecture', title: 'Designing the content architecture', problem: 'As the number of projects grows, a lack of shared data structure raises maintenance costs and leads to inconsistent layouts.', solution: 'A content-driven architecture with Nuxt Content and Markdown manages project data in a structured way, so pages can be generated quickly from the same template.', tags: ['Nuxt Content', 'Markdown'] },
      ],
      verification: [
        'Checked indexing and search performance with Google Search Console',
        'After launch, fixed issues found in real use, such as the navigation bar and a delayed hamburger menu',
        'After switching to loading GTM myself, confirmed in production that custom events reach GA4',
      ],
      retrospective: {
        learned: 'This site was my first real contact with SEO and traffic analytics. Finishing the features is not the end; after launch you have to look at the data to know whether visitors found the site and used it.',
        next: 'Keep watching the service pages’ search performance in Search Console and adjust the content based on the results.',
      },
    },
  },
  {
    slug: 'line-oa-platform', code: 'OA-04', accent: '#4CC38A', no: '04', kind: 'Business system · 2026',
    tags: ['Vue 3', 'PrimeVue', 'Node.js', 'MongoDB', 'LINE Messaging API', 'SSE'],
    title: 'LINE OA Management Platform',
    body: 'An admin platform that lets businesses manage their own LINE Official Account content, so shops can update FAQs, announcements and price lists themselves without hiring an engineer.',
    side: { icon: 'storefront', title: 'MANAGEMENT CAPABILITY', items: ['Content management: FAQs, announcements, price lists', 'Multiple shops and permissions', 'Analytics for rich menu clicks and popular content'] },
    detail: {
      period: '2026',
      role: 'Solo developer',
      diagram: {
        title: 'Syncing admin content to the LINE Official Account',
        caption: 'Diagram drawn from the project description: shops edit content in the admin, which is synced to the LINE Official Account; user clicks flow back to the admin for analytics.',
        nodes: [
          { id: 'admin', label: 'Shop admin', sub: 'Vue 3 · PrimeVue', x: 12, y: 30 },
          { id: 'api', label: 'Node.js API', sub: 'Shops / permissions', x: 40, y: 30 },
          { id: 'db', label: 'MongoDB', sub: 'FAQ · news · prices', x: 40, y: 56 },
          { id: 'line', label: 'LINE API', sub: 'Messaging API', x: 65, y: 30 },
          { id: 'oa', label: 'OA users', x: 90, y: 30 },
          { id: 'stats', label: 'Analytics', sub: 'Clicks · top items', x: 65, y: 6 },
        ],
        edges: [['admin', 'api', 'edit content'], ['api', 'db'], ['api', 'line', 'sync'], ['line', 'oa'], ['oa', 'stats', 'click log'], ['stats', 'admin']],
      },
      headline: 'Shops can update their LINE Official Account themselves, without an engineer.',
      overview: [
        'Built for catteries, pet hotels and pet groomers, with self-service updates and multi-shop management.',
        'Common pain points for businesses running a LINE Official Account include answering the same questions again and again, cat information that is hard to update, announcements that go out of date, and not knowing which services customers are interested in.',
      ],
      stack: [
        { group: 'frontend', items: ['Vue 3', 'PrimeVue'] },
        { group: 'backend', items: ['Node.js', 'LINE Messaging API', 'SSE'] },
        { group: 'database', items: ['MongoDB'] },
        { group: 'operations', items: ['Render', 'GitHub Actions', 'Cloudflare R2', 'Discord Webhook', 'Sentry'], why: 'I chose Render after comparing several services: it is simple to set up and the free plan suits a small service. But its CPU and memory are limited, and Sentry was too heavy for the backend, so I switched to logs I wrote myself.' },
      ],
      features: [
        { title: 'Content management', body: 'Basic content such as FAQs, announcements and price lists can all be edited freely in the admin, with no engineering work needed.', points: ['FAQ', 'Announcements', 'Price lists'] },
        { title: 'LINE OA integration', body: 'Admin content is synced to the LINE Official Account, giving users consistent, up-to-date information.' },
        { title: 'Multiple shops and permissions', body: 'Designed for chains, so each branch can have its own services and data.' },
        { title: 'Real-time notifications', body: 'Data changes, reservation reviews and new followers are saved as notifications and pushed to the admin over SSE, so shops see them without refreshing. Switching shops reopens the connection, so only that shop’s notifications arrive.', points: ['SSE push', 'Read / unread tracking', 'Isolated per shop'] },
        { title: 'Deployment and operations', body: 'The backend runs on Render, with self-written access and audit logs to track production, and scheduled GitHub Actions backups whose results are posted to Discord.', points: ['Render', 'GitHub Actions', 'Cloudflare R2', 'Discord alerts'] },
        { title: 'Analytics', body: 'Tracks how the shop’s LINE content is used, as a basis for improving how the business is run.', points: ['Rich menu click log', 'Top content ranking', 'User behaviour analysis', 'Click statistics'] },
      ],
      challenges: [
        { label: 'Observability', title: 'A monitoring tool slowed down the LINE bot', problem: 'After adding Sentry to the backend, the LINE bot’s responses went from about 0.1–0.2 s to about 1 s. The service runs on Render’s free plan with very limited CPU and memory, and I concluded that the extra load from the monitoring tool was the cause.', solution: 'I narrowed it down step by step: first turning off profiling, then tracing, keeping only error monitoring. In the end I removed Sentry from the backend and switched to self-written access and audit logs written to the console and collected by Render; the frontend still uses a little Sentry.', tags: ['Sentry', 'Logging', 'Performance'] },
        { label: 'Browser Compatibility', title: 'Cookies not saved after login on mobile Safari', problem: 'The admin keeps the login state in an HttpOnly cookie. It worked on desktop, but testing on a phone showed users still signed out after a successful login: the frontend and backend were on different domains, so the cookie counted as third-party and Safari blocked it.', solution: 'Adjusted the domains so the frontend and backend share one main domain; the cookie is no longer third-party and Safari saves it normally.', tags: ['Cookie', 'Safari'] },
        { label: 'Authentication', title: 'Simultaneous 401s caused a chain of logouts', problem: 'The refresh token rotates on every refresh. When the access token expired, several requests on a page called /refresh at once; the later ones used the old token, were rejected, triggered a logout and cleared the CSRF token.', solution: 'Share a single refresh Promise in the axios interceptor, so only one refresh happens at a time and other requests wait for it before retrying.', tags: ['JWT', 'CSRF', 'Axios'] },
      ],
      verification: [
        'Deployed on Render with self-written access and audit logs written to the console, so real requests and key operations can be tracked in production',
        'Replaced Sentry on the backend with my own logs; only the frontend uses a little Sentry',
        'A scheduled GitHub Actions job backs up MongoDB and exports audit logs to Cloudflare R2 every day, with a Discord notification on success or failure',
        'Ran a security review and fixed issues with account management permissions, login and sessions',
        'Fixed CSRF across multiple tabs, and the token refresh flow when several requests hit 401 at the same time',
        'No automated tests yet; mainly manual testing and log monitoring',
      ],
      retrospective: {
        learned: 'For a system meant to run long term, finished features are not enough. The invisible parts — permissions, CSRF, webhook signatures, logging and backups — are what keep it running reliably.',
        next: 'Add automated tests for key flows such as login, permissions and booking approval, to lower the risk of changes.',
      },
    },
  },
  {
    slug: 'weather-bike-bot', code: 'WB-05', accent: '#5AB8F0', no: '05', kind: 'LINE Bot · 2024',
    tags: ['Node.js', 'Express', 'LINE Bot', 'Flex Message', 'API Integration'],
    title: 'Weather & Bike Helper',
    body: 'A LINE chat bot that combines YouBike and weather lookups, so users can get live station information and forecasts quickly without switching between apps and websites.',
    side: { icon: 'pedal_bike', title: 'BOT CAPABILITY', items: ['YouBike station lookup (bikes and free docks)', 'Current weather, 3-hour, 3-day and 1-week forecasts', 'Flex Message and rich menu interaction'] },
    detail: {
      role: 'Solo developer',
      diagram: {
        title: 'A data conversion layer for multiple APIs',
        caption: 'Diagram drawn from the project description: data from different sources and cities passes through a conversion layer into one format, then is assembled into a Flex Message reply.',
        nodes: [
          { id: 'user', label: 'LINE user', sub: 'Keywords / menu', x: 10, y: 30 },
          { id: 'bot', label: 'Express Webhook', sub: 'LINE Bot SDK', x: 34, y: 30 },
          { id: 'norm', label: 'Normaliser', sub: 'One format · errors', x: 60, y: 30 },
          { id: 'bike', label: 'YouBike API', sub: 'Multiple cities', x: 88, y: 12 },
          { id: 'cwa', label: 'CWA weather API', x: 88, y: 48 },
          { id: 'flex', label: 'Flex Message', x: 34, y: 56 },
        ],
        edges: [['user', 'bot', 'query'], ['bot', 'norm'], ['norm', 'bike'], ['norm', 'cwa'], ['norm', 'flex', 'build reply'], ['flex', 'user']],
      },
      period: '2024',
      github: 'https://github.com/eliowei/linebot',
      headline: 'Check the weather and YouBike in LINE, quickly.',
      stack: [
        { group: 'backend', items: ['Node.js', 'Express', 'LINE Bot SDK'] },
        { group: 'api', items: ['YouBike API', 'Central Weather Administration API'] },
        { group: 'messaging', items: ['Flex Message', 'Rich Menu'] },
      ],
      features: [
        { title: 'YouBike station lookup', body: 'Quickly get nearby YouBike stations, including how many bikes are available and how many docks are free.', points: ['Station lookup', 'Available bikes', 'Free docks', 'Multiple cities'] },
        { title: 'Weather forecasts', body: 'Look up current weather and forecasts to help plan commutes and trips out.', points: ['Current weather', '3-hour forecast', '3-day forecast', '1-week forecast'] },
        { title: 'LINE interaction', body: 'Flex Messages and a rich menu give a more intuitive, chat-based experience.', points: ['Keyword triggers', 'Rich menu', 'Flex Message', 'Image messages'] },
      ],
      challenges: [
        { label: 'Data Integration', title: 'Integrating several third-party APIs', problem: 'The YouBike and Central Weather Administration APIs use different data formats and field definitions. Using them directly would raise maintenance costs, and failed requests or bad data also had to be handled.', solution: 'Built a data conversion layer that unifies the data structure and response format, with error handling, improving stability and maintainability.', tags: ['Node.js', 'Express'] },
        { label: 'User Experience', title: 'Designing the chat flow', problem: 'Users cannot navigate with a menu bar as on a website, and too many features would make the bot harder to learn.', solution: 'Designed a rich menu and keyword triggers, and presented information with Flex Messages, for a clearer experience.', tags: ['LINE Bot SDK', 'Flex Message'] },
        { label: 'Data Normalization', title: 'Combining data from several cities', problem: 'YouBike APIs differ in structure and format between cities, making the data harder to process and maintain.', solution: 'Defined one data format and conversion logic that turns every source into the same structure, making later features easier to add.', tags: ['Node.js', 'API Integration'] },
      ],
      verification: [
        'Wrote small scripts that call the YouBike and weather APIs to check the response formats',
        'Tried the keywords and rich menu in LINE to check the replies',
        'No automated tests yet; testing is mainly manual',
      ],
      retrospective: {
        learned: 'Every source formats its data differently. Converting everything into one format first keeps the reply logic much simpler.',
        next: 'Add tests for the conversion layer, and tell users what happened when an external API fails.',
      },
    },
  },
]

export const contact: typeof zh.contact = {
  eyebrow: 'Contact',
  title: 'Let’s get in touch.',
  body: 'I am open to new frontend roles. If your team is looking for a frontend engineer who knows Vue and follows problems down to their root cause, I would love to hear from you.',
}

// Screenshot captions, keyed by the Chinese caption in data/project-images.ts.
export const captions: Record<string, string> = {
  '首頁：封面、天氣與當日行程': 'Home: cover, weather and today’s plan',
  '行程詳情：交通、地圖與景點資訊': 'Itinerary detail: transport, map and sights',
  '旅遊資訊：即時資訊與行前準備': 'Travel info: live information and preparation',
  '旅遊資訊：行李清單': 'Travel info: packing list',
  '旅遊資訊：迪士尼樂園規劃（示意資料）': 'Travel info: Disneyland plan (sample data)',
  '旅遊資訊：迪士尼行程地圖（示意資料）': 'Travel info: Disney route map (sample data)',
  'AI 旅遊助手': 'AI travel assistant',
  '花費紀錄（示意資料）': 'Expense log (sample data)',
  '揪團首頁': 'Meetup home',
  '搜尋功能': 'Search',
  '揪團詳情': 'Meetup detail',
  '聊天室': 'Chat room',
  '主辦揪團管理': 'Host meetup management',
  '個人資料管理': 'Profile management',
  '首頁 Hero': 'Home hero',
  'Case Study 列表': 'Case study list',
  '作品詳情': 'Project detail',
  'LINE 官方帳號首頁': 'LINE Official Account home',
  '系統資訊總覽': 'System overview',
  '貓咪管理': 'Cat management',
  '公告管理': 'Announcement management',
  '功能選單': 'Rich menu',
  'YouBike 查詢': 'YouBike lookup',
  'YouBike 位置分享查詢': 'YouBike lookup by shared location',
  '天氣預報': 'Weather forecast',
  '天氣預報查詢': 'Weather forecast lookup',
}

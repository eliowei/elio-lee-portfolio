// English version of data/experience.ts.
import type * as zh from '../experience'

export const intro: typeof zh.intro = {
  title: 'From building interfaces to building engineering quality.',
  body: 'My work experience, the technologies I have applied, and the engineering understanding I have built up along the way.',
  pills: [
    { icon: 'domain', color: 'text-primary', label: 'Frontend Engineer at RollingStar Survey Technology Limited' },
    { icon: 'school', color: 'text-primary', label: 'Chien Hsin University, Information Management' },
    { icon: 'layers', color: 'text-primary', label: 'Vue 2 / Vue 3 & Vuetify projects' },
    { icon: 'accessibility_new', color: 'text-primary', label: 'Accessibility rework, verified with NVDA' },
    { icon: 'map', color: 'text-secondary', label: 'OpenLayers geospatial maps' },
    { icon: 'code', color: 'text-tertiary-container', label: 'Data-flow tracing and ordering-flow extension' },
  ],
}

export const roles: typeof zh.roles = [
  {
    no: '01',
    dot: 'primary',
    badge: 'Full-time',
    period: '2025/04 — Present',
    place: 'RollingStar Survey Technology Limited',
    title: 'Frontend Engineer | RollingStar Survey Technology Limited',
    summary: 'Responsible for frontend development and maintenance of the company’s systems, including interface development, tracing existing issues and extending features.',
    tagIcon: 'explore',
    tagLabel: 'GIS / Web Frontend',
    stack: [
      { label: 'Vue 2', primary: true }, { label: 'Vue 3', primary: true }, { label: 'Vuetify 2', primary: true },
      { label: 'Vuetify 3', primary: true }, { label: 'JavaScript' }, { label: 'OpenLayers' },
    ],
    listTitle: 'Main responsibilities and focus',
    listIcon: 'task_alt',
    items: [
      { title: 'Developing and maintaining Vue 2 and Vue 3 projects', body: 'The company has both Vue 2 and Vue 3 projects, all written with the Options API. I handle behaviour and styling issues in components such as dialogs, menus and form validation.' },
      { title: 'Fixing accessibility audit findings', body: 'Took over the fixes for a rejected accessibility audit, covering heading structure, keyboard operation, form labels, skip links and access keys, helping the site pass the level A audit.' },
      { title: 'Tracing defects in existing code', body: 'When an error comes from a defect in existing code, I trace the data flow and business logic to find the root cause and fix it, using the JavaScript prototype chain to adjust the code, rather than only treating the symptom.' },
      { title: 'Extending the ordering flow', body: 'Extended the whole ordering flow: first understanding the existing feature from the code, then adjusting the steps from the user’s point of view to make the flow more intuitive.' },
      { title: 'Rounding out requirements from the user’s view', body: 'When asked for back-office CRUD features, I added image previews and zoom on my own initiative, so administrators can check content without downloading it.' },
      { title: 'OpenLayers geospatial maps', body: 'Understanding how OpenLayers is used in surveying systems, helping integrate map layers with the frontend interface and adjusting parameters as needed.' },
    ].map(i => ({ ...i, icon: 'check_circle' })),
    highlight: {
      icon: 'accessibility_new',
      title: 'Case: making the date picker accessible',
      body: 'While reworking a Vue 3 project to accessibility standards, I found the Vuetify date picker’s keyboard and screen reader support incomplete. I wrote a shared mixin adding arrow-key navigation, focus management and date labels for screen readers, applied it to several forms, and confirmed with NVDA that it reads correctly.',
    },
  },
  {
    no: '02',
    dot: 'secondary',
    badge: 'Vocational training, Software development',
    period: '2024/09 — 2025/03',
    place: 'Taishan Vocational Training Center',
    title: 'Frontend Web Development Training | Taishan Vocational Training Center',
    summary: 'Completed about six months of frontend web development training, from web fundamentals and component-based Vue development to frontend–backend integration, building a full foundation in website development.',
    tagIcon: 'school',
    tagLabel: 'Full-stack foundations',
    stack: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Vue.js', 'Vuetify', 'Node.js', 'Express', 'MongoDB', 'Git']
      .map(label => ({ label, primary: ['HTML', 'CSS', 'JavaScript', 'Vue.js', 'Vuetify'].includes(label) })),
    listTitle: 'What I learned and built',
    listIcon: 'auto_stories',
    items: [
      { title: 'Frontend fundamentals and interaction', body: 'Learned HTML, CSS, JavaScript, jQuery and responsive web design, getting familiar with page structure, styling and interaction logic through hands-on work.' },
      { title: 'Component-based Vue development', body: 'Learned Vue.js and Vuetify, understanding how to split components, pass data and build user interfaces.' },
      { title: 'Backend and database basics', body: 'Worked with Node.js, Express, MongoDB and RESTful APIs, understanding how data is exchanged between frontend and backend and basic data operations.' },
      { title: 'A full project workflow', body: 'Took part in a complete project, from ideation, Figma visual design, mind maps, sitemaps and database planning to frontend and backend development and deployment.' },
    ].map(i => ({ ...i, icon: 'check_circle' })),
    highlight: {
      icon: 'group_work',
      title: 'Capstone project: a gaming meetup website',
      body: 'Starting from gamers’ need to find teammates, I built a website integrating frontend and backend. The frontend uses Vue and Vuetify, the backend API is built with Node.js and Express, and data is stored in MongoDB; I completed the integration and deployment.',
    },
  },
  {
    no: '03',
    dot: 'outline',
    badge: 'Military, Full-time',
    period: '2017/12 — 2023/12',
    place: 'ROC Army 21st Artillery Command',
    title: 'Volunteer Soldier | 21st Artillery Command, 6th Army Corps',
    summary: 'During six years of service, I was mainly responsible for repairing and inspecting military vehicles.',
    tagIcon: 'shield',
    tagLabel: 'Discipline and execution',
    listTitle: 'Main responsibilities and skills',
    listIcon: 'fact_check',
    items: [
      { icon: 'build', title: 'Vehicle repair and inspection', body: 'Checked vehicles item by item according to the procedures, determined the cause of a fault, then carried out the repair.' },
      { icon: 'assignment_turned_in', title: 'Mission execution', body: 'Planned work according to mission needs and completed it on schedule.' },
      { icon: 'groups', title: 'Teamwork', body: 'Carried out tasks within a team and established procedures, building responsibility and discipline.' },
    ],
    quote: 'Six years of repair and inspection work taught me to check against the procedures and find the root cause before starting a repair. That habit carries over into frontend development: when something breaks, I first trace the cause and its scope, then decide how to change the code.',
  },
]

export const transitions: typeof zh.transitions = [
  {
    after: '03',
    title: 'Leaving the army and rediscovering programming',
    body: ['After leaving the army, I started thinking about the next stage of my career. I had been interested in programming since I was a child, so I decided to return to it through the training programme at the Taishan Vocational Training Center, starting with frontend basics such as HTML, CSS and JavaScript and gradually building up web development knowledge and practical skills.'],
  },
  {
    after: '02',
    title: 'From a capstone project to real software development',
    body: [
      'The capstone project during training gave me hands-on experience from requirements planning and interface design to frontend–backend integration, and on that basis I landed my first job as a frontend engineer.',
      'Since joining the industry, I have come to understand the real software development process more deeply, and the gap between classroom learning and day-to-day work. Through feature development, debugging and maintaining and adjusting existing systems, I keep gaining experience and learning how to balance feature requirements, maintainability and user experience in real projects.',
    ],
  },
]

export const matrix: typeof zh.matrix = {
  title: 'Technologies and how I use them',
  body: 'The technologies I have actually used in company and personal projects, and where I used them.',
  heads: ['Area', 'Technologies and tools', 'In practice', 'Where'],
  rows: [
    { icon: 'devices', domain: 'Frontend frameworks', stack: 'Vue 2 / Vue 3, JavaScript, TypeScript', scope: 'Company Vue 2 and Vue 3 projects are written with the Options API; personal projects use the Composition API and TypeScript', source: 'Company + personal' },
    { icon: 'brush', domain: 'UI libraries and styling', stack: 'Vuetify 2 / Vuetify 3, CSS / SASS', scope: 'Dialog and menu overlay positioning, form validation, CSS overrides and responsive layout fixes', source: 'Company projects' },
    { icon: 'accessibility_new', domain: 'Accessibility', stack: 'JavaScript, NVDA', scope: 'Reworked Vue 3 interfaces to accessibility standards, used a shared mixin to add keyboard operation, focus management and screen reader labels to the date picker, and tested with NVDA', source: 'Company projects' },
    { icon: 'map', domain: 'Geospatial maps', stack: 'OpenLayers', scope: 'Helped integrate map layers with the frontend interface and adjusted parameters as needed', source: 'Company projects' },
    { icon: 'hub', domain: 'Full-stack', stack: 'Vue 3, PrimeVue, Node.js, MongoDB, LINE Messaging API', scope: 'Built a LINE Official Account bot for a friend, then extended it with an admin and database so the shop can change what the LINE OA shows from the admin', source: 'Personal project' },
    { icon: 'build', domain: 'Build and version control', stack: 'Vite, Webpack, Git, GitLab', scope: 'Adjusted chunk splitting at build time after Lighthouse flagged oversized JS files; as a solo developer, reviewed AI-generated code through a merge request workflow', source: 'Hands-on experience' },
    { icon: 'api', domain: 'API integration and debugging', stack: 'Postman, Axios, Chrome DevTools', scope: 'Verified backend APIs, aligned payload formats, and traced issues in the Console and Network panels', source: 'Company projects' },
  ],
}

export const principlesSection: typeof zh.principlesSection = {
  title: 'What I have learned on the job',
  body: 'Three working habits I have built up while developing and maintaining projects.',
}

export const principles: typeof zh.principles = [
  { title: 'Understanding framework differences', body: 'Working on both Vue 2 and Vue 3 projects, I understand how the component APIs, default behaviour and styling differ between versions, and I don’t copy one version’s patterns straight into the other.' },
  { title: 'Following problems to the root', body: 'I start by reproducing the problem, then trace the data flow and business logic to tell whether it comes from a defect in existing code, event propagation, lifecycle order or CSS stacking, and verify the result after fixing it.' },
  { title: 'Rounding out requirements from the user’s view', body: 'When I get a requirement, I don’t stop at the spec; I think about how it will actually be used, for example adding image preview and zoom to a back-office CRUD, or making steps more intuitive when extending the ordering flow.' },
]

export const cta: typeof zh.cta = {
  title: 'Want to talk further?',
  body: 'If anything in my experience makes you want to know more, feel free to leave me a message.',
}

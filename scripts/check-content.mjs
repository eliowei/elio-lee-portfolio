// Content / i18n consistency checks. No dependencies: `node scripts/check-content.mjs` (or `npm run check:content`).
// Chinese (zh) is the reference language; en and ja must mirror it. Exit code 1 when anything is off.
//   1. every file in content/{blog,legal} exists in content/en/ and content/ja/ (the language switcher links to the same slug)
//   2. an article is a draft in all languages or in none
//   3. i18n/locales/{en,ja}.json have exactly the keys of zh.json
//   4. no key appears twice in one JSON object (JSON.parse silently keeps the last one, so a typo overwrites a message)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const LANGS = ['en', 'ja']
const problems = []
const fail = msg => problems.push(msg)

// 1 + 2: content files
for (const kind of ['blog', 'legal']) {
  const base = readdirSync(join('content', kind)).filter(f => f.endsWith('.md')).sort()
  for (const lang of LANGS) {
    const dir = join('content', lang, kind)
    const have = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.md')) : []
    for (const f of base) if (!have.includes(f)) fail(`content/${lang}/${kind}/${f} is missing (it exists in zh)`)
    for (const f of have) if (!base.includes(f)) fail(`content/${lang}/${kind}/${f} has no zh counterpart`)
  }
  if (kind !== 'blog') continue
  const isDraft = (path) => {
    const front = readFileSync(path, 'utf8').split(/^---\s*$/m)[1] ?? ''
    return /^draft:\s*true\b/m.test(front)
  }
  for (const f of base) {
    const zh = isDraft(join('content', kind, f))
    for (const lang of LANGS) {
      const path = join('content', lang, kind, f)
      if (existsSync(path) && isDraft(path) !== zh) fail(`${path}: draft is ${!zh}, but zh is ${zh}`)
    }
  }
}

// 3: i18n keys
const flat = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`])
const load = lang => JSON.parse(readFileSync(join('i18n', 'locales', `${lang}.json`), 'utf8'))
const zhKeys = new Set(flat(load('zh')))
for (const lang of LANGS) {
  const keys = new Set(flat(load(lang)))
  for (const k of zhKeys) if (!keys.has(k)) fail(`i18n/locales/${lang}.json is missing "${k}"`)
  for (const k of keys) if (!zhKeys.has(k)) fail(`i18n/locales/${lang}.json has "${k}", which zh.json does not`)
}

// 4: duplicate keys. Line based, which is enough for the pretty-printed one-key-per-line files used here.
for (const lang of ['zh', ...LANGS]) {
  const file = join('i18n', 'locales', `${lang}.json`)
  const scopes = []
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (/^\s*[}\]]/.test(line)) scopes.pop()
    const key = line.match(/^\s*"([^"]+)"\s*:/)?.[1]
    const scope = scopes.at(-1)
    if (key && scope) {
      if (scope.has(key)) fail(`${file}:${i + 1} duplicate key "${key}"`)
      scope.add(key)
    }
    if (/[{[]\s*$/.test(line)) scopes.push(new Set())
  })
}

if (problems.length) {
  console.error(`check-content: ${problems.length} problem(s)\n` + problems.map(p => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log(`check-content: ok (${zhKeys.size} i18n keys, content and drafts match in ${['zh', ...LANGS].join(' / ')})`)

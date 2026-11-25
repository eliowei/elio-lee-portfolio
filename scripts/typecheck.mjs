// `nuxt typecheck` with the same environment as the Vercel build.
// On Vercel, @nuxt/image switches to its `vercel` provider, whose types differ from the local `ipx` provider (for example it has no
// `format` modifier). A check that passes locally can therefore fail on Vercel. Setting VERCEL=1 makes Nuxt generate the same types here.
import { spawnSync } from 'node:child_process'

const result = spawnSync('nuxt', ['typecheck'], { stdio: 'inherit', shell: true, env: { ...process.env, VERCEL: process.env.VERCEL || '1' } })
process.exit(result.status ?? 1)

// English version of data/notes.ts.
import type * as zh from '../notes'

export const page: typeof zh.page = {
  eyebrow: 'Technical Notes',
  title: 'Technical Notes',
  lead: 'Building a fuller technical understanding, starting from real problems. These notes cover frontend development, debugging and technical exploration in personal projects, turning scattered experience into knowledge that can be understood, verified and reused.',
  facts: ['Reproduce → root cause → verify', 'Runnable code examples', 'Updated regularly'],
}

export const method: typeof zh.method = {
  eyebrow: 'Methodology',
  title: 'How I work through and write up technical problems.',
  body: 'In real projects, pitfalls usually come from wrong assumptions about edge cases or underlying mechanisms. Instead of piling up fragments, each note follows a four-step process so the solution can be carried over to other situations.',
  steps: [
    { title: 'Reproduce', body: 'Remove environmental noise and distil a minimal reproduction.' },
    { title: 'Find the cause', body: 'Check the language specification, framework lifecycle and rendering mechanism.' },
    { title: 'Fix and verify', body: 'Design the fix and verify it with tests or by actually using it.' },
    { title: 'Prevent', body: 'Turn it into rules, component constraints or documentation so the mistake does not happen again.' },
  ],
}

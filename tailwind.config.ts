import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

// Design system "Elio Lee / Digital Space".
//   Dark stage #0C0D0F (immersion: hero, project space, case covers) · light paper #F3F2EE (reading; dark theme: #111316) ·
//   survey orange #FF5B1F as the single identity colour.
// #FF5B1F is for dark grounds and non-text marks. Text/links on the light ground use `signal-ink` (5.05:1 on paper).
// The semantic token names (surface-*, on-surface, primary…) are kept and remapped, so content components re-skin.
const type = (size: string, lh: string, ls: string, weight: string): [string, Record<string, string>] => [
  size,
  { lineHeight: lh, letterSpacing: ls, fontWeight: weight },
]

// Colours that change with the theme are CSS variables (channels, so `/<alpha>` still works); see app/assets/css/theme.css.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`
const SEMANTIC = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container', 'primary-fixed', 'primary-fixed-dim', 'on-primary-fixed', 'on-primary-fixed-variant', 'inverse-primary',
  'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container', 'secondary-fixed', 'secondary-fixed-dim', 'on-secondary-fixed', 'on-secondary-fixed-variant',
  'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container', 'tertiary-fixed', 'tertiary-fixed-dim', 'on-tertiary-fixed', 'on-tertiary-fixed-variant',
  'error', 'on-error', 'error-container', 'on-error-container',
  'background', 'on-background', 'surface', 'surface-bright', 'surface-dim', 'surface-tint', 'surface-variant',
  'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest',
  'on-surface', 'on-surface-variant', 'inverse-surface', 'inverse-on-surface', 'outline', 'outline-variant',
]

const HEADING_FONT = "Geist, 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"
const headingSizes = ['display', 'display-mobile', 'headline-lg', 'headline-lg-mobile', 'headline-md', 'headline-sm']

export default <Partial<Config>>{
  content: [],
  theme: {
    extend: {
      colors: {
        // --- Space palette: the dark stage is fixed (dark sections stay dark in both themes)...
        lab: {
          bg: '#0C0D0F', 'bg-soft': '#15171A', 'bg-raise': '#1F2125',
          paper: token('background'), // ...except the reading ground, which follows the theme
          signal: '#FF5B1F', 'signal-ink': token('signal-ink'),
          'on-dark': '#ECEBE7', 'on-dark-muted': '#9A9DA3',
        },
        // --- Semantic tokens (content ground). Light + dark values live in app/assets/css/theme.css.
        ...Object.fromEntries(SEMANTIC.map(n => [n, token(n)])),
        hairline: { DEFAULT: token('hairline'), strong: token('hairline-strong') },
      },
      borderRadius: { sm: '0.125rem', DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      // Light ground: cards are a 1px stroke (shadow-sm); hover darkens the stroke + a barely-there micro shadow (shadow-md).
      boxShadow: {
        DEFAULT: '0 0 0 1px rgb(var(--c-hairline))',
        sm: '0 0 0 1px rgb(var(--c-hairline))',
        md: '0 0 0 1px rgb(var(--c-hairline-strong)), 0 1px 3px rgba(0, 0, 0, 0.08)',
        lg: '0 0 0 1px rgb(var(--c-hairline-strong)), 0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        gutter: '1.5rem', 'gutter-mobile': '1rem',
        margin: '2rem', 'margin-mobile': '1.25rem',
        'space-xs': '0.25rem', 'space-sm': '0.5rem', 'space-md': '1rem', 'space-lg': '1.5rem', 'space-xl': '2.5rem',
        'space-2xl': '5rem', 'space-3xl': '7rem', // section rhythm
      },
      fontFamily: {
        sans: ['Inter', "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"],
        mono: ["'Geist Mono'", 'ui-monospace', 'monospace'],
      },
      // Body 16–18px at ~1.7; the home title is sized in main.css (`.space-title`).
      fontSize: {
        display: type('4rem', '1.1', '-0.02em', '600'),
        'display-mobile': type('2.5rem', '1.15', '-0.02em', '600'),
        'headline-lg': type('2.25rem', '1.2', '-0.015em', '600'),
        'headline-lg-mobile': type('1.75rem', '1.25', '-0.01em', '600'),
        'headline-md': type('1.625rem', '1.3', '-0.01em', '600'),
        'headline-sm': type('1.25rem', '1.35', '0em', '600'),
        'body-lg': type('1.125rem', '1.7', '0em', '400'),
        'body-md': type('1rem', '1.7', '0em', '400'),
        'body-sm': type('0.875rem', '1.65', '0em', '400'),
        'label-md': type('0.8125rem', '1.4', '0em', '500'),
        'label-sm': type('0.75rem', '1.4', '0.04em', '500'),
        'code-block': type('0.875rem', '1.7', '0em', '400'),
      },
      maxWidth: { page: '1200px' },
    },
  },
  plugins: [
    // Headlines use Geist, body Inter: tailwind's fontSize can't carry a family, so add it per size class.
    plugin(({ addUtilities }) => {
      // :not(icon) — icons reuse these size classes (e.g. text-headline-sm) and must keep the icon font.
      addUtilities(Object.fromEntries(headingSizes.map(n => [`.text-${n}:not(.material-symbols-outlined)`, { fontFamily: HEADING_FONT }])))
    }),
  ],
}

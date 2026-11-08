import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

// Design system "Elio Lee / Digital Space".
//   Dark stage #0C0D0F (immersion: hero, project space, case covers) · light paper #F3F2EE (reading) ·
//   survey orange #FF5B1F as the single identity colour.
// #FF5B1F is for dark grounds and non-text marks. Text/links on the light ground use `signal-ink` (5.05:1 on paper).
// The semantic token names (surface-*, on-surface, primary…) are kept and remapped, so content components re-skin.
const type = (size: string, lh: string, ls: string, weight: string): [string, Record<string, string>] => [
  size,
  { lineHeight: lh, letterSpacing: ls, fontWeight: weight },
]

const HEADING_FONT = "Geist, 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"
const headingSizes = ['display', 'display-mobile', 'headline-lg', 'headline-lg-mobile', 'headline-md', 'headline-sm']

export default <Partial<Config>>{
  content: [],
  theme: {
    extend: {
      colors: {
        // --- Space palette (also exposed as CSS variables in main.css)
        lab: {
          bg: '#0C0D0F', 'bg-soft': '#15171A', 'bg-raise': '#1F2125',
          paper: '#F3F2EE',
          signal: '#FF5B1F', 'signal-ink': '#B83D0E',
          'on-dark': '#ECEBE7', 'on-dark-muted': '#9A9DA3',
        },
        // --- Semantic tokens (light content ground)
        primary: '#B83D0E', 'on-primary': '#ffffff',
        'primary-container': '#FF5B1F', 'on-primary-container': '#0C0D0F',
        'primary-fixed': '#ffe4d8', 'primary-fixed-dim': '#ffc2a8',
        'on-primary-fixed': '#4a1703', 'on-primary-fixed-variant': '#8f2f0a',
        'inverse-primary': '#ff9a72',
        secondary: '#55575C', 'on-secondary': '#ffffff',
        'secondary-container': '#e6e4df', 'on-secondary-container': '#3a3c40',
        'secondary-fixed': '#e6e4df', 'secondary-fixed-dim': '#cfccc5',
        'on-secondary-fixed': '#0c0d0f', 'on-secondary-fixed-variant': '#3a3c40',
        tertiary: '#B83D0E', 'on-tertiary': '#ffffff',
        'tertiary-container': '#FF5B1F', 'on-tertiary-container': '#0c0d0f',
        'tertiary-fixed': '#ffe4d8', 'tertiary-fixed-dim': '#ffc2a8',
        'on-tertiary-fixed': '#4a1703', 'on-tertiary-fixed-variant': '#8f2f0a',
        error: '#ba1a1a', 'on-error': '#ffffff',
        'error-container': '#ffdad6', 'on-error-container': '#93000a',
        background: '#f3f2ee', 'on-background': '#0c0d0f',
        surface: '#f3f2ee', 'surface-bright': '#ffffff', 'surface-dim': '#dcdad4',
        'surface-tint': '#b83d0e', 'surface-variant': '#e8e6e1',
        'surface-container-lowest': '#ffffff', 'surface-container-low': '#ecebe6',
        'surface-container': '#e6e4df', 'surface-container-high': '#dfddd7',
        'surface-container-highest': '#d6d4ce',
        'on-surface': '#0c0d0f', 'on-surface-variant': '#55575c',
        'inverse-surface': '#0c0d0f', 'inverse-on-surface': '#ecebe7',
        outline: '#6b6e74', 'outline-variant': '#cfccc5',
        hairline: { DEFAULT: '#dedcd6', strong: '#cfccc5' },
      },
      borderRadius: { sm: '0.125rem', DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      // Light ground: cards are a 1px stroke (shadow-sm); hover darkens the stroke + a barely-there micro shadow (shadow-md).
      boxShadow: {
        DEFAULT: '0 0 0 1px #dedcd6',
        sm: '0 0 0 1px #dedcd6',
        md: '0 0 0 1px #cfccc5, 0 1px 3px rgba(12, 13, 15, 0.06)',
        lg: '0 0 0 1px #cfccc5, 0 1px 3px rgba(12, 13, 15, 0.06)',
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

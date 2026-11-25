import withNuxt from './.nuxt/eslint.config.mjs'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

// Recommended rules only. Formatting preferences are off on purpose: this code base has its own dense style and
// the goal is to catch bugs, not to reformat files.
export default withNuxt(
  { rules: { 'vue/attributes-order': 'off' } },
  {
    // i18n: visible words in templates must come from i18n/locales/*.json, and every $t('key') must exist there.
    files: ['app/**/*.{vue,ts}'],
    plugins: { '@intlify/vue-i18n': vueI18n },
    settings: { 'vue-i18n': { localeDir: './i18n/locales/*.json', messageSyntaxVersion: '^11.0.0' } },
    rules: {
      '@intlify/vue-i18n/no-missing-keys': 'error',
      '@intlify/vue-i18n/no-raw-text': ['error', {
        // Text with no letters in it (numbers, punctuation, symbols such as 02 / + × © % *) is not translatable.
        ignorePattern: String.raw`^[-#:,.?!<>|/\d\s%+×©*°—–()\[\]]+$`,
        // Names and codes that stay the same in every language. Add to this list on purpose, not to silence a warning.
        ignoreText: [
          'GitHub', 'Email', 'Elio Lee', '李柏偉 (Elio Lee)', // names / terms used as they are
          'Website', // hidden honeypot label (sr-only, aria-hidden)
          'N–0', 'C', 'F', // list markers: N–01, C1, F1
          'AZ 000.0° EL 0.0°', 'X —.— Y —.—', // decorative readouts
        ],
      }],
    },
  },
)

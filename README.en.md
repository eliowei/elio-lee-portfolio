# Elio Lee Portfolio

[繁體中文](README.md) | English

The personal website of Elio Lee (李柏偉). The home page is a 3D digital ruin you can walk into: as you scroll, the camera passes through a stone gate at the summit and down a staircase into a corridor, where every project is a door.

## Features

- **Continuous 3D camera**: A single rail runs from outside the ruin to the end of the corridor, driven by scroll progress, with no scene cuts.
- **Project preview and entry**: Hovering moves the camera to a project's gate, and clicking passes through it into the case study. Animations can be interrupted when switching quickly between projects.
- **Custom shaders**: Three.js materials are extended with GLSL to create stone textures, digital engravings, and a decode effect on project images.
- **Accessible alternatives**: Every project is a real link, so the 3D scene is never the only way in. Keyboard navigation (↑ ↓ and Enter) and two-tap touch entry are supported. Phones get an SVG and card list instead, and the site respects the reduced motion setting.
- **Page transitions**: The View Transitions API carries project thumbnails into the case study cover.
- **Content management**: Technical notes are written in Markdown and managed with Nuxt Content.

## Design Direction

The concept is a "digital ruin": grey stone with a single orange signal color. Every energy element in the 3D scene is orange, while project accent colors stay in the HTML and screenshots to keep the scene focused.

- Dark sections carry the story and the 3D scene, and light sections are for reading.
- Type is set in Barlow and Noto Sans TC, with monospace for labels and numbering.
- Animations respect the system's reduced motion setting.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Nuxt 4, Vue 3, TypeScript |
| 3D and motion | Three.js, GLSL |
| Styling | Tailwind CSS |
| Content and SEO | Nuxt Content, Nuxt Image, Sitemap |
| Contact form | EmailJS |

The 3D camera and animation are implemented directly with Three.js. Scroll reveal on regular page sections uses IntersectionObserver and the Web Animations API.

## Performance and Fonts

Lighthouse (mobile, default throttling): notes list, contact and article pages score about 96–97; home, projects and experience about 60–80; desktop home 96. Accessibility, best practices and SEO are all 100 (article pages: 96 accessibility, a false positive from the header's `mix-blend-difference`).

- Lighthouse's LCP is simulated on slow 4G; measured LCP is about 0.5–1 s. Home-page TBT varies a lot between runs (roughly 300–1,100 ms), so its score jumps around.
- **All fonts are self-hosted** (`public/fonts/`); pages load no external font CSS.
  - `scripts/fetch-fonts.py` downloads Inter, Barlow, IBM Plex Mono (Latin only) and a Material Symbols icon subset, and generates `app/assets/css/latin-fonts.generated.css`. **When you add an icon name, add it to the script's `ICONS` list and re-run it**, or the icon renders as plain text.
  - `scripts/subset-font.py` cuts Noto Sans TC down to the characters the site actually uses, in four groups (`en` / `ui` / `article` / `ja`, with disjoint `unicode-range`), so a page downloads only the groups it needs. Re-run it after adding a lot of text; missing characters fall back to the system font. Both scripts need `pip install fonttools brotli`; the font source URL is in the script header.
  - Do not use the `media="print"` + `onload` trick to load Google Fonts without blocking: in this project `onload` never fires, the stylesheet stays on `print`, and neither fonts nor icons load.
- The `/blog` and home notes queries use `.select()` to fetch only the fields the list needs, so article bodies stay out of the payload.
- Scroll reveal (`v-reveal`) uses IntersectionObserver + the Web Animations API (`app/plugins/reveal.ts`); no animation library is bundled.
- The three.js chunk is not prefetched (`build:manifest` hook in `nuxt.config.ts`): phones never use it, desktops still load it on demand.
- Icons sit in a fixed 1em box, so nothing shifts before the icon font loads.
- `nitro.compressPublicAssets` only makes the local `node-server` preview compress like a CDN so measurements are realistic; it has no effect on Vercel.

Known trade-off: the menu button no longer sets `aria-label` (its visible text `Menu` / `Close` is the name, to satisfy the "visible text must be in the name" check), so screen readers read English for Chinese and Japanese users. The copy-code button now shows localized text.

## Design System and Dark Mode

The site supports light and dark themes (follows the OS by default; the header button toggles it and remembers the choice). Colours, type, spacing, components and the theming mechanism are documented in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) (written in Chinese). Theme colour values live in `app/assets/css/theme.css`; the Tailwind setup is in `tailwind.config.ts`.

## Project Structure

```text
app/
├── components/   Page sections and the 3D stage
├── data/         Site copy and project data
├── lib/          3D scene (space-scene.ts) and ruin layout (ruin.ts)
├── pages/        Home, projects, experience, notes, contact
└── plugins/      scroll reveal (v-reveal)
content/blog/     Technical notes in Markdown
public/images/    Project screenshots and profile photo
public/fonts/     self-hosted fonts (generated by scripts/)
scripts/          font download and subsetting scripts
```

## Local Development

Requires Node.js 22.5 or later.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

To build and preview for production:

```bash
npm run build
npm run preview
```

See `.env.example` for environment variables. `NUXT_PUBLIC_SITE_URL` is the site URL used for canonical links and the sitemap, and `NUXT_PUBLIC_EMAILJS_*` configures the contact form.

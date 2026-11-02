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
- Type is set in Geist and Noto Sans TC, with monospace for labels and numbering.
- Animations respect the system's reduced motion setting.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Nuxt 4, Vue 3, TypeScript |
| 3D and motion | Three.js, GLSL, GSAP |
| Styling | Tailwind CSS |
| Content and SEO | Nuxt Content, Nuxt Image, Sitemap |
| Contact form | EmailJS |

The 3D camera and animation are implemented directly with Three.js. GSAP handles scroll reveal effects on regular page sections.

## Project Structure

```text
app/
├── components/   Page sections and the 3D stage
├── data/         Site copy and project data
├── lib/          3D scene (space-scene.ts) and ruin layout (ruin.ts)
├── pages/        Home, projects, experience, notes, contact
└── plugins/      GSAP scroll reveal
content/blog/     Technical notes in Markdown
public/images/    Project screenshots and profile photo
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

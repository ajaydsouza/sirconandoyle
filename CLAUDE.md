# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:4321 (no search)
npm run build      # Run prebuild (gen-redirects.js) then build to ./dist/
npm run preview    # Preview production build locally
bash scripts/test-search.sh  # Clean build + serve dist/client on port 4321 (search works here)
```

`scripts/test-search.sh` cleans `dist/`, runs `npm run build`, then serves `dist/client` via `npx serve` on port 4321. Use this to test Pagefind search, which requires a full production build.

To deploy manually to Cloudflare Workers:
```bash
source ~/.zshrc 2>/dev/null && npx wrangler deploy
```

## Git and Commits

- **Do not add Co-Authored-By lines** to commits
- **Do not git push** — you'll push manually yourself

## Architecture

**Astro static site** (`output: 'static'`) about Sir Arthur Conan Doyle and Sherlock Holmes canon. Production site: `https://sirconandoyle.com`. Internal links must use `import.meta.env.BASE_URL` to support subpath deployments.

### Content Collections (`src/content/`)

Three Zod-validated collections defined in `src/content.config.ts`:

- **canon** — Holmes stories: short stories in sub-collections (`adventures/`, `memoirs/`, `return/`, `last-bow/`, `casebook/`) and novels (`novels/<novel-dir>/`)
- **novels** — Non-Holmes Conan Doyle novels, each in its own subdirectory
- **pages** — Static pages (about, privacy, contact, etc.)

All content is Markdown with YAML front matter. Front matter fields: `title`, `description`, `date`, `collection` (short stories), `novel` (Holmes novels and non-Holmes novels), `order`, `coverImage`, `tags`.

### Routing (`src/pages/`)

File-based static routing; all paths are pre-rendered at build time via `getStaticPaths()`:

- `/[slug]` → pages collection
- `/canon/[collection]/` → Holmes short story collection index (intro content + TOC)
- `/canon/[collection]/[slug]` → Holmes short stories
- `/canon/novels/[novel]/` → Holmes novel index (intro content + chapter list)
- `/canon/novels/[novel]/[slug]` → Holmes novel chapters
- `/novels/[novel]/` → Non-Holmes novel index (intro content + chapter list)
- `/novels/[novel]/[slug]` → Non-Holmes novel chapters
- `/search` → Pagefind full-text search UI (noindex)

### Intro Files

Each novel directory and each short story collection has an **intro file** (the markdown file whose slug matches the novel/collection directory name, or `the-<dir>` for some). The intro file powers the index page — it is **not** given its own `[slug]` route.

**Detection pattern** — for novels, `isIntroSlug(slug, dir)` checks `slug === dir || slug === 'the-' + dir`. For short story collections, explicit slug maps are used (`INTRO_SLUGS` in both `[collection]/index.astro` and `[collection]/[slug].astro`):

```
adventures → the-adventures-of-sherlock-holmes
memoirs    → the-memoirs-of-sherlock-holmes
return     → the-return-of-sherlock-holmes
last-bow   → his-last-bow
casebook   → the-case-book-of-sherlock-holmes
```

> Note: casebook's intro has `order: 2` (not 1) and a hyphenated title ("The Case-**Book**"). Do not use title matching to detect it — use the explicit slug map.

**`getStaticPaths()` isolation** — functions defined at module level are not accessible inside `getStaticPaths()` in Astro. Define any helper (like `isIntroSlug`) inside `getStaticPaths()`, and again at module level if needed for the render section of the same file.

### Prebuild Script

`scripts/gen-redirects.js` runs before every build (`prebuild` npm hook). It walks `src/content/` and generates `public/_redirects` mapping legacy WordPress-style URLs to the new Astro routes (301 redirects). Modify this if content paths change.

### Styling

TailwindCSS v4 with custom theme in `src/styles/global.css`. Parchment/ink color scheme with Cormorant Garamond (serif), Inter (sans-serif), and Great Vibes (display). The `prose` class applies article typography. The single shared layout is `src/layouts/Base.astro`.

### Deployment

**GitHub Pages** — GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on every push to `main`. Uploads the entire `./dist` directory.

**Cloudflare Workers** — configured via `wrangler.jsonc` (root). The `@astrojs/cloudflare` adapter generates `dist/server/wrangler.json` at build time, which overrides the root config and adds `"main": "entry.mjs"` and `"assets": {"directory": "../client"}`. The root `wrangler.jsonc` only has the assets binding (no `main`).

### Key Configuration Notes

- **`imageService: 'passthrough'`** — required in the Cloudflare adapter config. Without it, the adapter's default Sharp service tries to generate `/_image?href=...` URLs that Workers can't handle.
- **`prerenderEnvironment: 'node'`** — required alongside passthrough. The default `'workerd'` renders pages inside the Cloudflare workerd runtime during build, which ignores the configured imageService and forces `/_image` URLs regardless.
- **Pagefind search scripts** — never use `<script is:inline>` for the Pagefind UI setup. `is:inline` bypasses Vite processing, so `import.meta.env.BASE_URL` remains as a literal string and causes a TypeError in the browser before pagefind-ui.js loads. Use `<script>` (no attribute) so Vite replaces the env variable at build time.
- **`vite.ssr.external: ['@pagefind/default-ui']`** — required to prevent Vite from trying to bundle the Pagefind UI package during SSR.

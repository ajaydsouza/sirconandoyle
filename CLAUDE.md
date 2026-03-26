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

## Architecture

**Astro static site** about Sir Arthur Conan Doyle and Sherlock Holmes canon. Production site: `https://sirconandoyle.com`. Currently deployed to GitHub Pages at `https://ajay.social/sirconandoyle/` (subpath — all internal links must use `import.meta.env.BASE_URL`).

### Content Collections (`src/content/`)

Three Zod-validated collections defined in `src/content.config.ts`:

- **canon** — Holmes stories organized by sub-collection (`adventures/`, `memoirs/`, `return/`, `last-bow/`, `casebook/`) and novels (`novels/`)
- **novels** — Non-Holmes Conan Doyle novels, each in its own subdirectory
- **pages** — Static pages (about, privacy, contact, etc.)

All content is Markdown with YAML front matter.

### Routing (`src/pages/`)

File-based static routing; all paths are pre-rendered at build time via `getStaticPaths()`:

- `/[slug]` → pages collection
- `/canon/[collection]/[slug]` → Holmes short stories
- `/canon/novels/[novel]/[slug]` → Holmes novels
- `/novels/[novel]/[slug]` → Non-Holmes novels
- `/search` → Pagefind full-text search UI (noindex)

### Prebuild Script

`scripts/gen-redirects.js` runs before every build. It walks `src/content/` and generates `public/_redirects` mapping legacy WordPress-style URLs to the new Astro routes (301 redirects). Modify this if content paths change.

### Styling

TailwindCSS v4 with custom theme in `src/styles/global.css`. Uses a parchment/ink color scheme with serif (Cormorant Garamond) and sans-serif (Inter) fonts. The `prose` class applies article typography.

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on every push to `main`. Cloudflare Pages is also configured via `wrangler.jsonc` (manual deploy or separate pipeline).

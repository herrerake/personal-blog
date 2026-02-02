# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
yarn install              # Install dependencies
yarn dev                  # Start dev server at localhost:4321
yarn build                # Production build to dist/
yarn preview              # Preview production build locally
yarn lint                 # Run ESLint on .astro, .js, .ts, .tsx files
yarn format               # Format with Prettier + Astro plugin
yarn workers:deploy       # Build and deploy to Cloudflare Workers
```

**Requirements:** Node.js 22 LTS (required by Vite 6), Yarn package manager.

## Architecture

This is a personal portfolio/blog site built with **Astro 5** using hybrid server-side rendering, deployed to **Cloudflare Workers**.

### Rendering & Routing

- **Output mode:** `server` (hybrid SSR via `@astrojs/cloudflare` adapter)
- **File-based routing:** Pages in `src/pages/` map directly to routes
- **API endpoints:** Server-side routes at `src/pages/api/*.ts` (e.g., `ticker.json.ts` for live sports/market data)

### Content Collections

Content is managed through Astro's content collections with Zod schema validation:

- **Blog entries:** `src/content/blog/*.md|mdx`
- **Portfolio entries:** `src/content/portfolio/*.mdx`
- **Schema definitions:** `src/content/config.ts`

Required frontmatter fields (both collections):
- `title`, `pubDate`, `description`, `author`, `tags[]`, `featured`
- `image: { url, alt }`
- Blog only: `series` (required string)

### Path Alias

Import from `src/` using `@/` prefix (configured in `astro.config.mjs`):
```typescript
import Header from "@/components/Header.astro";
```

### Styling

Tailwind CSS with custom design tokens defined in `tailwind.config.mjs`. Use utility classes as the primary styling mechanism.

## Verification

- UI/content changes: run `yarn dev` to spot-check
- Build/deployment changes: run `yarn build` to verify

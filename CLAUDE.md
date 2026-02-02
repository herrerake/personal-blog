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

### Dark Mode

Dark mode uses Tailwind's `darkMode: "class"` strategy. The `.dark` class is toggled on `<html>`.

**Key files:**
- `src/styles/global.css` - CSS custom properties (single source of truth for theme colors)
- `src/components/ThemeToggle.astro` - Toggle button with sun/moon icons
- `src/components/BaseHead.astro` - Inline script prevents FOUC by reading localStorage/system preference

**Color variables in global.css:**
```css
:root {
  --body-bg: #FFFEF5;      /* Light: ivory */
  --body-text: #042c55;    /* Light: dark blue */
  --text-secondary: #667085;
  --color-positive: #16a34a;
  --color-negative: #dc2626;
  --color-divider: #9ca3af;
  --color-active-dot: #ED1C24;
}
.dark {
  --body-bg: #0d1117;      /* Dark: terminal black */
  --body-text: #e6edf3;    /* Dark: off-white */
  --text-secondary: #8b949e;
  --color-positive: #3fb950;
  --color-negative: #f85149;
  --color-divider: #8b949e;
  --color-active-dot: #39d353; /* Green for TUI aesthetic */
}
```

**Theme change event:** Components can listen for theme changes:
```javascript
window.addEventListener("themechange", (e) => {
  console.log("Dark mode:", e.detail.isDark);
});
```

### Live Ticker

The homepage ticker (`src/pages/index.astro`) fetches data from `/api/ticker.json` and displays scrolling sports/market updates.

**Implementation notes:**
- Uses `requestAnimationFrame` for smooth scrolling (not CSS animations)
- Reads colors from CSS custom properties via `getComputedStyle()` for theme support
- Listens for `themechange` event to re-render with correct colors
- Cleanup function stored in `window.__herrerake.tickerCleanup` for View Transitions
- Re-initializes on `astro:page-load` event

### View Transitions

The site uses Astro's View Transitions. Components with client-side state must:
1. Clean up on navigation (cancel animations, clear intervals, remove listeners)
2. Re-initialize on `astro:page-load` event
3. Store cleanup functions in `window.__herrerake` namespace

## Verification

- UI/content changes: run `yarn dev` to spot-check
- Build/deployment changes: run `yarn build` to verify
- Dark mode: toggle theme and verify all pages render correctly in both modes

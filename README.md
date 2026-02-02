# Herrerake

Personal portfolio/blog site built with Astro, Tailwind CSS, and MDX. Features a homepage with live sports/markets ticker, portfolio showcase, and blog powered by content collections. Includes dark mode with a TUI (terminal) aesthetic.

## Stack

- Astro 5 (hybrid SSR)
- Tailwind CSS
- MDX + content collections
- Cloudflare Workers adapter
- View Transitions API

## Quick start

```sh
yarn install
yarn dev
```

Dev server runs at `http://localhost:4321`.

## Scripts

| Command | Action |
| --- | --- |
| `yarn dev` | Start local dev server |
| `yarn build` | Build production site into `dist/` |
| `yarn preview` | Preview the production build |
| `yarn lint` | Run ESLint on `.astro`, `.js`, `.ts`, `.tsx` |
| `yarn format` | Format with Prettier + Astro plugin |
| `yarn workers:deploy` | Build and deploy to Cloudflare Workers |

## Content

Content collections live in `src/content/` and are validated by
`src/content/config.ts`.

### Blog entries

```yaml
title: "Post title"
pubDate: 2023-12-11
description: "Short summary"
author: "Your name"
image:
  url: "/blog-placeholder-1.jpg"
  alt: "Alt text"
tags: ["personal", "engineering"]
series: "Series name"
featured: true
```

### Portfolio entries

```yaml
title: "Project name"
pubDate: 2023-12-11
description: "Short summary"
author: "Your name"
image:
  url: "/project-image.png"
  alt: "Alt text"
tags: ["design", "development"]
featured: true
```

## Features

### Dark Mode

Toggle between light (Apple-minimalist) and dark (TUI terminal aesthetic) themes. Theme preference is saved to localStorage and respects system preference on first visit.

- Light: Ivory background (#FFFEF5), blue text
- Dark: Terminal black (#0d1117), high-contrast text, green accents

### Live Ticker

Homepage displays a scrolling ticker with live sports scores and market data. Colors adapt to theme via CSS custom properties defined in `src/styles/global.css`.

## Deployment

Set the canonical site URL in `astro.config.mjs` and use:

```sh
yarn workers:deploy
```

## Structure

- `src/pages/`: route entry points
- `src/components/`: shared UI
- `src/layouts/`: post layouts
- `src/content/`: blog + portfolio entries
- `public/`: static assets

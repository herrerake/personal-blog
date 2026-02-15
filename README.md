# Herrerake

Personal portfolio/blog site built with Astro, Tailwind CSS, and MDX. Features a homepage with live sports/markets ticker, portfolio showcase, blog, and **OTR (Off the Record)** — weekly columns by mentors served at `otr.herrerake.com`. Includes dark mode with a TUI (terminal) aesthetic.

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

## Sites

| Domain | Description |
| --- | --- |
| `herrerake.com` | Main site — portfolio, blog, ticker |
| `otr.herrerake.com` | Off the Record — weekly mentor columns |

In local dev, OTR pages are at `/otr/*` (e.g., `localhost:4321/otr/`). In production, middleware (`src/middleware.ts`) rewrites `otr.herrerake.com/*` to the `/otr/*` routes.

## Content

Content collections live in `src/content/` and are validated by `src/content/config.ts`.

### Blog entries

Add `.md` or `.mdx` files to `src/content/blog/`.

```yaml
title: "Post title"
pubDate: 2023-12-11
description: "Short summary"
author: "Your name"
image:
  url: "/images/blog-placeholder-1.jpg"
  alt: "Alt text"
tags: ["personal", "engineering"]
series: "Series name"
featured: true
```

### Portfolio entries

Add `.md` or `.mdx` files to `src/content/portfolio/`.

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

### OTR columns

Add `.md` or `.mdx` files to `src/content/otr/`. The `author` field must match an author `slug` (filename without extension) from `src/content/authors/`.

```yaml
title: "Column title"
pubDate: 2026-02-10
description: "Short summary"
author: "john-doe"
image:
  url: "/image.jpg"
  alt: "Alt text"
tags: ["career", "writing"]
featured: true
column: "Optional Column Name Override"
```

To add a new author, create a JSON file in `src/content/authors/` (e.g., `john-doe.json`) and place their avatar image in `public/columnists/`. The helper functions in `src/data/authors.ts` query the content collection.

## Features

### Dark Mode

Toggle between light (Apple-minimalist) and dark (TUI terminal aesthetic) themes. Theme preference is saved to localStorage and respects system preference on first visit.

- Light: Ivory background (#FFFEF5), blue text
- Dark: Terminal black (#0d1117), high-contrast text, green accents

### Live Ticker

Homepage displays a scrolling ticker with live sports scores and market data. Colors adapt to theme via CSS custom properties defined in `src/styles/global.css`.

## Deployment

Use `yarn workers:deploy` to build and deploy to Cloudflare Workers.

For the OTR subdomain, add a CNAME record for `otr` pointing to the worker domain in Cloudflare DNS, then add `otr.herrerake.com` as a custom domain on the worker.

## Structure

```
src/
├── components/         # Shared UI components
│   └── otr/            # OTR-specific components (header, footer, cards)
├── content/
│   ├── blog/           # Blog posts (.md/.mdx)
│   ├── portfolio/      # Portfolio entries (.mdx)
│   ├── otr/            # OTR column posts (.md/.mdx)
│   └── config.ts       # Collection schemas (Zod)
├── data/
│   └── authors.ts      # Author query helpers (content collection)
├── layouts/            # Page layouts (BlogPost, OTRLayout)
├── pages/
│   ├── api/            # Server-side API routes
│   ├── blog/           # Blog pages
│   ├── portfolio/      # Portfolio pages
│   └── otr/            # OTR pages (hub, authors, posts)
├── styles/
│   └── global.css      # CSS custom properties / theme
├── middleware.ts        # Subdomain routing (otr.herrerake.com)
└── consts.ts           # Site-wide constants
```

## Agent Skills

This project includes [agent skills](https://www.npmjs.com/package/skills) that extend AI coding agents with domain-specific knowledge. Skills live in `.agents/skills/` and are symlinked into `.claude/skills/` for Claude Code.

**Installed project skills:**

| Skill | Source | Description |
| --- | --- | --- |
| `astro` | `astrolicious/agent-skills` | Astro framework best practices |
| `cloudflare` | `cloudflare/skills` | Cloudflare platform knowledge |
| `tailwind-design-system` | `wshobson/agents` | Tailwind design system patterns |
| `frontend-design` | `anthropics/skills` | Frontend design guidelines |

To install a new skill: `npx skills add <owner/repo> -s <skill-name>`

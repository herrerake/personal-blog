# Herrerake

Personal site built with Astro, Tailwind CSS, and MDX. It includes a homepage,
portfolio, and blog powered by content collections.

## Stack

- Astro 3
- Tailwind CSS
- MDX + content collections
- Cloudflare Pages adapter

## Quick start

```sh
npm install
npm run dev
```

Dev server runs at `http://localhost:4321`.

## Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Start local dev server |
| `npm run build` | Build production site into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint on `.astro`, `.js`, `.ts`, `.tsx` |
| `npm run format` | Format with Prettier + Astro plugin |
| `npm run workers:dev` | Build and run Cloudflare Workers dev |
| `npm run workers:deploy` | Build and deploy to Cloudflare Workers |

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

## Deployment

Set the canonical site URL in `astro.config.mjs` and use:

```sh
npm run workers:deploy
```

## Structure

- `src/pages/`: route entry points
- `src/components/`: shared UI
- `src/layouts/`: post layouts
- `src/content/`: blog + portfolio entries
- `public/`: static assets

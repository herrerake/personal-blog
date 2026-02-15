# AGENTS

This file provides guidance for AI agents and contributors working in this
repository. Keep changes minimal, focused, and consistent with the project's
existing style.

## Project overview

- Astro site with Tailwind and MDX content collections.
- Deploy target: Cloudflare Workers (via `@astrojs/cloudflare`).
- Package manager: yarn.

## Prerequisites

- Node.js 22 LTS (required by Vite 6).
- Yarn (classic or modern is fine; this repo uses `package.json` scripts).

## Common commands

```sh
yarn install
yarn dev
yarn build
yarn preview
yarn lint
yarn format
yarn workers:dev
yarn workers:deploy
```

## Repo structure

- `src/pages/`: route entrypoints
- `src/components/`: shared UI components
- `src/layouts/`: layouts for Markdown/MDX content
- `src/content/`: blog, portfolio, OTR, and authors content collections
- `public/`: static assets

## Content rules

- Content collections are defined in `src/content/config.ts`.
- Keep frontmatter aligned with the schema (required fields, types, etc.).

## Coding guidelines

- Prefer small, self-contained changes.
- Match existing formatting and conventions in `.astro` and `.mdx` files.
- Use Tailwind utility classes as the primary styling mechanism.

## Verification

- If you change UI or content, run `yarn dev` to spot-check.
- If you change build or deployment settings, run `yarn build`.

## Agent Skills

Project-level skills are in `.agents/skills/` (astro, cloudflare, tailwind-design-system, frontend-design). These provide domain-specific knowledge for Astro, Cloudflare Workers, Tailwind CSS, and frontend design. Symlinks in `.claude/skills/` and `.agent/skills/` point back to `.agents/skills/`.

Install new skills with `npx skills add <owner/repo> -s <skill-name>`.

## Notes for agents

- Do not delete or overwrite content unless explicitly requested.
- Avoid introducing new dependencies without asking.
- OTR author data lives in `src/content/authors/*.json`, queried via `src/data/authors.ts`.
- OTR pages are server-rendered (not prerendered) and use `Astro.locals.isColumns` for routing decisions.

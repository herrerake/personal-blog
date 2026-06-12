# Copilot Cloud Agent Onboarding (herrerake/personal-blog)

## Start here
- Tech stack: Astro 5 + Tailwind + MDX/content collections, deployed with `@astrojs/cloudflare`.
- Package manager: **yarn** (`yarn@1.22.x` in `package.json`).
- Node: **22+** required.
- Key docs to read first:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `README.md`

## Repository map (high-signal)
- `src/pages/` — routes and API endpoints.
- `src/pages/otr/` — OTR routes (server-rendered paths for subdomain content).
- `src/components/` and `src/components/otr/` — shared and OTR-specific UI.
- `src/content/` — blog, portfolio, OTR posts, and author records.
- `src/content/config.ts` — content collection schemas (frontmatter contract).
- `src/data/authors.ts` — author lookup helpers used by OTR pages.
- `src/middleware.ts` — host-based routing rewrite for `otr.*` → `/otr/*`.
- `astro.config.mjs` — Cloudflare adapter + `@` alias to `src/`.

## How to work efficiently
1. Use focused edits only; avoid unrelated cleanup.
2. Prefer existing patterns and Tailwind utility classes over introducing new abstractions.
3. If changing content/frontmatter, verify schema compatibility in `src/content/config.ts`.
4. If changing OTR behavior, verify both:
   - local `/otr/*` routing
   - middleware rewrite behavior for `otr.` host.
5. Avoid adding dependencies unless explicitly required.

## Useful commands
```sh
yarn install
yarn lint
yarn build
yarn test
yarn dev
```

## Validation expectations
- For code changes: run lint/build/tests relevant to the change.
- For UI/content-only changes: at least run `yarn build` (and `yarn dev` spot-check when practical).
- Do not assume baseline is clean; check current command output before deciding what is newly introduced.

## Errors encountered during onboarding (and workarounds)
These were observed while onboarding this repository:

1. `yarn lint` currently fails on pre-existing issues unrelated to onboarding:
   - `src/data/authors.ts`: `@typescript-eslint/ban-types` on `{}` usage.
   - `src/env.d.ts`: `@typescript-eslint/triple-slash-reference`.
   - `src/pages/otr/index.astro`: unused variable `featuredPosts`.
   **Workaround:** treat as existing baseline failures unless your task touches these files/areas; avoid unrelated fixes.

2. `yarn test` passes but reports:
   - “Tests closed successfully but something prevents Vite server from exiting”.
   **Workaround:** treat test run as successful when all suites pass; if needed, investigate with Vitest hanging-process reporter for dedicated test-runtime work.

3. `yarn build` completes with warnings:
   - Cloudflare adapter reminders about `SESSION` binding and runtime `sharp` limitation.
   - Astro prerender warnings about `Astro.request.headers` usage on prerendered routes.
   **Workaround:** these are informational unless your task changes deployment/runtime behavior or prerender strategy.

## Notes for future agents
- OTR author files are JSON in `src/content/authors/`; `author` frontmatter in OTR posts must match author slug.
- OTR pages are intentionally server-rendered; do not blindly add `prerender`.
- For cloud-agent onboarding tasks, keep this file updated when baseline tooling behavior changes.

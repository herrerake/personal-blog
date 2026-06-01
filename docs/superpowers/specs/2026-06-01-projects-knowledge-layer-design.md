# Projects Knowledge Layer & Page — Design Spec

**Date:** 2026-06-01
**Status:** Approved for planning
**Branch target:** new feature branch off `main`

## Objective

Replace the placeholder `src/pages/projects.astro` ("Coming soon") with a curated,
automatically generated **Projects** portfolio. Generated project data is treated as a
reusable **project knowledge layer** — one typed, validated source of truth that powers
the `/projects` grid now and is designed to later feed:

- `/projects/[slug]` case-study detail pages
- homepage "currently building" sections
- "related projects" sections
- future writing / talks / project cross-links

Projects are presented as **products and case studies**, not repository listings. The page
highlights product thinking, systems design, AI/agent workflows, web platform architecture,
Cloudflare ecosystem expertise, CMS/content-ops expertise, impact, and technical execution.

## Source of Truth

The curated set of repositories comes from the private GitHub Stars List
`projects-page` (`github.com/stars/herrerake/lists/projects-page`). Only repositories in
that list appear on the page — never the full public repo set.

**Constraint (verified):** the Stars List has no public REST/GraphQL endpoint and its web
page 404s unauthenticated. It is reachable only via the authenticated `gh` CLI:

```
gh api graphql -f query='{ viewer { lists(first:20){ nodes {
  name slug items(first:60){ nodes { __typename
    ... on Repository { nameWithOwner isPrivate } } } } } } }'
```

Current list contents (both **private**): `herrerake/ff-almanac`, `herrerake/quedate`.

## Decisions (locked)

1. **Generation model:** offline script that *I (Claude Code) run on demand*. The script
   gathers raw repo data; I analyze it and author curated JSON committed to git. Builds stay
   100% static — no API keys, no LLM calls, no network at build or runtime.
2. **List ingestion:** `gh` GraphQL `viewer.lists` each run (authenticated CLI), not HTML scraping.
3. **Storage/merge:** plain typed data modules + loader (not an Astro content collection),
   matching the existing `src/data/` pattern (`authors.ts`, `tags.ts`). Override wins field-by-field.
4. **v1 scope:** data pipeline + Projects grid page only. Everything else designed but deferred.

## Privacy (hard requirement)

This site repo is public and deployed. The listed repos are **private**. Therefore:

- Raw repo content (READMEs, source, configs) is written **only** to a gitignored
  `.cache/` directory and is **never committed**.
- Only `src/data/projects.generated.json` — public-safe prose I author deliberately — and
  `src/data/projects.overrides.json` are committed.
- Public-facing `githubUrl` is **omitted while a repo is private** (a public link would 404
  for visitors). It is surfaced only when the repo is public or an override supplies a URL.

## File Structure

```
scripts/projects/
  ingest.mjs                  # gh GraphQL list -> per-repo raw bundle -> .cache (gitignored)
  README.md                   # how to run the 2-stage pipeline
.cache/
  projects.raw.json           # GITIGNORED — raw private-repo content + resolved list snapshot
src/data/
  projects.schema.ts          # Zod schema, Category/Status unions, types, ProvenanceSource
  projects.generated.json     # COMMITTED — curated public case-study content (I author)
  projects.overrides.json     # COMMITTED — hand edits: order, featured, hidden, field overrides
  projects.ts                 # loader: merge generated+overrides, validate, public API
src/components/
  ProjectCard.astro           # card matching CardWrapper aesthetic
src/pages/
  projects.astro              # replaces placeholder: header + grid
```

`.gitignore` gains `/.cache/`.

## Data Model (`src/data/projects.schema.ts`)

```ts
type Status = "live" | "in-progress" | "prototype" | "archived";

type Category =
  | "AI" | "Agents" | "Cloudflare" | "CMS" | "Automation"
  | "Developer Tools" | "Web Platforms" | "Photography"
  | "Open Source" | "Experiments";

type Metric = { value?: string; label: string };          // "3,000+" / "pages audited"
type Screenshot = { src: string; caption?: string; featured: boolean };

type Score = {                                             // internal ranking; not rendered v1
  originality: number;        technicalComplexity: number;
  productThinking: number;    aiUsage: number;
  platformRelevance: number;  impact: number;
  documentation: number;      total: number;
} | null;

type ProvenanceSource =
  | "readme" | "agents" | "claude" | "package.json"
  | "github-metadata" | "override" | "ai-inference";

type CaseStudy = {                                         // deferred detail content (optional v1)
  overview?: string; problem?: string; solution?: string;
  architecture?: string; technicalHighlights?: string;
  aiAndAutomation?: string; lessonsLearned?: string; futureRoadmap?: string;
};

type Project = {
  id: string;                 // stable identifier (repo-derived, e.g. "ff-almanac")
  title: string;
  slug: string;               // URL slug
  startedAt: string;          // ISO date
  status: Status;
  role: string;               // e.g. "Solo engineer", "Lead"
  audience: string;           // who it serves
  motivation: string;         // why it exists / why I built it
  summary: string;
  elevatorPitch: string;
  stack: string[];
  categories: Category[];
  features: string[];
  architectureHighlights: string[];
  aiCapabilities: string[];
  impact: string;             // renamed from businessValue — broader than "business"
  metrics: Metric[];          // optional, first-class
  relationships: string[];    // related project ids/slugs -> future "Related Projects"
  screenshots: Screenshot[];  // first-class, not buried in overrides
  currentlyBuilding: boolean; // future homepage "currently building" pulls from here
  portfolioScore: Score;      // internal ranking/recommendation; not rendered in v1
  githubUrl?: string;         // omitted while repo private
  liveUrl?: string;
  lastUpdated: string;        // ISO (repo pushedAt or override)
  caseStudy?: CaseStudy;
  provenance?: Partial<Record<keyof Project, ProvenanceSource>>; // field-level source map; internal
};
```

A Zod schema validates every merged project at load time; the build fails loudly on a bad
record. Empty arrays / sensible defaults for optional collections; `portfolioScore` defaults
`null`; `currentlyBuilding` defaults `false`.

## GitHub Integration Strategy

All access through the authenticated `gh` CLI — no tokens stored in the repo. Per repo the
ingest script gathers:

- **Metadata:** `description`, `repositoryTopics`, `languages`, `homepageUrl`, `pushedAt`,
  `updatedAt`, `isPrivate`, `url`.
- **Files when present:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`,
  `wrangler.toml` / `wrangler.jsonc`, `Dockerfile`; plus a shallow root directory tree.

Metadata-first with file-analysis fallback (handles repos like `quedate` that have empty
description/topics). Each captured datum is tagged with its `ProvenanceSource` so Stage 2 can
record where each generated field came from.

## Stars List Ingestion Strategy

`gh api graphql` -> `viewer.lists` -> select the node with `slug === "projects-page"` ->
read `items.nodes[].nameWithOwner`. The resolved list is snapshotted into the raw cache. If
the list query returns empty or errors (e.g. not authenticated), the script aborts with a
clear message rather than producing partial data.

## Content Generation Strategy (two stages)

- **Stage 1 — `scripts/projects/ingest.mjs` (mechanical):** resolve the list, gather each
  repo's raw bundle, write `.cache/projects.raw.json` (gitignored). Deterministic, no judgment.
- **Stage 2 — authoring (me, judgment):** read the raw bundle and write
  `src/data/projects.generated.json` conforming to the schema — translating repo signals into
  product/case-study prose (summary, elevatorPitch, motivation, features, architectureHighlights,
  aiCapabilities, impact, metrics, categories, screenshots, relationships, portfolioScore) and
  recording `provenance` per field. Regenerable; never clobbers overrides.

Generated content is **draft input only**. It is committed (public-safe), but overrides always win.

## Override System Design (`projects.overrides.json`)

```jsonc
{
  "order":    ["ff-almanac", "quedate"],   // explicit display order (ids/slugs)
  "featured": ["ff-almanac"],              // surfaced/emphasized
  "hidden":   [],                          // dropped from output entirely
  "bySlug": {
    "ff-almanac": { "summary": "…", "screenshots": [ … ], "liveUrl": "…" }
  }
}
```

Loader deep-merges `bySlug[slug]` over the generated record **field-by-field** (override
wins), stamps `provenance` `"override"` for each overridden field, drops `hidden`, sorts by
`order` then `lastUpdated` desc, and marks `featured`. The portfolio owner always has final
editorial control.

## Loader API (`src/data/projects.ts`)

Designed for the whole knowledge layer; v1 only calls `getProjects()`:

```ts
getProjects(): Project[];                 // merged, validated, ordered, non-hidden — used by /projects (v1)
getProject(slug: string): Project | undefined;   // future /projects/[slug]
getCurrentlyBuilding(): Project[];        // future homepage section
getRelated(slug: string): Project[];      // future "Related Projects"
```

All build-time and static.

## Rendering Plan (v1)

`src/pages/projects.astro` — `export const prerender = true` (site is `output: server` but
this data is build-time static). Reuses existing `Header`, `Footer`, `CardWrapper`, Tailwind
design tokens, and dark-mode classes — no new design language.

- **Header section:** curated intro framing these as selected projects, systems, experiments,
  and products focused on AI-native web platforms, automation, content systems, and DX.
- **Project grid:** responsive grid of `ProjectCard`, each showing title, status badge, summary,
  stack chips, category chips, live link, and GitHub link **only when the repo is public**.

Filter bar, `/projects/[slug]`, screenshot gallery UI, related-projects UI, and homepage
integration are modeled in the data but **not rendered in v1**.

## v1 Scope

**Build:**
- GitHub Stars List ingestion (`gh` GraphQL)
- Raw cache generation (gitignored)
- Generated project data (authored, committed)
- Local overrides + merge/validate loader (full knowledge-layer API)
- Projects page grid (header + cards)

**Defer (designed, not built):**
- Filters
- `/projects/[slug]` detail pages
- Screenshot gallery UI
- Related-projects UI
- Homepage "currently building" integration
- Public `portfolioScore` / provenance display

## Assumptions

- Replace `src/pages/projects.astro`; leave the separate `/portfolio` collection untouched.
- This repo is public -> never commit private repo content; `/.cache/` is gitignored.
- `gh` stays authenticated locally when ingestion runs; the pipeline is manual/on-demand, not CI.
- Static generation via `prerender = true`.
- Reuse `CardWrapper` + existing design tokens; introduce no new design system.
- Node 22 / Yarn per project requirements; ingest script is `.mjs` runnable with `node`.

## Verification

- `yarn dev` -> spot-check `/projects` in light and dark mode.
- `yarn build` -> confirm the page prerenders and the loader's Zod validation passes.
- Confirm `.cache/` is gitignored and no private repo content is staged for commit.
```

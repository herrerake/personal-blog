# Projects Knowledge Layer & Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/projects` page with a statically generated portfolio driven by a typed, validated project knowledge layer fed from a curated GitHub Stars List.

**Architecture:** A two-stage offline pipeline. Stage 1 (`scripts/projects/ingest.mjs`) uses the authenticated `gh` CLI to resolve the private Stars List `projects-page` and dump raw repo data to a gitignored `.cache/`. Stage 2 (human/AI authoring) turns that into committed, public-safe `projects.generated.json`. A loader (`src/data/projects.ts`) deep-merges generated content with hand-authored `projects.overrides.json` (override wins per field), validates every record with Zod, and exposes a knowledge-layer API. The v1 page renders only public projects in a grid using existing components.

**Tech Stack:** Astro 5 (SSR-on-Cloudflare, static `prerender`), TypeScript (strict), Zod, Vitest (new, data-layer only), Tailwind, `gh` CLI for ingestion.

**Reference spec:** `docs/superpowers/specs/2026-06-01-projects-knowledge-layer-design.md`

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `.gitignore` (modify) | Ignore `/.cache/` (raw private-repo content never committed) |
| `package.json` (modify) | Add `zod` dep, `vitest` devDep, `test` script |
| `vitest.config.ts` (create) | Vitest config via Astro's `getViteConfig` (gives `@/` alias) |
| `src/data/projects.schema.ts` (create) | Zod schema, enums, `Project` type |
| `src/data/projects.schema.test.ts` (create) | Schema validation/defaults tests |
| `src/data/projects.ts` (create) | Merge + validate + select; knowledge-layer API |
| `src/data/projects.test.ts` (create) | Merge/override/visibility/order tests |
| `src/data/projects.generated.json` (create) | COMMITTED curated content (authored Stage 2) |
| `src/data/projects.overrides.json` (create) | COMMITTED editorial overrides |
| `src/data/projects.integration.test.ts` (create) | Asserts real `getProjects()` output is valid |
| `scripts/projects/ingest.mjs` (create) | Stage 1: `gh` → raw cache |
| `scripts/projects/README.md` (create) | Pipeline run instructions |
| `src/components/ProjectCard.astro` (create) | Project card matching house style |
| `src/pages/projects.astro` (modify) | Replace placeholder with header + grid |

---

### Task 1: Tooling — Vitest, Zod, gitignore

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/data/sanity.test.ts` (temporary, deleted at end of task)

- [ ] **Step 1: Add `/.cache/` to `.gitignore`**

Append to `.gitignore` (after the `# build output` block):

```
# raw ingestion cache — private repo content, never committed
/.cache/
```

- [ ] **Step 2: Install zod + vitest**

Run:

```bash
yarn add zod && yarn add -D vitest
```

Expected: both packages added; `package.json` updated.

- [ ] **Step 3: Add `test` script to `package.json`**

In the `"scripts"` object add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Add a temporary sanity test**

Create `src/data/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("tooling", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the test**

Run: `yarn test`
Expected: PASS — 1 test passed.

- [ ] **Step 7: Delete the sanity test**

```bash
rm src/data/sanity.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add .gitignore package.json yarn.lock vitest.config.ts
git commit -m "chore: add vitest + zod for projects data layer"
```

---

### Task 2: Project schema (`projects.schema.ts`)

**Files:**
- Create: `src/data/projects.schema.ts`
- Test: `src/data/projects.schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/projects.schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { projectSchema } from "./projects.schema";

// Minimal object with every REQUIRED field present.
const base = {
  id: "demo",
  title: "Demo",
  slug: "demo",
  timeline: { startedAt: "2026-01-01" },
  status: "live",
  projectType: "product",
  role: "Solo engineer",
  audience: "Everyone",
  motivation: "Because",
  summary: "A demo project.",
  elevatorPitch: "Demo.",
  impact: "Some impact.",
  lastUpdated: "2026-01-02",
};

describe("projectSchema", () => {
  it("applies defaults for optional collections and flags", () => {
    const p = projectSchema.parse(base);
    expect(p.visibility).toBe("coming-soon");
    expect(p.stack).toEqual([]);
    expect(p.categories).toEqual([]);
    expect(p.screenshots).toEqual([]);
    expect(p.connections).toEqual([]);
    expect(p.currentlyBuilding).toBe(false);
    expect(p.portfolioScore).toBeNull();
  });

  it("rejects an unknown status", () => {
    expect(() => projectSchema.parse({ ...base, status: "bogus" })).toThrow();
  });

  it("rejects an unknown category", () => {
    expect(() => projectSchema.parse({ ...base, categories: ["Nope"] })).toThrow();
  });

  it("accepts a fully populated record", () => {
    const p = projectSchema.parse({
      ...base,
      visibility: "public",
      categories: ["AI", "Cloudflare"],
      stack: ["Astro"],
      metrics: [{ value: "3,000+", label: "pages audited" }],
      connections: [{ type: "project", slug: "other" }],
      screenshots: [{ src: "/x.png", featured: true }],
      featuredImage: "/hero.png",
      currentlyBuilding: true,
      portfolioScore: {
        originality: 8, technicalComplexity: 7, productThinking: 8,
        aiUsage: 6, platformRelevance: 9, impact: 7, documentation: 7, total: 76,
      },
      provenance: { summary: "readme" },
    });
    expect(p.visibility).toBe("public");
    expect(p.metrics[0].value).toBe("3,000+");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/data/projects.schema.test.ts`
Expected: FAIL — cannot resolve `./projects.schema`.

- [ ] **Step 3: Implement the schema**

Create `src/data/projects.schema.ts`:

```ts
import { z } from "zod";

export const STATUSES = ["live", "in-progress", "prototype", "archived"] as const;
export const VISIBILITIES = ["public", "private", "coming-soon"] as const;
export const PROJECT_TYPES = [
  "product", "platform", "tool", "agent", "automation", "website", "experiment",
] as const;
export const CATEGORIES = [
  "AI", "Agents", "Cloudflare", "CMS", "Automation",
  "Developer Tools", "Web Platforms", "Photography", "Open Source", "Experiments",
] as const;
export const PROVENANCE_SOURCES = [
  "readme", "agents", "claude", "package.json",
  "github-metadata", "override", "ai-inference",
] as const;
export const CONNECTION_TYPES = ["project", "article", "talk", "photo", "note"] as const;

const metricSchema = z.object({
  value: z.string().optional(),
  label: z.string(),
});

const screenshotSchema = z.object({
  src: z.string(),
  caption: z.string().optional(),
  featured: z.boolean().default(false),
});

const connectionSchema = z.object({
  type: z.enum(CONNECTION_TYPES),
  slug: z.string(),
});

const timelineSchema = z.object({
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

const scoreSchema = z
  .object({
    originality: z.number(),
    technicalComplexity: z.number(),
    productThinking: z.number(),
    aiUsage: z.number(),
    platformRelevance: z.number(),
    impact: z.number(),
    documentation: z.number(),
    total: z.number(),
  })
  .nullable();

const caseStudySchema = z.object({
  overview: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  architecture: z.string().optional(),
  technicalHighlights: z.string().optional(),
  aiAndAutomation: z.string().optional(),
  lessonsLearned: z.string().optional(),
  futureRoadmap: z.string().optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  timeline: timelineSchema,
  status: z.enum(STATUSES),
  visibility: z.enum(VISIBILITIES).default("coming-soon"),
  projectType: z.enum(PROJECT_TYPES),
  role: z.string(),
  audience: z.string(),
  motivation: z.string(),
  canonicalNarrative: z.string().optional(),
  summary: z.string(),
  elevatorPitch: z.string(),
  stack: z.array(z.string()).default([]),
  categories: z.array(z.enum(CATEGORIES)).default([]),
  features: z.array(z.string()).default([]),
  architectureHighlights: z.array(z.string()).default([]),
  aiCapabilities: z.array(z.string()).default([]),
  impact: z.string(),
  metrics: z.array(metricSchema).default([]),
  connections: z.array(connectionSchema).default([]),
  featuredImage: z.string().optional(),
  screenshots: z.array(screenshotSchema).default([]),
  currentlyBuilding: z.boolean().default(false),
  portfolioScore: scoreSchema.default(null),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  lastUpdated: z.string(),
  caseStudy: caseStudySchema.optional(),
  provenance: z.record(z.enum(PROVENANCE_SOURCES)).optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Visibility = (typeof VISIBILITIES)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/data/projects.schema.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/data/projects.schema.ts src/data/projects.schema.test.ts
git commit -m "feat: add project knowledge-layer schema"
```

---

### Task 3: Loader — merge, validate, order (`projects.ts`)

**Files:**
- Create: `src/data/projects.ts`
- Test: `src/data/projects.test.ts`

This task builds the pure functions only. The JSON-backed wrappers (`getProjects`, etc.) and the real data files are added in Task 6; until then `projects.ts` does not import the JSON.

- [ ] **Step 1: Write the failing test**

Create `src/data/projects.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mergeProjects, selectPublic, selectCurrentlyBuilding, selectRelated } from "./projects";

function gen(overrides: Record<string, unknown> = {}) {
  return {
    id: "a",
    title: "A",
    slug: "a",
    timeline: { startedAt: "2026-01-01" },
    status: "live",
    visibility: "public",
    projectType: "product",
    role: "Solo engineer",
    audience: "Everyone",
    motivation: "Because",
    summary: "Generated summary.",
    elevatorPitch: "A.",
    impact: "Impact.",
    lastUpdated: "2026-01-10",
    provenance: { summary: "readme" },
    ...overrides,
  };
}

describe("mergeProjects", () => {
  it("lets overrides win per field and stamps provenance", () => {
    const merged = mergeProjects([gen()], {
      bySlug: { a: { summary: "Override summary." } },
    });
    expect(merged[0].summary).toBe("Override summary.");
    expect(merged[0].provenance?.summary).toBe("override");
  });

  it("drops hidden projects", () => {
    const merged = mergeProjects([gen({ slug: "a" }), gen({ id: "b", slug: "b" })], {
      hidden: ["b"],
    });
    expect(merged.map((p) => p.slug)).toEqual(["a"]);
  });

  it("orders by overrides.order, then lastUpdated desc", () => {
    const merged = mergeProjects(
      [
        gen({ id: "x", slug: "x", lastUpdated: "2026-01-01" }),
        gen({ id: "y", slug: "y", lastUpdated: "2026-02-01" }),
        gen({ id: "z", slug: "z", lastUpdated: "2026-03-01" }),
      ],
      { order: ["z", "x"] },
    );
    // explicit order first (z, x), then remaining by lastUpdated desc (y)
    expect(merged.map((p) => p.slug)).toEqual(["z", "x", "y"]);
  });

  it("validates and throws on a bad record", () => {
    expect(() => mergeProjects([gen({ status: "bogus" })])).toThrow();
  });
});

describe("selectors", () => {
  it("selectPublic keeps only public visibility", () => {
    const merged = mergeProjects([
      gen({ id: "a", slug: "a", visibility: "public" }),
      gen({ id: "b", slug: "b", visibility: "coming-soon" }),
    ]);
    expect(selectPublic(merged).map((p) => p.slug)).toEqual(["a"]);
  });

  it("selectCurrentlyBuilding keeps currentlyBuilding", () => {
    const merged = mergeProjects([
      gen({ id: "a", slug: "a", currentlyBuilding: true }),
      gen({ id: "b", slug: "b" }),
    ]);
    expect(selectCurrentlyBuilding(merged).map((p) => p.slug)).toEqual(["a"]);
  });

  it("selectRelated resolves project connections", () => {
    const merged = mergeProjects([
      gen({ id: "a", slug: "a", connections: [{ type: "project", slug: "b" }] }),
      gen({ id: "b", slug: "b" }),
    ]);
    expect(selectRelated(merged, "a").map((p) => p.slug)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/data/projects.test.ts`
Expected: FAIL — cannot resolve `./projects`.

- [ ] **Step 3: Implement the loader pure functions**

Create `src/data/projects.ts`:

```ts
import { projectSchema, type Project } from "./projects.schema";

export type Overrides = {
  order?: string[];
  featured?: string[];
  hidden?: string[];
  bySlug?: Record<string, Record<string, unknown>>;
};

const keyOf = (g: Record<string, unknown>) => String(g.slug ?? g.id ?? "");

/**
 * Merge generated records with editorial overrides (override wins per field),
 * drop hidden projects, validate every record, and order them.
 */
export function mergeProjects(generated: unknown[], overrides: Overrides = {}): Project[] {
  const hidden = new Set(overrides.hidden ?? []);
  const order = overrides.order ?? [];
  const bySlug = overrides.bySlug ?? {};

  const merged: Project[] = [];
  for (const raw of generated) {
    const g = raw as Record<string, unknown>;
    const key = keyOf(g);
    const id = String(g.id ?? "");
    if (hidden.has(key) || hidden.has(id)) continue;

    const o = bySlug[key] ?? bySlug[id] ?? {};
    const provenance: Record<string, string> = { ...(g.provenance as Record<string, string> | undefined) };
    for (const field of Object.keys(o)) provenance[field] = "override";

    merged.push(projectSchema.parse({ ...g, ...o, provenance }));
  }

  merged.sort((a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return b.lastUpdated.localeCompare(a.lastUpdated);
  });

  return merged;
}

export function selectPublic(projects: Project[]): Project[] {
  return projects.filter((p) => p.visibility === "public");
}

export function selectCurrentlyBuilding(projects: Project[]): Project[] {
  return projects.filter((p) => p.currentlyBuilding);
}

export function selectRelated(projects: Project[], slug: string): Project[] {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return [];
  const relatedSlugs = project.connections
    .filter((c) => c.type === "project")
    .map((c) => c.slug);
  return projects.filter((p) => relatedSlugs.includes(p.slug));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/data/projects.test.ts`
Expected: PASS — 7 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/data/projects.ts src/data/projects.test.ts
git commit -m "feat: add projects merge/validate/select loader"
```

---

### Task 4: Stars List ingestion script (`ingest.mjs`)

**Files:**
- Create: `scripts/projects/ingest.mjs`
- Create: `scripts/projects/README.md`

This script is verified by running it against the live authenticated `gh` CLI (not unit-tested — it shells out to GitHub).

- [ ] **Step 1: Write the ingestion script**

Create `scripts/projects/ingest.mjs`:

```js
#!/usr/bin/env node
// Stage 1 of the projects pipeline: resolve the private Stars List "projects-page"
// and dump raw repo data to .cache/projects.raw.json (gitignored). Requires an
// authenticated `gh` CLI. Run: node scripts/projects/ingest.mjs
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LIST_SLUG = "projects-page";
const FILES = [
  "README.md", "AGENTS.md", "CLAUDE.md", "package.json",
  "wrangler.toml", "wrangler.jsonc", "Dockerfile",
];

function gh(args, { allowFail = false } = {}) {
  try {
    return execSync(`gh ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

function resolveList() {
  const query = `{ viewer { lists(first:50){ nodes { slug items(first:100){ nodes { __typename ... on Repository { nameWithOwner isPrivate } } } } } } }`;
  const raw = gh(`api graphql -f query='${query}'`);
  const data = JSON.parse(raw);
  const list = data.data.viewer.lists.nodes.find((n) => n.slug === LIST_SLUG);
  if (!list) throw new Error(`Stars List "${LIST_SLUG}" not found for authenticated user`);
  const repos = list.items.nodes
    .filter((n) => n.__typename === "Repository")
    .map((n) => ({ nameWithOwner: n.nameWithOwner, isPrivate: n.isPrivate }));
  if (repos.length === 0) throw new Error(`Stars List "${LIST_SLUG}" is empty`);
  return repos;
}

function gatherRepo({ nameWithOwner, isPrivate }) {
  const meta = JSON.parse(
    gh(`repo view ${nameWithOwner} --json name,description,homepageUrl,isPrivate,primaryLanguage,languages,repositoryTopics,createdAt,updatedAt,pushedAt,url`),
  );
  const rootListing = gh(`api repos/${nameWithOwner}/contents --jq '[.[].name]'`, { allowFail: true });
  const rootFiles = rootListing ? JSON.parse(rootListing) : [];

  const files = {};
  for (const path of FILES) {
    const content = gh(
      `api repos/${nameWithOwner}/contents/${path} -H "Accept: application/vnd.github.raw"`,
      { allowFail: true },
    );
    if (content) files[path] = content;
  }

  return { nameWithOwner, isPrivate, meta, rootFiles, files };
}

function main() {
  const repos = resolveList();
  console.log(`Resolved ${repos.length} repos from "${LIST_SLUG}":`);
  repos.forEach((r) => console.log(`  - ${r.nameWithOwner}${r.isPrivate ? " (private)" : ""}`));

  const bundle = {
    list: LIST_SLUG,
    repos: repos.map((r) => r.nameWithOwner),
    projects: repos.map(gatherRepo),
  };

  const outDir = resolve(process.cwd(), ".cache");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "projects.raw.json");
  writeFileSync(outPath, JSON.stringify(bundle, null, 2));
  console.log(`\nWrote raw bundle -> ${outPath}`);
}

main();
```

- [ ] **Step 2: Write the pipeline README**

Create `scripts/projects/README.md`:

```markdown
# Projects pipeline

Two-stage, offline, on-demand. Requires an authenticated `gh` CLI.

## Stage 1 — ingest (mechanical)

    node scripts/projects/ingest.mjs

Resolves the private Stars List `projects-page` via `gh` GraphQL and writes raw
repo data to `.cache/projects.raw.json` (gitignored — private content, never committed).

## Stage 2 — author (judgment)

Read `.cache/projects.raw.json` and write public-safe, curated entries into
`src/data/projects.generated.json` conforming to `src/data/projects.schema.ts`.
Record `provenance` per field. Generated content is draft input — editorial
overrides in `src/data/projects.overrides.json` always win.

## Privacy

Listed repos are private and this site repo is public. Never commit raw repo
content. Only `projects.generated.json` (curated prose) and `projects.overrides.json`
are committed.
```

- [ ] **Step 3: Run the ingestion script**

Run: `node scripts/projects/ingest.mjs`
Expected: prints the resolved repo list (`herrerake/ff-almanac`, `herrerake/quedate`) and writes `.cache/projects.raw.json`.

- [ ] **Step 4: Verify the cache is gitignored and not staged**

Run: `git status --porcelain .cache/`
Expected: no output (the directory is ignored).

- [ ] **Step 5: Commit (script + README only)**

```bash
git add scripts/projects/ingest.mjs scripts/projects/README.md
git commit -m "feat: add projects Stars List ingestion script"
```

---

### Task 5: Wire loader to JSON data files

**Files:**
- Modify: `src/data/projects.ts`

Adds the JSON-backed wrappers. The JSON files are created in Task 6; this task creates **empty** committed stubs first so the module resolves and the build stays green, then Task 6 fills them with real content.

- [ ] **Step 1: Create empty generated stub**

Create `src/data/projects.generated.json`:

```json
[]
```

- [ ] **Step 2: Create overrides stub**

Create `src/data/projects.overrides.json`:

```json
{
  "order": [],
  "featured": [],
  "hidden": [],
  "bySlug": {}
}
```

- [ ] **Step 3: Append wrappers to `src/data/projects.ts`**

Add to the **end** of `src/data/projects.ts`:

```ts
import generatedData from "./projects.generated.json";
import overridesData from "./projects.overrides.json";

const ALL = mergeProjects(generatedData as unknown[], overridesData as Overrides);

export function getProjects(): Project[] {
  return selectPublic(ALL);
}
export function getProject(slug: string): Project | undefined {
  return ALL.find((p) => p.slug === slug);
}
export function getCurrentlyBuilding(): Project[] {
  return selectCurrentlyBuilding(ALL);
}
export function getRelated(slug: string): Project[] {
  return selectRelated(ALL, slug);
}
```

- [ ] **Step 4: Ensure JSON module imports are allowed**

Verify `tsconfig.json` extends `astro/tsconfigs/strict` (it does — Astro enables `resolveJsonModule`). Run: `yarn test`
Expected: PASS — all existing tests still pass (wrappers import an empty array; pure-function tests unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/data/projects.ts src/data/projects.generated.json src/data/projects.overrides.json
git commit -m "feat: wire projects loader to generated + override JSON"
```

---

### Task 6: Author generated content + integration test

**Files:**
- Modify: `src/data/projects.generated.json`
- Modify: `src/data/projects.overrides.json`
- Create: `src/data/projects.integration.test.ts`

Run Stage 1 first (`node scripts/projects/ingest.mjs`) so `.cache/projects.raw.json` is fresh, then author the two known projects below. The content below is complete and schema-valid; refine wording against the freshly ingested cache but do not leave any field empty.

- [ ] **Step 1: Write the integration test (fails until content is authored)**

Create `src/data/projects.integration.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getProjects, getProject } from "./projects";
import { projectSchema } from "./projects.schema";

describe("real projects data", () => {
  it("exposes at least one public project", () => {
    expect(getProjects().length).toBeGreaterThan(0);
  });

  it("every public project passes the schema", () => {
    for (const p of getProjects()) {
      expect(() => projectSchema.parse(p)).not.toThrow();
    }
  });

  it("does not expose coming-soon projects publicly", () => {
    expect(getProjects().every((p) => p.visibility === "public")).toBe(true);
  });

  it("keeps quedate in the layer but out of the public grid", () => {
    expect(getProject("quedate")?.visibility).toBe("coming-soon");
    expect(getProjects().find((p) => p.slug === "quedate")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/data/projects.integration.test.ts`
Expected: FAIL — `getProjects()` is empty.

- [ ] **Step 3: Author `src/data/projects.generated.json`**

Replace the contents with:

```json
[
  {
    "id": "ff-almanac",
    "title": "Fantasy Almanac",
    "slug": "fantasy-almanac",
    "timeline": { "startedAt": "2026-04-11" },
    "status": "in-progress",
    "visibility": "public",
    "projectType": "product",
    "role": "Solo engineer",
    "audience": "Members of a long-running fantasy football league",
    "motivation": "Years of league history were split across NFL.com and Sleeper with incompatible schemas. I wanted one durable archive that treats decades of rivalries, records, and drafts as a living knowledge system.",
    "canonicalNarrative": "Exploring how AI can transform years of league history into a living knowledge system.",
    "summary": "A historical archive for a fantasy football league built on a source-agnostic schema that unifies NFL.com data (2010–2024) and Sleeper data (2025+) into one queryable record of seasons, matchups, and records.",
    "elevatorPitch": "Decades of fantasy league history, unified into one durable, queryable archive on Cloudflare's edge.",
    "stack": ["Astro", "TypeScript", "Cloudflare Workers", "Cloudflare D1", "Cloudflare R2", "Drizzle ORM", "Tailwind CSS"],
    "categories": ["Cloudflare", "Web Platforms", "AI", "Open Source"],
    "features": [
      "Source-agnostic schema unifying NFL.com (2010–2024) and Sleeper (2025+) data",
      "Serverless web-scraping pipeline for historical season ingestion",
      "Edge-served archive backed by Cloudflare D1 and R2",
      "Typed data access with Drizzle ORM"
    ],
    "architectureHighlights": [
      "Normalized, source-agnostic data model so new providers can be added without schema rewrites",
      "Cloudflare D1 for relational season/matchup data, R2 for archived source payloads",
      "Astro + Workers for a fully edge-rendered front end"
    ],
    "aiCapabilities": [
      "AI-assisted normalization of inconsistent historical league data into a unified schema"
    ],
    "impact": "Turns fragmented, provider-locked league history into a single durable archive the whole league can explore.",
    "metrics": [
      { "value": "2010–2025", "label": "seasons unified" },
      { "value": "2", "label": "data sources reconciled (NFL.com + Sleeper)" }
    ],
    "connections": [],
    "screenshots": [],
    "currentlyBuilding": true,
    "portfolioScore": {
      "originality": 8, "technicalComplexity": 8, "productThinking": 8,
      "aiUsage": 6, "platformRelevance": 9, "impact": 7, "documentation": 7, "total": 76
    },
    "lastUpdated": "2026-04-27",
    "provenance": {
      "summary": "github-metadata",
      "stack": "github-metadata",
      "features": "github-metadata",
      "categories": "ai-inference",
      "architectureHighlights": "ai-inference",
      "aiCapabilities": "ai-inference",
      "motivation": "ai-inference",
      "canonicalNarrative": "ai-inference",
      "impact": "ai-inference",
      "metrics": "ai-inference"
    }
  },
  {
    "id": "quedate",
    "title": "Quédate",
    "slug": "quedate",
    "timeline": { "startedAt": "2026-03-30" },
    "status": "prototype",
    "visibility": "coming-soon",
    "projectType": "website",
    "role": "Solo engineer",
    "audience": "Personal project; audience still being defined",
    "motivation": "An early prototype exploring a lightweight Astro site deployed on Cloudflare Workers.",
    "summary": "An early-stage Astro site prototype deployed on Cloudflare Workers, kept in the knowledge layer as a work in progress.",
    "elevatorPitch": "A lightweight Astro-on-Cloudflare prototype, still taking shape.",
    "stack": ["Astro", "Cloudflare Workers"],
    "categories": ["Cloudflare", "Web Platforms", "Experiments"],
    "features": [],
    "architectureHighlights": ["Astro front end deployed to Cloudflare Workers"],
    "aiCapabilities": [],
    "impact": "A sandbox for testing the Astro-on-Cloudflare deployment path used across other projects.",
    "metrics": [],
    "connections": [],
    "screenshots": [],
    "currentlyBuilding": false,
    "portfolioScore": null,
    "lastUpdated": "2026-03-30",
    "provenance": {
      "stack": "github-metadata",
      "summary": "ai-inference",
      "categories": "ai-inference"
    }
  }
]
```

- [ ] **Step 4: Set display order in `src/data/projects.overrides.json`**

Replace the contents with:

```json
{
  "order": ["fantasy-almanac", "quedate"],
  "featured": ["fantasy-almanac"],
  "hidden": [],
  "bySlug": {}
}
```

- [ ] **Step 5: Run the integration test to verify it passes**

Run: `yarn test src/data/projects.integration.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 6: Run the full test suite**

Run: `yarn test`
Expected: PASS — all suites green.

- [ ] **Step 7: Commit**

```bash
git add src/data/projects.generated.json src/data/projects.overrides.json src/data/projects.integration.test.ts
git commit -m "feat: author initial projects content + integration test"
```

---

### Task 7: `ProjectCard` component

**Files:**
- Create: `src/components/ProjectCard.astro`

Verified visually in Task 8 (`.astro` components aren't unit-tested here).

- [ ] **Step 1: Create the component**

Create `src/components/ProjectCard.astro`:

```astro
---
import CardWrapper from "@/components/CardWrapper.astro";
import type { Project } from "@/data/projects.schema";

const { project }: { project: Project } = Astro.props;

const statusLabel: Record<Project["status"], string> = {
  live: "Live",
  "in-progress": "In progress",
  prototype: "Prototype",
  archived: "Archived",
};
---

<CardWrapper class="h-full flex flex-col">
  {
    project.featuredImage && (
      <img
        src={project.featuredImage}
        alt={project.title}
        class="w-full h-auto object-cover aspect-video rounded-[16px] mb-6"
      />
    )
  }

  <div class="flex items-center justify-between gap-4 mb-3">
    <h2 class="text-bluePrimary text-2xl md:text-3xl font-bold dark:text-darkText">
      {project.title}
    </h2>
    <span
      class="shrink-0 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-bluePrimary/10 text-bluePrimary dark:bg-darkAccent/15 dark:text-darkAccent"
    >
      {statusLabel[project.status]}
    </span>
  </div>

  <p class="text-textPrimary text-lg leading-7 dark:text-darkTextSecondary">
    {project.summary}
  </p>

  {
    project.stack.length > 0 && (
      <ul class="flex flex-wrap gap-2 mt-5">
        {project.stack.map((tech) => (
          <li class="text-xs font-medium px-3 py-1 rounded-full border border-cardBorder text-textSecondary dark:border-darkBorder dark:text-darkTextSecondary">
            {tech}
          </li>
        ))}
      </ul>
    )
  }

  {
    project.categories.length > 0 && (
      <ul class="flex flex-wrap gap-2 mt-3">
        {project.categories.map((category) => (
          <li class="text-xs font-semibold px-3 py-1 rounded-full bg-bluePrimary/5 text-bluePrimary dark:bg-darkAccent/10 dark:text-darkAccent">
            {category}
          </li>
        ))}
      </ul>
    )
  }

  <div class="flex flex-wrap gap-3 mt-6 pt-2">
    {
      project.liveUrl && (
        <a
          href={project.liveUrl}
          class="py-2.5 px-6 rounded-lg bg-bluePrimary text-white text-sm font-medium dark:bg-darkAccent dark:text-darkBg"
        >
          View Live
        </a>
      )
    }
    {
      project.githubUrl && (
        <a
          href={project.githubUrl}
          class="py-2.5 px-6 rounded-lg border border-cardBorder text-textPrimary text-sm font-medium dark:border-darkBorder dark:text-darkTextSecondary"
        >
          GitHub
        </a>
      )
    }
  </div>
</CardWrapper>
```

- [ ] **Step 2: Type-check the component**

Run: `yarn astro check`
Expected: no errors in `ProjectCard.astro` (pre-existing warnings elsewhere are acceptable).

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectCard.astro
git commit -m "feat: add ProjectCard component"
```

---

### Task 8: Projects page (replace placeholder)

**Files:**
- Modify: `src/pages/projects.astro`

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/pages/projects.astro`:

```astro
---
import BaseHead from "@/components/BaseHead.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import CardWrapper from "@/components/CardWrapper.astro";
import ProjectCard from "@/components/ProjectCard.astro";
import { getProjects } from "@/data/projects";

export const prerender = true;

const projects = getProjects();
---

<!doctype html>
<html lang="en">
  <head>
    <BaseHead
      title="Projects"
      description="Selected projects, systems, experiments, and products focused on AI-native web platforms, automation, content systems, and developer experience."
    />
  </head>

  <body>
    <section class="my-8 max-w-[1240px] w-full mx-auto px-4">
      <Header />
      <div class="w-full space-y-4">
        <CardWrapper class="w-full">
          <div class="py-8">
            <h1 class="text-bluePrimary text-3xl md:text-4xl font-bold mb-4 dark:text-darkText">
              Projects
            </h1>
            <p class="text-xl leading-7 text-textPrimary dark:text-darkTextSecondary max-w-[760px]">
              Selected projects, systems, experiments, and products — focused on
              AI-native web platforms, automation, content systems, and developer
              experience. Presented as case studies, not repositories.
            </p>
          </div>
        </CardWrapper>

        <div class="grid gap-4 md:grid-cols-2">
          {projects.map((project) => <ProjectCard project={project} />)}
        </div>
      </div>
      <Footer />
    </section>
  </body>
</html>
```

- [ ] **Step 2: Build to verify static prerender + validation**

Run: `yarn build`
Expected: build succeeds; `/projects` is prerendered; no Zod validation errors thrown at build.

- [ ] **Step 3: Spot-check in the browser**

Run: `yarn dev`
Then open `http://localhost:4321/projects` and verify:
- The header section renders.
- Exactly one card renders (Fantasy Almanac) — `quedate` is `coming-soon` and absent.
- Status badge, stack chips, and category chips show; no GitHub/Live buttons (repo private, no homepage).
- Toggle dark mode — card, chips, and badge remain legible in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects.astro
git commit -m "feat: render projects page from knowledge layer"
```

---

## Self-Review

**Spec coverage:**
- Source of truth / Stars List ingestion → Task 4 (`gh` GraphQL `viewer.lists`). ✓
- Privacy (`.cache/` gitignored, only curated JSON committed) → Task 1 (gitignore), Task 4 (verify not staged), Task 6 (public-safe content). ✓
- Two-stage generation (mechanical ingest + authored content) → Task 4, Task 6. ✓
- Full schema incl. visibility, projectType, timeline, connections, featuredImage, canonicalNarrative, metrics, screenshots, currentlyBuilding, portfolioScore, provenance, impact → Task 2. ✓
- Override system (order/featured/hidden/bySlug, override wins, provenance stamp) → Task 3 + Task 6. ✓
- Loader knowledge-layer API (getProjects/getProject/getCurrentlyBuilding/getRelated) → Task 3 + Task 5. ✓
- Rendering: header + grid, public-only, featuredImage, GitHub link only if public → Task 7, Task 8. ✓
- Deferred (filters, /projects/[slug], gallery UI, related UI, homepage, public score) → modeled, not built. ✓
- Verification: `yarn build` + dev spot-check + `.cache/` not staged → Task 8, Task 4. ✓

**Placeholder scan:** No TBD/TODO; the one prose phrase "audience still being defined" is real copy for an early prototype, not a plan placeholder. All code blocks complete.

**Type consistency:** `Project`, `Overrides`, `mergeProjects`, `selectPublic`, `selectCurrentlyBuilding`, `selectRelated`, `getProjects`, `getProject`, `getCurrentlyBuilding`, `getRelated` are named identically across schema, loader, tests, and page. Enum member strings (`status`, `visibility`, `category`, `projectType`) match between schema and authored JSON. Override key matching uses `slug`/`id` consistently in loader and overrides file.
```

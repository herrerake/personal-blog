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

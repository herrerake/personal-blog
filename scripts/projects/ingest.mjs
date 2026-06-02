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

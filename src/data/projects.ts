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
    const aOrdered = ai !== -1;
    const bOrdered = bi !== -1;
    if (aOrdered && bOrdered) return ai - bi; // both pinned: explicit order
    if (aOrdered) return -1; // pinned items precede unpinned
    if (bOrdered) return 1;
    return b.lastUpdated.localeCompare(a.lastUpdated); // rest: newest first
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

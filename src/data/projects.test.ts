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

  it("drops hidden projects by id when slug differs", () => {
    const merged = mergeProjects([gen({ id: "keep", slug: "keep-slug" }), gen({ id: "gone", slug: "gone-slug" })], {
      hidden: ["gone"],
    });
    expect(merged.map((p) => p.slug)).toEqual(["keep-slug"]);
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

  it("selectRelated returns empty when the slug is not found", () => {
    const merged = mergeProjects([gen({ id: "a", slug: "a" })]);
    expect(selectRelated(merged, "missing")).toEqual([]);
  });
});

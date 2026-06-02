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

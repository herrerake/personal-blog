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

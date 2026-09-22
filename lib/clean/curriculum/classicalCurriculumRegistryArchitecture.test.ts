import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const registryImport = "@/lib/clean/curriculum/classicalCurriculumRegistry";
const pathways = readFileSync("lib/clean/pathways/classicalPathways.ts", "utf8");
const resources = readFileSync("lib/clean/resources/classicalCurriculumResources.ts", "utf8");
const catalogue = readFileSync("lib/marketplace/mylearnaCatalog.ts", "utf8");
const projection = readFileSync(
  "lib/marketplace/classicalCatalogueProjection.ts",
  "utf8",
);

describe("Classical curriculum registry dependency direction", () => {
  it("keeps the canonical registry low-level", () => {
    const registry = readFileSync(
      "lib/clean/curriculum/classicalCurriculumRegistry.ts",
      "utf8",
    );
    expect(registry).not.toContain("@/app/");
    expect(registry).not.toContain("mylearnaCatalog");
    expect(registry).not.toContain("Supabase");
    expect(registry).not.toMatch(/^import /m);
  });

  it("makes Pathways, resources, and Marketplace one-way registry consumers", () => {
    for (const source of [pathways, resources, catalogue]) {
      expect(source).toContain(registryImport);
    }
    expect(pathways).toContain("encounter.academic.meaning");
    expect(resources).toContain("toClassicalCurriculumResource");
    expect(catalogue).toContain("buildClassicalCatalogueProjection");
    expect(catalogue).toContain("buildMylearnaMarketplaceResources");
    expect(projection).toContain("ClassicalEncounterDefinition");
    expect(projection).not.toContain("mylearnaCatalog");
    expect(projection).not.toContain("Supabase");
    expect(catalogue).not.toContain("MYLEARNA_CLASSICAL_RESOURCES[0]");
  });

  it("does not retain Encounter 1 academic authoring copies in downstream adapters", () => {
    const canonicalMeaning =
      "Understand how farming helped some communities remain in one place for longer";
    const canonicalDescription =
      "A complete MyLearna Classical encounter exploring how farming helped";
    expect(pathways).not.toContain(canonicalMeaning);
    expect(resources).not.toContain(canonicalMeaning);
    expect(catalogue).not.toContain(canonicalDescription);
  });
});

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
  MYLEARNA_CLASSICAL_ENCOUNTER_TWO,
  getLiveClassicalEncounterByBookletKey,
  getLiveClassicalEncounters,
  type ClassicalEncounterDefinition,
} from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import {
  buildClassicalCatalogueProjection,
  checkClassicalCatalogueReleaseReadiness,
  generateClassicalCatalogueUpsertSql,
} from "@/lib/marketplace/classicalCatalogueProjection";
import { buildMylearnaMarketplaceResources } from "@/lib/marketplace/mylearnaCatalog";

function fixture(overrides?: Partial<ClassicalEncounterDefinition>) {
  return {
    ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
    ...overrides,
  } as ClassicalEncounterDefinition;
}

function matchingRow(encounter = MYLEARNA_CLASSICAL_ENCOUNTER_ONE) {
  return {
    id: "database-maintained-id",
    created_at: "ignored",
    updated_at: "ignored",
    ...buildClassicalCatalogueProjection(encounter),
  };
}

describe("Classical catalogue projection", () => {
  it("matches the production-proven Encounter 1 catalogue contract", () => {
    const encounter = MYLEARNA_CLASSICAL_ENCOUNTER_ONE;
    const projection = buildClassicalCatalogueProjection(encounter);

    expect(projection).toEqual({
      source: "mylearna",
      external_product_id: "MYL-CLASSICAL-Y34-A-U1-E01",
      external_variant_id: null,
      handle: "classical-y3-4-a-u1-e01-from-wandering-to-settlement",
      title: "From Wandering to Settlement",
      thumbnail_url: encounter.resource.pageImageUrls[0],
      marketplace_area: "Curriculum",
      primary_collection: "MyLearna Classical",
      subcollection: encounter.distribution.subcollection,
      resource_format: "booklet-pdf",
      is_active: true,
      metadata: {
        brand: "MyLearna Classical",
        catalogue_kind: "encounter",
        curriculum_key: "mylearna-classical",
        band_key: "years-3-4",
        cycle_key: "a",
        cycle_title: "The Ancient World",
        unit_key: "first-civilisations",
        unit_title: "The First Civilisations",
        encounter_number: 1,
        big_question: "Why would people choose to live in one place?",
        pathway_step_id:
          "classical::history-and-civilisation::middle-primary::from-wandering-to-settlement",
        step_key: "from-wandering-to-settlement",
        pdf_href: "/api/classical/booklets/y3-4-a-u1-e01",
        page_count: 10,
        access_model: "family_included",
        entitlement_key: "family_subscription",
        included_with_family: true,
        bundle_hierarchy: {
          encounter_key: "classical-y3-4-a-u1-e01",
          unit_key: "classical-y3-4-a-u1",
          cycle_key: "classical-y3-4-a",
        },
        future_physical_pack_supported: true,
      },
    });

    const historical = readFileSync(
      "supabase/migrations/20260921113000_classical_marketplace_cupboard.sql",
      "utf8",
    );
    expect(historical).toContain(`'${projection.external_product_id}'`);
    expect(historical).toContain(`'${projection.handle}'`);
    expect(historical).toContain(
      `'encounter_key', '${projection.metadata.bundle_hierarchy.encounter_key}'`,
    );
    expect(historical).toContain(`'pdf_href', '${projection.metadata.pdf_href}'`);
  });

  it("keeps a planned fixture hidden while allowing explicit publication preparation", () => {
    const planned = fixture({
      releaseState: "planned",
      curriculumCode: "TEST-CLASSICAL-PLANNED",
      encounterKey: "test-planned-encounter",
      encounterNumber: 99,
      title: "Test Planned Encounter",
      pathway: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.pathway,
        stepKey: "test-planned-encounter",
        pathwayStepId:
          "classical::history-and-civilisation::middle-primary::test-planned-encounter",
      },
      resource: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource,
        bookletKey: "test-planned-booklet",
        pdfHref: "/api/classical/booklets/test-planned-booklet",
      },
      distribution: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.distribution,
        externalProductId: "TEST-CLASSICAL-PLANNED",
        marketplaceHandle: "test-planned-encounter",
        encounterBundleKey: "test-planned-encounter",
      },
    });

    expect(getLiveClassicalEncounters([planned])).toEqual([]);
    expect(buildMylearnaMarketplaceResources([planned])).toEqual([]);
    expect(
      getLiveClassicalEncounterByBookletKey(planned.resource.bookletKey, [planned]),
    ).toBeNull();
    expect(generateClassicalCatalogueUpsertSql(planned)).toContain(
      "TEST-CLASSICAL-PLANNED",
    );

    const released = { ...planned, releaseState: "live" } as ClassicalEncounterDefinition;
    expect(getLiveClassicalEncounters([released])).toEqual([released]);
    expect(buildMylearnaMarketplaceResources([released])).toHaveLength(1);
    expect(
      getLiveClassicalEncounterByBookletKey(released.resource.bookletKey, [released]),
    ).toBe(released);
  });

  it("fails closed when publication has no approved cover asset", () => {
    const noCover = fixture({
      resource: {
        ...MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource,
        pageImageUrls: [],
      },
    });
    expect(() => buildClassicalCatalogueProjection(noCover)).toThrow(
      /cannot be published without a booklet cover/,
    );
  });
});

describe("Classical catalogue SQL generator", () => {
  it("emits byte-for-byte deterministic, catalogue-only upsert SQL", () => {
    const first = generateClassicalCatalogueUpsertSql(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
    );
    const second = generateClassicalCatalogueUpsertSql(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
    );
    expect(first).toBe(second);
    expect(first).toContain("null,");
    expect(first).toContain("on conflict (source, external_product_id) do update");
    expect(first).toContain(
      "external_variant_id = excluded.external_variant_id",
    );
    expect(first).toContain("metadata = excluded.metadata");
    expect(first.toLowerCase()).not.toContain("delete ");
    expect(first).not.toContain("family_resources");
    expect(first).not.toContain("storage.objects");
    expect(first.toLowerCase()).not.toContain("grant ");
    expect(first.toLowerCase()).not.toContain("policy ");
  });

  it("keeps the Encounter 2 forward catalogue migration byte-for-byte aligned with the canonical projection", () => {
    const migration = readFileSync(
      "supabase/migrations/20260923062000_publish_classical_encounter_2_catalogue.sql",
      "utf8",
    );
    expect(MYLEARNA_CLASSICAL_ENCOUNTER_TWO.releaseState).toBe("live");
    expect(migration).toBe(
      generateClassicalCatalogueUpsertSql(MYLEARNA_CLASSICAL_ENCOUNTER_TWO),
    );
    expect(migration).toContain("MYL-CLASSICAL-Y34-A-U1-E02");
    expect(migration).toContain(
      "classical::history-and-civilisation::middle-primary::rivers-and-civilisation",
    );
    expect(migration).toContain(
      "external_variant_id = excluded.external_variant_id",
    );
  });

  it("safely quotes apostrophes and preserves Unicode and JSON determinism", () => {
    const unsafeTitle =
      "A learner's river'); DROP TABLE public.marketplace_resources; -- — Δ";
    const unsafe = fixture({ title: unsafeTitle });
    const sql = generateClassicalCatalogueUpsertSql(unsafe);
    expect(sql).toContain(
      "'A learner''s river''); DROP TABLE public.marketplace_resources; -- — Δ'",
    );
    expect(sql).not.toContain("'A learner's river');");
    expect(sql).toContain("::jsonb");
    expect(sql).toBe(generateClassicalCatalogueUpsertSql(unsafe));
  });

  it("provides a no-network CLI that prints SQL and release state", () => {
    const result = spawnSync(
      process.execPath,
      [
        "scripts/classical/generate-classical-catalogue-migration.mjs",
        "--code",
        MYLEARNA_CLASSICAL_ENCOUNTER_ONE.curriculumCode,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("(live)");
    expect(result.stdout).toBe(
      generateClassicalCatalogueUpsertSql(MYLEARNA_CLASSICAL_ENCOUNTER_ONE),
    );

    const missing = spawnSync(
      process.execPath,
      [
        "scripts/classical/generate-classical-catalogue-migration.mjs",
        "--code",
        "UNKNOWN",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("Unknown Classical curriculum code");
  });

  it("transpiles canonical TypeScript instead of asking Node to import it", () => {
    const script = readFileSync(
      "scripts/classical/generate-classical-catalogue-migration.mjs",
      "utf8",
    );
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(script).toContain('from "typescript"');
    expect(script).toContain("ts.transpileModule");
    expect(script).not.toMatch(/from\s+["'][^"']+\.ts["']/);
    expect(packageJson.scripts["classical:catalogue:sql"]).toBe(
      "node scripts/classical/generate-classical-catalogue-migration.mjs",
    );
  });

  it("writes the same deterministic SQL only when --out is supplied", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "classical-catalogue-test-"));
    const outputPath = join(tempRoot, "catalogue.sql");
    try {
      const result = spawnSync(
        process.execPath,
        [
          "scripts/classical/generate-classical-catalogue-migration.mjs",
          "--code",
          MYLEARNA_CLASSICAL_ENCOUNTER_ONE.curriculumCode,
          "--out",
          outputPath,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Wrote deterministic SQL");
      expect(readFileSync(outputPath, "utf8")).toBe(
        generateClassicalCatalogueUpsertSql(MYLEARNA_CLASSICAL_ENCOUNTER_ONE),
      );
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

describe("Classical catalogue release readiness", () => {
  it("accepts a matching row and ignores database-maintained fields", () => {
    expect(
      checkClassicalCatalogueReleaseReadiness(
        MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
        matchingRow(),
      ),
    ).toEqual({ ready: true, differences: [] });
  });

  it("reports missing, inactive, and meaningful identity drift", () => {
    const missing = checkClassicalCatalogueReleaseReadiness(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
      null,
    );
    expect(missing.ready).toBe(false);
    expect(missing.differences).toEqual([
      expect.objectContaining({ field: "row", kind: "missing" }),
    ]);

    const changed = matchingRow();
    const drifted = {
      ...changed,
      external_product_id: "WRONG-PRODUCT",
      external_variant_id: "stale-variant-id",
      is_active: false,
      handle: "wrong-handle",
      thumbnail_url: "https://example.test/wrong-cover.png",
      resource_format: "wrong-format",
      metadata: {
        ...changed.metadata,
        pathway_step_id: "wrong-pathway",
        pdf_href: "/wrong.pdf",
        entitlement_key: "wrong-entitlement",
        bundle_hierarchy: {
          ...changed.metadata.bundle_hierarchy,
          encounter_key: "wrong-bundle",
        },
      },
    };
    const result = checkClassicalCatalogueReleaseReadiness(
      MYLEARNA_CLASSICAL_ENCOUNTER_ONE,
      drifted,
    );
    expect(result.ready).toBe(false);
    expect(result.differences.map((difference) => difference.field)).toEqual(
      expect.arrayContaining([
        "handle",
        "external_product_id",
        "external_variant_id",
        "thumbnail_url",
        "resource_format",
        "is_active",
        "metadata.pathway_step_id",
        "metadata.pdf_href",
        "metadata.entitlement_key",
        "metadata.bundle_hierarchy.encounter_key",
      ]),
    );
  });
});

describe("database-first release boundary", () => {
  it("keeps customer discovery registry-driven while Cupboard saves require a known ID", () => {
    const marketplacePage = readFileSync("app/marketplace/page.tsx", "utf8");
    const marketplaceDetail = readFileSync(
      "app/marketplace/mylearna/[handle]/page.tsx",
      "utf8",
    );
    const familyResources = readFileSync(
      "lib/clean/resources/familyResources.ts",
      "utf8",
    );
    expect(marketplacePage).toContain("MYLEARNA_MARKETPLACE_RESOURCES");
    expect(marketplaceDetail).toContain("getMylearnaMarketplaceResourceByHandle");
    expect(marketplacePage).not.toContain("marketplace_resources");
    expect(marketplaceDetail).not.toContain("marketplace_resources");
    expect(familyResources).not.toContain('.from("marketplace_resources")');
    expect(familyResources).toContain("p_external_product_id");
  });
});

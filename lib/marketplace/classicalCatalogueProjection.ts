import type { ClassicalEncounterDefinition } from "../clean/curriculum/classicalCurriculumRegistry";

export type ClassicalCatalogueMetadata = Readonly<{
  brand: "MyLearna Classical";
  catalogue_kind: "encounter";
  curriculum_key: string;
  band_key: string;
  cycle_key: string;
  cycle_title: string;
  unit_key: string;
  unit_title: string;
  encounter_number: number;
  big_question: string;
  pathway_step_id: string;
  step_key: string;
  pdf_href: string;
  page_count: number;
  access_model: ClassicalEncounterDefinition["distribution"]["accessModel"];
  entitlement_key: ClassicalEncounterDefinition["distribution"]["entitlementKey"];
  included_with_family: boolean;
  bundle_hierarchy: Readonly<{
    encounter_key: string;
    unit_key: string;
    cycle_key: string;
  }>;
  future_physical_pack_supported: boolean;
}>;

export type ClassicalCatalogueProjection = Readonly<{
  source: "mylearna";
  external_product_id: string;
  external_variant_id: null;
  handle: string;
  title: string;
  thumbnail_url: string;
  marketplace_area: string;
  primary_collection: string;
  subcollection: string;
  resource_format: string;
  is_active: true;
  metadata: ClassicalCatalogueMetadata;
}>;

export type MarketplaceResourcesRow = Partial<ClassicalCatalogueProjection> & {
  id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  metadata?: Record<string, unknown> | null;
};

export type ClassicalCatalogueDifference = Readonly<{
  field: string;
  kind: "missing" | "mismatch";
  expected: unknown;
  actual: unknown;
}>;

export type ClassicalCatalogueReadiness = Readonly<{
  ready: boolean;
  differences: readonly ClassicalCatalogueDifference[];
}>;

function hierarchyTitle(label: string) {
  const separator = label.indexOf(":");
  return separator >= 0 ? label.slice(separator + 1).trim() : label.trim();
}

export function buildClassicalCatalogueProjection(
  encounter: ClassicalEncounterDefinition,
): ClassicalCatalogueProjection {
  const thumbnailUrl = encounter.resource.pageImageUrls[0];
  if (!thumbnailUrl) {
    throw new Error(
      `Classical encounter ${encounter.curriculumCode} cannot be published without a booklet cover.`,
    );
  }
  return {
    source: "mylearna",
    external_product_id: encounter.distribution.externalProductId,
    external_variant_id: null,
    handle: encounter.distribution.marketplaceHandle,
    title: encounter.title,
    thumbnail_url: thumbnailUrl,
    marketplace_area: encounter.distribution.marketplaceArea,
    primary_collection: encounter.distribution.collection,
    subcollection: encounter.distribution.subcollection,
    resource_format: encounter.resource.resourceType,
    is_active: true,
    metadata: {
      brand: "MyLearna Classical",
      catalogue_kind: "encounter",
      curriculum_key: encounter.curriculumKey,
      band_key: encounter.hierarchy.bandKey,
      cycle_key: encounter.hierarchy.cycleKey,
      cycle_title: hierarchyTitle(encounter.hierarchy.cycleLabel),
      unit_key: encounter.hierarchy.unitKey,
      unit_title: hierarchyTitle(encounter.hierarchy.unitLabel),
      encounter_number: encounter.encounterNumber,
      big_question: encounter.academic.bigQuestion,
      pathway_step_id: encounter.pathway.pathwayStepId,
      step_key: encounter.pathway.stepKey,
      pdf_href: encounter.resource.pdfHref,
      page_count: encounter.resource.pageImageUrls.length,
      access_model: encounter.distribution.accessModel,
      entitlement_key: encounter.distribution.entitlementKey,
      included_with_family: encounter.distribution.accessModel === "family_included",
      bundle_hierarchy: {
        encounter_key: encounter.distribution.encounterBundleKey,
        unit_key: encounter.distribution.unitBundleKey,
        cycle_key: encounter.distribution.cycleBundleKey,
      },
      future_physical_pack_supported:
        encounter.distribution.futurePhysicalPackSupported,
    },
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

export function stableCatalogueJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

export function toSqlLiteral(value: string | null) {
  return value === null ? "null" : `'${value.replace(/'/g, "''")}'`;
}

export function generateClassicalCatalogueUpsertSql(
  encounter: ClassicalEncounterDefinition,
) {
  const projection = buildClassicalCatalogueProjection(encounter);
  return `-- Generated from the canonical MyLearna Classical registry. Do not hand-author catalogue metadata.
insert into public.marketplace_resources (
  source,
  external_product_id,
  external_variant_id,
  handle,
  title,
  thumbnail_url,
  marketplace_area,
  primary_collection,
  subcollection,
  resource_format,
  is_active,
  metadata
)
values (
  ${toSqlLiteral(projection.source)},
  ${toSqlLiteral(projection.external_product_id)},
  ${toSqlLiteral(projection.external_variant_id)},
  ${toSqlLiteral(projection.handle)},
  ${toSqlLiteral(projection.title)},
  ${toSqlLiteral(projection.thumbnail_url)},
  ${toSqlLiteral(projection.marketplace_area)},
  ${toSqlLiteral(projection.primary_collection)},
  ${toSqlLiteral(projection.subcollection)},
  ${toSqlLiteral(projection.resource_format)},
  true,
  ${toSqlLiteral(stableCatalogueJson(projection.metadata))}::jsonb
)
on conflict (source, external_product_id) do update
set
  external_variant_id = excluded.external_variant_id,
  handle = excluded.handle,
  title = excluded.title,
  thumbnail_url = excluded.thumbnail_url,
  marketplace_area = excluded.marketplace_area,
  primary_collection = excluded.primary_collection,
  subcollection = excluded.subcollection,
  resource_format = excluded.resource_format,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();
`;
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

const COMPARISON_FIELDS = [
  "source",
  "external_product_id",
  "external_variant_id",
  "handle",
  "title",
  "thumbnail_url",
  "marketplace_area",
  "primary_collection",
  "subcollection",
  "resource_format",
  "is_active",
  "metadata.brand",
  "metadata.catalogue_kind",
  "metadata.curriculum_key",
  "metadata.band_key",
  "metadata.cycle_key",
  "metadata.cycle_title",
  "metadata.unit_key",
  "metadata.unit_title",
  "metadata.encounter_number",
  "metadata.big_question",
  "metadata.pathway_step_id",
  "metadata.step_key",
  "metadata.pdf_href",
  "metadata.page_count",
  "metadata.access_model",
  "metadata.entitlement_key",
  "metadata.included_with_family",
  "metadata.bundle_hierarchy.encounter_key",
  "metadata.bundle_hierarchy.unit_key",
  "metadata.bundle_hierarchy.cycle_key",
  "metadata.future_physical_pack_supported",
] as const;

export function compareClassicalCatalogueProjection(
  expected: ClassicalCatalogueProjection,
  actual: MarketplaceResourcesRow | null,
): ClassicalCatalogueReadiness {
  if (!actual) {
    return {
      ready: false,
      differences: [
        {
          field: "row",
          kind: "missing",
          expected: expected.external_product_id,
          actual: null,
        },
      ],
    };
  }

  const differences: ClassicalCatalogueDifference[] = [];
  for (const field of COMPARISON_FIELDS) {
    const expectedValue = valueAtPath(expected, field);
    const actualValue = valueAtPath(actual, field);
    if (actualValue === undefined) {
      differences.push({ field, kind: "missing", expected: expectedValue, actual: undefined });
    } else if (stableCatalogueJson(actualValue) !== stableCatalogueJson(expectedValue)) {
      differences.push({ field, kind: "mismatch", expected: expectedValue, actual: actualValue });
    }
  }

  return { ready: differences.length === 0, differences };
}

export function checkClassicalCatalogueReleaseReadiness(
  encounter: ClassicalEncounterDefinition,
  actual: MarketplaceResourcesRow | null,
) {
  return compareClassicalCatalogueProjection(
    buildClassicalCatalogueProjection(encounter),
    actual,
  );
}

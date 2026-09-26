import type {
  ResourceFactoryAssets,
  ResourceFactoryMarketplaceProjection,
  ResourceFactoryQaReport,
  ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

const DEFAULT_THUMBNAIL_URL =
  "https://www.mylearna.com/branding/mylearna-logo.png";

export function buildResourceFactoryMarketplaceProjection(input: {
  spec: ResourceFactoryWorksheetSpec;
  qa: ResourceFactoryQaReport;
  assets: ResourceFactoryAssets;
  active: boolean;
}): ResourceFactoryMarketplaceProjection {
  const { spec, qa, assets, active } = input;

  return {
    source: "mylearna_agent",
    external_product_id: spec.resourceId,
    external_variant_id: null,
    handle: spec.slug,
    title: spec.title,
    thumbnail_url: assets.thumbnailUrl || DEFAULT_THUMBNAIL_URL,
    marketplace_area: "Homeschool Resources",
    primary_collection: "Mathematics",
    subcollection: spec.strand,
    resource_format: "worksheet-pdf",
    is_active: active,
    metadata: {
      brand: "MyLearna",
      catalogue_kind: "worksheet",
      access_model: "free_testing",
      pricing_state: "free_testing",
      subject: spec.subject,
      strand: spec.strand,
      year_levels: spec.yearLevels,
      skill: spec.skill,
      resource_type: spec.resourceType,
      difficulty: spec.difficulty,
      worksheet_href: assets.worksheetHref,
      answers_href: assets.answersHref,
      pinterest_image_urls: assets.pinterestImageUrls,
      seo: spec.seo,
      pinterest: spec.pinterest,
      qa: {
        factual_score: qa.factualScore,
        answer_score: qa.answerScore,
        quality_score: qa.qualityScore,
        issue_count: qa.issues.length,
        checker: qa.checker,
        checked_at: qa.checkedAt,
      },
      provenance: {
        source: "resource_factory",
        schema_version: spec.schemaVersion,
        generator: spec.provenance.generator,
        generated_at: spec.provenance.generatedAt,
      },
    },
  };
}

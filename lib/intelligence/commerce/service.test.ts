import { describe, expect, it, vi } from "vitest";
import { createCommerceRecommendationService } from "@/lib/intelligence/commerce/service";
import type { CommerceMappingRepository, CommerceProduct, CommerceProvider, CommerceResourceMapping } from "@/lib/intelligence/commerce/types";
import type { RecommendationResult } from "@/lib/intelligence/recommendations/types";

const product = (overrides: Partial<CommerceProduct> = {}): CommerceProduct => ({ provider: "shopify", providerProductId: "product-1", providerVariantId: "variant-1", title: "Paper learning kit", summary: "Paper for the activity.", productUrl: "https://shop.example/paper", imageUrl: null, price: { amount: 5, currency: "AUD" }, availability: "available", stockStatus: "in_stock", region: "AU", fulfilmentType: "third_party_shopify_seller", resourceKeys: ["paper"], tags: ["resource:paper"], educationalCategory: "science", priceBand: "low", ageStages: ["8-10"], subjects: ["science"], lastSyncedAt: "2026-07-24T00:00:00.000Z", disclosure: "Disclosure", ...overrides });
const mapping = (overrides: Partial<CommerceResourceMapping> = {}): CommerceResourceMapping => ({ id: "mapping-1", resourceKey: "paper", provider: "shopify", providerProductId: "product-1", providerVariantId: "variant-1", status: "approved", matchConfidence: 1, preferred: false, paused: false, notes: "", createdByUserId: "admin", approvedByUserId: "admin", createdAt: "", updatedAt: "", ...overrides });

function result(classification: "missing_essential" | "optional_extension" | "already_owned" = "missing_essential", required = classification === "missing_essential"): RecommendationResult {
  const sourceRecommendation = { recommendationId: "plan:1:required-resource:0:paper", objectType: "required_resource", title: "paper", summary: "Paper", category: "Materials", priorityRank: 8, reasonCode: classification === "already_owned" ? "OWNED_RESOURCE_MATCH" : classification === "optional_extension" ? "OPTIONAL_EXTENSION" : "MISSING_ESSENTIAL", parentReadableReason: "reason", required, resourceClassification: classification, resourceKey: "paper", sourcePlan: { planId: "plan-1", revisionId: "revision-1", revisionNumber: 2 }, engineVersion: "engine", rulesVersion: "rules", provenance: { sourceProvenance: {} as never, generatedAt: "2026-07-24T00:00:00.000Z" }, interaction: { recommendationId: "r", ownedDecision: null, saved: false, dismissed: false, prepared: false, completed: false } } as never;
  return { input: { planId: "plan-1", planType: "lesson", revisionId: "revision-1", revisionNumber: 2, learnerAgeOrStage: "8-10", subjects: ["science"], curriculumConcepts: [], learningIntentions: [], duration: { value: 30, unit: "minutes" }, lessonUnitSequence: [], requiredResources: required ? [{ name: "paper", resourceKey: "paper", category: "material", quantity: "1", required: true, url: null, notes: "" }] : [], optionalResources: required ? [] : [{ name: "paper", resourceKey: "paper", category: "extension", quantity: "1", required: false, url: null, notes: "" }], preparationRequirements: [], evidencePrompts: [], portfolioPrompts: [], safetySupervisionRequirements: [], sourceProvenance: {} as never, parentPreferences: null, approvedAt: "2026-07-24T00:00:00.000Z", schemaVersion: "schema" }, recommendations: [sourceRecommendation], dismissedRecommendations: [], debug: { eligibility: "approved", scoreComponents: [], ruleVersion: "rules", reasonCodes: [], exclusions: [], ownershipMatches: [] } };
}

function service(products: CommerceProduct[], mappings: CommerceResourceMapping[] = []) {
  const provider: CommerceProvider = { provider: "shopify", getProductsForResources: vi.fn(async () => products) };
  const mappingRepository: CommerceMappingRepository = { listForResourceKeys: vi.fn(async () => mappings), listAll: vi.fn(async () => mappings), upsertForAdmin: vi.fn() };
  return { service: createCommerceRecommendationService({ provider, mappings: mappingRepository, now: () => new Date("2026-07-24T00:00:00.000Z") }), provider, mappingRepository };
}

describe("commerce recommendation service", () => {
  it("matches missing essential resources and preserves price/product metadata", async () => {
    const state = service([product()]);
    const output = await state.service.getForRecommendationResult(result(), "AU");
    expect(output.products[0]).toMatchObject({ required: true, optional: false, reasonCode: "ESSENTIAL_COMMERCIAL", product: { price: { amount: 5 }, provider: "shopify" } });
  });

  it("suppresses owned resources and leaves free/household core recommendations ahead of products", async () => {
    const state = service([product()]);
    expect((await state.service.getForRecommendationResult(result("already_owned"), "AU")).products).toHaveLength(0);
    const output = await state.service.getForRecommendationResult(result(), "AU");
    expect(output.products[0].priorityRank).toBeGreaterThan(8);
  });

  it("labels optional products and excludes unavailable, wrong-region, paused, and affiliate products", async () => {
    const state = service([product({ availability: "region_ineligible" }), product({ providerProductId: "paused", resourceKeys: ["paper"] }), product({ providerProductId: "affiliate", fulfilmentType: "future_affiliate_placeholder" })], [mapping({ providerProductId: "paused", paused: true })]);
    const optional = await state.service.getForRecommendationResult(result("optional_extension", false), "AU");
    expect(optional.products).toHaveLength(0);
    expect(optional.unmatchedResourceKeys).toContain("paper");
  });

  it("lets an approved manual mapping override automated matching", async () => {
    const state = service([product({ title: "General classroom kit", resourceKeys: [] })], [mapping()]);
    const output = await state.service.getForRecommendationResult(result(), "AU");
    expect(output.products[0].matchReasons[0]).toContain("manual");
  });

  it("degrades gracefully when the provider fails", async () => {
    const provider: CommerceProvider = { provider: "shopify", getProductsForResources: vi.fn(async () => { throw new Error("Shopify down"); }) };
    const mappings: CommerceMappingRepository = { listForResourceKeys: vi.fn(async () => []), listAll: vi.fn(async () => []), upsertForAdmin: vi.fn() };
    const output = await createCommerceRecommendationService({ provider, mappings }).getForRecommendationResult(result(), "AU");
    expect(output).toMatchObject({ status: "unavailable", products: [], providerError: "Shopify down" });
  });
});

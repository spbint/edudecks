import type { RecommendationResult } from "@/lib/intelligence/recommendations/types";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import { candidateForProduct, rankCommerceCandidates } from "@/lib/intelligence/commerce/matching";
import type { CommerceMappingRepository, CommerceProductCandidate, CommerceProvider, CommerceResourceRequirement, CommerceResult } from "@/lib/intelligence/commerce/types";
import { COMMERCE_ENGINE_VERSION } from "@/lib/intelligence/commerce/types";

export interface CommerceRecommendationService {
  getForRecommendationResult(result: RecommendationResult, region: string): Promise<CommerceResult>;
}

function requirementsFor(result: RecommendationResult): CommerceResourceRequirement[] {
  const all = [...result.input.requiredResources, ...result.input.optionalResources];
  return result.recommendations
    .filter((recommendation) => recommendation.resourceClassification === "missing_essential" || recommendation.resourceClassification === "optional_extension")
    .map((recommendation) => {
      const resource = all.find((item) => normaliseResourceKey(item.name) === recommendation.resourceKey) ?? all.find((item) => item.resourceKey === recommendation.resourceKey);
      return resource ? { recommendationId: recommendation.recommendationId, resource, required: resource.required, learnerAgeOrStage: result.input.learnerAgeOrStage, subjects: result.input.subjects, curriculumConcepts: result.input.curriculumConcepts, parentPreferences: result.input.parentPreferences, sourceRecommendation: recommendation } : null;
    })
    .filter((item): item is CommerceResourceRequirement => Boolean(item));
}

export function createCommerceRecommendationService(options: {
  provider: CommerceProvider;
  mappings: CommerceMappingRepository;
  now?: () => Date;
}): CommerceRecommendationService {
  const now = options.now ?? (() => new Date());
  return {
    async getForRecommendationResult(result, region) {
      const generatedAt = now().toISOString();
      const resources = requirementsFor(result);
      if (!resources.length) return { provider: "shopify", status: "ready", products: [], exclusions: [], unmatchedResourceKeys: [], generatedAt };
      try {
        const keys = [...new Set(resources.map((resource) => resource.resource.resourceKey))];
        const [products, mappings] = await Promise.all([
          options.provider.getProductsForResources(resources, { region, now }),
          options.mappings.listForResourceKeys(keys),
        ]);
        const candidates: CommerceProductCandidate[] = [];
        const exclusions: CommerceResult["exclusions"] = [];
        const matchedKeys = new Set<string>();
        for (const resource of resources) {
          let matched = false;
          for (const product of products) {
            const mapping = mappings.find((item) => item.providerProductId === product.providerProductId && item.resourceKey === resource.resource.resourceKey);
            if (mapping?.paused) {
              exclusions.push({ providerProductId: product.providerProductId, resourceKey: resource.resource.resourceKey, reason: "Product is paused by an administrator." });
              continue;
            }
            const candidate = candidateForProduct(product, resource, mappings, now());
            if (!candidate) continue;
            if (candidate.matchConfidence < 0.7 && !mapping?.preferred) {
              exclusions.push({ providerProductId: product.providerProductId, resourceKey: resource.resource.resourceKey, reason: "Educational resource match confidence was below the pilot threshold." });
              continue;
            }
            candidates.push(candidate);
            matched = true;
            matchedKeys.add(resource.resource.resourceKey);
          }
          if (!matched) exclusions.push({ providerProductId: "", resourceKey: resource.resource.resourceKey, reason: "No suitable available product found." });
        }
        const productsByKey = new Map<string, CommerceProductCandidate>();
        for (const candidate of rankCommerceCandidates(candidates)) {
          const key = `${candidate.resourceKey}:${candidate.product.providerProductId}:${candidate.product.providerVariantId}`;
          productsByKey.set(key, candidate);
        }
        return {
          provider: "shopify",
          status: "ready",
          products: rankCommerceCandidates([...productsByKey.values()]),
          exclusions,
          unmatchedResourceKeys: resources.filter((resource) => !matchedKeys.has(resource.resource.resourceKey)).map((resource) => resource.resource.resourceKey),
          generatedAt,
        };
      } catch (error) {
        return {
          provider: "shopify",
          status: "unavailable",
          products: [],
          exclusions: [],
          unmatchedResourceKeys: [...new Set(resources.map((resource) => resource.resource.resourceKey))],
          generatedAt,
          providerError: error instanceof Error ? error.message : "Shopify catalogue is temporarily unavailable.",
        };
      }
    },
  };
}

export const commerceVersion = COMMERCE_ENGINE_VERSION;

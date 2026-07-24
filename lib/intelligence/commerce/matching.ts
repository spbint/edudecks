import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import type { CommerceProduct, CommerceProductCandidate, CommerceResourceMapping, CommerceResourceRequirement } from "@/lib/intelligence/commerce/types";
import { COMMERCE_ENGINE_VERSION, COMMERCE_RULES_VERSION } from "@/lib/intelligence/commerce/types";

function productMatchesKey(product: CommerceProduct, resourceKey: string) {
  const key = normaliseResourceKey(resourceKey);
  if (product.resourceKeys.includes(key)) return { confidence: 1, reason: "Exact resource-key tag match." };
  const tags = product.tags.map(normaliseResourceKey);
  if (tags.includes(key)) return { confidence: 0.92, reason: "Normalized product tag match." };
  const title = normaliseResourceKey(`${product.title} ${product.summary}`);
  const words = key.split(" ").filter(Boolean);
  if (words.length && words.every((word) => title.split(" ").some((candidate) => candidate === word || candidate.startsWith(word)))) {
    return { confidence: 0.72, reason: "Normalized title and description match." };
  }
  return null;
}

function suitabilityMatches(product: CommerceProduct, resource: CommerceResourceRequirement) {
  if (product.ageStages.length && resource.learnerAgeOrStage) {
    const learner = normaliseResourceKey(resource.learnerAgeOrStage);
    if (!product.ageStages.some((stage) => learner.includes(normaliseResourceKey(stage)) || normaliseResourceKey(stage).includes(learner))) return false;
  }
  if (product.subjects.length && (resource.subjects.length || resource.curriculumConcepts.length)) {
    const subjects = new Set([...resource.subjects, ...resource.curriculumConcepts].map(normaliseResourceKey));
    if (!product.subjects.some((subject) => subjects.has(normaliseResourceKey(subject)))) return false;
  }
  const priceBand = resource.parentPreferences?.match(/price[-_ ]band\s*[:=]\s*([a-z0-9_-]+)/i)?.[1]?.toLowerCase();
  if (priceBand && product.priceBand && priceBand !== product.priceBand.toLowerCase()) {
    return false;
  }
  return true;
}

function manualMatch(product: CommerceProduct, resource: CommerceResourceRequirement, mappings: CommerceResourceMapping[]) {
  return mappings.find((mapping) => mapping.status === "approved" && !mapping.paused && mapping.resourceKey === resource.resource.resourceKey && mapping.providerProductId === product.providerProductId && (!mapping.providerVariantId || mapping.providerVariantId === product.providerVariantId));
}

export function candidateForProduct(product: CommerceProduct, resource: CommerceResourceRequirement, mappings: CommerceResourceMapping[], now = new Date()): CommerceProductCandidate | null {
  if (product.availability !== "available") return null;
  if (product.fulfilmentType === "future_affiliate_placeholder") return null;
  if (!suitabilityMatches(product, resource)) return null;
  const manual = manualMatch(product, resource, mappings);
  const match = manual ? { confidence: 1, reason: "Approved manual resource mapping." } : productMatchesKey(product, resource.resource.resourceKey);
  if (!match) return null;
  const required = resource.required;
  return {
    commerceRecommendationId: `commerce:${resource.sourceRecommendation.sourcePlan.planId}:${resource.sourceRecommendation.sourcePlan.revisionNumber}:${resource.resource.resourceKey}:${product.providerProductId}:${product.providerVariantId}`,
    sourceRecommendationId: resource.recommendationId,
    resourceKey: resource.resource.resourceKey,
    product,
    required,
    optional: !required,
    matchConfidence: match.confidence,
    matchReasons: [match.reason, "Age/stage and subject suitability matched the approved plan.", ...(manual?.preferred ? ["This product is preferred by an approved administrator mapping."] : [])],
    priorityRank: (required ? 10000 : 20000) + resource.sourceRecommendation.priorityRank,
    reasonCode: required ? "ESSENTIAL_COMMERCIAL" : "OPTIONAL_COMMERCIAL",
    parentReadableReason: required
      ? "This is an optional shopping step for a missing essential resource, after learning and free alternatives."
      : "This is an optional extension after required learning, preparation, and free alternatives.",
    engineVersion: COMMERCE_ENGINE_VERSION,
    rulesVersion: COMMERCE_RULES_VERSION,
    sourcePlan: resource.sourceRecommendation.sourcePlan,
    provenance: { sourceProvenance: resource.sourceRecommendation.provenance.sourceProvenance, generatedAt: now.toISOString() },
  };
}

export function rankCommerceCandidates(candidates: CommerceProductCandidate[]) {
  return [...candidates].sort((left, right) => left.priorityRank - right.priorityRank || right.matchConfidence - left.matchConfidence || left.product.title.localeCompare(right.product.title));
}

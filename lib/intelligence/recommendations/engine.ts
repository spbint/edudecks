import { isBlockedResource, HOUSEHOLD_RESOURCE_KEYS, normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import type {
  FamilyOwnedResource,
  LearningPlanRecommendationInput,
  LearningRecommendation,
  RecommendationEngine,
  RecommendationEngineContext,
  RecommendationInteractionState,
  RecommendationReasonCode,
  RecommendationResourceInput,
  RecommendationResult,
  ResourceClassification,
} from "@/lib/intelligence/recommendations/types";
import { RECOMMENDATION_ENGINE_VERSION, RECOMMENDATION_RULES_VERSION } from "@/lib/intelligence/recommendations/types";

function interactionFor(id: string, context: RecommendationEngineContext): RecommendationInteractionState {
  return context.interactionStates?.[id] ?? { recommendationId: id, ownedDecision: null, saved: false, dismissed: false, prepared: false, completed: false };
}

function resourceClassification(resource: RecommendationResourceInput, ownedResources: FamilyOwnedResource[], interaction?: RecommendationInteractionState): ResourceClassification {
  if (isBlockedResource(resource.name)) return "unsuitable_blocked";
  if (interaction?.ownedDecision === "not_owned") {
    if (resource.category?.toLowerCase().includes("borrow")) return "borrowable";
    return resource.required ? "missing_essential" : "optional_extension";
  }
  const match = ownedResources.find((owned) => owned.active && owned.normalizedResourceKey === resource.resourceKey);
  if (match || interaction?.ownedDecision === "owned") return "already_owned";
  const category = resource.category?.toLowerCase() ?? "";
  if (category.includes("free") || category.includes("digital") || category.includes("online") || /\bfree\b|\bdigital\b|\bonline/i.test(resource.name)) return "free_digital";
  if (category.includes("borrow") || /\blibrary\b|\bborrow/i.test(resource.name)) return "borrowable";
  if (HOUSEHOLD_RESOURCE_KEYS.has(resource.resourceKey)) return "household_common";
  if (category.includes("reusable") || category.includes("equipment")) return "reusable";
  if (category.includes("consumable") || category.includes("material")) return "consumable";
  return resource.required ? "missing_essential" : "optional_extension";
}

function reasonFor(classification: ResourceClassification, required: boolean): RecommendationReasonCode {
  if (classification === "already_owned") return "OWNED_RESOURCE_MATCH";
  if (classification === "household_common" || classification === "reusable" || classification === "consumable") return "HOUSEHOLD_ALTERNATIVE";
  if (classification === "free_digital") return "FREE_DIGITAL_ALTERNATIVE";
  if (classification === "borrowable") return "BORROWABLE_SUBSTITUTE";
  if (classification === "unsuitable_blocked") return "UNSUITABLE_BLOCKED";
  if (!required || classification === "optional_extension") return "OPTIONAL_EXTENSION";
  return "MISSING_ESSENTIAL";
}

function idFor(input: LearningPlanRecommendationInput, kind: string, index: number, value: string) {
  return `${input.planId}:${input.revisionNumber}:${kind}:${index}:${normaliseResourceKey(value) || "item"}`;
}

function baseRecommendation(input: LearningPlanRecommendationInput, id: string, objectType: LearningRecommendation["objectType"], title: string, summary: string, category: string, required: boolean, reasonCode: RecommendationReasonCode, resourceClassification: ResourceClassification | null, resourceKey: string | null, context: RecommendationEngineContext): LearningRecommendation {
  const interaction = interactionFor(id, context);
  return {
    recommendationId: id,
    objectType,
    title,
    summary,
    category,
    priorityRank: 0,
    reasonCode,
    parentReadableReason: "",
    required,
    resourceClassification,
    resourceKey,
    sourcePlan: { planId: input.planId, revisionId: input.revisionId, revisionNumber: input.revisionNumber },
    engineVersion: RECOMMENDATION_ENGINE_VERSION,
    rulesVersion: RECOMMENDATION_RULES_VERSION,
    provenance: { sourceProvenance: input.sourceProvenance, generatedAt: (context.now ?? (() => new Date()))().toISOString() },
    interaction,
  };
}

function score(candidate: LearningRecommendation) {
  const safety = candidate.objectType === "safety_supervision_action" ? 1_000 : 0;
  const learning = candidate.objectType === "learning_activity" ? 800 : 0;
  const required = candidate.required ? 300 : 0;
  const ownership = candidate.resourceClassification === "already_owned" ? 250 : 0;
  const freeAlternative = candidate.resourceClassification === "household_common" || candidate.resourceClassification === "free_digital" || candidate.resourceClassification === "reusable" || candidate.resourceClassification === "consumable" ? 200 : 0;
  const optionalPenalty = candidate.required ? 0 : -100;
  return { learning, safety, required, ownership, freeAlternative, optionalPenalty };
}

export function createDeterministicRecommendationEngine(): RecommendationEngine {
  const service: RecommendationEngine = {
    classifyResources(resource, ownedResources, interaction) {
      return resourceClassification(resource, ownedResources, interaction);
    },

    rankRecommendations(context, candidates) {
      return candidates
        .map((candidate) => ({ candidate, components: score(candidate) }))
        .sort((left, right) => {
          const leftScore = Object.values(left.components).reduce((sum, value) => sum + value, 0);
          const rightScore = Object.values(right.components).reduce((sum, value) => sum + value, 0);
          return rightScore - leftScore || left.candidate.recommendationId.localeCompare(right.candidate.recommendationId);
        })
        .map(({ candidate, components }, index) => ({ ...candidate, priorityRank: index + 1, scoreComponents: components, parentReadableReason: service.explainRecommendation({ ...candidate, scoreComponents: components }, context) }));
    },

    explainRecommendation(candidate) {
      switch (candidate.reasonCode) {
        case "SAFETY_REQUIRED": return "This safety or supervision action is required before learning begins.";
        case "LEARNING_SEQUENCE": return "This is part of the approved learning sequence.";
        case "PREPARATION_REQUIRED": return "Preparing this first helps the approved activity run smoothly.";
        case "OWNED_RESOURCE_MATCH": return "You already have a matching resource, so no purchase is suggested.";
        case "HOUSEHOLD_ALTERNATIVE": return "A common household or reusable alternative can support this activity.";
        case "FREE_DIGITAL_ALTERNATIVE": return "A free or digital option is available before considering a purchase.";
        case "BORROWABLE_SUBSTITUTE": return "Borrowing or substituting is preferred to buying a new item.";
        case "MISSING_ESSENTIAL": return "This resource is required for the approved activity and is not matched to an owned item.";
        case "OPTIONAL_EXTENSION": return "This is an optional extension after the essential learning is ready.";
        case "EVIDENCE_CAPTURE": return "Capture this evidence to remember what the learner did or explained.";
        case "PORTFOLIO_REFLECTION": return "Use this prompt for a parent reflection; it does not create portfolio records yet.";
        case "UNSUITABLE_BLOCKED": return "This item is blocked by the safety rules and will not be recommended.";
      }
    },

    generateRecommendations(input, context) {
      const candidates: LearningRecommendation[] = [];
      const exclusions: Array<{ recommendationId: string; reason: string }> = [];
      const ownershipMatches: Array<{ recommendationId: string; resourceKey: string; ownedResourceId: string }> = [];
      input.safetySupervisionRequirements.forEach((note, index) => {
        const id = idFor(input, "safety", index, note);
        candidates.push(baseRecommendation(input, id, "safety_supervision_action", "Safety and supervision", note, "Safety and supervision", true, "SAFETY_REQUIRED", null, null, context));
      });
      input.lessonUnitSequence.forEach((step, index) => {
        const id = idFor(input, "learning", index, step.title);
        candidates.push(baseRecommendation(input, id, "learning_activity", step.title, step.activity, "Learning activity", true, "LEARNING_SEQUENCE", null, null, context));
      });
      input.preparationRequirements.forEach((item, index) => {
        const id = idFor(input, "preparation", index, item);
        candidates.push(baseRecommendation(input, id, "preparation_action", "Prepare: " + item, item, "Preparation", true, "PREPARATION_REQUIRED", null, null, context));
      });
      const addResource = (resource: RecommendationResourceInput, index: number) => {
        const objectType = resource.required ? "required_resource" : "optional_extension_resource";
        const id = idFor(input, resource.required ? "required-resource" : "optional-resource", index, resource.name);
        const classification = service.classifyResources(resource, context.ownedResources, interactionFor(id, context));
        const recommendation = baseRecommendation(input, id, objectType, resource.name, resource.notes || `Resource for ${resource.category || "the approved activity"}.`, resource.category || "Resources", resource.required, reasonFor(classification, resource.required), classification, resource.resourceKey, context);
        if (classification === "unsuitable_blocked") exclusions.push({ recommendationId: id, reason: "Resource is blocked by deterministic safety rules." });
        else candidates.push(recommendation);
        const match = context.ownedResources.find((owned) => owned.active && owned.normalizedResourceKey === resource.resourceKey);
        if (match) ownershipMatches.push({ recommendationId: id, resourceKey: resource.resourceKey, ownedResourceId: match.id });
      };
      input.requiredResources.forEach(addResource);
      input.optionalResources.forEach(addResource);
      input.evidencePrompts.forEach((item, index) => {
        const id = idFor(input, "evidence", index, item);
        candidates.push(baseRecommendation(input, id, "evidence_capture_action", "Capture evidence", item, "Evidence capture", true, "EVIDENCE_CAPTURE", null, null, context));
      });
      input.portfolioPrompts.forEach((item, index) => {
        const id = idFor(input, "portfolio", index, item);
        candidates.push(baseRecommendation(input, id, "portfolio_reflection_action", "Portfolio reflection", item, "Portfolio reflection", true, "PORTFOLIO_REFLECTION", null, null, context));
      });
      const ranked = service.rankRecommendations(context, candidates);
      const dismissedRecommendations = ranked.filter((candidate) => candidate.interaction.dismissed);
      const recommendations = ranked.filter((candidate) => !candidate.interaction.dismissed);
      return {
        input,
        recommendations,
        dismissedRecommendations,
        debug: {
          eligibility: "approved",
          scoreComponents: ranked.map((candidate) => ({ recommendationId: candidate.recommendationId, components: candidate.scoreComponents! })),
          ruleVersion: RECOMMENDATION_RULES_VERSION,
          reasonCodes: ranked.map((candidate) => ({ recommendationId: candidate.recommendationId, reasonCode: candidate.reasonCode })),
          exclusions,
          ownershipMatches,
        },
      } satisfies RecommendationResult;
    },
  };
  return service;
}

import type { GeneratedPlanContent, LearningPlanType } from "@/lib/intelligence/plans/types";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import type { ApprovedPlanRevision, LearningPlanRecommendationInput, RecommendationResourceInput } from "@/lib/intelligence/recommendations/types";

export class RecommendationHandoffError extends Error {
  readonly code: "not_approved" | "malformed_plan" | "invalid_revision";
  readonly issues: string[];

  constructor(code: RecommendationHandoffError["code"], message: string, issues: string[] = []) {
    super(message);
    this.name = "RecommendationHandoffError";
    this.code = code;
    this.issues = issues;
  }
}

function list(value: unknown, field: string, issues: string[], required = false) {
  if (!Array.isArray(value)) {
    issues.push(`${field} must be a list.`);
    return [];
  }
  const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  if (required && values.length === 0) issues.push(`${field} cannot be empty.`);
  return values;
}

function contentOf(snapshot: ApprovedPlanRevision) {
  return snapshot.content as unknown as GeneratedPlanContent;
}

function resources(content: GeneratedPlanContent, required: boolean): RecommendationResourceInput[] {
  return content.resourceRequirements
    .filter((resource) => resource.required === required)
    .map((resource) => ({ ...resource, resourceKey: normaliseResourceKey(resource.name), required }));
}

export function buildLearningPlanRecommendationInput(snapshot: ApprovedPlanRevision): LearningPlanRecommendationInput {
  if (!Number.isInteger(snapshot.revisionNumber) || snapshot.revisionNumber < 1 || !snapshot.revisionId) {
    throw new RecommendationHandoffError("invalid_revision", "An immutable approved revision is required.");
  }
  const content = contentOf(snapshot);
  const review = content.review;
  if (snapshot.status === "archived" || snapshot.status === "draft" || review?.workflowStatus !== "approved") {
    throw new RecommendationHandoffError("not_approved", "Only an approved plan revision can be recommended.");
  }
  const issues: string[] = [];
  if (!snapshot.planId || !snapshot.provenance || !snapshot.approvedAt) issues.push("Approved plan provenance is incomplete.");
  if (!content.planType || (content.planType !== "lesson" && content.planType !== "unit")) issues.push("Plan type is invalid.");
  if (!content.sourceAttribution?.originalUrl) issues.push("Source attribution is required.");
  const subjects = list(content.subjects, "subjects", issues, true);
  const learningIntentions = list(content.learningIntentions, "learningIntentions", issues, true);
  const sequence = Array.isArray(content.sequence) ? content.sequence.map((item, index) => ({
    sequenceId: `${snapshot.planId}-sequence-${index + 1}`,
    order: index + 1,
    title: typeof item?.title === "string" ? item.title : "",
    objective: typeof item?.objective === "string" ? item.objective : "",
    activity: typeof item?.activity === "string" ? item.activity : "",
    durationMinutes: typeof item?.durationMinutes === "number" ? item.durationMinutes : null,
    notes: typeof item?.notes === "string" ? item.notes : "",
  })) : [];
  if (!sequence.length) issues.push("sequence cannot be empty.");
  sequence.forEach((item, index) => {
    if (!item.title || !item.activity) issues.push(`sequence[${index}] is incomplete.`);
  });
  if (issues.length) throw new RecommendationHandoffError("malformed_plan", "The approved plan cannot be handed off safely.", issues);
  const curriculumConcepts = Array.from(new Set([
    ...subjects,
    ...list((content as unknown as Record<string, unknown>).curriculumConcepts, "curriculumConcepts", [], false),
  ]));
  return {
    planId: snapshot.planId,
    planType: content.planType as LearningPlanType,
    revisionId: snapshot.revisionId,
    revisionNumber: snapshot.revisionNumber,
    learnerAgeOrStage: content.ageStage?.trim() || null,
    subjects,
    curriculumConcepts,
    learningIntentions,
    duration: { value: content.duration, unit: content.durationUnit },
    lessonUnitSequence: sequence,
    requiredResources: resources(content, true),
    optionalResources: resources(content, false),
    preparationRequirements: list(content.preparation, "preparation", issues),
    evidencePrompts: list(content.evidencePrompts, "evidencePrompts", issues),
    portfolioPrompts: list(content.portfolioPrompts, "portfolioPrompts", issues),
    safetySupervisionRequirements: list(content.safetySupervisionNotes, "safetySupervisionNotes", issues),
    sourceProvenance: snapshot.provenance,
    parentPreferences: content.parentInstructions?.trim() || null,
    approvedAt: snapshot.approvedAt,
    schemaVersion: "mylearna-learning-plan-recommendation-input-v1",
  };
}

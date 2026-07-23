import { validateSourceUrl } from "@/lib/intelligence/validation";
import type {
  GeneratedPlanContent,
  GeneratedResourceItem,
  GeneratedSequenceItem,
  PlanValidationResult,
} from "@/lib/intelligence/plans/types";
import type { ReviewValidationResult } from "@/lib/intelligence/plans/reviewTypes";

export const EDITABLE_PLAN_FIELDS = [
  "title",
  "overview",
  "subjects",
  "ageStage",
  "learningIntentions",
  "successCriteria",
  "sequence",
  "resourceRequirements",
  "preparation",
  "discussionQuestions",
  "differentiation",
  "assessmentApproach",
  "evidencePrompts",
  "portfolioPrompts",
  "safetySupervisionNotes",
  "limitationsAssumptions",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function list(value: unknown, field: string, issues: string[], required: boolean) {
  if (!Array.isArray(value)) {
    issues.push(`${field} must be a list.`);
    return [];
  }
  if (value.length > 100) issues.push(`${field} contains too many items.`);
  const values = value.map((item, index) => {
    const result = text(item);
    if (!result) issues.push(`${field}[${index}] cannot be empty.`);
    if (result.length > 2_000) issues.push(`${field}[${index}] is too long.`);
    return result;
  });
  if (required && values.filter(Boolean).length === 0) issues.push(`${field} cannot be empty.`);
  return values.filter(Boolean);
}

function sequence(value: unknown, issues: string[]) {
  if (!Array.isArray(value)) {
    issues.push("sequence must be a list.");
    return [];
  }
  if (!value.length) issues.push("sequence must contain at least one step.");
  const values: GeneratedSequenceItem[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      issues.push(`sequence[${index}] must be an object.`);
      return;
    }
    const duration = item.durationMinutes;
    if (duration !== null && duration !== undefined && (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0 || duration > 1_440)) {
      issues.push(`sequence[${index}].durationMinutes is invalid.`);
    }
    const sequenceItem: GeneratedSequenceItem = {
      title: text(item.title),
      objective: text(item.objective),
      activity: text(item.activity),
      durationMinutes: typeof duration === "number" && Number.isFinite(duration) ? duration : null,
      notes: text(item.notes),
    };
    values.push(sequenceItem);
    if (!sequenceItem.title) issues.push(`sequence[${index}].title cannot be empty.`);
    if (!sequenceItem.objective) issues.push(`sequence[${index}].objective cannot be empty.`);
    if (!sequenceItem.activity) issues.push(`sequence[${index}].activity cannot be empty.`);
  });
  return values;
}

function resources(value: unknown, issues: string[]) {
  if (!Array.isArray(value)) {
    issues.push("resourceRequirements must be a list.");
    return [];
  }
  const values: GeneratedResourceItem[] = [];
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      issues.push(`resourceRequirements[${index}] must be an object.`);
      return;
    }
    const url = text(item.url) || null;
    if (url && !validateSourceUrl(url).valid) issues.push(`resourceRequirements[${index}].url must be an HTTP or HTTPS URL.`);
    if (item.required !== undefined && typeof item.required !== "boolean") issues.push(`resourceRequirements[${index}].required must be true or false.`);
    const resource: GeneratedResourceItem = {
      name: text(item.name),
      category: text(item.category) || null,
      quantity: text(item.quantity) || null,
      required: item.required !== false,
      url,
      notes: text(item.notes),
    };
    if (!resource.name) issues.push(`resourceRequirements[${index}].name cannot be empty.`);
    values.push(resource);
  });
  return values;
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function changedPlanFields(previous: GeneratedPlanContent, next: GeneratedPlanContent) {
  return EDITABLE_PLAN_FIELDS.filter((field) => !same(previous[field], next[field]));
}

export function validateEditablePlanContent(
  raw: unknown,
  original: GeneratedPlanContent,
  safetyAcknowledged: boolean,
  now: () => Date,
  requireSafetyAcknowledgement = false,
): { content: GeneratedPlanContent; validation: ReviewValidationResult; changedFields: string[] } {
  const candidate = isRecord(raw) ? raw : {};
  const issues: string[] = [];
  const title = text(candidate.title);
  const overview = text(candidate.overview);
  const ageStage = text(candidate.ageStage);
  const assessmentApproach = text(candidate.assessmentApproach);
  if (!title) issues.push("title cannot be empty.");
  if (!overview) issues.push("overview cannot be empty.");
  if (!ageStage) issues.push("ageStage cannot be empty.");
  if (!assessmentApproach) issues.push("assessmentApproach cannot be empty.");

  const safetySupervisionNotes = list(candidate.safetySupervisionNotes, "safetySupervisionNotes", issues, true);
  const safetyAcknowledgementRequired = safetySupervisionNotes.length > 0;
  if (requireSafetyAcknowledgement && safetyAcknowledgementRequired && !safetyAcknowledged) {
    issues.push("Safety and supervision notes must be acknowledged before approval.");
  }

  const content: GeneratedPlanContent = {
    ...original,
    title,
    overview,
    subjects: list(candidate.subjects, "subjects", issues, true),
    ageStage,
    learningIntentions: list(candidate.learningIntentions, "learningIntentions", issues, true),
    successCriteria: list(candidate.successCriteria, "successCriteria", issues, true),
    sequence: sequence(candidate.sequence, issues),
    resourceRequirements: resources(candidate.resourceRequirements, issues),
    preparation: list(candidate.preparation, "preparation", issues, false),
    discussionQuestions: list(candidate.discussionQuestions, "discussionQuestions", issues, false),
    differentiation: list(candidate.differentiation, "differentiation", issues, false),
    assessmentApproach,
    evidencePrompts: list(candidate.evidencePrompts, "evidencePrompts", issues, false),
    portfolioPrompts: list(candidate.portfolioPrompts, "portfolioPrompts", issues, false),
    safetySupervisionNotes,
    limitationsAssumptions: list(candidate.limitationsAssumptions, "limitationsAssumptions", issues, false),
    sourceAttribution: original.sourceAttribution,
    generation: original.generation,
    parentInstructions: original.parentInstructions,
  };
  const validation: ReviewValidationResult = {
    valid: issues.length === 0,
    repaired: false,
    issues,
    safetyAcknowledgementRequired,
    safetyAcknowledged,
    validatedAt: now().toISOString(),
  };
  return { content, validation, changedFields: changedPlanFields(original, content) };
}

export function planValidationResult(validation: ReviewValidationResult): PlanValidationResult {
  return {
    valid: validation.valid,
    repaired: validation.repaired,
    issues: validation.issues,
    validatedAt: validation.validatedAt,
  };
}

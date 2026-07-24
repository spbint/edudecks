import type {
  GeneratedPlanContent,
  GeneratedResourceItem,
  GeneratedSequenceItem,
  LearningPlanGenerationInput,
  PlanGenerationMetadata,
  PlanReviewMetadata,
  SourceAttribution,
} from "@/lib/intelligence/plans/types";

export const PLAN_SCHEMA_VERSION = "mylearna-learning-plan-v1";
export const PLAN_PROMPT_VERSION = "mylearna-learning-plan-prompt-v1";
export const DEFAULT_MAX_OUTPUT_BYTES = 200_000;

export class PlanSchemaValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("The generated plan did not match the required schema.");
    this.name = "PlanSchemaValidationError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function boundedString(value: unknown, field: string, issues: string[], max = 4_000) {
  const result = clean(value);
  if (!result) issues.push(`${field} is required.`);
  if (result.length > max) issues.push(`${field} exceeds the allowed length.`);
  return result;
}

function stringArray(
  value: unknown,
  field: string,
  issues: string[],
  repaired: { value: boolean },
  required = false,
) {
  if (value === undefined && !required) {
    repaired.value = true;
    return [];
  }
  if (!Array.isArray(value)) {
    issues.push(`${field} must be an array of strings.`);
    return [];
  }
  if (value.length > 50) issues.push(`${field} contains too many items.`);
  const result = value.map((entry, index) => {
    const item = clean(entry);
    if (!item) issues.push(`${field}[${index}] must be a non-empty string.`);
    if (item.length > 2_000) issues.push(`${field}[${index}] exceeds the allowed length.`);
    return item;
  }).filter(Boolean);
  if (result.length !== value.length) repaired.value = true;
  if (required && result.length === 0) issues.push(`${field} must contain at least one item.`);
  return result;
}

function sequenceItems(
  value: unknown,
  issues: string[],
) {
  if (!Array.isArray(value)) {
    issues.push("sequence must be an array.");
    return [];
  }
  if (!value.length) issues.push("sequence must contain at least one item.");
  if (value.length > 100) issues.push("sequence contains too many items.");
  const result: GeneratedSequenceItem[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`sequence[${index}] must be an object.`);
      return;
    }
    const duration = entry.durationMinutes;
    if (duration !== null && duration !== undefined && (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0 || duration > 1_440)) {
      issues.push(`sequence[${index}].durationMinutes is invalid.`);
    }
    result.push({
      title: boundedString(entry.title, `sequence[${index}].title`, issues, 500),
      objective: boundedString(entry.objective, `sequence[${index}].objective`, issues),
      activity: boundedString(entry.activity, `sequence[${index}].activity`, issues),
      durationMinutes: typeof duration === "number" && Number.isFinite(duration) ? duration : null,
      notes: clean(entry.notes),
    });
  });
  return result;
}

function resourceItems(
  value: unknown,
  issues: string[],
  repaired: { value: boolean },
) {
  if (value === undefined) {
    repaired.value = true;
    return [];
  }
  if (!Array.isArray(value)) {
    issues.push("resourceRequirements must be an array.");
    return [];
  }
  if (value.length > 100) issues.push("resourceRequirements contains too many items.");
  const result: GeneratedResourceItem[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`resourceRequirements[${index}] must be an object.`);
      return;
    }
    const required = entry.required;
    if (required !== undefined && typeof required !== "boolean") {
      issues.push(`resourceRequirements[${index}].required must be boolean.`);
    }
    result.push({
      name: boundedString(entry.name, `resourceRequirements[${index}].name`, issues, 500),
      category: clean(entry.category) || null,
      quantity: clean(entry.quantity) || null,
      required: required !== false,
      url: clean(entry.url) || null,
      notes: clean(entry.notes),
    });
  });
  return result;
}

function trustedAttribution(input: LearningPlanGenerationInput): SourceAttribution {
  return {
    sourceId: input.source.sourceId,
    originalUrl: input.source.originalUrl,
    finalUrl: input.source.finalUrl,
    canonicalUrl: input.source.canonicalUrl,
    title: input.source.title,
    provider: input.source.provider,
    extractedAt: input.source.extractedAt,
  };
}

function parseProviderOutput(raw: unknown, maxOutputBytes: number) {
  let serialized: string;
  try {
    serialized = typeof raw === "string" ? raw : JSON.stringify(raw);
  } catch {
    throw new PlanSchemaValidationError(["Provider output could not be serialized."]);
  }
  if (!serialized || new TextEncoder().encode(serialized).byteLength > maxOutputBytes) {
    throw new PlanSchemaValidationError(["Provider output exceeds the allowed size."]);
  }
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new PlanSchemaValidationError(["Provider output was not valid JSON."]);
  }
}

export function validateAndRepairGeneratedPlan(
  raw: unknown,
  input: LearningPlanGenerationInput,
  generation: PlanGenerationMetadata,
  now: () => Date,
  maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES,
) {
  const parsed = parseProviderOutput(raw, maxOutputBytes);
  const candidate = isRecord(parsed) && isRecord(parsed.plan) ? parsed.plan : parsed;
  const repaired = { value: Boolean(isRecord(parsed) && isRecord(parsed.plan)) };
  const issues: string[] = [];
  if (!isRecord(candidate)) {
    throw new PlanSchemaValidationError(["Provider output must be a JSON object."]);
  }

  const content: GeneratedPlanContent = {
    planType: input.planType,
    title: boundedString(candidate.title, "title", issues, 500),
    overview: boundedString(candidate.overview, "overview", issues),
    subjects: stringArray(candidate.subjects, "subjects", issues, repaired, true),
    ageStage: boundedString(candidate.ageStage, "ageStage", issues, 200),
    duration: input.duration,
    durationUnit: input.durationUnit,
    learningIntentions: stringArray(candidate.learningIntentions, "learningIntentions", issues, repaired, true),
    successCriteria: stringArray(candidate.successCriteria, "successCriteria", issues, repaired, true),
    sequence: sequenceItems(candidate.sequence, issues),
    resourceRequirements: resourceItems(candidate.resourceRequirements, issues, repaired),
    preparation: stringArray(candidate.preparation, "preparation", issues, repaired),
    discussionQuestions: stringArray(candidate.discussionQuestions, "discussionQuestions", issues, repaired),
    differentiation: stringArray(candidate.differentiation, "differentiation", issues, repaired),
    assessmentApproach: boundedString(candidate.assessmentApproach, "assessmentApproach", issues),
    evidencePrompts: stringArray(candidate.evidencePrompts, "evidencePrompts", issues, repaired),
    portfolioPrompts: stringArray(candidate.portfolioPrompts, "portfolioPrompts", issues, repaired),
    safetySupervisionNotes: stringArray(candidate.safetySupervisionNotes, "safetySupervisionNotes", issues, repaired),
    sourceAttribution: trustedAttribution(input),
    limitationsAssumptions: stringArray(candidate.limitationsAssumptions, "limitationsAssumptions", issues, repaired),
    parentInstructions: input.parentInstructions,
    generation,
    validation: {
      valid: issues.length === 0,
      repaired: repaired.value,
      issues: [...issues],
      validatedAt: now().toISOString(),
    },
  };

  const review: PlanReviewMetadata = {
    workflowStatus: "generated_draft",
    originalGeneratedRevision: generation.revision,
    revisionKind: "generated",
    changedFields: [],
    lastEditedAt: null,
    lastEditedByUserId: null,
    safetyAcknowledged: false,
    validation: content.validation,
  };
  content.review = review;

  if (issues.length) throw new PlanSchemaValidationError(issues);
  return content;
}

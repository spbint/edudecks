import type { IdeaSource, PlanProvenance } from "@/lib/intelligence/types";
import type { SourcePreviewMetadata } from "@/lib/intelligence/sources/types";
import { callGenerator, isLearningPlanType } from "@/lib/intelligence/plans/generator";
import {
  DEFAULT_MAX_OUTPUT_BYTES,
  PLAN_PROMPT_VERSION,
  PLAN_SCHEMA_VERSION,
  PlanSchemaValidationError,
  validateAndRepairGeneratedPlan,
} from "@/lib/intelligence/plans/schema";
import type {
  GenerationFailureCode,
  GenerationResult,
  GenerationServiceOptions,
  GenerationState,
  LearningPlanGenerationInput,
  LearningPlanType,
  PersistedPlanInput,
} from "@/lib/intelligence/plans/types";

export class PlanGenerationError extends Error {
  readonly state: Exclude<GenerationState, "generating" | "ready">;
  readonly code: GenerationFailureCode;
  readonly issues: string[];

  constructor(
    state: Exclude<GenerationState, "generating" | "ready">,
    code: GenerationFailureCode,
    message: string,
    issues: string[] = [],
  ) {
    super(message);
    this.name = "PlanGenerationError";
    this.state = state;
    this.code = code;
    this.issues = issues;
  }
}

export class ProviderUnavailableError extends Error {
  constructor(message = "The generation provider is currently unavailable.") {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export const defaultGenerationCoordinator = {
  inFlight: new Set<string>(),
  requestTimes: new Map<string, number[]>(),
};

export interface LearningPlanGenerationService {
  generateForUser(
    userId: string,
    ideaId: string,
    source: IdeaSource,
    input: Omit<LearningPlanGenerationInput, "source" | "planType"> & {
      planType: LearningPlanType;
      regenerate?: boolean;
    },
  ): Promise<GenerationResult>;
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function metadataForSource(source: IdeaSource): SourcePreviewMetadata {
  const metadata = source.metadata as Partial<SourcePreviewMetadata>;
  if (metadata.extractionStatus !== "ready") {
    throw new PlanGenerationError(
      "awaiting_input",
      "source_not_ready",
      "Generate a preview for this source before creating a plan.",
    );
  }
  return {
    originalUrl: source.url,
    finalUrl: typeof metadata.finalUrl === "string" ? metadata.finalUrl : null,
    canonicalUrl: typeof metadata.canonicalUrl === "string" ? metadata.canonicalUrl : null,
    title: typeof metadata.title === "string" ? metadata.title : source.title,
    description: typeof metadata.description === "string" ? metadata.description : source.description,
    provider: typeof metadata.provider === "string" ? metadata.provider : source.provider,
    previewImageUrl: typeof metadata.previewImageUrl === "string" ? metadata.previewImageUrl : null,
    faviconUrl: typeof metadata.faviconUrl === "string" ? metadata.faviconUrl : null,
    contentType: typeof metadata.contentType === "string" ? metadata.contentType : "text/html",
    fetchedAt: typeof metadata.fetchedAt === "string" ? metadata.fetchedAt : source.extractedAt,
    extractionAttemptedAt: typeof metadata.extractionAttemptedAt === "string" ? metadata.extractionAttemptedAt : source.extractedAt ?? "",
    extractionStatus: "ready",
    extractorVersion: typeof metadata.extractorVersion === "string" ? metadata.extractorVersion : "unknown",
  };
}

function validateRequest(
  userId: string,
  ideaId: string,
  source: IdeaSource,
  input: Omit<LearningPlanGenerationInput, "source" | "planType"> & {
    planType: LearningPlanType;
    regenerate?: boolean;
  },
) {
  if (!clean(userId) || !clean(ideaId) || source.userId !== userId || source.ideaId !== ideaId) {
    throw new PlanGenerationError("failed", "invalid_input", "The requested source is not available.");
  }
  if (!isLearningPlanType(input.planType)) {
    throw new PlanGenerationError("failed", "invalid_input", "Choose either a lesson or unit plan.");
  }
  const learnerAgeOrStage = clean(input.learnerAgeOrStage);
  if (!learnerAgeOrStage || learnerAgeOrStage.length > 200) {
    throw new PlanGenerationError("awaiting_input", "invalid_input", "Learner age or stage is required.");
  }
  const subjects = (input.subjects ?? []).map(clean).filter(Boolean);
  if (subjects.length > 10 || subjects.some((subject) => subject.length > 100)) {
    throw new PlanGenerationError("awaiting_input", "invalid_input", "Please provide no more than ten concise subjects.");
  }
  const duration = input.duration === null || input.duration === undefined ? null : Number(input.duration);
  if (duration !== null && (!Number.isFinite(duration) || duration <= 0 || duration > 1_440)) {
    throw new PlanGenerationError("awaiting_input", "invalid_input", "Duration must be between 1 and 1440.");
  }
  const parentInstructions = clean(input.parentInstructions);
  if (parentInstructions.length > 4_000) {
    throw new PlanGenerationError("awaiting_input", "invalid_input", "Parent instructions are too long.");
  }
  const metadata = metadataForSource(source);
  const generationInput: LearningPlanGenerationInput = {
    planType: input.planType,
    source: {
      sourceId: source.id,
      originalUrl: metadata.originalUrl,
      finalUrl: metadata.finalUrl,
      canonicalUrl: metadata.canonicalUrl,
      title: metadata.title,
      description: metadata.description,
      provider: metadata.provider,
      extractedAt: metadata.fetchedAt,
    },
    learnerAgeOrStage,
    subjects,
    duration,
    durationUnit: input.durationUnit ?? null,
    parentInstructions: parentInstructions || null,
  };
  return { metadata, generationInput };
}

function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PlanGenerationError("timed_out", "provider_timeout", "Plan generation timed out.")), timeoutMs);
  });
  return Promise.race([task(controller.signal), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
    controller.abort();
  });
}

function outputBytes(value: unknown) {
  try {
    return new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function createLearningPlanGenerationService(options: GenerationServiceOptions): LearningPlanGenerationService {
  const now = options.now ?? (() => new Date());
  const timeoutMs = options.requestTimeoutMs ?? 15_000;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const maxRetries = options.maxRetries ?? 1;
  const throttleWindowMs = options.throttleWindowMs ?? 60_000;
  const maxRequests = options.maxRequestsPerUserPerWindow ?? 5;
  const coordinator = options.coordinator ?? {
    inFlight: new Set<string>(),
    requestTimes: new Map<string, number[]>(),
  };

  async function runProvider(input: LearningPlanGenerationInput) {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const raw = await withTimeout(
          (signal) => callGenerator(options.generator, input, { signal }),
          timeoutMs,
        );
        if (outputBytes(raw) > maxOutputBytes) {
          throw new PlanGenerationError("validation_failed", "output_too_large", "The generated plan is too large to store.");
        }
        return raw;
      } catch (error) {
        lastError = error;
        if (error instanceof PlanGenerationError && error.code === "output_too_large") throw error;
        if (attempt >= maxRetries) break;
      }
    }
    if (lastError instanceof PlanGenerationError) throw lastError;
    if (lastError instanceof ProviderUnavailableError) {
      throw new PlanGenerationError("provider_unavailable", "provider_unavailable", lastError.message);
    }
    throw new PlanGenerationError("failed", "provider_failure", "The generation provider failed.");
  }

  return {
    async generateForUser(userId, ideaId, source, input) {
      const validated = validateRequest(userId, ideaId, source, input);
      const key = `${userId}:${ideaId}:${source.id}:${input.planType}`;
      if (coordinator.inFlight.has(key)) {
        throw new PlanGenerationError("failed", "generation_in_progress", "A generation request is already in progress.");
      }
      const currentTime = now().getTime();
      const recent = (coordinator.requestTimes.get(userId) ?? []).filter((time) => currentTime - time < throttleWindowMs);
      if (recent.length >= maxRequests) {
        throw new PlanGenerationError("failed", "throttled", "Please wait before generating another plan.");
      }
      coordinator.requestTimes.set(userId, [...recent, currentTime]);
      coordinator.inFlight.add(key);

      try {
        const currentDraft = await options.repository.getDraftForUser(userId, ideaId, source.id, input.planType);
        if (currentDraft && !input.regenerate) {
          throw new PlanGenerationError("failed", "draft_exists", "A draft already exists. Regenerate intentionally to create a new revision.");
        }
        const revision = currentDraft ? currentDraft.version + 1 : 1;
        const generatedAt = now().toISOString();
        const generation = {
          provider: options.generator.provider,
          model: options.generator.model,
          modelVersion: options.generator.modelVersion,
          promptVersion: PLAN_PROMPT_VERSION,
          schemaVersion: PLAN_SCHEMA_VERSION,
          generatedAt,
          revision,
        };
        const raw = await runProvider(validated.generationInput);
        let content;
        try {
          content = validateAndRepairGeneratedPlan(raw, validated.generationInput, generation, now, maxOutputBytes);
        } catch (error) {
          if (error instanceof PlanSchemaValidationError) {
            throw new PlanGenerationError("validation_failed", "schema_invalid", error.message, error.issues);
          }
          throw error;
        }
        const provenance: PlanProvenance = {
          sources: [{
            sourceId: source.id,
            sourceUrl: source.url,
            sourceTitle: validated.metadata.title,
            sourceProvider: validated.metadata.provider,
            extractedAt: validated.metadata.fetchedAt,
          }],
          generation: {
            model: `${options.generator.provider}:${options.generator.model}`,
            modelVersion: options.generator.modelVersion,
            promptVersion: PLAN_PROMPT_VERSION,
            schemaVersion: PLAN_SCHEMA_VERSION,
            generatedAt,
          },
          parentEdits: [],
          finalApprovedVersion: null,
          finalApprovedAt: null,
          finalApprovedByUserId: null,
        };
        const persistedInput: PersistedPlanInput = {
          planType: input.planType,
          ideaId,
          sourceId: source.id,
          revision,
          content,
          provenance,
        };
        const plan = currentDraft
          ? await options.repository.createRevisionForUser(userId, currentDraft, persistedInput)
          : await options.repository.createDraftForUser(userId, persistedInput);
        return {
          state: "ready" as const,
          plan,
          revision,
          regenerated: Boolean(currentDraft),
        };
      } finally {
        coordinator.inFlight.delete(key);
      }
    },
  };
}

import { describe, expect, it, vi } from "vitest";
import type { IdeaSource } from "@/lib/intelligence/types";
import { createLearningPlanGenerationService, ProviderUnavailableError } from "@/lib/intelligence/plans/service";
import type {
  LearningPlanDraft,
  LearningPlanGenerator,
  LearningPlanRepository,
} from "@/lib/intelligence/plans/types";

function makeSource(ready = true): IdeaSource {
  return {
    id: "source-1",
    ideaId: "idea-1",
    userId: "user-1",
    sourceType: "url",
    url: "https://example.com/article",
    canonicalUrl: "https://example.com/article",
    provider: "Example",
    title: "A source idea",
    description: "A short extracted description.",
    siteName: "Example",
    imageUrl: null,
    author: null,
    publishedAt: null,
    metadataStatus: ready ? "ready" : "pending",
    metadata: ready ? {
      extractionStatus: "ready",
      originalUrl: "https://example.com/article",
      finalUrl: "https://example.com/final",
      canonicalUrl: "https://example.com/canonical",
      title: "A source idea",
      description: "A short extracted description.",
      provider: "Example",
      fetchedAt: "2026-07-23T00:00:00.000Z",
    } : {},
    extractedAt: ready ? "2026-07-23T00:00:00.000Z" : null,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };
}

function validProviderOutput() {
  return {
    title: "Generated learning plan",
    overview: "A structured overview.",
    subjects: ["Science"],
    ageStage: "Ages 8-10",
    learningIntentions: ["Explore the idea."],
    successCriteria: ["Explain one discovery."],
    sequence: [{ title: "Explore", objective: "Investigate.", activity: "Make and discuss.", durationMinutes: 30, notes: "" }],
    resourceRequirements: [{ name: "Paper", category: "Materials", quantity: "1", required: true, url: null, notes: "" }],
    preparation: ["Prepare materials."],
    discussionQuestions: ["What do you notice?"],
    differentiation: ["Offer a choice of response."],
    assessmentApproach: "Observe and discuss.",
    evidencePrompts: ["What did the learner explain?"],
    portfolioPrompts: ["Save one artefact."],
    safetySupervisionNotes: ["Review materials first."],
    limitationsAssumptions: ["Verify suitability before use."],
  };
}

function makePlan(version = 1): LearningPlanDraft {
  return {
    id: "plan-1",
    userId: "user-1",
    ideaId: "idea-1",
    title: "Generated learning plan",
    summary: "A structured overview.",
    learningArea: "Science",
    yearLevel: "Ages 8-10",
    objectives: ["Explore the idea."],
    durationMinutes: 30,
    sourceIds: ["source-1"],
    sequence: [],
    resources: [],
    status: "draft",
    version,
    provenance: {} as never,
    content: {},
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  } as LearningPlanDraft;
}

function makeGenerator(output: unknown = validProviderOutput()): LearningPlanGenerator {
  return {
    provider: "test-provider",
    model: "test-model",
    modelVersion: "test-v1",
    generateLessonPlan: vi.fn(async () => output),
    generateUnitPlan: vi.fn(async () => output),
  };
}

function makeRepository(existing: LearningPlanDraft | null = null): LearningPlanRepository {
  return {
    getDraftForUser: vi.fn(async () => existing),
    createDraftForUser: vi.fn(async () => makePlan()),
    createRevisionForUser: vi.fn(async (_userId, _current, input) => makePlan(input.revision)),
  };
}

function createService(
  generator: LearningPlanGenerator = makeGenerator(),
  repository: LearningPlanRepository = makeRepository(),
) {
  return createLearningPlanGenerationService({
    generator,
    repository,
    now: () => new Date("2026-07-23T01:00:00.000Z"),
    requestTimeoutMs: 20,
    maxRetries: 1,
  });
}

const input = {
  planType: "lesson" as const,
  learnerAgeOrStage: "Ages 8-10",
  subjects: ["Science"],
  duration: 45,
  durationUnit: "minutes" as const,
  parentInstructions: "Keep the activity practical.",
};

describe("Learning Plan generation service", () => {
  it("generates and persists a lesson draft", async () => {
    const generator = makeGenerator();
    const repository = makeRepository();
    const result = await createService(generator, repository).generateForUser("user-1", "idea-1", makeSource(), input);
    expect(result.state).toBe("ready");
    expect(result.revision).toBe(1);
    expect(generator.generateLessonPlan).toHaveBeenCalledOnce();
    expect(repository.createDraftForUser).toHaveBeenCalledOnce();
  });

  it("does not insert after a failed lookup and does not duplicate a later retry", async () => {
    const repository: LearningPlanRepository = {
      getDraftForUser: vi.fn()
        .mockRejectedValueOnce(new Error("lesson lookup failed"))
        .mockResolvedValue(null),
      createDraftForUser: vi.fn(async () => makePlan()),
      createRevisionForUser: vi.fn(async (_userId, _current, revisionInput) => makePlan(revisionInput.revision)),
    };
    const generator = makeGenerator();
    const service = createService(generator, repository);

    await expect(service.generateForUser("user-1", "idea-1", makeSource(), input))
      .rejects.toThrow("lesson lookup failed");
    expect(repository.createDraftForUser).not.toHaveBeenCalled();

    const retry = await service.generateForUser("user-1", "idea-1", makeSource(), input);
    expect(retry.state).toBe("ready");
    expect(repository.createDraftForUser).toHaveBeenCalledOnce();
    expect(generator.generateLessonPlan).toHaveBeenCalledOnce();
  });

  it("generates a unit draft through the unit adapter", async () => {
    const generator = makeGenerator();
    const repository = makeRepository();
    const result = await createService(generator, repository).generateForUser("user-1", "idea-1", makeSource(), { ...input, planType: "unit" });
    expect(result.state).toBe("ready");
    expect(generator.generateUnitPlan).toHaveBeenCalledOnce();
  });

  it("rejects unauthenticated and cross-user requests", async () => {
    const service = createService();
    await expect(service.generateForUser("", "idea-1", makeSource(), input)).rejects.toMatchObject({ code: "invalid_input" });
    await expect(service.generateForUser("user-2", "idea-1", makeSource(), input)).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("rejects invalid plan types and sources without ready metadata", async () => {
    const service = createService();
    await expect(service.generateForUser("user-1", "idea-1", makeSource(), { ...input, planType: "worksheet" as never })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(service.generateForUser("user-1", "idea-1", makeSource(false), input)).rejects.toMatchObject({ state: "awaiting_input", code: "source_not_ready" });
  });

  it("rejects malformed and oversized provider output", async () => {
    const malformed = createService(makeGenerator({ title: "missing required fields" }));
    await expect(malformed.generateForUser("user-1", "idea-1", makeSource(), input)).rejects.toMatchObject({ state: "validation_failed", code: "schema_invalid" });
    const oversized = createLearningPlanGenerationService({
      generator: makeGenerator("x".repeat(100)),
      repository: makeRepository(),
      maxOutputBytes: 10,
      maxRetries: 0,
    });
    await expect(oversized.generateForUser("user-1", "idea-1", makeSource(), input)).rejects.toMatchObject({ state: "validation_failed", code: "output_too_large" });
  });

  it("classifies provider timeout and failure after bounded retries", async () => {
    const timeoutGenerator = makeGenerator();
    timeoutGenerator.generateLessonPlan = vi.fn(async () => new Promise<never>(() => undefined));
    await expect(createService(timeoutGenerator).generateForUser("user-1", "idea-1", makeSource(), input)).rejects.toMatchObject({ state: "timed_out", code: "provider_timeout" });
    expect(timeoutGenerator.generateLessonPlan).toHaveBeenCalledTimes(2);

    const failureGenerator = makeGenerator();
    failureGenerator.generateLessonPlan = vi.fn(async () => { throw new ProviderUnavailableError(); });
    await expect(createService(failureGenerator).generateForUser("user-1", "idea-1", makeSource(), input)).rejects.toMatchObject({ state: "provider_unavailable", code: "provider_unavailable" });
    expect(failureGenerator.generateLessonPlan).toHaveBeenCalledTimes(2);
  });

  it("prevents duplicate concurrent generation", async () => {
    let release: (() => void) | undefined;
    const generator = makeGenerator();
    generator.generateLessonPlan = vi.fn(() => new Promise((resolve) => {
      release = () => resolve(validProviderOutput());
    }));
    const service = createService(generator);
    const first = service.generateForUser("user-1", "idea-1", makeSource(), input);
    await Promise.resolve();
    await expect(service.generateForUser("user-1", "idea-1", makeSource(), input)).rejects.toMatchObject({ code: "generation_in_progress" });
    release?.();
    await first;
  });

  it("creates an intentional new revision and never silently overwrites", async () => {
    let existing: LearningPlanDraft | null = null;
    const repository: LearningPlanRepository = {
      getDraftForUser: vi.fn(async () => existing),
      createDraftForUser: vi.fn(async () => { existing = makePlan(1); return existing; }),
      createRevisionForUser: vi.fn(async (_userId, _current, revisionInput) => { existing = makePlan(revisionInput.revision); return existing; }),
    };
    const service = createService(makeGenerator(), repository);
    const first = await service.generateForUser("user-1", "idea-1", makeSource(), input);
    expect(first.revision).toBe(1);
    await expect(service.generateForUser("user-1", "idea-1", makeSource(), input)).rejects.toMatchObject({ code: "draft_exists" });
    const regenerated = await service.generateForUser("user-1", "idea-1", makeSource(), { ...input, regenerate: true });
    expect(regenerated.revision).toBe(2);
    expect(repository.createDraftForUser).toHaveBeenCalledOnce();
    expect(repository.createRevisionForUser).toHaveBeenCalledOnce();
  });

  it("stores provenance, attribution, parent instructions, and validation data", async () => {
    const repository = makeRepository();
    await createService(makeGenerator(), repository).generateForUser("user-1", "idea-1", makeSource(), input);
    const persisted = (repository.createDraftForUser as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(persisted.provenance.sources[0]).toMatchObject({
      sourceId: "source-1",
      sourceUrl: "https://example.com/article",
      sourceTitle: "A source idea",
      sourceProvider: "Example",
    });
    expect(persisted.content.sourceAttribution.originalUrl).toBe("https://example.com/article");
    expect(persisted.content.parentInstructions).toBe("Keep the activity practical.");
    expect(persisted.content.validation.valid).toBe(true);
    expect(persisted.content.generation.schemaVersion).toBe("mylearna-learning-plan-v1");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultLearningEvidenceHumanControl,
  LEARNING_EVIDENCE_RESULT_SCHEMA,
  type LearningEvidenceResultV1,
} from "../learningEvidenceResult";
import { createInMemoryLearningEvidenceRepository } from "./inMemoryLearningEvidenceRepository";
import {
  buildLearningEvidenceAttemptV1,
  type SaveCanonicalLearningEvidenceInput,
} from "./learningEvidencePersistence";

const CONTINUA = [
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
] as const;

function result(input: {
  continuumId: (typeof CONTINUA)[number];
  attemptId: string;
  attemptKind: "initial" | "recheck";
  evaluatedAt: string;
  assessed?: boolean;
}): LearningEvidenceResultV1 {
  const assessed = input.assessed !== false;
  return {
    schema: LEARNING_EVIDENCE_RESULT_SCHEMA,
    schemaVersion: 1,
    id: `ler:v1:${input.attemptId}:${input.continuumId}`,
    learnerId: "learner-a",
    product: {
      productId: "mylearna-maths-starting-point-number-operations",
      productVersion: "v1",
      moduleId: "number-operations",
    },
    assessment: {
      assessmentId: "number-operations-baseline",
      assessmentVersion: 1,
      attemptId: input.attemptId,
      attemptKind: input.attemptKind,
    },
    createdAt: input.evaluatedAt,
    evaluatedAt: input.evaluatedAt,
    construct: {
      learningDomain: "mathematics",
      continuumId: input.continuumId,
      continuumLabel: input.continuumId,
      constructId: `construct:${input.continuumId}:P3-P4`,
      constructName: `${input.continuumId} P3-P4`,
      authority: {
        authorityId: "qcaa-numeracy-progressions",
        frameworkId: "MYL-MATH-AU-NUMERACY-V9",
        frameworkVersion: "australian-curriculum-v9",
        mappingVersion: "number-operations-progression-pathways-v1",
      },
      progression: {
        identifier: assessed ? "P3-P4" : "unresolved",
        kind: assessed ? "band" : "unresolved",
        lowerLevel: assessed ? "P3" : null,
        upperLevel: assessed ? "P4" : null,
        endpointRelation: null,
      },
    },
    evidence: {
      sources: assessed
        ? [{ sourceType: "electronic-assessment", sourceId: input.attemptId }]
        : [],
      assessmentScope: assessed ? "assessed" : "not-assessed",
      availability: assessed ? "available" : "unknown",
      itemReferences: assessed
        ? [
            {
              itemId: `item:${input.continuumId}`,
              itemVersion: 3,
              responseProvenance: {
                stage: "boundary",
                progressionLevel: "P4",
                outcome: "correct",
              },
            },
          ]
        : [],
      sufficiency: {
        state: assessed ? "limited" : "unknown",
        reasonCodes: assessed ? ["routing-ceiling"] : ["not-in-scope"],
      },
      practicalConfirmation: {
        state: assessed ? "required" : "not-required",
        evidenceReference: null,
      },
      limitations: assessed
        ? [
            {
              code: "routing-ceiling",
              description: "Practical evidence is still required.",
              evidenceCeiling: "routing-only",
            },
          ]
        : [],
    },
    interpretation: {
      developmentalStatus: assessed
        ? "practical-confirmation-required"
        : "not-enough-evidence",
      sourceMeaning: {
        placementStatus: assessed ? "candidate-band" : "not-assessed",
        evidenceClassification: assessed ? "routing-only" : "not-applicable",
      },
      explanation: assessed ? "Deterministic evidence." : "Unknown remains unknown.",
    },
    provenance: {
      deterministicRule: {
        ruleId: "mylearna-number-operations-starting-point-engine",
        ruleVersion: "v1",
      },
      assessmentVersion: 1,
      sourceItemVersions: assessed
        ? [{ itemId: `item:${input.continuumId}`, itemVersion: 3 }]
        : [],
      curriculumMappingVersion: "number-operations-progression-pathways-v1",
      evaluatedAt: input.evaluatedAt,
      originatingSubsystem: "maths-starting-point-number-operations",
      evidenceCeiling: assessed ? "routing-only" : "no-claim",
    },
    recommendation: assessed
      ? {
          recommendationId: `recommendation:${input.continuumId}`,
          recommendationVersion: "v1",
          category: "verify-with-observation",
          label: "Continue learning",
          reason: "Deterministic recommendation.",
          targetConstructId: `next:${input.continuumId}`,
          targetProgressionIdentifier: "P4",
          handoffTarget: {
            kind: "pathways-review",
            label: "Review in My Pathways",
            href: "/my-pathways",
            referenceId: null,
          },
          pathwayMutation: "not-requested",
        }
      : null,
    humanControl: defaultLearningEvidenceHumanControl(),
  };
}

function saveInput(input: {
  attemptId: string;
  attemptKind?: "initial" | "recheck";
  evaluatedAt: string;
  scope?: (typeof CONTINUA)[number][];
}): SaveCanonicalLearningEvidenceInput {
  const scope = input.scope ?? [...CONTINUA];
  const results = CONTINUA.map((continuumId) =>
    result({
      continuumId,
      attemptId: input.attemptId,
      attemptKind: input.attemptKind ?? "initial",
      evaluatedAt: input.evaluatedAt,
      assessed: scope.includes(continuumId),
    }),
  );
  return {
    actorUserId: "user-a",
    familyId: "family-a",
    learnerId: "learner-a",
    attempt: buildLearningEvidenceAttemptV1({
      results,
      startedAt: new Date(Date.parse(input.evaluatedAt) - 60_000).toISOString(),
      scopeContinuumIds: scope,
    }),
    results,
  };
}

function repository() {
  return createInMemoryLearningEvidenceRepository({
    familyLearners: {
      "family-a": ["learner-a"],
      "family-b": ["learner-b"],
    },
    now: () => "2026-10-09T10:00:00.000Z",
  });
}

describe("Learning Evidence Persistence V1", () => {
  it("round-trips canonical evidence and every required provenance boundary", async () => {
    const store = repository();
    const input = saveInput({
      attemptId: "attempt-initial",
      evaluatedAt: "2026-10-09T09:00:00.000Z",
    });
    const saved = await store.saveCanonicalResults(input);
    const loaded = await store.loadResult({
      familyId: "family-a",
      learnerId: "learner-a",
      resultId: input.results[0]!.id,
    });

    expect(saved.results).toHaveLength(5);
    expect(loaded?.result).toEqual(input.results[0]);
    expect(loaded?.result.evidence.itemReferences[0]).toMatchObject({
      itemVersion: 3,
    });
    expect(loaded?.result.provenance).toMatchObject({
      deterministicRule: { ruleId: expect.any(String), ruleVersion: "v1" },
      curriculumMappingVersion: "number-operations-progression-pathways-v1",
      evidenceCeiling: "routing-only",
    });
    expect(loaded?.result.recommendation).toMatchObject({
      recommendationVersion: "v1",
      pathwayMutation: "not-requested",
    });
    expect(loaded?.review).toEqual({
      reviewState: "not-reviewed",
      confirmationState: "not-confirmed",
      portfolioInclusion: "not-decided",
      humanNoteReference: null,
    });
  });

  it("reuses an identical canonical identity and rejects changed content", async () => {
    const store = repository();
    const input = saveInput({
      attemptId: "attempt-idempotent",
      evaluatedAt: "2026-10-09T09:00:00.000Z",
    });
    expect((await store.saveCanonicalResults(input)).reused).toBe(false);
    expect((await store.saveCanonicalResults(input)).reused).toBe(true);

    const changed = structuredClone(input);
    changed.results[0]!.interpretation.explanation = "Tampered interpretation.";
    await expect(store.saveCanonicalResults(changed)).rejects.toThrow(/conflicts/i);
  });

  it("retains original and recheck attempts as chronological history", async () => {
    const store = repository();
    await store.saveCanonicalResults(
      saveInput({
        attemptId: "attempt-original",
        attemptKind: "initial",
        evaluatedAt: "2026-10-09T09:00:00.000Z",
      }),
    );
    await store.saveCanonicalResults(
      saveInput({
        attemptId: "attempt-recheck",
        attemptKind: "recheck",
        evaluatedAt: "2026-11-09T09:00:00.000Z",
      }),
    );
    const attempts = await store.listAttemptsChronologically({
      familyId: "family-a",
      learnerId: "learner-a",
    });
    expect(attempts.map(({ attemptId, attemptKind }) => [attemptId, attemptKind])).toEqual([
      ["attempt-original", "initial"],
      ["attempt-recheck", "recheck"],
    ]);
    expect(
      await store.listLearnerAssessmentResults({
        familyId: "family-a",
        learnerId: "learner-a",
        moduleId: "number-operations",
        assessmentId: "number-operations-baseline",
      }),
    ).toHaveLength(10);
  });

  it("denies cross-family reads and inserts", async () => {
    const store = repository();
    const crossTenant = saveInput({
      attemptId: "attempt-cross-tenant",
      evaluatedAt: "2026-10-09T09:00:00.000Z",
    });
    crossTenant.familyId = "family-b";
    await expect(store.saveCanonicalResults(crossTenant)).rejects.toThrow(
      /does not belong/i,
    );
    await expect(
      store.loadResult({
        familyId: "family-b",
        learnerId: "learner-a",
        resultId: crossTenant.results[0]!.id,
      }),
    ).rejects.toThrow(/does not belong/i);
  });

  it("keeps a five-result focused attempt valid with unknown areas", async () => {
    const store = repository();
    const input = saveInput({
      attemptId: "attempt-focused",
      evaluatedAt: "2026-10-09T09:00:00.000Z",
      scope: ["additive-strategies"],
    });
    const saved = await store.saveCanonicalResults(input);
    expect(saved.attempt.completionState).toBe("focused");
    expect(saved.results).toHaveLength(5);
    expect(
      saved.results.filter(
        ({ result: entry }) => entry.evidence.assessmentScope === "not-assessed",
      ),
    ).toHaveLength(4);
  });

  it("fails atomically before writing an incomplete five-area profile", async () => {
    const store = repository();
    const input = saveInput({
      attemptId: "attempt-partial-write",
      evaluatedAt: "2026-10-09T09:00:00.000Z",
    });
    input.results.pop();
    await expect(store.saveCanonicalResults(input)).rejects.toThrow(/incomplete/i);
    expect(
      await store.listAttemptsChronologically({
        familyId: "family-a",
        learnerId: "learner-a",
      }),
    ).toEqual([]);
  });

  it("introduces neither a score model, AI dependency nor browser Supabase writer", () => {
    const contractSource = readFileSync(
      join(
        process.cwd(),
        "lib/clean/educationalIntelligence/persistence/learningEvidencePersistence.ts",
      ),
      "utf8",
    );
    const serverSource = readFileSync(
      join(
        process.cwd(),
        "lib/clean/educationalIntelligence/persistence/supabaseLearningEvidenceRepository.server.ts",
      ),
      "utf8",
    );
    expect(contractSource).not.toMatch(/overallMaths|percentage|percentile|growthScore/i);
    expect(`${contractSource}\n${serverSource}`).not.toMatch(
      /openai|anthropic|embedding|generative|llm/i,
    );
    expect(serverSource).toContain('import "server-only"');
  });
});

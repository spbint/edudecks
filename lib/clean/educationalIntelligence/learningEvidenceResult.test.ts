import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultLearningEvidenceHumanControl,
  LEARNING_EVIDENCE_DEVELOPMENTAL_STATUSES,
  type LearningEvidenceAvailability,
  type LearningEvidencePracticalConfirmationState,
  type LearningEvidenceSourceType,
  type LearningEvidenceSufficiency,
} from "./learningEvidenceResult";

describe("Learning Evidence Result V1 contract", () => {
  it("represents the bounded developmental interpretation vocabulary", () => {
    expect(LEARNING_EVIDENCE_DEVELOPMENTAL_STATUSES).toEqual([
      "secure",
      "consolidating",
      "developing",
      "needs-support",
      "not-enough-evidence",
      "practical-confirmation-required",
    ]);
  });

  it("represents evidence sources, unknowns and practical confirmation without inventing failure", () => {
    const sources: LearningEvidenceSourceType[] = [
      "electronic-assessment",
      "practical-observation",
      "parent-observation",
      "teacher-observation",
      "work-sample",
      "imported-evidence",
    ];
    const sufficiency: LearningEvidenceSufficiency[] = [
      "sufficient",
      "limited",
      "not-enough-evidence",
      "unavailable",
      "unresolved",
      "unknown",
    ];
    const availability: LearningEvidenceAvailability[] = [
      "available",
      "inaccessible",
      "unavailable",
      "unknown",
    ];
    const practical: LearningEvidencePracticalConfirmationState[] = [
      "not-required",
      "required",
      "confirmed",
      "unavailable",
    ];

    expect(sources).toHaveLength(6);
    expect(sufficiency).toContain("unknown");
    expect(availability).toContain("inaccessible");
    expect(practical).toContain("required");
  });

  it("starts human decisions neutral and never opts into Portfolio automatically", () => {
    expect(defaultLearningEvidenceHumanControl()).toEqual({
      reviewState: "not-reviewed",
      humanNoteReference: null,
      portfolioInclusion: "not-decided",
      confirmationState: "not-confirmed",
    });
  });

  it("has no Supabase, persistence, React or AI dependency and requires no percentage", () => {
    const directory = join(process.cwd(), "lib/clean/educationalIntelligence");
    const source = [
      "learningEvidenceResult.ts",
      "numberOperationsLearningProfile.ts",
      "startingPointResultProjection.ts",
    ].map((file) => readFileSync(join(directory, file), "utf8")).join("\n");

    for (const forbidden of [
      "@supabase",
      "supabase-js",
      "createClient(",
      "from(\"",
      "insert(",
      "update(",
      "react",
      "openai",
      "anthropic",
      "embedding",
      "llm",
      "percentage:",
      "overallScore",
    ]) {
      expect(source.toLowerCase(), forbidden).not.toContain(forbidden.toLowerCase());
    }
  });
});

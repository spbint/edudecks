import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Capture Learning Evidence containment", () => {
  const contract = source(
    "lib/clean/educationalIntelligence/capture/capturedLearningEvidence.ts",
  );
  const timeline = source(
    "lib/clean/educationalIntelligence/capture/learningEvidenceTimeline.ts",
  );
  const preview = source(
    "app/components/clean/assessment-starting-point/CaptureLearningEvidencePreview.tsx",
  );
  const resultContract = source(
    "lib/clean/educationalIntelligence/learningEvidenceResult.ts",
  );
  const release = source("lib/clean/assessments/mathsStartingPointRelease.ts");

  it("does not modify or depend on the canonical LearningEvidenceResultV1 contract", () => {
    expect(contract).toContain('import type { LearningEvidenceResultV1 }');
    expect(timeline).toContain('import type { LearningEvidenceResultV1 }');
    expect(resultContract).not.toContain("CapturedLearningEvidenceV1");
  });

  it("contains no AI or Supabase client dependency in the canonical projection", () => {
    expect(`${contract}\n${timeline}`).not.toMatch(
      /openai|anthropic|embedding|large language model|from\(["']learning_evidence_artifact_links/i,
    );
    expect(`${contract}\n${timeline}`).not.toMatch(/supabaseClient|createClient|\.rpc\(/);
  });

  it("keeps the lab interaction fixture-only and out of mobile Capture", () => {
    expect(preview).toContain("fixture-only linking");
    expect(preview).not.toMatch(/fetch\(|supabase\.|\.rpc\(/);
    expect(preview).toContain("No developmental judgement");
  });

  it("keeps every Starting Point release gate off", () => {
    for (const gate of [
      "customerVisible",
      "customerNavigationEnabled",
      "persistenceEnabled",
      "evidenceWriteEnabled",
      "pathwayMutationEnabled",
      "hostedAcceptanceApproved",
      "mobileAcceptanceApproved",
      "freshRecheckFormsApproved",
    ]) {
      expect(release).toMatch(new RegExp(`${gate}: false`));
    }
  });
});

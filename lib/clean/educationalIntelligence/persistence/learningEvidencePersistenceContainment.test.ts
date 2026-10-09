import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Learning Evidence persistence containment", () => {
  it("keeps all eight release gates off", () => {
    expect(MATHS_STARTING_POINT_RELEASE).toMatchObject({
      customerVisible: false,
      customerNavigationEnabled: false,
      persistenceEnabled: false,
      evidenceWriteEnabled: false,
      pathwayMutationEnabled: false,
      hostedAcceptanceApproved: false,
      mobileAcceptanceApproved: false,
      freshRecheckFormsApproved: false,
    });
  });

  it("keeps the real customer runner at zero database writes", () => {
    const runner = source(
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    );
    expect(runner).toContain("MATHS_STARTING_POINT_RELEASE.persistenceEnabled");
    expect(runner).not.toContain("saveNumberOperationsBaseline");
    expect(runner).not.toContain("saveCanonicalResults");
    expect(runner).not.toMatch(/supabase\.(from|rpc)/);
    expect(runner).toContain(
      "staffPersistenceSmokeEnabled && familyId && learnerId",
    );
  });

  it("keeps canonical persistence server-only behind the internal assessment-lab route", () => {
    const repository = source(
      "lib/clean/educationalIntelligence/persistence/supabaseLearningEvidenceRepository.server.ts",
    );
    const preview = source(
      "app/components/clean/assessment-starting-point/LearningEvidenceResultsPreview.tsx",
    );
    const route = source(
      "app/api/internal/assessment-lab/learning-evidence/route.ts",
    );
    expect(repository).toContain('import "server-only"');
    expect(preview).not.toMatch(/fetch\(|supabase\.|\.rpc\(/);
    expect(route).toContain("requireStaffApiAccess");
    expect(route).toContain("parseStaffLearningEvidenceSaveRequest");
    expect(route).toContain("saveTrustedStaffLearningEvidence");
  });
});

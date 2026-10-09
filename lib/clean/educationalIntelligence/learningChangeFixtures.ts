import {
  getMathematicsLearningProfileEvidenceFixtures,
} from "./mathematicsLearningProfileFixtures";
import { presentLearningChange, type LearningChangePresentationV1 } from "./learningChangePresentation";
import {
  presentMathematicsLearningProfile,
  type MathematicsLearningProfilePresentationV1,
} from "./mathematicsLearningProfilePresentation";
import type { LearningEvidenceResultV1 } from "./learningEvidenceResult";
import { projectNumberOperationsLearningChange } from "./numberOperationsLearningChange";
import { projectNumberOperationsLearningProfile } from "./numberOperationsLearningProfile";

export type LearningChangePresentationFixture = {
  id: "mixed-recheck" | "focused-recheck" | "practical-resolved";
  label: string;
  presentation: LearningChangePresentationV1;
  previousProfile: MathematicsLearningProfilePresentationV1;
  currentProfile: MathematicsLearningProfilePresentationV1;
};

function practicalResolutionResults(
  previous: LearningEvidenceResultV1[],
): LearningEvidenceResultV1[] {
  return previous.map((result) => {
    const current = structuredClone(result);
    current.id = current.id.replace("fixture-mixed-initial", "fixture-practical-recheck");
    current.assessment.attemptId = "fixture-practical-recheck";
    current.assessment.attemptKind = "recheck";
    current.createdAt = "2026-11-20T03:00:00.000Z";
    current.evaluatedAt = "2026-11-20T03:00:00.000Z";
    current.provenance.evaluatedAt = current.evaluatedAt;
    current.evidence.sources = current.evidence.sources.map((source) => ({
      ...source,
      sourceId: current.assessment.attemptId,
    }));
    if (current.construct.continuumId === "understanding-money") {
      current.interpretation.developmentalStatus = "developing";
      current.evidence.sufficiency = { state: "sufficient", reasonCodes: [] };
      current.evidence.practicalConfirmation = {
        state: "confirmed",
        evidenceReference: "fixture-practical-observation",
      };
      current.evidence.limitations = [];
      current.provenance.evidenceCeiling = "provisional";
    }
    return current;
  });
}

export function getLearningChangePresentationFixtures(): LearningChangePresentationFixture[] {
  const evidence = getMathematicsLearningProfileEvidenceFixtures();
  const mixed = evidence.find((fixture) => fixture.id === "mixed");
  const focused = evidence.find((fixture) => fixture.id === "focused");
  const recheck = evidence.find((fixture) => fixture.id === "recheck");
  if (!mixed || !focused || !recheck) return [];

  const fixture = (
    id: LearningChangePresentationFixture["id"],
    label: string,
    previousResults: LearningEvidenceResultV1[],
    currentResults: LearningEvidenceResultV1[],
  ): LearningChangePresentationFixture => {
    const comparison = projectNumberOperationsLearningChange({
        previousResults,
        currentResults,
      });
    return {
      id,
      label,
      presentation: presentLearningChange({
        comparison,
        learnerDisplayName: "Sample learner",
      }),
      previousProfile: presentMathematicsLearningProfile({
        profile: projectNumberOperationsLearningProfile(previousResults),
        learnerDisplayName: "Sample learner",
      }),
      currentProfile: presentMathematicsLearningProfile({
        profile: projectNumberOperationsLearningProfile(currentResults),
        learnerDisplayName: "Sample learner",
      }),
    };
  };

  const practicalResults = practicalResolutionResults(mixed.results);
  return [
    fixture(
      "mixed-recheck",
      "Mixed original to recheck",
      mixed.results,
      recheck.results,
    ),
    fixture(
      "focused-recheck",
      "Unknown evidence to interpreted recheck",
      focused.results,
      recheck.results,
    ),
    fixture(
      "practical-resolved",
      "Practical confirmation resolved",
      mixed.results,
      practicalResults,
    ),
  ];
}

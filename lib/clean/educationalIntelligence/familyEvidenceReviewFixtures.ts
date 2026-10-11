import { buildNumberOperationsPathwaysHandoff } from "@/lib/clean/assessments/placement/numberOperationsPathwaysHandoff";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import { getCaptureLearningEvidenceFixtures } from "./capture/captureLearningEvidenceFixtures";
import type { CapturedLearningEvidenceV1 } from "./capture/capturedLearningEvidence";
import { projectLearningEvidenceTimeline } from "./capture/learningEvidenceTimeline";
import { presentFamilyEvidenceReview, type FamilyEvidenceReviewPresentationV1 } from "./familyEvidenceReviewPresentation";
import { presentLearningChange } from "./learningChangePresentation";
import type { LearningEvidenceResultV1 } from "./learningEvidenceResult";
import { getMathematicsLearningProfileEvidenceFixtures } from "./mathematicsLearningProfileFixtures";
import { presentMathematicsLearningProfile } from "./mathematicsLearningProfilePresentation";
import { projectNumberOperationsLearningChange } from "./numberOperationsLearningChange";
import { projectNumberOperationsLearningProfile } from "./numberOperationsLearningProfile";

const REVIEW_HANDOFF_TARGETS: Record<NumberOperationsSubElementKey, number> = {
  "number-place-value": 10,
  "counting-processes": 6,
  "additive-strategies": 8,
  "multiplicative-strategies": 8,
  "understanding-money": 7,
};

function withReviewHandoffs(results: readonly LearningEvidenceResultV1[]) {
  return results.map((result) => {
    if (!result.recommendation) return result;
    const continuumId = result.construct.continuumId as NumberOperationsSubElementKey;
    const handoff = buildNumberOperationsPathwaysHandoff({
      subElementKey: continuumId,
      targetP: REVIEW_HANDOFF_TARGETS[continuumId],
      learnerId: result.learnerId,
    });
    return {
      ...result,
      recommendation: {
        ...result.recommendation,
        handoffTarget: {
          ...result.recommendation.handoffTarget,
          label: handoff.stepTitle
            ? `Open ${handoff.stepTitle} in My Pathways`
            : `Open ${handoff.strandLabel} in My Pathways`,
          href: handoff.href,
        },
      },
    };
  });
}

export type FamilyEvidenceReviewFixture = {
  id:
    | "structured-and-captured"
    | "assessment-only"
    | "capture-with-insufficient-assessment"
    | "practical-confirmation"
    | "recheck-with-capture-between"
    | "focused-unknown"
    | "unreviewed-capture";
  label: string;
  description: string;
  presentation: FamilyEvidenceReviewPresentationV1;
};

export function getFamilyEvidenceReviewFixtures(): FamilyEvidenceReviewFixture[] {
  const profileFixtures = getMathematicsLearningProfileEvidenceFixtures();
  const captureFixture = getCaptureLearningEvidenceFixtures();
  const mixed = profileFixtures.find((fixture) => fixture.id === "mixed")!;
  const focused = profileFixtures.find((fixture) => fixture.id === "focused")!;
  const recheck = profileFixtures.find((fixture) => fixture.id === "recheck")!;

  const build = (input: {
    id: FamilyEvidenceReviewFixture["id"];
    label: string;
    description: string;
    currentResults: LearningEvidenceResultV1[] | null;
    previousResults?: LearningEvidenceResultV1[];
    capturedEvidence: CapturedLearningEvidenceV1[];
  }): FamilyEvidenceReviewFixture => {
    const previousResults = withReviewHandoffs(input.previousResults ?? []);
    const currentResults = input.currentResults
      ? withReviewHandoffs(input.currentResults)
      : null;
    const assessmentResults = [...previousResults, ...(currentResults ?? [])];
    const currentProfile = currentResults
      ? presentMathematicsLearningProfile({
          profile: projectNumberOperationsLearningProfile(currentResults),
          learnerDisplayName: "Sample learner",
        })
      : null;
    const comparison = previousResults.length && currentResults
      ? presentLearningChange({
          comparison: projectNumberOperationsLearningChange({
            previousResults,
            currentResults,
          }),
          learnerDisplayName: "Sample learner",
        })
      : null;
    return {
      id: input.id,
      label: input.label,
      description: input.description,
      presentation: presentFamilyEvidenceReview({
        learnerDisplayName: "Sample learner",
        currentProfile,
        comparison,
        timeline: projectLearningEvidenceTimeline({
          learnerId: captureFixture.learnerId,
          assessmentResults,
          capturedEvidence: input.capturedEvidence,
        }),
        captureLabelsBySourceId: captureFixture.labelsByEvidenceId,
      }),
    };
  };

  const captures = captureFixture.capturedEvidence.filter(
    (evidence) => evidence.constructLinks.length > 0,
  );
  const unreviewedCaptures = captures.map((evidence) => ({
    ...structuredClone(evidence),
    reviewState: "unreviewed" as const,
    constructLinks: evidence.constructLinks.map((link) => ({
      ...link,
      reviewState: "unreviewed" as const,
      reviewedByActorId: null,
      reviewedAt: null,
    })),
  }));

  return [
    build({
      id: "structured-and-captured",
      label: "Strong structured evidence + captured evidence",
      description: "A current five-area assessment view with relevant family evidence.",
      currentResults: mixed.results,
      capturedEvidence: captures.slice(0, 2),
    }),
    build({
      id: "assessment-only",
      label: "Assessment evidence, no Capture evidence",
      description: "Structured assessment evidence without family-captured items.",
      currentResults: mixed.results,
      capturedEvidence: [],
    }),
    build({
      id: "capture-with-insufficient-assessment",
      label: "Capture evidence + insufficient assessment evidence",
      description: "Authentic evidence exists while the structured judgement remains open.",
      currentResults: focused.results,
      capturedEvidence: captures,
    }),
    build({
      id: "practical-confirmation",
      label: "Practical confirmation required",
      description: "The assessment explicitly leaves a practical evidence requirement open.",
      currentResults: mixed.results,
      capturedEvidence: captures.filter(
        (evidence) => evidence.sourceType === "practical-observation",
      ),
    }),
    build({
      id: "recheck-with-capture-between",
      label: "Original + recheck with Capture between",
      description: "A deterministic assessment comparison with authentic evidence between checks.",
      previousResults: mixed.results,
      currentResults: recheck.results,
      capturedEvidence: captures,
    }),
    build({
      id: "focused-unknown",
      label: "Focused assessment with unknown areas",
      description: "Only one area was assessed; the other areas remain explicitly unknown.",
      currentResults: focused.results,
      capturedEvidence: [],
    }),
    build({
      id: "unreviewed-capture",
      label: "Unreviewed Capture evidence",
      description: "Captured evidence is visible without being treated as reviewed or mastered.",
      currentResults: mixed.results,
      capturedEvidence: unreviewedCaptures,
    }),
  ];
}

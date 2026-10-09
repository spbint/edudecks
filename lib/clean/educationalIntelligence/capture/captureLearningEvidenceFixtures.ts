import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { getMathematicsLearningProfileEvidenceFixtures } from "../mathematicsLearningProfileFixtures";
import type { LearningEvidenceResultV1 } from "../learningEvidenceResult";
import {
  adaptCleanCaptureToLearningEvidence,
  constructReferenceFromLearningEvidenceResult,
  linkCapturedEvidenceToConstruct,
  type CapturedLearningEvidenceSourceType,
} from "./capturedLearningEvidence";

const FAMILY_ID = "fixture-family-capture-ei";
const ACTOR_ID = "fixture-human-reviewer";

function captureEntry(input: {
  id: string;
  learnerId: string;
  observedOn: string;
  title: string;
  attachmentUrls?: string[];
  includeInPortfolio?: boolean;
}): CleanEvidenceEntry {
  return {
    id: input.id,
    familyId: FAMILY_ID,
    learnerId: input.learnerId,
    participantLearnerIds: [input.learnerId],
    participantLearnerCount: 1,
    programId: null,
    calendarItemId: null,
    observedOn: input.observedOn,
    title: input.title,
    whatHappened: `${input.title} (synthetic staff fixture).`,
    reflection: null,
    learningArea: "Mathematics",
    curriculumNodeIds: [],
    attachmentUrls: input.attachmentUrls ?? [],
    imageUrl: null,
    captureSource: "my_capture",
    includeInPortfolio: input.includeInPortfolio ?? false,
    includeInReport: false,
    createdByUserId: ACTOR_ID,
    createdAt: `${input.observedOn}T02:00:00.000Z`,
    updatedAt: `${input.observedOn}T02:00:00.000Z`,
  };
}

function resultFor(
  results: LearningEvidenceResultV1[],
  continuumId: string,
) {
  const result = results.find(
    (candidate) => candidate.construct.continuumId === continuumId,
  );
  if (!result) throw new Error(`Missing fixture result for ${continuumId}.`);
  return result;
}

export function getCaptureLearningEvidenceFixtures() {
  const profileFixtures = getMathematicsLearningProfileEvidenceFixtures();
  const initial = profileFixtures.find((fixture) => fixture.id === "mixed");
  const recheck = profileFixtures.find((fixture) => fixture.id === "recheck");
  if (!initial || !recheck) {
    throw new Error("Mathematics Learning Profile fixtures are unavailable.");
  }
  const learnerId = initial.results[0]?.learnerId ?? "fixture-learner";
  const choices = initial.results.map((result) =>
    constructReferenceFromLearningEvidenceResult(result),
  );
  const createLinked = (input: {
    id: string;
    date: string;
    label: string;
    sourceType: CapturedLearningEvidenceSourceType;
    continuumIds: string[];
    attachmentUrls?: string[];
  }) => {
    let evidence = adaptCleanCaptureToLearningEvidence(
      captureEntry({
        id: input.id,
        learnerId,
        observedOn: input.date,
        title: input.label,
        attachmentUrls: input.attachmentUrls,
      }),
      { sourceType: input.sourceType },
    );
    for (const continuumId of input.continuumIds) {
      evidence = linkCapturedEvidenceToConstruct({
        evidence,
        construct: constructReferenceFromLearningEvidenceResult(
          resultFor(initial.results, continuumId),
        ),
        actorId: ACTOR_ID,
        assignedAt: `${input.date}T03:00:00.000Z`,
        familyId: FAMILY_ID,
        learnerId,
        reviewState: "confirmed-relevant",
      });
    }
    return evidence;
  };

  const evidence = [
    createLinked({
      id: "fixture-capture-place-value-photo",
      date: "2026-10-19",
      label: "Base-ten regrouping photo",
      sourceType: "captured-photo",
      continuumIds: ["number-place-value"],
      attachmentUrls: ["family/fixture/base-ten-photo.jpg"],
    }),
    createLinked({
      id: "fixture-capture-additive-work-sample",
      date: "2026-10-23",
      label: "Addition strategy work sample",
      sourceType: "work-sample",
      continuumIds: ["additive-strategies", "counting-processes"],
      attachmentUrls: ["family/fixture/addition-work-sample.pdf"],
    }),
    createLinked({
      id: "fixture-capture-parent-observation",
      date: "2026-10-27",
      label: "Parent observation during cooking",
      sourceType: "parent-observation",
      continuumIds: ["additive-strategies"],
    }),
    createLinked({
      id: "fixture-capture-practical-observation",
      date: "2026-11-01",
      label: "Practical money observation",
      sourceType: "practical-observation",
      continuumIds: ["understanding-money"],
    }),
    adaptCleanCaptureToLearningEvidence(
      captureEntry({
        id: "fixture-capture-unlinked-note",
        learnerId,
        observedOn: "2026-11-03",
        title: "Unlinked learning note",
      }),
      { sourceType: "note" },
    ),
  ];

  return {
    familyId: FAMILY_ID,
    learnerId,
    learnerLabel: "Sample learner",
    actorId: ACTOR_ID,
    assessmentResults: [...initial.results, ...recheck.results],
    constructChoices: choices,
    capturedEvidence: evidence,
    labelsByEvidenceId: Object.fromEntries(
      evidence.map((item) => [
        item.evidenceId,
        item.evidenceId === "fixture-capture-unlinked-note"
          ? "Unlinked learning note"
          : item.evidenceId
              .replace("fixture-capture-", "")
              .replaceAll("-", " "),
      ]),
    ),
  };
}

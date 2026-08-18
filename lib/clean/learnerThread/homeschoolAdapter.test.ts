import { describe, expect, it } from "vitest";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { Learner } from "@/lib/clean/learners/types";
import {
  buildHomeschoolLearnerThread,
  type BuildHomeschoolLearnerThreadInput,
} from "@/lib/clean/learnerThread/homeschoolAdapter";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";

const FAMILY_ID = "family-1";
const LEARNER_ID = "learner-1";
const USER_ID = "user-1";
const PATHWAY_STEP_ID = "mathematics:number-and-place-value:lower-primary:count-in-groups";
const FRESHNESS_POLICY = {
  id: "homeschool-thread-fixture",
  version: "1",
  staleAfterDays: 30,
} as const;

const PATHWAY_NODE_IDS = encodePathwayContextNodeIds(
  [],
  buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey: "mathematics",
    subjectLabel: "Mathematics",
    pathwayKey: "number-and-place-value",
    pathwayLabel: "Number and place value",
    stageKey: "lower-primary",
    stageLabel: "Lower Primary",
    pathwayStepId: PATHWAY_STEP_ID,
    stepKey: "count-in-groups",
    stepNumber: "4",
    stepTitle: "Count in equal groups",
  }),
);

function learner(overrides: Partial<Learner> = {}): Learner {
  return {
    id: LEARNER_ID,
    familyId: FAMILY_ID,
    firstName: "Alex",
    preferredName: null,
    surname: null,
    yearLevel: "2",
    notes: null,
    createdByUserId: USER_ID,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...overrides,
  };
}

function program(overrides: Partial<CleanProgram> = {}): CleanProgram {
  return {
    id: "program-1",
    familyId: FAMILY_ID,
    learnerId: LEARNER_ID,
    title: "Number program",
    description: null,
    learningArea: "Mathematics",
    curriculumNodeIds: PATHWAY_NODE_IDS,
    status: "active",
    createdByUserId: USER_ID,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...overrides,
  };
}

function segment(overrides: Partial<CleanProgramSegment> = {}): CleanProgramSegment {
  return {
    id: "segment-1",
    familyId: FAMILY_ID,
    programId: "program-1",
    learnerId: LEARNER_ID,
    title: "Equal groups focus",
    notes: null,
    segmentOrder: 1,
    startsOn: "2026-08-01",
    endsOn: "2026-08-14",
    createdByUserId: USER_ID,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...overrides,
  };
}

function calendarItem(overrides: Partial<CleanCalendarItem> = {}): CleanCalendarItem {
  return {
    id: "calendar-1",
    familyId: FAMILY_ID,
    learnerId: LEARNER_ID,
    programId: "program-1",
    programSegmentId: "segment-1",
    title: "Equal groups activity",
    description: null,
    startsAt: "10:00",
    endsAt: "10:30",
    plannedDate: "2026-08-01",
    learningArea: "Mathematics",
    sessionLabel: null,
    sourceType: "manual",
    sourceTemplateBlockId: null,
    sourceProgramSegmentId: null,
    generationRunId: null,
    isHighlighted: false,
    marketplaceResourceId: null,
    completedAt: null,
    createdByUserId: USER_ID,
    createdAt: "2026-07-31T09:00:00.000Z",
    updatedAt: "2026-07-31T09:00:00.000Z",
    ...overrides,
  };
}

function evidenceEntry(overrides: Partial<CleanEvidenceEntry> = {}): CleanEvidenceEntry {
  return {
    id: "evidence-1",
    familyId: FAMILY_ID,
    learnerId: LEARNER_ID,
    programId: "program-1",
    calendarItemId: "calendar-1",
    observedOn: "2026-08-01",
    title: "Equal groups observation",
    whatHappened: "Alex arranged counters into equal groups.",
    reflection: null,
    learningArea: "Mathematics",
    curriculumNodeIds: PATHWAY_NODE_IDS,
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: true,
    includeInReport: true,
    createdByUserId: USER_ID,
    createdAt: "2026-08-01T11:00:00.000Z",
    updatedAt: "2026-08-01T11:00:00.000Z",
    ...overrides,
  };
}

function assessmentStatus(
  overrides: Partial<CleanAssessmentSkillStatus> = {},
): CleanAssessmentSkillStatus {
  return {
    id: "status-1",
    familyId: FAMILY_ID,
    learnerId: LEARNER_ID,
    subjectKey: "mathematics",
    skillKey: PATHWAY_STEP_ID,
    stageKey: "lower-primary",
    status: "Developing",
    note: null,
    createdByUserId: USER_ID,
    createdAt: "2026-08-02T09:00:00.000Z",
    updatedAt: "2026-08-02T09:00:00.000Z",
    pathwayStepId: PATHWAY_STEP_ID,
    strandKey: "number-and-place-value",
    stepKey: "count-in-groups",
    ...overrides,
  };
}

function assessmentAttempt(
  overrides: Partial<CleanAssessmentAttempt> = {},
): CleanAssessmentAttempt {
  return {
    id: "attempt-1",
    familyId: FAMILY_ID,
    learnerId: LEARNER_ID,
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    pathwayStepId: PATHWAY_STEP_ID,
    stepKey: "count-in-groups",
    progressionBandKey: null,
    itemBankKey: "number-check",
    mode: "mini_check",
    sourceRoute: "/my-assessments",
    status: "completed",
    itemCount: 4,
    attemptedCount: 4,
    autoCorrectCount: 3,
    autoIncorrectCount: 1,
    reviewNeededCount: 0,
    summarySnapshot: {},
    startedAt: "2026-08-03T09:00:00.000Z",
    completedAt: "2026-08-03T09:10:00.000Z",
    createdByUserId: USER_ID,
    createdAt: "2026-08-03T09:00:00.000Z",
    updatedAt: "2026-08-03T09:10:00.000Z",
    ...overrides,
  };
}

function buildThread(overrides: Partial<BuildHomeschoolLearnerThreadInput> = {}) {
  return buildHomeschoolLearnerThread({
    learner: learner(),
    programs: [],
    programSegments: [],
    calendarItems: [],
    evidenceEntries: [],
    assessmentSkillStatuses: [],
    assessmentAttempts: [],
    asOf: "2026-08-18T00:00:00.000Z",
    freshnessPolicy: FRESHNESS_POLICY,
    ...overrides,
  });
}

describe("buildHomeschoolLearnerThread", () => {
  it("suggests capturing evidence when a learner plan has no evidence", () => {
    const thread = buildThread({
      programs: [program()],
      programSegments: [segment()],
      calendarItems: [calendarItem()],
    });
    const planFact = thread.facts.find((fact) => fact.kind === "plan_scheduled");

    expect(planFact?.explicitValue).toMatchObject({
      state: "planned",
      value: "2026-08-01",
    });
    expect(planFact?.planActionReferences.map((item) => item.type)).toEqual([
      "calendar_item",
      "program",
      "program_segment",
    ]);
    expect(planFact?.capabilityReferences).toContainEqual(
      expect.objectContaining({ type: "pathway_step", id: PATHWAY_STEP_ID }),
    );
    expect(thread.nextStep).toMatchObject({
      kind: "capture_evidence",
      confidence: { dataSufficiency: "incomplete" },
      rule: {
        identifier: "learner-thread.next-step.capture-evidence-for-plan",
        version: "1.0.0",
      },
    });
  });

  it("flags that a completed plan without evidence does not establish learning", () => {
    const thread = buildThread({
      programs: [program()],
      calendarItems: [
        calendarItem({
          completedAt: "2026-08-01T10:30:00.000Z",
          updatedAt: "2026-08-01T10:30:00.000Z",
        }),
      ],
    });

    expect(thread.facts.some((fact) => fact.kind === "plan_completed")).toBe(true);
    expect(thread.nextStep?.kind).toBe("review_completion_without_evidence");
    expect(thread.nextStep?.reason).toContain("completion alone does not establish learning");
    expect(thread.derivedClaims).toHaveLength(0);
  });

  it("keeps calendar-linked evidence connected to the exact plan", () => {
    const thread = buildThread({
      programs: [program()],
      calendarItems: [calendarItem()],
      evidenceEntries: [evidenceEntry()],
    });
    const planFact = thread.facts.find((fact) => fact.kind === "plan_scheduled");
    const evidenceFact = thread.facts.find((fact) => fact.kind === "evidence_recorded");

    expect(planFact?.evidenceReferences).toContainEqual(
      expect.objectContaining({ type: "evidence_entry", id: "evidence-1" }),
    );
    expect(evidenceFact?.planActionReferences).toContainEqual(
      expect.objectContaining({ type: "calendar_item", id: "calendar-1" }),
    );
    expect(evidenceFact?.provenance.sourceRecord).toEqual(
      expect.objectContaining({ type: "evidence_entry", id: "evidence-1" }),
    );
  });

  it("surfaces the latest explicitly recorded progress judgement", () => {
    const thread = buildThread({
      evidenceEntries: [
        evidenceEntry({
          calendarItemId: null,
          reflection: "Progress level: Developing\nParent note: Keep practising.",
        }),
      ],
    });
    const progressFact = thread.facts.find(
      (fact) => fact.kind === "progress_judgement_recorded",
    );
    const claim = thread.derivedClaims.find(
      (item) => item.kind === "latest_explicit_progress_judgement",
    );

    expect(progressFact?.explicitValue.state).toBe("Developing");
    expect(claim?.statement).toBe("Latest explicit judgement: Developing.");
    expect(claim?.confidence.dataSufficiency).toBe("sufficient");
    expect(thread.nextStep?.kind).toBe("schedule_follow_up_observation");
  });

  it("surfaces later linked evidence only as possible verification", () => {
    const thread = buildThread({
      programs: [program()],
      calendarItems: [
        calendarItem({ completedAt: "2026-08-01T10:30:00.000Z" }),
      ],
      evidenceEntries: [evidenceEntry({ observedOn: "2026-08-02" })],
    });
    const claim = thread.derivedClaims.find(
      (item) => item.kind === "possible_verification_evidence",
    );

    expect(claim).toMatchObject({
      statement: "Evidence exists after the planned action.",
      confidence: { dataSufficiency: "limited" },
      rule: {
        identifier: "learner-thread.possible-verification-evidence-after-action",
        version: "1.0.0",
      },
    });
    expect(claim?.basisReferences.map((item) => item.type)).toEqual([
      "calendar_item",
      "evidence_entry",
    ]);
    expect(thread.nextStep?.kind).toBe("review_possible_verification_evidence");
  });

  it("marks old evidence stale using the supplied freshness policy", () => {
    const thread = buildThread({
      evidenceEntries: [
        evidenceEntry({
          calendarItemId: null,
          observedOn: "2026-06-01",
          createdAt: "2026-06-01T10:00:00.000Z",
        }),
      ],
      asOf: "2026-08-18T00:00:00.000Z",
      freshnessPolicy: {
        id: "fixture-60-day-policy",
        version: "2",
        staleAfterDays: 60,
      },
    });
    const evidenceFact = thread.facts.find((fact) => fact.kind === "evidence_recorded");

    expect(evidenceFact?.freshness).toMatchObject({
      status: "stale",
      ageDays: 78,
      policy: { id: "fixture-60-day-policy", version: "2", staleAfterDays: 60 },
    });
  });

  it("reports incomplete support when evidence is absent", () => {
    const thread = buildThread({ calendarItems: [calendarItem()] });

    expect(thread.nextStep?.confidence).toEqual({
      dataSufficiency: "incomplete",
      reason: "The plan is explicit, while linked evidence is absent from the supplied records.",
    });
  });

  it("does not assign a family-wide calendar item to every learner", () => {
    const thread = buildThread({
      calendarItems: [calendarItem({ learnerId: null })],
    });

    expect(thread.facts).toHaveLength(0);
    expect(thread.nextStep).toBeNull();
  });

  it("retains the source reference for a marketplace-linked calendar item", () => {
    const thread = buildThread({
      calendarItems: [
        calendarItem({ marketplaceResourceId: "marketplace-resource-1" }),
      ],
    });
    const planFact = thread.facts.find((fact) => fact.kind === "plan_scheduled");

    expect(planFact?.provenance.sourceReferences).toContainEqual({
      type: "marketplace_resource",
      id: "marketplace-resource-1",
    });
    expect(planFact?.provenance.sourceTypes).toContain("marketplace_derived");
  });

  it("keeps direct facts and derived claims structurally distinct", () => {
    const thread = buildThread({
      evidenceEntries: [
        evidenceEntry({
          calendarItemId: null,
          reflection: "Progress level: Secure",
        }),
      ],
    });

    expect(thread.facts.every((fact) => fact.recordType === "fact")).toBe(true);
    expect(
      thread.derivedClaims.every((claim) => claim.recordType === "derived_claim"),
    ).toBe(true);
    expect(thread.facts.some((fact) => fact.id === thread.derivedClaims[0]?.id)).toBe(
      false,
    );
  });

  it("does not infer mastery from calendar completion", () => {
    const thread = buildThread({
      calendarItems: [calendarItem({ completedAt: "2026-08-01T10:30:00.000Z" })],
    });

    expect(thread.derivedClaims).toHaveLength(0);
    expect(thread.facts.find((fact) => fact.kind === "plan_completed")?.explicitValue.state).toBe(
      "completed",
    );
    expect(thread.nextStep?.kind).toBe("review_completion_without_evidence");
  });

  it("does not infer causality or improvement from later evidence", () => {
    const thread = buildThread({
      calendarItems: [calendarItem()],
      evidenceEntries: [evidenceEntry({ observedOn: "2026-08-02" })],
    });
    const claim = thread.derivedClaims.find(
      (item) => item.kind === "possible_verification_evidence",
    );

    expect(claim?.statement).toBe("Evidence exists after the planned action.");
    expect(claim?.statement.toLowerCase()).not.toContain("caused");
    expect(claim?.statement.toLowerCase()).not.toContain("improved");
    expect(claim?.confidence.reason).toContain("not whether learning changed or what caused it");
  });

  it("projects assessment status and result fields without treating them as confidence", () => {
    const thread = buildThread({
      assessmentSkillStatuses: [assessmentStatus()],
      assessmentAttempts: [
        assessmentAttempt({
          summarySnapshot: { parentJudgementPreview: "Consolidating" },
        }),
      ],
    });
    const statusFact = thread.facts.find(
      (fact) => fact.kind === "assessment_status_recorded",
    );
    const attemptFact = thread.facts.find(
      (fact) => fact.kind === "assessment_attempt_recorded",
    );

    expect(statusFact?.explicitValue.state).toBe("Developing");
    expect(statusFact?.confidence.dataSufficiency).toBe("sufficient");
    expect(statusFact?.provenance.sourceTypes).toEqual(["parent_entered"]);
    expect(attemptFact?.explicitValue).toMatchObject({
      state: "completed",
      value: 3,
      unit: "correct_responses",
      attributes: { itemCount: 4, autoIncorrectCount: 1 },
    });
    expect(attemptFact?.provenance.sourceTypes).toEqual(["assessment_derived"]);
    expect(
      thread.derivedClaims.find(
        (claim) => claim.kind === "latest_explicit_progress_judgement",
      )?.statement,
    ).toBe("Latest explicit judgement: Consolidating.");
  });

  it("does not parse narrative text to invent a progress judgement", () => {
    const thread = buildThread({
      evidenceEntries: [
        evidenceEntry({
          calendarItemId: null,
          curriculumNodeIds: [],
          whatHappened: "Progress level: Secure. The learner mastered this skill.",
          reflection: null,
        }),
      ],
    });

    expect(
      thread.facts.some((fact) => fact.kind === "progress_judgement_recorded"),
    ).toBe(false);
    expect(thread.derivedClaims).toHaveLength(0);
  });

  it("ignores records belonging to another learner or family", () => {
    const thread = buildThread({
      calendarItems: [
        calendarItem({ id: "other-learner", learnerId: "learner-2" }),
        calendarItem({ id: "other-family", familyId: "family-2" }),
      ],
      evidenceEntries: [
        evidenceEntry({ id: "other-evidence", learnerId: "learner-2" }),
      ],
      assessmentSkillStatuses: [
        assessmentStatus({ id: "other-status", familyId: "family-2" }),
      ],
      assessmentAttempts: [
        assessmentAttempt({ id: "other-attempt", learnerId: "learner-2" }),
      ],
    });

    expect(thread.facts).toHaveLength(0);
    expect(thread.tenant).toEqual({ type: "family", id: FAMILY_ID });
    expect(thread.learner).toMatchObject({ type: "learner", id: LEARNER_ID });
  });
});

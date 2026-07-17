import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildUnifiedCaptureEvidenceInput,
  normalizeUnifiedCaptureDate,
  saveUnifiedLearningCapture,
  type UnifiedCaptureDraft,
} from "@/lib/clean/evidence/unifiedCapture";
import { buildRecognizedProgressJudgementObservations } from "@/lib/clean/pathways/pathwayStepState";

function draft(overrides: Partial<UnifiedCaptureDraft> = {}): UnifiedCaptureDraft {
  return {
    familyId: "family-1",
    learnerId: "learner-1",
    activityDate: "2026-07-17T22:30:00.000+10:00",
    title: "Garden fractions",
    whatHappened: "Measured garden beds and compared halves and quarters.",
    learningArea: "Mathematics",
    subjectKey: "mathematics",
    strandKey: "fractions-decimals-percentages",
    stageKey: "lower-primary",
    pathwayStepId: "mathematics::fractions-decimals-percentages::lower-primary::compare-halves",
    stepKey: "compare-halves",
    stepTitle: "Compare halves and quarters",
    progressJudgement: "Goal achieved + extension",
    parentNote: "Needed one prompt, then explained independently.",
    learnerReflection: "I could see the same amount in two shapes.",
    sourceType: "my-capture",
    sourceId: "source-1",
    clientSubmissionId: "submission-1",
    programId: null,
    calendarItemId: null,
    curriculumNodeIds: ["mathematics"],
    includeInPortfolio: true,
    includeInReport: true,
    ...overrides,
  };
}

function entry(id: string, input = buildUnifiedCaptureEvidenceInput(draft())): CleanEvidenceEntry {
  return {
    id,
    familyId: "family-1",
    learnerId: input.learnerId,
    programId: input.programId ?? null,
    calendarItemId: input.calendarItemId ?? null,
    observedOn: input.observedOn,
    title: input.title ?? null,
    whatHappened: input.whatHappened,
    reflection: input.reflection ?? null,
    learningArea: input.learningArea ?? null,
    curriculumNodeIds: input.curriculumNodeIds ?? [],
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: input.includeInPortfolio ?? true,
    includeInReport: input.includeInReport ?? true,
    createdByUserId: "user-1",
    createdAt: "2026-07-17T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
  };
}

describe("unified learning capture", () => {
  it("normalises the date of learning without timezone shifting the day", () => {
    expect(normalizeUnifiedCaptureDate("2026-07-17T23:30:00.000-10:00")).toBe("2026-07-17");
  });

  it("builds one evidence shape for general, pathway, worksheet and calendar capture", () => {
    const base = buildUnifiedCaptureEvidenceInput(draft({ sourceType: "my-capture" }));
    const pathway = buildUnifiedCaptureEvidenceInput(draft({ sourceType: "my-pathways" }));
    const worksheet = buildUnifiedCaptureEvidenceInput(draft({ sourceType: "worksheet" }));
    const calendar = buildUnifiedCaptureEvidenceInput(
      draft({ sourceType: "calendar", calendarItemId: "calendar-1" }),
    );

    for (const input of [base, pathway, worksheet, calendar]) {
      expect(input.learnerId).toBe("learner-1");
      expect(input.observedOn).toBe("2026-07-17");
      expect(input.learningArea).toBe("Mathematics");
      expect(input.curriculumNodeIds).toContain("mathematics");
      expect(input.includeInPortfolio).toBe(true);
      expect(input.includeInReport).toBe(true);
      expect(input.reflection).toContain("Progress level: Goal achieved + extension");
      expect(input.reflection).toContain("Parent note:");
      expect(input.reflection).toContain("Learner reflection:");
    }

    expect(calendar.calendarItemId).toBe("calendar-1");
  });

  it("allows informal capture without pathway context or progress judgement", () => {
    const input = buildUnifiedCaptureEvidenceInput(
      draft({
        subjectKey: null,
        strandKey: null,
        pathwayStepId: null,
        stepKey: null,
        stepTitle: null,
        progressJudgement: null,
        curriculumNodeIds: [],
        sourceType: "manual",
      }),
    );

    expect(input.curriculumNodeIds).toEqual([]);
    expect(input.reflection).not.toContain("Progress level:");
  });

  it("keeps portfolio and report inclusion independent", () => {
    const portfolioOnly = buildUnifiedCaptureEvidenceInput(
      draft({ includeInPortfolio: true, includeInReport: false }),
    );
    const reportOnly = buildUnifiedCaptureEvidenceInput(
      draft({ includeInPortfolio: false, includeInReport: true }),
    );

    expect(portfolioOnly.includeInPortfolio).toBe(true);
    expect(portfolioOnly.includeInReport).toBe(false);
    expect(reportOnly.includeInPortfolio).toBe(false);
    expect(reportOnly.includeInReport).toBe(true);
  });

  it("rejects invalid family or learner scope safely", () => {
    expect(() => buildUnifiedCaptureEvidenceInput(draft({ familyId: "" }))).toThrow(
      "family workspace",
    );
    expect(() => buildUnifiedCaptureEvidenceInput(draft({ learnerId: "" }))).toThrow(
      "Choose the learner",
    );
  });

  it("uses one authoritative save operation and prevents double submission", async () => {
    let resolveCreate: ((value: CleanEvidenceEntry) => void) | null = null;
    const createEntry = vi.fn(async (_familyId: string, input) => {
      await new Promise<CleanEvidenceEntry>((resolve) => {
        resolveCreate = resolve;
      });
      return entry("entry-1", input);
    });

    const first = saveUnifiedLearningCapture(draft(), { createEntry });
    const second = saveUnifiedLearningCapture(draft(), { createEntry });
    resolveCreate?.(entry("entry-1"));

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(createEntry).toHaveBeenCalledTimes(1);
    expect(firstResult.entry.id).toBe("entry-1");
    expect(secondResult.entry.id).toBe("entry-1");
    expect(secondResult.duplicate).toBe(true);
  });

  it("keeps Stage 4D progress judgement recognition passing for captured evidence", () => {
    const input = buildUnifiedCaptureEvidenceInput(draft({ progressJudgement: "Consolidating" }));
    const observations = buildRecognizedProgressJudgementObservations({
      evidenceEntries: [entry("entry-1", input)],
      learnerId: "learner-1",
    });

    expect(observations).toHaveLength(1);
    expect(observations[0]?.judgement).toBe("Consolidating");
  });
});

describe("unified capture active entry points", () => {
  const captureSource = readFileSync(
    join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
    "utf8",
  );
  const worksheetSource = readFileSync(
    join(process.cwd(), "app/components/clean/pathways/WorksheetEvidenceCapture.tsx"),
    "utf8",
  );
  const pathwayActionSource = readFileSync(
    join(process.cwd(), "app/components/clean/CleanPathwayStepActionRow.tsx"),
    "utf8",
  );
  const assessmentsSource = readFileSync(
    join(process.cwd(), "app/components/clean/CleanAssessmentsWorkspace.tsx"),
    "utf8",
  );
  const pathwaysWorkspaceSource = readFileSync(
    join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
    "utf8",
  );

  it("routes My Capture and worksheet capture through the shared save operation", () => {
    expect(captureSource).toContain("saveUnifiedLearningCapture");
    expect(worksheetSource).toContain("saveUnifiedLearningCapture");
    expect(assessmentsSource).toContain("saveUnifiedLearningCapture");
    expect(worksheetSource).not.toContain("createCleanEvidenceEntry");
    expect(assessmentsSource).not.toContain("createCleanEvidenceEntry");
  });

  it("keeps pathway and worksheet contextual capture pointed at My Capture", () => {
    expect(pathwaysWorkspaceSource).toContain("/my-capture");
    expect(pathwayActionSource).toContain("captureHref");
    expect(pathwayActionSource).toContain("includeInPortfolio");
    expect(pathwayActionSource).toContain("includeInReport");
  });

  it("uses parent-facing language and hides technical capture terminology on active controls", () => {
    expect(captureSource).toContain("Record learning");
    expect(captureSource).toContain("Learning recorded");
    expect(captureSource).toContain("CANONICAL_LEARNING_AREAS");
    expect(captureSource).toContain("Secure");
    expect(captureSource).toContain("Parent note");
    expect(captureSource).toContain("Learner reflection");
    expect(captureSource).toContain("Add to Portfolio");
    expect(captureSource).toContain("Include in Reports");
    expect(captureSource).toContain("disabled={submitting");
    expect(worksheetSource).toContain("Record completed work");
    expect(pathwayActionSource).toContain("Mark complete");
    expect(pathwayActionSource).toContain("Add completed work");
    expect(worksheetSource).not.toContain("Stored in Supabase Storage");
    expect(captureSource).not.toContain(">Add evidence<");
    expect(captureSource).not.toContain("Add learning from life");
    expect(captureSource).not.toContain("Quick capture");
    expect(captureSource).not.toContain("Save evidence");
    expect(captureSource).not.toContain("Reflection, next step, or what stood out");
    expect(captureSource).not.toContain("Recent capture notes");
  });
});

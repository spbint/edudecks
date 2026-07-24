import { describe, expect, it } from "vitest";
import {
  shouldRefreshCleanEvidenceForLearner,
  sortEvidenceEntries,
} from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";

function evidence(overrides: Partial<CleanEvidenceEntry>): CleanEvidenceEntry {
  return {
    id: "evidence-default",
    familyId: "family-1",
    learnerId: "learner-1",
    programId: null,
    calendarItemId: null,
    observedOn: "2026-07-01",
    title: "Learning record",
    whatHappened: "Something useful happened.",
    reflection: null,
    learningArea: "Mathematics",
    curriculumNodeIds: [],
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: true,
    includeInReport: true,
    createdByUserId: "user-1",
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

describe("clean evidence ordering", () => {
  it("orders by observed date, then the newest created or updated timestamp, then id", () => {
    const entries = sortEvidenceEntries([
      evidence({ id: "older", observedOn: "2026-07-24", createdAt: "2026-07-24T09:00:00.000Z" }),
      evidence({ id: "newest", observedOn: "2026-07-24", createdAt: "2026-07-24T10:00:00.000Z" }),
      evidence({ id: "updated", observedOn: "2026-07-24", createdAt: "2026-07-24T08:00:00.000Z", updatedAt: "2026-07-24T11:00:00.000Z" }),
      evidence({ id: "future", observedOn: "2026-07-25", createdAt: "2026-07-25T07:00:00.000Z" }),
      evidence({ id: "id-b", observedOn: "2026-07-23", createdAt: null, updatedAt: null }),
      evidence({ id: "id-a", observedOn: "2026-07-23", createdAt: null, updatedAt: null }),
    ]);

    expect(entries.map((entry) => entry.id)).toEqual([
      "future",
      "updated",
      "newest",
      "older",
      "id-a",
      "id-b",
    ]);
  });

  it("only applies mutation notifications to the matching family and learner", () => {
    expect(
      shouldRefreshCleanEvidenceForLearner(
        { familyId: "family-1", learnerId: "learner-1" },
        "family-1",
        "learner-1",
      ),
    ).toBe(true);
    expect(
      shouldRefreshCleanEvidenceForLearner(
        { familyId: "family-1", learnerId: "learner-2" },
        "family-1",
        "learner-1",
      ),
    ).toBe(false);
    expect(
      shouldRefreshCleanEvidenceForLearner(
        { familyId: "family-2", learnerId: "learner-1" },
        "family-1",
        "learner-1",
      ),
    ).toBe(false);
  });
});

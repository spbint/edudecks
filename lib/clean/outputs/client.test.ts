import { describe, expect, it } from "vitest";

import { sortCleanReportExports } from "@/lib/clean/outputs/client";
import type { CleanReportExport } from "@/lib/clean/outputs/types";

const exportRecord = (
  id: string,
  createdAt: string | null,
): CleanReportExport => ({
  id,
  reportId: "report-1",
  familyId: "family-1",
  learnerId: "learner-1",
  exportFormat: "pdf",
  exportedByUserId: "user-1",
  createdAt,
});

describe("clean report export history", () => {
  it("orders the latest persisted export records first", () => {
    expect(
      sortCleanReportExports([
        exportRecord("older", "2026-01-01T10:00:00.000Z"),
        exportRecord("latest", "2026-02-01T10:00:00.000Z"),
        exportRecord("unknown", null),
      ]).map((entry) => entry.id),
    ).toEqual(["latest", "older", "unknown"]);
  });

  it("keeps a deterministic order when an export has no timestamp", () => {
    expect(
      sortCleanReportExports([exportRecord("b", null), exportRecord("a", null)]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["a", "b"]);
  });
});

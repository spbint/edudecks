import { describe, expect, it } from "vitest";
import {
  filterCleanAutomaticWeekSuggestions,
  hasCleanAppliedGenerationRun,
} from "./materialize";

describe("automatic usual-week materialisation guards", () => {
  it("does not fabricate past days when first materialising the current week", () => {
    expect(
      filterCleanAutomaticWeekSuggestions(
        [{ plannedDate: "2026-08-24" }, { plannedDate: "2026-08-27" }],
        { weekStartsOn: "2026-08-24", today: "2026-08-27" },
      ),
    ).toEqual([{ plannedDate: "2026-08-27" }]);
  });

  it("keeps all dates for an unmaterialised future week", () => {
    expect(
      filterCleanAutomaticWeekSuggestions(
        [{ plannedDate: "2026-08-31" }, { plannedDate: "2026-09-01" }],
        { weekStartsOn: "2026-08-31", today: "2026-08-27" },
      ),
    ).toHaveLength(2);
  });

  it("treats an applied generation run as an operational snapshot", () => {
    expect(
      hasCleanAppliedGenerationRun(
        [{ masterTemplateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30", status: "applied" }],
        { templateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30" },
      ),
    ).toBe(true);
    expect(
      hasCleanAppliedGenerationRun(
        [{ masterTemplateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30", status: "preview" }],
        { templateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30" },
      ),
    ).toBe(false);
  });
});

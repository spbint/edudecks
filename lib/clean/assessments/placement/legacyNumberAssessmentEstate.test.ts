import { describe, expect, it } from "vitest";
import { NUMBER_ASSESSMENT_BANKS } from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY } from "./numberOperationsItemRegistry";
import {
  LEGACY_NUMBER_ASSESSMENT_OVERLAY_V03,
  getLegacyNumberAssessmentOverlay,
  summarizeLegacyNumberAssessmentOverlay,
} from "./legacyNumberAssessmentEstate";

describe("legacy Number assessment estate reconciliation", () => {
  it("freezes the complete 16-bank / 192-item legacy estate", () => {
    expect(NUMBER_ASSESSMENT_BANKS).toHaveLength(16);
    expect(NUMBER_ASSESSMENT_BANKS.every((bank) => bank.items.length === 12)).toBe(true);

    const rows = getLegacyNumberAssessmentOverlay();
    expect(rows).toHaveLength(192);
    expect(new Set(rows.map((row) => row.itemId)).size).toBe(192);
  });

  it("reproduces the accepted v0.3 provisional overlay totals", () => {
    const summary = summarizeLegacyNumberAssessmentOverlay();

    expect(summary).toMatchObject(
      LEGACY_NUMBER_ASSESSMENT_OVERLAY_V03.expected,
    );
    expect(
      summary.disposition.keepCandidate +
        summary.disposition.rewrite +
        summary.disposition.holdBroaderMathematics,
    ).toBe(192);
    expect(
      summary.sourceFit.directFit +
        summary.sourceFit.partialFit +
        summary.sourceFit.heldBroaderMathematics,
    ).toBe(192);
  });

  it("keeps the five-continuum Number & Operations reuse candidate set at 78", () => {
    const summary = summarizeLegacyNumberAssessmentOverlay();

    expect(summary.numberOperationsReuseCandidates).toBe(78);
    expect(summary.continua).toEqual([
      { key: "number-place-value", count: 22, auditedAnchorReuse: 4 },
      { key: "counting-processes", count: 0, auditedAnchorReuse: 0 },
      { key: "additive-strategies", count: 15, auditedAnchorReuse: 1 },
      { key: "multiplicative-strategies", count: 23, auditedAnchorReuse: 4 },
      { key: "understanding-money", count: 18, auditedAnchorReuse: 2 },
    ]);
  });

  it("links every audited legacy reuse to a real legacy item and keeps Counting explicit as a gap", () => {
    const rows = getLegacyNumberAssessmentOverlay();
    const reused = rows.filter((row) => row.auditedAnchorReuse);

    expect(reused).toHaveLength(11);
    expect(reused.every((row) => row.disposition !== "hold-broader-mathematics")).toBe(true);
    expect(
      rows.filter((row) => row.numberOperationsContinuum === "counting-processes"),
    ).toHaveLength(0);
  });

  it("keeps the trusted placement estate separate from the legacy estate", () => {
    expect(NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY).toHaveLength(140);
    expect(
      new Set(NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map((entry) => entry.item.id))
        .size,
    ).toBe(140);
    expect(
      NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.every(
        (entry) => entry.item.status === "draft",
      ),
    ).toBe(true);
  });
});

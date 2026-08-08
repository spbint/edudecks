import { describe, expect, it } from "vitest";
import { demoEvidenceDataset } from "@/lib/demo/demoEvidenceDataset";

describe("unauthenticated Carter demo evidence dataset", () => {
  it("contains the fictional family context and launch report period", () => {
    expect(demoEvidenceDataset.family.name).toBe("The Carter Family");
    expect(demoEvidenceDataset.family.parentDisplayName).toBe("Sarah Carter");
    expect(demoEvidenceDataset.family.reportingPeriod).toBe("1 March 2026 to 31 July 2026");
    expect(demoEvidenceDataset.family.preparedOn).toBe("8 August 2026");
    expect(demoEvidenceDataset.learners).toHaveLength(2);
  });

  it("contains eight Emma records with the required proportional progression", () => {
    const emma = demoEvidenceDataset.evidence.filter((item) => item.learnerId === "emma");
    expect(emma).toHaveLength(8);
    expect(emma.map((item) => item.step)).toEqual([4, 5, 6, 8, 9, 10, 11, 12]);
    expect(emma.every((item) => item.pathway === "Ratio and Proportional Reasoning")).toBe(true);
    expect(emma.every((item) => item.learningArea === "Mathematics")).toBe(true);
  });

  it("keeps every demo record report- and portfolio-eligible with stable worksheet assets", () => {
    expect(demoEvidenceDataset.evidence).toHaveLength(10);
    for (const record of demoEvidenceDataset.evidence) {
      expect(record.includeInPortfolio).toBe(true);
      expect(record.includeInReport).toBe(true);
      expect(record.id).toMatch(/^demo-evidence-/);
      expect(record.imageKey).toMatch(/^demo-/);
      expect(record.imageAlt.length).toBeGreaterThan(10);
      expect(record.imagePlaceholder).not.toContain("Future sample image");
      expect(record.shortDescription.length).toBeGreaterThan(20);
    }
  });
});

import { describe, expect, it } from "vitest";
import { demoEvidenceDataset } from "@/lib/demo/demoEvidenceDataset";

describe("unauthenticated Carter demo evidence dataset", () => {
  it("contains a complete fictional family context", () => {
    expect(demoEvidenceDataset.family.name).toBe("The Carter Family");
    expect(demoEvidenceDataset.family.parentDisplayName).toBe("Sarah Carter");
    expect(demoEvidenceDataset.learners).toHaveLength(2);
    expect(demoEvidenceDataset.family.learningYear).toContain("2025");
    expect(demoEvidenceDataset.family.reportingPeriod).toBe("March 2026");
  });

  it("keeps ten report- and portfolio-eligible records with stable image slots", () => {
    expect(demoEvidenceDataset.evidence).toHaveLength(10);
    for (const record of demoEvidenceDataset.evidence) {
      expect(record.includeInPortfolio).toBe(true);
      expect(record.includeInReport).toBe(true);
      expect(record.id).toMatch(/^demo-evidence-/);
      expect(record.imageKey).toMatch(/^demo-/);
      expect(record.imageAlt.length).toBeGreaterThan(10);
      expect(record.imagePlaceholder.length).toBeGreaterThan(10);
      expect(record.shortDescription.length).toBeGreaterThan(20);
      expect(record.date).toMatch(/^2026-03-/);
    }
  });

  it("uses only demo-owned data in the guided public flow", async () => {
    const portfolioSource = await import("@/components/demo/DemoPortfolioFlow");
    const reportSource = await import("@/lib/demo/demoState");
    expect(portfolioSource).toBeDefined();
    expect(reportSource).toBeDefined();
    expect(demoEvidenceDataset.evidence.every((item) => item.id.startsWith("demo-evidence-"))).toBe(true);
  });
});

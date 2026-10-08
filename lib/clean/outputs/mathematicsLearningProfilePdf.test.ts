import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { getMathematicsLearningProfileFixtures } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfileFixtures";
import {
  buildMathematicsLearningProfilePdfFilename,
  buildMathematicsLearningProfilePdfPlan,
  generateMathematicsLearningProfilePdfBytes,
} from "./mathematicsLearningProfilePdf";

describe("Mathematics Learning Profile PDF", () => {
  const presentation = getMathematicsLearningProfileFixtures()[0]!.presentation;

  it("uses the same presentation model for a concise three-page plan", () => {
    const plan = buildMathematicsLearningProfilePdfPlan(presentation);
    expect(plan.pages).toHaveLength(3);
    expect(plan.pages.map((page) => page.heading)).toEqual([
      "Five-area overview",
      "Detailed learning profile",
      "Recommended next learning",
    ]);
    for (const page of plan.pages) {
      expect(page.cards).toHaveLength(5);
    }
    expect(plan.scopeStatement).toMatch(/not a complete assessment of all Mathematics/i);
    expect(JSON.stringify(plan)).not.toMatch(/fixture-item|fixture-construct|routing-only|\bP\d+\b/);
  });

  it("generates a valid persistence-free three-page PDF", async () => {
    const bytes = await generateMathematicsLearningProfilePdfBytes(presentation);
    expect(bytes.byteLength).toBeGreaterThan(2_000);
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(3);
  });

  it("builds a stable privacy-safe filename", () => {
    expect(
      buildMathematicsLearningProfilePdfFilename(
        "Sample Learner / Review",
        "2026-10-09T01:00:00.000Z",
      ),
    ).toBe("MyLearna-Mathematics-Learning-Profile-Sample-Learner-Review-2026-10-09.pdf");
  });
});

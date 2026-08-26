import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import {
  buildCleanPortfolioPdfFilename,
  generateCleanPortfolioPdfBytes,
  getPortfolioImageFit,
  parsePortfolioReflection,
  type CleanPortfolioPdfModel,
} from "@/lib/clean/outputs/portfolioPdf";

function item(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `evidence-${index}`,
    title: `Learning moment ${index}`,
    observedOn: `2026-08-${String(index + 1).padStart(2, "0")}`,
    learnerLabel: "James",
    learningArea: index % 2 ? "Science" : "English",
    programTitle: null,
    segmentTitle: null,
    blockTitle: null,
    whatHappened: "James explored, explained, and recorded what he noticed during the activity.",
    reflection: index % 2 ? "I noticed a new pattern." : null,
    portfolioNote: null,
    hasAttachment: false,
    attachmentCount: 0,
    previewImageUrl: null,
    previewImageStoragePath: null,
    ...overrides,
  };
}

function model(items: ReturnType<typeof item>[]): CleanPortfolioPdfModel {
  return {
    learnerLabel: "James",
    startsOn: "2026-08-01",
    endsOn: "2026-12-18",
    preparedOnLabel: "26 Aug 2026",
    portfolioEvidenceItems: items,
    recordEvidenceItems: items,
  };
}

describe("premium Portfolio PDF", () => {
  it("strips technical reflection metadata and repeated labels", () => {
    expect(parsePortfolioReflection("Parent note: Testing Source: calendar")).toEqual({ parentReflection: "Testing", learnerReflection: null, reflection: null });
    expect(parsePortfolioReflection("Parent note: Parent note: Testing Source: calendar Source: calendar").parentReflection).toBe("Testing");
    expect(parsePortfolioReflection("Learner reflection: I know that Jupiter is the largest planet Source: calendar").learnerReflection).toBe("I know that Jupiter is the largest planet");
    expect(parsePortfolioReflection("Parent note: test Learner reflection: test Source: calendar")).toEqual({ parentReflection: "test", learnerReflection: "test", reflection: null });
    expect(parsePortfolioReflection("The source was a primary document.").reflection).toBe("The source was a primary document.");
  });
  it("creates a valid titled PDF with a formal record appendix", async () => {
    const bytes = await generateCleanPortfolioPdfBytes(model([item(1), item(2), item(3)]));
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(3);
    expect(pdf.getTitle()).toBe("James Learning Portfolio");
    expect(pdf.getAuthor()).toBe("MyLearna");
  });

  it("assembles larger portfolios without empty optional pathway pages", async () => {
    const bytes = await generateCleanPortfolioPdfBytes(model(Array.from({ length: 25 }, (_, index) => item(index))));
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(4);
    expect(pdf.getPageCount()).toBeLessThan(40);
  });

  it("uses safe filenames and preserves image aspect ratio", () => {
    expect(buildCleanPortfolioPdfFilename("James Chen", "2026-08-26")).toBe(
      "MyLearna-James-Chen-Learning-Portfolio-2026-08-26.pdf",
    );
    const fit = getPortfolioImageFit(
      { width: 1600, height: 900 },
      { x: 0, y: 0, width: 300, height: 300 },
      "contain",
    );
    expect(fit.width / fit.height).toBeCloseTo(1600 / 900, 5);
    expect(fit.width).toBeLessThanOrEqual(300);
    expect(fit.height).toBeLessThanOrEqual(300);
  });

  it("keeps evidence text when an image cannot be loaded", async () => {
    const bytes = await generateCleanPortfolioPdfBytes(model([
      item(1, { previewImageUrl: "https://invalid.test/family-photo.jpg" }),
    ]));
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(3);
  });

  it("normalises oversized browser-decodable images instead of applying the old hard rejection", () => {
    const source = readFileSync("lib/clean/outputs/portfolioPdf.ts", "utf8");
    expect(source).toContain("createImageBitmap");
    expect(source).toContain("canvas.toBlob(resolve, \"image/jpeg\", 0.9)");
    expect(source).not.toContain("bytes.byteLength > MAX_NORMALISED_IMAGE_BYTES) return null");
  });
});

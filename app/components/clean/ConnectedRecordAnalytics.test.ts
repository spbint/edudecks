import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeProductAnalyticsProperties } from "@/lib/clean/analytics/productAnalytics";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const captureSource = readSource("app/components/clean/CleanCaptureWorkspace.tsx");
const quickCaptureSource = readSource("app/components/clean/CleanQuickCaptureWorkspace.tsx");
const quickCaptureHandoffSource = readSource("lib/clean/evidence/quickCaptureSuccess.ts");
const portfolioSource = readSource("app/components/clean/CleanPortfolioWorkspace.tsx");
const providerSource = readSource("app/components/clean/analytics/ProductAnalyticsProvider.tsx");

describe("connected-record analytics", () => {
  it("allows structural context while rejecting evidence and learner content", () => {
    const properties = sanitizeProductAnalyticsProperties({
      sourceSurface: "pathways",
      isEdit: false,
      attachmentCategory: "image",
      isJustCaptured: true,
      reportEntrySource: "portfolio",
      learnerName: "Private learner",
      email: "family@example.test",
      title: "Private evidence title",
      whatHappened: "Private evidence body",
      reflection: "Private reflection",
      filename: "private-photo.jpg",
      storagePath: "family/private",
      url: "https://private.example.test",
    });

    expect(properties).toMatchObject({
      sourceSurface: "pathways",
      isEdit: false,
      attachmentCategory: "image",
      isJustCaptured: true,
      reportEntrySource: "portfolio",
    });
    expect(properties).not.toHaveProperty("learnerName");
    expect(properties).not.toHaveProperty("email");
    expect(properties).not.toHaveProperty("title");
    expect(properties).not.toHaveProperty("whatHappened");
    expect(properties).not.toHaveProperty("reflection");
    expect(properties).not.toHaveProperty("filename");
    expect(properties).not.toHaveProperty("storagePath");
    expect(properties).not.toHaveProperty("url");
  });

  it("records abandonment only after meaningful unsaved work and records attachment finalisation after success", () => {
    expect(captureSource).toContain('"capture_abandoned"');
    expect(captureSource).toContain("captureMeaningfulInputRef.current");
    expect(captureSource).toContain("captureSavedRef.current");
    expect(captureSource).toContain('"capture_attachment_finalised"');
    expect(quickCaptureSource).toContain('"capture_abandoned"');
    expect(quickCaptureSource).toContain('"capture_attachment_finalised"');
  });

  it("measures the explicit Capture-to-Portfolio evidence-open journey without an evidence id", () => {
    expect(captureSource).toContain('captureSource=${captureSourceSurface}');
    expect(quickCaptureHandoffSource).toContain("captureSource=quick_capture");
    expect(providerSource).toContain('"portfolio_viewed_after_capture"');
    expect(portfolioSource).toContain('"portfolio_evidence_opened"');
    expect(portfolioSource).toContain("isJustCaptured: item.evidence.id === latestEvidenceIdFromQuery");
    expect(portfolioSource).not.toContain("evidenceId: item.evidence.id");
  });

  it("preserves the existing connected Reports handoff with safe source context", () => {
    expect(portfolioSource).toContain("source=portfolio");
    expect(portfolioSource).toContain('"create_report_selected"');
    expect(providerSource).toContain("reportEntrySource");
  });
});

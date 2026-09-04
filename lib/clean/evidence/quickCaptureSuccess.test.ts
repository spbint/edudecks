import { describe, expect, it } from "vitest";
import {
  buildQuickCaptureSuccessHandoff,
  safeQuickCaptureReturnPath,
} from "@/lib/clean/evidence/quickCaptureSuccess";

describe("Quick Capture success handoffs", () => {
  it("builds the standalone Portfolio-first handoff from authoritative inclusion flags", () => {
    const handoff = buildQuickCaptureSuccessHandoff({
      evidenceId: "evidence 1",
      learnerId: "learner 1",
      learnerLabel: "Alex",
      includeInPortfolio: true,
      includeInReport: true,
      returnTo: null,
    });

    expect(handoff.primaryLabel).toBe("View in Portfolio");
    expect(handoff.primaryHref).toBe(
      "/my-portfolio?learner_id=learner%201&latestEvidenceId=evidence%201&source=my-capture&captureSource=quick_capture",
    );
    expect(handoff.portfolioMessage).toBe("Added to Alex’s Portfolio.");
    expect(handoff.reportMessage).toBe("Included in Reports.");
    expect(handoff.returnHref).toBe("/my-day");
    expect(handoff.returnLabel).toBe("Return");
    expect(handoff.showCaptureAnother).toBe(true);
  });

  it("preserves an existing My Day return path without inventing a new deep link", () => {
    const handoff = buildQuickCaptureSuccessHandoff({
      evidenceId: "evidence-1",
      learnerId: "learner-1",
      learnerLabel: "Alex",
      includeInPortfolio: true,
      includeInReport: true,
      returnTo: "/my-day?learnerId=learner-1#today",
    });

    expect(handoff.returnKind).toBe("my-day");
    expect(handoff.returnHref).toBe("/my-day?learnerId=learner-1#today");
    expect(handoff.returnLabel).toBe("Back to My Day");
    expect(handoff.primaryLabel).toBe("Back to My Day");
  });

  it("never claims or links Portfolio inclusion when the saved entry says false", () => {
    const handoff = buildQuickCaptureSuccessHandoff({
      evidenceId: "evidence-1",
      learnerId: "learner-1",
      learnerLabel: "Alex",
      includeInPortfolio: false,
      includeInReport: false,
      returnTo: "/my-day",
    });

    expect(handoff.portfolioHref).toBeNull();
    expect(handoff.portfolioMessage).toBeNull();
    expect(handoff.reportMessage).toBeNull();
    expect(handoff.primaryHref).toBe("/my-day");
    expect(handoff.primaryLabel).toBe("Back to My Day");
  });

  it("preserves Pathways return context while keeping Portfolio secondary", () => {
    const returnTo =
      "/my-pathways?subjectKey=mathematics&strandKey=number&learnerId=learner-1#pathway-step-number-2";
    const handoff = buildQuickCaptureSuccessHandoff({
      evidenceId: "evidence-1",
      learnerId: "learner-1",
      learnerLabel: "Alex",
      includeInPortfolio: true,
      includeInReport: true,
      returnTo,
    });

    expect(handoff.returnKind).toBe("pathways");
    expect(handoff.returnHref).toBe(returnTo);
    expect(handoff.returnLabel).toBe("Return to pathway");
    expect(handoff.primaryLabel).toBe("Return to pathway");
    expect(handoff.showCaptureAnother).toBe(true);
  });

  it("rejects external and protocol-relative return destinations", () => {
    expect(safeQuickCaptureReturnPath("https://example.com/collect")).toBe("/my-day");
    expect(safeQuickCaptureReturnPath("//example.com/collect")).toBe("/my-day");
    expect(safeQuickCaptureReturnPath("/my-portfolio?learner_id=one")).toBe(
      "/my-portfolio?learner_id=one",
    );
  });
});

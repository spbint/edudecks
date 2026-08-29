import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getProductViewportCategory,
  sanitizeProductAnalyticsProperties,
} from "@/lib/clean/analytics/productAnalytics";
import {
  attachmentRecoveryMessage,
  captureRecoveryMessage,
  readCaptureNetworkHint,
} from "@/lib/clean/evidence/captureNetworkStatus";
import { assertStoredAttachmentsConfirmed } from "@/lib/clean/evidence/useCleanEvidenceAttachments";
import { buildQuickCaptureSuccessHandoff } from "@/lib/clean/evidence/quickCaptureSuccess";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const quickCaptureSource = readSource("app/components/clean/CleanQuickCaptureWorkspace.tsx");
const captureSource = readSource("app/components/clean/CleanCaptureWorkspace.tsx");
const attachmentSource = readSource("lib/clean/evidence/useCleanEvidenceAttachments.ts");
const calendarSource = readSource("app/components/clean/CleanCalendarWorkspace.tsx");
const portfolioSource = readSource("app/components/clean/CleanPortfolioWorkspace.tsx");
const analyticsProviderSource = readSource(
  "app/components/clean/analytics/ProductAnalyticsProvider.tsx",
);
const quickDraftSource = readSource("lib/clean/evidence/quickCaptureDraft.ts");

describe("Stage 4 capture resilience", () => {
  it("treats browser online state as a recovery hint, not a save gate", () => {
    expect(readCaptureNetworkHint({ onLine: false })).toBe("offline");
    expect(readCaptureNetworkHint({ onLine: true })).toBe("online");
    expect(readCaptureNetworkHint(null)).toBe("unknown");
    expect(captureRecoveryMessage("offline")).toContain("Your entries are still here");
    expect(captureRecoveryMessage("offline")).toContain("choose Save again");
    expect(attachmentRecoveryMessage("offline")).toContain("Retry attachment");
    expect(quickCaptureSource).not.toContain('if (networkHint === "offline") return');
    expect(captureSource).not.toContain('if (networkHint === "offline") return');
    expect(quickCaptureSource).toContain("Automatic background sync is not");
    expect(captureSource).toContain("Automatic background sync is");
  });

  it("keeps entered capture state and inclusion choices through attachment failure", () => {
    const uploadFailureStart = captureSource.indexOf("catch (uploadError)");
    const uploadFailureReturn = captureSource.indexOf("return;", uploadFailureStart);
    const failureBranch = captureSource.slice(uploadFailureStart, uploadFailureReturn);

    expect(uploadFailureStart).toBeGreaterThan(-1);
    expect(failureBranch).toContain("setPendingAttachmentEvidenceId(savedEntry.id)");
    expect(failureBranch).not.toContain("resetForm(");
    expect(captureSource).toContain("setTitle");
    expect(captureSource).toContain("setWhatHappened");
    expect(captureSource).toContain("setReflection");
    expect(captureSource).toContain("setLearnerId");
    expect(captureSource).toContain("setObservedOn");
    expect(captureSource).toContain("setLifeAddToPortfolio");
    expect(captureSource).toContain("setLifeIncludeInReport");
    expect(quickCaptureSource).toContain("setSavedEntry(result.entry)");
    expect(quickCaptureSource).not.toContain("setCaption(\"\");\n      if (attachments.hasSelectedAttachments)");
  });

  it("announces the approved slow-save phases and exposes a clear retry", () => {
    for (const phase of [
      "Saving learning",
      "Uploading evidence",
      "Finalising evidence",
      "Learning saved",
    ]) {
      expect(`${quickCaptureSource}\n${captureSource}\n${attachmentSource}`).toContain(phase);
    }
    expect(quickCaptureSource).toContain('role="status" aria-live="polite"');
    expect(captureSource).toContain('role="status" aria-live="polite"');
    expect(quickCaptureSource).toContain("Retry attachment");
    expect(captureSource).toContain("Retry attachment");
  });

  it("requires confirmed stored metadata before reporting attachment completion", () => {
    const uploaded = [
      {
        label: "evidence.jpg",
        path: "family/family-1/learner/learner-1/evidence/evidence-1/file.jpg",
        mimeType: "image/jpeg",
        size: 128,
        kind: "image" as const,
      },
    ];

    expect(() =>
      assertStoredAttachmentsConfirmed(uploaded, {
        attachmentUrls: [],
        imageUrl: null,
        fileUrl: null,
      }),
    ).toThrow(/did not confirm/i);
    expect(() =>
      assertStoredAttachmentsConfirmed(uploaded, {
        attachmentUrls: [uploaded[0].path],
        imageUrl: uploaded[0].path,
        fileUrl: null,
      }),
    ).not.toThrow();
    expect(quickCaptureSource).toContain("setSavedPhotoAttached(Boolean(uploaded.length))");
  });

  it("keeps private drafts in memory and never stores text or binaries in browser storage", () => {
    expect(quickDraftSource).toContain("let pendingDraft");
    expect(quickDraftSource).not.toMatch(/localStorage|sessionStorage|indexedDB/i);
    expect(quickCaptureSource).not.toMatch(/localStorage|sessionStorage|indexedDB/i);
  });

  it("preserves My Day and Pathways return navigation after resilient saves", () => {
    const dayHandoff = buildQuickCaptureSuccessHandoff({
      evidenceId: "evidence-1",
      learnerId: "learner-1",
      learnerLabel: "Learner",
      includeInPortfolio: true,
      includeInReport: true,
      returnTo: "/my-day?date=2026-08-15",
    });
    const pathwayHandoff = buildQuickCaptureSuccessHandoff({
      evidenceId: "evidence-1",
      learnerId: "learner-1",
      learnerLabel: "Learner",
      includeInPortfolio: false,
      includeInReport: true,
      returnTo: "/my-pathways?step=one",
    });

    expect(dayHandoff.primaryLabel).toBe("Back to My Day");
    expect(dayHandoff.returnLabel).toBe("Back to My Day");
    expect(pathwayHandoff.primaryLabel).toBe("Return to pathway");
    expect(pathwayHandoff.returnHref).toContain("/my-pathways");
  });
});

describe("Stage 4 privacy-safe Core journey telemetry", () => {
  it.each([
    [320, "phone"],
    [375, "phone"],
    [393, "phone"],
    [430, "phone"],
    [768, "tablet"],
    [1024, "laptop"],
    [1440, "desktop"],
  ] as const)("categorises a %ipx viewport as %s", (width, category) => {
    expect(getProductViewportCategory(width)).toBe(category);
  });

  it("drops entered learning content, filenames, learner names and image contents", () => {
    const sanitized = sanitizeProductAnalyticsProperties({
      area: "quick_capture",
      route: "/my-capture",
      hasAttachment: true,
      parentText: "private learning note",
      title: "private title",
      fileName: "private-photo.jpg",
      learnerName: "Private Learner",
      imageContents: "binary image data",
    });

    expect(sanitized).toMatchObject({
      area: "quick_capture",
      route: "/my-capture",
      hasAttachment: true,
    });
    expect(sanitized).not.toHaveProperty("parentText");
    expect(sanitized).not.toHaveProperty("title");
    expect(sanitized).not.toHaveProperty("fileName");
    expect(sanitized).not.toHaveProperty("learnerName");
    expect(sanitized).not.toHaveProperty("imageContents");
  });

  it("covers every requested Core journey event without payload content", () => {
    expect(calendarSource).toContain("calendar_block_form_opened");
    expect(calendarSource).toContain("calendar_block_save_succeeded");
    expect(calendarSource).toContain("calendar_block_save_failed");
    expect(quickCaptureSource).toContain("quick_capture_opened");
    expect(quickCaptureSource).toContain("capture_first_attachment_selected");
    expect(quickCaptureSource).toContain("capture_save_succeeded");
    expect(quickCaptureSource).toContain("capture_save_failed");
    expect(quickCaptureSource).toContain("capture_attachment_retry");
    expect(quickCaptureSource).toContain("view_in_portfolio_selected");
    expect(analyticsProviderSource).toContain("portfolio_viewed_after_capture");
    expect(portfolioSource).toContain("create_report_selected");
    expect(analyticsProviderSource).toContain("core_web_vital");
    expect(analyticsProviderSource).toContain("metricValue");
  });
});

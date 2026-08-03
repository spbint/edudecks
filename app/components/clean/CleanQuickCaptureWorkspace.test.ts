import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildLearningMomentShareFilename,
  buildLearningMomentShareText,
  canUseNativeLearningMomentShare,
  LEARNING_MOMENT_INVITATION_URL,
  sanitizePublicCaption,
} from "@/lib/clean/evidence/learningMomentShareCard";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanQuickCaptureWorkspace.tsx"), "utf8");
const captureSource = readFileSync(join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"), "utf8");
const daySource = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const portfolioSource = readFileSync(join(process.cwd(), "app/components/clean/CleanPortfolioWorkspace.tsx"), "utf8");
const myLearnaSource = readFileSync(join(process.cwd(), "app/components/clean/CleanMyLearnaWorkspace.tsx"), "utf8");
const shellSource = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const shareSource = readFileSync(join(process.cwd(), "app/components/clean/CleanLearningMomentShareCard.tsx"), "utf8");

describe("Quick Capture doorway", () => {
  it("uses one mode route from every approved entry point", () => {
    expect(captureSource).toContain("mode=quick");
    expect(daySource).toContain("mode=quick");
    expect(portfolioSource).toContain("mode=quick");
    expect(myLearnaSource).toContain("mode=quick");
    expect(shellSource).toContain("quickCaptureHref");
    expect(captureSource).toContain("<CleanQuickCaptureWorkspace />");
  });

  it("keeps the quick record private and report-independent by default", () => {
    expect(source).toContain("saveUnifiedLearningCapture");
    expect(source).toContain("includeInPortfolio: true");
    expect(source).toContain("includeInReport: false");
    expect(source).toContain('sourceType: "quick-capture"');
    expect(source).toContain("Learning moment saved");
    expect(source).toContain("Not included in Reports");
    expect(source).toContain("setQuickCaptureDraft");
    expect(source).toContain("if (submitting || savedEntry");
  });

  it("supports explicit learner isolation, optional captions and local photo retry", () => {
    expect(source).toContain("requestedLearnerId");
    expect(source).toContain("availableLearners: workspace.learners");
    expect(source).toContain("Photo still needs attaching");
    expect(source).toContain("Try photo again");
    expect(source).toContain("Add a photo or a short caption");
  });
});

describe("Learning Moment sharing", () => {
  it("uses a generic non-identifying invitation URL and safe filenames", () => {
    expect(LEARNING_MOMENT_INVITATION_URL).toBe("/start-free?utm_source=mylearna_moment&utm_medium=share&utm_campaign=quick_capture");
    expect(LEARNING_MOMENT_INVITATION_URL).not.toMatch(/family|learner|evidence|email|token/i);
    expect(buildLearningMomentShareFilename("story")).toBe("mylearna-learning-moment-story.png");
    expect(buildLearningMomentShareFilename("post")).toBe("mylearna-learning-moment-post.png");
  });

  it("keeps the default share text free from private record fields", () => {
    const text = buildLearningMomentShareText({ caption: "  A short caption  " });
    expect(text).toContain("A short caption");
    expect(text).toContain("#MyLearnaMoment");
    expect(text).toContain(LEARNING_MOMENT_INVITATION_URL);
    expect(text).not.toMatch(/family-|learner-|evidence-|storage|gps|latitude|longitude/i);
    expect(sanitizePublicCaption("one\n\ntwo", 7)).toBe("one two");
  });

  it("feature-detects native sharing without claiming completion", () => {
    expect(canUseNativeLearningMomentShare({ share: vi.fn() } as unknown as Navigator)).toBe(true);
    expect(canUseNativeLearningMomentShare({} as Navigator)).toBe(false);
    expect(shareSource).toContain("native_share_opened");
    expect(shareSource).not.toContain("native_share_completed");
  });
});

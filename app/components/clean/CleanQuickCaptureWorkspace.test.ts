import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildLearningMomentShareFilename,
  buildLearningMomentShareText,
  canUseNativeLearningMomentShare,
  formatPublicLearnerName,
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
  it("keeps one responsive global header action with a safe local return path", () => {
    const header = shellSource.indexOf('<div className="mylearna-v2-header-actions"');
    const help = shellSource.indexOf('aria-label="Open help and community"', header);
    const notifications = shellSource.indexOf("<CleanCommunityNotificationsMenu />", header);
    const quickCapture = shellSource.indexOf("mylearna-v2-quick-capture-link", header);
    const account = shellSource.indexOf("<CleanAccountMenu", header);
    expect(header).toBeGreaterThan(-1);
    expect(help).toBeLessThan(notifications);
    expect(notifications).toBeLessThan(quickCapture);
    expect(quickCapture).toBeLessThan(account);
    expect(shellSource).toContain('href={quickCaptureHref}');
    expect(shellSource).toContain('aria-label="Quick Capture"');
    expect(shellSource).toContain("const quickCaptureReturnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : \"\"}`;");
    expect(shellSource).toContain("encodeURIComponent(quickCaptureReturnPath)");
    expect(shellSource).toContain("mylearna-v2-quick-capture-label");
    expect(shellSource).toContain("width: 44px !important");
    expect(shellSource).toContain("height: 44px !important");
    const floatingClassName = ["mylearna", "mobile", "quick", "capture"].join("-");
    expect(shellSource).not.toContain(floatingClassName);
    expect(shellSource).not.toMatch(/href=\{`https?:/);
    expect(shellSource.match(/className="mylearna-v2-quick-capture-link"/g)?.length).toBe(1);
    expect(shellSource).toContain('href: "/my-calendar"');
    expect(shellSource).toContain('href: "/my-capture"');
    expect(shellSource).toContain('href: "/my-learna"');
    expect(shellSource).toContain('aria-label="Mobile primary navigation"');
  });

  it("hides the global action on Quick Capture and focused activity shells", () => {
    expect(shellSource).toContain("const quickCaptureRoute = pathname === \"/my-capture\" && searchParams.get(\"mode\") === \"quick\";");
    expect(shellSource).toContain("if (activityMode)");
    expect(shellSource.indexOf("if (activityMode)")).toBeLessThan(shellSource.indexOf("mylearna-v2-quick-capture-link"));
    expect(shellSource).toContain("!quickCaptureRoute");
  });

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

  it("keeps quick capture visually anchored and camera-first", () => {
    expect(source).toContain("window.scrollTo({ top: 0");
    expect(source).toContain(">Quick Capture</h1>");
    expect(source).toContain("Capture a learning moment now. Add more detail later.");
    expect(source).not.toContain("Add it to the portfolio later.");
    expect(source).toContain('aria-label="Take a photo"');
    expect(source).toContain('aria-label="Choose a photo from your library"');
    expect(source).toContain("visuallyHiddenInputStyle");
    expect(source).toContain("Take a photo");
    expect(source).toContain("Choose from library");
    expect(source).toContain("Replace photo");
    expect(source).toContain("Remove photo");
    expect(source).toContain("Add learning area");
  });

  it("keeps the saved receipt calm and makes sharing a focused second step", () => {
    expect(source).toContain("Step 1");
    expect(source).toContain("Step 2 — Create your share card");
    expect(shareSource).toContain("Back to saved moment");
    expect(source).toContain("onClick={() => setSharingOpen(true)}");
    expect(source).not.toContain("Close share card");
    expect(source).not.toContain('setStatus("Learning moment saved.")');
    expect(source).toContain("style={tertiaryButtonStyle}");
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

  it("keeps learner-name choices private by default and surname-free", () => {
    expect(formatPublicLearnerName("Ada Lovelace", "hidden")).toBe("");
    expect(formatPublicLearnerName("Ada Lovelace", "initial")).toBe("A.");
    expect(formatPublicLearnerName("Ada Lovelace", "first-name")).toBe("Ada");
    expect(shareSource).toContain('["hidden", "initial", "first-name"]');
    expect(shareSource).toContain("Update preview");
    expect(shareSource).toContain("setImageTreatment(option)");
  });
});

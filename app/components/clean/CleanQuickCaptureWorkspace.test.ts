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
const quickSuccessSource = readFileSync(join(process.cwd(), "lib/clean/evidence/quickCaptureSuccess.ts"), "utf8");
const attachmentControlsSource = readFileSync(join(process.cwd(), "app/components/clean/evidence/CleanEvidenceAttachmentControls.tsx"), "utf8");
const captureSource = readFileSync(join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"), "utf8");
const daySource = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const portfolioSource = readFileSync(join(process.cwd(), "app/components/clean/CleanPortfolioWorkspace.tsx"), "utf8");
const myLearnaSource = readFileSync(join(process.cwd(), "app/components/clean/CleanMyLearnaWorkspace.tsx"), "utf8");
const shellSource = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const shareSource = readFileSync(join(process.cwd(), "app/components/clean/CleanLearningMomentShareCard.tsx"), "utf8");
const reportsSource = readFileSync(join(process.cwd(), "app/components/clean/CleanReportsWorkspace.tsx"), "utf8");
const portfolioClientSource = readFileSync(join(process.cwd(), "lib/clean/portfolio/client.ts"), "utf8");
const portfolioPresentationSource = readFileSync(join(process.cwd(), "lib/clean/portfolio/evidencePresentation.ts"), "utf8");
const reportPdfSource = readFileSync(join(process.cwd(), "lib/clean/outputs/pdf.ts"), "utf8");

describe("Quick Capture doorway", () => {
  it("keeps the fast capture destination in companion navigation with a safe local return path", () => {
    const header = shellSource.indexOf('<div className="mylearna-v2-header-actions"');
    const account = shellSource.indexOf("<CleanAccountMenu", header);
    expect(header).toBeGreaterThan(-1);
    expect(account).toBeGreaterThan(header);
    expect(shellSource).not.toContain('aria-label="Open help and community"');
    expect(shellSource).not.toContain("<CleanCommunityNotificationsMenu />");
    expect(shellSource).toContain("const quickCaptureReturnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : \"\"}`;");
    expect(shellSource).toContain("encodeURIComponent(quickCaptureReturnPath)");
    const floatingClassName = ["mylearna", "mobile", "quick", "capture"].join("-");
    expect(shellSource).not.toContain(floatingClassName);
    expect(shellSource).not.toMatch(/href=\{`https?:/);
    expect(shellSource).toContain('href: "/my-calendar"');
    expect(shellSource).toContain('href: "/my-portfolio"');
    expect(shellSource).toContain('aria-label="Mobile primary navigation"');
  });

  it("keeps the Quick Capture route and activity shell separate from companion navigation", () => {
    expect(shellSource).toContain("const quickCaptureRoute = pathname === \"/my-capture\" && searchParams.get(\"mode\") === \"quick\";");
    expect(shellSource).toContain("if (activityMode)");
    expect(shellSource).toContain("mylearna-v2-quick-capture-content");
  });

  it("uses one mode route from every approved entry point", () => {
    expect(captureSource).toContain("mode=quick");
    expect(daySource).toContain("mode=quick");
    expect(portfolioSource).toContain("mode=quick");
    expect(myLearnaSource).toContain("mode=quick");
    expect(shellSource).toContain("quickCaptureHref");
    expect(captureSource).toContain("<CleanQuickCaptureWorkspace />");
  });

  it("includes new Quick Capture records in Portfolio and Reports by default", () => {
    expect(source).toContain("saveUnifiedLearningCapture");
    expect(source).toContain("includeInPortfolio: true");
    expect(source).toContain("includeInReport: true");
    expect(source).toContain('sourceType: "quick-capture"');
    expect(source).toContain("learnerId,");
    expect(source).toContain("activityDate: observedOn");
    expect(source).toContain("whatHappened: nextCaption");
    expect(source).toContain("learningArea: learningArea.trim() || null");
    expect(source).toContain("Learning moment saved");
    expect(source).toContain("setQuickCaptureDraft");
    expect(source).toContain("if (submitting || savedEntry");
  });

  it("preserves report filtering and the existing PDF evidence builder", () => {
    expect(reportsSource).toContain("reportIncludedOnly: true");
    expect(portfolioClientSource).toContain("item.evidence.includeInReport");
    expect(portfolioPresentationSource).toContain("buildReportPdfEvidenceItems");
    expect(portfolioPresentationSource).toContain("item.evidence.id");
    expect(reportPdfSource).toContain("model.evidenceItems");
    expect(reportPdfSource).not.toContain("MyLearnaCoach");
    expect(reportPdfSource).not.toContain("CleanQuickCaptureWorkspace");
  });

  it("supports explicit learner isolation, optional captions and local photo retry", () => {
    expect(source).toContain("requestedLearnerId");
    expect(source).toContain("availableLearners: workspace.learners");
    expect(source).toContain("Attachment still needs attaching");
    expect(source).toContain("Retry attachment");
    expect(source).toContain("Add a photo or a short caption");
  });

  it("keeps quick capture visually anchored and camera-first", () => {
    expect(source).toContain("window.scrollTo({ top: 0");
    expect(source).toContain(">Quick Capture</h1>");
    expect(source).toContain("Capture a learning moment now. Start a new detailed capture later.");
    expect(source).not.toContain("Add it to the portfolio later.");
    expect(source).toContain("CleanEvidenceAttachmentControls");
    expect(attachmentControlsSource).toContain('aria-label="Take a photo"');
    expect(attachmentControlsSource).toContain('aria-label="Choose a photo"');
    expect(attachmentControlsSource).toContain("visuallyHiddenFileInputStyle");
    expect(attachmentControlsSource).toContain("Take photo");
    expect(attachmentControlsSource).toContain("Choose photo");
    expect(attachmentControlsSource).toContain("Replace photo");
    expect(attachmentControlsSource).toContain("Remove photo");
    expect(source).toContain("Add learning area");
  });

  it("keeps the mobile save action above the unchanged bottom navigation", () => {
    expect(source).toContain('className="mylearna-quick-capture-main"');
    expect(source).toContain("bottom: calc(var(--mylearna-mobile-bottom-nav-height, 62px) + env(safe-area-inset-bottom, 0px) + 8px)");
    expect(source).toContain("padding-bottom: calc(var(--mylearna-mobile-bottom-nav-height, 62px) + 112px + env(safe-area-inset-bottom, 0px))");
    expect(source).toContain(".mylearna-quick-capture-save-bar > button { width: 100%; }");
    expect(source).not.toContain("bottom: 0; z-index: 52");
    expect(source).toContain('style={{ position: "sticky", bottom: 8');
    expect(source).toContain("minHeight: 48");
    expect(shellSource).toContain("--mylearna-mobile-bottom-nav-height: 62px");
    expect(shellSource).toContain("mylearna-v2-quick-capture-content");
    expect(shellSource).toContain("z-index: 60 !important");
    expect(shellSource).toContain("grid-template-columns: repeat(4, minmax(0, 1fr)) !important");
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

  it("labels the existing full-Capture draft handoff as a new detailed capture", () => {
    const handoffStart = source.indexOf("function addMoreDetail()");
    const handoffEnd = source.indexOf("function captureAnother()", handoffStart);
    const handoff = source.slice(handoffStart, handoffEnd);

    expect(source).toContain(">New detailed capture</button>");
    expect(handoff).toContain("setQuickCaptureDraft");
    expect(handoff).toContain('quickDraft: "1"');
    expect(handoff).toContain('params = new URLSearchParams({ learner_id: savedEntry.learnerId, observed_on: savedEntry.observedOn, quickDraft: "1", returnTo: returnPath })');
    expect(handoff).toContain("router.push");
    expect(handoff).not.toContain("saveUnifiedLearningCapture");
  });

  it("guides a successful save to Portfolio without changing persistence", () => {
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain("Learning saved");
    expect(source).toContain("successHandoff?.portfolioMessage");
    expect(source).toContain("successHandoff?.reportMessage");
    expect(source).toContain('successHandoff?.returnKind !== "other"');
    expect(source).toContain("successHandoff?.portfolioHref");
    expect(quickSuccessSource).toContain("View in Portfolio");
    expect(source).not.toContain("<span>Added to Portfolio</span>");
    expect(source).toContain("includeInPortfolio: true");
    expect(source).toContain("includeInReport: true");
  });

  it("keeps upload completion and retry inside the same success receipt", () => {
    expect(source).toContain("setSavedPhotoAttached(Boolean(uploaded.length))");
    expect(source).toContain("setPhotoUploadError");
    expect(source).toContain("retryPhotoUpload");
    expect(source).toContain("Retry attachment");
    expect(source).toContain("Attachment attached to the saved learning moment.");
  });

  it("keeps the receipt above the non-blocking Coach refresh and only Capture another clears it", () => {
    const savedEntryStart = source.indexOf("setSavedEntry(result.entry)");
    const savePhaseStart = source.indexOf('setSavePhase("Learning saved")', savedEntryStart);
    const captureAnotherStart = source.indexOf("function captureAnother()");
    const captureAnotherEnd = source.indexOf("if (workspace.loading)", captureAnotherStart);

    expect(savedEntryStart).toBeGreaterThan(-1);
    expect(savePhaseStart).toBeGreaterThan(savedEntryStart);
    expect(source).not.toContain("await workspace.reload()");
    expect(source).not.toContain("requestCoachStateRefresh");
    expect(source).toContain("Creating evidence already notifies the Coach refresh subscriber");
    expect(source.slice(captureAnotherStart, captureAnotherEnd)).toContain("setSavedEntry(null)");
    expect(source.match(/setSavedEntry\(null\)/g)).toHaveLength(1);
    expect(source).toContain("if (savedEntry) {");
    expect(source).toContain("Learning moment saved");
    expect(source).toContain("Attachment still needs attaching");
    expect(source).toContain("Retry attachment");
  });

  it("preserves My Day and Pathways return behavior without automatic redirects", () => {
    expect(source).toContain("successHandoff.returnHref");
    expect(source).toContain("successHandoff.returnLabel");
    expect(captureSource).toContain("lastSavedMyDayReturnPath");
    expect(captureSource).toContain("Back to My Day");
    expect(captureSource).toContain("savedEvidencePathwayReturnPath");
    expect(captureSource).toContain("Return to pathway");
    expect(source).not.toContain("router.replace(successHandoff");
    expect(source).not.toContain("router.push(successHandoff");
  });

  it("keeps receipt actions responsive with 44px primary targets", () => {
    expect(source).toContain("mylearna-quick-capture-receipt-primary-actions");
    expect(source).toContain("repeat(auto-fit, minmax(180px, 1fr))");
    expect(source).toContain("@media (max-width: 420px)");
    expect(source).toContain("min-height: 44px");
    expect(source).toContain("Capture another");
  });

  it("connects Portfolio to the existing learner-aware Reports route", () => {
    expect(portfolioSource).toContain("Start ${selectedLearnerLabel}'s learning story");
    expect(portfolioSource).toContain("Create full report");
    expect(portfolioSource).toContain("createReportHref");
    expect(portfolioSource).toContain("learner_id=${encodeURIComponent(selectedLearnerId)}");
    expect(portfolioSource).toContain("mylearna-portfolio-next-report");
    expect(portfolioSource).not.toContain("Share Portfolio");
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

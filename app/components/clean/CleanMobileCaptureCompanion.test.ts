import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const capture = readFileSync(join(process.cwd(), "app/components/clean/CleanQuickCaptureWorkspace.tsx"), "utf8");
const attachments = readFileSync(join(process.cwd(), "app/components/clean/evidence/CleanEvidenceAttachmentControls.tsx"), "utf8");
const shell = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const day = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const success = readFileSync(join(process.cwd(), "lib/clean/evidence/quickCaptureSuccess.ts"), "utf8");

describe("mobile Capture companion", () => {
  it("keeps the mobile hierarchy capture-first while retaining desktop Quick Capture", () => {
    expect(capture).toContain('mobileCompanion ? "Capture learning" : "Quick Capture"');
    expect(capture).toContain('title="Add a photo or file"');
    expect(capture).toContain('aria-label="What happened?"');
    expect(capture).toContain("Optional details");
    expect(capture).toContain('mobileCompanion ? "Save learning" : "Save learning moment"');
    expect(capture).toContain('mobileCompanion ? "Capture learning" : "Quick Capture"');
  });

  it("makes the existing camera input visually primary without changing its attachment contract", () => {
    expect(attachments).toContain("cameraFirst?: boolean");
    expect(attachments).toContain("cameraFirst ? { gridColumn: \"1 / -1\" }");
    expect(attachments).toContain('capture="environment"');
    expect(attachments).toContain("attachments.handlePhotoChange");
    expect(attachments).toContain("attachments.handleEvidenceFileChange");
    expect(capture).toContain("uploadSelectedAttachments");
    expect(capture).toContain("setSavePhase");
  });

  it("carries planned activity context without writing Calendar data", () => {
    expect(day).toContain('params.set("activity_title", item.title)');
    expect(capture).toContain('searchParams.get("activity_title")');
    expect(capture).toContain('searchParams.get("calendar_item_id")');
    expect(capture).toContain("calendarItemId: requestedCalendarItemId || null");
    expect(capture).toContain("programId: requestedProgramId || null");
    expect(capture).not.toContain("ensureCleanOperationalWeekFromUsualWeek");
    expect(capture).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
  });

  it("yields the mobile shell while a capture field is actively edited and restores it otherwise", () => {
    expect(capture).toContain("setMobileCompanionCaptureEditing(editing)");
    expect(capture).toContain("onFocusCapture={handleMobileFormFocus}");
    expect(capture).toContain("onBlurCapture={handleMobileFormBlur}");
    expect(capture).toContain("setMobileEditing(false);");
    expect(shell).toContain("MOBILE_COMPANION_CAPTURE_EDITING_EVENT");
    expect(shell).toContain("hideMobileBottomNavForCapture");
    expect(shell).toContain("mylearna-v2-mobile-bottom-nav-capture-editing");
    expect(shell).toContain('"--mylearna-mobile-bottom-nav-height": hideMobileBottomNavForCapture ? "0px" : "62px"');
  });

  it("keeps companion utilities focused while leaving Settings directly available", () => {
    const moreStart = shell.indexOf('id="mylearna-mobile-more-navigation"');
    const moreEnd = shell.indexOf('<nav', moreStart);
    const more = shell.slice(moreStart, moreEnd);

    expect(shell).toContain("const mobileCompanion = useMobileCompanion();");
    expect(shell).toContain("{!mobileCompanion ? (");
    expect(shell).toContain("<ReportProblemButton pageTitle={title} />");
    expect(more).toContain('href="/my-calendar"');
    expect(more).toContain('href="/my-profile"');
    expect(more).toContain('href="/my-community"');
    expect(more).not.toContain('href={item.href}');
    expect(shell).toContain('href: "/my-settings"');
  });

  it("keeps the companion receipt focused on Portfolio, return, and another capture", () => {
    expect(capture).toContain("View in Portfolio");
    expect(capture).toContain("Capture another");
    expect(capture).toContain("successHandoff?.returnHref");
    expect(capture).toContain("mobileCompanion && successHandoff?.portfolioHref");
    expect(capture).toContain("!mobileCompanion && successHandoff?.portfolioHref");
    expect(capture).toContain("!mobileCompanion ? <button type=\"button\" onClick={addMoreDetail}");
    expect(capture).toContain("!mobileCompanion ? <button type=\"button\" onClick={() => setSharingOpen(true)}");
    expect(success).toContain("latestEvidenceId");
    expect(capture).toContain("buildQuickCaptureSuccessHandoff");
  });
});

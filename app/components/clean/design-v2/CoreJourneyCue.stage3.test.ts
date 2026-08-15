import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CoreJourneyCue, { type CoreJourneyStage } from "./CoreJourneyCue";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const cueSource = readSource("app/components/clean/design-v2/CoreJourneyCue.tsx");
const daySource = readSource("app/components/clean/CleanDayWorkspace.tsx");
const calendarSource = readSource("app/components/clean/CleanCalendarWorkspace.tsx");
const captureSource = readSource("app/components/clean/CleanQuickCaptureWorkspace.tsx");
const portfolioSource = readSource("app/components/clean/CleanPortfolioWorkspace.tsx");
const reportsSource = readSource("app/components/clean/CleanReportsWorkspace.tsx");
const shellSource = readSource("app/components/clean/design-v2/MyLearnaAppShellV2.tsx");
const visibilitySource = readSource("lib/clean/publicVisibility.ts");

describe("Stage 3 core journey orientation", () => {
  it.each<CoreJourneyStage>(["plan", "capture", "portfolio", "report"])(
    "marks only %s as the current stage without claiming completion",
    (stage) => {
      const markup = renderToStaticMarkup(createElement(CoreJourneyCue, { stage }));

      expect(markup).toContain("Plan");
      expect(markup).toContain("Capture");
      expect(markup).toContain("Portfolio");
      expect(markup).toContain("Report");
      expect(markup.match(/aria-current="step"/g)).toHaveLength(1);
      expect(markup).not.toMatch(/[✓✔☑]/u);
    },
  );

  it("uses the cue on every approved Core screen with the correct active stage", () => {
    expect(daySource).toContain('<CoreJourneyCue stage="plan" />');
    expect(calendarSource).toContain('<CoreJourneyCue stage="plan" />');
    expect(captureSource).toContain('<CoreJourneyCue stage="capture" />');
    expect(portfolioSource).toContain('<CoreJourneyCue stage="portfolio" />');
    expect(reportsSource).toContain('<CoreJourneyCue stage="report" />');
  });

  it("keeps the mobile cue compact and the laptop cue spacious without horizontal overflow", () => {
    expect(cueSource).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(cueSource).toContain("min-width: 0");
    expect(cueSource).toContain("box-sizing: border-box");
    expect(cueSource).toContain("@media (max-width: 720px)");
    expect(cueSource).toContain("@media (min-width: 768px)");
    expect(cueSource).toContain("min-height: 44px");
  });

  it("moves optional mobile explanation into one accessible help pattern", () => {
    expect(cueSource).toContain("<details className=\"mylearna-core-help-mobile\">");
    expect(cueSource).toContain("<summary>Need help?</summary>");
    expect(cueSource).toContain("summary:focus-visible");
    expect(daySource).toContain("Add a learning block, then capture what happens.");
    expect(calendarSource).toContain("Plan the learning week.");
    expect(portfolioSource).toContain("Choose your strongest learning moments.");
    expect(reportsSource).toContain("Create a clear learning report.");
  });

  it("keeps Quick Capture controls and its dominant save action before optional help", () => {
    const attachment = captureSource.indexOf("<CleanEvidenceAttachmentControls");
    const save = captureSource.indexOf("Save learning moment", attachment);
    const help = captureSource.indexOf("<CoreJourneyHelp>", save);

    expect(attachment).toBeGreaterThan(-1);
    expect(save).toBeGreaterThan(attachment);
    expect(help).toBeGreaterThan(save);
    expect(captureSource).toContain("minHeight: 48");
  });

  it("preserves public navigation visibility contracts", () => {
    expect(shellSource).toContain('{ href: "/my-learna", label: "My Learna"');
    expect(shellSource).toContain("...(PUBLIC_PATHWAYS_ENABLED");
    expect(visibilitySource).toContain("export const PUBLIC_PATHWAYS_ENABLED = false;");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const daySource = read("app/components/clean/CleanDayWorkspace.tsx");
const portfolioSource = read("app/components/clean/CleanPortfolioWorkspace.tsx");
const learnaSource = read("app/components/clean/CleanMyLearnaWorkspace.tsx");
const captureSource = read("app/components/clean/CleanCaptureWorkspace.tsx");
const reportsSource = read("app/components/clean/CleanReportsWorkspace.tsx");
const shellSource = read("app/components/clean/design-v2/MyLearnaAppShellV2.tsx");

describe("ordinary learner-context continuity", () => {
  it("hydrates My Day from a valid learner query and keeps an explicit switch in the URL", () => {
    expect(daySource).toContain('searchParams.get("learner_id") || searchParams.get("learnerId")');
    expect(daySource).toContain('params.set("learner_id", nextLearnerId)');
    expect(daySource).toContain('learner.id === learnerIdFromQuery');
  });

  it("carries My Day learner context into ordinary Capture handoffs", () => {
    expect(daySource).toContain("const quickCaptureLearnerId");
    expect(daySource).toContain("&learner_id=${encodeURIComponent(quickCaptureLearnerId)}");
    expect(daySource).toContain('params.set("learner_id", item.learnerId)');
    expect(daySource).toContain('params.set("returnTo", buildDayPath(selectedDate))');
  });

  it("keeps Portfolio learner context through both standard and quick capture returns", () => {
    expect(portfolioSource).toContain("const portfolioReturnHref = buildLearnerContextHref(pathname, selectedLearnerId)");
    expect(portfolioSource).toContain("const captureLearningHref = buildLearnerContextHref(capturePathBase, selectedLearnerId");
    expect(portfolioSource).toContain("returnTo: portfolioReturnHref");
    expect(portfolioSource).toContain('params.set("learner_id", nextLearnerId)');
  });

  it("keeps My Learna learner context when quick capture returns", () => {
    expect(learnaSource).toContain('returnTo: learnerPath("/my-learna", selectedLearnerId)');
    expect(learnaSource).toContain("return buildLearnerContextHref(path, learnerId)");
  });

  it("preserves existing validated destination hydration and report continuity", () => {
    expect(captureSource).toContain("resolveLearnerContext");
    expect(captureSource).toContain("learner.id === learnerIdFromQuery");
    expect(portfolioSource).toContain("learnerOptions.some((option) => option.value === learnerIdFromQuery)");
    expect(reportsSource).toContain("learnerOptions.some((option) => option.value === learnerIdFromQuery)");
    expect(reportsSource).toContain("portfolioReturnHref");
  });

  it("carries a validated current learner through the global product navigation", () => {
    expect(shellSource).toContain('searchParams.get("learner_id") || searchParams.get("learnerId")');
    expect(shellSource).toContain("workspace.learners.some((learner) => learner.id === learnerIdFromQuery)");
    expect(shellSource).toContain("buildShellLearnerHref(item.href, learnerId)");
    expect(shellSource).toContain('buildShellLearnerHref("/my-calendar", shellLearnerId)');
    expect(shellSource).toContain("buildShellLearnerHref(dayNavItem.href, shellLearnerId)");
    expect(shellSource).toContain('buildShellLearnerHref("/my-portfolio", shellLearnerId)');
    expect(shellSource).toContain('buildLearnerContextHref("/my-capture?mode=quick", shellLearnerId');
    expect(shellSource).toContain('href === "/my-pathways"');
    expect(shellSource).toContain("learnerId=");
  });

  it("does not alter the specialised Pathways context contract", () => {
    expect(daySource).toContain('`${pathwaysPathBase}?learnerId=${encodeURIComponent(selectedLearnerId)}`');
    expect(learnaSource).toContain("buildActionablePathwayRecommendation");
    expect(captureSource).toContain("appendSavedEvidenceReturnParams");
  });
});

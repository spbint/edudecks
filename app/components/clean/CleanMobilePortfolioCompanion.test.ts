import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPortfolioWorkspace.tsx"),
  "utf8",
);
const mobilePortfolioSource = source.slice(
  source.indexOf("function MobilePortfolioEvidenceCard"),
  source.indexOf("function CleanPortfolioWorkspaceBody"),
);

describe("Mobile Portfolio companion experience", () => {
  it("uses the established companion branch and starts with recent learning", () => {
    expect(source).toContain("const mobileCompanion = useMobileCompanion();");
    expect(source).toContain("if (mobileCompanion) {");
    expect(mobilePortfolioSource).toContain('aria-labelledby="mobile-portfolio-title"');
    expect(mobilePortfolioSource).toContain("Recent learning");
    expect(mobilePortfolioSource).toContain("Your saved learning records, newest first.");
  });

  it("reuses existing Portfolio items for a bounded newest-first mobile feed", () => {
    expect(mobilePortfolioSource).toContain("sortPortfolioItems(");
    expect(source).toContain("MOBILE_RECENT_EVIDENCE_LIMIT = 6");
    expect(mobilePortfolioSource).toContain("Show older learning");
    expect(mobilePortfolioSource).not.toContain("listCleanPortfolioItems(");
  });

  it("keeps the captured receipt and learner context visible without a second receipt store", () => {
    expect(source).toContain("latestEvidenceIdFromQuery");
    expect(mobilePortfolioSource).toContain("justCapturedItem");
    expect(mobilePortfolioSource).toContain("Learning saved");
    expect(mobilePortfolioSource).toContain("Just captured");
    expect(mobilePortfolioSource).toContain('aria-label="Choose learner for recent learning"');
    expect(mobilePortfolioSource).toContain("item.evidence.learnerId === selectedLearnerId");
    expect(mobilePortfolioSource).toContain("visibleJustCapturedItem");
  });

  it("makes capture primary while keeping detail and curation actions secondary", () => {
    expect(mobilePortfolioSource).toContain("+ Capture learning");
    expect(mobilePortfolioSource).toContain("View details");
    expect(mobilePortfolioSource).toContain("Edit learning");
    expect(mobilePortfolioSource).toContain("Feature");
    expect(mobilePortfolioSource).toContain("Delete");
    expect(mobilePortfolioSource).not.toContain("Download learning record");
    expect(mobilePortfolioSource).not.toContain("Create full report");
  });

  it("keeps the mobile empty state calm and excludes desktop guidance/admin content", () => {
    expect(mobilePortfolioSource).toContain("No learning captured yet.");
    expect(mobilePortfolioSource).toContain("What you capture will appear here.");
    expect(mobilePortfolioSource).not.toContain("CoreJourneyCue");
    expect(mobilePortfolioSource).not.toContain("CleanPageIntroVideo");
    expect(mobilePortfolioSource).not.toContain("Learning areas represented");
    expect(mobilePortfolioSource).not.toContain("Pathway checks");
  });

  it("leaves the full desktop Learning Story and report actions after the mobile branch", () => {
    const desktopSource = source.slice(source.indexOf("if (mobileCompanion)"));
    expect(desktopSource).toContain("Learning story");
    expect(desktopSource).toContain("Featured evidence");
    expect(desktopSource).toContain("Download learning record");
    expect(desktopSource).toContain("Create full report");
  });
});

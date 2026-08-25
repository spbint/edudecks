import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPortfolioWorkspace.tsx"),
  "utf8",
);

describe("Portfolio density hierarchy", () => {
  it("keeps mature Portfolio content focused on evidence while preserving first-use guidance", () => {
    expect(source).toContain("const showPortfolioGuidance =");
    expect(source).toContain("showPortfolioGuidance ? (");
    expect(source).toContain('data-testid="portfolio-evidence-card"');
    expect(source).toContain("Your learning record is building.");
  });

  it("uses a compact collapsed card with explicit detail disclosure", () => {
    expect(source).toContain("WebkitLineClamp: isExpanded ? 6 : 2");
    expect(source).toContain('aria-expanded={isExpanded}');
    expect(source).toContain('aria-controls={`portfolio-detail-${item.evidence.id}`}');
    expect(source).toContain('aria-label="More actions"');
    expect(source).toContain("Open capture");
  });

  it("keeps selection, report, sharing, and destructive actions reachable", () => {
    expect(source).toContain("Add to portfolio");
    expect(source).toContain("Remove from portfolio");
    expect(source).toContain("CleanLearningMomentShareCard");
    expect(source).toContain("Use in report");
    expect(source).toContain("Delete evidence");
    expect(source).toContain("pendingDeleteItem");
  });
});

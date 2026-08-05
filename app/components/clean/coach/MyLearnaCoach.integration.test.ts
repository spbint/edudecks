import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const shell = readFileSync(join(root, "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const authLayout = readFileSync(join(root, "app/(auth)/layout.tsx"), "utf8");
const cleanLayout = readFileSync(join(root, "app/(clean)/layout.tsx"), "utf8");
const analytics = readFileSync(join(root, "lib/clean/analytics/productAnalytics.ts"), "utf8");
const provider = readFileSync(join(root, "app/components/clean/coach/MyLearnaCoachProvider.tsx"), "utf8");
const card = readFileSync(join(root, "app/components/clean/coach/MyLearnaCoachCard.tsx"), "utf8");

describe("MyLearna Coach integration", () => {
  it("wraps both authenticated shells and replaces Ready for today", () => {
    expect(authLayout).toContain("<MyLearnaCoachProvider>");
    expect(cleanLayout).toContain("<MyLearnaCoachProvider>");
    expect(shell).not.toContain("Ready for today");
    expect(provider).toContain("getCoachRecommendation");
  });

  it("keeps one compact recommendation action with a non-competing panel", () => {
    expect(card).toContain("MyLearna Coach");
    expect(card).toContain("Why this?");
    expect(provider).toContain("COACH_OPEN_EVENT");
    expect(provider).toContain("guidedStartActive");
  });

  it("allows only safe Coach analytics properties", () => {
    expect(analytics).toContain("recommendationId");
    expect(analytics).toContain("hasMultipleLearners");
    expect(analytics).not.toContain('"learnerId"');
  });
});

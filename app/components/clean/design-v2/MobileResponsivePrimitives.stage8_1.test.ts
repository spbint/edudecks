import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MobileResponsivePrimitives.tsx"),
  "utf8",
);

const shellSource = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"),
  "utf8",
);

describe("Stage 8.1 responsive primitives", () => {
  it("provides a typed sticky action bar with a disabled and busy state", () => {
    expect(source).toContain("export type MobileActionBarProps");
    expect(source).toContain("data-mobile-action-bar");
    expect(source).toContain("primaryDisabled");
    expect(source).toContain("primaryBusy");
  });

  it("keeps the legacy typed tab primitive available without rendering it in companion navigation", () => {
    expect(source).toContain('role="tab"');
    expect(source).toContain("aria-selected={active}");
    expect(shellSource).not.toContain("aria-label={`${section.label.toLowerCase()} destinations`}");
    expect(shellSource).not.toContain("mylearna-mobile-pillar-switcher");
  });

  it("keeps mobile actions and content clear of the home indicator", () => {
    expect(shellSource).toContain("env(safe-area-inset-bottom");
    expect(shellSource).toContain("100svh");
    expect(shellSource).toContain("100dvh");
    expect(shellSource).toContain("font-size: 16px !important");
  });
});

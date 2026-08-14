import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { finalProductNavSections } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";

const shellSource = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"),
  "utf8",
);

const accountMenuSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanAccountMenu.tsx"),
  "utf8",
);

describe("Stage 8 mobile web shell", () => {
  it("uses compact mobile navigation instead of the full desktop route grid", () => {
    expect(shellSource).toContain("mylearna-v2-mobile-bottom-nav");
    expect(shellSource).toContain("Mobile primary navigation");
    expect(shellSource).toContain("display: none !important;");
    expect(shellSource).not.toContain("grid-auto-flow: column !important");
  });

  it("keeps the approved Day Plan Capture Grow More mobile model", () => {
    expect(shellSource).toContain("<span>Day</span>");
    expect(shellSource).toContain("Plan");
    expect(shellSource).toContain("Capture");
    expect(shellSource).toContain("Grow");
    expect(shellSource).toContain("More");
    expect(finalProductNavSections.map((section) => section.label)).toEqual([
      "PLAN",
      "CAPTURE",
      "GROW",
    ]);
  });

  it("exposes contextual pillar destinations without a second route grid", () => {
    expect(finalProductNavSections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["My Calendar"],
      ["Quick Capture", "My Portfolio"],
      ["My Learna", "My Reports"],
    ]);
    expect(shellSource).toContain("mylearna-mobile-pillar-switcher");
    expect(shellSource).toContain("role=\"tablist\"");
    expect(shellSource).toContain("href: \"/my-calendar\"");
    expect(shellSource).toContain("href: \"/my-capture\"");
    expect(shellSource).toContain("href: \"/my-learna\"");
    expect(shellSource).toContain("Open More navigation");
  });

  it("keeps retired and secondary destinations out of top-level mobile navigation", () => {
    const mobileButtonLabels = ["Day", "Plan", "Capture", "Grow", "More"];
    expect(mobileButtonLabels).not.toContain("My Review");
    expect(mobileButtonLabels).not.toContain("My Learna");
    expect(shellSource).toContain("shortLabel: \"Learna\"");
    expect(mobileButtonLabels).not.toContain("Output History");
    expect(shellSource).not.toContain("label: \"Output History\"");
  });

  it("provides accessible active route state and safe bottom spacing", () => {
    expect(shellSource).toContain("aria-current={active ? \"page\" : undefined}");
    expect(shellSource).toContain("Mobile primary navigation");
    expect(shellSource).toContain("env(safe-area-inset-bottom");
    expect(shellSource).toContain("100dvh");
    expect(shellSource).toContain("mylearna-v2-content-main");
  });

  it("preserves the desktop sidebar while hiding it on mobile", () => {
    expect(shellSource).toContain("gridTemplateColumns: \"244px minmax(0, 1fr)\"");
    expect(shellSource).toContain("className=\"mylearna-v2-sidebar\"");
    expect(shellSource).toContain(".mylearna-v2-sidebar");
    expect(shellSource).toContain("display: none !important;");
  });

  it("uses a compact mobile header without duplicate breadcrumb layers", () => {
    expect(shellSource).toContain("mylearna-v2-mobile-header");
    expect(shellSource).toContain("mylearna-v2-mobile-title");
    expect(shellSource).toContain("mylearna-v2-breadcrumb");
    expect(shellSource).toContain(".mylearna-v2-breadcrumb");
  });

  it("uses mobile sheet behavior for account controls at narrow width", () => {
    expect(accountMenuSource).toContain("mylearna-account-menu-panel");
    expect(accountMenuSource).toContain("position: fixed !important");
    expect(accountMenuSource).toContain("100dvh");
    expect(accountMenuSource).toContain("env(safe-area-inset-bottom");
    expect(accountMenuSource).toContain("Open account menu");
  });
});

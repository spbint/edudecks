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

const sitemapSource = readFileSync(join(process.cwd(), "app/sitemap.ts"), "utf8");
const robotsSource = readFileSync(join(process.cwd(), "app/robots.ts"), "utf8");

describe("Stage 8 mobile web shell", () => {
  it("uses compact mobile navigation instead of the full desktop route grid", () => {
    expect(shellSource).toContain("mylearna-v2-mobile-bottom-nav");
    expect(shellSource).toContain("Mobile primary navigation");
    expect(shellSource).toContain("display: none !important;");
    expect(shellSource).not.toContain("grid-auto-flow: column !important");
  });

  it("keeps the five-slot My Day My Calendar Capture My Learna More mobile model", () => {
    expect(shellSource).toContain("<span>My Day</span>");
    expect(shellSource).toContain("My Calendar");
    expect(shellSource).toContain("Capture");
    expect(shellSource).toContain('label: "My Learna", section: "GROW"');
    expect(shellSource).toContain("More");
    expect(finalProductNavSections.map((section) => section.label)).toEqual([
      "PLAN",
      "CAPTURE",
      "GROW",
    ]);
  });

  it("exposes contextual pillar destinations, including authenticated My Pathways, without a second route grid", () => {
    expect(finalProductNavSections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["My Calendar", "My Pathways"],
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
    const mobileButtonLabels = ["My Day", "My Calendar", "Capture", "My Learna", "More"];
    expect(mobileButtonLabels).not.toContain("My Review");
    expect(mobileButtonLabels).toHaveLength(5);
    expect(mobileButtonLabels).not.toContain("Grow");
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
    expect(shellSource).toContain('aria-current={activeMobileSection === item.section ? "page" : undefined}');
    expect(shellSource).toContain('href: "/my-learna"');
  });

  it("keeps My Pathways in authenticated Plan navigation and More focused on secondary controls", () => {
    expect(shellSource).not.toContain("PUBLIC_PATHWAYS_ENABLED");
    expect(shellSource).toContain('label: "My Pathways"');
    expect(shellSource).toContain('href: "/my-pathways"');
    expect(shellSource).toContain('label: "My Settings"');
    expect(shellSource).toContain("<span>Account</span>");
    expect(shellSource).not.toContain('href: "/my-programs"');
    expect(shellSource).not.toContain("programsNavItem");
    expect(shellSource).not.toContain('href: "/my-pathways", icon: "route" as const, label: "My Pathways"');
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

  it("shows the non-interactive Beta v1 status beside the shared desktop and mobile brand", () => {
    expect(shellSource).toContain("function MyLearnaBrandMark");
    expect(shellSource.match(/<MyLearnaBrandMark(?: compact)? \/>/g)).toHaveLength(2);
    expect(shellSource).toContain(">\n        Beta v1\n      </span>");
    expect(shellSource).toContain("</Link>\n      <span");
    expect(shellSource).toContain("mylearna-v2-mobile-brand");
  });

  it("does not reintroduce beta routes or public indexing references", () => {
    expect(shellSource).not.toContain("/beta");
    expect(sitemapSource).not.toContain("/beta");
    expect(robotsSource).not.toContain("/beta");
  });

  it("uses mobile sheet behavior for account controls at narrow width", () => {
    expect(accountMenuSource).toContain("mylearna-account-menu-panel");
    expect(accountMenuSource).toContain("position: fixed !important");
    expect(accountMenuSource).toContain("100dvh");
    expect(accountMenuSource).toContain("env(safe-area-inset-bottom");
    expect(accountMenuSource).toContain("Open account menu");
  });
});

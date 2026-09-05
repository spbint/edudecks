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

describe("mobile companion shell", () => {
  it("uses exactly Today, Capture, Portfolio and More as mobile primary navigation", () => {
    const primaryLabels = ["Today", "Capture", "Portfolio", "More"];
    expect(primaryLabels).toHaveLength(4);
    expect(shellSource).toContain("<span>Today</span>");
    expect(shellSource).toContain('label: "Capture", section: "capture"');
    expect(shellSource).toContain('label: "Portfolio", section: "portfolio"');
    expect(shellSource).toContain('label="Open More navigation"');
    expect(shellSource).toContain("repeat(4, minmax(0, 1fr))");
    expect(primaryLabels).not.toContain("My Learna");
    expect(primaryLabels).not.toContain("My Pathways");
    expect(primaryLabels).not.toContain("Reports");
    expect(primaryLabels).not.toContain("Outputs");
  });

  it("uses the existing quick capture flow and preserves a local return path", () => {
    expect(shellSource).toContain("const quickCaptureReturnPath");
    expect(shellSource).toContain("encodeURIComponent(quickCaptureReturnPath)");
    expect(shellSource).toContain("quickCaptureHref");
    expect(shellSource).toContain('href: "/my-portfolio"');
  });

  it("keeps Calendar and account/help utilities in More", () => {
    expect(shellSource).toContain('href="/my-calendar"');
    expect(shellSource).toContain('label: "My Settings"');
    expect(shellSource).toContain("<span>Account</span>");
    expect(shellSource).toContain("<span>Help and feedback</span>");
    expect(accountMenuSource).toContain("Open account menu");
    expect(accountMenuSource).toContain("Sign out");
  });

  it("keeps desktop navigation complete and removes mobile pillar navigation", () => {
    expect(finalProductNavSections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["My Calendar", "My Pathways"],
      ["Quick Capture", "My Portfolio"],
      ["My Learna", "My Reports"],
    ]);
    expect(shellSource).toContain("gridTemplateColumns: \"244px minmax(0, 1fr)\"");
    expect(shellSource).toContain('label: "My Pathways"');
    expect(shellSource).not.toContain("mylearna-mobile-pillar-switcher");
    expect(shellSource).not.toContain("role=\"tablist\"");
  });

  it("keeps the mobile header compact while preserving the account control", () => {
    expect(shellSource).toContain("<MyLearnaBrandMark compact showBeta={false} />");
    expect(shellSource).toContain("showBeta ? (");
    expect(shellSource).not.toContain('aria-label="Open help and community"');
    expect(shellSource).not.toContain("<CleanCommunityNotificationsMenu />");
    expect(shellSource).toContain("<CleanAccountMenu");
  });

  it("retains accessible mobile navigation foundations", () => {
    expect(shellSource).toContain("Mobile primary navigation");
    expect(shellSource).toContain("Open More navigation");
    expect(shellSource).toContain("env(safe-area-inset-bottom");
    expect(shellSource).toContain("aria-current={active ? \"page\" : undefined}");
  });
});

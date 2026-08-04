import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const publicLaunchSources = [
  "app/components/PublicSiteShell.tsx",
  "app/page.tsx",
  "app/about/page.tsx",
  "app/get-started/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/start-free/page.tsx",
].map((file) => readFileSync(join(process.cwd(), file), "utf8"));

describe("public launch truthfulness", () => {
  it("does not present beta-only launch calls to action", () => {
    expect(publicLaunchSources.join("\n")).not.toMatch(
      /start free during beta|free beta v1|use mylearna now during beta/i,
    );
  });

  it("keeps the public launch routes on real support and signup paths", () => {
    const shell = publicLaunchSources[0];
    expect(shell).toContain('href: "/start-free"');
    expect(shell).toContain('href: "/contact"');
    expect(readFileSync(join(process.cwd(), "app/start-free/page.tsx"), "utf8")).toContain(
      'from "@/lib/signupPrefill"',
    );
  });
});

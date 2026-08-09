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

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("public launch truthfulness", () => {
  it("does not present beta-only launch calls to action", () => {
    expect(publicLaunchSources.join("\n")).not.toMatch(
      /start free during beta|free beta v1|use mylearna now during beta/i,
    );
  });

  it("keeps the public launch routes on real support and signup paths", () => {
    const shell = publicLaunchSources[0];
    expect(shell).toContain('href: "/demo?source=public-header-demo"');
    expect(shell).toContain('href: "/contact"');
    expect(readFileSync(join(process.cwd(), "app/start-free/page.tsx"), "utf8")).toContain(
      'from "@/lib/signupPrefill"',
    );
  });

  it("locks the homepage to the brings-it-together positioning", () => {
    const homepage = read("app/page.tsx");
    expect(homepage).toContain(
      "Homeschool learning happens everywhere. MyLearna brings it all together.",
    );
    expect(homepage).toContain(
      "Plan your week, capture learning as it happens, build meaningful portfolios and create reports—all in one private family space.",
    );
    expect(homepage).toContain("Plan the week");
    expect(homepage).toContain("Capture real learning");
    expect(homepage).toContain("Build portfolios");
    expect(homepage).toContain("Create reports");
    expect(homepage).toContain("No account needed for the demo. Use a fictional family, try the workflow and see how MyLearna brings learning together.");
    expect(homepage).toContain('label: "Explore MyLearna"');
    expect(homepage).toContain('href: "/demo?source=home-primary-demo"');
    expect(homepage).toContain('label: "Create your family space"');
    expect(homepage).toContain('href: "/start-free?source=home-secondary-family-space"');
    expect(homepage).toContain('href: "/demo?source=home-final-demo"');
    expect(homepage).toContain('href: "/start-free?source=home-final-family-space"');
    expect(homepage).not.toContain('label: "Start free"');
    expect(homepage).not.toContain('href: "/demo"');
    expect(homepage).toContain("One connected learning story");
    expect(homepage).toContain("Plan → Learn → Capture → Report");
    expect(homepage).toContain("Everything stays connected");
    expect(homepage).toContain("Start with the tools you need today.");
    expect(homepage).toContain("Explore the fictional Carter family first, or create your own private family space when you are ready.");
    expect(homepage).not.toContain("Use MyLearna now while we continue improving with family feedback.");
    expect(homepage).not.toContain("Start free. Upgrade when you need more.");
    expect(homepage).not.toMatch(/\bOTP\b/i);
    expect(homepage).not.toMatch(/beta|early access|provisional/i);
  });

  it("makes the demo the shared public acquisition action", () => {
    const shell = read("app/components/PublicSiteShell.tsx");
    expect(shell).toContain('{ href: "/demo?source=public-header-demo", label: "Explore MyLearna" }');
    expect(shell).toContain('primaryCta = { label: "Explore MyLearna", href: "/demo?source=public-header-demo" }');
    expect(shell).not.toContain('{ href: "/start-free", label: "Start free" }');
  });

  it("preserves the Start Free form contract while using secure-email presentation", () => {
    const startFree = read("app/start-free/page.tsx");
    expect(startFree).toContain('heroTitle="Create your private family space"');
    expect(startFree).toContain("Enter a few setup details. Next, we’ll send one secure email link—no password or credit card.");
    expect(startFree).toContain("No password");
    expect(startFree).toContain("No credit card");
    expect(startFree).toContain("Private family space");
    expect(startFree).toContain("Guided setup");
    expect(startFree).toContain("Bring your homeschool together");
    expect(startFree).toContain("Continue to secure email sign-in");
    for (const required of ["fullName", "email", "country", "stateOrRegion", "numberOfChildren", "isValidEmail", "saveSignupPrefill", "trackMetaLead", "source", 'params.set("next", "/my-profile")']) {
      expect(startFree).toContain(required);
    }
    expect(startFree).not.toMatch(/\bOTP\b/i);
  });

  it("keeps email authentication behavior while updating signup copy", () => {
    const emailAuth = read("app/components/EmailAuthPage.tsx");
    expect(emailAuth).toContain('heroTitle = isSignup ? "Open your private MyLearna space"');
    expect(emailAuth).toContain("Enter your email and we’ll send a secure one-time link. There is no password to create, remember or reset.");
    expect(emailAuth).toContain("No password. No credit card. Your family space stays private.");
    expect(emailAuth).toContain("Send secure sign-in link");
    expect(emailAuth).toContain('"Check your inbox"');
    expect(emailAuth).toContain("Open the secure MyLearna link to continue. It may take a moment to arrive. Check spam or promotions if you do not see it.");
    expect(emailAuth).toContain("confirm your account and continue");
    for (const required of ["sendMagicLink", "buildAuthCallbackUrl", "normalizeAuthNextPath", "signInWithPassword", "handlePasswordSignIn", "showPasswordFallbackUi"]) {
      expect(emailAuth).toContain(required);
    }
    expect(emailAuth).not.toMatch(/\bOTP\b/i);
  });

  it("keeps root metadata useful for homeschool search", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain("Homeschool Planning, Portfolios and Reports | MyLearna");
    expect(layout).toContain("Homeschool learning happens everywhere.");
    expect(layout).toContain("planning, pathways, evidence, portfolios and reports");
    expect(layout).toContain("metadataBase");
    expect(layout).toContain("p:domain_verify");
    expect(layout).toContain("msvalidate.01");
  });

  it("publishes only truthful site-level structured data", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain('type="application/ld+json"');
    expect(layout).toContain('"@type": "Organization"');
    expect(layout).toContain('"@type": "WebSite"');
    expect(layout).toContain('"@context": "https://schema.org"');
    expect(layout).not.toMatch(/aggregateRating|review|award|accreditation|priceRange/i);
  });

  it("keeps crawler rules and sitemap limited to truthful public discovery", () => {
    const robots = read("app/robots.ts");
    const sitemap = read("app/sitemap.ts");
    expect(robots).toContain('"/"');
    expect(robots).toContain('"/api/"');
    expect(robots).toContain('"/my-*"');
    expect(robots).toContain('"/reports/"');
    expect(sitemap).toContain('path: "/demo"');
    expect(sitemap).toContain('path: "/homeschool-learning-evidence"');
    expect(sitemap).not.toContain("LAST_MODIFIED");
    expect(sitemap).not.toContain("lastModified:");
  });

  it("does not expand public positioning into authenticated or unbuilt product claims", () => {
    const homepage = read("app/page.tsx");
    expect(homepage).not.toMatch(/educational intelligence|adaptive diagnostics|LMS|analytics engine/i);
    expect(homepage).not.toMatch(/bulk upload|CSV functionality|second approver/i);
    expect(read("app/privacy/page.tsx")).toContain("Account and sign-in information");
    expect(read("app/terms/page.tsx")).toContain("Terms of Use");
  });
});

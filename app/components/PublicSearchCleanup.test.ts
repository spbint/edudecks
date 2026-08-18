import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import nextConfig from "../../next.config";

const authorityPaths = [
  "/homeschool-answers",
  "/homeschool-learning-evidence",
  "/homeschool-planning",
  "/homeschool-portfolio",
  "/homeschool-record-keeping",
  "/homeschool-reporting",
] as const;

async function configuredRedirects() {
  if (!nextConfig.redirects) {
    throw new Error("Expected Next.js redirects to be configured.");
  }

  return nextConfig.redirects();
}

describe("public search cleanup", () => {
  it("permanently redirects obsolete beta routes to Start Free", async () => {
    await expect(configuredRedirects()).resolves.toEqual(
      expect.arrayContaining([
        {
          source: "/beta",
          destination: "/start-free",
          permanent: true,
        },
        {
          source: "/beta/thanks",
          destination: "/start-free",
          permanent: true,
        },
      ]),
    );
  });

  it("does not leave indexable beta page components behind", () => {
    expect(existsSync(join(process.cwd(), "app/beta/page.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "app/beta/thanks/page.tsx"))).toBe(false);
  });

  it("keeps auth routes out of the public sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain("https://www.mylearna.com/login");
    expect(urls).not.toContain("https://www.mylearna.com/signup");
  });

  it("retains the intentional acquisition page and public authority routes", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://www.mylearna.com/start-free");
    for (const path of authorityPaths) {
      expect(urls).toContain(`https://www.mylearna.com${path}`);
    }
  });

  it("does not publish unsupported freshness or priority hints", () => {
    for (const entry of sitemap()) {
      expect(Object.keys(entry)).toEqual(["url"]);
    }
  });
});

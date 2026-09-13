import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("MyLearna Learning Library public slice", () => {
  it("defines the hub route and metadata", () => {
    const source = read("app/learn/page.tsx");
    expect(source).toContain('title: "Learning Library | MyLearna"');
    expect(source).toContain('path: "/learn"');
    expect(source).toContain("Start with Article 001");
    expect(source).toContain("/homeschool-answers");
  });

  it("defines Article 001 with canonical metadata and structured data", () => {
    const source = read("app/learn/how-do-children-learn/page.tsx");
    expect(source).toContain("How Do Children Actually Learn? A Homeschool Parent’s Guide | MyLearna");
    expect(source).toContain('path: "/learn/how-do-children-learn"');
    expect(source).toContain('"@type": "Article"');
    expect(source).toContain('"@type": "BreadcrumbList"');
    expect(source).toContain("publishedTime: \"2026-09-13\"");
    expect(source).toContain("/learn");
  });

  it("includes both public routes in discovery and supports future article analytics", () => {
    const sitemap = read("app/sitemap.ts");
    const robots = read("app/robots.ts");
    const analytics = read("app/lib/publicAnalytics.ts");

    expect(sitemap).toContain('"/learn"');
    expect(sitemap).toContain('"/learn/how-do-children-learn"');
    expect(robots).toContain('"/learn"');
    expect(analytics).toContain('pathname === "/learn" || pathname.startsWith("/learn/")');
  });
});

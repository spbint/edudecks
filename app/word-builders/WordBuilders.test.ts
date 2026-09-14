import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getPublicWordBuilder, PUBLIC_WORD_BUILDERS } from "@/lib/clean/publicWordBuilders";

describe("public Word Builders distribution", () => {
  it("has canonical manifest entries and public creatives", () => {
    expect(PUBLIC_WORD_BUILDERS.length).toBeGreaterThan(0);
    const seenImages = new Set<string>();
    const seenLinks = new Set<string>();
    for (const item of PUBLIC_WORD_BUILDERS) {
      expect(item.slug).toMatch(/^[a-z0-9-]+$/);
      expect(item.pinTitle.length).toBeLessThanOrEqual(100);
      expect(item.description.length).toBeLessThan(500);
      expect(["PHONICS_CVC", "AFFIX_SPELLING", "ROOTS"]).toContain(item.category);
      expect(item.link).toMatch(/^https:\/\/www\.mylearna\.com\/word-builders\//);
      expect(item.link).toContain("utm_source=pinterest");
      expect(seenImages.has(item.image)).toBe(false);
      expect(seenLinks.has(item.link.split("?")[0])).toBe(false);
      seenImages.add(item.image);
      seenLinks.add(item.link.split("?")[0]);
      const imagePath = path.join(process.cwd(), "public", item.image);
      expect(fs.existsSync(imagePath)).toBe(true);
      expect(item.stepKey).toBeTruthy();
    }
  });

  it("keeps public route discovery separate from authenticated data", () => {
    const route = fs.readFileSync(path.join(process.cwd(), "app/word-builders/[slug]/page.tsx"), "utf8");
    expect(route).toContain("generateStaticParams");
    expect(route).toContain("/start-free");
    expect(route).not.toContain("family_resources");
    expect(route).not.toContain("service_role");
    expect(getPublicWordBuilder("does-not-exist")).toBeNull();
  });

  it("produces the Pinterest bulk-upload columns and one row per creative", () => {
    const csv = fs.readFileSync(path.join(process.cwd(), "scripts/pinterest/output/word-builders-pinterest.csv"), "utf8").trim().split(/\r?\n/);
    expect(csv[0]).toBe('"Title","Media URL","Pinterest board","Thumbnail","Description","Link","Publish date","Keywords"');
    expect(csv.length - 1).toBe(PUBLIC_WORD_BUILDERS.length);
    const sitemap = fs.readFileSync(path.join(process.cwd(), "app/sitemap.ts"), "utf8");
    expect(sitemap).toContain("PUBLIC_WORD_BUILDERS");
  });
});

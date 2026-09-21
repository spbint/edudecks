import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("app/marketplace/page.tsx", "utf8");
const card = readFileSync("app/marketplace/MylearnaIncludedResourceCard.tsx", "utf8");
const detail = readFileSync("app/marketplace/mylearna/[handle]/page.tsx", "utf8");
const catalogue = readFileSync("lib/marketplace/mylearnaCatalog.ts", "utf8");

describe("first-party MyLearna Marketplace catalogue", () => {
  it("appears alongside Shopify without entering the cart flow", () => {
    expect(home).toContain("Included with MyLearna");
    expect(home).toContain("MYLEARNA_MARKETPLACE_RESOURCES");
    expect(card).toContain("Included with MyLearna Family");
    expect(detail).not.toContain("AddToCartPanel");
    expect(detail).not.toContain("useMarketplaceCart");
  });

  it("hands discovery into the authenticated Resource Cupboard and Pathways", () => {
    expect(detail).toContain('"/my-resources?add_marketplace="');
    expect(detail).toContain("Save to My Resource Cupboard");
    expect(detail).toContain("Open in My Pathways");
    expect(catalogue).toContain("pathwayHref:");
    expect(catalogue).toContain("MYL-CLASSICAL-Y34-A-U1-E01");
  });

  it("models encounter, unit, cycle, and future physical-pack hierarchy", () => {
    expect(catalogue).toContain('"encounter"');
    expect(catalogue).toContain('"unit"');
    expect(catalogue).toContain('"cycle"');
    expect(catalogue).toContain('"physical-pack"');
    expect(catalogue).toContain("unitBundleKey");
    expect(catalogue).toContain("cycleBundleKey");
    expect(catalogue).toContain("futurePhysicalPackSupported");
  });
});

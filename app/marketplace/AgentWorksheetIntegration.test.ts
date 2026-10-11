import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const marketplace = readFileSync("app/marketplace/page.tsx", "utf8");
const loader = readFileSync("lib/resourceFactory/marketplace.server.ts", "utf8");
const card = readFileSync("app/marketplace/AgentWorksheetCard.tsx", "utf8");
const detail = readFileSync(
  "app/marketplace/worksheets/[handle]/page.tsx",
  "utf8",
);
const pinterest = readFileSync(
  "app/api/resource-factory/pinterest/[handle]/route.ts",
  "utf8",
);
const worksheetPreviewRoute = readFileSync(
  "app/api/resource-factory/preview/[handle]/route.ts",
  "utf8",
);
const publisher = readFileSync("lib/resourceFactory/publish.server.ts", "utf8");
const previewRenderer = readFileSync(
  "lib/resourceFactory/pdfPreview.server.ts",
  "utf8",
);

describe("Resource Factory Marketplace integration", () => {
  it("keeps agent catalogue reads server-side and limited to active resources", () => {
    expect(loader).toContain('import "server-only"');
    expect(loader).toContain('.eq("source", "mylearna_agent")');
    expect(loader).toContain('.eq("is_active", true)');
    expect(loader).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("surfaces agent worksheets without replacing canonical curriculum", () => {
    expect(marketplace).toContain("MYLEARNA_MARKETPLACE_RESOURCES");
    expect(marketplace).toContain("listPublishedAgentMarketplaceResources");
    expect(marketplace).toContain("AgentWorksheetCard");
    expect(card).toContain("/marketplace/worksheets/");
  });

  it("routes agent resources through the existing Resource Cupboard flow", () => {
    expect(detail).toContain("add_marketplace=");
    expect(detail).toContain("buy_marketplace=");
    expect(detail).toContain("Save to My Resource Cupboard");
    expect(detail).toContain("Buy securely with Stripe");
  });

  it("does not expose direct paid worksheet or answer links", () => {
    expect(detail).toContain('const isPaid = accessModel === "paid"');
    expect(detail).toContain("!isPaid && worksheetHref");
    expect(detail).toContain("!isPaid && answersHref");
    expect(detail).toContain("current Marketplace entitlement");
  });

  it("renders and persists the preview from page 1 of the actual worksheet PDF", () => {
    expect(previewRenderer).toContain("PDFiumLibrary");
    expect(previewRenderer).toContain("document.pages()");
    expect(previewRenderer).toContain("firstPage.render");
    expect(previewRenderer).toContain('import sharp from "sharp"');
    expect(publisher).toContain("renderResourceFactoryWorksheetPreviewPng");
    expect(publisher).toContain("worksheet_preview_png");
    expect(publisher).toContain("-preview.png");
  });

  it("serves the stored preview PNG instead of rebuilding a worksheet image", () => {
    expect(worksheetPreviewRoute).toContain("preview_image_href");
    expect(worksheetPreviewRoute).toContain("NextResponse.redirect");
    expect(worksheetPreviewRoute).not.toContain("ImageResponse");
    expect(detail).toContain("/api/resource-factory/preview/");
    expect(card).toContain("/api/resource-factory/preview/");
    expect(pinterest).toContain('accessModel === "paid"');
  });

  it("does not reuse free SEO copy for paid resources", () => {
    expect(detail).toContain("!isPaid || !/\\bfree\\b/i.test(description)");
    expect(detail).toContain("priceLabel");
    expect(detail).toContain("Paid resource ·");
  });
});

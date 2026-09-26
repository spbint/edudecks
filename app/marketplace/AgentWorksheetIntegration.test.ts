import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const marketplace = readFileSync("app/marketplace/page.tsx", "utf8");
const loader = readFileSync("lib/resourceFactory/marketplace.server.ts", "utf8");
const card = readFileSync("app/marketplace/AgentWorksheetCard.tsx", "utf8");
const detail = readFileSync(
  "app/marketplace/worksheets/[handle]/page.tsx",
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
    expect(detail).toContain("Save to My Resource Cupboard");
    expect(detail).toContain("Save after purchase");
  });

  it("does not expose direct paid worksheet or answer links", () => {
    expect(detail).toContain('const isPaid = accessModel === "paid"');
    expect(detail).toContain("!isPaid && worksheetHref");
    expect(detail).toContain("!isPaid && answersHref");
    expect(detail).toContain("current Marketplace entitlement");
  });
});

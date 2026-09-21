import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cupboard = readFileSync(
  "app/components/clean/CleanResourceCupboardWorkspace.tsx",
  "utf8",
);
const day = readFileSync(
  "app/components/clean/CleanDayWorkspace.tsx",
  "utf8",
);
const queue = readFileSync(
  "lib/clean/onDeck/learningQueue.ts",
  "utf8",
);
const queueClient = readFileSync(
  "lib/clean/onDeck/client.ts",
  "utf8",
);

describe("Marketplace resource reuse across Cupboard and My Day", () => {
  it("saves a Marketplace handoff through the idempotent Cupboard client flow", () => {
    expect(cupboard).toContain('searchParams.get("add_marketplace")');
    expect(cupboard).toContain("saveMarketplaceResourceToCupboard");
    expect(cupboard).toContain("Saved to My Resource Cupboard.");
    expect(cupboard).toContain("MyLearna catalogue resources are referenced here without using your family PDF storage.");
  });

  it("lets a saved catalogue resource be selected and attached from My Day", () => {
    expect(day).toContain("familyResourceTypeLabel(resource.resourceType)");
    expect(day).toContain("input.resource?.familyResource ||");
    expect(day).toContain('resource.resourceType === "catalogue" && resource.marketplaceHref');
    expect(day).toContain("Open booklet");
    expect(day).toContain("resourceType: FamilyResourceType");
  });

  it("retains catalogue metadata through the On Deck read model", () => {
    expect(queue).toContain('"catalogue"');
    expect(queue).toContain("marketplaceExternalProductId");
    expect(queue).toContain("marketplaceHandle");
    expect(queue).toContain("marketplaceHref");
    expect(queueClient).toContain("marketplace_resource_id");
    expect(queueClient).toContain("marketplace_resource:marketplace_resources");
  });
});

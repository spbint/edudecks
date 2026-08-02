import { describe, expect, it } from "vitest";
import { parseShopifyDescription } from "./description";

describe("Shopify description formatting", () => {
  it("preserves paragraphs and bullet lists as semantic blocks", () => {
    expect(parseShopifyDescription("<p>Intro</p><ul><li>One</li><li>Two</li></ul>", "")).toEqual([
      { type: "paragraph", text: "Intro" },
      { type: "list", items: ["One", "Two"] },
    ]);
  });

  it("does not retain unsafe script content", () => {
    const blocks = parseShopifyDescription("<p>Safe</p><script>alert('x')</script>", "");
    expect(JSON.stringify(blocks)).not.toContain("alert");
  });

  it("turns plain bullet lines into a list", () => {
    expect(parseShopifyDescription("", "Intro\n• One\n• Two")).toEqual([
      { type: "paragraph", text: "Intro" },
      { type: "list", items: ["One", "Two"] },
    ]);
  });
});

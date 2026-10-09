import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "lib/clean/assessments/placement/numberOperationsP0Items.ts",
  ),
  "utf8",
);

function itemBlock(itemId: string) {
  const start = source.indexOf(`id: "${itemId}"`);
  if (start < 0) throw new Error(`Missing item ${itemId}`);
  const next = source.indexOf("\n  }),", start);
  return source.slice(start, next > start ? next : start + 3200);
}

describe("Money P1-P2 accessible visual safeguards", () => {
  it.each([
    "myl-search-mon-p01-b-v1",
    "myl-anchor-mon-p02-a-v1",
    "myl-anchor-mon-p02-b-v1",
  ])("%s avoids answer-revealing alt text and requires a practical alternative", (itemId) => {
    const item = itemBlock(itemId);
    expect(item).toContain("separate-accessible-form-required");
    expect(item).toContain("intentionally not stated");
  });

  it("removes the old denomination-revealing descriptions", () => {
    expect(source).not.toContain(
      "Money tokens shown in this order: 50c, $1, $2.",
    );
    expect(source).not.toContain(
      "Money tokens shown in this order: $2, 20c, $1, 50c.",
    );
    expect(source).not.toContain(
      "Money tokens shown in this order: 20c, $1, 20c, 50c, 20c.",
    );
  });
});

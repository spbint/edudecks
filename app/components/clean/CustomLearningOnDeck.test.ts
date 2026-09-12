import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const workspace = readFileSync("app/components/clean/CleanDayWorkspace.tsx", "utf8");

describe("custom learning On Deck entry point", () => {
  it("provides parent-only lightweight fields and an explicit On Deck action", () => {
    expect(workspace).toContain("Bring your own learning into focus.");
    expect(workspace).toContain('aria-label="Learner"');
    expect(workspace).toContain('aria-label="Title"');
    expect(workspace).toContain('aria-label="Learning area"');
    expect(workspace).toContain('aria-label="Note"');
    expect(workspace).toContain("Put On Deck");
    expect(workspace).toContain("createCustomLearningOnDeck");
  });

  it("keeps custom learning separate from Calendar quick add and core loading", () => {
    expect(workspace).toContain('sourceType: "custom_learning"');
    expect(workspace).toContain('surface: "my_day"');
    expect(workspace).not.toContain('onDeckItems && itemsLoading');
  });
});

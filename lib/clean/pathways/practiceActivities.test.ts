import { describe, expect, it } from "vitest";
import {
  makeNumbersTo10Practice,
} from "@/lib/clean/pathways/practiceActivities";

describe("maths CRA practice activities", () => {
  it("keeps the real canonical pathway step for the prototype", () => {
    expect(makeNumbersTo10Practice.pathwayStepId).toBe(
      "mathematics::number-and-place-value::foundation-kindergarten::partition-and-combine-small-collections-up-to-10",
    );
  });

  it("gives every practice task concrete, representational, and abstract support", () => {
    const tasks = makeNumbersTo10Practice.sections.flatMap((section) => section.tasks);

    expect(tasks.length).toBeGreaterThan(0);

    for (const task of tasks) {
      expect(task.concretePrompt, `${task.id} should include a concrete prompt`).toBeTruthy();
      expect(
        task.representationalPrompt,
        `${task.id} should include representational support`,
      ).toBeTruthy();
      expect(task.abstractPrompt, `${task.id} should include an abstract prompt`).toBeTruthy();
      expect(task.visual, `${task.id} should include a visual model`).toBeTruthy();
      expect(
        task.visualModelType,
        `${task.id} should declare the visual model type`,
      ).toBeTruthy();
    }
  });

  it("keeps mini-check prompts lighter but still visual and age-appropriate", () => {
    expect(makeNumbersTo10Practice.miniCheck.length).toBeGreaterThan(0);

    for (const task of makeNumbersTo10Practice.miniCheck) {
      expect(
        task.representationalPrompt,
        `${task.id} should keep a representational bridge in mini check`,
      ).toBeTruthy();
      expect(task.abstractPrompt, `${task.id} should include a clear prompt`).toBeTruthy();
      expect(task.visual, `${task.id} should include a visual model`).toBeTruthy();
      expect(task.visualModelType, `${task.id} should identify its visual`).toBeTruthy();
      expect(task.scaffoldLevel, `${task.id} should declare its scaffold level`).toBe("low");
    }
  });
});

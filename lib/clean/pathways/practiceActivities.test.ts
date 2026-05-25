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

  it("gives every practice task CRA support and instructional scaffolding", () => {
    const tasks = makeNumbersTo10Practice.sections.flatMap((section) => section.tasks);

    expect(tasks.length).toBeGreaterThan(0);

    for (const task of tasks) {
      expect(task.learningIntention, `${task.id} should include a learning intention`).toBeTruthy();
      expect(task.successCriteria, `${task.id} should include success criteria`).toBeTruthy();
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
      expect(task.feedbackPrompt, `${task.id} should include a feedback prompt`).toBeTruthy();
      expect(task.reflectionPrompt, `${task.id} should include a reflection prompt`).toBeTruthy();
      expect(
        task.misconceptionPrompt,
        `${task.id} should include a misconception check`,
      ).toBeTruthy();
      expect(task.oralResponseAllowed, `${task.id} should allow oral response`).toBe(true);
      expect(task.learnerAction, `${task.id} should describe the learner action`).toBeTruthy();
    }
  });

  it("keeps mini-check prompts lighter but still visual and age-appropriate", () => {
    expect(makeNumbersTo10Practice.miniCheck.length).toBeGreaterThan(0);

    for (const task of makeNumbersTo10Practice.miniCheck) {
      expect(task.learningIntention, `${task.id} should include a learning intention`).toBeTruthy();
      expect(task.successCriteria, `${task.id} should include success criteria`).toBeTruthy();
      expect(
        task.representationalPrompt,
        `${task.id} should keep a representational bridge in mini check`,
      ).toBeTruthy();
      expect(task.abstractPrompt, `${task.id} should include a clear prompt`).toBeTruthy();
      expect(task.visual, `${task.id} should include a visual model`).toBeTruthy();
      expect(task.visualModelType, `${task.id} should identify its visual`).toBeTruthy();
      expect(task.scaffoldLevel, `${task.id} should declare its scaffold level`).toBe("low");
      expect(task.feedbackPrompt, `${task.id} should include a feedback prompt`).toBeTruthy();
      expect(task.reflectionPrompt, `${task.id} should include a reflection prompt`).toBeTruthy();
      expect(
        task.misconceptionPrompt,
        `${task.id} should include a misconception check`,
      ).toBeTruthy();
      expect(task.oralResponseAllowed, `${task.id} should allow oral response`).toBe(true);
      expect(task.learnerAction, `${task.id} should describe the learner action`).toBeTruthy();
      expect(task.miniCheckVariant, `${task.id} should identify the mini check style`).toBeTruthy();
    }
  });
});

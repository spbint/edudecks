import { describe, expect, it, vi } from "vitest";

import { runResourceFactoryPipeline } from "@/lib/resourceFactory/runner";
import type {
  ResourceFactoryGenerationSeed,
  ResourceFactoryQaReport,
  ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

const seed: ResourceFactoryGenerationSeed = {
  resourceId: "MYL-AUTO-MATH-NPV-Y4-000002",
  slug: "year-4-number-practice",
  yearLevels: ["Year 4"],
  strand: "Number and place value",
  skill: "Compare whole numbers",
  resourceType: "practice",
  difficulty: "secure",
  questionCount: 4,
};

const spec: ResourceFactoryWorksheetSpec = {
  schemaVersion: 1,
  resourceId: seed.resourceId,
  slug: seed.slug,
  title: "Year 4 Number Practice",
  subject: "mathematics",
  strand: seed.strand,
  yearLevels: seed.yearLevels,
  skill: seed.skill,
  resourceType: seed.resourceType,
  difficulty: seed.difficulty,
  instructions: "Complete each question.",
  workedExample: { prompt: "2 or 3?", working: "3 is larger.", answer: "3" },
  questions: [
    { id: "1", prompt: "4 or 6?", answer: "6", working: "6 is larger.", choices: [], visualHint: "" },
    { id: "2", prompt: "8 or 5?", answer: "8", working: "8 is larger.", choices: [], visualHint: "" },
    { id: "3", prompt: "7 or 9?", answer: "9", working: "9 is larger.", choices: [], visualHint: "" },
    { id: "4", prompt: "3 or 1?", answer: "3", working: "3 is larger.", choices: [], visualHint: "" },
  ],
  parentNotes: "",
  seo: { title: "Year 4 Number Practice", description: "Practice comparing numbers.", keywords: [] },
  pinterest: { titles: ["A", "B", "C"], descriptions: ["A", "B", "C"], boardHint: "Maths" },
  provenance: { generator: "test", generatedAt: "2026-09-26T00:00:00.000Z" },
};

function report(answerScore: number): ResourceFactoryQaReport {
  return {
    factualScore: 95,
    answerScore,
    qualityScore: 90,
    issues: [],
    checkedAt: "2026-09-26T00:00:00.000Z",
    checker: "test",
  };
}

describe("runResourceFactoryPipeline", () => {
  it("retries a failed QA pass and renders only after a passing check", async () => {
    const generate = vi.fn(async () => spec);
    const qa = vi
      .fn()
      .mockResolvedValueOnce(report(50))
      .mockResolvedValueOnce(report(100));
    const renderWorksheet = vi.fn(async () => new Uint8Array([1, 2, 3]));
    const renderAnswers = vi.fn(async () => new Uint8Array([4, 5, 6]));

    const result = await runResourceFactoryPipeline({
      seed,
      dependencies: { generate, qa, renderWorksheet, renderAnswers },
      maxAttempts: 2,
    });

    expect(result.status).toBe("ready");
    expect(result.attempts).toBe(2);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(renderWorksheet).toHaveBeenCalledTimes(1);
    expect(renderAnswers).toHaveBeenCalledTimes(1);
  });

  it("returns qa_failed when no attempt clears the threshold", async () => {
    const result = await runResourceFactoryPipeline({
      seed,
      dependencies: {
        generate: vi.fn(async () => spec),
        qa: vi.fn(async () => report(20)),
        renderWorksheet: vi.fn(async () => new Uint8Array()),
        renderAnswers: vi.fn(async () => new Uint8Array()),
      },
      maxAttempts: 2,
    });

    expect(result.status).toBe("qa_failed");
    expect(result.attempts).toBe(2);
  });
});

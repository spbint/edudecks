import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { buildResourceFactoryMarketplaceProjection } from "@/lib/resourceFactory/marketplaceProjection";
import {
  buildResourceFactoryAnswerPdf,
  buildResourceFactoryWorksheetPdf,
} from "@/lib/resourceFactory/pdf";
import { evaluateResourceFactoryQa } from "@/lib/resourceFactory/qa";
import type {
  ResourceFactoryQaReport,
  ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

const spec: ResourceFactoryWorksheetSpec = {
  schemaVersion: 1,
  resourceId: "MYL-AUTO-MATH-NPV-Y4-000001",
  slug: "year-4-place-value-practice",
  title: "Year 4 Place Value Practice",
  subject: "mathematics",
  strand: "Number and place value",
  yearLevels: ["Year 4"],
  skill: "Use place value to read and compare whole numbers",
  resourceType: "practice",
  difficulty: "secure",
  instructions: "Complete each question. Show working where useful.",
  workedExample: {
    prompt: "What is the value of the 6 in 6,241?",
    working: "The 6 is in the thousands place.",
    answer: "6,000",
  },
  questions: [
    {
      id: "1",
      prompt: "What is the value of the 7 in 7,315?",
      answer: "7,000",
      working: "The 7 is in the thousands place.",
      choices: [],
      visualHint: "",
    },
    {
      id: "2",
      prompt: "Write 4,082 in expanded form.",
      answer: "4,000 + 80 + 2",
      working: "There are 4 thousands, 0 hundreds, 8 tens and 2 ones.",
      choices: [],
      visualHint: "",
    },
    {
      id: "3",
      prompt: "Which is greater: 5,403 or 5,340?",
      answer: "5,403",
      working: "The thousands match, then 4 hundreds is greater than 3 hundreds.",
      choices: [],
      visualHint: "",
    },
    {
      id: "4",
      prompt: "Write the number that is 100 more than 3,650.",
      answer: "3,750",
      working: "Add 100 to the hundreds place.",
      choices: [],
      visualHint: "",
    },
  ],
  parentNotes: "Ask your learner to explain how the place of a digit changes its value.",
  seo: {
    title: "Year 4 Place Value Worksheet",
    description: "A free Year 4 homeschool place value practice worksheet.",
    keywords: ["year 4 maths", "place value", "homeschool worksheet"],
  },
  pinterest: {
    titles: [
      "Year 4 Place Value Practice",
      "Free Place Value Worksheet",
      "Quick Homeschool Maths Practice",
    ],
    descriptions: [
      "Practise Year 4 place value with this MyLearna worksheet.",
      "A free printable place value worksheet for homeschool families.",
      "Short, focused maths practice with answers included.",
    ],
    boardHint: "Homeschool Maths",
  },
  provenance: {
    generator: "test-model",
    generatedAt: "2026-09-26T00:00:00.000Z",
  },
};

function qa(overrides: Partial<ResourceFactoryQaReport> = {}): ResourceFactoryQaReport {
  return {
    factualScore: 98,
    answerScore: 100,
    qualityScore: 90,
    issues: [],
    checkedAt: "2026-09-26T00:05:00.000Z",
    checker: "test-qa",
    ...overrides,
  };
}

describe("Resource Factory", () => {
  it("passes high-confidence resources while tolerating minor issues", () => {
    const result = evaluateResourceFactoryQa(
      qa({
        issues: [
          {
            severity: "minor",
            code: "WORDING",
            message: "One instruction could be shorter.",
            questionId: "",
          },
        ],
      }),
    );
    expect(result.decision).toBe("pass");
  });

  it("blocks critical QA issues", () => {
    const result = evaluateResourceFactoryQa(
      qa({
        issues: [
          {
            severity: "critical",
            code: "WRONG_ANSWER",
            message: "Question 2 has an incorrect answer.",
            questionId: "2",
          },
        ],
      }),
    );
    expect(result.decision).toBe("block");
  });

  it("projects passing resources into the agent marketplace lane", () => {
    const projection = buildResourceFactoryMarketplaceProjection({
      spec,
      qa: qa(),
      assets: {
        worksheetHref: "/resources/generated/test.pdf",
        answersHref: "/resources/generated/test-answers.pdf",
        thumbnailUrl: "",
        pinterestImageUrls: [],
      },
      active: true,
    });

    expect(projection.source).toBe("mylearna_agent");
    expect(projection.external_product_id).toBe(spec.resourceId);
    expect(projection.is_active).toBe(true);
    expect(projection.metadata).toMatchObject({
      pricing_state: "free_testing",
      access_model: "free_testing",
      skill: spec.skill,
    });
  });

  it("renders deterministic worksheet and answer PDFs", async () => {
    const worksheet = await buildResourceFactoryWorksheetPdf(spec);
    const answers = await buildResourceFactoryAnswerPdf(spec);

    const worksheetDoc = await PDFDocument.load(worksheet);
    const answerDoc = await PDFDocument.load(answers);

    expect(worksheetDoc.getPageCount()).toBeGreaterThan(0);
    expect(answerDoc.getPageCount()).toBeGreaterThan(0);
  });
});

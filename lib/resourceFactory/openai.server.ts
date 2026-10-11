import "server-only";

import {
  RESOURCE_FACTORY_SCHEMA_VERSION,
  type ResourceFactoryGenerationSeed,
  type ResourceFactoryQaReport,
  type ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

type OpenAIResponseEnvelope = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function generatorModelName() {
  return String(
    process.env.RESOURCE_FACTORY_GENERATOR_MODEL || "gpt-5.6-luna",
  ).trim();
}

function qaModelName() {
  return String(
    process.env.RESOURCE_FACTORY_QA_MODEL || "gpt-5.6-terra",
  ).trim();
}

function apiKey() {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  if (!key) {
    throw new Error("Resource Factory requires OPENAI_API_KEY.");
  }
  return key;
}

function extractOutputText(payload: OpenAIResponseEnvelope) {
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }
  throw new Error(payload.error?.message || "OpenAI returned no structured output.");
}

async function callStructuredJson<T>(input: {
  model: string;
  schemaName: string;
  schema: Record<string, unknown>;
  instructions: string;
  prompt: string;
}): Promise<T> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      store: false,
      instructions: input.instructions,
      input: input.prompt,
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          strict: true,
          schema: input.schema,
        },
      },
    }),
  });

  const payload = (await response.json()) as OpenAIResponseEnvelope;
  if (!response.ok) {
    throw new Error(
      payload.error?.message || `OpenAI request failed with HTTP ${response.status}.`,
    );
  }

  return JSON.parse(extractOutputText(payload)) as T;
}

const worksheetSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "instructions",
    "workedExample",
    "questions",
    "parentNotes",
    "seo",
    "pinterest",
  ],
  properties: {
    title: { type: "string" },
    instructions: { type: "string" },
    workedExample: {
      type: "object",
      additionalProperties: false,
      required: ["prompt", "working", "answer"],
      properties: {
        prompt: { type: "string" },
        working: { type: "string" },
        answer: { type: "string" },
      },
    },
    questions: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "prompt", "answer", "working", "choices", "visualHint"],
        properties: {
          id: { type: "string" },
          prompt: { type: "string" },
          answer: { type: "string" },
          working: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          visualHint: { type: "string" },
        },
      },
    },
    parentNotes: { type: "string" },
    seo: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "keywords"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
      },
    },
    pinterest: {
      type: "object",
      additionalProperties: false,
      required: ["titles", "descriptions", "boardHint"],
      properties: {
        titles: { type: "array", items: { type: "string" }, minItems: 3 },
        descriptions: { type: "array", items: { type: "string" }, minItems: 3 },
        boardHint: { type: "string" },
      },
    },
  },
};

const qaSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["factualScore", "answerScore", "qualityScore", "issues"],
  properties: {
    factualScore: { type: "number", minimum: 0, maximum: 100 },
    answerScore: { type: "number", minimum: 0, maximum: 100 },
    qualityScore: { type: "number", minimum: 0, maximum: 100 },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "code", "message", "questionId"],
        properties: {
          severity: {
            type: "string",
            enum: ["info", "minor", "major", "critical"],
          },
          code: { type: "string" },
          message: { type: "string" },
          questionId: { type: "string" },
        },
      },
    },
  },
};

export async function generateWorksheetSpecWithOpenAI(
  seed: ResourceFactoryGenerationSeed,
): Promise<ResourceFactoryWorksheetSpec> {
  const generated = await callStructuredJson<
    Omit<
      ResourceFactoryWorksheetSpec,
      | "schemaVersion"
      | "resourceId"
      | "slug"
      | "subject"
      | "strand"
      | "yearLevels"
      | "skill"
      | "resourceType"
      | "difficulty"
      | "pathwayStepId"
      | "stageKey"
      | "stepKey"
      | "provenance"
    >
  >({
    model: generatorModelName(),
    schemaName: "mylearna_resource_factory_worksheet",
    schema: worksheetSchema,
    instructions:
      "You create original MyLearna homeschool mathematics worksheets. Do not reproduce copyrighted passages, branded questions, or third-party worksheets. Use Australian English. Every answer must be correct and independently solvable from the prompt. Keep instructions concise and age-appropriate.",
    prompt: JSON.stringify({
      task: "Create one complete worksheet specification.",
      seed,
      exactQuestionCount: seed.questionCount,
      requirement:
        "Use unique question IDs starting at 1. Include complete answer and working fields for every question. Produce three distinct Pinterest title and description angles.",
    }),
  });

  return {
    schemaVersion: RESOURCE_FACTORY_SCHEMA_VERSION,
    resourceId: seed.resourceId,
    slug: seed.slug,
    subject: "mathematics",
    strand: seed.strand,
    yearLevels: seed.yearLevels,
    skill: seed.skill,
    resourceType: seed.resourceType,
    difficulty: seed.difficulty,
    pathwayStepId: seed.pathwayStepId,
    stageKey: seed.stageKey,
    stepKey: seed.stepKey,
    ...generated,
    provenance: {
      generator: generatorModelName(),
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function qaWorksheetSpecWithOpenAI(
  spec: ResourceFactoryWorksheetSpec,
): Promise<ResourceFactoryQaReport> {
  const checked = await callStructuredJson<
    Omit<ResourceFactoryQaReport, "checkedAt" | "checker">
  >({
    model: qaModelName(),
    schemaName: "mylearna_resource_factory_qa",
    schema: qaSchema,
    instructions:
      "You are the independent MyLearna QA checker. Assume the author may be wrong. Solve every mathematics question independently, compare the stated answer, identify ambiguity or age-level mismatch, and flag any content that appears copied or unsafe. Critical means the resource should never publish as-is.",
    prompt: JSON.stringify({
      task: "Audit this worksheet specification.",
      worksheet: spec,
    }),
  });

  return {
    ...checked,
    checkedAt: new Date().toISOString(),
    checker: qaModelName(),
  };
}

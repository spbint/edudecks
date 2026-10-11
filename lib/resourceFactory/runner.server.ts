import "server-only";

import {
  generateWorksheetSpecWithOpenAI,
  qaWorksheetSpecWithOpenAI,
} from "@/lib/resourceFactory/openai.server";
import {
  buildResourceFactoryAnswerPdf,
  buildResourceFactoryWorksheetPdf,
} from "@/lib/resourceFactory/pdf";
import {
  runResourceFactoryPipeline,
  type ResourceFactoryRun,
} from "@/lib/resourceFactory/runner";
import type { ResourceFactoryGenerationSeed } from "@/lib/resourceFactory/types";

export function runResourceFactorySeed(
  seed: ResourceFactoryGenerationSeed,
): Promise<ResourceFactoryRun> {
  return runResourceFactoryPipeline({
    seed,
    maxAttempts: 2,
    dependencies: {
      generate: generateWorksheetSpecWithOpenAI,
      qa: qaWorksheetSpecWithOpenAI,
      renderWorksheet: buildResourceFactoryWorksheetPdf,
      renderAnswers: buildResourceFactoryAnswerPdf,
    },
  });
}

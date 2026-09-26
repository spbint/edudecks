import { evaluateResourceFactoryQa } from "@/lib/resourceFactory/qa";
import type {
  ResourceFactoryGenerationSeed,
  ResourceFactoryQaReport,
  ResourceFactoryWorksheetSpec,
} from "@/lib/resourceFactory/types";

export type ResourceFactoryRunnerDependencies = {
  generate: (
    seed: ResourceFactoryGenerationSeed,
  ) => Promise<ResourceFactoryWorksheetSpec>;
  qa: (spec: ResourceFactoryWorksheetSpec) => Promise<ResourceFactoryQaReport>;
  renderWorksheet: (spec: ResourceFactoryWorksheetSpec) => Promise<Uint8Array>;
  renderAnswers: (spec: ResourceFactoryWorksheetSpec) => Promise<Uint8Array>;
};

export type ResourceFactoryReadyRun = {
  status: "ready";
  attempts: number;
  spec: ResourceFactoryWorksheetSpec;
  qa: ResourceFactoryQaReport;
  worksheetPdf: Uint8Array;
  answerPdf: Uint8Array;
};

export type ResourceFactoryFailedRun = {
  status: "qa_failed";
  attempts: number;
  spec: ResourceFactoryWorksheetSpec;
  qa: ResourceFactoryQaReport;
};

export type ResourceFactoryRun = ResourceFactoryReadyRun | ResourceFactoryFailedRun;

export async function runResourceFactoryPipeline(input: {
  seed: ResourceFactoryGenerationSeed;
  dependencies: ResourceFactoryRunnerDependencies;
  maxAttempts?: number;
}): Promise<ResourceFactoryRun> {
  const maxAttempts = Math.max(1, Math.min(4, input.maxAttempts ?? 2));
  let latestSpec: ResourceFactoryWorksheetSpec | null = null;
  let latestQa: ResourceFactoryQaReport | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    latestSpec = await input.dependencies.generate(input.seed);
    latestQa = await input.dependencies.qa(latestSpec);
    const decision = evaluateResourceFactoryQa(latestQa);

    if (decision.decision === "pass") {
      const [worksheetPdf, answerPdf] = await Promise.all([
        input.dependencies.renderWorksheet(latestSpec),
        input.dependencies.renderAnswers(latestSpec),
      ]);
      return {
        status: "ready",
        attempts: attempt,
        spec: latestSpec,
        qa: latestQa,
        worksheetPdf,
        answerPdf,
      };
    }
  }

  if (!latestSpec || !latestQa) {
    throw new Error("Resource Factory completed without producing a worksheet.");
  }

  return {
    status: "qa_failed",
    attempts: maxAttempts,
    spec: latestSpec,
    qa: latestQa,
  };
}

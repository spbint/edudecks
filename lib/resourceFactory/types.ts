export const RESOURCE_FACTORY_SCHEMA_VERSION = 1 as const;

export type ResourceFactoryJobStatus =
  | "planned"
  | "generating"
  | "generated"
  | "qa"
  | "qa_failed"
  | "repairing"
  | "rendering"
  | "ready"
  | "staged"
  | "published"
  | "promoted"
  | "failed";

export type ResourceFactoryDifficulty =
  | "foundation"
  | "developing"
  | "secure"
  | "challenge";

export type ResourceFactoryType =
  | "practice"
  | "revision"
  | "skill-check"
  | "challenge";

export type ResourceFactoryGenerationSeed = {
  resourceId: string;
  slug: string;
  yearLevels: string[];
  strand: string;
  skill: string;
  resourceType: ResourceFactoryType;
  difficulty: ResourceFactoryDifficulty;
  questionCount: number;
  pathwayStepId?: string;
  stageKey?: string;
  stepKey?: string;
};

export type ResourceFactoryQuestion = {
  id: string;
  prompt: string;
  answer: string;
  working: string;
  choices: string[];
  visualHint: string;
};

export type ResourceFactoryWorksheetSpec = {
  schemaVersion: typeof RESOURCE_FACTORY_SCHEMA_VERSION;
  resourceId: string;
  slug: string;
  title: string;
  subject: "mathematics";
  strand: string;
  yearLevels: string[];
  skill: string;
  resourceType: ResourceFactoryType;
  difficulty: ResourceFactoryDifficulty;
  pathwayStepId?: string;
  stageKey?: string;
  stepKey?: string;
  instructions: string;
  workedExample: {
    prompt: string;
    working: string;
    answer: string;
  };
  questions: ResourceFactoryQuestion[];
  parentNotes: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  pinterest: {
    titles: string[];
    descriptions: string[];
    boardHint: string;
  };
  provenance: {
    generator: string;
    generatedAt: string;
  };
};

export type ResourceFactoryQaSeverity =
  | "info"
  | "minor"
  | "major"
  | "critical";

export type ResourceFactoryQaIssue = {
  severity: ResourceFactoryQaSeverity;
  code: string;
  message: string;
  questionId: string;
};

export type ResourceFactoryQaReport = {
  factualScore: number;
  answerScore: number;
  qualityScore: number;
  issues: ResourceFactoryQaIssue[];
  checkedAt: string;
  checker: string;
};

export type ResourceFactoryQaDecision = "pass" | "retry" | "block";

export type ResourceFactoryAssets = {
  worksheetHref: string;
  answersHref: string;
  thumbnailUrl: string;
  pinterestImageUrls: string[];
};

export type ResourceFactoryMarketplaceProjection = {
  source: "mylearna_agent";
  external_product_id: string;
  external_variant_id: null;
  handle: string;
  title: string;
  thumbnail_url: string;
  marketplace_area: string;
  primary_collection: string;
  subcollection: string;
  resource_format: "worksheet-pdf";
  is_active: boolean;
  metadata: Record<string, unknown>;
};

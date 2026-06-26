export type LearnaMathStrandCode = "NPV" | "OC" | "FDP" | "APF" | "MEA" | "GSR";

export type LearnaMathStrandKey =
  | "number-and-place-value"
  | "operations-and-calculation"
  | "fractions-decimals-percentages"
  | "algebra-patterns-and-functions"
  | "measurement"
  | "geometry-and-spatial-reasoning";

export type LearnaStrandConfig = {
  key: LearnaMathStrandKey;
  code: LearnaMathStrandCode;
  label: string;
  shortLabel: string;
  colour: string;
};

export type LearnaEvidenceMetricInput = {
  id: string;
  learnerId: string;
  observedOn: string;
  title: string | null;
  whatHappened: string;
  reflection: string | null;
  learningArea: string | null;
  curriculumNodeIds: string[];
  attachmentUrls: string[];
  imageUrl: string | null;
  includeInPortfolio: boolean;
  includeInReport: boolean;
  createdAt: string | null;
};

export type LearnaTrendPoint = {
  weekStart: string;
  label: string;
  count: number;
};

export type LearnaStrandSummary = LearnaStrandConfig & {
  totalSteps: number;
  secureSteps: number;
  evidenceCount: number;
  reportReadyCount: number;
  latestStatus: string | null;
  radarValue: number;
};

export type LearnaMilestone = {
  id: string;
  label: string;
  active: boolean;
};

export type MathematicsDetailedStrandStep = {
  id: number;
  title: string;
  meaning: string;
  skillFocus: string;
  learningIntention: string;
  successCriteria: string[];
  practiceActivity: string;
  evidenceExamples: string[];
  assessmentCheck: string;
  nextStep: string;
  reportLanguage: string;
};

export type MathematicsDetailedStrandStage = {
  key: string;
  title: string;
  helper: string;
  steps: MathematicsDetailedStrandStep[];
};

export type MathematicsDetailedStrandWorkspace = {
  key: string;
  title: string;
  subtitle: string;
  pathwayLabel: string;
  relationshipTitle: string;
  relationshipCopy: string;
  currentFocusStageKey: string;
  stages: MathematicsDetailedStrandStage[];
  portfolioSupport: string[];
  reportingSupport: string[];
};

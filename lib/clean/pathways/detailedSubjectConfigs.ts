import {
  MATHEMATICS_DOMAIN_CARDS,
  type PathwayStageKey,
  buildNumberAndPlaceValueWorkspace,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import { buildOperationsAndCalculationWorkspace } from "@/lib/clean/pathways/mathematicsOperationsPrototype";
import { buildFractionsDecimalsPercentagesWorkspace } from "@/lib/clean/pathways/mathematicsFractionsPrototype";
import {
  buildAlgebraPatternsAndFunctionsWorkspace,
  buildFinancialAndRealWorldMathematicsWorkspace,
  buildGeometryAndSpatialReasoningWorkspace,
  buildMathematicalReasoningModellingAndExplanationWorkspace,
  buildMeasurementWorkspace,
  buildProbabilityAndChanceWorkspace,
  buildRatioAndProportionalReasoningWorkspace,
  buildStatisticsAndDataWorkspace,
} from "@/lib/clean/pathways/mathematicsAdditionalStrands";
import {
  DEFAULT_ENGLISH_STRAND_KEY,
  ENGLISH_DOMAIN_CARDS,
  ENGLISH_STRAND_WORKSPACE_BUILDERS,
  ENGLISH_SUBJECT_OVERVIEW,
} from "@/lib/clean/pathways/englishPathways";
import {
  DEFAULT_SCIENCE_STRAND_KEY,
  SCIENCE_DOMAIN_CARDS,
  SCIENCE_STRAND_WORKSPACE_BUILDERS,
  SCIENCE_SUBJECT_OVERVIEW,
} from "@/lib/clean/pathways/sciencePathways";
import {
  DEFAULT_TECHNOLOGIES_STRAND_KEY,
  TECHNOLOGIES_DOMAIN_CARDS,
  TECHNOLOGIES_STRAND_WORKSPACE_BUILDERS,
  TECHNOLOGIES_SUBJECT_OVERVIEW,
} from "@/lib/clean/pathways/technologiesPathways";
import {
  ARTS_DOMAIN_CARDS,
  ARTS_STRAND_WORKSPACE_BUILDERS,
  ARTS_SUBJECT_OVERVIEW,
  DEFAULT_ARTS_STRAND_KEY,
} from "@/lib/clean/pathways/artsPathways";
import {
  DEFAULT_HEALTH_PE_STRAND_KEY,
  HEALTH_PE_DOMAIN_CARDS,
  HEALTH_PE_STRAND_WORKSPACE_BUILDERS,
  HEALTH_PE_SUBJECT_OVERVIEW,
} from "@/lib/clean/pathways/healthPePathways";
import {
  DEFAULT_HUMANITIES_STRAND_KEY,
  HUMANITIES_DOMAIN_CARDS,
  HUMANITIES_STRAND_WORKSPACE_BUILDERS,
  HUMANITIES_SUBJECT_OVERVIEW,
} from "@/lib/clean/pathways/humanitiesSocialSciencesPathways";
import type {
  MathematicsDetailedStrandWorkspace,
} from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

export const NUMBER_AND_PLACE_VALUE_STRAND_KEY = "number-and-place-value";

export type PathwayWorkspaceBuilder = (
  currentFocusStageKey: PathwayStageKey,
) => MathematicsDetailedStrandWorkspace;

export type DetailedSubjectConfig = {
  defaultStrandKey: string;
  domainCards: SubjectStrandCard[];
  workspaceBuilders: Record<string, PathwayWorkspaceBuilder>;
  overviewEyebrow: string;
  overviewTitle: string;
  overviewDescription: string;
  overviewHelper: string;
};

export const MATHEMATICS_STRAND_WORKSPACE_BUILDERS: Record<string, PathwayWorkspaceBuilder> = {
  [NUMBER_AND_PLACE_VALUE_STRAND_KEY]: buildNumberAndPlaceValueWorkspace,
  "operations-and-calculation": buildOperationsAndCalculationWorkspace,
  "fractions-decimals-percentages": buildFractionsDecimalsPercentagesWorkspace,
  "ratio-and-proportional-reasoning": buildRatioAndProportionalReasoningWorkspace,
  "algebra-patterns-and-functions": buildAlgebraPatternsAndFunctionsWorkspace,
  measurement: buildMeasurementWorkspace,
  "geometry-and-spatial-reasoning": buildGeometryAndSpatialReasoningWorkspace,
  "statistics-and-data": buildStatisticsAndDataWorkspace,
  "probability-and-chance": buildProbabilityAndChanceWorkspace,
  "financial-and-real-world-mathematics": buildFinancialAndRealWorldMathematicsWorkspace,
  "mathematical-reasoning-modelling-and-explanation":
    buildMathematicalReasoningModellingAndExplanationWorkspace,
};

export const DETAILED_SUBJECT_CONFIGS: Partial<
  Record<PathwaySubjectKey, DetailedSubjectConfig>
> = {
  mathematics: {
    defaultStrandKey: NUMBER_AND_PLACE_VALUE_STRAND_KEY,
    domainCards: MATHEMATICS_DOMAIN_CARDS,
    workspaceBuilders: MATHEMATICS_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: "Mathematics F-10 / K-10 domain map",
    overviewTitle: "Mathematics pathway overview",
    overviewDescription:
      "Mathematics in MyLearna is organised as a progression map, not a checklist. Each strand shows earlier steps, the current learner focus, and the next progression so you can plan calmly and capture evidence over time.",
    overviewHelper:
      "Choose one strand, review the current developmental band, then use practise, assess, and capture evidence to build reporting confidence.",
  },
  english: {
    defaultStrandKey: DEFAULT_ENGLISH_STRAND_KEY,
    domainCards: ENGLISH_DOMAIN_CARDS,
    workspaceBuilders: ENGLISH_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: ENGLISH_SUBJECT_OVERVIEW.eyebrow,
    overviewTitle: ENGLISH_SUBJECT_OVERVIEW.title,
    overviewDescription: ENGLISH_SUBJECT_OVERVIEW.description,
    overviewHelper: ENGLISH_SUBJECT_OVERVIEW.helper,
  },
  science: {
    defaultStrandKey: DEFAULT_SCIENCE_STRAND_KEY,
    domainCards: SCIENCE_DOMAIN_CARDS,
    workspaceBuilders: SCIENCE_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: SCIENCE_SUBJECT_OVERVIEW.eyebrow,
    overviewTitle: SCIENCE_SUBJECT_OVERVIEW.title,
    overviewDescription: SCIENCE_SUBJECT_OVERVIEW.description,
    overviewHelper: SCIENCE_SUBJECT_OVERVIEW.helper,
  },
  humanities: {
    defaultStrandKey: DEFAULT_HUMANITIES_STRAND_KEY,
    domainCards: HUMANITIES_DOMAIN_CARDS,
    workspaceBuilders: HUMANITIES_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: HUMANITIES_SUBJECT_OVERVIEW.eyebrow,
    overviewTitle: HUMANITIES_SUBJECT_OVERVIEW.title,
    overviewDescription: HUMANITIES_SUBJECT_OVERVIEW.description,
    overviewHelper: HUMANITIES_SUBJECT_OVERVIEW.helper,
  },
  technologies: {
    defaultStrandKey: DEFAULT_TECHNOLOGIES_STRAND_KEY,
    domainCards: TECHNOLOGIES_DOMAIN_CARDS,
    workspaceBuilders: TECHNOLOGIES_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: TECHNOLOGIES_SUBJECT_OVERVIEW.eyebrow,
    overviewTitle: TECHNOLOGIES_SUBJECT_OVERVIEW.title,
    overviewDescription: TECHNOLOGIES_SUBJECT_OVERVIEW.description,
    overviewHelper: TECHNOLOGIES_SUBJECT_OVERVIEW.helper,
  },
  arts: {
    defaultStrandKey: DEFAULT_ARTS_STRAND_KEY,
    domainCards: ARTS_DOMAIN_CARDS,
    workspaceBuilders: ARTS_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: ARTS_SUBJECT_OVERVIEW.eyebrow,
    overviewTitle: ARTS_SUBJECT_OVERVIEW.title,
    overviewDescription: ARTS_SUBJECT_OVERVIEW.description,
    overviewHelper: ARTS_SUBJECT_OVERVIEW.helper,
  },
  "health-pe": {
    defaultStrandKey: DEFAULT_HEALTH_PE_STRAND_KEY,
    domainCards: HEALTH_PE_DOMAIN_CARDS,
    workspaceBuilders: HEALTH_PE_STRAND_WORKSPACE_BUILDERS,
    overviewEyebrow: HEALTH_PE_SUBJECT_OVERVIEW.eyebrow,
    overviewTitle: HEALTH_PE_SUBJECT_OVERVIEW.title,
    overviewDescription: HEALTH_PE_SUBJECT_OVERVIEW.description,
    overviewHelper: HEALTH_PE_SUBJECT_OVERVIEW.helper,
  },
};

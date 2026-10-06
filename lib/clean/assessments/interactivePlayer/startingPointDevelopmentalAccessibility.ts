import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

export type StartingPointDevelopmentalStage =
  | "junior-primary-p1"
  | "junior-primary-p2"
  | "junior-primary-p3"
  | "developing-p4-p6"
  | "extending-p7-p10";

export type StartingPointReadAloudClassification =
  | "listen-essential"
  | "listen-recommended"
  | "listen-available";

export type StartingPointStimulusCoverage =
  | "canonical-visual"
  | "presentation-visual"
  | "text-or-symbol-sufficient";

export type StartingPointPresentationStimulus =
  | {
      type: "counter-groups";
      groups: number[];
      action?: "combine" | "remove" | "share";
      removeCount?: number;
      recipientCount?: number;
    }
  | {
      type: "closed-groups";
      groups: number[];
      objectLabel: "counters" | "markers" | "objects";
    }
  | {
      type: "currency-repeat";
      count: number;
      denomination: "20c" | "50c" | "$1" | "$2";
    };

export type StartingPointDevelopmentalAccessibility = {
  developmentalStage: StartingPointDevelopmentalStage;
  readAloud: StartingPointReadAloudClassification;
  stimulusCoverage: StartingPointStimulusCoverage;
  presentationStimulus: StartingPointPresentationStimulus | null;
};

const PRESENTATION_STIMULI: Readonly<Record<string, StartingPointPresentationStimulus>> = {
  "myl-recheck-add-p01-a-v1": { type: "counter-groups", groups: [4], action: "remove", removeCount: 1 },
  "myl-recheck-add-p01-b-v1": { type: "counter-groups", groups: [1, 3], action: "combine" },
  "myl-search-add-p01-a-v1": { type: "counter-groups", groups: [3, 1], action: "combine" },
  "myl-search-add-p01-b-v1": { type: "counter-groups", groups: [2, 1], action: "combine" },
  "myl-recheck-add-p02-a-v1": { type: "counter-groups", groups: [4, 3], action: "combine" },
  "myl-recheck-add-p02-b-v1": { type: "counter-groups", groups: [8], action: "remove", removeCount: 3 },
  "myl-search-add-p02-a-v1": { type: "counter-groups", groups: [3, 2], action: "combine" },
  "myl-search-add-p02-b-v1": { type: "counter-groups", groups: [7], action: "remove", removeCount: 2 },
  "myl-recheck-add-p03-a-v1": { type: "closed-groups", groups: [6, 2], objectLabel: "counters" },
  "myl-recheck-add-p03-b-v1": { type: "closed-groups", groups: [3, 4], objectLabel: "counters" },
  "myl-anchor-add-p03-a-v1": { type: "closed-groups", groups: [5, 3], objectLabel: "counters" },
  "myl-anchor-add-p03-b-v1": { type: "closed-groups", groups: [4, 2], objectLabel: "counters" },
  "myl-recheck-mul-p01-a-v1": { type: "counter-groups", groups: [8], action: "share", recipientCount: 2 },
  "myl-recheck-mul-p01-b-v1": { type: "counter-groups", groups: [3, 3], action: "combine" },
  "myl-search-mul-p01-a-v1": { type: "counter-groups", groups: [6], action: "share", recipientCount: 2 },
  "myl-search-mul-p01-b-v1": { type: "counter-groups", groups: [2, 2, 2], action: "combine" },
  "myl-recheck-mul-p02-a-v1": { type: "counter-groups", groups: [4, 4, 4], action: "combine" },
  "myl-recheck-mul-p02-b-v1": { type: "counter-groups", groups: [10], action: "share", recipientCount: 5 },
  "myl-search-mul-p02-a-v1": { type: "counter-groups", groups: [2, 2, 2, 2], action: "combine" },
  "myl-search-mul-p02-b-v1": { type: "counter-groups", groups: [8], action: "share", recipientCount: 4 },
  "myl-recheck-mul-p03-a-v1": { type: "closed-groups", groups: [4, 4, 4, 4, 4], objectLabel: "markers" },
  "myl-recheck-mul-p03-b-v1": { type: "closed-groups", groups: [7, 7], objectLabel: "objects" },
  "myl-anchor-mul-p03-a-v1": { type: "closed-groups", groups: [5, 5, 5, 5], objectLabel: "markers" },
  "myl-anchor-mul-p03-b-v1": { type: "closed-groups", groups: [6, 6, 6], objectLabel: "objects" },
  "myl-recheck-mon-p03-a-v1": { type: "currency-repeat", count: 6, denomination: "20c" },
  "myl-recheck-mon-p03-b-v1": { type: "currency-repeat", count: 4, denomination: "$2" },
  "myl-boundary-mon-p03-a-v1": { type: "currency-repeat", count: 4, denomination: "50c" },
  "myl-boundary-mon-p03-b-v1": { type: "currency-repeat", count: 5, denomination: "$1" },
  "myl-boundary-mon-p03-c-v1": { type: "currency-repeat", count: 3, denomination: "20c" },
  "myl-boundary-cnt-p03-c-v1": { type: "counter-groups", groups: [5] },
};

function progressionLevel(item: MyLearnaAssessmentItem) {
  const tag = item.analytics?.tags?.find((candidate) => /^p\d+$/i.test(candidate));
  if (!tag) throw new Error(`Starting Point item ${item.id} has no progression tag.`);
  return Number(tag.slice(1));
}

export function classifyStartingPointDevelopmentalAccessibility(
  item: MyLearnaAssessmentItem,
): StartingPointDevelopmentalAccessibility {
  const pLevel = progressionLevel(item);
  const presentationStimulus = PRESENTATION_STIMULI[item.id] ?? null;
  return {
    developmentalStage:
      pLevel === 1 ? "junior-primary-p1" :
      pLevel === 2 ? "junior-primary-p2" :
      pLevel === 3 ? "junior-primary-p3" :
      pLevel <= 6 ? "developing-p4-p6" : "extending-p7-p10",
    readAloud:
      pLevel === 1 ? "listen-essential" :
      pLevel <= 3 ? "listen-recommended" : "listen-available",
    stimulusCoverage:
      item.stimulus.type !== "none" ? "canonical-visual" :
      presentationStimulus ? "presentation-visual" : "text-or-symbol-sufficient",
    presentationStimulus,
  };
}

export function hasStartingPointPresentationStimulus(itemId: string) {
  return Object.hasOwn(PRESENTATION_STIMULI, itemId);
}

export function getStartingPointReadAloudText(item: MyLearnaAssessmentItem) {
  const optionLabels = item.response.options?.map((option) =>
    String(option.label ?? option.value).trim(),
  ).filter(Boolean) ?? [];
  return [item.prompt.trim(), ...optionLabels.map((label, index) =>
    `Choice ${index + 1}. ${label}`,
  )].filter(Boolean).join(" ");
}

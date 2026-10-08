import type { LearningEvidenceDevelopmentalStatus } from "./learningEvidenceResult";
import type { NumberOperationsLearningProfileV1 } from "./numberOperationsLearningProfile";

export const MATHEMATICS_LEARNING_PROFILE_PRESENTATION_SCHEMA =
  "mylearna-mathematics-learning-profile-presentation" as const;
export const MATHEMATICS_LEARNING_PROFILE_PRESENTATION_VERSION = 1 as const;

export const MATHEMATICS_LEARNING_PROFILE_STATUS_COPY: Record<
  LearningEvidenceDevelopmentalStatus,
  { label: string; explanation: string }
> = {
  secure: {
    label: "Secure",
    explanation: "Current evidence suggests this learning is well established.",
  },
  consolidating: {
    label: "Consolidating",
    explanation:
      "Current evidence is positive, with some further practice likely to strengthen consistency.",
  },
  developing: {
    label: "Developing",
    explanation:
      "This learning is emerging and is a useful place to continue building.",
  },
  "needs-support": {
    label: "Needs support",
    explanation:
      "This area would benefit from direct support and carefully sequenced practice.",
  },
  "not-enough-evidence": {
    label: "Not enough evidence",
    explanation:
      "MyLearna does not yet have enough evidence to make a useful judgement.",
  },
  "practical-confirmation-required": {
    label: "Practical confirmation required",
    explanation:
      "This learning is better confirmed through a practical observation than from the electronic assessment alone.",
  },
};

export type MathematicsLearningProfilePresentationV1 = {
  schema: typeof MATHEMATICS_LEARNING_PROFILE_PRESENTATION_SCHEMA;
  schemaVersion: typeof MATHEMATICS_LEARNING_PROFILE_PRESENTATION_VERSION;
  title: "MyLearna Mathematics Learning Profile";
  scope: {
    label: "Number & Operations Starting Point";
    shortLabel: "Number & Operations profile";
    statement: string;
    wholeMathematicsCoverage: false;
  };
  learner: {
    displayName: string;
  };
  assessment: {
    name: "MyLearna Maths Starting Point — Number & Operations";
    assessedAt: string;
    assessedDateLabel: string;
    attemptKind: "initial" | "recheck";
    attemptLabel: "Original profile" | "Recheck profile";
  };
  overview: {
    headline: string;
    explanation: string;
    independenceStatement: string;
  };
  areas: MathematicsLearningProfileAreaPresentation[];
  evidenceGuide: {
    heading: string;
    paragraphs: string[];
    parentControlStatement: string;
  };
  actions: {
    printLabel: string;
    downloadLabel: string;
  };
};

export type MathematicsLearningProfileAreaPresentation = {
  continuumId: NumberOperationsLearningProfileV1["continua"][number]["continuumId"];
  areaName: string;
  status: LearningEvidenceDevelopmentalStatus;
  statusLabel: string;
  statusExplanation: string;
  evidence: {
    sufficiencyLabel: string;
    conciseStatement: string;
    whyStatement: string;
    limitationStatement: string | null;
    practicalConfirmationLabel: string;
  };
  learningPosition: {
    heading: string;
    explanation: string;
  };
  nextLearning: {
    available: boolean;
    heading: string;
    explanation: string;
    actionLabel: string | null;
    href: string | null;
    handoffKind: "broad-practice-family" | "pathways-review" | null;
    pathwayMutation: "not-requested";
  };
};

function formatAssessmentDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error("Mathematics Learning Profile requires a valid assessed date.");
  }
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function sufficiencyCopy(
  continuum: NumberOperationsLearningProfileV1["continua"][number],
) {
  if (continuum.evidenceSufficiency.state === "sufficient") {
    return {
      label: "Enough electronic evidence",
      statement:
        "Responses from this Starting Point check provided enough evidence for a useful learning direction.",
    };
  }
  if (continuum.evidenceSufficiency.state === "limited") {
    return {
      label: "Limited electronic evidence",
      statement:
        "The electronic responses provide a useful direction, but another form of evidence is needed before making a stronger judgement.",
    };
  }
  if (
    continuum.evidenceSufficiency.state === "unavailable" ||
    continuum.evidenceSufficiency.state === "not-enough-evidence"
  ) {
    return {
      label: "Evidence unavailable",
      statement:
        "MyLearna does not yet have usable evidence for this area and has left the judgement open.",
    };
  }
  if (continuum.evidenceSufficiency.state === "unresolved") {
    return {
      label: "Evidence still open",
      statement:
        "The available electronic evidence did not support a reliable judgement, so MyLearna has left this area open.",
    };
  }
  return {
    label: "Not assessed in this check",
    statement:
      "This area was not included in this focused check, so no judgement has been made.",
  };
}

function learningPositionCopy(
  continuum: NumberOperationsLearningProfileV1["continua"][number],
) {
  if (continuum.progression.kind === "band") {
    return {
      heading: "A useful learning range was identified",
      explanation:
        "The responses point to a learning range where continued teaching and practice should be useful.",
    };
  }
  if (continuum.progression.kind === "endpoint") {
    return continuum.progression.endpointRelation === "at-least"
      ? {
          heading: "Ready to continue beyond the checked learning",
          explanation:
            "Current evidence supports moving into more advanced learning in this area.",
        }
      : {
          heading: "Begin with the earlier foundations",
          explanation:
            "Current evidence suggests that carefully sequenced foundation learning is the most useful place to begin.",
        };
  }
  return {
    heading: "The starting point is still open",
    explanation:
      "MyLearna has not converted incomplete evidence into a learning judgement.",
  };
}

function nextLearningCopy(
  continuum: NumberOperationsLearningProfileV1["continua"][number],
): MathematicsLearningProfileAreaPresentation["nextLearning"] {
  const recommendation = continuum.recommendedNextLearning;
  if (!recommendation) {
    return {
      available: false,
      heading: "Collect useful evidence next",
      explanation:
        "Use a practical observation or a later check before selecting a specific next learning step.",
      actionLabel: null,
      href: null,
      handoffKind: null,
      pathwayMutation: "not-requested",
    };
  }

  const copyByCategory: Record<string, { heading: string; explanation: string }> = {
    "practice-next-level": {
      heading: `Continue building ${continuum.displayLabel.toLowerCase()}`,
      explanation:
        "Use the identified learning direction for focused practice, then check again with fresh evidence.",
    },
    "verify-with-observation": {
      heading: "Confirm this learning in a practical setting",
      explanation:
        "Watch this learning in an everyday or hands-on task before treating the electronic result as established.",
    },
    "support-and-recheck": {
      heading: "Strengthen the foundations",
      explanation:
        "Use supported, practical learning and collect fresh evidence before narrowing the starting point.",
    },
    "extend-beyond-progression": {
      heading: "Continue with more advanced learning",
      explanation:
        "Use the broader Mathematics learning pathway to choose the next appropriately challenging work.",
    },
  };
  const copy = copyByCategory[recommendation.category] ?? {
    heading: "Continue from this learning point",
    explanation:
      "Use MyLearna's recorded recommendation to choose the next learning experience.",
  };

  return {
    available: true,
    ...copy,
    actionLabel: "Continue learning",
    href: recommendation.handoffTarget.href,
    handoffKind: recommendation.handoffTarget.kind,
    pathwayMutation: recommendation.pathwayMutation,
  };
}

function presentArea(
  continuum: NumberOperationsLearningProfileV1["continua"][number],
): MathematicsLearningProfileAreaPresentation {
  const statusCopy = MATHEMATICS_LEARNING_PROFILE_STATUS_COPY[continuum.developmentalStatus];
  const sufficiency = sufficiencyCopy(continuum);
  const practicalRequired = continuum.practicalConfirmation.state === "required";
  const notAssessed = continuum.evidenceSufficiency.state === "unknown";

  return {
    continuumId: continuum.continuumId,
    areaName: continuum.displayLabel,
    status: continuum.developmentalStatus,
    statusLabel: statusCopy.label,
    statusExplanation: statusCopy.explanation,
    evidence: {
      sufficiencyLabel: sufficiency.label,
      conciseStatement: sufficiency.statement,
      whyStatement: notAssessed
        ? "This focused Starting Point check did not include this area, so MyLearna has kept it unknown."
        : practicalRequired
          ? "This area needs practical confirmation because the relevant learning cannot be fully demonstrated through the electronic question set alone."
          : "MyLearna used responses from this Starting Point check to identify a useful next learning point.",
      limitationStatement: practicalRequired
        ? "A parent or teacher observation should be considered before relying on this interpretation."
        : continuum.evidenceSufficiency.state === "sufficient"
          ? null
          : "The current interpretation is deliberately limited by the evidence available.",
      practicalConfirmationLabel: practicalRequired
        ? "Practical confirmation required"
        : continuum.practicalConfirmation.state === "confirmed"
          ? "Practical evidence confirmed"
          : "No practical confirmation required",
    },
    learningPosition: learningPositionCopy(continuum),
    nextLearning: nextLearningCopy(continuum),
  };
}

export function presentMathematicsLearningProfile(input: {
  profile: NumberOperationsLearningProfileV1;
  learnerDisplayName?: string | null;
}): MathematicsLearningProfilePresentationV1 {
  const learnerDisplayName = String(input.learnerDisplayName ?? "").trim();
  return {
    schema: MATHEMATICS_LEARNING_PROFILE_PRESENTATION_SCHEMA,
    schemaVersion: MATHEMATICS_LEARNING_PROFILE_PRESENTATION_VERSION,
    title: "MyLearna Mathematics Learning Profile",
    scope: {
      label: "Number & Operations Starting Point",
      shortLabel: "Number & Operations profile",
      statement:
        "This profile covers five Number & Operations areas. It is not a complete assessment of all Mathematics learning.",
      wholeMathematicsCoverage: false,
    },
    learner: {
      displayName: learnerDisplayName || "Learner",
    },
    assessment: {
      name: "MyLearna Maths Starting Point — Number & Operations",
      assessedAt: input.profile.assessedAt,
      assessedDateLabel: formatAssessmentDate(input.profile.assessedAt),
      attemptKind: input.profile.assessment.attemptKind,
      attemptLabel:
        input.profile.assessment.attemptKind === "recheck"
          ? "Recheck profile"
          : "Original profile",
    },
    overview: {
      headline: "Here is a useful starting point",
      explanation:
        "The profile shows where learning appears ready to continue and where MyLearna needs more evidence.",
      independenceStatement:
        "Each area is interpreted independently. A strength in one area never hides a different area that is still developing or unresolved.",
    },
    areas: input.profile.continua.map(presentArea),
    evidenceGuide: {
      heading: "Understanding the evidence",
      paragraphs: [
        "Electronic responses can identify useful learning directions, but they cannot demonstrate every kind of mathematical understanding.",
        "When evidence is incomplete or a practical demonstration is more appropriate, MyLearna leaves the area open rather than treating missing evidence as failure.",
        "There is no overall Maths score because the five Number & Operations areas develop independently.",
      ],
      parentControlStatement:
        "This profile does not automatically add evidence to Portfolio or change My Pathways. A parent or teacher remains in control of how the result is used.",
    },
    actions: {
      printLabel: "Print profile",
      downloadLabel: "Download PDF",
    },
  };
}

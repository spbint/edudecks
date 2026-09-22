export type ClassicalEncounterReleaseState = "live" | "planned";
export type ClassicalResourceType = "booklet-pdf";
export type ClassicalBandKey = "years-3-4";
export type ClassicalCycleKey = "a";
export type ClassicalUnitKey = "first-civilisations";
export type ClassicalMarketplaceAccessModel = "family_included";
export type ClassicalMarketplaceEntitlementKey = "family_subscription";
export type ClassicalMarketplaceScope = "encounter";

export type ClassicalEncounterDefinition = {
  curriculumKey: "mylearna-classical";
  curriculumCode: string;
  encounterKey: string;
  encounterNumber: number;
  title: string;
  releaseState: ClassicalEncounterReleaseState;
  hierarchy: {
    bandKey: ClassicalBandKey;
    bandLabel: string;
    cycleKey: ClassicalCycleKey;
    cycleLabel: string;
    unitKey: ClassicalUnitKey;
    unitLabel: string;
    encounterLabel: string;
  };
  pathway: {
    subjectKey: "classical";
    strandKey: string;
    stageKey: string;
    stepKey: string;
    pathwayStepId: string;
  };
  academic: {
    bigQuestion: string;
    coreConcept: string;
    meaning: string;
    skillFocus: string;
    learningIntention: string;
    successCriteria: readonly string[];
    practiceActivity: string;
    evidenceExamples: readonly string[];
    assessmentCheck: string;
    nextStep: string;
    reportLanguage: string;
  };
  resource: {
    resourceType: ClassicalResourceType;
    bookletKey: string;
    fileName: string;
    pdfHref: string;
    pageImageUrls: readonly string[];
    includesAnswerGuidance: boolean;
    pdfMetadata: {
      title: string;
      author: string;
      subject: string;
      keywords: readonly string[];
    };
  };
  distribution: {
    externalProductId: string;
    marketplaceHandle: string;
    marketplaceArea: string;
    collection: string;
    subcollection: string;
    description: string;
    scope: ClassicalMarketplaceScope;
    accessModel: ClassicalMarketplaceAccessModel;
    entitlementKey: ClassicalMarketplaceEntitlementKey;
    unitBundleKey: string;
    cycleBundleKey: string;
    futurePhysicalPackSupported: boolean;
  };
};

const ENCOUNTER_ONE = {
  curriculumKey: "mylearna-classical",
  curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E01",
  encounterKey: "years-3-4-cycle-a-unit-1-encounter-1",
  encounterNumber: 1,
  title: "From Wandering to Settlement",
  releaseState: "live",
  hierarchy: {
    bandKey: "years-3-4",
    bandLabel: "Years 3–4",
    cycleKey: "a",
    cycleLabel: "Cycle A: The Ancient World",
    unitKey: "first-civilisations",
    unitLabel: "Unit 1: The First Civilisations",
    encounterLabel: "Encounter 1",
  },
  pathway: {
    subjectKey: "classical",
    strandKey: "history-and-civilisation",
    stageKey: "middle-primary",
    stepKey: "from-wandering-to-settlement",
    pathwayStepId:
      "classical::history-and-civilisation::middle-primary::from-wandering-to-settlement",
  },
  academic: {
    bigQuestion: "Why would people choose to live in one place?",
    coreConcept: "From mobile communities to early settled farming communities",
    meaning:
      "Understand how farming helped some communities remain in one place for longer and how food storage and surplus could support increasingly complex settlements.",
    skillFocus:
      "historical narration, cause and effect, early civilisation vocabulary, map orientation, and evidence-based explanation",
    learningIntention:
      "I am learning how farming helped some communities build more permanent settlements.",
    successCriteria: [
      "I can explain at least one relationship between agriculture and permanent settlement.",
      "I can use key words such as agriculture, settlement, domesticate, and surplus accurately.",
      "I can compare a moving community with a settled farming community.",
      "I can narrate an important idea from the encounter in my own words.",
    ],
    practiceActivity:
      "Use the MyLearna Classical Encounter 1 booklet. Read and discuss the learning pages, complete the compare-and-sort and map work, narrate the learning, then choose Level A or Level B writing and reasoning tasks.",
    evidenceExamples: [
      "a completed map or compare-and-sort activity",
      "an oral or written narration",
      "copywork, prepared dictation, or a reasoning paragraph",
      "a photographed notebook page or parent discussion note",
    ],
    assessmentCheck:
      "Can the learner explain how farming made permanent settlement more practical, using at least one accurate cause-and-effect relationship rather than only defining vocabulary?",
    nextStep:
      "Continue to Encounter 2: Rivers and Civilisation — why did so many early civilisations grow near rivers?",
    reportLanguage:
      "The learner is developing understanding of how changes in food production contributed to permanent settlement and increasingly complex communities, and can communicate this understanding through narration, map work, and historical reasoning.",
  },
  resource: {
    resourceType: "booklet-pdf",
    bookletKey: "y3-4-a-u1-e01",
    fileName:
      "MyLearna-Classical-Y3-4-Cycle-A-Encounter-1-From-Wandering-to-Settlement.pdf",
    pdfHref: "/api/classical/booklets/y3-4-a-u1-e01",
    pageImageUrls: [
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-01.png?v=1789982608",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-02.png?v=1789982615",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-03.png?v=1789982645",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-04.png?v=1789982654",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-05.png?v=1789982664",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-06.png?v=1789982674",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-07.png?v=1789982683",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-08.png?v=1789982692",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-09.png?v=1789982699",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e01-page-10.png?v=1789982708",
    ],
    includesAnswerGuidance: true,
    pdfMetadata: {
      title: "MyLearna Classical - Encounter 1 - From Wandering to Settlement",
      author: "MyLearna",
      subject: "Years 3-4 · Cycle A: The Ancient World · Unit 1: The First Civilisations",
      keywords: [
        "MyLearna Classical",
        "homeschool curriculum",
        "ancient world",
        "history",
        "Years 3-4",
      ],
    },
  },
  distribution: {
    externalProductId: "MYL-CLASSICAL-Y34-A-U1-E01",
    marketplaceHandle: "classical-y3-4-a-u1-e01-from-wandering-to-settlement",
    marketplaceArea: "Curriculum",
    collection: "MyLearna Classical",
    subcollection: "Years 3–4 · Cycle A: The Ancient World",
    description:
      "A complete MyLearna Classical encounter exploring how farming helped some communities move toward more permanent settlement. The branded booklet combines knowledge, vocabulary, map work, narration, grammar, writing, reasoning and portfolio-ready evidence.",
    scope: "encounter",
    accessModel: "family_included",
    entitlementKey: "family_subscription",
    unitBundleKey: "classical-y3-4-a-u1",
    cycleBundleKey: "classical-y3-4-a",
    futurePhysicalPackSupported: true,
  },
} as const satisfies ClassicalEncounterDefinition;

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function expectedPathwayStepId(encounter: ClassicalEncounterDefinition) {
  return [
    encounter.pathway.subjectKey,
    encounter.pathway.strandKey,
    encounter.pathway.stageKey,
    encounter.pathway.stepKey,
  ].join("::");
}

export function validateClassicalCurriculumRegistry(
  encounters: readonly ClassicalEncounterDefinition[],
) {
  const curriculumCodes = new Set<string>();
  const encounterKeys = new Set<string>();
  const pathwayStepIds = new Set<string>();
  const bookletKeys = new Set<string>();
  const externalProductIds = new Set<string>();
  const liveMarketplaceHandles = new Set<string>();

  for (const encounter of encounters) {
    const requiredStableKeys = {
      curriculumCode: encounter.curriculumCode,
      encounterKey: encounter.encounterKey,
      bandKey: encounter.hierarchy.bandKey,
      cycleKey: encounter.hierarchy.cycleKey,
      unitKey: encounter.hierarchy.unitKey,
      subjectKey: encounter.pathway.subjectKey,
      strandKey: encounter.pathway.strandKey,
      stageKey: encounter.pathway.stageKey,
      stepKey: encounter.pathway.stepKey,
      pathwayStepId: encounter.pathway.pathwayStepId,
      bookletKey: encounter.resource.bookletKey,
      externalProductId: encounter.distribution.externalProductId,
      marketplaceHandle: encounter.distribution.marketplaceHandle,
      unitBundleKey: encounter.distribution.unitBundleKey,
      cycleBundleKey: encounter.distribution.cycleBundleKey,
    };

    for (const [key, value] of Object.entries(requiredStableKeys)) {
      if (!normalize(value)) {
        throw new Error(`Classical encounter ${encounter.encounterKey || "definition"} has an empty ${key}.`);
      }
    }

    if (encounter.pathway.pathwayStepId !== expectedPathwayStepId(encounter)) {
      throw new Error(
        `Classical encounter ${encounter.encounterKey} pathwayStepId does not match its component identity.`,
      );
    }

    const uniqueValues: Array<[string, string, Set<string>]> = [
      ["curriculum code", encounter.curriculumCode, curriculumCodes],
      ["encounter key", encounter.encounterKey, encounterKeys],
      ["pathway step id", encounter.pathway.pathwayStepId, pathwayStepIds],
      ["booklet key", encounter.resource.bookletKey, bookletKeys],
      [
        "Marketplace external product ID",
        encounter.distribution.externalProductId,
        externalProductIds,
      ],
    ];

    if (encounter.releaseState === "live") {
      uniqueValues.push([
        "Marketplace handle",
        encounter.distribution.marketplaceHandle,
        liveMarketplaceHandles,
      ]);
    }

    for (const [label, value, seen] of uniqueValues) {
      const normalizedValue = normalize(value).toLowerCase();
      if (seen.has(normalizedValue)) {
        throw new Error(`Duplicate Classical ${label} "${value}".`);
      }
      seen.add(normalizedValue);
    }
  }
}

const definitions = [ENCOUNTER_ONE] as const satisfies readonly ClassicalEncounterDefinition[];
validateClassicalCurriculumRegistry(definitions);

export const CLASSICAL_CURRICULUM_REGISTRY: readonly ClassicalEncounterDefinition[] =
  Object.freeze([...definitions]);

export const MYLEARNA_CLASSICAL_ENCOUNTER_ONE = ENCOUNTER_ONE;

const BY_CURRICULUM_CODE = new Map(
  CLASSICAL_CURRICULUM_REGISTRY.map((encounter) => [
    encounter.curriculumCode.toUpperCase(),
    encounter,
  ]),
);
const BY_PATHWAY_STEP_ID = new Map(
  CLASSICAL_CURRICULUM_REGISTRY.map((encounter) => [encounter.pathway.pathwayStepId, encounter]),
);
const BY_MARKETPLACE_HANDLE = new Map(
  CLASSICAL_CURRICULUM_REGISTRY.filter((encounter) => encounter.releaseState === "live").map(
    (encounter) => [encounter.distribution.marketplaceHandle.toLowerCase(), encounter],
  ),
);
const BY_BOOKLET_KEY = new Map(
  CLASSICAL_CURRICULUM_REGISTRY.filter((encounter) => encounter.releaseState === "live").map(
    (encounter) => [encounter.resource.bookletKey.toLowerCase(), encounter],
  ),
);

export function getLiveClassicalEncounters() {
  return CLASSICAL_CURRICULUM_REGISTRY.filter(
    (encounter) => encounter.releaseState === "live",
  );
}

export function getClassicalEncounterByCurriculumCode(curriculumCode: string) {
  return BY_CURRICULUM_CODE.get(normalize(curriculumCode).toUpperCase()) ?? null;
}

export function getClassicalEncounterByPathwayStepId(pathwayStepId: string) {
  return BY_PATHWAY_STEP_ID.get(normalize(pathwayStepId)) ?? null;
}

export function getClassicalEncounterByPathwayIdentity(identity: {
  subjectKey: string;
  strandKey: string;
  stageKey: string;
  stepKey: string;
}) {
  const pathwayStepId = [
    identity.subjectKey,
    identity.strandKey,
    identity.stageKey,
    identity.stepKey,
  ].map(normalize).join("::");
  return getClassicalEncounterByPathwayStepId(pathwayStepId);
}

export function getClassicalEncounterByMarketplaceHandle(handle: string) {
  return BY_MARKETPLACE_HANDLE.get(normalize(handle).toLowerCase()) ?? null;
}

export function getLiveClassicalEncounterByBookletKey(bookletKey: string) {
  return BY_BOOKLET_KEY.get(normalize(bookletKey).toLowerCase()) ?? null;
}

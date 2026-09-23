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
    encounterBundleKey: string;
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
    encounterBundleKey: "classical-y3-4-a-u1-e01",
    unitBundleKey: "classical-y3-4-a-u1",
    cycleBundleKey: "classical-y3-4-a",
    futurePhysicalPackSupported: true,
  },
} as const satisfies ClassicalEncounterDefinition;


const ENCOUNTER_TWO = {
  curriculumKey: "mylearna-classical",
  curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E02",
  encounterKey: "years-3-4-cycle-a-unit-1-encounter-2",
  encounterNumber: 2,
  title: "Rivers and Civilisation",
  releaseState: "live",
  hierarchy: {
    bandKey: "years-3-4",
    bandLabel: "Years 3–4",
    cycleKey: "a",
    cycleLabel: "Cycle A: The Ancient World",
    unitKey: "first-civilisations",
    unitLabel: "Unit 1: The First Civilisations",
    encounterLabel: "Encounter 2",
  },
  pathway: {
    subjectKey: "classical",
    strandKey: "history-and-civilisation",
    stageKey: "middle-primary",
    stepKey: "rivers-and-civilisation",
    pathwayStepId:
      "classical::history-and-civilisation::middle-primary::rivers-and-civilisation",
  },
  academic: {
    bigQuestion: "Why did so many early civilisations grow near rivers?",
    coreConcept: "Rivers as foundations for early civilisations",
    meaning:
      "Understand how rivers provided water, fertile soil, food, transport and trade routes that helped settlements grow, while also creating challenges such as flooding and changing water levels.",
    skillFocus:
      "historical narration, cause and effect, river-civilisation vocabulary, map orientation, comparison, and evidence-based reasoning",
    learningIntention:
      "I am learning why many early civilisations grew near rivers.",
    successCriteria: [
      "I can explain at least two ways rivers helped early settlements grow.",
      "I can use key words such as floodplain, irrigation, silt, and civilisation accurately.",
      "I can locate major early river-civilisation regions on a map.",
      "I can explain one advantage and one challenge of living near a river.",
    ],
    practiceActivity:
      "Use the MyLearna Classical Encounter 2 booklet. Read and discuss the learning pages, sort river advantages and challenges, complete the river-civilisation map work, narrate the learning, then choose Level A or Level B writing and reasoning tasks.",
    evidenceExamples: [
      "a completed river-civilisation map",
      "a river advantage and challenge compare-and-sort activity",
      "an oral or written narration",
      "copywork, prepared dictation, a reasoning response, or a photographed notebook page",
    ],
    assessmentCheck:
      "Can the learner explain why rivers helped early civilisations grow by describing at least two benefits and one challenge, using accurate cause-and-effect reasoning rather than only recalling vocabulary?",
    nextStep:
      "Continue through Unit 1: The First Civilisations by building on how settlement, rivers, food production, movement, and trade shaped increasingly complex communities.",
    reportLanguage:
      "The learner is developing understanding of why many early civilisations grew near rivers and can explain how water, fertile land, transport and trade supported settlement growth while recognising challenges such as flooding.",
  },
  resource: {
    resourceType: "booklet-pdf",
    bookletKey: "y3-4-a-u1-e02",
    fileName:
      "MyLearna-Classical-Y3-4-Cycle-A-Encounter-2-Rivers-and-Civilisation.pdf",
    pdfHref: "/api/classical/booklets/y3-4-a-u1-e02",
    pageImageUrls: [
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-01.png?v=1790144115",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-02.png?v=1790144124",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-03.png?v=1790144136",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-04.png?v=1790144146",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-05.png?v=1790144155",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-06.png?v=1790144166",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-07.png?v=1790144177",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-08.png?v=1790144187",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-09.png?v=1790144199",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e02-page-10.png?v=1790144210",
    ],
    includesAnswerGuidance: true,
    pdfMetadata: {
      title: "MyLearna Classical - Encounter 2 - Rivers and Civilisation",
      author: "MyLearna",
      subject: "Years 3-4 · Cycle A: The Ancient World · Unit 1: The First Civilisations",
      keywords: [
        "MyLearna Classical",
        "homeschool curriculum",
        "ancient world",
        "river civilisations",
        "history",
        "Years 3-4",
      ],
    },
  },
  distribution: {
    externalProductId: "MYL-CLASSICAL-Y34-A-U1-E02",
    marketplaceHandle: "classical-y3-4-a-u1-e02-rivers-and-civilisation",
    marketplaceArea: "Curriculum",
    collection: "MyLearna Classical",
    subcollection: "Years 3–4 · Cycle A: The Ancient World",
    description:
      "A complete MyLearna Classical encounter exploring why many early civilisations grew near rivers. The branded booklet combines knowledge, vocabulary, compare-and-sort work, map work, narration, grammar, writing, reasoning and portfolio-ready evidence.",
    scope: "encounter",
    accessModel: "family_included",
    entitlementKey: "family_subscription",
    encounterBundleKey: "classical-y3-4-a-u1-e02",
    unitBundleKey: "classical-y3-4-a-u1",
    cycleBundleKey: "classical-y3-4-a",
    futurePhysicalPackSupported: true,
  },
} as const satisfies ClassicalEncounterDefinition;


const ENCOUNTER_FIVE = {
  curriculumKey: "mylearna-classical",
  curriculumCode: "MYL-CLASSICAL-Y34-A-U1-E05",
  encounterKey: "years-3-4-cycle-a-unit-1-encounter-5",
  encounterNumber: 5,
  title: "Trade, Travel and Exchange",
  releaseState: "live",
  hierarchy: {
    bandKey: "years-3-4",
    bandLabel: "Years 3–4",
    cycleKey: "a",
    cycleLabel: "Cycle A: The Ancient World",
    unitKey: "first-civilisations",
    unitLabel: "Unit 1: The First Civilisations",
    encounterLabel: "Encounter 5",
  },
  pathway: {
    subjectKey: "classical",
    strandKey: "history-and-civilisation",
    stageKey: "middle-primary",
    stepKey: "trade-travel-and-exchange",
    pathwayStepId:
      "classical::history-and-civilisation::middle-primary::trade-travel-and-exchange",
  },
  academic: {
    bigQuestion: "How did goods, people and ideas connect early civilisations?",
    coreConcept: "Trade, travel and exchange connected early civilisations",
    meaning:
      "Understand how exchange moved goods, people and ideas between early communities through land and water routes, and how historians use evidence to reason about those connections.",
    skillFocus:
      "historical narration, trade and route vocabulary, map interpretation, comparison, evidence-based inference, and balanced reasoning",
    learningIntention:
      "I am learning how trade, travel and exchange connected early civilisations.",
    successCriteria: [
      "I can explain why communities traded.",
      "I can describe how goods travelled by land and water.",
      "I can use words such as trade, route, cargo, trader, and exchange accurately.",
      "I can explain how ideas and techniques could travel with people.",
      "I can describe evidence before making a cautious historical inference.",
    ],
    practiceActivity:
      "Use the MyLearna Classical Encounter 5 booklet. Read and discuss the learning pages, compare land and water routes, complete the trade-route map work, narrate the learning, then complete the grammar, writing and reasoning tasks.",
    evidenceExamples: [
      "a completed trade-route map",
      "a land-route and water-route compare-and-sort activity",
      "an oral or written narration",
      "copywork, prepared dictation, a reasoning response, or a photographed booklet page",
    ],
    assessmentCheck:
      "Can the learner explain how trade connected early communities by describing why people exchanged goods, how goods travelled, and how ideas could move with people, while recognising at least one challenge or limit?",
    nextStep:
      "Continue through Unit 1 by building on how exchange connected early civilisations and carried materials, techniques and ideas between places.",
    reportLanguage:
      "The learner is developing understanding of how exchange connected early societies through the movement of goods, people and ideas, and can use maps, vocabulary and evidence-based reasoning to explain those connections.",
  },
  resource: {
    resourceType: "booklet-pdf",
    bookletKey: "y3-4-a-u1-e05",
    fileName:
      "MyLearna-Classical-Y3-4-Cycle-A-Encounter-5-Trade-Travel-and-Exchange.pdf",
    pdfHref: "/api/classical/booklets/y3-4-a-u1-e05",
    pageImageUrls: [
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-01.png?v=1790163493",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-02.png?v=1790163502",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-03.png?v=1790163513",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-04.png?v=1790163522",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-05.png?v=1790163532",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-06.png?v=1790163543",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-07.png?v=1790163552",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-08.png?v=1790163561",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-09.png?v=1790163570",
      "https://cdn.shopify.com/s/files/1/0888/9529/1710/files/mylearna-classical-y3-4-a-u1-e05-page-10.png?v=1790163580",
    ],
    includesAnswerGuidance: true,
    pdfMetadata: {
      title: "MyLearna Classical - Encounter 5 - Trade, Travel and Exchange",
      author: "MyLearna",
      subject: "Years 3-4 · Cycle A: The Ancient World · Unit 1: The First Civilisations",
      keywords: [
        "MyLearna Classical",
        "homeschool curriculum",
        "ancient world",
        "trade",
        "travel",
        "exchange",
        "history",
        "Years 3-4",
      ],
    },
  },
  distribution: {
    externalProductId: "MYL-CLASSICAL-Y34-A-U1-E05",
    marketplaceHandle: "classical-y3-4-a-u1-e05-trade-travel-and-exchange",
    marketplaceArea: "Curriculum",
    collection: "MyLearna Classical",
    subcollection: "Years 3–4 · Cycle A: The Ancient World",
    description:
      "A complete MyLearna Classical encounter exploring how goods, people and ideas connected early civilisations. The branded booklet combines knowledge, illustrated vocabulary, land-and-water route comparison, map work, narration, grammar, writing, reasoning and portfolio-ready evidence.",
    scope: "encounter",
    accessModel: "family_included",
    entitlementKey: "family_subscription",
    encounterBundleKey: "classical-y3-4-a-u1-e05",
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
  const encounterBundleKeys = new Set<string>();
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
      encounterBundleKey: encounter.distribution.encounterBundleKey,
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
      [
        "catalogue encounter bundle key",
        encounter.distribution.encounterBundleKey,
        encounterBundleKeys,
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

const definitions = [ENCOUNTER_ONE, ENCOUNTER_TWO, ENCOUNTER_FIVE] as const satisfies readonly ClassicalEncounterDefinition[];
validateClassicalCurriculumRegistry(definitions);

export const CLASSICAL_CURRICULUM_REGISTRY: readonly ClassicalEncounterDefinition[] =
  Object.freeze([...definitions]);

export const MYLEARNA_CLASSICAL_ENCOUNTER_ONE = ENCOUNTER_ONE;
export const MYLEARNA_CLASSICAL_ENCOUNTER_TWO = ENCOUNTER_TWO;
export const MYLEARNA_CLASSICAL_ENCOUNTER_FIVE = ENCOUNTER_FIVE;

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

export function getLiveClassicalEncounters(
  encounters: readonly ClassicalEncounterDefinition[] = CLASSICAL_CURRICULUM_REGISTRY,
) {
  return encounters.filter(
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

export function getLiveClassicalEncounterByBookletKey(
  bookletKey: string,
  encounters: readonly ClassicalEncounterDefinition[] = CLASSICAL_CURRICULUM_REGISTRY,
) {
  if (encounters === CLASSICAL_CURRICULUM_REGISTRY) {
    return BY_BOOKLET_KEY.get(normalize(bookletKey).toLowerCase()) ?? null;
  }
  const normalizedBookletKey = normalize(bookletKey).toLowerCase();
  return (
    encounters.find(
      (encounter) =>
        encounter.releaseState === "live" &&
        encounter.resource.bookletKey.toLowerCase() === normalizedBookletKey,
    ) ?? null
  );
}

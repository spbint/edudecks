import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

type HassStepInput = {
  id: number;
  title: string;
  meaning: string;
  skillFocus: string;
  practiceActivity: string;
  evidenceExamples: string[];
  nextStep: string;
  reportLanguage: string;
  learningIntention?: string;
  successCriteria?: string[];
  assessmentCheck?: string;
};

type HassStageInput = {
  key: PathwayStageKey;
  helper: string;
  steps: [HassStepInput, HassStepInput];
};

type HassStrandConfig = {
  key: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  portfolioSupport: string[];
  reportingSupport: string[];
  stages: HassStageInput[];
};

type StrandBuilder = (currentFocusStageKey: PathwayStageKey) => MathematicsDetailedStrandWorkspace;

const STAGE_TITLES: Record<PathwayStageKey, string> = {
  "foundation-kindergarten": "Foundation / Kindergarten",
  "lower-primary": "Lower Primary",
  "middle-primary": "Middle Primary",
  "upper-primary": "Upper Primary",
  "lower-secondary": "Lower Secondary",
  "years-9-10-consolidation": "Years 9-10 / consolidation",
};

function buildHassStep(step: HassStepInput) {
  return {
    id: step.id,
    title: step.title,
    meaning: step.meaning,
    skillFocus: step.skillFocus,
    learningIntention:
      step.learningIntention ||
      `Develop ${step.skillFocus} through discussion, comparison, source work, observation, and explanation.`,
    successCriteria: step.successCriteria || [
      "The learner can use this idea in a familiar humanities task or discussion.",
      "The learner can show or explain what was noticed, compared, or concluded.",
      "The learner can respond to questions or feedback about evidence, sources, or reasoning.",
    ],
    practiceActivity: step.practiceActivity,
    evidenceExamples: step.evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      "Later, check whether the learner can use this idea more independently and explain what evidence or reasoning supports it.",
    nextStep: step.nextStep,
    reportLanguage: step.reportLanguage,
  };
}

function buildHassWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: HassStrandConfig,
): MathematicsDetailedStrandWorkspace {
  return {
    key: config.key,
    trackingKey: config.key,
    title: config.title,
    subtitle: config.subtitle,
    pathwayLabel: `${config.title} pathway`,
    relationshipTitle: config.relationshipTitle,
    relationshipCopy: config.relationshipCopy,
    currentFocusStageKey,
    stages: config.stages.map((stage) => ({
      key: stage.key,
      title: STAGE_TITLES[stage.key],
      helper: stage.helper,
      steps: stage.steps.map(buildHassStep),
    })),
    portfolioSupport: config.portfolioSupport,
    reportingSupport: config.reportingSupport,
  };
}

export const DEFAULT_HUMANITIES_STRAND_KEY = "history-and-change-over-time";

export const HUMANITIES_SUBJECT_OVERVIEW = {
  eyebrow: "Humanities & Social Sciences F-10 / K-10 strand map",
  title: "Humanities & Social Sciences pathway overview",
  description:
    "This first Humanities & Social Sciences build shows history, geography, civics, economics, cultures, and inquiry as connected strands. Families may also recognise this area as Social Studies, HASS, or Humanities.",
  helper:
    "Choose one strand to explore. The selected strand opens in the focused workspace below, so the subject stays guided and readable rather than turning into a long content wall.",
};

export const HUMANITIES_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "history-and-change-over-time",
    title: "History and change over time",
    description:
      "Explore personal, local, and wider history through sequencing, sources, continuity, change, and significance.",
    whyItMatters:
      "History helps learners understand how people, communities, and decisions change over time and how evidence shapes historical understanding.",
    status: "first-detailed",
  },
  {
    key: "geography-place-and-environment",
    title: "Geography, place and environment",
    description:
      "Develop place knowledge, mapping, environmental understanding, spatial thinking, and human-environment connection.",
    whyItMatters:
      "Geography connects place, environment, movement, maps, and human decisions in ways that help learners understand the world around them.",
    status: "detailed",
  },
  {
    key: "civics-community-and-citizenship",
    title: "Civics, community and citizenship",
    description:
      "Build understanding of roles, fairness, participation, rules, responsibilities, and community decision-making.",
    whyItMatters:
      "Civics supports respectful discussion, community understanding, and thoughtful participation in shared life.",
    status: "detailed",
  },
  {
    key: "economics-resources-and-decision-making",
    title: "Economics, resources and decision-making",
    description:
      "Explore needs, wants, resources, choices, money, trade, scarcity, budgeting, and consequences.",
    whyItMatters:
      "Economics helps learners think more carefully about choices, trade-offs, planning, and responsible use of resources.",
    status: "detailed",
  },
  {
    key: "cultures-societies-and-perspectives",
    title: "Cultures, societies and perspectives",
    description:
      "Explore identity, communities, traditions, migration, social change, perspective-taking, and respectful comparison.",
    whyItMatters:
      "This strand supports empathy, social understanding, respectful conversation, and awareness of how people live and see the world differently.",
    status: "detailed",
  },
  {
    key: "inquiry-sources-and-evidence",
    title: "Inquiry, sources and evidence",
    description:
      "Ask questions, gather information, compare sources, organise findings, and explain conclusions with evidence.",
    whyItMatters:
      "Inquiry supports every Humanities & Social Sciences strand by helping learners move from curiosity into clearer, evidence-based understanding.",
    status: "detailed",
  },
];

const HISTORY_AND_CHANGE_OVER_TIME: HassStrandConfig = {
  key: "history-and-change-over-time",
  title: "History and change over time",
  subtitle:
    "History helps learners explore how people, communities, and events change over time. It grows from personal and family stories into timelines, source work, cause and effect, continuity and change, and more thoughtful explanation of historical significance.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on family stories, sequencing, discussion, and inquiry. It connects strongly to sources and evidence, cultures and perspectives, geography, and thoughtful explanation of change over time.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early history begins with family stories, daily routines, and simple ideas about before, after, past, and present.",
      steps: [
        {
          id: 1,
          title: "Talk about personal and family stories",
          meaning:
            "Use photos, objects, and conversation to notice that people have stories and memories from different times.",
          skillFocus: "personal and family history awareness",
          practiceActivity:
            "Look at baby photos, family keepsakes, or a simple family storybook and talk about who, when, and what was happening.",
          evidenceExamples: [
            "a family-photo discussion note",
            "a drawing or retelling about a family event",
            "a short oral explanation of something from the past",
          ],
          nextStep:
            "Build from family stories into clearer sequence language and simple past/present comparison.",
          reportLanguage:
            "The learner is beginning to talk about personal and family history and is developing simple awareness that experiences happen across time.",
        },
        {
          id: 2,
          title: "Use before, after, past, and present in simple ways",
          meaning:
            "Notice that events can be put in order and that some things were earlier while others are happening now.",
          skillFocus: "sequencing and time language",
          practiceActivity:
            "Sequence a day, a family outing, or a simple story and compare something from the past with something used today.",
          evidenceExamples: [
            "a simple event-sequencing page",
            "a parent note about past-and-present language",
            "a learner comparison of then and now",
          ],
          nextStep:
            "Carry this into lower-primary timeline work and local-history noticing.",
          reportLanguage:
            "The learner is building early time language and can increasingly place simple events in order and compare past and present.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin using timelines, simple sources, and local stories to understand that lives, places, and objects change over time.",
      steps: [
        {
          id: 1,
          title: "Sequence events on a simple timeline",
          meaning:
            "Use pictures, labels, or dates where appropriate to put events or life stages into clearer order.",
          skillFocus: "timeline thinking",
          practiceActivity:
            "Create a simple family timeline, a personal milestone timeline, or a local place timeline using pictures and short labels.",
          evidenceExamples: [
            "a simple timeline page",
            "a learner explanation of event order",
            "a parent note about sequencing confidence",
          ],
          nextStep:
            "Use timeline thinking to support local-history stories and source comparison.",
          reportLanguage:
            "The learner is increasingly able to sequence events and use simple timeline structures to show how things change over time.",
        },
        {
          id: 2,
          title: "Use local stories and objects as historical clues",
          meaning:
            "Notice that photos, buildings, tools, and stories can help us learn about the past.",
          skillFocus: "early source awareness",
          practiceActivity:
            "Look at old household items, local landmarks, or family stories and ask what they tell us about earlier times.",
          evidenceExamples: [
            "a note about what a historical object showed",
            "a drawing or description of a local history clue",
            "a parent summary of a source discussion",
          ],
          nextStep:
            "Build into middle-primary use of sources, change, and cause-and-effect thinking.",
          reportLanguage:
            "The learner is beginning to use simple historical clues such as objects, photos, and stories to understand the past.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens source use, cause-and-effect thinking, and explanation of what changed, what stayed similar, and why events mattered.",
      steps: [
        {
          id: 1,
          title: "Use more than one source to understand an event or place",
          meaning:
            "Compare different clues such as photos, maps, stories, artefacts, or short texts to build a stronger picture of the past.",
          skillFocus: "source comparison and interpretation",
          practiceActivity:
            "Compare two photos, a map and a story, or a short text and an object from a local-history or family-history topic.",
          evidenceExamples: [
            "a comparison of two historical sources",
            "a learner explanation of what each source showed",
            "a parent note from a source discussion",
          ],
          nextStep:
            "Use source comparison to support cause, effect, and continuity-and-change reasoning.",
          reportLanguage:
            "The learner is increasingly able to use more than one source to build understanding of a historical topic or event.",
        },
        {
          id: 2,
          title: "Explain change, continuity, and simple cause and effect",
          meaning:
            "Notice what changed, what stayed similar, and how one event or choice affected another.",
          skillFocus: "continuity, change, and cause",
          practiceActivity:
            "Discuss how transport, homes, schools, work, or a local community changed over time and what may have influenced those changes.",
          evidenceExamples: [
            "a then-and-now comparison",
            "a learner explanation of why something changed",
            "a parent summary of cause-and-effect discussion",
          ],
          nextStep:
            "Carry this into upper-primary perspective and significance thinking.",
          reportLanguage:
            "The learner is beginning to explain continuity, change, and simple cause-and-effect relationships in historical contexts.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin comparing perspectives, weighing source value, and explaining why events, people, or changes may have been significant.",
      steps: [
        {
          id: 1,
          title: "Compare historical perspectives and accounts",
          meaning:
            "Recognise that people may describe or remember the same event differently depending on viewpoint and experience.",
          skillFocus: "historical perspective-taking",
          practiceActivity:
            "Compare diary extracts, oral accounts, textbook summaries, or local stories and discuss what each perspective highlights.",
          evidenceExamples: [
            "a comparison of two historical viewpoints",
            "a learner explanation of perspective difference",
            "a parent note from a respectful discussion about interpretation",
          ],
          nextStep:
            "Use perspective work to support stronger significance and evidence-based explanation later.",
          reportLanguage:
            "The learner is increasingly able to compare historical perspectives and discuss how different viewpoints shape understanding.",
        },
        {
          id: 2,
          title: "Explain why a person, event, or change was significant",
          meaning:
            "Use evidence to decide why something mattered and what effects it had beyond the moment itself.",
          skillFocus: "historical significance",
          practiceActivity:
            "Discuss a local change, invention, leader, migration story, or event and explain why it mattered at the time or later.",
          evidenceExamples: [
            "a significance explanation",
            "a learner note about why an event mattered",
            "a parent summary of a history discussion",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of source usefulness and historical argument.",
          reportLanguage:
            "The learner is beginning to explain historical significance using evidence and clearer reasoning about impact and change.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens source evaluation, argument, and more careful explanation of historical interpretation, significance, and change over time.",
      steps: [
        {
          id: 1,
          title: "Evaluate how useful a source is for a historical question",
          meaning:
            "Consider what a source can show, what it may leave out, and how much confidence to place in it for a particular question.",
          skillFocus: "source usefulness and evaluation",
          practiceActivity:
            "Review a primary or secondary source and discuss what it helps answer, what its limits are, and what other evidence would help.",
          evidenceExamples: [
            "a source evaluation note",
            "a learner explanation of source usefulness",
            "a parent summary of a source-quality discussion",
          ],
          nextStep:
            "Use source evaluation to support more careful historical explanations and comparisons.",
          reportLanguage:
            "The learner is increasingly able to evaluate how useful a source is for a historical question and explain its strengths and limits.",
        },
        {
          id: 2,
          title: "Use evidence to support a historical explanation",
          meaning:
            "Bring together sources, sequence, cause, and perspective to explain a historical question more clearly.",
          skillFocus: "evidence-based historical explanation",
          practiceActivity:
            "Answer a question about change, significance, or perspective using notes from more than one source.",
          evidenceExamples: [
            "a short historical explanation with evidence",
            "a learner discussion using source support",
            "an annotated note set showing how evidence was used",
          ],
          nextStep:
            "Build toward later consolidation where historical interpretations are compared more critically.",
          reportLanguage:
            "The learner is developing stronger historical explanations and can increasingly support conclusions with relevant source evidence.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together source evaluation, interpretation, and more mature explanation of continuity, change, significance, and perspective.",
      steps: [
        {
          id: 1,
          title: "Compare historical interpretations more critically",
          meaning:
            "Recognise that historians and sources may interpret the same topic differently and compare how well each interpretation is supported.",
          skillFocus: "critical comparison of interpretations",
          practiceActivity:
            "Compare two interpretations of an event, movement, or historical change and discuss which seems better supported.",
          evidenceExamples: [
            "a comparison of historical interpretations",
            "a learner explanation weighing different accounts",
            "a parent note from a critical history discussion",
          ],
          nextStep:
            "Use this evaluative habit across inquiry, reporting, and later interdisciplinary project work.",
          reportLanguage:
            "The learner is consolidating the ability to compare historical interpretations and weigh how well each is supported by evidence.",
        },
        {
          id: 2,
          title: "Communicate historical understanding clearly",
          meaning:
            "Present a coherent historical explanation using sources, timelines, perspective, and significance with growing maturity.",
          skillFocus: "clear historical communication",
          practiceActivity:
            "Create a short historical report, presentation, poster, or timeline-based explanation about a chosen topic.",
          evidenceExamples: [
            "a history report or presentation",
            "a learner explanation connecting evidence and significance",
            "a source-supported timeline summary",
          ],
          nextStep:
            "These habits continue to support stronger reporting, portfolio evidence, and thoughtful understanding of change over time.",
          reportLanguage:
            "The learner is strengthening the ability to communicate historical understanding clearly, using evidence, sequence, and perspective with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early family or local-history record, one source-comparison example, and one later evidence-based explanation so historical thinking growth is visible over time.",
    "Photos of timelines, source notes, local-history walks, and short learner explanations often make stronger portfolio evidence than isolated recall tasks alone.",
    "A portfolio becomes stronger when it shows how the learner moved from family stories into source use, change-over-time thinking, and significance explanation.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in sequencing, source use, cause and effect, perspective, and historical explanation rather than only listing topics covered.",
    "Examples are strongest when the learner explains what changed, what stayed similar, and what evidence supports the interpretation.",
    "Collected evidence can show a clear shift from simple past-and-present awareness into more mature historical reasoning and communication.",
  ],
};

const GEOGRAPHY_PLACE_AND_ENVIRONMENT: HassStrandConfig = {
  key: "geography-place-and-environment",
  title: "Geography, place and environment",
  subtitle:
    "Geography helps learners notice places, environments, maps, movement, and human-environment relationships. It grows from local place awareness into spatial thinking, pattern noticing, environmental change, and more thoughtful explanation of place-based decisions.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on observation, discussion, and inquiry. It connects strongly to mapping, environment, movement, decision-making, and evidence about how people and places influence each other.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early geography begins with noticing familiar places, simple routes, home and neighbourhood features, and what makes places feel different.",
      steps: [
        {
          id: 1,
          title: "Notice familiar places and what belongs there",
          meaning:
            "Describe places such as home, garden, park, shop, or street using simple features and experiences.",
          skillFocus: "local place awareness",
          practiceActivity:
            "Talk about favourite places, sketch a local walk, or compare what can be seen, heard, or done in two familiar places.",
          evidenceExamples: [
            "a drawing of a familiar place",
            "a parent note about local place discussion",
            "a learner explanation of why one place is different from another",
          ],
          nextStep:
            "Build from local place awareness into simple maps, routes, and environmental features.",
          reportLanguage:
            "The learner is beginning to notice familiar places and describe simple features that make one place different from another.",
        },
        {
          id: 2,
          title: "Follow and talk about simple routes and directions",
          meaning:
            "Use movement, landmarks, and simple spatial language to understand how places connect.",
          skillFocus: "early spatial and route language",
          practiceActivity:
            "Map a walk from one room to another, follow a park route, or describe how to get from home to a familiar place.",
          evidenceExamples: [
            "a simple route map or drawing",
            "a learner explanation using landmarks",
            "a parent note about directional language",
          ],
          nextStep:
            "Carry this into lower-primary mapping and place-feature comparison.",
          reportLanguage:
            "The learner is building early spatial language and can increasingly describe simple routes, landmarks, and place connections.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin using simple maps, comparing natural and human features, and noticing local environmental patterns such as weather and land use.",
      steps: [
        {
          id: 1,
          title: "Use simple maps and symbols to show place",
          meaning:
            "Represent a room, home area, route, or local space using basic mapping ideas and symbols.",
          skillFocus: "early map use and representation",
          practiceActivity:
            "Draw a bedroom map, map a local route, or label a park or neighbourhood using simple symbols and key features.",
          evidenceExamples: [
            "a simple map with labels",
            "a learner explanation of what the map shows",
            "a parent note about map-making discussion",
          ],
          nextStep:
            "Use simple maps to compare places and explain local features more clearly.",
          reportLanguage:
            "The learner is increasingly able to use simple maps and symbols to show familiar places and routes.",
        },
        {
          id: 2,
          title: "Compare natural and human features in local places",
          meaning:
            "Notice that places include both natural features and things people have built or changed.",
          skillFocus: "place-feature comparison",
          practiceActivity:
            "Walk locally or use photos to compare rivers, trees, weather, roads, buildings, gardens, or play spaces.",
          evidenceExamples: [
            "a local-feature comparison page",
            "a learner explanation of human and natural features",
            "a parent note about a place comparison walk",
          ],
          nextStep:
            "Build into middle-primary discussion of movement, environment, and pattern over time.",
          reportLanguage:
            "The learner is beginning to compare natural and human features and describe how they shape familiar places.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens map use, environmental pattern noticing, and understanding of how people move through and use places.",
      steps: [
        {
          id: 1,
          title: "Use maps and observations to compare places",
          meaning:
            "Read maps and local evidence to compare what places are like and how they are connected.",
          skillFocus: "map reading and place comparison",
          practiceActivity:
            "Compare two neighbourhoods, parks, towns, or environments using maps, photos, notes, or local observation.",
          evidenceExamples: [
            "a map-based place comparison",
            "a learner explanation of place similarities and differences",
            "a parent note from a geography discussion",
          ],
          nextStep:
            "Use place comparison to support deeper thinking about environment, movement, and decision-making.",
          reportLanguage:
            "The learner is increasingly able to use maps and observations to compare places and explain how they are similar or different.",
        },
        {
          id: 2,
          title: "Explain how people and environments affect each other",
          meaning:
            "Notice that people use, change, care for, and depend on environments in different ways.",
          skillFocus: "human-environment connection",
          practiceActivity:
            "Discuss a garden, waterway, street, farm, park, or town area and how people shape it or respond to it.",
          evidenceExamples: [
            "a learner explanation of human-environment interaction",
            "a local environment reflection",
            "a parent note from a discussion on place use and care",
          ],
          nextStep:
            "Carry this into upper-primary environmental change, sustainability, and movement patterns.",
          reportLanguage:
            "The learner is beginning to explain how people and environments affect one another in familiar and local contexts.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin connecting place, environment, movement, and sustainability more deliberately through maps, comparisons, and evidence.",
      steps: [
        {
          id: 1,
          title: "Explain movement, connection, and place use",
          meaning:
            "Understand that people, goods, ideas, and resources move between places and shape how places function.",
          skillFocus: "movement and place connection",
          practiceActivity:
            "Trace how food, travel, commuting, water, or services connect places and influence local or wider life.",
          evidenceExamples: [
            "a flow map or place-connection diagram",
            "a learner explanation of why places are connected",
            "a parent note from a movement or transport discussion",
          ],
          nextStep:
            "Use this connection thinking to support lower-secondary spatial patterns and geographic interpretation.",
          reportLanguage:
            "The learner is increasingly able to explain how movement and connection shape places and everyday geographic experiences.",
        },
        {
          id: 2,
          title: "Discuss environmental change and care using evidence",
          meaning:
            "Use observations, maps, or simple data to talk about environmental change and possible responses.",
          skillFocus: "environmental change and sustainability",
          practiceActivity:
            "Compare land use, weather patterns, erosion, pollution, or local care projects and discuss what evidence shows about change.",
          evidenceExamples: [
            "an environmental-change comparison",
            "a learner reflection on place care or sustainability",
            "a parent summary of a geography discussion",
          ],
          nextStep:
            "Carry this into lower-secondary geographic interpretation and evidence-based decision-making.",
          reportLanguage:
            "The learner is beginning to use evidence to discuss environmental change and possible ways people can respond or care for places.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens spatial thinking, interpretation of geographic data, and more careful explanation of place, connection, and environmental decisions.",
      steps: [
        {
          id: 1,
          title: "Interpret geographic data and spatial patterns",
          meaning:
            "Use maps, graphs, images, and field observations to explain patterns in place, environment, movement, or population.",
          skillFocus: "geographic interpretation",
          practiceActivity:
            "Read a map, satellite image, climate graph, or field record and discuss what pattern it suggests about a place or issue.",
          evidenceExamples: [
            "a map or data interpretation note",
            "a learner explanation of a spatial pattern",
            "a parent summary of geographic reasoning discussion",
          ],
          nextStep:
            "Use this interpretation to support stronger evaluation of geographic choices and consequences.",
          reportLanguage:
            "The learner is increasingly able to interpret geographic data and explain spatial patterns using evidence from maps, images, or observations.",
        },
        {
          id: 2,
          title: "Explain geographic decisions and consequences",
          meaning:
            "Use evidence to discuss how decisions about land, resources, movement, or development affect people and environments.",
          skillFocus: "geographic decision-making",
          practiceActivity:
            "Discuss a local land-use issue, transport change, environmental choice, or planning question and explain possible consequences.",
          evidenceExamples: [
            "a decision-and-consequence explanation",
            "a learner response using map or place evidence",
            "a parent note from a place-based discussion",
          ],
          nextStep:
            "Build toward later consolidation where geographic claims and responses are compared more critically.",
          reportLanguage:
            "The learner is developing stronger geographic reasoning and can increasingly explain how place-based decisions affect people and environments.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together maps, data, place comparison, and evidence-based explanation of geographic issues, decisions, and change.",
      steps: [
        {
          id: 1,
          title: "Evaluate responses to geographic issues",
          meaning:
            "Compare possible responses to place or environmental questions and weigh which approach seems better supported.",
          skillFocus: "evaluation of geographic responses",
          practiceActivity:
            "Compare two responses to a transport, development, conservation, or resource-use issue and discuss which is more convincing.",
          evidenceExamples: [
            "an evaluation of geographic options",
            "a learner comparison of two place-based responses",
            "a parent note from a critical geography discussion",
          ],
          nextStep:
            "Use this evaluation habit across HASS inquiry, project work, and interdisciplinary decision-making.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate responses to geographic issues and compare how well different approaches are supported by evidence.",
        },
        {
          id: 2,
          title: "Communicate geographic understanding clearly",
          meaning:
            "Present place, environment, or movement understanding coherently using maps, evidence, and explanation.",
          skillFocus: "clear geographic communication",
          practiceActivity:
            "Create a short report, map-based presentation, or visual summary about a place, environment, or geographic issue.",
          evidenceExamples: [
            "a geography report or presentation",
            "a learner explanation using maps or data",
            "a place comparison supported by evidence",
          ],
          nextStep:
            "These habits continue to support stronger reporting, portfolio evidence, and real-world spatial thinking.",
          reportLanguage:
            "The learner is strengthening the ability to communicate geographic understanding clearly, using maps, data, and evidence with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early place map, one environment or movement comparison, and one later evidence-based geographic explanation so spatial thinking growth is visible.",
    "Photos of field walks, annotated maps, local observations, and learner explanations often make strong geography evidence in a homeschool portfolio.",
    "A portfolio becomes stronger when it shows how the learner moved from local place awareness into map use, environmental understanding, and geographic decision-making.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in mapping, place comparison, environment understanding, spatial thinking, and geographic explanation rather than only listing topics covered.",
    "Examples are strongest when the learner explains how places are connected, how environments change, and what evidence supports the conclusion.",
    "Collected evidence can show a clear shift from local place awareness to more mature interpretation of patterns, connections, and consequences.",
  ],
};

const CIVICS_COMMUNITY_AND_CITIZENSHIP: HassStrandConfig = {
  key: "civics-community-and-citizenship",
  title: "Civics, community and citizenship",
  subtitle:
    "Civics helps learners understand community life, fairness, rules, responsibilities, participation, and respectful discussion. It grows from family and local roles into more thoughtful understanding of community contribution, decision-making, and civic life.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on relationships, discussion, and everyday responsibilities. It connects to cultures and perspectives, inquiry, fairness, participation, and thoughtful community decision-making.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early civics begins with family roles, classroom or home rules, simple fairness ideas, and belonging to groups or communities.",
      steps: [
        {
          id: 1,
          title: "Notice roles, helpers, and belonging in daily life",
          meaning:
            "Recognise that people have different roles in families and communities and that these roles help shared life work.",
          skillFocus: "community roles and belonging",
          practiceActivity:
            "Talk about who helps at home, in a neighbourhood, or in a local service and what each role contributes.",
          evidenceExamples: [
            "a drawing of community helpers or family roles",
            "a learner explanation of how someone helps",
            "a parent note from a belonging discussion",
          ],
          nextStep:
            "Build from roles and helpers into rules, responsibilities, and simple fairness discussions.",
          reportLanguage:
            "The learner is beginning to recognise roles and helpers in family and community life and is building awareness of belonging.",
        },
        {
          id: 2,
          title: "Talk about rules, sharing, and fairness",
          meaning:
            "Notice that people use rules and agreements to help life work more fairly and safely.",
          skillFocus: "early fairness and responsibility",
          practiceActivity:
            "Discuss why a rule exists, how turns work, or what makes a shared activity feel fair.",
          evidenceExamples: [
            "a parent note about a fairness discussion",
            "a learner explanation of why a rule helps",
            "a simple drawing or retelling about sharing or taking turns",
          ],
          nextStep:
            "Carry this into lower-primary ideas about rights, responsibilities, and community contribution.",
          reportLanguage:
            "The learner is developing early understanding that rules, sharing, and fairness help people live and work together well.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin connecting rights, responsibilities, community participation, and respectful behaviour in more deliberate ways.",
      steps: [
        {
          id: 1,
          title: "Explain simple responsibilities in home and community life",
          meaning:
            "Understand that belonging to a group often includes responsibilities as well as support or care.",
          skillFocus: "responsibility and contribution",
          practiceActivity:
            "Discuss chores, care tasks, class jobs, neighbourhood responsibility, or ways people contribute to group life.",
          evidenceExamples: [
            "a simple roles-and-responsibilities page",
            "a learner explanation of how to contribute to a group",
            "a parent note from a community discussion",
          ],
          nextStep:
            "Use this idea to support deeper discussion about community participation and decision-making.",
          reportLanguage:
            "The learner is increasingly able to explain simple responsibilities and describe ways people contribute to home and community life.",
        },
        {
          id: 2,
          title: "Discuss fairness, participation, and respectful choices",
          meaning:
            "Recognise that communities work better when people listen, participate, and treat others fairly.",
          skillFocus: "respectful participation",
          practiceActivity:
            "Use a family discussion, shared decision, or group activity to talk about listening, fairness, and taking part.",
          evidenceExamples: [
            "a parent note from a group decision discussion",
            "a learner reflection on fairness or participation",
            "a short explanation of a respectful choice",
          ],
          nextStep:
            "Carry this into middle-primary understanding of local community decisions and representation.",
          reportLanguage:
            "The learner is building understanding that respectful participation and fairness help communities function well.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens community understanding, representation, decision-making, and the reasons shared systems and rules exist.",
      steps: [
        {
          id: 1,
          title: "Explain how communities make and follow decisions",
          meaning:
            "Notice that communities use processes, leaders, or agreements to help people make decisions together.",
          skillFocus: "community decision-making",
          practiceActivity:
            "Discuss a local council example, school rule process, family vote, or shared planning decision and how it was made.",
          evidenceExamples: [
            "a decision-making flow note",
            "a learner explanation of how a group made a decision",
            "a parent summary of a civics discussion",
          ],
          nextStep:
            "Use decision-making understanding to support upper-primary learning about civic structures and participation.",
          reportLanguage:
            "The learner is increasingly able to explain how communities make decisions and why shared processes or agreements matter.",
        },
        {
          id: 2,
          title: "Describe why rules, rights, and responsibilities are linked",
          meaning:
            "Understand that rights and freedoms usually sit alongside responsibilities, care, and participation.",
          skillFocus: "rights and responsibilities thinking",
          practiceActivity:
            "Use a local or family example to discuss what is fair, what a person can expect, and what each person should contribute or protect.",
          evidenceExamples: [
            "a rights-and-responsibilities comparison",
            "a learner explanation of fair community behaviour",
            "a parent note from a values and responsibility discussion",
          ],
          nextStep:
            "Carry this into upper-primary participation, representation, and respectful civic discussion.",
          reportLanguage:
            "The learner is beginning to explain how rights, responsibilities, and fairness connect in community life.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin thinking more deliberately about participation, representation, respectful disagreement, and how people can contribute to shared life.",
      steps: [
        {
          id: 1,
          title: "Discuss participation and representation more thoughtfully",
          meaning:
            "Understand that communities often rely on participation, leadership, and representation to make shared decisions.",
          skillFocus: "participation and representation",
          practiceActivity:
            "Look at a community issue, student voice example, council decision, or local process and discuss how people are represented or involved.",
          evidenceExamples: [
            "a participation or representation explanation",
            "a learner reflection on how people can contribute",
            "a parent note from a civics conversation",
          ],
          nextStep:
            "Use participation thinking to support lower-secondary civic reasoning and issue discussion.",
          reportLanguage:
            "The learner is increasingly able to discuss participation and representation and consider how people contribute to shared decisions.",
        },
        {
          id: 2,
          title: "Use respectful discussion to consider civic questions",
          meaning:
            "Listen, compare viewpoints, and respond respectfully when discussing fairness, rules, or community issues.",
          skillFocus: "respectful civic discussion",
          practiceActivity:
            "Use a family or community topic to practise stating a view, listening to another, and explaining reasons respectfully.",
          evidenceExamples: [
            "a learner reflection on a respectful discussion",
            "a parent summary of viewpoint comparison",
            "a note showing reasons used in a community conversation",
          ],
          nextStep:
            "Carry this into lower-secondary analysis of civic issues, evidence, and participation.",
          reportLanguage:
            "The learner is beginning to use respectful discussion more effectively when considering fairness, rules, and community questions.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens civic reasoning, issue discussion, evidence use, and more thoughtful understanding of participation and community systems.",
      steps: [
        {
          id: 1,
          title: "Use evidence when discussing community or civic issues",
          meaning:
            "Move beyond opinion alone and use examples, sources, or observed consequences to support a view.",
          skillFocus: "evidence-based civic reasoning",
          practiceActivity:
            "Discuss a local issue, shared rule, participation question, or community challenge and ask what evidence or examples support each view.",
          evidenceExamples: [
            "a civic issue response with evidence",
            "a learner explanation using sources or examples",
            "a parent note from an evidence-based discussion",
          ],
          nextStep:
            "Use evidence-based discussion to support later evaluation of civic responses and participation choices.",
          reportLanguage:
            "The learner is increasingly able to use evidence when discussing civic or community issues and explain why a particular view seems reasonable.",
        },
        {
          id: 2,
          title: "Explain how participation can shape community outcomes",
          meaning:
            "Understand that action, contribution, and informed participation can influence how communities function or change.",
          skillFocus: "civic participation and impact",
          practiceActivity:
            "Look at a service project, local campaign, community response, or family initiative and discuss how participation affected the outcome.",
          evidenceExamples: [
            "a participation-and-impact explanation",
            "a learner reflection on contribution",
            "a parent summary of a community action discussion",
          ],
          nextStep:
            "Build toward later consolidation where civic responses and positions are evaluated more critically.",
          reportLanguage:
            "The learner is developing stronger understanding of how participation can influence community outcomes and shared life.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together participation, evidence, respectful discussion, and evaluation of civic responses in more mature ways.",
      steps: [
        {
          id: 1,
          title: "Evaluate civic responses and possible actions",
          meaning:
            "Compare possible ways of responding to a community issue and weigh which seems more thoughtful, fair, or evidence-based.",
          skillFocus: "evaluation of civic responses",
          practiceActivity:
            "Compare two responses to a community issue and discuss which approach better fits the evidence, goals, or responsibilities involved.",
          evidenceExamples: [
            "an evaluation of civic options",
            "a learner comparison of two possible responses",
            "a parent note from a critical community discussion",
          ],
          nextStep:
            "Use this evaluation habit across HASS inquiry, project work, and later real-world citizenship understanding.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate civic responses and compare how well different actions are supported by evidence and reasoning.",
        },
        {
          id: 2,
          title: "Communicate civic understanding clearly and respectfully",
          meaning:
            "Present a reasoned view about community, participation, or fairness using evidence and respectful language.",
          skillFocus: "clear civic communication",
          practiceActivity:
            "Create a short report, discussion summary, poster, or presentation about a civic question or community issue.",
          evidenceExamples: [
            "a civic issue report or presentation",
            "a learner explanation connecting evidence and viewpoint",
            "a respectful comparison of alternative positions",
          ],
          nextStep:
            "These habits continue to support thoughtful participation, reporting, and evidence-based communication across subjects.",
          reportLanguage:
            "The learner is strengthening the ability to communicate civic understanding clearly and respectfully, using evidence and balanced reasoning with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early community-role example, one discussion or responsibility reflection, and one later evidence-based civic explanation so civic understanding growth is visible.",
    "Photos, group-decision notes, learner reflections, and respectful discussion summaries often make strong civics evidence in a homeschool portfolio.",
    "A portfolio becomes stronger when it shows how the learner moved from basic fairness and belonging into participation, evidence, and community reasoning.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in community understanding, fairness, respectful discussion, participation, and evidence-based civic reasoning rather than only naming topics covered.",
    "Examples are strongest when the learner explains a community issue, a responsibility, or a participation choice using evidence and thoughtful reasoning.",
    "Collected evidence can show a clear shift from simple rules-and-fairness awareness into more mature civic explanation and respectful discussion.",
  ],
};

const ECONOMICS_RESOURCES_AND_DECISION_MAKING: HassStrandConfig = {
  key: "economics-resources-and-decision-making",
  title: "Economics, resources and decision-making",
  subtitle:
    "Economics helps learners think about needs, wants, resources, money, choices, trade-offs, and consequences. It grows from simple decisions into more deliberate planning, budgeting, and evidence-based reasoning about how people use limited resources.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on discussion, counting, planning, and everyday family decision-making. It connects strongly to mathematics, geography, civics, and practical understanding of choices and consequences.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early economics begins with simple choices, sharing, and noticing that people make decisions about what they use, need, and value.",
      steps: [
        {
          id: 1,
          title: "Talk about needs, wants, and simple choices",
          meaning:
            "Begin recognising that some things are needed more urgently while others are wanted or chosen for other reasons.",
          skillFocus: "needs, wants, and choice awareness",
          practiceActivity:
            "Sort familiar items into simple need-or-want groups and talk about why a family or person might choose one first.",
          evidenceExamples: [
            "a needs-and-wants sorting page",
            "a learner explanation of a simple choice",
            "a parent note from a discussion about priorities",
          ],
          nextStep:
            "Build into lower-primary ideas about saving, spending, sharing, and responsible use of resources.",
          reportLanguage:
            "The learner is beginning to recognise needs, wants, and simple choices and can explain some reasons behind a decision.",
        },
        {
          id: 2,
          title: "Notice sharing and taking turns with resources",
          meaning:
            "Understand that resources such as time, materials, or money cannot always be used for everything at once.",
          skillFocus: "early resource awareness",
          practiceActivity:
            "Use snack sharing, art materials, or activity time choices to discuss fair use, waiting, and limited supply.",
          evidenceExamples: [
            "a parent note about sharing or resource talk",
            "a learner explanation of why a turn or choice was needed",
            "a simple drawing or retelling about fair use",
          ],
          nextStep:
            "Carry this into lower-primary planning, money, and simple trade-off thinking.",
          reportLanguage:
            "The learner is developing early understanding that resources are shared and that choices are sometimes needed when something is limited.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin using money, planning choices, and noticing that spending, saving, and sharing involve different priorities and consequences.",
      steps: [
        {
          id: 1,
          title: "Use money and simple planning in everyday contexts",
          meaning:
            "Handle basic buying, selling, and saving ideas through practical family or play-based examples.",
          skillFocus: "early money and planning",
          practiceActivity:
            "Use a pretend shop, budget a simple outing, or plan how to spend or save a small amount for a goal.",
          evidenceExamples: [
            "a small budget or shopping plan",
            "a learner explanation of a save-or-spend choice",
            "a parent note from a practical money activity",
          ],
          nextStep:
            "Use simple money planning to support stronger trade-off and consequence thinking.",
          reportLanguage:
            "The learner is increasingly able to use simple money ideas and explain basic choices about saving, spending, or planning.",
        },
        {
          id: 2,
          title: "Describe trade-offs in simple decisions",
          meaning:
            "Notice that choosing one option often means not choosing another and that choices can have later effects.",
          skillFocus: "trade-offs and consequences",
          practiceActivity:
            "Compare two spending choices, time-use options, or resource uses and ask what each choice allows or prevents.",
          evidenceExamples: [
            "a comparison of two choices",
            "a learner explanation of a consequence",
            "a parent note from a decision-making discussion",
          ],
          nextStep:
            "Carry this into middle-primary work on work, production, exchange, and more deliberate budgeting.",
          reportLanguage:
            "The learner is beginning to recognise trade-offs and can increasingly explain that one choice can lead to different consequences than another.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens understanding of work, production, exchange, planning, and the idea that resources are limited.",
      steps: [
        {
          id: 1,
          title: "Explain how work, goods, and exchange connect",
          meaning:
            "Understand that people work, produce, trade, and exchange goods or services in ways that meet needs and wants.",
          skillFocus: "production and exchange",
          practiceActivity:
            "Trace how a product or service gets to a family, compare jobs that help a community, or discuss how work and exchange are linked.",
          evidenceExamples: [
            "a goods-and-services explanation",
            "a learner note about production or exchange",
            "a parent summary of an economics discussion",
          ],
          nextStep:
            "Use this connection thinking to support budgeting, scarcity, and resource decisions.",
          reportLanguage:
            "The learner is increasingly able to explain simple links between work, production, exchange, and meeting needs or wants.",
        },
        {
          id: 2,
          title: "Plan with limited resources more deliberately",
          meaning:
            "Use a simple budget, materials plan, or time plan to show that not every option can be chosen at once.",
          skillFocus: "scarcity and practical planning",
          practiceActivity:
            "Plan a project, outing, or family purchase with a limited amount of time, money, or materials and explain the final choice.",
          evidenceExamples: [
            "a simple budget or plan",
            "a learner explanation of why one option was chosen",
            "a parent note from a planning discussion",
          ],
          nextStep:
            "Carry this into upper-primary consideration of value, comparison, and longer-term consequence.",
          reportLanguage:
            "The learner is beginning to use simple planning tools to show how limited resources affect economic choices.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin comparing value, weighing consequences, and using evidence to explain more thoughtful economic choices.",
      steps: [
        {
          id: 1,
          title: "Compare value and justify a better choice",
          meaning:
            "Look beyond price alone and consider quality, usefulness, timing, or longer-term outcome when choosing.",
          skillFocus: "value comparison and justification",
          practiceActivity:
            "Compare two products, plans, or uses of money and explain which offers better value and why.",
          evidenceExamples: [
            "a value comparison chart",
            "a learner explanation of a better-value choice",
            "a parent note from a budgeting or comparison task",
          ],
          nextStep:
            "Use value comparison to support lower-secondary reasoning about evidence, scarcity, and wider decision impact.",
          reportLanguage:
            "The learner is increasingly able to compare value and justify choices using more than one reason or piece of evidence.",
        },
        {
          id: 2,
          title: "Explain short- and long-term consequences of economic choices",
          meaning:
            "Notice that a choice can have immediate effects as well as later impacts on people, plans, or resources.",
          skillFocus: "consequence over time",
          practiceActivity:
            "Discuss saving versus spending, buying versus borrowing, or quick convenience versus longer-term benefit in a family context.",
          evidenceExamples: [
            "a learner reflection on consequences",
            "a parent summary of an economic discussion",
            "a short written explanation of a choice over time",
          ],
          nextStep:
            "Carry this into lower-secondary analysis of resource use, planning, and evidence-based decision-making.",
          reportLanguage:
            "The learner is beginning to explain both immediate and longer-term consequences of economic choices with growing maturity.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens reasoning about scarcity, planning, evidence, and the wider effects of resource and money decisions.",
      steps: [
        {
          id: 1,
          title: "Use evidence to discuss resource or money decisions",
          meaning:
            "Support a financial or resource decision using comparison, planning, or consequence evidence rather than preference alone.",
          skillFocus: "evidence-based economic reasoning",
          practiceActivity:
            "Compare options in a budget, resource-use issue, or family planning scenario and explain which choice is better supported.",
          evidenceExamples: [
            "a budget comparison with reasons",
            "a learner explanation using evidence or constraints",
            "a parent note from an economics discussion",
          ],
          nextStep:
            "Use evidence-based choice to support later evaluation of trade-offs and economic responses.",
          reportLanguage:
            "The learner is increasingly able to use evidence when discussing economic choices, planning, and resource decisions.",
        },
        {
          id: 2,
          title: "Explain trade-offs and wider consequences more clearly",
          meaning:
            "Think beyond the immediate decision and consider how one choice can affect other people, priorities, or opportunities.",
          skillFocus: "trade-offs and broader impact",
          practiceActivity:
            "Discuss a resource, spending, or planning decision and map out who gains, who waits, what is limited, and what later effect follows.",
          evidenceExamples: [
            "a trade-off map or comparison",
            "a learner explanation of wider consequences",
            "a parent summary of a reasoning discussion",
          ],
          nextStep:
            "Build toward later consolidation where options and responses are compared more critically.",
          reportLanguage:
            "The learner is developing stronger understanding of trade-offs and can increasingly explain wider consequences of economic decisions.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together budgeting, planning, evidence, value, and more mature reasoning about choices, resources, and consequences.",
      steps: [
        {
          id: 1,
          title: "Evaluate different economic choices or responses",
          meaning:
            "Compare possible responses to a resource, spending, or planning situation and weigh which is more sensible or better supported.",
          skillFocus: "evaluation of economic options",
          practiceActivity:
            "Compare two budget responses, resource-use plans, or purchasing choices and discuss which seems more thoughtful and why.",
          evidenceExamples: [
            "an evaluation of two economic options",
            "a learner comparison using evidence and trade-offs",
            "a parent note from a critical planning discussion",
          ],
          nextStep:
            "Use this evaluation habit across financial learning, HASS inquiry, and real-world family decision-making.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate economic options and compare how well different choices are supported by evidence and reasoning.",
        },
        {
          id: 2,
          title: "Communicate economic reasoning clearly",
          meaning:
            "Present a clear explanation of a choice, plan, trade-off, or budget using evidence and practical reasoning.",
          skillFocus: "clear economic communication",
          practiceActivity:
            "Create a short report, explanation, or presentation about a spending, saving, planning, or resource-use decision.",
          evidenceExamples: [
            "a budget explanation or report",
            "a learner presentation about a practical decision",
            "a short written justification of a chosen option",
          ],
          nextStep:
            "These habits continue to support planning, reporting, and thoughtful real-world decision-making.",
          reportLanguage:
            "The learner is strengthening the ability to communicate economic reasoning clearly, using evidence and practical explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early needs-and-wants example, one planning or budgeting task, and one later evidence-based decision explanation so economic thinking growth is visible.",
    "Photos, simple budgets, comparison charts, learner reflections, and practical decision notes often make strong economics evidence in a homeschool portfolio.",
    "A portfolio becomes stronger when it shows how the learner moved from simple choices into trade-off thinking, planning, and clearer economic reasoning.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in decision-making, planning, trade-offs, value comparison, and evidence-based reasoning rather than only listing money topics.",
    "Examples are strongest when the learner explains why a choice was made, what constraints mattered, and what consequences followed.",
    "Collected evidence can show a clear shift from everyday choices and sharing into more mature budgeting and resource reasoning.",
  ],
};

const CULTURES_SOCIETIES_AND_PERSPECTIVES: HassStrandConfig = {
  key: "cultures-societies-and-perspectives",
  title: "Cultures, societies and perspectives",
  subtitle:
    "This strand helps learners explore identity, traditions, communities, migration, perspective, and social change. It grows from familiar family and community experiences into more thoughtful comparison, empathy, and respectful understanding of different ways people live and see the world.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on stories, relationships, and discussion. It connects strongly to history, civics, geography, inquiry, and respectful comparison of different experiences and viewpoints.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early learning begins with family identity, traditions, celebrations, and noticing similarities and differences in gentle, respectful ways.",
      steps: [
        {
          id: 1,
          title: "Talk about family, traditions, and belonging",
          meaning:
            "Notice that families and communities may have traditions, routines, celebrations, and ways of belonging.",
          skillFocus: "identity and belonging",
          practiceActivity:
            "Share a family tradition, celebration, meal, memory, or routine and talk about what it means.",
          evidenceExamples: [
            "a family tradition drawing or note",
            "a learner explanation of something special at home",
            "a parent summary of a belonging discussion",
          ],
          nextStep:
            "Build into lower-primary comparison of communities, customs, and respectful noticing of difference.",
          reportLanguage:
            "The learner is beginning to talk about family identity, traditions, and belonging in simple and meaningful ways.",
        },
        {
          id: 2,
          title: "Notice similarities and differences respectfully",
          meaning:
            "Recognise that people may do some things the same way and some things differently, and that this can be discussed kindly and with curiosity.",
          skillFocus: "early comparison and respect",
          practiceActivity:
            "Compare meals, languages, celebrations, clothing, games, or routines from family, community, or books.",
          evidenceExamples: [
            "a simple same-and-different page",
            "a learner statement about respectful comparison",
            "a parent note about a culture or community discussion",
          ],
          nextStep:
            "Carry this into lower-primary exploration of community, culture, and shared life.",
          reportLanguage:
            "The learner is developing early awareness that people may have different customs or experiences and can discuss these respectfully.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin comparing communities, traditions, and ways of life more deliberately while growing respect for difference and shared humanity.",
      steps: [
        {
          id: 1,
          title: "Describe community traditions and shared practices",
          meaning:
            "Notice that communities may have shared stories, customs, or ways of doing things that help shape identity.",
          skillFocus: "community culture awareness",
          practiceActivity:
            "Explore a local celebration, a family custom, a community event, or a story about how a group lives or gathers.",
          evidenceExamples: [
            "a note about a community practice",
            "a learner explanation of why a tradition matters",
            "a parent summary of a discussion about custom or identity",
          ],
          nextStep:
            "Build from community traditions into wider comparisons of perspective, place, and migration.",
          reportLanguage:
            "The learner is increasingly able to describe community traditions and explain how shared practices can shape identity and belonging.",
        },
        {
          id: 2,
          title: "Compare experiences and perspectives kindly",
          meaning:
            "Begin noticing that people may see, experience, or value things differently depending on life context and background.",
          skillFocus: "perspective awareness",
          practiceActivity:
            "Use stories, conversations, or picture books to compare how two people or groups may experience the same situation differently.",
          evidenceExamples: [
            "a learner comparison of two perspectives",
            "a parent note about a respectful comparison discussion",
            "a simple reflection on how another person may feel or think",
          ],
          nextStep:
            "Carry this into middle-primary migration, social comparison, and stronger empathy work.",
          reportLanguage:
            "The learner is beginning to compare experiences and perspectives in more thoughtful and respectful ways.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens understanding of migration, social difference, shared humanity, and how communities and perspectives develop over time.",
      steps: [
        {
          id: 1,
          title: "Explore migration, movement, and changing communities",
          meaning:
            "Understand that communities change as people move, settle, connect, and bring different experiences with them.",
          skillFocus: "migration and community change",
          practiceActivity:
            "Look at a family migration story, local community history, or wider movement example and discuss how it shaped community life.",
          evidenceExamples: [
            "a migration or movement summary",
            "a learner explanation of community change",
            "a parent note from a migration discussion",
          ],
          nextStep:
            "Use migration understanding to support upper-primary social change and perspective comparison.",
          reportLanguage:
            "The learner is increasingly able to explain how movement and migration can shape communities and change shared experiences over time.",
        },
        {
          id: 2,
          title: "Use stories and sources to understand different perspectives",
          meaning:
            "Compare accounts, traditions, or experiences to understand how background and context can influence viewpoint.",
          skillFocus: "source-based perspective comparison",
          practiceActivity:
            "Use stories, interviews, short texts, or images to compare how different people describe a place, event, or social experience.",
          evidenceExamples: [
            "a comparison of two perspectives using sources",
            "a learner explanation of why viewpoints differ",
            "a parent summary of a respectful source discussion",
          ],
          nextStep:
            "Carry this into upper-primary reasoning about social change, identity, and perspective with stronger evidence use.",
          reportLanguage:
            "The learner is beginning to use stories and sources to compare perspectives and explain why different viewpoints may exist.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin thinking more deliberately about identity, perspective, social change, and respectful interpretation of different experiences.",
      steps: [
        {
          id: 1,
          title: "Explain how identity and context shape perspective",
          meaning:
            "Recognise that family background, culture, place, belief, experience, and history can influence how people see the world.",
          skillFocus: "identity and perspective reasoning",
          practiceActivity:
            "Compare how two people or groups might respond to a shared issue, celebration, event, or community change.",
          evidenceExamples: [
            "a perspective explanation using context",
            "a learner reflection on identity and viewpoint",
            "a parent note from a thoughtful comparison discussion",
          ],
          nextStep:
            "Use identity and perspective reasoning to support lower-secondary discussion of social change and evidence.",
          reportLanguage:
            "The learner is increasingly able to explain how identity and context can shape perspective in more thoughtful ways.",
        },
        {
          id: 2,
          title: "Discuss social change respectfully and with evidence",
          meaning:
            "Use stories, examples, or source material to talk about how societies and communities change over time.",
          skillFocus: "social change and respectful discussion",
          practiceActivity:
            "Discuss a change in family life, work, migration, communication, or community expectations and what evidence shows about that change.",
          evidenceExamples: [
            "a short explanation of social change",
            "a learner comparison of past and present community life",
            "a parent summary of a respectful discussion",
          ],
          nextStep:
            "Carry this into lower-secondary analysis of social questions, evidence, and viewpoint comparison.",
          reportLanguage:
            "The learner is beginning to use evidence to discuss social change and compare how communities or expectations shift over time.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens perspective comparison, source use, and more thoughtful discussion about identity, social change, and community experience.",
      steps: [
        {
          id: 1,
          title: "Use evidence to compare social perspectives",
          meaning:
            "Support a comparison of viewpoints using sources, examples, and context rather than assumption alone.",
          skillFocus: "evidence-based perspective comparison",
          practiceActivity:
            "Compare sources or accounts about a community issue, migration story, cultural change, or social experience and discuss what each reveals.",
          evidenceExamples: [
            "a perspective comparison using evidence",
            "a learner explanation of differing social viewpoints",
            "a parent note from a source-based discussion",
          ],
          nextStep:
            "Use evidence-based perspective work to support later evaluation of social responses and claims.",
          reportLanguage:
            "The learner is increasingly able to compare social perspectives using evidence, context, and respectful reasoning.",
        },
        {
          id: 2,
          title: "Explain how societies change and respond over time",
          meaning:
            "Look at patterns of continuity and change in culture, identity, migration, or social life and explain what shaped them.",
          skillFocus: "social continuity and change reasoning",
          practiceActivity:
            "Use a case study, story, local example, or comparison of earlier and current practices to discuss what changed and why.",
          evidenceExamples: [
            "a social-change explanation",
            "a learner note about continuity and change in community life",
            "a parent summary of a HASS discussion",
          ],
          nextStep:
            "Build toward later consolidation where perspectives and responses are compared more critically.",
          reportLanguage:
            "The learner is developing stronger understanding of how societies change over time and can increasingly explain those changes using evidence and context.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together perspective, identity, source use, and more mature explanation of social experience, continuity, and change.",
      steps: [
        {
          id: 1,
          title: "Evaluate responses to social change or cultural questions",
          meaning:
            "Compare possible responses, interpretations, or viewpoints and weigh which seem more balanced or evidence-based.",
          skillFocus: "evaluation of social responses",
          practiceActivity:
            "Compare two responses to a cultural, migration, or community question and discuss which view is better supported and more thoughtful.",
          evidenceExamples: [
            "an evaluation of social perspectives",
            "a learner comparison using evidence and context",
            "a parent note from a critical but respectful discussion",
          ],
          nextStep:
            "Use this evaluation habit across HASS inquiry, reporting, and later interdisciplinary project work.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate social perspectives and responses using evidence, context, and respectful reasoning.",
        },
        {
          id: 2,
          title: "Communicate perspective and social understanding clearly",
          meaning:
            "Present a coherent explanation about identity, culture, migration, or social change using evidence and careful language.",
          skillFocus: "clear communication about society and perspective",
          practiceActivity:
            "Create a short report, comparison, or presentation about a social or cultural topic using sources and examples.",
          evidenceExamples: [
            "a social-studies report or presentation",
            "a learner explanation connecting evidence and perspective",
            "a respectful comparison of social viewpoints",
          ],
          nextStep:
            "These habits continue to support stronger reporting, empathy, respectful discussion, and community understanding.",
          reportLanguage:
            "The learner is strengthening the ability to communicate social understanding clearly, using evidence, context, and respectful explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early family-or-community identity example, one perspective comparison, and one later evidence-based social explanation so growth in understanding is visible.",
    "Photos, learner reflections, interview notes, story comparisons, and respectful discussion summaries often make strong evidence in this strand.",
    "A portfolio becomes stronger when it shows how the learner moved from noticing customs and belonging into perspective-taking, source use, and social reasoning.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in identity awareness, perspective comparison, respectful discussion, source use, and explanation of social change rather than only listing topics.",
    "Examples are strongest when the learner explains how context shapes perspective and what evidence supports the comparison or conclusion.",
    "Collected evidence can show a clear shift from simple belonging and difference awareness into more mature social understanding and communication.",
  ],
};

const INQUIRY_SOURCES_AND_EVIDENCE: HassStrandConfig = {
  key: "inquiry-sources-and-evidence",
  title: "Inquiry, sources and evidence",
  subtitle:
    "Inquiry, sources and evidence helps learners ask questions, gather information, compare accounts, organise findings, and explain conclusions. It supports every Humanities & Social Sciences strand by turning curiosity into clearer, evidence-based understanding.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on curiosity, discussion, observation, and simple recording. It supports every Humanities & Social Sciences strand through questions, sources, comparison, evidence, and explanation.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early inquiry begins with wondering, noticing, asking simple questions, and talking about what can help us find out more.",
      steps: [
        {
          id: 1,
          title: "Ask simple questions about people, places, or the past",
          meaning:
            "Use curiosity to notice what is interesting and what more could be found out.",
          skillFocus: "early questioning",
          practiceActivity:
            "Ask about a family photo, local place, object, story, or community event and record one or two wonderings together.",
          evidenceExamples: [
            "a note of learner questions",
            "a drawing with a simple wondering",
            "a parent summary of an inquiry conversation",
          ],
          nextStep:
            "Build from simple wonderings into gathering basic clues, stories, and observations.",
          reportLanguage:
            "The learner is beginning to ask simple inquiry questions about people, places, stories, and the world around them.",
        },
        {
          id: 2,
          title: "Use stories, pictures, and observation as clues",
          meaning:
            "Notice that we can learn from what we see, hear, and are shown by others.",
          skillFocus: "early clue and source awareness",
          practiceActivity:
            "Look at a picture, object, map, or family story and ask what it helps us know.",
          evidenceExamples: [
            "a note about what a picture or object showed",
            "a learner explanation of a clue",
            "a parent note from a simple source discussion",
          ],
          nextStep:
            "Carry this into lower-primary information gathering, sorting, and retelling.",
          reportLanguage:
            "The learner is developing early understanding that stories, pictures, objects, and observations can help answer questions.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin collecting simple information, asking better questions, and recording findings in more organised ways.",
      steps: [
        {
          id: 1,
          title: "Gather information from simple sources",
          meaning:
            "Use books, conversations, photos, maps, or observations to collect information for a small question.",
          skillFocus: "early information gathering",
          practiceActivity:
            "Ask a family member, use a simple text, or observe a place and record what was found out about a question.",
          evidenceExamples: [
            "a small source list or note page",
            "a learner explanation of where information came from",
            "a parent note about an inquiry task",
          ],
          nextStep:
            "Use source gathering to support sorting, organising, and comparing information.",
          reportLanguage:
            "The learner is increasingly able to gather information from simple sources and use it to answer a small inquiry question.",
        },
        {
          id: 2,
          title: "Record findings with pictures, labels, or short notes",
          meaning:
            "Capture what was found so the information can be shared, checked, or compared later.",
          skillFocus: "simple recording of findings",
          practiceActivity:
            "Use a chart, labelled drawing, oral summary, or short notes to record what was learned from an inquiry task.",
          evidenceExamples: [
            "a simple inquiry chart or drawing",
            "a learner oral summary of findings",
            "a parent note about how information was recorded",
          ],
          nextStep:
            "Carry this into middle-primary source comparison and evidence-based explanation.",
          reportLanguage:
            "The learner is building confidence in recording findings from simple inquiry tasks using pictures, labels, or short notes.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens source comparison, organised note-making, and explanation of what information best supports an answer.",
      steps: [
        {
          id: 1,
          title: "Compare different sources for the same question",
          meaning:
            "Notice that different sources may add, confirm, or change what we think we know.",
          skillFocus: "source comparison",
          practiceActivity:
            "Use two or more sources such as maps, interviews, photos, short texts, or charts and compare what each contributes.",
          evidenceExamples: [
            "a source-comparison note",
            "a learner explanation of how sources differed",
            "a parent summary of a comparison discussion",
          ],
          nextStep:
            "Use source comparison to support stronger evidence-based conclusions.",
          reportLanguage:
            "The learner is increasingly able to compare different sources and explain how each can contribute to an inquiry question.",
        },
        {
          id: 2,
          title: "Use notes and evidence to answer a question more clearly",
          meaning:
            "Bring together what was found and explain how it helps answer the original question.",
          skillFocus: "evidence-based response building",
          practiceActivity:
            "Organise notes from a small inquiry and explain what the evidence suggests about a place, person, event, or issue.",
          evidenceExamples: [
            "an inquiry response using notes",
            "a learner explanation linked to evidence",
            "a parent note about how a conclusion was built",
          ],
          nextStep:
            "Carry this into upper-primary evaluation of source usefulness and clearer communication of claims.",
          reportLanguage:
            "The learner is beginning to use notes and evidence more deliberately to answer inquiry questions with growing clarity.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin evaluating source usefulness, organising findings more deliberately, and communicating supported conclusions more clearly.",
      steps: [
        {
          id: 1,
          title: "Explain why one source may be more useful than another",
          meaning:
            "Consider what a source can show, what it may leave out, and how helpful it is for a specific inquiry question.",
          skillFocus: "source usefulness and selection",
          practiceActivity:
            "Compare two sources for a topic and discuss which is more useful for the question being asked and why.",
          evidenceExamples: [
            "a short source-usefulness comparison",
            "a learner explanation of source choice",
            "a parent note from an inquiry discussion",
          ],
          nextStep:
            "Use source evaluation to support lower-secondary evidence quality and claim-building.",
          reportLanguage:
            "The learner is increasingly able to explain why one source may be more useful than another for a particular inquiry task.",
        },
        {
          id: 2,
          title: "Organise evidence into a supported conclusion",
          meaning:
            "Sort findings into a clearer structure so a claim or explanation can be communicated more coherently.",
          skillFocus: "organising and communicating evidence",
          practiceActivity:
            "Use a chart, paragraph plan, visual organiser, or short presentation to show how evidence supports a conclusion.",
          evidenceExamples: [
            "an organised inquiry summary",
            "a learner explanation showing how evidence supports a claim",
            "a parent note on organising findings",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of claim strength and source quality.",
          reportLanguage:
            "The learner is beginning to organise inquiry findings more clearly and connect evidence to a supported conclusion.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens source evaluation, evidence quality thinking, and more deliberate explanation of how conclusions are supported.",
      steps: [
        {
          id: 1,
          title: "Evaluate the strength of evidence for a claim",
          meaning:
            "Consider whether the evidence is relevant, clear, balanced, and enough to support the conclusion being made.",
          skillFocus: "evidence evaluation",
          practiceActivity:
            "Review a small set of sources or notes and discuss which pieces of evidence are strongest, weakest, or missing.",
          evidenceExamples: [
            "an evidence-strength evaluation",
            "a learner explanation of why one source was stronger",
            "a parent summary of an inquiry-quality discussion",
          ],
          nextStep:
            "Use evidence evaluation to support later comparison of competing claims and interpretations.",
          reportLanguage:
            "The learner is increasingly able to evaluate the strength of evidence and explain how well it supports a claim or conclusion.",
        },
        {
          id: 2,
          title: "Communicate claims with clearer reasoning",
          meaning:
            "Present a claim or conclusion in a way that shows the link between question, evidence, and explanation.",
          skillFocus: "reasoned inquiry communication",
          practiceActivity:
            "Prepare a short report, chart, or spoken explanation that states the question, key evidence, and final conclusion clearly.",
          evidenceExamples: [
            "a structured inquiry report",
            "a learner explanation connecting claim and evidence",
            "a parent note about reasoning clarity",
          ],
          nextStep:
            "Build toward later consolidation where competing claims and interpretations are weighed more critically.",
          reportLanguage:
            "The learner is developing stronger ability to communicate inquiry claims clearly and show how evidence supports the conclusion.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together questioning, source evaluation, evidence organisation, and more mature explanation of claims and conclusions.",
      steps: [
        {
          id: 1,
          title: "Compare competing claims or interpretations critically",
          meaning:
            "Weigh how well different claims, viewpoints, or interpretations are supported by available evidence.",
          skillFocus: "critical comparison of claims",
          practiceActivity:
            "Compare two explanations, historical interpretations, civic views, or geographic responses and discuss which is better supported.",
          evidenceExamples: [
            "a comparison of competing claims",
            "a learner explanation weighing evidence quality",
            "a parent note from a critical inquiry discussion",
          ],
          nextStep:
            "Use this evaluative habit across all HASS strands, reporting, and later interdisciplinary project work.",
          reportLanguage:
            "The learner is consolidating the ability to compare competing claims or interpretations and weigh how well each is supported by evidence.",
        },
        {
          id: 2,
          title: "Communicate inquiry conclusions clearly and responsibly",
          meaning:
            "Present a final conclusion with evidence, reasoning, and appropriate acknowledgement of limits or uncertainty where needed.",
          skillFocus: "mature inquiry communication",
          practiceActivity:
            "Create a short report, presentation, poster, or evidence summary about a HASS question and explain how the conclusion was reached.",
          evidenceExamples: [
            "a final inquiry report or presentation",
            "a learner explanation of evidence, conclusion, and limits",
            "an annotated source-supported summary",
          ],
          nextStep:
            "These habits continue to support stronger reporting, portfolio evidence, and disciplined thinking across many subject areas.",
          reportLanguage:
            "The learner is strengthening the ability to communicate inquiry conclusions clearly and responsibly, using evidence and explanation with growing maturity.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early question-and-clue example, one source-comparison task, and one later evidence-based conclusion so inquiry growth is visible over time.",
    "Question lists, note pages, interview summaries, maps, photos, and learner explanations often make strong inquiry evidence in a homeschool portfolio.",
    "A portfolio becomes stronger when it shows how the learner moved from wondering and collecting clues into evaluating sources and communicating supported conclusions.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in questioning, source use, evidence comparison, organisation of findings, and supported explanation rather than only naming inquiry topics.",
    "Examples are strongest when the learner shows how the question was explored, what evidence was used, and how the conclusion was justified.",
    "Collected evidence can show a clear shift from simple question-asking into more mature evidence evaluation and communication.",
  ],
};

const HUMANITIES_STRAND_CONFIGS: HassStrandConfig[] = [
  HISTORY_AND_CHANGE_OVER_TIME,
  GEOGRAPHY_PLACE_AND_ENVIRONMENT,
  CIVICS_COMMUNITY_AND_CITIZENSHIP,
  ECONOMICS_RESOURCES_AND_DECISION_MAKING,
  CULTURES_SOCIETIES_AND_PERSPECTIVES,
  INQUIRY_SOURCES_AND_EVIDENCE,
];

export const HUMANITIES_STRAND_WORKSPACE_BUILDERS: Record<string, StrandBuilder> =
  Object.fromEntries(
    HUMANITIES_STRAND_CONFIGS.map((config) => [
      config.key,
      (currentFocusStageKey: PathwayStageKey) =>
        buildHassWorkspace(currentFocusStageKey, config),
    ]),
  );

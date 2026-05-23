import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

type ScienceStepInput = {
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

type ScienceStageInput = {
  key: PathwayStageKey;
  helper: string;
  steps: [ScienceStepInput, ScienceStepInput];
};

type ScienceStrandConfig = {
  key: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  portfolioSupport: string[];
  reportingSupport: string[];
  stages: ScienceStageInput[];
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

function buildScienceStep(step: ScienceStepInput) {
  return {
    id: step.id,
    title: step.title,
    meaning: step.meaning,
    skillFocus: step.skillFocus,
    learningIntention:
      step.learningIntention ||
      `Develop ${step.skillFocus} through noticing, discussion, investigation, recording, and explanation.`,
    successCriteria: step.successCriteria || [
      "The learner can use this science idea in a familiar observation, discussion, or task.",
      "The learner can record, show, or explain what was noticed.",
      "The learner can respond to questions or feedback about the evidence collected.",
    ],
    practiceActivity: step.practiceActivity,
    evidenceExamples: step.evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      "Later, check whether the learner can use the idea more independently and explain what evidence supports it.",
    nextStep: step.nextStep,
    reportLanguage: step.reportLanguage,
  };
}

function buildScienceWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: ScienceStrandConfig,
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
      steps: stage.steps.map(buildScienceStep),
    })),
    portfolioSupport: config.portfolioSupport,
    reportingSupport: config.reportingSupport,
  };
}

export const DEFAULT_SCIENCE_STRAND_KEY = "scientific-inquiry-and-investigation";

export const SCIENCE_SUBJECT_OVERVIEW = {
  eyebrow: "Science F-10 / K-10 strand map",
  title: "Science pathway overview",
  description:
    "This first Science build shows inquiry, living systems, Earth and space, physical science, materials, forces, health, and science-in-society as connected strands. Each strand uses the same calm stage-based pathway workspace as Mathematics and English.",
  helper:
    "Choose one strand to explore. The selected strand opens in the focused workspace below, so Science stays guided and readable rather than becoming a long content wall.",
};

export const SCIENCE_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "scientific-inquiry-and-investigation",
    title: "Scientific inquiry and investigation",
    description:
      "Grow noticing, questioning, predicting, testing, recording, and explaining with evidence.",
    whyItMatters:
      "Inquiry supports every science strand and helps learners move from curiosity into evidence-based explanation.",
    status: "first-detailed",
  },
  {
    key: "living-things-and-environments",
    title: "Living things and environments",
    description:
      "Explore plants, animals, habitats, life cycles, ecosystems, adaptation, and human impact.",
    whyItMatters:
      "Living things connects close observation, classification, care, systems thinking, and environmental responsibility.",
    status: "detailed",
  },
  {
    key: "earth-and-space",
    title: "Earth and space",
    description:
      "Track weather, seasons, land, water, rocks, soil, Earth systems, and space patterns.",
    whyItMatters:
      "Earth and space builds long-term observation, pattern noticing, modelling, and systems thinking about the world around us.",
    status: "detailed",
  },
  {
    key: "physical-sciences",
    title: "Physical sciences",
    description:
      "Investigate light, sound, heat, electricity, magnetism, and everyday physical phenomena.",
    whyItMatters:
      "Physical science helps learners explain common experiences and understand how invisible processes shape daily life.",
    status: "detailed",
  },
  {
    key: "materials-matter-and-change",
    title: "Materials, matter and change",
    description:
      "Compare properties, sort materials, explore states, mixing, and reversible and irreversible change.",
    whyItMatters:
      "This strand supports careful comparison, material choices, and later explanation of how matter behaves and changes.",
    status: "detailed",
  },
  {
    key: "forces-energy-and-motion",
    title: "Forces, energy and motion",
    description:
      "Explore push and pull, movement, gravity, friction, simple machines, and energy transfer.",
    whyItMatters:
      "Forces and motion helps learners explain movement, design, and practical mechanical ideas in everyday life.",
    status: "detailed",
  },
  {
    key: "human-body-and-health",
    title: "Human body and health",
    description:
      "Study body parts, senses, growth, systems, nutrition, movement, health choices, and wellbeing.",
    whyItMatters:
      "Human body science connects observation, evidence, personal care, and practical understanding of how bodies function.",
    status: "detailed",
  },
  {
    key: "science-in-society-and-technology",
    title: "Science in society and technology",
    description:
      "Consider tools, inventions, environmental decisions, evidence in public claims, and real-world science.",
    whyItMatters:
      "This strand applies inquiry, evidence, and explanation to decisions, technologies, and responsible participation in the wider world.",
    status: "detailed",
  },
];

const SCIENTIFIC_INQUIRY_AND_INVESTIGATION: ScienceStrandConfig = {
  key: "scientific-inquiry-and-investigation",
  title: "Scientific inquiry and investigation",
  subtitle:
    "Scientific inquiry grows from noticing and wondering into testing ideas, recording results, evaluating evidence, and explaining findings. It supports every other science strand and helps families see how scientific thinking develops over time.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on curiosity, language, number, and careful observation. It supports living things, Earth and space, materials, physical science, and every later strand that depends on evidence and explanation.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early science begins with noticing, wondering, describing what is seen, and talking about simple changes in the world around us.",
      steps: [
        {
          id: 1,
          title: "Notice and describe interesting things in the world",
          meaning:
            "Use senses to observe living things, weather, objects, and everyday events and talk about what is noticed.",
          skillFocus: "close observation and curiosity",
          practiceActivity:
            "Take a nature walk, look closely at a plant, shell, puddle, or shadow, and talk about what looks the same or different.",
          evidenceExamples: [
            "a photo and parent note from a simple observation walk",
            "a learner drawing of something noticed closely",
            "a short oral description of what changed or stood out",
          ],
          nextStep:
            "Build from noticing into asking simple questions and making first predictions.",
          reportLanguage:
            "The learner is beginning to observe the world closely and share simple science ideas about what is noticed.",
        },
        {
          id: 2,
          title: "Ask simple questions and guess what might happen",
          meaning:
            "Use wonderings and early predictions as a first step toward investigation.",
          skillFocus: "questioning and predicting",
          practiceActivity:
            "Ask what might happen if ice is left outside, a seed is watered, or an object is placed in sunlight or shade.",
          evidenceExamples: [
            "a parent note about a learner question",
            "a simple prediction before a home science activity",
            "a drawing or spoken explanation of what might happen next",
          ],
          nextStep:
            "Carry this into lower-primary observing, testing, and recording with simple structure.",
          reportLanguage:
            "The learner is showing early inquiry habits by asking questions and making simple predictions about everyday science experiences.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin observing more purposefully, comparing results, and recording ideas with pictures, labels, and simple notes.",
      steps: [
        {
          id: 1,
          title: "Observe and compare carefully",
          meaning:
            "Look for similarities, differences, and simple patterns when comparing living things, materials, or events.",
          skillFocus: "purposeful observation and comparison",
          practiceActivity:
            "Compare leaves, rocks, seeds, shadows, or toy ramps and talk about how the observations are alike or different.",
          evidenceExamples: [
            "a simple compare-and-contrast science page",
            "a parent note from a hands-on science comparison",
            "a labelled drawing showing observed differences",
          ],
          nextStep:
            "Use careful comparison to support better recording and simple testing.",
          reportLanguage:
            "The learner is building more deliberate observation habits and can compare simple science experiences with growing care.",
        },
        {
          id: 2,
          title: "Record simple science ideas with drawings or labels",
          meaning:
            "Capture what was done and what happened so the experience can be revisited or discussed.",
          skillFocus: "early recording and communication",
          practiceActivity:
            "Use a science notebook page with a picture, labels, one short sentence, or an oral explanation recorded by a parent.",
          evidenceExamples: [
            "a science journal page with pictures or labels",
            "a photo sequence showing the task and result",
            "a parent transcription of a spoken explanation",
          ],
          nextStep:
            "Build from simple recording into fairer testing and clearer result talk.",
          reportLanguage:
            "The learner is beginning to record science observations and communicate what was noticed in simple but meaningful ways.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Inquiry becomes more structured here, with fair testing, measured observation, and clearer discussion about what the evidence shows.",
      steps: [
        {
          id: 1,
          title: "Plan and carry out simple fair tests",
          meaning:
            "Test one change at a time where possible and notice how that helps make results clearer.",
          skillFocus: "fair testing and procedural thinking",
          practiceActivity:
            "Test paper aeroplanes, seed growth conditions, melting speed, or simple ramps while keeping most conditions the same.",
          evidenceExamples: [
            "a simple fair-test planner",
            "a table of observations or measured results",
            "a parent note about how the learner kept the test fairer",
          ],
          nextStep:
            "Use this structure to gather more reliable data and explain results more clearly.",
          reportLanguage:
            "The learner is learning to carry out simple fair tests and is beginning to understand why controlled comparisons matter.",
        },
        {
          id: 2,
          title: "Use results to explain what happened",
          meaning:
            "Link observations or measurements back to the question and talk about what the evidence suggests.",
          skillFocus: "evidence-based explanation",
          practiceActivity:
            "Discuss which ramp worked best, which plant condition changed growth, or what the measured pattern suggests.",
          evidenceExamples: [
            "a short written conclusion",
            "a learner explanation using observations or measurements",
            "a parent summary of evidence-based discussion",
          ],
          nextStep:
            "Build toward upper-primary interpretation, better method choices, and stronger reasoning from evidence.",
          reportLanguage:
            "The learner is increasingly able to use science evidence to explain what happened and respond to the original question.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners begin refining methods, choosing useful measurements, and explaining how evidence supports a stronger science claim.",
      steps: [
        {
          id: 1,
          title: "Choose useful ways to measure and record",
          meaning:
            "Use tables, labelled diagrams, repeated observations, or simple graphs to keep a clearer science record.",
          skillFocus: "measurement and organised recording",
          practiceActivity:
            "Record temperature, length, growth, timing, or repeated results in tables, graphs, or labelled diagrams during an investigation.",
          evidenceExamples: [
            "a science table or graph",
            "a labelled investigation diagram",
            "a parent note about why one recording method was useful",
          ],
          nextStep:
            "Use clearer recording to compare patterns and evaluate whether the method worked well.",
          reportLanguage:
            "The learner is becoming more organised in recording science investigations and can choose simple ways to show results clearly.",
        },
        {
          id: 2,
          title: "Explain whether the evidence supports the idea",
          meaning:
            "Compare results with the original prediction and discuss whether the evidence supports, changes, or complicates the first idea.",
          skillFocus: "reasoning from evidence",
          practiceActivity:
            "Return to the original prediction after the test and discuss what the evidence actually showed and why.",
          evidenceExamples: [
            "a prediction-and-result reflection",
            "a short science conclusion page",
            "a learner explanation about whether the evidence matched expectations",
          ],
          nextStep:
            "Carry this into lower-secondary inquiry design, data interpretation, and evaluation of method quality.",
          reportLanguage:
            "The learner is increasingly able to compare predictions with evidence and explain what the investigation results suggest.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens independence in designing investigations, analysing patterns, and evaluating how reliable the evidence may be.",
      steps: [
        {
          id: 1,
          title: "Design and refine investigations more independently",
          meaning:
            "Plan a clearer method, choose useful variables or measures, and adjust the investigation when a weakness appears.",
          skillFocus: "independent investigation design",
          practiceActivity:
            "Plan a home investigation around light, temperature, materials, plant growth, or motion and revise the setup after an early trial.",
          evidenceExamples: [
            "an investigation plan with method notes",
            "a revision note explaining an improved setup",
            "a parent observation of independent science planning",
          ],
          nextStep:
            "Use this planning confidence to evaluate evidence quality and compare competing explanations.",
          reportLanguage:
            "The learner is developing greater independence in planning and refining science investigations for clearer evidence.",
        },
        {
          id: 2,
          title: "Analyse patterns and comment on reliability",
          meaning:
            "Look for trends, anomalies, or limits in the results and comment on how much confidence to place in the conclusion.",
          skillFocus: "pattern analysis and reliability",
          practiceActivity:
            "Review repeated trials or a small data set and ask what pattern appears, what seems unusual, and what could make the conclusion stronger.",
          evidenceExamples: [
            "a pattern summary with comments on reliability",
            "annotated results noting an unusual data point",
            "a learner explanation of what would improve the evidence",
          ],
          nextStep:
            "Build toward later consolidation where evidence is compared more critically and communicated more formally.",
          reportLanguage:
            "The learner is increasingly able to analyse science patterns and comment on how reliable or limited the available evidence may be.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together independent inquiry, critical use of evidence, and clearer science communication in more complex or open-ended contexts.",
      steps: [
        {
          id: 1,
          title: "Use evidence to compare explanations or models",
          meaning:
            "Consider more than one explanation and weigh which idea best fits the evidence available.",
          skillFocus: "critical evaluation of explanations",
          practiceActivity:
            "Compare two explanations for a science result, environmental pattern, or practical phenomenon and discuss which is better supported.",
          evidenceExamples: [
            "a comparison of two science explanations",
            "a learner justification using evidence",
            "a parent summary of a critical science discussion",
          ],
          nextStep:
            "Use this evaluative habit across subject pathways, research tasks, and real-world science claims.",
          reportLanguage:
            "The learner is consolidating the ability to weigh evidence carefully and compare competing science explanations with growing maturity.",
        },
        {
          id: 2,
          title: "Communicate investigation findings clearly",
          meaning:
            "Present question, method, evidence, and conclusion in a way another person can follow and evaluate.",
          skillFocus: "science communication",
          practiceActivity:
            "Create a short science report, slide summary, poster, or verbal presentation that explains a completed investigation and its findings.",
          evidenceExamples: [
            "a science report or presentation",
            "a diagram or graph sequence supporting a conclusion",
            "a recorded verbal explanation of findings",
          ],
          nextStep:
            "These habits continue to support stronger science learning, reporting, and interdisciplinary project work.",
          reportLanguage:
            "The learner is strengthening the ability to communicate science investigations clearly, using evidence and explanation in a more coherent way.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early observation record, one fair-test example, and one later evidence-based explanation so inquiry growth is visible over time.",
    "Photographs of investigations, notebook pages, and short learner explanations often show science thinking more clearly than a finished worksheet alone.",
    "A portfolio becomes stronger when it shows how the learner moved from wondering and noticing into testing, recording, and explaining.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, questioning, testing, recording, and reasoning from evidence rather than only naming science topics covered.",
    "Examples are strongest when the learner can explain what was investigated, what was observed, and what evidence supported the conclusion.",
    "Collected evidence can show a clear shift from simple curiosity toward more deliberate investigation and explanation.",
  ],
};

const LIVING_THINGS_AND_ENVIRONMENTS: ScienceStrandConfig = {
  key: "living-things-and-environments",
  title: "Living things and environments",
  subtitle:
    "Living things and environments helps learners notice how organisms live, grow, depend on habitats, and interact with wider ecosystems. It builds care, classification, evidence use, and stronger environmental understanding over time.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on close observation and scientific inquiry. It connects strongly to human body science, Earth systems, classification, evidence, and later ecological reasoning.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early learning focuses on noticing living things, describing simple features, and recognising that plants and animals have needs.",
      steps: [
        {
          id: 1,
          title: "Notice living things and what makes them special",
          meaning:
            "Describe familiar plants and animals and begin noticing that living things grow and change.",
          skillFocus: "observing living things",
          practiceActivity:
            "Look at garden plants, pets, insects, or birds and talk about what they look like, how they move, or what they need.",
          evidenceExamples: [
            "a labelled drawing of a plant or animal",
            "a parent note about what the learner noticed",
            "a short oral description of a familiar living thing",
          ],
          nextStep:
            "Build into lower-primary work on needs, habitats, and basic life cycles.",
          reportLanguage:
            "The learner is beginning to observe living things closely and describe simple features, needs, and changes.",
        },
        {
          id: 2,
          title: "Recognise that living things need care",
          meaning:
            "Understand that plants and animals need things like food, water, air, light, and safe places.",
          skillFocus: "needs of living things",
          practiceActivity:
            "Care for a plant, observe a pet routine, or discuss what a bird, insect, or tree needs to stay alive.",
          evidenceExamples: [
            "a care chart for a plant or pet",
            "a parent note about a discussion on living needs",
            "a photo sequence of plant care or garden observation",
          ],
          nextStep:
            "Use this care perspective to explore habitats, life cycles, and environmental patterns.",
          reportLanguage:
            "The learner is developing an early understanding that living things have needs and depend on supportive environments.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin grouping living things, exploring habitats, and noticing simple life-cycle changes and environmental needs.",
      steps: [
        {
          id: 1,
          title: "Sort living things by simple features",
          meaning:
            "Use visible characteristics to group plants or animals and describe how they are alike or different.",
          skillFocus: "classification and comparison",
          practiceActivity:
            "Sort leaves, seeds, insects, birds, or pet photos by size, covering, movement, or habitat.",
          evidenceExamples: [
            "a sorting chart or simple classification page",
            "a learner explanation of how groups were made",
            "a parent note from a comparison activity",
          ],
          nextStep:
            "Build from grouping into understanding habitats, food, shelter, and life-cycle patterns.",
          reportLanguage:
            "The learner is increasingly able to group living things by simple features and describe basic similarities and differences.",
        },
        {
          id: 2,
          title: "Explore habitats and simple life cycles",
          meaning:
            "Notice where living things live, what they need there, and how some organisms grow and change over time.",
          skillFocus: "habitats and life cycles",
          practiceActivity:
            "Observe a garden area, pond, ant trail, or plant growth sequence and talk about shelter, food, and change.",
          evidenceExamples: [
            "a habitat drawing or map",
            "a simple life-cycle sequence",
            "a parent note about habitat talk or garden observation",
          ],
          nextStep:
            "Carry this into middle-primary ecosystem relationships and adaptation ideas.",
          reportLanguage:
            "The learner is building understanding of habitats and life cycles and can increasingly describe how living things depend on their environments.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens classification, adaptation, and the idea that living things depend on each other and their environments.",
      steps: [
        {
          id: 1,
          title: "Explain how features help living things survive",
          meaning:
            "Connect visible features or behaviours to how an organism lives in its environment.",
          skillFocus: "adaptation and survival thinking",
          practiceActivity:
            "Compare beaks, leaves, shells, fur, roots, or movement and ask how those features help in a habitat.",
          evidenceExamples: [
            "a feature-and-function explanation",
            "a learner note about adaptation",
            "a parent summary of comparison discussion",
          ],
          nextStep:
            "Use this idea to understand food chains, dependence, and ecosystem relationships.",
          reportLanguage:
            "The learner is increasingly able to explain how features or behaviours can help living things survive in particular environments.",
        },
        {
          id: 2,
          title: "Describe simple ecosystem relationships",
          meaning:
            "Notice that living things depend on each other and on resources in their environments.",
          skillFocus: "ecosystem relationships",
          practiceActivity:
            "Build a simple food-chain model, compare habitat roles, or discuss what happens if one part of an environment changes.",
          evidenceExamples: [
            "a simple food-chain diagram",
            "a parent note about ecosystem discussion",
            "a learner explanation of how one living thing affects another",
          ],
          nextStep:
            "Build toward upper-primary work on interdependence and human impact.",
          reportLanguage:
            "The learner is beginning to recognise ecosystem relationships and explain simple ways living things depend on one another.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners begin thinking more systemically about ecosystems, interdependence, and the effects of environmental change.",
      steps: [
        {
          id: 1,
          title: "Explain interdependence within habitats",
          meaning:
            "Understand that changes to food, shelter, water, or species relationships can affect many parts of a habitat.",
          skillFocus: "interdependence and systems thinking",
          practiceActivity:
            "Study a local habitat, create a habitat web, or discuss what might happen if a species or resource changes.",
          evidenceExamples: [
            "a habitat web or systems map",
            "a learner explanation of habitat change",
            "a parent summary of interdependence discussion",
          ],
          nextStep:
            "Carry this into lower-secondary biodiversity, adaptation, and ecological impact work.",
          reportLanguage:
            "The learner is increasingly able to explain interdependence within habitats and consider how environmental change can affect living systems.",
        },
        {
          id: 2,
          title: "Consider how human actions affect environments",
          meaning:
            "Use evidence to discuss how human choices can harm, protect, or change habitats and ecosystems.",
          skillFocus: "human impact and environmental evidence",
          practiceActivity:
            "Compare a cared-for area with a damaged one, examine local rubbish or water issues, or discuss a conservation example.",
          evidenceExamples: [
            "a reflection on an environmental issue",
            "a parent note from a conservation discussion",
            "a learner comparison of two environmental situations",
          ],
          nextStep:
            "Build toward more critical ecological reasoning and evidence-based environmental decisions.",
          reportLanguage:
            "The learner is building awareness of how human actions can affect environments and is beginning to discuss these effects using evidence.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens biodiversity, system interaction, and evidence-based explanation about ecological balance and change.",
      steps: [
        {
          id: 1,
          title: "Investigate how organisms and environments interact",
          meaning:
            "Look more closely at system interactions such as population change, resource pressure, or environmental disturbance.",
          skillFocus: "ecological interaction and evidence",
          practiceActivity:
            "Use field observations, case studies, or local environmental examples to discuss changes in living systems over time.",
          evidenceExamples: [
            "an ecology case-study summary",
            "a learner explanation using field or text evidence",
            "a comparison of environmental conditions or impacts",
          ],
          nextStep:
            "Use this ecological evidence to support later sustainability and systems thinking.",
          reportLanguage:
            "The learner is developing stronger ecological understanding and can increasingly explain interactions between organisms and environments using evidence.",
        },
        {
          id: 2,
          title: "Use evidence to discuss biodiversity and change",
          meaning:
            "Understand that biodiversity matters and can be affected by human choices, environmental pressures, and system change.",
          skillFocus: "biodiversity and environmental reasoning",
          practiceActivity:
            "Compare two habitats, consider species diversity, or examine a local or global example of environmental stress and response.",
          evidenceExamples: [
            "a biodiversity comparison",
            "a learner explanation of why diversity matters",
            "a parent note from a discussion on environmental pressure",
          ],
          nextStep:
            "Build into later consolidation where ecological choices and evidence are weighed more critically.",
          reportLanguage:
            "The learner is increasingly able to discuss biodiversity and environmental change with growing awareness of evidence and consequence.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together ecological reasoning, sustainability, and more critical use of evidence about environmental systems and change.",
      steps: [
        {
          id: 1,
          title: "Evaluate environmental evidence and possible responses",
          meaning:
            "Compare possible actions or explanations and weigh which response is better supported in a living-systems context.",
          skillFocus: "evaluation and environmental decision-making",
          practiceActivity:
            "Review a conservation issue, habitat proposal, or land-use question and discuss what evidence best supports a response.",
          evidenceExamples: [
            "a written environmental evaluation",
            "a learner justification of a proposed response",
            "a comparison of evidence from more than one source",
          ],
          nextStep:
            "Use this evaluative habit across science-in-society, geography, and integrated project work.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate environmental evidence and consider more informed responses to ecological issues.",
        },
        {
          id: 2,
          title: "Communicate ecological understanding clearly",
          meaning:
            "Explain living systems, environmental change, and evidence in a way that shows mature understanding and careful reasoning.",
          skillFocus: "ecological communication",
          practiceActivity:
            "Prepare a short report, poster, presentation, or fieldwork summary about a habitat, biodiversity issue, or environmental investigation.",
          evidenceExamples: [
            "a science report or visual summary",
            "a fieldwork or habitat presentation",
            "a learner explanation connecting evidence and conclusion",
          ],
          nextStep:
            "These habits continue to support stronger science reporting, portfolio evidence, and interdisciplinary environmental learning.",
          reportLanguage:
            "The learner is strengthening the ability to communicate ecological understanding clearly and support conclusions with relevant evidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early observation record, one habitat or life-cycle example, and one later ecological explanation so growth from noticing into systems thinking is visible.",
    "Photos from nature study, garden projects, field walks, and simple classification pages often make strong portfolio evidence in this strand.",
    "A portfolio becomes stronger when it includes the learner's own explanations about relationships, needs, and environmental change.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, classification, habitat understanding, adaptation, and ecological reasoning rather than only listing topics studied.",
    "Examples are strongest when the learner explains how living things depend on environments and what evidence supports that view.",
    "Collected evidence can show a clear shift from recognising living things to discussing ecosystems, biodiversity, and human impact.",
  ],
};

const EARTH_AND_SPACE: ScienceStrandConfig = {
  key: "earth-and-space",
  title: "Earth and space",
  subtitle:
    "Earth and space grows from noticing weather, day and night, and familiar land and water features into explaining Earth systems, planetary patterns, and larger-scale relationships. It supports observation, modelling, and long-term pattern thinking.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on observation, pattern noticing, and inquiry. It connects to measurement, data, environmental understanding, and later systems thinking about Earth and space.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early learning begins with everyday noticing: sunshine, rain, wind, day and night, and familiar outdoor places.",
      steps: [
        {
          id: 1,
          title: "Notice weather and daily outdoor changes",
          meaning:
            "Describe simple weather events and changes in light, temperature, cloud cover, or ground conditions.",
          skillFocus: "everyday Earth observation",
          practiceActivity:
            "Look outside each day, talk about sky conditions, shadows, wind, puddles, or sunshine, and compare how the day feels.",
          evidenceExamples: [
            "a weather drawing or photo",
            "a short parent note about a daily weather observation",
            "a learner oral description of outdoor change",
          ],
          nextStep:
            "Build into lower-primary weather patterns, seasons, and Earth materials.",
          reportLanguage:
            "The learner is beginning to notice and describe simple weather and outdoor changes in the local environment.",
        },
        {
          id: 2,
          title: "Talk about day, night, Sun, and Moon patterns",
          meaning:
            "Notice that light and sky objects change across a day or night experience.",
          skillFocus: "early pattern noticing in the sky",
          practiceActivity:
            "Notice sunrise or sunset colours, daytime shadows, moon shape changes, or the difference between daytime and nighttime skies.",
          evidenceExamples: [
            "a drawing of day and night observations",
            "a learner comment about the Sun, Moon, or sky",
            "a parent note from a simple sky discussion",
          ],
          nextStep:
            "Carry this into more deliberate observation of seasons, weather, and repeating patterns.",
          reportLanguage:
            "The learner is developing early awareness of day-and-night and sky patterns through simple observation and discussion.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin tracking weather, seasons, rocks, soil, water, and other familiar Earth features more deliberately.",
      steps: [
        {
          id: 1,
          title: "Observe seasonal and weather patterns over time",
          meaning:
            "Notice that weather and seasonal changes can be tracked and compared across days or weeks.",
          skillFocus: "pattern tracking over time",
          practiceActivity:
            "Keep a simple weather chart, compare clothing or plant changes across seasons, or notice rain, temperature, and light shifts.",
          evidenceExamples: [
            "a weather or season chart",
            "a learner description of seasonal change",
            "a parent note about pattern noticing across time",
          ],
          nextStep:
            "Use this repeated observation to support stronger Earth-system and water-cycle thinking later.",
          reportLanguage:
            "The learner is building awareness of seasonal and weather patterns and can increasingly describe changes over time.",
        },
        {
          id: 2,
          title: "Explore rocks, soil, water, and land around us",
          meaning:
            "Describe familiar Earth materials and places and notice how they differ.",
          skillFocus: "Earth materials and local features",
          practiceActivity:
            "Compare soil samples, rocks, sand, puddles, creeks, or local landforms during walks or home investigations.",
          evidenceExamples: [
            "a simple rock or soil comparison",
            "a drawing or map of local land and water features",
            "a parent note from an outdoor science walk",
          ],
          nextStep:
            "Build into middle-primary modelling of water, weather, and Earth-pattern systems.",
          reportLanguage:
            "The learner is beginning to explore familiar Earth materials and local land and water features with growing curiosity and detail.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens modelling and explanation about water, weather, and repeating Earth and sky patterns.",
      steps: [
        {
          id: 1,
          title: "Explain simple water and weather changes",
          meaning:
            "Connect observations of rain, puddles, clouds, evaporation, or runoff to simple Earth-system ideas.",
          skillFocus: "water and weather explanation",
          practiceActivity:
            "Observe evaporation, collect rainfall, compare wet and dry conditions, or map how water moves in a local area.",
          evidenceExamples: [
            "a simple water-cycle or weather explanation",
            "a rainfall or evaporation record",
            "a learner explanation using local observations",
          ],
          nextStep:
            "Use these ideas to build stronger Earth-systems and data interpretation later.",
          reportLanguage:
            "The learner is increasingly able to explain simple water and weather changes using direct observation and growing science language.",
        },
        {
          id: 2,
          title: "Model repeating Earth and sky patterns",
          meaning:
            "Use diagrams, models, or repeated observations to explain changes such as Moon phases, shadows, or seasonal patterns.",
          skillFocus: "modelling and recurring patterns",
          practiceActivity:
            "Track shadows, moon phases, or seasonal light changes and represent the pattern through a simple model or sequence.",
          evidenceExamples: [
            "a moon or shadow sequence",
            "a learner explanation using a simple model",
            "a parent note from a repeated sky observation",
          ],
          nextStep:
            "Carry this into upper-primary solar-system and Earth-process thinking.",
          reportLanguage:
            "The learner is beginning to use simple models and repeated observations to explain familiar Earth and sky patterns.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin thinking more broadly about Earth systems, landform change, and the structure of the solar system.",
      steps: [
        {
          id: 1,
          title: "Connect Earth features to broader systems",
          meaning:
            "See weather, water, land, and environmental conditions as connected parts of wider Earth processes.",
          skillFocus: "Earth-systems thinking",
          practiceActivity:
            "Investigate erosion, river flow, cloud patterns, drought, or land use and discuss how one Earth process affects another.",
          evidenceExamples: [
            "a systems map or explanation",
            "a learner note connecting two Earth processes",
            "a parent summary of Earth-systems discussion",
          ],
          nextStep:
            "Use this systems thinking to support lower-secondary Earth-process and climate interpretation.",
          reportLanguage:
            "The learner is increasingly able to connect familiar Earth features and events to wider Earth-system processes.",
        },
        {
          id: 2,
          title: "Use models to explain the solar system and planetary patterns",
          meaning:
            "Use scale, sequence, and repeated patterns to make sense of the Sun, Moon, planets, and their relationships.",
          skillFocus: "solar-system modelling",
          practiceActivity:
            "Build a solar-system model, compare planet features, or discuss how patterns of movement or light help explain observations.",
          evidenceExamples: [
            "a solar-system model or labelled diagram",
            "a learner explanation of planetary relationships",
            "a parent note from a space discussion",
          ],
          nextStep:
            "Carry this into lower-secondary interpretation of space evidence, Earth processes, and large-scale patterns.",
          reportLanguage:
            "The learner is developing stronger understanding of solar-system patterns and can increasingly use models to explain Earth-and-space ideas.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens interpretation of Earth processes, planetary systems, and larger data patterns such as climate and environmental change.",
      steps: [
        {
          id: 1,
          title: "Interpret Earth-process evidence more critically",
          meaning:
            "Use observations, maps, data, and examples to explain change in land, water, atmosphere, or environmental systems.",
          skillFocus: "Earth evidence interpretation",
          practiceActivity:
            "Review weather data, landform change examples, climate graphs, or environmental maps and discuss what patterns the evidence suggests.",
          evidenceExamples: [
            "a graph or map interpretation",
            "a learner explanation using Earth data",
            "a parent note from evidence-based discussion",
          ],
          nextStep:
            "Use this evidence work to support later evaluation of Earth-related claims and decisions.",
          reportLanguage:
            "The learner is increasingly able to interpret Earth-process evidence and explain patterns using data and observed examples.",
        },
        {
          id: 2,
          title: "Explain larger patterns in Earth and space systems",
          meaning:
            "Think across scale, time, and system interaction when discussing Earth or space phenomena.",
          skillFocus: "large-scale systems reasoning",
          practiceActivity:
            "Discuss climate patterns, geological change, planetary differences, or space observation data and explain how the parts connect.",
          evidenceExamples: [
            "a systems explanation",
            "a learner comparison of Earth or space patterns",
            "a science summary linking more than one Earth-and-space idea",
          ],
          nextStep:
            "Build toward later consolidation where evidence, models, and public claims are weighed more critically.",
          reportLanguage:
            "The learner is developing more mature understanding of Earth and space systems and can increasingly explain larger patterns across scale and time.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together system models, evidence, and evaluation of more complex Earth-and-space claims and questions.",
      steps: [
        {
          id: 1,
          title: "Evaluate Earth-and-space explanations using evidence",
          meaning:
            "Compare explanations, models, or claims and weigh which interpretation fits the evidence best.",
          skillFocus: "evaluation of scientific explanations",
          practiceActivity:
            "Compare climate claims, geological explanations, or space interpretations and discuss which evidence is strongest or most limited.",
          evidenceExamples: [
            "an evaluative Earth-science response",
            "a learner comparison of evidence quality",
            "a parent summary of critical discussion",
          ],
          nextStep:
            "Use this evaluative habit across science-in-society, geography, and integrated project work.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate Earth-and-space explanations and compare how well different claims are supported by evidence.",
        },
        {
          id: 2,
          title: "Communicate Earth-and-space understanding clearly",
          meaning:
            "Present a coherent explanation of an Earth or space phenomenon using evidence, models, and clear science language.",
          skillFocus: "clear scientific communication",
          practiceActivity:
            "Create a report, model explanation, presentation, or visual summary about a climate pattern, Earth system, or space topic.",
          evidenceExamples: [
            "a report or presentation with supporting evidence",
            "a labelled model or diagram sequence",
            "a learner explanation connecting pattern and cause",
          ],
          nextStep:
            "These habits continue to support stronger science reporting, interdisciplinary connections, and mature evidence use.",
          reportLanguage:
            "The learner is strengthening the ability to communicate Earth-and-space understanding clearly, using evidence and models with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early weather or sky observation, one Earth-materials example, and one later systems explanation so long-term pattern thinking is visible.",
    "Photos, weather charts, field sketches, moon records, and simple models often make strong portfolio evidence in this strand.",
    "A portfolio is stronger when it shows how the learner moved from daily noticing into modelling, data interpretation, and broader systems thinking.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, pattern recognition, modelling, and Earth-systems explanation rather than only naming facts about weather or space.",
    "Examples are strongest when the learner explains a weather, water, Earth, or space pattern using observed or recorded evidence.",
    "Collected evidence can show a clear shift from simple local observation to more mature thinking about large-scale systems and change.",
  ],
};

const PHYSICAL_SCIENCES: ScienceStrandConfig = {
  key: "physical-sciences",
  title: "Physical sciences",
  subtitle:
    "Physical sciences helps learners explain light, sound, heat, electricity, magnetism, and everyday physical phenomena. It grows from noticing simple effects into using models and evidence to explain less visible processes.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on inquiry, observation, and measurement. It connects to materials, forces, engineering ideas, and practical explanation of everyday phenomena.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early physical science begins with noticing things that shine, make sound, feel warm, stick, glow, or change what we can see and hear.",
      steps: [
        {
          id: 1,
          title: "Notice light, sound, and warmth in everyday life",
          meaning:
            "Recognise simple physical effects in the home and outdoors and talk about what is happening.",
          skillFocus: "everyday physical noticing",
          practiceActivity:
            "Explore shadows, noisy and quiet objects, warm and cool surfaces, or bright and dim spaces and describe the differences.",
          evidenceExamples: [
            "a parent note from a simple light or sound exploration",
            "a drawing of a shadow, sound source, or warm object",
            "a learner oral description of what was noticed",
          ],
          nextStep:
            "Build toward lower-primary comparison of how light, sound, and warmth behave.",
          reportLanguage:
            "The learner is beginning to notice and describe simple physical effects such as light, sound, and warmth in everyday situations.",
        },
        {
          id: 2,
          title: "Explore simple cause and effect with physical objects",
          meaning:
            "See that moving, covering, switching, or placing objects differently can change what happens.",
          skillFocus: "simple cause and effect",
          practiceActivity:
            "Use torches, musical objects, magnets, or warm/cool materials and talk about what changed when one condition changed.",
          evidenceExamples: [
            "a simple cause-and-effect note",
            "a photo sequence of a physical science activity",
            "a learner explanation of what changed and why",
          ],
          nextStep:
            "Carry this into more structured comparisons and tests of physical effects.",
          reportLanguage:
            "The learner is showing early understanding that changes to objects or conditions can affect what happens in a physical science activity.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin comparing how light, sound, heat, magnets, or simple electrical ideas behave in familiar situations.",
      steps: [
        {
          id: 1,
          title: "Compare physical effects in simple tests",
          meaning:
            "Notice how brightness, volume, warmth, or magnetic pull changes under different conditions.",
          skillFocus: "comparison of physical effects",
          practiceActivity:
            "Test shadow size, sound loudness, magnetic attraction, or heat transfer in a familiar home science activity.",
          evidenceExamples: [
            "a comparison table or drawing",
            "a parent note about results from a simple physical test",
            "a learner statement about what changed most",
          ],
          nextStep:
            "Build into middle-primary work on circuits, repeated results, and clearer explanation.",
          reportLanguage:
            "The learner is building confidence in comparing simple physical effects and describing how conditions can change an outcome.",
        },
        {
          id: 2,
          title: "Use everyday experiences to explain what happened",
          meaning:
            "Begin linking observations to simple explanations about how light, sound, or heat travels or changes.",
          skillFocus: "early physical explanation",
          practiceActivity:
            "Discuss why a shadow changed, why a sound seemed quieter, or why one material felt warmer or cooler.",
          evidenceExamples: [
            "a short learner explanation of a physical result",
            "a parent summary of discussion after a test",
            "a labelled diagram of a simple physical setup",
          ],
          nextStep:
            "Carry this into middle-primary circuit work, magnetism, and more deliberate modelling.",
          reportLanguage:
            "The learner is beginning to explain simple physical science experiences using growing observation and reasoning skills.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning becomes more structured, often including simple circuits, magnetism, light behaviour, sound change, and thermal effects.",
      steps: [
        {
          id: 1,
          title: "Investigate simple systems such as circuits or magnet setups",
          meaning:
            "Build or test a simple system and observe how changing one part affects the result.",
          skillFocus: "physical systems and setup testing",
          practiceActivity:
            "Build a simple circuit, compare conductors, test magnets, or explore how light or sound changes with barriers or distance.",
          evidenceExamples: [
            "a circuit or magnet investigation page",
            "a parent note about how the system was changed and observed",
            "a learner explanation of what made the setup work",
          ],
          nextStep:
            "Use this systems view to support upper-primary transfer, interaction, and clearer models.",
          reportLanguage:
            "The learner is increasingly able to investigate simple physical systems and explain how changing one part affects the result.",
        },
        {
          id: 2,
          title: "Record patterns and explain them more clearly",
          meaning:
            "Use repeated observations or simple measurements to support an explanation of what happened.",
          skillFocus: "pattern recording and explanation",
          practiceActivity:
            "Measure, repeat, or compare physical effects and ask what pattern the results show.",
          evidenceExamples: [
            "a results table or labelled notes",
            "a learner explanation using a recorded pattern",
            "a parent summary of a repeated physical science test",
          ],
          nextStep:
            "Build toward upper-primary use of models for transfer and interaction.",
          reportLanguage:
            "The learner is becoming more confident in using recorded observations to explain patterns in physical science investigations.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners begin connecting physical observations to broader ideas of transfer, interaction, and system behaviour.",
      steps: [
        {
          id: 1,
          title: "Explain transfer and interaction in simple physical systems",
          meaning:
            "Describe how light, heat, sound, electricity, or magnetism can move, spread, or affect other parts of a system.",
          skillFocus: "transfer and system interaction",
          practiceActivity:
            "Investigate insulation, reflection, sound dampening, electrical flow, or magnetic effects and explain what is happening in the system.",
          evidenceExamples: [
            "a system explanation with arrows or labels",
            "a learner comparison of two physical setups",
            "a parent note from a discussion about transfer or interaction",
          ],
          nextStep:
            "Carry this into lower-secondary models and more abstract explanation.",
          reportLanguage:
            "The learner is increasingly able to explain how physical effects are transferred or interact within a simple system.",
        },
        {
          id: 2,
          title: "Use evidence to choose between possible explanations",
          meaning:
            "Compare more than one idea about what caused a result and use evidence to decide which makes better sense.",
          skillFocus: "evidence-based explanation choice",
          practiceActivity:
            "Compare two possible explanations for an electrical, light, sound, or heat result and ask which evidence supports each one.",
          evidenceExamples: [
            "a comparison of two explanations",
            "a learner explanation choosing the better-supported idea",
            "a parent summary of a physical science reasoning discussion",
          ],
          nextStep:
            "Build toward lower-secondary models, data interpretation, and more critical evaluation.",
          reportLanguage:
            "The learner is beginning to use evidence more deliberately when choosing between possible explanations in physical science.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens model use, data interpretation, and more independent reasoning about physical processes and systems.",
      steps: [
        {
          id: 1,
          title: "Use models to explain less visible physical processes",
          meaning:
            "Use a diagram, system model, or simplified explanation to make sense of what cannot be seen directly.",
          skillFocus: "model-based explanation",
          practiceActivity:
            "Create and discuss models for electricity flow, heat transfer, wave behaviour, or magnetic interaction after a practical activity.",
          evidenceExamples: [
            "a labelled science model",
            "a learner explanation using the model",
            "a parent note on how the model supported understanding",
          ],
          nextStep:
            "Use these models to evaluate stronger data and compare claims more critically.",
          reportLanguage:
            "The learner is developing stronger ability to use models to explain less visible physical science processes and interactions.",
        },
        {
          id: 2,
          title: "Interpret physical science evidence more critically",
          meaning:
            "Look for patterns, anomalies, and limitations in results and comment on how much confidence to place in the explanation.",
          skillFocus: "critical interpretation of physical evidence",
          practiceActivity:
            "Review a set of physical science results from repeated trials and discuss what pattern is strongest or what result needs caution.",
          evidenceExamples: [
            "annotated results with a reliability comment",
            "a learner conclusion discussing evidence strength",
            "a parent summary of interpretation discussion",
          ],
          nextStep:
            "Build into later consolidation where physical explanations and claims are weighed more carefully.",
          reportLanguage:
            "The learner is increasingly able to interpret physical science evidence critically and comment on the strength of conclusions drawn from it.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together system thinking, models, and evidence to explain and evaluate more complex physical science ideas.",
      steps: [
        {
          id: 1,
          title: "Evaluate physical science claims and explanations",
          meaning:
            "Compare how well different explanations fit available evidence and consider whether a model or claim is well supported.",
          skillFocus: "evaluation of physical explanations",
          practiceActivity:
            "Compare explanations of an electrical, thermal, or wave-based phenomenon and discuss which evidence is strongest.",
          evidenceExamples: [
            "an evaluative physical science response",
            "a learner explanation weighing competing claims",
            "a comparison of evidence quality across sources or results",
          ],
          nextStep:
            "Use this evaluation habit across science-in-society, engineering ideas, and interdisciplinary problem solving.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate physical science claims and compare the strength of different explanations using evidence.",
        },
        {
          id: 2,
          title: "Communicate physical science understanding coherently",
          meaning:
            "Present a clear explanation of a physical system or process using appropriate evidence, diagrams, and reasoning.",
          skillFocus: "coherent physical science communication",
          practiceActivity:
            "Create a practical report, demonstration, poster, or slide summary explaining a physical science investigation or phenomenon.",
          evidenceExamples: [
            "a report or presentation about a physical science topic",
            "a labelled diagram sequence supporting explanation",
            "a recorded verbal explanation using evidence and model language",
          ],
          nextStep:
            "These habits continue to support stronger science reporting, portfolio evidence, and technical reasoning.",
          reportLanguage:
            "The learner is strengthening the ability to communicate physical science understanding coherently, using evidence and models with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early light, sound, or heat observation, one simple system investigation, and one later evidence-based explanation so physical reasoning growth is visible.",
    "Photos of setups, labelled diagrams, results tables, and short learner explanations often make strong physical science portfolio evidence.",
    "A portfolio is stronger when it shows how the learner moved from noticing physical effects to explaining systems and evaluating evidence.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, comparison, modelling, and explanation of physical effects rather than only listing topics like electricity or sound.",
    "Examples are strongest when the learner explains what happened in a system and how the evidence supports that explanation.",
    "Collected evidence can show a clear shift from simple cause-and-effect noticing to more deliberate model-based reasoning.",
  ],
};

const MATERIALS_MATTER_AND_CHANGE: ScienceStrandConfig = {
  key: "materials-matter-and-change",
  title: "Materials, matter and change",
  subtitle:
    "Materials, matter and change helps learners compare properties, choose useful materials, observe states and mixtures, and explain how matter changes. It grows from sorting familiar objects into later reasoning about particles, reversibility, and chemical change.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on observation, comparison, and inquiry. It connects to physical science, measurement, practical design choices, and later explanation of material behaviour and change.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early learning focuses on touching, sorting, and describing familiar materials and noticing simple changes such as melting, mixing, or drying.",
      steps: [
        {
          id: 1,
          title: "Describe familiar materials and their uses",
          meaning:
            "Notice what materials feel or look like and connect those properties to everyday uses.",
          skillFocus: "material noticing and comparison",
          practiceActivity:
            "Compare wood, plastic, metal, fabric, sand, or water and talk about what each is like and where it is useful.",
          evidenceExamples: [
            "a sorting page by material type or property",
            "a parent note about a material comparison discussion",
            "a learner explanation of why one material suits a purpose",
          ],
          nextStep:
            "Build into lower-primary sorting by property and observing simple changes.",
          reportLanguage:
            "The learner is beginning to describe familiar materials and connect simple properties to practical uses.",
        },
        {
          id: 2,
          title: "Notice simple changes in materials",
          meaning:
            "Observe that some materials melt, dry, mix, freeze, or change in visible ways.",
          skillFocus: "early change observation",
          practiceActivity:
            "Freeze water, melt ice, mix ingredients, or compare dry and wet materials and talk about what changed.",
          evidenceExamples: [
            "a photo sequence of a material change",
            "a parent note about a mixing or melting observation",
            "a learner drawing of before-and-after material states",
          ],
          nextStep:
            "Carry this into more deliberate comparison of states, mixtures, and change.",
          reportLanguage:
            "The learner is beginning to notice visible changes in materials and talk about what seems different before and after an activity.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin sorting materials by clearer properties and exploring how heating, cooling, mixing, or drying can change what they observe.",
      steps: [
        {
          id: 1,
          title: "Sort and compare materials by property",
          meaning:
            "Use features such as hardness, flexibility, absorbency, transparency, or texture to compare materials more deliberately.",
          skillFocus: "property-based comparison",
          practiceActivity:
            "Test and compare household materials for bendability, absorbency, strength, or surface texture.",
          evidenceExamples: [
            "a comparison chart of material properties",
            "a learner explanation of why materials were grouped together",
            "a parent note from a property-testing task",
          ],
          nextStep:
            "Use clearer comparison to support explanation of state change and mixtures.",
          reportLanguage:
            "The learner is increasingly able to compare materials by simple properties and describe how those properties affect use.",
        },
        {
          id: 2,
          title: "Observe how materials change during heating, cooling, or mixing",
          meaning:
            "Notice that some changes are temporary while others seem harder to reverse.",
          skillFocus: "change observation and comparison",
          practiceActivity:
            "Mix solids and liquids, compare dissolving, or observe heating and cooling changes during cooking or home science tasks.",
          evidenceExamples: [
            "a before-and-after material record",
            "a learner comment about which change could be reversed",
            "a parent note about a simple mixing or cooling task",
          ],
          nextStep:
            "Build into middle-primary thinking about states, mixtures, and reversible change.",
          reportLanguage:
            "The learner is building understanding that heating, cooling, and mixing can change materials in different ways.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens thinking about solids, liquids, gases, mixtures, dissolving, and reversible or irreversible change.",
      steps: [
        {
          id: 1,
          title: "Describe states of matter and familiar mixtures",
          meaning:
            "Use simple science language to compare solids, liquids, gases, and common mixtures.",
          skillFocus: "states and mixtures",
          practiceActivity:
            "Compare ice, water, steam, dry ingredients, or dissolved materials and discuss what makes each different.",
          evidenceExamples: [
            "a states-of-matter comparison page",
            "a learner explanation of a mixture or solution",
            "a parent note from a home science discussion",
          ],
          nextStep:
            "Use these state ideas to support clearer explanations of change and separation.",
          reportLanguage:
            "The learner is increasingly able to describe familiar states of matter and mixtures using clearer science language.",
        },
        {
          id: 2,
          title: "Explain whether a change is reversible",
          meaning:
            "Use observation and evidence to decide whether a material can return to its earlier form or not.",
          skillFocus: "reversible and irreversible change",
          practiceActivity:
            "Compare melting, dissolving, baking, burning, or setting and discuss which changes can be reversed and why.",
          evidenceExamples: [
            "a reversible-change comparison",
            "a learner explanation of why a change could or could not be undone",
            "a parent note from a cooking or materials task",
          ],
          nextStep:
            "Build toward upper-primary understanding of useful material choice and deeper change explanations.",
          reportLanguage:
            "The learner is becoming more confident in identifying reversible and irreversible material changes and using evidence to explain the difference.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now connect material properties and changes to practical decisions, explanations, and more deliberate comparison of how matter behaves.",
      steps: [
        {
          id: 1,
          title: "Choose materials for a purpose using evidence",
          meaning:
            "Compare properties and justify why one material may suit a design, storage, or practical need better than another.",
          skillFocus: "material choice and justification",
          practiceActivity:
            "Test materials for waterproofing, insulation, strength, or packaging and justify which would work best for a task.",
          evidenceExamples: [
            "a material choice justification",
            "a comparison of two design materials",
            "a parent note from a materials testing activity",
          ],
          nextStep:
            "Carry this into lower-secondary ideas about particles, reactions, and more abstract explanation.",
          reportLanguage:
            "The learner is increasingly able to compare materials and justify choices using practical evidence about their properties.",
        },
        {
          id: 2,
          title: "Use evidence to explain change more clearly",
          meaning:
            "Look beyond the visible result and explain what observations suggest about how a material behaved.",
          skillFocus: "evidence-based explanation of material change",
          practiceActivity:
            "Review observations from heating, dissolving, drying, or reacting materials and explain what the evidence suggests.",
          evidenceExamples: [
            "a short explanation of a material-change investigation",
            "annotated observation notes",
            "a learner conclusion linking evidence to change",
          ],
          nextStep:
            "Build toward lower-secondary particle thinking and clearer distinction between physical and chemical change.",
          reportLanguage:
            "The learner is beginning to explain material changes with more clarity and can increasingly connect conclusions to observed evidence.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens explanation of matter using models, clearer distinctions between physical and chemical change, and better interpretation of evidence.",
      steps: [
        {
          id: 1,
          title: "Use simple models to explain matter and change",
          meaning:
            "Use a particle or system-style model to describe why materials behave differently during some changes.",
          skillFocus: "model-based explanation of matter",
          practiceActivity:
            "Use diagrams or model language to explain melting, dissolving, compressibility, evaporation, or simple reaction evidence.",
          evidenceExamples: [
            "a matter model or diagram",
            "a learner explanation using model language",
            "a parent note about how the model supported understanding",
          ],
          nextStep:
            "Use these models to evaluate stronger material-change evidence and compare explanations.",
          reportLanguage:
            "The learner is developing stronger understanding of matter and can increasingly use simple models to explain material behaviour and change.",
        },
        {
          id: 2,
          title: "Distinguish between physical and chemical change",
          meaning:
            "Use evidence to decide whether a change mainly altered form or involved a deeper material transformation.",
          skillFocus: "physical and chemical change reasoning",
          practiceActivity:
            "Compare dissolving, melting, rusting, burning, or reaction tasks and discuss what evidence points to different kinds of change.",
          evidenceExamples: [
            "a comparison of physical and chemical change examples",
            "a learner explanation using evidence from a reaction",
            "a parent summary of a materials reasoning discussion",
          ],
          nextStep:
            "Build into later consolidation where material claims and reaction evidence are weighed more carefully.",
          reportLanguage:
            "The learner is increasingly able to distinguish between physical and chemical change and explain the difference using observable evidence.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together material models, reaction evidence, and more critical thinking about how matter behaves and changes in real contexts.",
      steps: [
        {
          id: 1,
          title: "Evaluate evidence about material change",
          meaning:
            "Weigh observations, models, and results to decide which explanation best fits a material or matter-change situation.",
          skillFocus: "evaluation of material-change evidence",
          practiceActivity:
            "Compare explanations for a reaction, phase change, or material behaviour and discuss which evidence is strongest.",
          evidenceExamples: [
            "an evaluative response about matter or change",
            "a learner comparison of two explanations",
            "a parent note from a critical discussion about evidence",
          ],
          nextStep:
            "Use this evaluative habit across design, environmental questions, and broader science reporting.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate evidence about materials and change and compare how well different explanations are supported.",
        },
        {
          id: 2,
          title: "Communicate matter understanding clearly",
          meaning:
            "Present material investigations or explanations coherently using evidence, model language, and practical examples.",
          skillFocus: "clear communication about matter",
          practiceActivity:
            "Create a short report, poster, or demonstration about a materials test, state change, or reaction investigation.",
          evidenceExamples: [
            "a materials investigation report",
            "a labelled explanation or model sequence",
            "a learner presentation about a material or change process",
          ],
          nextStep:
            "These habits continue to support stronger scientific communication, design choices, and interdisciplinary problem solving.",
          reportLanguage:
            "The learner is strengthening the ability to communicate understanding of materials and matter change clearly, using evidence and explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early material-sorting example, one reversible-change investigation, and one later evidence-based matter explanation so progression is visible.",
    "Photos of material tests, comparison charts, mixture investigations, and short learner explanations often make strong evidence for this strand.",
    "A portfolio is stronger when it shows how the learner moved from noticing properties into using evidence to explain change and material choice.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in comparison, classification, explanation of change, and practical material reasoning rather than only listing content such as solids or mixtures.",
    "Examples are strongest when the learner explains what changed, what evidence supports the explanation, and why a material was useful for a purpose.",
    "Collected evidence can show a clear shift from tactile observation into more deliberate model-based reasoning about matter and change.",
  ],
};

const FORCES_ENERGY_AND_MOTION: ScienceStrandConfig = {
  key: "forces-energy-and-motion",
  title: "Forces, energy and motion",
  subtitle:
    "Forces, energy and motion helps learners explain why things move, slow, stop, or transfer energy. It grows from push-and-pull experiences into more deliberate thinking about systems, interaction, and practical design.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on observation, measurement, and physical science. It connects to design, engineering, practical problem solving, and later modelling of systems and interactions.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early experiences focus on moving objects, noticing push and pull, and describing simple changes in speed or direction.",
      steps: [
        {
          id: 1,
          title: "Notice push, pull, and movement",
          meaning:
            "See that objects move when they are pushed, pulled, rolled, dropped, or carried.",
          skillFocus: "early force-and-motion awareness",
          practiceActivity:
            "Use toy cars, balls, swings, doors, ramps, or boxes and talk about what made the object move or stop.",
          evidenceExamples: [
            "a photo sequence of a push or pull activity",
            "a learner explanation of what made something move",
            "a parent note about movement observations",
          ],
          nextStep:
            "Build into lower-primary comparison of how stronger or weaker actions change movement.",
          reportLanguage:
            "The learner is beginning to notice that pushes and pulls affect movement and can describe simple changes in how objects move.",
        },
        {
          id: 2,
          title: "Describe fast, slow, near, far, stop, and go",
          meaning:
            "Use everyday motion language to compare what happened during play or simple investigation.",
          skillFocus: "describing motion",
          practiceActivity:
            "Roll objects on surfaces, compare how far they travel, or explore what happens when a slope changes.",
          evidenceExamples: [
            "a simple motion comparison drawing",
            "a parent note about fast/slow or stop/go language",
            "a learner oral comparison of two movement experiences",
          ],
          nextStep:
            "Carry this into lower-primary work on comparing motion more deliberately.",
          reportLanguage:
            "The learner is growing in confidence when describing simple movement using everyday force-and-motion language.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin comparing movement, noticing surface effects, and seeing how pushes, pulls, and gravity affect everyday motion.",
      steps: [
        {
          id: 1,
          title: "Compare how different pushes or pulls change movement",
          meaning:
            "Notice that bigger, smaller, faster, or gentler actions can affect how an object moves.",
          skillFocus: "comparison of force and motion",
          practiceActivity:
            "Test toy cars, balls, paper spinners, or ramps and compare distance, speed, or stopping behaviour.",
          evidenceExamples: [
            "a simple motion comparison table",
            "a learner explanation of which action changed movement more",
            "a parent note from a ramp or rolling test",
          ],
          nextStep:
            "Use this comparison to support middle-primary thinking about friction, gravity, and mechanical advantage.",
          reportLanguage:
            "The learner is increasingly able to compare how different pushes or pulls affect movement in simple investigations.",
        },
        {
          id: 2,
          title: "Notice how surfaces and slope affect motion",
          meaning:
            "See that roughness, smoothness, or incline can change how objects move.",
          skillFocus: "surface and slope effects",
          practiceActivity:
            "Compare objects rolling on carpet, tile, cardboard, or different ramp heights and discuss what changed.",
          evidenceExamples: [
            "a motion record across different surfaces",
            "a learner statement about slope or friction effects",
            "a parent note from a motion comparison",
          ],
          nextStep:
            "Build toward middle-primary explanations using force, friction, and simple machine ideas.",
          reportLanguage:
            "The learner is beginning to understand that surfaces and slope can change how objects move.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens explanation of force, friction, gravity, and simple machines through repeated testing and comparison.",
      steps: [
        {
          id: 1,
          title: "Explain how friction and gravity affect movement",
          meaning:
            "Use evidence from tests to describe how motion changes because of surface contact or downward pull.",
          skillFocus: "friction and gravity explanation",
          practiceActivity:
            "Test sliders, rolling objects, parachutes, or dropped items and compare how friction or gravity seems to affect them.",
          evidenceExamples: [
            "a friction or gravity comparison page",
            "a learner explanation using evidence from a test",
            "a parent summary of a force-and-motion discussion",
          ],
          nextStep:
            "Use this reasoning to support simple machine and energy-transfer thinking.",
          reportLanguage:
            "The learner is increasingly able to explain how friction and gravity affect motion in familiar science tasks.",
        },
        {
          id: 2,
          title: "Use simple machines and motion systems purposefully",
          meaning:
            "Notice how ramps, levers, wheels, and pulleys change the effort or movement in a task.",
          skillFocus: "simple machines and system design",
          practiceActivity:
            "Build a simple lever, pulley, or ramp challenge and discuss how the design changed the movement or required effort.",
          evidenceExamples: [
            "a simple-machine design sketch",
            "a learner explanation of how a tool changed the task",
            "a parent note from a home engineering challenge",
          ],
          nextStep:
            "Carry this into upper-primary energy transfer and system interaction.",
          reportLanguage:
            "The learner is building confidence in using simple machines and explaining how they change movement or effort.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin connecting force and motion to energy transfer, system design, and more deliberate explanation of interaction.",
      steps: [
        {
          id: 1,
          title: "Explain energy transfer in familiar systems",
          meaning:
            "Describe how energy seems to move or change form in simple devices, motion tasks, or physical setups.",
          skillFocus: "energy transfer and system explanation",
          practiceActivity:
            "Explore bouncing, rolling, elastic launchers, hand-powered devices, or basic energy chains and explain what happened.",
          evidenceExamples: [
            "a system diagram showing energy movement",
            "a learner explanation of where energy came from and went",
            "a parent summary of an energy discussion",
          ],
          nextStep:
            "Build toward lower-secondary models of interaction, efficiency, and system analysis.",
          reportLanguage:
            "The learner is increasingly able to describe energy transfer in familiar systems and connect this to force and motion ideas.",
        },
        {
          id: 2,
          title: "Use evidence to improve a motion or force design",
          meaning:
            "Test and adjust a design or setup based on how well it performs.",
          skillFocus: "evidence-based improvement",
          practiceActivity:
            "Refine a ramp, bridge, launcher, rolling device, or parachute setup after testing which design choices worked better.",
          evidenceExamples: [
            "a before-and-after design note",
            "a learner explanation of why one design was improved",
            "a parent note about evidence-based changes",
          ],
          nextStep:
            "Carry this into lower-secondary analysis of interaction, efficiency, and controlled system change.",
          reportLanguage:
            "The learner is beginning to use evidence from testing to improve simple force-and-motion designs or systems.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens system analysis, interaction reasoning, and evidence-based interpretation of motion and energy patterns.",
      steps: [
        {
          id: 1,
          title: "Analyse interactions in a force or motion system",
          meaning:
            "Look more carefully at how forces act together and how changes in one part of a system affect the whole outcome.",
          skillFocus: "system interaction analysis",
          practiceActivity:
            "Investigate braking, collision, pendulum motion, gear changes, or moving loads and discuss how interacting forces shape the result.",
          evidenceExamples: [
            "a system analysis diagram",
            "a learner explanation of interacting forces",
            "a parent summary of a design or motion discussion",
          ],
          nextStep:
            "Use this systems thinking to support later evaluation of efficiency, claims, and more complex motion evidence.",
          reportLanguage:
            "The learner is increasingly able to analyse interacting forces within a system and explain how those interactions affect motion.",
        },
        {
          id: 2,
          title: "Interpret evidence about energy and motion more critically",
          meaning:
            "Use results, comparisons, or data to comment on efficiency, reliability, or the strength of a motion explanation.",
          skillFocus: "critical interpretation of force-and-motion evidence",
          practiceActivity:
            "Review trial results from a moving system or energy task and discuss what pattern is trustworthy, weak, or surprising.",
          evidenceExamples: [
            "annotated trial results",
            "a learner conclusion about efficiency or motion patterns",
            "a parent note from an evidence-based discussion",
          ],
          nextStep:
            "Build into later consolidation where system claims and designs are evaluated more rigorously.",
          reportLanguage:
            "The learner is developing stronger skill in interpreting force-and-motion evidence and commenting on the quality of conclusions drawn from it.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together forces, motion, energy, system design, and evidence evaluation in more complex and practical contexts.",
      steps: [
        {
          id: 1,
          title: "Evaluate force-and-motion explanations or designs",
          meaning:
            "Compare designs, models, or claims and weigh which explanation best fits the evidence and practical outcome.",
          skillFocus: "evaluation of system explanations",
          practiceActivity:
            "Compare motion-system designs, transport examples, or energy-transfer explanations and discuss which is most effective or best supported.",
          evidenceExamples: [
            "an evaluative response about a design or explanation",
            "a learner comparison of competing system ideas",
            "a parent note from a critical design discussion",
          ],
          nextStep:
            "Use this evaluation habit across technologies, engineering, and wider science-in-society decisions.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate force-and-motion explanations or designs using evidence and practical reasoning.",
        },
        {
          id: 2,
          title: "Communicate motion and energy understanding clearly",
          meaning:
            "Present a coherent explanation of a moving or energy-using system using evidence, diagrams, and clear reasoning.",
          skillFocus: "clear communication about systems",
          practiceActivity:
            "Create a poster, report, or demonstration explaining a force-and-motion investigation, machine, or energy-transfer system.",
          evidenceExamples: [
            "a report or presentation about a motion system",
            "a labelled diagram sequence",
            "a learner explanation connecting evidence and design reasoning",
          ],
          nextStep:
            "These habits continue to support stronger science communication, design work, and interdisciplinary project thinking.",
          reportLanguage:
            "The learner is strengthening the ability to communicate force, motion, and energy understanding clearly, using evidence and diagrams with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early push-and-pull example, one simple-machine or friction investigation, and one later system explanation so growth in motion reasoning is visible.",
    "Photos of ramps, moving devices, design sketches, results tables, and learner explanations often make strong portfolio evidence in this strand.",
    "A portfolio becomes stronger when it shows how the learner moved from play-based movement noticing into evidence-based explanation of systems and interactions.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, testing, design adjustment, and explanation of motion and energy rather than only listing force topics studied.",
    "Examples are strongest when the learner explains how a system worked, what changed, and what evidence supported the explanation.",
    "Collected evidence can show a clear shift from everyday movement language to more deliberate reasoning about interaction and energy transfer.",
  ],
};

const HUMAN_BODY_AND_HEALTH: ScienceStrandConfig = {
  key: "human-body-and-health",
  title: "Human body and health",
  subtitle:
    "Human body and health helps learners understand body parts, senses, growth, systems, movement, nutrition, and wellbeing connections. It grows from early body awareness into more thoughtful evidence-based understanding of health and function.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on close observation and living-systems thinking. It connects to movement, nutrition, environments, inquiry, and practical health choices in everyday life.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early learning focuses on body parts, senses, simple needs, and routines that help people grow and stay well.",
      steps: [
        {
          id: 1,
          title: "Notice body parts and what they help us do",
          meaning:
            "Recognise familiar body parts and connect them to movement, sensing, or everyday actions.",
          skillFocus: "body awareness and function",
          practiceActivity:
            "Use songs, drawing, mirror work, or movement games to identify body parts and discuss what each helps us do.",
          evidenceExamples: [
            "a labelled body drawing",
            "a parent note about a body-part discussion",
            "a learner oral explanation of simple body functions",
          ],
          nextStep:
            "Build into lower-primary thinking about senses, growth, and healthy routines.",
          reportLanguage:
            "The learner is beginning to recognise body parts and describe simple ways the body helps us move, sense, and live each day.",
        },
        {
          id: 2,
          title: "Recognise simple health and care routines",
          meaning:
            "Understand that food, rest, movement, hygiene, and care support wellbeing.",
          skillFocus: "early health awareness",
          practiceActivity:
            "Talk about rest, washing, brushing teeth, healthy snacks, movement, and how the body feels after daily routines.",
          evidenceExamples: [
            "a simple healthy-routines chart",
            "a learner explanation of one care routine",
            "a parent note from a wellbeing discussion",
          ],
          nextStep:
            "Carry this into lower-primary work on senses, growth, and everyday health choices.",
          reportLanguage:
            "The learner is developing early understanding that simple daily routines help the body stay healthy and cared for.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin connecting growth, senses, movement, and healthy routines to the way bodies work in everyday life.",
      steps: [
        {
          id: 1,
          title: "Explore senses, movement, and growth",
          meaning:
            "Notice how the body changes, moves, and gathers information about the world.",
          skillFocus: "senses, growth, and movement",
          practiceActivity:
            "Compare sensory experiences, movement tasks, or growth changes over time and discuss what the body is doing.",
          evidenceExamples: [
            "a senses observation page",
            "a parent note about movement or growth discussion",
            "a learner explanation of how the senses help",
          ],
          nextStep:
            "Build toward middle-primary understanding of body systems and what supports them.",
          reportLanguage:
            "The learner is increasingly able to describe how senses, movement, and growth are part of everyday body function.",
        },
        {
          id: 2,
          title: "Connect simple choices to health and wellbeing",
          meaning:
            "Understand that eating, sleeping, moving, and caring for the body can affect how we feel and function.",
          skillFocus: "health choices and body care",
          practiceActivity:
            "Keep a simple routine reflection, compare food or activity choices, or discuss what helps energy, rest, or concentration.",
          evidenceExamples: [
            "a healthy-choice reflection",
            "a learner explanation of what helps the body feel well",
            "a parent note from a discussion on daily health choices",
          ],
          nextStep:
            "Carry this into middle-primary system thinking and clearer health explanation.",
          reportLanguage:
            "The learner is building awareness that everyday choices can affect health, comfort, and wellbeing.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens body-systems understanding and the relationship between nutrition, movement, habits, and overall function.",
      steps: [
        {
          id: 1,
          title: "Describe simple body systems and what they do",
          meaning:
            "Recognise that the body uses connected systems such as digestion, breathing, circulation, or movement to function.",
          skillFocus: "body systems understanding",
          practiceActivity:
            "Use diagrams, models, or observation after activity to discuss how lungs, heart, muscles, bones, or digestion support everyday life.",
          evidenceExamples: [
            "a labelled system diagram",
            "a learner explanation of how one body system helps",
            "a parent note from a health science discussion",
          ],
          nextStep:
            "Build toward upper-primary interaction between systems and more evidence-based health reasoning.",
          reportLanguage:
            "The learner is increasingly able to describe simple body systems and explain how they support daily function.",
        },
        {
          id: 2,
          title: "Link habits to body function and wellbeing",
          meaning:
            "Understand more clearly how sleep, food, exercise, hydration, and routine affect the way the body works.",
          skillFocus: "body function and wellbeing connections",
          practiceActivity:
            "Compare how different daily patterns affect energy, focus, movement, or recovery and discuss the evidence noticed.",
          evidenceExamples: [
            "a simple wellbeing observation record",
            "a learner explanation of how a habit affected the body",
            "a parent note about observed patterns in daily routines",
          ],
          nextStep:
            "Carry this into upper-primary systems interaction and stronger reasoning about health choices.",
          reportLanguage:
            "The learner is becoming more aware of how everyday habits can affect body function and overall wellbeing.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin thinking more systemically about the body, health choices, and how evidence can support personal wellbeing understanding.",
      steps: [
        {
          id: 1,
          title: "Explain how body systems work together",
          meaning:
            "Understand that movement, breathing, digestion, circulation, and other systems interact rather than working alone.",
          skillFocus: "interaction between body systems",
          practiceActivity:
            "Discuss exercise, digestion, recovery, or daily activity and explain how more than one body system is involved.",
          evidenceExamples: [
            "a systems-interaction explanation",
            "a learner note connecting two body systems",
            "a parent summary of a body-science discussion",
          ],
          nextStep:
            "Build toward lower-secondary reasoning about body regulation, choices, and evidence in health claims.",
          reportLanguage:
            "The learner is increasingly able to explain how body systems work together to support movement, health, and daily life.",
        },
        {
          id: 2,
          title: "Use evidence to discuss healthier choices",
          meaning:
            "Move beyond simple rules and use observed effects or information to explain why a choice supports wellbeing.",
          skillFocus: "evidence-based health reasoning",
          practiceActivity:
            "Compare hydration, sleep, food, movement, or recovery patterns and discuss what evidence shows about their effects.",
          evidenceExamples: [
            "a reflection on a wellbeing habit",
            "a learner explanation supported by observations or information",
            "a parent note from a practical health discussion",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of health information and body-function explanations.",
          reportLanguage:
            "The learner is beginning to use evidence more thoughtfully when discussing choices that support health and wellbeing.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens system explanation, interpretation of health information, and more mature reasoning about body function and wellbeing.",
      steps: [
        {
          id: 1,
          title: "Interpret information about body systems and health",
          meaning:
            "Use diagrams, observations, and health information to explain how the body responds, changes, or maintains function.",
          skillFocus: "interpretation of body and health evidence",
          practiceActivity:
            "Study pulse, breathing, exercise response, nutrition patterns, or wellbeing data and discuss what the information suggests.",
          evidenceExamples: [
            "a health-data interpretation",
            "a learner explanation of a body response",
            "a parent note from an evidence-based discussion",
          ],
          nextStep:
            "Use this evidence reading to support later evaluation of claims and personal decision-making.",
          reportLanguage:
            "The learner is increasingly able to interpret body and health information and explain how evidence relates to body function and wellbeing.",
        },
        {
          id: 2,
          title: "Evaluate simple health claims using evidence",
          meaning:
            "Ask what evidence supports a claim about food, exercise, products, or wellbeing advice.",
          skillFocus: "critical evaluation of health claims",
          practiceActivity:
            "Compare health messages from packaging, media, or information sources and discuss what evidence is trustworthy or weak.",
          evidenceExamples: [
            "a comparison of two health claims",
            "a learner reflection on reliable evidence",
            "a parent summary of a critical health discussion",
          ],
          nextStep:
            "Build into later consolidation where health and wellbeing decisions are reasoned more independently.",
          reportLanguage:
            "The learner is developing stronger skill in evaluating health claims and considering what evidence supports reliable conclusions.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together system understanding, wellbeing reasoning, and evidence-based evaluation of body and health questions.",
      steps: [
        {
          id: 1,
          title: "Use evidence to justify wellbeing decisions",
          meaning:
            "Bring together body-system knowledge, observation, and information sources to explain why a choice is sensible or limited.",
          skillFocus: "evidence-based wellbeing decision-making",
          practiceActivity:
            "Review a health habit, plan, claim, or recommendation and explain which choices are best supported by evidence and why.",
          evidenceExamples: [
            "a wellbeing decision reflection",
            "a learner explanation using more than one source of evidence",
            "a parent note from a critical discussion about health choices",
          ],
          nextStep:
            "Use this reasoning habit across science, PE, wellbeing reflection, and life planning.",
          reportLanguage:
            "The learner is consolidating the ability to justify wellbeing decisions using evidence about body function, health, and daily habits.",
        },
        {
          id: 2,
          title: "Communicate body and health understanding clearly",
          meaning:
            "Present a coherent explanation about body systems, wellbeing, or health evidence using appropriate science language and examples.",
          skillFocus: "clear communication in body science",
          practiceActivity:
            "Create a report, poster, presentation, or health explanation summarising a body system, wellbeing issue, or evidence review.",
          evidenceExamples: [
            "a report or presentation about health science",
            "a diagram-supported explanation",
            "a learner explanation connecting evidence and conclusion",
          ],
          nextStep:
            "These habits continue to support stronger reporting, self-understanding, and integrated wellbeing learning.",
          reportLanguage:
            "The learner is strengthening the ability to communicate body and health understanding clearly, using evidence and explanation with growing maturity.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early body-awareness example, one body-systems explanation, and one later evidence-based health reflection so growth is visible across the strand.",
    "Diagrams, movement observations, wellbeing reflections, and short learner explanations often make strong portfolio evidence in this strand.",
    "A portfolio becomes stronger when it shows how the learner moved from naming body parts into using evidence to explain systems and wellbeing choices.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, body understanding, system explanation, and evidence-based health reasoning rather than only naming health topics studied.",
    "Examples are strongest when the learner explains how the body works and what evidence supports healthier or more informed choices.",
    "Collected evidence can show a clear shift from simple body awareness to more mature understanding of systems, claims, and wellbeing decisions.",
  ],
};

const SCIENCE_IN_SOCIETY_AND_TECHNOLOGY: ScienceStrandConfig = {
  key: "science-in-society-and-technology",
  title: "Science in society and technology",
  subtitle:
    "Science in society and technology helps learners see how scientific ideas affect tools, inventions, environmental choices, public claims, and everyday decisions. It grows from simple noticing of useful tools into more critical thinking about evidence, impact, and responsibility.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on inquiry, evidence, and explanation from every other science strand. It applies science understanding to tools, design, environmental questions, public communication, and responsible real-world choices.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early learning begins with noticing that tools and inventions help people and that science ideas appear in everyday life.",
      steps: [
        {
          id: 1,
          title: "Notice tools and inventions that help people",
          meaning:
            "Recognise that people use tools and simple technologies to solve everyday problems.",
          skillFocus: "noticing science and technology in daily life",
          practiceActivity:
            "Talk about torches, wheels, kitchen tools, containers, weather gear, or garden tools and what problem each helps solve.",
          evidenceExamples: [
            "a drawing of a useful tool",
            "a learner explanation of what a tool helps with",
            "a parent note from a science-and-technology discussion",
          ],
          nextStep:
            "Build toward lower-primary comparison of choices, purposes, and simple impacts.",
          reportLanguage:
            "The learner is beginning to notice that tools and inventions help people solve practical everyday problems.",
        },
        {
          id: 2,
          title: "Talk about how science ideas appear around us",
          meaning:
            "Begin seeing that weather, plants, movement, materials, and machines connect to science ideas.",
          skillFocus: "early science-in-life awareness",
          practiceActivity:
            "Discuss how raincoats, cooking, magnets, pets, plants, or shadows connect to science experiences in everyday life.",
          evidenceExamples: [
            "a simple science-in-life photo page",
            "a learner comment linking a daily experience to science",
            "a parent note about an everyday science discussion",
          ],
          nextStep:
            "Carry this into lower-primary reasoning about how science helps people make choices.",
          reportLanguage:
            "The learner is developing early awareness that science ideas connect to many parts of everyday life.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin connecting science understanding to local choices, useful inventions, and simple environmental or design decisions.",
      steps: [
        {
          id: 1,
          title: "Describe how science can help solve local problems",
          meaning:
            "See that observation, testing, and useful knowledge can help with everyday practical questions.",
          skillFocus: "science as problem solving",
          practiceActivity:
            "Discuss shade, insulation, water use, garden care, food storage, or recycling and how science understanding might help.",
          evidenceExamples: [
            "a simple problem-and-solution page",
            "a learner explanation of how science helped with a task",
            "a parent note from a local science discussion",
          ],
          nextStep:
            "Build into middle-primary thinking about evidence in choices and the impact of tools or systems.",
          reportLanguage:
            "The learner is beginning to understand that science can help solve practical problems in home and community life.",
        },
        {
          id: 2,
          title: "Compare simple tools or technologies for purpose",
          meaning:
            "Look at how two tools or devices differ and which one suits a job better.",
          skillFocus: "comparison of technology choices",
          practiceActivity:
            "Compare containers, light sources, gardening tools, or simple devices and talk about which is more useful for a particular purpose.",
          evidenceExamples: [
            "a tool comparison chart",
            "a learner explanation of which option worked better",
            "a parent note from a practical comparison task",
          ],
          nextStep:
            "Carry this into middle-primary evidence-based comparison of impact, design, and responsible use.",
          reportLanguage:
            "The learner is increasingly able to compare simple tools or technologies and explain which one better suits a practical purpose.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens awareness that science and technology choices involve evidence, design, and consequences for people and environments.",
      steps: [
        {
          id: 1,
          title: "Use evidence when discussing technology choices",
          meaning:
            "Compare options and support a view using observations, tests, or gathered information rather than opinion alone.",
          skillFocus: "evidence in choice and comparison",
          practiceActivity:
            "Compare materials, garden solutions, water-saving ideas, or simple devices and ask what evidence supports the better choice.",
          evidenceExamples: [
            "a supported comparison of two solutions",
            "a learner explanation using observed evidence",
            "a parent note from a decision-making discussion",
          ],
          nextStep:
            "Use this evidence habit to support upper-primary thinking about impact and responsibility.",
          reportLanguage:
            "The learner is increasingly able to use evidence when comparing technology choices and practical science solutions.",
        },
        {
          id: 2,
          title: "Consider impact on people and environments",
          meaning:
            "Recognise that useful choices can also have consequences that need to be noticed or discussed.",
          skillFocus: "impact and responsibility",
          practiceActivity:
            "Discuss packaging, transport, water use, simple inventions, or local environmental actions and who or what they affect.",
          evidenceExamples: [
            "a simple impact map",
            "a learner reflection on a science-related choice",
            "a parent summary of an environmental or design discussion",
          ],
          nextStep:
            "Carry this into upper-primary reasoning about responsible design and public claims.",
          reportLanguage:
            "The learner is beginning to recognise that science and technology choices can affect people and environments in different ways.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin weighing evidence, design purpose, and consequences more thoughtfully when considering tools, innovations, and public issues.",
      steps: [
        {
          id: 1,
          title: "Explain how science ideas support useful technologies",
          meaning:
            "Connect scientific understanding to how a tool, system, or invention works or why it was designed in a particular way.",
          skillFocus: "science behind technology",
          practiceActivity:
            "Choose a household technology or local system and explain which science ideas make it effective or safe.",
          evidenceExamples: [
            "a science-and-technology explanation page",
            "a learner explanation of how an invention works",
            "a parent note from a practical systems discussion",
          ],
          nextStep:
            "Build toward lower-secondary evaluation of evidence in claims and innovation decisions.",
          reportLanguage:
            "The learner is increasingly able to explain how scientific understanding supports the design or use of everyday technologies.",
        },
        {
          id: 2,
          title: "Question claims and consider responsible use",
          meaning:
            "Ask whether a claim is well supported and whether a choice is helpful, safe, fair, or environmentally sensible.",
          skillFocus: "questioning claims and responsibility",
          practiceActivity:
            "Review a simple science advertisement, product claim, or environmental proposal and ask what evidence is given and what concerns remain.",
          evidenceExamples: [
            "a claim-and-evidence review",
            "a learner reflection on responsible use",
            "a parent summary of a critical discussion",
          ],
          nextStep:
            "Carry this into lower-secondary analysis of public claims, media messages, and science-related decisions.",
          reportLanguage:
            "The learner is beginning to question science-related claims more thoughtfully and consider the responsibilities connected to technology use.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens evaluation of evidence in public claims, technology impacts, environmental decisions, and science communication.",
      steps: [
        {
          id: 1,
          title: "Evaluate evidence behind public science claims",
          meaning:
            "Look more critically at how science ideas are presented in media, products, campaigns, or public discussion.",
          skillFocus: "evaluation of public claims",
          practiceActivity:
            "Compare media articles, product messages, environmental claims, or health statements and discuss what evidence is strong or weak.",
          evidenceExamples: [
            "a critique of a public science claim",
            "a learner comparison of evidence quality",
            "a parent note from a media or claims discussion",
          ],
          nextStep:
            "Use this critical reading to support later evaluation of innovation, ethics, and evidence-informed decisions.",
          reportLanguage:
            "The learner is increasingly able to evaluate public science claims and consider how evidence affects the reliability of a message.",
        },
        {
          id: 2,
          title: "Consider technology impact with evidence and balance",
          meaning:
            "Discuss benefits, limitations, and possible consequences of a science-based choice or technology.",
          skillFocus: "balanced reasoning about impact",
          practiceActivity:
            "Examine an invention, environmental technology, or community issue and discuss both helpful outcomes and possible trade-offs.",
          evidenceExamples: [
            "a benefits-and-limitations comparison",
            "a learner explanation of a balanced viewpoint",
            "a parent summary of a technology-impact discussion",
          ],
          nextStep:
            "Build into later consolidation where science, ethics, and evidence are weighed with more independence.",
          reportLanguage:
            "The learner is developing more balanced reasoning about the impacts of science and technology, using evidence to weigh benefits and limitations.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together evidence, communication, and ethical or practical evaluation of science in society and technology.",
      steps: [
        {
          id: 1,
          title: "Use evidence to justify a science-related position",
          meaning:
            "Bring together understanding from multiple strands to support a reasoned position on a science-in-society issue.",
          skillFocus: "evidence-based position taking",
          practiceActivity:
            "Choose a community, environmental, or technology issue and prepare a supported response that weighs evidence and consequences.",
          evidenceExamples: [
            "a position statement with evidence",
            "a learner justification using more than one science idea",
            "a parent note from a reasoned discussion about a public issue",
          ],
          nextStep:
            "Use this habit across reports, debates, project work, and later real-world decision making.",
          reportLanguage:
            "The learner is consolidating the ability to justify science-related positions using evidence, balanced reasoning, and clearer understanding of wider impacts.",
        },
        {
          id: 2,
          title: "Communicate science-and-society understanding clearly",
          meaning:
            "Present a coherent explanation or argument about a science-related issue, innovation, or claim for an audience.",
          skillFocus: "clear communication about science in society",
          practiceActivity:
            "Create a short report, poster, presentation, or discussion summary about a science-related public question or technology topic.",
          evidenceExamples: [
            "a report or presentation on a science-and-society issue",
            "a learner explanation connecting evidence, impact, and conclusion",
            "a structured comparison of different viewpoints",
          ],
          nextStep:
            "These habits continue to support mature science communication, responsible citizenship, and integrated pathway learning.",
          reportLanguage:
            "The learner is strengthening the ability to communicate science-in-society understanding clearly, using evidence and balanced reasoning with growing maturity.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early tool-or-invention example, one evidence-based comparison, and one later public-claim or impact evaluation so this strand shows growing maturity.",
    "Photos, design notes, issue reflections, comparison charts, and learner explanations often make strong portfolio evidence in this strand.",
    "A portfolio is stronger when it shows how the learner moved from noticing useful technologies into evaluating evidence, impact, and responsibility.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in evidence use, comparison, explanation, and responsible reasoning about science in everyday and public contexts.",
    "Examples are strongest when the learner explains what a technology or claim does, what evidence supports it, and what wider impacts need consideration.",
    "Collected evidence can show a clear shift from simple awareness of tools and inventions to more mature science-and-society reasoning.",
  ],
};

const SCIENCE_STRAND_CONFIGS: ScienceStrandConfig[] = [
  SCIENTIFIC_INQUIRY_AND_INVESTIGATION,
  LIVING_THINGS_AND_ENVIRONMENTS,
  EARTH_AND_SPACE,
  PHYSICAL_SCIENCES,
  MATERIALS_MATTER_AND_CHANGE,
  FORCES_ENERGY_AND_MOTION,
  HUMAN_BODY_AND_HEALTH,
  SCIENCE_IN_SOCIETY_AND_TECHNOLOGY,
];

export const SCIENCE_STRAND_WORKSPACE_BUILDERS: Record<string, StrandBuilder> =
  Object.fromEntries(
    SCIENCE_STRAND_CONFIGS.map((config) => [
      config.key,
      (currentFocusStageKey: PathwayStageKey) =>
        buildScienceWorkspace(currentFocusStageKey, config),
    ]),
  );

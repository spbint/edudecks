import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

type TechnologiesStepInput = {
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

type TechnologiesStageInput = {
  key: PathwayStageKey;
  helper: string;
  steps: [TechnologiesStepInput, TechnologiesStepInput];
};

type TechnologiesStrandConfig = {
  key: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  portfolioSupport: string[];
  reportingSupport: string[];
  stages: TechnologiesStageInput[];
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

function buildTechnologiesStep(step: TechnologiesStepInput) {
  return {
    id: step.id,
    title: step.title,
    meaning: step.meaning,
    skillFocus: step.skillFocus,
    learningIntention:
      step.learningIntention ||
      `Develop ${step.skillFocus} through practical designing, making, testing, discussion, and reflection.`,
    successCriteria: step.successCriteria || [
      "The learner can use this idea in a familiar practical or digital task.",
      "The learner can show, explain, or demonstrate what was made, tested, or improved.",
      "The learner can respond to feedback about safety, function, or effectiveness.",
    ],
    practiceActivity: step.practiceActivity,
    evidenceExamples: step.evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      "Later, check whether the learner can apply this more independently and explain why the design, tool, or system choice made sense.",
    nextStep: step.nextStep,
    reportLanguage: step.reportLanguage,
  };
}

function buildTechnologiesWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: TechnologiesStrandConfig,
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
      steps: stage.steps.map(buildTechnologiesStep),
    })),
    portfolioSupport: config.portfolioSupport,
    reportingSupport: config.reportingSupport,
  };
}

export const DEFAULT_TECHNOLOGIES_STRAND_KEY = "design-and-production";

export const TECHNOLOGIES_SUBJECT_OVERVIEW = {
  eyebrow: "Technologies F-10 / K-10 strand map",
  title: "Technologies pathway overview",
  description:
    "This first Technologies build shows design, digital systems, computational thinking, materials, food and fibre, and engineering as connected strands. Each strand uses the same calm stage-based pathway workspace as the other detailed subjects.",
  helper:
    "Choose one strand to explore. The selected strand opens in the focused workspace below, so Technologies stays hands-on and readable rather than becoming a long technical wall.",
};

export const TECHNOLOGIES_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "design-and-production",
    title: "Design and production",
    description:
      "Identify needs, imagine solutions, plan, make, test, improve, and explain design choices.",
    whyItMatters:
      "Design and production connects planning, creativity, making, and evaluation in practical family learning.",
    status: "first-detailed",
  },
  {
    key: "digital-technologies-and-systems",
    title: "Digital technologies and systems",
    description:
      "Use digital tools safely, understand devices and systems, work with data, and create digital solutions.",
    whyItMatters:
      "Digital technologies connects safe tool use, systems thinking, data, communication, and responsible digital participation.",
    status: "detailed",
  },
  {
    key: "computational-thinking",
    title: "Computational thinking",
    description:
      "Build sequencing, patterns, algorithms, decomposition, debugging, logic, and automation ideas.",
    whyItMatters:
      "Computational thinking supports coding, problem-solving, sequencing, automation, and clearer logical reasoning.",
    status: "detailed",
  },
  {
    key: "materials-tools-and-making",
    title: "Materials, tools and making",
    description:
      "Choose materials, use tools safely, shape and join parts, test function, and make useful products.",
    whyItMatters:
      "Materials and making connects science, measurement, safety, design, and practical workmanship.",
    status: "detailed",
  },
  {
    key: "food-fibre-and-practical-technologies",
    title: "Food, fibre and practical technologies",
    description:
      "Explore food preparation, textiles, growing materials, safety, sustainability, and practical life skills.",
    whyItMatters:
      "Food and fibre connects health, sustainability, practical life skills, and real production processes.",
    status: "detailed",
  },
  {
    key: "engineering-systems-and-problem-solving",
    title: "Engineering, systems and problem-solving",
    description:
      "Investigate structures, mechanisms, systems, prototypes, testing, iteration, and real-world problem-solving.",
    whyItMatters:
      "Engineering applies science, mathematics, design, and testing to purposeful real-world problems.",
    status: "detailed",
  },
];

const DESIGN_AND_PRODUCTION: TechnologiesStrandConfig = {
  key: "design-and-production",
  title: "Design and production",
  subtitle:
    "Design and production helps learners notice needs, imagine possibilities, sketch ideas, make solutions, test outcomes, and improve what they create. It grows from playful invention into more thoughtful planning, criteria, and explanation of design choices.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on observation, creativity, and practical problem-solving. It connects to materials, engineering, digital tools, evaluation, and making useful solutions for real situations.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early design begins with noticing needs, imagining possibilities, and making simple things with help and conversation.",
      steps: [
        {
          id: 1,
          title: "Notice a simple need or problem to solve",
          meaning:
            "Recognise that things can be made or changed to help someone, hold something, or make an activity work better.",
          skillFocus: "early design noticing",
          practiceActivity:
            "Talk about a messy shelf, a toy needing a home, or a pretend-play need and ask what could be made to help.",
          evidenceExamples: [
            "a parent note about a design problem the learner noticed",
            "a drawing of an idea to help with a small problem",
            "a short oral explanation of what needed fixing or making",
          ],
          nextStep:
            "Build from simple need-noticing into imagining and sharing one or two design ideas.",
          reportLanguage:
            "The learner is beginning to notice simple needs or problems and suggest practical ideas that could help.",
        },
        {
          id: 2,
          title: "Make and talk about a simple design idea",
          meaning:
            "Use drawing, blocks, cardboard, or craft materials to make an early solution and explain what it does.",
          skillFocus: "early idea-making and explanation",
          practiceActivity:
            "Build a small model, draw a design, or make a simple object from child-safe materials and talk through how it works.",
          evidenceExamples: [
            "a photo of a first design model",
            "a learner explanation of what the design is for",
            "a parent note about how the learner described the idea",
          ],
          nextStep:
            "Carry this into lower-primary planning, making, and simple improvement.",
          reportLanguage:
            "The learner is developing confidence in making simple design ideas and explaining what the finished piece is meant to do.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin planning, making, and improving simple products more deliberately while keeping purpose in mind.",
      steps: [
        {
          id: 1,
          title: "Plan simple steps before making",
          meaning:
            "Use a sketch, picture sequence, or short plan to show what will be made and how it might happen.",
          skillFocus: "early planning and sequencing",
          practiceActivity:
            "Sketch a toy holder, a paper structure, or a small useful object and list the first few making steps.",
          evidenceExamples: [
            "a simple sketch with labels",
            "a step-by-step plan page",
            "a parent note about how the learner planned before making",
          ],
          nextStep:
            "Use planning to support better making choices and simple testing.",
          reportLanguage:
            "The learner is increasingly able to plan a simple design before making and use that plan to guide the process.",
        },
        {
          id: 2,
          title: "Test and improve a simple product",
          meaning:
            "Try out a made item, notice what worked or failed, and adjust it in a small but purposeful way.",
          skillFocus: "early testing and improvement",
          practiceActivity:
            "Make a paper bridge, holder, or toy feature, test it, and talk about one thing to change so it works better.",
          evidenceExamples: [
            "before-and-after photos of a design change",
            "a learner explanation of one improvement",
            "a parent note about what the test showed",
          ],
          nextStep:
            "Carry this into middle-primary work on matching ideas, materials, and user needs more carefully.",
          reportLanguage:
            "The learner is beginning to test and improve simple products and can explain how a small change made the design work better.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary design strengthens planning, user awareness, and explaining how choices affect function and usefulness.",
      steps: [
        {
          id: 1,
          title: "Design with a user or purpose more clearly in mind",
          meaning:
            "Match the design idea to who will use it or what job it needs to do.",
          skillFocus: "purposeful design thinking",
          practiceActivity:
            "Design something for a younger sibling, a pet, a learning space, or a practical task and explain who it is for.",
          evidenceExamples: [
            "a labelled design brief or sketch",
            "a learner explanation of user needs",
            "a parent summary of why one design choice was made",
          ],
          nextStep:
            "Use clearer purpose to support stronger material, size, and function decisions.",
          reportLanguage:
            "The learner is increasingly able to design with a clearer user or purpose in mind and explain how the design matches that need.",
        },
        {
          id: 2,
          title: "Compare two design ideas and choose one",
          meaning:
            "Look at more than one option and decide which is more useful, stable, simple, or effective.",
          skillFocus: "design comparison and selection",
          practiceActivity:
            "Sketch two possible solutions, compare them, and explain why one is the better choice to make first.",
          evidenceExamples: [
            "a side-by-side design comparison",
            "a learner explanation of the chosen option",
            "a parent note from a design discussion",
          ],
          nextStep:
            "Carry this into upper-primary design criteria, testing, and more deliberate evaluation.",
          reportLanguage:
            "The learner is beginning to compare design ideas thoughtfully and justify which option seems stronger for the task.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin using clearer criteria, more deliberate testing, and stronger evaluation of how well a design meets its purpose.",
      steps: [
        {
          id: 1,
          title: "Use simple design criteria to judge success",
          meaning:
            "Decide what a good solution should do and use those criteria when testing the finished result.",
          skillFocus: "criteria-based evaluation",
          practiceActivity:
            "Choose two or three success points such as stable, easy to use, neat, or strong, then test the design against them.",
          evidenceExamples: [
            "a design criteria checklist",
            "a learner explanation of whether the criteria were met",
            "a parent note about evaluation after testing",
          ],
          nextStep:
            "Use criteria-based thinking to support lower-secondary refinement and trade-off decisions.",
          reportLanguage:
            "The learner is increasingly able to use simple design criteria to evaluate how well a product meets its intended purpose.",
        },
        {
          id: 2,
          title: "Refine a design after testing and feedback",
          meaning:
            "Use the test result or another person's response to make a more thoughtful improvement.",
          skillFocus: "refinement and feedback use",
          practiceActivity:
            "Test a design with a user or in a real situation and decide what should change next.",
          evidenceExamples: [
            "a refinement note after feedback",
            "before-and-after sketches or photos",
            "a learner explanation of why a change mattered",
          ],
          nextStep:
            "Carry this into lower-secondary design iteration, constraints, and evidence-based choices.",
          reportLanguage:
            "The learner is beginning to use testing and feedback more deliberately to refine design ideas and improve function.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens iteration, constraints, and clearer reasoning about why one design response works better than another.",
      steps: [
        {
          id: 1,
          title: "Design within constraints and explain trade-offs",
          meaning:
            "Recognise that time, materials, budget, safety, or user needs can shape which design choice is realistic.",
          skillFocus: "constraints and trade-offs",
          practiceActivity:
            "Plan a small project with limited materials or time and explain what had to be prioritised or simplified.",
          evidenceExamples: [
            "a constraints note or planning page",
            "a learner explanation of a design trade-off",
            "a parent summary of a design decision discussion",
          ],
          nextStep:
            "Use constraint thinking to support stronger iteration and evaluation of alternatives.",
          reportLanguage:
            "The learner is increasingly able to explain how constraints affect design decisions and why certain trade-offs were made.",
        },
        {
          id: 2,
          title: "Iterate a design using evidence from testing",
          meaning:
            "Use real test results rather than guesswork alone to improve a design more effectively.",
          skillFocus: "evidence-based iteration",
          practiceActivity:
            "Test a design, record what happened, and use that evidence to make a more purposeful second version.",
          evidenceExamples: [
            "test notes linked to a revised version",
            "a learner explanation of what the evidence showed",
            "a comparison of first and second prototypes",
          ],
          nextStep:
            "Build toward later consolidation where design solutions are compared and communicated more critically.",
          reportLanguage:
            "The learner is developing stronger design iteration habits and can increasingly use test evidence to guide improvement.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together planning, criteria, iteration, constraints, and clearer communication about design responses and their effectiveness.",
      steps: [
        {
          id: 1,
          title: "Evaluate different design responses more critically",
          meaning:
            "Compare two solutions and weigh which one better fits the need, user, criteria, and available constraints.",
          skillFocus: "critical design evaluation",
          practiceActivity:
            "Compare two prototype ideas or finished designs and explain which response is better supported by the evidence.",
          evidenceExamples: [
            "a design comparison evaluation",
            "a learner explanation of the stronger solution",
            "a parent note from a critical design discussion",
          ],
          nextStep:
            "Use this evaluation habit across engineering, practical making, and future project work.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate design responses critically and explain which solution best meets the task requirements.",
        },
        {
          id: 2,
          title: "Communicate the design process clearly",
          meaning:
            "Present problem, ideas, tests, changes, and final reasoning in a way another person can follow.",
          skillFocus: "clear design communication",
          practiceActivity:
            "Create a design journal, report, display, or presentation that shows how a solution was planned, tested, and improved.",
          evidenceExamples: [
            "a design journal or presentation",
            "a learner explanation of the process from idea to improvement",
            "a visual summary of design stages and decisions",
          ],
          nextStep:
            "These habits continue to support stronger portfolio evidence, reporting, and practical problem-solving.",
          reportLanguage:
            "The learner is strengthening the ability to communicate the design process clearly, showing how ideas, testing, and improvements led to the final solution.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early idea sketch, one mid-stage prototype example, and one later evidence-based improvement note so growth in design thinking is visible over time.",
    "Photos of models, plans, criteria checklists, and learner explanations often make stronger portfolio evidence than the finished product alone.",
    "A portfolio becomes stronger when it shows how the learner moved from imagining solutions into planning, testing, improving, and explaining decisions.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in planning, iteration, evaluation, and explanation of design choices rather than only describing what was made.",
    "Examples are strongest when the learner explains the need, the chosen solution, what testing showed, and why the design improved.",
    "Collected evidence can show a clear shift from playful design making into more deliberate criteria-based design reasoning.",
  ],
};

const DIGITAL_TECHNOLOGIES_AND_SYSTEMS: TechnologiesStrandConfig = {
  key: "digital-technologies-and-systems",
  title: "Digital technologies and systems",
  subtitle:
    "Digital technologies and systems helps learners use digital tools safely, understand how devices and systems work together, handle information more carefully, and create simple digital solutions. It grows from guided tool use into clearer system thinking, responsibility, and purposeful digital creation.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on communication, sequencing, and responsible habits. It connects to computational thinking, design, data use, digital citizenship, and creating practical digital solutions.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early digital learning begins with guided device use, simple inputs and outputs, and calm habits for using shared technology safely.",
      steps: [
        {
          id: 1,
          title: "Use digital tools with support and safe habits",
          meaning:
            "Recognise that devices are tools for learning, creating, and communicating and that they are used carefully.",
          skillFocus: "guided safe digital use",
          practiceActivity:
            "Use a tablet, camera, or computer with an adult to take a photo, draw, listen, or view something useful while practising calm care.",
          evidenceExamples: [
            "a parent note about safe digital routines",
            "a simple digital creation or photo task",
            "a learner explanation of one safe device habit",
          ],
          nextStep:
            "Build from guided use into noticing what goes in, what comes out, and what the device helps do.",
          reportLanguage:
            "The learner is beginning to use digital tools with support and is developing early safe and responsible habits.",
        },
        {
          id: 2,
          title: "Notice input, output, and simple digital effects",
          meaning:
            "See that tapping, typing, speaking, or pressing can change what a digital tool does or shows.",
          skillFocus: "early system response awareness",
          practiceActivity:
            "Use a simple app, keyboard, microphone, or button-based toy and talk about what happened after an action was given.",
          evidenceExamples: [
            "a learner explanation of what changed on a screen or device",
            "a parent note about input/output discussion",
            "a simple observation page about digital actions and results",
          ],
          nextStep:
            "Carry this into lower-primary tool choice, file use, and simple digital creation.",
          reportLanguage:
            "The learner is developing early understanding that digital tools respond to inputs and produce outputs that can be observed and discussed.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin creating simple digital products, using files and devices more deliberately, and practising clearer responsible use.",
      steps: [
        {
          id: 1,
          title: "Create and save simple digital work",
          meaning:
            "Use a familiar program or app to make, name, and save a simple digital product.",
          skillFocus: "basic digital creation and file awareness",
          practiceActivity:
            "Create a labelled picture, short typed message, slideshow page, or photo set and save it with support.",
          evidenceExamples: [
            "a saved digital creation",
            "a learner explanation of what the file contains",
            "a parent note about naming or finding work",
          ],
          nextStep:
            "Use file awareness to support stronger digital organisation and communication later.",
          reportLanguage:
            "The learner is increasingly able to create simple digital work and manage basic save-and-find routines with growing confidence.",
        },
        {
          id: 2,
          title: "Use simple rules for responsible digital behaviour",
          meaning:
            "Understand basic expectations for care, sharing, time use, and asking for help when using technology.",
          skillFocus: "early digital citizenship",
          practiceActivity:
            "Talk about asking before sharing, caring for devices, using kind communication, and pausing when something online feels unclear.",
          evidenceExamples: [
            "a learner explanation of one responsible digital choice",
            "a parent note about a digital safety conversation",
            "a family digital-use agreement or reflection",
          ],
          nextStep:
            "Carry this into middle-primary understanding of systems, data, and digital choices.",
          reportLanguage:
            "The learner is building awareness of responsible digital behaviour and can explain simple safety and care expectations when using technology.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens system awareness, data handling, and clearer explanation of how digital tools help solve a task.",
      steps: [
        {
          id: 1,
          title: "Describe how parts of a digital system work together",
          meaning:
            "Recognise that devices often include inputs, outputs, stored information, and connected parts that help a task happen.",
          skillFocus: "digital system awareness",
          practiceActivity:
            "Talk through how a keyboard, screen, camera, printer, internet connection, or simple app works together during a task.",
          evidenceExamples: [
            "a labelled digital-system diagram",
            "a learner explanation of how a device task worked",
            "a parent summary of a systems discussion",
          ],
          nextStep:
            "Use system understanding to support upper-primary work with networks, data, and solution design.",
          reportLanguage:
            "The learner is increasingly able to describe how parts of a digital system work together to complete a task.",
        },
        {
          id: 2,
          title: "Organise and use simple data or information carefully",
          meaning:
            "Collect, sort, or present digital information in a way that makes it easier to use or understand.",
          skillFocus: "basic data handling",
          practiceActivity:
            "Use a table, slide, folder, or simple form to organise names, observations, photos, or project information.",
          evidenceExamples: [
            "a simple data table or organised digital folder",
            "a learner explanation of why information was sorted that way",
            "a parent note about data organisation during a task",
          ],
          nextStep:
            "Carry this into upper-primary work on digital purpose, communication, and responsible data use.",
          reportLanguage:
            "The learner is beginning to organise digital information more carefully and explain how that organisation supports the task.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin thinking more deliberately about networks, data choices, communication, and designing simple digital solutions for a user or purpose.",
      steps: [
        {
          id: 1,
          title: "Create a digital solution for a simple purpose",
          meaning:
            "Use an app, slide deck, document, form, or simple digital process to solve a small communication or organisation need.",
          skillFocus: "purposeful digital solution design",
          practiceActivity:
            "Make a presentation, digital instructions, form, or visual guide for a real home or learning purpose.",
          evidenceExamples: [
            "a digital product made for a clear purpose",
            "a learner explanation of who the solution was for",
            "a parent note about why the digital choice fit the task",
          ],
          nextStep:
            "Use purposeful creation to support lower-secondary evaluation of system choices and digital impact.",
          reportLanguage:
            "The learner is increasingly able to create digital solutions for a clear purpose and explain how the tool choice supports the task.",
        },
        {
          id: 2,
          title: "Discuss networks, sharing, and responsible data use",
          meaning:
            "Understand more clearly that information can move between devices and that sharing, privacy, and care matter.",
          skillFocus: "responsible data and network awareness",
          practiceActivity:
            "Discuss how files move, how messages are shared, and why privacy, passwords, and asking before sharing information matter.",
          evidenceExamples: [
            "a learner explanation of one privacy or sharing rule",
            "a parent note from a digital responsibility discussion",
            "a simple summary of how devices or files connect",
          ],
          nextStep:
            "Carry this into lower-secondary system evaluation, digital impact, and more independent solution design.",
          reportLanguage:
            "The learner is beginning to discuss data sharing, networks, and privacy more thoughtfully when using digital tools.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens explanation of systems, data, privacy, and more deliberate evaluation of how digital tools solve practical problems.",
      steps: [
        {
          id: 1,
          title: "Explain how a digital system supports a practical task",
          meaning:
            "Describe how devices, software, stored information, and user actions work together to achieve an outcome.",
          skillFocus: "digital systems explanation",
          practiceActivity:
            "Analyse a familiar digital tool or workflow and explain how the parts support communication, planning, or production.",
          evidenceExamples: [
            "a digital workflow explanation",
            "a learner diagram of how a system works",
            "a parent summary of a systems reasoning discussion",
          ],
          nextStep:
            "Use system explanation to support stronger comparison of tools, privacy decisions, and solution quality.",
          reportLanguage:
            "The learner is increasingly able to explain how digital systems support practical tasks and how different parts work together.",
        },
        {
          id: 2,
          title: "Evaluate digital choices with safety and responsibility in mind",
          meaning:
            "Compare tools or sharing choices while considering privacy, clarity, usefulness, and appropriate behaviour.",
          skillFocus: "responsible evaluation of digital choices",
          practiceActivity:
            "Compare two digital tools or two ways of sharing information and discuss which choice is safer, clearer, or more appropriate.",
          evidenceExamples: [
            "a comparison of digital options",
            "a learner explanation of a responsible choice",
            "a parent note from a digital citizenship discussion",
          ],
          nextStep:
            "Build toward later consolidation where digital responses are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger judgment about digital choices and can increasingly evaluate options with safety, responsibility, and purpose in mind.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together systems understanding, digital solution design, responsible use, and clearer communication about digital choices and impact.",
      steps: [
        {
          id: 1,
          title: "Evaluate digital solutions and system choices critically",
          meaning:
            "Compare digital responses and weigh which tool, workflow, or system is more effective, responsible, or fit for purpose.",
          skillFocus: "critical evaluation of digital solutions",
          practiceActivity:
            "Compare two digital approaches to the same task and explain which one better meets the need, user, and safety expectations.",
          evidenceExamples: [
            "an evaluation of two digital solutions",
            "a learner explanation of why one system was stronger",
            "a parent note from a critical digital discussion",
          ],
          nextStep:
            "Use this evaluative habit across project work, reporting, and later technology design decisions.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate digital solutions critically and explain which choices are more effective and responsible.",
        },
        {
          id: 2,
          title: "Communicate digital-system understanding clearly",
          meaning:
            "Present how a digital system or solution works, what it was for, and why its design choices matter.",
          skillFocus: "clear digital communication",
          practiceActivity:
            "Create a short report, diagram, presentation, or demonstration showing how a digital system or solution supports a real task.",
          evidenceExamples: [
            "a digital systems report or presentation",
            "a learner explanation connecting function, user, and responsibility",
            "a visual summary of how a tool or system works",
          ],
          nextStep:
            "These habits continue to support strong portfolio evidence, digital citizenship, and practical systems understanding.",
          reportLanguage:
            "The learner is strengthening the ability to communicate digital-system understanding clearly, using practical explanation and responsible reasoning with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early digital-creation example, one system-or-data explanation, and one later evaluation of a digital choice so growth in digital understanding is visible.",
    "Screenshots, diagrams, saved files, workflow notes, and learner explanations often make stronger digital portfolio evidence than a finished file alone.",
    "A portfolio becomes stronger when it shows how the learner moved from guided tool use into purposeful, responsible, and evidence-based digital decisions.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in safe use, systems understanding, digital creation, data handling, and responsible decision-making rather than only listing apps used.",
    "Examples are strongest when the learner explains what the tool or system did, why it fit the purpose, and what made the choice responsible.",
    "Collected evidence can show a clear shift from guided device use into more independent and thoughtful digital-system reasoning.",
  ],
};

const COMPUTATIONAL_THINKING: TechnologiesStrandConfig = {
  key: "computational-thinking",
  title: "Computational thinking",
  subtitle:
    "Computational thinking helps learners use patterns, sequences, instructions, algorithms, debugging, and logic to solve problems more clearly. It grows from simple step-following into more deliberate reasoning about how processes can be broken down, tested, and improved.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on sequencing, pattern noticing, and explanation. It supports coding, digital systems, problem-solving, automation, and clearer logical thinking across many tasks.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early computational thinking begins with patterns, sequencing, and simple instructions in play, routines, and hands-on tasks.",
      steps: [
        {
          id: 1,
          title: "Follow and describe simple sequences",
          meaning:
            "Notice that some tasks happen in a clear order and that changing the order can change the outcome.",
          skillFocus: "early sequencing",
          practiceActivity:
            "Sequence a snack routine, craft task, obstacle course, or picture story and talk through the steps.",
          evidenceExamples: [
            "a picture sequence page",
            "a learner explanation of the order used",
            "a parent note about step-by-step thinking",
          ],
          nextStep:
            "Build from simple sequences into giving instructions and spotting patterns.",
          reportLanguage:
            "The learner is beginning to follow and describe simple sequences and is growing in awareness that order matters in many tasks.",
        },
        {
          id: 2,
          title: "Notice and continue simple patterns",
          meaning:
            "Recognise repeating patterns and predict what comes next.",
          skillFocus: "pattern noticing",
          practiceActivity:
            "Use blocks, sounds, colours, movements, or pictures to create and continue simple repeating patterns.",
          evidenceExamples: [
            "a repeating-pattern activity",
            "a learner explanation of what came next and why",
            "a parent note about pattern confidence",
          ],
          nextStep:
            "Carry this into lower-primary instruction writing and breaking tasks into parts.",
          reportLanguage:
            "The learner is developing early pattern recognition and can increasingly continue or explain simple repeating sequences.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin writing or giving instructions more clearly and breaking a task into smaller parts that are easier to manage.",
      steps: [
        {
          id: 1,
          title: "Give clear instructions for a simple task",
          meaning:
            "Use words, pictures, or arrows to show another person how to complete a small process.",
          skillFocus: "instructions and algorithms",
          practiceActivity:
            "Write or draw instructions for making a sandwich, navigating a room, or building a simple model.",
          evidenceExamples: [
            "a simple instruction set",
            "a learner explanation of how someone would follow the steps",
            "a parent note about where instructions needed refining",
          ],
          nextStep:
            "Use instruction-writing to support debugging and decomposition.",
          reportLanguage:
            "The learner is increasingly able to give clear instructions for simple tasks and is beginning to understand how algorithms guide action.",
        },
        {
          id: 2,
          title: "Break a task into smaller parts",
          meaning:
            "See that a bigger problem can become easier when separated into manageable pieces.",
          skillFocus: "decomposition",
          practiceActivity:
            "Break a project, puzzle, routine, or digital task into smaller steps and decide which part should happen first.",
          evidenceExamples: [
            "a broken-down task plan",
            "a learner explanation of smaller parts",
            "a parent note from a problem-solving discussion",
          ],
          nextStep:
            "Carry this into middle-primary debugging, loops, and more deliberate logic.",
          reportLanguage:
            "The learner is beginning to break tasks into smaller parts and can explain how this helps solve a problem more clearly.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens algorithm design, debugging, and recognising when repeated steps or simple logic can help a task run better.",
      steps: [
        {
          id: 1,
          title: "Design a simple algorithm for a practical task",
          meaning:
            "Create a more deliberate set of steps that another person or device could follow.",
          skillFocus: "algorithm design",
          practiceActivity:
            "Use unplugged coding, a block-based tool, or a practical routine to design steps for a repeatable task.",
          evidenceExamples: [
            "a block-based or written algorithm",
            "a learner explanation of why the steps were ordered that way",
            "a parent note from an algorithm discussion",
          ],
          nextStep:
            "Use algorithm design to support debugging and repetition patterns more clearly.",
          reportLanguage:
            "The learner is increasingly able to design simple algorithms and explain how ordered steps help a task succeed.",
        },
        {
          id: 2,
          title: "Debug a sequence when something goes wrong",
          meaning:
            "Notice an error, find where the process broke, and change the steps so the result improves.",
          skillFocus: "debugging and correction",
          practiceActivity:
            "Review a broken instruction set, coding block sequence, or practical routine and identify what needs changing.",
          evidenceExamples: [
            "a before-and-after algorithm fix",
            "a learner explanation of the error found",
            "a parent note about debugging discussion",
          ],
          nextStep:
            "Carry this into upper-primary logic, efficiency, and more complex pattern use.",
          reportLanguage:
            "The learner is beginning to debug sequences and can increasingly explain how changing one step improves the outcome.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin using loops, conditions, efficiency, and clearer logic to make processes work more effectively.",
      steps: [
        {
          id: 1,
          title: "Use repetition or simple conditions in a process",
          meaning:
            "Recognise that some tasks repeat and that some actions depend on a choice or condition being met.",
          skillFocus: "loops and conditions",
          practiceActivity:
            "Use a block-based tool or unplugged activity to repeat actions, branch between choices, or automate a small process.",
          evidenceExamples: [
            "a loop or condition example",
            "a learner explanation of why repetition or choice was useful",
            "a parent note from a logic discussion",
          ],
          nextStep:
            "Use this logic to support lower-secondary comparison of approaches and smarter automation.",
          reportLanguage:
            "The learner is increasingly able to use repetition and simple conditions to make a process more effective and manageable.",
        },
        {
          id: 2,
          title: "Compare two ways of solving the same problem",
          meaning:
            "Look at which approach is clearer, shorter, less error-prone, or more suitable for the task.",
          skillFocus: "efficiency and strategy comparison",
          practiceActivity:
            "Compare two algorithms, routines, or code paths and explain which one works better and why.",
          evidenceExamples: [
            "a comparison of two solutions",
            "a learner explanation of the more efficient option",
            "a parent summary of computational comparison",
          ],
          nextStep:
            "Carry this into lower-secondary decomposition, logic, and systematic testing.",
          reportLanguage:
            "The learner is beginning to compare different problem-solving approaches and justify which one is more efficient or suitable.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens logic, decomposition, debugging, and more systematic explanation of how processes and solutions work.",
      steps: [
        {
          id: 1,
          title: "Use decomposition and logic for a more complex task",
          meaning:
            "Break a larger task into smaller processes and use logical steps to manage each part more clearly.",
          skillFocus: "structured problem decomposition",
          practiceActivity:
            "Plan a multi-step digital or practical task, separate it into parts, and explain how those parts connect back to the final goal.",
          evidenceExamples: [
            "a decomposed problem plan",
            "a learner explanation of how the parts fit together",
            "a parent note from a structured problem-solving discussion",
          ],
          nextStep:
            "Use structured decomposition to support stronger testing and evaluation of solution quality.",
          reportLanguage:
            "The learner is increasingly able to decompose more complex tasks and use logic to structure problem-solving more clearly.",
        },
        {
          id: 2,
          title: "Test and improve a computational solution systematically",
          meaning:
            "Use repeated testing and careful checking rather than guesswork alone when improving a process or code sequence.",
          skillFocus: "systematic testing and debugging",
          practiceActivity:
            "Run a block-based or practical algorithm several times, note what fails, and improve the process step by step.",
          evidenceExamples: [
            "a debugging log or improvement notes",
            "a learner explanation of how testing changed the solution",
            "a comparison of earlier and improved logic",
          ],
          nextStep:
            "Build toward later consolidation where approaches and automation choices are compared more critically.",
          reportLanguage:
            "The learner is developing stronger testing and debugging habits and can increasingly improve solutions through more systematic checking.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together logic, decomposition, efficiency, automation, and clearer communication of how a computational solution works.",
      steps: [
        {
          id: 1,
          title: "Evaluate different computational approaches",
          meaning:
            "Compare solution paths and weigh which approach is clearer, more efficient, easier to maintain, or better suited to the task.",
          skillFocus: "critical evaluation of computational approaches",
          practiceActivity:
            "Compare two algorithms, automations, or logic structures and explain which one better fits the task and why.",
          evidenceExamples: [
            "an evaluation of two computational approaches",
            "a learner explanation of a stronger solution path",
            "a parent note from a critical reasoning discussion",
          ],
          nextStep:
            "Use this evaluation habit across coding, digital design, systems thinking, and future problem-solving projects.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate computational approaches critically and explain which option better suits the task requirements.",
        },
        {
          id: 2,
          title: "Communicate logic and solution design clearly",
          meaning:
            "Present how a process works, why it was structured that way, and how errors were improved or prevented.",
          skillFocus: "clear computational communication",
          practiceActivity:
            "Create a logic explanation, flowchart, annotated code sequence, or presentation showing how a solution works and improved over time.",
          evidenceExamples: [
            "a flowchart or annotated logic explanation",
            "a learner presentation about an algorithm or automation",
            "a debugging summary linked to final solution design",
          ],
          nextStep:
            "These habits continue to support strong portfolio evidence, reporting, and future computational learning.",
          reportLanguage:
            "The learner is strengthening the ability to communicate computational thinking clearly, showing how logic, testing, and improvement shaped the final solution.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early sequencing example, one debugging example, and one later algorithm comparison so growth in logical problem-solving is visible over time.",
    "Flowcharts, block sequences, instruction sets, debugging notes, and learner explanations often make strong computational portfolio evidence.",
    "A portfolio becomes stronger when it shows how the learner moved from simple steps and patterns into logic, decomposition, and more systematic solution design.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in sequencing, decomposition, debugging, logic, and evaluation of solution strategies rather than only naming coding tasks completed.",
    "Examples are strongest when the learner explains how a process works, where it failed, and why the improved version is stronger.",
    "Collected evidence can show a clear shift from simple instructions into more mature and structured computational reasoning.",
  ],
};

const MATERIALS_TOOLS_AND_MAKING: TechnologiesStrandConfig = {
  key: "materials-tools-and-making",
  title: "Materials, tools and making",
  subtitle:
    "Materials, tools and making helps learners choose materials, use tools safely, shape and join parts, test function, and create useful products. It grows from simple material exploration into more thoughtful choices about safety, durability, fit, and finish.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on practical play, comparison, and design thinking. It connects to science, measurement, safety, engineering, and purposeful making for real uses.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early making begins with touching, choosing, joining, and using simple child-safe tools with close adult support.",
      steps: [
        {
          id: 1,
          title: "Explore materials by feel, strength, and use",
          meaning:
            "Notice that materials can feel, bend, tear, stack, or hold differently and may suit different jobs.",
          skillFocus: "material awareness",
          practiceActivity:
            "Compare cardboard, paper, fabric, tape, string, clay, or recycled materials and talk about what each is useful for.",
          evidenceExamples: [
            "a material comparison page",
            "a learner explanation of which material worked best",
            "a parent note about safe exploration and discussion",
          ],
          nextStep:
            "Build from material noticing into simple joining and safe tool routines.",
          reportLanguage:
            "The learner is beginning to compare simple materials and describe how different materials suit different making tasks.",
        },
        {
          id: 2,
          title: "Use simple tools and joining methods safely with help",
          meaning:
            "Practise careful handling of child-safe tools and basic joining methods under adult supervision.",
          skillFocus: "early safe tool use",
          practiceActivity:
            "Use child-safe scissors, glue, tape, folding, or simple press-fit joining with an adult nearby and clear routines.",
          evidenceExamples: [
            "a parent note about safe tool habits",
            "a photo of a joined or assembled item",
            "a learner explanation of one tool or joining step",
          ],
          nextStep:
            "Carry this into lower-primary decisions about tool choice and stronger making accuracy.",
          reportLanguage:
            "The learner is developing early safe tool-use habits and can increasingly use simple joining methods with support and care.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin choosing tools and materials more deliberately while making useful items and noticing what affects strength or finish.",
      steps: [
        {
          id: 1,
          title: "Choose a material to suit a simple purpose",
          meaning:
            "Look at what an item needs to do and choose a material that seems stronger, softer, lighter, or more suitable.",
          skillFocus: "material choice for function",
          practiceActivity:
            "Choose materials for a bookmark, container, sign, toy feature, or simple model and explain the choice.",
          evidenceExamples: [
            "a chosen-material explanation",
            "a learner note about why one material fit the task",
            "a parent summary of a making discussion",
          ],
          nextStep:
            "Use purposeful material choice to support better shaping, joining, and testing.",
          reportLanguage:
            "The learner is increasingly able to choose simple materials for a purpose and explain why one option fits the making task better.",
        },
        {
          id: 2,
          title: "Make and test a simple joined product",
          meaning:
            "Use tools and joining methods to create something that can be tried, handled, or used for a small task.",
          skillFocus: "joined product making and testing",
          practiceActivity:
            "Make a simple holder, decoration, card structure, or practical item and test whether it holds, stands, or works as intended.",
          evidenceExamples: [
            "a photo of the made item in use",
            "a learner explanation of what held or failed",
            "a parent note about a safe making process",
          ],
          nextStep:
            "Carry this into middle-primary work on durability, finish, and improvement.",
          reportLanguage:
            "The learner is beginning to make and test simple joined products and can increasingly describe what helped the item work.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens tool choice, safer technique, property comparison, and practical improvement of function and durability.",
      steps: [
        {
          id: 1,
          title: "Compare material properties more carefully",
          meaning:
            "Look at flexibility, thickness, strength, texture, absorbency, or finish when deciding how to make something.",
          skillFocus: "property-based making decisions",
          practiceActivity:
            "Test a few materials for a product or structure and explain which property made one option better suited.",
          evidenceExamples: [
            "a materials test record",
            "a learner explanation of how a property mattered",
            "a parent note about reasoning during making",
          ],
          nextStep:
            "Use property comparison to support stronger tool and construction decisions.",
          reportLanguage:
            "The learner is increasingly able to compare material properties and use those comparisons to guide making decisions.",
        },
        {
          id: 2,
          title: "Use tools and techniques to improve fit and function",
          meaning:
            "Work more accurately and safely so the final product fits together and functions more effectively.",
          skillFocus: "safe technique and improved finish",
          practiceActivity:
            "Measure, cut, fold, join, stitch, clamp, or shape with age-appropriate tools under adult supervision and improve the result after testing.",
          evidenceExamples: [
            "a before-and-after making improvement",
            "a learner note about a technique that helped",
            "a parent observation of safer or more accurate tool use",
          ],
          nextStep:
            "Carry this into upper-primary evaluation of durability, function, and finish.",
          reportLanguage:
            "The learner is beginning to use tools and making techniques more accurately and safely to improve product fit and function.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin evaluating durability, finish, and quality more deliberately while refining how materials and tools are used.",
      steps: [
        {
          id: 1,
          title: "Test how durable or useful a made item is",
          meaning:
            "Check whether a product is strong enough, neat enough, or fit enough for the job it was meant to do.",
          skillFocus: "durability and usefulness testing",
          practiceActivity:
            "Use, handle, load, wash, or repeat a small product task and note what happened to its strength, join, or finish.",
          evidenceExamples: [
            "a durability test note",
            "a learner explanation of how the item performed",
            "a parent summary of what the testing showed",
          ],
          nextStep:
            "Use testing to support lower-secondary evaluation of material, tool, and process choices.",
          reportLanguage:
            "The learner is increasingly able to test the durability and usefulness of a made item and explain what the results show.",
        },
        {
          id: 2,
          title: "Refine tool and material choices after testing",
          meaning:
            "Use what the test showed to decide whether a different tool, join, or material would improve the result.",
          skillFocus: "refinement of making choices",
          practiceActivity:
            "After testing, compare whether changing the join, thickness, tool, or finish would make the product work better.",
          evidenceExamples: [
            "a refinement note linked to testing",
            "a learner explanation of a better tool or material choice",
            "a parent note about improvement decisions",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of process, safety, and production choices.",
          reportLanguage:
            "The learner is beginning to refine making decisions more thoughtfully after testing and can explain why a different choice may improve the product.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens evaluation of safety, function, finish, and process so making choices become more deliberate and evidence-based.",
      steps: [
        {
          id: 1,
          title: "Evaluate materials, tools, and methods against criteria",
          meaning:
            "Compare how well different materials, tools, or methods support safety, durability, neatness, or efficiency.",
          skillFocus: "criteria-based making evaluation",
          practiceActivity:
            "Compare two methods or material choices for a project and discuss which one better meets the set criteria.",
          evidenceExamples: [
            "a materials-or-tools evaluation table",
            "a learner explanation of the stronger method",
            "a parent note from a reflective making discussion",
          ],
          nextStep:
            "Use criteria-based evaluation to support later comparison of wider production choices and sustainability.",
          reportLanguage:
            "The learner is increasingly able to evaluate materials, tools, and methods against clear criteria such as safety, function, and durability.",
        },
        {
          id: 2,
          title: "Improve the making process as well as the product",
          meaning:
            "Notice that better planning, measuring, ordering, or setup can improve the final result as much as changing the design itself.",
          skillFocus: "process improvement",
          practiceActivity:
            "Review a making project and decide what process change would make the next version safer, quicker, or more accurate.",
          evidenceExamples: [
            "a process-improvement reflection",
            "a learner explanation of what should change next time",
            "a parent note about workflow or tool setup improvements",
          ],
          nextStep:
            "Build toward later consolidation where making responses are compared more critically across use, process, and impact.",
          reportLanguage:
            "The learner is developing stronger awareness that improving the making process can improve both product quality and safe workflow.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together safe tool use, material reasoning, process quality, and clearer communication about making decisions and outcomes.",
      steps: [
        {
          id: 1,
          title: "Evaluate production choices more critically",
          meaning:
            "Compare materials, joins, tools, processes, and finishes and explain which combination best suits the product and constraints.",
          skillFocus: "critical production evaluation",
          practiceActivity:
            "Compare two finished items or making plans and decide which response offers the better balance of function, safety, finish, and durability.",
          evidenceExamples: [
            "a critical comparison of two production approaches",
            "a learner explanation of the stronger making response",
            "a parent note from a practical evaluation discussion",
          ],
          nextStep:
            "Use this evaluation habit across design, engineering, and later project work.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate production choices critically and explain which approach better suits the product and criteria.",
        },
        {
          id: 2,
          title: "Communicate making decisions and outcomes clearly",
          meaning:
            "Present how materials, tools, techniques, testing, and improvements shaped the final product.",
          skillFocus: "clear making communication",
          practiceActivity:
            "Create a making journal, display, report, or presentation that shows material choice, process, testing, and product outcome.",
          evidenceExamples: [
            "a making journal or presentation",
            "a learner explanation of how the item was produced and improved",
            "a visual summary of process and final function",
          ],
          nextStep:
            "These habits continue to support strong portfolio evidence, reporting, and safe practical making.",
          reportLanguage:
            "The learner is strengthening the ability to communicate making decisions clearly, showing how materials, tools, testing, and improvements shaped the final result.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early material or tool-use example, one mid-stage test of function or durability, and one later evaluation of production choices so making growth is visible.",
    "Photos, material tests, safety reflections, process notes, and learner explanations often make stronger portfolio evidence than a finished object alone.",
    "A portfolio becomes stronger when it shows how the learner moved from exploring materials into choosing, testing, refining, and explaining making decisions.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in material choice, safe tool use, making technique, testing, and evaluation rather than only describing the final product.",
    "Examples are strongest when the learner explains why a material or technique was chosen and what testing revealed about durability or function.",
    "Collected evidence can show a clear shift from simple joining and shaping into more deliberate process and production reasoning.",
  ],
};

const FOOD_FIBRE_AND_PRACTICAL_TECHNOLOGIES: TechnologiesStrandConfig = {
  key: "food-fibre-and-practical-technologies",
  title: "Food, fibre and practical technologies",
  subtitle:
    "Food, fibre and practical technologies helps learners explore food preparation, textiles, growing materials, safety, sustainability, and practical life skills. It grows from early care and routine into more thoughtful planning, production, and explanation of how useful items and processes are created.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on practical routines, health, making, and observation. It connects to sustainability, production processes, family life skills, and thoughtful choices about food, fibre, and everyday resources.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early practical technologies begins with food routines, simple care, and noticing where familiar food or fibres come from.",
      steps: [
        {
          id: 1,
          title: "Notice where food and useful materials come from",
          meaning:
            "Recognise that some foods and fibres grow, are made, or come from plants, animals, and practical production processes.",
          skillFocus: "early production awareness",
          practiceActivity:
            "Talk about fruit, vegetables, bread, wool, cotton, or everyday fabrics and where they may have come from.",
          evidenceExamples: [
            "a food-or-fibre matching page",
            "a learner explanation of where one item comes from",
            "a parent note from a practical life discussion",
          ],
          nextStep:
            "Build from noticing origins into simple preparation, care, and safe routines.",
          reportLanguage:
            "The learner is beginning to notice that food and useful materials come from different sources and production processes.",
        },
        {
          id: 2,
          title: "Use simple food or making routines safely with support",
          meaning:
            "Practise washing, sorting, mixing, laying out, or handling simple materials with calm adult guidance.",
          skillFocus: "early safe practical routines",
          practiceActivity:
            "Wash produce, stir ingredients, sort textiles, plant seeds, or set up a simple practical task with an adult nearby.",
          evidenceExamples: [
            "a parent note about safe practical habits",
            "a photo of a food or fibre task",
            "a learner explanation of one safety routine",
          ],
          nextStep:
            "Carry this into lower-primary preparation, making, and simple quality choices.",
          reportLanguage:
            "The learner is developing early safe routines for practical food and making tasks and can explain simple care steps with support.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin preparing simple food or fibre tasks more independently while noticing hygiene, care, and how steps affect outcomes.",
      steps: [
        {
          id: 1,
          title: "Prepare a simple food or fibre task in sequence",
          meaning:
            "Follow a short practical process such as preparing a snack, growing a plant, or making a simple textile item.",
          skillFocus: "sequenced practical production",
          practiceActivity:
            "Make a simple healthy snack, plant seeds, weave a small item, or complete a basic textile task using clear steps.",
          evidenceExamples: [
            "a photo sequence of the task",
            "a learner explanation of the steps used",
            "a parent note about practical independence",
          ],
          nextStep:
            "Use sequence awareness to support planning, quality, and improvement later.",
          reportLanguage:
            "The learner is increasingly able to follow a simple practical sequence for food or fibre tasks and explain what each step does.",
        },
        {
          id: 2,
          title: "Explain simple safety, hygiene, and care choices",
          meaning:
            "Understand why washing, storing, handling, and safe use matter during practical tasks.",
          skillFocus: "practical safety and care",
          practiceActivity:
            "Discuss handwashing, safe storage, using blunt tools carefully, and looking after fabrics, plants, or ingredients.",
          evidenceExamples: [
            "a learner explanation of one hygiene or care choice",
            "a parent note about safe food or fibre routines",
            "a simple practical-safety checklist",
          ],
          nextStep:
            "Carry this into middle-primary planning, quality checks, and sustainability thinking.",
          reportLanguage:
            "The learner is building awareness of practical safety, hygiene, and care and can increasingly explain why these choices matter.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens planning, ingredient or material choice, sustainability awareness, and explanation of how a practical process works.",
      steps: [
        {
          id: 1,
          title: "Plan a practical task using ingredients or materials deliberately",
          meaning:
            "Think ahead about what is needed, what order makes sense, and what quality or function the finished result should have.",
          skillFocus: "planned production",
          practiceActivity:
            "Plan a recipe, planting task, simple sewn item, or household project and decide what needs to be prepared first.",
          evidenceExamples: [
            "a practical plan or ingredient/material list",
            "a learner explanation of why steps were ordered that way",
            "a parent summary of planning discussion",
          ],
          nextStep:
            "Use planning to support better quality control and more thoughtful material or food choices.",
          reportLanguage:
            "The learner is increasingly able to plan practical food or fibre tasks and explain how preparation supports a stronger outcome.",
        },
        {
          id: 2,
          title: "Discuss quality, waste, and sustainability in simple ways",
          meaning:
            "Notice that practical choices can affect waste, re-use, freshness, quality, or long-term usefulness.",
          skillFocus: "sustainability and quality awareness",
          practiceActivity:
            "Compare packaging, leftovers, fabric scraps, garden choices, or material reuse and discuss which option seems more practical or less wasteful.",
          evidenceExamples: [
            "a waste-or-quality comparison",
            "a learner reflection on a more sustainable choice",
            "a parent note from a practical sustainability discussion",
          ],
          nextStep:
            "Carry this into upper-primary evaluation of process quality and practical improvement.",
          reportLanguage:
            "The learner is beginning to notice how practical choices can affect quality, waste, and sustainability in everyday tasks.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin evaluating practical processes more carefully and adapting food or fibre choices to purpose, quality, and context.",
      steps: [
        {
          id: 1,
          title: "Adapt a practical task for a clearer purpose",
          meaning:
            "Adjust ingredients, materials, or steps so a task better suits who it is for or what it needs to achieve.",
          skillFocus: "purposeful adaptation",
          practiceActivity:
            "Adapt a recipe, planting plan, repair, or textile task for serving size, climate, user need, available materials, or storage.",
          evidenceExamples: [
            "an adapted recipe or plan",
            "a learner explanation of why a practical change was made",
            "a parent note about purposeful adjustment",
          ],
          nextStep:
            "Use adaptation to support lower-secondary evaluation of production choices, sourcing, and practical trade-offs.",
          reportLanguage:
            "The learner is increasingly able to adapt practical food or fibre tasks to suit purpose, context, and user needs.",
        },
        {
          id: 2,
          title: "Evaluate quality and usefulness after making",
          meaning:
            "Test whether the product or process worked well and explain what should be improved next time.",
          skillFocus: "quality evaluation and improvement",
          practiceActivity:
            "Taste, wear, use, store, or review the result and discuss what made it successful or what should change next time.",
          evidenceExamples: [
            "a quality reflection after making",
            "a learner explanation of one practical improvement",
            "a parent summary of a post-task discussion",
          ],
          nextStep:
            "Carry this into lower-secondary reasoning about sourcing, efficiency, and production impact.",
          reportLanguage:
            "The learner is beginning to evaluate practical outcomes more thoughtfully and explain how a product or process could be improved.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens evaluation of sourcing, process, sustainability, and how practical technology choices affect usefulness and impact.",
      steps: [
        {
          id: 1,
          title: "Use evidence to compare practical production choices",
          meaning:
            "Look at source, cost, waste, nutrition, durability, or practicality when deciding between options.",
          skillFocus: "evidence-based practical choice",
          practiceActivity:
            "Compare two ingredients, fabrics, garden options, or production plans and explain which choice best fits the task and why.",
          evidenceExamples: [
            "a comparison of practical options",
            "a learner explanation using more than one criterion",
            "a parent note from a practical decision discussion",
          ],
          nextStep:
            "Use comparison skills to support later evaluation of broader production systems and trade-offs.",
          reportLanguage:
            "The learner is increasingly able to compare practical production choices using evidence about quality, usefulness, and sustainability.",
        },
        {
          id: 2,
          title: "Explain how process decisions affect outcomes",
          meaning:
            "Recognise that order, care, timing, storage, preparation, and clean-up all affect the final result.",
          skillFocus: "process-effect reasoning",
          practiceActivity:
            "Review a practical task and identify which process decisions improved or weakened safety, quality, or efficiency.",
          evidenceExamples: [
            "a process review note",
            "a learner explanation of how one decision changed the outcome",
            "a parent summary of a practical reflection discussion",
          ],
          nextStep:
            "Build toward later consolidation where practical systems and responses are compared more critically.",
          reportLanguage:
            "The learner is developing stronger understanding of how process decisions affect the safety, quality, and success of practical technologies work.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together sourcing, sustainability, quality, production choices, and clearer communication about practical technologies outcomes.",
      steps: [
        {
          id: 1,
          title: "Evaluate food, fibre, or practical solutions more critically",
          meaning:
            "Compare production choices and weigh which approach better meets needs for quality, sustainability, usefulness, or care.",
          skillFocus: "critical practical evaluation",
          practiceActivity:
            "Compare two practical responses such as food plans, textile choices, or garden approaches and explain which one is more sensible and why.",
          evidenceExamples: [
            "an evaluation of practical options",
            "a learner explanation of the stronger choice",
            "a parent note from a critical practical discussion",
          ],
          nextStep:
            "Use this evaluation habit across family life skills, sustainability learning, and later independent project work.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate practical technologies solutions critically and explain which option better balances quality, purpose, and sustainability.",
        },
        {
          id: 2,
          title: "Communicate practical process and reasoning clearly",
          meaning:
            "Present how a practical task was planned, carried out, reviewed, and improved in a way another person can follow.",
          skillFocus: "clear practical communication",
          practiceActivity:
            "Create a practical journal, display, recipe adaptation, process summary, or presentation showing what was made and why decisions mattered.",
          evidenceExamples: [
            "a practical technologies journal or presentation",
            "a learner explanation of process, choice, and improvement",
            "a visual summary of the task from planning to review",
          ],
          nextStep:
            "These habits continue to support life skills, reporting, and purposeful family learning beyond the strand itself.",
          reportLanguage:
            "The learner is strengthening the ability to communicate practical technologies work clearly, showing how planning, production, and reflection shaped the outcome.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early food or fibre routine example, one mid-stage planning task, and one later evidence-based evaluation so practical growth is visible over time.",
    "Photos, recipes, planting notes, care checklists, learner reflections, and process summaries often make strong evidence in this strand.",
    "A portfolio becomes stronger when it shows how the learner moved from simple routines into planning, adapting, evaluating, and communicating practical technologies work.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in safety, planning, practical production, sustainability awareness, and quality evaluation rather than only describing what was made or prepared.",
    "Examples are strongest when the learner explains why a practical choice was made and how the process affected the final outcome.",
    "Collected evidence can show a clear shift from guided practical routines into more independent and thoughtful production reasoning.",
  ],
};

const ENGINEERING_SYSTEMS_AND_PROBLEM_SOLVING: TechnologiesStrandConfig = {
  key: "engineering-systems-and-problem-solving",
  title: "Engineering, systems and problem-solving",
  subtitle:
    "Engineering, systems and problem-solving helps learners investigate structures, mechanisms, systems, prototypes, testing, and real-world constraints. It grows from playful building into more thoughtful analysis, iteration, and evidence-based improvement of practical solutions.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on design, making, measurement, and science. It applies science, mathematics, design, and testing to solve real-world problems more purposefully.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early engineering begins with building, balancing, joining, and noticing how parts work together in playful structures or moving creations.",
      steps: [
        {
          id: 1,
          title: "Build simple structures and see what helps them stand",
          meaning:
            "Notice that shape, balance, and joining affect whether something stays up or falls over.",
          skillFocus: "early structure awareness",
          practiceActivity:
            "Build towers, bridges, marble runs, or simple structures from blocks, recycled materials, or craft items and test what helps them hold.",
          evidenceExamples: [
            "a photo of a structure test",
            "a learner explanation of what made it stand or fall",
            "a parent note about a building discussion",
          ],
          nextStep:
            "Build from playful structure testing into simple mechanisms and purposeful improvement.",
          reportLanguage:
            "The learner is beginning to explore simple structures and can describe some factors that help a build stand or hold together.",
        },
        {
          id: 2,
          title: "Notice that parts in a simple system work together",
          meaning:
            "See that one part can affect how another part moves or functions in a small build or setup.",
          skillFocus: "early systems awareness",
          practiceActivity:
            "Use ramps, levers, ball runs, wheels, or pop-up models and talk about what each part is doing.",
          evidenceExamples: [
            "a drawing of a simple system",
            "a learner explanation of how one part helped another",
            "a parent note from a mechanism discussion",
          ],
          nextStep:
            "Carry this into lower-primary work on mechanism changes and testing small solutions.",
          reportLanguage:
            "The learner is developing early awareness that parts in a simple system work together and affect what happens next.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin changing structures or mechanisms deliberately and seeing how testing helps improve a practical build.",
      steps: [
        {
          id: 1,
          title: "Test a structure or mechanism and change one thing",
          meaning:
            "Use a simple test to see whether a build works and then improve one part to make it stronger or smoother.",
          skillFocus: "early engineering testing",
          practiceActivity:
            "Test a bridge, rolling toy, pulley idea, or ramp and change one feature such as length, support, or angle.",
          evidenceExamples: [
            "before-and-after build photos",
            "a learner explanation of the change made",
            "a parent note about what the test revealed",
          ],
          nextStep:
            "Use testing and change to support clearer explanation of force, support, and movement.",
          reportLanguage:
            "The learner is beginning to test simple engineering builds and can explain how changing one part improved the result.",
        },
        {
          id: 2,
          title: "Explain how a simple mechanism helps solve a problem",
          meaning:
            "Recognise that ramps, wheels, levers, or moving parts can make a task easier or more effective.",
          skillFocus: "mechanism purpose and function",
          practiceActivity:
            "Use a simple machine or moving build and discuss what job it helps perform more easily.",
          evidenceExamples: [
            "a mechanism explanation page",
            "a learner explanation of what the mechanism helped do",
            "a parent summary of a practical problem-solving discussion",
          ],
          nextStep:
            "Carry this into middle-primary prototypes, constraints, and solution planning.",
          reportLanguage:
            "The learner is increasingly able to explain how a simple mechanism can help solve a practical problem.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary engineering strengthens prototype planning, testing under constraints, and explaining how structure or mechanism choices affect performance.",
      steps: [
        {
          id: 1,
          title: "Plan and make a prototype for a small challenge",
          meaning:
            "Use a clear challenge and available materials to build a first version of a solution.",
          skillFocus: "prototype planning and construction",
          practiceActivity:
            "Build a bridge, protective container, launcher, moving toy, or load-bearing structure using limited materials.",
          evidenceExamples: [
            "a prototype plan or sketch",
            "a learner explanation of how the prototype was meant to work",
            "a parent note about meeting the challenge conditions",
          ],
          nextStep:
            "Use prototype planning to support stronger testing and iteration decisions.",
          reportLanguage:
            "The learner is increasingly able to plan and build a simple prototype for a practical engineering challenge.",
        },
        {
          id: 2,
          title: "Use test results to improve structure or movement",
          meaning:
            "Notice what failed, held, jammed, rolled, or balanced and use that evidence to improve the next version.",
          skillFocus: "evidence-based prototype improvement",
          practiceActivity:
            "Test a prototype several times and change support, spacing, angle, join, or moving part based on the results.",
          evidenceExamples: [
            "prototype test notes",
            "a learner explanation of an improvement choice",
            "a comparison of earlier and improved versions",
          ],
          nextStep:
            "Carry this into upper-primary systems analysis, criteria, and more deliberate evaluation.",
          reportLanguage:
            "The learner is beginning to use test results more deliberately to improve prototypes and explain why a structural or movement change helped.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin using clearer criteria, system thinking, and functional testing to judge whether a prototype or mechanism truly meets the challenge.",
      steps: [
        {
          id: 1,
          title: "Explain how parts of a system affect the whole result",
          meaning:
            "Understand that one weak or strong part can change how the full design performs.",
          skillFocus: "system interaction in engineering",
          practiceActivity:
            "Review a mechanism, load-bearing structure, or moving design and identify which parts most affected the outcome.",
          evidenceExamples: [
            "a labelled systems diagram",
            "a learner explanation of how parts interacted",
            "a parent note from an engineering discussion",
          ],
          nextStep:
            "Use system interaction thinking to support lower-secondary analysis of constraints and trade-offs.",
          reportLanguage:
            "The learner is increasingly able to explain how parts of an engineering system affect the whole design outcome.",
        },
        {
          id: 2,
          title: "Test a design against criteria and improve it",
          meaning:
            "Use success points such as strength, movement, fit, or efficiency to judge whether the solution worked well enough.",
          skillFocus: "criteria-based engineering testing",
          practiceActivity:
            "Set criteria for a prototype, test it, and decide which change would most improve the final performance.",
          evidenceExamples: [
            "a criteria-and-test record",
            "a learner explanation of which criterion was not yet met",
            "a parent summary of a design refinement discussion",
          ],
          nextStep:
            "Carry this into lower-secondary engineering trade-offs, optimisation, and system evaluation.",
          reportLanguage:
            "The learner is beginning to use criteria more deliberately when testing and improving engineering solutions.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens analysis of constraints, trade-offs, systems, and more deliberate use of testing to refine engineering responses.",
      steps: [
        {
          id: 1,
          title: "Analyse engineering constraints and trade-offs",
          meaning:
            "Recognise that strength, cost, size, safety, materials, and time can all affect what solution is realistic.",
          skillFocus: "constraints and engineering trade-offs",
          practiceActivity:
            "Review a design challenge and explain how different constraints changed what could be built or improved.",
          evidenceExamples: [
            "a constraints-and-trade-offs note",
            "a learner explanation of a design compromise",
            "a parent summary of engineering reasoning discussion",
          ],
          nextStep:
            "Use constraint analysis to support more systematic prototype optimisation.",
          reportLanguage:
            "The learner is increasingly able to analyse engineering constraints and explain how trade-offs shape design decisions.",
        },
        {
          id: 2,
          title: "Refine a prototype using structured testing",
          meaning:
            "Use repeatable testing and evidence to improve performance rather than relying only on guesswork.",
          skillFocus: "structured prototype refinement",
          practiceActivity:
            "Run repeated tests on a prototype, record the results, and decide which change best improves strength, movement, or efficiency.",
          evidenceExamples: [
            "a structured test record",
            "a learner explanation of the best improvement decision",
            "a comparison of prototype versions linked to results",
          ],
          nextStep:
            "Build toward later consolidation where engineering responses are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger engineering habits by refining prototypes through structured testing and evidence-based improvement.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together systems thinking, constraints, testing, optimisation, and clearer communication about engineering responses to real problems.",
      steps: [
        {
          id: 1,
          title: "Evaluate engineering responses to a real problem",
          meaning:
            "Compare two solutions and explain which one better balances function, constraints, safety, and performance.",
          skillFocus: "critical engineering evaluation",
          practiceActivity:
            "Compare two structures, systems, or prototype responses and explain which is the stronger solution and why.",
          evidenceExamples: [
            "an engineering comparison evaluation",
            "a learner explanation of the better response",
            "a parent note from a critical engineering discussion",
          ],
          nextStep:
            "Use this evaluation habit across future technologies projects, interdisciplinary design work, and portfolio reporting.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate engineering responses critically and explain which solution better fits the problem and constraints.",
        },
        {
          id: 2,
          title: "Communicate engineering reasoning clearly",
          meaning:
            "Present the problem, system, tests, improvements, and final reasoning so another person can understand the design logic.",
          skillFocus: "clear engineering communication",
          practiceActivity:
            "Create a design report, diagram, prototype summary, or presentation showing how a system or solution was tested and improved.",
          evidenceExamples: [
            "an engineering report or presentation",
            "a learner explanation connecting constraints, tests, and outcomes",
            "a visual summary of problem, prototype, and improvement",
          ],
          nextStep:
            "These habits continue to support strong evidence capture, reporting, and practical systems problem-solving.",
          reportLanguage:
            "The learner is strengthening the ability to communicate engineering reasoning clearly, showing how testing and evidence shaped the final solution.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early structure or mechanism example, one prototype test record, and one later engineering evaluation so problem-solving growth is visible over time.",
    "Photos of builds, system diagrams, prototype notes, and learner explanations often make strong engineering evidence in a homeschool portfolio.",
    "A portfolio becomes stronger when it shows how the learner moved from playful building into structured testing, constraints thinking, and clearer system reasoning.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in problem-solving, structure, testing, system thinking, and refinement rather than only describing the final prototype.",
    "Examples are strongest when the learner explains the challenge, the prototype response, what testing showed, and why an improvement was chosen.",
    "Collected evidence can show a clear shift from exploratory building into more mature engineering reasoning and communication.",
  ],
};

const TECHNOLOGIES_STRAND_CONFIGS: TechnologiesStrandConfig[] = [
  DESIGN_AND_PRODUCTION,
  DIGITAL_TECHNOLOGIES_AND_SYSTEMS,
  COMPUTATIONAL_THINKING,
  MATERIALS_TOOLS_AND_MAKING,
  FOOD_FIBRE_AND_PRACTICAL_TECHNOLOGIES,
  ENGINEERING_SYSTEMS_AND_PROBLEM_SOLVING,
];

export const TECHNOLOGIES_STRAND_WORKSPACE_BUILDERS: Record<string, StrandBuilder> =
  Object.fromEntries(
    TECHNOLOGIES_STRAND_CONFIGS.map((config) => [
      config.key,
      (currentFocusStageKey: PathwayStageKey) =>
        buildTechnologiesWorkspace(currentFocusStageKey, config),
    ]),
  );

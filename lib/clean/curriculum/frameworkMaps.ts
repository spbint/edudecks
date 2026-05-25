import {
  BRENT_COUNTRY_LABEL,
  BRENT_LOCAL_AUTHORITY_LABEL,
  BRENT_REPORTING_PATHWAY_LABEL,
  getAuthorityDisplayValues,
  isBrentAuthorityTemplateActive,
} from "@/lib/clean/authority/brent";
import type { FamilyProfile } from "@/lib/clean/family/types";

export type CurriculumFrameworkElement = {
  key: string;
  label: string;
  shortDescription: string;
  keywords: string[];
  legacyKeys?: string[];
  legacyLabels?: string[];
};

export type CurriculumFrameworkLearningArea = {
  key: string;
  label: string;
  shortDescription: string;
  keywords: string[];
  elements: CurriculumFrameworkElement[];
  legacyKeys?: string[];
  legacyLabels?: string[];
};

export type CurriculumFrameworkEvidenceArea = {
  key: string;
  label: string;
  shortDescription: string;
  keywords: string[];
  legacyKeys?: string[];
  legacyLabels?: string[];
};

export type CurriculumFrameworkMap = {
  frameworkKey: string;
  frameworkLabel: string;
  countryLabel: string;
  description: string;
  mapTypeLabel: string;
  learningAreas: CurriculumFrameworkLearningArea[];
  reportingEvidenceAreas?: CurriculumFrameworkEvidenceArea[];
  authorityEvidenceAreas?: CurriculumFrameworkEvidenceArea[];
};

export type ResolvedCurriculumFrameworkMap = {
  map: CurriculumFrameworkMap;
  authorityOverlayActive: boolean;
  frameworkDisplayLabel: string;
  countryAuthorityLabel: string;
  mapTypeLabel: string;
  helperCopy: string;
  settingsHint: string;
  supplementarySectionTitle: string;
  supplementarySectionCopy: string;
  supplementaryEvidenceAreas: CurriculumFrameworkEvidenceArea[];
  supplementaryMetricLabel: string;
  supplementaryMetricCopy: string;
  brentContextCard:
    | {
        title: string;
        copy: string;
      }
    | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

const commonEnglishElements: CurriculumFrameworkElement[] = [
  {
    key: "reading-comprehension",
    label: "Reading comprehension",
    shortDescription: "Understanding what has been read and talking about the meaning.",
    keywords: ["reading", "read", "comprehension", "book", "story", "novel"],
  },
  {
    key: "writing-sentences-and-paragraphs",
    label: "Writing sentences and paragraphs",
    shortDescription: "Turning ideas into clear sentences, short responses, and longer pieces.",
    keywords: ["writing", "sentence", "paragraph", "journal", "response", "essay"],
  },
  {
    key: "spelling-and-vocabulary",
    label: "Spelling and vocabulary",
    shortDescription: "Growing confidence with words, spelling patterns, and word meaning.",
    keywords: ["spelling", "vocabulary", "word study", "phonics", "dictionary"],
  },
  {
    key: "speaking-and-listening",
    label: "Speaking and listening",
    shortDescription: "Explaining ideas, listening carefully, and joining discussion.",
    keywords: ["discussion", "speaking", "listening", "presentation", "conversation"],
  },
  {
    key: "text-response",
    label: "Text response",
    shortDescription: "Responding to stories, information texts, and media in a thoughtful way.",
    keywords: ["text response", "response", "character", "theme", "author"],
  },
];

const australianFrameworkMap: CurriculumFrameworkMap = {
  frameworkKey: "australian-curriculum",
  frameworkLabel: "Australian Curriculum",
  countryLabel: "Australia",
  description:
    "A broad Australian learning map that helps families connect everyday evidence to familiar curriculum areas.",
  mapTypeLabel: "Broad learning-area coverage",
  learningAreas: [
    {
      key: "english",
      label: "English",
      shortDescription: "Reading, writing, discussion, and making sense of texts over time.",
      keywords: ["english", "literacy", "reading", "writing", "spelling", "vocabulary"],
      elements: commonEnglishElements,
    },
    {
      key: "mathematics",
      label: "Mathematics",
      shortDescription: "Number sense, patterns, problem solving, and using maths in everyday life.",
      keywords: ["mathematics", "maths", "math", "numeracy", "number", "calculation"],
      legacyLabels: ["Math"],
      elements: [
        {
          key: "number-and-place-value",
          label: "Number and place value",
          shortDescription: "Understanding how numbers work and how they are built.",
          keywords: ["number", "place value", "digit", "counting", "numeracy"],
        },
        {
          key: "addition-and-subtraction",
          label: "Addition and subtraction",
          shortDescription: "Using addition and subtraction with confidence in practical situations.",
          keywords: ["addition", "subtraction", "add", "subtract", "sum", "difference"],
        },
        {
          key: "multiplication-and-division",
          label: "Multiplication and division",
          shortDescription: "Grouping, sharing, and building fluency with multiplication ideas.",
          keywords: ["multiplication", "division", "times tables", "grouping", "sharing"],
        },
        {
          key: "fractions",
          label: "Fractions",
          shortDescription: "Working with parts, wholes, and equal sharing.",
          keywords: ["fraction", "half", "quarter", "third", "decimal"],
        },
        {
          key: "measurement",
          label: "Measurement",
          shortDescription: "Using length, time, money, mass, and capacity meaningfully.",
          keywords: ["measurement", "measure", "time", "money", "length", "mass", "capacity"],
        },
        {
          key: "shape-and-geometry",
          label: "Shape and geometry",
          shortDescription: "Recognising shape, space, direction, and position.",
          keywords: ["shape", "geometry", "angle", "space", "position", "pattern block"],
        },
        {
          key: "statistics-and-data",
          label: "Statistics and data",
          shortDescription: "Collecting information, sorting it, and talking about what it shows.",
          keywords: ["data", "graph", "statistics", "survey", "chart", "table"],
        },
      ],
    },
    {
      key: "science",
      label: "Science",
      shortDescription: "Curiosity, investigation, observation, and understanding how the world works.",
      keywords: ["science", "experiment", "investigation", "hypothesis", "observation"],
      elements: [
        {
          key: "scientific-investigation",
          label: "Scientific investigation",
          shortDescription: "Asking questions, testing ideas, and noticing patterns in results.",
          keywords: ["investigation", "experiment", "hypothesis", "observe", "observation"],
        },
        {
          key: "living-things",
          label: "Living things",
          shortDescription: "Exploring plants, animals, habitats, and how living things grow.",
          keywords: ["living things", "animal", "plant", "habitat", "life cycle", "biology"],
        },
        {
          key: "materials",
          label: "Materials",
          shortDescription: "Comparing materials and noticing their properties and uses.",
          keywords: ["material", "property", "solid", "liquid", "gas", "matter"],
        },
        {
          key: "forces-and-motion",
          label: "Forces and motion",
          shortDescription: "Looking at movement, pushes, pulls, and how things change direction.",
          keywords: ["force", "motion", "push", "pull", "speed", "gravity"],
        },
        {
          key: "earth-and-space",
          label: "Earth and space",
          shortDescription: "Learning about weather, seasons, the Earth, and the wider universe.",
          keywords: ["earth", "space", "planet", "weather", "season", "solar system"],
        },
      ],
    },
    {
      key: "humanities-and-social-sciences",
      label: "Humanities and Social Sciences",
      shortDescription: "History, geography, inquiry, and understanding community life.",
      keywords: ["history", "geography", "hass", "humanities", "social science", "civics", "community"],
      elements: [
        {
          key: "history",
          label: "History",
          shortDescription: "Looking at past people, events, and changes over time.",
          keywords: ["history", "historical", "timeline", "past", "event"],
        },
        {
          key: "geography",
          label: "Geography",
          shortDescription: "Exploring places, environments, and where people live.",
          keywords: ["geography", "map", "place", "environment", "landscape"],
        },
        {
          key: "civics-and-citizenship",
          label: "Civics and citizenship",
          shortDescription: "Understanding fairness, responsibility, and community life.",
          keywords: ["civics", "citizenship", "government", "community", "responsibility"],
        },
        {
          key: "economics-and-business",
          label: "Economics and business",
          shortDescription: "Money, choices, work, and how everyday systems function.",
          keywords: ["economics", "business", "money", "budget", "enterprise"],
        },
        {
          key: "local-community-studies",
          label: "Local community studies",
          shortDescription: "Noticing how the local area works and who helps it run.",
          keywords: ["community", "local area", "neighbourhood", "services", "council"],
        },
      ],
    },
    {
      key: "the-arts",
      label: "The Arts",
      shortDescription: "Creative expression through visual art, music, drama, dance, and making.",
      keywords: ["art", "arts", "music", "drama", "dance", "drawing", "painting", "craft"],
      legacyKeys: ["art-and-design", "music"],
      elements: [
        {
          key: "visual-arts",
          label: "Visual arts",
          shortDescription: "Drawing, painting, collage, sculpture, and visual response.",
          keywords: ["visual art", "drawing", "painting", "sculpture", "sketch"],
        },
        {
          key: "music",
          label: "Music",
          shortDescription: "Listening, performing, rhythm, and creating with sound.",
          keywords: ["music", "rhythm", "singing", "instrument", "composition"],
        },
        {
          key: "drama",
          label: "Drama",
          shortDescription: "Role play, storytelling, and performance.",
          keywords: ["drama", "performance", "role play", "theatre", "script"],
        },
        {
          key: "dance",
          label: "Dance",
          shortDescription: "Movement, timing, expression, and response through dance.",
          keywords: ["dance", "movement", "choreography", "performance"],
        },
        {
          key: "media-arts",
          label: "Media arts",
          shortDescription: "Creating and responding to images, film, and digital media.",
          keywords: ["media", "film", "video", "photography", "digital story"],
        },
      ],
    },
    {
      key: "technologies",
      label: "Technologies",
      shortDescription: "Design thinking, digital tools, coding, and practical making.",
      keywords: ["technology", "technologies", "computing", "digital", "coding", "robotics", "design"],
      legacyKeys: ["technologies-computing"],
      legacyLabels: ["Technologies / Computing"],
      elements: [
        {
          key: "design-and-technologies",
          label: "Design and technologies",
          shortDescription: "Planning, making, testing, and improving practical designs.",
          keywords: ["design", "make", "prototype", "plan", "build"],
        },
        {
          key: "digital-technologies",
          label: "Digital technologies",
          shortDescription: "Using digital tools, devices, and systems thoughtfully.",
          keywords: ["digital", "computer", "technology", "device", "app"],
        },
        {
          key: "practical-design-projects",
          label: "Practical design projects",
          shortDescription: "Hands-on making projects that solve a real problem.",
          keywords: ["project", "design challenge", "prototype", "maker", "build"],
        },
        {
          key: "safe-tool-use",
          label: "Safe tool use",
          shortDescription: "Using tools, materials, and equipment safely and confidently.",
          keywords: ["tool use", "safety", "equipment", "materials", "workshop"],
        },
        {
          key: "problem-solving",
          label: "Problem solving",
          shortDescription: "Trying ideas, improving them, and learning from setbacks.",
          keywords: ["problem solving", "debug", "improve", "strategy", "challenge"],
        },
      ],
    },
    {
      key: "health-and-physical-education",
      label: "Health and Physical Education",
      shortDescription: "Movement, wellbeing, healthy habits, and staying active.",
      keywords: ["health", "physical", "pe", "sport", "movement", "wellbeing", "exercise"],
      elements: [
        {
          key: "movement-and-physical-activity",
          label: "Movement and physical activity",
          shortDescription: "Building confidence through active movement and exercise.",
          keywords: ["movement", "physical activity", "sport", "exercise", "fitness"],
        },
        {
          key: "health-and-wellbeing",
          label: "Health and wellbeing",
          shortDescription: "Caring for health, routines, and emotional wellbeing.",
          keywords: ["health", "wellbeing", "sleep", "nutrition", "mental health"],
        },
        {
          key: "personal-safety",
          label: "Personal safety",
          shortDescription: "Learning how to stay safe and make safe choices.",
          keywords: ["safety", "personal safety", "safe choices", "emergency"],
        },
        {
          key: "teamwork-and-play",
          label: "Teamwork and play",
          shortDescription: "Working with others, taking turns, and learning through play.",
          keywords: ["teamwork", "play", "cooperation", "game", "turn taking"],
        },
        {
          key: "outdoor-learning",
          label: "Outdoor learning",
          shortDescription: "Using outdoor experiences to support health and movement.",
          keywords: ["outdoor", "bushwalk", "nature play", "camp", "hike"],
        },
      ],
    },
    {
      key: "languages",
      label: "Languages",
      shortDescription: "Listening, speaking, reading, and writing in another language.",
      keywords: ["language", "languages", "french", "spanish", "japanese", "latin", "german"],
      elements: [
        {
          key: "listening-and-speaking",
          label: "Listening and speaking",
          shortDescription: "Hearing and using new words, phrases, and sounds.",
          keywords: ["listening", "speaking", "conversation", "pronunciation"],
        },
        {
          key: "reading-and-viewing",
          label: "Reading and viewing",
          shortDescription: "Reading simple texts, images, and language prompts.",
          keywords: ["reading", "viewing", "text", "picture book", "caption"],
        },
        {
          key: "writing-and-responding",
          label: "Writing and responding",
          shortDescription: "Writing words, phrases, and short responses in another language.",
          keywords: ["writing", "responding", "sentence", "translation"],
        },
        {
          key: "cultural-understanding",
          label: "Cultural understanding",
          shortDescription: "Exploring the people, places, and customs connected to language.",
          keywords: ["culture", "cultural", "custom", "tradition", "country"],
        },
      ],
    },
    {
      key: "life-skills-practical-learning",
      label: "Life Skills / Practical Learning",
      shortDescription: "Daily living, independence, practical tasks, and real-life learning.",
      keywords: ["life skills", "practical", "cooking", "baking", "money", "chores", "garden", "independence"],
      elements: [
        {
          key: "cooking",
          label: "Cooking",
          shortDescription: "Preparing food, following recipes, and building kitchen confidence.",
          keywords: ["cooking", "baking", "recipe", "kitchen", "meal"],
        },
        {
          key: "gardening",
          label: "Gardening",
          shortDescription: "Growing, caring for plants, and working in outdoor spaces.",
          keywords: ["gardening", "garden", "planting", "compost", "harvest"],
        },
        {
          key: "money-and-budgeting",
          label: "Money and budgeting",
          shortDescription: "Using money, planning purchases, and understanding budgets.",
          keywords: ["money", "budget", "shopping", "cost", "saving"],
        },
        {
          key: "travel-and-community-access",
          label: "Travel and community access",
          shortDescription: "Navigating local places, transport, and community routines.",
          keywords: ["travel", "bus", "train", "community", "local outing"],
        },
        {
          key: "daily-routines-and-independence",
          label: "Daily routines and independence",
          shortDescription: "Building self-management, routines, and everyday independence.",
          keywords: ["routine", "independence", "self care", "daily living", "chores"],
        },
      ],
    },
  ],
  reportingEvidenceAreas: [
    {
      key: "learning-plan-coverage",
      label: "Learning plan coverage",
      shortDescription: "How the planned learning rhythm and intentions are being covered.",
      keywords: ["learning plan", "coverage", "plan", "rhythm", "schedule"],
    },
    {
      key: "implementation-evidence",
      label: "Implementation evidence",
      shortDescription: "What the family actually used and did through the learning period.",
      keywords: ["implementation", "used", "completed", "activity", "lesson"],
    },
    {
      key: "progress-and-achievement",
      label: "Progress and achievement",
      shortDescription: "What the evidence is showing about growth over time.",
      keywords: ["progress", "achievement", "growth", "improvement", "milestone"],
    },
    {
      key: "annotated-work-sample",
      label: "Annotated work sample",
      shortDescription: "Samples of work with notes about what they show.",
      keywords: ["work sample", "annotation", "sample", "worksheet", "portfolio"],
    },
    {
      key: "resources-used",
      label: "Resources used",
      shortDescription: "Books, tools, materials, and programs used during learning.",
      keywords: ["resource", "book", "material", "program", "tool"],
    },
    {
      key: "learning-environment",
      label: "Learning environment",
      shortDescription: "How the home and wider environment supported learning.",
      keywords: ["environment", "home learning", "setup", "workspace", "routine"],
    },
    {
      key: "social-interaction",
      label: "Social interaction",
      shortDescription: "Group experiences, community learning, and interaction with others.",
      keywords: ["social", "group", "interaction", "community", "friend"],
    },
    {
      key: "review-notes-next-steps",
      label: "Review notes / next steps",
      shortDescription: "What to keep building, adjust, or revisit next.",
      keywords: ["review", "next step", "plan", "adjust", "future"],
    },
  ],
};

const ukFrameworkMap: CurriculumFrameworkMap = {
  frameworkKey: "uk-national-curriculum",
  frameworkLabel: "UK National Curriculum",
  countryLabel: "United Kingdom",
  description:
    "A broad subject map that reflects the main learning areas families often use when working with UK-style planning and reporting.",
  mapTypeLabel: "Broad subject coverage",
  learningAreas: [
    {
      key: "english",
      label: "English",
      shortDescription: "Reading, writing, discussion, and making sense of texts over time.",
      keywords: ["english", "literacy", "reading", "writing", "spelling", "vocabulary"],
      elements: commonEnglishElements,
    },
    {
      key: "mathematics",
      label: "Mathematics",
      shortDescription: "Number, fluency, reasoning, and solving practical maths problems.",
      keywords: ["mathematics", "maths", "math", "numeracy", "number", "calculation"],
      legacyLabels: ["Math"],
      elements: [
        {
          key: "number-and-place-value",
          label: "Number and place value",
          shortDescription: "Understanding number structure and value.",
          keywords: ["number", "place value", "digit", "counting", "numeracy"],
        },
        {
          key: "addition-and-subtraction",
          label: "Addition and subtraction",
          shortDescription: "Using addition and subtraction in practical and written ways.",
          keywords: ["addition", "subtraction", "add", "subtract", "sum", "difference"],
        },
        {
          key: "multiplication-and-division",
          label: "Multiplication and division",
          shortDescription: "Grouping, sharing, and using multiplication ideas with confidence.",
          keywords: ["multiplication", "division", "times tables", "grouping", "sharing"],
        },
        {
          key: "fractions",
          label: "Fractions",
          shortDescription: "Working with parts, wholes, and equivalent values.",
          keywords: ["fraction", "half", "quarter", "third", "decimal"],
        },
        {
          key: "measurement",
          label: "Measurement",
          shortDescription: "Using length, time, money, mass, and capacity meaningfully.",
          keywords: ["measurement", "measure", "time", "money", "length", "mass", "capacity"],
        },
        {
          key: "geometry",
          label: "Geometry",
          shortDescription: "Recognising shape, space, direction, and properties.",
          keywords: ["geometry", "shape", "angle", "position", "space"],
          legacyKeys: ["shape-and-geometry"],
          legacyLabels: ["Shape and geometry"],
        },
        {
          key: "statistics",
          label: "Statistics",
          shortDescription: "Collecting data, organising it, and talking about what it shows.",
          keywords: ["data", "graph", "statistics", "survey", "chart", "table"],
          legacyKeys: ["statistics-and-data"],
          legacyLabels: ["Statistics and data"],
        },
      ],
    },
    {
      key: "science",
      label: "Science",
      shortDescription: "Curiosity, investigation, and understanding how the world works.",
      keywords: ["science", "experiment", "investigation", "hypothesis", "observation"],
      elements: [
        {
          key: "working-scientifically",
          label: "Working scientifically",
          shortDescription: "Asking questions, testing ideas, and noticing patterns in results.",
          keywords: ["working scientifically", "investigation", "experiment", "hypothesis", "observe"],
          legacyKeys: ["scientific-investigation"],
          legacyLabels: ["Scientific investigation"],
        },
        {
          key: "plants-and-living-things",
          label: "Plants and living things",
          shortDescription: "Exploring living things, habitats, and how they grow.",
          keywords: ["plant", "living things", "animal", "habitat", "life cycle", "biology"],
          legacyKeys: ["living-things"],
          legacyLabels: ["Living things"],
        },
        {
          key: "materials",
          label: "Materials",
          shortDescription: "Comparing materials, their properties, and their uses.",
          keywords: ["material", "property", "solid", "liquid", "gas", "matter"],
        },
        {
          key: "forces",
          label: "Forces",
          shortDescription: "Looking at movement, pushes, pulls, and how things change.",
          keywords: ["force", "motion", "push", "pull", "speed", "gravity"],
          legacyKeys: ["forces-and-motion"],
          legacyLabels: ["Forces and motion"],
        },
        {
          key: "earth-and-space",
          label: "Earth and space",
          shortDescription: "Learning about weather, seasons, Earth, and the wider universe.",
          keywords: ["earth", "space", "planet", "weather", "season", "solar system"],
        },
      ],
    },
    {
      key: "computing",
      label: "Computing",
      shortDescription: "Digital literacy, online safety, and using technology to create and solve.",
      keywords: ["computing", "digital", "technology", "coding", "computer", "online safety"],
      legacyKeys: ["technologies-computing"],
      legacyLabels: ["Technologies / Computing"],
      elements: [
        {
          key: "digital-literacy",
          label: "Digital literacy",
          shortDescription: "Using digital tools with confidence and understanding.",
          keywords: ["digital literacy", "computer", "device", "technology", "software"],
        },
        {
          key: "online-safety",
          label: "Online safety",
          shortDescription: "Learning how to stay safe and thoughtful online.",
          keywords: ["online safety", "internet safety", "digital safety", "cyber"],
        },
        {
          key: "programming-concepts",
          label: "Programming concepts",
          shortDescription: "Using sequences, logic, and patterns to solve problems.",
          keywords: ["programming", "coding", "algorithm", "debug", "sequence"],
        },
        {
          key: "using-technology",
          label: "Using technology",
          shortDescription: "Applying technology for research, communication, and making.",
          keywords: ["technology", "typing", "productivity", "research", "device"],
        },
        {
          key: "creating-digital-content",
          label: "Creating digital content",
          shortDescription: "Making digital stories, media, and simple projects.",
          keywords: ["digital content", "presentation", "video", "slideshow", "design"],
        },
      ],
    },
    {
      key: "history",
      label: "History",
      shortDescription: "Chronology, enquiry, and understanding people and events over time.",
      keywords: ["history", "historical", "timeline", "past", "event"],
      elements: [
        {
          key: "chronology",
          label: "Chronology",
          shortDescription: "Putting people and events in time order.",
          keywords: ["chronology", "timeline", "sequence", "historical order"],
        },
        {
          key: "local-history",
          label: "Local history",
          shortDescription: "Exploring the stories and changes in the local area.",
          keywords: ["local history", "community history", "museum", "heritage"],
        },
        {
          key: "historical-enquiry",
          label: "Historical enquiry",
          shortDescription: "Asking questions and investigating evidence from the past.",
          keywords: ["historical enquiry", "source", "evidence", "investigation", "history question"],
        },
        {
          key: "significant-people-and-events",
          label: "Significant people and events",
          shortDescription: "Learning about notable figures and important events.",
          keywords: ["significant person", "event", "figure", "leader", "history topic"],
        },
      ],
    },
    {
      key: "geography",
      label: "Geography",
      shortDescription: "Places, maps, environments, and understanding the wider world.",
      keywords: ["geography", "map", "place", "environment", "landscape"],
      elements: [
        {
          key: "place-knowledge",
          label: "Place knowledge",
          shortDescription: "Learning about places and what makes them distinctive.",
          keywords: ["place knowledge", "country", "city", "region", "place"],
        },
        {
          key: "map-skills",
          label: "Map skills",
          shortDescription: "Reading, drawing, and using maps and directions.",
          keywords: ["map", "atlas", "direction", "grid", "route"],
        },
        {
          key: "human-and-physical-geography",
          label: "Human and physical geography",
          shortDescription: "Understanding how people and environments shape places.",
          keywords: ["human geography", "physical geography", "settlement", "weather", "landform"],
        },
        {
          key: "local-environment",
          label: "Local environment",
          shortDescription: "Observing and caring for the local area and environment.",
          keywords: ["local environment", "park", "river", "habitat", "community walk"],
        },
      ],
    },
    {
      key: "art-and-design",
      label: "Art and Design",
      shortDescription: "Visual making, artists, and responding to ideas through art.",
      keywords: ["art", "drawing", "painting", "design", "artist", "sketch"],
      elements: [
        {
          key: "drawing-and-painting",
          label: "Drawing and painting",
          shortDescription: "Using line, colour, and shape to create visual work.",
          keywords: ["drawing", "painting", "sketch", "colour", "artwork"],
        },
        {
          key: "sculpture-and-making",
          label: "Sculpture and making",
          shortDescription: "Creating with form, materials, and hands-on techniques.",
          keywords: ["sculpture", "clay", "making", "model", "craft"],
        },
        {
          key: "artists-and-designers",
          label: "Artists and designers",
          shortDescription: "Looking at artists, styles, and design inspiration.",
          keywords: ["artist", "designer", "style", "gallery", "art history"],
        },
        {
          key: "visual-response",
          label: "Visual response",
          shortDescription: "Talking or writing about what visual work is showing.",
          keywords: ["visual response", "respond", "describe art", "interpret"],
        },
      ],
    },
    {
      key: "design-and-technology",
      label: "Design and Technology",
      shortDescription: "Designing, making, and evaluating practical creations.",
      keywords: ["design technology", "design", "make", "prototype", "tool", "project"],
      elements: [
        {
          key: "design",
          label: "Design",
          shortDescription: "Planning and generating ideas for making.",
          keywords: ["design", "plan", "idea", "brief", "sketch"],
        },
        {
          key: "make",
          label: "Make",
          shortDescription: "Creating, building, and following a process.",
          keywords: ["make", "build", "construct", "assemble", "prototype"],
        },
        {
          key: "evaluate",
          label: "Evaluate",
          shortDescription: "Reflecting on what worked and what could improve.",
          keywords: ["evaluate", "improve", "review", "test", "reflect"],
        },
        {
          key: "cooking-and-nutrition",
          label: "Cooking and nutrition",
          shortDescription: "Preparing food and understanding healthy choices.",
          keywords: ["cooking", "nutrition", "recipe", "meal", "food"],
        },
        {
          key: "materials-and-tools",
          label: "Materials and tools",
          shortDescription: "Using materials and tools safely and thoughtfully.",
          keywords: ["materials", "tools", "equipment", "workshop", "safety"],
        },
      ],
    },
    {
      key: "music",
      label: "Music",
      shortDescription: "Listening, performing, rhythm, and creating with sound.",
      keywords: ["music", "rhythm", "beat", "instrument", "singing", "composition"],
      elements: [
        {
          key: "listening-and-responding",
          label: "Listening and responding",
          shortDescription: "Noticing and discussing musical sounds and ideas.",
          keywords: ["listening", "responding", "music appreciation", "sound"],
        },
        {
          key: "singing",
          label: "Singing",
          shortDescription: "Using voice confidently through songs and performance.",
          keywords: ["singing", "song", "choir", "melody"],
        },
        {
          key: "rhythm-and-beat",
          label: "Rhythm and beat",
          shortDescription: "Keeping time, patterns, and pulse in music.",
          keywords: ["rhythm", "beat", "pulse", "tempo", "pattern"],
        },
        {
          key: "composition",
          label: "Composition",
          shortDescription: "Creating simple musical ideas and arrangements.",
          keywords: ["composition", "compose", "create music", "arrangement"],
        },
      ],
    },
    {
      key: "physical-education",
      label: "Physical Education",
      shortDescription: "Movement, fitness, teamwork, and active participation.",
      keywords: ["physical education", "pe", "movement", "fitness", "sport", "teamwork"],
      legacyKeys: ["health-and-physical-education"],
      legacyLabels: ["Health and Physical Education"],
      elements: [
        {
          key: "movement-skills",
          label: "Movement skills",
          shortDescription: "Practising balance, coordination, and movement patterns.",
          keywords: ["movement", "coordination", "balance", "motor skills"],
        },
        {
          key: "fitness",
          label: "Fitness",
          shortDescription: "Building strength, stamina, and healthy activity habits.",
          keywords: ["fitness", "exercise", "stamina", "strength", "activity"],
        },
        {
          key: "games-and-teamwork",
          label: "Games and teamwork",
          shortDescription: "Joining games, learning rules, and working with others.",
          keywords: ["game", "teamwork", "sport", "cooperation", "rules"],
        },
        {
          key: "outdoor-activity",
          label: "Outdoor activity",
          shortDescription: "Learning through outdoor movement and challenge.",
          keywords: ["outdoor", "adventure", "hike", "field activity", "nature play"],
        },
      ],
    },
    {
      key: "languages",
      label: "Languages",
      shortDescription: "Listening, speaking, reading, and writing in another language.",
      keywords: ["language", "languages", "french", "spanish", "japanese", "latin", "german"],
      elements: [
        {
          key: "listening",
          label: "Listening",
          shortDescription: "Hearing and understanding familiar sounds and phrases.",
          keywords: ["listening", "hear", "audio", "pronunciation"],
        },
        {
          key: "speaking",
          label: "Speaking",
          shortDescription: "Using new words and phrases in conversation.",
          keywords: ["speaking", "conversation", "oral language", "pronunciation"],
        },
        {
          key: "reading",
          label: "Reading",
          shortDescription: "Reading familiar words, phrases, and simple texts.",
          keywords: ["reading", "text", "book", "story", "word recognition"],
        },
        {
          key: "writing",
          label: "Writing",
          shortDescription: "Writing words, phrases, and short responses in another language.",
          keywords: ["writing", "sentence", "translation", "response"],
        },
        {
          key: "cultural-awareness",
          label: "Cultural awareness",
          shortDescription: "Exploring the culture and customs connected to language.",
          keywords: ["culture", "cultural", "custom", "tradition", "country"],
        },
      ],
    },
    {
      key: "citizenship-pshe",
      label: "Citizenship / PSHE",
      shortDescription: "Relationships, wellbeing, safety, responsibility, and community life.",
      keywords: ["citizenship", "pshe", "relationship", "community", "wellbeing", "responsibility"],
      elements: [
        {
          key: "relationships",
          label: "Relationships",
          shortDescription: "Learning about friendships, respect, and working with others.",
          keywords: ["relationship", "friendship", "respect", "social", "family"],
        },
        {
          key: "community",
          label: "Community",
          shortDescription: "Understanding community roles, belonging, and contribution.",
          keywords: ["community", "citizenship", "volunteer", "belonging", "local"],
        },
        {
          key: "health-and-wellbeing",
          label: "Health and wellbeing",
          shortDescription: "Caring for physical, emotional, and mental wellbeing.",
          keywords: ["health", "wellbeing", "mental health", "emotion", "self care"],
        },
        {
          key: "safety",
          label: "Safety",
          shortDescription: "Making safe choices in daily life and online.",
          keywords: ["safety", "online safety", "risk", "safe choices", "emergency"],
        },
        {
          key: "responsibility",
          label: "Responsibility",
          shortDescription: "Understanding choices, consequences, and taking responsibility.",
          keywords: ["responsibility", "choice", "consequence", "rule", "self management"],
        },
      ],
    },
    {
      key: "life-skills-practical-learning",
      label: "Life Skills / Practical Learning",
      shortDescription: "Daily living, independence, and practical real-life learning.",
      keywords: ["life skills", "practical", "cooking", "money", "travel", "independence"],
      elements: [
        {
          key: "daily-living",
          label: "Daily living",
          shortDescription: "Managing routines, self-care, and home tasks.",
          keywords: ["daily living", "routine", "self care", "household", "chores"],
        },
        {
          key: "cooking",
          label: "Cooking",
          shortDescription: "Preparing food, following recipes, and building kitchen skills.",
          keywords: ["cooking", "baking", "recipe", "meal", "kitchen"],
        },
        {
          key: "travel-and-community-access",
          label: "Travel and community access",
          shortDescription: "Using transport, visiting places, and navigating the community.",
          keywords: ["travel", "transport", "bus", "community", "outing"],
        },
        {
          key: "money-and-budgeting",
          label: "Money and budgeting",
          shortDescription: "Using money, making choices, and understanding budgets.",
          keywords: ["money", "budget", "shopping", "cost", "saving"],
        },
        {
          key: "independence",
          label: "Independence",
          shortDescription: "Building confidence to plan, choose, and manage tasks independently.",
          keywords: ["independence", "self management", "confidence", "responsibility"],
        },
      ],
    },
  ],
};

const usFrameworkMap: CurriculumFrameworkMap = {
  frameworkKey: "broad-us-homeschool-framework",
  frameworkLabel: "Broad US Homeschool Framework",
  countryLabel: "United States",
  description:
    "A broad subject map for US homeschool families who want a simple way to organise evidence and reporting support.",
  mapTypeLabel: "Subject and reporting evidence coverage",
  learningAreas: [
    {
      key: "english-language-arts",
      label: "English Language Arts",
      shortDescription: "Reading, writing, discussion, and making meaning from texts.",
      keywords: ["english language arts", "ela", "english", "literacy", "reading", "writing"],
      legacyKeys: ["english"],
      legacyLabels: ["English"],
      elements: [
        {
          key: "reading-comprehension",
          label: "Reading comprehension",
          shortDescription: "Understanding what has been read and talking about the meaning.",
          keywords: ["reading", "read", "comprehension", "book", "story", "novel"],
        },
        {
          key: "writing",
          label: "Writing",
          shortDescription: "Turning ideas into sentences, responses, and longer pieces.",
          keywords: ["writing", "sentence", "paragraph", "journal", "essay", "response"],
          legacyKeys: ["writing-sentences-and-paragraphs"],
          legacyLabels: ["Writing sentences and paragraphs"],
        },
        {
          key: "vocabulary-and-spelling",
          label: "Vocabulary and spelling",
          shortDescription: "Growing confidence with words, spelling patterns, and meaning.",
          keywords: ["spelling", "vocabulary", "word study", "phonics", "dictionary"],
          legacyKeys: ["spelling-and-vocabulary"],
          legacyLabels: ["Spelling and vocabulary"],
        },
        {
          key: "speaking-and-listening",
          label: "Speaking and listening",
          shortDescription: "Explaining ideas, listening carefully, and joining discussion.",
          keywords: ["discussion", "speaking", "listening", "presentation", "conversation"],
        },
        {
          key: "text-response",
          label: "Text response",
          shortDescription: "Responding to stories, information texts, and media in a thoughtful way.",
          keywords: ["text response", "response", "character", "theme", "author"],
        },
      ],
    },
    {
      key: "mathematics",
      label: "Mathematics",
      shortDescription: "Number sense, operations, reasoning, and practical problem solving.",
      keywords: ["mathematics", "math", "maths", "numeracy", "number", "calculation"],
      elements: [
        {
          key: "number-sense",
          label: "Number sense",
          shortDescription: "Understanding how numbers work and relate to one another.",
          keywords: ["number", "place value", "digit", "counting", "number sense"],
          legacyKeys: ["number-and-place-value"],
          legacyLabels: ["Number and place value"],
        },
        {
          key: "operations",
          label: "Operations",
          shortDescription: "Using addition, subtraction, multiplication, and division meaningfully.",
          keywords: ["addition", "subtraction", "multiplication", "division", "operation", "times tables"],
          legacyKeys: ["addition-and-subtraction", "multiplication-and-division"],
        },
        {
          key: "fractions-and-decimals",
          label: "Fractions and decimals",
          shortDescription: "Working with parts, wholes, and equivalent values.",
          keywords: ["fraction", "decimal", "half", "quarter", "equivalent"],
          legacyKeys: ["fractions"],
          legacyLabels: ["Fractions"],
        },
        {
          key: "measurement",
          label: "Measurement",
          shortDescription: "Using length, time, money, mass, and capacity meaningfully.",
          keywords: ["measurement", "measure", "time", "money", "length", "mass", "capacity"],
        },
        {
          key: "geometry",
          label: "Geometry",
          shortDescription: "Recognising shape, space, direction, and properties.",
          keywords: ["geometry", "shape", "angle", "position", "space"],
          legacyKeys: ["shape-and-geometry"],
          legacyLabels: ["Shape and geometry"],
        },
        {
          key: "data-and-statistics",
          label: "Data and statistics",
          shortDescription: "Collecting data, organising it, and talking about what it shows.",
          keywords: ["data", "graph", "statistics", "survey", "chart", "table"],
          legacyKeys: ["statistics-and-data"],
          legacyLabels: ["Statistics and data"],
        },
      ],
    },
    {
      key: "science",
      label: "Science",
      shortDescription: "Inquiry, experimentation, and understanding how the world works.",
      keywords: ["science", "experiment", "investigation", "hypothesis", "observation"],
      elements: [
        {
          key: "scientific-investigation",
          label: "Scientific investigation",
          shortDescription: "Asking questions, testing ideas, and noticing patterns in results.",
          keywords: ["investigation", "experiment", "hypothesis", "observe", "observation"],
        },
        {
          key: "life-science",
          label: "Life science",
          shortDescription: "Exploring living things, habitats, and life processes.",
          keywords: ["life science", "animal", "plant", "habitat", "biology", "living things"],
        },
        {
          key: "physical-science",
          label: "Physical science",
          shortDescription: "Looking at matter, forces, energy, and change.",
          keywords: ["physical science", "material", "force", "motion", "matter", "energy"],
        },
        {
          key: "earth-and-space-science",
          label: "Earth and space science",
          shortDescription: "Learning about weather, Earth systems, and the wider universe.",
          keywords: ["earth", "space", "planet", "weather", "season", "solar system"],
          legacyKeys: ["earth-and-space"],
          legacyLabels: ["Earth and space"],
        },
        {
          key: "engineering-and-design",
          label: "Engineering and design",
          shortDescription: "Using science thinking to design, build, and improve ideas.",
          keywords: ["engineering", "design", "prototype", "problem solving", "build"],
        },
      ],
    },
    {
      key: "social-studies",
      label: "Social Studies",
      shortDescription: "History, geography, civics, economics, and community learning.",
      keywords: ["social studies", "history", "geography", "civics", "economics", "community"],
      legacyKeys: ["humanities-and-social-sciences"],
      legacyLabels: ["Humanities and Social Sciences"],
      elements: [
        {
          key: "history",
          label: "History",
          shortDescription: "Learning about people, events, and change over time.",
          keywords: ["history", "historical", "timeline", "past", "event"],
        },
        {
          key: "geography",
          label: "Geography",
          shortDescription: "Exploring places, maps, and environments.",
          keywords: ["geography", "map", "place", "environment", "landscape"],
        },
        {
          key: "civics",
          label: "Civics",
          shortDescription: "Understanding responsibility, fairness, and how communities work.",
          keywords: ["civics", "government", "citizenship", "responsibility", "community"],
        },
        {
          key: "economics",
          label: "Economics",
          shortDescription: "Learning about money, choices, work, and exchange.",
          keywords: ["economics", "business", "money", "budget", "enterprise"],
        },
        {
          key: "community-studies",
          label: "Community studies",
          shortDescription: "Looking at the local area, people, and services around the learner.",
          keywords: ["community", "neighbourhood", "local area", "service", "council"],
        },
      ],
    },
    {
      key: "arts",
      label: "Arts",
      shortDescription: "Creative expression through visual art, music, drama, and response.",
      keywords: ["art", "arts", "music", "drama", "drawing", "painting", "creative"],
      legacyKeys: ["the-arts"],
      legacyLabels: ["The Arts"],
      elements: [
        {
          key: "visual-arts",
          label: "Visual arts",
          shortDescription: "Drawing, painting, sculpture, and visual design.",
          keywords: ["visual art", "drawing", "painting", "sculpture", "sketch"],
        },
        {
          key: "music",
          label: "Music",
          shortDescription: "Listening, performing, rhythm, and creating with sound.",
          keywords: ["music", "rhythm", "singing", "instrument", "composition"],
        },
        {
          key: "drama",
          label: "Drama",
          shortDescription: "Role play, storytelling, and performance.",
          keywords: ["drama", "performance", "role play", "theatre", "script"],
        },
        {
          key: "creative-response",
          label: "Creative response",
          shortDescription: "Responding to art, stories, and ideas in expressive ways.",
          keywords: ["creative response", "respond", "interpret", "reflection", "art response"],
        },
      ],
    },
    {
      key: "health-and-physical-education",
      label: "Health and Physical Education",
      shortDescription: "Movement, wellbeing, safety, and active participation.",
      keywords: ["health", "physical", "pe", "sport", "movement", "wellbeing", "exercise"],
      elements: [
        {
          key: "physical-activity",
          label: "Physical activity",
          shortDescription: "Using active movement to build fitness and confidence.",
          keywords: ["movement", "physical activity", "sport", "exercise", "fitness"],
        },
        {
          key: "health-and-wellbeing",
          label: "Health and wellbeing",
          shortDescription: "Caring for physical, emotional, and mental wellbeing.",
          keywords: ["health", "wellbeing", "mental health", "emotion", "nutrition"],
        },
        {
          key: "safety",
          label: "Safety",
          shortDescription: "Learning how to stay safe and make safe choices.",
          keywords: ["safety", "safe choices", "personal safety", "online safety"],
        },
        {
          key: "teamwork",
          label: "Teamwork",
          shortDescription: "Working with others, taking turns, and learning together.",
          keywords: ["teamwork", "cooperation", "group", "game", "play"],
        },
      ],
    },
    {
      key: "technology-digital-literacy",
      label: "Technology / Digital Literacy",
      shortDescription: "Digital tools, online safety, and creating with technology.",
      keywords: ["technology", "digital", "computer", "typing", "internet", "coding"],
      legacyKeys: ["technologies-computing"],
      legacyLabels: ["Technologies / Computing"],
      elements: [
        {
          key: "digital-tools",
          label: "Digital tools",
          shortDescription: "Using devices and software confidently and purposefully.",
          keywords: ["digital tools", "computer", "device", "software", "app"],
        },
        {
          key: "online-safety",
          label: "Online safety",
          shortDescription: "Learning how to stay safe and thoughtful online.",
          keywords: ["online safety", "internet safety", "digital safety", "cyber"],
        },
        {
          key: "typing-and-productivity",
          label: "Typing and productivity",
          shortDescription: "Using digital tools to write, organise, and communicate.",
          keywords: ["typing", "productivity", "document", "keyboard", "presentation"],
        },
        {
          key: "research-skills",
          label: "Research skills",
          shortDescription: "Finding, checking, and using information thoughtfully.",
          keywords: ["research", "search", "source", "fact checking", "information"],
        },
        {
          key: "creating-digital-content",
          label: "Creating digital content",
          shortDescription: "Making slides, video, media, and digital projects.",
          keywords: ["digital content", "video", "slideshow", "presentation", "media"],
        },
      ],
    },
    {
      key: "world-languages",
      label: "World Languages",
      shortDescription: "Listening, speaking, reading, and writing in another language.",
      keywords: ["language", "languages", "french", "spanish", "japanese", "german", "latin"],
      legacyKeys: ["languages"],
      legacyLabels: ["Languages"],
      elements: [
        {
          key: "listening",
          label: "Listening",
          shortDescription: "Hearing and understanding familiar sounds and phrases.",
          keywords: ["listening", "hear", "audio", "pronunciation"],
        },
        {
          key: "speaking",
          label: "Speaking",
          shortDescription: "Using new words and phrases in conversation.",
          keywords: ["speaking", "conversation", "oral language", "pronunciation"],
        },
        {
          key: "reading",
          label: "Reading",
          shortDescription: "Reading familiar words, phrases, and simple texts.",
          keywords: ["reading", "text", "book", "story", "word recognition"],
        },
        {
          key: "writing",
          label: "Writing",
          shortDescription: "Writing words, phrases, and short responses in another language.",
          keywords: ["writing", "sentence", "translation", "response"],
        },
        {
          key: "cultural-understanding",
          label: "Cultural understanding",
          shortDescription: "Exploring the people, places, and customs linked to language.",
          keywords: ["culture", "cultural", "custom", "tradition", "country"],
        },
      ],
    },
    {
      key: "practical-life-skills",
      label: "Practical / Life Skills",
      shortDescription: "Daily living, community participation, and practical independence.",
      keywords: ["life skills", "practical", "cooking", "money", "daily living", "independence"],
      legacyKeys: ["life-skills-practical-learning"],
      legacyLabels: ["Life Skills / Practical Learning"],
      elements: [
        {
          key: "cooking",
          label: "Cooking",
          shortDescription: "Preparing food, following recipes, and building kitchen skills.",
          keywords: ["cooking", "baking", "recipe", "meal", "kitchen"],
        },
        {
          key: "money",
          label: "Money",
          shortDescription: "Using money, budgeting, and planning purchases.",
          keywords: ["money", "budget", "shopping", "cost", "saving"],
        },
        {
          key: "daily-routines",
          label: "Daily routines",
          shortDescription: "Building structure, self-care, and daily independence.",
          keywords: ["routine", "self care", "daily living", "independence", "chores"],
        },
        {
          key: "community-access",
          label: "Community access",
          shortDescription: "Navigating local places, transport, and community life.",
          keywords: ["community", "travel", "transport", "outing", "local area"],
        },
        {
          key: "independence",
          label: "Independence",
          shortDescription: "Growing confidence to plan, choose, and manage tasks independently.",
          keywords: ["independence", "self management", "confidence", "responsibility"],
        },
      ],
    },
  ],
  reportingEvidenceAreas: [
    {
      key: "subject-coverage",
      label: "Subject coverage",
      shortDescription: "How learning evidence is building across the main subject areas.",
      keywords: ["subject coverage", "coverage", "learning areas", "subject plan"],
    },
    {
      key: "portfolio-evidence",
      label: "Portfolio evidence",
      shortDescription: "Samples of work and notes that could support a portfolio record.",
      keywords: ["portfolio", "sample", "work sample", "evidence", "showcase"],
    },
    {
      key: "attendance-learning-time",
      label: "Attendance / learning time",
      shortDescription: "Notes about learning time, participation, and engagement.",
      keywords: ["attendance", "learning time", "engagement", "participation", "hours"],
    },
    {
      key: "progress-report-evidence",
      label: "Progress report evidence",
      shortDescription: "Evidence that helps describe progress over time.",
      keywords: ["progress report", "progress", "growth", "achievement", "review"],
    },
    {
      key: "assessment-evidence",
      label: "Assessment evidence",
      shortDescription: "Work, checks, or observations that help describe learning progress.",
      keywords: ["assessment", "quiz", "test", "observation", "check-in"],
    },
    {
      key: "annual-evaluation-evidence",
      label: "Annual evaluation evidence",
      shortDescription: "Evidence that could support an annual homeschool review.",
      keywords: ["annual evaluation", "review", "summary", "year end", "evaluation"],
    },
    {
      key: "parent-notes",
      label: "Parent notes",
      shortDescription: "Family observations, context, and supporting comments.",
      keywords: ["parent", "family note", "observation", "comment", "context"],
    },
    {
      key: "review-notes-next-steps",
      label: "Review notes / next steps",
      shortDescription: "What to keep building, adjust, or revisit next.",
      keywords: ["review", "next step", "plan", "adjust", "future"],
    },
  ],
};

const customFrameworkMap: CurriculumFrameworkMap = {
  frameworkKey: "custom-homeschool-learning-map",
  frameworkLabel: "Custom homeschool learning map",
  countryLabel: "Custom",
  description:
    "A flexible map that helps families organise learning evidence even when the curriculum or authority pathway is custom.",
  mapTypeLabel: "Flexible coverage map",
  learningAreas: [
    {
      key: "english-literacy",
      label: "English / Literacy",
      shortDescription: "Reading, writing, discussion, and making meaning from texts.",
      keywords: ["english", "literacy", "reading", "writing", "spelling", "vocabulary"],
      legacyKeys: ["english"],
      legacyLabels: ["English", "English Language Arts"],
      elements: commonEnglishElements,
    },
    {
      key: "mathematics-numeracy",
      label: "Mathematics / Numeracy",
      shortDescription: "Number sense, calculation, reasoning, and real-life maths.",
      keywords: ["mathematics", "math", "maths", "numeracy", "number", "calculation"],
      legacyKeys: ["mathematics"],
      legacyLabels: ["Mathematics"],
      elements: [
        {
          key: "number-and-problem-solving",
          label: "Number and problem solving",
          shortDescription: "Using number, patterns, and practical strategies meaningfully.",
          keywords: ["number", "pattern", "calculation", "problem solving", "numeracy"],
        },
      ],
    },
    {
      key: "science-inquiry",
      label: "Science / Inquiry",
      shortDescription: "Curiosity, investigation, observation, and trying ideas out.",
      keywords: ["science", "inquiry", "experiment", "investigation", "observation"],
      legacyKeys: ["science"],
      legacyLabels: ["Science"],
      elements: [
        {
          key: "investigation-and-discovery",
          label: "Investigation and discovery",
          shortDescription: "Asking questions, testing ideas, and noticing what happens.",
          keywords: ["investigation", "experiment", "observe", "discovery", "hypothesis"],
        },
      ],
    },
    {
      key: "humanities-community",
      label: "Humanities / Community",
      shortDescription: "History, geography, community learning, and understanding the world.",
      keywords: ["history", "geography", "community", "humanities", "social studies"],
      legacyKeys: ["humanities-and-social-sciences", "social-studies"],
      elements: [
        {
          key: "community-and-world-understanding",
          label: "Community and world understanding",
          shortDescription: "Exploring people, places, events, and belonging.",
          keywords: ["community", "history", "geography", "place", "local area"],
        },
      ],
    },
    {
      key: "creative-arts",
      label: "Creative Arts",
      shortDescription: "Visual art, music, drama, performance, and making.",
      keywords: ["art", "arts", "music", "drama", "dance", "creative", "making"],
      legacyKeys: ["the-arts", "art-and-design", "arts"],
      elements: [
        {
          key: "creative-expression",
          label: "Creative expression",
          shortDescription: "Using art, sound, movement, and design to express ideas.",
          keywords: ["creative", "art", "music", "performance", "design"],
        },
      ],
    },
    {
      key: "technology-practical-projects",
      label: "Technology / Practical Projects",
      shortDescription: "Digital tools, practical making, design thinking, and projects.",
      keywords: ["technology", "digital", "computing", "project", "making", "design"],
      legacyKeys: ["technologies-computing", "technologies"],
      legacyLabels: ["Technologies / Computing", "Technologies"],
      elements: [
        {
          key: "making-and-using-tools",
          label: "Making and using tools",
          shortDescription: "Using tools, materials, and digital resources to solve problems.",
          keywords: ["tool", "materials", "digital", "build", "project"],
        },
      ],
    },
    {
      key: "health-and-movement",
      label: "Health and Movement",
      shortDescription: "Movement, wellbeing, personal safety, and active routines.",
      keywords: ["health", "movement", "wellbeing", "physical", "exercise", "safety"],
      legacyKeys: ["health-and-physical-education", "physical-education"],
      legacyLabels: ["Health and Physical Education", "Physical Education"],
      elements: [
        {
          key: "wellbeing-and-active-living",
          label: "Wellbeing and active living",
          shortDescription: "Building healthy, active, and balanced routines.",
          keywords: ["wellbeing", "active", "movement", "health", "exercise"],
        },
      ],
    },
    {
      key: "languages-communication",
      label: "Languages / Communication",
      shortDescription: "Listening, speaking, reading, writing, and communicating with others.",
      keywords: ["language", "communication", "speaking", "listening", "reading", "writing"],
      legacyKeys: ["languages", "world-languages"],
      elements: [
        {
          key: "communication-and-language",
          label: "Communication and language",
          shortDescription: "Using spoken, written, and visual communication with confidence.",
          keywords: ["communication", "language", "speaking", "listening", "reading", "writing"],
        },
      ],
    },
    {
      key: "life-skills-practical-learning",
      label: "Life Skills / Practical Learning",
      shortDescription: "Daily living, practical tasks, and real-life independence.",
      keywords: ["life skills", "practical", "daily living", "cooking", "money", "independence"],
      legacyKeys: ["practical-life-skills"],
      legacyLabels: ["Practical / Life Skills"],
      elements: [
        {
          key: "everyday-independence",
          label: "Everyday independence",
          shortDescription: "Building routines, responsibility, and practical confidence.",
          keywords: ["independence", "routine", "money", "cooking", "community"],
        },
      ],
    },
  ],
};

const brentAuthorityEvidenceAreas: CurriculumFrameworkEvidenceArea[] = [
  {
    key: "communication-and-interaction",
    label: "Communication and interaction",
    shortDescription: "What supports communication, shared understanding, and interaction with others.",
    keywords: ["communication", "interaction", "conversation", "language support", "social communication"],
  },
  {
    key: "cognition-and-learning",
    label: "Cognition and learning",
    shortDescription: "How the learner processes ideas, remembers steps, and approaches learning.",
    keywords: ["cognition", "learning support", "processing", "memory", "thinking"],
  },
  {
    key: "social-emotional-and-mental-health",
    label: "Social, emotional and mental health",
    shortDescription: "Emotional regulation, confidence, relationships, and mental wellbeing.",
    keywords: ["emotional", "mental health", "wellbeing", "confidence", "regulation", "anxiety"],
  },
  {
    key: "physical-and-sensory",
    label: "Physical and sensory",
    shortDescription: "Physical needs, sensory access, comfort, movement, and adaptations.",
    keywords: ["physical", "sensory", "movement", "motor", "adaptation", "access"],
  },
  {
    key: "progress-against-outcomes",
    label: "Progress against outcomes",
    shortDescription: "What the evidence is beginning to show about progress over time.",
    keywords: ["outcome", "progress", "goal", "target", "review"],
  },
  {
    key: "young-person-views",
    label: "Young person views",
    shortDescription: "The learner's own voice about what is working, what matters, and what they hope for.",
    keywords: ["young person", "learner voice", "what i like", "aspiration", "hope"],
  },
  {
    key: "parent-carer-views",
    label: "Parent / carer views",
    shortDescription: "Family observations, concerns, and what support feels most useful.",
    keywords: ["parent", "carer", "family view", "concern", "support needed"],
  },
  {
    key: "next-support-planning",
    label: "Next support planning",
    shortDescription: "Next steps, support ideas, and what to keep building next.",
    keywords: ["next step", "support plan", "review note", "future outcome"],
  },
];

export const curriculumFrameworkMaps = {
  australia: australianFrameworkMap,
  unitedKingdom: ukFrameworkMap,
  unitedStates: usFrameworkMap,
  custom: customFrameworkMap,
};

export function resolveCurriculumFrameworkMap(
  profile:
    | Pick<FamilyProfile, "countryCode" | "jurisdictionCode" | "curriculumFrameworkId" | "reportingMode">
    | null
    | undefined,
): ResolvedCurriculumFrameworkMap {
  const countryCode = safe(profile?.countryCode).toUpperCase();
  const curriculumFrameworkId = safe(profile?.curriculumFrameworkId);
  const authorityDisplayValues = getAuthorityDisplayValues(profile);
  const brentActive = isBrentAuthorityTemplateActive(profile);

  let map = customFrameworkMap;

  if (countryCode === "AU" || curriculumFrameworkId === "australian-curriculum") {
    map = australianFrameworkMap;
  } else if (brentActive || countryCode === "UK" || curriculumFrameworkId === "national-curriculum") {
    map = ukFrameworkMap;
  } else if (countryCode === "US") {
    map = usFrameworkMap;
  }

  const countryAuthorityLabel = brentActive
    ? [
        BRENT_COUNTRY_LABEL,
        authorityDisplayValues.nationLabel,
        BRENT_LOCAL_AUTHORITY_LABEL,
      ]
        .filter(Boolean)
        .join(" / ")
    : countryCode === "UK"
      ? [
          "United Kingdom",
          authorityDisplayValues.nationLabel !== "Not set"
            ? authorityDisplayValues.nationLabel
            : safe(profile?.jurisdictionCode),
        ]
          .filter(Boolean)
          .join(" / ")
      : countryCode === "AU"
        ? ["Australia", safe(profile?.jurisdictionCode)].filter(Boolean).join(" / ")
        : countryCode === "US"
          ? ["United States", safe(profile?.jurisdictionCode)].filter(Boolean).join(" / ")
          : map.countryLabel;

  const supplementaryEvidenceAreas = brentActive
    ? brentAuthorityEvidenceAreas
    : map.reportingEvidenceAreas || map.authorityEvidenceAreas || [];

  const helperCopy =
    "Your curriculum map is based on your family settings.";
  const settingsHint =
    "If this does not look right, update your country, authority, or curriculum framework in My Settings.";

  return {
    map,
    authorityOverlayActive: brentActive,
    frameworkDisplayLabel: brentActive
      ? `${ukFrameworkMap.frameworkLabel} + ${BRENT_REPORTING_PATHWAY_LABEL}`
      : map.frameworkLabel,
    countryAuthorityLabel:
      countryAuthorityLabel || "Framework details can be adjusted in My Settings.",
    mapTypeLabel: brentActive
      ? "Curriculum and authority evidence coverage"
      : map.mapTypeLabel,
    helperCopy,
    settingsHint,
    supplementarySectionTitle: brentActive
      ? "Authority / support evidence areas"
      : supplementaryEvidenceAreas.length
        ? "Reporting evidence areas"
        : "Supporting evidence areas",
    supplementarySectionCopy: brentActive
      ? "These areas help you see where evidence can support authority-aligned review and reporting expectations."
      : supplementaryEvidenceAreas.length
        ? "These areas help you organise evidence for review, reporting, and broader learning records."
        : "Additional reporting support areas can be added later if needed.",
    supplementaryEvidenceAreas,
    supplementaryMetricLabel: brentActive
      ? "Authority evidence areas"
      : supplementaryEvidenceAreas.length
        ? "Reporting evidence areas"
        : "Support areas",
    supplementaryMetricCopy: brentActive
      ? "Evidence building for Brent-aligned review support."
      : supplementaryEvidenceAreas.length
        ? "Useful for review notes, reporting support, and coverage planning."
        : "No additional reporting areas selected in this map.",
    brentContextCard: brentActive
      ? {
          title: "Brent evidence pathway active",
          copy: "This learner is set to Brent Council. My Data includes UK National Curriculum areas and Brent-aligned support evidence areas.",
        }
      : null,
  };
}

export type PathwaySubjectKey =
  | "mathematics"
  | "english"
  | "science"
  | "humanities"
  | "technologies"
  | "arts"
  | "health-pe"
  | "bible-faith";

export type PathwaySubjectStatus = "detailed" | "coming-soon";

export type PathwaySubjectDefinition = {
  key: PathwaySubjectKey;
  title: string;
  description: string;
  guidance: string;
  status: PathwaySubjectStatus;
  futureStrands: string[];
  placeholderNote: string;
};

export const DEFAULT_PATHWAY_SUBJECT_KEY: PathwaySubjectKey = "mathematics";

export const PATHWAY_SUBJECTS: PathwaySubjectDefinition[] = [
  {
    key: "mathematics",
    title: "Mathematics",
    description:
      "Mathematics pathways help families track number, calculation, reasoning, problem solving, and practical mathematical confidence through staged strand progressions.",
    guidance:
      "Choose a strand, review the current stage, then use practise, assess, and capture evidence to build portfolio and reporting support over time.",
    status: "detailed",
    futureStrands: [
      "Number and place value",
      "Operations and calculation",
      "Fractions, decimals, and percentages",
      "Ratio and proportional reasoning",
    ],
    placeholderNote:
      "Mathematics is currently the first fully detailed subject pathway and acts as the template for later subjects.",
  },
  {
    key: "english",
    title: "English",
    description:
      "English pathways will help families track reading, writing, speaking, spelling, vocabulary, and language development in the same guided pathway format.",
    guidance:
      "This subject will grow into calm, parent-readable pathways that support literacy teaching, evidence capture, and later reporting without turning into a curriculum wall.",
    status: "coming-soon",
    futureStrands: [
      "Reading and comprehension",
      "Writing and composition",
      "Speaking and listening",
      "Spelling, vocabulary, and language",
    ],
    placeholderNote:
      "English pathways are being shaped gradually so the first detailed strands feel practical, calm, and genuinely useful for homeschool families.",
  },
  {
    key: "science",
    title: "Science",
    description:
      "Science pathways will help families track observation, investigation, explanation, living systems, physical science, Earth and space, and practical inquiry.",
    guidance:
      "The long-term goal is a guided pathway structure that supports noticing, questioning, investigating, and recording scientific understanding over time.",
    status: "coming-soon",
    futureStrands: [
      "Scientific inquiry and explanation",
      "Living systems",
      "Physical science",
      "Earth and space",
    ],
    placeholderNote:
      "Science pathways will develop gradually so practical inquiry and homeschool evidence capture stay stronger than content overload.",
  },
  {
    key: "humanities",
    title: "Humanities",
    description:
      "Humanities pathways will help families track history, geography, civics, culture, identity, community understanding, and thoughtful discussion.",
    guidance:
      "This subject will later support both knowledge-building and reflective family conversations through clear strands and evidence-friendly pathway steps.",
    status: "coming-soon",
    futureStrands: [
      "History and change over time",
      "Geography and place",
      "Community, civics, and identity",
      "Cultures and perspectives",
    ],
    placeholderNote:
      "Humanities pathways are being planned as guided learning maps rather than long content lists, so families can see what to notice, discuss, and record.",
  },
  {
    key: "technologies",
    title: "Technologies",
    description:
      "Technologies pathways will help families track design thinking, making, digital confidence, systems understanding, and practical project work.",
    guidance:
      "Future pathways here will connect creating, building, testing, and reflecting so technology learning feels purposeful and evidence-ready.",
    status: "coming-soon",
    futureStrands: [
      "Design and making",
      "Digital literacy",
      "Systems and tools",
      "Project planning and reflection",
    ],
    placeholderNote:
      "Technologies pathways will be introduced gradually so practical making and digital understanding stay calm, visible, and manageable in homeschool life.",
  },
  {
    key: "arts",
    title: "Arts",
    description:
      "Arts pathways will help families track creating, responding, performing, visual expression, music, drama, and creative confidence.",
    guidance:
      "The pathway goal is to support artistic growth, reflection, and evidence collection without flattening creative work into rigid checklisting.",
    status: "coming-soon",
    futureStrands: [
      "Visual art and making",
      "Music and sound",
      "Drama and performance",
      "Creative response and reflection",
    ],
    placeholderNote:
      "Arts pathways are being shaped carefully so they remain flexible, creative, and portfolio-friendly rather than overly formal.",
  },
  {
    key: "health-pe",
    title: "Health / PE",
    description:
      "Health and PE pathways will help families track movement, wellbeing, habits, body awareness, teamwork, safety, and practical health learning.",
    guidance:
      "These pathways will later support both everyday movement and broader wellbeing reflection in a guided, parent-readable format.",
    status: "coming-soon",
    futureStrands: [
      "Movement and coordination",
      "Fitness and healthy habits",
      "Safety and decision-making",
      "Wellbeing and reflection",
    ],
    placeholderNote:
      "Health / PE pathways will develop gradually so movement, wellbeing, and real family routines stay central to the learning record.",
  },
  {
    key: "bible-faith",
    title: "Bible / Faith",
    description:
      "Bible and faith pathways will help families track scripture engagement, worldview, memory work, discussion, character formation, and faith-informed reflection.",
    guidance:
      "The aim is a gentle pathway structure that supports family faith learning, reflection, and evidence of growth without forcing a formal school-style model.",
    status: "coming-soon",
    futureStrands: [
      "Scripture and understanding",
      "Memory and reflection",
      "Discussion and worldview",
      "Character and lived faith",
    ],
    placeholderNote:
      "Bible / Faith pathways are being shaped gradually so they remain calm, family-sensitive, and aligned with the broader MyLearna guided pathway approach.",
  },
];

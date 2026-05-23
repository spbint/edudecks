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
      "English pathways help families track reading, writing, speaking, spelling, vocabulary, language development, and literature response through staged strand progressions.",
    guidance:
      "Choose a strand, review the current stage, then use practise, assess, and capture evidence to support literacy growth, portfolio building, and later reporting.",
    status: "detailed",
    futureStrands: [
      "Reading and comprehension",
      "Writing and composition",
      "Speaking and listening",
      "Spelling and word study",
      "Grammar, punctuation and language",
      "Vocabulary and word meaning",
      "Literature and text response",
      "Research, media and digital texts",
    ],
    placeholderNote:
      "English is now the second detailed subject pathway and follows the same calm strand -> stage -> evidence structure as Mathematics.",
  },
  {
    key: "science",
    title: "Science",
    description:
      "Science pathways help families track observation, investigation, explanation, living systems, physical science, Earth and space, materials, health, and practical inquiry through staged strand progressions.",
    guidance:
      "Choose a strand, review the current stage, then use practise, assess, and capture evidence to support inquiry, explanation, and later science reporting.",
    status: "detailed",
    futureStrands: [
      "Scientific inquiry and investigation",
      "Living things and environments",
      "Earth and space",
      "Physical sciences",
      "Materials, matter and change",
      "Forces, energy and motion",
      "Human body and health",
      "Science in society and technology",
    ],
    placeholderNote:
      "Science is now the third detailed subject pathway and follows the same calm strand -> stage -> evidence structure as Mathematics and English.",
  },
  {
    key: "humanities",
    title: "Humanities & Social Sciences",
    description:
      "Humanities & Social Sciences helps families explore people, places, communities, history, geography, civics, economics, cultures, and how societies change over time. In some contexts, this area may be known as Social Studies, HASS, or Humanities.",
    guidance:
      "Families may also recognise this area as Social Studies. Over time, this subject will support knowledge-building, inquiry, evidence use, and reflective family conversations through calm strands and evidence-friendly pathway steps.",
    status: "coming-soon",
    futureStrands: [
      "History and change over time",
      "Geography, place and environment",
      "Civics, community and citizenship",
      "Economics, resources and decision-making",
      "Cultures, societies and perspectives",
      "Inquiry, sources and evidence",
    ],
    placeholderNote:
      "Humanities & Social Sciences pathways are being prepared as guided learning maps rather than long content lists, so families can see what to notice, discuss, compare, and record over time.",
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

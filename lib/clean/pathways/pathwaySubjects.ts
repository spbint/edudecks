export type PathwaySubjectKey =
  | "mathematics"
  | "english"
  | "science"
  | "humanities"
  | "technologies"
  | "arts"
  | "health-pe";

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

// Niche or optional program areas such as Bible / Faith can be supported later
// through Marketplace Programs or optional packs rather than the core subject list.
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
      "Technologies pathways will help families explore designing, making, digital systems, computational thinking, materials, tools, food, engineering ideas, and practical problem-solving.",
    guidance:
      "Over time, this subject will support hands-on making, digital confidence, and practical problem-solving through calm strands and evidence-friendly pathway steps.",
    status: "coming-soon",
    futureStrands: [
      "Design and production",
      "Digital technologies and systems",
      "Computational thinking",
      "Materials, tools and making",
      "Food, fibre and practical technologies",
      "Engineering, systems and problem-solving",
    ],
    placeholderNote:
      "Technologies pathways are being prepared so practical making, digital systems, and hands-on problem-solving stay calm, visible, and manageable in homeschool life.",
  },
  {
    key: "arts",
    title: "Arts",
    description:
      "Arts pathways will help families explore creating, responding, performing, presenting, visual expression, music, drama, dance, media, and creative communication.",
    guidance:
      "Over time, this subject will support creative growth, practical making, reflection, and evidence collection without flattening the arts into rigid checklisting.",
    status: "coming-soon",
    futureStrands: [
      "Visual arts and design",
      "Music and sound",
      "Drama and performance",
      "Dance and movement",
      "Media arts and storytelling",
      "Responding to artworks and creative choices",
    ],
    placeholderNote:
      "Arts pathways are being prepared carefully so they remain creative, flexible, practical, and portfolio-friendly rather than overly formal.",
  },
  {
    key: "health-pe",
    title: "Health / PE",
    description:
      "Health / PE pathways will help families explore movement, coordination, wellbeing, safety, relationships, healthy choices, physical activity, teamwork, and personal development.",
    guidance:
      "Over time, this subject will support practical movement, wellbeing, safety, and personal growth through calm strands that suit a wide range of homeschool contexts.",
    status: "coming-soon",
    futureStrands: [
      "Movement and coordination",
      "Physical activity and fitness",
      "Health, safety and wellbeing",
      "Relationships and personal development",
      "Teamwork, games and fair play",
      "Outdoor, practical and active learning",
    ],
    placeholderNote:
      "Health / PE pathways are being prepared so movement, wellbeing, relationships, and active learning stay central without becoming overly clinical or school-sport focused.",
  },
];

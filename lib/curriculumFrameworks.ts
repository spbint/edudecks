export type CurriculumFrameworkOutcome = {
  code: string;
  label: string;
};

export type CurriculumFrameworkStrand = {
  id: string;
  title: string;
  outcomes: CurriculumFrameworkOutcome[];
};

export type CurriculumFrameworkSubject = {
  id: string;
  title: string;
  aliases: string[];
  strands: CurriculumFrameworkStrand[];
};

export type FrameworkPreset = {
  framework: string;
  jurisdiction: string;
  subjects: CurriculumFrameworkSubject[];
};

export type CurriculumOutcomeMeta = {
  id: string;
  code: string;
  label: string;
  subjectId: string;
  subjectTitle: string;
  strandId: string;
  strandTitle: string;
};

export type FrameworkOption = {
  id: string;
  label: string;
  country: "au" | "us" | "uk" | "other";
  jurisdictionLabel: string;
  defaultJurisdictionId: string;
};

export type JurisdictionOption = {
  id: string;
  label: string;
};

export const FRAMEWORK_PRESETS: Record<"au" | "us" | "uk", FrameworkPreset> = {
  au: {
    framework: "Australian Curriculum v9",
    jurisdiction: "Tasmania",
    subjects: [
      {
        id: "mathematics",
        title: "Mathematics",
        aliases: ["mathematics", "maths", "numeracy", "mathematics and numeracy"],
        strands: [
          {
            id: "number",
            title: "Number",
            outcomes: [
              { code: "AC9M3N01", label: "Recognise, represent and order natural numbers." },
              { code: "AC9M3N02", label: "Recall and use addition and subtraction facts." },
              { code: "AC9M3N03", label: "Represent simple fractions in everyday contexts." },
            ],
          },
          {
            id: "measurement",
            title: "Measurement",
            outcomes: [
              { code: "AC9M3M01", label: "Measure, order and compare length, mass and capacity." },
              { code: "AC9M3M02", label: "Tell time to the minute and solve simple elapsed time problems." },
              { code: "AC9M3M03", label: "Use simple metric units in familiar situations." },
            ],
          },
          {
            id: "statistics",
            title: "Statistics and probability",
            outcomes: [
              { code: "AC9M3ST01", label: "Collect, represent and interpret categorical data." },
              { code: "AC9M3ST02", label: "Describe chance events using everyday language." },
            ],
          },
        ],
      },
      {
        id: "english",
        title: "English",
        aliases: ["english", "literacy", "reading", "writing"],
        strands: [
          {
            id: "reading",
            title: "Reading",
            outcomes: [
              { code: "AC9E3LY01", label: "Use comprehension strategies to make meaning from texts." },
              { code: "AC9E3LY02", label: "Discuss ideas, settings and events in shared texts." },
            ],
          },
          {
            id: "writing",
            title: "Writing",
            outcomes: [
              { code: "AC9E3LY03", label: "Create short imaginative and informative texts." },
              { code: "AC9E3LY04", label: "Use sentence-level punctuation and spelling patterns." },
            ],
          },
          {
            id: "speaking",
            title: "Speaking and listening",
            outcomes: [
              { code: "AC9E3LY05", label: "Contribute to classroom discussions and presentations." },
              { code: "AC9E3LY06", label: "Listen for key information and respond thoughtfully." },
            ],
          },
        ],
      },
      {
        id: "science",
        title: "Science",
        aliases: ["science", "inquiry", "stem"],
        strands: [
          {
            id: "understanding",
            title: "Science understanding",
            outcomes: [
              { code: "AC9S3U01", label: "Compare changes in living things, materials and Earth processes." },
              { code: "AC9S3U02", label: "Recognise how forces and energy affect everyday objects." },
            ],
          },
          {
            id: "inquiry",
            title: "Science inquiry",
            outcomes: [
              { code: "AC9S3I01", label: "Ask questions, plan simple investigations and record observations." },
              { code: "AC9S3I02", label: "Use evidence to share explanations and conclusions." },
            ],
          },
        ],
      },
      {
        id: "hass",
        title: "HASS",
        aliases: ["hass", "history", "geography", "social studies"],
        strands: [
          {
            id: "community",
            title: "Community and history",
            outcomes: [
              { code: "AC9H3K01", label: "Describe people, places and events that shape communities." },
              { code: "AC9H3K02", label: "Use simple sources to explore change over time." },
            ],
          },
          {
            id: "geography",
            title: "Places and environments",
            outcomes: [
              { code: "AC9H3G01", label: "Identify features of places and how people care for them." },
              { code: "AC9H3G02", label: "Use simple maps and data to describe local places." },
            ],
          },
        ],
      },
    ],
  },
  us: {
    framework: "Common Core aligned",
    jurisdiction: "California",
    subjects: [
      {
        id: "mathematics",
        title: "Mathematics",
        aliases: ["mathematics", "math", "maths", "numeracy"],
        strands: [
          {
            id: "operations",
            title: "Operations and algebraic thinking",
            outcomes: [
              { code: "CCSS.M.3.OA.1", label: "Interpret products of whole numbers." },
              { code: "CCSS.M.3.OA.2", label: "Interpret whole-number quotients." },
              { code: "CCSS.M.3.OA.7", label: "Fluently multiply and divide within 100." },
            ],
          },
          {
            id: "fractions",
            title: "Number and fractions",
            outcomes: [
              { code: "CCSS.M.3.NF.1", label: "Understand a fraction as part of a whole." },
              { code: "CCSS.M.3.NF.3", label: "Explain equivalent fractions in simple cases." },
            ],
          },
        ],
      },
      {
        id: "english",
        title: "English Language Arts",
        aliases: ["english", "ela", "literacy", "reading", "writing"],
        strands: [
          {
            id: "reading",
            title: "Reading",
            outcomes: [
              { code: "CCSS.ELA.RL.3.1", label: "Ask and answer questions to demonstrate understanding." },
              { code: "CCSS.ELA.RI.3.3", label: "Describe relationships between events and ideas." },
            ],
          },
          {
            id: "writing",
            title: "Writing",
            outcomes: [
              { code: "CCSS.ELA.W.3.2", label: "Write informative texts with facts and details." },
              { code: "CCSS.ELA.W.3.3", label: "Write narratives with event sequences and reflection." },
            ],
          },
        ],
      },
      {
        id: "science",
        title: "Science",
        aliases: ["science", "stem", "inquiry"],
        strands: [
          {
            id: "life",
            title: "Life science",
            outcomes: [
              { code: "NGSS.3-LS1-1", label: "Develop models of life cycles and growth." },
              { code: "NGSS.3-LS4-3", label: "Construct arguments about habitats and survival." },
            ],
          },
          {
            id: "engineering",
            title: "Engineering design",
            outcomes: [
              { code: "NGSS.3-5-ETS1-2", label: "Generate and compare possible solutions to a problem." },
              { code: "NGSS.3-5-ETS1-3", label: "Plan tests to improve a design solution." },
            ],
          },
        ],
      },
    ],
  },
  uk: {
    framework: "National Curriculum",
    jurisdiction: "England",
    subjects: [
      {
        id: "mathematics",
        title: "Mathematics",
        aliases: ["mathematics", "maths", "numeracy"],
        strands: [
          {
            id: "number",
            title: "Number",
            outcomes: [
              { code: "UK.MA.3.N1", label: "Read, write and compare numbers to 1000." },
              { code: "UK.MA.3.N2", label: "Add and subtract mentally and using written methods." },
            ],
          },
          {
            id: "measure",
            title: "Measurement",
            outcomes: [
              { code: "UK.MA.3.M1", label: "Measure, compare and add lengths, mass and volume." },
              { code: "UK.MA.3.M2", label: "Tell and write the time to the minute." },
            ],
          },
        ],
      },
      {
        id: "english",
        title: "English",
        aliases: ["english", "literacy", "reading", "writing"],
        strands: [
          {
            id: "reading",
            title: "Reading",
            outcomes: [
              { code: "UK.EN.3.R1", label: "Develop positive attitudes to reading and understanding." },
              { code: "UK.EN.3.R2", label: "Retrieve and record information from non-fiction." },
            ],
          },
          {
            id: "writing",
            title: "Writing",
            outcomes: [
              { code: "UK.EN.3.W1", label: "Plan and draft narratives and non-fiction." },
              { code: "UK.EN.3.W2", label: "Use paragraphs and accurate punctuation." },
            ],
          },
        ],
      },
      {
        id: "science",
        title: "Science",
        aliases: ["science", "inquiry", "stem"],
        strands: [
          {
            id: "working_scientifically",
            title: "Working scientifically",
            outcomes: [
              { code: "UK.SC.3.WS1", label: "Ask relevant questions and use simple tests." },
              { code: "UK.SC.3.WS2", label: "Gather, record and present findings in different ways." },
            ],
          },
          {
            id: "plants_animals",
            title: "Plants and animals",
            outcomes: [
              { code: "UK.SC.3.B1", label: "Identify plant parts and their functions." },
              { code: "UK.SC.3.B2", label: "Describe nutrition, skeletons and movement in animals." },
            ],
          },
        ],
      },
    ],
  },
};

export function frameworkPreset(market: string): FrameworkPreset {
  if (market === "us") return FRAMEWORK_PRESETS.us;
  if (market === "uk") return FRAMEWORK_PRESETS.uk;
  return FRAMEWORK_PRESETS.au;
}

export function getCurriculumOutcomeLibrary(preset: FrameworkPreset): CurriculumOutcomeMeta[] {
  return preset.subjects.flatMap((subject) =>
    subject.strands.flatMap((strand) =>
      strand.outcomes.map((outcome) => ({
        id: outcome.code,
        code: outcome.code,
        label: outcome.label,
        subjectId: subject.id,
        subjectTitle: subject.title,
        strandId: strand.id,
        strandTitle: strand.title,
      })),
    ),
  );
}

export function findOutcomeMeta(
  preset: FrameworkPreset,
  outcomeId: string,
): CurriculumOutcomeMeta | null {
  const wanted = String(outcomeId ?? "").trim();
  if (!wanted) return null;
  return getCurriculumOutcomeLibrary(preset).find((item) => item.id === wanted) ?? null;
}

export const COUNTRY_OPTIONS: Array<{
  id: "au" | "us" | "uk" | "other";
  label: string;
}> = [
  { id: "au", label: "Australia" },
  { id: "us", label: "United States" },
  { id: "uk", label: "England" },
  { id: "other", label: "Custom / Other" },
];

export const FRAMEWORK_OPTIONS: FrameworkOption[] = [
  {
    id: "au-v9",
    label: "Australian Curriculum v9",
    country: "au",
    jurisdictionLabel: "State or territory",
    defaultJurisdictionId: "tas",
  },
  {
    id: "us-common-core",
    label: "Common Core aligned",
    country: "us",
    jurisdictionLabel: "State",
    defaultJurisdictionId: "ca",
  },
  {
    id: "uk-national",
    label: "National Curriculum (England)",
    country: "uk",
    jurisdictionLabel: "Jurisdiction",
    defaultJurisdictionId: "england",
  },
  {
    id: "custom-homeschool",
    label: "Custom homeschool framework",
    country: "other",
    jurisdictionLabel: "Region",
    defaultJurisdictionId: "custom",
  },
  {
    id: "custom-ib",
    label: "IB / alternative framework",
    country: "other",
    jurisdictionLabel: "Region",
    defaultJurisdictionId: "custom",
  },
];

export const JURISDICTION_OPTIONS: Record<string, JurisdictionOption[]> = {
  au: [
    { id: "nsw", label: "New South Wales" },
    { id: "vic", label: "Victoria" },
    { id: "qld", label: "Queensland" },
    { id: "wa", label: "Western Australia" },
    { id: "sa", label: "South Australia" },
    { id: "tas", label: "Tasmania" },
    { id: "act", label: "Australian Capital Territory" },
    { id: "nt", label: "Northern Territory" },
  ],
  us: [
    { id: "ca", label: "California" },
    { id: "tx", label: "Texas" },
    { id: "ny", label: "New York" },
    { id: "fl", label: "Florida" },
    { id: "wa", label: "Washington" },
  ],
  uk: [{ id: "england", label: "England" }],
  other: [{ id: "custom", label: "Custom / Other" }],
};

export function frameworkOptionById(frameworkId?: string | null) {
  const wanted = String(frameworkId ?? "").trim();
  return FRAMEWORK_OPTIONS.find((option) => option.id === wanted) ?? null;
}

export function jurisdictionOptionsForCountry(country?: string | null) {
  const key = country === "us" || country === "uk" || country === "other" ? country : "au";
  return JURISDICTION_OPTIONS[key];
}

export function jurisdictionLabelFor(
  country?: string | null,
  jurisdictionId?: string | null,
) {
  const wanted = String(jurisdictionId ?? "").trim();
  if (!wanted) return "";
  return (
    jurisdictionOptionsForCountry(country).find((option) => option.id === wanted)?.label ||
    wanted
  );
}

export function presetFromFrameworkSelection(input: {
  country?: string | null;
  frameworkId?: string | null;
  jurisdictionId?: string | null;
}) {
  if (input.frameworkId === "us-common-core" || input.country === "us") {
    return {
      ...FRAMEWORK_PRESETS.us,
      jurisdiction:
        jurisdictionLabelFor("us", input.jurisdictionId) || FRAMEWORK_PRESETS.us.jurisdiction,
    };
  }
  if (input.frameworkId === "uk-national" || input.country === "uk") {
    return {
      ...FRAMEWORK_PRESETS.uk,
      jurisdiction:
        jurisdictionLabelFor("uk", input.jurisdictionId) || FRAMEWORK_PRESETS.uk.jurisdiction,
    };
  }
  return {
    ...FRAMEWORK_PRESETS.au,
    jurisdiction:
      jurisdictionLabelFor("au", input.jurisdictionId) || FRAMEWORK_PRESETS.au.jurisdiction,
  };
}

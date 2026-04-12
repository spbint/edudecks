export type ComplianceFieldTier = "required" | "recommended" | "optional";

export type ComplianceFieldDefinition = {
  id: string;
  label: string;
  description: string;
  tier: ComplianceFieldTier;
  locked?: boolean;
};

export type ComplianceTemplate = {
  country: string;
  state: string;
  compliance_mode: string;
  template_version: string;
  template_type: string;
  submission_rhythm: string;
  authority_note: string;
  key_required_elements: string[];
  required_fields: string[];
  recommended_fields: string[];
  optional_fields: string[];
};

export type ComplianceProfile = {
  country: string | null;
  state: string | null;
  curriculum_framework: string | null;
  compliance_mode: string | null;
  template_version: string | null;
  required_fields: string[];
  recommended_fields: string[];
  optional_fields: string[];
  custom_labels: Record<string, string>;
  last_reviewed_at: string | null;
};

const STANDARD_FIELD_DEFINITIONS: Record<string, ComplianceFieldDefinition> = {
  student_name: {
    id: "student_name",
    label: "Student name",
    description: "Identify the learner clearly in the report.",
    tier: "optional",
  },
  student_dob: {
    id: "student_dob",
    label: "Student date of birth",
    description: "Useful for authority-ready student identification.",
    tier: "optional",
  },
  year_level: {
    id: "year_level",
    label: "Year level",
    description: "Show the current year level or grade band.",
    tier: "optional",
  },
  reporting_period: {
    id: "reporting_period",
    label: "Reporting period",
    description: "Clarify the period covered by the report.",
    tier: "optional",
  },
  curriculum_framework: {
    id: "curriculum_framework",
    label: "Curriculum framework",
    description: "Reference the framework shaping the learning program.",
    tier: "optional",
  },
  learning_areas_covered: {
    id: "learning_areas_covered",
    label: "Learning areas covered",
    description: "Summarise the areas addressed during the period.",
    tier: "optional",
  },
  learning_goals: {
    id: "learning_goals",
    label: "Learning goals",
    description: "Capture the intended goals for the learner.",
    tier: "optional",
  },
  learning_activities: {
    id: "learning_activities",
    label: "Learning activities",
    description: "List the activities supporting progress.",
    tier: "optional",
  },
  resources_used: {
    id: "resources_used",
    label: "Resources used",
    description: "Outline useful resources or materials.",
    tier: "optional",
  },
  evidence_samples: {
    id: "evidence_samples",
    label: "Evidence samples",
    description: "Include the evidence gathered across the period.",
    tier: "optional",
  },
  evidence_annotations: {
    id: "evidence_annotations",
    label: "Evidence annotations",
    description: "Explain what each evidence sample demonstrates.",
    tier: "optional",
  },
  overall_progress_summary: {
    id: "overall_progress_summary",
    label: "Overall progress summary",
    description: "Provide a calm whole-child progress summary.",
    tier: "optional",
  },
  literacy_progress: {
    id: "literacy_progress",
    label: "Literacy progress",
    description: "Summarise reading, writing, and literacy growth.",
    tier: "optional",
  },
  numeracy_progress: {
    id: "numeracy_progress",
    label: "Numeracy progress",
    description: "Summarise numeracy and mathematical growth.",
    tier: "optional",
  },
  parent_reflection: {
    id: "parent_reflection",
    label: "Parent reflection",
    description: "Add a family reflection on the learning journey.",
    tier: "optional",
  },
  next_steps: {
    id: "next_steps",
    label: "Next steps",
    description: "Outline the next learning focus.",
    tier: "optional",
  },
  annual_overview: {
    id: "annual_overview",
    label: "Annual overview",
    description: "Summarise the overall year of learning.",
    tier: "required",
  },
  educational_program_summary: {
    id: "educational_program_summary",
    label: "Educational program summary",
    description: "Describe the program delivered during the year.",
    tier: "required",
  },
  goals_achieved: {
    id: "goals_achieved",
    label: "Goals achieved",
    description: "Explain which goals were achieved.",
    tier: "required",
  },
  goals_not_achieved: {
    id: "goals_not_achieved",
    label: "Goals not achieved",
    description: "Explain goals still in progress or not achieved.",
    tier: "required",
  },
  work_sample_annotations: {
    id: "work_sample_annotations",
    label: "Work sample annotations",
    description: "Annotate work samples clearly.",
    tier: "required",
  },
  supporting_work_samples: {
    id: "supporting_work_samples",
    label: "Supporting work samples",
    description: "Attach supporting samples of work.",
    tier: "required",
  },
  parent_declaration: {
    id: "parent_declaration",
    label: "Parent declaration",
    description: "Include the required declaration from the parent.",
    tier: "required",
  },
  intellectual_progress: {
    id: "intellectual_progress",
    label: "Intellectual progress",
    description: "Summarise intellectual development.",
    tier: "required",
  },
  social_emotional_progress: {
    id: "social_emotional_progress",
    label: "Social and emotional progress",
    description: "Summarise social and emotional growth.",
    tier: "required",
  },
  physical_progress: {
    id: "physical_progress",
    label: "Physical progress",
    description: "Summarise physical development and wellbeing.",
    tier: "required",
  },
  goals_milestones_achieved: {
    id: "goals_milestones_achieved",
    label: "Goals and milestones achieved",
    description: "Track the milestones achieved during the period.",
    tier: "required",
  },
  educational_program_overview: {
    id: "educational_program_overview",
    label: "Educational program overview",
    description: "Outline the educational program being provided.",
    tier: "required",
  },
  learning_activities_record: {
    id: "learning_activities_record",
    label: "Learning activities record",
    description: "Record the learning activities completed.",
    tier: "required",
  },
  assessments_of_progress: {
    id: "assessments_of_progress",
    label: "Assessments of progress",
    description: "Document progress assessments used.",
    tier: "required",
  },
  progress_achievement_notes: {
    id: "progress_achievement_notes",
    label: "Progress and achievement notes",
    description: "Capture achievement and progress notes.",
    tier: "required",
  },
  syllabus_stage_alignment: {
    id: "syllabus_stage_alignment",
    label: "Syllabus and stage alignment",
    description: "Show alignment to syllabus stage expectations.",
    tier: "required",
  },
};

for (let i = 1; i <= 10; i += 1) {
  STANDARD_FIELD_DEFINITIONS[`standard_${i}_summary`] = {
    id: `standard_${i}_summary`,
    label: `Standard ${i} summary`,
    description: `Summarise progress against Standard ${i}.`,
    tier: "required",
  };
  STANDARD_FIELD_DEFINITIONS[`standard_${i}_plan`] = {
    id: `standard_${i}_plan`,
    label: `Standard ${i} plan`,
    description: `Outline the plan for Standard ${i}.`,
    tier: "required",
  };
}

const AU_CORE_RECOMMENDED = [
  "student_name",
  "student_dob",
  "year_level",
  "reporting_period",
  "curriculum_framework",
  "learning_areas_covered",
  "learning_goals",
  "learning_activities",
  "resources_used",
  "evidence_annotations",
  "overall_progress_summary",
  "parent_reflection",
  "next_steps",
];

const AU_CORE_OPTIONAL = [
  "evidence_samples",
  "literacy_progress",
  "numeracy_progress",
];

export const AUSTRALIA_STATE_OPTIONS = [
  { id: "act", label: "Australian Capital Territory" },
  { id: "nsw", label: "New South Wales" },
  { id: "nt", label: "Northern Territory" },
  { id: "qld", label: "Queensland" },
  { id: "sa", label: "South Australia" },
  { id: "tas", label: "Tasmania" },
  { id: "vic", label: "Victoria" },
  { id: "wa", label: "Western Australia" },
] as const;

export const AUSTRALIA_COMPLIANCE_TEMPLATES: Record<string, ComplianceTemplate> = {
  qld: {
    country: "au",
    state: "qld",
    compliance_mode: "Annual Written Report",
    template_version: "au-qld-v1",
    template_type: "Queensland annual report",
    submission_rhythm: "Annual",
    authority_note:
      "Queensland families generally need a clear annual written report with work samples and parent declaration.",
    key_required_elements: [
      "Annual overview",
      "Educational program summary",
      "Goal achievement detail",
      "Annotated work samples",
      "Parent declaration",
    ],
    required_fields: [
      "annual_overview",
      "educational_program_summary",
      "goals_achieved",
      "goals_not_achieved",
      "work_sample_annotations",
      "supporting_work_samples",
      "parent_declaration",
    ],
    recommended_fields: AU_CORE_RECOMMENDED,
    optional_fields: AU_CORE_OPTIONAL,
  },
  act: {
    country: "au",
    state: "act",
    compliance_mode: "Annual Progress Report",
    template_version: "au-act-v1",
    template_type: "ACT annual progress report",
    submission_rhythm: "Annual",
    authority_note:
      "ACT progress reporting benefits from calm whole-child coverage across intellectual, literacy, numeracy, social, and physical development.",
    key_required_elements: [
      "Progress across intellectual growth",
      "Literacy and numeracy progress",
      "Social and emotional development",
      "Physical development",
      "Goals and milestones achieved",
    ],
    required_fields: [
      "intellectual_progress",
      "literacy_progress",
      "numeracy_progress",
      "social_emotional_progress",
      "physical_progress",
      "goals_milestones_achieved",
    ],
    recommended_fields: AU_CORE_RECOMMENDED.filter(
      (field) => field !== "literacy_progress" && field !== "numeracy_progress",
    ),
    optional_fields: AU_CORE_OPTIONAL.filter(
      (field) => field !== "literacy_progress" && field !== "numeracy_progress",
    ),
  },
  nsw: {
    country: "au",
    state: "nsw",
    compliance_mode: "Registration / Renewal Evidence",
    template_version: "au-nsw-v1",
    template_type: "NSW registration and renewal evidence",
    submission_rhythm: "Registration / renewal cycle",
    authority_note:
      "NSW families often need a clear educational program view plus evidence of activities, assessment, and stage alignment.",
    key_required_elements: [
      "Educational program overview",
      "Learning activities record",
      "Assessments of progress",
      "Progress notes",
      "Syllabus stage alignment",
    ],
    required_fields: [
      "educational_program_overview",
      "learning_activities_record",
      "assessments_of_progress",
      "progress_achievement_notes",
      "syllabus_stage_alignment",
    ],
    recommended_fields: AU_CORE_RECOMMENDED,
    optional_fields: AU_CORE_OPTIONAL,
  },
  tas: {
    country: "au",
    state: "tas",
    compliance_mode: "Standards-Based Summary and Plan",
    template_version: "au-tas-v1",
    template_type: "Tasmania standards-based summary and plan",
    submission_rhythm: "Annual",
    authority_note:
      "Tasmanian planning works best with a paired summary and forward plan against each Standard.",
    key_required_elements: [
      "Summary for each Standard",
      "Plan for each Standard",
      "Clear annual standards-based structure",
    ],
    required_fields: Array.from({ length: 10 }, (_, index) => [
      `standard_${index + 1}_summary`,
      `standard_${index + 1}_plan`,
    ]).flat(),
    recommended_fields: AU_CORE_RECOMMENDED,
    optional_fields: AU_CORE_OPTIONAL,
  },
};

export const DEFAULT_COMPLIANCE_PROFILE: ComplianceProfile = {
  country: null,
  state: null,
  curriculum_framework: null,
  compliance_mode: null,
  template_version: null,
  required_fields: [],
  recommended_fields: [],
  optional_fields: [],
  custom_labels: {},
  last_reviewed_at: null,
};

export function getComplianceFieldDefinition(
  fieldId: string,
  tier?: ComplianceFieldTier,
): ComplianceFieldDefinition {
  const base = STANDARD_FIELD_DEFINITIONS[fieldId];
  if (base) {
    return {
      ...base,
      tier: tier ?? base.tier,
      locked: tier === "required" ? true : base.locked,
    };
  }

  return {
    id: fieldId,
    label: fieldId.replace(/_/g, " "),
    description: "Configured for this reporting structure.",
    tier: tier ?? "optional",
    locked: tier === "required",
  };
}

export function getAustraliaComplianceTemplate(
  state: string | null | undefined,
): ComplianceTemplate | null {
  if (!state) return null;
  return AUSTRALIA_COMPLIANCE_TEMPLATES[state] ?? null;
}

export function buildComplianceProfileFromTemplate(input: {
  country: string | null;
  state: string | null;
  curriculumFramework: string | null;
}): ComplianceProfile {
  const template =
    input.country === "au"
      ? getAustraliaComplianceTemplate(input.state)
      : null;

  if (!template) {
    return {
      ...DEFAULT_COMPLIANCE_PROFILE,
      country: input.country,
      state: input.state,
      curriculum_framework: input.curriculumFramework,
      last_reviewed_at: new Date().toISOString(),
    };
  }

  return {
    country: template.country,
    state: template.state,
    curriculum_framework: input.curriculumFramework,
    compliance_mode: template.compliance_mode,
    template_version: template.template_version,
    required_fields: template.required_fields,
    recommended_fields: template.recommended_fields,
    optional_fields: template.optional_fields,
    custom_labels: {},
    last_reviewed_at: new Date().toISOString(),
  };
}

export function resetComplianceProfileToAuthorityDefaults(
  profile: ComplianceProfile,
): ComplianceProfile {
  return buildComplianceProfileFromTemplate({
    country: profile.country,
    state: profile.state,
    curriculumFramework: profile.curriculum_framework,
  });
}

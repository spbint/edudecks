export type ReportIntent = "authority" | "portfolio";

export type ReportSectionTemplate = {
  sectionKey: string;
  title: string;
  description: string;
  intent: ReportIntent;
  sortOrder: number;
  requiredForCompletion: boolean;
  suggestedArtifactTypes: string[];
  starterPrompt?: string;
};

export type ReportTemplateContext = {
  intent: ReportIntent;
  jurisdictionCode?: string | null;
  countryCode?: string | null;
  complianceUiMode?: string | null;
  reportRequired?: boolean | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function normalizeSectionKey(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isUsContext(context: ReportTemplateContext) {
  return toLower(context.countryCode || context.jurisdictionCode).startsWith("us");
}

function isAuContext(context: ReportTemplateContext) {
  const normalized = toLower(context.countryCode || context.jurisdictionCode);
  return normalized.startsWith("au");
}

function authorityTemplates(context: ReportTemplateContext): ReportSectionTemplate[] {
  const formalNoun = isUsContext(context)
    ? "state reporting"
    : isAuContext(context)
      ? "authority reporting"
      : "formal reporting";
  const filingNoun = isAuContext(context) ? "approval" : "filing";
  const attendanceLabel = isAuContext(context) ? "Instructional Hours / Attendance" : "Attendance / Hours";
  const programLabel = isAuContext(context) ? "Learning Areas / Program" : "Learning Program / Subjects";
  const reviewLabel = isAuContext(context) ? "Review Notes" : "Assessment / Review";

  return [
    {
      sectionKey: "compliance_summary",
      title: "Compliance Summary",
      description: `Summarise the learner's jurisdiction, reporting period, and ${formalNoun} posture.`,
      intent: "authority",
      sortOrder: 1,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["report", "jurisdiction", "registration_cycle"],
      starterPrompt: "Keep this calm, formal, and focused on the official reporting context.",
    },
    {
      sectionKey: "notification_filing",
      title: isAuContext(context) ? "Notification / Approval" : "Notification / Filing",
      description: `Capture the formal notice or ${filingNoun} step that applies in this jurisdiction.`,
      intent: "authority",
      sortOrder: 2,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["notification", "report"],
      starterPrompt: "State the notification status, submitted date, and due date if they are known.",
    },
    {
      sectionKey: "attendance_hours",
      title: attendanceLabel,
      description: "Record the formal attendance or instructional hours summary for the current cycle.",
      intent: "authority",
      sortOrder: 3,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["attendance"],
      starterPrompt: "Keep days present, hours, and the covered period visible in one calm summary.",
    },
    {
      sectionKey: "program_subjects",
      title: programLabel,
      description: "Show the learning program, subject coverage, or plan backbone that supports the report.",
      intent: "authority",
      sortOrder: 4,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["plan"],
      starterPrompt: "Outline the major subjects or program areas without turning this into a long narrative.",
    },
    {
      sectionKey: "assessment_review",
      title: reviewLabel,
      description: "Capture the review, evaluation, or assessment pathway required for this reporting cycle.",
      intent: "authority",
      sortOrder: 5,
      requiredForCompletion: false,
      suggestedArtifactTypes: ["assessment", "evidence"],
      starterPrompt: "Use short factual notes about what was reviewed, observed, or evaluated.",
    },
    {
      sectionKey: "evidence_pack",
      title: "Evidence Pack",
      description: "Collect the strongest evidence and work samples that support the formal record.",
      intent: "authority",
      sortOrder: 6,
      requiredForCompletion: false,
      suggestedArtifactTypes: ["evidence", "portfolio"],
      starterPrompt: "Name the most useful work samples, then keep the explanation brief and specific.",
    },
    {
      sectionKey: "final_notes",
      title: "Final Notes",
      description: "Close with any remaining formal notes, follow-up items, or submission reminders.",
      intent: "authority",
      sortOrder: 7,
      requiredForCompletion: false,
      suggestedArtifactTypes: ["report"],
      starterPrompt: "Only add what helps the reviewer understand the current record.",
    },
  ];
}

function portfolioTemplates(context: ReportTemplateContext): ReportSectionTemplate[] {
  const overviewLabel = isAuContext(context) ? "Learning Portfolio Overview" : "Portfolio Overview";
  const storyLabel = isUsContext(context) ? "Learning Story" : "Learning Story";
  const samplesLabel = isAuContext(context) ? "Work Samples and Artefacts" : "Work Samples";
  const coverageLabel = isAuContext(context) ? "Learning Areas" : "Subject Coverage";
  const reflectionLabel = isAuContext(context) ? "Reflections and Growth" : "Reflections and Growth";

  return [
    {
      sectionKey: "portfolio_overview",
      title: overviewLabel,
      description: "Introduce the learner's current portfolio in a warm, family-facing way.",
      intent: "portfolio",
      sortOrder: 1,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["portfolio", "report"],
      starterPrompt: "Set the tone with a short overview of what this portfolio is showing.",
    },
    {
      sectionKey: "learning_story",
      title: storyLabel,
      description: "Tell the learning story with a concise, parent-friendly summary.",
      intent: "portfolio",
      sortOrder: 2,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["evidence", "portfolio"],
      starterPrompt: "Write a simple story about what the learner has been exploring or building.",
    },
    {
      sectionKey: "work_samples",
      title: samplesLabel,
      description: "Gather the strongest samples that show the learner's work and progress.",
      intent: "portfolio",
      sortOrder: 3,
      requiredForCompletion: true,
      suggestedArtifactTypes: ["evidence", "portfolio"],
      starterPrompt: "Choose a few representative samples and explain why they matter.",
    },
    {
      sectionKey: "subject_coverage",
      title: coverageLabel,
      description: "Show the subject or learning area coverage without making the record feel formal.",
      intent: "portfolio",
      sortOrder: 4,
      requiredForCompletion: false,
      suggestedArtifactTypes: ["plan", "subject"],
      starterPrompt: "Name the main subject areas and keep the wording light and readable.",
    },
    {
      sectionKey: "reflections_growth",
      title: reflectionLabel,
      description: "Capture reflections, growth, and memorable moments from the period.",
      intent: "portfolio",
      sortOrder: 5,
      requiredForCompletion: false,
      suggestedArtifactTypes: ["portfolio", "evidence"],
      starterPrompt: "Keep this personal and reflective rather than formal.",
    },
    {
      sectionKey: "next_steps",
      title: "Next Steps",
      description: "Close with a calm note about what the family wants to do next.",
      intent: "portfolio",
      sortOrder: 6,
      requiredForCompletion: false,
      suggestedArtifactTypes: ["portfolio", "report"],
      starterPrompt: "Leave a simple next step that feels useful for the family record.",
    },
  ];
}

export function getReportSectionTemplates(context: ReportTemplateContext): ReportSectionTemplate[] {
  const templates = context.intent === "portfolio"
    ? portfolioTemplates(context)
    : authorityTemplates(context);

  return templates.sort((left, right) => left.sortOrder - right.sortOrder);
}

export function resolveReportSectionTemplate(
  title: string,
  context: ReportTemplateContext,
): ReportSectionTemplate | null {
  const sectionKey = normalizeSectionKey(title);
  const templates = getReportSectionTemplates(context);
  return (
    templates.find((template) => template.sectionKey === sectionKey) ||
    templates.find((template) => normalizeSectionKey(template.title) === sectionKey) ||
    null
  );
}

export function reportIntentHeading(intent: ReportIntent) {
  return intent === "portfolio" ? "Portfolio documentation" : "Authority-ready reporting";
}

export function reportIntentIntro(intent: ReportIntent) {
  return intent === "portfolio"
    ? "A calm family-facing record that favours learning story, work samples, and supportive context."
    : "A formal compliance report that keeps required artifacts, filings, and review notes visible.";
}

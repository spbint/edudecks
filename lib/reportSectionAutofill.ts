import type { ReportEvidenceMapping, SectionMappingResult } from "@/lib/reportEvidenceMapping";
import type { ReportsBuilderModel } from "@/lib/reporting";
import { resolveReportSectionTemplate, reportIntentHeading, reportIntentIntro } from "@/lib/reportTemplates";
import { supabase } from "@/lib/supabaseClient";

type QueryClient = Pick<typeof supabase, "from">;

export type ReportSectionStarterBlock = {
  type:
    | "summary"
    | "bullet_list"
    | "count_list"
    | "record_list"
    | "prompt"
    | "warning"
    | "next_step";
  title?: string;
  lines: string[];
};

export type ReportSectionStarterContent = {
  sectionKey: string;
  title: string;
  status: "complete" | "in_progress" | "missing";
  confidence: "high" | "medium" | "low";
  blocks: ReportSectionStarterBlock[];
  sourceCounts: {
    plans: number;
    experiences: number;
    evidence: number;
    pairs: number;
    reviews: number;
  };
  notes: string[];
  canAutofill: boolean;
};

export type ReportSectionAutofillModel = {
  learnerId: string;
  reportDocumentId: string | null;
  reportingPeriodId: string | null;
  jurisdictionCode: string | null;
  sections: ReportSectionStarterContent[];
};

type LoadReportSectionAutofillInput = {
  model: ReportsBuilderModel;
  mapping: ReportEvidenceMapping;
};

type RawRow = Record<string, unknown>;

type PlanSource = {
  id: string;
  title: string;
  areaLabels: string[];
  goalLabels: string[];
  searchText: string;
};

type ExperienceSource = {
  id: string;
  title: string;
  planId: string;
  tagLabels: string[];
  searchText: string;
};

type EvidenceSource = {
  id: string;
  title: string;
  planId: string;
  experienceId: string;
  tagLabels: string[];
  annotationLabels: string[];
  searchText: string;
};

type PairSource = {
  id: string;
  evidenceIds: string[];
};

type ReviewSource = {
  id: string;
  title: string;
  findings: string[];
  searchText: string;
};

type SectionSourceBundle = {
  plans: PlanSource[];
  experiences: ExperienceSource[];
  evidence: EvidenceSource[];
  pairs: PairSource[];
  reviews: ReviewSource[];
  concernCount: number;
  conditionCount: number;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function asObject(value: unknown): RawRow {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RawRow;
  }
  return {};
}

function asDate(value: unknown) {
  const clean = safe(value);
  if (!clean) return null;
  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function maybeBetween(
  value: string,
  startDate: string | null,
  endDate: string | null,
) {
  const parsed = asDate(value);
  if (!parsed) return true;
  const start = asDate(startDate);
  const end = asDate(endDate);
  if (start && parsed < start) return false;
  if (end && parsed > end) return false;
  return true;
}

function joinSearchText(...parts: unknown[]) {
  return parts
    .flatMap((part) => {
      if (Array.isArray(part)) {
        return part.map((item) => safe(item));
      }
      if (part && typeof part === "object") {
        return Object.values(part as RawRow).map((item) => safe(item));
      }
      return [safe(part)];
    })
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeSectionKey(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function listPreview(values: string[], max = 4) {
  const unique = Array.from(new Set(values.filter(Boolean)));
  return unique.slice(0, max);
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  const start = asDate(startDate);
  const end = asDate(endDate);
  if (!start && !end) return "Dates not set";
  if (start && end) {
    return `${start.toLocaleDateString(undefined, { dateStyle: "medium" })} to ${end.toLocaleDateString(undefined, { dateStyle: "medium" })}`;
  }
  if (start) {
    return `From ${start.toLocaleDateString(undefined, { dateStyle: "medium" })}`;
  }
  return `Until ${end?.toLocaleDateString(undefined, { dateStyle: "medium" })}`;
}

function confidenceFrom(
  status: "complete" | "in_progress" | "missing",
  counts: ReportSectionStarterContent["sourceCounts"],
  complianceSignals: number,
) {
  const supportTotal =
    counts.plans +
    counts.experiences +
    counts.evidence +
    counts.pairs +
    counts.reviews;
  const totalSignal = supportTotal + complianceSignals;

  if (status === "complete" && totalSignal >= 4) return "high" as const;
  if (status !== "missing" && totalSignal >= 2) return "medium" as const;
  return "low" as const;
}

async function many(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return Array.isArray(response.data)
    ? response.data.map((row: unknown) => asObject(row))
    : [];
}

async function countRows(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return Number(response.count ?? 0);
}

async function loadRowsForLearner(db: QueryClient, table: string, learnerId: string) {
  try {
    return await many(db, table, (query) => query.select("*").eq("learner_id", learnerId));
  } catch {
    try {
      return await many(db, table, (query) => query.select("*").eq("student_id", learnerId));
    } catch {
      return [];
    }
  }
}

async function loadRowsByForeignIds(
  db: QueryClient,
  table: string,
  column: string,
  ids: string[],
) {
  if (!ids.length) return [];
  try {
    return await many(db, table, (query) => query.select("*").in(column, ids));
  } catch {
    return [];
  }
}

function filterCycleRows(
  rows: RawRow[],
  startDate: string | null,
  endDate: string | null,
  candidateFields: string[],
) {
  return rows.filter((row) => {
    const field = candidateFields.find((candidate) => safe(row[candidate]));
    if (!field) return true;
    return maybeBetween(safe(row[field]), startDate, endDate);
  });
}

function normalizePlans(rows: RawRow[], planAreas: RawRow[], planGoals: RawRow[]) {
  const areasByPlan = new Map<string, string[]>();
  const goalsByPlan = new Map<string, string[]>();

  planAreas.forEach((row) => {
    const planId = safe(row.plan_id);
    if (!planId) return;
    const existing = areasByPlan.get(planId) || [];
    existing.push(safe(row.label) || safe(row.learning_area) || safe(row.name));
    areasByPlan.set(planId, existing);
  });

  planGoals.forEach((row) => {
    const planId = safe(row.plan_id);
    if (!planId) return;
    const existing = goalsByPlan.get(planId) || [];
    existing.push(safe(row.label) || safe(row.goal) || safe(row.title) || safe(row.name));
    goalsByPlan.set(planId, existing);
  });

  return rows.map((row, index) => {
    const id = safe(row.id) || `plan-${index + 1}`;
    const title =
      safe(row.title) ||
      safe(row.label) ||
      safe(row.name) ||
      safe(row.summary) ||
      `Learning plan ${index + 1}`;

    return {
      id,
      title,
      areaLabels: listPreview(areasByPlan.get(id) || []),
      goalLabels: listPreview(goalsByPlan.get(id) || []),
      searchText: joinSearchText(row, areasByPlan.get(id) || [], goalsByPlan.get(id) || []),
    } satisfies PlanSource;
  });
}

function normalizeExperiences(rows: RawRow[], tags: RawRow[]) {
  const tagsByExperience = new Map<string, string[]>();

  tags.forEach((row) => {
    const experienceId = safe(row.learning_experience_id) || safe(row.experience_id);
    if (!experienceId) return;
    const existing = tagsByExperience.get(experienceId) || [];
    existing.push(safe(row.label) || safe(row.tag) || safe(row.name));
    tagsByExperience.set(experienceId, existing);
  });

  return rows.map((row, index) => {
    const id = safe(row.id) || `experience-${index + 1}`;
    return {
      id,
      title:
        safe(row.title) ||
        safe(row.label) ||
        safe(row.summary) ||
        safe(row.description) ||
        `Learning experience ${index + 1}`,
      planId: safe(row.plan_id),
      tagLabels: listPreview(tagsByExperience.get(id) || []),
      searchText: joinSearchText(row, tagsByExperience.get(id) || []),
    } satisfies ExperienceSource;
  });
}

function normalizeEvidence(rows: RawRow[], tags: RawRow[], annotations: RawRow[]) {
  const tagsByEvidence = new Map<string, string[]>();
  const annotationsByEvidence = new Map<string, string[]>();

  tags.forEach((row) => {
    const evidenceId = safe(row.evidence_id) || safe(row.item_id);
    if (!evidenceId) return;
    const existing = tagsByEvidence.get(evidenceId) || [];
    existing.push(safe(row.label) || safe(row.tag) || safe(row.name));
    tagsByEvidence.set(evidenceId, existing);
  });

  annotations.forEach((row) => {
    const evidenceId = safe(row.evidence_id) || safe(row.item_id);
    if (!evidenceId) return;
    const existing = annotationsByEvidence.get(evidenceId) || [];
    existing.push(safe(row.label) || safe(row.note) || safe(row.annotation));
    annotationsByEvidence.set(evidenceId, existing);
  });

  return rows.map((row, index) => {
    const id = safe(row.id) || `evidence-${index + 1}`;
    return {
      id,
      title:
        safe(row.title) ||
        safe(row.label) ||
        safe(row.caption) ||
        safe(row.description) ||
        safe(row.file_name) ||
        `Evidence item ${index + 1}`,
      planId: safe(row.plan_id),
      experienceId: safe(row.experience_id),
      tagLabels: listPreview(tagsByEvidence.get(id) || []),
      annotationLabels: listPreview(annotationsByEvidence.get(id) || []),
      searchText: joinSearchText(
        row,
        tagsByEvidence.get(id) || [],
        annotationsByEvidence.get(id) || [],
      ),
    } satisfies EvidenceSource;
  });
}

function normalizePairs(rows: RawRow[]) {
  return rows.map((row, index) => ({
    id: safe(row.id) || `pair-${index + 1}`,
    evidenceIds: [
      safe(row.left_evidence_id),
      safe(row.right_evidence_id),
      safe(row.primary_evidence_id),
      safe(row.secondary_evidence_id),
      safe(row.evidence_id),
    ].filter(Boolean),
  })) satisfies PairSource[];
}

function normalizeReviews(rows: RawRow[], findings: RawRow[]) {
  const findingsByReview = new Map<string, string[]>();

  findings.forEach((row) => {
    const reviewId = safe(row.review_id);
    if (!reviewId) return;
    const existing = findingsByReview.get(reviewId) || [];
    existing.push(safe(row.title) || safe(row.label) || safe(row.finding) || safe(row.note));
    findingsByReview.set(reviewId, existing);
  });

  return rows.map((row, index) => {
    const id = safe(row.id) || `review-${index + 1}`;
    return {
      id,
      title:
        safe(row.title) ||
        safe(row.label) ||
        safe(row.summary) ||
        `Review ${index + 1}`,
      findings: listPreview(findingsByReview.get(id) || []),
      searchText: joinSearchText(row, findingsByReview.get(id) || []),
    } satisfies ReviewSource;
  });
}

function sectionTerms(title: string) {
  const normalized = toLower(title);
  const terms: string[] = [];

  if (normalized.includes("literacy") || normalized.includes("english")) {
    terms.push("literacy", "english", "reading", "writing");
  }
  if (normalized.includes("numeracy") || normalized.includes("mathemat")) {
    terms.push("numeracy", "math", "mathematics", "number");
  }
  if (normalized.includes("resource") || normalized.includes("environment")) {
    terms.push("resource", "resources", "material", "materials", "environment", "tool");
  }
  if (normalized.includes("social")) {
    terms.push("social", "community", "group", "peer", "excursion");
  }
  if (normalized.includes("standard") || normalized.includes("curriculum")) {
    terms.push("standard", "curriculum", "framework", "coverage");
  }
  if (normalized.includes("next") || normalized.includes("upcoming") || normalized.includes("proposed")) {
    terms.push("next", "upcoming", "proposed", "future", "goal");
  }
  if (normalized.includes("review") || normalized.includes("concern") || normalized.includes("support")) {
    terms.push("review", "finding", "concern", "condition", "support");
  }
  if (normalized.includes("evidence") || normalized.includes("record")) {
    terms.push("evidence", "record", "sample", "capture");
  }
  if (normalized.includes("plan") || normalized.includes("program") || normalized.includes("overview")) {
    terms.push("plan", "program", "goal", "intent");
  }
  if (normalized.includes("portfolio")) {
    terms.push("portfolio", "sample", "evidence", "collection");
  }
  if (normalized.includes("attendance") || normalized.includes("hours")) {
    terms.push("attendance", "hours", "days", "instructional");
  }
  if (normalized.includes("notification") || normalized.includes("notice")) {
    terms.push("notification", "notice", "filing", "intent");
  }
  if (normalized.includes("assessment") || normalized.includes("evaluation") || normalized.includes("testing")) {
    terms.push("assessment", "evaluation", "testing", "review");
  }
  if (normalized.includes("subject")) {
    terms.push("subject", "curriculum", "coverage", "course");
  }
  if (normalized.includes("progress") || normalized.includes("achievement")) {
    terms.push("progress", "achievement", "growth");
  }
  if (normalized.includes("additional learning area")) {
    terms.push("science", "history", "geography", "art", "technology", "health");
  }
  if (normalized.includes("summary") || normalized.includes("overview")) {
    terms.push("summary", "overview");
  }

  return Array.from(new Set(terms));
}

function matchesTerms(searchText: string, terms: string[]) {
  if (!terms.length) return true;
  return terms.some((term) => searchText.includes(term));
}

function narrowBundleForSection(
  section: SectionMappingResult,
  source: SectionSourceBundle,
) {
  const titleTerms = sectionTerms(section.title);
  const broadSection =
    titleTerms.length === 0 ||
    titleTerms.includes("summary") ||
    titleTerms.includes("overview");

  const matchedPlans = source.plans.filter((plan) =>
    broadSection ? true : matchesTerms(plan.searchText, titleTerms),
  );

  const matchedExperiences = source.experiences.filter((experience) =>
    broadSection
      ? true
      : matchesTerms(experience.searchText, titleTerms) ||
        matchedPlans.some((plan) => plan.id === experience.planId),
  );

  const matchedEvidence = source.evidence.filter((item) =>
    broadSection
      ? true
      : matchesTerms(item.searchText, titleTerms) ||
        matchedPlans.some((plan) => plan.id === item.planId) ||
        matchedExperiences.some((experience) => experience.id === item.experienceId),
  );

  const matchedPairs = source.pairs.filter((pair) =>
    pair.evidenceIds.some((evidenceId) =>
      matchedEvidence.some((evidence) => evidence.id === evidenceId),
    ),
  );

  const matchedReviews = source.reviews.filter((review) =>
    broadSection ? true : matchesTerms(review.searchText, titleTerms),
  );

  return {
    plans: matchedPlans,
    experiences: matchedExperiences,
    evidence: matchedEvidence,
    pairs: matchedPairs,
    reviews: matchedReviews,
  };
}

function buildSummaryLine(input: {
  section: SectionMappingResult;
  counts: ReportSectionStarterContent["sourceCounts"];
  reportingPeriodLabel: string | null;
}) {
  return `Starter summary: ${input.section.title} is currently supported by ${input.counts.plans} learning plan${input.counts.plans === 1 ? "" : "s"}, ${input.counts.evidence} evidence item${input.counts.evidence === 1 ? "" : "s"}, ${input.counts.pairs} mapped evidence pair${input.counts.pairs === 1 ? "" : "s"}, and ${input.counts.reviews} review record${input.counts.reviews === 1 ? "" : "s"}${input.reportingPeriodLabel ? ` for ${input.reportingPeriodLabel}` : ""}.`;
}

function nextStepForSection(input: {
  section: SectionMappingResult;
  counts: ReportSectionStarterContent["sourceCounts"];
  requiredForCompletion: boolean;
}) {
  if (!input.requiredForCompletion) {
    return "This section is optional in the current mode, so keep it only if it strengthens the record.";
  }
  if (input.counts.evidence === 0 && input.counts.plans > 0) {
    return "Add at least one evidence item linked to the current plan to strengthen this section.";
  }
  if (input.counts.plans === 0) {
    return "Add or update a learning plan so this section has a clearer program backbone.";
  }
  if (input.section.status === "missing") {
    return "Review the supporting records for this section and add one directly linked item next.";
  }
  if (input.section.status === "in_progress") {
    return "Tighten this section by adding one more directly relevant supporting record.";
  }
  return "Refine this starter block into a submitted draft when you are ready.";
}

function complianceContextForSection(input: {
  section: SectionMappingResult;
  model: ReportsBuilderModel;
}) {
  const title = input.section.title.toLowerCase();
  const lines: string[] = [];

  const notificationSubmitted =
    input.model.notificationSummary.submitted > 0 ||
    ["submitted", "acknowledged", "not_required", "waived"].includes(
      String(input.model.notificationSummary.latestStatus ?? "").toLowerCase(),
    );
  const attendanceStarted =
    input.model.attendanceSummary.records > 0 ||
    input.model.attendanceSummary.days > 0 ||
    input.model.attendanceSummary.hours > 0;
  const planCoverage = input.model.planCount > 0 || input.model.subjectLogCount > 0;

  if (title.includes("notification") || title.includes("notice")) {
    lines.push(
      notificationSubmitted
        ? "Notification is already reflected in the readiness model."
        : input.model.requiresNotification
          ? "Notification is still open and can strengthen export readiness."
          : "Notification is optional here, so it is treated as supportive context.",
    );
  }

  if (title.includes("attendance") || title.includes("hours") || title.includes("progress")) {
    lines.push(
      attendanceStarted
        ? `Attendance summary is present with ${input.model.attendanceSummary.days} day${input.model.attendanceSummary.days === 1 ? "" : "s"} and ${input.model.attendanceSummary.hours} hour${input.model.attendanceSummary.hours === 1 ? "" : "s"}.`
        : input.model.requiresAttendanceTracking
          ? "Attendance tracking is required here, but no summary has been saved yet."
          : "Attendance is optional here and is treated as documentary support.",
    );
  }

  if (title.includes("plan") || title.includes("subject") || title.includes("curriculum")) {
    lines.push(
      planCoverage
        ? `Plan support is visible through ${input.model.planCount} plan${input.model.planCount === 1 ? "" : "s"} and ${input.model.subjectLogCount} subject log${input.model.subjectLogCount === 1 ? "" : "s"}.`
        : input.model.ruleSet?.requiresYearlyPlan || input.model.ruleSet?.requiresSubjectList
          ? "Plan and subject coverage are still needed for a stronger draft."
          : "Plan coverage is optional here, so it is helpful but not required.",
    );
  }

  return lines;
}

function hasComplianceSupportForSection(input: {
  section: SectionMappingResult;
  model: ReportsBuilderModel;
}) {
  const title = input.section.title.toLowerCase();

  if (title.includes("notification") || title.includes("notice")) {
    return (
      input.model.notificationSummary.submitted > 0 ||
      ["submitted", "acknowledged", "not_required", "waived"].includes(
        String(input.model.notificationSummary.latestStatus ?? "").toLowerCase(),
      ) ||
      Boolean(input.model.requiresNotification && input.model.notificationSummary.total > 0)
    );
  }

  if (title.includes("attendance") || title.includes("hours") || title.includes("progress")) {
    return (
      input.model.attendanceSummary.records > 0 ||
      input.model.attendanceSummary.days > 0 ||
      input.model.attendanceSummary.hours > 0 ||
      Boolean(input.model.requiresAttendanceTracking)
    );
  }

  if (title.includes("plan") || title.includes("subject") || title.includes("curriculum")) {
    return (
      input.model.planCount > 0 ||
      input.model.subjectLogCount > 0 ||
      Boolean(input.model.ruleSet?.requiresYearlyPlan || input.model.ruleSet?.requiresSubjectList)
    );
  }

  return false;
}

function buildStarterBlocks(input: {
  section: SectionMappingResult;
  model: ReportsBuilderModel;
  source: ReturnType<typeof narrowBundleForSection>;
  concernCount: number;
  conditionCount: number;
}) {
  const { section, model, source } = input;
  const template = resolveReportSectionTemplate(section.title, {
    intent: model.reportIntent,
    jurisdictionCode: model.effectiveJurisdiction?.code || null,
    countryCode: model.effectiveJurisdiction?.countryCode || null,
    complianceUiMode: model.complianceUiMode,
    reportRequired: model.reportRequired,
  });
  const counts = {
    plans: source.plans.length,
    experiences: source.experiences.length,
    evidence: source.evidence.length,
    pairs: source.pairs.length,
    reviews: source.reviews.length,
  };

  const learningAreas = listPreview(
    source.plans.flatMap((plan) => plan.areaLabels),
    5,
  );
  const goals = listPreview(source.plans.flatMap((plan) => plan.goalLabels), 4);
  const evidenceTitles = listPreview(source.evidence.map((item) => item.title), 4);
  const planTitles = listPreview(source.plans.map((plan) => plan.title), 3);
  const reviewFindings = listPreview(
    source.reviews.flatMap((review) => review.findings),
    3,
  );
  const complianceContext = complianceContextForSection({ section, model });

  const blocks: ReportSectionStarterBlock[] = [
    {
      type: "prompt",
      title: reportIntentHeading(model.reportIntent),
      lines: [
        reportIntentIntro(model.reportIntent),
        template?.description || "Use this section to keep the report structure readable and mode-appropriate.",
      ],
    },
    {
      type: "summary",
      title: "Starter summary",
      lines: [
        buildSummaryLine({
          section,
          counts,
          reportingPeriodLabel: model.reportingPeriod?.label || null,
        }),
      ],
    },
    {
      type: "count_list",
      title: "Current support",
      lines: [
        `Reporting period: ${model.reportingPeriod?.label || "Current reporting period"}`,
        `Date span covered: ${formatDateRange(model.registrationCycle?.startDate || null, model.registrationCycle?.endDate || null)}`,
        `Learning plans linked: ${counts.plans}`,
        `Learning experiences linked: ${counts.experiences}`,
        `Evidence currently mapped: ${counts.evidence}`,
        `Evidence pairs currently mapped: ${counts.pairs}`,
        `Reviews currently mapped: ${counts.reviews}`,
      ],
    },
  ];

  if (complianceContext.length) {
    blocks.push({
      type: "prompt",
      title: "Compliance context",
      lines: complianceContext,
    });
  }

  if (planTitles.length || learningAreas.length || goals.length) {
    blocks.push({
      type: "record_list",
      title: "Program records found",
      lines: [
        ...(planTitles.length
          ? [`Plans found: ${planTitles.join(", ")}`]
          : []),
        ...(learningAreas.length
          ? [`Learning areas visible: ${learningAreas.join(", ")}`]
          : []),
        ...(goals.length
          ? [`Goals already visible: ${goals.join(", ")}`]
          : []),
      ],
    });
  }

  if (evidenceTitles.length || reviewFindings.length) {
    blocks.push({
      type: "bullet_list",
      title: "Supporting records already visible",
      lines: [
        ...(evidenceTitles.length
          ? evidenceTitles.map((item) => `Evidence: ${item}`)
          : []),
        ...(reviewFindings.length
          ? reviewFindings.map((item) => `Review note: ${item}`)
          : []),
      ],
    });
  }

  if (section.status === "missing" || (!counts.evidence && !counts.plans)) {
    blocks.push({
      type: "warning",
      title: "Support warning",
      lines: [
        "This section scaffold exists, but current supporting records are limited.",
        counts.plans === 0
          ? "No clearly relevant planning records have been matched yet."
          : "Planning records exist, but direct section support is still light.",
      ],
    });
  }

  if (input.concernCount > 0 || input.conditionCount > 0) {
    blocks.push({
      type: "prompt",
      title: "Follow-up checks",
      lines: [
        input.concernCount > 0
          ? `${input.concernCount} current concern${input.concernCount === 1 ? "" : "s"} may need acknowledgement in this section.`
          : "No active concerns are currently shaping this section.",
        input.conditionCount > 0
          ? `${input.conditionCount} registration condition${input.conditionCount === 1 ? "" : "s"} remain active.`
          : "No active registration conditions are currently shaping this section.",
      ],
    });
  }

  blocks.push({
    type: "next_step",
    title: "Suggested next step",
    lines: [nextStepForSection({ section, counts, requiredForCompletion: template?.requiredForCompletion ?? true })],
  });

  return {
    blocks,
    counts,
    notes: [
      `Starter content is built from current learner records for ${section.title}.`,
      template?.starterPrompt ? `Prompt: ${template.starterPrompt}` : "No intent-specific starter prompt was needed here.",
      complianceContext.length
        ? "Compliance inputs are reflected in this section's starter guidance."
        : "No direct compliance inputs were needed for this section.",
      section.status === "complete"
        ? "This section already has a strong support chain."
        : section.status === "in_progress"
          ? "This section has enough structure to keep refining."
          : "This section still needs more direct supporting records.",
    ],
  };
}

async function loadConcernCount(db: QueryClient, learnerId: string) {
  try {
    return await countRows(db, "concerns", (query) =>
      query.select("id", { count: "exact", head: true }).eq("learner_id", learnerId),
    );
  } catch {
    return 0;
  }
}

async function loadConditionCount(db: QueryClient, learnerId: string) {
  try {
    return await countRows(db, "registration_conditions", (query) =>
      query.select("id", { count: "exact", head: true }).eq("learner_id", learnerId),
    );
  } catch {
    return 0;
  }
}

export async function loadReportSectionAutofill(
  input: LoadReportSectionAutofillInput & { client?: QueryClient },
): Promise<ReportSectionAutofillModel> {
  const learnerId = safe(input.model.learner?.id);
  const db = input.client ?? supabase;
  if (!learnerId) {
    return {
      learnerId: "",
      reportDocumentId: null,
      reportingPeriodId: null,
      jurisdictionCode: null,
      sections: [],
    };
  }

  const cycleStart = input.model.registrationCycle?.startDate || null;
  const cycleEnd = input.model.registrationCycle?.endDate || null;

  const rawPlans = filterCycleRows(
    await loadRowsForLearner(db, "learning_plans", learnerId),
    cycleStart,
    cycleEnd,
    ["date_start", "created_at", "updated_at"],
  );
  const planIds = rawPlans.map((row) => safe(row.id)).filter(Boolean);
  const [planAreas, planGoals] = await Promise.all([
    loadRowsByForeignIds(db, "plan_learning_areas", "plan_id", planIds),
    loadRowsByForeignIds(db, "plan_goals", "plan_id", planIds),
  ]);

  const rawExperiences = filterCycleRows(
    await loadRowsForLearner(db, "learning_experiences", learnerId),
    cycleStart,
    cycleEnd,
    ["experience_date", "occurred_on", "created_at"],
  );
  const experienceIds = rawExperiences.map((row) => safe(row.id)).filter(Boolean);
  const experienceTags = await loadRowsByForeignIds(
    db,
    "learning_experience_tags",
    "experience_id",
    experienceIds,
  );

  const rawEvidence = filterCycleRows(
    await loadRowsForLearner(db, "evidence_items", learnerId),
    cycleStart,
    cycleEnd,
    ["captured_at", "occurred_on", "created_at"],
  );
  const evidenceIds = rawEvidence.map((row) => safe(row.id)).filter(Boolean);
  const [evidenceTags, evidenceAnnotations, evidencePairs] = await Promise.all([
    loadRowsByForeignIds(db, "evidence_tags", "evidence_id", evidenceIds),
    loadRowsByForeignIds(db, "evidence_annotations", "evidence_id", evidenceIds),
    loadRowsByForeignIds(db, "evidence_pairs", "evidence_id", evidenceIds),
  ]);

  const rawReviews = filterCycleRows(
    await loadRowsForLearner(db, "reviews", learnerId),
    cycleStart,
    cycleEnd,
    ["review_date", "created_at", "updated_at"],
  );
  const reviewIds = rawReviews.map((row) => safe(row.id)).filter(Boolean);
  const [reviewFindings, concernCount, conditionCount] = await Promise.all([
    loadRowsByForeignIds(db, "review_findings", "review_id", reviewIds),
    loadConcernCount(db, learnerId),
    loadConditionCount(db, learnerId),
  ]);

  const sourceBundle: SectionSourceBundle = {
    plans: normalizePlans(rawPlans, planAreas, planGoals),
    experiences: normalizeExperiences(rawExperiences, experienceTags),
    evidence: normalizeEvidence(rawEvidence, evidenceTags, evidenceAnnotations),
    pairs: normalizePairs(evidencePairs),
    reviews: normalizeReviews(rawReviews, reviewFindings),
    concernCount,
    conditionCount,
  };

  const sections = input.mapping.sections.map((section) => {
    const narrowed = narrowBundleForSection(section, sourceBundle);
    const starter = buildStarterBlocks({
      section,
      model: input.model,
      source: narrowed,
      concernCount: sourceBundle.concernCount,
      conditionCount: sourceBundle.conditionCount,
    });
    const hasComplianceSupport = hasComplianceSupportForSection({
      section,
      model: input.model,
    });

    const sectionKey = normalizeSectionKey(section.title);
    const canAutofill =
      starter.counts.plans +
        starter.counts.experiences +
        starter.counts.evidence +
        starter.counts.pairs +
        starter.counts.reviews >
      0;

    return {
      sectionKey,
      title: section.title,
      status: section.status,
      confidence: confidenceFrom(section.status, starter.counts, hasComplianceSupport ? 1 : 0),
      blocks: starter.blocks,
      sourceCounts: starter.counts,
      notes: [
        ...starter.notes,
        ...section.notes.slice(0, 2),
      ],
      canAutofill,
    } satisfies ReportSectionStarterContent;
  });

  return {
    learnerId,
    reportDocumentId: input.mapping.reportDocumentId,
    reportingPeriodId: input.mapping.reportingPeriodId,
    jurisdictionCode: input.mapping.jurisdictionCode,
    sections,
  };
}

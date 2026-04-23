import { getSectionScaffoldsForJurisdiction } from "@/lib/reportAssembly";
import type { ReportsBuilderModel } from "@/lib/reporting";
import { supabase } from "@/lib/supabaseClient";

type QueryClient = Pick<typeof supabase, "from">;

export type ArtifactSatisfactionStatus = "complete" | "in_progress" | "missing";
export type SectionCompletionStatus = "complete" | "in_progress" | "missing";

export type ArtifactMappingResult = {
  artifactType: string;
  label: string;
  status: ArtifactSatisfactionStatus;
  confidence: "high" | "medium" | "low";
  supportingCounts: {
    plans: number;
    experiences: number;
    evidence: number;
    pairs: number;
    reviews: number;
  };
  supportingIds?: string[];
  notes: string[];
  suggestedNextAction?: string | null;
};

export type SectionMappingResult = {
  sectionKey: string;
  title: string;
  status: SectionCompletionStatus;
  supportedArtifactTypes: string[];
  supportingEvidenceCount: number;
  supportingPlanCount: number;
  notes: string[];
};

export type ReportEvidenceMapping = {
  learnerId: string;
  jurisdictionCode: string | null;
  reportingPeriodId: string | null;
  reportDocumentId: string | null;
  artifacts: ArtifactMappingResult[];
  sections: SectionMappingResult[];
  strongestAreas: string[];
  weakAreas: string[];
  nextAction: string | null;
};

type RawRow = Record<string, unknown>;

type LoadReportEvidenceMappingInput = {
  model: ReportsBuilderModel;
};

type PlanRecord = {
  id: string;
  searchText: string;
};

type ExperienceRecord = {
  id: string;
  planId: string;
  searchText: string;
};

type EvidenceRecord = {
  id: string;
  planId: string;
  experienceId: string;
  searchText: string;
};

type ReviewRecord = {
  id: string;
  searchText: string;
};

type PairRecord = {
  id: string;
  evidenceIds: string[];
};

type SectionRecord = {
  id: string;
  title: string;
  hasContent: boolean;
  searchText: string;
};

type MatchCategory =
  | "plan"
  | "evidence"
  | "report"
  | "review"
  | "literacy"
  | "numeracy"
  | "resources"
  | "social"
  | "standards"
  | "next_steps"
  | "support"
  | "progress"
  | "generic";

type ArtifactSignal = {
  key: string;
  label: string;
  categories: MatchCategory[];
  termMatches: string[];
  note: string;
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

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
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

function buildArtifactSignal(artifact: {
  code?: string;
  label?: string;
  note?: string;
  category?: string;
}) {
  const key = safe(artifact.code) || safe(artifact.label) || "artifact";
  const label = safe(artifact.label) || "Required artifact";
  const haystack = joinSearchText(artifact.code, artifact.label, artifact.note, artifact.category);

  const categories: MatchCategory[] = [];
  const termMatches: string[] = [];

  const add = (category: MatchCategory, terms: string[]) => {
    categories.push(category);
    termMatches.push(...terms);
  };

  if (haystack.includes("literacy") || haystack.includes("english")) {
    add("literacy", ["literacy", "english", "reading", "writing"]);
  }
  if (haystack.includes("numeracy") || haystack.includes("mathemat")) {
    add("numeracy", ["numeracy", "math", "mathematics", "number"]);
  }
  if (haystack.includes("resource") || haystack.includes("material") || haystack.includes("environment")) {
    add("resources", ["resource", "material", "environment", "tool"]);
  }
  if (haystack.includes("social") || haystack.includes("community") || haystack.includes("peer")) {
    add("social", ["social", "community", "group", "peer", "excursion"]);
  }
  if (haystack.includes("standard") || haystack.includes("curriculum") || haystack.includes("framework")) {
    add("standards", ["standard", "curriculum", "framework", "achievement"]);
  }
  if (haystack.includes("next") || haystack.includes("upcoming") || haystack.includes("proposed")) {
    add("next_steps", ["next", "upcoming", "proposed", "future"]);
  }
  if (haystack.includes("support") || haystack.includes("follow-up") || haystack.includes("condition") || haystack.includes("concern")) {
    add("support", ["support", "concern", "condition", "follow-up"]);
  }
  if (haystack.includes("review")) {
    add("review", ["review", "finding", "reflection"]);
  }
  if (haystack.includes("report") || haystack.includes("summary") || haystack.includes("document")) {
    add("report", ["report", "summary", "document"]);
  }
  if (haystack.includes("progress") || haystack.includes("achievement")) {
    add("progress", ["progress", "achievement", "growth"]);
  }
  if (haystack.includes("plan") || haystack.includes("program")) {
    add("plan", ["plan", "program", "goal", "intent"]);
  }
  if (
    haystack.includes("evidence") ||
    haystack.includes("record") ||
    haystack.includes("sample")
  ) {
    add("evidence", ["evidence", "record", "sample", "capture"]);
  }

  if (!categories.length) {
    add("generic", [label.toLowerCase()]);
  }

  return {
    key,
    label,
    categories: Array.from(new Set(categories)),
    termMatches: Array.from(new Set(termMatches)),
    note: safe(artifact.note),
  } satisfies ArtifactSignal;
}

function normalizeSectionKey(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function loadRowsForLearner(db: QueryClient, table: string, learnerId: string) {
  try {
    return await many(db, table, (query) =>
      query.select("*").eq("learner_id", learnerId),
    );
  } catch {
    try {
      return await many(db, table, (query) =>
        query.select("*").eq("student_id", learnerId),
      );
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
    return await many(db, table, (query) =>
      query.select("*").in(column, ids),
    );
  } catch {
    return [];
  }
}

function filterCycleRows(rows: RawRow[], startDate: string | null, endDate: string | null, candidateFields: string[]) {
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
    existing.push(joinSearchText(row));
    areasByPlan.set(planId, existing);
  });

  planGoals.forEach((row) => {
    const planId = safe(row.plan_id);
    if (!planId) return;
    const existing = goalsByPlan.get(planId) || [];
    existing.push(joinSearchText(row));
    goalsByPlan.set(planId, existing);
  });

  return rows.map((row) => {
    const id = safe(row.id);
    return {
      id,
      searchText: joinSearchText(
        row,
        areasByPlan.get(id) || [],
        goalsByPlan.get(id) || [],
      ),
    } satisfies PlanRecord;
  });
}

function normalizeExperiences(rows: RawRow[], tags: RawRow[]) {
  const tagsByExperience = new Map<string, string[]>();

  tags.forEach((row) => {
    const experienceId = safe(row.learning_experience_id) || safe(row.experience_id);
    if (!experienceId) return;
    const existing = tagsByExperience.get(experienceId) || [];
    existing.push(joinSearchText(row));
    tagsByExperience.set(experienceId, existing);
  });

  return rows.map((row) => {
    const id = safe(row.id);
    return {
      id,
      planId: safe(row.plan_id),
      searchText: joinSearchText(row, tagsByExperience.get(id) || []),
    } satisfies ExperienceRecord;
  });
}

function normalizeEvidence(rows: RawRow[], tags: RawRow[], annotations: RawRow[]) {
  const tagsByEvidence = new Map<string, string[]>();
  const annotationsByEvidence = new Map<string, string[]>();

  tags.forEach((row) => {
    const evidenceId = safe(row.evidence_id) || safe(row.item_id);
    if (!evidenceId) return;
    const existing = tagsByEvidence.get(evidenceId) || [];
    existing.push(joinSearchText(row));
    tagsByEvidence.set(evidenceId, existing);
  });

  annotations.forEach((row) => {
    const evidenceId = safe(row.evidence_id) || safe(row.item_id);
    if (!evidenceId) return;
    const existing = annotationsByEvidence.get(evidenceId) || [];
    existing.push(joinSearchText(row));
    annotationsByEvidence.set(evidenceId, existing);
  });

  return rows.map((row) => {
    const id = safe(row.id);
    return {
      id,
      planId: safe(row.plan_id),
      experienceId: safe(row.experience_id),
      searchText: joinSearchText(
        row,
        tagsByEvidence.get(id) || [],
        annotationsByEvidence.get(id) || [],
      ),
    } satisfies EvidenceRecord;
  });
}

function normalizeReviews(rows: RawRow[], findings: RawRow[]) {
  const findingsByReview = new Map<string, string[]>();

  findings.forEach((row) => {
    const reviewId = safe(row.review_id);
    if (!reviewId) return;
    const existing = findingsByReview.get(reviewId) || [];
    existing.push(joinSearchText(row));
    findingsByReview.set(reviewId, existing);
  });

  return rows.map((row) => {
    const id = safe(row.id);
    return {
      id,
      searchText: joinSearchText(row, findingsByReview.get(id) || []),
    } satisfies ReviewRecord;
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
  })) satisfies PairRecord[];
}

function normalizeSections(reportDocumentSectionRows: RawRow[], embeddedSections: { id: string; title: string; content: string; status: string }[], jurisdictionCode: string | null) {
  if (reportDocumentSectionRows.length) {
    return reportDocumentSectionRows.map((row, index) => {
      const title = safe(row.title) || safe(row.heading) || safe(row.name) || `Section ${index + 1}`;
      const content = safe(row.content) || safe(row.body) || safe(row.note);
      return {
        id: safe(row.id) || `section-${index + 1}`,
        title,
        hasContent: Boolean(content),
        searchText: joinSearchText(row),
      } satisfies SectionRecord;
    });
  }

  if (embeddedSections.length) {
    return embeddedSections.map((section, index) => ({
      id: section.id || `section-${index + 1}`,
      title: safe(section.title) || `Section ${index + 1}`,
      hasContent: Boolean(safe(section.content)),
      searchText: joinSearchText(section.title, section.content, section.status),
    })) satisfies SectionRecord[];
  }

  return getSectionScaffoldsForJurisdiction(jurisdictionCode).map((section, index) => ({
    id: `scaffold-${index + 1}`,
    title: section.title,
    hasContent: false,
    searchText: joinSearchText(section.title, section.hint),
  }));
}

function hasAnyTerm(searchText: string, terms: string[]) {
  return terms.some((term) => searchText.includes(term));
}

function matchPlan(plan: PlanRecord, signal: ArtifactSignal) {
  if (signal.categories.includes("plan")) return true;
  return hasAnyTerm(plan.searchText, signal.termMatches);
}

function matchExperience(experience: ExperienceRecord, signal: ArtifactSignal) {
  if (signal.categories.includes("generic")) return experience.searchText.length > 0;
  return hasAnyTerm(experience.searchText, signal.termMatches);
}

function matchEvidence(evidence: EvidenceRecord, signal: ArtifactSignal) {
  if (signal.categories.includes("evidence") && !signal.termMatches.length) return true;
  if (signal.categories.includes("report")) return evidence.searchText.length > 0;
  return hasAnyTerm(evidence.searchText, signal.termMatches);
}

function matchReview(review: ReviewRecord, signal: ArtifactSignal) {
  if (signal.categories.includes("review")) return true;
  if (signal.categories.includes("support")) return hasAnyTerm(review.searchText, signal.termMatches);
  return hasAnyTerm(review.searchText, signal.termMatches);
}

function artifactStatusFromCounts(
  signal: ArtifactSignal,
  counts: ArtifactMappingResult["supportingCounts"],
  hasReportDocument: boolean,
) {
  const totalSupport =
    counts.plans +
    counts.experiences +
    counts.evidence +
    counts.pairs +
    counts.reviews;

  if (signal.categories.includes("report")) {
    if (hasReportDocument && (counts.evidence > 0 || counts.plans > 0 || counts.reviews > 0)) {
      return "complete" as const;
    }
    if (hasReportDocument || totalSupport > 0) {
      return "in_progress" as const;
    }
    return "missing" as const;
  }

  if (signal.categories.includes("review")) {
    if (counts.reviews > 0) return "complete" as const;
    if (hasReportDocument || totalSupport > 0) return "in_progress" as const;
    return "missing" as const;
  }

  if (signal.categories.includes("plan")) {
    if (counts.plans > 0 && (counts.experiences > 0 || counts.evidence > 0)) {
      return "complete" as const;
    }
    if (counts.plans > 0) return "in_progress" as const;
    return "missing" as const;
  }

  if (
    signal.categories.includes("literacy") ||
    signal.categories.includes("numeracy") ||
    signal.categories.includes("resources") ||
    signal.categories.includes("social") ||
    signal.categories.includes("standards") ||
    signal.categories.includes("progress")
  ) {
    if (counts.evidence > 0 || counts.experiences > 0) {
      return counts.plans > 0 || counts.pairs > 0 ? "complete" : "in_progress";
    }
    if (counts.plans > 0 || counts.reviews > 0) return "in_progress" as const;
    return "missing" as const;
  }

  if (signal.categories.includes("next_steps")) {
    if (counts.plans > 0 && counts.reviews > 0) return "complete" as const;
    if (counts.plans > 0 || counts.reviews > 0) return "in_progress" as const;
    return "missing" as const;
  }

  if (signal.categories.includes("support")) {
    if (counts.reviews > 0) return "complete" as const;
    if (counts.evidence > 0 || counts.plans > 0) return "in_progress" as const;
    return "missing" as const;
  }

  if (counts.evidence > 0 || counts.experiences > 0 || counts.plans > 0) {
    return counts.evidence > 0 ? "complete" : "in_progress";
  }

  return "missing" as const;
}

function artifactConfidence(
  signal: ArtifactSignal,
  counts: ArtifactMappingResult["supportingCounts"],
) {
  const totalSupport =
    counts.plans +
    counts.experiences +
    counts.evidence +
    counts.pairs +
    counts.reviews;

  if (signal.termMatches.length >= 2 && totalSupport >= 2) return "high" as const;
  if (totalSupport >= 1) return "medium" as const;
  return "low" as const;
}

function sectionTermsForTitle(title: string) {
  const normalized = toLower(title);
  const terms: string[] = [];
  if (normalized.includes("literacy") || normalized.includes("english")) terms.push("literacy", "english", "reading", "writing");
  if (normalized.includes("numeracy") || normalized.includes("mathemat")) terms.push("numeracy", "math", "mathematics", "number");
  if (normalized.includes("resource") || normalized.includes("environment")) terms.push("resource", "material", "environment", "tool");
  if (normalized.includes("social")) terms.push("social", "community", "group", "peer");
  if (normalized.includes("standard") || normalized.includes("curriculum")) terms.push("standard", "curriculum", "framework");
  if (normalized.includes("next") || normalized.includes("proposed") || normalized.includes("upcoming")) terms.push("next", "proposed", "future", "upcoming");
  if (normalized.includes("review")) terms.push("review", "finding", "reflection");
  if (normalized.includes("progress") || normalized.includes("achievement")) terms.push("progress", "achievement", "growth");
  if (normalized.includes("plan") || normalized.includes("program")) terms.push("plan", "program", "goal", "intent");
  if (normalized.includes("evidence") || normalized.includes("record")) terms.push("evidence", "record", "sample", "capture");
  if (!terms.length) terms.push(normalized);
  return Array.from(new Set(terms));
}

function buildSectionNotes(section: SectionRecord, artifactResults: ArtifactMappingResult[], evidenceCount: number, planCount: number) {
  const notes: string[] = [];
  if (section.hasContent) {
    notes.push("This section already contains draft content.");
  } else {
    notes.push("This section is still scaffolded.");
  }

  if (evidenceCount > 0) {
    notes.push(`${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"} align with this section.`);
  }
  if (planCount > 0) {
    notes.push(`${planCount} planning record${planCount === 1 ? "" : "s"} support this section.`);
  }

  if (!artifactResults.length) {
    notes.push("No required artifacts have been matched to this section yet.");
  }

  return notes;
}

function nextActionFromArtifacts(artifacts: ArtifactMappingResult[]) {
  const missing = artifacts.find((artifact) => artifact.status === "missing" && artifact.suggestedNextAction);
  if (missing?.suggestedNextAction) return missing.suggestedNextAction;
  const inProgress = artifacts.find((artifact) => artifact.status === "in_progress" && artifact.suggestedNextAction);
  return inProgress?.suggestedNextAction || null;
}

export async function loadReportEvidenceMapping(
  input: LoadReportEvidenceMappingInput & { client?: QueryClient },
): Promise<ReportEvidenceMapping> {
  const model = input.model;
  const learnerId = safe(model.learner?.id);
  const db = input.client ?? supabase;

  if (!learnerId) {
    return {
      learnerId: "",
      jurisdictionCode: null,
      reportingPeriodId: null,
      reportDocumentId: null,
      artifacts: [],
      sections: [],
      strongestAreas: [],
      weakAreas: [],
      nextAction: null,
    };
  }

  const cycleStart = model.registrationCycle?.startDate || null;
  const cycleEnd = model.registrationCycle?.endDate || null;
  const reportDocumentId = safe(model.reportDocument?.id) || null;
  const jurisdictionCode = model.effectiveJurisdiction?.code || null;

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
  const experienceTags = await loadRowsByForeignIds(db, "learning_experience_tags", "experience_id", experienceIds);

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
  const reviewFindings = await loadRowsByForeignIds(db, "review_findings", "review_id", reviewIds);

  const reportSectionRows = reportDocumentId
    ? await loadRowsByForeignIds(db, "report_sections", "report_document_id", [reportDocumentId])
    : [];

  const plans = normalizePlans(rawPlans, planAreas, planGoals);
  const experiences = normalizeExperiences(rawExperiences, experienceTags);
  const evidence = normalizeEvidence(rawEvidence, evidenceTags, evidenceAnnotations);
  const reviews = normalizeReviews(rawReviews, reviewFindings);
  const pairs = normalizePairs(evidencePairs);
  const sections = normalizeSections(
    reportSectionRows,
    model.reportDocument?.sections || [],
    jurisdictionCode,
  );

  const artifactResults = model.requiredArtifacts.map((artifact) => {
    const signal = buildArtifactSignal({
      code: artifact.code,
      label: artifact.label,
      note: artifact.note,
      category: artifact.category,
    });

    const matchedPlans = plans.filter((plan) => matchPlan(plan, signal));
    const matchedExperiences = experiences.filter((experience) => {
      if (matchExperience(experience, signal)) return true;
      return matchedPlans.some((plan) => plan.id === experience.planId);
    });
    const matchedEvidence = evidence.filter((item) => {
      if (matchEvidence(item, signal)) return true;
      return (
        matchedPlans.some((plan) => plan.id === item.planId) ||
        matchedExperiences.some((experience) => experience.id === item.experienceId)
      );
    });
    const matchedReviews = reviews.filter((review) => matchReview(review, signal));
    const matchedPairs = pairs.filter((pair) =>
      pair.evidenceIds.some((evidenceId) => matchedEvidence.some((item) => item.id === evidenceId)),
    );

    const counts = {
      plans: matchedPlans.length,
      experiences: matchedExperiences.length,
      evidence: matchedEvidence.length,
      pairs: matchedPairs.length,
      reviews: matchedReviews.length,
    };

    const status = artifactStatusFromCounts(
      signal,
      counts,
      Boolean(reportDocumentId),
    );

    const notes: string[] = [];
    if (matchedPlans.length) {
      notes.push(`${matchedPlans.length} plan record${matchedPlans.length === 1 ? "" : "s"} align with this artifact.`);
    }
    if (matchedExperiences.length) {
      notes.push(`${matchedExperiences.length} learning experience${matchedExperiences.length === 1 ? "" : "s"} support this artifact.`);
    }
    if (matchedEvidence.length) {
      notes.push(`${matchedEvidence.length} evidence item${matchedEvidence.length === 1 ? "" : "s"} directly support this artifact.`);
    }
    if (matchedPairs.length) {
      notes.push(`${matchedPairs.length} evidence pair${matchedPairs.length === 1 ? "" : "s"} strengthen the support chain.`);
    }
    if (matchedReviews.length) {
      notes.push(`${matchedReviews.length} review record${matchedReviews.length === 1 ? "" : "s"} contribute supporting context.`);
    }
    if (!notes.length) {
      notes.push("No records with a clear match have been found for this artifact yet.");
    }
    if (signal.note) {
      notes.push(signal.note);
    }

    return {
      artifactType: signal.key,
      label: signal.label,
      status,
      confidence: artifactConfidence(signal, counts),
      supportingCounts: counts,
      supportingIds: [
        ...matchedPlans.map((item) => item.id),
        ...matchedExperiences.map((item) => item.id),
        ...matchedEvidence.map((item) => item.id),
        ...matchedReviews.map((item) => item.id),
      ].slice(0, 8),
      notes,
      suggestedNextAction:
        status === "missing"
          ? signal.categories.includes("plan")
            ? "Add or update the current learning plan"
            : signal.categories.includes("review")
              ? "Add a review record or review finding"
              : signal.categories.includes("next_steps")
                ? "Update the next-step planning notes for this learner"
                : "Capture evidence that directly supports this requirement"
          : status === "in_progress"
            ? "Tighten the supporting evidence so this requirement is fully covered"
            : null,
    } satisfies ArtifactMappingResult;
  });

  const sectionResults = sections.map((section) => {
    const terms = sectionTermsForTitle(section.title);
    const supportedArtifacts = artifactResults.filter((artifact) => {
      const haystack = joinSearchText(artifact.label, artifact.artifactType, artifact.notes);
      return terms.some((term) => haystack.includes(term));
    });

    const supportingEvidenceCount = supportedArtifacts.reduce(
      (sum, artifact) => sum + artifact.supportingCounts.evidence,
      0,
    );
    const supportingPlanCount = supportedArtifacts.reduce(
      (sum, artifact) => sum + artifact.supportingCounts.plans,
      0,
    );

    let status: SectionCompletionStatus = "missing";
    if (
      section.hasContent &&
      supportedArtifacts.length &&
      supportedArtifacts.every((artifact) => artifact.status !== "missing")
    ) {
      status = "complete";
    } else if (
      section.hasContent ||
      supportingEvidenceCount > 0 ||
      supportingPlanCount > 0 ||
      supportedArtifacts.some((artifact) => artifact.status === "in_progress" || artifact.status === "complete")
    ) {
      status = "in_progress";
    }

    return {
      sectionKey: normalizeSectionKey(section.title),
      title: section.title,
      status,
      supportedArtifactTypes: supportedArtifacts.map((artifact) => artifact.artifactType),
      supportingEvidenceCount,
      supportingPlanCount,
      notes: buildSectionNotes(section, supportedArtifacts, supportingEvidenceCount, supportingPlanCount),
    } satisfies SectionMappingResult;
  });

  const strongestAreas = artifactResults
    .filter((artifact) => artifact.status === "complete")
    .map((artifact) => artifact.label)
    .slice(0, 4);

  const weakAreas = artifactResults
    .filter((artifact) => artifact.status !== "complete")
    .map((artifact) => artifact.label)
    .slice(0, 4);

  return {
    learnerId,
    jurisdictionCode,
    reportingPeriodId: model.reportingPeriod?.id || null,
    reportDocumentId,
    artifacts: artifactResults,
    sections: sectionResults,
    strongestAreas,
    weakAreas,
    nextAction: nextActionFromArtifacts(artifactResults),
  };
}

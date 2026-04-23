import { loadComplianceReadiness, type ComplianceReadiness, type ComplianceReadinessItemStatus } from "@/lib/complianceReadiness";
import type { ReportPackItemRecord, ReportSectionRecord, ReportsBuilderModel } from "@/lib/reporting";
import { supabase } from "@/lib/supabaseClient";

export type ReportAssemblySection = {
  id: string;
  title: string;
  status: string;
  contentPreview: string;
  hasContent: boolean;
  sourceMode: string | null;
  locked: boolean;
  scaffoldOnly: boolean;
  order: number;
};

export type ReportAssemblyPackItem = {
  id: string;
  label: string;
  note: string;
};

export type ReportAssemblyArtifact = {
  artifactType: string;
  label: string;
  note: string;
  status: ComplianceReadinessItemStatus;
};

export type ReportAssemblySupportingRecord = {
  label: string;
  value: string;
  note: string;
  tone: "ready" | "warning" | "neutral";
};

export type ReportAssemblyWorkspace = {
  headerTitle: string;
  sections: ReportAssemblySection[];
  packItems: ReportAssemblyPackItem[];
  artifactItems: ReportAssemblyArtifact[];
  supportingRecords: ReportAssemblySupportingRecord[];
  missingItems: string[];
  softWarning: string;
};

type LoadReportAssemblyWorkspaceInput = {
  model: ReportsBuilderModel;
  readiness: ComplianceReadiness;
};

export type SectionScaffold = {
  title: string;
  hint: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function withSentenceCase(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function statusFromReadiness(value: string): ComplianceReadinessItemStatus {
  const normalized = toLower(value);
  if (normalized === "ready" || normalized === "complete") return "complete";
  if (normalized === "in progress" || normalized === "in_progress") return "in_progress";
  return "missing";
}

function normalizeSectionTitle(jurisdictionCode: string | null, title: string) {
  const clean = safe(title);
  if (clean) return clean;
  return jurisdictionCode ? `${jurisdictionCode} section` : "Report section";
}

export function getSectionScaffoldsForJurisdiction(code: string | null): SectionScaffold[] {
  const jurisdictionCode = safe(code).toUpperCase();

  if (jurisdictionCode === "AU-QLD") {
    return [
      {
        title: "Educational Progress Summary",
        hint: "Summarise how learning has progressed across the current review period.",
      },
      {
        title: "English / Literacy Evidence",
        hint: "Gather the strongest literacy examples already linked to the learner record.",
      },
      {
        title: "Mathematics / Numeracy Evidence",
        hint: "Use the most representative numeracy records from this cycle.",
      },
      {
        title: "Additional Learning Area Evidence",
        hint: "Capture the broader learning areas that round out the current program.",
      },
      {
        title: "Upcoming Educational Program Summary",
        hint: "Outline the next planned phase of the learner's educational program.",
      },
    ];
  }

  if (jurisdictionCode === "AU-NSW") {
    return [
      {
        title: "Educational Program Overview",
        hint: "Describe the current educational program in a calm, parent-readable way.",
      },
      {
        title: "Learning Record Summary",
        hint: "Point to the records that show what learning has taken place.",
      },
      {
        title: "Progress and Achievement Summary",
        hint: "Summarise progress made during the reporting period.",
      },
      {
        title: "Resources and Learning Environment",
        hint: "Note the resources, routines, and environment supporting the learner.",
      },
      {
        title: "Next Steps",
        hint: "Outline the next planned direction for the learner.",
      },
    ];
  }

  if (jurisdictionCode === "AU-VIC") {
    return [
      {
        title: "Learning Plan Overview",
        hint: "Frame the current learning plan and the overall intent of the cycle.",
      },
      {
        title: "Materials and Resources",
        hint: "Capture the main materials and resources used by the learner.",
      },
      {
        title: "Learning Record Summary",
        hint: "Show the record of what has been covered so far.",
      },
      {
        title: "Progress Across Learning Areas",
        hint: "Summarise progress across the main learning areas in view.",
      },
      {
        title: "Review Notes",
        hint: "Capture review observations and any adjustments that follow from them.",
      },
    ];
  }

  if (jurisdictionCode === "AU-SA") {
    return [
      {
        title: "Learning Program Overview",
        hint: "Describe the current learning program and its shape.",
      },
      {
        title: "Resources and Learning Environment",
        hint: "Note the resources and environment supporting the learner.",
      },
      {
        title: "Social Opportunities",
        hint: "Capture community, social, or collaborative opportunities.",
      },
      {
        title: "Monitoring Progress",
        hint: "Show how progress is being monitored over the cycle.",
      },
      {
        title: "Review Evidence Summary",
        hint: "Pull together the evidence most relevant to review.",
      },
    ];
  }

  if (jurisdictionCode === "AU-TAS") {
    return [
      {
        title: "HESP Summary of Learning",
        hint: "Summarise learning under the current HESP context.",
      },
      {
        title: "Proposed Program",
        hint: "Describe the proposed program for the next phase.",
      },
      {
        title: "Evidence of Learning",
        hint: "Show the strongest current evidence of learning.",
      },
      {
        title: "Standards Overview",
        hint: "Note how learning is tracking against relevant standards or goals.",
      },
      {
        title: "Follow-up / Support Notes",
        hint: "Capture any follow-up matters or support notes for the next period.",
      },
    ];
  }

  if (jurisdictionCode === "AU-WA") {
    return [
      {
        title: "Educational Program Overview",
        hint: "Describe the learner's current educational program.",
      },
      {
        title: "Educational Progress Summary",
        hint: "Summarise current educational progress using the strongest records available.",
      },
      {
        title: "Curriculum Consistency Notes",
        hint: "Note how the current program aligns with the intended curriculum approach.",
      },
      {
        title: "Evaluation / Concern Notes",
        hint: "Capture evaluation notes and any concern items that need follow-up.",
      },
      {
        title: "Next Steps",
        hint: "Outline the next phase of the learner's program.",
      },
    ];
  }

  if (jurisdictionCode === "AU-NT") {
    return [
      {
        title: "Learning Plan Summary",
        hint: "Summarise the current learning plan for the learner.",
      },
      {
        title: "Teaching / Assessment / Recording Overview",
        hint: "Describe the core approach to teaching, assessment, and record keeping.",
      },
      {
        title: "Evidence of Progress",
        hint: "Show the clearest evidence of progress recorded so far.",
      },
      {
        title: "Approved Curriculum Coverage",
        hint: "Explain the main coverage already visible in the current cycle.",
      },
      {
        title: "Review Notes",
        hint: "Capture any review notes relevant to the current submission.",
      },
    ];
  }

  return [
    {
      title: "Overview",
      hint: "Frame the current reporting period in a simple, readable overview.",
    },
    {
      title: "Learning Evidence",
      hint: "Gather the strongest learning evidence available in the current cycle.",
    },
    {
      title: "Progress Summary",
      hint: "Summarise learner progress and what it shows.",
    },
    {
      title: "Next Steps",
      hint: "Describe the next useful step for the learner's program.",
    },
  ];
}

function buildHeaderTitle(model: ReportsBuilderModel) {
  const jurisdictionName = model.effectiveJurisdiction?.label || "Current";
  const reportingLabel = model.reportingPeriod?.label || reportingModeFallback(model);
  if (reportingLabel) {
    return `${jurisdictionName} ${reportingLabel} Draft`;
  }
  return `${jurisdictionName} Reporting Draft`;
}

function reportingModeFallback(model: ReportsBuilderModel) {
  return model.ruleSet?.cycleLabel || model.effectiveJurisdiction?.reportingMode || "Reporting";
}

function normalizeSectionRow(raw: Record<string, unknown>, fallbackOrder: number, jurisdictionCode: string | null): ReportAssemblySection {
  const content = safe(raw.content) || safe(raw.body) || safe(raw.note);
  const title =
    safe(raw.title) ||
    safe(raw.heading) ||
    safe(raw.name) ||
    normalizeSectionTitle(jurisdictionCode, `Section ${fallbackOrder}`);

  return {
    id: safe(raw.id) || `section-${fallbackOrder}`,
    title,
    status: safe(raw.status) || "draft",
    contentPreview: content,
    hasContent: Boolean(content),
    sourceMode: safe(raw.source_mode) || safe(raw.mode) || null,
    locked:
      raw.locked === true ||
      raw.is_locked === true ||
      safe(raw.locked) === "true" ||
      safe(raw.is_locked) === "true",
    scaffoldOnly: false,
    order:
      Number(raw.display_order) ||
      Number(raw.order_index) ||
      Number(raw.position) ||
      fallbackOrder,
  };
}

function normalizeSectionRecords(
  sections: ReportSectionRecord[],
  jurisdictionCode: string | null,
): ReportAssemblySection[] {
  return sections.map((section, index) => ({
    id: section.id || `section-${index + 1}`,
    title: normalizeSectionTitle(jurisdictionCode, section.title),
    status: section.status || "draft",
    contentPreview: safe(section.content),
    hasContent: Boolean(safe(section.content)),
    sourceMode: null,
    locked: false,
    scaffoldOnly: false,
    order: index + 1,
  }));
}

function buildScaffoldSections(jurisdictionCode: string | null): ReportAssemblySection[] {
  return getSectionScaffoldsForJurisdiction(jurisdictionCode).map((section, index) => ({
    id: `scaffold-${index + 1}`,
    title: section.title,
    status: "scaffold",
    contentPreview: section.hint,
    hasContent: false,
    sourceMode: "scaffold",
    locked: false,
    scaffoldOnly: true,
    order: index + 1,
  }));
}

async function loadPersistedSections(
  reportDocumentId: string,
  jurisdictionCode: string | null,
): Promise<ReportAssemblySection[]> {
  try {
    const response = await supabase
      .from("report_sections")
      .select("*")
      .eq("report_document_id", reportDocumentId)
      .order("display_order", { ascending: true });

    if (response.error) throw response.error;
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map((row, index) =>
      normalizeSectionRow(asObject(row), index + 1, jurisdictionCode),
    );
  } catch {
    try {
      const response = await supabase
        .from("report_sections")
        .select("*")
        .eq("document_id", reportDocumentId)
        .order("display_order", { ascending: true });

      if (response.error) throw response.error;
      const rows = Array.isArray(response.data) ? response.data : [];
      return rows.map((row, index) =>
        normalizeSectionRow(asObject(row), index + 1, jurisdictionCode),
      );
    } catch {
      return [];
    }
  }
}

function normalizePackItem(raw: Record<string, unknown>, fallbackOrder: number): ReportAssemblyPackItem {
  return {
    id: safe(raw.id) || `pack-item-${fallbackOrder}`,
    label: safe(raw.label) || safe(raw.title) || safe(raw.name) || `Pack item ${fallbackOrder}`,
    note: safe(raw.note) || safe(raw.description),
  };
}

async function loadPersistedPackItems(reportDocumentId: string): Promise<ReportAssemblyPackItem[]> {
  try {
    const response = await supabase
      .from("report_pack_items")
      .select("*")
      .eq("report_document_id", reportDocumentId)
      .order("display_order", { ascending: true });

    if (response.error) throw response.error;
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map((row, index) => normalizePackItem(asObject(row), index + 1));
  } catch {
    try {
      const response = await supabase
        .from("report_pack_items")
        .select("*")
        .eq("document_id", reportDocumentId)
        .order("display_order", { ascending: true });

      if (response.error) throw response.error;
      const rows = Array.isArray(response.data) ? response.data : [];
      return rows.map((row, index) => normalizePackItem(asObject(row), index + 1));
    } catch {
      return [];
    }
  }
}

function normalizeFallbackPackItems(packItems: ReportPackItemRecord[]): ReportAssemblyPackItem[] {
  return packItems.map((item, index) => ({
    id: item.id || `pack-item-${index + 1}`,
    label: item.label || `Pack item ${index + 1}`,
    note: safe(item.note),
  }));
}

function mapArtifactStatus(
  label: string,
  artifactType: string,
  model: ReportsBuilderModel,
  readiness: ComplianceReadiness,
): ComplianceReadinessItemStatus {
  const readinessItem = readiness.items.find((item) => {
    const itemLabel = toLower(item.label);
    const reportLabel = toLower(label);
    const itemType = toLower(item.artifactType);
    const artifactTypeKey = toLower(artifactType);

    return (
      itemLabel === reportLabel ||
      itemLabel.includes(reportLabel) ||
      reportLabel.includes(itemLabel) ||
      (artifactTypeKey && itemType.includes(artifactTypeKey))
    );
  });

  if (readinessItem) {
    return readinessItem.status;
  }

  const fallbackArtifact = model.requiredArtifacts.find((item) => toLower(item.label) === toLower(label));
  return statusFromReadiness(fallbackArtifact?.status || "missing");
}

function buildArtifactItems(
  model: ReportsBuilderModel,
  readiness: ComplianceReadiness,
): ReportAssemblyArtifact[] {
  if (model.requiredArtifacts.length) {
    return model.requiredArtifacts.map((artifact) => ({
      artifactType: artifact.code || artifact.category,
      label: artifact.label,
      note: artifact.note || artifact.frequency,
      status: mapArtifactStatus(artifact.label, artifact.code || artifact.category, model, readiness),
    }));
  }

  return readiness.items.map((item) => ({
    artifactType: item.artifactType,
    label: item.label,
    note: "",
    status: item.status,
  }));
}

async function countReviews(learnerId: string) {
  try {
    const response = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", learnerId);

    if (response.error) throw response.error;
    return Number(response.count ?? 0);
  } catch {
    return 0;
  }
}

function buildSupportingRecords(input: {
  model: ReportsBuilderModel;
  readiness: ComplianceReadiness;
  sections: ReportAssemblySection[];
  packItems: ReportAssemblyPackItem[];
  reviewCount: number;
}): ReportAssemblySupportingRecord[] {
  const reportSectionCount = input.sections.filter((section) => !section.scaffoldOnly).length;
  const sectionsWithContent = input.sections.filter((section) => section.hasContent).length;
  const reportArtifact = input.readiness.items.find((item) => toLower(item.artifactType).includes("report"));

  return [
    {
      label: "Learning plans",
      value: `${input.model.planCount}`,
      note:
        input.model.planCount > 0
          ? "Planning records are available to support this draft."
          : "No planning records are visible for the current cycle yet.",
      tone: input.model.planCount > 0 ? "ready" : "warning",
    },
    {
      label: "Evidence items",
      value: `${input.model.evidenceCount}`,
      note:
        input.model.evidenceCount > 0
          ? "Evidence records are available to reference in the assembled report."
          : "No evidence items are visible for the current cycle yet.",
      tone: input.model.evidenceCount > 0 ? "ready" : "warning",
    },
    {
      label: "Report sections",
      value: reportSectionCount > 0 ? `${sectionsWithContent}/${reportSectionCount}` : `${input.sections.length} scaffold`,
      note:
        reportSectionCount > 0
          ? `${sectionsWithContent} section${sectionsWithContent === 1 ? "" : "s"} already contain content.`
          : "The draft is currently using a jurisdiction-aware scaffold.",
      tone: sectionsWithContent > 0 || input.sections.length > 0 ? "ready" : "neutral",
    },
    {
      label: "Supporting pack items",
      value: `${input.packItems.length}`,
      note:
        input.packItems.length > 0
          ? "Linked pack items are available to support assembly."
          : "No additional pack items have been linked yet.",
      tone: input.packItems.length > 0 ? "ready" : "neutral",
    },
    {
      label: "Review records",
      value: `${input.reviewCount}`,
      note:
        input.reviewCount > 0
          ? "Review records are available for this learner."
          : "No review records are on file yet.",
      tone: input.reviewCount > 0 ? "ready" : "neutral",
    },
    {
      label: "Compliance posture",
      value: withSentenceCase(input.readiness.status.replace("_", " ")),
      note:
        reportArtifact?.status === "complete"
          ? "The report artifact is already represented in readiness."
          : "Readiness is still shaping what can be assembled next.",
      tone: input.readiness.status === "ready" ? "ready" : input.readiness.status === "warning" ? "warning" : "neutral",
    },
  ];
}

export async function loadReportAssemblyWorkspace(
  input: LoadReportAssemblyWorkspaceInput,
): Promise<ReportAssemblyWorkspace> {
  const model = input.model;
  const readiness = input.readiness;
  const reportDocument = model.reportDocument;

  if (!reportDocument || !model.learner) {
    return {
      headerTitle: buildHeaderTitle(model),
      sections: buildScaffoldSections(model.effectiveJurisdiction?.code || readiness.jurisdictionCode),
      packItems: [],
      artifactItems: buildArtifactItems(model, readiness),
      supportingRecords: [],
      missingItems: readiness.missing,
      softWarning: "",
    };
  }

  const jurisdictionCode = model.effectiveJurisdiction?.code || readiness.jurisdictionCode;

  let softWarning = "";
  let sections = await loadPersistedSections(reportDocument.id, jurisdictionCode);
  if (!sections.length && reportDocument.sections.length) {
    sections = normalizeSectionRecords(reportDocument.sections, jurisdictionCode);
  }
  if (!sections.length) {
    sections = buildScaffoldSections(jurisdictionCode);
  }

  let packItems = await loadPersistedPackItems(reportDocument.id);
  if (!packItems.length && reportDocument.linkedPackItems.length) {
    packItems = normalizeFallbackPackItems(reportDocument.linkedPackItems);
  }

  let reviewCount = 0;
  try {
    reviewCount = await countReviews(model.learner.id);
  } catch (error) {
    softWarning = safe(error);
  }

  return {
    headerTitle: buildHeaderTitle(model),
    sections: [...sections].sort((left, right) => left.order - right.order),
    packItems,
    artifactItems: buildArtifactItems(model, readiness),
    supportingRecords: buildSupportingRecords({
      model,
      readiness,
      sections,
      packItems,
      reviewCount,
    }),
    missingItems: readiness.missing,
    softWarning,
  };
}

export async function loadReadinessForReportAssembly(learnerId: string) {
  return loadComplianceReadiness({ learnerId });
}

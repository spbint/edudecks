import type {
  ReportCompletionValidation,
  ReportValidationIssue,
} from "@/lib/reportCompletionGate";
import type { ReportAssemblyWorkspace } from "@/lib/reportAssembly";
import type { ReportEvidenceMapping } from "@/lib/reportEvidenceMapping";
import type { ReportSectionAutofillModel } from "@/lib/reportSectionAutofill";
import type { ReportsBuilderModel } from "@/lib/reporting";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import { rowToSettings, type FamilyProfileRow } from "@/lib/familySettings";
import {
  familyYearLevelLabelFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";
import type { FamilyLearner } from "@/lib/familyWorkspace";
import { loadReadinessForReportAssembly, loadReportAssemblyWorkspace } from "@/lib/reportAssembly";
import { loadReportEvidenceMapping } from "@/lib/reportEvidenceMapping";
import { loadReportSectionAutofill } from "@/lib/reportSectionAutofill";
import { buildReportCompletionValidation } from "@/lib/reportCompletionGate";
import { loadReportsBuilderModel } from "@/lib/reporting";

export type ReportExportSection = {
  sectionKey: string;
  title: string;
  status: "complete" | "in_progress" | "missing";
  contentHtml: string;
  notes: string[];
};

export type ReportExportModel = {
  reportDocumentId: string | null;
  learnerId: string;
  learnerName: string;
  jurisdictionName: string | null;
  jurisdictionCode: string | null;
  reportingPeriodLabel: string | null;
  reportTitle: string;
  generatedAt: string;
  gateStatus: ReportCompletionValidation["status"];
  gateScore: number;
  summary: string;
  nextAction: string | null;
  completedSectionCount: number;
  totalSectionCount: number;
  completedArtifactCount: number;
  totalArtifactCount: number;
  sections: ReportExportSection[];
  artifacts: Array<{
    label: string;
    status: "complete" | "in_progress" | "missing";
    notes: string[];
  }>;
  blockers: ReportCompletionValidation["blockers"];
  warnings: ReportCompletionValidation["warnings"];
  info: ReportCompletionValidation["info"];
};

type BuildReportExportModelInput = {
  model: ReportsBuilderModel;
  assembly: ReportAssemblyWorkspace;
  mapping: ReportEvidenceMapping;
  autofill: ReportSectionAutofillModel;
  validation: ReportCompletionValidation;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeSectionKey(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sectionContentToHtml(content: string) {
  const clean = safe(content);
  if (!clean) {
    return "<p class=\"report-empty\">No persisted section content was available.</p>";
  }

  const blocks = clean.split(/\n\s*\n/g).map((block) => block.trim()).filter(Boolean);
  const html: string[] = [];

  for (const block of blocks) {
    const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    const bulletLines = lines.every((line) => /^[-*•]\s+/.test(line));
    if (bulletLines) {
      html.push(
        `<ul>${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
          .join("")}</ul>`,
      );
      continue;
    }

    if (lines.length > 1 && /^.+:\s*$/.test(lines[0])) {
      const heading = escapeHtml(lines[0].replace(/:\s*$/, ""));
      const remainder = lines.slice(1);
      const remainderBullets = remainder.every((line) => /^[-*•]\s+/.test(line));

      if (remainderBullets) {
        html.push(
          `<div class="report-starter-block"><h4>${heading}</h4><ul>${remainder
            .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
            .join("")}</ul></div>`,
        );
      } else {
        html.push(
          `<div class="report-starter-block"><h4>${heading}</h4>${remainder
            .map((line) => `<p>${escapeHtml(line)}</p>`)
            .join("")}</div>`,
        );
      }
      continue;
    }

    html.push(
      `<p>${lines.map((line) => escapeHtml(line)).join("<br />")}</p>`,
    );
  }

  return html.join("");
}

function issueTone(type: "blocker" | "warning" | "info") {
  if (type === "blocker") return "blocker";
  if (type === "warning") return "warning";
  return "info";
}

function reportSectionStatusLabel(status: ReportExportSection["status"]) {
  if (status === "complete") return "Complete";
  if (status === "in_progress") return "In progress";
  return "Missing";
}

function buildExportFilename(title: string) {
  const clean = safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean || "report-export"}.html`;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeFamilyProfile(raw: Record<string, unknown>): FamilyProfileRow {
  return {
    id: safe(raw.id) || "local",
    user_id: safe(raw.user_id) || null,
    owner_user_id: safe(raw.owner_user_id) || null,
    ...rowToSettings(raw),
  };
}

function normalizeFamilyLearner(raw: Record<string, unknown>): FamilyLearner {
  const label =
    safe(raw.preferred_name) ||
    [safe(raw.first_name), safe(raw.surname)].filter(Boolean).join(" ").trim() ||
    "Learner";
  const yearLevel = familyYearLevelToStoredNumber(raw.year_level);

  return {
    id: safe(raw.id),
    label,
    yearLabel: familyYearLevelLabelFromStored(yearLevel),
    year_level: yearLevel,
    year_band: safe(raw.year_band) || null,
    curriculum_framework_id: safe(raw.curriculum_framework_id) || null,
    curriculum_jurisdiction_id: safe(raw.curriculum_jurisdiction_id) || null,
    reporting_mode: safe(raw.reporting_mode) || null,
    connectedAt: safe(raw.created_at) || null,
  };
}

type ServerValidatedReportExportSuccess = {
  ok: true;
  status: 200;
  filename: string;
  html: string;
  exportModel: ReportExportModel;
  validation: ReportCompletionValidation;
};

type ServerValidatedReportExportFailure = {
  ok: false;
  status: number;
  error: string;
  code: string;
  validation?: ReportCompletionValidation | null;
  blockers?: ReportValidationIssue[];
  warnings?: ReportValidationIssue[];
  info?: ReportValidationIssue[];
};

export type ServerValidatedReportExportResult =
  | ServerValidatedReportExportSuccess
  | ServerValidatedReportExportFailure;

async function loadAuthorizedReportExportContext(
  reportDocumentId: string,
  accessToken: string,
) {
  const client = createServerSupabaseClient(accessToken);
  const { data: userData, error: authError } = await client.auth.getUser();
  const user = userData?.user || null;

  if (authError || !user) {
    return {
      ok: false as const,
      status: 401,
      code: "unauthorized",
      error: "A signed-in access token is required for report export.",
    };
  }

  let profileResponse = await client
    .from("family_profiles")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (profileResponse.error) {
    return {
      ok: false as const,
      status: 500,
      code: "profile_load_failed",
      error: "The family profile could not be loaded for export.",
    };
  }

  if (!profileResponse.data) {
    profileResponse = await client
      .from("family_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
  }

  if (profileResponse.error) {
    return {
      ok: false as const,
      status: 500,
      code: "profile_load_failed",
      error: "The family profile could not be loaded for export.",
    };
  }

  if (!profileResponse.data) {
    return {
      ok: false as const,
      status: 403,
      code: "profile_missing",
      error: "No family profile is available for this account.",
    };
  }

  const reportResponse = await client
    .from("report_documents")
    .select("*")
    .eq("id", reportDocumentId)
    .maybeSingle();

  if (reportResponse.error) {
    return {
      ok: false as const,
      status: 500,
      code: "report_load_failed",
      error: "The report document could not be loaded for export.",
    };
  }

  if (!reportResponse.data) {
    return {
      ok: false as const,
      status: 404,
      code: "report_not_found",
      error: "Report document not found.",
    };
  }

  const reportRow = asObject(reportResponse.data);
  const ownerId = safe(reportRow.user_id);
  if (ownerId && ownerId !== user.id) {
    return {
      ok: false as const,
      status: 404,
      code: "report_not_found",
      error: "Report document not found.",
    };
  }

  const learnerId = safe(reportRow.student_id) || safe(reportRow.learner_id);
  if (!learnerId) {
    return {
      ok: false as const,
      status: 409,
      code: "missing_learner",
      error: "The report document is missing learner context.",
    };
  }

  const learnerResponse = await client
    .from("students")
    .select("id,preferred_name,first_name,surname,year_level,year_band,curriculum_framework_id,curriculum_jurisdiction_id,reporting_mode,created_at,family_profile_id")
    .eq("id", learnerId)
    .maybeSingle();

  if (learnerResponse.error) {
    return {
      ok: false as const,
      status: 500,
      code: "learner_load_failed",
      error: "The learner context could not be loaded for export.",
    };
  }

  if (!learnerResponse.data) {
    return {
      ok: false as const,
      status: 403,
      code: "forbidden",
      error: "This report is not accessible from the current family workspace.",
    };
  }

  const profile = normalizeFamilyProfile(asObject(profileResponse.data));
  const learner = normalizeFamilyLearner(asObject(learnerResponse.data));
  const learnerFamilyId = safe(learnerResponse.data.family_profile_id);
  const reportOwnerId = safe(reportRow.user_id);
  if (learnerFamilyId && learnerFamilyId !== profile.id && reportOwnerId !== user.id) {
    return {
      ok: false as const,
      status: 403,
      code: "forbidden",
      error: "This report is not accessible from the current family workspace.",
    };
  }

  return {
    ok: true as const,
    client,
    userId: user.id,
    profile,
    learner,
    reportRow,
  };
}

export async function buildServerValidatedReportExport(input: {
  reportDocumentId: string;
  accessToken: string;
  mode?: "open" | "download";
}): Promise<ServerValidatedReportExportResult> {
  const reportDocumentId = safe(input.reportDocumentId);
  if (!reportDocumentId) {
    return {
      ok: false,
      status: 400,
      code: "missing_report_document_id",
      error: "A reportDocumentId query parameter is required.",
    };
  }

  const context = await loadAuthorizedReportExportContext(reportDocumentId, input.accessToken);
  if (!context.ok) {
    return context;
  }

  const preferredReportingPeriodId =
    safe(context.reportRow.reporting_period_id) ||
    safe(context.reportRow.reportingPeriodId) ||
    null;

  const model = await loadReportsBuilderModel({
    profile: context.profile,
    learner: context.learner,
    userId: context.userId,
    mode: "read",
    preferredDocumentId: reportDocumentId,
    preferredReportingPeriodId,
    client: context.client,
  });

  if (!model.reportDocument) {
    return {
      ok: false,
      status: 404,
      code: "report_not_found",
      error: "Report document not found.",
    };
  }

  const readiness = await loadReadinessForReportAssembly(context.learner.id, context.client);
  const assembly = await loadReportAssemblyWorkspace({
    model,
    readiness,
    client: context.client,
  });
  const mapping = await loadReportEvidenceMapping({
    model,
    client: context.client,
  });
  const autofill = await loadReportSectionAutofill({
    model,
    mapping,
    client: context.client,
  });
  const validation = buildReportCompletionValidation({
    model,
    readiness,
    assembly,
    mapping,
    autofill,
  });

  if (validation.status !== "ready_for_export") {
    return {
      ok: false,
      status: 409,
      code: "report_not_ready",
      error: validation.summary,
      validation,
      blockers: validation.blockers,
      warnings: validation.warnings,
      info: validation.info,
    };
  }

  const exportModel = buildReportExportModel({
    model,
    assembly,
    mapping,
    autofill,
    validation,
  });

  const html = generatePrintableHtml(exportModel);
  const filename = buildReportExportFilename(exportModel);

  return {
    ok: true,
    status: 200,
    filename,
    html,
    exportModel,
    validation,
  };
}

function buildSectionHtml(section: ReportExportSection) {
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <div class="section-kicker">Section</div>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <span class="section-status ${section.status}">${reportSectionStatusLabel(section.status)}</span>
      </div>
      <div class="section-body">
        ${section.contentHtml}
      </div>
      ${
        section.notes.length
          ? `<div class="section-notes">${section.notes.map((note) => `<div>${escapeHtml(note)}</div>`).join("")}</div>`
          : ""
      }
    </section>
  `;
}

export function buildReportExportModel(
  input: BuildReportExportModelInput,
): ReportExportModel {
  const reportTitle =
    safe(input.model.reportDocument?.title) ||
    `${safe(input.model.effectiveJurisdiction?.label) || "Reporting"} report`;

  const reportDocumentId =
    safe(input.model.reportDocument?.id) ||
    safe(input.validation.reportDocumentId) ||
    null;

  return {
    reportDocumentId,
    learnerId: safe(input.model.learner?.id),
    learnerName: safe(input.model.learner?.label) || "Learner",
    jurisdictionName:
      safe(input.model.effectiveJurisdiction?.label) ||
      input.validation.jurisdictionCode ||
      null,
    jurisdictionCode:
      input.model.effectiveJurisdiction?.code ||
      input.validation.jurisdictionCode ||
      null,
    reportingPeriodLabel: safe(input.model.reportingPeriod?.label) || null,
    reportTitle,
    generatedAt: new Date().toISOString(),
    gateStatus: input.validation.status,
    gateScore: input.validation.score,
    summary: input.validation.summary,
    nextAction: input.validation.nextAction,
    completedSectionCount: input.validation.completedSectionCount,
    totalSectionCount: input.validation.totalSectionCount,
    completedArtifactCount: input.validation.completedArtifactCount,
    totalArtifactCount: input.validation.totalArtifactCount,
    sections: input.assembly.sections.map((section) => ({
      sectionKey: normalizeSectionKey(section.title),
      title: section.title,
      status:
        input.validation.sectionStates.find(
          (item) => item.sectionKey === normalizeSectionKey(section.title),
        )?.status || "missing",
      contentHtml: sectionContentToHtml(section.contentPreview),
      notes:
        input.validation.sectionStates.find(
          (item) => item.sectionKey === normalizeSectionKey(section.title),
        )?.notes || [],
    })),
    artifacts: input.mapping.artifacts.map((artifact) => ({
      label: artifact.label,
      status: artifact.status,
      notes: artifact.notes,
    })),
    blockers: input.validation.blockers,
    warnings: input.validation.warnings,
    info: input.validation.info,
  };
}

export function generatePrintableHtml(model: ReportExportModel) {
  const blockerCount = model.blockers.length;
  const warningCount = model.warnings.length;
  const infoCount = model.info.length;
  const artifactRows = model.artifacts
    .map(
      (artifact) => `
        <div class="artifact-row ${artifact.status}">
          <div class="artifact-label">${escapeHtml(artifact.label)}</div>
          <div class="artifact-status">${reportSectionStatusLabel(artifact.status)}</div>
        </div>
      `,
    )
    .join("");

  const issueRows = (items: ReportCompletionValidation["blockers"], tone: "blocker" | "warning" | "info") =>
    items
      .map(
        (item) => `
          <div class="issue ${issueTone(tone)}">
            <div class="issue-label">${escapeHtml(item.label)}</div>
            <div class="issue-detail">${escapeHtml(item.detail)}</div>
          </div>
        `,
      )
      .join("");

  const sectionHtml = model.sections.map(buildSectionHtml).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(model.reportTitle)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #0f172a;
      --muted: #475569;
      --line: #dbe3ef;
      --soft: #f8fafc;
      --soft-blue: #eff6ff;
      --soft-amber: #fffbeb;
      --soft-rose: #fff1f2;
      --emerald: #166534;
      --amber: #92400e;
      --rose: #9f1239;
    }
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 860px;
      margin: 0 auto;
      padding: 24px 20px 40px;
    }
    .hero {
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 22px;
      background: linear-gradient(135deg, white 0%, #eff6ff 100%);
      display: grid;
      gap: 18px;
    }
    .title {
      margin: 0;
      font-size: 28px;
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .subtle {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 16px;
    }
    .meta {
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,0.8);
    }
    .meta .label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748b;
    }
    .meta .value {
      margin-top: 4px;
      font-size: 14px;
      font-weight: 700;
    }
    .status-band {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: start;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--soft);
    }
    .pill {
      display: inline-flex;
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      border: 1px solid var(--line);
    }
    .pill.blocked { background: var(--soft-rose); color: var(--rose); border-color: #fecdd3; }
    .pill.in_progress { background: var(--soft-amber); color: var(--amber); border-color: #fde68a; }
    .pill.ready_for_export { background: #ecfdf5; color: var(--emerald); border-color: #bbf7d0; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .metric {
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: white;
    }
    .metric .label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748b;
    }
    .metric .value {
      margin-top: 6px;
      font-size: 24px;
      font-weight: 800;
    }
    .panel {
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 18px;
      background: white;
      break-inside: avoid;
    }
    .panel h2,
    .section h2 {
      margin: 0;
      font-size: 18px;
      line-height: 1.25;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }
    .issue-list,
    .section-list {
      display: grid;
      gap: 10px;
    }
    .issue {
      border-radius: 14px;
      border: 1px solid var(--line);
      padding: 12px 14px;
      background: var(--soft);
    }
    .issue.blocker { background: var(--soft-rose); border-color: #fecdd3; }
    .issue.warning { background: var(--soft-amber); border-color: #fde68a; }
    .issue.info { background: var(--soft-blue); border-color: #bfdbfe; }
    .issue-label {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .issue-detail,
    .section-notes,
    .section-body,
    .report-empty {
      font-size: 13px;
      line-height: 1.7;
      color: var(--muted);
    }
    .section {
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 18px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .section-kicker {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .section-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      border: 1px solid var(--line);
      white-space: nowrap;
    }
    .section-status.complete { background: #ecfdf5; color: var(--emerald); border-color: #bbf7d0; }
    .section-status.in_progress { background: var(--soft-amber); color: var(--amber); border-color: #fde68a; }
    .section-status.missing { background: var(--soft); color: #475569; }
    .section-body p {
      margin: 0 0 10px;
    }
    .section-body ul {
      margin: 0 0 12px 18px;
      padding: 0;
    }
    .section-body li {
      margin: 0 0 6px;
    }
    .report-starter-block {
      margin-bottom: 12px;
    }
    .report-starter-block h4 {
      margin: 0 0 8px;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 800;
      color: var(--ink);
    }
    .section-notes {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed var(--line);
      display: grid;
      gap: 6px;
    }
    .artifact-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: white;
    }
    .artifact-row + .artifact-row {
      margin-top: 8px;
    }
    .artifact-label {
      font-size: 13px;
      font-weight: 700;
    }
    .artifact-status {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748b;
    }
    .footer {
      margin-top: 18px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      .page { padding: 0; }
      .hero, .panel, .section { box-shadow: none; }
      .section, .panel { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div>
        <h1 class="title">${escapeHtml(model.reportTitle)}</h1>
        <div class="subtle">
          Generated from the saved report draft only after completion validation passed.
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta">
          <div class="label">Learner</div>
          <div class="value">${escapeHtml(model.learnerName)}</div>
        </div>
        <div class="meta">
          <div class="label">Jurisdiction</div>
          <div class="value">${escapeHtml(model.jurisdictionName || model.jurisdictionCode || "Not resolved")}</div>
        </div>
        <div class="meta">
          <div class="label">Reporting period</div>
          <div class="value">${escapeHtml(model.reportingPeriodLabel || "Not available")}</div>
        </div>
        <div class="meta">
          <div class="label">Generated</div>
          <div class="value">${escapeHtml(new Date(model.generatedAt).toLocaleString())}</div>
        </div>
      </div>

      <div class="status-band">
        <div>
          <div class="label" style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Export gate</div>
          <div style="font-size:18px;font-weight:800;margin-bottom:6px;">${escapeHtml(model.summary)}</div>
          <div class="subtle">Next action: ${escapeHtml(model.nextAction || "Continue strengthening the draft")}</div>
        </div>
        <div class="pill ${model.gateStatus}">${escapeHtml(model.gateStatus.replace("_", " "))}</div>
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="label">Sections</div>
          <div class="value">${model.completedSectionCount}/${model.totalSectionCount || 0}</div>
        </div>
        <div class="metric">
          <div class="label">Artifacts</div>
          <div class="value">${model.completedArtifactCount}/${model.totalArtifactCount || 0}</div>
        </div>
        <div class="metric">
          <div class="label">Gate score</div>
          <div class="value">${model.gateScore}</div>
        </div>
        <div class="metric">
          <div class="label">Report ID</div>
          <div class="value" style="font-size:15px;line-height:1.4;word-break:break-word;">${escapeHtml(model.reportDocumentId || "Not available")}</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Validation snapshot</h2>
        <div class="subtle">${blockerCount} blocker${blockerCount === 1 ? "" : "s"}, ${warningCount} warning${warningCount === 1 ? "" : "s"}, ${infoCount} note${infoCount === 1 ? "" : "s"}</div>
      </div>

      <div class="issue-list">
        ${issueRows(model.blockers, "blocker")}
        ${issueRows(model.warnings, "warning")}
        ${issueRows(model.info, "info")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Required artifacts</h2>
        <div class="subtle">Current satisfaction state from the export gate</div>
      </div>
      <div class="issue-list">
        ${artifactRows || '<div class="issue info"><div class="issue-label">No artifact rows</div><div class="issue-detail">No required artifact list was available in the current draft context.</div></div>'}
      </div>
    </section>

    ${sectionHtml}

    <div class="footer">
      This printable export is generated from persisted draft content and is only available after validation passes.
    </div>
  </div>
</body>
</html>`;
}

export function buildReportExportFilename(model: ReportExportModel) {
  return buildExportFilename(model.reportTitle);
}

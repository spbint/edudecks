import type {
  ReportCompletionValidation,
  ReportValidationIssue,
} from "@/lib/reportCompletionGate";
import type { ReportAssemblyWorkspace } from "@/lib/reportAssembly";
import type { ReportEvidenceMapping } from "@/lib/reportEvidenceMapping";
import type { ReportSectionAutofillModel } from "@/lib/reportSectionAutofill";
import type { ReportsBuilderModel } from "@/lib/reporting";
import {
  recordReportExportEvent,
  type ReportExportFormat,
  type ReportExportHistoryEntry,
} from "@/lib/reportExportHistory";
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
import {
  loadReportsBuilderModel,
  reportIntentLabel,
  reportIntentSentence,
} from "@/lib/reporting";
import {
  buildPortfolioContentModel,
  classifyPortfolioSection,
} from "@/lib/portfolioContent";
import { reportIntentHeading } from "@/lib/reportTemplates";

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
  localeCode: string;
  reportIntent: "authority" | "portfolio";
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
  packItems: Array<{
    label: string;
    note: string;
  }>;
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

function sectionStatusClass(status: ReportExportSection["status"]) {
  if (status === "complete") return "complete";
  if (status === "in_progress") return "in_progress";
  return "missing";
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
  exportEvent: ReportExportHistoryEntry;
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

export type ServerValidatedReportExportPayload = {
  ok: true;
  client: ReturnType<typeof createServerSupabaseClient>;
  context: {
    userId: string;
    userDisplayName: string | null;
    familyId: string;
  };
  model: ReportsBuilderModel;
  exportModel: ReportExportModel;
  validation: ReportCompletionValidation;
};

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

  const profileResponse = await client
    .from("family_profiles")
    .select("*")
    .eq("user_id", user.id)
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

  const profile = normalizeFamilyProfile(asObject(profileResponse.data));
  const learner = normalizeFamilyLearner({
    id: learnerId,
    preferred_name:
      safe(reportRow.learner_name) ||
      safe(reportRow.student_name) ||
      safe(reportRow.child_name) ||
      "Learner",
    year_level: reportRow.year_level,
    created_at: reportRow.created_at,
  });

  return {
    ok: true as const,
    client,
    userId: user.id,
    userDisplayName:
      safe(user.user_metadata?.full_name) ||
      safe(user.user_metadata?.name) ||
      safe(user.email) ||
      null,
    profile,
    learner,
    reportRow,
  };
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildServerValidatedReportExport(input: {
  reportDocumentId: string;
  accessToken: string;
  mode?: "open" | "download";
}): Promise<ServerValidatedReportExportResult> {
  const payload = await buildServerValidatedReportExportPayload(input);
  if (!payload.ok) {
    return payload;
  }

  const html = generatePrintableHtml(payload.exportModel);
  const filename = buildReportExportFilename(payload.exportModel, "html");
  const contentHash = await sha256Hex(html);

  let exportEvent: ReportExportHistoryEntry;
  try {
    exportEvent = await recordValidatedReportExportEvent({
      payload,
      exportFormat: "html",
      filename,
      contentHash,
    });
  } catch {
    return {
      ok: false as const,
      status: 500,
      code: "export_history_write_failed",
      error: "The validated export could not be recorded for audit history.",
      validation: payload.validation,
    };
  }

  return {
    ok: true,
    status: 200,
    filename,
    html,
    exportModel: payload.exportModel,
    validation: payload.validation,
    exportEvent,
  };
}

export async function buildServerValidatedReportExportPayload(input: {
  reportDocumentId: string;
  accessToken: string;
}): Promise<ServerValidatedReportExportPayload | ServerValidatedReportExportFailure> {
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
  return {
    ok: true,
    client: context.client,
    context: {
      userId: context.userId,
      userDisplayName: context.userDisplayName,
      familyId: context.profile.id,
    },
    model,
    exportModel,
    validation,
  };
}

export async function recordValidatedReportExportEvent(input: {
  payload: ServerValidatedReportExportPayload;
  exportFormat: ReportExportFormat;
  filename: string;
  contentHash: string;
}) {
  return recordReportExportEvent(input.payload.client, {
    reportDocumentId:
      input.payload.exportModel.reportDocumentId ||
      input.payload.validation.reportDocumentId ||
      "",
    reportingPeriodId:
      input.payload.model.reportingPeriod?.id ||
      input.payload.validation.reportingPeriodId ||
      null,
    learnerId: input.payload.exportModel.learnerId,
    familyId: input.payload.context.familyId,
    jurisdictionCode: input.payload.exportModel.jurisdictionCode,
    exportFormat: input.exportFormat,
    exportPhase: "validated_server_export",
    exportedByUserId: input.payload.context.userId,
    exportedByDisplayName: input.payload.context.userDisplayName,
    validationStatus: input.payload.validation.status,
    validationScore: input.payload.validation.score,
    filename: input.filename,
    contentHash: input.contentHash,
    sectionCount: input.payload.exportModel.sections.length,
  });
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
  const learnerName = safe(input.model.learner?.label) || "Learner";
  const reportTitle =
    input.model.reportIntent === "portfolio"
      ? `${learnerName} Learning Portfolio`
      : safe(input.model.reportDocument?.title) ||
        `${safe(input.model.effectiveJurisdiction?.label) || "Reporting"} ${reportIntentHeading(input.model.reportIntent)}`;

  const reportDocumentId =
    safe(input.model.reportDocument?.id) ||
    safe(input.validation.reportDocumentId) ||
    null;

  return {
    reportDocumentId,
    learnerId: safe(input.model.learner?.id),
    learnerName,
    jurisdictionName:
      safe(input.model.effectiveJurisdiction?.label) ||
      input.validation.jurisdictionCode ||
      null,
    jurisdictionCode:
      input.model.effectiveJurisdiction?.code ||
      input.validation.jurisdictionCode ||
      null,
    localeCode:
      safe(input.model.reportDocument?.localeCode) ||
      safe(input.model.ruleSet?.localeCode) ||
      safe(input.model.effectiveJurisdiction?.localeCode) ||
      "en-AU",
    reportIntent: input.model.reportIntent,
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
    packItems: input.assembly.packItems.map((item) => ({
      label: item.label,
      note: item.note,
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
  return model.reportIntent === "portfolio"
    ? generatePortfolioPrintableHtml(model)
    : generateAuthorityPrintableHtml(model);
}

function generateAuthorityPrintableHtml(model: ReportExportModel) {
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

  const sectionHtml = model.sections.map(buildAuthoritySectionHtml).join("");

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
    .intent {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
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
        <div style="margin-top:10px;">
          <div class="intent">${escapeHtml(reportIntentLabel(model.reportIntent))}</div>
          <div class="subtle" style="margin-top:8px;">${escapeHtml(reportIntentSentence(model.reportIntent))}</div>
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

function buildAuthoritySectionHtml(section: ReportExportSection) {
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <div class="section-kicker">Section</div>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <span class="section-status ${sectionStatusClass(section.status)}">${reportSectionStatusLabel(section.status)}</span>
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

function stripHtml(value: string) {
  return safe(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptText(value: string, limit = 180) {
  const clean = stripHtml(value);
  if (!clean) return "";
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function formatGeneratedAt(value: string, localeCode: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(localeCode || "en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isUsLocale(model: ReportExportModel) {
  const locale = safe(model.localeCode).toLowerCase();
  const jurisdiction = safe(model.jurisdictionCode).toLowerCase();
  return locale.includes("en-us") || jurisdiction.startsWith("us-");
}

function isAuLocale(model: ReportExportModel) {
  const locale = safe(model.localeCode).toLowerCase();
  const jurisdiction = safe(model.jurisdictionCode).toLowerCase();
  return locale.includes("en-au") || jurisdiction.startsWith("au-");
}

function localizedPortfolioTerm(
  model: ReportExportModel,
  values: { us: string; au: string; fallback?: string },
) {
  if (isUsLocale(model)) return values.us;
  if (isAuLocale(model)) return values.au;
  return values.fallback || values.au;
}

function buildPortfolioSummaryCard(input: {
  title: string;
  body: string;
  eyebrow?: string;
}) {
  const eyebrow = safe(input.eyebrow);
  return `
    <article class="portfolio-summary-card">
      ${eyebrow ? `<div class="portfolio-summary-eyebrow">${escapeHtml(eyebrow)}</div>` : ""}
      <h3>${escapeHtml(input.title)}</h3>
      <p>${escapeHtml(input.body)}</p>
    </article>
  `;
}

function buildPortfolioSectionHtml(section: ReportExportSection) {
  const sectionType = classifyPortfolioSection({
    section_key: section.sectionKey,
    title: section.title,
  });
  const sectionClass =
    sectionType === "reflection"
      ? "reflection"
      : sectionType === "work_sample" || sectionType === "project"
        ? "samples"
        : sectionType === "highlight" || sectionType === "overview" || sectionType === "milestone"
          ? "highlight"
          : "default";

  return `
    <section class="portfolio-section portfolio-section-${sectionClass}">
      <div class="portfolio-section-head">
        <div>
          <div class="portfolio-section-kicker">${escapeHtml(reportSectionStatusLabel(section.status))}</div>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
      </div>
      <div class="portfolio-section-body">
        ${section.contentHtml}
      </div>
      ${
        section.notes.length
          ? `<div class="portfolio-section-notes">${section.notes.map((note) => `<div>${escapeHtml(note)}</div>`).join("")}</div>`
          : ""
      }
    </section>
  `;
}

function generatePortfolioPrintableHtml(model: ReportExportModel) {
  const generatedAtLabel = formatGeneratedAt(model.generatedAt, model.localeCode);
  const skillsLabel = localizedPortfolioTerm(model, {
    us: "Skills Practiced",
    au: "Skills Practised",
  });
  const mathsLabel = localizedPortfolioTerm(model, {
    us: "Math",
    au: "Maths",
  });
  const favouriteLabel = localizedPortfolioTerm(model, {
    us: "Favorite moments",
    au: "Favourite moments",
  });
  const contextLabel = model.reportingPeriodLabel || "Current learning record";
  const title = "Learning Portfolio";
  const portfolioContent = buildPortfolioContentModel({
    sections: model.sections.map((section) => ({
      id: section.sectionKey || section.title,
      section_key: section.sectionKey,
      title: section.title,
      contentHtml: section.contentHtml,
      learnerId: model.learnerId,
      reportDocumentId: model.reportDocumentId,
    })),
    packItems: model.packItems.map((item) => ({
      ...item,
      learnerId: model.learnerId,
      reportDocumentId: model.reportDocumentId,
    })),
    localeCode: model.localeCode,
  });
  const reflectionSections = model.sections.filter(
    (section) =>
      classifyPortfolioSection({
        section_key: section.sectionKey,
        title: section.title,
      }) === "reflection",
  );
  const resourceSections = model.sections.filter(
    (section) =>
      classifyPortfolioSection({
        section_key: section.sectionKey,
        title: section.title,
      }) === "resources",
  );

  const summaryCards: string[] = [];

  if (portfolioContent.highlights.length) {
    summaryCards.push(
      buildPortfolioSummaryCard({
        title: "Learning Highlights",
        body:
          portfolioContent.highlights[0]?.description ||
          "Saved highlights from this reporting period appear here.",
        eyebrow: favouriteLabel,
      }),
    );
  }

  if (portfolioContent.workSamples.length) {
    const sampleTitleList = portfolioContent.workSamples
      .slice(0, 4)
      .map((item) => item.title)
      .filter(Boolean);
    const workSampleBody =
      portfolioContent.workSamples[0]?.description ||
      `${portfolioContent.workSamples.length} saved sample${portfolioContent.workSamples.length === 1 ? "" : "s"}: ${sampleTitleList.join(", ")}${portfolioContent.workSamples.length > sampleTitleList.length ? ", and more" : ""}.`;
    summaryCards.push(
      buildPortfolioSummaryCard({
        title: "Projects and Work Samples",
        body: workSampleBody,
      }),
    );
  }

  if (portfolioContent.skills.length) {
    const topSkills = portfolioContent.skills
      .slice(0, 3)
      .map((item) => `${item.label} (${item.count})`)
      .join(", ");
    summaryCards.push(
      buildPortfolioSummaryCard({
        title: skillsLabel,
        body: topSkills || `${mathsLabel}, literacy, and broader learning areas are reflected in the saved portfolio sections.`,
      }),
    );
  }

  if (reflectionSections.length) {
    summaryCards.push(
      buildPortfolioSummaryCard({
        title: "Reflections and Memories",
        body:
          excerptText(reflectionSections[0]?.contentHtml || "") ||
          "Reflections, growth, and memorable learning moments are kept together here.",
      }),
    );
  }

  if (resourceSections.length) {
    summaryCards.push(
      buildPortfolioSummaryCard({
        title: "Books, Resources, and Field Trips",
        body:
          excerptText(resourceSections[0]?.contentHtml || "") ||
          "Saved references to books, resources, and outings are included in this record.",
      }),
    );
  }

  const workSamplePanel = portfolioContent.workSamples.length
    ? `
      <section class="portfolio-panel portfolio-panel-break">
        <div class="portfolio-panel-head">
          <div>
            <div class="portfolio-panel-kicker">Portfolio records</div>
            <h2>Projects and Work Samples</h2>
          </div>
          ${
            portfolioContent.workSamples.length
              ? `<div class="portfolio-count-pill">${portfolioContent.workSamples.length} saved item${portfolioContent.workSamples.length === 1 ? "" : "s"}</div>`
              : ""
          }
        </div>
        <div class="portfolio-panel-grid">
          ${portfolioContent.workSamples
            .map(
              (item) => `
                <article class="portfolio-section portfolio-section-samples">
                  <div class="portfolio-section-head">
                    <div>
                      <div class="portfolio-section-kicker">Work sample</div>
                      <h2>${escapeHtml(item.title)}</h2>
                    </div>
                  </div>
                  ${
                    item.subjectLabel || item.createdAt
                      ? `<div class="portfolio-chip-list">
                          ${item.subjectLabel ? `<span class="portfolio-chip">${escapeHtml(item.subjectLabel)}</span>` : ""}
                          ${item.createdAt ? `<span class="portfolio-chip">${escapeHtml(item.createdAt)}</span>` : ""}
                        </div>`
                      : ""
                  }
                  <div class="portfolio-section-body">
                    <p>${escapeHtml(item.description || "Saved work sample from the portfolio record.")}</p>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `
    : "";

  const skillsPanel = portfolioContent.skills.length
    ? `
      <section class="portfolio-panel">
        <div class="portfolio-panel-head">
          <div>
            <div class="portfolio-panel-kicker">Skills summary</div>
            <h2>${escapeHtml(skillsLabel)}</h2>
          </div>
          <div class="portfolio-count-pill">${portfolioContent.skills.length} skill area${portfolioContent.skills.length === 1 ? "" : "s"}</div>
        </div>
        <div class="portfolio-chip-list">
          ${portfolioContent.skills
            .map((item) => `<span class="portfolio-chip">${escapeHtml(item.label)} (${item.count})</span>`)
            .join("")}
        </div>
      </section>
    `
    : "";

  const reflectionPanel = reflectionSections.length || portfolioContent.reflections.length
    ? `
      <section class="portfolio-panel">
        <div class="portfolio-panel-head">
          <div>
            <div class="portfolio-panel-kicker">Family reflection</div>
            <h2>Reflections and Memories</h2>
          </div>
        </div>
        ${
          reflectionSections.length
            ? `<div class="portfolio-panel-grid">
                ${reflectionSections.map((section) => buildPortfolioSectionHtml(section)).join("")}
              </div>`
            : `<div class="portfolio-panel-grid">
                ${portfolioContent.reflections
                  .map(
                    (item) => `
                      <article class="portfolio-section portfolio-section-reflection">
                        <div class="portfolio-section-head">
                          <div>
                            <div class="portfolio-section-kicker">Reflection prompt</div>
                            <h2>${escapeHtml(item.prompt)}</h2>
                          </div>
                        </div>
                        <div class="portfolio-section-body">
                          <p>Use this prompt to preserve a meaningful family reflection in the saved portfolio record.</p>
                        </div>
                      </article>
                    `,
                  )
                  .join("")}
              </div>`
        }
      </section>
    `
    : "";

  const primarySectionHtml = model.sections.map((section) => buildPortfolioSectionHtml(section)).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(model.reportTitle)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #34261d;
      --muted: #72594b;
      --line: #e7d8c9;
      --card: #fffaf5;
      --card-strong: #fff4ea;
      --card-soft: #f9efe6;
      --rose: #fff2f1;
      --gold: #fff7e8;
      --sage: #edf5ed;
      --plum: #f8f1fb;
    }
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Georgia", "Times New Roman", serif;
      color: var(--ink);
      background: #fffdfb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .portfolio-page {
      max-width: 860px;
      margin: 0 auto;
      padding: 24px 20px 42px;
    }
    .portfolio-cover {
      border: 1px solid var(--line);
      border-radius: 28px;
      padding: 30px 28px;
      background:
        radial-gradient(circle at top left, rgba(255, 248, 236, 0.95), transparent 38%),
        linear-gradient(145deg, #fffdfb 0%, #fff4ea 54%, #fffaf4 100%);
      display: grid;
      gap: 22px;
      page-break-after: always;
    }
    .portfolio-cover-kicker,
    .portfolio-intro-kicker,
    .portfolio-panel-kicker,
    .portfolio-section-kicker,
    .portfolio-summary-eyebrow,
    .portfolio-meta-label {
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8b6f5d;
    }
    .portfolio-title {
      margin: 0;
      font-size: 40px;
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .portfolio-subtitle {
      margin: 0;
      font-size: 20px;
      line-height: 1.4;
      color: var(--muted);
    }
    .portfolio-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .portfolio-meta {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 14px 16px;
      background: rgba(255,255,255,0.74);
    }
    .portfolio-meta-value {
      margin-top: 6px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--ink);
    }
    .portfolio-context {
      border-top: 1px solid var(--line);
      padding-top: 18px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--muted);
    }
    .portfolio-intro {
      margin-top: 20px;
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 22px 22px 20px;
      background: var(--card);
      page-break-inside: avoid;
    }
    .portfolio-intro h2,
    .portfolio-panel h2,
    .portfolio-section h2 {
      margin: 0;
      font-size: 27px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .portfolio-intro p,
    .portfolio-section-body,
    .portfolio-section-body p,
    .portfolio-soft-note,
    .portfolio-footer {
      font-size: 15px;
      line-height: 1.8;
      color: var(--muted);
    }
    .portfolio-summary-grid,
    .portfolio-panel-grid,
    .portfolio-sections {
      display: grid;
      gap: 16px;
    }
    .portfolio-summary-grid {
      margin-top: 20px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .portfolio-summary-card {
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 18px;
      background: white;
      break-inside: avoid;
    }
    .portfolio-summary-card h3 {
      margin: 8px 0 8px;
      font-size: 20px;
      line-height: 1.2;
      font-weight: 700;
    }
    .portfolio-summary-card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.75;
      color: var(--muted);
    }
    .portfolio-panel {
      margin-top: 20px;
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 22px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,250,245,0.96) 100%);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .portfolio-panel-break {
      page-break-before: always;
    }
    .portfolio-panel-head {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .portfolio-count-pill {
      align-self: center;
      display: inline-flex;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: white;
      padding: 8px 12px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #7a6050;
    }
    .portfolio-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .portfolio-chip {
      display: inline-flex;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: #fffdfb;
      padding: 7px 11px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #7a6050;
    }
    .portfolio-section {
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 18px;
      background: white;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .portfolio-section-highlight { background: var(--card-strong); }
    .portfolio-section-samples { background: var(--gold); }
    .portfolio-section-reflection { background: var(--plum); }
    .portfolio-section-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .portfolio-section-body p { margin: 0 0 10px; }
    .portfolio-section-body ul {
      margin: 0 0 12px 18px;
      padding: 0;
    }
    .portfolio-section-body li { margin: 0 0 7px; }
    .portfolio-section-notes {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed var(--line);
      display: grid;
      gap: 6px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #7a6050;
    }
    .report-starter-block {
      margin-bottom: 12px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(203, 176, 150, 0.45);
      background: rgba(255,255,255,0.72);
    }
    .report-starter-block h4 {
      margin: 0 0 8px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 800;
      color: var(--ink);
    }
    .portfolio-soft-note {
      border: 1px dashed var(--line);
      border-radius: 18px;
      padding: 16px;
      background: rgba(255,255,255,0.6);
    }
    .portfolio-footer {
      margin-top: 22px;
      text-align: center;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 12px;
    }
    @media print {
      .portfolio-page { padding: 0; }
      .portfolio-cover, .portfolio-panel, .portfolio-section, .portfolio-summary-card, .portfolio-intro {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="portfolio-page">
    <section class="portfolio-cover">
      <div>
        <div class="portfolio-cover-kicker">Family documentation record</div>
        <h1 class="portfolio-title">${escapeHtml(title)}</h1>
        <p class="portfolio-subtitle">${escapeHtml(model.learnerName)} &middot; ${escapeHtml(contextLabel)}</p>
      </div>

      <div class="portfolio-meta-grid">
        <div class="portfolio-meta">
          <div class="portfolio-meta-label">Learner</div>
          <div class="portfolio-meta-value">${escapeHtml(model.learnerName)}</div>
        </div>
        <div class="portfolio-meta">
          <div class="portfolio-meta-label">Record period</div>
          <div class="portfolio-meta-value">${escapeHtml(model.reportingPeriodLabel || "Current learning record")}</div>
        </div>
        <div class="portfolio-meta">
          <div class="portfolio-meta-label">Context</div>
          <div class="portfolio-meta-value">${escapeHtml(model.jurisdictionName || model.jurisdictionCode || "Family learning context")}</div>
        </div>
        <div class="portfolio-meta">
          <div class="portfolio-meta-label">Saved on</div>
          <div class="portfolio-meta-value">${escapeHtml(generatedAtLabel)}</div>
        </div>
      </div>

      <div class="portfolio-context">
        <strong>A record of learning, growth, projects, and reflections.</strong>
        This print view brings together the saved portfolio sections for this learner in one warm, readable document for family records.
      </div>
    </section>

    <section class="portfolio-intro">
      <div class="portfolio-intro-kicker">Portfolio introduction</div>
      <h2>A record of learning, growth, projects, and reflections.</h2>
      <p>
        This learning portfolio is designed as a family-facing record. It keeps the learner's story, work, practiced skills, reflections, and memorable moments together without turning the document into a formal filing.
      </p>
    </section>

    ${
      summaryCards.length
        ? `<section class="portfolio-summary-grid">${summaryCards.join("")}</section>`
        : ""
    }

    ${workSamplePanel}
    ${skillsPanel}
    ${reflectionPanel}

    <section class="portfolio-panel">
      <div class="portfolio-panel-head">
        <div>
          <div class="portfolio-panel-kicker">Saved sections</div>
          <h2>Portfolio Sections</h2>
        </div>
        <div class="portfolio-count-pill">${model.sections.length} section${model.sections.length === 1 ? "" : "s"}</div>
      </div>
      <div class="portfolio-sections">
        ${primarySectionHtml}
      </div>
    </section>

    <div class="portfolio-footer">
      This portfolio print view is generated from the saved section content already stored in the workspace.
    </div>
  </div>
</body>
</html>`;
}

export function buildReportExportFilename(
  model: ReportExportModel,
  format: "html" | "docx" | "pdf" = "html",
) {
  const clean = safe(model.reportTitle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean || "report-export"}.${format}`;
}

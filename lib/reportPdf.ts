import { spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { CurriculumPreferences } from "@/lib/familySettings";
import { loadLearnerCurriculumPageData } from "@/lib/familyCurriculum";
import { loadReportSupportingEvidence } from "@/lib/familyEvidence";
import {
  getAuFormattingOverlay,
  buildCoverageExplanation,
  buildCurriculumCoverage,
  buildParentLanguageSummary,
  buildReportExportPackCopy,
  getReportComplianceContext,
  buildReportDocumentOverlay,
  formatEvidenceReference,
  reportSectionCopy,
} from "@/lib/reportPresentation";
import { marketLabel, modeLabel, periodLabel, type ReportDraftRow } from "@/lib/reportDrafts";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function escapeHtml(value: unknown) {
  return safe(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

function joinNatural(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function sanitizeFilename(value: string) {
  return safe(value)
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() || "report";
}

function resolveChromiumExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];

  return (
    candidates.find((candidate) => {
      try {
        return existsSync(candidate);
      } catch {
        return false;
      }
    }) ?? ""
  );
}

export function createReportPdfClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function loadCanonicalReportPdfData(input: {
  draftId: string;
  accessToken: string;
}) {
  const client = createReportPdfClient(input.accessToken);
  const userResponse = await client.auth.getUser(input.accessToken);
  if (userResponse.error || !userResponse.data.user?.id) {
    throw new Error("A valid signed-in session is required to export this report.");
  }

  const userId = userResponse.data.user.id;

  const familyProfileResponse = await client
    .from("family_profiles")
    .select("preferred_market")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (familyProfileResponse.error) {
    throw familyProfileResponse.error;
  }

  const draftResponse = await client
    .from("report_drafts")
    .select("*")
    .eq("id", input.draftId)
    .eq("user_id", userId)
    .maybeSingle();

  if (draftResponse.error) {
    throw draftResponse.error;
  }

  const draft = (draftResponse.data ?? null) as ReportDraftRow | null;
  if (!draft) {
    throw new Error("Report draft not found.");
  }

  const learnerId = safe(draft.student_id || draft.child_id);
  if (!learnerId) {
    throw new Error("No learner is attached to this draft.");
  }

  const familyPreferences: CurriculumPreferences = {
    country_id: null,
    region_id: null,
    framework_id: null,
    level_id: null,
    subject_ids: [],
  };

  const [curriculumData, supportingEvidence] = await Promise.all([
    loadLearnerCurriculumPageData({
      studentId: learnerId,
      familyPreferences,
      client,
    }),
    loadReportSupportingEvidence({
      evidenceIds: draft.selected_evidence_ids ?? [],
      studentId: learnerId,
      limit: Math.max((draft.selected_evidence_ids ?? []).length, 4),
      client,
    }),
  ]);

  const curriculumCoverage = buildCurriculumCoverage({
    selectedStudentId: learnerId,
    curriculumData,
  });

  const parentLanguage = buildParentLanguageSummary({
    selectedStudentId: learnerId,
    curriculumCoverage,
    studentEvidenceCount: (draft.selected_evidence_ids ?? []).length,
    selectedEvidenceCount: (draft.selected_evidence_ids ?? []).length,
    notesText: draft.notes ?? "",
    draftId: draft.id ?? "",
  });

  return {
    draft,
    learnerId,
    curriculumCoverage,
    parentLanguage,
    supportingEvidence,
    familyPreferences,
    preferredMarket:
      safe(draft.preferred_market) || safe(familyProfileResponse.data?.preferred_market) || "au",
  };
}

export function buildReportPdfHtml(data: Awaited<ReturnType<typeof loadCanonicalReportPdfData>>) {
  const {
    draft,
    curriculumCoverage,
    parentLanguage,
    supportingEvidence,
    preferredMarket,
    familyPreferences,
  } = data;
  const marketOverlay = buildReportDocumentOverlay(preferredMarket);
  const complianceContext = getReportComplianceContext({
    market: preferredMarket,
    curriculumPreferences: familyPreferences,
  });
  const auFormattingOverlay = getAuFormattingOverlay(complianceContext.state);
  const strongestAreas = curriculumCoverage.strongestAreas.slice(0, 3);
  const weakestAreas = curriculumCoverage.weakestAreas.slice(0, 3);
  const planningAheadAreas = curriculumCoverage.planningAheadAreas.slice(0, 3);
  const evidenceAheadAreas = curriculumCoverage.evidenceAheadAreas.slice(0, 3);
  const selectedEvidenceIds = draft.selected_evidence_ids ?? [];
  const selectedCoreCount = selectedEvidenceIds.filter(
    (id) => draft.selection_meta?.[id]?.role !== "appendix",
  ).length;
  const selectedAppendixCount = selectedEvidenceIds.filter(
    (id) => draft.selection_meta?.[id]?.role === "appendix",
  ).length;
  const hasMeaningfulCoverage =
    curriculumCoverage.ready &&
    (curriculumCoverage.plannedOutcomes > 0 || curriculumCoverage.linkedOutcomes > 0);
  const exportPackCopy = buildReportExportPackCopy({
    complianceContext,
    hasMeaningfulCoverage,
    selectedEvidenceCount: selectedEvidenceIds.length,
    selectedAreasCount: (draft.selected_areas ?? []).length,
    includeAppendix: Boolean(draft.include_appendix),
    supportingEvidenceCount: supportingEvidence.length,
  });
  const outputStatusLine = !selectedEvidenceIds.length
    ? "Building evidence base."
    : !hasMeaningfulCoverage
      ? "Picture still forming."
      : strongestAreas.length
        ? `Grounded summary with stronger coverage in ${joinNatural(strongestAreas.slice(0, 2))}.`
        : "Grounded summary with a clearer evidence base.";
  const evidenceBaseSummary = !selectedEvidenceIds.length
    ? "This draft is still forming around a very small evidence base."
    : hasMeaningfulCoverage
      ? `This summary currently draws on ${selectedEvidenceIds.length} selected evidence item${
          selectedEvidenceIds.length === 1 ? "" : "s"
        }, including ${selectedCoreCount} core anchor${
          selectedCoreCount === 1 ? "" : "s"
        } and ${selectedAppendixCount} appendix item${
          selectedAppendixCount === 1 ? "" : "s"
        }.`
      : `This draft currently includes ${selectedEvidenceIds.length} selected evidence item${
          selectedEvidenceIds.length === 1 ? "" : "s"
        }, with ${selectedCoreCount} core anchor${
          selectedCoreCount === 1 ? "" : "s"
        } and ${selectedAppendixCount} appendix item${
          selectedAppendixCount === 1 ? "" : "s"
        }.`;
  const overviewSupportNote = !selectedEvidenceIds.length
    ? "The learning picture is only just beginning. A few well-chosen examples will make the report easier to trust."
    : !hasMeaningfulCoverage
      ? "The story is starting to show, but a little more linked planning and evidence will make it clearer and steadier."
      : selectedCoreCount < 2
        ? "The learning story is visible now, and a couple of clear anchors will make it easier to follow."
        : "The current summary is grounded in visible evidence and curriculum links, so it reads as a connected picture rather than a loose set of notes.";
  const coverageInterpretationText = !curriculumCoverage.ready &&
    curriculumCoverage.reason === "no-curriculum"
    ? "Curriculum context is still being set up, so this section can only show an early picture of learning so far."
    : !curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes"
      ? "The curriculum path is chosen, but the outcome map is still taking shape. More structure here will make the report clearer."
      : !hasMeaningfulCoverage
        ? "This section is beginning to take shape. More linked planning and evidence will make the coverage picture clearer over time."
        : buildCoverageExplanation(curriculumCoverage);
  const strengthsSupportText = strongestAreas.length
    ? `Current evidence feels most settled in ${joinNatural(strongestAreas)}.`
    : hasMeaningfulCoverage
      ? "Some areas are starting to read as steadier than others, even if no single area is dominant yet."
      : "Strengths will read more clearly once a few more linked examples are in place.";
  const evidenceSummaryLead = !selectedEvidenceIds.length
    ? "The report is still waiting on a clearer evidence base before the learning story can feel settled."
    : !hasMeaningfulCoverage
      ? "The draft already has material to work from, though the overall picture is still modest and building."
      : "The selected evidence gives this report a clear base to read from, especially where the strongest anchors are already visible.";
  const nextStepsLead = !hasMeaningfulCoverage
    ? "The next useful step is to keep building the record gently so the report grows clearer from real examples."
    : parentLanguage.nextStep;
  const appendixLead = supportingEvidence.length
    ? "These records show the learning moments currently supporting the summary above."
    : "Supporting records will appear here as more linked evidence is added to the draft.";
  const furtherDevelopmentText = !curriculumCoverage.ready &&
    curriculumCoverage.reason === "no-curriculum"
    ? "This report is still waiting on curriculum context, so the learning picture can only stay broad for now."
    : !curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes"
      ? "The learner's curriculum path is chosen, but the outcomes for this level are still not in place yet."
      : curriculumCoverage.plannedOutcomes === 0 && curriculumCoverage.linkedOutcomes === 0
        ? "This report is still at an early stage. More linked planning and evidence will help the picture feel clearer and more useful."
        : "Planning is visible, though some parts of the report still need stronger evidence support to feel settled.";

  const evidenceItems = supportingEvidence.length
    ? supportingEvidence
        .map((item, index) => {
          const referenceLabel = formatEvidenceReference(index);
          const linkedOutcomes = item.linkedOutcomes.length
            ? `${complianceContext.isAU ? auFormattingOverlay.labelOverrides.outcomes : "Linked outcomes"}: ${escapeHtml(
                item.linkedOutcomes
                  .map((outcome) =>
                    outcome.outcomeCode
                      ? `${outcome.outcomeCode} ${outcome.outcomeLabel}`
                      : outcome.outcomeLabel,
                  )
                  .join(" | "),
              ).replace(/\s\|\s/g, " &bull; ")}`
            : "Outcome labels have not been linked here yet.";

          const attachmentLine =
            item.attachmentCount > 0
              ? `<div class="muted">${
                  escapeHtml(item.attachmentLabel || "Attachment available")
                }${
                  item.attachmentNames.length
                    ? `: ${escapeHtml(item.attachmentNames.join(", "))}`
                    : ""
                }</div>`
              : "";

          return `
            <article class="evidence-card">
              <div class="row spread">
                <div class="grow">
                  <div class="reference">${escapeHtml(referenceLabel)}</div>
                  <h3>${escapeHtml(item.title)}</h3>
                  <div class="muted">${escapeHtml(item.learningArea)} &bull; ${escapeHtml(shortDate(item.occurredOn))}</div>
                </div>
                <div class="badges">
                  ${
                    item.linkedOutcomes.length
                      ? `<span class="badge info">${item.linkedOutcomes.length} linked outcome${
                          item.linkedOutcomes.length === 1 ? "" : "s"
                        }</span>`
                      : ""
                  }
                  ${
                    item.attachmentCount > 0
                      ? `<span class="badge secondary">${item.attachmentCount} attachment${
                          item.attachmentCount === 1 ? "" : "s"
                        }</span>`
                      : ""
                  }
                </div>
              </div>
              <p>${escapeHtml(item.summary || "No written note was saved with this evidence item yet.")}</p>
              <div class="muted">${linkedOutcomes}</div>
              ${attachmentLine}
              <div class="muted strong">Reference: ${escapeHtml(referenceLabel)}</div>
            </article>
          `;
        })
        .join("")
    : `
      <div class="panel">
        <p>No supporting evidence has been linked to this report yet.</p>
        <div class="muted">Supporting records will appear here as more linked evidence is added to the draft.</div>
      </div>
    `;

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(safe(draft.title) || "Learning Report")}</title>
      <style>
        @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 13px;
          line-height: 1.6;
        }
        main { display: grid; gap: 18px; }
        .card {
          border: 1px solid #d7dee8;
          border-radius: 12px;
          padding: 18px;
          break-inside: avoid;
          page-break-inside: avoid;
          background: #ffffff;
        }
        .header { padding: 0; overflow: hidden; }
        .header-band { height: 4px; background: #cbd5e1; }
        .header-inner { padding: 22px; }
        .eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }
        h1 { margin: 0; font-size: 28px; line-height: 1.1; }
        h2 { margin: 0; font-size: 19px; }
        h3 { margin: 0; font-size: 15px; }
        p { margin: 10px 0 0; color: #475569; }
        .muted { color: #64748b; font-size: 12px; }
        .strong { font-weight: 800; }
        .summary-line { margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
        .document-note { margin-top: 10px; color: #475569; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .stat, .panel, .evidence-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #f8fafc;
          padding: 12px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .row { display: flex; gap: 12px; align-items: flex-start; }
        .spread { justify-content: space-between; flex-wrap: wrap; }
        .grow { min-width: 0; flex: 1; }
        .badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 11px;
          font-weight: 900;
        }
        .badge.info { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        .badge.secondary { background: #f8fafc; border-color: #e2e8f0; color: #475569; }
        .reference {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #0f172a;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .section-header { break-after: avoid; page-break-after: avoid; }
        .keep-with-next { break-after: avoid; page-break-after: avoid; }
      </style>
    </head>
    <body>
      <main>
        <section class="card header">
          <div class="header-band"></div>
          <div class="header-inner">
            <div class="eyebrow">${escapeHtml(marketOverlay.reportEyebrow)}</div>
            <h1>${escapeHtml(safe(draft.title) || "Learning Report")}</h1>
            <p>${escapeHtml(marketOverlay.reportSubtitle)}</p>
            ${
              complianceContext.isAU
                ? `<div class="muted document-note">${escapeHtml(
                    auFormattingOverlay.subtitle,
                  )}</div>`
                : ""
            }
            ${
              exportPackCopy
                ? `<div class="muted document-note">${escapeHtml(
                    exportPackCopy.headerFraming,
                  )}</div>`
                : ""
            }
            <div class="summary-line muted">
              ${escapeHtml(marketOverlay.preparedLinePrefix)} <strong style="color:#0f172a">${escapeHtml(safe(draft.child_name) || "Learner")}</strong> &bull;
              ${escapeHtml(modeLabel(draft.report_mode))} &bull;
              ${escapeHtml(periodLabel(draft.period_mode))}
            </div>
            <div class="document-note muted">${escapeHtml(outputStatusLine)}</div>
            <div class="grid-4">
              <div class="stat"><div class="eyebrow">Learner</div><div class="strong">${escapeHtml(safe(draft.child_name) || "Learner")}</div></div>
              <div class="stat"><div class="eyebrow">Report mode</div><div class="strong">${escapeHtml(modeLabel(draft.report_mode))}</div></div>
              <div class="stat"><div class="eyebrow">${escapeHtml(marketOverlay.periodLabel)}</div><div class="strong">${escapeHtml(periodLabel(draft.period_mode))}</div></div>
              <div class="stat"><div class="eyebrow">${escapeHtml(marketOverlay.marketLabelText)}</div><div class="strong">${escapeHtml(marketLabel(preferredMarket))}</div></div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div class="eyebrow">${escapeHtml(reportSectionCopy.overview.eyebrow)}</div>
            <h2>${escapeHtml(reportSectionCopy.overview.title)}</h2>
          </div>
          <p class="keep-with-next">${escapeHtml(parentLanguage.overall)}</p>
          ${
            exportPackCopy
              ? `<div class="panel keep-with-next"><div class="eyebrow">${escapeHtml(
                  exportPackCopy.includedHeading,
                )}</div><p>${escapeHtml(exportPackCopy.includedSummary)}</p></div>`
              : ""
          }
          <div class="panel keep-with-next">
            <div class="eyebrow">What this summary is drawing from</div>
            <p>${escapeHtml(evidenceBaseSummary)}</p>
            <div class="muted">${escapeHtml(overviewSupportNote)}</div>
          </div>
          ${
            safe(draft.notes)
              ? `<div class="panel"><div class="eyebrow">Family context note</div><p>${escapeHtml(draft.notes)}</p></div>`
              : ""
          }
        </section>

        <section class="card">
          <div class="section-header">
            <div class="eyebrow">${escapeHtml(reportSectionCopy.coverage.eyebrow)}</div>
            <h2>${escapeHtml(reportSectionCopy.coverage.title)}</h2>
          </div>
          <p>${escapeHtml(buildCoverageExplanation(curriculumCoverage))}</p>
          <div class="muted">${escapeHtml(marketOverlay.coverageNote)}</div>
          <div class="grid-4">
            <div class="stat"><div class="eyebrow">Outcomes planned</div><div class="strong">${curriculumCoverage.plannedOutcomes}</div></div>
            <div class="stat"><div class="eyebrow">Evidence-backed outcomes</div><div class="strong">${curriculumCoverage.linkedOutcomes}</div></div>
            <div class="stat"><div class="eyebrow">Planned and evidenced</div><div class="strong">${curriculumCoverage.plannedAndEvidencedOutcomes}</div></div>
            <div class="stat"><div class="eyebrow">Secure outcomes</div><div class="strong">${curriculumCoverage.secureOutcomes}</div></div>
          </div>
          <div class="panel keep-with-next">
            <div class="eyebrow">Current picture</div>
            <p>${escapeHtml(coverageInterpretationText)}</p>
          </div>
          <div class="grid-2">
            <div class="panel">
              <div class="eyebrow">${escapeHtml(reportSectionCopy.evidenceSummary.title)}</div>
              ${
                complianceContext.isAU
                  ? `<div class="muted">${escapeHtml(auFormattingOverlay.sectionIntro.evidence)}</div>`
                  : ""
              }
              <p>${escapeHtml(evidenceSummaryLead)}</p>
              <div class="muted">${escapeHtml(evidenceBaseSummary)}</div>
            </div>
            <div class="panel">
              <div class="eyebrow">${escapeHtml(reportSectionCopy.strengths.title)}</div>
              <p>${escapeHtml(parentLanguage.strengths)}</p>
              <div class="muted">${escapeHtml(
                strengthsSupportText,
              )}</div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div class="eyebrow">${escapeHtml(reportSectionCopy.nextSteps.eyebrow)}</div>
            <h2>${escapeHtml(reportSectionCopy.nextSteps.title)}</h2>
          </div>
          <p>${escapeHtml(nextStepsLead)}</p>
          <div class="grid-2">
            <div class="panel">
              <div class="eyebrow">Planning still ahead of evidence</div>
              <div class="muted">${escapeHtml(
                planningAheadAreas.length
                  ? joinNatural(planningAheadAreas)
                  : "No major planning gap is standing out right now.",
              )}</div>
            </div>
            <div class="panel">
              <div class="eyebrow">Evidence arriving ahead of planning</div>
              <div class="muted">${escapeHtml(
                evidenceAheadAreas.length
                  ? joinNatural(evidenceAheadAreas)
                  : weakestAreas.length
                    ? `Thinner areas currently include ${joinNatural(weakestAreas)}.`
                    : "Planning and evidence are reasonably aligned so far.",
              )}</div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div class="eyebrow">${escapeHtml(reportSectionCopy.appendix.eyebrow)}</div>
            <h2>${escapeHtml(reportSectionCopy.appendix.title)}</h2>
          </div>
          <p>${escapeHtml(marketOverlay.appendixIntro)}</p>
          ${
            complianceContext.isAU
              ? `<div class="muted">${escapeHtml(auFormattingOverlay.sectionIntro.appendix)}</div>`
              : ""
          }
          ${
            exportPackCopy
              ? `<div class="muted">${escapeHtml(exportPackCopy.appendixFraming)}</div>`
              : ""
          }
          <div class="muted">${escapeHtml(appendixLead)}</div>
          ${evidenceItems}
        </section>

        ${
          (!curriculumCoverage.ready && curriculumCoverage.reason === "no-curriculum") ||
          (!curriculumCoverage.ready && curriculumCoverage.reason === "no-outcomes") ||
          (curriculumCoverage.ready &&
            curriculumCoverage.plannedOutcomes === 0 &&
            curriculumCoverage.linkedOutcomes === 0) ||
          (curriculumCoverage.ready && curriculumCoverage.linkedOutcomes === 0)
            ? `
        <section class="card">
          <div class="section-header">
            <div class="eyebrow">${escapeHtml(reportSectionCopy.furtherDevelopment.eyebrow)}</div>
            <h2>${escapeHtml(reportSectionCopy.furtherDevelopment.title)}</h2>
          </div>
          <p>${escapeHtml(furtherDevelopmentText)}</p>
        </section>`
            : ""
        }

        <section class="card">
          <div class="section-header">
            <div class="eyebrow">${escapeHtml(reportSectionCopy.end.eyebrow)}</div>
            <h2>${escapeHtml(reportSectionCopy.end.title)}</h2>
          </div>
          <p>${escapeHtml(marketOverlay.endNote)}</p>
          <div class="muted strong">${escapeHtml(exportPackCopy?.referenceLabel || "Reference")} ${escapeHtml(draft.id)}</div>
        </section>
      </main>
    </body>
  </html>`;
}

export async function renderReportPdf(html: string) {
  const browserPath = resolveChromiumExecutable();
  if (!browserPath) {
    throw new Error("A Chromium browser executable was not found for PDF export.");
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "edudecks-report-pdf-"));
  const htmlPath = path.join(tempDir, "report.html");
  const pdfPath = path.join(tempDir, "report.pdf");

  try {
    await fs.writeFile(htmlPath, html, "utf8");

    const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--allow-file-access-from-files",
      "--run-all-compositor-stages-before-draw",
      `--print-to-pdf=${pdfPath}`,
      "--print-to-pdf-no-header",
      fileUrl,
    ];

    const output = await new Promise<{ code: number | null; stderr: string }>(
      (resolve, reject) => {
        const child = spawn(browserPath, args, { windowsHide: true });
        let stderr = "";

        child.stderr.on("data", (chunk) => {
          stderr += String(chunk ?? "");
        });

        child.on("error", reject);
        child.on("close", (code) => resolve({ code, stderr }));
      },
    );

    if (output.code !== 0) {
      throw new Error(output.stderr || "Chromium failed to render the report PDF.");
    }

    return await fs.readFile(pdfPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function buildReportPdfFilename(draft: Pick<ReportDraftRow, "title">) {
  return `${sanitizeFilename(safe(draft.title) || "learning-report")}.pdf`;
}
